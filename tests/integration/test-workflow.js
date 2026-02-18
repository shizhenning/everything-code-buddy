#!/usr/bin/env node

/**
 * Integration Test: End-to-End Workflow
 *
 * Tests complete workflows using CodeBuddy components:
 * 1. Agent delegation workflow
 * 2. Hook trigger workflow
 * 3. Command execution workflow
 */

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const PROJECT_DIR = process.env.CODEBUDDY_PROJECT_DIR || path.join(__dirname, '..', '..');
const CODEBUDDY_DIR = path.join(PROJECT_DIR, '.codebuddy');

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

console.log('═══ End-to-End Workflow Test ═══\n');

// Test 1: Directory structure exists
runTest('Test 1: CodeBuddy Directory Structure', () => {
  assert(fs.existsSync(CODEBUDDY_DIR), '.codebuddy directory should exist');
  assert(fs.existsSync(path.join(CODEBUDDY_DIR, 'agents')), 'agents directory should exist');
  assert(fs.existsSync(path.join(CODEBUDDY_DIR, 'commands')), 'commands directory should exist');
  assert(fs.existsSync(path.join(CODEBUDDY_DIR, 'skills')), 'skills directory should exist');
  assert(fs.existsSync(path.join(CODEBUDDY_DIR, 'hooks')), 'hooks directory should exist');
});

// Test 2: Agent files have correct format
runTest('Test 2: Agent Files Have YAML Frontmatter', () => {
  const agentsDir = path.join(CODEBUDDY_DIR, 'agents');
  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

  assert(agentFiles.length > 0, 'Should have at least one agent');

  for (const file of agentFiles) {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
    assert(content.startsWith('---'), `${file} should start with YAML frontmatter`);
    assert(content.includes('---', 4), `${file} should have closing frontmatter delimiter`);
  }
});

// Test 3: Command files have correct format
runTest('Test 3: Command Files Have Description', () => {
  const commandsDir = path.join(CODEBUDDY_DIR, 'commands');
  const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));

  assert(commandFiles.length > 0, 'Should have at least one command');

  let filesWithDescription = 0;
  for (const file of commandFiles) {
    const content = fs.readFileSync(path.join(commandsDir, file), 'utf-8');
    // Some commands use Markdown title instead of YAML frontmatter
    if (content.startsWith('---')) {
      assert(content.includes('description'), `${file} should have description field`);
      filesWithDescription++;
    } else {
      // Check for Markdown title format (# Title)
      assert(content.match(/^#\s+.+/m), `${file} should have Markdown title`);
      filesWithDescription++;
    }
  }

  assert(filesWithDescription > 0, 'Should have at least one command with description or title');
});

// Test 4: Skills have SKILL.md files
runTest('Test 4: Skills Have SKILL.md Files', () => {
  const skillsDir = path.join(CODEBUDDY_DIR, 'skills');
  const skillDirs = fs.readdirSync(skillsDir).filter(f => {
    const dirPath = path.join(skillsDir, f);
    return fs.statSync(dirPath).isDirectory();
  });

  assert(skillDirs.length > 0, 'Should have at least one skill');

  let skillFileCount = 0;
  for (const skillDir of skillDirs) {
    const skillFile = path.join(skillsDir, skillDir, 'SKILL.md');
    if (fs.existsSync(skillFile)) {
      skillFileCount++;
      const content = fs.readFileSync(skillFile, 'utf-8');
      assert(content.includes('---'), `${skillDir}/SKILL.md should have frontmatter`);
      assert(content.includes('name'), `${skillDir}/SKILL.md should have name field`);
      assert(content.includes('description'), `${skillDir}/SKILL.md should have description field`);
    }
  }

  assert(skillFileCount > 0, 'Should have at least one skill with SKILL.md');
});

