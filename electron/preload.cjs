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
});
