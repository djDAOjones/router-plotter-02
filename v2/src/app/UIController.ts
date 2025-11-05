import type { Application } from './Application';
import type { Project, PathTrack, LabelTrack } from '../types';

/**
 * Manages UI interactions and updates
 */
export class UIController {
  private app: Application;
  private activeTrack: 'path' | 'camera' | 'labels' = 'path';
  private elements: UIElements = {} as UIElements;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Initialize UI event handlers
   */
  initialize(): void {
    this.cacheElements();
    this.setupEventHandlers();
    this.setupKeyboardShortcuts();
  }

  /**
   * Cache DOM elements
   */
  private cacheElements(): void {
    this.elements = {
      // Header controls
      helpBtn: document.getElementById('help-btn') as HTMLButtonElement,
      newProjectBtn: document.getElementById('new-project') as HTMLButtonElement,
      openProjectBtn: document.getElementById('open-project') as HTMLButtonElement,
      saveProjectBtn: document.getElementById('save-project') as HTMLButtonElement,
      exportVideoBtn: document.getElementById('export-video') as HTMLButtonElement,
      
      // Track tabs
      trackTabs: document.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>,
      trackPanels: document.querySelectorAll('.track-panel') as NodeListOf<HTMLDivElement>,
      
      // Path controls
      timingMode: document.getElementById('timing-mode') as HTMLSelectElement,
      pathColor: document.getElementById('path-color') as HTMLInputElement,
      pathWidth: document.getElementById('path-width') as HTMLInputElement,
      pauseMode: document.getElementById('pause-mode') as HTMLSelectElement,
      waypointList: document.getElementById('waypoint-items') as HTMLDivElement,
      
      // Camera controls
      cameraAutoframe: document.getElementById('camera-autoframe') as HTMLInputElement,
      cameraMargin: document.getElementById('camera-margin') as HTMLInputElement,
      zoomMin: document.getElementById('zoom-min') as HTMLInputElement,
      zoomMax: document.getElementById('zoom-max') as HTMLInputElement,
      
      // Label controls
      labelMode: document.getElementById('label-mode') as HTMLSelectElement,
      labelAnchor: document.getElementById('label-anchor') as HTMLSelectElement,
      addLabelBtn: document.getElementById('add-label') as HTMLButtonElement,
      labelList: document.getElementById('label-items') as HTMLDivElement,
      
      // Timeline controls
      playBtn: document.getElementById('play-btn') as HTMLButtonElement,
      pauseBtn: document.getElementById('pause-btn') as HTMLButtonElement,
      startBtn: document.getElementById('start-btn') as HTMLButtonElement,
      endBtn: document.getElementById('end-btn') as HTMLButtonElement,
      speed05xBtn: document.getElementById('speed-05x') as HTMLButtonElement,
      speed1xBtn: document.getElementById('speed-1x') as HTMLButtonElement,
      speed2xBtn: document.getElementById('speed-2x') as HTMLButtonElement,
      timelineSlider: document.getElementById('timeline-slider') as HTMLInputElement,
      currentTime: document.getElementById('current-time') as HTMLSpanElement,
      totalTime: document.getElementById('total-time') as HTMLSpanElement,
      
      // Canvas
      canvas: document.getElementById('main-canvas') as HTMLCanvasElement,
      interactionOverlay: document.getElementById('interaction-overlay') as HTMLDivElement,
    };
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    // Header controls
    this.elements.helpBtn.addEventListener('click', () => this.showHelp());
    this.elements.newProjectBtn.addEventListener('click', () => this.app.newProject());
    this.elements.openProjectBtn.addEventListener('click', () => this.openFile());
    this.elements.saveProjectBtn.addEventListener('click', () => this.app.saveProject());
    this.elements.exportVideoBtn.addEventListener('click', () => this.app.exportVideo());
    
    // Track tabs
    this.elements.trackTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const track = tab.dataset.track as 'path' | 'camera' | 'labels';
        this.switchTrack(track);
      });
    });
    
    // Timeline controls
    this.elements.playBtn.addEventListener('click', () => {
      this.app.play();
      this.elements.playBtn.style.display = 'none';
      this.elements.pauseBtn.style.display = 'block';
    });
    
    this.elements.pauseBtn.addEventListener('click', () => {
      this.app.pause();
      this.elements.pauseBtn.style.display = 'none';
      this.elements.playBtn.style.display = 'block';
    });
    
    this.elements.startBtn.addEventListener('click', () => {
      this.app.seekToProgress(0);
    });
    
    this.elements.endBtn.addEventListener('click', () => {
      this.app.seekToProgress(1);
    });
    
    // Speed controls
    this.elements.speed05xBtn.addEventListener('click', () => {
      this.setSpeed(0.5);
    });
    
    this.elements.speed1xBtn.addEventListener('click', () => {
      this.setSpeed(1);
    });
    
    this.elements.speed2xBtn.addEventListener('click', () => {
      this.setSpeed(2);
    });
    
    // Timeline slider
    this.elements.timelineSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.app.seekToProgress(value / 200);
    });
    
    // Canvas click handler
    this.elements.canvas.addEventListener('click', (e) => {
      this.app.handleCanvasClick(e);
    });
    
    // Path controls
    this.elements.pathColor.addEventListener('change', () => {
      this.updatePathStyle();
    });
    
    this.elements.pathWidth.addEventListener('change', () => {
      this.updatePathStyle();
    });
    
    this.elements.timingMode.addEventListener('change', () => {
      this.updateTimingConfig();
    });
    
    this.elements.pauseMode.addEventListener('change', () => {
      this.updateTimingConfig();
    });
    
    // Animation frame updates
    requestAnimationFrame(() => this.updateUI());
  }

  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Space: Play/pause
      if (e.code === 'Space' && !this.isInputFocused()) {
        e.preventDefault();
        if (this.app.getAnimationState().isPlaying) {
          this.app.pause();
          this.elements.pauseBtn.style.display = 'none';
          this.elements.playBtn.style.display = 'block';
        } else {
          this.app.play();
          this.elements.playBtn.style.display = 'none';
          this.elements.pauseBtn.style.display = 'block';
        }
      }
      
      // J: 0.5x speed
      if (e.code === 'KeyJ' && !this.isInputFocused()) {
        this.setSpeed(0.5);
      }
      
      // K: 1x speed
      if (e.code === 'KeyK' && !this.isInputFocused()) {
        this.setSpeed(1);
      }
      
      // L: 2x speed
      if (e.code === 'KeyL' && !this.isInputFocused()) {
        this.setSpeed(2);
      }
      
      // Escape: Cancel operations
      if (e.code === 'Escape') {
        // Cancel current drag or edit operation
      }
    });
  }

  /**
   * Check if an input element is focused
   */
  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement instanceof HTMLInputElement ||
           activeElement instanceof HTMLTextAreaElement ||
           activeElement instanceof HTMLSelectElement;
  }

  /**
   * Switch active track tab
   */
  private switchTrack(track: 'path' | 'camera' | 'labels'): void {
    this.activeTrack = track;
    
    // Update tabs
    this.elements.trackTabs.forEach(tab => {
      if (tab.dataset.track === track) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update panels
    this.elements.trackPanels.forEach(panel => {
      const panelId = panel.id;
      if (panelId === `${track}-controls`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }

  /**
   * Set playback speed
   */
  private setSpeed(speed: number): void {
    this.app.setSpeed(speed);
    
    // Update button states
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (speed === 0.5) {
      this.elements.speed05xBtn.classList.add('active');
    } else if (speed === 1) {
      this.elements.speed1xBtn.classList.add('active');
    } else if (speed === 2) {
      this.elements.speed2xBtn.classList.add('active');
    }
  }

  /**
   * Open file dialog
   */
  private openFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.json';
    
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          await this.app.loadProject(file);
        } catch (error) {
          console.error('Failed to load project:', error);
          alert('Failed to load project. Please check the file format.');
        }
      }
    });
    
    input.click();
  }

  /**
   * Update path style from UI
   */
  private updatePathStyle(): void {
    const project = this.app.getProject();
    if (!project) return;
    
    const pathTrack = project.tracks.find(t => t.type === 'path') as PathTrack | undefined;
    if (!pathTrack) return;
    
    pathTrack.style.strokeColor = this.elements.pathColor.value;
    pathTrack.style.strokeWidth = parseInt(this.elements.pathWidth.value);
  }

  /**
   * Update timing config from UI
   */
  private updateTimingConfig(): void {
    const project = this.app.getProject();
    if (!project) return;
    
    const pathTrack = project.tracks.find(t => t.type === 'path') as PathTrack | undefined;
    if (!pathTrack) return;
    
    pathTrack.timing.mode = this.elements.timingMode.value as 'constantSpeed' | 'constantTime';
    pathTrack.timing.pauseMode = this.elements.pauseMode.value as 'none' | 'seconds' | 'click';
  }

  /**
   * Update UI from project
   */
  updateFromProject(project: Project): void {
    // Update path controls
    const pathTrack = project.tracks.find(t => t.type === 'path') as PathTrack | undefined;
    if (pathTrack) {
      this.elements.pathColor.value = pathTrack.style.strokeColor;
      this.elements.pathWidth.value = pathTrack.style.strokeWidth.toString();
      this.elements.timingMode.value = pathTrack.timing.mode;
      this.elements.pauseMode.value = pathTrack.timing.pauseMode;
      
      this.updateWaypointList(pathTrack);
    }
    
    // Update label controls
    const labelTrack = project.tracks.find(t => t.type === 'labels') as LabelTrack | undefined;
    if (labelTrack) {
      this.elements.labelMode.value = labelTrack.mode;
      this.elements.labelAnchor.value = labelTrack.anchor;
      
      this.updateLabelList(labelTrack);
    }
  }

  /**
   * Update waypoint list UI
   */
  private updateWaypointList(track: PathTrack): void {
    this.elements.waypointList.innerHTML = '';
    
    track.waypoints.forEach((wp, index) => {
      const item = document.createElement('div');
      item.className = `waypoint-item ${wp.isMajor ? 'major' : ''}`;
      item.innerHTML = `
        <span>Waypoint ${index + 1} ${wp.isMajor ? '(Major)' : ''}</span>
        <button class="btn-icon" data-id="${wp.id}">×</button>
      `;
      
      const deleteBtn = item.querySelector('button');
      deleteBtn?.addEventListener('click', () => {
        track.waypoints = track.waypoints.filter(w => w.id !== wp.id);
        this.updateWaypointList(track);
      });
      
      this.elements.waypointList.appendChild(item);
    });
  }

  /**
   * Update label list UI
   */
  private updateLabelList(track: LabelTrack): void {
    this.elements.labelList.innerHTML = '';
    
    track.items.forEach(label => {
      const item = document.createElement('div');
      item.className = 'label-item';
      item.innerHTML = `
        <span>${label.text}</span>
        <button class="btn-icon" data-id="${label.id}">×</button>
      `;
      
      const deleteBtn = item.querySelector('button');
      deleteBtn?.addEventListener('click', () => {
        track.items = track.items.filter(l => l.id !== label.id);
        this.updateLabelList(track);
      });
      
      this.elements.labelList.appendChild(item);
    });
  }

  /**
   * Update UI continuously
   */
  private updateUI = (): void => {
    const state = this.app.getAnimationState();
    
    // Update timeline slider
    this.elements.timelineSlider.value = state.currentStep.toString();
    
    // Update time display  
    const currentSeconds = (state.currentTime / 1000) || 0;
    // Get actual duration from the animation engine
    const totalSeconds = ((this.app as any).getAnimationDuration?.() / 1000) || 10;
    
    this.elements.currentTime.textContent = this.formatTime(currentSeconds);
    this.elements.totalTime.textContent = this.formatTime(totalSeconds);
    
    // Update play/pause button visibility based on state
    if (state.isPlaying) {
      this.elements.playBtn.style.display = 'none';
      this.elements.pauseBtn.style.display = 'block';
    } else {
      this.elements.playBtn.style.display = 'block';
      this.elements.pauseBtn.style.display = 'none';
    }
    
    requestAnimationFrame(this.updateUI);
  };

  /**
   * Format time in MM:SS
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get active track type
   */
  getActiveTrack(): 'path' | 'camera' | 'labels' {
    return this.activeTrack;
  }

  /**
   * Show help splash screen
   */
  private showHelp(): void {
    // Call the Application's showHelp method
    (this.app as any).showHelp?.();
  }
}

