import { describe, expect, it } from '@jest/globals';

import { getDocumentMode, inferDiagramModeFromPageData } from './importExport';

describe('Venn mode inference', () => {
  it('preserves venn mode when explicit venn metadata remains after shape conversion', () => {
    const mode = getDocumentMode({
      type: 'diagram',
      nodes: [
        {
          shape: 'rect',
          data: { isVenn: true },
          attrs: { body: { fillOpacity: 0.3 } },
        },
      ],
      edges: [],
    } as any);

    expect(mode).toBe('venn');
  });

  it('infers venn mode from page data even when the set is no longer an ellipse', () => {
    const pageData = JSON.stringify({
      cells: [
        {
          shape: 'rect',
          data: { isVenn: true },
          attrs: { body: { fillOpacity: 0.25 } },
        },
      ],
    });

    expect(inferDiagramModeFromPageData(pageData)).toBe('venn');
  });
});