/**
 * Property-Based Test for Image Thumbnail Display
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 6.1 Write property test for image thumbnail display
 * 
 * **Property 5: Image thumbnail display**
 * **Validates: Requirements 1.13, 1.14**
 * 
 * For any node containing image markdown, the system should display the image
 * as a clickable thumbnail with maximum dimensions.
 */

import fc from 'fast-check';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ImageThumbnail } from './ImageThumbnail';

describe('Feature: markdown-and-folder-explorer, Property 5: Image thumbnail display', () => {
  /**
   * Property 5: Image thumbnail display
   * 
   * For any node containing image markdown, the system should display the image
   * as a clickable thumbnail with maximum dimensions.
   * 
   * **Validates: Requirements 1.13, 1.14**
   */
  it('should display images as clickable thumbnails with maximum dimensions', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary image markdown
        fc.record({
          alt: fc.string().filter(s => !s.includes(']') && !s.includes(')')),
          url: fc.webUrl().filter(u => !u.includes(')')),
        }),
        fc.constantFrom('standard', 'static-folder'),
        ({ alt, url }, nodeType) => {
          const imageMarkdown = `![${alt}](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: imageMarkdown,
              enabled: true,
              nodeType: nodeType as 'standard' | 'static-folder',
            })
          );

          // Property: Image markdown should render an <img> element
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeTruthy();

          if (imgElement) {
            // Property: Image should have the correct src attribute (Requirement 1.9)
            expect(imgElement.getAttribute('src')).toBe(url);

            // Property: Image should have the correct alt attribute (Requirement 1.9)
            expect(imgElement.getAttribute('alt')).toBe(alt);

            // Property: Image should have maximum dimensions (Requirement 1.13)
            const style = imgElement.style;
            expect(style.maxWidth).toBe('100px');
            expect(style.maxHeight).toBe('60px');

            // Property: Image should be clickable (cursor pointer) (Requirement 1.13)
            expect(style.cursor).toBe('pointer');

            // Property: Image should have styling for thumbnail display
            expect(style.border).toBeTruthy();
            expect(style.borderRadius).toBeTruthy();
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5a: Image click handler should be invoked
   * 
   * This validates that clicking an image thumbnail triggers the click handler.
   * 
   * **Validates: Requirements 1.14**
   */
  it('should invoke click handler when image thumbnail is clicked', () => {
    fc.assert(
      fc.property(
        fc.record({
          alt: fc.string().filter(s => !s.includes(']') && !s.includes(')')),
          url: fc.webUrl().filter(u => !u.includes(')')),
        }),
        ({ alt, url }) => {
          let clickedUrl: string | null = null;
          const handleImageClick = (clickedImageUrl: string) => {
            clickedUrl = clickedImageUrl;
          };

          const imageMarkdown = `![${alt}](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: imageMarkdown,
              enabled: true,
              nodeType: 'standard',
              onImageClick: handleImageClick,
            })
          );

          const imgElement = container.querySelector('img');
          expect(imgElement).toBeTruthy();

          if (imgElement) {
            // Click the image
            fireEvent.click(imgElement);

            // Property: Click handler should be invoked with the image URL (Requirement 1.14)
            expect(clickedUrl).toBe(url);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5b: Multiple images should all be rendered as thumbnails
   * 
   * This validates that text with multiple images renders all of them correctly.
   * 
   * **Validates: Requirements 1.13**
   */
  it('should render multiple images as thumbnails in the same text', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            alt: fc.string().filter(s => s.length > 0 && !s.includes(']') && !s.includes(')')),
            url: fc.webUrl().filter(u => !u.includes(')')),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (images) => {
          // Create markdown with multiple images
          const imageMarkdowns = images.map(img => `![${img.alt}](${img.url})`);
          const text = imageMarkdowns.join(' ');

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'standard',
            })
          );

          // Property: All images should be rendered
          const imgElements = container.querySelectorAll('img');
          expect(imgElements.length).toBe(images.length);

          // Property: Each image should have correct src
          imgElements.forEach((img, index) => {
            expect(img.getAttribute('src')).toBe(images[index].url);
            expect(img.getAttribute('alt')).toBe(images[index].alt);
          });

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5c: Images mixed with text should render correctly
   * 
   * This validates that images can be mixed with regular text and markdown.
   * 
   * **Validates: Requirements 1.13**
   */
  it('should render images mixed with text and other markdown', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0 && s.length < 50 && !s.includes('!') && !s.includes('[') && !s.includes(']') && !s.includes('$') && !s.includes('_') && !s.includes('*') && !s.includes('`')),
        fc.record({
          alt: fc.string().filter(s => !s.includes(']') && !s.includes(')')),
          url: fc.webUrl().filter(u => !u.includes(')')),
        }),
        fc.string().filter(s => s.length > 0 && s.length < 50 && !s.includes('!') && !s.includes('[') && !s.includes(']') && !s.includes('$') && !s.includes('_') && !s.includes('*') && !s.includes('`')),
        (beforeText, image, afterText) => {
          const text = `${beforeText} ![${image.alt}](${image.url}) ${afterText}`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: text,
              enabled: true,
              nodeType: 'standard',
            })
          );

          // Property: Image should be rendered
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeTruthy();

          // Property: Text before and after image should be present
          const textContent = container.textContent || '';
          expect(textContent).toContain(beforeText);
          expect(textContent).toContain(afterText);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5d: Image error handling should display placeholder
   * 
   * This validates that invalid image URLs display a placeholder icon.
   * 
   * **Validates: Requirements 11.5**
   */
  it('should display placeholder icon for invalid image URLs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes(']') && !s.includes(')')),
        (alt) => {
          const invalidUrl = 'invalid-url-that-will-fail';

          const { container } = render(
            React.createElement(ImageThumbnail, {
              url: invalidUrl,
              alt: alt,
              onClick: () => {},
            })
          );

          // Initially, an img element should be rendered
          let imgElement = container.querySelector('img');
          expect(imgElement).toBeTruthy();

          if (imgElement) {
            // Simulate image load error
            fireEvent.error(imgElement);

            // Property: After error, placeholder should be displayed
            const placeholder = container.querySelector('span');
            expect(placeholder).toBeTruthy();

            if (placeholder) {
              // Property: Placeholder should contain the icon emoji
              expect(placeholder.textContent).toContain('🖼️');

              // Property: Placeholder should be clickable
              expect(placeholder.style.cursor).toBe('pointer');

              // Property: Placeholder should have appropriate dimensions
              expect(placeholder.style.width).toBe('100px');
              expect(placeholder.style.height).toBe('60px');
            }
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5e: Images should not be rendered when markdown is disabled
   * 
   * This validates that images are treated as plain text when markdown is disabled.
   * 
   * **Validates: Requirements 2.3**
   */
  it('should not render images when markdown is disabled', () => {
    fc.assert(
      fc.property(
        fc.record({
          alt: fc.string().filter(s => !s.includes(']') && !s.includes(')')),
          url: fc.webUrl().filter(u => !u.includes(')')),
        }),
        ({ alt, url }) => {
          const imageMarkdown = `![${alt}](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: imageMarkdown,
              enabled: false,
              nodeType: 'standard',
            })
          );

          // Property: No img element should be rendered when markdown is disabled
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeNull();

          // Property: Raw markdown syntax should be visible as text
          const textContent = container.textContent || '';
          expect(textContent).toBe(imageMarkdown);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5f: Images should not be rendered in linked-folder nodes
   * 
   * This validates that linked folder nodes don't render image markdown.
   * 
   * **Validates: Requirements 1.15**
   */
  it('should not render images in linked-folder nodes', () => {
    fc.assert(
      fc.property(
        fc.record({
          alt: fc.string().filter(s => !s.includes(']') && !s.includes(')')),
          url: fc.webUrl().filter(u => !u.includes(')')),
        }),
        ({ alt, url }) => {
          const imageMarkdown = `![${alt}](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: imageMarkdown,
              enabled: true,
              nodeType: 'linked-folder',
            })
          );

          // Property: No img element should be rendered for linked-folder nodes
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeNull();

          // Property: Raw markdown syntax should be visible as text
          const textContent = container.textContent || '';
          expect(textContent).toBe(imageMarkdown);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5g: Image thumbnails should maintain aspect ratio
   * 
   * This validates that images use object-fit to maintain aspect ratio.
   * 
   * **Validates: Requirements 1.13**
   */
  it('should maintain aspect ratio with object-fit contain', () => {
    fc.assert(
      fc.property(
        fc.record({
          alt: fc.string().filter(s => !s.includes(']') && !s.includes(')')),
          url: fc.webUrl().filter(u => !u.includes(')')),
        }),
        ({ alt, url }) => {
          const imageMarkdown = `![${alt}](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: imageMarkdown,
              enabled: true,
              nodeType: 'standard',
            })
          );

          const imgElement = container.querySelector('img');
          expect(imgElement).toBeTruthy();

          if (imgElement) {
            // Property: Image should use object-fit: contain to maintain aspect ratio
            expect(imgElement.style.objectFit).toBe('contain');
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 5h: Empty alt text should be handled correctly
   * 
   * This validates that images with empty alt text still render correctly.
   * 
   * **Validates: Requirements 1.13**
   */
  it('should handle images with empty alt text', () => {
    fc.assert(
      fc.property(
        fc.webUrl().filter(u => !u.includes(')')),
        (url) => {
          const imageMarkdown = `![](${url})`;

          const { container } = render(
            React.createElement(MarkdownRenderer, {
              text: imageMarkdown,
              enabled: true,
              nodeType: 'standard',
            })
          );

          // Property: Image should still be rendered with empty alt
          const imgElement = container.querySelector('img');
          expect(imgElement).toBeTruthy();

          if (imgElement) {
            expect(imgElement.getAttribute('src')).toBe(url);
            expect(imgElement.getAttribute('alt')).toBe('');
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
