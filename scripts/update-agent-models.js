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
// 将当前国产模型映射为更合理的目标模型
const MODEL_MAPPING = {
  // DeepSeek V3.2 → Kimi Thinking（复杂推理场景）
  'deepseek-v3.2': 'kimi-k2-Thinking',

  // GLM-5.0 → DeepSeek V3.2（代码场景更优）
  'glm-5.0': 'deepseek-v3.2',

  // GLM-4.7 → GLM-4.6（轻量快速场景）
  'glm-4.7': 'glm-4.6',
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
