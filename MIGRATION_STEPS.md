# Gradual Migration Guide

This guide shows how to **incrementally** migrate from the monolithic `main.js` to the modular architecture without breaking your working application.

## 🎯 Migration Philosophy

**Don't rewrite everything at once!** Instead, gradually introduce the new modules into the existing codebase, replacing sections one at a time.

---

## Phase 1: Replace Inline Utilities (1-2 hours)

### Step 1.1: Import and Use CatmullRom Module

**Current state** (lines 1-43 in main.js):
```javascript
// Catmull-Rom spline implementation with tension control
class CatmullRom {
  // ... 40+ lines of code
}
```

**Migration:**

Add this import at the **top** of `main.js`:
```javascript
import { CatmullRom } from './utils/CatmullRom.js';
```

Then **delete lines 1-43** (the inline CatmullRom class).

**Testing:** Your application should work exactly the same. The imported module is identical to the inline version.

---

### Step 1.2: Import and Use Easing Functions

**Current state** (somewhere in main.js):
```javascript
// Easing functions inline
const easing = {
  linear: t => t,
  easeInQuad: t => t * t,
  // etc...
};
```

**Migration:**

Replace with:
```javascript
import { Easing } from './utils/Easing.js';

// Then use as:
// Easing.linear(t)
// Easing.easeInQuad(t)
```

---

### Step 1.3: Import Constants

**Migration:**

Add at top of `main.js`:
```javascript
import { RENDERING, ANIMATION, INTERACTION } from './config/constants.js';
```

Then replace magic numbers with constants:
```javascript
// Before:
const defaultDotSize = 8;
const minorDotSize = 4;

// After:
const defaultDotSize = RENDERING.DEFAULT_DOT_SIZE;
const minorDotSize = RENDERING.MINOR_DOT_SIZE;
```

**Commit after Phase 1:** "refactor: Extract utilities to modules"

---

## Phase 2: Replace Storage Logic (2-3 hours)

### Step 2.1: Use StorageService

**Current state** (in RoutePlotter constructor):
```javascript
constructor() {
  // ... other setup ...
  
  // Load saved state inline
  const saved = localStorage.getItem('routePlotter-autosave');
  if (saved) {
    const data = JSON.parse(saved);
    this.waypoints = data.waypoints || [];
  }
}
```

**Migration:**

```javascript
import { StorageService } from './services/StorageService.js';

constructor() {
  // Add service
  this.storage = new StorageService();
  
  // Replace inline storage
  this.loadSavedState();
}

loadSavedState() {
  const saved = this.storage.loadAutoSave();
  if (saved && saved.waypoints) {
    this.waypoints = saved.waypoints;
    this.calculatePath();
  }
}

autoSave() {
  const state = {
    waypoints: this.waypoints,
    styles: this.currentStyles,
    settings: this.getSettings()
  };
  this.storage.autoSave(state);
}
```

**Find and replace** all `localStorage.setItem` and `localStorage.getItem` calls with `this.storage.save()` and `this.storage.load()`.

**Commit:** "refactor: Replace localStorage with StorageService"

---

## Phase 3: Extract Coordinate Transforms (2-3 hours)

### Step 3.1: Use CoordinateTransform Service

**Current state** (methods scattered in RoutePlotter):
```javascript
canvasToImage(canvasX, canvasY) {
  // Complex transformation logic
  // 20+ lines...
}

imageToCanvas(imgX, imgY) {
  // More complex logic
  // 20+ lines...
}
```

**Migration:**

```javascript
import { CoordinateTransform } from './services/CoordinateTransform.js';

constructor() {
  this.coordinateTransform = new CoordinateTransform();
  // ... rest of setup
}

resizeCanvas() {
  // ... existing resize logic ...
  
  // Update coordinate transform
  this.coordinateTransform.setCanvasDimensions(
    this.canvas.width,
    this.canvas.height
  );
  
  if (this.backgroundImage) {
    this.coordinateTransform.setImageDimensions(
      this.backgroundImage.width,
      this.backgroundImage.height,
      this.imageFitMode
    );
  }
}

// Replace old methods:
canvasToImage(canvasX, canvasY) {
  return this.coordinateTransform.canvasToImage(canvasX, canvasY);
}

imageToCanvas(imgX, imgY) {
  return this.coordinateTransform.imageToCanvas(imgX, imgY);
}
```

