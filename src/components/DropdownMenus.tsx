/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FileImage, FilePlus, Download, Upload, Save, FolderOpen,
  Undo2, Redo2, Scissors, Copy, ClipboardPaste, Trash2,
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Maximize2,
  Layers, Plus, CopyPlus, Merge, Minimize2,
  Square, Circle, MousePointer, Wand2,
  Sliders, Sparkles, Droplets, Contrast, Sun,
  ZoomIn, ZoomOut, Grid, Ruler, Eye, Keyboard, Type, Pipette
} from 'lucide-react';

interface DropdownMenusProps {
  onNewProject: () => void;
  onImageUpload: () => void;
  onImportJson: () => void;
  onExportPng: () => void;
  onExportJpg: () => void;
  onExportJson: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDeleteLayer: () => void;
  onDuplicateLayer: () => void;
  onAddPaintLayer: () => void;
  onAddTextLayer: () => void;
  onAddShapeLayer: () => void;
  onAddAdjustmentLayer: () => void;
  onCanvasResize: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onResetFilters: () => void;
  onOpenFilters: () => void;
  hasSelection: boolean;
  onFlattenImage?: () => void;
  onMergeDown?: () => void;
  onMergeVisible?: () => void;
  onOpenColorGrading?: () => void;
  canMergeDown?: boolean;
  canMergeVisible?: boolean;
  canFlatten?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showRulers: boolean;
  onToggleRulers: () => void;
  quickMaskActive: boolean;
  onToggleQuickMask: () => void;
  onSelectTab: (tab: 'layers' | 'filters' | 'history' | 'color' | 'fonts') => void;
  onOpenShortcuts: () => void;
  onOpenTemplates: () => void;
  hasPixelSelection: boolean;
  onInvertSelection: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDeleteSelectionPixels: () => void;
  onFillSelection: () => void;
  canPaste: boolean;
  selectedLayerId: string | null;
  onAddLayerMask: (layerId: string, mode?: 'reveal-all' | 'hide-all') => void;
  onDeleteLayerMask: (layerId: string) => void;
  onApplyLayerMask: (layerId: string) => void;
  onMaskFromSelection: (layerId: string) => void;
  onToggleMaskEnabled: (layerId: string) => void;
  onToggleMaskLinked: (layerId: string) => void;
  hasMask: boolean;
  maskEnabled: boolean;
  maskLinked: boolean;
  onToggleClippingMask: (layerId: string) => void;
  isClippingMask: boolean;
  canClip: boolean;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

function MenuDropdown({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  return (
    <div className="absolute top-full left-0 mt-0.5 bg-bg-panel border border-border-default rounded-lg shadow-2xl shadow-black/40 py-1 min-w-[200px] z-50 dropdown-animate">
      {items.map((item, i) => {
        if (item.divider) {
          return <div key={`div-${i}`} className="h-px bg-border-subtle mx-2 my-1" />;
        }
        return (
          <button
            key={item.label}
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] transition-colors ${
              item.disabled
                ? 'text-text-dim cursor-not-allowed'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="w-4 h-4 flex items-center justify-center opacity-60">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-[9px] font-mono text-text-dim ml-4">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function DropdownMenus({
  onNewProject,
  onImageUpload,
  onImportJson,
  onExportPng,
  onExportJpg,
  onExportJson,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDeleteLayer,
  onDuplicateLayer,
  onAddPaintLayer,
  onAddTextLayer,
  onAddShapeLayer,
  onAddAdjustmentLayer,
  onCanvasResize,
  onFlipHorizontal,
  onFlipVertical,
  onSelectAll,
  onDeselectAll,
  onResetFilters,
  onOpenFilters,
  hasSelection,
  onFlattenImage,
  onMergeDown,
  onMergeVisible,
  onOpenColorGrading,
  canMergeDown,
  canMergeVisible,
  canFlatten,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  showGrid,
  onToggleGrid,
  showRulers,
  onToggleRulers,
  quickMaskActive,
  onToggleQuickMask,
  onSelectTab,
  onOpenShortcuts,
  onOpenTemplates,
  hasPixelSelection,
  onInvertSelection,
  onCopy,
  onPaste,
  onDeleteSelectionPixels,
  onFillSelection,
  canPaste,
  selectedLayerId,
  onAddLayerMask,
  onDeleteLayerMask,
  onApplyLayerMask,
  onMaskFromSelection,
  onToggleMaskEnabled,
  onToggleMaskLinked,
  hasMask,
  maskEnabled,
  maskLinked,
  onToggleClippingMask,
  isClippingMask,
  canClip,
}: DropdownMenusProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Project', shortcut: 'Ctrl+N', icon: <FilePlus className="w-3.5 h-3.5" />, action: onNewProject },
      { label: 'Open Image', shortcut: 'Ctrl+O', icon: <FolderOpen className="w-3.5 h-3.5" />, action: onImageUpload },
      { label: 'Import Project JSON', icon: <Upload className="w-3.5 h-3.5" />, action: onImportJson },
      { label: '', divider: true },
      { label: 'Export as PNG', shortcut: 'Ctrl+Shift+S', icon: <Download className="w-3.5 h-3.5" />, action: onExportPng },
      { label: 'Export as JPG', icon: <Download className="w-3.5 h-3.5" />, action: onExportJpg },
      { label: 'Save Project JSON', icon: <Save className="w-3.5 h-3.5" />, action: onExportJson },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', icon: <Undo2 className="w-3.5 h-3.5" />, action: onUndo, disabled: !canUndo },
      { label: 'Redo', shortcut: 'Ctrl+Y', icon: <Redo2 className="w-3.5 h-3.5" />, action: onRedo, disabled: !canRedo },
      { label: '', divider: true },
      { label: 'Copy Pixels', shortcut: 'Ctrl+C', icon: <Copy className="w-3.5 h-3.5" />, action: onCopy, disabled: !hasPixelSelection || !hasSelection },
      { label: 'Paste Pixels', shortcut: 'Ctrl+V', icon: <ClipboardPaste className="w-3.5 h-3.5" />, action: onPaste, disabled: !canPaste },
      { label: 'Delete Pixels', shortcut: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, action: onDeleteSelectionPixels, disabled: !hasPixelSelection || !hasSelection },
      { label: 'Fill Selection', shortcut: 'Shift+F5', icon: <Square className="w-3.5 h-3.5" />, action: onFillSelection, disabled: !hasPixelSelection || !hasSelection },
      { label: '', divider: true },
      { label: 'Delete Layer', icon: <Trash2 className="w-3.5 h-3.5" />, action: onDeleteLayer, disabled: !hasSelection },
      { label: 'Duplicate Layer', shortcut: 'Ctrl+J', icon: <CopyPlus className="w-3.5 h-3.5" />, action: onDuplicateLayer, disabled: !hasSelection },
    ],
    Image: [
      { label: 'Canvas Size...', shortcut: 'Ctrl+Alt+C', icon: <Maximize2 className="w-3.5 h-3.5" />, action: onCanvasResize },
      { label: '', divider: true },
      { label: 'Flip Horizontal', icon: <FlipHorizontal className="w-3.5 h-3.5" />, action: onFlipHorizontal, disabled: !hasSelection },
      { label: 'Flip Vertical', icon: <FlipVertical className="w-3.5 h-3.5" />, action: onFlipVertical, disabled: !hasSelection },
    ],
    Layer: [
      { label: 'New Paint Layer', shortcut: 'Ctrl+Shift+N', icon: <Plus className="w-3.5 h-3.5" />, action: onAddPaintLayer },
      { label: 'New Text Layer', icon: <Plus className="w-3.5 h-3.5" />, action: onAddTextLayer },
      { label: 'New Shape Layer', icon: <Plus className="w-3.5 h-3.5" />, action: onAddShapeLayer },
      { label: 'New Adjustment Layer', icon: <Plus className="w-3.5 h-3.5" />, action: onAddAdjustmentLayer },
      { label: '', divider: true },
      { label: 'Duplicate Layer', shortcut: 'Ctrl+J', icon: <CopyPlus className="w-3.5 h-3.5" />, action: onDuplicateLayer, disabled: !hasSelection },
      { label: 'Delete Layer', shortcut: 'Del', icon: <Trash2 className="w-3.5 h-3.5" />, action: onDeleteLayer, disabled: !hasSelection },
      { label: '', divider: true },
      { label: 'Add Layer Mask (Reveal All)', action: () => selectedLayerId && onAddLayerMask(selectedLayerId, 'reveal-all'), disabled: !selectedLayerId || hasMask },
      { label: 'Add Layer Mask (Hide All)', action: () => selectedLayerId && onAddLayerMask(selectedLayerId, 'hide-all'), disabled: !selectedLayerId || hasMask },
      { label: 'Mask from Selection', action: () => selectedLayerId && onMaskFromSelection(selectedLayerId), disabled: !selectedLayerId || hasMask || !hasPixelSelection },
      { label: maskEnabled ? 'Disable Layer Mask' : 'Enable Layer Mask', action: () => selectedLayerId && onToggleMaskEnabled(selectedLayerId), disabled: !selectedLayerId || !hasMask },
      { label: maskLinked ? 'Unlink Layer Mask' : 'Link Layer Mask', action: () => selectedLayerId && onToggleMaskLinked(selectedLayerId), disabled: !selectedLayerId || !hasMask },
      { label: 'Apply Layer Mask', action: () => selectedLayerId && onApplyLayerMask(selectedLayerId), disabled: !selectedLayerId || !hasMask },
      { label: 'Delete Layer Mask', action: () => selectedLayerId && onDeleteLayerMask(selectedLayerId), disabled: !selectedLayerId || !hasMask },
      { label: '', divider: true },
      { label: isClippingMask ? 'Release Clipping Mask' : 'Create Clipping Mask', shortcut: 'Alt+Ctrl+G', action: () => selectedLayerId && onToggleClippingMask(selectedLayerId), disabled: !canClip },
      { label: '', divider: true },
      { label: 'Merge Down', icon: <Merge className="w-3.5 h-3.5" />, action: () => onMergeDown?.(), disabled: !canMergeDown },
      { label: 'Merge Visible', icon: <Minimize2 className="w-3.5 h-3.5" />, action: () => onMergeVisible?.(), disabled: !canMergeVisible },
      { label: 'Flatten Image', icon: <Layers className="w-3.5 h-3.5" />, action: () => onFlattenImage?.(), disabled: !canFlatten },
    ],
    Select: [
      { label: 'Select All', shortcut: 'Ctrl+A', icon: <Square className="w-3.5 h-3.5" />, action: onSelectAll },
      { label: 'Deselect', shortcut: 'Ctrl+D', icon: <MousePointer className="w-3.5 h-3.5" />, action: onDeselectAll, disabled: !hasPixelSelection },
      { label: 'Invert Selection', shortcut: 'Ctrl+Shift+I', icon: <Sparkles className="w-3.5 h-3.5" />, action: onInvertSelection, disabled: !hasPixelSelection },
    ],

    Filter: [
      { label: 'Adjustments Panel', icon: <Sliders className="w-3.5 h-3.5" />, action: onOpenFilters },
      { label: 'Color Grading', icon: <Contrast className="w-3.5 h-3.5" />, action: () => onOpenColorGrading?.() },
      { label: '', divider: true },
      { label: 'Reset All Filters', icon: <RotateCcw className="w-3.5 h-3.5" />, action: onResetFilters },
    ],
    View: [
      { label: 'Zoom In', shortcut: 'Ctrl++', icon: <ZoomIn className="w-3.5 h-3.5" />, action: onZoomIn },
      { label: 'Zoom Out', shortcut: 'Ctrl+-', icon: <ZoomOut className="w-3.5 h-3.5" />, action: onZoomOut },
      { label: 'Fit Canvas', shortcut: 'Ctrl+0', icon: <Maximize2 className="w-3.5 h-3.5" />, action: onFitScreen },
      { label: '', divider: true },
      { label: showGrid ? 'Hide Grid' : 'Show Grid', icon: <Grid className="w-3.5 h-3.5" />, action: onToggleGrid },
      { label: showRulers ? 'Hide Rulers' : 'Show Rulers', icon: <Ruler className="w-3.5 h-3.5" />, action: onToggleRulers },
      { label: quickMaskActive ? 'Exit Quick Mask' : 'Enter Quick Mask', shortcut: 'Q', icon: <Eye className="w-3.5 h-3.5" />, action: onToggleQuickMask },
    ],
    Window: [
      { label: 'Layers', icon: <Layers className="w-3.5 h-3.5" />, action: () => onSelectTab('layers') },
      { label: 'Adjustments', icon: <Sliders className="w-3.5 h-3.5" />, action: () => onSelectTab('filters') },
      { label: 'History', icon: <RotateCcw className="w-3.5 h-3.5" />, action: () => onSelectTab('history') },
      { label: 'Color Picker', icon: <Pipette className="w-3.5 h-3.5" />, action: () => onSelectTab('color') },
      { label: 'Fonts', icon: <Type className="w-3.5 h-3.5" />, action: () => onSelectTab('fonts') },
      { label: '', divider: true },
      { label: 'Templates Library', icon: <FolderOpen className="w-3.5 h-3.5" />, action: onOpenTemplates },
      { label: '', divider: true },
      { label: 'Keyboard Shortcuts', shortcut: 'Shift+?', icon: <Keyboard className="w-3.5 h-3.5" />, action: onOpenShortcuts },
    ],
  };

  return (
    <div ref={menuRef} className="flex items-center gap-0.5" id="dropdown-menus">
      {Object.entries(menus).map(([name, items]) => (
        <div key={name} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === name ? null : name)}
            onMouseEnter={() => openMenu && setOpenMenu(name)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
              openMenu === name
                ? 'bg-bg-hover text-text-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover/50'
            }`}
          >
            {name}
          </button>
          {openMenu === name && (
            <MenuDropdown items={items} onClose={() => setOpenMenu(null)} />
          )}
        </div>
      ))}
    </div>
  );
}
