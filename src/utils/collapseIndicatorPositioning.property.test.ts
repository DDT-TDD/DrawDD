/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 34: Collapse indicator positioning
 * **Validates: Requirements 9.9**
 * 
 * Tests that for any node with children, the collapse indicator should be positioned
 * consistently relative to the node (e.g., always on the right edge for horizontal layouts).
 */

import fc from 'fast-check';
import {
  addCollapseIndicator,
  hasChildren,
  toggleCollapse,
} from './collapse';

// Mock @antv/x6
jest.mock('@antv/x6', () => {
  let globalNodeIdCounter = 0;
  let globalEdgeIdCounter = 0;

  class MockNode {
    id: string;
    data: any;
    size: { width: number; height: number };
    attrs: any;
    markup: any[];
    position: { x: number; y: number };
    graph: any;

    constructor(config: any, graph: any) {
      this.id = config.id || `node-${globalNodeIdCounter++}`;
      this.data = config.data || {};
      this.size = { width: config.width || 100, height: config.height || 50 };
      this.attrs = config.attrs || {};
      this.markup = config.markup || [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ];
      this.position = { x: config.x || 0, y: config.y || 0 };
      this.graph = graph;
    }

    getData() { return this.data; }
    setData(data: any) { this.data = data; }
    getSize() { return this.size; }
    getAttrs() { return this.attrs; }
    setAttrs(attrs: any) { this.attrs = { ...this.attrs, ...attrs }; }
    getMarkup() { return this.markup; }
    setMarkup(markup: any[]) { this.markup = markup; }
    isNode() { return true; }
    setVisible(visible: boolean) { this.data.visible = visible; }
    isVisible() { return this.data.visible !== false; }
  }

  class MockEdge {
    id: string;
    source: string;
    target: string;
    visible: boolean;
    graph: any;

    constructor(config: any, graph: any) {
      this.id = `edge-${globalEdgeIdCounter++}`;
      this.source = config.source;
      this.target = config.target;
      this.visible = true;
      this.graph = graph;
    }

    getSourceCellId() { return this.source; }
    getTargetCellId() { return this.target; }
    isNode() { return false; }
    setVisible(visible: boolean) { this.visible = visible; }
    isVisible() { return this.visible; }
  }

  class MockGraph {
    nodes: Map<string, MockNode>;
    edges: Map<string, MockEdge>;

    constructor() {
      this.nodes = new Map();
      this.edges = new Map();
    }

    addNode(config: any) {
      const node = new MockNode(config, this);
      this.nodes.set(node.id, node);
      return node;
    }

    addEdge(config: any) {
      const edge = new MockEdge(config, this);
      this.edges.set(edge.id, edge);
      return edge;
    }

    getNodes() { return Array.from(this.nodes.values()); }
    getEdges() { return Array.from(this.edges.values()); }

    getOutgoingEdges(node: MockNode) {
      return Array.from(this.edges.values()).filter((e: any) => e.source === node.id);
    }

    getCellById(id: string) {
      return this.nodes.get(id) || this.edges.get(id);
    }

    removeNode(node: MockNode) {
      this.nodes.delete(node.id);
      Array.from(this.edges.values()).forEach((edge: any) => {
        if (edge.source === node.id || edge.target === node.id) {
          this.edges.delete(edge.id);
        }
      });
    }

    clearCells() {
      this.nodes.clear();
      this.edges.clear();
    }

    dispose() { this.clearCells(); }
  }

  return { Graph: MockGraph };
});

import { Graph } from '@antv/x6';

const createTestGraph = (): any => new (Graph as any)();

/**
 * Create a mindmap tree structure for testing
 */
const createMindmapTree = (
  graph: any,
  depth: number,
  branchingFactor: number,
  parentId?: string,
  level: number = 1
): any => {
  const nodeId = parentId ? `${parentId}-${level}` : `root`;
  const node = graph.addNode({
    id: nodeId,
    data: { isMindmap: true, level, collapsed: false },
    width: 100,
    height: 50,
  });

  if (depth > 0) {
    for (let i = 0; i < branchingFactor; i++) {
      const child = createMindmapTree(graph, depth - 1, branchingFactor, nodeId, level + 1);
      graph.addEdge({ source: nodeId, target: child.id });
    }
  }

  return node;
};

/**
 * Get the position of the collapse indicator from node attributes
 */
