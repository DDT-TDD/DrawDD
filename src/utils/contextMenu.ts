/**
 * Enhanced Context Menu System for DRAWDD
 * Provides context menus for cells, empty canvas, and mindmap-specific operations
 */

import type { Graph, Cell, Node as X6Node } from '@antv/x6';
import { applyMindmapLayout } from '../utils/layout';
import { getNextThemeColors } from '../utils/theme';
import { FULL_PORTS_CONFIG } from '../config/shapes';
import { getMindmapLevelColor } from '../config/enhancedStyles';

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
      disabled: graph.isClipboardEmpty(),
      action: () => {
        if (!graph.isClipboardEmpty()) {
          const cells = graph.paste({ offset: 30 });
          graph.cleanSelection();
          graph.select(cells);
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
          const nodePos = (cell as X6Node).getPosition();
          const nodeSize = (cell as X6Node).getSize();
          const tlDir = (window as any).__timelineDirection || 'horizontal';
          
          const x0 = tlDir === 'horizontal' ? nodePos.x + nodeSize.width + 120 : nodePos.x;
          const y0 = tlDir === 'horizontal' ? nodePos.y : nodePos.y + nodeSize.height + 80;

          const newEvent = graph.addNode({
            x: x0,
            y: y0,
            width: 140,
            height: 50,
            attrs: {
              body: { fill: colors.fill, stroke: colors.stroke, strokeWidth: 2, rx: 8, ry: 8 },
              label: { text: 'New Event', fill: colors.text, fontSize: 14 },
            },
            data: { isTimeline: true, eventType: 'event' },
            ports: FULL_PORTS_CONFIG as any,
          });

          graph.addEdge({
            source: cell.id,
            target: newEvent.id,
            attrs: { line: { stroke: lineColor, strokeWidth: 2 } },
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
        graph.removeCell(cell);
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
    width: 120,
    height: 40,
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
  setTimeout(() => {
    applyMindmapLayout(graph, direction as any, rootNode);
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
    // Use setTimeout to ensure DOM updates settle before layout recalculation
    setTimeout(() => {
      applyMindmapLayout(graph, direction as any, rootNode);
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

/**
 * Toggle collapse/expand of a mindmap branch
 */
function toggleCollapse(graph: Graph, node: X6Node, collapse: boolean): void {
  const data = node.getData() || {};
  node.setData({ ...data, collapsed: collapse });

  const hideDescendants = (n: X6Node, hide: boolean) => {
    const outgoingEdges = graph.getOutgoingEdges(n);
    if (!outgoingEdges) return;

    outgoingEdges.forEach(edge => {
      edge.setVisible(!hide);
      const targetId = edge.getTargetCellId();
      const target = targetId ? graph.getCellById(targetId) : null;
      if (target && target.isNode()) {
        target.setVisible(!hide);
        hideDescendants(target as X6Node, hide);
      }
    });
  };

  hideDescendants(node, collapse);
}

// Helper to get router/connector config based on style
type ConnectorStyle = 'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight';

function getEdgeRouting(style: ConnectorStyle | string | undefined): { router: any; connector: any } {
  // For mindmaps: smooth uses normal router, straight/ortho use manhattan for clean alignment
  switch (style) {
    case 'smooth':
      return { router: { name: 'normal' }, connector: { name: 'smooth' } };
    case 'orthogonal-rounded':
    case 'orthogonal': // legacy support
      return { router: { name: 'manhattan' }, connector: { name: 'rounded', args: { radius: 10 } } };
    case 'orthogonal-sharp':
      return { router: { name: 'manhattan' }, connector: { name: 'normal' } };
    case 'straight':
    default:
      // Elbow lines (horizontal + vertical segments only) for clean mindmap alignment
      return { router: { name: 'manhattan' }, connector: { name: 'normal' } };
  }
}

/**
 * Handle paste of text list to create mindmap branches
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

    // Split by newlines or tabs
    const lines = text.split(/[\n\r\t]+/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return false;

    const targetData = targetNode.getData() || {};
    const level = (typeof targetData.level === 'number' ? targetData.level : 0) + 1;

    lines.forEach((line, index) => {
      const nodeColors = mmSettings.colorByLevel 
        ? getMindmapLevelColor(level, mmSettings.theme as any)
        : getNextThemeColors(colorScheme);

      const childNode = graph.addNode({
        x: targetNode.getPosition().x + 200,
        y: targetNode.getPosition().y + index * 60,
        width: 120,
        height: 40,
        attrs: {
          body: {
            fill: nodeColors.fill,
            stroke: nodeColors.stroke,
            strokeWidth: 2,
            rx: 6,
            ry: 6,
          },
          label: {
            text: line.trim().substring(0, 50), // Limit text length
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
        edgeAttrs.line.targetMarker = { name: 'block', width: 8, height: 6 };
      } else {
        edgeAttrs.line.targetMarker = null;
      }

      const routing = getEdgeRouting(mmSettings.connectorStyle);

      graph.addEdge({
        source: { cell: targetNode.id },
        target: { cell: childNode.id },
        attrs: edgeAttrs,
        router: routing.router,
        connector: routing.connector,
      });
    });

    // Apply layout
    const rootNode = findMindmapRoot(graph, targetNode);
    applyMindmapLayout(graph, direction as any, rootNode);

    return true;
  } catch {
    return false;
  }
}
