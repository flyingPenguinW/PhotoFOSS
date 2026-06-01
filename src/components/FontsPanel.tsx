/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Info, Download, Type } from 'lucide-react';
import { FONTS } from '../types';

interface FontsPanelProps {
  textFontFamily: string;
  setTextFontFamily: (font: string) => void;
  textFontSize: number;
  setTextFontSize: (size: number) => void;
  textFontWeight: string;
  setTextFontWeight: (weight: string) => void;
  textValue: string;
  setTextValue: (val: string) => void;
  selectedLayerName: string | null;
}

const FONT_SITES = [
  { name: 'Google Fonts', url: 'https://fonts.google.com', desc: 'Free open source web fonts library' },
  { name: 'DaFont', url: 'https://www.dafont.com', desc: 'Archive of freely downloadable fonts' },
  { name: 'Font Squirrel', url: 'https://www.fontsquirrel.com', desc: 'Handpicked free premium commercial fonts' },
  { name: 'FontSpace', url: 'https://www.fontspace.com', desc: 'Over 100,000 free fonts shared by designers' },
  { name: 'Adobe Fonts', url: 'https://fonts.adobe.com', desc: 'Adobe library of professional commercial fonts' },
];

export default function FontsPanel({
  textFontFamily,
  setTextFontFamily,
  textFontSize,
  setTextFontSize,
  textFontWeight,
  setTextFontWeight,
  textValue,
  setTextValue,
  selectedLayerName,
}: FontsPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customPreviewText, setCustomPreviewText] = useState('The quick brown fox jumps over the lazy dog');

  const copyImportCode = (fontName: string, index: number) => {
    const formattedFont = fontName.replace(/\s+/g, '+');
    const code = `@import url('https://fonts.googleapis.com/css2?family=${formattedFont}:wght@300;400;500;700&display=swap');`;
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-bg-panel text-text-secondary select-none text-[11px]" id="fonts-panel-container">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        
        {/* Selected text layer context info */}
        {selectedLayerName ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-text-primary text-[10px] uppercase tracking-wider">Active Text Layer</div>
              <div className="text-[10px] text-text-muted mt-0.5 truncate max-w-[200px]">Editing: {selectedLayerName}</div>
            </div>
          </div>
        ) : (
          <div className="bg-bg-surface/50 border border-border-subtle rounded-lg p-2 flex items-start gap-2 text-text-muted">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[10px] uppercase">Font Settings</span>
              <p className="text-[10px] leading-relaxed mt-0.5">Select a Text Layer to format directly, or adjust preview defaults below.</p>
            </div>
          </div>
        )}

        {/* Font Select controls */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Active Font Family</label>
          <select
            value={textFontFamily}
            onChange={(e) => setTextFontFamily(e.target.value)}
            className="w-full bg-bg-surface border border-border-default hover:border-border-hover focus:border-white px-2.5 py-1.5 rounded-lg text-text-primary focus:outline-none transition-colors"
          >
            {FONTS.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Font size and weights */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Size (px)</label>
            <input
              type="number"
              min={6}
              max={200}
              value={textFontSize}
              onChange={(e) => setTextFontSize(Math.max(6, parseInt(e.target.value) || 24))}
              className="bg-bg-surface border border-border-default px-2 py-1 rounded-lg text-text-primary font-mono focus:outline-none focus:border-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Weight</label>
            <select
              value={textFontWeight}
              onChange={(e) => setTextFontWeight(e.target.value)}
              className="bg-bg-surface border border-border-default px-2 py-1 rounded-lg text-text-primary focus:outline-none focus:border-white"
            >
              <option value="normal">Normal (400)</option>
              <option value="medium">Medium (500)</option>
              <option value="semibold">SemiBold (600)</option>
              <option value="bold">Bold (700)</option>
              <option value="900">Black (900)</option>
            </select>
          </div>
        </div>

        {/* Font Custom Previewer */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Live Preview Text</label>
            <button
              onClick={() => setCustomPreviewText('The quick brown fox jumps over the lazy dog')}
              className="text-[9px] text-text-secondary hover:text-text-primary hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>
          <input
            type="text"
            value={customPreviewText}
            onChange={(e) => setCustomPreviewText(e.target.value)}
            placeholder="Type here to test fonts..."
            className="w-full bg-bg-surface border border-border-default px-2.5 py-1.5 rounded-lg text-text-primary text-[10px] focus:outline-none focus:border-white"
          />
          <div 
            className="p-3 bg-bg-surface border border-border-subtle rounded-lg text-text-primary overflow-hidden min-h-[50px] flex items-center justify-center text-center break-all transition-all duration-200"
            style={{ 
              fontFamily: textFontFamily, 
              fontSize: `${Math.min(32, Math.max(12, textFontSize))}px`, 
              fontWeight: textFontWeight 
            }}
          >
            {customPreviewText || 'Preview'}
          </div>
        </div>

        {/* Font Downloading Websites */}
        <div className="flex flex-col gap-2.5 mt-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Download className="w-3.5 h-3.5 text-text-muted" />
            Get More Fonts
          </label>
          <div className="flex flex-col gap-2">
            {FONT_SITES.map((site) => (
              <a
                key={site.name}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col p-2 bg-bg-surface/60 hover:bg-bg-hover border border-border-subtle hover:border-border-default rounded-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary group-hover:text-white transition-colors flex items-center gap-1">
                    {site.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
                <span className="text-[9px] text-text-muted mt-0.5 leading-snug">{site.desc}</span>
              </a>
            ))}
          </div>
        </div>

        {/* System Font Imports helper list */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-text-muted" />
            Google Font CSS Imports
          </label>
          <div className="flex flex-col gap-1 bg-bg-surface/30 border border-border-subtle rounded-lg p-1">
            {['Inter', 'Space Grotesk', 'JetBrains Mono', 'Playfair Display'].map((font, idx) => (
              <div key={font} className="flex items-center justify-between py-1 px-1.5 hover:bg-bg-hover rounded transition-colors text-[10px]">
                <span className="font-medium text-text-primary">{font}</span>
                <button
                  onClick={() => copyImportCode(font, idx)}
                  className="p-1 hover:bg-bg-surface rounded text-text-muted hover:text-text-primary flex items-center justify-center transition-colors"
                  title="Copy @import code"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3 h-3 text-text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
