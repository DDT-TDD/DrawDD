import { useState, useEffect, useCallback } from 'react';
import { Search, Replace, X, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { useGraph } from '../context/GraphContext';
import type { Node } from '@antv/x6';

interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FindReplace({ isOpen, onClose }: FindReplaceProps) {
  const { graph } = useGraph();
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matches, setMatches] = useState<Node[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Search for matches
  const performSearch = useCallback(() => {
    if (!graph || !searchTerm.trim()) {
      setMatches([]);
      setCurrentIndex(0);
      return;
    }

    const nodes = graph.getNodes();
    const matchingNodes = nodes.filter((node) => {
      const label = node.getAttrs()?.label?.text as string || '';
      if (caseSensitive) {
        return label.includes(searchTerm);
      }
      return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    setMatches(matchingNodes);
    setCurrentIndex(matchingNodes.length > 0 ? 0 : -1);
    
    // Highlight first match
    if (matchingNodes.length > 0) {
      graph.cleanSelection();
      graph.select(matchingNodes[0]);
      graph.centerCell(matchingNodes[0]);
    }
  }, [graph, searchTerm, caseSensitive]);

  // Run search when term changes
  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, caseSensitive, performSearch]);

  // Navigate to next match
  const goToNext = () => {
    if (matches.length === 0) return;
    const nextIndex = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIndex);
    if (graph) {
      graph.cleanSelection();
      graph.select(matches[nextIndex]);
      graph.centerCell(matches[nextIndex]);
    }
  };

  // Navigate to previous match
  const goToPrevious = () => {
    if (matches.length === 0) return;
    const prevIndex = currentIndex === 0 ? matches.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    if (graph) {
      graph.cleanSelection();
      graph.select(matches[prevIndex]);
      graph.centerCell(matches[prevIndex]);
    }
  };

  // Replace current match
  const replaceCurrent = () => {
    if (!graph || matches.length === 0 || currentIndex < 0) return;

    const node = matches[currentIndex];
    const currentLabel = node.getAttrs()?.label?.text as string || '';
    let newLabel: string;
    
    if (caseSensitive) {
      newLabel = currentLabel.replace(searchTerm, replaceTerm);
    } else {
      const regex = new RegExp(escapeRegExp(searchTerm), 'i');
      newLabel = currentLabel.replace(regex, replaceTerm);
    }

    node.setAttrs({ label: { text: newLabel } });
    
    // Re-run search to update matches
    performSearch();
  };

  // Replace all matches
  const replaceAll = () => {
    if (!graph || matches.length === 0) return;

    matches.forEach((node) => {
      const currentLabel = node.getAttrs()?.label?.text as string || '';
      let newLabel: string;
      
      if (caseSensitive) {
        newLabel = currentLabel.split(searchTerm).join(replaceTerm);
      } else {
        const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
        newLabel = currentLabel.replace(regex, replaceTerm);
      }

      node.setAttrs({ label: { text: newLabel } });
    });

    setMatches([]);
    setCurrentIndex(0);
    setSearchTerm('');
  };

  // Escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          goToPrevious();
        } else {
          goToNext();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, matches, currentIndex]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 w-80">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <Search size={16} />
          Find {showReplace && '& Replace'}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowReplace(!showReplace)}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              showReplace ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`}
            title="Toggle Replace"
          >
            <Replace size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Search input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find in diagram..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {matches.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                {currentIndex + 1}/{matches.length}
              </span>
            )}
          </div>
          <button
            onClick={goToPrevious}
            disabled={matches.length === 0}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous (Shift+Enter)"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={goToNext}
            disabled={matches.length === 0}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next (Enter)"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Options */}
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          Case sensitive
        </label>

        {/* Replace section */}
        {showReplace && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replace with..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={replaceCurrent}
                disabled={matches.length === 0}
                className="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Replace
              </button>
              <button
                onClick={replaceAll}
                disabled={matches.length === 0}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={14} />
                Replace All
              </button>
            </div>
          </>
        )}

        {/* Status */}
        {searchTerm && matches.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No matches found</p>
        )}
      </div>
    </div>
  );
}
