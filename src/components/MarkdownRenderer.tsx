/**
 * MarkdownRenderer Component
 * 
 * Wraps node text rendering to apply markdown formatting when enabled.
 * Handles special cases for linked folder nodes and provides rich text display.
 * 
 * Requirements: 1.1-1.10, 1.11, 1.12, 1.13, 1.14, 1.15
 */

import React from 'react';
import { renderInlineMarkdown } from '../utils/markdown';
import { ImageThumbnail } from './ImageThumbnail';

export interface MarkdownRendererProps {
  text: string;
  enabled: boolean;
  nodeType?: 'standard' | 'linked-folder' | 'static-folder';
  onLinkClick?: (url: string) => void;
  onImageClick?: (url: string) => void;
}

/**
 * Check if text contains ONLY a link and no other text
 * 
 * Requirement 1.11: When a node contains ONLY a link, make it clickable
 * Requirement 1.12: When a node contains a link with other text, render as formatted text without click behavior
 * 
 * @param text - The text to check
 * @returns true if text contains only a link, false otherwise
 */
export function isOnlyLink(text: string): boolean {
  const trimmed = text.trim();
  // Match markdown link pattern: [text](url)
  const linkPattern = /^\[([^\]]+)\]\(([^)]+)\)$/;
  return linkPattern.test(trimmed);
}

/**
 * Extract image markdown from text
 * 
 * Requirement 1.9: Render images using ![alt](url) syntax
 * Requirement 1.13: Display images as clickable thumbnails
 * 
 * @param text - The text to check
 * @returns Array of image objects with alt and url, or null if no images
 */
export function extractImages(text: string): Array<{ alt: string; url: string; fullMatch: string }> | null {
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [];
  let match;
  
  while ((match = imagePattern.exec(text)) !== null) {
    matches.push({
      alt: match[1],
      url: match[2],
      fullMatch: match[0],
    });
  }
  
  return matches.length > 0 ? matches : null;
}

/**
 * MarkdownRenderer component
 * 
 * Renders node text with optional markdown formatting.
 * 
 * Behavior:
 * - If enabled is false, renders plain text
 * - If nodeType is 'linked-folder', renders plain text (no markdown)
 * - If text contains images, renders ImageThumbnail components (Requirements 1.13, 1.14)
 * - If text contains ONLY a link, makes it clickable (Requirement 1.11)
 * - If text contains a link with other text, renders as formatted text without click behavior (Requirement 1.12)
 * - Otherwise, uses renderInlineMarkdown() to apply formatting
 * 
 * @param props - Component props
 * @returns JSX element with rendered text
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  text,
  enabled,
  nodeType = 'standard',
  onLinkClick,
  onImageClick,
}) => {
  // Skip markdown rendering if disabled or for linked folder nodes
  // Requirement 1.15: Exclude markdown rendering for linked folder nodes
  if (!enabled || nodeType === 'linked-folder') {
    return <span>{text}</span>;
  }

  // Check for images in the text
  // Requirements 1.9, 1.13, 1.14: Render images as clickable thumbnails
  const images = extractImages(text);
  
  if (images && images.length > 0) {
    // Text contains images - render with ImageThumbnail components
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    images.forEach((image, index) => {
      const imageIndex = text.indexOf(image.fullMatch, lastIndex);
      
      // Add text before the image
      if (imageIndex > lastIndex) {
        const beforeText = text.substring(lastIndex, imageIndex);
        const beforeHtml = renderInlineMarkdown(beforeText);
        parts.push(
          <span
            key={`text-${index}`}
            dangerouslySetInnerHTML={{ __html: beforeHtml }}
          />
        );
      }
      
      // Add the image thumbnail
      parts.push(
        <ImageThumbnail
          key={`image-${index}`}
          url={image.url}
          alt={image.alt}
          onClick={() => {
            if (onImageClick) {
              onImageClick(image.url);
            }
          }}
        />
      );
      
      lastIndex = imageIndex + image.fullMatch.length;
    });
    
    // Add any remaining text after the last image
    if (lastIndex < text.length) {
      const afterText = text.substring(lastIndex);
      const afterHtml = renderInlineMarkdown(afterText);
      parts.push(
        <span
          key="text-end"
          dangerouslySetInnerHTML={{ __html: afterHtml }}
        />
      );
    }
    
    return <span>{parts}</span>;
  }

  // No images - proceed with regular markdown rendering
  // Check if text contains only a link
  // Requirement 1.11: Make link clickable if it's the only content
  // Requirement 1.12: Render link as formatted text if there's other content
  const onlyLink = isOnlyLink(text);

  // Apply markdown rendering
  // Requirements 1.1-1.10: Render all markdown syntax
  let htmlContent = renderInlineMarkdown(text);

  // If text contains a link but is NOT only a link, remove link functionality
  // Requirement 1.12: Links with other text should not be clickable
  if (!onlyLink && text.includes('[') && text.includes('](')) {
    // Replace <a> tags with <span> to remove clickability while keeping styling
    htmlContent = htmlContent.replace(
      /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
      '<span style="color:#2196f3;text-decoration:underline;">$2</span>'
    );
  }

  // Render as HTML
  return (
    <span
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      onClick={(e) => {
        // Only handle clicks if text contains only a link
        // Requirement 1.11: Make link-only nodes clickable
        if (onlyLink) {
          const target = e.target as HTMLElement;
          if (target.tagName === 'A' && onLinkClick) {
            e.preventDefault();
            const href = target.getAttribute('href');
            if (href) {
              onLinkClick(href);
            }
          }
        }
      }}
    />
  );
};

export default MarkdownRenderer;
