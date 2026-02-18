#!/usr/bin/env node
/**
 * Test path references in CodeBuddy files
 *
 * Ensures no hardcoded ~/.claude/ or similar paths remain
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const CODEBUDDY_DIR = path.join(PROJECT_ROOT, '.codebuddy');
const HARCODDED_PATTERNS = [
  /~\/\.claude\//g,
  /\$HOME\/\.claude\//g,
  /C:\\Users\\[^\\]+\\.claude\\/gi,
  /\.claude\//g  // Only outside of docs directory
];

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

function scanDirectory(dir, extensions, excludeDirs = []) {
  const results = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (excludeDirs.includes(entry.name)) continue;
        scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1);
        if (extensions.includes(ext)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const relativePath = path.relative(PROJECT_ROOT, fullPath);

          for (const pattern of HARCODDED_PATTERNS) {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
              // Skip if it's in docs directory (documentation references are ok)
              if (!relativePath.startsWith('docs/')) {
                results.push({
                  file: relativePath,
                  pattern: pattern.source,
                  matches: matches.length
                });
                break;
              }
            }
          }
        }
      }
    }
  }

  scan(dir);
  return results;
}

console.log('═══ Path Reference Tests ═══\n');

// Test 1: Check .codebuddy directory for hardcoded paths
runTest('Test 1: No Hardcoded Paths in .codebuddy', () => {
  if (!fs.existsSync(CODEBUDDY_DIR)) {
    console.log('  ⊘ Skipped: .codebuddy directory not found');
    return;
  }

  const violations = scanDirectory(CODEBUDDY_DIR, ['js', 'md', 'json', 'py', 'sh']);
  assert(violations.length === 0, 'No hardcoded ~/.claude/ paths in .codebuddy');

  if (violations.length > 0) {
    console.log('\n  Found violations:');
    for (const v of violations) {
      console.log(`    - ${v.file}: ${v.matches} matches of ${v.pattern}`);
    }
  }
});

// Test 2: Check commands for hardcoded paths
runTest('Test 2: No Hardcoded Paths in Commands', () => {
  const commandsDir = path.join(CODEBUDDY_DIR, 'commands');
  if (!fs.existsSync(commandsDir)) {
    console.log('  ⊘ Skipped: commands directory not found');
    return;
  }

  const violations = scanDirectory(commandsDir, ['md']);
  assert(violations.length === 0, 'No hardcoded ~/.claude/ paths in commands');

  if (violations.length > 0) {
    console.log('\n  Found violations:');
    for (const v of violations) {
      console.log(`    - ${v.file}: ${v.matches} matches`);
    }
  }
});

// Test 3: Check agents for hardcoded paths
runTest('Test 3: No Hardcoded Paths in Agents', () => {
  const agentsDir = path.join(CODEBUDDY_DIR, 'agents');
  if (!fs.existsSync(agentsDir)) {
    console.log('  ⊘ Skipped: agents directory not found');
    return;
  }

  const violations = scanDirectory(agentsDir, ['md']);
  assert(violations.length === 0, 'No hardcoded ~/.claude/ paths in agents');

  if (violations.length > 0) {
    console.log('\n  Found violations:');
    for (const v of violations) {
      console.log(`    - ${v.file}: ${v.matches} matches`);
    }
  }
});

// Test 4: Check skills for hardcoded paths
runTest('Test 4: No Hardcoded Paths in Skills', () => {
  const skillsDir = path.join(CODEBUDDY_DIR, 'skills');
  if (!fs.existsSync(skillsDir)) {
    console.log('  ⊘ Skipped: skills directory not found');
    return;
  }

  const violations = scanDirectory(skillsDir, ['md', 'js', 'py']);
  assert(violations.length === 0, 'No hardcoded ~/.claude/ paths in skills');

  if (violations.length > 0) {
    console.log('\n  Found violations:');
    for (const v of violations) {
      console.log(`    - ${v.file}: ${v.matches} matches`);
    }
  }
});

// Test 5: Check scripts for hardcoded paths
runTest('Test 5: No Hardcoded Paths in Scripts', () => {
  const scriptsDir = path.join(CODEBUDDY_DIR, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    console.log('  ⊘ Skipped: scripts directory not found');
    return;
  }

  const violations = scanDirectory(scriptsDir, ['js', 'py', 'sh', 'ps1']);
  assert(violations.length === 0, 'No hardcoded ~/.claude/ paths in scripts');

  if (violations.length > 0) {
    console.log('\n  Found violations:');
    for (const v of violations) {
      console.log(`    - ${v.file}: ${v.matches} matches`);
    }
  }
});

// Test 6: Check for environment variable usage
runTest('Test 6: Environment Variables Used Instead', () => {
  const checkDirs = ['agents', 'commands', 'skills', 'scripts'];
  let foundEnvVars = false;

  for (const dirName of checkDirs) {
    const dirPath = path.join(CODEBUDDY_DIR, dirName);
    if (!fs.existsSync(dirPath)) continue;

    const files = getAllFiles(dirPath, ['js', 'py', 'sh', 'ps1']);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relativePath = path.relative(PROJECT_ROOT, file);

      if (content.includes('CODEBUDDY_') ||
          content.includes('process.env') ||
          content.includes('$CODEBUDDY_') ||
          content.includes('${CODEBUDDY_')) {
        foundEnvVars = true;
        console.log(`  ✓ Found CODEBUDDY_ env var in ${relativePath}`);
      }
    }
  }

  assert(foundEnvVars, 'At least one file uses CODEBUDDY_ environment variables');
});

function getAllFiles(dir, extensions) {
  const files = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  scan(dir);
  return files;
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

console.log('\n═══ Summary ═══');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('');

process.exit(failed > 0 ? 1 : 0);
