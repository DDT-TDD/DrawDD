# Release Notes v2.1.3

## 🚀 New Features

### Standalone Line Creation
Create lines independently of node connections:
- Right-click on the canvas → **"Add Line"** to place a horizontal line with arrow at the cursor position
- Lines can be freely repositioned and reshaped after creation

### Default Line Type Setting
Set the default connector style for all new connections:
- New **"Default Line Type"** dropdown in the toolbar, available in all diagram modes
- 5 options with descriptions: Rounded Orthogonal, Sharp Orthogonal, Smooth Curves, Metro, Direct (Straight)
- Active-state highlighting shows the currently selected style
- Setting persists across sessions via local storage

### Shape Border Style
Added solid/dashed/dotted border style buttons to the Properties Panel:
- Located in the **Border** section alongside color and width controls
- Visual previews for each style, matching the existing edge line style UI
- Works with multi-selection

## 🐛 Bug Fixes

### Quick Connect Chain Creation
- **Fixed**: Clicking a Quick Connect arrow no longer auto-selects the new node, which was hiding the arrows and breaking chain creation
- Arrows now immediately appear on the newly created node, allowing rapid sequential node creation

### Edge Selection & Manipulation
- **Fixed**: Edge selection box overlay was blocking click-through to edge vertices/waypoints; now disabled
- **Improved**: Wider invisible hit area (14px) around edges makes them much easier to click
- **Added**: Selected edges now display a blue glow highlight for clear visual feedback, without blocking interaction

### KityMinder (.km) Export & Enhanced Import
- **New**: Export mindmaps as KityMinder JSON (`.km`) files via **File → Export as KityMinder (.km)**
- Exported files are compatible with KityMinder,百度脑图 (Baidu Brain Map), and the Joplin Kminder plugin
- Preserves node text, hierarchy, notes, hyperlinks, priority, progress, collapse state, and images
- **Enhanced import**: KityMinder `.km` file import now preserves notes, hyperlinks, priority, and progress metadata (previously only text and hierarchy were imported)

### Export Collapse Indicators
- **New**: Toggle in **Settings → Canvas** to show/hide collapse (+/−) buttons on mindmap nodes in exported images
- Defaults to **on** (shown); uncheck to produce cleaner exports without interactive UI elements
- Applies to PNG, SVG, JPEG, and PDF exports
