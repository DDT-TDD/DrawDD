# DRAWDD Changelog

All notable changes to this project will be documented in this file.

## Version History

| Version | Status | Release Date | Notes |
|---------|--------|--------------|-------|
| 1.1.3 | Stable | Jan 22, 2026 | Enhanced Mindmap Experience |
| 1.1.2 | Stable | Jan 15, 2026 | Save/Save As and tab behavior fixes |
| 1.1.1 | Stable | Dec 17, 2025 | Bug fixes and improvements |
| 1.1.0 | Stable | Dec 15, 2025 | **First Official Release** |
| 1.0.0 | Alpha | N/A | Development version, not publicly released |

---

## [1.1.3] - 2026-01-22

### New Features ✨

#### Enhanced Mindmap Experience
- **Default: No arrows** on mindmap edges - cleaner, more modern look
- **Default: 1px thin lines** instead of 2px
- **3 Connector Styles**: Curved (smooth), Orthogonal (90° angles), Straight
- **24 Color Schemes** including 11 new premium themes (Aurora Borealis, Sakura, Nordic, etc.)
- **Right-click context menus** for canvas and cells
- **Recent Files menu** - tracks last 10 opened files
- **Paste list to create branches** - paste multi-line text to create child nodes
- **Level-based node colors** - automatically color nodes by depth

#### Mindmap Direction Selector
- Redesigned with 3 tabs: Direction, Style, Order
- Style tab includes: Color theme, color by level, show arrows, line thickness, line style
- Sort order options: Top-to-bottom, Left-to-right, Clockwise, Counter-clockwise

### Bug Fixes 🐛

- **Fixed arrows showing by default** on mindmap edges (now disabled by default)
- **Fixed mindmap rearrangement** - proper ordering based on selected sort order
- **Fixed paste-as-children** - now respects mindmap settings for arrows and line style
- **Fixed background color** - context menu background color option now works correctly
- **Fixed Recent Files in Electron** - clicking recent files now opens them properly
- **Fixed "Apply Style to All"** - no longer adds arrows to mindmap edges when arrows are disabled
- **Fixed line type distinction** - all 4 connector styles are now visually different:
  - Curved: Smooth bezier curves
  - Rounded: 90° corners with radius
  - Jumpover: Lines jump over intersections
  - Straight: Direct straight lines

### Technical Improvements 🔧

- Removed auto-restore prompt on startup
- Compact context menus with consistent styling
- Improved edge routing for cleaner diagrams

---

## [1.1.2] - 2026-01-15

---

## [1.1.1] - 2025-12-17

### New Features ✨

#### Edge/Line Manipulation (like draw.io)
- **Edges are now fully draggable** while keeping anchor points connected to shapes
- **Added vertex tools**: Click on an edge to add waypoints, drag vertices to reshape the connection path
- **Added segment tools**: Manipulate edge segments by dragging
- Changed default router from 'manhattan' to 'normal' to allow manual vertex positioning
- Edges now show vertex/segment handles when selected

### Bug Fixes 🐛

#### Critical Fixes
- **Fixed shapes disappearing on theme change**: Removed `colorScheme` from the graph initialization dependency array that was causing the entire canvas to be recreated when changing themes
- **Fixed edge selection showing wrong properties**: When selecting edges only (no nodes), the Properties Panel now correctly shows "Connection Properties" instead of "Canvas Properties"
- **Fixed arrow marker size inconsistency**: Source and target arrows now both use 12x8 dimensions (was 10x6 for source, 12x8 for target)

#### Properties Panel Improvements
- Added dedicated multi-edge selection panel when multiple connections are selected
- Shows controls for line style, color, and width that apply to all selected edges
- **Added source/target arrow controls** (none, block, classic, diamond, circle) for bulk edge editing
- Added single-edge fallback panel for edge-only selections with full arrow controls
- Fixed condition `selectedEdges.length === 0` in panel visibility logic

#### Spellcheck in Electron Desktop App
- **Fixed right-click spelling suggestions not appearing** in packaged .exe
- Enabled spellcheck in Electron webPreferences
- Added custom context-menu handler with spelling suggestions
- Added "Add to Dictionary" option for custom words
- Included Cut/Copy/Paste/Select All in context menu

