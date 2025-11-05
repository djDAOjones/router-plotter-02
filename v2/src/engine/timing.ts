import type {
  AnimationState,
  PathTrack,
  InterpolatedPath,
  TimingConfig,
  Waypoint,
} from '@/types';
import { CatmullRomSpline, Easing } from './geometry';

/**
 * Manages animation timing and playback
 * Provides deterministic frame-by-frame animation with various timing modes
 */
export class AnimationEngine {
  private state: AnimationState;
  private duration: number = 0;
  private spline: CatmullRomSpline;
  private pausePoints: PausePoint[] = [];
  private lastFrameTime: number = 0;
  private frameInterval: number = 40; // 25fps = 40ms per frame
  private animationFrameId: number | null = null;

  constructor() {
    this.state = {
      currentTime: 0,
      isPlaying: false,
      playbackSpeed: 1,
      normalizedProgress: 0,
      currentStep: 0,
      visibleLabels: [],
    };
    this.spline = new CatmullRomSpline();
  }

  /**
   * Initialize animation with a path track
   */
  initialize(track: PathTrack, interpolatedPath: InterpolatedPath): void {
    // Calculate total duration based on timing mode
    this.duration = this.calculateDuration(track, interpolatedPath);
    
    // Identify pause points
    this.pausePoints = this.extractPausePoints(track.waypoints, interpolatedPath);
    
    // Reset state
    this.state.currentTime = 0;
    this.state.normalizedProgress = 0;
    this.state.currentStep = 0;
  }

  /**
   * Calculate total animation duration
   */
  private calculateDuration(track: PathTrack, path: InterpolatedPath): number {
    const timing = track.timing;
    let totalDuration = 0;

    if (timing.mode === 'constantSpeed') {
      // Duration based on path length and speed
      totalDuration = (path.totalLength / timing.baseSpeedPxPerSec) * 1000; // Convert to ms
    } else {
      // Constant time per major segment
      const majorCount = track.waypoints.filter(w => w.isMajor).length;
      const segmentCount = Math.max(1, majorCount - 1);
      totalDuration = segmentCount * 2000; // 2 seconds per segment as default
    }

    // Add pause durations
    if (timing.pauseMode === 'seconds' && timing.pauseSeconds) {
      const pauseCount = track.waypoints.filter(w => w.isMajor).length;
      totalDuration += pauseCount * timing.pauseSeconds * 1000;
    }

    return totalDuration;
  }

  /**
   * Extract pause points from waypoints
   */
  private extractPausePoints(waypoints: Waypoint[], path: InterpolatedPath): PausePoint[] {
    const pausePoints: PausePoint[] = [];
    
    for (let i = 0; i < path.majorIndices.length; i++) {
      const majorIndex = path.majorIndices[i];
      const waypoint = waypoints.find(w => w.isMajor);
      
      if (waypoint && waypoint.pauseSeconds && waypoint.pauseSeconds > 0) {
        pausePoints.push({
          progress: majorIndex / (path.points.length - 1),
          duration: waypoint.pauseSeconds * 1000,
          waitForClick: false,
        });
      }
    }

    return pausePoints;
  }

