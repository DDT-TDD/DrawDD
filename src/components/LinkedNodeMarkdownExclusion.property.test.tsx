/**
 * Property-Based Test for Linked Node Markdown Exclusion
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 6.2 Write property test for linked node markdown exclusion
 * 
 * **Property 6: Linked node markdown exclusion**
 * **Validates: Requirements 1.15**
 * 
 * For any node with folderExplorer.explorerType === 'linked', the system should
 * NOT apply markdown rendering regardless of the global markdown setting.
 */

import fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';

describe('Feature: markdown-and-folder-explorer, Property 6: Linked node markdown exclusion', () => {
  /**
   * Property 6: Linked node markdown exclusion
   * 
   * For any node with folderExplorer.explorerType === 'linked', the system should
   * NOT apply markdown rendering regardless of the global markdown setting.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should NOT apply markdown rendering to linked-folder nodes regardless of enabled setting', () => {
    fc.assert(
      fc.property(
        // Generate text with various markdown syntax
        fc.oneof(
          // Plain text
          fc.string().filter(s => s.length > 0),
          // Bold text
          fc.record({
            text: fc.string().filter(s => s.length > 0 && !s.includes('*') && !s.includes('_')),
            marker: fc.constantFrom('**', '__'),
          }).map(({ text, marker }) => `${marker}${text}${marker}`),
          // Italic text
          fc.record({
            text: fc.string().filter(s => s.length > 0 && !s.includes('*') && !s.includes('_')),
            marker: fc.constantFrom('*', '_'),
          }).map(({ text, marker }) => `${marker}${text}${marker}`),
          // Code
          fc.string().filter(s => s.length > 0 && !s.includes('`')).map(text => `\`${text}\``),
          // Link
          fc.record({
            text: fc.string().filter(s => s.length > 0 && !s.includes(']') && !s.includes(')')),
            url: fc.webUrl().filter(u => !u.includes(')')),
          }).map(({ text, url }) => `[${text}](${url})`),
          // Image
          fc.record({
            alt: fc.string().filter(s => !s.includes(']') && !s.includes(')')),
            url: fc.webUrl().filter(u => !u.includes(')')),
          }).map(({ alt, url }) => `![${alt}](${url})`),
        ),
        // Test with both enabled=true and enabled=false
        fc.boolean(),
        (text, enabled) => {
          // Render as linked-folder node
          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          const textContent = container.textContent || '';
          const htmlContent = container.innerHTML;

          // Property: Linked folder nodes should always show plain text
          // (no markdown processing, regardless of enabled setting)
          expect(textContent).toBe(text);

          // Property: No HTML tags should be present (except the wrapper span)
          // Count opening tags - should only be the wrapper span
          const tagMatches = htmlContent.match(/<[^>]+>/g);
          if (tagMatches) {
            const openingTags = tagMatches.filter(tag => !tag.startsWith('</'));
            
            // Should only have one opening tag (the wrapper span)
            expect(openingTags.length).toBe(1);
            expect(openingTags[0]).toMatch(/<span[^>]*>/);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6a: Linked folder nodes should never render bold markdown
   * 
   * This validates that bold syntax is not processed for linked nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should not render bold markdown in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && !s.includes('*') && !s.includes('_')),
        fc.constantFrom('**', '__'),
        fc.boolean(),
        (text, marker, enabled) => {
          const markedText = `${marker}${text}${marker}`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: markedText,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          const htmlContent = container.innerHTML;

          // Property: No <strong> tags should be present
          expect(htmlContent).not.toContain('<strong>');
          expect(htmlContent).not.toContain('</strong>');

          // Property: Raw markdown syntax should be visible
          expect(container.textContent).toBe(markedText);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6b: Linked folder nodes should never render italic markdown
   * 
   * This validates that italic syntax is not processed for linked nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should not render italic markdown in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && !s.includes('*') && !s.includes('_')),
        fc.constantFrom('*', '_'),
        fc.boolean(),
        (text, marker, enabled) => {
          const markedText = `${marker}${text}${marker}`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: markedText,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          const htmlContent = container.innerHTML;

          // Property: No <em> tags should be present
          expect(htmlContent).not.toContain('<em>');
          expect(htmlContent).not.toContain('</em>');

          // Property: Raw markdown syntax should be visible
          expect(container.textContent).toBe(markedText);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6c: Linked folder nodes should never render code markdown
   * 
   * This validates that code syntax is not processed for linked nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should not render code markdown in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && !s.includes('`')),
        fc.boolean(),
        (text, enabled) => {
          const markedText = `\`${text}\``;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: markedText,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          const htmlContent = container.innerHTML;

          // Property: No <code> tags should be present
          expect(htmlContent).not.toContain('<code>');
          expect(htmlContent).not.toContain('</code>');

          // Property: Raw markdown syntax should be visible
          expect(container.textContent).toBe(markedText);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6d: Linked folder nodes should never render link markdown
   * 
   * This validates that link syntax is not processed for linked nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should not render link markdown in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && !s.includes(']') && !s.includes(')')),
        fc.webUrl().filter(u => !u.includes(')')),
        fc.boolean(),
        (text, url, enabled) => {
          const linkMarkdown = `[${text}](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: linkMarkdown,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          const htmlContent = container.innerHTML;

          // Property: No <a> tags should be present
          expect(htmlContent).not.toContain('<a ');
          expect(htmlContent).not.toContain('</a>');

          // Property: Raw markdown syntax should be visible
          expect(container.textContent).toBe(linkMarkdown);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6e: Linked folder nodes should never render image markdown
   * 
   * This validates that image syntax is not processed for linked nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should not render image markdown in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes(']') && !s.includes(')')),
        fc.webUrl().filter(u => !u.includes(')')),
        fc.boolean(),
        (alt, url, enabled) => {
          const imageMarkdown = `![${alt}](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: imageMarkdown,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          const htmlContent = container.innerHTML;

          // Property: No <img> tags should be present
          expect(htmlContent).not.toContain('<img');

          // Property: Raw markdown syntax should be visible
          expect(container.textContent).toBe(imageMarkdown);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6f: Linked folder nodes should differ from standard nodes
   * 
   * This validates that linked-folder nodes behave differently from standard nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should render differently than standard nodes with same text', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string().filter(s => s.length > 0 && !s.includes('*') && !s.includes('_')),
          marker: fc.constantFrom('**', '*', '`'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        (text) => {
          // Render as standard node with markdown enabled
          const { container: standardContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'standard',
            })
          );

          // Render as linked-folder node with markdown enabled
          const { container: linkedContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'linked-folder',
            })
          );

          const standardHtml = standardContainer.innerHTML;
          const linkedHtml = linkedContainer.innerHTML;

          // Property: The HTML output should be different
          // (standard should have markdown rendered, linked should not)
          expect(standardHtml).not.toBe(linkedHtml);

          // Property: Linked node should show raw text
          expect(linkedContainer.textContent).toBe(text);

          // Property: Standard node should have HTML tags for markdown
          const hasHtmlTags = /<(strong|em|code)[\s>]/.test(standardHtml);
          expect(hasHtmlTags).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6g: Linked folder nodes should differ from static-folder nodes
   * 
   * This validates that linked-folder nodes behave differently from static-folder nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should render differently than static-folder nodes with markdown text', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string().filter(s => s.length > 0 && !s.includes('*') && !s.includes('_')),
          marker: fc.constantFrom('**', '*'),
        }).map(({ text, marker }) => `${marker}${text}${marker}`),
        (text) => {
          // Render as static-folder node with markdown enabled
          const { container: staticContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'static-folder',
            })
          );

          // Render as linked-folder node with markdown enabled
          const { container: linkedContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'linked-folder',
            })
          );

          const staticHtml = staticContainer.innerHTML;
          const linkedHtml = linkedContainer.innerHTML;

          // Property: The HTML output should be different
          // (static should have markdown rendered, linked should not)
          expect(staticHtml).not.toBe(linkedHtml);

          // Property: Linked node should show raw text
          expect(linkedContainer.textContent).toBe(text);

          // Property: Static node should have HTML tags for markdown
          const hasHtmlTags = /<(strong|em)[\s>]/.test(staticHtml);
          expect(hasHtmlTags).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6h: Linked folder nodes should handle complex markdown
   * 
   * This validates that even complex markdown is not processed for linked nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should not render complex markdown with multiple syntax types in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && s.length < 20 && !s.includes('*') && !s.includes('_') && !s.includes('`')),
        fc.string().filter(s => s.length > 0 && s.length < 20 && !s.includes('*') && !s.includes('_') && !s.includes('`')),
        fc.boolean(),
        (text1, text2, enabled) => {
          // Create complex markdown with multiple syntax types
          const complexText = `**${text1}** and *${text2}* with \`code\``;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: complexText,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          const htmlContent = container.innerHTML;

          // Property: No markdown HTML tags should be present
          expect(htmlContent).not.toContain('<strong>');
          expect(htmlContent).not.toContain('<em>');
          expect(htmlContent).not.toContain('<code>');

          // Property: Raw markdown syntax should be visible
          expect(container.textContent).toBe(complexText);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6i: Linked folder nodes should preserve all characters
   * 
   * This validates that no characters are lost or transformed for linked nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should preserve all characters exactly in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && s.length < 100),
        fc.boolean(),
        (text, enabled) => {
          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: enabled,
              nodeType: 'linked-folder',
            })
          );

          // Property: The text content should be exactly the input text
          // (no characters lost, no transformations)
          expect(container.textContent).toBe(text);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6j: Linked folder nodes should be consistent regardless of enabled flag
   * 
   * This validates that the enabled flag has no effect on linked-folder nodes.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should render identically with enabled=true and enabled=false for linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0),
        (text) => {
          // Render with enabled=true
          const { container: enabledContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'linked-folder',
            })
          );

          // Render with enabled=false
          const { container: disabledContainer } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: false,
              nodeType: 'linked-folder',
            })
          );

          // Property: Both should produce identical output
          expect(enabledContainer.innerHTML).toBe(disabledContainer.innerHTML);
          expect(enabledContainer.textContent).toBe(disabledContainer.textContent);
          expect(enabledContainer.textContent).toBe(text);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
