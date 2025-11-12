# Route Plotter v3 - Technical Glossary

**Purpose:** This glossary defines precise terminology for the Route Plotter application to facilitate clear communication about features, bugs, and enhancements.

**Last Updated:** November 12, 2025

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Waypoints & Markers](#waypoints--markers)
3. [Path & Curves](#path--curves)
4. [Animation & Timing](#animation--timing)
5. [UI Elements](#ui-elements)
6. [Visual Effects](#visual-effects)
7. [Coordinate Systems](#coordinate-systems)
8. [Data & State](#data--state)
9. [Services & Architecture](#services--architecture)
10. [Common Phrases](#common-phrases)

---

## Core Concepts

### **Route**
The complete journey from the first waypoint to the last, including all paths and waypoints in between.

### **Path**
The interpolated curve connecting waypoints. Generated using Catmull-Rom spline interpolation.

### **Path Points**
The array of calculated coordinate points that define the path. Typically hundreds of points for smooth curves.

### **Canvas**
The HTML5 canvas element where all rendering occurs. Has two coordinate systems: canvas coordinates and image coordinates.

### **Background Image**
The map or terrain image displayed behind the route. Can be in "fit" or "fill" mode.

---

## Waypoints & Markers

### **Waypoint**
A user-defined point along the route. Comes in two types: major and minor.

#### **Major Waypoint**
- Larger visual marker (8px radius)
- Can have pause time (timed pause)
- Can be labeled
- Red circle with white outline by default

#### **Minor Waypoint**
- Smaller visual marker (4px radius)
- No pause functionality
- Used for path control points
- Red circle with white outline by default

### **Marker**
Visual representation of a waypoint on the canvas. Synonymous with waypoint in visual context.

### **Marker Style**
Visual appearance of waypoints:
- **Dots** (default): Solid circles
- **Rings**: Hollow circles
- **Crosses**: X-shaped markers
- **Plus**: +-shaped markers

### **Selected Waypoint**
The waypoint currently selected for editing. Highlighted with yellow glow.

### **Waypoint Properties**
- `imgX`, `imgY`: Position in image coordinate space
- `isMajor`: Boolean, major vs minor waypoint
- `label`: Text label for major waypoints
- `pauseTime`: Duration in milliseconds
- `pauseMode`: 'none', 'timed', or 'manual'
- `color`, `size`: Visual style properties

---

## Path & Curves

### **Catmull-Rom Spline**
The interpolation algorithm used to create smooth curves between waypoints. Creates curves that pass through all control points.

### **Tension**
Parameter controlling curve tightness (0.0 - 1.0):
- **0.0**: Straight lines (no curves)
- **0.2**: Very tight curves (current default)
- **0.5**: Moderate curves
- **1.0**: Maximum smoothness

**Code constant:** `PATH.DEFAULT_TENSION`

### **Path Shape**
Different path rendering styles:
- **Straight**: Direct Catmull-Rom interpolation
- **Squiggle**: Sine wave modulation for decorative effect
- **Randomised**: Jittered path for hand-drawn appearance

### **Curvature**
The mathematical measure of how sharply the path bends at any point. Used for corner slowing.

### **Corner Slowing**
Animation feature that reduces speed at sharp turns for more natural motion.
- **MIN_CORNER_SPEED**: Minimum speed percentage at tightest corners (currently 0.2 = 20%)

### **Path Length**
Total distance along the path in pixels. Used to calculate animation duration.

### **Reparameterization**
Process of redistributing path points for even spacing. Ensures consistent animation speed.

---

## Animation & Timing

### **Animation State**
The complete state of the animation system. Managed by `AnimationEngine`.

### **Progress**
How far through the animation (0.0 to 1.0):
- `0.0` = Start (0%)
- `0.5` = Halfway (50%)
- `1.0` = End (100%)

**Code:** `animationEngine.state.progress`

### **Current Time**
Elapsed time in the animation in milliseconds.

**Code:** `animationEngine.state.currentTime`

### **Duration**
Total animation length in milliseconds. Calculated from path length and speed.

**Code:** `animationEngine.state.duration`

### **Speed**
Animation velocity in pixels per second (px/s).
- **Default:** 50 px/s
- **Range:** 25 - 1000 px/s

**Code:** `animationEngine.state.speed`

### **Playback Speed**
Multiplier for animation speed (0.1 - 10.0):
- `0.5` = Half speed
- `1.0` = Normal speed (default)
- `2.0` = Double speed

**Code:** `animationEngine.state.playbackSpeed`
**UI:** Controlled by J/K/L keys

### **Animation Mode**
Method for calculating animation duration:
- **constant-speed**: Duration based on path length ÷ speed (current default)
- **constant-time**: Fixed duration regardless of path length

### **Playback Position**
Where the animation currently is (synonym for "current time" in UI context).

### **Timeline**
The scrubber/slider showing animation progress. Ranges from 0 to 1000 (TIMELINE_RESOLUTION).

### **Playhead**
The moving indicator showing current position on the path. Also called "path head" or "animation marker".

### **Waypoint Pause/Wait**
Feature where animation pauses at major waypoints:
- **Timed Pause**: Pauses for specified duration
- **Manual Pause**: Waits for user to resume
- **None**: No pause (default)

---

## UI Elements

### **Main Canvas**
Primary rendering surface for the entire application.

### **Vector Canvas**
Off-screen canvas for rendering paths and waypoints before compositing to main canvas. Performance optimization.

### **Sidebar**
Left panel containing waypoint list and controls.

### **Tabs**
Navigation within sidebar:
- **Waypoints Tab**: List of waypoints with edit controls
- **Settings Tab**: Animation speed, background controls, marker styles

### **Waypoint Editor**
Panel showing properties of selected waypoint:
- Label input
- Pause time slider
- Delete button
- Color picker

### **Timeline Slider**
Horizontal scrubber at bottom for seeking through animation.

### **Transport Controls**
Animation playback buttons:
- **Skip to Start** (⏮): Jump to beginning
- **Play** (▶): Start animation
- **Pause** (⏸): Stop animation
- **Skip to End** (⏭): Jump to end

### **Speed Slider**
Control for adjusting animation speed (25-1000 px/s). Labeled "Animation Time" in UI.

### **Playback Keys**
Keyboard shortcuts for speed control:
- **J**: Decrease playback speed
- **K**: Reset to normal (1x)
- **L**: Increase playback speed

---

## Visual Effects

### **Beacon**
Animated effect at major waypoints during playback:
- **Pulse**: Rhythmic growing/shrinking
- **Ripple**: Expanding ring effect

### **Path Head**
Moving indicator showing current animation position:
- **Circle**: Solid circle (default)
- **Arrow**: Directional arrow
- **Custom**: User-uploaded image

### **Label**
Text display above major waypoints. Fades in during animation.

### **Glow**
Highlight effect around selected waypoint. Yellow by default.

### **Tint/Overlay**
Semi-transparent color layer over background image. Controlled by overlay slider (0-1).

---

## Coordinate Systems

### **Image Coordinates**
Position within the original background image:
- `imgX`, `imgY`: Coordinates in image pixel space
- Origin: Top-left of image
- Used for waypoint storage

### **Canvas Coordinates**
Position on the display canvas:
- `x`, `y`: Screen coordinates
- Origin: Top-left of canvas
- Used for rendering and user interaction

### **Coordinate Transform**
Conversion between image and canvas coordinate systems. Handles:
- Scaling (zoom)
- Offset (pan)
- Fit/fill modes

**Methods:**
- `imageToCanvas(imgX, imgY)`: Convert image → canvas
- `canvasToImage(x, y)`: Convert canvas → image

### **Scale**
Zoom level of the image. Calculated based on fit/fill mode.

### **Offset**
Pan position of the image on canvas (offsetX, offsetY).

### **Fit Mode**
How background image is displayed:
- **Fit**: Image scaled to fit entirely within canvas (may have letterboxing)
- **Fill**: Image scaled to fill entire canvas (may crop edges)

---

## Data & State

### **Autosave**
Automatic persistence of application state to browser localStorage. Debounced to 1000ms.

**Storage Key:** `routePlotter_autosave`

### **Serialization**
Converting waypoints and state to JSON for storage.

**Method:** `waypoint.toJSON()`

### **Deserialization**
Recreating waypoints from saved JSON data.

**Method:** `Waypoint.fromJSON(data)`

### **Batch Mode**
Performance optimization that delays path recalculation during bulk waypoint operations.

**Methods:**
- `beginBatch()`: Start batch mode
- `endBatch()`: Trigger single recalculation

### **Dirty Flags**
Markers indicating what needs to be recalculated or rerendered.

### **Cache Invalidation**
Clearing cached data (like major waypoint positions) when waypoints change.

---

## Services & Architecture

### **Service**
Modular component responsible for specific functionality:
- **AnimationEngine**: Animation timing and playback
- **PathCalculator**: Path interpolation and curvature
- **StorageService**: localStorage persistence
- **CoordinateTransform**: Coordinate system conversions

### **EventBus**
Publish-subscribe system for decoupled component communication.

**Event Categories:**
- `waypoint:added`
- `waypoint:deleted`
- `waypoint:selected`
- `waypoint:position-changed`
- `waypoint:style-changed`
- `waypoint:path-property-changed`
- `animation:play`
- `animation:pause`
- `animation:complete`

### **Waypoint Model**
Class representing a waypoint with properties and methods.

**File:** `src/models/Waypoint.js`

### **Animation State Model**
Class managing animation state.

**File:** `src/models/AnimationState.js`

### **RoutePlotter**
Main application class coordinating all components.

**File:** `src/main.js`

---

## Common Phrases

### When Describing Issues:

✅ **Clear:**
- "The animation speed slider position is saved but the animation duration doesn't reflect the saved speed value"
- "Waypoint markers don't rescale when the browser window is resized"
- "The default animation state should start at the end position (100% progress) and paused, not playing from the start"

❌ **Unclear:**
- "The speed thing doesn't work"
- "The dots are the wrong size"
- "It starts wrong"

### When Requesting Features:

✅ **Clear:**
- "Can we change the curve tension from 0.5 to 0.2 for tighter curves?"
- "Add a feature to export waypoints to GPX format"
- "Increase the minimum corner speed from 0.2 to 0.3 for less dramatic slowdown"

❌ **Unclear:**
- "Make the curves tighter"
- "Add export"
- "The corners slow too much"

### When Discussing Animation:

✅ **Clear:**
- "Set the animation to 50% progress"
- "The playhead should start at the end position"
- "Animation duration is calculated from path length divided by speed"
- "Current time display shows 00:15 of 00:30"

❌ **Unclear:**
- "Put it at halfway"
- "The thing should start at the end"
- "How long it takes"
- "The time shows wrong"

### When Discussing Waypoints:

✅ **Clear:**
- "Major waypoints with pause time set to 2000ms (2 seconds)"
- "Add a minor waypoint at image coordinates (150, 200)"
- "The selected waypoint is highlighted with a yellow glow"
- "Waypoint 5 is a major waypoint with label 'Checkpoint A'"

❌ **Unclear:**
- "Big dots with pauses"
- "Add a point there"
- "The yellow one"
- "The fifth one with the name"

---

## Technical Constants Reference

Quick reference for important constants:

```javascript
// Animation
ANIMATION.DEFAULT_SPEED = 50              // px/s
ANIMATION.DEFAULT_DURATION = 5000         // ms
ANIMATION.TARGET_FPS = 60
ANIMATION.TIMELINE_RESOLUTION = 1000      // slider steps

// Path
PATH.DEFAULT_TENSION = 0.2                // curve tightness
PATH.MIN_CORNER_SPEED = 0.2               // 20% at corners
PATH.POINTS_PER_SEGMENT = 100
PATH.TARGET_SPACING = 2                   // px between points

// Rendering
RENDERING.DEFAULT_DOT_SIZE = 8            // major waypoints
RENDERING.MINOR_DOT_SIZE = 4              // minor waypoints
RENDERING.PATH_HEAD_SIZE = 8
RENDERING.BEACON_PULSE_DURATION = 2000    // ms

// Interaction
INTERACTION.WAYPOINT_HIT_RADIUS = 15      // px for clicking
INTERACTION.DRAG_THRESHOLD = 3            // px
```

---

## Version History

- **v3.0** - Current version with full modularization
  - Phase 1-7 migration complete
  - AnimationEngine service
  - EventBus architecture
  - Waypoint model
  - Performance optimizations

---

## Usage Tips

1. **When reporting bugs:** Include the specific component/service name and exact behavior
2. **When requesting features:** Reference the glossary terms for precision
3. **When discussing values:** Use the actual constant names or numeric values with units
4. **When describing UI:** Use the official element names from this glossary

---

**Example of Good Communication:**

> "The `AnimationEngine` doesn't preserve the `speed` value on reset. When I press the Skip to Start button (⏮), the `animationEngine.state.speed` resets to `ANIMATION.DEFAULT_SPEED` instead of keeping my saved value of 100 px/s. The speed slider UI shows 100, but the animation duration recalculates using 50 px/s."

This precise description makes it immediately clear what the issue is and where to look!
