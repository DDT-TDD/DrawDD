import { useRef, useState, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Trash2,
  Download,
  Upload,
  FileJson,
  Image,
  FileCode,
  LayoutGrid,
  GitBranch,
  Save,
  AlignLeft,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  CheckSquare,
  Layout,
  Layers,
  ArrowRightLeft,
  Workflow,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { useGraph } from '../context/GraphContext';
import { exportToJSON, importFromJSON, importXMind, importMindManager, importKityMinder, mindmapToGraph } from '../utils/importExport';
import { DiagramTypeSelector } from './DiagramTypeSelector';
import { MindmapDirectionSelector } from './MindmapDirectionSelector';
import { TimelineDirectionSelector } from './TimelineDirectionSelector';
import { applyTreeLayout, applyFishboneLayout, applyTimelineLayout, type LayoutDirection } from '../utils/layout';
import { applyFlowchartLayout } from '../utils/flowchartLayout';
import { createSwimlanes, SWIMLANE_TEMPLATES } from '../utils/swimlane';
import { labelAllDecisionBranches } from '../utils/decisionLabels';
import type { DrawddDocument } from '../types';

export function Toolbar() {
  const { graph, mode, setMode, zoom, setZoom, canvasBackground, showGrid, mindmapDirection, timelineDirection, mindmapLayoutMode, setCanvasBackground, setShowGrid, setMindmapDirection, setTimelineDirection, setMindmapLayoutMode, exportConnectionPoints, exportGrid, exportCollapseIndicators, flowchartConnectorStyle, setFlowchartConnectorStyle } = useGraph();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectionCount, setSelectionCount] = useState(0);

  // Track selection changes
  useEffect(() => {
    if (!graph) return;

    const updateSelection = () => {
      const cells = graph.getSelectedCells();
      setSelectionCount(cells.length);
    };

    graph.on('selection:changed', updateSelection);
    updateSelection();

    return () => {
      graph.off('selection:changed', updateSelection);
    };
  }, [graph]);

  const handleUndo = () => {
    if (graph?.canUndo()) {
      graph.undo();
    }
  };

  const handleRedo = () => {
    if (graph?.canRedo()) {
      graph.redo();
    }
  };

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

  const handleDelete = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      if (cells.length) {
        // Use setTimeout to avoid React unmount race condition
        setTimeout(() => {
          graph.removeCells(cells);
        }, 0);
      }
    }
  };

  const handleClear = () => {
    if (graph && confirm('Clear all content?')) {
      graph.clearCells();
    }
  };

  const handleExportPNG = async () => {
    if (graph) {
      const container = graph.container as HTMLElement | undefined;
      const shouldHide = !exportConnectionPoints;
      const shouldHideGrid = !exportGrid && showGrid;
      const shouldHideCollapse = !exportCollapseIndicators;

      if (shouldHide && container) container.classList.add('hide-ports');
      if (shouldHideGrid) graph.hideGrid();
      if (shouldHideCollapse && container) container.classList.add('hide-collapse-indicators');

      // Wait a frame for changes to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      graph.toPNG((dataUri: string) => {
        // Convert data URI to blob
        const byteString = atob(dataUri.split(',')[1]);
        const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        saveAs(blob, 'drawdd-export.png');

        // Restore after export
        if (shouldHide && container) container.classList.remove('hide-ports');
        if (shouldHideGrid) graph.showGrid();
        if (shouldHideCollapse && container) container.classList.remove('hide-collapse-indicators');
      }, {
        padding: 20,
        backgroundColor: canvasBackground?.color || '#ffffff',
      });
    }
  };

  const handleExportSVG = async () => {
    if (graph) {
      const container = graph.container as HTMLElement | undefined;
      const shouldHide = !exportConnectionPoints;
      const shouldHideGrid = !exportGrid && showGrid;
      const shouldHideCollapse = !exportCollapseIndicators;

      if (shouldHide && container) container.classList.add('hide-ports');
      if (shouldHideGrid) graph.hideGrid();
      if (shouldHideCollapse && container) container.classList.add('hide-collapse-indicators');

      // Wait a frame for changes to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      graph.toSVG((svgString: string) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, 'drawdd-export.svg');

        // Restore after export
        if (shouldHide && container) container.classList.remove('hide-ports');
        if (shouldHideGrid) graph.showGrid();
        if (shouldHideCollapse && container) container.classList.remove('hide-collapse-indicators');
      });
    }
  };

  const handleExportJSON = () => {
    if (graph) {
      // Get current file with all pages from window global (set by App.tsx)
      const currentFile = (window as any).__currentDiagramFile;
      if (currentFile) {
        // Export entire file structure with all pages
        const blob = new Blob([JSON.stringify(currentFile, null, 2)], { type: 'application/json' });
        saveAs(blob, `${currentFile.name || 'diagram'}.drwdd`);
      } else {
        // Fallback: export just current graph
        const doc = exportToJSON(graph, {
          canvasBackground,
          showGrid,
          mindmapDirection,
          timelineDirection
        });
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
        saveAs(blob, 'drawdd-export.drwdd');
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !graph) return;

    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      // Handle .drwdd and .json the same way (both are JSON format)
      if (ext === 'json' || ext === 'drwdd') {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Check if it's a DiagramFile (has pages) or old DrawddDocument format
        if (parsed.pages && Array.isArray(parsed.pages)) {
          // New format with pages - load first page
          const firstPage = parsed.pages[0];
          if (firstPage?.data) {
            graph.fromJSON(JSON.parse(firstPage.data));
          }
        } else {
          // Old format - direct import
          const doc: DrawddDocument = parsed;
          importFromJSON(graph, doc, {
            setCanvasBackground,
            setShowGrid,
            setMindmapDirection,
            setTimelineDirection
          });
        }
      } else if (ext === 'xmind') {
        const mindmap = await importXMind(file);
        mindmapToGraph(graph, mindmap);
        setMode('mindmap');
      } else if (ext === 'mmap') {
        const mindmap = await importMindManager(file);
        mindmapToGraph(graph, mindmap);
        setMode('mindmap');
      } else if (ext === 'km') {
        const mindmap = await importKityMinder(file);
        mindmapToGraph(graph, mindmap);
        setMode('mindmap');
      } else {
        alert('Unsupported file format. Supported: .drwdd, .json, .xmind, .mmap, .km');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }

    // Reset input
    e.target.value = '';
  };

  const handleLayout = (direction: LayoutDirection) => {
    if (graph) {
      applyTreeLayout(graph, direction);
    }
  };

  const handleFishboneLayout = () => {
    if (graph) {
      applyFishboneLayout(graph);
    }
  };

  const handleTimelineLayout = (orientation: 'horizontal' | 'vertical' = 'horizontal') => {
    if (graph) {
      applyTimelineLayout(graph, orientation);
    }
  };

  // Flowchart-specific features
  const handleAutoLayout = (direction: 'TB' | 'BT' | 'LR' | 'RL' = 'TB') => {
    if (graph) {
      applyFlowchartLayout(graph, { direction, type: 'hierarchical' });
    }
  };

  const handleAddSwimlanes = (templateKey: string) => {
    if (graph) {
      const template = SWIMLANE_TEMPLATES[templateKey as keyof typeof SWIMLANE_TEMPLATES];
      if (template) {
        // Template is just an array of lane configs
        const isVertical = templateKey === 'departments' || templateKey === 'systems';
        createSwimlanes(graph, template, {
          direction: isVertical ? 'horizontal' : 'vertical',
          laneWidth: 200,
          laneHeight: 400
        });
      }
    }
  };

  const handleApplyRouting = (style: 'flowchart' | 'simple' | 'curved' | 'metro' | 'direct') => {
    if (!graph) return;

    // Map toolbar style names to flowchartConnectorStyle values and persist the default
    const styleMap: Record<string, 'rounded' | 'smooth' | 'straight' | 'flowchart'> = {
      flowchart: 'flowchart',
      simple: 'flowchart', // orthogonal sharp = flowchart routing
      curved: 'smooth',
      direct: 'straight',
      metro: 'flowchart',
    };
    const mappedStyle = styleMap[style] || 'rounded';
    setFlowchartConnectorStyle(mappedStyle);
    // Use same logic as PropertiesPanel handleApplyEdgesToAll for consistency
    graph.getEdges().forEach(edge => {
      // Get current source/target to preserve connection points
      const source = edge.getSource();
      const target = edge.getTarget();

      if (style === 'curved') {
        // Smooth curves
        edge.setConnector('smooth');
        edge.setRouter('normal');
      } else if (style === 'flowchart') {
        // Manhattan routing with rounded corners (like Orthogonal-Rounded)
        edge.setConnector({ name: 'rounded', args: { radius: 10 } });
        edge.setRouter({
          name: 'manhattan',
          args: {
            // Preserve connection points by using existing anchors
            startDirections: ['top', 'right', 'bottom', 'left'],
            endDirections: ['top', 'right', 'bottom', 'left'],
          }
        });
      } else if (style === 'simple') {
        // Orthogonal with sharp corners
        edge.setConnector('normal');
        edge.setRouter({
          name: 'manhattan',
          args: {
            startDirections: ['top', 'right', 'bottom', 'left'],
            endDirections: ['top', 'right', 'bottom', 'left'],
          }
        });
      } else if (style === 'metro') {
        // Metro style - 45 degree angles
        edge.setConnector({ name: 'rounded', args: { radius: 8 } });
        edge.setRouter({ name: 'metro' });
      } else {
        // Direct - straight line
        edge.setConnector('normal');
        edge.setRouter('normal');
      }

      // Re-apply source/target to ensure connection points are preserved
      if (source) edge.setSource(source);
      if (target) edge.setTarget(target);
    });
  };

  const handleLabelDecisions = () => {
    if (graph) {
      labelAllDecisionBranches(graph);
    }
  };

  // Alignment functions
  const handleAlignLeft = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 2) return;
    const minX = Math.min(...cells.map(c => c.getBBox().x));
    cells.forEach(c => c.setPosition(minX, c.getBBox().y));
  };

  const handleAlignRight = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 2) return;
    const maxX = Math.max(...cells.map(c => c.getBBox().x + c.getBBox().width));
    cells.forEach(c => c.setPosition(maxX - c.getBBox().width, c.getBBox().y));
  };

  const handleAlignTop = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 2) return;
    const minY = Math.min(...cells.map(c => c.getBBox().y));
    cells.forEach(c => c.setPosition(c.getBBox().x, minY));
  };

  const handleAlignBottom = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 2) return;
    const maxY = Math.max(...cells.map(c => c.getBBox().y + c.getBBox().height));
    cells.forEach(c => c.setPosition(c.getBBox().x, maxY - c.getBBox().height));
  };

  const handleAlignCenterH = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 2) return;
    const boxes = cells.map(c => c.getBBox());
    const avgX = boxes.reduce((sum, b) => sum + b.x + b.width / 2, 0) / boxes.length;
    cells.forEach((c, i) => c.setPosition(avgX - boxes[i].width / 2, boxes[i].y));
  };

  const handleAlignCenterV = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 2) return;
    const boxes = cells.map(c => c.getBBox());
    const avgY = boxes.reduce((sum, b) => sum + b.y + b.height / 2, 0) / boxes.length;
    cells.forEach((c, i) => c.setPosition(boxes[i].x, avgY - boxes[i].height / 2));
  };

  const handleDistributeH = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 3) return;
    const sorted = [...cells].sort((a, b) => a.getBBox().x - b.getBBox().x);
    const first = sorted[0].getBBox();
    const last = sorted[sorted.length - 1].getBBox();
    const totalWidth = last.x + last.width - first.x;
    const totalNodeWidth = sorted.reduce((sum, c) => sum + c.getBBox().width, 0);
    const gap = (totalWidth - totalNodeWidth) / (sorted.length - 1);
    let currentX = first.x;
    sorted.forEach(c => {
      const box = c.getBBox();
      c.setPosition(currentX, box.y);
      currentX += box.width + gap;
    });
  };

  const handleDistributeV = () => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 3) return;
    const sorted = [...cells].sort((a, b) => a.getBBox().y - b.getBBox().y);
    const first = sorted[0].getBBox();
    const last = sorted[sorted.length - 1].getBBox();
    const totalHeight = last.y + last.height - first.y;
    const totalNodeHeight = sorted.reduce((sum, c) => sum + c.getBBox().height, 0);
    const gap = (totalHeight - totalNodeHeight) / (sorted.length - 1);
    let currentY = first.y;
    sorted.forEach(c => {
      const box = c.getBBox();
      c.setPosition(box.x, currentY);
      currentY += box.height + gap;
    });
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* New Diagram Button */}
      <DiagramTypeSelector />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* Mode Toggle */}
      <div className="flex items-center gap-1 mr-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <button
          onClick={() => setMode('flowchart')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'flowchart'
            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          <LayoutGrid size={16} />
          Flowchart
        </button>
        <button
          onClick={() => setMode('mindmap')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'mindmap'
            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          <GitBranch size={16} />
          Mindmap
        </button>
        <button
          onClick={() => setMode('timeline')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'timeline'
            ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
          📅
          Timeline
        </button>
      </div>

      {/* Direction Selectors - mode-specific */}
      {mode === 'mindmap' && <MindmapDirectionSelector />}
      {mode === 'mindmap' && (
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            onClick={() => setMindmapLayoutMode('compact')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mindmapLayoutMode === 'compact'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            title="Compact spacing (tighter gaps)"
          >
            Compact
          </button>
          <button
            onClick={() => setMindmapLayoutMode('standard')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mindmapLayoutMode === 'standard'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            title="Standard spacing"
          >
            Standard
          </button>
          <button
            onClick={() => setMindmapLayoutMode('spacious')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mindmapLayoutMode === 'spacious'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            title="Spacious spacing (wider gaps)"
          >
            Spacious
          </button>
        </div>
      )}
      {mode === 'timeline' && <TimelineDirectionSelector />}

      {(mode === 'mindmap' || mode === 'timeline') && <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />}

      {/* Layout */}
      <div className="relative group">
        <ToolbarButton icon={AlignLeft} title="Auto Layout" onClick={() => handleLayout('LR')} />
        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] z-50">
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tree Layouts</div>
          <button
            onClick={() => handleLayout('LR')}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <GitBranch size={16} className="rotate-90" />
            Left to Right
          </button>
          <button
            onClick={() => handleLayout('RL')}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <GitBranch size={16} className="-rotate-90" />
            Right to Left
          </button>
          <button
            onClick={() => handleLayout('TB')}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <GitBranch size={16} className="rotate-180" />
            Top to Bottom
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Specialized</div>
          <button
            onClick={handleFishboneLayout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            🐟 Fishbone (Ishikawa)
          </button>
          <button
            onClick={() => handleTimelineLayout('horizontal')}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            📅 Timeline (Horizontal)
          </button>
          <button
            onClick={() => handleTimelineLayout('vertical')}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            📅 Timeline (Vertical)
          </button>
        </div>
      </div>

      {/* Alignment */}
      <div className="relative group">
        <ToolbarButton icon={AlignHorizontalJustifyCenter} title="Align & Distribute" onClick={() => { }} />
        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px] z-50">
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Align</div>
          <button
            onClick={handleAlignLeft}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <AlignStartVertical size={16} />
            Align Left
          </button>
          <button
            onClick={handleAlignCenterH}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <AlignHorizontalJustifyCenter size={16} />
            Align Center (H)
          </button>
          <button
            onClick={handleAlignRight}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <AlignEndVertical size={16} />
            Align Right
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
          <button
            onClick={handleAlignTop}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <AlignStartHorizontal size={16} />
            Align Top
          </button>
          <button
            onClick={handleAlignCenterV}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <AlignVerticalJustifyCenter size={16} />
            Align Center (V)
          </button>
          <button
            onClick={handleAlignBottom}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <AlignEndHorizontal size={16} />
            Align Bottom
          </button>
          <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Distribute</div>
          <button
            onClick={handleDistributeH}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ↔️ Distribute Horizontally
          </button>
          <button
            onClick={handleDistributeV}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ↕️ Distribute Vertically
          </button>
        </div>
      </div>

      {/* Flowchart Tools - Only show in flowchart mode */}
      {mode === 'flowchart' && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* Auto-Layout */}
          <div className="relative group">
            <ToolbarButton icon={Layout} title="Auto-Layout Flowchart" onClick={() => handleAutoLayout('TB')} />
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px] z-50">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Auto-Layout Direction</div>
              <button
                onClick={() => handleAutoLayout('TB')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Layout size={16} />
                Top to Bottom
              </button>
              <button
                onClick={() => handleAutoLayout('LR')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Layout size={16} className="rotate-90" />
                Left to Right
              </button>
              <button
                onClick={() => handleAutoLayout('BT')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Layout size={16} className="rotate-180" />
                Bottom to Top
              </button>
              <button
                onClick={() => handleAutoLayout('RL')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Layout size={16} className="-rotate-90" />
                Right to Left
              </button>
            </div>
          </div>

          {/* Swimlanes */}
          <div className="relative group">
            <ToolbarButton icon={Layers} title="Add Swimlanes" onClick={() => { }} />
            <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[200px] z-50">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Swimlane Templates</div>
              <button
                onClick={() => handleAddSwimlanes('departments')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                🏢 Departments (Vertical)
              </button>
              <button
                onClick={() => handleAddSwimlanes('roles')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                👥 Roles (Horizontal)
              </button>
              <button
                onClick={() => handleAddSwimlanes('phases')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                📋 Project Phases (Horizontal)
              </button>
              <button
                onClick={() => handleAddSwimlanes('systems')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                💻 Systems (Vertical)
              </button>
            </div>
          </div>

          {/* Decision Labels */}
          <ToolbarButton icon={Workflow} title="Auto-Label Decision Branches (Yes/No)" onClick={handleLabelDecisions} />
        </>
      )}

      {/* Smart Routing - available in all modes */}
      <div className="relative group">
        <ToolbarButton icon={ArrowRightLeft} title="Default Line Type" onClick={() => handleApplyRouting('flowchart')} />
        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[220px] z-50">
          <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Default Line Type</div>
          {[
            { style: 'flowchart' as const, mapped: 'flowchart', label: '📐 Rounded Orthogonal', desc: 'Manhattan routing with rounded corners' },
            { style: 'simple' as const, mapped: 'flowchart', label: '📏 Sharp Orthogonal', desc: 'Manhattan routing with sharp corners' },
            { style: 'curved' as const, mapped: 'smooth', label: '🌊 Smooth Curves', desc: 'Flowing curved lines' },
            { style: 'metro' as const, mapped: 'flowchart', label: '🚇 Metro Style', desc: '45° angle connections' },
            { style: 'direct' as const, mapped: 'straight', label: '➡️ Direct (Straight)', desc: 'Point-to-point straight lines' },
          ].map((item) => (
            <button
              key={item.style}
              onClick={() => handleApplyRouting(item.style)}
              className={`flex flex-col gap-0.5 w-full px-4 py-2 text-sm transition-colors text-left ${flowchartConnectorStyle === item.mapped && (
                (item.style === 'flowchart' && flowchartConnectorStyle === 'flowchart') ||
                (item.style === 'curved' && flowchartConnectorStyle === 'smooth') ||
                (item.style === 'direct' && flowchartConnectorStyle === 'straight')
              )
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              <span>{item.label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* History */}
      <ToolbarButton icon={Undo2} title="Undo (Ctrl+Z)" onClick={handleUndo} />
      <ToolbarButton icon={Redo2} title="Redo (Ctrl+Y)" onClick={handleRedo} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* Zoom */}
      <ToolbarButton icon={ZoomOut} title="Zoom Out" onClick={handleZoomOut} />
      <button
        onClick={handleZoomReset}
        className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white min-w-[60px]"
        title="Reset Zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolbarButton icon={ZoomIn} title="Zoom In" onClick={handleZoomIn} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* Edit */}
      <ToolbarButton icon={Trash2} title="Delete Selected" onClick={handleDelete} />

      {/* Selection indicator */}
      {selectionCount > 0 && (
        <div className="flex items-center gap-1.5 ml-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          <CheckSquare size={14} />
          <span>{selectionCount} selected</span>
        </div>
      )}

      <div className="flex-1" />

      {/* Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".drwdd,.json,.xmind,.mmap,.km"
        className="hidden"
        onChange={handleFileImport}
      />
      <ToolbarButton icon={Upload} title="Import (DRWDD, JSON, XMind, MindManager)" onClick={handleImportClick} />

      {/* Export */}
      <div className="relative group">
        <ToolbarButton icon={Download} title="Export" onClick={() => { }} />
        <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-50">
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Image size={16} />
            Export as PNG
          </button>
          <button
            onClick={handleExportSVG}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FileCode size={16} />
            Export as SVG
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FileJson size={16} />
            Export as JSON
          </button>
        </div>
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

      {/* Save */}
      <button
        onClick={handleExportJSON}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        <Save size={16} />
        Save
      </button>

      {/* Clear */}
      <button
        onClick={handleClear}
        className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
      >
        Clear All
      </button>
    </div>
  );
}

interface ToolbarButtonProps {
  icon: React.FC<{ size?: number }>;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, title, onClick, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Icon size={18} />
    </button>
  );
}
