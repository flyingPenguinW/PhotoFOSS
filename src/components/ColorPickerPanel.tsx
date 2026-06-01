/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Pipette, RotateCcw } from 'lucide-react';
import { COLOR_SWATCHES } from '../types';

interface ColorPickerPanelProps {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryChange: (color: string) => void;
  onSecondaryChange: (color: string) => void;
  onSwapColors: () => void;
  recentColors: string[];
  onAddRecentColor: (color: string) => void;
}

// Helper: HSL <-> Hex conversions
function hexToHsl(hex: string): [number, number, number] {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}

export default function ColorPickerPanel({
  primaryColor,
  secondaryColor,
  onPrimaryChange,
  onSecondaryChange,
  onSwapColors,
  recentColors,
  onAddRecentColor,
}: ColorPickerPanelProps) {
  const [editingTarget, setEditingTarget] = useState<'primary' | 'secondary'>('primary');
  const [hexInput, setHexInput] = useState(primaryColor);
  const spectrumRef = useRef<HTMLCanvasElement>(null);

  const activeColor = editingTarget === 'primary' ? primaryColor : secondaryColor;
  const onActiveChange = editingTarget === 'primary' ? onPrimaryChange : onSecondaryChange;
  const [h, s, l] = hexToHsl(activeColor);
  const [r, g, b] = hexToRgb(activeColor);

  const handleHexSubmit = () => {
    const cleaned = hexInput.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      onActiveChange(cleaned);
      onAddRecentColor(cleaned);
    }
  };

  const handleSwatchClick = (color: string) => {
    onActiveChange(color);
    setHexInput(color);
    onAddRecentColor(color);
  };

  const handleHueChange = (newH: number) => {
    const hex = hslToHex(newH, s, l);
    onActiveChange(hex);
    setHexInput(hex);
  };

  const handleSatChange = (newS: number) => {
    const hex = hslToHex(h, newS, l);
    onActiveChange(hex);
    setHexInput(hex);
  };

  const handleLightChange = (newL: number) => {
    const hex = hslToHex(h, s, newL);
    onActiveChange(hex);
    setHexInput(hex);
  };

  React.useEffect(() => {
    setHexInput(activeColor);
  }, [activeColor]);

  return (
    <div className="flex flex-col bg-bg-panel border-l border-border-default select-none text-[11px] text-text-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-text-muted">
          <Pipette className="w-3.5 h-3.5 text-accent-blue" />
          Color Picker
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Primary / Secondary selector */}
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10">
            {/* Secondary swatch */}
            <button
              onClick={() => setEditingTarget('secondary')}
              className={`absolute bottom-0 right-0 w-6 h-6 rounded border-2 transition-all ${
                editingTarget === 'secondary' ? 'border-accent-blue z-10 scale-110' : 'border-border-default z-0'
              }`}
              style={{ backgroundColor: secondaryColor }}
              title="Edit Secondary Color"
            />
            {/* Primary swatch */}
            <button
              onClick={() => setEditingTarget('primary')}
              className={`absolute top-0 left-0 w-6 h-6 rounded border-2 transition-all ${
                editingTarget === 'primary' ? 'border-accent-blue z-10 scale-110' : 'border-border-default z-0'
              }`}
              style={{ backgroundColor: primaryColor }}
              title="Edit Primary Color"
            />
            {/* Swap button */}
            <button
              onClick={onSwapColors}
              className="absolute -top-1 -right-1 w-4 h-4 bg-bg-panel border border-border-default rounded-full flex items-center justify-center text-text-dim hover:text-text-primary transition-colors z-20"
              title="Swap Colors"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex-1 ml-2">
            <div className="text-[9px] uppercase font-bold text-text-muted tracking-wider mb-1">
              {editingTarget === 'primary' ? 'Foreground' : 'Background'}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={handleHexSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleHexSubmit()}
                className="flex-1 bg-bg-surface border border-border-subtle rounded px-2 py-1 text-text-primary font-mono text-[10px] focus:outline-none focus:border-accent-blue"
                placeholder="#000000"
              />
              <div className="relative w-7 h-7 rounded border border-border-default overflow-hidden">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => {
                    onActiveChange(e.target.value);
                    setHexInput(e.target.value);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-full h-full" style={{ backgroundColor: activeColor }} />
              </div>
            </div>
          </div>
        </div>

        {/* Hue slider */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-text-muted text-[9px] font-semibold uppercase">Hue</span>
            <span className="text-text-primary font-mono text-[10px]">{h}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={h}
            onChange={(e) => handleHueChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
            }}
          />
        </div>

        {/* Saturation slider */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-text-muted text-[9px] font-semibold uppercase">Saturation</span>
            <span className="text-text-primary font-mono text-[10px]">{s}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={s}
            onChange={(e) => handleSatChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${hslToHex(h, 0, l)}, ${hslToHex(h, 100, l)})`,
            }}
          />
        </div>

        {/* Lightness slider */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-text-muted text-[9px] font-semibold uppercase">Lightness</span>
            <span className="text-text-primary font-mono text-[10px]">{l}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={l}
            onChange={(e) => handleLightChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer"
            style={{
              background: `linear-gradient(to right, #000000, ${hslToHex(h, s, 50)}, #ffffff)`,
            }}
          />
        </div>

        {/* RGB display */}
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-center">
            <div className="text-[8px] text-text-dim font-semibold uppercase">R</div>
            <div className="text-text-primary font-mono text-[10px]">{r}</div>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-center">
            <div className="text-[8px] text-text-dim font-semibold uppercase">G</div>
            <div className="text-text-primary font-mono text-[10px]">{g}</div>
          </div>
          <div className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-center">
            <div className="text-[8px] text-text-dim font-semibold uppercase">B</div>
            <div className="text-text-primary font-mono text-[10px]">{b}</div>
          </div>
        </div>

        {/* Swatches */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Swatches</span>
          <div className="grid grid-cols-6 gap-1">
            {COLOR_SWATCHES.map((color, i) => (
              <button
                key={`swatch-${i}`}
                onClick={() => handleSwatchClick(color)}
                className={`w-full aspect-square rounded-sm border transition-all hover:scale-110 ${
                  activeColor.toLowerCase() === color.toLowerCase()
                    ? 'border-accent-blue ring-1 ring-accent-blue/30'
                    : 'border-border-subtle hover:border-border-hover'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Recent colors */}
        {recentColors.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Recent</span>
            <div className="flex gap-1 flex-wrap">
              {recentColors.slice(0, 12).map((color, i) => (
                <button
                  key={`recent-${i}`}
                  onClick={() => handleSwatchClick(color)}
                  className="w-5 h-5 rounded-sm border border-border-subtle hover:border-border-hover transition-all hover:scale-110"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
