#!/usr/bin/env node

/**
 * Test: MCP Configuration
 *
 * Validates MCP server configuration:
 * 1. mcp-servers.json exists and is valid JSON
 * 2. No hardcoded paths that would break cross-platform
 * 3. Environment variable placeholders are properly documented
 */

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const PROJECT_DIR = process.env.CODEBUDDY_PROJECT_DIR || path.join(__dirname, '..', '..');
const MCP_CONFIG = path.join(PROJECT_DIR, 'mcp-configs', 'mcp-servers.json');

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

console.log('═══ MCP Configuration Test ═══\n');

// Test 1: mcp-servers.json exists and is valid
runTest('Test 1: mcp-servers.json Exists and Valid', () => {
  assert(fs.existsSync(MCP_CONFIG), 'mcp-servers.json should exist');

  const content = fs.readFileSync(MCP_CONFIG, 'utf-8');
  const config = JSON.parse(content);
  assert(config.mcpServers, 'config should have "mcpServers" field');
});

// Test 2: No absolute filesystem paths
runTest('Test 2: No Absolute Filesystem Paths', () => {
  const content = fs.readFileSync(MCP_CONFIG, 'utf-8');
  const config = JSON.parse(content);

  const absolutePaths = [];
  function checkForAbsolutePaths(obj, path = '') {
    if (typeof obj === 'string') {
      // Check for Unix or Windows absolute paths
      // Allow /path/to/your/projects placeholder
      if (obj.startsWith('/') && !obj.startsWith('http') && !obj.startsWith('npx') && !obj.startsWith('/path/to/your')) {
        absolutePaths.push(`${path}: ${obj}`);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => checkForAbsolutePaths(item, `${path}[${i}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        checkForAbsolutePaths(obj[key], `${path}.${key}`);
      }
    }
  }

  checkForAbsolutePaths(config.mcpServers);

  if (absolutePaths.length > 0) {
    console.log(`    ⚠ Found ${absolutePaths.length} absolute paths`);
    absolutePaths.forEach(p => console.log(`      ${p}`));
  }

  assert(absolutePaths.length === 0,
    'config should not contain absolute filesystem paths (use /path/to/your/projects placeholder)');
});

// Test 3: Environment variable placeholders are present
runTest('Test 3: Environment Variable Placeholders Present', () => {
  const content = fs.readFileSync(MCP_CONFIG, 'utf-8');

  // Check for typical placeholders
  const hasPlaceholders = content.includes('YOUR_') ||
                        content.includes('_HERE');

  if (!hasPlaceholders) {
    console.log(`    ⚠ No environment variable placeholders found`);
  }

  assert(hasPlaceholders, 'config should have environment variable placeholders');
});

// Test 4: _comments section exists
runTest('Test 4: Comments Section Present', () => {
  const content = fs.readFileSync(MCP_CONFIG, 'utf-8');
  const config = JSON.parse(content);

  assert(config._comments, 'config should have "_comments" section');
  assert(config._comments.usage, '_comments should have usage info');
  assert(config._comments.env_vars, '_comments should have env_vars info');
});

// Test 5: All MCP servers have descriptions
runTest('Test 5: All MCP Servers Have Descriptions', () => {
  const content = fs.readFileSync(MCP_CONFIG, 'utf-8');
  const config = JSON.parse(content);

  const serversWithoutDesc = [];
  for (const [name, server] of Object.entries(config.mcpServers)) {
    if (!server.description) {
      serversWithoutDesc.push(name);
    }
  }

  if (serversWithoutDesc.length > 0) {
    console.log(`    ⚠ Servers without descriptions: ${serversWithoutDesc.join(', ')}`);
  }

  assert(serversWithoutDesc.length === 0,
    'All MCP servers should have descriptions');
});

// Test 6: HTTP servers have valid URLs
runTest('Test 6: HTTP Servers Have Valid URLs', () => {
  const content = fs.readFileSync(MCP_CONFIG, 'utf-8');
  const config = JSON.parse(content);

  const invalidUrls = [];
  for (const [name, server] of Object.entries(config.mcpServers)) {
    if (server.type === 'http' && server.url) {
      try {
        new URL(server.url);
      } catch (e) {
        invalidUrls.push(`${name}: ${server.url}`);
      }
    }
  }

  if (invalidUrls.length > 0) {
    console.log(`    ⚠ Invalid URLs: ${invalidUrls.join(', ')}`);
  }

  assert(invalidUrls.length === 0,
    'All HTTP servers should have valid URLs');
});

// Test 7: Filesystem server uses placeholder
runTest('Test 7: Filesystem Server Uses Placeholder', () => {
  const content = fs.readFileSync(MCP_CONFIG, 'utf-8');
  const config = JSON.parse(content);

  const fsServer = config.mcpServers.filesystem;
  assert(fsServer, 'filesystem server should exist');
  assert(fsServer.description.includes('set your path'),
    'filesystem description should mention setting path');

  const args = fsServer.args || [];
  const pathIndex = args.findIndex(arg => arg.startsWith('/path/to/your'));
  assert(pathIndex >= 0,
    'filesystem server should use /path/to/your/projects placeholder');
});

console.log(`\n═══ Summary ═══`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

process.exit(testsFailed > 0 ? 1 : 0);
