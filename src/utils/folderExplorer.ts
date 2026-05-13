/**
 * Folder Explorer Mindmap Generator
 * Converts file system trees into mindmap structures
 */

import type { Graph, Node } from '@antv/x6';
import type { FileSystemNode } from '../services/electron';
import type { FolderExplorerMetadata, MindmapLayoutDirection } from '../types';
import { applyFolderExplorerStyling } from './folderExplorerStyles';
import { applyMindmapLayout } from './layout';

/**
 * Options for generating folder mindmaps
 */
export interface MindmapGeneratorOptions {
  rootX: number;
  rootY: number;
  explorerType: 'linked' | 'static';
  autoCollapseDepth: number;  // Default: 4
  direction: MindmapLayoutDirection;
  colorScheme?: string;
}

/**
 * Create mindmap ports for node connections
 */
const createMindmapPorts = () => ({
  groups: {
    left: {
      position: 'left',
      attrs: {
        circle: {
          r: 5,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 2,
          fill: '#fff'
        }
      }
    },
    right: {
      position: 'right',
      attrs: {
        circle: {
          r: 5,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 2,
          fill: '#fff'
        }
      }
    },
    top: {
      position: 'top',
      attrs: {
        circle: {
          r: 5,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 2,
          fill: '#fff'
        }
      }
    },
    bottom: {
      position: 'bottom',
      attrs: {
        circle: {
          r: 5,
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 2,
          fill: '#fff'
        }
      }
    },
  },
  items: [
    { group: 'left', id: 'left' },
    { group: 'right', id: 'right' },
    { group: 'top', id: 'top' },
    { group: 'bottom', id: 'bottom' },
  ],
});

const getStoredLayoutMode = (): 'standard' | 'compact' => {
  if (typeof localStorage === 'undefined') {
    return 'standard';
  }

  return localStorage.getItem('drawdd-mindmap-layout-mode') === 'compact'
    ? 'compact'
    : 'standard';
};

const setNodeVisible = (node: Node, visible: boolean): void => {
  if (typeof (node as any).setVisible === 'function') {
    (node as any).setVisible(visible);
  }
};

const bringNodeToFront = (node: Node): void => {
  if (typeof (node as any).toFront === 'function') {
    (node as any).toFront();
  }
};

const setEdgeVisible = (edge: any, visible: boolean): void => {
  if (typeof edge?.setVisible === 'function') {
    edge.setVisible(visible);
  }
};

const graphHasCell = (graph: Graph, cellId: string): boolean => {
  if (typeof (graph as any).hasCell === 'function') {
    return (graph as any).hasCell(cellId);
  }

  return !!graph.getCellById(cellId);
};

/**
 * Generate a unique ID for a node based on its path
 */
