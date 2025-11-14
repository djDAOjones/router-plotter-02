import { ANIMATION } from '../config/constants.js';
import { AnimationState } from '../models/AnimationState.js';

/**
 * Service for managing animation playback
 * Handles timing, waypoint waits, and frame rate control
 */
export class AnimationEngine {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.state = new AnimationState();
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.onUpdate = null; // Callback for animation updates
  }
  
  /**
   * Start the animation loop
   * @param {Function} onUpdate - Callback function called on each frame
   */
  start(onUpdate) {
    if (this.animationFrameId) {
      this.stop();
    }
    
    this.onUpdate = onUpdate;
    this.state.play();
    this.lastFrameTime = 0;
    
    const loop = (timestamp) => {
      this.animationFrameId = requestAnimationFrame(loop);
      
      // Calculate time since last frame
      const elapsed = timestamp - this.lastFrameTime;
      
      // Only update at target frame rate
      if (elapsed > ANIMATION.FRAME_INTERVAL) {
        // Adjust for frame interval to prevent lag accumulation
        this.lastFrameTime = timestamp - (elapsed % ANIMATION.FRAME_INTERVAL);
        
        if (this.state.isPlaying && !this.state.isPaused) {
          // Cap deltaTime to prevent huge jumps
          const deltaTime = Math.min(elapsed, ANIMATION.MAX_DELTA_TIME) * this.state.playbackSpeed;
          
          // Update animation state
          this.updateAnimation(deltaTime, timestamp);
        }
        
        // Call update callback
        if (this.onUpdate) {
          this.onUpdate(this.state);
        }
        
        // Emit update event
        this.emit('update', this.state);
      }
    };
    
    requestAnimationFrame(loop);
  }
  
  /**
   * Update animation state
   * @private
   * @param {number} deltaTime - Time since last update in milliseconds
   * @param {number} timestamp - Current timestamp
   */
  updateAnimation(deltaTime, timestamp) {
    // Handle waypoint waiting
    if (this.state.isWaitingAtWaypoint) {
      if (timestamp >= this.state.pauseEndTime) {
        this.state.endWaypointWait();
        this.emit('waypointWaitEnd', this.state.pauseWaypointIndex);
      } else {
        // Don't advance time while waiting
        return;
      }
    }
    
    // Advance animation time
    this.state.currentTime += deltaTime;
    
    // Check for animation end
    if (this.state.currentTime >= this.state.duration) {
      this.state.currentTime = this.state.duration;
      this.state.progress = 1;
      this.pause();
      this.emit('complete');
    } else {
      // Update progress
      this.state.progress = this.state.currentTime / this.state.duration;
      
      // Check for waypoint waits
      if (this.waypointCheckCallback) {
        this.waypointCheckCallback(this.state.progress);
      }
    }
  }
  
  /**
   * Pause the animation
   */
  pause() {
    this.state.pause();
    this.emit('pause');
  }
  
  /**
   * Resume the animation
   */
  play() {
    this.state.play();
    this.emit('play');
  }
  
  /**
   * Toggle play/pause
   */
  togglePlayPause() {
    if (this.state.isPlaying && !this.state.isPaused) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  /**
   * Stop the animation completely
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.state.stop();
    this.emit('stop');
  }
  
  /**
   * Reset animation to beginning
   */
  reset() {
    this.state.reset();
    this.emit('reset');
  }
  
  /**
   * Seek to specific time
   * @param {number} time - Time in milliseconds
   */
  seekToTime(time) {
    this.state.setTime(time);
    this.emit('seek', time);
  }
  
  /**
   * Seek to specific progress
   * @param {number} progress - Progress from 0 to 1
   */
  seekToProgress(progress) {
    this.state.setProgress(progress);
    this.emit('seek', progress * this.state.duration);
  }
  
  /**
   * Set animation duration
   * @param {number} duration - Duration in milliseconds
   */
  setDuration(duration) {
    const currentProgress = this.state.progress;
    console.log('⏱️  [AnimationEngine.setDuration()] duration:', duration, 'ms (', (duration/1000).toFixed(1), 's), progress:', currentProgress);
    this.state.duration = duration;
    this.state.setProgress(currentProgress); // Maintain progress
    this.emit('durationChange', duration);
  }
  
  /**
   * Set animation speed in pixels per second (for constant-speed mode)
   * Rounds to nearest step value (5) to match slider constraints
   * @param {number} speed - Speed in pixels per second
   */
  setSpeed(speed) {
    // Round to nearest step value (5) to match slider
    const step = 5;
    const roundedSpeed = Math.round(speed / step) * step;
    console.log('🏃 [AnimationEngine.setSpeed()] speed:', roundedSpeed, 'px/s (was:', this.state.speed, ', raw:', speed, ')');
    this.state.speed = roundedSpeed;
    this.emit('speedChange', roundedSpeed);
  }
  
  /**
   * Set playback speed multiplier
   * @param {number} speed - Playback speed (1 = normal, 2 = double speed)
   */
  setPlaybackSpeed(speed) {
    this.state.playbackSpeed = Math.max(0.1, Math.min(10, speed));
    this.emit('playbackSpeedChange', this.state.playbackSpeed);
  }
  
  /**
   * Set animation mode
   * @param {string} mode - 'constant-speed' or 'constant-time'
   */
  setMode(mode) {
    this.state.setMode(mode);
    this.emit('modeChange', mode);
  }
  
  /**
   * Start waiting at a waypoint
   * @param {number} waypointIndex - Index of the waypoint
   * @param {number} waitDuration - Duration to wait in milliseconds
   */
  startWaypointWait(waypointIndex, waitDuration) {
    const progressSnapshot = this.state.progress;
    this.state.startWaypointWait(waypointIndex, waitDuration, progressSnapshot);
    this.emit('waypointWaitStart', { index: waypointIndex, duration: waitDuration });
  }
  
  /**
   * Set callback for checking waypoint waits
   * @param {Function} callback - Function to check for waypoint waits
   */
  setWaypointCheckCallback(callback) {
    this.waypointCheckCallback = callback;
  }
  
  /**
   * Check if animation is playing
   * @returns {boolean}
   */
  isPlaying() {
    return this.state.isPlaying && !this.state.isPaused;
  }
  
  /**
   * Check if animation is complete
   * @returns {boolean}
   */
  isComplete() {
    return this.state.progress >= 1;
  }
  
  /**
   * Get current state
   * @returns {AnimationState}
   */
  getState() {
    return this.state;
  }
  
  /**
   * Get current progress
   * @returns {number} Progress from 0 to 1
   */
  getProgress() {
    return this.state.getEffectiveProgress();
  }
  
  /**
   * Get current time
   * @returns {number} Time in milliseconds
   */
  getTime() {
    return this.state.currentTime;
  }
  
  /**
   * Calculate duration based on path length and speed
   * @param {number} pathLength - Total path length in pixels
   * @returns {number} Duration in milliseconds
   */
  calculateDurationFromSpeed(pathLength) {
    if (this.state.mode === 'constant-speed' && this.state.speed > 0) {
      return (pathLength / this.state.speed) * 1000;
    }
    return this.state.duration;
  }
  
  /**
   * Emit event through event bus
   * @private
   */
  emit(eventName, data) {
    if (this.eventBus) {
      this.eventBus.emit(`animation:${eventName}`, data);
    }
  }
  
  /**
   * Destroy the animation engine
   */
  destroy() {
    this.stop();
    this.onUpdate = null;
    this.waypointCheckCallback = null;
    this.eventBus = null;
  }
}
