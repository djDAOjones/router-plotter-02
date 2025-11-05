/**
 * Geometry calculations for Route Plotter v2.0
 * Implements Catmull-Rom spline interpolation with arc-length parameterization
 */

import { Point, Waypoint, CatmullRomConfig } from './types';

/**
 * Catmull-Rom spline interpolation
 * Uses centripetal parameterization for smoother curves
 */
export class CatmullRomSpline {
  private points: Point[];
  private config: CatmullRomConfig;
  private arcLengthTable: number[] = [];
  private totalLength: number = 0;

  constructor(points: Point[], config: CatmullRomConfig) {
    this.points = points;
    this.config = config;
    this.computeArcLengthTable();
  }

  /**
   * Get point on spline at parameter t (0 to 1)
   */
  getPoint(t: number): Point {
    const segments = this.points.length - 1;
    const segment = Math.min(Math.floor(t * segments), segments - 1);
    const localT = (t * segments) - segment;
    
    const p0 = this.getControlPoint(segment - 1);
    const p1 = this.points[segment];
    const p2 = this.points[segment + 1];
    const p3 = this.getControlPoint(segment + 2);
    
    return this.catmullRomInterpolate(p0, p1, p2, p3, localT);
  }

  /**
   * Get point on spline at arc-length distance
   */
  getPointAtDistance(distance: number): Point {
    const t = this.distanceToParameter(distance);
    return this.getPoint(t);
  }

  /**
   * Get tangent vector at parameter t
   */
  getTangent(t: number): Point {
    const epsilon = 0.001;
    const t1 = Math.max(0, t - epsilon);
    const t2 = Math.min(1, t + epsilon);
    
    const p1 = this.getPoint(t1);
    const p2 = this.getPoint(t2);
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    return {
      x: dx / length,
      y: dy / length
    };
  }

  /**
   * Get angle of tangent at parameter t (in radians)
   */
  getAngle(t: number): number {
    const tangent = this.getTangent(t);
    return Math.atan2(tangent.y, tangent.x);
  }

  /**
   * Get total arc length of the spline
   */
  getTotalLength(): number {
    return this.totalLength;
  }

  /**
   * Catmull-Rom interpolation between four control points
   */
  private catmullRomInterpolate(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
    const { tension, alpha } = this.config;
    
    // Calculate time parameters using centripetal parameterization
    const t0 = 0;
    const t1 = this.getTimeParameter(p0, p1, alpha) + t0;
    const t2 = this.getTimeParameter(p1, p2, alpha) + t1;
    const t3 = this.getTimeParameter(p2, p3, alpha) + t2;
    
    // Remap t to the actual time parameter
    const remappedT = t1 + (t2 - t1) * t;
    
    // Calculate coefficients
    const a1 = (t1 - remappedT) / (t1 - t0) * p0.x + (remappedT - t0) / (t1 - t0) * p1.x;
    const a2 = (t2 - remappedT) / (t2 - t1) * p1.x + (remappedT - t1) / (t2 - t1) * p2.x;
    const a3 = (t3 - remappedT) / (t3 - t2) * p2.x + (remappedT - t2) / (t3 - t2) * p3.x;
    
    const b1 = (t1 - remappedT) / (t1 - t0) * p0.y + (remappedT - t0) / (t1 - t0) * p1.y;
    const b2 = (t2 - remappedT) / (t2 - t1) * p1.y + (remappedT - t1) / (t2 - t1) * p2.y;
    const b3 = (t3 - remappedT) / (t3 - t2) * p2.y + (remappedT - t2) / (t3 - t2) * p3.y;
    
    const c1 = (t2 - remappedT) / (t2 - t0) * a1 + (remappedT - t0) / (t2 - t0) * a2;
    const c2 = (t3 - remappedT) / (t3 - t1) * a2 + (remappedT - t1) / (t3 - t1) * a3;
    
    const d1 = (t2 - remappedT) / (t2 - t0) * b1 + (remappedT - t0) / (t2 - t0) * b2;
    const d2 = (t3 - remappedT) / (t3 - t1) * b2 + (remappedT - t1) / (t3 - t1) * b3;
    
    const x = (t2 - remappedT) / (t2 - t1) * c1 + (remappedT - t1) / (t2 - t1) * c2;
    const y = (t2 - remappedT) / (t2 - t1) * d1 + (remappedT - t1) / (t2 - t1) * d2;
    
    return { x, y };
  }

