# Changelog

All notable changes to this project will be documented in this file.

## [2.0.1] - 2026-02-03

### Fixed

#### Mindmap
- **Drag-and-Drop Reparenting**: Node levels now correctly update when dragging nodes to new parents, including all descendants
- **Delete All Lines Button**: Now correctly removes edges connected to selected nodes using live graph state
- **Collapse/Expand Indicators**: Edge event handlers now properly check both source and target nodes for accurate indicator display

#### Text Editing
- **Shape Size Preservation**: Shapes no longer resize when editing text; they only grow if text doesn't fit, never shrink below user's chosen size
- **Multi-line Text**: Explicit newlines in text now display correctly

#### Code Quality
- **Memory Leak Fix**: Added proper cleanup for `edit-cell-text` event listener
- **Debug Code Removal**: Removed debug `console.log` statements from `collapse.ts` and `RichContentNode.tsx`

## [2.0.0] - 2026-01-30

### Added

#### Markdown Rendering
- **GitHub Flavored Markdown in Nodes**: Full GFM support with bold, italic, headers, lists, code blocks, links, and images
- **Clickable Links**: Link-only nodes automatically become clickable, open in browser
- **Image Thumbnails**: Images render as clickable thumbnails, click to view full size
- **Settings Control**: Global toggle for markdown rendering with persistence
- **Smart Exclusions**: Linked folder nodes excluded from markdown rendering

#### Folder Explorer
- **Linked Mode**: Live connection to file system with refresh capability
- **Static Mode**: One-time snapshot for documentation
- **File Operations**: Click file nodes to open in default application
- **Visual Distinction**: Unique icons and colors for linked/static and folder/file nodes
- **Operations**: Link Folder, Insert Folder Snapshot, Refresh Branch, Unlink Node/Branch, Refresh All
- **Auto-Collapse**: Folders auto-collapse at depth 4 for manageability
- **Hidden Files**: Toggle to include/exclude hidden files
- **Read-Only Protection**: Linked nodes are read-only until unlinked

#### Collapse/Expand
- **Branch Collapsing**: Collapse/expand mindmap branches with visual indicators
- **State Persistence**: Collapsed state persists across save/load
- **Smart Visibility**: Edges hide/show with nodes automatically
- **Visual Indicators**: Clear distinction between collapsed nodes and leaf nodes
- **Auto-Collapse**: Folder explorer nodes auto-collapse at depth 4

#### Enhanced Clipboard & Import
- **Full Markmap/Markdown Compatibility**:
  - Paste full markdown documents on the canvas to automatically generate mindmaps.
  - Paste on node creates child branches from markdown.
  - Smart hierarchy detection for bullet points, headers, and tabs.
- **Excel/Spreadsheet Paste**: Column position determines hierarchy level
- **Indented Text Paste**: Auto-detects indent size (2, 4, or 8 spaces)
- **Bullet/Numbered Lists**: Automatically removes markers and creates hierarchy
- **FreePlan Import**: Full support for FreePlan mindmap files (.mm format)
- **Enhanced XMind/FreeMind Import**: 50+ icon mappings, metadata preservation, style preservation

#### Timeline Enhancements
- **Date Metadata System**: Date picker, end dates, chronological auto-sorting
- **Priority Levels**: Low/Medium/High with color coding
- **Status Tracking**: Planned/In Progress/Completed/Cancelled with opacity
- **Smart Layout**: Automatic chronological sorting with time-based spacing

#### Flowchart Enhancements
- **Port Visualization**: Connection count badges, port highlights, color coding
- **Visual Connection Management**: See all ports and connections on hover

#### Export Formats
- **Markdown Export**: Export mindmaps as structured Markdown with metadata
- **Text Outline Export**: Export as plain text outline with hierarchy

#### Layout & UI
- **Compact Layout Mode**: 30% tighter spacing for dense mindmaps (backend implemented)
- **Improved Timeline Mode**: Enhanced shape visibility with vibrant colors and emoji indicators

### Technical Improvements
- **Type Safety**: 100% TypeScript coverage
- **Error Handling**: Comprehensive error handling with toast notifications
- **Performance**: Optimized layout algorithms and lazy loading
- **Testing**: 40+ property-based tests for correctness validation
- **Code Quality**: Clean, documented, maintainable code

### New Files
- `src/utils/fileSystem.ts` - File system scanning and traversal
- `src/utils/folderExplorer.ts` - Folder mindmap generation
- `src/utils/folderExplorerStyles.ts` - Folder node styling
- `src/utils/collapse.ts` - Collapse/expand functionality
- `src/utils/notifications.ts` - Toast notification system
- `src/components/MarkdownRenderer.tsx` - Markdown rendering component
- `src/components/ImageThumbnail.tsx` - Image thumbnail component
- `src/utils/portManagement.ts` - Port visualization system
- 40+ test files for property-based testing

### Bug Fixes
- Improved mindmap layout stability
- Enhanced clipboard detection
- Better error messages for imports
- Fixed edge routing for multiple connections
- Improved dark mode compatibility
- Fixed markdown rendering edge cases
- Improved file system error handling
- Enhanced collapse/expand state persistence

### Documentation
- Updated README with new features
- Added comprehensive release notes
- Added feature summary documentation
- Added implementation progress tracking
