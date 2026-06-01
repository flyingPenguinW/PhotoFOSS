/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MousePointer, Crosshair, Layers, Shield } from 'lucide-react';
import { CursorPosition } from '../types';

interface StatusBarProps {
  cursorPosition: CursorPosition;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  activeLayerName: string | null;
  layerCount: number;
  antiAliasing: boolean;
  onToggleAntiAliasing: () => void;
  selectionBounds: { w: number; h: number } | null;
  editTarget?: 'layer' | 'mask';
}

export default function StatusBar({
  cursorPosition,
  canvasWidth,
  canvasHeight,
  zoom,
  activeLayerName,
  layerCount,
  antiAliasing,
  onToggleAntiAliasing,
  selectionBounds,
  editTarget,
}: StatusBarProps) {
  return (
    <div
      id="status-bar"
      className="h-6 bg-bg-panel border-t border-border-default flex items-center justify-between px-3 text-[10px] text-text-muted font-mono select-none shrink-0 z-20"
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Cursor position */}
        <div className="flex items-center gap-1.5" title="Cursor Position">
          <Crosshair className="w-3 h-3 text-text-dim" />
          <span className="text-text-secondary">
            X: <span className="text-text-primary font-medium">{cursorPosition.x}</span>
          </span>
          <span className="text-text-secondary">
            Y: <span className="text-text-primary font-medium">{cursorPosition.y}</span>
          </span>
        </div>

        <div className="w-px h-3 bg-border-subtle" />

        {/* Canvas dimensions */}
        <div className="flex items-center gap-1.5" title="Canvas Size">
          <span className="text-text-secondary">
            {canvasWidth} × {canvasHeight} px
          </span>
        </div>

        {selectionBounds && (
          <>
            <div className="w-px h-3 bg-border-subtle" />
            <div className="flex items-center gap-1.5" title="Selection Size">
              <span className="text-text-secondary">
                Selection: <span className="text-text-primary font-medium">{selectionBounds.w} × {selectionBounds.h}</span> px
              </span>
            </div>
          </>
        )}

        {editTarget === 'mask' && (
          <>
            <div className="w-px h-3 bg-border-subtle" />
            <div className="flex items-center gap-1.5" title="Editing Mask">
              <span className="text-white font-bold uppercase tracking-wider text-[9px] bg-white/10 border border-white/20 px-1.5 py-0.5 rounded">
                Mask Editing Mode
              </span>
            </div>
          </>
        )}

        <div className="w-px h-3 bg-border-subtle" />

        {/* Zoom */}
        <div className="text-text-secondary" title="Zoom Level">
          Zoom: <span className="text-text-primary font-medium">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Active layer */}
        {activeLayerName && (
          <div className="flex items-center gap-1.5" title="Active Layer">
            <Layers className="w-3 h-3 text-text-dim" />
            <span className="text-text-secondary max-w-[120px] truncate">{activeLayerName}</span>
          </div>
        )}

        <div className="w-px h-3 bg-border-subtle" />

        {/* Layer count */}
        <span className="text-text-muted">{layerCount} layers</span>

        <div className="w-px h-3 bg-border-subtle" />

        {/* Anti-aliasing toggle */}
        <button
          id="btn-toggle-aa"
          onClick={onToggleAntiAliasing}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all border ${
            antiAliasing
              ? 'bg-white/10 text-white border-white/20'
              : 'text-text-dim hover:text-text-muted border-transparent'
          }`}
          title={`Anti-Aliasing: ${antiAliasing ? 'ON' : 'OFF'}`}
        >
          <Shield className="w-3 h-3" />
          <span className="text-[9px] font-semibold uppercase">AA {antiAliasing ? 'On' : 'Off'}</span>
        </button>

        <div className="w-px h-3 bg-border-subtle" />

        {/* Color mode */}
        <span className="text-text-dim uppercase tracking-wider font-semibold text-[9px]">RGB 8bit</span>
      </div>
    </div>
  );
}
