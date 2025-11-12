/**
 * PathCalculatorWithWorker - Enhanced path calculator using Web Workers
 * Falls back to main thread if workers are not available
 */

import { PathCalculator } from './PathCalculator.js';

export class PathCalculatorWithWorker extends PathCalculator {
  constructor() {
    super();
    this.worker = null;
    this.workerAvailable = false;
    this.pendingRequests = new Map();
    this.requestId = 0;
    
    this.initWorker();
  }
  
  /**
   * Initialize Web Worker if available
   */
  initWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        // Create worker with module type
        this.worker = new Worker(
          new URL('../workers/pathWorker.js', import.meta.url),
          { type: 'module' }
        );
        
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);
        
        this.workerAvailable = true;
        console.log('PathCalculator: Web Worker initialized');
      } catch (error) {
        console.warn('PathCalculator: Failed to initialize Web Worker, falling back to main thread', error);
        this.workerAvailable = false;
      }
    } else {
      console.log('PathCalculator: Web Workers not supported, using main thread');
      this.workerAvailable = false;
    }
  }
  
  /**
   * Handle messages from worker
   */
  handleWorkerMessage(event) {
    const { type, data, id, error } = event.data;
    
    const request = this.pendingRequests.get(id);
    if (!request) {
      console.warn('PathCalculator: Received message for unknown request', id);
      return;
    }
    
    this.pendingRequests.delete(id);
    
    if (error) {
      request.reject(new Error(error));
    } else {
      request.resolve(data.pathPoints);
    }
  }
  
  /**
   * Handle worker errors
   */
  handleWorkerError(error) {
    console.error('PathCalculator: Worker error', error);
    
    // Reject all pending requests
    for (const request of this.pendingRequests.values()) {
      request.reject(error);
    }
    this.pendingRequests.clear();
    
    // Disable worker and fall back to main thread
    this.workerAvailable = false;
    this.worker = null;
  }
  
  /**
   * Calculate path using worker if available
   * @param {Array} waypoints - Array of waypoints
   * @returns {Promise<Array>} Promise resolving to path points
   */
  async calculatePathAsync(waypoints) {
    if (!this.workerAvailable) {
      // Fall back to synchronous calculation on main thread
      return Promise.resolve(this.calculatePath(waypoints));
    }
    
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      
      this.pendingRequests.set(id, { resolve, reject });
      
      // Send calculation request to worker
      this.worker.postMessage({
        type: 'calculate-path',
        data: {
          waypoints: waypoints.map(wp => ({
            x: wp.x || wp.imgX,
            y: wp.y || wp.imgY,
            isMajor: wp.isMajor
          }))
        },
        id: id
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Path calculation timed out'));
        }
      }, 5000);
    });
  }
  
  /**
   * Override the synchronous method to try async first
   * @param {Array} waypoints - Array of waypoints
   * @returns {Array} Path points
   */
  calculatePath(waypoints) {
    // If worker is available and we're not in a rush, use it
    if (this.workerAvailable && !this.isSynchronousContext()) {
      console.warn('PathCalculator: Synchronous calculatePath called but worker is available. Consider using calculatePathAsync.');
    }
    
    // Fall back to parent implementation
    return super.calculatePath(waypoints);
  }
  
  /**
   * Check if we're in a context that requires synchronous execution
   */
  isSynchronousContext() {
    // Check if we're in an animation frame or other time-critical context
    // This is a heuristic - you might want to make this more sophisticated
    return typeof requestAnimationFrame !== 'undefined' && 
           performance.now() % 16.67 < 1; // Roughly in an animation frame
  }
  
  /**
   * Clean up worker when done
   */
  destroy() {
    if (this.worker) {
      // Reject all pending requests
      for (const request of this.pendingRequests.values()) {
        request.reject(new Error('PathCalculator destroyed'));
      }
      this.pendingRequests.clear();
      
      // Terminate worker
      this.worker.terminate();
      this.worker = null;
      this.workerAvailable = false;
    }
  }
}
