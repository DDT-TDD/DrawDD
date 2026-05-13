import JSZip from 'jszip';
import type { DrawddDocument, DiagramCanvasMode, XMindSheet, XMindTopic, MindmapNode } from '../types';
import type { Graph, Node } from '@antv/x6';
import { applyMindmapLayout } from './layout';
import { initializeCollapseIndicators } from './collapse';
import { FULL_PORTS_CONFIG } from '../config/shapes';

type SerializedCell = {
  shape?: string;
  data?: {
    isMindmap?: boolean;
    isTimeline?: boolean;
    isVenn?: boolean;
  };
  attrs?: {
    body?: {
      fillOpacity?: number;
    };
  };
};

function inferDiagramModeFromCells(cells: SerializedCell[]): DiagramCanvasMode {
  const nodes = cells.filter((cell) => cell.shape !== 'edge');
  const edges = cells.filter((cell) => cell.shape === 'edge');

  if (nodes.some((node) => node.data?.isMindmap === true)) {
    return 'mindmap';
  }

  if (nodes.some((node) => node.data?.isTimeline === true)) {
    return 'timeline';
  }

  if (nodes.some((node) => node.data?.isVenn === true)) {
    return 'venn';
  }

  const vennCircleCount = nodes.filter((node) => (
    node.shape === 'ellipse'
    && typeof node.attrs?.body?.fillOpacity === 'number'
    && node.attrs.body.fillOpacity > 0
    && node.attrs.body.fillOpacity < 1
  )).length;

  if (vennCircleCount >= 2 && edges.length === 0) {
    return 'venn';
  }

  return 'flowchart';
}

export function getDocumentMode(doc: Pick<DrawddDocument, 'type' | 'nodes' | 'edges'>): DiagramCanvasMode {
  if (doc.type === 'mindmap' || doc.type === 'timeline' || doc.type === 'venn') {
    return doc.type;
  }

  return inferDiagramModeFromCells([...(doc.nodes as SerializedCell[]), ...(doc.edges as SerializedCell[])]);
}

export function inferDiagramModeFromPageData(pageData?: string, fallbackMode?: DiagramCanvasMode): DiagramCanvasMode {
  if (fallbackMode) {
    return fallbackMode;
  }

  if (!pageData) {
    return 'flowchart';
  }

  try {
    const parsed = JSON.parse(pageData) as { cells?: SerializedCell[] };
    return inferDiagramModeFromCells(Array.isArray(parsed.cells) ? parsed.cells : []);
  } catch {
    return 'flowchart';
  }
}

// ============ XMind Import ============

export async function importXMind(file: File): Promise<MindmapNode> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  const fileList = Object.keys(contents.files);
  const findBySuffix = (re: RegExp) => fileList.find((p) => re.test(p));

  // Try XMind 8+ format (content.json)
  let contentPath = findBySuffix(/(^|\/|\\)content\.json$/i);
  let contentFile = contentPath ? contents.file(contentPath) : contents.file('content.json');
  if (contentFile) {
    try {
      const contentText = await contentFile.async('string');
      const parsed = JSON.parse(contentText.replace(/^\uFEFF/, ''));
      const sheets: XMindSheet[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.sheets)
          ? parsed.sheets
          : [];

      const rootTopic = sheets?.[0]?.rootTopic;
      if (rootTopic) {
        return convertXMindTopic(rootTopic);
      }
    } catch (e) {
      console.warn('Failed to parse XMind JSON format:', e);
    }
  }

  // Try legacy XMind format (content.xml)
  contentPath = findBySuffix(/(^|\/|\\)content\.xml$/i);
  contentFile = contentPath ? contents.file(contentPath) : contents.file('content.xml');
  if (contentFile) {
    try {
      const xmlText = await contentFile.async('string');
      return parseXMindXML(xmlText);
    } catch (e) {
      console.warn('Failed to parse XMind XML format:', e);
    }
  }

  // Try manifest.json approach (XMind 2020+)
  const manifestPath = findBySuffix(/(^|\/|\\)manifest\.json$/i);
  const manifestFile = manifestPath ? contents.file(manifestPath) : contents.file('manifest.json');
  if (manifestFile) {
    try {
      const manifestText = await manifestFile.async('string');
      const manifest = JSON.parse(manifestText.replace(/^\uFEFF/, ''));

      // Look for content file in manifest
      const entriesRaw = manifest?.['file-entries'];
      const entries = Array.isArray(entriesRaw)
        ? entriesRaw
        : entriesRaw && typeof entriesRaw === 'object'
          ? Object.values(entriesRaw)
          : [];
      for (const entry of entries as any[]) {
        const fullPath: string | undefined = entry?.['full-path'] || entry?.fullPath;
        if (fullPath && /content\.json$/i.test(fullPath)) {
          const actualContentFile = contents.file(fullPath);
          if (actualContentFile) {
            const contentText = await actualContentFile.async('string');
            const parsed = JSON.parse(contentText.replace(/^\uFEFF/, ''));
            const sheets: XMindSheet[] = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.sheets)
                ? parsed.sheets
                : [];
            const rootTopic = sheets?.[0]?.rootTopic;
            if (rootTopic) return convertXMindTopic(rootTopic);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse XMind manifest:', e);
    }
  }

  // List all files for debugging
  console.log('XMind files found:', fileList);

  // Broad fallback: try to locate any JSON/XML that looks like XMind content
  for (const path of fileList) {
    if (!/\.json$/i.test(path)) continue;
    try {
      const f = contents.file(path);
      if (!f) continue;
      const text = await f.async('string');
      const parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
      const rootTopic = extractRootTopic(parsed);
      if (rootTopic) return convertXMindTopic(rootTopic);
    } catch {
      // ignore and continue
    }
  }

  for (const path of fileList) {
    if (!/\.xml$/i.test(path)) continue;
    try {
      const f = contents.file(path);
      if (!f) continue;
      const text = await f.async('string');
      // Heuristic: try parsing as legacy XMind XML
      const node = parseXMindXML(text);
      if (node) return node;
    } catch {
      // ignore and continue
    }
  }

  throw new Error('Invalid or unsupported XMind file format. Files found: ' + fileList.join(', '));
}

function extractRootTopic(parsed: any): any | null {
  if (!parsed) return null;
  if (Array.isArray(parsed)) {
    if (parsed[0]?.rootTopic) return parsed[0].rootTopic;
    if (parsed[0]?.sheet?.rootTopic) return parsed[0].sheet.rootTopic;
    return null;
  }
  if (Array.isArray(parsed.sheets)) {
    if (parsed.sheets[0]?.rootTopic) return parsed.sheets[0].rootTopic;
  }
  if (parsed.rootTopic) return parsed.rootTopic;
  if (parsed.sheet?.rootTopic) return parsed.sheet.rootTopic;
  if (parsed.content?.rootTopic) return parsed.content.rootTopic;
  return null;
}

function parseXMindXML(xmlText: string): MindmapNode {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Detect parse errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Failed to parse XMind XML content');
  }

  // Find the root topic
  const rootTopic =
    xmlDoc.querySelector('sheet > topic') ||
    xmlDoc.querySelector('sheet topic') ||
    xmlDoc.querySelector('topic');
  if (!rootTopic) {
    throw new Error('No root topic found in XMind XML');
  }

  return convertXMindXMLTopic(rootTopic);
}

