/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 33: Collapsed vs leaf visual distinction
 * **Validates: Requirements 9.8**
 * 
 * Tests that for any node, the collapse indicator should visually distinguish between
 * collapsed nodes (has hidden children) and leaf nodes (no children).
 */

import fc from 'fast-check';
import {
  toggleCollapse,
  addCollapseIndicator,
  hasChildren,
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

/**
 * Check if a node has a collapse indicator in its markup
 */
const hasCollapseIndicatorInMarkup = (node: any): boolean => {
  const markup = node.getMarkup();
  return markup.some((item: any) => 
    item.selector === 'collapseIndicator' || item.selector === 'collapseIcon'
  );
};

/**
 * Get the collapse indicator icon text from node attributes
 */
const getCollapseIndicatorIcon = (node: any): string | null => {
  const attrs = node.getAttrs();
  return attrs.collapseIcon?.text || null;
};

describe('Feature: markdown-and-folder-explorer, Property 33: Collapsed vs leaf visual distinction', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.8** - Collapsed nodes should show collapse indicator, leaf nodes should not', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // depth
        fc.integer({ min: 1, max: 3 }), // branching factor
        (depth, branchingFactor) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          // Get all nodes in the tree
          const allNodes = graph.getNodes();
          
          // Separate nodes into those with children and leaf nodes
          const nodesWithChildren: any[] = [];
          const leafNodes: any[] = [];
          
          allNodes.forEach((node: any) => {
            const children = getDirectChildren(graph, node);
            if (children.length > 0) {
              nodesWithChildren.push(node);
            } else {
              leafNodes.push(node);
            }
          });
          
          // Add collapse indicators to all nodes with children
          nodesWithChildren.forEach((node: any) => {
            addCollapseIndicator(node, true);
          });
          
          // Ensure leaf nodes don't have indicators
          leafNodes.forEach((node: any) => {
            addCollapseIndicator(node, false);
          });
          
          // Verify: Nodes with children should have collapse indicators
          nodesWithChildren.forEach((node: any) => {
            expect(hasCollapseIndicatorInMarkup(node)).toBe(true);
            const icon = getCollapseIndicatorIcon(node);
            expect(icon).not.toBeNull();
            // Should show either collapsed (▶) or expanded (▼) icon
            expect(['▶', '▼']).toContain(icon);
          });
          
          // Verify: Leaf nodes should NOT have collapse indicators
          leafNodes.forEach((node: any) => {
            expect(hasCollapseIndicatorInMarkup(node)).toBe(false);
            const icon = getCollapseIndicatorIcon(node);
            expect(icon).toBeNull();
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Collapsed nodes should show ▶ icon, expanded nodes with children should show ▼ icon', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          // Create a tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const children = getDirectChildren(graph, rootNode);
          
          // Skip if no children
          if (children.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Add indicator and verify expanded state (default)
          addCollapseIndicator(rootNode, true);
          let icon = getCollapseIndicatorIcon(rootNode);
          expect(icon).toBe('▼'); // Expanded icon
          
          // Collapse the node
          toggleCollapse(graph, rootNode, true);
          icon = getCollapseIndicatorIcon(rootNode);
          expect(icon).toBe('▶'); // Collapsed icon
          
          // Expand the node again
          toggleCollapse(graph, rootNode, false);
          icon = getCollapseIndicatorIcon(rootNode);
          expect(icon).toBe('▼'); // Expanded icon again
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Leaf nodes should never show collapse indicator regardless of operations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        (depth) => {
          // Create a tree
          const rootNode = createMindmapTree(graph, depth, 2);
          
          // Find all leaf nodes
          const allNodes = graph.getNodes();
          const leafNodes = allNodes.filter((node: any) => {
            const children = getDirectChildren(graph, node);
            return children.length === 0;
          });
          
          if (leafNodes.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Try to add collapse indicator to leaf nodes
          leafNodes.forEach((leafNode: any) => {
            addCollapseIndicator(leafNode, false);
            
            // Verify no indicator is added
            expect(hasCollapseIndicatorInMarkup(leafNode)).toBe(false);
            expect(getCollapseIndicatorIcon(leafNode)).toBeNull();
            
            // Try to toggle collapse on leaf node (should not cause errors)
            expect(() => {
              toggleCollapse(graph, leafNode, true);
              toggleCollapse(graph, leafNode, false);
            }).not.toThrow();
            
            // Still should not have indicator
            expect(hasCollapseIndicatorInMarkup(leafNode)).toBe(false);
            expect(getCollapseIndicatorIcon(leafNode)).toBeNull();
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Visual distinction should be maintained after multiple collapse/expand cycles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 2, max: 5 }), // Number of cycles
        (depth, branchingFactor, cycles) => {
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const children = getDirectChildren(graph, rootNode);
          
          if (children.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Add indicator
          addCollapseIndicator(rootNode, true);
          
          // Perform multiple collapse/expand cycles
          for (let i = 0; i < cycles; i++) {
            // Collapse
            toggleCollapse(graph, rootNode, true);
            expect(hasCollapseIndicatorInMarkup(rootNode)).toBe(true);
            expect(getCollapseIndicatorIcon(rootNode)).toBe('▶');
            
            // Expand
            toggleCollapse(graph, rootNode, false);
            expect(hasCollapseIndicatorInMarkup(rootNode)).toBe(true);
            expect(getCollapseIndicatorIcon(rootNode)).toBe('▼');
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('hasChildren utility should correctly identify nodes with and without children', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          const allNodes = graph.getNodes();
          
          allNodes.forEach((node: any) => {
            const children = getDirectChildren(graph, node);
            const hasChildrenResult = hasChildren(graph, node);
            
            // hasChildren should return true if and only if node has children
            expect(hasChildrenResult).toBe(children.length > 0);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Removing all children should remove collapse indicator', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (depth) => {
          // Create a tree with at least one level
          const rootNode = createMindmapTree(graph, depth, 2);
          
          const children = getDirectChildren(graph, rootNode);
          
          if (children.length === 0) {
            graph.clearCells();
            return;
          }
          
          // Add collapse indicator
          addCollapseIndicator(rootNode, true);
          expect(hasCollapseIndicatorInMarkup(rootNode)).toBe(true);
          
          // Remove all children
          children.forEach((child: any) => {
            graph.removeNode(child);
          });
          
          // Update indicator (should be removed since no children)
          addCollapseIndicator(rootNode, hasChildren(graph, rootNode));
          
          // Verify indicator is removed
          expect(hasCollapseIndicatorInMarkup(rootNode)).toBe(false);
          expect(getCollapseIndicatorIcon(rootNode)).toBeNull();
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Adding children to a leaf node should add collapse indicator', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (depth) => {
          // Create a tree
          const rootNode = createMindmapTree(graph, depth, 2);
          
          // Find a leaf node
          const allNodes = graph.getNodes();
          const leafNodes = allNodes.filter((node: any) => {
            const children = getDirectChildren(graph, node);
            return children.length === 0;
          });
          
          if (leafNodes.length === 0) {
            graph.clearCells();
            return;
          }
          
          const leafNode = leafNodes[0];
          
          // Verify it's a leaf (no indicator)
          addCollapseIndicator(leafNode, hasChildren(graph, leafNode));
          expect(hasCollapseIndicatorInMarkup(leafNode)).toBe(false);
          
          // Add a child to the leaf node
          const newChild = graph.addNode({
            id: `${leafNode.id}-new-child`,
            data: { isMindmap: true, level: (leafNode.getData().level || 0) + 1 },
            width: 100,
            height: 50,
          });
          graph.addEdge({ source: leafNode.id, target: newChild.id });
          
          // Update indicator (should now have one)
          addCollapseIndicator(leafNode, hasChildren(graph, leafNode));
          
          // Verify indicator is added
          expect(hasCollapseIndicatorInMarkup(leafNode)).toBe(true);
          expect(getCollapseIndicatorIcon(leafNode)).not.toBeNull();
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Collapsed nodes and leaf nodes should be visually distinguishable at any tree depth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 6 }), // Deep tree
        (depth) => {
          // Create a linear chain (1 child per node) for easy depth testing
          const rootNode = createMindmapTree(graph, depth, 1);
          
          const allNodes = graph.getNodes();
          
          // Add indicators to all nodes
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            addCollapseIndicator(node, nodeHasChildren);
          });
          
          // Collapse some nodes at various depths
          const nodesToCollapse = allNodes.filter((node: any, index: number) => 
            index % 2 === 0 && hasChildren(graph, node)
          );
          
          nodesToCollapse.forEach((node: any) => {
            toggleCollapse(graph, node, true);
          });
          
          // Verify visual distinction at all depths
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            const isCollapsed = node.getData().collapsed === true;
            
            if (nodeHasChildren) {
              // Should have indicator
              expect(hasCollapseIndicatorInMarkup(node)).toBe(true);
              const icon = getCollapseIndicatorIcon(node);
              
              if (isCollapsed) {
                expect(icon).toBe('▶'); // Collapsed icon
              } else {
                expect(icon).toBe('▼'); // Expanded icon
              }
            } else {
              // Leaf node - should NOT have indicator
              expect(hasCollapseIndicatorInMarkup(node)).toBe(false);
              expect(getCollapseIndicatorIcon(node)).toBeNull();
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Visual distinction should work correctly for folder explorer nodes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.constantFrom('linked' as const, 'static' as const),
        (depth, explorerType) => {
          // Create a folder explorer tree
          const rootNode = createMindmapTree(graph, depth, 2);
          
          // Add folder explorer metadata to all nodes
          const allNodes = graph.getNodes();
          allNodes.forEach((node: any) => {
            const data = node.getData();
            node.setData({
              ...data,
              folderExplorer: {
                isFolderExplorer: true,
                explorerType: explorerType,
                path: `/test/path/${node.id}`,
                isDirectory: true,
                isReadOnly: explorerType === 'linked',
              },
            });
          });
          
          // Add indicators
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            addCollapseIndicator(node, nodeHasChildren);
          });
          
          // Verify visual distinction works for folder explorer nodes
          allNodes.forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            
            if (nodeHasChildren) {
              expect(hasCollapseIndicatorInMarkup(node)).toBe(true);
              expect(getCollapseIndicatorIcon(node)).not.toBeNull();
            } else {
              expect(hasCollapseIndicatorInMarkup(node)).toBe(false);
              expect(getCollapseIndicatorIcon(node)).toBeNull();
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });
});
