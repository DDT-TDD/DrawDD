import { X, FileText, Layers } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface NewDiagramDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onNewPage: () => void;
  currentFileName: string;
}

export function NewDiagramDialog({ 
  isOpen, 
  onClose, 
  onNewFile, 
  onNewPage,
  currentFileName 
}: NewDiagramDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNewFile = () => {
    onNewFile();
    onClose();
  };

  const handleNewPage = () => {
    onNewPage();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        ref={dialogRef}
        className="bg-[var(--bg-primary)] rounded-xl shadow-2xl border border-[var(--border-color)] w-[420px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Create New Diagram</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Would you like to create a new file or add a new page to the current file?
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* New File Option */}
            <button
              onClick={handleNewFile}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[var(--border-color)] hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <FileText size={28} className="text-blue-500" />
              </div>
              <div className="text-center">
                <div className="font-medium text-[var(--text-primary)]">New File</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  Create a separate file
                </div>
              </div>
            </button>

            {/* New Page Option */}
            <button
              onClick={handleNewPage}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-[var(--border-color)] hover:border-green-500 hover:bg-green-500/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <Layers size={28} className="text-green-500" />
              </div>
              <div className="text-center">
                <div className="font-medium text-[var(--text-primary)]">New Page</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  Add to "{currentFileName}"
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Tip: Use <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">Ctrl+Shift+N</kbd> for new file, <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">Ctrl+T</kbd> for new page
          </p>
        </div>
      </div>
    </div>
  );
}
