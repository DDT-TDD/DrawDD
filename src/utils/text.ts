import type { Node, Graph } from '@antv/x6';
import { hasMarkdown } from './markdown';
import { FULL_PORTS_CONFIG } from '../config/shapes';

/**
 * Check if a node is a rich-content-node that supports markdown
 */
function isRichContentNode(node: Node): boolean {
  return node.shape === 'rich-content-node';
}

/**
 * Get the global graph instance from window
 */
function getGraphInstance(): Graph | null {
  return (window as any).__drawdd_graph || null;
}

/**
 * Convert a standard node to rich-content-node for markdown support
 * Preserves all styling, ports, and connections
 */
function convertToRichContentNode(graph: Graph, node: Node): Node | null {
  try {
    const position = node.getPosition();
    const size = node.getSize();
    const attrs = node.getAttrs();
    const data = node.getData() || {};
    const ports = node.getPorts();
    const zIndex = node.getZIndex();
    const parent = node.getParent();

    const labelText = (attrs.label as any)?.text || '';
    const bodyAttrs = attrs.body || {};
    const labelAttrs = attrs.label || {};

    // Get connected edges
    const incomingEdges = graph.getIncomingEdges(node) || [];
    const outgoingEdges = graph.getOutgoingEdges(node) || [];
    
    // Store COMPLETE edge connection info including anchors and connection points
    const edgeConnections = [
      ...incomingEdges.map(edge => ({
        edge,
        isSource: false,
        fullTarget: edge.getTarget(),
        fullSource: edge.getSource(),
      })),
      ...outgoingEdges.map(edge => ({
        edge,
        isSource: true,
        fullSource: edge.getSource(),
        fullTarget: edge.getTarget(),
      }))
    ];

    // Create new rich-content-node
    const newNode = graph.addNode({
      shape: 'rich-content-node',
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      attrs: {
        body: {
          fill: (bodyAttrs as any).fill || '#ffffff',
          stroke: (bodyAttrs as any).stroke || '#333333',
          strokeWidth: (bodyAttrs as any).strokeWidth || 2,
          rx: (bodyAttrs as any).rx || 6,
          ry: (bodyAttrs as any).ry || 6,
        },
        label: {
          text: labelText,
          fill: (labelAttrs as any).fill || '#333333',
          fontSize: (labelAttrs as any).fontSize || 14,
          fontFamily: (labelAttrs as any).fontFamily || 'system-ui, sans-serif',
        }
      },
      data: {
        ...data,
        text: labelText,
        textColor: (labelAttrs as any).fill || '#333333',
        convertedFromShape: node.shape,
      },
      zIndex: zIndex || 1,
      // Always include full ports config for edge connectivity
      ports: FULL_PORTS_CONFIG as any,
    });

    if (parent && parent.isNode()) {
      (parent as Node).addChild(newNode);
    }

    // Reconnect edges, preserving all connection properties
    edgeConnections.forEach(conn => {
      if (conn.isSource) {
        const sourceConfig = conn.fullSource as any;
        conn.edge.setSource({
          cell: newNode.id,
          port: sourceConfig?.port,
          anchor: sourceConfig?.anchor,
          connectionPoint: sourceConfig?.connectionPoint,
          magnet: sourceConfig?.magnet,
        });
      } else {
        const targetConfig = conn.fullTarget as any;
        conn.edge.setTarget({
          cell: newNode.id,
          port: targetConfig?.port,
          anchor: targetConfig?.anchor,
          connectionPoint: targetConfig?.connectionPoint,
          magnet: targetConfig?.magnet,
        });
      }
    });

    // Remove old node
    graph.removeNode(node);

    return newNode;
  } catch (error) {
    console.error('[text] Failed to convert node:', error);
    return null;
  }
}

const measureCtx = typeof document !== 'undefined'
  ? document.createElement('canvas').getContext('2d')
  : null;

interface MeasureOptions {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  padding: number;
  lineHeight: number;
}

const DEFAULTS: MeasureOptions = {
  fontSize: 14,
  fontFamily: 'system-ui, sans-serif',
  fontWeight: 'normal',
  minWidth: 80,
  maxWidth: 420,
  minHeight: 40,
  padding: 20,
  lineHeight: 1.4,
};

