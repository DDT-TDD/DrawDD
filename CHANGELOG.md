# Changelog

All notable changes to this project will be documented in this file.

## [2.4.0] - 2026-09-10

### Added

#### New Color Themes
- **Black & White Theme**: High-contrast, clean monochrome theme with pure white canvas, solid black lines, black text, and crisp black-and-white node styling.
- **Grayscale Theme**: Subtle and professional neutral gray tones designed for clean printing and documentation.
- **Wireframe (Transparent) Theme**: Minimalist wireframe presentation with a completely transparent canvas background, transparent shape fills, solid black borders, and black text.
- **Transparent PNG Export**: PNG exports with the Wireframe (Transparent) theme or transparent canvas background preserve alpha channel transparency.

#### Multi-Selection Properties Panel Enhancements
- **Bulk Text & Typography Styling**: Text color, font family, font size, text alignment (left, center, right), and font styles (bold, italic, underline) can now be modified simultaneously for multiple selected shapes or all shapes (`Ctrl+A`).
- **Comprehensive Bulk Appearance Controls**: Border style (solid, dashed, dotted), stroke width, corner radius, fill color, stroke color, opacity, and drop shadows can be set in bulk across multiple selected shapes.
- **Bulk Connection Styling**: Multi-edge selection now supports bulk changes to line styles, arrowhead markers, and line routing.

#### Connection Usability & Automatic Rerouting
- **Draw.io-Style Connection Snapping**: Relaxed connection validation to allow snapping directly to target node boundaries and bodies rather than requiring exact 6px port circle placement.
- **Connectable Magnet Visual Feedback**: Added `magnetAvailable` highlighting when dragging connections near valid target ports.
- **Reset Waypoints / Reroute Action**: Added "Reset Waypoints / Reroute" controls to the edge context menu and Properties Panel to cleanly discard obsolete manual waypoints and restore optimal Manhattan routing.
- **Automatic Rerouting on Style Switch**: Switching edge routing types (e.g., Orthogonal, Rounded, Straight, Smooth Curves) automatically resets stale vertices for a clean route.

### Fixed

#### Page Tab Bar & Duplication
- **Page Renaming on Duplicated Tabs**: Fixed event bubbling from the rename `<input>` to the parent tab element that previously triggered page selection and prematurely aborted rename operations.
- **Double-Submit Prevention**: Added `isSubmittingRef` guard preventing enter keypress and input blur race conditions during page renaming.
- **Context Menu Clamping**: Dynamically calculated context menu coordinates to prevent page tab context menus from overflowing off-screen.
- **Atomic Page Duplication**: Page duplication now atomically captures and clones active graph state and file data simultaneously.

## [2.3.2] - 2026-08-20

### Security

#### Dependency Hardening & Toolchain Upgrades
- **Archive Extraction & Symlink Protections**: Upgraded `tar` and packaging modules to address arbitrary file overwrite and symlink poisoning vulnerabilities (GHSA-34x7-hfp2-rc4v, GHSA-8qq5-rm4j-mr97).
- **Vite & Rollup Upgrades**: Upgraded `vite` to `7.3.6` and `rollup` to patch path traversal, source map disclosure, and Windows UNC path NTLM vulnerabilities (GHSA-4w7w-66w2-5vf9, GHSA-v6wh-96g9-6wx3, GHSA-mw96-cpmx-2vgc).
- **Safe ZIP Handling**: Configured `adm-zip` override (`>=0.6.0`) for `vsdx-js` preventing malicious 4GB allocation DoS vectors (GHSA-xcpc-8h2w-3j85).
- **Export & Parser Fixes**: Bumped `jspdf` to `4.2.1` and CSS dependencies to eliminate PDF injection and XSS risks (GHSA-f8cm-6447-x5h2, GHSA-qx2v-qp2m-jg93).
- **ReDoS Mitigations**: Updated `brace-expansion`, `picomatch`, and `nanoid` packages.

### Fixed

#### Test Harness
- **KaTeX Delimiter Property Test Isolation**: Excluded `$` in markdown property test generators to eliminate false positive collisions with inline math formulas.

## [2.3.1] - 2026-07-27

### Fixed

#### draw.io Imports
- **Multi-page draw.io XML Import**: Full support for importing multi-page `.drawio` and `.xml` files. Each diagram page in the draw.io document is successfully parsed, decompressed (handling raw/uncompressed and compressed base64 zlib-deflate content), and imported as a separate tab/page inside DRAWDD.

