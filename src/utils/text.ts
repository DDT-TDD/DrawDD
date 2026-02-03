import type { Node } from '@antv/x6';

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
 */
export function setNodeLabelWithAutoSize(node: Node, text: string, options: Partial<MeasureOptions> = {}) {
  const currentAttrs = node.getAttrs();
  const currentLabelAttrs = (currentAttrs.label || {}) as Record<string, any>;

  const fontSize = Number(currentLabelAttrs.fontSize) || DEFAULTS.fontSize;
  const fontFamily = (currentLabelAttrs.fontFamily as string) || DEFAULTS.fontFamily;
  const fontWeight = (currentLabelAttrs.fontWeight as string) || DEFAULTS.fontWeight;
  const currentSize = node.size();
  const padding = options.padding ?? DEFAULTS.padding;
  const maxWidth = options.maxWidth ?? DEFAULTS.maxWidth;
  const lineHeightMultiplier = options.lineHeight ?? DEFAULTS.lineHeight;

  // Handle empty/null text
  const safeText = text || '';

  // If no measurement context available, just update text without resizing
  if (!measureCtx) {
    node.setAttrs({ label: { ...currentLabelAttrs, text: safeText } });
    return;
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

  if (!hasNewlines) {
    // Single line text
    requiredWidth = Math.ceil(widestLineWidth);
    requiredHeight = Math.ceil(lineHeight + padding);
    
    // Check if text needs to wrap within current width
    if (requiredWidth > currentSize.width && requiredWidth > maxWidth) {
      // Text is too wide, needs wrapping - calculate wrapped height
      const wrapWidth = Math.max(currentSize.width - padding, maxWidth - padding);
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
      requiredWidth = currentSize.width; // Keep current width, just grow height
    }
  } else {
    // Multi-line text with explicit newlines
    requiredWidth = Math.ceil(widestLineWidth);
    requiredHeight = Math.ceil(lineCount * lineHeight + padding);
  }

  // Only grow if text doesn't fit - never shrink
  // Current size is the minimum (user's chosen size)
  const newWidth = Math.max(currentSize.width, Math.min(maxWidth, requiredWidth));
  const newHeight = Math.max(currentSize.height, requiredHeight);

  // Only resize if we need to grow
  if (newWidth > currentSize.width || newHeight > currentSize.height) {
    node.resize(newWidth, newHeight);
  }

  // Update label - preserve existing attributes and add text wrapping
  // Remove old textWrap to avoid conflicts, then add new one
  const { textWrap: _oldTextWrap, ...preservedLabelAttrs } = currentLabelAttrs;

  node.setAttrs({
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
