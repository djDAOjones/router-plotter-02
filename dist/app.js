// Route Plotter v3 - Development Build

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/utils/CatmullRom.js
var CatmullRom = class _CatmullRom {
  /**
   * Interpolates a point on a Catmull-Rom spline between p1 and p2
   * @param {Object} p0 - Previous control point {x, y}
   * @param {Object} p1 - Start point of segment {x, y}
   * @param {Object} p2 - End point of segment {x, y}
   * @param {Object} p3 - Next control point {x, y}
   * @param {number} t - Interpolation parameter (0 to 1)
   * @param {number} tension - Tension value (lower = tighter curves, higher = looser curves)
   * @returns {Object} Interpolated point {x, y}
   */
  static interpolate(p0, p1, p2, p3, t, tension) {
    const t2 = t * t;
    const t3 = t2 * t;
    const v0x = (p2.x - p0.x) * tension;
    const v0y = (p2.y - p0.y) * tension;
    const v1x = (p3.x - p1.x) * tension;
    const v1y = (p3.y - p1.y) * tension;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return {
      x: p1.x + v0x * t + (3 * dx - 2 * v0x - v1x) * t2 + (2 * -dx + v0x + v1x) * t3,
      y: p1.y + v0y * t + (3 * dy - 2 * v0y - v1y) * t2 + (2 * -dy + v0y + v1y) * t3
    };
  }
  /**
   * Creates a smooth path through waypoints using Catmull-Rom splines
   * @param {Array} waypoints - Array of waypoint objects with x and y properties
   * @param {number} pointsPerSegment - Number of points to generate per segment (default: 30)
   * @param {number} tension - Tension value (lower = tighter curves, higher = looser curves)
   * @returns {Array} Array of interpolated points forming the path
   */
  static createPath(waypoints, pointsPerSegment = 30, tension = 0.5) {
    if (waypoints.length < 2) return [];
    const path = [];
    const lastIndex = waypoints.length - 1;
    const step = 1 / pointsPerSegment;
    for (let i = 0; i < lastIndex; i++) {
      const p0 = waypoints[i === 0 ? 0 : i - 1];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = waypoints[i === lastIndex - 1 ? lastIndex : i + 2];
      for (let j = 0; j < pointsPerSegment; j++) {
        path.push(_CatmullRom.interpolate(p0, p1, p2, p3, j * step, tension));
      }
    }
    path.push(waypoints[lastIndex]);
    return path;
  }
};

// src/utils/Easing.js
var Easing = class {
  /**
   * Quadratic ease-in - slow start, accelerating
   * 
   * Usage: Corner slowing calculations in path generation
   * Called ~1000+ times per path during reparameterization
   * 
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased value
   */
  static quadIn(t) {
    return t * t;
  }
  /**
   * Cubic ease-out - fast start, decelerating
   * 
   * Usage: Ripple fade effects in beacon animations
   * Called every frame (60 FPS) for each active ripple
   * 
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased value
   */
  static cubicOut(t) {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
  }
  /**
   * Cubic ease-in-out - smooth S-curve
   * 
   * Usage: Global animation timing for smooth start/stop
   * Called every frame (60 FPS) in main animation loop
   * 
   * @param {number} t - Progress (0 to 1)
   * @returns {number} Eased value
   */
  static cubicInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 + 4 * (t - 1) * (t - 1) * (t - 1);
  }
};

// src/config/constants.js
var ANIMATION = {
  DEFAULT_DURATION: 1e4,
  // 10 seconds (default duration)
  DEFAULT_SPEED: 400,
  // pixels per second (default animation speed - reasonable starting speed)
  TARGET_FPS: 60,
  FRAME_INTERVAL: 1e3 / 60,
  // ~16.67ms per frame
  MAX_DELTA_TIME: 100,
  // Maximum time jump to prevent huge leaps
  DEFAULT_PLAYBACK_SPEED: 1,
  DEFAULT_WAIT_TIME: 0,
  // Default waypoint pause time
  TIMELINE_RESOLUTION: 1e3
  // Slider steps (0-1000)
};
var RENDERING = {
  DEFAULT_PATH_COLOR: "#FF6B6B",
  DEFAULT_PATH_THICKNESS: 3,
  DEFAULT_DOT_SIZE: 8,
  MINOR_DOT_SIZE: 4,
  PATH_HEAD_SIZE: 8,
  BEACON_PULSE_DURATION: 2e3,
  // Beacon animation cycle
  BEACON_MAX_RADIUS: 30,
  BEACON_PULSE_SIZE: 10,
  // Base size for pulse effect
  BEACON_PULSE_OPACITY: 0.4,
  // Opacity for pulse glow
  BEACON_RIPPLE_DURATION: 1500,
  // Ripple lifetime in ms
  BEACON_RIPPLE_INTERVAL: 500,
  // Time between ripples in ms
  BEACON_RIPPLE_SPEED: 30,
  // Ripple expansion speed (pixels per ms)
  LABEL_OFFSET_X: 10,
  LABEL_OFFSET_Y: 5,
  LABEL_FONT_SIZE: 14,
  LABEL_FADE_TIME: 2e3,
  // Label fade duration in ms
  SQUIGGLE_AMPLITUDE: 0.15,
  // Wave amplitude for squiggle paths
  RANDOMISED_JITTER: 3,
  // Jitter amount for randomised paths
  CONTROLS_HEIGHT: 80
  // Height of bottom controls panel in pixels
};
var PATH = {
  POINTS_PER_SEGMENT: 100,
  // Catmull-Rom interpolation density
  DEFAULT_TENSION: 0.2,
  // Catmull-Rom tension - lower = tighter curves; higher = looser curves
  TARGET_SPACING: 2,
  // Pixels between points after reparameterization
  MAX_CURVATURE: 0.1,
  // Threshold for maximum corner slowing
  MIN_CORNER_SPEED: 0.2,
  // Minimum 20% speed at tight corners (was 40% - now slows more)
  CORNER_THRESHOLD: 30,
  // Degrees for corner detection
  CORNER_SLOW_RADIUS: 15,
  CORNER_SLOW_FACTOR: 0.7
};
var INTERACTION = {
  WAYPOINT_HIT_RADIUS: 15,
  // Click detection radius for waypoints (pixels)
  DRAG_THRESHOLD: 3,
  // Minimum pixels to consider a drag
  DOUBLE_CLICK_TIME: 300,
  // Maximum ms between clicks for double-click
  LONG_PRESS_TIME: 500,
  // Time for long press detection
  ZOOM_SENSITIVITY: 1e-3,
  PAN_SENSITIVITY: 1
};
var STORAGE = {
  AUTOSAVE_KEY: "routePlotter_autosave",
  PREFERENCES_KEY: "routePlotter_preferences",
  SPLASH_SHOWN_KEY: "routePlotter_splashShown",
  AUTOSAVE_INTERVAL: 1e3
  // Debounce time for autosave
};

// src/services/StorageService.js
var StorageService = class {
  constructor() {
    this.debounceTimer = null;
    this._lastSerialized = null;
  }
  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {any} data - Data to save (will be JSON stringified)
   * @returns {boolean} True if successful
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error("Failed to save to localStorage (".concat(key, "):"), error);
      return false;
    }
  }
  /**
   * Load data from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist or parse fails
   * @returns {any} Parsed data or default value
   */
  load(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error("Failed to load from localStorage (".concat(key, "):"), error);
      return defaultValue;
    }
  }
  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if successful
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to remove from localStorage (".concat(key, "):"), error);
      return false;
    }
  }
  /**
   * Check if a key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  exists(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error("Failed to check localStorage (".concat(key, "):"), error);
      return false;
    }
  }
  /**
   * Save application state (debounced with change detection)
   * @param {Object} state - Application state to save
   */
  autoSave(state) {
    const newSerialized = JSON.stringify(state);
    if (newSerialized === this._lastSerialized) {
      return;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.save(STORAGE.AUTOSAVE_KEY, state);
      this._lastSerialized = newSerialized;
      console.log("Auto-saved state");
    }, STORAGE.AUTOSAVE_INTERVAL);
  }
  /**
   * Load auto-saved application state
   * @returns {Object|null} Saved state or null
   */
  loadAutoSave() {
    return this.load(STORAGE.AUTOSAVE_KEY, null);
  }
  /**
   * Clear auto-saved state
   * @returns {boolean} True if successful
   */
  clearAutoSave() {
    return this.remove(STORAGE.AUTOSAVE_KEY);
  }
  /**
   * Save user preferences
   * @param {Object} preferences - User preferences
   * @returns {boolean} True if successful
   */
  savePreferences(preferences) {
    return this.save(STORAGE.PREFERENCES_KEY, preferences);
  }
  /**
   * Load user preferences
   * @returns {Object} User preferences with defaults
   */
  loadPreferences() {
    return this.load(STORAGE.PREFERENCES_KEY, {
      showSplash: true,
      theme: "light",
      animationSpeed: 1,
      autoSave: true,
      keyboardShortcuts: true,
      highContrast: false
    });
  }
  /**
   * Check if splash screen should be shown
   * @returns {boolean} True if splash should be shown
   */
  shouldShowSplash() {
    return !this.exists(STORAGE.SPLASH_SHOWN_KEY);
  }
  /**
   * Mark splash screen as shown
   */
  markSplashShown() {
    this.save(STORAGE.SPLASH_SHOWN_KEY, true);
  }
  /**
   * Export all data as JSON string
   * @returns {string} JSON string of all localStorage data
   */
  exportData() {
    const data = {
      autosave: this.loadAutoSave(),
      preferences: this.loadPreferences(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return JSON.stringify(data, null, 2);
  }
  /**
   * Import data from JSON string
   * @param {string} jsonString - JSON string to import
   * @returns {boolean} True if successful
   */
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.autosave) {
        this.save(STORAGE.AUTOSAVE_KEY, data.autosave);
      }
      if (data.preferences) {
        this.save(STORAGE.PREFERENCES_KEY, data.preferences);
      }
      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }
  /**
   * Clear all stored data
   * @returns {boolean} True if successful
   */
  clearAll() {
    try {
      const keys = [
        STORAGE.AUTOSAVE_KEY,
        STORAGE.PREFERENCES_KEY,
        STORAGE.SPLASH_SHOWN_KEY
      ];
      keys.forEach((key) => this.remove(key));
      return true;
    } catch (error) {
      console.error("Failed to clear all data:", error);
      return false;
    }
  }
  /**
   * Get storage size estimate
   * @returns {Promise<Object>} Storage quota and usage
   */
  async getStorageInfo() {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentage: estimate.usage / estimate.quota * 100
        };
      } catch (error) {
        console.error("Failed to estimate storage:", error);
      }
    }
    return null;
  }
};

// src/services/CoordinateTransform.js
var CoordinateTransform = class {
  constructor() {
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.imageBounds = null;
    this.fitMode = "fit";
    this.transform = null;
  }
  /**
   * Update canvas dimensions
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setCanvasDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  /**
   * Update image dimensions and calculate display bounds
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {string} fitMode - How to fit image ('fit' or 'fill')
   */
  setImageDimensions(width, height, fitMode = "fit") {
    this.imageWidth = width;
    this.imageHeight = height;
    this.fitMode = fitMode;
    this.calculateImageBounds();
  }
  /**
   * Calculate image display bounds and pre-compute transformation matrix
   * @private
   */
  calculateImageBounds() {
    if (!this.imageWidth || !this.imageHeight || !this.canvasWidth || !this.canvasHeight) {
      this.imageBounds = null;
      this.transform = null;
      return;
    }
    const canvasAspect = this.canvasWidth / this.canvasHeight;
    const imageAspect = this.imageWidth / this.imageHeight;
    let scale, x, y, w, h;
    if (this.fitMode === "fit") {
      if (imageAspect > canvasAspect) {
        scale = this.canvasWidth / this.imageWidth;
      } else {
        scale = this.canvasHeight / this.imageHeight;
      }
      w = this.imageWidth * scale;
      h = this.imageHeight * scale;
      x = (this.canvasWidth - w) / 2;
      y = (this.canvasHeight - h) / 2;
    } else {
      if (imageAspect > canvasAspect) {
        scale = this.canvasHeight / this.imageHeight;
      } else {
        scale = this.canvasWidth / this.imageWidth;
      }
      w = this.imageWidth * scale;
      h = this.imageHeight * scale;
      x = (this.canvasWidth - w) / 2;
      y = (this.canvasHeight - h) / 2;
    }
    this.imageBounds = { x, y, w, h, scale };
    if (this.fitMode === "fit") {
      this.transform = {
        // canvasToImage coefficients
        c2i_scaleX: 1 / w,
        // Cache reciprocal (multiply faster than divide)
        c2i_scaleY: 1 / h,
        c2i_offsetX: -x / w,
        // Pre-calculate offset
        c2i_offsetY: -y / h,
        // imageToCanvas coefficients
        i2c_scaleX: w,
        i2c_scaleY: h,
        i2c_offsetX: x,
        i2c_offsetY: y
      };
    } else {
      const sw = this.canvasWidth / scale;
      const sh = this.canvasHeight / scale;
      const sx = (this.imageWidth - sw) / 2;
      const sy = (this.imageHeight - sh) / 2;
      this.transform = {
        // canvasToImage coefficients
        c2i_scaleX: sw / this.canvasWidth / this.imageWidth,
        c2i_scaleY: sh / this.canvasHeight / this.imageHeight,
        c2i_offsetX: sx / this.imageWidth,
        c2i_offsetY: sy / this.imageHeight,
        // imageToCanvas coefficients
        i2c_scaleX: this.canvasWidth / sw * this.imageWidth,
        i2c_scaleY: this.canvasHeight / sh * this.imageHeight,
        i2c_offsetX: -sx / sw * this.canvasWidth,
        i2c_offsetY: -sy / sh * this.canvasHeight
      };
    }
  }
  /**
   * Convert canvas coordinates to normalized image coordinates (0-1)
   * Simplified for 1:1 mapping when canvas matches image
   * @param {number} canvasX - X coordinate on canvas
   * @param {number} canvasY - Y coordinate on canvas
   * @returns {{x: number, y: number}} Normalized image coordinates (0-1)
   */
  canvasToImage(canvasX, canvasY) {
    if (this.canvasWidth === this.imageWidth && this.canvasHeight === this.imageHeight) {
      return {
        x: canvasX / this.canvasWidth,
        y: canvasY / this.canvasHeight
      };
    }
    if (!this.transform) {
      return {
        x: this.canvasWidth > 0 ? canvasX / this.canvasWidth : 0,
        y: this.canvasHeight > 0 ? canvasY / this.canvasHeight : 0
      };
    }
    const t = this.transform;
    let x = canvasX * t.c2i_scaleX + t.c2i_offsetX;
    let y = canvasY * t.c2i_scaleY + t.c2i_offsetY;
    x = x < 0 ? 0 : x > 1 ? 1 : x;
    y = y < 0 ? 0 : y > 1 ? 1 : y;
    return { x, y };
  }
  /**
   * Convert normalized image coordinates (0-1) to canvas coordinates
   * Simplified for 1:1 mapping when canvas matches image
   * @param {number} imageX - Normalized X coordinate (0-1)
   * @param {number} imageY - Normalized Y coordinate (0-1)
   * @returns {{x: number, y: number}} Canvas coordinates
   */
  imageToCanvas(imageX, imageY) {
    if (this.canvasWidth === this.imageWidth && this.canvasHeight === this.imageHeight) {
      return {
        x: imageX * this.canvasWidth,
        y: imageY * this.canvasHeight
      };
    }
    if (!this.transform) {
      return {
        x: imageX * this.canvasWidth,
        y: imageY * this.canvasHeight
      };
    }
    const t = this.transform;
    return {
      x: imageX * t.i2c_scaleX + t.i2c_offsetX,
      y: imageY * t.i2c_scaleY + t.i2c_offsetY
    };
  }
  /**
   * Check if a point is within the image bounds
   * @param {number} canvasX - X coordinate on canvas
   * @param {number} canvasY - Y coordinate on canvas
   * @returns {boolean} True if point is within image bounds
   */
  isWithinImageBounds(canvasX, canvasY) {
    if (!this.imageBounds) return false;
    const bounds = this.imageBounds;
    return canvasX >= bounds.x && canvasX <= bounds.x + bounds.w && canvasY >= bounds.y && canvasY <= bounds.y + bounds.h;
  }
  /**
   * Get the current image bounds
   * @returns {Object|null} Image bounds {x, y, w, h, scale} or null
   */
  getImageBounds() {
    return this.imageBounds;
  }
  /**
   * Get display dimensions for the image
   * @returns {Object} Display dimensions {width, height}
   */
  getDisplayDimensions() {
    if (!this.imageBounds) {
      return { width: this.canvasWidth, height: this.canvasHeight };
    }
    return { width: this.imageBounds.w, height: this.imageBounds.h };
  }
  /**
   * Reset all transformations
   */
  reset() {
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.imageWidth = 0;
    this.imageHeight = 0;
    this.imageBounds = null;
    this.transform = null;
    this.fitMode = "fit";
  }
};

