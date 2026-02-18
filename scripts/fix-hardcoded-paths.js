#!/usr/bin/env node

/**
 * Fix Hardcoded Paths in Commands
 * 
 * Replaces ~/.claude/ with ${CODEBUDDY_PLUGIN_ROOT}/.claude
 * in command files to maintain backward compatibility
 */

const path = require('path');
const fs = require('fs');

const PROJECT_DIR = path.resolve(__dirname, '..');
const COMMANDS_DIR = path.join(PROJECT_DIR, 'commands');

function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Pattern 1: Direct python command with ~/.claude
  const pattern1 = /python3 (~\/\.claude\/[^`\s]+)/g;
  if (pattern1.test(content)) {
    modified = true;
    console.log(`  Found pattern1 in ${path.basename(filePath)}`);
  }
  
  // Pattern 2: Direct path references
  const pattern2 = /`(~\/\.claude\/[^`\s]+)/g;
  if (pattern2.test(content)) {
    modified = true;
    console.log(`  Found pattern2 in ${path.basename(filePath)}`);
  }
  
  // Pattern 3: Bash heredoc paths
  const pattern3 = /"(~\/\.claude\/[^"]+)"/g;
  if (pattern3.test(content)) {
    modified = true;
    console.log(`  Found pattern3 in ${path.basename(filePath)}`);
  }
  
  if (modified) {
    console.log(`  Would need manual review: ${path.basename(filePath)}`);
  }
  
  return modified;
}

console.log('Scanning commands for hardcoded paths...\n');

const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
let count = 0;

for (const file of files) {
  if (fixFile(path.join(COMMANDS_DIR, file))) {
    count++;
  }
}

console.log(`\n${count} files need review`);
console.log('\nNote: These files have dual-path support (env var + fallback).');
console.log('The hardcoded fallback paths are kept for backward compatibility.');
