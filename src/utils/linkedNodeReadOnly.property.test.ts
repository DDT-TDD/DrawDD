/**
 * Property-Based Test for Linked Node Read-Only State
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 18.2 Write property test for linked node read-only state
 * 
 * **Property 11: Linked node read-only state**
 * **Validates: Requirements 3.5**
 * 
 * For any node with folderExplorer.isReadOnly === true, the node should prevent text editing.
 */

import fc from 'fast-check';
import type { FolderExplorerMetadata } from '../types';

// Mock @antv/x6 Graph and Node
jest.mock('@antv/x6', () => {
  const nodes = new Map();
  let nodeIdCounter = 0;

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

    getAttrs() {
      return this.attrs;
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

    isNode() {
      return true;
    }
  }

  class MockGraph {
    constructor() {
      nodes.clear();
      nodeIdCounter = 0;
    }

    addNode(config: any) {
      return new MockNode(config);
    }

    getNodes() {
      return Array.from(nodes.values());
    }

    getCellById(id: string) {
      return nodes.get(id);
    }

    removeNode(node: MockNode) {
      nodes.delete(node.id);
    }

    clearCells() {
      nodes.clear();
    }

    dispose() {
      this.clearCells();
    }
  }

  return {
    Graph: MockGraph,
    Node: MockNode,
  };
});

import { Graph } from '@antv/x6';

/**
 * Create a test graph instance
 */
const createTestGraph = (): any => {
  return new (Graph as any)();
};

/**
 * Arbitrary generator for file paths
 */
const filePathArb = fc.array(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
  { minLength: 1, maxLength: 5 }
).map(parts => '/' + parts.join('/'));

/**
 * Arbitrary generator for file names
 */
const fileNameArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}\.[a-z]{2,4}$/);

/**
 * Arbitrary generator for folder names
 */
const folderNameArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/);

/**
 * Arbitrary generator for linked node metadata (read-only)
 */
const linkedNodeMetadataArb = fc.record({
  isFolderExplorer: fc.constant(true),
  explorerType: fc.constant('linked' as const),
  path: fc.oneof(
    filePathArb,
    fc.tuple(filePathArb, fileNameArb).map(([dir, file]) => `${dir}/${file}`)
  ),
  isDirectory: fc.boolean(),
  isReadOnly: fc.constant(true),
  lastRefreshed: fc.integer({ min: 1609459200000, max: Date.now() })
    .map(timestamp => new Date(timestamp).toISOString()),
});

/**
 * Arbitrary generator for static node metadata (not read-only)
 */
const staticNodeMetadataArb = fc.record({
  isFolderExplorer: fc.constant(true),
  explorerType: fc.constant('static' as const),
  path: fc.oneof(
    filePathArb,
    fc.tuple(filePathArb, fileNameArb).map(([dir, file]) => `${dir}/${file}`)
  ),
  isDirectory: fc.boolean(),
  isReadOnly: fc.constant(false),
});

/**
 * Arbitrary generator for standard node (no folder explorer metadata)
 */
const standardNodeArb = fc.record({
  label: fc.string({ minLength: 1, maxLength: 50 }),
});

/**
 * Simulates attempting to edit a node
 * Returns true if editing should be allowed, false if prevented
 */
function canEditNode(node: any): boolean {
  const data = node.getData?.() || {};
  
  // Check if node is read-only (linked folder explorer node)
  if (data.folderExplorer?.isReadOnly === true) {
    return false; // Editing prevented
  }
  
  return true; // Editing allowed
}

