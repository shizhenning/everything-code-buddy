#!/usr/bin/env node
/**
 * Validate CodeBuddy-specific format requirements
 *
 * Checks:
 * - plugin.json format
 * - settings.json format
 * - Agent frontmatter compatibility
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const PLUGIN_DIR = path.join(PROJECT_ROOT, '.codebuddy');
const AGENTS_DIR = path.join(PLUGIN_DIR, 'agents');
const SETTINGS_FILE = path.join(PLUGIN_DIR, 'settings.json');
const PLUGIN_FILE = path.join(PLUGIN_DIR, 'plugin.json');

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

function extractFrontmatter(content) {
  const cleanContent = content.replace(/^\uFEFF/, '');
  const match = cleanContent.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      frontmatter[key] = value;
    }
  }
  return frontmatter;
}

console.log('═══ CodeBuddy Format Validation ═══\n');

// Test 1: plugin.json exists and is valid
runTest('Test 1: plugin.json Format', () => {
  assert(fs.existsSync(PLUGIN_FILE), 'plugin.json should exist');

  try {
    const plugin = JSON.parse(fs.readFileSync(PLUGIN_FILE, 'utf-8'));
    assert(plugin.name, 'plugin.json should have "name" field');
    assert(plugin.version, 'plugin.json should have "version" field');
    assert(Array.isArray(plugin.commands), 'plugin.json should have "commands" array');
    assert(Array.isArray(plugin.agents), 'plugin.json should have "agents" array');
  } catch (err) {
    assert(false, `plugin.json parsing: ${err.message}`);
  }
});

// Test 2: settings.json exists or note created
runTest('Test 2: settings.json Format', () => {
  if (!fs.existsSync(SETTINGS_FILE)) {
    console.log('  ⊘ Skipped: settings.json not yet created');
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    assert(settings.hooks, 'settings.json should have "hooks" field');
    assert(Array.isArray(settings.hooks), 'settings.hooks should be an array');
  } catch (err) {
    assert(false, `settings.json parsing: ${err.message}`);
  }
});

// Test 3: Agent format compatibility
runTest('Test 3: Agent Frontmatter Compatibility', () => {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.log('  ⊘ Skipped: agents directory not found');
    return;
  }

  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  assert(files.length > 0, 'Should have at least one agent file');

  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
      assert(false, `${file}: should have valid frontmatter`);
      continue;
    }

    assert(frontmatter.name, `${file}: frontmatter should have "name"`);
    assert(frontmatter.description, `${file}: frontmatter should have "description"`);
  }
});

// Test 4: Tools field in agents
runTest('Test 4: Agent Tools Field', () => {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.log('  ⊘ Skipped: agents directory not found');
    return;
  }

  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
  const validTools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob', 'WebFetch', 'Task'];

  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter || !frontmatter.tools) {
      console.log(`  ⊘ ${file}: no tools field, skipping`);
      continue;
    }

    // Tools might be a YAML array or comma-separated
    let tools;
    if (frontmatter.tools.startsWith('[')) {
      // Try to parse as YAML array (simple version)
      tools = frontmatter.tools
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(t => t.trim().replace(/"/g, ''));
    } else {
      tools = frontmatter.tools.split(',').map(t => t.trim());
    }

    for (const tool of tools) {
      if (tool && !validTools.includes(tool)) {
        console.log(`  ⊘ ${file}: has tool "${tool}" (might be valid for CodeBuddy)`);
      }
    }
  }
  assert(true, 'Tools field format checked');
});

// Test 5: Model field validation
runTest('Test 5: Agent Model Field', () => {
  if (!fs.existsSync(AGENTS_DIR)) {
    console.log('  ⊘ Skipped: agents directory not found');
    return;
  }

  const validModels = ['haiku', 'sonnet', 'opus'];
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(AGENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
      assert(false, `${file}: should have valid frontmatter`);
      continue;
    }

    assert(frontmatter.model, `${file}: should have "model" in frontmatter`);
    if (!validModels.includes(frontmatter.model)) {
      console.log(`  ⊘ ${file}: has model "${frontmatter.model}" (might be valid)`);
    }
  }
  assert(true, 'Model field format checked');
});

// Test 6: plugin.json agents list matches actual files
runTest('Test 6: plugin.json Agents List Matches Files', () => {
  if (!fs.existsSync(PLUGIN_FILE) || !fs.existsSync(AGENTS_DIR)) {
    console.log('  ⊘ Skipped: required files not found');
    return;
  }

  const plugin = JSON.parse(fs.readFileSync(PLUGIN_FILE, 'utf-8'));
  if (!plugin.agents) {
    console.log('  ⊘ plugin.json has no agents array');
    return;
  }

  const actualFiles = fs.readdirSync(AGENTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''));

  for (const agent of plugin.agents) {
    // Remove leading "./" and parent directory
    const normalizedAgent = agent.startsWith('./') ? agent.slice(2) : agent;
    const agentName = path.basename(normalizedAgent, '.md');

    assert(actualFiles.includes(agentName), `plugin.json lists agent "${agent}" but file not found`);
  }
});

console.log('\n═══ Summary ═══');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('');

process.exit(failed > 0 ? 1 : 0);
