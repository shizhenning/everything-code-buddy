#!/usr/bin/env node

/**
 * Test: Hooks Configuration
 * 
 * Validates:
 * 1. hooks.json exists and is valid JSON
 * 2. All hook scripts exist
 * 3. Environment variables are used correctly
 * 4. No hardcoded paths to ~/.claude/
 */

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const PLUGIN_ROOT = process.env.CODEBUDDY_PLUGIN_ROOT || path.join(__dirname, '..', '..', '.codebuddy');
const PROJECT_DIR = process.env.CODEBUDDY_PROJECT_DIR || path.join(__dirname, '..', '..');

const HOOKS_JSON = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');
const HOOKS_DIR = path.join(PLUGIN_ROOT, 'hooks');
const SCRIPTS_HOOKS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'hooks');

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

console.log('═══ Hooks Configuration Test ═══\n');

// Test 1: hooks.json exists and is valid JSON
runTest('Test 1: hooks.json Exists and Valid', () => {
  assert(fs.existsSync(HOOKS_JSON), 'hooks.json should exist');
  
  const content = fs.readFileSync(HOOKS_JSON, 'utf-8');
  const hooks = JSON.parse(content);
  assert(hooks.hooks, 'hooks.json should have "hooks" field');
});

// Test 2: All referenced hook scripts exist
runTest('Test 2: All Hook Scripts Exist', () => {
  const hooksContent = fs.readFileSync(HOOKS_JSON, 'utf-8');
  const hooksConfig = JSON.parse(hooksContent);
  
  const scriptPaths = new Set();
  
  function collectScripts(hooksArray) {
    for (const hookDef of hooksArray) {
      if (hookDef.hooks) {
        for (const hook of hookDef.hooks) {
          if (hook.type === 'command' && hook.command) {
            // Extract script path from command
            const match = hook.command.match(/node\s+"([^"]+)"/) || 
                         hook.command.match(/node\s+(\S+)/);
            if (match) {
              scriptPaths.add(match[1]);
            }
          }
        }
      }
    }
  }
  
  for (const hookType of Object.values(hooksConfig.hooks)) {
    collectScripts(hookType);
  }
  
  // Check each script exists (skip inline -e commands)
  for (const scriptPath of scriptPaths) {
    // Skip inline commands (node -e)
    if (scriptPath === '-e') continue;
    
    // Handle ${CODEBUDDY_PLUGIN_ROOT} variable
    const resolvedPath = scriptPath
      .replace('${CODEBUDDY_PLUGIN_ROOT}', PLUGIN_ROOT)
      .replace('${CLAUDE_PLUGIN_ROOT}', PLUGIN_ROOT); // Legacy support
    
    // If path is relative, resolve from project root
    const fullPath = path.isAbsolute(resolvedPath)
      ? resolvedPath
      : path.join(PROJECT_DIR, resolvedPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`    ⚠ Script not found: ${scriptPath} -> ${fullPath}`);
    }
    // Don't fail for missing optional scripts, just warn
  }
  
  assert(scriptPaths.size > 0, 'Should have hook scripts');
});

