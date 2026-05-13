import type { Graph } from '@antv/x6';

import { getColorScheme } from '../config/colorSchemes';
import { applyColorSchemeToGraph } from './colorSchemeApplication';
import { getVennThemeStyle } from './venn';

type AttrGroup = Record<string, unknown>;

interface NodeAttrs {
  body: AttrGroup;
  label: AttrGroup;
}

class MockNode {
  private attrs: NodeAttrs;
  private data: Record<string, unknown>;

  constructor(attrs: NodeAttrs, data: Record<string, unknown>) {
    this.attrs = attrs;
    this.data = data;
  }

  getAttrs(): NodeAttrs {
    return this.attrs;
  }

  setAttrs(next: Partial<NodeAttrs>): void {
    this.attrs = {
      body: { ...this.attrs.body, ...(next.body || {}) },
      label: { ...this.attrs.label, ...(next.label || {}) },
    };
  }

  getData(): Record<string, unknown> {
    return this.data;
  }

  setData(next: Record<string, unknown>): void {
    this.data = next;
  }
}

class MockEdge {
  private attrs: { line: AttrGroup };

  constructor(attrs: { line: AttrGroup }) {
    this.attrs = attrs;
  }

  getAttrs(): { line: AttrGroup } {
    return this.attrs;
  }

  setAttrs(next: Partial<{ line: AttrGroup }>): void {
    this.attrs = {
      line: { ...this.attrs.line, ...(next.line || {}) },
    };
  }
}

class MockGraph {
  private nodes: MockNode[];
  private edges: MockEdge[];

  constructor(nodes: MockNode[], edges: MockEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  getNodes(): MockNode[] {
    return this.nodes;
  }

  getEdges(): MockEdge[] {
    return this.edges;
  }
}

function createGraph(nodes: MockNode[], edges: MockEdge[] = []): Graph {
  return new MockGraph(nodes, edges) as unknown as Graph;
}

describe('applyColorSchemeToGraph', () => {
  it('applies theme-aware Venn colors and preserves the variant identity', () => {
    const scheme = getColorScheme('sunset');
    const vennNode = new MockNode(
      {
        body: {
          fill: '#A855F7',
          stroke: '#7E22CE',
          strokeWidth: 2.5,
          fillOpacity: 0.30,
        },
        label: { text: 'Circle D (Purple)', fill: '#3b0764' },
      },
      { isVenn: true },
    );

    applyColorSchemeToGraph(createGraph([vennNode]), scheme);

    const themedStyle = getVennThemeStyle(scheme, 3, 0.30);
    expect(vennNode.getAttrs().body.fill).toBe(themedStyle.fill);
    expect(vennNode.getAttrs().body.stroke).toBe(themedStyle.stroke);
    expect(vennNode.getAttrs().body.fillOpacity).toBe(themedStyle.fillOpacity);
    expect(vennNode.getAttrs().label.fill).toBe(themedStyle.labelFill);
    expect(vennNode.getData().vennVariantIndex).toBe(3);
    expect(vennNode.getData().isVennSet).toBe(true);
    expect(vennNode.getData().lastVisibleBodyStyle).toMatchObject({
      fill: themedStyle.fill,
      stroke: themedStyle.stroke,
      fillOpacity: themedStyle.fillOpacity,
    });
  });

  it('skips transparent annotations while recoloring standard nodes and edges', () => {
    const scheme = getColorScheme('ocean');
    const vennLabel = new MockNode(
      {
        body: { fill: 'transparent', stroke: 'transparent', strokeWidth: 0 },
        label: { text: 'A ∩ B', fill: '#374151' },
      },
      { isVenn: true, isVennLabel: true },
    );
    const standardNode = new MockNode(
      {
        body: { fill: '#ffffff', stroke: '#333333', strokeWidth: 2 },
        label: { text: 'Standard', fill: '#111827' },
      },
      {},
    );
    const edge = new MockEdge({ line: { stroke: '#333333' } });

    applyColorSchemeToGraph(createGraph([vennLabel, standardNode], [edge]), scheme);

    expect(vennLabel.getAttrs().body.fill).toBe('transparent');
    expect(vennLabel.getAttrs().label.fill).toBe('#374151');
    expect(standardNode.getAttrs().body.fill).toBe(scheme.nodeColors.primary.fill);
    expect(standardNode.getAttrs().body.stroke).toBe(scheme.nodeColors.primary.stroke);
    expect(standardNode.getAttrs().label.fill).toBe(scheme.nodeColors.primary.text);
    expect(edge.getAttrs().line.stroke).toBe(scheme.lineColor);
  });
});