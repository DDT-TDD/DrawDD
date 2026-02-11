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
import {
  toggleCollapse,
  initializeCollapseIndicators,
  addCollapseIndicator,
  hasChildren
} from '../utils/collapse';
import { createQuickConnect, QuickConnectManager } from '../utils/quickConnect';

// Register custom shapes on module load
registerLogicGateShapes();

// Helper to get router/connector config based on style
type ConnectorStyle = 'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight';

function getEdgeRouting(style: ConnectorStyle): { router: any; connector: any } {
  // For mindmaps: use appropriate routing based on style
  switch (style) {
    case 'smooth':
      // Curved bezier lines (like XMind) - DEFAULT
      return { router: { name: 'normal' }, connector: { name: 'smooth' } };
    case 'orthogonal-rounded':
      // Rounded corners with simple routing
      return { router: { name: 'normal' }, connector: { name: 'rounded', args: { radius: 10 } } };
    case 'orthogonal-sharp':
      // Sharp corners with simple routing
      return { router: { name: 'normal' }, connector: { name: 'normal' } };
    case 'straight':
    default:
      // Default to smooth curved bezier lines
      return { router: { name: 'normal' }, connector: { name: 'smooth' } };
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
    mindmapLayoutMode,
    setCanvasBackground
  } = useGraph();
  const graphRef = useRef<Graph | null>(null);
  const lineColorRef = useRef<string>(getLineColor(colorScheme));
  const editCellTextHandlerRef = useRef<EventListener | null>(null);
  const quickConnectRef = useRef<QuickConnectManager | null>(null);

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
        showNodeSelectionBox: true,
        showEdgeSelectionBox: true,
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

    // Initialize collapse indicators for existing nodes
    initializeCollapseIndicators(graph);

    // Handle collapse/expand toggle from RichContentNode
    graph.on('node:collapse-toggle', ({ node, collapsed }: { node: X6Node; collapsed?: boolean }) => {
      // If the event includes the new collapsed state, use it directly
      // Otherwise, toggle based on current state (for legacy compatibility)
      const newCollapsed = collapsed !== undefined ? collapsed : !(node.getData()?.collapsed || false);
      toggleCollapse(graph, node, newCollapsed);
    });

    // Update indicators when edges change
    const updateIndicators = (node: X6Node) => {
      if (node && node.isNode() && node.getData()?.isMindmap) {
        // Use setTimeout to allow edge removal/addition to complete
        setTimeout(() => {
          if (graph.hasCell(node.id)) {
            addCollapseIndicator(node, hasChildren(graph, node));
          }
        }, 0);
      }
    };

    graph.on('edge:connected', ({ edge }) => {
      const source = edge.getSourceCell() as X6Node;
      if (source) updateIndicators(source);
    });

    graph.on('edge:removed', ({ edge }) => {
      const source = edge.getSourceCell() as X6Node;
      if (source) updateIndicators(source);
    });

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

          // Ensure parent node has ports for connection
          const parentPorts = (parentNode as any).getPorts?.() || [];
          if (parentPorts.length === 0) {
            (parentNode as any).prop?.('ports', FULL_PORTS_CONFIG);
          }

          const newNode = graph.addNode({
            shape: 'rect',
            x: isHorizontal ? pos.x + size.width + 100 : pos.x,
            y: isHorizontal ? pos.y : pos.y + size.height + 80,
            width: 120,
            height: 55,
            attrs: {
              body: { fill: insColors.fill, stroke: insColors.stroke, strokeWidth: 2, rx: 8, ry: 8 },
              label: { text: 'New Event', fill: insColors.text, fontSize: 14 },
            },
            data: { isTimeline: true, eventType: 'event' },
            ports: FULL_PORTS_CONFIG as any,
          });

          const sourcePort = isHorizontal ? 'right' : 'bottom';
          const targetPort = isHorizontal ? 'left' : 'top';

          graph.addEdge({
            source: { cell: parentNode.id, port: sourcePort },
            target: { cell: newNode.id, port: targetPort },
            attrs: { line: { stroke: insLineColor, strokeWidth: 2, targetMarker: { name: 'block', size: 6 } } },
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
          shape: 'rich-content-node',
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
          applyMindmapLayout(graph, dir, rootNode, mindmapLayoutMode);
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
          shape: 'rich-content-node',
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
            applyMindmapLayout(graph, dir, rootNode, mindmapLayoutMode);
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
                    text: { text: value, fill: '#333', fontSize: 12 },
                    rect: { fill: '#fff', stroke: '#ddd', strokeWidth: 1, ref: 'text', refWidth: '140%', refHeight: '140%', refX: '-20%', refY: '-20%' },
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
      // Use window.__drawdd_mode to get current mode (closure value would be stale)
      const currentMode = (window as any).__drawdd_mode || 'flowchart';
      showCellContextMenu(graph, cell, e.clientX, e.clientY, {
        mode: currentMode,
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
      // Use window.__drawdd_mode to get current mode (closure value would be stale)
      const currentMode = (window as any).__drawdd_mode || 'flowchart';
      showEmptyCanvasContextMenu(graph, x, y, e.clientX, e.clientY, {
        mode: currentMode,
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
    editCellTextHandlerRef.current = handleEditCellText as EventListener;
    window.addEventListener('drawdd:edit-cell-text', editCellTextHandlerRef.current);

    graphRef.current = graph;
    (window as any).__drawdd_graph = graph; // Expose graph for markdown conversion
    setGraph(graph);

    // Demo nodes disabled - start with empty canvas
    // addDemoNodes(graph, (window as any).__drawdd_colorScheme || 'default', lineColorRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setGraph, setSelectedCell, setZoom]);

  useEffect(() => {
    initGraph();

    return () => {
      // Clean up edit-cell-text event listener
      if (editCellTextHandlerRef.current) {
        window.removeEventListener('drawdd:edit-cell-text', editCellTextHandlerRef.current);
        editCellTextHandlerRef.current = null;
      }
      if (graphRef.current) {
        const graph = graphRef.current;
        graphRef.current = null;
        // Defer disposal to avoid "Attempted to synchronously unmount a root" React error
        setTimeout(() => {
          graph.dispose();
        }, 0);
      }
      delete (window as any).__drawdd_graph; // Clean up graph reference
    };
  }, [initGraph]);

  // Handle paste-as-children: when pasting text on a mindmap node, create child branches
  // Also handle system clipboard paste for text and images on canvas
  useEffect(() => {
    const handleBrowserPaste = async (e: ClipboardEvent) => {
      const graph = graphRef.current;
      if (!graph) return;

      // Only intercept if focus is on the canvas (not in a text input)
      if (document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.getAttribute('contenteditable') === 'true')) {
        return;
      }

      const currentMode = (window as any).__drawdd_mode;

      // === Mindmap multi-line paste (existing behavior) ===
      if (currentMode === 'mindmap') {
        const cells = graph.getSelectedCells();
        if (cells.length === 1 && cells[0].isNode()) {
          const clipboardText = e.clipboardData?.getData('text');
          if (clipboardText) {
            const lines = clipboardText.split(/[\r\n]+/).filter(line => line.trim());
            if (lines.length > 1 || clipboardText.includes('\t')) {
              e.preventDefault();
              const parentNode = cells[0] as X6Node;
              const mmSettings = mindmapSettingsRef.current;
              const dir = (window as any).__mindmapDirection || 'right';
              handlePasteAsChildren(
                graph, parentNode, dir,
                lineColorRef.current, colorScheme,
                mmSettings, clipboardText
              );
              return;
            }
          }
        }
      }

      // === Image paste from clipboard ===
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (!blob) continue;

            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              // Get center of current viewport
              const { x: cx, y: cy } = graph.getGraphArea().center;
              const img = new Image();
              img.onload = () => {
                // Scale image to max 400px wide/tall
                const maxDim = 400;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                  const scale = maxDim / Math.max(w, h);
                  w = Math.round(w * scale);
                  h = Math.round(h * scale);
                }
                graph.addNode({
                  x: cx - w / 2,
                  y: cy - h / 2,
                  width: w,
                  height: h,
                  attrs: {
                    body: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 },
                    image: { 'xlink:href': dataUrl, width: w, height: h },
                    label: { text: '' },
                  },
                  shape: 'image',
                });
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }

      // === Plain text paste onto canvas (create text node) ===
      const clipboardText = e.clipboardData?.getData('text');
      if (clipboardText && clipboardText.trim()) {
        // Only intercept if X6 clipboard plugin won't handle it
        // (X6 clipboard handles its own internal copy/paste via Ctrl+C/V on selected cells)
        const selected = graph.getSelectedCells();
        if (selected.length === 0) {
          e.preventDefault();
          const { x: cx, y: cy } = graph.getGraphArea().center;
          graph.addNode({
            x: cx - 60,
            y: cy - 20,
            width: 120,
            height: 40,
            attrs: {
              body: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 },
              label: { text: clipboardText.trim(), fontSize: 14, fill: '#333' },
            },
          });
        }
      }
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

  // Listen for layout mode changes (compact/standard) and re-apply layout
  useEffect(() => {
    const handleLayoutModeChanged = (e: Event) => {
      if (!graphRef.current || mode !== 'mindmap') return;
      const graph = graphRef.current;
      const dir = mindmapDirection;
      const layoutMode = (e as CustomEvent).detail?.mode ||
        (localStorage.getItem('drawdd-mindmap-layout-mode') as 'compact' | 'standard' | 'spacious') || 'standard';

      // Find root nodes (nodes with no incoming edges that are mindmap nodes)
      const nodes = graph.getNodes();
      const rootNodes = nodes.filter(node => {
        const data = (node as any).getData?.() || {};
        if (!data.isMindmap) return false;
        const incoming = graph.getIncomingEdges(node);
        return !incoming || incoming.length === 0;
      });

      // Apply layout to each root
      rootNodes.forEach(rootNode => {
        applyMindmapLayout(graph, dir, rootNode, layoutMode);
      });
    };

    window.addEventListener('drawdd:layout-mode-changed', handleLayoutModeChanged);
    return () => {
      window.removeEventListener('drawdd:layout-mode-changed', handleLayoutModeChanged);
    };
  }, [mode, mindmapDirection]);

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

  // Handle Drag & Drop Reparenting for Mindmaps
  useEffect(() => {
    if (!graphRef.current) return;
    const graph = graphRef.current;

    const handleNodeMouseUp = ({ node }: { node: any }) => {
      // Only for mindmap nodes in mindmap mode
      if (mode !== 'mindmap') return;
      const data = node.getData() || {};
      if (!data.isMindmap) return;

      // Find potential parent under the mouse (center of dragged node)
      const bbox = node.getBBox();
      const center = bbox.getCenter();

      // Get nodes at center point (exclude self)
      // We expect the user to drop the node ONTO another node
      const nodesUnderCursor = graph.getNodesFromPoint({ x: center.x, y: center.y });
      const targetNode = nodesUnderCursor.find((n: any) => n.id !== node.id && n.isNode());

      if (targetNode) {
        // Prevent cycles: check if target is a descendant of node
        let isDescendant = false;
        const checkDescendants = (n: any) => {
          if (n.id === targetNode.id) isDescendant = true;
          if (isDescendant) return;
          // Check outgoing edges recursively
          const children = graph.getOutgoingEdges(n)?.map((e: any) => e.getTargetCell()) || [];
          children.forEach((c: any) => c && c.isNode() && checkDescendants(c));
        }
        checkDescendants(node);

        if (isDescendant) {
          console.warn('Cannot reparent to a descendant');
          return;
        }

        // 1. Remove existing incoming edges (detach from old parent)
        const incomingEdges = graph.getIncomingEdges(node);
        // Only remove mindmap edges ideally, but for now remove all incoming
        if (incomingEdges) {
          incomingEdges.forEach((edge: any) => graph.removeEdge(edge));
        }

        // 2. Attach to new parent (targetNode)
        const routing = getEdgeRouting(mindmapConnectorStyle);

        graph.addEdge({
          source: targetNode,
          target: node,
          router: routing.router,
          connector: routing.connector,
          attrs: {
            line: {
              stroke: colorScheme === 'dark' ? '#cbd5e1' : '#333333',
              strokeWidth: mindmapStrokeWidth,
              targetMarker: mindmapShowArrows ? 'classic' : '',
            },
          },
          data: {
            isMindmap: true
          }
        });

        // 2.5 Update node level based on new parent's level
        const targetData = targetNode.getData() || {};
        const newLevel = (typeof targetData.level === 'number' ? targetData.level : 0) + 1;
        const oldLevel = data.level || 1;
        const levelDiff = newLevel - oldLevel;

        // Update the moved node's level
        node.setData({ ...data, level: newLevel });

        // Recursively update all descendant levels
        const updateDescendantLevels = (parentNode: any, diff: number) => {
          const outgoingEdges = graph.getOutgoingEdges(parentNode) || [];
          outgoingEdges.forEach((edge: any) => {
            const child = edge.getTargetCell();
            if (child && child.isNode()) {
              const childData = child.getData() || {};
              const childLevel = (typeof childData.level === 'number' ? childData.level : 1) + diff;
              child.setData({ ...childData, level: childLevel });
              updateDescendantLevels(child, diff);
            }
          });
        };
        updateDescendantLevels(node, levelDiff);

        // 3. Trigger Layout
        // Find root of the TARGET node (new family)
        let current = targetNode;
        const visited = new Set<string>();
        while (true) {
          if (visited.has(current.id)) break;
          visited.add(current.id);

          const inc = graph.getIncomingEdges(current);
          if (!inc || inc.length === 0) break;
          const src = inc[0].getSourceCell();
          if (src && src.isNode()) current = src as any;
          else break;
        }

        // Wait for edge to be added then layout
        setTimeout(() => {
          applyMindmapLayout(graph, mindmapDirection, current, mindmapLayoutMode);
        }, 50);
      }
    };

    graph.on('node:mouseup', handleNodeMouseUp);
    return () => {
      graph.off('node:mouseup', handleNodeMouseUp);
    };
  }, [graphRef.current, mode, mindmapDirection, mindmapLayoutMode, mindmapConnectorStyle, mindmapStrokeWidth, mindmapShowArrows, colorScheme]);

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

  // Quick Connect Mode - show hover arrows for flowcharts and timelines
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    if (mode === 'flowchart' || mode === 'timeline') {
      // Create Quick Connect if not already created
      if (!quickConnectRef.current) {
        quickConnectRef.current = createQuickConnect(graph, {
          colorScheme,
          defaultShape: 'rect',
        });
      }
      quickConnectRef.current.setEnabled(true);
      quickConnectRef.current.updateOptions({ colorScheme });
    } else {
      // Disable Quick Connect for mindmap mode
      if (quickConnectRef.current) {
        quickConnectRef.current.setEnabled(false);
      }
    }
    // Don't return cleanup - we only dispose on full unmount in the main cleanup effect
  }, [mode, colorScheme]);

  // Cleanup Quick Connect on unmount
  useEffect(() => {
    return () => {
      if (quickConnectRef.current) {
        quickConnectRef.current.dispose();
        quickConnectRef.current = null;
      }
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
