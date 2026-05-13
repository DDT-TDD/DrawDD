import { describe, expect, it } from '@jest/globals';

import { getColorScheme } from '../config/colorSchemes';
import {
  getVennVariantIndex,
  getVennThemeStyle,
  isTransparentBody,
  isVennSetNodeData,
  resolveBodyStyleForShapeToggle,
  snapshotVisibleBodyStyle,
} from './venn';

describe('Venn utilities', () => {
  it('distinguishes Venn sets from transparent Venn labels', () => {
    expect(isVennSetNodeData({ isVenn: true }, { fill: '#3B82F6', stroke: '#1D4ED8', strokeWidth: 2.5 })).toBe(true);
    expect(isVennSetNodeData({ isVenn: true, isVennLabel: true }, { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 })).toBe(false);
    expect(isVennSetNodeData({ isVenn: true, isVennSet: true }, { fill: '#ffffff', stroke: '#333333', strokeWidth: 2 })).toBe(true);
  });

  it('keeps the selected Venn variant stable by metadata or label', () => {
    expect(getVennVariantIndex({ isVenn: true, vennVariantIndex: 3 }, 'Set A')).toBe(3);
    expect(getVennVariantIndex({ isVenn: true }, 'Set D')).toBe(3);
    expect(getVennVariantIndex({ isVenn: true }, 'Circle B (Red)')).toBe(1);
  });

  it('treats transparent fill and stroke as no shape', () => {
    expect(isTransparentBody({ fill: 'transparent', stroke: 'transparent', strokeWidth: 0 })).toBe(true);
    expect(isTransparentBody({ fill: '#ffffff', stroke: '#333333', strokeWidth: 2 })).toBe(false);
  });

  it('restores the last visible style when toggling back from no shape', () => {
    const restored = resolveBodyStyleForShapeToggle({
      body: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 },
      lastVisibleBodyStyle: {
        fill: '#3B82F6',
        stroke: '#1D4ED8',
        strokeWidth: 2.5,
        fillOpacity: 0.3,
      },
      fallbackFill: '#ffffff',
      fallbackStroke: '#333333',
      fallbackStrokeWidth: 2,
      fallbackFillOpacity: 1,
      cornerRadius: 8,
      nextShape: 'ellipse',
    });

    expect(restored.fill).toBe('#3B82F6');
    expect(restored.stroke).toBe('#1D4ED8');
    expect(restored.strokeWidth).toBe(2.5);
    expect(restored.fillOpacity).toBe(0.3);
    expect(restored.rx).toBe(0);
    expect(restored.ry).toBe(0);
  });

  it('builds a deterministic Venn palette from the selected theme', () => {
    const defaultTheme = getVennThemeStyle(getColorScheme('default'), 0, 0.28);
    // Ocean Breeze (blue, chromatic) and Sunset Glow (orange, chromatic) have
    // very different lineColor hues so their anchor-hue palettes are clearly distinct.
    const oceanTheme = getVennThemeStyle(getColorScheme('ocean-breeze'), 0, 0.28);
    const sunsetTheme = getVennThemeStyle(getColorScheme('sunset-glow'), 0, 0.28);
    const defaultPurple = getVennThemeStyle(getColorScheme('default'), 3, 0.28);

    // Chromatic themes with different anchor hues produce clearly different palettes.
    expect(oceanTheme.fill).not.toBe(sunsetTheme.fill);
    expect(oceanTheme.stroke).not.toBe(sunsetTheme.stroke);
    expect(defaultTheme.fillOpacity).toBe(0.28);
    expect(defaultTheme.labelFill).toMatch(/^#/);
    // Different variant indices produce different fills (different hues).
    expect(defaultTheme.fill).not.toBe(defaultPurple.fill);
    expect(snapshotVisibleBodyStyle(defaultTheme)).toMatchObject({
      fill: defaultTheme.fill,
      stroke: defaultTheme.stroke,
      fillOpacity: 0.28,
    });
  });
});