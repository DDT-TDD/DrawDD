# DRAWDD v1.1.3 - Enhanced Mindmap Experience

**Release Date:** January 22, 2026

This release brings major enhancements to the mindmap experience including professional styling, improved context menus, and fixes for mindmap rearrangement.

---

## ✨ New Features

### 1. Enhanced Right-Click Context Menu

**Empty Canvas Context Menu** - Right-click on empty canvas now shows a comprehensive menu with:
- **Edit Section**: Paste, Select All
- **Undo/Redo**: Quick access to history
- **Insert Section**: Add Rectangle, Ellipse, Text shapes
- **View Section**: Zoom In/Out, Fit, Center, Toggle Grid

**Cell Context Menu** - Enhanced context menu for nodes and edges:
- **Mindmap Operations**: Add Child (Insert), Add Sibling (Enter), Collapse/Expand
- **Edit Operations**: Edit Text (F2), Cut, Copy, Paste, Delete
- **Arrange/Format**: Bring to Front, Send to Back, Group, Ungroup

### 2. Recent Files Menu

New "Open Recent" submenu in the File menu:
- Tracks last 10 opened files
- Shows file names with numbered shortcuts
- "Clear Recent Files" option
- Persists across sessions using localStorage

### 3. Professional Styles & Themes

**24 Beautiful Color Schemes** including new premium themes:
- **Aurora Borealis** - Deep purple to green gradient
- **Sakura Blossom** - Japanese cherry blossom pink
- **Nordic Frost** - Cool Scandinavian blues
- **Copper & Bronze** - Warm metallic tones
- **Emerald City** - Rich green palette
- **Royal Purple** - Elegant indigo theme
- **Vintage Paper** - Classic sepia tones
- **Ocean Gradient** - Deep sea blues
- **Coral Reef** - Warm coral and teal
- **Graphite** - Professional dark gray
- **Fresh Mint** - Cool mint green
- Plus 12 more: Professional, Executive, Monochrome, High Contrast, Nature, Earth, Midnight, Candy, Deep Ocean, Autumn, Neon, Blueprint

**22 Professional Fonts** available in properties panel

**10 Line Styles** including various dash patterns

### 4. Improved Mindmap Defaults

New mindmaps now have:
- **Thinner lines** (1px stroke instead of 2px)
- **No arrows** on edges by default
- Cleaner, more modern appearance

These settings can be customized in the Mindmap Direction selector.

### 5. Connector Styles (90° Orthogonal Lines)

Choose from three line connector styles for mindmaps:
- **Curved**: Smooth bezier curves (default)
- **90° Orthogonal**: Right-angle (Manhattan-style) connectors for a structured look
- **Straight**: Direct point-to-point lines

Select your preferred style in the Mindmap Settings → Style tab.

### 6. Paste List to Create Branches

**Power feature**: When a mindmap node is selected, paste multi-line text or tab-separated values to automatically create child branches.
- Paste bullet lists from Word/Docs
- Paste cells from Excel/Sheets
- Each line becomes a child node
- Layout automatically applied

### 7. Mindmap Direction Selector with Tabs

The mindmap direction dropdown now has three tabs:
- **Direction**: Right, Left, Both, Up, Down, Radial
- **Style**: Color theme, color by level, show arrows, line thickness, **line style**
- **Order**: Top-to-bottom, Left-to-right, Clockwise, Counter-clockwise

### 8. Level-Based Node Colors

Enable "Color nodes by level" to automatically color nodes based on their depth:
- Level 0 (root): Theme primary color
- Level 1: Theme secondary color
- Level 2+: Progressive color changes

Choose from 7 mindmap color themes: Blue, Green, Purple, Orange, Teal, Monochrome, Rainbow

---

## 🐛 Bug Fixes

### Mindmap Rearrangement Rules (Major Fix)

**Problem**: The mindmap rearrangement (direction change) did not follow proper ordering rules.

**Solution**:
- **Top-to-Bottom**: Children now ordered by their vertical position then horizontal
- **Left-to-Right**: Children ordered by horizontal position then vertical
- **Clockwise**: Radial layout starts from 12 o'clock (top) and proceeds clockwise
- **Counter-Clockwise**: Radial layout starts from 12 o'clock and proceeds counter-clockwise

**Result**:
- ✅ Consistent and predictable node arrangement
- ✅ User can control branch ordering via Sort Order setting
- ✅ Radial layouts properly start from top of circle

### Background Color Fix

**Problem**: Setting background color from context menu didn't work.

**Solution**: Now properly applies the color to the canvas background.

### Recent Files in Electron (Desktop App)

**Problem**: Clicking recent files in Electron showed "Error: web.open is not available in Electron".

**Solution**: Added proper IPC handler (`open-file-by-path`) to read and load files in the desktop app.

### Apply Style to All - Mindmap Arrows

**Problem**: Using "Apply Style to All" on edges would add arrows to mindmap edges even when arrows were disabled.

**Solution**: The function now checks if an edge is a mindmap edge and respects the `mindmapShowArrows` setting.

### Distinct Line Types

**Problem**: Different connector styles (curved, rounded, straight) looked identical.

**Solution**: Each line type now has a distinct visual appearance:
- **Curved**: Smooth bezier curves
- **Rounded**: 90° corners with rounded radius
- **Jumpover**: Lines jump over intersections (avoids overlaps)
- **Straight**: Direct point-to-point lines

### Removed Auto-Restore Prompt

The annoying "Restore previous session?" popup on startup has been removed for a cleaner experience.

---

## ⚙️ Technical Details

### New Files Created

| File | Purpose |
|------|---------|
| `src/utils/recentFiles.ts` | Recent files management utility |
| `src/config/enhancedStyles.ts` | Professional fonts, line styles, mindmap themes |
| `src/utils/contextMenu.ts` | Enhanced context menu system |

### Files Modified

| File | Changes |
|------|---------|
| `src/version.ts` | Updated to 1.1.3 |
| `package.json` | Updated version |
| `src/config/colorSchemes.ts` | Added 12 new professional color schemes |
| `src/types/index.ts` | Added mindmap settings types |
| `src/context/GraphContext.tsx` | Added mindmap state with localStorage persistence |
| `src/components/Canvas.tsx` | New context menu, paste-as-children, mindmap settings |
| `src/components/MenuBar.tsx` | Recent files menu integration |
| `src/components/MindmapDirectionSelector.tsx` | Tabbed interface with style/order controls |
| `src/utils/layout.ts` | Sort order support for clockwise/counter-clockwise |

---

## 🔄 Upgrade Instructions

### For Users

1. **Download** the new v1.1.3 release
2. **Replace** your existing DRAWDD installation
3. **Existing diagrams** work without changes
4. **New mindmaps** will have the cleaner default styling

### What to Test

1. **Context Menu**: Right-click on empty canvas and on nodes
2. **Recent Files**: Open a file, then check File → Open Recent
3. **Mindmap Styling**: Create a mindmap and explore the Style tab
4. **Paste List**: Select a mindmap node, paste a bulleted list
5. **Sort Order**: Try different sort orders with radial layout

---

## 📊 Impact Assessment

### New Features ✅
- Enhanced context menus for productivity
- Recent files for quick access
- Professional styling options
- Mindmap customization

### Bug Fixes ✅
- Proper mindmap rearrangement

### Backward Compatibility ✅
- All existing files work without modification
- Existing mindmaps retain their styling
- New defaults only apply to new diagrams

---

**Full Changelog**: See [CHANGELOG.md](CHANGELOG.md) for complete version history
