# DRAWDD v2.1.0 Release Notes

**Release Date:** February 3, 2026

## What's New

### � New .drwdd File Extension
DRAWDD diagrams now save with the `.drwdd` extension, making it easy to identify your diagram files:
- All new files save as `filename.drwdd`
- Full backwards compatibility with `.json` and `.drawdd.json` files
- The file format remains JSON internally - just the extension changed

### 🔗 Line Hops (Jumpover)
When edges cross over each other in complex diagrams, you can now enable **Line Hops** to show arc jumps at intersection points:
- Toggle in the Properties Panel when an edge is selected
- Creates visual clarity for overlapping connections
- Uses smooth arc-style jumps

### 📋 Line Routing Context Menu
Right-click on any edge for quick access to routing options:
- **Line Hops** - Enable jumpover connector with arcs
- **Orthogonal** - Right-angle routing (Manhattan)
- **Rounded** - Smooth corners on right-angle paths
- **Smooth** - Curved bezier lines
- **Straight** - Direct point-to-point connection

## Bug Fixes

### Quick Connect Arrows Fixed
- Fixed an issue where clicking on Quick Connect hover arrows in Flowchart mode did nothing
- Arrows now properly create new connected nodes when clicked
- Improved event handling to prevent interference from the graph engine

### Edge Connection Preservation
- Fixed edges losing their connection points when node text is changed to markdown
- Edges now maintain exact positions when nodes are converted for markdown rendering
- Converted nodes now include all 16 ports for full edge connectivity

### Color Picker Compatibility
- Fixed console errors when nodes have "transparent" fill or stroke colors
- The color picker now gracefully handles non-hex color values
- Text input still allows entering "transparent" and other CSS color values

### Text Rendering Improvements
- Improved auto-sizing calculations for multi-line text
- Better estimation of wrapped line heights to prevent text cutoff

## Upgrade Notes

- Your existing `.json` and `.drawdd.json` files will continue to work
- When you save, files will now use the `.drwdd` extension
- No data migration needed - the internal format is unchanged

## System Requirements

- **Web Browser**: Chrome, Firefox, Edge, or Safari (latest versions)
- **Desktop App**: Windows 10/11 (64-bit)

---

*DRAWDD is open-source diagramming software. [View on GitHub](https://github.com/your-repo/drawdd)*
