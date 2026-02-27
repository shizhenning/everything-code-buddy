# multi-plan → OpenSpec → multi-execute 完整集成评估

> 评估结合三个工具的端到端细粒度管理方案

---

## 执行流程概览

### 当前流程（独立使用）

```
multi-plan (规划阶段)
  ↓
  生成 .codebuddy/plan/<feature-name>.md
  ↓
  ↓ (手动切换)
  ↓
multi-execute (执行阶段)
  ↓
  读取 .codebuddy/plan/<feature-name>.md
  ↓
  执行实施任务
```

### 提议流程（集成方案）

```
multi-plan (规划阶段)
  ↓
  生成 .codebuddy/plan/<feature-name>.md
  ↓
  ↓ (自动转换)
  ↓
OpenSpec 规格生成
  ↓
  创建 openspec/changes/<feature-name>/
    - proposal.md (从 plan 提取)
    - specs.md (从 plan 提取)
    - design.md (从 plan 提取)
    - tasks.md (从 plan 提取，带 checkbox)
    - tests.md (生成)
    - risks.md (生成)
    - rollback.md (生成)
  ↓
  ↓ (自动触发)
  ↓
multi-execute (执行阶段，OpenSpec 模式)
  ↓
  读取 openspec/changes/<feature-name>/tasks.md
  ↓
  细粒度执行 + 验证 + 追踪
```

---

## 方案详细分析

### 阶段 1: multi-plan 生成计划

#### 当前输出格式

```markdown
## 实施计划：<Feature Name>

### 背景
<background>

### 目标
<goals>

### 需求分析
<requirements>

### 技术方案
<technical-solution>

### 实施步骤

#### 步骤 1: 创建数据模型
- 描述: <description>
- 文件: <file-paths>
- 预计时间: <time>

#### 步骤 2: 实现 API
- 描述: <description>
- 文件: <file-paths>
- 预计时间: <time>

#### 步骤 3: 前端实现
- 描述: <description>
- 文件: <file-paths>
- 预计时间: <time>

### 验收标准
<acceptance-criteria>

### 风险分析
<risks>
```

#### 增强输出格式（为 OpenSpec 转换准备）

```markdown
## 实施计划：<Feature Name>

### 元数据（新增）
- **计划ID**: plan-<timestamp>
- **生成时间**: 2026-02-26T10:30:00Z
- **计划类型**: single | master
- **预计总时间**: <total-time>
- **优先级**: P0 | P1 | P2
- **复杂度**: low | medium | high

### 背景
<background>

### 目标
<goals>

### 范围（明确化）
- **包含**: <in-scope>
- **不包含**: <out-of-scope>

### 需求分析（结构化）

#### 功能需求
- [ ] REQ-1: <requirement-name>
  - 描述: <description>
  - 优先级: P0 | P1 | P2
  - 验收标准:
    - <criteria-1>
    - <criteria-2>

#### 非功能需求
- <performance>
- <security>
- <scalability>

### 技术方案

#### 架构设计
<architecture-diagram>

#### 技术决策
| 决策 | 理由 | 替代方案 |
|------|------|---------|
| <decision> | <rationale> | <alternative> |

#### 模式与最佳实践
<patterns>

### 实施步骤（细粒度）

#### 步骤 1: 创建数据模型（P0）
- **描述**: <description>
- **类型**: core | important | optional
- **优先级**: P0
- **依赖**: []
- **预计时间**: <time>
- **文件**: <file-paths>
- **验收标准**:
  - [ ] <criteria-1>
  - [ ] <criteria-2>

#### 步骤 2: 实现 API（P0）
- **描述**: <description>
- **类型**: core
- **优先级**: P0
- **依赖**: [步骤 1]
- **预计时间**: <time>
- **文件**: <file-paths>
- **验收标准**:
  - [ ] <criteria-1>
  - [ ] <criteria-2>

#### 步骤 3: 实现表单验证（P1）
- **描述**: <description>
- **类型**: important
- **优先级**: P1
- **依赖**: [步骤 2]
- **预计时间**: <time>
- **文件**: <file-paths>
- **验收标准**:
  - [ ] <criteria-1>
  - [ ] <criteria-2>

### 风险分析
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| <risk> | <high/medium/low> | <high/medium/low> | <mitigation> |

### 回滚计划
<rollback-steps>
```

---