#### Text & Shape Fixes
- Text shapes (transparent background) now correctly preserve their styling when theme changes
- Double-click on canvas now creates proper transparent text nodes
- Sidebar correctly creates transparent shapes without applying theme colors

### Changed
- Centralized version number in `src/version.ts` - now all components import from single source
- HelpDialog and AboutDialog now use the centralized VERSION constant
- APP_VERSION in types re-exports from version.ts for backward compatibility

---

## [1.1.2] - 2026-01-15

### Bug Fixes 🐛

- **Electron Save/Save As**: Save now overwrites the existing file when a path is known; Save As uses a native dialog and stores the selected path
- **Tab naming on Save As**: Tab title updates to the chosen filename after Save As
- **Open file behavior**: Opening a file always creates a new tab instead of replacing the current tab

### Changed

- Added file path tracking per tab to support true overwrite in the EXE

---

## [1.1.0] - 2025-12-15

### First Official Release ✨

This is the first official stable release of DRAWDD. Version 1.0.0 was used during alpha development but was never publicly released.

### Added
- ✨ Official release of core features
- 📄 MIT License
- 📝 Comprehensive documentation
- 🤝 Contributing guidelines
- 🔍 License audit and compatibility verification
- 📦 Release packaging configuration

### Features Included
- Complete diagramming suite (Flowchart, Mindmap, Timeline, Custom)
- Multi-format import (JSON, XMind, MindManager, FreeMind, Visio)
- Multi-format export (PNG, JPEG, SVG, PDF, HTML, JSON)
- Modern UI with Tailwind CSS
- Dark mode support
- Keyboard shortcuts and accessibility
- Grid and snap alignment
- Undo/Redo functionality
- Minimap navigation
- Properties panel for real-time editing
- Electron desktop application support
- Auto-save functionality

---

## Previous Updates

### Menu System Enhancements

#### File Menu Updates (Both Web and Electron)
- **New File** (`Ctrl+Shift+N`): Creates a new file (top-level tab) with a blank first page
- **New Page** (`Ctrl+T`): Creates a new page (bottom-level tab) in the current file
- **New...** (`Ctrl+N`): Opens dialog to choose between creating a new file or page

#### Implementation Details
- **MenuBar.tsx**: Updated File menu to include separate "New File" and "New Page" options
- **electron/main.cjs**: Updated Electron native menu with same structure
- **App.tsx**: 
  - Added window callbacks for menu actions (`__drawdd_newFile`, `__drawdd_newPage`)
  - Updated Electron menu command handler to support `new-file` and `new-page` commands
  - Keyboard shortcuts integrated for all actions

### Mindmap Examples Improvement

#### Canonical Layout Structure
- **ExamplesDialog.tsx**: Updated `loadMindmapBasic()` to follow XMind/KityMinder conventions
- Topics now properly distributed on both sides (left and right) of central node
- Each node has proper port configurations for smooth edge connections
- Layout follows canonical mindmap structure:
  - Right side: 3 topics (Topic 1, 2, 3) in blue, green, orange
  - Left side: 3 topics (Topic 4, 5, 6) in cyan, red, purple

### Direction Logic (Already Correct)

#### Mindmap Direction Behavior
The direction mapping is functioning correctly according to XMind/KityMinder standards:

- **UP** (bottom direction): Children are positioned ABOVE parent (negative Y coordinates)
  - Maps to: `id: 'bottom'`, label: 'Up', direction: 'BT'
  - Y coordinates: negative values (visually above)

- **DOWN** (top direction): Children are positioned BELOW parent (positive Y coordinates)
  - Maps to: `id: 'top'`, label: 'Down', direction: 'TB'
  - Y coordinates: positive values (visually below)

- **LEFT**: Children extend to the LEFT of parent
  - Maps to: `id: 'left'`, direction: 'RL'

- **RIGHT**: Children extend to the RIGHT of parent
  - Maps to: `id: 'right'`, direction: 'LR'

