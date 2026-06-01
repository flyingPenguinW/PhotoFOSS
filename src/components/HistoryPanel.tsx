/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, RefreshCcw, SkipForward, Trash2 } from 'lucide-react';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

interface HistoryPanelProps {
  historyLabels: string[];
  historyIndex: number;
  onJumpToHistory: (index: number) => void;
  onClearHistory: () => void;
}

export default function HistoryPanel({
  historyLabels,
  historyIndex,
  onJumpToHistory,
  onClearHistory,
}: HistoryPanelProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; idx: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, idx });
  };

  const getContextItems = (idx: number): ContextMenuItem[] => [
    {
      label: 'Jump to This State',
      icon: <SkipForward className="w-3.5 h-3.5" />,
      action: () => onJumpToHistory(idx),
      disabled: idx === historyIndex,
    },
    { label: '', divider: true },
    {
      label: 'Clear Future History',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      action: onClearHistory,
      disabled: historyIndex >= historyLabels.length - 1,
      danger: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-panel select-none text-[11px] text-text-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border-default shrink-0">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-text-muted">
          <History className="w-3.5 h-3.5 text-accent-blue" />
          History
        </div>
        <button
          onClick={onClearHistory}
          className="text-[9px] hover:text-text-primary text-text-dim bg-bg-surface border border-border-subtle hover:border-border-hover px-1.5 py-0.5 rounded transition-all"
          title="Clear future history"
        >
          Flush
        </button>
      </div>

      <div className="px-3 py-2 bg-bg-panel-alt border-b border-border-default text-[10px] text-text-dim italic text-center shrink-0">
        Click any state to restore · Right-click for options
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 bg-bg-panel" id="history-items-container">
        {historyLabels.length === 0 ? (
          <div className="text-text-dim text-center py-8 italic text-[10px]">Empty</div>
        ) : (
          historyLabels.map((label, idx) => {
            const isCurrent = idx === historyIndex;
            const isFuture = idx > historyIndex;
            return (
              <button
                key={`${label}-${idx}`}
                id={`history-step-${idx}`}
                onClick={() => onJumpToHistory(idx)}
                onContextMenu={(e) => handleContextMenu(e, idx)}
                className={`w-full text-left px-2.5 py-1.5 text-[10px] flex items-center justify-between rounded-md transition-all ${
                  isCurrent
                    ? 'bg-accent-blue/10 border-l-2 border-accent-blue text-text-primary pl-2 font-semibold'
                    : isFuture
                    ? 'text-text-dim opacity-30 hover:opacity-60'
                    : 'bg-bg-surface hover:bg-bg-hover text-text-muted'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[8px] text-text-dim w-4 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{label}</span>
                </div>
                {isCurrent && (
                  <span className="text-[8px] font-mono bg-accent-blue text-white px-1.5 py-0.5 rounded uppercase shrink-0">
                    Now
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextItems(contextMenu.idx)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