### 阶段 2: 自动转换到 OpenSpec 格式

#### 转换映射表

| multi-plan 字段 | OpenSpec 工件 | 映射逻辑 |
|---------------|--------------|---------|
| 计划元数据 | proposal.md 标题 | 提取 |
| 目标 | proposal.md Goal | 直接映射 |
| 背景 | proposal.md Background | 直接映射 |
| 范围 | proposal.md Scope | 直接映射 |
| 功能需求 | specs.md Requirements | 结构化映射 |
| 验收标准 | specs.md Acceptance Criteria | 合并到需求 |
| 非功能需求 | specs.md Non-Functional | 直接映射 |
| 架构设计 | design.md Architecture | 直接映射 |
| 技术决策 | design.md Technical Decisions | 直接映射 |
| 模式与最佳实践 | design.md Patterns | 直接映射 |
| 实施步骤 | tasks.md | 转换为 checkbox 格式 |
| 风险分析 | risks.md | 直接映射 |
| 回滚计划 | rollback.md | 直接映射 |

#### 自动转换脚本

```javascript
// 伪代码：plan-to-openspec-converter.js

function convertPlanToOpenSpec(planFile) {
  // 1. 读取 multi-plan 输出
  const plan = readMarkdownFile(planFile);
  
  // 2. 解析 plan 内容
  const metadata = extractMetadata(plan);
  const goals = extractGoals(plan);
  const scope = extractScope(plan);
  const requirements = extractRequirements(plan);
  const architecture = extractArchitecture(plan);
  const technicalDecisions = extractTechnicalDecisions(plan);
  const patterns = extractPatterns(plan);
  const implementationSteps = extractImplementationSteps(plan);
  const risks = extractRisks(plan);
  const rollbackPlan = extractRollbackPlan(plan);
  
  // 3. 生成 change name
  const changeName = generateChangeName(metadata, goals);
  
  // 4. 创建 OpenSpec 目录
  const changeDir = `openspec/changes/${changeName}`;
  ensureDirectoryExists(changeDir);
  
  // 5. 生成 proposal.md
  const proposal = generateProposal({
    changeName,
    goals,
    background: metadata.background,
    scope
  });
  writeFile(`${changeDir}/proposal.md`, proposal);
  
  // 6. 生成 specs.md
  const specs = generateSpecs({
    changeName,
    requirements,
    acceptanceCriteria: requirements.map(r => r.acceptanceCriteria),
    nonFunctionalRequirements: metadata.nonFunctionalRequirements
  });
  writeFile(`${changeDir}/specs.md`, specs);
  
  // 7. 生成 design.md
  const design = generateDesign({
    changeName,
    architecture,
    technicalDecisions,
    patterns
  });
  writeFile(`${changeDir}/design.md`, design);
  
  // 8. 生成 tasks.md（核心转换）
  const tasks = generateTasks(implementationSteps);
  writeFile(`${changeDir}/tasks.md`, tasks);
  
  // 9. 生成 tests.md
  const tests = generateTests(requirements, implementationSteps);
  writeFile(`${changeDir}/tests.md`, tests);
  
  // 10. 生成 risks.md
  const risksDoc = generateRisksDocument(risks);
  writeFile(`${changeDir}/risks.md`, risksDoc);
  
  // 11. 生成 rollback.md
  const rollback = generateRollback(rollbackPlan);
  writeFile(`${changeDir}/rollback.md`, rollback);
  
  // 12. 返回转换结果
  return {
    changeName,
    changeDir,
    artifacts: ['proposal', 'specs', 'design', 'tasks', 'tests', 'risks', 'rollback']
  };
}

function generateTasks(implementationSteps) {
  let tasksMd = '# Implementation Tasks\n\n';
  
  // 按优先级分组
  const coreTasks = implementationSteps.filter(s => s.priority === 'P0');
  const importantTasks = implementationSteps.filter(s => s.priority === 'P1');
  const optionalTasks = implementationSteps.filter(s => s.priority === 'P2');
  
  // 生成 Core Tasks
  if (coreTasks.length > 0) {
    tasksMd += '## Core Tasks (P0)\n\n';
    coreTasks.forEach((step, index) => {
      const taskId = `T${index + 1}`;
      tasksMd += generateTaskMarkdown(taskId, step);
    });
  }
  
  // 生成 Important Tasks
  if (importantTasks.length > 0) {
    tasksMd += '\n## Important Tasks (P1)\n\n';
    const offset = coreTasks.length;
    importantTasks.forEach((step, index) => {
      const taskId = `T${offset + index + 1}`;
      tasksMd += generateTaskMarkdown(taskId, step);
    });
  }
  
  // 生成 Optional Tasks
  if (optionalTasks.length > 0) {
    tasksMd += '\n## Optional Tasks (P2)\n\n';
    const offset = coreTasks.length + importantTasks.length;
    optionalTasks.forEach((step, index) => {
      const taskId = `T${offset + index + 1}`;
      tasksMd += generateTaskMarkdown(taskId, step);
    });
  }
  
  return tasksMd;
}

function generateTaskMarkdown(taskId, step) {
  const dependencies = step.dependencies.length > 0 
    ? `- [Dependencies: ${step.dependencies.map(d => 'T' + d).join(', ')}]`
    : '';
  
  const verificationCriteria = step.acceptanceCriteria.map(
    c => `  - [ ] ${c}`
  ).join('\n');
  
  return `- [ ] **${taskId}: ${step.title}**
  - **Description**: ${step.description}
  - **Priority**: ${step.priority}
  - **Dependencies**: [${step.dependencies.map(d => 'T' + d).join(', ') || 'none'}]
  - **Estimated Time**: ${step.estimatedTime}
  - **Verification**:
