import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowDown, ChevronDown } from 'lucide-react';
import { useGraph } from '../context/GraphContext';
import { applyTimelineLayout } from '../utils/layout';

interface DirectionOption {
  id: 'horizontal' | 'vertical';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const DIRECTION_OPTIONS: DirectionOption[] = [
  {
    id: 'horizontal',
    label: 'Horizontal',
    description: 'Left to right timeline',
    icon: <ArrowRight size={18} />,
  },
  {
    id: 'vertical',
    label: 'Vertical',
    description: 'Top to bottom timeline',
    icon: <ArrowDown size={18} />,
  },
];

export function TimelineDirectionSelector() {
  const { graph, timelineDirection, setTimelineDirection } = useGraph();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = DIRECTION_OPTIONS.find(opt => opt.id === timelineDirection) || DIRECTION_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDirectionChange = (direction: 'horizontal' | 'vertical') => {
    setTimelineDirection(direction);
    setIsOpen(false);
    
    // Apply layout with new direction
    if (graph) {
      applyTimelineLayout(graph, direction);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Timeline Direction"
      >
        {currentOption.icon}
        <span>{currentOption.label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50">
          <div className="py-1">
            {DIRECTION_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleDirectionChange(option.id)}
                className={`w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  timelineDirection === option.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className={`mt-0.5 ${timelineDirection === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${timelineDirection === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
                {timelineDirection === option.id && (
                  <div className="mt-1">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
