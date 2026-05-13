/**
 * Collapse/Expand Utilities for Mindmap Branches
 * COMPLETELY REWRITTEN to fix critical visibility regression
 */

import type { Graph, Node as X6Node } from '@antv/x6';

const COLLAPSE_INDICATOR_SIZE = 16;
const COLLAPSE_INDICATOR_RADIUS = 8;
const COLLAPSE_EXPANDED_ICON = '▼';
const COLLAPSE_COLLAPSED_ICON = '▶';

type CollapseMarkupItem = {
  tagName: string;
  selector: string;
};

const getAttrs = (node: X6Node): Record<string, any> => {
  if (typeof (node as any).getAttrs === 'function') {
    return (node as any).getAttrs() || {};
  }
  return {};
};

const setAttrs = (node: X6Node, attrs: Record<string, any>): void => {
  if (typeof (node as any).setAttrs === 'function') {
    (node as any).setAttrs(attrs);
  }
};

const getMarkup = (node: X6Node): CollapseMarkupItem[] => {
  if (typeof (node as any).getMarkup === 'function') {
    return (node as any).getMarkup() || [];
  }
  return [];
};

const setMarkup = (node: X6Node, markup: CollapseMarkupItem[]): void => {
  if (typeof (node as any).setMarkup === 'function') {
    (node as any).setMarkup(markup);
  }
};

const hasCollapseMarkup = (markup: CollapseMarkupItem[], selector: string): boolean => {
  return markup.some(item => item.selector === selector);
};

const buildCollapseAttrs = (node: X6Node, isCollapsed: boolean) => {
  const size = node.getSize();
  const x = size.width - COLLAPSE_INDICATOR_SIZE / 2;
  const y = size.height / 2;

  return {
    collapseIndicator: {
      cx: x,
      cy: y,
      r: COLLAPSE_INDICATOR_RADIUS,
      fill: '#ffffff',
      stroke: '#333333',
      strokeWidth: 1,
      cursor: 'pointer',
    },
    collapseIcon: {
      x,
      y,
      text: isCollapsed ? COLLAPSE_COLLAPSED_ICON : COLLAPSE_EXPANDED_ICON,
      fill: '#333333',
      fontSize: 10,
      textAnchor: 'middle',
      dominantBaseline: 'central',
      pointerEvents: 'none',
    },
  };
};

const isMindmapNode = (node: X6Node): boolean => {
  return node.getData()?.isMindmap === true;
};

/**
 * Simple toggle collapse/expand of a mindmap branch
 * ONLY manages the collapsed state flag - does NOT touch visibility
 */
export function toggleCollapse(graph: Graph, node: X6Node, collapse: boolean): void {
  const data = node.getData() || {};
  node.setData({ ...data, collapsed: collapse });

  // Update collapse indicator
  updateCollapseIndicator(node, collapse);

  // Apply visibility changes based on collapsed state
  if (collapse) {
    hideDescendants(graph, node);
  } else {
    showDescendants(graph, node);
  }
}

/**
 * Hide all descendants of a collapsed node
 */
function hideDescendants(graph: Graph, node: X6Node, visited = new Set<string>()): void {
  const nodeId = node.id;
  if (visited.has(nodeId)) {
    console.warn('[COLLAPSE] Cycle detected, stopping recursion at:', nodeId);
    return;
  }
  visited.add(nodeId);

  const outgoingEdges = graph.getOutgoingEdges(node) || [];

  outgoingEdges.forEach(edge => {
    const targetId = edge.getTargetCellId();
    const target = targetId ? graph.getCellById(targetId) : null;

    if (target && target.isNode()) {
      const targetNode = target as X6Node;

      // Hide the edge and node
      edge.setVisible(false);
      targetNode.setVisible(false);

      // Recursively hide all descendants
      hideDescendants(graph, targetNode, visited);
    }
  });
}

/**
 * Show direct children of an expanded node
 * Respects individual collapsed states of children
 */
