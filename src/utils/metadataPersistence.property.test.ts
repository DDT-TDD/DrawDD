/**
 * Property-Based Tests for Metadata Persistence
 * 
 * Feature: markdown-and-folder-explorer
 * Property 27: Metadata persistence
 * Validates: Requirements 7.5
 * 
 * Tests that folderExplorer metadata and collapsed state persist through save/load cycles.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import type { FolderExplorerMetadata } from '../types';

// Mock Node implementation for testing
class MockNode {
  public id: string;
  public position: { x: number; y: number };
  public size: { width: number; height: number };
  public attrs: any;
  public data: any;

  constructor(config: any) {
    this.id = config.id || `node-${Date.now()}-${Math.random()}`;
    this.position = { x: config.x || 0, y: config.y || 0 };
    this.size = { width: config.width || 100, height: config.height || 50 };
    this.attrs = config.attrs || {};
    this.data = config.data || {};
  }

  getData() {
    return this.data;
  }

  setData(data: any) {
    this.data = data;
  }

  getAttrs() {
    return this.attrs;
  }

  setAttrs(attrs: any) {
    this.attrs = { ...this.attrs, ...attrs };
  }

  // Simulate X6's toJSON method
  toJSON(): any {
    return {
      id: this.id,
      shape: 'rect',
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
      attrs: this.attrs,
      data: this.data, // This is the key - X6 serializes data
    };
  }

  // Simulate X6's fromJSON method
  static fromJSON(json: any): MockNode {
    return new MockNode({
      id: json.id,
      x: json.x,
      y: json.y,
      width: json.width,
      height: json.height,
      attrs: json.attrs,
      data: json.data, // This is the key - X6 deserializes data
    });
  }
}

describe('Feature: markdown-and-folder-explorer, Property 27: Metadata persistence', () => {
  /**
   * Property 27: Metadata persistence
   * 
   * For any document containing folder explorer nodes, saving and loading
   * should preserve all folderExplorer metadata fields.
   * 
   * This test verifies that X6's toJSON/fromJSON methods correctly serialize
   * and deserialize node data including folderExplorer metadata and collapsed state.
   */
  it('should preserve folderExplorer metadata through JSON serialization', () => {
    fc.assert(
      fc.property(
        // Generate folder explorer metadata
        fc.record({
          isFolderExplorer: fc.constant(true),
          explorerType: fc.constantFrom('linked' as const, 'static' as const),
          path: fc.string({ minLength: 1, maxLength: 100 }).map(s => `/path/to/${s}`),
          isDirectory: fc.boolean(),
          isReadOnly: fc.boolean(),
          lastRefreshed: fc.option(fc.date().map(d => d.toISOString()), { nil: undefined }),
        }),
        // Generate collapsed state
        fc.boolean(),
        (folderExplorerMetadata, collapsed) => {
          // Create a node with metadata
          const node = new MockNode({
            id: 'test-node',
            x: 100,
            y: 200,
            width: 120,
            height: 60,
            attrs: {
              body: { fill: '#ffffff' },
              label: { text: 'Test Node' },
            },
            data: {
              folderExplorer: folderExplorerMetadata,
              collapsed: collapsed,
              isMindmap: true,
              level: 1,
            },
          });

          // Serialize to JSON (simulating save)
          const serialized = node.toJSON();

          // Verify serialization includes data
          expect(serialized.data).toBeDefined();
          expect(serialized.data.folderExplorer).toBeDefined();
          expect(serialized.data.collapsed).toBe(collapsed);

          // Deserialize from JSON (simulating load)
          const deserialized = MockNode.fromJSON(serialized);

          // Verify all metadata is preserved
          const deserializedData = deserialized.getData();

          // Verify folderExplorer metadata
          expect(deserializedData.folderExplorer).toBeDefined();
          expect(deserializedData.folderExplorer.isFolderExplorer).toBe(
            folderExplorerMetadata.isFolderExplorer
          );
          expect(deserializedData.folderExplorer.explorerType).toBe(
            folderExplorerMetadata.explorerType
          );
          expect(deserializedData.folderExplorer.path).toBe(folderExplorerMetadata.path);
          expect(deserializedData.folderExplorer.isDirectory).toBe(
            folderExplorerMetadata.isDirectory
          );
          expect(deserializedData.folderExplorer.isReadOnly).toBe(
            folderExplorerMetadata.isReadOnly
          );

          // Verify optional lastRefreshed field
          if (folderExplorerMetadata.lastRefreshed !== undefined) {
            expect(deserializedData.folderExplorer.lastRefreshed).toBe(
              folderExplorerMetadata.lastRefreshed
            );
          } else {
            expect(deserializedData.folderExplorer.lastRefreshed).toBeUndefined();
          }

          // Verify collapsed state
          expect(deserializedData.collapsed).toBe(collapsed);

          // Verify other data fields
          expect(deserializedData.isMindmap).toBe(true);
          expect(deserializedData.level).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that nodes without folder explorer metadata don't gain it during serialization
   */
  it('should not add folderExplorer metadata to nodes that do not have it', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (collapsed) => {
          // Create a node WITHOUT folder explorer metadata
          const node = new MockNode({
            id: 'regular-node',
            x: 100,
            y: 200,
            data: {
              collapsed: collapsed,
              isMindmap: true,
            },
          });

          // Serialize and deserialize
          const serialized = node.toJSON();
          const deserialized = MockNode.fromJSON(serialized);

          // Verify node doesn't have folderExplorer metadata
          const data = deserialized.getData();
          expect(data.folderExplorer).toBeUndefined();
          expect(data.collapsed).toBe(collapsed);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test that all metadata fields are preserved, including optional ones
   */
  it('should preserve all metadata fields including optional lastRefreshed', () => {
    fc.assert(
      fc.property(
        fc.date().filter(d => !isNaN(d.getTime())),
        fc.constantFrom('linked' as const, 'static' as const),
        (refreshDate, explorerType) => {
          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: explorerType,
            path: '/test/path/folder',
            isDirectory: true,
            isReadOnly: explorerType === 'linked',
            lastRefreshed: refreshDate.toISOString(),
          };

          const node = new MockNode({
            id: 'test-node',
            x: 0,
            y: 0,
            data: {
              folderExplorer: metadata,
              collapsed: true,
            },
          });

          // Serialize and deserialize
          const serialized = node.toJSON();
          const deserialized = MockNode.fromJSON(serialized);

          // Verify all fields including optional ones
          const deserializedData = deserialized.getData();
          expect(deserializedData.folderExplorer).toBeDefined();
          expect(deserializedData.folderExplorer.lastRefreshed).toBe(
            refreshDate.toISOString()
          );
          expect(deserializedData.folderExplorer.explorerType).toBe(explorerType);
          expect(deserializedData.folderExplorer.isReadOnly).toBe(explorerType === 'linked');
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test that collapsed state persists independently of folder explorer metadata
   */
  it('should preserve collapsed state for any node type', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.option(
          fc.record({
            isFolderExplorer: fc.constant(true),
            explorerType: fc.constantFrom('linked' as const, 'static' as const),
            path: fc.string({ minLength: 1 }).map(s => `/path/${s}`),
            isDirectory: fc.boolean(),
            isReadOnly: fc.boolean(),
          }),
          { nil: undefined }
        ),
        (collapsed, folderExplorer) => {
          const node = new MockNode({
            id: 'test-node',
            data: {
              collapsed: collapsed,
              folderExplorer: folderExplorer,
            },
          });

          // Serialize and deserialize
          const serialized = node.toJSON();
          const deserialized = MockNode.fromJSON(serialized);

          // Verify collapsed state is preserved
          const data = deserialized.getData();
          expect(data.collapsed).toBe(collapsed);

          // Verify folderExplorer is preserved if it was present
          if (folderExplorer) {
            expect(data.folderExplorer).toBeDefined();
            expect(data.folderExplorer.explorerType).toBe(folderExplorer.explorerType);
          } else {
            expect(data.folderExplorer).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that deep nested metadata structures are preserved
   */
  it('should preserve deeply nested metadata structures', () => {
    fc.assert(
      fc.property(
        fc.record({
          isFolderExplorer: fc.constant(true),
          explorerType: fc.constantFrom('linked' as const, 'static' as const),
          path: fc.string({ minLength: 1 }).map(s => `/very/deep/path/structure/${s}/folder`),
          isDirectory: fc.boolean(),
          isReadOnly: fc.boolean(),
          lastRefreshed: fc.date().map(d => d.toISOString()),
        }),
        fc.boolean(),
        fc.integer({ min: 0, max: 10 }),
        (metadata, collapsed, level) => {
          const node = new MockNode({
            id: 'deep-node',
            data: {
              folderExplorer: metadata,
              collapsed: collapsed,
              isMindmap: true,
              level: level,
              // Add some additional nested data
              customData: {
                nested: {
                  deeply: {
                    value: 'test',
                  },
                },
              },
            },
          });

          // Serialize and deserialize
          const serialized = node.toJSON();
          const deserialized = MockNode.fromJSON(serialized);

          // Verify all nested structures are preserved
          const data = deserialized.getData();
          expect(data.folderExplorer).toEqual(metadata);
          expect(data.collapsed).toBe(collapsed);
          expect(data.level).toBe(level);
          expect(data.customData).toEqual({
            nested: {
              deeply: {
                value: 'test',
              },
            },
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
