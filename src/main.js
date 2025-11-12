// Import modular utilities
import { CatmullRom } from './utils/CatmullRom.js';
import { Easing } from './utils/Easing.js';
import { RENDERING, ANIMATION, INTERACTION, PATH } from './config/constants.js';
import { StorageService } from './services/StorageService.js';
import { CoordinateTransform } from './services/CoordinateTransform.js';
import { PathCalculator } from './services/PathCalculator.js';

// Main application class for Route Plotter v3
class RoutePlotter {
  constructor() {
    // Services
    this.storageService = new StorageService();
    this.coordinateTransform = new CoordinateTransform();
    this.pathCalculator = new PathCalculator();
    
    // DOM Elements
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Waypoints and path data
    this.waypoints = [];
    this.pathPoints = [];
    this.selectedWaypoint = null;
    this.isDragging = false;
    this.hasDragged = false; // Track if mouse actually moved during drag
    this.dragOffset = { x: 0, y: 0 };
    
    // Animation state
    this.animationState = {
      isPlaying: false,
      progress: 0, // 0 to 1
      currentTime: 0, // in milliseconds
      duration: ANIMATION.DEFAULT_DURATION, // 5 seconds default
      mode: 'constant-speed', // or 'constant-time'
      speed: ANIMATION.DEFAULT_SPEED, // pixels per second
      playbackSpeed: 1, // multiplier for playback
      isPaused: false,        // Overall animation pause state (user-triggered)
      isWaitingAtWaypoint: false, // Separate flag for waypoint waiting
      pauseWaypointIndex: -1, // Current waypoint we're waiting at
      pauseStartTime: 0,      // When the wait began
      pauseEndTime: 0,        // When the wait should end
      waypointProgressSnapshot: 0 // Visual progress frozen during waypoint wait
    };
    
    // Style settings
    this.styles = {
      pathColor: '#FF6B6B',
      pathThickness: 3,
      pathStyle: 'solid', // solid, dashed, dotted
      pathShape: 'line', // line, squiggle, randomised
      markerStyle: 'dot', // dot, square, flag, none
      dotColor: '#FF6B6B',
      dotSize: RENDERING.DEFAULT_DOT_SIZE,
      beaconStyle: 'pulse', // none, pulse, ripple
      beaconColor: '#FF6B6B',
      labelMode: 'none', // none, on, fade, persist
      labelPosition: 'auto', // auto, top, right, bottom, left
      pathHead: {
        style: 'arrow', // dot, arrow, custom, none
        color: '#111111',
        size: 8,
        image: null, // For custom image
        rotation: 0 // Automatically calculated based on path direction
      }
    };
    
    // Beacon animation state
    this.beaconAnimation = {
      pulsePhase: 0,
      ripples: []
    };
    
    // Background layer state
    this.background = {
      image: null,
      overlay: 0,        // -100 (black) .. 0 (none) .. 100 (white)
      fit: 'fit'         // 'fit' | 'fill'
    };
    
    // Offscreen canvas for vector layer compositing
    this.vectorCanvas = null;
    
    // Label management
    this.labels = {
      active: [],       // Currently visible labels
      fadeTime: RENDERING.LABEL_FADE_TIME    // Fade duration in ms for 'fade' mode
    };
    
    // UI Elements
    this.elements = {
      canvas: document.getElementById('canvas'),
      waypoints: document.getElementById('waypoints-tab'),
      settings: document.getElementById('settings-tab'),
      tabBtns: document.querySelectorAll('.tab-btn'),
      waypointList: document.getElementById('waypoint-list'),
      bgUploadBtn: document.getElementById('bg-upload-btn'),
      bgUpload: document.getElementById('bg-upload'),
      bgOverlay: document.getElementById('bg-overlay'),
      bgOverlayValue: document.getElementById('bg-overlay-value'),
      bgFitToggle: document.getElementById('bg-fit-toggle'),
      playBtn: document.getElementById('play-btn'),
      pauseBtn: document.getElementById('pause-btn'),
      skipStartBtn: document.getElementById('skip-start-btn'),
      skipEndBtn: document.getElementById('skip-end-btn'),
      timelineSlider: document.getElementById('timeline-slider'),
      currentTime: document.getElementById('current-time'),
      totalTime: document.getElementById('total-time'),
      // animationMode: document.getElementById('animation-mode'), // Removed from UI
      animationSpeed: document.getElementById('animation-speed'),
      animationSpeedValue: document.getElementById('animation-speed-value'),
      // animationDuration: document.getElementById('animation-duration'), // Removed from UI
      // animationDurationValue: document.getElementById('animation-duration-value'), // Removed from UI
      speedControl: document.getElementById('speed-control'),
      // durationControl: document.getElementById('duration-control'), // Removed from UI
      waypointEditor: document.getElementById('waypoint-editor'),
      waypointEditorPlaceholder: document.getElementById('waypoint-editor-placeholder'),
      waypointPauseTime: document.getElementById('waypoint-pause-time'),
      waypointPauseTimeValue: document.getElementById('waypoint-pause-time-value'),
      pauseTimeControl: document.getElementById('pause-time-control'),
      splash: document.getElementById('splash'),
      splashClose: document.getElementById('splash-close'),
      splashDontShow: document.getElementById('splash-dont-show'),
      segmentColor: document.getElementById('segment-color'),
      segmentWidth: document.getElementById('segment-width'),
      segmentWidthValue: document.getElementById('segment-width-value'),
      segmentStyle: document.getElementById('segment-style'),
      dotColor: document.getElementById('dot-color'),
      dotSize: document.getElementById('dot-size'),
      dotSizeValue: document.getElementById('dot-size-value'),
      markerStyle: document.getElementById('marker-style'),
      pathShape: document.getElementById('path-shape'),
      editorBeaconStyle: document.getElementById('editor-beacon-style'),
      editorBeaconColor: document.getElementById('editor-beacon-color'),
      waypointLabel: document.getElementById('waypoint-label'),
      labelMode: document.getElementById('label-mode'),
      labelPosition: document.getElementById('label-position'),
      helpBtn: document.getElementById('help-btn'),
      clearBtn: document.getElementById('clear-btn'),
      announcer: document.getElementById('announcer'),
      // Path head elements
      pathHeadStyle: document.getElementById('path-head-style'),
      pathHeadColor: document.getElementById('path-head-color'),
      pathHeadSize: document.getElementById('path-head-size'),
      pathHeadSizeValue: document.getElementById('path-head-size-value'),
      customHeadControls: document.getElementById('custom-head-controls'),
      headUploadBtn: document.getElementById('head-upload-btn'),
      headUpload: document.getElementById('head-upload'),
      headPreview: document.getElementById('head-preview'),
      headFilename: document.getElementById('head-filename'),
      headPreviewImg: document.getElementById('head-preview-img')
    };
    
    this.init();
  }
  
  init() {
    // Set up canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Initialize marker style controls
    this.elements.markerStyle.value = this.styles.markerStyle;
    
    // Initialize path shape control
    this.elements.pathShape.value = this.styles.pathShape;
    
    // Initialize path head control values
    this.elements.pathHeadStyle.value = this.styles.pathHead.style;
    this.elements.pathHeadColor.value = this.styles.pathHead.color;
    this.elements.pathHeadSize.value = this.styles.pathHead.size;
    this.elements.pathHeadSizeValue.textContent = this.styles.pathHead.size;
    
    // Show/hide custom image controls based on initial style
    this.elements.customHeadControls.style.display = 
      this.styles.pathHead.style === 'custom' ? 'block' : 'none';
    
    // Initialize animation speed to show time
    const defaultDuration = this.animationState.duration / 1000;
    this.elements.animationSpeedValue.textContent = defaultDuration + 's';
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Show splash on first load
    if (this.storageService.shouldShowSplash()) {
      this.showSplash();
    }
    
    // Load autosave if present
    this.loadAutosave();
    
    // Load default image if no background image is present (for dev testing)
    if (!this.background.image) {
      this.loadDefaultImage();
    }
    
    // Initial render
    this.render();
    
    // Start animation loop (runs continuously for rendering)
    this.startRenderLoop();
    
    console.log('Route Plotter v3 initialized');
  }
  
