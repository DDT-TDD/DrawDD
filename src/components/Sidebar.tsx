import { useRef, useEffect, useState } from 'react';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Graph } from '@antv/x6';
import {
  Square,
  Circle,
  Diamond,
  Database,
  FileText,
  Edit3,
  Layout,
  GitBranch,
  Minus,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MoveHorizontal,
  MessageCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Box,
  Columns,
  Rows3 as Rows,
  Folder,
  User,
  UserCheck,
  Briefcase,
  Triangle,
  Hexagon,
  Pentagon,
  Star,
  Move,
  Clock,
  Layers,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { useGraph } from '../context/GraphContext';
import { 
  FLOWCHART_SHAPES, 
  MINDMAP_SHAPES, 
  TIMELINE_SHAPES,
  ARROW_SHAPES, 
  CALLOUT_SHAPES, 
  CONTAINER_SHAPES,
  ORGCHART_SHAPES,
  BASIC_SHAPES,
  LOGIC_SHAPES,
  TEXT_SHAPES,
} from '../config/shapes';
import type { ShapeConfig } from '../types';

const iconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  square: Square,
  circle: Circle,
  diamond: Diamond,
  database: Database,
  'file-text': FileText,
  edit: Edit3,
  layout: Layout,
  'git-branch': GitBranch,
  minus: Minus,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'move-horizontal': MoveHorizontal,
  'chevron-right': ChevronRight,
  'message-circle': MessageCircle,
  info: Info,
  'alert-triangle': AlertTriangle,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  box: Box,
  columns: Columns,
  rows: Rows,
  folder: Folder,
  user: User,
  'user-check': UserCheck,
  briefcase: Briefcase,
  triangle: Triangle,
  hexagon: Hexagon,
  pentagon: Pentagon,
  star: Star,
  move: Move,
  clock: Clock,
  layers: Layers,
  'message-square': MessageSquare,
  calendar: Clock,
  image: ImageIcon,
};

interface ShapeCategory {
  id: string;
  name: string;
  shapes: ShapeConfig[];
  icon: React.ReactNode;
}