**Commit:** "refactor: Extract coordinate transforms to service"

---

## Phase 4: Adopt PathCalculator (3-4 hours)

### Step 4.1: Use PathCalculator Service

**Current state** (calculatePath method in RoutePlotter):
```javascript
calculatePath() {
  // 100+ lines of complex path calculation
}
```

**Migration:**

```javascript
import { PathCalculator } from './services/PathCalculator.js';

constructor() {
  this.pathCalculator = new PathCalculator();
  // ... rest
}

calculatePath() {
  if (this.waypoints.length < 2) {
    this.pathPoints = [];
    return;
  }
  
  // Convert waypoints to format expected by PathCalculator
  const canvasWaypoints = this.waypoints.map(wp => {
    const pos = this.imageToCanvas(wp.imgX, wp.imgY);
    return {
      x: pos.x,
      y: pos.y,
      isMajor: wp.isMajor,
      pathShape: wp.pathShape,
      segmentTension: wp.segmentTension
    };
  });
  
  // Use service
  this.pathPoints = this.pathCalculator.calculatePath(canvasWaypoints);
  
  // Update animation duration if needed
  if (this.animationState.mode === 'constant-speed') {
    const pathLength = this.pathCalculator.calculatePathLength(this.pathPoints);
    this.animationState.duration = (pathLength / this.animationState.speed) * 1000;
  }
}
```

**Commit:** "refactor: Replace path calculation with PathCalculator service"

---

## Phase 5: Introduce EventBus (3-4 hours)

### Step 5.1: Add EventBus for Decoupling

**Migration:**

```javascript
import { EventBus } from './core/EventBus.js';

constructor() {
  this.eventBus = new EventBus();
  this.setupEventListeners();
  // ... rest
}

setupEventListeners() {
  // Emit events when things change
  this.eventBus.on('waypoint:add', (waypoint) => {
    this.calculatePath();
    this.autoSave();
    this.render();
  });
  
  this.eventBus.on('waypoint:update', (waypoint) => {
    this.calculatePath();
    this.autoSave();
    this.render();
  });
  
  this.eventBus.on('path:calculated', () => {
    this.render();
  });
}

// Replace direct method calls with events:
addWaypoint(canvasX, canvasY, isMajor = true) {
  const waypoint = /* ... create waypoint ... */;
  this.waypoints.push(waypoint);
  
  // Emit event instead of calling methods directly
  this.eventBus.emit('waypoint:add', waypoint);
}
```

**Commit:** "refactor: Introduce EventBus for component communication"

---

## Phase 6: Extract Waypoint Model (2-3 hours)

### Step 6.1: Use Waypoint Class

**Current state** (waypoints as plain objects):
```javascript
this.waypoints = [
  { imgX: 0.5, imgY: 0.5, isMajor: true, dotColor: '#3b82f6', ... }
];
```

**Migration:**

```javascript
import { Waypoint } from './models/Waypoint.js';

// When adding waypoints:
addWaypoint(canvasX, canvasY, isMajor = true) {
  const imgPos = this.canvasToImage(canvasX, canvasY);
  
  const waypoint = isMajor ?
    Waypoint.createMajor(imgPos.x, imgPos.y) :
    Waypoint.createMinor(imgPos.x, imgPos.y);
  
  // Inherit properties from previous waypoint
  if (this.waypoints.length > 0) {
    const prev = this.waypoints[this.waypoints.length - 1];
    waypoint.segmentColor = prev.segmentColor;
    waypoint.segmentWidth = prev.segmentWidth;
  }
  
  this.waypoints.push(waypoint);
  this.eventBus.emit('waypoint:add', waypoint);
}

// When loading from storage:
loadSavedState() {
  const saved = this.storage.loadAutoSave();
  if (saved && saved.waypoints) {
    // Convert plain objects to Waypoint instances
    this.waypoints = saved.waypoints.map(data => Waypoint.fromJSON(data));
    this.calculatePath();
  }
}

// When saving:
autoSave() {
  const state = {
    waypoints: this.waypoints.map(wp => wp.toJSON()),
    // ... other state
  };
  this.storage.autoSave(state);
}
```

