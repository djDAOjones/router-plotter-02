import type { Project, InterpolatedPath } from '../types';
import type { AnimationEngine } from '../engine/timing';
import type { Renderer } from '../engine/renderer';

/**
 * Manages video and image sequence exports
 */
export class ExportManager {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private exportCanvas: HTMLCanvasElement;
  private exportCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, renderer: Renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    
    // Create offscreen canvas for export
    this.exportCanvas = document.createElement('canvas');
    const ctx = this.exportCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create export canvas context');
    }
    this.exportCtx = ctx;
  }

  /**
   * Export video using MediaRecorder API
   */
  async exportVideo(
    project: Project,
    animationEngine: AnimationEngine,
    interpolatedPath: InterpolatedPath | null
  ): Promise<void> {
    if (!interpolatedPath) {
      throw new Error('No path to export');
    }

    const exportConfig = project.export;
    const fps = exportConfig.fps || project.settings.fps;
    const width = exportConfig.width || this.canvas.width;
    const height = exportConfig.height || this.canvas.height;
    
    // Set up export canvas dimensions
    this.exportCanvas.width = width;
    this.exportCanvas.height = height;
    
    // Check for MediaRecorder support
    if (!window.MediaRecorder) {
      console.warn('MediaRecorder not supported, falling back to PNG sequence');
      return this.exportPNGSequence(project, animationEngine, interpolatedPath);
    }
    
    // Create media stream
    const stream = this.exportCanvas.captureStream(fps);
    
    // Configure MediaRecorder
    const options: MediaRecorderOptions = {
      mimeType: 'video/webm',
      videoBitsPerSecond: 5000000, // 5 Mbps
    };
    
    // Check codec support
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      console.warn('WebM not supported, trying fallback');
      options.mimeType = 'video/mp4';
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error('No suitable video format supported');
        return this.exportPNGSequence(project, animationEngine, interpolatedPath);
      }
    }
    
    const recorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: options.mimeType });
      this.downloadBlob(blob, `route-animation-${Date.now()}.webm`);
    };
    
    // Start recording
    recorder.start();
    
    // Render frames
    await this.renderFrames(
      project,
      animationEngine,
      interpolatedPath,
      fps,
      (progress) => {
        // Update progress UI if needed
        console.log(`Export progress: ${Math.round(progress * 100)}%`);
      }
    );
    
    // Stop recording
    recorder.stop();
  }

  /**
   * Export as PNG sequence
   */
  async exportPNGSequence(
    project: Project,
    animationEngine: AnimationEngine,
    interpolatedPath: InterpolatedPath
  ): Promise<void> {
    const exportConfig = project.export;
    const fps = exportConfig.fps || project.settings.fps;
    const width = exportConfig.width || this.canvas.width;
    const height = exportConfig.height || this.canvas.height;
    
    // Set up export canvas dimensions
    this.exportCanvas.width = width;
    this.exportCanvas.height = height;
    
    const frames: Blob[] = [];
    
    // Render frames
    await this.renderFrames(
      project,
      animationEngine,
      interpolatedPath,
      fps,
      (progress, frameData) => {
        if (frameData) {
          frames.push(frameData);
        }
        console.log(`Export progress: ${Math.round(progress * 100)}%`);
      }
    );
    
    // Create ZIP with frames
    if (frames.length > 0) {
      await this.createFrameSequenceZip(frames);
    }
  }

  /**
   * Render all frames for export
   */
  private async renderFrames(
    project: Project,
    animationEngine: AnimationEngine,
    interpolatedPath: InterpolatedPath,
    fps: number,
    onProgress: (progress: number, frameData?: Blob) => void
  ): Promise<void> {
    const duration = animationEngine.getDuration();
    const frameTime = 1000 / fps;
    const totalFrames = Math.ceil(duration / frameTime);
    
    // Limit frame count
    const maxFrames = project.export.format === 'png-sequence' ? 1500 : 2250;
    const framesToRender = Math.min(totalFrames, maxFrames);
    
    for (let frame = 0; frame < framesToRender; frame++) {
      const time = frame * frameTime;
      
      // Seek to frame time
      animationEngine.seek(time);
      animationEngine.updatePathPosition(interpolatedPath);
      
      // Get current state
      const state = animationEngine.getState();
      
      // Clear export canvas
      this.exportCtx.clearRect(0, 0, this.exportCanvas.width, this.exportCanvas.height);
      
      // Copy rendered frame from main canvas
      // In a real implementation, we'd re-render at export resolution
      this.exportCtx.drawImage(
        this.canvas,
        0, 0,
        this.canvas.width, this.canvas.height,
        0, 0,
        this.exportCanvas.width,
        this.exportCanvas.height
      );
      
      // For PNG sequence, capture frame
      if (project.export.format === 'png-sequence') {
        const blob = await this.canvasToBlob(this.exportCanvas);
        onProgress((frame + 1) / framesToRender, blob);
      } else {
        onProgress((frame + 1) / framesToRender);
      }
      
      // Allow UI updates
      await this.sleep(0);
    }
  }

  /**
   * Convert canvas to blob
   */
  private canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  /**
   * Create ZIP file with frame sequence
   */
  private async createFrameSequenceZip(frames: Blob[]): Promise<void> {
    // Dynamic import to avoid loading JSZip unless needed
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Add frames to ZIP
    frames.forEach((frame, index) => {
      const paddedIndex = String(index).padStart(5, '0');
      zip.file(`frame_${paddedIndex}.png`, frame);
    });
    
    // Add info file
    const info = {
      frameCount: frames.length,
      fps: 25,
      format: 'PNG',
      timestamp: new Date().toISOString(),
    };
    zip.file('sequence_info.json', JSON.stringify(info, null, 2));
    
    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(blob, `frame-sequence-${Date.now()}.zip`);
  }

  /**
   * Helper to download a blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Sleep helper for async operations
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export current frame as image
   */
  async exportFrame(): Promise<void> {
    const blob = await this.canvasToBlob(this.canvas);
    this.downloadBlob(blob, `frame-${Date.now()}.png`);
  }

  /**
   * Validate export settings
   */
  validateExport(project: Project): string[] {
    const errors: string[] = [];
    
    // Check for alt text
    if (!project.a11y.altText) {
      errors.push('Alt text is required for accessibility');
    }
    
    // Check for waypoints
    const pathTrack = project.tracks.find(t => t.type === 'path');
    if (!pathTrack || (pathTrack as any).waypoints.length < 2) {
      errors.push('At least 2 waypoints are required');
    }
    
    // Check duration limits
    const duration = 90; // TODO: Calculate actual duration
    if (duration > 90) {
      errors.push('Animation duration exceeds 90 second limit');
    }
    
    return errors;
  }
}
