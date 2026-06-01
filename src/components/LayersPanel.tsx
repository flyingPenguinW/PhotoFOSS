/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Eye, EyeOff, Plus, Trash2, Copy, ChevronUp, ChevronDown,
  Layers, Image as ImageIcon, Type as TypeIcon, Square as SquareIcon,
  Lock, Unlock, Merge, Minimize2, CopyPlus, Edit3, SlidersHorizontal
} from 'lucide-react';
import { Layer, BlendMode, BLEND_MODES } from '../types';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onUpdateLayerProperty: (id: string, prop: keyof Layer, value: any) => void;
  onAddPaintLayer: () => void;
  onAddTextLayer: () => void;
  onAddShapeLayer: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;
  onMoveLayerUp: (id: string) => void;
  onMoveLayerDown: (id: string) => void;
  onFlattenImage?: () => void;
  onMergeDown?: () => void;
  onMergeVisible?: () => void;
  editTarget: 'layer' | 'mask';
  setEditTarget: (target: 'layer' | 'mask') => void;
  onAddLayerMask: (layerId: string, mode?: 'reveal-all' | 'hide-all') => void;
  onDeleteLayerMask: (layerId: string) => void;
  onApplyLayerMask: (layerId: string) => void;
  onMaskFromSelection: (layerId: string) => void;
  onToggleMaskProperty: (layerId: string, prop: 'maskEnabled' | 'maskLinked') => void;
  onToggleClippingMask: (layerId: string) => void;
}

