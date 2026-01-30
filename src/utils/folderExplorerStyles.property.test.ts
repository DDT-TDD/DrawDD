/**
 * Property-Based Tests for Folder Explorer Styling
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 10.2, 10.3, 10.4 - Property tests for folder explorer styling utilities
 * 
 * These tests validate the correctness of folder explorer visual styling.
 */

import fc from 'fast-check';
import type { FolderExplorerMetadata } from '../types';
import {
  FOLDER_EXPLORER_ICONS,
  FOLDER_EXPLORER_COLORS,
  getNodeIcon,
  getColorScheme,
} from './folderExplorerStyles';

/**
 * Generator for FolderExplorerMetadata
 * Creates valid folder explorer metadata for testing
 */
const folderExplorerMetadataArb = fc.record({
  isFolderExplorer: fc.constant(true),
  explorerType: fc.constantFrom('linked', 'static') as fc.Arbitrary<'linked' | 'static'>,
  path: fc.string({ minLength: 5, maxLength: 50 }).map(s => `/path/to/${s}`),
  isDirectory: fc.boolean(),
  isReadOnly: fc.boolean(),
  lastRefreshed: fc.option(
    fc.integer({ min: 1609459200000, max: Date.now() }).map(timestamp => new Date(timestamp).toISOString()),
    { nil: undefined }
  ),
});

