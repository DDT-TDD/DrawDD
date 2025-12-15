# DRAWDD Dependency License Audit Report

## Executive Summary
✅ **All dependencies are MIT-compatible** - No license conflicts detected with MIT license

---

## Dependency License Analysis

### Core Dependencies (Runtime)

| Package | Version | License | Compatibility | Notes |
|---------|---------|---------|------------------|-------|
| @antv/x6 | ^2.19.2 | MIT | ✅ Compatible | Graph visualization engine |
| @antv/x6-plugin-clipboard | ^2.1.6 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-dnd | ^2.1.1 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-export | ^2.1.6 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-history | ^2.2.4 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-keyboard | ^2.2.3 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-minimap | ^2.0.7 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-selection | ^2.2.2 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-snapline | ^2.1.7 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-plugin-transform | ^2.1.8 | MIT | ✅ Compatible | AntV plugin |
| @antv/x6-react-shape | ^2.2.3 | MIT | ✅ Compatible | AntV React integration |
| react | ^19.2.0 | MIT | ✅ Compatible | UI framework |
| react-dom | ^19.2.0 | MIT | ✅ Compatible | React DOM library |
| lucide-react | ^0.556.0 | ISC | ✅ Compatible | Icon library (ISC is permissive) |
| file-saver | ^2.0.5 | MIT | ✅ Compatible | File download library |
| jszip | ^3.10.1 | MIT/GPL-3.0 | ✅ Compatible | Zip file handling (Dual licensed, MIT acceptable) |
| jspdf | ^3.0.4 | MIT | ✅ Compatible | PDF generation |
| vsdx-js | ^1.2.0 | MIT | ✅ Compatible | Visio file parser |
| electron-squirrel-startup | ^1.0.1 | MIT | ✅ Compatible | Electron installer helper |

### Development Dependencies

| Package | Version | License | Compatibility | Notes |
|---------|---------|---------|------------------|-------|
| react | ^19.2.0 | MIT | ✅ Compatible | Framework |
| react-dom | ^19.2.0 | MIT | ✅ Compatible | DOM renderer |
| typescript | ~5.9.3 | Apache-2.0 | ✅ Compatible | Language (Apache 2.0 is permissive) |
| vite | ^7.2.4 | MIT | ✅ Compatible | Build tool |
| @vitejs/plugin-react | ^5.1.1 | MIT | ✅ Compatible | Vite plugin |
| tailwindcss | ^4.1.17 | MIT | ✅ Compatible | CSS framework |
| @tailwindcss/vite | ^4.1.17 | MIT | ✅ Compatible | Tailwind Vite plugin |
| eslint | ^9.39.1 | MIT | ✅ Compatible | Linter |
| typescript-eslint | ^8.46.4 | MIT/BSD | ✅ Compatible | TypeScript linter (BSD is compatible) |
| electron | ^39.2.6 | MIT | ✅ Compatible | Desktop framework |
| electron-builder | ^26.0.12 | MIT | ✅ Compatible | Installer builder |
| electron-packager | ^17.1.2 | BSD-2-Clause | ✅ Compatible | Packager (BSD is compatible) |

---

## License Compatibility Details

### MIT License
✅ **Fully Compatible** - Original MIT-licensed software

### ISC License (lucide-react)
✅ **Fully Compatible** - ISC is a permissive open-source license functionally equivalent to MIT

### Apache 2.0 License (TypeScript)
✅ **Fully Compatible** - More permissive than MIT, development dependency only

### BSD Licenses (TypeScript-ESLint, electron-packager)
✅ **Fully Compatible** - BSD is permissive and compatible with MIT-licensed projects

### GPL-3.0 / MIT Dual License (jszip)
✅ **Fully Compatible** - Project uses MIT variant; dual licensing allows MIT usage

---

## Permissiveness Hierarchy
(Most restrictive to least restrictive)
```
GPL 3.0 (restrictive copyleft)
├─ Not an issue - jszip offers MIT alternative
├─ Compatible with permissive licenses
└─ All other licenses are more permissive

MIT License (permissive)
├─ This is DRAWDD's license
├─ Compatible with: ISC, Apache 2.0, BSD, MPL-2.0

ISC License (permissive)
Apache 2.0 (permissive + patent protection)
BSD-2-Clause, BSD-3-Clause (permissive)
└─ All more permissive or equivalent
```

---

## Specific Compatibility Analysis

### jszip (Potential Concern - But Resolved)
- **Issue**: Dual licensed under MIT/GPL-3.0
- **Resolution**: ✅ DRAWDD uses the MIT license option
- **Status**: **No conflict** - Dual-licensed software allows choosing the compatible license

### TypeScript (Development Dependency)
- **License**: Apache 2.0
- **Status**: ✅ Compatible - Dev dependency, Apache 2.0 is permissive
- **Note**: Does not affect distribution, only development tooling

---

## Summary of Findings

### ✅ No License Violations
- All runtime dependencies are MIT or MIT-compatible
- All development dependencies are permissive licenses
- No GPL licenses in runtime dependencies that would trigger copyleft requirements
- No proprietary or commercial licenses detected
- No attribution conflicts

### ✅ No Additional Declarations Needed
- All compatible licenses are automatically included via npm packages
- License headers in DRAWDD's LICENSE file are sufficient
- No additional THIRD_PARTY_LICENSES file required (but can be added for transparency)

### Recommended Action (Optional)
Create `THIRD_PARTY_LICENSES.md` for transparency:
- Lists all dependencies and their licenses
- Helpful for users and contributors
- Best practice for large projects

---

## Conclusion

✅ **DRAWDD is fully compliant with MIT licensing**
- All dependencies are MIT-compatible
- No license conflicts detected
- No additional declarations required
- Ready for open-source release

---

## Reference: License Compatibility Matrix

```
┌─────────────────┬───────┬──────────┬─────────┬─────────┬──────────┐
│ Main License    │ MIT   │ ISC      │ Apache2 │ BSD     │ GPL      │
├─────────────────┼───────┼──────────┼─────────┼─────────┼──────────┤
│ MIT             │  ✅   │   ✅     │   ✅    │   ✅    │   ⚠️*   │
│ ISC             │  ✅   │   ✅     │   ✅    │   ✅    │   ⚠️*   │
│ Apache 2.0      │  ✅   │   ✅     │   ✅    │   ✅    │   ⚠️*   │
│ BSD-2/3         │  ✅   │   ✅     │   ✅    │   ✅    │   ⚠️*   │
│ GPL             │  ⚠️*  │   ⚠️*    │   ⚠️*   │   ⚠️*   │   ✅    │
└─────────────────┴───────┴──────────┴─────────┴─────────┴──────────┘

✅ = Fully Compatible
⚠️* = Requires careful review (copyleft considerations)
     BUT if GPL license is secondary/alternative, no issue
```

**Note**: jszip's GPL is secondary (MIT is primary option), so no conflict.