// src/services/PathCalculator.js
var PathCalculator = class {
  constructor() {
    this._majorWaypointsCache = /* @__PURE__ */ new Map();
    this._curvatureCache = /* @__PURE__ */ new Map();
    this._useFastCurvature = true;
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
    const coords = waypoints.map((wp) => ({
      x: wp.x || wp.imgX,
      y: wp.y || wp.imgY,
      isMajor: wp.isMajor
    }));
    const roughPath = CatmullRom.createPath(
      coords,
      options.pointsPerSegment || PATH.POINTS_PER_SEGMENT,
      options.tension || PATH.DEFAULT_TENSION
    );
    const evenPath = this.reparameterizeWithCornerSlowing(
      roughPath,
      options.targetSpacing || PATH.TARGET_SPACING
    );
    return this.applyPathShapes(evenPath, waypoints);
  }
  /**
   * Reparameterize path with corner slowing for smoother animation
   * Uses curvature-based velocity modulation with binary search optimization
   * @param {Array} rawPath - Original path points
   * @param {number} targetSpacing - Target spacing between points
   * @returns {Array} Reparameterized path
   */
  reparameterizeWithCornerSlowing(rawPath, targetSpacing = PATH.TARGET_SPACING) {
    if (rawPath.length < 2) return rawPath;
    const curvatures = this._getCachedCurvature(rawPath);
    const distances = [0];
    let totalDistance = 0;
    for (let i = 1; i < rawPath.length; i++) {
      const dx = rawPath[i].x - rawPath[i - 1].x;
      const dy = rawPath[i].y - rawPath[i - 1].y;
      const physicalDist = Math.sqrt(dx * dx + dy * dy);
      const curvature = curvatures[i];
      const velocityFactor = this._calculateVelocityFactor(curvature);
      const adjustedDist = physicalDist / velocityFactor;
      totalDistance += adjustedDist;
      distances.push(totalDistance);
    }
    const evenPath = [];
    const numPoints = Math.floor(totalDistance / targetSpacing);
    for (let i = 0; i <= numPoints; i++) {
      const targetDist = i / numPoints * totalDistance;
      const segmentIdx = this._binarySearchSegment(distances, targetDist);
      const segStart = distances[segmentIdx];
      const segEnd = distances[segmentIdx + 1] || segStart;
      const segLength = segEnd - segStart;
      const t = segLength > 0 ? (targetDist - segStart) / segLength : 0;
      const p1 = rawPath[segmentIdx];
      const p2 = rawPath[segmentIdx + 1] || p1;
      evenPath.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
      });
    }
    return evenPath;
  }
  /**
   * Calculate velocity factor based on curvature
   * High curvature = slower, low curvature = faster
   * @private
   */
  _calculateVelocityFactor(curvature) {
    const maxCurvature = PATH.MAX_CURVATURE;
    const minSpeed = PATH.MIN_CORNER_SPEED;
    const normalizedCurvature = Math.min(curvature / maxCurvature, 1);
    const easedCurvature = Easing.quadIn(normalizedCurvature);
    const velocityFactor = Math.max(minSpeed, 1 - easedCurvature * (1 - minSpeed));
    return velocityFactor;
  }
  /**
   * Binary search to find segment containing target distance
   * Optimized from O(n) linear search to O(log n)
   * @private
   */
  _binarySearchSegment(distances, targetDist) {
    let left = 0;
    let right = distances.length - 1;
    if (targetDist <= distances[0]) return 0;
    if (targetDist >= distances[right]) return right - 1;
    while (left < right - 1) {
      const mid = Math.floor((left + right) / 2);
      if (distances[mid] < targetDist) {
        left = mid;
      } else {
        right = mid;
      }
    }
    return left;
  }
  /**
   * Apply path shapes (squiggle, randomised) to the path points
   * @param {Array} evenPath - Evenly spaced path points
   * @param {Array} waypoints - Original waypoints with shape information
   * @returns {Array} Path with shapes applied
   */
  applyPathShapes(evenPath, waypoints) {
    const finalPath = [];
    let pathSeed = 0;
    waypoints.forEach((wp) => {
      pathSeed += (wp.imgX || wp.x || 0) * 1e3 + (wp.imgY || wp.y || 0);
    });
    for (let i = 0; i < evenPath.length; i++) {
      const point = evenPath[i];
      const totalSegments = waypoints.length - 1;
      const segmentProgress = i / evenPath.length;
      const segmentIndex = Math.min(
        Math.floor(segmentProgress * totalSegments),
        totalSegments - 1
      );
      let controllerIdx = segmentIndex;
      while (controllerIdx >= 0 && !waypoints[controllerIdx].isMajor) {
        controllerIdx--;
      }
      const controller = controllerIdx >= 0 ? waypoints[controllerIdx] : null;
      const pathShape = (controller == null ? void 0 : controller.pathShape) || "line";
      if (pathShape === "randomised") {
        const pointSeed = pathSeed + i * 100;
        const rng1 = Math.sin(pointSeed) * 1e4;
        const rng2 = Math.cos(pointSeed) * 1e4;
        const randX = (rng1 - Math.floor(rng1)) * 2 - 1;
        const randY = (rng2 - Math.floor(rng2)) * 2 - 1;
        finalPath.push({
          x: point.x + randX * RENDERING.RANDOMISED_JITTER,
          y: point.y + randY * RENDERING.RANDOMISED_JITTER,
          originalX: point.x,
          originalY: point.y,
          pathShape
        });
      } else {
        finalPath.push(__spreadProps(__spreadValues({}, point), {
          pathShape
        }));
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
          index,
          progress,
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
    if (!pathPoints || pathPoints.length === 0) {
      return 0;
    }
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
    const localProgress = progress * (pathPoints.length - 1) - index;
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
    this._curvatureCache.clear();
  }
  /**
   * Get cached curvature or calculate if not in cache
   * @private
   */
  _getCachedCurvature(path) {
    const pathKey = this._getPathHash(path);
    if (!this._curvatureCache.has(pathKey)) {
      const curvatures = this._useFastCurvature ? this._calculateCurvatureFast(path) : this._calculateCurvatureAccurate(path);
      this._curvatureCache.set(pathKey, curvatures);
    }
    return this._curvatureCache.get(pathKey);
  }
  /**
   * Fast curvature approximation using triangle area method
   * ~2.5x faster than accurate method with 95% similar results
   * @private
   */
  _calculateCurvatureFast(path) {
    const curvatures = [];
    for (let i = 0; i < path.length; i++) {
      if (i === 0 || i === path.length - 1) {
        curvatures.push(0);
        continue;
      }
      const p0 = path[i - 1];
      const p1 = path[i];
      const p2 = path[i + 1];
      const area = Math.abs(
        (p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y)
      );
      const d1 = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const d2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const avgDist = (d1 + d2) / 2;
      curvatures.push(avgDist > 0 ? area / (avgDist * avgDist) : 0);
    }
    return curvatures;
  }
  /**
   * Accurate curvature calculation using geometric method
   * More precise but slower than fast approximation
   * @private
   */
  _calculateCurvatureAccurate(path) {
    const curvatures = [];
    for (let i = 0; i < path.length; i++) {
      if (i === 0 || i === path.length - 1) {
        curvatures.push(0);
        continue;
      }
      const p0 = path[i - 1];
      const p1 = path[i];
      const p2 = path[i + 1];
      const v1x = p1.x - p0.x;
      const v1y = p1.y - p0.y;
      const v2x = p2.x - p1.x;
      const v2y = p2.y - p1.y;
      const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
      const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
      if (len1 === 0 || len2 === 0) {
        curvatures.push(0);
        continue;
      }
      const n1x = v1x / len1;
      const n1y = v1y / len1;
      const n2x = v2x / len2;
      const n2y = v2y / len2;
      const crossProduct = n1x * n2y - n1y * n2x;
      const dotProduct = n1x * n2x + n1y * n2y;
      const angle = Math.atan2(crossProduct, dotProduct);
      const avgLen = (len1 + len2) / 2;
      const curvature = avgLen > 0 ? Math.abs(angle) / avgLen : 0;
      curvatures.push(curvature);
    }
    return curvatures;
  }
  /**
   * Generate cache key for path
   * @private
   */
  _getPathHash(path) {
    const len = path.length;
    if (len < 3) return "".concat(path[0].x, ",").concat(path[0].y);
    const first = path[0];
    const mid = path[Math.floor(len / 2)];
    const last = path[len - 1];
    return "".concat(first.x, ",").concat(first.y, "|").concat(mid.x, ",").concat(mid.y, "|").concat(last.x, ",").concat(last.y, "|").concat(len);
  }
  /**
   * Generate cache key for waypoints
   * @private
   */
  _getCacheKey(waypoints) {
    return waypoints.map((wp) => "".concat(wp.imgX, ",").concat(wp.imgY, ",").concat(wp.isMajor)).join("|");
  }
};

// src/services/PathCalculatorWithWorker.js
var import_meta = {};
var PathCalculatorWithWorker = class extends PathCalculator {
  constructor() {
    super();
    this.worker = null;
    this.workerAvailable = false;
    this.pendingRequests = /* @__PURE__ */ new Map();
    this.requestId = 0;
    this.initWorker();
  }
  /**
   * Initialize Web Worker if available
   */
  initWorker() {
    if (typeof Worker !== "undefined") {
      try {
        this.worker = new Worker(
          new URL("../workers/pathWorker.js", import_meta.url),
          { type: "module" }
        );
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);
        this.workerAvailable = true;
        console.log("PathCalculator: Web Worker initialized");
      } catch (error) {
        console.warn("PathCalculator: Failed to initialize Web Worker, falling back to main thread", error);
        this.workerAvailable = false;
      }
    } else {
      console.log("PathCalculator: Web Workers not supported, using main thread");
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
      console.warn("PathCalculator: Received message for unknown request", id);
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
    console.error("PathCalculator: Worker error", error);
    for (const request of this.pendingRequests.values()) {
      request.reject(error);
    }
    this.pendingRequests.clear();
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
      return Promise.resolve(this.calculatePath(waypoints));
    }
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({
        type: "calculate-path",
        data: {
          waypoints: waypoints.map((wp) => ({
            x: wp.x || wp.imgX,
            y: wp.y || wp.imgY,
            isMajor: wp.isMajor
          }))
        },
        id
      });
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error("Path calculation timed out"));
        }
      }, 5e3);
    });
  }
  /**
   * Override the synchronous method to try async first
   * @param {Array} waypoints - Array of waypoints
   * @returns {Array} Path points
   */
  calculatePath(waypoints) {
    if (this.workerAvailable && !this.isSynchronousContext()) {
      console.warn("PathCalculator: Synchronous calculatePath called but worker is available. Consider using calculatePathAsync.");
    }
    return super.calculatePath(waypoints);
  }
  /**
   * Check if we're in a context that requires synchronous execution
   */
  isSynchronousContext() {
    return typeof requestAnimationFrame !== "undefined" && performance.now() % 16.67 < 1;
  }
  /**
   * Clean up worker when done
   */
  destroy() {
    if (this.worker) {
      for (const request of this.pendingRequests.values()) {
        request.reject(new Error("PathCalculator destroyed"));
      }
      this.pendingRequests.clear();
      this.worker.terminate();
      this.worker = null;
      this.workerAvailable = false;
    }
  }
};

// src/models/AnimationState.js
var AnimationState = class {
  constructor() {
    this.reset();
  }
  /**
   * Reset animation to initial state
   * Note: Preserves speed setting - only resets playback position
   */
  reset() {
    const preservedSpeed = this.speed || ANIMATION.DEFAULT_SPEED;
    console.log("\u{1F504} [AnimationState.reset()] BEFORE - speed:", this.speed, "preservedSpeed:", preservedSpeed);
    this.isPlaying = false;
    this.progress = 0;
    this.currentTime = 0;
    this.duration = ANIMATION.DEFAULT_DURATION;
    this.mode = "constant-speed";
    this.speed = preservedSpeed;
    this.playbackSpeed = ANIMATION.DEFAULT_PLAYBACK_SPEED;
    console.log("\u2705 [AnimationState.reset()] AFTER - speed:", this.speed, "duration:", this.duration);
    this.isPaused = false;
    this.isWaitingAtWaypoint = false;
    this.pauseWaypointIndex = -1;
    this.pauseStartTime = 0;
    this.pauseEndTime = 0;
    this.waypointProgressSnapshot = 0;
    this.lastTime = 0;
  }
  /**
   * Start animation playback
   */
  play() {
    this.isPlaying = true;
    this.isPaused = false;
    this.lastTime = performance.now();
  }
  /**
   * Pause animation playback
   */
  pause() {
    this.isPaused = true;
  }
  /**
   * Stop animation and reset
   */
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.progress = 0;
    this.currentTime = 0;
  }
  /**
   * Toggle between play and pause
   */
  togglePlayPause() {
    if (this.isPlaying && !this.isPaused) {
      this.pause();
    } else {
      this.play();
    }
  }
  /**
   * Set animation progress directly
   * @param {number} progress - Progress value from 0 to 1
   */
  setProgress(progress) {
    this.progress = Math.max(0, Math.min(1, progress));
    this.currentTime = this.progress * this.duration;
  }
  /**
   * Set animation time directly
   * @param {number} time - Time in milliseconds
   */
  setTime(time) {
    this.currentTime = Math.max(0, Math.min(this.duration, time));
    this.progress = this.duration > 0 ? this.currentTime / this.duration : 0;
  }
  /**
   * Update animation mode
   * @param {string} mode - 'constant-speed' or 'constant-time'
   */
  setMode(mode) {
    if (mode === "constant-speed" || mode === "constant-time") {
      this.mode = mode;
    } else {
      throw new Error("Invalid animation mode: ".concat(mode));
    }
  }
  /**
   * Start waiting at a waypoint
   * @param {number} waypointIndex - Index of the waypoint
   * @param {number} waitDuration - Duration to wait in milliseconds
   * @param {number} progressSnapshot - Progress value to freeze at
   */
  startWaypointWait(waypointIndex, waitDuration, progressSnapshot) {
    this.isWaitingAtWaypoint = true;
    this.pauseWaypointIndex = waypointIndex;
    this.pauseStartTime = performance.now();
    this.pauseEndTime = this.pauseStartTime + waitDuration;
    this.waypointProgressSnapshot = progressSnapshot;
  }
  /**
   * End waypoint wait
   */
  endWaypointWait() {
    this.isWaitingAtWaypoint = false;
    this.pauseWaypointIndex = -1;
    this.waypointProgressSnapshot = 0;
  }
  /**
   * Check if currently waiting at a waypoint
   * @returns {boolean}
   */
  isWaiting() {
    return this.isWaitingAtWaypoint;
  }
  /**
   * Get effective progress (considering waypoint waits)
   * @returns {number} Progress value from 0 to 1
   */
  getEffectiveProgress() {
    return this.isWaitingAtWaypoint ? this.waypointProgressSnapshot : this.progress;
  }
  /**
   * Clone current state
   * @returns {Object} Plain object with current state
   */
  toJSON() {
    return {
      isPlaying: this.isPlaying,
      progress: this.progress,
      currentTime: this.currentTime,
      duration: this.duration,
      mode: this.mode,
      speed: this.speed,
      playbackSpeed: this.playbackSpeed,
      isPaused: this.isPaused,
      isWaitingAtWaypoint: this.isWaitingAtWaypoint,
      pauseWaypointIndex: this.pauseWaypointIndex
    };
  }
  /**
   * Restore state from JSON
   * @param {Object} data - State data to restore
   */
  fromJSON(data) {
    Object.assign(this, data);
  }
};