#### Export Filename Polish
- **Dynamic Export Naming**: Exported files from both the Toolbar and MenuBar are now named dynamically based on the active tab/diagram title and the target export format extension (e.g. `diagram-name.png`, `diagram-name.svg`, etc.), rather than falling back to hardcoded `drawdd-export.*` or `diagram.*` names.

#### Flowchart Line Creation & Interaction
- **Standardized Connector Routing**: Unified line creation router and connector definitions across canvas port dragging, Toolbar default settings, PropertiesPanel, and QuickConnect (`rounded` -> manhattan + rounded, `ortho` -> manhattan + normal, `smooth` -> normal + smooth, `straight` -> normal + normal).
- **Contextual Line Handle Selection**: Edge handles dynamically adapt to the line style — attaching `segments` tool handles to orthogonal/manhattan lines and `vertices` waypoint handles to straight/curved lines.
- **QuickConnect Preference Inheritance**: QuickConnect hover arrows now inherit the active toolbar flowchart connector style and line stroke color when generating connected shapes.

## [2.3.0] - 2026-06-30

### Fixed

#### History & Undo Stability
- **Programmatic Operations History Filtering**: The undo stack is now cleared after loading page data, creating a blank canvas, switching tabs, or importing files. This prevents programmatic graph reconstruction steps from creating unwanted history states.
- **Batched Auto-Layout Actions**: Flowchart, mindmap, tree, fishbone, and timeline auto-layout actions are now consolidated inside layout-specific history batches, allowing users to undo a full auto-layout in a single step.

#### First-Selected Alignment
- **Key Object Alignment**: Bounding-box-based alignment has been replaced with first-selected relative alignment. Clicking Align Left, Center H, Right, Top, Center V, or Bottom will align all other selected shapes relative to the first selected key shape.
- **Selection Order Tracking**: Handlers for selection changed, cell selection, and cell deselection events now maintain an exact selection history list (`graph._selectionOrder`) to correctly identify the first selected element.
- **Batched Alignment Actions**: All alignment updates are wrapped in an `'align'` batch so they undo as a single action.

#### Arrow & Line Routing
- **Perpendicular Port Exit Enforcement**: Removed hardcoded direction restrictions from the manhattan router in the canvas edge builder and toolbar default routing. This allows the routing engine to naturally exit ports perpendicularly, preventing weird loops and overlap regressions.

## [2.2.3] - 2026-05-28

### Fixed

#### KityMinder Mindmap Import
- **Visible Imported Labels**: KityMinder node colors and font styling are now normalized into the imported mindmap model, and label colors fall back to a readable contrast color when the source JSON omits an explicit text color.
- **KityDD Font Compatibility**: KityMinder `font-family` metadata is now imported and applied to rendered labels so KityDD-exported typography is preserved.
- **Defensive Topic Normalization**: Non-string node text payloads are normalized into visible labels during KityMinder conversion to prevent blank nodes when text arrives as arrays.
- **File Text Compatibility**: KityMinder JSON imports now fall back to `FileReader` when `File.text()` is unavailable, which keeps the import path working in older jsdom-based test environments and similar runtimes.

## [2.2.2] - 2026-05-18

### Added

#### Import Workflow
- **Centralized Import Routing**: Added a shared import workflow so toolbar import, menu import, recent-file reopen, and Electron file-open actions all use the same format detection and graph-loading logic.
- **Import Detection Tests**: Added focused tests for content-based import detection and Electron file reconstruction helpers.
- **Markdown Link Regression Coverage**: Added regression coverage to keep markdown link URLs stable when they contain markdown-like characters such as `$`, `_`, or `*`.

### Fixed

#### KityMinder and Cross-Format Imports
- **KityMinder JSON Detection**: KityMinder files are now detected by JSON structure instead of only by the `.km` extension, so compatible `.json` exports import correctly.
- **FreeMind / FreePlane XML Detection**: `.mm` and compatible XML files now route through FreeMind or FreePlane import based on content instead of extension-only assumptions.
- **draw.io / XML Routing**: draw.io `.drawio` and `.xml` imports now share the same detection path across browser and Electron flows.
- **Electron Binary File Opening**: Electron file-open and recent-file reopen paths now preserve binary payloads for `.xmind`, `.mmap`, and `.vsdx` files instead of forcing UTF-8 text reads.