${verificationCriteria}
`;
}
```

---

### 阶段 3: multi-execute 执行（OpenSpec 模式）

#### 执行流程

```
用户执行:
  /execute --openspec <change-name>

multi-execute 执行:

Phase 0.5: OpenSpec 集成检查
  ├─ 检查 openspec/changes/<change-name>/ 是否存在
  ├─ 验证工件完整性 (proposal, specs, design, tasks)
  ├─ 加载 OpenSpec 上下文
  └─ 读取 task-checklist.json (如果存在)
      ↓
Phase 1.5: 任务拆解
  ├─ 读取 tasks.md
  ├─ 解析 checkbox 任务
  ├─ 生成/更新 task-checklist.json
  └─ 分析任务依赖关系
      ↓
Phase 2: 上下文收集
  ├─ 读取 proposal.md (目标、范围)
  ├─ 读取 specs.md (需求、验收标准)
  ├─ 读取 design.md (架构、模式)
  └─ 收集相关代码文件
      ↓
Phase 3: 任务实施 (循环)
  对于每个 task in task-checklist.json:
    ├─ 显示任务信息 (从 tasks.md)
    ├─ 实施任务 (编写代码)
    ├─ 更新 tasks.md checkbox: - [ ] → - [x]
    └─ Phase 3.5: 验证
          ├─ 执行验证标准
          ├─ 更新 task-checklist.json
          └─ 验证决策 (passed/blocked/skipped)
      ↓
Phase 4: 代码审查 (code-reviewer)
      ↓
Phase 4.3: 功能完整性检查
  ├─ 对照 specs.md 验证需求
  ├─ 检查任务完成情况
  ├─ 计算需求覆盖率
  └─ 生成完整性报告
      ↓
Phase 4.5: 质量评估
  ├─ 使用 OpenSpec 上下文评估
  ├─ 评估 OpenSpec 合规性
  ├─ 评估代码质量
  └─ 评估任务完成度
      ↓
Phase 4.2: 交付确认
  └─ 询问用户确认交付
```

---

## 集成方案优势

### 1. 端到端自动化

| 环节 | 当前方式 | 集成方式 |
|------|---------|---------|
| 计划生成 | multi-plan 生成 | multi-plan 生成 ✅ |
| 格式转换 | 手动 | **自动转换** ✅ |
| OpenSpec 创建 | 手动 | **自动创建** ✅ |
| 任务执行 | multi-execute (标准模式) | multi-execute (OpenSpec 模式) ✅ |
| 进度追踪 | 无 | **自动 checkbox 追踪** ✅ |
| 验证 | 事后 | **实时任务验证** ✅ |
| 完整性检查 | 无 | **对照 specs.md 验证** ✅ |

### 2. 细粒度任务管理

```
传统方式:
  multi-plan → 实施步骤 (粗粒度)
    ↓
  multi-execute → 执行步骤 (容易遗漏细节)

集成方式:
  multi-plan → 实施步骤
    ↓
  自动转换 → tasks.md (细粒度 checkbox)
    ↓
  multi-execute → 每个任务都追踪、验证
```

