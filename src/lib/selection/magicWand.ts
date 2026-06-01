export function floodFillMask(
  imageData: ImageData,
  seedX: number,
  seedY: number,
  tolerance: number,
  contiguous: boolean
): Uint8ClampedArray {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;
  const mask = new Uint8ClampedArray(w * h);

  if (seedX < 0 || seedX >= w || seedY < 0 || seedY >= h) {
    return mask;
  }

  const seedIdx = (seedY * w + seedX) * 4;
  const seedR = data[seedIdx];
  const seedG = data[seedIdx + 1];
  const seedB = data[seedIdx + 2];

  const colorMatch = (x: number, y: number): boolean => {
    const idx = (y * w + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const dist = Math.sqrt((r - seedR) ** 2 + (g - seedG) ** 2 + (b - seedB) ** 2);
    return dist <= tolerance;
  };

  if (!contiguous) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (colorMatch(x, y)) {
          mask[y * w + x] = 255;
        }
      }
    }
    return mask;
  }

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const startIdx = seedY * w + seedX;
  queue[tail++] = startIdx;
  visited[startIdx] = 1;

  const dx = [1, -1, 0, 0];
  const dy = [0, 0, 1, -1];

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % w;
    const cy = Math.floor(curr / w);

    mask[curr] = 255;

    for (let i = 0; i < 4; i++) {
      const nx = cx + dx[i];
      const ny = cy + dy[i];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (visited[nIdx] === 0) {
          visited[nIdx] = 1;
          if (colorMatch(nx, ny)) {
            queue[tail++] = nIdx;
          }
        }
      }
    }
  }

  return mask;
}
