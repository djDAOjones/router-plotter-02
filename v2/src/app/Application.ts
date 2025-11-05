import { Renderer } from '../engine/renderer';
import { AnimationEngine } from '../engine/timing';
import { CatmullRomSpline } from '../engine/geometry';
import { ProjectManager } from './ProjectManager';
import { UIController } from './UIController';
import { ExportManager } from './ExportManager';
import { SplashScreen } from './SplashScreen';
import type {
  Project,
  PathTrack,
  LabelTrack,
  InterpolatedPath,
  AnimationState,
  Waypoint,
} from '../types';

/**
 * Main application class that coordinates all components
 */
export class Application {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private animationEngine: AnimationEngine;
  private spline: CatmullRomSpline;
  private projectManager: ProjectManager;
  private uiController: UIController;
  private exportManager: ExportManager;
  private splashScreen: SplashScreen;
  
  private currentProject: Project | null = null;
  private currentPath: InterpolatedPath | null = null;
  private editMode: boolean = true;
  private selectedWaypoint: Waypoint | null = null;
  private isDragging: boolean = false;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.animationEngine = new AnimationEngine();
    this.spline = new CatmullRomSpline();
    this.projectManager = new ProjectManager();
    this.uiController = new UIController(this);
    this.exportManager = new ExportManager(canvas, this.renderer);
    this.splashScreen = new SplashScreen();
    
    this.setupCanvas();
    this.setupCanvasEvents();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    // Set up UI event handlers
    this.uiController.initialize();
    
    // Load default or saved project
    await this.loadDefaultProject();
    
    // Start render loop
    this.startRenderLoop();
    
    // Set up autosave
    this.setupAutosave();
    
    // Show splash screen if needed
    if (this.splashScreen.shouldShowOnStartup()) {
      this.splashScreen.show();
    }
    
