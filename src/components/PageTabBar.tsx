import { Plus, X, Copy } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { DiagramPage } from '../types';

// Default page colors
const PAGE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

interface PageTabBarProps {
  pages: DiagramPage[];
  activePageId: string;
  onPageSelect: (pageId: string) => void;
  onPageClose: (pageId: string) => void;
  onNewPage: () => void;
  onPageRename: (pageId: string, newName: string) => void;
  onPageDuplicate: (pageId: string) => void;
  onPageColorChange: (pageId: string, color: string) => void;
}

export function PageTabBar({ 
  pages, 
  activePageId, 
  onPageSelect, 
  onPageClose, 
  onNewPage,
  onPageRename,
  onPageDuplicate,
  onPageColorChange
}: PageTabBarProps) {
  const [contextMenu, setContextMenu] = useState<{ pageId: string; x: number; y: number } | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSubmittingRef = useRef(false);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPageId]);

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const tabRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 180;
    // Align with the tab's left edge while keeping within screen bounds
    const x = Math.max(8, Math.min(tabRect.left, window.innerWidth - menuWidth - 8));
    // Position menu directly above the tab bar
    const bottom = Math.max(8, window.innerHeight - tabRect.top + 4);
    setContextMenu({ pageId, x, y: bottom });
  };

  const handleDoubleClick = (page: DiagramPage) => {
    isSubmittingRef.current = false;
    setEditingPageId(page.id);
    setEditingName(page.name);
  };

  const handleRenameSubmit = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    if (editingPageId) {
      const trimmed = editingName.trim();
      if (trimmed) {
        onPageRename(editingPageId, trimmed);
      }
    }
    setEditingPageId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      isSubmittingRef.current = true;
      setEditingPageId(null);
      setEditingName('');
    }
  };

  return (
    <div className="flex items-center bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 h-8 overflow-hidden">
      {/* Pages Container */}
      <div className="flex items-center flex-1 overflow-x-auto scrollbar-hide">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`group flex items-center gap-1.5 px-3 h-8 cursor-pointer border-r border-gray-200 dark:border-gray-700 transition-colors ${
              activePageId === page.id
                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850'
            }`}
            onClick={(e) => {
              if (editingPageId === page.id) {
                e.stopPropagation();
                return;
              }
              onPageSelect(page.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleDoubleClick(page);
            }}
            onContextMenu={(e) => handleContextMenu(e, page.id)}
            title={`${page.name}\nRight-click for options\nDouble-click to rename`}
          >
            {/* Color indicator */}
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: page.color || PAGE_COLORS[index % PAGE_COLORS.length] }}
            />
            
            {editingPageId === page.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="w-28 px-1.5 py-0.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-blue-500 rounded outline-none shadow-sm"
              />
            ) : (
              <span className="text-xs truncate max-w-[120px]">
                {page.name}
              </span>
            )}
            
            {pages.length > 1 && activePageId === page.id && editingPageId !== page.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPageClose(page.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity"
                title="Delete page"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New Page Button */}
      <button
        onClick={onNewPage}
        className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="New page"
      >
        <Plus size={14} />
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[1000] py-1 min-w-[170px]"
          style={{ left: contextMenu.x, bottom: contextMenu.y }}
        >
          <button
            onClick={() => {
              onNewPage();
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Plus size={14} />
            New Page
          </button>
          <button
            onClick={() => {
              const targetPageId = contextMenu.pageId;
              const page = pages.find(p => p.id === targetPageId);
              setContextMenu(null);
              if (page) {
                setTimeout(() => {
                  handleDoubleClick(page);
                }, 30);
              }
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            Rename Page
          </button>
          <button
            onClick={() => {
              onPageDuplicate(contextMenu.pageId);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Copy size={14} />
            Duplicate Page
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
          <div className="px-4 py-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tab Color</div>
            <div className="flex flex-wrap gap-1">
              {PAGE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    onPageColorChange(contextMenu.pageId, color);
                    setContextMenu(null);
                  }}
                  className="w-5 h-5 rounded border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          {pages.length > 0 && (
            <>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
              <button
                onClick={() => {
                  onPageClose(contextMenu.pageId);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <X size={14} />
                Delete Page
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
