# DRAWDD v2.2.1 Release Notes

**Release Date:** 2026-05-13  
**Type:** Bug-fix patch

---

## Summary

Version 2.2.1 is a focused patch that fixes the Venn diagram theming introduced in v2.2.0, adds Venn coverage to the Help menu examples/documentation, and aligns release metadata before regenerating the Windows portable build. The previous release wired theme application to Venn templates but the underlying color logic applied only a nearly invisible 10% tint, leaving circles virtually unchanged across all themes. This release replaces that approach with a proper per-theme palette engine and ships matching in-app examples and release artifacts.

---

## What Changed

### Venn Diagram: Truly Per-Theme Palettes

**Before (v2.2.0):** Switching themes changed only the background color. Venn circles stayed the same Blue/Red/Green/Purple/Orange regardless of the active theme because the mix weight was set to 10% — too small to produce a visible change.

**After (v2.2.1):** Each theme now generates a completely distinct set of five Venn circle colors:

| Theme family | Behavior |
|---|---|
| **Chromatic themes** (Ocean Breeze, Sunset Glow, Forest Fresh, Lavender Dream, Coral Reef, …) | Five hues evenly distributed around the color wheel, anchored to the theme's characteristic `lineColor` hue. Ocean Breeze produces cyan → purple → pink → yellow → green; Sunset Glow produces orange → yellow-green → teal → blue → magenta; etc. |
| **Achromatic/neutral themes** (Default, Charcoal, Executive, Graphite Pro, High Contrast, …) | The familiar Blue · Red · Green · Purple · Orange palette — unchanged from v2.2.0, keeping the classic Venn appearance for neutral color schemes. |

### Dark-Mode Venn Circles

The Dark Mode theme now enforces a minimum `fillOpacity` of **0.40** (was 0.28) so semi-transparent circles remain visible against the near-black canvas.

### Readable Venn Labels

Set label colors are now derived from the circle's own hue:
- **Light themes:** a deep, vivid shade of the circle color — high contrast over the tinted semi-transparent fill.
- **Dark themes:** a very pale, lightly-tinted shade — readable over the dark canvas even where circles overlap.

### Electron Parity

The palette engine uses only pure arithmetic (HSL conversion). It has no DOM or browser-specific dependencies, so the Windows portable executable produces exactly the same theme-matched colors as the web build.

### Help Menu Venn Coverage

- **Examples Gallery** now includes a 2-set Venn comparison and a 3-set Venn skills example.
- **In-App Help** now lists Venn Diagram as a first-class supported diagram type.
- The new example loaders apply the active color scheme immediately, so Help menu examples match the same theme-aware Venn behavior as templates created from the diagram picker.

---

## Files Changed

| File | Change |
|---|---|
| `src/utils/venn.ts` | Replaced `mixHex`-based `getVennThemeStyle` with HSL color engine (`hexToHsl`, `hslToHex`, per-theme hue rotation) |
| `src/utils/venn.test.ts` | Updated palette test to compare chromatic themes (Ocean Breeze vs Sunset Glow) instead of two near-identical achromatic themes |
| `src/components/ExamplesDialog.tsx` | Added Help -> Examples Gallery Venn examples and applied the active color scheme when loading them |
| `src/components/HelpDialog.tsx` | Added Venn Diagram to the in-app Help dialog's supported diagram types |
| `README.md` | Documented Venn examples in the Help -> Examples Gallery workflow |
| `package-lock.json` | Updated root lockfile version metadata to `2.2.1` for release consistency |
| `src/version.ts` | Bumped `VERSION` to `'2.2.1'` |
| `package.json` | Bumped `"version"` to `"2.2.1"` |
| `CHANGELOG.md` | Added v2.2.1 section |
| `.gitignore` | Removed blanket Markdown ignores so release/docs files remain trackable |
| `RELEASE_CHECKLIST.md` | Refreshed the release checklist for the 2.2.1 audit and packaging run |
| `RELEASE_NOTES_v2.2.1.md` | This file |

---

## Upgrade Notes

No breaking changes. Existing `.drwdd` / `.json` files open correctly. If you saved a Venn diagram under v2.2.0 with a non-default theme, re-applying the theme (Settings -> Color Scheme -> select same theme) will refresh the circles to the new richer palette. Help -> Examples Gallery now also provides theme-aware Venn starter canvases for quick manual verification.

---

## Known Issues / Not Changed

- Venn set ordering in 4-circle templates: the four circles are assigned variants A–D by creation order, which may differ from label order when a saved file is reopened.  

---

## Build Artifacts

| Artifact | Description |
|---|---|
| `release/DRAWDD-2.2.1-Portable.exe` | Windows portable executable (no installer required), regenerated on 2026-05-13 at 14:27:53 and sized at 100,308,722 bytes |
