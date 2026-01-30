/**
 * Clean packaging script for DRAWDD
 * Removes unnecessary files from the packaged app
 */

const fs = require('fs');
const path = require('path');

const appPath = process.argv[2] || 'release-builds/DRAWDD-win32-x64/resources/app';

console.log('Cleaning packaged app at:', appPath);

// Files and directories to remove
const toRemove = [
  // Development directories
  '.git',
  '.github',
  '.kiro',
  '.vscode',
  'src',
  'release-builds_old', // OLD RELEASE BUILDS - HUGE!
  'scripts', // Cleanup script itself not needed in release
  
  // Config files
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'jest.config.js',
  'eslint.config.js',
  'tailwind.config.js',
  'index.html', // Root index.html (we use dist/index.html)
  '.gitignore',
  '.electronignore',
  '.npmignore',
  
  // Documentation (keep LICENSE and README.md)
  'NODE_VISIBILITY_FIX.md',
  'PACKAGE_OPTIMIZATION.md',
  'ADDITIONAL_FEATURES_PLAN.md',
  'BUG_FIXES_SUMMARY.md',
  'CHANGELOG.md',
  'COLLAPSE_EXPAND_CHECKPOINT.md',
  'CONTRIBUTING.md',
  'CRASH_FIX_SUMMARY.md',
  'CRITICAL_FIX_SUMMARY.md',
  'CRITICAL_STABILITY_FIXES.md',
  'DOCUMENTATION_UPDATE_SUMMARY.md',
  'FEATURES_SUMMARY.md',
  'FINAL_STATUS.md',
  'FIXES_VERIFICATION.md',
  'FOLDER_EXPLORER_CHECKPOINT.md',
  'IMPLEMENTATION_CHECKLIST.md',
  'IMPLEMENTATION_PROGRESS.md',
  'LICENSE_AUDIT.md',
  'REGRESSION_FIXES.md',
  'REGRESSION_FIXES_FINAL.md',
  'RELEASE_CHECKLIST.md',
  'RELEASE_NOTES_v1.1.1.md',
  'RELEASE_NOTES_v1.1.2.md',
  'RELEASE_NOTES_v1.1.3.md',
  'RELEASE_NOTES_v2.0.0.md',
  'REMAINING_IMPLEMENTATION.md',
  'STABILITY_FIXES_APPLIED.md',
  'TROUBLESHOOTING.md',
  
  // Dev dependencies in node_modules
  'node_modules/@types',
  'node_modules/@testing-library',
  'node_modules/@vitejs',
  'node_modules/@vitest',
  'node_modules/@eslint',
  'node_modules/@eslint-community',
  'node_modules/@rollup',
  'node_modules/@tailwindcss',
  'node_modules/vite',
  'node_modules/vitest',
  'node_modules/eslint',
  'node_modules/eslint-plugin-react-hooks',
  'node_modules/eslint-plugin-react-refresh',
  'node_modules/jest',
  'node_modules/jest-environment-jsdom',
  'node_modules/typescript',
  'node_modules/typescript-eslint',
  'node_modules/ts-jest',
  'node_modules/electron-builder',
  'node_modules/electron-packager',
  'node_modules/fast-check',
  'node_modules/rcedit',
  'node_modules/globals',
  'node_modules/.vite',
  'node_modules/.vite-temp',
  'node_modules/.tmp',
  'node_modules/.cache',
  'node_modules/.package-lock.json',
];

let removedCount = 0;
let totalSize = 0;

function getDirectorySize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (err) {
    // Ignore errors
  }
  return size;
}

function removeRecursive(itemPath) {
  try {
    if (!fs.existsSync(itemPath)) {
      return;
    }
    
    const stats = fs.statSync(itemPath);
    const size = stats.isDirectory() ? getDirectorySize(itemPath) : stats.size;
    
    if (stats.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    
    removedCount++;
    totalSize += size;
    console.log(`✓ Removed: ${path.relative(appPath, itemPath)} (${(size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.warn(`✗ Failed to remove: ${itemPath} - ${err.message}`);
  }
}

// Remove items
for (const item of toRemove) {
  const itemPath = path.join(appPath, item);
  removeRecursive(itemPath);
}

// Remove test files
function removeTestFiles(dir) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        removeTestFiles(itemPath);
      } else if (
        item.endsWith('.test.ts') ||
        item.endsWith('.test.tsx') ||
        item.endsWith('.test.js') ||
        item.endsWith('.test.jsx') ||
        item.includes('.property.test.') ||
        item.includes('.integration.test.') ||
        item === 'setupTests.ts'
      ) {
        removeRecursive(itemPath);
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

removeTestFiles(appPath);

console.log(`\n✓ Cleanup complete!`);
console.log(`  Removed ${removedCount} items`);
console.log(`  Freed ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
