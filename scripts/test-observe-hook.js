#!/usr/bin/env node

/**
 * 测试 observe.js hook 的触发情况
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== Testing observe.js Hook ===\n');

// 测试数据
const testData = {
  PreToolUse: {
    tool_name: 'ReadFile',
    tool_input: { filePath: '/test/file.txt' }
  },
  PostToolUse: {
    tool_name: 'ReadFile',
    tool_output: { content: 'test content' }
  },
  SessionStart: {},
  SessionEnd: {}
};

// 模拟 hook 触发
async function testHook(eventType, action, toolName = '') {
  console.log(`\n--- Testing ${eventType} ---`);

  const pluginRoot = path.resolve(__dirname, '..');
  const observeScript = path.join(pluginRoot, 'skills', 'continuous-learning-v2', 'hooks', 'observe.js');

  const args = [observeScript, action];
  if (toolName) args.push(toolName);

  console.log(`Command: node ${args.join(' ')}`);
  console.log(`Event data: ${JSON.stringify(testData[eventType])}\n`);

  return new Promise((resolve) => {
    const proc = spawn('node', args, {
      env: {
        ...process.env,
        CODEBUDDY_PLUGIN_ROOT: pluginRoot,
        CODEBUDDY_DEBUG_HOOKS: '1' // 启用调试模式
      },
      cwd: process.cwd()
    });

    // 发送测试数据到 stdin
    if (Object.keys(testData[eventType]).length > 0) {
      proc.stdin.write(JSON.stringify(testData[eventType]));
      proc.stdin.end();
    }

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(`[stdout] ${data}`);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(`[stderr] ${data}`);
    });

    proc.on('close', (code) => {
      console.log(`\n[Exit code: ${code}]`);
      resolve({ code, stdout, stderr });
    });
  });
}

async function runTests() {
  await testHook('PreToolUse', 'pre', 'ReadFile');
  await testHook('PostToolUse', 'post', 'ReadFile');
  await testHook('SessionStart', 'session-start');
  await testHook('SessionEnd', 'session-end');

  console.log('\n=== All Tests Complete ===');

  // 检查生成的观察文件
  const fs = require('fs');
  const os = require('os');
  const observationsFile = path.join(os.homedir(), '.codebuddy', 'homunculus', 'observations.jsonl');

  if (fs.existsSync(observationsFile)) {
    console.log('\n=== Observations File Contents ===');
    const content = fs.readFileSync(observationsFile, 'utf8');
    const lines = content.trim().split('\n');
    console.log(`Total observations: ${lines.length}\n`);

    lines.forEach((line, i) => {
      const obs = JSON.parse(line);
      console.log(`${i + 1}. [${obs.timestamp}] ${obs.type} - ID: ${obs.id}`);
    });
  } else {
    console.log(`\nObservations file not found: ${observationsFile}`);
  }

  // 检查调试日志
  const debugLogFile = path.join(os.homedir(), '.codebuddy', 'observe-debug.log');
  if (fs.existsSync(debugLogFile)) {
    console.log('\n=== Debug Log File (last 50 lines) ===');
    const debugContent = fs.readFileSync(debugLogFile, 'utf8');
    const debugLines = debugContent.trim().split('\n');
    debugLines.slice(-50).forEach(line => console.log(line));
  }
}

runTests().catch(console.error);
