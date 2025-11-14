/**
 * Web Worker for heavy path calculations
 * Offloads Catmull-Rom spline interpolation to a separate thread
 */

// Import path calculation logic
import { CatmullRom } from '../utils/CatmullRom.js';
import { PATH } from '../config/constants.js';

// Debug: Verify PATH.DEFAULT_TENSION is defined
console.log('🔧 [Worker Init] PATH.DEFAULT_TENSION:', PATH.DEFAULT_TENSION);
if (PATH.DEFAULT_TENSION === undefined) {
  console.error('❌ [Worker] PATH.DEFAULT_TENSION is undefined!');
}

/**
 * Calculate path through waypoints
 */
function calculatePath(waypoints) {
  if (waypoints.length < 2) {
    return [];
  }
  
  const pathPoints = [];
  const segments = waypoints.length - 1;
  const pointsPerSegment = PATH.POINTS_PER_SEGMENT;
  
  for (let i = 0; i < segments; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];
    
    // Generate points for this segment
    for (let t = 0; t <= pointsPerSegment; t++) {
      const normalizedT = t / pointsPerSegment;
      
      // Skip the first point of segments after the first to avoid duplicates
      if (i > 0 && t === 0) continue;
      
      // Use Catmull-Rom interpolation with configured tension
      if (i === 0 && t === 0) {
        console.log('🔧 [Worker] First interpolation call:', {
          p0, p1, p2, p3,
          normalizedT,
          tension: PATH.DEFAULT_TENSION
        });
      }
      const point = CatmullRom.interpolate(p0, p1, p2, p3, normalizedT, PATH.DEFAULT_TENSION);
      if (i === 0 && t === 0) {
        console.log('🔧 [Worker] First point result:', point);
      }
      
      // Add waypoint reference for later use
      point.segmentIndex = i;
      point.waypointStart = i;
      point.waypointEnd = i + 1;
      point.segmentProgress = normalizedT;
      
      pathPoints.push(point);
    }
  }
  
  // Reparameterize for even spacing
  const reparameterized = reparameterizePath(pathPoints);
  
  // Calculate cumulative distances for animation
  calculateCumulativeDistances(reparameterized);
  
  // Calculate curvature for corner slowing
  calculateCurvature(reparameterized);
  
  return reparameterized;
}

/**
 * Reparameterize path for even spacing
 */
function reparameterizePath(pathPoints) {
  if (pathPoints.length < 2) return pathPoints;
  
  const targetSpacing = PATH.TARGET_SPACING || 2;
  const reparameterized = [pathPoints[0]];
  let accumulatedDistance = 0;
  
  for (let i = 1; i < pathPoints.length; i++) {
    const p1 = reparameterized[reparameterized.length - 1];
    const p2 = pathPoints[i];
    const distance = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2)
    );
    
    accumulatedDistance += distance;
    
    // Add point if we've moved far enough
    if (accumulatedDistance >= targetSpacing) {
      reparameterized.push(p2);
      accumulatedDistance = 0;
    }
  }
  
  // Always include the last point
  const lastPoint = pathPoints[pathPoints.length - 1];
  const lastReparam = reparameterized[reparameterized.length - 1];
  if (lastPoint !== lastReparam) {
    reparameterized.push(lastPoint);
  }
  
  return reparameterized;
}

/**
 * Calculate cumulative distances along path
 */
function calculateCumulativeDistances(pathPoints) {
  let totalDistance = 0;
  
  for (let i = 0; i < pathPoints.length; i++) {
    if (i === 0) {
      pathPoints[i].distance = 0;
      pathPoints[i].cumulativeDistance = 0;
    } else {
      const p1 = pathPoints[i - 1];
      const p2 = pathPoints[i];
      const segmentDistance = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + 
        Math.pow(p2.y - p1.y, 2)
      );
      
      totalDistance += segmentDistance;
      pathPoints[i].distance = segmentDistance;
      pathPoints[i].cumulativeDistance = totalDistance;
    }
  }
  
  // Normalize cumulative distances to 0-1 range
  if (totalDistance > 0) {
    for (let i = 0; i < pathPoints.length; i++) {
      pathPoints[i].normalizedDistance = pathPoints[i].cumulativeDistance / totalDistance;
    }
  }
}

/**
 * Calculate curvature at each point for corner slowing
 */
function calculateCurvature(pathPoints) {
  for (let i = 0; i < pathPoints.length; i++) {
    if (i === 0 || i === pathPoints.length - 1) {
      // No curvature at endpoints
      pathPoints[i].curvature = 0;
      pathPoints[i].speedMultiplier = 1;
    } else {
      const p0 = pathPoints[i - 1];
      const p1 = pathPoints[i];
      const p2 = pathPoints[i + 1];
      
      // Calculate angle change
      const angle1 = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const angle2 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      let angleDiff = Math.abs(angle2 - angle1);
      
      // Normalize angle difference to 0-π
      if (angleDiff > Math.PI) {
        angleDiff = 2 * Math.PI - angleDiff;
      }
      
      // Calculate curvature (0 = straight, 1 = 180° turn)
      const curvature = angleDiff / Math.PI;
      pathPoints[i].curvature = curvature;
      
      // Calculate speed multiplier for corner slowing
      // Straight = 1.0 speed, tight corner = MIN_CORNER_SPEED
      const minSpeed = PATH.MIN_CORNER_SPEED || 0.2;
      const speedMultiplier = 1 - (curvature * (1 - minSpeed));
      pathPoints[i].speedMultiplier = speedMultiplier;
    }
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = function(event) {
  const { type, data, id } = event.data;
  
  try {
    switch (type) {
      case 'calculate-path':
        const pathPoints = calculatePath(data.waypoints);
        self.postMessage({
          type: 'path-calculated',
          data: { pathPoints },
          id: id
        });
        break;
        
      case 'reparameterize':
        const reparameterized = reparameterizePath(data.pathPoints);
        self.postMessage({
          type: 'path-reparameterized',
          data: { pathPoints: reparameterized },
          id: id
        });
        break;
        
      case 'calculate-distances':
        calculateCumulativeDistances(data.pathPoints);
        self.postMessage({
          type: 'distances-calculated',
          data: { pathPoints: data.pathPoints },
          id: id
        });
        break;
        
      case 'calculate-curvature':
        calculateCurvature(data.pathPoints);
        self.postMessage({
          type: 'curvature-calculated',
          data: { pathPoints: data.pathPoints },
          id: id
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      id: id
    });
  }
};
