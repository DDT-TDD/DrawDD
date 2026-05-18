import type { Graph } from '@antv/x6';

import type {
  CanvasBackground,
  DiagramCanvasMode,
  DrawddDocument,
  MindmapLayoutDirection,
} from '../types';
import {
  detectImportFormat,
  importFreeMind,
  importFreePlan,
  importFromDrawio,
  importFromJSON,
  importKityMinder,
  importMindManager,
  importVisio,
  importXMind,
  inferDiagramModeFromPageData,
  isDrawddImportDocument,
  mindmapToGraph,
  visioToGraph,
} from './importExport';

export type RecentImportFileType = 'json' | 'xmind' | 'mmap' | 'km' | 'mm' | 'vsdx' | 'drawio' | 'xml';

export interface ElectronOpenedFile {
  success: boolean;
  fileName?: string;
  filePath?: string;
  content?: string;
  contentBase64?: string;
  error?: string;
}

interface ImportedPageData {
  data?: string;
  mode?: DiagramCanvasMode;
}

interface ImportWorkflowOptions {
  graph: Graph;
  setMode: (mode: DiagramCanvasMode) => void;
  setCanvasBackground?: (background: CanvasBackground) => void;
  setShowGrid?: (show: boolean) => void;
  setMindmapDirection?: (direction: MindmapLayoutDirection) => void;
  setTimelineDirection?: (direction: 'horizontal' | 'vertical') => void;
  loadDrawddFile?: (fileData: Record<string, unknown>) => void;
  importToNewTab?: (name: string, importFn: () => void | Promise<void>, filePath?: string) => void;
  updateFileName?: (name: string) => void;
  filePath?: string;
}

export interface ImportWorkflowResult {
  detectedFormat: string;
  displayName: string;
  recentFileType: RecentImportFileType;
  textContent?: string;
}

function isTextBasedImport(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return lowerName.endsWith('.drwdd')
    || lowerName.endsWith('.drawdd.json')
    || lowerName.endsWith('.json')
    || lowerName.endsWith('.km')
    || lowerName.endsWith('.mm')
    || lowerName.endsWith('.drawio')
    || lowerName.endsWith('.xml');
}

export function stripImportedFileName(fileName: string): string {
  if (fileName.endsWith('.drwdd')) {
    return fileName.replace(/\.drwdd$/i, '');
  }

  if (fileName.endsWith('.drawdd.json')) {
    return fileName.replace(/\.drawdd\.json$/i, '');
  }

  return fileName.replace(/\.[^/.]+$/i, '');
}

export function getRecentImportFileType(fileName: string): RecentImportFileType {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.drwdd') || lowerName.endsWith('.drawdd.json') || lowerName.endsWith('.json')) {
    return 'json';
  }

  if (lowerName.endsWith('.xmind')) {
    return 'xmind';
  }

  if (lowerName.endsWith('.mmap')) {
    return 'mmap';
  }

  if (lowerName.endsWith('.km')) {
    return 'km';
  }

  if (lowerName.endsWith('.mm')) {
    return 'mm';
  }

  if (lowerName.endsWith('.vsdx')) {
    return 'vsdx';
  }

  if (lowerName.endsWith('.xml')) {
    return 'xml';
  }

  return 'drawio';
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function fileFromElectronOpenResult(result: ElectronOpenedFile): File {
  const fileName = result.fileName || 'imported-file';

  if (result.contentBase64) {
    const bytes = decodeBase64ToBytes(result.contentBase64);
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return new File([buffer], fileName);
  }

  return new File([result.content || ''], fileName, { type: 'text/plain' });
}

function applyDirectDrawddFallback(
  graph: Graph,
  parsed: Record<string, unknown>,
  options: Pick<ImportWorkflowOptions, 'setMode' | 'setCanvasBackground' | 'setShowGrid' | 'setMindmapDirection' | 'setTimelineDirection' | 'updateFileName'>,
  displayName: string,
): void {
  const pages = Array.isArray(parsed.pages) ? parsed.pages as ImportedPageData[] : null;

  if (pages && pages.length > 0) {
    const firstPage = pages[0];
    if (typeof firstPage?.data === 'string') {
      options.setMode(inferDiagramModeFromPageData(firstPage.data, firstPage.mode));
      graph.fromJSON(JSON.parse(firstPage.data) as object);
    }
  } else if (isDrawddImportDocument(parsed)) {
    importFromJSON(graph, parsed as unknown as DrawddDocument, {
      setMode: options.setMode,
      setCanvasBackground: options.setCanvasBackground,
      setShowGrid: options.setShowGrid,
      setMindmapDirection: options.setMindmapDirection,
      setTimelineDirection: options.setTimelineDirection,
    });
  }

  options.updateFileName?.(displayName);
}

