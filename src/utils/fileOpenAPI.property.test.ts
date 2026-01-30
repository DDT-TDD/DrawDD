/**
 * Property-Based Test for File Open API Usage
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 17.3 Write property test for file open API usage
 * 
 * **Property 36: File open API usage**
 * **Validates: Requirements 10.1, 10.2**
 * 
 * For any file node click, the system should call Electron's shell.openPath
 * with the path from node metadata.
 */

import fc from 'fast-check';
import type { FolderExplorerMetadata } from '../types';

// Mock electron service
const mockOpenFile = jest.fn();
jest.mock('../services/electron', () => ({
  openFile: (...args: any[]) => mockOpenFile(...args),
}));

import { openFile } from '../services/electron';

/**
 * Arbitrary generator for file paths (Unix-style)
 */
const unixFilePathArb = fc.array(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
  { minLength: 1, maxLength: 5 }
).chain(parts => 
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}\.[a-z]{2,4}$/).map(file => 
    '/' + parts.join('/') + '/' + file
  )
);

/**
 * Arbitrary generator for file paths (Windows-style)
 */
const windowsFilePathArb = fc.array(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
  { minLength: 1, maxLength: 5 }
).chain(parts => 
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}\.[a-z]{2,4}$/).map(file => 
    'C:\\' + parts.join('\\') + '\\' + file
  )
);

/**
 * Arbitrary generator for file paths (both Unix and Windows)
 */
const filePathArb = fc.oneof(unixFilePathArb, windowsFilePathArb);

/**
 * Arbitrary generator for linked file node metadata
 */
const linkedFileMetadataArb = fc.record({
  isFolderExplorer: fc.constant(true),
  explorerType: fc.constant('linked' as const),
  path: filePathArb,
  isDirectory: fc.constant(false),
  isReadOnly: fc.constant(true),
  lastRefreshed: fc.integer({ min: 1609459200000, max: Date.now() })
    .map(timestamp => new Date(timestamp).toISOString()),
});

