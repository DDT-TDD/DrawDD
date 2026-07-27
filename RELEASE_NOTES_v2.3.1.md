# DRAWDD v2.3.1 Release Notes

DRAWDD v2.3.1 is a minor feature and polish release focusing on draw.io multi-page imports and dynamic export naming.

## Summary of Changes

### 1. Multi-Page draw.io XML Imports
- **Full Multi-Page Import**: When opening a `.drawio` or `.xml` file containing multiple diagram pages, DRAWDD now parses and imports all pages. Each page becomes a separate tab in DRAWDD, preserving its name, position, layout mode, and canvas content.
- **Robust Decompression**: Successfully handles both plain XML inline formats and compressed formats (base64-encoded, zlib-deflate compressed diagram content) for each individual page.
- **Empty Page Safety**: Permits importing empty or blank diagram pages without throwing XML parsing errors.

### 2. Dynamic Export Naming
- **Context-Aware File Naming**: Exporting diagrams via the Toolbar or MenuBar now automatically names the file using the active tab/diagram title, followed by the format's extension (e.g., `my-diagram.png` or `my-diagram.svg`), rather than defaulting to hardcoded fallback names like `drawdd-export` or `diagram`.
- **Filename Cleanliness**: Automatically cleans existing extensions from the tab name to prevent double extensions (like `diagram.drwdd.png`).
- **Unified Across Formats**: Applied to PNG, SVG, JPEG, PDF, JSON, draw.io XML, HTML, Markdown, Text, and KityMinder exports.

### 3. Flowchart Line Creation, Selection, & Management
- **Unified Connector & Router Style System**: Standardized edge routing across canvas port dragging, toolbar connector dropdown, PropertiesPanel, and QuickConnect.
- **Smart Handle Tools**: Automatically attaches segment handles to orthogonal lines and vertex waypoint handles to curved/straight lines.
- **QuickConnect Preference Sync**: QuickConnect hover arrows now generate lines using the active line color and active flowchart connector style.

## Upgrade Path
All existing files remain fully compatible. The application upgrade is completely seamless.