function convertXMindXMLTopic(element: Element): MindmapNode {
  const titleElement = element.querySelector(':scope > title');
  const topic = titleElement?.textContent || 'Untitled';

  const node: MindmapNode = {
    id: element.getAttribute('id') || (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
    topic: topic,
    expanded: true,
  };

  // Find children topics
  const childrenContainer = element.querySelector(':scope > children');
  if (childrenContainer) {
    const topics = childrenContainer.querySelectorAll(':scope > topics > topic');
    if (topics.length > 0) {
      node.children = Array.from(topics).map(convertXMindXMLTopic);
    }
  }

  return node;
}

function convertXMindTopic(topic: any): MindmapNode {
  const node: MindmapNode = {
    id: topic?.id || (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
    topic: (typeof topic?.title === 'string'
      ? topic.title
      : typeof topic?.title?.text === 'string'
        ? topic.title.text
        : typeof topic?.topic === 'string'
          ? topic.topic
          : 'Untitled'),
    expanded: true,
  };

  // Extract markers/icons
  if (topic.markers) {
    const markers: string[] = [];
    const markerList = Array.isArray(topic.markers) ? topic.markers : [topic.markers];
    markerList.forEach((marker: any) => {
      if (typeof marker === 'string') {
        markers.push(marker);
      } else if (marker?.markerId) {
        markers.push(marker.markerId);
      }
    });
    if (markers.length > 0) {
      node.markers = markers;
      // Map common XMind markers to emojis
      node.icon = mapXMindMarkerToEmoji(markers[0]);
    }
  }

  // Extract notes
  if (topic.notes) {
    if (typeof topic.notes === 'string') {
      node.note = topic.notes;
    } else if (topic.notes?.plain) {
      node.note = topic.notes.plain;
    } else if (topic.notes?.content) {
      node.note = topic.notes.content;
    }
  }

  // Extract hyperlink
  if (topic.href) {
    node.link = topic.href;
  } else if (topic.hyperlink) {
    node.link = topic.hyperlink;
  }

  // Extract labels (tags)
  if (topic.labels && Array.isArray(topic.labels)) {
    // Store labels in note if present
    const labels = topic.labels.join(', ');
    node.note = node.note ? `${node.note}\n\nLabels: ${labels}` : `Labels: ${labels}`;
  }

  // Extract style information
  if (topic.style) {
    node.style = {
      backgroundColor: topic.style.backgroundColor || topic.style.bgColor,
      textColor: topic.style.color || topic.style.textColor,
      fontSize: topic.style.fontSize,
      bold: topic.style.fontWeight === 'bold' || topic.style.bold === true,
      italic: topic.style.fontStyle === 'italic' || topic.style.italic === true,
    };
  }

  const attached: unknown = topic.children?.attached;
  if (Array.isArray(attached) && attached.length > 0) {
    const first = attached[0] as any;
    // Some XMind variants wrap topics: { topics: XMindTopic[] }
    if (first && Array.isArray(first.topics)) {
      node.children = (attached as any[])
        .flatMap((a) => (Array.isArray(a?.topics) ? a.topics : []))
        .map(convertXMindTopic);
    } else {
      node.children = (attached as XMindTopic[]).map(convertXMindTopic);
    }
  }

  // Other known variants: children.topics or children is an array
  if (!node.children) {
    const topics = topic?.children?.topics;
    if (Array.isArray(topics)) {
      node.children = topics.map(convertXMindTopic);
    } else if (Array.isArray(topic?.children)) {
      node.children = topic.children.map(convertXMindTopic);
    }
  }

  return node;
}

/**
 * Map XMind marker IDs to emoji equivalents
 */
function mapXMindMarkerToEmoji(markerId: string): string {
  const markerMap: Record<string, string> = {
    // Priority markers
    'priority-1': '🔴',
    'priority-2': '🟠',
    'priority-3': '🟡',
    'priority-4': '🟢',
    'priority-5': '🔵',
    // Task markers
    'task-start': '▶️',
    'task-quarter': '◔',
    'task-half': '◑',
    'task-3quar': '◕',
    'task-done': '✅',
    // Flag markers
    'flag-red': '🚩',
    'flag-orange': '🟠',
    'flag-yellow': '🟡',
    'flag-green': '🟢',
    'flag-blue': '🔵',
    'flag-purple': '🟣',
    // Star markers
    'star-red': '⭐',
    'star-orange': '🌟',
    'star-yellow': '✨',
    // Smiley markers
    'smiley-smile': '😊',
    'smiley-laugh': '😁',
    'smiley-angry': '😠',
    'smiley-cry': '😢',
    'smiley-surprise': '😲',
    // Arrow markers
    'arrow-up': '⬆️',
    'arrow-down': '⬇️',
    'arrow-left': '⬅️',
    'arrow-right': '➡️',
    // Symbol markers
    'symbol-plus': '➕',
    'symbol-minus': '➖',
    'symbol-question': '❓',
    'symbol-attention': '⚠️',
    'symbol-exclamation': '❗',
    // Month markers
    'month-jan': '1️⃣',
    'month-feb': '2️⃣',
    'month-mar': '3️⃣',
    'month-apr': '4️⃣',
    'month-may': '5️⃣',
    'month-jun': '6️⃣',
    'month-jul': '7️⃣',
    'month-aug': '8️⃣',
    'month-sep': '9️⃣',
    'month-oct': '🔟',
    'month-nov': '1️⃣1️⃣',
    'month-dec': '1️⃣2️⃣',
  };

  return markerMap[markerId] || '📌';
}

// ============ MindManager Import ============

export async function importMindManager(file: File): Promise<MindmapNode> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  // MindManager uses Document.xml
  const documentFile = contents.file('Document.xml');
  if (!documentFile) {
    throw new Error('Invalid MindManager file: Document.xml not found');
  }

  const xmlText = await documentFile.async('string');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Find the central topic
  const centralTopic = xmlDoc.querySelector('OneTopic > Topic');
  if (!centralTopic) {
    throw new Error('No central topic found in MindManager file');
  }

  return convertMindManagerNode(centralTopic);
}

function convertMindManagerNode(element: Element): MindmapNode {
  const textElement = element.querySelector(':scope > Text');
  const topic = textElement?.getAttribute('PlainText') || 'Untitled';

  const node: MindmapNode = {
    id: element.getAttribute('OId') || crypto.randomUUID(),
    topic: topic,
    expanded: true,
  };

  const subTopics = element.querySelectorAll(':scope > SubTopics > Topic');
  if (subTopics.length > 0) {
    node.children = Array.from(subTopics).map(convertMindManagerNode);
  }

  return node;
}

// ============ JSON Import/Export ============

export function exportToJSON(
  graph: Graph,
  settings?: {
    mode?: DiagramCanvasMode;
    canvasBackground?: { type: 'color' | 'image'; color: string; imageUrl?: string };
    showGrid?: boolean;
    mindmapDirection?: 'right' | 'left' | 'both' | 'top' | 'bottom' | 'radial';
    timelineDirection?: 'horizontal' | 'vertical';
  }
): DrawddDocument {
  const cells = graph.toJSON();
  const serializedCells = (cells.cells || []) as SerializedCell[];
  const nodes = cells.cells?.filter((c: { shape?: string }) => c.shape !== 'edge') || [];
  const edges = cells.cells?.filter((c: { shape?: string }) => c.shape === 'edge') || [];

  return {
    version: '1.0.0',
    type: settings?.mode ?? inferDiagramModeFromCells(serializedCells),
    nodes,
    edges,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    settings: settings ? {
      canvasBackground: settings.canvasBackground,
      showGrid: settings.showGrid,
      mindmapDirection: settings.mindmapDirection,
      timelineDirection: settings.timelineDirection,
    } : undefined,
  };
}

export function importFromJSON(
  graph: Graph,
  doc: DrawddDocument,
  callbacks?: {
    setMode?: (mode: DiagramCanvasMode) => void;
    setCanvasBackground?: (bg: { type: 'color' | 'image'; color: string; imageUrl?: string }) => void;
    setShowGrid?: (show: boolean) => void;
    setMindmapDirection?: (direction: 'right' | 'left' | 'both' | 'top' | 'bottom' | 'radial') => void;
    setTimelineDirection?: (direction: 'horizontal' | 'vertical') => void;
  }
): void {
  callbacks?.setMode?.(getDocumentMode(doc));
  graph.clearCells();

  const cells = [...doc.nodes, ...doc.edges];
  graph.fromJSON({ cells });

  // CRITICAL FIX: Ensure all nodes are visible by default after loading
  // This fixes the issue where nodes beyond level 2 disappear
  graph.getNodes().forEach(node => {
    // Force all nodes to be visible initially
    node.setVisible(true);
  });

  graph.getEdges().forEach(edge => {
    edge.setVisible(true);
  });

  // Initialize collapse indicators for imported nodes
  initializeCollapseIndicators(graph);

  // Restore image URLs and decorations from node data
  graph.getNodes().forEach(node => {
    const data = node.getData() as any;

    // Restore image URL
    if (data?.imageUrl && node.shape === 'image') {
      node.setAttrs({
        image: { xlinkHref: data.imageUrl }
      });
    }

    // Restore emoji decorations in label
    if (data?.prefixDecoration || data?.suffixDecoration) {
      const currentLabel = node.getAttrs().label?.text as string || '';
      // Remove any existing decorations
      const baseLabel = String(currentLabel)
        .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]+ /gu, '')
        .replace(/^[🔢#@★⭐🚩🏳️🏴🏁⚑✅❌⚠️💡🎯📌🚀💎🏆]+\s*/g, '')
        .replace(/ [\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]+$/gu, '')
        .replace(/\s+[🚩🏁🏳️🏴⚑✓×⭐🌟💫✨🔆🌠⚡]+$/g, '');
      const newLabel = `${data.prefixDecoration || ''}${data.prefixDecoration ? ' ' : ''}${baseLabel}${data.suffixDecoration ? ' ' : ''}${data.suffixDecoration || ''}`;
      node.setAttrs({
        label: { text: newLabel }
      });
    }
  });

  // Restore settings if provided
  if (doc.settings) {
    if (doc.settings.canvasBackground && callbacks?.setCanvasBackground) {
      callbacks.setCanvasBackground(doc.settings.canvasBackground);
      // Apply background to graph
      graph.drawBackground({ color: doc.settings.canvasBackground.color });
    }
    if (doc.settings.showGrid !== undefined && callbacks?.setShowGrid) {
      callbacks.setShowGrid(doc.settings.showGrid);
      // Apply grid to graph
      if (doc.settings.showGrid) {
        graph.drawGrid();
      } else {
        graph.clearGrid();
      }
    }
    if (doc.settings.mindmapDirection && callbacks?.setMindmapDirection) {
      callbacks.setMindmapDirection(doc.settings.mindmapDirection);
    }
    if (doc.settings.timelineDirection && callbacks?.setTimelineDirection) {
      callbacks.setTimelineDirection(doc.settings.timelineDirection);
    }
  }

  normalizeMindmapAfterImport(graph);
}

function normalizeMindmapAfterImport(graph: Graph) {
  const mindmapNodes = graph.getNodes().filter((n) => (n.getData() as any)?.isMindmap === true);
  if (mindmapNodes.length === 0) return;

  const createMindmapPorts = () => ({
    groups: {
      left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
    },
    items: [
      { group: 'left', id: 'left' },
      { group: 'right', id: 'right' },
      { group: 'top', id: 'top' },
      { group: 'bottom', id: 'bottom' },
    ],
  });

  // Ensure ports exist on mindmap nodes (older files may not have them)
  for (const node of mindmapNodes) {
    const ports = (node as any).getPorts?.();
    if (!ports || ports.length === 0) {
      (node as any).prop?.('ports', createMindmapPorts());
    }
  }

  // Ensure mindmap edges attach to ports (point connections)
  for (const edge of graph.getEdges()) {
    const s = edge.getSource() as any;
    const t = edge.getTarget() as any;
    const sCell = s?.cell;
    const tCell = t?.cell;
    if (!sCell || !tCell) continue;

    const sNode = graph.getCellById(sCell) as any;
    const tNode = graph.getCellById(tCell) as any;
    const sIsMindmap = sNode?.isNode?.() && (sNode.getData?.() as any)?.isMindmap === true;
    const tIsMindmap = tNode?.isNode?.() && (tNode.getData?.() as any)?.isMindmap === true;
    if (!sIsMindmap || !tIsMindmap) continue;

    if (!s.port || !t.port) {
      const sb = sNode.getBBox();
      const tb = tNode.getBBox();
      const dx = (tb.x + tb.width / 2) - (sb.x + sb.width / 2);
      const dy = (tb.y + tb.height / 2) - (sb.y + sb.height / 2);
      if (Math.abs(dx) >= Math.abs(dy)) {
        edge.setSource({ cell: sCell, port: dx >= 0 ? 'right' : 'left' });
        edge.setTarget({ cell: tCell, port: dx >= 0 ? 'left' : 'right' });
      } else {
        edge.setSource({ cell: sCell, port: dy >= 0 ? 'bottom' : 'top' });
        edge.setTarget({ cell: tCell, port: dy >= 0 ? 'top' : 'bottom' });
      }
    }

    // Avoid manhattan detours on mindmaps (older saves)
    const router = (edge as any).getRouter?.();
    if (!router || router?.name === 'manhattan') {
      (edge as any).setRouter?.({ name: 'normal' });
    }
  }
}

// ============ Mindmap to Graph Conversion ============

export function mindmapToGraph(graph: Graph, root: MindmapNode): void {
  graph.clearCells();

  const createMindmapPorts = () => ({
    groups: {
      left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
    },
    items: [
      { group: 'left', id: 'left' },
      { group: 'right', id: 'right' },
      { group: 'top', id: 'top' },
      { group: 'bottom', id: 'bottom' },
    ],
  });

  const orderRef = { value: 1 };

  // Create root node at origin with imported styling
  const rootAttrs: any = {
    body: {
      fill: root.style?.backgroundColor || '#1976d2',
      stroke: '#0d47a1',
      strokeWidth: 2,
      rx: 10,
      ry: 10,
    },
    label: {
      text: root.icon ? `${root.icon} ${root.topic}` : root.topic,
      fill: root.style?.textColor || '#ffffff',
      fontSize: root.style?.fontSize || 16,
      fontWeight: root.style?.bold ? 'bold' : 'normal',
      fontStyle: root.style?.italic ? 'italic' : 'normal',
    },
  };

  const rootData: any = {
    isMindmap: true,
    level: 0,
    mmOrder: orderRef.value++
  };

  // Add metadata to root node data
  if (root.note) rootData.note = root.note;
  if (root.link) rootData.link = root.link;
  if (root.markers) rootData.markers = root.markers;
  if (root.priority) rootData.priority = root.priority;
  if (root.progress) rootData.progress = root.progress;

  const rootNode = graph.addNode({
    id: root.id,
    x: 0,
    y: 0,
    width: 160,
    height: 80,
    attrs: rootAttrs,
    data: rootData,
    ports: createMindmapPorts(),
  });

  // Create all children nodes and edges (recursively)
  if (root.children) {
    createMindmapNodes(graph, rootNode.id, root.children, 1, orderRef);
  }

  // Apply proper layout to prevent overlap
  const layoutMode = (localStorage.getItem('drawdd-mindmap-layout-mode') as 'standard' | 'compact') || 'standard';
  applyMindmapLayout(graph, 'both', rootNode, layoutMode);

  // Force view reset to ensure content is visible
  // Use a dual-step approach to ensure X6 internal loop updates bbox
  setTimeout(() => {
    graph.zoom(1);
    graph.centerContent();
    requestAnimationFrame(() => {
      graph.zoomToFit({ padding: 40, maxScale: 1.5 });
    });
  }, 50);
}

function createMindmapNodes(
  graph: Graph,
  parentId: string,
  children: MindmapNode[],
  level: number,
  orderRef: { value: number }
): void {
  const createMindmapPorts = () => ({
    groups: {
      left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
    },
    items: [
      { group: 'left', id: 'left' },
      { group: 'right', id: 'right' },
      { group: 'top', id: 'top' },
      { group: 'bottom', id: 'bottom' },
    ],
  });

  const colors = [
    { fill: '#42a5f5', stroke: '#1e88e5' },
    { fill: '#66bb6a', stroke: '#43a047' },
    { fill: '#ffa726', stroke: '#fb8c00' },
    { fill: '#ab47bc', stroke: '#8e24aa' },
    { fill: '#26c6da', stroke: '#00acc1' },
  ];

  children.forEach((child, index) => {
    const color = colors[index % colors.length];
    const width = Math.max(100, 140 - level * 20);
    const height = Math.max(35, 50 - level * 5);

    // Apply imported styling if available
    const nodeAttrs: any = {
      body: {
        fill: child.style?.backgroundColor || color.fill,
        stroke: child.style?.textColor || color.stroke,
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: child.icon ? `${child.icon} ${child.topic}` : child.topic,
        fill: child.style?.textColor || (level > 1 ? '#333333' : '#ffffff'),
        fontSize: child.style?.fontSize || Math.max(11, 14 - level),
        fontWeight: child.style?.bold ? 'bold' : 'normal',
        fontStyle: child.style?.italic ? 'italic' : 'normal',
      },
    };

    const nodeData: any = {
      isMindmap: true,
      level,
      mmOrder: orderRef.value++
    };

    // Add metadata to node data
    if (child.note) nodeData.note = child.note;
    if (child.link) nodeData.link = child.link;
    if (child.markers) nodeData.markers = child.markers;
    if (child.priority) nodeData.priority = child.priority;
    if (child.progress) nodeData.progress = child.progress;

    // Create node at (0,0) - layout will position it
    const node = graph.addNode({
      id: child.id,
      x: 0,
      y: 0,
      width,
      height,
      attrs: nodeAttrs,
      data: nodeData,
      ports: createMindmapPorts(),
    });

    // Add edge from parent with straight connector to reduce overlap
    graph.addEdge({
      source: parentId,
      target: node.id,
      attrs: {
        line: {
          stroke: color.stroke,
          strokeWidth: 2,
          targetMarker: null,
        },
      },
      connector: { name: 'normal' },
      router: { name: 'normal' },
    });

    // Recursively create grandchildren
    if (child.children && child.children.length > 0) {
      createMindmapNodes(graph, node.id, child.children, level + 1, orderRef);
    }
  });
}

// ============ KityMinder Import ============

interface KityMinderNode {
  data: {
    id?: string;
    text?: string;
    created?: number;
    expandState?: string;
    priority?: number;
    progress?: number;
    note?: string;
    hyperlink?: string;
    image?: string;
    resource?: string[];
    [key: string]: unknown;
  };
  children?: KityMinderNode[];
}

interface KityMinderData {
  root: KityMinderNode;
  template?: string;
  theme?: string;
  version?: string;
}

export async function importKityMinder(file: File): Promise<MindmapNode> {
  const text = await file.text();

  try {
    const data: KityMinderData = JSON.parse(text);

    if (!data.root) {
      throw new Error('Invalid KityMinder file: no root node found');
    }

    return convertKityMinderNode(data.root);
  } catch (e) {
    console.error('KityMinder parse error:', e);
    throw new Error('Failed to parse KityMinder file. Make sure it is a valid .km JSON file.');
  }
}

function convertKityMinderNode(node: KityMinderNode): MindmapNode {
  const result: MindmapNode = {
    id: node.data?.id || crypto.randomUUID(),
    topic: node.data?.text || 'Untitled',
    expanded: node.data?.expandState !== 'collapse',
  };

  // Preserve note
  if (node.data?.note) {
    result.note = node.data.note;
  }

  // Map hyperlink → link
  if (node.data?.hyperlink) {
    result.link = node.data.hyperlink;
  }

  // Preserve priority (KityMinder uses 1-9)
  if (node.data?.priority) {
    result.priority = node.data.priority;
  }

  // Preserve progress (KityMinder uses 0-9 scale, map to percentage)
  if (node.data?.progress !== undefined && node.data.progress !== null) {
    // KityMinder progress: 0=none, 1=start, 2-8=in progress, 9=done
    // Map to percentage: 0→0, 1→10, 2→25, ..., 9→100
    const progressMap: Record<number, number> = {
      0: 0, 1: 10, 2: 25, 3: 35, 4: 50, 5: 60, 6: 70, 7: 80, 8: 90, 9: 100
    };
    result.progress = progressMap[node.data.progress] ?? Math.round((node.data.progress / 9) * 100);
  }

  if (node.children && node.children.length > 0) {
    result.children = node.children.map(convertKityMinderNode);
  }

  return result;
}

// ============ KityMinder Export ============

/**
 * Export the current graph as KityMinder JSON (.km) format.
 * The .km format is: { root: { data: {...}, children: [...] }, template, theme, version }
 */
export function exportToKityMinder(graph: Graph): string {
  const nodes = graph.getNodes();
  if (nodes.length === 0) {
    return JSON.stringify({
      root: { data: { text: 'Empty' }, children: [] },
      template: 'default',
      theme: 'fresh-blue',
      version: '1.4.43'
    }, null, 2);
  }

  // Find root nodes (nodes with no incoming edges)
  const roots = nodes.filter(node => {
    const incoming = graph.getIncomingEdges(node);
    return !incoming || incoming.length === 0;
  });

  const rootNode = roots[0] || nodes[0];
  const kmRoot = convertGraphNodeToKityMinder(graph, rootNode);

  return JSON.stringify({
    root: kmRoot,
    template: 'default',
    theme: 'fresh-blue',
    version: '1.4.43'
  }, null, 2);
}

function convertGraphNodeToKityMinder(graph: Graph, node: Node): KityMinderNode {
  const data = node.getData() as any;
  const label = String(node.getAttrs()?.label?.text || 'Untitled');

  // Strip emoji prefix/suffix decorations from label to get clean text
  const cleanText = label
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+ /gu, '')
    .replace(/ [\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/gu, '')
    .trim() || label;

  const kmData: KityMinderNode['data'] = {
    id: node.id,
    text: cleanText,
    created: Date.now(),
  };

  // Map collapsed state
  if (data?.collapsed) {
    kmData.expandState = 'collapse';
  }

  // Map note
  if (data?.note) {
    kmData.note = data.note;
  }

  // Map link → hyperlink
  if (data?.link) {
    kmData.hyperlink = data.link;
  }

  // Map priority
  if (data?.priority) {
    kmData.priority = data.priority;
  }

  // Map progress (percentage → KityMinder 0-9 scale)
  if (data?.progress !== undefined && data?.progress !== null) {
    // Reverse mapping: 0→0, 1-10→1, 11-25→2, ..., 91-100→9
    const pct = data.progress;
    if (pct <= 0) kmData.progress = 0;
    else if (pct <= 10) kmData.progress = 1;
    else if (pct <= 25) kmData.progress = 2;
    else if (pct <= 35) kmData.progress = 3;
    else if (pct <= 50) kmData.progress = 4;
    else if (pct <= 60) kmData.progress = 5;
    else if (pct <= 70) kmData.progress = 6;
    else if (pct <= 80) kmData.progress = 7;
    else if (pct <= 90) kmData.progress = 8;
    else kmData.progress = 9;
  }

  // Map image
  if (data?.imageUrl) {
    kmData.image = data.imageUrl;
  }

  // Get children via outgoing edges
  const outgoing = graph.getOutgoingEdges(node) || [];
  const children = outgoing
    .map(edge => {
      const targetId = edge.getTargetCellId();
      return targetId ? graph.getCellById(targetId) as Node : null;
    })
    .filter((n): n is Node => n !== null);

  const kmNode: KityMinderNode = {
    data: kmData,
    children: children.map(child => convertGraphNodeToKityMinder(graph, child)),
  };

  return kmNode;
}

// ============ FreeMind Import ============

export async function importFreeMind(file: File): Promise<MindmapNode> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  const rootNode = xmlDoc.querySelector('map > node');
  if (!rootNode) {
    throw new Error('Invalid FreeMind file: no root node found');
  }

  return convertFreeMindNode(rootNode);
}

