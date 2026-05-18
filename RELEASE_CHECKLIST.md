# GitHub Release Checklist for DRAWDD v2.2.2

**Release Date:** 2026-05-18  
**Release Scope:** Import workflow hardening, markdown link rendering audit fix, metadata/documentation refresh, regenerated portable executable

## Audit Summary

### Metadata Alignment
- ✅ `package.json` version is `2.2.2`
- ✅ `src/version.ts` exports `2.2.2`
- ✅ `package-lock.json` root package metadata is `2.2.2`

### User-Facing Documentation
- ✅ `README.md` now documents content-based KityMinder JSON detection, FreeMind/FreePlane XML detection, draw.io XML support, unified import behavior, and import-label reliability
- ✅ `CHANGELOG.md` includes the finalized 2.2.2 import and markdown-rendering fixes
- ✅ `RELEASE_NOTES_v2.2.2.md` now reflects the actual audit results and regenerated portable artifact metadata

### Repository Hygiene
- ✅ `.gitignore` now excludes exported `.km` artifacts alongside other local export files
- ✅ `.gitignore` still keeps `release/` ignored so rebuilt executables do not dirty the working tree
- ✅ Existing release and primary documentation allow-list rules remain intact

## Validation Results

### Lint
- ⚠️ `npm run lint` still fails with the existing repository-wide backlog: 884 problems (878 errors, 6 warnings)
- ⚠️ The backlog includes older utility/property-test files such as `src/utils/layout.ts`, `src/utils/text.ts`, `src/utils/linkedNodeReadOnly.property.test.ts`, `src/utils/metadataPersistence.property.test.ts`, and `src/utils/nodeConversion.ts`
- ⚠️ The same backlog also intersects long-lived integration surfaces touched for 2.2.2, including `src/App.tsx`, `src/components/Canvas.tsx`, `src/components/MenuBar.tsx`, `src/components/Toolbar.tsx`, and `src/utils/importExport.ts`
- ✅ Focused `eslint` passes for the newly added helper files and markdown-audit files: `electron/main.cjs`, `src/utils/fileImportWorkflow.ts`, `src/utils/fileImportWorkflow.test.ts`, `src/utils/markdown.ts`, `src/components/MarkdownRenderer.test.tsx`, and `src/version.ts`

### Tests
- ✅ `npm test -- --runInBand --silent`
- ✅ Result: 34 test suites passed, 320 tests passed
- ℹ️ Test output still includes existing console warnings from collapse cycle-detection tests and the empty-image-src test case, but the suite passes cleanly

### Production Build
- ✅ `npm run build`
- ✅ Vite production build completed successfully
- ℹ️ Existing chunk-size warnings remain for large bundles; no new build errors were introduced

### Portable Packaging
- ✅ `npm run release:portable`
- ✅ Electron Builder completed successfully for the Windows portable target
- ✅ Artifact generated: `release/DRAWDD-2.2.2-Portable.exe`

## Files Updated for 2.2.2

- `.gitignore`
- `README.md`
- `CHANGELOG.md`
- `RELEASE_NOTES_v2.2.2.md`
- `RELEASE_CHECKLIST.md`
- `package.json`
- `package-lock.json`
- `src/version.ts`
- `electron/main.cjs`
- `src/App.tsx`
- `src/components/Canvas.tsx`
- `src/components/MenuBar.tsx`
- `src/components/Toolbar.tsx`
- `src/components/MarkdownRenderer.test.tsx`
- `src/utils/fileImportWorkflow.ts`
- `src/utils/fileImportWorkflow.test.ts`
- `src/utils/importExport.ts`
- `src/utils/markdown.ts`

## Release Artifact

- **File:** `release/DRAWDD-2.2.2-Portable.exe`
- **Size:** 100,308,473 bytes
- **Built:** 2026-05-18 13:40:06
- **Target:** Windows portable (`x64`)

## Release Readiness

✅ **Ready for GitHub Release v2.2.2**

Release caveat:
- The repository is still not lint-clean because of pre-existing lint debt in older utility, property-test, and integration files. Tests, production build, and portable packaging all passed for the audited 2.2.2 tree.

## Recommended Release Steps

1. Create a git tag: `git tag -a v2.2.2 -m "Release 2.2.2"`
2. Push tag: `git push origin v2.2.2`
3. Create the GitHub Release from the tag
4. Attach `release/DRAWDD-2.2.2-Portable.exe`
5. Publish `RELEASE_NOTES_v2.2.2.md`
