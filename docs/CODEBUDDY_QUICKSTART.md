# ECC to CodeBuddy 快速开始

> 5 分钟开始使用 ECC 的 CodeBuddy 适配版

---

## 🚀 一键安装

### 前置要求

- ✅ 已安装 [CodeBuddy CLI](https://www.codebuddy.cn/docs/install)
- ✅ Node.js 18+
- ✅ Everything Claude Code 源码

### 安装步骤

```bash
# 1. 克隆或进入 ECC 项目目录
cd everything-claude-code

# 2. 运行自动迁移脚本
node scripts/migrate-to-codebuddy.js

# 3. 安装 rules (必须)
mkdir -p .codebuddy/rules
cp -r .codebuddy/rules/common/* .codebuddy/rules/
cp -r .codebuddy/rules/typescript/* .codebuddy/rules/  # 根据你的技术栈选择

# 4. 完成! 开始使用
codebuddy
```

**就这么简单!** 🎉

---

## 📋 安装后验证

### 检查目录

```bash
# 应该看到这些目录
ls -la .codebuddy/
# agents/
# commands/
# skills/
# rules/
# settings.json
# plugin.json
# scripts/
# MIGRATION_REPORT.md
```

### 快速测试

```bash
# 测试 1: Planner agent
codebuddy "使用 planner 规划一个用户登录功能"

# 测试 2: TDD command
codebuddy /tdd

# 测试 3: Frontend skill
codebuddy "使用 frontend-patterns 技能优化这个组件"
```

---

## 🎯 常用命令速查

### 功能规划

```bash
codebuddy /plan "实现 Stripe 订阅"
codebuddy "使用 planner 为这个功能制定计划"
```

### 开发模式

```bash
codebuddy /tdd              # TDD 工作流
codebuddy "使用 tdd-guide 指导我"
```

### 代码审查

```bash
codebuddy /code-review
codebuddy "使用 code-reviewer 审查这个文件"
codebuddy /security-scan
```

### 构建修复

```bash
codebuddy /build-fix
codebuddy /go-build
```

### 模式提取

```bash
codebuddy /learn              # 从会话提取模式
codebuddy /skill-create       # 从 git 生成 skills
codebuddy /instinct-status     # 查看学习的模式
```

---

## 🔧 配置优化

### 推荐设置

创建或编辑 `~/.codebuddy/settings.json`:

```json
{
  "model": "sonnet",
  "permissions": {
    "Bash": "ask",
    "Edit": "accept",
    "Write": "accept"
  },
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CODEBUDDY_PACKAGE_MANAGER": "pnpm"
  }
}
```

### 多模型切换

```bash
# 快速任务 (低延迟)
codebuddy /model gemini-flash

# 复杂推理 (高质量)
codebuddy /model claude-opus

# 代码生成 (专业)
codebuddy /model deepseek-coder

# 查看当前模型
codebuddy /status
```

---

## 📚 核心组件使用

### 1. Agents (专业子代理)

| Agent | 使用场景 | 示例 |
|-------|---------|------|
| planner | 功能规划 | `使用 planner 规划这个 API` |
| architect | 系统架构 | `委托 architect 设计这个模块` |
| code-reviewer | 代码审查 | `使用 code-reviewer 审查提交` |
| security-reviewer | 安全检查 | `使用 security-reviewer 检查漏洞` |
| tdd-guide | TDD 指导 | `让 tdd-guide 带我进行 TDD` |
| build-error-resolver | 构建修复 | `使用 build-error-resolver 修复错误` |

### 2. Commands (斜杠命令)

| Command | 功能 | 示例 |
|---------|--------|------|
| /plan | 创建实施计划 | `/plan "添加用户认证"` |
| /tdd | TDD 工作流 | `/tdd` |
| /code-review | 代码审查 | `/code-review` |
| /e2e | E2E 测试 | `/e2e "登录流程"` |
| /build-fix | 修复构建 | `/build-fix` |
| /learn | 学习模式 | `/learn` |
| /verify | 验证循环 | `/verify` |

### 3. Skills (领域知识)

| Skill | 使用场景 | 示例 |
|-------|---------|------|
| frontend-patterns | React/Next.js | `使用 frontend-patterns 优化组件` |
| backend-patterns | API/数据库 | `使用 backend-patterns 设计 API` |
| tdd-workflow | 测试驱动 | `使用 tdd-workflow` 开发功能` |
| security-review | 安全最佳实践 | `使用 security-review 审查代码` |
| docker-patterns | Docker | `使用 docker-patterns 编写 Dockerfile` |

---

## 💡 工作流示例

### 场景 1: 开发新功能

```bash
# 1. 规划
codebuddy /plan "实现用户资料编辑功能"

# 2. TDD 开发
codebuddy /tdd

# 3. 代码审查
codebuddy /code-review

# 4. E2E 测试
codebuddy /e2e "资料编辑流程"
```

### 场景 2: 修复 Bug

```bash
# 1. 定位问题
codebuddy "使用 code-reviewer 检查这个组件"

# 2. TDD 修复
codebuddy /tdd

# 3. 验证
codebuddy /verify
```

### 场景 3: 代码重构

```bash
# 1. 清理死代码
codebuddy /refactor-clean

# 2. 审查重构
codebuddy /code-review

# 3. 学习模式
codebuddy /learn
```

### 场景 4: 发布前检查

```bash
# 1. 安全审查
codebuddy /security-scan

# 2. E2E 测试
codebuddy /e2e

# 3. 测试覆盖率
codebuddy /test-coverage

# 4. 更新文档
codebuddy /update-docs
```

---

## 🌟 CodeBuddy 独有优势

### 多模型支持

```bash
# 根据任务选择最优模型
codebuddy /model gemini-flash   # 简单任务
codebuddy /model claude-sonnet  # 常规任务
codebuddy /model claude-opus    # 复杂任务
```

### 腾讯云集成

```bash
# CloudBase 函数
codebuddy "创建 CloudBase 云函数处理用户注册"

# CloudBase 数据库
codebuddy "设计 CloudBase 数据库表结构"

# CloudBase 存储
codebuddy "配置文件上传到 CloudBase 存储"

# CloudBase 静态托管
codebuddy "部署静态网站到 CloudBase"
```

### 性能优化

```bash
# Token 优化
codebuddy /compact

# 查看成本
codebuddy /cost

# 清除历史
codebuddy /clear
```

---

## ⚠️ 常见问题

### Q1: Agent 未找到?

**解决**:
```bash
# 检查 agent 文件
ls .codebuddy/agents/

# 确保 YAML frontmatter 正确
head -5 .codebuddy/agents/planner.md
# 应该以 --- 开头
```

### Q2: Commands 不工作?

**解决**:
```bash
# 检查 command 文件
ls .codebuddy/commands/

# 测试直接调用
codebuddy "执行 plan command"
```

### Q3: Hooks 未触发?

**解决**:
```bash
# 检查 settings.json
cat .codebuddy/settings.json | jq '.hooks'

# 手动测试 hook
node .codebuddy/scripts/post-edit-format.js
```

### Q4: Rules 未生效?

**解决**:
```bash
# 检查 rules 安装
ls .codebuddy/rules/

# 手动触发
codebuddy /reload
```

---

## 📖 进一步学习

### 完整文档

- **迁移指南**: `docs/CODEBUDDY_MIGRATION_GUIDE.md`
- **兼容性矩阵**: `docs/CODEBUDDY_COMPATIBILITY_MATRIX.md`
- **架构文档**: `docs/CodeBuddy体系结构文档.md`
- **ECC 原始文档**: `README.md`

### 官方资源

- **CodeBuddy 文档**: https://www.codebuddy.cn/docs/cli/overview
- **CodeBuddy API**: https://www.codebuddy.cn/docs/api
- **ECC GitHub**: https://github.com/affaan-m/everything-claude-code
- **腾讯云开发**: https://cloud.tencent.com/product/tcb

### 社区

- **CodeBuddy 社区**: https://community.codebuddy.cn
- **ECC Issues**: https://github.com/affaan-m/everything-claude-code/issues

---

## 🎓 学习路径

### 第 1 周: 熟悉基础

- [ ] 运行自动迁移
- [ ] 测试所有 core commands
- [ ] 尝试常用 agents
- [ ] 配置 settings.json

### 第 2 周: 深入使用

- [ ] 学习 skills 调用
- [ ] 配置自定义 hooks
- [ ] 使用多模型切换
- [ ] 掌握 TDD 工作流

### 第 3 周: 高级特性

- [ ] 集成腾讯云开发
- [ ] 配置 MCP 服务器
- [ ] 使用 continuous learning
- [ ] 优化 Token 使用

### 第 4 周: 团队协作

- [ ] 共享团队配置
- [ ] 建立编码规范
- [ ] 配置 CI/CD 集成
- [ ] 培训团队成员

---

## 🚀 开始构建

```bash
# 现在就开始吧!
codebuddy /plan "我的第一个 CodeBuddy 功能"
```

**祝编码愉快!** 🎉

---

**需要帮助?**

- 📧 查看 `docs/CODEBUDDY_MIGRATION_GUIDE.md`
- 🔍 搜索 `docs/CODEBUDDY_COMPATIBILITY_MATRIX.md`
- 💬 提问: https://community.codebuddy.cn
- 🐛 报告问题: https://github.com/affaan-m/everything-claude-code/issues
