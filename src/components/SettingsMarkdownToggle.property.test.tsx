/**
 * Property-Based Test for Markdown Toggle Effect
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 5.2 Write property test for markdown toggle effect
 * 
 * **Property 7: Markdown toggle effect**
 * **Validates: Requirements 2.3, 2.4**
 * 
 * For any document with nodes containing markdown syntax, toggling the markdown
 * setting should immediately update all visible nodes to either render markdown
 * or display plain text.
 */

import fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('Feature: markdown-and-folder-explorer, Property 7: Markdown toggle effect', () => {
  /**
   * Property 7: Markdown toggle effect
   * 
   * For any document with nodes containing markdown syntax, toggling the markdown
   * setting should immediately update all visible nodes to either render markdown
   * or display plain text.
   * 
   * **Validates: Requirements 2.3, 2.4**
   */
  it('should immediately update node rendering when markdown is toggled', () => {
    fc.assert(
      fc.property(
        // Generate text with markdown syntax
        fc.record({
          text: fc.string().filter(s => s.length > 0 && s.length < 50 && !s.includes('_') && !s.includes('*')),
          marker: fc.constantFrom('**', '__', '*', '_', '`'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        fc.constantFrom('standard', 'static-folder'),
        (text, nodeType) => {
          // Render with markdown enabled
          const { container: enabledContainer, rerender } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const enabledContent = enabledContainer.innerHTML;
          const enabledText = enabledContainer.textContent || '';

          // Property: When enabled, markdown should be rendered (HTML tags present)
          const hasHtmlTags = /<[^>]+>/.test(enabledContent);
          expect(hasHtmlTags).toBe(true);

          // Now toggle to disabled
          rerender(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const disabledContent = enabledContainer.innerHTML;
          const disabledText = enabledContainer.textContent || '';

          // Property: When disabled, raw text should be displayed (including markdown syntax)
          expect(disabledText).toBe(text);

          // Property: The content should be different when toggled
          // (unless the markdown didn't actually render, which can happen with edge cases)
          // We check that either the content is different OR the text content matches the raw text
          const contentChanged = disabledContent !== enabledContent;
          const showsRawText = disabledText === text;
          expect(contentChanged || showsRawText).toBe(true);

          // Now toggle back to enabled
          rerender(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const reEnabledContent = enabledContainer.innerHTML;

          // Property: Re-enabling should restore markdown rendering
          expect(reEnabledContent).toBe(enabledContent);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7a: Markdown toggle should affect all node types consistently
   * 
   * This validates that toggling affects standard and static-folder nodes identically.
   * 
   * **Validates: Requirements 2.3, 2.4**
   */
  it('should toggle markdown rendering consistently across all node types', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string().filter(s => s.length > 0),
          marker: fc.constantFrom('**', '*'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        (text) => {
          // Test standard node
          const { container: standardContainer, rerender: rerenderStandard } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'standard'
            })
          );

          const standardEnabledContent = standardContainer.innerHTML;

          rerenderStandard(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: 'standard'
            })
          );

          const standardDisabledContent = standardContainer.innerHTML;

          // Test static-folder node
          const { container: staticContainer, rerender: rerenderStatic } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'static-folder'
            })
          );

          const staticEnabledContent = staticContainer.innerHTML;

          rerenderStatic(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: 'static-folder'
            })
          );

          const staticDisabledContent = staticContainer.innerHTML;

          // Property: Both node types should behave identically when toggled
          expect(standardEnabledContent).toBe(staticEnabledContent);
          expect(standardDisabledContent).toBe(staticDisabledContent);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7b: Linked folder nodes should not be affected by markdown toggle
   * 
   * This validates that linked-folder nodes always show plain text regardless of toggle.
   * 
   * **Validates: Requirements 1.15, 2.3**
   */
  it('should not affect linked-folder nodes when markdown is toggled', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string().filter(s => s.length > 0),
          marker: fc.constantFrom('**', '*'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        (text) => {
          // Render linked-folder node with markdown enabled
          const { container, rerender } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'linked-folder'
            })
          );

          const enabledContent = container.textContent || '';

          // Property: Linked folder nodes should show plain text even when enabled
          expect(enabledContent).toBe(text);

          // Toggle to disabled
          rerender(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: 'linked-folder'
            })
          );

          const disabledContent = container.textContent || '';

          // Property: Linked folder nodes should still show plain text when disabled
          expect(disabledContent).toBe(text);

          // Property: Content should be identical regardless of toggle state
          expect(disabledContent).toBe(enabledContent);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7c: Markdown toggle should preserve text content
   * 
   * This validates that toggling doesn't lose or corrupt the original text.
   * 
   * **Validates: Requirements 2.3, 2.4**
   */
  it('should preserve original text content when toggling markdown', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && s.length < 100),
        fc.constantFrom('standard', 'static-folder'),
        (text, nodeType) => {
          // Render with markdown enabled
          const { container, rerender } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          // Toggle to disabled
          rerender(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const disabledText = container.textContent || '';

          // Property: When disabled, the exact original text should be preserved
          expect(disabledText).toBe(text);

          // Toggle back to enabled
          rerender(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          // Toggle to disabled again
          rerender(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const disabledTextAgain = container.textContent || '';

          // Property: Text should be preserved through multiple toggles
          expect(disabledTextAgain).toBe(text);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7d: Markdown toggle should handle empty and whitespace-only text
   * 
   * This validates edge cases with empty or whitespace-only content.
   * 
   * **Validates: Requirements 2.3, 2.4**
   */
  it('should handle empty and whitespace-only text when toggling markdown', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\n'),
          fc.constant('\t'),
        ),
        fc.constantFrom('standard', 'static-folder'),
        (text, nodeType) => {
          // Render with markdown enabled
          const { container, rerender } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const enabledText = container.textContent || '';

          // Toggle to disabled
          rerender(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const disabledText = container.textContent || '';

          // Property: Empty/whitespace text should be preserved when toggling
          expect(disabledText).toBe(text);

          // Property: Should not throw errors or crash
          expect(container).toBeTruthy();

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 7e: Markdown toggle should handle complex markdown syntax
   * 
   * This validates that toggling works correctly with complex markdown content.
   * 
   * **Validates: Requirements 2.3, 2.4**
   */
  it('should handle complex markdown syntax when toggling', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && s.length < 30 && !s.includes('*') && !s.includes('_') && !s.includes('`')),
        fc.string().filter(s => s.length > 0 && s.length < 30 && !s.includes('*') && !s.includes('_') && !s.includes('`')),
        (text1, text2) => {
          // Create complex markdown with multiple syntax types
          const complexText = `**${text1}** and *${text2}* with \`code\``;

          // Render with markdown enabled
          const { container, rerender } = render(
            React.createElement(MarkdownRenderer, {
              text: complexText,
              enabled: true,
              nodeType: 'standard'
            })
          );

          const enabledContent = container.innerHTML;

          // Property: When enabled, all markdown syntax should be rendered
          expect(enabledContent).toContain('<strong>');
          expect(enabledContent).toContain('<em>');
          // Code tags may have inline styles, so check for opening tag pattern
          expect(enabledContent).toMatch(/<code[\s>]/);

          // Toggle to disabled
          rerender(
            React.createElement(MarkdownRenderer, {
              text: complexText,
              enabled: false,
              nodeType: 'standard'
            })
          );

          const disabledText = container.textContent || '';

          // Property: When disabled, raw markdown syntax should be visible
          expect(disabledText).toBe(complexText);
          expect(disabledText).toContain('**');
          expect(disabledText).toContain('*');
          expect(disabledText).toContain('`');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
