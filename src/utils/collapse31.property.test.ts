/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 31: Collapsed state persistence
 * **Validates: Requirements 9.4, 9.5**
 * 
 * Tests that for any node with collapsed: true, saving and loading the document
 * should preserve the collapsed state.
 */

import fc from 'fast-check';
import {
  toggleCollapse,
  getAllDescendants,
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

    // Simulate X6's toJSON method for serialization
    toJSON(): any {
      return {
        id: this.id,
        shape: 'rect',
        x: this.position.x,
        y: this.position.y,
        width: this.size.width,
        height: this.size.height,
        attrs: this.attrs,
        data: this.data, // This is the key - X6 serializes data including collapsed state
      };
    }
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

    // Simulate X6's toJSON method for edges
    toJSON(): any {
      return {
        id: this.id,
        shape: 'edge',
        source: this.source,
        target: this.target,
      };
    }
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

    // Simulate X6's toJSON method for the entire graph
    toJSON(): any {
      return {
        cells: [
          ...Array.from(this.nodes.values()).map((n: any) => n.toJSON()),
          ...Array.from(this.edges.values()).map((e: any) => e.toJSON()),
        ],
      };
    }

    // Simulate X6's fromJSON method for the entire graph
    fromJSON(json: any): void {
      // Clear existing cells
      this.clearCells();

      // Restore nodes first
      const nodeData = json.cells.filter((cell: any) => cell.shape !== 'edge');
      nodeData.forEach((cell: any) => {
        const node = new MockNode({
          id: cell.id,
          x: cell.x,
          y: cell.y,
          width: cell.width,
          height: cell.height,
          attrs: cell.attrs,
          data: cell.data,
        }, this);
        this.nodes.set(node.id, node);
      });

      // Then restore edges
      const edgeData = json.cells.filter((cell: any) => cell.shape === 'edge');
      edgeData.forEach((cell: any) => {
        const edge = new MockEdge({
          source: cell.source,
          target: cell.target,
        }, this);
        this.edges.set(edge.id, edge);
      });
    }
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
 * Simulate saving and loading a document
 * This mimics what happens when a user saves a .drawdd file and reopens it
 */
const saveAndLoadGraph = (graph: any): any => {
  // Serialize the graph to JSON (simulating save)
  const serialized = graph.toJSON();

  // Create a new graph (simulating opening a new document)
  const newGraph = createTestGraph();

  // Deserialize the JSON into the new graph (simulating load)
  newGraph.fromJSON(serialized);

  return newGraph;
};

describe('Feature: markdown-and-folder-explorer, Property 31: Collapsed state persistence', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.4, 9.5** - Collapsed state should persist through save/load cycle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }), // depth
        fc.integer({ min: 1, max: 3 }), // branching factor
        (depth, branchingFactor) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);

          // Collapse the root node
          toggleCollapse(graph, rootNode, true);

          // Verify the node is collapsed
          expect(rootNode.getData().collapsed).toBe(true);

          // Verify descendants are hidden
          const descendants = getAllDescendants(graph, rootNode);
          descendants.forEach((descendant: any) => {
            expect(descendant.getData().visible).toBe(false);
          });

          // Save and load the graph
          const loadedGraph = saveAndLoadGraph(graph);

          try {
            // Find the root node in the loaded graph
            const loadedNodes = loadedGraph.getNodes();
            const loadedRootNode = loadedNodes.find((n: any) => n.id === rootNode.id);

            // Verify the root node exists in loaded graph
            expect(loadedRootNode).toBeDefined();

            // Verify the collapsed state is preserved
            expect(loadedRootNode.getData().collapsed).toBe(true);

            // Verify the collapsed state is the same as before save
            expect(loadedRootNode.getData().collapsed).toBe(rootNode.getData().collapsed);
          } finally {
            loadedGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Expanded state should persist through save/load cycle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);

          // Explicitly set expanded state (collapsed: false)
          toggleCollapse(graph, rootNode, false);

          // Verify the node is not collapsed
          expect(rootNode.getData().collapsed).toBe(false);

          // Save and load the graph
          const loadedGraph = saveAndLoadGraph(graph);

          try {
            // Find the root node in the loaded graph
            const loadedNodes = loadedGraph.getNodes();
            const loadedRootNode = loadedNodes.find((n: any) => n.id === rootNode.id);

            // Verify the expanded state is preserved
            expect(loadedRootNode).toBeDefined();
            expect(loadedRootNode.getData().collapsed).toBe(false);
          } finally {
            loadedGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Mixed collapsed states should persist through save/load cycle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }), // Need at least 2 levels
        fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }), // Random collapse states
        (depth, collapseStates) => {
          // Create a tree with multiple branches
          const rootNode = createMindmapTree(graph, depth, 2);

          // Get all nodes in the tree
          const allNodes = graph.getNodes();

          // Apply random collapse states to nodes (up to the length of collapseStates)
          const nodesToCollapse = allNodes.slice(0, Math.min(allNodes.length, collapseStates.length));
          const collapsedNodeIds = new Map<string, boolean>();

          nodesToCollapse.forEach((node: any, index: number) => {
            const shouldCollapse = collapseStates[index];
            toggleCollapse(graph, node, shouldCollapse);
            collapsedNodeIds.set(node.id, shouldCollapse);
          });

          // Save and load the graph
          const loadedGraph = saveAndLoadGraph(graph);

          try {
            // Verify all collapsed states are preserved
            collapsedNodeIds.forEach((expectedCollapsed, nodeId) => {
              const loadedNode = loadedGraph.getCellById(nodeId);
              expect(loadedNode).toBeDefined();
              if (loadedNode) {
                expect(loadedNode.getData().collapsed).toBe(expectedCollapsed);
              }
            });
          } finally {
            loadedGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Collapsed state should persist for nodes at any depth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }), // Deep tree
        (depth) => {
          // Create a linear chain (1 child per node)
          const rootNode = createMindmapTree(graph, depth, 1);

          // Get all nodes
          const allNodes = graph.getNodes();

          // Collapse every other node
          const collapsedStates = new Map<string, boolean>();
          allNodes.forEach((node: any, index: number) => {
            const shouldCollapse = index % 2 === 0;
            toggleCollapse(graph, node, shouldCollapse);
            collapsedStates.set(node.id, shouldCollapse);
          });

          // Save and load
          const loadedGraph = saveAndLoadGraph(graph);

          try {
            // Verify all collapsed states are preserved at all depths
            collapsedStates.forEach((expectedCollapsed, nodeId) => {
              const loadedNode = loadedGraph.getCellById(nodeId);
              expect(loadedNode).toBeDefined();
              if (loadedNode) {
                expect(loadedNode.getData().collapsed).toBe(expectedCollapsed);
              }
            });
          } finally {
            loadedGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Collapsed state should persist independently of other node data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.boolean(),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 10 }),
        (depth, collapsed, customText, customLevel) => {
          // Create a node with various data fields
          const rootNode = createMindmapTree(graph, depth, 2);

          // Set collapsed state and other custom data
          toggleCollapse(graph, rootNode, collapsed);
          const data = rootNode.getData();
          rootNode.setData({
            ...data,
            customText: customText,
            customLevel: customLevel,
            someOtherField: 'test-value',
          });

          // Save and load
          const loadedGraph = saveAndLoadGraph(graph);

          try {
            const loadedNode = loadedGraph.getCellById(rootNode.id);
            expect(loadedNode).toBeDefined();

            if (loadedNode) {
              const loadedData = loadedNode.getData();

              // Verify collapsed state is preserved
              expect(loadedData.collapsed).toBe(collapsed);

              // Verify other data fields are also preserved
              expect(loadedData.customText).toBe(customText);
              expect(loadedData.customLevel).toBe(customLevel);
              expect(loadedData.someOtherField).toBe('test-value');
            }
          } finally {
            loadedGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Collapsed state should persist for folder explorer nodes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.boolean(),
        fc.constantFrom('linked' as const, 'static' as const),
        (depth, collapsed, explorerType) => {
          // Create a folder explorer node
          const rootNode = createMindmapTree(graph, depth, 2);

          // Add folder explorer metadata
          const data = rootNode.getData();
          rootNode.setData({
            ...data,
            folderExplorer: {
              isFolderExplorer: true,
              explorerType: explorerType,
              path: '/test/path/folder',
              isDirectory: true,
              isReadOnly: explorerType === 'linked',
            },
          });

          // Set collapsed state
          toggleCollapse(graph, rootNode, collapsed);

          // Save and load
          const loadedGraph = saveAndLoadGraph(graph);

          try {
            const loadedNode = loadedGraph.getCellById(rootNode.id);
            expect(loadedNode).toBeDefined();

            if (loadedNode) {
              const loadedData = loadedNode.getData();

              // Verify collapsed state is preserved
              expect(loadedData.collapsed).toBe(collapsed);

              // Verify folder explorer metadata is also preserved
              expect(loadedData.folderExplorer).toBeDefined();
              expect(loadedData.folderExplorer.explorerType).toBe(explorerType);
              expect(loadedData.folderExplorer.path).toBe('/test/path/folder');
            }
          } finally {
            loadedGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Multiple save/load cycles should preserve collapsed state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.boolean(),
        fc.integer({ min: 2, max: 5 }), // Number of save/load cycles
        (depth, collapsed, cycles) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, 2);

          // Set collapsed state
          toggleCollapse(graph, rootNode, collapsed);

          let currentGraph = graph;

          // Perform multiple save/load cycles
          for (let i = 0; i < cycles; i++) {
            const nextGraph = saveAndLoadGraph(currentGraph);

            // Verify collapsed state is preserved in each cycle
            const loadedNode = nextGraph.getCellById(rootNode.id);
            expect(loadedNode).toBeDefined();
            expect(loadedNode.getData().collapsed).toBe(collapsed);

            // Clean up previous graph (except the original)
            if (currentGraph !== graph) {
              currentGraph.dispose();
            }

            currentGraph = nextGraph;
          }

          // Clean up final graph
          if (currentGraph !== graph) {
            currentGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Undefined collapsed state should be preserved (not collapsed by default)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (depth) => {
          // Create a node without explicitly setting collapsed state
          const rootNode = createMindmapTree(graph, depth, 2);

          // Verify collapsed is undefined or false
          const originalCollapsed = rootNode.getData().collapsed;
          expect(originalCollapsed).toBeFalsy();

          // Save and load
          const loadedGraph = saveAndLoadGraph(graph);

          try {
            const loadedNode = loadedGraph.getCellById(rootNode.id);
            expect(loadedNode).toBeDefined();

            if (loadedNode) {
              // Verify collapsed state remains undefined or false
              const loadedCollapsed = loadedNode.getData().collapsed;
              expect(loadedCollapsed).toBeFalsy();
            }
          } finally {
            loadedGraph.dispose();
          }

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });
});
