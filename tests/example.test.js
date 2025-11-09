/**
 * Example test file demonstrating how the modular structure improves testability
 * These tests can be run with any JavaScript testing framework (Jest, Mocha, etc.)
 */

// Import modules to test
import { Waypoint } from '../src/models/Waypoint.js';
import { AnimationState } from '../src/models/AnimationState.js';
import { PathCalculator } from '../src/services/PathCalculator.js';
import { CoordinateTransform } from '../src/services/CoordinateTransform.js';
import { EventBus } from '../src/core/EventBus.js';
import { Easing } from '../src/utils/Easing.js';
import { CatmullRom } from '../src/utils/CatmullRom.js';

// Example test suite for Waypoint model
describe('Waypoint Model', () => {
  
  test('should create a major waypoint with default properties', () => {
    const waypoint = Waypoint.createMajor(0.5, 0.5);
    
    expect(waypoint.isMajor).toBe(true);
    expect(waypoint.imgX).toBe(0.5);
    expect(waypoint.imgY).toBe(0.5);
    expect(waypoint.markerStyle).toBe('dot');
    expect(waypoint.id).toBeDefined();
  });
  
  test('should create a minor waypoint with appropriate properties', () => {
    const waypoint = Waypoint.createMinor(0.3, 0.7);
    
    expect(waypoint.isMajor).toBe(false);
    expect(waypoint.labelMode).toBe('none');
    expect(waypoint.beaconStyle).toBe('none');
    expect(waypoint.pauseMode).toBe('none');
    expect(waypoint.dotSize).toBeLessThan(8);
  });
  
  test('should toggle between major and minor', () => {
    const waypoint = Waypoint.createMajor(0.5, 0.5);
    waypoint.toggleType();
    
    expect(waypoint.isMajor).toBe(false);
    expect(waypoint.labelMode).toBe('none');
  });
  
  test('should validate waypoint data', () => {
    const validData = {
      imgX: 0.5,
      imgY: 0.5,
      markerStyle: 'dot',
      segmentStyle: 'solid'
    };
    
    const invalidData = {
      imgX: 1.5, // Out of range
      imgY: 0.5
    };
    
    expect(Waypoint.validate(validData)).toBe(true);
    expect(Waypoint.validate(invalidData)).toBe(false);
  });
  
  test('should serialize and deserialize correctly', () => {
    const original = Waypoint.createMajor(0.5, 0.5);
    original.label = 'Test Point';
    original.dotColor = '#FF0000';
    
    const json = original.toJSON();
    const restored = Waypoint.fromJSON(json);
    
    expect(restored.label).toBe('Test Point');
    expect(restored.dotColor).toBe('#FF0000');
    expect(restored.imgX).toBe(0.5);
    expect(restored.imgY).toBe(0.5);
  });
});

// Example test suite for AnimationState
describe('AnimationState', () => {
  
  test('should initialize with default values', () => {
    const state = new AnimationState();
    
    expect(state.isPlaying).toBe(false);
    expect(state.progress).toBe(0);
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBeGreaterThan(0);
  });
  
  test('should handle play/pause correctly', () => {
    const state = new AnimationState();
    
    state.play();
    expect(state.isPlaying).toBe(true);
    expect(state.isPaused).toBe(false);
    
    state.pause();
    expect(state.isPaused).toBe(true);
    
    state.stop();
    expect(state.isPlaying).toBe(false);
    expect(state.progress).toBe(0);
  });
  
  test('should set progress and calculate time', () => {
    const state = new AnimationState();
    state.duration = 10000; // 10 seconds
    
    state.setProgress(0.5);
    expect(state.progress).toBe(0.5);
    expect(state.currentTime).toBe(5000);
  });
  
  test('should handle waypoint waiting', () => {
    const state = new AnimationState();
    
    state.startWaypointWait(2, 1500, 0.3);
    expect(state.isWaitingAtWaypoint).toBe(true);
    expect(state.pauseWaypointIndex).toBe(2);
    expect(state.waypointProgressSnapshot).toBe(0.3);
    expect(state.getEffectiveProgress()).toBe(0.3);
    
    state.endWaypointWait();
    expect(state.isWaitingAtWaypoint).toBe(false);
  });
});

// Example test suite for PathCalculator
describe('PathCalculator', () => {
  
  test('should return empty array for less than 2 waypoints', () => {
    const calculator = new PathCalculator();
    
    expect(calculator.calculatePath([])).toEqual([]);
    expect(calculator.calculatePath([{ x: 0, y: 0 }])).toEqual([]);
  });
  
  test('should calculate path through waypoints', () => {
    const calculator = new PathCalculator();
    const waypoints = [
      { x: 0, y: 0, isMajor: true },
      { x: 100, y: 100, isMajor: true },
      { x: 200, y: 50, isMajor: false }
    ];
    
    const path = calculator.calculatePath(waypoints);
    
    expect(path.length).toBeGreaterThan(3);
    expect(path[0].x).toBe(0);
    expect(path[0].y).toBe(0);
  });
  
  test('should calculate path length correctly', () => {
    const calculator = new PathCalculator();
    const path = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },  // Distance: 5
      { x: 3, y: 8 }   // Distance: 4
    ];
    
    const length = calculator.calculatePathLength(path);
    expect(length).toBe(9); // 5 + 4
  });
  
  test('should find major waypoint positions', () => {
    const calculator = new PathCalculator();
    const waypoints = [
      { imgX: 0, imgY: 0, isMajor: true },
      { imgX: 0.5, imgY: 0.5, isMajor: false },
      { imgX: 1, imgY: 1, isMajor: true }
    ];
    
    const majorPositions = calculator.getMajorWaypointPositions(waypoints);
    
    expect(majorPositions.length).toBe(2);
    expect(majorPositions[0].index).toBe(0);
    expect(majorPositions[1].index).toBe(2);
  });
  
  test('should cache major waypoint positions', () => {
    const calculator = new PathCalculator();
    const waypoints = [
      { imgX: 0, imgY: 0, isMajor: true },
      { imgX: 1, imgY: 1, isMajor: true }
    ];
    
    const first = calculator.getMajorWaypointPositions(waypoints);
    const second = calculator.getMajorWaypointPositions(waypoints);
    
    expect(first).toBe(second); // Should return same cached object
  });
});

