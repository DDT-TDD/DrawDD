/**
 * Register custom React-based node type for rich markdown rendering
 * Uses @antv/x6-react-shape for proper React component rendering
 */

import React from 'react';
import { register } from '@antv/x6-react-shape';
import { RichContentNode } from '../components/RichContentNode';

let registered = false;

// Define the static markup that includes the collapse indicator elements
// The foreignObject for React content is handled automatically by X6 React shapes
export const RICH_CONTENT_NODE_MARKUP = [
  {
    tagName: 'rect',
    selector: 'body',
  },
  {
    tagName: 'foreignObject',
    selector: 'fo',
  },
  {
    tagName: 'g',
    selector: 'collapseGroup',
    attrs: {
      display: 'none', // Initially hidden
    },
    children: [
      {
        tagName: 'circle',
        selector: 'collapseIndicator',
        attrs: {
          r: 6,
          fill: '#ffffff',
          stroke: '#333333',
          strokeWidth: 1,
          cursor: 'pointer',
        },
      },
      {
        tagName: 'text',
        selector: 'collapseIcon',
        attrs: {
          fill: '#333333',
          fontSize: 10,
          textAnchor: 'middle',
          dominantBaseline: 'central',
          cursor: 'pointer',
          pointerEvents: 'none', // Let clicks pass to circle
        },
      },
    ],
  },
];

export function registerHtmlNode() {
  if (registered) return;

  console.log('[HTML_NODE] Registering rich-content-node React shape');

  // Register the React shape with X6
  // NOTE: React shapes do NOT support custom markup - they use their own foreignObject mechanism
  // The collapse indicator will be rendered inside the RichContentNode component instead
  // IMPORTANT: effect array is required for React component to re-render on data/attr changes
  register({
    shape: 'rich-content-node',
    width: 160,
    height: 80,
    component: RichContentNode,
    effect: ['data', 'attrs'], // Re-render when these change
  });

  registered = true;
  console.log('[HTML_NODE] Registered rich-content-node React shape');
}

/**
 * Inject CSS styles for HTML node content including KaTeX
 */
export function injectHtmlNodeStyles() {
  if (typeof document === 'undefined') return;

  const styleId = 'html-node-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Rich content node styles */
      .rich-content-node {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.4;
      }
      
      /* KaTeX styles */
      .katex {
        font-size: 1em !important;
      }
      .katex-display {
        margin: 0 !important;
      }
      
      /* Inline code */
      .rich-content-node code,
      [data-shape="rich-content-node"] code {
        background: rgba(0,0,0,0.08);
        padding: 1px 4px;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 0.9em;
      }
      
      /* Links */
      .rich-content-node a,
      [data-shape="rich-content-node"] a {
        color: #2196f3;
        text-decoration: underline;
      }
      
      /* Images */
      .rich-content-node img,
      [data-shape="rich-content-node"] img {
        max-width: 100%;
        max-height: 60px;
      }
      
      /* Tables */
      .rich-content-node table,
      [data-shape="rich-content-node"] table {
        border-collapse: collapse;
        font-size: 10px;
      }
      .rich-content-node th,
      .rich-content-node td,
      [data-shape="rich-content-node"] th,
      [data-shape="rich-content-node"] td {
        border: 1px solid #ccc;
        padding: 2px 4px;
      }
      
      /* Code blocks */
      .rich-content-node pre,
      [data-shape="rich-content-node"] pre {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 4px;
        border-radius: 4px;
        font-size: 10px;
        overflow: auto;
        max-height: 60px;
      }
      
      /* Highlights and formatting */
      .rich-content-node mark,
      [data-shape="rich-content-node"] mark {
        background: #fff59d;
        padding: 0 2px;
      }
      .rich-content-node del,
      [data-shape="rich-content-node"] del {
        text-decoration: line-through;
        opacity: 0.7;
      }
      .rich-content-node strong,
      [data-shape="rich-content-node"] strong {
        font-weight: bold;
      }
      .rich-content-node em,
      [data-shape="rich-content-node"] em {
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Inject KaTeX CSS from CDN if not already present
 */
export function injectKatexCSS() {
  if (typeof document === 'undefined') return;

  const katexCssId = 'katex-css';
  if (!document.getElementById(katexCssId)) {
    const link = document.createElement('link');
    link.id = katexCssId;
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}