#### Imported Text Editing
- **Mindmap Label Auto-Sizing**: Imported mindmap nodes now run through the same auto-size and wrapping logic as native nodes, preventing long imported labels from spilling outside node boundaries.
- **Inline Edit Stability**: F2 inline editing now uses the same label update path as the multiline editor, preventing imported node text from going blank after edits.
- **Imported Diagram Wrapping**: draw.io and Visio imported labels now receive explicit text wrapping so imported text stays inside shapes and remains editable.

#### Markdown Rendering
- **Protected Link URLs During Markdown Parsing**: Markdown links now preserve `$`, `_`, `*`, and similar characters inside the `href` instead of letting later KaTeX or emphasis passes corrupt the generated anchor.

### Changed

#### Release Audit
- **Documentation Refresh**: README, release notes, release checklist, and version metadata now document the import audit and 2.2.2 packaging state.
- **Repository Hygiene**: `.gitignore` now excludes exported `.km` artifacts alongside other local export files.

## [2.2.1] - 2026-05-13

### Added

#### Help & Examples
- **Venn Example Gallery**: Added built-in 2-set and 3-set Venn examples to Help -> Examples Gallery so users can load overlap diagrams directly from the in-app examples menu.
- **Help Dialog Coverage**: Documented Venn diagrams inside the in-app Help dialog so the Help menu now reflects all supported diagram modes.

### Fixed

#### Venn Diagram Theming
- **Per-Theme Venn Palettes**: Each color scheme now generates a fully distinct Venn circle palette instead of applying only an imperceptible 10% background tint. Chromatic themes (Ocean Breeze, Sunset Glow, Forest Fresh, Lavender Dream, etc.) rotate five evenly-spaced hues around the color wheel starting from the theme's characteristic `lineColor` hue, giving each theme a genuinely recognizable Venn palette. Achromatic/neutral themes (Default, Charcoal, Executive, High Contrast) continue to use the classic Blue · Red · Green · Purple · Orange palette.
- **Dark-Mode Opacity**: Venn circles in the Dark Mode theme now use a minimum `fillOpacity` of 0.40 (up from 0.28) so semi-transparent circles remain clearly visible against the dark canvas.
- **Label Legibility**: Venn set labels now use a deep-tinted shade of the circle color on light themes and a pale-tinted shade on dark themes, ensuring readable contrast in all themes.
- **Electron Compatibility**: The HSL-based palette derivation is pure JavaScript math with no DOM or browser-specific APIs, so identical Venn theming applies in both the web build and the Windows Electron portable executable.

### Changed

#### Release Audit
- **Metadata Alignment**: Updated the root package lockfile version metadata to 2.2.1 and refreshed release documentation to match the shipped Help menu examples and regenerated portable build.

## [2.2.0] - 2026-05-11

### Added

#### Venn Diagram Mode
- **Dedicated Mode**: Added a first-class Venn Diagram mode across the toolbar, diagram picker, sidebar, and status display
- **Venn Shape Library**: Added reusable overlapping circles, intersection labels, item labels, and title blocks tuned for Venn-style composition
- **Presentation Templates**: Added built-in 2-set, 3-set, and 4-set Venn templates for fast diagram creation

### Fixed

#### Save/Load Fidelity
- **Mode Persistence**: DRAWDD documents now preserve the active diagram mode across export, import, page duplication, and multi-page tab switching
- **Legacy Compatibility**: Older single-page `.drwdd` / `.json` documents still open correctly, while non-flowchart diagrams are inferred and restored more reliably when explicit mode metadata is missing
- **Menu/Toolbar Import Fallbacks**: Direct import fallbacks now restore the correct mode for multi-page files and legacy documents instead of defaulting silently to flowchart behavior

#### Venn Interaction
- **Flowchart-Like Editing**: Venn mode now participates in Quick Connect behavior like freeform diagram modes while remaining isolated from mindmap-only keyboard actions
- **Theme Recoloring**: Switching color schemes now recolors existing Venn sets from both the canvas properties panel and the Settings dialog instead of leaving circles on their original palette
- **Template Theme Styling**: Newly created Venn templates now adopt the active theme-specific Venn palette immediately instead of keeping the raw template colors while only the background changes
- **Shape Toggle Undo**: Undo after switching a Venn set between rectangle and ellipse now restores a single shape instead of leaving duplicate geometry on the canvas

### Changed

#### Release Metadata
- **Version Bump**: Updated package and application versioning to 2.2.0
- **Documentation Refresh**: README, release checklist, and release notes now document Venn diagram creation and 2.2.0 release packaging

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
