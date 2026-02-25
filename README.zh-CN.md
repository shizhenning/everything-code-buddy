# Everything Claude Code - CodeBuddy 适配版

[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![Forks](https://img.shields.io/github/forks/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/network/members)
[![Contributors](https://img.shields.io/github/contributors/affaan-m/everything-claude-code/graphs/contributors)](https://github.com/affaan-m/everything-claude-code/graphs/contributors)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white)
![Go](https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white)
![Java](https://img.shields.io/badge/-Java-ED8B00?logo=openjdk&logoColor=white)

---

## CodeBuddy 适配

本项目现已完全适配 CodeBuddy，支持国产模型！

### 适配内容

| 组件 | 数量 | 状态 |
|------|------|------|
| Agents | 18 个 | ✅ 使用国产模型 |
| Commands | 32 个 | ✅ 已适配 |
| Skills | 58 个 | ✅ 已适配 |
| Rules | 24 个 | ✅ 已适配 |
| Hooks | 6 类事件 | ✅ 已适配 |

### 使用的国产模型

- **glm-5.0** (智谱 AI) - 用于规划、架构、数据库设计
- **kimi-k2.5** (Moonshot AI) - 用于代码审查、测试分析
- **deepseek-v3.2** (DeepSeek) - 用于安全审查
- **glm-flash** (智谱 AI) - 用于文档更新

### 新增 Agents

1. **requirements-analyzer** - 需求完整性分析
2. **frontend-analyzer** - 前端 UI/UX 分析
3. **backend-analyzer** - 后端架构分析
4. **test-analyzer** - 测试策略设计
5. **database-designer** - 数据库架构设计

### 新增 Multi-Commands

1. **/multi-frontend** - 前端开发多 Agent 协同
2. **/multi-backend** - 后端开发多 Agent 协同
3. **/multi-testing** - 测试策略多 Agent 协同

### 目录结构

```
.codebuddy/
├── agents/          # 18 个 Agents
├── commands/        # 32 个 Commands
├── skills/          # 58 个 Skills
├── rules/           # 24 个 Rules
├── scripts/         # 26 个脚本
├── homunculus/      # 持续学习数据目录
├── CODEBUDDY.md     # 项目指南
└── settings.json    # Hooks 配置
```

### 使用方法

所有配置已适配到 `.codebuddy/` 目录，直接使用即可：

```bash
# 使用 Agent 协同开发
/multi-frontend <前端任务>
/multi-backend <后端任务>
/multi-testing <测试任务>

# 使用标准 Commands
/plan <任务描述>
/tdd <功能描述>
/code-review
/e2e <测试场景>
```

### 相关文档

- [CodeBuddy 适配方案](docs/codebuddy适配方案.md)
- [CodeBuddy 适配完成总结](docs/CodeBuddy适配完成总结.md)
- [CodeBuddy 体系结构文档](docs/CodeBuddy体系结构文档.md)

---

## 原始 README

以下是原始的 Everything Claude Code 说明（适用于 Claude Code 平台）：

### 指南

这个仓库只包含原始代码。指南解释了一切。

| 主题 | 你将学到什么？|
|-------|-------------------|
| Token 优化 | 模型选择、系统提示简洁、后进先出 |
| 内存持久化 | 自动会话保存、加载上下文的钩子 |
| 持续学习 | 从会话中自动提取模式到可重用的技能 |
| 验证循环 | 检查点 vs 持续评论、评估器类型、pass@k 指标 |
| 并行化 | Git worktrees、级联方法、实时扩展实例 |
| 子代理编辑 | 上下文问题、令牌成本、检索模式 |

### 快速开始

在 2 分钟内快速上手：

#### 第一步：安装插件

```bash
# 添加市场
/plugin marketplace add affaan-m/everything-claude-code

# 安装插件
/plugin install everything-claude-code@everything-claude-code
```

#### 第二步：安装规则（必需）

> ⚠️ **重要提示**：Claude Code 插件无法自动分发 `rules`，需要手动安装：

```bash
# 在项目根目录执行
git clone https://github.com/affaan-m/everything-claude-code.git
cp -r everything-claude-code/rules ~/.claude/rules/
cp everything-claude-code/CLAUDE.md ~/.claude/
```

### 核心功能

#### 1. Agents（代理）

专业子代理用于任务委托：

- **planner** - 复杂功能的规划专家
- **architect** - 软件架构专家
- **code-reviewer** - 代码审查专家
- **tdd-guide** - 测试驱动开发专家
- **security-reviewer** - 安全审查专家
- **database-reviewer** - 数据库专家
- **e2e-runner** - 端到端测试专家
- **doc-updater** - 文档更新专家

#### 2. Commands（命令）

斜杠命令快速启动工作流：

- `/plan` - 实现计划
- `/tdd` - 测试驱动开发
- `/code-review` - 代码质量审查
- `/e2e` - 生成和运行 E2E 测试
- `/build-fix` - 修复构建错误
- `/learn` - 从会话中提取模式
- `/skill-create` - 从 git 历史生成技能

#### 3. Skills（技能）

领域知识和工作流定义：

- **coding-standards** - 通用编码标准
- **frontend-patterns** - 前端开发模式
- **backend-patterns** - 后端架构模式
- **security-review** - 安全审查流程
- **tdd-workflow** - TDD 工作流
- **verification-loop** - 验证循环

#### 4. Hooks（钩子）

自动化触发器：

- **PreToolUse** - 工具使用前检查
- **SessionStart** - 会话开始时加载上下文
- **PostToolUse** - 工具使用后处理
- **SessionEnd** - 会话结束时持久化
- **Stop** - 响应结束时检查

### 配置说明

#### Agents 格式

```markdown
---
name: planner
description: Expert planning specialist
tools: ["Read", "Grep", "Glob"]
model: opus
---

You are an expert planning specialist...
```

#### Commands 格式

```markdown
---
description: Plan implementation
---

# Plan Command

This command invokes the **planner** agent...
```

#### Skills 格式

```markdown
---
name: coding-standards
description: Universal coding standards
---

# Coding Standards

## When to Use
...

## How It Works
...

## Examples
...
```

### 贡献指南

请遵循 `CONTRIBUTING.md` 中的格式：

- **Agents**: Markdown 带 frontmatter (name, description, tools, model)
- **Skills**: 清晰的分节 (When to Use, How It Works, Examples)
- **Commands**: Markdown 带 description frontmatter
- **Hooks**: JSON 带 matcher 和 hooks 数组

文件命名：小写带连字符（例如 `python-reviewer.md`）

### 许可证

MIT License
