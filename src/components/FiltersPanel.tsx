/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sliders, RefreshCw, Thermometer, Palette, Sparkles, Sun,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { Adjustments, ToneCurve } from '../types';

interface FiltersPanelProps {
  target: 'none' | 'adjustment';
  adjustments: Adjustments;
  onUpdateAdjustment: (key: keyof Adjustments, value: any) => void;
  onResetAdjustments: () => void;
  onApplyPreset: (name: string) => void;
  activePreset: string;
}

export default function FiltersPanel({
  target,
  adjustments,
  onUpdateAdjustment,
  onResetAdjustments,
  onApplyPreset,
  activePreset,
}: FiltersPanelProps) {
  const [showColorGrading, setShowColorGrading] = useState(true);
  const [showBasicSliders, setShowBasicSliders] = useState(true);

  const PRESETS = [
    { name: 'Default', label: 'Original', desc: 'No modifications', gradient: 'from-gray-600 to-gray-700' },
    { name: 'WarmGlow', label: 'Warm Glow', desc: 'Golden warmth', gradient: 'from-amber-500 to-orange-600' },
    { name: 'CoolDusks', label: 'Cool Dusk', desc: 'Blue & cyan', gradient: 'from-blue-500 to-cyan-600' },
    { name: 'Cyberpunk', label: 'Cyber Neon', desc: 'Retro-futuristic', gradient: 'from-purple-500 to-pink-600' },
    { name: 'B&W', label: 'B & W', desc: 'Monochrome', gradient: 'from-gray-400 to-gray-800' },
    { name: 'ClassicSepia', label: 'Retro Sepia', desc: 'Vintage tone', gradient: 'from-amber-700 to-yellow-900' },
    { name: 'Nordic', label: 'Nordic Fade', desc: 'Desaturated', gradient: 'from-slate-400 to-blue-900' },
    { name: 'Polaroid', label: 'Polaroid', desc: 'Faded vintage', gradient: 'from-rose-300 to-amber-200' },
    { name: 'Cinematic', label: 'Cinematic', desc: 'Teal & orange', gradient: 'from-teal-500 to-orange-500' },
    { name: 'FilmNoir', label: 'Film Noir', desc: 'Dark & moody', gradient: 'from-gray-800 to-black' },
    { name: 'Sunset', label: 'Sunset', desc: 'Warm golds', gradient: 'from-orange-400 to-rose-600' },
    { name: 'Matte', label: 'Matte Film', desc: 'Faded blacks', gradient: 'from-stone-400 to-stone-700' },
    { name: 'VintageFilm', label: 'Vintage Film', desc: 'Aged look', gradient: 'from-yellow-700 to-green-900' },
    { name: 'TealOrange', label: 'Teal & Orange', desc: 'Hollywood', gradient: 'from-teal-600 to-amber-500' },
  ];

  const sliderConfig: {
    key: keyof Adjustments;
    label: string;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    icon: string;
  }[] = [
    { key: 'brightness', label: 'Brightness', min: -100, max: 100, icon: '☀' },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100, icon: '◑' },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100, icon: '✿' },
    { key: 'exposure', label: 'Exposure', min: -100, max: 100, icon: '⚡' },
    { key: 'sharpen', label: 'Sharpen', min: 0, max: 100, unit: '%', icon: '△' },
    { key: 'blur', label: 'Gaussian Blur', min: 0, max: 40, step: 0.5, unit: 'px', icon: '◌' },
    { key: 'hueRotate', label: 'Hue Shift', min: 0, max: 360, unit: '°', icon: '❂' },
    { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%', icon: '▩' },
    { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%', icon: '☕' },
    { key: 'invert', label: 'Invert', min: 0, max: 100, unit: '%', icon: '⇄' },
  ];

  const TONE_CURVES: { value: ToneCurve; label: string; svgPath: string }[] = [
    { value: 'linear', label: 'Linear', svgPath: 'M2,18 L18,2' },
    { value: 'slight-s', label: 'Slight S', svgPath: 'M2,18 Q6,14 10,10 Q14,6 18,2' },
    { value: 'medium-s', label: 'Medium S', svgPath: 'M2,18 Q4,16 8,12 Q12,4 18,2' },
    { value: 'strong-s', label: 'Strong S', svgPath: 'M2,18 Q3,17 6,14 Q10,6 14,3 Q17,1 18,2' },
    { value: 'fade', label: 'Film Fade', svgPath: 'M2,14 Q6,12 10,10 Q14,6 18,4' },
  ];

  const SHADOW_TINT_COLORS = [
    '#0044ff', '#0088ff', '#00aacc', '#008844',
    '#6600cc', '#aa0066', '#cc4400', '#884400',
  ];

  const HIGHLIGHT_TINT_COLORS = [
    '#ffffaa', '#ffddaa', '#ffbb88', '#ffaacc',
    '#ddddff', '#aaddff', '#aaffdd', '#ffffff',
  ];

  return (
    <div className="flex flex-col h-full bg-bg-panel select-none text-[11px] text-text-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-default shrink-0">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-text-muted">
          <Sliders className="w-3.5 h-3.5 text-text-muted" />
          Adjustments
        </div>
        <button
          onClick={onResetAdjustments}
          className="flex items-center gap-1 text-[10px] text-text-dim hover:text-text-primary hover:bg-bg-hover px-1.5 py-0.5 rounded transition-all"
          title="Reset All"
        >
          <RefreshCw className="w-2.5 h-2.5" />
          Reset
        </button>
      </div>

      {target === 'none' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
          <Sliders className="w-8 h-8 text-text-dim opacity-50" />
          <p className="text-text-muted text-[11px]">Select an adjustment layer to edit filters.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
        {/* Presets */}
        <div className="p-3 border-b border-border-default shrink-0 bg-bg-panel-alt">
          <span className="text-[9px] uppercase font-bold text-text-dim tracking-wider block mb-2">Presets</span>
          <div className="grid grid-cols-2 gap-1.5 max-h-[180px] overflow-y-auto pr-0.5">
            {PRESETS.map((p) => {
              const isSelected = activePreset === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => onApplyPreset(p.name)}
                  className={`relative py-2 px-2 rounded-lg border text-left flex flex-col justify-between h-[52px] transition-all overflow-hidden ${
                    isSelected
                      ? 'border-white/50 text-white shadow-sm ring-1 ring-white/20 bg-white/5'
                      : 'bg-bg-surface border-border-subtle hover:bg-bg-hover hover:border-border-hover text-text-secondary'
                  }`}
                >
                  {/* Gradient preview bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${p.gradient} rounded-t-lg`} />
                  <div className="font-semibold text-[10px] truncate mt-1">{p.label}</div>
                  <div className={`text-[8px] truncate ${isSelected ? 'text-white font-medium' : 'text-text-dim'}`}>{p.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Grading Section */}
        <div className="border-b border-border-default">
          <button
            onClick={() => setShowColorGrading(!showColorGrading)}
            className="w-full flex items-center justify-between p-3 color-grade-header hover:bg-bg-hover/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-text-muted">
              <Palette className="w-3.5 h-3.5 text-text-muted" />
              Color Grading
            </div>
            {showColorGrading ? <ChevronDown className="w-3 h-3 text-text-dim" /> : <ChevronRight className="w-3 h-3 text-text-dim" />}
          </button>

          {showColorGrading && (
            <div className="px-3 pb-3 space-y-3">
              {/* Temperature */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-text-muted font-medium flex items-center gap-1.5">
                    <Thermometer className="w-3 h-3 text-text-dim" />
                    Temperature
                  </span>
                  <span className="text-text-primary font-mono font-medium text-[10px]">
                    {adjustments.temperature > 0 ? `+${adjustments.temperature}` : adjustments.temperature}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 h-1 rounded-full top-1.5 pointer-events-none"
                    style={{ background: 'linear-gradient(to right, #4488ff, #888888, #ff8844)' }} />
                  <input
                    type="range" min={-100} max={100} value={adjustments.temperature}
                    onChange={(e) => onUpdateAdjustment('temperature', parseInt(e.target.value))}
                    className="w-full cursor-pointer relative z-10"
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>

              {/* Tint */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-text-muted font-medium flex items-center gap-1.5">
                    <span className="font-mono text-text-dim text-[9px]">◐</span>
                    Tint
                  </span>
                  <span className="text-text-primary font-mono font-medium text-[10px]">
                    {adjustments.tint > 0 ? `+${adjustments.tint}` : adjustments.tint}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 h-1 rounded-full top-1.5 pointer-events-none"
                    style={{ background: 'linear-gradient(to right, #44cc44, #888888, #cc44cc)' }} />
                  <input
                    type="range" min={-100} max={100} value={adjustments.tint}
                    onChange={(e) => onUpdateAdjustment('tint', parseInt(e.target.value))}
                    className="w-full cursor-pointer relative z-10"
                    style={{ background: 'transparent' }}
                  />
                </div>
              </div>

              {/* Vibrance */}
              <div className="space-y-0.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-text-muted font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-text-dim" />
                    Vibrance
                  </span>
                  <span className="text-text-primary font-mono font-medium text-[10px]">
                    {adjustments.vibrance > 0 ? `+${adjustments.vibrance}` : adjustments.vibrance}
                  </span>
                </div>
                <input
                  type="range" min={-100} max={100} value={adjustments.vibrance}
                  onChange={(e) => onUpdateAdjustment('vibrance', parseInt(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Shadow / Midtone / Highlight Tinting */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-text-dim tracking-wider block">
                  Split Toning
                </span>

                {/* Shadows */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted font-medium">Shadows</span>
                    <span className="text-[9px] font-mono text-text-dim">{adjustments.shadowsIntensity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {SHADOW_TINT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => onUpdateAdjustment('shadowsColor', color)}
                          className={`color-grading-swatch ${adjustments.shadowsColor === color ? 'active' : ''}`}
                          style={{
                            background: color,
                            width: '18px', height: '18px',
                            '--swatch-color': color,
                          } as React.CSSProperties}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={adjustments.shadowsColor}
                        onChange={(e) => onUpdateAdjustment('shadowsColor', e.target.value)}
                        className="w-[18px] h-[18px] rounded-full cursor-pointer border border-white/10 bg-transparent"
                        title="Custom shadow color"
                      />
                    </div>
                  </div>
                  <input
                    type="range" min={0} max={100} value={adjustments.shadowsIntensity}
                    onChange={(e) => onUpdateAdjustment('shadowsIntensity', parseInt(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Midtones */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted font-medium">Midtones</span>
                    <span className="text-[9px] font-mono text-text-dim">{adjustments.midtonesIntensity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {['#888888', '#aa8866', '#6688aa', '#88aa66', '#aa6688', '#8866aa', '#66aaaa', '#aaaaaa'].map(color => (
                        <button
                          key={color}
                          onClick={() => onUpdateAdjustment('midtonesColor', color)}
                          className={`color-grading-swatch ${adjustments.midtonesColor === color ? 'active' : ''}`}
                          style={{
                            background: color,
                            width: '18px', height: '18px',
                            '--swatch-color': color,
                          } as React.CSSProperties}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={adjustments.midtonesColor}
                        onChange={(e) => onUpdateAdjustment('midtonesColor', e.target.value)}
                        className="w-[18px] h-[18px] rounded-full cursor-pointer border border-white/10 bg-transparent"
                        title="Custom midtone color"
                      />
                    </div>
                  </div>
                  <input
                    type="range" min={0} max={100} value={adjustments.midtonesIntensity}
                    onChange={(e) => onUpdateAdjustment('midtonesIntensity', parseInt(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Highlights */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted font-medium">Highlights</span>
                    <span className="text-[9px] font-mono text-text-dim">{adjustments.highlightsIntensity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {HIGHLIGHT_TINT_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => onUpdateAdjustment('highlightsColor', color)}
                          className={`color-grading-swatch ${adjustments.highlightsColor === color ? 'active' : ''}`}
                          style={{
                            background: color,
                            width: '18px', height: '18px',
                            '--swatch-color': color,
                          } as React.CSSProperties}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={adjustments.highlightsColor}
                        onChange={(e) => onUpdateAdjustment('highlightsColor', e.target.value)}
                        className="w-[18px] h-[18px] rounded-full cursor-pointer border border-white/10 bg-transparent"
                        title="Custom highlight color"
                      />
                    </div>
                  </div>
                  <input
                    type="range" min={0} max={100} value={adjustments.highlightsIntensity}
                    onChange={(e) => onUpdateAdjustment('highlightsIntensity', parseInt(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Split Tone Balance */}
                <div className="space-y-0.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-text-muted font-medium">Balance</span>
                    <span className="text-text-primary font-mono font-medium text-[10px]">
                      {adjustments.splitToneBalance > 0 ? `+${adjustments.splitToneBalance}` : adjustments.splitToneBalance}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-text-dim">
                    <span>Shadows</span>
                    <input
                      type="range" min={-100} max={100} value={adjustments.splitToneBalance}
                      onChange={(e) => onUpdateAdjustment('splitToneBalance', parseInt(e.target.value))}
                      className="flex-1 cursor-pointer"
                    />
                    <span>Highlights</span>
                  </div>
                </div>
              </div>

              {/* Tone Curve */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-text-dim tracking-wider block">
                  Tone Curve
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {TONE_CURVES.map(tc => (
                    <button
                      key={tc.value}
                      onClick={() => onUpdateAdjustment('toneCurve', tc.value)}
                      className={`tone-curve-btn flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                        adjustments.toneCurve === tc.value
                          ? 'border-white/50 bg-white/10 text-text-primary'
                          : 'border-border-subtle bg-bg-surface hover:bg-bg-hover text-text-muted'
                      }`}
                      title={tc.label}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" className="opacity-70">
                        <rect x="0" y="0" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                        <path d={tc.svgPath} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span className="text-[7px] font-medium truncate w-full text-center">{tc.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Basic Sliders */}
        <div className="border-b border-border-default">
          <button
            onClick={() => setShowBasicSliders(!showBasicSliders)}
            className="w-full flex items-center justify-between p-3 hover:bg-bg-hover/30 transition-colors"
          >
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-text-muted">
              <Sun className="w-3.5 h-3.5 text-text-muted" />
              Color Tuning
            </div>
            {showBasicSliders ? <ChevronDown className="w-3 h-3 text-text-dim" /> : <ChevronRight className="w-3 h-3 text-text-dim" />}
          </button>

          {showBasicSliders && (
            <div className="px-3 pb-3 space-y-2.5">
              {sliderConfig.map((cfg) => {
                const val = adjustments[cfg.key] as number;
                return (
                  <div key={cfg.key} className="space-y-0.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-text-muted font-medium flex items-center gap-1.5">
                        <span className="font-mono text-text-dim select-none text-[9px]">{cfg.icon}</span>
                        {cfg.label}
                      </span>
                      <span className="text-text-primary font-mono font-medium text-[10px]">
                        {val > 0 && cfg.min < 0 ? `+${val}` : val}
                        {cfg.unit || ''}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step || 1}
                      value={val}
                      onChange={(e) => onUpdateAdjustment(cfg.key, parseFloat(e.target.value))}
                      className="w-full cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}
