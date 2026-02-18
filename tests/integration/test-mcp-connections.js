#!/usr/bin/env node
/**
 * Test MCP server connections
 * Validates MCP configuration and verifies server metadata
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const utils = require('../../scripts/lib/utils');

const MCP_CONFIG = path.join(__dirname, '..', '..', 'mcp-configs', 'mcp-servers.json');
const CODEBUDDY_DIR = path.join(__dirname, '..', '..', '.codebuddy');

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

function main() {
  console.log('\n═══ MCP Connection Test ═══\n');

  let passed = 0;
  let failed = 0;

  // Test 1: MCP config exists and valid JSON
  if (runTest('Test 1: MCP Config Exists and Valid', () => {
    assert(fs.existsSync(MCP_CONFIG), 'MCP config file should exist');
    const content = fs.readFileSync(MCP_CONFIG, 'utf-8');
    JSON.parse(content); // Valid JSON
  })) {
    passed++;
  } else {
    failed++;
  }

  const mcpConfig = JSON.parse(fs.readFileSync(MCP_CONFIG, 'utf-8'));

  // Test 2: All servers have required fields
  if (runTest('Test 2: All Servers Have Required Fields', () => {
    for (const [name, server] of Object.entries(mcpConfig.mcpServers)) {
      if (server.disabled) continue;
      assert(name, 'Server name should exist');
      assert(server.command || server.url, 'Server should have command or url');
      assert(server.description, 'Server should have description');
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: No hardcoded absolute paths
  if (runTest('Test 3: No Hardcoded Absolute Paths', () => {
    const configStr = JSON.stringify(mcpConfig);
    const absolutePaths = configStr.match(/\s"[\/][^"]+/g) || [];
    assert(absolutePaths.length === 0 || absolutePaths.every(p =>
      p.includes('http') || p.includes('npx') || p.includes('/path/to/your')
    ), 'Should not have hardcoded absolute paths');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: HTTP servers have valid URLs
  if (runTest('Test 4: HTTP Servers Have Valid URLs', () => {
    for (const [name, server] of Object.entries(mcpConfig.mcpServers)) {
      if (server.url && !server.disabled) {
        assert(server.url.startsWith('http'), 'URL should start with http');
        assert(server.description.length > 0, 'Description should not be empty');
      }
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Filesystem servers use placeholders
  if (runTest('Test 5: Filesystem Servers Use Placeholders', () => {
    for (const [name, server] of Object.entries(mcpConfig.mcpServers)) {
      if (server.command && server.command.includes('npx')) {
        const args = server.command;
        if (args.includes('/path/to')) {
          assert(args.includes('${') || args.includes('/path/to/your'),
            'Should use environment variable or placeholder');
        }
      }
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: Comments section exists
  if (runTest('Test 6: Comments Section Present', () => {
    assert(mcpConfig._comments, 'Should have _comments section');
    assert(typeof mcpConfig._comments === 'object', '_comments should be an object');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: Environment variables are documented
  if (runTest('Test 7: Environment Variables Documented', () => {
    const configStr = JSON.stringify(mcpConfig);
    const envVars = configStr.match(/\$\{[A-Z_]+\}/g) || [];
    const commentsStr = JSON.stringify(mcpConfig._comments);
    for (const envVar of envVars) {
      const varName = envVar.replace(/\$\{|\}/g, '');
      if (varName.includes('_HERE')) {
        assert(commentsStr.includes(varName), `Environment variable ${varVar} should be documented`);
      }
    }
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: Comments section exists and is informative
  if (runTest('Test 8: Comments Section Informative', () => {
    assert(mcpConfig._comments, 'Should have _comments section');
    assert(mcpConfig._comments.length > 0 || typeof mcpConfig._comments === 'object',
      'Should have comments object or array');
    const commentKeys = Object.keys(mcpConfig._comments);
    assert(commentKeys.length > 0, 'Should have at least one comment key');
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

module.exports = { runTest };
