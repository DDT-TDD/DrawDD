/**
 * Port Management Utilities
 * Provides enhanced port visualization and connection management
 */

import type { Graph, Node } from '@antv/x6';

/**
 * Get connection count for each port of a node
 */
export function getPortConnectionCounts(graph: Graph, node: Node): Map<string, { incoming: number; outgoing: number; total: number }> {
  const counts = new Map<string, { incoming: number; outgoing: number; total: number }>();
  
  // Initialize all ports with zero counts
  const ports = node.getPorts();
  ports.forEach(port => {
    counts.set(port.id!, { incoming: 0, outgoing: 0, total: 0 });
  });
  
  // Count incoming edges
  const incomingEdges = graph.getIncomingEdges(node) || [];
  incomingEdges.forEach(edge => {
    const target = edge.getTarget() as any;
    if (target.port) {
      const current = counts.get(target.port) || { incoming: 0, outgoing: 0, total: 0 };
      current.incoming++;
      current.total++;
      counts.set(target.port, current);
    }
  });
  
  // Count outgoing edges
  const outgoingEdges = graph.getOutgoingEdges(node) || [];
  outgoingEdges.forEach(edge => {
    const source = edge.getSource() as any;
    if (source.port) {
      const current = counts.get(source.port) || { incoming: 0, outgoing: 0, total: 0 };
      current.outgoing++;
      current.total++;
      counts.set(source.port, current);
    }
  });
  
  return counts;
}

/**
 * Show port connection badges on a node
 */
export function showPortBadges(graph: Graph, node: Node): void {
  const counts = getPortConnectionCounts(graph, node);
  const ports = node.getPorts();
  
  ports.forEach(port => {
    const count = counts.get(port.id!)?.total || 0;
    if (count > 0) {
      // Update port appearance to show connection count
      node.portProp(port.id!, 'attrs/circle/stroke', count > 1 ? '#f59e0b' : '#5F95FF');
      node.portProp(port.id!, 'attrs/circle/strokeWidth', count > 1 ? 2.5 : 1.5);
      node.portProp(port.id!, 'attrs/circle/r', count > 1 ? 5 : 4);
      
      // Add badge for multiple connections
      if (count > 1) {
        node.portProp(port.id!, 'attrs/text', {
          text: String(count),
          fill: '#fff',
          fontSize: 8,
          fontWeight: 'bold',
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
        });
      }
    }
  });
}

/**
 * Hide port connection badges
 */
export function hidePortBadges(node: Node): void {
  const ports = node.getPorts();
  
  ports.forEach(port => {
    // Reset to default appearance
    node.portProp(port.id!, 'attrs/circle/stroke', '#5F95FF');
    node.portProp(port.id!, 'attrs/circle/strokeWidth', 1.5);
    node.portProp(port.id!, 'attrs/circle/r', port.group?.includes('Mid') ? 3 : 4);
    node.portProp(port.id!, 'attrs/text', null);
  });
}

/**
 * Highlight available ports on hover
 */
export function highlightAvailablePorts(node: Node, highlight: boolean): void {
  const ports = node.getPorts();
  
  ports.forEach(port => {
    if (highlight) {
      node.portProp(port.id!, 'attrs/circle/fill', '#e0f2fe');
      node.portProp(port.id!, 'attrs/circle/stroke', '#0284c7');
      node.portProp(port.id!, 'attrs/circle/strokeWidth', 2);
    } else {
      node.portProp(port.id!, 'attrs/circle/fill', '#fff');
      node.portProp(port.id!, 'attrs/circle/stroke', '#5F95FF');
      node.portProp(port.id!, 'attrs/circle/strokeWidth', 1.5);
    }
  });
}

/**
 * Get port label/tooltip text
 */
export function getPortLabel(portId: string): string {
  const labels: Record<string, string> = {
    top: 'Top',
    topRight: 'Top Right',
    right: 'Right',
    bottomRight: 'Bottom Right',
    bottom: 'Bottom',
    bottomLeft: 'Bottom Left',
    left: 'Left',
    topLeft: 'Top Left',
    topMid1: 'Top (25%)',
    topMid2: 'Top (75%)',
    rightMid1: 'Right (25%)',
    rightMid2: 'Right (75%)',
    bottomMid1: 'Bottom (25%)',
    bottomMid2: 'Bottom (75%)',
    leftMid1: 'Left (25%)',
    leftMid2: 'Left (75%)',
  };
  
  return labels[portId] || portId;
}

/**
 * Add port tooltips to a node
 */
export function addPortTooltips(node: Node): void {
  const ports = node.getPorts();
  
  ports.forEach(port => {
    const label = getPortLabel(port.id!);
    // Store tooltip data in port markup
    node.portProp(port.id!, 'attrs/circle/title', label);
  });
}

/**
 * Get recommended port for connection based on relative position
 */
export function getRecommendedPort(sourceNode: Node, targetNode: Node): { source: string; target: string } {
  const sourceBBox = sourceNode.getBBox();
  const targetBBox = targetNode.getBBox();
  
  const sourceCenterX = sourceBBox.x + sourceBBox.width / 2;
  const sourceCenterY = sourceBBox.y + sourceBBox.height / 2;
  const targetCenterX = targetBBox.x + targetBBox.width / 2;
  const targetCenterY = targetBBox.y + targetBBox.height / 2;
  
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;
  
  // Determine primary direction
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  let sourcePort = 'right';
  let targetPort = 'left';
  
  if (angle >= -45 && angle < 45) {
    // Right
    sourcePort = 'right';
    targetPort = 'left';
  } else if (angle >= 45 && angle < 135) {
    // Down
    sourcePort = 'bottom';
    targetPort = 'top';
  } else if (angle >= 135 || angle < -135) {
    // Left
    sourcePort = 'left';
    targetPort = 'right';
  } else {
    // Up
    sourcePort = 'top';
    targetPort = 'bottom';
  }
  
  return { source: sourcePort, target: targetPort };
}

/**
 * Show port connection statistics in console (for debugging)
 */
export function logPortStatistics(graph: Graph, node: Node): void {
  const counts = getPortConnectionCounts(graph, node);
  console.log(`Port Statistics for node ${node.id}:`);
  counts.forEach((count, portId) => {
    if (count.total > 0) {
      console.log(`  ${getPortLabel(portId)}: ${count.incoming} in, ${count.outgoing} out (${count.total} total)`);
    }
  });
}
