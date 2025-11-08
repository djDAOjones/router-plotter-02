**1) Product overview**

-   **Goal:** Let educators create short, focused animations in
    minutes---no timeline editing or keyframe jargon.

-   **Paradigm:** Author **waypoints** on one or more **tracks**
    (camera, path, labels, hotspots, timeline, video).

-   **Delivery:** Great accessibility, mobile-friendly, single-file
    export; future-proof for Xerte block/page-type integration.

**2) Primary users & jobs**

-   **Educators and students:** illustrate routes, draw attention to
    details, and sequence labelled parts with minimal friction.

**3) Core functionality**

1.  Waypoint-based pathing engine, with up to simultaneous 4 path
    layers.

2.  Editing interface is for one path at a time.

3.  It's possible to save and load path + associated image/video in a
    zip file.

4.  Controls for size and colour of waypoints / path (one colour control
    per path / waypoint group)

5.  Possible behaviours of path:

    a.  Visible path

    b.  Unmask along path (image is hidden until path reveals)

    c.  Hotspots i.e. areas to visually emphaisis (in regular path mode)
        or unmask (in unmask path mode) when waypoint reached. Perhaps
        offer colour and pattern options for hotspot areas?

    d.  Act as camera (camera tracking), zoom in on image, follow path
        (with safety margin)

    e.  Display labels at major way-points (labels can include text,
        images, sound, link, videos, so maybe an editor for labels)

6.  Major/minor waypoints (majors drive timing and labels etc; minors
    shape geometry i.e. a direct path may not be desired)

7.  Timing modes: constant time per major→major segment; constant speed
    via arc-length

8.  UI control for rendering path animation as one continuous path,
    pausing at major waypoint for specified time in seconds, and pausing
    at major waypoint until click

9.  Always on Ease in and out path drawing speed (between each major
    waypoint if pausing for time / click, once across whole path if no
    pausing)

10. Always-on path smoothing to remove jagged appearance but not cur
    corners (Catmull-Rom spline interpolation with 50% tension)

11. Label modes: off, show on arrival and fade away, show on arrival and
    persist, or always on, optional sound (I will load three presets:
    ding, tony hawk orchestra hit, duck quack; include sound upload
    option with 1MB cap)

12. Options for the "head" of the path animation. Options to upload
    image, and then presets: nothing, arrow, slowly pulsing dot with
    medium sized stroke/border, custom image. The head should always
    face the direction the path is heading, so rotate the custom image
    and provide a UI tool to set initial rotation and align with forward
    direction e.g. rotation control alongside an arrow overlaying the
    image upload showing which way is up.

13. Automatic label collision avoidance with fallback timing stagger

14. Options for waypoint dot: nothing, circle, square

15. Options for waypoint path: nothing, line, squiggle line, dots,
    dashed line

16. Options for animation when reaching major waypoint: nothing, "sonar"
    style radiating ring shape that fades, ring with white inner and
    black outer than expands from nothing to being moderately larger
    than the waypoint dot

17. Slider to control colour solid between background image and
    generated graphics, for improving visibility / contrast: black
    overlay one extreme, no overlay in the center, and white overlay
    other extreme. Should be able to range from 90% black to 0% to 90%
    white.

18. Canvas view controls: Fit, Fill, 1:1; aspect ratios 16:9, 4:3, 1:1,
    or Native

19. Live preview with a button to show the start, the end, to play/stop,
    and a slider that ranges 2048 steps across the entire duration of
    waypoints. This will require a continuously rebalancing tally of
    timing.

20. Click-to-add and drag-to-adjust waypoints; Esc to cancel

21. Keyboard arrow keys nudge an active waypoint ±1% or with Shift 5%.
    Spacebar does play/pause, and J/K/L backwards, stop, forwards with
    multiple presses doubling the speed up to x8

22. Reorderable waypoint list with hover/selection linking to canvas
    objects (this could move depending on screen dimensions i.e. towards
    the bottom, or on the left)

23. Content panel for image/map/video inputs, alt text

24. Palette button for one-click colour-safe scheme application across
    layers. Must be colour blindness safe.

