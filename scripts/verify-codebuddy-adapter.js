#!/usr/bin/env node

/**
 * CodeBuddy 适配验证脚本
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const codebuddyDir = path.join(rootDir, '.codebuddy');

console.log('🔍 验证 CodeBuddy 适配...\n');

const checks = [
  {
    name: 'Agents 目录',
    path: path.join(codebuddyDir, 'agents'),
    type: 'directory',
    minCount: 13
  },
  {
    name: 'Commands 目录',
    path: path.join(codebuddyDir, 'commands'),
    type: 'directory',
    minCount: 30
  },
  {
    name: 'Skills 目录',
    path: path.join(codebuddyDir, 'skills'),
    type: 'directory',
    minCount: 40
  },
  {
    name: 'Rules 目录',
    path: path.join(codebuddyDir, 'rules'),
    type: 'directory',
    minCount: 20
  },
  {
    name: 'Scripts 目录',
    path: path.join(codebuddyDir, 'scripts'),
    type: 'directory',
    minCount: 20
  },
  {
    name: 'Homunculus 目录',
    path: path.join(codebuddyDir, 'homunculus'),
    type: 'directory'
  },
  {
    name: 'CODEBUDDY.md',
    path: path.join(codebuddyDir, 'CODEBUDDY.md'),
    type: 'file'
  },
  {
    name: 'settings.json',
    path: path.join(codebuddyDir, 'settings.json'),
    type: 'file'
  },
  {
    name: 'package-manager.json',
    path: path.join(codebuddyDir, 'package-manager.json'),
    type: 'file'
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  const exists = fs.existsSync(check.path);
  
  if (!exists) {
    console.log(`❌ ${check.name}: 不存在`);
    failed++;
    continue;
  }
  
  if (check.type === 'directory') {
    const files = getAllFiles(check.path);
    if (check.minCount && files.length < check.minCount) {
      console.log(`❌ ${check.name}: 文件数量不足 (${files.length} < ${check.minCount})`);
      failed++;
    } else {
      console.log(`✅ ${check.name}: ${files.length} 个文件`);
      passed++;
    }
  } else {
    console.log(`✅ ${check.name}`);
    passed++;
  }
}

// 检查 Agent 模型配置
console.log('\n🤖 检查 Agent 模型配置...');
const agentsDir = path.join(codebuddyDir, 'agents');
const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

const domesticModels = ['glm-5.0', 'kimi-k2.5', 'deepseek-v3.2', 'glm-flash'];
let modelChecks = 0;

for (const agentFile of agentFiles) {
  const content = fs.readFileSync(path.join(agentsDir, agentFile), 'utf-8');
  const modelMatch = content.match(/^model:\s*(.+)$/m);
  
  if (modelMatch) {
    const model = modelMatch[1].trim();
    if (domesticModels.includes(model)) {
      console.log(`  ✅ ${agentFile}: ${model}`);
      modelChecks++;
    } else {
      console.log(`  ⚠️  ${agentFile}: ${model} (非国产模型)`);
    }
  }
}

// 检查路径替换
console.log('\n🔄 检查路径替换...');
const commandsDir = path.join(codebuddyDir, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));

let pathCheckPassed = 0;
let pathCheckFailed = 0;

for (const cmdFile of commandFiles.slice(0, 5)) { // 只检查前5个
  const content = fs.readFileSync(path.join(commandsDir, cmdFile), 'utf-8');
  
  if (content.includes('.claude/')) {
    console.log(`  ❌ ${cmdFile}: 仍包含 .claude/ 路径`);
    pathCheckFailed++;
  } else if (content.includes('.codebuddy/')) {
    console.log(`  ✅ ${cmdFile}: 已替换为 .codebuddy/`);
    pathCheckPassed++;
  }
}

console.log(`\n📊 验证结果:`);
console.log(`  通过: ${passed}/${checks.length}`);
console.log(`  失败: ${failed}`);
console.log(`  Agent 模型: ${modelChecks}/${agentFiles.length}`);
console.log(`  路径替换: ${pathCheckPassed}/5`);

if (failed === 0 && modelChecks >= agentFiles.length - 2) {
  console.log('\n✅ CodeBuddy 适配验证通过！');
  process.exit(0);
} else {
  console.log('\n⚠️  验证发现一些问题，请检查');
  process.exit(1);
}

function getAllFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = files.concat(getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}
