/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Layers, Sliders, History as HistoryIcon, Pipette, Type
} from 'lucide-react';
import {
  Layer, ToolType, ShapeType, GradientType, TonalRange,
  Adjustments, HistoryState, CursorPosition, DEFAULT_ADJUSTMENTS,
  DocumentSelection
} from './types';
import { emptySelection, cloneSelection, computeBounds, hasActiveSelection, selectionToJSON, selectionFromJSON } from './lib/selection/selectionTypes';
import { createWhiteMaskDataUrl, createBlackMaskDataUrl, applyMaskToPaintData } from './lib/layer/maskUtils';
import { createAdjustmentLayer } from './lib/layer/adjustmentLayer';
import { compositeLayersToDataUrl, compositeLayerStack, type CompositeOptions } from './lib/layer/compositeLayer';
import Toolbar from './components/Toolbar';
import OptionsBar from './components/OptionsBar';
import LayersPanel from './components/LayersPanel';
import FiltersPanel from './components/FiltersPanel';
import HistoryPanel from './components/HistoryPanel';
import TemplatesModal from './components/TemplatesModal';
import CanvasArea from './components/CanvasArea';
import StatusBar from './components/StatusBar';
import DropdownMenus from './components/DropdownMenus';
import ColorPickerPanel from './components/ColorPickerPanel';
import Minimap from './components/Minimap';
import FontsPanel from './components/FontsPanel';
import ShortcutsModal from './components/ShortcutsModal';