export default function LayersPanel({
  layers, selectedLayerId, setSelectedLayerId,
  onToggleVisibility, onUpdateLayerProperty,
  onAddPaintLayer, onAddTextLayer, onAddShapeLayer,
  onImageUpload, onDeleteLayer, onDuplicateLayer,
  onMoveLayerUp, onMoveLayerDown,
  onFlattenImage, onMergeDown, onMergeVisible,
  editTarget, setEditTarget,
  onAddLayerMask, onDeleteLayerMask, onApplyLayerMask,
  onMaskFromSelection, onToggleMaskProperty,
  onToggleClippingMask,
}: LayersPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);

  const activeLayer = layers.find((l) => l.id === selectedLayerId) || null;

  const handleStartRename = (layer: Layer) => {
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const handleFinishRename = (id: string) => {
    if (editingName.trim()) onUpdateLayerProperty(id, 'name', editingName.trim());
    setEditingId(null);
  };

  const handleLayerContextMenu = (e: React.MouseEvent, layer: Layer) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLayerId(layer.id);
    setContextMenu({ x: e.clientX, y: e.clientY, layerId: layer.id });
  };

  const getLayerContextItems = (layerId: string): ContextMenuItem[] => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return [];
    const idx = layers.findIndex(l => l.id === layerId);

    return [
      {
        label: 'Rename',
        icon: <Edit3 className="w-3.5 h-3.5" />,
        shortcut: 'F2',
        action: () => handleStartRename(layer),
      },
      {
        label: 'Duplicate Layer',
        icon: <CopyPlus className="w-3.5 h-3.5" />,
        shortcut: 'Ctrl+J',
        action: () => { setSelectedLayerId(layerId); onDuplicateLayer(); },
      },
      { label: '', divider: true },
      {
        label: layer.visible ? 'Hide Layer' : 'Show Layer',
        icon: layer.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />,
        action: () => onToggleVisibility(layerId),
      },
      {
        label: layer.locked ? 'Unlock Layer' : 'Lock Layer',
        icon: layer.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />,
        action: () => onUpdateLayerProperty(layerId, 'locked', !layer.locked),
      },
      { label: '', divider: true },
      {
        label: 'Move Up',
        icon: <ChevronUp className="w-3.5 h-3.5" />,
        action: () => onMoveLayerUp(layerId),
        disabled: idx === layers.length - 1,
      },
      {
        label: 'Move Down',
        icon: <ChevronDown className="w-3.5 h-3.5" />,
        action: () => onMoveLayerDown(layerId),
        disabled: idx === 0,
      },
      { label: '', divider: true },
      {
        label: 'Merge Down',
        icon: <Merge className="w-3.5 h-3.5" />,
        action: () => { setSelectedLayerId(layerId); onMergeDown?.(); },
        disabled: idx === 0 || !onMergeDown,
      },
      {
        label: 'Merge Visible',
        icon: <Minimize2 className="w-3.5 h-3.5" />,
        action: () => onMergeVisible?.(),
        disabled: layers.filter(l => l.visible).length < 2 || !onMergeVisible,
      },
      {
        label: 'Flatten Image',
        icon: <Layers className="w-3.5 h-3.5" />,
        action: () => onFlattenImage?.(),
        disabled: layers.length < 2 || !onFlattenImage,
      },
      { label: '', divider: true },
      {
        label: 'Add Layer Mask (Reveal All)',
        action: () => onAddLayerMask(layerId, 'reveal-all'),
        disabled: layer.hasMask,
      },
      {
        label: 'Add Layer Mask (Hide All)',
        action: () => onAddLayerMask(layerId, 'hide-all'),
        disabled: layer.hasMask,
      },
      {
        label: 'Mask from Selection',
        action: () => onMaskFromSelection(layerId),
        disabled: layer.hasMask,
      },
      {
        label: layer.maskEnabled ? 'Disable Layer Mask' : 'Enable Layer Mask',
        action: () => onToggleMaskProperty(layerId, 'maskEnabled'),
        disabled: !layer.hasMask,
      },
      {
        label: layer.maskLinked ? 'Unlink Layer Mask' : 'Link Layer Mask',
        action: () => onToggleMaskProperty(layerId, 'maskLinked'),
        disabled: !layer.hasMask,
      },
      {
        label: 'Apply Layer Mask',
        action: () => onApplyLayerMask(layerId),
        disabled: !layer.hasMask,
      },
      {
        label: 'Delete Layer Mask',
        action: () => onDeleteLayerMask(layerId),
        disabled: !layer.hasMask,
      },
      { label: '', divider: true },
      {
        label: layer.clippingMask ? 'Release Clipping Mask' : 'Create Clipping Mask',
        action: () => onToggleClippingMask(layerId),
        disabled: idx === 0, // Can't clip the bottom layer
      },
      { label: '', divider: true },
      {
        label: 'Delete Layer',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        shortcut: 'Del',
        action: () => { setSelectedLayerId(layerId); onDeleteLayer(); },
        danger: true,
      },
    ];
  };

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-3 h-3 text-text-secondary" />;
      case 'text': return <TypeIcon className="w-3 h-3 text-text-secondary" />;
      case 'shape': return <SquareIcon className="w-3 h-3 text-text-secondary" />;
      case 'adjustment': return <SlidersHorizontal className="w-3 h-3 text-text-secondary" />;
      default: return <Layers className="w-3 h-3 text-text-secondary" />;
    }
  };

  const getLayerColor = (type: Layer['type']) => {
    switch (type) {
      case 'image': return 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue';
      case 'text': return 'bg-accent-purple/10 border-accent-purple/30 text-accent-purple';
      case 'shape': return 'bg-accent-green/10 border-accent-green/30 text-accent-green';
      case 'adjustment': return 'bg-accent-orange/10 border-accent-orange/30 text-accent-orange';
      default: return 'bg-bg-panel border-border-default text-text-secondary';
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel select-none text-[11px] text-text-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-default shrink-0">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-text-muted">
          <Layers className="w-3.5 h-3.5 text-text-muted" />
          Layers
        </div>
        <span className="text-[10px] font-mono text-text-dim">{layers.length}</span>
      </div>

      {/* Blend & Opacity */}
      <div className="p-3 bg-bg-panel-alt border-b border-border-default flex flex-col gap-2 shrink-0">
        {activeLayer ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-text-dim font-medium text-[10px]">Blend:</span>
              <select
                value={activeLayer.blendMode}
                onChange={(e) => onUpdateLayerProperty(activeLayer.id, 'blendMode', e.target.value as BlendMode)}
                className="bg-bg-surface border border-border-subtle rounded px-1.5 py-0.5 text-text-primary font-medium focus:outline-none focus:border-white text-[10px]"
              >
                {BLEND_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-dim font-medium whitespace-nowrap text-[10px]">Opacity:</span>
              <input
                type="range" min="0" max="100" value={activeLayer.opacity}
                onChange={(e) => onUpdateLayerProperty(activeLayer.id, 'opacity', parseInt(e.target.value))}
                className="flex-1 cursor-pointer"
              />
              <span className="text-text-primary font-mono text-[10px] min-w-[24px] text-right">{activeLayer.opacity}%</span>
            </div>
          </>
        ) : (
          <div className="text-text-dim italic text-center text-[10px] py-1">Select a layer</div>
        )}
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5 min-h-[120px]" id="layers-stack-list">
        {layers.length === 0 ? (
          <div className="text-text-dim text-center py-8 text-[10px] italic">No layers</div>
        ) : (
          [...layers].reverse().map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;
            const actualIndex = layers.length - 1 - index;
            return (
              <div
                key={layer.id}
                id={`layer-row-${layer.id}`}
                onClick={() => setSelectedLayerId(layer.id)}
                onContextMenu={(e) => handleLayerContextMenu(e, layer)}
                className={`flex items-center justify-between p-1.5 rounded-md transition-all cursor-pointer group/row border-l-2 ${
                  isSelected
                    ? `bg-white/10 border-l-white text-text-primary`
                    : `bg-bg-surface border-l-transparent hover:bg-bg-hover text-text-secondary`
                } ${layer.clippingMask ? 'ml-4' : ''}`}
              >
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {/* Clipping indicator */}
                  {layer.clippingMask && (
                    <svg className="w-2.5 h-2.5 shrink-0 text-text-dim" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 1 L5 7 M3 5 L5 7 L7 5" />
                    </svg>
                  )}

                  {/* Visibility */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                    className={`p-0.5 rounded transition-colors ${
                      layer.visible ? 'text-text-secondary hover:text-text-primary' : 'text-text-dim opacity-40'
                    }`}
                    title={layer.visible ? 'Hide' : 'Show'}
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>

                  {/* Lock */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateLayerProperty(layer.id, 'locked', !layer.locked); }}
                    className={`p-0.5 rounded transition-colors ${
                      layer.locked ? 'text-white' : 'text-text-dim opacity-30 hover:opacity-60'
                    }`}
                    title={layer.locked ? 'Unlock' : 'Lock'}
                  >
                    {layer.locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  </button>

                  {/* Layer Thumbnail */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                      setEditTarget('layer');
                    }}
                    className={`relative shrink-0 w-7 h-7 rounded border bg-black/40 flex items-center justify-center overflow-hidden transition-all ${
                      isSelected && editTarget === 'layer' ? 'border-white ring-1 ring-white/50' : 'border-border-default hover:border-border-hover'
                    }`}
                  >
                    {layer.type === 'adjustment' ? (
                      <SlidersHorizontal className="w-3 h-3 text-text-primary" />
                    ) : layer.type === 'paint' && layer.paintDataUrl ? (
                      <img src={layer.paintDataUrl} className="w-full h-full object-cover" />
                    ) : layer.type === 'image' && layer.imageUrl ? (
                      <img src={layer.imageUrl} className="w-full h-full object-cover" />
                    ) : layer.type === 'text' ? (
                      <div className="text-[11px] font-bold text-text-primary">T</div>
                    ) : (
                      getLayerIcon(layer.type)
                    )}
                  </div>

                  {/* Mask Thumbnail (If present) */}
                  {layer.hasMask && (
                    <>
                      {/* Link Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMaskProperty(layer.id, 'maskLinked');
                        }}
                        className="shrink-0 p-0.5 text-text-muted hover:text-text-primary rounded transition-colors"
                        title={layer.maskLinked ? "Unlink Mask" : "Link Mask"}
                      >
                        {layer.maskLinked ? (
                          <svg className="w-3 h-3 text-text-secondary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-text-dim opacity-50" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        )}
                      </button>

                      {/* Mask Thumbnail */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLayerId(layer.id);
                          setEditTarget('mask');
                        }}
                        className={`relative shrink-0 w-7 h-7 rounded border bg-black flex items-center justify-center overflow-hidden transition-all ${
                          isSelected && editTarget === 'mask' ? 'border-white ring-1 ring-white/50' : 'border-border-default hover:border-border-hover'
                        } ${!layer.maskEnabled ? 'opacity-40' : ''}`}
                        title="Layer Mask Thumbnail"
                      >
                        {layer.maskDataUrl ? (
                          <img src={layer.maskDataUrl} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-white" />
                        )}
                        {!layer.maskEnabled && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-500 font-bold text-[14px]">/</div>
                        )}
                      </div>
                    </>
                  )}

                  {editingId === layer.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleFinishRename(layer.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRename(layer.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                      className="bg-bg-app border border-white text-text-primary font-medium px-1.5 py-0.5 rounded text-[10px] w-full max-w-[100px]"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => handleStartRename(layer)}
                      className={`truncate font-medium flex-1 text-[10px] ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}
                      title="Double click to rename · Right-click for options"
                    >
                      {layer.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity ml-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveLayerUp(layer.id); }}
                    disabled={actualIndex === layers.length - 1}
                    className="p-0.5 text-text-muted hover:text-text-primary hover:bg-bg-active rounded disabled:opacity-20"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveLayerDown(layer.id); }}
                    disabled={actualIndex === 0}
                    className="p-0.5 text-text-muted hover:text-text-primary hover:bg-bg-active rounded disabled:opacity-20"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border-default bg-bg-panel flex items-center justify-around shrink-0 gap-0.5">
        <button onClick={onAddPaintLayer} className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-md transition-colors" title="New Paint Layer">
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button onClick={onAddTextLayer} className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-md transition-colors" title="New Text Layer">
          <TypeIcon className="w-3.5 h-3.5" />
        </button>
        <button onClick={onAddShapeLayer} className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-md transition-colors" title="New Shape Layer">
          <SquareIcon className="w-3.5 h-3.5" />
        </button>
        <div className="relative">
          <label className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-md cursor-pointer block transition-colors" title="Upload Image">
            <input type="file" accept="image/*" multiple onChange={onImageUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-[0px]" />
            <ImageIcon className="w-3.5 h-3.5" />
          </label>
        </div>
        <div className="w-px h-4 bg-border-subtle" />
        <button
          onClick={() => {
            if (!activeLayer) return;
            if (activeLayer.hasMask) {
              onDeleteLayerMask(activeLayer.id);
            } else {
              onAddLayerMask(activeLayer.id, 'reveal-all');
            }
          }}
          disabled={!selectedLayerId}
          className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-md disabled:opacity-20 transition-colors"
          title={activeLayer?.hasMask ? "Delete Layer Mask" : "Add Layer Mask"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </button>
        <button onClick={onDuplicateLayer} disabled={!selectedLayerId} className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-md disabled:opacity-20 transition-colors" title="Duplicate">
          <Copy className="w-3 h-3" />
        </button>
        <button onClick={() => onFlattenImage?.()} disabled={layers.length < 2} className="p-1.5 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-md disabled:opacity-20 transition-colors" title="Flatten Image">
          <Minimize2 className="w-3 h-3" />
        </button>
        <button onClick={onDeleteLayer} disabled={!selectedLayerId} className="p-1.5 hover:bg-white/10 text-text-muted hover:text-white rounded-md disabled:opacity-20 transition-colors" title="Delete">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getLayerContextItems(contextMenu.layerId)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