export function Sidebar() {
  const { graph, mode } = useGraph();
  const dndRef = useRef<Dnd | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['flowchart', 'mindmap', 'timeline', 'basic']));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (graph) {
      dndRef.current = new Dnd({
        target: graph,
        scaled: false,
      });
    }
  }, [graph]);

  const allCategories: ShapeCategory[] = mode === 'flowchart' 
    ? [
        { id: 'flowchart', name: 'Flowchart', shapes: FLOWCHART_SHAPES, icon: <Layout size={16} /> },
        { id: 'basic', name: 'Basic Shapes', shapes: BASIC_SHAPES, icon: <Square size={16} /> },
        { id: 'arrows', name: 'Arrows', shapes: ARROW_SHAPES, icon: <ArrowRight size={16} /> },
        { id: 'callouts', name: 'Callouts', shapes: CALLOUT_SHAPES, icon: <MessageCircle size={16} /> },
        { id: 'containers', name: 'Containers', shapes: CONTAINER_SHAPES, icon: <Box size={16} /> },
        { id: 'orgchart', name: 'Org Chart', shapes: ORGCHART_SHAPES, icon: <User size={16} /> },
        { id: 'logic', name: 'Logic / Fault Tree', shapes: LOGIC_SHAPES, icon: <GitBranch size={16} /> },
        { id: 'text', name: 'Text & Notes', shapes: TEXT_SHAPES, icon: <FileText size={16} /> },
      ]
    : mode === 'timeline'
    ? [
        { id: 'timeline', name: 'Timeline', shapes: TIMELINE_SHAPES, icon: <Clock size={16} /> },
        { id: 'basic', name: 'Basic Shapes', shapes: BASIC_SHAPES, icon: <Square size={16} /> },
        { id: 'callouts', name: 'Callouts', shapes: CALLOUT_SHAPES, icon: <MessageCircle size={16} /> },
        { id: 'text', name: 'Text & Notes', shapes: TEXT_SHAPES, icon: <FileText size={16} /> },
      ]
    : [
        { id: 'mindmap', name: 'Mind Map', shapes: MINDMAP_SHAPES, icon: <GitBranch size={16} /> },
        { id: 'basic', name: 'Basic Shapes', shapes: BASIC_SHAPES, icon: <Square size={16} /> },
        { id: 'callouts', name: 'Callouts', shapes: CALLOUT_SHAPES, icon: <MessageCircle size={16} /> },
        { id: 'text', name: 'Text & Notes', shapes: TEXT_SHAPES, icon: <FileText size={16} /> },
      ];

  // Filter shapes based on search query
  const categories = searchQuery.trim() 
    ? allCategories.map(cat => ({
        ...cat,
        shapes: cat.shapes.filter(shape => 
          shape.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.shapes.length > 0)
    : allCategories;

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.MouseEvent, shape: ShapeConfig) => {
    if (!graph || !dndRef.current) return;

    // Special handling for image shape - show file picker
    if (shape.label === 'Image') {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (evt) => {
        const file = (evt.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (readerEvt) => {
            const dataUrl = readerEvt.target?.result as string;
            const imgEl = new Image();
            imgEl.onload = () => {
              const maxDim = 320;
              const minDim = 60;
              const scale = Math.min(maxDim / imgEl.width, maxDim / imgEl.height, 1);
              const width = Math.max(minDim, Math.round(imgEl.width * scale));
              const height = Math.max(minDim, Math.round(imgEl.height * scale));

              const node = createNode(graph, shape);
              node.resize(width, height);
              node.setAttrs({
                image: {
                  xlinkHref: dataUrl,
                  width,
                  height,
                  preserveAspectRatio: 'xMidYMid meet',
                },
                body: {
                  ...(node.getAttrs().body || {}),
                },
              });
              node.setData({ imageUrl: dataUrl, naturalWidth: imgEl.width, naturalHeight: imgEl.height });
              // Add node at center of viewport
              const center = graph.getGraphArea();
              node.setPosition(center.width / 2 - width / 2, center.height / 2 - height / 2);
              graph.addNode(node);
            };
            imgEl.src = dataUrl;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    const node = createNode(graph, shape);
    dndRef.current.start(node, e.nativeEvent);
  };

  return (
    <div className="w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-sm">
      {/* Search Input */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search shapes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            No shapes found
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                {expandedCategories.has(category.id) || searchQuery ? (
                  <ChevronDown size={12} className="text-gray-400" />
                ) : (
                  <ChevronRight size={12} className="text-gray-400" />
                )}
                <span className="text-gray-500 dark:text-gray-400">{category.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">{category.name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{category.shapes.length}</span>
              </button>
            
              {(expandedCategories.has(category.id) || searchQuery) && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-1.5">
                    {category.shapes.map((shape, index) => {
                      const Icon = iconMap[shape.icon] || Square;
                      return (
                        <div
                          key={`${category.id}-${shape.type}-${index}-${shape.label}`}
                          draggable
                          onMouseDown={(e) => handleDragStart(e, shape)}
                          className="flex flex-col items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-transparent cursor-grab hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all group"
                          title={shape.label}
                        >
                          <div
                            className="w-9 h-7 rounded flex items-center justify-center shadow-sm"
                            style={{
                              backgroundColor: String(shape.attrs.body.fill || '#ffffff'),
                              border: `1.5px solid ${String(shape.attrs.body.stroke || '#333333')}`,
                              borderRadius: shape.attrs.body.rx ? `${Math.min(Number(shape.attrs.body.rx), 6)}px` : '2px',
                            }}
                          >
                            <Icon size={12} className="text-gray-500" />
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-center leading-tight truncate w-full">
                            {shape.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function createNode(graph: Graph, shape: ShapeConfig) {
  // Check if it's a custom logic gate shape
  const isCustomShape = shape.type.startsWith('logic-');
  
  const resolvedShape = isCustomShape
    ? shape.type
    : shape.type === 'ellipse'
      ? 'ellipse'
      : shape.type === 'polygon'
        ? 'polygon'
        : shape.type === 'circle'
          ? 'circle'
          : shape.type === 'image'
            ? 'image'
            : 'rect';

  const node = graph.createNode({
    width: shape.width,
    height: shape.height,
    shape: resolvedShape,
    attrs: isCustomShape ? undefined : {
      body: { ...shape.attrs.body },
      label: { ...shape.attrs.label },
    },
    data: shape.data || {},
    ports: shape.ports || (isCustomShape ? undefined : {
      groups: {
        top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        topRight: { position: { name: 'absolute', args: { x: '100%', y: '0%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        bottomRight: { position: { name: 'absolute', args: { x: '100%', y: '100%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        bottomLeft: { position: { name: 'absolute', args: { x: '0%', y: '100%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        topLeft: { position: { name: 'absolute', args: { x: '0%', y: '0%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        topMid1: { position: { name: 'absolute', args: { x: '25%', y: '0%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        topMid2: { position: { name: 'absolute', args: { x: '75%', y: '0%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        rightMid1: { position: { name: 'absolute', args: { x: '100%', y: '25%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        rightMid2: { position: { name: 'absolute', args: { x: '100%', y: '75%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        bottomMid1: { position: { name: 'absolute', args: { x: '25%', y: '100%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        bottomMid2: { position: { name: 'absolute', args: { x: '75%', y: '100%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        leftMid1: { position: { name: 'absolute', args: { x: '0%', y: '25%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
        leftMid2: { position: { name: 'absolute', args: { x: '0%', y: '75%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
      },
      items: [
        { group: 'top', id: 'top' },
        { group: 'topRight', id: 'topRight' },
        { group: 'right', id: 'right' },
        { group: 'bottomRight', id: 'bottomRight' },
        { group: 'bottom', id: 'bottom' },
        { group: 'bottomLeft', id: 'bottomLeft' },
        { group: 'left', id: 'left' },
        { group: 'topLeft', id: 'topLeft' },
        { group: 'topMid1', id: 'topMid1' },
        { group: 'topMid2', id: 'topMid2' },
        { group: 'rightMid1', id: 'rightMid1' },
        { group: 'rightMid2', id: 'rightMid2' },
        { group: 'bottomMid1', id: 'bottomMid1' },
        { group: 'bottomMid2', id: 'bottomMid2' },
        { group: 'leftMid1', id: 'leftMid1' },
        { group: 'leftMid2', id: 'leftMid2' },
      ],
    }),
  });

  return node;
}
