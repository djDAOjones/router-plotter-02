#!/usr/bin/env node

/**
 * Build script for Route Plotter v3
 * Uses esbuild for fast, efficient bundling
 */

import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Ensure dist directory exists
const distDir = './dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files
const staticFiles = [
  'index.html',
  'styles/main.css',
  'UoN_map.png',
  'UoN_map 24-bit.png'
];

staticFiles.forEach(file => {
  const src = path.join('.', file);
  const dest = path.join(distDir, file);
  
  // Create directory if needed
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy file
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
});

// Build options
const buildOptions = {
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  outfile: 'dist/app.js',
  format: 'esm',
  target: ['es2020', 'chrome58', 'firefox57', 'safari11'],
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file'
  },
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`
  }
};

// Development mode with watch
if (process.argv.includes('--watch')) {
  console.log('Starting development build with watch mode...');
  
  const ctx = await esbuild.context({
    ...buildOptions,
    minify: false,
    banner: {
      js: '// Route Plotter v3 - Development Build\n'
    }
  });
  
  // Watch for changes
  await ctx.watch();
  console.log('Watching for changes...');
  
  // Serve on port 3000 if --serve flag is present
  if (process.argv.includes('--serve')) {
    const { host, port } = await ctx.serve({
      servedir: 'dist',
      port: 3000,
      host: 'localhost'
    });
    console.log(`Serving at http://${host}:${port}`);
  }
}
// Production build
else {
  console.log('Building for production...');
  
  try {
    const result = await esbuild.build({
      ...buildOptions,
      minify: true,
      banner: {
        js: '// Route Plotter v3 - Production Build\n// Built: ' + new Date().toISOString() + '\n'
      },
      metafile: true
    });
    
    // Write build metadata
    fs.writeFileSync(
      'dist/meta.json',
      JSON.stringify(result.metafile, null, 2)
    );
    
    // Calculate bundle size
    const stats = fs.statSync('dist/app.js');
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`✅ Build complete!`);
    console.log(`   Bundle size: ${sizeKB} KB`);
    console.log(`   Output: dist/app.js`);
    
    // Analyze bundle if --analyze flag is present
    if (process.argv.includes('--analyze')) {
      console.log('\nBundle analysis:');
      const meta = result.metafile;
      const inputs = Object.entries(meta.inputs)
        .sort((a, b) => b[1].bytes - a[1].bytes)
        .slice(0, 10);
      
      inputs.forEach(([file, data]) => {
        const sizeKB = (data.bytes / 1024).toFixed(2);
        console.log(`  ${file}: ${sizeKB} KB`);
      });
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}
