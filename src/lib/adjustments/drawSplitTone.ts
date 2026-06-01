import { Adjustments } from '../../types';

export function drawSplitToneOverlays(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  adj: Adjustments
): void {
  ctx.save();
  ctx.globalCompositeOperation = 'color';

  if (adj.shadowsIntensity > 0) {
    const shadowGrad = ctx.createLinearGradient(0, h, 0, 0); // bottom to top
    shadowGrad.addColorStop(0, adj.shadowsColor);
    shadowGrad.addColorStop(0.6, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.globalAlpha = adj.shadowsIntensity / 400;
    ctx.fillRect(0, 0, w, h);
  }

  if (adj.highlightsIntensity > 0) {
    const highGrad = ctx.createLinearGradient(0, 0, 0, h); // top to bottom
    highGrad.addColorStop(0, adj.highlightsColor);
    highGrad.addColorStop(0.6, 'transparent');
    ctx.fillStyle = highGrad;
    ctx.globalAlpha = adj.highlightsIntensity / 400;
    ctx.fillRect(0, 0, w, h);
  }

  if (adj.midtonesIntensity > 0) {
    ctx.fillStyle = adj.midtonesColor;
    ctx.globalAlpha = adj.midtonesIntensity / 600;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();

  // Vignette overlay
  if (adj.vignette > 0) {
    ctx.save();
    const cx = w / 2;
    const cy = h / 2;
    const rMax = Math.max(cx, cy);
    const grad = ctx.createRadialGradient(cx, cy, rMax * 0.4, cx, cy, rMax);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(0,0,0,${adj.vignette / 100})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