// src/services/AnimationEngine.js
var AnimationEngine = class {
  constructor(eventBus = null) {
    this.eventBus = eventBus;
    this.state = new AnimationState();
    this.animationFrameId = null;
    this.lastFrameTime = 0;
    this.onUpdate = null;
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
      const elapsed = timestamp - this.lastFrameTime;
      if (elapsed > ANIMATION.FRAME_INTERVAL) {
        this.lastFrameTime = timestamp - elapsed % ANIMATION.FRAME_INTERVAL;
        if (this.state.isPlaying && !this.state.isPaused) {
          const deltaTime = Math.min(elapsed, ANIMATION.MAX_DELTA_TIME) * this.state.playbackSpeed;
          this.updateAnimation(deltaTime, timestamp);
        }
        if (this.onUpdate) {
          this.onUpdate(this.state);
        }
        this.emit("update", this.state);
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
    if (this.state.isWaitingAtWaypoint) {
      if (timestamp >= this.state.pauseEndTime) {
        this.state.endWaypointWait();
        this.emit("waypointWaitEnd", this.state.pauseWaypointIndex);
      } else {
        return;
      }
    }
    this.state.currentTime += deltaTime;
    if (this.state.currentTime >= this.state.duration) {
      this.state.currentTime = this.state.duration;
      this.state.progress = 1;
      this.pause();
      this.emit("complete");
    } else {
      this.state.progress = this.state.currentTime / this.state.duration;
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
    this.emit("pause");
  }
  /**
   * Resume the animation
   */
  play() {
    this.state.play();
    this.emit("play");
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
    this.emit("stop");
  }
  /**
   * Reset animation to beginning
   */
  reset() {
    this.state.reset();
    this.emit("reset");
  }
  /**
   * Seek to specific time
   * @param {number} time - Time in milliseconds
   */
  seekToTime(time) {
    this.state.setTime(time);
    this.emit("seek", time);
  }
  /**
   * Seek to specific progress
   * @param {number} progress - Progress from 0 to 1
   */
  seekToProgress(progress) {
    this.state.setProgress(progress);
    this.emit("seek", progress * this.state.duration);
  }
  /**
   * Set animation duration
   * @param {number} duration - Duration in milliseconds
   */
  setDuration(duration) {
    const currentProgress = this.state.progress;
    console.log("\u23F1\uFE0F  [AnimationEngine.setDuration()] duration:", duration, "ms (", (duration / 1e3).toFixed(1), "s), progress:", currentProgress);
    this.state.duration = duration;
    this.state.setProgress(currentProgress);
    this.emit("durationChange", duration);
  }
  /**
   * Set animation speed in pixels per second (for constant-speed mode)
   * Rounds to nearest step value (5) to match slider constraints
   * @param {number} speed - Speed in pixels per second
   */
  setSpeed(speed) {
    const step = 5;
    const roundedSpeed = Math.round(speed / step) * step;
    console.log("\u{1F3C3} [AnimationEngine.setSpeed()] speed:", roundedSpeed, "px/s (was:", this.state.speed, ", raw:", speed, ")");
    this.state.speed = roundedSpeed;
    this.emit("speedChange", roundedSpeed);
  }
  /**
   * Set playback speed multiplier
   * @param {number} speed - Playback speed (1 = normal, 2 = double speed)
   */
  setPlaybackSpeed(speed) {
    this.state.playbackSpeed = Math.max(0.1, Math.min(10, speed));
    this.emit("playbackSpeedChange", this.state.playbackSpeed);
  }
  /**
   * Set animation mode
   * @param {string} mode - 'constant-speed' or 'constant-time'
   */
  setMode(mode) {
    this.state.setMode(mode);
    this.emit("modeChange", mode);
  }
  /**
   * Start waiting at a waypoint
   * @param {number} waypointIndex - Index of the waypoint
   * @param {number} waitDuration - Duration to wait in milliseconds
   */
  startWaypointWait(waypointIndex, waitDuration) {
    const progressSnapshot = this.state.progress;
    this.state.startWaypointWait(waypointIndex, waitDuration, progressSnapshot);
    this.emit("waypointWaitStart", { index: waypointIndex, duration: waitDuration });
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
    if (this.state.mode === "constant-speed" && this.state.speed > 0) {
      return pathLength / this.state.speed * 1e3;
    }
    return this.state.duration;
  }
  /**
   * Emit event through event bus
   * @private
   */
  emit(eventName, data) {
    if (this.eventBus) {
      this.eventBus.emit("animation:".concat(eventName), data);
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
};

// src/services/RenderingService.js
var RenderingService = class {
  constructor() {
    this.vectorCanvas = null;
    this.waypointPositions = [];
  }
  /**
   * Main render method - orchestrates all rendering layers
   */
  render(ctx, displayWidth, displayHeight, state) {
    const cw = displayWidth || ctx.canvas.width;
    const ch = displayHeight || ctx.canvas.height;
    if (cw <= 0 || ch <= 0) {
      console.warn("Cannot render to canvas with invalid dimensions:", { width: cw, height: ch });
      return;
    }
    ctx.clearRect(0, 0, cw, ch);
    this.renderBackground(ctx, state.background, cw, ch);
    this.renderOverlay(ctx, state.background.overlay, cw, ch);
    const vCanvas = this.getVectorCanvas(displayWidth, displayHeight);
    if (vCanvas.width <= 0 || vCanvas.height <= 0) {
      console.warn("Vector canvas has invalid dimensions:", { width: vCanvas.width, height: vCanvas.height });
      return;
    }
    const vctx = vCanvas.getContext("2d");
    vctx.clearRect(0, 0, vCanvas.width, vCanvas.height);
    this.renderVectorLayerTo(vctx, state);
    if (vCanvas.width > 0 && vCanvas.height > 0) {
      ctx.drawImage(vCanvas, 0, 0);
    }
  }
  /**
   * Get or create offscreen canvas for vector layer
   */
  getVectorCanvas(displayWidth, displayHeight) {
    if (!this.vectorCanvas) {
      this.vectorCanvas = document.createElement("canvas");
    }
    const cw = displayWidth || 100;
    const ch = displayHeight || 100;
    const safeWidth = Math.max(1, cw);
    const safeHeight = Math.max(1, ch);
    if (this.vectorCanvas.width !== safeWidth || this.vectorCanvas.height !== safeHeight) {
      console.log("Resizing vector canvas to:", safeWidth, "x", safeHeight);
      this.vectorCanvas.width = safeWidth;
      this.vectorCanvas.height = safeHeight;
      const vctx = this.vectorCanvas.getContext("2d");
      if (vctx) {
        vctx.imageSmoothingEnabled = false;
      }
    }
    return this.vectorCanvas;
  }
  /**
   * Render background image with fit/fill mode
   */
  renderBackground(ctx, background, canvasWidth, canvasHeight) {
    if (!background.image) return;
    const img = background.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cw = canvasWidth;
    const ch = canvasHeight;
    if (background.fit === "fit") {
      const scale = Math.min(cw / iw, ch / ih);
      const dw = Math.round(iw * scale);
      const dh = Math.round(ih * scale);
      const dx = Math.floor((cw - dw) / 2);
      const dy = Math.floor((ch - dh) / 2);
      ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
    } else {
      const scale = Math.max(cw / iw, ch / ih);
      const sw = cw / scale;
      const sh = ch / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    }
  }
  /**
   * Render overlay for contrast adjustment
   */
  renderOverlay(ctx, overlayValue, canvasWidth, canvasHeight) {
    if (overlayValue === 0) return;
    ctx.save();
    ctx.globalAlpha = Math.min(Math.abs(overlayValue) / 100, 0.6);
    ctx.fillStyle = overlayValue < 0 ? "#000" : "#fff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();
  }
  /**
   * Render complete vector layer (paths, waypoints, labels)
   */
  renderVectorLayerTo(ctx, state) {
    const { waypoints, pathPoints, styles, animationEngine, selectedWaypoint, imageToCanvas, displayWidth, displayHeight } = state;
    if (pathPoints.length > 0 && waypoints.length > 1) {
      this.renderPath(ctx, pathPoints, waypoints, styles, animationEngine);
      this.renderPathHead(ctx, pathPoints, styles, animationEngine);
    }
    this.renderBeacons(ctx, waypoints, animationEngine, state.beaconAnimation, imageToCanvas, styles);
    this.renderWaypoints(ctx, waypoints, selectedWaypoint, styles, imageToCanvas, displayWidth, displayHeight);
  }
  /**
   * Render the animated path
   */
  renderPath(ctx, pathPoints, waypoints, styles, animationEngine) {
    const totalPoints = pathPoints.length;
    const progress = animationEngine.getProgress();
    const exactPosition = totalPoints * progress;
    const pointsToRender = Math.floor(exactPosition);
    const fraction = exactPosition - pointsToRender;
    const segments = waypoints.length - 1;
    const pointsPerSegment = Math.floor(totalPoints / segments);
    const controllerForSegment = new Array(segments);
    this.waypointPositions = [];
    waypoints.forEach((wp, index) => {
      if (index < waypoints.length - 1) {
        const exactPointIndex = index / segments * totalPoints;
        this.waypointPositions.push({
          waypointIndex: index,
          pointIndex: exactPointIndex
        });
      }
    });
    let lastMajorIdx = -1;
    for (let s = 0; s < segments; s++) {
      if (waypoints[s].isMajor) lastMajorIdx = s;
      controllerForSegment[s] = lastMajorIdx;
    }
    for (let i = 1; i < pointsToRender; i++) {
      const segmentIndex = Math.min(Math.floor(i / pointsPerSegment), segments - 1);
      const controllerIdx = controllerForSegment[segmentIndex];
      const controller = controllerIdx >= 0 ? waypoints[controllerIdx] : {
        segmentColor: styles.pathColor,
        segmentWidth: styles.pathThickness,
        segmentStyle: "solid",
        pathShape: "line"
      };
      ctx.strokeStyle = controller.segmentColor;
      ctx.lineWidth = controller.segmentWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      this.applyLineStyle(ctx, controller.segmentStyle);
      ctx.beginPath();
      const pathShape = controller.pathShape || "line";
      const p1 = pathPoints[i - 1];
      const p2 = pathPoints[i];
      if (pathShape === "squiggle") {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const perpX = -(p2.y - p1.y) * 0.15;
        const perpY = (p2.x - p1.x) * 0.15;
        ctx.moveTo(p1.x, p1.y);
        const wave = Math.sin(i * 0.5) * 0.5;
        ctx.quadraticCurveTo(
          midX + perpX * wave,
          midY + perpY * wave,
          p2.x,
          p2.y
        );
      } else if (pathShape === "randomised") {
        const jitterAmount = 3;
        const jitteredP1 = {
          x: p1.x + (Math.random() - 0.5) * jitterAmount,
          y: p1.y + (Math.random() - 0.5) * jitterAmount
        };
        const jitteredP2 = {
          x: p2.x + (Math.random() - 0.5) * jitterAmount,
          y: p2.y + (Math.random() - 0.5) * jitterAmount
        };
        ctx.moveTo(jitteredP1.x, jitteredP1.y);
        ctx.lineTo(jitteredP2.x, jitteredP2.y);
      } else {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }
    if (pointsToRender > 0 && pointsToRender < totalPoints && fraction > 1e-5) {
      if (Math.random() < 0.01) {
        console.log("[RenderPath] Drawing partial segment - fraction:", fraction.toFixed(5), "at point:", pointsToRender);
      }
      const i = pointsToRender;
      const segmentIndex = Math.min(Math.floor(i / pointsPerSegment), segments - 1);
      const controllerIdx = controllerForSegment[segmentIndex];
      const controller = controllerIdx >= 0 ? waypoints[controllerIdx] : {
        segmentColor: styles.pathColor,
        segmentWidth: styles.pathThickness,
        segmentStyle: "solid",
        pathShape: "line"
      };
      ctx.strokeStyle = controller.segmentColor;
      ctx.lineWidth = controller.segmentWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      this.applyLineStyle(ctx, controller.segmentStyle);
      ctx.beginPath();
      const p1 = pathPoints[i - 1];
      const p2 = pathPoints[i];
      const partialEnd = {
        x: p1.x + (p2.x - p1.x) * fraction,
        y: p1.y + (p2.y - p1.y) * fraction
      };
      const pathShape = controller.pathShape || "line";
      if (pathShape === "squiggle") {
        const midX = (p1.x + partialEnd.x) / 2;
        const midY = (p1.y + partialEnd.y) / 2;
        const perpX = -(partialEnd.y - p1.y) * 0.15;
        const perpY = (partialEnd.x - p1.x) * 0.15;
        ctx.moveTo(p1.x, p1.y);
        const wave = Math.sin(i * 0.5) * 0.5;
        ctx.quadraticCurveTo(
          midX + perpX * wave,
          midY + perpY * wave,
          partialEnd.x,
          partialEnd.y
        );
      } else if (pathShape === "randomised") {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(partialEnd.x, partialEnd.y);
      } else {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(partialEnd.x, partialEnd.y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  /**
   * Render the path head (animated marker)
   */
  renderPathHead(ctx, pathPoints, styles, animationEngine) {
    const progress = animationEngine.getProgress();
    const totalPoints = pathPoints.length;
    const exactPosition = totalPoints * progress;
    const pointsToRender = Math.floor(exactPosition);
    if (pointsToRender > 1 && pointsToRender < totalPoints) {
      const currentIndex = Math.min(pointsToRender - 1, pathPoints.length - 2);
      const nextIndex = currentIndex + 1;
      const fraction = exactPosition - pointsToRender;
      const currentPoint = pathPoints[currentIndex];
      const nextPoint = pathPoints[nextIndex];
      const head = {
        x: currentPoint.x + (nextPoint.x - currentPoint.x) * fraction,
        y: currentPoint.y + (nextPoint.y - currentPoint.y) * fraction
      };
      let rotation = 0;
      if (currentIndex > 0) {
        const prevPoint = pathPoints[currentIndex - 1];
        rotation = Math.atan2(nextPoint.y - prevPoint.y, nextPoint.x - prevPoint.x);
      }
      styles.pathHead.rotation = rotation;
      this.drawPathHead(ctx, head.x, head.y, rotation, styles.pathHead);
    } else if (pointsToRender >= totalPoints && totalPoints > 0) {
      const head = pathPoints[totalPoints - 1];
      const prevPoint = totalPoints > 1 ? pathPoints[totalPoints - 2] : head;
      const rotation = Math.atan2(head.y - prevPoint.y, head.x - prevPoint.x);
      styles.pathHead.rotation = rotation;
      this.drawPathHead(ctx, head.x, head.y, rotation, styles.pathHead);
    }
  }
  /**
   * Draw the path head based on current style settings
   */
  drawPathHead(ctx, x, y, rotation, pathHead) {
    if (!isFinite(x) || !isFinite(y)) {
      console.warn("Invalid path head coordinates:", { x, y });
      return;
    }
    const size = pathHead.size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    switch (pathHead.style) {
      case "dot":
        ctx.beginPath();
        ctx.fillStyle = pathHead.color;
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "arrow":
        ctx.beginPath();
        ctx.fillStyle = pathHead.color;
        ctx.moveTo(size, 0);
        ctx.lineTo(-size / 2, size / 2);
        ctx.lineTo(-size / 4, 0);
        ctx.lineTo(-size / 2, -size / 2);
        ctx.closePath();
        ctx.fill();
        break;
      case "custom":
        if (pathHead.image) {
          const imgSize = size * 2;
          ctx.drawImage(
            pathHead.image,
            -imgSize / 2,
            -imgSize / 2,
            imgSize,
            imgSize
          );
        } else {
          ctx.beginPath();
          ctx.fillStyle = pathHead.color;
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      default:
        ctx.beginPath();
        ctx.fillStyle = pathHead.color;
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
  }
  /**
   * Render beacon effects at waypoints
   */
  renderBeacons(ctx, waypoints, animationEngine, beaconAnimation, imageToCanvas, styles) {
    if (!waypoints.length) return;
    const currentProgress = animationEngine.getProgress();
    waypoints.forEach((waypoint, wpIndex) => {
      if (waypoint.isMajor) {
        const exactWaypointProgress = wpIndex / (waypoints.length - 1);
        const atWaypoint = Math.abs(currentProgress - exactWaypointProgress) < 1e-3;
        const isPausedHere = animationEngine.state.isPaused && animationEngine.state.pauseWaypointIndex === wpIndex;
        if (atWaypoint || isPausedHere) {
          const wpCanvas = imageToCanvas(waypoint.imgX, waypoint.imgY);
          this.drawBeacon(ctx, __spreadProps(__spreadValues({}, waypoint), { x: wpCanvas.x, y: wpCanvas.y }), beaconAnimation, styles);
        }
      }
    });
  }
  /**
   * Draw beacon effect
   */
  drawBeacon(ctx, point, beaconAnimation, styles) {
    const bStyle = point.beaconStyle || "none";
    const bColor = point.beaconColor || styles.beaconColor;
    if (bStyle === "none") return;
    if (!isFinite(point.x) || !isFinite(point.y)) {
      console.warn("Invalid beacon coordinates:", point);
      return;
    }
    if (bStyle === "pulse") {
      beaconAnimation.pulsePhase = performance.now() * 3e-3;
      const pulse = 1 + Math.sin(beaconAnimation.pulsePhase) * 0.3;
      const pulseSize = RENDERING.BEACON_PULSE_SIZE * pulse;
      ctx.beginPath();
      ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = bColor;
      ctx.globalAlpha = RENDERING.BEACON_PULSE_OPACITY;
      ctx.fill();
      beaconAnimation.pulsePhase = (beaconAnimation.pulsePhase + 0.1) % (Math.PI * 2);
    } else if (bStyle === "ripple") {
      const now = Date.now();
      if (!point.lastRipple || now - point.lastRipple > RENDERING.BEACON_RIPPLE_INTERVAL) {
        beaconAnimation.ripples.push({
          x: point.x,
          y: point.y,
          radius: 0,
          opacity: 0.5,
          startTime: now,
          color: bColor
        });
        point.lastRipple = now;
      }
      beaconAnimation.ripples = beaconAnimation.ripples.filter((ripple) => {
        const age = now - ripple.startTime;
        if (age > RENDERING.BEACON_RIPPLE_DURATION) return false;
        const radius = age / RENDERING.BEACON_RIPPLE_SPEED;
        const fadeProgress = age / RENDERING.BEACON_RIPPLE_DURATION;
        const opacity = 0.5 * (1 - Easing.cubicOut(fadeProgress));
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = ripple.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = opacity;
        ctx.stroke();
        return true;
      });
      ctx.beginPath();
      ctx.fillStyle = bColor;
      ctx.globalAlpha = 0.8;
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  /**
   * Render waypoint markers
   */
  renderWaypoints(ctx, waypoints, selectedWaypoint, styles, imageToCanvas, displayWidth, displayHeight) {
    waypoints.forEach((waypoint) => {
      if (waypoint.isMajor) {
        const wpCanvas = imageToCanvas(waypoint.imgX, waypoint.imgY);
        const isSelected = waypoint === selectedWaypoint;
        const markerSize = waypoint.dotSize || styles.dotSize;
        const size = isSelected ? markerSize * 1.3 : markerSize;
        const markerStyle = waypoint.markerStyle || styles.markerStyle;
        if (markerStyle === "none") {
          this.renderLabel(ctx, waypoint, wpCanvas.x, wpCanvas.y, 0, waypoints, styles.animationEngine, displayWidth, displayHeight);
          return;
        }
        ctx.fillStyle = waypoint.dotColor || waypoint.segmentColor || styles.dotColor;
        ctx.strokeStyle = isSelected ? "#4a90e2" : "white";
        ctx.lineWidth = isSelected ? 3 : 2;
        if (markerStyle === "square") {
          ctx.beginPath();
          ctx.rect(wpCanvas.x - size, wpCanvas.y - size, size * 2, size * 2);
          ctx.fill();
          ctx.stroke();
        } else if (markerStyle === "flag") {
          ctx.beginPath();
          ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          ctx.lineTo(wpCanvas.x, wpCanvas.y + size);
          ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          ctx.lineTo(wpCanvas.x + size * 1.5, wpCanvas.y - size * 1.3);
          ctx.lineTo(wpCanvas.x + size * 1.2, wpCanvas.y - size);
          ctx.lineTo(wpCanvas.x, wpCanvas.y - size * 0.7);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(wpCanvas.x, wpCanvas.y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        this.renderLabel(ctx, waypoint, wpCanvas.x, wpCanvas.y, size, waypoints, styles.animationEngine, displayWidth, displayHeight);
      }
    });
  }
  /**
   * Render waypoint labels
   */
  renderLabel(ctx, waypoint, x, y, dotSize, waypoints, animationEngine, displayWidth, displayHeight) {
    if (!waypoint.label || waypoint.labelMode === "none") return;
    const wpIndex = waypoints.indexOf(waypoint);
    const totalPoints = this.waypointPositions.length;
    let waypointPointIndex = 0;
    if (wpIndex < waypoints.length - 1) {
      waypointPointIndex = wpIndex / (waypoints.length - 1) * totalPoints;
    } else {
      waypointPointIndex = totalPoints;
    }
    const exactCurrentPoint = totalPoints * animationEngine.getProgress();
    const fadeTimeInPoints = totalPoints * 0.02;
    let opacity = 0;
    switch (waypoint.labelMode) {
      case "on":
        opacity = 1;
        break;
      case "fade":
        if (exactCurrentPoint < waypointPointIndex) return;
        const elapsed = exactCurrentPoint - waypointPointIndex;
        if (elapsed <= fadeTimeInPoints / 2) {
          opacity = Math.min(1, elapsed / (fadeTimeInPoints / 2));
          opacity = Math.pow(opacity, 0.5);
        } else if (elapsed <= fadeTimeInPoints * 3) {
          opacity = 1;
        } else if (elapsed <= fadeTimeInPoints * 4) {
          opacity = 1 - Math.min(1, (elapsed - fadeTimeInPoints * 3) / fadeTimeInPoints);
        } else {
          return;
        }
        break;
      case "persist":
        const timeBeforeWaypoint = waypointPointIndex - exactCurrentPoint;
        if (timeBeforeWaypoint > fadeTimeInPoints) return;
        if (timeBeforeWaypoint > 0) {
          const fadeProgress = 1 - timeBeforeWaypoint / fadeTimeInPoints;
          opacity = Math.pow(fadeProgress, 0.5);
        } else {
          opacity = 1;
        }
        break;
      default:
        return;
    }
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, opacity);
    ctx.font = "bold 16px Arial";
    const blueAmount = opacity < 1 ? Math.max(0, 1 - opacity) * 60 : 0;
    ctx.fillStyle = "rgb(".concat(255 - blueAmount, ", ").concat(255 - blueAmount, ", 255)");
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    const padding = RENDERING.LABEL_OFFSET_X;
    const position = waypoint.labelPosition || "auto";
    let labelX = x;
    let labelY = y;
    switch (position) {
      case "top":
        labelY = y - dotSize - padding;
        break;
      case "right":
        labelX = x + dotSize + padding;
        ctx.textAlign = "left";
        break;
      case "bottom":
        labelY = y + dotSize + padding;
        break;
      case "left":
        labelX = x - dotSize - padding;
        ctx.textAlign = "right";
        break;
      case "auto":
      default:
        const cw = displayWidth;
        const ch = displayHeight;
        labelY = y - dotSize - padding;
        if (labelY < 30) {
          labelY = y + dotSize + padding;
        }
        if (x < 100) {
          labelX = x + dotSize + padding;
          ctx.textAlign = "left";
        } else if (x > cw - 100) {
          labelX = x - dotSize - padding;
          ctx.textAlign = "right";
        }
        break;
    }
    ctx.strokeText(waypoint.label, labelX, labelY);
    ctx.fillText(waypoint.label, labelX, labelY);
    ctx.restore();
  }
  /**
   * Apply line style for path rendering
   */
  applyLineStyle(ctx, style) {
    switch (style) {
      case "dotted":
        ctx.setLineDash([2, 6]);
        break;
      case "dashed":
        ctx.setLineDash([10, 5]);
        break;
      case "squiggle":
        ctx.setLineDash([5, 3, 2, 3]);
        break;
      case "solid":
      default:
        ctx.setLineDash([]);
        break;
    }
  }
};

// src/core/EventBus.js
var EventBus = class {
  constructor() {
    this.events = /* @__PURE__ */ new Map();
  }
  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    const listeners = this.events.get(eventName);
    listeners.push(callback);
    return () => this.off(eventName, callback);
  }
  /**
   * Subscribe to an event (alias for on)
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventName, callback) {
    return this.on(eventName, callback);
  }
  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to remove
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) return;
    const listeners = this.events.get(eventName);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length === 0) {
      this.events.delete(eventName);
    }
  }
  /**
   * Unsubscribe from an event (alias for off)
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to remove
   */
  unsubscribe(eventName, callback) {
    this.off(eventName, callback);
  }
  /**
   * Subscribe to an event that only fires once
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper);
    };
    return this.on(eventName, wrapper);
  }
  /**
   * Emit an event
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments to pass to listeners
   */
  emit(eventName, ...args) {
    if (!this.events.has(eventName)) return;
    const listeners = this.events.get(eventName);
    const listenersCopy = [...listeners];
    listenersCopy.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error("Error in event listener for ".concat(eventName, ":"), error);
      }
    });
  }
  /**
   * Emit an event (alias for emit)
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments to pass to listeners
   */
  publish(eventName, ...args) {
    this.emit(eventName, ...args);
  }
  /**
   * Emit an event asynchronously
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments to pass to listeners
   * @returns {Promise} Promise that resolves when all listeners have been called
   */
  async emitAsync(eventName, ...args) {
    if (!this.events.has(eventName)) return;
    const listeners = this.events.get(eventName);
    const listenersCopy = [...listeners];
    const promises = listenersCopy.map((listener) => {
      return Promise.resolve().then(() => listener(...args));
    });
    await Promise.all(promises);
  }
  /**
   * Remove all listeners for an event
   * @param {string} eventName - Name of the event
   */
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }
  /**
   * Get the number of listeners for an event
   * @param {string} eventName - Name of the event
   * @returns {number} Number of listeners
   */
  listenerCount(eventName) {
    if (!this.events.has(eventName)) return 0;
    return this.events.get(eventName).length;
  }
  /**
   * Get all event names
   * @returns {Array} Array of event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }
  /**
   * Clear all events and listeners
   */
  clear() {
    this.events.clear();
  }
  /**
   * Destroy the event bus
   */
  destroy() {
    this.clear();
  }
};

// src/models/Waypoint.js
var Waypoint = class _Waypoint {
  constructor(options = {}) {
    this.imgX = options.imgX || 0;
    this.imgY = options.imgY || 0;
    this.isMajor = options.isMajor !== void 0 ? options.isMajor : true;
    this._dirtyProps = /* @__PURE__ */ new Set();
    this.segmentColor = options.segmentColor || RENDERING.DEFAULT_PATH_COLOR;
    this.segmentWidth = options.segmentWidth || RENDERING.DEFAULT_PATH_THICKNESS;
    this.segmentStyle = options.segmentStyle || "solid";
    this.segmentTension = options.segmentTension || 0.5;
    this.pathShape = options.pathShape || "line";
    this.markerStyle = options.markerStyle || "dot";
    this.dotColor = options.dotColor || RENDERING.DEFAULT_PATH_COLOR;
    this.dotSize = options.dotSize || (this.isMajor ? RENDERING.DEFAULT_DOT_SIZE : RENDERING.MINOR_DOT_SIZE);
    this.beaconStyle = options.beaconStyle || "none";
    this.beaconColor = options.beaconColor || RENDERING.DEFAULT_PATH_COLOR;
    this.label = options.label || "";
    this.labelMode = options.labelMode || "none";
    this.labelPosition = options.labelPosition || "auto";
    this.pauseMode = options.pauseMode || "none";
    this.pauseTime = options.pauseTime || ANIMATION.DEFAULT_WAIT_TIME;
    this.pathHeadStyle = options.pathHeadStyle || "arrow";
    this.pathHeadColor = options.pathHeadColor || "#111111";
    this.pathHeadSize = options.pathHeadSize || RENDERING.PATH_HEAD_SIZE;
    this.pathHeadImage = options.pathHeadImage || null;
    this.customImage = options.customImage || null;
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
    return "wp_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
  }
  /**
   * Update waypoint properties
   * Tracks which properties changed for smart event emission
   * @param {Object} updates - Properties to update
   */
  update(updates) {
    Object.keys(updates).forEach((key) => {
      if (key in this && key !== "id" && key !== "created") {
        if (this[key] !== updates[key]) {
          this[key] = updates[key];
          this._dirtyProps.add(key);
        }
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
    if (!this.isMajor) {
      this.labelMode = "none";
      this.beaconStyle = "none";
      this.pauseMode = "none";
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
    return this.isMajor && this.pauseMode === "timed" && this.pauseTime > 0;
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
    return this.label && this.label.trim().length > 0 && this.labelMode !== "none";
  }
  /**
   * Check if waypoint has beacon effect
   * @returns {boolean} True if waypoint has beacon effect
   */
  hasBeacon() {
    return this.beaconStyle !== "none";
  }
  /**
   * Check if waypoint is visible
   * @returns {boolean} True if waypoint marker is visible
   */
  isVisible() {
    return this.markerStyle !== "none";
  }
  /**
   * Copy properties from another waypoint (for inheritance)
   * Useful when creating new waypoints that should inherit style from previous
   * @param {Waypoint} source - Waypoint to copy properties from
   * @param {Array<string>} exclude - Properties to exclude from copying
   * @returns {Waypoint} This waypoint (for chaining)
   */
  copyPropertiesFrom(source, exclude = ["id", "imgX", "imgY", "created", "modified", "label"]) {
    const copyProps = [
      "segmentColor",
      "segmentWidth",
      "segmentStyle",
      "segmentTension",
      "pathShape",
      "markerStyle",
      "dotColor",
      "dotSize",
      "beaconStyle",
      "beaconColor",
      "labelMode",
      "labelPosition",
      "pauseMode",
      "pauseTime",
      "pathHeadStyle",
      "pathHeadColor",
      "pathHeadSize",
      "pathHeadImage",
      "customImage"
    ];
    copyProps.forEach((prop) => {
      if (!exclude.includes(prop) && prop in source) {
        this[prop] = source[prop];
      }
    });
    if (!this.isMajor && source.isMajor) {
      this.labelMode = "none";
      this.beaconStyle = "none";
      this.pauseMode = "none";
    }
    this.modified = Date.now();
    return this;
  }
  /**
   * Get list of properties that have changed since last clear
   * @returns {Array<string>} Array of property names that changed
   */
  getDirtyProps() {
    return Array.from(this._dirtyProps);
  }
  /**
   * Clear the dirty properties tracker
   */
  clearDirtyProps() {
    this._dirtyProps.clear();
  }
  /**
   * Check if recent changes are style-only (no path recalculation needed)
   * @returns {boolean} True if only style properties changed
   */
  isStyleChange() {
    const styleProps = ["dotColor", "dotSize", "markerStyle", "beaconColor", "beaconStyle", "label", "labelMode", "labelPosition"];
    return this._dirtyProps.size > 0 && Array.from(this._dirtyProps).every((p) => styleProps.includes(p));
  }
  /**
   * Check if recent changes affect path generation
   * @returns {boolean} True if path properties changed
   */
  isPathChange() {
    const pathProps = ["segmentColor", "segmentWidth", "segmentStyle", "pathShape", "segmentTension"];
    return Array.from(this._dirtyProps).some((p) => pathProps.includes(p));
  }
  /**
   * Check if position changed
   * @returns {boolean} True if position changed
   */
  isPositionChange() {
    return this._dirtyProps.has("imgX") || this._dirtyProps.has("imgY");
  }
  /**
   * Clone the waypoint
   * @returns {Waypoint} New waypoint with same properties
   */
  clone() {
    return new _Waypoint(this.toJSON());
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
    return new _Waypoint(data);
  }
  /**
   * Create default major waypoint
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Waypoint} New major waypoint
   */
  static createMajor(x, y) {
    return new _Waypoint({
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
    return new _Waypoint({
      imgX: x,
      imgY: y,
      isMajor: false,
      labelMode: "none",
      beaconStyle: "none",
      pauseMode: "none",
      dotSize: RENDERING.MINOR_DOT_SIZE
    });
  }
  /**
   * Validate waypoint data
   * @param {Object} data - Data to validate
   * @returns {boolean} True if data is valid
   */
  static validate(data) {
    if (!data || typeof data !== "object") return false;
    if (typeof data.imgX !== "number" || data.imgX < 0 || data.imgX > 1) return false;
    if (typeof data.imgY !== "number" || data.imgY < 0 || data.imgY > 1) return false;
    if (data.markerStyle && !["dot", "square", "flag", "none"].includes(data.markerStyle)) return false;
    if (data.segmentStyle && !["solid", "dashed", "dotted"].includes(data.segmentStyle)) return false;
    if (data.pathShape && !["line", "squiggle", "randomised"].includes(data.pathShape)) return false;
    if (data.beaconStyle && !["none", "pulse", "ripple"].includes(data.beaconStyle)) return false;
    if (data.labelMode && !["none", "on", "fade", "persist"].includes(data.labelMode)) return false;
    if (data.pauseMode && !["none", "timed"].includes(data.pauseMode)) return false;
    return true;
  }
};

// src/controllers/UIController.js
var UIController = class {
  constructor(elements, eventBus) {
    this.elements = elements;
    this.eventBus = eventBus;
    this.selectedWaypoint = null;
    this.updateWaypointList = this.updateWaypointList.bind(this);
    this.updateWaypointEditor = this.updateWaypointEditor.bind(this);
    this.syncAnimationControls = this.syncAnimationControls.bind(this);
    this.setupEventListeners();
  }
  /**
   * Set up all UI event listeners
   */
  setupEventListeners() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    console.log("\u{1F527} [UIController] Setting up event listeners at:", performance.now().toFixed(2), "ms");
    (_a = this.elements.tabBtns) == null ? void 0 : _a.forEach((btn) => {
      btn.addEventListener("click", (e) => this.handleTabSwitch(e));
    });
    (_b = this.elements.bgUploadBtn) == null ? void 0 : _b.addEventListener("click", () => {
      this.elements.bgUpload.click();
    });
    (_c = this.elements.bgUpload) == null ? void 0 : _c.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.eventBus.emit("background:upload", file);
      }
    });
    (_d = this.elements.bgOverlay) == null ? void 0 : _d.addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      this.elements.bgOverlayValue.textContent = value;
      this.eventBus.emit("background:overlay-change", value);
    });
    (_e = this.elements.bgFitToggle) == null ? void 0 : _e.addEventListener("click", () => {
      const currentMode = this.elements.bgFitToggle.dataset.mode;
      const newMode = currentMode === "fit" ? "fill" : "fit";
      this.elements.bgFitToggle.dataset.mode = newMode;
      this.elements.bgFitToggle.textContent = newMode === "fit" ? "Fit" : "Fill";
      this.eventBus.emit("background:mode-change", newMode);
    });
    (_f = this.elements.playBtn) == null ? void 0 : _f.addEventListener("click", () => {
      this.eventBus.emit("ui:animation:play");
    });
    (_g = this.elements.pauseBtn) == null ? void 0 : _g.addEventListener("click", () => {
      this.eventBus.emit("ui:animation:pause");
    });
    (_h = this.elements.skipStartBtn) == null ? void 0 : _h.addEventListener("click", () => {
      this.eventBus.emit("ui:animation:skip-start");
    });
    (_i = this.elements.skipEndBtn) == null ? void 0 : _i.addEventListener("click", () => {
      this.eventBus.emit("ui:animation:skip-end");
    });
    (_j = this.elements.timelineSlider) == null ? void 0 : _j.addEventListener("input", (e) => {
      const progress = e.target.value / ANIMATION.TIMELINE_RESOLUTION;
      this.eventBus.emit("ui:animation:seek", progress);
    });
    let isUpdatingSlider = false;
    (_k = this.elements.animationSpeed) == null ? void 0 : _k.addEventListener("input", (e) => {
      const currentValue = parseInt(e.target.value);
      const timestamp = performance.now().toFixed(2);
      console.log("\n\u{1F4E1} [".concat(timestamp, "ms] SLIDER INPUT EVENT:"), {
        value: currentValue,
        isTrusted: e.isTrusted,
        isUpdating: isUpdatingSlider,
        hasFocus: document.activeElement === e.target,
        eventType: e.type,
        target: e.target.id
      });
      if (isUpdatingSlider) {
        console.log("\u{1F6E1}\uFE0F [UIController] Blocked programmatic input event, value:", currentValue);
        console.trace("Blocked event stack trace");
        return;
      }
      const speed = currentValue;
      console.log("\u{1F39A}\uFE0F [UIController] User moved slider to:", speed);
      console.trace("User input stack trace");
      this.eventBus.emit("animation:speed-change", speed);
    });
    this.eventBus.on("ui:slider:update-speed", (speed) => {
      const timestamp = performance.now().toFixed(2);
      const step = 5;
      const roundedSpeed = Math.round(speed / step) * step;
      console.log("\n\u{1F4B5} [".concat(timestamp, "ms] PROGRAMMATIC UPDATE:"), {
        requested: speed,
        rounded: roundedSpeed,
        currentSliderValue: this.elements.animationSpeed.value
      });
      console.trace("Update origin");
      isUpdatingSlider = true;
      this.elements.animationSpeed.value = roundedSpeed;
      console.log("\u2705 [".concat(performance.now().toFixed(2), "ms] Protection ENABLED"));
      setTimeout(() => {
        const t = performance.now().toFixed(2);
        console.log("\u2705 [".concat(t, "ms] Re-enabling slider input detection"));
        isUpdatingSlider = false;
      }, 50);
    });
    (_l = this.elements.clearBtn) == null ? void 0 : _l.addEventListener("click", () => {
      if (confirm("Clear all waypoints?")) {
        this.eventBus.emit("waypoints:clear-all");
      }
    });
    (_m = this.elements.helpBtn) == null ? void 0 : _m.addEventListener("click", () => {
      this.showHelp();
    });
    this.setupWaypointEditorControls();
  }
  /**
   * Setup waypoint editor controls
   */
  setupWaypointEditorControls() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    (_a = this.elements.markerStyle) == null ? void 0 : _a.addEventListener("change", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "markerStyle",
          value: e.target.value
        });
      }
    });
    (_b = this.elements.dotColor) == null ? void 0 : _b.addEventListener("input", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "dotColor",
          value: e.target.value
        });
      }
    });
    (_c = this.elements.dotSize) == null ? void 0 : _c.addEventListener("input", (e) => {
      const size = parseInt(e.target.value);
      this.elements.dotSizeValue.textContent = size;
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "dotSize",
          value: size
        });
      }
    });
    (_d = this.elements.segmentColor) == null ? void 0 : _d.addEventListener("input", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:path-property-changed", {
          waypoint: this.selectedWaypoint,
          property: "segmentColor",
          value: e.target.value
        });
      }
    });
    (_e = this.elements.segmentWidth) == null ? void 0 : _e.addEventListener("input", (e) => {
      const width = parseInt(e.target.value);
      this.elements.segmentWidthValue.textContent = width;
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:path-property-changed", {
          waypoint: this.selectedWaypoint,
          property: "segmentWidth",
          value: width
        });
      }
    });
    (_f = this.elements.segmentStyle) == null ? void 0 : _f.addEventListener("change", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:path-property-changed", {
          waypoint: this.selectedWaypoint,
          property: "segmentStyle",
          value: e.target.value
        });
      }
    });
    (_g = this.elements.pathShape) == null ? void 0 : _g.addEventListener("change", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:path-property-changed", {
          waypoint: this.selectedWaypoint,
          property: "pathShape",
          value: e.target.value
        });
      }
    });
    (_h = this.elements.editorBeaconStyle) == null ? void 0 : _h.addEventListener("change", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "beaconStyle",
          value: e.target.value
        });
      }
    });
    (_i = this.elements.editorBeaconColor) == null ? void 0 : _i.addEventListener("input", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "beaconColor",
          value: e.target.value
        });
      }
    });
    (_j = this.elements.waypointLabel) == null ? void 0 : _j.addEventListener("input", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "label",
          value: e.target.value
        });
      }
    });
    (_k = this.elements.labelMode) == null ? void 0 : _k.addEventListener("change", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "labelMode",
          value: e.target.value
        });
      }
    });
    (_l = this.elements.labelPosition) == null ? void 0 : _l.addEventListener("change", (e) => {
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "labelPosition",
          value: e.target.value
        });
      }
    });
    (_m = this.elements.waypointPauseTime) == null ? void 0 : _m.addEventListener("input", (e) => {
      const time = parseFloat(e.target.value);
      this.elements.waypointPauseTimeValue.textContent = "".concat(time, "s");
      if (this.selectedWaypoint) {
        this.eventBus.emit("waypoint:style-changed", {
          waypoint: this.selectedWaypoint,
          property: "pauseTime",
          value: time * 1e3
          // Convert to ms
        });
      }
    });
    (_n = this.elements.pathHeadStyle) == null ? void 0 : _n.addEventListener("change", (e) => {
      this.eventBus.emit("pathhead:style-changed", e.target.value);
    });
    (_o = this.elements.pathHeadColor) == null ? void 0 : _o.addEventListener("input", (e) => {
      this.eventBus.emit("pathhead:color-changed", e.target.value);
    });
    (_p = this.elements.pathHeadSize) == null ? void 0 : _p.addEventListener("input", (e) => {
      const size = parseInt(e.target.value);
      this.elements.pathHeadSizeValue.textContent = size;
      this.eventBus.emit("pathhead:size-changed", size);
    });
  }
  /**
   * Handle tab switching
   */
  handleTabSwitch(event) {
    const tabBtn = event.target;
    const tabName = tabBtn.dataset.tab;
    this.elements.tabBtns.forEach((btn) => btn.classList.remove("active"));
    tabBtn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    const tabContent = document.getElementById("".concat(tabName, "-tab"));
    if (tabContent) {
      tabContent.classList.add("active");
    }
  }
  /**
   * Update waypoint list UI
   */
  updateWaypointList(waypoints) {
    if (!this.elements.waypointList) return;
    this.elements.waypointList.innerHTML = "";
    const majorWaypoints = waypoints.filter((wp) => wp.isMajor);
    majorWaypoints.forEach((waypoint, index) => {
      const item = document.createElement("div");
      item.className = "waypoint-item";
      item.draggable = true;
      if (waypoint === this.selectedWaypoint) {
        item.classList.add("selected");
      }
      const handle = document.createElement("span");
      handle.className = "waypoint-item-handle";
      handle.textContent = "\u2630";
      const label = document.createElement("span");
      label.className = "waypoint-item-label";
      label.textContent = waypoint.label || "Waypoint ".concat(index + 1);
      const delBtn = document.createElement("button");
      delBtn.className = "waypoint-item-delete";
      delBtn.textContent = "\xD7";
      delBtn.title = "Delete waypoint";
      item.appendChild(handle);
      item.appendChild(label);
      item.appendChild(delBtn);
      const selectWaypoint = (e) => {
        e.stopPropagation();
        this.eventBus.emit("waypoint:selected", waypoint);
      };
      label.addEventListener("click", selectWaypoint);
      handle.addEventListener("click", selectWaypoint);
      item.addEventListener("click", selectWaypoint);
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Delete this waypoint?")) {
          this.eventBus.emit("waypoint:deleted", waypoint);
        }
      });
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", (e) => {
        item.classList.remove("dragging");
      });
      item.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const dragging = this.elements.waypointList.querySelector(".dragging");
        if (dragging && dragging !== item) {
          const rect = item.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          if (e.clientY < midpoint) {
            item.parentNode.insertBefore(dragging, item);
          } else {
            item.parentNode.insertBefore(dragging, item.nextSibling);
          }
        }
      });
      item.addEventListener("drop", (e) => {
        e.preventDefault();
        const items = Array.from(this.elements.waypointList.children);
        const newOrder = items.map((el) => {
          const idx = Array.from(el.parentElement.children).indexOf(el);
          return majorWaypoints[parseInt(el.dataset.originalIndex || idx)];
        });
        this.eventBus.emit("waypoints:reordered", newOrder);
      });
      item.dataset.originalIndex = index;
      this.elements.waypointList.appendChild(item);
    });
  }
  /**
   * Update waypoint editor with selected waypoint data
   */
  updateWaypointEditor(waypoint) {
    this.selectedWaypoint = waypoint;
    if (!waypoint) {
      if (this.elements.waypointEditor) {
        this.elements.waypointEditor.style.display = "none";
      }
      if (this.elements.waypointEditorPlaceholder) {
        this.elements.waypointEditorPlaceholder.style.display = "flex";
      }
      return;
    }
    if (this.elements.waypointEditor) {
      this.elements.waypointEditor.style.display = "block";
    }
    if (this.elements.waypointEditorPlaceholder) {
      this.elements.waypointEditorPlaceholder.style.display = "none";
    }
    if (this.elements.markerStyle) {
      this.elements.markerStyle.value = waypoint.markerStyle || "dot";
    }
    if (this.elements.dotColor) {
      this.elements.dotColor.value = waypoint.dotColor || "#FF6B6B";
    }
    if (this.elements.dotSize) {
      this.elements.dotSize.value = waypoint.dotSize || 8;
      this.elements.dotSizeValue.textContent = waypoint.dotSize || 8;
    }
    if (this.elements.segmentColor) {
      this.elements.segmentColor.value = waypoint.segmentColor || "#FF6B6B";
    }
    if (this.elements.segmentWidth) {
      this.elements.segmentWidth.value = waypoint.segmentWidth || 3;
      this.elements.segmentWidthValue.textContent = waypoint.segmentWidth || 3;
    }
    if (this.elements.segmentStyle) {
      this.elements.segmentStyle.value = waypoint.segmentStyle || "solid";
    }
    if (this.elements.pathShape) {
      this.elements.pathShape.value = waypoint.pathShape || "line";
    }
    if (this.elements.editorBeaconStyle) {
      this.elements.editorBeaconStyle.value = waypoint.beaconStyle || "pulse";
    }
    if (this.elements.editorBeaconColor) {
      this.elements.editorBeaconColor.value = waypoint.beaconColor || "#FF6B6B";
    }
    if (this.elements.waypointLabel) {
      this.elements.waypointLabel.value = waypoint.label || "";
    }
    if (this.elements.labelMode) {
      this.elements.labelMode.value = waypoint.labelMode || "none";
    }
    if (this.elements.labelPosition) {
      this.elements.labelPosition.value = waypoint.labelPosition || "auto";
    }
    if (this.elements.waypointPauseTime) {
      const pauseSeconds = (waypoint.pauseTime || 1500) / 1e3;
      this.elements.waypointPauseTime.value = pauseSeconds;
      this.elements.waypointPauseTimeValue.textContent = "".concat(pauseSeconds, "s");
    }
    const pauseControl = this.elements.pauseTimeControl;
    if (pauseControl) {
      pauseControl.style.display = waypoint.isMajor ? "block" : "none";
    }
  }
  /**
   * Sync animation controls with animation state
   */
  syncAnimationControls(state) {
    if (state.isPlaying) {
      if (this.elements.playBtn) this.elements.playBtn.style.display = "none";
      if (this.elements.pauseBtn) this.elements.pauseBtn.style.display = "inline-block";
    } else {
      if (this.elements.playBtn) this.elements.playBtn.style.display = "inline-block";
      if (this.elements.pauseBtn) this.elements.pauseBtn.style.display = "none";
    }
    if (this.elements.timelineSlider && !state.isDraggingTimeline) {
      this.elements.timelineSlider.value = Math.round(state.progress * ANIMATION.TIMELINE_RESOLUTION);
    }
    this.updateTimeDisplay(state.currentTime, state.duration);
  }
  /**
   * Update time display
   */
  updateTimeDisplay(currentTime, duration) {
    const formatTime = (ms) => {
      const totalSeconds = Math.floor(ms / 1e3);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return "".concat(minutes, ":").concat(seconds.toString().padStart(2, "0"));
    };
    if (this.elements.currentTime) {
      this.elements.currentTime.textContent = formatTime(currentTime);
    }
    if (this.elements.totalTime) {
      this.elements.totalTime.textContent = formatTime(duration);
    }
  }
  /**
   * Show help/splash screen
   */
  showHelp() {
    if (this.elements.splash) {
      this.elements.splash.style.display = "flex";
    }
  }
  /**
   * Hide help/splash screen
   */
  hideHelp() {
    if (this.elements.splash) {
      this.elements.splash.style.display = "none";
    }
  }
  /**
   * Make an announcement for screen readers
   */
  announce(message) {
    if (this.elements.announcer) {
      this.elements.announcer.textContent = message;
    }
  }
};

