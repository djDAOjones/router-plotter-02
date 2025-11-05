/**
 * Route Plotter v2.0 - Main Application
 */

import './styles/main.css';
import { App } from './app';

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  try {
    const app = new App();
    app.init();
    
    // Make app available globally for debugging
    (window as any).routePlotterApp = app;
    
    console.log('Route Plotter v2.0 initialized');
  } catch (error) {
    console.error('Failed to initialize Route Plotter:', error);
    
    // Show error message to user
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; padding: 20px;">
          <div style="text-align: center; max-width: 600px;">
            <h1 style="color: #D00000;">Failed to Initialize</h1>
            <p style="margin: 20px 0;">Route Plotter could not be initialized. Please refresh the page and try again.</p>
            <p style="color: #666; font-size: 14px;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #0066CC; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
  }
}
