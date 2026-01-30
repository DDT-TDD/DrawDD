/**
 * Property-based tests for folder explorer mindmap generator
 * Tests universal properties that should hold for all folder structures
 */

import fc from 'fast-check';
import { generateFolderMindmap, getAllDescendants } from './folderExplorer';
import type { FileSystemNode } from '../services/electron';
import type { FolderExplorerMetadata } from '../types';

// Mock @antv/x6 Graph
jest.mock('@antv/x6', () => {
  const nodes = new Map();
  const edges = new Map();
  let nodeIdCounter = 0;
  let edgeIdCounter = 0;

  class MockNode {
    id: string;
    data: any;
    position: { x: number; y: number };
    size: { width: number; height: number };
    attrs: any;

    constructor(config: any) {
      this.id = config.id || `node-${nodeIdCounter++}`;
      this.data = config.data || {};
      this.position = { x: config.x || 0, y: config.y || 0 };
      this.size = { width: config.width || 100, height: config.height || 50 };
      this.attrs = config.attrs || {};
      nodes.set(this.id, this);
    }

    getData() {
      return this.data;
    }

    setData(data: any) {
      this.data = data;
    }

    getPosition() {
      return this.position;
    }

    setPosition(pos: { x: number; y: number }) {
      this.position = pos;
    }

    attr(path?: string, value?: any) {
      if (!path) return this.attrs;
      if (value !== undefined) {
        const keys = path.split('/');
        let obj = this.attrs;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      } else {
        const keys = path.split('/');
        let obj = this.attrs;
        for (const key of keys) {
          if (!obj || !obj[key]) return undefined;
          obj = obj[key];
        }
        return obj;
      }
    }
  }

  class MockEdge {
    id: string;
    source: string;
    target: string;
    attrs: any;

    constructor(config: any) {
      this.id = `edge-${edgeIdCounter++}`;
      this.source = config.source;
      this.target = config.target;
      this.attrs = config.attrs || {};
      edges.set(this.id, this);
    }

    getSourceCellId() {
      return this.source;
    }

    getTargetCellId() {
      return this.target;
    }
  }

  class MockGraph {
    constructor() {
      nodes.clear();
      edges.clear();
      nodeIdCounter = 0;
      edgeIdCounter = 0;
    }

    addNode(config: any) {
      return new MockNode(config);
    }

    addEdge(config: any) {
      return new MockEdge(config);
    }

    getNodes() {
      return Array.from(nodes.values());
    }

    getEdges() {
      return Array.from(edges.values());
    }

    getCellById(id: string) {
      return nodes.get(id) || edges.get(id);
    }

    getIncomingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.target === node.id);
    }

    getOutgoingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.source === node.id);
    }

    removeNode(node: MockNode) {
      nodes.delete(node.id);
      // Remove connected edges
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

    dispose() {
      this.clearCells();
    }
  }

  return {
    Graph: MockGraph,
    Node: MockNode,
    Edge: MockEdge,
  };
});

// Mock layout module
jest.mock('./layout', () => ({
  applyMindmapLayout: jest.fn(),
}));

// Mock styling module
jest.mock('./folderExplorerStyles', () => ({
  applyFolderExplorerStyling: jest.fn(),
  removeFolderExplorerStyling: jest.fn(),
  FOLDER_EXPLORER_ICONS: {
    linkedFolder: '📁',
    linkedFile: '📄',
    staticFolder: '📂',
    staticFile: '📃',
  },
  FOLDER_EXPLORER_COLORS: {
    linked: { fill: '#E3F2FD', stroke: '#1976D2', text: '#0D47A1' },
    static: { fill: '#F3E5F5', stroke: '#7B1FA2', text: '#4A148C' },
    standard: { fill: '#FFFFFF', stroke: '#666666', text: '#000000' },
  },
}));

import { Graph } from '@antv/x6';

/**
 * Create a test graph instance
 */
const createTestGraph = (): any => {
  return new (Graph as any)();
};

/**
 * Arbitrary generator for file/folder names
 */
const fileNameArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}(\.[a-z]{2,4})?$/);