// src/handlers/InteractionHandler.js
var InteractionHandler = class {
  constructor(canvas, eventBus) {
    this.canvas = canvas;
    this.eventBus = eventBus;
    this.isDragging = false;
    this.hasDragged = false;
    this.dragOffset = { x: 0, y: 0 };
    this.selectedWaypoint = null;
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleCanvasClick = this.handleCanvasClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.setupEventListeners();
  }
  /**
   * Set up all interaction event listeners
   */
  setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("click", this.handleCanvasClick);
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this), { passive: false });
    document.addEventListener("keydown", this.handleKeyDown);
    this.canvas.addEventListener("dragover", this.handleDragOver);
    this.canvas.addEventListener("drop", this.handleDrop);
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.handleContextMenu(e);
    });
  }
  /**
   * Handle mouse down event
   */
  handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.eventBus.emit("waypoint:check-at-position", { x, y }, (waypoint) => {
      if (waypoint) {
        this.selectedWaypoint = waypoint;
        this.isDragging = true;
        this.hasDragged = false;
        this.eventBus.emit(
          "coordinate:image-to-canvas",
          { imgX: waypoint.imgX, imgY: waypoint.imgY },
          (canvasPos) => {
            this.dragOffset.x = x - canvasPos.x;
            this.dragOffset.y = y - canvasPos.y;
          }
        );
        this.canvas.classList.add("dragging");
        this.eventBus.emit("waypoint:selected", waypoint);
      }
    });
  }
  /**
   * Handle mouse move event
   */
  handleMouseMove(event) {
    if (this.isDragging && this.selectedWaypoint) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.hasDragged = true;
      const newX = x - this.dragOffset.x;
      const newY = y - this.dragOffset.y;
      this.eventBus.emit(
        "coordinate:canvas-to-image",
        { canvasX: newX, canvasY: newY },
        (imgPos) => {
          this.eventBus.emit("waypoint:position-changed", {
            waypoint: this.selectedWaypoint,
            imgX: imgPos.x,
            imgY: imgPos.y,
            isDragging: true
          });
        }
      );
    }
  }
  /**
   * Handle mouse up event
   */
  handleMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.classList.remove("dragging");
      if (this.hasDragged) {
        this.eventBus.emit("waypoint:drag-ended", this.selectedWaypoint);
      }
      this.selectedWaypoint = null;
      this.hasDragged = false;
    }
  }
  /**
   * Handle canvas click event
   */
  handleCanvasClick(event) {
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.eventBus.emit("waypoint:check-at-position", { x, y }, (waypoint) => {
      if (waypoint) {
        this.eventBus.emit("waypoint:selected", waypoint);
      } else {
        const isMajor = !event.shiftKey;
        this.eventBus.emit(
          "coordinate:canvas-to-image",
          { canvasX: x, canvasY: y },
          (imgPos) => {
            this.eventBus.emit("waypoint:add", {
              imgX: imgPos.x,
              imgY: imgPos.y,
              isMajor
            });
          }
        );
      }
    });
  }
  /**
   * Handle keyboard events
   */
  handleKeyDown(event) {
    if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
      return;
    }
    const key = event.key.toLowerCase();
    const shift = event.shiftKey;
    const ctrl = event.ctrlKey || event.metaKey;
    if (key === " ") {
      event.preventDefault();
      this.eventBus.emit("ui:animation:toggle");
    } else if (key === "arrowleft" && !shift) {
      event.preventDefault();
      this.eventBus.emit("ui:animation:skip-start");
    } else if (key === "arrowright" && !shift) {
      event.preventDefault();
      this.eventBus.emit("ui:animation:skip-end");
    } else if (key === "j") {
      event.preventDefault();
      this.eventBus.emit("animation:speed-decrease");
    } else if (key === "k") {
      event.preventDefault();
      this.eventBus.emit("animation:speed-reset");
    } else if (key === "l") {
      event.preventDefault();
      this.eventBus.emit("animation:speed-increase");
    } else if (shift && this.selectedWaypoint) {
      const moveAmount = ctrl ? 10 : 1;
      let dx = 0, dy = 0;
      switch (key) {
        case "arrowup":
          dy = -moveAmount;
          break;
        case "arrowdown":
          dy = moveAmount;
          break;
        case "arrowleft":
          dx = -moveAmount;
          break;
        case "arrowright":
          dx = moveAmount;
          break;
        default:
          return;
      }
      if (dx !== 0 || dy !== 0) {
        event.preventDefault();
        this.eventBus.emit("waypoint:move-by-pixels", {
          waypoint: this.selectedWaypoint,
          dx,
          dy
        });
      }
    } else if ((key === "delete" || key === "backspace") && this.selectedWaypoint) {
      event.preventDefault();
      this.eventBus.emit("waypoint:delete-selected");
    } else if (key === "tab") {
      event.preventDefault();
      const direction = shift ? "previous" : "next";
      this.eventBus.emit("waypoint:select-adjacent", direction);
    } else if (key === "t" && this.selectedWaypoint) {
      event.preventDefault();
      this.eventBus.emit("waypoint:toggle-type", this.selectedWaypoint);
    } else if (ctrl && key === "z") {
      event.preventDefault();
      if (shift) {
        this.eventBus.emit("history:redo");
      } else {
        this.eventBus.emit("history:undo");
      }
    } else if (ctrl && key === "s") {
      event.preventDefault();
      this.eventBus.emit("file:save");
    } else if ((key === "?" || key === "h") && !ctrl) {
      event.preventDefault();
      this.eventBus.emit("help:toggle");
    }
  }
  /**
   * Handle touch start (mobile)
   */
  handleTouchStart(event) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }
  /**
   * Handle touch move (mobile)
   */
  handleTouchMove(event) {
    if (event.touches.length === 1 && this.isDragging) {
      event.preventDefault();
      const touch = event.touches[0];
      this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }
  /**
   * Handle touch end (mobile)
   */
  handleTouchEnd(event) {
    if (event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
      if (!this.hasDragged) {
        this.handleCanvasClick({
          clientX: touch.clientX,
          clientY: touch.clientY,
          shiftKey: false
        });
      }
    }
  }
  /**
   * Handle drag over event (for image drop)
   */
  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    this.canvas.classList.add("drag-over");
  }
  /**
   * Handle drop event (for image drop)
   */
  handleDrop(event) {
    event.preventDefault();
    this.canvas.classList.remove("drag-over");
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        this.eventBus.emit("background:upload", file);
      }
    }
  }
  /**
   * Handle context menu (right-click)
   */
  handleContextMenu(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.eventBus.emit("waypoint:check-at-position", { x, y }, (waypoint) => {
      if (waypoint) {
        this.eventBus.emit("waypoint:show-context-menu", {
          waypoint,
          x: event.clientX,
          y: event.clientY
        });
      } else {
        this.eventBus.emit("canvas:show-context-menu", {
          x: event.clientX,
          y: event.clientY,
          canvasX: x,
          canvasY: y
        });
      }
    });
  }
  /**
   * Set selected waypoint (for external updates)
   */
  setSelectedWaypoint(waypoint) {
    this.selectedWaypoint = waypoint;
  }
  /**
   * Clean up event listeners
   */
  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("click", this.handleCanvasClick);
    document.removeEventListener("keydown", this.handleKeyDown);
    this.canvas.removeEventListener("dragover", this.handleDragOver);
    this.canvas.removeEventListener("drop", this.handleDrop);
  }
};

