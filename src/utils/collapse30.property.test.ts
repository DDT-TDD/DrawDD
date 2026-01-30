/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 30: Expand shows children
 * **Validates: Requirements 9.3**
 * 
 * Tests that for any collapsed node that is expanded, all direct children should become visible.
 */

import fc from 'fast-check';
import {
  toggleCollapse,
  getAllDescendants,
} from './collapse';

// Mock @antv/x6
jest.mock('@antv/x6', () => {
  const nodes = new Map();
  const edges = new Map();
  let nodeIdCounter = 0;
  let edgeIdCounter = 0;

  class MockNode {
    id: string;
    data: any;
    size: { width: number; height: number };
    attrs: any;
    markup: any[];

    constructor(config: any) {
      this.id = config.id || `node-${nodeIdCounter++}`;
      this.data = config.data || {};
      this.size = { width: config.width || 100, height: config.height || 50 };
      this.attrs = config.attrs || {};
      this.markup = config.markup || [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ];
      nodes.set(this.id, this);
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

    constructor(config: any) {
      this.id = `edge-${edgeIdCounter++}`;
      this.source = config.source;
      this.target = config.target;
      this.visible = true;
      edges.set(this.id, this);
    }

    getSourceCellId() { return this.source; }
    getTargetCellId() { return this.target; }
    isNode() { return false; }
    setVisible(visible: boolean) { this.visible = visible; }
    isVisible() { return this.visible; }
  }

  class MockGraph {
    constructor() {
      nodes.clear();
      edges.clear();
      nodeIdCounter = 0;
      edgeIdCounter = 0;
    }

    addNode(config: any) { return new MockNode(config); }
    addEdge(config: any) { return new MockEdge(config); }
    getNodes() { return Array.from(nodes.values()); }
    getOutgoingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.source === node.id);
    }
    getCellById(id: string) {
      return nodes.get(id) || edges.get(id);
    }
    removeNode(node: MockNode) {
      nodes.delete(node.id);
      Array.from(edges.values()).forEach((edge: any) => {
        if (edge.source === node.id || edge.target === node.id) {
          edges.delete(edge.id);
        }
      });
    }
    clearCells() {
      nodes.clear();
      edges.clear();
    }
    dispose() { this.clearCells(); }
  }

  return { Graph: MockGraph };
});

import { Graph } from '@antv/x6';

const createTestGraph = (): any => new (Graph as any)();

/**
 * Create a mindmap tree structure for testing
 * @param graph - The graph instance
 * @param depth - How many levels deep to create
 * @param branchingFactor - How many children each node should have
 * @param parentId - Parent node ID (for recursion)
 * @param level - Current level (for recursion)
 * @returns The root node of the created tree
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
 * Get direct children of a node
 */
const getDirectChildren = (graph: any, node: any): any[] => {
  const children: any[] = [];
  const outgoingEdges = graph.getOutgoingEdges(node);
  
  if (outgoingEdges) {
    outgoingEdges.forEach((edge: any) => {
      const childId = edge.getTargetCellId();
      const child = graph.getCellById(childId);
      if (child && child.isNode()) {
        children.push(child);
      }
    });
  }
  
  return children;
};

