import { Graph, Node } from '@antv/x6';
import type { MindmapLayoutDirection } from '../types';

export type LayoutDirection = 'LR' | 'RL' | 'TB' | 'BT';
export type MindmapSortOrder = 'clockwise' | 'counter-clockwise' | 'top-to-bottom' | 'left-to-right';

interface TreeNode {
  node: Node;
  children: TreeNode[];
  width: number;
  height: number;
  x: number;
  y: number;

  // Used by radial layout
  _leaves?: number;
  _angle?: number;
}

// Get the sort order from global settings
function getSortOrder(): MindmapSortOrder {
  const settings = (window as any).__drawdd_mindmapSettings;
  return settings?.sortOrder || 'top-to-bottom';
}

export function applyMindmapLayout(
  graph: Graph,
  direction: MindmapLayoutDirection,
  startNode?: Node,
  layoutMode: 'standard' | 'compact' = 'standard'
) {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return;

  let layoutRoots: Node[];

  if (startNode) {
    layoutRoots = [startNode];
  } else {
    const roots = nodes.filter(node => {
      const incoming = graph.getIncomingEdges(node);
      return !incoming || incoming.length === 0;
    });
    layoutRoots = roots.length > 0 ? roots : [nodes[0]];
  }

  layoutRoots.forEach(root => {
    if (direction === 'radial') {
      applyRadialLayout(graph, root, layoutMode);
      // Radial still needs port fixing so edges connect to node points
      fixMindmapAnchors(graph, root, 'radial');
    } else if (direction === 'both') {
      applyBalancedLayout(graph, root, layoutMode);
      // Fix anchors for both sides: right side from right, left side from left
      fixMindmapAnchors(graph, root, 'both');
    } else {
      // Map UI directions to layout directions (top should go upward)
      const layoutDir: LayoutDirection =
        direction === 'right' ? 'LR' :
          direction === 'left' ? 'RL' :
            direction === 'top' ? 'BT' : // top = place nodes above
              direction === 'bottom' ? 'TB' : 'LR';

      applyTreeLayout(graph, layoutDir, root, layoutMode);
      // Fix anchors based on direction
      fixMindmapAnchors(graph, root, direction);
    }
  });

  if (!startNode) {
    graph.centerContent();
  }
}

export function applyTreeLayout(
  graph: Graph,
  direction: LayoutDirection = 'LR',
  startNode?: Node,
  layoutMode: 'standard' | 'compact' = 'standard'
) {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return;

  const root = startNode || nodes.find(n => graph.getIncomingEdges(n)?.length === 0) || nodes[0];

  // Adjust gaps based on layout mode
  const LEVEL_GAP = layoutMode === 'compact' ? 100 : 140;
  const SIBLING_GAP = layoutMode === 'compact' ? 30 : 50;

  const rootPos = root.getPosition();
  const tree = buildTree(graph, root);

  applyPositionsImproved(tree, direction, LEVEL_GAP, SIBLING_GAP, rootPos);
}

