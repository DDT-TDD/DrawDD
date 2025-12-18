import { getColorScheme } from '../config/colorSchemes';

const cycle: Array<'primary' | 'secondary' | 'accent'> = ['primary', 'secondary', 'accent'];
let state = { schemeId: 'default', index: 0 };

export function resetThemeCycle(schemeId: string) {
  state = { schemeId, index: 0 };
}

export function getNextThemeColors(schemeId: string) {
  if (state.schemeId !== schemeId) {
    resetThemeCycle(schemeId);
  }
  const scheme = getColorScheme(schemeId);
  const key = cycle[state.index % cycle.length];
  state = { schemeId, index: (state.index + 1) % cycle.length };
  const nodeColors = scheme.nodeColors[key];
  return {
    fill: nodeColors.fill,
    stroke: nodeColors.stroke,
    text: nodeColors.text,
    line: scheme.lineColor,
    background: scheme.backgroundColor,
  };
}

export function getLineColor(schemeId: string) {
  return getColorScheme(schemeId).lineColor;
}
