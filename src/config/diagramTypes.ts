export type DiagramType = 
  | 'flowchart'
  | 'mindmap'
  | 'concept-map'
  | 'org-chart'
  | 'fishbone'
  | 'timeline'
  | 'tree'
  | 'tree-left'
  | 'tree-right';

export interface DiagramTypeConfig {
  id: DiagramType;
  name: string;
  icon: string;
  description: string;
  defaultLayout: LayoutType;
  allowedShapes: string[];
  defaultConnector: ConnectorStyle;
}

export type LayoutType = 
  | 'free'
  | 'tree-horizontal'
  | 'tree-vertical'
  | 'tree-left'
  | 'tree-right'
  | 'radial'
  | 'fishbone'
  | 'timeline'
  | 'org-chart';

export interface ConnectorStyle {
  router: 'normal' | 'manhattan' | 'orth' | 'smooth';
  connector: 'normal' | 'rounded' | 'smooth' | 'jumpover';
  sourceArrow: ArrowType;
  targetArrow: ArrowType;
}

export type ArrowType = 'none' | 'block' | 'classic' | 'diamond' | 'circle' | 'open';

export const ARROW_TYPES: { id: ArrowType; name: string; preview: string }[] = [
  { id: 'none', name: 'None', preview: '―――' },
  { id: 'block', name: 'Block', preview: '――▶' },
  { id: 'classic', name: 'Classic', preview: '――>' },
  { id: 'diamond', name: 'Diamond', preview: '――◆' },
  { id: 'circle', name: 'Circle', preview: '――●' },
  { id: 'open', name: 'Open', preview: '――▷' },
];

export const DIAGRAM_TYPES: DiagramTypeConfig[] = [
  {
    id: 'flowchart',
    name: 'Flowchart',
    icon: '📊',
    description: 'Process flows and decision trees',
    defaultLayout: 'free',
    allowedShapes: ['rect', 'ellipse', 'diamond', 'parallelogram', 'cylinder', 'document'],
    defaultConnector: {
      router: 'manhattan',
      connector: 'rounded',
      sourceArrow: 'none',
      targetArrow: 'block',
    },
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    icon: '🧠',
    description: 'Radial idea organization',
    defaultLayout: 'tree-horizontal',
    allowedShapes: ['rect', 'rounded-rect', 'ellipse', 'pill'],
    defaultConnector: {
      router: 'smooth',
      connector: 'smooth',
      sourceArrow: 'none',
      targetArrow: 'none',
    },
  },
  {
    id: 'concept-map',
    name: 'Concept Map',
    icon: '🔗',
    description: 'Connected concepts with labeled relationships',
    defaultLayout: 'free',
    allowedShapes: ['rect', 'ellipse', 'rounded-rect'],
    defaultConnector: {
      router: 'normal',
      connector: 'smooth',
      sourceArrow: 'none',
      targetArrow: 'classic',
    },
  },
  {
    id: 'org-chart',
    name: 'Org Chart',
    icon: '👥',
    description: 'Organizational hierarchies',
    defaultLayout: 'org-chart',
    allowedShapes: ['rect', 'rounded-rect', 'card'],
    defaultConnector: {
      router: 'orth',
      connector: 'rounded',
      sourceArrow: 'none',
      targetArrow: 'none',
    },
  },
  {
    id: 'fishbone',
    name: 'Fishbone / Ishikawa',
    icon: '🐟',
    description: 'Cause and effect analysis',
    defaultLayout: 'fishbone',
    allowedShapes: ['rect', 'text'],
    defaultConnector: {
      router: 'normal',
      connector: 'normal',
      sourceArrow: 'none',
      targetArrow: 'none',
    },
  },
  {
    id: 'timeline',
    name: 'Timeline',
    icon: '📅',
    description: 'Chronological events',
    defaultLayout: 'timeline',
    allowedShapes: ['rect', 'rounded-rect', 'circle'],
    defaultConnector: {
      router: 'normal',
      connector: 'normal',
      sourceArrow: 'none',
      targetArrow: 'block',
    },
  },
  {
    id: 'tree',
    name: 'Tree (Top-Down)',
    icon: '🌳',
    description: 'Hierarchical tree structure',
    defaultLayout: 'tree-vertical',
    allowedShapes: ['rect', 'rounded-rect', 'ellipse'],
    defaultConnector: {
      router: 'orth',
      connector: 'rounded',
      sourceArrow: 'none',
      targetArrow: 'none',
    },
  },
  {
    id: 'tree-left',
    name: 'Tree (Left)',
    icon: '⬅️',
    description: 'Tree growing to the left',
    defaultLayout: 'tree-left',
    allowedShapes: ['rect', 'rounded-rect', 'ellipse'],
    defaultConnector: {
      router: 'orth',
      connector: 'rounded',
      sourceArrow: 'none',
      targetArrow: 'none',
    },
  },
  {
    id: 'tree-right',
    name: 'Tree (Right)',
    icon: '➡️',
    description: 'Tree growing to the right',
    defaultLayout: 'tree-right',
    allowedShapes: ['rect', 'rounded-rect', 'ellipse'],
    defaultConnector: {
      router: 'orth',
      connector: 'rounded',
      sourceArrow: 'none',
      targetArrow: 'none',
    },
  },
];

export const SHAPE_TYPES = [
  { id: 'rect', name: 'Rectangle', icon: '▭' },
  { id: 'rounded-rect', name: 'Rounded Rectangle', icon: '▢' },
  { id: 'ellipse', name: 'Ellipse', icon: '⬭' },
  { id: 'circle', name: 'Circle', icon: '●' },
  { id: 'diamond', name: 'Diamond', icon: '◆' },
  { id: 'parallelogram', name: 'Parallelogram', icon: '▱' },
  { id: 'cylinder', name: 'Cylinder', icon: '⌸' },
  { id: 'document', name: 'Document', icon: '📄' },
  { id: 'pill', name: 'Pill', icon: '💊' },
  { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
  { id: 'triangle', name: 'Triangle', icon: '△' },
  { id: 'star', name: 'Star', icon: '⭐' },
  { id: 'cloud', name: 'Cloud', icon: '☁️' },
  { id: 'arrow-right', name: 'Arrow Right', icon: '➡️' },
  { id: 'callout', name: 'Callout', icon: '💬' },
];

export const LINE_STYLES = [
  { id: 'solid', name: 'Solid', dasharray: '' },
  { id: 'dashed', name: 'Dashed', dasharray: '8 4' },
  { id: 'dotted', name: 'Dotted', dasharray: '2 2' },
  { id: 'dash-dot', name: 'Dash-Dot', dasharray: '8 4 2 4' },
];

export const CONNECTOR_TYPES = [
  { id: 'straight', name: 'Straight', router: 'normal', connector: 'normal' },
  { id: 'orthogonal', name: 'Orthogonal', router: 'orth', connector: 'normal' },
  { id: 'rounded', name: 'Rounded', router: 'manhattan', connector: 'rounded' },
  { id: 'smooth', name: 'Smooth Curve', router: 'normal', connector: 'smooth' },
];
