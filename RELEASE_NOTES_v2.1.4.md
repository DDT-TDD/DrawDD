# Release Notes v2.1.4

## Highlights

This release focuses on interoperability and reliability.

- New export option for **draw.io (.drawio)**
- Better shape fidelity in draw.io XML exports
- Fixed Electron preload API collision that could affect file-open behavior
- Toolbar **Save** now triggers the real save pipeline

## New Features

### draw.io Export (.drawio)
You can now export diagrams to draw.io-compatible XML:

- File menu: **Export as draw.io (.drawio)**
- Toolbar export dropdown: **Export as draw.io**
- Output format: `mxfile` with `mxGraphModel` (uncompressed XML)

This improves compatibility with draw.io/diagrams.net workflows.

## Improvements

### Better Export Fidelity for draw.io
draw.io export now maps core DRAWDD node types more accurately:

- `rect` -> rectangle
- `ellipse` / `circle` -> ellipse
- `diamond` -> rhombus
- `polygon` -> polygon/rhombus fallback
- `image` -> image style with image URL support
- `rich-content-node` -> rectangle fallback

Text, colors, font size, geometry, and edge routing metadata are preserved where possible.

### Save Workflow Consistency
The toolbar Save button now calls the normal save flow used by the app, instead of exporting JSON directly.

## Bug Fixes

### Electron Preload API Collision
Fixed a duplicate key issue in `electron/preload.cjs` where one `openFile` method silently overwrote another.

The API is now explicit:

- `openFile` -> open/read file by path for app loading
- `openWithDefaultApp` -> open file with OS default app

This improves reliability for recent-file opening and file explorer actions.

## Packaging & Repo Hygiene
Updated ignore rules to avoid accidentally committing/exporting local test artifacts:

- Added `*.drawio` and `*.drwdd` in:
  - `.gitignore`
  - `.npmignore`
  - `.electronignore`

## Version

- App version: **2.1.4**
- Package version: **2.1.4**
