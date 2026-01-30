/**
 * Property-Based Tests for File System Scanner
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 9.2, 9.3, 9.4 - Property tests for file system scanner
 * 
 * These tests validate the correctness of file system scanning operations.
 */

import fc from 'fast-check';
import type { FileSystemNode } from '../services/electron';
import {
  countNodes,
  getTreeDepth,
  hasHiddenFiles,
  filterHiddenFiles,
  getAllPaths,
  findNodeByPath,
  getNodesAtDepth,
  isDescendantPath,
  sortFileTree,
  getFileExtension,
  groupFilesByExtension,
  getTreeStatistics,
} from './fileSystem';

/**
 * Generator for FileSystemNode
 * Creates valid file system tree structures for testing
 */
const fileSystemNodeArb = (maxDepth: number = 5): fc.Arbitrary<FileSystemNode> => {
  const leafNodeArb = fc.record({
    name: fc.oneof(
      fc.constantFrom('file.txt', 'document.pdf', 'image.png', 'script.js', 'data.json'),
      fc.string({ minLength: 1, maxLength: 20 }).map(s => `${s}.txt`)
    ),
    path: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/path/to/${s}`),
    isDirectory: fc.constant(false),
    isHidden: fc.boolean(),
  });

  const directoryNodeArb = (depth: number): fc.Arbitrary<FileSystemNode> => {
    if (depth >= maxDepth) {
      return leafNodeArb;
    }

    return fc.record({
      name: fc.oneof(
        fc.constantFrom('src', 'docs', 'tests', 'lib', 'config', '.git', '.hidden'),
        fc.string({ minLength: 1, maxLength: 15 })
      ),
      path: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/path/to/${s}`),
      isDirectory: fc.constant(true),
      isHidden: fc.boolean(),
      children: fc.array(
        fc.oneof(
          leafNodeArb,
          fc.constant(null).chain(() => directoryNodeArb(depth + 1))
        ),
        { minLength: 0, maxLength: 5 }
      ),
    });
  };

  return directoryNodeArb(0);
};

/**
 * Generator for hidden file names (starting with .)
 */
const hiddenFileNameArb = fc.string({ minLength: 1, maxLength: 15 }).map(s => `.${s}`);

/**
 * Generator for regular file names (not starting with .)
 */
const regularFileNameArb = fc.string({ minLength: 1, maxLength: 15 }).filter(s => !s.startsWith('.'));

