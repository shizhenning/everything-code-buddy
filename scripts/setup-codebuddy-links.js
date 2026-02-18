#!/usr/bin/env node

/**
 * 创建 CodeBuddy 符号链接
 * 用于 ECC 到 CodeBuddy 的适配
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取脚本所在的目录
const SCRIPT_DIR = __dirname;
// 项目根目录是脚本目录的父目录
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const CODEBUDDY_DIR = path.join(PROJECT_ROOT, '.codebuddy');

console.log(`Project Root: ${PROJECT_ROOT}`);
console.log(`CodeBuddy Dir: ${CODEBUDDY_DIR}\n`);

console.log('🔗 Setting up CodeBuddy symbolic links...\n');

// 定义需要创建的符号链接
// target: 在 .codebuddy/ 中的名称
// source: 指向项目根目录下的相对路径
const SYMLINKS = {
  'agents': 'agents',
  'commands': 'commands',
  'skills': 'skills',
  'rules': 'rules',
  'hooks': 'hooks',
  'scripts': 'scripts',
};

// 创建 .codebuddy 目录
if (!fs.existsSync(CODEBUDDY_DIR)) {
  fs.mkdirSync(CODEBUDDY_DIR, { recursive: true });
  console.log(`✅ Created directory: ${CODEBUDDY_DIR}\n`);
}

// 创建符号链接
let successCount = 0;
let errorCount = 0;

for (const [target, source] of Object.entries(SYMLINKS)) {
  const targetPath = path.join(CODEBUDDY_DIR, target);
  const absSourcePath = path.join(PROJECT_ROOT, source); // 源目录的绝对路径

  console.log(`Processing: ${target} -> ${source}`);
  console.log(`  Target: ${targetPath}`);
  console.log(`  Source: ${absSourcePath}`);

  // 检查源目录是否存在
  if (!fs.existsSync(absSourcePath)) {
    console.log(`⚠️  Skipped ${target}: Source directory not found (${absSourcePath})`);
    errorCount++;
    continue;
  }

  // 删除已存在的链接或目录
  if (fs.existsSync(targetPath)) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
      console.log(`🧹 Removed existing: ${target}`);
    } catch (error) {
      console.log(`⚠️  Warning: Could not remove ${targetPath}: ${error.message}`);
    }
  }

  // 创建符号链接或 Junction
  try {
    if (process.platform === 'win32') {
      // Windows: 使用 Junction
      const absSourcePathWin = absSourcePath.replace(/\//g, '\\');
      const targetPathWin = targetPath.replace(/\//g, '\\');

      try {
        execSync(`mklink /J "${targetPathWin}" "${absSourcePathWin}"`, { shell: true, stdio: 'pipe' });
        console.log(`✅ Junction created: ${target} → ${source}`);
        successCount++;
      } catch (error) {
        // 如果 mklink 失败，尝试使用目录符号链接 (需要管理员权限)
        console.log(`⚠️  Junction failed, trying symlink (may require admin rights): ${target}`);
        try {
          fs.symlinkSync(absSourcePath, targetPath, 'junction');
          console.log(`✅ Symlink created: ${target} → ${source}`);
          successCount++;
        } catch (symlinkError) {
          console.log(`❌ Failed to create symlink for ${target}: ${symlinkError.message}`);
          console.log(`   Note: On Windows, creating directory symlinks may require:`);
          console.log(`   - Running as Administrator, OR`);
          console.log(`   - Enabling Developer Mode, OR`);
          console.log(`   - Using Junctions (already attempted)\n`);
          errorCount++;
        }
      }
    } else {
      // Linux/macOS: 原生符号链接
      fs.symlinkSync(absSourcePath, targetPath, 'dir');
      console.log(`✅ Symlink created: ${target} → ${source}`);
      successCount++;
    }
  } catch (error) {
    console.log(`❌ Failed to create ${target}: ${error.message}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`📊 Summary:`);
console.log(`   ✅ Success: ${successCount}`);
console.log(`   ⚠️  Skipped/Failed: ${errorCount}`);
console.log(`   📁 Platform: ${process.platform}`);
console.log('='.repeat(60));

if (errorCount > 0) {
  console.log('\n⚠️  Some links could not be created.');
  console.log('   Run node scripts/verify-codebuddy-links.js to check status.\n');
  process.exit(1);
} else {
  console.log('\n✨ All CodeBuddy symbolic links created successfully!\n');
  process.exit(0);
}