function convertFreeMindNode(element: Element): MindmapNode {
  const text = element.getAttribute('TEXT') || 'Untitled';

  const node: MindmapNode = {
    id: element.getAttribute('ID') || crypto.randomUUID(),
    topic: text,
    expanded: element.getAttribute('FOLDED') !== 'true',
  };

  // Extract link
  const link = element.getAttribute('LINK');
  if (link) {
    node.link = link;
  }

  // Extract icons
  const icons = element.querySelectorAll(':scope > icon');
  if (icons.length > 0) {
    const iconNames: string[] = [];
    icons.forEach(icon => {
      const builtin = icon.getAttribute('BUILTIN');
      if (builtin) {
        iconNames.push(builtin);
      }
    });
    if (iconNames.length > 0) {
      node.markers = iconNames;
      node.icon = mapFreeMindIconToEmoji(iconNames[0]);
    }
  }

  // Extract notes
  const richContent = element.querySelector(':scope > richcontent[TYPE="NOTE"]');
  if (richContent) {
    const htmlContent = richContent.querySelector('html, body, p');
    node.note = htmlContent?.textContent?.trim() || '';
  }

  // Extract style
  const bgColor = element.getAttribute('BACKGROUND_COLOR');
  const textColor = element.getAttribute('COLOR');
  if (bgColor || textColor) {
    node.style = {
      backgroundColor: bgColor || undefined,
      textColor: textColor || undefined,
    };
  }

  const children = element.querySelectorAll(':scope > node');
  if (children.length > 0) {
    node.children = Array.from(children).map(convertFreeMindNode);
  }

  return node;
}

