# DRAWDD v2.3.2 Release Notes

DRAWDD v2.3.2 is a security maintenance and stability release addressing upstream dependency vulnerabilities, updating core toolchains, and improving test harness robustness.

## Summary of Changes

### 1. Security Patches & Dependency Hardening
- **Critical Archive & Path Traversal Patches**: Upgraded `tar` and packaging toolchains to resolve arbitrary file overwrite and symlink poisoning vulnerabilities ([GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v), [GHSA-8qq5-rm4j-mr97](https://github.com/advisories/GHSA-8qq5-rm4j-mr97)).
- **ZIP Memory Safety**: Added package overrides for `adm-zip` (>=0.6.0) used by `vsdx-js` to prevent malicious ZIP allocation denial-of-service ([GHSA-xcpc-8h2w-3j85](https://github.com/advisories/GHSA-xcpc-8h2w-3j85)).
- **Vite & Rollup Upgrades**: Upgraded `vite` to `^7.3.6` and `rollup` to mitigate dev server path traversal, source map disclosure, and Windows UNC path NTLM handling vulnerabilities ([GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9), [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3), [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc)).
- **PostCSS & jsPDF Security Updates**: Updated `jspdf` to `^4.2.1` and CSS processors to eliminate XSS and PDF injection vectors ([GHSA-f8cm-6447-x5h2](https://github.com/advisories/GHSA-f8cm-6447-x5h2), [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)).
- **ReDoS Protections**: Upgraded `brace-expansion`, `picomatch`, and `nanoid` to prevent regular expression backtracking and infinite loop crashes.

### 2. Electron Framework & Packaging Tooling
- **Electron Updates**: Updated Electron framework definitions to `^39.8.10` and `electron-builder` to `^26.15.3` for updated Chromium/V8 security fixes.
- **Production Build Packaging**: Refreshed Windows NSIS Installer (`DRAWDD-2.3.2-Setup.exe`) and Portable standalone package (`DRAWDD-2.3.2-Portable.exe`).

### 3. Test Harness Stability
- **KaTeX Delimiter Filter in Property Tests**: Adjusted random markdown generator test filters in `SettingsMarkdownToggle.property.test.tsx` to exclude unescaped `$` characters, preventing false-positive test collisions with KaTeX inline math processing.

## Binaries Available for Release
- **Windows Installer**: `release/DRAWDD-2.3.2-Setup.exe`
- **Portable Executable**: `release/DRAWDD-2.3.2-Portable.exe`

## Upgrade Path
All diagrams, configuration files, and saved state remain 100% compatible. Upgrade is direct and seamless.
