/**
 * Integration test for MarkdownRenderer in Canvas
 * 
 * Tests that markdown rendering is properly integrated into node rendering
 * through the RichContentNode component.
 */

import React from 'react';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { RichContentNode } from './RichContentNode';
import { GraphProvider } from '../context/GraphContext';

// Mock node object
const createMockNode = (text: string, data: any = {}) => ({
  getData: () => data,
  getSize: () => ({ width: 120, height: 40 }),
  getAttrByPath: (path: string) => {
    if (path === 'label/text') return text;
    if (path === 'body') return {
      fill: '#ffffff',
      stroke: '#333333',
      strokeWidth: 2,
      rx: 6,
    };
    return undefined;
  },
  on: () => {},
  off: () => {},
});

describe('MarkdownRenderer Integration in Canvas', () => {
  it('should render markdown when enabled', () => {
    const mockNode = createMockNode('**Bold text**');
    
    const { container } = render(
      <GraphProvider>
        <RichContentNode node={mockNode as any} />
      </GraphProvider>
    );
    
    // Check that bold text is rendered
    const boldElement = container.querySelector('strong');
    expect(boldElement).toBeTruthy();
    expect(boldElement?.textContent).toBe('Bold text');
  });

  it('should not render markdown for linked folder nodes', () => {
    const mockNode = createMockNode('**Bold text**', {
      folderExplorer: {
        isFolderExplorer: true,
        explorerType: 'linked',
        path: '/test/path',
        isDirectory: true,
        isReadOnly: true,
      },
    });
    
    const { container } = render(
      <GraphProvider>
        <RichContentNode node={mockNode as any} />
      </GraphProvider>
    );
    
    // Check that markdown is NOT rendered (no strong tag)
    const boldElement = container.querySelector('strong');
    expect(boldElement).toBeFalsy();
    
    // Check that raw text is displayed
    expect(container.textContent).toContain('**Bold text**');
  });

  it('should render markdown for static folder nodes', () => {
    const mockNode = createMockNode('**Bold text**', {
      folderExplorer: {
        isFolderExplorer: true,
        explorerType: 'static',
        path: '/test/path',
        isDirectory: true,
        isReadOnly: false,
      },
    });
    
    const { container } = render(
      <GraphProvider>
        <RichContentNode node={mockNode as any} />
      </GraphProvider>
    );
    
    // Check that bold text is rendered for static nodes
    const boldElement = container.querySelector('strong');
    expect(boldElement).toBeTruthy();
    expect(boldElement?.textContent).toBe('Bold text');
  });

  it('should render images as thumbnails', () => {
    const mockNode = createMockNode('![Test image](https://example.com/image.png)');
    
    const { container } = render(
      <GraphProvider>
        <RichContentNode node={mockNode as any} />
      </GraphProvider>
    );
    
    // Check that image is rendered
    const imgElement = container.querySelector('img');
    expect(imgElement).toBeTruthy();
    expect(imgElement?.getAttribute('src')).toBe('https://example.com/image.png');
    expect(imgElement?.getAttribute('alt')).toBe('Test image');
  });

  it('should render links correctly', () => {
    const mockNode = createMockNode('[Click here](https://example.com)');
    
    const { container } = render(
      <GraphProvider>
        <RichContentNode node={mockNode as any} />
      </GraphProvider>
    );
    
    // Check that link is rendered
    const linkElement = container.querySelector('a');
    expect(linkElement).toBeTruthy();
    expect(linkElement?.getAttribute('href')).toBe('https://example.com');
    expect(linkElement?.textContent).toBe('Click here');
  });
});
