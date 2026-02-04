import type { ColorScheme } from '../types';

/**
 * DRAWDD Color Schemes - Professional & Captivating Themes
 * 
 * Design Principles:
 * - Light, professional backgrounds (like the Default theme)
 * - Harmonious, meaningful color combinations
 * - Distinct primary/secondary/accent hierarchy
 * - Good contrast for readability
 * - Modern, fresh aesthetics
 */

export const COLOR_SCHEMES: ColorScheme[] = [
  // ============================================
  // CLASSIC PROFESSIONAL THEMES
  // ============================================
  {
    id: 'default',
    name: 'Default',
    preview: ['#ffffff', '#333333', '#3b82f6', '#10b981'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#333333', text: '#333333' },
      secondary: { fill: '#f3f4f6', stroke: '#6b7280', text: '#374151' },
      accent: { fill: '#3b82f6', stroke: '#1d4ed8', text: '#ffffff' },
      success: { fill: '#e8f5e9', stroke: '#4caf50', text: '#1b5e20' },
      warning: { fill: '#fff3e0', stroke: '#ff9800', text: '#e65100' },
      danger: { fill: '#ffebee', stroke: '#f44336', text: '#b71c1c' },
    },
    lineColor: '#333333',
    backgroundColor: '#f8fafc',
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    preview: ['#ffffff', '#1e40af', '#3b82f6', '#93c5fd'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#1e40af', text: '#1e3a8a' },
      secondary: { fill: '#eff6ff', stroke: '#3b82f6', text: '#1d4ed8' },
      accent: { fill: '#2563eb', stroke: '#1d4ed8', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fffbeb', stroke: '#f59e0b', text: '#b45309' },
      danger: { fill: '#fef2f2', stroke: '#ef4444', text: '#b91c1c' },
    },
    lineColor: '#1e40af',
    backgroundColor: '#f8fafc',
  },
  {
    id: 'executive',
    name: 'Executive',
    preview: ['#ffffff', '#0f172a', '#475569', '#94a3b8'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#334155', text: '#0f172a' },
      secondary: { fill: '#f8fafc', stroke: '#64748b', text: '#334155' },
      accent: { fill: '#334155', stroke: '#1e293b', text: '#ffffff' },
      success: { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#334155',
    backgroundColor: '#f8fafc',
  },
  {
    id: 'consultant',
    name: 'Consultant',
    preview: ['#ffffff', '#0c4a6e', '#0284c7', '#7dd3fc'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#0369a1', text: '#0c4a6e' },
      secondary: { fill: '#f0f9ff', stroke: '#0ea5e9', text: '#075985' },
      accent: { fill: '#0284c7', stroke: '#0369a1', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#16a34a', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#ca8a04', text: '#854d0e' },
      danger: { fill: '#fff1f2', stroke: '#e11d48', text: '#9f1239' },
    },
    lineColor: '#0369a1',
    backgroundColor: '#f8fafc',
  },

  // ============================================
  // ELEGANT & SOPHISTICATED THEMES
  // ============================================
  {
    id: 'slate-elegance',
    name: 'Slate Elegance',
    preview: ['#ffffff', '#475569', '#64748b', '#cbd5e1'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#475569', text: '#1e293b' },
      secondary: { fill: '#f8fafc', stroke: '#94a3b8', text: '#475569' },
      accent: { fill: '#64748b', stroke: '#475569', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#15803d' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#ef4444', text: '#b91c1c' },
    },
    lineColor: '#475569',
    backgroundColor: '#f8fafc',
  },
  {
    id: 'charcoal',
    name: 'Charcoal & White',
    preview: ['#ffffff', '#1f2937', '#4b5563', '#9ca3af'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#374151', text: '#111827' },
      secondary: { fill: '#f9fafb', stroke: '#6b7280', text: '#374151' },
      accent: { fill: '#4b5563', stroke: '#374151', text: '#ffffff' },
      success: { fill: '#ecfdf5', stroke: '#059669', text: '#065f46' },
      warning: { fill: '#fffbeb', stroke: '#d97706', text: '#92400e' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#374151',
    backgroundColor: '#f9fafb',
  },
  {
    id: 'graphite-pro',
    name: 'Graphite Pro',
    preview: ['#ffffff', '#27272a', '#52525b', '#a1a1aa'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#3f3f46', text: '#18181b' },
      secondary: { fill: '#fafafa', stroke: '#71717a', text: '#3f3f46' },
      accent: { fill: '#52525b', stroke: '#3f3f46', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#16a34a', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#ca8a04', text: '#854d0e' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#3f3f46',
    backgroundColor: '#fafafa',
  },

  // ============================================
  // NATURE-INSPIRED THEMES (Light & Fresh)
  // ============================================
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    preview: ['#ffffff', '#0077b6', '#00b4d8', '#90e0ef'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#0077b6', text: '#023e8a' },
      secondary: { fill: '#f0f9ff', stroke: '#0ea5e9', text: '#075985' },
      accent: { fill: '#0077b6', stroke: '#023e8a', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#10b981', text: '#065f46' },
      warning: { fill: '#fffbeb', stroke: '#f59e0b', text: '#b45309' },
      danger: { fill: '#fef2f2', stroke: '#ef4444', text: '#b91c1c' },
    },
    lineColor: '#0077b6',
    backgroundColor: '#f0f9ff',
  },
  {
    id: 'forest-fresh',
    name: 'Forest Fresh',
    preview: ['#ffffff', '#15803d', '#22c55e', '#86efac'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#16a34a', text: '#14532d' },
      secondary: { fill: '#f0fdf4', stroke: '#4ade80', text: '#166534' },
      accent: { fill: '#16a34a', stroke: '#15803d', text: '#ffffff' },
      success: { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  {
    id: 'sage-garden',
    name: 'Sage Garden',
    preview: ['#ffffff', '#4d7c0f', '#84cc16', '#bef264'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#65a30d', text: '#365314' },
      secondary: { fill: '#f7fee7', stroke: '#a3e635', text: '#4d7c0f' },
      accent: { fill: '#65a30d', stroke: '#4d7c0f', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#ca8a04', text: '#854d0e' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#65a30d',
    backgroundColor: '#f7fee7',
  },
  {
    id: 'mint-fresh',
    name: 'Mint Fresh',
    preview: ['#ffffff', '#0d9488', '#14b8a6', '#5eead4'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#0f766e', text: '#134e4a' },
      secondary: { fill: '#f0fdfa', stroke: '#2dd4bf', text: '#115e59' },
      accent: { fill: '#0d9488', stroke: '#0f766e', text: '#ffffff' },
      success: { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#ef4444', text: '#b91c1c' },
    },
    lineColor: '#0f766e',
    backgroundColor: '#f0fdfa',
  },

  // ============================================
  // WARM & INVITING THEMES
  // ============================================
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    preview: ['#ffffff', '#c2410c', '#f97316', '#fdba74'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#ea580c', text: '#9a3412' },
      secondary: { fill: '#fff7ed', stroke: '#fb923c', text: '#c2410c' },
      accent: { fill: '#ea580c', stroke: '#c2410c', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#ea580c',
    backgroundColor: '#fff7ed',
  },
  {
    id: 'amber-warmth',
    name: 'Amber Warmth',
    preview: ['#ffffff', '#b45309', '#f59e0b', '#fcd34d'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#d97706', text: '#92400e' },
      secondary: { fill: '#fffbeb', stroke: '#fbbf24', text: '#b45309' },
      accent: { fill: '#d97706', stroke: '#b45309', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#d97706',
    backgroundColor: '#fffbeb',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    preview: ['#ffffff', '#9a3412', '#dc2626', '#fca5a5'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#b91c1c', text: '#7f1d1d' },
      secondary: { fill: '#fef2f2', stroke: '#f87171', text: '#991b1b' },
      accent: { fill: '#dc2626', stroke: '#b91c1c', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fee2e2', stroke: '#ef4444', text: '#b91c1c' },
    },
    lineColor: '#b91c1c',
    backgroundColor: '#fef2f2',
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef',
    preview: ['#ffffff', '#be185d', '#ec4899', '#f9a8d4'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#db2777', text: '#9d174d' },
      secondary: { fill: '#fdf2f8', stroke: '#f472b6', text: '#be185d' },
      accent: { fill: '#db2777', stroke: '#be185d', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#db2777',
    backgroundColor: '#fdf2f8',
  },

  // ============================================
  // CREATIVE & VIBRANT THEMES
  // ============================================
  {
    id: 'lavender-dream',
    name: 'Lavender Dream',
    preview: ['#ffffff', '#7c3aed', '#a78bfa', '#ddd6fe'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#8b5cf6', text: '#5b21b6' },
      secondary: { fill: '#f5f3ff', stroke: '#c4b5fd', text: '#6d28d9' },
      accent: { fill: '#7c3aed', stroke: '#6d28d9', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#7c3aed',
    backgroundColor: '#faf5ff',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    preview: ['#ffffff', '#6d28d9', '#8b5cf6', '#c4b5fd'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#7c3aed', text: '#4c1d95' },
      secondary: { fill: '#f5f3ff', stroke: '#a78bfa', text: '#5b21b6' },
      accent: { fill: '#6d28d9', stroke: '#5b21b6', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#6d28d9',
    backgroundColor: '#f5f3ff',
  },
  {
    id: 'indigo-ink',
    name: 'Indigo Ink',
    preview: ['#ffffff', '#4338ca', '#6366f1', '#a5b4fc'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#4f46e5', text: '#312e81' },
      secondary: { fill: '#eef2ff', stroke: '#818cf8', text: '#3730a3' },
      accent: { fill: '#4338ca', stroke: '#3730a3', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#4338ca',
    backgroundColor: '#eef2ff',
  },
  {
    id: 'rose-petal',
    name: 'Rose Petal',
    preview: ['#ffffff', '#be123c', '#f43f5e', '#fda4af'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#e11d48', text: '#9f1239' },
      secondary: { fill: '#fff1f2', stroke: '#fb7185', text: '#be123c' },
      accent: { fill: '#e11d48', stroke: '#be123c', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#e11d48',
    backgroundColor: '#fff1f2',
  },

  // ============================================
  // SOFT & PASTEL THEMES
  // ============================================
  {
    id: 'soft-cloud',
    name: 'Soft Cloud',
    preview: ['#ffffff', '#6b7280', '#9ca3af', '#d1d5db'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#9ca3af', text: '#374151' },
      secondary: { fill: '#f9fafb', stroke: '#d1d5db', text: '#4b5563' },
      accent: { fill: '#6b7280', stroke: '#4b5563', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#4ade80', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#fbbf24', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#f87171', text: '#b91c1c' },
    },
    lineColor: '#9ca3af',
    backgroundColor: '#f9fafb',
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    preview: ['#ffffff', '#f472b6', '#a78bfa', '#67e8f9'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#f472b6', text: '#9d174d' },
      secondary: { fill: '#fdf2f8', stroke: '#c4b5fd', text: '#5b21b6' },
      accent: { fill: '#a78bfa', stroke: '#8b5cf6', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#4ade80', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#fbbf24', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#fb7185', text: '#be123c' },
    },
    lineColor: '#c084fc',
    backgroundColor: '#fdf4ff',
  },
  {
    id: 'spring-meadow',
    name: 'Spring Meadow',
    preview: ['#ffffff', '#4ade80', '#fbbf24', '#38bdf8'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#22c55e', text: '#166534' },
      secondary: { fill: '#f0fdf4', stroke: '#86efac', text: '#15803d' },
      accent: { fill: '#22c55e', stroke: '#16a34a', text: '#ffffff' },
      success: { fill: '#ecfdf5', stroke: '#10b981', text: '#065f46' },
      warning: { fill: '#fefce8', stroke: '#fbbf24', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#f87171', text: '#b91c1c' },
    },
    lineColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  {
    id: 'baby-blue',
    name: 'Baby Blue',
    preview: ['#ffffff', '#38bdf8', '#7dd3fc', '#bae6fd'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#0ea5e9', text: '#0369a1' },
      secondary: { fill: '#f0f9ff', stroke: '#7dd3fc', text: '#0284c7' },
      accent: { fill: '#0ea5e9', stroke: '#0284c7', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#fbbf24', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#f87171', text: '#b91c1c' },
    },
    lineColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },

  // ============================================
  // CLASSIC EARTH TONES
  // ============================================
  {
    id: 'vintage-sepia',
    name: 'Vintage Sepia',
    preview: ['#ffffff', '#78350f', '#a16207', '#fcd34d'],
    nodeColors: {
      primary: { fill: '#fffbeb', stroke: '#92400e', text: '#78350f' },
      secondary: { fill: '#fef3c7', stroke: '#d97706', text: '#92400e' },
      accent: { fill: '#92400e', stroke: '#78350f', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fef3c7', stroke: '#f59e0b', text: '#92400e' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#92400e',
    backgroundColor: '#fffbeb',
  },
  {
    id: 'warm-brown',
    name: 'Warm Brown',
    preview: ['#ffffff', '#78350f', '#a16207', '#d6d3d1'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#78350f', text: '#451a03' },
      secondary: { fill: '#fafaf9', stroke: '#a8a29e', text: '#57534e' },
      accent: { fill: '#78350f', stroke: '#451a03', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#78350f',
    backgroundColor: '#fafaf9',
  },
  {
    id: 'mocha',
    name: 'Mocha',
    preview: ['#ffffff', '#57534e', '#78716c', '#d6d3d1'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#57534e', text: '#292524' },
      secondary: { fill: '#fafaf9', stroke: '#a8a29e', text: '#44403c' },
      accent: { fill: '#57534e', stroke: '#44403c', text: '#ffffff' },
      success: { fill: '#f0fdf4', stroke: '#22c55e', text: '#166534' },
      warning: { fill: '#fefce8', stroke: '#eab308', text: '#a16207' },
      danger: { fill: '#fef2f2', stroke: '#dc2626', text: '#991b1b' },
    },
    lineColor: '#57534e',
    backgroundColor: '#fafaf9',
  },

  // ============================================
  // ACCESSIBILITY THEMES
  // ============================================
  {
    id: 'high-contrast',
    name: 'High Contrast',
    preview: ['#ffffff', '#000000', '#0000ff', '#009900'],
    nodeColors: {
      primary: { fill: '#ffffff', stroke: '#000000', text: '#000000' },
      secondary: { fill: '#f5f5f5', stroke: '#333333', text: '#000000' },
      accent: { fill: '#0000cc', stroke: '#000066', text: '#ffffff' },
      success: { fill: '#ccffcc', stroke: '#006600', text: '#003300' },
      warning: { fill: '#ffffcc', stroke: '#cc9900', text: '#663300' },
      danger: { fill: '#ffcccc', stroke: '#cc0000', text: '#660000' },
    },
    lineColor: '#000000',
    backgroundColor: '#ffffff',
  },

  // ============================================
  // DARK MODE (Single Option for Users Who Need It)
  // ============================================
  {
    id: 'dark-professional',
    name: 'Dark Mode',
    preview: ['#1e293b', '#94a3b8', '#3b82f6', '#f1f5f9'],
    nodeColors: {
      primary: { fill: '#1e293b', stroke: '#64748b', text: '#f1f5f9' },
      secondary: { fill: '#334155', stroke: '#94a3b8', text: '#e2e8f0' },
      accent: { fill: '#3b82f6', stroke: '#60a5fa', text: '#ffffff' },
      success: { fill: '#064e3b', stroke: '#10b981', text: '#ecfdf5' },
      warning: { fill: '#78350f', stroke: '#f59e0b', text: '#fefce8' },
      danger: { fill: '#7f1d1d', stroke: '#ef4444', text: '#fef2f2' },
    },
    lineColor: '#94a3b8',
    backgroundColor: '#0f172a',
  },
];

// Get scheme by ID
export function getColorScheme(id: string): ColorScheme {
  return COLOR_SCHEMES.find(s => s.id === id) || COLOR_SCHEMES[0];
}
