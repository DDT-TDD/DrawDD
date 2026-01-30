/**
 * ImageThumbnail Component
 * 
 * Renders markdown images as clickable thumbnails with error handling.
 * 
 * Requirements: 1.13, 1.14, 11.5
 */

import React, { useState } from 'react';

export interface ImageThumbnailProps {
  url: string;
  alt: string;
  onClick: () => void;
}

/**
 * ImageThumbnail component
 * 
 * Displays an image as a thumbnail with:
 * - Maximum dimensions to keep it thumbnail-sized
 * - Click handler to open full-size image
 * - Error handling for invalid/inaccessible URLs
 * 
 * Requirement 1.13: Display images as clickable thumbnails
 * Requirement 1.14: Open full-size image on click
 * Requirement 11.5: Display placeholder for invalid URLs
 * 
 * @param props - Component props
 * @returns JSX element with image thumbnail or error placeholder
 */
export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  url,
  alt,
  onClick,
}) => {
  const [hasError, setHasError] = useState(false);

  // Handle image load errors
  // Requirement 11.5: Display placeholder icon for invalid/inaccessible URLs
  const handleError = () => {
    setHasError(true);
  };

  // If image failed to load, show placeholder
  if (hasError) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100px',
          height: '60px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '32px',
          color: '#999',
        }}
        onClick={onClick}
        title={`Image failed to load: ${alt || url}`}
      >
        🖼️
      </span>
    );
  }

  // Render image thumbnail
  // Requirement 1.13: Display image as clickable thumbnail
  // Requirement 1.14: Click handler to open full-size image
  return (
    <img
      src={url}
      alt={alt}
      onError={handleError}
      onClick={onClick}
      style={{
        maxWidth: '100px',
        maxHeight: '60px',
        cursor: 'pointer',
        border: '1px solid #ddd',
        borderRadius: '4px',
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      title={alt || 'Click to view full size'}
    />
  );
};

export default ImageThumbnail;
