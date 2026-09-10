import type { BodyStyleSnapshot, ColorScheme, NodeData, ShapeBodyAttrs } from '../types';

const VENN_VARIANTS = [
  { key: 'A', fill: '#3B82F6', stroke: '#1D4ED8', label: '#1e3a5f' },
  { key: 'B', fill: '#EF4444', stroke: '#B91C1C', label: '#7f1d1d' },
  { key: 'C', fill: '#22C55E', stroke: '#15803D', label: '#14532d' },
  { key: 'D', fill: '#A855F7', stroke: '#7E22CE', label: '#3b0764' },
  { key: 'E', fill: '#F97316', stroke: '#C2410C', label: '#7c2d12' },
] as const;

type BodyLike = Partial<ShapeBodyAttrs> | BodyStyleSnapshot | Record<string, unknown> | undefined | null;

function getStringAttr(body: BodyLike, key: 'fill' | 'stroke' | 'strokeDasharray') {
  const value = body && (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumberAttr(
  body: BodyLike,
  key: 'strokeWidth' | 'rx' | 'ry' | 'opacity' | 'fillOpacity',
) {
  const value = body && (body as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : undefined;
}

export function isTransparentBody(body: BodyLike) {
  if (!body) return true;

  const fill = getStringAttr(body, 'fill');
  const stroke = getStringAttr(body, 'stroke');
  const strokeWidth = getNumberAttr(body, 'strokeWidth');

  return fill === 'transparent' && (stroke === 'transparent' || strokeWidth === 0);
}

export function isVennSetNodeData(data: Partial<NodeData> | undefined, body: BodyLike) {
  if (!data?.isVenn) return false;
  if (data.isVennSet === true) return true;
  if (data.isVennLabel === true) return false;
  return !isTransparentBody(body);
}

export function inferVennVariantIndex(labelText: unknown) {
  if (typeof labelText !== 'string') {
    return undefined;
  }

  const match = labelText.match(/\b(?:Set|Circle)\s+([A-E])\b/i);
  if (!match) {
    return undefined;
  }

  return VENN_VARIANTS.findIndex((variant) => variant.key === match[1].toUpperCase());
}

export function getVennVariantIndex(
  data: Partial<NodeData> | undefined,
  labelText?: unknown,
  fallbackIndex = 0,
) {
  if (typeof data?.vennVariantIndex === 'number' && Number.isFinite(data.vennVariantIndex)) {
    return Math.abs(Math.trunc(data.vennVariantIndex)) % VENN_VARIANTS.length;
  }

  const inferred = inferVennVariantIndex(labelText);
  if (typeof inferred === 'number' && inferred >= 0) {
    return inferred;
  }

  return Math.abs(Math.trunc(fallbackIndex)) % VENN_VARIANTS.length;
}

export function snapshotVisibleBodyStyle(body: BodyLike): BodyStyleSnapshot | undefined {
  if (!body || isTransparentBody(body)) {
    return undefined;
  }

  const snapshot: BodyStyleSnapshot = {};
  const fill = getStringAttr(body, 'fill');
  const stroke = getStringAttr(body, 'stroke');
  const strokeDasharray = getStringAttr(body, 'strokeDasharray');
  const strokeWidth = getNumberAttr(body, 'strokeWidth');
  const rx = getNumberAttr(body, 'rx');
  const ry = getNumberAttr(body, 'ry');
  const opacity = getNumberAttr(body, 'opacity');
  const fillOpacity = getNumberAttr(body, 'fillOpacity');

  if (fill) snapshot.fill = fill;
  if (stroke) snapshot.stroke = stroke;
  if (typeof strokeWidth === 'number') snapshot.strokeWidth = strokeWidth;
  if (typeof rx === 'number') snapshot.rx = rx;
  if (typeof ry === 'number') snapshot.ry = ry;
  if (strokeDasharray) snapshot.strokeDasharray = strokeDasharray;
  if (typeof opacity === 'number') snapshot.opacity = opacity;
  if (typeof fillOpacity === 'number') snapshot.fillOpacity = fillOpacity;

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
}

interface ShapeToggleStyleOptions {
  body: BodyLike;
  lastVisibleBodyStyle?: BodyStyleSnapshot;
  fallbackFill: string;
  fallbackStroke: string;
  fallbackStrokeWidth: number;
  fallbackFillOpacity?: number;
  cornerRadius: number;
  nextShape: 'rect' | 'ellipse';
}

export function resolveBodyStyleForShapeToggle({
  body,
  lastVisibleBodyStyle,
  fallbackFill,
  fallbackStroke,
  fallbackStrokeWidth,
  fallbackFillOpacity,
  cornerRadius,
  nextShape,
}: ShapeToggleStyleOptions): BodyStyleSnapshot {
  const base = !isTransparentBody(body)
    ? snapshotVisibleBodyStyle(body)
    : lastVisibleBodyStyle;

  const fill = base?.fill && base.fill !== 'transparent' ? base.fill : fallbackFill;
  const stroke = base?.stroke && base.stroke !== 'transparent' ? base.stroke : fallbackStroke;
  const strokeWidth = typeof base?.strokeWidth === 'number' && base.strokeWidth > 0
    ? base.strokeWidth
    : fallbackStrokeWidth;
  const fillOpacity = typeof base?.fillOpacity === 'number'
    ? base.fillOpacity
    : fallbackFillOpacity;

  return {
    fill,
    stroke,
    strokeWidth,
    fillOpacity,
    opacity: typeof base?.opacity === 'number' ? base.opacity : undefined,
    strokeDasharray: base?.strokeDasharray,
    rx: nextShape === 'rect'
      ? (typeof base?.rx === 'number' ? base.rx : cornerRadius)
      : 0,
    ry: nextShape === 'rect'
      ? (typeof base?.ry === 'number' ? base.ry : cornerRadius)
      : 0,
  };
}

// ─── Hex → HSL / HSL → Hex helpers ─────────────────────────────────────────

function parseHexColor(color: string): [number, number, number] | null {
  const normalized = color.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    return normalized.slice(1).split('').map((d) => parseInt(d + d, 16)) as [number, number, number];
  }
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return [
      parseInt(normalized.slice(1, 3), 16),
      parseInt(normalized.slice(3, 5), 16),
      parseInt(normalized.slice(5, 7), 16),
    ] as [number, number, number];
  }
  return null;
}

/** Convert a 6-digit hex colour to [hue°, saturation%, lightness%]. */
function hexToHsl(hex: string): [number, number, number] | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;

  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l * 100];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s * 100, l * 100];
}

