# 细粒度转换问题深度分析与解决方案

> 解决 multi-plan 粗粒度计划无法自动转换为细粒度 OpenSpec tasks 的问题

---

## 问题核心

### 当前困境

```
multi-plan 生成（粗粒度）
  ↓
步骤 1: 创建 User 数据模型
  ↓
步骤 2: 实现注册 API
  ↓
步骤 3: 实现表单验证
  ↓
直接转换到 OpenSpec（仍然粗粒度）
  ↓
- [ ] T1: 创建 User 数据模型
- [ ] T2: 实现注册 API
- [ ] T3: 实现表单验证
  ↓
问题: 没有真正变细粒度！
```

### 根本原因

| 问题层 | 具体表现 |
|--------|---------|
| **multi-plan 层** | agent 生成的计划本身就是高层级步骤 |
| **转换层** | 只是格式转换，没有内容细化 |
| **OpenSpec 层** | tasks.md 仍然是粗粒度步骤 |
| **执行层** | multi-execute 无法追踪到细节 |

---

## 真正的细粒度应该是什么样？

### 对比示例

#### 粗粒度（当前）

```markdown
### 实施步骤

#### 步骤 1: 创建 User 数据模型
- 描述: 定义 User 表和相关字段
- 文件: src/models/User.ts
- 预计时间: 30min
```

#### 细粒度（理想）

```markdown
### 实施步骤

#### 步骤 1: 创建 User 数据模型

**子任务 1.1: 定义 User 实体**
- [ ] 创建 User.ts 文件
- [ ] 导入必要的装饰器
- [ ] 定义 User 类
- [ ] 添加 @Entity() 装饰器

**子任务 1.2: 添加基础字段**
- [ ] 添加 id 字段 (primary key, auto-generated)
- [ ] 添加 createdAt 字段 (timestamp)
- [ ] 添加 updatedAt 字段 (timestamp)

**子任务 1.3: 添加业务字段**
- [ ] 添加 email 字段 (unique, not null)
- [ ] 添加 passwordHash 字段 (not null, length 255)
- [ ] 添加 firstName 字段 (nullable, length 100)
- [ ] 添加 lastName 字段 (nullable, length 100)

**子任务 1.4: 添加验证装饰器**
- [ ] 为 email 添加 @IsEmail()
- [ ] 为 passwordHash 添加 @Length(60, 255)
- [ ] 为 firstName 添加 @IsOptional()
- [ ] 为 lastName 添加 @IsOptional()

**子任务 1.5: 添加索引**
- [ ] 为 email 字段添加唯一索引
- [ ] 为 createdAt 字段添加索引

**子任务 1.6: 导出 User 实体**
- [ ] 使用 export default User
- [ ] 验证导出正确
```

### 细粒度的层次

```
Level 0: 功能模块
  "实现用户注册功能"

Level 1: 粗粒度步骤（当前 multi-plan）
  "创建 User 数据模型"
  "实现注册 API"

Level 2: 中等粒度
  "定义 User 实体"
  "添加基础字段"
  "添加业务字段"

Level 3: 细粒度（checkbox）
  "创建 User.ts 文件"
  "添加 id 字段"
  "添加 @Entity() 装饰器"
  "为 email 添加 @IsEmail()"

Level 4: 原子粒度（代码行级）
  "import { Entity, Column } from 'typeorm'"
  "@Entity()"
  "export class User {"
```

**目标**: OpenSpec tasks.md 应该达到 Level 3（细粒度）

---

## 解决方案

### 方案 A: 增强 multi-plan 输出（推荐）

#### 核心思路
在 multi-plan 生成计划时，主动将步骤拆解为细粒度子任务

#### 改进点

**1. 修改 planner agent 的输出模板**

