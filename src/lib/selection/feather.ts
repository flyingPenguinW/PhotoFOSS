export function featherMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number
) {
  if (radius <= 0) return;

  const temp = new Uint8ClampedArray(w * h);
  
  // Gaussian kernel weights
  // Standard deviation sigma = radius / 2
  const sigma = Math.max(0.5, radius / 2);
  const kSize = Math.ceil(radius * 3) * 2 + 1;
  const halfK = Math.floor(kSize / 2);
  
  const weights = new Float32Array(kSize);
  let wSum = 0;
  for (let i = 0; i < kSize; i++) {
    const x = i - halfK;
    weights[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    wSum += weights[i];
  }
  for (let i = 0; i < kSize; i++) {
    weights[i] /= wSum;
  }

  // Horizontal Pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let k = 0; k < kSize; k++) {
        const kx = Math.min(w - 1, Math.max(0, x + k - halfK));
        val += data[y * w + kx] * weights[k];
      }
      temp[y * w + x] = Math.round(val);
    }
  }

  // Vertical Pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let k = 0; k < kSize; k++) {
        const ky = Math.min(h - 1, Math.max(0, y + k - halfK));
        val += temp[ky * w + x] * weights[k];
      }
      data[y * w + x] = Math.max(0, Math.min(255, Math.round(val)));
    }
  }
}
