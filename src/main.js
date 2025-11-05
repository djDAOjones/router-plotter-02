// Catmull-Rom spline implementation with tension control
class CatmullRom {
  static interpolate(p0, p1, p2, p3, t, tension = 0.5) {
    const t2 = t * t;
    const t3 = t2 * t;
    
    const v0 = { x: (p2.x - p0.x) * tension, y: (p2.y - p0.y) * tension };
    const v1 = { x: (p3.x - p1.x) * tension, y: (p3.y - p1.y) * tension };
    
    return {
      x: p1.x + v0.x * t + (3 * (p2.x - p1.x) - 2 * v0.x - v1.x) * t2 + 
         (2 * (p1.x - p2.x) + v0.x + v1.x) * t3,
      y: p1.y + v0.y * t + (3 * (p2.y - p1.y) - 2 * v0.y - v1.y) * t2 + 
         (2 * (p1.y - p2.y) + v0.y + v1.y) * t3
    };
  }
  
  static createPath(waypoints, pointsPerSegment = 30, defaultTension = 0.5) {
    if (waypoints.length < 2) return [];
    
    const path = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(0, i - 1)];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];
      
      // Use per-segment tension from the starting waypoint, or default
      const segmentTension = p1.segmentTension ?? defaultTension;
      
      for (let j = 0; j < pointsPerSegment; j++) {
        const t = j / pointsPerSegment;
        path.push(CatmullRom.interpolate(p0, p1, p2, p3, t, segmentTension));
      }
    }
    
    // Add the last point
    path.push(waypoints[waypoints.length - 1]);
    
    return path;
  }
}

// Main application class for Route Plotter v3
class RoutePlotter {
  constructor() {
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
      duration: 5000, // default 5 seconds
      speed: 200, // pixels per second
      mode: 'constant-speed', // or 'constant-time'
      playbackSpeed: 1, // 0.5, 1, or 2
      // Pause state tracking (at runtime only, not saved)
      isPaused: false,
      pauseStartTime: 0,
      pauseEndTime: 0,
      pauseWaypointIndex: -1,
      waitingForClick: false
    };
    
    // Style settings
    this.styles = {
      pathColor: '#FF6B6B',
      pathThickness: 3,
      pathTension: 0.05, // Catmull-Rom tension (5% = very smooth)
      waypointSize: 8,
      beaconStyle: 'pulse', // default for new major waypoints
      beaconColor: '#FF6B6B',
      labelMode: 'none',    // none, fade, persist
      labelPosition: 'auto' // auto, top, right, bottom, left
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
      fadeTime: 2000    // Fade duration in ms for 'fade' mode
    };
    
    // UI Elements
    this.elements = {
      helpBtn: document.getElementById('help-btn'),
      clearBtn: document.getElementById('clear-btn'),
      playBtn: document.getElementById('play-btn'),
      pauseBtn: document.getElementById('pause-btn'),
      skipStartBtn: document.getElementById('skip-start-btn'),
      skipEndBtn: document.getElementById('skip-end-btn'),
      timelineSlider: document.getElementById('timeline-slider'),
      currentTime: document.getElementById('current-time'),
      totalTime: document.getElementById('total-time'),
      splash: document.getElementById('splash'),
      splashClose: document.getElementById('splash-close'),
      splashDontShow: document.getElementById('splash-dont-show'),
      // Style controls
      waypointSize: document.getElementById('waypoint-size'),
      waypointSizeValue: document.getElementById('waypoint-size-value'),
      // New controls
      animationMode: document.getElementById('animation-mode'),
      animationSpeed: document.getElementById('animation-speed'),
      animationSpeedValue: document.getElementById('animation-speed-value'),
      animationDuration: document.getElementById('animation-duration'),
      animationDurationValue: document.getElementById('animation-duration-value'),
      speedControl: document.getElementById('speed-control'),
      durationControl: document.getElementById('duration-control'),
      // Pause controls
      waypointPauseMode: document.getElementById('waypoint-pause-mode'),
      waypointPauseTime: document.getElementById('waypoint-pause-time'),
      waypointPauseTimeValue: document.getElementById('waypoint-pause-time-value'),
      pauseTimeControl: document.getElementById('pause-time-control'),
      easeMotion: document.getElementById('ease-motion'),
      waypointList: document.getElementById('waypoint-list'),
      // Waypoint editor controls
      waypointEditor: document.getElementById('waypoint-editor'),
      waypointEditorPlaceholder: document.getElementById('waypoint-editor-placeholder'),
      segmentColor: document.getElementById('segment-color'),
      segmentWidth: document.getElementById('segment-width'),
      segmentWidthValue: document.getElementById('segment-width-value'),
      segmentStyle: document.getElementById('segment-style'),
      dotColor: document.getElementById('dot-color'),
      dotSize: document.getElementById('dot-size'),
      dotSizeValue: document.getElementById('dot-size-value'),
      editorBeaconStyle: document.getElementById('editor-beacon-style'),
      editorBeaconColor: document.getElementById('editor-beacon-color'),
      waypointLabel: document.getElementById('waypoint-label'),
      labelMode: document.getElementById('label-mode'),
      labelPosition: document.getElementById('label-position'),
      // Background controls
      bgUploadBtn: document.getElementById('bg-upload-btn'),
      bgUpload: document.getElementById('bg-upload'),
      bgOverlay: document.getElementById('bg-overlay'),
      bgOverlayValue: document.getElementById('bg-overlay-value'),
      bgFitToggle: document.getElementById('bg-fit-toggle')
    };
    
