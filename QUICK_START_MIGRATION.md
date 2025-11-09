# Quick Start: First Migration Step (5 minutes)

This shows you **exactly** how to start the migration right now.

## Step 1: Make index.html Support Modules

Edit `index.html` (around line 400):

```html
<!-- BEFORE -->
<script src="src/main.js"></script>

<!-- AFTER -->
<script type="module" src="src/main.js"></script>
```

Just add `type="module"` - that's it!

## Step 2: Import CatmullRom at Top of main.js

At the very top of `src/main.js`, **before** anything else, add:

```javascript
import { CatmullRom } from './utils/CatmullRom.js';
```

## Step 3: Delete the Inline CatmullRom Class

Delete **lines 1-43** from `main.js` (the entire CatmullRom class definition).

Your file should now start with:

```javascript
import { CatmullRom } from './utils/CatmullRom.js';

// Main application class for Route Plotter v3
class RoutePlotter {
  constructor() {
    // ...
```

## Step 4: Test It!

```bash
python3 -m http.server 3000
```

Open `http://localhost:3000` - it should work **exactly the same** as before.

## What Just Happened?

✅ You replaced 43 lines of inline code with a clean import  
✅ The CatmullRom utility is now in its own testable module  
✅ Your main.js is 43 lines shorter  
✅ Everything still works!

## Next Steps

Once this works, you can continue with:
- Import other utilities (Easing, Constants)
- Add StorageService
- Follow the full [MIGRATION_STEPS.md](./MIGRATION_STEPS.md) guide

## Rollback If Needed

```bash
git checkout src/main.js index.html
```

## Troubleshooting

**Error: "Cannot use import statement outside a module"**
- Solution: Make sure you added `type="module"` to the script tag in index.html

**Error: "Failed to load module"**
- Solution: Check the import path is correct: `./utils/CatmullRom.js` (relative path with `./`)

**Blank page with no errors**
- Solution: Open DevTools Console (F12) to see the actual error message
