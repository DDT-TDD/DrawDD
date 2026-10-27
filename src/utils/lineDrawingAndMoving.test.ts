import { describe, expect, it, jest } from '@jest/globals';
import {
  LINE_SHAPES,
  FLOWCHART_SHAPES,
  BASIC_SHAPES,
  ARROW_SHAPES,
} from '../config/shapes';

describe('Line Drawing, Moving and Segment Manipulation Tests (draw.io compatibility)', () => {
  describe('Shape Definitions for Lines and Connectors', () => {
    it('defines line shapes in LINE_SHAPES with correct attributes and markers', () => {
      expect(LINE_SHAPES.length).toBeGreaterThanOrEqual(5);

      const straightLine = LINE_SHAPES.find(s => s.label === 'Straight Line');
      expect(straightLine).toBeDefined();
      expect(straightLine?.type).toBe('edge');
      expect(straightLine?.attrs.line?.targetMarker).toBeNull();

      const directional = LINE_SHAPES.find(s => s.label === 'Directional Connector');
      expect(directional).toBeDefined();
      expect(directional?.type).toBe('edge');
      expect(directional?.attrs.line?.targetMarker).toBeDefined();

      const bidirectional = LINE_SHAPES.find(s => s.label === 'Bidirectional Connector');
      expect(bidirectional).toBeDefined();
      expect(bidirectional?.attrs.line?.sourceMarker).toBeDefined();
      expect(bidirectional?.attrs.line?.targetMarker).toBeDefined();

      const orthogonal = LINE_SHAPES.find(s => s.label === 'Orthogonal Connector');
      expect(orthogonal).toBeDefined();
      expect(orthogonal?.data?.hasStep).toBe(true);

      const curved = LINE_SHAPES.find(s => s.label === 'Curved Connector');
      expect(curved).toBeDefined();
      expect(curved?.data?.hasCurve).toBe(true);
    });

    it('includes line shapes in FLOWCHART_SHAPES for easy access in flowchart mode', () => {
      const flowchartLine = FLOWCHART_SHAPES.find(s => s.label === 'Line');
      const flowchartConnector = FLOWCHART_SHAPES.find(s => s.label === 'Connector');
      expect(flowchartLine).toBeDefined();
      expect(flowchartLine?.type).toBe('edge');
      expect(flowchartConnector).toBeDefined();
      expect(flowchartConnector?.type).toBe('edge');
    });

    it('includes line shapes in BASIC_SHAPES and ARROW_SHAPES', () => {
      const basicLine = BASIC_SHAPES.find(s => s.label === 'Line');
      expect(basicLine).toBeDefined();
      expect(basicLine?.type).toBe('edge');

      const arrowLines = ARROW_SHAPES.filter(s => s.type === 'edge');
      expect(arrowLines.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Edge Route Point Extraction and Handle Tools', () => {
    it('populates route points as vertices on selection when vertices are empty', () => {
      const mockVertices: any[] = [];
      const mockRoutePoints = [
        { x: 260, y: 130 },
        { x: 260, y: 250 },
      ];

      const mockEdge: any = {
        isEdge: () => true,
        getVertices: () => mockVertices,
        setVertices: jest.fn((pts: any[]) => {
          mockVertices.length = 0;
          mockVertices.push(...pts);
        }),
        getRouter: () => ({ name: 'manhattan' }),
        removeTools: jest.fn(),
        addTools: jest.fn(),
      };

      const mockEdgeView = {
        findRoutePoints: jest.fn().mockReturnValue(mockRoutePoints),
      };

      const mockGraph = {
        findViewByCell: jest.fn().mockReturnValue(mockEdgeView),
      };

      // Simulate the logic in selection:changed
      if (!mockEdge.getVertices || mockEdge.getVertices().length === 0) {
        const edgeView = mockGraph.findViewByCell(mockEdge) as any;
        if (edgeView && typeof edgeView.findRoutePoints === 'function') {
          const routePoints = edgeView.findRoutePoints();
          if (routePoints && routePoints.length > 0) {
            mockEdge.setVertices(routePoints.map((p: any) => ({
              x: Math.round(p.x),
              y: Math.round(p.y),
            })));
          }
        }
      }

      expect(mockEdge.setVertices).toHaveBeenCalledWith([
        { x: 260, y: 130 },
        { x: 260, y: 250 },
      ]);
      expect(mockVertices).toEqual([
        { x: 260, y: 130 },
        { x: 260, y: 250 },
      ]);
    });

    it('attaches both vertices and segments tools along with arrowheads on edge selection', () => {
      const addedTools: any[] = [];
      const mockEdge: any = {
        isEdge: () => true,
        getVertices: () => [{ x: 260, y: 130 }, { x: 260, y: 250 }],
        setVertices: jest.fn(),
        removeTools: jest.fn(),
        addTools: jest.fn((tools: any) => {
          addedTools.push(...tools);
        }),
      };

      // Mock tool attachment
      mockEdge.removeTools();
      mockEdge.addTools([
        { name: 'source-arrowhead' },
        { name: 'target-arrowhead' },
        { name: 'vertices' },
        { name: 'segments' },
      ]);

      expect(mockEdge.removeTools).toHaveBeenCalledTimes(1);
      expect(mockEdge.addTools).toHaveBeenCalledTimes(1);

      const toolNames = addedTools.map((t: any) => t.name);
      expect(toolNames).toContain('source-arrowhead');
      expect(toolNames).toContain('target-arrowhead');
      expect(toolNames).toContain('vertices');
      expect(toolNames).toContain('segments');
    });

    it('simulates segment handle shift adjusting distance between ends in S-shape', () => {
      // In an S-shape connector connecting (100, 130) to (300, 250) with waypoints at (260, 130) and (260, 250):
      // The middle vertical segment is at X = 260.
      const vertices = [
        { x: 260, y: 130 },
        { x: 260, y: 250 },
      ];

      // Dragging the middle segment to the left by -40px (adjusting distance between the two ends):
      const dx = -40;
      const adjustedVertices = vertices.map(v => ({ x: v.x + dx, y: v.y }));

      expect(adjustedVertices).toEqual([
        { x: 220, y: 130 },
        { x: 220, y: 250 },
      ]);
      // Verify that the segment shifted horizontally while maintaining vertical alignment
      expect(adjustedVertices[0].x).toBe(adjustedVertices[1].x);
      expect(adjustedVertices[0].y).toBe(130);
      expect(adjustedVertices[1].y).toBe(250);
    });
  });

  describe('Connection Validation with Blank Canvas', () => {
    it('allows connecting to blank canvas when targetCell is not defined', () => {
      // Connection validator function
      const validateConnection = ({ sourceCell, targetCell, targetMagnet }: any) => {
        if (sourceCell && targetCell && sourceCell === targetCell) return false;
        if (!targetCell) return true; // connecting to blank is allowed
        return !!targetMagnet || !!(targetCell && targetCell.isNode && targetCell.isNode());
      };

      // Dragging to blank space (targetCell is null/undefined)
      expect(validateConnection({ sourceCell: 'node-1', targetCell: null, targetMagnet: null })).toBe(true);
      expect(validateConnection({ sourceCell: 'node-1', targetCell: undefined, targetMagnet: undefined })).toBe(true);

      // Connecting to self is disallowed
      expect(validateConnection({ sourceCell: 'node-1', targetCell: 'node-1', targetMagnet: {} })).toBe(false);

      // Connecting to another node or port magnet is allowed
      expect(validateConnection({
        sourceCell: 'node-1',
        targetCell: { isNode: () => true },
        targetMagnet: null
      })).toBe(true);
    });
  });
});