/**
 * Map FreeMind icon names to emoji equivalents
 */
function mapFreeMindIconToEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    // Priority
    'full-1': '🔴',
    'full-2': '🟠',
    'full-3': '🟡',
    'full-4': '🟢',
    'full-5': '🔵',
    // Flags
    'flag': '🚩',
    'flag-black': '🏴',
    'flag-blue': '🔵',
    'flag-green': '🟢',
    'flag-orange': '🟠',
    'flag-pink': '🩷',
    'flag-yellow': '🟡',
    // Smileys
    'smiley-oh': '😮',
    'smiley-angry': '😠',
    'smiley-neutral': '😐',
    // Arrows
    'go': '➡️',
    'back': '⬅️',
    'forward': '⏩',
    'up': '⬆️',
    'down': '⬇️',
    // Symbols
    'yes': '✅',
    'no': '❌',
    'ok': '👌',
    'stop': '🛑',
    'help': '❓',
    'info': 'ℹ️',
    'idea': '💡',
    'button_ok': '✅',
    'button_cancel': '❌',
    'messagebox_warning': '⚠️',
    // Calendar
    'calendar': '📅',
    'clock': '🕐',
    'hourglass': '⏳',
    // Misc
    'bookmark': '🔖',
    'attach': '📎',
    'launch': '🚀',
    'pencil': '✏️',
    'list': '📋',
    'desktop_new': '🖥️',
    'folder': '📁',
    'mail': '📧',
  };

  return iconMap[iconName] || '📌';
}

// ============ FreePlan Import ============
// FreePlan is an extended FreeMind format with additional features

