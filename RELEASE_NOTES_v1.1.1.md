# DRAWDD v1.1.1 - Bug Fixes & Improvements

**Release Date:** December 17, 2025

This patch release addresses critical bugs discovered after the initial v1.1.0 release, focusing on theme stability, edge selection behavior, spellcheck functionality, and adds new edge manipulation capabilities like draw.io.

---

## ✨ New Features

### Edge/Line Manipulation (like draw.io)
- **Edges are now fully draggable** while keeping their anchor points connected to shapes
- **Vertex tools**: Click anywhere on an edge to add waypoints (vertices), then drag them to reshape the connection path
- **Segment tools**: Manipulate edge segments by dragging the segment handles
- Changed default router from 'manhattan' to 'normal' to allow manual vertex positioning
- When an edge is selected, it now shows:
  - Blue diamond handles at source/target endpoints
  - Blue circular handles at vertices (drag to move, double-click to delete)
  - Segment manipulation handles

---

## 🐛 Bug Fixes

### Critical: Shapes Disappearing on Theme Change
- **Problem**: All shapes on the canvas would disappear when changing the color scheme in Settings
- **Cause**: The graph initialization was incorrectly dependent on `colorScheme`, causing a full recreation of the canvas
- **Solution**: Removed `colorScheme` from the `initGraph` dependency array; theme changes now properly update existing shapes in-place

### Arrow Marker Size Inconsistency
- **Problem**: Source arrows were smaller (10x6) than target arrows (12x8), causing asymmetric appearance
- **Solution**: Standardized all arrow markers to use 12x8 dimensions

### Edge Selection Properties Panel
- **Problem**: Selecting all edges (connections) would incorrectly show "Canvas Properties" instead of edge properties
- **Cause**: The condition only checked for `selectedNodes.length === 0` but not `selectedEdges.length`
- **Solution**: Added proper checks for edge selection states

### Multi-Edge Selection Support
- Added a dedicated panel when multiple edges are selected
- **Full bulk editing controls for:**
  - Line style (solid, dashed, dotted)
  - Line color
  - Line width with visual slider
  - **Source arrow (start)** - none, block, classic, diamond, circle
  - **Target arrow (end)** - none, block, classic, diamond, circle
- Added single-edge fallback panel with arrow controls for edge-only selections

### Spellcheck in Electron App (Desktop)
- **Problem**: Right-click on misspelled words did not show spelling suggestions in the packaged .exe
- **Cause**: Electron requires explicit spellcheck configuration and context menu handling
- **Solution**: 
  - Enabled `spellcheck: true` in webPreferences
  - Added `setSpellCheckerLanguages(['en-GB', 'en-US'])` for English support
  - Implemented custom context-menu handler that shows:
    - Spelling suggestions for misspelled words
    - "Add to Dictionary" option
    - Standard Cut/Copy/Paste/Select All options

### Text Shapes & Theme Consistency
- Text shapes (transparent background) now correctly preserve their styling during theme changes
- Double-click on blank canvas creates proper transparent text nodes
- Sidebar correctly identifies and preserves transparent shapes when applying theme

---

## ⚙️ Technical Improvements

### Version Centralization
All version references are now centralized in `src/version.ts`:
```typescript
export const VERSION = '1.1.1';
```

Components that display version information now import from this single source:
- `AboutDialog.tsx`
- `HelpDialog.tsx`
- `MenuBar.tsx`
- `types/index.ts` (re-exports for backward compatibility)

---

## 📦 Files Changed

| File | Changes |
|------|---------|
| `src/version.ts` | Updated to 1.1.1 |
| `package.json` | Updated version |
| `src/components/PropertiesPanel.tsx` | Fixed edge selection logic, added multi-edge panel with arrow controls |
| `src/components/Canvas.tsx` | Removed colorScheme from initGraph dependencies, fixed text node creation |
| `src/components/Sidebar.tsx` | Preserve transparent shapes on creation |
| `src/components/SettingsDialog.tsx` | Skip transparent nodes on theme application |
| `src/components/AboutDialog.tsx` | Use centralized VERSION |
| `src/components/HelpDialog.tsx` | Use centralized VERSION |
| `src/types/index.ts` | Re-export VERSION for compatibility |
| `electron/main.cjs` | Added spellcheck support with context menu for spelling suggestions |

---

## 🔄 Upgrade Instructions

This is a drop-in replacement for v1.1.0. No migration steps required.

1. Download `DRAWDD-1.1.1-Portable.exe`
2. Replace your existing executable
3. Your diagrams and settings will be preserved

---

## 🧪 Testing Checklist

- [ ] Create shapes and change theme - shapes should NOT disappear
- [ ] Select multiple edges (Ctrl+click) - should show "X Connections Selected" panel with arrow controls
- [ ] Multi-edge panel has source/target arrow style buttons
- [ ] Select single edge - should show "Connection Properties" with arrow controls
- [ ] Select nothing - should show "Canvas Properties"
- [ ] Double-click blank canvas - creates transparent text node
- [ ] Change theme - transparent text nodes remain visible
- [ ] Drag "Text Box" from sidebar - stays transparent
- [ ] **In packaged .exe**: Type misspelled word, right-click shows spelling suggestions
- [ ] Check About dialog shows version 1.1.1
- [ ] Check Help dialog shows version 1.1.1

---

## 📋 Known Issues

None at this time.

---

**Full Changelog**: [CHANGELOG.md](CHANGELOG.md)
