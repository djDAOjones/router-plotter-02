/**
 * Route Plotter v3 - Refactored Entry Point
 * Demonstrates modular architecture with separated concerns
 */

import { EventBus } from './core/EventBus.js';
import { AnimationState } from './models/AnimationState.js';
import { Waypoint } from './models/Waypoint.js';
import { AnimationEngine } from './services/AnimationEngine.js';
import { PathCalculator } from './services/PathCalculator.js';
import { CoordinateTransform } from './services/CoordinateTransform.js';
import { StorageService } from './services/StorageService.js';
import { RENDERING, ANIMATION, INTERACTION } from './config/constants.js';

/**
 * Main application controller - simplified version
 * Orchestrates all modules and services
 */
class RoutePlotterApp {
  constructor() {
    // Initialize core systems
    this.eventBus = new EventBus();
    this.storage = new StorageService();
    this.pathCalculator = new PathCalculator();
    this.coordinateTransform = new CoordinateTransform();
    this.animationEngine = new AnimationEngine(this.eventBus);
    
    // Data models
    this.waypoints = [];
    this.pathPoints = [];
    this.selectedWaypoint = null;
    
    // UI elements
    this.canvas = null;
    this.ctx = null;
    
    // State
    this.isInitialized = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    
    // Bind methods
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleCanvasMouseDown = this.handleCanvasMouseDown.bind(this);
    this.handleCanvasMouseMove = this.handleCanvasMouseMove.bind(this);
    this.handleCanvasMouseUp = this.handleCanvasMouseUp.bind(this);
    this.render = this.render.bind(this);
  }
  
  /**
   * Initialize the application
   */
  async init() {
    if (this.isInitialized) return;
    
    console.log('Initializing Route Plotter v3 (Refactored)...');
    
    // Get canvas element
    this.canvas = document.getElementById('canvas');
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    
    this.ctx = this.canvas.getContext('2d');
    
    // Setup canvas
    this.setupCanvas();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup module communication
    this.setupEventBus();
    
    // Load saved state
    await this.loadSavedState();
    
    // Start animation engine
    this.animationEngine.start(this.render);
    
    // Initial render
    this.render();
    
    this.isInitialized = true;
    console.log('Route Plotter initialized successfully');
  }
  
  /**
   * Setup canvas dimensions and coordinate system
   */
  setupCanvas() {
    const resize = () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      
      // Update coordinate transform
      this.coordinateTransform.setCanvasDimensions(
        this.canvas.width, 
        this.canvas.height
      );
      
      // Trigger render
      this.render();
    };
    
