#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SKILLS_DIR = path.join(__dirname, '..', 'skills');

// 路径替换规则
const PATH_REPLACEMENTS = [
  { old: '~/.claude/', new: '~/.codebuddy/' },
  { old: '.claude/', new: '.codebuddy/' },
  { old: '~/.claude', new: '~/.codebuddy' },
  { old: '${CLAUDE_', new: '${CODEBUDDY_' },
  { old: '/.claude/', new: '/.codebuddy/' },
  { old: 'CLAUDE_SESSION_ID', new: 'CODEBUDDY_SESSION_ID' },
];

function updateSkillFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  let originalContent = content;
  let modified = false;

  for (const { old, new: newPath } of PATH_REPLACEMENTS) {
    if (content.includes(old)) {
      content = content.split(old).join(newPath);
      modified = true;
    }
  }

  // 特殊处理：描述文本中的 "Claude Code" 保持不变（不是路径引用）
  // 只替换路径，不替换产品名称引用

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    const relativePath = path.relative(__dirname, filepath);
    console.log(`✓ Updated: ${relativePath}`);
  }

  return modified;
}

function getAllSkillFiles(dir) {
  const files = [];

  function scan(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          scan(path.join(currentDir, entry.name));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.md', '.sh', '.py', '.json'].includes(ext)) {
            files.push(path.join(currentDir, entry.name));
          }
        }
      }
    } catch (err) {
      // 跳过无法读取的目录
    }
  }

  scan(dir);
  return files;
}

// 执行更新
console.log('🔧 Updating skills files...\n');

const allFiles = getAllSkillFiles(SKILLS_DIR);
let updatedCount = 0;

for (const filepath of allFiles) {
  if (updateSkillFile(filepath)) {
    updatedCount++;
  }
}

console.log(`\n✅ Updated ${updatedCount} skill files`);