    this.init();
  }
  
  init() {
    // Set up canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Show splash on first load
    if (localStorage.getItem('routePlotter_hideSplash') !== 'true') {
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
  
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    
    // Controls panel is 80px tall and overlays the bottom of the canvas
    // We need to subtract this from the usable height
    const controlsHeight = 80;
    
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
      this.animationState.progress = e.target.value / 1000;
      this.animationState.currentTime = this.animationState.progress * this.animationState.duration;
    });
    
    // Style controls
    // Waypoint size in waypoint editor (per-waypoint)
    this.elements.waypointSize.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        const size = parseInt(e.target.value);
        this.selectedWaypoint.waypointSize = size;
        // Also update dotSize to keep them in sync
        this.selectedWaypoint.dotSize = size;
        this.elements.waypointSizeValue.textContent = e.target.value;
        // Update dot size control to match
        this.elements.dotSize.value = e.target.value;
        this.elements.dotSizeValue.textContent = e.target.value;
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
    
    // Waypoint editor controls
    this.elements.segmentColor.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.segmentColor = e.target.value;
        this.calculatePath();
      }
    });
    
    this.elements.segmentWidth.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.segmentWidth = parseFloat(e.target.value);
        this.elements.segmentWidthValue.textContent = e.target.value;
        this.calculatePath();
      }
    });
    
    this.elements.segmentStyle.addEventListener('change', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.segmentStyle = e.target.value;
        this.calculatePath();
        this.autoSave();
      }
    });
    
    // Path tension is fixed at 5% (0.05) globally
    
    // Dot controls (apply to selected waypoint)
    this.elements.dotColor.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.dotColor = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    this.elements.dotSize.addEventListener('input', (e) => {
      if (this.selectedWaypoint) {
        this.selectedWaypoint.dotSize = parseInt(e.target.value);
        // Also update waypointSize to keep them in sync
        this.selectedWaypoint.waypointSize = parseInt(e.target.value);
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
    
    // Animation mode toggle
    this.elements.animationMode.addEventListener('change', (e) => {
      this.animationState.mode = e.target.value;
      if (e.target.value === 'constant-speed') {
        this.elements.speedControl.style.display = 'flex';
        this.elements.durationControl.style.display = 'none';
      } else {
        this.elements.speedControl.style.display = 'none';
        this.elements.durationControl.style.display = 'flex';
      }
      this.calculatePath();
    });
    
    // Animation speed/duration controls
    this.elements.animationSpeed.addEventListener('input', (e) => {
      this.animationState.speed = parseInt(e.target.value);
      this.elements.animationSpeedValue.textContent = e.target.value;
      if (this.animationState.mode === 'constant-speed') {
        this.calculatePath();
      }
    });
    
    this.elements.animationDuration.addEventListener('input', (e) => {
      this.animationState.duration = parseFloat(e.target.value) * 1000; // Convert to ms
      this.elements.animationDurationValue.textContent = e.target.value + 's';
      this.autoSave();
    });
    
    // Add waypoint pause mode control (in waypoint editor)
    this.elements.waypointPauseMode.addEventListener('change', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        // Update the selected waypoint's pause mode
        this.selectedWaypoint.pauseMode = e.target.value;
        
        // Show/hide pause time control based on mode
        this.elements.pauseTimeControl.style.display = 
          e.target.value === 'timed' ? 'flex' : 'none';
        
        this.autoSave();
      }
    });
    
    // Waypoint pause time (in waypoint editor)
    this.elements.waypointPauseTime.addEventListener('input', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        // Update the selected waypoint's pause time (in milliseconds)
        this.selectedWaypoint.pauseTime = parseFloat(e.target.value) * 1000;
        this.elements.waypointPauseTimeValue.textContent = e.target.value + 's';
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
      dotColor: this.styles.pathColor,
      dotSize: this.styles.waypointSize,
      waypointSize: this.styles.waypointSize,
      beaconStyle: isMajor ? this.styles.beaconStyle : 'none',
      beaconColor: isMajor ? this.styles.beaconColor : this.styles.beaconColor,
      label: isMajor ? `Waypoint ${this.waypoints.length + 1}` : '',
      labelMode: isMajor ? this.styles.labelMode : 'none',
      labelPosition: this.styles.labelPosition,
      pauseMode: isMajor ? 'timed' : 'none', // Default to 'timed' for major waypoints
      pauseTime: 1500 // in milliseconds
    };
    
    // If there's a previous waypoint, inherit its properties
    const inheritedProps = previousWaypoint ? {
      segmentColor: previousWaypoint.segmentColor,
      segmentWidth: previousWaypoint.segmentWidth,
      segmentStyle: previousWaypoint.segmentStyle,
      dotColor: previousWaypoint.dotColor,
      dotSize: previousWaypoint.dotSize,
      waypointSize: previousWaypoint.waypointSize ?? previousWaypoint.dotSize,
      beaconStyle: isMajor ? (previousWaypoint.beaconStyle || this.styles.beaconStyle) : 'none',
      beaconColor: previousWaypoint.beaconColor || this.styles.beaconColor,
      label: isMajor ? `Waypoint ${this.waypoints.length + 1}` : '',
      labelMode: isMajor ? (previousWaypoint.labelMode || this.styles.labelMode) : 'none',
      labelPosition: previousWaypoint.labelPosition || this.styles.labelPosition,
      pauseMode: isMajor ? (previousWaypoint.pauseMode || 'none') : 'none',
      pauseTime: previousWaypoint.pauseTime || 1500
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
    const threshold = 10; // pixels
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
      
      this.elements.segmentColor.value = this.selectedWaypoint.segmentColor;
      this.elements.segmentWidth.value = this.selectedWaypoint.segmentWidth;
      this.elements.segmentWidthValue.textContent = this.selectedWaypoint.segmentWidth;
      this.elements.segmentStyle.value = this.selectedWaypoint.segmentStyle;
      // Dot fields
      this.elements.dotColor.value = this.selectedWaypoint.dotColor || this.selectedWaypoint.segmentColor || this.styles.pathColor;
      this.elements.dotSize.value = this.selectedWaypoint.dotSize || this.styles.waypointSize;
      this.elements.dotSizeValue.textContent = this.elements.dotSize.value;
      // Waypoint size (per-waypoint)
      this.elements.waypointSize.value = this.selectedWaypoint.waypointSize ?? this.selectedWaypoint.dotSize ?? this.styles.waypointSize;
      this.elements.waypointSizeValue.textContent = this.elements.waypointSize.value;
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
        
        // Pause controls
        this.elements.waypointPauseMode.disabled = false;
        this.elements.waypointPauseTime.disabled = false;
        this.elements.waypointPauseMode.value = this.selectedWaypoint.pauseMode || 'none';
        // Convert pauseTime from ms to seconds for display
        const pauseTimeSec = (this.selectedWaypoint.pauseTime || 1500) / 1000;
        this.elements.waypointPauseTime.value = pauseTimeSec;
        this.elements.waypointPauseTimeValue.textContent = pauseTimeSec + 's';
        // Show/hide pause time based on mode
        this.elements.pauseTimeControl.style.display = 
          this.selectedWaypoint.pauseMode === 'timed' ? 'flex' : 'none';
      } else {
        // Minor waypoints: disable beacon and label controls
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
        this.elements.waypointPauseMode.disabled = true;
        this.elements.waypointPauseTime.disabled = true;
        this.elements.waypointPauseMode.value = 'none';
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
  
  getImageBounds() {
    if (!this.background.image) return null;
    
    const img = this.background.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    
    if (this.background.fit === 'fit') {
      // Fit: image is scaled to fit, may have letterboxing
      const scale = Math.min(cw / iw, ch / ih);
      const dw = Math.round(iw * scale);
      const dh = Math.round(ih * scale);
      const dx = Math.floor((cw - dw) / 2);
      const dy = Math.floor((ch - dh) / 2);
      return { x: dx, y: dy, w: dw, h: dh, scale };
    } else {
      // Fill: image fills canvas, may be cropped
      const scale = Math.max(cw / iw, ch / ih);
      return { x: 0, y: 0, w: cw, h: ch, scale };
    }
  }
  
  canvasToImage(canvasX, canvasY) {
    const bounds = this.getImageBounds();
    if (!bounds) {
      // No image loaded - use normalized canvas coordinates
      const cw = this.displayWidth || this.canvas.width || 1;
      const ch = this.displayHeight || this.canvas.height || 1;
      return { x: canvasX / cw, y: canvasY / ch };
    }
    
    const img = this.background.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    
    if (this.background.fit === 'fit') {
      // In fit mode, calculate position relative to displayed image
      const relX = (canvasX - bounds.x) / bounds.w;
      const relY = (canvasY - bounds.y) / bounds.h;
      // Clamp to 0-1 range
      return { x: Math.max(0, Math.min(1, relX)), y: Math.max(0, Math.min(1, relY)) };
    } else {
      // In fill mode, account for cropping
      const cw = this.displayWidth || this.canvas.width;
      const ch = this.displayHeight || this.canvas.height;
      const sw = cw / bounds.scale;
      const sh = ch / bounds.scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      
      const relX = (canvasX / cw) * (sw / iw) + (sx / iw);
      const relY = (canvasY / ch) * (sh / ih) + (sy / ih);
      // Clamp to 0-1 range
      return { x: Math.max(0, Math.min(1, relX)), y: Math.max(0, Math.min(1, relY)) };
    }
  }
  
  imageToCanvas(imageX, imageY) {
    const bounds = this.getImageBounds();
    if (!bounds) {
      // No image loaded - convert from normalized to canvas
      const cw = this.displayWidth || this.canvas.width || 1;
      const ch = this.displayHeight || this.canvas.height || 1;
      return { x: imageX * cw, y: imageY * ch };
    }
    
    const img = this.background.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    
    if (this.background.fit === 'fit') {
      // In fit mode, scale from normalized to canvas
      const canvasX = bounds.x + imageX * bounds.w;
      const canvasY = bounds.y + imageY * bounds.h;
      return { x: canvasX, y: canvasY };
    } else {
      // In fill mode, account for cropping
      const cw = this.displayWidth || this.canvas.width;
      const ch = this.displayHeight || this.canvas.height;
      const sw = cw / bounds.scale;
      const sh = ch / bounds.scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      
      const canvasX = ((imageX * iw - sx) / sw) * cw;
      const canvasY = ((imageY * ih - sy) / sh) * ch;
      return { x: canvasX, y: canvasY };
    }
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
    
    // Use Catmull-Rom splines with fixed 5% tension for smoother curves
    // Higher resolution for smooth curves (100 points per segment)
    const rawPath = CatmullRom.createPath(canvasWaypoints, 100, this.styles.pathTension);
    
    // Reparameterize by arc length with corner slowing for realistic motion
    this.pathPoints = this.reparameterizeWithCornerSlowing(rawPath, 2); // 2 pixels between points
    
    // Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < this.pathPoints.length; i++) {
      const dx = this.pathPoints[i].x - this.pathPoints[i-1].x;
      const dy = this.pathPoints[i].y - this.pathPoints[i-1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Calculate duration based on animation mode
    if (this.animationState.mode === 'constant-speed') {
      this.animationState.duration = (totalLength / this.animationState.speed) * 1000; // Convert to ms
    }
    // For constant-time mode, duration is already set by the slider
    
    // Update total time display
    this.updateTimeDisplay();
  }
  
  reparameterizeWithCornerSlowing(rawPath, targetSpacing = 2) {
    if (rawPath.length < 2) return rawPath;
    
    // Calculate curvature at each point
    const curvatures = this.calculateCurvature(rawPath);
    
    // Build distance array with velocity modulation based on curvature
    const distances = [0];
    let totalDistance = 0;
    
    for (let i = 1; i < rawPath.length; i++) {
      const dx = rawPath[i].x - rawPath[i-1].x;
      const dy = rawPath[i].y - rawPath[i-1].y;
      const physicalDist = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate velocity factor based on curvature
      // High curvature = slower, low curvature = faster
      const curvature = curvatures[i];
      const maxCurvature = 0.1; // Tune this for more/less slowing
      const minSpeed = 0.4; // Minimum 40% speed at tight corners
      const velocityFactor = Math.max(minSpeed, 1 - (curvature / maxCurvature) * (1 - minSpeed));
      
      // Adjust distance based on velocity (slower = more time = more "distance" in time-space)
      const adjustedDist = physicalDist / velocityFactor;
      totalDistance += adjustedDist;
      distances.push(totalDistance);
    }
    
    // Create evenly-spaced points in adjusted distance space
    const evenPath = [];
    const numPoints = Math.floor(totalDistance / targetSpacing);
    
    for (let i = 0; i <= numPoints; i++) {
      const targetDist = (i / numPoints) * totalDistance;
      
      // Find the segment containing this distance
      let segmentIdx = 0;
      for (let j = 1; j < distances.length; j++) {
        if (distances[j] >= targetDist) {
          segmentIdx = j - 1;
          break;
        }
      }
      
      // Interpolate within the segment
      const segStart = distances[segmentIdx];
      const segEnd = distances[segmentIdx + 1];
      const segLength = segEnd - segStart;
      const t = segLength > 0 ? (targetDist - segStart) / segLength : 0;
      
      const p1 = rawPath[segmentIdx];
      const p2 = rawPath[segmentIdx + 1] || p1;
      
      evenPath.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
      });
    }
    
    return evenPath;
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
  
  // Apply easing based on curvature, but SKIP easing around waypoints with pauses
  // to avoid any flickering or positioning issues
  applyEasing(rawProgress, majorWaypoints) {
    // Default to raw progress if no waypoints
    if (majorWaypoints.length === 0) return rawProgress;
    
    // Find the active segment we're in
    const currentSegmentIndex = this.findSegmentIndexForProgress(rawProgress);
    if (currentSegmentIndex < 0) return rawProgress;
    
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
    
    // Otherwise, continue with normal progress
    return rawProgress;
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
  
  // Check if we need to pause at any waypoint
  checkForWaypointPause(rawProgress, majorWaypoints) {
    // Skip if already paused
    if (this.animationState.isPaused) return;
    
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
    
    for (const wp of majorWaypoints) {
      // Extra careful check for pauseMode property
      const pauseMode = wp.waypoint && wp.waypoint.pauseMode;
      
      // Skip if no pause settings
      if (!wp.waypoint || pauseMode !== 'timed') {
        console.log(`Skipping waypoint ${wp.index} - pauseMode=${pauseMode}`);
        continue;
      }
      
      // We only want to pause when we reach a specific waypoint
      const waypointSegmentIndex = wp.index;
      
      // Handle waypoint positions with a reasonable threshold
      // Using a much larger threshold to ensure we don't miss the waypoint
      const distanceFromWaypoint = Math.abs(rawProgress - wp.progress);
      
      // Only log when we're getting close to the waypoint to avoid spam
      if (distanceFromWaypoint < 0.1) {
        console.log(`Waypoint ${wp.index} check:`, {
          waypointProgress: wp.progress.toFixed(4),
          currentProgress: rawProgress.toFixed(4),
          distance: distanceFromWaypoint.toFixed(4),
          pauseMode: pauseMode,
          already: wp.index === this.animationState.pauseWaypointIndex
        });
      }
      
      // Using much larger threshold (0.02 = 2% of total path) to ensure detection
      const atWaypoint = distanceFromWaypoint < 0.02; 
      const notAlreadyPaused = wp.index !== this.animationState.pauseWaypointIndex; // Haven't paused here yet
      
      const justPassedWaypoint = atWaypoint && notAlreadyPaused;
      
      if (justPassedWaypoint) {
        console.log(`PAUSING at waypoint ${wp.index} (progress ${wp.progress.toFixed(3)})`, wp.waypoint);
        
        // Mark this waypoint as the one we're pausing at
        this.animationState.pauseWaypointIndex = wp.index;
        
        // Pause the animation
        this.animationState.isPaused = true;
        this.animationState.pauseStartTime = performance.now();
        
        // Set end time for timed pause using this waypoint's pause time
        this.animationState.pauseEndTime = 
          this.animationState.pauseStartTime + (wp.waypoint.pauseTime || 1500);
            
        // Announce pause with duration
        const pauseDuration = (wp.waypoint.pauseTime || 1500) / 1000;
        this.announce(`Pausing at waypoint ${wp.index + 1} for ${pauseDuration} seconds`);
        
        // Force exact positioning at waypoint - adjust the actual time as well
        this.animationState.progress = wp.progress;
        this.animationState.currentTime = wp.progress * this.animationState.duration;
        
        // Ensure the path head is exactly at the waypoint
        this.render();
        break;
      }
    }
  }
  
  // Kept for potential future use
  continueAnimation() {
    // Click-to-continue functionality removed
  }
  
  // Easing functions
  easeInQuad(t) { return t * t; }
  easeOutQuad(t) { return t * (2 - t); }
  easeInCubic(t) { return t * t * t; }
  easeOutCubic(t) { return 1 + (--t) * t * t; }
  
  calculateCurvature(path) {
    const curvatures = [];
    
    for (let i = 0; i < path.length; i++) {
      if (i === 0 || i === path.length - 1) {
        // No curvature at endpoints
        curvatures.push(0);
        continue;
      }
      
      // Use three points to estimate curvature
      const p0 = path[i - 1];
      const p1 = path[i];
      const p2 = path[i + 1];
      
      // Calculate vectors
      const v1x = p1.x - p0.x;
      const v1y = p1.y - p0.y;
      const v2x = p2.x - p1.x;
      const v2y = p2.y - p1.y;
      
      // Calculate lengths
      const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
      
      if (len1 === 0 || len2 === 0) {
        curvatures.push(0);
        continue;
      }
      
      // Normalize vectors
      const n1x = v1x / len1;
      const n1y = v1y / len1;
      const n2x = v2x / len2;
      const n2y = v2y / len2;
      
      // Calculate angle change (cross product gives sin of angle)
      const crossProduct = n1x * n2y - n1y * n2x;
      const dotProduct = n1x * n2x + n1y * n2y;
      const angle = Math.atan2(crossProduct, dotProduct);
      
      // Curvature is angle change divided by average segment length
      const avgLen = (len1 + len2) / 2;
      const curvature = avgLen > 0 ? Math.abs(angle) / avgLen : 0;
      
      curvatures.push(curvature);
    }
    
    return curvatures;
  }
  
  play() {
    if (this.waypoints.length < 2) return;
    
    // If animation is finished (at 100%), reset to beginning
    if (this.animationState.progress >= 1.0) {
      this.animationState.progress = 0;
      this.animationState.currentTime = 0;
    }
    
    this.animationState.isPlaying = true;
    this.animationState.lastTime = performance.now();
    
    // Reset any existing pause state
    this.animationState.isPaused = false;
    this.animationState.waitingForClick = false;
    this.animationState.pauseWaypointIndex = -1;
    
    // Update UI
    this.elements.playBtn.style.display = 'none';
    this.elements.pauseBtn.style.display = 'block';
  }
  
  pause() {
    this.animationState.isPlaying = false;
    
    // Reset any existing pause state
    this.animationState.isPaused = false;
    this.animationState.waitingForClick = false;
    
    // Update UI
    this.elements.playBtn.style.display = 'block';
    this.elements.pauseBtn.style.display = 'none';
  }
  
  skipToStart() {
    this.animationState.progress = 0;
    this.animationState.currentTime = 0;
    this.elements.timelineSlider.value = 0;
  }
  
  skipToEnd() {
    this.animationState.progress = 1;
    this.animationState.currentTime = this.animationState.duration;
    this.elements.timelineSlider.value = 1000;
  }
  
  clearAll() {
    this.waypoints = [];
    this.pathPoints = [];
    this.selectedWaypoint = null;
    this.animationState.progress = 0;
    this.animationState.currentTime = 0;
    this.animationState.duration = 0;
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
      localStorage.setItem('routePlotter_hideSplash', 'true');
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
      const data = {
        coordVersion: 6, // Version tracking for coordinate system changes
        waypoints: this.waypoints,
        styles: this.styles,
        animationState: this.animationState,
        background: {
          overlay: this.background.overlay,
          fit: this.background.fit
        }
      };
      localStorage.setItem('routePlotter_autosave', JSON.stringify(data));
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  }

  loadAutosave() {
    try {
      const raw = localStorage.getItem('routePlotter_autosave');
      if (!raw) return;
      const data = JSON.parse(raw);
      
      // Check version - if old version, clear and start fresh
      const COORD_SYSTEM_VERSION = 6; // v6: Changed pause settings from global to per-waypoint
      if (!data.coordVersion || data.coordVersion < COORD_SYSTEM_VERSION) {
        console.log('Old data version detected (v' + (data.coordVersion || 1) + '), clearing saved data for v' + COORD_SYSTEM_VERSION);
        localStorage.removeItem('routePlotter_autosave');
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
        if (this.elements.animationMode) this.elements.animationMode.value = this.animationState.mode;
        if (this.elements.animationSpeed) {
          this.elements.animationSpeed.value = this.animationState.speed;
          this.elements.animationSpeedValue.textContent = String(this.animationState.speed);
        }
        if (this.elements.animationDuration) {
          const durationInSec = this.animationState.duration / 1000;
          this.elements.animationDuration.value = String(durationInSec);
          this.elements.animationDurationValue.textContent = durationInSec + 's';
        }
        
        // Show/hide controls based on mode
        if (this.elements.speedControl && this.elements.durationControl) {
          if (this.animationState.mode === 'constant-speed') {
            this.elements.speedControl.style.display = 'flex';
            this.elements.durationControl.style.display = 'none';
          } else {
            this.elements.speedControl.style.display = 'none';
            this.elements.durationControl.style.display = 'flex';
          }
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
      
      // Update animation if playing
      if (this.animationState.isPlaying) {
        // Calculate delta time with playback speed
        const deltaTime = (currentTime - this.animationState.lastTime) * this.animationState.playbackSpeed;
        this.animationState.lastTime = currentTime;
        
        // Handle waypoint pausing
        if (this.animationState.isPaused) {
          // Check if we need to resume after a timed pause
          if (currentTime >= this.animationState.pauseEndTime) {
            console.log('Pause time complete, resuming animation at', {
              currentTime,
              pauseEndTime: this.animationState.pauseEndTime,
              timeElapsed: currentTime - this.animationState.pauseStartTime
            });
            
            // Resume animation
            this.animationState.isPaused = false;
            this.animationState.pauseWaypointIndex = -1;
            this.announce('Resuming animation');
          } else {
            // Still within pause duration
            const remainingTime = this.animationState.pauseEndTime - currentTime;
            if (remainingTime < 500) { // Log when we're close to resuming
              console.log(`Still paused. Resuming in ${(remainingTime/1000).toFixed(1)}s`);
            }
            return; // Stay paused, don't update animation
          }
        }
        
        // Update progress
        this.animationState.currentTime += deltaTime;
        
        if (this.animationState.currentTime >= this.animationState.duration) {
          this.animationState.currentTime = this.animationState.duration;
          this.animationState.progress = 1;
          this.pause();
        } else {
          // Calculate raw linear progress
          const rawProgress = this.animationState.currentTime / this.animationState.duration;
          
          // Calculate exact positions only - no more easing for now to avoid flickering
          this.animationState.progress = rawProgress;
          
          // Get major waypoints and their positions
          const majorWaypoints = this.getMajorWaypointPositions();
          
          if (majorWaypoints.length > 0) {
            // Check if we need to pause at a waypoint
            // Note: We're checking pause based on raw progress, not eased progress
            this.checkForWaypointPause(rawProgress, majorWaypoints);
          }
        }
        
        // Update timeline slider
        this.elements.timelineSlider.value = this.animationState.progress * 1000;
        
        // Update time display
        this.updateTimeDisplay();
      }
      
      // Always render (for drag feedback, etc.)
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
          segmentStyle: 'solid'
        };
        this.ctx.strokeStyle = controller.segmentColor;
        this.ctx.lineWidth = controller.segmentWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.applyLineStyle(controller.segmentStyle);
        this.ctx.beginPath();
        this.ctx.moveTo(this.pathPoints[i - 1].x, this.pathPoints[i - 1].y);
        this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        this.ctx.stroke();
      }
      this.ctx.setLineDash([]);
      
      // 5) Path head layer
      if (pointsToRender > 1) {
        const head = this.pathPoints[Math.min(pointsToRender - 1, this.pathPoints.length - 1)];
        this.ctx.beginPath();
        this.ctx.fillStyle = '#111';
        this.ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Beacons
    if (this.pathPoints.length > 0) {
      const currentProgress = this.animationState.progress;
      const totalPoints = this.pathPoints.length;
      const currentPointIndex = Math.floor(totalPoints * currentProgress);
      this.waypoints.forEach((waypoint, wpIndex) => {
        if (waypoint.isMajor) {
          const waypointPointIndex = Math.floor((wpIndex / (this.waypoints.length - 1)) * totalPoints);
          if (currentPointIndex >= waypointPointIndex && waypointPointIndex < currentPointIndex + 20) {
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
        const baseSize = waypoint.waypointSize ?? waypoint.dotSize ?? this.styles.waypointSize;
        const size = isSelected ? baseSize * 1.3 : baseSize;
        this.ctx.beginPath();
        this.ctx.fillStyle = waypoint.dotColor || waypoint.segmentColor;
        this.ctx.strokeStyle = isSelected ? '#4a90e2' : 'white';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.arc(wpCanvas.x, wpCanvas.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
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
    const padding = 10; // Distance from dot edge to label
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
      // Recalculate path with proper image bounds now that image is loaded
      if (this.waypoints.length >= 2) {
        this.calculatePath();
      }
      this.render();
      console.log('Default image (UoN_map.png) loaded for dev testing');
    };
    img.onerror = (err) => {
      console.warn('Could not load default image:', err);
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
      
      // Outer glow
      const gradient = this.ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, 15 * pulse
      );
      gradient.addColorStop(0, bColor + 'ff');
      gradient.addColorStop(1, bColor + '00');
      
      this.ctx.beginPath();
      this.ctx.fillStyle = gradient;
      this.ctx.arc(point.x, point.y, 15 * pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Inner dot
      this.ctx.beginPath();
      this.ctx.fillStyle = bColor;
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
    } else if (bStyle === 'ripple') {
      // Add new ripples periodically
      if (Math.random() < 0.03) { // ~3% chance per frame
        this.beaconAnimation.ripples.push({
          scale: 0.8,
          opacity: 1
        });
      }
      
      // Update and draw ripples
      this.beaconAnimation.ripples = this.beaconAnimation.ripples.filter(ripple => {
        ripple.scale += 0.05;
        ripple.opacity -= 0.02;
        
        if (ripple.opacity > 0) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = bColor + Math.floor(ripple.opacity * 255).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 2;
          this.ctx.arc(point.x, point.y, 10 * ripple.scale, 0, Math.PI * 2);
          this.ctx.stroke();
          return true;
        }
        return false;
      });
      
      // Center dot
      this.ctx.beginPath();
      this.ctx.fillStyle = bColor;
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new RoutePlotter();
});
