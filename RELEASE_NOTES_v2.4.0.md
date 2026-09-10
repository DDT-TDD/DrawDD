# DRAWDD v2.4.0 Release Notes

DRAWDD v2.4.0 brings major enhancements to diagram editing productivity, connection routing usability, multi-selection styling capabilities, page management, and three brand-new themes (Black & White, Grayscale, and Wireframe/Transparent).

## Summary of Changes

### 1. New Themes: Monochrome & Wireframe
- **Black & White Theme**: High-contrast, clean monochrome theme with pure white canvas, solid black lines, black text, and crisp black-and-white node styling for high-legibility printouts.
- **Grayscale Theme**: Subtle and professional neutral gray tones designed for clean printing and documentation.
- **Wireframe (Transparent) Theme**: Minimalist wireframe presentation featuring a fully transparent canvas background, transparent shape fills, solid black borders, and black text.
- **Transparent PNG Export**: PNG exports with the Wireframe (Transparent) theme or transparent canvas background preserve full alpha channel transparency.

### 2. Multi-Selection Properties Panel
- **Bulk Text & Typography Styling**: Text color, font family, font size, text alignment (left, center, right), and font styles (bold, italic, underline) can now be modified simultaneously for multiple selected shapes or all shapes (Ctrl+A).
- **Comprehensive Appearance Controls**: Border style (solid, dashed, dotted), stroke width, corner radius, fill color, stroke color, opacity, and drop shadows can be adjusted in bulk across multiple selected shapes.
- **Bulk Connection Styling**: Multi-edge selection now supports bulk adjustments to line styles, arrowhead markers, and line routing algorithms.

### 3. Connection Usability & Automatic Rerouting
- **Draw.io-Style Connection Snapping**: Relaxed connection validation to allow snapping directly to target node boundaries and bodies rather than requiring pinpoint 6px port circle placement.
- **Connectable Magnet Visual Feedback**: Added magnetAvailable highlighting when dragging connections near valid target ports.
- **Reset Waypoints / Reroute Action**: Added "Reset Waypoints / Reroute" controls to both the edge context menu and Properties Panel to cleanly discard obsolete manual waypoints and restore optimal Manhattan routing.
- **Automatic Rerouting on Style Switch**: Switching edge routing types (e.g., Orthogonal, Rounded, Straight, Smooth Curves) automatically resets stale vertices for a clean route.

### 4. Page Tab Bar & Duplication Fixes
- **Page Renaming on Duplicated Tabs**: Fixed event bubbling from the rename <input> to the parent tab element that previously triggered page selection and prematurely aborted rename operations.
- **Double-Submit Prevention**: Added an isSubmittingRef guard preventing enter keypress and input blur race conditions during page renaming.
- **Context Menu Clamping**: Dynamically calculated context menu coordinates to prevent page tab context menus from overflowing off-screen.
- **Atomic Page Duplication**: Page duplication now atomically captures and clones active graph state and file data simultaneously.

## Binaries Available for Release
- **Windows Installer**: `release/DRAWDD-2.4.0-Setup.exe`
- **Portable Executable**: `release/DRAWDD-2.4.0-Portable.exe`

## Upgrade Path
All diagrams, configuration files, and saved state remain 100% compatible. Upgrade is direct and seamless.
