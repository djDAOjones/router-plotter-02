# Route Plotter v2.0

A powerful web-based tool for creating animated route visualizations with waypoints, paths, and labels. No timeline editing or keyframe jargon required!

## Features

### MVP Version (Current)
- ✨ **Interactive waypoint system** - Click to add, drag to move
- 🎨 **Catmull-Rom spline interpolation** for smooth paths
- ▶️ **Real-time preview** with playback controls
- 🎯 **Path customization** - Color, width, style options
- 📱 **Responsive design** for all devices
- ♿ **WCAG 2.2 AAA compliant** (in progress)

### Coming Soon
- 📹 WebM video export
- 📦 Project save/load with ZIP packaging
- 🏷️ Labels and annotations
- 📷 Camera tracking and zoom
- 🎭 Mask/reveal animations
- 💾 Auto-save to IndexedDB

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

## Usage

1. **Upload an Image/Map**
   - Click or drag-drop an image onto the upload area
   - Supports PNG, JPG, JPEG formats

2. **Add Waypoints**
   - **Click** on canvas - Add major waypoint
   - **Shift+Click** - Add minor waypoint (for curves)
   - **Drag** waypoints to reposition

3. **Customize Path**
   - Adjust color, width, and style
   - Choose waypoint shapes and animations
   - Set timing and pause modes

4. **Preview Animation**
   - Use playback controls to preview
   - Adjust speed (0.25x to 8x)
   - Scrub through timeline

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Escape | Deselect waypoint |
| Delete/Backspace | Delete selected waypoint |
| Arrow Keys | Nudge selected waypoint (with Shift for larger moves) |
| J/K/L | Backwards/Stop/Forward |

## Technical Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **Canvas 2D** - Hardware-accelerated rendering
- **No frameworks** - Pure TypeScript for maximum performance

## Project Structure

```
route-plotter-v2/
├── src/
│   ├── app.ts          # Main application class
│   ├── geometry.ts     # Catmull-Rom spline & math
│   ├── renderer.ts     # Canvas rendering engine
│   ├── timing.ts       # Animation controller
│   ├── types.ts        # TypeScript definitions
│   ├── project.ts      # Project management (future)
│   ├── export.ts       # Export functionality (future)
│   └── styles/
│       └── main.css    # WCAG-compliant styles
├── index.html          # Main HTML file
├── package.json        # Dependencies
└── vite.config.ts      # Vite configuration
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Target:** 60 FPS animation
- **Floor:** 30 FPS minimum
- **First Interactive:** ≤2.5s on 3G
- **Export Parity:** ±40ms accuracy

## Accessibility

Working towards WCAG 2.2 AAA compliance:
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ Touch targets ≥44px
- ✅ 4.5:1 contrast ratios
- 🚧 Screen reader support
- 🚧 Reduced motion support

## Contributing

This project is under active development. Contributions welcome!

## License

[License information to be added]

## Credits

Created as part of the PARM Maps Encore project at the University of Nottingham.

---

**Note:** This is the MVP version. Full feature set as described in the specification is under development.
