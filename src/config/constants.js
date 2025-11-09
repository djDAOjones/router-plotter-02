/**
 * Application-wide constants for Route Plotter v3
 */

// Animation timing and performance
export const ANIMATION = {
  DEFAULT_DURATION: 5000,        // 5 seconds
  DEFAULT_SPEED: 200,            // pixels per second
  TARGET_FPS: 60,
  FRAME_INTERVAL: 1000 / 60,     // ~16.67ms per frame
  MAX_DELTA_TIME: 100,           // Maximum time jump to prevent huge leaps
  DEFAULT_PLAYBACK_SPEED: 1,
  DEFAULT_WAIT_TIME: 0            // Default waypoint pause time
};

// Rendering and visual styles
export const RENDERING = {
  DEFAULT_PATH_COLOR: '#FF6B6B',
  DEFAULT_PATH_THICKNESS: 3,
  DEFAULT_DOT_SIZE: 8,
  MINOR_DOT_SIZE: 4,
  WAYPOINT_HIT_RADIUS: 15,       // Click detection radius
  PATH_HEAD_SIZE: 8,
  BEACON_PULSE_DURATION: 2000,   // Beacon animation cycle
  BEACON_MAX_RADIUS: 30,
  LABEL_OFFSET_X: 10,
  LABEL_OFFSET_Y: 5,
  LABEL_FONT_SIZE: 14,
  SQUIGGLE_AMPLITUDE: 0.15,      // Wave amplitude for squiggle paths
  RANDOMISED_JITTER: 3            // Jitter amount for randomised paths
};

// Path calculation parameters
export const PATH = {
  POINTS_PER_SEGMENT: 30,
  DEFAULT_TENSION: 0.5,
  TARGET_SPACING: 2,              // For path reparameterization
  CORNER_THRESHOLD: 30,           // Degrees for corner detection
  CORNER_SLOW_RADIUS: 15,
  CORNER_SLOW_FACTOR: 0.7
};

// UI interaction thresholds
export const INTERACTION = {
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
