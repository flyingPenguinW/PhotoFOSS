/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MousePointer, Brush, Eraser, Pipette, Square, Type, PaintBucket, Crop,
  Layers, Sparkles, Wand2, Stamp, Droplets, Sun, Moon, Blend,
  PenTool, ChevronRight, Palette, Triangle, GalleryHorizontal,
  CircleDot, Maximize, Wind, Scissors,
  Magnet, Hand, Search, Circle
} from 'lucide-react';
import { ToolType, TOOL_GROUPS } from '../types';

interface ToolbarProps {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  onOpenTemplates: () => void;
  quickMaskActive: boolean;
  onToggleQuickMask: () => void;
}

const TOOL_ICONS: Record<string, any> = {
  'select': MousePointer,
  'rect-select': Square,
  'ellipse-select': Circle,
  'magnetic-lasso': Magnet,
  'magic-wand': Wand2,
  'path-select': CircleDot,
  'brush': Brush,
  'clone': Stamp,
  'magic-heal': Sparkles,
  'smudge': Wind,
  'eraser': Eraser,
  'blur-brush': Droplets,
  'sharpen-brush': Triangle,
  'dodge': Sun,
  'burn': Moon,
  'shape': Square,
  'pen': PenTool,
  'gradient': Palette,
  'paintbucket': PaintBucket,
  'text': Type,
  'eyedropper': Pipette,
  'crop': Crop,
  'hand': Hand,
  'zoom': Search,
};

export default function Toolbar({
  activeTool,
  setActiveTool,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  onOpenTemplates,
  quickMaskActive,
  onToggleQuickMask,
}: ToolbarProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const swapColors = () => {
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  };

  const getActiveToolInGroup = (group: typeof TOOL_GROUPS[0]) => {
    const found = group.tools.find(t => t.id === activeTool);
    return found || group.tools[0];
  };

  const handleToolClick = (groupId: string, toolId: ToolType) => {
    setActiveTool(toolId);
    setExpandedGroup(null);
  };

  return (
    <div
      id="editor-toolbar"
      className="w-11 bg-bg-panel border-r border-border-default flex flex-col items-center py-2 justify-between select-none z-30"
    >
      {/* Tools */}
      <div className="flex flex-col gap-0.5 items-center w-full px-1">
        {/* Templates button */}
        <button
          id="btn-templates"
          onClick={onOpenTemplates}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-hover rounded-md transition-all mb-2 group relative"
          title="New Project Templates"
        >
          <Layers className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-bg-panel border border-border-default text-text-primary text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Templates
          </span>
        </button>

        <div className="w-6 h-px bg-border-subtle mb-1" />

        {/* Tool groups */}
        {TOOL_GROUPS.map((group) => {
          const activeTInGroup = getActiveToolInGroup(group);
          const isGroupActive = group.tools.some(t => t.id === activeTool);
          const isExpanded = expandedGroup === group.id;
          const hasMultiple = group.tools.length > 1;
          const Icon = TOOL_ICONS[activeTInGroup.id] || Square;

          return (
            <div key={group.id} className="relative w-full">
              <button
                id={`tool-group-${group.id}`}
                onClick={() => {
                  if (hasMultiple && !isGroupActive) {
                    setActiveTool(activeTInGroup.id);
                  } else if (hasMultiple) {
                    setExpandedGroup(isExpanded ? null : group.id);
                  } else {
                    setActiveTool(group.tools[0].id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (hasMultiple) {
                    setExpandedGroup(isExpanded ? null : group.id);
                  }
                }}
                className={`relative w-full aspect-square flex items-center justify-center rounded-md transition-all group ${
                  isGroupActive
                    ? 'bg-white/10 text-white ring-1 ring-white/20'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                }`}
                title={`${activeTInGroup.label} (${activeTInGroup.shortcut})`}
              >
                <Icon className="w-4 h-4" />

                {/* Multi-tool triangle indicator */}
                {hasMultiple && (
                  <div className="absolute bottom-0.5 right-0.5">
                    <div
                      className="w-0 h-0"
                    style={{
                      borderLeft: '3px solid transparent',
                      borderBottom: `3px solid ${isGroupActive ? '#ffffff' : 'var(--color-text-dim)'}`,
                    }}
                    />
                  </div>
                )}

                {/* Tooltip */}
                <span className="absolute left-full ml-2.5 px-2 py-1 bg-bg-panel border border-border-default text-text-primary text-[10px] font-medium rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50">
                  {activeTInGroup.label}
                  <span className="text-text-dim ml-2 font-mono">{activeTInGroup.shortcut}</span>
                </span>
              </button>

              {/* Flyout submenu */}
              {isExpanded && hasMultiple && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExpandedGroup(null)}
                  />
                  <div className="absolute left-full top-0 ml-1.5 bg-bg-panel border border-border-default rounded-lg shadow-2xl shadow-black/40 py-1 min-w-[170px] z-50 flyout-animate">
                    <div className="px-2.5 py-1 text-[9px] font-bold text-text-dim uppercase tracking-wider border-b border-border-subtle mb-0.5">
                      {group.label}
                    </div>
                    {group.tools.map((tool) => {
                      const TIcon = TOOL_ICONS[tool.id] || Square;
                      const isActive = activeTool === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleToolClick(group.id, tool.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] transition-colors ${
                            isActive
                              ? 'bg-white/10 text-white font-semibold'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                          }`}
                        >
                          <TIcon className="w-3.5 h-3.5" />
                          <span className="flex-1 text-left">{tool.label}</span>
                          <span className="text-[9px] font-mono text-text-dim">{tool.shortcut}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Color picker space */}
      </div>

      {/* Bottom: Color pickers */}
      <div className="flex flex-col items-center gap-3 w-full px-1" id="color-selectors">
        {/* Quick Mask Mode Button */}
        <button
          id="btn-quick-mask"
          onClick={onToggleQuickMask}
          className={`p-1.5 rounded-md transition-all cursor-pointer group relative ${
            quickMaskActive
              ? 'bg-red-500/20 text-red-500 border border-red-500/40'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
          title="Toggle Quick Mask Mode (Q)"
        >
          <CircleDot className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 bg-bg-panel border border-border-default text-text-primary text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
            Quick Mask {quickMaskActive ? 'Active' : 'Mode'} <span className="text-text-dim ml-1 font-mono">Q</span>
          </span>
        </button>

        <div className="w-6 h-px bg-border-subtle" />
        <div className="relative w-9 h-9 select-none">
          {/* Secondary */}
          <div
            className="absolute bottom-0 right-0 w-5.5 h-5.5 rounded-sm border border-border-default overflow-hidden cursor-pointer transition-transform hover:scale-110 active:scale-95 z-0 shadow-md"
            style={{ backgroundColor: secondaryColor }}
            title="Secondary Color"
          >
            <input
              type="color"
              id="input-secondary-color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
          {/* Primary */}
          <div
            className="absolute top-0 left-0 w-5.5 h-5.5 rounded-sm border-2 border-border-hover overflow-hidden cursor-pointer transition-transform hover:scale-110 active:scale-95 z-10 shadow-lg"
            style={{ backgroundColor: primaryColor }}
            title="Primary Color"
          >
            <input
              type="color"
              id="input-primary-color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
          {/* Swap */}
          <button
            id="btn-swap-colors"
            onClick={swapColors}
            className="absolute -top-1 -right-1 w-4 h-4 bg-bg-panel rounded-full border border-border-default flex items-center justify-center text-text-dim hover:text-text-primary transition-colors z-20 text-[7px]"
            title="Swap Colors (X)"
          >
            ⇅
          </button>
        </div>
      </div>
    </div>
  );
}
