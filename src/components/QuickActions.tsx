import { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown,
  Lock,
  Unlock,
  Palette
} from 'lucide-react';
import { useGraph } from '../context/GraphContext';
import type { Node } from '@antv/x6';

export function QuickActions() {
  const { graph, selectedCell } = useGraph();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Update position when selection changes
  const updatePosition = useCallback(() => {
    if (!graph) return;
    
    const cells = graph.getSelectedCells();
    if (cells.length === 0) {
      setIsVisible(false);
      return;
    }

    // Get combined bounding box
    const nodes = cells.filter(c => c.isNode()) as Node[];
    if (nodes.length === 0) {
      setIsVisible(false);
      return;
    }

    const container = graph.container;
    if (!container) {
      setIsVisible(false);
      return;
    }

    // Get the bounds of selected nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((node) => {
      const bbox = node.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    });

    // Convert to client coordinates
    const point = graph.localToClient({ x: (minX + maxX) / 2, y: minY });
    const containerRect = container.getBoundingClientRect();
    
    // Position above the selection
    setPosition({
      x: point.x - containerRect.left,
      y: point.y - containerRect.top - 50
    });
    setIsVisible(true);

    // Check if locked
    if (nodes.length === 1) {
      const data = nodes[0].getData();
      setIsLocked(data?.locked || false);
    } else {
      setIsLocked(false);
    }
  }, [graph]);

  // Listen to selection and position changes
  useEffect(() => {
    if (!graph) return;

    const events = [
      'selection:changed',
      'node:moved',
      'node:resized',
      'scale',
      'translate'
    ];

    events.forEach(event => graph.on(event, updatePosition));
    updatePosition();

    return () => {
      events.forEach(event => graph.off(event, updatePosition));
    };
  }, [graph, updatePosition]);

  // Update when selectedCell changes
  useEffect(() => {
    updatePosition();
  }, [selectedCell, updatePosition]);

  // Action handlers
  const handleDelete = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells();
    graph.removeCells(cells);
  };

  const handleDuplicate = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells();
    if (cells.length === 0) return;

    cells.forEach(cell => {
      if (cell.isNode()) {
        const node = cell as Node;
        const bbox = node.getBBox();
        const cloned = node.clone();
        cloned.setPosition(bbox.x + 20, bbox.y + 20);
        graph.addNode(cloned);
      }
    });
  };

  const handleBringToFront = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells();
    cells.forEach(cell => cell.toFront());
  };

  const handleSendToBack = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells();
    cells.forEach(cell => cell.toBack());
  };

  const handleToggleLock = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode()) as Node[];
    if (cells.length === 0) return;

    cells.forEach(cell => {
      const currentData = cell.getData() || {};
      const newLocked = !currentData.locked;
      cell.setData({ ...currentData, locked: newLocked });
      
      // Disable/enable movement
      if (newLocked) {
        cell.setAttrs({ body: { cursor: 'not-allowed' } });
      } else {
        cell.setAttrs({ body: { cursor: 'move' } });
      }
    });
    
    setIsLocked(!isLocked);
  };

  const quickColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleQuickColor = (color: string) => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    cells.forEach(cell => {
      cell.setAttrs({ body: { fill: color } });
    });
  };

  if (!isVisible) return null;

  return (
    <div 
      className="absolute z-50 flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      style={{
        left: position.x,
        top: Math.max(10, position.y),
        transform: 'translateX(-50%)'
      }}
    >
      <button
        onClick={handleDelete}
        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
      
      <button
        onClick={handleDuplicate}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Duplicate"
      >
        <Copy size={16} />
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <button
        onClick={handleBringToFront}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Bring to Front"
      >
        <ArrowUp size={16} />
      </button>

      <button
        onClick={handleSendToBack}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
        title="Send to Back"
      >
        <ArrowDown size={16} />
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      <button
        onClick={handleToggleLock}
        className={`p-1.5 rounded transition-colors ${
          isLocked 
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}
        title={isLocked ? 'Unlock' : 'Lock'}
      >
        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5" />

      {/* Quick color picker */}
      <div className="relative group">
        <button
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          title="Quick Color"
        >
          <Palette size={16} />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:flex gap-1 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          {quickColors.map((color) => (
            <button
              key={color}
              onClick={() => handleQuickColor(color)}
              className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-600 shadow-sm hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