// Example test suite for CoordinateTransform
describe('CoordinateTransform', () => {
  
  test('should handle canvas to image transformation', () => {
    const transform = new CoordinateTransform();
    transform.setCanvasDimensions(800, 600);
    transform.setImageDimensions(1000, 1000, 'fit');
    
    const imgPos = transform.canvasToImage(400, 300);
    
    expect(imgPos.x).toBeGreaterThanOrEqual(0);
    expect(imgPos.x).toBeLessThanOrEqual(1);
    expect(imgPos.y).toBeGreaterThanOrEqual(0);
    expect(imgPos.y).toBeLessThanOrEqual(1);
  });
  
  test('should handle image to canvas transformation', () => {
    const transform = new CoordinateTransform();
    transform.setCanvasDimensions(800, 600);
    transform.setImageDimensions(1000, 1000, 'fit');
    
    const canvasPos = transform.imageToCanvas(0.5, 0.5);
    
    expect(canvasPos.x).toBe(400); // Center of canvas
    expect(canvasPos.y).toBe(300); // Center of canvas
  });
  
  test('should check if point is within image bounds', () => {
    const transform = new CoordinateTransform();
    transform.setCanvasDimensions(800, 600);
    transform.setImageDimensions(1000, 1000, 'fit');
    
    expect(transform.isWithinImageBounds(400, 300)).toBe(true); // Center
    expect(transform.isWithinImageBounds(0, 0)).toBe(false); // Outside
  });
});

// Example test suite for EventBus
describe('EventBus', () => {
  
  test('should emit and receive events', () => {
    const bus = new EventBus();
    const mockHandler = jest.fn();
    
    bus.on('test-event', mockHandler);
    bus.emit('test-event', 'data');
    
    expect(mockHandler).toHaveBeenCalledWith('data');
  });
  
  test('should handle multiple listeners', () => {
    const bus = new EventBus();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    
    bus.on('test-event', handler1);
    bus.on('test-event', handler2);
    bus.emit('test-event');
    
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });
  
  test('should unsubscribe correctly', () => {
    const bus = new EventBus();
    const handler = jest.fn();
    
    const unsubscribe = bus.on('test-event', handler);
    bus.emit('test-event');
    expect(handler).toHaveBeenCalledTimes(1);
    
    unsubscribe();
    bus.emit('test-event');
    expect(handler).toHaveBeenCalledTimes(1); // Still 1
  });
  
  test('should handle once correctly', () => {
    const bus = new EventBus();
    const handler = jest.fn();
    
    bus.once('test-event', handler);
    bus.emit('test-event');
    bus.emit('test-event');
    
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// Example test suite for Easing functions
describe('Easing Functions', () => {
  
  test('should return correct values at boundaries', () => {
    expect(Easing.linear(0)).toBe(0);
    expect(Easing.linear(1)).toBe(1);
    
    expect(Easing.easeInQuad(0)).toBe(0);
    expect(Easing.easeInQuad(1)).toBe(1);
    
    expect(Easing.easeOutQuad(0)).toBe(0);
    expect(Easing.easeOutQuad(1)).toBe(1);
  });
  
  test('should provide smooth transitions', () => {
    const midLinear = Easing.linear(0.5);
    const midEaseIn = Easing.easeInQuad(0.5);
    const midEaseOut = Easing.easeOutQuad(0.5);
    
    expect(midLinear).toBe(0.5);
    expect(midEaseIn).toBeLessThan(0.5); // Slow start
    expect(midEaseOut).toBeGreaterThan(0.5); // Fast start
  });
});

// Example test suite for CatmullRom splines
describe('CatmullRom Splines', () => {
  
  test('should interpolate between points', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 100, y: 0 };
    const p2 = { x: 200, y: 100 };
    const p3 = { x: 300, y: 100 };
    
    const mid = CatmullRom.interpolate(p0, p1, p2, p3, 0.5);
    
    expect(mid.x).toBeGreaterThan(100);
    expect(mid.x).toBeLessThan(200);
    expect(mid.y).toBeGreaterThanOrEqual(0);
  });
  
  test('should create smooth path through waypoints', () => {
    const waypoints = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 200, y: 50 }
    ];
    
    const path = CatmullRom.createPath(waypoints, 10);
    
    expect(path.length).toBe(21); // 10 points per segment * 2 segments + 1
    expect(path[0]).toEqual(waypoints[0]);
    expect(path[path.length - 1]).toEqual(waypoints[2]);
  });
});