const getCollapseIndicatorPosition = (node: any): { x: number; y: number } | null => {
  const attrs = node.getAttrs();
  if (!attrs.collapseIndicator) {
    return null;
  }
  
  return {
    x: attrs.collapseIndicator.cx,
    y: attrs.collapseIndicator.cy,
  };
};

/**
 * Get the position of the collapse icon from node attributes
 */
const getCollapseIconPosition = (node: any): { x: number; y: number } | null => {
  const attrs = node.getAttrs();
  if (!attrs.collapseIcon) {
    return null;
  }
  
  return {
    x: attrs.collapseIcon.x,
    y: attrs.collapseIcon.y,
  };
};

/**
 * Check if indicator is positioned on the right edge of the node
 */
const isPositionedOnRightEdge = (node: any, indicatorPos: { x: number; y: number }): boolean => {
  const size = node.getSize();
  const indicatorSize = 16; // From collapse.ts implementation
  
  // Indicator should be at width - indicatorSize/2
  const expectedX = size.width - indicatorSize / 2;
  
  return Math.abs(indicatorPos.x - expectedX) < 0.01; // Allow small floating point differences
};

/**
 * Check if indicator is vertically centered on the node
 */
const isVerticallyCentered = (node: any, indicatorPos: { x: number; y: number }): boolean => {
  const size = node.getSize();
  
  // Indicator should be at height / 2
  const expectedY = size.height / 2;
  
  return Math.abs(indicatorPos.y - expectedY) < 0.01; // Allow small floating point differences
};

