import type { Graph, Node, Edge } from '@antv/x6';
import { VERSION } from '../version';

// Re-export version for backward compatibility
export const APP_VERSION = VERSION;

export interface ShapeBodyAttrs {
  fill: string;
  stroke: string;
  strokeWidth: number;
  rx?: number;
  ry?: number;
  refPoints?: string;
  strokeDasharray?: string;
  opacity?: number;
}

export interface ShapeLabelAttrs {
  text: string;
  fill: string;
  fontSize: number;
  fontWeight?: string;
  fontStyle?: string;
  fontFamily?: string;
  textAnchor?: string;
  textVerticalAnchor?: string;
  refX?: number | string;
  refY?: number | string;
  refY2?: number;
  textWrap?: {
    width?: number;
    height?: number;
    ellipsis?: boolean;
  };
}

export interface ShapeImageAttrs {
  xlinkHref?: string;
  width?: number;
  height?: number;
  refX?: number;
  refY?: number;
  preserveAspectRatio?: string;
}

export interface ShapeAttrs {
  body: ShapeBodyAttrs;
  label: ShapeLabelAttrs;
  image?: ShapeImageAttrs;
}

export interface ShapeConfig {
  type: string;
  label: string;
  icon: string;
  width: number;
  height: number;
  attrs: ShapeAttrs;
  data?: Record<string, unknown>;
  ports?: unknown;
}

export interface NodeDecoration {
  type: 'icon' | 'emoji' | 'number' | 'flag';
  value: string;
  position: 'prefix' | 'suffix';
  color?: string;
}

// Folder Explorer metadata for nodes
export interface FolderExplorerMetadata {
  isFolderExplorer: boolean;
  explorerType: 'linked' | 'static';
  path: string;  // Full file system path
  isDirectory: boolean;
  isReadOnly: boolean;  // True for linked nodes
  lastRefreshed?: string;  // ISO timestamp for linked nodes
}

// Extended node data interface
export interface NodeData {
  // Mindmap properties
  isMindmap?: boolean;
  level?: number;
  mmOrder?: number;

  // Timeline properties
  isTimeline?: boolean;
  eventType?: 'event' | 'milestone' | 'period' | 'decision' | 'phase' | 'task';
  date?: string;
  endDate?: string;
  duration?: number;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'planned' | 'in-progress' | 'completed' | 'cancelled';

  // Visual properties
  imageUrl?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  prefixDecoration?: string;
  suffixDecoration?: string;
  text?: string;
  textColor?: string;
  locked?: boolean;

  // Folder explorer properties
  folderExplorer?: FolderExplorerMetadata;

  // Collapse/expand property
  collapsed?: boolean;
}

export interface TimelineEventData {
  isTimeline: boolean;
  eventType: 'event' | 'milestone' | 'period' | 'decision' | 'phase' | 'task';
  date?: string; // ISO date string
  endDate?: string; // For periods/phases
  duration?: number; // In days
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'planned' | 'in-progress' | 'completed' | 'cancelled';
}

export interface MindmapNode {
  id: string;
  topic: string;
  children?: MindmapNode[];
  expanded?: boolean;
  direction?: 'right' | 'left';
  // Enhanced metadata
  note?: string;
  link?: string;
  icon?: string;
  priority?: number;
  progress?: number;
  markers?: string[];
  style?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
  };
}

export interface XMindSheet {
  id: string;
  title: string;
  rootTopic: XMindTopic;
}

export interface XMindTopic {
  id: string;
  title: string;
  children?: {
    attached?: XMindTopic[];
  };
}

export interface MindManagerNode {
  '@_OId': string;
  Text?: {
    '@_PlainText': string;
  };
  SubTopics?: {
    Topic: MindManagerNode | MindManagerNode[];
  };
}

