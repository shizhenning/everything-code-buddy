# ECC 到 CodeBuddy 完整适配方案

**方案版本:** v1.0  
**制定日期:** 2026-02-18  
**状态:** 已完成

---

## 📋 目录

1. [方案概述](#方案概述)
2. [技术对比](#技术对比)
3. [符号链接方案](#符号链接方案)
4. [目录结构](#目录结构)
5. [实施步骤](#实施步骤)
6. [测试验证方案](#测试验证方案)
7. [风险和挑战](#风险和挑战)
8. [回滚方案](#回滚方案)

---

## 方案概述

### 1.1 背景

**ECC (Everything Code Buddy)** 是一个经过 10+ 个月高强度日常使用演进的 Claude Code 配置生态系统，包含：
- 13 个智能代理 (Agents)
- 53+ 个技能 (Skills)
- 31 个命令 (Commands)
- 28 条规则 (Rules)
- 6 类钩子 (Hooks)

**目标**: 将 ECC 适配到 CodeBuddy 架构，实现：
- 直接在项目中使用 CodeBuddy 功能
- 以插件形式发布 ECC 配置
- 单源管理，避免重复

### 1.2 核心策略

采用**符号链接 (Symbolic Links)** 方案：
- 在项目根目录创建 `.codebuddy/` 目录
- 通过符号链接指向 `agents/`, `commands/`, `skills/`, `rules/`, `hooks/`, `scripts/`
- 转换 `mcp-configs/mcp-servers.json` 为 `.mcp.json`

**优势**：
- 单一数据源，修改自动同步
- 既能在项目中直接使用，又能发布为插件
- 跨平台支持（Linux/macOS 原生符号链接，Windows 使用 Junction）

---

## 技术对比

### 2.1 核心差异

| 组件 | ECC 格式 | CodeBuddy 格式 | 适配方式 |
|------|---------|---------------|---------|
| Agents | Markdown + YAML | Markdown + YAML | ✅ 兼容，仅 model ID 更新 |
| Commands | Markdown + YAML | Markdown + YAML | ✅ 兼容，无需转换 |
| Skills | Markdown + YAML | Markdown + YAML | ✅ 兼容，无需转换 |
| Rules | Markdown | Markdown | ✅ 兼容，直接符号链接 |
| Hooks | `hooks/hooks.json` | `hooks/hooks.json` | ✅ 兼容，直接符号链接 |
| MCP | `mcp-configs/mcp-servers.json` | `.mcp.json` | ⚠️ 结构转换 |

### 2.2 模型 ID 映射

| ECC 模型 | CodeBuddy 模型 | 说明 |
|---------|---------------|------|
| claude-3-5-sonnet-20241022 | claude-3-5-sonnet | 简化命名 |
| claude-3-5-haiku-20241022 | claude-3-5-haiku | 简化命名 |
| claude-3-opus-20240229 | claude-3-opus | 简化命名 |

---

## 符号链接方案

### 3.1 链接映射表

| 组件 | ECC 位置 | CodeBuddy 链接方式 | 适配难度 |
|------|----------|----------------|---------|
| Agents | `agents/` | `.codebuddy/agents/` → `../agents/` | 低 |
| Commands | `commands/` | `.codebuddy/commands/` → `../commands/` | 低 |
| Skills | `skills/` | `.codebuddy/skills/` → `../skills/` | 低 |
| Rules | `rules/` | `.codebuddy/rules/` → `../rules/` | 低 |
| Hooks | `hooks/` | `.codebuddy/hooks/` → `../hooks/` | 低 |
| MCP | `mcp-configs/` | `.codebuddy/.mcp.json` (转换后) | 中 |
| Scripts | `scripts/` | `.codebuddy/scripts/` → `../scripts/` | 低 |

### 3.2 跨平台实现

**Linux/macOS**: 原生符号链接
```javascript
fs.symlinkSync(sourcePath, targetPath, 'dir');
```

**Windows**: 使用 Junction 作为备选
```javascript
if (process.platform === 'win32') {
  execSync(`mklink /J "${targetPath}" "${sourcePath}"`, { shell: true });
} else {
  fs.symlinkSync(sourcePath, targetPath, 'dir');
}
```

---

## 目录结构

### 4.1 完整目录结构

```bash
everything-code-buddy/              # 项目根目录
├── agents/                        # ECC Agents (13 个)
│   ├── planner.md
│   ├── architect.md
│   └── ...
├── commands/                      # ECC Commands (31 个)
│   ├── plan.md
│   ├── tdd.md
│   └── ...
├── skills/                        # ECC Skills (53+ 个)
│   ├── typescript/
│   ├── react/
│   └── ...
├── rules/                         # ECC Rules (28 条)
│   ├── common/
│   ├── typescript/
│   └── ...
├── hooks/                         # ECC Hooks
│   └── hooks.json
├── mcp-configs/                   # ECC MCP 配置
│   └── mcp-servers.json
├── scripts/                       # ECC Scripts
│   ├── setup-package-manager.js
│   └── ...
├── .codebuddy/                    # CodeBuddy 配置根目录 (新增)
│   ├── agents/                    # → ../agents/ (符号链接)
│   ├── commands/                  # → ../commands/ (符号链接)
│   ├── skills/                    # → ../skills/ (符号链接)
│   ├── rules/                     # → ../rules/ (符号链接)
│   ├── hooks/                     # → ../hooks/ (符号链接)
│   ├── scripts/                   # → ../scripts/ (符号链接)
│   ├── mcp.json                   # MCP 配置 (转换后)
│   ├── settings.json               # CodeBuddy 配置 (新增)
│   └── README.md
├── .codebuddy-plugin/             # CodeBuddy 插件配置 (新增)
│   ├── plugin.json                # 插件清单
│   └── marketplace.json           # 插件市场配置
```

### 4.2 plugin.json

```json
{
  "name": "everything-codebuddy",
  "version": "1.0.0",
  "description": "ECC 适配 CodeBuddy 插件",
  "agents": ["./agents/"],
  "commands": ["./commands/"],
  "skills": ["./skills/"],
  "rules": ["./rules/"],
  "hooks": "./hooks/hooks.json",
  "mcp": "./mcp.json"
}
```

---

## 实施步骤

### 5.1 阶段 1: 创建目录结构

```bash
# 创建目录
mkdir -p .codebuddy
mkdir -p .codebuddy-plugin
```

### 5.2 阶段 2: 创建符号链接

使用 `scripts/setup-codebuddy-links.js` 脚本：

```javascript
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.dirname(__dirname);
const CODEBUDDY_DIR = path.join(PROJECT_ROOT, '.codebuddy');

const SYMLINKS = {
  'agents': '../agents',
  'commands': '../commands',
  'skills': '../skills',
  'rules': '../rules',
  'hooks': '../hooks',
  'scripts': '../scripts',
};

// 创建 .codebuddy 目录
if (!fs.existsSync(CODEBUDDY_DIR)) {
  fs.mkdirSync(CODEBUDDY_DIR, { recursive: true });
}

// 创建符号链接
for (const [target, source] of Object.entries(SYMLINKS)) {
  const targetPath = path.join(CODEBUDDY_DIR, target);
  const sourcePath = path.join(CODEBUDDY_DIR, source);
  
  // 删除已存在的链接或目录
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
  
  // 创建符号链接或 Junction
  if (process.platform === 'win32') {
    const { execSync } = require('child_process');
    try {
      execSync(`mklink /J "${targetPath}" "${sourcePath}"`, { shell: true });
      console.log(`✅ Junction created: ${target}`);
    } catch (error) {
      console.error(`❌ Failed to create junction: ${target}`, error.message);
    }
  } else {
    try {
      fs.symlinkSync(sourcePath, targetPath, 'dir');
      console.log(`✅ Symlink created: ${target}`);
    } catch (error) {
      console.error(`❌ Failed to create symlink: ${target}`, error.message);
    }
  }
}
```

### 5.3 阶段 3: 更新 Agents 的 Model ID

**ECC Agent 示例** (agents/planner.md):
```yaml
---
name: planner
description: Expert planning specialist...
model: claude-3-opus-20240229
tools: [...]
---
```

**CodeBuddy Agent** (需更新 model):
```yaml
---
name: planner
description: Expert planning specialist...
model: claude-3-opus
tools: [...]
---
```

### 5.4 阶段 4: 转换 MCP 配置

**ECC MCP** (mcp-configs/mcp-servers.json):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "supabase": {...},
    ...
  }
}
```

**CodeBuddy MCP** (.codebuddy/.mcp.json):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "supabase": {...},
    ...
  }
}
```

**转换脚本**:
```javascript
const fs = require('fs');
const path = require('path');

const eccMcpPath = path.join(__dirname, '../mcp-configs/mcp-servers.json');
const codebuddyMcpPath = path.join(__dirname, '../.codebuddy/.mcp.json');

// 直接复制（结构相同）
const mcpConfig = JSON.parse(fs.readFileSync(eccMcpPath, 'utf-8'));
fs.writeFileSync(codebuddyMcpPath, JSON.stringify(mcpConfig, null, 2));

console.log('✅ MCP configuration converted');
```

### 5.5 阶段 5: 创建 settings.json (可选)

**位置**: `.codebuddy/settings.json`

**说明**: `settings.json` 是 CodeBuddy 的项目级配置文件，用于配置权限、环境变量、模型等。

**示例配置**:
```json
{
  "language": "简体中文",
  "model": "claude-3-5-sonnet",
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(npm:*)",
      "Read",
      "Edit"
    ],
    "ask": [
      "WebFetch",
      "Bash(docker:*)"
    ],
    "deny": [
      "Bash(rm:*)",
      "Bash(sudo:*)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  },
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "codebuddy:*"
  },
  "cleanupPeriodDays": 30,
  "includeCoAuthoredBy": false,
  "autoCompactEnabled": true,
  "enabledPlugins": {
    "everything-codebuddy@local": true
  }
}
```

**常用配置项说明**:

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `language` | 首选响应语言 | `"简体中文"` |
| `model` | 默认模型 | `"claude-3-5-sonnet"` |
| `permissions.allow` | 允许的工具/命令 | `["Read", "Edit", "Bash(git:*)"]` |
| `permissions.ask` | 需要确认的工具 | `["WebFetch"]` |
| `permissions.deny` | 禁止的工具/文件 | `["Read(.env)", "Bash(rm:*)"]` |
| `env` | 环境变量 | `{"NODE_ENV": "development"}` |
| `cleanupPeriodDays` | 聊天记录保留天数 | `30` |
| `includeCoAuthoredBy` | Git 提交是否添加 co-authored-by | `false` |
| `autoCompactEnabled` | 自动压缩功能 | `true` |
| `enabledPlugins` | 启用的插件 | `{"plugin-name@market": true}` |

**注意**: 此文件为可选配置，如果不创建则使用默认配置。完整配置选项参考 [CodeBuddy 设置文档](https://www.codebuddy.cn/docs/cli/settings)。

**注意**: 此文件为可选配置，如果不创建则使用默认配置。

### 5.6 阶段 6: 创建 plugin.json

**位置**: `.codebuddy-plugin/plugin.json`

```json
{
  "name": "everything-codebuddy",
  "version": "1.0.0",
  "description": "Complete collection of battle-tested CodeBuddy configs from an Anthropic hackathon winner - agents, skills, hooks, and rules evolved over 10+ months of intensive daily use",
  "author": {
    "name": "Affaan Mustafa",
    "url": "https://x.com/affaanmustafa"
  },
  "homepage": "https://github.com/affaan-m/everything-claude-code",
  "repository": "https://github.com/affaan-m/everything-claude-code",
  "license": "MIT",
  "keywords": [
    "codebuddy",
    "agents",
    "skills",
    "hooks",
    "rules",
    "tdd",
    "code-review",
    "security",
    "workflow",
    "automation",
    "best-practices"
  ],
  "skills": ["../.codebuddy/skills/", "../.codebuddy/commands/"],
  "agents": [
    "../.codebuddy/agents/architect.md",
    "../.codebuddy/agents/build-error-resolver.md",
    "../.codebuddy/agents/code-reviewer.md",
    "../.codebuddy/agents/database-reviewer.md",
    "../.codebuddy/agents/doc-updater.md",
    "../.codebuddy/agents/e2e-runner.md",
    "../.codebuddy/agents/go-build-resolver.md",
    "../.codebuddy/agents/go-reviewer.md",
    "../.codebuddy/agents/planner.md",
    "../.codebuddy/agents/python-reviewer.md",
    "../.codebuddy/agents/refactor-cleaner.md",
    "../.codebuddy/agents/security-reviewer.md",
    "../.codebuddy/agents/tdd-guide.md"
  ]
}
```

### 5.6 阶段 6: 创建 marketplace.json

**位置**: `.codebuddy-plugin/marketplace.json`

```json
{
  "name": "everything-codebuddy",
  "owner": {
    "name": "Affaan Mustafa",
    "email": "affaan@example.com"
  },
  "metadata": {
    "description": "Battle-tested CodeBuddy configurations from an Anthropic hackathon winner"
  },
  "plugins": [
    {
      "name": "everything-codebuddy",
      "source": "./",
      "description": "Complete collection of agents, skills, hooks, commands, and rules evolved over 10+ months of intensive daily use",
      "author": {
        "name": "Affaan Mustafa"
      },
      "homepage": "https://github.com/affaan-m/everything-claude-code",
      "repository": "https://github.com/affaan-m/everything-claude-code",
      "license": "MIT",
      "keywords": [
        "agents",
        "skills",
        "hooks",
        "commands",
        "tdd",
        "code-review",
        "security",
        "best-practices"
      ],
      "category": "workflow",
      "tags": [
        "agents",
        "skills",
        "hooks",
        "commands",
        "tdd",
        "code-review",
        "security",
        "best-practices"
      ]
    }
  ]
}
```

### 5.7 阶段 7: 创建 README.md

```markdown
# Everything Code Buddy for CodeBuddy

## 简介

ECC (Everything Code Buddy) 是经过 10+ 个月高强度日常使用演进的 Claude Code 配置生态系统。

本适配版本通过符号链接方式，将 ECC 完整集成到 CodeBuddy 架构中。

## 特性

- 🤖 13 个智能代理 (Agents)
- 🎯 53+ 个技能 (Skills)
- ⚡ 31 个命令 (Commands)
- 📜 28 条规则 (Rules)
- 🪝 6 类钩子 (Hooks)
- 🔌 14+ MCP 服务器集成

## 安装

1. 运行符号链接设置脚本:
```bash
node scripts/setup-codebuddy-links.js
```

2. 验证链接:
```bash
node scripts/verify-codebuddy-links.js
```

## 使用

### 直接本地使用

所有 ECC 组件可在项目中直接使用，无需额外配置。

### 插件发布

将 `.codebuddy` 目录打包发布为 CodeBuddy 插件。

## 组件列表

### Agents
- planner - 复杂功能规划
- architect - 系统架构设计
- code-reviewer - 代码审查
- security-reviewer - 安全审查
- tdd-guide - TDD 指导
- ... (共 13 个)

### Commands
- /plan - 功能规划
- /tdd - 测试驱动开发
- /code-review - 代码审查
- /security-scan - 安全扫描
- ... (共 31 个)

### Skills
- typescript - TypeScript 最佳实践
- react - React 开发模式
- security-review - 安全审查流程
- tdd-workflow - TDD 工作流
- ... (共 53+ 个)

## 文档

- [ECC 项目文档](https://github.com/affaan-m/everything-claude-code)
- [CodeBuddy 文档](https://www.codebuddy.cn/docs)

## 许可证

MIT
```

---

## 测试验证方案

### 6.1 验证符号链接

```bash
node scripts/verify-codebuddy-links.js
```

**预期输出**:
```
✅ agents: → ../agents
✅ commands: → ../commands
✅ skills: → ../skills
✅ rules: → ../rules
✅ hooks: → ../hooks
✅ scripts: → ../scripts
```

### 6.2 验证目录结构

```bash
# 检查 .codebuddy 目录
ls -la .codebuddy/

# 检查符号链接
ls -la .codebuddy/agents/
ls -la .codebuddy/commands/
ls -la .codebuddy/skills/
```

### 6.3 验证配置文件

```bash
# 验证 plugin.json
cat .codebuddy-plugin/plugin.json | jq .

# 验证 marketplace.json
cat .codebuddy-plugin/marketplace.json | jq .

# 验证 hooks.json
cat .codebuddy/hooks/hooks.json | jq .

# 验证 .mcp.json
cat .codebuddy/mcp.json | jq .
```

### 6.4 功能测试

| 场景 | 测试步骤 | 预期结果 |
|------|---------|---------|
| **Agent 调用** | 调用 `/task planner` | Agent 正确执行 |
| **Command 执行** | 调用 `/plan` | 命令正常响应 |
| **Skill 加载** | 触发技能场景 | 技能被识别 |
| **Hook 触发** | 触发 hook 事件 | Hook 正确执行 |
| **MCP 连接** | 连接 MCP 服务器 | 连接成功 |
| **同步测试** | 修改 agents/ 文件 | 链接自动同步 |

### 6.5 跨平台测试

| 平台 | 操作系统 | 符号链接 | 状态 |
|------|---------|---------|------|
| Linux | Ubuntu 22.04 | 原生支持 | ✅ 待测试 |
| macOS | macOS 14 | 原生支持 | ✅ 待测试 |
| Windows | Windows 11 | Junction 备选 | ✅ 待测试 |

---

## 风险和挑战

### 7.1 符号链接兼容性

**风险:**
- Windows 符号链接默认需要管理员权限
- 某些文件系统不支持符号链接

**应对:**
- 使用 Junction 作为 Windows 备选方案
- 提供详细错误处理和用户提示
- 提供回退方案（复制文件）

### 7.2 模型 ID 格式

**风险:**
- 不同的 CodeBuddy 版本可能使用不同的模型 ID 格式
- 模型 ID 可能因 API 更新而变化

**应对:**
- 使用最通用的模型 ID 格式
- 提供版本兼容性说明
- 考虑使用别名或配置文件管理模型 ID

### 7.3 Hooks 事件名称

**风险:**
- 不同的 CodeBuddy 版本可能使用不同的事件名称
- 事件参数可能不同

**应对:**
- 使用最通用的事件名称
- 提供事件名称映射表
- 考虑使用事件别名或配置文件

### 7.4 平台差异

**风险:**
- 不同平台的路径处理可能不同
- 文件权限可能不同
- 环境变量处理可能不同

**应对:**
- 使用 Node.js 的 `path` 模块处理路径
- 提供平台特定的错误处理
- 提供详细的平台测试方案

### 7.5 用户迁移成本

**风险:**
- 用户需要学习新的配置方式
- 现有的 ECC 配置可能无法直接迁移

**应对:**
- 提供详细的迁移指南
- 提供自动化迁移脚本
- 提供回退方案

---

## 回滚方案

如果迁移出现问题，可以按以下步骤回滚：

### 8.1 删除符号链接

```bash
# Linux/macOS
rm .codebuddy/agents
rm .codebuddy/commands
rm .codebuddy/skills
rm .codebuddy/rules
rm .codebuddy/hooks
rm .codebuddy/scripts

# Windows
rmdir .codebuddy\agents
rmdir .codebuddy\commands
rmdir .codebuddy\skills
rmdir .codebuddy\rules
rmdir .codebuddy\hooks
rmdir .codebuddy\scripts
```

### 8.2 恢复原始结构

```bash
# 如果需要，可以恢复复制方式的配置
node scripts/migrate-to-codebuddy.js --copy-only
```

### 8.3 删除 .codebuddy 目录

```bash
# Linux/macOS
rm -rf .codebuddy
rm -rf .codebuddy-plugin

# Windows
rmdir .codebuddy /s /q
rmdir .codebuddy-plugin /s /q
```

---

## 附录

### A. 完整文件列表

#### Agents (13 个)
- planner.md
- architect.md
- code-reviewer.md
- security-reviewer.md
- tdd-guide.md
- e2e-runner.md
- build-error-resolver.md
- go-build-resolver.md
- go-reviewer.md
- python-reviewer.md
- refactor-cleaner.md
- database-reviewer.md
- doc-updater.md

#### Commands (31 个)
- plan.md
- tdd.md
- code-review.md
- security-scan.md
- e2e.md
- build-fix.md
- go-build.md
- go-review.md
- go-test.md
- ... (共 31 个)

#### Skills (53+ 个)
- typescript/
- react/
- python/
- golang/
- security-review/
- tdd-workflow/
- ... (共 53+ 个)

#### Rules (28 条)
- common/
- typescript/
- python/
- golang/
- ... (共 28 条)

### B. 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `CODEBUDDY_PROJECT_DIR` | 项目根目录 | 自动检测 |
| `CODEBUDDY_PLUGIN_ROOT` | 插件根目录 | `.codebuddy` |
| `CODEBUDDY_USER_DIR` | 用户配置目录 | `~/.codebuddy` 或用户配置 |

---

**文档版本:** v1.0  
**最后更新:** 2026-02-18  
**维护者:** ECC 项目组
