/**
 * Timing and animation control for Route Plotter v2.0
 */

import {
  Waypoint,
  PathTrack,
  TimingMode,
  PauseMode,
  AnimationState
} from './types';
import { CatmullRomSpline, distance, easeInOutCubic } from './geometry';

export class AnimationController {
  private pathTrack: PathTrack | null = null;
  private spline: CatmullRomSpline | null = null;
  private animationState: AnimationState = {
    playing: false,
    currentTime: 0,
    totalDuration: 0,
    currentStep: 0,
    totalSteps: 1000,
    speed: 1
  };
  
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;
  private pauseTimeRemaining = 0;
  private currentSegmentIndex = 0;
  private segmentStartTime = 0;
  private segmentDurations: number[] = [];
  private segmentStartTimes: number[] = [];
  
  // Callbacks
  private onFrame: ((progress: number, state: AnimationState) => void) | null = null;
  private onEnded: (() => void) | null = null;
  private onPauseWaitingForClick = false;

  constructor() {
    this.animate = this.animate.bind(this);
  }

  /**
   * Set the path track to animate
   */
  setPathTrack(track: PathTrack): void {
    this.pathTrack = track;
    
    if (track.waypoints.length > 1) {
      this.spline = new CatmullRomSpline(track.waypoints, track.smoothing);
      this.calculateDuration();
    } else {
      this.spline = null;
      this.animationState.totalDuration = 0;
    }
    
    this.reset();
  }

  /**
   * Calculate total animation duration based on timing settings
   */
  private calculateDuration(): void {
    if (!this.pathTrack || !this.spline) {
      this.animationState.totalDuration = 0;
      return;
    }
    
    const majorWaypoints = this.pathTrack.waypoints.filter(w => w.isMajor);
    if (majorWaypoints.length < 2) {
      this.animationState.totalDuration = 0;
      return;
    }
    
    this.segmentDurations = [];
    this.segmentStartTimes = [];
    let totalDuration = 0;
    
    for (let i = 0; i < majorWaypoints.length - 1; i++) {
      const startWaypoint = majorWaypoints[i];
      const endWaypoint = majorWaypoints[i + 1];
      let segmentDuration = 0;
      
      if (this.pathTrack.timing.mode === 'constant-time') {
        // Each segment takes the same time
        segmentDuration = this.pathTrack.timing.segmentTime || 2;
      } else {
        // Calculate based on arc length for constant speed
        const segmentDistance = this.calculateSegmentDistance(startWaypoint, endWaypoint);
        segmentDuration = segmentDistance / this.pathTrack.timing.baseSpeedPxPerSec;
      }
      
      // Add pause duration if applicable
      if (this.pathTrack.timing.pauseMode === 'seconds' && i < majorWaypoints.length - 2) {
        segmentDuration += this.pathTrack.timing.pauseSeconds;
      }
      
      this.segmentStartTimes.push(totalDuration);
      this.segmentDurations.push(segmentDuration);
      totalDuration += segmentDuration;
    }
    
    this.animationState.totalDuration = totalDuration;
  }

  /**
   * Calculate arc-length distance between two major waypoints
   */
  private calculateSegmentDistance(start: Waypoint, end: Waypoint): number {
    if (!this.pathTrack || !this.spline) return 0;
    
    const startIndex = this.pathTrack.waypoints.indexOf(start);
    const endIndex = this.pathTrack.waypoints.indexOf(end);
    
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      return distance(start, end);
    }
    
    // Get waypoints for this segment (including minor waypoints)
    const segmentWaypoints = this.pathTrack.waypoints.slice(startIndex, endIndex + 1);
    
