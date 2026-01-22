import { useEffect, useRef, useCallback } from 'react';
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
import { useAutoSave } from '../utils/autoSave';
import { registerLogicGateShapes } from '../config/logicGateShapes';
import { FULL_PORTS_CONFIG } from '../config/shapes';
import { getNextThemeColors, getLineColor } from '../utils/theme';
import { setNodeLabelWithAutoSize } from '../utils/text';
import { showCellContextMenu, showEmptyCanvasContextMenu, handlePasteAsChildren } from '../utils/contextMenu';
import { getMindmapLevelColor } from '../config/enhancedStyles';

// Register custom shapes on module load
registerLogicGateShapes();

// Helper to get router/connector config based on style
type ConnectorStyle = 'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight';

function getEdgeRouting(style: ConnectorStyle): { router: any; connector: any } {
  // For mindmaps: smooth/rounded use normal router, straight/ortho use manhattan for clean alignment
  switch (style) {
    case 'smooth':
      // Curved bezier lines (like XMind)
      return { router: { name: 'normal' }, connector: { name: 'smooth' } };
    case 'orthogonal-rounded':
      // 90° orthogonal with rounded corners (manhattan router)
      return { router: { name: 'manhattan' }, connector: { name: 'rounded', args: { radius: 10 } } };
    case 'orthogonal-sharp':
      // 90° orthogonal with sharp corners (manhattan router)
      return { router: { name: 'manhattan' }, connector: { name: 'normal' } };
    case 'straight':
    default:
      // Elbow lines (horizontal + vertical segments only) for clean mindmap alignment
      // Uses manhattan router to ensure 90° angles, with normal connector for sharp corners
      return { router: { name: 'manhattan' }, connector: { name: 'normal' } };
  }
}

// Mindmap order counter for keyboard shortcuts
let localMindmapOrderCounter = 1;

