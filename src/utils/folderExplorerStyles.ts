/**
 * Folder Explorer Styling Utilities
 * Provides styling and icon management for folder explorer nodes
 */

import type { Node } from '@antv/x6';
import type { FolderExplorerMetadata } from '../types';

/**
 * Icon constants for folder explorer nodes
 * Different icons for linked/static and folder/file combinations
 */
export const FOLDER_EXPLORER_ICONS = {
  linkedFolder: '📁',
  linkedFile: '📄',
  staticFolder: '📂',
  staticFile: '📃',
} as const;

/**
 * Color schemes for folder explorer nodes
 * Distinct colors help users identify node types at a glance
 */
export const FOLDER_EXPLORER_COLORS = {
  linked: {
    fill: '#E3F2FD',      // Light blue background
    stroke: '#1976D2',     // Blue border
    text: '#0D47A1',       // Dark blue text
  },
  static: {
    fill: '#F3E5F5',       // Light purple background
    stroke: '#7B1FA2',     // Purple border
    text: '#4A148C',       // Dark purple text
  },
  standard: {
    fill: '#FFFFFF',       // White background
    stroke: '#666666',     // Gray border
    text: '#000000',       // Black text
  },
} as const;

/**
 * Get the appropriate icon for a folder explorer node
 * @param metadata - Folder explorer metadata from node data
 * @returns Icon string (emoji)
 */
export const getNodeIcon = (metadata: FolderExplorerMetadata): string => {
  const { explorerType, isDirectory } = metadata;
  
  if (explorerType === 'linked') {
    return isDirectory ? FOLDER_EXPLORER_ICONS.linkedFolder : FOLDER_EXPLORER_ICONS.linkedFile;
  } else {
    return isDirectory ? FOLDER_EXPLORER_ICONS.staticFolder : FOLDER_EXPLORER_ICONS.staticFile;
  }
};

/**
 * Get the appropriate color scheme for a folder explorer node
 * @param explorerType - Type of folder explorer node ('linked' or 'static')
 * @returns Color scheme object
 */
export const getColorScheme = (explorerType: 'linked' | 'static') => {
  return FOLDER_EXPLORER_COLORS[explorerType];
};

/**
 * Apply folder explorer styling to a node
 * Updates the node's visual appearance based on its folder explorer type
 * @param node - X6 Node to style
 * @param metadata - Folder explorer metadata
 */
export const applyFolderExplorerStyling = (
  node: Node,
  metadata: FolderExplorerMetadata
): void => {
  const icon = getNodeIcon(metadata);
  const colors = getColorScheme(metadata.explorerType);
  
  // Get current label text
  const currentLabel = node.attr('label/text') as string || '';
  
  // Add icon prefix if not already present
  let newLabel = currentLabel;
  if (!currentLabel.startsWith(icon)) {
    newLabel = `${icon} ${currentLabel}`;
  }
  
  // Apply styling
  node.attr({
    body: {
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 2,
    },
    label: {
      text: newLabel,
      fill: colors.text,
    },
  });
  
  // Store original styling for potential restoration
  const nodeData = node.getData();
  if (!nodeData.originalStyling) {
    node.setData({
      ...nodeData,
      originalStyling: {
        fill: node.attr('body/fill'),
        stroke: node.attr('body/stroke'),
        strokeWidth: node.attr('body/strokeWidth'),
        textColor: node.attr('label/fill'),
      },
    });
  }
};

/**
 * Remove folder explorer styling from a node
 * Restores the node to standard mindmap styling
 * @param node - X6 Node to restore
 */
export const removeFolderExplorerStyling = (node: Node): void => {
  const nodeData = node.getData();
  const metadata = nodeData.folderExplorer as FolderExplorerMetadata | undefined;
  
  if (!metadata) {
    return; // Node is not a folder explorer node
  }
  
  // Get current label and remove icon prefix
  const currentLabel = node.attr('label/text') as string || '';
  const icon = getNodeIcon(metadata);
  let newLabel = currentLabel;
  
  if (currentLabel.startsWith(icon)) {
    newLabel = currentLabel.substring(icon.length).trim();
  }
  
  // Restore original styling or apply standard colors
  const originalStyling = nodeData.originalStyling;
  const standardColors = FOLDER_EXPLORER_COLORS.standard;
  
  node.attr({
    body: {
      fill: originalStyling?.fill || standardColors.fill,
      stroke: originalStyling?.stroke || standardColors.stroke,
      strokeWidth: originalStyling?.strokeWidth || 1,
    },
    label: {
      text: newLabel,
      fill: originalStyling?.textColor || standardColors.text,
    },
  });
  
  // Clean up stored styling data
  const { originalStyling: _, ...cleanData } = nodeData;
  node.setData(cleanData);
};

/**
 * Check if a node has folder explorer styling applied
 * @param node - X6 Node to check
 * @returns True if the node has folder explorer metadata
 */
export const hasFolderExplorerStyling = (node: Node): boolean => {
  const nodeData = node.getData();
  return nodeData.folderExplorer !== undefined;
};

/**
 * Update folder explorer styling when metadata changes
 * Useful when converting between linked and static types
 * @param node - X6 Node to update
 * @param newMetadata - Updated folder explorer metadata
 */
export const updateFolderExplorerStyling = (
  node: Node,
  newMetadata: FolderExplorerMetadata
): void => {
  // Remove old styling first
  removeFolderExplorerStyling(node);
  
  // Update metadata
  const nodeData = node.getData();
  node.setData({
    ...nodeData,
    folderExplorer: newMetadata,
  });
  
  // Apply new styling
  applyFolderExplorerStyling(node, newMetadata);
};
