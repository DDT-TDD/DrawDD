/**
 * Enhanced Context Menu System for DRAWDD
 * Provides context menus for cells, empty canvas, and mindmap-specific operations
 */

import type { Graph, Cell, Node as X6Node, Edge } from '@antv/x6';
import { applyMindmapLayout } from '../utils/layout';
import { setNodeLabelWithAutoSize } from '../utils/text';
import { getNextThemeColors } from '../utils/theme';
import { FULL_PORTS_CONFIG } from '../config/shapes';
import { getMindmapLevelColor } from '../config/enhancedStyles';
import { parseMarkmapDocument, isMarkmapDocument, renderInlineMarkdown, stripMarkdown } from '../utils/markdown';
import type { MarkmapNode } from '../utils/markdown';
import { toggleCollapse } from '../utils/collapse';
import { showErrorNotification } from '../utils/notifications';

let mindmapOrderCounter = 1;

export function getMindmapOrderCounter(): number {
  return mindmapOrderCounter++;
}

export function resetMindmapOrderCounter(): void {
  mindmapOrderCounter = 1;
}

interface ContextMenuItem {
  label: string;
  icon?: string;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuOptions {
  mode: 'flowchart' | 'mindmap' | 'timeline';
  mindmapSettings?: {
    showArrows: boolean;
    strokeWidth: number;
    colorByLevel: boolean;
    theme: string;
  };
}

// Background colors palette
const BACKGROUND_COLORS = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', // Neutrals
  '#fef2f2', '#fee2e2', '#fecaca', // Reds
  '#fff7ed', '#ffedd5', '#fed7aa', // Oranges
  '#fefce8', '#fef9c3', '#fef08a', // Yellows
  '#f0fdf4', '#dcfce7', '#bbf7d0', // Greens
  '#ecfeff', '#cffafe', '#a5f3fc', // Cyans
  '#eff6ff', '#dbeafe', '#bfdbfe', // Blues
  '#f5f3ff', '#ede9fe', '#ddd6fe', // Purples
  '#fdf4ff', '#fae8ff', '#f5d0fe', // Pinks
  '#0f172a', '#1e293b', '#334155', // Darks
];

/**
 * Shows a color picker popup for background color selection
 */
function showBackgroundColorPicker(): void {
  // Remove any existing picker
  const existing = document.getElementById('drawdd-bg-picker');
  if (existing) existing.remove();

  const isDark = document.documentElement.classList.contains('dark');

  const picker = document.createElement('div');
  picker.id = 'drawdd-bg-picker';
  picker.style.cssText = `
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: ${isDark ? '#1e293b' : 'white'};
    border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,${isDark ? '0.5' : '0.15'});
    z-index: 10001;
    padding: 16px;
    min-width: 280px;
  `;

  const title = document.createElement('div');
  title.textContent = 'Background Color';
  title.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: ${isDark ? '#f1f5f9' : '#1e293b'};
    margin-bottom: 12px;
  `;
  picker.appendChild(title);

  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
  `;

  BACKGROUND_COLORS.forEach(color => {
    const swatch = document.createElement('button');
    swatch.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 2px solid ${color === '#ffffff' ? '#e2e8f0' : 'transparent'};
      background: ${color};
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
    `;
    swatch.onmouseenter = () => {
      swatch.style.transform = 'scale(1.15)';
      swatch.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    };
    swatch.onmouseleave = () => {
      swatch.style.transform = 'scale(1)';
      swatch.style.boxShadow = 'none';
    };
    swatch.onclick = () => {
      window.dispatchEvent(new CustomEvent('drawdd:set-background', { detail: { color } }));
      picker.remove();
    };
    grid.appendChild(swatch);
  });

  picker.appendChild(grid);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Cancel';
  closeBtn.style.cssText = `
    margin-top: 12px;
    width: 100%;
    padding: 8px;
    border: 1px solid ${isDark ? '#475569' : '#e2e8f0'};
    border-radius: 6px;
    background: transparent;
    color: ${isDark ? '#94a3b8' : '#64748b'};
    cursor: pointer;
    font-size: 13px;
  `;
  closeBtn.onclick = () => picker.remove();
  picker.appendChild(closeBtn);

  document.body.appendChild(picker);

  // Close on click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (!picker.contains(e.target as Node)) {
      picker.remove();
      document.removeEventListener('click', handleClickOutside);
    }
  };
  setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
}

/**
 * Creates and displays a context menu at the specified position
 */
function createMenuElement(x: number, y: number): HTMLDivElement {
  // Remove existing menu
  const existingMenu = document.getElementById('drawdd-context-menu');
  if (existingMenu) existingMenu.remove();

  const isDark = document.documentElement.classList.contains('dark');

  const menu = document.createElement('div');
  menu.id = 'drawdd-context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: ${isDark ? '#1e293b' : 'white'};
    border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.4' : '0.12'});
    z-index: 10000;
    min-width: 180px;
    max-width: 260px;
    padding: 3px 0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 12px;
    color: ${isDark ? '#f1f5f9' : '#1e293b'};
    max-height: 80vh;
    overflow-y: auto;
  `;

  // Ensure menu stays within viewport
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
  });

  return menu;
}

/**
 * Renders menu items to the menu element
 */