export async function importFreePlan(file: File): Promise<MindmapNode> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // FreePlan uses the same structure as FreeMind but with extensions
  const rootNode = xmlDoc.querySelector('map > node');
  if (!rootNode) {
    throw new Error('Invalid FreePlan file: no root node found');
  }

  return convertFreePlanNode(rootNode);
}

function convertFreePlanNode(element: Element): MindmapNode {
  // Get text content - FreePlan may use TEXT attribute or richcontent
  let text = element.getAttribute('TEXT') || '';

  // Check for rich content (HTML formatted text)
  if (!text) {
    const richContent = element.querySelector('richcontent[TYPE="NODE"]');
    if (richContent) {
      // Extract text from HTML content
      const htmlContent = richContent.querySelector('html, body, p');
      text = htmlContent?.textContent?.trim() || 'Untitled';
    }
  }

  if (!text) text = 'Untitled';

  const node: MindmapNode = {
    id: element.getAttribute('ID') || crypto.randomUUID(),
    topic: text,
    expanded: element.getAttribute('FOLDED') !== 'true',
  };

  // FreePlan extensions (for future enhancement)
  // - LINK attribute for hyperlinks
  // - icon elements for visual markers
  // - cloud elements for grouping
  // - edge elements for custom connectors
  // - font elements for styling
  // - hook elements for custom data

  const children = element.querySelectorAll(':scope > node');
  if (children.length > 0) {
    node.children = Array.from(children).map(convertFreePlanNode);
  }

  return node;
}

// ============ Visio Import ============

interface VisioShape {
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isEdge: boolean;
  fromNode?: string;
  toNode?: string;
  fillColor?: string;
  lineColor?: string;
}

interface VisioData {
  shapes: VisioShape[];
  edges: VisioShape[];
}

export async function importVisio(file: File): Promise<VisioData> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  // Debug: log all files
  const fileList = Object.keys(contents.files);
  console.log('Visio files found:', fileList);

  // Parse page1.xml (primary page)
  const pageFile = contents.file('visio/pages/page1.xml');
  if (!pageFile) {
    throw new Error('Invalid Visio file: page1.xml not found. Files: ' + fileList.join(', '));
  }

  const pageXml = await pageFile.async('string');
  const parser = new DOMParser();
  const pageDoc = parser.parseFromString(pageXml, 'text/xml');

  const shapes: VisioShape[] = [];
  const edges: VisioShape[] = [];

  // Parse shapes
  const shapeElements = pageDoc.querySelectorAll('Shape');

  shapeElements.forEach((shape) => {
    const id = shape.getAttribute('ID') || crypto.randomUUID();
    const name = shape.getAttribute('Name') || shape.getAttribute('NameU') || '';

    // Get text content
    const textEl = shape.querySelector('Text');
    const text = textEl?.textContent?.trim() || name || 'Shape';

    // Get geometry
    let x = 100, y = 100, width = 100, height = 60;

    const pinX = shape.querySelector('Cell[N="PinX"]');
    const pinY = shape.querySelector('Cell[N="PinY"]');
    const widthCell = shape.querySelector('Cell[N="Width"]');
    const heightCell = shape.querySelector('Cell[N="Height"]');

    if (pinX) x = parseFloat(pinX.getAttribute('V') || '0') * 96; // Convert inches to pixels
    if (pinY) y = parseFloat(pinY.getAttribute('V') || '0') * 96;
    if (widthCell) width = parseFloat(widthCell.getAttribute('V') || '1') * 96;
    if (heightCell) height = parseFloat(heightCell.getAttribute('V') || '1') * 96;

    // Get colors
    let fillColor: string | undefined;
    let lineColor: string | undefined;

    const fillFgnd = shape.querySelector('Cell[N="FillForegnd"]');
    const lineColorCell = shape.querySelector('Cell[N="LineColor"]');

    if (fillFgnd?.getAttribute('V')) {
      const colorVal = fillFgnd.getAttribute('V');
      if (colorVal && colorVal.startsWith('#')) {
        fillColor = colorVal;
      }
    }
    if (lineColorCell?.getAttribute('V')) {
      const colorVal = lineColorCell.getAttribute('V');
      if (colorVal && colorVal.startsWith('#')) {
        lineColor = colorVal;
      }
    }

    // Check if it's a connector/edge
    const beginX = shape.querySelector('Cell[N="BeginX"]');
    const endX = shape.querySelector('Cell[N="EndX"]');
    const connects = shape.querySelectorAll('Connect');

    const isEdge = (beginX && endX) || connects.length >= 2;

    if (isEdge) {
      let fromNode: string | undefined;
      let toNode: string | undefined;

      connects.forEach((conn) => {
        const toSheet = conn.getAttribute('ToSheet');
        const fromCell = conn.getAttribute('FromCell');

        if (fromCell === 'BeginX' && toSheet) {
          fromNode = toSheet;
        } else if (fromCell === 'EndX' && toSheet) {
          toNode = toSheet;
        }
      });

      edges.push({
        id,
        name,
        text,
        x, y, width, height,
        isEdge: true,
        fromNode,
        toNode,
        fillColor,
        lineColor,
      });
    } else {
      shapes.push({
        id,
        name,
        text,
        x, y, width, height,
        isEdge: false,
        fillColor,
        lineColor,
      });
    }
  });

  return { shapes, edges };
}

export function visioToGraph(graph: Graph, data: VisioData): void {
  graph.clearCells();

  // Calculate bounding box to normalize positions
  let minY = Infinity;
  let maxY = -Infinity;

  data.shapes.forEach((shape) => {
    if (shape.y < minY) minY = shape.y;
    if (shape.y > maxY) maxY = shape.y;
  });

  const pageHeight = maxY - minY + 200;

  // Create nodes
  data.shapes.forEach((shape) => {
    // Flip Y axis (Visio uses bottom-left origin)
    const flippedY = pageHeight - (shape.y - minY);

    graph.addNode({
      id: shape.id,
      x: shape.x - shape.width / 2,
      y: flippedY - shape.height / 2,
      width: Math.max(60, shape.width),
      height: Math.max(40, shape.height),
      shape: 'rect',
      attrs: {
        body: {
          fill: shape.fillColor || '#ffffff',
          stroke: shape.lineColor || '#333333',
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        },
        label: {
          text: shape.text,
          fill: '#333333',
          fontSize: 12,
        },
      },
      ports: FULL_PORTS_CONFIG as any,
    });
  });

  // Create edges
  data.edges.forEach((edge) => {
    if (edge.fromNode && edge.toNode) {
      // Check if both nodes exist
      const sourceExists = data.shapes.some(s => s.id === edge.fromNode);
      const targetExists = data.shapes.some(s => s.id === edge.toNode);

      if (sourceExists && targetExists) {
        graph.addEdge({
          id: edge.id,
          source: edge.fromNode,
          target: edge.toNode,
          attrs: {
            line: {
              stroke: edge.lineColor || '#333333',
              strokeWidth: 1,
              targetMarker: {
                name: 'block',
                size: 6,
              },
            },
          },
          labels: edge.text ? [{
            attrs: { label: { text: edge.text, fill: '#333' } },
          }] : [],
        });
      }
    }
  });
}

// ============ draw.io Export ============

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strip HTML tags from a draw.io label value and return plain text.
 * draw.io stores labels with html=1, using tags like <div>, <br>, <b>, etc.
 */
function stripHtmlTags(html: string): string {
  if (!html) return '';
  // Replace <br>, <br/>, <br /> with newlines, then strip all other tags
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '');
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Trim trailing newlines
  return text.replace(/\n+$/, '').trim();
}

function toMxColor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    if (trimmed.length === 4) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return trimmed.slice(0, 7);
  }

  return null;
}

