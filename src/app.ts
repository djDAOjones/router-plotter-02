/**
 * MVP Application Class for Route Plotter v2.0
 * Simplified version with core functionality only
 */

import {
  PathTrack,
  Waypoint,
  Point,
  Asset,
  AnimationState,
  DEFAULT_COLORS
} from './types';
import { Renderer } from './renderer';
import { AnimationController } from './timing';
import { pointInCircle } from './geometry';

export class App {
  // DOM Elements
  private canvas!: HTMLCanvasElement;
  private splashScreen!: HTMLElement;
  private imageInput!: HTMLInputElement;
  private waypointList!: HTMLElement;
  private timelineScrubber!: HTMLInputElement;
  private currentTimeSpan!: HTMLElement;
  private totalTimeSpan!: HTMLElement;
  private speedDisplay!: HTMLElement;
  private playButton!: HTMLButtonElement;
  
  // Core components
  private renderer!: Renderer;
  private animationController!: AnimationController;
  
  // Application state
  private pathTrack: PathTrack | null = null;
  private selectedWaypoint: Waypoint | null = null;
  private isDragging = false;
  private dragOffset: Point = { x: 0, y: 0 };
  private currentProgress = 0;
  private playbackSpeed = 1;

  /**
   * Initialize the application
   */
  init(): void {
    this.initializeDOMElements();
    this.initializeComponents();
    this.attachEventListeners();
    this.createDefaultProject();
    this.hideSplash();
  }

  /**
   * Initialize DOM element references
   */
  private initializeDOMElements(): void {
    this.canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas element not found');
    
    this.splashScreen = document.getElementById('splash')!;
    this.imageInput = document.getElementById('image-input') as HTMLInputElement;
    this.waypointList = document.getElementById('waypoint-list')!;
    this.timelineScrubber = document.getElementById('timeline-scrubber') as HTMLInputElement;
    this.currentTimeSpan = document.getElementById('current-time')!;
    this.totalTimeSpan = document.getElementById('total-time')!;
    this.speedDisplay = document.getElementById('speed-display')!;
    this.playButton = document.getElementById('play-btn') as HTMLButtonElement;
  }

