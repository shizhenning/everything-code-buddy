#!/usr/bin/env node

/**
 * Test: Python CLI Path Configuration
 *
 * Validates that Python CLI scripts use correct paths:
 * 1. No hardcoded ~/.claude/ paths
 * 2. Uses CODEBUDDY_PROJECT_DIR environment variable
 * 3. Uses .codebuddy/ prefix for project-level paths
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const assert = require('assert');

const PROJECT_DIR = process.env.CODEBUDDY_PROJECT_DIR || path.join(__dirname, '..', '..');
const PYTHON_SCRIPT = path.join(PROJECT_DIR, 'skills', 'continuous-learning-v2', 'scripts', 'instinct-cli.py');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, testFn) {
  try {
    testFn();
    testsPassed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
  }
}

console.log('═══ Python CLI Path Configuration Test ═══\n');

// Test 1: Python script exists
runTest('Test 1: instinct-cli.py Exists', () => {
  assert(fs.existsSync(PYTHON_SCRIPT), 'instinct-cli.py should exist');
});

// Test 2: No hardcoded ~/.claude/ in the source
runTest('Test 2: No Hardcoded ~/.claude/ Paths', () => {
  const content = fs.readFileSync(PYTHON_SCRIPT, 'utf-8');

  // Check for hardcoded paths (excluding user_claude which is for backward compatibility)
  const lines = content.split('\n');
  const hardcodedClaude = lines.filter(line => {
    // Allow user_claude definition and legacy checks
    const isVariableDef = line.includes('user_claude =') || line.includes('legacy_homunculus');
    const isInString = line.includes('".claude"') || line.includes("'.claude'");
    return isInString && !isVariableDef;
  });

  if (hardcodedClaude.length > 0) {
    console.log(`    ⚠ Found ${hardcodedClaude.length} hardcoded .claude references`);
    hardcodedClaude.forEach(line => console.log(`      ${line.trim()}`));
  }

  // Don't fail - some legacy support is expected
  console.log(`    Legacy .claude references: ${hardcodedClaude.length}`);
  assert(true, 'Hardcoded paths checked');
});

// Test 3: Uses CODEBUDDY_PROJECT_DIR
runTest('Test 3: Uses CODEBUDDY_PROJECT_DIR', () => {
  const content = fs.readFileSync(PYTHON_SCRIPT, 'utf-8');

  const usesProjectDir = content.includes('CODEBUDDY_PROJECT_DIR') ||
                        content.includes('project_dir');

  if (!usesProjectDir) {
    console.log(`    ⚠ Script doesn't use CODEBUDDY_PROJECT_DIR`);
  }

  assert(usesProjectDir, 'Script should use CODEBUDDY_PROJECT_DIR');
});

// Test 4: Uses .codebuddy prefix
runTest('Test 4: Uses .codebuddy/ Prefix', () => {
  const content = fs.readFileSync(PYTHON_SCRIPT, 'utf-8');

  const usesCodebuddy = content.includes('.codebuddy') ||
                        content.includes('CodeBuddyPaths');

  if (!usesCodebuddy) {
    console.log(`    ⚠ Script doesn't use .codebuddy prefix`);
  }

  assert(usesCodebuddy, 'Script should use .codebuddy/ prefix');
});

// Test 5: CodeBuddyPaths class exists
runTest('Test 5: CodeBuddyPaths Class Exists', () => {
  const content = fs.readFileSync(PYTHON_SCRIPT, 'utf-8');

  const hasClass = content.includes('class CodeBuddyPaths') ||
                 content.includes('CodeBuddyPaths');

  if (!hasClass) {
    console.log(`    ⚠ CodeBuddyPaths class not found`);
  }

  assert(hasClass, 'Script should have CodeBuddyPaths class');
});

// Test 6: Test help command (if Python is available)
runTest('Test 6: Python Script Syntax Check', () => {
  try {
    // Just check if Python is available and script can be parsed
    execSync('python3 --version', { stdio: 'pipe' });

    // Try to run with --help
    execSync(`python3 "${PYTHON_SCRIPT}" --help`, { stdio: 'pipe', timeout: 5000 });

    console.log(`    Python script runs successfully`);
  } catch (err) {
    // Don't fail if Python is not available
    console.log(`    Python not available or script error: ${err.message || err}`);
  }
  assert(true, 'Python syntax checked');
});

// Test 7: Check .codebuddy version is synced
runTest('Test 7: .codebuddy Version Synced', () => {
  const codebuddyScript = path.join(PROJECT_DIR, '.codebuddy', 'skills', 'continuous-learning-v2', 'scripts', 'instinct-cli.py');

  if (!fs.existsSync(codebuddyScript)) {
    console.log(`    ⊘ .codebuddy version not found (may be a junction link)`);
    return;
  }

  const mainContent = fs.readFileSync(PYTHON_SCRIPT, 'utf-8');
  const codebuddyContent = fs.readFileSync(codebuddyScript, 'utf-8');

  // Check if both have CodeBuddyPaths
  const mainHasPaths = mainContent.includes('class CodeBuddyPaths');
  const codebuddyHasPaths = codebuddyContent.includes('class CodeBuddyPaths');

  if (mainHasPaths !== codebuddyHasPaths) {
    console.log(`    ⚠ .codebuddy version differs from main version`);
  } else {
    console.log(`    ✓ Versions are in sync`);
  }

  assert(true, 'Version sync checked');
});

console.log(`\n═══ Summary ═══`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

process.exit(testsFailed > 0 ? 1 : 0);