**Commit:** "refactor: Use Waypoint model for waypoint data"

---

## Phase 7: Extract Animation Engine (4-5 hours)

### Step 7.1: Use AnimationEngine

**Current state** (startRenderLoop method):
```javascript
startRenderLoop() {
  const loop = (currentTime) => {
    requestAnimationFrame(loop);
    // 50+ lines of animation logic
  };
  requestAnimationFrame(loop);
}
```

**Migration:**

```javascript
import { AnimationEngine } from './services/AnimationEngine.js';
import { AnimationState } from './models/AnimationState.js';

constructor() {
  this.animationEngine = new AnimationEngine(this.eventBus);
  
  // Set up waypoint check callback
  this.animationEngine.setWaypointCheckCallback((progress) => {
    this.checkForWaypointWait(progress);
  });
  
  // ... rest
}

init() {
  // ... existing init code ...
  
  // Start animation engine instead of custom loop
  this.animationEngine.start(() => {
    this.render();
  });
}

// Animation control methods become simpler:
play() {
  this.animationEngine.play();
}

pause() {
  this.animationEngine.pause();
}

seekToProgress(progress) {
  this.animationEngine.seekToProgress(progress);
}

// In render method:
render() {
  // Get progress from engine
  const progress = this.animationEngine.getProgress();
  
  // Rest of rendering logic...
}
```

**Commit:** "refactor: Replace animation loop with AnimationEngine"

---

## Testing Strategy

### After Each Phase:

1. **Run the application**
   ```bash
   python3 -m http.server 3000
   # Open http://localhost:3000
   ```

2. **Test core features:**
   - ✅ Add waypoints (click, shift+click)
   - ✅ Drag waypoints
   - ✅ Play/pause animation
   - ✅ Auto-save works
   - ✅ Reload page preserves state

3. **Check console for errors**

4. **Commit if tests pass**

---

## Comparison Testing

Run both versions side-by-side:

```bash
# Terminal 1: Serve both files
python3 -m http.server 3000

# Browser Tab 1: Original
http://localhost:3000/index.html

# Browser Tab 2: Refactored
http://localhost:3000/index-refactored.html
```

Compare behavior to ensure feature parity.

---

## Converting main.js to Use Modules

Update `index.html` to support ES6 modules:

```html
<!-- Before -->
<script src="src/main.js"></script>

<!-- After -->
<script type="module" src="src/main.js"></script>
```

---

## Timeline Estimate

| Phase | Time | Risk Level | Impact |
|-------|------|------------|--------|
| 1. Utilities | 1-2h | Low | Low |
| 2. Storage | 2-3h | Low | Medium |
| 3. Coordinates | 2-3h | Medium | Medium |
| 4. Path Calculator | 3-4h | Medium | High |
| 5. EventBus | 3-4h | Medium | High |
| 6. Waypoint Model | 2-3h | Low | Medium |
| 7. Animation Engine | 4-5h | High | High |
| **Total** | **17-24h** | - | - |

---

## Rollback Strategy

If something breaks:

```bash
# Rollback to previous commit
git log --oneline  # Find commit hash
git checkout <commit-hash> -- src/main.js

# Or use branches
git checkout -b refactor-phase-1
# Make changes, test
git checkout main  # Go back if needed
```

---

## When to Stop Gradual Migration

You can stop at any phase! Each phase provides benefits:

- **After Phase 2**: Better organization, easier testing of storage
- **After Phase 4**: Path calculation is isolated and testable
- **After Phase 7**: Full benefits of modular architecture

---

## Final Step: Switch to main-refactored.js

Once comfortable, update `index.html`:

```html
<!-- Use the fully refactored version -->
<script type="module" src="src/main-refactored.js"></script>
```

Then gradually migrate custom features from `main.js` to appropriate modules.

---

## Need Help?

If migration gets stuck:
1. Commit current progress
2. Run both versions side-by-side
3. Use browser DevTools to compare behavior
4. Check console for import/export errors

The key is **incremental progress** - each phase adds value without requiring a complete rewrite!
