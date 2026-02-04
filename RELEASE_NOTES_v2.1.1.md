# DRAWDD v2.1.1 Release Notes

**Release Date:** February 4, 2026  
**Type:** Minor Release - Bug Fixes & Theme Improvements

---

## 🎨 Theme System Overhaul

### Completely Redesigned Color Schemes
The entire theme system has been redesigned with professional, captivating themes that follow modern design principles:

- **Light & Professional Backgrounds**: All themes now use light, clean backgrounds similar to the popular Default theme
- **Meaningful Color Combinations**: Each theme has a cohesive color story with proper primary/secondary/accent hierarchy
- **Improved Readability**: Better contrast ratios for text and borders
- **Reduced Dark Themes**: Removed overwhelming number of dark/neon themes, keeping only one professional Dark Mode option

### New Theme Categories

#### Classic Professional (4 themes)
- **Default** - Clean white with blue accents
- **Corporate Blue** - Business-focused deep blue palette
- **Executive** - Sophisticated slate tones
- **Consultant** - Professional cyan/teal palette

#### Elegant & Sophisticated (3 themes)
- **Slate Elegance** - Refined gray tones
- **Charcoal & White** - Classic monochrome contrast
- **Graphite Pro** - Modern zinc-based palette

#### Nature-Inspired (4 themes)
- **Ocean Breeze** - Fresh coastal blues
- **Forest Fresh** - Vibrant greens
- **Sage Garden** - Earthy lime greens
- **Mint Fresh** - Cool teal/turquoise

#### Warm & Inviting (4 themes)
- **Sunset Glow** - Warm orange tones
- **Amber Warmth** - Golden amber palette
- **Terracotta** - Rich earthy reds
- **Coral Reef** - Vibrant pink/coral

#### Creative & Vibrant (4 themes)
- **Lavender Dream** - Soft purple hues
- **Royal Purple** - Deep violet tones
- **Indigo Ink** - Professional indigo
- **Rose Petal** - Elegant rose colors

#### Soft & Pastel (4 themes)
- **Soft Cloud** - Gentle gray pastels
- **Cotton Candy** - Playful pink/purple
- **Spring Meadow** - Fresh spring greens
- **Baby Blue** - Light sky blue

#### Classic Earth Tones (3 themes)
- **Vintage Sepia** - Warm antique feel
- **Warm Brown** - Classic brown palette
- **Mocha** - Sophisticated stone tones

#### Accessibility (1 theme)
- **High Contrast** - Maximum readability

#### Dark Mode (1 theme)
- **Dark Mode** - Professional dark option for low-light environments

**Total: 28 professionally designed themes** (down from 30+ inconsistent themes)

---

## 🐛 Bug Fixes

### Timeline Mode Fixes
- **Context Menu Mode Detection**: Fixed timeline context menu not showing timeline-specific options ("Add Event After") due to stale closure capturing initial mode value
- **Quick Connect in Timeline**: Fixed hover arrows not appearing when in Timeline mode - now properly enables for both Flowchart and Timeline modes
- **Dynamic Port Injection**: Nodes created via Insert key or Quick Connect now properly receive connection ports

### Connection & Port Fixes
- **Visio Import Connections**: Shapes imported from Visio now have proper port configuration for manual connections
- **Parent Node Ports**: When adding child nodes to timeline events, parent nodes now dynamically receive ports if missing

### Multi-Selection Display
- **Selection List**: Properties panel now shows a list of all selected nodes/edges, not just a count
- **Primary Node Indicator**: Visual marker shows which node is the primary selection
- **Edge Selection Display**: Mixed selections of nodes and edges now properly displayed

### Quick Connect Improvements
- **SVG Layer Fix**: Quick connect arrows now properly positioned in the correct SVG layer
- **Translate/Pan Events**: Arrows now update position when canvas is panned or zoomed
- **Node Move Tracking**: Arrows reposition when the hovered node is moved

---

## 📋 Summary

This release focuses on two main areas:
1. **Theme Quality**: Complete overhaul of the color scheme system with professional, cohesive themes
2. **Bug Fixes**: Resolved several issues with Timeline mode, connections, and multi-selection display

### Upgrade Notes
- Theme IDs have changed; if you had a theme selected, you may need to reselect it
- All functionality remains backward compatible
- No breaking changes to file formats

---

## 🔧 Technical Details

### Files Changed
- `src/config/colorSchemes.ts` - Complete rewrite with 28 professional themes
- `src/components/Canvas.tsx` - Fixed stale mode closure in context menu handlers
- `src/components/PropertiesPanel.tsx` - Added selected items list display
- `src/utils/quickConnect.ts` - Fixed SVG layer, event listeners, and port injection
- `src/utils/contextMenu.ts` - Added dynamic port injection for timeline events
- `src/utils/importExport.ts` - Added ports to Visio-imported nodes
- `src/version.ts` - Version bump to 2.1.1

### Build Information
- Build: Production-ready
- Bundle size: Unchanged from 2.1.0
- All tests passing

---

**Full Changelog**: [v2.1.0...v2.1.1](https://github.com/yourusername/drawdd/compare/v2.1.0...v2.1.1)
