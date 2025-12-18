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
 */
export function setNodeLabelWithAutoSize(node: Node, text: string, options: Partial<MeasureOptions> = {}) {
  const currentAttrs = node.getAttrs();
  const currentLabelAttrs = (currentAttrs.label || {}) as Record<string, any>;

  const fontSize = Number(currentLabelAttrs.fontSize) || DEFAULTS.fontSize;
  const fontFamily = (currentLabelAttrs.fontFamily as string) || DEFAULTS.fontFamily;
  const fontWeight = (currentLabelAttrs.fontWeight as string) || DEFAULTS.fontWeight;
  const currentSize = node.size();
  const padding = options.padding ?? DEFAULTS.padding;

  // Calculate new size based on text content
  // Use a safety buffer for wrapping measurement to account for Canvas/SVG text metric discrepancies
  // This ensures we allocate enough height even if X6 wraps slightly earlier than Canvas measureText
  const safetyBuffer = 4;
  const wrapWidth = Math.max(currentSize.width - padding - safetyBuffer, DEFAULTS.minWidth - padding);
  const { width, height } = measureWrappedText(text, wrapWidth, {
    fontSize,
    fontFamily,
    fontWeight,
    minWidth: options.minWidth ?? Math.max(DEFAULTS.minWidth, currentSize.width || DEFAULTS.minWidth),
    maxWidth: options.maxWidth ?? DEFAULTS.maxWidth,
    minHeight: options.minHeight ?? DEFAULTS.minHeight,
    padding,
    lineHeight: options.lineHeight ?? DEFAULTS.lineHeight,
  });

  // Resize node to fit text
  // Constraint: Width matches current width (text wraps), Height adjusts to content but NEVER shrinks below current height
  const newWidth = Math.max(currentSize.width, width);
  const newHeight = Math.max(currentSize.height, height);
  node.resize(newWidth, newHeight);

  // Update label - preserve existing attributes and add text wrapping
  // Remove old textWrap to avoid conflicts, then add new one
  const { textWrap: _oldTextWrap, ...preservedLabelAttrs } = currentLabelAttrs;

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
