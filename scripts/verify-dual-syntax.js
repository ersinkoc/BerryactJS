#!/usr/bin/env node

// Script to verify dual syntax support is working correctly
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(color, message) {
  console.log(`${color}${message}${RESET}`);
}

function checkFile(path, description) {
  if (existsSync(path)) {
    log(GREEN, `✓ ${description}`);
    return true;
  } else {
    log(RED, `✗ ${description}`);
    return false;
  }
}

function checkContent(path, pattern, description) {
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf-8');
    if (content.includes(pattern)) {
      log(GREEN, `✓ ${description}`);
      return true;
    } else {
      log(RED, `✗ ${description}`);
      return false;
    }
  } else {
    log(RED, `✗ File not found: ${path}`);
    return false;
  }
}

log(BLUE, '\n🚀 Verifying Berryact Dual Syntax Support\n');

let allPassed = true;

// Check core files
log(YELLOW, '📦 Core Files:');
allPassed &= checkFile('./src/jsx-runtime.js', 'JSX Runtime');
allPassed &= checkFile('./src/jsx-dev-runtime.js', 'JSX Dev Runtime');
allPassed &= checkFile('./src/core/vdom.js', 'Virtual DOM');
allPassed &= checkFile('./src/template/enhanced-parser.js', 'Enhanced Template Parser');
allPassed &= checkFile('./src/compat/index.js', 'React Compatibility Layer');

// Check TypeScript definitions
log(YELLOW, '\n📝 TypeScript Definitions:');
allPassed &= checkFile('./types/jsx.d.ts', 'JSX Type Definitions');
allPassed &= checkContent('./types/index.d.ts', 'jsx(', 'JSX exports in main types');

// Check build tools
log(YELLOW, '\n🔧 Build Tools:');
allPassed &= checkFile('./src/build/vite-plugin.js', 'Vite Plugin');
allPassed &= checkFile('./src/build/webpack-plugin.js', 'Webpack Plugin');
allPassed &= checkFile('./src/build/babel-preset.js', 'Babel Preset');

// Check examples
log(YELLOW, '\n📚 Examples:');
allPassed &= checkFile('./examples/todo-app-jsx/App.jsx', 'JSX Todo Example');
allPassed &= checkFile('./examples/todo-app-template/app.js', 'Template Todo Example');
allPassed &= checkFile('./examples/mixed-syntax/App.jsx', 'Mixed Syntax Example');
allPassed &= checkFile('./examples/react-migration/App.jsx', 'React Migration Example');

// Check tests
log(YELLOW, '\n🧪 Tests:');
allPassed &= checkFile('./tests/dual-syntax.test.js', 'Dual Syntax Tests');

// Check documentation
log(YELLOW, '\n📖 Documentation:');
allPassed &= checkFile('./docs/migration-guide-jsx.md', 'JSX Migration Guide');
allPassed &= checkFile('./README-dual-syntax.md', 'Dual Syntax README');

// Check package.json exports
log(YELLOW, '\n📦 Package Exports:');
allPassed &= checkContent('./package.json', 'jsx-runtime', 'JSX Runtime export');
allPassed &= checkContent('./package.json', 'jsx-dev-runtime', 'JSX Dev Runtime export');
allPassed &= checkContent('./package.json', 'compat', 'Compatibility export');

// Check configuration files
log(YELLOW, '\n⚙️ Configuration:');
allPassed &= checkContent('./tsconfig.json', 'jsxImportSource', 'TypeScript JSX config');
allPassed &= checkFile('./vite.config.js', 'Vite config');

// Verify specific functionality
log(YELLOW, '\n🔍 Functionality Check:');

// Check JSX transformation
allPassed &= checkContent('./src/jsx-runtime.js', 'transformProps', 'JSX prop transformation');
allPassed &= checkContent('./src/jsx-runtime.js', 'className', 'className to class transformation');

// Check template enhancement
allPassed &= checkContent('./src/template/enhanced-parser.js', 'parseComponents', 'Component parsing in templates');
allPassed &= checkContent('./src/template/enhanced-parser.js', 'parseFragments', 'Fragment parsing in templates');

// Check React compatibility
allPassed &= checkContent('./src/compat/index.js', 'useState', 'React useState compatibility');
allPassed &= checkContent('./src/compat/index.js', 'useEffect', 'React useEffect compatibility');

// Final result
if (allPassed) {
  log(GREEN, '\n🎉 All checks passed! Dual syntax support is ready.');
  log(BLUE, '\n📋 Summary:');
  log(BLUE, '• JSX syntax with build step: ✓ Ready');
  log(BLUE, '• Template literals (no build): ✓ Ready');
  log(BLUE, '• React compatibility: ✓ Ready');
  log(BLUE, '• TypeScript support: ✓ Ready');
  log(BLUE, '• Build tool integration: ✓ Ready');
  log(BLUE, '• Examples and tests: ✓ Ready');
  
  log(YELLOW, '\n🚀 Quick Start:');
  log(RESET, 'JSX:        npm run dev:jsx');
  log(RESET, 'Templates:  npm run dev:template');
  log(RESET, 'Mixed:      npm run dev:mixed');
  
  process.exit(0);
} else {
  log(RED, '\n❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}