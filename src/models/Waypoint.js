import { RENDERING, ANIMATION } from '../config/constants.js';

/**
 * Model representing a waypoint on the route
 * Encapsulates waypoint properties and provides methods for manipulation
 */
export class Waypoint {
  constructor(options = {}) {
    // Position (normalized image coordinates 0-1)
    this.imgX = options.imgX || 0;
    this.imgY = options.imgY || 0;
    
    // Type
    this.isMajor = options.isMajor !== undefined ? options.isMajor : true;
    
    // Visual properties
    this.segmentColor = options.segmentColor || RENDERING.DEFAULT_PATH_COLOR;
    this.segmentWidth = options.segmentWidth || RENDERING.DEFAULT_PATH_THICKNESS;
    this.segmentStyle = options.segmentStyle || 'solid'; // solid, dashed, dotted
    this.segmentTension = options.segmentTension || 0.5;
    
    // Path shape for segments starting from this waypoint
    this.pathShape = options.pathShape || 'line'; // line, squiggle, randomised
    
    // Marker properties
    this.markerStyle = options.markerStyle || 'dot'; // dot, square, flag, none
    this.dotColor = options.dotColor || RENDERING.DEFAULT_PATH_COLOR;
    this.dotSize = options.dotSize || (this.isMajor ? RENDERING.DEFAULT_DOT_SIZE : RENDERING.MINOR_DOT_SIZE);
    
    // Beacon effect
    this.beaconStyle = options.beaconStyle || 'none'; // none, pulse, ripple
    this.beaconColor = options.beaconColor || RENDERING.DEFAULT_PATH_COLOR;
    
    // Label
    this.label = options.label || '';
    this.labelMode = options.labelMode || 'none'; // none, on, fade, persist
    this.labelPosition = options.labelPosition || 'auto'; // auto, top, right, bottom, left
    
    // Animation pause
    this.pauseMode = options.pauseMode || 'none'; // none, timed
    this.pauseTime = options.pauseTime || ANIMATION.DEFAULT_WAIT_TIME;
    
    // Path head style for when animation reaches this waypoint
    this.pathHeadStyle = options.pathHeadStyle || 'arrow'; // dot, arrow, custom, none
    this.pathHeadColor = options.pathHeadColor || '#111111';
    this.pathHeadSize = options.pathHeadSize || RENDERING.PATH_HEAD_SIZE;
    this.pathHeadImage = options.pathHeadImage || null;
    
    // Custom image (for custom marker)
    this.customImage = options.customImage || null;
    
    // Metadata
    this.id = options.id || this.generateId();
    this.created = options.created || Date.now();
    this.modified = Date.now();
  }
  
