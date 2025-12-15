import { X, Github, Heart, Keyboard, ExternalLink } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'N'], action: 'New diagram' },
    { keys: ['Ctrl', 'O'], action: 'Open file' },
    { keys: ['Ctrl', 'S'], action: 'Save diagram' },
    { keys: ['Ctrl', 'Z'], action: 'Undo' },
    { keys: ['Ctrl', 'Y'], action: 'Redo' },
    { keys: ['Ctrl', 'C'], action: 'Copy' },
    { keys: ['Ctrl', 'V'], action: 'Paste' },
    { keys: ['Ctrl', 'A'], action: 'Select all' },
    { keys: ['Ctrl', 'F'], action: 'Find' },
    { keys: ['Ctrl', 'H'], action: 'Find & Replace' },
    { keys: ['Delete'], action: 'Delete selected' },
    { keys: ['Insert'], action: 'Add child (mindmap)' },
    { keys: ['Enter'], action: 'Add sibling (mindmap)' },
    { keys: ['F2'], action: 'Edit text' },
    { keys: ['Esc'], action: 'Cancel / Deselect' },
    { keys: ['Ctrl', '+'], action: 'Zoom in' },
    { keys: ['Ctrl', '-'], action: 'Zoom out' },
    { keys: ['Ctrl', '0'], action: 'Reset zoom' },
    { keys: ['Arrow Keys'], action: 'Navigate nodes' },
    { keys: ['Shift', 'Drag'], action: 'Pan canvas' },
    { keys: ['Ctrl', 'Scroll'], action: 'Zoom' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[640px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About DRAWDD</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 max-h-[calc(85vh-80px)] overflow-y-auto">
          {/* Logo and Version */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4">
              <span className="text-4xl font-bold text-white">D</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">DRAWDD</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Version 1.1.0</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Open Source Diagramming Tool</p>
          </div>

          {/* Description */}
          <div className="text-center mb-8">
            <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              A powerful, free, and open-source diagramming application for creating flowcharts, mind maps, 
              org charts, fishbone diagrams, timelines, and more. Built with modern web technologies.
            </p>
          </div>

          {/* Key Features */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Key Features</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🔌', title: '16 Connection Points', desc: 'Maximum flexibility' },
                { icon: '📊', title: 'Multiple Diagram Types', desc: 'Flowcharts, mindmaps, org charts' },
                { icon: '🎨', title: 'Customizable Styles', desc: 'Colors, shapes, connectors' },
                { icon: '📥', title: 'Import XMind/MindManager', desc: 'Open existing files' },
                { icon: '📤', title: 'Export PNG/SVG/PDF', desc: 'Share your work' },
                { icon: '⌨️', title: 'Keyboard Shortcuts', desc: 'Power user productivity' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-xl">{feature.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{feature.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4">
              <Keyboard size={16} />
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 max-h-48 overflow-y-auto">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-gray-600 dark:text-gray-400">{shortcut.action}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={i}>
                        <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                          {key}
                        </kbd>
                        {i < shortcut.keys.length - 1 && <span className="text-gray-400 mx-0.5">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex justify-center gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Github size={16} />
              View on GitHub
              <ExternalLink size={12} />
            </a>
            <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              Made with <Heart size={14} className="text-red-500" /> by the community
            </span>
          </div>

          {/* License */}
          <div className="text-center mt-6 text-xs text-gray-400">
            MIT License • All dependencies are permissively licensed
          </div>
        </div>
      </div>
    </div>
  );
}
