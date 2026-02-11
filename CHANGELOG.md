# Changelog

All notable changes to this project will be documented in this file.

## [2.1.2] - 2026-02-11

### Added

#### Context Menu
- **System Clipboard Support**: Added dedicated "Paste Text" and "Paste Image" menu items to handle system clipboard content directly on the canvas

#### Mindmap Layout
- **Spacious Mode**: Introduced a new "Spacious" layout mode (200px level gap, 70px sibling gap) for clearer presentation of large maps
- **Edge Visuals**: Added separate text/background color controls for edge labels (supporting transparency), optional label borders, and default high-contrast styling

### Fixed

#### Stability
- **Edge Label Crash**: Fixed application lock-up when adding multiline text to connection labels by optimizing SVG text rendering
- **React Warnings**: Resolved "Attempted to synchronously unmount a root" warning during graph disposal sequences

#### Layout & Rendering
- **Mindmap Shortcuts**: Fixed layout mode not persisting when using keyboard shortcuts (Tab/Backspace)
- **Compact Layout**: Improved spacing calculations for tighter node arrangements
- **Dark Mode Visibility**: Standardized edge label colors to ensure text is visible in both light and dark themes
- **Multi-Select Icons**: Replaced text-based "Source/Target Arrow" buttons in multi-selection panel with consistent icon-based controls

## [2.1.1] - 2026-02-04

### Changed

#### Theme System Overhaul
- **Professional Themes**: Complete redesign of all color schemes with light, professional backgrounds
- **28 Curated Themes**: Replaced 30+ inconsistent themes with 28 carefully designed options
- **Theme Categories**: Organized into Professional, Elegant, Nature, Warm, Creative, Pastel, Earth Tones, Accessibility, and Dark Mode
- **Improved Readability**: Better contrast ratios and meaningful color combinations

### Fixed

#### Timeline Mode
- **Context Menu Detection**: Fixed timeline context menu not showing timeline-specific options due to stale closure
- **Quick Connect Arrows**: Fixed hover arrows not appearing in Timeline mode
- **Dynamic Port Injection**: Nodes created via Insert key now properly receive connection ports

#### Connections
- **Visio Import Ports**: Shapes imported from Visio now have proper port configuration
- **Parent Node Ports**: Parent nodes now dynamically receive ports when adding child events

#### Multi-Selection
- **Selection List Display**: Properties panel now shows list of all selected items, not just count
- **Primary Selection Indicator**: Visual marker shows primary node in multi-selection
- **Mixed Selection Support**: Properly displays both nodes and edges in selection

#### Quick Connect
- **SVG Layer Positioning**: Arrows now render in correct layer
- **Pan/Zoom Updates**: Arrows update position during canvas navigation
- **Node Move Tracking**: Arrows reposition when hovered node moves

## [2.1.0] - 2026-02-03

### Added

#### Edge/Line Enhancements
- **Line Hops (Jumpover)**: Enable line hops in Properties Panel to show arc jumps where edges cross
- **Line Routing Context Menu**: Right-click edges for quick access to routing styles (Line Hops, Orthogonal, Rounded, Smooth, Straight)

#### File Format
- **New .drwdd Extension**: DRAWDD now saves files with `.drwdd` extension for easy identification
- **Backwards Compatible**: Still opens legacy `.json` and `.drawdd.json` files

### Fixed

#### Quick Connect
- **Arrow Click Handling**: Fixed Quick Connect arrows not responding to clicks in Flowchart mode
- **Event Capture**: Improved event handling to prevent X6 from intercepting arrow clicks

#### Properties Panel
- **Color Input Fix**: Fixed "transparent" color value causing console errors in color picker (now gracefully handles non-hex colors)

#### Text Rendering
- **Multi-line Text Height**: Improved auto-sizing calculation to better estimate wrapped line heights

#### Node Conversion
- **Edge Preservation**: Edges now maintain their exact connection points when nodes convert to markdown mode
- **Port Configuration**: Converted nodes now properly include all ports for edge connectivity

## [2.0.2] - 2026-02-03

### Added

#### Flowchart Tools (Flowchart Mode Only)
- **Auto-Layout**: Hierarchical auto-layout with TB, BT, LR, RL directions for automatic node arrangement
- **Swimlanes**: Create swimlane containers with templates (Departments, Roles, Project Phases, Systems)
- **Smart Connector Routing**: Multiple routing styles (Flowchart/Manhattan, Simple/Orthogonal, Curved, Metro, Direct)
- **Decision Branch Labels**: Auto-label decision node branches with Yes/No based on direction
- **Quick Connect Mode**: Utility for hover arrows to quickly add connected nodes (infrastructure ready)

#### Markdown Improvements
- **Hybrid Markdown Rendering**: Nodes are now automatically converted to support markdown when markdown syntax is detected
- **Cross-Mode Markdown**: Markdown rendering now works in Flowchart mode (previously only worked in Mindmap mode)

### Technical
- New utilities: `flowchartLayout.ts`, `swimlane.ts`, `quickConnect.ts`, `smartRouting.ts`, `decisionLabels.ts`
- Toolbar integration for flowchart-specific features
- Graph instance exposed for advanced utilities via `window.__drawdd_graph`

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
