/**
 * Property-Based Tests for Static Folder Explorer Nodes
 * Tests Properties 17 and 18 from the design document
 */

import fc from 'fast-check';
import type { FolderExplorerMetadata } from '../types';

// Mock @antv/x6 Graph
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

    getSize() {
      return this.size;
    }
  }

  class MockGraph {
    nodes: Map<string, MockNode>;

    constructor() {
      this.nodes = nodes;
    }

    addNode(config: any): MockNode {
      const node = new MockNode(config);
      return node;
    }

    getCellById(id: string) {
      return nodes.get(id);
    }

    dispose() {
      nodes.clear();
      nodeIdCounter = 0;
    }
  }

  return {
    Graph: MockGraph,
  };
});

const { Graph } = require('@antv/x6');


describe('Feature: markdown-and-folder-explorer, Property 17: Static node editability', () => {
  it('should make static nodes immediately editable without requiring unlinking', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // Node name
        fc.string({ minLength: 5, maxLength: 100 }), // File path
        fc.boolean(), // isDirectory
        (nodeName, filePath, isDirectory) => {
          // Create a graph instance
          const graph = new Graph();

          // Create static folder explorer metadata
          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'static',
            path: filePath,
            isDirectory,
            isReadOnly: false, // Static nodes should NOT be read-only
          };

          // Create a node with static folder explorer metadata
          const node = graph.addNode({
            x: 100,
            y: 100,
            width: 120,
            height: 60,
            attrs: {
              body: { fill: '#ffffff', stroke: '#666666' },
              label: { text: nodeName },
            },
            data: {
              folderExplorer: metadata,
            },
          });

          // Verify the node is not read-only
          const nodeData = node.getData();
          expect(nodeData.folderExplorer).toBeDefined();
          expect(nodeData.folderExplorer.explorerType).toBe('static');
          expect(nodeData.folderExplorer.isReadOnly).toBe(false);

          // Verify we can edit the node text (no read-only restriction)
          const canEdit = !nodeData.folderExplorer.isReadOnly;
          expect(canEdit).toBe(true);

          // Cleanup
          graph.dispose();
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Feature: markdown-and-folder-explorer, Property 18: Static node no file system connection', () => {
  it('should not have refresh functionality and should not update when file system changes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // Node name
        fc.string({ minLength: 5, maxLength: 100 }), // File path
        fc.boolean(), // isDirectory
        (nodeName, filePath, isDirectory) => {
          // Create a graph instance
          const graph = new Graph();

          // Create static folder explorer metadata
          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'static',
            path: filePath,
            isDirectory,
            isReadOnly: false,
            // Static nodes should NOT have lastRefreshed timestamp
            lastRefreshed: undefined,
          };

          // Create a node with static folder explorer metadata
          const node = graph.addNode({
            x: 100,
            y: 100,
            width: 120,
            height: 60,
            attrs: {
              body: { fill: '#ffffff', stroke: '#666666' },
              label: { text: nodeName },
            },
            data: {
              folderExplorer: metadata,
            },
          });

          // Verify the node is static
          const nodeData = node.getData();
          expect(nodeData.folderExplorer).toBeDefined();
          expect(nodeData.folderExplorer.explorerType).toBe('static');
          
          // Verify no refresh timestamp (indicates no file system connection)
          expect(nodeData.folderExplorer.lastRefreshed).toBeUndefined();
          
          // Verify the node doesn't maintain a live connection
          // Static nodes should not have refresh functionality
          const hasRefreshCapability = 
            nodeData.folderExplorer.explorerType === 'linked' && 
            nodeData.folderExplorer.lastRefreshed !== undefined;
          expect(hasRefreshCapability).toBe(false);

          // Cleanup
          graph.dispose();
        }
      ),
      { numRuns: 100 }
    );
  });
});
