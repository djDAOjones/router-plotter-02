/**
 * Type definitions for Route Plotter v2.0
 */

export interface Point {
  x: number;
  y: number;
}

export interface Waypoint extends Point {
  id: string;
  isMajor: boolean;
  label?: string;
  pauseDuration?: number;
}

export interface CameraPoint extends Point {
  zoom: number;
}

export interface Label {
  id: string;
  waypointId: string;
  text: string;
  anchor: 'auto' | 'N' | 'E' | 'S' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';
  visible: boolean;
  offset?: Point;
}

export interface Hotspot {
  id: string;
  waypointId: string;
  shape: 'circle' | 'rect' | 'polygon';
  points: Point[];
  radius?: number;
  color: string;
  pattern?: string;
}

export type PathStyle = 'solid' | 'dashed' | 'dots' | 'squiggle';
export type WaypointShape = 'circle' | 'square' | 'none';
export type PathHead = 'arrow' | 'pulse-dot' | 'none' | 'custom';
export type WaypointAnimation = 'none' | 'sonar' | 'ring';
export type TimingMode = 'constant-time' | 'constant-speed';
export type PauseMode = 'none' | 'seconds' | 'click';
export type LabelMode = 'off' | 'showPersist' | 'showHide' | 'showFade' | 'alwaysOn';

export interface PathStyleConfig {
  strokeColor: string;
  strokeWidth: number;
  strokeVariant: PathStyle;
  waypointShape: WaypointShape;
  pathHead: PathHead;
  waypointAnimation: WaypointAnimation;
  customHeadImage?: string;
  customHeadRotation?: number;
}

export interface TimingConfig {
  mode: TimingMode;
  baseSpeedPxPerSec: number;
  segmentTime: number;
  pauseMode: PauseMode;
  pauseSeconds: number;
  easeInOut: boolean;
}

export interface CatmullRomConfig {
  tension: number;
  alpha: number;
  segments: number;
}

export interface Track {
  id: string;
  type: 'path' | 'camera' | 'labels' | 'hotspots';
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface PathTrack extends Track {
  type: 'path';
  waypoints: Waypoint[];
  style: PathStyleConfig;
  timing: TimingConfig;
  smoothing: CatmullRomConfig;
  maskMode: boolean;
}

export interface CameraTrack extends Track {
  type: 'camera';
  waypoints: CameraPoint[];
  safetyMargin: number;
  bounds: Rectangle;
  zoom: { min: number; max: number };
}

export interface LabelTrack extends Track {
  type: 'labels';
  items: Label[];
  mode: LabelMode;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
}

export interface HotspotTrack extends Track {
  type: 'hotspots';
  items: Hotspot[];
  opacity: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewConfig {
  canvasFit: 'fit' | 'fill' | '1:1';
  aspectRatio: '16:9' | '4:3' | '1:1' | 'native';
  contrastOverlay: number; // -90 to 90
}

export interface ProjectMeta {
  title: string;
  description: string;
  author: string;
  attribution: string;
  created: string;
  modified: string;
}

export interface AccessibilityConfig {
  altText: string;
  reducedMotion: boolean;
  paletteId: string;
}

export interface Asset {
  id: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  path: string;
  data?: string; // Base64 encoded data
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    size: number;
  };
}

export interface ExportSettings {
  format: 'webm' | 'html' | 'png-sequence';
  quality: number;
  overlayAlpha: boolean;
  fps: number;
}

export interface ProjectSettings {
  fps: number;
  contrastOverlay: {
    mode: 'none' | 'black' | 'white';
    value: number;
  };
  cameraBounds: Rectangle;
  safetyMargin: number;
}

export interface Project {
  schemaVersion: number;
  meta: ProjectMeta;
  a11y: AccessibilityConfig;
  assets: Asset[];
  settings: ProjectSettings;
  tracks: (PathTrack | CameraTrack | LabelTrack | HotspotTrack)[];
  export: ExportSettings;
}

export interface AnimationState {
  playing: boolean;
  currentTime: number;
  totalDuration: number;
  currentStep: number;
  totalSteps: number;
  speed: number;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scale: number;
  offset: Point;
}

export interface Command {
  id: string;
  timestamp: number;
  execute(): void;
  undo(): void;
  redo(): void;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    path: string[];
    waypoint: string[];
    label: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  error?: string;
}

// Event Types
export interface AppEvent {
  type: string;
  data?: any;
}

export interface WaypointEvent extends AppEvent {
  type: 'waypoint:add' | 'waypoint:move' | 'waypoint:delete' | 'waypoint:select';
  data: {
    waypoint: Waypoint;
    trackId: string;
  };
}

export interface PlaybackEvent extends AppEvent {
  type: 'playback:play' | 'playback:pause' | 'playback:seek' | 'playback:speed' | 'playback:ended';
  data: AnimationState;
}

export interface ProjectEvent extends AppEvent {
  type: 'project:load' | 'project:save' | 'project:export' | 'project:clear';
  data: Project;
}

// Constants
export const LIMITS = {
  pathPoints: 1000,
  majorWaypoints: 100,
  labels: 200,
  hotspots: 50,
  projectDuration: 90,
  exportFrames: 2250,
  pngSequenceFrames: 1500,
  undoStack: 200,
  assetSize: 10 * 1024 * 1024, // 10MB
  totalAssets: 100 * 1024 * 1024 // 100MB
};

export const DEFAULT_COLORS = {
  path: '#FF6B6B',
  waypoint: '#0066CC',
  label: '#333333',
  hotspot: '#FFB800'
};
