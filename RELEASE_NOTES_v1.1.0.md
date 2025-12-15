# DRAWDD v1.1.0 - First Official Release

**Release Date**: December 15, 2025

> **Note**: v1.0.0 was an alpha version never publicly released. v1.1.0 is the first official stable release of DRAWDD.

## Overview

DRAWDD is now officially released! A powerful, open-source diagramming application for creating professional flowcharts, mindmaps, timelines, and custom diagrams with an intuitive interface and modern design.

---

## ✨ Key Features

### 📊 Diagram Types
- **Flowcharts**: Professional flowcharts with process, decision, data, and document shapes
- **Mindmaps**: Hierarchical mindmaps with automatic smart layout (Right, Left, Both sides, Radial)
- **Timelines**: Chronological diagrams with events, milestones, periods, and phases
- **Custom Diagrams**: Design any diagram with flexible shapes and connectors
- **Image Support**: Insert and resize images as diagram elements with full connection support

### 📥 Import Formats
- **JSON** - DRAWDD native format for full fidelity
- **XMind** (.xmind) - Import mindmaps from XMind 8+
- **MindManager** (.mmap) - Import from MindManager
- **KityMinder** (.km) - Import from KityMinder format
- **FreeMind** (.mm) - Import FreeMind mindmaps
- **Visio** (.vsdx) - Import Microsoft Visio diagrams

### 📤 Export Formats
- **PNG** - High-resolution image export
- **JPEG** - Compressed image format with quality control
- **SVG** - Scalable vector graphics for web and print
- **PDF** - Portable document format with auto-orientation
- **HTML** - Standalone HTML viewer with embedded diagram
- **JSON** - Save and share with full fidelity

### 🎨 User Interface
- **Modern Design**: Beautiful interface inspired by draw.io
- **Dark Mode**: Full dark mode support for comfortable editing
- **Drag-and-Drop**: Organized shape library by category
- **Real-time Properties Panel**:
  - Colors, labels, borders, fonts
  - Text decorations (emojis, icons, numbers, flags)
  - Image URLs for image nodes
  - Shape replacement while preserving connections
  - Corner radius, opacity, rotation, shadows
- **Smart Features**:
  - Context-aware right-click menus
  - Minimap for navigation
  - Smart snap lines for alignment
  - Zoom and pan controls with mouse wheel
  - Undo/Redo support (Ctrl+Z / Ctrl+Y)

### ⌨️ Keyboard Shortcuts
- **Ctrl+N** / **Cmd+N**: New diagram (shows dialog)
- **Ctrl+Shift+N** / **Cmd+Shift+N**: New file
- **Ctrl+T** / **Cmd+T**: New page
- **Ctrl+S** / **Cmd+S**: Save diagram
- **F2**: Edit selected node text
- **Insert**: Add child node (mindmap)
- **Enter**: Add sibling node (mindmap)
- **Delete** / **Backspace**: Delete selected
- **Ctrl+Z** / **Cmd+Z**: Undo
- **Ctrl+Y** / **Cmd+Y**: Redo
- **Ctrl+A** / **Cmd+A**: Select all
- **Ctrl+F**: Find and Replace

### 🔧 Advanced Features
- **Multi-page Support**: Organize diagrams across multiple pages within one file
- **Multiple Files**: Work with multiple diagram files in tabbed interface
- **Grid Control**: Show/hide grid, customize grid size
- **Color Schemes**: Pre-defined color schemes for quick styling
- **Layout Algorithms**: Automatic tree and fishbone layouts
- **Port Configuration**: Intelligent connection point management
- **Shape Library**: 50+ pre-built shapes across multiple categories
- **Auto-save**: Automatic backup of unsaved work

---

## 🖥️ Platform Support

### Web Application
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on desktop and tablet

### Desktop Application (Windows)
- Standalone Electron application
- Windows 7 and newer
- NSIS installer and portable version available

---

## 📦 System Requirements

### Minimum
- **RAM**: 512 MB
- **Disk Space**: 50 MB
- **Processor**: Dual-core processor

### Recommended
- **RAM**: 2 GB
- **Disk Space**: 100 MB
- **Processor**: Quad-core processor

---

## 🚀 Installation

### Portable Version (No Installation)
1. Download `DRAWDD-1.1.0-Portable.exe`
2. Extract and run the executable directly
3. No installation required

### Web Version
Online editor coming soon

---

## 💻 Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Graph Engine**: AntV X6 with plugins
- **Styling**: Tailwind CSS v4
- **Desktop**: Electron
- **File Handling**: JSZip, jsPDF, FileSaver.js
- **Icons**: Lucide React

---

## 📄 License

MIT License - Free to use, modify, and distribute

See [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions from the community!

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up development environment
- Making code contributions
- Reporting bugs
- Requesting features

---

## 🐛 Known Limitations

- Undo/Redo has a 100-action limit (per session)
- Maximum diagram size: 10000 x 10000 pixels
- Image import limited to URL or local file
- Collaborative editing not yet supported

---

## 🔮 Roadmap

Future releases will include:
- **v1.2.0**: Collaborative editing support
- **v1.3.0**: Additional diagram types (Kanban, Swimlanes)
- **v1.4.0**: Plugin system for extensibility
- **v2.0.0**: Mobile app support

---

## 📧 Support & Feedback

- **Issues**: Report bugs on [GitHub Issues](https://github.com/DDT-TDD/drawdd/issues)
- **Discussions**: Share ideas on [GitHub Discussions](https://github.com/DDT-TDD/drawdd/discussions)

---

## 🙏 Acknowledgments

DRAWDD is built on the shoulders of giants. We're grateful to:
- **AntV X6** - Powerful graph visualization engine
- **React** - Modern UI framework
- **Electron** - Cross-platform desktop framework
- All open-source contributors and the community

---

## 📊 Version History

| Version | Status | Release Date | Notes |
|---------|--------|--------------|-------|
| 1.1.0 | Stable | Dec 15, 2025 | **First Official Release** |
| 1.0.0 | Alpha | N/A | Not publicly released |

---

## 🎉 Thanks for Using DRAWDD!

We're excited to share DRAWDD with you. Your feedback and contributions help make it better every day.

Happy diagramming! 🎨
