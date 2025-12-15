# DRAWDD

A powerful, open-source diagramming application for creating stunning drawings, mindmaps, and flowcharts.

## Features

### 🎨 Drawing Capabilities
- **Flowcharts**: Create professional flowcharts with process, decision, data, and document shapes
- **Mindmaps**: Build hierarchical mindmaps with automatic layout (right, left, both sides, radial)
- **Timelines**: Create chronological diagrams with events, milestones, periods, and phases
- **Custom Diagrams**: Design any type of diagram with flexible shapes and connectors
- **Image Nodes**: Insert and resize images as diagram elements with full connection support
- **Text Decorations**: Add emojis, icons, numbers, and flags before/after text in nodes

### 📥 Import Formats
- **JSON**: Native DRAWDD format for full fidelity
- **XMind** (.xmind): Import mindmaps from XMind 8+
- **MindManager** (.mmap): Import mindmaps from MindManager
- **KityMinder** (.km): Import from KityMinder format
- **FreeMind** (.mm): Import FreeMind mindmaps
- **Visio** (.vsdx): Import Microsoft Visio diagrams

### 📤 Export Formats
- **PNG**: High-resolution image export
- **JPEG**: Compressed image format (92% quality)
- **SVG**: Scalable vector graphics for web and print
- **PDF**: Portable document format (auto-orientation)
- **HTML**: Standalone HTML viewer with embedded diagram
- **JSON**: Save and share your diagrams with full fidelity

### ✨ User Interface
- Beautiful, modern interface with Tailwind CSS inspired by draw.io
- Three distinct modes: Flowchart, Mindmap, and Timeline
- Drag-and-drop shape library organized by category
- **Real-time property editing**:
  - Colors, labels, borders, fonts
  - Text decorations (prefix/suffix emojis and icons)
  - Image URL for image nodes
  - Shape replacement while preserving connections
  - Corner radius, opacity, rotation, shadows
- Context-aware right-click menus (mode-specific actions)
- Minimap for easy navigation
- Smart snap lines for alignment
- Zoom and pan controls
- Undo/Redo support (Ctrl+Z / Ctrl+Y)
- Dark mode support

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **AntV X6** - Graph visualization engine (MIT License)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **JSZip** - For XMind/MindManager file parsing
- **FileSaver.js** - For file downloads

## License

**MIT License** - The most permissive open-source license.

All dependencies are also permissively licensed:
- AntV X6: MIT
- React: MIT
- Tailwind CSS: MIT
- JSZip: MIT
- FileSaver.js: MIT

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The development server runs at `http://localhost:5173` by default.

## Advanced Features

### 🖼️ Image Nodes
Insert images directly into your diagrams:
1. Drag the "Image" shape from the Basic Shapes category
2. Select the image node
3. In the Properties Panel, enter an image URL in the "Image" section
4. Resize the node as needed - images scale automatically
5. Connect to other nodes like any shape

**Supported formats**: Any web-accessible image URL (PNG, JPG, GIF, SVG, WebP)

### 🎯 Text Decorations
Add visual markers to your node text:

**Prefix Decorations** (before text):
- **Emojis**: ⭐ ✅ ❌ 🔥 💡 ⚡ 🎯 📌 🚀 💎 🏆 ⚠️
- **Markers**: 🔢 #1 @ ★

**Suffix Decorations** (after text):
- **Flags**: 🚩 🏁 🏳️ ⚑ ✓ ×

**How to use**:
1. Select a node
2. Open Properties Panel (right sidebar)
3. Scroll to "Text Decorations" section
4. Click any emoji/icon to add as prefix or suffix
5. Decorations are preserved when changing shapes

### 🔄 Shape Replacement
Replace any node's shape while keeping text and connections:
- Right-click on a node → "🔄 Change Shape"
- OR use Properties Panel → Shape section → "🔄 Change to Different Shape..."
- Select new shape from dialog
- All text, connections, and properties are preserved

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+A | Select All |
| Delete | Delete Selected |
| F2 | Edit Selected Node Text |
| Insert | Add Child Node (Mindmap) |
| Enter | Add Sibling Node (Mindmap) |
| Shift+Drag | Pan Canvas |
| Ctrl+Scroll | Zoom |

## Project Structure

```
src/
├── components/
│   ├── Canvas.tsx       # Main graph canvas
│   ├── Toolbar.tsx      # Top toolbar with actions
│   ├── Sidebar.tsx      # Shape library sidebar
│   └── PropertiesPanel.tsx  # Properties editor
├── config/
│   └── shapes.ts        # Shape definitions
├── context/
│   └── GraphContext.tsx # Global graph state
├── types/
│   └── index.ts         # TypeScript definitions
├── utils/
│   └── importExport.ts  # Import/Export utilities
├── App.tsx              # Main application
└── main.tsx             # Entry point
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Inspired by [draw.io](https://github.com/jgraph/drawio)
- Built with [AntV X6](https://github.com/antvis/X6)
- Mindmap import inspired by [Kminder](https://github.com/calandradas/Kminder-Mindmap-Joplin-Plugin)
