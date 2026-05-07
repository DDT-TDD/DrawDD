/**
 * Recent Files Management Utility
 * Stores and retrieves recently opened files in localStorage
 * In web mode, also caches file content for re-opening
 */

const STORAGE_KEY = 'drawdd-recent-files';
const CONTENT_CACHE_KEY = 'drawdd-recent-content';
const MAX_RECENT_FILES = 10;

export interface RecentFile {
  name: string;
  path?: string;
  timestamp: number;
  type: 'json' | 'xmind' | 'mmap' | 'km' | 'mm' | 'vsdx' | 'drawio' | 'xml';
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
    localStorage.removeItem(CONTENT_CACHE_KEY);
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

/**
 * Cache file content for re-opening in web mode (no filesystem access).
 * Only caches DRAWDD-compatible JSON files (not binary formats like xmind/mmap/vsdx).
 */
export function cacheRecentFileContent(fileName: string, content: string): void {
  try {
    const cacheStr = localStorage.getItem(CONTENT_CACHE_KEY);
    const cache: Record<string, string> = cacheStr ? JSON.parse(cacheStr) : {};
    cache[fileName] = content;
    // Limit cache size: keep only the most recent MAX_RECENT_FILES entries
    const keys = Object.keys(cache);
    if (keys.length > MAX_RECENT_FILES) {
      // Remove oldest entries (first keys added)
      const toRemove = keys.slice(0, keys.length - MAX_RECENT_FILES);
      toRemove.forEach(k => delete cache[k]);
    }
    localStorage.setItem(CONTENT_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // localStorage might be full — silently fail, recent files will just open picker
    console.warn('Failed to cache recent file content:', error);
  }
}

/**
 * Retrieve cached file content for re-opening in web mode.
 * Returns null if not cached.
 */
export function getCachedFileContent(fileName: string): string | null {
  try {
    const cacheStr = localStorage.getItem(CONTENT_CACHE_KEY);
    if (!cacheStr) return null;
    const cache: Record<string, string> = JSON.parse(cacheStr);
    return cache[fileName] || null;
  } catch {
    return null;
  }
}