export async function importFileWithWorkflow(file: File, options: ImportWorkflowOptions): Promise<ImportWorkflowResult> {
  const displayName = stripImportedFileName(file.name);
  const textContent = isTextBasedImport(file.name) ? await file.text() : undefined;
  const detectedFormat = detectImportFormat(file.name, textContent);

  if (!detectedFormat) {
    throw new Error('Unsupported file format. Supported: .drwdd, .json, .xmind, .mmap, .km, .mm, .vsdx, .drawio, .xml');
  }

  switch (detectedFormat) {
    case 'drawdd': {
      const parsed = JSON.parse(textContent || '{}') as Record<string, unknown>;
      parsed.name = displayName;

      if (options.filePath) {
        parsed.filePath = options.filePath;
      }

      if (options.loadDrawddFile) {
        options.loadDrawddFile(parsed);
      } else {
        applyDirectDrawddFallback(options.graph, parsed, options, displayName);
      }
      break;
    }

    case 'xmind': {
      const mindmap = await importXMind(file);
      if (options.importToNewTab) {
        options.importToNewTab(displayName, () => { mindmapToGraph(options.graph, mindmap); }, options.filePath);
      } else {
        mindmapToGraph(options.graph, mindmap);
        options.updateFileName?.(displayName);
      }
      options.setMode('mindmap');
      break;
    }

    case 'mindmanager': {
      const mindmap = await importMindManager(file);
      if (options.importToNewTab) {
        options.importToNewTab(displayName, () => { mindmapToGraph(options.graph, mindmap); }, options.filePath);
      } else {
        mindmapToGraph(options.graph, mindmap);
        options.updateFileName?.(displayName);
      }
      options.setMode('mindmap');
      break;
    }

    case 'kityminder': {
      const mindmap = await importKityMinder(file);
      if (options.importToNewTab) {
        options.importToNewTab(displayName, () => { mindmapToGraph(options.graph, mindmap); }, options.filePath);
      } else {
        mindmapToGraph(options.graph, mindmap);
        options.updateFileName?.(displayName);
      }
      options.setMode('mindmap');
      break;
    }

    case 'freemind': {
      const mindmap = await importFreeMind(file);
      if (options.importToNewTab) {
        options.importToNewTab(displayName, () => { mindmapToGraph(options.graph, mindmap); }, options.filePath);
      } else {
        mindmapToGraph(options.graph, mindmap);
        options.updateFileName?.(displayName);
      }
      options.setMode('mindmap');
      break;
    }

    case 'freeplane': {
      const mindmap = await importFreePlan(file);
      if (options.importToNewTab) {
        options.importToNewTab(displayName, () => { mindmapToGraph(options.graph, mindmap); }, options.filePath);
      } else {
        mindmapToGraph(options.graph, mindmap);
        options.updateFileName?.(displayName);
      }
      options.setMode('mindmap');
      break;
    }

    case 'visio': {
      const visioData = await importVisio(file);
      if (options.importToNewTab) {
        options.importToNewTab(displayName, () => { visioToGraph(options.graph, visioData); }, options.filePath);
      } else {
        visioToGraph(options.graph, visioData);
        options.updateFileName?.(displayName);
      }
      options.setMode('flowchart');
      break;
    }

    case 'drawio': {
      if (options.importToNewTab) {
        options.importToNewTab(displayName, async () => {
          await importFromDrawio(file, options.graph);
        }, options.filePath);
      } else {
        await importFromDrawio(file, options.graph);
        options.updateFileName?.(displayName);
      }
      options.setMode('flowchart');
      break;
    }
  }

  return {
    detectedFormat,
    displayName,
    recentFileType: getRecentImportFileType(file.name),
    textContent,
  };
}