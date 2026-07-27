import { describe, expect, it, jest } from '@jest/globals';
import type { Graph } from '@antv/x6';
import { parseDrawioToPages } from './importExport';

describe('parseDrawioToPages', () => {
  it('correctly parses multiple diagram pages from draw.io XML', async () => {
    const multiPageXml = `
      <mxfile host="Electron">
        <diagram id="page1" name="First Page">
          <mxGraphModel>
            <root>
              <mxCell id="0" />
              <mxCell id="1" parent="0" />
              <mxCell id="node1" value="Node 1" vertex="1" parent="1">
                <mxGeometry x="100" y="100" width="120" height="60" as="geometry" />
              </mxCell>
            </root>
          </mxGraphModel>
        </diagram>
        <diagram id="page2" name="Second Page">
          <mxGraphModel>
            <root>
              <mxCell id="0" />
              <mxCell id="1" parent="0" />
              <mxCell id="node2" value="Node 2" vertex="1" parent="1">
                <mxGeometry x="200" y="200" width="120" height="60" as="geometry" />
              </mxCell>
            </root>
          </mxGraphModel>
        </diagram>
      </mxfile>
    `;

    const mockNode = {
      getAttrs: () => ({ label: { text: 'Hello' } }),
      setAttrs: jest.fn(),
    };

    const mockGraph = {
      toJSON: jest.fn()
        .mockReturnValueOnce({ cells: [{ id: 'original-cell' }] }) // original state
        .mockReturnValueOnce({ cells: [{ id: 'node1', type: 'rect' }] }) // first page
        .mockReturnValueOnce({ cells: [{ id: 'node2', type: 'circle' }] }), // second page
      fromJSON: jest.fn(),
      clearCells: jest.fn(),
      addNode: jest.fn().mockReturnValue(mockNode),
      addEdge: jest.fn(),
    } as unknown as Graph;

    const pages = await parseDrawioToPages(multiPageXml, mockGraph);

    expect(pages).toHaveLength(2);
    expect(pages[0].name).toBe('First Page');
    expect(JSON.parse(pages[0].data)).toEqual({ cells: [{ id: 'node1', type: 'rect' }] });
    expect(pages[1].name).toBe('Second Page');
    expect(JSON.parse(pages[1].data)).toEqual({ cells: [{ id: 'node2', type: 'circle' }] });

    // Verify it restored the original graph state
    expect(mockGraph.fromJSON).toHaveBeenCalledTimes(1);
    expect(mockGraph.fromJSON).toHaveBeenCalledWith({ cells: [{ id: 'original-cell' }] });
  });

  it('handles empty diagram elements without crashing', async () => {
    const emptyPageXml = `
      <mxfile host="Electron">
        <diagram id="page1" name="Empty Page"></diagram>
      </mxfile>
    `;

    const mockGraph = {
      toJSON: jest.fn()
        .mockReturnValueOnce({ cells: [] }) // original state
        .mockReturnValueOnce({ cells: [] }), // first page
      fromJSON: jest.fn(),
      clearCells: jest.fn(),
    } as unknown as Graph;

    const pages = await parseDrawioToPages(emptyPageXml, mockGraph);
    expect(pages).toHaveLength(1);
    expect(pages[0].name).toBe('Empty Page');
    expect(pages[0].data).toBe('');
  });
});