### 3. 可追溯性

```
完整的追溯链:

用户需求
  ↓
multi-plan (计划)
  ↓
OpenSpec proposal.md (目标、范围)
  ↓
OpenSpec specs.md (需求、验收标准)
  ↓
OpenSpec design.md (架构、设计)
  ↓
OpenSpec tasks.md (实施任务)
  ↓
multi-execute (执行)
  ↓
代码实现
  ↓
验证报告 (对照 specs.md)
```

### 4. 质量保证

```
多层次验证:

1. 任务级验证 (Phase 3.5)
   - 每个 task 完成后立即验证
   - 验证标准从 tasks.md 提取
   - 失败立即停止或跳过

2. 代码审查 (Phase 4)
   - code-reviewer 检查代码质量

3. 完整性检查 (Phase 4.3)
   - 对照 specs.md 验证需求覆盖
   - 计算覆盖率
   - 识别遗漏功能

4. 质量评估 (Phase 4.5)
   - OpenSpec 合规性评估
   - 代码质量评分
   - 任务完成度评分
```

---

## 实施方案

### 方案 A: 增强版 multi-plan（推荐）

#### 改动内容

**1. 修改 multi-plan.md**

```markdown
## Phase 3: Generate Implementation Plan (Enhanced)

### 3.1 Plan Format Selection

**询问用户**:

"请选择计划格式:

A. **标准格式** (.codebuddy/plan/<feature-name>.md)
   - 传统的实施计划格式
   - 适合简单任务
   
B. **OpenSpec 格式** (openspec/changes/<feature-name>/)
   - 自动生成 OpenSpec 标准工件
   - 适合复杂任务
   - 支持细粒度任务追踪
   - 可与 multi-execute 无缝集成

请选择 A 或 B:"

**如果选择 A**:
- 按现有流程生成标准计划

**如果选择 B**:
- 执行 Phase 3.2 (OpenSpec 格式生成)

### 3.2 Generate OpenSpec Artifacts (NEW)

1. **Generate Metadata**:
   - Change name: <feature-name>
   - Change ID: <timestamp>
   - Generation time: <current-time>

2. **Generate proposal.md**:
   - Extract goals from plan
   - Extract background from plan
   - Define scope (in-scope, out-of-scope)

3. **Generate specs.md**:
   - Extract functional requirements
   - Extract acceptance criteria
   - Add non-functional requirements

4. **Generate design.md**:
   - Extract architecture from plan
   - Extract technical decisions
   - Extract patterns and best practices

5. **Generate tasks.md** (CRITICAL):
   - Convert implementation steps to checkbox format
   - Classify by priority (P0/P1/P2)
   - Add task IDs (T1, T2, T3...)
   - Add dependencies
   - Add verification criteria for each task

6. **Generate tests.md**:
   - Extract test requirements from plan
   - Generate test plan

7. **Generate risks.md**:
   - Extract risks from plan
   - Add mitigation strategies

8. **Generate rollback.md**:
   - Extract rollback plan from plan
   - Add rollback procedures

3. **Save OpenSpec Artifacts**:
   - Create directory: openspec/changes/<change-name>/
   - Save all artifacts

4. **Output**:

```

**计划已生成！** ✅

**OpenSpec 格式已保存到**: `openspec/changes/<change-name>/`

**生成的工件**:
- ✅ proposal.md
- ✅ specs.md
- ✅ design.md
- ✅ tasks.md
- ✅ tests.md
- ✅ risks.md
- ✅ rollback.md

**下一步**:

**选项 1: 立即执行 (推荐)**
```
/execute --openspec <change-name>
```

**选项 2: 查看计划细节**
```
/opsx:continue <change-name>
```

**选项 3: 修改计划**
```
告诉我需要修改的内容，我会更新计划
```
```
```

**2. 新增 multi-plan 命令行参数**

```bash
# 标准格式
/multi-plan "实现用户注册功能"

# OpenSpec 格式
/multi-plan "实现用户注册功能" --openspec
/multi-plan "实现用户注册功能" -o  # 简写

# 明确指定 change name
/multi-plan "实现用户注册功能" --openspec --change-name user-auth
```

---

### 方案 B: 独立转换工具

#### 创建新命令

