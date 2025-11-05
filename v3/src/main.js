// Catmull-Rom spline implementation
class CatmullRom {
  static interpolate(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    
    return {
      x: 0.5 * ((2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  }
  
  static createPath(waypoints, pointsPerSegment = 30) {
    if (waypoints.length < 2) return [];
    
    const path = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(0, i - 1)];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];
      
      for (let j = 0; j < pointsPerSegment; j++) {
        const t = j / pointsPerSegment;
        path.push(CatmullRom.interpolate(p0, p1, p2, p3, t));
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
    
    // Animation state
    this.animationState = {
      isPlaying: false,
      progress: 0, // 0 to 1
      currentTime: 0, // in milliseconds
      duration: 5000, // default 5 seconds
      speed: 200, // pixels per second
    };
    
    // Style settings
    this.styles = {
      pathColor: '#FF6B6B',
      pathThickness: 3,
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
      beaconColor: document.getElementById('beacon-color')
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
    
    // Start render loop
    this.animate();
    
    console.log('Route Plotter v3 initialized');
  }
  
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }
  
  setupEventListeners() {
    // Canvas click for adding waypoints
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
    
    // Splash screen
    this.elements.splashClose.addEventListener('click', () => this.hideSplash());
    this.elements.splash.addEventListener('click', (e) => {
      if (e.target === this.elements.splash) {
        this.hideSplash();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.animationState.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      }
    });
  }
  
  handleCanvasClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Determine if major or minor waypoint
    const isMajor = !event.shiftKey;
    
    // Add waypoint
    this.waypoints.push({
      x,
      y,
      isMajor,
      id: Date.now()
    });
    
    // Recalculate path if we have enough waypoints
    if (this.waypoints.length >= 2) {
      this.calculatePath();
    }
    
    console.log(`Added ${isMajor ? 'major' : 'minor'} waypoint at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }
  
  calculatePath() {
    this.pathPoints = [];
    
    if (this.waypoints.length < 2) {
      this.animationState.duration = 0;
      return;
    }
    
    // Use Catmull-Rom splines for smooth curves
    this.pathPoints = CatmullRom.createPath(this.waypoints);
    
    // Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < this.pathPoints.length; i++) {
      const dx = this.pathPoints[i].x - this.pathPoints[i-1].x;
      const dy = this.pathPoints[i].y - this.pathPoints[i-1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    // Calculate duration based on fixed speed
    this.animationState.duration = (totalLength / this.animationState.speed) * 1000; // Convert to ms
    
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
    this.animationState.progress = 0;
    this.animationState.currentTime = 0;
    this.animationState.duration = 5000;
    this.pause();
    this.elements.timelineSlider.value = 0;
    this.updateTimeDisplay();
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
  
  animate() {
    const now = performance.now();
    
    // Update animation state if playing
    if (this.animationState.isPlaying && this.pathPoints.length > 0) {
      const deltaTime = now - (this.animationState.lastTime || now);
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
      
      this.animationState.lastTime = now;
    }
    
    // Update time display
    this.updateTimeDisplay();
    
    // Render
    this.render();
    
    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw path (up to current progress)
    if (this.pathPoints.length > 0) {
      const pointsToRender = Math.floor(this.pathPoints.length * this.animationState.progress);
      
      if (pointsToRender > 0) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.styles.pathColor;
        this.ctx.lineWidth = this.styles.pathThickness;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        
        for (let i = 1; i < pointsToRender; i++) {
          this.ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        
        this.ctx.stroke();
        
        // Draw beacon at current position
        if (pointsToRender > 0 && pointsToRender < this.pathPoints.length) {
          const currentPoint = this.pathPoints[pointsToRender - 1];
          this.drawBeacon(currentPoint);
        }
      }
    }
    
    // Draw waypoints (only major ones are visible)
    this.waypoints.forEach(waypoint => {
      if (waypoint.isMajor) {
        // Major waypoint - filled circle
        this.ctx.beginPath();
        this.ctx.fillStyle = this.styles.pathColor;
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.arc(waypoint.x, waypoint.y, this.styles.waypointSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
      }
      // Minor waypoints are invisible - they just shape the path
    });
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