/**
 * Measures text and returns dimensions needed for proper display
 */
export function measureWrappedText(text: string, wrapWidth: number, options: Partial<MeasureOptions> = {}) {
  const opts = { ...DEFAULTS, ...options };
  if (!measureCtx) {
    return {
      width: opts.minWidth,
      height: opts.minHeight,
      lineCount: 1,
    };
  }

  const ctx = measureCtx;
  ctx.font = `${opts.fontWeight} ${opts.fontSize}px ${opts.fontFamily}`;
  const maxContentWidth = Math.max(40, wrapWidth);

  const lines: string[] = [];
  const paragraphs = (text || '').split('\n');

  paragraphs.forEach(paragraph => {
    if (!paragraph) {
      lines.push('');
      return;
    }
    const words = paragraph.split(/(\s+)/).filter(Boolean);
    let current = '';

    words.forEach(word => {
      const tentative = current ? `${current}${word}` : word;
      const width = ctx.measureText(tentative).width;

      if (width > maxContentWidth && current) {
        lines.push(current.trimEnd());
        current = word.trimStart();
      } else if (width > maxContentWidth) {
        // Hard break long tokens character by character
        const chars = word.split('');
        let chunk = '';
        chars.forEach(char => {
          const test = `${chunk}${char}`;
          if (ctx.measureText(test).width > maxContentWidth && chunk) {
            lines.push(chunk);
            chunk = char;
          } else {
            chunk = test;
          }
        });
        current = chunk;
      } else {
        current = tentative;
      }
    });

    if (current) {
      lines.push(current.trimEnd());
    }
  });

  if (lines.length === 0) {
    lines.push('');
  }

  const widestLine = Math.max(
    opts.minWidth - opts.padding,
    ...lines.map(line => ctx.measureText(line).width)
  );

  const width = Math.min(opts.maxWidth, Math.max(opts.minWidth, Math.ceil(widestLine + opts.padding)));
  const lineHeight = opts.fontSize * opts.lineHeight;
  const height = Math.max(opts.minHeight, Math.ceil(lines.length * lineHeight + opts.padding));

  return { width, height, lineCount: lines.length };
}

/**
 * Updates node label with proper text wrapping and auto-resize.
 * Preserves existing label attributes (like fill color) while updating text.
 * 
 * Strategy:
 * - Keep current shape size as the minimum (user's chosen size)
 * - Only resize if text doesn't fit in the current shape
 * - Never shrink below current size - only grow if needed
 * - If text contains markdown and node is not rich-content-node, convert it
 */
