# DRAWDD v2.1.6 Release Notes

**Release Date:** 2026-04-20

## draw.io Import/Export Audit & Fixes

This release focuses on a comprehensive audit and hardening of draw.io (.drawio / .xml) file import and export to ensure full round-trip fidelity with diagrams.net (draw.io).

---

### Fixed

#### draw.io Import
- **HTML Label Stripping**: draw.io stores labels with HTML tags (`<div>`, `<br>`, `<b>`, etc.) when `html=1` is set. Imported labels now have HTML tags properly stripped to produce clean plain text, with `<br>` and `</div>` converted to line breaks and common HTML entities decoded.
- **Edge Labels as Child Cells**: draw.io sometimes stores edge/connection labels as separate `mxCell` elements parented to the edge rather than in the edge's own `value` attribute. These child-label cells are now detected and merged into their parent edge during import.
- **Group/Container Relative Geometry**: Cells nested inside draw.io groups or containers have coordinates relative to their parent. Import now walks the parent chain to resolve absolute positions, so grouped nodes appear at the correct location on the canvas.
- **Electron Open Dialog**: The Electron native File → Open dialog now includes `.drawio` and `.xml` in its file filters, allowing draw.io files to be opened from the desktop app's native menu (previously only available via the web-based file input).
- **Recent Files Type for .xml**: Importing a `.xml` file now correctly records the file type as `'xml'` in recent files instead of silently falling through to `'drawio'`.

#### draw.io Export
- **Vertex Stroke Width**: Node border width (`strokeWidth`) is now included in the exported draw.io style string.
- **Vertex Opacity**: Node opacity is now exported when less than 100%.
- **Vertex Dashed Borders**: Dashed border styles on nodes are now preserved in the exported draw.io style.
- **Vertex Text Formatting**: Bold, italic, and underline text styles on node labels are now included in the exported draw.io style.
- **Edge Stroke Width**: Edge/connection line width is now included in the exported draw.io style string.
- **Edge Dashed Lines**: Dashed line styles on edges are now preserved in the exported draw.io style.
- **Consistent Export Filename**: Both Toolbar and MenuBar export actions now save as `diagram.drawio` (previously the Toolbar used `drawdd-export.drawio`).

---

### Technical Details

All fixes target [src/utils/importExport.ts](src/utils/importExport.ts) (core logic), [electron/main.cjs](electron/main.cjs) (Electron Open dialog filters), [src/components/MenuBar.tsx](src/components/MenuBar.tsx) (recent files type cast), and [src/components/Toolbar.tsx](src/components/Toolbar.tsx) (export filename).

No new dependencies were added. No existing features were modified outside the draw.io import/export path.
