# MCP 集成分析与替代方案

> CodeBuddy 中 MCP 集成的现状、问题和替代解决方案

---

## 现状分析

### CodeBuddy MCP 支持状态

| MCP Server | Claude Code | CodeBuddy | 状态 |
|-----------|-------------|-----------|------|
| GitHub | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Filesystem | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| PostgreSQL | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Brave Search | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Puppeteer | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Slack | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Fetch (HTTP) | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Supabase | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Memory | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Sequential Thinking | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Vercel | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Railway | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Cloudflare (4个) | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| ClickHouse | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Context7 | ✅ 原生支持 | ✅ 格式兼容 | 可用 |
| Magic UI | ✅ 原生支持 | ✅ 格式兼容 | 可用 |

### 配置位置差异

| 平台 | 配置文件 | MCP 配置位置 |
|------|---------|-------------|
| Claude Code | `~/.claude.json` | `mcpServers` 字段 |
| CodeBuddy | `~/.codebuddy/settings.json` 或 `.codebuddy/settings.json` | `mcpServers` 字段 |

**配置格式相同**，只是文件名和路径不同。

---

## 已知问题

### 1. 配置文件未自动创建

CodeBuddy 需要手动创建 `settings.json`：

```bash
# 全局配置
mkdir -p ~/.codebuddy
cat > ~/.codebuddy/settings.json << 'EOF'
{
  "mcpServers": {}
}
EOF

# 项目级配置
mkdir -p .codebuddy
cat > .codebuddy/settings.json << 'EOF'
{
  "mcpServers": {}
}
EOF
```

### 2. MCP 服务器安装差异

**Claude Code**: 可以直接在配置中使用 `npx -y` 自动安装
**CodeBuddy**: 可能需要预先安装 MCP 服务器包

```bash
# 预先安装 MCP 服务器
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-filesystem
```

### 3. HTTP MCP 服务器访问

某些 HTTP MCP 服务器可能需要网络访问权限或 API 密钥。

---

## 替代方案

### 方案 1: 内置功能替代

| MCP 功能 | CodeBuddy 内置替代 | 说明 |
|---------|-------------------|------|
| GitHub | GitHub CLI 集成 | 使用 `gh` 命令行工具 |
| Filesystem | 原生文件操作 | Read/Write/Grep/Glob 工具 |
| Fetch | WebFetch 工具 | `web_fetch` 功能 |
| PostgreSQL | Database Reviewer Agent | 数据库查询优化 |
| Slack | 企业微信集成 | CodeBuddy 内置 |
| Memory | Update Memory 工具 | `update_memory` |

### 方案 2: 使用 CodeBuddy 内置工具

CodeBuddy 提供了丰富的内置工具，许多 MCP 功能可以用原生工具替代：

```javascript
// GitHub 操作 - 使用 gh CLI 或 GitHub API
const github = {
  listPRs: () => exec('gh pr list'),
  createIssue: (title, body) => exec(`gh issue create --title "${title}" --body "${body}"`),
  // ...
};

// 文件系统操作 - 原生工具
const fsOps = {
  readFile: (path) => readFile(path),
  writeFile: (path, content) => write_to_file(path, content),
  search: (pattern, dir) => search_content(pattern, dir),
  // ...
};
```

### 方案 3: 自定义脚本 Hook

使用 Hook 脚本实现 MCP 功能：

```javascript
// .codebuddy/hooks/github-integration.js
const { exec } = require('child_process');

module.exports = async (input) => {
  const { tool, input: toolInput } = JSON.parse(input);

  if (tool === 'Bash' && toolInput.command.startsWith('gh ')) {
    // GitHub CLI 命令
    const result = await exec(toolInput.command);
    return JSON.stringify(result);
  }
};

// hooks.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "node ${CODEBUDDY_PLUGIN_ROOT}/hooks/github-integration.js"
      }]
    }]
  }
}
```

