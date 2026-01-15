# DRAWDD v1.1.2 - Save & Tab Fixes

**Release Date:** January 15, 2026

This patch release focuses on reliable file saving in the Electron app and correct tab behavior when saving or opening files.

---

## 🐛 Critical Bug Fixes

### Save & Save As in Electron (Major Fix)

**Problem**: In the Windows EXE, Save/Save As behavior was inconsistent and the tab name did not update reliably.

**Solution**:
- Added native Electron save handling with true overwrite when a file path is known
- Save As uses a native dialog and stores the selected file path for future Save operations
- Tab name updates after Save As

**Result**:
- ✅ Save overwrites the existing file directly (no extra prompt) once a path is known
- ✅ Save As opens a native dialog and updates the tab name
- ✅ File path is remembered for subsequent Save

---

### Tab Naming on File Open

**Problem**: When opening a saved diagram file, the tab would show "Untitled Diagram" instead of the actual filename.

**Root Cause**: The file loading logic was using the embedded name from the JSON file instead of the actual filename shown in the file explorer.

**Solution**: Modified file import in MenuBar.tsx to:
1. Extract the actual filename from the file system (what user sees in their file explorer)
2. Strip extensions properly (.drawdd.json or .json)
3. Always use the file system filename instead of embedded JSON name
4. Properly call `__drawdd_updateFileName()` to update the tab

**Result**:
- ✅ Tabs show the correct filename when opening files
- ✅ Works for all supported import formats (.json, .xmind, .mmap, .km, .mm, .vsdx)

---

### Open File Creates a New Tab

**Problem**: Opening a file could replace the current tab instead of creating a new one.

**Solution**: Opening any file now always creates a new tab, leaving the current tab untouched.

**Result**:
- ✅ Open always adds a new tab
- ✅ Current tab remains unchanged

---

## ⚙️ Technical Details

### Files Modified

| File | Changes |
|------|---------|
| `src/version.ts` | Updated to 1.1.2 |
| `package.json` | Updated version to 1.1.2 |
| `electron/main.cjs` | Added native save handlers (save/overwrite) |
| `electron/preload.cjs` | Exposed save APIs to renderer |
| `src/App.tsx` | Added file path storage and always-open-new-tab behavior |
| `src/components/MenuBar.tsx` | Save/Save As logic and tab rename updates |

### Code Quality Improvements

- **Reliable file persistence**: Electron save path is stored per tab
- **Consistent tab naming**: Save As updates the active tab title

---

## 🔄 Upgrade Instructions

### For Users

1. **Download** the new v1.1.2 release
2. **Replace** your existing DRAWDD installation
3. **Existing diagrams** will work without any changes
4. **Enjoy** properly sized text boxes and correct tab names!

### What to Test

After upgrading, please verify:

1. **Save & Save As**:
   - Save a new diagram: should open a Save dialog and set tab name
   - Save again: should overwrite the same file without prompting

2. **Tab Naming**:
   - Save a diagram with a custom name (e.g., "My Project.drawdd.json")
   - Close and reopen the file
   - Tab should show "My Project" not "Untitled Diagram"

---

## 📊 Impact Assessment

### High Priority Fixes ✅
- **File reliability**: Save works as true overwrite in the EXE
- **User experience**: Tab names now match file explorer, reducing confusion

### Backward Compatibility ✅
- All existing .drawdd.json files work without modification
- No breaking changes to file format
- Previous version files can be opened in v1.1.2

### Regression Testing ✅
- Save and Save As tested in the Windows EXE
- Open always creates a new tab
- Existing functionality remains intact

---

## 🙏 Acknowledgments

Thanks to the community for reporting these issues! Your feedback helps make DRAWDD better for everyone.

---

## 📝 Notes

- This is a **recommended update** for all users
- Fixes critical usability issues
- No migration steps required
- Safe to install over v1.1.1 or v1.1.0

---

**Full Changelog**: See [CHANGELOG.md](CHANGELOG.md) for complete version history