describe('Feature: markdown-and-folder-explorer, Folder Explorer Styling Properties', () => {
  /**
   * Property 19: Node type icon correctness
   * 
   * For any folder explorer node, the displayed icon should correctly indicate:
   * (1) linked vs static, and (2) folder vs file.
   * 
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  describe('Property 19: Node type icon correctness', () => {
    it('should return correct icon for linked folders', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb.map(m => ({ ...m, explorerType: 'linked' as const, isDirectory: true })),
          (metadata) => {
            const icon = getNodeIcon(metadata);
            expect(icon).toBe(FOLDER_EXPLORER_ICONS.linkedFolder);
            expect(icon).toBe('📁');
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return correct icon for linked files', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb.map(m => ({ ...m, explorerType: 'linked' as const, isDirectory: false })),
          (metadata) => {
            const icon = getNodeIcon(metadata);
            expect(icon).toBe(FOLDER_EXPLORER_ICONS.linkedFile);
            expect(icon).toBe('📄');
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return correct icon for static folders', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb.map(m => ({ ...m, explorerType: 'static' as const, isDirectory: true })),
          (metadata) => {
            const icon = getNodeIcon(metadata);
            expect(icon).toBe(FOLDER_EXPLORER_ICONS.staticFolder);
            expect(icon).toBe('📂');
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return correct icon for static files', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb.map(m => ({ ...m, explorerType: 'static' as const, isDirectory: false })),
          (metadata) => {
            const icon = getNodeIcon(metadata);
            expect(icon).toBe(FOLDER_EXPLORER_ICONS.staticFile);
            expect(icon).toBe('📃');
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should use different icons for different node types', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb,
          folderExplorerMetadataArb,
          (metadata1, metadata2) => {
            const icon1 = getNodeIcon(metadata1);
            const icon2 = getNodeIcon(metadata2);

            // If the types are the same, icons should be the same
            const sameType = 
              metadata1.explorerType === metadata2.explorerType &&
              metadata1.isDirectory === metadata2.isDirectory;

            if (sameType) {
              expect(icon1).toBe(icon2);
            }

            // All icons should be valid strings
            expect(typeof icon1).toBe('string');
            expect(typeof icon2).toBe('string');
            expect(icon1.length).toBeGreaterThan(0);
            expect(icon2.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return one of the four defined icons', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb,
          (metadata) => {
            const icon = getNodeIcon(metadata);
            const validIcons = Object.values(FOLDER_EXPLORER_ICONS);
            
            expect(validIcons).toContain(icon);
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should consistently return same icon for same metadata', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb,
          (metadata) => {
            const icon1 = getNodeIcon(metadata);
            const icon2 = getNodeIcon(metadata);
            const icon3 = getNodeIcon(metadata);

            // Should be deterministic
            expect(icon1).toBe(icon2);
            expect(icon2).toBe(icon3);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should distinguish between folders and files', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb,
          (metadata) => {
            const folderMetadata = { ...metadata, isDirectory: true };
            const fileMetadata = { ...metadata, isDirectory: false };

            const folderIcon = getNodeIcon(folderMetadata);
            const fileIcon = getNodeIcon(fileMetadata);

            // Folder and file icons should be different
            expect(folderIcon).not.toBe(fileIcon);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should distinguish between linked and static', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb,
          (metadata) => {
            const linkedMetadata = { ...metadata, explorerType: 'linked' as const };
            const staticMetadata = { ...metadata, explorerType: 'static' as const };

            const linkedIcon = getNodeIcon(linkedMetadata);
            const staticIcon = getNodeIcon(staticMetadata);

            // Linked and static icons should be different
            expect(linkedIcon).not.toBe(staticIcon);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 20: Node type styling correctness
   * 
   * For any folder explorer node, the styling (colors, borders) should correctly
   * distinguish linked nodes from static nodes from standard nodes.
   * 
   * **Validates: Requirements 5.4, 5.5**
   */
  describe('Property 20: Node type styling correctness', () => {
    it('should return correct color scheme for linked nodes', () => {
      fc.assert(
        fc.property(
          fc.constant('linked' as const),
          (explorerType) => {
            const colors = getColorScheme(explorerType);
            const expectedColors = FOLDER_EXPLORER_COLORS.linked;

            expect(colors).toBe(expectedColors);
            expect(colors.fill).toBe(expectedColors.fill);
            expect(colors.stroke).toBe(expectedColors.stroke);
            expect(colors.text).toBe(expectedColors.text);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return correct color scheme for static nodes', () => {
      fc.assert(
        fc.property(
          fc.constant('static' as const),
          (explorerType) => {
            const colors = getColorScheme(explorerType);
            const expectedColors = FOLDER_EXPLORER_COLORS.static;

            expect(colors).toBe(expectedColors);
            expect(colors.fill).toBe(expectedColors.fill);
            expect(colors.stroke).toBe(expectedColors.stroke);
            expect(colors.text).toBe(expectedColors.text);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should use different colors for linked vs static nodes', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          () => {
            const linkedColors = FOLDER_EXPLORER_COLORS.linked;
            const staticColors = FOLDER_EXPLORER_COLORS.static;

            // Colors should be different
            expect(linkedColors.fill).not.toBe(staticColors.fill);
            expect(linkedColors.stroke).not.toBe(staticColors.stroke);
            expect(linkedColors.text).not.toBe(staticColors.text);

            return true;
          }
        ),
        { numRuns: 1 }
      );
    });

    it('should return consistent colors for same explorer type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('linked', 'static') as fc.Arbitrary<'linked' | 'static'>,
          (explorerType) => {
            const colors1 = getColorScheme(explorerType);
            const colors2 = getColorScheme(explorerType);

            // Should return same reference
            expect(colors1).toBe(colors2);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should have all required color properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('linked', 'static') as fc.Arbitrary<'linked' | 'static'>,
          (explorerType) => {
            const colors = getColorScheme(explorerType);

            // Should have all required properties
            expect(colors.fill).toBeDefined();
            expect(colors.stroke).toBeDefined();
            expect(colors.text).toBeDefined();

            // All should be strings (color codes)
            expect(typeof colors.fill).toBe('string');
            expect(typeof colors.stroke).toBe('string');
            expect(typeof colors.text).toBe('string');

            // Should start with # (hex color)
            expect(colors.fill).toMatch(/^#[0-9A-F]{6}$/i);
            expect(colors.stroke).toMatch(/^#[0-9A-F]{6}$/i);
            expect(colors.text).toMatch(/^#[0-9A-F]{6}$/i);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should have distinct colors from standard nodes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('linked', 'static') as fc.Arbitrary<'linked' | 'static'>,
          (explorerType) => {
            const colors = getColorScheme(explorerType);
            const standardColors = FOLDER_EXPLORER_COLORS.standard;

            // Folder explorer colors should be different from standard
            expect(colors.fill).not.toBe(standardColors.fill);
            expect(colors.stroke).not.toBe(standardColors.stroke);
            expect(colors.text).not.toBe(standardColors.text);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should use blue tones for linked nodes', () => {
      fc.assert(
        fc.property(
          fc.constant('linked' as const),
          (explorerType) => {
            const colors = getColorScheme(explorerType);

            // Linked nodes should use blue color scheme
            expect(colors.fill).toBe('#E3F2FD');
            expect(colors.stroke).toBe('#1976D2');
            expect(colors.text).toBe('#0D47A1');

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should use purple tones for static nodes', () => {
      fc.assert(
        fc.property(
          fc.constant('static' as const),
          (explorerType) => {
            const colors = getColorScheme(explorerType);

            // Static nodes should use purple color scheme
            expect(colors.fill).toBe('#F3E5F5');
            expect(colors.stroke).toBe('#7B1FA2');
            expect(colors.text).toBe('#4A148C');

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 21: Unlink visual cleanup
   * 
   * For any node that is unlinked, all folder explorer visual indicators
   * (icons, styling) should be removed.
   * 
   * **Validates: Requirements 5.6**
   * 
   * Note: This property is validated through integration tests with actual X6 nodes
   * in the Canvas component tests, as it requires DOM manipulation.
   */
  describe('Property 21: Unlink visual cleanup', () => {
    it('should define standard colors for restoration', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          () => {
            const standardColors = FOLDER_EXPLORER_COLORS.standard;

            // Standard colors should be defined
            expect(standardColors).toBeDefined();
            expect(standardColors.fill).toBe('#FFFFFF');
            expect(standardColors.stroke).toBe('#666666');
            expect(standardColors.text).toBe('#000000');

            return true;
          }
        ),
        { numRuns: 1 }
      );
    });

    it('should have all icon types defined for removal detection', () => {
      fc.assert(
        fc.property(
          fc.constant(true),
          () => {
            // All four icon types should be defined
            expect(FOLDER_EXPLORER_ICONS.linkedFolder).toBeDefined();
            expect(FOLDER_EXPLORER_ICONS.linkedFile).toBeDefined();
            expect(FOLDER_EXPLORER_ICONS.staticFolder).toBeDefined();
            expect(FOLDER_EXPLORER_ICONS.staticFile).toBeDefined();

            // All should be unique
            const icons = Object.values(FOLDER_EXPLORER_ICONS);
            const uniqueIcons = new Set(icons);
            expect(uniqueIcons.size).toBe(icons.length);

            return true;
          }
        ),
        { numRuns: 1 }
      );
    });

    it('should provide icon detection for any metadata', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb,
          (metadata) => {
            const icon = getNodeIcon(metadata);
            
            // Icon should be one of the defined icons
            const allIcons = Object.values(FOLDER_EXPLORER_ICONS);
            expect(allIcons).toContain(icon);

            // This allows removal logic to detect and remove the correct icon
            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Additional utility function tests
   */
  describe('Folder explorer styling utility functions', () => {
    it('should correctly get color scheme for explorer type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('linked', 'static') as fc.Arbitrary<'linked' | 'static'>,
          (explorerType) => {
            const colors = getColorScheme(explorerType);

            expect(colors).toBeDefined();
            expect(colors.fill).toBeDefined();
            expect(colors.stroke).toBeDefined();
            expect(colors.text).toBeDefined();

            // Should match the constant
            expect(colors).toBe(FOLDER_EXPLORER_COLORS[explorerType]);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain icon consistency across calls', () => {
      fc.assert(
        fc.property(
          folderExplorerMetadataArb,
          (metadata) => {
            // Multiple calls should return same icon
            const icons = Array.from({ length: 10 }, () => getNodeIcon(metadata));
            const uniqueIcons = new Set(icons);

            expect(uniqueIcons.size).toBe(1);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain color scheme consistency across calls', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('linked', 'static') as fc.Arbitrary<'linked' | 'static'>,
          (explorerType) => {
            // Multiple calls should return same reference
            const colors = Array.from({ length: 10 }, () => getColorScheme(explorerType));
            const uniqueColors = new Set(colors);

            expect(uniqueColors.size).toBe(1);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
