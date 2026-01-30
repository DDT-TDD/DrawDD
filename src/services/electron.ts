/**
 * Electron API wrapper for folder explorer functionality
 * Provides type-safe access to Electron IPC handlers
 */

// TypeScript types for Electron API responses
export interface SelectFolderResult {
  success: boolean;
  folderPath?: string;
  canceled?: boolean;
  error?: string;
}

export interface OpenFileResult {
  success: boolean;
  error?: string;
}

export interface FileSystemNode {
  name: string;
  path: string;
  isDirectory: boolean;
  isHidden?: boolean;
  children?: FileSystemNode[];
}

export interface ScanDirectoryResult {
  success: boolean;
  fileTree?: FileSystemNode;
  error?: string;
}

// Electron API interface
interface ElectronAPI {
  selectFolder: () => Promise<SelectFolderResult>;
  openFile: (filePath: string) => Promise<OpenFileResult>;
  scanDirectory: (dirPath: string, includeHidden: boolean) => Promise<ScanDirectoryResult>;
}

// Check if running in Electron environment
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         window.electronAPI !== undefined;
};

// Mock implementations for non-Electron environments (browser/dev)
const mockAPI: ElectronAPI = {
  selectFolder: async () => ({
    success: false,
    error: 'Folder selection is only available in Electron environment'
  }),
  openFile: async () => ({
    success: false,
    error: 'File opening is only available in Electron environment'
  }),
  scanDirectory: async () => ({
    success: false,
    error: 'Directory scanning is only available in Electron environment'
  })
};

/**
 * Select a folder using native dialog
 * @returns Promise with folder path or error
 */
export const selectFolder = async (): Promise<SelectFolderResult> => {
  if (!isElectron()) {
    return mockAPI.selectFolder();
  }
  return window.electronAPI.selectFolder();
};

/**
 * Open a file with the system's default application
 * @param filePath - Full path to the file to open
 * @returns Promise with success status or error
 */
export const openFile = async (filePath: string): Promise<OpenFileResult> => {
  if (!isElectron()) {
    return mockAPI.openFile(filePath);
  }
  return window.electronAPI.openFile(filePath);
};

/**
 * Scan a directory recursively and return file tree
 * @param dirPath - Full path to the directory to scan
 * @param includeHidden - Whether to include hidden files/folders
 * @returns Promise with file tree or error
 */
export const scanDirectory = async (
  dirPath: string, 
  includeHidden: boolean = false
): Promise<ScanDirectoryResult> => {
  if (!isElectron()) {
    return mockAPI.scanDirectory(dirPath, includeHidden);
  }
  return window.electronAPI.scanDirectory(dirPath, includeHidden);
};

// Export type for window.electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
