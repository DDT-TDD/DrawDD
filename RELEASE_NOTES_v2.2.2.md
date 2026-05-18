# DRAWDD v2.2.2 Release Notes

**Release Date:** 2026-05-18  
**Type:** Stability, import-fidelity, and markdown parsing patch

---

## Summary

Version 2.2.2 hardens the full import pipeline across DRAWDD and closes a markdown rendering defect uncovered during the release audit. The main fixes are content-based KityMinder detection for `.json` files, unified import routing across all open/import entry points, safer Electron handling for binary import formats, label normalization so imported text stays inside node boundaries and remains editable, and protected markdown link rendering so `$`, `_`, and `*` inside URLs no longer break generated links.

---

## What Changed

### KityMinder and Format Detection

- **KityMinder JSON is no longer extension-locked**: compatible KityMinder documents now import based on JSON structure instead of only the `.km` extension.
- **FreeMind / FreePlane detection is content-aware**: XML mindmap files are now routed to the correct importer based on document structure.
- **draw.io XML keeps the same detection path everywhere**: toolbar import, menu import, Electron open, and recent-file reopen now all follow the same import decision logic.

### Electron Import Parity

- **Binary imports are preserved correctly**: `.xmind`, `.mmap`, and `.vsdx` files opened from Electron now keep their binary payloads instead of being decoded as UTF-8 text.
- **Recent files use the same import path**: reopening a recent file now behaves the same as importing it manually.

### Imported Text Reliability

- **Imported mindmap labels auto-size correctly**: long imported topics now wrap and grow nodes instead of spilling outside them.
- **F2 editing no longer blanks imported labels**: inline editing now uses the same label update path as the rest of the editor.
- **draw.io and Visio labels wrap after import**: imported text stays inside node bounds and remains editable.

### Markdown Rendering Audit Fix

- **Link URLs are protected during later markdown passes**: markdown links now preserve `$`, `_`, `*`, and similar characters inside the URL instead of letting KaTeX or emphasis parsing rewrite the generated `href`.
- **Regression coverage was added**: the markdown renderer test suite now includes a dedicated case covering markdown-like characters inside link URLs.

---

## Files Changed

| File | Change |
|---|---|
| `src/utils/importExport.ts` | Added content-based import detection helpers and normalized imported node label handling |
| `src/utils/fileImportWorkflow.ts` | Added shared import workflow used by all file-open and import entry points |
| `src/utils/fileImportWorkflow.test.ts` | Added tests for import format detection and Electron file reconstruction |
| `src/components/Canvas.tsx` | Routed F2 inline edits through the auto-size label update path |
| `src/components/Toolbar.tsx` | Switched toolbar imports to the shared workflow |
| `src/components/MenuBar.tsx` | Switched menu imports and recent-file reopening to the shared workflow |
| `src/App.tsx` | Switched Electron open-file handling to the shared workflow |
| `electron/main.cjs` | Preserved binary payloads for Electron file-open and recent-file reads |
| `src/utils/markdown.ts` | Protected generated link, KaTeX, and code HTML fragments from later markdown regex passes |
| `src/components/MarkdownRenderer.test.tsx` | Added regression coverage for markdown-like characters inside link URLs |
| `README.md` | Updated public import documentation |
| `.gitignore` | Ignored exported `.km` artifacts |
| `CHANGELOG.md` | Added v2.2.2 entry |
| `package.json` | Bumped version to `2.2.2` |
| `package-lock.json` | Updated root lockfile version metadata to `2.2.2` |
| `src/version.ts` | Bumped application version to `2.2.2` |

---

## Upgrade Notes

No breaking changes. Existing DRAWDD, KityMinder, FreeMind, FreePlane, draw.io, MindManager, XMind, Visio, and markdown-enabled label workflows continue to work. The main visible differences are that more files are now detected correctly by content, imported labels behave like native editable labels, and markdown links are more robust when their URLs contain markdown-like characters.

---

## Validation

- `npm test -- --runInBand --silent` completed successfully with 34 passing test suites and 320 passing tests
- `npm run build` completed successfully
- `npm run release:portable` completed successfully and regenerated the Windows portable executable
- `npm run lint` still reports the existing repository-wide backlog: 884 problems (878 errors, 6 warnings) across older utility files, property tests, and long-lived integration surfaces such as `src/App.tsx`, `src/components/Canvas.tsx`, `src/components/MenuBar.tsx`, `src/components/Toolbar.tsx`, and `src/utils/importExport.ts`
- Focused `eslint` passes for the newly added helper files and markdown-audit files: `electron/main.cjs`, `src/utils/fileImportWorkflow.ts`, `src/utils/fileImportWorkflow.test.ts`, `src/utils/markdown.ts`, `src/components/MarkdownRenderer.test.tsx`, and `src/version.ts`

---

## Build Artifacts

| Artifact | Size | Built | Description |
|---|---:|---|---|
| `release/DRAWDD-2.2.2-Portable.exe` | 100,308,473 bytes | 2026-05-18 13:40:06 | Windows portable executable regenerated from the audited 2.2.2 tree |