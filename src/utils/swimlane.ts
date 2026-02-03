/**
 * Swimlane System for Flowcharts
 * Provides swimlane containers for organizing flowchart elements by role/department
 */

import type { Graph, Node } from '@antv/x6';
import { getNextThemeColors } from './theme';

export interface SwimlaneConfig {
  id: string;
  title: string;
  color?: string;
  width?: number;
  height?: number;
}

export interface SwimlanesOptions {
  direction: 'horizontal' | 'vertical';
  laneWidth: number;
  laneHeight: number;
  headerSize: number;
  padding: number;
  spacing: number;
  colorScheme: string;
}

const DEFAULT_OPTIONS: SwimlanesOptions = {
  direction: 'horizontal',
  laneWidth: 300,
  laneHeight: 600,
  headerSize: 40,
  padding: 20,
  spacing: 0,
  colorScheme: 'default',
};

// Pastel colors for swimlanes
const SWIMLANE_COLORS = [
  '#E3F2FD', // Light Blue
  '#F3E5F5', // Light Purple
  '#E8F5E9', // Light Green
  '#FFF3E0', // Light Orange
  '#FCE4EC', // Light Pink
  '#E0F7FA', // Light Cyan
  '#FFF8E1', // Light Amber
  '#F1F8E9', // Light Lime
];

/**
 * Create swimlane container nodes
 */