function getLocalMindmapOrder(): number {
  return localMindmapOrderCounter++;
}

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);
  const { 
    graph: contextGraph, 
    setGraph, 
    setSelectedCell, 
    setZoom, 
    showGrid, 
    mindmapDirection, 
    timelineDirection, 
    mode, 
    gridSize, 
    colorScheme,
    mindmapTheme,
    mindmapShowArrows,
    mindmapStrokeWidth,
    mindmapColorByLevel,
    mindmapBranchNumbering,
    mindmapSortOrder,
    mindmapConnectorStyle,
    setCanvasBackground
  } = useGraph();
  const graphRef = useRef<Graph | null>(null);
  const lineColorRef = useRef<string>(getLineColor(colorScheme));

  // Mindmap settings ref for use in callbacks
  const mindmapSettingsRef = useRef({
    showArrows: mindmapShowArrows,
    strokeWidth: mindmapStrokeWidth,
    colorByLevel: mindmapColorByLevel,
    theme: mindmapTheme,
    branchNumbering: mindmapBranchNumbering,
    sortOrder: mindmapSortOrder,
    connectorStyle: mindmapConnectorStyle
  });

  // Keep mindmap settings ref in sync
  useEffect(() => {
    mindmapSettingsRef.current = {
      showArrows: mindmapShowArrows,
      strokeWidth: mindmapStrokeWidth,
      colorByLevel: mindmapColorByLevel,
      theme: mindmapTheme,
      branchNumbering: mindmapBranchNumbering,
      sortOrder: mindmapSortOrder,
      connectorStyle: mindmapConnectorStyle
    };
    // Also expose to window for context menu
    (window as any).__drawdd_mindmapSettings = mindmapSettingsRef.current;
  }, [mindmapShowArrows, mindmapStrokeWidth, mindmapColorByLevel, mindmapTheme, mindmapBranchNumbering, mindmapSortOrder, mindmapConnectorStyle]);

  // Keep lineColorRef in sync with colorScheme
  useEffect(() => {
    lineColorRef.current = getLineColor(colorScheme);
    (window as any).__drawdd_lineColor = lineColorRef.current;
    (window as any).__drawdd_colorScheme = colorScheme;
  }, [colorScheme]);

  // Sync mindmap and timeline direction to window for keyboard shortcut access
  useEffect(() => {
    (window as any).__mindmapDirection = mindmapDirection;
    (window as any).__timelineDirection = timelineDirection;
    (window as any).__drawdd_mode = mode;
    return () => {
      delete (window as any).__mindmapDirection;
      delete (window as any).__timelineDirection;
      delete (window as any).__drawdd_mode;
      delete (window as any).__drawdd_lineColor;
      delete (window as any).__drawdd_colorScheme;
    };
  }, [mindmapDirection, timelineDirection, mode]);

  // Setup auto-save (saves automatically, no restore prompt)
  useAutoSave(contextGraph);

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

  // Helper to update node label with auto-resize
  const updateNodeLabel = (node: X6Node, text: string) => {
    setNodeLabelWithAutoSize(node, text);
  };

  // Multiline text editor helper (textarea-based)
  const openTextEditor = ({
    initial,
    clientX,
    clientY,
    onSubmit,
    onCancel,
  }: {
    initial: string;
    clientX: number;
    clientY: number;
    onSubmit: (value: string) => void;
    onCancel?: () => void;
  }) => {
    const textarea = document.createElement('textarea');
    textarea.value = initial;
    textarea.rows = Math.min(6, Math.max(2, initial.split('\n').length));
    textarea.spellcheck = true;

    const isDark = document.documentElement.classList.contains('dark');
    textarea.style.cssText = `
      position: fixed;
      left: ${clientX}px;
      top: ${clientY}px;
      transform: translate(-50%, -50%);
      padding: 10px 12px;
      font-size: 14px;
      line-height: 1.3;
      border: 2px solid #5F95FF;
      border-radius: 8px;
      outline: none;
      box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.4' : '0.15'});
      z-index: 10000;
      min-width: 200px;
      max-width: 440px;
      min-height: 64px;
      background: ${isDark ? '#1e293b' : 'white'};
      color: ${isDark ? '#f1f5f9' : '#1e293b'};
      resize: vertical;
      white-space: pre-wrap;
    `;

    let closed = false;
    const close = (shouldSubmit: boolean) => {
      if (closed) return;
      closed = true;
      if (shouldSubmit) {
        onSubmit(textarea.value);
      } else {
        onCancel?.();
      }
      textarea.remove();
    };

    textarea.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
        ev.preventDefault();
        close(true);
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        close(false);
      }
    });

    textarea.addEventListener('blur', () => close(true));

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
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
        router: 'normal', // Use normal router to allow manual vertex positioning
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
          // Check if we're in mindmap mode and respect settings
          const currentMode = (window as any).__drawdd_mode;
          const mmSettings = (window as any).__drawdd_mindmapSettings || { showArrows: false, strokeWidth: 1 };
          const isMindmap = currentMode === 'mindmap';
          
          const lineAttrs: Record<string, unknown> = {
            stroke: '#5F95FF',
            strokeWidth: isMindmap ? (mmSettings.strokeWidth || 1) : 2,
          };
          
          // Only add arrows for non-mindmap or if mindmap arrows enabled
          if (!isMindmap || mmSettings.showArrows) {
            lineAttrs.targetMarker = {
              name: 'block',
              width: 12,
              height: 8,
            };
          } else {
            lineAttrs.targetMarker = null;
          }
          
          return this.createEdge({
            attrs: { line: lineAttrs },
            router: isMindmap ? { name: 'normal' } : undefined,
            connector: isMindmap ? { name: 'smooth' } : undefined,
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
      const insLineColor = lineColorRef.current;
      const insColors = getNextThemeColors(colorScheme);
      const mmSettings = (window as any).__drawdd_mindmapSettings || mindmapSettingsRef.current;

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
              body: { fill: insColors.fill, stroke: insColors.stroke, strokeWidth: 2, rx: 4, ry: 4 },
              label: { text: 'New Event', fill: insColors.text, fontSize: 14 },
            },
          });

          graph.addEdge({
            source: parentNode,
            target: newNode,
            attrs: { line: { stroke: insLineColor, strokeWidth: 2 } },
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
        const level = (typeof parentData.level === 'number' ? parentData.level : 0) + 1;
        
        // Use level-based colors if enabled
        const mmColors = mmSettings.colorByLevel 
          ? getMindmapLevelColor(level, mmSettings.theme)
          : getNextThemeColors(colorScheme);

        const parentPos = parentNode.getPosition();
        const parentSize = parentNode.getSize();

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
              fill: mmColors.fill,
              stroke: mmColors.stroke,
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              text: 'New Topic',
              fill: mmColors.text,
              fontSize: 12,
            },
          },
          data: { isMindmap: true, level, mmOrder: getLocalMindmapOrder() },
          ports: FULL_PORTS_CONFIG as any,
        });

        // Create edge with mindmap defaults
        const edgeAttrs: any = {
          line: {
            stroke: lineColorRef.current,
            strokeWidth: mmSettings.strokeWidth || 1,
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

        const routing = getEdgeRouting(mmSettings.connectorStyle || 'straight');
        
        // Determine ports based on direction for proper alignment
        const sourcePort = dir === 'left' ? 'left' : dir === 'top' ? 'top' : dir === 'bottom' ? 'bottom' : 'right';
        const targetPort = dir === 'left' ? 'right' : dir === 'top' ? 'bottom' : dir === 'bottom' ? 'top' : 'left';
        
        graph.addEdge({
          source: { cell: parentNode.id, port: sourcePort },
          target: { cell: childNode.id, port: targetPort },
          attrs: edgeAttrs,
          router: routing.router,
          connector: routing.connector,
        });

        // Find root and apply layout
        const traverseUp = (node: typeof parentNode): typeof parentNode => {
          const incoming = graph.getIncomingEdges(node);
          if (!incoming || incoming.length === 0) return node;
          const source = graph.getCellById(incoming[0].getSourceCellId() || '');
          return source?.isNode() ? traverseUp(source) : node;
        };
        const rootNode = traverseUp(parentNode);
        
        // Use setTimeout to ensure all DOM updates settle before layout recalculation
        setTimeout(() => {
          applyMindmapLayout(graph, dir, rootNode);
        }, 0);

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
        
        const mmSettings = (window as any).__drawdd_mindmapSettings || mindmapSettingsRef.current;

        // Find incoming edges to find parent
        const incomingEdges = graph.getIncomingEdges(currentNode);
        const parentEdge = incomingEdges?.[0];
        const parentNode = parentEdge ? graph.getCellById(parentEdge.getSourceCellId() || '') : null;

        // Get direction and theme from context
        const dir = (window as any).__mindmapDirection || 'right';

        const currentPos = currentNode.getPosition();
        const level = typeof currentData.level === 'number' ? currentData.level : 1;
        
        // Use level-based colors if enabled
        const enterColors = mmSettings.colorByLevel 
          ? getMindmapLevelColor(level, mmSettings.theme)
          : getNextThemeColors(colorScheme);

        // Create sibling near current - layout will position it
        const siblingNode = graph.addNode({
          x: currentPos.x,
          y: currentPos.y + currentSize.height + 60,
          width: currentSize.width,
          height: currentSize.height,
          attrs: {
            body: {
              fill: enterColors.fill,
              stroke: enterColors.stroke,
              strokeWidth: 2,
              rx: 6,
              ry: 6,
            },
            label: {
              text: 'New Topic',
              fill: enterColors.text,
              fontSize: 12,
            },
          },
          data: { isMindmap: true, level, mmOrder: getLocalMindmapOrder() },
          ports: FULL_PORTS_CONFIG as any,
        });

        // Connect to same parent if exists
        if (parentNode && parentNode.isNode()) {
          // Create edge with new mindmap defaults (thinner lines, optional arrows)
          const edgeAttrs: any = {
            line: {
              stroke: lineColorRef.current,
              strokeWidth: mmSettings.strokeWidth || 1,
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

          const routing = getEdgeRouting(mmSettings.connectorStyle || 'straight');

          // Determine ports based on direction for proper alignment
          const sourcePort = dir === 'left' ? 'left' : dir === 'top' ? 'top' : dir === 'bottom' ? 'bottom' : 'right';
          const targetPort = dir === 'left' ? 'right' : dir === 'top' ? 'bottom' : dir === 'bottom' ? 'top' : 'left';

          graph.addEdge({
            source: { cell: parentNode.id, port: sourcePort },
            target: { cell: siblingNode.id, port: targetPort },
            attrs: edgeAttrs,
            router: routing.router,
            connector: routing.connector,
          });

          // Find root node by traversing up
          const traverseUp = (node: typeof parentNode): typeof parentNode => {
            const incoming = graph.getIncomingEdges(node);
            if (!incoming || incoming.length === 0) return node;
            const source = graph.getCellById(incoming[0].getSourceCellId() || '');
            return source?.isNode() ? traverseUp(source) : node;
          };
          const rootNode = traverseUp(parentNode);
          
          // Use setTimeout to ensure all DOM updates settle before layout recalculation
          setTimeout(() => {
            applyMindmapLayout(graph, dir, rootNode);
          }, 0);
        }

        // Keep ONLY current node selected (clear selection first)
        graph.unselect(siblingNode);
        graph.cleanSelection();
        graph.select(currentNode);
      }
      return false;
    });

    // Arrow keys for navigation
    // Keyboard Nudging
    const NUDGE_STEP = 10;
    const NUDGE_FINE_STEP = 1;

    // Up
    graph.bindKey(['up', 'arrowup'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(0, -NUDGE_STEP));
      return false;
    });
    graph.bindKey(['shift+up', 'shift+arrowup'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(0, -NUDGE_FINE_STEP));
      return false;
    });

    // Down
    graph.bindKey(['down', 'arrowdown'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(0, NUDGE_STEP));
      return false;
    });
    graph.bindKey(['shift+down', 'shift+arrowdown'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(0, NUDGE_FINE_STEP));
      return false;
    });

    // Left
    graph.bindKey(['left', 'arrowleft'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(-NUDGE_STEP, 0));
      return false;
    });
    graph.bindKey(['shift+left', 'shift+arrowleft'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(-NUDGE_FINE_STEP, 0));
      return false;
    });

    // Right
    graph.bindKey(['right', 'arrowright'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(NUDGE_STEP, 0));
      return false;
    });
    graph.bindKey(['shift+right', 'shift+arrowright'], (e) => {
      e.preventDefault();
      const cells = graph.getSelectedCells();
      if (cells.length > 0) cells.forEach(c => c.translate(NUDGE_FINE_STEP, 0));
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

        // Add draggable tools to edges when selected
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
            {
              name: 'vertices',
              args: {
                attrs: {
                  fill: '#1976d2',
                  stroke: '#fff',
                  'stroke-width': 2,
                  r: 5,
                  cursor: 'move',
                },
                // Allow adding vertices by clicking on the edge
                stopPropagation: false,
              }
            },
            {
              name: 'segments',
              args: {
                attrs: {
                  fill: '#1976d2',
                  stroke: '#fff',
                  'stroke-width': 2,
                  width: 10,
                  height: 10,
                  cursor: 'pointer',
                },
                // Show segment manipulation handles
                stopPropagation: false,
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

    // Double-click to edit text (multiline supported)
    graph.on('cell:dblclick', ({ cell, e }) => {
      if (cell.isNode()) {
        const currentLabel = cell.getAttrs()?.label?.text || '';
        openTextEditor({
          initial: String(currentLabel),
          clientX: e.clientX,
          clientY: e.clientY,
          onSubmit: (value) => {
            if (graph.hasCell(cell.id)) {
              updateNodeLabel(cell as X6Node, value || '');
            }
          },
        });
      } else if (cell.isEdge()) {
        const edge = cell;
        const existing = edge.getLabels?.()[0]?.attrs?.text?.text || '';
        openTextEditor({
          initial: String(existing),
          clientX: e.clientX,
          clientY: e.clientY,
          onSubmit: (value) => {
            if (graph.hasCell(edge.id)) {
              if (value) {
                edge.setLabels([{
                  attrs: {
                    text: { text: value, fill: '#333', fontSize: 12, lineHeight: 1.3, whiteSpace: 'pre-wrap' },
                    rect: { fill: '#fff', stroke: '#ddd', strokeWidth: 1 },
                  },
                  position: 0.5,
                }]);
              } else {
                edge.setLabels([]);
              }
            }
          },
        });
      }
    });

    // Double-click on blank canvas to add a new text node (transparent - no background)
    graph.on('blank:dblclick', ({ e, x, y }) => {
      const textNode = graph.addNode({
        x: x - 60,
        y: y - 20,
        width: 120,
        height: 40,
        attrs: {
          body: {
            fill: 'transparent',
            stroke: 'transparent',
            strokeWidth: 0
          },
          label: { text: 'Text', fontSize: 14, fill: '#333333' },
        },
        ports: FULL_PORTS_CONFIG as any,
      });

      // Don't apply theme to text nodes - they should stay transparent
      setNodeLabelWithAutoSize(textNode as X6Node, 'Text');
      const size = textNode.size();
      textNode.position(x - size.width / 2, y - size.height / 2);

      graph.cleanSelection();
      graph.select(textNode);

      openTextEditor({
        initial: 'Text',
        clientX: e.clientX,
        clientY: e.clientY,
        onSubmit: (value) => updateNodeLabel(textNode as X6Node, value || ''),
      });
    });

    // Right-click context menu for cells
    graph.on('cell:contextmenu', ({ cell, e }) => {
      e.preventDefault();
      const mmSettings = (window as any).__drawdd_mindmapSettings || {
        showArrows: false,
        strokeWidth: 1,
        colorByLevel: false,
        theme: 'blue'
      };
      showCellContextMenu(graph, cell, e.clientX, e.clientY, {
        mode,
        mindmapSettings: mmSettings
      });
    });

    // Right-click context menu for empty canvas
    graph.on('blank:contextmenu', ({ e, x, y }) => {
      e.preventDefault();
      const mmSettings = (window as any).__drawdd_mindmapSettings || {
        showArrows: false,
        strokeWidth: 1,
        colorByLevel: false,
        theme: 'blue'
      };
      showEmptyCanvasContextMenu(graph, x, y, e.clientX, e.clientY, {
        mode,
        mindmapSettings: mmSettings
      });
    });

    // Listen for edit-cell-text event from context menu
    const handleEditCellText = (event: CustomEvent) => {
      const { cell } = event.detail;
      if (cell && cell.isNode()) {
        const pos = cell.getBBox();
        const currentLabel = cell.getAttrs()?.label?.text || '';
        const containerRect = containerRef.current?.getBoundingClientRect();
        const graphPos = graph.localToGraph({ x: pos.x + pos.width / 2, y: pos.y + pos.height / 2 });
        
        openTextEditor({
          initial: String(currentLabel),
          clientX: (containerRect?.left || 0) + graphPos.x,
          clientY: (containerRect?.top || 0) + graphPos.y,
          onSubmit: (value) => {
            if (graph.hasCell(cell.id)) {
              updateNodeLabel(cell as X6Node, value || '');
            }
          },
        });
      }
    };
    window.addEventListener('drawdd:edit-cell-text', handleEditCellText as EventListener);

    graphRef.current = graph;
    setGraph(graph);

    // Add some initial demo nodes (theme-aware) - uses colorScheme from window global
    addDemoNodes(graph, (window as any).__drawdd_colorScheme || 'default', lineColorRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Handle paste-as-children: when pasting text on a mindmap node, create child branches
  useEffect(() => {
    const handleBrowserPaste = (e: ClipboardEvent) => {
      const currentMode = (window as any).__drawdd_mode;
      const graph = graphRef.current;
      if (!graph || currentMode !== 'mindmap') return;
      
      // Only intercept if focus is on the canvas (not in a text input)
      if (document.activeElement && 
          (document.activeElement.tagName === 'INPUT' || 
           document.activeElement.tagName === 'TEXTAREA' ||
           document.activeElement.getAttribute('contenteditable') === 'true')) {
        return;
      }
      
      const cells = graph.getSelectedCells();
      if (cells.length !== 1 || !cells[0].isNode()) return;
      
      const clipboardText = e.clipboardData?.getData('text');
      if (!clipboardText) return;
      
      // Check if clipboard contains multi-line text or tab-separated values
      const lines = clipboardText.split(/[\r\n]+/).filter(line => line.trim());
      if (lines.length <= 1 && !clipboardText.includes('\t')) {
        // Single line without tabs - let default paste handle it
        return;
      }
      
      // Prevent default paste behavior
      e.preventDefault();
      
      const parentNode = cells[0] as X6Node;
      const mmSettings = mindmapSettingsRef.current;
      const dir = (window as any).__mindmapDirection || 'right';
      
      handlePasteAsChildren(
        graph,
        parentNode,
        dir,
        lineColorRef.current,
        colorScheme,
        mmSettings,
        clipboardText
      );
    };
    
    document.addEventListener('paste', handleBrowserPaste);
    return () => {
      document.removeEventListener('paste', handleBrowserPaste);
    };
  }, [colorScheme]);

  // Handle background color changes from context menu
  useEffect(() => {
    const handleSetBackground = (e: CustomEvent<{ color: string }>) => {
      if (e.detail?.color && graphRef.current) {
        const newBg = { type: 'color' as const, color: e.detail.color };
        setCanvasBackground(newBg);
        // Also update the visual graph background immediately
        graphRef.current.drawBackground({ color: e.detail.color });
      }
    };
    
    window.addEventListener('drawdd:set-background', handleSetBackground as EventListener);
    return () => {
      window.removeEventListener('drawdd:set-background', handleSetBackground as EventListener);
    };
  }, [setCanvasBackground]);

  // Apply connector style changes to existing mindmap edges
  useEffect(() => {
    if (!graphRef.current) return;
    const graph = graphRef.current;
    const edges = graph.getEdges();
    
    edges.forEach(edge => {
      // Only update mindmap edges (check if source/target have isMindmap data)
      const sourceNode = graph.getCellById(edge.getSourceCellId() || '');
      const sourceData = sourceNode?.isNode() ? (sourceNode as any).getData?.() : null;
      if (sourceData?.isMindmap) {
        // Update router and connector based on style
        const routing = getEdgeRouting(mindmapConnectorStyle);
        edge.setRouter(routing.router);
        edge.setConnector(routing.connector);
      }
    });
  }, [mindmapConnectorStyle]);

  // Apply arrow visibility changes to existing mindmap edges
  useEffect(() => {
    if (!graphRef.current) return;
    const graph = graphRef.current;
    const edges = graph.getEdges();
    
    edges.forEach(edge => {
      const sourceNode = graph.getCellById(edge.getSourceCellId() || '');
      const sourceData = sourceNode?.isNode() ? (sourceNode as any).getData?.() : null;
      if (sourceData?.isMindmap) {
        const currentAttrs = edge.getAttrs() || {};
        const lineAttrs = { ...(currentAttrs.line || {}) };
        
        if (mindmapShowArrows) {
          lineAttrs.targetMarker = { name: 'block', width: 8, height: 6 };
        } else {
          // Use empty string to properly remove the marker
          lineAttrs.targetMarker = '';
          lineAttrs.sourceMarker = '';
        }
        
        edge.setAttrs({ line: lineAttrs });
      }
    });
  }, [mindmapShowArrows]);

  // Apply stroke width changes to existing mindmap edges
  useEffect(() => {
    if (!graphRef.current) return;
    const graph = graphRef.current;
    const edges = graph.getEdges();
    
    edges.forEach(edge => {
      const sourceNode = graph.getCellById(edge.getSourceCellId() || '');
      const sourceData = sourceNode?.isNode() ? (sourceNode as any).getData?.() : null;
      if (sourceData?.isMindmap) {
        edge.setAttrs({
          line: {
            strokeWidth: mindmapStrokeWidth
          }
        });
      }
    });
  }, [mindmapStrokeWidth]);

  // Handle clean exit - mark session as cleanly closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('drawdd-session-active');
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden, could be closing
        localStorage.setItem('drawdd-unclean-exit', 'true');
      } else {
        // Page is visible again, clear unclean exit flag
        localStorage.removeItem('drawdd-unclean-exit');
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Set unclean exit flag on mount (will be cleared if page closes cleanly)
    localStorage.setItem('drawdd-unclean-exit', 'true');
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clean exit - remove the flag
      localStorage.removeItem('drawdd-unclean-exit');
      localStorage.removeItem('drawdd-session-active');
    };
  }, []);

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

      <ZoomControls />
      <QuickActions />
      <div
        ref={minimapRef}
        className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      />
    </div>
  );
}