/** Convert [hue°, saturation%, lightness%] to a 6-digit hex colour. */
function hslToHex(h: number, s: number, l: number): string {
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  const hn = ((h % 360) + 360) % 360;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + hn / 30) % 12;
    const c = ln - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ─── Per-theme Venn palette derivation ──────────────────────────────────────

/**
 * Hue map for achromatic (low-saturation) themes – mirrors the classic
 * VENN_VARIANTS colour identity so neutral themes keep the familiar palette.
 * Order: Blue · Red · Green · Purple · Orange
 */
const ACHROMATIC_HUES: readonly [number, number, number, number, number] = [215, 0, 142, 270, 24];

/** Saturation threshold above which a lineColor is considered chromatic. */
const CHROMATIC_SAT_THRESHOLD = 18;
/** Minimum saturation enforced on Venn circle fills. */
const VENN_SAT_MIN = 55;
/** Maximum saturation (avoids over-neon colours). */
const VENN_SAT_CAP = 82;
/** Fill lightness for light-background themes. */
const VENN_LIGHTNESS_LIGHT = 52;
/** Fill lightness for dark-background themes (brighter so circles stay visible). */
const VENN_LIGHTNESS_DARK = 68;
/** Background HSL lightness below which a theme is treated as "dark". */
const DARK_BG_THRESHOLD = 30;
/** Minimum fillOpacity on dark canvases so circles don't disappear. */
const DARK_OPACITY_MIN = 0.40;

export interface VennThemeStyle extends BodyStyleSnapshot {
  labelFill: string;
}

/**
 * Derive a visually distinct, theme-matched style for a single Venn set circle.
 *
 * For **chromatic themes** (coloured lineColor) the five Venn circles are
 * evenly distributed around the hue wheel starting at the theme's anchor hue,
 * so every theme produces a unique palette that harmonises with its character.
 *
 * For **achromatic themes** (grey / black lineColor) the classic Blue · Red ·
 * Green · Purple · Orange palette is used so neutral themes keep the familiar
 * Venn appearance.
 *
 * Dark-background themes automatically receive a higher fillOpacity so the
 * semi-transparent circles remain clearly visible against the dark canvas.
 */
export function getVennThemeStyle(scheme: ColorScheme, index: number, fillOpacity = 0.30): VennThemeStyle {
  if (scheme.id === 'wireframe-transparent') {
    return {
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 2,
      fillOpacity: 0,
      labelFill: '#000000',
    };
  }

  const i = Math.abs(Math.trunc(index)) % 5;

  const lineHsl = hexToHsl(scheme.lineColor);
  const bgHsl = hexToHsl(scheme.backgroundColor);

  const isDark = bgHsl !== null && bgHsl[2] < DARK_BG_THRESHOLD;
  const isChromatic = lineHsl !== null && lineHsl[1] > CHROMATIC_SAT_THRESHOLD;

  // Select hue: chromatic themes rotate evenly from the anchor; achromatic themes
  // fall back to the classic fixed palette hues.
  const hue = isChromatic
    ? (lineHsl![0] + i * 72) % 360
    : ACHROMATIC_HUES[i];

  // Saturation: clamp to a vivid-but-not-neon range.
  const saturation = isChromatic
    ? Math.max(Math.min(lineHsl![1], VENN_SAT_CAP), VENN_SAT_MIN)
    : 65;

  // Lightness: brighter fills on dark canvases keep circles clearly visible.
  const lightness = isDark ? VENN_LIGHTNESS_DARK : VENN_LIGHTNESS_LIGHT;

  const fill = hslToHex(hue, saturation, lightness);

  // Stroke: a richer, darker shade of the fill colour.
  const stroke = hslToHex(hue, Math.min(saturation + 15, 95), lightness - 22);

  // fillOpacity: respect the caller's value but enforce a minimum on dark canvases.
  const resolvedOpacity = isDark ? Math.max(fillOpacity, DARK_OPACITY_MIN) : fillOpacity;

  // Label: deep-tinted shade on light themes; pale-tinted shade on dark themes –
  // both stay legible over the semi-transparent circle on its canvas.
  const labelFill = isDark
    ? hslToHex(hue, 25, 88)
    : hslToHex(hue, Math.min(saturation + 20, 100), Math.max(lightness - 32, 12));

  return {
    fill,
    stroke,
    fillOpacity: resolvedOpacity,
    labelFill,
  };
}