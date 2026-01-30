const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods for IPC communication
contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for menu commands from main process
  onMenuCommand: (callback) => {
    ipcRenderer.on('menu-command', (event, command, arg) => callback(command, arg));
  },
  
  // Remove menu command listener
  removeMenuCommandListener: () => {
    ipcRenderer.removeAllListeners('menu-command');
  },
  
  // Check if running in Electron
  isElectron: true,

  // Save directly to a known file path
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),

  // Save with a native Save As dialog
  saveFileAs: (defaultName, content) => ipcRenderer.invoke('save-file-as', defaultName, content),

  // Open a file by path (for recent files)
  openFile: (filePath) => ipcRenderer.invoke('open-file-by-path', filePath),

  // Get recent files from OS
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),

  // Open external URL in default browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Folder Explorer: Select folder dialog
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Folder Explorer: Open file with default application
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),

  // Folder Explorer: Scan directory recursively
  scanDirectory: (dirPath, includeHidden) => ipcRenderer.invoke('scan-directory', dirPath, includeHidden),
});
