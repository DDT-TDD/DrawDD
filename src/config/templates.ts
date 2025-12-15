import type { DiagramType } from './diagramTypes';

export interface Template {
  id: string;
  name: string;
  description: string;
  diagramType: DiagramType;
  thumbnail: string;
  data: TemplateData;
}

export interface TemplateData {
  nodes: TemplateNode[];
  edges: TemplateEdge[];
}

export interface TemplateNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: string;
  label: string;
  fill: string;
  stroke: string;
  fontSize?: number;
}

export interface TemplateEdge {
  source: string;
  target: string;
  label?: string;
}

export const TEMPLATES: Template[] = [
  // Flowchart Templates
  {
    id: 'flowchart-basic',
    name: 'Basic Flowchart',
    description: 'Simple start-to-end process flow',
    diagramType: 'flowchart',
    thumbnail: '📊',
    data: {
      nodes: [
        { id: 'start', x: 300, y: 50, width: 120, height: 60, shape: 'ellipse', label: 'Start', fill: '#e8f5e9', stroke: '#4caf50' },
        { id: 'process1', x: 300, y: 150, width: 140, height: 70, shape: 'rect', label: 'Process Step 1', fill: '#fff', stroke: '#333' },
        { id: 'decision', x: 300, y: 270, width: 120, height: 120, shape: 'diamond', label: 'Decision?', fill: '#fff3e0', stroke: '#ff9800' },
        { id: 'process2', x: 500, y: 270, width: 140, height: 70, shape: 'rect', label: 'Process Step 2', fill: '#fff', stroke: '#333' },
        { id: 'end', x: 300, y: 430, width: 120, height: 60, shape: 'ellipse', label: 'End', fill: '#ffebee', stroke: '#f44336' },
      ],
      edges: [
        { source: 'start', target: 'process1' },
        { source: 'process1', target: 'decision' },
        { source: 'decision', target: 'process2', label: 'Yes' },
        { source: 'decision', target: 'end', label: 'No' },
        { source: 'process2', target: 'end' },
      ],
    },
  },
  {
    id: 'flowchart-approval',
    name: 'Approval Workflow',
    description: 'Document approval process',
    diagramType: 'flowchart',
    thumbnail: '✅',
    data: {
      nodes: [
        { id: 'submit', x: 300, y: 50, width: 140, height: 60, shape: 'rect', label: 'Submit Request', fill: '#e3f2fd', stroke: '#2196f3' },
        { id: 'review', x: 300, y: 150, width: 140, height: 60, shape: 'rect', label: 'Manager Review', fill: '#fff', stroke: '#333' },
        { id: 'approved', x: 300, y: 260, width: 120, height: 120, shape: 'diamond', label: 'Approved?', fill: '#fff3e0', stroke: '#ff9800' },
        { id: 'implement', x: 500, y: 260, width: 140, height: 60, shape: 'rect', label: 'Implement', fill: '#e8f5e9', stroke: '#4caf50' },
        { id: 'reject', x: 100, y: 260, width: 140, height: 60, shape: 'rect', label: 'Reject & Notify', fill: '#ffebee', stroke: '#f44336' },
        { id: 'complete', x: 500, y: 380, width: 120, height: 60, shape: 'ellipse', label: 'Complete', fill: '#e8f5e9', stroke: '#4caf50' },
      ],
      edges: [
        { source: 'submit', target: 'review' },
        { source: 'review', target: 'approved' },
        { source: 'approved', target: 'implement', label: 'Yes' },
        { source: 'approved', target: 'reject', label: 'No' },
        { source: 'implement', target: 'complete' },
      ],
    },
  },

  // Mind Map Templates
  {
    id: 'mindmap-brainstorm',
    name: 'Brainstorming',
    description: 'Central idea with branches',
    diagramType: 'mindmap',
    thumbnail: '🧠',
    data: {
      nodes: [
        { id: 'central', x: 400, y: 300, width: 160, height: 80, shape: 'ellipse', label: 'Main Idea', fill: '#1976d2', stroke: '#0d47a1', fontSize: 18 },
        { id: 'branch1', x: 650, y: 150, width: 140, height: 50, shape: 'rect', label: 'Idea 1', fill: '#42a5f5', stroke: '#1e88e5' },
        { id: 'branch2', x: 650, y: 300, width: 140, height: 50, shape: 'rect', label: 'Idea 2', fill: '#66bb6a', stroke: '#43a047' },
        { id: 'branch3', x: 650, y: 450, width: 140, height: 50, shape: 'rect', label: 'Idea 3', fill: '#ffa726', stroke: '#fb8c00' },
        { id: 'branch4', x: 150, y: 150, width: 140, height: 50, shape: 'rect', label: 'Idea 4', fill: '#ab47bc', stroke: '#8e24aa' },
        { id: 'branch5', x: 150, y: 300, width: 140, height: 50, shape: 'rect', label: 'Idea 5', fill: '#26c6da', stroke: '#00acc1' },
        { id: 'branch6', x: 150, y: 450, width: 140, height: 50, shape: 'rect', label: 'Idea 6', fill: '#ef5350', stroke: '#e53935' },
      ],
      edges: [
        { source: 'central', target: 'branch1' },
        { source: 'central', target: 'branch2' },
        { source: 'central', target: 'branch3' },
        { source: 'central', target: 'branch4' },
        { source: 'central', target: 'branch5' },
        { source: 'central', target: 'branch6' },
      ],
    },
  },
  {
    id: 'mindmap-project',
    name: 'Project Planning',
    description: 'Project breakdown structure',
    diagramType: 'mindmap',
    thumbnail: '📋',
    data: {
      nodes: [
        { id: 'project', x: 100, y: 300, width: 140, height: 70, shape: 'rect', label: 'Project Name', fill: '#1976d2', stroke: '#0d47a1', fontSize: 16 },
        { id: 'phase1', x: 300, y: 100, width: 120, height: 50, shape: 'rect', label: 'Planning', fill: '#42a5f5', stroke: '#1e88e5' },
        { id: 'phase2', x: 300, y: 200, width: 120, height: 50, shape: 'rect', label: 'Design', fill: '#66bb6a', stroke: '#43a047' },
        { id: 'phase3', x: 300, y: 300, width: 120, height: 50, shape: 'rect', label: 'Development', fill: '#ffa726', stroke: '#fb8c00' },
        { id: 'phase4', x: 300, y: 400, width: 120, height: 50, shape: 'rect', label: 'Testing', fill: '#ab47bc', stroke: '#8e24aa' },
        { id: 'phase5', x: 300, y: 500, width: 120, height: 50, shape: 'rect', label: 'Deployment', fill: '#26c6da', stroke: '#00acc1' },
        { id: 'task1', x: 500, y: 80, width: 100, height: 40, shape: 'rect', label: 'Requirements', fill: '#90caf9', stroke: '#64b5f6' },
        { id: 'task2', x: 500, y: 130, width: 100, height: 40, shape: 'rect', label: 'Timeline', fill: '#90caf9', stroke: '#64b5f6' },
      ],
      edges: [
        { source: 'project', target: 'phase1' },
        { source: 'project', target: 'phase2' },
        { source: 'project', target: 'phase3' },
        { source: 'project', target: 'phase4' },
        { source: 'project', target: 'phase5' },
        { source: 'phase1', target: 'task1' },
        { source: 'phase1', target: 'task2' },
      ],
    },
  },

  // Org Chart Templates
  {
    id: 'orgchart-company',
    name: 'Company Structure',
    description: 'Corporate hierarchy',
    diagramType: 'org-chart',
    thumbnail: '👥',
    data: {
      nodes: [
        { id: 'ceo', x: 350, y: 50, width: 140, height: 60, shape: 'rect', label: 'CEO', fill: '#1976d2', stroke: '#0d47a1' },
        { id: 'cto', x: 150, y: 180, width: 120, height: 50, shape: 'rect', label: 'CTO', fill: '#42a5f5', stroke: '#1e88e5' },
        { id: 'cfo', x: 350, y: 180, width: 120, height: 50, shape: 'rect', label: 'CFO', fill: '#66bb6a', stroke: '#43a047' },
        { id: 'coo', x: 550, y: 180, width: 120, height: 50, shape: 'rect', label: 'COO', fill: '#ffa726', stroke: '#fb8c00' },
        { id: 'dev1', x: 80, y: 300, width: 100, height: 45, shape: 'rect', label: 'Dev Team', fill: '#90caf9', stroke: '#64b5f6' },
        { id: 'dev2', x: 200, y: 300, width: 100, height: 45, shape: 'rect', label: 'QA Team', fill: '#90caf9', stroke: '#64b5f6' },
        { id: 'fin1', x: 350, y: 300, width: 100, height: 45, shape: 'rect', label: 'Finance', fill: '#a5d6a7', stroke: '#81c784' },
        { id: 'ops1', x: 500, y: 300, width: 100, height: 45, shape: 'rect', label: 'Operations', fill: '#ffcc80', stroke: '#ffb74d' },
        { id: 'ops2', x: 620, y: 300, width: 100, height: 45, shape: 'rect', label: 'Support', fill: '#ffcc80', stroke: '#ffb74d' },
      ],
      edges: [
        { source: 'ceo', target: 'cto' },
        { source: 'ceo', target: 'cfo' },
        { source: 'ceo', target: 'coo' },
        { source: 'cto', target: 'dev1' },
        { source: 'cto', target: 'dev2' },
        { source: 'cfo', target: 'fin1' },
        { source: 'coo', target: 'ops1' },
        { source: 'coo', target: 'ops2' },
      ],
    },
  },

  // Fishbone Template
  {
    id: 'fishbone-analysis',
    name: 'Root Cause Analysis',
    description: 'Ishikawa / Fishbone diagram',
    diagramType: 'fishbone',
    thumbnail: '🐟',
    data: {
      nodes: [
        { id: 'effect', x: 700, y: 250, width: 140, height: 60, shape: 'rect', label: 'Problem / Effect', fill: '#ffebee', stroke: '#f44336' },
        { id: 'cause1', x: 150, y: 100, width: 120, height: 45, shape: 'rect', label: 'People', fill: '#e3f2fd', stroke: '#2196f3' },
        { id: 'cause2', x: 300, y: 100, width: 120, height: 45, shape: 'rect', label: 'Process', fill: '#e8f5e9', stroke: '#4caf50' },
        { id: 'cause3', x: 450, y: 100, width: 120, height: 45, shape: 'rect', label: 'Equipment', fill: '#fff3e0', stroke: '#ff9800' },
        { id: 'cause4', x: 150, y: 400, width: 120, height: 45, shape: 'rect', label: 'Materials', fill: '#f3e5f5', stroke: '#9c27b0' },
        { id: 'cause5', x: 300, y: 400, width: 120, height: 45, shape: 'rect', label: 'Environment', fill: '#e0f7fa', stroke: '#00bcd4' },
        { id: 'cause6', x: 450, y: 400, width: 120, height: 45, shape: 'rect', label: 'Management', fill: '#fce4ec', stroke: '#e91e63' },
      ],
      edges: [
        { source: 'cause1', target: 'effect' },
        { source: 'cause2', target: 'effect' },
        { source: 'cause3', target: 'effect' },
        { source: 'cause4', target: 'effect' },
        { source: 'cause5', target: 'effect' },
        { source: 'cause6', target: 'effect' },
      ],
    },
  },

  // Timeline Template
  {
    id: 'timeline-project',
    name: 'Project Timeline',
    description: 'Milestones and events',
    diagramType: 'timeline',
    thumbnail: '📅',
    data: {
      nodes: [
        { id: 'start', x: 100, y: 200, width: 20, height: 20, shape: 'circle', label: '', fill: '#4caf50', stroke: '#2e7d32' },
        { id: 'event1', x: 100, y: 100, width: 120, height: 50, shape: 'rect', label: 'Q1: Planning', fill: '#e3f2fd', stroke: '#2196f3' },
        { id: 'm1', x: 250, y: 200, width: 20, height: 20, shape: 'circle', label: '', fill: '#2196f3', stroke: '#1565c0' },
        { id: 'event2', x: 250, y: 280, width: 120, height: 50, shape: 'rect', label: 'Q2: Design', fill: '#e8f5e9', stroke: '#4caf50' },
        { id: 'm2', x: 400, y: 200, width: 20, height: 20, shape: 'circle', label: '', fill: '#ff9800', stroke: '#ef6c00' },
        { id: 'event3', x: 400, y: 100, width: 120, height: 50, shape: 'rect', label: 'Q3: Development', fill: '#fff3e0', stroke: '#ff9800' },
        { id: 'm3', x: 550, y: 200, width: 20, height: 20, shape: 'circle', label: '', fill: '#9c27b0', stroke: '#6a1b9a' },
        { id: 'event4', x: 550, y: 280, width: 120, height: 50, shape: 'rect', label: 'Q4: Launch', fill: '#f3e5f5', stroke: '#9c27b0' },
        { id: 'end', x: 700, y: 200, width: 20, height: 20, shape: 'circle', label: '', fill: '#f44336', stroke: '#c62828' },
      ],
      edges: [
        { source: 'start', target: 'm1' },
        { source: 'm1', target: 'm2' },
        { source: 'm2', target: 'm3' },
        { source: 'm3', target: 'end' },
      ],
    },
  },

  // Concept Map Template
  {
    id: 'conceptmap-learning',
    name: 'Learning Concept Map',
    description: 'Connected ideas with relationships',
    diagramType: 'concept-map',
    thumbnail: '🔗',
    data: {
      nodes: [
        { id: 'main', x: 350, y: 200, width: 140, height: 60, shape: 'ellipse', label: 'Main Concept', fill: '#1976d2', stroke: '#0d47a1' },
        { id: 'concept1', x: 150, y: 80, width: 120, height: 50, shape: 'ellipse', label: 'Concept A', fill: '#42a5f5', stroke: '#1e88e5' },
        { id: 'concept2', x: 550, y: 80, width: 120, height: 50, shape: 'ellipse', label: 'Concept B', fill: '#66bb6a', stroke: '#43a047' },
        { id: 'concept3', x: 150, y: 320, width: 120, height: 50, shape: 'ellipse', label: 'Concept C', fill: '#ffa726', stroke: '#fb8c00' },
        { id: 'concept4', x: 550, y: 320, width: 120, height: 50, shape: 'ellipse', label: 'Concept D', fill: '#ab47bc', stroke: '#8e24aa' },
        { id: 'sub1', x: 350, y: 400, width: 100, height: 40, shape: 'ellipse', label: 'Sub-idea', fill: '#90caf9', stroke: '#64b5f6' },
      ],
      edges: [
        { source: 'main', target: 'concept1', label: 'relates to' },
        { source: 'main', target: 'concept2', label: 'includes' },
        { source: 'main', target: 'concept3', label: 'requires' },
        { source: 'main', target: 'concept4', label: 'leads to' },
        { source: 'concept3', target: 'sub1', label: 'example' },
        { source: 'concept4', target: 'sub1', label: 'example' },
      ],
    },
  },

  // Tree Templates
  {
    id: 'tree-decision',
    name: 'Decision Tree',
    description: 'Hierarchical decision making',
    diagramType: 'tree',
    thumbnail: '🌳',
    data: {
      nodes: [
        { id: 'root', x: 350, y: 50, width: 140, height: 50, shape: 'rect', label: 'Start Decision', fill: '#1976d2', stroke: '#0d47a1' },
        { id: 'opt1', x: 200, y: 150, width: 120, height: 45, shape: 'rect', label: 'Option A', fill: '#42a5f5', stroke: '#1e88e5' },
        { id: 'opt2', x: 500, y: 150, width: 120, height: 45, shape: 'rect', label: 'Option B', fill: '#66bb6a', stroke: '#43a047' },
        { id: 'out1', x: 100, y: 250, width: 100, height: 40, shape: 'rect', label: 'Outcome 1', fill: '#e3f2fd', stroke: '#90caf9' },
        { id: 'out2', x: 250, y: 250, width: 100, height: 40, shape: 'rect', label: 'Outcome 2', fill: '#e3f2fd', stroke: '#90caf9' },
        { id: 'out3', x: 420, y: 250, width: 100, height: 40, shape: 'rect', label: 'Outcome 3', fill: '#e8f5e9', stroke: '#a5d6a7' },
        { id: 'out4', x: 570, y: 250, width: 100, height: 40, shape: 'rect', label: 'Outcome 4', fill: '#e8f5e9', stroke: '#a5d6a7' },
      ],
      edges: [
        { source: 'root', target: 'opt1' },
        { source: 'root', target: 'opt2' },
        { source: 'opt1', target: 'out1' },
        { source: 'opt1', target: 'out2' },
        { source: 'opt2', target: 'out3' },
        { source: 'opt2', target: 'out4' },
      ],
    },
  },
];

export function getTemplatesByType(type: DiagramType): Template[] {
  return TEMPLATES.filter(t => t.diagramType === type);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find(t => t.id === id);
}
