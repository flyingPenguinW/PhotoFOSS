import { Adjustments } from '../../types';

export function adjustmentsToFilterCSS(adj: Adjustments): string {
  const {
    brightness,
    contrast,
    saturation,
    exposure,
    hueRotate,
    grayscale,
    invert,
    blur,
    sepia,
    temperature,
    tint,
    toneCurve,
  } = adj;

  let filterStr = `brightness(${brightness + exposure + 100}%) contrast(${contrast + 100}%) saturate(${saturation + 105}%) blur(${blur}px) grayscale(${grayscale}%) invert(${invert}%) sepia(${sepia}%) hue-rotate(${hueRotate}deg)`;

  // Temperature: warm (yellow/orange) vs cool (blue) shift
  if (temperature !== 0) {
    const tempHue = temperature > 0 ? temperature * -0.15 : temperature * 0.3;
    const tempSepia = Math.abs(temperature) * 0.08;
    filterStr += ` hue-rotate(${tempHue}deg) sepia(${tempSepia}%)`;
  }

  // Tint: green/magenta shift
  if (tint !== 0) {
    const tintHue = tint > 0 ? tint * 0.5 : tint * -0.3;
    filterStr += ` hue-rotate(${tintHue}deg)`;
  }

  // Tone curve approximation via brightness/contrast
  if (toneCurve === 'slight-s') {
    filterStr += ` contrast(105%) brightness(101%)`;
  } else if (toneCurve === 'medium-s') {
    filterStr += ` contrast(112%) brightness(102%)`;
  } else if (toneCurve === 'strong-s') {
    filterStr += ` contrast(120%) brightness(103%)`;
  } else if (toneCurve === 'fade') {
    filterStr += ` contrast(90%) brightness(108%)`;
  }

  return filterStr;
}