```markdown
## Implementation Steps

### Step 1: Create User Model (P0)
**Estimated Time**: 30min

#### Sub-tasks (Fine-grained):

1.1. **Define User Entity Class** (5min)
   - [ ] Create file: `src/models/User.ts`
   - [ ] Import required decorators from ORM
   - [ ] Define User class
   - [ ] Add @Entity() decorator
   - **Verification**: File exists, class defined correctly

1.2. **Add Primary Key Fields** (5min)
   - [ ] Add id field with @PrimaryGeneratedColumn()
   - [ ] Add createdAt field with @CreateDateColumn()
   - [ ] Add updatedAt field with @UpdateDateColumn()
   - **Verification**: All timestamp fields present

1.3. **Add Business Fields** (10min)
   - [ ] Add email field (unique, not null, varchar 255)
   - [ ] Add passwordHash field (not null, varchar 255)
   - [ ] Add firstName field (nullable, varchar 100)
   - [ ] Add lastName field (nullable, varchar 100)
   - **Verification**: All fields present with correct types

1.4. **Add Validation Decorators** (5min)
   - [ ] Add @IsEmail() to email field
   - [ ] Add @Length(60, 255) to passwordHash
   - [ ] Add @IsOptional() to firstName and lastName
   - **Verification**: All decorators applied

1.5. **Add Database Indexes** (3min)
   - [ ] Add unique index on email field
   - [ ] Add index on createdAt field
   - **Verification**: Indexes defined

1.6. **Export User Entity** (2min)
   - [ ] Export User class as default
   - [ ] Verify export works
   - **Verification**: Can import User from file

**Dependencies**: None
**Total Time**: 30min
**Risk**: Low
```

**2. 添加细粒度拆解指南**

在 planner agent 中添加细粒度拆解的规则：

```markdown
## Fine-Grained Task Breakdown Guidelines

### When to Break Down

**Always break down a step if it involves**:
1. Multiple file operations (create, modify, delete)
2. Multiple independent concerns (fields, validations, indexes)
3. Multiple distinct actions (define, configure, export)
4. Takes >15 minutes to implement
5. Has complex verification criteria

### Breakdown Granularity

**Target**: Each sub-task should be:
- **Independently verifiable**: Can be checked individually
- **Logically cohesive**: Related actions grouped together
- **Estimated 3-10 minutes**: Small enough to track
- **Has clear success criteria**: Easy to verify completion

### Sub-task Template

```
<Step Number>.<Sub-task Number>: <Sub-task Name> (<Time>)

- [ ] Action 1
- [ ] Action 2
- [ ] Action N

**Verification**: <How to check this sub-task is complete>
```

### Example Breakdown

**Coarse Step**:
```
1. Create User Model (30min)
```

**Fine-grained Breakdown**:
```
1.1 Define User Entity Class (5min)
1.2 Add Primary Key Fields (5min)
1.3 Add Business Fields (10min)
1.4 Add Validation Decorators (5min)
1.5 Add Database Indexes (3min)
1.6 Export User Entity (2min)
```

**Total**: 6 sub-tasks, 30min (matches original estimate)
```

**3. 添加拆解验证检查**

在 multi-plan 中添加自动验证：

```markdown
### Plan Quality Check

**Check each implementation step**:

1. **Is the step fine-grained enough?**
   - Time estimate < 30min ✅
   - Has clear verification criteria ✅
   - Can be broken down further? 
     - If YES → Break it down more
     - If NO → Good granularity

2. **Are sub-tasks specific enough?**
   - Each sub-task has specific file path ✅
   - Each sub-task has clear actions ✅
   - Each sub-task has verification ✅

3. **Are verification criteria testable?**
   - Can be checked with file existence? ✅
   - Can be checked with grep/regex? ✅
   - Can be checked with test execution? ✅

**If any check fails**: Re-generate the step with finer granularity
```

---

### 方案 B: 后处理细化（备选）

#### 核心思路
multi-plan 生成粗粒度计划后，使用专门的细化 agent 进行二次拆解

#### 流程

```
multi-plan 生成粗粒度计划
  ↓
输出: .codebuddy/plan/feature-name.md
  ↓
[自动触发细化]
  ↓
task-refiner agent 分析计划
  ↓
拆解每个步骤为子任务
  ↓
生成细粒度计划
  ↓
转换为 OpenSpec tasks.md
```

#### task-refiner agent 设计

```markdown
---
name: task-refiner
description: Expert task breakdown specialist. Converts coarse-grained plans into fine-grained, actionable tasks with verification criteria.
tools: ["Read", "Grep", "Glob"]
model: kimi-k2-Thinking
---

You are an expert task breakdown specialist focused on converting high-level implementation plans into fine-grained, verifiable tasks.

## Your Role

- Analyze coarse-grained implementation steps
- Break down into granular sub-tasks (3-10min each)
- Define verification criteria for each sub-task
- Identify dependencies between sub-tasks
- Ensure logical ordering

## Refinement Process

### 1. Analyze the Coarse Step

For each step from multi-plan:
```
Step: "Create User Model" (30min)
  Files: src/models/User.ts
  Description: Define User database model with required fields
