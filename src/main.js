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
  
  static createPath(waypoints, pointsPerSegment = 30, tension = 0.5) {
    if (waypoints.length < 2) return [];
    
    const path = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(0, i - 1)];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];
      
      for (let j = 0; j < pointsPerSegment; j++) {
        const t = j / pointsPerSegment;
        path.push(CatmullRom.interpolate(p0, p1, p2, p3, t, tension));
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
      playbackSpeed: 1 // 0.5, 1, or 2
    };
    
    // Style settings
    this.styles = {
      pathColor: '#FF6B6B',
      pathThickness: 3,
      pathTension: 0.75, // Catmull-Rom tension (75% = less smooth)
      waypointSize: 8,
      beaconStyle: 'pulse', // default for new major waypoints
      beaconColor: '#FF6B6B'
    };
    
    // Beacon animation state
    this.beaconAnimation = {
      pulsePhase: 0,
      ripples: []
    };
    
    // Background layer state
    this.background = {
      image: null,
      mask: null,
      overlay: 0,        // -100 (black) .. 0 (none) .. 100 (white)
      fit: 'fit',        // 'fit' | 'fill'
      maskMode: 'mask'   // 'mask' | 'cutout'
    };
    
    // Offscreen canvas for vector layer compositing
    this.vectorCanvas = null;
    
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
      pathColor: document.getElementById('path-color'),
      pathThickness: document.getElementById('path-thickness'),
      pathThicknessValue: document.getElementById('path-thickness-value'),
      waypointSize: document.getElementById('waypoint-size'),
      waypointSizeValue: document.getElementById('waypoint-size-value'),
      beaconStyle: document.getElementById('beacon-style'),
      beaconColor: document.getElementById('beacon-color'),
      // New controls
      animationMode: document.getElementById('animation-mode'),
      animationSpeed: document.getElementById('animation-speed'),
      animationSpeedValue: document.getElementById('animation-speed-value'),
      animationDuration: document.getElementById('animation-duration'),
      animationDurationValue: document.getElementById('animation-duration-value'),
      speedControl: document.getElementById('speed-control'),
      durationControl: document.getElementById('duration-control'),
      pathTension: document.getElementById('path-tension'),
      pathTensionValue: document.getElementById('path-tension-value'),
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
      // Background controls
      bgUploadBtn: document.getElementById('bg-upload-btn'),
      bgUpload: document.getElementById('bg-upload'),
      bgOverlay: document.getElementById('bg-overlay'),
      bgOverlayValue: document.getElementById('bg-overlay-value'),
      bgFit: document.getElementById('bg-fit'),
      bgMaskBtn: document.getElementById('bg-mask-btn'),
      bgMaskUpload: document.getElementById('bg-mask-upload'),
      bgMaskMode: document.getElementById('bg-mask-mode')
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
    
    // Set canvas size to match the display size
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Store the display dimensions for rendering calculations
    // Account for the controls panel overlay
    this.displayWidth = rect.width;
    this.displayHeight = rect.height - controlsHeight;
    
    console.log('Canvas resized to:', rect.width, 'x', rect.height, '(usable height:', this.displayHeight + ')');
    
    // Re-render after resize
    this.render();
  }
  
  setupEventListeners() {
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
    this.elements.pathColor.addEventListener('input', (e) => {
      this.styles.pathColor = e.target.value;
    });
    
    this.elements.pathThickness.addEventListener('input', (e) => {
      this.styles.pathThickness = parseFloat(e.target.value);
      this.elements.pathThicknessValue.textContent = e.target.value;
    });
    
    this.elements.waypointSize.addEventListener('input', (e) => {
      this.styles.waypointSize = parseInt(e.target.value);
      this.elements.waypointSizeValue.textContent = e.target.value;
    });
    
    // Per-waypoint beacon edits (only apply to major waypoints)
    this.elements.editorBeaconStyle.addEventListener('change', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.beaconStyle = e.target.value;
        if (this.selectedWaypoint.beaconStyle !== 'ripple') {
          this.beaconAnimation.ripples = [];
        }
      }
    });
    this.elements.editorBeaconColor.addEventListener('input', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.beaconColor = e.target.value;
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
      }
    });
    
    // Dot controls (major waypoints visible)
    this.elements.dotColor.addEventListener('input', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
        this.selectedWaypoint.dotColor = e.target.value;
        this.render();
        this.autoSave();
      }
    });
    this.elements.dotSize.addEventListener('input', (e) => {
      if (this.selectedWaypoint && this.selectedWaypoint.isMajor) {
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
      this.animationState.duration = parseFloat(e.target.value) * 1000;
      this.elements.animationDurationValue.textContent = e.target.value + 's';
      this.updateTimeDisplay();
    });
    
    // Path tension control
    this.elements.pathTension.addEventListener('input', (e) => {
      this.styles.pathTension = parseInt(e.target.value) / 100;
      this.elements.pathTensionValue.textContent = e.target.value + '%';
      this.calculatePath();
    });
    
    // Background controls
    this.elements.bgUploadBtn.addEventListener('click', () => this.elements.bgUpload.click());
    this.elements.bgUpload.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        this.loadImageFile(file).then((img) => {
          this.background.image = img;
          this.render();
          this.autoSave();
          this.announce('Background image loaded');
        });
      }
    });
    this.elements.bgMaskBtn.addEventListener('click', () => this.elements.bgMaskUpload.click());
    this.elements.bgMaskUpload.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) {
        this.loadImageFile(file).then((img) => {
          this.background.mask = img;
          this.render();
          this.autoSave();
          this.announce('Mask loaded');
        });
      }
    });
    this.elements.bgOverlay.addEventListener('input', (e) => {
      this.background.overlay = parseInt(e.target.value);
      this.elements.bgOverlayValue.textContent = e.target.value;
      this.render();
      this.autoSave();
    });
    this.elements.bgFit.addEventListener('change', (e) => {
      this.background.fit = e.target.value;
      this.render();
      this.autoSave();
    });
    this.elements.bgMaskMode.addEventListener('change', (e) => {
      this.background.maskMode = e.target.value;
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
    
    // Add waypoint with default styling
    this.waypoints.push({
      imgX: imgPos.x,
      imgY: imgPos.y,
      isMajor,
      id: Date.now(), // Unique ID for list management
      // Segment styling (from this waypoint to next)
      segmentColor: this.styles.pathColor,
      segmentWidth: this.styles.pathThickness,
      segmentStyle: 'solid',
      // Dot styling (majors visible)
      dotColor: this.styles.pathColor,
      dotSize: this.styles.waypointSize,
      // Per-waypoint beacon settings (majors only)
      beaconStyle: isMajor ? this.styles.beaconStyle : 'none',
      beaconColor: isMajor ? this.styles.beaconColor : this.styles.beaconColor
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
      // Beacon editor fields
      if (this.selectedWaypoint.isMajor) {
        // Enable dot & beacon controls for major
        this.elements.dotColor.disabled = false;
        this.elements.dotSize.disabled = false;
        this.elements.editorBeaconStyle.disabled = false;
        this.elements.editorBeaconColor.disabled = false;
        this.elements.editorBeaconStyle.value = this.selectedWaypoint.beaconStyle || this.styles.beaconStyle;
        this.elements.editorBeaconColor.value = this.selectedWaypoint.beaconColor || this.styles.beaconColor;
      } else {
        // Minor waypoints: disable beacon controls
        this.elements.dotColor.disabled = true;
        this.elements.dotSize.disabled = true;
        this.elements.editorBeaconStyle.disabled = true;
        this.elements.editorBeaconColor.disabled = true;
        this.elements.editorBeaconStyle.value = 'none';
        this.elements.editorBeaconColor.value = this.styles.beaconColor;
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
      return { x: relX, y: relY };
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
      return { x: relX, y: relY };
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
      return { ...wp, x: canvasPos.x, y: canvasPos.y };
    });
    
    // Use Catmull-Rom splines for smooth curves with tension
    this.pathPoints = CatmullRom.createPath(canvasWaypoints, 30, this.styles.pathTension);
    
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
  
  play() {
    if (this.waypoints.length < 2) return;
    
    this.animationState.isPlaying = true;
    this.animationState.lastTime = performance.now();
    
    // Update UI
    this.elements.playBtn.style.display = 'none';
    this.elements.pauseBtn.style.display = 'block';
  }
  
  pause() {
    this.animationState.isPlaying = false;
    
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
        waypoints: this.waypoints,
        styles: this.styles,
        animationState: {
          mode: this.animationState.mode,
          speed: this.animationState.speed,
          duration: this.animationState.duration
        },
        background: {
          overlay: this.background.overlay,
          fit: this.background.fit,
          aspect: this.background.aspect,
          maskMode: this.background.maskMode
        },
        timestamp: Date.now()
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
      if (data.waypoints && Array.isArray(data.waypoints)) {
        this.waypoints = data.waypoints;
      }
      if (data.styles) {
        this.styles = { ...this.styles, ...data.styles };
      }
      if (data.animationState) {
        this.animationState = { ...this.animationState, ...data.animationState };
      }
      if (data.background) {
        this.background.overlay = data.background.overlay ?? this.background.overlay;
        this.background.fit = data.background.fit ?? this.background.fit;
        this.background.aspect = data.background.aspect ?? this.background.aspect;
        this.background.maskMode = data.background.maskMode ?? this.background.maskMode;
        // Reflect in UI if controls exist
        if (this.elements.bgOverlay) {
          this.elements.bgOverlay.value = String(this.background.overlay);
          this.elements.bgOverlayValue.textContent = String(this.background.overlay);
        }
        if (this.elements.bgFit) this.elements.bgFit.value = this.background.fit;
        if (this.elements.bgAspect) this.elements.bgAspect.value = this.background.aspect;
        if (this.elements.bgMaskMode) this.elements.bgMaskMode.value = this.background.maskMode;
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
        
        // Update progress
        this.animationState.currentTime += deltaTime;
        
        if (this.animationState.currentTime >= this.animationState.duration) {
          this.animationState.currentTime = this.animationState.duration;
          this.animationState.progress = 1;
          this.pause();
        } else {
          this.animationState.progress = this.animationState.currentTime / this.animationState.duration;
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
    
    // Clear
    ctx.clearRect(0, 0, cw, ch);
    
    // 1) Base image
    this.renderBackground(ctx);
    // 2) Contrast overlay
    this.renderOverlay(ctx);
    
    // 3-6) Vector + head + UI handles on offscreen, then mask compositing
    const vCanvas = this.getVectorCanvas();
    const vctx = vCanvas.getContext('2d');
    vctx.clearRect(0, 0, vCanvas.width, vCanvas.height);
    this.renderVectorLayerTo(vctx);
    
    // Mask compositing
    if (this.background.mask) {
      vctx.save();
      vctx.globalCompositeOperation = this.background.maskMode === 'cutout' ? 'destination-out' : 'destination-in';
      const rect = this.getAspectRect();
      vctx.drawImage(this.background.mask, rect.x, rect.y, rect.w, rect.h);
      vctx.restore();
    }
    
    // Blit vector layer to main
    ctx.drawImage(vCanvas, 0, 0);
  }

  // ----- Layer helpers -----
  getVectorCanvas() {
    if (!this.vectorCanvas) {
      this.vectorCanvas = document.createElement('canvas');
    }
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    if (this.vectorCanvas.width !== cw || this.vectorCanvas.height !== ch) {
      this.vectorCanvas.width = cw;
      this.vectorCanvas.height = ch;
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
        const baseSize = waypoint.dotSize || this.styles.waypointSize;
        const size = isSelected ? baseSize * 1.3 : baseSize;
        this.ctx.beginPath();
        this.ctx.fillStyle = waypoint.dotColor || waypoint.segmentColor;
        this.ctx.strokeStyle = isSelected ? '#4a90e2' : 'white';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.arc(wpCanvas.x, wpCanvas.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
      }
    });
    this.ctx = orig;
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
