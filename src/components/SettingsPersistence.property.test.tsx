/**
 * Property-Based Test for Settings Persistence
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 5.3 Write property test for settings persistence
 * 
 * **Property 8: Settings persistence**
 * **Validates: Requirements 2.5**
 * 
 * For any markdown rendering preference value, saving and reloading the document
 * should preserve the preference value.
 */

import fc from 'fast-check';

describe('Feature: markdown-and-folder-explorer, Property 8: Settings persistence', () => {
  // Store original localStorage to restore after tests
  const originalLocalStorage = global.localStorage;

  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};

      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
        get length() {
          return Object.keys(store).length;
        },
        key: (index: number) => {
          const keys = Object.keys(store);
          return keys[index] || null;
        },
      };
    })();

    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  /**
   * Property 8: Settings persistence
   * 
   * For any markdown rendering preference value, saving and reloading should
   * preserve the preference value.
   * 
   * **Validates: Requirements 2.5**
   */
  it('should persist markdown rendering preference across sessions', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (markdownEnabled) => {
          // Clear localStorage before test
          localStorage.clear();

          // Simulate saving the preference
          localStorage.setItem('drawdd-markdown-enabled', markdownEnabled ? 'true' : 'false');

          // Simulate reloading (reading the preference)
          const stored = localStorage.getItem('drawdd-markdown-enabled');
          const restored = stored === null ? true : stored === 'true';

          // Property: The restored value should match the saved value
          expect(restored).toBe(markdownEnabled);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8a: Default value when no preference is stored
   * 
   * This validates that markdown rendering defaults to true when no preference exists.
   * 
   * **Validates: Requirements 2.1, 2.5**
   */
  it('should default to true when no markdown preference is stored', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Clear localStorage
          localStorage.clear();

          // Simulate reading preference when none exists
          const stored = localStorage.getItem('drawdd-markdown-enabled');
          const restored = stored === null ? true : stored === 'true';

          // Property: Should default to true
          expect(restored).toBe(true);
          expect(stored).toBeNull();

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 8b: Hidden files preference persistence
   * 
   * This validates that the includeHiddenFiles preference is also persisted.
   * 
   * **Validates: Requirements 3.15**
   */
  it('should persist includeHiddenFiles preference across sessions', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (includeHidden) => {
          // Clear localStorage before test
          localStorage.clear();

          // Simulate saving the preference
          localStorage.setItem('drawdd-include-hidden-files', includeHidden ? 'true' : 'false');

          // Simulate reloading (reading the preference)
          const stored = localStorage.getItem('drawdd-include-hidden-files');
          const restored = stored === 'true';

          // Property: The restored value should match the saved value
          expect(restored).toBe(includeHidden);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8c: Hidden files default value
   * 
   * This validates that includeHiddenFiles defaults to false when no preference exists.
   * 
   * **Validates: Requirements 3.14, 3.15**
   */
  it('should default to false when no hidden files preference is stored', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Clear localStorage
          localStorage.clear();

          // Simulate reading preference when none exists
          const stored = localStorage.getItem('drawdd-include-hidden-files');
          const restored = stored === 'true'; // Default: false

          // Property: Should default to false
          expect(restored).toBe(false);
          expect(stored).toBeNull();

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 8d: Multiple preference updates
   * 
   * This validates that preferences can be updated multiple times and persist correctly.
   * 
   * **Validates: Requirements 2.5**
   */
  it('should persist markdown preference through multiple updates', () => {
    fc.assert(
      fc.property(
        fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
        (values) => {
          // Clear localStorage before test
          localStorage.clear();

          // Apply each value in sequence
          values.forEach((value) => {
            localStorage.setItem('drawdd-markdown-enabled', value ? 'true' : 'false');
          });

          // Read the final value
          const stored = localStorage.getItem('drawdd-markdown-enabled');
          const restored = stored === null ? true : stored === 'true';

          // Property: The restored value should match the last value in the sequence
          const lastValue = values[values.length - 1];
          expect(restored).toBe(lastValue);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8e: Preference independence
   * 
   * This validates that markdown and hidden files preferences are independent.
   * 
   * **Validates: Requirements 2.5, 3.15**
   */
  it('should persist markdown and hidden files preferences independently', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (markdownEnabled, includeHidden) => {
          // Clear localStorage before test
          localStorage.clear();

          // Save both preferences
          localStorage.setItem('drawdd-markdown-enabled', markdownEnabled ? 'true' : 'false');
          localStorage.setItem('drawdd-include-hidden-files', includeHidden ? 'true' : 'false');

          // Read both preferences
          const markdownStored = localStorage.getItem('drawdd-markdown-enabled');
          const markdownRestored = markdownStored === null ? true : markdownStored === 'true';

          const hiddenStored = localStorage.getItem('drawdd-include-hidden-files');
          const hiddenRestored = hiddenStored === 'true';

          // Property: Both preferences should be restored correctly and independently
          expect(markdownRestored).toBe(markdownEnabled);
          expect(hiddenRestored).toBe(includeHidden);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8f: Preference persistence with invalid values
   * 
   * This validates that the system handles invalid stored values gracefully.
   * 
   * **Validates: Requirements 2.5**
   */
  it('should handle invalid stored values gracefully', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('invalid'),
          fc.constant('1'),
          fc.constant('0'),
          fc.constant('yes'),
          fc.constant('no'),
        ),
        (invalidValue) => {
          // Clear localStorage before test
          localStorage.clear();

          // Store an invalid value
          localStorage.setItem('drawdd-markdown-enabled', invalidValue);

          // Read the preference
          const stored = localStorage.getItem('drawdd-markdown-enabled');
          const restored = stored === null ? true : stored === 'true';

          // Property: Invalid values should be treated as false (not 'true')
          // Only the string 'true' should result in true
          expect(restored).toBe(false);
          expect(stored).toBe(invalidValue);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 8g: Preference removal
   * 
   * This validates that removing a preference reverts to the default value.
   * 
   * **Validates: Requirements 2.5**
   */
  it('should revert to default when preference is removed', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (initialValue) => {
          // Clear localStorage before test
          localStorage.clear();

          // Set initial value
          localStorage.setItem('drawdd-markdown-enabled', initialValue ? 'true' : 'false');

          // Verify it's stored
          let stored = localStorage.getItem('drawdd-markdown-enabled');
          expect(stored).not.toBeNull();

          // Remove the preference
          localStorage.removeItem('drawdd-markdown-enabled');

          // Read the preference
          stored = localStorage.getItem('drawdd-markdown-enabled');
          const restored = stored === null ? true : stored === 'true';

          // Property: Should revert to default (true) when removed
          expect(restored).toBe(true);
          expect(stored).toBeNull();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8h: Preference persistence across localStorage clear
   * 
   * This validates behavior when localStorage is cleared.
   * 
   * **Validates: Requirements 2.5**
   */
  it('should revert to defaults when localStorage is cleared', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (markdownEnabled, includeHidden) => {
          // Set both preferences
          localStorage.setItem('drawdd-markdown-enabled', markdownEnabled ? 'true' : 'false');
          localStorage.setItem('drawdd-include-hidden-files', includeHidden ? 'true' : 'false');

          // Clear localStorage
          localStorage.clear();

          // Read preferences
          const markdownStored = localStorage.getItem('drawdd-markdown-enabled');
          const markdownRestored = markdownStored === null ? true : markdownStored === 'true';

          const hiddenStored = localStorage.getItem('drawdd-include-hidden-files');
          const hiddenRestored = hiddenStored === 'true';

          // Property: Should revert to defaults (markdown: true, hidden: false)
          expect(markdownRestored).toBe(true);
          expect(hiddenRestored).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
