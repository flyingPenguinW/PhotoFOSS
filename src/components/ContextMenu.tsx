/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position to keep menu in viewport
  const getAdjustedPosition = useCallback(() => {
    if (!menuRef.current) return { left: x, top: y };
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (x + rect.width > vw - 8) left = x - rect.width;
    if (y + rect.height > vh - 8) top = y - rect.height;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    return { left, top };
  }, [x, y]);

  useEffect(() => {
    if (menuRef.current) {
      const { left, top } = getAdjustedPosition();
      menuRef.current.style.left = `${left}px`;
      menuRef.current.style.top = `${top}px`;
    }
  }, [getAdjustedPosition]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Use setTimeout to avoid catching the same right-click event
    const id = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] context-menu-animate"
      style={{ left: x, top: y }}
    >
      <div className="context-menu-glass rounded-xl py-1.5 min-w-[220px] max-w-[300px] shadow-2xl shadow-black/60">
        {items.map((item, i) => {
          if (item.divider) {
            return <div key={`div-${i}`} className="h-px bg-white/[0.06] mx-2.5 my-1" />;
          }
          return (
            <button
              key={`${item.label}-${i}`}
              onClick={(e) => {
                e.stopPropagation();
                if (!item.disabled && item.action) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between px-3 py-[5px] text-[11px] transition-all duration-100 group/ctx ${
                item.disabled
                  ? 'text-[#404040] cursor-not-allowed'
                  : item.danger
                  ? 'text-[#ff6b6b] hover:text-white hover:bg-[#fc3d3d]/20'
                  : 'text-[#b0b0b0] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {item.icon && (
                  <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${
                    item.disabled ? 'opacity-30' : item.danger ? 'opacity-80' : 'opacity-50 group-hover/ctx:opacity-90'
                  } transition-opacity`}>
                    {item.icon}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </div>
              {item.shortcut && (
                <span className={`text-[9px] font-mono ml-4 shrink-0 ${
                  item.disabled ? 'text-[#303030]' : 'text-[#505050] group-hover/ctx:text-[#707070]'
                } transition-colors`}>
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