describe('Feature: markdown-and-folder-explorer, Property 30: Expand shows children', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.3** - Expanding a collapsed node should show all direct children', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // depth
        fc.integer({ min: 1, max: 4 }), // branching factor
        (depth, branchingFactor) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          // Get direct children before any operations
          const directChildren = getDirectChildren(graph, rootNode);
          
          // Skip test if node has no children
          if (directChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Collapse the root node
          toggleCollapse(graph, rootNode, true);
          
          // Verify all direct children are hidden
          directChildren.forEach((child: any) => {
            expect(child.getData().visible).toBe(false);
          });
          
          // Now expand the root node
          toggleCollapse(graph, rootNode, false);
          
          // Verify the node is marked as not collapsed
          expect(rootNode.getData().collapsed).toBe(false);
          
          // ALL direct children should now be visible
          directChildren.forEach((child: any) => {
            expect(child.getData().visible).not.toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Expanding should only show direct children, not grandchildren if children are collapsed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }), // Need at least 2 levels
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          // Create a tree with multiple levels
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const directChildren = getDirectChildren(graph, rootNode);
          
          // Skip if no children
          if (directChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Collapse all direct children first
          directChildren.forEach((child: any) => {
            const grandchildren = getDirectChildren(graph, child);
            if (grandchildren.length > 0) {
              toggleCollapse(graph, child, true);
            }
          });
          
          // Now collapse the root
          toggleCollapse(graph, rootNode, true);
          
          // All descendants should be hidden
          const allDescendants = getAllDescendants(graph, rootNode);
          allDescendants.forEach((descendant: any) => {
            expect(descendant.getData().visible).toBe(false);
          });
          
          // Expand the root
          toggleCollapse(graph, rootNode, false);
          
          // Direct children should be visible
          directChildren.forEach((child: any) => {
            expect(child.getData().visible).not.toBe(false);
          });
          
          // But grandchildren should still be hidden (because their parents are collapsed)
          directChildren.forEach((child: any) => {
            const grandchildren = getDirectChildren(graph, child);
            if (child.getData().collapsed && grandchildren.length > 0) {
              grandchildren.forEach((grandchild: any) => {
                expect(grandchild.getData().visible).toBe(false);
              });
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Expanding a node multiple times should consistently show direct children', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 2, max: 5 }), // Number of expand/collapse cycles
        (depth, branchingFactor, cycles) => {
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          const directChildren = getDirectChildren(graph, rootNode);
          
          if (directChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Perform multiple collapse/expand cycles
          for (let i = 0; i < cycles; i++) {
            // Collapse
            toggleCollapse(graph, rootNode, true);
            
            // Verify children are hidden
            directChildren.forEach((child: any) => {
              expect(child.getData().visible).toBe(false);
            });
            
            // Expand
            toggleCollapse(graph, rootNode, false);
            
            // Verify children are visible
            directChildren.forEach((child: any) => {
              expect(child.getData().visible).not.toBe(false);
            });
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Expanding a mid-level node should show its direct children without affecting siblings', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        (depth) => {
          // Create a tree with at least 2 children per node
          const rootNode = createMindmapTree(graph, depth, 2);
          
          const rootChildren = getDirectChildren(graph, rootNode);
          
          // Need at least 2 children to test sibling isolation
          if (rootChildren.length < 2) {
            graph.clearCells();
            return;
          }
          
          const firstChild = rootChildren[0];
          const secondChild = rootChildren[1];
          
          const firstChildChildren = getDirectChildren(graph, firstChild);
          const secondChildChildren = getDirectChildren(graph, secondChild);
          
          // Collapse the first child
          if (firstChildChildren.length > 0) {
            toggleCollapse(graph, firstChild, true);
            
            // Verify first child's children are hidden
            firstChildChildren.forEach((child: any) => {
              expect(child.getData().visible).toBe(false);
            });
            
            // Expand the first child
            toggleCollapse(graph, firstChild, false);
            
            // Verify first child's children are now visible
            firstChildChildren.forEach((child: any) => {
              expect(child.getData().visible).not.toBe(false);
            });
            
            // Verify second child and its children are unaffected
            expect(secondChild.getData().visible).not.toBe(false);
            secondChildChildren.forEach((child: any) => {
              expect(child.getData().visible).not.toBe(false);
            });
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Expanding a leaf node (no children) should not cause errors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (depth) => {
          const rootNode = createMindmapTree(graph, depth, 2);
          
          // Find a leaf node (node with no children)
          const allNodes = graph.getNodes();
          const leafNodes = allNodes.filter((node: any) => {
            const children = getDirectChildren(graph, node);
            return children.length === 0;
          });
          
          if (leafNodes.length > 0) {
            const leafNode = leafNodes[0];
            
            // Try to collapse and expand a leaf node
            // This should not cause errors
            expect(() => {
              toggleCollapse(graph, leafNode, true);
              toggleCollapse(graph, leafNode, false);
            }).not.toThrow();
            
            // Leaf node should remain visible
            expect(leafNode.getData().visible).not.toBe(false);
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Expanding should show edges to direct children', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const outgoingEdges = graph.getOutgoingEdges(rootNode);
          
          if (!outgoingEdges || outgoingEdges.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Collapse the node
          toggleCollapse(graph, rootNode, true);
          
          // Edges should be hidden
          outgoingEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(false);
          });
          
          // Expand the node
          toggleCollapse(graph, rootNode, false);
          
          // Edges should be visible
          outgoingEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(true);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Expanding preserves the expanded state in node data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const directChildren = getDirectChildren(graph, rootNode);
          
          if (directChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Collapse
          toggleCollapse(graph, rootNode, true);
          expect(rootNode.getData().collapsed).toBe(true);
          
          // Expand
          toggleCollapse(graph, rootNode, false);
          expect(rootNode.getData().collapsed).toBe(false);
          
          // Children should be visible
          directChildren.forEach((child: any) => {
            expect(child.getData().visible).not.toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });
});
