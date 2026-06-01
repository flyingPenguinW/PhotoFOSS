import { Layer } from '../../types';
import { applyAdjustmentsToCanvas } from '../adjustments/applyAdjustments';

export function getCanvasBlendMode(mode: string): GlobalCompositeOperation {
  switch (mode) {
    case 'multiply': return 'multiply';
    case 'screen': return 'screen';
    case 'overlay': return 'overlay';
    case 'darken': return 'darken';
    case 'lighten': return 'lighten';
    case 'color-dodge': return 'color-dodge';
    case 'color-burn': return 'color-burn';
    case 'hard-light': return 'hard-light';
    case 'soft-light': return 'soft-light';
    case 'difference': return 'difference';
    case 'exclusion': return 'exclusion';
    case 'hue': return 'hue';
    case 'saturation': return 'saturation';
    case 'color': return 'color';
    case 'luminosity': return 'luminosity';
    default: return 'source-over';
  }
}

export interface CompositeOptions {
  getPaintCanvas: (id: string) => HTMLCanvasElement | null;
  getMaskCanvas: (id: string) => HTMLCanvasElement | null;
  getImageElement?: (id: string) => HTMLImageElement | null;
}

/**
 * Draw a single layer's content (paint, image, shape, text) onto a temp canvas
 * at layer-local coordinates (0,0 → w,h). Does NOT apply mask.
 */
function drawLayerContent(
  tCtx: CanvasRenderingContext2D,
  layer: Layer,
  w: number,
  h: number,
  options: CompositeOptions
): void {
  if (layer.type === 'image' && layer.imageUrl) {
    const img = options.getImageElement
      ? options.getImageElement(layer.id)
      : (document.getElementById(`temp-img-${layer.id}`) as HTMLImageElement);
    if (img && img.complete) {
      tCtx.drawImage(img, 0, 0, w, h);
    }
  } else if (layer.type === 'paint') {
    const pc = options.getPaintCanvas(layer.id);
    if (pc) {
      tCtx.drawImage(pc, 0, 0, w, h);
    }
  } else if (layer.type === 'shape') {
    tCtx.fillStyle = layer.fillColor || '#ffffff';
    tCtx.strokeStyle = layer.strokeColor || 'transparent';
    tCtx.lineWidth = layer.strokeWidth || 0;
    if (layer.shapeType === 'rectangle') {
      tCtx.fillRect(0, 0, w, h);
      if (layer.strokeWidth) tCtx.strokeRect(0, 0, w, h);
    } else if (layer.shapeType === 'circle') {
      tCtx.beginPath();
      tCtx.arc(w / 2, h / 2, Math.max(1, Math.min(w, h) / 2 - (layer.strokeWidth || 0) / 2), 0, 2 * Math.PI);
      tCtx.fill();
      if (layer.strokeWidth) tCtx.stroke();
    } else if (layer.shapeType === 'line') {
      tCtx.beginPath();
      tCtx.moveTo(0, 0);
      tCtx.lineTo(w, h);
      tCtx.stroke();
    } else if (layer.shapeType === 'triangle') {
      tCtx.beginPath();
      tCtx.moveTo(w / 2, 0);
      tCtx.lineTo(w, h);
      tCtx.lineTo(0, h);
      tCtx.closePath();
      tCtx.fill();
      if (layer.strokeWidth) tCtx.stroke();
    }
  } else if (layer.type === 'text') {
    tCtx.fillStyle = layer.fillColor || '#ffffff';
    tCtx.font = `${layer.fontWeight || 'normal'} ${layer.fontSize || 24}px ${layer.fontFamily || 'Inter'}`;
    tCtx.textBaseline = 'top';
    tCtx.fillText(layer.text || '', 0, 0);
  }
}

/**
 * Draw a single layer with its layer mask applied, positioned at
 * (layer.x, layer.y) on the destination context.
 */
export function drawLayerWithMask(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  options: CompositeOptions
): void {
  const w = layer.width;
  const h = layer.height;
  if (w <= 0 || h <= 0) return;

  // 1. Create offscreen temp canvas for layer contents
  const temp = document.createElement('canvas');
  temp.width = w;
  temp.height = h;
  const tCtx = temp.getContext('2d');
  if (!tCtx) return;

  // 2. Draw base content to temp
  drawLayerContent(tCtx, layer, w, h, options);

  // 3. Apply layer mask if enabled and exists
  if (layer.hasMask && layer.maskEnabled) {
    const mc = options.getMaskCanvas(layer.id);
    if (mc) {
      tCtx.globalCompositeOperation = 'destination-in';
      tCtx.drawImage(mc, 0, 0, w, h);
    }
  }

  // 4. Draw temp to destination context with opacity and blend mode
  ctx.save();
  ctx.globalAlpha = layer.opacity / 100;
  ctx.globalCompositeOperation = getCanvasBlendMode(layer.blendMode);
  
  // Apply rotation
  ctx.translate(layer.x + w / 2, layer.y + h / 2);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.drawImage(temp, -w / 2, -h / 2);
  
  ctx.restore();
}

/**
 * Identify clipping groups in a layer stack.
 * A clipping group is: a base layer (clippingMask !== true) followed
 * by one or more layers with clippingMask === true.
 * Returns an array of groups; each group is an array of layers (base first).
 */
