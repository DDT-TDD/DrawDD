import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { useGraph } from '../context/GraphContext';
import { useState, useEffect, useRef } from 'react';

export function ZoomControls() {
  const { graph, zoom, setZoom } = useGraph();
  const [inputValue, setInputValue] = useState(String(Math.round(zoom * 100)));
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(Math.round(zoom * 100)));
    }
  }, [zoom, isEditing]);

  const handleZoomIn = () => {
    if (graph) {
      const newZoom = Math.min(zoom * 1.2, 4);
      graph.zoomTo(newZoom);
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (graph) {
      const newZoom = Math.max(zoom / 1.2, 0.2);
      graph.zoomTo(newZoom);
      setZoom(newZoom);
    }
  };

  const handleZoomReset = () => {
    if (graph) {
      graph.zoomTo(1);
      setZoom(1);
    }
  };

  const handleFitContent = () => {
    if (graph) {
      graph.zoomToFit({ padding: 50, maxScale: 2 });
      const newZoom = graph.zoom();
      setZoom(newZoom);
    }
  };

  const zoomPresets = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

  const handlePresetZoom = (preset: number) => {
    if (graph) {
      graph.zoomTo(preset);
      setZoom(preset);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyManualZoom();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(String(Math.round(zoom * 100)));
      inputRef.current?.blur();
    }
  };

  const applyManualZoom = () => {
    const value = parseFloat(inputValue);
    if (!isNaN(value) && value > 0) {
      const newZoom = Math.max(0.1, Math.min(value / 100, 10));
      if (graph) {
        graph.zoomTo(newZoom);
        setZoom(newZoom);
      }
    }
    setIsEditing(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleInputBlur = () => {
    applyManualZoom();
  };

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-40">
      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        title="Zoom Out"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <ZoomOut size={18} />
      </button>

      {/* Zoom Percentage with Manual Input and Presets Dropdown */}
      <div className="relative group">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isEditing ? inputValue : `${Math.round(zoom * 100)}%`}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            title="Type zoom percentage and press Enter"
            className="px-3 py-1.5 w-[70px] text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-center bg-transparent border-0 outline-none cursor-pointer"
          />
        </div>
        <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[100px]">
          {zoomPresets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetZoom(preset)}
              className={`w-full px-4 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                Math.abs(zoom - preset) < 0.01
                  ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {Math.round(preset * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        title="Zoom In"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <ZoomIn size={18} />
      </button>

      <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

      {/* Fit to Content */}
      <button
        onClick={handleFitContent}
        title="Fit to Content"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <Maximize2 size={18} />
      </button>

      {/* Reset View */}
      <button
        onClick={handleZoomReset}
        title="Reset to 100%"
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
