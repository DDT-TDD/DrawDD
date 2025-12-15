import { Plus, X, FileText } from 'lucide-react';
import type { DiagramFile } from '../types';

// Re-export for backward compatibility
export type DiagramTab = DiagramFile;

interface TabBarProps {
  files: DiagramFile[];
  activeFileId: string;
  onFileSelect: (fileId: string) => void;
  onFileClose: (fileId: string) => void;
  onNewFile: () => void;
  onFileRename: (fileId: string, newName: string) => void;
}

export function TabBar({ 
  files, 
  activeFileId, 
  onFileSelect, 
  onFileClose, 
  onNewFile,
  onFileRename 
}: TabBarProps) {
  const handleDoubleClick = (file: DiagramFile) => {
    const newName = prompt('Rename file:', file.name);
    if (newName && newName.trim()) {
      onFileRename(file.id, newName.trim());
    }
  };

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-9 overflow-hidden">
      {/* File Tabs Container */}
      <div className="flex items-center flex-1 overflow-x-auto scrollbar-hide">
        {files.map((file) => (
          <div
            key={file.id}
            className={`group flex items-center gap-2 px-4 h-9 min-w-[140px] max-w-[200px] cursor-pointer border-r border-gray-200 dark:border-gray-700 transition-colors ${
              activeFileId === file.id
                ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
            }`}
            onClick={() => onFileSelect(file.id)}
            onDoubleClick={() => handleDoubleClick(file)}
            title={`${file.name} (${file.pages.length} page${file.pages.length !== 1 ? 's' : ''})${file.isModified ? ' (unsaved)' : ''}\nDouble-click to rename`}
          >
            <FileText size={14} className="flex-shrink-0 opacity-50" />
            <span className="flex-1 text-sm truncate">
              {file.name}
              {file.isModified && <span className="text-blue-500 ml-1">●</span>}
            </span>
            {/* Page count indicator */}
            {file.pages.length > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                {file.pages.length}
              </span>
            )}
            {files.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClose(file.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity"
                title="Close file"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New File Button */}
      <button
        onClick={onNewFile}
        className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="New diagram (Ctrl+N)"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
