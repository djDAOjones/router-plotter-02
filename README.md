# Route Plotter v3

Interactive path animation tool for creating animated routes on images.

🔗 **[Live Demo](https://djdaojones.github.io/router-plotter-02/)**

## 🚀 Quick Start

### Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
```

### Production Build

```bash
npm run build        # Create production build in dist/
npm run build:deploy # Build and update GitHub Pages docs/
```

## 📁 Project Structure

```text
src/
├── main.js               # Main application entry
├── config/constants.js   # Configuration values
├── controllers/          # UI and animation controllers
├── handlers/             # Event handlers
├── models/               # Data models
├── services/             # Business logic services
├── utils/                # Utility functions
└── workers/              # Web Workers for performance
```

## ⚙️ Key Settings

Edit `src/config/constants.js`:

- `PATH.DEFAULT_TENSION`: 0.2 (curve tightness, lower = tighter)
- `ANIMATION.DEFAULT_SPEED`: 400 px/s
- `RENDERING.DEFAULT_PATH_COLOR`: '#FF6B6B'

## 📄 License

MIT
