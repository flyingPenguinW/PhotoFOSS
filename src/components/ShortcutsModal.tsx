/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Search, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string;
  desc: string;
  category: 'Tools' | 'File' | 'Edit' | 'View & Navigation' | 'Layers' | 'Masks';
}

const SHORTCUT_LIST: ShortcutItem[] = [
  // Tools
  { keys: 'V', desc: 'Select / Move Layer', category: 'Tools' },
  { keys: 'M', desc: 'Rectangle Marquee Selection', category: 'Tools' },
  { keys: 'Shift + M', desc: 'Ellipse Marquee Selection', category: 'Tools' },
  { keys: 'L', desc: 'Magnetic Lasso Tool', category: 'Tools' },
  { keys: 'W', desc: 'Magic Wand Selection', category: 'Tools' },
  { keys: 'A', desc: 'Path Selection (Vector Node Edit)', category: 'Tools' },
  { keys: 'B', desc: 'Brush Painting', category: 'Tools' },
  { keys: 'S', desc: 'Clone Stamp Tool', category: 'Tools' },
  { keys: 'H', desc: 'Magical Spot Healing Tool', category: 'Tools' },
  { keys: 'R', desc: 'Smudge Tool', category: 'Tools' },
  { keys: 'E', desc: 'Eraser Tool', category: 'Tools' },
  { keys: 'Shift + B', desc: 'Blur Brush', category: 'Tools' },
  { keys: 'Shift + S', desc: 'Sharpen Brush', category: 'Tools' },
  { keys: 'O', desc: 'Dodge (Lighten Painting)', category: 'Tools' },
  { keys: 'Shift + O', desc: 'Burn (Darken Painting)', category: 'Tools' },
  { keys: 'U', desc: 'Shape Drawing Tool', category: 'Tools' },
  { keys: 'P', desc: 'Pen Tool (Vector Path Drawing)', category: 'Tools' },
  { keys: 'G', desc: 'Gradient Tool', category: 'Tools' },
  { keys: 'Shift + G', desc: 'Paint Bucket Tool', category: 'Tools' },
  { keys: 'T', desc: 'Text Layer Tool', category: 'Tools' },
  { keys: 'I', desc: 'Color Eyedropper', category: 'Tools' },
  { keys: 'C', desc: 'Crop / Canvas Resize', category: 'Tools' },
  
  // File
  { keys: 'Ctrl + N', desc: 'Create New Canvas', category: 'File' },
  { keys: 'Ctrl + O', desc: 'Open External Image File', category: 'File' },
  { keys: 'Ctrl + Shift + S', desc: 'Export Image (PNG)', category: 'File' },
  
  // Edit
  { keys: 'Ctrl + Z', desc: 'Undo Last Action', category: 'Edit' },
  { keys: 'Ctrl + Y', desc: 'Redo Undone Action', category: 'Edit' },
  { keys: 'Ctrl + C', desc: 'Copy Selected Pixels', category: 'Edit' },
  { keys: 'Ctrl + V', desc: 'Paste Pixels as New Paint Layer', category: 'Edit' },
  { keys: 'Ctrl + A', desc: 'Select All Canvas', category: 'Edit' },
  { keys: 'Ctrl + D', desc: 'Deselect Selection Mask', category: 'Edit' },
  { keys: 'Ctrl + Shift + I', desc: 'Invert Selection Mask', category: 'Edit' },
  { keys: 'Shift + F5', desc: 'Fill Selection with Primary Color', category: 'Edit' },
  { keys: 'X', desc: 'Swap Primary and Secondary Colors', category: 'Edit' },
  { keys: 'Q', desc: 'Toggle Quick Mask Mode', category: 'Edit' },
  
  // Layers
  { keys: 'Ctrl + J', desc: 'Duplicate Selected Layer', category: 'Layers' },
  { keys: 'Delete / Backspace', desc: 'Delete Selected Layer / Pixels', category: 'Layers' },
  { keys: 'Alt + Ctrl + G', desc: 'Toggle Clipping Mask', category: 'Layers' },

  // Masks
  { keys: '\\', desc: 'Toggle Layer / Mask Edit Target', category: 'Masks' },
  
  // View & Navigation
  { keys: 'Spacebar + Drag', desc: 'Pan Canvas (Hand Tool)', category: 'View & Navigation' },
  { keys: 'Z + Click', desc: 'Zoom In', category: 'View & Navigation' },
  { keys: 'Alt + Z + Click', desc: 'Zoom Out', category: 'View & Navigation' },
  { keys: 'Ctrl + Plus (+)', desc: 'Quick Zoom In', category: 'View & Navigation' },
  { keys: 'Ctrl + Minus (-)', desc: 'Quick Zoom Out', category: 'View & Navigation' },
  { keys: 'Ctrl + 0 (Zero)', desc: 'Fit Canvas to Screen', category: 'View & Navigation' },
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredShortcuts = SHORTCUT_LIST.filter(item =>
    item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keys.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Tools', 'File', 'Edit', 'Layers', 'Masks', 'View & Navigation'] as const;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal box */}
      <div className="relative w-full max-w-2xl bg-bg-panel border border-border-default rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden panel-glass select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-default bg-bg-surface/30">
          <div className="flex items-center gap-2 text-text-primary">
            <Keyboard className="w-5 h-5 text-text-muted" />
            <span className="font-bold text-sm tracking-wide">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-3 border-b border-border-subtle bg-bg-panel flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Search shortcuts (e.g., zoom, brush, copy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-border-default px-9 py-2 rounded-xl text-text-primary placeholder-text-dim focus:outline-none focus:border-white text-[11px] transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted text-[10px] uppercase font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-10 text-text-dim text-[11px]">
              No shortcuts found matching "{searchQuery}"
            </div>
          ) : searchQuery ? (
            /* Flat search list */
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Search Results ({filteredShortcuts.length})</div>
              {filteredShortcuts.map((item, idx) => (
                <ShortcutRow key={idx} item={item} />
              ))}
            </div>
          ) : (
            /* Categorized grouped lists */
            categories.map(cat => {
              const catItems = filteredShortcuts.filter(i => i.category === cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className="space-y-2">
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border-subtle pb-1">
                    {cat}
                  </div>
                  <div className="space-y-1">
                    {catItems.map((item, idx) => (
                      <ShortcutRow key={idx} item={item} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-bg-surface/30 border-t border-border-default text-center text-[10px] text-text-dim">
          Press <kbd className="px-1.5 py-0.5 bg-bg-surface border border-border-default rounded font-mono text-[9px] text-text-secondary">Q</kbd> to toggle Quick Mask Mode, or click outside to close.
        </div>

      </div>
    </div>
  );
}

function ShortcutRow({ item }: { item: ShortcutItem; key?: any }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 hover:bg-bg-hover/40 rounded-lg transition-colors text-[11px]">
      <span className="text-text-secondary">{item.desc}</span>
      <div className="flex items-center gap-1">
        {item.keys.split('+').map((key, kIdx) => (
          <React.Fragment key={kIdx}>
            {kIdx > 0 && <span className="text-text-dim font-mono text-[9px]">+</span>}
            <kbd className="px-2 py-0.5 bg-bg-surface border border-border-default text-text-primary rounded font-mono text-[10px] font-semibold min-w-[20px] text-center shadow-sm">
              {key.trim()}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