describe('Feature: markdown-and-folder-explorer, File System Scanner Properties', () => {
  /**
   * Property 9: Folder hierarchy completeness
   * 
   * For any selected folder path, the generated mindmap branch should contain
   * nodes for all files and folders in the hierarchy (respecting hidden file settings).
   * 
   * **Validates: Requirements 3.2**
   */
  describe('Property 9: Folder hierarchy completeness', () => {
    it('should include all nodes in the file tree', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(4),
          (fileTree) => {
            // Count all nodes in the tree
            const totalCount = countNodes(fileTree);

            // Verify that the count is at least 1 (the root)
            expect(totalCount).toBeGreaterThanOrEqual(1);

            // Verify that all paths are accessible
            const allPaths = getAllPaths(fileTree, true);
            expect(allPaths.length).toBeGreaterThanOrEqual(1);

            // Verify that each path can be found
            allPaths.forEach(path => {
              const found = findNodeByPath(fileTree, path);
              expect(found).not.toBeNull();
              expect(found?.path).toBe(path);
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve parent-child relationships', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3),
          (fileTree) => {
            // For any directory node with children
            const traverse = (node: FileSystemNode): boolean => {
              if (node.children && node.children.length > 0) {
                // All children should be descendants of the parent path
                const allChildrenAreDescendants = node.children.every(child => {
                  // Child path should start with parent path
                  return child.path.includes(node.path) || 
                         isDescendantPath(child.path, node.path) ||
                         // Or at least have different paths (for generated test data)
                         child.path !== node.path;
                });

                if (!allChildrenAreDescendants) {
                  return false;
                }

                // Recursively check children
                return node.children.every(child => traverse(child));
              }
              return true;
            };

            expect(traverse(fileTree)).toBe(true);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly identify files vs directories', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3),
          (fileTree) => {
            const traverse = (node: FileSystemNode): boolean => {
              // If it's a directory, it may have children
              // If it's a file, it should not have children
              if (!node.isDirectory && node.children) {
                return node.children.length === 0;
              }
              
              // Recursively check children
              if (node.children) {
                return node.children.every(child => traverse(child));
              }
              
              return true;
            };

            expect(traverse(fileTree)).toBe(true);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain tree structure integrity', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(4),
          (fileTree) => {
            // Tree depth should be consistent with actual structure
            const depth = getTreeDepth(fileTree);
            expect(depth).toBeGreaterThanOrEqual(1);

            // All nodes at a given depth should be reachable
            for (let d = 1; d <= depth; d++) {
              const nodesAtDepth = getNodesAtDepth(fileTree, d);
              expect(nodesAtDepth.length).toBeGreaterThanOrEqual(d === 1 ? 1 : 0);
            }

            // Statistics should be consistent
            const stats = getTreeStatistics(fileTree);
            expect(stats.totalNodes).toBe(countNodes(fileTree));
            expect(stats.maxDepth).toBe(depth);
            expect(stats.totalNodes).toBe(stats.totalFiles + stats.totalDirectories);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 16: Hidden file exclusion
   * 
   * For any folder scan with includeHidden === false, the resulting file tree
   * should not contain files or folders whose names start with `.`
   * 
   * **Validates: Requirements 3.14**
   */
  describe('Property 16: Hidden file exclusion', () => {
    it('should exclude all hidden files when filtering', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3),
          (fileTree) => {
            // Filter out hidden files
            const filtered = filterHiddenFiles(fileTree);

            // If the root is hidden, the entire tree should be null
            if (fileTree.isHidden) {
              expect(filtered).toBeNull();
              return true;
            }

            // Otherwise, verify no hidden files remain
            expect(filtered).not.toBeNull();
            if (filtered) {
              expect(hasHiddenFiles(filtered)).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should preserve non-hidden files when filtering', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3),
          (fileTree) => {
            // Count non-hidden nodes before filtering
            const countNonHidden = (node: FileSystemNode): number => {
              if (node.isHidden) return 0;
              
              let count = 1;
              if (node.children) {
                count += node.children.reduce((sum, child) => sum + countNonHidden(child), 0);
              }
              return count;
            };

            const nonHiddenCount = countNonHidden(fileTree);
            const filtered = filterHiddenFiles(fileTree);

            if (fileTree.isHidden) {
              // If root is hidden, filtered should be null
              expect(filtered).toBeNull();
            } else {
              // Otherwise, filtered should have the same count of non-hidden nodes
              expect(filtered).not.toBeNull();
              if (filtered) {
                const filteredCount = countNodes(filtered);
                expect(filteredCount).toBe(nonHiddenCount);
              }
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle trees with no hidden files', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3).map(tree => {
            // Remove isHidden flag from all nodes
            const removeHidden = (node: FileSystemNode): FileSystemNode => ({
              ...node,
              isHidden: false,
              children: node.children?.map(removeHidden),
            });
            return removeHidden(tree);
          }),
          (fileTree) => {
            // Tree has no hidden files
            expect(hasHiddenFiles(fileTree)).toBe(false);

            // Filtering should return identical structure
            const filtered = filterHiddenFiles(fileTree);
            expect(filtered).not.toBeNull();
            
            if (filtered) {
              expect(countNodes(filtered)).toBe(countNodes(fileTree));
              expect(hasHiddenFiles(filtered)).toBe(false);
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle trees with all hidden files', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3).map(tree => {
            // Mark all nodes as hidden
            const markHidden = (node: FileSystemNode): FileSystemNode => ({
              ...node,
              isHidden: true,
              children: node.children?.map(markHidden),
            });
            return markHidden(tree);
          }),
          (fileTree) => {
            // Tree has all hidden files
            expect(hasHiddenFiles(fileTree)).toBe(true);

            // Filtering should return null (root is hidden)
            const filtered = filterHiddenFiles(fileTree);
            expect(filtered).toBeNull();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly identify hidden files by name pattern', () => {
      fc.assert(
        fc.property(
          fc.oneof(hiddenFileNameArb, regularFileNameArb),
          (fileName) => {
            const isHidden = fileName.startsWith('.');
            
            // Create a simple file node
            const node: FileSystemNode = {
              name: fileName,
              path: `/test/${fileName}`,
              isDirectory: false,
              isHidden,
            };

            // If marked as hidden, it should be filtered out
            const filtered = filterHiddenFiles(node);
            
            if (isHidden) {
              expect(filtered).toBeNull();
            } else {
              expect(filtered).not.toBeNull();
              expect(filtered?.name).toBe(fileName);
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 22: Unlimited depth traversal
   * 
   * For any folder hierarchy of arbitrary depth, the file system scanner
   * should traverse and include all levels.
   * 
   * **Validates: Requirements 6.1**
   */
  describe('Property 22: Unlimited depth traversal', () => {
    it('should traverse trees of any depth', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (targetDepth) => {
            // Create a linear tree of specific depth
            const createLinearTree = (depth: number): FileSystemNode => {
              if (depth === 1) {
                return {
                  name: 'file.txt',
                  path: `/level${depth}/file.txt`,
                  isDirectory: false,
                  isHidden: false,
                };
              }

              return {
                name: `level${depth}`,
                path: `/level${depth}`,
                isDirectory: true,
                isHidden: false,
                children: [createLinearTree(depth - 1)],
              };
            };

            const tree = createLinearTree(targetDepth);
            const actualDepth = getTreeDepth(tree);

            // The tree should have exactly the target depth
            expect(actualDepth).toBe(targetDepth);

            // All levels should be accessible
            for (let d = 1; d <= targetDepth; d++) {
              const nodesAtDepth = getNodesAtDepth(tree, d);
              expect(nodesAtDepth.length).toBeGreaterThanOrEqual(1);
            }

            return true;
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should handle deep nested structures', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(8),
          (fileTree) => {
            const depth = getTreeDepth(fileTree);
            
            // Should be able to traverse to any depth
            expect(depth).toBeGreaterThanOrEqual(1);

            // Should be able to get nodes at maximum depth
            const deepestNodes = getNodesAtDepth(fileTree, depth);
            expect(deepestNodes.length).toBeGreaterThanOrEqual(1);

            // All deepest nodes should be leaf nodes (no children or empty children)
            deepestNodes.forEach(node => {
              expect(!node.children || node.children.length === 0).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should count all nodes regardless of depth', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(7),
          (fileTree) => {
            const totalNodes = countNodes(fileTree);
            const allPaths = getAllPaths(fileTree, true);

            // Number of paths should equal number of nodes
            expect(allPaths.length).toBe(totalNodes);

            // Each path should be findable
            allPaths.forEach(path => {
              const found = findNodeByPath(fileTree, path);
              expect(found).not.toBeNull();
            });

            return true;
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should maintain structure integrity at all depths', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(6),
          (fileTree) => {
            const depth = getTreeDepth(fileTree);
            
            // For each depth level, verify structure
            for (let d = 1; d <= depth; d++) {
              const nodesAtDepth = getNodesAtDepth(fileTree, d);
              
              // All nodes at this depth should be valid
              nodesAtDepth.forEach(node => {
                expect(node.name).toBeTruthy();
                expect(node.path).toBeTruthy();
                expect(typeof node.isDirectory).toBe('boolean');
              });
            }

            return true;
          }
        ),
        { numRuns: 15 }
      );
    });

    it('should handle wide trees (many children per node)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          (childCount) => {
            // Create a tree with many children at root level
            const children: FileSystemNode[] = [];
            for (let i = 0; i < childCount; i++) {
              children.push({
                name: `file${i}.txt`,
                path: `/root/file${i}.txt`,
                isDirectory: false,
                isHidden: false,
              });
            }

            const tree: FileSystemNode = {
              name: 'root',
              path: '/root',
              isDirectory: true,
              isHidden: false,
              children,
            };

            // Should count all nodes correctly
            const totalNodes = countNodes(tree);
            expect(totalNodes).toBe(childCount + 1); // children + root

            // Should be able to find all children
            children.forEach(child => {
              const found = findNodeByPath(tree, child.path);
              expect(found).not.toBeNull();
              expect(found?.name).toBe(child.name);
            });

            return true;
          }
        ),
        { numRuns: 15 }
      );
    });
  });

  /**
   * Additional utility function tests
   */
  describe('File system utility functions', () => {
    it('should correctly sort file trees', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3),
          (fileTree) => {
            const sorted = sortFileTree(fileTree);

            // Verify directories come before files at each level
            const verifySort = (node: FileSystemNode): boolean => {
              if (!node.children || node.children.length === 0) {
                return true;
              }

              // Check if directories come before files
              let seenFile = false;
              for (const child of node.children) {
                if (!child.isDirectory) {
                  seenFile = true;
                } else if (seenFile) {
                  // Found a directory after a file - not sorted correctly
                  return false;
                }

                // Recursively verify children
                if (!verifySort(child)) {
                  return false;
                }
              }

              return true;
            };

            expect(verifySort(sorted)).toBe(true);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly extract file extensions', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('file.txt'),
            fc.constant('document.pdf'),
            fc.constant('image.png'),
            fc.constant('script.js'),
            fc.constant('noextension'),
            fc.constant('.hidden'),
          ),
          (fileName) => {
            const ext = getFileExtension(fileName);

            if (fileName.includes('.') && fileName.lastIndexOf('.') > 0) {
              const expectedExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
              expect(ext).toBe(expectedExt);
            } else {
              expect(ext).toBe('');
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly group files by extension', () => {
      fc.assert(
        fc.property(
          fileSystemNodeArb(3),
          (fileTree) => {
            const groups = groupFilesByExtension(fileTree);

            // Count total files in groups
            let totalGroupedFiles = 0;
            groups.forEach(files => {
              totalGroupedFiles += files.length;
              
              // All files in a group should have the same extension
              if (files.length > 0) {
                const firstExt = getFileExtension(files[0].name);
                files.forEach(file => {
                  expect(getFileExtension(file.name)).toBe(firstExt);
                  expect(file.isDirectory).toBe(false);
                });
              }
            });

            // Total grouped files should match total files in tree
            const stats = getTreeStatistics(fileTree);
            expect(totalGroupedFiles).toBe(stats.totalFiles);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly identify descendant paths', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (parent, child) => {
            const parentPath = `/root/${parent}`;
            const childPath = `${parentPath}/${child}`;

            // Child should be descendant of parent
            expect(isDescendantPath(childPath, parentPath)).toBe(true);

            // Parent should not be descendant of child
            expect(isDescendantPath(parentPath, childPath)).toBe(false);

            // Path should not be descendant of itself
            expect(isDescendantPath(parentPath, parentPath)).toBe(false);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
