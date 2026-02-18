#!/usr/bin/env node
/**
 * Test Junction linking functionality
 *
 * Tests the link-ecc-to-project.ps1 script
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_DIR = path.join(__dirname, '../../.codebuddy');
const LINK_SCRIPT = path.join(__dirname, '../../scripts/link-ecc-to-project.ps1');
const PROJECT_ROOT = path.join(__dirname, '../..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function runTest(name, testFn) {
  console.log(`\n━━━ ${name} ━━━`);
  try {
    testFn();
  } catch (err) {
    console.error(`  ✗ Test error: ${err.message}`);
    failed++;
  }
}

console.log('═══ Junction Linking Tests ═══\n');

// Test 1: Check if .codebuddy directory exists
runTest('Test 1: .codebuddy Directory Exists', () => {
  assert(fs.existsSync(TEST_DIR), `.codebuddy directory should exist at ${TEST_DIR}`);
});

// Test 2: Check if required links exist
runTest('Test 2: Required Links Exist', () => {
  const requiredLinks = ['agents', 'commands', 'skills', 'rules', 'scripts', 'hooks'];
  for (const link of requiredLinks) {
    const linkPath = path.join(TEST_DIR, link);
    assert(fs.existsSync(linkPath), `Link '${link}' should exist`);
  }
});

// Test 3: Verify links are actually junctions (Windows only)
runTest('Test 3: Verify Links are Junctions', () => {
  if (process.platform !== 'win32') {
    console.log('  ⊘ Skipped: Windows only test');
    return;
  }

  const links = ['agents', 'commands', 'skills', 'rules', 'scripts', 'hooks'];
  for (const link of links) {
    const linkPath = path.join(TEST_DIR, link);
    try {
      const stats = fs.lstatSync(linkPath);
      assert(stats.isSymbolicLink(), `Link '${link}' should be a symbolic link/junction`);
    } catch (err) {
      assert(false, `Link '${link}' stats check: ${err.message}`);
    }
  }
});

// Test 4: Verify links point to correct source directories
runTest('Test 4: Verify Link Targets', () => {
  const expectedSources = {
    agents: path.join(PROJECT_ROOT, 'agents'),
    commands: path.join(PROJECT_ROOT, 'commands'),
    skills: path.join(PROJECT_ROOT, 'skills'),
    rules: path.join(PROJECT_ROOT, 'rules'),
    scripts: path.join(PROJECT_ROOT, 'scripts'),
    hooks: path.join(PROJECT_ROOT, 'hooks')
  };

  for (const [linkName, expectedSource] of Object.entries(expectedSources)) {
    const linkPath = path.join(TEST_DIR, linkName);

    if (process.platform === 'win32') {
      // Windows: use junction
      try {
        const realPath = fs.realpathSync(linkPath);
        assert(realPath === expectedSource, `Link '${linkName}' should point to ${expectedSource}`);
      } catch (err) {
        assert(false, `Link '${linkName}' target verification: ${err.message}`);
      }
    } else {
      // Unix: should be symlink
      try {
        const realPath = fs.realpathSync(linkPath);
        assert(realPath === expectedSource, `Link '${linkName}' should point to ${expectedSource}`);
      } catch (err) {
        assert(false, `Link '${linkName}' target verification: ${err.message}`);
      }
    }
  }
});

// Test 5: Verify source directories are accessible
runTest('Test 5: Source Directories Accessible', () => {
  const sources = ['agents', 'commands', 'skills', 'rules', 'scripts', 'hooks'];
  for (const source of sources) {
    const sourcePath = path.join(PROJECT_ROOT, source);
    assert(fs.existsSync(sourcePath), `Source directory '${source}' should exist`);
    assert(fs.statSync(sourcePath).isDirectory(), `Source '${source}' should be a directory`);
  }
});

// Test 6: Verify link script exists
runTest('Test 6: Link Script Exists', () => {
  assert(fs.existsSync(LINK_SCRIPT), `Link script should exist at ${LINK_SCRIPT}`);
});

console.log('\n═══ Summary ═══');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('');

process.exit(failed > 0 ? 1 : 0);