  /**
   * Start animation playback
   */
  play(): void {
    if (this.state.isPlaying) return;
    
    this.state.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Pause animation playback
   */
  pause(): void {
    this.state.isPlaying = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Stop and reset animation
   */
  stop(): void {
    this.pause();
    this.state.currentTime = 0;
    this.state.normalizedProgress = 0;
    this.state.currentStep = 0;
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    this.state.currentTime = Math.max(0, Math.min(time, this.duration));
    this.updateProgress();
  }

  /**
   * Seek to normalized progress (0-1)
   */
  seekToProgress(progress: number): void {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    this.state.currentTime = clampedProgress * this.duration;
    this.updateProgress();
  }

  /**
   * Seek to step (0-200)
   */
  seekToStep(step: number): void {
    const clampedStep = Math.max(0, Math.min(200, step));
    this.seekToProgress(clampedStep / 200);
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.1, Math.min(10, speed));
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    if (!this.state.isPlaying) return;

    const currentTime = performance.now();
    const deltaTime = Math.min(currentTime - this.lastFrameTime, 100); // Cap at 100ms
    
    // Update time with speed multiplier
    this.state.currentTime += deltaTime * this.state.playbackSpeed;
    
    // Check for end of animation
    if (this.state.currentTime >= this.duration) {
      this.state.currentTime = this.duration;
      this.state.isPlaying = false;
      this.onAnimationEnd();
    }
    
    // Update progress
    this.updateProgress();
    
    // Check for pauses
    const currentPause = this.checkPauses();
    if (currentPause && currentPause.waitForClick) {
      this.pause();
      return;
    }
    
    this.lastFrameTime = currentTime;
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Update normalized progress and step
   */
  private updateProgress(): void {
    if (this.duration === 0) {
      this.state.normalizedProgress = 0;
      this.state.currentStep = 0;
      return;
    }
    
    // Calculate raw progress
    let rawProgress = this.state.currentTime / this.duration;
    
    // Apply easing between major waypoints
    rawProgress = this.applyEasing(rawProgress);
    
    this.state.normalizedProgress = Math.max(0, Math.min(1, rawProgress));
    this.state.currentStep = Math.round(this.state.normalizedProgress * 200);
  }

  /**
   * Apply easing function
   */
  private applyEasing(progress: number): number {
    // For now, use simple ease-in-out
    // In a full implementation, this would map progress through major waypoints
    return Easing.easeInOut(progress);
  }

  /**
   * Check for pause points
   */
  private checkPauses(): PausePoint | null {
    for (const pause of this.pausePoints) {
      const pauseStart = pause.progress;
      const pauseEnd = pauseStart + (pause.duration / this.duration);
      
      if (
        this.state.normalizedProgress >= pauseStart &&
        this.state.normalizedProgress < pauseEnd
      ) {
        return pause;
      }
    }
    
    return null;
  }

  /**
   * Handle animation end
   */
  private onAnimationEnd(): void {
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('animationEnd'));
  }

  /**
   * Update path position for current progress
   */
  updatePathPosition(path: InterpolatedPath): void {
    const arcLength = this.spline.getArcLengthAtProgress(
      path,
      this.state.normalizedProgress
    );
    
    const position = this.spline.getPointAtArcLength(path, arcLength);
    
    if (position) {
      this.state.pathPosition = position;
    }
  }

  /**
   * Get current animation state
   */
  getState(): AnimationState {
    return { ...this.state };
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Check if animation is complete
   */
  isComplete(): boolean {
    return this.state.normalizedProgress >= 1;
  }
}

interface PausePoint {
  progress: number;
  duration: number;
  waitForClick: boolean;
}

/**
 * Deterministic clock for consistent frame timing
 */
export class DeterministicClock {
  private time: number = 0;
  private deltaTime: number = 40; // 25fps = 40ms per frame
  private isRunning: boolean = false;
  private callbacks: Set<(dt: number) => void> = new Set();

  /**
   * Start the clock
   */
  start(): void {
    this.isRunning = true;
    this.tick();
  }

  /**
   * Stop the clock
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Reset the clock
   */
  reset(): void {
    this.time = 0;
  }

  /**
   * Advance by one frame
   */
  tick(): void {
    if (!this.isRunning) return;
    
    this.time += this.deltaTime;
    
    // Notify all callbacks
    for (const callback of this.callbacks) {
      callback(this.deltaTime);
    }
  }

  /**
   * Advance to specific time
   */
  advanceTo(targetTime: number): void {
    while (this.time < targetTime) {
      this.tick();
    }
  }

  /**
   * Register frame callback
   */
  onFrame(callback: (dt: number) => void): void {
    this.callbacks.add(callback);
  }

  /**
   * Unregister frame callback
   */
  offFrame(callback: (dt: number) => void): void {
    this.callbacks.delete(callback);
  }

  /**
   * Get current time
   */
  getTime(): number {
    return this.time;
  }

  /**
   * Set frame rate
   */
  setFrameRate(fps: number): void {
    this.deltaTime = 1000 / fps;
  }
}
