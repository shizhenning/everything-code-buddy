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
- 🔌 15+ MCP 服务器集成

## 安装

1. 运行符号链接设置脚本:
```bash
node scripts/setup-codebuddy-links.js
```

2. 转换 MCP 配置:
```bash
node scripts/convert-mcp-config.js
```

3. 验证配置:
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

| 名称 | 描述 |
|------|------|
| planner | 复杂功能规划 |
| architect | 系统架构设计 |
| code-reviewer | 代码审查 |
| security-reviewer | 安全审查 |
| tdd-guide | TDD 指导 |
| e2e-runner | E2E 测试 |
| build-error-resolver | 构建错误解决 |
| go-build-resolver | Go 构建问题解决 |
| go-reviewer | Go 代码审查 |
| python-reviewer | Python 代码审查 |
| refactor-cleaner | 重构清理 |
| database-reviewer | 数据库审查 |
| doc-updater | 文档更新 |

### Commands

| 名称 | 描述 |
|------|------|
| /plan | 功能规划 |
| /tdd | 测试驱动开发 |
| /code-review | 代码审查 |
| /security-scan | 安全扫描 |
| /e2e | E2E 测试 |
| /build-fix | 构建修复 |
| /go-build | Go 构建 |
| /go-review | Go 代码审查 |
| /go-test | Go 测试 |
| /instinct-status | 查看本能状态 |
| /instinct-export | 导出本能 |
| /instinct-import | 导入本能 |
| /learn | 持续学习 |

### Skills

- typescript - TypeScript 最佳实践
- react - React 开发模式
- python - Python 开发规范
- golang - Go 语言指南
- security-review - 安全审查流程
- tdd-workflow - TDD 工作流
- continuous-learning-v2 - 持续学习系统
- ... (共 53+ 个)

### Rules

- common - 通用规则
- typescript - TypeScript 规则
- python - Python 规则
- golang - Go 语言规则
- ... (共 28 条)

### Hooks

- PreToolUse - 工具调用前
- PostToolUse - 工具调用后
- SessionStart - 会话开始
- SessionEnd - 会话结束
- Stop - 响应完成
- PreCompact - 压缩前

## 文档

- [ECC 项目文档](https://github.com/affaan-m/everything-claude-code)
- [CodeBuddy 文档](https://www.codebuddy.cn/docs)
- [适配方案](../../docs/ECC到CodeBuddy适配方案-v1.0.md)

## 许可证

MIT