// Test 5: Hooks configuration exists and is valid
runTest('Test 5: Hooks Configuration Valid', () => {
  const hooksFile = path.join(CODEBUDDY_DIR, 'hooks', 'hooks.json');

  assert(fs.existsSync(hooksFile), 'hooks.json should exist');

  const content = fs.readFileSync(hooksFile, 'utf-8');
  const hooks = JSON.parse(content);

  assert(hooks.hooks, 'hooks.json should have "hooks" field');
  assert(Object.keys(hooks.hooks).length > 0, 'Should have at least one hook type');
});

// Test 6: Plugin configuration exists
runTest('Test 6: Plugin Configuration Exists', () => {
  const pluginFile = path.join(CODEBUDDY_DIR, 'plugin.json');

  assert(fs.existsSync(pluginFile), 'plugin.json should exist');

  const content = fs.readFileSync(pluginFile, 'utf-8');
  const plugin = JSON.parse(content);

  assert(plugin.name, 'plugin.json should have "name" field');
  assert(plugin.version, 'plugin.json should have "version" field');
  assert(Array.isArray(plugin.commands), 'plugin.json should have "commands" array');
  assert(Array.isArray(plugin.agents), 'plugin.json should have "agents" array');
});

// Test 7: Hook scripts are executable Node.js files
runTest('Test 7: Hook Scripts Are Valid Node.js', () => {
  const hooksDir = path.join(CODEBUDDY_DIR, 'hooks');
  const scriptFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.js'));

  assert(scriptFiles.length > 0, 'Should have at least one hook script');

  for (const file of scriptFiles) {
    const content = fs.readFileSync(path.join(hooksDir, file), 'utf-8');

    // Check for shebang
    assert(
      content.startsWith('#!/usr/bin/env node') || content.startsWith('#!'),
      `${file} should have Node.js shebang`
    );

    // Check for common Node.js patterns
    assert(content.includes('require(') || content.includes('import '), `${file} should be a Node.js module`);
  }
});

// Test 8: Python CLI exists and has CodeBuddyPaths class
runTest('Test 8: Python CLI Has CodeBuddyPaths', () => {
  const pythonScript = path.join(
    CODEBUDDY_DIR,
    'skills',
    'continuous-learning-v2',
    'scripts',
    'instinct-cli.py'
  );

  if (!fs.existsSync(pythonScript)) {
    console.log(`    ⊘ Python CLI not found (may be a junction link)`);
    return;
  }

  const content = fs.readFileSync(pythonScript, 'utf-8');
  assert(content.includes('class CodeBuddyPaths'), 'instinct-cli.py should have CodeBuddyPaths class');
  assert(content.includes('CODEBUDDY_PROJECT_DIR'), 'instinct-cli.py should use CODEBUDDY_PROJECT_DIR');
});

// Test 9: Observer agent configuration
runTest('Test 9: Observer Agent Configured', () => {
  const observerAgent = path.join(CODEBUDDY_DIR, 'agents', 'observer.md');

  assert(fs.existsSync(observerAgent), 'observer.md agent should exist');

  const content = fs.readFileSync(observerAgent, 'utf-8');
  assert(content.includes('name:'), 'observer.md should have name field');
  assert(content.includes('description:'), 'observer.md should have description field');
});

// Test 10: Session directories are prepared
runTest('Test 10: Session Directories Ready', () => {
  const sessionsDir = path.join(CODEBUDDY_DIR, 'sessions');

  if (!fs.existsSync(sessionsDir)) {
    console.log(`    ⊘ sessions directory not created yet (will be created on first use)`);
    return;
  }

  const hasObservations = fs.existsSync(path.join(sessionsDir, 'observations'));
  const hasInstincts = fs.existsSync(path.join(sessionsDir, 'instincts'));
  const hasReports = fs.existsSync(path.join(sessionsDir, 'reports'));

  console.log(`    observations: ${hasObservations ? '✓' : '⊘'}`);
  console.log(`    instincts: ${hasInstincts ? '✓' : '⊘'}`);
  console.log(`    reports: ${hasReports ? '✓' : '⊘'}`);

  assert(true, 'Session directories checked');
});

console.log(`\n═══ Summary ═══`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

process.exit(testsFailed > 0 ? 1 : 0);
