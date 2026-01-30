import type { ShapeConfig } from '../types';

// 16-port configuration for maximum connection flexibility
export const FULL_PORTS_CONFIG = {
  groups: {
    top: { position: 'top', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    topRight: { position: { name: 'absolute', args: { x: '100%', y: '0%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    right: { position: 'right', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    bottomRight: { position: { name: 'absolute', args: { x: '100%', y: '100%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    bottom: { position: 'bottom', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    bottomLeft: { position: { name: 'absolute', args: { x: '0%', y: '100%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    left: { position: 'left', attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    topLeft: { position: { name: 'absolute', args: { x: '0%', y: '0%' } }, attrs: { circle: { r: 4, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    topMid1: { position: { name: 'absolute', args: { x: '25%', y: '0%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    topMid2: { position: { name: 'absolute', args: { x: '75%', y: '0%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    rightMid1: { position: { name: 'absolute', args: { x: '100%', y: '25%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    rightMid2: { position: { name: 'absolute', args: { x: '100%', y: '75%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    bottomMid1: { position: { name: 'absolute', args: { x: '25%', y: '100%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    bottomMid2: { position: { name: 'absolute', args: { x: '75%', y: '100%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    leftMid1: { position: { name: 'absolute', args: { x: '0%', y: '25%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
    leftMid2: { position: { name: 'absolute', args: { x: '0%', y: '75%' } }, attrs: { circle: { r: 3, magnet: true, stroke: '#5F95FF', strokeWidth: 1.5, fill: '#fff' } } },
  },
  items: [
    { group: 'top', id: 'top' },
    { group: 'topRight', id: 'topRight' },
    { group: 'right', id: 'right' },
    { group: 'bottomRight', id: 'bottomRight' },
    { group: 'bottom', id: 'bottom' },
    { group: 'bottomLeft', id: 'bottomLeft' },
    { group: 'left', id: 'left' },
    { group: 'topLeft', id: 'topLeft' },
    { group: 'topMid1', id: 'topMid1' },
    { group: 'topMid2', id: 'topMid2' },
    { group: 'rightMid1', id: 'rightMid1' },
    { group: 'rightMid2', id: 'rightMid2' },
    { group: 'bottomMid1', id: 'bottomMid1' },
    { group: 'bottomMid2', id: 'bottomMid2' },
    { group: 'leftMid1', id: 'leftMid1' },
    { group: 'leftMid2', id: 'leftMid2' },
  ],
};

export const FLOWCHART_SHAPES: ShapeConfig[] = [
  {
    type: 'rect',
    label: 'Process',
    icon: 'square',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        rx: 6,
        ry: 6,
      },
      label: {
        text: 'Process',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'ellipse',
    label: 'Start/End',
    icon: 'circle',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#e8f5e9',
        stroke: '#4caf50',
        strokeWidth: 2,
      },
      label: {
        text: 'Start',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Decision',
    icon: 'diamond',
    width: 100,
    height: 100,
    attrs: {
      body: {
        fill: '#fff3e0',
        stroke: '#ff9800',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
      },
      label: {
        text: 'Decision',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
  {
    type: 'rect',
    label: 'Data',
    icon: 'database',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#e3f2fd',
        stroke: '#2196f3',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Data',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Document',
    icon: 'file-text',
    width: 120,
    height: 70,
    attrs: {
      body: {
        fill: '#fce4ec',
        stroke: '#e91e63',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Document',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Manual Input',
    icon: 'edit',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#f3e5f5',
        stroke: '#9c27b0',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Input',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  // Additional Flowchart Shapes
  {
    type: 'rect',
    label: 'Preparation',
    icon: 'hexagon',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#e0f7fa',
        stroke: '#00bcd4',
        strokeWidth: 2,
        rx: 15,
        ry: 15,
      },
      label: {
        text: 'Preparation',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Predefined Process',
    icon: 'layers',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#fff8e1',
        stroke: '#ffc107',
        strokeWidth: 3,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Subprocess',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Delay',
    icon: 'clock',
    width: 100,
    height: 50,
    attrs: {
      body: {
        fill: '#fbe9e7',
        stroke: '#ff5722',
        strokeWidth: 2,
        rx: 25,
        ry: 25,
      },
      label: {
        text: 'Delay',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'circle',
    label: 'Connector',
    icon: 'circle',
    width: 40,
    height: 40,
    attrs: {
      body: {
        fill: '#e8eaf6',
        stroke: '#3f51b5',
        strokeWidth: 2,
      },
      label: {
        text: 'A',
        fill: '#333333',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
  },
  {
    type: 'rect',
    label: 'Database',
    icon: 'database',
    width: 80,
    height: 80,
    attrs: {
      body: {
        fill: '#e3f2fd',
        stroke: '#1976d2',
        strokeWidth: 2,
        rx: 0,
        ry: 20,
      },
      label: {
        text: 'Database',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
  {
    type: 'rect',
    label: 'Comment',
    icon: 'message-square',
    width: 140,
    height: 70,
    attrs: {
      body: {
        fill: '#fffde7',
        stroke: '#fbc02d',
        strokeWidth: 1,
        strokeDasharray: '4 2',
        rx: 4,
        ry: 4,
      },
      label: {
        text: 'Add comment...',
        fill: '#666666',
        fontSize: 12,
        fontStyle: 'italic',
      },
    },
  },
];

// Arrow and Line Shapes
export const ARROW_SHAPES: ShapeConfig[] = [
  {
    type: 'polygon',
    label: 'Arrow Right',
    icon: 'arrow-right',
    width: 100,
    height: 50,
    attrs: {
      body: {
        fill: '#bbdefb',
        stroke: '#1976d2',
        strokeWidth: 2,
        refPoints: '0,0.2 0.7,0.2 0.7,0 1,0.5 0.7,1 0.7,0.8 0,0.8',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Arrow Left',
    icon: 'arrow-left',
    width: 100,
    height: 50,
    attrs: {
      body: {
        fill: '#c8e6c9',
        stroke: '#388e3c',
        strokeWidth: 2,
        refPoints: '0,0.5 0.3,0 0.3,0.2 1,0.2 1,0.8 0.3,0.8 0.3,1',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Arrow Up',
    icon: 'arrow-up',
    width: 50,
    height: 100,
    attrs: {
      body: {
        fill: '#ffecb3',
        stroke: '#ffa000',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.3 0.8,0.3 0.8,1 0.2,1 0.2,0.3 0,0.3',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Arrow Down',
    icon: 'arrow-down',
    width: 50,
    height: 100,
    attrs: {
      body: {
        fill: '#f8bbd9',
        stroke: '#c2185b',
        strokeWidth: 2,
        refPoints: '0.2,0 0.8,0 0.8,0.7 1,0.7 0.5,1 0,0.7 0.2,0.7',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Double Arrow',
    icon: 'move-horizontal',
    width: 120,
    height: 40,
    attrs: {
      body: {
        fill: '#d1c4e9',
        stroke: '#673ab7',
        strokeWidth: 2,
        refPoints: '0,0.5 0.15,0 0.15,0.25 0.85,0.25 0.85,0 1,0.5 0.85,1 0.85,0.75 0.15,0.75 0.15,1',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Chevron',
    icon: 'chevron-right',
    width: 100,
    height: 50,
    attrs: {
      body: {
        fill: '#b2ebf2',
        stroke: '#00838f',
        strokeWidth: 2,
        refPoints: '0,0 0.8,0 1,0.5 0.8,1 0,1 0.2,0.5',
      },
      label: {
        text: 'Step',
        fill: '#333333',
        fontSize: 12,
      },
    },
  },
];

// Callout Shapes
export const CALLOUT_SHAPES: ShapeConfig[] = [
  {
    type: 'rect',
    label: 'Callout Box',
    icon: 'message-circle',
    width: 140,
    height: 80,
    attrs: {
      body: {
        fill: '#fffde7',
        stroke: '#f9a825',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'Note',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Info Box',
    icon: 'info',
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: '#e3f2fd',
        stroke: '#1976d2',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: 'ℹ️ Information',
        fill: '#1565c0',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Warning Box',
    icon: 'alert-triangle',
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: '#fff3e0',
        stroke: '#ff9800',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: '⚠️ Warning',
        fill: '#e65100',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Success Box',
    icon: 'check-circle',
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: '#e8f5e9',
        stroke: '#4caf50',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: '✓ Success',
        fill: '#2e7d32',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Error Box',
    icon: 'x-circle',
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: '#ffebee',
        stroke: '#f44336',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: '✗ Error',
        fill: '#c62828',
        fontSize: 14,
      },
    },
  },
];

// Container and Swimlane Shapes
export const CONTAINER_SHAPES: ShapeConfig[] = [
  {
    type: 'rect',
    label: 'Container',
    icon: 'box',
    width: 300,
    height: 200,
    attrs: {
      body: {
        fill: '#fafafa',
        stroke: '#9e9e9e',
        strokeWidth: 2,
        strokeDasharray: '8 4',
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'Container',
        fill: '#666666',
        fontSize: 14,
        refY: 15,
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
      },
    },
  },
  {
    type: 'rect',
    label: 'Swimlane Horizontal',
    icon: 'columns',
    width: 400,
    height: 120,
    attrs: {
      body: {
        fill: '#f5f5f5',
        stroke: '#616161',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Lane',
        fill: '#333333',
        fontSize: 14,
        refX: 30,
        refY: '50%',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
    },
  },
  {
    type: 'rect',
    label: 'Swimlane Vertical',
    icon: 'rows',
    width: 120,
    height: 400,
    attrs: {
      body: {
        fill: '#f5f5f5',
        stroke: '#616161',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Lane',
        fill: '#333333',
        fontSize: 14,
        refX: '50%',
        refY: 20,
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
      },
    },
  },
  {
    type: 'rect',
    label: 'Group',
    icon: 'folder',
    width: 250,
    height: 180,
    attrs: {
      body: {
        fill: 'rgba(66, 165, 245, 0.1)',
        stroke: '#42a5f5',
        strokeWidth: 2,
        rx: 12,
        ry: 12,
      },
      label: {
        text: 'Group',
        fill: '#1976d2',
        fontSize: 14,
        refY: 15,
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
        fontWeight: 'bold',
      },
    },
  },
  {
    type: 'rect',
    label: 'Phase',
    icon: 'git-branch',
    width: 200,
    height: 300,
    attrs: {
      body: {
        fill: 'rgba(156, 39, 176, 0.05)',
        stroke: '#9c27b0',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: 'Phase 1',
        fill: '#7b1fa2',
        fontSize: 14,
        refY: 15,
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
        fontWeight: 'bold',
      },
    },
  },
];

// Org Chart Shapes
export const ORGCHART_SHAPES: ShapeConfig[] = [
  {
    type: 'rect',
    label: 'Executive',
    icon: 'user',
    width: 140,
    height: 70,
    attrs: {
      body: {
        fill: '#1565c0',
        stroke: '#0d47a1',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'CEO\nName',
        fill: '#ffffff',
        fontSize: 13,
      },
    },
  },
  {
    type: 'rect',
    label: 'Manager',
    icon: 'user-check',
    width: 130,
    height: 60,
    attrs: {
      body: {
        fill: '#42a5f5',
        stroke: '#1e88e5',
        strokeWidth: 2,
        rx: 6,
        ry: 6,
      },
      label: {
        text: 'Manager\nName',
        fill: '#ffffff',
        fontSize: 12,
      },
    },
  },
  {
    type: 'rect',
    label: 'Employee',
    icon: 'user',
    width: 120,
    height: 50,
    attrs: {
      body: {
        fill: '#90caf9',
        stroke: '#64b5f6',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      },
      label: {
        text: 'Employee',
        fill: '#1565c0',
        fontSize: 12,
      },
    },
  },
  {
    type: 'rect',
    label: 'Department',
    icon: 'briefcase',
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: '#e3f2fd',
        stroke: '#1976d2',
        strokeWidth: 3,
        rx: 10,
        ry: 10,
      },
      label: {
        text: 'Department',
        fill: '#0d47a1',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
  },
];

// Basic Shapes
export const BASIC_SHAPES: ShapeConfig[] = [
  {
    type: 'rect',
    label: 'Rectangle',
    icon: 'square',
    width: 100,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Rounded Rectangle',
    icon: 'square',
    width: 100,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        rx: 15,
        ry: 15,
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'ellipse',
    label: 'Ellipse',
    icon: 'circle',
    width: 100,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'circle',
    label: 'Circle',
    icon: 'circle',
    width: 60,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Triangle',
    icon: 'triangle',
    width: 80,
    height: 70,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        refPoints: '0.5,0 1,1 0,1',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Pentagon',
    icon: 'pentagon',
    width: 80,
    height: 80,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.38 0.81,1 0.19,1 0,0.38',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Hexagon',
    icon: 'hexagon',
    width: 90,
    height: 80,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        refPoints: '0.25,0 0.75,0 1,0.5 0.75,1 0.25,1 0,0.5',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Star',
    icon: 'star',
    width: 80,
    height: 80,
    attrs: {
      body: {
        fill: '#fff9c4',
        stroke: '#fbc02d',
        strokeWidth: 2,
        refPoints: '0.5,0 0.61,0.35 1,0.35 0.68,0.57 0.79,0.91 0.5,0.7 0.21,0.91 0.32,0.57 0,0.35 0.39,0.35',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Parallelogram',
    icon: 'move',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        refPoints: '0.2,0 1,0 0.8,1 0,1',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'polygon',
    label: 'Trapezoid',
    icon: 'move',
    width: 120,
    height: 60,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        refPoints: '0.2,0 0.8,0 1,1 0,1',
      },
      label: {
        text: '',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'image',
    width: 120,
    height: 120,
    attrs: {
      body: {
        fill: '#f5f5f5',
        stroke: '#e0e0e0',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
      },
      label: {
        text: '',
        fill: '#666666',
        fontSize: 12,
        refY: '100%',
        refY2: 5,
        textAnchor: 'middle',
        textVerticalAnchor: 'top',
      },
      image: {
        xlinkHref: '',
        width: 120,
        height: 120,
        refX: 0,
        refY: 0,
        preserveAspectRatio: 'xMidYMid slice',
      },
    },
    ports: FULL_PORTS_CONFIG,
  },
];

export const MINDMAP_SHAPES: ShapeConfig[] = [
  {
    type: 'rich-content-node',
    label: 'Central Topic',
    icon: 'layout',
    width: 160,
    height: 80,
    attrs: {
      body: {
        fill: '#1976d2',
        stroke: '#0d47a1',
        strokeWidth: 2,
        rx: 10,
        ry: 10,
      },
      label: {
        text: 'Central Topic',
        fill: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    data: { isMindmap: true, level: 0, mmOrder: 1 },
    ports: FULL_PORTS_CONFIG,
  },
  {
    type: 'rich-content-node',
    label: 'Main Topic',
    icon: 'git-branch',
    width: 140,
    height: 50,
    attrs: {
      body: {
        fill: '#42a5f5',
        stroke: '#1e88e5',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: 'Main Topic',
        fill: '#ffffff',
        fontSize: 14,
      },
    },
    data: { isMindmap: true, level: 1, mmOrder: 1 },
    ports: FULL_PORTS_CONFIG,
  },
  {
    type: 'rich-content-node',
    label: 'Subtopic',
    icon: 'minus',
    width: 120,
    height: 40,
    attrs: {
      body: {
        fill: '#90caf9',
        stroke: '#64b5f6',
        strokeWidth: 1,
        rx: 6,
        ry: 6,
      },
      label: {
        text: 'Subtopic',
        fill: '#333333',
        fontSize: 12,
      },
    },
    data: { isMindmap: true, level: 2, mmOrder: 1 },
    ports: FULL_PORTS_CONFIG,
  },
];

// Timeline Shapes - for creating timelines and chronological diagrams
// Enhanced with vibrant colors and distinct styling
export const TIMELINE_SHAPES: ShapeConfig[] = [
  {
    type: 'rect',
    label: '📅 Event',
    icon: 'clock',
    width: 150,
    height: 55,
    attrs: {
      body: {
        fill: '#1e88e5',
        stroke: '#0d47a1',
        strokeWidth: 3,
        rx: 10,
        ry: 10,
      },
      label: {
        text: '📅 Event',
        fill: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
    data: { isTimeline: true, eventType: 'event' },
    ports: FULL_PORTS_CONFIG,
  },
  {
    type: 'ellipse',
    label: '⭐ Milestone',
    icon: 'star',
    width: 90,
    height: 90,
    attrs: {
      body: {
        fill: '#ff9800',
        stroke: '#e65100',
        strokeWidth: 3,
      },
      label: {
        text: '⭐ Milestone',
        fill: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
      },
    },
    data: { isTimeline: true, eventType: 'milestone' },
    ports: FULL_PORTS_CONFIG,
  },
  {
    type: 'rect',
    label: '📊 Period',
    icon: 'move-horizontal',
    width: 200,
    height: 65,
    attrs: {
      body: {
        fill: '#7b1fa2',
        stroke: '#4a0072',
        strokeWidth: 3,
        rx: 6,
        ry: 6,
      },
      label: {
        text: '📊 Period',
        fill: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
      },
    },
    data: { isTimeline: true, eventType: 'period' },
    ports: FULL_PORTS_CONFIG,
  },
  {
    type: 'polygon',
    label: '❓ Decision',
    icon: 'diamond',
    width: 95,
    height: 95,
    attrs: {
      body: {
        fill: '#d32f2f',
        stroke: '#b71c1c',
        strokeWidth: 3,
        refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
      },
      label: {
        text: '❓',
        fill: '#ffffff',
        fontSize: 18,
      },
    },
    data: { isTimeline: true, eventType: 'decision' },
    ports: FULL_PORTS_CONFIG,
  },
  {
    type: 'rect',
    label: '🏁 Phase',
    icon: 'layers',
    width: 160,
    height: 75,
    attrs: {
      body: {
        fill: '#2e7d32',
        stroke: '#1b5e20',
        strokeWidth: 3,
        rx: 12,
        ry: 12,
      },
      label: {
        text: '🏁 Phase',
        fill: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
      },
    },
    data: { isTimeline: true, eventType: 'phase' },
    ports: FULL_PORTS_CONFIG,
  },
  {
    type: 'rect',
    label: '✅ Task',
    icon: 'check-circle',
    width: 130,
    height: 50,
    attrs: {
      body: {
        fill: '#00897b',
        stroke: '#004d40',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
      },
      label: {
        text: '✅ Task',
        fill: '#ffffff',
        fontSize: 13,
        fontWeight: 'bold',
      },
    },
    data: { isTimeline: true, eventType: 'task' },
    ports: FULL_PORTS_CONFIG,
  },
];

// Logic / Fault Tree Shapes - Using proper ANSI/IEEE standard gate symbols
// These use custom registered shapes with actual gate drawings
export const LOGIC_SHAPES: ShapeConfig[] = [
  // ====== ANSI/IEEE Standard Logic Gates (proper symbols) ======
  {
    type: 'logic-and',
    label: 'AND Gate',
    icon: 'git-merge',
    width: 80,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },
  {
    type: 'logic-or',
    label: 'OR Gate',
    icon: 'git-branch',
    width: 70,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },
  {
    type: 'logic-not',
    label: 'NOT Gate',
    icon: 'triangle',
    width: 70,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },
  {
    type: 'logic-nand',
    label: 'NAND Gate',
    icon: 'git-merge',
    width: 90,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },
  {
    type: 'logic-nor',
    label: 'NOR Gate',
    icon: 'git-branch',
    width: 75,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },
  {
    type: 'logic-xor',
    label: 'XOR Gate',
    icon: 'x-circle',
    width: 70,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },
  {
    type: 'logic-xnor',
    label: 'XNOR Gate',
    icon: 'check-circle',
    width: 80,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },
  {
    type: 'logic-buffer',
    label: 'Buffer',
    icon: 'arrow-right',
    width: 60,
    height: 50,
    attrs: {
      body: { fill: '#ffffff', stroke: '#000000', strokeWidth: 2 },
      label: { text: '', fill: '#000000', fontSize: 12 },
    },
  },

  // ====== Fault Tree Analysis (FTA) Events ======
  // Basic Event - Circle (IEC 61025)
  {
    type: 'circle',
    label: 'Basic Event',
    icon: 'circle',
    width: 50,
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
  },
  // Undeveloped Event - Diamond (IEC 61025)
  {
    type: 'polygon',
    label: 'Undeveloped Event',
    icon: 'diamond',
    width: 50,
    height: 50,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
      },
      label: {
        text: '',
        fill: '#000000',
        fontSize: 12,
      },
    },
  },
  // House Event - Pentagon (house shape) for external/expected events
  {
    type: 'polygon',
    label: 'House Event',
    icon: 'home',
    width: 50,
    height: 55,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.35 1,1 0,1 0,0.35',
      },
      label: {
        text: '',
        fill: '#000000',
        fontSize: 12,
      },
    },
  },
  // Conditioning Event - Oval/Ellipse
  {
    type: 'ellipse',
    label: 'Conditioning Event',
    icon: 'more-horizontal',
    width: 70,
    height: 40,
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
  },
  // Intermediate Event - Rectangle (IEC 61025)
  {
    type: 'rect',
    label: 'Intermediate Event',
    icon: 'square',
    width: 80,
    height: 50,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: '',
        fill: '#000000',
        fontSize: 12,
      },
    },
  },
  // Transfer In - Triangle pointing down
  {
    type: 'polygon',
    label: 'Transfer In',
    icon: 'arrow-down',
    width: 40,
    height: 40,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        refPoints: '0,0 1,0 0.5,1',
      },
      label: {
        text: '',
        fill: '#000000',
        fontSize: 12,
      },
    },
  },
  // Transfer Out - Triangle pointing up
  {
    type: 'polygon',
    label: 'Transfer Out',
    icon: 'arrow-up',
    width: 40,
    height: 40,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        refPoints: '0.5,0 1,1 0,1',
      },
      label: {
        text: '',
        fill: '#000000',
        fontSize: 12,
      },
    },
  },
  // Priority AND Gate - AND with priority marker
  {
    type: 'rect',
    label: 'Priority AND',
    icon: 'git-merge',
    width: 70,
    height: 50,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: '&>',
        fill: '#000000',
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
      },
    },
  },
  // Inhibit Gate - Hexagon shape
  {
    type: 'polygon',
    label: 'Inhibit Gate',
    icon: 'hexagon',
    width: 60,
    height: 70,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        refPoints: '0.5,0 1,0.25 1,0.75 0.5,1 0,0.75 0,0.25',
      },
      label: {
        text: '',
        fill: '#000000',
        fontSize: 12,
      },
    },
  },
  // Voting Gate (k/n) - OR gate variant
  {
    type: 'rect',
    label: 'Voting Gate',
    icon: 'hash',
    width: 70,
    height: 50,
    attrs: {
      body: {
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 2,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'k/n',
        fill: '#000000',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
      },
    },
  },
];

// Text boxes
export const TEXT_SHAPES: ShapeConfig[] = [
  {
    type: 'rect',
    label: 'Text Box',
    icon: 'type',
    width: 150,
    height: 40,
    attrs: {
      body: {
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Text',
        fill: '#333333',
        fontSize: 14,
      },
    },
  },
  {
    type: 'rect',
    label: 'Title',
    icon: 'heading',
    width: 200,
    height: 50,
    attrs: {
      body: {
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Title',
        fill: '#1e293b',
        fontSize: 24,
      },
    },
  },
  {
    type: 'rect',
    label: 'Subtitle',
    icon: 'text',
    width: 180,
    height: 35,
    attrs: {
      body: {
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Subtitle',
        fill: '#475569',
        fontSize: 18,
      },
    },
  },
  {
    type: 'rect',
    label: 'Note Box',
    icon: 'sticky-note',
    width: 150,
    height: 100,
    attrs: {
      body: {
        fill: '#fef9c3',
        stroke: '#eab308',
        strokeWidth: 1,
        rx: 0,
        ry: 0,
      },
      label: {
        text: 'Note',
        fill: '#713f12',
        fontSize: 12,
      },
    },
  },
  {
    type: 'rect',
    label: 'Comment',
    icon: 'message-square',
    width: 140,
    height: 80,
    attrs: {
      body: {
        fill: '#f0f9ff',
        stroke: '#0ea5e9',
        strokeWidth: 1,
        strokeDasharray: '4 2',
        rx: 4,
        ry: 4,
      },
      label: {
        text: 'Comment',
        fill: '#0369a1',
        fontSize: 12,
      },
    },
  },
];

export const CONNECTOR_STYLES = {
  normal: {
    line: {
      stroke: '#333333',
      strokeWidth: 2,
      targetMarker: {
        name: 'block',
        width: 12,
        height: 8,
      },
    },
  },
  dashed: {
    line: {
      stroke: '#666666',
      strokeWidth: 2,
      strokeDasharray: '5 5',
      targetMarker: {
        name: 'block',
        width: 12,
        height: 8,
      },
    },
  },
  curved: {
    line: {
      stroke: '#333333',
      strokeWidth: 2,
      targetMarker: {
        name: 'block',
        width: 12,
        height: 8,
      },
    },
  },
};

export const COLOR_PALETTE = [
  '#ffffff', '#f5f5f5', '#e0e0e0', '#9e9e9e', '#333333',
  '#ffcdd2', '#ef9a9a', '#ef5350', '#f44336', '#c62828',
  '#f8bbd9', '#f48fb1', '#ec407a', '#e91e63', '#ad1457',
  '#e1bee7', '#ce93d8', '#ab47bc', '#9c27b0', '#6a1b9a',
  '#d1c4e9', '#b39ddb', '#7e57c2', '#673ab7', '#4527a0',
  '#c5cae9', '#9fa8da', '#5c6bc0', '#3f51b5', '#283593',
  '#bbdefb', '#90caf9', '#42a5f5', '#2196f3', '#1565c0',
  '#b3e5fc', '#81d4fa', '#29b6f6', '#03a9f4', '#0277bd',
  '#b2ebf2', '#80deea', '#26c6da', '#00bcd4', '#00838f',
  '#b2dfdb', '#80cbc4', '#26a69a', '#009688', '#00695c',
  '#c8e6c9', '#a5d6a7', '#66bb6a', '#4caf50', '#2e7d32',
  '#dcedc8', '#c5e1a5', '#9ccc65', '#8bc34a', '#558b2f',
  '#f0f4c3', '#e6ee9c', '#d4e157', '#cddc39', '#9e9d24',
  '#fff9c4', '#fff59d', '#ffee58', '#ffeb3b', '#f9a825',
  '#ffecb3', '#ffe082', '#ffca28', '#ffc107', '#ff8f00',
  '#ffe0b2', '#ffcc80', '#ffa726', '#ff9800', '#ef6c00',
  '#ffccbc', '#ffab91', '#ff7043', '#ff5722', '#d84315',
];
