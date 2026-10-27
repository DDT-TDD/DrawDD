# Release Notes

DRAWDD v2.5.1 is a targeted feature restoration and diagramming enhancement release. This version restores full interactive line and connector movement (matching draw.io behavior) in Flowchart mode, introduces direct interactive line drawing on the canvas, adds standalone connector shapes to the sidebar palette, and maintains our zero-regression baseline and v2.5.0 security hardening.

---

## 🚀 Key Highlights & Enhancements

### 1. Restored Line Movement & Segment Manipulation (draw.io Parity)
- **Interactive S-Shape Segment Adjustment**: In flowchart and stepped connectors, selecting a connector now surfaces interactive segment midpoint handles. Dragging the middle segment of an S-shaped or stepped connector adjusts the position of the segment and the distance between the two ends, reproducing the behavior in draw.io.
- **Concurrent Waypoint & Segment Tools**: Replaced previously mutually exclusive tool configurations with concurrent attachment of `vertices` (waypoints), `segments` (segment shift handles), `source-arrowhead`, and `target-arrowhead`.
- **Automatic Route Point Extraction**: For auto-routed connectors whose intermediate vertices are uninitialized (`[]`), DRAWDD now dynamically extracts computed route bend points (`edgeView.findRoutePoints()`) on edge selection and sets them as vertices, instantly exposing actionable segment and vertex handles.
- **Clean Routing Algorithm Transitions**: Switching between routing styles (Normal, Orthogonal, Manhattan, Metro, Curved) via the toolbar resets stale intermediate vertices, allowing the selected router to cleanly calculate optimal geometry.
- **Dedicated Edge Selection**: Added an explicit `edge:click` listener ensuring crisp selection and instant handle attachment across both simple and dense diagrams.

### 2. Direct Interactive Line & Connector Drawing
- **Dedicated Toolbar Control**: Added a "Draw Line / Connector" button in the main toolbar with an active visual highlight state indicating when line drawing mode is engaged.
- **Keyboard Shortcut (`L`)**: Press `L` anywhere on the canvas to toggle line drawing mode; press `Escape` or `L` again to exit back to standard select mode.
- **Interactive Drag-to-Draw**: Click and drag across the canvas to draw a connector between any two points in real time.
- **Port Magnet Snapping**: When dragging near shape connection ports, the line dynamically snaps to the port magnet.
- **Single-Click Placement**: Single-clicking the canvas in line drawing mode places a 140px horizontal connector with auto-orthogonal routing at the clicked position.
- **Unrestricted Canvas Connections**: Relaxed connection validation to allow connecting from blank canvas space to blank canvas space, or from a node port into open canvas space.

### 3. Sidebar Connector & Line Library
- **Dedicated Connector Definitions**: Added `LINE_SHAPES` covering:
  - **Straight Line**: Unadorned line without terminal arrowheads.
  - **Directional Connector**: Standard connector with a target arrow marker.
  - **Bidirectional Connector**: Dual-ended connector with source and target arrow markers.
  - **Orthogonal Connector**: Stepped connector with orthogonal routing and target arrow marker.
  - **Curved Connector**: Smooth cubic bezier connector with target arrow marker.
- **Palette Availability**: Integrated directly into the **Flowchart**, **Basic Shapes**, and **Arrows** sidebar panels.
- **Click or Drag Placement**: Shapes can be dragged onto the canvas or clicked to instantiate at the canvas viewport center.

---

## 🛡️ Security & Zero Regression Verification

- **Preservation of v2.5.0 Security Baseline**:
  - Maintained `0 vulnerabilities` across all production and development dependencies (`npm audit`).
  - Preserved Electron IPC allowlist (`isSafeUrl`) blocking `javascript:`, `file:`, and dangerous protocol handlers.
  - Preserved executable file launch restrictions (`open-file`).
  - Preserved decompression bomb guard (`MAX_DECOMPRESSED_SIZE = 50MB`).
  - Preserved KaTeX formula sandboxing (`trust: false`).
- **Comprehensive Test Suite**:
  - **36 / 36 test suites passing** (`100% pass rate`).
  - **327 / 327 unit and property-based tests passing**.
  - **0 TypeScript compilation errors** (`tsc -b`).

---

## 📦 Distribution Binaries

- **Windows Portable**: `DRAWDD-2.5.1-Portable.Unpacked.zip`
- **Windows Portable**: `DRAWDD-2.5.1-Portable.exe`
- **Windows Installer**: `DRAWDD-2.5.1-Setup.exe`
