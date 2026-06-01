/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Compass } from 'lucide-react';

interface MinimapProps {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panX: number;
  panY: number;
  viewportWidth: number;
  viewportHeight: number;
  onNavigate: (panX: number, panY: number) => void;
  layers: { id: string; type: string; visible: boolean; x: number; y: number; width: number; height: number; fillColor?: string; imageUrl?: string }[];
}

export default function Minimap({
  canvasWidth,
  canvasHeight,
  zoom,
  panX,
  panY,
  viewportWidth,
  viewportHeight,
  onNavigate,
  layers,
}: MinimapProps) {
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const MINIMAP_WIDTH = 160;
  const scale = MINIMAP_WIDTH / canvasWidth;
  const minimapHeight = Math.round(canvasHeight * scale);

  // Viewport rectangle dimensions
  const vpW = Math.round((viewportWidth / zoom) * scale);
  const vpH = Math.round((viewportHeight / zoom) * scale);
  const vpX = Math.round(((viewportWidth / 2 - panX) / zoom - (viewportWidth / zoom) / 2) * scale);
  const vpY = Math.round(((viewportHeight / 2 - panY) / zoom - (viewportHeight / zoom) / 2) * scale);

  useEffect(() => {
    const canvas = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = MINIMAP_WIDTH;
    canvas.height = minimapHeight;

    // Background
    ctx.fillStyle = '#16161d';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, minimapHeight);

    // Draw checkerboard
    const checkSize = 4;
    for (let y = 0; y < minimapHeight; y += checkSize) {
      for (let x = 0; x < MINIMAP_WIDTH; x += checkSize) {
        ctx.fillStyle = ((x / checkSize + y / checkSize) % 2 === 0) ? '#1c1c28' : '#202030';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // Draw layers as colored rectangles
    layers.forEach((l) => {
      if (!l.visible) return;
      ctx.save();
      ctx.globalAlpha = 0.6;

      if (l.type === 'shape') {
        ctx.fillStyle = l.fillColor || '#888888';
      } else if (l.type === 'text') {
        ctx.fillStyle = l.fillColor || '#cccccc';
      } else if (l.type === 'image') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      }

      ctx.fillRect(
        Math.round(l.x * scale),
        Math.round(l.y * scale),
        Math.max(2, Math.round(l.width * scale)),
        Math.max(2, Math.round(l.height * scale))
      );
      ctx.restore();
    });
  }, [layers, canvasWidth, canvasHeight, minimapHeight]);

  const handleMinimapClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert minimap coords to canvas coords, then to pan offset
    const canvasX = clickX / scale;
    const canvasY = clickY / scale;

    const newPanX = viewportWidth / 2 - canvasX * zoom;
    const newPanY = viewportHeight / 2 - canvasY * zoom;

    onNavigate(newPanX, newPanY);
  };

  return (
    <div className="p-2 bg-bg-panel border-t border-border-subtle">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Compass className="w-3 h-3 text-text-muted" />
        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Navigator</span>
      </div>
      <div
        ref={containerRef}
        className="relative rounded overflow-hidden border border-border-default cursor-pointer"
        style={{ width: MINIMAP_WIDTH, height: minimapHeight }}
        onClick={handleMinimapClick}
      >
        <canvas ref={minimapRef} className="w-full h-full" />
        {/* Viewport indicator */}
        <div
          className="minimap-viewport absolute rounded-sm pointer-events-none"
          style={{
            left: `${Math.max(0, Math.min(MINIMAP_WIDTH - vpW, vpX))}px`,
            top: `${Math.max(0, Math.min(minimapHeight - vpH, vpY))}px`,
            width: `${Math.min(vpW, MINIMAP_WIDTH)}px`,
            height: `${Math.min(vpH, minimapHeight)}px`,
          }}
        />
      </div>
    </div>
  );
}