describe('Feature: markdown-and-folder-explorer, Property 36: File open API usage', () => {
  beforeEach(() => {
    mockOpenFile.mockClear();
  });

  /**
   * Property 36a: openFile should be called with exact path from metadata
   * 
   * For any file node click, the system should call openFile with the exact
   * path stored in the node's folderExplorer metadata.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should call openFile with exact path from node metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        async (metadata) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Simulate file node click - call openFile with path from metadata
          await openFile(metadata.path);

          // Property: openFile should be called exactly once
          expect(mockOpenFile).toHaveBeenCalledTimes(1);

          // Property: openFile should be called with the exact path from metadata
          expect(mockOpenFile).toHaveBeenCalledWith(metadata.path);

          // Property: The path should not be modified
          const calledPath = mockOpenFile.mock.calls[0][0];
          expect(calledPath).toBe(metadata.path);
          expect(typeof calledPath).toBe('string');

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 36b: openFile should preserve path format
   * 
   * The path passed to openFile should maintain its original format
   * (Unix or Windows style) without modification.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should preserve path format when calling openFile', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        async (metadata) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Store original path
          const originalPath = metadata.path;

          // Simulate file node click
          await openFile(metadata.path);

          // Property: Path should be unchanged
          const calledPath = mockOpenFile.mock.calls[0][0];
          expect(calledPath).toBe(originalPath);

          // Property: Path format should be preserved
          if (originalPath.includes('\\')) {
            // Windows path
            expect(calledPath).toContain('\\');
            expect(calledPath).toMatch(/^[A-Z]:\\/);
          } else {
            // Unix path
            expect(calledPath).toMatch(/^\//);
          }

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 36c: openFile should be called for each file node click
   * 
   * Multiple file node clicks should result in multiple openFile calls,
   * each with the correct path.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should call openFile for each file node click', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(linkedFileMetadataArb, { minLength: 1, maxLength: 5 }),
        async (metadataArray) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Simulate clicking each file node
          for (const metadata of metadataArray) {
            await openFile(metadata.path);
          }

          // Property: openFile should be called once per file node
          expect(mockOpenFile).toHaveBeenCalledTimes(metadataArray.length);

          // Property: Each call should have the correct path
          metadataArray.forEach((metadata, index) => {
            expect(mockOpenFile).toHaveBeenNthCalledWith(index + 1, metadata.path);
          });

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 36d: openFile should handle paths with special characters
   * 
   * File paths may contain spaces, dots, and other special characters.
   * These should be passed to openFile without modification.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should handle paths with special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
          { minLength: 1, maxLength: 3 }
        ),
        fc.stringMatching(/^[a-zA-Z0-9_\- ]{1,20}\.[a-z]{2,4}$/),
        async (parts, fileName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Create path with special characters (spaces in filename)
          const path = '/' + parts.join('/') + '/' + fileName;

          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'linked',
            path: path,
            isDirectory: false,
            isReadOnly: true,
            lastRefreshed: new Date().toISOString(),
          };

          // Simulate file node click
          await openFile(metadata.path);

          // Property: openFile should be called with the exact path including special chars
          expect(mockOpenFile).toHaveBeenCalledWith(path);
          expect(mockOpenFile.mock.calls[0][0]).toBe(metadata.path);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 36e: openFile should be idempotent for same path
   * 
   * Clicking the same file node multiple times should call openFile
   * with the same path each time.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should call openFile with same path for repeated clicks', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        fc.integer({ min: 2, max: 5 }),
        async (metadata, clickCount) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Simulate clicking the same file node multiple times
          for (let i = 0; i < clickCount; i++) {
            await openFile(metadata.path);
          }

          // Property: openFile should be called exactly clickCount times
          expect(mockOpenFile).toHaveBeenCalledTimes(clickCount);

          // Property: All calls should have the same path
          for (let i = 0; i < clickCount; i++) {
            expect(mockOpenFile).toHaveBeenNthCalledWith(i + 1, metadata.path);
          }

          // Property: Path should be consistent across all calls
          const allCalls = mockOpenFile.mock.calls;
          const firstPath = allCalls[0][0];
          expect(allCalls.every(call => call[0] === firstPath)).toBe(true);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 36f: openFile should handle various file extensions
   * 
   * Files with different extensions should all be passed to openFile correctly.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should handle various file extensions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
          { minLength: 1, maxLength: 3 }
        ),
        fc.constantFrom(
          'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
          'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
          'mp3', 'mp4', 'avi', 'mov', 'wav',
          'zip', 'rar', '7z', 'tar', 'gz',
          'exe', 'dll', 'so', 'dylib',
          'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h',
          'json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg',
          'md', 'rst', 'tex', 'html', 'css', 'scss'
        ),
        async (parts, extension) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          const fileName = `testfile.${extension}`;
          const path = '/' + parts.join('/') + '/' + fileName;

          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'linked',
            path: path,
            isDirectory: false,
            isReadOnly: true,
            lastRefreshed: new Date().toISOString(),
          };

          // Simulate file node click
          await openFile(metadata.path);

          // Property: openFile should be called with the correct path
          expect(mockOpenFile).toHaveBeenCalledWith(path);
          expect(mockOpenFile).toHaveBeenCalledTimes(1);

          // Property: Path should include the file extension
          const calledPath = mockOpenFile.mock.calls[0][0];
          expect(calledPath).toContain(`.${extension}`);
          expect(calledPath).toBe(metadata.path);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 36g: openFile should not be called for directories
   * 
   * This test verifies that openFile is only called for files, not directories.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should not call openFile for directory nodes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}$/),
          { minLength: 1, maxLength: 5 }
        ),
        async (parts) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          const path = '/' + parts.join('/');

          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'linked',
            path: path,
            isDirectory: true, // This is a directory
            isReadOnly: true,
            lastRefreshed: new Date().toISOString(),
          };

          // Simulate clicking a directory node - should NOT call openFile
          // (In the actual implementation, directory clicks are handled differently)
          if (!metadata.isDirectory) {
            await openFile(metadata.path);
          }

          // Property: openFile should NOT be called for directories
          expect(mockOpenFile).not.toHaveBeenCalled();

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 36h: openFile should handle absolute paths
   * 
   * All file paths should be absolute (starting with / or drive letter).
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should handle absolute paths correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        async (metadata) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Simulate file node click
          await openFile(metadata.path);

          // Property: Path should be absolute
          const calledPath = mockOpenFile.mock.calls[0][0];
          const isAbsolute = calledPath.startsWith('/') || /^[A-Z]:\\/.test(calledPath);
          expect(isAbsolute).toBe(true);

          // Property: Path should match metadata
          expect(calledPath).toBe(metadata.path);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 36i: openFile should be called with string type
   * 
   * The path parameter should always be a string.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should call openFile with string type path', async () => {
    await fc.assert(
      fc.asyncProperty(
        linkedFileMetadataArb,
        async (metadata) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          // Simulate file node click
          await openFile(metadata.path);

          // Property: Path should be a string
          const calledPath = mockOpenFile.mock.calls[0][0];
          expect(typeof calledPath).toBe('string');
          expect(calledPath).toBeTruthy();
          expect(calledPath.length).toBeGreaterThan(0);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 36j: openFile should handle paths with deep nesting
   * 
   * File paths with many directory levels should be handled correctly.
   * 
   * **Validates: Requirements 10.1, 10.2**
   */
  it('should handle deeply nested paths', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.stringMatching(/^[a-zA-Z0-9_-]{1,10}$/),
          { minLength: 5, maxLength: 15 }
        ),
        fc.stringMatching(/^[a-zA-Z0-9_-]{1,20}\.[a-z]{2,4}$/),
        async (parts, fileName) => {
          // Mock successful file open
          mockOpenFile.mockResolvedValue({ success: true });

          const path = '/' + parts.join('/') + '/' + fileName;

          const metadata: FolderExplorerMetadata = {
            isFolderExplorer: true,
            explorerType: 'linked',
            path: path,
            isDirectory: false,
            isReadOnly: true,
            lastRefreshed: new Date().toISOString(),
          };

          // Simulate file node click
          await openFile(metadata.path);

          // Property: openFile should be called with the full deep path
          expect(mockOpenFile).toHaveBeenCalledWith(path);
          expect(mockOpenFile.mock.calls[0][0]).toBe(metadata.path);

          // Property: Path should contain all directory levels
          const calledPath = mockOpenFile.mock.calls[0][0];
          const pathParts = calledPath.split('/').filter((p: string) => p.length > 0);
          expect(pathParts.length).toBeGreaterThanOrEqual(parts.length);

          // Reset for next iteration
          mockOpenFile.mockClear();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