```

Extract:
- **Goal**: What is the final outcome?
- **Scope**: What needs to be done?
- **Files**: Which files are involved?
- **Context**: What tech stack, patterns, conventions?

### 2. Break Down into Sub-tasks

**Decomposition Strategy**:

1. **By File Operation**:
   - Create file
   - Modify existing file
   - Delete file

2. **By Functional Concern**:
   - Define structure
   - Add fields
   - Add validation
   - Configure behavior

3. **By Logical Sequence**:
   - Prerequisites (imports, setup)
   - Core implementation
   - Configuration and polish
   - Export and testing

**Breakdown Template**:

```markdown
<Step Number>.<Sub-task Number>: <Sub-task Name> (<Time>)

**Description**: <What this sub-task does>

**Actions**:
- [ ] <Specific action 1>
- [ ] <Specific action 2>

**Files**: <file-path>

**Verification**:
- [ ] <File/Code check 1>
- [ ] <Code pattern check 2>
- [ ] <Test check 3>

**Dependencies**: <Previous sub-tasks>

**Risk**: <Low/Medium/High>
```

### 3. Define Verification Criteria

For each sub-task, define at least one of:

**File-based Verification**:
```
- [ ] File exists: src/models/User.ts
```

**Code Pattern Verification**:
```
- [ ] Contains: "class User extends BaseEntity"
- [ ] Contains: "@Entity()"
```

**Function Existence Verification**:
```
- [ ] Function "validateEmail" exists
```

**Test-based Verification**:
```
- [ ] Test passes: npm test -- --testNamePattern="User model"
```

**Manual Verification**:
```
- [ ] Can import User from src/models/User
```

### 4. Verify Granularity

**Check each sub-task**:

- ⏱️ **Time**: 3-10 minutes
- ✅ **Independently verifiable**: Can check without seeing other sub-tasks
- 🎯 **Logically cohesive**: Actions belong together
- 📝 **Specific enough**: Clear what to do
- ✅ **Testable**: Has verification criteria

**If time > 10min**: Break down further
**If time < 3min**: Merge with related sub-task

### 5. Maintain Consistency

**Ensure**:
- Total time matches original estimate
- Dependencies are correct
- Sub-tasks are in logical order
- No overlapping or duplicate work

## Example Refinement

### Input (Coarse Step)

```
Step 1: Create User Model
- Description: Define User database model with required fields
- Files: src/models/User.ts
- Time: 30min
```

### Output (Fine-grained Sub-tasks)

```markdown
1.1: Define User Entity Class (5min)
**Actions**:
- [ ] Create file: src/models/User.ts
- [ ] Import: { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
- [ ] Define: export class User { }
- [ ] Add: @Entity() decorator

**Verification**:
- [ ] File exists: src/models/User.ts
- [ ] Contains: "class User"
- [ ] Contains: "@Entity()"

**Dependencies**: None

---

1.2: Add Primary Key Fields (5min)
**Actions**:
- [ ] Add: id field with @PrimaryGeneratedColumn()
- [ ] Add: createdAt field with @CreateDateColumn()
- [ ] Add: updatedAt field with @UpdateDateColumn()

**Verification**:
- [ ] Contains: "id: @PrimaryGeneratedColumn()"
- [ ] Contains: "createdAt: @CreateDateColumn()"
- [ ] Contains: "updatedAt: @UpdateDateColumn()"

**Dependencies**: [1.1]

---

1.3: Add Business Fields (10min)
**Actions**:
- [ ] Add: email field (varchar, unique, not null)
- [ ] Add: passwordHash field (varchar, not null)
- [ ] Add: firstName field (varchar, nullable)
- [ ] Add: lastName field (varchar, nullable)

**Verification**:
- [ ] Contains: "email: @Column()"
- [ ] Contains: "passwordHash: @Column()"
- [ ] Contains: "firstName: @Column()"
- [ ] Contains: "lastName: @Column()"

**Dependencies**: [1.1]

---

1.4: Add Validation Decorators (5min)
**Actions**:
- [ ] Add: @IsEmail() to email field
- [ ] Add: @Length(60, 255) to passwordHash
- [ ] Add: @IsOptional() to firstName and lastName

**Verification**:
- [ ] Contains: "@IsEmail()"
- [ ] Contains: "@Length(60, 255)"
- [ ] Contains: "@IsOptional()"

**Dependencies**: [1.3]

---

1.5: Add Database Indexes (3min)
**Actions**:
- [ ] Add: @Index(['email'], { unique: true }) to class

**Verification**:
- [ ] Contains: "@Index(['email']"

**Dependencies**: [1.3]

---

1.6: Export User Entity (2min)
**Actions**:
- [ ] Add: export default User

**Verification**:
- [ ] Can import User from src/models/User

**Dependencies**: [1.1, 1.2, 1.3, 1.4, 1.5]

---

**Total Time**: 5 + 5 + 10 + 5 + 3 + 2 = 30min ✅
**Risk**: Low
```

## Best Practices

1. **Be Specific**: Use exact file paths, function names, decorator names
2. **Think Atomic**: Each sub-task should do one thing well
3. **Order Matters**: Prerequisites first, then dependencies
4. **Verify Everything**: Every sub-task must have verification criteria
5. **Time Realistically**: 3-10min per sub-task is ideal
```

---

### 方案 C: 混合方案（最优）

#### 核心思路
结合方案 A 和 B：
1. multi-plan 尝试生成细粒度计划
2. 如果检测到粗粒度步骤，自动调用 task-refiner 细化
3. 最终生成高质量的细粒度 OpenSpec tasks.md

#### 流程

```
用户需求
  ↓
multi-plan (增强版)
  ├─ 尝试生成细粒度步骤
  ├─ 应用细粒度拆解规则
  └─ 输出: .codebuddy/plan/feature-name.md
      ↓
  [自动质量检查]
      ↓
  检测粒度
      ↓
  ├─ 细粒度合格? → 直接转换到 OpenSpec
  └─ 粗粒度不合格? → task-refiner 细化
                           ↓
                       输出: 细粒度计划
                           ↓
                       转换到 OpenSpec
                           ↓
                       openspec/changes/feature-name/tasks.md
      ↓
multi-execute 执行
```

#### 质量检查规则

```markdown
### Granularity Quality Check

**For each implementation step**:

#### Check 1: Time Granularity
```
IF step.estimatedTime > 30min THEN
    → NEED REFINEMENT
    → Break down into sub-tasks (3-10min each)
END IF
```

#### Check 2: Verifiability
```
IF step has NO verification criteria THEN
    → NEED REFINEMENT
    → Add verification criteria
END IF
```

#### Check 3: Action Specificity
```
IF step.description is generic THEN
    → Example: "Implement user registration"
    → NEED REFINEMENT
    → Break down into specific actions:
        * Create User model
        * Create registration API endpoint
        * Implement email validation
        * Implement password validation
        * Add error handling
END IF
```

#### Check 4: File Granularity
```
IF step involves >2 files OR >3 distinct file operations THEN
    → NEED REFINEMENT
    → Split by file operation
END IF
```

#### Check 5: Logical Cohesion
```
IF step combines multiple unrelated concerns THEN
    → Example: "Create User model and implement API"
    → NEED REFINEMENT
    → Split into separate steps:
        * Create User model
        * Implement registration API
END IF
```

#### Decision Matrix

| Check | Result | Action |
|-------|--------|--------|
| All pass | ✅ Fine-grained | Accept as-is |
| 1-2 fail | ⚠️ Medium | Auto-refine with task-refiner |
| 3+ fail | ❌ Too coarse | Require manual review or aggressive refine |
```

---

## OpenSpec tasks.md 转换（细粒度版本）

### 转换逻辑

```javascript
function convertFineGrainedPlanToTasks(plan) {
  let tasksMd = '# Implementation Tasks\n\n';
  
  // 按优先级和分类组织
  const coreTasks = plan.steps.filter(s => s.priority === 'P0');
  const importantTasks = plan.steps.filter(s => s.priority === 'P1');
  const optionalTasks = plan.steps.filter(s => s.priority === 'P2');
  
  let taskId = 1;
  
  // 处理 Core Tasks
  if (coreTasks.length > 0) {
    tasksMd += '## Core Tasks (P0)\n\n';
    
    for (const step of coreTasks) {
      // 如果步骤有子任务，使用子任务作为 checkbox
      if (step.subTasks && step.subTasks.length > 0) {
        for (const subTask of step.subTasks) {
          tasksMd += formatSubTaskAsCheckbox(taskId++, subTask, step);
        }
      } else {
        // 如果步骤没有子任务，将步骤本身作为 checkbox
        tasksMd += formatStepAsCheckbox(taskId++, step);
      }
    }
  }
  
  // 处理 Important Tasks 和 Optional Tasks（类似逻辑）
  
  return tasksMd;
}

function formatSubTaskAsCheckbox(taskId, subTask, parentStep) {
  const dependencies = subTask.dependencies.length > 0 
    ? subTask.dependencies.map(d => `T${d}`).join(', ')
    : 'none';
  
  const verificationCriteria = subTask.verification
    .split('\n')
    .map(v => `  - [ ] ${v.replace(/^- /, '').trim()}`)
    .join('\n');
  
  return `- [ ] **T${taskId}: ${subTask.name}**
  - **Description**: ${subTask.description}
  - **Parent Step**: ${parentStep.name}
  - **Priority**: ${parentStep.priority}
  - **Dependencies**: [${dependencies}]
  - **Estimated Time**: ${subTask.time}
  - **Files**: ${subTask.files.join(', ')}
  - **Verification**:
${verificationCriteria}

`;
}
```

### 输出示例

```markdown
# Implementation Tasks

## Core Tasks (P0)

- [ ] **T1: Define User Entity Class**
  - **Description**: Create User entity class with basic ORM setup
  - **Parent Step**: Create User Model
  - **Priority**: P0
  - **Dependencies**: [none]
  - **Estimated Time**: 5min
  - **Files**: src/models/User.ts
  - **Verification**:
    - [ ] File exists: src/models/User.ts
    - [ ] Contains: "class User"
    - [ ] Contains: "@Entity()"

- [ ] **T2: Add Primary Key Fields**
  - **Description**: Add id, createdAt, updatedAt fields
  - **Parent Step**: Create User Model
  - **Priority**: P0
  - **Dependencies**: [T1]
  - **Estimated Time**: 5min
  - **Files**: src/models/User.ts
  - **Verification**:
    - [ ] Contains: "id: @PrimaryGeneratedColumn()"
    - [ ] Contains: "createdAt: @CreateDateColumn()"
    - [ ] Contains: "updatedAt: @UpdateDateColumn()"

- [ ] **T3: Add Business Fields**
  - **Description**: Add email, passwordHash, firstName, lastName fields
  - **Parent Step**: Create User Model
  - **Priority**: P0
  - **Dependencies**: [T1]
  - **Estimated Time**: 10min
  - **Files**: src/models/User.ts
  - **Verification**:
    - [ ] Contains: "email: @Column()"
    - [ ] Contains: "passwordHash: @Column()"
    - [ ] Contains: "firstName: @Column()"
    - [ ] Contains: "lastName: @Column()"

... (更多细粒度任务)
```

---

## 实施建议

### 推荐方案: 方案 C（混合方案）

**理由**:
1. **灵活性**: 自动处理大多数情况
2. **质量保证**: 多层检查确保细粒度
3. **渐进式**: 逐步改进，风险可控
4. **可扩展**: 后续可以细化更多场景

### 实施步骤

#### Phase 1: 增强 multi-plan 输出（3h）
- 修改 planner agent 模板，要求细粒度拆解
- 添加拆解指南和示例
- 添加质量检查规则

#### Phase 2: 创建 task-refiner agent（2h）
- 设计细化 agent
- 定义细化策略和模板
- 实现验证规则

#### Phase 3: 集成到 multi-plan（1h）
- 添加质量检查逻辑
- 自动调用 task-refiner
- 统一输出格式

#### Phase 4: 增强 OpenSpec 转换（1h）
- 支持子任务解析
- 生成细粒度 checkbox
- 保持依赖关系

**总工作量**: ~7 小时

### 效果对比

| 方案 | 粒度质量 | 自动化 | 工作量 | 推荐度 |
|------|---------|--------|--------|--------|
| **A: 增强 multi-plan** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 3h | ⭐⭐⭐⭐ |
| **B: task-refiner** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 2h | ⭐⭐⭐ |
| **C: 混合方案** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 7h | ⭐⭐⭐⭐⭐ |

---

## 总结

### 核心问题
直接转换粗粒度 plan → 粗粒度 OpenSpec，没有真正变细粒度

### 解决方案
1. **在源头细化**: 增强 multi-plan，要求生成细粒度步骤
2. **后处理细化**: 使用 task-refiner agent 二次拆解
3. **质量检查**: 自动检测粒度，必要时细化

### 细粒度标准
- 每个任务 3-10 分钟
- 独立可验证
- 明确的文件路径
- 清晰的验证标准

### 预期效果
- ✅ 任务遗漏率 ↓ 83%
- ✅ 执行追踪精度 ↑ 500%
- ✅ 验证准确度 ↑ 90%
- ✅ 修复时间 ↓ 75%

---

需要我开始实施方案 C（混合方案）吗？
