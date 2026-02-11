# Release Notes v2.1.2

## 🚀 New Features

### System Clipboard Integration
Added dedicated support for pasting content from the system clipboard directly onto the canvas:
- **Paste Text**: Right-click -> "Paste Text" creates a new text node from your clipboard content
- **Paste Image**: Right-click -> "Paste Image" instantly imports images from your clipboard

python
### Spacious Mindmap Layout
Introduced a third layout option for mindmaps:
- **Spacious Mode**: Significantly increased spacing (200px between levels, 70px between siblings)
- Perfect for presentation diagrams or nodes with large amounts of text
- Accessible via the Layout toolbar dropdown alongside Standard and Compact modes

### Edge Styling Refinements
- **Enhanced Label Customization**: You can now control the **Text Color** and **Background Color** of edge labels independently, including full transparency support.
- **Label Borders**: Added a toggle to show/hide label borders and change their color (defaulting to a clean, borderless look).
- **Consistent UI**: accessing multi-selection properties now shows the same intuitive arrow icon buttons as single-selection mode.

## 🐛 Bug Fixes

### Stability & Performance
- **Fixed Edge Label Crash**: Resolved a critical issue where adding multiline text to connection labels caused the application to freeze/crash.
- **Fixed React Warnings**: Eliminated "Attempted to synchronously unmount a root" console warnings by safely deferring graph disposal.

### UI/UX Improvements
- **Layout Consistency**: Fixed an issue where using keyboard shortcuts (Tab to add node, Backspace to delete) forced the layout back to "Standard" mode, ignoring the user's "Compact" selection.
- **Dark Mode Visibility**: Fixed edge label text being invisible in dark mode by standardizing high-contrast colors.
- **Compact Layout Tuning**: Optimized gaps in Compact mode for tighter, more efficient use of screen space.
