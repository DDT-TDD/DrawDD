/**
 * Collapse/Expand Utilities for Mindmap Branches
 * COMPLETELY REWRITTEN to fix critical visibility regression
 */

import type { Graph, Node as X6Node } from '@antv/x6';
// RICH_CONTENT_NODE_MARKUP is no longer used - collapse indicators are now in React component

/**
 * Simple toggle collapse/expand of a mindmap branch
 * ONLY manages the collapsed state flag - does NOT touch visibility
 */
export function toggleCollapse(graph: Graph, node: X6Node, collapse: boolean): void {
  console.log('[COLLAPSE] toggleCollapse called:', node.id, 'collapse:', collapse);
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
function hideDescendants(graph: Graph, node: X6Node): void {
  console.log('[COLLAPSE] hideDescendants called for node:', node.id);
  const outgoingEdges = graph.getOutgoingEdges(node) || [];

  outgoingEdges.forEach(edge => {
    const targetId = edge.getTargetCellId();
    const target = targetId ? graph.getCellById(targetId) : null;

    if (target && target.isNode()) {
      const targetNode = target as X6Node;

      console.log('[COLLAPSE] Hiding node:', targetNode.id);
      // Hide the edge and node
      edge.setVisible(false);
      targetNode.setVisible(false);

      // Recursively hide all descendants
      hideDescendants(graph, targetNode);
    }
  });
}

/**
 * Show direct children of an expanded node
 * Respects individual collapsed states of children
 */
function showDescendants(graph: Graph, node: X6Node): void {
  console.log('[COLLAPSE] showDescendants called for node:', node.id);
  const outgoingEdges = graph.getOutgoingEdges(node) || [];

  outgoingEdges.forEach(edge => {
    const targetId = edge.getTargetCellId();
    const target = targetId ? graph.getCellById(targetId) : null;

    if (target && target.isNode()) {
      const targetNode = target as X6Node;
      const targetData = targetNode.getData() || {};

      console.log('[COLLAPSE] Showing node:', targetNode.id, 'collapsed:', targetData.collapsed);
      // Show the edge and node
      edge.setVisible(true);
      targetNode.setVisible(true);

      // If child is not collapsed, show its descendants too
      if (!targetData.collapsed) {
        showDescendants(graph, targetNode);
      }
    }
  });
}

/**
 * Add a collapse/expand indicator to a node
 * NOTE: For React shapes (rich-content-node), this is now a NO-OP.
 * The collapse indicator is rendered inside the RichContentNode component.
 */
export function addCollapseIndicator(_node: X6Node, _hasChildren: boolean): void {
  // NO-OP: Collapse indicators are now rendered inside the React component (RichContentNode)
  // This function is kept for API compatibility but does nothing for React shapes
}

/**
 * Remove the collapse indicator from a node
 * NOTE: For React shapes, this is now a NO-OP.
 */
export function removeCollapseIndicator(_node: X6Node): void {
  // NO-OP: Collapse indicators are now rendered inside the React component
}

/**
 * Update the collapse indicator icon based on collapsed state
 * NOTE: For React shapes, this is now a NO-OP.
 */
function updateCollapseIndicator(_node: X6Node, _isCollapsed: boolean): void {
  // NO-OP: Collapse indicators are now rendered inside the React component
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
 * Initialize collapse indicators for all nodes in the graph
 * NOTE: For React shapes, this is now a NO-OP.
 * The RichContentNode component handles its own collapse indicator rendering.
 */
export function initializeCollapseIndicators(_graph: Graph): void {
  // NO-OP: Collapse indicators are now rendered inside the React component (RichContentNode)
}