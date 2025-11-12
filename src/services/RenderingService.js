/**
 * RenderingService - Handles all canvas rendering operations
 * Extracted from main.js for better modularity
 */

import { RENDERING, INTERACTION } from '../config/constants.js';
import { Easing } from '../utils/Easing.js';

export class RenderingService {
  constructor() {
    this.vectorCanvas = null;
    this.waypointPositions = [];
  }

  /**
   * Main render method - orchestrates all rendering layers
   */
  render(ctx, displayWidth, displayHeight, state) {
    const cw = displayWidth || ctx.canvas.width;
    const ch = displayHeight || ctx.canvas.height;
    
    // Safety check - ensure canvas has valid dimensions
    if (cw <= 0 || ch <= 0) {
      console.warn('Cannot render to canvas with invalid dimensions:', { width: cw, height: ch });
      return; // Skip rendering
    }
    
    // Clear
    ctx.clearRect(0, 0, cw, ch);
    
    // 1) Base image
    this.renderBackground(ctx, state.background, cw, ch);
    
    // 2) Contrast overlay
    this.renderOverlay(ctx, state.background.overlay, cw, ch);
    
    // 3-6) Vector + head + UI handles on offscreen canvas
    const vCanvas = this.getVectorCanvas(displayWidth, displayHeight);
    
    // Safety check for vector canvas
    if (vCanvas.width <= 0 || vCanvas.height <= 0) {
      console.warn('Vector canvas has invalid dimensions:', { width: vCanvas.width, height: vCanvas.height });
      return; // Skip drawing vector layer
    }
    
    const vctx = vCanvas.getContext('2d');
    vctx.clearRect(0, 0, vCanvas.width, vCanvas.height);
    this.renderVectorLayerTo(vctx, state);
    
    // Safety check before drawing vector layer
    if (vCanvas.width > 0 && vCanvas.height > 0) {
      // Blit vector layer to main
      ctx.drawImage(vCanvas, 0, 0);
    }
  }

  /**
   * Get or create offscreen canvas for vector layer
   */
  getVectorCanvas(displayWidth, displayHeight) {
    if (!this.vectorCanvas) {
      this.vectorCanvas = document.createElement('canvas');
    }
    
    // Get canvas dimensions with safety checks
    const cw = displayWidth || 100; // Fallback to minimum size
    const ch = displayHeight || 100;
    
    // Ensure we have valid dimensions > 0
    const safeWidth = Math.max(1, cw);
    const safeHeight = Math.max(1, ch);
    
    // Only update if dimensions changed
    if (this.vectorCanvas.width !== safeWidth || this.vectorCanvas.height !== safeHeight) {
      console.log('Resizing vector canvas to:', safeWidth, 'x', safeHeight);
      this.vectorCanvas.width = safeWidth;
      this.vectorCanvas.height = safeHeight;
      
      // Disable smoothing on vector canvas too
      const vctx = this.vectorCanvas.getContext('2d');
      if (vctx) {
        vctx.imageSmoothingEnabled = false;
      }
    }
    
    return this.vectorCanvas;
  }
  
  /**
   * Render background image with fit/fill mode
   */
  renderBackground(ctx, background, canvasWidth, canvasHeight) {
    if (!background.image) return;
    
    const img = background.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cw = canvasWidth;
    const ch = canvasHeight;
    
    if (background.fit === 'fit') {
      // Fit: scale image to fit entirely within canvas (may have letterboxing)
      const scale = Math.min(cw / iw, ch / ih);
      const dw = Math.round(iw * scale);
      const dh = Math.round(ih * scale);
      const dx = Math.floor((cw - dw) / 2);
      const dy = Math.floor((ch - dh) / 2);
      // Draw entire source image scaled to fit
      ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
    } else {
      // Fill: enlarge so smaller dimension fills the canvas, center and crop
      const scale = Math.max(cw / iw, ch / ih);
      // Calculate which portion of source to show
      const sw = cw / scale;  // source width to show
      const sh = ch / scale;  // source height to show
      const sx = (iw - sw) / 2;  // center horizontally
      const sy = (ih - sh) / 2;  // center vertically
      // Draw cropped portion of source image to fill entire canvas
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    }
  }
  
