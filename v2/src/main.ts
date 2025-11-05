import './styles/main.css';
import { Application } from './app/Application';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Get canvas element
  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // Create application instance
  const app = new Application(canvas);
  
  // Initialize application
  app.initialize().catch(error => {
    console.error('Failed to initialize application:', error);
  });

  // Make app available globally for debugging
  (window as any).routePlotter = app;
}

// Handle errors globally
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
