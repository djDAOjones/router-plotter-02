import type {
  RenderContext,
  Point2D,
  PathStyle,
  PathTrack,
  InterpolatedPath,
  CameraPoint,
  Label,
  AnimationState,
  ContrastOverlay,
} from '@/types';
import { CatmullRomSpline } from './geometry';

/**
 * Layer-based renderer for Route Plotter
 * Manages multiple rendering layers composited on a single canvas
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private baseImage: HTMLImageElement | null = null;
  private spline: CatmullRomSpline;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    this.ctx = ctx;
    this.pixelRatio = window.devicePixelRatio || 1;
    this.width = canvas.width;
    this.height = canvas.height;
    this.spline = new CatmullRomSpline();
    
    this.setupCanvas(canvas);
  }

  private setupCanvas(canvas: HTMLCanvasElement): void {
    // Set up high DPI canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * this.pixelRatio;
    canvas.height = rect.height * this.pixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Scale for high DPI
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    
    // Set default styles
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Clear the entire canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.width / this.pixelRatio, this.height / this.pixelRatio);
  }

  /**
   * Set the base image for the map/diagram
   */
  setBaseImage(image: HTMLImageElement): void {
    this.baseImage = image;
  }

  /**
   * Main render function - composites all layers
   */
  render(state: AnimationState, context: any): void {
    this.clear();
    
    // Layer 1: Base image
    if (this.baseImage && context.showBaseImage) {
      this.renderBaseImage();
    }
    
    // Layer 2: Contrast overlay
    if (context.contrastOverlay && context.contrastOverlay.mode !== 'none') {
      this.renderContrastOverlay(context.contrastOverlay);
    }
    
    // Layer 3: Mask/unmask (if implemented)
    
    // Layer 4: Vector layer (paths and waypoints)
    if (context.path) {
      // Always render waypoints in edit mode, even without an interpolated path
      if (context.editMode) {
        this.renderWaypoints(context.path);
      }
      
      // Render the interpolated path if available
      if (context.interpolatedPath && context.interpolatedPath.points.length > 1) {
        this.renderPath(context.path, context.interpolatedPath, state);
      }
    }
    
    // Layer 5: Labels
    if (context.labels && context.labels.length > 0) {
      this.renderLabels(context.labels);
    }
    
    // Layer 6: Path head (arrow or dot at current position)
    if (context.path && context.interpolatedPath && state.pathPosition && state.normalizedProgress) {
      this.renderPathHead(
        state.pathPosition,
        context.interpolatedPath,
        context.path.style,
        state.normalizedProgress
      );
    }
    
    // Layer 7: UI handles (edit mode only)
    if (context.editMode && context.handles) {
      this.renderHandles(context.handles);
    }
  }

  /**
   * Render the base image layer
   */
  private renderBaseImage(): void {
    if (!this.baseImage) return;
    
    this.ctx.save();
    
    // Scale image to fit canvas while maintaining aspect ratio
    const imgAspect = this.baseImage.width / this.baseImage.height;
    const canvasAspect = this.width / this.height;
    
    let drawWidth = this.width / this.pixelRatio;
    let drawHeight = this.height / this.pixelRatio;
    let drawX = 0;
    let drawY = 0;
    
    if (imgAspect > canvasAspect) {
      drawHeight = drawWidth / imgAspect;
      drawY = (this.height / this.pixelRatio - drawHeight) / 2;
    } else {
      drawWidth = drawHeight * imgAspect;
      drawX = (this.width / this.pixelRatio - drawWidth) / 2;
    }
    
    this.ctx.drawImage(this.baseImage, drawX, drawY, drawWidth, drawHeight);
    this.ctx.restore();
  }

  /**
   * Render contrast overlay
   */
  private renderContrastOverlay(overlay: ContrastOverlay): void {
    this.ctx.save();
    
    const alpha = Math.abs(overlay.value);
    const color = overlay.mode === 'darken' ? 'black' : 'white';
    
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width / this.pixelRatio, this.height / this.pixelRatio);
    
    this.ctx.restore();
  }

  /**
   * Render the path with progress
   */
  private renderPath(
    track: PathTrack,
    interpolatedPath: InterpolatedPath | undefined,
    state: AnimationState
  ): void {
    if (!interpolatedPath || interpolatedPath.points.length < 2) return;
    
    this.ctx.save();
    
    // Set path style
    this.ctx.strokeStyle = track.style.strokeColor;
    this.ctx.lineWidth = track.style.strokeWidth;
    
    // Set stroke pattern
    if (track.style.strokeVariant === 'dashed') {
      this.ctx.setLineDash([10, 5]);
    } else if (track.style.strokeVariant === 'dotted') {
      this.ctx.setLineDash([2, 4]);
    }
    
    // Draw the path up to current progress
    const currentIndex = Math.floor(
      state.normalizedProgress * (interpolatedPath.points.length - 1)
    );
    
    this.ctx.beginPath();
    this.ctx.moveTo(interpolatedPath.points[0].x, interpolatedPath.points[0].y);
    
    for (let i = 1; i <= currentIndex && i < interpolatedPath.points.length; i++) {
      this.ctx.lineTo(interpolatedPath.points[i].x, interpolatedPath.points[i].y);
    }
    
    // Add partial segment for smooth animation
    if (currentIndex < interpolatedPath.points.length - 1 && state.pathPosition) {
      this.ctx.lineTo(state.pathPosition.x, state.pathPosition.y);
    }
    
    this.ctx.stroke();
    
    // Restore line dash
    this.ctx.setLineDash([]);
    
    // Draw waypoints
    this.renderWaypoints(track);
    
    this.ctx.restore();
  }

  /**
   * Render waypoint markers
   */
  private renderWaypoints(track: PathTrack): void {
    const shape = track.style.waypointShape;
    const size = 8;
    
    for (const waypoint of track.waypoints) {
      this.ctx.save();
      
      // Style based on major/minor
      if (waypoint.isMajor) {
        this.ctx.fillStyle = track.style.strokeColor;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
      } else {
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = track.style.strokeColor;
        this.ctx.lineWidth = 2;
      }
      
      // Draw shape
      this.ctx.beginPath();
      
      switch (shape) {
        case 'circle':
          this.ctx.arc(waypoint.x, waypoint.y, size / 2, 0, Math.PI * 2);
          break;
        
        case 'square':
          this.ctx.rect(
            waypoint.x - size / 2,
            waypoint.y - size / 2,
            size,
            size
          );
          break;
        
        case 'diamond':
          this.ctx.moveTo(waypoint.x, waypoint.y - size / 2);
          this.ctx.lineTo(waypoint.x + size / 2, waypoint.y);
          this.ctx.lineTo(waypoint.x, waypoint.y + size / 2);
          this.ctx.lineTo(waypoint.x - size / 2, waypoint.y);
          this.ctx.closePath();
          break;
      }
      
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  /**
   * Render the path head (arrow or dot)
   */
  private renderPathHead(
    position: Point2D,
    path: InterpolatedPath,
    style: PathStyle,
    progress: number
  ): void {
    if (style.pathHead === 'none') return;
    
    this.ctx.save();
    this.ctx.fillStyle = style.strokeColor;
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    
    if (style.pathHead === 'dot') {
      // Pulsing dot
      const baseSize = 6;
      const pulseSize = baseSize + Math.sin(Date.now() * 0.005) * 2;
      
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, pulseSize, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else if (style.pathHead === 'arrow') {
      // Arrow pointing in direction of travel
      const angle = this.spline.getTangentAtArcLength(
        path,
        this.spline.getArcLengthAtProgress(path, progress)
      );
      
      const arrowSize = 12;
      const arrowAngle = Math.PI / 6; // 30 degrees
      
      this.ctx.translate(position.x, position.y);
      this.ctx.rotate(angle);
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-arrowSize * Math.cos(arrowAngle), -arrowSize * Math.sin(arrowAngle));
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(-arrowSize * Math.cos(arrowAngle), arrowSize * Math.sin(arrowAngle));
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  /**
   * Render labels
   */
  private renderLabels(labels: Label[]): void {
    this.ctx.save();
    
    for (const label of labels) {
      // Default label style
      const fontSize = label.style?.fontSize || 14;
      const fontFamily = label.style?.fontFamily || 'Arial, sans-serif';
      const color = label.style?.color || '#000000';
      const bgColor = label.style?.backgroundColor || 'rgba(255, 255, 255, 0.9)';
      const padding = label.style?.padding || 4;
      const borderRadius = label.style?.borderRadius || 3;
      
      this.ctx.font = `${fontSize}px ${fontFamily}`;
      this.ctx.textBaseline = 'middle';
      this.ctx.textAlign = 'center';
      
      // Measure text
      const metrics = this.ctx.measureText(label.text);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      
      // Calculate label position based on anchor
      let labelX = label.position.x;
      let labelY = label.position.y;
      const offset = 15; // Offset from point
      
      switch (label.anchor) {
        case 'N':
          labelY -= offset + textHeight / 2 + padding;
          break;
        case 'S':
          labelY += offset + textHeight / 2 + padding;
          break;
        case 'E':
          labelX += offset + textWidth / 2 + padding;
          break;
        case 'W':
          labelX -= offset + textWidth / 2 + padding;
          break;
        case 'auto':
          // Simple auto placement (top by default)
          labelY -= offset + textHeight / 2 + padding;
          break;
      }
      
      // Draw background
      this.ctx.fillStyle = bgColor;
      this.roundRect(
        labelX - textWidth / 2 - padding,
        labelY - textHeight / 2 - padding,
        textWidth + padding * 2,
        textHeight + padding * 2,
        borderRadius
      );
      this.ctx.fill();
      
      // Draw text
      this.ctx.fillStyle = color;
      this.ctx.fillText(label.text, labelX, labelY);
    }
    
    this.ctx.restore();
  }

  /**
   * Render UI handles for editing
   */
  private renderHandles(handles: EditHandle[]): void {
    this.ctx.save();
    
    for (const handle of handles) {
      this.ctx.fillStyle = handle.selected ? '#FF6B6B' : '#4ECDC4';
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      
      this.ctx.beginPath();
      this.ctx.arc(handle.position.x, handle.position.y, handle.size || 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Draw connection lines if specified
      if (handle.connectedTo) {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(handle.position.x, handle.position.y);
        this.ctx.lineTo(handle.connectedTo.x, handle.connectedTo.y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
      }
    }
    
    this.ctx.restore();
  }

  /**
   * Helper: Draw rounded rectangle
   */
  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * Apply camera transform
   */
  applyCameraTransform(camera: CameraPoint): void {
    this.ctx.save();
    
    // Apply zoom and pan
    this.ctx.translate(
      this.width / (2 * this.pixelRatio),
      this.height / (2 * this.pixelRatio)
    );
    this.ctx.scale(camera.zoom, camera.zoom);
    this.ctx.translate(-camera.x, -camera.y);
  }

  /**
   * Reset camera transform
   */
  resetCameraTransform(): void {
    this.ctx.restore();
  }

  /**
   * Update canvas size
   */
  resize(width: number, height: number): void {
    const canvas = this.ctx.canvas;
    canvas.width = width * this.pixelRatio;
    canvas.height = height * this.pixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
}

// Type definitions for render layers
interface RenderLayers {
  showBaseImage: boolean;
  contrastOverlay?: ContrastOverlay;
  path?: PathTrack;
  interpolatedPath?: InterpolatedPath;
  labels?: Label[];
  editMode: boolean;
  handles?: EditHandle[];
}

interface EditHandle {
  position: Point2D;
  size?: number;
  selected: boolean;
  connectedTo?: Point2D;
  type: 'waypoint' | 'label' | 'camera';
  id: string;
}
