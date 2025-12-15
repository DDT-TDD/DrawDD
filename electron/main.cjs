const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup not available in dev
}

let mainWindow;

function getIconPath() {
  const possiblePaths = [
    path.join(__dirname, '../public/icons/icon-256.ico'),
    path.join(__dirname, '../public/icon.ico'),
    path.join(__dirname, '../public/icons/icon.png'),
    path.join(__dirname, '../dist/icon.ico'),
  ];
  
  for (const iconPath of possiblePaths) {
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }
  return undefined;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true, // Hide native menu - use web app MenuBar instead
  });

  // Load the built app
  if (process.env.ELECTRON_DEV) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create application menu - Full featured menu like draw.io
function createMenu() {
  const isMac = process.platform === 'darwin';
  
  const template = [
    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New...',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-command', 'new')
        },
        { type: 'separator' },
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow.webContents.send('menu-command', 'new-file')
        },
        {
          label: 'New Page',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('menu-command', 'new-page')
        },
        { type: 'separator' },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [
                { name: 'All Supported', extensions: ['json', 'xmind', 'mmap', 'km', 'mm', 'vsdx'] },
                { name: 'DRAWDD Files', extensions: ['json'] },
                { name: 'XMind', extensions: ['xmind'] },
                { name: 'MindManager', extensions: ['mmap'] },
                { name: 'KityMinder', extensions: ['km'] },
                { name: 'FreeMind', extensions: ['mm'] },
                { name: 'Visio', extensions: ['vsdx'] },
              ],
              properties: ['openFile']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu-command', 'open-file', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-command', 'save')
        },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as PNG',
              accelerator: 'CmdOrCtrl+Shift+P',
              click: () => mainWindow.webContents.send('menu-command', 'export-png')
            },
            {
              label: 'Export as JPEG',
              click: () => mainWindow.webContents.send('menu-command', 'export-jpeg')
            },
            {
              label: 'Export as HTML',
              click: () => mainWindow.webContents.send('menu-command', 'export-html')
            },
            {
              label: 'Export as SVG',
              click: () => mainWindow.webContents.send('menu-command', 'export-svg')
            },
            {
              label: 'Export as PDF',
              click: () => mainWindow.webContents.send('menu-command', 'export-pdf')
            },
            { type: 'separator' },
            {
              label: 'Export as JSON',
              click: () => mainWindow.webContents.send('menu-command', 'export-json')
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => mainWindow.webContents.send('menu-command', 'settings')
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' }
      ]
    },
    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => mainWindow.webContents.send('menu-command', 'undo')
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Y',
          click: () => mainWindow.webContents.send('menu-command', 'redo')
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: () => mainWindow.webContents.send('menu-command', 'cut')
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          click: () => mainWindow.webContents.send('menu-command', 'copy')
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          click: () => mainWindow.webContents.send('menu-command', 'paste')
        },
        {
          label: 'Duplicate',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow.webContents.send('menu-command', 'duplicate')
        },
        { type: 'separator' },
        {
          label: 'Delete',
          accelerator: 'Delete',
          click: () => mainWindow.webContents.send('menu-command', 'delete')
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => mainWindow.webContents.send('menu-command', 'select-all')
        },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => mainWindow.webContents.send('menu-command', 'find')
        }
      ]
    },
    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow.webContents.send('menu-command', 'zoom-in')
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow.webContents.send('menu-command', 'zoom-out')
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.send('menu-command', 'zoom-reset')
        },
        {
          label: 'Fit to Window',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => mainWindow.webContents.send('menu-command', 'fit-to-window')
        },
        { type: 'separator' },
        {
          label: 'Toggle Grid',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow.webContents.send('menu-command', 'toggle-grid')
        },
        {
          label: 'Toggle Minimap',
          click: () => mainWindow.webContents.send('menu-command', 'toggle-minimap')
        },
        { type: 'separator' },
        {
          label: 'Show Shapes Panel',
          click: () => mainWindow.webContents.send('menu-command', 'toggle-left-sidebar')
        },
        {
          label: 'Show Properties Panel',
          click: () => mainWindow.webContents.send('menu-command', 'toggle-right-sidebar')
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: 'Developer Tools' }
      ]
    },
    // Insert Menu
    {
      label: 'Insert',
      submenu: [
        {
          label: 'Rectangle',
          click: () => mainWindow.webContents.send('menu-command', 'insert-rectangle')
        },
        {
          label: 'Ellipse',
          click: () => mainWindow.webContents.send('menu-command', 'insert-ellipse')
        },
        {
          label: 'Diamond',
          click: () => mainWindow.webContents.send('menu-command', 'insert-diamond')
        },
        {
          label: 'Text',
          click: () => mainWindow.webContents.send('menu-command', 'insert-text')
        },
        { type: 'separator' },
        {
          label: 'Image...',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] }
              ],
              properties: ['openFile']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu-command', 'insert-image', result.filePaths[0]);
            }
          }
        }
      ]
    },
    // Arrange Menu
    {
      label: 'Arrange',
      submenu: [
        {
          label: 'Bring to Front',
          accelerator: 'CmdOrCtrl+Shift+]',
          click: () => mainWindow.webContents.send('menu-command', 'bring-to-front')
        },
        {
          label: 'Send to Back',
          accelerator: 'CmdOrCtrl+Shift+[',
          click: () => mainWindow.webContents.send('menu-command', 'send-to-back')
        },
        { type: 'separator' },
        {
          label: 'Align',
          submenu: [
            { label: 'Align Left', click: () => mainWindow.webContents.send('menu-command', 'align-left') },
            { label: 'Align Center', click: () => mainWindow.webContents.send('menu-command', 'align-center') },
            { label: 'Align Right', click: () => mainWindow.webContents.send('menu-command', 'align-right') },
            { type: 'separator' },
            { label: 'Align Top', click: () => mainWindow.webContents.send('menu-command', 'align-top') },
            { label: 'Align Middle', click: () => mainWindow.webContents.send('menu-command', 'align-middle') },
            { label: 'Align Bottom', click: () => mainWindow.webContents.send('menu-command', 'align-bottom') }
          ]
        },
        {
          label: 'Distribute',
          submenu: [
            { label: 'Distribute Horizontally', click: () => mainWindow.webContents.send('menu-command', 'distribute-horizontal') },
            { label: 'Distribute Vertically', click: () => mainWindow.webContents.send('menu-command', 'distribute-vertical') }
          ]
        },
        { type: 'separator' },
        {
          label: 'Auto Layout',
          submenu: [
            { label: 'Tree - Top to Bottom', click: () => mainWindow.webContents.send('menu-command', 'layout-tb') },
            { label: 'Tree - Left to Right', click: () => mainWindow.webContents.send('menu-command', 'layout-lr') },
            { label: 'Tree - Bottom to Top', click: () => mainWindow.webContents.send('menu-command', 'layout-bt') },
            { label: 'Tree - Right to Left', click: () => mainWindow.webContents.send('menu-command', 'layout-rl') }
          ]
        },
        { type: 'separator' },
        {
          label: '🐟 Fishbone Layout',
          click: () => mainWindow.webContents.send('menu-command', 'layout-fishbone')
        },
        {
          label: '📅 Timeline (Horizontal)',
          click: () => mainWindow.webContents.send('menu-command', 'layout-timeline-horizontal')
        },
        {
          label: '📅 Timeline (Vertical)',
          click: () => mainWindow.webContents.send('menu-command', 'layout-timeline-vertical')
        },
        { type: 'separator' },
        {
          label: 'Group',
          accelerator: 'CmdOrCtrl+G',
          click: () => mainWindow.webContents.send('menu-command', 'group')
        },
        {
          label: 'Ungroup',
          accelerator: 'CmdOrCtrl+Shift+G',
          click: () => mainWindow.webContents.send('menu-command', 'ungroup')
        }
      ]
    },
    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'F1',
          click: () => mainWindow.webContents.send('menu-command', 'show-shortcuts')
        },
        {
          label: 'Documentation',
          accelerator: 'F2',
          click: () => mainWindow.webContents.send('menu-command', 'show-help')
        },
        { type: 'separator' },
        {
          label: 'Examples',
          click: () => mainWindow.webContents.send('menu-command', 'show-examples')
        },
        { type: 'separator' },
        {
          label: 'GitHub Repository',
          click: () => shell.openExternal('https://github.com/yourusername/drawdd')
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/yourusername/drawdd/issues')
        },
        { type: 'separator' },
        {
          label: 'About DRAWDD',
          click: () => mainWindow.webContents.send('menu-command', 'show-about')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  // Don't create native menu - web MenuBar is used instead
  Menu.setApplicationMenu(null);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