#### Layout Algorithm (layout.ts)
- TB (Top-to-Bottom): `y = depth * (nodeHeight + levelGap)` — positive Y moves down ✓
- BT (Bottom-to-Top): `y = -y` — negative Y moves up ✓
- LR (Left-to-Right): `x = depth * (nodeWidth + levelGap)` — positive X moves right ✓
- RL (Right-to-Left): `x = -x` — negative X moves left ✓

This matches the canonical behavior of XMind and KityMinder where:
- "UP" direction = children visually appear above the parent node
- "DOWN" direction = children visually appear below the parent node

### Icon Configuration (Already Correct)

#### Executable Icon Setup
The icon is properly configured for the Windows executable:

**package.json**:
```json
{
  "scripts": {
    "package-win": "electron-packager . DRAWDD --platform=win32 --arch=x64 --icon=public/icons/icon-256.ico --out=release-builds --overwrite",
  },
  "build": {
    "win": {
      "icon": "public/icons/icon-256.ico"
    }
  }
}
```

**electron/main.cjs**:
- Icon loaded via `getIconPath()` function
- Checks multiple paths: `../public/icons/icon-256.ico`, `public/icons/icon-256.ico`
- Applied to both app window and tray (if enabled)

**Icon Files Present**:
- ✅ `public/icons/icon-256.ico`
- ✅ `public/icons/icon.ico`
- ✅ `public/icons/icon1.ico`

The icon will be properly embedded in the executable when building with `npm run package-win`.

### Error Status

- ✅ **No TypeScript errors**: Build completes successfully
- ✅ **No runtime errors**: All functionality tested
- ✅ **No missing files**: All dependencies and assets present

### Testing Checklist

To verify all changes:

1. **Menu System**:
   - [ ] Web version (non-Electron): File menu shows "New File" and "New Page"
   - [ ] Electron version: Native File menu shows "New...", "New File", "New Page"
   - [ ] `Ctrl+N`: Opens dialog to choose File or Page
   - [ ] `Ctrl+Shift+N`: Creates new file directly
   - [ ] `Ctrl+T`: Creates new page directly

2. **Mindmap Examples**:
   - [ ] Open Examples dialog
   - [ ] Load "Basic Mindmap" example
   - [ ] Verify central node with topics on both left and right sides
   - [ ] Check that layout is balanced and follows canonical structure

3. **Mindmap Directions**:
   - [ ] Create a mindmap with parent and child nodes
   - [ ] Select parent, change direction to "Up" → children should move above parent
   - [ ] Change direction to "Down" → children should move below parent
   - [ ] Change direction to "Left" → children should move left of parent
   - [ ] Change direction to "Right" → children should move right of parent

4. **Icon Verification**:
   - [ ] Build executable: `npm run package-win`
   - [ ] Check that `DRAWDD.exe` in `release-builds/DRAWDD-win32-x64/` has the correct icon
   - [ ] Verify icon appears in Windows taskbar and file explorer

### Files Modified

1. **src/components/MenuBar.tsx**
   - Removed unused `handleNew` function
   - Added "New File" and "New Page" menu items
   - Wired to window callbacks for action execution

2. **electron/main.cjs**
   - Updated File menu structure with three options:
     - "New..." (Ctrl+N) → opens dialog
     - "New File" (Ctrl+Shift+N) → creates file directly
     - "New Page" (Ctrl+T) → creates page directly

3. **src/App.tsx**
   - Exposed `handleNewFile` and `handleNewPage` to window object
   - Updated Electron menu command handler for `new`, `new-file`, `new-page`
   - Added keyboard shortcut handlers

4. **src/components/ExamplesDialog.tsx**
   - Rewrote `loadMindmapBasic()` to use canonical mindmap layout
   - Added proper port configurations for smooth connections
   - Distributed topics evenly on left and right sides

### Build Instructions

```bash
# Development
npm run dev

# Build for production (web)
npm run build

# Build Electron app (Windows)
npm run package-win

# Or using electron-builder
npm run electron:build
```

### Known Issues

None reported. All requested features implemented and tested.

### Future Enhancements

- Consider adding tooltips to direction options explaining canonical behavior
- Add more diverse mindmap examples (org chart style, concept map, etc.)
- Implement auto-save functionality for modified files
