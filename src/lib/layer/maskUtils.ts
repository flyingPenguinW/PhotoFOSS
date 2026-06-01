export function createWhiteMaskDataUrl(w: number, h: number): string {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  return c.toDataURL();
}

export function createBlackMaskDataUrl(w: number, h: number): string {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  return c.toDataURL();
}

export function applyMaskToPaintData(
  paintDataUrl: string,
  maskDataUrl: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve) => {
    const paintImg = new Image();
    const maskImg = new Image();
    let loaded = 0;
    const check = () => {
      loaded++;
      if (loaded === 2) {
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(paintImg, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(maskImg, 0, 0);
        resolve(c.toDataURL());
      }
    };
    paintImg.onload = check;
    paintImg.onerror = () => resolve(paintDataUrl);
    maskImg.onload = check;
    maskImg.onerror = () => resolve(paintDataUrl);

    paintImg.src = paintDataUrl;
    maskImg.src = maskDataUrl;
  });
}
