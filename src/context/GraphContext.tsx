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