export default function App() {
  // Canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState<number>(1000);
  const [canvasHeight, setCanvasHeight] = useState<number>(700);
  const [projectName, setProjectName] = useState<string>('PhotoFoss Canvas');

  // Workspace state
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');

  // Colors
  const [primaryColor, setPrimaryColor] = useState<string>('#4f8ff7');
  const [secondaryColor, setSecondaryColor] = useState<string>('#ffffff');
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // Brush settings
  const [brushSize, setBrushSize] = useState<number>(15);
  const [brushOpacity, setBrushOpacity] = useState<number>(100);
  const [brushHardness, setBrushHardness] = useState<number>(80);

  // Shapes
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rectangle');
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState<number>(4);

  // Text
  const [textValue, setTextValue] = useState<string>('PhotoFoss');
  const [textFontSize, setTextFontSize] = useState<number>(48);
  const [textFontFamily, setTextFontFamily] = useState<string>('Inter');
  const [textFontWeight, setTextFontWeight] = useState<string>('bold');

  // Panels
  const [activeRightTab, setActiveRightTab] = useState<'layers' | 'filters' | 'history' | 'color' | 'fonts'>('layers');

  // New marquee selection, magnetic lasso, vector path, grid/rulers, zoom and quick mask state
  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; currentX: number; currentY: number; active: boolean; shape: 'rectangle' | 'ellipse' } | null>(null);
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([]);
  const [vectorPath, setVectorPath] = useState<{ x: number; y: number }[]>([]);
  const [quickMaskActive, setQuickMaskActive] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [zoomDirection, setZoomDirection] = useState<'in' | 'out'>('in');

  // Selection Mask & Clipboard
  const [selection, setSelection] = useState<DocumentSelection | null>(null);
  const [editTarget, setEditTarget] = useState<'layer' | 'mask'>('layer');
  const [clipboard, setClipboard] = useState<{
    dataUrl: string;
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  // Crop
  const [tempCanvasWidth, setTempCanvasWidth] = useState<number>(1000);
  const [tempCanvasHeight, setTempCanvasHeight] = useState<number>(700);

  // Adjustments
  const [adjustments, setAdjustments] = useState<Adjustments>({ ...DEFAULT_ADJUSTMENTS });
  const [activePresetName, setActivePresetName] = useState<string>('Default');

  // History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Modals
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(true);
  const [dirty, setDirty] = useState(false);
  const [lastSavedHistoryIndex, setLastSavedHistoryIndex] = useState(-1);

  useEffect(() => {
    if (historyIndex !== lastSavedHistoryIndex) {
      setDirty(true);
    }
  }, [historyIndex, lastSavedHistoryIndex]);

  const handleMarkSaved = () => {
    setLastSavedHistoryIndex(historyIndex);
    setDirty(false);
  };

  const handleExportPngWithSaveMark = () => {
    handleExportFile('png');
    handleMarkSaved();
  };

  const handleExportJpgWithSaveMark = () => {
    handleExportFile('jpg');
    handleMarkSaved();
  };

  const handleExportJsonWithSaveMark = () => {
    handleExportJson();
    handleMarkSaved();
  };

  // New tool settings
  const [antiAliasing, setAntiAliasing] = useState<boolean>(true);
  const [featherRadius, setFeatherRadius] = useState<number>(0);
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [cloneAligned, setCloneAligned] = useState<boolean>(true);
  const [wandTolerance, setWandTolerance] = useState<number>(32);
  const [wandContiguous, setWandContiguous] = useState<boolean>(true);
  const [dodgeBurnExposure, setDodgeBurnExposure] = useState<number>(50);
  const [dodgeBurnRange, setDodgeBurnRange] = useState<TonalRange>('midtones');
  const [blurSharpenStrength, setBlurSharpenStrength] = useState<number>(50);

  // Status bar state
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Refs to prevent stale closures in async handlers
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const canvasWidthRef = useRef(canvasWidth);
  canvasWidthRef.current = canvasWidth;
  const canvasHeightRef = useRef(canvasHeight);
  canvasHeightRef.current = canvasHeight;

  // File input ref for dropdown menu
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize workspace
  useEffect(() => {
    initializeWorkspace(800, 600, 'Creative Workspace');
  }, []);

  const initializeWorkspace = (width: number, height: number, name: string) => {
    setCanvasWidth(width);
    setCanvasHeight(height);
    setTempCanvasWidth(width);
    setTempCanvasHeight(height);
    setProjectName(name);

    const defaultLayer: Layer = {
      id: 'paint_default',
      name: 'Background',
      type: 'paint',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0, y: 0,
      width: width,
      height: height,
      rotation: 0,
      paintNativeWidth: width,
      paintNativeHeight: height,
    };

    setLayers([defaultLayer]);
    setSelectedLayerId('paint_default');
    const baseAdj = { ...DEFAULT_ADJUSTMENTS };
    setAdjustments(baseAdj);
    setActivePresetName('Default');

    setSelection(null);

    const initialState: HistoryState = {
      layers: [defaultLayer],
      selectedLayerId: 'paint_default',
      canvasWidth: width,
      canvasHeight: height,
      adjustments: baseAdj,
      selection: null,
      label: 'New Project',
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  };

  // History
  const pushHistoryState = (
    newLayers: Layer[],
    actionLabel: string,
    dimensionsUpdate?: { w: number; h: number },
    newSelection?: DocumentSelection | null
  ) => {
    const nextWidth = dimensionsUpdate ? dimensionsUpdate.w : canvasWidth;
    const nextHeight = dimensionsUpdate ? dimensionsUpdate.h : canvasHeight;
    const validHistory = history.slice(0, historyIndex + 1);
    const selToPush = newSelection !== undefined ? newSelection : selection;
    const newFrame: HistoryState = {
      layers: newLayers,
      selectedLayerId,
      canvasWidth: nextWidth,
      canvasHeight: nextHeight,
      adjustments: { ...adjustments },
      selection: cloneSelection(selToPush),
      label: actionLabel,
    };
    const nextHistory = [...validHistory, newFrame];
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    setLayers(newLayers);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevFrame = history[prevIdx];
      setHistoryIndex(prevIdx);
      setLayers(prevFrame.layers);
      setSelectedLayerId(prevFrame.selectedLayerId);
      setCanvasWidth(prevFrame.canvasWidth);
      setCanvasHeight(prevFrame.canvasHeight);
      setAdjustments(prevFrame.adjustments);
      setSelection(cloneSelection(prevFrame.selection));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextFrame = history[nextIdx];
      setHistoryIndex(nextIdx);
      setLayers(nextFrame.layers);
      setSelectedLayerId(nextFrame.selectedLayerId);
      setCanvasWidth(nextFrame.canvasWidth);
      setCanvasHeight(nextFrame.canvasHeight);
      setAdjustments(nextFrame.adjustments);
      setSelection(cloneSelection(nextFrame.selection));
    }
  };

  const handleJumpToHistory = (idx: number) => {
    if (idx >= 0 && idx < history.length) {
      const frame = history[idx];
      setHistoryIndex(idx);
      setLayers(frame.layers);
      setSelectedLayerId(frame.selectedLayerId);
      setCanvasWidth(frame.canvasWidth);
      setCanvasHeight(frame.canvasHeight);
      setAdjustments(frame.adjustments);
      setSelection(cloneSelection(frame.selection));
    }
  };

  const handleClearFutureHistory = () => {
    if (history.length > 0) setHistory(history.slice(0, historyIndex + 1));
  };

  // Layer operations
  const handleUpdateLayerProperty = (id: string, prop: keyof Layer, value: any) => {
    setLayers(prev => prev.map((l) => l.id !== id ? l : { ...l, [prop]: value }));
  };

  const handleUpdateLayerProperties = (id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map((l) => l.id !== id ? l : { ...l, ...updates }));
  };

  const handleCommitTransform = (id: string, updates: Partial<Layer>, label: string = 'Transform Layer') => {
    const updated = layers.map((l) => l.id !== id ? l : { ...l, ...updates });
    pushHistoryState(updated, label);
  };

  const handleCommitPaint = (layerId: string, dataUrl: string, nativeW?: number, nativeH?: number) => {
    const updated = layers.map((l) => l.id !== layerId ? l : {
      ...l,
      paintDataUrl: dataUrl,
      ...(nativeW != null && { paintNativeWidth: nativeW }),
      ...(nativeH != null && { paintNativeHeight: nativeH }),
    });
    pushHistoryState(updated, 'Paint Modified');
  };

  const handleAddPaintLayer = () => {
    const newL: Layer = {
      id: 'paint_' + Date.now(), name: `Paint ${layers.length + 1}`,
      type: 'paint', visible: true, locked: false, opacity: 100, blendMode: 'normal',
      x: 0, y: 0, width: canvasWidth, height: canvasHeight, rotation: 0,
      paintNativeWidth: canvasWidth, paintNativeHeight: canvasHeight,
    };
    pushHistoryState([...layers, newL], 'New Paint Layer');
    setSelectedLayerId(newL.id);
  };

  const handleAddTextLayer = () => {
    const newL: Layer = {
      id: 'text_' + Date.now(), name: `Text ${layers.length + 1}`,
      type: 'text', visible: true, locked: false, opacity: 100, blendMode: 'normal',
      x: Math.round((canvasWidth - 300) / 2), y: Math.round((canvasHeight - textFontSize) / 2),
      width: 400, height: Math.round(textFontSize * 1.5), rotation: 0,
      text: textValue, fontSize: textFontSize, fontFamily: textFontFamily, fontWeight: textFontWeight, fillColor: primaryColor,
    };
    pushHistoryState([...layers, newL], 'New Text');
    setSelectedLayerId(newL.id);
  };

  const handleAddTextLayerAt = (x: number, y: number) => {
    const newL: Layer = {
      id: 'text_' + Date.now(), name: `Text ${layers.length + 1}`,
      type: 'text', visible: true, locked: false, opacity: 100, blendMode: 'normal',
      x: Math.max(0, x), y: Math.max(0, y),
      width: 320, height: Math.round(textFontSize * 1.5), rotation: 0,
      text: textValue, fontSize: textFontSize, fontFamily: textFontFamily, fontWeight: textFontWeight, fillColor: primaryColor,
    };
    pushHistoryState([...layers, newL], 'Text Placed');
    setSelectedLayerId(newL.id);
  };

  const handleAddShapeLayer = () => {
    const newL: Layer = {
      id: 'shape_' + Date.now(), name: `${activeShapeType} Shape`,
      type: 'shape', visible: true, locked: false, opacity: 100, blendMode: 'normal',
      x: Math.round((canvasWidth - 200) / 2), y: Math.round((canvasHeight - 200) / 2),
      width: 200, height: 200, rotation: 0,
      shapeType: activeShapeType, fillColor: primaryColor, strokeColor: secondaryColor, strokeWidth: shapeStrokeWidth,
    };
    pushHistoryState([...layers, newL], 'New Shape');
    setSelectedLayerId(newL.id);
  };

  const handleAddShapeLayerAt = (x: number, y: number, w: number, h: number) => {
    const newL: Layer = {
      id: 'shape_' + Date.now(), name: `${activeShapeType} Shape`,
      type: 'shape', visible: true, locked: false, opacity: 100, blendMode: 'normal',
      x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h), rotation: 0,
      shapeType: activeShapeType, fillColor: primaryColor, strokeColor: secondaryColor, strokeWidth: shapeStrokeWidth,
    };
    pushHistoryState([...layers, newL], 'Shape Drawn');
    setSelectedLayerId(newL.id);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const tempImg = new Image();
        tempImg.onload = () => {
          const cw = canvasWidthRef.current;
          const ch = canvasHeightRef.current;
          const ratio = Math.min((cw - 100) / tempImg.width, (ch - 100) / tempImg.height, 1);
          const w = Math.round(tempImg.width * ratio);
          const h = Math.round(tempImg.height * ratio);
          const newLayer: Layer = {
            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: file.name.split('.')[0], type: 'image', imageUrl: url,
            visible: true, locked: false, opacity: 100, blendMode: 'normal',
            x: Math.round((cw - w) / 2), y: Math.round((ch - h) / 2),
            width: w, height: h, rotation: 0,
          };
          const nextLst = [...layersRef.current, newLayer];
          pushHistoryState(nextLst, `Import: ${file.name}`);
          setSelectedLayerId(newLayer.id);
        };
        tempImg.src = url;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteLayer = () => {
    if (!selectedLayerId) return;
    const nextLayers = layers.filter((l) => l.id !== selectedLayerId);
    pushHistoryState(nextLayers, 'Delete Layer');
    setSelectedLayerId(nextLayers.length > 0 ? nextLayers[nextLayers.length - 1].id : null);
  };

  const handleDuplicateLayer = () => {
    if (!selectedLayerId) return;
    const target = layers.find((l) => l.id === selectedLayerId);
    if (!target) return;
    const copy: Layer = { ...target, id: 'clone_' + Date.now(), name: `${target.name} Copy`, x: target.x + 25, y: target.y + 25 };
    pushHistoryState([...layers, copy], 'Duplicate Layer');
    setSelectedLayerId(copy.id);
  };

  const handleMoveLayerUp = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1 || idx === layers.length - 1) return;
    const next = [...layers];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    pushHistoryState(next, 'Layer Up');
  };

  const handleMoveLayerDown = (id: string) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1 || idx === 0) return;
    const next = [...layers];
    [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
    pushHistoryState(next, 'Layer Down');
  };

  const handleToggleVisibility = (id: string) => {
    setLayers(layers.map((l) => l.id !== id ? l : { ...l, visible: !l.visible }));
  };

  const handleAlignLayer = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedLayerId) return;
    const updated = layers.map((l) => {
      if (l.id !== selectedLayerId) return l;
      let nextX = l.x, nextY = l.y;
      if (alignment === 'center') nextX = (canvasWidth - l.width) / 2;
      if (alignment === 'middle') nextY = (canvasHeight - l.height) / 2;
      if (alignment === 'left') nextX = 0;
      if (alignment === 'right') nextX = canvasWidth - l.width;
      if (alignment === 'top') nextY = 0;
      if (alignment === 'bottom') nextY = canvasHeight - l.height;
      return { ...l, x: Math.round(nextX), y: Math.round(nextY) };
    });
    pushHistoryState(updated, 'Align');
  };

  const handleFlipLayer = (direction: 'horizontal' | 'vertical') => {
    if (!selectedLayerId) return;
    const updated = layers.map((l) => {
      if (l.id !== selectedLayerId) return l;
      if (direction === 'horizontal') return { ...l, x: Math.round(canvasWidth - l.x - l.width) };
      return { ...l, y: Math.round(canvasHeight - l.y - l.height) };
    });
    pushHistoryState(updated, `Flip ${direction}`);
  };

  const handleApplyResizeCrop = () => {
    setCanvasWidth(tempCanvasWidth);
    setCanvasHeight(tempCanvasHeight);
    setSelection(null);
    pushHistoryState(layers, 'Resize Canvas', { w: tempCanvasWidth, h: tempCanvasHeight }, null);
  };

  // Adjustments (Legacy unused state, keeping for type compat)
  const handleUpdateAdjustmentLayer = (layerId: string, key: keyof Adjustments, value: any) => {
    const updated = layers.map(l =>
      l.id !== layerId ? l : {
        ...l,
        adjustmentParams: { ...l.adjustmentParams!, [key]: value },
      }
    );
    pushHistoryState(updated, 'Adjustment Modified');
  };

  const handleApplyPreset = (name: string) => {
    setActivePresetName(name);
    if (!selectedLayerId) return;
    const layer = layers.find(l => l.id === selectedLayerId);
    if (!layer || layer.type !== 'adjustment') return;

    const base = { ...DEFAULT_ADJUSTMENTS };
    let newParams = { ...base };
    switch (name) {
      case 'WarmGlow': newParams = { ...base, brightness: 10, contrast: 5, saturation: 25, sepia: 15, temperature: 30 }; break;
      case 'CoolDusks': newParams = { ...base, saturation: 10, hueRotate: 180, brightness: -5, sepia: 5, contrast: 8, temperature: -40 }; break;
      case 'Cyberpunk': newParams = { ...base, saturation: 60, contrast: 20, brightness: 5, hueRotate: 310, vibrance: 40, shadowsColor: '#6600cc', shadowsIntensity: 30 }; break;
      case 'B&W': newParams = { ...base, grayscale: 100, contrast: 30, brightness: 10 }; break;
      case 'ClassicSepia': newParams = { ...base, sepia: 85, contrast: -10, brightness: -5, temperature: 20 }; break;
      case 'Nordic': newParams = { ...base, saturation: -60, contrast: 15, brightness: 5, sepia: 10, temperature: -15 }; break;
      case 'Polaroid': newParams = { ...base, contrast: -15, brightness: 10, saturation: -10, sepia: 20, toneCurve: 'fade' }; break;
      case 'Cinematic': newParams = { ...base, contrast: 20, saturation: -10, temperature: -15, shadowsColor: '#008888', shadowsIntensity: 25, highlightsColor: '#ffaa44', highlightsIntensity: 20, toneCurve: 'medium-s' }; break;
      case 'FilmNoir': newParams = { ...base, grayscale: 100, contrast: 40, brightness: -10, toneCurve: 'strong-s', vignette: 60 }; break;
      case 'Sunset': newParams = { ...base, temperature: 50, saturation: 20, brightness: 5, highlightsColor: '#ffcc44', highlightsIntensity: 30, shadowsColor: '#cc4400', shadowsIntensity: 15 }; break;
      case 'Matte': newParams = { ...base, contrast: -10, brightness: 5, toneCurve: 'fade', saturation: -15, temperature: 5 }; break;
      case 'VintageFilm': newParams = { ...base, sepia: 30, saturation: -20, contrast: -5, brightness: -5, temperature: 15, toneCurve: 'fade', shadowsColor: '#446600', shadowsIntensity: 20, highlightsColor: '#ffddaa', highlightsIntensity: 15 }; break;
      case 'TealOrange': newParams = { ...base, saturation: 10, contrast: 15, shadowsColor: '#008888', shadowsIntensity: 35, highlightsColor: '#ff8844', highlightsIntensity: 30, splitToneBalance: 10, toneCurve: 'slight-s' }; break;
      default: newParams = base;
    }
    const updated = layers.map(l =>
      l.id !== selectedLayerId ? l : { ...l, adjustmentParams: newParams }
    );
    pushHistoryState(updated, `Apply Preset: ${name}`);
  };

  const handleResetAdjustments = () => handleApplyPreset('Default');

  const handleAddAdjustmentLayer = (kind: 'full' = 'full') => {
    const newLayer = createAdjustmentLayer(canvasWidth, canvasHeight, 'Adjustments ' + (layers.filter(l => l.type === 'adjustment').length + 1), { ...DEFAULT_ADJUSTMENTS }, kind);
    const updated = [...layers, newLayer];
    pushHistoryState(updated, 'New Adjustment Layer');
    setSelectedLayerId(newLayer.id);
    setActiveRightTab('filters');
  };

  // Layer Mask Actions
  const handleAddLayerMask = (layerId: string, mode: 'reveal-all' | 'hide-all' = 'reveal-all') => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.hasMask) return;
    const maskDataUrl = mode === 'hide-all'
      ? createBlackMaskDataUrl(layer.width, layer.height)
      : createWhiteMaskDataUrl(layer.width, layer.height);
    const updated = layers.map(l => l.id !== layerId ? l : {
      ...l,
      hasMask: true,
      maskEnabled: true,
      maskLinked: true,
      maskDataUrl,
    });
    pushHistoryState(updated, 'Add Layer Mask');
    setEditTarget('mask');
  };

  const handleDeleteLayerMask = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.hasMask) return;
    const updated = layers.map(l => l.id !== layerId ? l : {
      ...l,
      hasMask: false,
      maskEnabled: true,
      maskLinked: true,
      maskDataUrl: undefined,
    });
    pushHistoryState(updated, 'Delete Layer Mask');
    setEditTarget('layer');
  };

  const handleCommitMask = (layerId: string, dataUrl: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.hasMask) return;
    const updated = layers.map(l => l.id !== layerId ? l : {
      ...l,
      maskDataUrl: dataUrl,
    });
    pushHistoryState(updated, 'Mask Modified');
  };

  const handleApplyLayerMask = async (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.hasMask || !layer.maskDataUrl) return;

    if (layer.type === 'paint' && layer.paintDataUrl) {
      const newPaintUrl = await applyMaskToPaintData(
        layer.paintDataUrl,
        layer.maskDataUrl,
        layer.width,
        layer.height
      );
      const updated = layers.map(l => l.id !== layerId ? l : {
        ...l,
        paintDataUrl: newPaintUrl,
        hasMask: false,
        maskEnabled: true,
        maskLinked: true,
        maskDataUrl: undefined,
      });
      pushHistoryState(updated, 'Apply Layer Mask');
      setEditTarget('layer');
    } else if (layer.type === 'image' && layer.imageUrl) {
      const newPaintUrl = await applyMaskToPaintData(
        layer.imageUrl,
        layer.maskDataUrl,
        layer.width,
        layer.height
      );
      const updated = layers.map(l => l.id !== layerId ? l : {
        ...l,
        type: 'paint' as const,
        paintDataUrl: newPaintUrl,
        paintNativeWidth: l.width,
        paintNativeHeight: l.height,
        imageUrl: undefined,
        hasMask: false,
        maskEnabled: true,
        maskLinked: true,
        maskDataUrl: undefined,
      });
      pushHistoryState(updated, 'Apply Layer Mask');
      setEditTarget('layer');
    } else {
      const updated = layers.map(l => l.id !== layerId ? l : {
        ...l,
        hasMask: false,
        maskEnabled: true,
        maskLinked: true,
        maskDataUrl: undefined,
      });
      pushHistoryState(updated, 'Remove Layer Mask');
      setEditTarget('layer');
    }
  };

  const handleMaskFromSelection = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.hasMask || !selection || !selection.hasSelection) return;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = layer.width;
    maskCanvas.height = layer.height;
    const mCtx = maskCanvas.getContext('2d');
    if (mCtx) {
      const mImgData = mCtx.createImageData(layer.width, layer.height);
      const mData = mImgData.data;
      for (let sy = 0; sy < layer.height; sy++) {
        for (let sx = 0; sx < layer.width; sx++) {
          const cx = layer.x + sx;
          const cy = layer.y + sy;
          let alpha = 0;
          if (cx >= 0 && cx < canvasWidth && cy >= 0 && cy < canvasHeight) {
            alpha = selection.data[cy * canvasWidth + cx];
          }
          const idx = (sy * layer.width + sx) * 4;
          mData[idx] = alpha;      // Grayscale R
          mData[idx + 1] = alpha;  // Grayscale G
          mData[idx + 2] = alpha;  // Grayscale B
          mData[idx + 3] = 255;    // Keep A solid
        }
      }
      mCtx.putImageData(mImgData, 0, 0);
      const maskDataUrl = maskCanvas.toDataURL();
      const updated = layers.map(l => l.id !== layerId ? l : {
        ...l,
        hasMask: true,
        maskEnabled: true,
        maskLinked: true,
        maskDataUrl,
      });
      pushHistoryState(updated, 'Mask from Selection');
      setEditTarget('mask');
    }
  };

  const handleToggleMaskProperty = (layerId: string, prop: 'maskEnabled' | 'maskLinked') => {
    const updated = layers.map(l => l.id !== layerId ? l : {
      ...l,
      [prop]: !l[prop],
    });
    pushHistoryState(updated, `Toggle Mask ${prop === 'maskEnabled' ? 'Enabled' : 'Linked'}`);
  };

  // Clipping mask toggle
  const handleToggleClippingMask = (layerId: string) => {
    const idx = layers.findIndex(l => l.id === layerId);
    if (idx <= 0) return; // Can't clip the bottom-most layer
    const updated = layers.map(l => l.id !== layerId ? l : {
      ...l,
      clippingMask: !l.clippingMask,
    });
    const layer = layers[idx];
    pushHistoryState(updated, layer.clippingMask ? 'Release Clipping Mask' : 'Create Clipping Mask');
  };

  // Reset editTarget when selected layer changes
  useEffect(() => {
    if (editTarget === 'mask') {
      const sel = layers.find(l => l.id === selectedLayerId);
      if (!sel || !sel.hasMask) {
        setEditTarget('layer');
      }
    }
  }, [selectedLayerId]);

  // Shared composite options builder for DOM canvases
  const getCompositeOptions = (): CompositeOptions => ({
    getPaintCanvas: (id) => document.getElementById(`canvas-paint-${id}`) as HTMLCanvasElement,
    getMaskCanvas: (id) => document.getElementById(`canvas-mask-${id}`) as HTMLCanvasElement,
    getImageElement: (id) => document.getElementById(`temp-img-${id}`) as HTMLImageElement,
  });

  // Layer merge operations — bake actual pixels via compositeLayersToDataUrl
  const handleFlattenImage = () => {
    if (layers.length < 2) return;
    const dataUrl = compositeLayersToDataUrl(
      layers, canvasWidth, canvasHeight, getCompositeOptions()
    );
    const mergedLayer: Layer = {
      id: 'flat_' + Date.now(),
      name: 'Flattened',
      type: 'paint',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0, y: 0,
      width: canvasWidth,
      height: canvasHeight,
      rotation: 0,
      paintDataUrl: dataUrl,
      paintNativeWidth: canvasWidth,
      paintNativeHeight: canvasHeight,
    };
    pushHistoryState([mergedLayer], 'Flatten Image');
    setSelectedLayerId(mergedLayer.id);
  };

  const handleMergeDown = () => {
    if (!selectedLayerId) return;
    const idx = layers.findIndex(l => l.id === selectedLayerId);
    if (idx <= 0) return;
    const current = layers[idx];
    const below = layers[idx - 1];

    // Bake both layers onto an offscreen canvas
    const twoLayers = [below, current];
    const dataUrl = compositeLayersToDataUrl(
      twoLayers, canvasWidth, canvasHeight, getCompositeOptions()
    );
    const merged: Layer = {
      id: below.id,
      name: `${below.name} + ${current.name}`,
      type: 'paint',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0, y: 0,
      width: canvasWidth,
      height: canvasHeight,
      rotation: 0,
      paintDataUrl: dataUrl,
      paintNativeWidth: canvasWidth,
      paintNativeHeight: canvasHeight,
    };
    const newLayers = layers.filter((_, i) => i !== idx).map(l => l.id === below.id ? merged : l);
    pushHistoryState(newLayers, 'Merge Down');
    setSelectedLayerId(merged.id);
  };

  const handleMergeVisible = () => {
    const visible = layers.filter(l => l.visible);
    if (visible.length < 2) return;
    const hidden = layers.filter(l => !l.visible);
    const dataUrl = compositeLayersToDataUrl(
      visible, canvasWidth, canvasHeight, getCompositeOptions()
    );
    const merged: Layer = {
      id: 'merged_' + Date.now(),
      name: 'Merged Visible',
      type: 'paint',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: 0, y: 0,
      width: canvasWidth,
      height: canvasHeight,
      rotation: 0,
      paintDataUrl: dataUrl,
      paintNativeWidth: canvasWidth,
      paintNativeHeight: canvasHeight,
    };
    pushHistoryState([...hidden, merged], 'Merge Visible');
    setSelectedLayerId(merged.id);
  };

  // Export — uses shared compositeLayersToDataUrl helper
  const handleExportFile = (format: 'png' | 'jpg') => {
    // Build export canvas with optional white background for JPG
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasWidth;
    exportCanvas.height = canvasHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (format === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const visibleLayers = layers.filter(l => l.visible);
    compositeLayerStack(ctx, visibleLayers, canvasWidth, canvasHeight, getCompositeOptions());

    const dataUrl = exportCanvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png');
    const dlLink = document.createElement('a');
    dlLink.download = `${projectName.replace(/\s+/g, '_')}.${format}`;
    dlLink.href = dataUrl;
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify({
      canvasWidth,
      canvasHeight,
      projectName,
      layers,
      adjustments,
      selection: selectionToJSON(selection)
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${projectName.replace(/\s+/g, '_')}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        if (payload.layers) {
          setCanvasWidth(payload.canvasWidth || 800);
          setCanvasHeight(payload.canvasHeight || 600);
          setProjectName(payload.projectName || 'Imported');
          
          let parsedLayers = payload.layers as Layer[];
          const oldAdjustments = payload.adjustments;
          
          // Migration: if there are global adjustments but no adjustment layers
          if (oldAdjustments) {
            const hasAdjustmentLayer = parsedLayers.some(l => l.type === 'adjustment');
            const isNonDefault = JSON.stringify(oldAdjustments) !== JSON.stringify(DEFAULT_ADJUSTMENTS);
            
            if (isNonDefault && !hasAdjustmentLayer) {
              const globalAdjLayer = createAdjustmentLayer(
                payload.canvasWidth || 800,
                payload.canvasHeight || 600,
                'Global Effects',
                oldAdjustments,
                'full'
              );
              parsedLayers = [...parsedLayers, globalAdjLayer];
            }
          }
          
          setLayers(parsedLayers);
          setAdjustments({ ...DEFAULT_ADJUSTMENTS });
          
          const importedSel = payload.selection ? selectionFromJSON(payload.selection) : null;
          setSelection(importedSel);

          const importFrame: HistoryState = {
            layers: parsedLayers, selectedLayerId: parsedLayers[0]?.id || null,
            canvasWidth: payload.canvasWidth || 800, canvasHeight: payload.canvasHeight || 600,
            adjustments: { ...DEFAULT_ADJUSTMENTS },
            selection: importedSel,
            label: 'Import JSON',
          };
          setHistory([importFrame]);
          setHistoryIndex(0);
          setSelectedLayerId(payload.layers[0]?.id || null);
        }
      } catch { alert('Invalid JSON file.'); }
    };
    r.readAsText(file);
  };

  // Selection helpers
  const handleSelectionChange = (newSel: DocumentSelection | null, label?: string) => {
    setSelection(newSel);
    pushHistoryState(layers, label || 'Selection Changed', undefined, newSel);
  };

  const handleSelectAll = () => {
    const sel = emptySelection(canvasWidth, canvasHeight);
    sel.data.fill(255);
    sel.shape = 'rect';
    sel.bounds = { x: 0, y: 0, w: canvasWidth, h: canvasHeight };
    sel.hasSelection = true;
    handleSelectionChange(sel, 'Select All');
  };

  const handleDeselect = () => {
    setSelectionRect(null);
    setLassoPoints([]);
    handleSelectionChange(null, 'Deselect');
  };

  const handleInvertSelection = () => {
    if (!selection) return;
    const sel = emptySelection(canvasWidth, canvasHeight);
    for (let i = 0; i < selection.data.length; i++) {
      sel.data[i] = 255 - selection.data[i];
    }
    sel.shape = 'none';
    sel.bounds = computeBounds(sel.data, canvasWidth, canvasHeight);
    sel.hasSelection = sel.bounds !== null;
    handleSelectionChange(sel, 'Invert Selection');
  };

  const handleCopy = () => {
    if (!selectedLayer || !selection || !selection.bounds) return;
    const { x, y, w, h } = selection.bounds;

    const copyCanvas = document.createElement('canvas');
    copyCanvas.width = w;
    copyCanvas.height = h;
    const copyCtx = copyCanvas.getContext('2d');
    if (!copyCtx) return;

    copyCtx.save();
    copyCtx.translate(-x, -y);

    if (selectedLayer.type === 'paint') {
      const layerCanvas = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (layerCanvas) {
        copyCtx.drawImage(layerCanvas, selectedLayer.x, selectedLayer.y);
      }
    } else if (selectedLayer.type === 'image') {
      const img = document.getElementById(`temp-img-${selectedLayer.id}`) as HTMLImageElement;
      if (img && img.complete) {
        copyCtx.drawImage(img, selectedLayer.x, selectedLayer.y, selectedLayer.width, selectedLayer.height);
      }
    }
    copyCtx.restore();

    const imgData = copyCtx.getImageData(0, 0, w, h);
    const pixels = imgData.data;
    for (let py = 0; py < h; py++) {
      const docY = y + py;
      for (let px = 0; px < w; px++) {
        const docX = x + px;
        if (docX >= 0 && docX < selection.width && docY >= 0 && docY < selection.height) {
          const maskAlpha = selection.data[docY * selection.width + docX];
          const idx = (py * w + px) * 4;
          pixels[idx + 3] = Math.round(pixels[idx + 3] * (maskAlpha / 255));
        } else {
          const idx = (py * w + px) * 4;
          pixels[idx + 3] = 0;
        }
      }
    }
    copyCtx.putImageData(imgData, 0, 0);

    setClipboard({
      dataUrl: copyCanvas.toDataURL(),
      width: w,
      height: h,
      x,
      y
    });
  };

  const handlePaste = () => {
    if (!clipboard) return;

    const cw = canvasWidthRef.current;
    const ch = canvasHeightRef.current;
    const pasteX = Math.round((cw - clipboard.width) / 2);
    const pasteY = Math.round((ch - clipboard.height) / 2);
    const newLayerId = 'paint_' + Date.now();

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cw;
    tempCanvas.height = ch;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const img = new Image();
    img.onload = () => {
      tempCtx.drawImage(img, pasteX, pasteY);
      const newL: Layer = {
        id: newLayerId,
        name: `Pasted Layer`,
        type: 'paint',
        visible: true,
        locked: false,
        opacity: 100,
        blendMode: 'normal',
        x: 0,
        y: 0,
        width: cw,
        height: ch,
        rotation: 0,
        paintDataUrl: tempCanvas.toDataURL(),
        paintNativeWidth: cw,
        paintNativeHeight: ch,
      };
      pushHistoryState([...layersRef.current, newL], 'Paste');
      setSelectedLayerId(newL.id);
    };
    img.src = clipboard.dataUrl;
  };

  const handleDeleteSelectionPixels = () => {
    if (!selectedLayer || selectedLayer.locked || !selection || !selection.hasSelection) {
      if (selectedLayer && !selectedLayer.locked && (!selection || !selection.hasSelection)) {
        handleDeleteLayer();
      }
      return;
    }

    if (selectedLayer.type === 'paint') {
      const pc = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (pc) {
        const ctx = pc.getContext('2d');
        if (ctx) {
          const w = selectedLayer.width;
          const h = selectedLayer.height;
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          for (let y = 0; y < h; y++) {
            const docY = y + selectedLayer.y;
            for (let x = 0; x < w; x++) {
              const docX = x + selectedLayer.x;
              if (docX >= 0 && docX < selection.width && docY >= 0 && docY < selection.height) {
                const maskAlpha = selection.data[docY * selection.width + docX];
                if (maskAlpha > 0) {
                  const idx = (y * w + x) * 4;
                  data[idx + 3] = Math.round(data[idx + 3] * (1 - maskAlpha / 255));
                }
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          handleCommitPaint(selectedLayer.id, pc.toDataURL());
        }
      }
    }
  };

  const handleFillSelection = () => {
    if (!selectedLayer || selectedLayer.locked || !selection || !selection.hasSelection) return;

    if (selectedLayer.type === 'paint') {
      const pc = document.getElementById(`canvas-paint-${selectedLayer.id}`) as HTMLCanvasElement;
      if (pc) {
        const ctx = pc.getContext('2d');
        if (ctx) {
          ctx.save();
          // Create offscreen selection mask canvas
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = selection.width;
          maskCanvas.height = selection.height;
          const mCtx = maskCanvas.getContext('2d');
          if (mCtx) {
            const imgData = mCtx.createImageData(selection.width, selection.height);
            const data = imgData.data;
            for (let i = 0; i < selection.data.length; i++) {
              data[i * 4 + 3] = selection.data[i];
            }
            mCtx.putImageData(imgData, 0, 0);
          }

          // Create temp canvas for fill
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = selectedLayer.width;
          tempCanvas.height = selectedLayer.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.fillStyle = primaryColor;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.globalCompositeOperation = 'destination-in';
            tempCtx.drawImage(maskCanvas, -selectedLayer.x, -selectedLayer.y);

            ctx.drawImage(tempCanvas, 0, 0);
          }
          ctx.restore();
          handleCommitPaint(selectedLayer.id, pc.toDataURL());
        }
      }
    }
  };

  // Color helpers
  const handleSwapColors = () => {
    const tmp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(tmp);
  };

  const handleAddRecentColor = (color: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      return [color, ...filtered].slice(0, 20);
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); handleUndo(); return; }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); handleRedo(); return; }
      if (e.ctrlKey && (e.key === 'j' || e.key === 'J')) { e.preventDefault(); handleDuplicateLayer(); return; }
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); handleSelectAll(); return; }
      if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); handleDeselect(); return; }
      if (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); handleInvertSelection(); return; }
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); handleCopy(); return; }
      if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) { e.preventDefault(); handlePaste(); return; }
      if (e.ctrlKey && e.altKey && (e.key === 'g' || e.key === 'G')) { e.preventDefault(); if (selectedLayerId) handleToggleClippingMask(selectedLayerId); return; }
      if (e.shiftKey && e.key === 'F5') { e.preventDefault(); handleFillSelection(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selection && selection.hasSelection) {
          handleDeleteSelectionPixels();
        } else {
          handleDeleteLayer();
        }
        return;
      }
      if (e.key === 'x' || e.key === 'X') { handleSwapColors(); return; }
      if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); setQuickMaskActive(prev => !prev); return; }
      if (e.key === '\\') { e.preventDefault(); setEditTarget(prev => { if (prev === 'layer') { const sel = layers.find(l => l.id === selectedLayerId); return sel?.hasMask ? 'mask' : 'layer'; } return 'layer'; }); return; }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) { e.preventDefault(); setIsShortcutsOpen(true); return; }

      const shortcuts: Record<string, ToolType> = {
        'v': 'select', 'b': 'brush', 'e': 'eraser', 'u': 'shape',
        't': 'text', 'g': 'gradient', 'i': 'eyedropper', 'c': 'crop',
        's': 'clone', 'o': 'dodge', 'r': 'smudge', 'w': 'magic-wand', 'p': 'pen',
        'm': e.shiftKey ? 'ellipse-select' : 'rect-select',
        'l': 'magnetic-lasso',
        'a': 'path-select',
        'h': 'magic-heal',
        'z': 'zoom',
      };
      const tool = shortcuts[e.key.toLowerCase()];
      if (tool) setActiveTool(tool);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, primaryColor, secondaryColor, selectedLayerId, layers, selection, clipboard]);

  const selectedLayer = layers.find(l => l.id === selectedLayerId) || null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg-app text-text-secondary font-sans">
      {/* Header */}
      <header id="app-header" className="h-10 bg-bg-panel border-b border-border-default flex items-center justify-between px-3 select-none shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PhotoFoss" className="w-6 h-6 rounded-md" />
            <span className="font-extrabold text-[11px] text-gradient-brand leading-tight uppercase tracking-wider">
              PhotoFoss
            </span>
            {dirty && (
              <span className="text-[9px] text-red-500 font-bold bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded ml-1">
                Unsaved
              </span>
            )}
          </div>

          <div className="w-px h-5 bg-border-subtle mx-1" />

          {/* Project name */}
          <input
            type="text"
            id="editor-project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent font-semibold border-b border-transparent hover:border-border-hover focus:border-accent-blue hover:bg-bg-hover/50 focus:outline-none focus:bg-bg-surface px-2 py-0.5 text-[11px] text-text-primary rounded max-w-[140px] truncate transition-colors"
            title="Rename Project"
          />

          <div className="w-px h-5 bg-border-subtle mx-1" />

          {/* Dropdown Menus */}
          <DropdownMenus
            onNewProject={() => setIsTemplatesOpen(true)}
            onImageUpload={() => fileInputRef.current?.click()}
            onImportJson={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'; input.onchange = (e) => handleImportJson(e as any); input.click(); }}
            onExportPng={handleExportPngWithSaveMark}
            onExportJpg={handleExportJpgWithSaveMark}
            onExportJson={handleExportJsonWithSaveMark}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onDeleteLayer={handleDeleteLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onAddPaintLayer={handleAddPaintLayer}
            onAddTextLayer={handleAddTextLayer}
            onAddShapeLayer={handleAddShapeLayer}
            onAddAdjustmentLayer={handleAddAdjustmentLayer}
            onCanvasResize={() => setActiveTool('crop')}
            onFlipHorizontal={() => handleFlipLayer('horizontal')}
            onFlipVertical={() => handleFlipLayer('vertical')}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselect}
            onResetFilters={handleResetAdjustments}
            onOpenFilters={() => setActiveRightTab('filters')}
            hasSelection={!!selectedLayerId}
            onFlattenImage={handleFlattenImage}
            onMergeDown={handleMergeDown}
            onMergeVisible={handleMergeVisible}
            onOpenColorGrading={() => setActiveRightTab('filters')}
            canFlatten={layers.length >= 2}
            canMergeDown={!!selectedLayerId && layers.findIndex(l => l.id === selectedLayerId) > 0}
            canMergeVisible={layers.filter(l => l.visible).length >= 2}
            onZoomIn={() => setZoom(prev => Math.min(10, parseFloat((prev + 0.25).toFixed(2))))}
            onZoomOut={() => setZoom(prev => Math.max(0.1, parseFloat((prev - 0.25).toFixed(2))))}
            onFitScreen={() => { setZoom(1); setPanX(0); setPanY(0); }}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showRulers={showRulers}
            onToggleRulers={() => setShowRulers(!showRulers)}
            quickMaskActive={quickMaskActive}
            onToggleQuickMask={() => setQuickMaskActive(!quickMaskActive)}
            onSelectTab={(tab) => setActiveRightTab(tab)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            hasPixelSelection={hasActiveSelection(selection)}
            onInvertSelection={handleInvertSelection}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onDeleteSelectionPixels={handleDeleteSelectionPixels}
            onFillSelection={handleFillSelection}
            canPaste={!!clipboard}
            onAddLayerMask={handleAddLayerMask}
            onDeleteLayerMask={handleDeleteLayerMask}
            onApplyLayerMask={handleApplyLayerMask}
            onMaskFromSelection={handleMaskFromSelection}
            onToggleMaskEnabled={(id) => handleToggleMaskProperty(id, 'maskEnabled')}
            onToggleMaskLinked={(id) => handleToggleMaskProperty(id, 'maskLinked')}
            hasMask={selectedLayer?.hasMask || false}
            maskEnabled={selectedLayer?.maskEnabled || false}
            maskLinked={selectedLayer?.maskLinked || false}
            selectedLayerId={selectedLayerId}
            onToggleClippingMask={handleToggleClippingMask}
            isClippingMask={selectedLayer?.clippingMask || false}
            canClip={!!selectedLayerId && layers.findIndex(l => l.id === selectedLayerId) > 0}
          />

          {/* Hidden file input for menu */}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
        </div>

      </header>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor}
          setSecondaryColor={setSecondaryColor}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          quickMaskActive={quickMaskActive}
          onToggleQuickMask={() => setQuickMaskActive(!quickMaskActive)}
        />

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <OptionsBar
            activeTool={activeTool}
            selectedLayer={selectedLayer}
            brushSize={brushSize} setBrushSize={setBrushSize}
            brushOpacity={brushOpacity} setBrushOpacity={setBrushOpacity}
            brushHardness={brushHardness} setBrushHardness={setBrushHardness}
            activeShapeType={activeShapeType} setActiveShapeType={setActiveShapeType}
            shapeStrokeWidth={shapeStrokeWidth} setShapeStrokeWidth={setShapeStrokeWidth}
            textValue={textValue} setTextValue={setTextValue}
            textFontSize={textFontSize} setTextFontSize={setTextFontSize}
            textFontFamily={textFontFamily} setTextFontFamily={setTextFontFamily}
            textFontWeight={textFontWeight} setTextFontWeight={setTextFontWeight}
            onAlignLayer={handleAlignLayer} onFlipLayer={handleFlipLayer}
            onDeleteLayer={handleDeleteLayer} onDuplicateLayer={handleDuplicateLayer}
            tempCanvasWidth={tempCanvasWidth} setTempCanvasWidth={setTempCanvasWidth}
            tempCanvasHeight={tempCanvasHeight} setTempCanvasHeight={setTempCanvasHeight}
            onApplyCrop={handleApplyResizeCrop}
            canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo} onRedo={handleRedo}
            antiAliasing={antiAliasing} onToggleAntiAliasing={() => setAntiAliasing(!antiAliasing)}
            featherRadius={featherRadius} setFeatherRadius={setFeatherRadius}
            gradientType={gradientType} setGradientType={setGradientType}
            cloneAligned={cloneAligned} setCloneAligned={setCloneAligned}
            wandTolerance={wandTolerance} setWandTolerance={setWandTolerance}
            wandContiguous={wandContiguous} setWandContiguous={setWandContiguous}
            dodgeBurnExposure={dodgeBurnExposure} setDodgeBurnExposure={setDodgeBurnExposure}
            dodgeBurnRange={dodgeBurnRange} setDodgeBurnRange={setDodgeBurnRange}
            blurSharpenStrength={blurSharpenStrength} setBlurSharpenStrength={setBlurSharpenStrength}
            zoomDirection={zoomDirection} setZoomDirection={setZoomDirection}
            onClearVectorPath={() => setVectorPath([])}
            onCloseVectorPath={() => alert('Vector path closed!')}
            editTarget={editTarget}
          />

          <CanvasArea
            canvasWidth={canvasWidth} canvasHeight={canvasHeight}
            layers={layers} selectedLayerId={selectedLayerId} setSelectedLayerId={setSelectedLayerId}
            activeTool={activeTool}
            primaryColor={primaryColor} secondaryColor={secondaryColor}
            brushSize={brushSize} brushOpacity={brushOpacity} brushHardness={brushHardness}
            activeShapeType={activeShapeType} shapeStrokeWidth={shapeStrokeWidth}
            textValue={textValue} textFontSize={textFontSize} textFontFamily={textFontFamily} textFontWeight={textFontWeight}
            adjustments={adjustments}
            antiAliasing={antiAliasing} featherRadius={featherRadius}
            gradientType={gradientType} blurSharpenStrength={blurSharpenStrength}
            dodgeBurnExposure={dodgeBurnExposure}
            onCommitPaint={handleCommitPaint} onUpdateLayerProperty={handleUpdateLayerProperty}
            onUpdateLayerProperties={handleUpdateLayerProperties}
            onCommitTransform={handleCommitTransform}
            onAddTextLayerAt={handleAddTextLayerAt} onAddShapeLayerAt={handleAddShapeLayerAt}
            onExportPng={handleExportPngWithSaveMark} onExportJpg={handleExportJpgWithSaveMark}
            onExportJson={handleExportJsonWithSaveMark} onImportJson={handleImportJson}
            onSelectColorFromEyedropper={(color) => { setPrimaryColor(color); handleAddRecentColor(color); }}
            onCursorMove={setCursorPosition}
            onZoomChange={setZoom}
            zoom={zoom} setZoom={setZoom}
            panX={panX} setPanX={setPanX}
            panY={panY} setPanY={setPanY}
            onDeleteLayer={handleDeleteLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onAddPaintLayer={handleAddPaintLayer}
            onFlipHorizontal={() => handleFlipLayer('horizontal')}
            onFlipVertical={() => handleFlipLayer('vertical')}
            onAlignLayer={handleAlignLayer}
            onFlattenImage={handleFlattenImage}
            onMergeVisible={handleMergeVisible}
            quickMaskActive={quickMaskActive}
            showGrid={showGrid}
            showRulers={showRulers}
            zoomDirection={zoomDirection}
            setZoomDirection={setZoomDirection}
            selectionRect={selectionRect}
            setSelectionRect={setSelectionRect}
            lassoPoints={lassoPoints}
            setLassoPoints={setLassoPoints}
            vectorPath={vectorPath}
            setVectorPath={setVectorPath}
            selection={selection}
            setSelection={setSelection}
            onSelectionChange={handleSelectionChange}
            wandTolerance={wandTolerance}
            wandContiguous={wandContiguous}
            editTarget={editTarget}
            onCommitMask={handleCommitMask}
          />
        </div>

        {/* Right Panel */}
        <div className="w-72 border-l border-border-default bg-bg-panel flex flex-col select-none shrink-0" id="right-tabbed-sidebars">
          {/* Tab header */}
          <div className="flex border-b border-border-default shrink-0 bg-bg-panel p-1 gap-0.5 select-none">
            {[
              { id: 'layers' as const, label: 'Layers', Icon: Layers },
              { id: 'filters' as const, label: 'Adjust', Icon: Sliders },
              { id: 'history' as const, label: 'History', Icon: HistoryIcon },
              { id: 'color' as const, label: 'Color', Icon: Pipette },
              { id: 'fonts' as const, label: 'Fonts', Icon: Type },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveRightTab(tab.id)}
                className={`flex-1 py-1 px-0.5 rounded font-bold text-[9px] tracking-wide uppercase transition-all flex items-center justify-center gap-1 ${
                  activeRightTab === tab.id
                    ? 'bg-bg-surface text-text-primary border-b-2 border-white'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover/50'
                }`}
              >
                <tab.Icon className={`w-3 h-3 ${activeRightTab === tab.id ? 'text-text-primary' : 'text-text-muted'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden bg-bg-panel" id="tabbed-viewports-holder">
            {activeRightTab === 'layers' && (
              <LayersPanel
                layers={layers} selectedLayerId={selectedLayerId} setSelectedLayerId={setSelectedLayerId}
                onToggleVisibility={handleToggleVisibility} onUpdateLayerProperty={handleUpdateLayerProperty}
                onAddPaintLayer={handleAddPaintLayer} onAddTextLayer={handleAddTextLayer} onAddShapeLayer={handleAddShapeLayer}
                onImageUpload={handleImageUpload} onDeleteLayer={handleDeleteLayer} onDuplicateLayer={handleDuplicateLayer}
                onMoveLayerUp={handleMoveLayerUp} onMoveLayerDown={handleMoveLayerDown}
                onFlattenImage={handleFlattenImage}
                onMergeDown={handleMergeDown}
                onMergeVisible={handleMergeVisible}
                editTarget={editTarget}
                setEditTarget={setEditTarget}
                onAddLayerMask={handleAddLayerMask}
                onDeleteLayerMask={handleDeleteLayerMask}
                onApplyLayerMask={handleApplyLayerMask}
                onMaskFromSelection={handleMaskFromSelection}
                onToggleMaskProperty={handleToggleMaskProperty}
                onToggleClippingMask={handleToggleClippingMask}
              />
            )}
            {activeRightTab === 'filters' && (() => {
              const activeAdjustmentLayer = selectedLayer?.type === 'adjustment' ? selectedLayer : null;
              return (
                <FiltersPanel
                  target={activeAdjustmentLayer ? 'adjustment' : 'none'}
                  adjustments={activeAdjustmentLayer?.adjustmentParams ?? DEFAULT_ADJUSTMENTS}
                  onUpdateAdjustment={(key, val) => {
                    if (activeAdjustmentLayer) {
                      handleUpdateAdjustmentLayer(activeAdjustmentLayer.id, key, val);
                    }
                  }}
                  onResetAdjustments={handleResetAdjustments} onApplyPreset={handleApplyPreset}
                  activePreset={activePresetName}
                />
              );
            })()}
            {activeRightTab === 'history' && (
              <HistoryPanel
                historyLabels={history.map((h) => h.label)} historyIndex={historyIndex}
                onJumpToHistory={handleJumpToHistory} onClearHistory={handleClearFutureHistory}
              />
            )}
            {activeRightTab === 'color' && (
              <ColorPickerPanel
                primaryColor={primaryColor} secondaryColor={secondaryColor}
                onPrimaryChange={setPrimaryColor} onSecondaryChange={setSecondaryColor}
                onSwapColors={handleSwapColors}
                recentColors={recentColors} onAddRecentColor={handleAddRecentColor}
              />
            )}
            {activeRightTab === 'fonts' && (
              <FontsPanel
                textFontFamily={textFontFamily} setTextFontFamily={setTextFontFamily}
                textFontSize={textFontSize} setTextFontSize={setTextFontSize}
                textFontWeight={textFontWeight} setTextFontWeight={setTextFontWeight}
                textValue={textValue} setTextValue={setTextValue}
                selectedLayerName={selectedLayer?.name || null}
              />
            )}
          </div>

          {/* Minimap */}
          <Minimap
            canvasWidth={canvasWidth} canvasHeight={canvasHeight}
            zoom={zoom} panX={panX} panY={panY}
            viewportWidth={800} viewportHeight={500}
            onNavigate={(px, py) => { setPanX(px); setPanY(py); }}
            layers={layers.map(l => ({ id: l.id, type: l.type, visible: l.visible, x: l.x, y: l.y, width: l.width, height: l.height, fillColor: l.fillColor, imageUrl: l.imageUrl }))}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        cursorPosition={cursorPosition}
        canvasWidth={canvasWidth} canvasHeight={canvasHeight}
        zoom={zoom}
        activeLayerName={selectedLayer?.name || null}
        layerCount={layers.length}
        antiAliasing={antiAliasing}
        onToggleAntiAliasing={() => setAntiAliasing(!antiAliasing)}
        selectionBounds={selection?.hasSelection && selection.bounds ? { w: selection.bounds.w, h: selection.bounds.h } : null}
        editTarget={editTarget}
      />

      {/* Modals */}
      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)}
        onCreateProject={(w, h, name) => initializeWorkspace(w, h, name)} />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}