function renderMenuItems(menu: HTMLDivElement, items: ContextMenuItem[]): void {
  const isDark = document.documentElement.classList.contains('dark');

  items.forEach(item => {
    if (item.label === '---') {
      const separator = document.createElement('div');
      separator.style.cssText = `height: 1px; background: ${isDark ? '#334155' : '#e2e8f0'}; margin: 4px 8px;`;
      menu.appendChild(separator);
    } else if (item.label.startsWith('##')) {
      // Section header
      const header = document.createElement('div');
      header.textContent = item.label.substring(2).trim();
      header.style.cssText = `
        padding: 4px 10px 2px 10px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: ${isDark ? '#64748b' : '#94a3b8'};
      `;
      menu.appendChild(header);
    } else {
      const menuItem = document.createElement('div');
      menuItem.style.cssText = `
        padding: 5px 10px;
        cursor: ${item.disabled ? 'not-allowed' : 'pointer'};
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        opacity: ${item.disabled ? '0.5' : '1'};
        transition: background 0.1s;
      `;

      const labelWrapper = document.createElement('span');
      labelWrapper.style.cssText = 'display: flex; align-items: center; gap: 6px;';

      if (item.icon) {
        const icon = document.createElement('span');
        icon.textContent = item.icon;
        icon.style.cssText = 'font-size: 12px; width: 16px; text-align: center;';
        labelWrapper.appendChild(icon);
      }

      const label = document.createElement('span');
      label.textContent = item.label;
      labelWrapper.appendChild(label);

      menuItem.appendChild(labelWrapper);

      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.textContent = item.shortcut;
        shortcut.style.cssText = `font-size: 11px; color: ${isDark ? '#64748b' : '#94a3b8'};`;
        menuItem.appendChild(shortcut);
      }

      if (item.submenu) {
        const arrow = document.createElement('span');
        arrow.textContent = '▶';
        arrow.style.cssText = `font-size: 8px; color: ${isDark ? '#64748b' : '#94a3b8'}; margin-left: auto;`;
        menuItem.appendChild(arrow);
      }

      const hoverBg = isDark ? '#334155' : '#f1f5f9';
      let submenuEl: HTMLDivElement | null = null;

      if (!item.disabled) {
        menuItem.onmouseenter = () => {
          menuItem.style.background = hoverBg;
          // Show submenu on hover
          if (item.submenu && !submenuEl) {
            submenuEl = document.createElement('div');
            submenuEl.style.cssText = `
              position: fixed;
              background: ${isDark ? '#1e293b' : 'white'};
              border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
              border-radius: 6px;
              box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.4' : '0.12'});
              min-width: 140px;
              padding: 3px 0;
              z-index: 10001;
              font-size: 12px;
            `;
            const menuRect = menu.getBoundingClientRect();
            const itemRect = menuItem.getBoundingClientRect();
            submenuEl.style.left = `${menuRect.right - 2}px`;
            submenuEl.style.top = `${itemRect.top}px`;

            // Render submenu items
            item.submenu.forEach(subitem => {
              const subMenuItem = document.createElement('div');
              subMenuItem.textContent = subitem.label;
              subMenuItem.style.cssText = `
                padding: 5px 10px;
                cursor: pointer;
                transition: background 0.1s;
              `;
              subMenuItem.onmouseenter = () => { subMenuItem.style.background = hoverBg; };
              subMenuItem.onmouseleave = () => { subMenuItem.style.background = 'transparent'; };
              subMenuItem.onclick = (e) => {
                e.stopPropagation();
                subitem.action?.();
                submenuEl?.remove();
                menu.remove();
              };
              submenuEl!.appendChild(subMenuItem);
            });

            document.body.appendChild(submenuEl);

            // Ensure submenu stays within viewport
            requestAnimationFrame(() => {
              if (submenuEl) {
                const rect = submenuEl.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                  submenuEl.style.left = `${menuRect.left - rect.width + 2}px`;
                }
                if (rect.bottom > window.innerHeight) {
                  submenuEl.style.top = `${window.innerHeight - rect.height - 10}px`;
                }
              }
            });
          }
        };
        menuItem.onmouseleave = (e) => {
          menuItem.style.background = 'transparent';
          // Delay removal to allow moving to submenu
          if (submenuEl) {
            const target = e.relatedTarget as HTMLElement;
            if (!submenuEl.contains(target)) {
              setTimeout(() => {
                if (submenuEl && !submenuEl.matches(':hover')) {
                  submenuEl.remove();
                  submenuEl = null;
                }
              }, 100);
            }
          }
        };

        // Only handle click if no submenu
        if (!item.submenu) {
          menuItem.onclick = (e) => {
            e.stopPropagation();
            item.action?.();
            menu.remove();
          };
        }
      }
      menu.appendChild(menuItem);
    }
  });

  document.body.appendChild(menu);

  // Close on click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (!menu.contains(e.target as globalThis.Node)) {
      menu.remove();
      document.removeEventListener('click', handleClickOutside);
    }
  };
  setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
}

/**
 * Show context menu for empty canvas (no cell selected)
 */
export function showEmptyCanvasContextMenu(
  graph: Graph,
  x: number,
  y: number,
  clientX: number,
  clientY: number,
  options: ContextMenuOptions
): void {
  const menu = createMenuElement(clientX, clientY);

  const colorScheme = (window as any).__drawdd_colorScheme || 'default';
  const colors = getNextThemeColors(colorScheme);

  const items: ContextMenuItem[] = [
    { label: '## Edit', icon: '' },
    {
      label: 'Paste',
      icon: '📋',
      shortcut: 'Ctrl+V',
      // Always enable to allow system clipboard paste
      disabled: false,
      action: async () => {
        // Try internal paste first
        if (!graph.isClipboardEmpty()) {
          const cells = graph.paste({ offset: 30 });
          graph.cleanSelection();
          graph.select(cells);
        } else {
          // Try system clipboard paste (text/markdown)
          try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim().length > 0) {
              // Check if it's markmap content
              if (/^#{1,6}\s+/m.test(text)) {
                // Import createMarkmapMindmap dynamically 
                const { createMarkmapMindmap } = await import('./contextMenu');

                // Create mindmap at mouse position
                const point = graph.clientToLocal({ x: clientX, y: clientY });
                const success = await createMarkmapMindmap(graph, text, point.x, point.y, {
                  lineColor: '#A2B1C3',
                  colorScheme: colorScheme,
                  mmSettings: options.mindmapSettings || {
                    showArrows: false,
                    strokeWidth: 1,
                    colorByLevel: true,
                    theme: 'blue'
                  }
                });

                if (success) {
                  (window as any).__drawdd_mode = 'mindmap';
                  window.dispatchEvent(new CustomEvent('drawdd-mode-change', { detail: { mode: 'mindmap' } }));
                }
              } else {
                // Regular text - maybe create a text node?
                // For now just notify user or do nothing if not markmap
                console.log('Clipboard contains text but not markdown structure');
              }
            }
          } catch (e) {
            console.error('Paste failed:', e);
          }
        }
      }
    },
    {
      label: 'Select All',
      icon: '☑️',
      shortcut: 'Ctrl+A',
      action: () => {
        graph.select(graph.getCells());
      }
    },
    { label: '---' },
    { label: '## History', icon: '' },
    {
      label: 'Undo',
      icon: '↩️',
      shortcut: 'Ctrl+Z',
      disabled: !graph.canUndo(),
      action: () => {
        if (graph.canUndo()) graph.undo();
      }
    },
    {
      label: 'Redo',
      icon: '↪️',
      shortcut: 'Ctrl+Y',
      disabled: !graph.canRedo(),
      action: () => {
        if (graph.canRedo()) graph.redo();
      }
    },
    { label: '---' },
    { label: '## Insert', icon: '' },
    {
      label: 'Add Node',
      icon: '⬜',
      action: () => {
        const node = graph.addNode({
          x: x - 60,
          y: y - 30,
          width: 120,
          height: 60,
          shape: 'rich-content-node',
          attrs: {
            body: {
              fill: colors.fill,
              stroke: colors.stroke,
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              text: 'New Node',
              fill: colors.text,
              fontSize: 14,
            },
          },
          ports: FULL_PORTS_CONFIG as any,
        });
        graph.cleanSelection();
        graph.select(node);
      }
    },
    {
      label: 'Add Text',
      icon: '📝',
      action: () => {
        const node = graph.addNode({
          x: x - 40,
          y: y - 15,
          width: 80,
          height: 30,
          shape: 'rich-content-node',
          attrs: {
            body: {
              fill: 'transparent',
              stroke: 'transparent',
              strokeWidth: 0,
            },
            label: {
              text: 'Text',
              fill: '#333333',
              fontSize: 14,
            },
          },
          ports: FULL_PORTS_CONFIG as any,
        });
        graph.cleanSelection();
        graph.select(node);
      }
    },
    {
      label: 'Insert Image...',
      icon: '🖼️',
      action: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
              const dataUrl = evt.target?.result as string;
              const img = new Image();
              img.onload = () => {
                const maxDim = 320;
                const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
                const width = Math.round(img.width * scale);
                const height = Math.round(img.height * scale);

                const node = graph.addNode({
                  x: x - width / 2,
                  y: y - height / 2,
                  width,
                  height,
                  shape: 'image',
                  attrs: {
                    image: {
                      'xlink:href': dataUrl,
                    },
                  },
                });
                graph.cleanSelection();
                graph.select(node);
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    },
  ];

  // Add mindmap-specific options
  if (options.mode === 'mindmap') {
    items.push(
      { label: '---' },
      {
        label: 'Add Central Topic',
        icon: '🎯',
        action: () => {
          const mmColors = getMindmapLevelColor(0, (options.mindmapSettings?.theme || 'blue') as any);
          const node = graph.addNode({
            x: x - 75,
            y: y - 30,
            width: 150,
            height: 60,
            shape: 'rich-content-node',
            attrs: {
              body: {
                fill: mmColors.fill,
                stroke: mmColors.stroke,
                strokeWidth: 2,
                rx: 8,
                ry: 8,
              },
              label: {
                text: 'Central Topic',
                fill: mmColors.text,
                fontSize: 16,
                fontWeight: 'bold',
              },
            },
            data: { isMindmap: true, level: 0, mmOrder: getMindmapOrderCounter() },
            ports: FULL_PORTS_CONFIG as any,
          });
          graph.cleanSelection();
          graph.select(node);
        }
      },
      { label: '---' },
      {
        label: 'Link Folder...',
        icon: '📁',
        action: async () => {
          await handleLinkFolder(graph, x, y, options.mindmapSettings?.theme || 'blue');
        }
      },
      {
        label: 'Insert Folder Snapshot...',
        icon: '📂',
        action: async () => {
          await handleInsertFolderSnapshot(graph, x, y, options.mindmapSettings?.theme || 'blue');
        }
      }
    );
  }

  items.push(
    { label: '---' },
    { label: '## View', icon: '' },
    {
      label: 'Zoom In',
      icon: '🔍',
      shortcut: 'Ctrl++',
      action: () => {
        graph.zoom(0.1);
      }
    },
    {
      label: 'Zoom Out',
      icon: '🔍',
      shortcut: 'Ctrl+-',
      action: () => {
        graph.zoom(-0.1);
      }
    },
    {
      label: 'Fit to Screen',
      icon: '📐',
      shortcut: 'Ctrl+Shift+F',
      action: () => {
        graph.zoomToFit({ padding: 50 });
      }
    },
    {
      label: 'Center Content',
      icon: '⊙',
      action: () => {
        graph.centerContent();
      }
    },
    { label: '---' },
    {
      label: 'Toggle Grid',
      icon: '▦',
      action: () => {
        // Use global state to track grid visibility
        const isVisible = (window as any).__drawdd_showGrid ?? true;
        if (isVisible) {
          graph.hideGrid();
          (window as any).__drawdd_showGrid = false;
        } else {
          graph.showGrid();
          (window as any).__drawdd_showGrid = true;
        }
        // Dispatch event for React state sync
        window.dispatchEvent(new CustomEvent('drawdd:toggle-grid'));
      }
    },
    {
      label: 'Background Color',
      icon: '🎨',
      action: () => {
        // Create inline color picker
        showBackgroundColorPicker();
      }
    }
  );

  renderMenuItems(menu, items);
}

