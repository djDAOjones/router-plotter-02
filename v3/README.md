# Route Plotter v3

A clean, simple implementation of the Route Plotter with smooth curves, beacon effects, and full style controls.

## ✨ Features

### **Core Functionality**
✅ **Smooth Path Drawing**
- Catmull-Rom spline interpolation for smooth curves
- Minor waypoints shape the path without being visible
- Real-time path calculation

✅ **Waypoint System**
- **Click** - Add major waypoint (visible marker)
- **Shift+Click** - Add minor waypoint (invisible, for path shaping only)
- Major waypoints show as filled circles
- Minor waypoints are hidden but affect curve smoothing

✅ **Animation Controls**
- Play/Pause (button or spacebar)
- Skip to Start / Skip to End buttons
- Timeline slider for scrubbing through animation
- Current/Total time display with accurate timing

### **Visual Effects**
✅ **Beacon Effects**
- **Pulse**: Smooth pulsing glow effect
- **Ripple**: Expanding ripple animation
- **None**: Simple dot indicator
- Customizable beacon color

### **Style Controls (Sidebar)**
✅ **Path Style**
- Color picker for path color
- Thickness slider (1-10px)

✅ **Waypoints**
- Size slider (4-16px)

✅ **Beacon**
- Style selector (None/Pulse/Ripple)
- Color picker for beacon

## How to Run

```bash
# Navigate to v3 folder
cd v3

# Start the server (port 3001)
npm start
# or
python3 -m http.server 3001

# Open in browser
http://localhost:3001
```

## Usage

1. **Add Waypoints**: Click on the canvas to add major waypoints, or Shift+Click for minor waypoints
2. **Create Path**: Need at least 2 waypoints for a path to appear
3. **Play Animation**: Use the play button or spacebar to animate the path
4. **Scrub Timeline**: Drag the slider to jump to any point in the animation

## Architecture

Simple, single-file JavaScript implementation:
- `index.html` - Clean HTML structure
- `styles/main.css` - All styling in one place
- `src/main.js` - Single RoutePlotter class with all logic

## Next Steps

- [ ] Add waypoint dragging
- [ ] Add smooth curves (Catmull-Rom splines)
- [ ] Add base image/map support
- [ ] Add export functionality
- [ ] Add more path styling options

## Key Improvements from v2

- Simpler architecture (single file, no modules)
- Direct canvas rendering (no complex layer system)
- Clear separation of concerns
- Working timeline and animation controls
- Immediate visual feedback
