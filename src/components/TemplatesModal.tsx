/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText, Image, Instagram, Youtube, Facebook, Tv, Laptop, Smartphone,
  CreditCard, PlusCircle, X, Sparkle, Search
} from 'lucide-react';
import { ProjectTemplate, TEMPLATES } from '../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (width: number, height: number, name: string) => void;
}

export default function TemplatesModal({ isOpen, onClose, onCreateProject }: TemplatesModalProps) {
  const [activeCategory, setActiveCategory] = useState<'All' | 'Social' | 'Print' | 'Screen' | 'Photo'>('All');
  const [customWidth, setCustomWidth] = useState<number>(1200);
  const [customHeight, setCustomHeight] = useState<number>(800);
  const [customName, setCustomName] = useState<string>('Untitled Design');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = ['All', 'Social', 'Print', 'Screen', 'Photo'];

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchCategory = activeCategory === 'All' || t.category === activeCategory;
    const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getTemplateIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Instagram': <Instagram className="w-5 h-5 text-text-secondary" />,
      'Youtube': <Youtube className="w-5 h-5 text-text-secondary" />,
      'Facebook': <Facebook className="w-5 h-5 text-text-secondary" />,
      'FileText': <FileText className="w-5 h-5 text-text-muted" />,
      'CreditCard': <CreditCard className="w-5 h-5 text-text-secondary" />,
      'Tv': <Tv className="w-5 h-5 text-text-secondary" />,
      'Laptop': <Laptop className="w-5 h-5 text-text-secondary" />,
      'Smartphone': <Smartphone className="w-5 h-5 text-text-secondary" />,
      'Twitter': <span className="text-lg">𝕏</span>,
    };
    return icons[iconName] || <Image className="w-5 h-5 text-text-secondary" />;
  };

  const getAspectPreview = (w: number, h: number) => {
    const maxW = 40, maxH = 30;
    const scale = Math.min(maxW / w, maxH / h);
    return { width: Math.round(w * scale), height: Math.round(h * scale) };
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject(customWidth, customHeight, customName.trim() || 'Custom Project');
    onClose();
  };

  const handleSelectTemplate = (t: ProjectTemplate) => {
    onCreateProject(t.width, t.height, t.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none animate-fade-in">
      <div
        id="templates-modal"
        className="bg-bg-app border border-border-default w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-black/50 flex flex-col md:flex-row h-[580px] text-text-secondary"
      >
        {/* Left: Custom */}
        <div className="md:w-1/3 bg-bg-panel-alt p-6 border-r border-border-default flex flex-col justify-between shrink-0">
          <form onSubmit={handleCreateCustom} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/10 rounded-lg">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-extrabold text-sm text-text-primary tracking-wide">Custom Canvas</h2>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-text-dim uppercase font-bold tracking-wider">Project Name</label>
              <input
                type="text" value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="My Design"
                className="w-full bg-bg-surface border border-border-subtle hover:border-border-hover focus:border-white text-text-primary rounded-lg px-3 py-2 text-[11px] focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-text-dim uppercase font-bold tracking-wider">Width (px)</label>
                <input
                  type="number" min={50} max={4000} value={customWidth}
                  onChange={(e) => setCustomWidth(Math.max(50, Math.min(4000, parseInt(e.target.value) || 100)))}
                  className="w-full bg-bg-surface border border-border-subtle focus:border-white text-text-primary rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-text-dim uppercase font-bold tracking-wider">Height (px)</label>
                <input
                  type="number" min={50} max={4000} value={customHeight}
                  onChange={(e) => setCustomHeight(Math.max(50, Math.min(4000, parseInt(e.target.value) || 100)))}
                  className="w-full bg-bg-surface border border-border-subtle focus:border-white text-text-primary rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Aspect ratio preview */}
            <div className="flex items-center justify-center py-2">
              <div
                className="border border-border-hover bg-bg-surface rounded-sm"
                style={getAspectPreview(customWidth, customHeight)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white hover:bg-white/90 active:scale-[0.98] text-black font-bold py-2.5 px-4 rounded-xl text-[11px] shadow-lg transition-all"
            >
              Create Blank Canvas
            </button>
          </form>

          <div className="bg-bg-surface border border-border-subtle p-3 rounded-xl mt-4 space-y-2">
            <span className="text-[9px] uppercase font-bold text-text-dim tracking-wider flex items-center gap-1">
              <Sparkle className="w-3 h-3 text-white rotate-12" /> Quick Tip
            </span>
            <p className="text-[10px] text-text-muted leading-relaxed">
              Use the <span className="text-text-secondary font-semibold">Layers panel</span> to add photos, text, and shapes anytime!
            </p>
          </div>
        </div>

        {/* Right: Templates */}
        <div className="flex-1 flex flex-col h-full bg-bg-app">
          <div className="p-4 border-b border-border-default flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-wide">Template Gallery</h3>
              <p className="text-[10px] text-text-dim">Standard canvas presets for quick start</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search + Categories */}
          <div className="px-4 py-2 border-b border-border-default flex items-center gap-3 shrink-0">
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-dim" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg pl-7 pr-2 py-1.5 text-[10px] text-text-primary placeholder-text-dim focus:outline-none focus:border-white"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat as any)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat
                      ? 'bg-text-primary text-bg-app'
                      : 'bg-bg-surface border border-border-subtle text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {filteredTemplates.map((t, idx) => {
              const aspect = getAspectPreview(t.width, t.height);
              return (
                <button
                  key={`${t.name}-${idx}`}
                  onClick={() => handleSelectTemplate(t)}
                  className="group relative flex flex-col justify-between items-start text-left p-3 bg-bg-surface hover:bg-bg-hover border border-border-subtle hover:border-border-hover rounded-xl transition-all h-[100px]"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-1.5 bg-bg-panel-alt rounded-lg group-hover:scale-105 transition-transform">
                      {getTemplateIcon(t.icon)}
                    </div>
                    {/* Mini aspect preview */}
                    <div
                      className="border border-border-hover bg-bg-panel-alt rounded-sm opacity-40 group-hover:opacity-70 transition-opacity"
                      style={{ width: aspect.width * 0.6, height: aspect.height * 0.6 }}
                    />
                  </div>
                  <div className="mt-1.5">
                    <h4 className="font-bold text-[10px] text-text-secondary group-hover:text-text-primary truncate max-w-[160px]">{t.name}</h4>
                    <p className="text-[9px] font-mono text-text-dim">{t.width} × {t.height}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 border-t border-border-default text-[9px] text-text-dim text-center shrink-0">
            PhotoFoss • Choose a template to begin editing
          </div>
        </div>
      </div>
    </div>
  );
}