interface UIElements {
  // Header controls
  helpBtn: HTMLButtonElement;
  newProjectBtn: HTMLButtonElement;
  openProjectBtn: HTMLButtonElement;
  saveProjectBtn: HTMLButtonElement;
  exportVideoBtn: HTMLButtonElement;
  
  // Track tabs
  trackTabs: NodeListOf<HTMLButtonElement>;
  trackPanels: NodeListOf<HTMLDivElement>;
  
  // Path controls
  timingMode: HTMLSelectElement;
  pathColor: HTMLInputElement;
  pathWidth: HTMLInputElement;
  pauseMode: HTMLSelectElement;
  waypointList: HTMLDivElement;
  
  // Camera controls
  cameraAutoframe: HTMLInputElement;
  cameraMargin: HTMLInputElement;
  zoomMin: HTMLInputElement;
  zoomMax: HTMLInputElement;
  
  // Label controls
  labelMode: HTMLSelectElement;
  labelAnchor: HTMLSelectElement;
  addLabelBtn: HTMLButtonElement;
  labelList: HTMLDivElement;
  
  // Timeline controls
  playBtn: HTMLButtonElement;
  pauseBtn: HTMLButtonElement;
  startBtn: HTMLButtonElement;
  endBtn: HTMLButtonElement;
  speed05xBtn: HTMLButtonElement;
  speed1xBtn: HTMLButtonElement;
  speed2xBtn: HTMLButtonElement;
  timelineSlider: HTMLInputElement;
  currentTime: HTMLSpanElement;
  totalTime: HTMLSpanElement;
  
  // Canvas
  canvas: HTMLCanvasElement;
  interactionOverlay: HTMLDivElement;
}