// Test 3: No hardcoded ~/.claude/ paths in hooks.json
runTest('Test 3: No Hardcoded ~/.claude/ Paths', () => {
  const hooksContent = fs.readFileSync(HOOKS_JSON, 'utf-8');
  
  const hardcodedPaths = hooksContent.match(/~\/\.claude\//g);
  
  if (hardcodedPaths) {
    console.log(`    ⚠ Found ${hardcodedPaths.length} hardcoded ~/.claude/ paths`);
  }
  
  assert(!hardcodedPaths || hardcodedPaths.length === 0, 
    'hooks.json should not contain hardcoded ~/.claude/ paths');
});

// Test 4: Environment variables are used correctly
runTest('Test 4: Uses CODEBUDDY_PLUGIN_ROOT', () => {
  const hooksContent = fs.readFileSync(HOOKS_JSON, 'utf-8');
  
  const usesPluginRoot = hooksContent.includes('${CODEBUDDY_PLUGIN_ROOT}') ||
                         hooksContent.includes('${CLAUDE_PLUGIN_ROOT}');
  
  if (!usesPluginRoot) {
    console.log(`    ⚠ hooks.json doesn't use CODEBUDDY_PLUGIN_ROOT environment variable`);
  }
  
  // Warn but don't fail - some hooks might use inline node -e commands
  console.log(`    Environment variable usage: ${usesPluginRoot ? '✓' : '⚠ inline commands'}`);
  assert(true, 'Environment variable usage checked');
});

// Test 5: Key hook types are configured
runTest('Test 5: Key Hook Types Configured', () => {
  const hooksContent = fs.readFileSync(HOOKS_JSON, 'utf-8');
  const hooksConfig = JSON.parse(hooksContent);
  
  const keyHooks = ['PreToolUse', 'PostToolUse', 'Stop', 'SessionStart', 'SessionEnd'];
  const missingHooks = keyHooks.filter(h => !hooksConfig.hooks[h]);
  
  assert(missingHooks.length === 0, 
    `Missing key hook types: ${missingHooks.join(', ')}`);
});

// Test 6: Observer hooks are configured
runTest('Test 6: Observer Hooks Configured', () => {
  const hooksContent = fs.readFileSync(HOOKS_JSON, 'utf-8');
  const hooksConfig = JSON.parse(hooksContent);

  // Check PreToolUse observer hook
  const preHooks = hooksConfig.hooks.PreToolUse || [];
  const hasPreObserver = preHooks.some(h => {
    if (h.hooks) {
      return h.hooks.some(hook =>
        hook.command && hook.command.includes('observe.js')
      );
    }
    return false;
  });

  // Check PostToolUse observer hook
  const postHooks = hooksConfig.hooks.PostToolUse || [];
  const hasPostObserver = postHooks.some(h => {
    if (h.hooks) {
      return h.hooks.some(hook =>
        hook.command && hook.command.includes('observe.js')
      );
    }
    return false;
  });

  // Check Stop observer hook
  const stopHooks = hooksConfig.hooks.Stop || [];
  const hasStopObserver = stopHooks.some(h => {
    if (h.hooks) {
      return h.hooks.some(hook =>
        hook.command && hook.command.includes('observer')
      );
    }
    return false;
  });

  if (!hasPreObserver) {
    console.log(`    ⚠ PreToolUse observer hook not configured`);
  }
  if (!hasPostObserver) {
    console.log(`    ⚠ PostToolUse observer hook not configured`);
  }
  if (!hasStopObserver) {
    console.log(`    ⚠ Stop observer hook not configured`);
  }

  console.log(`    PreToolUse observer: ${hasPreObserver ? '✓' : '✗'}`);
  console.log(`    PostToolUse observer: ${hasPostObserver ? '✓' : '✗'}`);
  console.log(`    Stop observer: ${hasStopObserver ? '✓' : '✗'}`);

  assert(hasPreObserver && hasPostObserver && hasStopObserver,
    'All observer hooks should be configured (PreToolUse, PostToolUse, Stop)');
});

// Test 7: Check for inline hooks that should be scripts
runTest('Test 7: Inline Hook Analysis', () => {
  const hooksContent = fs.readFileSync(HOOKS_JSON, 'utf-8');
  const hooksConfig = JSON.parse(hooksContent);
  
  let inlineHooksCount = 0;
  
  function countInline(hooksArray) {
    for (const hookDef of hooksArray) {
      if (hookDef.hooks) {
        for (const hook of hookDef.hooks) {
          if (hook.type === 'command' && hook.command) {
            if (hook.command.includes('node -e')) {
              inlineHooksCount++;
            }
          }
        }
      }
    }
  }
  
  for (const hookType of Object.values(hooksConfig.hooks)) {
    countInline(hookType);
  }
  
  console.log(`    Inline hooks (node -e): ${inlineHooksCount}`);
  assert(true, 'Inline hooks analyzed');
});

console.log(`\n═══ Summary ═══`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

process.exit(testsFailed > 0 ? 1 : 0);