  /**
   * Render overlay for contrast adjustment
   */
  renderOverlay(ctx, overlayValue, canvasWidth, canvasHeight) {
    if (overlayValue === 0) return;
    
    ctx.save();
    ctx.globalAlpha = Math.min(Math.abs(overlayValue) / 100, 0.6);
    ctx.fillStyle = overlayValue < 0 ? '#000' : '#fff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }

  /**
   * Render complete vector layer (paths, waypoints, labels)
   */
  renderVectorLayerTo(ctx, state) {
    const { waypoints, pathPoints, styles, animationEngine, selectedWaypoint, imageToCanvas, displayWidth, displayHeight } = state;
    
    // Render path if we have points
    if (pathPoints.length > 0 && waypoints.length > 1) {
      this.renderPath(ctx, pathPoints, waypoints, styles, animationEngine);
      this.renderPathHead(ctx, pathPoints, styles, animationEngine);
    }
    
    // Render beacons
    this.renderBeacons(ctx, waypoints, animationEngine, state.beaconAnimation, imageToCanvas, styles);
    
    // Render waypoint markers
    this.renderWaypoints(ctx, waypoints, selectedWaypoint, styles, imageToCanvas, displayWidth, displayHeight);
  }
  
  /**
   * Render the animated path
   */
  renderPath(ctx, pathPoints, waypoints, styles, animationEngine) {
    const totalPoints = pathPoints.length;
    const progress = animationEngine.getProgress();
    const pointsToRender = Math.floor(totalPoints * progress);
    const segments = waypoints.length - 1;
    const pointsPerSegment = Math.floor(totalPoints / segments);
    const controllerForSegment = new Array(segments);
    
    // Store exact waypoint positions in path points for later use in labels
    this.waypointPositions = [];
    waypoints.forEach((wp, index) => {
      if (index < waypoints.length - 1) {
        const exactPointIndex = (index / segments) * totalPoints;
        this.waypointPositions.push({
          waypointIndex: index,
          pointIndex: exactPointIndex
        });
      }
    });
    
    let lastMajorIdx = -1;
    for (let s = 0; s < segments; s++) {
      if (waypoints[s].isMajor) lastMajorIdx = s;
      controllerForSegment[s] = lastMajorIdx;
    }
    
    for (let i = 1; i < pointsToRender; i++) {
      const segmentIndex = Math.min(Math.floor(i / pointsPerSegment), segments - 1);
      const controllerIdx = controllerForSegment[segmentIndex];
      const controller = controllerIdx >= 0 ? waypoints[controllerIdx] : {
        segmentColor: styles.pathColor,
        segmentWidth: styles.pathThickness,
        segmentStyle: 'solid',
        pathShape: 'line'
      };
      
      ctx.strokeStyle = controller.segmentColor;
      ctx.lineWidth = controller.segmentWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      this.applyLineStyle(ctx, controller.segmentStyle);
      ctx.beginPath();
      
      const pathShape = controller.pathShape || 'line';
      const p1 = pathPoints[i - 1];
      const p2 = pathPoints[i];
      
      if (pathShape === 'squiggle') {
        // Create a wavy path using control points
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const perpX = -(p2.y - p1.y) * 0.15; // Perpendicular offset
        const perpY = (p2.x - p1.x) * 0.15;
        
        ctx.moveTo(p1.x, p1.y);
        const wave = Math.sin(i * 0.5) * 0.5;
        ctx.quadraticCurveTo(
          midX + perpX * wave, 
          midY + perpY * wave,
          p2.x, p2.y
        );
      } else if (pathShape === 'randomised') {
        // Add random jitter to the path
        const jitterAmount = 3;
        const jitteredP1 = {
          x: p1.x + (Math.random() - 0.5) * jitterAmount,
          y: p1.y + (Math.random() - 0.5) * jitterAmount
        };
        const jitteredP2 = {
          x: p2.x + (Math.random() - 0.5) * jitterAmount,
          y: p2.y + (Math.random() - 0.5) * jitterAmount
        };
        ctx.moveTo(jitteredP1.x, jitteredP1.y);
        ctx.lineTo(jitteredP2.x, jitteredP2.y);
      } else {
        // Default line
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  
  /**
   * Render the path head (animated marker)
   */
  renderPathHead(ctx, pathPoints, styles, animationEngine) {
    const progress = animationEngine.getProgress();
    const totalPoints = pathPoints.length;
    const pointsToRender = Math.floor(totalPoints * progress);
    
    if (pointsToRender > 1) {
      // Get the path head position
      const headIndex = Math.min(pointsToRender - 1, pathPoints.length - 1);
      const head = pathPoints[headIndex];
      
      // Calculate direction for rotation (based on previous point)
      let rotation = 0;
      if (headIndex > 0) {
        const prevPoint = pathPoints[headIndex - 1];
        rotation = Math.atan2(head.y - prevPoint.y, head.x - prevPoint.x);
      }
      
      // Store calculated rotation
      styles.pathHead.rotation = rotation;
      
      // Draw path head based on style
      this.drawPathHead(ctx, head.x, head.y, rotation, styles.pathHead);
    }
  }
  
  /**
   * Draw the path head based on current style settings
   */
  drawPathHead(ctx, x, y, rotation, pathHead) {
    // Safety check for valid coordinates
    if (!isFinite(x) || !isFinite(y)) {
      console.warn('Invalid path head coordinates:', {x, y});
      return;
    }
    
    const size = pathHead.size;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    switch (pathHead.style) {
      case 'dot':
        // Simple dot (filled circle)
        ctx.beginPath();
        ctx.fillStyle = pathHead.color;
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'arrow':
        // Arrow shape
        ctx.beginPath();
        ctx.fillStyle = pathHead.color;
        
        // Draw arrow pointing right (rotation will handle direction)
        ctx.moveTo(size, 0);            // Tip
        ctx.lineTo(-size/2, size/2);    // Bottom corner
        ctx.lineTo(-size/4, 0);         // Indentation
        ctx.lineTo(-size/2, -size/2);   // Top corner
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'custom':
        // Custom image
        if (pathHead.image) {
          const imgSize = size * 2; // Make image slightly larger for better visibility
          // Draw the image centered and rotated
          ctx.drawImage(
            pathHead.image, 
            -imgSize/2, -imgSize/2,
            imgSize, imgSize
          );
        } else {
          // Fallback to dot if no image loaded
          ctx.beginPath();
          ctx.fillStyle = pathHead.color;
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
        
      default:
        // Default to dot
        ctx.beginPath();
        ctx.fillStyle = pathHead.color;
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
  }
  
  /**
   * Render beacon effects at waypoints
   */
  renderBeacons(ctx, waypoints, animationEngine, beaconAnimation, imageToCanvas, styles) {
    if (!waypoints.length) return;
    
    const currentProgress = animationEngine.getProgress();
    
    waypoints.forEach((waypoint, wpIndex) => {
      if (waypoint.isMajor) {
        // Calculate normalized progress for this waypoint
        const exactWaypointProgress = wpIndex / (waypoints.length - 1);
        
        // Show beacon EXACTLY when we reach a waypoint (not after)
        // Use a small threshold to ensure reliable triggering
        const atWaypoint = Math.abs(currentProgress - exactWaypointProgress) < 0.001;
        
        // Show beacon exactly when paused at this waypoint
        const isPausedHere = animationEngine.state.isPaused && 
                            animationEngine.state.pauseWaypointIndex === wpIndex;
        
        // Show beacon when either exactly at waypoint or paused at it
        if (atWaypoint || isPausedHere) {
          // Convert waypoint to canvas coords for drawing beacon
          const wpCanvas = imageToCanvas(waypoint.imgX, waypoint.imgY);
          this.drawBeacon(ctx, { ...waypoint, x: wpCanvas.x, y: wpCanvas.y }, beaconAnimation, styles);
        }
      }
    });
  }
  
  /**
   * Draw beacon effect
   */
  drawBeacon(ctx, point, beaconAnimation, styles) {
    const bStyle = point.beaconStyle || 'none';
    const bColor = point.beaconColor || styles.beaconColor;
    if (bStyle === 'none') return;
    
    // Safety check for valid coordinates
    if (!isFinite(point.x) || !isFinite(point.y)) {
      console.warn('Invalid beacon coordinates:', point);
      return;
    }
    
    if (bStyle === 'pulse') {
      // Update pulse phase
      beaconAnimation.pulsePhase = performance.now() * 0.003;
      
      // Pulsing dot
      const pulse = 1 + Math.sin(beaconAnimation.pulsePhase) * 0.3;
      const pulseSize = RENDERING.BEACON_PULSE_SIZE * pulse;
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = bColor;
      ctx.globalAlpha = RENDERING.BEACON_PULSE_OPACITY;
      ctx.fill();
      
      // Update pulse animation state
      beaconAnimation.pulsePhase = (beaconAnimation.pulsePhase + 0.1) % (Math.PI * 2);
    } 
    else if (bStyle === 'ripple') {
      // Ripple effect - expanding circles that fade out
      const now = Date.now();
      
      // Add a new ripple every interval
      if (!point.lastRipple || now - point.lastRipple > RENDERING.BEACON_RIPPLE_INTERVAL) {
        beaconAnimation.ripples.push({
          x: point.x, 
          y: point.y, 
          radius: 0,
          opacity: 0.5,
          startTime: now,
          color: bColor
        });
        point.lastRipple = now;
      }
      
      // Draw all active ripples
      beaconAnimation.ripples = beaconAnimation.ripples.filter(ripple => {
        const age = now - ripple.startTime;
        if (age > RENDERING.BEACON_RIPPLE_DURATION) return false; // Remove old ripples
        
        // Calculate current radius with smooth fade-out
        const radius = age / RENDERING.BEACON_RIPPLE_SPEED;
        const fadeProgress = age / RENDERING.BEACON_RIPPLE_DURATION;
        const opacity = 0.5 * (1 - Easing.cubicOut(fadeProgress));
        
        // Draw ripple
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = ripple.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = opacity;
        ctx.stroke();
        
        return true;
      });
      
      // Draw center dot
      ctx.beginPath();
      ctx.fillStyle = bColor;
      ctx.globalAlpha = 0.8;
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Reset global alpha to prevent affecting subsequent draws
    ctx.globalAlpha = 1.0;
  }
  
  /**
   * Render waypoint markers
   */
  renderWaypoints(ctx, waypoints, selectedWaypoint, styles, imageToCanvas, displayWidth, displayHeight) {
    waypoints.forEach(waypoint => {
      if (waypoint.isMajor) {
        // Convert waypoint from image coords to canvas coords
        const wpCanvas = imageToCanvas(waypoint.imgX, waypoint.imgY);
        const isSelected = waypoint === selectedWaypoint;
        const markerSize = waypoint.dotSize || styles.dotSize;
        const size = isSelected ? markerSize * 1.3 : markerSize;
        const markerStyle = waypoint.markerStyle || styles.markerStyle;
        
        // Skip rendering if marker style is 'none'
        if (markerStyle === 'none') {
          this.renderLabel(ctx, waypoint, wpCanvas.x, wpCanvas.y, 0, waypoints, styles.animationEngine, displayWidth, displayHeight);
          return;
        }
        
        ctx.fillStyle = waypoint.dotColor || waypoint.segmentColor || styles.dotColor;
        ctx.strokeStyle = isSelected ? '#4a90e2' : 'white';
        ctx.lineWidth = isSelected ? 3 : 2;
        
        // Draw different marker types
        if (markerStyle === 'square') {
          // Square marker
          ctx.beginPath();
          ctx.rect(wpCanvas.x - size, wpCanvas.y - size, size * 2, size * 2);
          ctx.fill();
          ctx.stroke();
        } else if (markerStyle === 'flag') {
          // Flag marker
          ctx.beginPath();
          // Pole
          ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          ctx.lineTo(wpCanvas.x, wpCanvas.y + size);
          // Flag
          ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          ctx.lineTo(wpCanvas.x + size * 1.5, wpCanvas.y - size * 1.3);
          ctx.lineTo(wpCanvas.x + size * 1.2, wpCanvas.y - size);
          ctx.lineTo(wpCanvas.x, wpCanvas.y - size * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Default to dot
          ctx.beginPath();
          ctx.arc(wpCanvas.x, wpCanvas.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        
        // Draw labels for major waypoints
        this.renderLabel(ctx, waypoint, wpCanvas.x, wpCanvas.y, size, waypoints, styles.animationEngine, displayWidth, displayHeight);
      }
    });
  }
  
  /**
   * Render waypoint labels
   */
  renderLabel(ctx, waypoint, x, y, dotSize, waypoints, animationEngine, displayWidth, displayHeight) {
    // Skip if no label text or mode is 'none'
    if (!waypoint.label || waypoint.labelMode === 'none') return;
    
    // Find the true waypoint position in path coordinates
    const wpIndex = waypoints.indexOf(waypoint);
    const totalPoints = this.waypointPositions.length;
    
    // Get exact path position for this waypoint
    let waypointPointIndex = 0;
    if (wpIndex < waypoints.length - 1) {
      waypointPointIndex = (wpIndex / (waypoints.length - 1)) * totalPoints;
    } else {
      waypointPointIndex = totalPoints;
    }
    
    // Current animation position in path coordinates
    const exactCurrentPoint = totalPoints * animationEngine.getProgress();
    
    // Calculate animation timing parameters
    const fadeTimeInPoints = totalPoints * 0.02; // 1% of animation = 0.5 seconds
    let opacity = 0; // Start with zero opacity
    
    // Handle different label modes
    switch (waypoint.labelMode) {
      case 'on': 
        opacity = 1.0;
        break;
        
      case 'fade':
        if (exactCurrentPoint < waypointPointIndex) return;
        const elapsed = exactCurrentPoint - waypointPointIndex;
        
        if (elapsed <= fadeTimeInPoints / 2) {
          opacity = Math.min(1.0, elapsed / (fadeTimeInPoints / 2));
          opacity = Math.pow(opacity, 0.5);
        }
        else if (elapsed <= fadeTimeInPoints * 3) {
          opacity = 1.0;
        }
        else if (elapsed <= fadeTimeInPoints * 4) {
          opacity = 1.0 - Math.min(1.0, (elapsed - fadeTimeInPoints * 3) / fadeTimeInPoints);
        }
        else {
          return;
        }
        break;
        
      case 'persist':
        const timeBeforeWaypoint = waypointPointIndex - exactCurrentPoint;
        
        if (timeBeforeWaypoint > fadeTimeInPoints) return;
        
        if (timeBeforeWaypoint > 0) {
          const fadeProgress = 1.0 - (timeBeforeWaypoint / fadeTimeInPoints);
          opacity = Math.pow(fadeProgress, 0.5);
        }
        else {
          opacity = 1.0;
        }
        break;
        
      default:
        return;
    }
    
    // Save context for restoring later
    ctx.save();
    
    // Apply calculated opacity
    ctx.globalAlpha = Math.max(0.15, opacity);
    
    // Label style
    ctx.font = 'bold 16px Arial';
    
    const blueAmount = opacity < 1.0 ? Math.max(0, 1 - opacity) * 60 : 0;
    ctx.fillStyle = `rgb(${255-blueAmount}, ${255-blueAmount}, 255)`;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Calculate label position based on position setting
    const padding = RENDERING.LABEL_OFFSET_X;
    const position = waypoint.labelPosition || 'auto';
    let labelX = x;
    let labelY = y;
    
    // Adjust position based on setting
    switch (position) {
      case 'top':
        labelY = y - dotSize - padding;
        break;
      case 'right':
        labelX = x + dotSize + padding;
        ctx.textAlign = 'left';
        break;
      case 'bottom':
        labelY = y + dotSize + padding;
        break;
      case 'left':
        labelX = x - dotSize - padding;
        ctx.textAlign = 'right';
        break;
      case 'auto':
      default:
        const cw = displayWidth;
        const ch = displayHeight;
        
        labelY = y - dotSize - padding;
        
        if (labelY < 30) {
          labelY = y + dotSize + padding;
        }
        
        if (x < 100) {
          labelX = x + dotSize + padding;
          ctx.textAlign = 'left';
        } else if (x > cw - 100) {
          labelX = x - dotSize - padding;
          ctx.textAlign = 'right';
        }
        break;
    }
    
    // Draw text with outline for readability
    ctx.strokeText(waypoint.label, labelX, labelY);
    ctx.fillText(waypoint.label, labelX, labelY);
    
    // Restore context to clear shadow and alpha
    ctx.restore();
  }
  
  /**
   * Apply line style for path rendering
   */
  applyLineStyle(ctx, style) {
    switch (style) {
      case 'dotted':
        ctx.setLineDash([2, 6]);
        break;
      case 'dashed':
        ctx.setLineDash([10, 5]);
        break;
      case 'squiggle':
        // Approximated with dashed pattern - true squiggle would need complex path manipulation
        ctx.setLineDash([5, 3, 2, 3]);
        break;
      case 'solid':
      default:
        ctx.setLineDash([]);
        break;
    }
  }
}
