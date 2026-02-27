# OpenSpec 规格粒度要求分析

## 问题：OpenSpec 对规格粒度有要求吗？

### 核心发现

基于对 OpenSpec 配置文件和技能文档的深入分析，**OpenSpec 框架本身对规格粒度没有强制性的硬性要求**，但提供了**灵活的配置选项**和**最佳实践建议**。

---

## 1. OpenSpec 配置示例

从 `openspec/config.yaml` 中可以看出粒度配置：

```yaml
schema: spec-driven

# Per-artifact rules (optional)
# Add custom rules for specific artifacts.
rules:
  proposal:
    - Keep proposals under 500 words
    - Always include a "Non-goals" section
  tasks:
    - Break tasks into chunks of max 2 hours  # ⭐ 粒度建议
```

### 关键信息

- **`rules` 字段是可选的** - 项目可以根据自己的需求配置
- **示例建议**："Break tasks into chunks of max 2 hours"（任务拆分为最大 2 小时）
- **这只是一个建议，不是强制要求**

---

## 2. OpenSpec 技能文档中的粒度描述

从 `.codebuddy/skills/openspec-continue-change/SKILL.md`：

```markdown
- **tasks.md**: Break down implementation into checkboxed tasks.
```

从 `.codebuddy/skills/openspec-apply-change/SKILL.md`：

```markdown
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- If task is ambiguous, pause and ask before implementing
```

### 关键信息

- **"checkboxed tasks"** - 使用 checkbox 格式
- **"minimal and scoped to each task"** - 每个任务应该最小化和限定范围
- **没有具体的粒度要求**

---

## 3. 粒度要求总结

### OpenSpec 的官方态度

| 维度 | 要求 | 说明 |
|------|------|------|
| **是否有硬性要求** | ❌ 没有 | 完全由项目配置决定 |
| **是否有建议粒度** | ⚠️ 可选 | 示例建议 2 小时，但可自定义 |
| **是否强制 checkbox** | ✅ 是 | 任务必须使用 checkbox 格式 |
| **是否要求细粒度** | ❌ 不强制 | 可以是粗粒度或细粒度 |

### 粒度控制权

```
OpenSpec 框架
  ├─ 不强制粒度（设计哲学）
  ├─ 提供配置接口（config.yaml rules）
  └─ 给项目团队决策权（自定义规则）

项目团队
  ├─ 决定自己的粒度标准
  ├─ 在 config.yaml 中配置规则
  └─ 根据实际情况调整
```

---

## 4. 为什么 OpenSpec 不强制粒度？

### 设计哲学

OpenSpec 的设计理念是**灵活性优先**：

1. **不同项目有不同需求**
   - 大型项目可能需要 15-30 分钟的细粒度
   - 小型项目可能适合 1-2 小时的中等粒度
   - 概念验证可能只需要粗粒度

2. **不同团队有不同工作方式**
   - 敏捷团队：细粒度，频繁迭代
   - 传统团队：中等粒度，结构化
   - 个人开发：粗粒度，灵活调整

3. **不同 AI 模型有不同的能力**
   - 强大模型：可以处理粗粒度，自动细化
   - 普通模型：需要预先细粒度化
   - 混合使用：根据任务复杂度调整

---

## 5. 推荐的粒度策略

虽然 OpenSpec 不强制粒度，但基于最佳实践，我推荐：

### 推荐粒度层次

| 层次 | 时间范围 | 示例 | 适用场景 |
|------|---------|------|---------|
| **粗粒度** | 1-2 小时 | "创建 User 数据模型" | 概念验证、快速原型 |
| **中等粒度** | 30-60 分钟 | "定义 User 实体字段" | 标准开发、小型项目 |
| **细粒度** | 3-10 分钟 | "添加 id 字段并配置装饰器" | **推荐：multi-plan + OpenSpec** |
| **极细粒度** | < 3 分钟 | "添加 @Entity() 装饰器" | 教学示例、新手上手 |

### 最佳实践配置

在 `openspec/config.yaml` 中添加：

```yaml
rules:
  tasks:
    # 时间粒度：推荐 3-10 分钟
    - Break tasks into chunks of 3-10 minutes
    
    # 验证标准：每个任务必须可验证
    - Each task must have a verification criterion
    
    # 动作具体性：必须指定具体文件路径
    - Include file paths for code changes
    
    # 逻辑内聚性：每个任务单一关注点
    - Each task should have a single clear purpose
    
    # 依赖关系：明确任务之间的依赖
    - Mark task dependencies clearly
```

