import { useState } from 'react';
import { 
  FileText, 
  Brain, 
  Network, 
  Users, 
  Fish, 
  Calendar, 
  GitBranch, 
  ChevronDown, 
  X,
  Plus
} from 'lucide-react';
import { DIAGRAM_TYPES, type DiagramType } from '../config/diagramTypes';
import { TEMPLATES, getTemplatesByType, type Template } from '../config/templates';
import { useGraph } from '../context/GraphContext';

const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText size={20} />,
  Brain: <Brain size={20} />,
  Network: <Network size={20} />,
  Users: <Users size={20} />,
  Fish: <Fish size={20} />,
  Calendar: <Calendar size={20} />,
  GitBranch: <GitBranch size={20} />,
};

interface DiagramTypeSelectorProps {
  onLoadTemplate?: (template: Template) => void;
}

export function DiagramTypeSelector({ onLoadTemplate }: DiagramTypeSelectorProps) {
  const { graph, setMode } = useGraph();
  const [isOpen, setIsOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedType, setSelectedType] = useState<DiagramType | null>(null);

  const handleTypeSelect = (type: DiagramType) => {
    setSelectedType(type);
    
    // Update mode based on diagram type
    if (type === 'mindmap' || type === 'concept-map') {
      setMode('mindmap');
    } else {
      setMode('flowchart');
    }
    
    // Show templates for this type
    const templates = getTemplatesByType(type);
    if (templates.length > 0) {
      setShowTemplates(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    if (!graph) return;
    
    // Clear existing content
    graph.clearCells();
    
    // Add nodes from template
    template.data.nodes.forEach(node => {
      const shapeMap: Record<string, string> = {
        rect: 'rect',
        ellipse: 'ellipse',
        circle: 'circle',
        diamond: 'polygon',
      };
      
      const cellConfig: Record<string, unknown> = {
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        shape: shapeMap[node.shape] || 'rect',
        attrs: {
          body: {
            fill: node.fill,
            stroke: node.stroke,
            strokeWidth: 2,
            rx: node.shape === 'rect' ? 8 : 0,
            ry: node.shape === 'rect' ? 8 : 0,
          },
          label: {
            text: node.label,
            fill: '#333',
            fontSize: node.fontSize || 14,
            textWrap: {
              width: node.width - 20,
              height: node.height - 10,
              ellipsis: true,
            },
          },
        },
        ports: {
          groups: {
            top: { position: 'top', attrs: { circle: { r: 5, magnet: true, stroke: '#2196f3', fill: '#fff', strokeWidth: 2 } } },
            right: { position: 'right', attrs: { circle: { r: 5, magnet: true, stroke: '#2196f3', fill: '#fff', strokeWidth: 2 } } },
            bottom: { position: 'bottom', attrs: { circle: { r: 5, magnet: true, stroke: '#2196f3', fill: '#fff', strokeWidth: 2 } } },
            left: { position: 'left', attrs: { circle: { r: 5, magnet: true, stroke: '#2196f3', fill: '#fff', strokeWidth: 2 } } },
          },
          items: [
            { group: 'top', id: 'top' },
            { group: 'right', id: 'right' },
            { group: 'bottom', id: 'bottom' },
            { group: 'left', id: 'left' },
          ],
        },
      };
      
      // Handle diamond shape
      if (node.shape === 'diamond') {
        cellConfig.shape = 'polygon';
        cellConfig.attrs = {
          body: {
            fill: node.fill,
            stroke: node.stroke,
            strokeWidth: 2,
            refPoints: '0.5,0 1,0.5 0.5,1 0,0.5',
          },
          label: {
            text: node.label,
            fill: '#333',
            fontSize: node.fontSize || 14,
          },
        };
      }
      
      graph.addNode(cellConfig);
    });
    
    // Add edges from template
    template.data.edges.forEach(edge => {
      graph.addEdge({
        source: edge.source,
        target: edge.target,
        attrs: {
          line: {
            stroke: '#333',
            strokeWidth: 2,
            targetMarker: {
              name: 'block',
              width: 12,
              height: 8,
            },
          },
        },
        labels: edge.label ? [{
          attrs: {
            text: { text: edge.label, fill: '#333', fontSize: 12 },
            rect: { fill: '#fff', stroke: '#ddd', strokeWidth: 1 },
          },
          position: 0.5,
        }] : [],
      });
    });
    
    // Center the view
    graph.centerContent();
    
    // Notify parent
    onLoadTemplate?.(template);
    
    // Close the modal
    setShowTemplates(false);
    setIsOpen(false);
  };

  const handleNewBlank = () => {
    if (!graph) return;
    graph.clearCells();
    setShowTemplates(false);
    setIsOpen(false);
  };

  const currentTemplates = selectedType ? getTemplatesByType(selectedType) : TEMPLATES;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
      >
        <Plus size={18} />
        <span className="font-medium">New Diagram</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !showTemplates && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Choose Diagram Type</h3>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {DIAGRAM_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type.id)}
                className="w-full flex items-start gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-left group"
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {ICON_MAP[type.icon] || <FileText size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">{type.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{type.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && showTemplates && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTemplates(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-300"
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                {DIAGRAM_TYPES.find(t => t.id === selectedType)?.name} Templates
              </h3>
            </div>
            <button
              onClick={() => { setIsOpen(false); setShowTemplates(false); }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="p-3">
            <button
              onClick={handleNewBlank}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left mb-3"
            >
              <div className="w-16 h-12 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                <Plus size={20} className="text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">Blank Canvas</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Start from scratch</div>
              </div>
            </button>
            
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Templates</div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {currentTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-center group"
                >
                  <div className="w-full h-16 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center text-2xl mb-2 group-hover:border-blue-300 dark:group-hover:border-blue-500">
                    {template.thumbnail}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{template.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setIsOpen(false); setShowTemplates(false); }}
        />
      )}
    </div>
  );
}
