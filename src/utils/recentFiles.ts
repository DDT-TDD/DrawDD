/**
 * Recent Files Management Utility
 * Stores and retrieves recently opened files in localStorage
 */

const STORAGE_KEY = 'drawdd-recent-files';
const MAX_RECENT_FILES = 10;

export interface RecentFile {
  name: string;
  path?: string;
  timestamp: number;
  type: 'json' | 'xmind' | 'mmap' | 'km' | 'mm' | 'vsdx';
}

/**
 * Get all recent files from storage
 */
export function getRecentFiles(): RecentFile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const files = JSON.parse(stored) as RecentFile[];
    // Sort by timestamp, newest first
    return files.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

/**
 * Add a file to recent files list
 */
export function addRecentFile(file: Omit<RecentFile, 'timestamp'>): void {
  try {
    const files = getRecentFiles();
    
    // Remove existing entry with same name/path if present
    const filtered = files.filter(f => {
      if (file.path && f.path) {
        return f.path !== file.path;
      }
      return f.name !== file.name;
    });
    
    // Add new entry at the beginning
    filtered.unshift({
      ...file,
      timestamp: Date.now(),
    });
    
    // Keep only MAX_RECENT_FILES
    const trimmed = filtered.slice(0, MAX_RECENT_FILES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('drawdd:recent-files-changed'));
  } catch (error) {
    console.error('Failed to save recent file:', error);
  }
}

/**
 * Remove a file from recent files list
 */
export function removeRecentFile(name: string, path?: string): void {
  try {
    const files = getRecentFiles();
    const filtered = files.filter(f => {
      if (path && f.path) {
        return f.path !== path;
      }
      return f.name !== name;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('drawdd:recent-files-changed'));
  } catch (error) {
    console.error('Failed to remove recent file:', error);
  }
}

/**
 * Clear all recent files
 */
export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('drawdd:recent-files-changed'));
  } catch (error) {
    console.error('Failed to clear recent files:', error);
  }
}

/**
 * Check if recent files exist
 */
export function hasRecentFiles(): boolean {
  return getRecentFiles().length > 0;
}
