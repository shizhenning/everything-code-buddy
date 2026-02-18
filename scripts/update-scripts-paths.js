#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = __dirname;

// 路径替换规则
const PATH_REPLACEMENTS = [
  { old: '~/.codebuddy/', new: '~/.codebuddy/' },
  { old: '.codebuddy/', new: '.codebuddy/' },
  { old: '~/.codebuddy', new: '~/.codebuddy' },
  { old: '${CODEBUDDY_', new: '${CODEBUDDY_' },
  { old: 'CODEBUDDY_SESSION_ID', new: 'CODEBUDDY_SESSION_ID' },
  { old: 'CODEBUDDY_TRANSCRIPT_PATH', new: 'CODEBUDDY_TRANSCRIPT_PATH' },
  { old: 'CODEBUDDY_PACKAGE_MANAGER', new: 'CODEBUDDY_PACKAGE_MANAGER' },
];

// 需要特殊处理的函数名（保持不变，只更新注释）
const KEEP_FUNCTIONS = [
  'getClaudeDir',
  'getSessionsDir',
  'getLearnedSkillsDir',
  'getSessionIdShort',
];

function updateScriptFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  let modified = false;

  // 先替换注释中的路径引用
  for (const { old, new: newPath } of PATH_REPLACEMENTS) {
    if (content.includes(old)) {
      content = content.split(old).join(newPath);
      modified = true;
    }
  }

  // 恢复函数名（如果被误替换）
  KEEP_FUNCTIONS.forEach(funcName => {
    const wrongName = funcName.replace('Claude', 'CodeBuddy');
    if (content.includes(wrongName)) {
      content = content.split(wrongName).join(funcName);
    }
  });

  if (modified) {
    fs.writeFileSync(filepath, content, 'utf-8');
    const relativePath = path.relative(__dirname, filepath);
    console.log(`✓ Updated: ${relativePath}`);
  }

  return modified;
}

function getAllScriptFiles(dir) {
  const files = [];

  function scan(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          scan(path.join(currentDir, entry.name));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.js', '.ts', '.sh', '.md'].includes(ext)) {
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
console.log('🔧 Updating scripts files...\n');

const allFiles = getAllScriptFiles(SCRIPTS_DIR);
let updatedCount = 0;

for (const filepath of allFiles) {
  if (updateScriptFile(filepath)) {
    updatedCount++;
  }
}

console.log(`\n✅ Updated ${updatedCount} script files`);
