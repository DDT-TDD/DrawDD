/**
 * Unit Tests for ImageThumbnail Component Error Handling
 * 
 * Feature: markdown-and-folder-explorer
 * Task: 20.3 Write unit tests for error conditions
 * 
 * **Validates: Requirement 11.5**
 * 
 * Tests image loading error handling:
 * - Invalid image URLs
 * - Network errors
 * - CORS errors
 * - Placeholder display
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import { ImageThumbnail } from './ImageThumbnail';

describe('ImageThumbnail Error Handling', () => {
  /**
   * Test: Invalid image URL handling
   * **Validates: Requirement 11.5**
   * 
   * WHEN an image URL is invalid or inaccessible,
   * THE System SHALL display a placeholder icon
   */
  describe('Invalid image URLs', () => {
    it('should display placeholder icon when image fails to load', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://invalid-url.com/nonexistent.jpg"
          alt="Test image"
          onClick={mockOnClick}
        />
      );

      // Find the image element
      const img = container.querySelector('img');
      expect(img).toBeTruthy();

      // Simulate image load error
      fireEvent.error(img!);

      // Wait for error state to update
      await waitFor(() => {
        // Should display placeholder icon
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
        expect(placeholder?.textContent).toBe('🖼️');
      });
    });

    it('should display placeholder for empty URL', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url=""
          alt="Empty URL"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeTruthy();

      // Simulate error (empty URL will fail to load)
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
        expect(placeholder?.textContent).toBe('🖼️');
      });
    });

    it('should display placeholder for malformed URL', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="not-a-valid-url"
          alt="Malformed URL"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
      });
    });

    it('should display placeholder for URL with invalid protocol', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="ftp://example.com/image.jpg"
          alt="Invalid protocol"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
      });
    });
  });

  /**
   * Test: Placeholder icon properties
   * **Validates: Requirement 11.5**
   */
  describe('Placeholder icon display', () => {
    it('should display placeholder with correct styling', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://invalid.com/image.jpg"
          alt="Test"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
        
        // Check styling
        const style = placeholder?.getAttribute('style');
        expect(style).toContain('cursor: pointer');
        expect(style).toContain('border');
        expect(style).toContain('border-radius');
      });
    });

    it('should display placeholder with title attribute', async () => {
      const mockOnClick = jest.fn();
      const alt = 'Test image alt text';
      const { container } = render(
        <ImageThumbnail
          url="https://invalid.com/image.jpg"
          alt={alt}
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
        
        const title = placeholder?.getAttribute('title');
        expect(title).toContain('Image failed to load');
        expect(title).toContain(alt);
      });
    });

    it('should make placeholder clickable', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://invalid.com/image.jpg"
          alt="Test"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
        
        // Click the placeholder
        fireEvent.click(placeholder!);
        
        // Should call onClick handler
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  /**
   * Test: Successful image loading
   * **Validates: Requirements 1.13, 1.14**
   */
  describe('Successful image loading', () => {
    it('should display image when URL is valid', () => {
      const mockOnClick = jest.fn();
      const url = 'https://example.com/valid-image.jpg';
      const alt = 'Valid image';
      
      const { container } = render(
        <ImageThumbnail
          url={url}
          alt={alt}
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.getAttribute('src')).toBe(url);
      expect(img?.getAttribute('alt')).toBe(alt);
    });

    it('should have correct thumbnail styling', () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://example.com/image.jpg"
          alt="Test"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      const style = img?.getAttribute('style');
      
      expect(style).toContain('max-width: 100px');
      expect(style).toContain('max-height: 60px');
      expect(style).toContain('cursor: pointer');
      expect(style).toContain('border');
    });

    it('should call onClick when image is clicked', () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://example.com/image.jpg"
          alt="Test"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.click(img!);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should have title attribute for accessibility', () => {
      const mockOnClick = jest.fn();
      const alt = 'Test image';
      const { container } = render(
        <ImageThumbnail
          url="https://example.com/image.jpg"
          alt={alt}
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      const title = img?.getAttribute('title');
      
      expect(title).toBeTruthy();
      expect(title).toContain(alt);
    });
  });

  /**
   * Test: Edge cases
   */
  describe('Edge cases', () => {
    it('should handle missing alt text', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://invalid.com/image.jpg"
          alt=""
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
        
        const title = placeholder?.getAttribute('title');
        expect(title).toContain('Image failed to load');
      });
    });

    it('should handle very long URLs', async () => {
      const mockOnClick = jest.fn();
      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '.jpg';
      
      const { container } = render(
        <ImageThumbnail
          url={longUrl}
          alt="Long URL"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      expect(img?.getAttribute('src')).toBe(longUrl);
    });

    it('should handle special characters in URL', () => {
      const mockOnClick = jest.fn();
      const specialUrl = 'https://example.com/image%20with%20spaces.jpg';
      
      const { container } = render(
        <ImageThumbnail
          url={specialUrl}
          alt="Special chars"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      expect(img?.getAttribute('src')).toBe(specialUrl);
    });

    it('should handle unicode characters in alt text', async () => {
      const mockOnClick = jest.fn();
      const unicodeAlt = 'Image with émojis 🎉 and 中文';
      
      const { container } = render(
        <ImageThumbnail
          url="https://invalid.com/image.jpg"
          alt={unicodeAlt}
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        const title = placeholder?.getAttribute('title');
        expect(title).toContain(unicodeAlt);
      });
    });

    it('should not crash when onClick is called multiple times', () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://example.com/image.jpg"
          alt="Test"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      
      // Click multiple times
      fireEvent.click(img!);
      fireEvent.click(img!);
      fireEvent.click(img!);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should handle error event multiple times gracefully', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://invalid.com/image.jpg"
          alt="Test"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      
      // Trigger error multiple times
      fireEvent.error(img!);
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
        
        // Should still only show one placeholder
        const placeholders = container.querySelectorAll('span');
        expect(placeholders.length).toBe(1);
      });
    });
  });

  /**
   * Test: Network and CORS errors
   * **Validates: Requirement 11.5**
   */
  describe('Network and CORS errors', () => {
    it('should handle network timeout errors', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://slow-server.com/image.jpg"
          alt="Slow loading"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
      });
    });

    it('should handle CORS-restricted images', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://cors-restricted.com/image.jpg"
          alt="CORS error"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
      });
    });

    it('should handle 404 errors', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://example.com/404-not-found.jpg"
          alt="404 error"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
      });
    });

    it('should handle 403 forbidden errors', async () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <ImageThumbnail
          url="https://example.com/forbidden.jpg"
          alt="403 error"
          onClick={mockOnClick}
        />
      );

      const img = container.querySelector('img');
      fireEvent.error(img!);

      await waitFor(() => {
        const placeholder = container.querySelector('span');
        expect(placeholder).toBeTruthy();
      });
    });
  });
});
