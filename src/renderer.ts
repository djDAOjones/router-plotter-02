/**
 * Canvas rendering engine for Route Plotter v2.0
 */

import {
  Point,
  Waypoint,
  PathTrack,
  CameraTrack,
  LabelTrack,
  RenderContext,
  PathStyle,
  WaypointShape,
  PathHead,
  WaypointAnimation,
  Asset
} from './types';
import { CatmullRomSpline, distance, normalize, perpendicular, scale, add, radToDeg } from './geometry';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private baseImage: HTMLImageElement | null = null;
  private customHeadImage: HTMLImageElement | null = null;
  private renderScale = 1;
  private viewOffset: Point = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Create offscreen canvas for double buffering
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    
    // Set canvas size
    this.resize();
  }

  /**
   * Resize canvas to match display size
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    
    this.ctx.scale(dpr, dpr);
    this.offscreenCtx.scale(dpr, dpr);
  }

  /**
   * Load base image
   */
  async loadBaseImage(asset: Asset): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.baseImage = img;
        this.calculateViewTransform();
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      
      if (asset.data) {
        img.src = asset.data;
      } else if (asset.path) {
        img.src = asset.path;
      }
    });
  }

  /**
   * Calculate view transform to fit image
   */
  private calculateViewTransform(): void {
    if (!this.baseImage) return;
    
    const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
    
    const imageAspect = this.baseImage.width / this.baseImage.height;
    const canvasAspect = canvasWidth / canvasHeight;
    
    if (imageAspect > canvasAspect) {
      // Image is wider - fit by width
      this.renderScale = canvasWidth / this.baseImage.width;
    } else {
      // Image is taller - fit by height
      this.renderScale = canvasHeight / this.baseImage.height;
    }
    
    // Center the image
    const scaledWidth = this.baseImage.width * this.renderScale;
    const scaledHeight = this.baseImage.height * this.renderScale;
    
    this.viewOffset = {
      x: (canvasWidth - scaledWidth) / 2,
      y: (canvasHeight - scaledHeight) / 2
    };
  }

  /**
   * Main render function
   */
  render(
    pathTrack: PathTrack | null,
    cameraTrack: CameraTrack | null,
    labelTrack: LabelTrack | null,
    progress: number = 0,
    contrastOverlay: number = 0
  ): void {
    const ctx = this.offscreenCtx;
    const width = this.offscreenCanvas.width / (window.devicePixelRatio || 1);
    const height = this.offscreenCanvas.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    
    // Apply camera transform if available
    if (cameraTrack && cameraTrack.waypoints.length > 0) {
      this.applyCameraTransform(ctx, cameraTrack, progress);
    } else {
      // Apply default view transform
      ctx.translate(this.viewOffset.x, this.viewOffset.y);
      ctx.scale(this.renderScale, this.renderScale);
    }
    
    // Draw base image
    if (this.baseImage) {
      ctx.drawImage(this.baseImage, 0, 0, this.baseImage.width, this.baseImage.height);
    }
    
    // Apply contrast overlay
    if (contrastOverlay !== 0) {
      this.drawContrastOverlay(ctx, contrastOverlay);
    }
    
    // Draw path if available
    if (pathTrack && pathTrack.waypoints.length > 1) {
      if (pathTrack.maskMode) {
        this.drawMaskedPath(ctx, pathTrack, progress);
      } else {
        this.drawPath(ctx, pathTrack, progress);
      }
    }
    
    // Draw labels if available
    if (labelTrack && labelTrack.items.length > 0) {
      this.drawLabels(ctx, labelTrack, pathTrack, progress);
    }
    
    ctx.restore();
    
    // Copy to main canvas
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, width, height);
  }

  /**
   * Apply camera transform based on camera track
   */
  private applyCameraTransform(ctx: CanvasRenderingContext2D, cameraTrack: CameraTrack, progress: number): void {
    // Simplified camera implementation - interpolate between camera waypoints
    const waypoints = cameraTrack.waypoints;
    if (waypoints.length === 0) return;
    
    let cameraPos: Point;
    let zoom: number;
    
    if (waypoints.length === 1) {
      cameraPos = waypoints[0];
      zoom = waypoints[0].zoom;
    } else {
      // Find current segment
      const totalSegments = waypoints.length - 1;
      const currentSegment = Math.min(Math.floor(progress * totalSegments), totalSegments - 1);
      const segmentProgress = (progress * totalSegments) - currentSegment;
      
      const p1 = waypoints[currentSegment];
      const p2 = waypoints[currentSegment + 1];
      
      cameraPos = {
        x: p1.x + (p2.x - p1.x) * segmentProgress,
        y: p1.y + (p2.y - p1.y) * segmentProgress
      };
      zoom = p1.zoom + (p2.zoom - p1.zoom) * segmentProgress;
    }
    
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    
    // Apply zoom and center on camera position
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cameraPos.x, -cameraPos.y);
  }

  /**
   * Draw contrast overlay
   */
  private drawContrastOverlay(ctx: CanvasRenderingContext2D, value: number): void {
    if (!this.baseImage) return;
    
    ctx.save();
    
    const alpha = Math.abs(value) / 100;
    const color = value < 0 ? 'black' : 'white';
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.baseImage.width, this.baseImage.height);
    
    ctx.restore();
  }

  /**
   * Draw path with progress
   */
  private drawPath(ctx: CanvasRenderingContext2D, pathTrack: PathTrack, progress: number): void {
    const waypoints = pathTrack.waypoints;
    if (waypoints.length < 2) return;
    
    const style = pathTrack.style;
    const spline = new CatmullRomSpline(waypoints, pathTrack.smoothing);
    const totalLength = spline.getTotalLength();
    const currentLength = totalLength * progress;
    
    ctx.save();
    
    // Set path style
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Apply path style variant
    this.applyPathStyle(ctx, style.strokeVariant);
    
    // Draw the path up to current progress
    ctx.beginPath();
    
    const samples = Math.floor(currentLength / 2); // Sample every 2 pixels
    for (let i = 0; i <= samples; i++) {
      const dist = (i / samples) * currentLength;
      const point = spline.getPointAtDistance(dist);
      
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    
    ctx.stroke();
    
    // Draw waypoints
    this.drawWaypoints(ctx, waypoints, style.waypointShape, style.strokeColor, progress);
    
    // Draw waypoint animations
    if (style.waypointAnimation !== 'none') {
      this.drawWaypointAnimations(ctx, waypoints, style.waypointAnimation, progress);
    }
    
    // Draw path head
    if (progress > 0 && progress < 1 && style.pathHead !== 'none') {
      const headPos = spline.getPointAtDistance(currentLength);
      const angle = spline.getAngle(progress);
      this.drawPathHead(ctx, headPos, angle, style.pathHead, style.strokeColor);
    }
    
    ctx.restore();
  }

  /**
   * Draw masked path (reveal as it progresses)
   */
  private drawMaskedPath(ctx: CanvasRenderingContext2D, pathTrack: PathTrack, progress: number): void {
    // TODO: Implement masked path rendering
    // For now, just draw regular path
    this.drawPath(ctx, pathTrack, progress);
  }

  /**
   * Apply path style (solid, dashed, dots, squiggle)
   */
  private applyPathStyle(ctx: CanvasRenderingContext2D, style: PathStyle): void {
    switch (style) {
      case 'dashed':
        ctx.setLineDash([10, 5]);
        break;
      case 'dots':
        ctx.setLineDash([2, 8]);
        break;
      case 'squiggle':
        // TODO: Implement squiggle path
        ctx.setLineDash([5, 3, 2, 3]);
        break;
      default:
        ctx.setLineDash([]);
    }
  }

  /**
   * Draw waypoints
   */
  private drawWaypoints(
    ctx: CanvasRenderingContext2D,
    waypoints: Waypoint[],
    shape: WaypointShape,
    color: string,
    progress: number
  ): void {
    if (shape === 'none') return;
    
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Calculate how many waypoints to show based on progress
    const totalSegments = waypoints.filter(w => w.isMajor).length - 1;
    const currentSegment = Math.floor(progress * totalSegments);
    
    waypoints.forEach((waypoint, index) => {
      // Only draw waypoints that have been reached
      const waypointProgress = index / (waypoints.length - 1);
      if (waypointProgress > progress) return;
      
      const size = waypoint.isMajor ? 8 : 4;
      
      switch (shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(waypoint.x, waypoint.y, size, 0, Math.PI * 2);
          if (waypoint.isMajor) {
            ctx.fill();
          } else {
            ctx.stroke();
          }
          break;
        case 'square':
          if (waypoint.isMajor) {
            ctx.fillRect(waypoint.x - size, waypoint.y - size, size * 2, size * 2);
          } else {
            ctx.strokeRect(waypoint.x - size, waypoint.y - size, size * 2, size * 2);
          }
          break;
      }
    });
    
    ctx.restore();
  }

  /**
   * Draw waypoint animations
   */
  private drawWaypointAnimations(
    ctx: CanvasRenderingContext2D,
    waypoints: Waypoint[],
    animation: WaypointAnimation,
    progress: number
  ): void {
    // Find the most recently reached major waypoint
    const majorWaypoints = waypoints.filter(w => w.isMajor);
    const currentIndex = Math.floor(progress * (majorWaypoints.length - 1));
    
    if (currentIndex >= 0 && currentIndex < majorWaypoints.length) {
      const waypoint = majorWaypoints[currentIndex];
      const segmentProgress = (progress * (majorWaypoints.length - 1)) - currentIndex;
      
      // Only animate if we just reached this waypoint
      if (segmentProgress < 0.3) {
        const animProgress = segmentProgress / 0.3;
        
        ctx.save();
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 2;
        
        switch (animation) {
          case 'sonar':
            ctx.globalAlpha = 1 - animProgress;
            ctx.beginPath();
            ctx.arc(waypoint.x, waypoint.y, 20 * animProgress + 10, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'ring':
            const innerRadius = 8;
            const outerRadius = 8 + (20 * animProgress);
            
            ctx.beginPath();
            ctx.arc(waypoint.x, waypoint.y, outerRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            if (animProgress < 0.5) {
              ctx.fillStyle = 'white';
              ctx.globalAlpha = 1 - (animProgress * 2);
              ctx.beginPath();
              ctx.arc(waypoint.x, waypoint.y, innerRadius, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
        }
        
        ctx.restore();
      }
    }
  }

  /**
   * Draw path head (arrow, pulsing dot, etc.)
   */
  private drawPathHead(
    ctx: CanvasRenderingContext2D,
    position: Point,
    angle: number,
    headType: PathHead,
    color: string
  ): void {
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);
    
    switch (headType) {
      case 'arrow':
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'pulse-dot':
        const pulseScale = 1 + Math.sin(Date.now() / 200) * 0.2;
        ctx.fillStyle = color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 6 * pulseScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'custom':
        if (this.customHeadImage) {
          ctx.drawImage(
            this.customHeadImage,
            -this.customHeadImage.width / 2,
            -this.customHeadImage.height / 2
          );
        }
        break;
    }
    
    ctx.restore();
  }

  /**
   * Draw labels
   */
  private drawLabels(
    ctx: CanvasRenderingContext2D,
    labelTrack: LabelTrack,
    pathTrack: PathTrack | null,
    progress: number
  ): void {
    ctx.save();
    
    ctx.font = `${labelTrack.fontSize}px ${labelTrack.fontFamily}`;
    ctx.fillStyle = labelTrack.textColor;
    ctx.strokeStyle = labelTrack.backgroundColor;
    ctx.lineWidth = 4;
    
    labelTrack.items.forEach(label => {
      // Find associated waypoint
      if (!pathTrack) return;
      
      const waypoint = pathTrack.waypoints.find(w => w.id === label.waypointId);
      if (!waypoint) return;
      
      // Check if we've reached this waypoint
      const waypointIndex = pathTrack.waypoints.indexOf(waypoint);
      const waypointProgress = waypointIndex / (pathTrack.waypoints.length - 1);
      
      if (waypointProgress > progress) return;
      
      // Calculate label position based on anchor
      let labelX = waypoint.x;
      let labelY = waypoint.y;
      const padding = 20;
      
      switch (label.anchor) {
        case 'N':
          labelY -= padding;
          break;
        case 'S':
          labelY += padding;
          break;
        case 'E':
          labelX += padding;
          break;
        case 'W':
          labelX -= padding;
          break;
        case 'auto':
          // Simple auto-placement
          labelY -= padding;
          break;
      }
      
      // Apply label offset if specified
      if (label.offset) {
        labelX += label.offset.x;
        labelY += label.offset.y;
      }
      
      // Draw label background and text
      const metrics = ctx.measureText(label.text);
      const boxPadding = 8;
      
      ctx.fillStyle = labelTrack.backgroundColor;
      ctx.fillRect(
        labelX - metrics.width / 2 - boxPadding,
        labelY - labelTrack.fontSize / 2 - boxPadding,
        metrics.width + boxPadding * 2,
        labelTrack.fontSize + boxPadding * 2
      );
      
      ctx.fillStyle = labelTrack.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label.text, labelX, labelY);
    });
    
    ctx.restore();
  }

  /**
   * Convert canvas coordinates to image coordinates
   */
  canvasToImage(canvasPoint: Point): Point | null {
    if (!this.baseImage) return null;
    
    return {
      x: (canvasPoint.x - this.viewOffset.x) / this.renderScale,
      y: (canvasPoint.y - this.viewOffset.y) / this.renderScale
    };
  }

  /**
   * Convert image coordinates to canvas coordinates
   */
  imageToCanvas(imagePoint: Point): Point {
    return {
      x: imagePoint.x * this.renderScale + this.viewOffset.x,
      y: imagePoint.y * this.renderScale + this.viewOffset.y
    };
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, width, height);
  }

  /**
   * Get canvas as data URL
   */
  toDataURL(type = 'image/png', quality = 1): string {
    return this.canvas.toDataURL(type, quality);
  }

  /**
   * Get canvas as blob
   */
  toBlob(callback: (blob: Blob | null) => void, type = 'image/png', quality = 1): void {
    this.canvas.toBlob(callback, type, quality);
  }
}