const generateNodeId = (graph: Graph, path: string): string => {
  const baseId = `folder-node-${path.replace(/[^a-zA-Z0-9]/g, '-')}`;

  if (!graph.getCellById(baseId)) {
    return baseId;
  }

  let suffix = 1;
  let nextId = `${baseId}-${suffix}`;
  while (graph.getCellById(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  return nextId;
};

/**
 * Create folder explorer metadata for a node
 */
const createFolderMetadata = (
  fileNode: FileSystemNode,
  explorerType: 'linked' | 'static'
): FolderExplorerMetadata => {
  return {
    isFolderExplorer: true,
    explorerType,
    path: fileNode.path,
    isDirectory: fileNode.isDirectory,
    isReadOnly: explorerType === 'linked',
    lastRefreshed: explorerType === 'linked' ? new Date().toISOString() : undefined,
  };
};

/**
 * Recursively create mindmap nodes from file tree
 */
const createNodesRecursive = (
  graph: Graph,
  fileNode: FileSystemNode,
  parentId: string | null,
  explorerType: 'linked' | 'static',
  autoCollapseDepth: number,
  currentDepth: number = 1,
  orderRef: { value: number },
  hiddenByCollapsedAncestor: boolean = false
): Node => {
  const nodeId = generateNodeId(graph, fileNode.path);

  // Determine node size based on depth
  const width = Math.max(120, 160 - currentDepth * 10);
  const height = Math.max(40, 60 - currentDepth * 5);

  // Create folder explorer metadata
  const folderMetadata = createFolderMetadata(fileNode, explorerType);

  const shouldCollapse = currentDepth > autoCollapseDepth;

  // Create node data
  const nodeData: any = {
    isMindmap: true,
    level: currentDepth,
    mmOrder: orderRef.value++,
    folderExplorer: folderMetadata,
    collapsed: shouldCollapse,
    text: fileNode.name,
  };

  // Create the node (initially at 0,0 - layout will position it)
  const node = graph.addNode({
    id: nodeId,
    shape: 'rich-content-node', // Use rich-content-node for folder explorer interactivity
    x: 0,
    y: 0,
    width,
    height,
    attrs: {
      body: {
        fill: '#FFFFFF',
        stroke: '#666666',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: fileNode.name,
        fill: '#000000',
        fontSize: Math.max(11, 14 - currentDepth),
        fontWeight: currentDepth === 1 ? 'bold' : 'normal',
      },
    },
    data: nodeData,
    ports: createMindmapPorts(),
  });

  // Apply folder explorer styling (adds icons and colors)
  applyFolderExplorerStyling(node, folderMetadata);
  setNodeVisible(node, !hiddenByCollapsedAncestor);

  // Create edge from parent if not root
  if (parentId) {
    const edge = graph.addEdge({
      source: parentId,
      target: nodeId,
      attrs: {
        line: {
          stroke: '#666666',
          strokeWidth: 2,
          targetMarker: null,
        },
      },
      connector: { name: 'smooth' },
      router: { name: 'normal' },
    });
    setEdgeVisible(edge, !hiddenByCollapsedAncestor);
  }

  // Recursively create child nodes
  if (fileNode.children && fileNode.children.length > 0) {
    fileNode.children.forEach(child => {
      createNodesRecursive(
        graph,
        child,
        nodeId,
        explorerType,
        autoCollapseDepth,
        currentDepth + 1,
        orderRef,
        hiddenByCollapsedAncestor || shouldCollapse
      );
    });
  }

  return node;
};

/**
 * Generate a folder mindmap from a file system tree
 * 
 * @param fileTree - Root of the file system tree
 * @param graph - X6 Graph instance
 * @param options - Generation options
 * @returns The root node of the generated mindmap
 */
export const generateFolderMindmap = (
  fileTree: FileSystemNode,
  graph: Graph,
  options: MindmapGeneratorOptions
): Node => {
  const {
    rootX,
    rootY,
    explorerType,
    autoCollapseDepth = 4,
    direction,
  } = options;

  // Track node order for mindmap
  const orderRef = { value: 0 };

  // Create all nodes recursively
  const rootNode = createNodesRecursive(
    graph,
    fileTree,
    null,
    explorerType,
    autoCollapseDepth,
    1,
    orderRef
  );

  // Position root node at specified location
  rootNode.setPosition({ x: rootX, y: rootY });

  // CRITICAL: Ensure root node is visible
  setNodeVisible(rootNode, true);
  bringNodeToFront(rootNode);

  // Apply mindmap layout
  const layoutMode = getStoredLayoutMode();
  setTimeout(() => {
    applyMindmapLayout(graph, direction, rootNode, layoutMode);
  }, 0);

  return rootNode;
};

/**
 * Get all descendant nodes of a given node
 * 
 * @param graph - X6 Graph instance
 * @param node - Parent node
 * @returns Array of all descendant nodes
 */
export const getAllDescendants = (graph: Graph, node: Node): Node[] => {
  const descendants: Node[] = [];
  const visited = new Set<string>();

  const traverse = (current: Node) => {
    const outgoing = graph.getOutgoingEdges(current) || [];
    outgoing.forEach(edge => {
      const targetId = edge.getTargetCellId();
      if (targetId && !visited.has(targetId)) {
        visited.add(targetId);
        const child = graph.getCellById(targetId) as Node;
        if (child) {
          descendants.push(child);
          traverse(child);
        }
      }
    });
  };

  traverse(node);
  return descendants;
};

/**
 * Remove all descendant nodes of a given node
 * 
 * @param graph - X6 Graph instance
 * @param node - Parent node
 */
export const removeDescendants = (graph: Graph, node: Node): void => {
  const descendants = getAllDescendants(graph, node).reverse();

  descendants.forEach(descendant => {
    try {
      if (graphHasCell(graph, descendant.id)) {
        graph.removeNode(descendant);
      }
    } catch (error) {
      console.error('Error removing descendant node:', error);
    }
  });
};

/**
 * Generate child nodes for a parent node from a file tree
 * Used for refresh operations
 * 
 * @param graph - X6 Graph instance
 * @param parentNode - Parent node to add children to
 * @param fileTree - File system tree to generate from
 * @param metadata - Folder explorer metadata from parent
 */
export const generateChildNodes = (
  graph: Graph,
  parentNode: Node,
  fileTree: FileSystemNode,
  metadata: FolderExplorerMetadata
): void => {
  if (!fileTree.children || fileTree.children.length === 0) {
    return;
  }

  const parentData = parentNode.getData();
  const currentDepth = parentData.level || 1;
  const orderRef = { value: parentData.mmOrder || 0 };

  // Get auto-collapse depth (default 4)
  const autoCollapseDepth = 4;

  // Create child nodes recursively
  fileTree.children.forEach(child => {
    createNodesRecursive(
      graph,
      child,
      parentNode.id,
      metadata.explorerType,
      autoCollapseDepth,
      currentDepth + 1,
      orderRef
    );
  });
};