  calculateAnimationDuration() {
    if (!this.pathPoints || this.pathPoints.length < 2) {
      return 5000; // Default 5 seconds if no path
    }
    
    // Calculate total path length in pixels
    let totalLength = 0;
    for (let i = 1; i < this.pathPoints.length; i++) {
      const p1 = this.pathPoints[i - 1];
      const p2 = this.pathPoints[i];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Calculate duration based on speed (pixels per second)
    const durationMs = (totalLength / this.animationState.speed) * 1000;
    this.animationState.duration = durationMs;
    return durationMs;
  }
  
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    
    // Controls panel is 80px tall and overlays the bottom of the canvas
    // We need to subtract this from the usable height
    const controlsHeight = RENDERING.CONTROLS_HEIGHT;
    
    // Use high DPI for better quality (aim for ~4K resolution)
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(dpr * 2, 3); // Cap at 3x for performance
    
    // Set canvas pixel dimensions (high resolution)
    this.canvas.width = rect.width * scale;
    this.canvas.height = rect.height * scale;
    
    // Store scale for rendering
    this.canvasScale = scale;
    
    // Scale context to match (this happens after canvas resize, so it's reset)
    this.ctx.scale(scale, scale);
    
    // Disable image smoothing for crisp rendering
    this.ctx.imageSmoothingEnabled = false;
    
    // Store the display dimensions for rendering calculations (CSS pixels)
    // Account for the controls panel overlay
    this.displayWidth = rect.width;
    this.displayHeight = rect.height - controlsHeight;
    
    // Update coordinate transform service with new canvas dimensions
    this.coordinateTransform.setCanvasDimensions(this.displayWidth, this.displayHeight);
    
    console.log('Canvas resized to:', rect.width, 'x', rect.height, 'at', scale + 'x scale', '(usable height:', this.displayHeight + ')');
    
    // Re-render after resize
    this.render();
  }
  
