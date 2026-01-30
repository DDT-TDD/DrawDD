/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Graph, Node, Edge } from '@antv/x6';
import type { GraphContextType, CanvasBackground, MindmapLayoutDirection } from '../types';

const GraphContext = createContext<GraphContextType | null>(null);

export function GraphProvider({ children }: { children: ReactNode }) {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [selectedCell, setSelectedCell] = useState<Node | Edge | null>(null);
  const [mode, setMode] = useState<'flowchart' | 'mindmap' | 'timeline'>('flowchart');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  // New settings
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [canvasBackground, setCanvasBackground] = useState<CanvasBackground>({
    type: 'color',
    color: '#f8fafc',
  });
  const [pageLayout, setPageLayout] = useState<'landscape' | 'portrait'>('landscape');
  const [colorScheme, setColorScheme] = useState('default');
  const [mindmapDirection, setMindmapDirection] = useState<MindmapLayoutDirection>('right');
  const [timelineDirection, setTimelineDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [exportConnectionPoints, setExportConnectionPoints] = useState(false);
  const [gridSize, setGridSize] = useState<number>(10);
  const [exportGrid, setExportGrid] = useState<boolean>(false);
  const [spellcheckLanguage, setSpellcheckLanguage] = useState<string>(() => {
    return localStorage.getItem('drawdd-spellcheck-lang') || 'en-GB';
  });

  // Mindmap-specific settings
  const [mindmapTheme, setMindmapTheme] = useState<string>(() => {
    return localStorage.getItem('drawdd-mindmap-theme') || 'blue';
  });
  const [mindmapShowArrows, setMindmapShowArrows] = useState<boolean>(() => {
    // Default: no arrows (false). Only show arrows if explicitly set to 'true'
    return localStorage.getItem('drawdd-mindmap-arrows') === 'true';
  });
  const [mindmapStrokeWidth, setMindmapStrokeWidth] = useState<number>(() => {
    const stored = localStorage.getItem('drawdd-mindmap-stroke-width');
    return stored ? parseInt(stored, 10) : 1; // Default: thin lines (1px)
  });
  const [mindmapColorByLevel, setMindmapColorByLevel] = useState<boolean>(() => {
    return localStorage.getItem('drawdd-mindmap-color-by-level') === 'true';
  });
  const [mindmapBranchNumbering, setMindmapBranchNumbering] = useState<boolean>(() => {
    return localStorage.getItem('drawdd-mindmap-numbering') === 'true';
  });
  const [mindmapSortOrder, setMindmapSortOrder] = useState<'clockwise' | 'counter-clockwise' | 'top-to-bottom' | 'left-to-right'>(() => {
    return (localStorage.getItem('drawdd-mindmap-sort-order') as any) || 'clockwise';
  });
  const [mindmapConnectorStyle, setMindmapConnectorStyle] = useState<'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight'>(() => {
    const saved = localStorage.getItem('drawdd-mindmap-connector') as any;
    // Migrate old 'orthogonal' to 'orthogonal-rounded'
    if (saved === 'orthogonal') return 'orthogonal-rounded';
    return saved || 'smooth'; // Default to smooth curved lines
  });

  // New layout and feature settings
  const [mindmapLayoutMode, setMindmapLayoutMode] = useState<'standard' | 'compact'>(() => {
    return (localStorage.getItem('drawdd-mindmap-layout-mode') as any) || 'standard';
  });
  const [markdownEnabled, setMarkdownEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('drawdd-markdown-enabled');
    return stored === null ? true : stored === 'true'; // Default: true
  });
  const [includeHiddenFiles, setIncludeHiddenFiles] = useState<boolean>(() => {
    return localStorage.getItem('drawdd-include-hidden-files') === 'true';
  });

  return (
    <GraphContext.Provider
      value={{
        graph,
        setGraph,
        selectedCell,
        setSelectedCell,
        mode,
        setMode,
        zoom,
        setZoom,
        showGrid,
        setShowGrid,
        showLeftSidebar,
        setShowLeftSidebar,
        showRightSidebar,
        setShowRightSidebar,
        canvasBackground,
        setCanvasBackground,
        pageLayout,
        setPageLayout,
        colorScheme,
        setColorScheme,
        mindmapDirection,
        setMindmapDirection,
        timelineDirection,
        setTimelineDirection,
        exportConnectionPoints,
        setExportConnectionPoints,
        gridSize,
        setGridSize,
        exportGrid,
        setExportGrid,
        spellcheckLanguage,
        setSpellcheckLanguage: (lang: string) => {
          setSpellcheckLanguage(lang);
          localStorage.setItem('drawdd-spellcheck-lang', lang);
        },
        // Mindmap settings
        mindmapTheme,
        setMindmapTheme: (theme: string) => {
          setMindmapTheme(theme);
          localStorage.setItem('drawdd-mindmap-theme', theme);
        },
        mindmapShowArrows,
        setMindmapShowArrows: (show: boolean) => {
          setMindmapShowArrows(show);
          localStorage.setItem('drawdd-mindmap-arrows', show ? 'true' : 'false');
        },
        mindmapStrokeWidth,
        setMindmapStrokeWidth: (width: number) => {
          setMindmapStrokeWidth(width);
          localStorage.setItem('drawdd-mindmap-stroke-width', width.toString());
        },
        mindmapColorByLevel,
        setMindmapColorByLevel: (enabled: boolean) => {
          setMindmapColorByLevel(enabled);
          localStorage.setItem('drawdd-mindmap-color-by-level', enabled ? 'true' : 'false');
        },
        mindmapBranchNumbering,
        setMindmapBranchNumbering: (enabled: boolean) => {
          setMindmapBranchNumbering(enabled);
          localStorage.setItem('drawdd-mindmap-numbering', enabled ? 'true' : 'false');
        },
        mindmapSortOrder,
        setMindmapSortOrder: (order: 'clockwise' | 'counter-clockwise' | 'top-to-bottom' | 'left-to-right') => {
          setMindmapSortOrder(order);
          localStorage.setItem('drawdd-mindmap-sort-order', order);
        },
        mindmapConnectorStyle,
        setMindmapConnectorStyle: (style: 'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight') => {
          setMindmapConnectorStyle(style);
          localStorage.setItem('drawdd-mindmap-connector', style);
        },
        // New layout and feature settings
        mindmapLayoutMode,
        setMindmapLayoutMode: (mode: 'standard' | 'compact') => {
          setMindmapLayoutMode(mode);
          localStorage.setItem('drawdd-mindmap-layout-mode', mode);
          // Dispatch event to trigger layout refresh
          window.dispatchEvent(new CustomEvent('drawdd:layout-mode-changed', { detail: { mode } }));
        },
        markdownEnabled,
        setMarkdownEnabled: (enabled: boolean) => {
          setMarkdownEnabled(enabled);
          localStorage.setItem('drawdd-markdown-enabled', enabled ? 'true' : 'false');
        },
        includeHiddenFiles,
        setIncludeHiddenFiles: (include: boolean) => {
          setIncludeHiddenFiles(include);
          localStorage.setItem('drawdd-include-hidden-files', include ? 'true' : 'false');
        },
      }}
    >
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}
