#!/usr/bin/env node

/**
 * 将 commands 中的 .claude 替换为 .codebuddy
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands');

console.log('🔄 Updating commands paths...\n');

// 路径替换映射
const PATH_REPLACEMENTS = [
  { old: '~/.claude/', new: '~/.codebuddy/' },
  { old: '${CLAUDE_PLUGIN_ROOT}', new: '${CODEBUDDY_PLUGIN_ROOT}' },
  { old: '.claude/', new: '.codebuddy/' },
];

// 获取所有 command 文件
const commandFiles = fs.readdirSync(COMMANDS_DIR)
  .filter(file => file.endsWith('.md'));

console.log(`Found ${commandFiles.length} command files\n`);

let updatedCount = 0;
let skippedCount = 0;

for (const filename of commandFiles) {
  const filepath = path.join(COMMANDS_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf-8');
  let modified = false;

  // 替换所有路径引用
  for (const item of PATH_REPLACEMENTS) {
    const { old, new: newPath } = item;
    if (content.includes(old)) {
      content = content.split(old).join(newPath);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    updatedCount++;
    console.log(`  📝 ${filename}`);
  } else {
    skippedCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`📊 Summary:`);
console.log(`   ✅ Updated: ${updatedCount}`);
console.log(`   ⏭️  Skipped: ${skippedCount}`);
console.log(`   📁 Total: ${commandFiles.length}`);
console.log('='.repeat(60));

if (updatedCount > 0) {
  console.log('\n✨ Command paths updated successfully!\n');
} else {
  console.log('\n✨ All commands already use correct paths!\n');
}
