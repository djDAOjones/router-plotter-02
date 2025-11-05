# Route Plotter v2.0

A waypoint-based animation authoring tool for creating route animations on maps and diagrams.

## Features

### Core Functionality (Phase 2.0 - MVP)
- ✅ **Waypoint-based authoring** - Click to add waypoints, no timeline/keyframe complexity
- ✅ **Catmull-Rom interpolation** - Smooth curves through waypoints with tension control
- ✅ **Multiple timing modes** - Constant speed or constant time per segment
- ✅ **Layered rendering** - Canvas 2D with composited layers
- ✅ **Real-time preview** - Play, pause, scrub with deterministic timing
- ✅ **Export options** - WebM video or PNG sequence
- ✅ **Auto-save** - IndexedDB persistence every 10 seconds
- ✅ **Project management** - Import/export as ZIP with assets

### Track System
- **Path Track** - Main route with waypoints and styling
- **Camera Track** - Auto-framing with safety margins
- **Label Track** - Text annotations with anchor points

### Accessibility
- Alt text required before export
- Reduced motion support
- Keyboard navigation
- Colorblind-safe palette presets

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Usage
1. Click on the canvas to add waypoints
2. Every 3rd waypoint is automatically marked as "major"
3. Adjust timing and style in the sidebar
4. Press Space to play/pause animation
5. Export as WebM video or PNG sequence

### Keyboard Shortcuts
- **Space** - Play/Pause
- **J** - 0.5x speed
- **K** - 1x speed  
- **L** - 2x speed
- **Arrow Keys** - Nudge selected waypoint (±1% canvas)
- **Shift+Arrows** - Large nudge (±5% canvas)
- **Escape** - Cancel current operation

## Architecture

### Core Modules
- **Geometry Engine** - Centripetal Catmull-Rom spline interpolation
- **Renderer** - Layer-based Canvas 2D rendering system
- **Animation Engine** - Deterministic timing with easing
- **Project Manager** - IndexedDB persistence and ZIP import/export
- **UI Controller** - Event handling and state synchronization
- **Export Manager** - WebM/PNG sequence generation

### Technology Stack
- **Build**: TypeScript + Vite
- **Rendering**: Canvas 2D (WebGL ready)
- **Persistence**: IndexedDB
- **Packaging**: JSZip
- **Validation**: Zod schemas
- **Export**: MediaRecorder API

## Performance Limits
- Path points: 1,000 per track
- Major waypoints: 100 per track
- Labels: 200 total (≤8 visible)
- Project duration: 90 seconds
- Export frames: 2,250 at 25fps
- Asset size: 10MB per file, 100MB total

## Project Structure
```
v2/
├── src/
│   ├── app/          # Application logic
│   ├── engine/       # Core engines (geometry, rendering, timing)
│   ├── schemas/      # Zod validation schemas
│   ├── styles/       # CSS styles
│   ├── types/        # TypeScript type definitions
│   └── main.ts       # Entry point
├── index.html        # Main HTML file
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript config
└── vite.config.ts    # Vite build config
```

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License
MIT
