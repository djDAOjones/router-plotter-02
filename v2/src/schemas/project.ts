import { z } from 'zod';

// Point schemas
export const Point2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Waypoint schema
export const WaypointSchema = Point2DSchema.extend({
  id: z.string(),
  isMajor: z.boolean(),
  pauseSeconds: z.number().optional(),
  label: z.string().optional(),
});

// Camera point schema
export const CameraPointSchema = Point2DSchema.extend({
  zoom: z.number().min(0.1).max(10),
  timestamp: z.number().optional(),
});

// Label schemas
export const LabelStyleSchema = z.object({
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  padding: z.number().optional(),
  borderRadius: z.number().optional(),
});

export const LabelSchema = z.object({
  id: z.string(),
  text: z.string(),
  position: Point2DSchema,
  waypointId: z.string().optional(),
  anchor: z.enum(['auto', 'N', 'E', 'S', 'W']),
  style: LabelStyleSchema.optional(),
});

// Style schemas
export const PathStyleSchema = z.object({
  strokeColor: z.string(),
  strokeWidth: z.number().min(1).max(20),
  strokeVariant: z.enum(['solid', 'dashed', 'dotted']),
  waypointShape: z.enum(['circle', 'square', 'diamond']),
  pathHead: z.enum(['arrow', 'dot', 'none']),
});

// Timing schema
export const TimingConfigSchema = z.object({
  mode: z.enum(['constantSpeed', 'constantTime']),
  baseSpeedPxPerSec: z.number().min(10).max(1000),
  pauseMode: z.enum(['none', 'seconds', 'click']),
  pauseSeconds: z.number().optional(),
  easeInOut: z.boolean(),
});

// Smoothing schema
export const CatmullRomConfigSchema = z.object({
  tension: z.number().min(0).max(1),
  alpha: z.number().min(0).max(1),
  segments: z.number().min(10).max(100),
});

// Track schemas
export const PathTrackSchema = z.object({
  id: z.string(),
  type: z.literal('path'),
  name: z.string(),
  style: PathStyleSchema,
  timing: TimingConfigSchema,
  smoothing: CatmullRomConfigSchema.optional(),
  waypoints: z.array(WaypointSchema),
});

export const CameraTrackSchema = z.object({
  id: z.string(),
  type: z.literal('camera'),
  name: z.string(),
  waypoints: z.array(CameraPointSchema),
  safetyMargin: z.number().min(0).max(200),
  bounds: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  zoom: z.object({
    min: z.number().min(0.1).max(1),
    max: z.number().min(1).max(10),
  }),
});

export const LabelTrackSchema = z.object({
  id: z.string(),
  type: z.literal('labels'),
  name: z.string(),
  items: z.array(LabelSchema),
  mode: z.enum(['showPersist', 'showHide', 'showFade']),
  anchor: z.enum(['auto', 'N', 'E', 'S', 'W']),
});

// Asset schema
export const AssetSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'video']),
  name: z.string(),
  path: z.string(),
  metadata: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
      duration: z.number().optional(),
    })
    .optional(),
});

// Settings schemas
export const ContrastOverlaySchema = z.object({
  mode: z.enum(['none', 'darken', 'lighten']),
  value: z.number().min(-1).max(1),
});

export const ProjectSettingsSchema = z.object({
  fps: z.number().min(10).max(60),
  contrastOverlay: ContrastOverlaySchema,
  cameraBounds: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  safetyMargin: z.number().min(0).max(200),
});

// Meta schema
export const ProjectMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string(),
  attribution: z.string(),
  created: z.string().datetime(),
  modified: z.string().datetime(),
});

// Accessibility schema
export const AccessibilitySchema = z.object({
  altText: z.string().min(1, 'Alt text is required'),
  reducedMotion: z.boolean(),
  paletteId: z.string(),
});

// Export schema
export const ExportConfigSchema = z.object({
  format: z.enum(['webm', 'png-sequence']),
  quality: z.number().min(0).max(1),
  overlayAlpha: z.boolean(),
  fps: z.number().min(10).max(60).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

// Main project schema
export const ProjectSchema = z.object({
  schemaVersion: z.number(),
  meta: ProjectMetaSchema,
  a11y: AccessibilitySchema,
  assets: z.array(AssetSchema),
  settings: ProjectSettingsSchema,
  tracks: z.array(
    z.discriminatedUnion('type', [
      PathTrackSchema,
      CameraTrackSchema,
      LabelTrackSchema,
    ])
  ),
  export: ExportConfigSchema,
});

// Type inference
export type ValidatedProject = z.infer<typeof ProjectSchema>;

// Validation helper
export function validateProject(data: unknown): ValidatedProject {
  return ProjectSchema.parse(data);
}

// Migration helper for schema versioning
export function migrateProject(data: any): ValidatedProject {
  const version = data.schemaVersion || 0;
  
  // Migration logic for different schema versions
  if (version < 1) {
    // Apply v0 to v1 migrations
    data.schemaVersion = 1;
    // Add any missing required fields with defaults
    data.a11y = data.a11y || {
      altText: '',
      reducedMotion: false,
      paletteId: 'default',
    };
  }
  
  // Future migrations would go here
  // if (version < 2) { ... }
  
  return validateProject(data);
}
