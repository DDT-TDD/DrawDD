import { useState, useEffect, useCallback } from 'react';
import { GraphProvider, useGraph } from './context/GraphContext';
import { ThemeProvider } from './context/ThemeContext';
import { Canvas, Toolbar, Sidebar, PropertiesPanel, MenuBar } from './components';
import { TabBar } from './components/TabBar';
import { PageTabBar } from './components/PageTabBar';
import { FindReplace } from './components/FindReplace';
import { SettingsDialog } from './components/SettingsDialog';
import { ExamplesDialog } from './components/ExamplesDialog';
import { AboutDialog } from './components/AboutDialog';
import { NewDiagramDialog } from './components/NewDiagramDialog';
import { HelpDialog } from './components/HelpDialog';
import { APP_VERSION } from './types';
import type { DiagramFile, DiagramPage } from './types';
import { PanelLeftClose, PanelRightClose, PanelLeft, PanelRight } from 'lucide-react';
import { applyTreeLayout, applyFishboneLayout, applyTimelineLayout } from './utils/layout';

// Default page colors
const PAGE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

// Helper to create a new page
const createNewPage = (order: number, name?: string): DiagramPage => ({
  id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  name: name || `Page ${order + 1}`,
  data: '',
  color: PAGE_COLORS[order % PAGE_COLORS.length],
  order
});

// Helper to create a new file
const createNewFile = (name?: string): DiagramFile => {
  const page = createNewPage(0);
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: name || 'Untitled Diagram',
    pages: [page],
    activePageId: page.id,
    isModified: false
  };
};

// Check if running in Electron
const isElectron = !!(window as any).electronAPI?.isElectron;

// Type for Electron API
interface ElectronAPI {
  isElectron: boolean;
  onMenuCommand: (callback: (command: string, arg?: string) => void) => void;
  removeMenuCommandListener: () => void;
}

