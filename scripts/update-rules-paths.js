#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RULES_DIR = path.join(__dirname, '..', 'rules');

// 路径替换规则
const PATH_REPLACEMENTS = [
  { old: '~/.codebuddy/', new: '~/.codebuddy/' },
  { old: '.codebuddy/', new: '.codebuddy/' },
  { old: '~/.codebuddy', new: '~/.codebuddy' },
  { old: '${CODEBUDDY_', new: '${CODEBUDDY_' },
];

function updateRuleFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  let modified = false;

  for (const { old, new: newPath } of PATH_REPLACEMENTS) {
    if (content.includes(old)) {
      content = content.split(old).join(newPath);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    const relativePath = path.relative(__dirname, filepath);
    console.log(`✓ Updated: ${relativePath}`);
  }

  return modified;
}

function getAllRuleFiles(dir) {
  const files = [];

  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scan(path.join(currentDir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(currentDir, entry.name));
      }
    }
  }

  scan(dir);
  return files;
}

// 执行更新
console.log('🔧 Updating rules files...\n');

const allFiles = getAllRuleFiles(RULES_DIR);
let updatedCount = 0;

for (const filepath of allFiles) {
  if (updateRuleFile(filepath)) {
    updatedCount++;
  }
}

console.log(`\n✅ Updated ${updatedCount} rule files`);
