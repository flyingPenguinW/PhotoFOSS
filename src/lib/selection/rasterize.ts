export function rasterizeRect(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const left = Math.max(0, Math.min(Math.floor(x0), Math.floor(x1)));
  const right = Math.min(w - 1, Math.max(Math.floor(x0), Math.floor(x1)));
  const top = Math.max(0, Math.min(Math.floor(y0), Math.floor(y1)));
  const bottom = Math.min(h - 1, Math.max(Math.floor(y0), Math.floor(y1)));

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      data[y * w + x] = 255;
    }
  }
}

export function rasterizeEllipse(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
) {
  if (rx < 0.5 || ry < 0.5) return;

  const left = Math.max(0, Math.floor(cx - rx));
  const right = Math.min(w - 1, Math.ceil(cx + rx));
  const top = Math.max(0, Math.floor(cy - ry));
  const bottom = Math.min(h - 1, Math.ceil(cy + ry));

  const rxSq = rx * rx;
  const rySq = ry * ry;

  for (let y = top; y <= bottom; y++) {
    const dy = y - cy;
    const dySq = dy * dy;
    for (let x = left; x <= right; x++) {
      const dx = x - cx;
      const dxSq = dx * dx;
      if (dxSq / rxSq + dySq / rySq <= 1.0) {
        data[y * w + x] = 255;
      }
    }
  }
}

export function rasterizePolygon(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  points: { x: number; y: number }[]
) {
  if (points.length < 3) return;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.fill();

  const imgData = ctx.getImageData(0, 0, w, h);
  const tempPixels = imgData.data;

  // Copy values into selection mask
  for (let i = 0; i < w * h; i++) {
    if (tempPixels[i * 4] > 0) {
      data[i] = tempPixels[i * 4];
    }
  }
}