  /**
   * Initialize core components
   */
  private initializeComponents(): void {
    this.renderer = new Renderer(this.canvas);
    
    this.animationController = new AnimationController();
    this.animationController.setOnFrame((progress, state) => {
      this.onAnimationFrame(progress, state);
    });
    this.animationController.setOnEnded(() => {
      this.updatePlaybackUI();
    });
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Splash screen
    document.getElementById('close-splash')?.addEventListener('click', () => this.hideSplash());
    document.getElementById('help-btn')?.addEventListener('click', () => this.showSplash());
    
    // Image upload
    const uploadArea = document.getElementById('image-upload');
    uploadArea?.addEventListener('click', () => this.imageInput.click());
    this.imageInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.loadImage(file);
    });
    
    // Drag and drop
    uploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      document.getElementById('drop-overlay')!.style.display = 'flex';
    });
    
    uploadArea?.addEventListener('dragleave', () => {
      document.getElementById('drop-overlay')!.style.display = 'none';
    });
    
    uploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      document.getElementById('drop-overlay')!.style.display = 'none';
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith('image/')) {
        this.loadImage(file);
      }
    });
    
    // Canvas interactions
    this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.onCanvasMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onCanvasMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onCanvasMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onCanvasMouseUp());
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    
    // Playback controls
    this.playButton.addEventListener('click', () => this.togglePlayback());
    document.getElementById('start-btn')?.addEventListener('click', () => this.seekToStart());
    document.getElementById('end-btn')?.addEventListener('click', () => this.seekToEnd());
    
    this.timelineScrubber.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.animationController.seekToStep(value);
    });
    
    document.getElementById('speed-up')?.addEventListener('click', () => this.changeSpeed(1));
    document.getElementById('speed-down')?.addEventListener('click', () => this.changeSpeed(-1));
    
    // Style controls
    this.attachStyleControlListeners();
    
    // Window resize
    window.addEventListener('resize', () => {
      this.renderer.resize();
      this.render();
    });
  }

  /**
   * Attach style control listeners
   */
  private attachStyleControlListeners(): void {
    // Path color
    document.getElementById('stroke-color')?.addEventListener('change', (e) => {
      if (this.pathTrack) {
        this.pathTrack.style.strokeColor = (e.target as HTMLInputElement).value;
        this.render();
      }
    });
    
    // Path width
    document.getElementById('stroke-width')?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      const display = (e.target as HTMLElement)?.parentElement?.querySelector('.range-value');
      if (display) display.textContent = `${value}px`;
      
      if (this.pathTrack) {
        this.pathTrack.style.strokeWidth = value;
        this.render();
      }
    });
    
    // Path style
    document.getElementById('path-style')?.addEventListener('change', (e) => {
      if (this.pathTrack) {
        this.pathTrack.style.strokeVariant = (e.target as HTMLSelectElement).value as any;
        this.render();
      }
    });
    
    // Contrast overlay
    document.getElementById('contrast-overlay')?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      const display = (e.target as HTMLElement)?.parentElement?.querySelector('.range-value');
      if (display) display.textContent = `${value}%`;
      this.render();
    });
  }

  /**
   * Create default project
   */
  private createDefaultProject(): void {
    this.pathTrack = {
      id: 'main-path',
      type: 'path',
      name: 'Primary Route',
      visible: true,
      locked: false,
      waypoints: [],
      style: {
        strokeColor: DEFAULT_COLORS.path,
        strokeWidth: 3,
        strokeVariant: 'solid',
        waypointShape: 'circle',
        pathHead: 'arrow',
        waypointAnimation: 'none'
      },
      timing: {
        mode: 'constant-speed',
        baseSpeedPxPerSec: 200,
        segmentTime: 2,
        pauseMode: 'none',
        pauseSeconds: 2,
        easeInOut: true
      },
      smoothing: {
        tension: 0.5,
        alpha: 0.5,
        segments: 100
      },
      maskMode: false
    };
    
    this.animationController.setPathTrack(this.pathTrack);
    this.render();
  }

  /**
   * Load image from file
   */
  private async loadImage(file: File): Promise<void> {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      
      const asset: Asset = {
        id: 'base-image',
        type: 'image',
        name: file.name,
        path: '',
        data: dataUrl,
        metadata: { size: file.size }
      };
      
      try {
        await this.renderer.loadBaseImage(asset);
        this.render();
        
        // Update UI
        const uploadArea = document.getElementById('image-upload');
        if (uploadArea) {
          uploadArea.classList.add('has-image');
          const placeholder = uploadArea.querySelector('.upload-placeholder');
          if (placeholder) {
            placeholder.innerHTML = `
              <img src="${dataUrl}" style="max-width: 100%; max-height: 200px; object-fit: contain;">
              <p style="margin-top: 8px; font-size: 12px;">${file.name}</p>
            `;
          }
        }
      } catch (error) {
        console.error('Failed to load image:', error);
        alert('Failed to load image');
      }
    };
    
    reader.readAsDataURL(file);
  }

  /**
   * Canvas click handler
   */
  private onCanvasClick(e: MouseEvent): void {
    if (this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const imagePoint = this.renderer.canvasToImage(canvasPoint);
    
    if (!imagePoint) return;
    
    // Add waypoint
    this.addWaypoint(imagePoint, !e.shiftKey);
  }

  /**
   * Canvas mouse down handler
   */
  private onCanvasMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const canvasPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const imagePoint = this.renderer.canvasToImage(canvasPoint);
    
    if (!imagePoint || !this.pathTrack) return;
    
    // Check if clicking on a waypoint
    for (const waypoint of this.pathTrack.waypoints) {
      if (pointInCircle(imagePoint, waypoint, 10)) {
        this.selectWaypoint(waypoint);
        this.isDragging = true;
        this.dragOffset = {
          x: imagePoint.x - waypoint.x,
          y: imagePoint.y - waypoint.y
        };
        this.canvas.classList.add('dragging');
        break;
      }
    }
  }

  /**
   * Canvas mouse move handler
   */
  private onCanvasMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.selectedWaypoint) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const canvasPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const imagePoint = this.renderer.canvasToImage(canvasPoint);
    
    if (!imagePoint) return;
    
    this.selectedWaypoint.x = imagePoint.x - this.dragOffset.x;
    this.selectedWaypoint.y = imagePoint.y - this.dragOffset.y;
    
    if (this.pathTrack) {
      this.animationController.setPathTrack(this.pathTrack);
    }
    
    this.updateWaypointList();
    this.render();
  }

  /**
   * Canvas mouse up handler
   */
  private onCanvasMouseUp(): void {
    this.isDragging = false;
    this.canvas.classList.remove('dragging');
  }

  /**
   * Key down handler
   */
  private onKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Space') {
      e.preventDefault();
      this.togglePlayback();
    } else if (e.code === 'Escape' && this.selectedWaypoint) {
      this.selectedWaypoint = null;
      this.updateWaypointList();
    } else if ((e.code === 'Delete' || e.code === 'Backspace') && this.selectedWaypoint) {
      e.preventDefault();
      this.deleteSelectedWaypoint();
    }
  }

  /**
   * Add waypoint
   */
  private addWaypoint(point: Point, isMajor: boolean): void {
    if (!this.pathTrack) return;
    
    const waypoint: Waypoint = {
      id: `wp-${Date.now()}`,
      x: point.x,
      y: point.y,
      isMajor
    };
    
    this.pathTrack.waypoints.push(waypoint);
    this.animationController.setPathTrack(this.pathTrack);
    
    this.updateWaypointList();
    this.updateTimeline();
    this.render();
  }

  /**
   * Select waypoint
   */
  private selectWaypoint(waypoint: Waypoint): void {
    this.selectedWaypoint = waypoint;
    this.updateWaypointList();
  }

  /**
   * Delete selected waypoint
   */
  private deleteSelectedWaypoint(): void {
    if (!this.selectedWaypoint || !this.pathTrack) return;
    
    const index = this.pathTrack.waypoints.indexOf(this.selectedWaypoint);
    if (index !== -1) {
      this.pathTrack.waypoints.splice(index, 1);
      this.selectedWaypoint = null;
      
      this.animationController.setPathTrack(this.pathTrack);
      this.updateWaypointList();
      this.updateTimeline();
      this.render();
    }
  }

  /**
   * Update waypoint list UI
   */
  private updateWaypointList(): void {
    if (!this.pathTrack || this.pathTrack.waypoints.length === 0) {
      this.waypointList.innerHTML = '<div class="empty-state">No waypoints yet</div>';
      return;
    }
    
    this.waypointList.innerHTML = this.pathTrack.waypoints.map(waypoint => {
      const isSelected = waypoint === this.selectedWaypoint;
      const typeClass = waypoint.isMajor ? 'major' : 'minor';
      
      return `
        <div class="waypoint-item ${typeClass} ${isSelected ? 'selected' : ''}" data-id="${waypoint.id}">
          <span class="waypoint-label">${waypoint.isMajor ? 'Major' : 'Minor'} Waypoint</span>
          <span class="waypoint-coords">(${Math.round(waypoint.x)}, ${Math.round(waypoint.y)})</span>
          <button class="waypoint-delete" data-id="${waypoint.id}">×</button>
        </div>
      `;
    }).join('');
    
    // Add event listeners
    const items = this.waypointList.querySelectorAll('.waypoint-item');
    items.forEach(item => {
      const id = (item as HTMLElement).dataset.id;
      const waypoint = this.pathTrack!.waypoints.find(w => w.id === id);
      if (waypoint) {
        item.addEventListener('click', () => this.selectWaypoint(waypoint));
      }
    });
    
    const deleteButtons = this.waypointList.querySelectorAll('.waypoint-delete');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.id;
        const waypoint = this.pathTrack!.waypoints.find(w => w.id === id);
        if (waypoint) {
          this.selectedWaypoint = waypoint;
          this.deleteSelectedWaypoint();
        }
      });
    });
  }

  /**
   * Toggle playback
   */
  private togglePlayback(): void {
    if (this.animationController.isPlaying()) {
      this.animationController.pause();
    } else {
      this.animationController.play();
    }
    this.updatePlaybackUI();
  }

  /**
   * Seek to start
   */
  private seekToStart(): void {
    this.animationController.seek(0);
    this.updatePlaybackUI();
  }

  /**
   * Seek to end
   */
  private seekToEnd(): void {
    const state = this.animationController.getState();
    this.animationController.seek(state.totalDuration);
    this.updatePlaybackUI();
  }

  /**
   * Change playback speed
   */
  private changeSpeed(direction: number): void {
    const speeds = [0.25, 0.5, 1, 2, 4, 8];
    const currentIndex = speeds.indexOf(this.playbackSpeed);
    const newIndex = Math.max(0, Math.min(speeds.length - 1, currentIndex + direction));
    
    this.playbackSpeed = speeds[newIndex];
    this.animationController.setSpeed(this.playbackSpeed);
    this.speedDisplay.textContent = `${this.playbackSpeed}x`;
  }

  /**
   * Animation frame callback
   */
  private onAnimationFrame(progress: number, _state: AnimationState): void {
    this.currentProgress = progress;
    this.render();
    this.updatePlaybackUI();
  }

  /**
   * Update playback UI
   */
  private updatePlaybackUI(): void {
    const state = this.animationController.getState();
    
    // Update play button
    const isPlaying = state.playing;
    this.playButton.innerHTML = isPlaying
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    
    // Update timeline
    this.timelineScrubber.value = state.currentStep.toString();
    
    // Update time display
    this.currentTimeSpan.textContent = this.formatTime(state.currentTime);
    this.totalTimeSpan.textContent = this.formatTime(state.totalDuration);
  }

  /**
   * Update timeline
   */
  private updateTimeline(): void {
    const state = this.animationController.getState();
    this.totalTimeSpan.textContent = this.formatTime(state.totalDuration);
  }

  /**
   * Format time for display
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Render the canvas
   */
  private render(): void {
    const contrastOverlay = document.getElementById('contrast-overlay') as HTMLInputElement;
    const contrastValue = contrastOverlay ? parseInt(contrastOverlay.value) : 0;
    
    this.renderer.render(
      this.pathTrack,
      null, // camera track - not in MVP
      null, // label track - not in MVP
      this.currentProgress,
      contrastValue
    );
  }

  /**
   * Show splash screen
   */
  private showSplash(): void {
    this.splashScreen.style.display = 'flex';
  }

  /**
   * Hide splash screen
   */
  private hideSplash(): void {
    this.splashScreen.style.display = 'none';
  }
}