function buildVertexStyle(node: Node): string {
  const attrs = (node.getAttrs() || {}) as any;
  const body = attrs.body || {};
  const label = attrs.label || {};
  const shape = String((node as any).shape || 'rect').toLowerCase();

  const fillColor = toMxColor(body.fill) || '#ffffff';
  const strokeColor = toMxColor(body.stroke) || '#000000';
  const textColor = toMxColor(label.fill) || '#000000';
  const fontSize = Number(label.fontSize) > 0 ? Number(label.fontSize) : 12;
  const rounded = Number(body.rx) > 0 || Number(body.ry) > 0 ? '1' : '0';
  const strokeWidth = Number(body.strokeWidth) > 0 ? Number(body.strokeWidth) : 1;
  const opacity = body.opacity != null && Number(body.opacity) < 1 ? Math.round(Number(body.opacity) * 100) : 100;
  const dashed = typeof body.strokeDasharray === 'string' && body.strokeDasharray.trim() ? '1' : '0';
  const bold = label.fontWeight === 'bold' ? '1' : '0';
  const italic = label.fontStyle === 'italic' ? '1' : '0';
  const underline = label.textDecoration === 'underline' ? '1' : '0';

  let mxShape = 'rectangle';
  let perimeter = 'rectanglePerimeter';

  if (shape === 'ellipse' || shape === 'circle') {
    mxShape = 'ellipse';
    perimeter = 'ellipsePerimeter';
  } else if (shape === 'diamond') {
    mxShape = 'rhombus';
    perimeter = 'rhombusPerimeter';
  } else if (shape === 'polygon') {
    // Preserve arbitrary polygon data when available, otherwise use rhombus as a safe polygon fallback.
    if (typeof body.refPoints === 'string' && body.refPoints.trim()) {
      mxShape = 'mxgraph.basic.polygon';
    } else {
      mxShape = 'rhombus';
      perimeter = 'rhombusPerimeter';
    }
  } else if (shape === 'image') {
    mxShape = 'image';
    perimeter = 'rectanglePerimeter';
  } else if (shape === 'rich-content-node') {
    mxShape = 'rectangle';
    perimeter = 'rectanglePerimeter';
  }

  const imageUrl = String(attrs?.image?.xlinkHref || attrs?.image?.['xlink:href'] || '').trim();

  return [
    `shape=${mxShape}`,
    `perimeter=${perimeter}`,
    'whiteSpace=wrap',
    'html=1',
    `rounded=${rounded}`,
    `fillColor=${fillColor}`,
    `strokeColor=${strokeColor}`,
    `strokeWidth=${strokeWidth}`,
    `fontColor=${textColor}`,
    `fontSize=${fontSize}`,
    ...(opacity < 100 ? [`opacity=${opacity}`] : []),
    ...(dashed === '1' ? ['dashed=1'] : []),
    ...(bold === '1' ? ['bold=1'] : []),
    ...(italic === '1' ? ['italic=1'] : []),
    ...(underline === '1' ? ['underline=1'] : []),
    ...(mxShape === 'image' && imageUrl ? [`image=${imageUrl}`, 'imageAspect=0'] : []),
    ...(mxShape === 'mxgraph.basic.polygon' && typeof body.refPoints === 'string' ? [`points=${body.refPoints}`] : []),
  ].join(';') + ';';
}

function buildEdgeStyle(edge: any): string {
  const attrs = (edge.getAttrs?.() || {}) as any;
  const line = attrs.line || {};
  const label = attrs.label || {};

  const strokeColor = toMxColor(line.stroke) || '#000000';
  const textColor = toMxColor(label.fill) || '#000000';
  const fontSize = Number(label.fontSize) > 0 ? Number(label.fontSize) : 12;
  const strokeWidth = Number(line.strokeWidth) > 0 ? Number(line.strokeWidth) : 1;
  const dashed = typeof line.strokeDasharray === 'string' && line.strokeDasharray.trim() ? '1' : '0';

  const markerName = String(line?.targetMarker?.name || '').toLowerCase();
  const endArrow = markerName === 'none' || markerName === '' ? 'none' : 'block';
  const rounded = line?.router?.name === 'smooth' ? '1' : '0';

  return [
    'edgeStyle=orthogonalEdgeStyle',
    `rounded=${rounded}`,
    'orthogonalLoop=1',
    'jettySize=auto',
    'html=1',
    `strokeColor=${strokeColor}`,
    `strokeWidth=${strokeWidth}`,
    `endArrow=${endArrow}`,
    'endFill=1',
    `fontColor=${textColor}`,
    `fontSize=${fontSize}`,
    ...(dashed === '1' ? ['dashed=1'] : []),
  ].join(';') + ';';
}

/**
 * Export current graph to draw.io compatible XML (.drawio).
 * Uses plain (uncompressed) mxGraphModel wrapped by mxfile.
 */
export function exportToDrawioXML(graph: Graph): string {
  const modified = new Date().toISOString();
  const diagramId = `drawdd-${Date.now().toString(36)}`;

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(`<mxfile host="app.diagrams.net" modified="${escapeXml(modified)}" agent="DRAWDD" version="26.0.0" type="device" compressed="false">`);
  lines.push(`  <diagram id="${escapeXml(diagramId)}" name="Page-1">`);
  lines.push('    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">');
  lines.push('      <root>');
  lines.push('        <mxCell id="0"/>');
  lines.push('        <mxCell id="1" parent="0"/>');

  for (const node of graph.getNodes()) {
    const bbox = node.getBBox();
    const attrs = (node.getAttrs() || {}) as any;
    const label = String(attrs?.label?.text ?? attrs?.text?.text ?? '');
    const style = buildVertexStyle(node);

    lines.push(`        <mxCell id="${escapeXml(node.id)}" value="${escapeXml(label)}" style="${escapeXml(style)}" parent="1" vertex="1">`);
    lines.push(`          <mxGeometry x="${bbox.x}" y="${bbox.y}" width="${bbox.width}" height="${bbox.height}" as="geometry"/>`);
    lines.push('        </mxCell>');
  }

  for (const edge of graph.getEdges()) {
    const sourceId = edge.getSourceCellId?.();
    const targetId = edge.getTargetCellId?.();
    if (!sourceId || !targetId) continue;

    const labels = edge.getLabels?.() || [];
    const edgeLabel = labels[0]?.attrs?.label?.text ?? labels[0]?.attrs?.text?.text ?? '';
    const style = buildEdgeStyle(edge as any);

    lines.push(`        <mxCell id="${escapeXml(edge.id)}" value="${escapeXml(String(edgeLabel))}" style="${escapeXml(style)}" parent="1" source="${escapeXml(sourceId)}" target="${escapeXml(targetId)}" edge="1">`);

    const vertices = edge.getVertices?.() || [];
    if (vertices.length > 0) {
      lines.push('          <mxGeometry relative="1" as="geometry">');
      lines.push('            <Array as="points">');
      for (const p of vertices) {
        lines.push(`              <mxPoint x="${p.x}" y="${p.y}"/>`);
      }
      lines.push('            </Array>');
      lines.push('          </mxGeometry>');
    } else {
      lines.push('          <mxGeometry relative="1" as="geometry"/>');
    }

    lines.push('        </mxCell>');
  }

  lines.push('      </root>');
  lines.push('    </mxGraphModel>');
  lines.push('  </diagram>');
  lines.push('</mxfile>');

  return lines.join('\n');
}

// ============ draw.io Import ============

/**
 * Parse a draw.io style string into a key→value record.
 * Example: "shape=ellipse;fillColor=#ff0000;strokeColor=#000000;"
 */
function parseDrawioStyle(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  style.split(';').forEach(part => {
    const eq = part.indexOf('=');
    if (eq === -1) {
      if (part.trim()) result['__type'] = part.trim();
    } else {
      const key = part.slice(0, eq).trim();
      const val = part.slice(eq + 1).trim();
      if (key) result[key] = val;
    }
  });
  return result;
}

/**
 * Map a draw.io shape identifier to an X6 shape name.
 */
function drawioShapeToX6(styleMap: Record<string, string>): string {
  const shape = (styleMap['shape'] || styleMap['__type'] || '').toLowerCase();
  if (shape === 'ellipse' || shape === 'circle') return 'ellipse';
  if (shape === 'rhombus' || shape === 'diamond') return 'diamond';
  if (shape === 'triangle') return 'polygon';
  if (shape === 'image') return 'image';
  if (shape === 'parallelogram' || shape.includes('parallelogram')) return 'polygon';
  if (shape.includes('cylinder') || shape.includes('database')) return 'ellipse';
  if (shape.includes('cloud')) return 'ellipse';
  if (shape.includes('hexagon')) return 'polygon';
  // Default: rectangle
  return 'rect';
}

/**
 * Decompress a base64-encoded, zlib-deflated draw.io diagram string.
 * Uses the browser-native DecompressionStream API (supported in Chrome 80+,
 * Firefox 113+, Safari 16.4+, Edge 80+).
 */
async function decompressDrawioDiagram(encoded: string): Promise<string> {
  // draw.io uses URI-encoded then base64'd then deflate-raw compressed data
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));

  try {
    // Try deflate-raw first (most common in draw.io)
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(bytes);
    writer.close();

    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) chunks.push(value);
    }

    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }

    const decoded = new TextDecoder('utf-8').decode(out);
    // draw.io URI-encodes before base64, so decode that too
    return decodeURIComponent(decoded);
  } catch {
    // Try deflate (with zlib header) as fallback
    try {
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      const reader = ds.readable.getReader();
      writer.write(bytes);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) chunks.push(value);
      }

      const total = chunks.reduce((n, c) => n + c.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
      }

      const decoded = new TextDecoder('utf-8').decode(out);
      return decodeURIComponent(decoded);
    } catch {
      throw new Error(
        'Cannot decompress this draw.io file. It uses an unsupported compression format.\n\n' +
        'To fix: open the file in draw.io, then go to Extras → Edit Diagram and copy the XML, ' +
        'or re-save it as "Uncompressed XML" (File → Properties → uncheck Compress).'
      );
    }
  }
}