describe('Feature: markdown-and-folder-explorer, Property 34: Collapse indicator positioning', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.9** - Collapse indicator should be positioned consistently on the right edge', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 300 }), // Node width
        fc.integer({ min: 30, max: 150 }), // Node height
        fc.integer({ min: 1, max: 3 }),    // Number of children
        (width, height, numChildren) => {
          // Create a parent node with specified dimensions
          const parentNode = graph.addNode({
            id: 'parent',
            data: { isMindmap: true, level: 1, collapsed: false },
            width,
            height,
          });
          
          // Add children
          for (let i = 0; i < numChildren; i++) {
            const child = graph.addNode({
              id: `child-${i}`,
              data: { isMindmap: true, level: 2 },
              width: 100,
              height: 50,
            });
            graph.addEdge({ source: parentNode.id, target: child.id });
          }
          
          // Add collapse indicator
          addCollapseIndicator(parentNode, true);
          
          // Get indicator position
          const indicatorPos = getCollapseIndicatorPosition(parentNode);
          const iconPos = getCollapseIconPosition(parentNode);
          
          // Verify indicator exists
          expect(indicatorPos).not.toBeNull();
          expect(iconPos).not.toBeNull();
          
          if (indicatorPos && iconPos) {
            // Verify indicator is on the right edge
            expect(isPositionedOnRightEdge(parentNode, indicatorPos)).toBe(true);
            
            // Verify indicator is vertically centered
            expect(isVerticallyCentered(parentNode, indicatorPos)).toBe(true);
            
            // Verify icon is at the same position as the indicator circle
            expect(Math.abs(iconPos.x - indicatorPos.x)).toBeLessThan(0.01);
            expect(Math.abs(iconPos.y - indicatorPos.y)).toBeLessThan(0.01);
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Indicator position should remain consistent across different node sizes', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            width: fc.integer({ min: 50, max: 300 }),
            height: fc.integer({ min: 30, max: 150 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (nodeSizes) => {
          const nodes: any[] = [];
          
          // Create nodes with different sizes
          nodeSizes.forEach((size, index) => {
            const node = graph.addNode({
              id: `node-${index}`,
              data: { isMindmap: true, level: 1 },
              width: size.width,
              height: size.height,
            });
            
            // Add a child to each node
            const child = graph.addNode({
              id: `child-${index}`,
              data: { isMindmap: true, level: 2 },
              width: 100,
              height: 50,
            });
            graph.addEdge({ source: node.id, target: child.id });
            
            nodes.push(node);
          });
          
          // Add indicators to all nodes
          nodes.forEach(node => {
            addCollapseIndicator(node, true);
          });
          
          // Verify all indicators follow the same positioning rule
          nodes.forEach(node => {
            const indicatorPos = getCollapseIndicatorPosition(node);
            expect(indicatorPos).not.toBeNull();
            
            if (indicatorPos) {
              // All indicators should be on the right edge
              expect(isPositionedOnRightEdge(node, indicatorPos)).toBe(true);
              
              // All indicators should be vertically centered
              expect(isVerticallyCentered(node, indicatorPos)).toBe(true);
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Indicator position should not change when toggling collapse state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 30, max: 100 }),
        fc.integer({ min: 2, max: 5 }), // Number of toggle cycles
        (width, height, cycles) => {
          // Create a node with children
          const node = graph.addNode({
            id: 'node',
            data: { isMindmap: true, level: 1, collapsed: false },
            width,
            height,
          });
          
          const child = graph.addNode({
            id: 'child',
            data: { isMindmap: true, level: 2 },
            width: 100,
            height: 50,
          });
          graph.addEdge({ source: node.id, target: child.id });
          
          // Add indicator
          addCollapseIndicator(node, true);
          
          // Get initial position
          const initialPos = getCollapseIndicatorPosition(node);
          expect(initialPos).not.toBeNull();
          
          if (initialPos) {
            // Perform multiple collapse/expand cycles
            for (let i = 0; i < cycles; i++) {
              // Collapse
              toggleCollapse(graph, node, true);
              const collapsedPos = getCollapseIndicatorPosition(node);
              expect(collapsedPos).not.toBeNull();
              
              if (collapsedPos) {
                // Position should remain the same
                expect(collapsedPos.x).toBe(initialPos.x);
                expect(collapsedPos.y).toBe(initialPos.y);
              }
              
              // Expand
              toggleCollapse(graph, node, false);
              const expandedPos = getCollapseIndicatorPosition(node);
              expect(expandedPos).not.toBeNull();
              
              if (expandedPos) {
                // Position should remain the same
                expect(expandedPos.x).toBe(initialPos.x);
                expect(expandedPos.y).toBe(initialPos.y);
              }
            }
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Indicator position should be consistent across all nodes in a tree', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // Tree depth
        fc.integer({ min: 1, max: 3 }), // Branching factor
        (depth, branchingFactor) => {
          // Create a mindmap tree
          createMindmapTree(graph, depth, branchingFactor);
          
          // Add indicators to all nodes with children
          const allNodes = graph.getNodes();
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            if (nodeHasChildren) {
              addCollapseIndicator(node, true);
            }
          });
          
          // Verify all indicators follow the same positioning rule
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            
            if (nodeHasChildren) {
              const indicatorPos = getCollapseIndicatorPosition(node);
              expect(indicatorPos).not.toBeNull();
              
              if (indicatorPos) {
                // Should be on right edge
                expect(isPositionedOnRightEdge(node, indicatorPos)).toBe(true);
                
                // Should be vertically centered
                expect(isVerticallyCentered(node, indicatorPos)).toBe(true);
              }
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Indicator position should be consistent for folder explorer nodes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 30, max: 100 }),
        fc.constantFrom('linked' as const, 'static' as const),
        (width, height, explorerType) => {
          // Create a folder explorer node
          const node = graph.addNode({
            id: 'folder-node',
            data: {
              isMindmap: true,
              level: 1,
              collapsed: false,
              folderExplorer: {
                isFolderExplorer: true,
                explorerType: explorerType,
                path: '/test/path',
                isDirectory: true,
                isReadOnly: explorerType === 'linked',
              },
            },
            width,
            height,
          });
          
          // Add a child
          const child = graph.addNode({
            id: 'child',
            data: {
              isMindmap: true,
              level: 2,
              folderExplorer: {
                isFolderExplorer: true,
                explorerType: explorerType,
                path: '/test/path/child',
                isDirectory: false,
                isReadOnly: explorerType === 'linked',
              },
            },
            width: 100,
            height: 50,
          });
          graph.addEdge({ source: node.id, target: child.id });
          
          // Add indicator
          addCollapseIndicator(node, true);
          
          // Verify position follows the same rule
          const indicatorPos = getCollapseIndicatorPosition(node);
          expect(indicatorPos).not.toBeNull();
          
          if (indicatorPos) {
            expect(isPositionedOnRightEdge(node, indicatorPos)).toBe(true);
            expect(isVerticallyCentered(node, indicatorPos)).toBe(true);
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Indicator and icon should be co-located at the same position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 30, max: 150 }),
        (width, height) => {
          // Create a node with children
          const node = graph.addNode({
            id: 'node',
            data: { isMindmap: true, level: 1, collapsed: false },
            width,
            height,
          });
          
          const child = graph.addNode({
            id: 'child',
            data: { isMindmap: true, level: 2 },
            width: 100,
            height: 50,
          });
          graph.addEdge({ source: node.id, target: child.id });
          
          // Add indicator
          addCollapseIndicator(node, true);
          
          // Get positions
          const indicatorPos = getCollapseIndicatorPosition(node);
          const iconPos = getCollapseIconPosition(node);
          
          expect(indicatorPos).not.toBeNull();
          expect(iconPos).not.toBeNull();
          
          if (indicatorPos && iconPos) {
            // Indicator circle and icon text should be at the same position
            expect(Math.abs(indicatorPos.x - iconPos.x)).toBeLessThan(0.01);
            expect(Math.abs(indicatorPos.y - iconPos.y)).toBeLessThan(0.01);
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 40 }
    );
  });

  it('Indicator position should be independent of node position in canvas', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // Node x position
        fc.integer({ min: 0, max: 1000 }), // Node y position
        fc.integer({ min: 50, max: 200 }), // Node width
        fc.integer({ min: 30, max: 100 }), // Node height
        (x, y, width, height) => {
          // Create a node at a specific position
          const node = graph.addNode({
            id: 'node',
            data: { isMindmap: true, level: 1, collapsed: false },
            x,
            y,
            width,
            height,
          });
          
          const child = graph.addNode({
            id: 'child',
            data: { isMindmap: true, level: 2 },
            width: 100,
            height: 50,
          });
          graph.addEdge({ source: node.id, target: child.id });
          
          // Add indicator
          addCollapseIndicator(node, true);
          
          // Get indicator position
          const indicatorPos = getCollapseIndicatorPosition(node);
          expect(indicatorPos).not.toBeNull();
          
          if (indicatorPos) {
            // Position should be relative to node size, not canvas position
            // The indicator should still be on the right edge and vertically centered
            expect(isPositionedOnRightEdge(node, indicatorPos)).toBe(true);
            expect(isVerticallyCentered(node, indicatorPos)).toBe(true);
            
            // The indicator position should be independent of canvas position
            // It should only depend on node size
            const indicatorSize = 16;
            const expectedX = width - indicatorSize / 2;
            const expectedY = height / 2;
            
            expect(Math.abs(indicatorPos.x - expectedX)).toBeLessThan(0.01);
            expect(Math.abs(indicatorPos.y - expectedY)).toBeLessThan(0.01);
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 40 }
    );
  });

  it('Indicator position should be consistent for nodes at different tree depths', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 6 }), // Deep tree
        (depth) => {
          // Create a linear chain (1 child per node)
          createMindmapTree(graph, depth, 1);
          
          // Add indicators to all nodes
          const allNodes = graph.getNodes();
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            if (nodeHasChildren) {
              addCollapseIndicator(node, true);
            }
          });
          
          // Verify all indicators at all depths follow the same positioning rule
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            
            if (nodeHasChildren) {
              const indicatorPos = getCollapseIndicatorPosition(node);
              expect(indicatorPos).not.toBeNull();
              
              if (indicatorPos) {
                // Positioning rule should be consistent regardless of depth
                expect(isPositionedOnRightEdge(node, indicatorPos)).toBe(true);
                expect(isVerticallyCentered(node, indicatorPos)).toBe(true);
              }
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 25 }
    );
  });

  it('Re-adding indicator should maintain consistent position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        fc.integer({ min: 30, max: 100 }),
        fc.integer({ min: 2, max: 4 }), // Number of re-add cycles
        (width, height, cycles) => {
          // Create a node with children
          const node = graph.addNode({
            id: 'node',
            data: { isMindmap: true, level: 1, collapsed: false },
            width,
            height,
          });
          
          const child = graph.addNode({
            id: 'child',
            data: { isMindmap: true, level: 2 },
            width: 100,
            height: 50,
          });
          graph.addEdge({ source: node.id, target: child.id });
          
          let previousPos: { x: number; y: number } | null = null;
          
          // Add and re-add indicator multiple times
          for (let i = 0; i < cycles; i++) {
            addCollapseIndicator(node, true);
            
            const currentPos = getCollapseIndicatorPosition(node);
            expect(currentPos).not.toBeNull();
            
            if (currentPos) {
              // Should be positioned correctly
              expect(isPositionedOnRightEdge(node, currentPos)).toBe(true);
              expect(isVerticallyCentered(node, currentPos)).toBe(true);
              
              // Should be at the same position as previous iteration
              if (previousPos) {
                expect(currentPos.x).toBe(previousPos.x);
                expect(currentPos.y).toBe(previousPos.y);
              }
              
              previousPos = currentPos;
            }
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 25 }
    );
  });
});