/**
 * Show context menu for a cell (node or edge)
 */
export function showCellContextMenu(
  graph: Graph,
  cell: Cell,
  clientX: number,
  clientY: number,
  options: ContextMenuOptions
): void {
  const menu = createMenuElement(clientX, clientY);

  const isNode = cell.isNode();
  const isEdge = cell.isEdge();
  const data = isNode ? (cell as any).getData?.() : null;
  const isMindmapNode = isNode && data?.isMindmap === true;
  const allowMindmapActions = (isMindmapNode || options.mode === 'mindmap') && options.mode !== 'timeline';

  // Check if this is a folder explorer node
  const folderMetadata = data?.folderExplorer;
  const isLinkedNode = folderMetadata?.explorerType === 'linked';

  const dir = (window as any).__mindmapDirection || 'right';
  const lineColor = (window as any).__drawdd_lineColor || '#5F95FF';
  const colorScheme = (window as any).__drawdd_colorScheme || 'default';
  const colors = getNextThemeColors(colorScheme);
  const mmSettings = options.mindmapSettings || { showArrows: false, strokeWidth: 1, colorByLevel: false, theme: 'blue' };

  const items: ContextMenuItem[] = [];

  // Mindmap-specific options
  if (isNode && allowMindmapActions) {
    items.push(
      { label: '## Mindmap', icon: '' },
      {
        label: 'Add Child Node',
        icon: '➕',
        shortcut: 'Insert',
        action: () => addMindmapChild(graph, cell as X6Node, dir, lineColor, colorScheme, mmSettings)
      },
      {
        label: 'Add Sibling Node',
        icon: '➡️',
        shortcut: 'Enter',
        action: () => addMindmapSibling(graph, cell as X6Node, dir, lineColor, colorScheme, mmSettings)
      },
      {
        label: 'Paste as Children',
        icon: '📥',
        shortcut: 'Ctrl+V',
        action: () => {
          handlePasteAsChildren(graph, cell as X6Node, dir, lineColor, colorScheme, mmSettings as any)
            .then((success: boolean) => {
              if (!success) console.warn('Paste as children: no text in clipboard or parse failed');
            })
            .catch((err: Error) => console.error('Paste as children error:', err));
        }
      }
    );

    // Check if node has children for collapse/expand
    const outgoingEdges = graph.getOutgoingEdges(cell as X6Node);
    const hasChildren = outgoingEdges && outgoingEdges.length > 0;
    const isCollapsed = data?.collapsed === true;

    if (hasChildren) {
      items.push({
        label: isCollapsed ? 'Expand Branch' : 'Collapse Branch',
        icon: isCollapsed ? '🔽' : '🔼',
        action: () => toggleCollapse(graph, cell as X6Node, !isCollapsed)
      });
    }

    // Linked node operations
    if (isLinkedNode) {
      items.push(
        { label: '---' },
        { label: '## Folder Explorer', icon: '' }
      );

      // Add "Open File" option for file nodes (not directories)
      if (folderMetadata.isDirectory === false) {
        items.push({
          label: 'Open File',
          icon: '📄',
          action: async () => {
            try {
              const { openFile } = await import('../services/electron');
              const result = await openFile(folderMetadata.path);

              if (!result.success) {
                const errorMsg = result.error || 'Unknown error';
                console.error('Failed to open file:', errorMsg);
                showErrorNotification(`Failed to open file: ${errorMsg}`);
              }
            } catch (error) {
              console.error('Error opening file:', error);
              showErrorNotification(`Error opening file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        });
      }

      items.push(
        {
          label: 'Refresh Branch',
          icon: '🔄',
          action: () => handleRefreshBranch(graph, cell as X6Node)
        },
        {
          label: 'Unlink Node',
          icon: '🔗',
          action: () => handleUnlinkNode(graph, cell as X6Node)
        },
        {
          label: 'Unlink Branch',
          icon: '🔓',
          action: () => handleUnlinkBranch(graph, cell as X6Node)
        }
      );
    }

    // Folder explorer attachment options (for non-linked nodes)
    if (!isLinkedNode) {
      items.push(
        { label: '---' },
        { label: '## Folder Explorer', icon: '' },
        {
          label: 'Link Folder as Children',
          icon: '📁',
          action: () => handleLinkFolderAsChildren(graph, cell as X6Node, dir, mmSettings)
        },
        {
          label: 'Insert Folder Snapshot as Children',
          icon: '📷',
          action: () => handleInsertFolderSnapshotAsChildren(graph, cell as X6Node, dir, mmSettings)
        }
      );
    }

    items.push({ label: '---' });
  }

  // Timeline-specific options
  if (isNode && options.mode === 'timeline') {
    items.push(
      { label: '## Timeline', icon: '' },
      {
        label: 'Add Event After',
        icon: '📅',
        action: () => {
          const parentNode = cell as X6Node;
          const nodePos = parentNode.getPosition();
          const nodeSize = parentNode.getSize();
          const tlDir = (window as any).__timelineDirection || 'horizontal';

          // Ensure parent node has ports for connection
          const parentPorts = (parentNode as any).getPorts?.() || [];
          if (parentPorts.length === 0) {
            (parentNode as any).prop?.('ports', FULL_PORTS_CONFIG);
          }

          const x0 = tlDir === 'horizontal' ? nodePos.x + nodeSize.width + 120 : nodePos.x;
          const y0 = tlDir === 'horizontal' ? nodePos.y : nodePos.y + nodeSize.height + 80;

          const sourcePort = tlDir === 'horizontal' ? 'right' : 'bottom';
          const targetPort = tlDir === 'horizontal' ? 'left' : 'top';

          const newEvent = graph.addNode({
            x: x0,
            y: y0,
            width: 120,
            height: 55,
            shape: 'rect',
            attrs: {
              body: { fill: colors.fill, stroke: colors.stroke, strokeWidth: 2, rx: 8, ry: 8 },
              label: { text: 'New Event', fill: colors.text, fontSize: 14 },
            },
            data: { isTimeline: true, eventType: 'event' },
            ports: FULL_PORTS_CONFIG as any,
          });

          graph.addEdge({
            source: { cell: cell.id, port: sourcePort },
            target: { cell: newEvent.id, port: targetPort },
            attrs: { line: { stroke: lineColor, strokeWidth: 2, targetMarker: { name: 'block', size: 6 } } },
          });

          graph.cleanSelection();
          graph.select(newEvent);
        }
      },
      { label: '---' }
    );
  }

  // Common edit options
  items.push(
    { label: '## Edit', icon: '' },
    {
      label: 'Edit Text',
      icon: '✏️',
      shortcut: 'F2',
      action: () => {
        const event = new CustomEvent('drawdd:edit-cell-text', { detail: { cell } });
        window.dispatchEvent(event);
      }
    },
    {
      label: 'Duplicate',
      icon: '📄',
      shortcut: 'Ctrl+D',
      action: () => {
        const clone = cell.clone();
        clone.translate(30, 30);
        graph.addCell(clone);
        graph.cleanSelection();
        graph.select(clone);
      }
    },
    {
      label: 'Copy',
      icon: '📋',
      shortcut: 'Ctrl+C',
      action: () => {
        graph.copy([cell]);
      }
    },
    {
      label: 'Cut',
      icon: '✂️',
      shortcut: 'Ctrl+X',
      action: () => {
        graph.cut([cell]);
      }
    },
    {
      label: 'Delete',
      icon: '🗑️',
      shortcut: 'Del',
      action: () => {
        // Use setTimeout to avoid React unmount race condition with rich-content-node
        setTimeout(() => {
          try {
            if (graph.hasCell(cell.id)) {
              graph.removeCell(cell);
            }
          } catch (error) {
            console.error('Error removing cell:', error);
          }
        }, 0);
      }
    }
  );

  // Node-specific options
  if (isNode) {
    items.push(
      { label: '---' },
      { label: '## Arrange', icon: '' },
      {
        label: 'Bring to Front',
        icon: '⬆️',
        action: () => cell.toFront()
      },
      {
        label: 'Send to Back',
        icon: '⬇️',
        action: () => cell.toBack()
      },
      { label: '---' },
      { label: '## Format', icon: '' },
      {
        label: 'Change Shape',
        icon: '🔄',
        action: () => {
          const event = new CustomEvent('drawdd:change-shape', { detail: { cell } });
          window.dispatchEvent(event);
        }
      }
    );

    // Image node option
    if ((cell as any).shape === 'image') {
      items.push({
        label: 'Change Image...',
        icon: '🖼️',
        action: () => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (evt) => {
                const dataUrl = evt.target?.result as string;
                const imgEl = new Image();
                imgEl.onload = () => {
                  const maxDim = 320;
                  const minDim = 60;
                  const scale = Math.min(maxDim / imgEl.width, maxDim / imgEl.height, 1);
                  const width = Math.max(minDim, Math.round(imgEl.width * scale));
                  const height = Math.max(minDim, Math.round(imgEl.height * scale));

                  (cell as X6Node).resize(width, height);
                  cell.setAttrs({
                    image: { xlinkHref: dataUrl, width, height, preserveAspectRatio: 'xMidYMid meet' },
                  });
                  (cell as any).setData({ imageUrl: dataUrl, naturalWidth: imgEl.width, naturalHeight: imgEl.height });
                };
                imgEl.src = dataUrl;
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }
      });
    }
  }

  // Edge-specific options
  if (isEdge) {
    items.push(
      { label: '---' },
      { label: '## Line Style', icon: '' },
      {
        label: 'Solid Line',
        icon: '—',
        action: () => {
          cell.setAttrs({ line: { strokeDasharray: '' } });
        }
      },
      {
        label: 'Dashed Line',
        icon: '- -',
        action: () => {
          cell.setAttrs({ line: { strokeDasharray: '8 4' } });
        }
      },
      {
        label: 'Dotted Line',
        icon: '•••',
        action: () => {
          cell.setAttrs({ line: { strokeDasharray: '2 4' } });
        }
      },
      { label: '---' },
      { label: '## Line Routing', icon: '' },
      {
        label: 'Line Hops (Arc)',
        icon: '⌒',
        action: () => {
          (cell as Edge).setConnector({ name: 'jumpover', args: { size: 6, type: 'arc' } });
        }
      },
      {
        label: 'Orthogonal Routing',
        icon: '⊢',
        action: () => {
          (cell as Edge).setConnector('normal');
          (cell as Edge).setRouter('manhattan');
        }
      },
      {
        label: 'Rounded Routing',
        icon: '⌒',
        action: () => {
          (cell as Edge).setConnector({ name: 'rounded', args: { radius: 10 } });
          (cell as Edge).setRouter('manhattan');
        }
      },
      {
        label: 'Smooth Curves',
        icon: '∿',
        action: () => {
          (cell as Edge).setConnector('smooth');
          (cell as Edge).setRouter('normal');
        }
      },
      {
        label: 'Straight Line',
        icon: '—',
        action: () => {
          (cell as Edge).setConnector('normal');
          (cell as Edge).setRouter('normal');
        }
      }
    );
  }

  renderMenuItems(menu, items);
}

/**
 * Add a child node in mindmap mode
 */
function addMindmapChild(
  graph: Graph,
  parentNode: X6Node,
  direction: string,
  lineColor: string,
  colorScheme: string,
  mmSettings: { showArrows: boolean; strokeWidth: number; colorByLevel: boolean; theme: string }
): void {
  const parentPos = parentNode.getPosition();
  const parentSize = parentNode.getSize();
  const parentData = parentNode.getData() || {};
  const level = (typeof parentData.level === 'number' ? parentData.level : 0) + 1;

  // Position based on direction
  let x0, y0;
  switch (direction) {
    case 'left':
      x0 = parentPos.x - 200;
      y0 = parentPos.y;
      break;
    case 'top':
      x0 = parentPos.x;
      y0 = parentPos.y - 100;
      break;
    case 'bottom':
      x0 = parentPos.x;
      y0 = parentPos.y + parentSize.height + 60;
      break;
    default: // 'right', 'both', 'radial'
      x0 = parentPos.x + parentSize.width + 120;
      y0 = parentPos.y;
  }

  const nodeColors = mmSettings.colorByLevel
    ? getMindmapLevelColor(level, mmSettings.theme as any)
    : getNextThemeColors(colorScheme);

  const childNode = graph.addNode({
    x: x0,
    y: y0,
    width: 160,
    height: 60,
    shape: 'rich-content-node',
    attrs: {
      body: {
        fill: nodeColors.fill,
        stroke: nodeColors.stroke,
        strokeWidth: 2,
        rx: 6,
        ry: 6,
      },
      label: {
        text: 'New Topic',
        fill: nodeColors.text,
        fontSize: 12,
      },
    },
    data: { isMindmap: true, level, mmOrder: getMindmapOrderCounter() },
    ports: FULL_PORTS_CONFIG as any,
  });

  const edgeAttrs: any = {
    line: {
      stroke: lineColor,
      strokeWidth: mmSettings.strokeWidth,
    },
  };

  if (mmSettings.showArrows) {
    edgeAttrs.line.targetMarker = {
      name: 'block',
      width: 8,
      height: 6,
    };
  } else {
    edgeAttrs.line.targetMarker = null;
  }

  // Determine ports based on direction for proper alignment
  const sourcePort = direction === 'left' ? 'left' : direction === 'top' ? 'top' : direction === 'bottom' ? 'bottom' : 'right';
  const targetPort = direction === 'left' ? 'right' : direction === 'top' ? 'bottom' : direction === 'bottom' ? 'top' : 'left';

  const routing = getEdgeRouting((mmSettings as any).connectorStyle);

  graph.addEdge({
    source: { cell: parentNode.id, port: sourcePort },
    target: { cell: childNode.id, port: targetPort },
    attrs: edgeAttrs,
    router: routing.router,
    connector: routing.connector,
  });

  // Find root and apply layout with setTimeout to ensure DOM updates settle
  const rootNode = findMindmapRoot(graph, parentNode);
  const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';
  setTimeout(() => {
    applyMindmapLayout(graph, direction as any, rootNode, layoutMode);
  }, 0);

  graph.cleanSelection();
  graph.select(childNode);
}

/**
 * Add a sibling node in mindmap mode
 */
function addMindmapSibling(
  graph: Graph,
  currentNode: X6Node,
  direction: string,
  lineColor: string,
  colorScheme: string,
  mmSettings: { showArrows: boolean; strokeWidth: number; colorByLevel: boolean; theme: string }
): void {
  const currentPos = currentNode.getPosition();
  const currentSize = currentNode.getSize();
  const currentData = currentNode.getData() || {};
  const level = typeof currentData.level === 'number' ? currentData.level : 1;

  // Find parent node
  const incomingEdges = graph.getIncomingEdges(currentNode);
  const parentEdge = incomingEdges?.[0];
  const parentNode = parentEdge ? graph.getCellById(parentEdge.getSourceCellId() || '') : null;

  const nodeColors = mmSettings.colorByLevel
    ? getMindmapLevelColor(level, mmSettings.theme as any)
    : getNextThemeColors(colorScheme);

  const siblingNode = graph.addNode({
    x: currentPos.x,
    y: currentPos.y + currentSize.height + 60,
    width: currentSize.width,
    height: currentSize.height,
    shape: 'rich-content-node',
    attrs: {
      body: {
        fill: nodeColors.fill,
        stroke: nodeColors.stroke,
        strokeWidth: 2,
        rx: 6,
        ry: 6,
      },
      label: {
        text: 'New Topic',
        fill: nodeColors.text,
        fontSize: 12,
      },
    },
    data: { isMindmap: true, level, mmOrder: getMindmapOrderCounter() },
    ports: FULL_PORTS_CONFIG as any,
  });

  if (parentNode && parentNode.isNode()) {
    const edgeAttrs: any = {
      line: {
        stroke: lineColor,
        strokeWidth: mmSettings.strokeWidth,
      },
    };

    if (mmSettings.showArrows) {
      edgeAttrs.line.targetMarker = {
        name: 'block',
        width: 8,
        height: 6,
      };
    } else {
      edgeAttrs.line.targetMarker = null;
    }

    // Determine ports based on direction for proper alignment
    const sourcePort = direction === 'left' ? 'left' : direction === 'top' ? 'top' : direction === 'bottom' ? 'bottom' : 'right';
    const targetPort = direction === 'left' ? 'right' : direction === 'top' ? 'bottom' : direction === 'bottom' ? 'top' : 'left';

    const routing = getEdgeRouting((mmSettings as any).connectorStyle);

    graph.addEdge({
      source: { cell: parentNode.id, port: sourcePort },
      target: { cell: siblingNode.id, port: targetPort },
      attrs: edgeAttrs,
      router: routing.router,
      connector: routing.connector,
    });

    const rootNode = findMindmapRoot(graph, parentNode);
    const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';
    // Use setTimeout to ensure DOM updates settle before layout recalculation
    setTimeout(() => {
      applyMindmapLayout(graph, direction as any, rootNode, layoutMode);
    }, 0);
  }

  graph.cleanSelection();
  graph.select(siblingNode);
}

/**
 * Find the root node of a mindmap by traversing up
 */
function findMindmapRoot(graph: Graph, node: Cell): X6Node {
  const incomingEdges = graph.getIncomingEdges(node as X6Node);
  if (!incomingEdges || incomingEdges.length === 0) {
    return node as X6Node;
  }
  const sourceId = incomingEdges[0].getSourceCellId();
  const source = sourceId ? graph.getCellById(sourceId) : null;
  if (source && source.isNode()) {
    return findMindmapRoot(graph, source);
  }
  return node as X6Node;
}

// Helper to get router/connector config based on style
type ConnectorStyle = 'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight';

function getEdgeRouting(style: ConnectorStyle | string | undefined): { router: any; connector: any } {
  // For mindmaps: use appropriate routing based on style
  switch (style) {
    case 'smooth':
      return { router: { name: 'normal' }, connector: { name: 'smooth' } };
    case 'orthogonal-rounded':
    case 'orthogonal': // legacy support
      return { router: { name: 'normal' }, connector: { name: 'rounded', args: { radius: 10 } } };
    case 'orthogonal-sharp':
      return { router: { name: 'normal' }, connector: { name: 'normal' } };
    case 'straight':
    default:
      // Default to smooth curved bezier lines
      return { router: { name: 'normal' }, connector: { name: 'smooth' } };
  }
}

/**
 * Parse hierarchical structure from indented text
 */
interface HierarchyNode {
  text: string;
  level: number;
  children: HierarchyNode[];
  htmlContent?: string;  // Rich HTML content for markdown rendering
  metadata?: {
    link?: string;
    image?: string;
    checkbox?: boolean;
    codeBlock?: { lang: string; code: string };
    table?: string[][];
  };
}

function parseIndentedText(text: string): HierarchyNode[] {
  const lines = text.split(/[\r\n]+/).filter(line => line.length > 0);
  if (lines.length === 0) return [];

  // Check if this is markdown header format (# Header, ## Subheader, etc.)
  const hasMarkdownHeaders = lines.some(line => /^#+\s+/.test(line.trim()));

  if (hasMarkdownHeaders) {
    return parseMarkdownHeaders(text);
  }

  // Detect indentation type (tabs or spaces)
  const indentPattern = /^(\t+|\s+)/;
  let indentSize = 0;

  // Auto-detect indent size from first indented line
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match && match[1].length > 0) {
      const spaces = match[1];
      if (spaces.includes('\t')) {
        indentSize = 1; // Tab-based
        break;
      } else {
        indentSize = spaces.length;
        // Look for common indent sizes (2, 4, 8)
        if (indentSize >= 8) indentSize = 8;
        else if (indentSize >= 4) indentSize = 4;
        else if (indentSize >= 2) indentSize = 2;
        break;
      }
    }
  }

  if (indentSize === 0) indentSize = 2; // Default to 2 spaces

  const stack: HierarchyNode[] = [];
  const root: HierarchyNode[] = [];

  lines.forEach(line => {
    // Remove bullet points, numbers, and common list markers
    let cleanLine = line
      .replace(/^\s*[-*+•◦▪▫]\s+/, '') // Bullets
      .replace(/^\s*\d+[.)]\s+/, '') // Numbers
      .replace(/^\s*[a-zA-Z][.)]\s+/, '') // Letters
      .trim();

    if (!cleanLine) return;

    // Calculate indent level
    const match = line.match(indentPattern);
    const indent = match ? match[1] : '';
    const level = indent.includes('\t')
      ? indent.length
      : Math.floor(indent.length / indentSize);

    const node: HierarchyNode = {
      text: cleanLine,
      level,
      children: []
    };

    // Pop stack until we find the parent level
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
}

/**
 * Parse markdown headers (# Header, ## Subheader, etc.) into hierarchy
 * Like markmap format
 */
function parseMarkdownHeaders(text: string): HierarchyNode[] {
  const lines = text.split(/[\r\n]+/).filter(line => line.length > 0);
  if (lines.length === 0) return [];

  const stack: HierarchyNode[] = [];
  const root: HierarchyNode[] = [];

  lines.forEach(line => {
    const headerMatch = line.match(/^(#+)\s*(.*)$/);

    let level: number;
    let cleanText: string;

    if (headerMatch) {
      // Markdown header: # = level 0, ## = level 1, etc.
      level = headerMatch[1].length - 1;
      cleanText = headerMatch[2].trim();
    } else {
      // Non-header line: treat as content under current level
      cleanText = line
        .replace(/^\s*[-*+•◦▪▫]\s+/, '') // Remove bullets
        .replace(/^\s*\d+[.)]\s+/, '') // Remove numbers
        .trim();

      // Add as child of last node if exists
      if (stack.length > 0 && cleanText) {
        const lastNode = stack[stack.length - 1];
        lastNode.children.push({
          text: cleanText,
          level: lastNode.level + 1,
          children: []
        });
        return;
      }
      level = 0;
    }

    if (!cleanText) return;

    const node: HierarchyNode = {
      text: cleanText,
      level,
      children: []
    };

    // Pop stack until we find the parent level
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
}

/**
 * Parse TSV (Tab-Separated Values) from Excel/spreadsheet clipboard
 */
function parseTSVHierarchy(text: string): HierarchyNode[] {
  const lines = text.split(/[\r\n]+/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const result: HierarchyNode[] = [];

  lines.forEach(line => {
    const columns = line.split('\t');

    // Find first non-empty column (determines hierarchy level)
    let level = 0;
    let text = '';

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i].trim();
      if (col) {
        level = i;
        text = col;
        break;
      }
    }

    if (!text) return;

    const node: HierarchyNode = { text, level, children: [] };

    // Build hierarchy based on column position
    if (level === 0) {
      result.push(node);
    } else {
      // Find parent at previous level
      const findParent = (nodes: HierarchyNode[], targetLevel: number): HierarchyNode | null => {
        for (let i = nodes.length - 1; i >= 0; i--) {
          if (nodes[i].level === targetLevel - 1) {
            return nodes[i];
          }
          if (nodes[i].children.length > 0) {
            const found = findParent(nodes[i].children, targetLevel);
            if (found) return found;
          }
        }
        return null;
      };

      const parent = findParent(result, level);
      if (parent) {
        parent.children.push(node);
      } else {
        // Fallback: add to root
        result.push(node);
      }
    }
  });

  return result;
}

/**
 * Create mindmap nodes from hierarchy structure
 */
function createNodesFromHierarchy(
  graph: Graph,
  parentNode: X6Node,
  hierarchy: HierarchyNode[],
  baseLevel: number,
  direction: string,
  lineColor: string,
  colorScheme: string,
  mmSettings: { showArrows: boolean; strokeWidth: number; colorByLevel: boolean; theme: string; connectorStyle?: string }
): void {
  hierarchy.forEach((item, index) => {
    const level = baseLevel + item.level;
    const nodeColors = mmSettings.colorByLevel
      ? getMindmapLevelColor(level, mmSettings.theme as any)
      : getNextThemeColors(colorScheme);

    // Always use rich-content-node for consistent markdown support
    const childNode: X6Node = graph.addNode({
      x: parentNode.getPosition().x + 200,
      y: parentNode.getPosition().y + index * 60,
      width: 160,
      height: 60,
      shape: 'rich-content-node',
      attrs: {
        body: {
          fill: nodeColors.fill,
          stroke: nodeColors.stroke,
          strokeWidth: 2,
          rx: 6,
          ry: 6,
        },
        label: {
          text: item.text,
          fill: nodeColors.text,
          fontSize: 12,
        },
      },
      data: {
        isMindmap: true,
        level,
        mmOrder: getMindmapOrderCounter(),
        htmlContent: item.htmlContent,
        text: item.text,
        textColor: nodeColors.text,
        markdownMetadata: item.metadata
      },
      ports: FULL_PORTS_CONFIG as any,
    });

    // Apply smart sizing to fit text content
    setNodeLabelWithAutoSize(childNode as X6Node, item.text);

    const edgeAttrs: any = {
      line: {
        stroke: lineColor,
        strokeWidth: mmSettings.strokeWidth,
      },
    };

    if (mmSettings.showArrows) {
      edgeAttrs.line.targetMarker = { name: 'block', width: 8, height: 6 };
    } else {
      edgeAttrs.line.targetMarker = null;
    }

    const routing = getEdgeRouting(mmSettings.connectorStyle);

    graph.addEdge({
      source: { cell: parentNode.id },
      target: { cell: childNode.id },
      attrs: edgeAttrs,
      router: routing.router,
      connector: routing.connector,
    });

    // Recursively create children
    if (item.children.length > 0) {
      createNodesFromHierarchy(
        graph,
        childNode,
        item.children,
        level,
        direction,
        lineColor,
        colorScheme,
        mmSettings
      );
    }
  });
}

/**
 * Handle paste of text list to create mindmap branches
 * Supports: plain text, indented text, bullet lists, TSV (Excel), and hierarchical structures
 */
export async function handlePasteAsChildren(
  graph: Graph,
  targetNode: X6Node,
  direction: string,
  lineColor: string,
  colorScheme: string,
  mmSettings: { showArrows: boolean; strokeWidth: number; colorByLevel: boolean; theme: string; connectorStyle?: string },
  providedText?: string
): Promise<boolean> {
  try {
    // Use provided text or read from clipboard
    const text = providedText || await navigator.clipboard.readText();
    if (!text || text.trim().length === 0) return false;

    const targetData = targetNode.getData() || {};
    const baseLevel = (typeof targetData.level === 'number' ? targetData.level : 0) + 1;

    let hierarchy: HierarchyNode[] = [];

    // Detect format and parse accordingly
    // Check for markdown document format (headers indicate markmap structure)
    if (isMarkmapDocument(text)) {
      // Use full markmap parser for rich content (bold, italic, links, equations, etc.)
      const markmapNodes = parseMarkmapDocument(text);

      // Convert MarkmapNode[] to HierarchyNode[] with HTML content stored in data
      function convertMarkmapToHierarchy(nodes: MarkmapNode[], levelOffset: number = 0): HierarchyNode[] {
        return nodes.map(node => ({
          text: stripMarkdown(node.text), // Plain text for label
          level: levelOffset,
          children: convertMarkmapToHierarchy(node.children, 0),
          // Store rich content in a property that createNodesFromHierarchy will use
          htmlContent: node.htmlContent,
          metadata: node.metadata
        }));
      }

      hierarchy = convertMarkmapToHierarchy(markmapNodes);
    } else if (text.includes('\t')) {
      // TSV format (Excel/spreadsheet)
      hierarchy = parseTSVHierarchy(text);
    } else if (/^\s+/m.test(text) || /\n\s+/.test(text)) {
      // Indented text format (spaces or tabs at start of lines)
      hierarchy = parseIndentedText(text);
    } else if (/^\s*[-*+•◦▪▫]\s+/m.test(text)) {
      // Bullet list format - parse as indented text
      hierarchy = parseIndentedText(text);
    } else if (/^\s*\d+[.)]\s+/m.test(text)) {
      // Numbered list format - parse as indented text
      hierarchy = parseIndentedText(text);
    } else {
      // Simple line-by-line format (fallback) - render inline markdown
      const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 0);
      if (lines.length === 0) return false;

      hierarchy = lines.map(line => ({
        text: stripMarkdown(line.trim()),
        level: 0,
        children: [],
        htmlContent: renderInlineMarkdown(line.trim())
      }));
    }

    if (hierarchy.length === 0) return false;

    // Create nodes from hierarchy
    createNodesFromHierarchy(
      graph,
      targetNode,
      hierarchy,
      baseLevel,
      direction,
      lineColor,
      colorScheme,
      mmSettings
    );

    // Apply layout
    const rootNode = findMindmapRoot(graph, targetNode);
    const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';
    setTimeout(() => {
      applyMindmapLayout(graph, direction as any, rootNode, layoutMode);
    }, 50);

    return true;
  } catch (error) {
    console.error('Paste as children error:', error);
    return false;
  }
}

/**
 * Create a new mindmap from a full markdown/markmap document
 * Called when pasting markdown on a blank canvas
 */
export async function createMarkmapMindmap(
  graph: Graph,
  markdown: string,
  centerX: number,
  centerY: number,
  options: {
    lineColor: string;
    colorScheme: string;
    mmSettings: { showArrows: boolean; strokeWidth: number; colorByLevel: boolean; theme: string; connectorStyle?: string };
  }
): Promise<boolean> {
  try {
    // Parse the markdown document
    const markmapNodes = parseMarkmapDocument(markdown);
    if (markmapNodes.length === 0) return false;

    // Create root node from first header
    const firstNode = markmapNodes[0];
    const rootColors = options.mmSettings.colorByLevel
      ? getMindmapLevelColor(0, options.mmSettings.theme as any)
      : getNextThemeColors(options.colorScheme);

    // Use rich-content-node for KaTeX support
    const rootNode: X6Node = graph.addNode({
      x: centerX - 80,
      y: centerY - 40,
      width: 160,
      height: 80,
      shape: 'rich-content-node',
      attrs: {
        body: {
          fill: rootColors.fill,
          stroke: rootColors.stroke,
          strokeWidth: 2,
          rx: 10,
          ry: 10,
        },
        label: {
          text: stripMarkdown(firstNode.text),
          fill: rootColors.text,
          fontSize: 16,
          fontWeight: 'bold',
        },
      },
      data: {
        isMindmap: true,
        level: 0,
        mmOrder: getMindmapOrderCounter(),
        htmlContent: firstNode.htmlContent,
        text: stripMarkdown(firstNode.text),
        textColor: rootColors.text,
        markdownMetadata: firstNode.metadata
      },
      ports: FULL_PORTS_CONFIG as any,
    });

    // Apply smart sizing
    setNodeLabelWithAutoSize(rootNode as X6Node, stripMarkdown(firstNode.text));

    // Convert remaining markmap nodes to hierarchy nodes
    function convertToHierarchy(nodes: MarkmapNode[]): HierarchyNode[] {
      return nodes.map(node => ({
        text: stripMarkdown(node.text),
        level: 0,
        children: convertToHierarchy(node.children),
        htmlContent: node.htmlContent,
        metadata: node.metadata
      }));
    }

    // Create children from first node's children plus siblings
    const allChildren = [
      ...convertToHierarchy(firstNode.children),
      ...convertToHierarchy(markmapNodes.slice(1))
    ];

    if (allChildren.length > 0) {
      createNodesFromHierarchy(
        graph,
        rootNode as X6Node,
        allChildren,
        1,
        'right',
        options.lineColor,
        options.colorScheme,
        options.mmSettings
      );
    }

    // Apply layout
    const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';
    setTimeout(() => {
      applyMindmapLayout(graph, 'right', rootNode as X6Node, layoutMode);
    }, 50);

    // Select the root node
    graph.select(rootNode);

    return true;
  } catch (error) {
    console.error('Create markmap mindmap error:', error);
    return false;
  }
}

/**
 * Handle "Refresh Branch" context menu action
 * Re-scans the directory and updates the branch
 */
async function handleRefreshBranch(graph: Graph, node: X6Node): Promise<void> {
  const metadata = node.getData().folderExplorer;
  if (!metadata || metadata.explorerType !== 'linked') {
    return;
  }

  try {
    // Import electron API and folder explorer utilities
    const { scanDirectory } = await import('../services/electron');
    const { removeDescendants, generateChildNodes } = await import('./folderExplorer');

    // Get includeHiddenFiles setting from localStorage
    const includeHidden = localStorage.getItem('drawdd-include-hidden-files') === 'true';

    // Scan the directory
    const scanResult = await scanDirectory(metadata.path, includeHidden);

    if (!scanResult.success || !scanResult.fileTree) {
      console.error('Failed to refresh branch:', scanResult.error);
      showErrorNotification(`Failed to refresh branch: ${scanResult.error || 'Unknown error'}`);
      return;
    }

    // Remove old children
    removeDescendants(graph, node);

    // Generate new children
    generateChildNodes(graph, node, scanResult.fileTree, metadata);

    // Update timestamp
    node.setData({
      ...node.getData(),
      folderExplorer: {
        ...metadata,
        lastRefreshed: new Date().toISOString(),
      },
    });

    // Apply layout
    const direction = (window as any).__mindmapDirection || 'right';
    const { applyMindmapLayout } = await import('./layout');
    const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';

    // Find root node
    const findRoot = (n: X6Node): X6Node => {
      const incoming = graph.getIncomingEdges(n);
      if (!incoming || incoming.length === 0) return n;
      const sourceId = incoming[0].getSourceCellId();
      const source = sourceId ? graph.getCellById(sourceId) : null;
      if (source && source.isNode()) return findRoot(source as X6Node);
      return n;
    };

    const rootNode = findRoot(node);
    setTimeout(() => {
      applyMindmapLayout(graph, direction, rootNode, layoutMode);
    }, 0);

  } catch (error) {
    console.error('Refresh branch error:', error);
    showErrorNotification(`Failed to refresh branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle "Unlink Node" context menu action
 * Converts a single linked node to a standard mindmap node
 */
async function handleUnlinkNode(graph: Graph, node: X6Node): Promise<void> {
  const data = node.getData();
  const metadata = data.folderExplorer;

  if (!metadata) {
    return;
  }

  // Remove folder explorer metadata
  const { folderExplorer, ...cleanData } = data;
  node.setData(cleanData);

  // Remove folder explorer styling
  const { removeFolderExplorerStyling } = await import('./folderExplorerStyles');
  removeFolderExplorerStyling(node);
}

/**
 * Handle "Unlink Branch" context menu action
 * Recursively unlinks a node and all its descendants
 */
async function handleUnlinkBranch(graph: Graph, node: X6Node): Promise<void> {
  const { getAllDescendants } = await import('./folderExplorer');
  const { removeFolderExplorerStyling } = await import('./folderExplorerStyles');

  // Get all descendants
  const descendants = getAllDescendants(graph, node);

  // Unlink the node and all descendants
  const nodesToUnlink = [node, ...descendants];

  nodesToUnlink.forEach(n => {
    const data = n.getData();
    if (data.folderExplorer) {
      // Remove folder explorer metadata
      const { folderExplorer, ...cleanData } = data;
      n.setData(cleanData);

      // Remove folder explorer styling
      removeFolderExplorerStyling(n);
    }
  });
}

/**
 * Handle "Link Folder" menu action
 * Opens folder dialog and creates a linked mindmap
 */
async function handleLinkFolder(
  graph: Graph,
  x: number,
  y: number,
  theme: string
): Promise<void> {
  try {
    // Import electron API dynamically
    const { selectFolder, scanDirectory } = await import('../services/electron');

    // Open folder selection dialog
    const result = await selectFolder();

    if (!result.success || !result.folderPath) {
      if (!result.canceled) {
        console.error('Failed to select folder:', result.error);
      }
      return;
    }

    // Get includeHiddenFiles setting from localStorage
    const includeHidden = localStorage.getItem('drawdd-include-hidden-files') === 'true';

    // Scan the directory
    const scanResult = await scanDirectory(result.folderPath, includeHidden);

    if (!scanResult.success || !scanResult.fileTree) {
      console.error('Failed to scan directory:', scanResult.error);
      return;
    }

    // Import folder explorer utilities
    const { generateFolderMindmap } = await import('./folderExplorer');

    // Get mindmap direction from global state
    const direction = (window as any).__mindmapDirection || 'right';

    // Generate the folder mindmap
    generateFolderMindmap(scanResult.fileTree, graph, {
      rootX: x - 80,
      rootY: y - 40,
      explorerType: 'linked',
      autoCollapseDepth: 4,
      direction: direction,
      colorScheme: theme,
    });

  } catch (error) {
    console.error('Link folder error:', error);
  }
}

/**
 * Handle "Insert Folder Snapshot" menu action
 * Opens folder dialog and creates a static mindmap
 */
async function handleInsertFolderSnapshot(
  graph: Graph,
  x: number,
  y: number,
  theme: string
): Promise<void> {
  try {
    // Import electron API dynamically
    const { selectFolder, scanDirectory } = await import('../services/electron');

    // Open folder selection dialog
    const result = await selectFolder();

    if (!result.success || !result.folderPath) {
      if (!result.canceled) {
        console.error('Failed to select folder:', result.error);
      }
      return;
    }

    // Get includeHiddenFiles setting from localStorage
    const includeHidden = localStorage.getItem('drawdd-include-hidden-files') === 'true';

    // Scan the directory
    const scanResult = await scanDirectory(result.folderPath, includeHidden);

    if (!scanResult.success || !scanResult.fileTree) {
      console.error('Failed to scan directory:', scanResult.error);
      return;
    }

    // Import folder explorer utilities
    const { generateFolderMindmap } = await import('./folderExplorer');

    // Get mindmap direction from global state
    const direction = (window as any).__mindmapDirection || 'right';

    // Generate the folder mindmap (static mode)
    generateFolderMindmap(scanResult.fileTree, graph, {
      rootX: x - 80,
      rootY: y - 40,
      explorerType: 'static',
      autoCollapseDepth: 4,
      direction: direction,
      colorScheme: theme,
    });

  } catch (error) {
    console.error('Insert folder snapshot error:', error);
  }
}


/**
 * Handle "Link Folder as Children" context menu action
 * Attaches a linked folder structure as children of the selected node
 */
async function handleLinkFolderAsChildren(
  graph: Graph,
  parentNode: X6Node,
  direction: string,
  mmSettings: any
): Promise<void> {
  try {
    // Import electron API dynamically
    const { selectFolder, scanDirectory } = await import('../services/electron');

    // Open folder selection dialog
    const result = await selectFolder();

    if (!result.success || !result.folderPath) {
      if (!result.canceled) {
        console.error('Failed to select folder:', result.error);
      }
      return;
    }

    // Get includeHiddenFiles setting from localStorage
    const includeHidden = localStorage.getItem('drawdd-include-hidden-files') === 'true';

    // Scan the directory
    const scanResult = await scanDirectory(result.folderPath, includeHidden);

    if (!scanResult.success || !scanResult.fileTree) {
      console.error('Failed to scan directory:', scanResult.error);
      showErrorNotification(`Failed to scan directory: ${scanResult.error || 'Unknown error'}`);
      return;
    }

    // Import folder explorer utilities
    const { generateChildNodes } = await import('./folderExplorer');

    // Create folder explorer metadata
    const metadata = {
      isFolderExplorer: true,
      explorerType: 'linked' as const,
      path: result.folderPath,
      isDirectory: true,
      isReadOnly: true,
      lastRefreshed: new Date().toISOString(),
    };

    // Generate children from folder structure
    generateChildNodes(graph, parentNode, scanResult.fileTree, metadata);

    // Apply layout
    const { applyMindmapLayout } = await import('./layout');
    const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';

    // Find root node
    const findRoot = (n: X6Node): X6Node => {
      const incoming = graph.getIncomingEdges(n);
      if (!incoming || incoming.length === 0) return n;
      const sourceId = incoming[0].getSourceCellId();
      const source = sourceId ? graph.getCellById(sourceId) : null;
      if (source && source.isNode()) return findRoot(source as X6Node);
      return n;
    };

    const rootNode = findRoot(parentNode);
    setTimeout(() => {
      applyMindmapLayout(graph, direction as any, rootNode, layoutMode);
    }, 0);

  } catch (error) {
    console.error('Link folder as children error:', error);
    showErrorNotification(`Failed to link folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Handle "Insert Folder Snapshot as Children" context menu action
 * Attaches a static folder structure as children of the selected node
 */
async function handleInsertFolderSnapshotAsChildren(
  graph: Graph,
  parentNode: X6Node,
  direction: string,
  mmSettings: any
): Promise<void> {
  try {
    // Import electron API dynamically
    const { selectFolder, scanDirectory } = await import('../services/electron');

    // Open folder selection dialog
    const result = await selectFolder();

    if (!result.success || !result.folderPath) {
      if (!result.canceled) {
        console.error('Failed to select folder:', result.error);
      }
      return;
    }

    // Get includeHiddenFiles setting from localStorage
    const includeHidden = localStorage.getItem('drawdd-include-hidden-files') === 'true';

    // Scan the directory
    const scanResult = await scanDirectory(result.folderPath, includeHidden);

    if (!scanResult.success || !scanResult.fileTree) {
      console.error('Failed to scan directory:', scanResult.error);
      showErrorNotification(`Failed to scan directory: ${scanResult.error || 'Unknown error'}`);
      return;
    }

    // Import folder explorer utilities
    const { generateChildNodes } = await import('./folderExplorer');

    // Create folder explorer metadata (static mode)
    const metadata = {
      isFolderExplorer: true,
      explorerType: 'static' as const,
      path: result.folderPath,
      isDirectory: true,
      isReadOnly: false, // Static nodes are editable
    };

    // Generate children from folder structure
    generateChildNodes(graph, parentNode, scanResult.fileTree, metadata);

    // Apply layout
    const { applyMindmapLayout } = await import('./layout');
    const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';

    // Find root node
    const findRoot = (n: X6Node): X6Node => {
      const incoming = graph.getIncomingEdges(n);
      if (!incoming || incoming.length === 0) return n;
      const sourceId = incoming[0].getSourceCellId();
      const source = sourceId ? graph.getCellById(sourceId) : null;
      if (source && source.isNode()) return findRoot(source as X6Node);
      return n;
    };

    const rootNode = findRoot(parentNode);
    setTimeout(() => {
      applyMindmapLayout(graph, direction as any, rootNode, layoutMode);
    }, 0);

  } catch (error) {
    console.error('Insert folder snapshot as children error:', error);
    showErrorNotification(`Failed to insert folder snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
