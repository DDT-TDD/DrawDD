/**
 * Flowchart Auto-Layout System
 * Provides automatic layout algorithms for flowchart diagrams
 */

import type { Graph, Node, Edge } from '@antv/x6';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL'; // Top-Bottom, Bottom-Top, Left-Right, Right-Left
export type LayoutType = 'hierarchical' | 'tree' | 'grid' | 'force';

export interface LayoutOptions {
  direction: LayoutDirection;
  type: LayoutType;
  nodeSpacing: number;    // Horizontal spacing between nodes
  rankSpacing: number;    // Vertical spacing between ranks/levels
  padding: number;        // Padding around the layout
  animate: boolean;       // Animate the transition
}

const DEFAULT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  type: 'hierarchical',
  nodeSpacing: 80,
  rankSpacing: 100,
  padding: 50,
  animate: true,
};

interface NodeInfo {
  node: Node;
  rank: number;          // Level in the hierarchy
  order: number;         // Order within the rank
  x: number;
  y: number;
  width: number;
  height: number;
  children: string[];    // Child node IDs
  parents: string[];     // Parent node IDs
}

/**
 * Build a graph structure from nodes and edges
 */
function buildGraphStructure(graph: Graph): Map<string, NodeInfo> {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();
  const nodeMap = new Map<string, NodeInfo>();

  // Initialize node info
  nodes.forEach(node => {
    const size = node.getSize();
    nodeMap.set(node.id, {
      node,
      rank: -1,
      order: 0,
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      children: [],
      parents: [],
    });
  });

  // Build parent-child relationships from edges
  edges.forEach(edge => {
    const sourceId = edge.getSourceCellId();
    const targetId = edge.getTargetCellId();
    
    if (sourceId && targetId && nodeMap.has(sourceId) && nodeMap.has(targetId)) {
      const sourceInfo = nodeMap.get(sourceId)!;
      const targetInfo = nodeMap.get(targetId)!;
      
      if (!sourceInfo.children.includes(targetId)) {
        sourceInfo.children.push(targetId);
      }
      if (!targetInfo.parents.includes(sourceId)) {
        targetInfo.parents.push(sourceId);
      }
    }
  });

  return nodeMap;
}

/**
 * Find root nodes (nodes with no parents)
 */
function findRoots(nodeMap: Map<string, NodeInfo>): string[] {
  const roots: string[] = [];
  nodeMap.forEach((info, id) => {
    if (info.parents.length === 0) {
      roots.push(id);
    }
  });
  return roots;
}

/**
 * Assign ranks (levels) to nodes using BFS
 */
function assignRanks(nodeMap: Map<string, NodeInfo>, roots: string[]): number {
  const visited = new Set<string>();
  const queue: { id: string; rank: number }[] = [];
  let maxRank = 0;

  // Start with root nodes at rank 0
  roots.forEach(id => {
    queue.push({ id, rank: 0 });
  });

  while (queue.length > 0) {
    const { id, rank } = queue.shift()!;
    
    if (visited.has(id)) {
      // Update rank if we found a longer path
      const info = nodeMap.get(id)!;
      if (rank > info.rank) {
        info.rank = rank;
        maxRank = Math.max(maxRank, rank);
      }
      continue;
    }

    visited.add(id);
    const info = nodeMap.get(id)!;
    info.rank = rank;
    maxRank = Math.max(maxRank, rank);

    // Add children to queue
    info.children.forEach(childId => {
      queue.push({ id: childId, rank: rank + 1 });
    });
  }

  // Handle disconnected nodes (no parents or children)
  nodeMap.forEach((info, id) => {
    if (!visited.has(id)) {
      info.rank = 0; // Put at top level
      visited.add(id);
    }
  });

  return maxRank;
}

/**
 * Group nodes by rank
 */
function groupByRank(nodeMap: Map<string, NodeInfo>): Map<number, string[]> {
  const rankGroups = new Map<number, string[]>();
  
  nodeMap.forEach((info, id) => {
    if (!rankGroups.has(info.rank)) {
      rankGroups.set(info.rank, []);
    }
    rankGroups.get(info.rank)!.push(id);
  });

  return rankGroups;
}

/**
 * Order nodes within each rank to minimize edge crossings
 * Uses a simple barycenter heuristic
 */
