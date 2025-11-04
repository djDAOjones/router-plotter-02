# Route Plotter v3

An interactive route plotting and animation tool with WCAG 2.2 AAA compliance.

🔗 **[Live Demo on GitHub Pages](https://djdaojones.github.io/router-plotter-02/)**

## 🚀 Features

### Core Functionality

- **Interactive Waypoint System**: Click to add major waypoints, Shift+click for minor waypoints
- **Smooth Path Animation**: Catmull-Rom spline interpolation for natural curves
- **Visual Effects**: Pulse and ripple beacon effects with customizable colors
- **Auto-save**: Automatically preserves your work in localStorage

### Styling & Customization

- 🎨 Line color picker and thickness control
- 📏 Waypoint size adjustment
- ✨ Beacon style selector (None/Pulse/Ripple)
- 🏃 Animation speed control

### Accessibility Features

- **WCAG 2.2 AAA Compliant**: Meets highest accessibility standards
- **Full Keyboard Navigation**: Complete functionality without mouse
- **Screen Reader Support**: ARIA labels and live regions
- **Responsive Design**: Works on all devices

## 🎮 Controls

### Mouse

- **Click**: Add major waypoint
- **Shift+Click**: Add minor waypoint  
- **Drag**: Move waypoints
- **Right-click**: Delete waypoint

### Keyboard

- **Space**: Play/pause animation
- **Arrow Keys**: Nudge selected waypoint
- **Delete**: Remove selected waypoint
- **Escape**: Deselect waypoint

## 📁 Project Structure

```plaintext
/
├── index.html          # Main HTML file
├── src/
│   └── main.js        # Core application logic
├── styles/
│   └── main.css       # Styles with WCAG AAA colors
├── package.json       # Project metadata
└── README.md          # This file
```

## 🌐 Live Demo

Visit the live demo at: [https://djdaojones.github.io/router-plotter-02/](https://djdaojones.github.io/router-plotter-02/)

## 💻 Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/djDAOjones/router-plotter-02.git
cd router-plotter-02

# Start local server
python3 -m http.server 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Alternative Server Options

```bash
# Using Node.js
npx serve .

# Using PHP
php -S localhost:3000
```

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

Joe Bell - University of Nottingham

## 🔗 Links

- **Repository**: [https://github.com/djDAOjones/router-plotter-02](https://github.com/djDAOjones/router-plotter-02)
- **Live Demo**: [https://djdaojones.github.io/router-plotter-02/](https://djdaojones.github.io/router-plotter-02/)
- **Issues**: [https://github.com/djDAOjones/router-plotter-02/issues](https://github.com/djDAOjones/router-plotter-02/issues)
