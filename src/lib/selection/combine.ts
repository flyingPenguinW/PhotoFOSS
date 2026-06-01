export function combineReplace(dest: Uint8ClampedArray, src: Uint8ClampedArray) {
  dest.set(src);
}

export function combineAdd(dest: Uint8ClampedArray, src: Uint8ClampedArray) {
  for (let i = 0; i < dest.length; i++) {
    dest[i] = Math.max(dest[i], src[i]);
  }
}

export function combineSubtract(dest: Uint8ClampedArray, src: Uint8ClampedArray) {
  for (let i = 0; i < dest.length; i++) {
    dest[i] = Math.max(0, dest[i] - src[i]);
  }
}

export function combineIntersect(dest: Uint8ClampedArray, src: Uint8ClampedArray) {
  for (let i = 0; i < dest.length; i++) {
    dest[i] = Math.min(dest[i], src[i]);
  }
}
