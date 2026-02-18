#!/usr/bin/env node

/**
 * CodeBuddy-compatible observation hook
 * 替代原版 observe.sh，实现跨平台兼容
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// 配置
const CONFIG = {
  // 用户数据目录 (Instinct 数据存储)
  userDir: path.join(os.homedir(), '.codebuddy'),

  // 观察数据文件路径
  observationsFile: path.join(
    os.homedir(),
    '.codebuddy',
    'homunculus',
    'observations.jsonl'
  ),

  maxSizeMB: 10,
  maxBytes: 10 * 1024 * 1024
};

// 确保目录存在
function ensureDirectoryExists(filepath) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 格式化时间戳
function getTimestamp() {
  return new Date().toISOString();
}

// 获取调用信息
function getCallerInfo() {
  return {
    pid: process.pid,
    platform: process.platform,
    node_version: process.version,
    cwd: process.cwd()
  };
}

// 记录观察
function recordObservation(type, data = {}) {
  ensureDirectoryExists(CONFIG.observationsFile);

  const observation = {
    id: crypto.randomUUID(),
    timestamp: getTimestamp(),
    type: type,
    ...data,
    _meta: getCallerInfo()
  };

  const line = JSON.stringify(observation) + '\n';

  // 检查文件大小，超过限制则轮转
  if (fs.existsSync(CONFIG.observationsFile)) {
    const stats = fs.statSync(CONFIG.observationsFile);
    if (stats.size >= CONFIG.maxBytes) {
      const archivePath = CONFIG.observationsFile + '.archive';
      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(archivePath);
      }
      fs.renameSync(CONFIG.observationsFile, archivePath);
    }
  }

  // 追加写入
  fs.appendFileSync(CONFIG.observationsFile, line);
  console.log(`[instinct] Recorded ${type} observation: ${observation.id}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node observe.js <pre|post|session-start|session-end> [tool-name] [data]');
    process.exit(1);
  }

  const action = args[0];
  const toolName = args[1] || 'unknown';
  const additionalData = args[2];

  switch (action) {
    case 'pre':
      recordObservation('tool_pre', {
        tool_name: toolName,
        input: additionalData
      });
      break;

    case 'post':
      recordObservation('tool_post', {
        tool_name: toolName,
        result: additionalData
      });
      break;

    case 'session-start':
      recordObservation('session_start', {
        cwd: process.cwd(),
        args: process.argv
      });
      break;

    case 'session-end':
      recordObservation('session_end', {
        cwd: process.cwd(),
        duration_ms: process.uptime() * 1000
      });
      break;

    default:
      console.error(`Unknown action: ${action}`);
      console.error('Usage: node observe.js <pre|post|session-start|session-end> [tool-name] [data]');
      process.exit(1);
  }
}

// 运行
main();