function AppContent() {
  const { showLeftSidebar, setShowLeftSidebar, showRightSidebar, setShowRightSidebar, graph, zoom, setZoom, showGrid, setShowGrid } = useGraph();
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showNewDiagramDialog, setShowNewDiagramDialog] = useState(false);
  
  // File and Page management
  const [files, setFiles] = useState<DiagramFile[]>(() => [createNewFile()]);
  const [activeFileId, setActiveFileId] = useState(() => files[0]?.id || '');

  // Get current file and page
  const currentFile = files.find(f => f.id === activeFileId);
  const currentPage = currentFile?.pages.find(p => p.id === currentFile.activePageId);

  // Save current page data to state
  const saveCurrentPageData = useCallback(() => {
    if (!graph || !currentFile || !currentPage) return;
    const currentData = JSON.stringify(graph.toJSON());
    setFiles(prev => prev.map(f => 
      f.id === activeFileId 
        ? {
            ...f,
            pages: f.pages.map(p => 
              p.id === f.activePageId 
                ? { ...p, data: currentData }
                : p
            )
          }
        : f
    ));
  }, [graph, activeFileId, currentFile, currentPage]);

  // Load page data into graph
  const loadPageData = useCallback((pageData: string) => {
    if (!graph) return;
    if (pageData) {
      try {
        graph.fromJSON(JSON.parse(pageData));
      } catch (e) {
        console.error('Failed to load page data:', e);
        graph.clearCells();
      }
    } else {
      graph.clearCells();
    }
  }, [graph]);

  // --- FILE OPERATIONS ---
  const handleNewFile = useCallback(() => {
    saveCurrentPageData();
    const newFile = createNewFile();
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    if (graph) graph.clearCells();
  }, [graph, saveCurrentPageData]);

  const handleFileSelect = useCallback((fileId: string) => {
    if (fileId === activeFileId) return;
    saveCurrentPageData();
    setActiveFileId(fileId);
    const targetFile = files.find(f => f.id === fileId);
    if (targetFile) {
      const activePage = targetFile.pages.find(p => p.id === targetFile.activePageId);
      loadPageData(activePage?.data || '');
    }
  }, [activeFileId, files, saveCurrentPageData, loadPageData]);

  const handleFileClose = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file?.isModified) {
      if (!confirm(`Close "${file.name}"? Unsaved changes will be lost.`)) {
        return;
      }
    }
    
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== fileId);
      if (newFiles.length === 0) {
        const newFile = createNewFile();
        return [newFile];
      }
      return newFiles;
    });
    
    if (fileId === activeFileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      if (remainingFiles.length > 0) {
        handleFileSelect(remainingFiles[remainingFiles.length - 1].id);
      } else {
        setActiveFileId('');
        if (graph) graph.clearCells();
      }
    }
  }, [files, activeFileId, graph, handleFileSelect]);

  const handleFileRename = useCallback((fileId: string, newName: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, name: newName } : f
    ));
  }, []);

  // --- PAGE OPERATIONS ---
  const handleNewPage = useCallback(() => {
    if (!currentFile) return;
    saveCurrentPageData();
    const newPage = createNewPage(currentFile.pages.length);
    setFiles(prev => prev.map(f => 
      f.id === activeFileId 
        ? { ...f, pages: [...f.pages, newPage], activePageId: newPage.id, isModified: true }
        : f
    ));
    if (graph) graph.clearCells();
  }, [activeFileId, currentFile, graph, saveCurrentPageData]);

  const handlePageSelect = useCallback((pageId: string) => {
    if (!currentFile || pageId === currentFile.activePageId) return;
    saveCurrentPageData();
    setFiles(prev => prev.map(f => 
      f.id === activeFileId ? { ...f, activePageId: pageId } : f
    ));
    const targetPage = currentFile.pages.find(p => p.id === pageId);
    loadPageData(targetPage?.data || '');
  }, [activeFileId, currentFile, saveCurrentPageData, loadPageData]);

  const handlePageClose = useCallback((pageId: string) => {
    if (!currentFile || currentFile.pages.length <= 1) return;
    
    const pageIndex = currentFile.pages.findIndex(p => p.id === pageId);
    const newPages = currentFile.pages.filter(p => p.id !== pageId);
    
    // If closing active page, switch to adjacent page
    let newActivePageId = currentFile.activePageId;
    if (pageId === currentFile.activePageId) {
      const newIndex = Math.min(pageIndex, newPages.length - 1);
      newActivePageId = newPages[newIndex].id;
    }
    
    setFiles(prev => prev.map(f => 
      f.id === activeFileId 
        ? { ...f, pages: newPages, activePageId: newActivePageId, isModified: true }
        : f
    ));
    
    // Load the new active page if we switched
    if (pageId === currentFile.activePageId) {
      const newActivePage = newPages.find(p => p.id === newActivePageId);
      loadPageData(newActivePage?.data || '');
    }
  }, [activeFileId, currentFile, loadPageData]);

  const handlePageRename = useCallback((pageId: string, newName: string) => {
    setFiles(prev => prev.map(f => 
      f.id === activeFileId
        ? { ...f, pages: f.pages.map(p => p.id === pageId ? { ...p, name: newName } : p), isModified: true }
        : f
    ));
  }, [activeFileId]);

  const handlePageDuplicate = useCallback((pageId: string) => {
    if (!currentFile) return;
    const sourcePage = currentFile.pages.find(p => p.id === pageId);
    if (!sourcePage) return;
    
    saveCurrentPageData();
    const newPage: DiagramPage = {
      ...createNewPage(currentFile.pages.length),
      name: `${sourcePage.name} (Copy)`,
      data: sourcePage.data
    };
    
    setFiles(prev => prev.map(f => 
      f.id === activeFileId
        ? { ...f, pages: [...f.pages, newPage], activePageId: newPage.id, isModified: true }
        : f
    ));
    loadPageData(newPage.data);
  }, [activeFileId, currentFile, saveCurrentPageData, loadPageData]);

  const handlePageColorChange = useCallback((pageId: string, color: string) => {
    setFiles(prev => prev.map(f => 
      f.id === activeFileId
        ? { ...f, pages: f.pages.map(p => p.id === pageId ? { ...p, color } : p) }
        : f
    ));
  }, [activeFileId]);

  // Expose current file to window for export
  useEffect(() => {
    if (currentFile && graph) {
      // Get current graph state
      const currentData = JSON.stringify(graph.toJSON());
      // Create updated file with current page data
      const updatedFile = {
        ...currentFile,
        pages: currentFile.pages.map(p => 
          p.id === currentFile.activePageId 
            ? { ...p, data: currentData }
            : p
        )
      };
      (window as any).__currentDiagramFile = updatedFile;
    }
  }, [currentFile, graph, activeFileId]);

  // Mark file as modified when graph changes
  useEffect(() => {
    if (!graph) return;
    
    const handleChange = () => {
      setFiles(prev => prev.map(f => 
        f.id === activeFileId ? { ...f, isModified: true } : f
      ));
    };
    
    graph.on('cell:added', handleChange);
    graph.on('cell:removed', handleChange);
    graph.on('cell:changed', handleChange);
    
    return () => {
      graph.off('cell:added', handleChange);
      graph.off('cell:removed', handleChange);
      graph.off('cell:changed', handleChange);
    };
  }, [graph, activeFileId]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to open Find
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      // Ctrl+H or Cmd+H to open Find & Replace
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
      }
      // Ctrl+S / Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        (window as any).__drawdd_save?.();
      }
      // Ctrl+Shift+S to save as
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if ((window as any).__drawdd_saveAs) {
          (window as any).__drawdd_saveAs();
        } else {
          (window as any).__drawdd_save?.();
        }
      }
      // F1 for help/about
      if (e.key === 'F1') {
        e.preventDefault();
        setShowAbout(true);
      }
      // Ctrl+, for settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
      // Ctrl+N for new diagram dialog (choose file or page)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'n') {
        e.preventDefault();
        setShowNewDiagramDialog(true);
      }
      // Ctrl+Shift+N for new file directly
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        handleNewFile();
      }
      // Ctrl+T for new page
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        handleNewPage();
      }
      // Ctrl+W to close file
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        handleFileClose(activeFileId);
      }
      // Ctrl+PageDown / Ctrl+PageUp for page navigation
      if ((e.ctrlKey || e.metaKey) && e.key === 'PageDown' && currentFile) {
        e.preventDefault();
        const currentIndex = currentFile.pages.findIndex(p => p.id === currentFile.activePageId);
        if (currentIndex < currentFile.pages.length - 1) {
          handlePageSelect(currentFile.pages[currentIndex + 1].id);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'PageUp' && currentFile) {
        e.preventDefault();
        const currentIndex = currentFile.pages.findIndex(p => p.id === currentFile.activePageId);
        if (currentIndex > 0) {
          handlePageSelect(currentFile.pages[currentIndex - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewFile, handleNewPage, handleFileClose, handlePageSelect, activeFileId, currentFile]);

  // Expose dialog openers and actions to window for MenuBar and Toolbar access
  useEffect(() => {
    (window as any).__drawdd_openSettings = () => setShowSettings(true);
    (window as any).__drawdd_openExamples = () => setShowExamples(true);
    (window as any).__drawdd_openAbout = () => setShowAbout(true);
    (window as any).__drawdd_openFind = () => setShowFindReplace(true);
    (window as any).__drawdd_newFile = handleNewFile;
    (window as any).__drawdd_newPage = handleNewPage;
    // File operations for imports
    (window as any).__drawdd_updateFileName = (name: string) => {
      setFiles(prev => prev.map(f => 
        f.id === activeFileId ? { ...f, name, isModified: false } : f
      ));
    };
    // Mark current file as saved without changing name
    (window as any).__drawdd_markSaved = () => {
      setFiles(prev => prev.map(f => 
        f.id === activeFileId ? { ...f, isModified: false } : f
      ));
    };
    // Get current file name
    (window as any).__drawdd_getFileName = () => {
      const file = files.find(f => f.id === activeFileId);
      return file?.name || 'Untitled Diagram';
    };
    // Load entire file with all pages
    (window as any).__drawdd_loadFile = (fileData: DiagramFile) => {
      // Check if current file is empty/unmodified "Untitled Diagram" - if so, replace it
      const currentFileObj = files.find(f => f.id === activeFileId);
      const shouldReplace = currentFileObj && 
        !currentFileObj.isModified && 
        currentFileObj.name === 'Untitled Diagram' &&
        currentFileObj.pages.length === 1;
      
      // Create new file entry with the imported data
      const newFile: DiagramFile = {
        ...fileData,
        id: shouldReplace ? activeFileId : `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        isModified: false
      };
      
      if (shouldReplace) {
        // Replace the current empty file
        setFiles(prev => prev.map(f => f.id === activeFileId ? newFile : f));
      } else {
        // Add as new file
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(newFile.id);
      }
      
      // Load first page into graph
      if (graph && newFile.pages.length > 0) {
        const firstPage = newFile.pages.find(p => p.id === newFile.activePageId) || newFile.pages[0];
        if (firstPage.data) {
          try {
            graph.fromJSON(JSON.parse(firstPage.data));
          } catch (e) {
            console.error('Failed to load page data:', e);
            graph.clearCells();
          }
        }
      }
    };
    return () => {
      delete (window as any).__drawdd_openSettings;
      delete (window as any).__drawdd_openExamples;
      delete (window as any).__drawdd_openAbout;
      delete (window as any).__drawdd_openFind;
      delete (window as any).__drawdd_newFile;
      delete (window as any).__drawdd_newPage;
      delete (window as any).__drawdd_updateFileName;
      delete (window as any).__drawdd_markSaved;
      delete (window as any).__drawdd_getFileName;
      delete (window as any).__drawdd_loadFile;
    };
  }, [handleNewFile, handleNewPage, activeFileId, graph, files]);

  // Handle Electron menu commands
  useEffect(() => {
    if (!isElectron) return;
    
    const electronAPI = (window as any).electronAPI as ElectronAPI;
    
    electronAPI.onMenuCommand((command: string, arg?: string) => {
      switch (command) {
        case 'new':
          // Show new diagram dialog (choose File or Page)
          setShowNewDiagramDialog(true);
          break;
        case 'new-file':
          handleNewFile();
          break;
        case 'new-page':
          handleNewPage();
          break;
        case 'save':
          // Trigger save through window function
          if ((window as any).__drawdd_save) (window as any).__drawdd_save();
          break;
        case 'export-png':
          if ((window as any).__drawdd_exportPNG) (window as any).__drawdd_exportPNG();
          break;
        case 'export-jpeg':
          if ((window as any).__drawdd_exportJPEG) (window as any).__drawdd_exportJPEG();
          break;
        case 'export-svg':
          if ((window as any).__drawdd_exportSVG) (window as any).__drawdd_exportSVG();
          break;
        case 'export-pdf':
          if ((window as any).__drawdd_exportPDF) (window as any).__drawdd_exportPDF();
          break;
        case 'export-json':
          if ((window as any).__drawdd_exportJSON) (window as any).__drawdd_exportJSON();
          break;
        case 'export-html':
          if ((window as any).__drawdd_exportHTML) (window as any).__drawdd_exportHTML();
          break;
        case 'settings':
          setShowSettings(true);
          break;
        case 'undo':
          if (graph?.canUndo()) graph.undo();
          break;
        case 'redo':
          if (graph?.canRedo()) graph.redo();
          break;
        case 'cut':
        case 'copy':
        case 'paste':
        case 'delete':
          // These are handled by the graph context
          break;
        case 'duplicate':
          if (graph) {
            const cells = graph.getSelectedCells();
            cells.forEach(cell => {
              const clone = cell.clone();
              clone.translate(30, 30);
              graph.addCell(clone);
            });
          }
          break;
        case 'select-all':
          if (graph) {
            const cells = graph.getCells();
            graph.select(cells);
          }
          break;
        case 'find':
          setShowFindReplace(true);
          break;
        case 'zoom-in':
          setZoom(Math.min(zoom + 0.1, 3));
          break;
        case 'zoom-out':
          setZoom(Math.max(zoom - 0.1, 0.1));
          break;
        case 'zoom-reset':
          setZoom(1);
          break;
        case 'fit-to-window':
          if (graph) graph.zoomToFit({ padding: 50 });
          break;
        case 'toggle-grid':
          setShowGrid(!showGrid);
          break;
        case 'toggle-left-sidebar':
          setShowLeftSidebar(!showLeftSidebar);
          break;
        case 'toggle-right-sidebar':
          setShowRightSidebar(!showRightSidebar);
          break;
        case 'layout-tb':
          if (graph) applyTreeLayout(graph, 'TB');
          break;
        case 'layout-lr':
          if (graph) applyTreeLayout(graph, 'LR');
          break;
        case 'layout-bt':
          if (graph) applyTreeLayout(graph, 'BT');
          break;
        case 'layout-rl':
          if (graph) applyTreeLayout(graph, 'RL');
          break;
        case 'layout-fishbone':
          if (graph) applyFishboneLayout(graph);
          break;
        case 'layout-timeline-horizontal':
          if (graph) applyTimelineLayout(graph, 'horizontal');
          break;
        case 'layout-timeline-vertical':
          if (graph) applyTimelineLayout(graph, 'vertical');
          break;
        case 'show-shortcuts':
          // Keyboard shortcuts shown from Help dialog
          setShowHelp(true);
          break;
        case 'show-help':
          setShowHelp(true);
          break;
        case 'show-examples':
          setShowExamples(true);
          break;
        case 'show-about':
          setShowAbout(true);
          break;
        default:
          console.log('Unhandled menu command:', command, arg);
      }
    });
    
    return () => {
      electronAPI.removeMenuCommandListener();
    };
  }, [graph, zoom, showGrid, showLeftSidebar, showRightSidebar, setZoom, setShowGrid, setShowLeftSidebar, setShowRightSidebar]);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Menu Bar - Always visible (native Electron menu is disabled) */}
      <MenuBar 
        onShowSettings={() => setShowSettings(true)}
        onShowExamples={() => setShowExamples(true)}
        onShowAbout={() => setShowAbout(true)}
      />
      
      {/* File Tab Bar (Top) */}
      <TabBar
        files={files}
        activeFileId={activeFileId}
        onFileSelect={handleFileSelect}
        onFileClose={handleFileClose}
        onNewFile={() => setShowNewDiagramDialog(true)}
        onFileRename={handleFileRename}
      />

      {/* Toolbar */}
      <Toolbar />

      {/* Main Content - Sidebars push canvas, not overlay */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div 
          className={`flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out overflow-hidden`}
          style={{ width: showLeftSidebar ? '240px' : '0px' }}
        >
          <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0 w-[240px]">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SHAPES</span>
            <button
              onClick={() => setShowLeftSidebar(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Hide Shapes Panel"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>
          <div className="w-[240px] flex-1 overflow-hidden">
            <Sidebar />
          </div>
        </div>
        
        {/* Left Toggle Button */}
        <button
          className="flex-shrink-0 w-6 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setShowLeftSidebar(!showLeftSidebar)}
          title={showLeftSidebar ? "Hide Shapes Panel" : "Show Shapes Panel"}
        >
          {showLeftSidebar ? <PanelLeftClose size={14} className="text-gray-500" /> : <PanelLeft size={14} className="text-gray-500" />}
        </button>
        
        {/* Canvas - Takes remaining space, properly sized */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
        </div>
        
        {/* Right Toggle Button */}
        <button
          className="flex-shrink-0 w-6 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setShowRightSidebar(!showRightSidebar)}
          title={showRightSidebar ? "Hide Properties Panel" : "Show Properties Panel"}
        >
          {showRightSidebar ? <PanelRightClose size={14} className="text-gray-500" /> : <PanelRight size={14} className="text-gray-500" />}
        </button>
        
        {/* Right Sidebar */}
        <div 
          className={`flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out overflow-hidden`}
          style={{ width: showRightSidebar ? '288px' : '0px' }}
        >
          <div className="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0 w-[288px]">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PROPERTIES</span>
            <button
              onClick={() => setShowRightSidebar(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Hide Properties Panel"
            >
              <PanelRightClose size={16} />
            </button>
          </div>
          <div className="w-[288px] flex-1 overflow-hidden">
            <PropertiesPanel />
          </div>
        </div>
        
        {/* Find & Replace Panel */}
        <FindReplace 
          isOpen={showFindReplace} 
          onClose={() => setShowFindReplace(false)} 
        />
      </div>

      {/* Page Tab Bar (Bottom) */}
      {currentFile && (
        <PageTabBar
          pages={currentFile.pages}
          activePageId={currentFile.activePageId}
          onPageSelect={handlePageSelect}
          onPageClose={handlePageClose}
          onNewPage={handleNewPage}
          onPageRename={handlePageRename}
          onPageDuplicate={handlePageDuplicate}
          onPageColorChange={handlePageColorChange}
        />
      )}

      {/* Footer */}
      <footer className="px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex justify-between items-center text-xs text-[var(--text-muted)]">
        <span>DRAWDD v{APP_VERSION} — Open Source Diagramming Tool</span>
        <span>MIT License</span>
      </footer>
      
      {/* Dialogs */}
      <SettingsDialog isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ExamplesDialog isOpen={showExamples} onClose={() => setShowExamples(false)} />
      <AboutDialog isOpen={showAbout} onClose={() => setShowAbout(false)} />
      <HelpDialog isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <NewDiagramDialog 
        isOpen={showNewDiagramDialog} 
        onClose={() => setShowNewDiagramDialog(false)}
        onNewFile={handleNewFile}
        onNewPage={handleNewPage}
        currentFileName={currentFile?.name || 'Untitled'}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <GraphProvider>
        <AppContent />
      </GraphProvider>
    </ThemeProvider>
  );
}

export default App;
