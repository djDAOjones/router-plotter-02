import type { Point2D, Waypoint, InterpolatedPath, CatmullRomConfig } from '@/types';

/**
 * Centripetal Catmull-Rom spline interpolation
 * Provides smooth curves through waypoints with configurable tension
 */
export class CatmullRomSpline {
  private config: CatmullRomConfig;

  constructor(config?: Partial<CatmullRomConfig>) {
    this.config = {
      tension: config?.tension ?? 0.5,
      alpha: config?.alpha ?? 0.5, // 0.5 for centripetal
      segments: config?.segments ?? 50,
    };
  }

  /**
   * Interpolate a path through waypoints using Catmull-Rom spline
   */
  interpolatePath(waypoints: Waypoint[]): InterpolatedPath {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required for interpolation');
    }

    const points: Point2D[] = [];
    const arcLengths: number[] = [0];
    const majorIndices: number[] = [];
    
    // Track major waypoint positions in the interpolated path
    let currentPointIndex = 0;

    // Process each segment between waypoints
    for (let i = 0; i < waypoints.length - 1; i++) {
      // Get control points for Catmull-Rom
      const p0 = i > 0 ? waypoints[i - 1] : waypoints[i];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = i < waypoints.length - 2 ? waypoints[i + 2] : waypoints[i + 1];

      // Mark major waypoints
      if (waypoints[i].isMajor) {
        majorIndices.push(currentPointIndex);
      }

      // Generate interpolated points for this segment
      const segmentPoints = this.interpolateSegment(p0, p1, p2, p3);
      
      // Add segment points (skip first point to avoid duplicates except for first segment)
      const startIdx = i === 0 ? 0 : 1;
      for (let j = startIdx; j < segmentPoints.length; j++) {
        points.push(segmentPoints[j]);
        currentPointIndex++;
      }
    }

    // Add the last major waypoint if needed
    const lastWaypoint = waypoints[waypoints.length - 1];
    if (lastWaypoint.isMajor) {
      majorIndices.push(points.length - 1);
    }

    // Calculate arc lengths for uniform speed interpolation
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dist = this.distance(points[i - 1], points[i]);
      totalLength += dist;
      arcLengths.push(totalLength);
    }

    return {
      points,
      arcLengths,
      totalLength,
      majorIndices,
    };
  }

  /**
   * Interpolate a single segment using Catmull-Rom algorithm
   */
  private interpolateSegment(
    p0: Point2D,
    p1: Point2D,
    p2: Point2D,
    p3: Point2D
  ): Point2D[] {
    const points: Point2D[] = [];
    const segments = this.config.segments;

    // Calculate time values for centripetal parameterization
    const t0 = 0;
    const t1 = this.getT(t0, p0, p1);
    const t2 = this.getT(t1, p1, p2);
    const t3 = this.getT(t2, p2, p3);

    // Generate points along the curve
    for (let i = 0; i <= segments; i++) {
      const t = t1 + (i / segments) * (t2 - t1);
      
      // Barry-Goldman algorithm for Catmull-Rom evaluation
      const a1 = this.interpolatePoint(p0, p1, t0, t1, t);
      const a2 = this.interpolatePoint(p1, p2, t1, t2, t);
      const a3 = this.interpolatePoint(p2, p3, t2, t3, t);
      
      const b1 = this.interpolatePoint(a1, a2, t0, t2, t);
      const b2 = this.interpolatePoint(a2, a3, t1, t3, t);
      
      const c = this.interpolatePoint(b1, b2, t1, t2, t);
      
      points.push(c);
    }

    return points;
  }

  /**
   * Calculate time parameter for centripetal Catmull-Rom
   */
  private getT(ti: number, pi: Point2D, pj: Point2D): number {
    const dist = this.distance(pi, pj);
    const alpha = this.config.alpha;
    return ti + Math.pow(dist, alpha);
  }

  /**
   * Linear interpolation between two points
   */
  private interpolatePoint(
    p1: Point2D,
    p2: Point2D,
    t1: number,
    t2: number,
    t: number
  ): Point2D {
    const ratio = (t - t1) / (t2 - t1);
    return {
      x: p1.x + ratio * (p2.x - p1.x),
      y: p1.y + ratio * (p2.y - p1.y),
    };
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private distance(p1: Point2D, p2: Point2D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get point at specific arc length along the interpolated path
   */
  getPointAtArcLength(path: InterpolatedPath, targetLength: number): Point2D | null {
    if (targetLength <= 0) {
      return path.points[0] || null;
    }
    
    if (targetLength >= path.totalLength) {
      return path.points[path.points.length - 1] || null;
    }

    // Binary search for the segment containing the target length
    let left = 0;
    let right = path.arcLengths.length - 1;
    
    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2);
      if (path.arcLengths[mid] < targetLength) {
        left = mid;
      } else {
        right = mid;
      }
    }

    // Linear interpolation within the segment
    const segmentStart = path.arcLengths[left];
    const segmentEnd = path.arcLengths[right];
    const segmentLength = segmentEnd - segmentStart;
    
    if (segmentLength === 0) {
      return path.points[left];
    }

    const t = (targetLength - segmentStart) / segmentLength;
    const p1 = path.points[left];
    const p2 = path.points[right];

    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  }

  /**
   * Get normalized progress (0-1) at a specific arc length
   */
  getNormalizedProgress(path: InterpolatedPath, arcLength: number): number {
    if (path.totalLength === 0) return 0;
    return Math.max(0, Math.min(1, arcLength / path.totalLength));
  }

  /**
   * Get arc length at normalized progress (0-1)
   */
  getArcLengthAtProgress(path: InterpolatedPath, progress: number): number {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    return clampedProgress * path.totalLength;
  }

  /**
   * Calculate tangent angle at a specific point along the path
   */
  getTangentAtArcLength(path: InterpolatedPath, targetLength: number): number {
    const epsilon = 0.1; // Small offset for numerical differentiation
    
    const p1 = this.getPointAtArcLength(path, targetLength - epsilon);
    const p2 = this.getPointAtArcLength(path, targetLength + epsilon);
    
    if (!p1 || !p2) return 0;
    
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<CatmullRomConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Easing functions for time mapping between major waypoints
 */
export class Easing {
  static linear(t: number): number {
    return t;
  }

  static easeInOut(t: number): number {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  static easeIn(t: number): number {
    return t * t;
  }

  static easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  static easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  static easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }
}

/**
 * Bounding box calculations for camera framing
 */
export class BoundingBox {
  static fromPoints(points: Point2D[]): {
    x: number;
    y: number;
    width: number;
    height: number;
    center: Point2D;
  } {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0, center: { x: 0, y: 0 } };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    const width = maxX - minX;
    const height = maxY - minY;

    return {
      x: minX,
      y: minY,
      width,
      height,
      center: {
        x: minX + width / 2,
        y: minY + height / 2,
      },
    };
  }

  static expand(
    bounds: { x: number; y: number; width: number; height: number },
    margin: number
  ): { x: number; y: number; width: number; height: number } {
    return {
      x: bounds.x - margin,
      y: bounds.y - margin,
      width: bounds.width + margin * 2,
      height: bounds.height + margin * 2,
    };
  }

  static contains(
    bounds: { x: number; y: number; width: number; height: number },
    point: Point2D
  ): boolean {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }
}
