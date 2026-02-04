import { useState } from 'react';
import { X, Search, ChevronRight } from 'lucide-react';
import { useGraph } from '../context/GraphContext';
import { applyMindmapLayout, applyTreeLayout } from '../utils/layout';
import { setNodeLabelWithAutoSize } from '../utils/text';
import { FULL_PORTS_CONFIG } from '../config/shapes';

interface ExamplesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExampleDiagram {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  loader: () => void;
}

export function ExamplesDialog({ isOpen, onClose }: ExamplesDialogProps) {
  const { graph, setMode } = useGraph();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const loadFlowchartBasic = () => {
    if (!graph) return;
    graph.clearCells();

    const start = graph.addNode({
      x: 350, y: 50, width: 120, height: 60,
      attrs: { body: { fill: '#e8f5e9', stroke: '#4caf50', strokeWidth: 2, rx: 30, ry: 30 }, label: { text: 'Start', fill: '#333' } },
    });
    const process = graph.addNode({
      x: 350, y: 150, width: 140, height: 70,
      attrs: { body: { fill: '#fff', stroke: '#333', strokeWidth: 2, rx: 6, ry: 6 }, label: { text: 'Process', fill: '#333' } },
    });
    const decision = graph.addNode({
      x: 350, y: 270, width: 100, height: 100,
      attrs: { body: { fill: '#fff3e0', stroke: '#ff9800', strokeWidth: 2, refPoints: '0.5,0 1,0.5 0.5,1 0,0.5' }, label: { text: 'Decision?', fill: '#333', fontSize: 12 } },
      shape: 'polygon'
    });
    const end = graph.addNode({
      x: 350, y: 420, width: 120, height: 60,
      attrs: { body: { fill: '#ffebee', stroke: '#f44336', strokeWidth: 2, rx: 30, ry: 30 }, label: { text: 'End', fill: '#333' } },
    });

    graph.addEdge({ source: start, target: process, attrs: { line: { stroke: '#333', strokeWidth: 2, targetMarker: { name: 'block' } } } });
    graph.addEdge({ source: process, target: decision, attrs: { line: { stroke: '#333', strokeWidth: 2, targetMarker: { name: 'block' } } } });
    graph.addEdge({ source: decision, target: end, attrs: { line: { stroke: '#333', strokeWidth: 2, targetMarker: { name: 'block' } } } });

    setMode('flowchart');
    onClose();
  };

  const loadSwimLane = () => {
    if (!graph) return;
    graph.clearCells();

    // Lanes
    graph.addNode({ x: 50, y: 50, width: 200, height: 400, attrs: { body: { fill: '#e3f2fd', stroke: '#2196f3', strokeWidth: 2 }, label: { text: 'Sales', refY: 20 } } });
    graph.addNode({ x: 260, y: 50, width: 200, height: 400, attrs: { body: { fill: '#fff3e0', stroke: '#ff9800', strokeWidth: 2 }, label: { text: 'Operations', refY: 20 } } });
    graph.addNode({ x: 470, y: 50, width: 200, height: 400, attrs: { body: { fill: '#e8f5e9', stroke: '#4caf50', strokeWidth: 2 }, label: { text: 'Finance', refY: 20 } } });

    // Tasks
    const t1 = graph.addNode({ x: 90, y: 100, width: 120, height: 50, attrs: { body: { fill: '#fff', stroke: '#333', rx: 6 }, label: { text: 'Receive Order' } } });
    const t2 = graph.addNode({ x: 300, y: 180, width: 120, height: 50, attrs: { body: { fill: '#fff', stroke: '#333', rx: 6 }, label: { text: 'Process Order' } } });
    const t3 = graph.addNode({ x: 510, y: 260, width: 120, height: 50, attrs: { body: { fill: '#fff', stroke: '#333', rx: 6 }, label: { text: 'Invoice' } } });
    const t4 = graph.addNode({ x: 300, y: 340, width: 120, height: 50, attrs: { body: { fill: '#fff', stroke: '#333', rx: 6 }, label: { text: 'Ship' } } });

    graph.addEdge({ source: t1, target: t2, attrs: { line: { stroke: '#333', strokeWidth: 2, targetMarker: { name: 'block' } } } });
    graph.addEdge({ source: t2, target: t3, attrs: { line: { stroke: '#333', strokeWidth: 2, targetMarker: { name: 'block' } } } });
    graph.addEdge({ source: t3, target: t4, attrs: { line: { stroke: '#333', strokeWidth: 2, targetMarker: { name: 'block' } } } });

    setMode('flowchart');
    onClose();
  };

  const loadMindmapBasic = () => {
    if (!graph) return;
    graph.clearCells();

    const ports = {
      groups: {
        left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
        right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
        top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
        bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      },
      items: [
        { group: 'left', id: 'left' },
        { group: 'right', id: 'right' },
        { group: 'top', id: 'top' },
        { group: 'bottom', id: 'bottom' },
      ],
    };

    // Central topic
    let mmOrder = 1;

    const central = graph.addNode({
      x: 0, y: 0, width: 160, height: 80,
      attrs: { body: { fill: '#1976d2', stroke: '#0d47a1', strokeWidth: 2, rx: 10 }, label: { text: 'Central Idea', fill: '#fff', fontSize: 16 } },
      data: { isMindmap: true, level: 0, mmOrder: mmOrder++ },
      ports,
    });
    setNodeLabelWithAutoSize(central as any, 'Central Idea');

    const topics = [
      { label: 'Strategy', fill: '#42a5f5' },
      { label: 'Marketing', fill: '#66bb6a' },
      { label: 'Product', fill: '#ffa726' },
      { label: 'Sales', fill: '#26c6da' },
      { label: 'Team', fill: '#ef5350' },
      { label: 'Finance', fill: '#ab47bc' },
    ];

    topics.forEach(t => {
      const node = graph.addNode({
        x: 0, y: 0, width: 120, height: 50,
        attrs: { body: { fill: t.fill, stroke: t.fill, strokeWidth: 2, rx: 6 }, label: { text: t.label, fill: '#fff' } },
        data: { isMindmap: true, level: 1, mmOrder: mmOrder++ },
        ports,
      });
      setNodeLabelWithAutoSize(node as any, t.label);
      graph.addEdge({
        source: { cell: central.id },
        target: { cell: node.id },
        attrs: { line: { stroke: '#64748b', strokeWidth: 2 } },
        router: { name: 'normal' },
        connector: { name: 'smooth' }
      });
    });

    applyMindmapLayout(graph, 'both', central, 'standard');
    graph.centerContent();

    setMode('mindmap');
    onClose();
  };

  const loadMindmapRadial = () => {
    if (!graph) return;
    graph.clearCells();

    const ports = {
      groups: {
        left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
        right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
        top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
        bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#5F95FF', strokeWidth: 2, fill: '#fff' } } },
      },
      items: [
        { group: 'left', id: 'left' },
        { group: 'right', id: 'right' },
        { group: 'top', id: 'top' },
        { group: 'bottom', id: 'bottom' },
      ],
    };

    let mmOrder = 1;

    const central = graph.addNode({
      x: 0, y: 0, width: 120, height: 120,
      attrs: { body: { fill: '#9c27b0', stroke: '#7b1fa2', strokeWidth: 2, rx: 60, ry: 60 }, label: { text: 'Core\nConcept', fill: '#fff', fontSize: 14 } },
      data: { isMindmap: true, level: 0, mmOrder: mmOrder++ },
      ports,
    });
    setNodeLabelWithAutoSize(central as any, 'Core\nConcept');

    const topics = [
      'Idea 1', 'Idea 2', 'Idea 3', 'Idea 4',
      'Idea 5', 'Idea 6', 'Idea 7', 'Idea 8'
    ];

    topics.forEach(t => {
      const node = graph.addNode({
        x: 0, y: 0, width: 100, height: 40,
        attrs: { body: { fill: '#e1bee7', stroke: '#ba68c8', strokeWidth: 2, rx: 20 }, label: { text: t, fill: '#333' } },
        data: { isMindmap: true, level: 1, mmOrder: mmOrder++ },
        ports,
      });
      setNodeLabelWithAutoSize(node as any, t);
      graph.addEdge({
        source: { cell: central.id },
        target: { cell: node.id },
        attrs: { line: { stroke: '#9c27b0', strokeWidth: 2 } },
        router: { name: 'normal' },
        connector: { name: 'smooth' }
      });
    });

    applyMindmapLayout(graph, 'radial', central, 'standard');
    graph.centerContent();

    setMode('mindmap');
    onClose();
  };

  const loadOrgChart = () => {
    if (!graph) return;
    graph.clearCells();

    const ceo = graph.addNode({ x: 0, y: 0, width: 140, height: 60, attrs: { body: { fill: '#1565c0', stroke: '#0d47a1', rx: 8 }, label: { text: 'CEO\nJohn Smith', fill: '#fff', fontSize: 12 } } });

    const vps = [
      { text: 'VP Sales\nJane Doe', fill: '#1976d2' },
      { text: 'VP Engineering\nBob Wilson', fill: '#1976d2' },
      { text: 'VP Marketing\nAlice Chen', fill: '#1976d2' }
    ];

    const vpNodes = vps.map(vp => {
      const node = graph.addNode({ x: 0, y: 0, width: 140, height: 60, attrs: { body: { fill: vp.fill, stroke: '#1565c0', rx: 8 }, label: { text: vp.text, fill: '#fff', fontSize: 11 } } });
      graph.addEdge({ source: ceo, target: node, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
      return node;
    });

    // Teams for each VP
    const teams = [
      [
        { text: 'Sales Team A', fill: '#42a5f5' },
        { text: 'Sales Team B', fill: '#42a5f5' }
      ],
      [
        { text: 'Dev Team', fill: '#42a5f5' },
        { text: 'QA Team', fill: '#42a5f5' }
      ],
      [
        { text: 'Marketing Team', fill: '#42a5f5' }
      ]
    ];

    vpNodes.forEach((vp, i) => {
      teams[i].forEach(team => {
        const node = graph.addNode({ x: 0, y: 0, width: 120, height: 50, attrs: { body: { fill: team.fill, stroke: '#1e88e5', rx: 6 }, label: { text: team.text, fill: '#fff', fontSize: 10 } } });
        graph.addEdge({ source: vp, target: node, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
      });
    });

    applyTreeLayout(graph, 'TB', ceo);
    graph.centerContent();

    setMode('flowchart');
    onClose();
  };

  const loadFaultTree = () => {
    if (!graph) return;
    graph.clearCells();

    const top = graph.addNode({ x: 350, y: 30, width: 140, height: 60, attrs: { body: { fill: '#ffebee', stroke: '#c62828', strokeWidth: 2, rx: 4 }, label: { text: 'System Failure', fill: '#b71c1c', fontSize: 12 } } });
    const or1 = graph.addNode({ x: 370, y: 120, width: 80, height: 60, attrs: { body: { fill: '#fff3e0', stroke: '#ef6c00', strokeWidth: 2, refPoints: '0,0 1,0 1,0.4 0.5,1 0,0.4' }, label: { text: 'OR', fill: '#e65100', fontSize: 12 } }, shape: 'polygon' });

    const sub1 = graph.addNode({ x: 200, y: 220, width: 120, height: 50, attrs: { body: { fill: '#e3f2fd', stroke: '#1976d2', rx: 4 }, label: { text: 'Subsystem A', fontSize: 11 } } });
    const sub2 = graph.addNode({ x: 500, y: 220, width: 120, height: 50, attrs: { body: { fill: '#e3f2fd', stroke: '#1976d2', rx: 4 }, label: { text: 'Subsystem B', fontSize: 11 } } });

    const and1 = graph.addNode({ x: 220, y: 300, width: 80, height: 60, attrs: { body: { fill: '#e3f2fd', stroke: '#1976d2', strokeWidth: 2, refPoints: '0,0 1,0 1,0.6 0.5,1 0,0.6' }, label: { text: 'AND', fill: '#1565c0', fontSize: 12 } }, shape: 'polygon' });

    const e1 = graph.addNode({ x: 120, y: 400, width: 60, height: 60, attrs: { body: { fill: '#e8f5e9', stroke: '#2e7d32', strokeWidth: 2, rx: 30, ry: 30 }, label: { text: 'E1', fill: '#1b5e20', fontSize: 12 } } });
    const e2 = graph.addNode({ x: 220, y: 400, width: 60, height: 60, attrs: { body: { fill: '#e8f5e9', stroke: '#2e7d32', strokeWidth: 2, rx: 30, ry: 30 }, label: { text: 'E2', fill: '#1b5e20', fontSize: 12 } } });
    const e3 = graph.addNode({ x: 320, y: 400, width: 60, height: 60, attrs: { body: { fill: '#e8f5e9', stroke: '#2e7d32', strokeWidth: 2, rx: 30, ry: 30 }, label: { text: 'E3', fill: '#1b5e20', fontSize: 12 } } });
    const e4 = graph.addNode({ x: 520, y: 300, width: 60, height: 60, attrs: { body: { fill: '#fff8e1', stroke: '#f9a825', strokeWidth: 2 }, label: { text: '?', fill: '#f57f17', fontSize: 24 } } });

    graph.addEdge({ source: top, target: or1, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: or1, target: sub1, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: or1, target: sub2, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: sub1, target: and1, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: and1, target: e1, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: and1, target: e2, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: and1, target: e3, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: sub2, target: e4, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });

    setMode('flowchart');
    onClose();
  };

  const loadNetworkDiagram = () => {
    if (!graph) return;
    graph.clearCells();

    const cloud = graph.addNode({ x: 350, y: 30, width: 120, height: 60, attrs: { body: { fill: '#e3f2fd', stroke: '#1976d2', rx: 30 }, label: { text: 'Internet', fontSize: 12 } } });
    const firewall = graph.addNode({ x: 350, y: 130, width: 100, height: 50, attrs: { body: { fill: '#ffebee', stroke: '#c62828', rx: 4 }, label: { text: 'Firewall', fontSize: 11 } } });
    const router = graph.addNode({ x: 350, y: 220, width: 100, height: 50, attrs: { body: { fill: '#fff3e0', stroke: '#ef6c00', rx: 4 }, label: { text: 'Router', fontSize: 11 } } });
    const switch1 = graph.addNode({ x: 200, y: 310, width: 100, height: 50, attrs: { body: { fill: '#e8f5e9', stroke: '#388e3c', rx: 4 }, label: { text: 'Switch 1', fontSize: 11 } } });
    const switch2 = graph.addNode({ x: 500, y: 310, width: 100, height: 50, attrs: { body: { fill: '#e8f5e9', stroke: '#388e3c', rx: 4 }, label: { text: 'Switch 2', fontSize: 11 } } });

    const pc1 = graph.addNode({ x: 100, y: 400, width: 80, height: 50, attrs: { body: { fill: '#f3e5f5', stroke: '#7b1fa2', rx: 4 }, label: { text: 'PC 1', fontSize: 10 } } });
    const pc2 = graph.addNode({ x: 200, y: 400, width: 80, height: 50, attrs: { body: { fill: '#f3e5f5', stroke: '#7b1fa2', rx: 4 }, label: { text: 'PC 2', fontSize: 10 } } });
    const pc3 = graph.addNode({ x: 300, y: 400, width: 80, height: 50, attrs: { body: { fill: '#f3e5f5', stroke: '#7b1fa2', rx: 4 }, label: { text: 'PC 3', fontSize: 10 } } });
    const server1 = graph.addNode({ x: 450, y: 400, width: 80, height: 50, attrs: { body: { fill: '#e1f5fe', stroke: '#0288d1', rx: 4 }, label: { text: 'Server 1', fontSize: 10 } } });
    const server2 = graph.addNode({ x: 550, y: 400, width: 80, height: 50, attrs: { body: { fill: '#e1f5fe', stroke: '#0288d1', rx: 4 }, label: { text: 'Server 2', fontSize: 10 } } });

    graph.addEdge({ source: cloud, target: firewall, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: firewall, target: router, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: router, target: switch1, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: router, target: switch2, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: switch1, target: pc1, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: switch1, target: pc2, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: switch1, target: pc3, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: switch2, target: server1, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: switch2, target: server2, attrs: { line: { stroke: '#333', strokeWidth: 2 } } });

    setMode('flowchart');
    onClose();
  };

  const loadERDiagram = () => {
    if (!graph) return;
    graph.clearCells();

    const user = graph.addNode({ x: 100, y: 100, width: 150, height: 100, attrs: { body: { fill: '#e3f2fd', stroke: '#1976d2', strokeWidth: 2 }, label: { text: 'USER\n─────────\nid (PK)\nname\nemail', fontSize: 10, textAnchor: 'start', refX: 10 } } });
    const order = graph.addNode({ x: 350, y: 100, width: 150, height: 100, attrs: { body: { fill: '#fff3e0', stroke: '#ef6c00', strokeWidth: 2 }, label: { text: 'ORDER\n─────────\nid (PK)\nuser_id (FK)\ntotal', fontSize: 10, textAnchor: 'start', refX: 10 } } });
    const product = graph.addNode({ x: 600, y: 100, width: 150, height: 100, attrs: { body: { fill: '#e8f5e9', stroke: '#388e3c', strokeWidth: 2 }, label: { text: 'PRODUCT\n─────────\nid (PK)\nname\nprice', fontSize: 10, textAnchor: 'start', refX: 10 } } });
    const orderItem = graph.addNode({ x: 475, y: 280, width: 150, height: 100, attrs: { body: { fill: '#f3e5f5', stroke: '#7b1fa2', strokeWidth: 2 }, label: { text: 'ORDER_ITEM\n─────────\norder_id (FK)\nproduct_id (FK)\nquantity', fontSize: 10, textAnchor: 'start', refX: 10 } } });

    graph.addEdge({ source: user, target: order, labels: [{ attrs: { label: { text: '1:N' } } }], attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: order, target: orderItem, labels: [{ attrs: { label: { text: '1:N' } } }], attrs: { line: { stroke: '#333', strokeWidth: 2 } } });
    graph.addEdge({ source: product, target: orderItem, labels: [{ attrs: { label: { text: '1:N' } } }], attrs: { line: { stroke: '#333', strokeWidth: 2 } } });

    setMode('flowchart');
    onClose();
  };

  const loadTimeline = () => {
    if (!graph) return;
    graph.clearCells();

    // Timeline line (decorative, no ports needed)
    graph.addNode({ x: 50, y: 200, width: 700, height: 4, attrs: { body: { fill: '#64748b', stroke: 'transparent' }, label: { text: '' } } });

    const events = [
      { x: 100, y: 120, label: '2020\nProject Start', fill: '#3b82f6' },
      { x: 250, y: 250, label: '2021\nPhase 1 Complete', fill: '#10b981' },
      { x: 400, y: 120, label: '2022\nPhase 2 Launch', fill: '#f59e0b' },
      { x: 550, y: 250, label: '2023\nGlobal Release', fill: '#8b5cf6' },
      { x: 700, y: 120, label: '2024\nExpansion', fill: '#ec4899' },
    ];

    events.forEach((e, i) => {
      graph.addNode({
        x: e.x, y: e.y, width: 100, height: 60,
        attrs: { body: { fill: e.fill, stroke: e.fill, rx: 8 }, label: { text: e.label, fill: '#fff', fontSize: 10 } },
        data: { isTimeline: true, eventType: 'event' },
        ports: FULL_PORTS_CONFIG as any,
      });
      // Connector to timeline (decorative)
      graph.addNode({ x: e.x + 45, y: i % 2 === 0 ? 180 : 205, width: 10, height: i % 2 === 0 ? 60 : 45, attrs: { body: { fill: e.fill, stroke: 'transparent' }, label: { text: '' } } });
    });

    setMode('timeline');
    onClose();
  };

  const loadSoftwareArchitecture = () => {
    if (!graph) return;
    graph.clearCells();

    // Frontend Layer
    const frontend = graph.addNode({
      x: 300, y: 50, width: 180, height: 70,
      attrs: {
        body: { fill: '#e3f2fd', stroke: '#1976d2', strokeWidth: 2, rx: 8 },
        label: { text: 'Frontend\n(React + TypeScript)', fill: '#1565c0', fontSize: 12 }
      }
    });

    // API Gateway
    const api = graph.addNode({
      x: 300, y: 160, width: 180, height: 70,
      attrs: {
        body: { fill: '#e8f5e9', stroke: '#388e3c', strokeWidth: 2, rx: 8 },
        label: { text: 'API Gateway\n(REST + GraphQL)', fill: '#2e7d32', fontSize: 12 }
      }
    });

    // Backend Services
    const auth = graph.addNode({
      x: 100, y: 270, width: 140, height: 60,
      attrs: {
        body: { fill: '#fff3e0', stroke: '#f57c00', strokeWidth: 2, rx: 6 },
        label: { text: 'Auth Service', fill: '#ef6c00', fontSize: 11 }
      }
    });

    const business = graph.addNode({
      x: 260, y: 270, width: 140, height: 60,
      attrs: {
        body: { fill: '#fff3e0', stroke: '#f57c00', strokeWidth: 2, rx: 6 },
        label: { text: 'Business Logic', fill: '#ef6c00', fontSize: 11 }
      }
    });

    const notification = graph.addNode({
      x: 420, y: 270, width: 140, height: 60,
      attrs: {
        body: { fill: '#fff3e0', stroke: '#f57c00', strokeWidth: 2, rx: 6 },
        label: { text: 'Notifications', fill: '#ef6c00', fontSize: 11 }
      }
    });

    // Database Layer
    const db = graph.addNode({
      x: 150, y: 370, width: 140, height: 60,
      attrs: {
        body: { fill: '#fce4ec', stroke: '#c2185b', strokeWidth: 2, rx: 6 },
        label: { text: 'PostgreSQL', fill: '#ad1457', fontSize: 11 }
      }
    });

    const cache = graph.addNode({
      x: 310, y: 370, width: 140, height: 60,
      attrs: {
        body: { fill: '#fce4ec', stroke: '#c2185b', strokeWidth: 2, rx: 6 },
        label: { text: 'Redis Cache', fill: '#ad1457', fontSize: 11 }
      }
    });

    // Connections
    graph.addEdge({ source: frontend, target: api, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
    graph.addEdge({ source: api, target: auth, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
    graph.addEdge({ source: api, target: business, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
    graph.addEdge({ source: api, target: notification, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
    graph.addEdge({ source: auth, target: db, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
    graph.addEdge({ source: business, target: db, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });
    graph.addEdge({ source: business, target: cache, attrs: { line: { stroke: '#64748b', strokeWidth: 2 } }, connector: { name: 'rounded' } });

    graph.centerContent();

    setMode('flowchart');
    onClose();
  };

  const loadBusinessProcess = () => {
    if (!graph) return;
    graph.clearCells();

    // Customer Lane
    void graph.addNode({
      x: 50, y: 50, width: 700, height: 100,
      attrs: {
        body: { fill: '#e3f2fd', stroke: '#1976d2', strokeWidth: 2, rx: 8 },
        label: { text: 'Customer', fill: '#1565c0', fontSize: 14, refX: 0.05, refY: 0.1 }
      }
    });

    const start = graph.addNode({
      x: 100, y: 75, width: 60, height: 60,
      attrs: {
        body: { fill: '#4caf50', stroke: '#2e7d32', strokeWidth: 2, rx: 30 },
        label: { text: 'Start', fill: '#fff', fontSize: 11 }
      },
      shape: 'circle'
    });

    const submitOrder = graph.addNode({
      x: 200, y: 80, width: 100, height: 50,
      attrs: {
        body: { fill: '#ffffff', stroke: '#1976d2', strokeWidth: 2, rx: 25 },
        label: { text: 'Submit\nOrder', fill: '#1565c0', fontSize: 11 }
      }
    });

    const receiveConf = graph.addNode({
      x: 630, y: 80, width: 100, height: 50,
      attrs: {
        body: { fill: '#ffffff', stroke: '#1976d2', strokeWidth: 2, rx: 25 },
        label: { text: 'Receive\nConfirm', fill: '#1565c0', fontSize: 11 }
      }
    });

    // Sales Lane
    void graph.addNode({
      x: 50, y: 180, width: 700, height: 100,
      attrs: {
        body: { fill: '#e8f5e9', stroke: '#388e3c', strokeWidth: 2, rx: 8 },
        label: { text: 'Sales', fill: '#2e7d32', fontSize: 14, refX: 0.05, refY: 0.1 }
      }
    });

    const validateOrder = graph.addNode({
      x: 350, y: 200, width: 100, height: 60,
      attrs: {
        body: { fill: '#ffffff', stroke: '#388e3c', strokeWidth: 2, rx: 6 },
        label: { text: 'Validate\nOrder', fill: '#2e7d32', fontSize: 11 }
      }
    });

    const checkInventory = graph.addNode({
      x: 490, y: 195, width: 80, height: 70,
      attrs: {
        body: { fill: '#fff3e0', stroke: '#f57c00', strokeWidth: 2, refPoints: '0.5,0 1,0.5 0.5,1 0,0.5' },
        label: { text: 'Stock\nOK?', fill: '#ef6c00', fontSize: 11 }
      },
      shape: 'polygon'
    });

    // Operations Lane
    void graph.addNode({
      x: 50, y: 310, width: 700, height: 100,
      attrs: {
        body: { fill: '#fff3e0', stroke: '#f57c00', strokeWidth: 2, rx: 8 },
        label: { text: 'Operations', fill: '#ef6c00', fontSize: 14, refX: 0.05, refY: 0.1 }
      }
    });

    const fulfillOrder = graph.addNode({
      x: 620, y: 335, width: 100, height: 50,
      attrs: {
        body: { fill: '#ffffff', stroke: '#f57c00', strokeWidth: 2, rx: 6 },
        label: { text: 'Fulfill\nOrder', fill: '#ef6c00', fontSize: 11 }
      }
    });

    const end = graph.addNode({
      x: 100, y: 335, width: 60, height: 60,
      attrs: {
        body: { fill: '#f44336', stroke: '#c62828', strokeWidth: 4, rx: 30 },
        label: { text: 'End', fill: '#fff', fontSize: 11 }
      },
      shape: 'circle'
    });

    // Connections
    graph.addEdge({ source: start, target: submitOrder, attrs: { line: { stroke: '#64748b', strokeWidth: 2, targetMarker: { name: 'block' } } } });
    graph.addEdge({ source: submitOrder, target: validateOrder, attrs: { line: { stroke: '#64748b', strokeWidth: 2, targetMarker: { name: 'block' } } } });
    graph.addEdge({ source: validateOrder, target: checkInventory, attrs: { line: { stroke: '#64748b', strokeWidth: 2, targetMarker: { name: 'block' } } } });
    graph.addEdge({ source: checkInventory, target: fulfillOrder, attrs: { line: { stroke: '#4caf50', strokeWidth: 2, targetMarker: { name: 'block' } } }, labels: [{ attrs: { text: { text: 'Yes', fill: '#2e7d32' } } }] });
    graph.addEdge({ source: checkInventory, target: end, attrs: { line: { stroke: '#f44336', strokeWidth: 2, targetMarker: { name: 'block' } } }, vertices: [{ x: 530, y: 365 }], labels: [{ attrs: { text: { text: 'No', fill: '#c62828' } } }] });
    graph.addEdge({ source: fulfillOrder, target: receiveConf, attrs: { line: { stroke: '#64748b', strokeWidth: 2, targetMarker: { name: 'block' } } } });

    graph.centerContent();

    setMode('flowchart');
    onClose();
  };

  const examples: ExampleDiagram[] = [
    { id: 'flowchart-basic', name: 'Basic Flowchart', description: 'Simple process flow with decision', category: 'Flowchart', icon: '📊', loader: loadFlowchartBasic },
    { id: 'swimlane', name: 'Swimlane Diagram', description: 'Cross-functional process flow', category: 'Flowchart', icon: '🏊', loader: loadSwimLane },
    { id: 'business-process', name: 'Business Process', description: 'BPMN-style process with swim lanes', category: 'Flowchart', icon: '💼', loader: loadBusinessProcess },
    { id: 'mindmap-basic', name: 'Mind Map', description: 'Central idea with branches', category: 'Mind Map', icon: '🧠', loader: loadMindmapBasic },
    { id: 'mindmap-radial', name: 'Radial Map', description: 'Circular concept map', category: 'Mind Map', icon: '⭕', loader: loadMindmapRadial },
    { id: 'org-chart', name: 'Organization Chart', description: 'Company hierarchy structure', category: 'Org Chart', icon: '🏢', loader: loadOrgChart },
    { id: 'software-arch', name: 'Software Architecture', description: 'Layered system components', category: 'Software', icon: '⚙️', loader: loadSoftwareArchitecture },
    { id: 'fault-tree', name: 'Fault Tree Analysis', description: 'Failure mode analysis with gates', category: 'Logic', icon: '⚠️', loader: loadFaultTree },
    { id: 'network', name: 'Network Diagram', description: 'IT infrastructure layout', category: 'Network', icon: '🌐', loader: loadNetworkDiagram },
    { id: 'er-diagram', name: 'ER Diagram', description: 'Database entity relationships', category: 'Database', icon: '🗄️', loader: loadERDiagram },
    { id: 'timeline', name: 'Timeline', description: 'Project milestones over time', category: 'Timeline', icon: '📅', loader: loadTimeline },
  ];

  const categories = [...new Set(examples.map(e => e.category))];

  const filteredExamples = examples.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[800px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Example Diagrams</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(80vh-80px)]">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 ${!selectedCategory ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              All Examples
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium mb-1 ${selectedCategory === cat ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search examples..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Examples Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredExamples.map(example => (
                <button
                  key={example.id}
                  onClick={example.loader}
                  className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="text-3xl">{example.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {example.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{example.description}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                      {example.category}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 mt-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
