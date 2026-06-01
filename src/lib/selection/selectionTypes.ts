import { DocumentSelection } from '../../types';

export function emptySelection(w: number, h: number): DocumentSelection {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h), // All zeros
    shape: 'none',
    bounds: null,
    hasSelection: false,
  };
}

export function cloneSelection(sel: DocumentSelection | null): DocumentSelection | null {
  if (!sel) return null;
  const newData = new Uint8ClampedArray(sel.data.length);
  newData.set(sel.data);
  return {
    width: sel.width,
    height: sel.height,
    data: newData,
    shape: sel.shape,
    bounds: sel.bounds ? { ...sel.bounds } : null,
    hasSelection: sel.hasSelection,
    polygonPoints: sel.polygonPoints ? sel.polygonPoints.map(p => ({ ...p })) : undefined,
  };
}

export function computeBounds(
  data: Uint8ClampedArray,
  w: number,
  h: number
): { x: number; y: number; w: number; h: number } | null {
  let minX = w;
  let maxX = -1;
  let minY = h;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

export function hasActiveSelection(sel: DocumentSelection | null): boolean {
  return !!sel?.hasSelection && sel.bounds !== null;
}

export function selectionAlpha(sel: DocumentSelection | null, x: number, y: number): number {
  if (!sel?.hasSelection) return 255; // no selection = full canvas editable
  if (x < 0 || y < 0 || x >= sel.width || y >= sel.height) return 0;
  return sel.data[y * sel.width + x];
}

export interface SerializedSelection {
  width: number;
  height: number;
  data: string; // base64
  shape: string;
  bounds: { x: number; y: number; w: number; h: number } | null;
  hasSelection: boolean;
  polygonPoints?: { x: number; y: number }[];
}

export function selectionToJSON(sel: DocumentSelection | null): SerializedSelection | null {
  if (!sel) return null;
  let binary = '';
  const len = sel.data.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(sel.data[i]);
  }
  const base64 = btoa(binary);
  
  return {
    width: sel.width,
    height: sel.height,
    data: base64,
    shape: sel.shape,
    bounds: sel.bounds,
    hasSelection: sel.hasSelection,
    polygonPoints: sel.polygonPoints,
  };
}

export function selectionFromJSON(json: SerializedSelection | null): DocumentSelection | null {
  if (!json) return null;
  const binary = atob(json.data);
  const data = new Uint8ClampedArray(binary.length);
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i);
  }
  return {
    width: json.width,
    height: json.height,
    data: data,
    shape: json.shape as any,
    bounds: json.bounds,
    hasSelection: json.hasSelection,
    polygonPoints: json.polygonPoints,
  };
}

