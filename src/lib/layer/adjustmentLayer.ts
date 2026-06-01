import { Layer, AdjustmentKind, Adjustments, DEFAULT_ADJUSTMENTS } from '../../types';

export function createAdjustmentLayer(
  canvasWidth: number,
  canvasHeight: number,
  name: string,
  params: Adjustments = { ...DEFAULT_ADJUSTMENTS },
  kind: AdjustmentKind = 'full'
): Layer {
  return {
    id: 'adj_' + Date.now(),
    name,
    type: 'adjustment',
    visible: true,
    locked: false,
    opacity: 100,
    blendMode: 'normal',
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    rotation: 0,
    adjustmentKind: kind,
    adjustmentParams: { ...params },
  };
}
