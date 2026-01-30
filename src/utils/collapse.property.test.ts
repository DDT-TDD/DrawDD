/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 28: Collapse indicator presence
 * Tests that nodes with children display collapse/expand indicators
 */

import fc from 'fast-check';
import {
  addCollapseIndicator,
  removeCollapseIndicator,
  hasChildren,
  initializeCollapseIndicators,
} from './collapse';

// Mock @antv/x6
jest.mock('@antv/x6', () => {
  const nodes = new Map();
  const edges = new Map();
  let nodeIdCounter = 0;
  let edgeIdCounter = 0;

  class MockNode {
    id: string;
    data: any;
    size: { width: number; height: number };
    attrs: any;
    markup: any[];

    constructor(config: any) {
      this.id = config.id || `node-${nodeIdCounter++}`;
      this.data = config.data || {};
      this.size = { width: config.width || 100, height: config.height || 50 };
      this.attrs = config.attrs || {};
      this.markup = config.markup || [
        { tagName: 'rect', selector: 'body' },
        { tagName: 'text', selector: 'label' },
      ];
      nodes.set(this.id, this);
    }

    getData() { return this.data; }
    setData(data: any) { this.data = data; }
    getSize() { return this.size; }
    getAttrs() { return this.attrs; }
    setAttrs(attrs: any) { this.attrs = { ...this.attrs, ...attrs }; }
    getMarkup() { return this.markup; }
    setMarkup(markup: any[]) { this.markup = markup; }
    isNode() { return true; }
    setVisible(visible: boolean) { this.data.visible = visible; }
  }

  class MockEdge {
    id: string;
    source: string;
    target: string;

    constructor(config: any) {
      this.id = `edge-${edgeIdCounter++}`;
      this.source = config.source;
      this.target = config.target;
      edges.set(this.id, this);
    }

    getSourceCellId() { return this.source; }
    getTargetCellId() { return this.target; }
    isNode() { return false; }
  }

  class MockGraph {
    constructor() {
      nodes.clear();
      edges.clear();
      nodeIdCounter = 0;
      edgeIdCounter = 0;
    }

    addNode(config: any) { return new MockNode(config); }
    addEdge(config: any) { return new MockEdge(config); }
    getNodes() { return Array.from(nodes.values()); }
    getOutgoingEdges(node: MockNode) {
      return Array.from(edges.values()).filter((e: any) => e.source === node.id);
    }
    removeNode(node: MockNode) {
      nodes.delete(node.id);
      Array.from(edges.values()).forEach((edge: any) => {
        if (edge.source === node.id || edge.target === node.id) {
          edges.delete(edge.id);
        }
      });
    }
    clearCells() {
      nodes.clear();
      edges.clear();
    }
    dispose() { this.clearCells(); }
  }

  return { Graph: MockGraph };
});

import { Graph } from '@antv/x6';

const createTestGraph = (): any => new (Graph as any)();

const createMindmapTree = (
  graph: any,
  depth: number,
  branchingFactor: number,
  parentId?: string,
  level: number = 1
): any => {
  const nodeId = parentId ? `${parentId}-${level}` : `root`;
  const node = graph.addNode({
    id: nodeId,
    data: { isMindmap: true, level, collapsed: false },
    width: 100,
    height: 50,
  });

  if (depth > 0) {
    for (let i = 0; i < branchingFactor; i++) {
      const child = createMindmapTree(graph, depth - 1, branchingFactor, nodeId, level + 1);
      graph.addEdge({ source: nodeId, target: child.id });
    }
  }

  return node;
};

