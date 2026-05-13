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

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseHexColor(color: string) {
  const normalized = color.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    return normalized.slice(1).split('').map((digit) => parseInt(digit + digit, 16)) as [number, number, number];
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

function toHex([red, green, blue]: [number, number, number]) {
  return `#${[red, green, blue].map((value) => clampChannel(value).toString(16).padStart(2, '0')).join('')}`;
}

function mixHex(color: string, mixWith: string, weight: number) {
  const source = parseHexColor(color);
  const target = parseHexColor(mixWith);

  if (!source || !target) {
    return color;
  }

  const clampedWeight = Math.max(0, Math.min(1, weight));
  return toHex([
    source[0] * (1 - clampedWeight) + target[0] * clampedWeight,
    source[1] * (1 - clampedWeight) + target[1] * clampedWeight,
    source[2] * (1 - clampedWeight) + target[2] * clampedWeight,
  ] as [number, number, number]);
}

export interface VennThemeStyle extends BodyStyleSnapshot {
  labelFill: string;
}

export function getVennThemeStyle(scheme: ColorScheme, index: number, fillOpacity = 0.30): VennThemeStyle {
  const variant = VENN_VARIANTS[Math.abs(Math.trunc(index)) % VENN_VARIANTS.length] ?? VENN_VARIANTS[0];

  // Blend the fill lightly toward the theme background so circles integrate
  // with the canvas while keeping their identity colour (Blue / Red / Green…).
  const fill = mixHex(variant.fill, scheme.backgroundColor, 0.10);

  // Stroke is the most visible element on semi-transparent circles, so apply
  // a strong theme influence via lineColor – this makes theme changes clearly
  // visible without destroying circle identity.
  const stroke = mixHex(variant.stroke, scheme.lineColor, 0.60);

  // Label inherits the theme's text colour at 50 % so it stays legible.
  const labelFill = mixHex(variant.label, scheme.nodeColors.primary.text, 0.50);

  return {
    fill,
    stroke,
    fillOpacity,
    labelFill,
  };
}