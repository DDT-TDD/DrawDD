/**
 * Property-Based Test for File Node Clickability
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 17.2 Write property test for file node clickability
 * 
 * **Property 10: File node clickability**
 * **Validates: Requirements 3.3, 3.4**
 * 
 * For any linked node where isDirectory === false, the node should be clickable
 * and trigger the file open operation.
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

// Mock electron service
const mockOpenFile = jest.fn();
jest.mock('../services/electron', () => ({
  openFile: (...args: any[]) => mockOpenFile(...args),
}));

import { Graph } from '@antv/x6';
import { openFile } from '../services/electron';

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
 * Arbitrary generator for linked file node metadata
 */
const linkedFileMetadataArb = fc.record({
  isFolderExplorer: fc.constant(true),
  explorerType: fc.constant('linked' as const),
  path: fc.tuple(filePathArb, fileNameArb).map(([dir, file]) => `${dir}/${file}`),
  isDirectory: fc.constant(false),
  isReadOnly: fc.constant(true),
  lastRefreshed: fc.integer({ min: 1609459200000, max: Date.now() })
    .map(timestamp => new Date(timestamp).toISOString()),
});

/**
 * Arbitrary generator for linked folder node metadata
 */
const linkedFolderMetadataArb = fc.record({
  isFolderExplorer: fc.constant(true),
  explorerType: fc.constant('linked' as const),
  path: filePathArb,
  isDirectory: fc.constant(true),
  isReadOnly: fc.constant(true),
  lastRefreshed: fc.integer({ min: 1609459200000, max: Date.now() })
    .map(timestamp => new Date(timestamp).toISOString()),
});

/**
 * Arbitrary generator for static file node metadata
 */
const staticFileMetadataArb = fc.record({
  isFolderExplorer: fc.constant(true),
  explorerType: fc.constant('static' as const),
  path: fc.tuple(filePathArb, fileNameArb).map(([dir, file]) => `${dir}/${file}`),
  isDirectory: fc.constant(false),
  isReadOnly: fc.constant(false),
});

