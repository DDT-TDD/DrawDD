# DRAWDD v2.0.1 Release Notes

**Release Date:** June 2025

## Bug Fixes

### Mindmap Improvements

1. **Drag-and-Drop Reparenting Level Update**
   - Fixed: When dragging a node to a new parent in mindmaps, the node's level and all its descendants' levels are now correctly updated
   - Previously, nodes would maintain their old level after reparenting, causing visual inconsistencies

2. **Delete All Lines Button**
   - Fixed: The "Delete All Lines" button in the Properties Panel now correctly removes all edges connected to selected nodes
   - Previously, the button used stale React state; now uses `graph.getSelectedCells()` directly

3. **Collapse/Expand Feature**
   - Fixed: Collapse indicators now correctly appear/disappear based on child visibility
   - Edge event handlers now properly check both source and target nodes

### Text Editing

4. **Text Auto-Sizing Behavior**
   - Fixed: Shape sizes are now preserved when editing text
   - Shapes only grow when text doesn't fit, never shrink below user's chosen size
   - Multi-line text with explicit newlines now displays correctly

### Code Quality

5. **Memory Leak Fix**
   - Fixed: Added proper cleanup for `edit-cell-text` event listener to prevent memory leaks

6. **Debug Code Cleanup**
   - Removed debug `console.log` statements from production code in:
     - `collapse.ts` (5 statements)
     - `RichContentNode.tsx` (7 statements)

## Files Modified

- `src/components/Canvas.tsx` - Reparenting level updates, memory leak fix
- `src/components/PropertiesPanel.tsx` - Delete button fix
- `src/components/RichContentNode.tsx` - Edge handler fix, debug cleanup
- `src/utils/collapse.ts` - Debug cleanup
- `src/utils/text.ts` - Text auto-sizing logic rewrite

## Upgrade Notes

This is a patch release with no breaking changes. Simply update to enjoy the bug fixes.

---

**Full Changelog:** [v2.0.0...v2.0.1](https://github.com/your-repo/drawdd/compare/v2.0.0...v2.0.1)