function showDescendants(graph: Graph, node: X6Node, visited = new Set<string>()): void {
  const nodeId = node.id;
  if (visited.has(nodeId)) {
    console.warn('[COLLAPSE] Cycle detected, stopping recursion at:', nodeId);
    return;
  }
  visited.add(nodeId);

  const outgoingEdges = graph.getOutgoingEdges(node) || [];

  outgoingEdges.forEach(edge => {
    const targetId = edge.getTargetCellId();
    const target = targetId ? graph.getCellById(targetId) : null;

    if (target && target.isNode()) {
      const targetNode = target as X6Node;
      const targetData = targetNode.getData() || {};

      // Show the edge and node
      edge.setVisible(true);
      targetNode.setVisible(true);

      // If child is not collapsed, show its descendants too
      if (!targetData.collapsed) {
        showDescendants(graph, targetNode, visited);
      }
    }
  });
}

/**
 * Add a collapse/expand indicator to a node.
 */
export function addCollapseIndicator(node: X6Node, hasNodeChildren: boolean): void {
  if (!isMindmapNode(node) || !hasNodeChildren) {
    removeCollapseIndicator(node);
    return;
  }

  const attrs = getAttrs(node);
  const collapseAttrs = buildCollapseAttrs(node, node.getData()?.collapsed === true);
  setAttrs(node, { ...attrs, ...collapseAttrs });

  const markup = getMarkup(node);
  const nextMarkup = [...markup];

  if (!hasCollapseMarkup(nextMarkup, 'collapseIndicator')) {
    nextMarkup.push({ tagName: 'circle', selector: 'collapseIndicator' });
  }
  if (!hasCollapseMarkup(nextMarkup, 'collapseIcon')) {
    nextMarkup.push({ tagName: 'text', selector: 'collapseIcon' });
  }

  setMarkup(node, nextMarkup);
}

/**
 * Remove the collapse indicator from a node
 */
export function removeCollapseIndicator(node: X6Node): void {
  const attrs = getAttrs(node);
  delete attrs.collapseIndicator;
  delete attrs.collapseIcon;
  setAttrs(node, attrs);

  const markup = getMarkup(node).filter(item => {
    return item.selector !== 'collapseIndicator' && item.selector !== 'collapseIcon';
  });
  setMarkup(node, markup);
}

/**
 * Update the collapse indicator icon based on collapsed state
 */
function updateCollapseIndicator(node: X6Node, isCollapsed: boolean): void {
  const attrs = getAttrs(node);
  if (!attrs.collapseIndicator || !attrs.collapseIcon) {
    return;
  }

  const collapseAttrs = buildCollapseAttrs(node, isCollapsed);
  setAttrs(node, { ...attrs, ...collapseAttrs });
}

/**
 * Check if a node has children
 */
export function hasChildren(graph: Graph, node: X6Node): boolean {
  const outgoingEdges = graph.getOutgoingEdges(node);
  return outgoingEdges !== null && outgoingEdges.length > 0;
}

/**
 * Get all descendant nodes of a given node
 */
export function getAllDescendants(graph: Graph, node: X6Node): X6Node[] {
  const descendants: X6Node[] = [];

  const collectDescendants = (n: X6Node) => {
    const outgoingEdges = graph.getOutgoingEdges(n);
    if (!outgoingEdges) return;

    outgoingEdges.forEach(edge => {
      const targetId = edge.getTargetCellId();
      const target = targetId ? graph.getCellById(targetId) : null;

      if (target && target.isNode()) {
        const targetNode = target as X6Node;
        descendants.push(targetNode);
        collectDescendants(targetNode);
      }
    });
  };

  collectDescendants(node);
  return descendants;
}

/**
 * Initialize collapse indicators for all nodes in the graph.
 */
export function initializeCollapseIndicators(graph: Graph): void {
  const nodes = graph.getNodes?.() || [];

  nodes.forEach(node => {
    if (isMindmapNode(node as X6Node) && hasChildren(graph, node as X6Node)) {
      addCollapseIndicator(node as X6Node, true);
      return;
    }

    removeCollapseIndicator(node as X6Node);
  });
}