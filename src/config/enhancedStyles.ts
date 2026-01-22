/**
 * Enhanced Styles Configuration
 * Professional line styles, fonts, and additional color schemes
 */

// Professional Font Families
export const PROFESSIONAL_FONTS = [
  'System UI',
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Nunito',
  'Poppins',
  'Raleway',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Palatino Linotype',
  'Garamond',
  'Bookman',
  'Comic Sans MS',
  'Impact',
];

// Line Style Patterns (strokeDasharray values)
export interface LineStyle {
  id: string;
  name: string;
  dasharray: string;
  preview: string; // SVG path preview
}

export const LINE_STYLES: LineStyle[] = [
  { id: 'solid', name: 'Solid', dasharray: '', preview: '─────────' },
  { id: 'dashed', name: 'Dashed', dasharray: '8 4', preview: '── ── ──' },
  { id: 'dotted', name: 'Dotted', dasharray: '2 4', preview: '• • • • •' },
  { id: 'dash-dot', name: 'Dash-Dot', dasharray: '8 4 2 4', preview: '── • ── •' },
  { id: 'dash-dot-dot', name: 'Dash-Dot-Dot', dasharray: '8 4 2 4 2 4', preview: '── • • ──' },
  { id: 'long-dash', name: 'Long Dash', dasharray: '16 8', preview: '———  ———' },
  { id: 'short-dash', name: 'Short Dash', dasharray: '4 4', preview: '- - - - -' },
  { id: 'dense-dot', name: 'Dense Dot', dasharray: '1 2', preview: '••••••••' },
  { id: 'sparse-dot', name: 'Sparse Dot', dasharray: '2 8', preview: '•    •   •' },
  { id: 'double-dash', name: 'Double Dash', dasharray: '4 2 4 8', preview: '-- -- --' },
];

// Extended Color Palette for nodes and lines
export const EXTENDED_COLOR_PALETTE = [
  // Basic colors
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#000000',
  // Reds
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
  // Oranges
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
  // Yellows
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
  // Greens
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  // Teals
  '#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a',
  // Blues
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
  // Indigos
  '#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
  // Purples
  '#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
  // Pinks
  '#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
];

// Mindmap-specific settings
export interface MindmapSettings {
  defaultStrokeWidth: number;
  defaultShowArrows: boolean;
  defaultConnector: 'smooth' | 'rounded' | 'normal';
}

export const MINDMAP_DEFAULTS: MindmapSettings = {
  defaultStrokeWidth: 1,
  defaultShowArrows: false,
  defaultConnector: 'smooth',
};

// Level-based colors for mindmaps
export const MINDMAP_LEVEL_COLORS = [
  // Level 0 (root) - Bold, dark colors
  { fill: '#1e40af', stroke: '#1e3a8a', text: '#ffffff' },
  // Level 1 - Primary branches
  { fill: '#3b82f6', stroke: '#2563eb', text: '#ffffff' },
  // Level 2 - Secondary branches
  { fill: '#60a5fa', stroke: '#3b82f6', text: '#1e3a8a' },
  // Level 3 - Tertiary branches
  { fill: '#93c5fd', stroke: '#60a5fa', text: '#1e40af' },
  // Level 4+ - Light branches
  { fill: '#bfdbfe', stroke: '#93c5fd', text: '#1e40af' },
  { fill: '#dbeafe', stroke: '#bfdbfe', text: '#1e3a8a' },
  { fill: '#eff6ff', stroke: '#dbeafe', text: '#1e40af' },
];

