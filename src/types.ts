/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ToolType =
  | 'select'
  | 'brush'
  | 'eraser'
  | 'shape'
  | 'text'
  | 'paintbucket'
  | 'eyedropper'
  | 'crop'
  | 'clone'
  | 'gradient'
  | 'blur-brush'
  | 'sharpen-brush'
  | 'dodge'
  | 'burn'
  | 'smudge'
  | 'magic-wand'
  | 'pen'
  | 'rect-select'
  | 'ellipse-select'
  | 'magnetic-lasso'
  | 'magic-heal'
  | 'path-select'
  | 'hand'
  | 'zoom';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'triangle' | 'polygon';

export type GradientType = 'linear' | 'radial';

export type TonalRange = 'shadows' | 'midtones' | 'highlights';

export type ToneCurve = 'linear' | 'slight-s' | 'medium-s' | 'strong-s' | 'fade';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type LayerType = 'image' | 'paint' | 'text' | 'shape' | 'adjustment';

export type AdjustmentKind =
  | 'brightness-contrast'
  | 'hue-saturation'
  | 'color-balance'
  | 'black-white'
  | 'photo-filter'
  | 'full';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 100
  blendMode: BlendMode;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees

  // Layer specific contents
  imageUrl?: string; // For images
  paintDataUrl?: string; // For paint/eraser drawings (base64 string)
  paintNativeWidth?: number; // Original pixel width of paint data (for non-destructive resizing)
  paintNativeHeight?: number; // Original pixel height of paint data (for non-destructive resizing)
  text?: string; // For text layers
  fontSize?: number; // Size in pixels
  fontFamily?: string;
  fontWeight?: string;
  fillColor?: string; // Fill color (for shapes and texts)
  strokeColor?: string; // Stroke color (for shapes)
  strokeWidth?: number; // Stroke width in px (for shapes)
  shapeType?: ShapeType; // For shapes

  // Adjustment Layer specific contents
  adjustmentKind?: AdjustmentKind;
  adjustmentParams?: Adjustments;

  // Layer mask specific contents
  hasMask?: boolean;
  maskEnabled?: boolean;
  maskLinked?: boolean;
  maskDataUrl?: string;

  // Clipping mask
  clippingMask?: boolean;
}

export interface Adjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  exposure: number; // -100 to 100
  hueRotate: number; // 0 to 360
  grayscale: number; // 0 to 100
  invert: number; // 0 to 100
  blur: number; // 0 to 50
  sepia: number; // 0 to 100
  noise: number; // 0 to 100
  vignette: number; // 0 to 100
  sharpen: number; // 0 to 100
  // Color Grading
  temperature: number; // -100 to 100 (cool to warm)
  tint: number; // -100 to 100 (green to magenta)
  vibrance: number; // -100 to 100
  shadowsColor: string; // hex tint for shadows
  midtonesColor: string; // hex tint for midtones
  highlightsColor: string; // hex tint for highlights
  shadowsIntensity: number; // 0 to 100
  midtonesIntensity: number; // 0 to 100
  highlightsIntensity: number; // 0 to 100
  toneCurve: ToneCurve;
  splitToneBalance: number; // -100 to 100 (shadow vs highlight bias)
}

export interface HistoryState {
  layers: Layer[];
  selectedLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  adjustments: Adjustments;
  selection: DocumentSelection | null;
  label: string; // Description of change (e.g. "Apply Brush", "Resize Canvas")
}

export interface ProjectTemplate {
  name: string;
  width: number;
  height: number;
  category: 'Social' | 'Print' | 'Screen' | 'Photo';
  icon: string;
}

export interface CloneSource {
  layerId: string;
  x: number;
  y: number;
}

export interface PenPoint {
  x: number;
  y: number;
  cp1x?: number; // control point 1
  cp1y?: number;
  cp2x?: number; // control point 2
  cp2y?: number;
}

export type SelectionShape = 'rect' | 'ellipse' | 'polygon' | 'wand' | 'none';

export interface DocumentSelection {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  shape: SelectionShape;
  bounds: { x: number; y: number; w: number; h: number } | null;
  hasSelection: boolean;
  polygonPoints?: { x: number; y: number }[];
}

export interface CursorPosition {
  x: number;
  y: number;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  hueRotate: 0,
  grayscale: 0,
  invert: 0,
  blur: 0,
  sepia: 0,
  noise: 0,
  vignette: 0,
  sharpen: 0,
  // Color Grading defaults
  temperature: 0,
  tint: 0,
  vibrance: 0,
  shadowsColor: '#0044ff',
  midtonesColor: '#888888',
  highlightsColor: '#ffffaa',
  shadowsIntensity: 0,
  midtonesIntensity: 0,
  highlightsIntensity: 0,
  toneCurve: 'linear',
  splitToneBalance: 0,
};

export const BLEND_MODES: { label: string; value: BlendMode }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
  { label: 'Hue', value: 'hue' },
  { label: 'Saturation', value: 'saturation' },
  { label: 'Color', value: 'color' },
  { label: 'Luminosity', value: 'luminosity' },
];

export const SHAPE_TYPES: { label: string; value: ShapeType }[] = [
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Circle', value: 'circle' },
  { label: 'Line', value: 'line' },
  { label: 'Triangle', value: 'triangle' },
  { label: 'Polygon', value: 'polygon' },
];

export const FONTS = [
  'Inter',
  'system-ui',
  'Playfair Display',
  'Georgia',
  'Courier New',
  'Helvetica',
  'Arial',
  'Impact',
  'Times New Roman',
  'Space Grotesk',
  'JetBrains Mono',
];