---

## 6. 对 multi-plan + OpenSpec 集成的影响

### 关键结论

**OpenSpec 不强制细粒度，但为了获得最佳效果，我们仍然需要增强 multi-plan 的粒度输出。**

### 原因

| 原因 | 说明 |
|------|------|
| **可追溯性** | 细粒度任务更容易追踪和验证 |
| **风险控制** | 小任务失败影响范围小 |
| **质量保证** | 每个小任务都有明确的验证标准 |
| **团队协作** | 粒度清晰的任务更容易分配 |

### 实施策略

```
OpenSpec 框架（不强制）
  ↓
multi-plan（增强粒度）
  ├─ 尝试生成 3-10 分钟粒度的任务
  ├─ 应用拆解规则
  └─ 输出细粒度计划
      ↓
  转换到 OpenSpec
  ├─ 保持细粒度 checkbox 格式
  ├─ 应用项目配置规则（如有）
  └─ 生成 tasks.md
      ↓
multi-execute 执行
  ├─ 细粒度验证
  └─ 实时更新 checkbox
```

---

## 7. 粒度质量检查清单

无论粒度如何，都应该满足以下标准：

### 必需标准

- ✅ **Checkbox 格式** - 使用 `- [ ]` 或 `- [x]` 格式
- ✅ **可验证性** - 每个任务有明确的完成标准
- ✅ **单一关注点** - 每个任务只做一件事
- ✅ **可独立执行** - 理想情况下不依赖外部状态

### 推荐标准

- ⭐ **时间可控** - 单个任务 3-10 分钟
- ⭐ **文件明确** - 指定具体的文件路径
- ⭐ **动作具体** - 使用明确的动词（添加、修改、删除）

---

## 8. 总结

### 回答原问题

**OpenSpec 对规格粒度没有强制性要求**，但：

1. **提供配置接口** - 可以在 `config.yaml` 中自定义规则
2. **建议最佳实践** - 示例配置建议 2 小时粒度
3. **强制 checkbox 格式** - 任务必须使用 checkbox 格式
4. **强调最小范围** - 每个任务应该"minimal and scoped"

### 对集成的启示

```
虽然 OpenSpec 不强制细粒度，
但为了获得最佳效果，
我们仍然需要：
  
1. 增强 multi-plan 的粒度输出
2. 应用细粒度拆解规则
3. 集成质量检查机制
4. 提供灵活的配置选项

最终实现：
"OpenSpec 提供灵活性框架，
我们提供细粒度能力"
```

---

## 附录：OpenSpec 粒度配置示例

### 完整的 config.yaml 示例

```yaml
schema: spec-driven

# 项目上下文
context: |
  Tech stack: TypeScript, React, Node.js
  We use conventional commits
  Domain: e-commerce platform
  Code style: ESLint + Prettier
  Testing: Jest + Playwright

# 工件规则
rules:
  proposal:
    - Keep proposals under 500 words
    - Always include a "Non-goals" section
    - Include impact assessment
  
  tasks:
    # 粒度规则
    - Break tasks into chunks of 3-10 minutes
    - Each task should have a single clear purpose
    - Include file paths for code changes
    
    # 验证规则
    - Each task must have a verification criterion
    - Verification should be automated if possible
    
    # 依赖规则
    - Mark task dependencies clearly with "Depends on: T1"
    - Tasks should be orderable by dependency
    
    # 完成规则
    - Update checkbox immediately after completion
    - Add completion notes if needed
  
  specs:
    - Use "Gherkin" format for acceptance criteria
    - Include edge cases and error scenarios
  
  design:
    - Include architectural diagrams
    - List all technical decisions with rationale
    - Document potential alternatives
  
  tests:
    - Define test cases for each spec
    - Include unit, integration, and E2E tests
    - Specify test data requirements
  
  risks:
    - Identify technical, schedule, and scope risks
    - Include mitigation strategies
    - Rate risk severity (low/medium/high)
  
  rollback:
    - List changes to be reverted
    - Provide step-by-step rollback procedure
    - Identify data migration needs
```

---

**文档版本**: 1.0  
**创建日期**: 2026-02-26  
**作者**: CodeBuddy AI Assistant
