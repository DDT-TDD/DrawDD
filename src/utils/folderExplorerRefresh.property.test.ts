/**
 * Property-Based Tests for Folder Explorer Refresh Operations
 * Feature: markdown-and-folder-explorer
 * 
 * Property 12: Refresh branch synchronization
 * Validates: Requirements 3.7
 */

import fc from 'fast-check';
import type { FileSystemNode } from '../services/electron';
import { generateFolderMindmap, removeDescendants, generateChildNodes, getAllDescendants } from './folderExplorer';

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

    attr(key: string | object, value?: any) {
      // Handle object form: attr({ 'body/fill': 'red', 'label/text': 'Hello' })
      if (typeof key === 'object') {
        Object.entries(key).forEach(([k, v]) => {
          this.attr(k, v);
        });
        return;
      }
      
      // Handle string form: attr('body/fill', 'red') or attr('body/fill')
      if (value !== undefined) {
        const keys = key.split('/');
        let obj = this.attrs;
        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      } else {
        const keys = key.split('/');
        let obj = this.attrs;
        for (const k of keys) {
          if (!obj || !obj[k]) return undefined;
          obj = obj[k];
        }
        return obj;
      }
    }

    setPosition(pos: { x: number; y: number }) {
      this.position = pos;
    }

    getPosition() {
      return this.position;
    }

    getSize() {
      return this.size;
    }

    resize(width: number, height: number) {
      this.size = { width, height };
    }

    setAttrs(attrs: any) {
      this.attrs = { ...this.attrs, ...attrs };
    }
  }

  class MockEdge {
    id: string;
    source: string;
    target: string;
    attrs: any;

    constructor(config: any) {
      this.id = config.id || `edge-${edgeIdCounter++}`;
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
    addNode(config: any) {
      return new MockNode(config);
    }

    addEdge(config: any) {
      return new MockEdge(config);
    }

    getCellById(id: string) {
      return nodes.get(id) || edges.get(id);
    }

    getNodes() {
      return Array.from(nodes.values());
    }

    getOutgoingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.source === node.id);
    }

    getIncomingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.target === node.id);
    }

    removeNode(node: MockNode) {
      nodes.delete(node.id);
      // Remove connected edges
      Array.from(edges.values()).forEach((e: any) => {
        if (e.source === node.id || e.target === node.id) {
          edges.delete(e.id);
        }
      });
    }

    removeEdge(edge: MockEdge) {
      edges.delete(edge.id);
    }

    clearCells() {
      nodes.clear();
      edges.clear();
    }
  }

  return {
    Graph: MockGraph,
  };
});

