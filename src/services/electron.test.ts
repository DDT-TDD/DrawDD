/**
 * Unit tests for Electron API wrapper
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { selectFolder, openFile, scanDirectory } from './electron';

describe('Electron API wrapper', () => {
  beforeEach(() => {
    // Clean up window.electronAPI before each test
    delete (window as any).electronAPI;
  });

  describe('Non-Electron environment (browser)', () => {
    it('selectFolder should return error when not in Electron', async () => {
      const result = await selectFolder();
      expect(result.success).toBe(false);
      expect(result.error).toContain('only available in Electron environment');
    });

    it('openFile should return error when not in Electron', async () => {
      const result = await openFile('/some/path');
      expect(result.success).toBe(false);
      expect(result.error).toContain('only available in Electron environment');
    });

    it('scanDirectory should return error when not in Electron', async () => {
      const result = await scanDirectory('/some/path', false);
      expect(result.success).toBe(false);
      expect(result.error).toContain('only available in Electron environment');
    });
  });

  describe('Electron environment (mocked)', () => {
    beforeEach(() => {
      // Mock Electron API
      (window as any).electronAPI = {
        selectFolder: async () => ({
          success: true,
          folderPath: '/test/folder'
        }),
        openFile: async (filePath: string) => ({
          success: true
        }),
        scanDirectory: async (dirPath: string, includeHidden: boolean) => ({
          success: true,
          fileTree: {
            name: 'test',
            path: dirPath,
            isDirectory: true,
            children: []
          }
        })
      };
    });

    it('selectFolder should call Electron API', async () => {
      const result = await selectFolder();
      expect(result.success).toBe(true);
      expect(result.folderPath).toBe('/test/folder');
    });

    it('openFile should call Electron API', async () => {
      const result = await openFile('/test/file.txt');
      expect(result.success).toBe(true);
    });

    it('scanDirectory should call Electron API', async () => {
      const result = await scanDirectory('/test/dir', false);
      expect(result.success).toBe(true);
      expect(result.fileTree).toBeDefined();
      expect(result.fileTree?.name).toBe('test');
      expect(result.fileTree?.isDirectory).toBe(true);
    });

    it('scanDirectory should pass includeHidden parameter', async () => {
      let capturedIncludeHidden: boolean | undefined;
      (window as any).electronAPI.scanDirectory = async (
        dirPath: string, 
        includeHidden: boolean
      ) => {
        capturedIncludeHidden = includeHidden;
        return {
          success: true,
          fileTree: {
            name: 'test',
            path: dirPath,
            isDirectory: true,
            children: []
          }
        };
      };

      await scanDirectory('/test/dir', true);
      expect(capturedIncludeHidden).toBe(true);

      await scanDirectory('/test/dir', false);
      expect(capturedIncludeHidden).toBe(false);
    });
  });

  describe('Type safety', () => {
    it('should have correct TypeScript types for FileSystemNode', () => {
      const node: import('./electron').FileSystemNode = {
        name: 'test.txt',
        path: '/test/test.txt',
        isDirectory: false,
        isHidden: false
      };

      expect(node.name).toBe('test.txt');
      expect(node.isDirectory).toBe(false);
    });

    it('should have correct TypeScript types for FileSystemNode with children', () => {
      const node: import('./electron').FileSystemNode = {
        name: 'folder',
        path: '/test/folder',
        isDirectory: true,
        children: [
          {
            name: 'file.txt',
            path: '/test/folder/file.txt',
            isDirectory: false
          }
        ]
      };

      expect(node.children).toHaveLength(1);
      expect(node.children?.[0].name).toBe('file.txt');
    });
  });
});
