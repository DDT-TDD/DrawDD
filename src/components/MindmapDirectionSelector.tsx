import { useGraph } from '../context/GraphContext';
import { 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeftRight,
  Circle,
  ChevronDown 
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { MindmapLayoutDirection } from '../types';
import { applyMindmapLayout } from '../utils/layout';

interface DirectionOption {
  id: MindmapLayoutDirection;
  label: string;
  description: string;
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

export function MindmapDirectionSelector() {
  const { mindmapDirection, setMindmapDirection, mode, graph } = useGraph();
  const [isOpen, setIsOpen] = useState(false);
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
    setIsOpen(false);
    
    // Apply layout only if nodes are selected or apply to all root nodes
    if (graph && graph.getNodes().length > 0) {
      const selectedCells = graph.getSelectedCells();
      const selectedNodes = selectedCells.filter(cell => cell.isNode());
      
      if (selectedNodes.length > 0) {
        // Apply layout starting from selected node(s)
        selectedNodes.forEach(node => {
          applyMindmapLayout(graph, direction, node);
        });
      } else {
        // No selection - apply to entire graph
        applyMindmapLayout(graph, direction);
      }
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
        title="Mindmap Direction"
      >
        <span className="text-gray-600 dark:text-gray-300">{currentOption.icon}</span>
        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium hidden sm:inline">{currentOption.label}</span>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 min-w-[200px] overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Mindmap Direction</div>
          </div>
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
        </div>
      )}
    </div>
  );
}
