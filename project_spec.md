# Route Plotter v2.0 - Project Specification

## Executive Summary

Route Plotter v2.0 is a complete rewrite focusing on **viability-first implementation** with a phased delivery approach. The core mission remains: **quick authoring without timeline/keyframe jargon**, using a waypoint-first paradigm with optional camera, labels, and hotspot layers.

## Core Architecture

### Separation of Concerns
- **Authoring Engine**: Interactive editing at variable refresh rates
- **Runtime Engine**: Deterministic playback at fixed time-steps (shared by preview and export)
- **Single State Model**: Versioned JSON schema with migrations
- **Layered Renderer**: Composited Canvas 2D with distinct rendering layers

## Technology Stack

```typescript
{
  "build": "TypeScript + Vite",
  "renderer": "Canvas 2D (WebGL only if performance requires)",
  "persistence": "IndexedDB for autosave",
  "packaging": "JSZip for import/export",
  "validation": "Zod for schema validation",
  "export": "MediaRecorder (WebM) + Canvas capture"
}
```

## Phased Implementation Plan

### Phase 2.0 - MVP (Core Functionality)

#### 1. Core Engine
- **Geometry**: Centripetal Catmull-Rom interpolation with tension control
- **Arc-length**: Precomputed lookup tables per segment
- **Timing modes**: 
  - Constant time per major→major segment
  - Constant speed (arc-length based)
- **Pause modes**: none, seconds, wait-for-click
- **Easing**: Applied via time mapping between majors

#### 2. Track System
```typescript
interface Tracks {
  path: {
    waypoints: Array<Major | Minor>,
    style: PathStyle,
    timing: TimingConfig,
    smoothing: CatmullRomConfig
  },
  camera: {
    waypoints: CameraPoint[],
    safetyMargin: number,
    bounds: ImageBounds,
    zoom: { min: number, max: number }
  },
  labels: {
    items: Label[],
    mode: 'showPersist' | 'showHide' | 'showFade',
    anchor: 'auto' | 'N' | 'E' | 'S' | 'W'
  }
}
```

#### 3. Renderer Layers (bottom to top)
1. **Base image layer** (PNG/JPG only)
2. **Contrast overlay** (black↔none↔white linear slider)
3. **Mask/unmask layer** (basic compositing)
4. **Vector layer** (paths, labels, waypoints)
5. **Path head layer** (arrow/pulsing dot/custom)
6. **UI handles layer** (edit mode only)

#### 4. Authoring UI
- **Splash screen**: Novice instructions on startup, accessible via header button
- **Track tabs**: Path, Camera, Labels (edit one at a time)
- **Waypoint editing**:
  - Click to add major waypoints
  - Shift+Click to add minor waypoints
  - Click existing waypoint to select for editing
  - Drag to adjust position
  - Reorderable major list with delete
- **Keyboard controls**:
  - Arrow keys: Nudge ±1% canvas dimension
  - Shift+Arrows: Nudge ±5% canvas dimension
  - Space: Play/pause
  - J/K/L: Transport (0.5x/1x/2x speed)
  - Escape: Cancel drag operation

#### 5. Preview System
- **Controls**: Play, pause, start, end buttons
- **Scrubber**: 200-step slider on normalized timeline [0,1]
- **Deterministic clock**: Fixed dt = 1/25s for frame-perfect consistency
- **Real-time interpolation**: Visual smoothing while maintaining deterministic state

#### 6. Export Pipeline
- **Primary**: WebM at 25fps via MediaRecorder
- **Fallback**: PNG sequence with alpha channel
- **Constraints**: CORS-safe assets only
- **Parity**: ±1 frame (40ms) between preview and export

#### 7. Persistence & State
- **Autosave**: IndexedDB every 10s or on idle
- **Undo/Redo**: Command pattern, 100+ stack depth
- **Import/Export**: Project ZIP (project.json + assets/)
- **Schema versioning**: Migration support

#### 8. Accessibility & QA
- **Required**: Alt text before export
- **Reduced motion**: Replace pans/zooms with fades
- **Focus management**: Keyboard navigation
- **Touch targets**: Minimum 44px
- **Palette presets**: 2-3 colorblind-safe options
- **Validation**: Block export on failures

#### 9. Embed & API
```javascript
// postMessage commands
{ action: "play" }
{ action: "pause" }
{ action: "seekToStep", step: 50 }
{ action: "setSpeed", speed: 1.5 }

// postMessage events
{ event: "ready" }
{ event: "state", data: { step: 50, playing: true, speed: 1 } }
{ event: "ended" }
```

### Phase 2.1 - Enhanced Features

1. **Label collision avoidance**
   - Anchor point candidates (N/E/S/W)
   - Time staggering for persistent overlaps
   
2. **Hotspot patterns**
   - 2-3 preset patterns
   - Region primitives (circle/rect/polygon)
   
3. **Transparent overlay export**
   - PNG sequence with alpha channel
   - WebM with alpha (if browser supports)

