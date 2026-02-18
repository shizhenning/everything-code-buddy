#!/usr/bin/env node

/**
 * 更新 Agents 的 tools 字段为 allowed-tools
 * 将 Claude Code 格式转换为 CodeBuddy 格式
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const AGENTS_DIR = path.join(PROJECT_ROOT, 'agents');

console.log('🔄 Updating agent tools field...\n');

// 获取所有 agent 文件
const agentFiles = fs.readdirSync(AGENTS_DIR)
  .filter(file => file.endsWith('.md'));

console.log(`Found ${agentFiles.length} agent files\n`);

let updatedCount = 0;
let skippedCount = 0;

for (const filename of agentFiles) {
  const filepath = path.join(AGENTS_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf-8');

  // 替换 tools: 为 allowed-tools:
  const oldPattern = /^tools:/gm;
  const newPattern = 'allowed-tools:';

  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newPattern);
    fs.writeFileSync(filepath, content, 'utf-8');
    updatedCount++;
    console.log(`  📝 ${filename}: tools: → allowed-tools:`);
  } else {
    skippedCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`📊 Summary:`);
console.log(`   ✅ Updated: ${updatedCount}`);
console.log(`   ⏭️  Skipped: ${skippedCount}`);
console.log(`   📁 Total: ${agentFiles.length}`);
console.log('='.repeat(60));

if (updatedCount > 0) {
  console.log('\n✨ Agent tools field updated successfully!\n');
} else {
  console.log('\n✨ All agents already use allowed-tools field!\n');
}