export interface DrawddDocument {
  version: string;
  type: 'flowchart' | 'mindmap' | 'diagram';
  nodes: Node.Properties[];
  edges: Edge.Properties[];
  metadata?: {
    title?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  settings?: {
    canvasBackground?: CanvasBackground;
    showGrid?: boolean;
    mindmapDirection?: MindmapLayoutDirection;
    timelineDirection?: 'horizontal' | 'vertical';
    markdownEnabled?: boolean;  // Default: true
    includeHiddenFiles?: boolean;  // Default: false
  };
}

export interface GraphContextType {
  graph: Graph | null;
  setGraph: (graph: Graph | null) => void;
  selectedCell: Node | Edge | null;
  setSelectedCell: (cell: Node | Edge | null) => void;
  mode: 'flowchart' | 'mindmap' | 'timeline';
  setMode: (mode: 'flowchart' | 'mindmap' | 'timeline') => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  // New settings
  showLeftSidebar: boolean;
  setShowLeftSidebar: (show: boolean) => void;
  showRightSidebar: boolean;
  setShowRightSidebar: (show: boolean) => void;
  canvasBackground: CanvasBackground;
  setCanvasBackground: (bg: CanvasBackground) => void;
  pageLayout: 'landscape' | 'portrait';
  setPageLayout: (layout: 'landscape' | 'portrait') => void;
  colorScheme: string;
  setColorScheme: (scheme: string) => void;
  mindmapDirection: MindmapLayoutDirection;
  setMindmapDirection: (direction: MindmapLayoutDirection) => void;
  timelineDirection: 'horizontal' | 'vertical';
  setTimelineDirection: (direction: 'horizontal' | 'vertical') => void;
  exportConnectionPoints: boolean;
  setExportConnectionPoints: (show: boolean) => void;
  gridSize?: number;
  setGridSize?: (size: number) => void;
  exportGrid?: boolean;
  setExportGrid?: (show: boolean) => void;
  spellcheckLanguage: string;
  setSpellcheckLanguage: (lang: string) => void;
  // Mindmap settings
  mindmapTheme: string;
  setMindmapTheme: (theme: string) => void;
  mindmapShowArrows: boolean;
  setMindmapShowArrows: (show: boolean) => void;
  mindmapStrokeWidth: number;
  setMindmapStrokeWidth: (width: number) => void;
  mindmapColorByLevel: boolean;
  setMindmapColorByLevel: (enabled: boolean) => void;
  mindmapBranchNumbering: boolean;
  setMindmapBranchNumbering: (enabled: boolean) => void;
  mindmapSortOrder: 'clockwise' | 'counter-clockwise' | 'top-to-bottom' | 'left-to-right';
  setMindmapSortOrder: (order: 'clockwise' | 'counter-clockwise' | 'top-to-bottom' | 'left-to-right') => void;
  mindmapConnectorStyle: 'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight';
  setMindmapConnectorStyle: (style: 'smooth' | 'orthogonal-rounded' | 'orthogonal-sharp' | 'straight') => void;
  // New layout settings
  mindmapLayoutMode: 'compact' | 'standard' | 'spacious';
  setMindmapLayoutMode: (mode: 'compact' | 'standard' | 'spacious') => void;
  // Markdown and folder explorer settings
  markdownEnabled: boolean;
  setMarkdownEnabled: (enabled: boolean) => void;
  includeHiddenFiles: boolean;
  setIncludeHiddenFiles: (include: boolean) => void;
}

export interface CanvasBackground {
  type: 'color' | 'image';
  color: string;
  imageUrl?: string;
}

export type MindmapLayoutDirection = 'right' | 'left' | 'both' | 'top' | 'bottom' | 'radial';

export type ExportFormat = 'png' | 'svg' | 'json' | 'jpeg' | 'pdf';
export type ImportFormat = 'json' | 'xmind' | 'mmap';

// Multi-page diagram support (like draw.io)
export interface DiagramPage {
  id: string;
  name: string;
  color: string; // Tab color
  data: string; // JSON serialized graph data
  order: number; // Display order
}

export interface DiagramFile {
  id: string;
  name: string;
  isModified: boolean;
  filePath?: string; // File system path if saved
  pages: DiagramPage[];
  activePageId: string;
}

// Color scheme definition
export interface ColorScheme {
  id: string;
  name: string;
  preview: string[];
  nodeColors: {
    primary: { fill: string; stroke: string; text: string };
    secondary: { fill: string; stroke: string; text: string };
    accent: { fill: string; stroke: string; text: string };
    success: { fill: string; stroke: string; text: string };
    warning: { fill: string; stroke: string; text: string };
    danger: { fill: string; stroke: string; text: string };
  };
  lineColor: string;
  backgroundColor: string;
}