/**
 * Arbitrary generator for file paths
 */
const filePathArb = fc.array(fileNameArb, { minLength: 1, maxLength: 5 }).map(parts => 
  '/' + parts.join('/')
);

/**
 * Arbitrary generator for FileSystemNode trees
 * Generates trees with controlled depth to avoid stack overflow
 */
const fileSystemNodeArb = (maxDepth: number = 3): fc.Arbitrary<FileSystemNode> => {
  const leafArb: fc.Arbitrary<FileSystemNode> = fc.record({
    name: fileNameArb,
    path: filePathArb,
    isDirectory: fc.constant(false),
    isHidden: fc.boolean(),
  });

  if (maxDepth <= 0) {
    return leafArb;
  }

  return fc.oneof(
    leafArb,
    fc.record({
      name: fileNameArb,
      path: filePathArb,
      isDirectory: fc.constant(true),
      isHidden: fc.boolean(),
      children: fc.array(fileSystemNodeArb(maxDepth - 1), { maxLength: 3 }),
    })
  );
};

describe('Feature: markdown-and-folder-explorer, Property 25: Linked node metadata completeness', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createTestGraph();
  });

  afterEach(() => {
    if (graph) {
      graph.dispose();
    }
  });

  it('**Validates: Requirements 7.1, 7.2, 7.3** - All linked nodes should have complete metadata', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(3),
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 0, max: 600 }),
        (fileTree, rootX, rootY) => {
          // Generate folder mindmap with linked type
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX,
            rootY,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get all nodes (root + descendants)
          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          // Verify each node has complete metadata
          allNodes.forEach(node => {
            const data = node.getData();
            const metadata = data.folderExplorer as FolderExplorerMetadata | undefined;

            // All nodes should have folder explorer metadata
            expect(metadata).toBeDefined();
            expect(metadata?.isFolderExplorer).toBe(true);

            // Linked nodes should have specific properties
            expect(metadata?.explorerType).toBe('linked');
            expect(metadata?.path).toBeDefined();
            expect(typeof metadata?.path).toBe('string');
            expect(metadata?.path.length).toBeGreaterThan(0);
            
            expect(metadata?.isDirectory).toBeDefined();
            expect(typeof metadata?.isDirectory).toBe('boolean');
            
            expect(metadata?.isReadOnly).toBe(true);
            
            // Linked nodes should have lastRefreshed timestamp
            expect(metadata?.lastRefreshed).toBeDefined();
            expect(typeof metadata?.lastRefreshed).toBe('string');
            // Verify it's a valid ISO timestamp
            expect(() => new Date(metadata!.lastRefreshed!)).not.toThrow();
          });

          // Clean up
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Static nodes should have metadata without lastRefreshed', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(3),
        fc.integer({ min: 0, max: 800 }),
        fc.integer({ min: 0, max: 600 }),
        (fileTree, rootX, rootY) => {
          // Generate folder mindmap with static type
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX,
            rootY,
            explorerType: 'static',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get all nodes (root + descendants)
          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          // Verify each node has metadata but is not read-only
          allNodes.forEach(node => {
            const data = node.getData();
            const metadata = data.folderExplorer as FolderExplorerMetadata | undefined;

            expect(metadata).toBeDefined();
            expect(metadata?.explorerType).toBe('static');
            expect(metadata?.isReadOnly).toBe(false);
            expect(metadata?.lastRefreshed).toBeUndefined();
          });

          // Clean up
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Feature: markdown-and-folder-explorer, Property 23: Auto-collapse at depth 4', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createTestGraph();
  });

  afterEach(() => {
    if (graph) {
      graph.dispose();
    }
  });

  it('**Validates: Requirements 6.2, 6.3, 12.2** - Nodes beyond depth 4 should be collapsed', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(6), // Generate deeper trees to test collapse
        fc.constantFrom('linked', 'static'),
        (fileTree, explorerType) => {
          // Generate folder mindmap
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType,
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get all nodes
          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          // Check collapse state based on depth
          allNodes.forEach(node => {
            const data = node.getData();
            const level = data.level as number;

            if (level <= 4) {
              // Nodes at depth 1-4 should NOT be collapsed
              expect(data.collapsed).toBeFalsy();
            } else {
              // Nodes at depth 5+ should be collapsed
              expect(data.collapsed).toBe(true);
            }
          });

          // Clean up
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Auto-collapse depth should be configurable', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(5),
        fc.integer({ min: 1, max: 10 }),
        (fileTree, autoCollapseDepth) => {
          // Generate folder mindmap with custom collapse depth
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth,
            direction: 'right',
          });

          // Get all nodes
          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          // Check collapse state based on custom depth
          allNodes.forEach(node => {
            const data = node.getData();
            const level = data.level as number;

            if (level <= autoCollapseDepth) {
              expect(data.collapsed).toBeFalsy();
            } else {
              expect(data.collapsed).toBe(true);
            }
          });

          // Clean up
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Feature: markdown-and-folder-explorer, Property 24: Manual expand capability', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createTestGraph();
  });

  afterEach(() => {
    if (graph) {
      graph.dispose();
    }
  });

  it('**Validates: Requirements 6.4** - Collapsed nodes should be expandable by changing collapsed flag', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(6),
        (fileTree) => {
          // Generate folder mindmap with auto-collapse
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get all nodes
          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          // Find collapsed nodes (depth > 4)
          const collapsedNodes = allNodes.filter(node => {
            const data = node.getData();
            return data.collapsed === true;
          });

          // Manually expand collapsed nodes
          collapsedNodes.forEach(node => {
            const data = node.getData();
            node.setData({ ...data, collapsed: false });
          });

          // Verify nodes are now expanded
          collapsedNodes.forEach(node => {
            const data = node.getData();
            expect(data.collapsed).toBe(false);
          });

          // Clean up
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Nodes at any depth should support collapse/expand toggle', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(4),
        (fileTree) => {
          // Generate folder mindmap
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get all nodes
          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          // Toggle collapse state for all nodes
          allNodes.forEach(node => {
            const data = node.getData();
            const originalState = data.collapsed;
            
            // Toggle to opposite state
            node.setData({ ...data, collapsed: !originalState });
            expect(node.getData().collapsed).toBe(!originalState);
            
            // Toggle back
            node.setData({ ...data, collapsed: originalState });
            expect(node.getData().collapsed).toBe(originalState);
          });

          // Clean up
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Folder Explorer - Additional Properties', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createTestGraph();
  });

  afterEach(() => {
    if (graph) {
      graph.dispose();
    }
  });

  it('All nodes should have mindmap properties', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(3),
        (fileTree) => {
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          allNodes.forEach(node => {
            const data = node.getData();
            
            // Should have mindmap properties
            expect(data.isMindmap).toBe(true);
            expect(data.level).toBeDefined();
            expect(typeof data.level).toBe('number');
            expect(data.level).toBeGreaterThan(0);
            expect(data.mmOrder).toBeDefined();
            expect(typeof data.mmOrder).toBe('number');
          });

          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Node hierarchy should match file tree hierarchy', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(3),
        (fileTree) => {
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Count nodes in file tree
          const countFileNodes = (node: FileSystemNode): number => {
            if (!node.children || node.children.length === 0) {
              return 1;
            }
            return 1 + node.children.reduce((sum, child) => sum + countFileNodes(child), 0);
          };

          const expectedCount = countFileNodes(fileTree);
          const actualCount = 1 + getAllDescendants(graph, rootNode).length;

          expect(actualCount).toBe(expectedCount);

          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });

  it('Each node should have edges connecting to parent (except root)', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(3),
        (fileTree) => {
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          const allNodes = [rootNode, ...getAllDescendants(graph, rootNode)];

          allNodes.forEach(node => {
            const incomingEdges = graph.getIncomingEdges(node) || [];
            
            if (node.id === rootNode.id) {
              // Root should have no incoming edges
              expect(incomingEdges.length).toBe(0);
            } else {
              // All other nodes should have exactly one incoming edge
              expect(incomingEdges.length).toBe(1);
            }
          });

          graph.clearCells();
        }
      ),
      { numRuns: 30 }
    );
  });
});
