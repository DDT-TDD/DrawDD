/**
 * Property-Based Test for Markdown Application Across Node Types
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 4.2 Write property test for markdown application across node types
 * 
 * **Property 2: Markdown application across node types**
 * **Validates: Requirements 1.10**
 * 
 * For any node in any diagram mode, when markdown rendering is enabled,
 * the system should apply markdown rendering to the node's text content.
 */

import fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('Feature: markdown-and-folder-explorer, Property 2: Markdown application across node types', () => {
  /**
   * Property 2: Markdown application across node types
   * 
   * For any node in any diagram mode, when markdown rendering is enabled,
   * the system should apply markdown rendering to the node's text content.
   * 
   * **Validates: Requirements 1.10**
   */
  it('should apply markdown rendering to all node types when enabled', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary text with markdown syntax
        fc.oneof(
          fc.string(), // Plain text
          fc.record({
            text: fc.string(),
            marker: fc.constantFrom('**', '__', '*', '_', '`', '#', '##', '###'),
          }).map(({ text, marker }) => `${marker}${text}${marker}`), // Markdown formatted text
          fc.record({
            text: fc.string().filter(s => s.length > 0 && !s.includes(']') && !s.includes(')')),
            url: fc.webUrl(),
          }).map(({ text, url }) => `[${text}](${url})`), // Link
        ),
        // Generate node type (standard or static-folder, excluding linked-folder for this test)
        fc.constantFrom('standard', 'static-folder'),
        (text, nodeType) => {
          // Skip empty strings
          if (!text || text.trim().length === 0) return true;

          // Render with markdown enabled
          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const content = container.innerHTML;

          // Property: When markdown is enabled, the system should apply markdown rendering
          // This means the output should contain HTML tags (not just plain text)
          // OR if the text has no markdown syntax, it should at least be wrapped in a span
          
          // Check that content is not just the raw text (markdown was processed)
          const hasHtmlTags = /<[^>]+>/.test(content);
          
          // For text with markdown syntax, we expect HTML tags
          const hasMarkdownSyntax = /\*\*|__|`|#|^\[.*\]\(.*\)$/.test(text);
          
          if (hasMarkdownSyntax) {
            // If text has markdown syntax, output should contain HTML tags
            expect(hasHtmlTags).toBe(true);
          } else {
            // Even plain text should be wrapped in a span
            expect(content).toContain('<span>');
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2a: Markdown rendering should be disabled when enabled=false
   * 
   * This validates that the markdown toggle actually controls rendering behavior.
   * 
   * **Validates: Requirements 1.10, 2.3**
   */
  it('should NOT apply markdown rendering when disabled', () => {
    fc.assert(
      fc.property(
        // Generate text with markdown syntax
        fc.record({
          text: fc.string().filter(s => s.length > 0),
          marker: fc.constantFrom('**', '__', '*', '_'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        fc.constantFrom('standard', 'static-folder'),
        (text, nodeType) => {
          // Render with markdown disabled
          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: nodeType as 'standard' | 'static-folder'
            })
          );

          const content = container.textContent || '';

          // Property: When markdown is disabled, the raw text should be preserved
          // (including markdown syntax characters)
          expect(content).toBe(text);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2b: Linked folder nodes should never have markdown applied
   * 
   * This validates Requirement 1.15: Exclude markdown rendering for linked folder nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should NOT apply markdown rendering to linked-folder nodes regardless of enabled setting', () => {
    fc.assert(
      fc.property(
        // Generate text with markdown syntax
        fc.record({
          text: fc.string().filter(s => s.length > 0),
          marker: fc.constantFrom('**', '__', '*', '_'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        // Test with both enabled=true and enabled=false
        fc.boolean(),
        (text, enabled) => {
          // Render as linked-folder node
          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: enabled,
              nodeType: 'linked-folder'
            })
          );

          const content = container.textContent || '';

          // Property: Linked folder nodes should always show plain text
          // (no markdown processing, regardless of enabled setting)
          expect(content).toBe(text);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2c: Markdown rendering should work across different markdown syntax types
   * 
   * This validates that all markdown syntax types are properly rendered.
   * 
   * **Validates: Requirements 1.1-1.9**
   */
  it('should apply markdown rendering to all supported syntax types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && s.length < 50 && !s.includes('*') && !s.includes('_') && !s.includes('`') && !s.includes('~')),
        fc.constantFrom(
          { marker: '**', tag: 'strong' },      // Bold
          { marker: '__', tag: 'strong' },      // Bold (alt)
          { marker: '*', tag: 'em' },           // Italic
          { marker: '_', tag: 'em' },           // Italic (alt)
          { marker: '`', tag: 'code' },         // Inline code
          { marker: '~~', tag: 'del' },         // Strikethrough
        ),
        (text, { marker, tag }) => {
          const markedText = `${marker}${text}${marker}`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: markedText,
              enabled: true,
              nodeType: 'standard'
            })
          );

          const content = container.innerHTML;

          // Property: Markdown syntax should be converted to appropriate HTML tags
          // Note: Tags may have attributes (e.g., <del style="...">), so we check for opening tag pattern
          expect(content).toMatch(new RegExp(`<${tag}[\\s>]`));
          expect(content).toContain(`</${tag}>`);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2d: Markdown rendering should handle mixed content
   * 
   * This validates that markdown rendering works with complex, mixed content.
   * 
   * **Validates: Requirements 1.10**
   */
  it('should apply markdown rendering to mixed content with multiple syntax types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && s.length < 20 && !s.includes('*') && !s.includes('_')),
        fc.string().filter(s => s.length > 0 && s.length < 20 && !s.includes('*') && !s.includes('_')),
        (text1, text2) => {
          // Create mixed content: bold + italic
          const mixedText = `**${text1}** and *${text2}*`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: mixedText,
              enabled: true,
              nodeType: 'standard'
            })
          );

          const content = container.innerHTML;

          // Property: Both markdown syntaxes should be processed
          expect(content).toContain('<strong>');
          expect(content).toContain('<em>');

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2e: Markdown rendering should be consistent across node types
   * 
   * This validates that standard and static-folder nodes render markdown identically.
   * 
   * **Validates: Requirements 1.10**
   */
  it('should render markdown identically for standard and static-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string().filter(s => s.length > 0),
          marker: fc.constantFrom('**', '*', '`'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        (text) => {
          // Render as standard node
          const { container: standardContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'standard'
            })
          );

          // Render as static-folder node
          const { container: staticContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'static-folder'
            })
          );

          // Property: Both node types should produce identical output
          expect(standardContainer.innerHTML).toBe(staticContainer.innerHTML);

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
