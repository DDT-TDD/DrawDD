# Release Notes v2.1.5

## Highlights

This release focuses on safe file opening and release hygiene.

- Fixed the critical tab-overwrite bug when opening another file while working in an existing tab
- Standardized file opening so all supported import paths use the same tab-safe behavior
- Improved save-path tracking for Electron-opened files
- Added small `.gitignore` hygiene updates for local build cache files

## Fixes

### Tab-Safe File Opening
Opening a file no longer replaces the contents of the current working tab.

The following flows now open imported content in a new tab:

- File menu open/import
- Toolbar import
- Electron open-file command
- Recent files in Electron

This applies to:

- `.drwdd`
- `.json`
- `.xmind`
- `.mmap`
- `.km`
- `.mm`
- `.vsdx`

### Legacy and Multi-Page Document Handling
The open pipeline now correctly handles both:

- Multi-page DRAWDD documents (`pages` format)
- Legacy DRAWDD JSON documents (`nodes` / `edges` format)

Both formats now load through the same safe tab-aware path.

### Electron Save Path Reliability
Files opened through Electron now retain their file path correctly, so follow-up saves use the expected path.

## Improvements

### High-Resolution Image Export
PNG, JPEG, and PDF exports now render at **2x resolution** (double the pixel density). This produces sharp, print-quality images regardless of the current canvas zoom level or screen size.

- PNG: 2x pixel dimensions
- JPEG: 2x pixel dimensions with 0.92 quality
- PDF: embeds the 2x image but sizes the page to the original logical dimensions, so it prints correctly
- SVG: unaffected (vector format, always resolution-independent)

### Current Tab Preservation
Before opening or importing into a new tab, the current tab state is saved back into application state. This prevents unsaved in-memory edits from being dropped during the tab switch.

### Repository Hygiene
Updated `.gitignore` to exclude local build-cache artifacts:

- `.eslintcache`
- `*.tsbuildinfo`

## Validation

- TypeScript build: passed
- Production web build: passed
- Targeted component tests: passed

## Version

- App version: **2.1.5**
- Package version: **2.1.5**