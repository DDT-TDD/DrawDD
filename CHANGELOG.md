# Changelog

All notable changes to this project will be documented in this file.

## [2.1.7] - 2026-05-06

### Fixed

#### Recent Files
- **Direct File Re-Opening (Electron)**: Files opened via File → Open in Electron now store their filesystem path in recent files, allowing them to be re-opened directly from the Open Recent submenu
- **Web Recent Files UX**: Clicking a recent file in web mode now opens the file picker directly instead of showing a blocking alert message

#### Line Styles
- **Solid Line Style Application**: Fixed solid line style not being applied — changing an edge from dashed/dotted back to solid now properly removes the dash pattern
- **Solid Line via Context Menu**: Right-click → Solid Line now correctly clears the dash pattern on edges
- **Solid Line via Copy/Paste Format**: Copy Format from a solid edge and Paste Format to a dashed edge now properly removes the dash pattern
- **Solid Line Active State**: The solid style button in the edge properties panel now correctly highlights when the edge has a solid line

## [2.1.6] - 2026-04-20

### Fixed

#### draw.io Import
- **HTML Label Stripping**: Imported draw.io labels now have HTML tags properly stripped to produce clean plain text, with `<br>` and block-level tags converted to line breaks and HTML entities decoded
- **Edge Labels as Child Cells**: Edge labels stored as separate child `mxCell` elements (common in draw.io) are now detected and merged into their parent edge during import
- **Group/Container Relative Geometry**: Cells nested inside draw.io groups or containers now resolve to correct absolute positions by walking the parent chain
- **Electron Open Dialog**: `.drawio` and `.xml` files can now be opened from the Electron native File → Open dialog
- **Recent Files Type for .xml**: `.xml` files now correctly record as type `'xml'` in recent files instead of falling through

#### draw.io Export
- **Vertex Stroke Width**: Node border width is now included in the exported draw.io style
- **Vertex Opacity**: Node opacity is now exported when less than 100%
- **Vertex Dashed Borders**: Dashed border styles on nodes are now preserved in the export
- **Vertex Text Formatting**: Bold, italic, and underline text styles are now included in the export
- **Edge Stroke Width**: Edge line width is now included in the exported draw.io style
- **Edge Dashed Lines**: Dashed line styles on edges are now preserved in the export
- **Consistent Export Filename**: Both Toolbar and MenuBar now export as `diagram.drawio`

## [2.1.5] - 2026-04-14

### Fixed

#### File Opening & Tabs
- **No Silent Tab Overwrite**: Opening `.drwdd`, `.json`, `.xmind`, `.mmap`, `.km`, `.mm`, and `.vsdx` files now opens content in a new tab instead of overwriting the current working tab
- **Recent Files Consistency**: Recent-file opening now follows the same new-tab behavior as the main open flow
- **Electron File Path Tracking**: Fixed stale file-path wiring so files opened from Electron correctly retain their path for subsequent saves
- **Current Tab Preservation**: The active tab state is now persisted before new content is opened, preventing in-memory edits from being lost during open/import flows

#### Export Quality
- **High-Resolution Export**: PNG, JPEG, and PDF exports now render at 2x resolution, producing sharp images regardless of canvas zoom level or screen size
- **PDF Export DPI**: PDF pages now embed a high-resolution image while maintaining correct logical page dimensions

### Changed

#### Import Workflow
- **Unified Open Behavior**: Menu bar, toolbar import, Electron open, and recent-file actions now share the same tab-safe loading pipeline for both multi-page DRAWDD files and legacy JSON documents

#### Repository Hygiene
- **Ignore Rules Updated**: Added `.eslintcache` and `*.tsbuildinfo` to `.gitignore` to avoid committing local build cache artifacts

## [2.1.4] - 2026-03-10

### Added

#### Export
- **draw.io Export (.drawio)**: Added native export to draw.io-compatible XML format (`mxfile` / `mxGraphModel`)
- **Menu Integration**: draw.io export is available from File export actions in both the main MenuBar and Toolbar export dropdown

### Changed

#### Save Workflow
- **Toolbar Save Behavior**: Toolbar Save now uses the real application save pipeline (`Save`/`Save As` behavior) instead of exporting JSON

#### draw.io Fidelity
- **Shape Mapping**: Improved draw.io export shape/style mapping for `rect`, `ellipse`, `circle`, `diamond`, `polygon`, `image`, and `rich-content-node`

### Fixed

#### Electron API Reliability
- **Preload API Collision**: Fixed duplicate `openFile` key in `electron/preload.cjs` that could silently override file-open behavior
- **Explicit APIs**: Split open operations into dedicated methods for opening files by path vs opening with default OS application

#### Repository Hygiene
- **Ignore Rules Updated**: Added local export artifact ignore patterns (`*.drawio`, `*.drwdd`) to relevant ignore files

## [2.1.3] - 2026-02-13

### Added

#### Lines & Connections
- **Standalone Lines**: Right-click canvas → "Add Line" to create lines independent of node connections
- **Default Line Type Setting**: New toolbar dropdown (all modes) to set the default connector style for new edges (Rounded Orthogonal, Sharp Orthogonal, Curved, Straight, Metro) — with active-state highlighting and descriptions
- **Shape Border Style**: Added solid/dashed/dotted border style selector for shapes in the Properties Panel Border section

#### Export
- **Collapse Indicator Toggle**: New setting in Settings → Canvas to show/hide mindmap collapse (+/−) buttons in PNG, SVG, JPEG, and PDF exports (defaults to shown)

### Fixed

#### Quick Connect
- **No Auto-Selection**: Quick Connect arrow clicks no longer auto-select the newly created node; arrows now appear on the new node for chain creation

#### Edge Selection
- **Easier Edge Clicking**: Wider invisible hit area (14px) around edges for easier selection
- **Visual Selection Feedback**: Selected edges now show a glow highlight instead of an obstructing selection box
- **Vertex Interaction**: Disabled edge selection box overlay that was blocking waypoint/vertex manipulation

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
