import { useState } from 'react';
import { 
  X, 
  Palette, 
  Layout, 
  Image as ImageIcon, 
  Grid, 
  Monitor,
  Check,
  Languages
} from 'lucide-react';
import { useGraph } from '../context/GraphContext';
import { COLOR_SCHEMES, getColorScheme } from '../config/colorSchemes';
import type { MindmapLayoutDirection } from '../types';

// Available spellcheck languages
const SPELLCHECK_LANGUAGES = [
  { code: 'en-GB', name: 'English (British)' },
  { code: 'en-US', name: 'English (American)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
];

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { 
    canvasBackground, 
    setCanvasBackground, 
    pageLayout, 
    setPageLayout,
    colorScheme,
    setColorScheme,
    mindmapDirection,
    setMindmapDirection,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    exportGrid,
    setExportGrid,
    graph,
    exportConnectionPoints,
    setExportConnectionPoints,
    spellcheckLanguage,
    setSpellcheckLanguage,
  } = useGraph();

  const [activeTab, setActiveTab] = useState<'canvas' | 'style' | 'mindmap' | 'language'>('canvas');
  const [bgColor, setBgColor] = useState(canvasBackground.color);
  const [bgImageUrl, setBgImageUrl] = useState(canvasBackground.imageUrl || '');

  if (!isOpen) return null;

  const handleApplyBackground = () => {
    if (canvasBackground.type === 'color') {
      setCanvasBackground({ type: 'color', color: bgColor });
    } else {
      setCanvasBackground({ type: 'image', color: bgColor, imageUrl: bgImageUrl });
    }
  };

  const handleApplyColorScheme = (schemeId: string) => {
    setColorScheme(schemeId);
    const scheme = getColorScheme(schemeId);
    
    // Apply to canvas background
    setCanvasBackground({ type: 'color', color: scheme.backgroundColor });
    setBgColor(scheme.backgroundColor);
    
    // Apply to existing nodes if graph exists
    if (graph) {
      const nodes = graph.getNodes();
      nodes.forEach((node, index) => {
        const colorType = index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'secondary' : 'accent';
        const colors = scheme.nodeColors[colorType];
        node.setAttrs({
          body: { fill: colors.fill, stroke: colors.stroke },
          label: { fill: colors.text }
        });
      });
      
      // Apply to edges
      const edges = graph.getEdges();
      edges.forEach((edge) => {
        edge.setAttrs({
          line: { stroke: scheme.lineColor }
        });
      });
    }
  };

  const handleMindmapDirection = (direction: MindmapLayoutDirection) => {
    setMindmapDirection(direction);
    // TODO: Apply layout to existing mindmap
  };

  const backgroundColors = [
    '#f8fafc', '#f1f5f9', '#e2e8f0', // Slate
    '#fef2f2', '#fee2e2', '#fecaca', // Red
    '#fff7ed', '#ffedd5', '#fed7aa', // Orange
    '#fefce8', '#fef9c3', '#fef08a', // Yellow
    '#f0fdf4', '#dcfce7', '#bbf7d0', // Green
    '#ecfeff', '#cffafe', '#a5f3fc', // Cyan
    '#eff6ff', '#dbeafe', '#bfdbfe', // Blue
    '#f5f3ff', '#ede9fe', '#ddd6fe', // Violet
    '#fdf4ff', '#fae8ff', '#f5d0fe', // Fuchsia
    '#ffffff', '#0f172a', '#1e293b', // White & Dark
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'canvas'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Monitor size={16} />
            Canvas
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'style'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Palette size={16} />
            Color Schemes
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'mindmap'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layout size={16} />
            Mindmap Layout
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'language'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Languages size={16} />
            Language
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Canvas Tab */}
          {activeTab === 'canvas' && (
            <div className="space-y-6">
              {/* Page Layout */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Page Layout</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPageLayout('landscape')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      pageLayout === 'landscape'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-16 h-10 border-2 border-current rounded" />
                    <span className="text-sm font-medium">Landscape</span>
                  </button>
                  <button
                    onClick={() => setPageLayout('portrait')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                      pageLayout === 'portrait'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-16 border-2 border-current rounded" />
                    <span className="text-sm font-medium">Portrait</span>
                  </button>
                </div>
              </div>

              {/* Background Type */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Background</h3>
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setCanvasBackground({ ...canvasBackground, type: 'color' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      canvasBackground.type === 'color'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Palette size={16} />
                    Color
                  </button>
                  <button
                    onClick={() => setCanvasBackground({ ...canvasBackground, type: 'image' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      canvasBackground.type === 'image'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <ImageIcon size={16} />
                    Image
                  </button>
                </div>

                {canvasBackground.type === 'color' ? (
                  <div className="grid grid-cols-10 gap-2">
                    {backgroundColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setBgColor(color);
                          setCanvasBackground({ type: 'color', color });
                        }}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                          bgColor === color ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="url"
                      value={bgImageUrl}
                      onChange={(e) => setBgImageUrl(e.target.value)}
                      placeholder="Enter image URL..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleApplyBackground}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Apply Background
                    </button>
                  </div>
                )}
              </div>

              {/* Grid */}
              <div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <Grid size={16} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Show Grid</span>
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-24">Grid Size</span>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={gridSize ?? 10}
                      onChange={(e) => setGridSize?.(Math.max(5, Math.min(100, Number(e.target.value) || 10)))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">px</span>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!exportGrid}
                      onChange={(e) => setExportGrid?.(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Include grid in exports</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Controls PNG/SVG/PDF exports</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export options */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportConnectionPoints}
                    onChange={(e) => setExportConnectionPoints(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Show connection points in exports</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Off by default to avoid port dots; turn on if you need them in PNG/SVG/PDF.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Color Schemes Tab */}
          {activeTab === 'style' && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose a color scheme to apply to all shapes and lines in your diagram.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {COLOR_SCHEMES.map((scheme) => (
                  <button
                    key={scheme.id}
                    onClick={() => handleApplyColorScheme(scheme.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      colorScheme === scheme.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-1">
                      {scheme.preview.map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                      {scheme.name}
                    </span>
                    {colorScheme === scheme.id && (
                      <Check size={16} className="text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mindmap Layout Tab */}
          {activeTab === 'mindmap' && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose how child nodes are arranged around the central topic in mindmaps.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { id: 'right', label: 'Right', icon: '→' },
                  { id: 'left', label: 'Left', icon: '←' },
                  { id: 'both', label: 'Both Sides', icon: '↔' },
                  { id: 'top', label: 'Up', icon: '↑' },
                  { id: 'bottom', label: 'Down', icon: '↓' },
                  { id: 'radial', label: 'Radial', icon: '✺' },
                ] as { id: MindmapLayoutDirection; label: string; icon: string }[]).map((dir) => (
                  <button
                    key={dir.id}
                    onClick={() => handleMindmapDirection(dir.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      mindmapDirection === dir.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-3xl">{dir.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{dir.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select the language for spell checking in text inputs. The browser's native spell checker will be used.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Spell Check Language</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {SPELLCHECK_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSpellcheckLanguage(lang.code)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                          spellcheckLanguage === lang.code
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                          {lang.name}
                        </span>
                        {spellcheckLanguage === lang.code && (
                          <Check size={16} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Note:</strong> Spell checking uses your browser's built-in spell checker. 
                    Make sure the selected language dictionary is installed in your browser/system for best results.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