// src/main.js
var RoutePlotter = class {
  constructor() {
    this.storageService = new StorageService();
    this.coordinateTransform = new CoordinateTransform();
    this.pathCalculator = new PathCalculatorWithWorker();
    this.renderingService = new RenderingService();
    this.eventBus = new EventBus();
    this.animationEngine = new AnimationEngine(this.eventBus);
    this.renderQueued = false;
    this._batchMode = false;
    this._lastDisplayedSecond = -1;
    this._majorWaypointsCache = null;
    this._durationUpdateTimeout = null;
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.waypoints = [];
    this.waypointsById = /* @__PURE__ */ new Map();
    this.pathPoints = [];
    this.selectedWaypoint = null;
    this.isDragging = false;
    this.hasDragged = false;
    this.dragOffset = { x: 0, y: 0 };
    this.styles = {
      pathColor: "#FF6B6B",
      pathThickness: 3,
      pathStyle: "solid",
      // solid, dashed, dotted
      pathShape: "line",
      // line, squiggle, randomised
      markerStyle: "dot",
      // dot, square, flag, none
      dotColor: "#FF6B6B",
      dotSize: RENDERING.DEFAULT_DOT_SIZE,
      beaconStyle: "pulse",
      // none, pulse, ripple
      beaconColor: "#FF6B6B",
      labelMode: "none",
      // none, on, fade, persist
      labelPosition: "auto",
      // auto, top, right, bottom, left
      pathHead: {
        style: "arrow",
        // dot, arrow, custom, none
        color: "#111111",
        size: 8,
        image: null,
        // For custom image
        rotation: 0
        // Automatically calculated based on path direction
      }
    };
    this.beaconAnimation = {
      pulsePhase: 0,
      ripples: []
    };
    this.background = {
      image: null,
      overlay: 0,
      // -100 (black) .. 0 (none) .. 100 (white)
      fit: "fit"
      // 'fit' | 'fill'
    };
    this.vectorCanvas = null;
    this.labels = {
      active: [],
      // Currently visible labels
      fadeTime: RENDERING.LABEL_FADE_TIME
      // Fade duration in ms for 'fade' mode
    };
    this.elements = {
      canvas: document.getElementById("canvas"),
      waypoints: document.getElementById("waypoints-tab"),
      settings: document.getElementById("settings-tab"),
      tabBtns: document.querySelectorAll(".tab-btn"),
      waypointList: document.getElementById("waypoint-list"),
      bgUploadBtn: document.getElementById("bg-upload-btn"),
      bgUpload: document.getElementById("bg-upload"),
      bgOverlay: document.getElementById("bg-overlay"),
      bgOverlayValue: document.getElementById("bg-overlay-value"),
      bgFitToggle: document.getElementById("bg-fit-toggle"),
      playBtn: document.getElementById("play-btn"),
      pauseBtn: document.getElementById("pause-btn"),
      skipStartBtn: document.getElementById("skip-start-btn"),
      skipEndBtn: document.getElementById("skip-end-btn"),
      timelineSlider: document.getElementById("timeline-slider"),
      currentTime: document.getElementById("current-time"),
      totalTime: document.getElementById("total-time"),
      // animationMode: document.getElementById('animation-mode'), // Removed from UI
      animationSpeed: document.getElementById("animation-speed"),
      animationSpeedValue: document.getElementById("animation-speed-value"),
      // animationDuration: document.getElementById('animation-duration'), // Removed from UI
      // animationDurationValue: document.getElementById('animation-duration-value'), // Removed from UI
      speedControl: document.getElementById("speed-control"),
      // durationControl: document.getElementById('duration-control'), // Removed from UI
      waypointEditor: document.getElementById("waypoint-editor"),
      waypointEditorPlaceholder: document.getElementById("waypoint-editor-placeholder"),
      waypointPauseTime: document.getElementById("waypoint-pause-time"),
      waypointPauseTimeValue: document.getElementById("waypoint-pause-time-value"),
      pauseTimeControl: document.getElementById("pause-time-control"),
      splash: document.getElementById("splash"),
      splashClose: document.getElementById("splash-close"),
      splashDontShow: document.getElementById("splash-dont-show"),
      segmentColor: document.getElementById("segment-color"),
      segmentWidth: document.getElementById("segment-width"),
      segmentWidthValue: document.getElementById("segment-width-value"),
      segmentStyle: document.getElementById("segment-style"),
      dotColor: document.getElementById("dot-color"),
      dotSize: document.getElementById("dot-size"),
      dotSizeValue: document.getElementById("dot-size-value"),
      markerStyle: document.getElementById("marker-style"),
      pathShape: document.getElementById("path-shape"),
      editorBeaconStyle: document.getElementById("editor-beacon-style"),
      editorBeaconColor: document.getElementById("editor-beacon-color"),
      waypointLabel: document.getElementById("waypoint-label"),
      labelMode: document.getElementById("label-mode"),
      labelPosition: document.getElementById("label-position"),
      helpBtn: document.getElementById("help-btn"),
      clearBtn: document.getElementById("clear-btn"),
      announcer: document.getElementById("announcer"),
      // Path head elements
      pathHeadStyle: document.getElementById("path-head-style"),
      pathHeadColor: document.getElementById("path-head-color"),
      pathHeadSize: document.getElementById("path-head-size"),
      pathHeadSizeValue: document.getElementById("path-head-size-value"),
      customHeadControls: document.getElementById("custom-head-controls"),
      headUploadBtn: document.getElementById("head-upload-btn"),
      headUpload: document.getElementById("head-upload"),
      headPreview: document.getElementById("head-preview"),
      headFilename: document.getElementById("head-filename"),
      headPreviewImg: document.getElementById("head-preview-img")
    };
    this.init();
  }
  init() {
    this.resizeCanvas();
    window.addEventListener("resize", () => {
      this.resizeCanvas();
      this.render();
    });
    this.elements.markerStyle.value = this.styles.markerStyle;
    this.elements.pathShape.value = this.styles.pathShape;
    this.elements.pathHeadStyle.value = this.styles.pathHead.style;
    this.elements.pathHeadColor.value = this.styles.pathHead.color;
    this.elements.pathHeadSize.value = this.styles.pathHead.size;
    this.elements.pathHeadSizeValue.textContent = this.styles.pathHead.size;
    this.elements.customHeadControls.style.display = this.styles.pathHead.style === "custom" ? "block" : "none";
    const defaultDuration = this.animationEngine.state.duration / 1e3;
    this.elements.animationSpeedValue.textContent = defaultDuration + "s";
    this.setupEventListeners();
    this.setupEventBusListeners();
    this.uiController = new UIController(this.elements, this.eventBus);
    this.interactionHandler = new InteractionHandler(this.canvas, this.eventBus);
    const defaultSpeed = this.animationEngine.state.speed || ANIMATION.DEFAULT_SPEED;
    const timestamp = performance.now().toFixed(2);
    console.log("\u{1F680} [".concat(timestamp, "ms] [init] Setting initial slider speed:"), defaultSpeed);
    this.eventBus.emit("ui:slider:update-speed", defaultSpeed);
    this.setupControllerEventConnections();
    if (this.storageService.shouldShowSplash()) {
      this.showSplash();
    }
    this.loadAutosave();
    if (!this.background.image) {
      this.loadDefaultImage();
    }
    this.animationEngine.setWaypointCheckCallback((progress) => {
      const majorWaypoints = this.getMajorWaypointPositions();
      if (majorWaypoints.length > 0) {
        this.checkForWaypointWait(progress, majorWaypoints);
      }
    });
    this.setupAnimationEngineListeners();
    this.animationEngine.seekToProgress(1);
    this.animationEngine.pause();
    this.render();
    this.startRenderLoop();
    console.log("Route Plotter v3 initialized");
  }
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const controlsHeight = RENDERING.CONTROLS_HEIGHT;
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.min(dpr * 2, 3);
    this.canvas.width = rect.width * scale;
    this.canvas.height = rect.height * scale;
    this.canvasScale = scale;
    this.ctx.scale(scale, scale);
    this.ctx.imageSmoothingEnabled = false;
    this.displayWidth = rect.width;
    this.displayHeight = rect.height - controlsHeight;
    this.coordinateTransform.setCanvasDimensions(this.displayWidth, this.displayHeight);
    console.log("Canvas resized to:", rect.width, "x", rect.height, "at", scale + "x scale", "(usable height:", this.displayHeight + ")");
    this.render();
  }
  setupEventListeners() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab;
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"));
        document.getElementById("".concat(tabName, "-tab")).classList.add("active");
      });
    });
    console.log("\u{1F527} [Splash] Setting up event listeners:", {
      splash: !!this.elements.splash,
      splashClose: !!this.elements.splashClose,
      splashDontShow: !!this.elements.splashDontShow
    });
    if (this.elements.splashClose) {
      this.elements.splashClose.addEventListener("click", (e) => {
        console.log("\u{1F3AF} [Splash] Close button clicked");
        e.stopPropagation();
        this.hideSplash();
      });
    } else {
      console.error("\u274C [Splash] Close button element not found!");
    }
    if (this.elements.splash) {
      this.elements.splash.addEventListener("click", (e) => {
        console.log("\u{1F3AF} [Splash] Background clicked, target:", e.target.id || e.target.className);
        if (e.target === this.elements.splash) {
          console.log("\u2705 [Splash] Closing splash (background click)");
          this.hideSplash();
        } else {
          console.log("\u274C [Splash] Not closing (clicked on content)");
        }
      });
    } else {
      console.error("\u274C [Splash] Splash element not found!");
    }
  }
  /**
   * Queue a render operation to be executed on next animation frame
   * Prevents multiple renders in same frame for better performance
   * Example: Changing 3 waypoint properties = 1 render instead of 3
   */
  queueRender() {
    if (!this.renderQueued) {
      this.renderQueued = true;
      requestAnimationFrame(() => {
        this.render();
        this.renderQueued = false;
      });
    }
  }
  /**
   * Begin batch mode - prevents redundant calculations during bulk operations
   * Use when adding/loading multiple waypoints at once
   */
  beginBatch() {
    this._batchMode = true;
  }
  /**
   * End batch mode and trigger single update
   * Calculates path once for all batched changes
   */
  endBatch() {
    this._batchMode = false;
    if (this.waypoints.length >= 2) {
      this.calculatePath();
    }
    this.updateWaypointList();
    this.autoSave();
    this.queueRender();
  }
  /**
   * Get waypoint by ID with O(1) lookup
   * @param {string} id - Waypoint ID
   * @returns {Waypoint|undefined} Waypoint instance or undefined
   */
  getWaypointById(id) {
    return this.waypointsById.get(id);
  }
  /**
   * Add waypoint to ID lookup map
   * @private
   * @param {Waypoint} waypoint - Waypoint to add
   */
  _addWaypointToMap(waypoint) {
    this.waypointsById.set(waypoint.id, waypoint);
  }
  /**
   * Remove waypoint from ID lookup map
   * @private
   * @param {Waypoint} waypoint - Waypoint to remove
   */
  _removeWaypointFromMap(waypoint) {
    this.waypointsById.delete(waypoint.id);
  }
  /**
   * Set up EventBus listeners for decoupled component communication
   * Uses event-driven architecture to reduce tight coupling between methods
   * Events are categorized by change type for optimal performance:
   * - position-changed: Requires path recalculation (expensive)
   * - style-changed: Only visual update needed (cheap)
   * - path-property-changed: Affects path generation (medium cost)
   */
  setupEventBusListeners() {
    this.eventBus.on("waypoint:added", (waypoint) => {
      if (!(waypoint instanceof Waypoint)) {
        console.error("Invalid waypoint: not a Waypoint instance", waypoint);
        return;
      }
      this._addWaypointToMap(waypoint);
      this._majorWaypointsCache = null;
      if (this._batchMode) return;
      if (this.waypoints.length >= 2) {
        this.calculatePath();
      }
      this.updateWaypointList();
      this.autoSave();
      this.queueRender();
    });
    this.eventBus.on("waypoint:deleted", (index) => {
      this._majorWaypointsCache = null;
      if (this.waypoints.length >= 2) {
        this.calculatePath();
      } else {
        this.pathPoints = [];
      }
      this.updateWaypointList();
      this.updateWaypointEditor();
      this.autoSave();
      this.queueRender();
    });
    this.eventBus.on("waypoint:selected", (waypoint) => {
      this.updateWaypointEditor();
      this.queueRender();
    });
    this.eventBus.on("waypoint:position-changed", (waypoint) => {
      if (waypoint.imgX < 0 || waypoint.imgX > 1 || waypoint.imgY < 0 || waypoint.imgY > 1) {
        console.warn("Waypoint position out of bounds, clamping:", waypoint.id);
        waypoint.setPosition(waypoint.imgX, waypoint.imgY);
      }
      this.calculatePath();
      this.updateWaypointList();
      this.autoSave();
      this.queueRender();
    });
    this.eventBus.on("waypoint:style-changed", (waypoint) => {
      this.queueRender();
      this.autoSave();
    });
    this.eventBus.on("waypoint:path-property-changed", (waypoint) => {
      this.calculatePath();
      this.autoSave();
      this.queueRender();
    });
  }
  /**
   * Set up AnimationEngine event listeners
   * AnimationEngine emits events through EventBus with 'animation:' prefix
   * Provides event-driven updates for animation state changes
   * Performance optimization: React to engine events instead of polling
   */
  setupAnimationEngineListeners() {
    this.eventBus.on("animation:play", () => {
      this.elements.playBtn.style.display = "none";
      this.elements.pauseBtn.style.display = "inline-block";
      this.announce("Playing animation");
    });
    this.eventBus.on("animation:pause", () => {
      this.elements.playBtn.style.display = "inline-block";
      this.elements.pauseBtn.style.display = "none";
      this.announce("Animation paused");
    });
    this.eventBus.on("animation:complete", () => {
      this.elements.playBtn.style.display = "inline-block";
      this.elements.pauseBtn.style.display = "none";
      this.announce("Animation complete");
    });
    this.eventBus.on("animation:reset", () => {
      const timestamp = performance.now().toFixed(2);
      this.elements.playBtn.style.display = "inline-block";
      this.elements.pauseBtn.style.display = "none";
      this.announce("Animation reset");
      const preservedSpeed = this.animationEngine.state.speed;
      console.log("\u{1F527} [".concat(timestamp, "ms] [animation:reset] Syncing slider to preserved speed:"), preservedSpeed);
      console.trace("Reset origin");
      if (this.pathPoints && this.pathPoints.length > 0) {
        const totalLength = this.pathCalculator.calculatePathLength(this.pathPoints);
        const totalDuration = totalLength / preservedSpeed * 1e3;
        console.log("\u{1F4CF} [".concat(timestamp, "ms] [animation:reset] Recalculating duration - length:"), totalLength.toFixed(1), "speed:", preservedSpeed, "duration:", (totalDuration / 1e3).toFixed(1) + "s");
        this.animationEngine.setDuration(totalDuration);
        const durationSec = Math.round(totalDuration / 100) / 10;
        this.elements.animationSpeedValue.textContent = durationSec + "s";
      }
      this.eventBus.emit("ui:slider:update-speed", preservedSpeed);
    });
    this.eventBus.on("animation:waypointWaitEnd", (waypointIndex) => {
      console.log("Wait complete at waypoint", waypointIndex);
      this.announce("Continuing animation");
    });
  }
  /**
   * Set up event connections for UI Controller and Interaction Handler
   */
  setupControllerEventConnections() {
    this.eventBus.on("background:upload", (file) => {
      this.loadImageFile(file).then((img) => {
        this.background.image = img;
        this.updateImageTransform(img);
        if (this.waypoints.length >= 2) {
          this.calculatePath();
        }
        this.render();
        this.autoSave();
      });
    });
    this.eventBus.on("background:overlay-change", (value) => {
      this.background.overlay = value;
      this.render();
      this.autoSave();
    });
    this.eventBus.on("background:mode-change", (mode) => {
      this.background.fit = mode;
      this.coordinateTransform.fitMode = mode;
      this.updateImageTransform(this.background.image);
      this.render();
      this.autoSave();
    });
    this.eventBus.on("ui:animation:play", () => {
      console.log("\u25B6\uFE0F  [UI Event] ui:animation:play - progress:", this.animationEngine.getProgress());
      if (this.animationEngine.getProgress() >= 1) {
        console.log("\u{1F504} [UI Event] Progress at 100%, calling reset()");
        this.animationEngine.reset();
      }
      this.animationEngine.play();
    });
    this.eventBus.on("ui:animation:pause", () => this.animationEngine.pause());
    this.eventBus.on("ui:animation:skip-start", () => {
      console.log("\u23EA [UI Event] ui:animation:skip-start - calling reset()");
      this.animationEngine.reset();
    });
    this.eventBus.on("ui:animation:skip-end", () => this.animationEngine.seekToProgress(1));
    this.eventBus.on("ui:animation:seek", (progress) => this.animationEngine.seekToProgress(progress));
    this.eventBus.on("animation:speed-change", (speed) => {
      const timestamp = performance.now().toFixed(2);
      console.log("\u{1F3AF} [".concat(timestamp, "ms] [Event] animation:speed-change - new speed:"), speed, "px/s");
      console.trace("Speed change origin");
      this.animationEngine.setSpeed(speed);
      if (this.pathPoints && this.pathPoints.length > 0) {
        const totalLength = this.pathCalculator.calculatePathLength(this.pathPoints);
        const totalDuration = totalLength / speed * 1e3;
        console.log("\u{1F4CF} [Event] Recalculating duration - length:", totalLength.toFixed(1), "speed:", speed, "duration:", (totalDuration / 1e3).toFixed(1) + "s");
        this.animationEngine.setDuration(totalDuration);
        const durationSec = Math.round(totalDuration / 100) / 10;
        this.elements.animationSpeedValue.textContent = durationSec + "s";
      } else {
        const estimatedDuration = 1e4 / speed * this.animationEngine.state.speed;
        const durationSec = Math.round(estimatedDuration / 100) / 10;
        this.elements.animationSpeedValue.textContent = durationSec + "s";
      }
      this.updateTimeDisplay();
      this.autoSave();
    });
    this.eventBus.on("ui:animation:toggle", () => {
      if (this.animationEngine.state.isPlaying) {
        this.animationEngine.pause();
      } else {
        this.animationEngine.play();
      }
    });
    this.eventBus.on("animation:speed-decrease", () => {
      const current = this.animationEngine.state.playbackSpeed;
      this.animationEngine.setPlaybackSpeed(Math.max(0.1, current - 0.1));
    });
    this.eventBus.on("animation:speed-reset", () => {
      this.animationEngine.setPlaybackSpeed(1);
    });
    this.eventBus.on("animation:speed-increase", () => {
      const current = this.animationEngine.state.playbackSpeed;
      this.animationEngine.setPlaybackSpeed(Math.min(10, current + 0.1));
    });
    this.eventBus.on("waypoint:add", (data) => {
      const waypoint = data.isMajor ? Waypoint.createMajor(data.imgX, data.imgY) : Waypoint.createMinor(data.imgX, data.imgY);
      if (this.waypoints.length > 0) {
        const lastWaypoint = this.waypoints[this.waypoints.length - 1];
        waypoint.copyPropertiesFrom(lastWaypoint);
      }
      this.waypoints.push(waypoint);
      this._addWaypointToMap(waypoint);
      this.eventBus.emit("waypoint:added", waypoint);
    });
    this.eventBus.on("waypoint:position-changed", (data) => {
      const { waypoint, imgX, imgY, isDragging } = data;
      waypoint.imgX = imgX;
      waypoint.imgY = imgY;
      if (!isDragging) {
        this.autoSave();
      }
      this.eventBus.emit("waypoint:position-updated", waypoint);
    });
    this.eventBus.on("waypoint:selected", (waypoint) => {
      var _a, _b;
      this.selectedWaypoint = waypoint;
      (_a = this.interactionHandler) == null ? void 0 : _a.setSelectedWaypoint(waypoint);
      (_b = this.uiController) == null ? void 0 : _b.updateWaypointEditor(waypoint);
      this.updateWaypointList();
    });
    this.eventBus.on("waypoint:deleted", (waypoint) => {
      this.deleteWaypoint(waypoint);
    });
    this.eventBus.on("waypoint:delete-selected", () => {
      if (this.selectedWaypoint) {
        this.deleteWaypoint(this.selectedWaypoint);
        this.selectedWaypoint = null;
      }
    });
    this.eventBus.on("waypoints:clear-all", () => {
      this.clearAll();
    });
    this.eventBus.on("waypoints:reordered", (newOrder) => {
      const allWaypoints = [...this.waypoints];
      const minorWaypoints = allWaypoints.filter((wp) => !wp.isMajor);
      this.waypoints = [];
      let majorIndex = 0;
      allWaypoints.forEach((wp) => {
        if (wp.isMajor) {
          this.waypoints.push(newOrder[majorIndex]);
          majorIndex++;
        } else {
          this.waypoints.push(wp);
        }
      });
      if (this.waypoints.length >= 2) {
        this.calculatePath();
      }
      this.updateWaypointList();
      this.autoSave();
      this.render();
    });
    this.eventBus.on("coordinate:canvas-to-image", (data, callback) => {
      const result = this.canvasToImage(data.canvasX, data.canvasY);
      if (callback) callback(result);
    });
    this.eventBus.on("coordinate:image-to-canvas", (data, callback) => {
      const result = this.imageToCanvas(data.imgX, data.imgY);
      if (callback) callback(result);
    });
    this.eventBus.on("waypoint:check-at-position", (pos, callback) => {
      const waypoint = this.findWaypointAt(pos.x, pos.y);
      if (callback) callback(waypoint);
    });
    this.eventBus.on("help:toggle", () => {
      if (this.elements.splash.style.display === "none" || this.elements.splash.style.display === "") {
        this.showSplash();
      } else {
        this.hideSplash();
      }
    });
    this.eventBus.on("pathhead:style-changed", (style) => {
      this.styles.pathHead.style = style;
      this.render();
      this.autoSave();
    });
    this.eventBus.on("pathhead:color-changed", (color) => {
      this.styles.pathHead.color = color;
      this.render();
      this.autoSave();
    });
    this.eventBus.on("pathhead:size-changed", (size) => {
      this.styles.pathHead.size = size;
      this.render();
      this.autoSave();
    });
  }
  /* Mouse handlers now managed by InteractionHandler
  handleMouseDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on existing waypoint
    const clickedWaypoint = this.findWaypointAt(x, y);
    
    if (clickedWaypoint) {
      this.selectedWaypoint = clickedWaypoint;
      this.isDragging = true;
      this.hasDragged = false; // Reset drag flag
      // Store canvas offset for smooth dragging
      const wpCanvas = this.imageToCanvas(clickedWaypoint.imgX, clickedWaypoint.imgY);
      this.dragOffset.x = x - wpCanvas.x;
      this.dragOffset.y = y - wpCanvas.y;
      this.canvas.classList.add('dragging');
      
      // Emit selection event (updates editor UI)
      this.eventBus.emit('waypoint:selected', clickedWaypoint);
      this.updateWaypointList(); // Update list to show selection
      event.preventDefault();
    }
  }
  
  handleMouseMove(event) {
    if (this.isDragging && this.selectedWaypoint) {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Convert canvas position to image coordinates
      const canvasX = x - this.dragOffset.x;
      const canvasY = y - this.dragOffset.y;
      const imgPos = this.canvasToImage(canvasX, canvasY);
      this.selectedWaypoint.imgX = imgPos.x;
      this.selectedWaypoint.imgY = imgPos.y;
      this.hasDragged = true; // Mark that actual dragging occurred
      
      // Update path immediately for smooth visual feedback during drag
      this.calculatePath();
      // Batch render calls to prevent excessive rendering (60fps → ~2-3fps)
      this.queueRender();
    }
  }
  
  handleMouseUp(event) {
    if (this.isDragging) {
      this.isDragging = false;
      this.canvas.classList.remove('dragging');
      
      // Emit position changed event if waypoint was actually moved
      // This triggers single auto-save instead of 60+ during drag
      if (this.hasDragged && this.selectedWaypoint) {
        this.eventBus.emit('waypoint:position-changed', this.selectedWaypoint);
        this.hasDragged = false;
        this.announce('Waypoint moved');
      }
      
      this.updateWaypointList();
    }
  }
  
  handleCanvasClick(event) {
    // Don't add waypoint if we actually dragged
    if (this.hasDragged) {
      this.hasDragged = false; // Reset for next time
      return;
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if clicking on existing waypoint for selection
    const clickedWaypoint = this.findWaypointAt(x, y);
    if (clickedWaypoint) {
      this.selectedWaypoint = clickedWaypoint;
      this.updateWaypointList();
      this.updateWaypointEditor();
      return;
    }
    
    // Determine if major or minor waypoint (Shift+Click for minor)
    const isMajor = !event.shiftKey;
    
    // Convert canvas coordinates to normalized image coordinates
    const imgPos = this.canvasToImage(x, y);
    
    // Create waypoint using factory method
    // Waypoint model handles default properties and validation
    const waypoint = isMajor
      ? Waypoint.createMajor(imgPos.x, imgPos.y)
      : Waypoint.createMinor(imgPos.x, imgPos.y);
    
    // Set default label for major waypoints
    if (isMajor) {
      waypoint.label = `Waypoint ${this.waypoints.length + 1}`;
    }
    
    // Inherit properties from previous waypoint if exists
    // This ensures consistent styling across the route
    if (this.waypoints.length > 0) {
      const previousWaypoint = this.waypoints[this.waypoints.length - 1];
      waypoint.copyPropertiesFrom(previousWaypoint);
    }
    
    // Add waypoint to array
    this.waypoints.push(waypoint);
    
    // Emit waypoint added event (triggers path calculation, save, render)
    // Decoupled approach prevents tight coupling to specific update sequence
    this.eventBus.emit('waypoint:added', waypoint);
    
    this.announce(`${isMajor ? 'Major' : 'Minor'} waypoint added`);
    console.log(`Added ${isMajor ? 'major' : 'minor'} waypoint at (${x.toFixed(0)}, ${y.toFixed(0)})`);
  }
  */
  // End of mouse/keyboard handlers now managed by InteractionHandler
  findWaypointAt(x, y) {
    const threshold = INTERACTION.WAYPOINT_HIT_RADIUS;
    return this.waypoints.find((wp) => {
      const wpCanvas = this.imageToCanvas(wp.imgX, wp.imgY);
      const dist = Math.sqrt(Math.pow(wpCanvas.x - x, 2) + Math.pow(wpCanvas.y - y, 2));
      return dist <= threshold;
    });
  }
  updateWaypointList() {
    if (this.uiController) {
      this.uiController.updateWaypointList(this.waypoints);
      return;
    }
    this.elements.waypointList.innerHTML = "";
    const majorWaypoints = this.waypoints.filter((wp) => wp.isMajor);
    majorWaypoints.forEach((waypoint, index) => {
      const item = document.createElement("div");
      item.className = "waypoint-item";
      if (waypoint === this.selectedWaypoint) {
        item.classList.add("selected");
      }
      const handle = document.createElement("span");
      handle.className = "waypoint-item-handle";
      handle.textContent = "\u2630";
      const label = document.createElement("span");
      label.className = "waypoint-item-label";
      label.textContent = "Waypoint ".concat(index + 1);
      const delBtn = document.createElement("button");
      delBtn.className = "waypoint-item-delete";
      delBtn.textContent = "\xD7";
      item.appendChild(handle);
      item.appendChild(label);
      item.appendChild(delBtn);
      const selectWaypoint = (e) => {
        e.stopPropagation();
        this.selectedWaypoint = waypoint;
        this.updateWaypointList();
        this.updateWaypointEditor();
      };
      label.addEventListener("click", selectWaypoint);
      handle.addEventListener("click", selectWaypoint);
      item.addEventListener("click", selectWaypoint);
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteWaypoint(waypoint);
      });
      this.elements.waypointList.appendChild(item);
    });
  }
  updateWaypointEditor() {
    if (this.selectedWaypoint) {
      this.elements.waypointEditor.style.display = "block";
      this.elements.waypointEditorPlaceholder.style.display = "none";
      this.elements.segmentColor.value = this.selectedWaypoint.segmentColor;
      this.elements.segmentWidth.value = this.selectedWaypoint.segmentWidth;
      this.elements.segmentWidthValue.textContent = this.selectedWaypoint.segmentWidth;
      this.elements.segmentStyle.value = this.selectedWaypoint.segmentStyle || "solid";
      this.elements.pathShape.value = this.selectedWaypoint.pathShape || "line";
      this.elements.markerStyle.value = this.selectedWaypoint.markerStyle || "dot";
      this.elements.dotColor.value = this.selectedWaypoint.dotColor || this.selectedWaypoint.segmentColor || this.styles.dotColor;
      this.elements.dotSize.value = this.selectedWaypoint.dotSize || this.styles.dotSize;
      this.elements.dotSizeValue.textContent = this.elements.dotSize.value;
      this.elements.pathHeadStyle.value = this.selectedWaypoint.pathHeadStyle || this.styles.pathHead.style;
      this.elements.pathHeadColor.value = this.selectedWaypoint.pathHeadColor || this.styles.pathHead.color;
      this.elements.pathHeadSize.value = this.selectedWaypoint.pathHeadSize || this.styles.pathHead.size;
      this.elements.pathHeadSizeValue.textContent = this.elements.pathHeadSize.value;
      this.elements.customHeadControls.style.display = (this.selectedWaypoint.pathHeadStyle || this.styles.pathHead.style) === "custom" ? "block" : "none";
      if (this.selectedWaypoint.isMajor) {
        this.elements.dotColor.disabled = false;
        this.elements.dotSize.disabled = false;
        this.elements.editorBeaconStyle.disabled = false;
        this.elements.editorBeaconColor.disabled = false;
        this.elements.editorBeaconStyle.value = this.selectedWaypoint.beaconStyle || this.styles.beaconStyle;
        this.elements.editorBeaconColor.value = this.selectedWaypoint.beaconColor || this.styles.beaconColor;
        this.elements.waypointLabel.disabled = false;
        this.elements.labelMode.disabled = false;
        this.elements.labelPosition.disabled = false;
        this.elements.waypointLabel.value = this.selectedWaypoint.label || "";
        this.elements.labelMode.value = this.selectedWaypoint.labelMode || "none";
        this.elements.labelPosition.value = this.selectedWaypoint.labelPosition || "auto";
        this.elements.waypointPauseTime.disabled = false;
        const pauseTimeSec = (this.selectedWaypoint.pauseTime || 0) / 1e3;
        this.elements.waypointPauseTime.value = pauseTimeSec;
        this.elements.waypointPauseTimeValue.textContent = pauseTimeSec + "s";
        this.elements.pauseTimeControl.style.display = "flex";
      } else {
        this.elements.dotColor.disabled = true;
        this.elements.dotSize.disabled = true;
        this.elements.editorBeaconStyle.disabled = true;
        this.elements.editorBeaconColor.disabled = true;
        this.elements.editorBeaconStyle.value = "none";
        this.elements.editorBeaconColor.value = this.styles.beaconColor;
        this.elements.waypointLabel.disabled = true;
        this.elements.labelMode.disabled = true;
        this.elements.labelPosition.disabled = true;
        this.elements.waypointLabel.value = "";
        this.elements.labelMode.value = "none";
        this.elements.labelPosition.value = "auto";
        this.elements.waypointPauseTime.disabled = true;
        this.elements.waypointPauseTime.value = 0;
        this.elements.waypointPauseTimeValue.textContent = "0s";
        this.elements.pauseTimeControl.style.display = "none";
      }
    } else {
      this.elements.waypointEditor.style.display = "none";
      this.elements.waypointEditorPlaceholder.style.display = "flex";
    }
  }
  deleteWaypoint(waypoint) {
    const index = this.waypoints.indexOf(waypoint);
    if (index > -1) {
      this.waypoints.splice(index, 1);
      this._removeWaypointFromMap(waypoint);
      if (this.selectedWaypoint === waypoint) {
        this.selectedWaypoint = null;
      }
      this.eventBus.emit("waypoint:deleted", index);
      this.announce("Waypoint deleted");
    }
  }
  /**
   * Update coordinateTransform service when image changes
   * @param {HTMLImageElement} img - The loaded image
   */
  updateImageTransform(img) {
    if (!img) {
      return;
    }
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    this.coordinateTransform.setImageDimensions(width, height, this.background.fit);
  }
  /**
   * Convert canvas coordinates to normalized image coordinates (0-1)
   * Delegates to CoordinateTransform service
   */
  canvasToImage(canvasX, canvasY) {
    return this.coordinateTransform.canvasToImage(canvasX, canvasY);
  }
  /**
   * Convert normalized image coordinates (0-1) to canvas coordinates
   * Delegates to CoordinateTransform service
   */
  imageToCanvas(imageX, imageY) {
    return this.coordinateTransform.imageToCanvas(imageX, imageY);
  }
  async calculatePath() {
    this.pathPoints = [];
    if (this.waypoints.length < 2) {
      return;
    }
    const canvasWaypoints = this.waypoints.map((wp) => {
      const canvasPos = this.imageToCanvas(wp.imgX, wp.imgY);
      return __spreadProps(__spreadValues({}, wp), {
        x: canvasPos.x,
        y: canvasPos.y
      });
    });
    try {
      this.pathPoints = await this.pathCalculator.calculatePathAsync(canvasWaypoints);
    } catch (error) {
      console.warn("Async path calculation failed, falling back to sync:", error);
      this.pathPoints = this.pathCalculator.calculatePath(canvasWaypoints);
    }
    if (this._durationUpdateTimeout) {
      clearTimeout(this._durationUpdateTimeout);
    }
    this._durationUpdateTimeout = setTimeout(() => {
      if (this.animationEngine.state.mode === "constant-speed") {
        const totalLength = this.pathCalculator.calculatePathLength(this.pathPoints);
        const currentSpeed = this.animationEngine.state.speed;
        const totalDuration = totalLength / currentSpeed * 1e3;
        console.log("\u{1F6E4}\uFE0F  [calculatePath] Updating duration - speed:", currentSpeed, "px/s, length:", totalLength.toFixed(1), "px, duration:", (totalDuration / 1e3).toFixed(1) + "s");
        this.animationEngine.setDuration(totalDuration);
        const durationSec = Math.round(totalDuration / 100) / 10;
        this.elements.animationSpeedValue.textContent = durationSec + "s";
      }
      this.updateTimeDisplay();
    }, 50);
  }
  /**
   * Get positions of major waypoints as normalized progress values (0-1)
   * Performance optimization: Results are cached and only recalculated when waypoints change
   * Reduces ~99% of waypoint position calculations (was every frame → once per change)
   */
  getMajorWaypointPositions() {
    if (this.waypoints.length < 2) return [];
    if (this._majorWaypointsCache) {
      return this._majorWaypointsCache;
    }
    const majorWaypoints = [];
    let totalSegments = this.waypoints.length - 1;
    for (let i = 0; i < this.waypoints.length; i++) {
      if (this.waypoints[i].isMajor) {
        const progress = i / totalSegments;
        majorWaypoints.push({
          index: i,
          progress,
          waypoint: this.waypoints[i]
        });
      }
    }
    this._majorWaypointsCache = majorWaypoints;
    return majorWaypoints;
  }
  // Apply smooth easing to entire animation with EXACT waypoint positioning
  // Gives professional smooth start/stop while preserving waypoint pause precision
  applyEasing(rawProgress, majorWaypoints) {
    for (const wp of majorWaypoints) {
      if (wp.waypoint && wp.waypoint.pauseMode === "timed" && Math.abs(rawProgress - wp.progress) < 1e-3) {
        return wp.progress;
      }
    }
    return Easing.cubicInOut(rawProgress);
  }
  // Find which segment of the path we're currently in based on progress
  findSegmentIndexForProgress(progress) {
    if (this.waypoints.length < 2) return -1;
    const totalSegments = this.waypoints.length - 1;
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const segmentPosition = clampedProgress * totalSegments;
    const segmentIndex = Math.floor(segmentPosition);
    return Math.min(segmentIndex, totalSegments - 1);
  }
  /**
   * Check if we need to wait at any waypoint
   * Performance optimization: Only checks waypoints within proximity threshold (~80% reduction)
   */
  checkForWaypointWait(rawProgress, majorWaypoints) {
    if (this.animationEngine.state.isWaitingAtWaypoint || this.animationEngine.state.isPaused) return;
    const proximityThreshold = 0.01;
    const nearbyWaypoints = majorWaypoints.filter(
      (wp) => Math.abs(rawProgress - wp.progress) < proximityThreshold
    );
    if (nearbyWaypoints.length === 0) return;
    const segmentIndex = this.findSegmentIndexForProgress(rawProgress);
    if (segmentIndex < 0) return;
    if (rawProgress < 0.01) {
      console.log("All major waypoints:", majorWaypoints.map((wp) => ({
        index: wp.index,
        progress: wp.progress,
        pauseMode: wp.waypoint && wp.waypoint.pauseMode
      })));
    }
    let nextWaypoint = null;
    let minPositiveDistance = Infinity;
    for (const wp of nearbyWaypoints) {
      if (wp.index === this.animationEngine.state.pauseWaypointIndex) continue;
      const pauseMode = wp.waypoint && wp.waypoint.pauseMode;
      const pauseTime = wp.waypoint && wp.waypoint.pauseTime;
      if (!wp.waypoint || pauseMode !== "timed" || !pauseTime || pauseTime <= 0) {
        continue;
      }
      const exactWaypointProgress2 = wp.index / (this.waypoints.length - 1);
      const distanceToWaypoint = exactWaypointProgress2 - rawProgress;
      if (distanceToWaypoint > -5e-3 && distanceToWaypoint < minPositiveDistance) {
        minPositiveDistance = distanceToWaypoint;
        nextWaypoint = wp;
      }
    }
    if (!nextWaypoint) return;
    const exactWaypointProgress = nextWaypoint.index / (this.waypoints.length - 1);
    const atOrJustPassedWaypoint = Math.abs(rawProgress - exactWaypointProgress) < 5e-3 && rawProgress >= exactWaypointProgress - 5e-3;
    if (atOrJustPassedWaypoint) {
      console.log("WAITING at waypoint ".concat(nextWaypoint.index, " (progress ").concat(nextWaypoint.progress.toFixed(3), ")"), nextWaypoint.waypoint);
      this.animationEngine.startWaypointWait(
        nextWaypoint.index,
        nextWaypoint.waypoint.pauseTime
      );
      const waitDuration = nextWaypoint.waypoint.pauseTime / 1e3;
      this.announce("Waiting at waypoint ".concat(nextWaypoint.index + 1, " for ").concat(waitDuration, " seconds"));
    }
  }
  // Kept for potential future use
  continueAnimation() {
  }
  // Easing functions moved to utils/Easing.js for better modularity and performance
  // Corner slowing and curvature calculation moved to services/PathCalculator.js
  /**
   * Play the animation
   * Delegates to AnimationEngine for state management
   */
  play() {
    if (this.waypoints.length < 2) return;
    if (this.animationEngine.state.progress >= 1) {
      this.animationEngine.reset();
    }
    this.animationEngine.play();
  }
  /**
   * Pause the animation
   * Delegates to AnimationEngine for state management
   */
  pause() {
    this.animationEngine.pause();
  }
  /**
   * Skip to start of animation
   * Delegates to AnimationEngine for state management
   */
  skipToStart() {
    this.animationEngine.reset();
    this.announce("Skipped to start");
  }
  /**
   * Skip to end of animation
   * Delegates to AnimationEngine for state management
   */
  skipToEnd() {
    this.animationEngine.seekToProgress(1);
    this.announce("Skipped to end");
  }
  clearAll() {
    this.waypoints = [];
    this.waypointsById.clear();
    this.pathPoints = [];
    this.selectedWaypoint = null;
    this.animationEngine.reset();
    this.animationEngine.setDuration(0);
    this.pause();
    this.updateTimeDisplay();
    this.updateWaypointList();
    console.log("Cleared all waypoints and path");
  }
  showSplash() {
    console.log("\u{1F4D6} [Splash] Showing splash screen");
    this.elements.splash.style.display = "flex";
  }
  hideSplash() {
    console.log("\u{1F6AB} [Splash] Hiding splash screen");
    this.elements.splash.style.display = "none";
    if (this.elements.splashDontShow.checked) {
      console.log('\u2705 [Splash] Marking as "don\'t show again"');
      this.storageService.markSplashShown();
    }
  }
  // ----- Accessibility and persistence helpers -----
  announce(message, priority = "polite") {
    const el = document.getElementById("announcer");
    if (!el) return;
    el.setAttribute("aria-live", priority);
    el.textContent = message;
    setTimeout(() => {
      el.textContent = "";
    }, 2e3);
  }
  autoSave() {
    try {
      const stylesCopy = __spreadValues({}, this.styles);
      if (stylesCopy.pathHead && stylesCopy.pathHead.image) {
        stylesCopy.pathHead = __spreadProps(__spreadValues({}, stylesCopy.pathHead), { image: null });
      }
      const data = {
        coordVersion: 6,
        // Version tracking for coordinate system changes
        waypoints: this.waypoints.map((wp) => wp.toJSON()),
        // Serialize Waypoint instances
        styles: stylesCopy,
        animationState: {
          mode: this.animationEngine.state.mode,
          speed: this.animationEngine.state.speed,
          duration: this.animationEngine.state.duration,
          playbackSpeed: this.animationEngine.state.playbackSpeed
        },
        background: {
          overlay: this.background.overlay,
          fit: this.background.fit
        }
      };
      this.storageService.autoSave(data);
    } catch (e) {
      console.error("Error saving state:", e);
    }
  }
  loadAutosave() {
    var _a, _b;
    console.log("\u{1F4E5} [loadAutosave] Loading saved state...");
    try {
      const data = this.storageService.loadAutoSave();
      if (!data) return;
      const COORD_SYSTEM_VERSION = 6;
      if (!data.coordVersion || data.coordVersion < COORD_SYSTEM_VERSION) {
        console.log("Old data version detected (v" + (data.coordVersion || 1) + "), clearing saved data for v" + COORD_SYSTEM_VERSION);
        this.storageService.clearAutoSave();
        return;
      }
      if (data.waypoints && Array.isArray(data.waypoints)) {
        this.beginBatch();
        this.waypoints = data.waypoints.map((wpData) => {
          if (!Waypoint.validate(wpData)) {
            console.warn("Invalid waypoint data, skipping:", wpData);
            return null;
          }
          return Waypoint.fromJSON(wpData);
        }).filter((wp) => wp !== null);
        this.waypoints.forEach((wp) => this._addWaypointToMap(wp));
        this.endBatch();
        console.log("Loaded waypoints:", this.waypoints.length);
      }
      if (data.styles) {
        this.styles = __spreadValues(__spreadValues({}, this.styles), data.styles);
      }
      if (data.animationState) {
        const savedState = data.animationState;
        this.animationEngine.setMode(savedState.mode || "constant-speed");
        this.animationEngine.setSpeed(savedState.speed || ANIMATION.DEFAULT_SPEED);
        this.animationEngine.setPlaybackSpeed(savedState.playbackSpeed || 1);
        if (this.elements.animationSpeed) {
          const loadedSpeed = savedState.speed || ANIMATION.DEFAULT_SPEED;
          console.log("\u{1F3AF} [loadAutosave] Setting slider to:", loadedSpeed, "(from savedState.speed:", savedState.speed, ")");
          this.eventBus.emit("ui:slider:update-speed", loadedSpeed);
        }
        if (this.elements.speedControl) {
          this.elements.speedControl.style.display = "flex";
        }
      }
      if (data.background) {
        this.background.overlay = (_a = data.background.overlay) != null ? _a : this.background.overlay;
        this.background.fit = (_b = data.background.fit) != null ? _b : this.background.fit;
        if (this.elements.bgFitToggle) {
          this.elements.bgFitToggle.textContent = this.background.fit === "fit" ? "Fit" : "Fill";
          this.elements.bgFitToggle.dataset.mode = this.background.fit;
        }
        if (this.elements.bgOverlay) {
          this.elements.bgOverlay.value = String(this.background.overlay);
          this.elements.bgOverlayValue.textContent = String(this.background.overlay);
        }
      }
      this.calculatePath();
      this.updateWaypointList();
      this.animationEngine.seekToProgress(1);
      this.animationEngine.pause();
      this.announce("Previous session restored");
    } catch (e) {
      console.warn("No autosave found or failed to load");
    }
  }
  /**
   * Start the render loop using AnimationEngine
   * Performance optimizations:
   * - Conditional rendering: Only renders when state changes (~90% CPU reduction when paused)
   * - Throttled time display: Updates only when seconds change (~98% fewer DOM updates)
   * - Delegates animation logic to AnimationEngine service
   */
  startRenderLoop() {
    let lastProgress = -1;
    let lastWaitingState = false;
    this.animationEngine.start((state) => {
      const progressChanged = Math.abs(state.progress - lastProgress) > 1e-4;
      const waitingChanged = state.isWaitingAtWaypoint !== lastWaitingState;
      const shouldRender = state.isPlaying || progressChanged || waitingChanged;
      if (shouldRender) {
        this.syncUIWithAnimationState(state);
        this.render();
        lastProgress = state.progress;
        lastWaitingState = state.isWaitingAtWaypoint;
      }
    });
  }
  /**
   * Synchronize UI elements with AnimationEngine state
   * Performance optimization: Throttles time display updates to once per second
   */
  syncUIWithAnimationState(state) {
    const timelineProgress = state.currentTime / state.duration;
    this.elements.timelineSlider.value = timelineProgress * ANIMATION.TIMELINE_RESOLUTION;
    const currentSeconds = Math.floor(state.currentTime / 1e3);
    if (currentSeconds !== this._lastDisplayedSecond) {
      this.updateTimeDisplay(state.currentTime, state.duration);
      this._lastDisplayedSecond = currentSeconds;
    }
  }
  /**
   * Update time display with current and total time
   * @param {number} currentTime - Current time in milliseconds (optional, uses engine state if not provided)
   * @param {number} duration - Total duration in milliseconds (optional, uses engine state if not provided)
   */
  updateTimeDisplay(currentTime = null, duration = null) {
    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1e3);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return "".concat(minutes, ":").concat(secs.toString().padStart(2, "0"));
    };
    const current = currentTime !== null ? currentTime : this.animationEngine.state.currentTime;
    const total = duration !== null ? duration : this.animationEngine.state.duration;
    this.elements.currentTime.textContent = formatTime(current);
    this.elements.totalTime.textContent = formatTime(total);
  }
  render() {
    const { ctx } = this;
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    if (cw <= 0 || ch <= 0) {
      console.warn("Cannot render to canvas with invalid dimensions:", { width: cw, height: ch });
      return;
    }
    ctx.clearRect(0, 0, cw, ch);
    this.renderBackground(ctx);
    this.renderOverlay(ctx);
    const vCanvas = this.getVectorCanvas();
    if (vCanvas.width <= 0 || vCanvas.height <= 0) {
      console.warn("Vector canvas has invalid dimensions:", { width: vCanvas.width, height: vCanvas.height });
      return;
    }
    const vctx = vCanvas.getContext("2d");
    vctx.clearRect(0, 0, vCanvas.width, vCanvas.height);
    this.renderVectorLayerTo(vctx);
    if (vCanvas.width > 0 && vCanvas.height > 0) {
      ctx.drawImage(vCanvas, 0, 0);
    }
  }
  // ----- Layer helpers -----
  getVectorCanvas() {
    if (!this.vectorCanvas) {
      this.vectorCanvas = document.createElement("canvas");
    }
    const cw = this.displayWidth || this.canvas.width || 100;
    const ch = this.displayHeight || this.canvas.height || 100;
    const safeWidth = Math.max(1, cw);
    const safeHeight = Math.max(1, ch);
    if (this.vectorCanvas.width !== safeWidth || this.vectorCanvas.height !== safeHeight) {
      console.log("Resizing vector canvas to:", safeWidth, "x", safeHeight);
      this.vectorCanvas.width = safeWidth;
      this.vectorCanvas.height = safeHeight;
      const vctx = this.vectorCanvas.getContext("2d");
      if (vctx) {
        vctx.imageSmoothingEnabled = false;
      }
    }
    return this.vectorCanvas;
  }
  renderBackground(ctx) {
    if (!this.background.image) return;
    const img = this.background.image;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    if (this.background.fit === "fit") {
      const scale = Math.min(cw / iw, ch / ih);
      const dw = Math.round(iw * scale);
      const dh = Math.round(ih * scale);
      const dx = Math.floor((cw - dw) / 2);
      const dy = Math.floor((ch - dh) / 2);
      ctx.drawImage(img, 0, 0, iw, ih, dx, dy, dw, dh);
    } else {
      const scale = Math.max(cw / iw, ch / ih);
      const sw = cw / scale;
      const sh = ch / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    }
  }
  renderOverlay(ctx) {
    const v = this.background.overlay;
    if (v === 0) return;
    const cw = this.displayWidth || this.canvas.width;
    const ch = this.displayHeight || this.canvas.height;
    ctx.save();
    ctx.globalAlpha = Math.min(Math.abs(v) / 100, 0.6);
    ctx.fillStyle = v < 0 ? "#000" : "#fff";
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }
  renderVectorLayerTo(targetCtx) {
    const orig = this.ctx;
    this.ctx = targetCtx;
    if (this.pathPoints.length > 0 && this.waypoints.length > 1) {
      const totalPoints = this.pathPoints.length;
      const progress = this.animationEngine.getProgress();
      const pointsToRender = Math.floor(totalPoints * progress);
      const segments = this.waypoints.length - 1;
      const pointsPerSegment = Math.floor(totalPoints / segments);
      const controllerForSegment = new Array(segments);
      this.waypointPositions = [];
      this.waypoints.forEach((wp, index) => {
        if (index < this.waypoints.length - 1) {
          const exactPointIndex = index / segments * totalPoints;
          this.waypointPositions.push({
            waypointIndex: index,
            pointIndex: exactPointIndex
          });
        }
      });
      let lastMajorIdx = -1;
      for (let s = 0; s < segments; s++) {
        if (this.waypoints[s].isMajor) lastMajorIdx = s;
        controllerForSegment[s] = lastMajorIdx;
      }
      for (let i = 1; i < pointsToRender; i++) {
        const segmentIndex = Math.min(Math.floor(i / pointsPerSegment), segments - 1);
        const controllerIdx = controllerForSegment[segmentIndex];
        const controller = controllerIdx >= 0 ? this.waypoints[controllerIdx] : {
          segmentColor: this.styles.pathColor,
          segmentWidth: this.styles.pathThickness,
          segmentStyle: "solid",
          pathShape: "line"
        };
        this.ctx.strokeStyle = controller.segmentColor;
        this.ctx.lineWidth = controller.segmentWidth;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.applyLineStyle(controller.segmentStyle);
        this.ctx.beginPath();
        const pathShape = controller.pathShape || "line";
        const p1 = this.pathPoints[i - 1];
        const p2 = this.pathPoints[i];
        if (pathShape === "squiggle") {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const perpX = -(p2.y - p1.y) * 0.15;
          const perpY = (p2.x - p1.x) * 0.15;
          this.ctx.moveTo(p1.x, p1.y);
          const wave = Math.sin(i * 0.5) * 0.5;
          this.ctx.quadraticCurveTo(
            midX + perpX * wave,
            midY + perpY * wave,
            p2.x,
            p2.y
          );
        } else if (pathShape === "randomised") {
          const jitterAmount = 3;
          const jitteredP1 = {
            x: p1.x + (Math.random() - 0.5) * jitterAmount,
            y: p1.y + (Math.random() - 0.5) * jitterAmount
          };
          const jitteredP2 = {
            x: p2.x + (Math.random() - 0.5) * jitterAmount,
            y: p2.y + (Math.random() - 0.5) * jitterAmount
          };
          this.ctx.moveTo(jitteredP1.x, jitteredP1.y);
          this.ctx.lineTo(jitteredP2.x, jitteredP2.y);
        } else {
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
        }
        this.ctx.stroke();
      }
      this.ctx.setLineDash([]);
      if (pointsToRender > 1) {
        const headIndex = Math.min(pointsToRender - 1, this.pathPoints.length - 1);
        const head = this.pathPoints[headIndex];
        let rotation = 0;
        if (headIndex > 0) {
          const prevPoint = this.pathPoints[headIndex - 1];
          rotation = Math.atan2(head.y - prevPoint.y, head.x - prevPoint.x);
        }
        this.styles.pathHead.rotation = rotation;
        this.drawPathHead(head.x, head.y, rotation);
      }
    }
    if (this.pathPoints.length > 0) {
      const currentProgress = this.animationEngine.getProgress();
      const totalPoints = this.pathPoints.length;
      this.waypoints.forEach((waypoint, wpIndex) => {
        if (waypoint.isMajor) {
          const exactWaypointProgress = wpIndex / (this.waypoints.length - 1);
          const atWaypoint = Math.abs(currentProgress - exactWaypointProgress) < 1e-3;
          const isPausedHere = this.animationEngine.state.isPaused && this.animationEngine.state.pauseWaypointIndex === wpIndex;
          if (atWaypoint || isPausedHere) {
            const wpCanvas = this.imageToCanvas(waypoint.imgX, waypoint.imgY);
            this.drawBeacon(__spreadProps(__spreadValues({}, waypoint), { x: wpCanvas.x, y: wpCanvas.y }));
          }
        }
      });
    }
    this.waypoints.forEach((waypoint) => {
      if (waypoint.isMajor) {
        const wpCanvas = this.imageToCanvas(waypoint.imgX, waypoint.imgY);
        const isSelected = waypoint === this.selectedWaypoint;
        const markerSize = waypoint.dotSize || this.styles.dotSize;
        const size = isSelected ? markerSize * 1.3 : markerSize;
        const markerStyle = waypoint.markerStyle || this.styles.markerStyle;
        if (markerStyle === "none") {
          this.renderLabel(waypoint, wpCanvas.x, wpCanvas.y, 0);
          return;
        }
        this.ctx.fillStyle = waypoint.dotColor || waypoint.segmentColor || this.styles.dotColor;
        this.ctx.strokeStyle = isSelected ? "#4a90e2" : "white";
        this.ctx.lineWidth = isSelected ? 3 : 2;
        if (markerStyle === "square") {
          this.ctx.beginPath();
          this.ctx.rect(wpCanvas.x - size, wpCanvas.y - size, size * 2, size * 2);
          this.ctx.fill();
          this.ctx.stroke();
        } else if (markerStyle === "flag") {
          this.ctx.beginPath();
          this.ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          this.ctx.lineTo(wpCanvas.x, wpCanvas.y + size);
          this.ctx.moveTo(wpCanvas.x, wpCanvas.y - size * 2);
          this.ctx.lineTo(wpCanvas.x + size * 1.5, wpCanvas.y - size * 1.3);
          this.ctx.lineTo(wpCanvas.x + size * 1.2, wpCanvas.y - size);
          this.ctx.lineTo(wpCanvas.x, wpCanvas.y - size * 0.7);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
        } else {
          this.ctx.beginPath();
          this.ctx.arc(wpCanvas.x, wpCanvas.y, size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
        }
        this.renderLabel(waypoint, wpCanvas.x, wpCanvas.y, size);
      }
    });
    this.ctx = orig;
  }
  // Label rendering with positioning and show/hide behavior
  renderLabel(waypoint, x, y, dotSize) {
    if (!waypoint.label || waypoint.labelMode === "none") return;
    const wpIndex = this.waypoints.indexOf(waypoint);
    const totalPoints = this.pathPoints.length;
    let waypointPointIndex = 0;
    if (wpIndex < this.waypoints.length - 1) {
      waypointPointIndex = wpIndex / (this.waypoints.length - 1) * totalPoints;
    } else {
      waypointPointIndex = totalPoints;
    }
    const exactCurrentPoint = totalPoints * this.animationEngine.getProgress();
    const fadeTimeInPoints = totalPoints * 0.02;
    let opacity = 0;
    switch (waypoint.labelMode) {
      case "on":
        opacity = 1;
        break;
      case "fade":
        if (exactCurrentPoint < waypointPointIndex) return;
        const elapsed = exactCurrentPoint - waypointPointIndex;
        if (elapsed <= fadeTimeInPoints / 2) {
          opacity = Math.min(1, elapsed / (fadeTimeInPoints / 2));
          opacity = Math.pow(opacity, 0.5);
        } else if (elapsed <= fadeTimeInPoints * 3) {
          opacity = 1;
        } else if (elapsed <= fadeTimeInPoints * 4) {
          opacity = 1 - Math.min(1, (elapsed - fadeTimeInPoints * 3) / fadeTimeInPoints);
        } else {
          return;
        }
        break;
      case "persist":
        const timeBeforeWaypoint = waypointPointIndex - exactCurrentPoint;
        if (timeBeforeWaypoint > fadeTimeInPoints) return;
        if (timeBeforeWaypoint > 0) {
          const fadeProgress = 1 - timeBeforeWaypoint / fadeTimeInPoints;
          opacity = Math.pow(fadeProgress, 0.5);
        } else {
          opacity = 1;
        }
        break;
      default:
        return;
    }
    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0.15, opacity);
    this.ctx.font = "bold 16px Arial";
    const blueAmount = opacity < 1 ? Math.max(0, 1 - opacity) * 60 : 0;
    this.ctx.fillStyle = "rgb(".concat(255 - blueAmount, ", ").concat(255 - blueAmount, ", 255)");
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 3;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    this.ctx.shadowBlur = 5;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    const padding = RENDERING.LABEL_OFFSET_X;
    const position = waypoint.labelPosition || "auto";
    let labelX = x;
    let labelY = y;
    switch (position) {
      case "top":
        labelY = y - dotSize - padding;
        break;
      case "right":
        labelX = x + dotSize + padding;
        this.ctx.textAlign = "left";
        break;
      case "bottom":
        labelY = y + dotSize + padding;
        break;
      case "left":
        labelX = x - dotSize - padding;
        this.ctx.textAlign = "right";
        break;
      case "auto":
      default:
        const cw = this.displayWidth || this.canvas.width;
        const ch = this.displayHeight || this.canvas.height;
        labelY = y - dotSize - padding;
        if (labelY < 30) {
          labelY = y + dotSize + padding;
        }
        if (x < 100) {
          labelX = x + dotSize + padding;
          this.ctx.textAlign = "left";
        } else if (x > cw - 100) {
          labelX = x - dotSize - padding;
          this.ctx.textAlign = "right";
        }
        break;
    }
    this.ctx.strokeText(waypoint.label, labelX, labelY);
    this.ctx.fillText(waypoint.label, labelX, labelY);
    this.ctx.restore();
  }
  // ----- Assets -----
  loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  loadDefaultImage() {
    const img = new Image();
    img.onload = () => {
      this.background.image = img;
      this.updateImageTransform(img);
      if (this.waypoints.length >= 2) {
        this.calculatePath();
      }
      this.render();
      console.log("Default image (UoN_map.png) loaded for dev testing");
    };
    img.onerror = (err) => {
      console.warn("Could not load default image:", err);
      this.render();
    };
    img.src = "./UoN_map.png";
  }
  applyLineStyle(style) {
    switch (style) {
      case "dotted":
        this.ctx.setLineDash([2, 6]);
        break;
      case "dashed":
        this.ctx.setLineDash([10, 5]);
        break;
      case "squiggle":
        this.ctx.setLineDash([5, 3, 2, 3]);
        break;
      case "solid":
      default:
        this.ctx.setLineDash([]);
        break;
    }
  }
  // Draw the path head based on current style settings
  drawPathHead(x, y, rotation) {
    if (!isFinite(x) || !isFinite(y)) {
      console.warn("Invalid path head coordinates:", { x, y });
      return;
    }
    const pathHead = this.styles.pathHead;
    const size = pathHead.size;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    switch (pathHead.style) {
      case "dot":
        this.ctx.beginPath();
        this.ctx.fillStyle = pathHead.color;
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;
      case "arrow":
        this.ctx.beginPath();
        this.ctx.fillStyle = pathHead.color;
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size / 2, size / 2);
        this.ctx.lineTo(-size / 4, 0);
        this.ctx.lineTo(-size / 2, -size / 2);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      case "custom":
        if (pathHead.image) {
          const imgSize = size * 2;
          this.ctx.drawImage(
            pathHead.image,
            -imgSize / 2,
            -imgSize / 2,
            imgSize,
            imgSize
          );
        } else {
          this.ctx.beginPath();
          this.ctx.fillStyle = pathHead.color;
          this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;
      default:
        this.ctx.beginPath();
        this.ctx.fillStyle = pathHead.color;
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    this.ctx.restore();
  }
  drawBeacon(point) {
    const bStyle = point.beaconStyle || "none";
    const bColor = point.beaconColor || this.styles.beaconColor;
    if (bStyle === "none") return;
    if (!isFinite(point.x) || !isFinite(point.y)) {
      console.warn("Invalid beacon coordinates:", point);
      return;
    }
    if (bStyle === "pulse") {
      this.beaconAnimation.pulsePhase = performance.now() * 3e-3;
      const pulse = 1 + Math.sin(this.beaconAnimation.pulsePhase) * 0.3;
      const pulseSize = RENDERING.BEACON_PULSE_SIZE * pulse;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, pulseSize, 0, Math.PI * 2);
      this.ctx.fillStyle = bColor;
      this.ctx.globalAlpha = RENDERING.BEACON_PULSE_OPACITY;
      this.ctx.fill();
      this.beaconAnimation.pulsePhase = (this.beaconAnimation.pulsePhase + 0.1) % (Math.PI * 2);
    } else if (bStyle === "ripple") {
      const now = Date.now();
      if (!point.lastRipple || now - point.lastRipple > RENDERING.BEACON_RIPPLE_INTERVAL) {
        this.beaconAnimation.ripples.push({
          x: point.x,
          y: point.y,
          radius: 0,
          opacity: 0.5,
          startTime: now,
          color: bColor
        });
        point.lastRipple = now;
      }
      this.beaconAnimation.ripples = this.beaconAnimation.ripples.filter((ripple) => {
        const age = now - ripple.startTime;
        if (age > RENDERING.BEACON_RIPPLE_DURATION) return false;
        const radius = age / RENDERING.BEACON_RIPPLE_SPEED;
        const fadeProgress = age / RENDERING.BEACON_RIPPLE_DURATION;
        const opacity = 0.5 * (1 - Easing.cubicOut(fadeProgress));
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = ripple.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = opacity;
        this.ctx.stroke();
        return true;
      });
      this.ctx.beginPath();
      this.ctx.fillStyle = bColor;
      this.ctx.globalAlpha = 0.8;
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }
  /**
   * Clean up resources and event listeners
   */
  destroy() {
    var _a, _b, _c, _d, _e;
    (_a = this.animationEngine) == null ? void 0 : _a.stop();
    (_b = this.interactionHandler) == null ? void 0 : _b.destroy();
    (_c = this.pathCalculator) == null ? void 0 : _c.destroy();
    (_d = this.eventBus) == null ? void 0 : _d.removeAll();
    if (this.renderQueued) {
      cancelAnimationFrame(this.renderQueued);
      this.renderQueued = false;
    }
    if (this._durationUpdateTimeout) {
      clearTimeout(this._durationUpdateTimeout);
    }
    (_e = this.ctx) == null ? void 0 : _e.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.vectorCanvas) {
      const vctx = this.vectorCanvas.getContext("2d");
      vctx == null ? void 0 : vctx.clearRect(0, 0, this.vectorCanvas.width, this.vectorCanvas.height);
    }
    this.waypoints = null;
    this.pathPoints = null;
    this.selectedWaypoint = null;
    this.waypointsById = null;
    this.background = null;
    this.elements = null;
    console.log("Route Plotter destroyed");
  }
};
document.addEventListener("DOMContentLoaded", () => {
  window.app = new RoutePlotter();
});
//# sourceMappingURL=app.js.map