25. Autosave to IndexedDB and multi-step undo/redo (≥100)

26. Import/export of project JSON with versioning and migrations

27. Standalone HTML export with base64 assets and minimal runtime

28. WebM export with smooth rendering (no dropped frames) at 25fps
    (browser capability gated via detection), CORS-safe only

29. Responsive iframe embed snippet with allowfullscreen

30. PostMessage API for host control (play, pause, seekToStep, setSpeed)
    and events (ready, state, ended)

31. Accessibility: ARIA live captions, mandatory alt text, managed
    focus, touch targets ≥44 px, 4.5:1 contrast (provide warning on
    export if any not met)

32. Reduced-motion support replacing pans/zooms with fades

33. uses user-uploaded images and videos; all assets embedded or
    packaged locally; no live or remote content; optional manual
    attribution field.

34. Performance targets: ≤2.5 s first interactive on desktop, 60 fps
    target with ≥30 fps floor

35. Export--preview parity within ±40 ms at step boundaries

36. Block export validation for monotonic times, missing alt text, too
    few points, unresolved label overlaps

37. Internationalisation with externalised strings, locale-aware
    numbers/dates, RTL-safe labels

38. CSP-friendly single bundle with no eval or inline scripts; no
    third-party tracking in exports

39. Clear error messages for any issues e.g. routing failures, CORS
    taint, unsupported capture, invalid JSON, etc. messages should help
    debug until later production version.

40. Consider limiting caps to: path points, camera points, labels,
    hotspots, mask polygon, mask radius, etc that helps speed but
    enables functionality.

**4) Specs**

Easy for novices to use

Mobile compatible (editor)

Mobile first (HTML viewer export)

Compatible with later Xerte integration

Meet WGAG 2.2 AAA

Avoid GPL, AGPL, CC-BY-SA, CC-BY-NC dependencies

Easily run on servers e.g. locally

Professional quality

**5) Future features (bare in mind but don't implement now)**

1.  Ability to export as an overlay with transparent background,
    removing any background image (for use in video production)

2.  4 paths in one project

**6) In other words**

\# Route Plotter v2.0 - Project Specification \## Executive Summary
Route Plotter v2.0 is a complete rewrite focusing on \*\*viability-first
implementation\*\* with a phased delivery approach. The core mission
remains: \*\*quick authoring without timeline/keyframe jargon\*\*, using
a waypoint-first paradigm with optional camera, labels, and hotspot
layers. \## Core Architecture \### Separation of Concerns -
\*\*Authoring Engine\*\*: Interactive editing at variable refresh
rates - \*\*Runtime Engine\*\*: Deterministic playback at fixed
time-steps (shared by preview and export) - \*\*Single State Model\*\*:
Versioned JSON schema with migrations - \*\*Layered Renderer\*\*:
Composited Canvas 2D with distinct rendering layers \## Technology Stack

typescript

{

\"build\": \"TypeScript + Vite\",

\"renderer\": \"Canvas 2D (WebGL only if performance requires)\",

\"persistence\": \"IndexedDB for autosave\",

\"packaging\": \"JSZip for import/export\",

\"validation\": \"Zod for schema validation\",

\"export\": \"MediaRecorder (WebM) + Canvas capture\"

}

\## Phased Implementation Plan \### Phase 2.0 - MVP (Core Functionality)
\#### 1. Core Engine - \*\*Geometry\*\*: Centripetal Catmull-Rom
interpolation with tension control - \*\*Arc-length\*\*: Precomputed
lookup tables per segment - \*\*Timing modes\*\*: - Constant time per
major→major segment - Constant speed (arc-length based) - \*\*Pause
modes\*\*: none, seconds, wait-for-click - \*\*Easing\*\*: Applied via
time mapping between majors \#### 2. Track System

typescript

