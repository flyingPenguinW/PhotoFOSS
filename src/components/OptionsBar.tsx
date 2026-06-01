/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Type, Bold, AlignCenter, AlignLeft,
  Undo2, Redo2, Trash2, Layers, Scissors,
  Shield, Feather, Target, Sliders
} from 'lucide-react';
import { ToolType, ShapeType, GradientType, TonalRange, FONTS, SHAPE_TYPES, Layer } from '../types';

interface OptionsBarProps {
  activeTool: ToolType;
  selectedLayer: Layer | null;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushOpacity: number;
  setBrushOpacity: (opacity: number) => void;
  brushHardness: number;
  setBrushHardness: (hardness: number) => void;

  activeShapeType: ShapeType;
  setActiveShapeType: (type: ShapeType) => void;
  shapeStrokeWidth: number;
  setShapeStrokeWidth: (w: number) => void;

  textValue: string;
  setTextValue: (t: string) => void;
  textFontSize: number;
  setTextFontSize: (size: number) => void;
  textFontFamily: string;
  setTextFontFamily: (font: string) => void;
  textFontWeight: string;
  setTextFontWeight: (weight: string) => void;

  onAlignLayer: (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onFlipLayer: (direction: 'horizontal' | 'vertical') => void;
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;

  tempCanvasWidth: number;
  setTempCanvasWidth: (w: number) => void;
  tempCanvasHeight: number;
  setTempCanvasHeight: (h: number) => void;
  onApplyCrop: () => void;

  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  // New tool options
  antiAliasing: boolean;
  onToggleAntiAliasing: () => void;
  featherRadius: number;
  setFeatherRadius: (r: number) => void;
  gradientType: GradientType;
  setGradientType: (t: GradientType) => void;
  cloneAligned: boolean;
  setCloneAligned: (v: boolean) => void;
  wandTolerance: number;
  setWandTolerance: (t: number) => void;
  wandContiguous: boolean;
  setWandContiguous: (v: boolean) => void;
  dodgeBurnExposure: number;
  setDodgeBurnExposure: (e: number) => void;
  dodgeBurnRange: TonalRange;
  setDodgeBurnRange: (r: TonalRange) => void;
  blurSharpenStrength: number;
  setBlurSharpenStrength: (s: number) => void;
  zoomDirection?: 'in' | 'out';
  setZoomDirection?: (d: 'in' | 'out') => void;
  onClearVectorPath?: () => void;
  onCloseVectorPath?: () => void;
  editTarget?: 'layer' | 'mask';
}

function SliderControl({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted whitespace-nowrap">{label}:</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-20 cursor-pointer"
      />
      <span className="text-text-primary font-mono min-w-[32px] text-right">{value}{unit || ''}</span>
    </div>
  );
}

export default function OptionsBar(props: OptionsBarProps) {
  const {
    activeTool, selectedLayer,
    brushSize, setBrushSize, brushOpacity, setBrushOpacity, brushHardness, setBrushHardness,
    activeShapeType, setActiveShapeType, shapeStrokeWidth, setShapeStrokeWidth,
    textValue, setTextValue, textFontSize, setTextFontSize,
    textFontFamily, setTextFontFamily, textFontWeight, setTextFontWeight,
    onAlignLayer, onFlipLayer, onDeleteLayer, onDuplicateLayer,
    tempCanvasWidth, setTempCanvasWidth, tempCanvasHeight, setTempCanvasHeight, onApplyCrop,
    canUndo, canRedo, onUndo, onRedo,
    antiAliasing, onToggleAntiAliasing, featherRadius, setFeatherRadius,
    gradientType, setGradientType,
    cloneAligned, setCloneAligned,
    wandTolerance, setWandTolerance, wandContiguous, setWandContiguous,
    dodgeBurnExposure, setDodgeBurnExposure, dodgeBurnRange, setDodgeBurnRange,
    blurSharpenStrength, setBlurSharpenStrength,
    zoomDirection = 'in', setZoomDirection,
    onClearVectorPath, onCloseVectorPath,
    editTarget,
  } = props;

  const renderToolLabel = () => {
    const labels: Partial<Record<ToolType, string>> = {
      'select': 'Move', 'brush': 'Brush', 'eraser': 'Eraser', 'shape': 'Shape',
      'text': 'Text', 'paintbucket': 'Fill', 'eyedropper': 'Eyedropper', 'crop': 'Resize',
      'clone': 'Clone Stamp', 'gradient': 'Gradient', 'blur-brush': 'Blur Brush',
      'sharpen-brush': 'Sharpen', 'dodge': 'Dodge', 'burn': 'Burn', 'smudge': 'Smudge',
      'magic-wand': 'Magic Wand', 'pen': 'Pen',
      'rect-select': 'Rect Select', 'ellipse-select': 'Ellipse Select',
      'magnetic-lasso': 'Lasso', 'magic-heal': 'Spot Healing', 'path-select': 'Path Select',
      'hand': 'Hand Tool', 'zoom': 'Zoom Tool',
    };
    return labels[activeTool] || activeTool;
  };

  return (
    <div
      id="editor-optionsbar"
      className="h-9 bg-bg-panel border-b border-border-default flex items-center justify-between px-3 text-[11px] text-text-secondary select-none overflow-x-auto gap-3"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0" id="tool-specific-options">
        {/* Tool label */}
        <span className="font-semibold text-text-dim text-[10px] uppercase tracking-wider whitespace-nowrap hidden sm:inline">
          {renderToolLabel()}
        </span>
        <div className="w-px h-4 bg-border-subtle" />

        {editTarget === 'mask' && (
          <>
            <div className="bg-white/10 border border-white/20 text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wide whitespace-nowrap">
              Editing Layer Mask (White reveals, Black conceals)
            </div>
            <div className="w-px h-4 bg-border-subtle" />
          </>
        )}

        {/* SELECT TOOL */}
        {activeTool === 'select' && (
          <div className="flex items-center gap-3">
            {selectedLayer ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-dim font-mono text-[10px]">Layer:</span>
                  <span className="font-medium text-text-primary max-w-[100px] truncate">{selectedLayer.name}</span>
                </div>
                <div className="w-px h-4 bg-border-subtle" />
                <div className="flex items-center gap-1">
                  <span className="text-text-dim">Align:</span>
                  {(['left', 'center', 'right'] as const).map(a => (
                    <button key={a} onClick={() => onAlignLayer(a)} className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-text-primary" title={`Align ${a}`}>
                      <AlignCenter className="w-3 h-3" />
                    </button>
                  ))}
                </div>
                <div className="w-px h-4 bg-border-subtle" />
                <div className="flex items-center gap-1">
                  <button onClick={() => onFlipLayer('horizontal')} className="px-1.5 py-0.5 bg-bg-surface hover:bg-bg-hover rounded text-[10px]" title="Flip H">H-Flip</button>
                  <button onClick={() => onFlipLayer('vertical')} className="px-1.5 py-0.5 bg-bg-surface hover:bg-bg-hover rounded text-[10px]" title="Flip V">V-Flip</button>
                </div>
                <div className="w-px h-4 bg-border-subtle" />
                <button onClick={onDuplicateLayer} className="flex items-center gap-1 px-1.5 py-0.5 bg-bg-surface hover:bg-bg-hover rounded text-text-secondary hover:text-text-primary text-[10px]">
                  <Layers className="w-3 h-3 text-text-primary" /> Duplicate
                </button>
                <button onClick={onDeleteLayer} className="flex items-center gap-1 px-1.5 py-0.5 hover:bg-white/10 hover:text-white text-text-muted rounded text-[10px]">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            ) : (
              <span className="text-text-dim text-[10px]">Click a layer to select it</span>
            )}
          </div>
        )}

        {/* MARQUEE SELECT TOOLS */}
        {(activeTool === 'rect-select' || activeTool === 'ellipse-select') && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onToggleAntiAliasing}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                antiAliasing ? 'bg-white/10 text-white border border-white/20' : 'text-text-dim hover:text-text-muted bg-bg-surface'
              }`}
              title="Toggle Anti-Aliasing"
            >
              <Shield className="w-3 h-3" /> Anti-Alias
            </button>
            <SliderControl label="Feather" value={featherRadius} min={0} max={100} unit="px" onChange={setFeatherRadius} />
            <span className="text-text-dim text-[10px]">Click and drag on canvas to define selection marquee</span>
          </div>
        )}

        {/* MAGNETIC LASSO */}
        {activeTool === 'magnetic-lasso' && (
          <div className="flex items-center gap-3 flex-wrap">
            <SliderControl label="Feather" value={featherRadius} min={0} max={50} unit="px" onChange={setFeatherRadius} />
            <span className="text-text-dim text-[10px]">Click to add points, snap to edges. Close selection loop or double click to complete</span>
          </div>
        )}

        {/* MAGICAL SPOT HEAL */}
        {activeTool === 'magic-heal' && (
          <div className="flex items-center gap-3 flex-wrap">
            <SliderControl label="Size" value={brushSize} min={1} max={200} unit="px" onChange={setBrushSize} />
            <SliderControl label="Hardness" value={brushHardness} min={0} max={100} unit="%" onChange={setBrushHardness} />
            <span className="text-text-dim text-[10px]">Paint over spots, blemishes, or details to heal them automatically</span>
          </div>
        )}

        {/* PATH SELECT */}
        {activeTool === 'path-select' && (
          <div className="flex items-center gap-3">
            <span className="text-text-dim text-[10px]">Drag vector anchor points to modify path shape</span>
            {onCloseVectorPath && (
              <button onClick={onCloseVectorPath} className="px-2 py-0.5 bg-bg-surface hover:bg-bg-hover text-text-secondary rounded text-[10px] cursor-pointer">
                Close Path
              </button>
            )}
            {onClearVectorPath && (
              <button onClick={onClearVectorPath} className="px-2 py-0.5 hover:bg-white/10 hover:text-white text-text-muted rounded text-[10px] cursor-pointer">
                Clear Path
              </button>
            )}
          </div>
        )}

        {/* HAND TOOL */}
        {activeTool === 'hand' && (
          <span className="text-text-dim text-[10px]">Click and drag on canvas to pan around artboard (Or hold Spacebar anytime)</span>
        )}

        {/* ZOOM TOOL */}
        {activeTool === 'zoom' && (
          <div className="flex items-center gap-3">
            <span className="text-text-muted">Zoom Mode:</span>
            <div className="flex bg-bg-surface border border-border-subtle rounded p-0.5">
              {(['in', 'out'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setZoomDirection?.(d)}
                  className={`px-3 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    zoomDirection === d ? 'bg-white text-black' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Zoom {d === 'in' ? 'In (+)' : 'Out (-)'}
                </button>
              ))}
            </div>
            <span className="text-text-dim text-[10px]">Click canvas to scale (Alt+Click to toggle zoom mode)</span>
          </div>
        )}

        {/* BRUSH / ERASER / CLONE / SMUDGE */}
        {(activeTool === 'brush' || activeTool === 'eraser' || activeTool === 'clone' || activeTool === 'smudge') && (
          <div className="flex items-center gap-3 flex-wrap">
            <SliderControl label="Size" value={brushSize} min={1} max={200} unit="px" onChange={setBrushSize} />
            <SliderControl label="Opacity" value={brushOpacity} min={1} max={100} unit="%" onChange={setBrushOpacity} />
            <SliderControl label="Hardness" value={brushHardness} min={0} max={100} unit="%" onChange={setBrushHardness} />
            {activeTool === 'clone' && (
              <>
                <div className="w-px h-4 bg-border-subtle" />
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={cloneAligned} onChange={(e) => setCloneAligned(e.target.checked)} className="accent-white w-3 h-3" />
                  <span className="text-text-muted text-[10px]">Aligned</span>
                </label>
                <span className="text-text-dim text-[10px]">Alt+Click to set source</span>
              </>
            )}
            <div className="w-px h-4 bg-border-subtle" />
            <button
              onClick={onToggleAntiAliasing}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                antiAliasing ? 'bg-white/10 text-white border border-white/20' : 'text-text-dim hover:text-text-muted bg-bg-surface'
              }`}
              title="Toggle Anti-Aliasing"
            >
              <Shield className="w-3 h-3" /> AA
            </button>
            <SliderControl label="Feather" value={featherRadius} min={0} max={50} unit="px" onChange={setFeatherRadius} />
          </div>
        )}

        {/* BLUR / SHARPEN BRUSH */}
        {(activeTool === 'blur-brush' || activeTool === 'sharpen-brush') && (
          <div className="flex items-center gap-3 flex-wrap">
            <SliderControl label="Size" value={brushSize} min={1} max={200} unit="px" onChange={setBrushSize} />
            <SliderControl label="Strength" value={blurSharpenStrength} min={1} max={100} unit="%" onChange={setBlurSharpenStrength} />
            <span className="text-text-dim text-[10px]">
              {activeTool === 'blur-brush' ? 'Paint to blur areas' : 'Paint to sharpen areas'}
            </span>
          </div>
        )}

        {/* DODGE / BURN */}
        {(activeTool === 'dodge' || activeTool === 'burn') && (
          <div className="flex items-center gap-3 flex-wrap">
            <SliderControl label="Size" value={brushSize} min={1} max={200} unit="px" onChange={setBrushSize} />
            <SliderControl label="Exposure" value={dodgeBurnExposure} min={1} max={100} unit="%" onChange={setDodgeBurnExposure} />
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Range:</span>
              <div className="flex bg-bg-surface border border-border-subtle rounded p-0.5">
                {(['shadows', 'midtones', 'highlights'] as TonalRange[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setDodgeBurnRange(r)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      dodgeBurnRange === r ? 'bg-white text-black font-bold' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-text-dim text-[10px]">
              {activeTool === 'dodge' ? 'Lighten areas' : 'Darken areas'}
            </span>
          </div>
        )}

        {/* MAGIC WAND */}
        {activeTool === 'magic-wand' && (
          <div className="flex items-center gap-3 flex-wrap">
            <SliderControl label="Tolerance" value={wandTolerance} min={0} max={255} onChange={setWandTolerance} />
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={wandContiguous} onChange={(e) => setWandContiguous(e.target.checked)} className="accent-white w-3 h-3" />
              <span className="text-text-muted text-[10px]">Contiguous</span>
            </label>
            <button
              onClick={onToggleAntiAliasing}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                antiAliasing ? 'bg-white/10 text-white border border-white/20' : 'text-text-dim bg-bg-surface'
              }`}
            >
              <Shield className="w-3 h-3" /> Anti-Alias
            </button>
            <span className="text-text-dim text-[10px]">Click to select by color</span>
          </div>
        )}

        {/* GRADIENT */}
        {activeTool === 'gradient' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Type:</span>
              <div className="flex bg-bg-surface border border-border-subtle rounded p-0.5">
                {(['linear', 'radial'] as GradientType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setGradientType(t)}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                      gradientType === t ? 'bg-white text-black font-bold' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-text-dim text-[10px]">Click-drag on canvas (uses primary → secondary color)</span>
          </div>
        )}

        {/* Marquee Select instructions / details can render here */}

        {/* PEN TOOL */}
        {activeTool === 'pen' && (
          <div className="flex items-center gap-3">
            <span className="text-text-dim text-[10px]">Click to add anchor points • Drag for curves • Close path to complete</span>
          </div>
        )}

        {/* SHAPE */}
        {activeTool === 'shape' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Type:</span>
              <div className="flex bg-bg-surface border border-border-subtle rounded p-0.5">
                {SHAPE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setActiveShapeType(type.value)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      activeShapeType === type.value ? 'bg-white text-black' : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <SliderControl label="Stroke" value={shapeStrokeWidth} min={0} max={30} unit="px" onChange={setShapeStrokeWidth} />
            <span className="text-text-dim text-[10px]">(Primary fill / Secondary stroke)</span>
          </div>
        )}

        {/* TEXT */}
        {activeTool === 'text' && (
          <div className="flex items-center gap-2 w-full max-w-4xl" id="options-text">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Font:</span>
              <select
                value={textFontFamily}
                onChange={(e) => setTextFontFamily(e.target.value)}
                className="bg-bg-surface border border-border-subtle px-2 py-0.5 rounded text-text-primary focus:outline-none focus:border-white text-[10px]"
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={5}
                max={300}
                value={textFontSize}
                onChange={(e) => setTextFontSize(Math.max(5, parseInt(e.target.value) || 12))}
                className="w-12 bg-bg-surface border border-border-subtle text-center px-1 py-0.5 rounded text-text-primary font-mono text-[10px]"
              />
              <span className="text-text-dim">px</span>
            </div>
            <button
              onClick={() => setTextFontWeight(textFontWeight === 'bold' ? 'normal' : 'bold')}
              className={`p-1 rounded transition-colors ${
                textFontWeight === 'bold' ? 'bg-white/15 text-white border border-white/25' : 'text-text-muted hover:bg-bg-hover'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
              <span className="text-text-muted">Text:</span>
              <input
                type="text"
                id="text-content-input"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Click canvas to place text..."
                className="w-full bg-bg-surface border border-border-subtle px-2 py-0.5 rounded text-text-primary placeholder-text-dim focus:outline-none focus:border-white text-[10px]"
              />
            </div>
          </div>
        )}

        {/* PAINTBUCKET */}
        {activeTool === 'paintbucket' && (
          <span className="text-text-dim text-[10px]">Click any paint layer to fill with primary color</span>
        )}

        {/* EYEDROPPER */}
        {activeTool === 'eyedropper' && (
          <span className="text-text-dim text-[10px]">Click anywhere on the canvas to sample that color</span>
        )}

        {/* CROP */}
        {activeTool === 'crop' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-text-muted">W:</span>
              <input type="number" min={100} max={4000} value={tempCanvasWidth}
                onChange={(e) => setTempCanvasWidth(Math.max(100, parseInt(e.target.value) || 800))}
                className="w-14 bg-bg-surface border border-border-subtle text-center px-1 py-0.5 rounded text-text-primary font-mono text-[10px]" />
            </div>
            <span className="text-text-dim">×</span>
            <div className="flex items-center gap-1">
              <span className="text-text-muted">H:</span>
              <input type="number" min={100} max={4000} value={tempCanvasHeight}
                onChange={(e) => setTempCanvasHeight(Math.max(100, parseInt(e.target.value) || 600))}
                className="w-14 bg-bg-surface border border-border-subtle text-center px-1 py-0.5 rounded text-text-primary font-mono text-[10px]" />
            </div>
            <button
              onClick={onApplyCrop}
              className="flex items-center gap-1 bg-white text-black px-2.5 py-1 rounded-md font-bold hover:bg-white/95 active:scale-95 transition-all text-[10px] shadow-md ml-1"
            >
              <Scissors className="w-3 h-3" /> Apply
            </button>
          </div>
        )}
      </div>

      {/* Globals: Undo / Redo */}
      <div className="flex items-center gap-1.5 border-l border-border-subtle pl-3 shrink-0">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1 rounded transition-all ${canUndo ? 'text-text-secondary hover:text-text-primary hover:bg-bg-hover' : 'text-text-dim cursor-not-allowed'}`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1 rounded transition-all ${canRedo ? 'text-text-secondary hover:text-text-primary hover:bg-bg-hover' : 'text-text-dim cursor-not-allowed'}`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