export const TEMPLATES: ProjectTemplate[] = [
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'Social', icon: 'Instagram' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'Social', icon: 'Instagram' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Social', icon: 'Youtube' },
  { name: 'Facebook Cover', width: 851, height: 315, category: 'Social', icon: 'Facebook' },
  { name: 'Twitter/X Header', width: 1500, height: 500, category: 'Social', icon: 'Twitter' },
  { name: 'A4 Document', width: 2480, height: 3508, category: 'Print', icon: 'FileText' },
  { name: 'Business Card', width: 1050, height: 600, category: 'Print', icon: 'CreditCard' },
  { name: 'Poster 24x36', width: 2400, height: 3600, category: 'Print', icon: 'FileText' },
  { name: 'Full HD Monitor', width: 1920, height: 1080, category: 'Screen', icon: 'Tv' },
  { name: '4K UHD', width: 3840, height: 2160, category: 'Screen', icon: 'Tv' },
  { name: 'MacBook Pro 14"', width: 1512, height: 982, category: 'Screen', icon: 'Laptop' },
  { name: 'iPhone 15 Pro', width: 1179, height: 2556, category: 'Screen', icon: 'Smartphone' },
  { name: 'Classic Photo 4x6', width: 1800, height: 1200, category: 'Photo', icon: 'Image' },
  { name: 'Square Fine Art', width: 2400, height: 2400, category: 'Photo', icon: 'Image' },
  { name: 'Panoramic 3:1', width: 3600, height: 1200, category: 'Photo', icon: 'Image' },
];

// Tool grouping for toolbar flyouts
export interface ToolGroup {
  id: string;
  label: string;
  tools: { id: ToolType; label: string; shortcut: string }[];
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'move-group',
    label: 'Move & Path',
    tools: [
      { id: 'select', label: 'Move & Select', shortcut: 'V' },
      { id: 'path-select', label: 'Path Selection', shortcut: 'A' },
    ],
  },
  {
    id: 'marquee-group',
    label: 'Marquee Select',
    tools: [
      { id: 'rect-select', label: 'Rectangle Select', shortcut: 'M' },
      { id: 'ellipse-select', label: 'Ellipse Select', shortcut: 'Shift+M' },
    ],
  },
  {
    id: 'lasso-group',
    label: 'Lasso & Magic',
    tools: [
      { id: 'magnetic-lasso', label: 'Magnetic Lasso', shortcut: 'L' },
      { id: 'magic-wand', label: 'Magic Wand', shortcut: 'W' },
    ],
  },
  {
    id: 'paint-group',
    label: 'Painting',
    tools: [
      { id: 'brush', label: 'Brush Tool', shortcut: 'B' },
      { id: 'clone', label: 'Clone Stamp', shortcut: 'S' },
      { id: 'magic-heal', label: 'Magical Spot Heal', shortcut: 'H' },
      { id: 'smudge', label: 'Smudge Tool', shortcut: 'R' },
    ],
  },
  {
    id: 'eraser-group',
    label: 'Erasers',
    tools: [
      { id: 'eraser', label: 'Eraser Tool', shortcut: 'E' },
    ],
  },
  {
    id: 'retouch-group',
    label: 'Retouch',
    tools: [
      { id: 'blur-brush', label: 'Blur Brush', shortcut: 'Shift+B' },
      { id: 'sharpen-brush', label: 'Sharpen Brush', shortcut: 'Shift+S' },
      { id: 'dodge', label: 'Dodge (Lighten)', shortcut: 'O' },
      { id: 'burn', label: 'Burn (Darken)', shortcut: 'Shift+O' },
    ],
  },
  {
    id: 'shape-group',
    label: 'Shapes',
    tools: [
      { id: 'shape', label: 'Shape Tool', shortcut: 'U' },
      { id: 'pen', label: 'Pen Tool', shortcut: 'P' },
    ],
  },
  {
    id: 'fill-group',
    label: 'Fill',
    tools: [
      { id: 'gradient', label: 'Gradient Tool', shortcut: 'G' },
      { id: 'paintbucket', label: 'Paint Bucket', shortcut: 'Shift+G' },
    ],
  },
  {
    id: 'text-group',
    label: 'Text',
    tools: [{ id: 'text', label: 'Text Tool', shortcut: 'T' }],
  },
  {
    id: 'sample-group',
    label: 'Sampling',
    tools: [{ id: 'eyedropper', label: 'Eyedropper', shortcut: 'I' }],
  },
  {
    id: 'crop-group',
    label: 'Crop',
    tools: [{ id: 'crop', label: 'Crop / Resize', shortcut: 'C' }],
  },
  {
    id: 'navigation-group',
    label: 'Navigation',
    tools: [
      { id: 'hand', label: 'Hand Tool (Pan)', shortcut: 'Space' },
      { id: 'zoom', label: 'Zoom Tool', shortcut: 'Z' },
    ],
  },
];

// Color swatches for the color picker
export const COLOR_SWATCHES = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF4444', '#FF8800', '#FFAA00', '#FFCC00', '#FFFF00',
  '#88FF00', '#00FF00', '#00FF88', '#00FFFF', '#0088FF', '#0000FF',
  '#4400FF', '#8800FF', '#CC00FF', '#FF00FF', '#FF0088', '#FF0044',
  '#8B4513', '#D2691E', '#F4A460', '#DEB887', '#FFDEAD', '#FFE4C4',
];
