import { X } from 'lucide-react';
import { VERSION } from '../version';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpDialog({ isOpen, onClose }: HelpDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            DRAWDD Help & Documentation
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Getting Started */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Getting Started
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>
                <strong>DRAWDD</strong> is a powerful diagramming tool for creating flowcharts, mindmaps, org charts, and more.
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Choose a diagram type from the toolbar or Examples</li>
                <li>Drag shapes from the left sidebar onto the canvas</li>
                <li>Connect shapes by dragging from connection points (blue dots)</li>
                <li>Double-click any shape to edit its text</li>
                <li>Use the properties panel (right) to customize colors and styles</li>
                <li>Save your work with Ctrl+S or Export as PNG/SVG/PDF</li>
              </ol>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">General</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between"><span>New</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+N</kbd></div>
                  <div className="flex justify-between"><span>Open</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+O</kbd></div>
                  <div className="flex justify-between"><span>Save</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+S</kbd></div>
                  <div className="flex justify-between"><span>Undo</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Z</kbd></div>
                  <div className="flex justify-between"><span>Redo</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Y</kbd></div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Editing</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between"><span>Select All</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+A</kbd></div>
                  <div className="flex justify-between"><span>Copy</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+C</kbd></div>
                  <div className="flex justify-between"><span>Paste</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+V</kbd></div>
                  <div className="flex justify-between"><span>Delete</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Delete</kbd></div>
                  <div className="flex justify-between"><span>Edit Text</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">F2</kbd></div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">View</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between"><span>Zoom In</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl++</kbd></div>
                  <div className="flex justify-between"><span>Zoom Out</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+-</kbd></div>
                  <div className="flex justify-between"><span>Reset Zoom</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+0</kbd></div>
                  <div className="flex justify-between"><span>Fit to Screen</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+1</kbd></div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Mindmap</h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between"><span>Add Child</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Insert</kbd></div>
                  <div className="flex justify-between"><span>Add Sibling</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd></div>
                  <div className="flex justify-between"><span>Navigate</span><kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Arrow Keys</kbd></div>
                </div>
              </div>
            </div>
          </section>

          {/* Diagram Types */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Diagram Types
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Flowchart</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Process flows, decision trees, algorithms. Uses standard shapes (rectangles, diamonds, ovals).
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Mindmap</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Hierarchical brainstorming and idea organization. Central topic with radiating branches. Supports right, left, both, and radial layouts.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Org Chart</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organizational hierarchies showing reporting relationships. Top-down tree structure.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Concept Map</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Knowledge representation with labeled relationships between concepts.
                </p>
              </div>
            </div>
          </section>

          {/* Tips & Tricks */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tips & Tricks
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Multiple connection points:</strong> Each shape has 16 connection points for maximum flexibility</li>
              <li><strong>Right-click menu:</strong> Access common actions like duplicate, delete, bring to front</li>
              <li><strong>Smart guides:</strong> Snap lines appear when aligning shapes for pixel-perfect placement</li>
              <li><strong>Minimap:</strong> Use the minimap (bottom-right) to navigate large diagrams</li>
              <li><strong>Import:</strong> Import XMind (.xmind) and MindManager (.mmap) files directly</li>
              <li><strong>Export formats:</strong> PNG for presentations, SVG for scalable graphics, PDF for documents</li>
              <li><strong>Dark mode:</strong> Toggle in Settings for comfortable night work</li>
              <li><strong>Auto-save:</strong> Your work is automatically saved locally - restore on next visit</li>
            </ul>
          </section>

          {/* About */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              About DRAWDD
            </h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                <strong>Version:</strong> {VERSION}
              </p>
              <p>
                <strong>License:</strong> MIT License - Free and open source
              </p>
              <p>
                <strong>Built with:</strong> React 19, TypeScript, AntV X6, Vite, Tailwind CSS
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                DRAWDD is an open-source diagramming application designed for creating flowcharts, mindmaps, org charts, and technical diagrams. 
                All file formats and features are freely available with no restrictions.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
