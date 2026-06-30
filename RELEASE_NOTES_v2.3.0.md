# DRAWDD v2.3.0 Release Notes

DRAWDD v2.3.0 is a minor stability release focused on correcting core layout, history, and alignment bugs in flowchart and diagramming modes.

## Summary of Changes

### 1. Selection & History Stabilization
- **Programmatic History Filtering**: Resets the undo/redo stack on page transitions, document imports, and canvas resets using the native `graph.cleanHistory()` API. This prevents programmatic setup steps from contaminating user-action history.
- **Auto-Layout Batching**: Mindmap, Tree, Fishbone, Timeline, and Flowchart auto-layouts are now wrapped inside consolidated layout history batches. Applying any auto-layout is recorded as a single operation that can be fully undone in one step.

### 2. Key Object Alignment (First-Selected)
- **First-Selected Reference Alignment**: Selecting multiple shapes and clicking left, center, right, top, middle, or bottom alignment will align all other shapes relative to the boundary of the **first selected shape** (key object).
- **Selection Order Tracker**: Implemented direct `cell:selected` and `cell:unselected` listeners on the canvas instance to track selection history (`graph._selectionOrder`) and prune it dynamically on selection changes.
- **Batched Alignment Commands**: All programmatic alignment updates are consolidated inside an `'align'` batch to support clean single-step undos.

### 3. Perpendicular Port Routing (Edge Correction)
- **Arrow Loop Corrections**: Removed the rigid `startDirections` and `endDirections` constraints on the manhattan router in the edge creation builder and default routing options. This allows the routing engine to naturally exit ports perpendicularly, resolving loop back and overlap routing regressions when shapes are moved.

## Upgrade Path
All existing files remain fully compatible. Mode metadata, custom themes, and diagram data persist seamlessly.
