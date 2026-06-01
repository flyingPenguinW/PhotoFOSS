import { Adjustments } from '../../types';
import { adjustmentsToFilterCSS } from './adjustmentsToFilterCSS';
import { drawSplitToneOverlays } from './drawSplitTone';

export function applyAdjustmentsToCanvas(
  source: HTMLCanvasElement,
  destCtx: CanvasRenderingContext2D,
  adj: Adjustments,
  opacity: number = 100
): void {
  destCtx.save();
  destCtx.filter = adjustmentsToFilterCSS(adj);
  destCtx.globalAlpha = opacity / 100;
  destCtx.drawImage(source, 0, 0);
  destCtx.restore();
  drawSplitToneOverlays(destCtx, source.width, source.height, adj);
}
