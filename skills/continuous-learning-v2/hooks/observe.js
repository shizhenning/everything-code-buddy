#!/usr/bin/env node

/**
 * CodeBuddy-compatible observation hook
 * 替代原版 observe.sh，实现跨平台兼容
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// 调试日志配置
const DEBUG = process.env.CODEBUDDY_DEBUG_HOOKS === '1' || process.env.DEBUG_OBSERVE === '1';

// 日志函数
function log(level, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[observe:${level}]`;
  const message = args.join(' ');

  // 输出到 stderr（确保不会被 stdin 读取干扰）
  console.error(`${prefix} ${timestamp} - ${message}`);

  // 调试模式下也输出到文件
  if (DEBUG) {
    const logFile = path.join(os.homedir(), '.codebuddy', 'observe-debug.log');
    ensureDirectoryExists(logFile);
    fs.appendFileSync(logFile, `${timestamp} [${level}] ${message}\n`);
  }
}

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
  log('DEBUG', `recordObservation called with type: ${type}`);

  ensureDirectoryExists(CONFIG.observationsFile);

  const observation = {
    id: crypto.randomUUID(),
    timestamp: getTimestamp(),
    type: type,
    ...data,
    _meta: getCallerInfo()
  };

  const line = JSON.stringify(observation) + '\n';

  log('DEBUG', `Observation ID: ${observation.id}`);
  log('DEBUG', `Observation file: ${CONFIG.observationsFile}`);

  // 检查文件大小，超过限制则轮转
  if (fs.existsSync(CONFIG.observationsFile)) {
    const stats = fs.statSync(CONFIG.observationsFile);
    log('DEBUG', `Current file size: ${stats.size} bytes, max: ${CONFIG.maxBytes} bytes`);

    if (stats.size >= CONFIG.maxBytes) {
      const archivePath = CONFIG.observationsFile + '.archive';
      log('INFO', `Rotating observations file to ${archivePath}`);

      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(archivePath);
      }
      fs.renameSync(CONFIG.observationsFile, archivePath);
    }
  }

  try {
    // 追加写入
    fs.appendFileSync(CONFIG.observationsFile, line);
    log('INFO', `✓ Recorded ${type} observation: ${observation.id}`);
  } catch (err) {
    log('ERROR', `Failed to write observation: ${err.message}`);
    log('ERROR', `Error stack: ${err.stack}`);
  }
}

// 主函数
function main() {
  log('INFO', '===== observe.js starting =====');
  log('INFO', 'Arguments:', process.argv.slice(2).join(' '));
  log('INFO', 'Working directory:', process.cwd());
  log('INFO', 'Environment CODEBUDDY_PLUGIN_ROOT:', process.env.CODEBUDDY_PLUGIN_ROOT);
  log('INFO', 'Environment CODEBUDDY_DEBUG_HOOKS:', process.env.CODEBUDDY_DEBUG_HOOKS);
  log('INFO', 'DEBUG mode:', DEBUG);

  const args = process.argv.slice(2);

  if (args.length === 0) {
    log('ERROR', 'No arguments provided');
    console.error('Usage: node observe.js <pre|post|session-start|session-end> [tool-name] [data]');
    process.exit(1);
  }

  const action = args[0];
  const toolName = args[1] || 'unknown';
  const additionalData = args[2];

  log('INFO', `Action: ${action}, Tool: ${toolName}`);

  // 读取 stdin 数据（如果有）
  let stdinData = '';
  if (process.stdin.isTTY === false) {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      stdinData += chunk;
    });
    process.stdin.on('end', () => {
      processWithStdin(action, toolName, additionalData, stdinData);
    });
  } else {
    // 无 stdin 数据，直接处理
    processWithStdin(action, toolName, additionalData, stdinData);
  }
}

// 处理函数（在读取完 stdin 后调用）
function processWithStdin(action, toolName, additionalData, stdinData) {
  log('DEBUG', `stdinData length: ${stdinData.length} bytes`);

  // 尝试解析 stdin JSON
  let parsedStdin = null;
  if (stdinData.trim()) {
    try {
      parsedStdin = JSON.parse(stdinData);
      log('DEBUG', 'stdin parsed as JSON successfully');
      log('DEBUG', 'stdin keys:', Object.keys(parsedStdin).join(', '));
    } catch (e) {
      log('WARN', 'Failed to parse stdin as JSON:', e.message);
      log('DEBUG', 'stdin content (first 200 chars):', stdinData.substring(0, 200));
    }
  }

  switch (action) {
    case 'pre':
      log('INFO', `Recording pre-observation for tool: ${toolName}`);
      recordObservation('tool_pre', {
        tool_name: toolName,
        input: additionalData,
        stdin_summary: parsedStdin ? JSON.stringify({
          tool_name: parsedStdin.tool_name,
          tool_input_keys: parsedStdin.tool_input ? Object.keys(parsedStdin.tool_input) : []
        }) : null
      });
      log('INFO', `Pre-observation recorded for ${toolName}`);
      break;

    case 'post':
      log('INFO', `Recording post-observation for tool: ${toolName}`);
      recordObservation('tool_post', {
        tool_name: toolName,
        result: additionalData,
        stdin_summary: parsedStdin ? JSON.stringify({
          tool_name: parsedStdin.tool_name,
          has_output: !!parsedStdin.tool_output,
          output_length: parsedStdin.tool_output ? String(parsedStdin.tool_output).length : 0
        }) : null
      });
      log('INFO', `Post-observation recorded for ${toolName}`);
      break;

    case 'session-start':
      log('INFO', 'Recording session-start observation');
      recordObservation('session_start', {
        cwd: process.cwd(),
        args: process.argv,
        env_node_version: process.version,
        env_platform: process.platform
      });
      log('INFO', 'Session-start observation recorded');
      break;

    case 'session-end':
      log('INFO', 'Recording session-end observation');
      recordObservation('session_end', {
        cwd: process.cwd(),
        duration_ms: process.uptime() * 1000
      });
      log('INFO', 'Session-end observation recorded');
      break;

    default:
      log('ERROR', `Unknown action: ${action}`);
      console.error(`Unknown action: ${action}`);
      console.error('Usage: node observe.js <pre|post|session-start|session-end> [tool-name] [data]');
      process.exit(1);
  }

  log('INFO', '===== observe.js completed =====');

  // 如果有 stdin 数据，需要输出回去（让其他 hook 继续处理）
  if (stdinData) {
    process.stdout.write(stdinData);
  }
}

// 运行
try {
  main();
} catch (err) {
  log('ERROR', 'Uncaught error:', err.message);
  log('ERROR', 'Stack:', err.stack);
  process.exit(1);
}