```bash
# 新命令: /plan-to-openspec

/plan-to-openspec .codebuddy/plan/<feature-name>.md
```

**功能**:
1. 读取 multi-plan 生成的计划文件
2. 自动转换为 OpenSpec 格式
3. 生成所有工件到 `openspec/changes/<change-name>/`
4. 输出转换结果和下一步操作

**优点**:
- 不修改 multi-plan
- 可以转换旧的计划文件
- 灵活使用

**缺点**:
- 需要手动执行额外命令
- 流程中断

---

### 方案 C: 增强 multi-execute（最小改动）

#### 改动内容

**修改 multi-execute.md**

```markdown
## Phase 0: 读取计划

### 0.1 计划类型识别

**检查输入类型**:

1. **OpenSpec 模式**:
   ```bash
   /execute --openspec <change-name>
   ```
   
   如果是 OpenSpec 模式:
   - 检查 `openspec/changes/<change-name>/` 是否存在
   - 如果存在 → 使用 OpenSpec 模式
   - 如果不存在 → 提示错误

2. **标准模式** (现有逻辑):
   ```bash
   /execute .codebuddy/plan/<feature-name>.md
   ```
   
   如果是标准模式:
   - 按现有流程执行

3. **自动转换模式** (新增):
   ```bash
   /execute .codebuddy/plan/<feature-name>.md --to-openspec
   ```
   
   如果带有 --to-openspec 参数:
   - 读取 .codebuddy/plan/<feature-name>.md
   - 自动转换为 OpenSpec 格式
   - 生成工件到 openspec/changes/
   - 使用 OpenSpec 模式执行

### 0.2 OpenSpec 模式初始化

如果使用 OpenSpec 模式:

1. **检查工件完整性**:
   - proposal.md ✅ 必需
   - specs.md ✅ 必需
   - design.md ✅ 必需
   - tasks.md ✅ 必需
   - tests.md ⚠️ 推荐
   - risks.md ⚠️ 推荐
   - rollback.md ⚠️ 推荐

2. **加载 OpenSpec 上下文**:
   - 读取 proposal.md
   - 读取 specs.md
   - 读取 design.md
   - 读取 tasks.md

3. **生成 task-checklist.json**:
   - 从 tasks.md 解析任务
   - 分析依赖关系
   - 初始化任务状态
```

---

## 推荐方案对比

| 方案 | 改动量 | 自动化程度 | 兼容性 | 推荐度 |
|------|--------|-----------|--------|--------|
| **方案 A** | 中等 | 高 ⭐⭐⭐⭐⭐ | 好 | ⭐⭐⭐⭐⭐ |
| **方案 B** | 小 | 中 ⭐⭐⭐ | 好 | ⭐⭐⭐ |
| **方案 C** | 最小 | 高 ⭐⭐⭐⭐ | 最好 | ⭐⭐⭐⭐ |

---

## 完整工作流程示例

### 场景：实现用户认证功能

#### 步骤 1: 使用 multi-plan 生成计划

```bash
/multi-plan "实现用户认证功能，包括注册、登录、密码重置" --openspec
```

**multi-plan 输出**:

```
正在分析需求...
正在检索上下文...
正在生成计划...

**计划已生成！** ✅

**OpenSpec 格式已保存到**: `openspec/changes/user-authentication/`

**生成的工件**:
- ✅ proposal.md
- ✅ specs.md  
- ✅ design.md
- ✅ tasks.md (包含 12 个任务，带 checkbox)
- ✅ tests.md
- ✅ risks.md
- ✅ rollback.md

**任务统计**:
- Core (P0): 6 个任务
- Important (P1): 4 个任务
- Optional (P2): 2 个任务
- 预计总时间: 4.5 小时

**下一步**:

**选项 1: 立即执行 (推荐)**
```
/execute --openspec user-authentication
```

**选项 2: 查看计划细节**
```
/opsx:continue user-authentication
```
```

#### 步骤 2: 查看生成的 tasks.md

