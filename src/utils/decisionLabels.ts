/**
 * Decision Branch Labels for Flowcharts
 * Automatically adds Yes/No labels to edges from decision (diamond) nodes
 */

import type { Graph, Edge, Node } from '@antv/x6';

export interface BranchLabelOptions {
  autoLabel: boolean;
  yesLabel: string;
  noLabel: string;
  labelColor: string;
  labelFontSize: number;
  positionOffset: number;
}

const DEFAULT_OPTIONS: BranchLabelOptions = {
  autoLabel: true,
  yesLabel: 'Yes',
  noLabel: 'No',
  labelColor: '#666666',
  labelFontSize: 12,
  positionOffset: 0.2,
};

/**
 * Check if a node is a decision node (diamond/polygon)
 */
export function isDecisionNode(node: Node): boolean {
  const shape = node.shape;
  const attrs = node.getAttrs();
  const bodyAttrs = attrs.body || {};
  
  // Check for polygon shape with diamond points
  if (shape === 'polygon') {
    const refPoints = (bodyAttrs as any).refPoints;
    // Diamond has points at 0.5,0 1,0.5 0.5,1 0,0.5
    if (refPoints && refPoints.includes('0.5,0')) {
      return true;
    }
  }
  
  // Check data flag
  const data = node.getData() || {};
  if (data.isDecision) {
    return true;
  }

  // Check label for "decision" text
  const labelText = ((attrs.label as any)?.text || '').toLowerCase();
  if (labelText.includes('decision') || labelText.includes('if') || labelText === '?') {
    return true;
  }

  return false;
}

/**
 * Add a label to an edge
 */
export function addEdgeLabel(
  edge: Edge,
  text: string,
  position: number = 0.5,
  options: Partial<BranchLabelOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  edge.setLabels([
    {
      position: {
        distance: position,
        offset: 10,
      },
      attrs: {
        text: {
          text,
          fill: opts.labelColor,
          fontSize: opts.labelFontSize,
          fontFamily: 'system-ui, sans-serif',
        },
        rect: {
          fill: '#ffffff',
          stroke: 'transparent',
          rx: 3,
          ry: 3,
        },
      },
    },
  ]);
}

/**
 * Get the relative direction of an edge from a decision node
 * Returns 'down', 'right', 'left', 'up' based on angle
 */
function getEdgeDirection(sourceNode: Node, edge: Edge): 'down' | 'right' | 'left' | 'up' {
  const sourceBbox = sourceNode.getBBox();
  const sourceCenter = {
    x: sourceBbox.x + sourceBbox.width / 2,
    y: sourceBbox.y + sourceBbox.height / 2,
  };

  // Get target position
  const targetCell = edge.getTargetCell();
  let targetCenter: { x: number; y: number };

  if (targetCell && targetCell.isNode()) {
    const targetBbox = (targetCell as Node).getBBox();
    targetCenter = {
      x: targetBbox.x + targetBbox.width / 2,
      y: targetBbox.y + targetBbox.height / 2,
    };
  } else {
    // Use edge target point
    const target = edge.getTarget() as { x?: number; y?: number };
    targetCenter = {
      x: target.x || sourceCenter.x,
      y: target.y || sourceCenter.y,
    };
  }

  // Calculate angle
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Determine direction
  if (angle >= -45 && angle < 45) return 'right';
  if (angle >= 45 && angle < 135) return 'down';
  if (angle >= -135 && angle < -45) return 'up';
  return 'left';
}

/**
 * Auto-label branches from a decision node
 * Primary direction (usually down or right) gets "Yes"
 * Secondary direction gets "No"
 */
