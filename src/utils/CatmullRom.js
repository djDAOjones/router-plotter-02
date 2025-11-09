/**
 * Catmull-Rom spline implementation with tension control
 * Provides smooth curve interpolation through waypoints
 */
export class CatmullRom {
  /**
   * Interpolates a point between p1 and p2 using Catmull-Rom spline
   * @param {Object} p0 - Control point before p1
   * @param {Object} p1 - Start point
   * @param {Object} p2 - End point
   * @param {Object} p3 - Control point after p2
   * @param {number} t - Interpolation parameter (0 to 1)
   * @param {number} tension - Curve tension (0.5 = normal)
   * @returns {Object} Interpolated point with x and y coordinates
   */
  static interpolate(p0, p1, p2, p3, t, tension = 0.5) {
    const t2 = t * t;
    const t3 = t2 * t;
    
    const v0 = { x: (p2.x - p0.x) * tension, y: (p2.y - p0.y) * tension };
    const v1 = { x: (p3.x - p1.x) * tension, y: (p3.y - p1.y) * tension };
    
    return {
      x: p1.x + v0.x * t + (3 * (p2.x - p1.x) - 2 * v0.x - v1.x) * t2 + 
         (2 * (p1.x - p2.x) + v0.x + v1.x) * t3,
      y: p1.y + v0.y * t + (3 * (p2.y - p1.y) - 2 * v0.y - v1.y) * t2 + 
         (2 * (p1.y - p2.y) + v0.y + v1.y) * t3
    };
  }
  
  /**
   * Creates a smooth path through waypoints using Catmull-Rom splines
   * @param {Array} waypoints - Array of waypoint objects with x and y properties
   * @param {number} pointsPerSegment - Number of points to generate per segment
   * @param {number} defaultTension - Default tension for curve segments
   * @returns {Array} Array of interpolated points forming the path
   */
  static createPath(waypoints, pointsPerSegment = 30, defaultTension = 0.5) {
    if (waypoints.length < 2) return [];
    
    const path = [];
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(0, i - 1)];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];
      
      // Use per-segment tension from the starting waypoint, or default
      const segmentTension = p1.segmentTension ?? defaultTension;
      
      for (let j = 0; j < pointsPerSegment; j++) {
        const t = j / pointsPerSegment;
        path.push(CatmullRom.interpolate(p0, p1, p2, p3, t, segmentTension));
      }
    }
    
    // Add the last point
    path.push(waypoints[waypoints.length - 1]);
    
    return path;
  }
}
