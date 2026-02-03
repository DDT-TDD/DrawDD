/**
 * Smart Connector Routing for Flowcharts
 * Provides intelligent routing algorithms to avoid overlapping nodes
 */

import type { Graph, Edge, Node } from '@antv/x6';

export type RouterType = 'manhattan' | 'orthogonal' | 'metro' | 'smooth' | 'straight';
export type ConnectorType = 'rounded' | 'smooth' | 'jumpover' | 'normal';

export interface SmartRoutingOptions {
  router: RouterType;
  connector: ConnectorType;
  cornerRadius: number;
  padding: number;
  avoidNodes: boolean;
  animate: boolean;
}

const DEFAULT_OPTIONS: SmartRoutingOptions = {
  router: 'manhattan',
  connector: 'rounded',
  cornerRadius: 10,
  padding: 20,
  avoidNodes: true,
  animate: false,
};

/**
 * Get router configuration for edge
 */
export function getRouterConfig(type: RouterType, options: Partial<SmartRoutingOptions> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  switch (type) {
    case 'manhattan':
      // Orthogonal routing that avoids obstacles
      return {
        name: 'manhattan',
        args: {
          padding: opts.padding,
          startDirections: ['top', 'right', 'bottom', 'left'],
          endDirections: ['top', 'right', 'bottom', 'left'],
        },
      };
    case 'orthogonal':
      // Simple orthogonal routing (right angles only)
      return {
        name: 'orth',
        args: {
          padding: opts.padding,
        },
      };
    case 'metro':
      // Metro-style routing (diagonal + orthogonal)
      return {
        name: 'metro',
        args: {},
      };
    case 'smooth':
      // Curved bezier routing
      return {
        name: 'normal',
      };
    case 'straight':
    default:
      return {
        name: 'normal',
      };
  }
}

/**
 * Get connector configuration for edge
 */
export function getConnectorConfig(type: ConnectorType, options: Partial<SmartRoutingOptions> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  switch (type) {
    case 'rounded':
      return {
        name: 'rounded',
        args: {
          radius: opts.cornerRadius,
        },
      };
    case 'smooth':
      return {
        name: 'smooth',
      };
    case 'jumpover':
      return {
        name: 'jumpover',
        args: {
          size: 6,
          type: 'arc',
        },
      };
    case 'normal':
    default:
      return {
        name: 'normal',
      };
  }
}

/**
 * Apply smart routing to a single edge
 */
export function applySmartRouting(
  edge: Edge,
  options: Partial<SmartRoutingOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const router = getRouterConfig(opts.router, opts);
  const connector = getConnectorConfig(opts.connector, opts);

  edge.setRouter(router);
  edge.setConnector(connector);
}

/**
 * Apply smart routing to all edges in graph
 */
export function applySmartRoutingToAll(
  graph: Graph,
  options: Partial<SmartRoutingOptions> = {}
): void {
  const edges = graph.getEdges();
  edges.forEach(edge => {
    applySmartRouting(edge, options);
  });
}

/**
 * Apply smart routing to selected edges
 */
export function applySmartRoutingToSelected(
  graph: Graph,
  options: Partial<SmartRoutingOptions> = {}
): void {
  const selectedCells = graph.getSelectedCells();
  const edges = selectedCells.filter(cell => cell.isEdge()) as Edge[];
  
  edges.forEach(edge => {
    applySmartRouting(edge, options);
  });
}

/**
 * Edge style presets for quick application
 */
export const EDGE_STYLE_PRESETS = {
  flowchart: {
    router: 'manhattan' as RouterType,
    connector: 'rounded' as ConnectorType,
    cornerRadius: 10,
    padding: 20,
  },
  mindmap: {
    router: 'smooth' as RouterType,
    connector: 'smooth' as ConnectorType,
    cornerRadius: 0,
    padding: 0,
  },
  simple: {
    router: 'orthogonal' as RouterType,
    connector: 'normal' as ConnectorType,
    cornerRadius: 0,
    padding: 10,
  },
  metro: {
    router: 'metro' as RouterType,
    connector: 'rounded' as ConnectorType,
    cornerRadius: 8,
    padding: 10,
  },
  curved: {
    router: 'smooth' as RouterType,
    connector: 'smooth' as ConnectorType,
    cornerRadius: 0,
    padding: 0,
  },
  direct: {
    router: 'straight' as RouterType,
    connector: 'normal' as ConnectorType,
    cornerRadius: 0,
    padding: 0,
  },
};

/**
 * Apply a preset style to all edges
 */
export function applyEdgePreset(
  graph: Graph,
  presetName: keyof typeof EDGE_STYLE_PRESETS
): void {
  const preset = EDGE_STYLE_PRESETS[presetName];
  applySmartRoutingToAll(graph, preset);
}

/**
 * Auto-adjust edge waypoints to avoid nodes
 * This is a helper function for manual waypoint optimization
 */
export function optimizeEdgeWaypoints(graph: Graph, edge: Edge): void {
  const vertices = edge.getVertices();
  const nodes = graph.getNodes();
  
  if (vertices.length === 0) return;

  // Get all node bounding boxes
  const nodeBboxes = nodes
    .filter(n => n.id !== edge.getSourceCellId() && n.id !== edge.getTargetCellId())
    .map(n => n.getBBox());

  // Check each vertex and adjust if inside a node
  const newVertices = vertices.map(v => {
    for (const bbox of nodeBboxes) {
      if (v.x >= bbox.x && v.x <= bbox.x + bbox.width &&
          v.y >= bbox.y && v.y <= bbox.y + bbox.height) {
        // Vertex is inside a node, move it outside
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        
        // Move in the direction away from center
        const dx = v.x - centerX;
        const dy = v.y - centerY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          // Move horizontally
          return {
            x: dx > 0 ? bbox.x + bbox.width + 10 : bbox.x - 10,
            y: v.y,
          };
        } else {
          // Move vertically
          return {
            x: v.x,
            y: dy > 0 ? bbox.y + bbox.height + 10 : bbox.y - 10,
          };
        }
      }
    }
    return v;
  });

  edge.setVertices(newVertices);
}

/**
 * Setup smart routing for new edges
 */
export function setupSmartRoutingDefaults(graph: Graph, options: Partial<SmartRoutingOptions> = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Apply smart routing to newly created edges
  graph.on('edge:added', ({ edge }) => {
    // Check if it's a flowchart edge (not mindmap)
    const sourceNode = edge.getSourceCell();
    const sourceData = sourceNode?.getData?.() || {};
    
    // Only apply to non-mindmap edges
    if (!sourceData.isMindmap) {
      applySmartRouting(edge, opts);
    }
  });
}

/**
 * Create a well-routed edge between two nodes
 */
export function createSmartEdge(
  graph: Graph,
  sourceId: string,
  targetId: string,
  options: Partial<SmartRoutingOptions> = {}
): Edge | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const router = getRouterConfig(opts.router, opts);
  const connector = getConnectorConfig(opts.connector, opts);

  const sourceNode = graph.getCellById(sourceId);
  const targetNode = graph.getCellById(targetId);
  
  if (!sourceNode || !targetNode) return null;

  const edge = graph.addEdge({
    source: { cell: sourceId },
    target: { cell: targetId },
    router,
    connector,
    attrs: {
      line: {
        stroke: '#5F95FF',
        strokeWidth: 2,
        targetMarker: {
          name: 'block',
          size: 8,
        },
      },
    },
  });

  return edge;
}