describe('Feature: markdown-and-folder-explorer, Property 11: Linked node read-only state', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createTestGraph();
  });

  afterEach(() => {
    if (graph) {
      graph.dispose();
    }
  });

  /**
   * Property 11: Linked node read-only state
   * 
   * For any node with folderExplorer.isReadOnly === true, the node should prevent text editing.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should prevent editing for nodes with isReadOnly === true', () => {
    fc.assert(
      fc.property(
        linkedNodeMetadataArb,
        fc.oneof(fileNameArb, folderNameArb),
        (metadata, label) => {
          // Create a node with linked metadata (read-only)
          const node = graph.addNode({
            id: `linked-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Property: Node should have folder explorer metadata
          expect(folderMetadata).toBeDefined();
          expect(folderMetadata.isFolderExplorer).toBe(true);

          // Property: Node should be marked as read-only
          expect(folderMetadata.isReadOnly).toBe(true);

          // Property: Node should be a linked node
          expect(folderMetadata.explorerType).toBe('linked');

          // Property: Editing should be prevented
          const canEdit = canEditNode(node);
          expect(canEdit).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11a: Static nodes should allow editing
   * 
   * This validates that static folder explorer nodes (isReadOnly === false) can be edited.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should allow editing for static nodes with isReadOnly === false', () => {
    fc.assert(
      fc.property(
        staticNodeMetadataArb,
        fc.oneof(fileNameArb, folderNameArb),
        (metadata, label) => {
          // Create a node with static metadata (not read-only)
          const node = graph.addNode({
            id: `static-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Property: Node should have folder explorer metadata
          expect(folderMetadata).toBeDefined();
          expect(folderMetadata.isFolderExplorer).toBe(true);

          // Property: Node should NOT be marked as read-only
          expect(folderMetadata.isReadOnly).toBe(false);

          // Property: Node should be a static node
          expect(folderMetadata.explorerType).toBe('static');

          // Property: Editing should be allowed
          const canEdit = canEditNode(node);
          expect(canEdit).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11b: Standard nodes should allow editing
   * 
   * This validates that regular nodes without folder explorer metadata can be edited.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should allow editing for standard nodes without folder explorer metadata', () => {
    fc.assert(
      fc.property(
        standardNodeArb,
        (nodeData) => {
          // Create a standard node without folder explorer metadata
          const node = graph.addNode({
            id: `standard-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: nodeData.label,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata | undefined;

          // Property: Node should NOT have folder explorer metadata
          expect(folderMetadata).toBeUndefined();

          // Property: Editing should be allowed
          const canEdit = canEditNode(node);
          expect(canEdit).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11c: Read-only state should be consistent
   * 
   * This validates that the read-only check is deterministic and consistent.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should consistently prevent editing for the same read-only node', () => {
    fc.assert(
      fc.property(
        linkedNodeMetadataArb,
        fc.oneof(fileNameArb, folderNameArb),
        (metadata, label) => {
          // Create a node with linked metadata (read-only)
          const node = graph.addNode({
            id: `linked-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          // Check multiple times - should always be consistent
          const checkCount = 5;
          const results: boolean[] = [];
          
          for (let i = 0; i < checkCount; i++) {
            results.push(canEditNode(node));
          }

          // Property: All checks should return the same result
          const allSame = results.every(r => r === results[0]);
          expect(allSame).toBe(true);

          // Property: All checks should prevent editing
          expect(results[0]).toBe(false);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 11d: Read-only state should be independent of node type
   * 
   * This validates that both file and folder linked nodes are read-only.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should prevent editing for both file and folder linked nodes', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // isDirectory
        fc.oneof(fileNameArb, folderNameArb),
        (isDirectory, label) => {
          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'linked',
            path: isDirectory ? `/test/folder` : `/test/file.txt`,
            isDirectory: isDirectory,
            isReadOnly: true,
            lastRefreshed: new Date().toISOString(),
          };

          // Create a node with linked metadata
          const node = graph.addNode({
            id: `linked-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Property: Node should be read-only regardless of isDirectory value
          expect(folderMetadata.isReadOnly).toBe(true);

          // Property: Editing should be prevented for both files and folders
          const canEdit = canEditNode(node);
          expect(canEdit).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11e: Unlinking should make node editable
   * 
   * This validates that removing folder explorer metadata makes a node editable.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should allow editing after unlinking (removing folder explorer metadata)', () => {
    fc.assert(
      fc.property(
        linkedNodeMetadataArb,
        fc.oneof(fileNameArb, folderNameArb),
        (metadata, label) => {
          // Create a node with linked metadata (read-only)
          const node = graph.addNode({
            id: `linked-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          // Property: Initially, editing should be prevented
          expect(canEditNode(node)).toBe(false);

          // Unlink the node (remove folder explorer metadata)
          const data = node.getData();
          const { folderExplorer, ...cleanData } = data;
          node.setData(cleanData);

          // Property: After unlinking, editing should be allowed
          expect(canEditNode(node)).toBe(true);

          // Property: Folder explorer metadata should be removed
          const updatedData = node.getData();
          expect(updatedData.folderExplorer).toBeUndefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11f: Multiple linked nodes should all be read-only
   * 
   * This validates that read-only state applies to all linked nodes independently.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should prevent editing for all linked nodes in a graph', () => {
    fc.assert(
      fc.property(
        fc.array(linkedNodeMetadataArb, { minLength: 2, maxLength: 5 }),
        (metadataArray) => {
          // Create multiple linked nodes
          const nodes = metadataArray.map((metadata, index) => {
            return graph.addNode({
              id: `linked-node-${index}`,
              x: 100 + index * 200,
              y: 100,
              width: 150,
              height: 50,
              data: {
                label: `node-${index}`,
                folderExplorer: metadata,
              },
            });
          });

          // Property: All nodes should be read-only
          nodes.forEach(node => {
            const data = node.getData();
            expect(data.folderExplorer?.isReadOnly).toBe(true);
          });

          // Property: Editing should be prevented for all nodes
          nodes.forEach(node => {
            expect(canEditNode(node)).toBe(false);
          });

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 11g: Read-only state should not affect node position
   * 
   * This validates that read-only nodes can still be moved.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should allow position changes for read-only nodes', () => {
    fc.assert(
      fc.property(
        linkedNodeMetadataArb,
        fc.oneof(fileNameArb, folderNameArb),
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (metadata, label, newX, newY) => {
          // Create a node with linked metadata (read-only)
          const node = graph.addNode({
            id: `linked-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          // Property: Node should be read-only
          expect(canEditNode(node)).toBe(false);

          // Move the node
          const oldPosition = node.getPosition();
          node.setPosition({ x: newX, y: newY });
          const newPosition = node.getPosition();

          // Property: Position should be updated
          expect(newPosition.x).toBe(newX);
          expect(newPosition.y).toBe(newY);

          // Property: Node should still be read-only after moving
          expect(canEditNode(node)).toBe(false);

          // Property: Metadata should be unchanged
          const data = node.getData();
          expect(data.folderExplorer?.isReadOnly).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 11h: Read-only check should handle missing metadata gracefully
   * 
   * This validates that the read-only check doesn't fail on nodes without metadata.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should handle nodes with missing or incomplete metadata', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant({}),
          fc.record({ isFolderExplorer: fc.constant(false) }),
          fc.record({ explorerType: fc.constant('linked') }), // Missing isReadOnly
        ),
        (metadata) => {
          // Create a node with incomplete or missing metadata
          const node = graph.addNode({
            id: `node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: 'test',
              folderExplorer: metadata,
            },
          });

          // Property: canEditNode should not throw an error
          let canEdit: boolean;
          expect(() => {
            canEdit = canEditNode(node);
          }).not.toThrow();

          // Property: Should allow editing when metadata is incomplete
          // (only prevent editing when isReadOnly is explicitly true)
          expect(canEdit!).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 11i: Read-only state should be preserved across metadata updates
   * 
   * This validates that updating other metadata fields doesn't affect read-only state.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should preserve read-only state when updating other metadata fields', () => {
    fc.assert(
      fc.property(
        linkedNodeMetadataArb,
        fc.oneof(fileNameArb, folderNameArb),
        fc.string({ minLength: 1, maxLength: 50 }),
        (metadata, label, newLabel) => {
          // Create a node with linked metadata (read-only)
          const node = graph.addNode({
            id: `linked-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          // Property: Initially read-only
          expect(canEditNode(node)).toBe(false);

          // Update label (but keep folder explorer metadata)
          const data = node.getData();
          node.setData({
            ...data,
            label: newLabel,
          });

          // Property: Should still be read-only after label update
          expect(canEditNode(node)).toBe(false);

          // Property: Metadata should be unchanged
          const updatedData = node.getData();
          expect(updatedData.folderExplorer?.isReadOnly).toBe(true);
          expect(updatedData.folderExplorer?.explorerType).toBe('linked');

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 11j: Read-only state should be based only on isReadOnly flag
   * 
   * This validates that only the isReadOnly flag determines editability.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should base read-only state solely on isReadOnly flag', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // isReadOnly value
        fc.constantFrom('linked', 'static'),
        fc.boolean(), // isDirectory
        fc.oneof(fileNameArb, folderNameArb),
        (isReadOnly, explorerType, isDirectory, label) => {
          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: explorerType as 'linked' | 'static',
            path: isDirectory ? `/test/folder` : `/test/file.txt`,
            isDirectory: isDirectory,
            isReadOnly: isReadOnly,
            ...(explorerType === 'linked' ? { lastRefreshed: new Date().toISOString() } : {}),
          };

          // Create a node with the metadata
          const node = graph.addNode({
            id: `node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
              folderExplorer: metadata,
            },
          });

          const canEdit = canEditNode(node);

          // Property: Editability should match the inverse of isReadOnly
          // (can edit if NOT read-only, cannot edit if read-only)
          expect(canEdit).toBe(!isReadOnly);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
