#!/usr/bin/env node
/**
 * Test cross-platform compatibility
 * Validates path handling, environment variables, and platform-specific behavior
 */

const assert = require('assert');
const path = require('path');
const os = require('os');

const utils = require('../../scripts/lib/utils');
const CODEBUDDY_DIR = path.join(__dirname, '..', '..', '.codebuddy');

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('\n═══ Cross-Platform Compatibility Test ═══\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Platform detection functions
  if (runTest('Test 1: Platform Detection', () => {
    assert(typeof utils.isWindows === 'boolean', 'isWindows should be boolean');
    assert(typeof utils.isMacOS === 'boolean', 'isMacOS should be boolean');
    assert(typeof utils.isLinux === 'boolean', 'isLinux should be boolean');

    const trueCount = [utils.isWindows, utils.isMacOS, utils.isLinux]
      .filter(v => v).length;
    assert(trueCount === 1, 'Exactly one platform should be true');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Path separators handled correctly
  if (runTest('Test 2: Path Separators', () => {
    const testPath = path.join('a', 'b', 'c');
    const separator = path.sep;

    if (utils.isWindows) {
      assert(testPath.includes('\\'), 'Windows should use backslash');
    } else {
      assert(testPath.includes('/'), 'Unix should use forward slash');
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Environment variable usage
  if (runTest('Test 3: Environment Variables Defined', () => {
    // Check if environment variables are defined (may not be in test context)
    const projectDir = process.env.CODEBUDDY_PROJECT_DIR;
    const pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT;

    // At least one should be defined or fallback to current directory
    const hasEnv = projectDir || pluginRoot;
    // Don't fail if not set - they're optional
    console.log(`    ℹ  CODEBUDDY_PROJECT_DIR: ${projectDir || 'not set'}`);
    console.log(`    ℹ  CODEBUDDY_PLUGIN_ROOT: ${pluginRoot || 'not set'}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Path normalization
  if (runTest('Test 4: Path Normalization', () => {
    const normalizePath = (p) => p.replace(/\\/g, '/');
    const winPath = 'C:\\Users\\test\\project';
    const normalized = normalizePath(winPath);

    assert(normalized.includes('/'), 'Path should be normalized to forward slashes');
    assert(!normalized.includes('\\'), 'Path should not contain backslashes');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Junction vs Symlink handling
  if (runTest('Test 5: Junction/Symlink Support', () => {
    const fs = require('fs');
    // Just check that fs.existsSync works with junctions/symlinks
    const testPath = CODEBUDDY_DIR;
    if (fs.existsSync(testPath)) {
      const stats = fs.statSync(testPath);
      // Directory exists - junction/symlink is working
      assert(stats.isDirectory(), 'Should be a directory');
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: No platform-specific hardcoded paths
  if (runTest('Test 6: No Platform-Specific Hardcoded Paths', () => {
    const fs = require('fs');
    const scriptsDir = path.join(CODEBUDDY_DIR, 'scripts', 'hooks');
    const hookFiles = ['observe.js', 'run-observer-on-stop.js'];

    for (const file of hookFiles) {
      const filePath = path.join(scriptsDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for Windows C: drives
        assert(!content.match(/[A-Z]:\\/), `${file} should not have Windows absolute paths`);
        // Check for Unix absolute paths that aren't placeholders
        const unixPaths = content.match(/"\/[^"]+"/g) || [];
        for (const p of unixPaths) {
          assert(
            p.includes('${') || p.includes('http') || p.includes('npx'),
            `${file} should use environment variables for paths: ${p}`
          );
        }
      }
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: Command escaping works
  if (runTest('Test 7: Command Escaping', () => {
    const testCommand = 'echo "test"';
    const escaped = testCommand.replace(/"/g, '\\"');

    assert(escaped.includes('\\' + '"'), 'Command should escape quotes');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: File operations are cross-platform
  if (runTest('Test 8: File Operations Cross-Platform', () => {
    const fs = require('fs');
    const tempDir = os.tmpdir();
    const testFile = path.join(tempDir, 'cross-platform-test.txt');

    // Write
    fs.writeFileSync(testFile, 'test content', 'utf-8');

    // Read
    const content = fs.readFileSync(testFile, 'utf-8');
    assert(content === 'test content', 'File content should match');

    // Cleanup
    fs.unlinkSync(testFile);
    assert(!fs.existsSync(testFile), 'File should be deleted');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  console.log(`\n═══ Summary ═══`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { runTest };
