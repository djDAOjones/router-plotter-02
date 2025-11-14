/**
 * Application-wide constants for Route Plotter v3
 */

// Animation timing and performance
export const ANIMATION = {
  DEFAULT_DURATION: 10000,       // 10 seconds (default duration)
  DEFAULT_SPEED: 400,            // pixels per second (default animation speed - reasonable starting speed)
  TARGET_FPS: 60,
  FRAME_INTERVAL: 1000 / 60,     // ~16.67ms per frame
  MAX_DELTA_TIME: 100,           // Maximum time jump to prevent huge leaps
  DEFAULT_PLAYBACK_SPEED: 1,
  DEFAULT_WAIT_TIME: 0,          // Default waypoint pause time
  TIMELINE_RESOLUTION: 1000      // Slider steps (0-1000)
};

// Rendering and visual styles
export const RENDERING = {
  DEFAULT_PATH_COLOR: '#FF6B6B',
  DEFAULT_PATH_THICKNESS: 3,
  DEFAULT_DOT_SIZE: 8,
  MINOR_DOT_SIZE: 4,
  PATH_HEAD_SIZE: 8,
  BEACON_PULSE_DURATION: 2000,   // Beacon animation cycle
  BEACON_MAX_RADIUS: 30,
  BEACON_PULSE_SIZE: 10,         // Base size for pulse effect
  BEACON_PULSE_OPACITY: 0.4,     // Opacity for pulse glow
  BEACON_RIPPLE_DURATION: 1500,  // Ripple lifetime in ms
  BEACON_RIPPLE_INTERVAL: 500,   // Time between ripples in ms
  BEACON_RIPPLE_SPEED: 30,       // Ripple expansion speed (pixels per ms)
  LABEL_OFFSET_X: 10,
  LABEL_OFFSET_Y: 5,
  LABEL_FONT_SIZE: 14,
  LABEL_FADE_TIME: 2000,         // Label fade duration in ms
  SQUIGGLE_AMPLITUDE: 0.15,      // Wave amplitude for squiggle paths
  RANDOMISED_JITTER: 3,          // Jitter amount for randomised paths
  CONTROLS_HEIGHT: 80            // Height of bottom controls panel in pixels
};

// Path calculation parameters
export const PATH = {
  POINTS_PER_SEGMENT: 100,        // Catmull-Rom interpolation density
  DEFAULT_TENSION: 0.1,           // Catmull-Rom tension - lower = tighter curves; higher = looser curves
  TARGET_SPACING: 2,              // Pixels between points after reparameterization
  MAX_CURVATURE: 0.1,             // Threshold for maximum corner slowing
  MIN_CORNER_SPEED: 0.2,          // Minimum 20% speed at tight corners (was 40% - now slows more)
  CORNER_THRESHOLD: 30,           // Degrees for corner detection
  CORNER_SLOW_RADIUS: 15,
  CORNER_SLOW_FACTOR: 0.7
};

// UI interaction thresholds
export const INTERACTION = {
  WAYPOINT_HIT_RADIUS: 15,        // Click detection radius for waypoints (pixels)
  DRAG_THRESHOLD: 3,              // Minimum pixels to consider a drag
  DOUBLE_CLICK_TIME: 300,         // Maximum ms between clicks for double-click
  LONG_PRESS_TIME: 500,           // Time for long press detection
  ZOOM_SENSITIVITY: 0.001,
  PAN_SENSITIVITY: 1
};

// Storage keys for persistence
export const STORAGE = {
  AUTOSAVE_KEY: 'routePlotter_autosave',
  PREFERENCES_KEY: 'routePlotter_preferences',
  SPLASH_SHOWN_KEY: 'routePlotter_splashShown',
  AUTOSAVE_INTERVAL: 1000         // Debounce time for autosave
};

// Accessibility
export const A11Y = {
  ANNOUNCEMENT_DELAY: 100,        // Delay for screen reader announcements
  FOCUS_VISIBLE_OUTLINE: '2px solid #0066CC',
  HIGH_CONTRAST_RATIO: 4.5        // WCAG AA standard
};

// Z-index layers for rendering order
export const LAYERS = {
  BACKGROUND: 0,
  OVERLAY: 1,
  PATH: 2,
  WAYPOINTS: 3,
  LABELS: 4,
  UI_HANDLES: 5,
  PATH_HEAD: 6,
  BEACONS: 7
};
