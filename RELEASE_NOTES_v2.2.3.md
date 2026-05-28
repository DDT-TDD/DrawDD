# DRAWDD v2.2.3 Release Notes

## Summary

Version 2.2.3 focuses on KityMinder interoperability hardening for files produced by KityDD.

## What Was Fixed

- KityMinder style alias support was expanded in DRAWDD import:
  - `color` -> label text color
  - `background` -> node fill color
  - `font-family` -> label font family
  - `font-size` -> label font size
  - `font-weight` -> label bold state
  - `font-style` -> label italic state
- Imported label color now falls back to a contrast-safe value when source files omit text color.
- KityMinder import text reading now supports both `File.text()` and `FileReader` fallback paths for runtime compatibility.
- Defensive topic normalization was added for non-string text payloads (for example array-based text fragments), preventing blank imported labels.

## Validation

- Focused import tests passed:
  - `src/utils/importExport.test.ts`
  - `src/utils/fileImportWorkflow.test.ts`
- Portable package build succeeded from the updated tree.

## Artifacts

- `release/DRAWDD-2.2.3-Portable.exe`
  - Size: 100,309,586 bytes
  - Build time: 2026-05-28 14:33:57

## Updated Files

- `src/utils/importExport.ts`
- `src/utils/importExport.test.ts`
- `src/types/index.ts`
- `src/version.ts`
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- `RELEASE_NOTES_v2.2.3.md`