function orderNodesInRanks(nodeMap: Map<string, NodeInfo>, rankGroups: Map<number, string[]>): void {
  const maxIterations = 10;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Forward pass (top to bottom)
    const ranks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
    
    for (let r = 1; r < ranks.length; r++) {
      const currentRank = rankGroups.get(ranks[r])!;
      const prevRank = rankGroups.get(ranks[r - 1])!;
      
      // Calculate barycenter for each node in current rank
      const barycenters: { id: string; bc: number }[] = currentRank.map(id => {
        const info = nodeMap.get(id)!;
        const parentPositions = info.parents
          .filter(pid => prevRank.includes(pid))
          .map(pid => prevRank.indexOf(pid));
        
        const bc = parentPositions.length > 0
          ? parentPositions.reduce((a, b) => a + b, 0) / parentPositions.length
          : currentRank.indexOf(id);
        
        return { id, bc };
      });
      
      // Sort by barycenter
      barycenters.sort((a, b) => a.bc - b.bc);
      rankGroups.set(ranks[r], barycenters.map(b => b.id));
    }
    
    // Backward pass (bottom to top)
    for (let r = ranks.length - 2; r >= 0; r--) {
      const currentRank = rankGroups.get(ranks[r])!;
      const nextRank = rankGroups.get(ranks[r + 1])!;
      
      const barycenters: { id: string; bc: number }[] = currentRank.map(id => {
        const info = nodeMap.get(id)!;
        const childPositions = info.children
          .filter(cid => nextRank.includes(cid))
          .map(cid => nextRank.indexOf(cid));
        
        const bc = childPositions.length > 0
          ? childPositions.reduce((a, b) => a + b, 0) / childPositions.length
          : currentRank.indexOf(id);
        
        return { id, bc };
      });
      
      barycenters.sort((a, b) => a.bc - b.bc);
      rankGroups.set(ranks[r], barycenters.map(b => b.id));
    }
  }

  // Update order in nodeMap
  rankGroups.forEach((nodeIds, _rank) => {
    nodeIds.forEach((id, order) => {
      nodeMap.get(id)!.order = order;
    });
  });
}

/**
 * Calculate positions for hierarchical layout
 */
function calculateHierarchicalPositions(
  nodeMap: Map<string, NodeInfo>,
  rankGroups: Map<number, string[]>,
  options: LayoutOptions
): void {
  const { direction, nodeSpacing, rankSpacing, padding } = options;
  const isVertical = direction === 'TB' || direction === 'BT';
  const isReversed = direction === 'BT' || direction === 'RL';

  const ranks = Array.from(rankGroups.keys()).sort((a, b) => 
    isReversed ? b - a : a - b
  );

  let currentMainAxisPos = padding;

  ranks.forEach(rank => {
    const nodesInRank = rankGroups.get(rank)!;
    
    // Calculate total width/height of this rank
    let totalSize = 0;
    let maxCrossSize = 0;
    
    nodesInRank.forEach(id => {
      const info = nodeMap.get(id)!;
      const mainSize = isVertical ? info.width : info.height;
      const crossSize = isVertical ? info.height : info.width;
      totalSize += mainSize;
      maxCrossSize = Math.max(maxCrossSize, crossSize);
    });
    
    totalSize += (nodesInRank.length - 1) * nodeSpacing;
    
    // Center the nodes
    let currentCrossAxisPos = padding - totalSize / 2;
    
    nodesInRank.forEach(id => {
      const info = nodeMap.get(id)!;
      const mainSize = isVertical ? info.width : info.height;
      
      if (isVertical) {
        info.x = currentCrossAxisPos + mainSize / 2;
        info.y = currentMainAxisPos + maxCrossSize / 2;
      } else {
        info.x = currentMainAxisPos + maxCrossSize / 2;
        info.y = currentCrossAxisPos + mainSize / 2;
      }
      
      currentCrossAxisPos += mainSize + nodeSpacing;
    });
    
    currentMainAxisPos += maxCrossSize + rankSpacing;
  });

  // Normalize positions to start from padding
  let minX = Infinity, minY = Infinity;
  nodeMap.forEach(info => {
    minX = Math.min(minX, info.x - info.width / 2);
    minY = Math.min(minY, info.y - info.height / 2);
  });

  nodeMap.forEach(info => {
    info.x = info.x - minX + padding;
    info.y = info.y - minY + padding;
  });
}

/**
 * Calculate positions for grid layout
 */
function calculateGridPositions(
  nodeMap: Map<string, NodeInfo>,
  options: LayoutOptions
): void {
  const { nodeSpacing, rankSpacing, padding } = options;
  const nodes = Array.from(nodeMap.values());
  
  // Determine grid dimensions
  const cols = Math.ceil(Math.sqrt(nodes.length));
  
  let currentX = padding;
  let currentY = padding;
  let maxHeightInRow = 0;
  let col = 0;

  nodes.forEach(info => {
    info.x = currentX + info.width / 2;
    info.y = currentY + info.height / 2;
    
    maxHeightInRow = Math.max(maxHeightInRow, info.height);
    
    col++;
    if (col >= cols) {
      col = 0;
      currentX = padding;
      currentY += maxHeightInRow + rankSpacing;
      maxHeightInRow = 0;
    } else {
      currentX += info.width + nodeSpacing;
    }
  });
}

/**
 * Apply positions to nodes
 */