  /**
   * Generate unique ID for waypoint
   * @private
   * @returns {string} Unique identifier
   */
  generateId() {
    return `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Update waypoint properties
   * @param {Object} updates - Properties to update
   */
  update(updates) {
    Object.keys(updates).forEach(key => {
      if (key in this && key !== 'id' && key !== 'created') {
        this[key] = updates[key];
      }
    });
    this.modified = Date.now();
  }
  
  /**
   * Set position
   * @param {number} x - X coordinate (normalized 0-1)
   * @param {number} y - Y coordinate (normalized 0-1)
   */
  setPosition(x, y) {
    this.imgX = Math.max(0, Math.min(1, x));
    this.imgY = Math.max(0, Math.min(1, y));
    this.modified = Date.now();
  }
  
  /**
   * Toggle between major and minor waypoint
   */
  toggleType() {
    this.isMajor = !this.isMajor;
    
    // Adjust properties based on type
    if (!this.isMajor) {
      // Minor waypoints have simpler properties
      this.labelMode = 'none';
      this.beaconStyle = 'none';
      this.pauseMode = 'none';
      this.dotSize = RENDERING.MINOR_DOT_SIZE;
    } else {
      this.dotSize = RENDERING.DEFAULT_DOT_SIZE;
    }
    
    this.modified = Date.now();
  }
  
  /**
   * Check if waypoint should pause animation
   * @returns {boolean} True if waypoint has pause time
   */
  shouldPause() {
    return this.isMajor && 
           this.pauseMode === 'timed' && 
           this.pauseTime > 0;
  }
  
  /**
   * Get pause duration in milliseconds
   * @returns {number} Pause duration
   */
  getPauseDuration() {
    return this.shouldPause() ? this.pauseTime : 0;
  }
  
  /**
   * Check if waypoint has a label
   * @returns {boolean} True if waypoint has a label to display
   */
  hasLabel() {
    return this.label && this.label.trim().length > 0 && this.labelMode !== 'none';
  }
  
  /**
   * Check if waypoint has beacon effect
   * @returns {boolean} True if waypoint has beacon effect
   */
  hasBeacon() {
    return this.beaconStyle !== 'none';
  }
  
  /**
   * Check if waypoint is visible
   * @returns {boolean} True if waypoint marker is visible
   */
  isVisible() {
    return this.markerStyle !== 'none';
  }
  
  /**
   * Clone the waypoint
   * @returns {Waypoint} New waypoint with same properties
   */
  clone() {
    return new Waypoint(this.toJSON());
  }
  
  /**
   * Convert to plain object for serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      imgX: this.imgX,
      imgY: this.imgY,
      isMajor: this.isMajor,
      segmentColor: this.segmentColor,
      segmentWidth: this.segmentWidth,
      segmentStyle: this.segmentStyle,
      segmentTension: this.segmentTension,
      pathShape: this.pathShape,
      markerStyle: this.markerStyle,
      dotColor: this.dotColor,
      dotSize: this.dotSize,
      beaconStyle: this.beaconStyle,
      beaconColor: this.beaconColor,
      label: this.label,
      labelMode: this.labelMode,
      labelPosition: this.labelPosition,
      pauseMode: this.pauseMode,
      pauseTime: this.pauseTime,
      pathHeadStyle: this.pathHeadStyle,
      pathHeadColor: this.pathHeadColor,
      pathHeadSize: this.pathHeadSize,
      pathHeadImage: this.pathHeadImage,
      customImage: this.customImage,
      created: this.created,
      modified: this.modified
    };
  }
  
  /**
   * Create waypoint from plain object
   * @param {Object} data - Plain object with waypoint data
   * @returns {Waypoint} New waypoint instance
   */
  static fromJSON(data) {
    return new Waypoint(data);
  }
  
  /**
   * Create default major waypoint
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Waypoint} New major waypoint
   */
  static createMajor(x, y) {
    return new Waypoint({
      imgX: x,
      imgY: y,
      isMajor: true
    });
  }
  
  /**
   * Create default minor waypoint
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Waypoint} New minor waypoint
   */
  static createMinor(x, y) {
    return new Waypoint({
      imgX: x,
      imgY: y,
      isMajor: false,
      labelMode: 'none',
      beaconStyle: 'none',
      pauseMode: 'none',
      dotSize: RENDERING.MINOR_DOT_SIZE
    });
  }
  
  /**
   * Validate waypoint data
   * @param {Object} data - Data to validate
   * @returns {boolean} True if data is valid
   */
  static validate(data) {
    if (!data || typeof data !== 'object') return false;
    
    // Required properties
    if (typeof data.imgX !== 'number' || data.imgX < 0 || data.imgX > 1) return false;
    if (typeof data.imgY !== 'number' || data.imgY < 0 || data.imgY > 1) return false;
    
    // Optional properties with valid values
    if (data.markerStyle && !['dot', 'square', 'flag', 'none'].includes(data.markerStyle)) return false;
    if (data.segmentStyle && !['solid', 'dashed', 'dotted'].includes(data.segmentStyle)) return false;
    if (data.pathShape && !['line', 'squiggle', 'randomised'].includes(data.pathShape)) return false;
    if (data.beaconStyle && !['none', 'pulse', 'ripple'].includes(data.beaconStyle)) return false;
    if (data.labelMode && !['none', 'on', 'fade', 'persist'].includes(data.labelMode)) return false;
    if (data.pauseMode && !['none', 'timed'].includes(data.pauseMode)) return false;
    
    return true;
  }
}