interface Tracks {

path: {

waypoints: Array\<Major \| Minor\>,

style: PathStyle,

timing: TimingConfig,

smoothing: CatmullRomConfig

},

camera: {

waypoints: CameraPoint\[\],

safetyMargin: number,

bounds: ImageBounds,

zoom: { min: number, max: number }

},

labels: {

items: Label\[\],

mode: \'showPersist\' \| \'showHide\' \| \'showFade\',

anchor: \'auto\' \| \'N\' \| \'E\' \| \'S\' \| \'W\'

}

}

\#### 3. Renderer Layers (bottom to top) 1. \*\*Base image layer\*\*
(PNG/JPG only) 2. \*\*Contrast overlay\*\* (black↔none↔white linear
slider) 3. \*\*Mask/unmask layer\*\* (basic compositing) 4. \*\*Vector
layer\*\* (paths, labels, waypoints) 5. \*\*Path head layer\*\*
(arrow/pulsing dot/custom) 6. \*\*UI handles layer\*\* (edit mode only)
\#### 4. Authoring UI - \*\*Splash screen\*\*: Novice instructions on
startup, accessible via header button - \*\*Track tabs\*\*: Path,
Camera, Labels (edit one at a time) - \*\*Waypoint editing\*\*: - Click
to add major waypoints - Shift+Click to add minor waypoints - Click
existing waypoint to select for editing - Drag to adjust position -
Reorderable major list with delete - \*\*Keyboard controls\*\*: - Arrow
keys: Nudge ±1% canvas dimension - Shift+Arrows: Nudge ±5% canvas
dimension - Space: Play/pause - J/K/L: Transport (0.5x/1x/2x speed) -
Escape: Cancel drag operation - \*\*Other UI\*\*: - User can drag and
drop image onto canvas, canvas will resize for image - Way points are
scaled to the source image - Controls to make the image fit or fill -
Controls to make canvas 16:9 or 4:3 - The way points should be scaled to
the canvas size, so that if the image moves or resizes, the way points
are scaled with it \#### 5. Preview System - \*\*Controls\*\*: Play,
pause, start, end buttons - \*\*Scrubber\*\*: 1000-step slider on
normalized timeline \[0,1\] - \*\*Deterministic clock\*\*: Fixed dt =
1/25s for frame-perfect consistency - \*\*Real-time interpolation\*\*:
Visual smoothing while maintaining deterministic state \#### 6. Export
Pipeline - \*\*Primary\*\*: WebM at 25fps via MediaRecorder -
\*\*Fallback\*\*: PNG sequence with alpha channel - \*\*Constraints\*\*:
CORS-safe assets only - \*\*Parity\*\*: ±1 frame (40ms) between preview
and export \#### 7. Persistence & State - \*\*Autosave\*\*: IndexedDB
every 10s or on idle - \*\*Undo/Redo\*\*: Command pattern, 100+ stack
depth - \*\*Import/Export\*\*: Project ZIP (project.json + assets/) -
\*\*Schema versioning\*\*: Migration support \#### 8. Accessibility &
QA - \*\*Required\*\*: Alt text before export - \*\*Reduced motion\*\*:
Replace pans/zooms with fades - \*\*Focus management\*\*: Keyboard
navigation - \*\*Touch targets\*\*: Minimum 44px - \*\*Palette
presets\*\*: 2-3 colorblind-safe options - \*\*Validation\*\*: Block
export on failures \#### 9. Embed & API

javascript

// postMessage commands

