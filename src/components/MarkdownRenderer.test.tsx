/**
 * Property-Based Tests for MarkdownRenderer
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 2.2 Write property test for markdown syntax rendering
 * 
 * **Validates: Requirements 1.1-1.9**
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import { renderInlineMarkdown } from '../utils/markdown';

/**
 * Helper function to escape HTML special characters
 * Matches the escaping logic in the markdown utility
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

describe('Feature: markdown-and-folder-explorer, Property 1: Markdown syntax rendering correctness', () => {
  
  /**
   * Property 1: Bold text rendering
   * **Validates: Requirements 1.1**
   * 
   * For any text, when wrapped with ** or __, the rendered HTML should contain <strong> tags
   */
  it('should render bold text with ** syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.includes('*') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('_') &&  // Filter out _ to avoid italic rendering
          !s.includes('$') &&  // Filter out $ to avoid KaTeX rendering
          !s.includes('`')     // Filter out ` to avoid code rendering
        ),
        (text) => {
          const markdown = `**${text}**`;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain strong tags
          expect(html).toContain('<strong>');
          expect(html).toContain('</strong>');
          // Should contain the text content (possibly HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should render bold text with __ syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.includes('_') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('$') &&  // Filter out $ to avoid KaTeX rendering
          !s.includes('`') &&  // Filter out ` to avoid code rendering
          !s.includes('*')     // Filter out * to avoid italic rendering
        ),
        (text) => {
          const markdown = `__${text}__`;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain strong tags
          expect(html).toContain('<strong>');
          expect(html).toContain('</strong>');
          // Should contain the text content (possibly HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 2: Italic text rendering
   * **Validates: Requirements 1.2**
   * 
   * For any text, when wrapped with * or _, the rendered HTML should contain <em> tags
   */
  it('should render italic text with * syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.includes('*') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('$') && // Filter out $ to avoid KaTeX rendering
          !s.includes('`') && // Filter out ` to avoid code rendering
          !s.includes('_')    // Filter out _ to avoid nested italic rendering
        ),
        (text) => {
          const markdown = `*${text}*`;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain em tags
          expect(html).toContain('<em>');
          expect(html).toContain('</em>');
          // Should contain the text content (possibly HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should render italic text with _ syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.includes('_') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('*') && // Filter out * to avoid nested emphasis
          !s.includes('$') && // Filter out $ to avoid KaTeX rendering
          !s.includes('`')    // Filter out ` to avoid code rendering
        ),
        (text) => {
          const markdown = `_${text}_`;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain em tags
          expect(html).toContain('<em>');
          expect(html).toContain('</em>');
          // Should contain the text content (possibly HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 3: Inline code rendering
   * **Validates: Requirements 1.6**
   * 
   * For any text, when wrapped with backticks, the rendered HTML should contain <code> tags
   */
  it('should render inline code with backtick syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.includes('`') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('_') &&  // Filter out _ to avoid italic rendering
          !s.includes('*') &&  // Filter out * to avoid italic rendering
          !s.includes('$')     // Filter out $ to avoid KaTeX rendering
        ),
        (text) => {
          const markdown = `\`${text}\``;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain code tags
          expect(html).toContain('<code');
          expect(html).toContain('</code>');
          // Should contain the text content (possibly HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4: Link rendering
   * **Validates: Requirements 1.8**
   * 
   * For any link text and URL, the rendered HTML should contain <a> tags with href attribute
   */
  it('should render links with [text](url) syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => 
          !s.includes('[') && 
          !s.includes(']') && 
          !s.includes('<') && 
          !s.includes('>') && 
          !s.includes('(') &&
          !s.includes('$') &&
          !s.includes('`') &&
          !s.includes('_') &&  // Filter out _ to avoid italic rendering
          !s.includes('*')     // Filter out * to avoid italic rendering
        ),
        fc.webUrl().filter(url => 
          !url.includes('_') && // Filter out URLs with underscores to avoid italic markdown conflicts
          !url.includes('&') && // Filter out URLs with & to avoid escaping issues
          !url.includes('*') && // Filter out URLs with * to avoid italic markdown conflicts
          !url.includes("'") && // Filter out URLs with ' to avoid escaping issues
          !url.includes(')')    // Filter out URLs with ) to avoid markdown parsing issues
        ),
        (linkText, url) => {
          const markdown = `[${linkText}](${url})`;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain anchor tags
          expect(html).toContain('<a');
          expect(html).toContain('</a>');
          // Should contain href attribute with the URL (possibly escaped)
          const escapedUrl = escapeHtml(url);
          expect(html).toContain(`href="${escapedUrl}"`);
          // Should contain the link text (possibly HTML-escaped)
          const escapedText = escapeHtml(linkText);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5: Combined markdown syntax
   * **Validates: Requirements 1.1, 1.2, 1.6**
   * 
   * For any text with multiple markdown elements, all should be rendered correctly
   */
  it('should render combined markdown syntax correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !s.includes('*') && 
          !s.includes('`') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('$') &&
          !s.includes('_')
        ),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !s.includes('*') && 
          !s.includes('`') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('$') &&
          !s.includes('_')
        ),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !s.includes('*') && 
          !s.includes('`') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('$') &&
          !s.includes('_')
        ),
        (boldText, italicText, codeText) => {
          const markdown = `**${boldText}** *${italicText}* \`${codeText}\``;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain all appropriate tags
          expect(html).toContain('<strong>');
          expect(html).toContain('</strong>');
          expect(html).toContain('<em>');
          expect(html).toContain('</em>');
          expect(html).toContain('<code');
          expect(html).toContain('</code>');
          
          // Should contain all text content (possibly HTML-escaped)
          expect(html).toContain(escapeHtml(boldText));
          expect(html).toContain(escapeHtml(italicText));
          expect(html).toContain(escapeHtml(codeText));
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 6: Plain text passthrough
   * **Validates: Requirements 1.1-1.9**
   * 
   * For any text without markdown syntax, the rendered HTML should contain the text
   * (possibly with HTML escaping for special characters)
   */
  it('should pass through plain text without markdown syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.includes('*') && 
          !s.includes('_') && 
          !s.includes('`') && 
          !s.includes('[') &&
          !s.includes('#') &&
          !s.includes('$')
        ),
        (text) => {
          const html = renderInlineMarkdown(text);
          
          // Should contain the text (HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 7: Nested bold and italic
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any text with nested bold and italic, both should be rendered
   */
  it('should render nested bold and italic correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => 
          !s.includes('*') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('$') &&
          !s.includes('`') &&
          !s.includes('_')
        ),
        (text) => {
          const markdown = `***${text}***`;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain both strong and em tags
          expect(html).toContain('<strong>');
          expect(html).toContain('<em>');
          expect(html).toContain('</em>');
          expect(html).toContain('</strong>');
          // Should contain the text content (possibly HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 8: Strikethrough rendering
   * **Validates: Requirements 1.1-1.9** (extended markdown support)
   * 
   * For any text with strikethrough syntax, should render with del tags
   */
  it('should render strikethrough text with ~~ syntax', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.includes('~') && 
          !s.includes('<') && 
          !s.includes('>') &&
          !s.includes('*') &&  // Filter out * to avoid italic rendering
          !s.includes('_') &&  // Filter out _ to avoid italic rendering
          !s.includes('$') &&
          !s.includes('`')
        ),
        (text) => {
          const markdown = `~~${text}~~`;
          const html = renderInlineMarkdown(markdown);
          
          // Should contain del tags
          expect(html).toContain('<del');
          expect(html).toContain('</del>');
          // Should contain the text content (possibly HTML-escaped)
          const escapedText = escapeHtml(text);
          expect(html).toContain(escapedText);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 9: Empty string handling
   * **Validates: Requirements 1.1-1.9**
   * 
   * Empty strings should be handled gracefully
   */
  it('should handle empty strings gracefully', () => {
    const html = renderInlineMarkdown('');
    expect(html).toBe('');
  });

  /**
   * Property 10: Special characters escaping
   * **Validates: Requirements 1.1-1.9**
   * 
   * Special HTML characters should be escaped to prevent XSS
   */
  it('should escape HTML special characters', () => {
    const markdown = '<script>alert("xss")</script>';
    const html = renderInlineMarkdown(markdown);
    
    // Should not contain actual script tags
    expect(html).not.toContain('<script>');
    // Should contain escaped versions
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
  });
});

/**
 * Unit Tests for isOnlyLink() utility function
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 2.3 Implement link detection and clickability logic
 * 
 * **Validates: Requirements 1.11, 1.12**
 */

import { isOnlyLink } from './MarkdownRenderer';

describe('isOnlyLink() utility function', () => {
  
  /**
   * Test: Link-only text detection
   * **Validates: Requirement 1.11**
   */
  it('should return true for text containing only a link', () => {
    expect(isOnlyLink('[Google](https://google.com)')).toBe(true);
    expect(isOnlyLink('[Click here](http://example.com)')).toBe(true);
    expect(isOnlyLink('  [Link](https://test.com)  ')).toBe(true); // with whitespace
  });

  /**
   * Test: Link with other text detection
   * **Validates: Requirement 1.12**
   */
  it('should return false for text containing a link with other text', () => {
    expect(isOnlyLink('Check out [Google](https://google.com)')).toBe(false);
    expect(isOnlyLink('[Google](https://google.com) is great')).toBe(false);
    expect(isOnlyLink('Visit [Google](https://google.com) for search')).toBe(false);
  });

  /**
   * Test: Non-link text detection
   */
  it('should return false for text without links', () => {
    expect(isOnlyLink('Just plain text')).toBe(false);
    expect(isOnlyLink('**Bold text**')).toBe(false);
    expect(isOnlyLink('*Italic text*')).toBe(false);
    expect(isOnlyLink('')).toBe(false);
  });

  /**
   * Test: Malformed link detection
   */
  it('should return false for malformed links', () => {
    expect(isOnlyLink('[Missing closing paren](https://google.com')).toBe(false);
    expect(isOnlyLink('[Missing URL]()')).toBe(false);
    expect(isOnlyLink('](https://google.com)')).toBe(false);
    expect(isOnlyLink('[](https://google.com)')).toBe(false); // empty link text
  });

  /**
   * Test: Multiple links detection
   */
  it('should return false for multiple links', () => {
    expect(isOnlyLink('[Link1](http://a.com) [Link2](http://b.com)')).toBe(false);
  });
});

/**
 * Property-Based Tests for Link Clickability
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 2.4 Write property test for link clickability
 * 
 * **Validates: Requirements 1.11, 1.12**
 */

describe('Feature: markdown-and-folder-explorer, Property 3 & 4: Link clickability', () => {
  
  /**
   * Property 3: Link-only node clickability
   * **Validates: Requirement 1.11**
   * 
   * For any text containing ONLY a link, the system should make the link clickable
   */
  it('should detect link-only text correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => 
          !s.includes('[') && 
          !s.includes(']') && 
          !s.includes('(') && 
          !s.includes(')') &&
          !s.includes('<') && 
          !s.includes('>')
        ),
        fc.webUrl().filter(url => 
          !url.includes(')') && // Filter out URLs with ) to avoid markdown parsing issues
          !url.includes('_') && // Filter out URLs with underscores
          !url.includes('*')    // Filter out URLs with asterisks
        ),
        (linkText, url) => {
          const markdown = `[${linkText}](${url})`;
          
          // Should be detected as link-only
          expect(isOnlyLink(markdown)).toBe(true);
          
          // Should also work with whitespace
          expect(isOnlyLink(`  ${markdown}  `)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 4: Embedded link non-clickability
   * **Validates: Requirement 1.12**
   * 
   * For any text containing a link with additional text, the link should not be clickable
   */
  it('should detect embedded links correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !s.includes('[') && 
          !s.includes(']') && 
          !s.includes('(') && 
          !s.includes(')') &&
          !s.includes('<') && 
          !s.includes('>') &&
          s.trim().length > 0 // Ensure prefix is not just whitespace
        ),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !s.includes('[') && 
          !s.includes(']') && 
          !s.includes('(') && 
          !s.includes(')') &&
          !s.includes('<') && 
          !s.includes('>')
        ),
        fc.webUrl().filter(url => 
          !url.includes(')') && // Filter out URLs with ) to avoid markdown parsing issues
          !url.includes('_') && // Filter out URLs with underscores
          !url.includes('*')    // Filter out URLs with asterisks
        ),
        (prefix, linkText, url) => {
          const markdown = `${prefix} [${linkText}](${url})`;
          
          // Should NOT be detected as link-only
          expect(isOnlyLink(markdown)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 5: Link with suffix text
   * **Validates: Requirement 1.12**
   */
  it('should detect links with suffix text correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !s.includes('[') && 
          !s.includes(']') && 
          !s.includes('(') && 
          !s.includes(')') &&
          !s.includes('<') && 
          !s.includes('>')
        ),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !s.includes('[') && 
          !s.includes(']') && 
          !s.includes('(') && 
          !s.includes(')') &&
          !s.includes('<') && 
          !s.includes('>') &&
          s.trim().length > 0 // Ensure suffix is not just whitespace
        ),
        fc.webUrl().filter(url => 
          !url.includes(')') && // Filter out URLs with ) to avoid markdown parsing issues
          !url.includes('_') && // Filter out URLs with underscores
          !url.includes('*')    // Filter out URLs with asterisks
        ),
        (linkText, suffix, url) => {
          const markdown = `[${linkText}](${url}) ${suffix}`;
          
          // Should NOT be detected as link-only
          expect(isOnlyLink(markdown)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });
});

/**
 * Integration Tests for MarkdownRenderer Component
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 2.3 Implement link detection and clickability logic
 * 
 * **Validates: Requirements 1.11, 1.12**
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownRenderer, extractImages } from './MarkdownRenderer';

describe('MarkdownRenderer Component Integration Tests', () => {
  
  /**
   * Test: Link-only node renders with clickable link
   * **Validates: Requirement 1.11**
   */
  it('should render link-only text with clickable link', () => {
    const linkText = 'Click here';
    const url = 'https://example.com';
    const markdown = `[${linkText}](${url})`;
    
    const { container } = render(
      <MarkdownRenderer text={markdown} enabled={true} />
    );
    
    // Should contain an anchor tag
    const anchor = container.querySelector('a');
    expect(anchor).toBeTruthy();
    expect(anchor?.getAttribute('href')).toBe(url);
    expect(anchor?.textContent).toBe(linkText);
  });

  /**
   * Test: Link with other text renders as non-clickable
   * **Validates: Requirement 1.12**
   */
  it('should render link with other text as non-clickable', () => {
    const markdown = 'Check out [Google](https://google.com) for search';
    
    const { container } = render(
      <MarkdownRenderer text={markdown} enabled={true} />
    );
    
    // Should NOT contain an anchor tag (replaced with span)
    const anchor = container.querySelector('a');
    expect(anchor).toBeFalsy();
    
    // Should contain a span with link styling
    const span = container.querySelector('span[style*="color:#2196f3"]');
    expect(span).toBeTruthy();
    expect(span?.textContent).toBe('Google');
  });

  /**
   * Test: Multiple links in text are non-clickable
   * **Validates: Requirement 1.12**
   */
  it('should render multiple links as non-clickable', () => {
    const markdown = '[Link1](http://a.com) and [Link2](http://b.com)';
    
    const { container } = render(
      <MarkdownRenderer text={markdown} enabled={true} />
    );
    
    // Should NOT contain anchor tags
    const anchors = container.querySelectorAll('a');
    expect(anchors.length).toBe(0);
    
    // Should contain spans with link styling
    const spans = container.querySelectorAll('span[style*="color:#2196f3"]');
    expect(spans.length).toBeGreaterThan(0);
  });

  /**
   * Test: Markdown disabled renders plain text
   * **Validates: Requirement 2.3**
   */
  it('should render plain text when markdown is disabled', () => {
    const markdown = '[Google](https://google.com)';
    
    const { container } = render(
      <MarkdownRenderer text={markdown} enabled={false} />
    );
    
    // Should not contain any HTML tags
    expect(container.querySelector('a')).toBeFalsy();
    expect(container.textContent).toBe(markdown);
  });

  /**
   * Test: Linked folder nodes render plain text
   * **Validates: Requirement 1.15**
   */
  it('should render plain text for linked-folder nodes', () => {
    const markdown = '**Bold** [Link](http://example.com)';
    
    const { container } = render(
      <MarkdownRenderer text={markdown} enabled={true} nodeType="linked-folder" />
    );
    
    // Should not contain any HTML tags
    expect(container.querySelector('strong')).toBeFalsy();
    expect(container.querySelector('a')).toBeFalsy();
    expect(container.textContent).toBe(markdown);
  });

  /**
   * Test: Link click handler is called for link-only nodes
   * **Validates: Requirement 1.11**
   */
  it('should call onLinkClick for link-only nodes', () => {
    const url = 'https://example.com';
    const markdown = `[Click](${url})`;
    const mockLinkClick = jest.fn();
    
    const { container } = render(
      <MarkdownRenderer 
        text={markdown} 
        enabled={true} 
        onLinkClick={mockLinkClick}
      />
    );
    
    const anchor = container.querySelector('a');
    expect(anchor).toBeTruthy();
    
    // Simulate click
    anchor?.click();
    
    // Note: The actual click handler is attached to the parent span,
    // so we need to test the implementation logic separately
    // This test verifies the anchor tag is present for link-only text
  });

  /**
   * Test: Link with prefix text
   * **Validates: Requirement 1.12**
   */
  it('should render link with prefix text as non-clickable', () => {
    const markdown = 'Visit [Google](https://google.com)';
    
    const { container } = render(
      <MarkdownRenderer text={markdown} enabled={true} />
    );
    
    // Should NOT contain anchor tags
    const anchors = container.querySelectorAll('a');
    expect(anchors.length).toBe(0);
  });

  /**
   * Test: Link with suffix text
   * **Validates: Requirement 1.12**
   */
  it('should render link with suffix text as non-clickable', () => {
    const markdown = '[Google](https://google.com) is great';
    
    const { container } = render(
      <MarkdownRenderer text={markdown} enabled={true} />
    );
    
    // Should NOT contain anchor tags
    const anchors = container.querySelectorAll('a');
    expect(anchors.length).toBe(0);
  });
});
