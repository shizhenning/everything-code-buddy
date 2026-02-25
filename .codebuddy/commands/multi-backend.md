---
description: 后端开发多 Agent 协同工作流（研究→分析→设计→实施→优化→审查）
argument-hint: "<后端任务描述>"
---

# Multi-Backend Command

后端开发多 Agent 协同工作流，使用国产模型完成后端开发任务。

## 使用方法

```bash
/multi-backend <后端任务描述>
```

## 任务描述

**用户需求**: $ARGUMENTS

## 执行流程

### 阶段 1: 需求研究 [Mode: Research]

1. 调用 `requirements-analyzer` agent 评估需求完整性
2. 如果总分 < 7，请补充需求后再继续

```
请调用 requirements-analyzer agent 分析以下需求：
$ARGUMENTS
```

### 阶段 2: 后端分析 [Mode: Analysis]

1. 调用 `backend-analyzer` agent 进行后端分析
2. 获取至少 2 个技术方案
3. 等待用户选择一个方案

```
请调用 backend-analyzer agent 分析以下需求：
$ARGUMENTS
```

输出格式要求：
- 提供至少 2 个技术选项（框架、数据库、ORM 等）
- 包含 API 端点设计
- 列出数据模型建议
- 包含认证和安全考虑
- 等待用户选择方案后再继续

### 阶段 3: 数据库设计 [Mode: Design]

1. 调用 `database-designer` agent 设计数据库架构
2. 基于用户选择的方案设计详细 schema
3. 用户批准后保存设计到 `.codebuddy/plans/backend-{任务名}-db.md`

```
请调用 database-designer agent 设计数据库：
技术方案: [用户选择的方案]
需求: $ARGUMENTS
```

设计应包含：
- ER 模型
- 表结构和字段定义
- 索引策略
- 关系定义
- 迁移计划

### 阶段 4: 代码实施 [Mode: Execute]

严格遵循批准的设计进行代码开发：
- 遵循 RESTful 或 GraphQL 最佳实践
- 实现所有定义的 API 端点
- 添加适当的错误处理
- 实现日志和监控
- 确保安全性（认证、授权、输入验证）
- 在关键节点请求用户反馈

### 阶段 5: 代码优化 [Mode: Optimize]

1. 调用 `database-reviewer` agent 进行数据库设计审查
2. 调用 `security-reviewer` agent 进行安全审查
3. 调用 `code-reviewer` agent 进行代码质量审查
4. 根据审查结果进行优化

```
请调用 database-reviewer agent 审查数据库设计

请调用 security-reviewer agent 审查安全性

请调用 code-reviewer agent 审查后端代码
```

### 阶段 6: 质量复查 [Mode: Review]

最终检查清单：
- [ ] API 功能符合设计要求
- [ ] 数据库 schema 正确实现
- [ ] 安全性检查通过（认证、授权、输入验证、SQL注入防护）
- [ ] 性能满足要求（查询优化、索引有效）
- [ ] 错误处理完善
- [ ] 日志和监控配置完成
- [ ] 无 lint 错误
- [ ] 代码符合项目规范

## Agent 映射

| 阶段 | Agent | 模型 | 任务 |
|------|-------|------|------|
| Research | requirements-analyzer | glm-5.0 | 需求完整性分析 |
| Analysis | backend-analyzer | kimi-k2.5 | 后端架构分析 |
| Design | database-designer | glm-5.0 | 数据库架构设计 |
| Execute | (主对话) | (默认) | 代码实施 |
| Optimize | database-reviewer | glm-5.0 | 数据库审查 |
| Optimize | security-reviewer | deepseek-v3.2 | 安全审查 |
| Optimize | code-reviewer | kimi-k2.5 | 代码审查 |
| Review | (主对话) | (默认) | 质量复查 |

## 使用示例

```bash
# 创建用户认证 API
/multi-backend 创建用户认证系统，包含注册、登录、密码重置和 JWT 认证

# 实现订单管理 API
/multi-backend 实现订单管理 API，支持创建、查询、更新和删除订单

# 设计博客系统后端
/multi-backend 设计博客系统后端，包含文章管理、评论、标签和分类功能
```

## 注意事项

1. **严格按顺序执行**：每个阶段必须完成才能进入下一阶段
2. **用户确认**：关键决策点需要用户确认（方案选择、设计批准）
3. **文档记录**：每个阶段的输出都要清晰记录
4. **安全第一**：安全审查必须通过才能进入下一阶段
5. **性能考虑**：在设计阶段就要考虑性能和可扩展性

## 成功标准

- 需求理解正确
- 技术方案合理
- 数据库设计规范
- API 实现完整且符合最佳实践
- 通过安全审查
- 通过性能测试
- 无严重 bug
