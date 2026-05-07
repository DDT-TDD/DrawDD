# DRAWDD v2.1.7 Release Notes

**Release Date:** 2026-05-06

## Bug Fixes: Recent Files & Line Styles

This release fixes two user-reported bugs affecting recent file re-opening and solid line style application.

---

### Fixed

#### Recent Files — Direct Re-Opening

- **Electron Save Behavior**: The `Save` and `Save As` actions in Electron mode now correctly store the file's path into the Recent Files list. Previously, they neglected to log the file path, causing users clicking on the recent file to see a generic "Open" window instead of the file loading directly.
- **Electron File Path Storage**: Files imported via File → Open in Electron now correctly store their real filesystem path in the recent files list using Electron's `File.path` property.
- **Web Mode Content Caching**: In web mode (browser), DRAWDD now caches file content in localStorage when opening or saving `.drwdd` / `.json` files. Clicking a recent file entry will reload the diagram directly from cache instead of showing the file picker dialog.
- **Fallback Behavior**: If cached content is unavailable or the file path is missing (such as for files saved before this update or binary formats like `.xmind`, `.vsdx`), the file picker opens as a fallback gracefully instead of throwing a generic error.

#### Solid Line Style — Proper Application

The solid line style was broken across all interaction paths due to X6's deep-merge behavior:

- **Root Cause**: Setting `strokeDasharray` to `undefined` or `''` (empty string) was ineffective because X6's `setAttrs()` performs a deep merge that silently drops `undefined` values and treats `''` as a no-op. The fix uses `null` instead, which X6 preserves during merge and interprets as "clear this attribute" (consistent with the existing `filter: null` pattern used for shadow removal).
- **PropertiesPanel**: Both multi-edge and single-edge line style buttons now correctly apply solid style.
- **Context Menu**: Right-click → Solid Line now correctly clears the dash pattern.
- **Copy/Paste Format**: Pasting format from a solid edge to a dashed edge now properly removes dashing.
- **Apply Style to All**: The "Apply Style to All" action now correctly propagates solid style.
- **Edge Style Handler**: The `handleEdgeStyleChange` function and `handleBorderStyleChange` for node borders now both use the corrected `null` approach.
- **Active State Detection**: The solid button highlight now correctly detects solid state across all possible values (`undefined`, `''`, `null`).

---

### Technical Details

| File | Changes |
|------|---------|
| [recentFiles.ts](src/utils/recentFiles.ts) | Added `cacheRecentFileContent()` and `getCachedFileContent()` for web-mode file content caching |
| [MenuBar.tsx](src/components/MenuBar.tsx) | Fixed `handleSave` and `handleSaveAs` to properly record file paths to recent files in Electron and cache content in web mode. Improved recent files load mechanism. |
| [PropertiesPanel.tsx](src/components/PropertiesPanel.tsx) | Use `null` instead of `undefined`/`''` for solid `strokeDasharray` in 7 locations (handleBorderStyleChange, handlePasteStyle, handleApplyEdgesToAll, handleEdgeStyleChange, multi-edge button, single-edge button, active state detection) |
| [contextMenu.ts](src/utils/contextMenu.ts) | Use `null` for Solid Line context menu action |

No new dependencies. No API changes. No existing features modified outside the two fixed paths.
