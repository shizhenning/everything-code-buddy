# OpenSpec Onboarding Guide

欢迎来到OpenSpec集成系统!本指南将帮助您快速上手并掌握OpenSpec的核心功能。

## 📋 目录

1. [什么是OpenSpec?](#什么是openspec)
2. [快速开始](#快速开始)
3. [核心概念](#核心概念)
4. [完整工作流程](#完整工作流程)
5. [示例演练](#示例演练)
6. [最佳实践](#最佳实践)
7. [故障排除](#故障排除)

---

## 什么是OpenSpec?

OpenSpec是一个用于管理软件开发变更的结构化工件系统。它帮助您:

- 📋 **计划管理**: 创建详细的实施计划
- 🔄 **可追溯性**: 跟踪从计划到实现的完整流程
- ✅ **质量保证**: 通过多维度评估确保质量
- 📊 **进度跟踪**: 实时监控任务完成状态
- 🔗 **双向链接**: 计划与工件之间的自动链接

### OpenSpec工件结构

```
openspec/changes/<change-name>/
├── proposal.md       # 提案文档(目标、范围、验收标准)
├── design.md         # 设计文档(架构、技术选型、API)
├── specs/            # 规格文件目录
│   ├── spec-1.md
│   └── ...
├── tasks.md          # 任务列表(细粒度任务)
└── .plan-mapping.md  # 映射表(与计划的关联)
```

---

## 快速开始

### 5分钟快速入门

#### 1. 创建您的第一个OpenSpec计划

```bash
/opsx:plan "添加用户登录功能"
```

这条命令将:
- 自动生成实施计划
- 创建OpenSpec工件
- 建立双向链接
- 执行质量评估

#### 2. 查看进度

```bash
node .codebuddy/scripts/openspec-progress-visualizer.js user-login --html
```

这将生成一个漂亮的HTML进度报告。

#### 3. 执行计划

```bash
/multi-execute .codebuddy/plan/user-login.md
```

系统会自动检测OpenSpec模式并实时更新任务状态。

---

## 核心概念

### 1. 三层链接机制

OpenSpec使用三层链接确保可追溯性:

| 层级 | 方向 | 说明 |
|------|------|------|
| 前向引用 | Plan → OpenSpec | 在计划文件中引用OpenSpec变更 |
| 后向引用 | Proposal → Plan | 在proposal.md中引用计划文件 |
| 映射表 | .plan-mapping.md | 跟踪双向映射关系 |

### 2. 任务粒度

OpenSpec要求任务粒度为3-10分钟:

- ✅ **好的任务**: "创建Login组件结构"
- ❌ **太大的任务**: "实现完整的登录系统"
- ✅ **好的任务**: "添加登录表单验证"

### 3. 优先级分类

| 优先级 | 说明 | 示例 |
|--------|------|------|
| P0 | 关键路径,必须完成 | 核心API实现 |
| P1 | 重要功能 | 用户界面 |
| P2 | 增强功能 | 错误处理优化 |
| P3 | 可选功能 | 日志记录 |

### 4. 质量评估

OpenSpec使用三维质量评估:

| 维度 | 权重 | 说明 |
|------|------|------|
| 计划质量 | 30% | 目标清晰度、范围边界、实施步骤 |
| OpenSpec完整性 | 40% | 工件完整性、链接完整性 |
| 任务可执行性 | 30% | 任务粒度、依赖关系、验收标准 |

**决策阈值**:
- ≥90: ✅ 优秀 - 立即执行
- 80-89: ⚠️ 良好 - 可执行
- 70-79: ❌ 需要改进
- <70: ❌ 拒绝

---

## 完整工作流程

### 阶段1: 规划与创建 (5-10分钟)

```bash
# 步骤1: 使用统一入口创建计划
/opsx:plan "实现用户认证系统"

# 系统自动完成:
# ✅ 生成 .codebuddy/plan/user-authentication.md
# ✅ 创建 openspec/changes/user-authentication/
# ✅ 生成 proposal.md, design.md, tasks.md
# ✅ 建立三层链接
# ✅ 执行质量评估
```

**预期输出**:
```
✅ OpenSpec计划创建完成

📊 质量评估:
- 计划质量: 92/100
- OpenSpec完整性: 95/100
- 任务可执行性: 90/100
- 综合得分: 92.6/100

决策: ✅ 批准执行

📊 任务统计:
- P0任务: 12个
- P1任务: 20个
- P2任务: 10个
- P3任务: 5个
```

### 阶段2: 执行与跟踪 (按需)

```bash
# 步骤2: 执行计划
/multi-execute .codebuddy/plan/user-authentication.md

# 系统自动:
# ✅ 检测OpenSpec模式
# ✅ 加载OpenSpec上下文
# ✅ 执行任务并实时更新tasks.md
# ✅ 生成进度报告
```

**预期输出**:
```
✅ 本次会话完成的任务: 5个
📊 总进度: 12/47 (25%)
⏭️ 下次执行: /multi-execute .codebuddy/plan/user-authentication.md
```

### 阶段3: 验证与归档 (完成时)

```bash
# 步骤3: 查看进度报告
node .codebuddy/scripts/openspec-progress-visualizer.js user-authentication --html

# 步骤4: 验证一致性
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/user-authentication.md

# 步骤5: 生成一致性报告
node .codebuddy/scripts/generate-consistency-report.js user-authentication

# 步骤6: 归档变更
/opsx:archive user-authentication
```

---

## 示例演练

### 场景1: 添加简单功能

**需求**: 添加用户头像上传功能

#### 执行步骤:

```bash
# 1. 创建计划
/opsx:plan "添加用户头像上传功能"

# 2. 查看生成的计划
cat .codebuddy/plan/user-avatar-upload.md

# 3. 查看OpenSpec工件
cat openspec/changes/user-avatar-upload/proposal.md
cat openspec/changes/user-avatar-upload/tasks.md

# 4. 执行
/multi-execute .codebuddy/plan/user-avatar-upload.md
```

### 场景2: 重构大型模块

**需求**: 重构用户模块

#### 执行步骤:

```bash
# 1. 创建计划(会自动拆分为子计划)
/opsx:plan "重构用户模块"

# 系统会生成:
# - user-module-master.md (主计划)
# - user-model.md (数据模型)
# - user-api.md (API层)
# - user-ui.md (UI层)
#
# 每个子计划都有对应的OpenSpec工件

# 2. 按顺序执行子计划
/multi-execute .codebuddy/plan/user-module-master.md
```

### 场景3: 需要改进的计划

**场景**: 质量评估得分 < 80

#### 执行步骤:

```bash
# 1. 创建计划
/opsx:plan "实现购物车功能"

# 2. 查看质量评估(假设得分为75)
# 输出: ❌ 需要改进 (75/100)

# 3. 查看详细问题
cat .codebuddy/docs/openspec-quality-reports/shopping-cart-assessment.md

# 4. 继续完善
/opsx:continue shopping-cart

# 5. 重新评估
node .codebuddy/scripts/openspec-quality-assessment.js shopping-cart

# 6. 得分达到85后执行
/multi-execute .codebuddy/plan/shopping-cart.md
```

---

## 最佳实践

### 1. 计划命名规范

✅ **好的命名**:
- `user-authentication` (kebab-case)
- `shopping-cart-checkout`
- `api-rate-limiting`

❌ **不好的命名**:
- `UserAuthentication` (使用驼峰)
- `shopping_cart` (使用下划线)
- `add login` (包含空格)

### 2. 任务描述规范

✅ **好的任务描述**:
```
- [ ] 在 `src/components/LoginForm.tsx` 中创建登录表单结构
- [ ] 添加表单验证逻辑(email格式、密码长度)
- [ ] 实现API调用 `POST /api/auth/login`
```

❌ **不好的任务描述**:
```
- [ ] 做登录表单
- [ ] 验证
- [ ] 调接口
```

### 3. 使用版本控制

将OpenSpec工件纳入版本控制:

```bash
git add openspec/changes/user-authentication/
git commit -m "feat: add user authentication plan"

# 推送到远程
git push
```

### 4. 定期验证链接

在开发过程中定期验证链接完整性:

```bash
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/your-plan.md
```

### 5. 生成进度报告

定期生成进度报告以跟踪进展:

```bash
# 生成终端报告
node .codebuddy/scripts/openspec-progress-visualizer.js user-authentication

# 生成HTML报告
node .codebuddy/scripts/openspec-progress-visualizer.js user-authentication --html

# 在浏览器中打开
start openspec/changes/user-authentication/progress-report.html
```

---

## 故障排除

### 问题1: 计划生成失败

**错误信息**: "需求描述不清晰"

**解决方案**:
```bash
# 提供更详细的需求描述
/opsx:plan "实现用户认证系统,包括登录、注册、密码重置功能,使用JWT Token,需要API文档"

# 或指定上下文文件
/opsx:plan "实现用户认证" --context README.md
```

### 问题2: OpenSpec工件创建失败

**错误信息**: "openspec目录未初始化"

**解决方案**:
```bash
# 创建openspec目录
mkdir -p openspec/changes
```

### 问题3: 质量评估得分低

**错误信息**: "综合得分: 65/100"

**解决方案**:
```bash
# 1. 查看详细评估报告
cat .codebuddy/docs/openspec-quality-reports/your-change-assessment.md

# 2. 继续完善
/opsx:continue your-change

# 3. 使用task-refiner重新细化任务
Task({
  subagent_name: "task-refiner",
  description: "Refine tasks",
  prompt: "Please refine the implementation plan into granular tasks."
})
```

### 问题4: 链接验证失败

**错误信息**: "链接验证失败"

**解决方案**:
```bash
# 手动创建链接
node .codebuddy/scripts/openspec-link-creator.js create \
  .codebuddy/plan/your-plan.md \
  openspec/changes/your-change

# 重新验证
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/your-plan.md
```

### 问题5: 任务状态未更新

**错误信息**: "tasks.md未更新"

**解决方案**:
```bash
# 检查tasks.md是否存在
ls openspec/changes/your-change/tasks.md

# 检查任务格式是否正确
cat openspec/changes/your-change/tasks.md

# 手动更新任务状态(使用checkbox格式)
- [x] 已完成的任务
- [ ] 未完成的任务
```

---

## 进阶主题

### 自定义质量评估

创建自定义质量评估脚本:

```javascript
// .codebuddy/scripts/custom-quality-assessment.js
const { parseTasksFile } = require('./openspec-progress-visualizer');

function customAssessment(changeName) {
  const tasks = parseTasksFile(`openspec/changes/${changeName}/tasks.md`);
  
  // 自定义评估逻辑
  // ...
  
  return {
    customScore: 85,
    issues: []
  };
}

module.exports = { customAssessment };
```

### 集成CI/CD

在CI/CD流程中集成质量检查:

```yaml
# .github/workflows/openspec-check.yml
name: OpenSpec Quality Check

on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run OpenSpec Quality Check
        run: |
          node .codebuddy/scripts/openspec-quality-assessment.js ${{ github.event.head_commit.message }}
```

---

## 下一步

现在您已经掌握了OpenSpec的基础知识:

1. ✅ 创建您的第一个计划: `/opsx:plan "your-feature"`
2. ✅ 查看进度报告: `node .codebuddy/scripts/openspec-progress-visualizer.js your-feature --html`
3. ✅ 执行计划: `/multi-execute .codebuddy/plan/your-feature.md`
4. ✅ 探索更多功能: 阅读完整文档

## 相关资源

- [OpenSpec最佳集成方案](openspec-best-integration-solution.md)
- [质量决策矩阵](openspec-quality-decision-matrix.md)
- [质量检查规则](../rules/openspec-quality-rules.md)
- [统一入口命令](../commands/opsx-plan.md)
- [计划生成命令](../commands/multi-plan.md)
- [计划执行命令](../commands/multi-execute.md)

---

**文档版本**: 1.0  
**最后更新**: 2026-02-27