export function createSwimlanes(
  graph: Graph,
  lanes: SwimlaneConfig[],
  options: Partial<SwimlanesOptions> = {}
): Node[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { direction, laneWidth, laneHeight, headerSize, padding, spacing } = opts;
  
  const isHorizontal = direction === 'horizontal';
  const createdNodes: Node[] = [];

  lanes.forEach((lane, index) => {
    const color = lane.color || SWIMLANE_COLORS[index % SWIMLANE_COLORS.length];
    
    let x: number, y: number, width: number, height: number;
    
    if (isHorizontal) {
      // Lanes side by side (vertical lanes)
      x = padding + index * (laneWidth + spacing);
      y = padding;
      width = laneWidth;
      height = laneHeight;
    } else {
      // Lanes stacked (horizontal lanes)
      x = padding;
      y = padding + index * (laneHeight + spacing);
      width = laneWidth;
      height = laneHeight;
    }

    // Create the swimlane container
    const swimlane = graph.addNode({
      x,
      y,
      width,
      height,
      shape: 'rect',
      zIndex: -1, // Behind other nodes
      attrs: {
        body: {
          fill: color,
          stroke: '#9E9E9E',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
        label: {
          text: lane.title,
          fill: '#424242',
          fontSize: 14,
          fontWeight: 'bold',
          refX: isHorizontal ? 0.5 : headerSize / 2,
          refY: isHorizontal ? headerSize / 2 : 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          // Rotate text for vertical header
          transform: isHorizontal ? undefined : 'rotate(-90)',
        },
      },
      data: {
        isSwimlane: true,
        swimlaneId: lane.id,
        swimlaneTitle: lane.title,
        swimlaneIndex: index,
        swimlaneDirection: direction,
      },
    });

    // Add a header separator line
    const headerLine = isHorizontal
      ? graph.addNode({
          x: x,
          y: y + headerSize,
          width: width,
          height: 1,
          shape: 'rect',
          zIndex: 0,
          attrs: {
            body: {
              fill: '#9E9E9E',
              stroke: 'transparent',
            },
          },
          data: {
            isSwimlaneHeader: true,
            parentSwimlane: lane.id,
          },
        })
      : graph.addNode({
          x: x + headerSize,
          y: y,
          width: 1,
          height: height,
          shape: 'rect',
          zIndex: 0,
          attrs: {
            body: {
              fill: '#9E9E9E',
              stroke: 'transparent',
            },
          },
          data: {
            isSwimlaneHeader: true,
            parentSwimlane: lane.id,
          },
        });

    swimlane.addChild(headerLine);
    createdNodes.push(swimlane);
  });

  return createdNodes;
}

/**
 * Quick swimlane templates
 */
export const SWIMLANE_TEMPLATES = {
  departments: [
    { id: 'sales', title: 'Sales' },
    { id: 'marketing', title: 'Marketing' },
    { id: 'engineering', title: 'Engineering' },
    { id: 'support', title: 'Support' },
  ],
  roles: [
    { id: 'customer', title: 'Customer' },
    { id: 'frontend', title: 'Frontend' },
    { id: 'backend', title: 'Backend' },
    { id: 'database', title: 'Database' },
  ],
  phases: [
    { id: 'planning', title: 'Planning' },
    { id: 'development', title: 'Development' },
    { id: 'testing', title: 'Testing' },
    { id: 'deployment', title: 'Deployment' },
  ],
  simple: [
    { id: 'lane1', title: 'Lane 1' },
    { id: 'lane2', title: 'Lane 2' },
    { id: 'lane3', title: 'Lane 3' },
  ],
};

/**
 * Get swimlane that contains a given position
 */
export function getSwimlaneAtPosition(graph: Graph, x: number, y: number): Node | null {
  const nodes = graph.getNodes();
  
  for (const node of nodes) {
    const data = node.getData() || {};
    if (data.isSwimlane) {
      const bbox = node.getBBox();
      if (x >= bbox.x && x <= bbox.x + bbox.width &&
          y >= bbox.y && y <= bbox.y + bbox.height) {
        return node;
      }
    }
  }
  
  return null;
}

/**
 * Get all swimlanes in the graph
 */
export function getSwimlanes(graph: Graph): Node[] {
  return graph.getNodes().filter(node => {
    const data = node.getData() || {};
    return data.isSwimlane === true;
  });
}

/**
 * Resize all swimlanes to match dimensions
 */
export function resizeSwimlanes(
  graph: Graph,
  width?: number,
  height?: number
): void {
  const swimlanes = getSwimlanes(graph);
  
  swimlanes.forEach(lane => {
    const currentSize = lane.getSize();
    lane.resize(
      width ?? currentSize.width,
      height ?? currentSize.height
    );
  });
}

/**
 * Add a new swimlane to existing layout
 */
export function addSwimlane(
  graph: Graph,
  title: string,
  options: Partial<SwimlanesOptions> = {}
): Node | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const existingLanes = getSwimlanes(graph);
  
  if (existingLanes.length === 0) {
    // No existing lanes, create first one
    const lanes = createSwimlanes(graph, [{ id: `lane-${Date.now()}`, title }], opts);
    return lanes[0] || null;
  }

  // Find the position for new lane
  const lastLane = existingLanes[existingLanes.length - 1];
  const lastBbox = lastLane.getBBox();
  const lastData = lastLane.getData() || {};
  const direction = lastData.swimlaneDirection || 'horizontal';
  const isHorizontal = direction === 'horizontal';
  
  const color = SWIMLANE_COLORS[existingLanes.length % SWIMLANE_COLORS.length];

  const newLane = graph.addNode({
    x: isHorizontal ? lastBbox.x + lastBbox.width + opts.spacing : lastBbox.x,
    y: isHorizontal ? lastBbox.y : lastBbox.y + lastBbox.height + opts.spacing,
    width: lastBbox.width,
    height: lastBbox.height,
    shape: 'rect',
    zIndex: -1,
    attrs: {
      body: {
        fill: color,
        stroke: '#9E9E9E',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
      label: {
        text: title,
        fill: '#424242',
        fontSize: 14,
        fontWeight: 'bold',
        refX: isHorizontal ? 0.5 : opts.headerSize / 2,
        refY: isHorizontal ? opts.headerSize / 2 : 0.5,
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        transform: isHorizontal ? undefined : 'rotate(-90)',
      },
    },
    data: {
      isSwimlane: true,
      swimlaneId: `lane-${Date.now()}`,
      swimlaneTitle: title,
      swimlaneIndex: existingLanes.length,
      swimlaneDirection: direction,
    },
  });

  return newLane;
}

/**
 * Remove a swimlane (but keep contained nodes)
 */
export function removeSwimlane(graph: Graph, lane: Node): void {
  const data = lane.getData() || {};
  if (!data.isSwimlane) return;

  // Get all children first
  const children = lane.getChildren() || [];
  
  // Remove children from parent
  children.forEach(child => {
    lane.removeChild(child);
    // Delete header lines
    if ((child.getData() || {}).isSwimlaneHeader) {
      graph.removeCell(child);
    }
  });

  // Remove the swimlane
  graph.removeNode(lane);
}
