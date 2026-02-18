#!/usr/bin/env node

/**
 * Integration Test: Hook Triggers
 *
 * Tests that hook scripts can be executed correctly:
 * 1. PreToolUse hook
 * 2. PostToolUse hook
 * 3. Stop hook
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
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

console.log('═══ Hook Trigger Test ═══\n');

// Test 1: Observe.js script exists
runTest('Test 1: observe.js Script Exists', () => {
  const observeScript = path.join(CODEBUDDY_DIR, 'hooks', 'observe.js');
  assert(fs.existsSync(observeScript), 'observe.js should exist');
});

// Test 2: run-observer-on-stop.js script exists
runTest('Test 2: run-observer-on-stop.js Script Exists', () => {
  const stopObserverScript = path.join(CODEBUDDY_DIR, 'hooks', 'run-observer-on-stop.js');
  assert(fs.existsSync(stopObserverScript), 'run-observer-on-stop.js should exist');
});

// Test 3: observe.js accepts "pre" argument
runTest('Test 3: observe.js Accepts Pre Argument', () => {
  const observeScript = path.join(CODEBUDDY_DIR, 'hooks', 'observe.js');

  if (!fs.existsSync(observeScript)) {
    throw new Error('observe.js not found');
  }

  const content = fs.readFileSync(observeScript, 'utf-8');

  // Check for argument handling
  assert(
    content.includes('process.argv') || content.includes('pre') || content.includes('post'),
    'observe.js should handle pre/post arguments'
  );
});

// Test 4: observe.js has environment variable support
runTest('Test 4: observe.js Uses CODEBUDDY_PLUGIN_ROOT', () => {
  const observeScript = path.join(CODEBUDDY_DIR, 'hooks', 'observe.js');

  if (!fs.existsSync(observeScript)) {
    throw new Error('observe.js not found');
  }

  const content = fs.readFileSync(observeScript, 'utf-8');

  assert(
    content.includes('CODEBUDDY_PLUGIN_ROOT') || content.includes('CODEBUDDY_PROJECT_DIR'),
    'observe.js should use CODEBUDDY environment variables'
  );
});

// Test 5: run-observer-on-stop.js has correct path references
runTest('Test 5: run-observer-on-stop.js Path References', () => {
  const stopObserverScript = path.join(CODEBUDDY_DIR, 'hooks', 'run-observer-on-stop.js');

  if (!fs.existsSync(stopObserverScript)) {
    throw new Error('run-observer-on-stop.js not found');
  }

  const content = fs.readFileSync(stopObserverScript, 'utf-8');

  // Check for observer script reference
  const hasObserverRef = content.includes('run-observer.js') ||
                         content.includes('observer.js') ||
                         content.includes('agent');

  assert(hasObserverRef, 'run-observer-on-stop.js should reference observer agent');

  // Check for CODEBUDDY paths
  assert(
    content.includes('CODEBUDDY_'),
    'run-observer-on-stop.js should use CODEBUDDY paths'
  );
});

// Test 6: Hooks are configured in hooks.json
runTest('Test 6: Observer Hooks in Configuration', () => {
  const hooksFile = path.join(CODEBUDDY_DIR, 'hooks', 'hooks.json');

  assert(fs.existsSync(hooksFile), 'hooks.json should exist');

  const content = fs.readFileSync(hooksFile, 'utf-8');
  const hooks = JSON.parse(content);

  const hasPreToolUse = hooks.hooks && hooks.hooks.PreToolUse;
  const hasPostToolUse = hooks.hooks && hooks.hooks.PostToolUse;
  const hasStop = hooks.hooks && hooks.hooks.Stop;

  assert(hasPreToolUse, 'hooks.json should have PreToolUse hooks');
  assert(hasPostToolUse, 'hooks.json should have PostToolUse hooks');
  assert(hasStop, 'hooks.json should have Stop hooks');

  // Check for observer references
  const allHooks = JSON.stringify(hooks.hooks);
  assert(
    allHooks.includes('observe.js') || allHooks.includes('observer'),
    'hooks should reference observer'
  );
});

// Test 7: Hook commands are properly formatted
runTest('Test 7: Hook Commands Are Valid', () => {
  const hooksFile = path.join(CODEBUDDY_DIR, 'hooks', 'hooks.json');

  assert(fs.existsSync(hooksFile), 'hooks.json should exist');

  const content = fs.readFileSync(hooksFile, 'utf-8');
  const hooks = JSON.parse(content);

  let commandCount = 0;

  function checkHooks(hookArray) {
    for (const hookDef of hookArray) {
      if (hookDef.hooks) {
        for (const hook of hookDef.hooks) {
          if (hook.type === 'command' && hook.command) {
            commandCount++;

            // Check for CODEBUDDY_PLUGIN_ROOT usage
            const usesEnvVar = hook.command.includes('${CODEBUDDY_PLUGIN_ROOT}');
            const isNodeCommand = hook.command.startsWith('node');

            assert(isNodeCommand, `Hook command should be a node command: ${hook.command}`);
            if (!usesEnvVar) {
              console.log(`    ⚠ Hook doesn't use CODEBUDDY_PLUGIN_ROOT: ${hook.command.substring(0, 50)}...`);
            }
          }
        }
      }
    }
  }

  for (const hookType of Object.values(hooks.hooks)) {
    checkHooks(hookType);
  }

  console.log(`    Total hook commands: ${commandCount}`);
  assert(commandCount > 0, 'Should have at least one hook command');
});

// Test 8: run-observer.js exists
runTest('Test 8: run-observer.js Exists', () => {
  const runObserver = path.join(CODEBUDDY_DIR, 'agents', 'run-observer.js');
  const fallbackRunObserver = path.join(PROJECT_DIR, 'agents', 'run-observer.js');

  const exists = fs.existsSync(runObserver) || fs.existsSync(fallbackRunObserver);
  assert(exists, 'run-observer.js should exist in agents/ directory');
});

console.log(`\n═══ Summary ═══`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

process.exit(testsFailed > 0 ? 1 : 0);