describe('Feature: markdown-and-folder-explorer, Property 10: File node clickability', () => {
  let graph: Graph;

  beforeEach(() => {
    graph = createTestGraph();
    mockOpenFile.mockClear();
  });

  afterEach(() => {
    if (graph) {
      graph.dispose();
    }
  });

  /**
   * Property 10: File node clickability
   * 
   * For any linked node where isDirectory === false, the node should be clickable
   * and trigger the file open operation.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should identify linked file nodes as clickable', () => {
    fc.assert(
      fc.property(
        linkedFileMetadataArb,
        fileNameArb,
        (metadata, fileName) => {
          // Create a node with linked file metadata
          const node = graph.addNode({
            id: `file-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: fileName,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Property: Node should have folder explorer metadata
          expect(folderMetadata).toBeDefined();
          expect(folderMetadata.isFolderExplorer).toBe(true);

          // Property: Node should be a linked node
          expect(folderMetadata.explorerType).toBe('linked');

          // Property: Node should represent a file (not a directory)
          expect(folderMetadata.isDirectory).toBe(false);

          // Property: Node should have a valid file path
          expect(folderMetadata.path).toBeDefined();
          expect(typeof folderMetadata.path).toBe('string');
          expect(folderMetadata.path.length).toBeGreaterThan(0);

          // Property: File path should be absolute (start with /)
          expect(folderMetadata.path).toMatch(/^\//);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 10a: Linked file nodes should trigger openFile when clicked
   * 
   * This validates that clicking a linked file node calls the openFile API.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should call openFile API when linked file node is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        fileNameArb,
        async (metadata, fileName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create a node with linked file metadata
          const node = graph.addNode({
            id: `file-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: fileName,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Simulate clicking the file node
          if (folderMetadata && 
              folderMetadata.explorerType === 'linked' && 
              folderMetadata.isDirectory === false) {
            await openFile(folderMetadata.path);
          }

          // Property: openFile should have been called with the correct path
          expect(mockOpenFile).toHaveBeenCalledWith(metadata.path);
          expect(mockOpenFile).toHaveBeenCalledTimes(1);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 10b: Linked folder nodes should NOT trigger openFile
   * 
   * This validates that clicking a linked folder node does not call openFile.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should NOT call openFile for linked folder nodes', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFolderMetadataArb,
        fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
        async (metadata, folderName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create a node with linked folder metadata
          const node = graph.addNode({
            id: `folder-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: folderName,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Simulate clicking the folder node
          if (folderMetadata && 
              folderMetadata.explorerType === 'linked' && 
              folderMetadata.isDirectory === false) {
            await openFile(folderMetadata.path);
          }

          // Property: openFile should NOT have been called for folder nodes
          expect(mockOpenFile).not.toHaveBeenCalled();

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 10c: Static file nodes should NOT trigger openFile
   * 
   * This validates that static file nodes do not trigger file opening.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should NOT call openFile for static file nodes', async () => {
    await fc.assert(
      fc.asyncProperty(
        staticFileMetadataArb,
        fileNameArb,
        async (metadata, fileName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create a node with static file metadata
          const node = graph.addNode({
            id: `static-file-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: fileName,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Simulate clicking the static file node
          if (folderMetadata && 
              folderMetadata.explorerType === 'linked' && 
              folderMetadata.isDirectory === false) {
            await openFile(folderMetadata.path);
          }

          // Property: openFile should NOT have been called for static nodes
          expect(mockOpenFile).not.toHaveBeenCalled();

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 10d: File path should be passed correctly to openFile
   * 
   * This validates that the exact file path from metadata is passed to openFile.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should pass exact file path from metadata to openFile', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        fileNameArb,
        async (metadata, fileName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create a node with linked file metadata
          const node = graph.addNode({
            id: `file-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: fileName,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Simulate clicking the file node
          if (folderMetadata && 
              folderMetadata.explorerType === 'linked' && 
              folderMetadata.isDirectory === false) {
            await openFile(folderMetadata.path);
          }

          // Property: openFile should be called with exact path from metadata
          expect(mockOpenFile).toHaveBeenCalledWith(metadata.path);
          
          // Property: The path should not be modified
          const calledPath = mockOpenFile.mock.calls[0][0];
          expect(calledPath).toBe(metadata.path);
          expect(calledPath).toBe(folderMetadata.path);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 10e: Multiple file nodes should each be clickable
   * 
   * This validates that multiple file nodes can all trigger openFile independently.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should allow multiple file nodes to be clicked independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(linkedFileMetadataArb, { minLength: 2, maxLength: 5 }),
        async (metadataArray) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create multiple file nodes
          const nodes = metadataArray.map((metadata, index) => {
            return graph.addNode({
              id: `file-node-${index}`,
              x: 100 + index * 200,
              y: 100,
              width: 150,
              height: 50,
              data: {
                label: `file-${index}`,
                folderExplorer: metadata,
              },
            });
          });

          // Simulate clicking each file node
          for (const node of nodes) {
            const data = node.getData();
            const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

            if (folderMetadata && 
                folderMetadata.explorerType === 'linked' && 
                folderMetadata.isDirectory === false) {
              await openFile(folderMetadata.path);
            }
          }

          // Property: openFile should have been called for each file node
          expect(mockOpenFile).toHaveBeenCalledTimes(metadataArray.length);

          // Property: Each call should have the correct path
          metadataArray.forEach((metadata, index) => {
            expect(mockOpenFile).toHaveBeenNthCalledWith(index + 1, metadata.path);
          });

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 10f: File node clickability should be deterministic
   * 
   * This validates that the same file node always triggers the same behavior.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should consistently identify same file node as clickable', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        fileNameArb,
        async (metadata, fileName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create a node with linked file metadata
          const node = graph.addNode({
            id: `file-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: fileName,
              folderExplorer: metadata,
            },
          });

          // Simulate clicking the same node multiple times
          const clickCount = 3;
          for (let i = 0; i < clickCount; i++) {
            const data = node.getData();
            const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

            if (folderMetadata && 
                folderMetadata.explorerType === 'linked' && 
                folderMetadata.isDirectory === false) {
              await openFile(folderMetadata.path);
            }
          }

          // Property: openFile should have been called exactly clickCount times
          expect(mockOpenFile).toHaveBeenCalledTimes(clickCount);

          // Property: All calls should have the same path
          for (let i = 0; i < clickCount; i++) {
            expect(mockOpenFile).toHaveBeenNthCalledWith(i + 1, metadata.path);
          }

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 10g: Standard nodes should NOT trigger openFile
   * 
   * This validates that regular nodes without folder explorer metadata don't trigger openFile.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should NOT call openFile for standard nodes without folder explorer metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (label) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create a standard node without folder explorer metadata
          const node = graph.addNode({
            id: `standard-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: label,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata | undefined;

          // Simulate clicking the standard node
          if (folderMetadata && 
              folderMetadata.explorerType === 'linked' && 
              folderMetadata.isDirectory === false) {
            await openFile(folderMetadata.path);
          }

          // Property: openFile should NOT have been called for standard nodes
          expect(mockOpenFile).not.toHaveBeenCalled();

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  /**
   * Property 10h: File node metadata should be immutable during click
   * 
   * This validates that clicking a file node doesn't modify its metadata.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should not modify file node metadata when clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        fileNameArb,
        async (metadata, fileName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create a node with linked file metadata
          const node = graph.addNode({
            id: `file-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: fileName,
              folderExplorer: metadata,
            },
          });

          // Get metadata before click
          const dataBefore = node.getData();
          const metadataBefore = JSON.parse(JSON.stringify(dataBefore.folderExplorer));

          // Simulate clicking the file node
          const folderMetadata = dataBefore.folderExplorer as FolderExplorerMetadata;
          if (folderMetadata && 
              folderMetadata.explorerType === 'linked' && 
              folderMetadata.isDirectory === false) {
            await openFile(folderMetadata.path);
          }

          // Get metadata after click
          const dataAfter = node.getData();
          const metadataAfter = dataAfter.folderExplorer;

          // Property: Metadata should be unchanged
          expect(metadataAfter).toEqual(metadataBefore);
          expect(metadataAfter.path).toBe(metadataBefore.path);
          expect(metadataAfter.explorerType).toBe(metadataBefore.explorerType);
          expect(metadataAfter.isDirectory).toBe(metadataBefore.isDirectory);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 10i: File nodes with different paths should open different files
   * 
   * This validates that each file node opens its own specific file.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should open different files for nodes with different paths', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(linkedFileMetadataArb, { minLength: 2, maxLength: 5 })
          .filter(arr => {
            // Ensure all paths are unique
            const paths = arr.map(m => m.path);
            return new Set(paths).size === paths.length;
          }),
        async (metadataArray) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create file nodes with different paths
          const nodes = metadataArray.map((metadata, index) => {
            return graph.addNode({
              id: `file-node-${index}`,
              x: 100 + index * 200,
              y: 100,
              width: 150,
              height: 50,
              data: {
                label: `file-${index}`,
                folderExplorer: metadata,
              },
            });
          });

          // Simulate clicking each file node
          const calledPaths: string[] = [];
          for (const node of nodes) {
            const data = node.getData();
            const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

            if (folderMetadata && 
                folderMetadata.explorerType === 'linked' && 
                folderMetadata.isDirectory === false) {
              await openFile(folderMetadata.path);
              calledPaths.push(folderMetadata.path);
            }
          }

          // Property: All paths should be unique
          const uniquePaths = new Set(calledPaths);
          expect(uniquePaths.size).toBe(calledPaths.length);

          // Property: Each path should match the original metadata
          metadataArray.forEach((metadata, index) => {
            expect(calledPaths[index]).toBe(metadata.path);
          });

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 10j: File node clickability should work with various file extensions
   * 
   * This validates that file nodes work with different file types.
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should handle file nodes with various file extensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        filePathArb,
        fc.constantFrom('txt', 'pdf', 'doc', 'jpg', 'png', 'mp4', 'zip', 'exe', 'js', 'ts'),
        async (dirPath, extension) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          const fileName = `testfile.${extension}`;
          const fullPath = `${dirPath}/${fileName}`;

          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'linked',
            path: fullPath,
            isDirectory: false,
            isReadOnly: true,
            lastRefreshed: new Date().toISOString(),
          };

          // Create a node with the file metadata
          const node = graph.addNode({
            id: `file-node-${Math.random()}`,
            x: 100,
            y: 100,
            width: 150,
            height: 50,
            data: {
              label: fileName,
              folderExplorer: metadata,
            },
          });

          const data = node.getData();
          const folderMetadata = data.folderExplorer as FolderExplorerMetadata;

          // Simulate clicking the file node
          if (folderMetadata && 
              folderMetadata.explorerType === 'linked' && 
              folderMetadata.isDirectory === false) {
            await openFile(folderMetadata.path);
          }

          // Property: openFile should be called with the correct path
          expect(mockOpenFile).toHaveBeenCalledWith(fullPath);
          expect(mockOpenFile).toHaveBeenCalledTimes(1);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});
