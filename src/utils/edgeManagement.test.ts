import { describe, expect, it, jest } from '@jest/globals';
import type { Graph } from '@antv/x6';
import { QuickConnectManager } from './quickConnect';

describe('Edge Management & QuickConnect Routing Tests', () => {
  afterEach(() => {
    delete (window as any).__drawdd_flowchartConnectorStyle;
    delete (window as any).__drawdd_lineColor;
  });

  it('creates edges with manhattan rounded connector when flowchartConnectorStyle is rounded', () => {
    (window as any).__drawdd_flowchartConnectorStyle = 'rounded';
    (window as any).__drawdd_lineColor = '#123456';

    const addEdgeMock = jest.fn();
    const mockGraph = {
      on: jest.fn(),
      off: jest.fn(),
      addNode: jest.fn().mockReturnValue({
        id: 'new-node',
        getBBox: () => ({ x: 200, y: 100, width: 120, height: 60 }),
      }),
      addEdge: addEdgeMock,
      view: { svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg') },
    } as unknown as Graph;

    const mockSourceNode = {
      id: 'source-node',
      getBBox: () => ({ x: 100, y: 100, width: 120, height: 60 }),
      getData: () => ({}),
      getPorts: () => [{ id: 'right' }],
    };

    const manager = new QuickConnectManager(mockGraph, { colorScheme: 'default' });
    (manager as any).currentNode = mockSourceNode;

    (manager as any).handleArrowClick('right');

    expect(addEdgeMock).toHaveBeenCalledTimes(1);
    const edgeConfig: any = addEdgeMock.mock.calls[0][0];

    expect(edgeConfig.router).toEqual({ name: 'manhattan', args: { padding: 10 } });
    expect(edgeConfig.connector).toEqual({ name: 'rounded', args: { radius: 8 } });
    expect(edgeConfig.attrs.line.stroke).toBe('#123456');
  });

  it('creates edges with smooth connector when flowchartConnectorStyle is smooth', () => {
    (window as any).__drawdd_flowchartConnectorStyle = 'smooth';
    (window as any).__drawdd_lineColor = '#ff0000';

    const addEdgeMock = jest.fn();
    const mockGraph = {
      on: jest.fn(),
      off: jest.fn(),
      addNode: jest.fn().mockReturnValue({
        id: 'new-node',
        getBBox: () => ({ x: 200, y: 100, width: 120, height: 60 }),
      }),
      addEdge: addEdgeMock,
      view: { svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg') },
    } as unknown as Graph;

    const mockSourceNode = {
      id: 'source-node',
      getBBox: () => ({ x: 100, y: 100, width: 120, height: 60 }),
      getData: () => ({}),
      getPorts: () => [{ id: 'right' }],
    };

    const manager = new QuickConnectManager(mockGraph, { colorScheme: 'default' });
    (manager as any).currentNode = mockSourceNode;

    (manager as any).handleArrowClick('right');

    expect(addEdgeMock).toHaveBeenCalledTimes(1);
    const edgeConfig: any = addEdgeMock.mock.calls[0][0];

    expect(edgeConfig.router).toEqual({ name: 'normal' });
    expect(edgeConfig.connector).toEqual({ name: 'smooth' });
    expect(edgeConfig.attrs.line.stroke).toBe('#ff0000');
  });

  it('creates edges with straight connector when flowchartConnectorStyle is straight', () => {
    (window as any).__drawdd_flowchartConnectorStyle = 'straight';

    const addEdgeMock = jest.fn();
    const mockGraph = {
      on: jest.fn(),
      off: jest.fn(),
      addNode: jest.fn().mockReturnValue({
        id: 'new-node',
        getBBox: () => ({ x: 100, y: 200, width: 120, height: 60 }),
      }),
      addEdge: addEdgeMock,
      view: { svg: document.createElementNS('http://www.w3.org/2000/svg', 'svg') },
    } as unknown as Graph;

    const mockSourceNode = {
      id: 'source-node',
      getBBox: () => ({ x: 100, y: 100, width: 120, height: 60 }),
      getData: () => ({}),
      getPorts: () => [{ id: 'bottom' }],
    };

    const manager = new QuickConnectManager(mockGraph, { colorScheme: 'default' });
    (manager as any).currentNode = mockSourceNode;

    (manager as any).handleArrowClick('bottom');

    expect(addEdgeMock).toHaveBeenCalledTimes(1);
    const edgeConfig: any = addEdgeMock.mock.calls[0][0];

    expect(edgeConfig.router).toEqual({ name: 'normal' });
    expect(edgeConfig.connector).toEqual({ name: 'normal' });
  });
});