```markdown
# Implementation Tasks

## Core Tasks (P0)

- [ ] **T1: Create User model**
  - **Description**: Define User database model with required fields
  - **Priority**: P0
  - **Dependencies**: []
  - **Estimated Time**: 30min
  - **Verification**:
    - [ ] File exists: `src/models/User.ts`
    - [ ] Fields: id, email, passwordHash, createdAt, updatedAt
    - [ ] Uses ORM correctly
    - [ ] Includes validation decorators

- [ ] **T2: Implement registration API**
  - **Description**: Create API endpoint for user registration
  - **Priority**: P0
  - **Dependencies**: [T1]
  - **Estimated Time**: 45min
  - **Verification**:
    - [ ] Endpoint exists: `POST /api/auth/register`
    - [ ] Request body: { email, password }
    - [ ] Response: { user, token }
    - [ ] Handles validation errors
    - [ ] Handles duplicate email

... (更多任务)
```

#### 步骤 3: 使用 multi-execute 执行

```bash
/execute --openspec user-authentication
```

**multi-execute 执行**:

```
Phase 0.5: OpenSpec 集成检查
  ✅ 工件完整性检查通过
  ✅ 上下文加载完成

Phase 1.5: 任务拆解
  ✅ 从 tasks.md 读取 12 个任务
  ✅ task-checklist.json 已生成

Phase 2: 上下文收集
  ✅ 读取 proposal.md
  ✅ 读取 specs.md
  ✅ 读取 design.md
  ✅ 收集相关代码文件

Phase 3: 任务实施

┌─────────────────────────────────────────────┐
│ 当前任务: T1 - Create User model          │
│                                              │
│ - 类型: Core (P0)                            │
│ - 描述: Define User database model            │
│ - 预计时间: 30min                          │
│ - 依赖: 无                                  │
│                                              │
│ 验证标准:                                   │
│   * File exists: src/models/User.ts        │
│   * Fields: id, email, passwordHash        │
│   * Uses ORM correctly                     │
│   * Includes validation decorators           │
│                                              │
│ [开始实施]                                   │
└─────────────────────────────────────────────┘

[实施任务...]

Phase 3.5: 任务验证
  ✅ 验证通过
  ✅ tasks.md 更新: - [ ] → - [x]
  ✅ task-checklist.json 更新: status = "completed"

[继续下一个任务...]

Phase 4: 代码审查
  ✅ 代码审查通过

Phase 4.3: 功能完整性检查
  需求覆盖率: 100% ✅
  所有核心需求已实现

Phase 4.5: 质量评估
  综合评分: 95/100 ✅
  
  - OpenSpec 合规性: 100%
  - 代码质量: 95
  - 功能完整性: 100%
  - 测试覆盖: 90%

Phase 4.2: 交付确认
  
  **执行完成！** ✅
  
  **任务完成情况**:
  - Core (P0): 6/6 (100%)
  - Important (P1): 4/4 (100%)
  - Optional (P2): 2/2 (100%)
  
  **质量评分**: 95/100
  
  **下一步**:
  - [x] 归档变更: /opsx:archive user-authentication
  - [ ] 部署到生产环境
```

#### 步骤 4: 归档变更

```bash
/opsx:archive user-authentication
```

**归档结果**:

```
✅ 变更已归档！

**归档内容**:
- Delta specs 已同步到 main specs
- 完整工件已保存到 archive/
- task-checklist.json 已归档

**可追溯性**:
- proposal.md → specs.md → design.md → tasks.md → 代码
- 完整的变更历史
- 可审计的决策过程
```

---

## 技术实现细节

### 1. OpenSpec 工件结构

```bash
openspec/
├── changes/
│   ├── user-authentication/
│   │   ├── proposal.md
│   │   ├── specs.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── tests.md
│   │   ├── risks.md
│   │   └── rollback.md
│   └── ...
├── specs/
│   ├── main-specs.md
│   └── ...
└── archive/
    └── user-authentication/
        └── ...
```

### 2. task-checklist.json 结构

```json
{
  "source": "openspec",
  "changeName": "user-authentication",
  "generatedAt": "2026-02-26T10:30:00Z",
  "planFile": ".codebuddy/plan/user-authentication.md",
  "tasks": [
    {
      "id": "T1",
      "name": "Create User model",
      "description": "Define User database model with required fields",
      "category": "core",
      "priority": "P0",
      "dependencies": [],
      "estimatedTime": "30min",
      "verificationCriteria": [
        "File exists: src/models/User.ts",
        "Fields: id, email, passwordHash, createdAt, updatedAt",
        "Uses ORM correctly",
        "Includes validation decorators"
      ],
      "status": "pending",
      "completedAt": null,
      "checkboxLine": 8
    }
  ],
  "statistics": {
    "total": 12,
    "core": 6,
    "important": 4,
    "optional": 2,
    "completed": 0,
    "pending": 12,
    "blocked": 0,
    "skipped": 0
  }
}
```

