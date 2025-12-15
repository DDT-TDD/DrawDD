import { useEffect, useRef, useCallback, useState } from 'react';
import { Graph, type Edge, type Cell, type Node as X6Node } from '@antv/x6';
import { applyMindmapLayout } from '../utils/layout';
import { History } from '@antv/x6-plugin-history';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Export } from '@antv/x6-plugin-export';
import { Dnd } from '@antv/x6-plugin-dnd';
import { MiniMap } from '@antv/x6-plugin-minimap';
import { Clipboard } from '@antv/x6-plugin-clipboard';
import { Transform } from '@antv/x6-plugin-transform';
import { useGraph } from '../context/GraphContext';
import { ZoomControls } from './ZoomControls';
import { QuickActions } from './QuickActions';
import { useAutoSave, getAutoSaveInfo } from '../utils/autoSave';
import { registerLogicGateShapes } from '../config/logicGateShapes';
import { FULL_PORTS_CONFIG } from '../config/shapes';

// Register custom shapes on module load
registerLogicGateShapes();

let mindmapOrderCounter = 1;

// Context Menu Helper
function showContextMenu(graph: Graph, cell: Cell, x: number, y: number, mode: 'flowchart' | 'mindmap' | 'timeline') {
  // Remove existing menu
  const existingMenu = document.getElementById('drawdd-context-menu');
  if (existingMenu) existingMenu.remove();

  // Check if dark mode is enabled
  const isDark = document.documentElement.classList.contains('dark');

  const menu = document.createElement('div');
  menu.id = 'drawdd-context-menu';
  menu.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    background: ${isDark ? '#1e293b' : 'white'};
    border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.4' : '0.15'});
    z-index: 10000;
    min-width: 180px;
    padding: 4px 0;
    font-family: system-ui, sans-serif;
    font-size: 13px;
    color: ${isDark ? '#f1f5f9' : '#1e293b'};
  `;

  const isNode = cell.isNode();
  
  interface MenuItem {
    label: string;
    action?: () => void;
  }
  
  const menuItems: MenuItem[] = [];
  
  const data = isNode ? (cell as any).getData?.() : null;
  const isMindmapNode = isNode && data?.isMindmap === true;
  const allowMindmapActions = (isMindmapNode || mode === 'mindmap' || mode === undefined) && mode !== 'timeline';

  if (isNode && allowMindmapActions) {
    // Mindmap-specific options for nodes
    menuItems.push(
      { label: '➕ Add Child Node', action: () => {
        const parentNode = cell;
        
        // Get direction from context (captured at render time)
        const dir = (window as any).__mindmapDirection || 'right';
        
        const parentPos = (parentNode as any).getPosition?.() || { x: 0, y: 0 };
        const parentSize = (parentNode as any).getSize?.() || { width: 120, height: 40 };
        const incoming = graph.getIncomingEdges(parentNode as any);
        const parentData = (parentNode as any).getData?.() || {};
        const level = (typeof parentData.level === 'number' ? parentData.level : (incoming?.length ? 1 : 0)) + 1;

        // Place near parent to keep ordering stable before layout
        const x0 = dir === 'left' ? parentPos.x - 200 : parentPos.x + parentSize.width + 120;
        const y0 = dir === 'top' ? parentPos.y - 120 : dir === 'bottom' ? parentPos.y + parentSize.height + 80 : parentPos.y;

        const childNode = graph.addNode({
          x: x0,
          y: y0,
          width: 120,
          height: 40,
          attrs: {
            body: {
              fill: '#90caf9',
              stroke: '#64b5f6',
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              text: 'New Topic',
              fill: '#333333',
              fontSize: 12,
            },
          },
          data: { isMindmap: true, level, mmOrder: mindmapOrderCounter++ },
          ports: FULL_PORTS_CONFIG as any,
        });

        graph.addEdge({
          source: { cell: parentNode.id },
          target: { cell: childNode.id },
          attrs: {
            line: {
              stroke: '#5F95FF',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          router: { name: 'normal' },
          connector: { name: 'smooth' },
        });

        // Find root node by traversing up
        const traverseUp = (node: typeof parentNode): typeof parentNode => {
          const incomingEdges = graph.getIncomingEdges(node);
          if (!incomingEdges || incomingEdges.length === 0) return node;
          const source = graph.getCellById(incomingEdges[0].getSourceCellId() || '');
          return source?.isNode() ? traverseUp(source) : node;
        };
        const rootNode = traverseUp(parentNode);
        
        // Apply layout to prevent overlap
        applyMindmapLayout(graph, dir, rootNode);

        graph.select(childNode);
      }},
      { label: '➡️ Add Sibling Node', action: () => {
        if (!cell.isNode()) return;
        const currentNode = cell as X6Node;
        const currentSize = currentNode.getSize();
        
        const incomingEdges = graph.getIncomingEdges(currentNode);
        const parentEdge = incomingEdges?.[0];
        const parentNode = parentEdge ? graph.getCellById(parentEdge.getSourceCellId() || '') : null;

        // Get direction from context
        const dir = (window as any).__mindmapDirection || 'right';

        const currentPos = currentNode.getPosition();
        const currentData = (currentNode as any).getData?.() || {};
        const level = typeof currentData.level === 'number' ? currentData.level : 1;

        const siblingNode = graph.addNode({
          x: currentPos.x,
          y: currentPos.y + currentSize.height + 60,
          width: currentSize.width,
          height: currentSize.height,
          attrs: {
            body: {
              fill: '#90caf9',
              stroke: '#64b5f6',
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              text: 'New Topic',
              fill: '#333333',
              fontSize: 12,
            },
          },
          data: { isMindmap: true, level, mmOrder: mindmapOrderCounter++ },
          ports: FULL_PORTS_CONFIG as any,
        });

        if (parentNode && parentNode.isNode()) {
          graph.addEdge({
            source: { cell: parentNode.id },
            target: { cell: siblingNode.id },
            attrs: {
              line: {
                stroke: '#5F95FF',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8,
                },
              },
            },
            router: { name: 'normal' },
            connector: { name: 'smooth' },
          });
          
          // Find root node by traversing up
          const traverseUp = (node: typeof parentNode): typeof parentNode => {
            const incomingSibling = graph.getIncomingEdges(node);
            if (!incomingSibling || incomingSibling.length === 0) return node;
            const source = graph.getCellById(incomingSibling[0].getSourceCellId() || '');
            return source?.isNode() ? traverseUp(source) : node;
          };
          const rootNode = traverseUp(parentNode);
          
          // Apply layout to prevent overlap
          applyMindmapLayout(graph, dir, rootNode);
        }

        graph.select(siblingNode);
      }},
      { label: '✏️ Edit Text', action: () => {
        const currentLabel = cell.getAttrs()?.label?.text || '';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = String(currentLabel);
        
        const inputIsDark = document.documentElement.classList.contains('dark');
        input.style.cssText = `
          position: fixed;
          left: ${x}px;
          top: ${y - 40}px;
          padding: 8px 12px;
          font-size: 14px;
          border: 2px solid #5F95FF;
          border-radius: 6px;
          outline: none;
          box-shadow: 0 4px 12px rgba(0,0,0,${inputIsDark ? '0.4' : '0.15'});
          z-index: 10001;
          min-width: 150px;
          background: ${inputIsDark ? '#1e293b' : 'white'};
          color: ${inputIsDark ? '#f1f5f9' : '#1e293b'};
        `;
        document.body.appendChild(input);
        input.focus();
        input.select();

        const handleBlur = () => {
          cell.setAttrs({ label: { text: input.value } });
          input.remove();
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
          if (ev.key === 'Enter') {
            handleBlur();
          } else if (ev.key === 'Escape') {
            input.remove();
          }
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
      }},
      { label: '---' }
    );
  }

  // Timeline-specific options for timeline mode
  if (isNode && mode === 'timeline') {
    menuItems.push(
      { label: '📅 Add Timeline Event', action: () => {
        const nodePos = (cell as any).getPosition?.() || { x: 0, y: 0 };
        const nodeSize = (cell as any).getSize?.() || { width: 140, height: 50 };
        const dir = (window as any).__timelineDirection || 'horizontal';
        
        const x0 = dir === 'horizontal' ? nodePos.x + nodeSize.width + 120 : nodePos.x;
        const y0 = dir === 'horizontal' ? nodePos.y : nodePos.y + nodeSize.height + 80;

        const newEvent = graph.addNode({
          x: x0,
          y: y0,
          width: 140,
          height: 50,
          attrs: {
            body: {
              fill: '#e3f2fd',
              stroke: '#2196f3',
              strokeWidth: 2,
              rx: 8,
              ry: 8,
            },
            label: {
              text: 'New Event',
              fill: '#333333',
              fontSize: 14,
            },
          },
          data: { isTimeline: true, eventType: 'event' },
          ports: graph.getNodes()[0]?.getPorts() || [],
        });

        graph.addEdge({
          source: cell.id,
          target: newEvent.id,
          attrs: { line: { stroke: '#2196f3', strokeWidth: 2 } },
        });

        graph.select(newEvent);
      }},
      { label: '✏️ Edit Text', action: () => {
        const currentLabel = cell.getAttrs()?.label?.text || '';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = String(currentLabel);
        
        const inputIsDark = document.documentElement.classList.contains('dark');
        input.style.cssText = `
          position: fixed;
          left: ${x}px;
          top: ${y - 40}px;
          padding: 8px 12px;
          font-size: 14px;
          border: 2px solid #5F95FF;
          border-radius: 6px;
          outline: none;
          box-shadow: 0 4px 12px rgba(0,0,0,${inputIsDark ? '0.4' : '0.15'});
          z-index: 10001;
          min-width: 150px;
          background: ${inputIsDark ? '#1e293b' : 'white'};
          color: ${inputIsDark ? '#f1f5f9' : '#1e293b'};
        `;
        document.body.appendChild(input);
        input.focus();
        input.select();

        const handleBlur = () => {
          cell.setAttrs({ label: { text: input.value } });
          input.remove();
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
          if (ev.key === 'Enter') {
            handleBlur();
          } else if (ev.key === 'Escape') {
            input.remove();
          }
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
      }},
      { label: '---' }
    );
  }

  // Common options for all nodes
  if (isNode) {
    menuItems.push(
      { label: '🔄 Change Shape', action: () => {
        // Trigger a custom event that PropertiesPanel will listen to
        const event = new CustomEvent('drawdd:change-shape', { detail: { cell } });
        window.dispatchEvent(event);
      }}
    );
    
    // Add "Change Image" option for image nodes
    if ((cell as any).shape === 'image') {
      menuItems.push(
        { label: '🖼️ Change Image', action: () => {
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

                  (cell as any).resize(width, height);
                  (cell as any).setAttrs({
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
        }}
      );
    }
  }

  menuItems.push(
    { label: '📄 Duplicate', action: () => {
      const clone = cell.clone();
      clone.translate(30, 30);
      graph.addCell(clone);
    }},
    { label: '---' },
    { label: '⬆️ Bring to Front', action: () => { cell.toFront(); } },
    { label: '⬇️ Send to Back', action: () => { cell.toBack(); } },
    { label: '---' },
    { label: '🗑️ Delete', action: () => { graph.removeCell(cell); } }
  );

  menuItems.forEach(item => {
    if (item.label === '---') {
      const separator = document.createElement('div');
      separator.style.cssText = `height: 1px; background: ${isDark ? '#334155' : '#e2e8f0'}; margin: 4px 0;`;
      menu.appendChild(separator);
    } else {
      const menuItem = document.createElement('div');
      menuItem.textContent = item.label;
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        transition: background 0.1s;
      `;
      const hoverBg = isDark ? '#334155' : '#f1f5f9';
      menuItem.onmouseenter = () => { menuItem.style.background = hoverBg; };
      menuItem.onmouseleave = () => { menuItem.style.background = 'transparent'; };
      menuItem.onclick = () => {
        item.action?.();
        menu.remove();
      };
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
export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const { graph: contextGraph, setGraph, setSelectedCell, setZoom, showGrid, mindmapDirection, timelineDirection, mode, gridSize } = useGraph();
  const graphRef = useRef<Graph | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const hasCheckedAutoSave = useRef(false);

  // Sync mindmap and timeline direction to window for keyboard shortcut access
  useEffect(() => {
    (window as any).__mindmapDirection = mindmapDirection;
    (window as any).__timelineDirection = timelineDirection;
    (window as any).__drawdd_mode = mode;
    return () => { 
      delete (window as any).__mindmapDirection; 
      delete (window as any).__timelineDirection;
      delete (window as any).__drawdd_mode;
    };
  }, [mindmapDirection, timelineDirection, mode]);

  // Setup auto-save
  const { loadFromStorage, clearStorage } = useAutoSave(contextGraph);

  // Check for saved data when graph is ready
  useEffect(() => {
    if (contextGraph && !hasCheckedAutoSave.current) {
      hasCheckedAutoSave.current = true;
      const info = getAutoSaveInfo();
      if (info && info.nodeCount > 0) {
        setShowRestorePrompt(true);
      }
    }
  }, [contextGraph]);

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current || !contextGraph) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && contextGraph) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        contextGraph.resize(width, height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [contextGraph]);

  const handleRestore = () => {
    loadFromStorage();
    setShowRestorePrompt(false);
  };

  const handleDismiss = () => {
    clearStorage();
    setShowRestorePrompt(false);
  };

  const initGraph = useCallback(() => {
    if (!containerRef.current || graphRef.current) return;

    const graph: Graph = new Graph({
      container: containerRef.current,
      autoResize: true,
      interacting: {
        edgeLabelMovable: true,
        edgeMovable: true,
        vertexMovable: true,
        vertexAddable: true,
        vertexDeletable: true,
      },
      background: {
        color: '#f8fafc',
      },
      grid: {
        visible: true,
        size: gridSize || 10,
        type: 'doubleMesh',
        args: [
          {
            color: '#e2e8f0',
            thickness: 1,
          },
          {
            color: '#cbd5e1',
            thickness: 1,
            factor: 4,
          },
        ],
      },
      mousewheel: {
        enabled: true,
        zoomAtMousePosition: true,
        modifiers: 'ctrl',
        minScale: 0.2,
        maxScale: 4,
      },
      panning: {
        enabled: true,
        modifiers: 'shift',
      },
      connecting: ({
        router: 'manhattan',
        connector: {
          name: 'rounded',
          args: {
            radius: 8,
          },
        },
        // Allow connecting from arbitrary points on a node (not only center)
        connectionStrategy: 'pinRelative',
        anchor: 'center',
        connectionPoint: 'boundary',
        allowBlank: false,
        snap: {
          radius: 20,
        },
        createEdge(): Edge {
          return this.createEdge({
            attrs: {
              line: {
                stroke: '#5F95FF',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8,
                },
              },
            },
            zIndex: 0,
          });
        },
        validateConnection({ targetMagnet }: any) {
          return !!targetMagnet;
        },
      }) as any,
      highlighting: {
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: {
              fill: '#5F95FF',
              stroke: '#5F95FF',
            },
          },
        },
      },
    });

    // Register plugins
    graph.use(
      new History({
        enabled: true,
      })
    );

    graph.use(
      new Selection({
        enabled: true,
        multiple: true,
        rubberband: true,
        movable: true,
        showNodeSelectionBox: false,
        showEdgeSelectionBox: false,
      })
    );

    graph.use(
      new Snapline({
        enabled: true,
      })
    );

    graph.use(
      new Keyboard({
        enabled: true,
        global: true,
      })
    );

    graph.use(new Export());

    graph.use(
      new Transform({
        resizing: {
          enabled: true,
          minWidth: 20,
          minHeight: 20,
          preserveAspectRatio: false,
        },
        rotating: false,
      })
    );

    graph.use(
      new Dnd({
        target: graph,
        scaled: false,
      })
    );

    graph.use(
      new Clipboard({
        enabled: true,
      })
    );

    if (minimapRef.current) {
      graph.use(
        new MiniMap({
          container: minimapRef.current,
          width: 180,
          height: 120,
          padding: 10,
        })
      );
    }

    // Keyboard shortcuts
    graph.bindKey(['ctrl+z', 'cmd+z'], () => {
      if (graph.canUndo()) {
        graph.undo();
      }
      return false;
    });

    graph.bindKey(['ctrl+shift+z', 'cmd+shift+z', 'ctrl+y', 'cmd+y'], () => {
      if (graph.canRedo()) {
        graph.redo();
      }
      return false;
    });

    graph.bindKey(['delete', 'backspace'], () => {
      const cells = graph.getSelectedCells();
      if (cells.length) {
        graph.removeCells(cells);
      }
      return false;
    });

    graph.bindKey(['ctrl+a', 'cmd+a'], () => {
      const nodes = graph.getNodes();
      if (nodes.length) {
        graph.select(nodes);
      }
      return false;
    });

    // Clipboard shortcuts
    graph.bindKey(['ctrl+c', 'cmd+c'], () => {
      const cells = graph.getSelectedCells();
      if (cells.length) {
        graph.copy(cells);
      }
      return false;
    });

    graph.bindKey(['ctrl+v', 'cmd+v'], () => {
      if (!graph.isClipboardEmpty()) {
        const cells = graph.paste({ offset: 30 });
        graph.cleanSelection();
        graph.select(cells);
      }
      return false;
    });

    graph.bindKey(['ctrl+x', 'cmd+x'], () => {
      const cells = graph.getSelectedCells();
      if (cells.length) {
        graph.cut(cells);
      }
      return false;
    });

    graph.bindKey(['ctrl+d', 'cmd+d'], () => {
      const cells = graph.getSelectedCells();
      if (cells.length) {
        graph.copy(cells);
        const cloned = graph.paste({ offset: 30 });
        graph.cleanSelection();
        graph.select(cloned);
      }
      return false;
    });

    // Group: Ctrl+G
    graph.bindKey(['ctrl+g', 'cmd+g'], () => {
      const cells = graph.getSelectedCells().filter(c => c.isNode());
      if (cells.length > 1) {
        // Calculate bounding box of selected nodes
        const boxes = cells.map(c => c.getBBox());
        const minX = Math.min(...boxes.map(b => b.x)) - 10;
        const minY = Math.min(...boxes.map(b => b.y)) - 10;
        const maxX = Math.max(...boxes.map(b => b.x + b.width)) + 10;
        const maxY = Math.max(...boxes.map(b => b.y + b.height)) + 10;
        
        const group = graph.createNode({
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          shape: 'rect',
          attrs: {
            body: {
              fill: 'rgba(95, 149, 255, 0.05)',
              stroke: '#5F95FF',
              strokeWidth: 1,
              strokeDasharray: '5 5',
              rx: 4,
              ry: 4,
            },
          },
          zIndex: 0,
        });
        graph.addCell(group);
        cells.forEach(cell => {
          group.addChild(cell);
        });
        graph.cleanSelection();
        graph.select(group);
      }
      return false;
    });

    // Ungroup: Ctrl+Shift+G
    graph.bindKey(['ctrl+shift+g', 'cmd+shift+g'], () => {
      const cells = graph.getSelectedCells();
      const ungroupedCells: Cell[] = [];
      cells.forEach(cell => {
        if (cell.isNode()) {
          const children = cell.getChildren();
          if (children && children.length > 0) {
            children.forEach(child => {
              cell.removeChild(child);
              graph.addCell(child);
              ungroupedCells.push(child);
            });
            graph.removeCell(cell);
          }
        }
      });
      if (ungroupedCells.length > 0) {
        graph.cleanSelection();
        graph.select(ungroupedCells);
      }
      return false;
    });

    // Mode-aware Insert key: timeline adds event, mindmap adds child
    graph.bindKey(['insert', 'ins', 'Insert'], () => {
      const currentMode = (window as any).__drawdd_mode;
      const cells = graph.getSelectedCells();

      if (currentMode === 'timeline') {
        if (cells.length === 1 && cells[0].isNode()) {
          const parentNode = cells[0] as X6Node;
          const pos = parentNode.getPosition();
          const size = parentNode.getSize();
          const isHorizontal = timelineDirection === 'horizontal';

          const newNode = graph.addNode({
            shape: 'rect',
            x: isHorizontal ? pos.x + size.width + 100 : pos.x,
            y: isHorizontal ? pos.y : pos.y + size.height + 80,
            width: 100,
            height: 60,
            attrs: {
              body: { fill: '#e3f2fd', stroke: '#1976d2', strokeWidth: 2, rx: 4, ry: 4 },
              label: { text: 'New Event', fill: '#000', fontSize: 14 },
            },
          });

          graph.addEdge({
            source: parentNode,
            target: newNode,
            attrs: { line: { stroke: '#1976d2', strokeWidth: 2 } },
          });

          graph.cleanSelection();
          graph.select(newNode);
        }
        return false;
      }

      if (currentMode !== 'mindmap') return true;

      if (cells.length === 1 && cells[0].isNode()) {
        const parentNode = cells[0] as X6Node;

        const parentData = (parentNode as any).getData?.() || {};
        const allowMindmap = parentData.isMindmap === true || currentMode === 'mindmap';
        if (!allowMindmap) return false;

        const dir = (window as any).__mindmapDirection || 'right';

        const parentPos = parentNode.getPosition();
        const parentSize = parentNode.getSize();
        const level = (typeof parentData.level === 'number' ? parentData.level : 0) + 1;

        const initialX = dir === 'left' ? parentPos.x - 220 : parentPos.x + parentSize.width + 120;
        const initialY = dir === 'top'
          ? parentPos.y - 140
          : dir === 'bottom'
            ? parentPos.y + parentSize.height + 100
            : parentPos.y;

        const childNode = graph.addNode({
          x: initialX,
          y: initialY,
          width: 120,
          height: 40,
          attrs: {
            body: {
              fill: '#90caf9',
              stroke: '#64b5f6',
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              text: 'New Topic',
              fill: '#333333',
              fontSize: 12,
            },
          },
          data: { isMindmap: true, level, mmOrder: mindmapOrderCounter++ },
          ports: FULL_PORTS_CONFIG as any,
        });

        graph.addEdge({
          source: { cell: parentNode.id },
          target: { cell: childNode.id },
          attrs: {
            line: {
              stroke: '#5F95FF',
              strokeWidth: 2,
              targetMarker: {
                name: 'block',
                width: 12,
                height: 8,
              },
            },
          },
          router: { name: 'normal' },
          connector: { name: 'smooth' },
        });

        const traverseUp = (node: typeof parentNode): typeof parentNode => {
          const incoming = graph.getIncomingEdges(node);
          if (!incoming || incoming.length === 0) return node;
          const source = graph.getCellById(incoming[0].getSourceCellId() || '');
          return source?.isNode() ? traverseUp(source) : node;
        };
        const rootNode = traverseUp(parentNode);

        applyMindmapLayout(graph, dir, rootNode);

        graph.unselect(childNode);
        graph.cleanSelection();
        graph.select(parentNode);
      }
      return false;
    });

    // Enter: Add sibling node
    graph.bindKey('enter', () => {
      const cells = graph.getSelectedCells();
      if (cells.length === 1 && cells[0].isNode()) {
        const currentNode = cells[0] as X6Node;

        const currentData = (currentNode as any).getData?.() || {};
        const allowMindmap = currentData.isMindmap === true || mode === 'mindmap' || mode === undefined;
        if (!allowMindmap) return false;
        const currentSize = currentNode.getSize();
        
        // Find incoming edges to find parent
        const incomingEdges = graph.getIncomingEdges(currentNode);
        const parentEdge = incomingEdges?.[0];
        const parentNode = parentEdge ? graph.getCellById(parentEdge.getSourceCellId() || '') : null;

        // Get direction from context
        const dir = (window as any).__mindmapDirection || 'right';

        const currentPos = currentNode.getPosition();
        const level = typeof currentData.level === 'number' ? currentData.level : 1;

        // Create sibling near current - layout will position it
        const siblingNode = graph.addNode({
          x: currentPos.x,
          y: currentPos.y + currentSize.height + 60,
          width: currentSize.width,
          height: currentSize.height,
          attrs: {
            body: {
              fill: '#90caf9',
              stroke: '#64b5f6',
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              text: 'New Topic',
              fill: '#333333',
              fontSize: 12,
            },
          },
          data: { isMindmap: true, level, mmOrder: mindmapOrderCounter++ },
          ports: FULL_PORTS_CONFIG as any,
        });

        // Connect to same parent if exists
        if (parentNode && parentNode.isNode()) {
          graph.addEdge({
            source: { cell: parentNode.id },
            target: { cell: siblingNode.id },
            attrs: {
              line: {
                stroke: '#5F95FF',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8,
                },
              },
            },
            router: { name: 'normal' },
            connector: { name: 'smooth' },
          });
          
          // Find root node by traversing up
          const traverseUp = (node: typeof parentNode): typeof parentNode => {
            const incoming = graph.getIncomingEdges(node);
            if (!incoming || incoming.length === 0) return node;
            const source = graph.getCellById(incoming[0].getSourceCellId() || '');
            return source?.isNode() ? traverseUp(source) : node;
          };
          const rootNode = traverseUp(parentNode);
          applyMindmapLayout(graph, dir, rootNode);
        }

        // Keep ONLY current node selected (clear selection first)
        graph.unselect(siblingNode);
        graph.cleanSelection();
        graph.select(currentNode);
      }
      return false;
    });

    // Arrow keys for navigation
    graph.bindKey('up', () => {
      const cells = graph.getSelectedCells();
      if (cells.length === 1 && cells[0].isNode()) {
        const currentNode = cells[0];
        const currentPos = currentNode.getPosition();
        const nodes = graph.getNodes().filter(n => n.id !== currentNode.id);
        
        // Find nearest node above
        let nearestNode = null;
        let nearestDist = Infinity;
        
        for (const node of nodes) {
          const pos = node.getPosition();
          if (pos.y < currentPos.y) {
            const dist = Math.sqrt(Math.pow(pos.x - currentPos.x, 2) + Math.pow(pos.y - currentPos.y, 2));
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestNode = node;
            }
          }
        }
        
        if (nearestNode) {
          graph.select(nearestNode);
        }
      }
      return false;
    });

    graph.bindKey('down', () => {
      const cells = graph.getSelectedCells();
      if (cells.length === 1 && cells[0].isNode()) {
        const currentNode = cells[0];
        const currentPos = currentNode.getPosition();
        const nodes = graph.getNodes().filter(n => n.id !== currentNode.id);
        
        let nearestNode = null;
        let nearestDist = Infinity;
        
        for (const node of nodes) {
          const pos = node.getPosition();
          if (pos.y > currentPos.y) {
            const dist = Math.sqrt(Math.pow(pos.x - currentPos.x, 2) + Math.pow(pos.y - currentPos.y, 2));
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestNode = node;
            }
          }
        }
        
        if (nearestNode) {
          graph.select(nearestNode);
        }
      }
      return false;
    });

    graph.bindKey('left', () => {
      const cells = graph.getSelectedCells();
      if (cells.length === 1 && cells[0].isNode()) {
        const currentNode = cells[0];
        const incomingEdges = graph.getIncomingEdges(currentNode);
        
        if (incomingEdges && incomingEdges.length > 0) {
          const parentId = incomingEdges[0].getSourceCellId();
          if (parentId) {
            const parentNode = graph.getCellById(parentId);
            if (parentNode) {
              graph.select(parentNode);
            }
          }
        }
      }
      return false;
    });

    graph.bindKey('right', () => {
      const cells = graph.getSelectedCells();
      if (cells.length === 1 && cells[0].isNode()) {
        const currentNode = cells[0];
        const outgoingEdges = graph.getOutgoingEdges(currentNode);
        
        if (outgoingEdges && outgoingEdges.length > 0) {
          const childId = outgoingEdges[0].getTargetCellId();
          if (childId) {
            const childNode = graph.getCellById(childId);
            if (childNode) {
              graph.select(childNode);
            }
          }
        }
      }
      return false;
    });

    // F2: Edit selected node
    graph.bindKey('f2', () => {
      const cells = graph.getSelectedCells();
      if (cells.length === 1 && cells[0].isNode()) {
        const cell = cells[0];
        const pos = cell.getBBox();
        const currentLabel = cell.getAttrs()?.label?.text || '';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = String(currentLabel);
        
        // Get container position for proper positioning
        const containerRect = containerRef.current?.getBoundingClientRect();
        const graphPos = graph.localToGraph({ x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 });
        
        const editIsDark = document.documentElement.classList.contains('dark');
        input.style.cssText = `
          position: fixed;
          left: ${(containerRect?.left || 0) + graphPos.x}px;
          top: ${(containerRect?.top || 0) + graphPos.y}px;
          transform: translate(-50%, -50%);
          padding: 8px 12px;
          font-size: 14px;
          border: 2px solid #5F95FF;
          border-radius: 6px;
          outline: none;
          box-shadow: 0 4px 12px rgba(0,0,0,${editIsDark ? '0.4' : '0.15'});
          z-index: 10000;
          min-width: 150px;
          text-align: center;
          background: ${editIsDark ? '#1e293b' : 'white'};
          color: ${editIsDark ? '#f1f5f9' : '#1e293b'};
        `;
        document.body.appendChild(input);
        input.focus();
        input.select();

        const handleBlur = () => {
          try {
            if (graph.hasCell(cell.id)) {
              cell.setAttrs({ label: { text: input.value } });
            }
          } finally {
            input.remove();
          }
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
          if (ev.key === 'Enter') {
            handleBlur();
          } else if (ev.key === 'Escape') {
            input.remove();
          }
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
      }
      return false;
    });

    // Event handlers
    graph.on('selection:changed', ({ selected }: { selected: { length: number; 0?: unknown } }) => {
      if (selected.length === 1) {
        const cell = selected[0] as any;
        setSelectedCell(cell as never);
        
        // Add simple draggable endpoint handles to edges when selected
        if (cell.isEdge?.()) {
          cell.addTools([
            {
              name: 'source-arrowhead',
              args: {
                attrs: {
                  fill: '#1976d2',
                  stroke: '#fff',
                  'stroke-width': 2,
                  d: 'M 0 -5 L 5 0 L 0 5 L -5 0 Z',
                  cursor: 'move',
                }
              }
            },
            {
              name: 'target-arrowhead',
              args: {
                attrs: {
                  fill: '#1976d2',
                  stroke: '#fff',
                  'stroke-width': 2,
                  d: 'M 0 -5 L 5 0 L 0 5 L -5 0 Z',
                  cursor: 'move',
                }
              }
            },
          ]);
        }
      } else {
        setSelectedCell(null);
      }
      
      // Remove tools from unselected cells
      const selectedArray = Array.isArray(selected) ? selected : Array.from(selected as any);
      graph.getCells().forEach(cell => {
        if (!selectedArray.includes(cell)) {
          (cell as any).removeTools?.();
        }
      });
    });

    // Clicking blank canvas should clear selection and show background properties
    graph.on('blank:click', () => {
      graph.cleanSelection();
      setSelectedCell(null);
    });

    graph.on('scale', ({ sx }: { sx: number }) => {
      setZoom(sx);
    });

    // Double-click to edit text
    graph.on('cell:dblclick', ({ cell, e }) => {
      if (cell.isNode()) {
        const currentLabel = cell.getAttrs()?.label?.text || '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = String(currentLabel);
        const dblclickIsDark = document.documentElement.classList.contains('dark');
        input.style.cssText = `
          position: fixed;
          left: ${e.clientX}px;
          top: ${e.clientY}px;
          transform: translate(-50%, -50%);
          padding: 8px 12px;
          font-size: 14px;
          border: 2px solid #5F95FF;
          border-radius: 6px;
          outline: none;
          box-shadow: 0 4px 12px rgba(0,0,0,${dblclickIsDark ? '0.4' : '0.15'});
          z-index: 10000;
          min-width: 150px;
          text-align: center;
          background: ${dblclickIsDark ? '#1e293b' : 'white'};
          color: ${dblclickIsDark ? '#f1f5f9' : '#1e293b'};
        `;
        document.body.appendChild(input);
        input.focus();
        input.select();

        const handleBlur = () => {
          try {
            if (graph.hasCell(cell.id)) {
              cell.setAttrs({ label: { text: input.value } });
            }
          } finally {
            input.remove();
          }
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
          if (ev.key === 'Enter') {
            handleBlur();
          } else if (ev.key === 'Escape') {
            input.remove();
          }
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
      } else if (cell.isEdge()) {
        const edge = cell;
        const existing = edge.getLabels?.()[0]?.attrs?.text?.text || '';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = String(existing);
        const edgeIsDark = document.documentElement.classList.contains('dark');
        input.style.cssText = `
          position: fixed;
          left: ${e.clientX}px;
          top: ${e.clientY}px;
          transform: translate(-50%, -50%);
          padding: 8px 12px;
          font-size: 14px;
          border: 2px solid #5F95FF;
          border-radius: 6px;
          outline: none;
          box-shadow: 0 4px 12px rgba(0,0,0,${edgeIsDark ? '0.4' : '0.15'});
          z-index: 10000;
          min-width: 150px;
          text-align: center;
          background: ${edgeIsDark ? '#1e293b' : 'white'};
          color: ${edgeIsDark ? '#f1f5f9' : '#1e293b'};
        `;
        document.body.appendChild(input);
        input.focus();
        input.select();

        const applyLabel = () => {
          const text = input.value;
          if (text) {
            edge.setLabels([{
              attrs: {
                text: { text, fill: '#333', fontSize: 12, background: { fill: '#fff' } },
                rect: { fill: '#fff', stroke: '#ddd', strokeWidth: 1 },
              },
              position: 0.5,
            }]);
          } else {
            edge.setLabels([]);
          }
        };

        const handleBlur = () => {
          try {
            if (graph.hasCell(edge.id)) {
              applyLabel();
            }
          } finally {
            input.remove();
          }
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
          if (ev.key === 'Enter') {
            handleBlur();
          } else if (ev.key === 'Escape') {
            input.remove();
          }
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keydown', handleKeyDown);
      }
    });

    // Right-click context menu
    graph.on('cell:contextmenu', ({ cell, e }) => {
      e.preventDefault();
      showContextMenu(graph, cell, e.clientX, e.clientY, mode);
    });

    graphRef.current = graph;
    setGraph(graph);

    // Add some initial demo nodes
    addDemoNodes(graph);
  }, [setGraph, setSelectedCell, setZoom]);

  useEffect(() => {
    initGraph();

    return () => {
      if (graphRef.current) {
        graphRef.current.dispose();
        graphRef.current = null;
      }
    };
  }, [initGraph]);

  // Toggle grid visibility
  useEffect(() => {
    if (graphRef.current) {
      if (showGrid) {
        graphRef.current.showGrid();
      } else {
        graphRef.current.hideGrid();
      }
    }
  }, [showGrid]);

  // Apply grid size changes
  useEffect(() => {
    if (graphRef.current && gridSize) {
      graphRef.current.setGridSize(gridSize);
      graphRef.current.drawGrid({
        type: 'doubleMesh',
        args: [
          { color: '#e2e8f0', thickness: 1 },
          { color: '#cbd5e1', thickness: 1, factor: 4 },
        ],
      });
    }
  }, [gridSize]);

  return (
    <div className="relative flex-1 h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      
      {/* Auto-save restore prompt */}
      {showRestorePrompt && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 max-w-md">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💾</div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Restore previous work?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                You have unsaved work from a previous session. Would you like to restore it?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRestore}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Restore
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ZoomControls />
      <QuickActions />
      <div
        ref={minimapRef}
        className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      />
    </div>
  );
}

function addDemoNodes(graph: Graph) {
  // Port configuration helper
  const createPorts = () => ({
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 5,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 2,
            fill: '#fff',
          },
        },
      },
      bottom: {
        position: 'bottom',
        attrs: {
          circle: {
            r: 5,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 2,
            fill: '#fff',
          },
        },
      },
      left: {
        position: 'left',
        attrs: {
          circle: {
            r: 5,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 2,
            fill: '#fff',
          },
        },
      },
      right: {
        position: 'right',
        attrs: {
          circle: {
            r: 5,
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 2,
            fill: '#fff',
          },
        },
      },
    },
    items: [
      { group: 'top', id: 'top' },
      { group: 'bottom', id: 'bottom' },
      { group: 'left', id: 'left' },
      { group: 'right', id: 'right' },
    ],
  });

  // Start node
  const startNode = graph.addNode({
    id: 'start-node',
    x: 200,
    y: 80,
    width: 120,
    height: 60,
    shape: 'ellipse',
    attrs: {
      body: {
        fill: '#e8f5e9',
        stroke: '#4caf50',
        strokeWidth: 2,
      },
      label: {
        text: 'Start',
        fill: '#333333',
        fontSize: 14,
      },
    },
    ports: createPorts(),
  });

  // Process node
  const processNode = graph.addNode({
    id: 'process-node',
    x: 200,
    y: 220,
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        rx: 6,
        ry: 6,
      },
      label: {
        text: 'Process',
        fill: '#333333',
        fontSize: 14,
      },
    },
    ports: createPorts(),
  });

  // Decision node
  const decisionNode = graph.addNode({
    id: 'decision-node',
    x: 200,
    y: 360,
    width: 100,
    height: 100,
    shape: 'polygon',
    attrs: {
      body: {
        fill: '#fff3e0',
        stroke: '#ff9800',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
      },
      label: {
        text: 'Decision',
        fill: '#333333',
        fontSize: 12,
      },
    },
    ports: createPorts(),
  });

  // End node
  const endNode = graph.addNode({
    id: 'end-node',
    x: 200,
    y: 520,
    width: 120,
    height: 60,
    shape: 'ellipse',
    attrs: {
      body: {
        fill: '#ffebee',
        stroke: '#f44336',
        strokeWidth: 2,
      },
      label: {
        text: 'End',
        fill: '#333333',
        fontSize: 14,
      },
    },
    ports: createPorts(),
  });

  // Add edges connecting the nodes
  graph.addEdge({
    source: { cell: startNode.id, port: 'bottom' },
    target: { cell: processNode.id, port: 'top' },
    attrs: {
      line: {
        stroke: '#5F95FF',
        strokeWidth: 2,
        targetMarker: {
          name: 'block',
          width: 12,
          height: 8,
        },
      },
    },
    router: { name: 'manhattan' },
    connector: { name: 'rounded', args: { radius: 8 } },
  });

  graph.addEdge({
    source: { cell: processNode.id, port: 'bottom' },
    target: { cell: decisionNode.id, port: 'top' },
    attrs: {
      line: {
        stroke: '#5F95FF',
        strokeWidth: 2,
        targetMarker: {
          name: 'block',
          width: 12,
          height: 8,
        },
      },
    },
    router: { name: 'manhattan' },
    connector: { name: 'rounded', args: { radius: 8 } },
  });

  graph.addEdge({
    source: { cell: decisionNode.id, port: 'bottom' },
    target: { cell: endNode.id, port: 'top' },
    labels: [{ attrs: { label: { text: 'Yes' } }, position: 0.5 }],
    attrs: {
      line: {
        stroke: '#4caf50',
        strokeWidth: 2,
        targetMarker: {
          name: 'block',
          width: 12,
          height: 8,
        },
      },
    },
    router: { name: 'manhattan' },
    connector: { name: 'rounded', args: { radius: 8 } },
  });
}
