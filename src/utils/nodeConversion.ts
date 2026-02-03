/**
 * Node Conversion Utilities
 * Handles on-demand conversion of nodes to rich-content-node for markdown support
 */

import type { Node, Graph } from '@antv/x6';
import { hasMarkdown } from './markdown';
import { FULL_PORTS_CONFIG } from '../config/shapes';

/**
 * Check if a node is already a rich-content-node
 */
export function isRichContentNode(node: Node): boolean {
  return node.shape === 'rich-content-node';
}

/**
 * Check if text contains markdown that requires rich rendering
 */
export function needsRichRendering(text: string): boolean {
  if (!text) return false;
  return hasMarkdown(text);
}

/**
 * Convert a standard node to rich-content-node while preserving all properties
 * This enables markdown rendering for nodes that contain markdown content
 * 
 * @param graph - The X6 graph instance
 * @param node - The node to convert
 * @returns The new rich-content-node (or original if already rich or conversion fails)
 */
export function convertToRichContentNode(graph: Graph, node: Node): Node {
  // Already a rich-content-node, no conversion needed
  if (isRichContentNode(node)) {
    return node;
  }

  try {
    // Get current node properties
    const position = node.getPosition();
    const size = node.getSize();
    const attrs = node.getAttrs();
    const data = node.getData() || {};
    const ports = node.getPorts();
    const zIndex = node.getZIndex();
    const parent = node.getParent();
    const nodeId = node.id;

    // Get label text
    const labelText = (attrs.label as any)?.text || '';
    
    // Preserve styling from original node
    const bodyAttrs = attrs.body || {};
    const labelAttrs = attrs.label || {};

    // Get all connected edges before removing the node
    const incomingEdges = graph.getIncomingEdges(node) || [];
    const outgoingEdges = graph.getOutgoingEdges(node) || [];
    
    // Store COMPLETE edge connection info including anchors and connection points
    const edgeConnections = [
      ...incomingEdges.map(edge => ({
        edge,
        isSource: false,
        // Get the full target object which includes anchor, connectionPoint, etc.
        fullTarget: edge.getTarget(),
        fullSource: edge.getSource(),
      })),
      ...outgoingEdges.map(edge => ({
        edge,
        isSource: true,
        // Get the full source object which includes anchor, connectionPoint, etc.
        fullSource: edge.getSource(),
        fullTarget: edge.getTarget(),
      }))
    ];

    // Create new rich-content-node with same properties
    const newNode = graph.addNode({
      id: nodeId + '-rich', // Temporary ID to avoid conflict
      shape: 'rich-content-node',
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      attrs: {
        body: {
          fill: (bodyAttrs as any).fill || '#ffffff',
          stroke: (bodyAttrs as any).stroke || '#333333',
          strokeWidth: (bodyAttrs as any).strokeWidth || 2,
          rx: (bodyAttrs as any).rx || 6,
          ry: (bodyAttrs as any).ry || 6,
        },
        label: {
          text: labelText,
          fill: (labelAttrs as any).fill || '#333333',
          fontSize: (labelAttrs as any).fontSize || 14,
          fontFamily: (labelAttrs as any).fontFamily || 'system-ui, sans-serif',
        }
      },
      data: {
        ...data,
        text: labelText,
        textColor: (labelAttrs as any).fill || '#333333',
        convertedFromShape: node.shape, // Track original shape for potential reversion
      },
      zIndex: zIndex || 1,
      // Always include full ports config for edge connectivity
      ports: FULL_PORTS_CONFIG as any,
    });

    // Re-parent if needed
    if (parent && parent.isNode()) {
      (parent as Node).addChild(newNode);
    }

    // Reconnect edges to new node, preserving all connection properties
    edgeConnections.forEach(conn => {
      if (conn.isSource) {
        // This edge was outgoing from the original node
        // Preserve anchor, connectionPoint, etc. from the original source
        const sourceConfig = conn.fullSource as any;
        conn.edge.setSource({
          cell: newNode.id,
          port: sourceConfig?.port,
          anchor: sourceConfig?.anchor,
          connectionPoint: sourceConfig?.connectionPoint,
          magnet: sourceConfig?.magnet,
        });
      } else {
        // This edge was incoming to the original node
        // Preserve anchor, connectionPoint, etc. from the original target
        const targetConfig = conn.fullTarget as any;
        conn.edge.setTarget({
          cell: newNode.id,
          port: targetConfig?.port,
          anchor: targetConfig?.anchor,
          connectionPoint: targetConfig?.connectionPoint,
          magnet: targetConfig?.magnet,
        });
      }
    });

    // Remove old node
    graph.removeNode(node);

    // Update new node ID to match original (for consistency)
    // Note: X6 doesn't allow direct ID change, so we keep the new ID

    return newNode;
  } catch (error) {
    console.error('[nodeConversion] Failed to convert node:', error);
    return node; // Return original on failure
  }
}

/**
 * Check if a node should be converted based on its text content
 * and convert it if necessary. This is the main entry point for
 * on-demand markdown support.
 * 
 * @param graph - The X6 graph instance
 * @param node - The node to check
 * @param text - The new text being set
 * @returns The node (possibly converted to rich-content-node)
 */
export function ensureMarkdownSupport(graph: Graph, node: Node, text: string): Node {
  // Skip if already rich-content-node
  if (isRichContentNode(node)) {
    return node;
  }

  // Check if text needs markdown rendering
  if (needsRichRendering(text)) {
    return convertToRichContentNode(graph, node);
  }

  return node;
}

/**
 * Get the global graph instance from window (set by Canvas component)
 */
export function getGraphInstance(): Graph | null {
  return (window as any).__drawdd_graph || null;
}
