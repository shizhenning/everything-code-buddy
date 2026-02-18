#!/usr/bin/env node
/**
 * Test agent delegation capabilities
 * Validates agent definitions, tool access, and workflow integration
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const AGENTS_DIR = path.join(__dirname, '..', '..', 'agents');
const CODEBUDDY_AGENTS_DIR = path.join(__dirname, '..', '..', '.codebuddy', 'agents');
const PLUGIN_JSON = path.join(__dirname, '..', '..', '.codebuddy', 'plugin.json');

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

function parseAgentFile(content) {
  // Handle both CRLF and LF line endings
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const metadata = {};
  frontmatter.split(/\r?\n/).forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key) {
        metadata[key] = value;
      }
    }
  });
  return metadata;
}

function main() {
  console.log('\n═══ Agent Delegation Test ═══\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Agent files exist with valid YAML frontmatter
  if (runTest('Test 1: Agent Files Have Valid Frontmatter', () => {
    const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
    assert(agentFiles.length > 0, 'Should have at least one agent');

    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      const metadata = parseAgentFile(content);
      assert(metadata, `${file} should have valid YAML frontmatter`);
      assert(metadata.name, `${file} should have name field`);
      assert(metadata.description, `${file} should have description field`);
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Plugin JSON has agents section
  if (runTest('Test 2: Plugin JSON Has Agents Section', () => {
    assert(fs.existsSync(PLUGIN_JSON), 'plugin.json should exist');
    const pluginConfig = JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf-8'));

    // Agents section exists (may be partial, only special agents listed)
    assert(pluginConfig.agents, 'Should have agents section');
    assert(Array.isArray(pluginConfig.agents), 'agents should be an array');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Critical agents are present
  if (runTest('Test 3: Critical Agents Present', () => {
    const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
    const criticalAgents = ['planner', 'architect', 'code-reviewer', 'tdd-guide'];

    for (const agentName of criticalAgents) {
      const exists = agentFiles.includes(`${agentName}.md`);
      assert(exists, `Critical agent ${agentName} should exist`);
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Observer agent exists in CodeBuddy
  if (runTest('Test 4: Observer Agent Exists', () => {
    const observerPath = path.join(CODEBUDDY_AGENTS_DIR, 'observer.md');
    assert(fs.existsSync(observerPath), 'observer.md should exist in .codebuddy/agents/');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Agent descriptions are meaningful
  if (runTest('Test 5: Agent Descriptions Are Meaningful', () => {
    const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      const metadata = parseAgentFile(content);
      assert(metadata.description.length > 20, `${file} description should be meaningful`);
      assert(!metadata.description.includes('TODO'), `${file} description should not contain TODO`);
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: Agent models are specified
  if (runTest('Test 6: Agent Models Specified', () => {
    const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      const metadata = parseAgentFile(content);

      if (metadata.model) {
        const validModels = ['haiku', 'sonnet', 'opus'];
        assert(validModels.includes(metadata.model.toLowerCase()),
          `${file} model should be haiku, sonnet, or opus`);
      }
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: Agent file naming follows convention
  if (runTest('Test 7: Agent File Naming Convention', () => {
    const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

    for (const file of agentFiles) {
      const name = file.replace('.md', '');
      assert(/^[a-z][a-z0-9-]*$/.test(name),
        `${file} should use lowercase-hyphenated naming`);
      assert(!name.includes(' '), `${file} should not contain spaces`);
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: No duplicate agent names
  if (runTest('Test 8: No Duplicate Agent Names', () => {
    const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
    const names = [];

    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
      const metadata = parseAgentFile(content);
      names.push(metadata.name);
    }

    const uniqueNames = new Set(names);
    assert(uniqueNames.size === names.length, 'Agent names should be unique');
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

module.exports = { runTest, parseAgentFile };
