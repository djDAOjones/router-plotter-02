// Core Types for Route Plotter v2.0

export interface Point2D {
  x: number;
  y: number;
}

export interface Waypoint extends Point2D {
  id: string;
  isMajor: boolean;
  pauseSeconds?: number;
  label?: string;
}

export interface CameraPoint extends Point2D {
  zoom: number;
  timestamp?: number;
}

export interface Label {
  id: string;
  text: string;
  position: Point2D;
  waypointId?: string;
  anchor: 'auto' | 'N' | 'E' | 'S' | 'W';
  style?: LabelStyle;
}

export interface LabelStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
}

export interface PathStyle {
  strokeColor: string;
  strokeWidth: number;
  strokeVariant: 'solid' | 'dashed' | 'dotted';
  waypointShape: 'circle' | 'square' | 'diamond';
  pathHead: 'arrow' | 'dot' | 'none';
}

export interface TimingConfig {
  mode: 'constantSpeed' | 'constantTime';
  baseSpeedPxPerSec: number;
  pauseMode: 'none' | 'seconds' | 'click';
  pauseSeconds?: number;
  easeInOut: boolean;
}

export interface CatmullRomConfig {
  tension: number;
  alpha: number;
  segments: number;
}

export interface PathTrack {
  id: string;
  type: 'path';
  name: string;
  waypoints: Waypoint[];
  style: PathStyle;
  timing: TimingConfig;
  smoothing?: CatmullRomConfig;
}

export interface CameraTrack {
  id: string;
  type: 'camera';
  name: string;
  waypoints: CameraPoint[];
  safetyMargin: number;
  bounds: ImageBounds;
  zoom: {
    min: number;
    max: number;
  };
}

export interface LabelTrack {
  id: string;
  type: 'labels';
  name: string;
  items: Label[];
  mode: 'showPersist' | 'showHide' | 'showFade';
  anchor: 'auto' | 'N' | 'E' | 'S' | 'W';
}

export interface ImageBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Asset {
  id: string;
  type: 'image' | 'video';
  name: string;
  path: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface ContrastOverlay {
  mode: 'none' | 'darken' | 'lighten';
  value: number; // -1 to 1
}

export interface ExportConfig {
  format: 'webm' | 'png-sequence';
  quality: number;
  overlayAlpha: boolean;
  fps?: number;
  width?: number;
  height?: number;
}

export interface ProjectMeta {
  title: string;
  description: string;
  author: string;
  attribution: string;
  created: string;
  modified: string;
}

export interface Accessibility {
  altText: string;
  reducedMotion: boolean;
  paletteId: string;
}

export interface ProjectSettings {
  fps: number;
  contrastOverlay: ContrastOverlay;
  cameraBounds: ImageBounds;
  safetyMargin: number;
}

export interface Project {
  schemaVersion: number;
  meta: ProjectMeta;
  a11y: Accessibility;
  assets: Asset[];
  settings: ProjectSettings;
  tracks: Array<PathTrack | CameraTrack | LabelTrack>;
  export: ExportConfig;
}

// Runtime Types
export interface AnimationState {
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  normalizedProgress: number; // 0 to 1
  currentStep: number; // 0 to 200
  pathPosition?: Point2D;
  cameraPosition?: CameraPoint;
  visibleLabels: string[];
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelRatio: number;
}

export interface InterpolatedPath {
  points: Point2D[];
  arcLengths: number[];
  totalLength: number;
  majorIndices: number[];
}

// Command Pattern for Undo/Redo
export interface Command {
  id: string;
  timestamp: number;
  execute(): void;
  undo(): void;
  description: string;
}

// Performance Limits
export const LIMITS = {
  pathPoints: 1000,
  majorWaypoints: 100,
  labels: 200,
  hotspots: 50,
  projectDuration: 90,
  exportFrames: 2250,
  pngSequenceFrames: 1500,
  undoStack: 200,
  assetSize: 10 * 1024 * 1024,
  totalAssets: 100 * 1024 * 1024,
} as const;

// Embed API Messages
export interface EmbedCommand {
  action: 'play' | 'pause' | 'seekToStep' | 'setSpeed';
  step?: number;
  speed?: number;
}

export interface EmbedEvent {
  event: 'ready' | 'state' | 'ended';
  data?: {
    step: number;
    playing: boolean;
    speed: number;
  };
}