function applyBalancedLayout(graph: Graph, root: Node, layoutMode: 'standard' | 'compact' = 'standard') {
  const outgoing = graph.getOutgoingEdges(root) || [];
  const children = outgoing.map(edge => {
    const targetId = edge.getTargetCellId();
    return targetId ? graph.getCellById(targetId) as Node : null;
  }).filter((n): n is Node => n !== null);

  // Sort children by insertion order (mmOrder) if present; fallback to position
  children.sort((a, b) => {
    const da = a.getData() as any;
    const db = b.getData() as any;
    const oa = typeof da?.mmOrder === 'number' ? da.mmOrder : null;
    const ob = typeof db?.mmOrder === 'number' ? db.mmOrder : null;
    if (oa != null && ob != null) return oa - ob;
    if (oa != null) return -1;
    if (ob != null) return 1;
    return a.getPosition().y - b.getPosition().y;
  });

  const leftChildren: Node[] = [];
  const rightChildren: Node[] = [];

  children.forEach((child, index) => {
    if (index % 2 === 0) rightChildren.push(child);
    else leftChildren.push(child);
  });

  const rootPos = root.getPosition();
  // Adjust gaps based on layout mode
  const LEVEL_GAP = layoutMode === 'compact' ? 100 : 140;
  const SIBLING_GAP = layoutMode === 'compact' ? 30 : 50;

  if (rightChildren.length > 0) {
    const rightTree = {
      node: root,
      children: rightChildren.map(c => buildTree(graph, c)),
      width: root.getSize().width,
      height: root.getSize().height,
      x: 0, y: 0
    };
    applyPositionsImproved(rightTree, 'LR', LEVEL_GAP, SIBLING_GAP, rootPos);
  }

  if (leftChildren.length > 0) {
    const leftTree = {
      node: root,
      children: leftChildren.map(c => buildTree(graph, c)),
      width: root.getSize().width,
      height: root.getSize().height,
      x: 0, y: 0
    };
    applyPositionsImproved(leftTree, 'RL', LEVEL_GAP, SIBLING_GAP, rootPos);
  }

  root.setPosition(rootPos.x, rootPos.y);
}

function applyRadialLayout(graph: Graph, root: Node, layoutMode: 'standard' | 'compact' = 'standard') {
  const tree = buildTree(graph, root);
  const rootPos = root.getPosition();
  const rootCenter = {
    x: rootPos.x + tree.width / 2,
    y: rootPos.y + tree.height / 2
  };

  const sortOrder = getSortOrder();

  // Determine start angle and direction based on sortOrder
  // In standard math coordinates: 0 = right (3 o'clock), π/2 = down (6 o'clock), π = left, -π/2 = up (12 o'clock)
  // We want to start from top (12 o'clock) = -π/2
  const startAngle = -Math.PI / 2;

  // clockwise in screen coordinates (y increases downward) means increasing angle
  // counter-clockwise means decreasing angle
  const isClockwise = sortOrder !== 'counter-clockwise';

  const endAngle = isClockwise ? startAngle + Math.PI * 2 : startAngle - Math.PI * 2;

  // Two-pass radial layout:
  // 1) allocate angular spans based on leaf counts (stable)
  // 2) position nodes at radius proportional to depth
  assignRadialAngles(tree, startAngle, endAngle, isClockwise);
  positionRadialNodes(tree, 0, rootCenter.x, rootCenter.y, layoutMode);
}

function assignRadialAngles(node: TreeNode, startAngle: number, endAngle: number, isClockwise: boolean = true) {
  node._leaves ??= countLeaves(node);
  node._angle = (startAngle + endAngle) / 2;

  if (node.children.length === 0) return;

  const totalLeaves = node.children.reduce((sum, c) => sum + (c._leaves ?? (c._leaves = countLeaves(c))), 0);
  let current = startAngle;
  const spanDirection = isClockwise ? 1 : -1;
  const totalSpan = Math.abs(endAngle - startAngle);

  node.children.forEach((child) => {
    const childLeaves = child._leaves ?? (child._leaves = countLeaves(child));
    const span = totalLeaves > 0 ? (totalSpan * (childLeaves / totalLeaves)) : 0;
    const childEnd = current + span * spanDirection;
    assignRadialAngles(child, current, childEnd, isClockwise);
    current = childEnd;
  });
}

function positionRadialNodes(node: TreeNode, depth: number, cx: number, cy: number, layoutMode: 'standard' | 'compact' = 'standard') {
  const angle = typeof node._angle === 'number' ? node._angle : 0;
  const RADIUS_GAP = layoutMode === 'compact' ? 160 : 220;
  const radius = depth * RADIUS_GAP;

  const x = cx + Math.cos(angle) * radius;
  const y = cy + Math.sin(angle) * radius;
  node.node.setPosition(x - node.width / 2, y - node.height / 2);

  node.children.forEach((child) => positionRadialNodes(child, depth + 1, cx, cy, layoutMode));
}