export function autoLabelDecisionBranches(
  graph: Graph,
  decisionNode: Node,
  options: Partial<BranchLabelOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (!isDecisionNode(decisionNode)) return;

  const outgoingEdges = graph.getOutgoingEdges(decisionNode) || [];
  
  if (outgoingEdges.length === 0) return;
  
  if (outgoingEdges.length === 1) {
    // Single branch - no labels needed
    return;
  }

  if (outgoingEdges.length === 2) {
    // Standard Yes/No branching
    const edgeDirections = outgoingEdges.map(edge => ({
      edge,
      direction: getEdgeDirection(decisionNode, edge),
    }));

    // Priority: down = Yes, right = Yes, bottom-left = Yes
    // Others = No
    const yesPriority = ['down', 'right'];
    
    edgeDirections.sort((a, b) => {
      const aPriority = yesPriority.indexOf(a.direction);
      const bPriority = yesPriority.indexOf(b.direction);
      
      if (aPriority === -1 && bPriority === -1) return 0;
      if (aPriority === -1) return 1;
      if (bPriority === -1) return -1;
      return aPriority - bPriority;
    });

    // First edge gets "Yes", second gets "No"
    addEdgeLabel(edgeDirections[0].edge, opts.yesLabel, opts.positionOffset, opts);
    addEdgeLabel(edgeDirections[1].edge, opts.noLabel, opts.positionOffset, opts);
  } else {
    // More than 2 branches - label with letters or numbers
    outgoingEdges.forEach((edge, index) => {
      const label = index === 0 ? 'A' : index === 1 ? 'B' : index === 2 ? 'C' : String(index + 1);
      addEdgeLabel(edge, label, opts.positionOffset, opts);
    });
  }
}

/**
 * Setup auto-labeling for new edges from decision nodes
 */
export function setupDecisionAutoLabeling(graph: Graph, options: Partial<BranchLabelOptions> = {}): void {
  graph.on('edge:added', ({ edge }) => {
    const sourceCell = edge.getSourceCell();
    
    if (sourceCell && sourceCell.isNode() && isDecisionNode(sourceCell as Node)) {
      // Delay to allow edge creation to complete
      setTimeout(() => {
        autoLabelDecisionBranches(graph, sourceCell as Node, options);
      }, 50);
    }
  });

  graph.on('edge:removed', ({ edge }) => {
    const sourceCell = edge.getSourceCell();
    
    if (sourceCell && sourceCell.isNode() && isDecisionNode(sourceCell as Node)) {
      // Re-label remaining edges
      setTimeout(() => {
        autoLabelDecisionBranches(graph, sourceCell as Node, options);
      }, 50);
    }
  });
}

/**
 * Label all existing decision branches in the graph
 */
export function labelAllDecisionBranches(graph: Graph, options: Partial<BranchLabelOptions> = {}): void {
  const nodes = graph.getNodes();
  
  nodes.forEach(node => {
    if (isDecisionNode(node)) {
      autoLabelDecisionBranches(graph, node, options);
    }
  });
}

/**
 * Clear labels from decision branches
 */
export function clearDecisionLabels(graph: Graph): void {
  const nodes = graph.getNodes();
  
  nodes.forEach(node => {
    if (isDecisionNode(node)) {
      const outgoingEdges = graph.getOutgoingEdges(node) || [];
      outgoingEdges.forEach(edge => {
        edge.setLabels([]);
      });
    }
  });
}

/**
 * Prompt user for custom branch labels
 */
export function promptBranchLabels(
  edge: Edge,
  defaultLabel: string = ''
): Promise<string | null> {
  return new Promise((resolve) => {
    const label = prompt('Enter branch label:', defaultLabel);
    if (label !== null) {
      addEdgeLabel(edge, label);
    }
    resolve(label);
  });
}

/**
 * Set edge as "Yes" branch
 */
export function setYesBranch(edge: Edge, options: Partial<BranchLabelOptions> = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  addEdgeLabel(edge, opts.yesLabel, opts.positionOffset, opts);
}

/**
 * Set edge as "No" branch
 */
export function setNoBranch(edge: Edge, options: Partial<BranchLabelOptions> = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  addEdgeLabel(edge, opts.noLabel, opts.positionOffset, opts);
}
