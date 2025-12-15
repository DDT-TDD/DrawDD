import { Graph, Node } from '@antv/x6';

// Register custom logic gate shapes with proper ANSI/IEEE symbols
export function registerLogicGateShapes() {
  // AND Gate - D-shape with flat left side
  Graph.registerNode(
    'and-gate',
    {
      inherit: 'rect',
      width: 80,
      height: 50,
      attrs: {
        body: {
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          fill: '#000000',
          fontSize: 12,
        },
      },
      markup: [
        {
          tagName: 'path',
          selector: 'body',
        },
        {
          tagName: 'text',
          selector: 'label',
        },
      ],
      attrHooks: {
        // Custom path for AND gate shape
      },
    },
    true
  );

  // Create AND gate with proper D-shape
  Node.registry.register(
    'logic-and',
    {
      width: 80,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'path',
              selector: 'body',
            },
            {
              tagName: 'line',
              selector: 'input1',
            },
            {
              tagName: 'line',
              selector: 'input2',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        body: {
          // AND gate: flat left, curved right (D-shape)
          d: 'M 0 0 L 0 50 L 40 50 Q 80 50 80 25 Q 80 0 40 0 Z',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input1: {
          x1: -15, y1: 15, x2: 0, y2: 15,
          stroke: '#000000',
          strokeWidth: 2,
        },
        input2: {
          x1: -15, y1: 35, x2: 0, y2: 35,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 80, y1: 25, x2: 95, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.4,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in1', args: { y: 15 } },
          { group: 'in', id: 'in2', args: { y: 35 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );

  // OR gate with curved shield shape
  Node.registry.register(
    'logic-or',
    {
      width: 80,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'path',
              selector: 'body',
            },
            {
              tagName: 'line',
              selector: 'input1',
            },
            {
              tagName: 'line',
              selector: 'input2',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        body: {
          // OR gate: curved left concave, pointed right
          d: 'M 0 0 Q 20 25 0 50 Q 40 50 60 25 Q 40 0 0 0 Z',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input1: {
          x1: -15, y1: 12, x2: 8, y2: 12,
          stroke: '#000000',
          strokeWidth: 2,
        },
        input2: {
          x1: -15, y1: 38, x2: 8, y2: 38,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 60, y1: 25, x2: 75, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.35,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in1', args: { y: 12 } },
          { group: 'in', id: 'in2', args: { y: 38 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );

  // NOT gate (Inverter) - Triangle with circle
  Node.registry.register(
    'logic-not',
    {
      width: 70,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'polygon',
              selector: 'body',
            },
            {
              tagName: 'circle',
              selector: 'bubble',
            },
            {
              tagName: 'line',
              selector: 'input',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        body: {
          points: '0,0 50,25 0,50',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        bubble: {
          cx: 55,
          cy: 25,
          r: 5,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input: {
          x1: -15, y1: 25, x2: 0, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 60, y1: 25, x2: 75, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.25,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in', args: { y: 25 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );

  // NAND gate - AND with bubble
  Node.registry.register(
    'logic-nand',
    {
      width: 90,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'path',
              selector: 'body',
            },
            {
              tagName: 'circle',
              selector: 'bubble',
            },
            {
              tagName: 'line',
              selector: 'input1',
            },
            {
              tagName: 'line',
              selector: 'input2',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        body: {
          d: 'M 0 0 L 0 50 L 40 50 Q 75 50 75 25 Q 75 0 40 0 Z',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        bubble: {
          cx: 80,
          cy: 25,
          r: 5,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input1: {
          x1: -15, y1: 15, x2: 0, y2: 15,
          stroke: '#000000',
          strokeWidth: 2,
        },
        input2: {
          x1: -15, y1: 35, x2: 0, y2: 35,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 85, y1: 25, x2: 100, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.35,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in1', args: { y: 15 } },
          { group: 'in', id: 'in2', args: { y: 35 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );

  // NOR gate - OR with bubble
  Node.registry.register(
    'logic-nor',
    {
      width: 75,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'path',
              selector: 'body',
            },
            {
              tagName: 'circle',
              selector: 'bubble',
            },
            {
              tagName: 'line',
              selector: 'input1',
            },
            {
              tagName: 'line',
              selector: 'input2',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        body: {
          // NOR gate: same OR shape + bubble
          d: 'M 0 0 Q 20 25 0 50 Q 40 50 55 25 Q 40 0 0 0 Z',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        bubble: {
          cx: 60,
          cy: 25,
          r: 5,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input1: {
          x1: -15, y1: 12, x2: 8, y2: 12,
          stroke: '#000000',
          strokeWidth: 2,
        },
        input2: {
          x1: -15, y1: 38, x2: 8, y2: 38,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 65, y1: 25, x2: 80, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.3,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in1', args: { y: 12 } },
          { group: 'in', id: 'in2', args: { y: 38 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );

  // XOR gate - OR with extra curve
  Node.registry.register(
    'logic-xor',
    {
      width: 70,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'path',
              selector: 'curve',
            },
            {
              tagName: 'path',
              selector: 'body',
            },
            {
              tagName: 'line',
              selector: 'input1',
            },
            {
              tagName: 'line',
              selector: 'input2',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        curve: {
          // Extra curve at input
          d: 'M -8 0 Q 12 25 -8 50',
          fill: 'none',
          stroke: '#000000',
          strokeWidth: 2,
        },
        body: {
          d: 'M 0 0 Q 20 25 0 50 Q 40 50 60 25 Q 40 0 0 0 Z',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input1: {
          x1: -20, y1: 12, x2: 5, y2: 12,
          stroke: '#000000',
          strokeWidth: 2,
        },
        input2: {
          x1: -20, y1: 38, x2: 5, y2: 38,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 60, y1: 25, x2: 75, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.35,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in1', args: { y: 12 } },
          { group: 'in', id: 'in2', args: { y: 38 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );

  // XNOR gate - XOR with bubble
  Node.registry.register(
    'logic-xnor',
    {
      width: 80,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'path',
              selector: 'curve',
            },
            {
              tagName: 'path',
              selector: 'body',
            },
            {
              tagName: 'circle',
              selector: 'bubble',
            },
            {
              tagName: 'line',
              selector: 'input1',
            },
            {
              tagName: 'line',
              selector: 'input2',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        curve: {
          d: 'M -8 0 Q 12 25 -8 50',
          fill: 'none',
          stroke: '#000000',
          strokeWidth: 2,
        },
        body: {
          d: 'M 0 0 Q 20 25 0 50 Q 40 50 55 25 Q 40 0 0 0 Z',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        bubble: {
          cx: 60,
          cy: 25,
          r: 5,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input1: {
          x1: -20, y1: 12, x2: 5, y2: 12,
          stroke: '#000000',
          strokeWidth: 2,
        },
        input2: {
          x1: -20, y1: 38, x2: 5, y2: 38,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 65, y1: 25, x2: 80, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.3,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in1', args: { y: 12 } },
          { group: 'in', id: 'in2', args: { y: 38 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );

  // Buffer - Triangle without bubble
  Node.registry.register(
    'logic-buffer',
    {
      width: 60,
      height: 50,
      markup: [
        {
          tagName: 'g',
          selector: 'wrap',
          children: [
            {
              tagName: 'polygon',
              selector: 'body',
            },
            {
              tagName: 'line',
              selector: 'input',
            },
            {
              tagName: 'line',
              selector: 'output',
            },
            {
              tagName: 'text',
              selector: 'label',
            },
          ],
        },
      ],
      attrs: {
        body: {
          points: '0,0 50,25 0,50',
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        },
        input: {
          x1: -15, y1: 25, x2: 0, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        output: {
          x1: 50, y1: 25, x2: 65, y2: 25,
          stroke: '#000000',
          strokeWidth: 2,
        },
        label: {
          text: '',
          refX: 0.25,
          refY: 0.5,
          textAnchor: 'middle',
          textVerticalAnchor: 'middle',
          fill: '#000000',
          fontSize: 12,
        },
      },
      ports: {
        groups: {
          in: {
            position: { name: 'left' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
          out: {
            position: { name: 'right' },
            attrs: { circle: { r: 4, magnet: true, stroke: '#000', fill: '#fff' } },
          },
        },
        items: [
          { group: 'in', id: 'in', args: { y: 25 } },
          { group: 'out', id: 'out', args: { y: 25 } },
        ],
      },
    },
    true
  );
}

// Export shape configurations for the sidebar
export const LOGIC_GATE_SHAPES = [
  { type: 'logic-and', label: 'AND Gate', width: 80, height: 50 },
  { type: 'logic-or', label: 'OR Gate', width: 70, height: 50 },
  { type: 'logic-not', label: 'NOT Gate', width: 70, height: 50 },
  { type: 'logic-nand', label: 'NAND Gate', width: 90, height: 50 },
  { type: 'logic-nor', label: 'NOR Gate', width: 75, height: 50 },
  { type: 'logic-xor', label: 'XOR Gate', width: 70, height: 50 },
  { type: 'logic-xnor', label: 'XNOR Gate', width: 80, height: 50 },
  { type: 'logic-buffer', label: 'Buffer', width: 60, height: 50 },
];
