---
description: 前端开发多 Agent 协同工作流（研究→分析→规划→执行→优化→审查）
argument-hint: "<前端任务描述>"
---

# Multi-Frontend Command

前端开发多 Agent 协同工作流，使用国产模型完成前端开发任务。

## 使用方法

```bash
/multi-frontend <前端任务描述>
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

### 阶段 2: 前端分析 [Mode: Ideation]

1. 调用 `frontend-analyzer` agent 进行前端分析
2. 获取至少 2 个技术方案
3. 等待用户选择一个方案

```
请调用 frontend-analyzer agent 分析以下需求：
$ARGUMENTS
```

输出格式要求：
- 提供至少 2 个技术选项（框架、状态管理、样式方案等）
- 包含组件结构建议
- 列出可访问性和性能考虑
- 等待用户选择方案后再继续

### 阶段 3: 架构规划 [Mode: Plan]

1. 调用 `architect` agent 进行前端架构设计
2. 基于用户选择的方案制定详细计划
3. 用户批准后保存计划到 `.codebuddy/plans/frontend-{任务名}.md`

```
请调用 architect agent 设计前端架构：
技术方案: [用户选择的方案]
需求: $ARGUMENTS
```

计划应包含：
- 组件层次结构
- 状态管理方案
- 路由设计
- API 集成方式
- 样式策略

### 阶段 4: 代码实施 [Mode: Execute]

严格遵循批准的计划进行代码开发：
- 遵循项目代码规范
- 使用项目现有的设计系统
- 确保响应式设计
- 确保可访问性
- 在关键节点请求用户反馈

### 阶段 5: 代码优化 [Mode: Optimize]

1. 调用 `code-reviewer` agent 进行前端代码审查
2. 根据审查结果进行优化

```
请调用 code-reviewer agent 审查前端代码：
上下文: 前端开发
关注点: 可访问性、响应式设计、性能、代码质量
```

### 阶段 6: 质量复查 [Mode: Review]

最终检查清单：
- [ ] 功能是否符合计划要求
- [ ] 响应式设计测试通过（移动端、平板、桌面）
- [ ] 可访问性检查通过（WCAG 2.1 AA）
- [ ] 性能满足要求（Lighthouse 评分 90+）
- [ ] 无 lint 错误
- [ ] 代码符合项目规范

## Agent 映射

| 阶段 | Agent | 模型 | 任务 |
|------|-------|------|------|
| Research | requirements-analyzer | glm-5.0 | 需求完整性分析 |
| Ideation | frontend-analyzer | kimi-k2.5 | UI/UX 方案设计 |
| Plan | architect | glm-5.0 | 前端架构设计 |
| Execute | (主对话) | (默认) | 代码实施 |
| Optimize | code-reviewer | kimi-k2.5 | 前端代码审查 |
| Review | (主对话) | (默认) | 质量复查 |

## 使用示例

```bash
# 创建一个响应式导航栏
/multi-frontend 创建一个响应式导航栏，支持移动端折叠菜单，包含 logo、菜单链接和登录按钮

# 实现用户个人资料页面
/multi-frontend 实现用户个人资料页面，包含头像、基本信息、技能标签和项目展示

# 优化现有组件
/multi-frontend 优化现有的表单组件，添加验证和更好的用户体验
```

## 注意事项

1. **严格按顺序执行**：每个阶段必须完成才能进入下一阶段
2. **用户确认**：关键决策点需要用户确认（方案选择、计划批准）
3. **文档记录**：每个阶段的输出都要清晰记录
4. **质量优先**：在功能完整的基础上确保代码质量和可维护性
5. **使用现有资源**：优先使用项目中已有的组件和设计系统

## 成功标准

- 需求理解正确
- 技术方案合理
- 代码实现符合计划
- 通过代码审查
- 满足可访问性和响应式要求
- 无严重 bug
