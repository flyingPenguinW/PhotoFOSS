/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn, ZoomOut, Maximize2, Download, Upload, Info,
  Copy, CopyPlus, Trash2, FlipHorizontal, FlipVertical,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  Layers, Minimize2, MousePointer, Square, Plus,
  Image as ImageIcon
} from 'lucide-react';
import { Layer, ToolType, ShapeType, GradientType, Adjustments, CursorPosition, CloneSource, DocumentSelection } from '../types';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
import { emptySelection, cloneSelection, computeBounds, selectionAlpha } from '../lib/selection/selectionTypes';
import { rasterizeRect, rasterizeEllipse, rasterizePolygon } from '../lib/selection/rasterize';
import { combineAdd, combineSubtract, combineIntersect } from '../lib/selection/combine';
import { floodFillMask } from '../lib/selection/magicWand';
import { featherMask } from '../lib/selection/feather';
import { drawLayerWithMask, compositeLayerStack } from '../lib/layer/compositeLayer';
import { adjustmentsToFilterCSS } from '../lib/adjustments/adjustmentsToFilterCSS';

interface CanvasAreaProps {
  canvasWidth: number;
  canvasHeight: number;
  layers: Layer[];
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  activeTool: ToolType;
  primaryColor: string;
  secondaryColor: string;
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;
  activeShapeType: ShapeType;
  shapeStrokeWidth: number;
  textValue: string;
  textFontSize: number;
  textFontFamily: string;
  textFontWeight: string;
  adjustments: Adjustments;
  antiAliasing: boolean;
  featherRadius: number;
  gradientType: GradientType;
  blurSharpenStrength: number;
  dodgeBurnExposure: number;
  onCommitPaint: (layerId: string, dataUrl: string, nativeW?: number, nativeH?: number) => void;
  onUpdateLayerProperty: (id: string, prop: keyof Layer, value: any) => void;
  onUpdateLayerProperties?: (id: string, updates: Partial<Layer>) => void;
  onCommitTransform?: (id: string, updates: Partial<Layer>, label?: string) => void;
  onAddTextLayerAt: (x: number, y: number) => void;
  onAddShapeLayerAt: (x: number, y: number, w: number, h: number) => void;
  onExportPng: () => void;
  onExportJpg: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectColorFromEyedropper: (hexColor: string) => void;
  onCursorMove: (pos: CursorPosition) => void;
  onZoomChange: (zoom: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  panX: number;
  setPanX: (x: number) => void;
  panY: number;
  setPanY: (y: number) => void;
  // New operations for context menu
  onDeleteLayer?: () => void;
  onDuplicateLayer?: () => void;
  onAddPaintLayer?: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onAlignLayer?: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onFlattenImage?: () => void;
  onMergeVisible?: () => void;
  // New tool props
  quickMaskActive: boolean;
  showGrid: boolean;
  showRulers: boolean;
  zoomDirection: 'in' | 'out';
  setZoomDirection: (d: 'in' | 'out') => void;
  selectionRect: { startX: number; startY: number; currentX: number; currentY: number; active: boolean; shape: 'rectangle' | 'ellipse' } | null;
  setSelectionRect: (r: any) => void;
  lassoPoints: { x: number; y: number }[];
  setLassoPoints: (pts: any) => void;
  vectorPath: any[];
  setVectorPath: (pts: any) => void;
  selection: DocumentSelection | null;
  setSelection: (sel: DocumentSelection | null) => void;
  onSelectionChange: (sel: DocumentSelection | null, label?: string) => void;
  wandTolerance: number;
  wandContiguous: boolean;
  editTarget: 'layer' | 'mask';
  onCommitMask: (layerId: string, dataUrl: string) => void;
}

// Helper to restrict canvas drawing to active selection mask
export function applySelectionClip(
  ctx: CanvasRenderingContext2D,
  selection: DocumentSelection | null,
  layer: { x: number; y: number }
) {
  if (!selection || !selection.hasSelection || !selection.bounds) return;

  ctx.beginPath();
  const lx = selection.bounds.x - layer.x;
  const ly = selection.bounds.y - layer.y;
  const lw = selection.bounds.w;
  const lh = selection.bounds.h;

  if (selection.shape === 'rect') {
    ctx.rect(lx, ly, lw, lh);
    ctx.clip();
  } else if (selection.shape === 'ellipse') {
    const cx = lx + lw / 2;
    const cy = ly + lh / 2;
    ctx.ellipse(cx, cy, lw / 2, lh / 2, 0, 0, 2 * Math.PI);
    ctx.clip();
  } else if (selection.shape === 'polygon' && selection.polygonPoints) {
    const pts = selection.polygonPoints;
    if (pts.length > 0) {
      ctx.moveTo(pts[0].x - layer.x, pts[0].y - layer.y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x - layer.x, pts[i].y - layer.y);
      }
      ctx.closePath();
      ctx.clip();
    }
  } else {
    // Fallback/Wand: clip to bounding box
    ctx.rect(lx, ly, lw, lh);
    ctx.clip();
  }
}

