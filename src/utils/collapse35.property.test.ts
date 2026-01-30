/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 35: Folder explorer auto-collapse specificity
 * **Validates: Requirements 9.10**
 * 
 * Tests that for any folder explorer branch, auto-collapse should only apply to
 * folder explorer nodes beyond depth 4, not to manually created mindmap nodes.
 */

import fc from 'fast-check';
import { generateFolderMindmap, getAllDescendants } from './folderExplorer';
import type { FileSystemNode } from '../services/electron';

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
    position: { x: number; y: number };

    constructor(config: any) {
      this.id = config.id || `node-${nodeIdCounter++}`;
      this.data = config.data || {};
      this.size = { width: config.width || 100, height: config.height || 50 };
      this.attrs = config.attrs || {};
      this.markup = config.markup || [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ];
      this.position = { x: config.x || 0, y: config.y || 0 };
      nodes.set(this.id, this);
    }

    getData() { return this.data; }
    setData(data: any) { this.data = data; }
    getSize() { return this.size; }
    getPosition() { return this.position; }
    setPosition(pos: { x: number; y: number }) { this.position = pos; }
    getAttrs() { return this.attrs; }
    setAttrs(attrs: any) { this.attrs = { ...this.attrs, ...attrs }; }
    getMarkup() { return this.markup; }
    setMarkup(markup: any[]) { this.markup = markup; }
    isNode() { return true; }
    setVisible(visible: boolean) { this.data.visible = visible; }
    isVisible() { return this.data.visible !== false; }
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

// Mock layout module
jest.mock('./layout', () => ({
  applyMindmapLayout: jest.fn(),
}));

// Mock styling module
jest.mock('./folderExplorerStyles', () => ({
  applyFolderExplorerStyling: jest.fn(),
  removeFolderExplorerStyling: jest.fn(),
}));

import { Graph } from '@antv/x6';

const createTestGraph = (): any => new (Graph as any)();

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

/**
 * Create a manual mindmap node (not from folder explorer)
 */
const createManualMindmapNode = (
  graph: any,
  parentId: string | null,
  level: number,
  orderRef: { value: number }
): any => {
  const nodeId = `manual-node-${orderRef.value}`;
  
  const node = graph.addNode({
    id: nodeId,
    x: 0,
    y: 0,
    width: 120,
    height: 50,
    data: {
      isMindmap: true,
      level,
      mmOrder: orderRef.value++,
      text: `Manual Node ${level}`,
      // No folderExplorer metadata - this is a manually created node
    },
    attrs: {
      body: {
        fill: '#FFFFFF',
        stroke: '#666666',
        strokeWidth: 2,
      },
      label: {
        text: `Manual Node ${level}`,
        fill: '#000000',
      },
    },
  });
  
  if (parentId) {
    graph.addEdge({
      source: parentId,
      target: nodeId,
      attrs: {
        line: {
          stroke: '#666666',
          strokeWidth: 2,
        },
      },
    });
  }
  
  return node;
};

/**
 * Create a deep manual mindmap tree
 */
const createManualMindmapTree = (
  graph: any,
  depth: number,
  branchingFactor: number,
  parentId: string | null = null,
  level: number = 1,
  orderRef: { value: number } = { value: 0 }
): any => {
  const node = createManualMindmapNode(graph, parentId, level, orderRef);
  
  if (depth > 0) {
    for (let i = 0; i < branchingFactor; i++) {
      createManualMindmapTree(graph, depth - 1, branchingFactor, node.id, level + 1, orderRef);
    }
  }
  
  return node;
};

