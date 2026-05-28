import { describe, expect, it } from '@jest/globals';

jest.mock('./text', () => ({
  setNodeLabelWithAutoSize: jest.fn((node) => node),
}));

import { importKityMinder, resolveMindmapNodeStyle } from './importExport';

describe('KityMinder import styling', () => {
  it('maps KityMinder color aliases into visible mindmap styles', async () => {
    const kmJson = {
      root: {
        data: {
          id: 'root-node',
          text: 'Visible Topic',
          background: '#f5f7fa',
          color: '#263238',
          'font-family': 'Courier New',
          'font-size': 18,
          'font-weight': 'bold',
          'font-style': 'italic',
        },
        children: [],
      },
    };

    const file = new File([JSON.stringify(kmJson)], 'topic.km', { type: 'application/json' });
    const root = await importKityMinder(file);

    expect(root.topic).toBe('Visible Topic');
    expect(root.style).toEqual({
      backgroundColor: '#f5f7fa',
      textColor: '#263238',
      fontFamily: 'Courier New',
      fontSize: 18,
      bold: true,
      italic: true,
    });
  });

  it('normalizes array-based Kity text payloads into visible labels', async () => {
    const kmJson = {
      root: {
        data: {
          id: 'array-text-root',
          text: ['Parent line', 'Child line'],
        },
        children: [],
      },
    };

    const file = new File([JSON.stringify(kmJson)], 'array-topic.km', { type: 'application/json' });
    const root = await importKityMinder(file);

    expect(root.topic).toBe('Parent line\nChild line');
  });

  it('chooses a readable label color when KityMinder omits one', () => {
    const style = resolveMindmapNodeStyle(
      {
        id: 'child-node',
        topic: 'Contrast Topic',
        style: {
          backgroundColor: '#1f2937',
        },
      },
      '#42a5f5',
      '#ffffff',
    );

    expect(style.backgroundColor).toBe('#1f2937');
    expect(style.textColor).toBe('#ffffff');
  });
});