    // Calculate arc length for this segment
    const segmentSpline = new CatmullRomSpline(segmentWaypoints, this.pathTrack.smoothing);
    return segmentSpline.getTotalLength();
  }

  /**
   * Play animation
   */
  play(): void {
    if (this.animationState.playing) return;
    
    this.animationState.playing = true;
    this.lastFrameTime = performance.now();
    this.animate();
  }

  /**
   * Pause animation
   */
  pause(): void {
    this.animationState.playing = false;
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
    this.reset();
  }

  /**
   * Reset animation to beginning
   */
  reset(): void {
    this.animationState.currentTime = 0;
    this.animationState.currentStep = 0;
    this.currentSegmentIndex = 0;
    this.segmentStartTime = 0;
    this.pauseTimeRemaining = 0;
    this.onPauseWaitingForClick = false;
    
    if (this.onFrame) {
      this.onFrame(0, this.animationState);
    }
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    this.animationState.currentTime = Math.max(0, Math.min(time, this.animationState.totalDuration));
    this.animationState.currentStep = Math.floor((this.animationState.currentTime / this.animationState.totalDuration) * this.animationState.totalSteps);
    
    // Find current segment
    for (let i = 0; i < this.segmentStartTimes.length; i++) {
      if (this.animationState.currentTime >= this.segmentStartTimes[i] &&
          (i === this.segmentStartTimes.length - 1 || this.animationState.currentTime < this.segmentStartTimes[i + 1])) {
        this.currentSegmentIndex = i;
        this.segmentStartTime = this.segmentStartTimes[i];
        break;
      }
    }
    
    const progress = this.calculateProgress();
    if (this.onFrame) {
      this.onFrame(progress, this.animationState);
    }
  }

  /**
   * Seek to specific normalized step (0 to totalSteps)
   */
  seekToStep(step: number): void {
    const normalizedStep = Math.max(0, Math.min(step, this.animationState.totalSteps));
    const time = (normalizedStep / this.animationState.totalSteps) * this.animationState.totalDuration;
    this.seek(time);
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.animationState.speed = Math.max(0.25, Math.min(8, speed));
  }

  /**
   * Handle click for pause-on-click mode
   */
  handleClick(): void {
    if (this.onPauseWaitingForClick) {
      this.onPauseWaitingForClick = false;
      this.pauseTimeRemaining = 0;
    }
  }

  /**
   * Animation loop
   */
  private animate(): void {
    if (!this.animationState.playing) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    if (!this.pathTrack || this.animationState.totalDuration === 0) {
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }
    
    // Handle pause mode
    if (this.pauseTimeRemaining > 0) {
      this.pauseTimeRemaining -= deltaTime * this.animationState.speed;
      if (this.pauseTimeRemaining <= 0) {
        this.pauseTimeRemaining = 0;
      } else {
        this.animationFrameId = requestAnimationFrame(this.animate);
        return;
      }
    }
    
    if (this.onPauseWaitingForClick) {
      // Waiting for user click
      this.animationFrameId = requestAnimationFrame(this.animate);
      return;
    }
    
    // Update animation time
    this.animationState.currentTime += deltaTime * this.animationState.speed;
    
    // Check if we've reached a pause point
    if (this.pathTrack.timing.pauseMode !== 'none') {
      const majorWaypoints = this.pathTrack.waypoints.filter(w => w.isMajor);
      const currentSegment = Math.floor(this.animationState.currentTime / (this.animationState.totalDuration / (majorWaypoints.length - 1)));
      
      if (currentSegment > this.currentSegmentIndex && currentSegment < majorWaypoints.length - 1) {
        this.currentSegmentIndex = currentSegment;
        
        if (this.pathTrack.timing.pauseMode === 'seconds') {
          this.pauseTimeRemaining = this.pathTrack.timing.pauseSeconds;
        } else if (this.pathTrack.timing.pauseMode === 'click') {
          this.onPauseWaitingForClick = true;
        }
      }
    }
    
    // Check if animation is complete
    if (this.animationState.currentTime >= this.animationState.totalDuration) {
      this.animationState.currentTime = this.animationState.totalDuration;
      this.animationState.currentStep = this.animationState.totalSteps;
      this.animationState.playing = false;
      
      const progress = 1;
      if (this.onFrame) {
        this.onFrame(progress, this.animationState);
      }
      
      if (this.onEnded) {
        this.onEnded();
      }
      
      return;
    }
    
    // Calculate current progress
    this.animationState.currentStep = Math.floor((this.animationState.currentTime / this.animationState.totalDuration) * this.animationState.totalSteps);
    const progress = this.calculateProgress();
    
    if (this.onFrame) {
      this.onFrame(progress, this.animationState);
    }
    
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  /**
   * Calculate current progress (0 to 1)
   */
  private calculateProgress(): number {
    if (this.animationState.totalDuration === 0) return 0;
    
    let progress = this.animationState.currentTime / this.animationState.totalDuration;
    
    // Apply easing if enabled
    if (this.pathTrack?.timing.easeInOut) {
      // Apply easing per segment
      if (this.currentSegmentIndex < this.segmentDurations.length) {
        const segmentTime = this.animationState.currentTime - this.segmentStartTimes[this.currentSegmentIndex];
        const segmentDuration = this.segmentDurations[this.currentSegmentIndex];
        const segmentProgress = segmentTime / segmentDuration;
        
        const easedSegmentProgress = easeInOutCubic(Math.max(0, Math.min(1, segmentProgress)));
        
        // Calculate overall progress with easing applied to current segment
        const segmentStartProgress = this.currentSegmentIndex / (this.segmentDurations.length);
        const segmentEndProgress = (this.currentSegmentIndex + 1) / (this.segmentDurations.length);
        
        progress = segmentStartProgress + (segmentEndProgress - segmentStartProgress) * easedSegmentProgress;
      }
    }
    
    return Math.max(0, Math.min(1, progress));
  }

  /**
   * Set frame callback
   */
  setOnFrame(callback: (progress: number, state: AnimationState) => void): void {
    this.onFrame = callback;
  }

  /**
   * Set ended callback
   */
  setOnEnded(callback: () => void): void {
    this.onEnded = callback;
  }

  /**
   * Get current animation state
   */
  getState(): AnimationState {
    return { ...this.animationState };
  }

  /**
   * Check if animation is playing
   */
  isPlaying(): boolean {
    return this.animationState.playing;
  }

  /**
   * Get current progress (0 to 1)
   */
  getProgress(): number {
    return this.calculateProgress();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.pause();
    this.onFrame = null;
    this.onEnded = null;
  }
}
