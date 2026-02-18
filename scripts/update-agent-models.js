#!/usr/bin/env node

/**
 * 更新 Agents 的 Model ID
 * 将 Claude Code 格式的模型 ID 转换为 CodeBuddy 格式
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const AGENTS_DIR = path.join(PROJECT_ROOT, 'agents');

console.log('🔄 Updating Agent model IDs...\n');

// 模型 ID 映射
const MODEL_MAPPING = {
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet',
  'claude-3-5-haiku-20241022': 'claude-3-5-haiku',
  'claude-3-opus-20240229': 'claude-3-opus',
};

// 批处理文件替换（避免多次读写）
const MODEL_REPLACEMENTS = Object.entries(MODEL_MAPPING);

// 获取所有 agent 文件
const agentFiles = fs.readdirSync(AGENTS_DIR)
  .filter(file => file.endsWith('.md'));

console.log(`Found ${agentFiles.length} agent files\n`);

let updatedCount = 0;
let skippedCount = 0;

for (const filename of agentFiles) {
  const filepath = path.join(AGENTS_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf-8');
  let modified = false;

  // 替换所有匹配的模型 ID
  for (const [oldModel, newModel] of MODEL_REPLACEMENTS) {
    if (content.includes(oldModel)) {
      content = content.replace(new RegExp(oldModel, 'g'), newModel);
      modified = true;
      console.log(`  📝 ${filename}: ${oldModel} → ${newModel}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    updatedCount++;
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
  console.log('\n✨ Agent model IDs updated successfully!\n');
} else {
  console.log('\n✨ All agents already use correct model IDs!\n');
}
