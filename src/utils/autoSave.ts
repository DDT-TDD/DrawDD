import { useEffect, useCallback, useRef } from 'react';
import type { Graph } from '@antv/x6';
import { exportToJSON, importFromJSON } from './importExport';
import type { DrawddDocument } from '../types';

const STORAGE_KEY = 'drawdd-autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds debounce

export function useAutoSave(graph: Graph | null) {
  const timeoutRef = useRef<number | null>(null);
  const lastSavedRef = useRef<string>('');

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    if (!graph) return;
    
    try {
      const doc = exportToJSON(graph);
      const json = JSON.stringify(doc);
      
      // Only save if content has changed
      if (json !== lastSavedRef.current) {
        localStorage.setItem(STORAGE_KEY, json);
        lastSavedRef.current = json;
        console.log('[AutoSave] Diagram saved to localStorage');
      }
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error);
    }
  }, [graph]);

  // Debounced save
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(saveToStorage, AUTOSAVE_DELAY);
  }, [saveToStorage]);

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    if (!graph) return false;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const doc: DrawddDocument = JSON.parse(saved);
        
        // Only load if there's actual content
        if (doc.nodes && doc.nodes.length > 0) {
          importFromJSON(graph, doc);
          lastSavedRef.current = saved;
          console.log('[AutoSave] Diagram restored from localStorage');
          return true;
        }
      }
    } catch (error) {
      console.error('[AutoSave] Failed to load:', error);
    }
    return false;
  }, [graph]);

  // Clear saved data
  const clearStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    lastSavedRef.current = '';
    console.log('[AutoSave] Cleared saved diagram');
  }, []);

  // Check if there's saved data
  const hasSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const doc: DrawddDocument = JSON.parse(saved);
        return doc.nodes && doc.nodes.length > 0;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  // Setup event listeners for auto-save
  useEffect(() => {
    if (!graph) return;

    // Listen to cell changes
    const events = [
      'cell:added',
      'cell:removed',
      'cell:changed',
      'node:moved',
      'node:resized',
      'edge:connected',
    ];

    events.forEach((event) => {
      graph.on(event, debouncedSave);
    });

    // Save on beforeunload
    const handleBeforeUnload = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      saveToStorage();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      events.forEach((event) => {
        graph.off(event, debouncedSave);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [graph, debouncedSave, saveToStorage]);

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage,
    hasSavedData,
  };
}

// Utility function to check for saved data without hooks
export function checkForAutoSave(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const doc: DrawddDocument = JSON.parse(saved);
      return doc.nodes && doc.nodes.length > 0;
    }
  } catch {
    return false;
  }
  return false;
}

// Get last save time
export function getAutoSaveInfo(): { lastUpdated: string; nodeCount: number } | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const doc: DrawddDocument = JSON.parse(saved);
      return {
        lastUpdated: doc.metadata?.updatedAt || 'Unknown',
        nodeCount: doc.nodes?.length || 0,
      };
    }
  } catch {
    return null;
  }
  return null;
}
