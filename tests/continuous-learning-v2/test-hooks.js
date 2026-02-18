#!/usr/bin/env node
/**
 * Test Instinct Hooks functionality
 *
 * Usage: node tests/continuous-learning-v2/test-hooks.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Test configuration
const TEST_DIR = path.join(__dirname, 'temp');
const OBSERVATIONS_PATH = path.join(TEST_DIR, '.codebuddy', 'homunculus', 'observations.jsonl');
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
console.log('━━━ Instinct Hooks Tests ━━━\n');

runTest('Test directory setup', () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  // Hook uses os.homedir(), so we set both HOME and USERPROFILE
  process.env.HOME = TEST_DIR;
  process.env.USERPROFILE = TEST_DIR;
  assert.ok(fs.existsSync(TEST_DIR), 'Test directory should exist');
});

runTest('Record pre-tool observation', () => {
  const output = execSync(`node "${OBSERVE_HOOK_PATH}" pre read_file`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  assert.ok(output.includes('tool_pre'), 'Output should contain tool_pre');
  assert.ok(fs.existsSync(OBSERVATIONS_PATH), 'Observations file should be created');
});

runTest('Record post-tool observation', () => {
  const output = execSync(`node "${OBSERVE_HOOK_PATH}" post read_file`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  assert.ok(output.includes('tool_post'), 'Output should contain tool_post');
});

runTest('Handle session-start', () => {
  const output = execSync(`node "${OBSERVE_HOOK_PATH}" session-start`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  assert.ok(output.includes('session_start'), 'Output should contain session_start');
});

runTest('Handle session-end', () => {
  const output = execSync(`node "${OBSERVE_HOOK_PATH}" session-end`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  assert.ok(output.includes('session_end'), 'Output should contain session_end');
});

runTest('Store valid JSON in observations file', () => {
  // Run multiple observations
  execSync(`node "${OBSERVE_HOOK_PATH}" pre test_tool`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });
  execSync(`node "${OBSERVE_HOOK_PATH}" post test_tool`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
  const lines = content.trim().split('\n');

  // Verify each line is valid JSON
  lines.forEach((line, index) => {
    assert.ok(line, `Line ${index} should not be empty`);
    const obs = JSON.parse(line);
    assert.ok(obs.id, 'Observation should have id');
    assert.ok(obs.timestamp, 'Observation should have timestamp');
    assert.ok(obs.type, 'Observation should have type');
  });
});

runTest('Handle unknown action gracefully', () => {
  try {
    execSync(`node "${OBSERVE_HOOK_PATH}" unknown_action`, {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe']
    });
    assert.fail('Should throw error for unknown action');
  } catch (error) {
    assert.ok(error.status === 1, 'Should exit with code 1');
  }
});

runTest('Preserve metadata in observations', () => {
  execSync(`node "${OBSERVE_HOOK_PATH}" pre metadata_test`, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  const content = fs.readFileSync(OBSERVATIONS_PATH, 'utf8');
  const lines = content.trim().split('\n');
  const obs = JSON.parse(lines[lines.length - 1]);

  assert.ok(obs._meta, 'Observation should have _meta');
  assert.ok(obs._meta.pid, 'Metadata should have pid');
  assert.ok(obs._meta.platform, 'Metadata should have platform');
  assert.ok(obs._meta.node_version, 'Metadata should have node_version');
  assert.ok(obs._meta.cwd, 'Metadata should have cwd');
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
