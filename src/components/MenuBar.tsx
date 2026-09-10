import { useState, useRef, useEffect } from 'react';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { exportToJSON, exportToDrawioXML, exportToHTML, exportToMarkdown, exportToTextOutline, exportToKityMinder } from '../utils/importExport';
import { fileFromElectronOpenResult, importFileWithWorkflow } from '../utils/fileImportWorkflow';
import { applyTreeLayout, applyFishboneLayout, applyTimelineLayout, type LayoutDirection } from '../utils/layout';
import { getRecentFiles, addRecentFile, clearRecentFiles, cacheRecentFileContent, getCachedFileContent, type RecentFile } from '../utils/recentFiles';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { HelpDialog } from './HelpDialog';
import { VERSION } from '../version';
import type { DiagramFile } from '../types';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: MenuItem[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuBarProps {
  onShowSettings?: () => void;
  onShowExamples?: () => void;
  onShowAbout?: () => void;
}

export function MenuBar({ onShowSettings, onShowExamples, onShowAbout }: MenuBarProps) {
  const {
    graph, mode, setMode, zoom, setZoom, showGrid, setShowGrid,
    showLeftSidebar, setShowLeftSidebar,
    showRightSidebar, setShowRightSidebar,
    canvasBackground, setCanvasBackground,
    mindmapDirection, setMindmapDirection,
    timelineDirection, setTimelineDirection,
    exportConnectionPoints,
    exportGrid,
    exportCollapseIndicators
  } = useGraph();
  const { theme, setTheme } = useTheme();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isElectron = !!(window as any).electronAPI?.isElectron;

  // Load recent files on mount, when menu opens, and when files change
  useEffect(() => {
    setRecentFiles(getRecentFiles());

    const handleRecentFilesChanged = () => {
      setRecentFiles(getRecentFiles());
    };

    window.addEventListener('drawdd:recent-files-changed', handleRecentFilesChanged);
    return () => {
      window.removeEventListener('drawdd:recent-files-changed', handleRecentFilesChanged);
    };
  }, []);

  // Also reload when menu opens
  useEffect(() => {
    if (activeMenu === 'File') {
      setRecentFiles(getRecentFiles());
    }
  }, [activeMenu]);

  interface ElectronAPI {
    isElectron: boolean;
    saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    saveFileAs: (defaultName: string, content: string) => Promise<{ success: boolean; filePath?: string; displayName?: string; canceled?: boolean; error?: string }>;
    openFile?: (filePath: string) => Promise<{ success: boolean; fileName?: string; filePath?: string; content?: string; contentBase64?: string; error?: string }>;
  }

  const electronAPI = isElectron ? (window as any).electronAPI as ElectronAPI : null;

  type DrawddWindow = Window & {
    __currentDiagramFile?: DiagramFile;
    __drawdd_save?: () => void;
    __drawdd_saveAs?: () => void;
    __drawdd_exportPNG?: () => void;
    __drawdd_exportJPEG?: () => void;
    __drawdd_exportSVG?: () => void;
    __drawdd_exportPDF?: () => void;
    __drawdd_exportHTML?: () => void;
    __drawdd_exportJSON?: () => void;
    __drawdd_exportDrawio?: () => void;
    __drawdd_exportKityMinder?: () => void;
    __drawdd_newFile?: () => void;
    __drawdd_newPage?: () => void;
    __drawdd_markSaved?: () => void;
    __drawdd_getFileName?: () => string;
    __drawdd_updateFileName?: (name: string) => void;
    __drawdd_updateFilePath?: (filePath: string) => void;
    __drawdd_getFilePath?: () => string | undefined;
  };

  const drawddWindow = window as DrawddWindow;

  const getExportFilename = (extension: string): string => {
    const currentFile = drawddWindow.__currentDiagramFile;
    let name = currentFile?.name || 'diagram';
    name = name.replace(/\.(drwdd|json|png|svg|jpeg|jpg|pdf|drawio|html|md|txt|km)$/i, '');
    return `${name}.${extension}`;
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ File Operations ============
  const handleOpen = () => {
    fileInputRef.current?.click();
    setActiveMenu(null);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !graph) return;
    // Remove extensions - handle .drwdd, .json and legacy .drawdd.json
    let fileName = file.name;
    if (fileName.endsWith('.drwdd')) {
      fileName = fileName.replace('.drwdd', '');
    } else if (fileName.endsWith('.drawdd.json')) {
      fileName = fileName.replace('.drawdd.json', '');
    } else {
      fileName = fileName.replace(/\.[^/.]+$/, ''); // Remove last extension
    }

    try {
      const result = await importFileWithWorkflow(file, {
        graph,
        setMode,
        setCanvasBackground,
        setShowGrid,
        setMindmapDirection,
        setTimelineDirection,
        loadDrawddFile: (window as any).__drawdd_loadFile,
        importToNewTab: (window as any).__drawdd_importToNewTab,
        updateFileName: (window as any).__drawdd_updateFileName,
      });

      if (result.recentFileType === 'json' && result.textContent) {
        cacheRecentFileContent(file.name, result.textContent);
      }

      // Add to recent files after successful import
      // In Electron, File objects have a .path property with the real filesystem path
      const filePath = (file as any).path as string | undefined;
      addRecentFile({ name: file.name, type: result.recentFileType, ...(filePath ? { path: filePath } : {}) });
      setRecentFiles(getRecentFiles());

    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    e.target.value = '';
  };

  // Handle opening a recent file (for Electron only - web doesn't have file path access)
  const handleOpenRecentFile = async (recentFile: RecentFile) => {
    if (isElectron && (window as any).electronAPI?.openFile && recentFile.path) {
      try {
        // In Electron, we can open by file path
        const result = await (window as any).electronAPI.openFile(recentFile.path);
        if (result.success && graph) {
          const file = fileFromElectronOpenResult(result);
          await importFileWithWorkflow(file, {
            graph,
            setMode,
            setCanvasBackground,
            setShowGrid,
            setMindmapDirection,
            setTimelineDirection,
            loadDrawddFile: (window as any).__drawdd_loadFile,
            importToNewTab: (window as any).__drawdd_importToNewTab,
            updateFileName: (window as any).__drawdd_updateFileName,
            filePath: result.filePath,
          });
        } else if (!result.success) {
          alert(`Failed to open file: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error opening recent file:', error);
        alert('Failed to open file: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      // In web mode, try to load from cached content first
      const cachedContent = getCachedFileContent(recentFile.name);
      if (cachedContent && graph) {
        try {
          const parsed = JSON.parse(cachedContent);
          // Strip file extension for display name
          let fileName = recentFile.name;
          if (fileName.endsWith('.drwdd')) fileName = fileName.replace('.drwdd', '');
          else if (fileName.endsWith('.drawdd.json')) fileName = fileName.replace('.drawdd.json', '');
          else fileName = fileName.replace(/\.[^/.]+$/, '');
          parsed.name = fileName;

          if ((window as any).__drawdd_loadFile) {
            (window as any).__drawdd_loadFile(parsed);
          }
        } catch (error) {
          console.error('Error loading cached file:', error);
          // Fallback: open file picker
          handleOpen();
        }
      } else {
        // No cached content available - open the file picker
        handleOpen();
      }
    }
    setActiveMenu(null);
  };

  const handleClearRecentFiles = () => {
    clearRecentFiles();
    setRecentFiles([]);
    setActiveMenu(null);
  };

  const handleSave = async () => {
    if (graph) {
      // Get fresh graph data
      const currentGraphData = JSON.stringify(graph.toJSON());

      // Get current file structure from window global (set by App.tsx)
      const currentFile = drawddWindow.__currentDiagramFile;
      if (currentFile) {
        const fileName = currentFile.name || 'Untitled Diagram';
        const fileToSave = {
          ...currentFile,
          pages: currentFile.pages.map(p =>
            p.id === currentFile.activePageId
              ? { ...p, data: currentGraphData }
              : p
          )
        };
        const content = JSON.stringify(fileToSave, null, 2);

        if (isElectron && electronAPI) {
          const currentPath = currentFile.filePath || drawddWindow.__drawdd_getFilePath?.();
          if (currentPath && fileName !== 'Untitled Diagram') {
            const result = await electronAPI.saveFile(currentPath, content);
            if (result.success) {
              drawddWindow.__drawdd_markSaved?.();
              // Update recent files to bump timestamp
              addRecentFile({ name: fileName, type: 'json', path: currentPath });
              setRecentFiles(getRecentFiles());
            } else if (result.error) {
              alert('Failed to save file: ' + result.error);
            }
          } else {
            const result = await electronAPI.saveFileAs(`${fileName}.drwdd`, content);
            if (result.success && result.filePath) {
              const displayName = result.displayName || fileName;
              drawddWindow.__drawdd_updateFileName?.(displayName);
              drawddWindow.__drawdd_updateFilePath?.(result.filePath);
              drawddWindow.__drawdd_markSaved?.();
              // Add to recent files with path for Electron
              addRecentFile({ name: displayName, type: 'json', path: result.filePath });
              setRecentFiles(getRecentFiles());
            } else if (!result.canceled && result.error) {
              alert('Failed to save file: ' + result.error);
            }
          }
        } else {
          if (fileName === 'Untitled Diagram') {
            const newName = prompt('Save as:', fileName);
            if (!newName) {
              setActiveMenu(null);
              return;
            }
            fileToSave.name = newName;
            const contentStr = JSON.stringify(fileToSave, null, 2);
            const blob = new Blob([contentStr], { type: 'application/json' });
            saveAs(blob, `${newName}.drwdd`);
            drawddWindow.__drawdd_updateFileName?.(newName);
            cacheRecentFileContent(newName, contentStr);
            addRecentFile({ name: newName, type: 'json' });
            setRecentFiles(getRecentFiles());
          } else {
            const blob = new Blob([content], { type: 'application/json' });
            saveAs(blob, `${fileName}.drwdd`);
            drawddWindow.__drawdd_markSaved?.();
            cacheRecentFileContent(fileName, content);
            addRecentFile({ name: fileName, type: 'json' });
            setRecentFiles(getRecentFiles());
          }
        }
      } else {
        // Fallback: save just current graph (old format)
        const doc = exportToJSON(graph, {
          mode,
          canvasBackground,
          showGrid,
          mindmapDirection,
          timelineDirection
        });
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
        saveAs(blob, 'diagram.drwdd');
      }
    }
    setActiveMenu(null);
  };

  const handleSaveAs = async () => {
    if (graph) {
      // Get fresh graph data
      const currentGraphData = JSON.stringify(graph.toJSON());

      const currentFile = drawddWindow.__currentDiagramFile;
      const currentName = currentFile?.name || drawddWindow.__drawdd_getFileName?.() || 'Untitled Diagram';

      if (isElectron && electronAPI) {
        const fileToSave = currentFile ? {
          ...currentFile,
          pages: currentFile.pages.map(p =>
            p.id === currentFile.activePageId
              ? { ...p, data: currentGraphData }
              : p
          )
        } : null;
        const content = fileToSave
          ? JSON.stringify(fileToSave, null, 2)
          : JSON.stringify(exportToJSON(graph, { mode, canvasBackground, showGrid, mindmapDirection, timelineDirection }), null, 2);
        const result = await electronAPI.saveFileAs(`${currentName}.drwdd`, content);
        if (result.success && result.filePath) {
          const displayName = result.displayName || currentName;
          drawddWindow.__drawdd_updateFileName?.(displayName);
          drawddWindow.__drawdd_updateFilePath?.(result.filePath);
          drawddWindow.__drawdd_markSaved?.();
          // Add to recent files with path
          addRecentFile({ name: displayName, type: 'json', path: result.filePath });
          setRecentFiles(getRecentFiles());
        } else if (!result.canceled && result.error) {
          alert('Failed to save file: ' + result.error);
        }
      } else {
        const newName = prompt('Save as:', currentName);
        if (!newName) {
          setActiveMenu(null);
          return; // User cancelled
        }

        if (currentFile) {
          const fileToSave = {
            ...currentFile,
            name: newName,
            pages: currentFile.pages.map(p =>
              p.id === currentFile.activePageId
                ? { ...p, data: currentGraphData }
                : p
            )
          };
          const contentStr = JSON.stringify(fileToSave, null, 2);
          const blob = new Blob([contentStr], { type: 'application/json' });
          saveAs(blob, `${newName}.drwdd`);
          drawddWindow.__drawdd_updateFileName?.(newName);
          cacheRecentFileContent(newName, contentStr);
          addRecentFile({ name: newName, type: 'json' });
          setRecentFiles(getRecentFiles());
        } else {
          const doc = exportToJSON(graph, {
            mode,
            canvasBackground,
            showGrid,
            mindmapDirection,
            timelineDirection
          });
          const contentStr = JSON.stringify(doc, null, 2);
          const blob = new Blob([contentStr], { type: 'application/json' });
          saveAs(blob, `${newName}.drwdd`);
          drawddWindow.__drawdd_updateFileName?.(newName);
          cacheRecentFileContent(newName, contentStr);
          addRecentFile({ name: newName, type: 'json' });
          setRecentFiles(getRecentFiles());
        }
      }
    }
    setActiveMenu(null);
  };

  const withPortsHidden = async (cb: () => void | Promise<void>) => {
    const container = graph?.container as HTMLElement | undefined;
    const shouldHide = !exportConnectionPoints;
    const shouldHideGrid = !exportGrid && showGrid;
    const shouldHideCollapse = !exportCollapseIndicators;

    if (shouldHide && container) container.classList.add('hide-ports');
    if (shouldHideGrid && graph) graph.hideGrid();
    if (shouldHideCollapse && container) container.classList.add('hide-collapse-indicators');

    // Wait a frame for CSS changes to apply
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await cb();
    } finally {
      if (shouldHide && container) container.classList.remove('hide-ports');
      if (shouldHideGrid && graph) graph.showGrid();
      if (shouldHideCollapse && container) container.classList.remove('hide-collapse-indicators');
    }
  };

  const handleExportPNG = async () => {
    if (graph) {
      try {
        await withPortsHidden(() => {
          // Use X6's built-in toPNG which handles everything
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
            saveAs(blob, getExportFilename('png'));
          }, {
            ratio: '2',
            padding: 20,
            backgroundColor: canvasBackground?.color === 'transparent' ? undefined : (canvasBackground?.color || '#ffffff'),
          });
        });
      } catch (e) {
        console.error('PNG export error:', e);
        alert('Failed to export PNG: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportSVG = async () => {
    if (graph) {
      await withPortsHidden(() => {
        graph.toSVG((svgString: string) => {
          // SVG string is returned directly
          const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          saveAs(blob, getExportFilename('svg'));
        });
      });
    }
    setActiveMenu(null);
  };

  const handleExportJSON = () => {
    if (graph) {
      // Get current file with all pages from window global (set by App.tsx)
      const currentFile = drawddWindow.__currentDiagramFile;
      if (currentFile) {
        // Export entire file structure with all pages
        const blob = new Blob([JSON.stringify(currentFile, null, 2)], { type: 'application/json' });
        saveAs(blob, getExportFilename('json'));
      } else {
        // Fallback: export just current graph
        const doc = exportToJSON(graph, {
          mode,
          canvasBackground,
          showGrid,
          mindmapDirection,
          timelineDirection
        });
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
        saveAs(blob, getExportFilename('json'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportPDF = async () => {
    if (graph) {
      try {
        await withPortsHidden(() => {
          graph.toPNG((dataUri: string) => {
            const img = new window.Image();
            img.onload = () => {
              const pdfScale = 2;
              const logicalW = img.width / pdfScale;
              const logicalH = img.height / pdfScale;
              const isLandscape = logicalW > logicalH;
              const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'px',
                format: [logicalW, logicalH]
              });
              pdf.addImage(dataUri, 'PNG', 0, 0, logicalW, logicalH);
              pdf.save(getExportFilename('pdf'));
            };
            img.src = dataUri;
          }, {
            ratio: '2',
            padding: 20,
            backgroundColor: canvasBackground?.color || '#ffffff',
          });
        });
      } catch (e) {
        console.error('PDF export error:', e);
        alert('Failed to export PDF: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportDrawio = () => {
    if (graph) {
      try {
        const xml = exportToDrawioXML(graph);
        const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
        saveAs(blob, getExportFilename('drawio'));
      } catch (e) {
        console.error('draw.io export error:', e);
        alert('Failed to export draw.io file: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportJPEG = async () => {
    if (graph) {
      try {
        await withPortsHidden(() => {
          graph.toJPEG((dataUri: string) => {
            // Convert data URI to blob
            const byteString = atob(dataUri.split(',')[1]);
            const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            saveAs(blob, getExportFilename('jpg'));
          }, {
            ratio: '2',
            padding: 20,
            backgroundColor: canvasBackground?.color || '#ffffff',
            quality: 0.92,
          });
        });
      } catch (e) {
        console.error('JPEG export error:', e);
        alert('Failed to export JPEG: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportHTML = () => {
    if (graph) {
      try {
        const html = exportToHTML(graph, {
          canvasBackground,
          title: 'DRAWDD Diagram'
        });
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        saveAs(blob, getExportFilename('html'));
      } catch (e) {
        console.error('HTML export error:', e);
        alert('Failed to export HTML: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportMarkdown = () => {
    if (graph) {
      try {
        const markdown = exportToMarkdown(graph);
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, getExportFilename('md'));
      } catch (e) {
        console.error('Markdown export error:', e);
        alert('Failed to export Markdown: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportTextOutline = () => {
    if (graph) {
      try {
        const text = exportToTextOutline(graph);
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, getExportFilename('txt'));
      } catch (e) {
        console.error('Text export error:', e);
        alert('Failed to export text outline: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  const handleExportKityMinder = () => {
    if (graph) {
      try {
        const kmJson = exportToKityMinder(graph);
        const blob = new Blob([kmJson], { type: 'application/json;charset=utf-8' });
        saveAs(blob, getExportFilename('km'));
      } catch (e) {
        console.error('KityMinder export error:', e);
        alert('Failed to export KityMinder file: ' + (e instanceof Error ? e.message : 'Unknown error'));
      }
    }
    setActiveMenu(null);
  };

  // Expose export functions to window for Electron menu access.
  // Note: intentionally no dep array — these handlers capture fresh graph/state
  // closures on every render, ensuring Electron native menus always call the
  // latest version. The pattern is correct; suppress the lint warning locally.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    drawddWindow.__drawdd_save = handleSave;
    drawddWindow.__drawdd_saveAs = handleSaveAs;
    drawddWindow.__drawdd_exportPNG = handleExportPNG;
    drawddWindow.__drawdd_exportJPEG = handleExportJPEG;
    drawddWindow.__drawdd_exportSVG = handleExportSVG;
    drawddWindow.__drawdd_exportPDF = handleExportPDF;
    drawddWindow.__drawdd_exportHTML = handleExportHTML;
    drawddWindow.__drawdd_exportJSON = handleExportJSON;
    drawddWindow.__drawdd_exportDrawio = handleExportDrawio;
    drawddWindow.__drawdd_exportKityMinder = handleExportKityMinder;
    return () => {
      delete drawddWindow.__drawdd_save;
      delete drawddWindow.__drawdd_saveAs;
      delete drawddWindow.__drawdd_exportPNG;
      delete drawddWindow.__drawdd_exportJPEG;
      delete drawddWindow.__drawdd_exportSVG;
      delete drawddWindow.__drawdd_exportPDF;
      delete drawddWindow.__drawdd_exportHTML;
      delete drawddWindow.__drawdd_exportJSON;
      delete drawddWindow.__drawdd_exportDrawio;
      delete drawddWindow.__drawdd_exportKityMinder;
    };
  });

  // ============ Edit Operations ============
  const handleUndo = () => {
    if (graph?.canUndo()) graph.undo();
    setActiveMenu(null);
  };

  const handleRedo = () => {
    if (graph?.canRedo()) graph.redo();
    setActiveMenu(null);
  };

  const handleCut = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      if (cells.length > 0) {
        graph.cut(cells);
      }
    }
    setActiveMenu(null);
  };

  const handleCopy = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      if (cells.length > 0) {
        graph.copy(cells);
      }
    }
    setActiveMenu(null);
  };

  const handlePaste = () => {
    if (graph) {
      graph.paste();
    }
    setActiveMenu(null);
  };

  const handleDuplicate = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      cells.forEach(cell => {
        const clone = cell.clone();
        clone.translate(30, 30);
        graph.addCell(clone);
      });
    }
    setActiveMenu(null);
  };

  const handleSelectAll = () => {
    if (graph) {
      graph.select(graph.getCells());
    }
    setActiveMenu(null);
  };

  const handleDelete = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      if (cells.length > 0) {
        // Use setTimeout to avoid React unmount race condition
        setTimeout(() => {
          graph.removeCells(cells);
        }, 0);
      }
    }
    setActiveMenu(null);
  };

  // ============ View Operations ============
  const handleZoomIn = () => {
    if (graph) {
      const newZoom = Math.min(zoom * 1.2, 4);
      graph.zoom(newZoom / zoom);
      setZoom(newZoom);
    }
    setActiveMenu(null);
  };

  const handleZoomOut = () => {
    if (graph) {
      const newZoom = Math.max(zoom / 1.2, 0.2);
      graph.zoom(newZoom / zoom);
      setZoom(newZoom);
    }
    setActiveMenu(null);
  };

  const handleZoomReset = () => {
    if (graph) {
      graph.zoomTo(1);
      setZoom(1);
    }
    setActiveMenu(null);
  };

  const handleZoomFit = () => {
    if (graph) {
      graph.zoomToFit({ padding: 50 });
      setZoom(graph.zoom());
    }
    setActiveMenu(null);
  };

  const handleCenterContent = () => {
    if (graph) {
      graph.centerContent();
    }
    setActiveMenu(null);
  };

  // ============ Arrange Operations ============
  const handleGroup = () => {
    if (graph) {
      const cells = graph.getSelectedCells().filter(c => c.isNode());
      if (cells.length > 1) {
        const group = graph.createNode({
          shape: 'rect',
          attrs: {
            body: {
              fill: 'transparent',
              stroke: '#999',
              strokeWidth: 1,
              strokeDasharray: '5 5',
            },
          },
        });
        graph.addCell(group);
        cells.forEach(cell => {
          group.addChild(cell);
        });
        graph.select(group);
      }
    }
    setActiveMenu(null);
  };

  const handleUngroup = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      cells.forEach(cell => {
        if (cell.isNode()) {
          const children = cell.getChildren();
          if (children && children.length > 0) {
            children.forEach(child => {
              cell.removeChild(child);
              graph.addCell(child);
            });
            // Use setTimeout to avoid React unmount race condition
            setTimeout(() => {
              graph.removeCell(cell);
            }, 0);
          }
        }
      });
    }
    setActiveMenu(null);
  };

  const handleBringToFront = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      cells.forEach(cell => cell.toFront());
    }
    setActiveMenu(null);
  };

  const handleSendToBack = () => {
    if (graph) {
      const cells = graph.getSelectedCells();
      cells.forEach(cell => cell.toBack());
    }
    setActiveMenu(null);
  };

  const handleLayout = (direction: LayoutDirection) => {
    if (graph) {
      applyTreeLayout(graph, direction);
    }
    setActiveMenu(null);
  };

  const handleFishboneLayout = () => {
    if (graph) {
      applyFishboneLayout(graph);
    }
    setActiveMenu(null);
  };

  const handleTimelineLayout = (orientation: 'horizontal' | 'vertical' = 'horizontal') => {
    if (graph) {
      applyTimelineLayout(graph, orientation);
    }
    setActiveMenu(null);
  };

  // Alignment functions
  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!graph) return;
    const cells = graph.getSelectedCells().filter(c => c.isNode());
    if (cells.length < 2) return;

    // Get the first selected node based on selection order
    const selectionOrder = (graph as any)._selectionOrder || [];
    let refNode = cells[0];
    let minIndex = Infinity;
    cells.forEach(n => {
      const idx = selectionOrder.indexOf(n.id);
      if (idx !== -1 && idx < minIndex) {
        minIndex = idx;
        refNode = n;
      }
    });

    const refBox = refNode.getBBox();

    graph.startBatch('align');
    switch (type) {
      case 'left': {
        cells.forEach(c => {
          if (c.id !== refNode.id) {
            c.setPosition(refBox.x, c.getBBox().y);
          }
        });
        break;
      }
      case 'center': {
        const refCenterX = refBox.x + refBox.width / 2;
        cells.forEach(c => {
          if (c.id !== refNode.id) {
            const box = c.getBBox();
            c.setPosition(refCenterX - box.width / 2, box.y);
          }
        });
        break;
      }
      case 'right': {
        const refRightX = refBox.x + refBox.width;
        cells.forEach(c => {
          if (c.id !== refNode.id) {
            const box = c.getBBox();
            c.setPosition(refRightX - box.width, box.y);
          }
        });
        break;
      }
      case 'top': {
        cells.forEach(c => {
          if (c.id !== refNode.id) {
            c.setPosition(c.getBBox().x, refBox.y);
          }
        });
        break;
      }
      case 'middle': {
        const refCenterY = refBox.y + refBox.height / 2;
        cells.forEach(c => {
          if (c.id !== refNode.id) {
            const box = c.getBBox();
            c.setPosition(box.x, refCenterY - box.height / 2);
          }
        });
        break;
      }
      case 'bottom': {
        const refBottomY = refBox.y + refBox.height;
        cells.forEach(c => {
          if (c.id !== refNode.id) {
            const box = c.getBBox();
            c.setPosition(box.x, refBottomY - box.height);
          }
        });
        break;
      }
    }
    graph.stopBatch('align');
    setActiveMenu(null);
  };

  // ============ Folder Explorer Operations ============
  const handleRefreshAllLinkedBranches = async () => {
    if (!graph) return;

    try {
      // Import required utilities
      const { scanDirectory } = await import('../services/electron');
      const { removeDescendants, generateChildNodes } = await import('../utils/folderExplorer');
      const { applyMindmapLayout } = await import('../utils/layout');

      // Get all nodes in the graph
      const allNodes = graph.getNodes();

      // Filter for linked folder explorer nodes
      const linkedNodes = allNodes.filter(node => {
        const data = node.getData();
        return data?.folderExplorer?.explorerType === 'linked';
      });

      if (linkedNodes.length === 0) {
        alert('No linked folder branches found in the current document.');
        setActiveMenu(null);
        return;
      }

      // Get includeHiddenFiles setting
      const includeHidden = localStorage.getItem('drawdd-include-hidden-files') === 'true';

      // Refresh each linked branch
      let successCount = 0;
      let errorCount = 0;

      for (const node of linkedNodes) {
        const metadata = node.getData().folderExplorer;

        try {
          // Scan the directory
          const scanResult = await scanDirectory(metadata.path, includeHidden);

          if (!scanResult.success || !scanResult.fileTree) {
            console.error(`Failed to refresh ${metadata.path}:`, scanResult.error);
            errorCount++;
            continue;
          }

          // Remove old children
          removeDescendants(graph, node);

          // Generate new children
          generateChildNodes(graph, node, scanResult.fileTree, metadata);

          // Update timestamp
          node.setData({
            ...node.getData(),
            folderExplorer: {
              ...metadata,
              lastRefreshed: new Date().toISOString(),
            },
          });

          successCount++;
        } catch (error) {
          console.error(`Error refreshing ${metadata.path}:`, error);
          errorCount++;
        }
      }

      // Apply layout to the entire graph
      const direction = mindmapDirection || 'right';
      const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'compact' | 'standard' | 'spacious') || 'standard';

      // Find all root nodes and apply layout
      const rootNodes = allNodes.filter(node => {
        const incoming = graph.getIncomingEdges(node);
        return !incoming || incoming.length === 0;
      });

      setTimeout(() => {
        rootNodes.forEach(rootNode => {
          applyMindmapLayout(graph, direction as any, rootNode, layoutMode);
        });
      }, 0);

      // Show result message
      if (errorCount === 0) {
        alert(`Successfully refreshed ${successCount} linked branch${successCount !== 1 ? 'es' : ''}.`);
      } else {
        alert(`Refreshed ${successCount} branch${successCount !== 1 ? 'es' : ''} with ${errorCount} error${errorCount !== 1 ? 's' : ''}.`);
      }

    } catch (error) {
      console.error('Refresh all linked branches error:', error);
      alert(`Failed to refresh branches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setActiveMenu(null);
  };

  // ============ Insert Operations ============
  const handleInsertImage = () => {
    imageInputRef.current?.click();
    setActiveMenu(null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !graph) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        graph.addNode({
          x: 200,
          y: 200,
          width: Math.min(img.width, 400),
          height: Math.min(img.height, 300),
          shape: 'image',
          attrs: {
            image: {
              'xlink:href': dataUrl,
            },
          },
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleInsertText = () => {
    if (graph) {
      graph.addNode({
        x: 200,
        y: 200,
        width: 150,
        height: 40,
        attrs: {
          body: {
            fill: 'transparent',
            stroke: 'transparent',
          },
          label: {
            text: 'Text',
            fill: '#333',
            fontSize: 16,
          },
        },
      });
    }
    setActiveMenu(null);
  };

  // ============ Help Operations ============
  const handleShowShortcuts = () => {
    setShowShortcuts(true);
    setActiveMenu(null);
  };

  // Build recent files submenu dynamically
  const recentFilesSubmenu: MenuItem[] = recentFiles.length > 0
    ? [
      ...recentFiles.map((rf, index) => ({
        label: `${index + 1}. ${rf.name}`,
        action: () => handleOpenRecentFile(rf)
      })),
      { separator: true, label: '' },
      { label: 'Clear Recent Files', action: handleClearRecentFiles }
    ]
    : [{ label: 'No Recent Files', disabled: true }];

  const menus: MenuGroup[] = [
    {
      label: 'File',
      items: [
        { label: 'New File', shortcut: 'Ctrl+Shift+N', action: () => { drawddWindow.__drawdd_newFile?.(); setActiveMenu(null); } },
        { label: 'New Page', shortcut: 'Ctrl+T', action: () => { drawddWindow.__drawdd_newPage?.(); setActiveMenu(null); } },
        { separator: true, label: '' },
        { label: 'Open...', shortcut: 'Ctrl+O', action: handleOpen },
        { label: 'Open Recent', submenu: recentFilesSubmenu },
        { separator: true, label: '' },
        { label: 'Save', shortcut: 'Ctrl+S', action: handleSave },
        { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: handleSaveAs },
        { separator: true, label: '' },
        { label: 'Export as PNG', action: handleExportPNG },
        { label: 'Export as JPEG', action: handleExportJPEG },
        { label: 'Export as HTML', action: handleExportHTML },
        { label: 'Export as SVG', action: handleExportSVG },
        { label: 'Export as PDF', action: handleExportPDF },
        { label: 'Export as JSON', action: handleExportJSON },
        { label: 'Export as draw.io (.drawio)', action: handleExportDrawio },
        { label: 'Export as Markdown', action: handleExportMarkdown },
        { label: 'Export as Text Outline', action: handleExportTextOutline },
        { label: 'Export as KityMinder (.km)', action: handleExportKityMinder },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z', action: handleUndo, disabled: !graph?.canUndo() },
        { label: 'Redo', shortcut: 'Ctrl+Y', action: handleRedo, disabled: !graph?.canRedo() },
        { separator: true, label: '' },
        { label: 'Cut', shortcut: 'Ctrl+X', action: handleCut },
        { label: 'Copy', shortcut: 'Ctrl+C', action: handleCopy },
        { label: 'Paste', shortcut: 'Ctrl+V', action: handlePaste },
        { label: 'Duplicate', shortcut: 'Ctrl+D', action: handleDuplicate },
        { separator: true, label: '' },
        { label: 'Select All', shortcut: 'Ctrl+A', action: handleSelectAll },
        { label: 'Delete', shortcut: 'Del', action: handleDelete },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Zoom In', shortcut: 'Ctrl++', action: handleZoomIn },
        { label: 'Zoom Out', shortcut: 'Ctrl+-', action: handleZoomOut },
        { label: 'Reset Zoom', shortcut: 'Ctrl+0', action: handleZoomReset },
        { label: 'Zoom to Fit', shortcut: 'Ctrl+Shift+F', action: handleZoomFit },
        { separator: true, label: '' },
        { label: `${showGrid ? '✓ ' : ''}Show Grid`, action: () => { setShowGrid(!showGrid); setActiveMenu(null); } },
        { label: 'Center Content', action: handleCenterContent },
        { separator: true, label: '' },
        { label: `${showLeftSidebar ? '✓ ' : ''}Left Sidebar`, action: () => { setShowLeftSidebar(!showLeftSidebar); setActiveMenu(null); } },
        { label: `${showRightSidebar ? '✓ ' : ''}Right Sidebar`, action: () => { setShowRightSidebar(!showRightSidebar); setActiveMenu(null); } },
        { separator: true, label: '' },
        { label: 'Refresh All Linked Branches', action: handleRefreshAllLinkedBranches },
        { separator: true, label: '' },
        { label: `Theme: Light${theme === 'light' ? ' ✓' : ''}`, action: () => { setTheme('light'); setActiveMenu(null); } },
        { label: `Theme: Dark${theme === 'dark' ? ' ✓' : ''}`, action: () => { setTheme('dark'); setActiveMenu(null); } },
        { label: `Theme: System${theme === 'system' ? ' ✓' : ''}`, action: () => { setTheme('system'); setActiveMenu(null); } },
        { separator: true, label: '' },
        { label: 'Settings...', action: () => { onShowSettings?.(); setActiveMenu(null); } },
      ],
    },
    {
      label: 'Insert',
      items: [
        { label: 'Text', action: handleInsertText },
        { label: 'Image...', action: handleInsertImage },
      ],
    },
    {
      label: 'Arrange',
      items: [
        { label: 'Group', shortcut: 'Ctrl+G', action: handleGroup },
        { label: 'Ungroup', shortcut: 'Ctrl+Shift+G', action: handleUngroup },
        { separator: true, label: '' },
        { label: 'Bring to Front', action: handleBringToFront },
        { label: 'Send to Back', action: handleSendToBack },
        { separator: true, label: '' },
        { label: 'Align Left', action: () => handleAlign('left') },
        { label: 'Align Center', action: () => handleAlign('center') },
        { label: 'Align Right', action: () => handleAlign('right') },
        { separator: true, label: '' },
        { label: 'Align Top', action: () => handleAlign('top') },
        { label: 'Align Middle', action: () => handleAlign('middle') },
        { label: 'Align Bottom', action: () => handleAlign('bottom') },
        { separator: true, label: '' },
        { label: 'Auto Layout → Left to Right', action: () => handleLayout('LR') },
        { label: 'Auto Layout → Right to Left', action: () => handleLayout('RL') },
        { label: 'Auto Layout → Top to Bottom', action: () => handleLayout('TB') },
        { label: 'Auto Layout → Bottom to Top', action: () => handleLayout('BT') },
        { separator: true, label: '' },
        { label: '🐟 Fishbone Layout', action: handleFishboneLayout },
        { label: '📅 Timeline (Horizontal)', action: () => handleTimelineLayout('horizontal') },
        { label: '📅 Timeline (Vertical)', action: () => handleTimelineLayout('vertical') },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Documentation', action: () => { setShowHelp(true); setActiveMenu(null); } },
        { label: 'Keyboard Shortcuts', shortcut: 'F1', action: handleShowShortcuts },
        { separator: true, label: '' },
        { label: 'Examples Gallery', action: () => { onShowExamples?.(); setActiveMenu(null); } },
        { separator: true, label: '' },
        { label: 'About DRAWDD', action: () => { onShowAbout?.(); setActiveMenu(null); } },
      ],
    },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".drwdd,.json,.xmind,.mmap,.km,.mm,.vsdx,.drawio,.xml"
        className="hidden"
        onChange={handleFileImport}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Header with Logo - Separate from menu */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center gap-3">
          <img src="./icons/icon.svg" alt="DRAWDD" className="w-7 h-7" />
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">DRAWDD</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">v{VERSION}</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          Mode: <span className="text-blue-600 dark:text-blue-400 capitalize">
            {mode === 'flowchart' ? 'Flowchart' : mode === 'mindmap' ? 'Mind Map' : mode === 'venn' ? 'Venn Diagram' : 'Timeline'}
          </span>
        </div>
      </div>

      {/* Menu Bar - Clean and spacious like draw.io */}
      <nav ref={menuRef} className="flex items-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-sm select-none relative z-[100] h-11 gap-2">
        {menus.map((menu) => (
          <div key={menu.label} className="relative h-full">
            <button
              className={`h-full px-6 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center ${activeMenu === menu.label ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
              onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
            >
              {menu.label}
            </button>

            {activeMenu === menu.label && (
              <div className="absolute left-0 top-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl min-w-[240px] py-2 z-[1000]">
                {menu.items.map((item, index) =>
                  item.separator ? (
                    <div key={index} className="h-px bg-gray-200 dark:bg-gray-600 my-2 mx-4" />
                  ) : item.submenu ? (
                    <div key={index} className="relative group">
                      <button
                        className="w-full px-5 py-2.5 text-left flex items-center justify-between text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white transition-colors"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs">▶</span>
                      </button>
                      <div className="absolute left-full top-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl min-w-[200px] py-2 hidden group-hover:block">
                        {item.submenu.map((subItem, subIndex) =>
                          subItem.separator ? (
                            <div key={subIndex} className="h-px bg-gray-200 dark:bg-gray-600 my-2 mx-4" />
                          ) : (
                            <button
                              key={subIndex}
                              className={`w-full px-5 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white transition-colors ${subItem.disabled ? 'opacity-40 cursor-not-allowed' : ''
                                }`}
                              onClick={() => !subItem.disabled && subItem.action?.()}
                              disabled={subItem.disabled}
                            >
                              {subItem.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      key={index}
                      className={`w-full px-5 py-2.5 text-left flex items-center justify-between text-gray-700 dark:text-gray-200 hover:bg-blue-500 hover:text-white transition-colors ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      onClick={() => !item.disabled && item.action?.()}
                      disabled={item.disabled}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-8">{item.shortcut}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <KeyboardShortcutsDialog isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      )}

      {/* Help Dialog */}
      {showHelp && (
        <HelpDialog isOpen={showHelp} onClose={() => setShowHelp(false)} />
      )}
    </>
  );
}