  setupEventListeners() {
    // Sidebar tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
      });
    });
    
    // Canvas events for waypoint interaction
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    // Drag & drop background image
    this.canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        this.loadImageFile(file).then((img) => {
          this.background.image = img;
          this.updateImageTransform(img);
          // Recalculate path with proper image bounds
          if (this.waypoints.length >= 2) {
            this.calculatePath();
          }
          this.render();
          this.autoSave();
          this.announce('Background image loaded');
        });
      }
    });
    
    // Header controls
    this.elements.helpBtn.addEventListener('click', () => this.showSplash());
    this.elements.clearBtn.addEventListener('click', () => this.clearAll());
    
    // Transport controls
    this.elements.playBtn.addEventListener('click', () => this.play());
    this.elements.pauseBtn.addEventListener('click', () => this.pause());
    this.elements.skipStartBtn.addEventListener('click', () => this.skipToStart());
    this.elements.skipEndBtn.addEventListener('click', () => this.skipToEnd());
    
    // Timeline slider
    this.elements.timelineSlider.addEventListener('input', (e) => {
      // Clear any waiting state when manually scrubbing
      this.animationState.isWaitingAtWaypoint = false;
      this.animationState.pauseWaypointIndex = -1;
      this.animationState.waypointProgressSnapshot = 0;
      
      // Update progress and time based on slider position
      this.animationState.progress = e.target.value / 1000;
      this.animationState.currentTime = this.animationState.progress * this.animationState.duration;
    });
    
    // Style controls
    
    // Waypoint editor controls
    this.elements.segmentColor.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.segmentColor = e.target.value;
        this.calculatePath();
        this.autoSave();
      }
    });
    
    this.elements.segmentWidth.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.segmentWidth = parseFloat(e.target.value);
        this.elements.segmentWidthValue.textContent = e.target.value;
        this.calculatePath();
        this.autoSave();
      }
    });
    
    this.elements.segmentStyle.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.segmentStyle = e.target.value;
        this.calculatePath();
        this.autoSave();
      }
    });
    
    // Path shape control (line, squiggle, randomised)
    this.elements.pathShape.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.pathShape = e.target.value;
        this.calculatePath();
        this.autoSave();
      }
    });
    
    // Marker style control (dot, square, flag, none)
    this.elements.markerStyle.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.markerStyle = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    
    // Dot color and size controls
    this.elements.dotColor.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.dotColor = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    
    // Per-waypoint beacon edits (only apply to major waypoints)
    this.elements.editorBeaconStyle.addEventListener('change', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.beaconStyle = e.target.value;
        if (this.selectedWaypoint.beaconStyle !== 'ripple') {
          this.beaconAnimation.ripples = [];
        }
        this.render();
        this.autoSave();
      }
    });
    this.elements.editorBeaconColor.addEventListener('input', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.beaconColor = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    
    // Label controls (only enabled for major waypoints)
    this.elements.waypointLabel.addEventListener('input', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.label = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    this.elements.labelMode.addEventListener('change', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.labelMode = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    this.elements.labelPosition.addEventListener('change', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.labelPosition = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    
    // Path Head Style Controls
    this.elements.pathHeadStyle.addEventListener('change', (e) => {
      this.styles.pathHead.style = e.target.value;
      
      // Show/hide custom image controls based on style selection
      this.elements.customHeadControls.style.display = 
        e.target.value === 'custom' ? 'block' : 'none';
      
      this.autoSave();
    });
    
    this.elements.pathHeadColor.addEventListener('input', (e) => {
      this.styles.pathHead.color = e.target.value;
      this.autoSave();
    });
    
    this.elements.pathHeadSize.addEventListener('input', (e) => {
      this.styles.pathHead.size = parseInt(e.target.value);
      this.elements.pathHeadSizeValue.textContent = e.target.value;
      this.autoSave();
    });
    
    // Custom Path Head Image Upload
    this.elements.headUploadBtn.addEventListener('click', () => {
      this.elements.headUpload.click();
    });
    
    this.elements.headUpload.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        // Load the image
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            // Store the image in the styles
            this.styles.pathHead.image = img;
            
            // Update preview
            this.elements.headPreview.style.display = 'block';
            this.elements.headFilename.textContent = file.name;
            this.elements.headPreviewImg.src = event.target.result;
            
            this.autoSave();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
    
    this.elements.dotSize.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.dotSize = parseInt(e.target.value);
        this.elements.dotSizeValue.textContent = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    
    // Splash screen
    this.elements.splashClose.addEventListener('click', () => this.hideSplash());
    this.elements.splash.addEventListener('click', (e) => {
      if (e.target === this.elements.splash) {
        this.hideSplash();
      }
    });
    
    // Always use constant-speed mode now (animation mode dropdown removed)
    
    // Animation speed/duration controls - always use constant speed
    this.elements.animationSpeed.addEventListener('input', (e) => {
      this.animationState.mode = 'constant-speed';
      this.animationState.speed = parseInt(e.target.value);
      
      // Calculate and display total duration
      if (this.pathPoints && this.pathPoints.length > 0) {
        const totalDuration = this.calculateAnimationDuration();
        const durationSec = Math.round(totalDuration / 100) / 10; // Round to 1 decimal place
        this.elements.animationSpeedValue.textContent = durationSec + 's';
      } else {
        this.elements.animationSpeedValue.textContent = '5s';
      }
      
      if (this.animationState.mode === 'constant-speed') {
        this.calculatePath();
      }
    });
    
    // Waypoint pause time (in waypoint editor)
    this.elements.waypointPauseTime.addEventListener('input', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        // Update the selected waypoint's pause time (in milliseconds)
        const pauseTimeSec = parseFloat(e.target.value);
        this.selectedWaypoint.pauseTime = pauseTimeSec * 1000;
        this.elements.waypointPauseTimeValue.textContent = pauseTimeSec + 's';
        
        // Automatically set pauseMode based on time value
        this.selectedWaypoint.pauseMode = pauseTimeSec > 0 ? 'timed' : 'none';
        
        this.autoSave();
      }
    });
    
    // Background controls
    this.elements.bgUploadBtn.addEventListener('click', () => this.elements.bgUpload.click());
    this.elements.bgUpload.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        this.loadImageFile(file).then((img) => {
          this.background.image = img;
          this.updateImageTransform(img);
          // Recalculate path with proper image bounds
          if (this.waypoints.length >= 2) {
            this.calculatePath();
          }
          this.render();
          this.autoSave();
          this.announce('Background image loaded');
        });
      }
    });
    this.elements.bgOverlay.addEventListener('input', (e) => {
      this.background.overlay = parseInt(e.target.value);
      this.elements.bgOverlayValue.textContent = e.target.value;
      this.render();
      this.autoSave();
    });
    // Toggle fit/fill button
    this.elements.bgFitToggle.addEventListener('click', (e) => {
      const currentMode = this.background.fit;
      const newMode = currentMode === 'fit' ? 'fill' : 'fit';
      this.background.fit = newMode;
      
      // Update coordinateTransform with new fit mode
      if (this.background.image) {
        this.updateImageTransform(this.background.image);
      }
      
      // Update button text and data attribute
      e.target.textContent = newMode === 'fit' ? 'Fit' : 'Fill';
      e.target.dataset.mode = newMode;
      
      console.log('Fit mode changed to:', newMode);
      // Recalculate path since waypoints need to be repositioned
      if (this.waypoints.length >= 2) {
        this.calculatePath();
      }
      this.render();
      this.autoSave();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const nudgeAmount = e.shiftKey ? 0.05 : 0.01; // 5% or 1%
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          if (this.animationState.isPlaying) {
            this.pause();
          } else {
            this.play();
          }
          break;
          
        case 'KeyJ': // 0.5x speed
          this.animationState.playbackSpeed = 0.5;
          break;
          
        case 'KeyK': // 1x speed
          this.animationState.playbackSpeed = 1;
          break;
          
        case 'KeyL': // 2x speed
          this.animationState.playbackSpeed = 2;
          break;
          
        case 'ArrowLeft':
          if (this.selectedWaypoint) {
            e.preventDefault();
            this.selectedWaypoint.x -= nudgeAmount * canvasWidth;
            this.calculatePath();
            this.updateWaypointList();
          }
          break;
          
        case 'ArrowRight':
          if (this.selectedWaypoint) {
            e.preventDefault();
            this.selectedWaypoint.x += nudgeAmount * canvasWidth;
            this.calculatePath();
            this.updateWaypointList();
          }
          break;
          
        case 'ArrowUp':
          if (this.selectedWaypoint) {
            e.preventDefault();
            this.selectedWaypoint.y -= nudgeAmount * canvasHeight;
            this.calculatePath();
            this.updateWaypointList();
          }
          break;
          
        case 'ArrowDown':
          if (this.selectedWaypoint) {
            e.preventDefault();
            this.selectedWaypoint.y += nudgeAmount * canvasHeight;
            this.calculatePath();
            this.updateWaypointList();
          }
          break;
          
        case 'Escape':
          if (this.isDragging) {
            this.isDragging = false;
            this.canvas.classList.remove('dragging');
          }
          this.selectedWaypoint = null;
          this.updateWaypointList();
          this.updateWaypointEditor();
          break;
      }
    });
  }
  
  handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on existing waypoint
    const clickedWaypoint = this.findWaypointAt(x, y);
    
    if (clickedWaypoint) {
      this.selectedWaypoint = clickedWaypoint;
      this.isDragging = true;
      this.hasDragged = false; // Reset drag flag
      // Store canvas offset for smooth dragging
      const wpCanvas = this.imageToCanvas(clickedWaypoint.imgX, clickedWaypoint.imgY);
      this.dragOffset.x = x - wpCanvas.x;
      this.dragOffset.y = y - wpCanvas.y;
      this.canvas.classList.add('dragging');
      this.updateWaypointList();
      event.preventDefault();
    }
  }
  
  handleMouseMove(event) {
    if (this.isDragging && this.selectedWaypoint) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Convert canvas position to image coordinates
      const canvasX = x - this.dragOffset.x;
      const canvasY = y - this.dragOffset.y;
      const imgPos = this.canvasToImage(canvasX, canvasY);
      this.selectedWaypoint.imgX = imgPos.x;
      this.selectedWaypoint.imgY = imgPos.y;
      this.hasDragged = true; // Mark that actual dragging occurred
      
      this.calculatePath();
    }
  }
  
  handleMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.classList.remove('dragging');
      this.updateWaypointList();
      // Save only if a drag actually happened
      if (this.hasDragged) {
        this.autoSave();
        this.hasDragged = false;
        this.announce('Waypoint moved');
      }
    }
  }
  
  handleCanvasClick(event) {
    // Don't add waypoint if we actually dragged
    if (this.hasDragged) {
      this.hasDragged = false; // Reset for next time
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on existing waypoint for selection
    const clickedWaypoint = this.findWaypointAt(x, y);
    if (clickedWaypoint) {
      this.selectedWaypoint = clickedWaypoint;
      this.updateWaypointList();
      this.updateWaypointEditor();
      return;
    }
    
    // Determine if major or minor waypoint
    const isMajor = !event.shiftKey;
    
    // Convert canvas coordinates to normalized image coordinates
    const imgPos = this.canvasToImage(x, y);
    
    // Inherit properties from previous waypoint, or use defaults
    const previousWaypoint = this.waypoints[this.waypoints.length - 1];
    const defaultProps = {
      segmentColor: this.styles.pathColor,
      segmentWidth: this.styles.pathThickness,
      segmentStyle: 'solid',
      pathShape: 'line',
      markerStyle: this.styles.markerStyle,
      dotColor: this.styles.dotColor,
      dotSize: this.styles.dotSize,
      beaconStyle: 'none',
      beaconColor: this.styles.beaconColor,
      labelMode: 'none',
      labelPosition: 'auto',
      pauseMode: 'none',
      pauseTime: 0,
      pathHeadStyle: this.styles.pathHead.style,
      pathHeadColor: this.styles.pathHead.color,
      pathHeadSize: this.styles.pathHead.size
    };
    
    // If there's a previous waypoint, inherit its properties
    const inheritedProps = previousWaypoint ? {
      segmentColor: previousWaypoint.segmentColor,
      segmentWidth: previousWaypoint.segmentWidth,
      segmentStyle: previousWaypoint.segmentStyle,
      pathShape: previousWaypoint.pathShape || 'line',
      markerStyle: previousWaypoint.markerStyle || this.styles.markerStyle,
      dotColor: previousWaypoint.dotColor,
      dotSize: previousWaypoint.dotSize,
      beaconStyle: isMajor ? (previousWaypoint.beaconStyle || this.styles.beaconStyle) : 'none',
      beaconColor: previousWaypoint.beaconColor || this.styles.beaconColor,
      label: isMajor ? `Waypoint ${this.waypoints.length + 1}` : '',
      labelMode: isMajor ? (previousWaypoint.labelMode || this.styles.labelMode) : 'none',
      labelPosition: previousWaypoint.labelPosition || this.styles.labelPosition,
      pauseMode: isMajor ? (previousWaypoint.pauseMode || 'none') : 'none',
      pauseTime: previousWaypoint.pauseTime || 0,
      pathHeadStyle: previousWaypoint.pathHeadStyle || this.styles.pathHead.style,
      pathHeadColor: previousWaypoint.pathHeadColor || this.styles.pathHead.color,
      pathHeadSize: previousWaypoint.pathHeadSize || this.styles.pathHead.size
    } : defaultProps;
    
    // Add waypoint
    this.waypoints.push({
      imgX: imgPos.x,
      imgY: imgPos.y,
      isMajor,
      id: Date.now(), // Unique ID for list management
      ...inheritedProps
    });
    
    // Recalculate path if we have enough waypoints
    if (this.waypoints.length >= 2) {
      this.calculatePath();
    }
    
    this.updateWaypointList();
    this.autoSave();
    this.announce(`${isMajor ? 'Major' : 'Minor'} waypoint added`);
    console.log(`Added ${isMajor ? 'major' : 'minor'} waypoint at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }
  
  findWaypointAt(x, y) {
    const threshold = INTERACTION.WAYPOINT_HIT_RADIUS; // pixels
    return this.waypoints.find(wp => {
      // Convert waypoint from image coords to canvas coords for comparison
      const wpCanvas = this.imageToCanvas(wp.imgX, wp.imgY);
      const dist = Math.sqrt(Math.pow(wpCanvas.x - x, 2) + Math.pow(wpCanvas.y - y, 2));
      return dist <= threshold;
    });
  }
  
  updateWaypointList() {
    this.elements.waypointList.innerHTML = '';
    
    // Only show major waypoints in the list
    const majorWaypoints = this.waypoints.filter(wp => wp.isMajor);
    
    majorWaypoints.forEach((waypoint, index) => {
      const item = document.createElement('div');
      item.className = 'waypoint-item';
      if (waypoint === this.selectedWaypoint) {
        item.classList.add('selected');
      }
      
      // Header row
      const handle = document.createElement('span');
      handle.className = 'waypoint-item-handle';
      handle.textContent = '☰';
      const label = document.createElement('span');
      label.className = 'waypoint-item-label';
      label.textContent = `Waypoint ${index + 1}`;
      const delBtn = document.createElement('button');
      delBtn.className = 'waypoint-item-delete';
      delBtn.textContent = '×';
      
      item.appendChild(handle);
      item.appendChild(label);
      item.appendChild(delBtn);
      
      // Selection by clicking header bits
      const selectWaypoint = (e) => {
        e.stopPropagation();
        this.selectedWaypoint = waypoint;
        this.updateWaypointList();
        this.updateWaypointEditor();
      };
      label.addEventListener('click', selectWaypoint);
      handle.addEventListener('click', selectWaypoint);
      item.addEventListener('click', selectWaypoint);
      
      // Delete button
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteWaypoint(waypoint);
      });
      
      this.elements.waypointList.appendChild(item);
    });
  }
  
  updateWaypointEditor() {
    if (this.selectedWaypoint) {
      // Show editor and hide placeholder
      this.elements.waypointEditor.style.display = 'block';
      this.elements.waypointEditorPlaceholder.style.display = 'none';
      
      // Path properties
      this.elements.segmentColor.value = this.selectedWaypoint.segmentColor;
      this.elements.segmentWidth.value = this.selectedWaypoint.segmentWidth;
      this.elements.segmentWidthValue.textContent = this.selectedWaypoint.segmentWidth;
      this.elements.segmentStyle.value = this.selectedWaypoint.segmentStyle || 'solid';
      this.elements.pathShape.value = this.selectedWaypoint.pathShape || 'line';
      
      // Marker properties
      this.elements.markerStyle.value = this.selectedWaypoint.markerStyle || 'dot';
      this.elements.dotColor.value = this.selectedWaypoint.dotColor || this.selectedWaypoint.segmentColor || this.styles.dotColor;
      this.elements.dotSize.value = this.selectedWaypoint.dotSize || this.styles.dotSize;
      this.elements.dotSizeValue.textContent = this.elements.dotSize.value;
      
      // Path head properties
      this.elements.pathHeadStyle.value = this.selectedWaypoint.pathHeadStyle || this.styles.pathHead.style;
      this.elements.pathHeadColor.value = this.selectedWaypoint.pathHeadColor || this.styles.pathHead.color;
      this.elements.pathHeadSize.value = this.selectedWaypoint.pathHeadSize || this.styles.pathHead.size;
      this.elements.pathHeadSizeValue.textContent = this.elements.pathHeadSize.value;
      this.elements.customHeadControls.style.display = 
        (this.selectedWaypoint.pathHeadStyle || this.styles.pathHead.style) === 'custom' ? 'block' : 'none';
      // Beacon editor fields
      if (this.selectedWaypoint.isMajor) {
        // Enable dot & beacon controls for major
        this.elements.dotColor.disabled = false;
        this.elements.dotSize.disabled = false;
        this.elements.editorBeaconStyle.disabled = false;
        this.elements.editorBeaconColor.disabled = false;
        this.elements.editorBeaconStyle.value = this.selectedWaypoint.beaconStyle || this.styles.beaconStyle;
        this.elements.editorBeaconColor.value = this.selectedWaypoint.beaconColor || this.styles.beaconColor;
        
        // Label controls
        this.elements.waypointLabel.disabled = false;
        this.elements.labelMode.disabled = false;
        this.elements.labelPosition.disabled = false;
        this.elements.waypointLabel.value = this.selectedWaypoint.label || '';
        this.elements.labelMode.value = this.selectedWaypoint.labelMode || 'none';
        this.elements.labelPosition.value = this.selectedWaypoint.labelPosition || 'auto';
        
        // Enable pause controls for major waypoints
        this.elements.waypointPauseTime.disabled = false;
        const pauseTimeSec = (this.selectedWaypoint.pauseTime || 0) / 1000;
        this.elements.waypointPauseTime.value = pauseTimeSec;
        this.elements.waypointPauseTimeValue.textContent = pauseTimeSec + 's';
        this.elements.pauseTimeControl.style.display = 'flex';
      } else {
        // Minor waypoint - disable features that don't apply
        this.elements.dotColor.disabled = true;
        this.elements.dotSize.disabled = true;
        this.elements.editorBeaconStyle.disabled = true;
        this.elements.editorBeaconColor.disabled = true;
        this.elements.editorBeaconStyle.value = 'none';
        this.elements.editorBeaconColor.value = this.styles.beaconColor;
        
        // Disable label controls for minor waypoints
        this.elements.waypointLabel.disabled = true;
        this.elements.labelMode.disabled = true;
        this.elements.labelPosition.disabled = true;
        this.elements.waypointLabel.value = '';
        this.elements.labelMode.value = 'none';
        this.elements.labelPosition.value = 'auto';
        
        // Disable pause controls for minor waypoints
        this.elements.waypointPauseTime.disabled = true;
        this.elements.waypointPauseTime.value = 0;
        this.elements.waypointPauseTimeValue.textContent = '0s';
        this.elements.pauseTimeControl.style.display = 'none';
      }
    } else {
      // Hide editor and show placeholder
      this.elements.waypointEditor.style.display = 'none';
      this.elements.waypointEditorPlaceholder.style.display = 'flex';
    }
  }
  
  deleteWaypoint(waypoint) {
    const index = this.waypoints.indexOf(waypoint);
    if (index > -1) {
      this.waypoints.splice(index, 1);
      if (this.selectedWaypoint === waypoint) {
        this.selectedWaypoint = null;
      }
      this.calculatePath();
      this.updateWaypointList();
      this.updateWaypointEditor();
      this.autoSave();
      this.announce('Waypoint deleted');
    }
  }
  
  /**
   * Update coordinateTransform service when image changes
   * @param {HTMLImageElement} img - The loaded image
   */
  updateImageTransform(img) {
    if (!img) {
      // No image - coordinateTransform will use normalized coordinates
      return;
    }
    
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    this.coordinateTransform.setImageDimensions(width, height, this.background.fit);
  }
  
  /**
   * Convert canvas coordinates to normalized image coordinates (0-1)
   * Delegates to CoordinateTransform service
   */
  canvasToImage(canvasX, canvasY) {
    return this.coordinateTransform.canvasToImage(canvasX, canvasY);
  }
  
  /**
   * Convert normalized image coordinates (0-1) to canvas coordinates
   * Delegates to CoordinateTransform service
   */
  imageToCanvas(imageX, imageY) {
    return this.coordinateTransform.imageToCanvas(imageX, imageY);
  }
  
  calculatePath() {
    this.pathPoints = [];
    
    if (this.waypoints.length < 2) {
      this.animationState.duration = 0;
      return;
    }
    
    // Convert waypoints from normalized image coords to canvas coords for path calculation
    const canvasWaypoints = this.waypoints.map(wp => {
      const canvasPos = this.imageToCanvas(wp.imgX, wp.imgY);
      // Safety check
      if (!isFinite(canvasPos.x) || !isFinite(canvasPos.y)) {
        console.warn('Invalid waypoint canvas position:', wp, canvasPos);
        return { ...wp, x: 0, y: 0 }; // Fallback to origin
      }
      return { ...wp, x: canvasPos.x, y: canvasPos.y };
    });
    
    // Delegate path calculation to PathCalculator service (with optimizations)
    this.pathPoints = this.pathCalculator.calculatePath(canvasWaypoints);
    
    // Calculate duration based on animation mode
    if (this.animationState.mode === 'constant-speed') {
      const totalLength = this.pathCalculator.calculatePathLength(this.pathPoints);
      this.animationState.duration = (totalLength / this.animationState.speed) * 1000; // Convert to ms
    }
    // For constant-time mode, duration is already set by the slider
    
    // Update total time display
    this.updateTimeDisplay();
  }
  
  // Get positions of major waypoints as normalized progress values (0-1)
  getMajorWaypointPositions() {
    if (this.waypoints.length < 2) return [];
    
    const majorWaypoints = [];
    let totalSegments = this.waypoints.length - 1;
    
    for (let i = 0; i < this.waypoints.length; i++) {
      if (this.waypoints[i].isMajor) {
        // Calculate position as progress (0-1) along the path
        const progress = i / totalSegments;
        majorWaypoints.push({ 
          index: i, 
          progress: progress,
          waypoint: this.waypoints[i]
        });
      }
    }
    
    return majorWaypoints;
  }
  
  // Apply smooth easing to entire animation with EXACT waypoint positioning
  // Gives professional smooth start/stop while preserving waypoint pause precision
  applyEasing(rawProgress, majorWaypoints) {
    // Check if we should be EXACTLY at a waypoint with pause
    for (const wp of majorWaypoints) {
      // If we're very close to the waypoint's progress and it has a pause setting
      if (wp.waypoint && 
          wp.waypoint.pauseMode === 'timed' && 
          Math.abs(rawProgress - wp.progress) < 0.001) {
        // Force exact position at waypoint - no easing
        return wp.progress;
      }
    }
    
    // Apply smooth cubic ease-in-out for professional animation feel
    return Easing.cubicInOut(rawProgress);
  }
  
  // Find which segment of the path we're currently in based on progress
  findSegmentIndexForProgress(progress) {
    if (this.waypoints.length < 2) return -1;
    
    const totalSegments = this.waypoints.length - 1;
    // Clamp progress between 0 and 1
    const clampedProgress = Math.max(0, Math.min(1, progress));
    
    // Convert progress to segment index
    const segmentPosition = clampedProgress * totalSegments;
    const segmentIndex = Math.floor(segmentPosition);
    
    return Math.min(segmentIndex, totalSegments - 1);
  }
  
  // Check if we need to wait at any waypoint
  checkForWaypointWait(rawProgress, majorWaypoints) {
    // Skip if already waiting at a waypoint or globally paused
    if (this.animationState.isWaitingAtWaypoint || this.animationState.isPaused) return;
    
    // Find which waypoint we're currently at (or between)
    const segmentIndex = this.findSegmentIndexForProgress(rawProgress);
    if (segmentIndex < 0) return;
    
    // Only log major waypoint info on the first frame (when near the beginning)
    if (rawProgress < 0.01) {
      console.log('All major waypoints:', majorWaypoints.map(wp => ({
        index: wp.index,
        progress: wp.progress, 
        pauseMode: wp.waypoint && wp.waypoint.pauseMode
      })));
    }
    
    // First, find the next waypoint we'll encounter
    let nextWaypoint = null;
    let minPositiveDistance = Infinity;
    
    for (const wp of majorWaypoints) {
      // Skip waypoints we've already waited at
      if (wp.index === this.animationState.pauseWaypointIndex) continue;
      
      // Extra careful check for pauseMode property and pause time
      const pauseMode = wp.waypoint && wp.waypoint.pauseMode;
      const pauseTime = wp.waypoint && wp.waypoint.pauseTime;
      
      // Skip if no wait time or pause mode isn't timed
      if (!wp.waypoint || pauseMode !== 'timed' || !pauseTime || pauseTime <= 0) {
        continue;
      }
      
      // Calculate exact position values for this waypoint
      const exactWaypointProgress = wp.index / (this.waypoints.length - 1);
      
      // Calculate precise distance from current position to waypoint
      // We want the closest waypoint ahead of us (positive distance)
      const distanceToWaypoint = exactWaypointProgress - rawProgress;
      
      // Only consider waypoints ahead of us (positive distance) or very close
      // Use a small negative threshold to catch waypoints we just passed by a tiny bit
      if (distanceToWaypoint > -0.005 && distanceToWaypoint < minPositiveDistance) {
        minPositiveDistance = distanceToWaypoint;
        nextWaypoint = wp;
      }
    }
    
    // If no valid waypoint found, return
    if (!nextWaypoint) return;
    
    // Calculate exact waypoint position
    const exactWaypointProgress = nextWaypoint.index / (this.waypoints.length - 1);
    
    // More flexible threshold to catch waypoints
    // This prevents skipping over waypoints during fast animations
    // 0.005 is 0.5% of the total path length - small enough to be precise but not miss
    const atOrJustPassedWaypoint = 
      Math.abs(rawProgress - exactWaypointProgress) < 0.005 && 
      rawProgress >= exactWaypointProgress - 0.005;
    
    if (atOrJustPassedWaypoint) {
      console.log(`WAITING at waypoint ${nextWaypoint.index} (progress ${nextWaypoint.progress.toFixed(3)})`, nextWaypoint.waypoint);
      
      // Mark this waypoint as the one we're waiting at
      this.animationState.pauseWaypointIndex = nextWaypoint.index;
      
      // Start waiting - but don't pause the entire animation
      this.animationState.isWaitingAtWaypoint = true;
      this.animationState.pauseStartTime = performance.now();
      
      // Set end time for waiting period using this waypoint's pause time
      this.animationState.pauseEndTime = 
        this.animationState.pauseStartTime + nextWaypoint.waypoint.pauseTime;
      
      // Store the exact waypoint progress as a snapshot to freeze visual progress
      this.animationState.waypointProgressSnapshot = exactWaypointProgress;
          
      // Announce wait period with duration
      const waitDuration = nextWaypoint.waypoint.pauseTime / 1000;
      this.announce(`Waiting at waypoint ${nextWaypoint.index + 1} for ${waitDuration} seconds`);
      
      // Force exact positioning precisely AT the waypoint
      this.animationState.progress = exactWaypointProgress;
      
      // Ensure the path head is exactly at the waypoint
      this.render();
    }
  }
  
  // Kept for potential future use
  continueAnimation() {
    // Click-to-continue functionality removed
  }
  
  // Easing functions moved to utils/Easing.js for better modularity and performance
  // Corner slowing and curvature calculation moved to services/PathCalculator.js
  
  play() {
    if (this.waypoints.length < 2) return;
    
    // If animation is finished (at 100%), reset to beginning
    if (this.animationState.progress >= 1.0) {
      this.animationState.progress = 0;
      this.animationState.currentTime = 0;
    }
    
    this.animationState.isPlaying = true;
    this.animationState.lastTime = performance.now();
    
    // Reset pause and waiting states
    this.animationState.isPaused = false;
    this.animationState.isWaitingAtWaypoint = false;
    this.animationState.pauseWaypointIndex = -1;
    this.animationState.waypointProgressSnapshot = 0;
    
    // Update UI
    this.elements.playBtn.style.display = 'none';
    this.elements.pauseBtn.style.display = 'block';
  }
  
  pause() {
    this.animationState.isPlaying = false;
    
    // Reset pause and waiting states
    this.animationState.isPaused = false;
    this.animationState.isWaitingAtWaypoint = false;
    this.animationState.pauseWaypointIndex = -1;
    this.animationState.waypointProgressSnapshot = 0;
    
    // Update UI
    this.elements.playBtn.style.display = 'block';
    this.elements.pauseBtn.style.display = 'none';
  }
  
  skipToStart() {
    // Reset to beginning
    this.animationState.progress = 0;
    this.animationState.currentTime = 0;
    this.elements.timelineSlider.value = 0;
    
    // Also clear any waiting state
    this.animationState.isWaitingAtWaypoint = false;
    this.animationState.pauseWaypointIndex = -1;
    this.animationState.waypointProgressSnapshot = 0;
  }
  
  skipToEnd() {
    // Jump to end
    this.animationState.progress = 1;
    this.animationState.currentTime = this.animationState.duration;
    this.elements.timelineSlider.value = ANIMATION.TIMELINE_RESOLUTION;
    
    // Also clear any waiting state
    this.animationState.isWaitingAtWaypoint = false;
    this.animationState.pauseWaypointIndex = -1;
    this.animationState.waypointProgressSnapshot = 0;
  }
  
  clearAll() {
    this.waypoints = [];
    this.pathPoints = [];
    this.selectedWaypoint = null;
    
    // Reset animation state
    this.animationState.progress = 0;
    this.animationState.currentTime = 0;
    this.animationState.duration = 0;
    this.animationState.isWaitingAtWaypoint = false;
    this.animationState.pauseWaypointIndex = -1;
    this.animationState.waypointProgressSnapshot = 0;
    
    this.pause();
    this.updateTimeDisplay();
    this.updateWaypointList();
    console.log('Cleared all waypoints and path');
  }
  
  showSplash() {
    this.elements.splash.style.display = 'flex';
  }
  
  hideSplash() {
    this.elements.splash.style.display = 'none';
    
    if (this.elements.splashDontShow.checked) {
      this.storageService.markSplashShown();
    }
  }

  // ----- Accessibility and persistence helpers -----
  announce(message, priority = 'polite') {
    const el = document.getElementById('announcer');
    if (!el) return;
    el.setAttribute('aria-live', priority);
    el.textContent = message;
    // Clear after a short delay so repeated messages are announced
    setTimeout(() => { el.textContent = ''; }, 2000);
  }

  autoSave() {
    try {
      // Create a clean copy of styles without the pathHead image object
      const stylesCopy = { ...this.styles };
      if (stylesCopy.pathHead && stylesCopy.pathHead.image) {
        stylesCopy.pathHead = { ...stylesCopy.pathHead, image: null };
      }
      
      const data = {
        coordVersion: 6, // Version tracking for coordinate system changes
        waypoints: this.waypoints,
        styles: stylesCopy,
        animationState: this.animationState,
        background: {
          overlay: this.background.overlay,
          fit: this.background.fit
        }
      };
      
      // Use StorageService with debounced auto-save
      this.storageService.autoSave(data);
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  }

  loadAutosave() {
    try {
      const data = this.storageService.loadAutoSave();
      if (!data) return;
      
      // Check version - if old version, clear and start fresh
      const COORD_SYSTEM_VERSION = 6; // v6: Changed pause settings from global to per-waypoint
      if (!data.coordVersion || data.coordVersion < COORD_SYSTEM_VERSION) {
        console.log('Old data version detected (v' + (data.coordVersion || 1) + '), clearing saved data for v' + COORD_SYSTEM_VERSION);
        this.storageService.clearAutoSave();
        return;
      }
      
      if (data.waypoints) {
        this.waypoints = data.waypoints;
        console.log('Loaded waypoints:', this.waypoints.length);
      }
      if (data.styles) {
        this.styles = { ...this.styles, ...data.styles };
      }
      if (data.animationState) {
        const savedState = data.animationState;
        
        // Update animation state properties
        this.animationState.mode = savedState.mode || 'constant-speed';
        this.animationState.speed = savedState.speed || 200;
        this.animationState.duration = savedState.duration || 5000;
        this.animationState.playbackSpeed = savedState.playbackSpeed || 1;
        
        // Update UI to match loaded values
        // Animation mode fixed to constant-speed
        if (this.elements.animationSpeed) {
          this.elements.animationSpeed.value = this.animationState.speed;
          this.elements.animationSpeedValue.textContent = String(this.animationState.speed);
        }
        // Duration control removed from UI
        
        // Always show speed control (duration control removed)
        if (this.elements.speedControl) {
          this.elements.speedControl.style.display = 'flex';
        }
      }
      if (data.background) {
        this.background.overlay = data.background.overlay ?? this.background.overlay;
        this.background.fit = data.background.fit ?? this.background.fit;
        
        // Update toggle button to match loaded state
        if (this.elements.bgFitToggle) {
          this.elements.bgFitToggle.textContent = this.background.fit === 'fit' ? 'Fit' : 'Fill';
          this.elements.bgFitToggle.dataset.mode = this.background.fit;
        }
        // Reflect overlay in UI if controls exist
        if (this.elements.bgOverlay) {
          this.elements.bgOverlay.value = String(this.background.overlay);
          this.elements.bgOverlayValue.textContent = String(this.background.overlay);
        }
      }
      this.calculatePath();
      this.updateWaypointList();
      this.announce('Previous session restored');
    } catch (e) {
      console.warn('No autosave found or failed to load');
    }
  }
  
  startRenderLoop() {
    // Continuous render loop that always runs
    const loop = (currentTime) => {
      requestAnimationFrame(loop);

      if (this.animationState.isPlaying) {
        const deltaTime = (currentTime - this.animationState.lastTime) * this.animationState.playbackSpeed;
        this.animationState.lastTime = currentTime;
        
        // Handle global pause (play/pause button)
        if (this.animationState.isPaused) {
          // Don't update anything if globally paused
          return;
        }

        // Handle waypoint waiting - timer still advances but visually we stay put
        if (this.animationState.isWaitingAtWaypoint) {
          if (currentTime >= this.animationState.pauseEndTime) {
            console.log('Wait time complete, continuing animation at', {
              currentTime,
              pauseEndTime: this.animationState.pauseEndTime,
              timeElapsed: currentTime - this.animationState.pauseStartTime
            });
            this.animationState.isWaitingAtWaypoint = false;
            this.animationState.pauseWaypointIndex = -1;
            this.animationState.waypointProgressSnapshot = 0;
            this.announce('Continuing animation');
          }
        }

        // Always advance time whether waiting or not
        this.animationState.currentTime += deltaTime;

        // Check for end of animation
        if (this.animationState.currentTime >= this.animationState.duration) {
          this.animationState.currentTime = this.animationState.duration;
          this.animationState.progress = 1;
          this.pause();
        } else {
          // Calculate raw progress based on current time
          const rawProgress = this.animationState.currentTime / this.animationState.duration;

          // Set current progress - respecting waypoint waiting if active
          if (this.animationState.isWaitingAtWaypoint) {
            // Use snapshot progress while waiting
            this.animationState.progress = this.animationState.waypointProgressSnapshot;
          } else {
            // Normal progress
            this.animationState.progress = rawProgress;
            
            // Check if we need to wait at any waypoints
            const majorWaypoints = this.getMajorWaypointPositions();
            if (majorWaypoints.length > 0) {
              this.checkForWaypointWait(rawProgress, majorWaypoints);
            }
          }
        }
        
        // Always update slider based on timeline position, not visual progress
        const timelineProgress = this.animationState.currentTime / this.animationState.duration;
        this.elements.timelineSlider.value = timelineProgress * 1000;
        
        this.updateTimeDisplay();
      }

      this.render();
    };
    
    requestAnimationFrame(loop);
  }
  
  updateTimeDisplay() {
    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    
    this.elements.currentTime.textContent = formatTime(this.animationState.currentTime);
    this.elements.totalTime.textContent = formatTime(this.animationState.duration);
  }
  
  render() {
    const { ctx } = this;
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    
    // Safety check - ensure canvas has valid dimensions
    if (cw <= 0 || ch <= 0) {
      console.warn('Cannot render to canvas with invalid dimensions:', { width: cw, height: ch });
      return; // Skip rendering
    }
    
    // Clear
    ctx.clearRect(0, 0, cw, ch);
    
    // 1) Base image
    this.renderBackground(ctx);
    // 2) Contrast overlay
    this.renderOverlay(ctx);
    
    // 3-6) Vector + head + UI handles on offscreen canvas
    const vCanvas = this.getVectorCanvas();
    
    // Safety check for vector canvas
    if (vCanvas.width <= 0 || vCanvas.height <= 0) {
      console.warn('Vector canvas has invalid dimensions:', { width: vCanvas.width, height: vCanvas.height });
      return; // Skip drawing vector layer
    }
    
    const vctx = vCanvas.getContext('2d');
    vctx.clearRect(0, 0, vCanvas.width, vCanvas.height);
    this.renderVectorLayerTo(vctx);
    
    // Safety check before drawing vector layer
    if (vCanvas.width > 0 && vCanvas.height > 0) {
      // Blit vector layer to main
      ctx.drawImage(vCanvas, 0, 0);
    }
  }

  // ----- Layer helpers -----
  getVectorCanvas() {
    if (!this.vectorCanvas) {
      this.vectorCanvas = document.createElement('canvas');
    }
    
    // Get canvas dimensions with safety checks
    const cw = this.displayWidth || this.canvas.width || 100; // Fallback to minimum size
    const ch = this.displayHeight || this.canvas.height || 100;
    
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
  
  
  renderBackground(ctx) {
    if (!this.background.image) return;
    
    const img = this.background.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    
    if (this.background.fit === 'fit') {
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
  
  renderOverlay(ctx) {
    const v = this.background.overlay;
    if (v === 0) return;
    
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    
    ctx.save();
    ctx.globalAlpha = Math.min(Math.abs(v) / 100, 0.6);
    ctx.fillStyle = v < 0 ? '#000' : '#fff';
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }

  renderVectorLayerTo(targetCtx) {
    const orig = this.ctx; this.ctx = targetCtx;
    // 4) Vector layer (paths, labels, waypoints)
    if (this.pathPoints.length > 0 && this.waypoints.length > 1) {
      const totalPoints = this.pathPoints.length;
      const pointsToRender = Math.floor(totalPoints * this.animationState.progress);
      const segments = this.waypoints.length - 1;
      const pointsPerSegment = Math.floor(totalPoints / segments);
      const controllerForSegment = new Array(segments);
      
      // Store exact waypoint positions in path points for later use in labels
      this.waypointPositions = [];
      this.waypoints.forEach((wp, index) => {
        if (index < this.waypoints.length - 1) {
          const exactPointIndex = (index / segments) * totalPoints;
          this.waypointPositions.push({
            waypointIndex: index,
            pointIndex: exactPointIndex
          });
        }
      });
      
      let lastMajorIdx = -1;
      for (let s = 0; s < segments; s++) {
        if (this.waypoints[s].isMajor) lastMajorIdx = s;
        controllerForSegment[s] = lastMajorIdx;
      }
      for (let i = 1; i < pointsToRender; i++) {
        const segmentIndex = Math.min(Math.floor(i / pointsPerSegment), segments - 1);
        const controllerIdx = controllerForSegment[segmentIndex];
        const controller = controllerIdx >= 0 ? this.waypoints[controllerIdx] : {
          segmentColor: this.styles.pathColor,
          segmentWidth: this.styles.pathThickness,
          segmentStyle: 'solid',
          pathShape: 'line'
        };
        this.ctx.strokeStyle = controller.segmentColor;
        this.ctx.lineWidth = controller.segmentWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.applyLineStyle(controller.segmentStyle);
        this.ctx.beginPath();
        
        const pathShape = controller.pathShape || 'line';
        const p1 = this.pathPoints[i - 1];
        const p2 = this.pathPoints[i];
        
        if (pathShape === 'squiggle') {
          // Create a wavy path using control points
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const perpX = -(p2.y - p1.y) * 0.15; // Perpendicular offset
          const perpY = (p2.x - p1.x) * 0.15;
          
          this.ctx.moveTo(p1.x, p1.y);
          const wave = Math.sin(i * 0.5) * 0.5;
          this.ctx.quadraticCurveTo(
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
          this.ctx.moveTo(jitteredP1.x, jitteredP1.y);
          this.ctx.lineTo(jitteredP2.x, jitteredP2.y);
        } else {
          // Default line
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
        }
        
        this.ctx.stroke();
      }
      this.ctx.setLineDash([]);
      
      // 5) Path head layer
      if (pointsToRender > 1) {
        // Get the path head position
        const headIndex = Math.min(pointsToRender - 1, this.pathPoints.length - 1);
        const head = this.pathPoints[headIndex];
        
        // Calculate direction for rotation (based on previous point)
        let rotation = 0;
        if (headIndex > 0) {
          const prevPoint = this.pathPoints[headIndex - 1];
          rotation = Math.atan2(head.y - prevPoint.y, head.x - prevPoint.x);
        }
        
        // Store calculated rotation
        this.styles.pathHead.rotation = rotation;
        
        // Draw path head based on style
        this.drawPathHead(head.x, head.y, rotation);
      }
    }
    
    // Beacons
    if (this.pathPoints.length > 0) {
      const currentProgress = this.animationState.progress;
      const totalPoints = this.pathPoints.length;
      
      // Use exact progress comparison instead of point index for more precision
      this.waypoints.forEach((waypoint, wpIndex) => {
        if (waypoint.isMajor) {
          // Calculate normalized progress for this waypoint
          const exactWaypointProgress = wpIndex / (this.waypoints.length - 1);
          
          // Show beacon EXACTLY when we reach a waypoint (not after)
          // Use a small threshold to ensure reliable triggering
          const atWaypoint = Math.abs(currentProgress - exactWaypointProgress) < 0.001;
          
          // Show beacon exactly when paused at this waypoint
          const isPausedHere = this.animationState.isPaused && 
                              this.animationState.pauseWaypointIndex === wpIndex;
          
          // Show beacon when either exactly at waypoint or paused at it
          if (atWaypoint || isPausedHere) {
            // Convert waypoint to canvas coords for drawing beacon
            const wpCanvas = this.imageToCanvas(waypoint.imgX, waypoint.imgY);
            this.drawBeacon({ ...waypoint, x: wpCanvas.x, y: wpCanvas.y });
          }
        }
      });
    }
    
    // 6) UI handles (visible markers)
    this.waypoints.forEach(waypoint => {
      if (waypoint.isMajor) {
        // Convert waypoint from image coords to canvas coords
        const wpCanvas = this.imageToCanvas(waypoint.imgX, waypoint.imgY);
        const isSelected = waypoint === this.selectedWaypoint;
        const markerSize = waypoint.dotSize || this.styles.dotSize;
        const size = isSelected ? markerSize * 1.3 : markerSize;
        const markerStyle = waypoint.markerStyle || this.styles.markerStyle;
        
        // Skip rendering if marker style is 'none'
        if (markerStyle === 'none') {
          this.renderLabel(waypoint, wpCanvas.x, wpCanvas.y, 0);
          return;
        }
        
        this.ctx.fillStyle = waypoint.dotColor || waypoint.segmentColor || this.styles.dotColor;
        this.ctx.strokeStyle = isSelected ? '#4a90e2' : 'white';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        
        // Draw different marker types
        if (markerStyle === 'square') {
          // Square marker
          this.ctx.beginPath();
          this.ctx.rect(wpCanvas.x - size, wpCanvas.y - size, size * 2, size * 2);
          this.ctx.fill();
          this.ctx.stroke();
        } else if (markerStyle === 'flag') {
          // Flag marker
          this.ctx.beginPath();
          // Pole
          this.ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          this.ctx.lineTo(wpCanvas.x, wpCanvas.y + size);
          // Flag
          this.ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          this.ctx.lineTo(wpCanvas.x + size * 1.5, wpCanvas.y - size * 1.3);
          this.ctx.lineTo(wpCanvas.x + size * 1.2, wpCanvas.y - size);
          this.ctx.lineTo(wpCanvas.x, wpCanvas.y - size * 0.7);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
        } else {
          // Default to dot
          this.ctx.beginPath();
          this.ctx.arc(wpCanvas.x, wpCanvas.y, size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
        }
        
        // Draw labels for major waypoints
        this.renderLabel(waypoint, wpCanvas.x, wpCanvas.y, size);
      }
    });
    this.ctx = orig;
  }
  
  // Label rendering with positioning and show/hide behavior
  renderLabel(waypoint, x, y, dotSize) {
    // Skip if no label text or mode is 'none'
    if (!waypoint.label || waypoint.labelMode === 'none') return;
    
    // Find the true waypoint position in path coordinates
    const wpIndex = this.waypoints.indexOf(waypoint);
    const totalPoints = this.pathPoints.length;
    
    // Get exact path position for this waypoint
    let waypointPointIndex = 0;
    if (wpIndex < this.waypoints.length - 1) {
      waypointPointIndex = (wpIndex / (this.waypoints.length - 1)) * totalPoints;
    } else {
      waypointPointIndex = totalPoints;
    }
    
    // Current animation position in path coordinates
    const exactCurrentPoint = totalPoints * this.animationState.progress;
    
    // Calculate animation timing parameters
    // Increased fade time for more noticeable transition
    const fadeTimeInPoints = totalPoints * 0.02; // 1% of animation = 0.5 seconds
    let opacity = 0; // Start with zero opacity
    
    // Handle different label modes
    switch (waypoint.labelMode) {
      case 'on': 
        // Always visible with full opacity
        opacity = 1.0;
        break;
        
      case 'fade':
        // Only show label when waypoint is reached
        if (exactCurrentPoint < waypointPointIndex) return;
        
        // Calculate time since waypoint was reached
        const elapsed = exactCurrentPoint - waypointPointIndex;
        
        // Fade in quickly (over 0.25 seconds)
        if (elapsed <= fadeTimeInPoints / 2) {
          opacity = Math.min(1.0, elapsed / (fadeTimeInPoints / 2));
          opacity = Math.pow(opacity, 0.5); // Use square root for faster initial appearance
        }
        // Hold during the future waypoint pause time (to be implemented)
        else if (elapsed <= fadeTimeInPoints * 3) {
          opacity = 1.0;
        }
        // Fade out over 0.5 seconds
        else if (elapsed <= fadeTimeInPoints * 4) {
          opacity = 1.0 - Math.min(1.0, (elapsed - fadeTimeInPoints * 3) / fadeTimeInPoints);
        }
        // Don't show after fade out
        else {
          return;
        }
        break;
        
      case 'persist':
        // Start fading in exactly 0.5 seconds before waypoint
        const timeBeforeWaypoint = waypointPointIndex - exactCurrentPoint;
        
        // If we haven't reached the fade-in period yet
        if (timeBeforeWaypoint > fadeTimeInPoints) return;
        
        // If we're in the fade-in period before reaching waypoint
        if (timeBeforeWaypoint > 0) {
          // Accelerated fade-in (starts faster)
          const fadeProgress = 1.0 - (timeBeforeWaypoint / fadeTimeInPoints);
          opacity = Math.pow(fadeProgress, 0.5); // Square root for quicker initial appearance
        }
        // After reaching waypoint, full opacity
        else {
          opacity = 1.0;
        }
        break;
        
      default:
        return; // Unknown mode
    }
    
    // Debug output to console
    // if (wpIndex === 0) console.log(`Label ${wpIndex}: opacity=${opacity.toFixed(2)}`);
    
    // Save context for restoring later
    this.ctx.save();
    
    // Apply calculated opacity with a higher minimum to make fade-in more noticeable
    this.ctx.globalAlpha = Math.max(0.15, opacity);
    
    // Label style
    this.ctx.font = 'bold 16px Arial';
    
    // Visual effect depends on opacity during fade
    // Subtle blue highlight during fade-in, white at full opacity
    const blueAmount = opacity < 1.0 ? Math.max(0, 1 - opacity) * 60 : 0;
    this.ctx.fillStyle = `rgb(${255-blueAmount}, ${255-blueAmount}, 255)`;
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Add shadow for better visibility
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    this.ctx.shadowBlur = 5;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    // Calculate label position based on position setting
    const padding = RENDERING.LABEL_OFFSET_X; // Distance from dot edge to label
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
        this.ctx.textAlign = 'left';
        break;
      case 'bottom':
        labelY = y + dotSize + padding;
        break;
      case 'left':
        labelX = x - dotSize - padding;
        this.ctx.textAlign = 'right';
        break;
      case 'auto':
      default:
        // Auto position to avoid going off-screen
        const cw = this.displayWidth || this.canvas.width;
        const ch = this.displayHeight || this.canvas.height;
        
        // Default to top position
        labelY = y - dotSize - padding;
        
        // Check if too close to top edge
        if (labelY < 30) {
          labelY = y + dotSize + padding; // Switch to bottom
        }
        
        // Check if too close to sides
        if (x < 100) {
          labelX = x + dotSize + padding;
          this.ctx.textAlign = 'left';
        } else if (x > cw - 100) {
          labelX = x - dotSize - padding;
          this.ctx.textAlign = 'right';
        }
        break;
    }
    
    // Draw text with outline for readability
    this.ctx.strokeText(waypoint.label, labelX, labelY);
    this.ctx.fillText(waypoint.label, labelX, labelY);
    
    // Restore context to clear shadow and alpha
    this.ctx.restore();
  }

  // ----- Assets -----
  loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }
  
  loadDefaultImage() {
    const img = new Image();
    img.onload = () => {
      this.background.image = img;
      this.updateImageTransform(img);
      // Recalculate path with proper image bounds now that image is loaded
      if (this.waypoints.length >= 2) {
        this.calculatePath();
      }
      this.render();
      console.log('Default image (UoN_map.png) loaded for dev testing');
    };
    img.onerror = (err) => {
      console.warn('Could not load default image:', err);
      // Continue rendering even without image
      this.render();
    };
    img.src = './UoN_map.png';
  }
  
  applyLineStyle(style) {
    switch (style) {
      case 'dotted':
        this.ctx.setLineDash([2, 6]);
        break;
      case 'dashed':
        this.ctx.setLineDash([10, 5]);
        break;
      case 'squiggle':
        // Approximated with dashed pattern - true squiggle would need complex path manipulation
        this.ctx.setLineDash([5, 3, 2, 3]);
        break;
      case 'solid':
      default:
        this.ctx.setLineDash([]);
        break;
    }
  }
  
  // Draw the path head based on current style settings
  drawPathHead(x, y, rotation) {
    // Safety check for valid coordinates
    if (!isFinite(x) || !isFinite(y)) {
      console.warn('Invalid path head coordinates:', {x, y});
      return;
    }
    
    const pathHead = this.styles.pathHead;
    const size = pathHead.size;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    
    switch (pathHead.style) {
      case 'dot':
        // Simple dot (filled circle)
        this.ctx.beginPath();
        this.ctx.fillStyle = pathHead.color;
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'arrow':
        // Arrow shape
        this.ctx.beginPath();
        this.ctx.fillStyle = pathHead.color;
        
        // Draw arrow pointing right (rotation will handle direction)
        this.ctx.moveTo(size, 0);            // Tip
        this.ctx.lineTo(-size/2, size/2);    // Bottom corner
        this.ctx.lineTo(-size/4, 0);         // Indentation
        this.ctx.lineTo(-size/2, -size/2);   // Top corner
        this.ctx.closePath();
        this.ctx.fill();
        break;
        
      case 'custom':
        // Custom image
        if (pathHead.image) {
          const imgSize = size * 2; // Make image slightly larger for better visibility
          // Draw the image centered and rotated
          this.ctx.drawImage(
            pathHead.image, 
            -imgSize/2, -imgSize/2,
            imgSize, imgSize
          );
        } else {
          // Fallback to dot if no image loaded
          this.ctx.beginPath();
          this.ctx.fillStyle = pathHead.color;
          this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
        
      default:
        // Default to dot
        this.ctx.beginPath();
        this.ctx.fillStyle = pathHead.color;
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  drawBeacon(point) {
    const bStyle = point.beaconStyle || 'none';
    const bColor = point.beaconColor || this.styles.beaconColor;
    if (bStyle === 'none') return;
    
    // Safety check for valid coordinates
    if (!isFinite(point.x) || !isFinite(point.y)) {
      console.warn('Invalid beacon coordinates:', point);
      return;
    }
    
    if (bStyle === 'pulse') {
      // Update pulse phase
      this.beaconAnimation.pulsePhase = performance.now() * 0.003;
      
      // Pulsing dot
      const pulse = 1 + Math.sin(this.beaconAnimation.pulsePhase) * 0.3;
      const pulseSize = RENDERING.BEACON_PULSE_SIZE * pulse;
      
      // Outer glow
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2);
      this.ctx.fillStyle = bColor;
      this.ctx.globalAlpha = RENDERING.BEACON_PULSE_OPACITY;
      this.ctx.fill();
      
      // Update pulse animation state
      this.beaconAnimation.pulsePhase = (this.beaconAnimation.pulsePhase + 0.1) % (Math.PI * 2);
    } 
    else if (bStyle === 'ripple') {
      // Ripple effect - expanding circles that fade out
      const now = Date.now();
      
      // Add a new ripple every interval
      if (!point.lastRipple || now - point.lastRipple > RENDERING.BEACON_RIPPLE_INTERVAL) {
        this.beaconAnimation.ripples.push({
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
      this.beaconAnimation.ripples = this.beaconAnimation.ripples.filter(ripple => {
        const age = now - ripple.startTime;
        if (age > RENDERING.BEACON_RIPPLE_DURATION) return false; // Remove old ripples
        
        // Calculate current radius with smooth fade-out
        const radius = age / RENDERING.BEACON_RIPPLE_SPEED;
        const fadeProgress = age / RENDERING.BEACON_RIPPLE_DURATION;
        const opacity = 0.5 * (1 - Easing.cubicOut(fadeProgress));
        
        // Draw ripple
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = ripple.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = opacity;
        this.ctx.stroke();
        
        return true;
      });
      
      // Draw center dot
      this.ctx.beginPath();
      this.ctx.fillStyle = bColor;
      this.ctx.globalAlpha = 0.8;
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Reset global alpha to prevent affecting subsequent draws
    this.ctx.globalAlpha = 1.0;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new RoutePlotter();
});
