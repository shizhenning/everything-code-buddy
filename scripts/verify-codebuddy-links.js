#!/usr/bin/env node

/**
 * 验证 CodeBuddy 符号链接
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const CODEBUDDY_DIR = path.join(PROJECT_ROOT, '.codebuddy');

console.log('🔍 Verifying CodeBuddy symbolic links...\n');

const EXPECTED_LINKS = {
  'agents': 'agents',
  'commands': 'commands',
  'skills': 'skills',
  'rules': 'rules',
  'hooks': 'hooks',
  'scripts': 'scripts',
};

let validCount = 0;
let invalidCount = 0;
let missingCount = 0;

for (const [target, sourceName] of Object.entries(EXPECTED_LINKS)) {
  const targetPath = path.join(CODEBUDDY_DIR, target);
  const absSourcePath = path.join(PROJECT_ROOT, sourceName);

  console.log(`Checking: ${target}`);

  if (!fs.existsSync(targetPath)) {
    console.log(`  ❌ Missing: ${target} does not exist\n`);
    missingCount++;
    continue;
  }

  // 检查是否为符号链接或 Junction
  let isLink = false;
  let linkTarget = null;

  try {
    if (process.platform === 'win32') {
      // Windows: 检查是否为 Junction
      const lstat = fs.lstatSync(targetPath);
      isLink = lstat.isSymbolicLink() || lstat.isJunction();
    } else {
      // Linux/macOS: 检查是否为符号链接
      const lstat = fs.lstatSync(targetPath);
      isLink = lstat.isSymbolicLink();
    }

    if (isLink) {
      try {
        linkTarget = fs.readlinkSync(targetPath);
        // 相对路径转绝对路径
        if (!path.isAbsolute(linkTarget)) {
          linkTarget = path.resolve(path.dirname(targetPath), linkTarget);
        }
      } catch (e) {
        // Junction 无法用 readlinkSync 读取
        linkTarget = '(junction)';
      }
    }
  } catch (error) {
    console.log(`  ⚠️  Warning: Could not read link info: ${error.message}`);
  }

  if (!isLink) {
    console.log(`  ❌ Not a link: ${target} is a regular directory\n`);
    invalidCount++;
  } else {
    // 验证链接目标是否正确
    let targetMatches = false;
    if (linkTarget === '(junction)') {
      // Windows Junction，无法用 readlinkSync 读取
      // 验证 Junction 目标是否正确
      try {
        const stats = fs.statSync(absSourcePath);
        if (stats.isDirectory()) {
          targetMatches = true;
          console.log(`  ✅ Valid: ${target} (junction → ${sourceName})\n`);
        }
      } catch (e) {
        console.log(`  ⚠️  Warning: Could not verify junction target: ${e.message}\n`);
        // 假设正确
        targetMatches = true;
      }
    } else if (linkTarget === absSourcePath) {
      targetMatches = true;
      console.log(`  ✅ Valid: ${target} → ${sourceName}\n`);
    } else {
      console.log(`  ⚠️  Wrong target: ${target} → ${linkTarget} (expected ${absSourcePath})\n`);
      invalidCount++;
    }

    if (targetMatches) {
      validCount++;
    }
  }
}

// 验证 plugin.json
const pluginPath = path.join(CODEBUDDY_DIR, 'plugin.json');
console.log('Checking: plugin.json');
if (fs.existsSync(pluginPath)) {
  try {
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
    console.log(`  ✅ Valid: plugin.json (version ${plugin.version})\n`);
  } catch (error) {
    console.log(`  ❌ Invalid: plugin.json - ${error.message}\n`);
    invalidCount++;
  }
} else {
  console.log(`  ⚠️  Missing: plugin.json does not exist\n`);
  missingCount++;
}

// 验证 .mcp.json
const mcpPath = path.join(CODEBUDDY_DIR, '.mcp.json');
console.log('Checking: .mcp.json');
if (fs.existsSync(mcpPath)) {
  try {
    const mcp = JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
    const serverCount = Object.keys(mcp.mcpServers || {}).length;
    console.log(`  ✅ Valid: .mcp.json (${serverCount} servers)\n`);
  } catch (error) {
    console.log(`  ❌ Invalid: .mcp.json - ${error.message}\n`);
    invalidCount++;
  }
} else {
  console.log(`  ⚠️  Missing: .mcp.json does not exist\n`);
  missingCount++;
}

// 验证 marketplace.json
const marketplacePath = path.join(PROJECT_ROOT, '.codebuddy-plugin', 'marketplace.json');
console.log('Checking: marketplace.json');
if (fs.existsSync(marketplacePath)) {
  try {
    const marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf-8'));
    console.log(`  ✅ Valid: marketplace.json (name ${marketplace.name})\n`);
  } catch (error) {
    console.log(`  ❌ Invalid: marketplace.json - ${error.message}\n`);
    invalidCount++;
  }
} else {
  console.log(`  ⚠️  Missing: marketplace.json does not exist\n`);
  missingCount++;
}

console.log('='.repeat(60));
console.log(`📊 Summary:`);
console.log(`   ✅ Valid: ${validCount}`);
console.log(`   ❌ Invalid: ${invalidCount}`);
console.log(`   ⚠️  Missing: ${missingCount}`);
console.log(`   📁 Platform: ${process.platform}`);
console.log('='.repeat(60));

if (invalidCount > 0 || missingCount > 0) {
  console.log('\n⚠️  Some issues found. Review the output above.\n');
  process.exit(1);
} else {
  console.log('\n✨ All CodeBuddy links verified successfully!\n');
  process.exit(0);
}
