import { X } from 'lucide-react';

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: 'General',
    shortcuts: [
      { keys: 'Ctrl+Z', description: 'Undo' },
      { keys: 'Ctrl+Y', description: 'Redo' },
      { keys: 'Ctrl+A', description: 'Select All' },
      { keys: 'Delete', description: 'Delete Selected' },
      { keys: 'Ctrl+C', description: 'Copy' },
      { keys: 'Ctrl+V', description: 'Paste' },
      { keys: 'Ctrl+X', description: 'Cut' },
      { keys: 'Ctrl+D', description: 'Duplicate' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: 'Ctrl++', description: 'Zoom In' },
      { keys: 'Ctrl+-', description: 'Zoom Out' },
      { keys: 'Ctrl+0', description: 'Reset Zoom' },
      { keys: 'Ctrl+F', description: 'Fit to Screen' },
    ],
  },
  {
    title: 'Arrange',
    shortcuts: [
      { keys: 'Ctrl+G', description: 'Group Selected' },
      { keys: 'Ctrl+Shift+G', description: 'Ungroup' },
      { keys: 'Ctrl+]', description: 'Bring to Front' },
      { keys: 'Ctrl+[', description: 'Send to Back' },
    ],
  },
  {
    title: 'Mindmap',
    shortcuts: [
      { keys: 'Insert', description: 'Add Child Node' },
      { keys: 'Enter', description: 'Add Sibling Node' },
      { keys: 'F2', description: 'Edit Node Text' },
      { keys: '↑ ↓ ← →', description: 'Navigate Nodes' },
    ],
  },
  {
    title: 'File',
    shortcuts: [
      { keys: 'Ctrl+N', description: 'New Diagram' },
      { keys: 'Ctrl+O', description: 'Open File' },
      { keys: 'Ctrl+S', description: 'Save' },
      { keys: 'Ctrl+Shift+S', description: 'Save As' },
      { keys: 'Ctrl+E', description: 'Export' },
    ],
  },
];

export function KeyboardShortcutsDialog({ isOpen, onClose }: KeyboardShortcutsDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              ⌨️ Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SHORTCUT_GROUPS.map(group => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map(shortcut => (
                      <div 
                        key={shortcut.keys} 
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {shortcut.description}
                        </span>
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer note */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                💡 Tip: On Mac, use Cmd instead of Ctrl
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
