#!/usr/bin/env node

/**
 * Multi Mode Selector - 智能选择外部或本地模式
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.codebuddy', 'multi-config.json');

/**
 * 读取配置
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { mode: 'local', external: { enabled: false } };
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.warn('[Multi] Failed to load config, using local mode');
    return { mode: 'local', external: { enabled: false } };
  }
}

/**
 * 检查外部模型是否可用
 */
function isExternalAvailable(config) {
  if (!config.external?.enabled) {
    return false;
  }

  // 检查 wrapper 脚本
  const wrapperPath = config.external?.wrapper_path
    ?.replace('~', os.homedir());
  if (!wrapperPath || !fs.existsSync(wrapperPath)) {
    return false;
  }

  // 检查 API 密钥
  const hasCodexKey = !!config.external?.codex?.api_key;
  const hasGeminiKey = !!config.external?.gemini?.api_key;

  return hasCodexKey || hasGeminiKey;
}

/**
 * 选择模式
 */
function selectMode() {
  const config = loadConfig();

  // 强制本地模式
  if (config.mode === 'local') {
    return 'local';
  }

  // 尝试外部模式
  if (isExternalAvailable(config)) {
    return 'external';
  }

  // 降级到本地
  return 'local';
}

/**
 * 导出模式信息
 */
function getModeInfo() {
  const mode = selectMode();
  const config = loadConfig();

  return {
    mode,
    config,
    isExternalAvailable: isExternalAvailable(config)
  };
}

// CLI 接口
if (require.main === module) {
  const info = getModeInfo();
  console.log(JSON.stringify(info, null, 2));
}

module.exports = { selectMode, getModeInfo, loadConfig };
