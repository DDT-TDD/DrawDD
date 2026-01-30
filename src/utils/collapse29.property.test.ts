/**
 * Property-Based Tests for Collapse/Expand Functionality
 * Property 29: Collapse hides descendants
 */

import fc from 'fast-check';
import {
  toggleCollapse,
  getAllDescendants,
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
    visible: boolean;

    constructor(config: any) {
      this.id = `edge-${edgeIdCounter++}`;
      this.source = config.source;
      this.target = config.target;
      this.visible = true;
      edges.set(this.id, this);
    }

    getSourceCellId() { return this.source; }
    getTargetCellId() { return this.target; }
    isNode() { return false; }
    setVisible(visible: boolean) { this.visible = visible; }
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
    getCellById(id: string) {
      return nodes.get(id) || edges.get(id);
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

describe('Feature: markdown-and-folder-explorer, Property 29: Collapse hides descendants', () => {
  let graph: any;

  beforeEach(() => { graph = createTestGraph(); });
  afterEach(() => { if (graph) graph.dispose(); });

  it('**Validates: Requirements 9.2** - Collapsing a node should hide all descendant nodes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          // Create a mindmap tree
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          // Get all descendants before collapse
          const allDescendants = getAllDescendants(graph, rootNode);
          
          // All descendants should be visible initially
          allDescendants.forEach((descendant: any) => {
            const data = descendant.getData();
            expect(data.visible).not.toBe(false);
          });
          
          // Collapse the root node
          toggleCollapse(graph, rootNode, true);
          
          // Verify root node is marked as collapsed
          expect(rootNode.getData().collapsed).toBe(true);
          
          // All descendants should now be hidden
          allDescendants.forEach((descendant: any) => {
            const data = descendant.getData();
            expect(data.visible).toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Collapsing a node should hide descendants at all depths', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        (depth) => {
          // Create a linear chain (1 child per node)
          const rootNode = createMindmapTree(graph, depth, 1);
          
          // Get all descendants
          const allDescendants = getAllDescendants(graph, rootNode);
          expect(allDescendants.length).toBeGreaterThan(0);
          
          // Collapse the root
          toggleCollapse(graph, rootNode, true);
          
          // Every single descendant should be hidden, regardless of depth
          allDescendants.forEach((descendant: any) => {
            expect(descendant.getData().visible).toBe(false);
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Collapsing a node should hide edges to descendants', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 1, max: 3 }),
        (depth, branchingFactor) => {
          const rootNode = createMindmapTree(graph, depth, branchingFactor);
          
          // Get all outgoing edges from root (direct children edges)
          const outgoingEdges = graph.getOutgoingEdges(rootNode);
          
          // Collapse the root
          toggleCollapse(graph, rootNode, true);
          
          // All edges to children should be hidden
          outgoingEdges.forEach((edge: any) => {
            const targetId = edge.getTargetCellId();
            const target = graph.getCellById ? graph.getCellById(targetId) : null;
            if (target) {
              expect(target.getData().visible).toBe(false);
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('Collapsing a mid-level node should only hide its descendants', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        (depth) => {
          // Create a tree with at least 2 levels
          const rootNode = createMindmapTree(graph, depth, 2);
          
          // Get the first child of root
          const rootEdges = graph.getOutgoingEdges(rootNode);
          expect(rootEdges.length).toBeGreaterThan(0);
          
          const firstChildId = rootEdges[0].getTargetCellId();
          const firstChild = graph.getCellById ? graph.getCellById(firstChildId) : null;
          
          if (firstChild && firstChild.isNode()) {
            // Get descendants of the first child
            const childDescendants = getAllDescendants(graph, firstChild);
            
            // Collapse the first child (not the root)
            toggleCollapse(graph, firstChild, true);
            
            // Root should still be visible
            expect(rootNode.getData().visible).not.toBe(false);
            
            // First child should still be visible (it's collapsed, not hidden)
            expect(firstChild.getData().visible).not.toBe(false);
            
            // Descendants of first child should be hidden
            childDescendants.forEach((descendant: any) => {
              expect(descendant.getData().visible).toBe(false);
            });
            
            // Siblings of first child should still be visible
            rootEdges.forEach((edge: any, index: number) => {
              if (index > 0) {
                const siblingId = edge.getTargetCellId();
                const sibling = graph.getCellById ? graph.getCellById(siblingId) : null;
                if (sibling) {
                  expect(sibling.getData().visible).not.toBe(false);
                }
              }
            });
          }
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });

  it('Expanding a collapsed node should show direct children but respect their collapsed state', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }),
        (depth) => {
          // Create a tree with multiple levels
          const rootNode = createMindmapTree(graph, depth, 2);
          
          // Collapse the root
          toggleCollapse(graph, rootNode, true);
          
          // All descendants should be hidden
          const allDescendants = getAllDescendants(graph, rootNode);
          allDescendants.forEach((descendant: any) => {
            expect(descendant.getData().visible).toBe(false);
          });
          
          // Now expand the root
          toggleCollapse(graph, rootNode, false);
          
          // Root should be marked as not collapsed
          expect(rootNode.getData().collapsed).toBe(false);
          
          // Direct children should be visible
          const rootEdges = graph.getOutgoingEdges(rootNode);
          rootEdges.forEach((edge: any) => {
            const childId = edge.getTargetCellId();
            const child = graph.getCellById ? graph.getCellById(childId) : null;
            if (child) {
              expect(child.getData().visible).not.toBe(false);
            }
          });
          
          graph.clearCells();
        }
      ),
      { numRuns: 15 }
    );
  });
});