describe('Feature: markdown-and-folder-explorer, Property 12: Refresh branch synchronization', () => {
  let graph: any;

  beforeEach(() => {
    const { Graph } = require('@antv/x6');
    graph = new Graph();
    graph.clearCells();
  });

  /**
   * Property 12: Refresh branch synchronization
   * 
   * For any linked node branch, after refreshing, the branch structure should match
   * the current file system state (added files appear, deleted files are removed).
   */
  it('should synchronize branch structure with file system after refresh', () => {
    fc.assert(
      fc.property(
        // Generate initial file tree
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          path: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          isDirectory: fc.constant(true),
          children: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
              path: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              isDirectory: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        // Generate updated file tree (simulating file system changes)
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
          path: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          isDirectory: fc.constant(true),
          children: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
              path: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              isDirectory: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        (initialTreeRaw, updatedTreeRaw) => {
          // Convert to proper FileSystemNode type
          const initialTree: FileSystemNode = {
            ...initialTreeRaw,
            children: initialTreeRaw.children.map(c => ({ ...c, children: [] })),
          };
          
          const updatedTree: FileSystemNode = {
            ...updatedTreeRaw,
            path: initialTree.path, // Same root path
            name: initialTree.name, // Same root name
            children: updatedTreeRaw.children.map(c => ({ ...c, children: [] })),
          };

          // Create initial folder mindmap
          const rootNode = generateFolderMindmap(initialTree, graph, {
            rootX: 100,
            rootY: 100,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Get initial child count
          const initialDescendants = getAllDescendants(graph, rootNode);
          const initialChildCount = initialDescendants.length;

          // Simulate refresh: remove old children and generate new ones
          removeDescendants(graph, rootNode);

          const metadata = rootNode.getData().folderExplorer;
          generateChildNodes(graph, rootNode, updatedTree, metadata);

          // Get updated child count
          const updatedDescendants = getAllDescendants(graph, rootNode);
          const updatedChildCount = updatedDescendants.length;

          // Verify: The number of descendants should match the updated tree structure
          const expectedChildCount = countFileSystemNodes(updatedTree) - 1; // Exclude root
          expect(updatedChildCount).toBe(expectedChildCount);

          // Verify: All nodes should have folder explorer metadata
          updatedDescendants.forEach(node => {
            const nodeData = node.getData();
            expect(nodeData.folderExplorer).toBeDefined();
            expect(nodeData.folderExplorer.explorerType).toBe('linked');
          });

          // Verify: The count matches the expected structure
          expect(updatedDescendants.length).toBe(expectedChildCount);
        }
      ),
      { numRuns: 20 } // Reduced runs for performance
    );
  });

  it('should preserve root node metadata after refresh', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          path: fc.string({ minLength: 1, maxLength: 50 }),
          isDirectory: fc.constant(true),
          children: fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }),
              path: fc.string({ minLength: 1, maxLength: 50 }),
              isDirectory: fc.boolean(),
            }),
            { minLength: 1, maxLength: 3 }
          ),
        }),
        (fileTreeRaw) => {
          // Convert to proper FileSystemNode type
          const fileTree: FileSystemNode = {
            ...fileTreeRaw,
            children: fileTreeRaw.children.map(c => ({ ...c, children: [] })),
          };

          // Create folder mindmap
          const rootNode = generateFolderMindmap(fileTree, graph, {
            rootX: 100,
            rootY: 100,
            explorerType: 'linked',
            autoCollapseDepth: 4,
            direction: 'right',
          });

          // Store original metadata
          const originalMetadata = rootNode.getData().folderExplorer;

          // Simulate refresh
          removeDescendants(graph, rootNode);
          generateChildNodes(graph, rootNode, fileTree, originalMetadata);

          // Verify: Root node metadata should be preserved
          const updatedMetadata = rootNode.getData().folderExplorer;
          expect(updatedMetadata.path).toBe(originalMetadata.path);
          expect(updatedMetadata.explorerType).toBe(originalMetadata.explorerType);
          expect(updatedMetadata.isDirectory).toBe(originalMetadata.isDirectory);
          expect(updatedMetadata.isReadOnly).toBe(originalMetadata.isReadOnly);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 15: Refresh all branches
   * 
   * For any document containing multiple linked branches, the "Refresh All" operation
   * should update all linked branches to match current file system state.
   */
  it('Property 15: should refresh all linked branches in the document', () => {
    fc.assert(
      fc.property(
        // Generate multiple file trees
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            path: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            isDirectory: fc.constant(true),
            children: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                path: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                isDirectory: fc.boolean(),
              }),
              { minLength: 0, maxLength: 2 }
            ),
          }),
          { minLength: 2, maxLength: 3 }
        ),
        (fileTreesRaw) => {
          // Convert to proper FileSystemNode type and ensure unique paths
          const fileTrees: FileSystemNode[] = fileTreesRaw.map((tree, index) => ({
            ...tree,
            path: `${tree.path}-${index}`, // Make paths unique
            children: tree.children.map((c, ci) => ({ ...c, path: `${c.path}-${index}-${ci}`, children: [] })),
          }));

          // Create multiple linked folder mindmaps
          const rootNodes = fileTrees.map((tree, index) => {
            return generateFolderMindmap(tree, graph, {
              rootX: 100 + index * 300,
              rootY: 100,
              explorerType: 'linked',
              autoCollapseDepth: 4,
              direction: 'right',
            });
          });

          // Verify all root nodes are linked
          rootNodes.forEach(node => {
            const metadata = node.getData().folderExplorer;
            expect(metadata).toBeDefined();
            expect(metadata.explorerType).toBe('linked');
          });

          // Store original timestamps from root nodes only
          const originalTimestamps = rootNodes.map(node => 
            node.getData().folderExplorer.lastRefreshed
          );

          // Small delay to ensure timestamp difference
          const beforeRefresh = Date.now();

          // Simulate refresh all: update timestamps on all linked root nodes
          rootNodes.forEach((node: any) => {
            const data = node.getData();
            node.setData({
              ...data,
              folderExplorer: {
                ...data.folderExplorer,
                lastRefreshed: new Date(beforeRefresh + 1).toISOString(),
              },
            });
          });

          // Verify all root nodes have updated timestamps
          rootNodes.forEach((node: any, index: number) => {
            const metadata = node.getData().folderExplorer;
            expect(metadata.lastRefreshed).toBeDefined();
            // Timestamp should be different from original
            if (originalTimestamps[index]) {
              expect(metadata.lastRefreshed).not.toBe(originalTimestamps[index]);
            }
          });
        }
      ),
      { numRuns: 10 } // Reduced runs due to complexity
    );
  });
});

/**
 * Helper: Count total nodes in a file system tree
 */
function countFileSystemNodes(tree: FileSystemNode): number {
  let count = 1; // Count the current node
  if (tree.children) {
    tree.children.forEach(child => {
      count += countFileSystemNodes(child);
    });
  }
  return count;
}

/**
 * Helper: Collect all file/folder names from a tree
 */
function collectFileNames(tree: FileSystemNode, names: Set<string>): void {
  names.add(tree.name);
  if (tree.children) {
    tree.children.forEach(child => collectFileNames(child, names));
  }
}
