import { CatmullRom } from '../utils/CatmullRom.js';
import { PATH, RENDERING } from '../config/constants.js';

/**
 * Service for calculating paths through waypoints
 * Handles spline interpolation, reparameterization, and path shape generation
 */
export class PathCalculator {
  constructor() {
    this._majorWaypointsCache = new Map();
  }
  
  /**
   * Calculate a smooth path through waypoints
   * @param {Array} waypoints - Array of waypoint objects
   * @param {Object} options - Path calculation options
   * @returns {Array} Array of path points
   */
  calculatePath(waypoints, options = {}) {
    if (waypoints.length < 2) {
      return [];
    }
    
    // Convert waypoints to coordinates for spline calculation
    const coords = waypoints.map(wp => ({ 
      x: wp.x || wp.imgX, 
      y: wp.y || wp.imgY,
      isMajor: wp.isMajor
    }));
    
    // Generate initial path using Catmull-Rom splines
    const roughPath = CatmullRom.createPath(
      coords, 
      options.pointsPerSegment || PATH.POINTS_PER_SEGMENT,
      options.tension || PATH.DEFAULT_TENSION
    );
    
    // Apply corner-based velocity modulation for smoother animation
    const evenPath = this.reparameterizeWithCornerSlowing(
      roughPath, 
      options.targetSpacing || PATH.TARGET_SPACING
    );
    
    // Apply path shapes and generate stable points
    return this.applyPathShapes(evenPath, waypoints);
  }
  
  /**
   * Reparameterize path with corner slowing for smoother animation
   * @param {Array} rawPath - Original path points
   * @param {number} targetSpacing - Target spacing between points
   * @returns {Array} Reparameterized path
   */
  reparameterizeWithCornerSlowing(rawPath, targetSpacing = PATH.TARGET_SPACING) {
    if (rawPath.length < 2) return rawPath;
    
    const evenPath = [];
    evenPath.push(rawPath[0]);
    
    let accumulatedDistance = 0;
    
    for (let i = 1; i < rawPath.length; i++) {
      const p1 = rawPath[i - 1];
      const p2 = rawPath[i];
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      accumulatedDistance += distance;
      
      // Add point when we've accumulated enough distance
      if (accumulatedDistance >= targetSpacing) {
        const ratio = targetSpacing / accumulatedDistance;
        evenPath.push({
          x: p1.x + dx * ratio,
          y: p1.y + dy * ratio
        });
        accumulatedDistance = 0;
      }
    }
    
    // Always add the last point
    const lastPoint = rawPath[rawPath.length - 1];
    const lastEvenPoint = evenPath[evenPath.length - 1];
    if (lastPoint.x !== lastEvenPoint.x || lastPoint.y !== lastEvenPoint.y) {
      evenPath.push(lastPoint);
    }
    
    return evenPath;
  }
  
  /**
   * Apply path shapes (squiggle, randomised) to the path points
   * @param {Array} evenPath - Evenly spaced path points
   * @param {Array} waypoints - Original waypoints with shape information
   * @returns {Array} Path with shapes applied
   */
  applyPathShapes(evenPath, waypoints) {
    const finalPath = [];
    
    // Create stable seed for randomised paths
    let pathSeed = 0;
    waypoints.forEach(wp => {
      pathSeed += (wp.imgX || wp.x || 0) * 1000 + (wp.imgY || wp.y || 0);
    });
    
    // Process each point
    for (let i = 0; i < evenPath.length; i++) {
      const point = evenPath[i];
      
      // Find which segment this point belongs to
      const totalSegments = waypoints.length - 1;
      const segmentProgress = i / evenPath.length;
      const segmentIndex = Math.min(
        Math.floor(segmentProgress * totalSegments), 
        totalSegments - 1
      );
      
      // Find the controlling waypoint
      let controllerIdx = segmentIndex;
      while (controllerIdx >= 0 && !waypoints[controllerIdx].isMajor) {
        controllerIdx--;
      }
      
      const controller = controllerIdx >= 0 ? waypoints[controllerIdx] : null;
      const pathShape = controller?.pathShape || 'line';
      
      // Apply shape transformations
      if (pathShape === 'randomised') {
        // Generate stable random offset
        const pointSeed = pathSeed + i * 100;
        const rng1 = Math.sin(pointSeed) * 10000;
        const rng2 = Math.cos(pointSeed) * 10000;
        const randX = (rng1 - Math.floor(rng1)) * 2 - 1;
        const randY = (rng2 - Math.floor(rng2)) * 2 - 1;
        
        finalPath.push({
          x: point.x + randX * RENDERING.RANDOMISED_JITTER,
          y: point.y + randY * RENDERING.RANDOMISED_JITTER,
          originalX: point.x,
          originalY: point.y,
          pathShape: pathShape
        });
      } else {
        // For squiggle and line shapes, store shape info but don't transform yet
        finalPath.push({
          ...point,
          pathShape: pathShape
        });
      }
    }
    
    return finalPath;
  }
  
