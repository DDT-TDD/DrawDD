# DRAWDD v2.2.0 Release Notes

**Release Date:** 2026-05-11

## New Feature: Venn Diagram Mode

DRAWDD 2.2.0 adds a dedicated Venn Diagram workflow for overlap-based comparisons while preserving compatibility with existing DRAWDD documents and import formats.

---

### Added

#### Venn Diagram Creation

- **Dedicated Venn Mode**: Added a first-class Venn mode in the toolbar, new-diagram picker, sidebar, and menu status area.
- **Venn Shape Library**: Added preconfigured semi-transparent circles, intersection labels, set item labels, and diagram title blocks.
- **Built-In Templates**: Added ready-to-edit 2-set, 3-set, and 4-set Venn templates for common comparison layouts.
- **Presentation-Ready Styling**: Venn circles use fill-only transparency so overlaps stay readable without washing out borders or labels.

#### Save/Load Reliability

- **Mode Persistence**: DRAWDD now preserves diagram mode across save, save as, export, page duplication, and multi-page tab switching.
- **Legacy File Recovery**: Older single-page documents now infer their diagram mode more reliably when explicit mode metadata is missing.
- **Fallback Import Behavior**: Toolbar and MenuBar import fallbacks now restore the correct page mode instead of defaulting to generic flowchart behavior.

---

### Fixed

- **Venn Reopen Regression**: Venn pages no longer reopen as plain flowcharts after save/load.
- **Venn Theme Application**: Changing a color scheme now updates existing Venn circles from both theme entry points instead of leaving the set colors unchanged.
- **Venn Template Styling**: Fresh Venn templates now inherit the active Venn-specific theme styling immediately instead of keeping the raw template palette while only the canvas background updates.
- **Venn Shape Undo**: Undo after toggling a Venn set between rectangle and ellipse now restores a single node instead of leaving both shapes on the canvas.
- **Portable Release Metadata**: Version metadata and release documentation now align on 2.2.0 so GitHub release artifacts carry the expected version.

---

### Technical Summary

| Area | Change |
|------|--------|
| [src/config/shapes.ts](src/config/shapes.ts) | Added Venn-specific reusable shapes |
| [src/config/templates.ts](src/config/templates.ts) | Added 2-set, 3-set, and 4-set Venn templates |
| [src/utils/importExport.ts](src/utils/importExport.ts) | Added mode inference and mode-aware import/export persistence |
| [src/App.tsx](src/App.tsx) | Persist page mode across multi-page tabs and file loading |
| [src/components/Canvas.tsx](src/components/Canvas.tsx) | Enabled Venn mode for flowchart-style Quick Connect behavior |
| [src/components/Toolbar.tsx](src/components/Toolbar.tsx) | Added Venn mode toggle and mode-aware import/export fallbacks |
| [src/components/MenuBar.tsx](src/components/MenuBar.tsx) | Added Venn mode display and mode-aware save/import fallbacks |

No new runtime dependencies were added for this release.