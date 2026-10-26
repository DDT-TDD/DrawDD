# Release Notes

DRAWDD v2.5.0 is a comprehensive security audit, dependency remediation, runtime hardening, and maintenance release. This release brings our dependency vulnerability count down to **0**, hardens Electron IPC channels and WebPreferences, guards against decompression bomb Denial-of-Service attacks, and addresses the critical October 2026 Node.js runtime security advisories.

---

## 🔒 Security Audit & Vulnerability Remediation

### 1. Zero Vulnerability Baseline (`0 vulnerabilities`)
Through comprehensive dependency auditing and remediation across the entire dependency graph, DRAWDD has eliminated all 22 previously identified vulnerabilities (including 4 critical and 13 high severity issues):
- **Unused Dependency Removal**: Removed unused `vsdx-js` dependency from production packages. This immediately eliminated transitive vulnerabilities in `adm-zip` (GHSA-vwc7-r8mq-g2x9, GHSA-7q85-xj36-vmfc, GHSA-rcw4-f5rp-g42v, GHSA-j5f4-cc29-5x44, GHSA-p634-w6r4-rjp2, GHSA-c6fg-446q-cg94, GHSA-8238-w5pm-2374), `vitest` (GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8), and `tinypool` (Critical prototype pollution to RCE GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr).
- **Electron Upgrade (`^42.11.18`)**: Upgraded Electron to 42.11.18, patching 12 high-severity Electron CVEs covering HTML sandbox inheritance bypasses, CORS protocol handler bypasses, webview Node integration leaks in Web Workers, USB/HID permission origin confusion, pointer lock origin checks, and intermediate certificate validation.
- **Packager Modernization**: Migrated from legacy `electron-packager` to `@electron/packager@^20.3.0`, remediating symlink path traversal and arbitrary file write vulnerabilities in legacy `extract-zip` (GHSA-jmr9-qjv8-65gv, GHSA-7pqw-9j4j-h8q3).
- **Vite Upgrade (`^7.3.7`)**: Upgraded Vite to version 7.3.7, mitigating editor argument injection, path bypasses on Windows, and cross-origin middleware script execution (GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw, GHSA-rq7h-c2jc-7f22).
- **KaTeX Upgrade (`^0.19.1`)**: Upgraded KaTeX to version 0.19.1, fixing prototype pollution trust bypasses (GHSA-238p-pmpm-9mq7) and enforcing `trust: false` across all formula rendering.
- **Dependency Overrides**:
  - `dompurify` >= 3.4.17 (Mitigating critical DOM XSS and template expression bypasses)
  - `brace-expansion` >= 5.0.12 (Mitigating quadratic ReDoS and stack exhaustion DoS)
  - `fast-uri` >= 3.1.9 (Mitigating URI scheme spoofing and SSRF host canonicalization)
  - `fflate` >= 0.8.3 (Mitigating ZIP64 infinite loop DoS)
  - `handlebars` >= 4.7.10 (Mitigating JavaScript template injection)
  - `http-cache-semantics` >= 4.2.1 (Mitigating cross-user cached response disclosure)
  - `js-yaml` >= 4.3.2 (Mitigating merge key CPU exhaustion)
  - `source-map-js` >= 1.2.2 (Mitigating event-loop denial of service)
  - `undici` >= 6.29.1 (Mitigating WebSocket deflate DoS and response splitting)
  - `@xmldom/xmldom` >= 0.8.15 (Mitigating XML entity injection and quadratic parsing)
  - `zod` >= 4.6.6 (Mitigating memory exhaustion during constrained validation)
  - `@humanfs/node` >= 0.16.8 (Mitigating recursive copy symlink escapes)

---

## 🛡️ Node.js October 2026 Security Release Remediation

Reference: [Node.js October 2026 Security Releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
- **Node.js LTS Runtime Compliance**: Verified execution against Node.js v24.22.1 LTS, resolving **CVE-2026-111497** (out-of-bounds write in bundled Brotli decoder / "Node2Shell").
- **Decompression Bomb Defense**: Hardened `decompressDrawioDiagram` in `src/utils/importExport.ts` by introducing an in-flight byte stream accumulator with an explicit 50MB ceiling (`MAX_DECOMPRESSED_SIZE`). Any malformed or exponential decompression payload triggers immediate stream termination (`reader.cancel()`) and safe rejection before browser or Node memory exhaustion can occur.

---

## 🔐 Electron & Application Hardening

### 1. IPC & Navigation Security
- **Protocol Allowlist (`isSafeUrl`)**: All URLs passed to `shell.openExternal` or through the `open-external` IPC channel are strictly validated against an approved scheme list (`http:`, `https:`, `mailto:`). Malicious URI schemes such as `javascript:`, `file:`, `vbscript:`, or custom shell handlers are rejected.
- **Safe External File Opening (`open-file`)**: Added path validation and dangerous extension blocking in `shell.openPath`. Executable and script formats (`.exe`, `.bat`, `.cmd`, `.msi`, `.vbs`, `.ps1`, `.scr`, etc.) cannot be launched directly through the diagram viewer.
- **Directory Scan Resource Limits (`scan-directory`)**: Enforced a maximum directory traversal depth of 10 and a maximum scanned node limit of 5,000 entries to prevent recursion loops, symlink traps, and memory exhaustion.
- **Top-Level Navigation Lockdown**: Added an explicit `will-navigate` guard on `mainWindow.webContents` that blocks unexpected top-level navigation away from the local application assets.

### 2. Renderer & Markdown Hardening
- **WebPreferences Hardening**: Disabled `<webview>` tag creation (`webviewTag: false`) to close worker privilege escalation vectors; enforced `webSecurity: true` and `allowRunningInsecureContent: false`.
- **Markdown Link Sanitization**: All markdown links rendered on canvas nodes are parsed through `sanitizeUrl`, stripping unsafe protocol handlers (`javascript:`, `vbscript:`, `data:`) and attaching `rel="noopener noreferrer"`.
- **KaTeX Safe Execution**: Enforced `trust: false` on all inline and display math rendering passes to disallow arbitrary command expansion.

---

## 📦 Generated Binaries

- **Windows Installer**: `DRAWDD-2.5.0-Setup.exe`
- **Windows Portable**: `DRAWDD-2.5.0-Portable.exe`
- **Windows Portable**: `DRAWDD-2.5.0-Portable_unpacked`

---

## 🔄 Upgrade Path

DRAWDD v2.5.0 is completely backwards-compatible with all existing `.drwdd`, `.json`, `.xmind`, `.mmap`, `.vsdx`, and `.drawio` files. Existing diagrams and configurations upgrade automatically.