{ action: \"play\" }

{ action: \"pause\" }

{ action: \"seekToStep\", step: 50 }

{ action: \"setSpeed\", speed: 1.5 }

// postMessage events

{ event: \"ready\" }

{ event: \"state\", data: { step: 50, playing: true, speed: 1 } }

{ event: \"ended\" }

\### Phase 2.1 - Enhanced Features 1. \*\*Label collision
avoidance\*\* - Anchor point candidates (N/E/S/W) - Time staggering for
persistent overlaps 2. \*\*Hotspot patterns\*\* - 2-3 preset patterns -
Region primitives (circle/rect/polygon) 3. \*\*Transparent overlay
export\*\* - PNG sequence with alpha channel - WebM with alpha (if
browser supports) \### Phase 2.2 - Advanced Integration 1.
\*\*Internationalization\*\* - RTL support - Locale-aware number/date
formats - Externalized UI strings 2. \*\*Query param state\*\* -
Bookmark/restore via URL - Deep linking to specific steps 3.
\*\*CSP-friendly export\*\* - Multi-file bundle option - External script
references \## Performance Caps & Limits

typescript

const LIMITS = {

pathPoints: 1000, // per track

majorWaypoints: 100, // per track

labels: 200, // total (≤8 visible)

hotspots: 50, // total

projectDuration: 90, // seconds for export

exportFrames: 2250, // at 25fps

pngSequenceFrames: 1500, // for PNG export

undoStack: 200, // operations

assetSize: 10 \* 1024 \* 1024, // 10MB per asset

totalAssets: 100 \* 1024 \* 1024 // 100MB total

};

\## Project Schema v2.0

json

{

\"schemaVersion\": 1,

\"meta\": {

\"title\": \"Route Animation Project\",

\"description\": \"\",

\"author\": \"\",

\"attribution\": \"\",

\"created\": \"2024-01-01T00:00:00Z\",

\"modified\": \"2024-01-01T00:00:00Z\"

},

\"a11y\": {

\"altText\": \"Required description\...\",

\"reducedMotion\": false,

\"paletteId\": \"default\"

},

\"assets\": \[

{

\"id\": \"base-image\",

\"type\": \"image\",

\"name\": \"map.png\",

\"path\": \"assets/map.png\",

\"metadata\": {

\"width\": 1920,

\"height\": 1080

}

}

\],

\"settings\": {

\"fps\": 25,

\"contrastOverlay\": {

\"mode\": \"none\",

\"value\": 0

},

\"cameraBounds\": {

\"x\": 0,

\"y\": 0,

\"width\": 1920,

\"height\": 1080

},

\"safetyMargin\": 50

},

\"tracks\": \[

{

\"id\": \"main-path\",

\"type\": \"path\",

\"name\": \"Primary Route\",

\"style\": {

\"strokeColor\": \"#FF6B6B\",

\"strokeWidth\": 3,

\"strokeVariant\": \"solid\",

\"waypointShape\": \"circle\",

\"pathHead\": \"arrow\"

},

\"timing\": {

\"mode\": \"constantSpeed\",

\"baseSpeedPxPerSec\": 200,

\"pauseMode\": \"seconds\",

\"pauseSeconds\": 2,

\"easeInOut\": true

},

\"waypoints\": \[

{

\"id\": \"wp1\",

\"x\": 100,

\"y\": 200,

\"isMajor\": true

}

\]

}

\],

\"export\": {

\"format\": \"webm\",

\"quality\": 0.9,

\"overlayAlpha\": false

}

}

\## Deferred/Dropped Features \### Permanently Dropped - Single-file
HTML export (complexity vs CSP conflicts) - In-browser MP4 export
(browser support insufficient) \### Deferred to Future Versions - Video
backgrounds (v3.0) - Rich media in labels (v3.0) - Advanced label
collision (v2.1) - Full force-directed label solver (research) -
Multi-language audio tracks (v3.0) - Real-time collaboration (v4.0) \##
Success Metrics \### Performance Targets - \*\*TTI\*\*: ≤2.5s on desktop
(3G connection) - \*\*Frame rate\*\*: 60fps target, 30fps floor -
\*\*Export parity\*\*: ±40ms (1 frame at 25fps) - \*\*Memory\*\*: ≤200MB
for typical project \### Quality Gates - All exports must pass
validation - Alt text required for accessibility - Monotonic timing
verification - Performance cap enforcement 4. \*\*Browser support\*\*:
Target modern evergreen browsers only 5. \*\*File size\*\*: Implement
progressive loading, lazy asset loading \## Documentation
Requirements 1. \*\*User Guide\*\*: Complete authoring workflow 2.
\*\*Embed Guide\*\*: Integration instructions with examples 3. \*\*API
Reference\*\*: postMessage protocol documentation 4. \*\*Schema
Reference\*\*: Migration guide and validation rules 5. \*\*Accessibility
Guide\*\*: Best practices for content creators