    window.addEventListener('resize', resize);
    resize();
  }
  
  /**
   * Setup DOM event listeners
   */
  setupEventListeners() {
    // Canvas events
    this.canvas.addEventListener('click', this.handleCanvasClick);
    this.canvas.addEventListener('mousedown', this.handleCanvasMouseDown);
    this.canvas.addEventListener('mousemove', this.handleCanvasMouseMove);
    this.canvas.addEventListener('mouseup', this.handleCanvasMouseUp);
    
    // Control buttons
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.animationEngine.togglePlayPause();
      });
    }
    
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearAll();
      });
    }
  }
  
  /**
   * Setup event bus subscriptions
   */
  setupEventBus() {
    // Animation events
    this.eventBus.on('animation:play', () => {
      console.log('Animation playing');
      this.updatePlayButton(true);
    });
    
    this.eventBus.on('animation:pause', () => {
      console.log('Animation paused');
      this.updatePlayButton(false);
    });
    
    this.eventBus.on('animation:complete', () => {
      console.log('Animation complete');
    });
    
    this.eventBus.on('animation:waypointWaitStart', (data) => {
      console.log(`Waiting at waypoint ${data.index} for ${data.duration}ms`);
    });
    
    // Waypoint events
    this.eventBus.on('waypoint:add', (waypoint) => {
      this.recalculatePath();
      this.autoSave();
    });
    
    this.eventBus.on('waypoint:update', (waypoint) => {
      this.recalculatePath();
      this.autoSave();
    });
    
    this.eventBus.on('waypoint:delete', (waypoint) => {
      this.recalculatePath();
      this.autoSave();
    });
  }
  
  /**
   * Handle canvas click event
   */
  handleCanvasClick(event) {
    if (this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Check if clicking on existing waypoint
    const waypoint = this.findWaypointAt(canvasX, canvasY);
    
    if (waypoint) {
      this.selectWaypoint(waypoint);
    } else {
      // Add new waypoint
      const isMajor = !event.shiftKey; // Shift+click for minor waypoints
      this.addWaypoint(canvasX, canvasY, isMajor);
    }
  }
  
  /**
   * Handle mouse down event
   */
  handleCanvasMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    const waypoint = this.findWaypointAt(canvasX, canvasY);
    
    if (waypoint) {
      this.isDragging = true;
      this.selectedWaypoint = waypoint;
      
      const wpCanvas = this.coordinateTransform.imageToCanvas(
        waypoint.imgX, 
        waypoint.imgY
      );
      
      this.dragOffset = {
        x: canvasX - wpCanvas.x,
        y: canvasY - wpCanvas.y
      };
      
      this.canvas.style.cursor = 'grabbing';
    }
  }
  
  /**
   * Handle mouse move event
   */
  handleCanvasMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    if (this.isDragging && this.selectedWaypoint) {
      // Update waypoint position
      const newPos = this.coordinateTransform.canvasToImage(
        canvasX - this.dragOffset.x,
        canvasY - this.dragOffset.y
      );
      
      this.selectedWaypoint.setPosition(newPos.x, newPos.y);
      this.recalculatePath();
      this.render();
    } else {
      // Update cursor based on hover
      const waypoint = this.findWaypointAt(canvasX, canvasY);
      this.canvas.style.cursor = waypoint ? 'grab' : 'crosshair';
    }
  }
  
  /**
   * Handle mouse up event
   */
  handleCanvasMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = 'crosshair';
      this.eventBus.emit('waypoint:update', this.selectedWaypoint);
    }
  }
  
  /**
   * Add a new waypoint
   */
  addWaypoint(canvasX, canvasY, isMajor = true) {
    const imgPos = this.coordinateTransform.canvasToImage(canvasX, canvasY);
    
    const waypoint = isMajor ? 
      Waypoint.createMajor(imgPos.x, imgPos.y) :
      Waypoint.createMinor(imgPos.x, imgPos.y);
    
    // Inherit properties from previous waypoint if exists
    if (this.waypoints.length > 0) {
      const previousWaypoint = this.waypoints[this.waypoints.length - 1];
      waypoint.segmentColor = previousWaypoint.segmentColor;
      waypoint.segmentWidth = previousWaypoint.segmentWidth;
      waypoint.segmentStyle = previousWaypoint.segmentStyle;
      waypoint.pathShape = previousWaypoint.pathShape;
    }
    
    this.waypoints.push(waypoint);
    this.eventBus.emit('waypoint:add', waypoint);
    
    console.log(`Added ${isMajor ? 'major' : 'minor'} waypoint at (${imgPos.x.toFixed(3)}, ${imgPos.y.toFixed(3)})`);
  }
  
  /**
   * Select a waypoint
   */
  selectWaypoint(waypoint) {
    this.selectedWaypoint = waypoint;
    this.eventBus.emit('waypoint:select', waypoint);
    console.log('Selected waypoint:', waypoint.id);
  }
  
  /**
   * Find waypoint at given canvas coordinates
   */
  findWaypointAt(canvasX, canvasY) {
    for (const waypoint of this.waypoints) {
      const wpCanvas = this.coordinateTransform.imageToCanvas(
        waypoint.imgX, 
        waypoint.imgY
      );
      
      const dx = canvasX - wpCanvas.x;
      const dy = canvasY - wpCanvas.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= RENDERING.WAYPOINT_HIT_RADIUS) {
        return waypoint;
      }
    }
    return null;
  }
  
  /**
   * Recalculate path through waypoints
   */
  recalculatePath() {
    if (this.waypoints.length < 2) {
      this.pathPoints = [];
      return;
    }
    
    // Convert waypoints to canvas coordinates
    const canvasWaypoints = this.waypoints.map(wp => {
      const pos = this.coordinateTransform.imageToCanvas(wp.imgX, wp.imgY);
      return {
        x: pos.x,
        y: pos.y,
        isMajor: wp.isMajor,
        pathShape: wp.pathShape
      };
    });
    
    // Calculate path
    this.pathPoints = this.pathCalculator.calculatePath(canvasWaypoints);
    
    // Update animation duration if needed
    if (this.animationEngine.getState().mode === 'constant-speed') {
      const pathLength = this.pathCalculator.calculatePathLength(this.pathPoints);
      const duration = this.animationEngine.calculateDurationFromSpeed(pathLength);
      this.animationEngine.setDuration(duration);
    }
  }
  
  /**
   * Render the canvas
   */
  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw path
    if (this.pathPoints.length > 0) {
      const progress = this.animationEngine.getProgress();
      const pointsToRender = Math.floor(this.pathPoints.length * progress);
      
      if (pointsToRender > 1) {
        ctx.strokeStyle = RENDERING.DEFAULT_PATH_COLOR;
        ctx.lineWidth = RENDERING.DEFAULT_PATH_THICKNESS;
        ctx.beginPath();
        
        for (let i = 0; i < pointsToRender; i++) {
          const point = this.pathPoints[i];
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        
        ctx.stroke();
      }
    }
    
    // Draw waypoints
    this.waypoints.forEach((waypoint) => {
      const pos = this.coordinateTransform.imageToCanvas(waypoint.imgX, waypoint.imgY);
      
      // Draw marker
      if (waypoint.isVisible()) {
        // White outline for visibility
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, waypoint.dotSize + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Colored dot
        ctx.fillStyle = waypoint.dotColor;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, waypoint.dotSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Selection indicator
        if (waypoint === this.selectedWaypoint) {
          ctx.strokeStyle = '#0066CC';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, waypoint.dotSize + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      // Draw label
      if (waypoint.hasLabel()) {
        ctx.fillStyle = '#333333';
        ctx.font = '14px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Background for readability
        const metrics = ctx.measureText(waypoint.label);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(
          pos.x + 10,
          pos.y - 8,
          metrics.width + 8,
          16
        );
        
        ctx.fillStyle = '#333333';
        ctx.fillText(waypoint.label, pos.x + 14, pos.y);
      }
    });
  }
  
  /**
   * Clear all waypoints and reset
   */
  clearAll() {
    this.waypoints = [];
    this.pathPoints = [];
    this.selectedWaypoint = null;
    this.animationEngine.reset();
    this.storage.clearAutoSave();
    this.render();
    console.log('Cleared all waypoints');
  }
  
  /**
   * Auto-save current state
   */
  autoSave() {
    const state = {
      waypoints: this.waypoints.map(wp => wp.toJSON()),
      timestamp: Date.now()
    };
    
    this.storage.autoSave(state);
  }
  
  /**
   * Load saved state
   */
  async loadSavedState() {
    const saved = this.storage.loadAutoSave();
    
    if (saved && saved.waypoints) {
      console.log('Loading saved state...');
      
      this.waypoints = saved.waypoints.map(data => Waypoint.fromJSON(data));
      this.recalculatePath();
      
      console.log(`Loaded ${this.waypoints.length} waypoints`);
    }
  }
  
  /**
   * Update play/pause button
   */
  updatePlayButton(isPlaying) {
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
      playBtn.textContent = isPlaying ? 'Pause' : 'Play';
    }
  }
  
  /**
   * Destroy the application
   */
  destroy() {
    // Remove event listeners
    this.canvas.removeEventListener('click', this.handleCanvasClick);
    this.canvas.removeEventListener('mousedown', this.handleCanvasMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleCanvasMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleCanvasMouseUp);
    
    // Destroy services
    this.animationEngine.destroy();
    this.eventBus.destroy();
    
    // Clear data
    this.waypoints = [];
    this.pathPoints = [];
    
    console.log('Route Plotter destroyed');
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new RoutePlotterApp();
  app.init().catch(error => {
    console.error('Failed to initialize Route Plotter:', error);
  });
  
  // Make app available globally for debugging
  window.routePlotterApp = app;
});