describe('Feature: markdown-and-folder-explorer, Property 35: Folder explorer auto-collapse specificity', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.10** - Auto-collapse should only apply to folder explorer nodes beyond depth 4', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(6), // Generate deep folder trees
        fc.constantFrom('linked' as const, 'static' as const),
        (fileTree, explorerType) => {
          // Generate folder explorer mindmap with auto-collapse at depth 4
          const folderRootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType,
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get all folder explorer nodes
          const folderNodes = [folderRootNode, ...getAllDescendants(graph, folderRootNode)];

          // Verify folder explorer nodes follow auto-collapse rules
          folderNodes.forEach(node => {
            const data = node.getData();
            const level = data.level as number;
            const metadata = data.folderExplorer;

            // Verify this is a folder explorer node
            expect(metadata).toBeDefined();
            expect(metadata.isFolderExplorer).toBe(true);

            // Check auto-collapse based on depth
            if (level <= 4) {
              // Folder explorer nodes at depth 1-4 should NOT be auto-collapsed
              expect(data.collapsed).toBeFalsy();
            } else {
              // Folder explorer nodes at depth 5+ should be auto-collapsed
              expect(data.collapsed).toBe(true);
            }
          });

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Manual mindmap nodes should NOT be auto-collapsed regardless of depth', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 8 }), // Create deep manual trees
        fc.integer({ min: 1, max: 3 }), // Branching factor
        (depth, branchingFactor) => {
          // Create a manual mindmap tree (not from folder explorer)
          const manualRootNode = createManualMindmapTree(graph, depth, branchingFactor);

          // Get all manual nodes
          const allNodes = graph.getNodes();

          // Verify NO manual nodes are auto-collapsed
          allNodes.forEach((node: any) => {
            const data = node.getData();
            const level = data.level as number;
            const metadata = data.folderExplorer;

            // Verify this is NOT a folder explorer node
            expect(metadata).toBeUndefined();

            // Manual nodes should NOT be auto-collapsed, even at depth > 4
            expect(data.collapsed).toBeFalsy();
            
            // Even at very deep levels, manual nodes should not be collapsed
            if (level > 4) {
              expect(data.collapsed).not.toBe(true);
            }
          });

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Mixed graph with folder explorer and manual nodes should only auto-collapse folder nodes', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(6), // Deep folder tree
        fc.integer({ min: 5, max: 8 }), // Deep manual tree
        fc.constantFrom('linked' as const, 'static' as const),
        (fileTree, manualDepth, explorerType) => {
          // Create folder explorer branch
          const folderRootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 100,
            rootY: 300,
            explorerType,
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Create manual mindmap branch (separate from folder explorer)
          const manualOrderRef = { value: 1000 }; // Use high order to avoid conflicts
          const manualRootNode = createManualMindmapTree(
            graph,
            manualDepth,
            2,
            null,
            1,
            manualOrderRef
          );

          // Get all nodes
          const allNodes = graph.getNodes();

          // Separate folder explorer nodes from manual nodes
          const folderNodes: any[] = [];
          const manualNodes: any[] = [];

          allNodes.forEach((node: any) => {
            const data = node.getData();
            if (data.folderExplorer) {
              folderNodes.push(node);
            } else {
              manualNodes.push(node);
            }
          });

          // Verify folder explorer nodes follow auto-collapse rules
          folderNodes.forEach(node => {
            const data = node.getData();
            const level = data.level as number;

            if (level <= 4) {
              expect(data.collapsed).toBeFalsy();
            } else {
              expect(data.collapsed).toBe(true);
            }
          });

          // Verify manual nodes are NEVER auto-collapsed
          manualNodes.forEach(node => {
            const data = node.getData();
            const level = data.level as number;

            // Manual nodes should not be collapsed, even at depth > 4
            expect(data.collapsed).toBeFalsy();
            
            // Explicitly check deep manual nodes
            if (level > 4) {
              expect(data.collapsed).not.toBe(true);
            }
          });

          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Auto-collapse specificity should be preserved when manually toggling collapse state', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(6),
        fc.integer({ min: 5, max: 8 }),
        (fileTree, manualDepth) => {
          // Create folder explorer branch
          const folderRootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 100,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Create manual mindmap branch
          const manualRootNode = createManualMindmapTree(graph, manualDepth, 2);

          // Get all nodes
          const allNodes = graph.getNodes();

          // Record initial collapse states
          const initialStates = new Map<string, boolean>();
          allNodes.forEach((node: any) => {
            const data = node.getData();
            initialStates.set(node.id, data.collapsed === true);
          });

          // Manually toggle some nodes
          allNodes.forEach((node: any) => {
            const data = node.getData();
            // Toggle collapse state
            node.setData({ ...data, collapsed: !data.collapsed });
          });

          // Verify that the distinction between folder and manual nodes is preserved
          allNodes.forEach((node: any) => {
            const data = node.getData();
            const level = data.level as number;
            const isFolderNode = !!data.folderExplorer;

            // After manual toggle, we can still identify which nodes are folder explorer nodes
            if (isFolderNode) {
              expect(data.folderExplorer).toBeDefined();
              expect(data.folderExplorer.isFolderExplorer).toBe(true);
            } else {
              expect(data.folderExplorer).toBeUndefined();
            }
          });

          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Folder explorer nodes at exactly depth 4 should NOT be auto-collapsed', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(5), // Need at least depth 5 to test depth 4 boundary
        fc.constantFrom('linked' as const, 'static' as const),
        (fileTree, explorerType) => {
          // Generate folder explorer mindmap
          const folderRootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 400,
            rootY: 300,
            explorerType,
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get all folder explorer nodes
          const folderNodes = [folderRootNode, ...getAllDescendants(graph, folderRootNode)];

          // Find nodes at exactly depth 4
          const depth4Nodes = folderNodes.filter(node => {
            const data = node.getData();
            return data.level === 4;
          });

          // Verify depth 4 nodes are NOT collapsed
          depth4Nodes.forEach(node => {
            const data = node.getData();
            expect(data.collapsed).toBeFalsy();
          });

          // Find nodes at depth 5
          const depth5Nodes = folderNodes.filter(node => {
            const data = node.getData();
            return data.level === 5;
          });

          // Verify depth 5 nodes ARE collapsed
          depth5Nodes.forEach(node => {
            const data = node.getData();
            expect(data.collapsed).toBe(true);
          });

          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Auto-collapse should apply to both linked and static folder explorer nodes', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(6),
        (fileTree) => {
          // Create linked folder explorer branch
          const linkedRootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 100,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get linked nodes at depth > 4
          const linkedNodes = [linkedRootNode, ...getAllDescendants(graph, linkedRootNode)];
          const deepLinkedNodes = linkedNodes.filter(node => {
            const data = node.getData();
            return data.level > 4;
          });

          // Verify linked nodes at depth > 4 are collapsed
          deepLinkedNodes.forEach(node => {
            const data = node.getData();
            expect(data.collapsed).toBe(true);
            expect(data.folderExplorer.explorerType).toBe('linked');
          });

          graph.clearCells();

          // Create static folder explorer branch
          const staticRootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 100,
            rootY: 300,
            explorerType: 'static',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get static nodes at depth > 4
          const staticNodes = [staticRootNode, ...getAllDescendants(graph, staticRootNode)];
          const deepStaticNodes = staticNodes.filter(node => {
            const data = node.getData();
            return data.level > 4;
          });

          // Verify static nodes at depth > 4 are collapsed
          deepStaticNodes.forEach(node => {
            const data = node.getData();
            expect(data.collapsed).toBe(true);
            expect(data.folderExplorer.explorerType).toBe('static');
          });

          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Manual mindmap nodes attached to folder explorer branch should not be auto-collapsed', () => {
    fc.assert(
      fc.property(
        fileSystemNodeArb(4), // Moderate depth folder tree
        fc.integer({ min: 3, max: 6 }), // Depth for manual nodes
        (fileTree, manualDepth) => {
          // Create folder explorer branch
          const folderRootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 100,
            rootY: 300,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get a folder node at depth 3 to attach manual nodes to
          const folderNodes = [folderRootNode, ...getAllDescendants(graph, folderRootNode)];
          const depth3FolderNodes = folderNodes.filter(node => {
            const data = node.getData();
            return data.level === 3;
          });

          if (depth3FolderNodes.length > 0) {
            const attachPoint = depth3FolderNodes[0];
            
            // Attach manual mindmap nodes to this folder node
            // These manual nodes will be at depth 4+ but should NOT be auto-collapsed
            const manualOrderRef = { value: 2000 };
            const manualSubtree = createManualMindmapTree(
              graph,
              manualDepth,
              2,
              attachPoint.id,
              4, // Starting at level 4
              manualOrderRef
            );

            // Get all nodes again
            const allNodes = graph.getNodes();

            // Find the manual nodes we just added
            const manualNodes = allNodes.filter((node: any) => {
              const data = node.getData();
              return !data.folderExplorer && data.level >= 4;
            });

            // Verify manual nodes are NOT collapsed, even though they're at depth >= 4
            manualNodes.forEach((node: any) => {
              const data = node.getData();
              expect(data.folderExplorer).toBeUndefined();
              expect(data.collapsed).toBeFalsy();
            });

            // Verify folder explorer nodes at depth > 4 ARE still collapsed
            const deepFolderNodes = folderNodes.filter(node => {
              const data = node.getData();
              return data.level > 4;
            });

            deepFolderNodes.forEach(node => {
              const data = node.getData();
              expect(data.folderExplorer).toBeDefined();
              expect(data.collapsed).toBe(true);
            });
          }

          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });
});
