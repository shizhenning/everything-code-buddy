# Multi-Model Commands - 当前状态说明

**最后更新:** 2026-02-18
**状态:** ⚠️ 需要适配才能使用

---

## 概述

`multi-*` 系列命令原设计用于多模型协作开发（Claude + Codex + Gemini），但在 CodeBuddy 环境中需要适配才能使用。

## 当前状态

| 命令 | 状态 | 说明 |
|------|------|------|
| `/multi-plan` | ⚠️ 依赖缺失 | 需要 `codeagent-wrapper` 脚本 |
| `/multi-execute` | ⚠️ 依赖缺失 | 需要 `codeagent-wrapper` 脚本 |
| `/multi-frontend` | ⚠️ 依赖缺失 | 需要 `codeagent-wrapper` 脚本 |
| `/multi-backend` | ⚠️ 依赖缺失 | 需要 `codeagent-wrapper` 脚本 |
| `/multi-workflow` | ⚠️ 依赖缺失 | 需要 `codeagent-wrapper` 脚本 |

## 缺失依赖

以下依赖当前不存在，需要用户自行提供：

```
~/.codebuddy/
├── bin/
│   └── codeagent-wrapper          # 核心包装脚本（缺失）
└── .ccg/
    └── prompts/
        ├── codex/
        │   ├── analyzer.md       # Codex 分析提示词（缺失）
        │   ├── architect.md      # Codex 架构提示词（缺失）
        │   └── reviewer.md       # Codex 审查提示词（缺失）
        └── gemini/
            ├── analyzer.md       # Gemini 分析提示词（缺失）
            ├── architect.md      # Gemini 架构提示词（缺失）
            └── reviewer.md       # Gemini 审查提示词（缺失）
```

## 替代方案

### 方案 1：使用本地化版本（推荐）

查看 [multi-commands-local-adapter.md](./multi-commands-local-adapter.md) 了解如何将 multi 命令改造为不依赖外部模型的本地版本。

### 方案 2：使用单模型命令

使用以下替代命令：

| 原 multi 命令 | 替代命令 |
|-------------|---------|
| `/multi-plan` | `/plan` + `planner` agent |
| `/multi-execute` | `/code-review` + 手动执行 |
| `/multi-workflow` | `/plan` → `/tdd` → `/code-review` |
| `/multi-frontend` | `frontend-patterns` skill |
| `/multi-backend` | `backend-patterns` skill |

### 方案 3：自行配置（高级用户）

如果需要使用原版多模型协作，需要：

1. **获取 codeagent-wrapper 脚本**
   - 从原始 Claude Code 配置获取
   - 或自行实现 API 调用封装

2. **创建角色提示词**
   - 在 `~/.codebuddy/.ccg/prompts/` 目录下创建
   - 参考 multi 命令文件中的 ROLE_FILE 路径

3. **配置 API 密钥**
   - OpenAI API（用于 Codex）
   - Google Cloud API（用于 Gemini）

## 快速参考

### 可用的结构化命令

| 命令 | 功能 |
|------|------|
| `/plan` | 功能规划（使用 planner agent） |
| `/tdd` | 测试驱动开发 |
| `/code-review` | 代码审查 |
| `/security-scan` | 安全扫描 |
| `/build-fix` | 构建错误修复 |

### 相关 Skills

- `planner` agent - 复杂功能规划
- `architect` agent - 系统架构设计
- `frontend-patterns` - 前端最佳实践
- `backend-patterns` - 后端最佳实践
- `security-review` - 安全检查清单

## 问题反馈

如果需要本地化改造 multi 命令，请参考 `docs/multi-commands-local-adapter.md` 文档。

---

**注意:** CodeBuddy 当前的 Bash 工具限制可能不支持直接调用外部模型 API。建议使用方案 1（本地化改造）或方案 2（使用替代命令）。
