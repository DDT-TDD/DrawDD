import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { DiagramTypeSelector } from './DiagramTypeSelector';
import { useGraph } from '../context/GraphContext';
import { applyColorSchemeToGraph } from '../utils/colorSchemeApplication';

jest.mock('../context/GraphContext', () => ({
  useGraph: jest.fn(),
}));

jest.mock('../utils/colorSchemeApplication', () => ({
  applyColorSchemeToGraph: jest.fn(),
}));

const mockUseGraph = useGraph as jest.MockedFunction<typeof useGraph>;
const mockApplyColorSchemeToGraph = applyColorSchemeToGraph as jest.MockedFunction<typeof applyColorSchemeToGraph>;

describe('DiagramTypeSelector Venn templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies the active Venn theme when creating a Venn template', () => {
    const graph = {
      clearCells: jest.fn(),
      addNode: jest.fn(() => ({ setZIndex: jest.fn() })),
      addEdge: jest.fn(),
      centerContent: jest.fn(),
    };

    mockUseGraph.mockReturnValue({
      graph: graph as never,
      colorScheme: 'ocean-breeze',
      setMode: jest.fn(),
      mindmapShowArrows: true,
      mindmapStrokeWidth: 2,
      mindmapConnectorStyle: 'smooth',
    } as unknown as ReturnType<typeof useGraph>);

    render(<DiagramTypeSelector />);

    fireEvent.click(screen.getByRole('button', { name: /New Diagram/i }));
    fireEvent.click(screen.getByRole('button', { name: /Venn Diagram Overlapping sets with shared regions/i }));
    fireEvent.click(screen.getByRole('button', { name: /2-Set Comparison/i }));

    expect(graph.clearCells).toHaveBeenCalledTimes(1);
    expect(graph.addNode).toHaveBeenCalled();
    expect(mockApplyColorSchemeToGraph).toHaveBeenCalledWith(
      graph,
      expect.objectContaining({ id: 'ocean-breeze' }),
    );
  });
});