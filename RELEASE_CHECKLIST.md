# GitHub Release Checklist for DRAWDD v2.2.1

**Release Date:** 2026-05-13  
**Release Scope:** Venn theme engine fix, Help menu Venn examples, release metadata audit, regenerated portable executable

## Audit Summary

### Metadata Alignment
- ✅ `package.json` version is `2.2.1`
- ✅ `src/version.ts` exports `2.2.1`
- ✅ `package-lock.json` root package metadata updated from `2.1.5` to `2.2.1`

### User-Facing Documentation
- ✅ `README.md` updated to mention Help -> Examples Gallery Venn starters
- ✅ `CHANGELOG.md` refreshed for the finalized 2.2.1 release date and Help/Examples additions
- ✅ `RELEASE_NOTES_v2.2.1.md` updated to cover Help menu Venn examples, metadata audit, and the regenerated portable artifact
- ✅ In-app Help and Examples surfaces updated in `src/components/HelpDialog.tsx` and `src/components/ExamplesDialog.tsx`

### Repository Hygiene
- ✅ `.gitignore` continues to exclude build outputs, dependencies, caches, IDE files, and transient Markdown working notes
- ✅ `.gitignore` now explicitly allows `RELEASE_CHECKLIST.md` alongside release notes and primary project docs
- ✅ `release/` remains ignored so rebuilt executables do not dirty the working tree

## Validation Results

### Lint
- ⚠️ `npm run lint` still fails because of a large pre-existing repository backlog (`@typescript-eslint/no-explicit-any`, `no-unused-vars`, `prefer-const`) in older utility and property-test files such as `src/utils/contextMenu.ts`, `src/utils/collapse*.property.test.ts`, and `src/utils/errorHandling.test.ts`
- ✅ No lint or type issues were introduced in the 2.2.1 files touched for this audit

### Tests
- ✅ `npm test -- --runInBand --silent`
- ✅ Result: 33 test suites passed, 314 tests passed
- ℹ️ Test output still includes existing console warnings from collapse cycle-detection tests and the empty-image-src test case, but the suite passes cleanly

### Production Build
- ✅ `npm run build`
- ✅ Vite production build completed successfully
- ℹ️ Existing chunk-size warnings remain for large bundles; no new build errors were introduced

### Portable Packaging
- ✅ `npm run release:portable`
- ✅ Electron Builder completed successfully for Windows portable target
- ✅ Artifact generated: `release/DRAWDD-2.2.1-Portable.exe`

## Files Updated for 2.2.1

- `.gitignore`
- `README.md`
- `CHANGELOG.md`
- `RELEASE_NOTES_v2.2.1.md`
- `RELEASE_CHECKLIST.md`
- `package.json`
- `package-lock.json`
- `src/version.ts`
- `src/utils/venn.ts`
- `src/utils/venn.test.ts`
- `src/components/ExamplesDialog.tsx`
- `src/components/HelpDialog.tsx`

## Release Artifact

- **File:** `release/DRAWDD-2.2.1-Portable.exe`
- **Size:** 100,308,722 bytes
- **Built:** 2026-05-13 14:27:53
- **Target:** Windows portable (`x64`)

## Release Readiness

✅ **Ready for GitHub Release v2.2.1**

Release caveat:
- The repo is not currently lint-clean because of pre-existing unrelated issues outside the 2.2.1 scope. Tests, production build, and portable packaging all passed.

## Recommended Release Steps

1. Create a git tag: `git tag -a v2.2.1 -m "Release 2.2.1"`
2. Push tag: `git push origin v2.2.1`
3. Create the GitHub Release from the tag
4. Attach `release/DRAWDD-2.2.1-Portable.exe`
5. Publish `RELEASE_NOTES_v2.2.1.md`