function countLeaves(t: TreeNode): number {
  if (t.children.length === 0) return 1;
  return t.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

function buildTree(graph: Graph, node: Node): TreeNode {
  const size = node.getSize();
  const outgoing = graph.getOutgoingEdges(node) || [];
  const sortOrder = getSortOrder();

  const childrenNodes = outgoing
    .map(edge => {
      const targetId = edge.getTargetCellId();
      return targetId ? graph.getCellById(targetId) as Node : null;
    })
    .filter((n): n is Node => n !== null)
    .sort((a, b) => {
      const da = a.getData() as any;
      const db = b.getData() as any;
      const oa = typeof da?.mmOrder === 'number' ? da.mmOrder : null;
      const ob = typeof db?.mmOrder === 'number' ? db.mmOrder : null;

      // Primary sort by mmOrder (insertion order)
      if (oa != null && ob != null) {
        const orderDiff = oa - ob;
        if (orderDiff !== 0) return orderDiff;
      }
      if (oa != null && ob == null) return -1;
      if (oa == null && ob != null) return 1;

      // Secondary sort based on sortOrder preference
      const posA = a.getPosition();
      const posB = b.getPosition();

      if (sortOrder === 'left-to-right') {
        return posA.x - posB.x || posA.y - posB.y;
      } else {
        // Default: top-to-bottom
        return posA.y - posB.y || posA.x - posB.x;
      }
    });

  return {
    node,
    children: childrenNodes.map(child => buildTree(graph, child)),
    width: size.width,
    height: size.height,
    x: 0,
    y: 0
  };
}

function calculateTreeSize(tree: TreeNode, gap: number, isVertical: boolean): { width: number, height: number } {
  if (tree.children.length === 0) {
    return { width: tree.width, height: tree.height };
  }

  let childrenSpan = 0;
  let maxDepth = 0;

  tree.children.forEach(child => {
    const size = calculateTreeSize(child, gap, isVertical);
    if (isVertical) {
      childrenSpan += size.width;
      maxDepth = Math.max(maxDepth, size.height);
    } else {
      childrenSpan += size.height;
      maxDepth = Math.max(maxDepth, size.width);
    }
  });

  childrenSpan += (tree.children.length - 1) * gap;

  if (isVertical) {
    return {
      width: Math.max(tree.width, childrenSpan),
      height: tree.height + maxDepth
    };
  } else {
    return {
      width: tree.width + maxDepth,
      height: Math.max(tree.height, childrenSpan)
    };
  }
}

function applyPositionsImproved(
  tree: TreeNode,
  direction: LayoutDirection,
  levelGap: number,
  siblingGap: number,
  fixedRootPos?: { x: number, y: number }
) {
  // Calculate initial root position
  let rootX = 0;
  let rootY = 0;

  if (fixedRootPos) {
    rootX = fixedRootPos.x;
    rootY = fixedRootPos.y;
  }

  positionNode(tree, direction, rootX, rootY, levelGap, siblingGap);
}

function positionNode(
  tree: TreeNode,
  direction: LayoutDirection,
  x: number,
  y: number,
  levelGap: number,
  siblingGap: number
) {
  tree.node.setPosition(x, y);

  if (tree.children.length === 0) return;

  const isVertical = direction === 'TB' || direction === 'BT';

  // Calculate total span of children
  const childSizes = tree.children.map(child =>
    isVertical
      ? calculateTreeSize(child, siblingGap, true).width
      : calculateTreeSize(child, siblingGap, false).height
  );

  const totalChildrenSpan = childSizes.reduce((a, b) => a + b, 0) + (tree.children.length - 1) * siblingGap;

  if (isVertical) {
    // Vertical layout (TB or BT)
    // Children are placed along X axis, centered relative to parent

    // Start X for the first child's subtree
    let currentX = x + tree.width / 2 - totalChildrenSpan / 2;

    tree.children.forEach((child, index) => {
      const childSubtreeWidth = childSizes[index];

      // The child node itself should be centered within its subtree width
      const childX = currentX + childSubtreeWidth / 2 - child.width / 2;

      let childY: number;
      if (direction === 'TB') {
        // bottom direction now maps here: children go below root
        childY = y + tree.height + levelGap;
      } else { // BT
        // top direction maps here: children go above root
        childY = y - levelGap - child.height;
      }

      positionNode(child, direction, childX, childY, levelGap, siblingGap);
      currentX += childSubtreeWidth + siblingGap;
    });

  } else {
    // Horizontal layout (LR or RL)
    // Children are placed along Y axis

    // Start Y for the first child's subtree
    let currentY = y + tree.height / 2 - totalChildrenSpan / 2;

    tree.children.forEach((child, index) => {
      const childSubtreeHeight = childSizes[index];

      // The child node itself should be centered within its subtree height
      const childY = currentY + childSubtreeHeight / 2 - child.height / 2;

      let childX: number;
      if (direction === 'LR') {
        childX = x + tree.width + levelGap;
      } else { // RL
        childX = x - levelGap - child.width;
      }

      positionNode(child, direction, childX, childY, levelGap, siblingGap);
      currentY += childSubtreeHeight + siblingGap;
    });
  }
}

// Fix mindmap edge endpoints based on direction using ports (fixed points)
// EXPORTED so it can be called after edge creation to force router recalculation
export function fixMindmapAnchors(graph: Graph, root: Node, direction: MindmapLayoutDirection) {
  const outgoingEdges = graph.getOutgoingEdges(root) || [];

  outgoingEdges.forEach(edge => {
    const target = graph.getCellById(edge.getTargetCellId() || '');
    if (!target || !target.isNode()) return;

    const setPorts = (sourcePort: 'left' | 'right' | 'top' | 'bottom', targetPort: 'left' | 'right' | 'top' | 'bottom') => {
      edge.setSource({ cell: root.id, port: sourcePort });
      edge.setTarget({ cell: target.id, port: targetPort });
      // Force router recalculation by re-setting the router
      const currentRouter = edge.getRouter();
      if (currentRouter) {
        edge.setRouter(currentRouter);
      }
    };

    if (direction === 'right') {
      setPorts('right', 'left');
    } else if (direction === 'left') {
      setPorts('left', 'right');
    } else if (direction === 'top') {
      // Children positioned above the parent
      setPorts('top', 'bottom');
    } else if (direction === 'bottom') {
      // Children positioned below the parent
      setPorts('bottom', 'top');
    } else if (direction === 'radial') {
      const rootBox = root.getBBox();
      const targetBox = target.getBBox();
      const dx = (targetBox.x + targetBox.width / 2) - (rootBox.x + rootBox.width / 2);
      const dy = (targetBox.y + targetBox.height / 2) - (rootBox.y + rootBox.height / 2);
      if (Math.abs(dx) >= Math.abs(dy)) {
        setPorts(dx >= 0 ? 'right' : 'left', dx >= 0 ? 'left' : 'right');
      } else {
        setPorts(dy >= 0 ? 'bottom' : 'top', dy >= 0 ? 'top' : 'bottom');
      }
    } else if (direction === 'both') {
      const rootBox = root.getBBox();
      const targetBox = target.getBBox();
      const rootCenterX = rootBox.x + rootBox.width / 2;
      const targetCenterX = targetBox.x + targetBox.width / 2;
      setPorts(targetCenterX >= rootCenterX ? 'right' : 'left', targetCenterX >= rootCenterX ? 'left' : 'right');
    }

    // Recursively fix anchors for children
    fixMindmapAnchors(graph, target as Node, direction);
  });
}

// ============ Fishbone Layout ============
export function applyFishboneLayout(graph: Graph, startNode?: Node) {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return;

  // Find root (head of the fish) - rightmost node or the one with no outgoing edges
  const root = startNode || nodes.find(n => {
    const outgoing = graph.getOutgoingEdges(n);
    return !outgoing || outgoing.length === 0;
  }) || nodes[0];

  // Position root on the right
  root.setPosition({ x: 800, y: 300 });

  // Get all children (causes)
  const incoming = graph.getIncomingEdges(root) || [];
  const causes = incoming.map(edge => {
    const sourceId = edge.getSourceCellId();
    return sourceId ? graph.getCellById(sourceId) as Node : null;
  }).filter((n): n is Node => n !== null);

  if (causes.length === 0) return;

  // Separate causes into categories (top and bottom branches)
  const topCauses: Node[] = [];
  const bottomCauses: Node[] = [];

  causes.forEach((cause, index) => {
    if (index % 2 === 0) {
      topCauses.push(cause);
    } else {
      bottomCauses.push(cause);
    }
  });

  // Draw spine (main horizontal line)
  const spineLength = 600;
  const spineY = 300;

  // Position causes along the spine
  const CATEGORY_GAP = 150;

  // Position top causes
  topCauses.forEach((cause, i) => {
    const x = 800 - spineLength + i * CATEGORY_GAP;
    const y = spineY - 80;
    cause.setPosition({ x, y });

    // Get sub-causes (detailed reasons)
    const subCauseEdges = graph.getIncomingEdges(cause) || [];
    const subCauses = subCauseEdges.map(edge => {
      const sourceId = edge.getSourceCellId();
      return sourceId ? graph.getCellById(sourceId) as Node : null;
    }).filter((n): n is Node => n !== null);

    // Position sub-causes vertically above
    subCauses.forEach((subCause, j) => {
      subCause.setPosition({ x: x - 20, y: y - 60 - j * 50 });
    });

    // Update edge to go at an angle
    const causeEdge = incoming.find(e => e.getSourceCellId() === cause.id);
    if (causeEdge) {
      causeEdge.setSource({ cell: cause.id, port: 'right' });
      causeEdge.setTarget({ cell: root.id, port: 'left' });
    }
  });

  // Position bottom causes
  bottomCauses.forEach((cause, i) => {
    const x = 800 - spineLength + i * CATEGORY_GAP + 75; // Offset slightly
    const y = spineY + 80;
    cause.setPosition({ x, y });

    // Get sub-causes
    const subCauseEdges = graph.getIncomingEdges(cause) || [];
    const subCauses = subCauseEdges.map(edge => {
      const sourceId = edge.getSourceCellId();
      return sourceId ? graph.getCellById(sourceId) as Node : null;
    }).filter((n): n is Node => n !== null);

    // Position sub-causes vertically below
    subCauses.forEach((subCause, j) => {
      subCause.setPosition({ x: x - 20, y: y + 60 + j * 50 });
    });

    // Update edge
    const causeEdge = incoming.find(e => e.getSourceCellId() === cause.id);
    if (causeEdge) {
      causeEdge.setSource({ cell: cause.id, port: 'right' });
      causeEdge.setTarget({ cell: root.id, port: 'left' });
    }
  });

  graph.centerContent();
}

// ============ Timeline Layout ============
export function applyTimelineLayout(
  graph: Graph,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  options?: {
    sortByDate?: boolean;
    showDateLabels?: boolean;
    autoSpacing?: boolean;
  }
) {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return;

  const sortByDate = options?.sortByDate !== false; // Default true
  const showDateLabels = options?.showDateLabels !== false; // Default true
  const autoSpacing = options?.autoSpacing !== false; // Default true

  // Sort nodes by date if available, otherwise by position
  const sortedNodes = [...nodes].sort((a, b) => {
    const dataA = a.getData() as any;
    const dataB = b.getData() as any;

    if (sortByDate && dataA?.date && dataB?.date) {
      return new Date(dataA.date).getTime() - new Date(dataB.date).getTime();
    }

    // Fallback to position
    if (orientation === 'horizontal') {
      return a.getPosition().x - b.getPosition().x;
    } else {
      return a.getPosition().y - b.getPosition().y;
    }
  });

  // Calculate spacing based on dates if auto-spacing enabled
  const calculateSpacing = (index: number): number => {
    if (!autoSpacing || index === 0) return 0;

    const currentData = sortedNodes[index].getData() as any;
    const prevData = sortedNodes[index - 1].getData() as any;

    if (currentData?.date && prevData?.date) {
      const currentDate = new Date(currentData.date).getTime();
      const prevDate = new Date(prevData.date).getTime();
      const daysDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

      // Scale spacing based on time difference (min 150px, max 400px)
      const baseGap = 200;
      const scaleFactor = Math.min(Math.max(daysDiff / 30, 0.75), 2); // 30 days = 1x spacing
      return baseGap * scaleFactor;
    }

    return 200; // Default gap
  };

  const OFFSET = 100;

  if (orientation === 'horizontal') {
    // Horizontal timeline
    const centerY = 300;
    let currentX = 100;

    sortedNodes.forEach((node, i) => {
      const gap = i === 0 ? 0 : calculateSpacing(i);
      currentX += gap;

      // Alternate above and below the timeline
      const y = i % 2 === 0 ? centerY - OFFSET : centerY + OFFSET;
      node.setPosition({ x: currentX, y });

      // Add date label if enabled
      if (showDateLabels) {
        const data = node.getData() as any;
        if (data?.date) {
          const dateStr = formatDateLabel(data.date);
          const currentLabel = String(node.getAttrs()?.label?.text || '');
          if (!currentLabel.includes(dateStr)) {
            node.setAttrs({
              label: {
                text: `${currentLabel}\n${dateStr}`,
                fontSize: 12,
              }
            });
          }
        }
      }

      currentX += node.getSize().width;
    });

    // Update edges to connect sequentially
    sortedNodes.forEach((node, i) => {
      if (i > 0) {
        const prevNode = sortedNodes[i - 1];
        const edges = graph.getEdges().filter(e =>
          e.getSourceCellId() === prevNode.id && e.getTargetCellId() === node.id
        );

        if (edges.length === 0) {
          // Create edge if it doesn't exist
          graph.addEdge({
            source: { cell: prevNode.id, port: 'right' },
            target: { cell: node.id, port: 'left' },
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
          });
        } else {
          // Update existing edge ports
          edges[0].setSource({ cell: prevNode.id, port: 'right' });
          edges[0].setTarget({ cell: node.id, port: 'left' });
        }
      }
    });
  } else {
    // Vertical timeline
    const centerX = 400;
    let currentY = 100;

    sortedNodes.forEach((node, i) => {
      const gap = i === 0 ? 0 : calculateSpacing(i);
      currentY += gap;

      // Alternate left and right of the timeline
      const x = i % 2 === 0 ? centerX - OFFSET : centerX + OFFSET;
      node.setPosition({ x, y: currentY });

      // Add date label if enabled
      if (showDateLabels) {
        const data = node.getData() as any;
        if (data?.date) {
          const dateStr = formatDateLabel(data.date);
          const currentLabel = String(node.getAttrs()?.label?.text || '');
          if (!currentLabel.includes(dateStr)) {
            node.setAttrs({
              label: {
                text: `${currentLabel}\n${dateStr}`,
                fontSize: 12,
              }
            });
          }
        }
      }

      currentY += node.getSize().height;
    });

    // Update edges
    sortedNodes.forEach((node, i) => {
      if (i > 0) {
        const prevNode = sortedNodes[i - 1];
        const edges = graph.getEdges().filter(e =>
          e.getSourceCellId() === prevNode.id && e.getTargetCellId() === node.id
        );

        if (edges.length === 0) {
          graph.addEdge({
            source: { cell: prevNode.id, port: 'bottom' },
            target: { cell: node.id, port: 'top' },
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
          });
        } else {
          edges[0].setSource({ cell: prevNode.id, port: 'bottom' });
          edges[0].setTarget({ cell: node.id, port: 'top' });
        }
      }
    });
  }

  graph.centerContent();
}

function formatDateLabel(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}
