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
      beaconStyle: 'pulse',
      beaconColor: '#FF6B6B'
    };
    
    // Beacon animation state
    this.beaconAnimation = {
      pulsePhase: 0,
      ripples: []
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
      segmentColor: document.getElementById('segment-color'),
      segmentWidth: document.getElementById('segment-width'),
      segmentWidthValue: document.getElementById('segment-width-value'),
      segmentStyle: document.getElementById('segment-style')
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
    
    // Initial render
    this.render();
    
    // Start animation loop (runs continuously for rendering)
    this.startRenderLoop();
    
    console.log('Route Plotter v3 initialized');
  }
  
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }
  
  setupEventListeners() {
    // Canvas events for waypoint interaction
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    
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
      this.animationState.progress = e.target.value / 100;
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
    
    this.elements.beaconStyle.addEventListener('change', (e) => {
      this.styles.beaconStyle = e.target.value;
      this.beaconAnimation.ripples = []; // Clear ripples when changing style
    });
    
    this.elements.beaconColor.addEventListener('input', (e) => {
      this.styles.beaconColor = e.target.value;
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
      this.dragOffset.x = x - clickedWaypoint.x;
      this.dragOffset.y = y - clickedWaypoint.y;
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
      
      this.selectedWaypoint.x = x - this.dragOffset.x;
      this.selectedWaypoint.y = y - this.dragOffset.y;
      this.hasDragged = true; // Mark that actual dragging occurred
      
      this.calculatePath();
    }
  }
  
  handleMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.classList.remove('dragging');
      this.updateWaypointList();
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
    
    // Add waypoint with default styling
    this.waypoints.push({
      x,
      y,
      isMajor,
      id: Date.now(), // Unique ID for list management
      // Segment styling (from this waypoint to next)
      segmentColor: this.styles.pathColor,
      segmentWidth: this.styles.pathThickness,
      segmentStyle: 'solid'
    });
    
    // Recalculate path if we have enough waypoints
    if (this.waypoints.length >= 2) {
      this.calculatePath();
    }
    
    this.updateWaypointList();
    console.log(`Added ${isMajor ? 'major' : 'minor'} waypoint at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }
  
  findWaypointAt(x, y) {
    const threshold = 10; // pixels
    return this.waypoints.find(wp => {
      const dist = Math.sqrt(Math.pow(wp.x - x, 2) + Math.pow(wp.y - y, 2));
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
      
      item.innerHTML = `
        <span class="waypoint-item-handle">☰</span>
        <span class="waypoint-item-label">Waypoint ${index + 1}</span>
        <button class="waypoint-item-delete">×</button>
      `;
      
      // Make item clickable for selection
      item.addEventListener('click', () => {
        this.selectedWaypoint = waypoint;
        this.updateWaypointList();
        this.updateWaypointEditor();
      });
      
      // Delete button
      item.querySelector('.waypoint-item-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteWaypoint(waypoint);
      });
      
      this.elements.waypointList.appendChild(item);
    });
  }
  
  updateWaypointEditor() {
    if (this.selectedWaypoint) {
      // Show editor and populate values
      this.elements.waypointEditor.style.display = 'block';
      this.elements.segmentColor.value = this.selectedWaypoint.segmentColor;
      this.elements.segmentWidth.value = this.selectedWaypoint.segmentWidth;
      this.elements.segmentWidthValue.textContent = this.selectedWaypoint.segmentWidth;
      this.elements.segmentStyle.value = this.selectedWaypoint.segmentStyle;
    } else {
      // Hide editor
      this.elements.waypointEditor.style.display = 'none';
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
    }
  }
  
  calculatePath() {
    this.pathPoints = [];
    
    if (this.waypoints.length < 2) {
      this.animationState.duration = 0;
      return;
    }
    
    // Use Catmull-Rom splines for smooth curves with tension
    this.pathPoints = CatmullRom.createPath(this.waypoints, 30, this.styles.pathTension);
    
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
    this.elements.timelineSlider.value = 100;
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
        this.elements.timelineSlider.value = this.animationState.progress * 100;
        
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
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw path with per-segment styling
    if (this.pathPoints.length > 0 && this.waypoints.length > 1) {
      const totalPoints = this.pathPoints.length;
      const pointsToRender = Math.floor(totalPoints * this.animationState.progress);
      
      // Calculate which waypoint each path point belongs to
      const pointsPerSegment = Math.floor(totalPoints / (this.waypoints.length - 1));
      
      for (let i = 1; i < pointsToRender; i++) {
        const segmentIndex = Math.min(Math.floor(i / pointsPerSegment), this.waypoints.length - 2);
        const waypoint = this.waypoints[segmentIndex];
        
        // Set segment style
        this.ctx.strokeStyle = waypoint.segmentColor;
        this.ctx.lineWidth = waypoint.segmentWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // Apply line style
        this.applyLineStyle(waypoint.segmentStyle);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.pathPoints[i - 1].x, this.pathPoints[i - 1].y);
        this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        this.ctx.stroke();
      }
      
      // Reset dash
      this.ctx.setLineDash([]);
    }
    
    // Draw beacons on major waypoints that have been passed
    if (this.pathPoints.length > 0 && this.styles.beaconStyle !== 'none') {
      const currentProgress = this.animationState.progress;
      const totalPoints = this.pathPoints.length;
      const currentPointIndex = Math.floor(totalPoints * currentProgress);
      
      this.waypoints.forEach((waypoint, wpIndex) => {
        if (waypoint.isMajor) {
          // Calculate approximate point index for this waypoint
          const waypointPointIndex = Math.floor((wpIndex / (this.waypoints.length - 1)) * totalPoints);
          
          // Show beacon if animation has passed this waypoint
          if (currentPointIndex >= waypointPointIndex && waypointPointIndex < currentPointIndex + 20) {
            this.drawBeacon(waypoint);
          }
        }
      });
    }
    
    // Draw waypoints (only major ones are visible)
    this.waypoints.forEach(waypoint => {
      if (waypoint.isMajor) {
        // Highlight selected waypoint
        const isSelected = waypoint === this.selectedWaypoint;
        const size = isSelected ? this.styles.waypointSize * 1.3 : this.styles.waypointSize;
        
        // Major waypoint - filled circle
        this.ctx.beginPath();
        this.ctx.fillStyle = waypoint.segmentColor;
        this.ctx.strokeStyle = isSelected ? '#4a90e2' : 'white';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.arc(waypoint.x, waypoint.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
      }
      // Minor waypoints are invisible - they just shape the path
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
    if (this.styles.beaconStyle === 'none') return;
    
    if (this.styles.beaconStyle === 'pulse') {
      // Update pulse phase
      this.beaconAnimation.pulsePhase = performance.now() * 0.003;
      
      // Pulsing dot
      const pulse = 1 + Math.sin(this.beaconAnimation.pulsePhase) * 0.3;
      
      // Outer glow
      const gradient = this.ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, 15 * pulse
      );
      gradient.addColorStop(0, this.styles.beaconColor + 'ff');
      gradient.addColorStop(1, this.styles.beaconColor + '00');
      
      this.ctx.beginPath();
      this.ctx.fillStyle = gradient;
      this.ctx.arc(point.x, point.y, 15 * pulse, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Inner dot
      this.ctx.beginPath();
      this.ctx.fillStyle = this.styles.beaconColor;
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
    } else if (this.styles.beaconStyle === 'ripple') {
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
          this.ctx.strokeStyle = this.styles.beaconColor + Math.floor(ripple.opacity * 255).toString(16).padStart(2, '0');
          this.ctx.lineWidth = 2;
          this.ctx.arc(point.x, point.y, 10 * ripple.scale, 0, Math.PI * 2);
          this.ctx.stroke();
          return true;
        }
        return false;
      });
      
      // Center dot
      this.ctx.beginPath();
      this.ctx.fillStyle = this.styles.beaconColor;
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
