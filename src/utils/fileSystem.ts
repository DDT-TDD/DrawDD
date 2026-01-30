/**
 * File system utilities for folder explorer functionality
 * Provides helper functions for processing file system data
 */

import type { FileSystemNode } from '../services/electron';

/**
 * Count total number of nodes in a file tree
 * @param node - Root node of the file tree
 * @returns Total count of files and folders
 */
export const countNodes = (node: FileSystemNode): number => {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
};

/**
 * Get the depth of a file tree
 * @param node - Root node of the file tree
 * @returns Maximum depth of the tree
 */
export const getTreeDepth = (node: FileSystemNode): number => {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  return 1 + Math.max(...node.children.map(child => getTreeDepth(child)));
};

/**
 * Check if a file tree contains any hidden files or folders
 * @param node - Root node of the file tree
 * @returns True if any hidden files/folders are present
 */
export const hasHiddenFiles = (node: FileSystemNode): boolean => {
  if (node.isHidden) {
    return true;
  }
  if (node.children) {
    return node.children.some(child => hasHiddenFiles(child));
  }
  return false;
};

/**
 * Filter out hidden files and folders from a file tree
 * @param node - Root node of the file tree
 * @returns New tree with hidden files removed
 */
export const filterHiddenFiles = (node: FileSystemNode): FileSystemNode | null => {
  // If this node is hidden, exclude it
  if (node.isHidden) {
    return null;
  }
  
  // If it's a file, return it as-is
  if (!node.children) {
    return { ...node };
  }
  
  // If it's a directory, filter children recursively
  const filteredChildren = node.children
    .map(child => filterHiddenFiles(child))
    .filter((child): child is FileSystemNode => child !== null);
  
  return {
    ...node,
    children: filteredChildren
  };
};

/**
 * Get all file paths from a file tree
 * @param node - Root node of the file tree
 * @param includeDirectories - Whether to include directory paths
 * @returns Array of file paths
 */
export const getAllPaths = (
  node: FileSystemNode, 
  includeDirectories: boolean = false
): string[] => {
  const paths: string[] = [];
  
  if (!node.isDirectory || includeDirectories) {
    paths.push(node.path);
  }
  
  if (node.children) {
    for (const child of node.children) {
      paths.push(...getAllPaths(child, includeDirectories));
    }
  }
  
  return paths;
};

/**
 * Find a node by path in a file tree
 * @param root - Root node of the file tree
 * @param targetPath - Path to search for
 * @returns The node if found, null otherwise
 */
export const findNodeByPath = (
  root: FileSystemNode, 
  targetPath: string
): FileSystemNode | null => {
  if (root.path === targetPath) {
    return root;
  }
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
};

/**
 * Get all nodes at a specific depth level
 * @param node - Root node of the file tree
 * @param targetDepth - Depth level to retrieve (1-based)
 * @param currentDepth - Current depth (used internally for recursion)
 * @returns Array of nodes at the target depth
 */
export const getNodesAtDepth = (
  node: FileSystemNode,
  targetDepth: number,
  currentDepth: number = 1
): FileSystemNode[] => {
  if (currentDepth === targetDepth) {
    return [node];
  }
  
  if (!node.children || currentDepth >= targetDepth) {
    return [];
  }
  
  return node.children.flatMap(child => 
    getNodesAtDepth(child, targetDepth, currentDepth + 1)
  );
};

/**
 * Check if a path is a descendant of another path
 * @param childPath - Path to check
 * @param parentPath - Potential parent path
 * @returns True if childPath is under parentPath (but not equal to parentPath)
 */
export const isDescendantPath = (childPath: string, parentPath: string): boolean => {
  // Normalize paths to use forward slashes
  const normalizedChild = childPath.replace(/\\/g, '/');
  const normalizedParent = parentPath.replace(/\\/g, '/');
  
  // A path cannot be a descendant of itself
  if (normalizedChild === normalizedParent) {
    return false;
  }
  
  // Ensure parent path ends with slash for accurate comparison
  const parentWithSlash = normalizedParent.endsWith('/') 
    ? normalizedParent 
    : normalizedParent + '/';
  
  return normalizedChild.startsWith(parentWithSlash);
};

/**
 * Sort file tree children (directories first, then alphabetically)
 * @param node - Root node of the file tree
 * @returns New tree with sorted children
 */
export const sortFileTree = (node: FileSystemNode): FileSystemNode => {
  if (!node.children || node.children.length === 0) {
    return { ...node };
  }
  
  const sortedChildren = [...node.children]
    .map(child => sortFileTree(child))
    .sort((a, b) => {
      // Directories come before files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      
      // Alphabetical order within same type
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  
  return {
    ...node,
    children: sortedChildren
  };
};

/**
 * Get file extension from a file name
 * @param fileName - Name of the file
 * @returns File extension (without dot) or empty string
 */
export const getFileExtension = (fileName: string): string => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return '';
  }
  return fileName.substring(lastDot + 1).toLowerCase();
};

/**
 * Group files by extension
 * @param node - Root node of the file tree
 * @returns Map of extension to file nodes
 */
export const groupFilesByExtension = (
  node: FileSystemNode
): Map<string, FileSystemNode[]> => {
  const groups = new Map<string, FileSystemNode[]>();
  
  const traverse = (current: FileSystemNode) => {
    if (!current.isDirectory) {
      const ext = getFileExtension(current.name);
      const key = ext || '(no extension)';
      const existing = groups.get(key) || [];
      groups.set(key, [...existing, current]);
    }
    
    if (current.children) {
      current.children.forEach(traverse);
    }
  };
  
  traverse(node);
  return groups;
};

/**
 * Calculate total size statistics for a file tree
 * Note: This only counts nodes, not actual file sizes
 * @param node - Root node of the file tree
 * @returns Statistics object
 */
export const getTreeStatistics = (node: FileSystemNode): {
  totalNodes: number;
  totalFiles: number;
  totalDirectories: number;
  maxDepth: number;
  hasHidden: boolean;
} => {
  let totalFiles = 0;
  let totalDirectories = 0;
  let hasHidden = false;
  
  const traverse = (current: FileSystemNode) => {
    if (current.isDirectory) {
      totalDirectories++;
    } else {
      totalFiles++;
    }
    
    if (current.isHidden) {
      hasHidden = true;
    }
    
    if (current.children) {
      current.children.forEach(traverse);
    }
  };
  
  traverse(node);
  
  return {
    totalNodes: totalFiles + totalDirectories,
    totalFiles,
    totalDirectories,
    maxDepth: getTreeDepth(node),
    hasHidden
  };
};
