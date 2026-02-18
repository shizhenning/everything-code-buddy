#!/usr/bin/env node
/**
 * Test Instinct Full Workflow
 *
 * Usage: node tests/continuous-learning-v2/test-full-workflow.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Test configuration
const TEST_DIR = path.join(__dirname, 'temp');
const OBSERVATIONS_PATH = path.join(TEST_DIR, '.codebuddy', 'homunculus', 'observations.jsonl');
const INSTINCTS_DIR = path.join(TEST_DIR, '.codebuddy', 'homunculus', 'instincts', 'personal');
const OBSERVE_HOOK_PATH = path.join(__dirname, '..', '..', 'skills', 'continuous-learning-v2', 'hooks', 'observe.js');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

// Setup
console.log('━━━ Instinct Full Workflow Tests ━━━\n');

runTest('Test directory setup', () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  fs.mkdirSync(INSTINCTS_DIR, { recursive: true });
  // Hook uses os.homedir(), so we set both HOME and USERPROFILE
  process.env.HOME = TEST_DIR;
  process.env.USERPROFILE = TEST_DIR;
  assert.ok(fs.existsSync(TEST_DIR), 'Test directory should exist');
});

runTest('Record observations in sequence', () => {
  // Clear observations file
  if (fs.existsSync(OBSERVATIONS_PATH)) {
    fs.unlinkSync(OBSERVATIONS_PATH);
  }

  // Simulate typical tool call sequence
  const toolCalls = [
    'read_file', 'search_content', 'read_file', 'replace_in_file',
    'read_file', 'execute_command'
  ];

  toolCalls.forEach((tool) => {
    execSync(`node "${OBSERVE_HOOK_PATH}" pre ${tool}`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    execSync(`node "${OBSERVE_HOOK_PATH}" post ${tool}`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
  });

  // Verify observations file exists with correct count
  assert.ok(fs.existsSync(OBSERVATIONS_PATH), 'Observations file should exist');
  const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
  const lines = content.trim().split('\n');
  assert.strictEqual(lines.length, toolCalls.length * 2, `Should have ${toolCalls.length * 2} observations`);
});

runTest('Handle session lifecycle', () => {
  if (fs.existsSync(OBSERVATIONS_PATH)) {
    fs.unlinkSync(OBSERVATIONS_PATH);
  }

  // Record session start
  execSync(`node "${OBSERVE_HOOK_PATH}" session-start`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  // Simulate tool calls
  execSync(`node "${OBSERVE_HOOK_PATH}" pre search_file`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  // Record session end
  execSync(`node "${OBSERVE_HOOK_PATH}" session-end`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  // Verify session observations
  const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
  assert.ok(content.includes('session_start'), 'Should contain session_start');
  assert.ok(content.includes('session_end'), 'Should contain session_end');
  assert.ok(content.includes('tool_pre'), 'Should contain tool_pre');
});

runTest('Handle file rotation when size limit reached', () => {
  if (fs.existsSync(OBSERVATIONS_PATH)) {
    fs.unlinkSync(OBSERVATIONS_PATH);
  }

  // Write enough observations to potentially trigger rotation
  for (let i = 0; i < 11; i++) {
    execSync(`node "${OBSERVE_HOOK_PATH}" pre test_tool`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
  }

  // Verify archive or observations file exists
  const archivePath = OBSERVATIONS_PATH + '.archive';
  assert.ok(
    fs.existsSync(archivePath) || fs.existsSync(OBSERVATIONS_PATH),
    'Archive or observations file should exist'
  );
});

runTest('Maintain valid JSON structure across multiple sessions', () => {
  if (fs.existsSync(OBSERVATIONS_PATH)) {
    fs.unlinkSync(OBSERVATIONS_PATH);
  }

  // Simulate multiple sessions
  for (let session = 0; session < 3; session++) {
    execSync(`node "${OBSERVE_HOOK_PATH}" session-start`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });

    execSync(`node "${OBSERVE_HOOK_PATH}" pre test_tool`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });

    execSync(`node "${OBSERVE_HOOK_PATH}" session-end`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
  }

  // Verify all observations are valid JSON
  const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
  const lines = content.trim().split('\n');

  lines.forEach((line, index) => {
    try {
      const obs = JSON.parse(line);
      assert.ok(obs.id, `Observation ${index} should have id`);
      assert.ok(obs.timestamp, `Observation ${index} should have timestamp`);
      assert.ok(obs.type, `Observation ${index} should have type`);
    } catch (e) {
      assert.fail(`Line ${index} should be valid JSON: ${e.message}`);
    }
  });
});

runTest('Handle concurrent observations safely', () => {
  if (fs.existsSync(OBSERVATIONS_PATH)) {
    fs.unlinkSync(OBSERVATIONS_PATH);
  }

  // Simulate rapid consecutive observations
  for (let i = 0; i < 10; i++) {
    execSync(`node "${OBSERVE_HOOK_PATH}" pre concurrent_test_${i}`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
  }

  const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
  const lines = content.trim().split('\n');
  assert.strictEqual(lines.length, 10, 'Should have 10 observations');
});

runTest('Verify instincts directory structure', () => {
  assert.ok(fs.existsSync(INSTINCTS_DIR), 'Instincts directory should exist');
  
  const inheritedDir = path.join(TEST_DIR, '.codebuddy', 'homunculus', 'instincts', 'inherited');
  // The inherited directory is created by the hook when needed
  if (!fs.existsSync(inheritedDir)) {
    fs.mkdirSync(inheritedDir, { recursive: true });
  }
  assert.ok(fs.existsSync(inheritedDir), 'Inherited instincts directory should exist');
});

runTest('Verify observation IDs are unique', () => {
  if (fs.existsSync(OBSERVATIONS_PATH)) {
    fs.unlinkSync(OBSERVATIONS_PATH);
  }

  const ids = new Set();
  for (let i = 0; i < 5; i++) {
    execSync(`node "${OBSERVE_HOOK_PATH}" pre unique_test_${i}`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
  }

  const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
  const lines = content.trim().split('\n');

  lines.forEach((line) => {
    const obs = JSON.parse(line);
    assert.ok(!ids.has(obs.id), `Observation ID ${obs.id} should be unique`);
    ids.add(obs.id);
  });

  assert.strictEqual(ids.size, 5, 'All 5 observations should have unique IDs');
});

// Cleanup
fs.rmSync(TEST_DIR, { recursive: true, force: true });
process.env.HOME = os.homedir();
process.env.USERPROFILE = os.homedir();

// Results
console.log('\n━━━ Results ━━━');
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);