### 方案 4: Agent 委托

创建专门的 Agent 来处理特定功能：

```yaml
---
name: github-helper
description: GitHub operations specialist
tools: ["Read", "Write", "Bash"]
model: sonnet
---

You are a GitHub operations specialist.

## Available Operations

- List pull requests: `gh pr list`
- Create pull request: `gh pr create --title "..." --body "..."`
- Review pull request: `gh pr view <number>`
- List issues: `gh issue list`
- Create issue: `gh issue create --title "..."`

## Usage

When the user asks about GitHub operations, use the `gh` CLI tool to perform the requested action.
```

---

## 推荐配置

### 最小 MCP 配置

仅启用最常用的 MCP 服务器：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub operations - PRs, issues, repos"
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${CODEBUDDY_PROJECT_DIR}"],
      "description": "Filesystem operations (limited to project dir)"
    }
  },
  "disabledMcpServers": [
    "firecrawl",
    "supabase",
    "memory",
    "sequential-thinking",
    "vercel",
    "railway",
    "cloudflare-docs",
    "cloudflare-workers-builds",
    "cloudflare-workers-bindings",
    "cloudflare-observability",
    "clickhouse",
    "context7",
    "magic"
  ]
}
```

### 完整 MCP 配置（可选）

如果需要所有 MCP 服务器，可以复制 `mcp-configs/mcp-servers.json` 到 `settings.json`。

---

## 迁移步骤

### 步骤 1: 创建 CodeBuddy 配置

```bash
# 1. 复制 MCP 配置模板
cat mcp-configs/mcp-servers.json | jq '.mcpServers' > ~/.codebuddy/settings.json

# 2. 添加必要的环境变量
echo 'export GITHUB_TOKEN="your-token-here"' >> ~/.bashrc
echo 'export FIRECRAWL_API_KEY="your-key-here"' >> ~/.bashrc

# 3. 重新加载配置
source ~/.bashrc
```

### 步骤 2: 测试 MCP 连接

```bash
# 测试 GitHub MCP
npx -y @modelcontextprotocol/server-github --help

# 测试 Filesystem MCP
npx -y @modelcontextprotocol/server-filesystem --help

# 查看已安装的 MCP
codebuddy /mcp
```

### 步骤 3: 验证功能

```bash
# 测试 GitHub 集成
codebuddy "列出 GitHub 上的 PR"

# 测试文件系统操作
codebuddy "搜索项目中的所有 .ts 文件"
```

---

## 性能优化建议

### 1. 限制启用 MCP 数量

保持启用的 MCP 服务器少于 10 个，以避免上下文窗口溢出。

### 2. 使用项目级配置

为不同项目使用不同的 MCP 配置：

```json
// .codebuddy/settings.json (项目级)
{
  "mcpServers": {
    "github": { /* ... */ },
    "supabase": { /* ... */ }
  }
}
```

### 3. 禁用不需要的 MCP

在配置中明确禁用不使用的 MCP：

```json
{
  "disabledMcpServers": [
    "cloudflare-docs",
    "clickhouse"
  ]
}
```

---

## 总结

**MCP 兼容性**: ✅ 100% 格式兼容

**推荐做法**:
1. 使用最小 MCP 配置（仅 GitHub + Filesystem）
2. 优先使用 CodeBuddy 内置工具
3. 对特殊需求使用 Agent 或 Hook 自定义实现
4. 测试 MCP 连接后再添加到生产环境

**不推荐**:
- ❌ 启用所有 MCP 服务器（上下文窗口溢出）
- ❌ 依赖外部 MCP 而不测试连接性
- ❌ 使用需要付费 API 的 MCP 服务器（除非必要）

---

## 相关文档

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [CodeBuddy 迁移指南](./CODEBUDDY_MIGRATION_GUIDE.md)
- [兼容性矩阵](./CODEBUDDY_COMPATIBILITY_MATRIX.md)