    console.log('Application initialized');
  }

  /**
   * Set up canvas sizing
   */
  private setupCanvas(): void {
    const resizeCanvas = () => {
      const container = this.canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.renderer.resize(rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  /**
   * Load default project or create new one
   */
  private async loadDefaultProject(): Promise<void> {
    // Try to load from IndexedDB
    const savedProject = await this.projectManager.loadFromStorage();
    
    if (savedProject) {
      this.currentProject = savedProject;
    } else {
      // Create default project
      this.currentProject = this.createDefaultProject();
    }
    
    this.updateFromProject();
  }

  /**
   * Create a default empty project
   */
  private createDefaultProject(): Project {
    return {
      schemaVersion: 1,
      meta: {
        title: 'New Route Animation',
        description: '',
        author: '',
        attribution: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
      a11y: {
        altText: '',
        reducedMotion: false,
        paletteId: 'default',
      },
      assets: [],
      settings: {
        fps: 25,
        contrastOverlay: {
          mode: 'none',
          value: 0,
        },
        cameraBounds: {
          x: 0,
          y: 0,
          width: this.canvas.width,
          height: this.canvas.height,
        },
        safetyMargin: 50,
      },
      tracks: [
        {
          id: 'main-path',
          type: 'path',
          name: 'Primary Route',
          style: {
            strokeColor: '#FF6B6B',
            strokeWidth: 3,
            strokeVariant: 'solid',
            waypointShape: 'circle',
            pathHead: 'arrow',
          },
          timing: {
            mode: 'constantSpeed',
            baseSpeedPxPerSec: 200,
            pauseMode: 'none',
            easeInOut: true,
          },
          smoothing: {
            tension: 0.5,
            alpha: 0.5,
            segments: 50,
          },
          waypoints: [],
        } as PathTrack,
      ],
      export: {
        format: 'webm',
        quality: 0.9,
        overlayAlpha: false,
        fps: 25,
      },
    };
  }

  /**
   * Update application state from project
   */
  private updateFromProject(): void {
    if (!this.currentProject) return;
    
    // Find path track
    const pathTrack = this.currentProject.tracks.find(
      t => t.type === 'path'
    ) as PathTrack | undefined;
    
    if (pathTrack) {
      console.log('Path track found with', pathTrack.waypoints.length, 'waypoints');
      
      if (pathTrack.waypoints.length >= 2) {
        // Set up spline configuration if available
        if (pathTrack.smoothing) {
          this.spline.setConfig(pathTrack.smoothing);
        }
        // Interpolate path
        this.currentPath = this.spline.interpolatePath(pathTrack.waypoints);
        console.log('Path interpolated with', this.currentPath?.points.length, 'points');
        
        // Initialize animation
        this.animationEngine.initialize(pathTrack, this.currentPath);
      } else {
        // Not enough waypoints, clear the path
        this.currentPath = null;
      }
    }
    
    // Update UI
    this.uiController.updateFromProject(this.currentProject);
    
    // Force a render
    this.render();
  }

  /**
   * Start the render loop
   */
  private startRenderLoop(): void {
    const render = () => {
      this.render();
      requestAnimationFrame(render);
    };
    
    render();
  }

  /**
   * Main render function
   */
  render(): void {
    if (!this.currentProject) return;
    
    const state = this.animationEngine.getState();
    
    // Update path position always when we have a path (not just when playing)
    if (this.currentPath && this.currentPath.points.length > 0) {
      this.animationEngine.updatePathPosition(this.currentPath);
    }
    
    // Find tracks
    const pathTrack = this.currentProject.tracks.find(
      t => t.type === 'path'
    ) as PathTrack | undefined;
    
    const labelTrack = this.currentProject.tracks.find(
      t => t.type === 'labels'
    ) as LabelTrack | undefined;
    
    // Prepare render layers
    const layers = {
      showBaseImage: true,
      contrastOverlay: this.currentProject.settings.contrastOverlay,
      path: pathTrack,
      interpolatedPath: this.currentPath || undefined,
      labels: labelTrack?.items || [],
      editMode: this.editMode,
      handles: this.editMode ? this.getEditHandles() : undefined,
    };
    
    // Clear canvas first
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Render
    this.renderer.render(state, layers as any);
  }

  /**
   * Get edit handles for current mode
   */
  private getEditHandles(): any[] {
    const handles: any[] = [];
    
    if (!this.currentProject) return handles;
    
    // Get current track based on active tab
    const activeTrack = this.uiController.getActiveTrack();
    
    if (activeTrack === 'path') {
      const pathTrack = this.currentProject.tracks.find(
        t => t.type === 'path'
      ) as PathTrack | undefined;
      
      if (pathTrack) {
        pathTrack.waypoints.forEach(wp => {
          handles.push({
            position: { x: wp.x, y: wp.y },
            selected: wp === this.selectedWaypoint,
            type: 'waypoint',
            id: wp.id,
          });
        });
      }
    }
    
    return handles;
  }

  /**
   * Set up autosave
   */
  private setupAutosave(): void {
    setInterval(() => {
      if (this.currentProject) {
        this.projectManager.saveToStorage(this.currentProject);
      }
    }, 10000); // Save every 10 seconds
  }

  /**
   * Set up canvas events for waypoint interaction
   */
  private setupCanvasEvents(): void {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  /**
   * Handle mouse down for waypoint selection and dragging
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.editMode || !this.currentProject) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const pathTrack = this.currentProject.tracks.find(
      t => t.type === 'path'
    ) as PathTrack | undefined;
    
    if (pathTrack) {
      // Check if clicking on existing waypoint
      const clickedWaypoint = pathTrack.waypoints.find(wp => {
        const dist = Math.sqrt(Math.pow(wp.x - x, 2) + Math.pow(wp.y - y, 2));
        return dist < 10;
      });
      
      if (clickedWaypoint) {
        this.selectedWaypoint = clickedWaypoint;
        this.isDragging = true;
        this.dragOffset = {
          x: x - clickedWaypoint.x,
          y: y - clickedWaypoint.y
        };
        this.canvas.style.cursor = 'grabbing';
        // Force re-render to show selection
        this.render();
      }
    }
  }

  /**
   * Handle mouse move for dragging waypoints
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.editMode || !this.currentProject) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Handle dragging
    if (this.isDragging && this.selectedWaypoint) {
      this.selectedWaypoint.x = x - this.dragOffset.x;
      this.selectedWaypoint.y = y - this.dragOffset.y;
      this.updateFromProject();
      return;
    }
    
    // Update cursor on hover
    const pathTrack = this.currentProject.tracks.find(
      t => t.type === 'path'
    ) as PathTrack | undefined;
    
    if (pathTrack) {
      const hoverWaypoint = pathTrack.waypoints.find(wp => {
        const dist = Math.sqrt(Math.pow(wp.x - x, 2) + Math.pow(wp.y - y, 2));
        return dist < 10;
      });
      
      this.canvas.style.cursor = hoverWaypoint ? 'grab' : 'crosshair';
    }
  }

  /**
   * Handle mouse up to stop dragging
   */
  private handleMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.style.cursor = 'crosshair';
      return;
    }
    
    // Only add new waypoint on mouse up if we weren't dragging
    if (!this.isDragging && this.editMode && event.type === 'mouseup') {
      this.handleCanvasClick(event);
    }
  }

  /**
   * Handle canvas click for adding new waypoints
   */
  handleCanvasClick(event: MouseEvent): void {
    if (!this.editMode || !this.currentProject) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const pathTrack = this.currentProject.tracks.find(
      t => t.type === 'path'
    ) as PathTrack | undefined;
    
    if (pathTrack) {
      // Check if clicking on existing waypoint
      const clickedWaypoint = pathTrack.waypoints.find(wp => {
        const dist = Math.sqrt(Math.pow(wp.x - x, 2) + Math.pow(wp.y - y, 2));
        return dist < 10;
      });
      
      if (clickedWaypoint) {
        this.selectedWaypoint = clickedWaypoint;
        // Force re-render to show selection
        this.render();
      } else {
        // Add new waypoint - major on regular click, minor on shift+click
        const newWaypoint: Waypoint = {
          id: `wp-${Date.now()}`,
          x,
          y,
          isMajor: !event.shiftKey, // Major on regular click, minor on shift+click
        };
        
        pathTrack.waypoints.push(newWaypoint);
        this.updateFromProject();
      }
    }
  }

  /**
   * Play animation
   */
  play(): void {
    this.editMode = false;
    this.animationEngine.play();
  }

  /**
   * Pause animation
   */
  pause(): void {
    this.animationEngine.pause();
  }

  /**
   * Stop animation
   */
  stop(): void {
    this.animationEngine.stop();
    this.editMode = true;
  }

  /**
   * Seek to progress
   */
  seekToProgress(progress: number): void {
    this.animationEngine.seekToProgress(progress);
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.animationEngine.setSpeed(speed);
  }

  /**
   * Export video
   */
  async exportVideo(): Promise<void> {
    if (!this.currentProject) return;
    
    // Validate project first
    if (!this.currentProject.a11y.altText) {
      alert('Please provide alt text for accessibility before exporting');
      return;
    }
    
    try {
      await this.exportManager.exportVideo(
        this.currentProject,
        this.animationEngine,
        this.currentPath
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check the console for details.');
    }
  }

  /**
   * Load project from file
   */
  async loadProject(file: File): Promise<void> {
    try {
      const project = await this.projectManager.loadFromFile(file);
      this.currentProject = project;
      this.updateFromProject();
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project. Please check the file format.');
    }
  }

  /**
   * Save project to file
   */
  async saveProject(): Promise<void> {
    if (!this.currentProject) return;
    
    try {
      await this.projectManager.saveToFile(this.currentProject);
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project.');
    }
  }

  /**
   * Create new project
   */
  newProject(): void {
    if (confirm('Create a new project? Unsaved changes will be lost.')) {
      this.currentProject = this.createDefaultProject();
      this.updateFromProject();
    }
  }

  /**
   * Load base image
   */
  async loadBaseImage(file: File): Promise<void> {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      this.renderer.setBaseImage(img);
      
      // Add to project assets
      if (this.currentProject) {
        this.currentProject.assets.push({
          id: 'base-image',
          type: 'image',
          name: file.name,
          path: url,
          metadata: {
            width: img.width,
            height: img.height,
          },
        });
      }
    };
    
    img.src = url;
  }

  /**
   * Get current project
   */
  getProject(): Project | null {
    return this.currentProject;
  }

  /**
   * Get animation state
   */
  getAnimationState(): AnimationState {
    return this.animationEngine.getState();
  }

  /**
   * Show help/splash screen
   */
  showHelp(): void {
    this.splashScreen.show();
  }

  /**
   * Get animation duration in milliseconds
   */
  getAnimationDuration(): number {
    return this.animationEngine.getDuration();
  }
}