export function setNodeLabelWithAutoSize(node: Node, text: string, options: Partial<MeasureOptions> = {}): Node {
  // Handle empty/null text
  const safeText = text || '';
  
  // Check if text contains markdown and node needs conversion
  let targetNode = node;
  if (hasMarkdown(safeText) && !isRichContentNode(node)) {
    const graph = getGraphInstance();
    if (graph) {
      const convertedNode = convertToRichContentNode(graph, node);
      if (convertedNode) {
        targetNode = convertedNode;
        // For rich-content-node, update data.text and attrs
        // Then continue to measure and resize if needed
      }
    }
  }

  const currentAttrs = targetNode.getAttrs();
  const currentLabelAttrs = (currentAttrs.label || {}) as Record<string, any>;

  // For rich-content-nodes, also update data.text
  if (isRichContentNode(targetNode)) {
    targetNode.setData({ ...targetNode.getData(), text: safeText });
  }

  const fontSize = Number(currentLabelAttrs.fontSize) || DEFAULTS.fontSize;
  const fontFamily = (currentLabelAttrs.fontFamily as string) || DEFAULTS.fontFamily;
  const fontWeight = (currentLabelAttrs.fontWeight as string) || DEFAULTS.fontWeight;
  const currentSize = targetNode.size();
  const padding = options.padding ?? DEFAULTS.padding;
  const maxWidth = options.maxWidth ?? DEFAULTS.maxWidth;
  const lineHeightMultiplier = options.lineHeight ?? DEFAULTS.lineHeight;

  // If no measurement context available, just update text without resizing
  if (!measureCtx) {
    targetNode.setAttrs({ label: { ...currentLabelAttrs, text: safeText } });
    return targetNode;
  }

  measureCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Check if text contains explicit newlines
  const hasNewlines = safeText.includes('\n');
  const lines = safeText.split('\n');
  const lineCount = lines.length;
  
  // Measure the widest line
  const lineWidths = lines.map(line => measureCtx!.measureText(line).width);
  const widestLineWidth = (lineWidths.length > 0 ? Math.max(...lineWidths) : 0) + padding;
  
  // Calculate the required dimensions for the text
  const lineHeight = fontSize * lineHeightMultiplier;
  let requiredWidth: number;
  let requiredHeight: number;

  // Calculate wrapping for all text within current or required width
  const effectiveWidth = Math.max(currentSize.width, Math.min(maxWidth, widestLineWidth));
  const wrapWidth = effectiveWidth - padding;

  if (!hasNewlines) {
    // Single line text
    requiredWidth = Math.ceil(widestLineWidth);
    requiredHeight = Math.ceil(lineHeight + padding);
    
    // Check if text needs to wrap within current width
    if (requiredWidth > currentSize.width) {
      // Text is too wide, needs wrapping - calculate wrapped height
      const { height: wrappedHeight } = measureWrappedText(safeText, wrapWidth, {
        fontSize,
        fontFamily,
        fontWeight,
        minWidth: currentSize.width,
        maxWidth,
        minHeight: currentSize.height,
        padding,
        lineHeight: lineHeightMultiplier,
      });
      requiredHeight = wrappedHeight;
      // Grow width to max if needed
      requiredWidth = Math.min(maxWidth, requiredWidth);
    }
  } else {
    // Multi-line text with explicit newlines
    // Calculate how many wrapped lines each explicit line will become
    let totalWrappedLines = 0;
    lines.forEach(line => {
      if (!line.trim()) {
        totalWrappedLines += 1; // Empty line
      } else {
        const lineWidth = measureCtx!.measureText(line).width;
        if (lineWidth <= wrapWidth) {
          totalWrappedLines += 1;
        } else {
          // This line will wrap - estimate how many times
          const wrappedCount = Math.ceil(lineWidth / wrapWidth);
          totalWrappedLines += wrappedCount;
        }
      }
    });
    
    requiredWidth = Math.ceil(widestLineWidth);
    // Add extra padding to ensure text isn't cut off
    requiredHeight = Math.ceil(totalWrappedLines * lineHeight + padding + 4);
  }

  // Only grow if text doesn't fit - never shrink
  // Current size is the minimum (user's chosen size)
  const newWidth = Math.max(currentSize.width, Math.min(maxWidth, requiredWidth));
  const newHeight = Math.max(currentSize.height, requiredHeight);

  // Only resize if we need to grow
  if (newWidth > currentSize.width || newHeight > currentSize.height) {
    targetNode.resize(newWidth, newHeight);
  }

  // Update label - preserve existing attributes and add text wrapping
  // Remove old textWrap to avoid conflicts, then add new one
  const { textWrap: _oldTextWrap, ...preservedLabelAttrs } = currentLabelAttrs;

  targetNode.setAttrs({
    label: {
      ...preservedLabelAttrs,
      text: safeText,
      textWrap: {
        text: safeText,
        width: -(padding),
        height: -(padding),
        ellipsis: false,
        breakWord: true,
      },
    },
  });
  
  return targetNode;
}


/**
 * Redistributes text within the current node size (for manual resize).
 * Preserves all existing label attributes including text color.
 */
export function redistributeNodeText(node: Node) {
  const currentAttrs = node.getAttrs();
  const currentLabelAttrs = (currentAttrs.label || {}) as Record<string, any>;
  const text = (currentLabelAttrs.text as string) || '';
  const padding = DEFAULTS.padding;

  // Remove old textWrap, preserve everything else
  const { textWrap: _oldTextWrap, ...preservedLabelAttrs } = currentLabelAttrs;

  // Update textWrap to use current node dimensions
  node.setAttrs({
    label: {
      ...preservedLabelAttrs,
      text,
      textWrap: {
        text,
        width: -(padding),
        height: -(padding),
        ellipsis: false,
        breakWord: true,
      },
    },
  });
}