  /**
   * Calculate time parameter for centripetal Catmull-Rom
   */
  private getTimeParameter(p1: Point, p2: Point, alpha: number): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.pow(distance, alpha);
  }

  /**
   * Get control point, handling boundary cases
   */
  private getControlPoint(index: number): Point {
    if (index < 0) {
      // Extrapolate before first point
      const p0 = this.points[0];
      const p1 = this.points[1];
      return {
        x: p0.x - (p1.x - p0.x),
        y: p0.y - (p1.y - p0.y)
      };
    } else if (index >= this.points.length) {
      // Extrapolate after last point
      const pn = this.points[this.points.length - 1];
      const pn1 = this.points[this.points.length - 2];
      return {
        x: pn.x + (pn.x - pn1.x),
        y: pn.y + (pn.y - pn1.y)
      };
    }
    return this.points[index];
  }

  /**
   * Compute arc-length lookup table for constant-speed animation
   */
  private computeArcLengthTable(): void {
    const samples = this.config.segments * this.points.length;
    this.arcLengthTable = [0];
    
    let prevPoint = this.getPoint(0);
    let totalLength = 0;
    
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const point = this.getPoint(t);
      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      totalLength += segmentLength;
      this.arcLengthTable.push(totalLength);
      prevPoint = point;
    }
    
    this.totalLength = totalLength;
  }

  /**
   * Convert arc-length distance to parameter t
   */
  private distanceToParameter(distance: number): number {
    if (distance <= 0) return 0;
    if (distance >= this.totalLength) return 1;
    
    // Binary search in arc-length table
    let low = 0;
    let high = this.arcLengthTable.length - 1;
    
    while (low < high - 1) {
      const mid = Math.floor((low + high) / 2);
      if (this.arcLengthTable[mid] < distance) {
        low = mid;
      } else {
        high = mid;
      }
    }
    
    // Linear interpolation between table entries
    const lengthBefore = this.arcLengthTable[low];
    const lengthAfter = this.arcLengthTable[high];
    const segmentLength = lengthAfter - lengthBefore;
    
    const segmentT = segmentLength > 0 
      ? (distance - lengthBefore) / segmentLength
      : 0;
    
    return (low + segmentT) / (this.arcLengthTable.length - 1);
  }
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linear interpolation between two points
 */
export function lerp(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  };
}

/**
 * Normalize a vector
 */
export function normalize(v: Point): Point {
  const length = Math.sqrt(v.x * v.x + v.y * v.y);
  if (length === 0) return { x: 0, y: 0 };
  return {
    x: v.x / length,
    y: v.y / length
  };
}

/**
 * Calculate perpendicular vector
 */
export function perpendicular(v: Point): Point {
  return { x: -v.y, y: v.x };
}

/**
 * Scale a vector
 */
export function scale(v: Point, s: number): Point {
  return { x: v.x * s, y: v.y * s };
}

/**
 * Add two vectors
 */
export function add(v1: Point, v2: Point): Point {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

/**
 * Subtract two vectors
 */
export function subtract(v1: Point, v2: Point): Point {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

/**
 * Calculate bounds of points
 */
export function calculateBounds(points: Point[]): { min: Point; max: Point; center: Point; width: number; height: number } {
  if (points.length === 0) {
    return {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 },
      center: { x: 0, y: 0 },
      width: 0,
      height: 0
    };
  }
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width,
    height
  };
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  return point.x >= rect.x &&
         point.x <= rect.x + rect.width &&
         point.y >= rect.y &&
         point.y <= rect.y + rect.height;
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(point: Point, center: Point, radius: number): boolean {
  return distance(point, center) <= radius;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Ease in-out cubic function
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * 180 / Math.PI;
}