export default function CanvasArea({
  canvasWidth, canvasHeight, layers, selectedLayerId, setSelectedLayerId,
  activeTool, primaryColor, secondaryColor, brushSize, brushOpacity, brushHardness,
  activeShapeType, shapeStrokeWidth, textValue, textFontSize, textFontFamily, textFontWeight,
  adjustments, antiAliasing, featherRadius, gradientType, blurSharpenStrength, dodgeBurnExposure,
  onCommitPaint, onUpdateLayerProperty, onUpdateLayerProperties, onCommitTransform, onAddTextLayerAt, onAddShapeLayerAt,
  onExportPng, onExportJpg, onExportJson, onImportJson, onSelectColorFromEyedropper,
  onCursorMove, onZoomChange,
  zoom, setZoom, panX, setPanX, panY, setPanY,
  onDeleteLayer, onDuplicateLayer, onAddPaintLayer,
  onFlipHorizontal, onFlipVertical, onAlignLayer,
  onFlattenImage, onMergeVisible,
  quickMaskActive, showGrid, showRulers, zoomDirection, setZoomDirection,
  selectionRect, setSelectionRect, lassoPoints, setLassoPoints, vectorPath, setVectorPath,
  selection, setSelection, onSelectionChange,
  wandTolerance, wandContiguous,
  editTarget, onCommitMask,
}: CanvasAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qmCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const quickMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Clipping mask preview: maps clipped layer ID → base-layer-alpha data URL
  const [clipMaskUrls, setClipMaskUrls] = useState<Record<string, string>>({});

  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const marqueeStartPointRef = useRef<{ x: number; y: number } | null>(null);

  const [isTransforming, setIsTransforming] = useState(false);
  const [transformHandle, setTransformHandle] = useState<string | null>(null);
  const [transformStart, setTransformStart] = useState({ x: 0, y: 0, layerX: 0, layerY: 0, layerW: 0, layerH: 0 });

  const [tempShape, setTempShape] = useState({ startX: 0, startY: 0, currentX: 0, currentY: 0, active: false });

  // Clone stamp source
  const [cloneSource, setCloneSource] = useState<CloneSource | null>(null);
  const [cloneOffset, setCloneOffset] = useState({ x: 0, y: 0 });

  // Gradient drag
  const [gradientDrag, setGradientDrag] = useState({ startX: 0, startY: 0, endX: 0, endY: 0, active: false });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [contextTarget, setContextTarget] = useState<'canvas' | 'layer'>('canvas');

  // Spot healing brush stroke points
  const [healPoints, setHealPoints] = useState<{ x: number; y: number }[]>([]);
  // Path editing state
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);
  const [brushPreviewPos, setBrushPreviewPos] = useState<{ x: number; y: number } | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  const ensureImagesLoaded = (layersList: Layer[]): Promise<void[]> => {
    const promises = layersList.map((l) => {
      if (l.type === 'image' && l.imageUrl) {
        const img = document.getElementById(`temp-img-${l.id}`) as HTMLImageElement;
        if (img && !img.complete) {
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }
      }
      return Promise.resolve();
    });
    return Promise.all(promises);
  };

  const autoFitCanvas = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scaleX = (cw - 80) / canvasWidth;
    const scaleY = (ch - 80) / canvasHeight;
    const fitZoom = Math.min(scaleX, scaleY, 1.5);
    const newZoom = parseFloat(fitZoom.toFixed(2));
    setZoom(newZoom);
    setPanX(0);
    setPanY(0);
  }, [canvasWidth, canvasHeight, setZoom, setPanX, setPanY]);

  useEffect(() => {
    autoFitCanvas();
  }, [canvasWidth, canvasHeight, autoFitCanvas]);

  // Restore paint and mask layers
  useEffect(() => {
    layers.forEach((layer) => {
      if (layer.type === 'paint' && layer.paintDataUrl) {
        const c = document.getElementById(`canvas-paint-${layer.id}`) as HTMLCanvasElement;
        if (c) {
          const ctx = c.getContext('2d');
          if (ctx) {
            const nw = layer.paintNativeWidth || layer.width;
            const nh = layer.paintNativeHeight || layer.height;
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, nw, nh);
              ctx.drawImage(img, 0, 0, nw, nh);
            };
            img.src = layer.paintDataUrl;
          }
        }
      }
      if (layer.hasMask && layer.maskDataUrl) {
        const mc = document.getElementById(`canvas-mask-${layer.id}`) as HTMLCanvasElement;
        if (mc) {
          const mCtx = mc.getContext('2d');
          if (mCtx) {
            const nw = layer.paintNativeWidth || layer.width;
            const nh = layer.paintNativeHeight || layer.height;
            const img = new Image();
            img.onload = () => {
              mCtx.clearRect(0, 0, nw, nh);
              if (layer.maskLinked) {
                mCtx.drawImage(img, 0, 0, nw, nh);
              } else {
                mCtx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
              }
            };
            img.src = layer.maskDataUrl;
          }
        }
      }
    });
  }, [layers]);

  // Compute clipping mask preview data URLs
  useEffect(() => {
    const newClipUrls: Record<string, string> = {};
    let hasClipping = false;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (layer.clippingMask && i > 0) {
        hasClipping = true;
        // Find the base layer (first non-clipped layer below)
        let baseIdx = i - 1;
        while (baseIdx > 0 && layers[baseIdx].clippingMask) {
          baseIdx--;
        }
        const base = layers[baseIdx];
        if (base && base.visible) {
          // Render base layer alpha to a canvas
          const tc = document.createElement('canvas');
          tc.width = canvasWidth;
          tc.height = canvasHeight;
          const tCtx = tc.getContext('2d');
          if (tCtx) {
            drawLayerWithMask(tCtx, base, {
              getPaintCanvas: (id) => document.getElementById(`canvas-paint-${id}`) as HTMLCanvasElement,
              getMaskCanvas: (id) => document.getElementById(`canvas-mask-${id}`) as HTMLCanvasElement,
              getImageElement: (id) => document.getElementById(`temp-img-${id}`) as HTMLImageElement,
            });
            newClipUrls[layer.id] = tc.toDataURL();
          }
        }
      }
    }

    if (hasClipping || Object.keys(clipMaskUrls).length > 0) {
      setClipMaskUrls(newClipUrls);
    }
  }, [layers, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!quickMaskActive || !selection || !quickMaskCanvasRef.current) return;
    const canvas = quickMaskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Rubylith view: unselected is translucent red, selected is transparent cutout
    const imgData = ctx.createImageData(canvasWidth, canvasHeight);
    const data = imgData.data;
    const maskData = selection.data;

    for (let i = 0; i < maskData.length; i++) {
      const alpha = maskData[i]; // 0 = unselected, 255 = selected
      const idx = i * 4;
      data[idx] = 239;     // R
      data[idx + 1] = 68;  // G
      data[idx + 2] = 68;  // B
      data[idx + 3] = Math.round(0.5 * (255 - alpha)); // 50% rubylith opacity for unselected areas
    }
    ctx.putImageData(imgData, 0, 0);
  }, [selection, quickMaskActive, canvasWidth, canvasHeight]);

  // Temperature calculations

  const getFiltersForLayerIndex = (index: number, layers: Layer[]) => {
    const parts: string[] = [];
    for (let i = 0; i < index; i++) {
      const l = layers[i];
      if (l.type === 'adjustment' && l.visible && l.adjustmentParams) {
        parts.push(adjustmentsToFilterCSS(l.adjustmentParams));
      }
    }
    return parts.join(' ') || undefined;
  };

  const getArtboardCoords = (e: React.MouseEvent) => {
    if (!artboardRef.current) return { x: 0, y: 0 };
    const rect = artboardRef.current.getBoundingClientRect();
    return {
      x: Math.round((e.clientX - rect.left) / zoom),
      y: Math.round((e.clientY - rect.top) / zoom),
    };
  };

  const getCanvasBlendMode = (mode: string): GlobalCompositeOperation => {
    const modes: Record<string, GlobalCompositeOperation> = {
      'multiply': 'multiply', 'screen': 'screen', 'overlay': 'overlay',
      'darken': 'darken', 'lighten': 'lighten', 'color-dodge': 'color-dodge',
      'color-burn': 'color-burn', 'difference': 'difference',
    };
    return modes[mode] || 'source-over';
  };

  // Eyedropper
  const pickEyedropperColor = (artboardX: number, artboardY: number) => {
    if (artboardX < 0 || artboardX > canvasWidth || artboardY < 0 || artboardY > canvasHeight) return;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = canvasWidth;
    sampleCanvas.height = canvasHeight;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return;
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    const visibleLayers = layers.filter(l => l.visible);
    compositeLayerStack(sCtx, visibleLayers, canvasWidth, canvasHeight, {
      getPaintCanvas: (id) => document.getElementById(`canvas-paint-${id}`) as HTMLCanvasElement,
      getMaskCanvas: (id) => document.getElementById(`canvas-mask-${id}`) as HTMLCanvasElement,
      getImageElement: (id) => document.getElementById(`temp-img-${id}`) as HTMLImageElement,
    });
    const pd = sCtx.getImageData(artboardX, artboardY, 1, 1).data;
    const hex = '#' + [pd[0], pd[1], pd[2]].map(x => x.toString(16).padStart(2, '0')).join('');
    onSelectColorFromEyedropper(hex);
  };

  // Apply blur/sharpen/dodge/burn at position
  const applyLocalEffect = (canvas: HTMLCanvasElement, localX: number, localY: number, radius: number, type: 'blur' | 'sharpen' | 'dodge' | 'burn') => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const r = Math.max(1, Math.round(radius / 2));
    const x0 = Math.max(0, localX - r);
    const y0 = Math.max(0, localY - r);
    const x1 = Math.min(canvas.width, localX + r);
    const y1 = Math.min(canvas.height, localY + r);
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) return;

    const imageData = ctx.getImageData(x0, y0, w, h);
    const data = imageData.data;

    if (type === 'blur') {
      // Simple box blur
      const kernel = 3;
      const half = Math.floor(kernel / 2);
      const copy = new Uint8ClampedArray(data);
      for (let py = half; py < h - half; py++) {
        for (let px = half; px < w - half; px++) {
          const docX = x0 + px + (selectedLayer?.x || 0);
          const docY = y0 + py + (selectedLayer?.y || 0);
          const sAlpha = selectionAlpha(selection, docX, docY) / 255;
          if (sAlpha <= 0) continue;

          let rr = 0, gg = 0, bb = 0, count = 0;
          for (let ky = -half; ky <= half; ky++) {
            for (let kx = -half; kx <= half; kx++) {
              const idx = ((py + ky) * w + (px + kx)) * 4;
              rr += copy[idx]; gg += copy[idx + 1]; bb += copy[idx + 2]; count++;
            }
          }
          const idx = (py * w + px) * 4;
          const strength = (blurSharpenStrength / 100) * sAlpha;
          data[idx] = Math.round(copy[idx] * (1 - strength) + (rr / count) * strength);
          data[idx + 1] = Math.round(copy[idx + 1] * (1 - strength) + (gg / count) * strength);
          data[idx + 2] = Math.round(copy[idx + 2] * (1 - strength) + (bb / count) * strength);
        }
      }
    } else if (type === 'sharpen') {
      const copy = new Uint8ClampedArray(data);
      for (let py = 1; py < h - 1; py++) {
        for (let px = 1; px < w - 1; px++) {
          const docX = x0 + px + (selectedLayer?.x || 0);
          const docY = y0 + py + (selectedLayer?.y || 0);
          const sAlpha = selectionAlpha(selection, docX, docY) / 255;
          if (sAlpha <= 0) continue;

          const idx = (py * w + px) * 4;
          for (let c = 0; c < 3; c++) {
            const center = copy[idx + c] * 5;
            const neighbors =
              copy[((py - 1) * w + px) * 4 + c] +
              copy[((py + 1) * w + px) * 4 + c] +
              copy[(py * w + px - 1) * 4 + c] +
              copy[(py * w + px + 1) * 4 + c];
            const sharpened = center - neighbors;
            const strength = (blurSharpenStrength / 100) * sAlpha;
            data[idx + c] = Math.max(0, Math.min(255, Math.round(copy[idx + c] * (1 - strength) + sharpened * strength)));
          }
        }
      }
    } else if (type === 'dodge' || type === 'burn') {
      const exposure = dodgeBurnExposure / 100;
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const docX = x0 + px + (selectedLayer?.x || 0);
          const docY = y0 + py + (selectedLayer?.y || 0);
          const sAlpha = selectionAlpha(selection, docX, docY) / 255;
          if (sAlpha <= 0) continue;

          const idx = (py * w + px) * 4;
          const factor = exposure * 0.3 * sAlpha;
          if (type === 'dodge') {
            data[idx] = Math.min(255, data[idx] + Math.round(data[idx] * factor));
            data[idx + 1] = Math.min(255, data[idx + 1] + Math.round(data[idx + 1] * factor));
            data[idx + 2] = Math.min(255, data[idx + 2] + Math.round(data[idx + 2] * factor));
          } else {
            data[idx] = Math.max(0, data[idx] - Math.round(data[idx] * factor));
            data[idx + 1] = Math.max(0, data[idx + 1] - Math.round(data[idx + 1] * factor));
            data[idx + 2] = Math.max(0, data[idx + 2] - Math.round(data[idx + 2] * factor));
          }
        }
      }
    }

    ctx.putImageData(imageData, x0, y0);
  };

  // Snapping helper for magnetic lasso
  const findContrastEdge = (artboardX: number, artboardY: number) => {
    if (!selectedLayer || selectedLayer.type !== 'paint') return { x: artboardX, y: artboardY };
    const canvas = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
    if (!canvas) return { x: artboardX, y: artboardY };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { x: artboardX, y: artboardY };

    const localX = artboardX - selectedLayer.x;
    const localY = artboardY - selectedLayer.y;
    const size = 9;
    const half = Math.floor(size / 2);
    const startX = Math.max(0, localX - half);
    const startY = Math.max(0, localY - half);
    const w = Math.min(canvas.width - startX, size);
    const h = Math.min(canvas.height - startY, size);

    if (w <= 0 || h <= 0) return { x: artboardX, y: artboardY };

    try {
      const imgData = ctx.getImageData(startX, startY, w, h);
      const data = imgData.data;

      let maxGrad = -1;
      let bestDx = 0;
      let bestDy = 0;

      for (let py = 1; py < h - 1; py++) {
        for (let px = 1; px < w - 1; px++) {
          const idx = (py * w + px) * 4;
          // Simple color gradients (difference from adjacent pixels)
          const rL = data[idx - 4];
          const rR = data[idx + 4];
          const rU = data[idx - w * 4];
          const rD = data[idx + w * 4];

          const gradX = Math.abs(rR - rL);
          const gradY = Math.abs(rD - rU);
          const grad = gradX + gradY;

          if (grad > maxGrad) {
            maxGrad = grad;
            bestDx = px - half;
            bestDy = py - half;
          }
        }
      }

      if (maxGrad > 12) {
        return { x: artboardX + bestDx, y: artboardY + bestDy };
      }
    } catch (err) {
      // Out of bounds
    }

    return { x: artboardX, y: artboardY };
  };

  // Spot healing blending algorithm
  const applySpotHealing = (canvas: HTMLCanvasElement, strokePoints: { x: number; y: number }[], radius: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || strokePoints.length === 0 || !selectedLayer) return;

    // Convert stroke points to layer-local coordinates
    const localPts = strokePoints.map(p => ({
      x: p.x - selectedLayer.x,
      y: p.y - selectedLayer.y
    }));

    // Find bounding box
    let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
    localPts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    // Expand bounding box by radius
    const pad = Math.ceil(radius) + 2;
    const x0 = Math.max(0, Math.floor(minX - pad));
    const y0 = Math.max(0, Math.floor(minY - pad));
    const x1 = Math.min(canvas.width, Math.ceil(maxX + pad));
    const y1 = Math.min(canvas.height, Math.ceil(maxY + pad));
    const w = x1 - x0;
    const h = y1 - y0;

    if (w <= 0 || h <= 0) return;

    const imgData = ctx.getImageData(x0, y0, w, h);
    const data = imgData.data;

    // Check if a pixel is inside the painted stroke
    const distanceToStroke = (lx: number, ly: number) => {
      let minDist = Infinity;
      for (const p of localPts) {
        const d = Math.sqrt((p.x - lx) ** 2 + (p.y - ly) ** 2);
        if (d < minDist) minDist = d;
      }
      return minDist;
    };

    // Precalculate mask array
    const mask = new Uint8Array(w * h); // 1 = inside mask (heal), 0 = source
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const lx = x0 + px;
        const ly = y0 + py;
        const docX = lx + selectedLayer.x;
        const docY = ly + selectedLayer.y;
        const isSel = selectionAlpha(selection, docX, docY) > 0;
        if (isSel && distanceToStroke(lx, ly) <= radius) {
          mask[py * w + px] = 1;
        }
      }
    }

    const origData = new Uint8ClampedArray(data);

    // Interpolate from nearest non-masked bounds
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const idx = (py * w + px) * 4;
        if (mask[py * w + px] === 1) {
          let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
          const searchRadius = Math.max(12, Math.round(radius * 1.5));

          for (let sy = -searchRadius; sy <= searchRadius; sy += 2) {
            for (let sx = -searchRadius; sx <= searchRadius; sx += 2) {
              const nx = px + sx;
              const ny = py + sy;
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                if (mask[ny * w + nx] === 0) {
                  const nIdx = (ny * w + nx) * 4;
                  const weight = 1 / (Math.sqrt(sx * sx + sy * sy) || 1);
                  rSum += origData[nIdx] * weight;
                  gSum += origData[nIdx + 1] * weight;
                  bSum += origData[nIdx + 2] * weight;
                  aSum += origData[nIdx + 3] * weight;
                  count += weight;
                }
              }
            }
          }

          if (count > 0) {
            data[idx] = Math.round(rSum / count);
            data[idx + 1] = Math.round(gSum / count);
            data[idx + 2] = Math.round(bSum / count);
            data[idx + 3] = Math.round(aSum / count);
          }
        }
      }
    }

    ctx.putImageData(imgData, x0, y0);
  };

  // MOUSE DOWN
  const handleMouseDown = async (e: React.MouseEvent) => {
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    const button = e.button;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const { x, y } = getArtboardCoords(e);

    // Hand tool or Middle-mouse / Shift-mouse Panning
    if (activeTool === 'hand' || (activeTool === 'select' && (button === 1 || isShift))) {
      setIsPanning(true);
      setPanStart({ x: clientX, y: clientY });
      return;
    }

    // Zoom tool click zoom
    if (activeTool === 'zoom') {
      const isOut = isAlt || zoomDirection === 'out';
      const factor = isOut ? -0.25 : 0.25;
      setZoom(Math.max(0.1, Math.min(10, parseFloat((zoom + factor).toFixed(2)))));
      return;
    }

    // Marquee selections
    if (activeTool === 'rect-select' || activeTool === 'ellipse-select') {
      marqueeStartPointRef.current = { x, y };
      setSelectionRect({
        startX: x, startY: y,
        currentX: x, currentY: y,
        active: true,
        shape: activeTool === 'rect-select' ? 'rectangle' : 'ellipse'
      });
      return;
    }

    // Magnetic Lasso
    if (activeTool === 'magnetic-lasso') {
      const snapped = findContrastEdge(x, y);
      if (lassoPoints.length > 2) {
        const dist = Math.sqrt((lassoPoints[0].x - snapped.x) ** 2 + (lassoPoints[0].y - snapped.y) ** 2);
        if (dist < 15) {
          // Close lasso path: rasterize the polygon!
          const srcSel = emptySelection(canvasWidth, canvasHeight);
          rasterizePolygon(srcSel.data, canvasWidth, canvasHeight, lassoPoints);

          if (featherRadius > 0) {
            featherMask(srcSel.data, canvasWidth, canvasHeight, featherRadius);
          }

          srcSel.bounds = computeBounds(srcSel.data, canvasWidth, canvasHeight);
          srcSel.hasSelection = srcSel.bounds !== null;
          srcSel.shape = 'polygon';
          (srcSel as any).polygonPoints = [...lassoPoints];

          let finalSel: DocumentSelection;
          let label = 'Lasso Selection';

          if (isShift && isAlt && selection) {
            finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
            combineIntersect(finalSel.data, srcSel.data);
            finalSel.shape = 'none';
            finalSel.polygonPoints = undefined;
            label = 'Intersect Selection';
          } else if (isShift && selection) {
            finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
            combineAdd(finalSel.data, srcSel.data);
            finalSel.shape = 'none';
            finalSel.polygonPoints = undefined;
            label = 'Add Selection';
          } else if (isAlt && selection) {
            finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
            combineSubtract(finalSel.data, srcSel.data);
            finalSel.shape = 'none';
            finalSel.polygonPoints = undefined;
            label = 'Subtract Selection';
          } else {
            finalSel = srcSel;
          }

          finalSel.bounds = computeBounds(finalSel.data, canvasWidth, canvasHeight);
          finalSel.hasSelection = finalSel.bounds !== null;

          onSelectionChange(finalSel, label);
          setLassoPoints([]);
          return;
        }
      }
      setLassoPoints([...lassoPoints, snapped]);
      return;
    }

    // Magic Wand
    if (activeTool === 'magic-wand') {
      await ensureImagesLoaded(layers);
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = canvasWidth;
      sampleCanvas.height = canvasHeight;
      const sCtx = sampleCanvas.getContext('2d');
      if (sCtx) {
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, canvasWidth, canvasHeight);
        const visibleLayers = layers.filter(l => l.visible);
        compositeLayerStack(sCtx, visibleLayers, canvasWidth, canvasHeight, {
          getPaintCanvas: (id) => document.getElementById(`canvas-paint-${id}`) as HTMLCanvasElement,
          getMaskCanvas: (id) => document.getElementById(`canvas-mask-${id}`) as HTMLCanvasElement,
          getImageElement: (id) => document.getElementById(`temp-img-${id}`) as HTMLImageElement,
        });

        const imageData = sCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        const maskData = floodFillMask(imageData, x, y, wandTolerance, wandContiguous);

        const srcSel = emptySelection(canvasWidth, canvasHeight);
        srcSel.data = maskData;
        srcSel.shape = 'wand';

        if (featherRadius > 0) {
          featherMask(srcSel.data, canvasWidth, canvasHeight, featherRadius);
        }

        srcSel.bounds = computeBounds(srcSel.data, canvasWidth, canvasHeight);
        srcSel.hasSelection = srcSel.bounds !== null;

        let finalSel: DocumentSelection;
        let label = 'Magic Wand Selection';

        if (isShift && isAlt && selection) {
          finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
          combineIntersect(finalSel.data, srcSel.data);
          finalSel.shape = 'none';
          finalSel.polygonPoints = undefined;
          label = 'Intersect Selection';
        } else if (isShift && selection) {
          finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
          combineAdd(finalSel.data, srcSel.data);
          finalSel.shape = 'none';
          finalSel.polygonPoints = undefined;
          label = 'Add Selection';
        } else if (isAlt && selection) {
          finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
          combineSubtract(finalSel.data, srcSel.data);
          finalSel.shape = 'none';
          finalSel.polygonPoints = undefined;
          label = 'Subtract Selection';
        } else {
          finalSel = srcSel;
        }

        finalSel.bounds = computeBounds(finalSel.data, canvasWidth, canvasHeight);
        finalSel.hasSelection = finalSel.bounds !== null;

        onSelectionChange(finalSel, label);
      }
      return;
    }

    // Magical Spot Heal
    if (activeTool === 'magic-heal' && selectedLayer && selectedLayer.type === 'paint') {
      setIsDrawing(true);
      setHealPoints([{ x, y }]);
      return;
    }

    // Pen tool
    if (activeTool === 'pen') {
      if (vectorPath.length > 2) {
        const dist = Math.sqrt((vectorPath[0].x - x) ** 2 + (vectorPath[0].y - y) ** 2);
        if (dist < 12) {
          // Closed loop alert
          alert('Vector path closed!');
          return;
        }
      }
      setVectorPath([...vectorPath, { x, y }]);
      return;
    }

    // Path Select
    if (activeTool === 'path-select') {
      const idx = vectorPath.findIndex(pt => Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2) < 12);
      if (idx !== -1) {
        setDraggingPointIndex(idx);
      }
      return;
    }

    // Eyedropper
    if (activeTool === 'eyedropper') {
      pickEyedropperColor(x, y);
      return;
    }

    // Paint bucket
    if (activeTool === 'paintbucket' && selectedLayer && selectedLayer.type === 'paint') {
      const pc = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (pc) {
        const ctx = pc.getContext('2d');
        if (ctx) {
          const nativeW = selectedLayer.paintNativeWidth || selectedLayer.width;
          const nativeH = selectedLayer.paintNativeHeight || selectedLayer.height;
          const scaleX = nativeW / selectedLayer.width;
          const scaleY = nativeH / selectedLayer.height;
          ctx.save();
          if (selection && selection.hasSelection) {
            // Create a temp canvas for the fill
            const fillCanvas = document.createElement('canvas');
            fillCanvas.width = nativeW;
            fillCanvas.height = nativeH;
            const fCtx = fillCanvas.getContext('2d');
            if (fCtx) {
              fCtx.fillStyle = primaryColor;
              fCtx.fillRect(0, 0, nativeW, nativeH);

              // Generate selection mask for the layer
              const maskCanvas = document.createElement('canvas');
              maskCanvas.width = nativeW;
              maskCanvas.height = nativeH;
              const mCtx = maskCanvas.getContext('2d');
              if (mCtx) {
                const mImgData = mCtx.createImageData(nativeW, nativeH);
                const mData = mImgData.data;
                for (let sy = 0; sy < nativeH; sy++) {
                  for (let sx = 0; sx < nativeW; sx++) {
                    const cx = Math.round(selectedLayer.x + sx / scaleX);
                    const cy = Math.round(selectedLayer.y + sy / scaleY);
                    let alpha = 0;
                    if (cx >= 0 && cx < canvasWidth && cy >= 0 && cy < canvasHeight) {
                      alpha = selection.data[cy * canvasWidth + cx];
                    }
                    const idx = (sy * nativeW + sx) * 4;
                    mData[idx] = 0;
                    mData[idx + 1] = 0;
                    mData[idx + 2] = 0;
                    mData[idx + 3] = alpha;
                  }
                }
                mCtx.putImageData(mImgData, 0, 0);

                // Clip fill to mask
                fCtx.globalCompositeOperation = 'destination-in';
                fCtx.drawImage(maskCanvas, 0, 0);
              }
              // Draw filled masked pixels onto layer canvas
              ctx.drawImage(fillCanvas, 0, 0);
            }
          } else {
            // No selection: fill everything
            ctx.fillStyle = primaryColor;
            ctx.fillRect(0, 0, nativeW, nativeH);
          }
          ctx.restore();
          onCommitPaint(selectedLayer.id, pc.toDataURL(), pc.width, pc.height);
        }
      }
      return;
    }

    // Clone stamp - set source with Alt
    if (activeTool === 'clone' && isAlt && selectedLayer) {
      setCloneSource({ layerId: selectedLayer.id, x: x - selectedLayer.x, y: y - selectedLayer.y });
      return;
    }

    // Gradient - start drag
    if (activeTool === 'gradient' && selectedLayer && selectedLayer.type === 'paint') {
      setGradientDrag({ startX: x, startY: y, endX: x, endY: y, active: true });
      return;
    }

    // Quick Mask brush/eraser painting
    if (['brush', 'eraser'].includes(activeTool) && quickMaskActive) {
      setIsDrawing(true);
      const qmCanvas = document.createElement('canvas');
      qmCanvas.width = canvasWidth;
      qmCanvas.height = canvasHeight;
      const qmCtx = qmCanvas.getContext('2d');
      if (qmCtx) {
        const qmImgData = qmCtx.createImageData(canvasWidth, canvasHeight);
        const qmData = qmImgData.data;
        if (selection) {
          for (let i = 0; i < selection.data.length; i++) {
            const val = selection.data[i];
            const idx = i * 4;
            qmData[idx] = val;
            qmData[idx + 1] = val;
            qmData[idx + 2] = val;
            qmData[idx + 3] = 255;
          }
        }
        qmCtx.putImageData(qmImgData, 0, 0);

        qmCanvasRef.current = qmCanvas;
        activeCanvasRef.current = qmCanvas;

        qmCtx.beginPath();
        qmCtx.moveTo(x, y);
        qmCtx.lineCap = 'round';
        qmCtx.lineJoin = 'round';
        qmCtx.lineWidth = brushSize;
        qmCtx.globalAlpha = brushOpacity / 100;

        if (activeTool === 'eraser') {
          qmCtx.strokeStyle = '#000000';
          qmCtx.globalCompositeOperation = 'source-over';
        } else {
          qmCtx.strokeStyle = '#ffffff';
          qmCtx.globalCompositeOperation = 'source-over';
        }

        if (brushHardness < 100) {
          qmCtx.shadowBlur = brushSize * (1 - brushHardness / 100);
          qmCtx.shadowColor = activeTool === 'eraser' ? '#000000' : '#ffffff';
        } else {
          qmCtx.shadowBlur = 0;
        }
      }
      return;
    }

    const isMaskEdit = editTarget === 'mask' && selectedLayer && selectedLayer.hasMask;
    if (['brush', 'eraser'].includes(activeTool) && isMaskEdit && selectedLayer) {
      setIsDrawing(true);
      const canvas = document.getElementById(`canvas-mask-${selectedLayer.id}`) as HTMLCanvasElement;
      if (canvas) {
        activeCanvasRef.current = canvas;

        // Native resolution for non-destructive resizing
        const nativeW = selectedLayer.paintNativeWidth || selectedLayer.width;
        const nativeH = selectedLayer.paintNativeHeight || selectedLayer.height;
        const scaleX = nativeW / selectedLayer.width;
        const scaleY = nativeH / selectedLayer.height;
        const scaledBrushSize = brushSize * Math.max(scaleX, scaleY);

        // 1. Initialize backup canvas with current mask content
        const backup = document.createElement('canvas');
        backup.width = nativeW;
        backup.height = nativeH;
        const bCtx = backup.getContext('2d');
        if (bCtx) {
          bCtx.drawImage(canvas, 0, 0);
          backupCanvasRef.current = backup;
        }

        // 2. Initialize scratch canvas (empty initially)
        const scratch = document.createElement('canvas');
        scratch.width = nativeW;
        scratch.height = nativeH;
        scratchCanvasRef.current = scratch;

        // No selection mask canvas needed since we ignore document selection
        selectionMaskCanvasRef.current = null;

        // 3. Configure scratch context and start path
        const sCtx = scratch.getContext('2d');
        if (sCtx) {
          sCtx.save();
          sCtx.imageSmoothingEnabled = antiAliasing;
          sCtx.beginPath();
          const localX = (x - selectedLayer.x) * scaleX;
          const localY = (y - selectedLayer.y) * scaleY;
          sCtx.moveTo(localX, localY);
          sCtx.lineCap = 'round';
          sCtx.lineJoin = 'round';
          sCtx.lineWidth = scaledBrushSize;
          sCtx.globalAlpha = brushOpacity / 100;

          // Brush paints white, eraser paints black
          if (activeTool === 'eraser') {
            sCtx.strokeStyle = '#000000';
            sCtx.globalCompositeOperation = 'source-over';
          } else {
            sCtx.strokeStyle = '#ffffff';
            sCtx.globalCompositeOperation = 'source-over';
          }

          if (brushHardness < 100) {
            sCtx.shadowBlur = scaledBrushSize * (1 - brushHardness / 100);
            sCtx.shadowColor = activeTool === 'eraser' ? '#000000' : '#ffffff';
          } else {
            sCtx.shadowBlur = 0;
          }

          sCtx.lineTo(localX, localY);
          sCtx.stroke();

          // Composite onto the mask canvas
          const actCtx = canvas.getContext('2d');
          if (actCtx) {
            actCtx.clearRect(0, 0, nativeW, nativeH);
            actCtx.drawImage(backup, 0, 0);

            actCtx.save();
            actCtx.globalCompositeOperation = 'source-over';
            actCtx.drawImage(scratch, 0, 0);
            actCtx.restore();
          }
        }
      }
      return;
    }

    // Brush / Eraser / Clone / Smudge with scratch canvas pipeline
    if (['brush', 'eraser', 'clone', 'smudge'].includes(activeTool) && selectedLayer && selectedLayer.type === 'paint') {
      setIsDrawing(true);
      const canvas = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (canvas) {
        activeCanvasRef.current = canvas;

        // Native resolution for non-destructive resizing
        const nativeW = selectedLayer.paintNativeWidth || selectedLayer.width;
        const nativeH = selectedLayer.paintNativeHeight || selectedLayer.height;
        const scaleX = nativeW / selectedLayer.width;
        const scaleY = nativeH / selectedLayer.height;
        const scaledBrushSize = brushSize * Math.max(scaleX, scaleY);

        if (activeTool === 'clone') {
          setCloneOffset({ x: x - selectedLayer.x, y: y - selectedLayer.y });
        }

        // 1. Initialize backup canvas with current layer content
        const backup = document.createElement('canvas');
        backup.width = nativeW;
        backup.height = nativeH;
        const bCtx = backup.getContext('2d');
        if (bCtx) {
          bCtx.drawImage(canvas, 0, 0);
          backupCanvasRef.current = backup;
        }

        // 2. Initialize scratch canvas (empty initially)
        const scratch = document.createElement('canvas');
        scratch.width = nativeW;
        scratch.height = nativeH;
        scratchCanvasRef.current = scratch;

        // 3. Initialize selection mask canvas (containing alpha values corresponding to the selection over the layer)
        const mask = document.createElement('canvas');
        mask.width = nativeW;
        mask.height = nativeH;
        const mCtx = mask.getContext('2d');
        if (mCtx) {
          const mImgData = mCtx.createImageData(nativeW, nativeH);
          const mData = mImgData.data;
          for (let sy = 0; sy < nativeH; sy++) {
            for (let sx = 0; sx < nativeW; sx++) {
              // Map native pixel back to display (document) coordinates
              const cx = selectedLayer.x + sx / scaleX;
              const cy = selectedLayer.y + sy / scaleY;
              let alpha = 255;
              if (selection && selection.hasSelection) {
                const docX = Math.round(cx);
                const docY = Math.round(cy);
                if (docX >= 0 && docX < canvasWidth && docY >= 0 && docY < canvasHeight) {
                  alpha = selection.data[docY * canvasWidth + docX];
                } else {
                  alpha = 0;
                }
              }
              const idx = (sy * nativeW + sx) * 4;
              mData[idx] = 0;
              mData[idx + 1] = 0;
              mData[idx + 2] = 0;
              mData[idx + 3] = alpha;
            }
          }
          mCtx.putImageData(mImgData, 0, 0);
          selectionMaskCanvasRef.current = mask;
        }

        // 4. Configure scratch context and start path
        const sCtx = scratch.getContext('2d');
        if (sCtx) {
          sCtx.save();
          sCtx.imageSmoothingEnabled = antiAliasing;
          sCtx.beginPath();
          const localX = (x - selectedLayer.x) * scaleX;
          const localY = (y - selectedLayer.y) * scaleY;
          sCtx.moveTo(localX, localY);
          sCtx.lineCap = 'round';
          sCtx.lineJoin = 'round';
          sCtx.lineWidth = scaledBrushSize;

          if (activeTool === 'eraser') {
            sCtx.globalAlpha = brushOpacity / 100;
            sCtx.strokeStyle = '#000000';
            sCtx.globalCompositeOperation = 'source-over';
          } else if (activeTool === 'clone') {
            sCtx.globalAlpha = brushOpacity / 100;
            sCtx.globalCompositeOperation = 'source-over';
          } else if (activeTool === 'smudge') {
            sCtx.globalAlpha = 0.3;
            sCtx.strokeStyle = primaryColor;
            sCtx.globalCompositeOperation = 'source-over';
          } else {
            sCtx.globalAlpha = brushOpacity / 100;
            sCtx.strokeStyle = primaryColor;
            sCtx.globalCompositeOperation = 'source-over';
          }

          if (brushHardness < 100 && activeTool !== 'eraser') {
            sCtx.shadowBlur = scaledBrushSize * (1 - brushHardness / 100);
            sCtx.shadowColor = primaryColor;
          } else if (brushHardness < 100 && activeTool === 'eraser') {
            sCtx.shadowBlur = scaledBrushSize * (1 - brushHardness / 100);
            sCtx.shadowColor = '#000000';
          } else {
            sCtx.shadowBlur = 0;
          }

          // Draw a small dab of paint on click down
          if (activeTool === 'clone' && cloneSource) {
            const srcCanvas = document.getElementById(`canvas-paint-${cloneSource.layerId}`) as HTMLCanvasElement;
            if (srcCanvas) {
              const srcCtx = srcCanvas.getContext('2d');
              if (srcCtx) {
                const srcX = cloneSource.x * scaleX;
                const srcY = cloneSource.y * scaleY;
                const size = scaledBrushSize;
                try {
                  const srcData = srcCtx.getImageData(
                    Math.max(0, srcX - size / 2), Math.max(0, srcY - size / 2), size, size
                  );
                  sCtx.putImageData(srcData, localX - size / 2, localY - size / 2);
                } catch (err) { /* bounds check */ }
              }
            }
          } else {
            sCtx.lineTo(localX, localY);
            sCtx.stroke();
          }

          // Composite the first dab onto the visible canvas:
          const actCtx = canvas.getContext('2d');
          if (actCtx) {
            actCtx.clearRect(0, 0, nativeW, nativeH);
            actCtx.drawImage(backup, 0, 0);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = nativeW;
            tempCanvas.height = nativeH;
            const tCtx = tempCanvas.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(scratch, 0, 0);
              if (mask) {
                tCtx.globalCompositeOperation = 'destination-in';
                tCtx.drawImage(mask, 0, 0);
              }
              actCtx.save();
              if (activeTool === 'eraser') {
                actCtx.globalCompositeOperation = 'destination-out';
              } else {
                actCtx.globalCompositeOperation = 'source-over';
              }
              actCtx.drawImage(tempCanvas, 0, 0);
              actCtx.restore();
            }
          }
        }
      }
      return;
    }

    // Local effects (blur/sharpen/dodge/burn)
    if (['blur-brush', 'sharpen-brush', 'dodge', 'burn'].includes(activeTool) && selectedLayer && selectedLayer.type === 'paint') {
      setIsDrawing(true);
      const canvas = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (canvas) {
        activeCanvasRef.current = canvas;
        const localX = x - selectedLayer.x;
        const localY = y - selectedLayer.y;
        applyLocalEffect(canvas, localX, localY, brushSize,
          activeTool === 'blur-brush' ? 'blur' :
            activeTool === 'sharpen-brush' ? 'sharpen' :
              activeTool === 'dodge' ? 'dodge' : 'burn'
        );
      }
      return;
    }

    // Shape
    if (activeTool === 'shape') {
      setTempShape({ startX: x, startY: y, currentX: x, currentY: y, active: true });
      return;
    }

    // Text
    if (activeTool === 'text') {
      onAddTextLayerAt(x - 50, y - Math.floor(textFontSize / 2));
      return;
    }

    // Select / Move
    if (activeTool === 'select') {
      // Reset any stuck transform state so handles always respond
      const clickedLayer = [...layers].reverse().find((l) => {
        if (!l.visible) return false;
        return x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height;
      });
      if (clickedLayer) {
        setSelectedLayerId(clickedLayer.id);
        if (!clickedLayer.locked) {
          setIsTransforming(true);
          setTransformHandle('move');
          setTransformStart({ x: clientX, y: clientY, layerX: clickedLayer.x, layerY: clickedLayer.y, layerW: clickedLayer.width, layerH: clickedLayer.height });
        }
      } else {
        setSelectedLayerId(null);
      }
    }
  };

  // MOUSE MOVE
  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getArtboardCoords(e);
    onCursorMove({ x, y });

    // Track brush preview position
    if (['brush', 'eraser', 'clone', 'smudge', 'magic-heal', 'blur-brush', 'sharpen-brush', 'dodge', 'burn'].includes(activeTool)) {
      setBrushPreviewPos({ x, y });
    } else {
      setBrushPreviewPos(null);
    }

    // Panning
    if (isPanning) {
      setPanX(panX + e.clientX - panStart.x);
      setPanY(panY + e.clientY - panStart.y);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Dragging marquee selection bounds
    if (selectionRect && selectionRect.active && e.buttons === 1) {
      const origStartX = marqueeStartPointRef.current ? marqueeStartPointRef.current.x : selectionRect.startX;
      const origStartY = marqueeStartPointRef.current ? marqueeStartPointRef.current.y : selectionRect.startY;
      
      let dx = x - origStartX;
      let dy = y - origStartY;
      
      if (e.shiftKey) {
        const maxD = Math.max(Math.abs(dx), Math.abs(dy));
        dx = (dx >= 0 ? 1 : -1) * maxD;
        dy = (dy >= 0 ? 1 : -1) * maxD;
      }
      
      let newStartX = origStartX;
      let newStartY = origStartY;
      let newCurrentX = origStartX + dx;
      let newCurrentY = origStartY + dy;
      
      if (e.altKey) {
        newStartX = origStartX - dx;
        newCurrentX = origStartX + dx;
        newStartY = origStartY - dy;
        newCurrentY = origStartY + dy;
      }
      
      setSelectionRect({
        ...selectionRect,
        startX: newStartX,
        startY: newStartY,
        currentX: newCurrentX,
        currentY: newCurrentY
      });
      return;
    }

    // Dragging vector anchor points
    if (activeTool === 'path-select' && draggingPointIndex !== null && e.buttons === 1) {
      const newPath = [...vectorPath];
      newPath[draggingPointIndex] = { ...newPath[draggingPointIndex], x, y };
      setVectorPath(newPath);
      return;
    }

    // Eyedropper drag
    if (activeTool === 'eyedropper' && e.buttons === 1) {
      pickEyedropperColor(x, y);
      return;
    }

    // Gradient drag
    if (gradientDrag.active) {
      setGradientDrag(prev => ({ ...prev, endX: x, endY: y }));
      return;
    }

    // Quick Mask Brush painting drag
    if (isDrawing && quickMaskActive && qmCanvasRef.current) {
      const qmCtx = qmCanvasRef.current.getContext('2d');
      if (qmCtx) {
        qmCtx.lineTo(x, y);
        qmCtx.stroke();

        const imgData = qmCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        const pixels = imgData.data;
        const newSel = selection ? cloneSelection(selection) : emptySelection(canvasWidth, canvasHeight);
        if (newSel) {
          for (let i = 0; i < newSel.data.length; i++) {
            newSel.data[i] = pixels[i * 4];
          }
          newSel.bounds = computeBounds(newSel.data, canvasWidth, canvasHeight);
          newSel.hasSelection = newSel.bounds !== null;
          setSelection(newSel);
        }
      }
      return;
    }

    // Drawing - local effects (blur/sharpen/dodge/burn)
    if (isDrawing && ['blur-brush', 'sharpen-brush', 'dodge', 'burn'].includes(activeTool) && activeCanvasRef.current && selectedLayer) {
      const nativeW = selectedLayer.paintNativeWidth || selectedLayer.width;
      const nativeH = selectedLayer.paintNativeHeight || selectedLayer.height;
      const scaleX = nativeW / selectedLayer.width;
      const scaleY = nativeH / selectedLayer.height;
      const localX = (x - selectedLayer.x) * scaleX;
      const localY = (y - selectedLayer.y) * scaleY;
      const scaledBrushSize = brushSize * Math.max(scaleX, scaleY);
      applyLocalEffect(activeCanvasRef.current, localX, localY, scaledBrushSize,
        activeTool === 'blur-brush' ? 'blur' :
          activeTool === 'sharpen-brush' ? 'sharpen' :
            activeTool === 'dodge' ? 'dodge' : 'burn'
      );
      return;
    }

    const isMaskEdit = editTarget === 'mask' && selectedLayer && selectedLayer.hasMask;
    if (isDrawing && ['brush', 'eraser'].includes(activeTool) && isMaskEdit && scratchCanvasRef.current && backupCanvasRef.current && selectedLayer) {
      const scratch = scratchCanvasRef.current;
      const backup = backupCanvasRef.current;
      const sCtx = scratch.getContext('2d');
      const activeCanvas = activeCanvasRef.current;
      if (sCtx && activeCanvas) {
        // Scale to native resolution
        const nativeW = selectedLayer.paintNativeWidth || selectedLayer.width;
        const nativeH = selectedLayer.paintNativeHeight || selectedLayer.height;
        const scaleX = nativeW / selectedLayer.width;
        const scaleY = nativeH / selectedLayer.height;
        const localX = (x - selectedLayer.x) * scaleX;
        const localY = (y - selectedLayer.y) * scaleY;

        sCtx.lineTo(localX, localY);
        sCtx.stroke();

        const actCtx = activeCanvas.getContext('2d');
        if (actCtx) {
          actCtx.clearRect(0, 0, nativeW, nativeH);
          actCtx.drawImage(backup, 0, 0);

          actCtx.save();
          actCtx.globalCompositeOperation = 'source-over';
          actCtx.drawImage(scratch, 0, 0);
          actCtx.restore();
        }
      }
      return;
    }

    // Drawing - scratch canvas tools (brush/eraser/clone/smudge)
    if (isDrawing && ['brush', 'eraser', 'clone', 'smudge'].includes(activeTool) && scratchCanvasRef.current && backupCanvasRef.current && selectedLayer) {
      const scratch = scratchCanvasRef.current;
      const backup = backupCanvasRef.current;
      const mask = selectionMaskCanvasRef.current;
      const sCtx = scratch.getContext('2d');
      const activeCanvas = activeCanvasRef.current;
      if (sCtx && activeCanvas) {
        // Scale to native resolution
        const nativeW = selectedLayer.paintNativeWidth || selectedLayer.width;
        const nativeH = selectedLayer.paintNativeHeight || selectedLayer.height;
        const scaleX = nativeW / selectedLayer.width;
        const scaleY = nativeH / selectedLayer.height;
        const localX = (x - selectedLayer.x) * scaleX;
        const localY = (y - selectedLayer.y) * scaleY;

        if (activeTool === 'clone' && cloneSource) {
          const srcCanvas = document.getElementById(`canvas-paint-${cloneSource.layerId}`) as HTMLCanvasElement;
          if (srcCanvas) {
            const srcCtx = srcCanvas.getContext('2d');
            if (srcCtx) {
              const srcX = (cloneSource.x + ((x - selectedLayer.x) - (cloneOffset.x || (x - selectedLayer.x)))) * scaleX;
              const srcY = (cloneSource.y + ((y - selectedLayer.y) - (cloneOffset.y || (y - selectedLayer.y)))) * scaleY;
              const size = brushSize * Math.max(scaleX, scaleY);
              try {
                const srcData = srcCtx.getImageData(
                  Math.max(0, srcX - size / 2), Math.max(0, srcY - size / 2), size, size
                );
                sCtx.putImageData(srcData, localX - size / 2, localY - size / 2);
              } catch (err) { /* bounds check */ }
            }
          }
        } else {
          sCtx.lineTo(localX, localY);
          sCtx.stroke();
        }

        const actCtx = activeCanvas.getContext('2d');
        if (actCtx) {
          actCtx.clearRect(0, 0, nativeW, nativeH);
          actCtx.drawImage(backup, 0, 0);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = nativeW;
          tempCanvas.height = nativeH;
          const tCtx = tempCanvas.getContext('2d');
          if (tCtx) {
            tCtx.drawImage(scratch, 0, 0);
            if (mask) {
              tCtx.globalCompositeOperation = 'destination-in';
              tCtx.drawImage(mask, 0, 0);
            }
            actCtx.save();
            if (activeTool === 'eraser') {
              actCtx.globalCompositeOperation = 'destination-out';
            } else {
              actCtx.globalCompositeOperation = 'source-over';
            }
            actCtx.drawImage(tempCanvas, 0, 0);
            actCtx.restore();
          }
        }
      }
      return;
    }

    // Spot healing path dragging stroke preview
    if (isDrawing && activeTool === 'magic-heal') {
      setHealPoints(prev => [...prev, { x, y }]);
      return;
    }

    // Shape preview
    if (tempShape.active) {
      setTempShape(prev => ({ ...prev, currentX: x, currentY: y }));
      return;
    }

    // Transform
    if (isTransforming && selectedLayer && transformHandle) {
      const dx = (e.clientX - transformStart.x) / zoom;
      const dy = (e.clientY - transformStart.y) / zoom;
      if (transformHandle === 'move') {
        const updates = {
          x: Math.round(transformStart.layerX + dx),
          y: Math.round(transformStart.layerY + dy)
        };
        if (onUpdateLayerProperties) {
          onUpdateLayerProperties(selectedLayer.id, updates);
        } else {
          onUpdateLayerProperty(selectedLayer.id, 'x', updates.x);
          onUpdateLayerProperty(selectedLayer.id, 'y', updates.y);
        }
      } else {
        let newW = transformStart.layerW, newH = transformStart.layerH;
        let newX = transformStart.layerX, newY = transformStart.layerY;
        const ratio = transformStart.layerW / transformStart.layerH;
        switch (transformHandle) {
          case 'br': newW = Math.max(10, transformStart.layerW + dx); newH = e.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH + dy); break;
          case 'bl': newW = Math.max(10, transformStart.layerW - dx); newX = transformStart.layerX + (transformStart.layerW - newW); newH = e.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH + dy); break;
          case 'tr': newW = Math.max(10, transformStart.layerW + dx); newH = e.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH - dy); newY = transformStart.layerY + (transformStart.layerH - newH); break;
          case 'tl': newW = Math.max(10, transformStart.layerW - dx); newH = e.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH - dy); newX = transformStart.layerX + (transformStart.layerW - newW); newY = transformStart.layerY + (transformStart.layerH - newH); break;
          case 't': newH = Math.max(10, transformStart.layerH - dy); newY = transformStart.layerY + (transformStart.layerH - newH); break;
          case 'b': newH = Math.max(10, transformStart.layerH + dy); break;
          case 'l': newW = Math.max(10, transformStart.layerW - dx); newX = transformStart.layerX + (transformStart.layerW - newW); break;
          case 'r': newW = Math.max(10, transformStart.layerW + dx); break;
        }
        const updates = {
          width: Math.round(newW),
          height: Math.round(newH),
          x: Math.round(newX),
          y: Math.round(newY)
        };
        if (onUpdateLayerProperties) {
          onUpdateLayerProperties(selectedLayer.id, updates);
        } else {
          onUpdateLayerProperty(selectedLayer.id, 'width', updates.width);
          onUpdateLayerProperty(selectedLayer.id, 'height', updates.height);
          onUpdateLayerProperty(selectedLayer.id, 'x', updates.x);
          onUpdateLayerProperty(selectedLayer.id, 'y', updates.y);
        }
      }
    }
  };

  // MOUSE UP
  const handleMouseUp = (e?: React.MouseEvent) => {
    if (isPanning) { setIsPanning(false); return; }

    // Commit Quick Mask Paint
    if (isDrawing && quickMaskActive && qmCanvasRef.current) {
      setIsDrawing(false);
      const qmCtx = qmCanvasRef.current.getContext('2d');
      if (qmCtx) {
        const imgData = qmCtx.getImageData(0, 0, canvasWidth, canvasHeight);
        const pixels = imgData.data;
        const newSel = emptySelection(canvasWidth, canvasHeight);
        for (let i = 0; i < newSel.data.length; i++) {
          newSel.data[i] = pixels[i * 4];
        }
        newSel.bounds = computeBounds(newSel.data, canvasWidth, canvasHeight);
        newSel.hasSelection = newSel.bounds !== null;
        newSel.shape = 'none';
        onSelectionChange(newSel, 'Quick Mask Paint');
      }
      qmCanvasRef.current = null;
      activeCanvasRef.current = null;
      return;
    }

    // Finalize Marquee Selection rect draft
    if (selectionRect && selectionRect.active) {
      const srcSel = emptySelection(canvasWidth, canvasHeight);

      const x0 = selectionRect.startX;
      const y0 = selectionRect.startY;
      const x1 = selectionRect.currentX;
      const y1 = selectionRect.currentY;

      if (selectionRect.shape === 'rectangle') {
        rasterizeRect(srcSel.data, canvasWidth, canvasHeight, x0, y0, x1, y1);
      } else {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rx = Math.abs(x1 - x0) / 2;
        const ry = Math.abs(y1 - y0) / 2;
        rasterizeEllipse(srcSel.data, canvasWidth, canvasHeight, cx, cy, rx, ry);
      }

      if (featherRadius > 0) {
        featherMask(srcSel.data, canvasWidth, canvasHeight, featherRadius);
      }

      srcSel.bounds = computeBounds(srcSel.data, canvasWidth, canvasHeight);
      srcSel.hasSelection = srcSel.bounds !== null;
      srcSel.shape = selectionRect.shape === 'rectangle' ? 'rect' : 'ellipse';

      const isShift = e?.shiftKey;
      const isAlt = e?.altKey;

      let finalSel: DocumentSelection;
      let label = 'Marquee Selection';

      if (isShift && isAlt && selection) {
        finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
        combineIntersect(finalSel.data, srcSel.data);
        finalSel.shape = 'none';
        finalSel.polygonPoints = undefined;
        label = 'Intersect Selection';
      } else if (isShift && selection) {
        finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
        combineAdd(finalSel.data, srcSel.data);
        finalSel.shape = 'none';
        finalSel.polygonPoints = undefined;
        label = 'Add Selection';
      } else if (isAlt && selection) {
        finalSel = cloneSelection(selection) || emptySelection(canvasWidth, canvasHeight);
        combineSubtract(finalSel.data, srcSel.data);
        finalSel.shape = 'none';
        finalSel.polygonPoints = undefined;
        label = 'Subtract Selection';
      } else {
        finalSel = srcSel;
      }

      finalSel.bounds = computeBounds(finalSel.data, canvasWidth, canvasHeight);
      finalSel.hasSelection = finalSel.bounds !== null;

      onSelectionChange(finalSel, label);
      setSelectionRect(null);
      marqueeStartPointRef.current = null;
      return;
    }

    // Commit Spot Healing on active paint layer
    if (isDrawing && activeTool === 'magic-heal' && selectedLayer && selectedLayer.type === 'paint') {
      setIsDrawing(false);
      const canvas = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (canvas) {
        applySpotHealing(canvas, healPoints, brushSize / 2);
        onCommitPaint(selectedLayer.id, canvas.toDataURL(), canvas.width, canvas.height);
      }
      setHealPoints([]);
      return;
    }

    // Release vector anchor point drag
    if (draggingPointIndex !== null) {
      setDraggingPointIndex(null);
      return;
    }

    // Gradient commit
    if (gradientDrag.active && selectedLayer && selectedLayer.type === 'paint') {
      const pc = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (pc) {
        const ctx = pc.getContext('2d');
        if (ctx) {
          ctx.save();
          
          // 1. Create a temp canvas for the gradient fill
          const fillCanvas = document.createElement('canvas');
          fillCanvas.width = selectedLayer.width;
          fillCanvas.height = selectedLayer.height;
          const fCtx = fillCanvas.getContext('2d');
          if (fCtx) {
            const lx1 = gradientDrag.startX - selectedLayer.x;
            const ly1 = gradientDrag.startY - selectedLayer.y;
            const lx2 = gradientDrag.endX - selectedLayer.x;
            const ly2 = gradientDrag.endY - selectedLayer.y;

            let grad;
            if (gradientType === 'radial') {
              const radius = Math.sqrt(Math.pow(lx2 - lx1, 2) + Math.pow(ly2 - ly1, 2));
              grad = fCtx.createRadialGradient(lx1, ly1, 0, lx1, ly1, radius);
            } else {
              grad = fCtx.createLinearGradient(lx1, ly1, lx2, ly2);
            }
            grad.addColorStop(0, primaryColor);
            grad.addColorStop(1, secondaryColor);
            fCtx.fillStyle = grad;
            fCtx.globalAlpha = brushOpacity / 100;
            fCtx.fillRect(0, 0, selectedLayer.width, selectedLayer.height);
            
            // 2. Apply selection mask if active
            if (selection && selection.hasSelection) {
              const maskCanvas = document.createElement('canvas');
              maskCanvas.width = selectedLayer.width;
              maskCanvas.height = selectedLayer.height;
              const mCtx = maskCanvas.getContext('2d');
              if (mCtx) {
                const mImgData = mCtx.createImageData(selectedLayer.width, selectedLayer.height);
                const mData = mImgData.data;
                for (let sy = 0; sy < selectedLayer.height; sy++) {
                  for (let sx = 0; sx < selectedLayer.width; sx++) {
                    const cx = selectedLayer.x + sx;
                    const cy = selectedLayer.y + sy;
                    let alpha = 0;
                    if (cx >= 0 && cx < canvasWidth && cy >= 0 && cy < canvasHeight) {
                      alpha = selection.data[cy * canvasWidth + cx];
                    }
                    const idx = (sy * selectedLayer.width + sx) * 4;
                    mData[idx] = 0;
                    mData[idx + 1] = 0;
                    mData[idx + 2] = 0;
                    mData[idx + 3] = alpha;
                  }
                }
                mCtx.putImageData(mImgData, 0, 0);
                
                fCtx.globalCompositeOperation = 'destination-in';
                fCtx.drawImage(maskCanvas, 0, 0);
              }
            }
            ctx.drawImage(fillCanvas, 0, 0);
          }
          ctx.restore();
          onCommitPaint(selectedLayer.id, pc.toDataURL(), pc.width, pc.height);
        }
      }
      setGradientDrag({ startX: 0, startY: 0, endX: 0, endY: 0, active: false });
      return;
    }

    const isMaskEdit = editTarget === 'mask' && selectedLayer && selectedLayer.hasMask;
    if (isDrawing && ['brush', 'eraser'].includes(activeTool) && isMaskEdit && selectedLayer) {
      setIsDrawing(false);
      scratchCanvasRef.current = null;
      backupCanvasRef.current = null;
      selectionMaskCanvasRef.current = null;
      const canvas = document.getElementById(`canvas-mask-${selectedLayer.id}`) as HTMLCanvasElement;
      if (canvas) {
        onCommitMask(selectedLayer.id, canvas.toDataURL());
      }
      return;
    }

    // Finalize scratch canvas drawing
    if (isDrawing && ['brush', 'eraser', 'clone', 'smudge'].includes(activeTool) && selectedLayer && selectedLayer.type === 'paint') {
      setIsDrawing(false);
      scratchCanvasRef.current = null;
      backupCanvasRef.current = null;
      selectionMaskCanvasRef.current = null;
      const canvas = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (canvas) {
        onCommitPaint(selectedLayer.id, canvas.toDataURL(), canvas.width, canvas.height);
      }
      return;
    }

    // Finalize local effect drawing
    if (isDrawing && ['blur-brush', 'sharpen-brush', 'dodge', 'burn', 'magic-heal'].includes(activeTool) && selectedLayer && selectedLayer.type === 'paint') {
      setIsDrawing(false);
      const canvas = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (canvas && activeTool !== 'magic-heal') {
        onCommitPaint(selectedLayer.id, canvas.toDataURL(), canvas.width, canvas.height);
      }
      return;
    }

    if (isDrawing && activeCanvasRef.current && selectedLayer) {
      setIsDrawing(false);
      const ctx = activeCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.restore();
      }
      onCommitPaint(selectedLayer.id, activeCanvasRef.current.toDataURL(), activeCanvasRef.current.width, activeCanvasRef.current.height);
      return;
    }

    if (tempShape.active) {
      setTempShape(prev => ({ ...prev, active: false }));
      const w = tempShape.currentX - tempShape.startX;
      const h = tempShape.currentY - tempShape.startY;
      if (Math.abs(w) > 4 && Math.abs(h) > 4) {
        onAddShapeLayerAt(
          w > 0 ? tempShape.startX : tempShape.currentX,
          h > 0 ? tempShape.startY : tempShape.currentY,
          Math.abs(w), Math.abs(h)
        );
      }
      return;
    }

    if (isTransforming) {
      setIsTransforming(false);
      setTransformHandle(null);
      if (selectedLayer) {
        const dx = (e ? (e.clientX - transformStart.x) / zoom : 0);
        const dy = (e ? (e.clientY - transformStart.y) / zoom : 0);
        let finalUpdates: Partial<Layer> = {};
        if (transformHandle === 'move') {
          finalUpdates = {
            x: Math.round(transformStart.layerX + dx),
            y: Math.round(transformStart.layerY + dy)
          };
        } else {
          let newW = transformStart.layerW, newH = transformStart.layerH;
          let newX = transformStart.layerX, newY = transformStart.layerY;
          const ratio = transformStart.layerW / transformStart.layerH;
          switch (transformHandle) {
            case 'br': newW = Math.max(10, transformStart.layerW + dx); newH = e?.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH + dy); break;
            case 'bl': newW = Math.max(10, transformStart.layerW - dx); newX = transformStart.layerX + (transformStart.layerW - newW); newH = e?.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH + dy); break;
            case 'tr': newW = Math.max(10, transformStart.layerW + dx); newH = e?.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH - dy); newY = transformStart.layerY + (transformStart.layerH - newH); break;
            case 'tl': newW = Math.max(10, transformStart.layerW - dx); newH = e?.shiftKey ? Math.round(newW / ratio) : Math.max(10, transformStart.layerH - dy); newX = transformStart.layerX + (transformStart.layerW - newW); newY = transformStart.layerY + (transformStart.layerH - newH); break;
            case 't': newH = Math.max(10, transformStart.layerH - dy); newY = transformStart.layerY + (transformStart.layerH - newH); break;
            case 'b': newH = Math.max(10, transformStart.layerH + dy); break;
            case 'l': newW = Math.max(10, transformStart.layerW - dx); newX = transformStart.layerX + (transformStart.layerW - newW); break;
            case 'r': newW = Math.max(10, transformStart.layerW + dx); break;
          }
          finalUpdates = {
            width: Math.round(newW),
            height: Math.round(newH),
            x: Math.round(newX),
            y: Math.round(newY)
          };
        }

        if (onCommitTransform) {
          onCommitTransform(selectedLayer.id, finalUpdates, 'Transform Layer');
        } else {
          if (selectedLayer.type === 'paint') {
            const pc = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
            if (pc) {
              onCommitPaint(selectedLayer.id, pc.toDataURL(), pc.width, pc.height);
            }
          }
          if (selectedLayer.hasMask) {
            const mc = document.getElementById(`canvas-mask-${selectedLayer.id}`) as HTMLCanvasElement;
            if (mc) {
              onCommitMask(selectedLayer.id, mc.toDataURL());
            }
          }
        }
      }
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(Math.max(0.1, Math.min(10, parseFloat((zoom + delta).toFixed(2)))));
  };

  const startHandleResize = (e: React.MouseEvent, handleName: string) => {
    e.stopPropagation();
    if (!selectedLayer || selectedLayer.locked) return;
    setIsTransforming(true);
    setTransformHandle(handleName);
    setTransformStart({ x: e.clientX, y: e.clientY, layerX: selectedLayer.x, layerY: selectedLayer.y, layerW: selectedLayer.width, layerH: selectedLayer.height });
  };

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (activeTool === 'hand') return 'grab';
    if (activeTool === 'zoom') return zoomDirection === 'in' ? 'zoom-in' : 'zoom-out';
    if (activeTool === 'select') return 'default';
    if (activeTool === 'eyedropper' || activeTool === 'rect-select' || activeTool === 'ellipse-select' || activeTool === 'magnetic-lasso' || activeTool === 'pen') return 'crosshair';
    if (activeTool === 'text') return 'text';
    return 'crosshair';
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = getArtboardCoords(e);
    // Check if clicking on a layer
    const clickedLayer = [...layers].reverse().find(l => {
      if (!l.visible) return false;
      return x >= l.x && x <= l.x + l.width && y >= l.y && y <= l.y + l.height;
    });
    if (clickedLayer) {
      setSelectedLayerId(clickedLayer.id);
      setContextTarget('layer');
    } else {
      setContextTarget('canvas');
    }
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const getCanvasContextItems = (): ContextMenuItem[] => {
    if (contextTarget === 'layer' && selectedLayer) {
      return [
        {
          label: `Selected: ${selectedLayer.name}`,
          disabled: true,
          icon: <MousePointer className="w-3.5 h-3.5" />,
        },
        { label: '', divider: true },
        {
          label: 'Duplicate Layer',
          icon: <CopyPlus className="w-3.5 h-3.5" />,
          shortcut: 'Ctrl+J',
          action: () => onDuplicateLayer?.(),
        },
        {
          label: 'Delete Layer',
          icon: <Trash2 className="w-3.5 h-3.5" />,
          shortcut: 'Del',
          action: () => onDeleteLayer?.(),
          danger: true,
        },
        { label: '', divider: true },
        {
          label: 'Flip Horizontal',
          icon: <FlipHorizontal className="w-3.5 h-3.5" />,
          action: () => onFlipHorizontal?.(),
        },
        {
          label: 'Flip Vertical',
          icon: <FlipVertical className="w-3.5 h-3.5" />,
          action: () => onFlipVertical?.(),
        },
        { label: '', divider: true },
        {
          label: 'Align Center',
          icon: <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />,
          action: () => onAlignLayer?.('center'),
        },
        {
          label: 'Align Middle',
          icon: <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />,
          action: () => onAlignLayer?.('middle'),
        },
        { label: '', divider: true },
        {
          label: 'Export as PNG',
          icon: <Download className="w-3.5 h-3.5" />,
          shortcut: 'Ctrl+Shift+S',
          action: onExportPng,
        },
      ];
    }

    return [
      {
        label: 'New Paint Layer',
        icon: <Plus className="w-3.5 h-3.5" />,
        action: () => onAddPaintLayer?.(),
      },
      { label: '', divider: true },
      {
        label: 'Deselect All',
        icon: <MousePointer className="w-3.5 h-3.5" />,
        shortcut: 'Ctrl+D',
        action: () => setSelectedLayerId(null),
      },
      { label: '', divider: true },
      {
        label: 'Zoom In',
        icon: <ZoomIn className="w-3.5 h-3.5" />,
        action: () => setZoom(Math.min(10, parseFloat((zoom + 0.25).toFixed(2)))),
      },
      {
        label: 'Zoom Out',
        icon: <ZoomOut className="w-3.5 h-3.5" />,
        action: () => setZoom(Math.max(0.1, parseFloat((zoom - 0.25).toFixed(2)))),
      },
      {
        label: 'Fit to View',
        icon: <Maximize2 className="w-3.5 h-3.5" />,
        action: autoFitCanvas,
      },
      { label: '', divider: true },
      {
        label: 'Flatten Image',
        icon: <Layers className="w-3.5 h-3.5" />,
        action: () => onFlattenImage?.(),
        disabled: layers.length < 2,
      },
      {
        label: 'Merge Visible',
        icon: <Minimize2 className="w-3.5 h-3.5" />,
        action: () => onMergeVisible?.(),
        disabled: layers.filter(l => l.visible).length < 2,
      },
      { label: '', divider: true },
      {
        label: 'Export as PNG',
        icon: <Download className="w-3.5 h-3.5" />,
        shortcut: 'Ctrl+Shift+S',
        action: onExportPng,
      },
      {
        label: 'Export as JPG',
        icon: <Download className="w-3.5 h-3.5" />,
        action: onExportJpg,
      },
      {
        label: 'Save Project',
        icon: <ImageIcon className="w-3.5 h-3.5" />,
        action: onExportJson,
      },
    ];
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-app select-none text-text-secondary overflow-hidden relative" id="canvas-area-host">
      {/* Utilities Bar */}
      <div
        id="quick-utilities-bar"
        className="h-9 panel-glass border-b border-border-default px-4 flex items-center justify-between shrink-0 select-none text-[11px] z-10"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-text-muted font-medium tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-text-dim" />
            {canvasWidth}×{canvasHeight}px
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <label className="flex items-center gap-1.5 px-2 py-1 bg-bg-surface border border-border-subtle rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer font-medium transition-all text-[10px]">
              <input type="file" accept=".json" onChange={onImportJson} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-[0px]" />
              <Upload className="w-3 h-3 text-text-secondary" />
              Load JSON
            </label>
          </div>
          <div className="w-px h-4 bg-border-subtle" />
          <button onClick={onExportPng} className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-white/90 active:scale-95 text-black font-bold rounded-md transition-all text-[10px] shadow-md">
            <Download className="w-3 h-3" /> Save PNG
          </button>
          <button onClick={onExportJpg} className="flex items-center gap-1 px-2 py-1 bg-bg-surface border border-border-subtle hover:bg-bg-hover text-text-secondary transition-all text-[10px] rounded-md">JPG</button>
          <button onClick={onExportJson} className="flex items-center gap-1 px-2 py-1 bg-bg-surface border border-border-subtle hover:bg-bg-hover text-text-secondary transition-all text-[10px] rounded-md" title="Save editable project">Project</button>
        </div>
      </div>

      {/* Artboard */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center workspace-grid"
        style={{ cursor: getCursor() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      >
        <div
          ref={artboardRef}
          id="editor-artboard"
          className="relative transition-shadow duration-300 shadow-2xl shadow-black/50"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center',
            border: '1px solid rgba(42, 42, 56, 0.6)',
          }}
        >
          {/* Checkerboard background */}
          <div className="absolute inset-0 checkerboard" />

          {/* Toggleable Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 editor-grid-overlay pointer-events-none z-10" />
          )}

          {/* Top Ruler (moves with canvas) */}
          {showRulers && (
            <svg
              className="absolute bg-bg-panel/95 border-b border-border-default pointer-events-none z-30 select-none overflow-visible"
              style={{ left: 0, top: '-16px', width: '100%', height: '16px' }}
            >
              {Array.from({ length: Math.ceil(canvasWidth / 20) + 1 }).map((_, i) => {
                const val = i * 20;
                const isMajor = val % 100 === 0;
                return (
                  <React.Fragment key={`tr-${i}`}>
                    <line x1={val} y1={isMajor ? 0 : 8} x2={val} y2={16} className="ruler-tick" />
                    {isMajor && <text x={val + 2} y={10} className="ruler-text">{val}</text>}
                  </React.Fragment>
                );
              })}
            </svg>
          )}

          {/* Left Ruler (moves with canvas) */}
          {showRulers && (
            <svg
              className="absolute bg-bg-panel/95 border-r border-border-default pointer-events-none z-30 select-none overflow-visible"
              style={{ left: '-16px', top: 0, width: '16px', height: '100%' }}
            >
              {Array.from({ length: Math.ceil(canvasHeight / 20) + 1 }).map((_, i) => {
                const val = i * 20;
                const isMajor = val % 100 === 0;
                return (
                  <React.Fragment key={`lr-${i}`}>
                    <line x1={isMajor ? 0 : 8} y1={val} x2={16} y2={val} className="ruler-tick" />
                    {isMajor && <text x={2} y={val + 10} className="ruler-text" transform={`rotate(-90 2,${val + 10})`}>{val}</text>}
                  </React.Fragment>
                );
              })}
            </svg>
          )}

          {/* Layers */}
          {layers.map((l, index) => {
            if (!l.visible) return null;
            return (
              <div
                key={l.id}
                id={`dom-layer-${l.id}`}
                className="absolute origin-center select-none"
                style={{
                  left: `${l.x}px`, top: `${l.y}px`,
                  width: `${l.width}px`, height: `${l.height}px`,
                  opacity: l.opacity / 100,
                  mixBlendMode: l.blendMode as any,
                  transform: `rotate(${l.rotation}deg)`,
                  filter: getFiltersForLayerIndex(index, layers),
                  WebkitMaskImage: (() => {
                    const masks: string[] = [];
                    if (l.hasMask && l.maskEnabled && l.maskDataUrl) masks.push(`url(${l.maskDataUrl})`);
                    if (l.clippingMask && clipMaskUrls[l.id]) masks.push(`url(${clipMaskUrls[l.id]})`);
                    return masks.length > 0 ? masks.join(', ') : undefined;
                  })(),
                  maskImage: (() => {
                    const masks: string[] = [];
                    if (l.hasMask && l.maskEnabled && l.maskDataUrl) masks.push(`url(${l.maskDataUrl})`);
                    if (l.clippingMask && clipMaskUrls[l.id]) masks.push(`url(${clipMaskUrls[l.id]})`);
                    return masks.length > 0 ? masks.join(', ') : undefined;
                  })(),
                  WebkitMaskSize: '100% 100%',
                  maskSize: '100% 100%',
                  WebkitMaskComposite: l.hasMask && l.maskEnabled && l.clippingMask && clipMaskUrls[l.id] ? 'destination-in' : undefined,
                  maskComposite: l.hasMask && l.maskEnabled && l.clippingMask && clipMaskUrls[l.id] ? 'intersect' : undefined,
                }}
              >
                {l.hasMask && (
                  <canvas
                    id={`canvas-mask-${l.id}`}
                    width={l.paintNativeWidth || l.width}
                    height={l.paintNativeHeight || l.height}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0"
                    aria-hidden
                  />
                )}
                {l.type === 'image' && l.imageUrl && (
                  <img id={`temp-img-${l.id}`} src={l.imageUrl} alt={l.name}
                    className="w-full h-full object-fill pointer-events-none" referrerPolicy="no-referrer" />
                )}
                {l.type === 'paint' && (
                  <canvas id={`canvas-paint-${l.id}`}
                    width={l.paintNativeWidth || l.width}
                    height={l.paintNativeHeight || l.height}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                )}
                {l.type === 'shape' && (
                  <svg className="w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                    {l.shapeType === 'rectangle' && (
                      <rect x={0} y={0} width={l.width} height={l.height}
                        fill={l.fillColor || 'transparent'} stroke={l.strokeColor || 'transparent'} strokeWidth={l.strokeWidth || 0} />
                    )}
                    {l.shapeType === 'circle' && (
                      <ellipse cx={l.width / 2} cy={l.height / 2}
                        rx={Math.max(1, l.width / 2 - (l.strokeWidth || 0) / 2)}
                        ry={Math.max(1, l.height / 2 - (l.strokeWidth || 0) / 2)}
                        fill={l.fillColor || 'transparent'} stroke={l.strokeColor || 'transparent'} strokeWidth={l.strokeWidth || 0} />
                    )}
                    {l.shapeType === 'line' && (
                      <line x1={0} y1={0} x2={l.width} y2={l.height}
                        stroke={l.strokeColor || 'transparent'} strokeWidth={l.strokeWidth || 1} />
                    )}
                    {l.shapeType === 'triangle' && (
                      <polygon points={`${l.width / 2},0 ${l.width},${l.height} 0,${l.height}`}
                        fill={l.fillColor || 'transparent'} stroke={l.strokeColor || 'transparent'} strokeWidth={l.strokeWidth || 0} />
                    )}
            {l.shapeType === 'polygon' && (
                      <polygon points={`0,${l.height} ${l.width / 2},0 ${l.width},${l.height / 2} ${l.width / 4},${l.height} ${l.width * 3 / 4},${l.height / 2}`}
                        fill={l.fillColor || 'transparent'} stroke={l.strokeColor || 'transparent'} strokeWidth={l.strokeWidth || 0} />
                    )}
                  </svg>
                )}
                {l.type === 'text' && (
                  <div style={{
                    fontFamily: l.fontFamily || 'Inter', fontSize: `${l.fontSize || 24}px`,
                    fontWeight: l.fontWeight || 'normal', color: l.fillColor || '#ffffff', lineHeight: 1.15,
                  }} className="w-full h-full truncate pointer-events-none flex items-start">
                    {l.text || 'Text'}
                  </div>
                )}
              </div>
            );
          })}


          {/* Adjustment Overlays (Split Tone, Vignette) from topmost visible adjustment layer */}
          {(() => {
            const topAdj = [...layers].reverse().find(l => l.type === 'adjustment' && l.visible && l.adjustmentParams);
            if (!topAdj || !topAdj.adjustmentParams) return null;
            const adj = topAdj.adjustmentParams;

            return (
              <div className="absolute inset-0 pointer-events-none mix-blend-color">
                {adj.shadowsIntensity > 0 && (
                  <div className="absolute inset-0 opacity-0" style={{ background: `linear-gradient(to top, ${adj.shadowsColor} 0%, transparent 60%)`, opacity: adj.shadowsIntensity / 400 }} />
                )}
                {adj.highlightsIntensity > 0 && (
                  <div className="absolute inset-0 opacity-0" style={{ background: `linear-gradient(to bottom, ${adj.highlightsColor} 0%, transparent 60%)`, opacity: adj.highlightsIntensity / 400 }} />
                )}
                {adj.midtonesIntensity > 0 && (
                  <div className="absolute inset-0" style={{ backgroundColor: adj.midtonesColor, opacity: adj.midtonesIntensity / 600 }} />
                )}
              </div>
            );
          })()}

          {/* Vignette Layer */}
          {(() => {
            const topAdj = [...layers].reverse().find(l => l.type === 'adjustment' && l.visible && l.adjustmentParams);
            if (!topAdj || !topAdj.adjustmentParams || topAdj.adjustmentParams.vignette <= 0) return null;
            
            return (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${topAdj.adjustmentParams.vignette / 100}) 100%)`
                }}
              />
            );
          })()}

          {/* Gradient drag preview */}
          {gradientDrag.active && (
            <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: canvasWidth, height: canvasHeight }}>
              <defs>
                {gradientType === 'linear' ? (
                  <linearGradient id="grad-preview" x1={gradientDrag.startX / canvasWidth} y1={gradientDrag.startY / canvasHeight}
                    x2={gradientDrag.endX / canvasWidth} y2={gradientDrag.endY / canvasHeight}>
                    <stop offset="0%" stopColor={primaryColor} />
                    <stop offset="100%" stopColor={secondaryColor} />
                  </linearGradient>
                ) : (
                  <radialGradient id="grad-preview" cx={gradientDrag.startX / canvasWidth} cy={gradientDrag.startY / canvasHeight} r={Math.sqrt((gradientDrag.endX - gradientDrag.startX) ** 2 + (gradientDrag.endY - gradientDrag.startY) ** 2) / Math.max(canvasWidth, canvasHeight)}>
                    <stop offset="0%" stopColor={primaryColor} />
                    <stop offset="100%" stopColor={secondaryColor} />
                  </radialGradient>
                )}
              </defs>
              <rect width="100%" height="100%" fill="url(#grad-preview)" opacity="0.4" />
              <line x1={gradientDrag.startX} y1={gradientDrag.startY} x2={gradientDrag.endX} y2={gradientDrag.endY}
                stroke="white" strokeWidth={1} strokeDasharray="4 2" />
            </svg>
          )}

          {/* Shape preview */}
          {tempShape.active && (
            <div
              className={`absolute border-2 border-dashed border-white bg-white/10 pointer-events-none ${activeShapeType === 'circle' ? 'rounded-full' : ''
                }`}
              style={{
                left: `${Math.min(tempShape.startX, tempShape.currentX)}px`,
                top: `${Math.min(tempShape.startY, tempShape.currentY)}px`,
                width: `${Math.abs(tempShape.currentX - tempShape.startX)}px`,
                height: `${Math.abs(tempShape.currentY - tempShape.startY)}px`,
              }}
            />
          )}

          {/* Selection outline — always visible when a layer is selected */}
          {selectedLayer && !selectedLayer.locked && (
            <div
              className="absolute border border-blue-500/40 pointer-events-none z-40"
              style={{
                left: `${selectedLayer.x}px`, top: `${selectedLayer.y}px`,
                width: `${selectedLayer.width}px`, height: `${selectedLayer.height}px`,
                transform: `rotate(${selectedLayer.rotation}deg)`,
              }}
            />
          )}

          {/* Resize handles — only in select tool (V) */}
          {activeTool === 'select' && selectedLayer && !selectedLayer.locked && (
            <div
              className="absolute border-2 border-dashed border-white/50 pointer-events-none z-40"
              style={{
                left: `${selectedLayer.x}px`, top: `${selectedLayer.y}px`,
                width: `${selectedLayer.width}px`, height: `${selectedLayer.height}px`,
                transform: `rotate(${selectedLayer.rotation}deg)`,
              }}
            >
              {/* Corner handles */}
              {[
                { key: 'tl', cx: 0, cy: 0, cls: '-translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
                { key: 'tr', cx: 1, cy: 0, cls: 'translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
                { key: 'bl', cx: 0, cy: 1, cls: '-translate-x-1/2 translate-y-1/2 cursor-nesw-resize' },
                { key: 'br', cx: 1, cy: 1, cls: 'translate-x-1/2 translate-y-1/2 cursor-nwse-resize' },
                { key: 't', cx: 0.5, cy: 0, cls: '-translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
                { key: 'b', cx: 0.5, cy: 1, cls: '-translate-x-1/2 translate-y-1/2 cursor-ns-resize' },
                { key: 'l', cx: 0, cy: 0.5, cls: '-translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
                { key: 'r', cx: 1, cy: 0.5, cls: 'translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
              ].map(({ key, cx, cy, cls }) => (
                <div
                  key={key}
                  onMouseDown={(e) => startHandleResize(e, key)}
                  className={`absolute w-[11px] h-[11px] bg-white border-2 border-blue-400 rounded-sm pointer-events-auto shadow-md hover:scale-125 transition-transform ${cls}`}
                  style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}
                  title={`Resize ${key}`}
                />
              ))}
              {/* Size label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-bg-panel/90 border border-border-default px-1.5 py-0.5 rounded text-[9px] font-mono text-text-secondary whitespace-nowrap pointer-events-none">
                {selectedLayer.width} × {selectedLayer.height}
              </div>
            </div>
          )}

          {/* Clone source indicator */}
          {activeTool === 'clone' && cloneSource && selectedLayer && (
            <div
              className="absolute border-2 border-dashed border-text-muted rounded-full pointer-events-none z-30"
              style={{
                left: `${selectedLayer.x + cloneSource.x - 10}px`,
                top: `${selectedLayer.y + cloneSource.y - 10}px`,
                width: '20px', height: '20px',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-text-muted text-[10px] font-bold">+</div>
            </div>
          )}

          {/* Quick Mask Rubylith Overlay from Selection Mask */}
          {quickMaskActive && selection && (
            <canvas
              ref={quickMaskCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="absolute inset-0 pointer-events-none z-29"
            />
          )}

          {/* Selection marching ants from committed selection bounds */}
          {selection && selection.hasSelection && selection.bounds && (
            <svg className="absolute inset-0 pointer-events-none z-40" style={{ width: canvasWidth, height: canvasHeight }}>
              {selection.shape === 'rect' ? (
                <rect
                  x={selection.bounds.x}
                  y={selection.bounds.y}
                  width={selection.bounds.w}
                  height={selection.bounds.h}
                  fill="transparent"
                  stroke="white"
                  strokeWidth={1}
                  className="marching-ants"
                />
              ) : selection.shape === 'ellipse' ? (
                <ellipse
                  cx={selection.bounds.x + selection.bounds.w / 2}
                  cy={selection.bounds.y + selection.bounds.h / 2}
                  rx={selection.bounds.w / 2}
                  ry={selection.bounds.h / 2}
                  fill="transparent"
                  stroke="white"
                  strokeWidth={1}
                  className="marching-ants"
                />
              ) : selection.shape === 'polygon' && selection.polygonPoints ? (
                <polygon
                  points={selection.polygonPoints.map((p: any) => `${p.x},${p.y}`).join(' ')}
                  fill="transparent"
                  stroke="white"
                  strokeWidth={1}
                  className="marching-ants"
                />
              ) : (
                <rect
                  x={selection.bounds.x}
                  y={selection.bounds.y}
                  width={selection.bounds.w}
                  height={selection.bounds.h}
                  fill="transparent"
                  stroke="white"
                  strokeWidth={1}
                  className="marching-ants"
                />
              )}
            </svg>
          )}

          {/* Marquee selection active drag outline */}
          {selectionRect && selectionRect.active && (
            <svg className="absolute inset-0 pointer-events-none z-40" style={{ width: canvasWidth, height: canvasHeight }}>
              {selectionRect.shape === 'rectangle' ? (
                <rect
                  x={Math.min(selectionRect.startX, selectionRect.currentX)}
                  y={Math.min(selectionRect.startY, selectionRect.currentY)}
                  width={Math.abs(selectionRect.currentX - selectionRect.startX)}
                  height={Math.abs(selectionRect.currentY - selectionRect.startY)}
                  fill="transparent"
                  stroke="white"
                  strokeWidth={1}
                  className="marching-ants"
                />
              ) : (
                <ellipse
                  cx={(selectionRect.startX + selectionRect.currentX) / 2}
                  cy={(selectionRect.startY + selectionRect.currentY) / 2}
                  rx={Math.abs(selectionRect.currentX - selectionRect.startX) / 2}
                  ry={Math.abs(selectionRect.currentY - selectionRect.startY) / 2}
                  fill="transparent"
                  stroke="white"
                  strokeWidth={1}
                  className="marching-ants"
                />
              )}
            </svg>
          )}

          {/* Lasso SVG line overlay */}
          {lassoPoints.length > 0 && (
            <svg className="absolute inset-0 pointer-events-none z-40" style={{ width: canvasWidth, height: canvasHeight }}>
              <polyline
                points={lassoPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="transparent"
                stroke="white"
                strokeWidth={1.5}
                className="marching-ants"
              />
              {lassoPoints.map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={2.5} fill="#ffffff" stroke="white" strokeWidth={0.5} />
              ))}
            </svg>
          )}

          {/* Pen vector path & draggable nodes */}
          {(vectorPath.length > 0 || activeTool === 'path-select') && (
            <svg className="absolute inset-0 pointer-events-none z-40" style={{ width: canvasWidth, height: canvasHeight }}>
              {vectorPath.length > 1 && (
                <polyline
                  points={vectorPath.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="transparent"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              )}
              {vectorPath.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={4.5}
                  fill={draggingPointIndex === i ? '#ffffff' : '#888888'}
                  stroke="white"
                  strokeWidth={1.5}
                  className="pointer-events-auto cursor-pointer"
                  onMouseDown={(e) => {
                    if (activeTool === 'path-select') {
                      e.stopPropagation();
                      setDraggingPointIndex(i);
                    }
                  }}
                />
              ))}
            </svg>
          )}

          {/* Spot healing brush painting stroke preview */}
          {activeTool === 'magic-heal' && healPoints.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none z-40" style={{ width: canvasWidth, height: canvasHeight }}>
              <polyline
                points={healPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={brushSize}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Brush cursor preview circle */}
          {brushPreviewPos && !isDrawing && (activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'clone' || activeTool === 'smudge' || activeTool === 'magic-heal' || activeTool === 'blur-brush' || activeTool === 'sharpen-brush' || activeTool === 'dodge' || activeTool === 'burn') && (
            <div
              className="absolute pointer-events-none z-50 rounded-full border-2"
              style={{
                left: `${brushPreviewPos.x - brushSize / 2}px`,
                top: `${brushPreviewPos.y - brushSize / 2}px`,
                width: `${brushSize}px`,
                height: `${brushSize}px`,
                borderColor: activeTool === 'eraser' ? 'rgba(255,100,100,0.6)' : 'rgba(255,255,255,0.5)',
                backgroundColor: activeTool === 'eraser' ? 'rgba(255,0,0,0.08)' : 'rgba(255,255,255,0.06)',
              }}
            />
          )}
        </div>
      </div>

      {/* Zoom HUD */}
      <div id="zoom-hud-controls" className="absolute bottom-8 left-4 panel-glass border border-border-default px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xl z-20">
        <button onClick={() => setZoom(Math.max(0.1, parseFloat((zoom - 0.1).toFixed(1))))}
          className="p-1 bg-bg-surface hover:bg-bg-hover rounded transition-colors text-text-muted hover:text-text-primary" title="Zoom Out">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono font-bold text-center min-w-[36px] text-text-primary">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(10, parseFloat((zoom + 0.1).toFixed(1))))}
          className="p-1 bg-bg-surface hover:bg-bg-hover rounded transition-colors text-text-muted hover:text-text-primary" title="Zoom In">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-border-subtle" />
        <button onClick={autoFitCanvas} className="p-1 bg-bg-surface hover:bg-bg-hover rounded transition-colors text-text-muted hover:text-text-primary" title="Fit to View">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { setPanX(0); setPanY(0); }}
          className="px-1.5 py-0.5 bg-bg-surface hover:bg-bg-hover rounded text-[9px] font-semibold text-text-muted hover:text-text-primary transition-colors" title="Reset Pan">
          Reset
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-8 right-4 text-[9px] text-text-dim font-mono tracking-wide panel-glass p-2 border border-border-default rounded-xl pointer-events-none hidden lg:block">
        V: Select • B: Brush • E: Eraser • S: Clone • G: Gradient • O: Dodge • T: Text • Ctrl+Z: Undo • Del: Delete • Ctrl+J: Duplicate
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getCanvasContextItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
