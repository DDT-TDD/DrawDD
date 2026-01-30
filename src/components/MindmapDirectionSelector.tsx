import { useGraph } from '../context/GraphContext';
import { 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight,
  Circle,
  ChevronDown,
  Palette,
  RotateCw,
  RotateCcw,
  MoveDown,
  MoveRight,
  Minus
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { MindmapLayoutDirection } from '../types';
import { applyMindmapLayout } from '../utils/layout';
import { MINDMAP_THEMES } from '../config/enhancedStyles';

type MindmapSortOrder = 'clockwise' | 'counter-clockwise' | 'top-to-bottom' | 'left-to-right';
type MindmapThemeName = keyof typeof MINDMAP_THEMES;

interface DirectionOption {
  id: MindmapLayoutDirection;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface SortOrderOption {
  id: MindmapSortOrder;
  label: string;
  icon: React.ReactNode;
}

const DIRECTION_OPTIONS: DirectionOption[] = [
  {
    id: 'right',
    label: 'Right',
    description: 'Left to right layout',
    icon: <ArrowRight size={18} />,
  },
  {
    id: 'left',
    label: 'Left',
    description: 'Right to left layout',
    icon: <ArrowLeft size={18} />,
  },
  {
    id: 'both',
    label: 'Both Sides',
    description: 'Balanced left and right',
    icon: <ArrowLeftRight size={18} />,
  },
  {
    id: 'top',
    label: 'Up',
    description: 'Bottom to top layout',
    icon: <ArrowUp size={18} />,
  },
  {
    id: 'bottom',
    label: 'Down',
    description: 'Top to bottom layout',
    icon: <ArrowDown size={18} />,
  },
  {
    id: 'radial',
    label: 'Radial',
    description: 'Circular layout from center',
    icon: <Circle size={18} />,
  },
];

const SORT_ORDER_OPTIONS: SortOrderOption[] = [
  { id: 'top-to-bottom', label: 'Top to Bottom', icon: <MoveDown size={16} /> },
  { id: 'left-to-right', label: 'Left to Right', icon: <MoveRight size={16} /> },
  { id: 'clockwise', label: 'Clockwise', icon: <RotateCw size={16} /> },
  { id: 'counter-clockwise', label: 'Counter-Clockwise', icon: <RotateCcw size={16} /> },
];

export function MindmapDirectionSelector() {
  const { 
    mindmapDirection, setMindmapDirection, 
    mode, graph,
    mindmapTheme, setMindmapTheme,
    mindmapShowArrows, setMindmapShowArrows,
    mindmapStrokeWidth, setMindmapStrokeWidth,
    mindmapColorByLevel, setMindmapColorByLevel,
    mindmapSortOrder, setMindmapSortOrder,
    mindmapConnectorStyle, setMindmapConnectorStyle,
    mindmapLayoutMode
  } = useGraph();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'direction' | 'style' | 'order'>('direction');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = DIRECTION_OPTIONS.find(opt => opt.id === mindmapDirection) || DIRECTION_OPTIONS[0];

  const handleDirectionChange = (direction: MindmapLayoutDirection) => {
    setMindmapDirection(direction);
    
    // Apply layout only if nodes are selected or apply to all root nodes
    if (graph && graph.getNodes().length > 0) {
      const selectedCells = graph.getSelectedCells();
      const selectedNodes = selectedCells.filter(cell => cell.isNode());
      
      if (selectedNodes.length > 0) {
        // Apply layout starting from selected node(s)
        selectedNodes.forEach(node => {
          applyMindmapLayout(graph, direction, node, mindmapLayoutMode);
        });
      } else {
        // No selection - apply to entire graph
        applyMindmapLayout(graph, direction, undefined, mindmapLayoutMode);
      }
    }
  };

  const handleSortOrderChange = (sortOrder: MindmapSortOrder) => {
    setMindmapSortOrder(sortOrder);
    // Re-apply layout with new sort order
    if (graph && graph.getNodes().length > 0) {
      applyMindmapLayout(graph, mindmapDirection, undefined, mindmapLayoutMode);
    }
  };

  // Don't show if not in mindmap mode
  if (mode !== 'mindmap') {
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        title="Mindmap Settings"
      >
        <span className="text-gray-600 dark:text-gray-300">{currentOption.icon}</span>
        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium hidden sm:inline">{currentOption.label}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 min-w-[280px] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('direction')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'direction'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Direction
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'style'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Style
            </button>
            <button
              onClick={() => setActiveTab('order')}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === 'order'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Order
            </button>
          </div>
          
          {/* Direction Tab */}
          {activeTab === 'direction' && (
            <div className="py-1">
              {DIRECTION_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleDirectionChange(option.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    mindmapDirection === option.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={mindmapDirection === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>
                    {option.icon}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                  </div>
                  {mindmapDirection === option.id && (
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Style Tab */}
          {activeTab === 'style' && (
            <div className="p-3 space-y-3">
              {/* Theme Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Palette size={12} className="inline mr-1" />
                  Color Theme
                </label>
                <select
                  value={mindmapTheme}
                  onChange={(e) => setMindmapTheme(e.target.value as MindmapThemeName)}
                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"
                >
                  {Object.keys(MINDMAP_THEMES).map(theme => (
                    <option key={theme} value={theme}>
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Color by Level Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mindmapColorByLevel}
                  onChange={(e) => setMindmapColorByLevel(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Color nodes by level</span>
              </label>
              
              {/* Show Arrows Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mindmapShowArrows}
                  onChange={(e) => setMindmapShowArrows(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show arrows on edges</span>
              </label>
              
              {/* Stroke Width */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  <Minus size={12} className="inline mr-1" />
                  Line Thickness: {mindmapStrokeWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={mindmapStrokeWidth}
                  onChange={(e) => setMindmapStrokeWidth(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
              </div>
              
              {/* Line Type / Connector Style */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Line Type
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'smooth', label: 'Curved' },
                    { id: 'orthogonal-rounded', label: 'Rounded' },
                    { id: 'orthogonal-sharp', label: 'Orthogonal' },
                    { id: 'straight', label: 'Straight' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setMindmapConnectorStyle(opt.id as any)}
                      className={`py-1.5 px-2 text-xs rounded border transition-colors ${
                        mindmapConnectorStyle === opt.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Order Tab */}
          {activeTab === 'order' && (
            <div className="py-1">
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                Controls how child nodes are arranged
              </div>
              {SORT_ORDER_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleSortOrderChange(option.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    mindmapSortOrder === option.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={mindmapSortOrder === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}>
                    {option.icon}
                  </span>
                  <span className="text-sm font-medium">{option.label}</span>
                  {mindmapSortOrder === option.id && (
                    <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