  /**
   * Find major waypoint positions along the path
   * @param {Array} waypoints - Array of waypoints
   * @returns {Array} Array of major waypoint positions
   */
  getMajorWaypointPositions(waypoints) {
    // Use cache for performance
    const cacheKey = this._getCacheKey(waypoints);
    if (this._majorWaypointsCache.has(cacheKey)) {
      return this._majorWaypointsCache.get(cacheKey);
    }
    
    const majorWaypoints = [];
    const totalWaypoints = waypoints.length;
    
    waypoints.forEach((wp, index) => {
      if (wp.isMajor) {
        const progress = totalWaypoints > 1 ? index / (totalWaypoints - 1) : 0;
        majorWaypoints.push({
          index: index,
          progress: progress,
          waypoint: wp
        });
      }
    });
    
    this._majorWaypointsCache.set(cacheKey, majorWaypoints);
    return majorWaypoints;
  }
  
  /**
   * Find which segment a given progress value falls into
   * @param {number} progress - Progress value from 0 to 1
   * @param {number} totalWaypoints - Total number of waypoints
   * @returns {number} Segment index
   */
  findSegmentIndexForProgress(progress, totalWaypoints) {
    if (totalWaypoints < 2) return -1;
    
    const segments = totalWaypoints - 1;
    const rawIndex = progress * segments;
    return Math.min(Math.floor(rawIndex), segments - 1);
  }
  
  /**
   * Calculate total path length
   * @param {Array} pathPoints - Array of path points
   * @returns {number} Total path length in pixels
   */
  calculatePathLength(pathPoints) {
    let totalLength = 0;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const p1 = pathPoints[i - 1];
      const p2 = pathPoints[i];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    
    return totalLength;
  }
  
  /**
   * Get interpolated position along path at given progress
   * @param {Array} pathPoints - Array of path points
   * @param {number} progress - Progress value from 0 to 1
   * @returns {Object} Point with x and y coordinates
   */
  getPointAtProgress(pathPoints, progress) {
    if (pathPoints.length === 0) return null;
    if (progress <= 0) return pathPoints[0];
    if (progress >= 1) return pathPoints[pathPoints.length - 1];
    
    const index = Math.floor(progress * (pathPoints.length - 1));
    const localProgress = (progress * (pathPoints.length - 1)) - index;
    
    if (index >= pathPoints.length - 1) {
      return pathPoints[pathPoints.length - 1];
    }
    
    const p1 = pathPoints[index];
    const p2 = pathPoints[index + 1];
    
    return {
      x: p1.x + (p2.x - p1.x) * localProgress,
      y: p1.y + (p2.y - p1.y) * localProgress
    };
  }
  
  /**
   * Clear the cache
   */
  clearCache() {
    this._majorWaypointsCache.clear();
  }
  
  /**
   * Generate cache key for waypoints
   * @private
   */
  _getCacheKey(waypoints) {
    return waypoints.map(wp => `${wp.imgX},${wp.imgY},${wp.isMajor}`).join('|');
  }
}