### Phase 2.2 - Advanced Integration

1. **Internationalization**
   - RTL support
   - Locale-aware number/date formats
   - Externalized UI strings
   
2. **Query param state**
   - Bookmark/restore via URL
   - Deep linking to specific steps
   
3. **CSP-friendly export**
   - Multi-file bundle option
   - External script references

## Performance Caps & Limits

```typescript
const LIMITS = {
  pathPoints: 1000,        // per track
  majorWaypoints: 100,     // per track
  labels: 200,             // total (≤8 visible)
  hotspots: 50,            // total
  projectDuration: 90,     // seconds for export
  exportFrames: 2250,      // at 25fps
  pngSequenceFrames: 1500, // for PNG export
  undoStack: 200,          // operations
  assetSize: 10 * 1024 * 1024,    // 10MB per asset
  totalAssets: 100 * 1024 * 1024  // 100MB total
};
```

## Project Schema v2.0

```json
{
  "schemaVersion": 1,
  "meta": {
    "title": "Route Animation Project",
    "description": "",
    "author": "",
    "attribution": "",
    "created": "2024-01-01T00:00:00Z",
    "modified": "2024-01-01T00:00:00Z"
  },
  "a11y": {
    "altText": "Required description...",
    "reducedMotion": false,
    "paletteId": "default"
  },
  "assets": [
    {
      "id": "base-image",
      "type": "image",
      "name": "map.png",
      "path": "assets/map.png",
      "metadata": {
        "width": 1920,
        "height": 1080
      }
    }
  ],
  "settings": {
    "fps": 25,
    "contrastOverlay": {
      "mode": "none",
      "value": 0
    },
    "cameraBounds": {
      "x": 0,
      "y": 0,
      "width": 1920,
      "height": 1080
    },
    "safetyMargin": 50
  },
  "tracks": [
    {
      "id": "main-path",
      "type": "path",
      "name": "Primary Route",
      "style": {
        "strokeColor": "#FF6B6B",
        "strokeWidth": 3,
        "strokeVariant": "solid",
        "waypointShape": "circle",
        "pathHead": "arrow"
      },
      "timing": {
        "mode": "constantSpeed",
        "baseSpeedPxPerSec": 200,
        "pauseMode": "seconds",
        "pauseSeconds": 2,
        "easeInOut": true
      },
      "waypoints": [
        {
          "id": "wp1",
          "x": 100,
          "y": 200,
          "isMajor": true
        }
      ]
    }
  ],
  "export": {
    "format": "webm",
    "quality": 0.9,
    "overlayAlpha": false
  }
}
```

## Deferred/Dropped Features

### Permanently Dropped
- Single-file HTML export (complexity vs CSP conflicts)
- In-browser MP4 export (browser support insufficient)

### Deferred to Future Versions
- Video backgrounds (v3.0)
- Rich media in labels (v3.0)
- Advanced label collision (v2.1)
- Full force-directed label solver (research)
- Multi-language audio tracks (v3.0)
- Real-time collaboration (v4.0)

## Success Metrics

### Performance Targets
- **TTI**: ≤2.5s on desktop (3G connection)
- **Frame rate**: 60fps target, 30fps floor
- **Export parity**: ±40ms (1 frame at 25fps)
- **Memory**: ≤200MB for typical project

### Quality Gates
- All exports must pass validation
- Alt text required for accessibility
- Monotonic timing verification
- Performance cap enforcement

## Development Timeline

### Sprint 1-2: Foundation (Weeks 1-2)
- Project setup and toolchain
- Core geometry engine
- Basic renderer layers

### Sprint 3-4: Authoring (Weeks 3-4)
- Track system implementation
- Waypoint editing UI
- Keyboard controls

### Sprint 5-6: Runtime (Weeks 5-6)
- Deterministic clock
- Preview controls
- Export pipeline

### Sprint 7-8: Polish (Weeks 7-8)
- Accessibility features
- Performance optimization
- Documentation

### Sprint 9-10: Testing & Launch (Weeks 9-10)
- Cross-browser testing
- Performance validation
- Deployment preparation

## Risk Mitigation

1. **Performance risks**: Start with Canvas 2D, profile early, have WebGL fallback plan
2. **Export compatibility**: Focus on WebM first, PNG sequence as guaranteed fallback
3. **Complexity creep**: Strict phase boundaries, defer nice-to-haves
4. **Browser support**: Target modern evergreen browsers only
5. **File size**: Implement progressive loading, lazy asset loading

## Documentation Requirements

1. **User Guide**: Complete authoring workflow
2. **Embed Guide**: Integration instructions with examples
3. **API Reference**: postMessage protocol documentation
4. **Schema Reference**: Migration guide and validation rules
5. **Accessibility Guide**: Best practices for content creators

---

This specification prioritizes **viability and deliverability** while maintaining the core vision of intuitive, waypoint-based animation authoring. The phased approach ensures a solid MVP with clear paths for enhancement based on user feedback and real-world usage patterns.