/**
 * Extract the raw mxGraphModel XML from an mxfile document.
 * The <diagram> content may be either plain XML or a compressed+base64 string.
 */
async function extractMxGraphModelXml(mxfileDoc: Document): Promise<string> {
  const diagramEl = mxfileDoc.querySelector('diagram');
  if (!diagramEl) {
    throw new Error('No <diagram> element found in draw.io file.');
  }

  const rawContent = diagramEl.textContent?.trim() || '';

  // If the content is empty or starts with '<', it's already uncompressed inline XML.
  // Some files put the mxGraphModel directly inside the <diagram> element.
  const inlineModel = diagramEl.querySelector('mxGraphModel');
  if (inlineModel) {
    return inlineModel.outerHTML;
  }

  // If the raw text content looks like XML, parse it directly
  if (rawContent.startsWith('<')) {
    return rawContent;
  }

  // Otherwise it's base64-encoded compressed XML
  if (rawContent.length > 0) {
    return await decompressDrawioDiagram(rawContent);
  }

  throw new Error('draw.io <diagram> element is empty.');
}

/**
 * Import a draw.io .drawio or .xml file and load its contents onto the graph.
 * Supports:
 *  - Uncompressed XML (what DrawDD exports)
 *  - Compressed XML (what the real draw.io app produces by default)
 *  - Multi-page files (imports the first diagram page)
 */
export async function importFromDrawio(file: File, graph: Graph): Promise<void> {
  const text = await file.text();
  const parser = new DOMParser();

  // The outer document should be an <mxfile> or an <mxGraphModel> directly
  const doc = parser.parseFromString(text, 'text/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid draw.io file: XML parse error. ' + parseError.textContent?.slice(0, 200));
  }

  let modelXml: string;
  const rootTag = doc.documentElement.tagName.toLowerCase();

  if (rootTag === 'mxfile') {
    // Standard draw.io file: extract and possibly decompress the diagram content
    modelXml = await extractMxGraphModelXml(doc);
  } else if (rootTag === 'mxgraphmodel') {
    // Raw mxGraphModel (no mxfile wrapper)
    modelXml = text;
  } else {
    throw new Error(`Unexpected root element <${rootTag}>. Expected <mxfile> or <mxGraphModel>.`);
  }

  // Parse the mxGraphModel XML
  const modelDoc = parser.parseFromString(modelXml, 'text/xml');
  const modelParseError = modelDoc.querySelector('parsererror');
  if (modelParseError) {
    throw new Error('Failed to parse draw.io diagram XML: ' + modelParseError.textContent?.slice(0, 200));
  }

  const cells = Array.from(modelDoc.querySelectorAll('mxCell'));

  // Separate vertices and edges, skip the two mandatory root cells (id="0", id="1")
  interface DrawioVertex {
    id: string;
    label: string;
    style: Record<string, string>;
    x: number;
    y: number;
    width: number;
    height: number;
    parent: string;
  }

  interface DrawioEdge {
    id: string;
    label: string;
    style: Record<string, string>;
    source: string;
    target: string;
    points: Array<{ x: number; y: number }>;
  }

  const vertices: DrawioVertex[] = [];
  const edges: DrawioEdge[] = [];

  // First pass: build a parent→geometry map for resolving relative coordinates in groups/containers.
  // Also collect edge IDs so we can detect child-label cells (labels stored as child mxCells of edges).
  const cellGeoMap = new Map<string, { x: number; y: number }>();
  const edgeIds = new Set<string>();

  for (const cell of cells) {
    const id = cell.getAttribute('id') || '';
    if (id === '0' || id === '1') continue;
    const geo = cell.querySelector('mxGeometry');
    if (geo && geo.getAttribute('relative') !== '1') {
      cellGeoMap.set(id, {
        x: parseFloat(geo.getAttribute('x') || '0'),
        y: parseFloat(geo.getAttribute('y') || '0'),
      });
    }
    if (cell.getAttribute('edge') === '1') {
      edgeIds.add(id);
    }
  }

  // Resolve absolute position by walking parent chain
  function resolveAbsolutePos(parentId: string, localX: number, localY: number): { x: number; y: number } {
    let x = localX;
    let y = localY;
    let pid = parentId;
    while (pid && pid !== '0' && pid !== '1') {
      const parentGeo = cellGeoMap.get(pid);
      if (parentGeo) {
        x += parentGeo.x;
        y += parentGeo.y;
      }
      // Find this parent's own parent
      const parentCell = cells.find(c => c.getAttribute('id') === pid);
      pid = parentCell?.getAttribute('parent') || '';
    }
    return { x, y };
  }

  // Edge label child cells: draw.io sometimes stores edge labels as a separate mxCell
  // with vertex="1" connectable="0" and parent=<edge-id>. Collect them to merge later.
  const edgeLabelMap = new Map<string, string>();

  for (const cell of cells) {
    const id = cell.getAttribute('id') || '';
    if (id === '0' || id === '1') continue;

    const rawValue = cell.getAttribute('value') || '';
    const value = stripHtmlTags(rawValue);
    const styleStr = cell.getAttribute('style') || '';
    const styleMap = parseDrawioStyle(styleStr);
    const isVertex = cell.getAttribute('vertex') === '1';
    const isEdge = cell.getAttribute('edge') === '1';
    const parentId = cell.getAttribute('parent') || '1';

    // Check if this vertex is actually an edge label (child of an edge cell)
    if (isVertex && edgeIds.has(parentId)) {
      // This is an edge label cell — store the label text for later
      if (value) {
        edgeLabelMap.set(parentId, value);
      }
      continue;
    }

    if (isVertex) {
      const geo = cell.querySelector('mxGeometry');
      const localX = parseFloat(geo?.getAttribute('x') || '0');
      const localY = parseFloat(geo?.getAttribute('y') || '0');
      // Resolve absolute position if cell is inside a group/container (parent != "1")
      const absPos = parentId !== '1' && parentId !== '0'
        ? resolveAbsolutePos(parentId, localX, localY)
        : { x: localX, y: localY };

      vertices.push({
        id,
        label: value,
        style: styleMap,
        x: absPos.x,
        y: absPos.y,
        width: parseFloat(geo?.getAttribute('width') || '120'),
        height: parseFloat(geo?.getAttribute('height') || '60'),
        parent: parentId,
      });
    } else if (isEdge) {
      const source = cell.getAttribute('source') || '';
      const target = cell.getAttribute('target') || '';
      // Collect waypoints if any
      const pointEls = cell.querySelectorAll('mxGeometry Array[as="points"] mxPoint');
      const points = Array.from(pointEls).map(p => ({
        x: parseFloat(p.getAttribute('x') || '0'),
        y: parseFloat(p.getAttribute('y') || '0'),
      }));
      edges.push({ id, label: value, style: styleMap, source, target, points });
    }
  }

  // Merge edge labels from child cells into their parent edges
  for (const e of edges) {
    if (!e.label && edgeLabelMap.has(e.id)) {
      e.label = edgeLabelMap.get(e.id)!;
    }
  }

  if (vertices.length === 0 && edges.length === 0) {
    throw new Error('No diagram content found in draw.io file. The file may be empty or use an unsupported format.');
  }

  // Clear the graph and add all cells
  graph.clearCells();

  // Build a set of valid vertex IDs so we can skip edges with missing endpoints
  const vertexIds = new Set(vertices.map(v => v.id));

  // Add nodes
  for (const v of vertices) {
    const shape = drawioShapeToX6(v.style);
    const fillColor = v.style['fillColor'] || '#ffffff';
    const strokeColor = v.style['strokeColor'] || '#000000';
    const fontColor = v.style['fontColor'] || '#000000';
    const fontSize = parseFloat(v.style['fontSize'] || '12') || 12;
    const rounded = v.style['rounded'] === '1';
    const opacity = parseFloat(v.style['opacity'] || '100') / 100;
    const dashed = v.style['dashed'] === '1';

    const nodeAttrs: any = {
      body: {
        fill: fillColor === 'none' ? 'transparent' : fillColor,
        stroke: strokeColor === 'none' ? 'transparent' : strokeColor,
        strokeWidth: parseFloat(v.style['strokeWidth'] || '1'),
        rx: rounded ? 10 : 0,
        ry: rounded ? 10 : 0,
        opacity,
        strokeDasharray: dashed ? '6,3' : undefined,
      },
      label: {
        text: v.label,
        fill: fontColor,
        fontSize,
        fontWeight: v.style['bold'] === '1' ? 'bold' : 'normal',
        fontStyle: v.style['italic'] === '1' ? 'italic' : 'normal',
        textDecoration: v.style['underline'] === '1' ? 'underline' : 'none',
        textAnchor: 'middle',
        dominantBaseline: 'middle',
      },
    };

    // Image shape handling
    if (shape === 'image' && v.style['image']) {
      nodeAttrs.image = { xlinkHref: v.style['image'] };
    }

    graph.addNode({
      id: v.id,
      shape,
      x: v.x,
      y: v.y,
      width: Math.max(20, v.width),
      height: Math.max(20, v.height),
      attrs: nodeAttrs,
      ports: FULL_PORTS_CONFIG as any,
    });
  }

  // Add edges (only if both endpoints exist as vertices in this diagram)
  for (const e of edges) {
    // Edges with no source/target are floating annotations — skip them
    if (!e.source || !e.target) continue;
    if (!vertexIds.has(e.source) || !vertexIds.has(e.target)) continue;

    const strokeColor = e.style['strokeColor'] || '#000000';
    const fontColor = e.style['fontColor'] || '#000000';
    const fontSize = parseFloat(e.style['fontSize'] || '12') || 12;
    const endArrow = e.style['endArrow'];
    const noArrow = endArrow === 'none' || endArrow === '';
    const dashed = e.style['dashed'] === '1';
    const rounded = e.style['rounded'] === '1';

    const edgeAttrs: any = {
      line: {
        stroke: strokeColor === 'none' ? 'transparent' : strokeColor,
        strokeWidth: parseFloat(e.style['strokeWidth'] || '1'),
        strokeDasharray: dashed ? '6,3' : undefined,
        targetMarker: noArrow ? null : { name: 'block', size: 6 },
      },
      label: {
        text: e.label || '',
        fill: fontColor,
        fontSize,
      },
    };

    const edgeDef: any = {
      id: e.id,
      source: e.source,
      target: e.target,
      attrs: edgeAttrs,
      connector: rounded ? { name: 'rounded', args: { radius: 10 } } : { name: 'normal' },
      router: { name: 'normal' },
    };

    // Re-apply waypoints if present
    if (e.points.length > 0) {
      edgeDef.vertices = e.points;
    }

    graph.addEdge(edgeDef);
  }

  // Fit the view to the imported content
  setTimeout(() => {
    graph.zoomToFit({ padding: 40, maxScale: 1.5 });
    graph.centerContent();
  }, 50);
}