function applyPositions(
  graph: Graph,
  nodeMap: Map<string, NodeInfo>,
  animate: boolean
): void {
  const duration = animate ? 300 : 0;

  nodeMap.forEach(info => {
    const { node, x, y, width, height } = info;
    const targetX = x - width / 2;
    const targetY = y - height / 2;

    if (animate && duration > 0) {
      node.transition('position', { x: targetX, y: targetY }, {
        duration,
        // Use linear easing for compatibility
      });
    } else {
      node.setPosition(targetX, targetY);
    }
  });
}

/**
 * Apply auto-layout to a flowchart
 */
export function applyFlowchartLayout(
  graph: Graph,
  options: Partial<LayoutOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Build graph structure
  const nodeMap = buildGraphStructure(graph);
  
  if (nodeMap.size === 0) return;

  // Find root nodes
  const roots = findRoots(nodeMap);
  
  // If no roots found, use the first node
  if (roots.length === 0 && nodeMap.size > 0) {
    const firstKey = nodeMap.keys().next().value;
    if (firstKey) roots.push(firstKey);
  }

  if (opts.type === 'hierarchical' || opts.type === 'tree') {
    // Assign ranks
    assignRanks(nodeMap, roots);
    
    // Group by rank
    const rankGroups = groupByRank(nodeMap);
    
    // Order nodes within ranks
    orderNodesInRanks(nodeMap, rankGroups);
    
    // Calculate positions
    calculateHierarchicalPositions(nodeMap, rankGroups, opts);
  } else if (opts.type === 'grid') {
    calculateGridPositions(nodeMap, opts);
  }

  // Apply positions
  applyPositions(graph, nodeMap, opts.animate);
}

/**
 * Align selected nodes
 */
export type AlignType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export function alignNodes(graph: Graph, nodes: Node[], alignType: AlignType): void {
  if (nodes.length < 2) return;

  // Get bounding boxes
  const boxes = nodes.map(node => ({
    node,
    bbox: node.getBBox(),
  }));

  let targetValue: number;

  switch (alignType) {
    case 'left':
      targetValue = Math.min(...boxes.map(b => b.bbox.x));
      boxes.forEach(({ node, bbox }) => {
        node.setPosition(targetValue, bbox.y);
      });
      break;
    case 'center':
      targetValue = boxes.reduce((sum, b) => sum + b.bbox.x + b.bbox.width / 2, 0) / boxes.length;
      boxes.forEach(({ node, bbox }) => {
        node.setPosition(targetValue - bbox.width / 2, bbox.y);
      });
      break;
    case 'right':
      targetValue = Math.max(...boxes.map(b => b.bbox.x + b.bbox.width));
      boxes.forEach(({ node, bbox }) => {
        node.setPosition(targetValue - bbox.width, bbox.y);
      });
      break;
    case 'top':
      targetValue = Math.min(...boxes.map(b => b.bbox.y));
      boxes.forEach(({ node, bbox }) => {
        node.setPosition(bbox.x, targetValue);
      });
      break;
    case 'middle':
      targetValue = boxes.reduce((sum, b) => sum + b.bbox.y + b.bbox.height / 2, 0) / boxes.length;
      boxes.forEach(({ node, bbox }) => {
        node.setPosition(bbox.x, targetValue - bbox.height / 2);
      });
      break;
    case 'bottom':
      targetValue = Math.max(...boxes.map(b => b.bbox.y + b.bbox.height));
      boxes.forEach(({ node, bbox }) => {
        node.setPosition(bbox.x, targetValue - bbox.height);
      });
      break;
  }
}

/**
 * Distribute nodes evenly
 */
export type DistributeType = 'horizontal' | 'vertical';

export function distributeNodes(graph: Graph, nodes: Node[], distributeType: DistributeType): void {
  if (nodes.length < 3) return;

  const boxes = nodes.map(node => ({
    node,
    bbox: node.getBBox(),
  }));

  if (distributeType === 'horizontal') {
    boxes.sort((a, b) => a.bbox.x - b.bbox.x);
    const leftmost = boxes[0].bbox.x;
    const rightmost = boxes[boxes.length - 1].bbox.x + boxes[boxes.length - 1].bbox.width;
    const totalNodeWidth = boxes.reduce((sum, b) => sum + b.bbox.width, 0);
    const spacing = (rightmost - leftmost - totalNodeWidth) / (boxes.length - 1);
    
    let currentX = leftmost;
    boxes.forEach(({ node, bbox }) => {
      node.setPosition(currentX, bbox.y);
      currentX += bbox.width + spacing;
    });
  } else {
    boxes.sort((a, b) => a.bbox.y - b.bbox.y);
    const topmost = boxes[0].bbox.y;
    const bottommost = boxes[boxes.length - 1].bbox.y + boxes[boxes.length - 1].bbox.height;
    const totalNodeHeight = boxes.reduce((sum, b) => sum + b.bbox.height, 0);
    const spacing = (bottommost - topmost - totalNodeHeight) / (boxes.length - 1);
    
    let currentY = topmost;
    boxes.forEach(({ node, bbox }) => {
      node.setPosition(bbox.x, currentY);
      currentY += bbox.height + spacing;
    });
  }
}
