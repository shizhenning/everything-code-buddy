# Everything Claude Code 适配 CodeBuddy 完整指南

> 将 ECC (Everything Claude Code) 配置迁移到腾讯云 CodeBuddy 编程助手

[![CodeBuddy](https://img.shields.io/badge/CodeBuddy-v2.50+-blue)](https://www.codebuddy.cn)
[![ECC](https://img.shields.io/badge/ECC-v1.4.1-orange)](https://github.com/affaan-m/everything-claude-code)

---

## 📋 目录

1. [迁移概览](#迁移概览)
2. [架构对比](#架构对比)
3. [迁移方法](#迁移方法)
4. [组件适配说明](#组件适配说明)
5. [迁移后检查](#迁移后检查)
6. [故障排除](#故障排除)
7. [最佳实践](#最佳实践)
8. [资源与支持](#资源与支持)

---

## 迁移概览

### 为什么选择 CodeBuddy?

| 特性 | Claude Code | CodeBuddy |
|------|-------------|------------|
| **多模型支持** | 主要为 Claude | Claude、GPT、Gemini、DeepSeek、混元等多模型 |
| **中文支持** | 原生有限 | 完整中文文档和本地化支持 |
| **云开发集成** | 需要额外配置 | 内置腾讯云开发 (CloudBase) 集成 |
| **企业级特性** | 有限 | 完整的权限系统、审计日志、团队协作 |
| **国内网络** | 可能受限 | 国内优化,访问更稳定 |
| **成本优化** | 基础 | Token 优化策略、缓存机制 |

### 迁移范围

ECC 包含以下组件,均可迁移到 CodeBuddy:

- ✅ **13 个专业 Agents** (planner, architect, code-reviewer 等)
- ✅ **31 个斜杠 Commands** (plan, tdd, code-review 等)
- ✅ **37 个领域 Skills** (frontend-patterns, backend-patterns 等)
- ✅ **规则集** (common + typescript/python/golang)
- ✅ **Hooks 配置** (PreToolUse, PostToolUse 等)
- ✅ **MCP 服务器配置**
- ✅ **Hook 脚本**

---

## 架构对比

### 目录结构对比

```
Claude Code                    CodeBuddy
├── .claude/                   ├── .codebuddy/
│   ├── agents/              │   ├── agents/
│   ├── commands/             │   ├── commands/
│   ├── skills/              │   ├── skills/
│   ├── rules/               │   ├── rules/
│   ├── settings.json         │   ├── settings.json
│   └── session.jsonl         │   └── session.jsonl
└── .claude-plugin/          └── .codebuddy-plugin/
    ├── plugin.json           │   ├── plugin.json
    └── marketplace.json      │   └── marketplace.json
```

### 配置文件差异

| 配置项 | Claude Code | CodeBuddy |
|--------|-------------|-------------|
| **插件配置** | `.claude-plugin/plugin.json` | `.codebuddy-plugin/plugin.json` |
| **市场配置** | `.claude-plugin/marketplace.json` | `.codebuddy-plugin/marketplace.json` |
| **环境变量** | `CLAUDE_*` | `CODEBUDDY_*` |
| **Hook 路径** | `${CLAUDE_PLUGIN_ROOT}` | `${CODEBUDDY_PLUGIN_ROOT}` |
| **MCP 配置** | `.claude.json` | `.codebuddy/settings.json` (mcpServers 字段) |
| **权限系统** | 简单 allow/ask | 5 级权限 (allow/deny/ask/accept/bypass) |

---

## 迁移方法

### 方法 1: 自动迁移脚本 (推荐 - 复制方式)

使用提供的自动迁移脚本将文件复制到目标项目:

```bash
# 确保在 ECC 项目根目录
cd everything-claude-code

# 运行迁移脚本
node scripts/migrate-to-codebuddy.js

# 查看迁移报告
cat .codebuddy/MIGRATION_REPORT.md
```

**脚本功能**:
- ✅ 自动创建 `.codebuddy/` 目录结构
- ✅ 复制所有 agents、commands、skills
- ✅ 转换 hooks.json 到 CodeBuddy 格式
- ✅ 复制 rules 并生成安装指南
- ✅ 更新脚本中的环境变量
- ✅ 生成详细的迁移报告

### 方法 1.5: Junction 链接方式 (Windows 推荐) ⭐

使用 Junction 链接实时引用 ECC 配置，无需创建目录或复制文件:

```powershell
# 从 ECC 项目根目录运行
.\scripts\link-ecc-to-project.ps1 -TargetProjectPath "D:\path\to\your\project"

# 示例: 链接到当前项目
.\scripts\link-ecc-to-project.ps1 -TargetProjectPath "d:\ugit\everything-code-buddy"
```

**链接脚本功能**:
- ✅ 使用已存在的目录结构（agents, commands, skills, rules, scripts, hooks）
- ✅ 创建 Windows Junction 链接
- ✅ 不占用额外磁盘空间（无需复制）
- ✅ ECC 更改实时同步到目标项目
- ✅ 支持删除和重建链接
- ✅ 智能跳过普通目录（不覆盖用户数据）

**优势**:
- 🚀 零复制 - 不占用额外空间
- 🔄 实时同步 - ECC 的更改立即反映在目标项目
- 🛡️ 安全 - 删除链接不影响源目录
- 🎯 适合开发 - ECC 作为主配置源，多个项目共享

**注意事项**:
- 仅支持 Windows (Junction 特性)
- 需要在 ECC 项目中保持配置文件
- 通过链接删除文件会同步删除源文件

### 方法 2: 手动迁移

如果需要更多控制,可以手动复制文件:

```bash
# 1. 创建 CodeBuddy 目录
mkdir -p .codebuddy/{agents,commands,skills,rules,mcp-configs,scripts}

# 2. 复制组件
cp agents/*.md .codebuddy/agents/
cp commands/*.md .codebuddy/commands/
cp -r skills/* .codebuddy/skills/
cp -r rules/* .codebuddy/rules/
cp -r mcp-configs/* .codebuddy/mcp-configs/
cp -r scripts/* .codebuddy/scripts/

# 3. 手动转换 hooks (参考下面的 Hooks 适配章节)
```

---

## 组件适配说明

### 1. Agents 适配 ✅ 完全兼容

**无需修改** - Claude Code 和 CodeBuddy 的 agent 格式完全兼容。

**Agent 定义示例**:
```yaml
---
name: planner
description: Expert planning specialist
tools: ["Read", "Grep", "Glob"]
model: opus
---

You are an expert planning specialist...
```

**CodeBuddy 中的使用**:
```bash
codebuddy "委托 planner 来规划这个功能"
```

### 2. Commands 适配 ⚠️ 需检查

**基本格式兼容**,但需要检查以下内容:

#### 需要调整的地方:

1. **路径引用** - 将 `.claude/` 替换为 `.codebuddy/`
2. **环境变量** - 将 `CLAUDE_*` 替换为 `CODEBUDDY_*`
3. **模型引用** - CodeBuddy 支持更多模型

**示例调整**:

```markdown
<!-- Claude Code -->
参见: ~/.claude/agents/planner.md

<!-- CodeBuddy -->
参见: ~/.codebuddy/agents/planner.md
```

### 3. Skills 适配 ✅ 完全兼容

**无需修改** - Skill 格式完全相同。

**CodeBuddy 会自动加载**:
- 项目级 skills: `.codebuddy/skills/*/SKILL.md`
- 用户级 skills: `~/.codebuddy/skills/*/SKILL.md`

**调用 Skill**:
```bash
codebuddy "使用 frontend-patterns 技能优化这个组件"
```

### 4. Hooks 适配 ⚠️ 需要转换

#### Hook 事件映射

| Claude Code Hook | CodeBuddy Hook | 说明 |
|----------------|-----------------|------|
| PreToolUse | PreToolUse | 完全相同 |
| PostToolUse | PostToolUse | 完全相同 |
| Stop | Stop | 完全相同 |
| SessionStart | SessionStart | 完全相同 |
| SessionEnd | SessionEnd | 完全相同 |
| UserPromptSubmit | UserPromptSubmit | CodeBuddy 新增 |

#### Hooks 配置格式转换

**Claude Code 格式** (`.claude/settings.json`):
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/script.js"
          }
        ]
      }
    ]
  }
}
```

**CodeBuddy 格式** (`.codebuddy/settings.json`):
```json
{
  "permissions": {
    "Bash": "ask",
    "Edit": "accept",
    "Write": "accept"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CODEBUDDY_PLUGIN_ROOT}/script.js"
          }
        ]
      }
    ]
  },
  "mcpServers": {
    // MCP 配置也移到 settings.json
  }
}
```

**关键差异**:
- 环境变量: `CLAUDE_PLUGIN_ROOT` → `CODEBUDDY_PLUGIN_ROOT`
- 新增权限配置 (`permissions` 字段)
- MCP 配置位置不同

### 5. Rules 适配 ⚠️ 手动安装

CodeBuddy 的 rules 需要手动安装,无法通过插件自动分发。

#### 安装步骤:

```bash
# 项目级 rules (推荐用于当前项目)
mkdir -p .codebuddy/rules

# 1. 安装通用规则 (必须)
cp -r .codebuddy/rules/common/* .codebuddy/rules/

# 2. 安装语言特定规则 (根据你的技术栈)
cp -r .codebuddy/rules/typescript/* .codebuddy/rules/
# 或者
cp -r .codebuddy/rules/python/* .codebuddy/rules/
# 或者
cp -r .codebuddy/rules/golang/* .codebuddy/rules/
```

#### 用户级全局安装:

```bash
# 所有项目共享
mkdir -p ~/.codebuddy/rules

# 复制规则
cp -r .codebuddy/rules/common/* ~/.codebuddy/rules/
cp -r .codebuddy/rules/typescript/* ~/.codebuddy/rules/
```

**优先级**: 项目级 > 用户级

### 6. MCP 配置适配 ⚠️ 格式调整

#### 配置位置变化

**Claude Code** (`.claude.json`):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**CodeBuddy** (`.codebuddy/settings.json`):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**迁移方法**:
```bash
# 直接复制 mcp-configs 到 settings.json 的 mcpServers 字段
```

### 7. Scripts 适配 ⚠️ 环境变量更新

Hook 脚本中使用的环境变量需要更新:

```javascript
// Claude Code
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

// CodeBuddy
const pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT;
```

**批量替换**:
```bash
# 在所有脚本中替换
find .codebuddy/scripts -name "*.js" -exec sed -i 's/CLAUDE_PLUGIN_ROOT/CODEBUDDY_PLUGIN_ROOT/g' {} \;
```

---

## 迁移后检查

### 1. 目录结构验证

```bash
# 检查 .codebuddy 目录
ls -la .codebuddy/

# 应该看到:
# agents/
# commands/
# skills/
# rules/
# settings.json
# plugin.json
# mcp-configs/ (可选)
# scripts/ (可选)
# MIGRATION_REPORT.md
```

### 2. 组件计数检查

```bash
# Agents
ls -1 .codebuddy/agents/ | wc -l
# 期望: 13

# Commands
ls -1 .codebuddy/commands/ | wc -l
# 期望: 31

# Skills
find .codebuddy/skills/ -name "SKILL.md" | wc -l
# 期望: 37
```

### 3. 配置文件验证

```bash
# 检查 settings.json 格式
cat .codebuddy/settings.json | jq '.'

# 检查 plugin.json 格式
cat .codebuddy/plugin.json | jq '.'
```

### 4. 功能测试

```bash
# 测试 agent 委托
codebuddy "使用 planner 为用户认证功能制定计划"

# 测试 command
codebuddy /plan "实现 Stripe 订阅"

# 测试 skill
codebuddy "应用 frontend-patterns 技能优化这个组件"

# 测试 hooks (创建文件触发 PostToolUse)
echo "test" > test.txt
rm test.txt  # 触发 hook
```

---

## 故障排除

### 问题 1: Agents 未找到

**症状**: 命令提示 "Agent not found"

**解决**:
```bash
# 检查 agent 文件是否存在
ls -la .codebuddy/agents/

# 检查 agent 文件格式 (需要 YAML frontmatter)
head -5 .codebuddy/agents/planner.md

# 应该以 --- 开头
```

### 问题 2: Commands 不工作

**症状**: 输入 `/plan` 无响应

**解决**:
```bash
# 检查 command 文件
ls -la .codebuddy/commands/plan.md

# 检查文件格式
cat .codebuddy/commands/plan.md

# 确保以 --- 开头 (description)
head -3 .codebuddy/commands/plan.md
```

### 问题 3: Hooks 未触发

**症状**: 编辑文件后 hook 没有执行

**解决**:
```bash
# 检查 settings.json 中的 hooks 配置
cat .codebuddy/settings.json | jq '.hooks'

# 检查脚本路径是否正确
ls -la .codebuddy/scripts/

# 测试手动运行 hook
node .codebuddy/scripts/post-edit-format.js
```

### 问题 4: MCP 服务器无法连接

**症状**: MCP 工具未加载

**解决**:
```bash
# 检查 MCP 配置
cat .codebuddy/settings.json | jq '.mcpServers'

# 测试 MCP 服务器是否可运行
npx -y @modelcontextprotocol/server-github --help

# 检查环境变量
echo $GITHUB_TOKEN
```

### 问题 5: Rules 未生效

**症状**: 编码风格未被遵守

**解决**:
```bash
# 检查 rules 是否安装
ls -la .codebuddy/rules/

# 检查规则文件格式
cat .codebuddy/rules/common/coding-style.md

# 手动触发规则加载
codebuddy /reload
```

---

## 最佳实践

### 1. 渐进式迁移

不要一次性完全切换,建议:

**阶段 1**: 并行使用 (1-2 周)
- 保持 Claude Code 配置
- 同时设置 CodeBuddy
- 对比体验和效果

**阶段 2**: 部分迁移 (2-4 周)
- 新项目使用 CodeBuddy
- 现有项目继续用 Claude Code
- 验证关键功能

**阶段 3**: 完全迁移 (之后)
- 所有项目迁移到 CodeBuddy
- 保留 Claude Code 作为备份

### 2. 保持兼容性

如果需要同时支持两个平台:

```bash
# 目录结构
project/
├── .claude/              # Claude Code 配置
├── .codebuddy/          # CodeBuddy 配置
└── source/               # 源代码
```

使用时切换工作目录:
```bash
# 使用 Claude Code
cd project && claude

# 使用 CodeBuddy
cd project && codebuddy
```

### 3. 利用 CodeBuddy 独有特性

迁移后,充分利用 CodeBuddy 的优势:

#### 多模型支持

```bash
# 快速任务 (低延迟)
codebuddy /model gemini-flash
codebuddy "写一个简单函数"

# 复杂推理 (高质量)
codebuddy /model claude-opus
codebuddy "架构设计这个系统"

# 代码生成 (专业)
codebuddy /model deepseek-coder
codebuddy "实现这个算法"
```

#### 腾讯云集成

```bash
# CloudBase 函数
codebuddy "创建一个云函数处理用户认证"

# CloudBase 数据库
codebuddy "设计 CloudBase 数据库表结构"

# CloudBase 存储
codebuddy "配置文件上传到 CloudBase 存储"
```

#### 性能优化

```bash
# Token 优化设置
cat > ~/.codebuddy/settings.json << EOF
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE": "50"
  }
}
EOF
```

### 4. 团队协作

为团队共享配置:

```bash
# 1. Fork ECC 仓库
# 2. 创建团队配置分支
git checkout -b team/codebuddy-config

# 3. 添加团队特定的 rules/skills
mkdir -p .codebuddy/team-rules
mkdir -p .codebuddy/team-skills

# 4. 提交并分享
git add .codebuddy/
git commit -m "Add CodeBuddy team configs"
git push origin team/codebuddy-config
```

团队成员安装:
```bash
git clone your-fork/everything-claude-code.git
cd everything-claude-code
node scripts/migrate-to-codebuddy.js
```

---

## 进阶主题

### A. 自定义 Commands

为团队创建专属 commands:

```markdown
---
description: Deploy to staging environment
---

# Deploy Staging

部署到测试环境的自定义命令。

## 使用方法

\`\`\`bash
codebuddy /deploy-staging
\`\`\`

## 执行步骤

1. 运行测试
2. 构建项目
3. 部署到 staging
4. 运行烟雾测试
5. 通知团队
```

### B. 自定义 Skills

创建领域特定 skills:

```markdown
---
name: company-backend-patterns
description: Company's backend architecture patterns and standards
---

# Company Backend Patterns

公司后端开发的标准模式。

## 核心原则

1. 所有 API 使用统一的错误处理
2. 数据库查询必须有索引
3. 敏感数据必须加密存储

## 示例代码

[...]
```

### C. 多环境配置

```bash
# 开发环境
.codebuddy/dev.settings.json

# 生产环境
.codebuddy/prod.settings.json

# 切换环境
export CODEBUDDY_SETTINGS=.codebuddy/prod.settings.json
codebuddy
```

---

### 7. Scripts 适配 ⚠️ 环境变量更新

Hook 脚本中使用的环境变量需要更新:

```javascript
// Claude Code
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;

// CodeBuddy
const pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT;
```

**批量替换**:
```bash
# 在所有脚本中替换
find .codebuddy/scripts -name "*.js" -exec sed -i 's/CLAUDE_PLUGIN_ROOT/CODEBUDDY_PLUGIN_ROOT/g' {} \;
```

### 8. Continuous Learning v2 适配 ✅ 完全兼容

**概述**: Continuous Learning v2 是基于 instinct（本能）的学习系统，自动从会话中学习模式并演化为技能。

**关键特性**:
- ✅ 自动观察会话并记录模式
- ✅ 本能评分系统（置信度评分）
- ✅ 自动演化为技能 (`/evolve` 命令）
- ✅ 跨平台路径支持

#### Instinct CLI 工具

**位置**: `skills/continuous-learning-v2/scripts/instinct-cli.py`

**常用命令**:
```bash
# 查看本能状态
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status

# 导入观察数据
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" import

# 演化为技能
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve

# 导出备份
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" export
```

#### Observer Agent

**功能**: 自动观察会话并记录工具使用模式。

**触发方式**:
- PreToolUse hook: 捕获工具调用前
- PostToolUse hook: 捕获工具调用后
- Stop hook: 触发 observer 分析并生成报告

**配置**:
```json
// .codebuddy/hooks/hooks.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/observe.js\" pre",
            "async": true
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/observe.js\" post",
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/run-observer-on-stop.js\"",
            "async": false
          }
        ]
      }
    ]
  }
}
```

#### 数据目录结构

```
.codebuddy/sessions/
├── observations/
│   ├── session_*.jsonl    # 观察数据
├── instincts/
│   ├── instinct_*.json     # 本能数据
└── reports/
    └── session_*.md        # 观察报告
```

#### CodeBuddy 路径配置

**环境变量**:
```bash
CODEBUDDY_PROJECT_DIR=/path/to/project
CODEBUDDY_PLUGIN_ROOT=/path/to/ecc/.codebuddy
```

**路径优先级**:
1. `CODEBUDDY_PROJECT_DIR` (项目级)
2. `CODEBUDDY_PLUGIN_ROOT` (插件根目录)
3. 遗留路径 (~/.claude/)

**示例**:
```python
# Python CLI 自动使用环境变量
from pathlib import Path
import os

class CodeBuddyPaths:
    def __init__(self):
        self.project_dir = Path(os.getenv('CODEBUDDY_PROJECT_DIR', Path.cwd()))
        self.plugin_root = Path(os.getenv('CODEBUDDY_PLUGIN_ROOT', Path.home() / '.codebuddy'))
```

#### 迁移注意事项

1. **Observer 路径**: Observer agent 从 `agents/observer.md` 移至 `agents/` 根目录
2. **Hooks 配置**: 所有 hooks 使用 `CODEBUDDY_PLUGIN_ROOT` 环境变量
3. **数据迁移**: 可选迁移 `~/.claude/observations/` 到 `.codebuddy/sessions/observations/`
4. **向后兼容**: 保留 `~/.claude/` 路径作为 fallback

#### 测试验证

```bash
# 1. 检查 observer hooks 配置
cat .codebuddy/hooks/hooks.json | jq '.hooks.PreToolUse'

# 2. 测试观察功能
codebuddy "写一个测试文件"
# 编辑完成后查看观察报告
cat .codebuddy/sessions/reports/session_*.md

# 3. 测试 instinct CLI
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status

# 4. 测试演化功能
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve
```

---

## 资源与支持

### 文档

- **CodeBuddy 官方文档**: https://www.codebuddy.cn/docs/cli/overview
- **CodeBuddy API 参考**: https://www.codebuddy.cn/docs/api
- **ECC GitHub**: https://github.com/affaan-m/everything-claude-code
- **迁移脚本**: `scripts/migrate-to-codebuddy.js`
- **Windows 兼容性**: `docs/WINDOWS_COMPATIBILITY.md`
- **Continuous Learning v2**: `skills/continuous-learning-v2/CL-README.md`

### 社区

- **CodeBuddy 社区**: https://community.codebuddy.cn
- **ECC Issues**: https://github.com/affaan-m/everything-claude-code/issues
- **讨论论坛**: [添加链接]

### 问题报告

遇到迁移问题时:

1. 查看 `.codebuddy/MIGRATION_REPORT.md`
2. 检查本文档的故障排除章节
3. 搜索现有 issues
4. 创建新 issue 并附上:
   - MIGRATION_REPORT.md
   - 错误日志
   - CodeBuddy 版本 (`codebuddy --version`)
   - 操作系统信息

---

## 总结

### 迁移清单

- [ ] 运行自动迁移脚本 (`node scripts/migrate-to-codebuddy.js`)
- [ ] 阅读迁移报告 (`.codebuddy/MIGRATION_REPORT.md`)
- [ ] 安装 rules (参考 `.codebuddy/rules/INSTALL.md`)
- [ ] 检查 settings.json 配置
- [ ] 测试核心 agents
- [ ] 测试核心 commands
- [ ] 测试 hooks 触发
- [ ] 验证 MCP 连接
- [ ] 阅读最佳实践并制定迁移计划
- [ ] 团队培训和文档

### 预期收益

迁移完成后,您将获得:

✅ **多模型支持** - 根据任务选择最优模型
✅ **中文本地化** - 完整的中文文档和支持
✅ **云开发集成** - 腾讯云开发无缝对接
✅ **更好的性能** - Token 优化和缓存机制
✅ **企业特性** - 权限管理、审计日志
✅ **稳定访问** - 国内网络优化

---

**祝迁移顺利!** 🎉

如有问题,请参考本文档或联系支持。
