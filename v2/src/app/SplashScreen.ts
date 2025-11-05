/**
 * Splash screen with instructions for new users
 */
export class SplashScreen {
  private container: HTMLDivElement;
  private isVisible: boolean = false;

  constructor() {
    this.container = this.createSplashScreen();
    document.body.appendChild(this.container);
  }

  private createSplashScreen(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'splash-screen';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: none;
      z-index: 10000;
      justify-content: center;
      align-items: center;
    `;

    const content = document.createElement('div');
    content.className = 'splash-content';
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <h1 style="color: #FF6B6B; margin-bottom: 20px;">Welcome to Route Plotter v2.0</h1>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #2C3E50; font-size: 18px; margin-bottom: 15px;">Quick Start Guide</h2>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #FF6B6B; font-size: 16px; margin-bottom: 10px;">🖱️ Creating Waypoints</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Click</strong> on the canvas to add a <strong>major waypoint</strong> (larger, filled)</li>
            <li><strong>Shift+Click</strong> to add a <strong>minor waypoint</strong> (smaller, hollow)</li>
            <li><strong>Click & Drag</strong> existing waypoints to reposition them</li>
            <li>At least 2 waypoints needed to create a path</li>
          </ul>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #4ECDC4; font-size: 16px; margin-bottom: 10px;">▶️ Animation Controls</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Space</strong> - Play/Pause animation</li>
            <li><strong>Timeline Slider</strong> - Scrub through animation</li>
            <li><strong>Speed Buttons</strong> - 0.5x / 1x / 2x playback speed</li>
            <li><strong>J / K / L</strong> - Quick speed controls</li>
          </ul>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #45B7D1; font-size: 16px; margin-bottom: 10px;">⚙️ Path Settings</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Timing Mode</strong> - Constant speed or constant time per segment</li>
            <li><strong>Path Style</strong> - Customize color and stroke width</li>
            <li><strong>Pause Mode</strong> - Add pauses at major waypoints</li>
          </ul>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <h3 style="color: #95A5A6; font-size: 16px; margin-bottom: 10px;">💾 Project Management</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Auto-save</strong> - Your work is saved every 10 seconds</li>
            <li><strong>Export Video</strong> - Create WebM video or PNG sequence</li>
            <li><strong>Save/Load</strong> - Export/import projects as ZIP files</li>
          </ul>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>💡 Pro Tip:</strong> Start with major waypoints to define key points of your route, 
            then add minor waypoints for smoother curves between them.
          </p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <button id="splash-close" style="
          background: #FF6B6B;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        ">Get Started</button>
        
        <label style="display: block; margin-top: 15px; color: #7F8C8D;">
          <input type="checkbox" id="splash-dont-show" style="margin-right: 5px;">
          Don't show this again
        </label>
      </div>
    `;

    container.appendChild(content);

    // Event handlers
    const closeBtn = content.querySelector('#splash-close') as HTMLButtonElement;
    const dontShowCheckbox = content.querySelector('#splash-dont-show') as HTMLInputElement;

    closeBtn.addEventListener('click', () => {
      if (dontShowCheckbox.checked) {
        localStorage.setItem('routePlotter_hideSplash', 'true');
      }
      this.hide();
    });

    // Close on backdrop click
    container.addEventListener('click', (e) => {
      if (e.target === container) {
        this.hide();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    return container;
  }

  show(): void {
    this.container.style.display = 'flex';
    this.isVisible = true;
  }

  hide(): void {
    this.container.style.display = 'none';
    this.isVisible = false;
  }

  shouldShowOnStartup(): boolean {
    return localStorage.getItem('routePlotter_hideSplash') !== 'true';
  }
}