// Alternative mindmap color themes
export const MINDMAP_THEMES = {
  blue: MINDMAP_LEVEL_COLORS,
  green: [
    { fill: '#166534', stroke: '#14532d', text: '#ffffff' },
    { fill: '#22c55e', stroke: '#16a34a', text: '#ffffff' },
    { fill: '#4ade80', stroke: '#22c55e', text: '#166534' },
    { fill: '#86efac', stroke: '#4ade80', text: '#166534' },
    { fill: '#bbf7d0', stroke: '#86efac', text: '#166534' },
    { fill: '#dcfce7', stroke: '#bbf7d0', text: '#166534' },
    { fill: '#f0fdf4', stroke: '#dcfce7', text: '#166534' },
  ],
  purple: [
    { fill: '#6b21a8', stroke: '#581c87', text: '#ffffff' },
    { fill: '#a855f7', stroke: '#9333ea', text: '#ffffff' },
    { fill: '#c084fc', stroke: '#a855f7', text: '#581c87' },
    { fill: '#d8b4fe', stroke: '#c084fc', text: '#6b21a8' },
    { fill: '#e9d5ff', stroke: '#d8b4fe', text: '#6b21a8' },
    { fill: '#f3e8ff', stroke: '#e9d5ff', text: '#6b21a8' },
    { fill: '#faf5ff', stroke: '#f3e8ff', text: '#6b21a8' },
  ],
  orange: [
    { fill: '#c2410c', stroke: '#9a3412', text: '#ffffff' },
    { fill: '#f97316', stroke: '#ea580c', text: '#ffffff' },
    { fill: '#fb923c', stroke: '#f97316', text: '#9a3412' },
    { fill: '#fdba74', stroke: '#fb923c', text: '#c2410c' },
    { fill: '#fed7aa', stroke: '#fdba74', text: '#c2410c' },
    { fill: '#ffedd5', stroke: '#fed7aa', text: '#c2410c' },
    { fill: '#fff7ed', stroke: '#ffedd5', text: '#c2410c' },
  ],
  teal: [
    { fill: '#0f766e', stroke: '#115e59', text: '#ffffff' },
    { fill: '#14b8a6', stroke: '#0d9488', text: '#ffffff' },
    { fill: '#2dd4bf', stroke: '#14b8a6', text: '#115e59' },
    { fill: '#5eead4', stroke: '#2dd4bf', text: '#0f766e' },
    { fill: '#99f6e4', stroke: '#5eead4', text: '#0f766e' },
    { fill: '#ccfbf1', stroke: '#99f6e4', text: '#0f766e' },
    { fill: '#f0fdfa', stroke: '#ccfbf1', text: '#0f766e' },
  ],
  monochrome: [
    { fill: '#1e293b', stroke: '#0f172a', text: '#ffffff' },
    { fill: '#475569', stroke: '#334155', text: '#ffffff' },
    { fill: '#64748b', stroke: '#475569', text: '#ffffff' },
    { fill: '#94a3b8', stroke: '#64748b', text: '#1e293b' },
    { fill: '#cbd5e1', stroke: '#94a3b8', text: '#1e293b' },
    { fill: '#e2e8f0', stroke: '#cbd5e1', text: '#1e293b' },
    { fill: '#f1f5f9', stroke: '#e2e8f0', text: '#1e293b' },
  ],
  rainbow: [
    { fill: '#dc2626', stroke: '#b91c1c', text: '#ffffff' },
    { fill: '#f97316', stroke: '#ea580c', text: '#ffffff' },
    { fill: '#eab308', stroke: '#ca8a04', text: '#1e293b' },
    { fill: '#22c55e', stroke: '#16a34a', text: '#ffffff' },
    { fill: '#3b82f6', stroke: '#2563eb', text: '#ffffff' },
    { fill: '#8b5cf6', stroke: '#7c3aed', text: '#ffffff' },
    { fill: '#ec4899', stroke: '#db2777', text: '#ffffff' },
  ],
};

// Get color for a specific mindmap level
export function getMindmapLevelColor(level: number, theme: keyof typeof MINDMAP_THEMES = 'blue'): { fill: string; stroke: string; text: string } {
  const colors = MINDMAP_THEMES[theme] || MINDMAP_LEVEL_COLORS;
  const index = Math.min(level, colors.length - 1);
  return colors[index];
}