### 3. 执行状态追踪

```json
{
  "execution": {
    "sessionId": "exec-20260226-103000",
    "startTime": "2026-02-26T10:30:00Z",
    "status": "in_progress",
    "currentTask": "T3",
    "phase": "3",
    "taskProgress": {
      "completed": 2,
      "total": 12,
      "percentage": "16.7%"
    }
  }
}
```

---

## 潜在问题与解决方案

### 问题 1: multi-plan 输出格式不一致

**问题**: 不同的 agent 可能生成不同格式的计划

**解决方案**:
1. 在 multi-plan.md 中定义严格的输出模板
2. 添加输出验证阶段
3. 提供示例格式参考

### 问题 2: 自动转换错误

**问题**: 从 plan 转换到 OpenSpec 可能丢失信息

**解决方案**:
1. 定义清晰的映射规则
2. 添加转换验证
3. 提供手动修正机制

### 问题 3: 任务依赖解析错误

**问题**: 自动解析任务依赖可能不准确

**解决方案**:
1. 在 tasks.md 中显式声明依赖
2. 提供依赖可视化
3. 允许用户手动调整依赖

### 问题 4: 验证标准不完整

**问题**: 自动生成的验证标准可能不全面

**解决方案**:
1. 使用模板增强验证标准
2. 提供"增强验证"选项
3. 允许用户添加自定义验证

---

## 评估总结

### 推荐方案

**方案 A: 增强版 multi-plan**

**理由**:
1. **改动适中** - 不需要大规模重构
2. **自动化程度高** - 一键生成 OpenSpec 格式
3. **用户体验好** - 流程顺畅，无中断
4. **向后兼容** - 标准模式仍然可用

### 实施优先级

| 优先级 | 任务 | 预估工作量 |
|--------|------|-----------|
| **P0** | 增强 multi-plan 输出格式 | 2h |
| **P0** | 添加 OpenSpec 格式生成逻辑 | 3h |
| **P0** | 修改 multi-execute 添加 OpenSpec 模式 | 2h |
| **P0** | 实现 Phase 3.5 任务验证 | 3h |
| **P0** | 实现 Phase 4.3 完整性检查 | 2h |
| **P1** | 添加命令行参数 | 1h |
| **P1** | 实现重试机制 | 1.5h |
| **P1** | 添加转换验证 | 1h |

**总工作量**: ~15.5 小时

### 预期效果

| 指标 | 改进前 | 改进后 | 提升 |
|------|--------|--------|------|
| **自动化程度** | 40% | 90% | ↑ 125% |
| **任务遗漏率** | ~30% | <5% | ↓ 83% |
| **需求覆盖率** | ~75% | >95% | ↑ 27% |
| **可追溯性** | 低 | 高 | - |
| **执行时间** | 100% | 80% | ↓ 20% |

### 下一步行动

1. **确认方案选择** - 选择方案 A/B/C
2. **开始实施** - 按照 P0 优先级实施
3. **测试验证** - 使用实际场景测试
4. **文档更新** - 更新使用文档
5. **推广使用** - 向用户介绍新流程

---

## 附录：完整的集成工作流

```mermaid
graph TD
    A[用户需求] --> B[multi-plan]
    B --> C{选择格式?}
    C -->|标准| D[.codebuddy/plan/*.md]
    C -->|OpenSpec| E[openspec/changes/*/]
    D --> F[multi-execute 标准模式]
    E --> G[multi-execute OpenSpec模式]
    F --> H[代码实现]
    G --> I[细粒度任务执行]
    I --> J[任务验证]
    J --> K[完整性检查]
    K --> L[质量评估]
    L --> M[交付确认]
    M --> N[/opsx:archive]
    N --> O[归档到 main specs]
    
    style E fill:#90EE90
    style G fill:#90EE90
    style I fill:#90EE90
    style J fill:#90EE90
    style K fill:#90EE90
    style L fill:#90EE90
```

---

**评估完成！** ✅

**推荐行动**:
1. 采用方案 A（增强版 multi-plan）
2. 按照 P0 优先级实施
3. 预计总工作量 ~15.5 小时

需要我开始实施吗？