function identifyClippingGroups(layers: Layer[]): Layer[][] {
  const groups: Layer[][] = [];
  let currentGroup: Layer[] = [];

  for (const layer of layers) {
    if (layer.clippingMask && currentGroup.length > 0) {
      // This layer clips to the group below
      currentGroup.push(layer);
    } else {
      // New base layer — flush previous group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [layer];
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Composite an entire layer stack (clipping-group-aware) onto `ctx`.
 * Handles clipping masks by compositing each group onto a temp canvas,
 * then masking clipped layers to the base layer's alpha.
 */
export function compositeLayerStack(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number,
  options: CompositeOptions
): void {
  let buffer = document.createElement('canvas');
  buffer.width = canvasWidth;
  buffer.height = canvasHeight;
  let bCtx = buffer.getContext('2d');
  if (!bCtx) return;

  const groups = identifyClippingGroups(layers);

  for (const group of groups) {
    const base = group[0];
    if (!base.visible) {
      // If base is hidden, skip the entire clipping group
      // (but still draw non-clipping layers that follow)
      for (let i = 1; i < group.length; i++) {
        const layer = group[i];
        if (!layer.clippingMask && layer.visible) {
          if (layer.type === 'adjustment' && layer.adjustmentParams) {
            const next = document.createElement('canvas');
            next.width = canvasWidth;
            next.height = canvasHeight;
            const nCtx = next.getContext('2d');
            if (nCtx) {
              applyAdjustmentsToCanvas(buffer, nCtx, layer.adjustmentParams, layer.opacity);
              buffer = next;
              bCtx = nCtx;
            }
          } else if (layer.type !== 'adjustment') {
            drawLayerWithMask(bCtx, layer, options);
          }
        }
      }
      continue;
    }

    if (base.type === 'adjustment') {
      if (base.adjustmentParams) {
        const next = document.createElement('canvas');
        next.width = canvasWidth;
        next.height = canvasHeight;
        const nCtx = next.getContext('2d');
        if (nCtx) {
          applyAdjustmentsToCanvas(buffer, nCtx, base.adjustmentParams, base.opacity);
          buffer = next;
          bCtx = nCtx;
        }
      }
      // Process any remaining layers in the group that aren't clipped
      for (let i = 1; i < group.length; i++) {
        const layer = group[i];
        if (!layer.clippingMask && layer.visible) {
          if (layer.type === 'adjustment' && layer.adjustmentParams) {
            const next = document.createElement('canvas');
            next.width = canvasWidth;
            next.height = canvasHeight;
            const nCtx = next.getContext('2d');
            if (nCtx) {
              applyAdjustmentsToCanvas(buffer, nCtx, layer.adjustmentParams, layer.opacity);
              buffer = next;
              bCtx = nCtx;
            }
          } else if (layer.type !== 'adjustment') {
            drawLayerWithMask(bCtx, layer, options);
          }
        }
      }
      continue;
    }

    if (group.length === 1) {
      // No clipping — just draw normally
      drawLayerWithMask(bCtx, base, options);
      continue;
    }

    // Clipping group: composite onto a temp canvas
    const groupCanvas = document.createElement('canvas');
    groupCanvas.width = canvasWidth;
    groupCanvas.height = canvasHeight;
    const gCtx = groupCanvas.getContext('2d');
    if (!gCtx) continue;

    // Draw the base layer first
    drawLayerWithMask(gCtx, base, options);

    // For each clipped layer, draw it clipped to the base's alpha
    for (let i = 1; i < group.length; i++) {
      const clippedLayer = group[i];
      if (!clippedLayer.visible) continue;
      
      if (clippedLayer.type === 'adjustment') {
        // Adjustment layers as clipping masks are not fully supported in MVP.
        // For now, we skip them.
        continue;
      }

      // Render the clipped layer to its own temp canvas
      const clippedCanvas = document.createElement('canvas');
      clippedCanvas.width = canvasWidth;
      clippedCanvas.height = canvasHeight;
      const cCtx = clippedCanvas.getContext('2d');
      if (!cCtx) continue;

      drawLayerWithMask(cCtx, clippedLayer, options);

      // Mask the clipped layer to only show where base has alpha
      cCtx.globalCompositeOperation = 'destination-in';
      cCtx.drawImage(groupCanvas, 0, 0);

      // Draw the masked result onto the group canvas
      gCtx.globalCompositeOperation = 'source-over';
      gCtx.drawImage(clippedCanvas, 0, 0);
    }

    // Draw the finished group canvas onto the main running buffer
    bCtx.drawImage(groupCanvas, 0, 0);
  }

  // Draw the final buffer onto the destination context
  ctx.drawImage(buffer, 0, 0);
}

/**
 * Composite all visible layers into a single data URL.
 * Used by merge/flatten/export. Clipping-group-aware.
 */
export function compositeLayersToDataUrl(
  layers: Layer[],
  canvasWidth: number,
  canvasHeight: number,
  options: CompositeOptions,
  filterCSS?: string
): string {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvasWidth;
  exportCanvas.height = canvasHeight;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return '';

  if (filterCSS) {
    ctx.filter = filterCSS;
  }

  const visibleLayers = layers.filter(l => l.visible);
  compositeLayerStack(ctx, visibleLayers, canvasWidth, canvasHeight, options);

  return exportCanvas.toDataURL();
}
