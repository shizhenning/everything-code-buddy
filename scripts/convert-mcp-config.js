#!/usr/bin/env node

/**
 * 转换 MCP 配置
 * 将 mcp-configs/mcp-servers.json 转换为 .codebuddy/.mcp.json
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const PROJECT_ROOT = path.dirname(SCRIPT_DIR);
const ECC_MCP_PATH = path.join(PROJECT_ROOT, 'mcp-configs', 'mcp-servers.json');
const CODEBUDDY_DIR = path.join(PROJECT_ROOT, '.codebuddy');
const CODEBUDDY_MCP_PATH = path.join(CODEBUDDY_DIR, '.mcp.json');

console.log('🔄 Converting MCP configuration...\n');

// 确保 .codebuddy 目录存在
if (!fs.existsSync(CODEBUDDY_DIR)) {
  fs.mkdirSync(CODEBUDDY_DIR, { recursive: true });
  console.log(`✅ Created directory: ${CODEBUDDY_DIR}`);
}

// 检查源文件是否存在
if (!fs.existsSync(ECC_MCP_PATH)) {
  console.log(`⚠️  Source MCP config not found: ${ECC_MCP_PATH}`);
  console.log('   Creating empty MCP config...\n');

  // 创建空配置
  const emptyConfig = {
    mcpServers: {}
  };
  fs.writeFileSync(CODEBUDDY_MCP_PATH, JSON.stringify(emptyConfig, null, 2));
  console.log('✅ Created empty MCP configuration');
} else {
  // 读取源配置
  const mcpConfig = JSON.parse(fs.readFileSync(ECC_MCP_PATH, 'utf-8'));

  // 写入 CodeBuddy 配置
  fs.writeFileSync(CODEBUDDY_MCP_PATH, JSON.stringify(mcpConfig, null, 2));

  console.log(`✅ MCP configuration converted:`);
  console.log(`   Source: ${ECC_MCP_PATH}`);
  console.log(`   Target: ${CODEBUDDY_MCP_PATH}`);
  console.log(`   Servers: ${Object.keys(mcpConfig.mcpServers || {}).length}`);
}

console.log('\n✨ MCP configuration ready!\n');