// ============ HTML Export ============

export function exportToHTML(graph: Graph, settings?: {
  canvasBackground?: { type: 'color' | 'image'; color: string; imageUrl?: string };
  title?: string;
}): string {
  // Get SVG content
  let svgContent = '';
  (graph as Graph & { toSVG: (callback: (svg: string) => void) => void }).toSVG((svg: string) => {
    svgContent = svg;
  });

  const backgroundColor = settings?.canvasBackground?.color || '#ffffff';
  const title = settings?.title || 'DRAWDD Diagram';

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: ${backgroundColor};
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        header {
            background: #fff;
            border-bottom: 1px solid #e0e0e0;
            padding: 1rem 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            font-size: 1.5rem;
            color: #333;
            font-weight: 600;
        }
        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            overflow: auto;
        }
        .diagram-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 2rem;
            max-width: 100%;
            max-height: 100%;
        }
        svg {
            max-width: 100%;
            height: auto;
            display: block;
        }
        footer {
            background: #fff;
            border-top: 1px solid #e0e0e0;
            padding: 1rem 2rem;
            text-align: center;
            color: #666;
            font-size: 0.875rem;
        }
        .controls {
            margin-top: 1rem;
            text-align: center;
        }
        button {
            background: #1976d2;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            margin: 0 0.25rem;
        }
        button:hover {
            background: #1565c0;
        }
        @media print {
            header, footer, .controls {
                display: none;
            }
            main {
                padding: 0;
            }
            .diagram-container {
                box-shadow: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <header>
        <h1>${title}</h1>
    </header>
    <main>
        <div class="diagram-container">
            ${svgContent}
            <div class="controls">
                <button onclick="window.print()">🖨️ Print</button>
                <button onclick="downloadSVG()">💾 Download SVG</button>
                <button onclick="downloadPNG()">📷 Download PNG</button>
            </div>
        </div>
    </main>
    <footer>
        <p>Created with DRAWDD - Open Source Diagramming Tool</p>
        <p>Exported on ${new Date().toLocaleString()}</p>
    </footer>
    <script>
        function downloadSVG() {
            const svg = document.querySelector('svg');
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svg);
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diagram.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function downloadPNG() {
            const svg = document.querySelector('svg');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const svgData = new XMLSerializer().serializeToString(svg);
            const img = new Image();
            
            img.onload = function() {
                canvas.width = img.width * 2;
                canvas.height = img.height * 2;
                ctx.scale(2, 2);
                ctx.fillStyle = '${backgroundColor}';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'diagram.png';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
    </script>
</body>
</html>`;
}

// ============ Markdown Export ============

/**
 * Export mindmap to Markdown outline format
 */
export function exportToMarkdown(graph: Graph): string {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return '# Empty Diagram\n';

  // Find root nodes (nodes with no incoming edges)
  const roots = nodes.filter(node => {
    const incoming = graph.getIncomingEdges(node);
    return !incoming || incoming.length === 0;
  });

  if (roots.length === 0) return '# No Root Node Found\n';

  let markdown = '';

  roots.forEach(root => {
    markdown += convertNodeToMarkdown(graph, root, 0);
  });

  return markdown;
}

function convertNodeToMarkdown(graph: Graph, node: Node, level: number): string {
  const data = node.getData() as any;
  const label = node.getAttrs()?.label?.text || 'Untitled';

  // Create heading or list item based on level
  let markdown = '';
  const indent = '  '.repeat(Math.max(0, level - 1));

  if (level === 0) {
    markdown += `# ${label}\n\n`;
  } else {
    markdown += `${indent}- ${label}\n`;
  }

  // Add metadata if present
  if (data?.note) {
    markdown += `${indent}  > ${data.note}\n`;
  }

  if (data?.link) {
    markdown += `${indent}  🔗 [Link](${data.link})\n`;
  }

  if (data?.priority) {
    markdown += `${indent}  **Priority:** P${data.priority}\n`;
  }

  if (data?.progress !== undefined) {
    markdown += `${indent}  **Progress:** ${data.progress}%\n`;
  }

  if (data?.markers && data.markers.length > 0) {
    markdown += `${indent}  **Tags:** ${data.markers.join(', ')}\n`;
  }

  // Add blank line after metadata
  if (data?.note || data?.link || data?.priority || data?.progress || data?.markers) {
    markdown += '\n';
  }

  // Process children
  const outgoing = graph.getOutgoingEdges(node) || [];
  const children = outgoing
    .map(edge => {
      const targetId = edge.getTargetCellId();
      return targetId ? graph.getCellById(targetId) as Node : null;
    })
    .filter((n): n is Node => n !== null);

  children.forEach(child => {
    markdown += convertNodeToMarkdown(graph, child, level + 1);
  });

  return markdown;
}

// ============ Text Outline Export ============

/**
 * Export to plain text outline format
 */
export function exportToTextOutline(graph: Graph): string {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return 'Empty Diagram\n';

  // Find root nodes
  const roots = nodes.filter(node => {
    const incoming = graph.getIncomingEdges(node);
    return !incoming || incoming.length === 0;
  });

  if (roots.length === 0) return 'No Root Node Found\n';

  let text = '';

  roots.forEach(root => {
    text += convertNodeToTextOutline(graph, root, 0);
  });

  return text;
}

function convertNodeToTextOutline(graph: Graph, node: Node, level: number): string {
  const data = node.getData() as any;
  const label = node.getAttrs()?.label?.text || 'Untitled';

  const indent = '  '.repeat(level);
  let text = `${indent}${label}\n`;

  // Add metadata
  if (data?.note) {
    text += `${indent}  Note: ${data.note}\n`;
  }

  if (data?.link) {
    text += `${indent}  Link: ${data.link}\n`;
  }

  if (data?.priority) {
    text += `${indent}  Priority: P${data.priority}\n`;
  }

  if (data?.progress !== undefined) {
    text += `${indent}  Progress: ${data.progress}%\n`;
  }

  // Process children
  const outgoing = graph.getOutgoingEdges(node) || [];
  const children = outgoing
    .map(edge => {
      const targetId = edge.getTargetCellId();
      return targetId ? graph.getCellById(targetId) as Node : null;
    })
    .filter((n): n is Node => n !== null);

  children.forEach(child => {
    text += convertNodeToTextOutline(graph, child, level + 1);
  });

  return text;
}