function addDemoNodes(graph: Graph, colorScheme: string, lineColor: string) {
  // Get themed colors for nodes
  const startColors = getNextThemeColors(colorScheme);
  const processColors = getNextThemeColors(colorScheme);
  const decisionColors = getNextThemeColors(colorScheme);
  const endColors = getNextThemeColors(colorScheme);

  // Port configuration helper
  const createPorts = () => ({
    groups: {
      top: {
        position: 'top',
        attrs: {
          circle: {
            r: 5,
            magnet: true,
            stroke: lineColor,
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
            stroke: lineColor,
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
            stroke: lineColor,
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
            stroke: lineColor,
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
        fill: startColors.fill,
        stroke: startColors.stroke,
        strokeWidth: 2,
      },
      label: {
        text: 'Start',
        fill: startColors.text,
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
        fill: processColors.fill,
        stroke: processColors.stroke,
        strokeWidth: 2,
        rx: 6,
        ry: 6,
      },
      label: {
        text: 'Process',
        fill: processColors.text,
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
        fill: decisionColors.fill,
        stroke: decisionColors.stroke,
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
      },
      label: {
        text: 'Decision',
        fill: decisionColors.text,
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
        fill: endColors.fill,
        stroke: endColors.stroke,
        strokeWidth: 2,
      },
      label: {
        text: 'End',
        fill: endColors.text,
        fontSize: 14,
      },
    },
    ports: createPorts(),
  });

  // Add edges connecting the nodes (using theme line color)
  graph.addEdge({
    source: { cell: startNode.id, port: 'bottom' },
    target: { cell: processNode.id, port: 'top' },
    attrs: {
      line: {
        stroke: lineColor,
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
        stroke: lineColor,
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
        stroke: lineColor,
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