describe('Feature: markdown-and-folder-explorer, Property 28: Collapse indicator presence', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.1** - Nodes with children should have collapse indicator', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          createMindmapTree(graph, depth, branchingFactor);
          initializeCollapseIndicators(graph);

          graph.getNodes().forEach((node: any) => {
            const nodeHasChildren = hasChildren(graph, node);
            const attrs = node.getAttrs();
            const markup = node.getMarkup();

            if (nodeHasChildren) {
              expect(attrs.collapseIndicator).toBeDefined();
              expect(attrs.collapseIcon).toBeDefined();
              expect(markup.some((m: any) => m.selector === 'collapseIndicator')).toBe(true);
              expect(markup.some((m: any) => m.selector === 'collapseIcon')).toBe(true);
              
              const isCollapsed = node.getData().collapsed === true;
              expect(attrs.collapseIcon.text).toBe(isCollapsed ? '\u25B6' : '\u25BC');
            } else {
              expect(attrs.collapseIndicator).toBeUndefined();
              expect(attrs.collapseIcon).toBeUndefined();
            }
          });

          graph.clearCells();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Collapse indicator should be added when node gains children', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (numChildren) => {
        const node = graph.addNode({
          id: 'parent',
          data: { isMindmap: true, level: 1 },
          width: 100,
          height: 50,
        });

        addCollapseIndicator(node, false);
        expect(node.getAttrs().collapseIndicator).toBeUndefined();

        for (let i = 0; i < numChildren; i++) {
          const child = graph.addNode({ id: `child-${i}`, data: { isMindmap: true, level: 2 } });
          graph.addEdge({ source: node.id, target: child.id });
        }

        addCollapseIndicator(node, true);
        expect(node.getAttrs().collapseIndicator).toBeDefined();
        expect(node.getAttrs().collapseIcon).toBeDefined();

        graph.clearCells();
      }),
      { numRuns: 30 }
    );
  });

  it('Collapse indicator should be removed when node loses all children', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (numChildren) => {
        const node = graph.addNode({
          id: 'parent',
          data: { isMindmap: true, level: 1 },
          width: 100,
          height: 50,
        });

        const childNodes = [];
        for (let i = 0; i < numChildren; i++) {
          const child = graph.addNode({ id: `child-${i}`, data: { isMindmap: true, level: 2 } });
          graph.addEdge({ source: node.id, target: child.id });
          childNodes.push(child);
        }

        addCollapseIndicator(node, true);
        expect(node.getAttrs().collapseIndicator).toBeDefined();

        childNodes.forEach(child => graph.removeNode(child));
        removeCollapseIndicator(node);
        expect(node.getAttrs().collapseIndicator).toBeUndefined();
        expect(node.getAttrs().collapseIcon).toBeUndefined();

        graph.clearCells();
      }),
      { numRuns: 30 }
    );
  });

  it('Collapse indicator icon should reflect collapsed state', () => {
    fc.assert(
      fc.property(fc.boolean(), (isCollapsed) => {
        const node = graph.addNode({
          id: 'parent',
          data: { isMindmap: true, level: 1, collapsed: isCollapsed },
          width: 100,
          height: 50,
        });

        const child = graph.addNode({ id: 'child', data: { isMindmap: true, level: 2 } });
        graph.addEdge({ source: node.id, target: child.id });

        addCollapseIndicator(node, true);
        const attrs = node.getAttrs();
        expect(attrs.collapseIcon.text).toBe(isCollapsed ? '\u25B6' : '\u25BC');

        graph.clearCells();
      }),
      { numRuns: 50 }
    );
  });

  it('Only mindmap nodes should get collapse indicators', () => {
    fc.assert(
      fc.property(fc.boolean(), (isMindmap) => {
        const node = graph.addNode({
          id: 'node',
          data: { isMindmap, level: 1 },
          width: 100,
          height: 50,
        });

        const child = graph.addNode({ id: 'child', data: { isMindmap, level: 2 } });
        graph.addEdge({ source: node.id, target: child.id });

        initializeCollapseIndicators(graph);

        const attrs = node.getAttrs();
        if (isMindmap) {
          expect(attrs.collapseIndicator).toBeDefined();
        } else {
          expect(attrs.collapseIndicator).toBeUndefined();
        }

        graph.clearCells();
      }),
      { numRuns: 50 }
    );
  });
});

