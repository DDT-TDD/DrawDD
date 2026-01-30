/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 32: Edge visibility matches node visibility
 * **Validates: Requirements 9.6, 9.7**
 * 
 * Tests that for any collapsed node, all edges connecting to hidden descendants
 * should be hidden; when expanded, edges to visible children should be shown.
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
    getEdges() { return Array.from(edges.values()); }
    getOutgoingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.source === node.id);
    }
    getIncomingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.target === node.id);
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
 * Get all edges connecting to descendants of a node
 */
const getDescendantEdges = (graph: any, node: any): any[] => {
  const descendantEdges: any[] = [];
  const descendants = getAllDescendants(graph, node);
  
  // Get all edges where either source or target is a descendant
  const allEdges = graph.getEdges();
  allEdges.forEach((edge: any) => {
    const sourceId = edge.getSourceCellId();
    const targetId = edge.getTargetCellId();
    
    // Check if this edge connects to any descendant
    const isDescendantEdge = descendants.some((desc: any) => 
      desc.id === sourceId || desc.id === targetId
    );
    
    if (isDescendantEdge) {
      descendantEdges.push(edge);
    }
  });
  
  return descendantEdges;
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

describe('Feature: markdown-and-folder-explorer, Property 32: Edge visibility matches node visibility', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.6** - When a node is collapsed, all edges to hidden descendants should be hidden', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // depth
        fc.integer({ min: 1, max: 3 }), // branching factor
        (depth, branchingFactor) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          // Get all edges to descendants before collapse
          const descendantEdges = getDescendantEdges(graph, rootNode);
          
          // Skip if no descendant edges
          if (descendantEdges.length === 0) {
            graph.clearCells();
            return;
          }
          
          // All edges should be visible initially
          descendantEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(true);
          });
          
          // Collapse the root node
          toggleCollapse(graph, rootNode, true);
          
          // Get all descendants (should be hidden)
          const descendants = getAllDescendants(graph, rootNode);
          descendants.forEach((descendant: any) => {
            expect(descendant.getData().visible).toBe(false);
          });
          
          // All edges connecting to hidden descendants should be hidden
          descendantEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('**Validates: Requirements 9.7** - When a node is expanded, edges to visible children should be shown', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // depth
        fc.integer({ min: 1, max: 3 }), // branching factor
        (depth, branchingFactor) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const directChildren = getDirectChildren(graph, rootNode);
          
          // Skip if no children
          if (directChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Collapse the root node first
          toggleCollapse(graph, rootNode, true);
          
          // Get edges to direct children
          const childEdges = graph.getOutgoingEdges(rootNode);
          
          // All edges should be hidden after collapse
          childEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(false);
          });
          
          // Now expand the root node
          toggleCollapse(graph, rootNode, false);
          
          // All edges to direct children should now be visible
          childEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(true);
          });
          
          // Direct children should be visible
          directChildren.forEach((child: any) => {
            expect(child.getData().visible).not.toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Edge visibility should match target node visibility', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }), // Need at least 2 levels
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          // Create a tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          // Collapse the root
          toggleCollapse(graph, rootNode, true);
          
          // Check all edges in the graph
          const allEdges = graph.getEdges();
          allEdges.forEach((edge: any) => {
            const targetId = edge.getTargetCellId();
            const targetNode = graph.getCellById(targetId);
            
            if (targetNode && targetNode.isNode()) {
              // Edge visibility should match target node visibility
              const targetVisible = targetNode.getData().visible !== false;
              const edgeVisible = edge.isVisible();
              
              expect(edgeVisible).toBe(targetVisible);
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Edges should remain hidden when parent is collapsed, even if grandparent is expanded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }), // Need at least 2 levels
        (depth) => {
          // Create a tree with at least 2 levels
          const rootNode = createMindmapTree(graph, depth, 2);
          
          const rootChildren = getDirectChildren(graph, rootNode);
          
          if (rootChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          const firstChild = rootChildren[0];
          const grandchildren = getDirectChildren(graph, firstChild);
          
          if (grandchildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Collapse the first child
          toggleCollapse(graph, firstChild, true);
          
          // Edges to grandchildren should be hidden
          const grandchildEdges = graph.getOutgoingEdges(firstChild);
          grandchildEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(false);
          });
          
          // Now collapse and expand the root
          toggleCollapse(graph, rootNode, true);
          toggleCollapse(graph, rootNode, false);
          
          // First child should be visible
          expect(firstChild.getData().visible).not.toBe(false);
          
          // But edges to grandchildren should still be hidden (because firstChild is collapsed)
          grandchildEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(false);
          });
          
          // Grandchildren should still be hidden
          grandchildren.forEach((grandchild: any) => {
            expect(grandchild.getData().visible).toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Multiple collapse/expand cycles should maintain edge-node visibility consistency', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 2, max: 5 }), // Number of cycles
        (depth, branchingFactor, cycles) => {
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const directChildren = getDirectChildren(graph, rootNode);
          
          if (directChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          const childEdges = graph.getOutgoingEdges(rootNode);
          
          // Perform multiple collapse/expand cycles
          for (let i = 0; i < cycles; i++) {
            // Collapse
            toggleCollapse(graph, rootNode, true);
            
            // Verify edges are hidden
            childEdges.forEach((edge: any) => {
              expect(edge.isVisible()).toBe(false);
            });
            
            // Verify children are hidden
            directChildren.forEach((child: any) => {
              expect(child.getData().visible).toBe(false);
            });
            
            // Expand
            toggleCollapse(graph, rootNode, false);
            
            // Verify edges are visible
            childEdges.forEach((edge: any) => {
              expect(edge.isVisible()).toBe(true);
            });
            
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

  it('Collapsing a mid-level node should hide edges to its descendants but not affect parent edges', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        (depth) => {
          // Create a tree with multiple levels
          const rootNode = createMindmapTree(graph, depth, 2);
          
          const rootChildren = getDirectChildren(graph, rootNode);
          
          if (rootChildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          const firstChild = rootChildren[0];
          const grandchildren = getDirectChildren(graph, firstChild);
          
          if (grandchildren.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Get edge from root to first child
          const rootToChildEdges = graph.getOutgoingEdges(rootNode);
          const edgeToFirstChild = rootToChildEdges.find((e: any) => 
            e.getTargetCellId() === firstChild.id
          );
          
          // Get edges from first child to grandchildren
          const childToGrandchildEdges = graph.getOutgoingEdges(firstChild);
          
          // Collapse the first child (not the root)
          toggleCollapse(graph, firstChild, true);
          
          // Edge from root to first child should still be visible
          expect(edgeToFirstChild.isVisible()).toBe(true);
          
          // First child should still be visible
          expect(firstChild.getData().visible).not.toBe(false);
          
          // Edges from first child to grandchildren should be hidden
          childToGrandchildEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(false);
          });
          
          // Grandchildren should be hidden
          grandchildren.forEach((grandchild: any) => {
            expect(grandchild.getData().visible).toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('All edges in a collapsed branch should be hidden, regardless of depth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }), // Deep tree
        (depth) => {
          // Create a linear chain (1 child per node)
          const rootNode = createMindmapTree(graph, depth, 1);
          
          // Get all edges in the tree
          const allEdges = graph.getEdges();
          
          if (allEdges.length === 0) {
            graph.clearCells();
            return;
          }
          
          // All edges should be visible initially
          allEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(true);
          });
          
          // Collapse the root
          toggleCollapse(graph, rootNode, true);
          
          // Get descendant edges (all edges except those not connected to descendants)
          const descendantEdges = getDescendantEdges(graph, rootNode);
          
          // All descendant edges should be hidden
          descendantEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Expanding a node should only show edges to direct children, not to grandchildren if children are collapsed', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          // Create a tree with multiple levels
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const directChildren = getDirectChildren(graph, rootNode);
          
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
          
          // Expand the root
          toggleCollapse(graph, rootNode, false);
          
          // Edges to direct children should be visible
          const childEdges = graph.getOutgoingEdges(rootNode);
          childEdges.forEach((edge: any) => {
            expect(edge.isVisible()).toBe(true);
          });
          
          // But edges from children to grandchildren should still be hidden
          directChildren.forEach((child: any) => {
            if (child.getData().collapsed) {
              const grandchildEdges = graph.getOutgoingEdges(child);
              grandchildEdges.forEach((edge: any) => {
                expect(edge.isVisible()).toBe(false);
              });
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Edge visibility should be consistent with node visibility after any sequence of operations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), // Random collapse operations
        (depth, operations) => {
          // Create a tree
          const rootNode = createMindmapTree(graph, depth, 2);
          
          const allNodes = graph.getNodes();
          
          // Apply random collapse operations to various nodes
          operations.forEach((shouldCollapse, index) => {
            if (index < allNodes.length) {
              const node = allNodes[index];
              const children = getDirectChildren(graph, node);
              if (children.length > 0) {
                toggleCollapse(graph, node, shouldCollapse);
              }
            }
          });
          
          // Verify edge-node visibility consistency
          const allEdges = graph.getEdges();
          allEdges.forEach((edge: any) => {
            const targetId = edge.getTargetCellId();
            const targetNode = graph.getCellById(targetId);
            
            if (targetNode && targetNode.isNode()) {
              const targetVisible = targetNode.getData().visible !== false;
              const edgeVisible = edge.isVisible();
              
              // Edge visibility must match target node visibility
              expect(edgeVisible).toBe(targetVisible);
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });
});
