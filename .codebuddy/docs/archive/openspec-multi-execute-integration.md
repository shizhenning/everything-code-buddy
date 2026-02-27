# OpenSpec 与 multi-execute 细粒度管理集成方案

> 解决 multi-execute 在执行大计划时遗漏编码任务的问题

---

## 问题背景

### 当前问题

`multi-execute` 在执行大计划时经常遗漏一些编码任务，如核心逻辑未实现：

```
场景示例：实现"用户注册"功能

计划步骤：
1. 创建 User 数据模型 ✅
2. 实现注册 API ✅
3. 实现表单验证 ❌ 经常被遗漏
4. 实现邮件验证 ❌ 经常被遗漏
5. 添加错误处理 ❌ 经常被遗漏
6. 编写测试 ✅
```

### 根因分析

| 根因类别 | 具体问题 |
|---------|---------|
| **计划层面** | 实施步骤不够细化，缺乏核心逻辑标识 |
| **执行层面** | 缺乏任务完成状态跟踪 |
| **验证层面** | 没有中间检查点 |
| **审查层面** | code-reviewer 侧重代码质量，而非功能完整性 |

---

## OpenSpec 简介

### OpenSpec 工作流

OpenSpec 提供结构化的工件驱动开发流程：

```
1. proposal.md      - 变更提案（目标、范围、背景）
2. specs.md         - 详细规格（需求、验收标准）
3. design.md        - 设计文档（架构、模式、技术决策）
4. tasks.md         - 实施任务（细粒度、可追踪、带 checkbox）
5. tests.md         - 测试计划
6. risks.md         - 风险分析
7. rollback.md      - 回滚计划
```

### OpenSpec 的优势

| 特性 | 说明 |
|------|------|
| **标准化** | 固定的工件结构，便于理解和使用 |
| **细粒度** | tasks.md 拆解为 checkbox 级别的任务 |
| **可追踪** | 从 proposal → specs → design → tasks 的完整链路 |
| **可验证** | 每个 task 都有验收标准 |
| **可复用** | 工件可作为文档和知识库 |

---

## 集成方案概览

### 核心理念

```
OpenSpec 提供结构:
  proposal → specs → design → tasks
              ↓         ↓         ↓        ↓
multi-execute 执行和验证:
  任务拆解 → 细粒度实现 → 任务验证 → 完整性检查 → 质量评估
              ↓            ↓              ↓             ↓
      读取 tasks.md   更新 checkbox   验证 task 状态  对照 specs 检查
```

### 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     multi-execute 执行流程                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 0.5: OpenSpec 集成检查（新增）                           │
│  - 检查 openspec/changes/<name>/ 是否存在                       │
│  - 检查工件是否完整 (proposal, specs, design, tasks)            │
│  - 加载 OpenSpec 上下文                                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1.5: 任务拆解（集成 OpenSpec）                           │
│  - 读取 tasks.md                                                │
│  - 解析 checkbox 任务                                           │
│  - 生成 task-checklist.json                                     │
│  - 分析任务依赖关系                                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: 上下文收集                                            │
│  - 读取 proposal.md（目标、范围）                               │
│  - 读取 specs.md（需求、验收标准）                              │
│  - 读取 design.md（架构、模式）                                 │
│  - 收集相关代码文件                                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: 任务实施（集成 OpenSpec）                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  对于每个 task in task-checklist.json:                     │ │
│  │    1. 显示任务信息（从 tasks.md）                          │ │
│  │    2. 实施任务（编写代码）                                 │ │
│  │    3. 更新 tasks.md checkbox: - [ ] → - [x]              │ │
│  │    4. 进入 Phase 3.5 验证                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3.5: 任务验证（新增）                                     │
│  - 执行验证标准（从 tasks.md）                                  │
│  - 文件存在检查                                                 │
│  - 代码模式检查                                                 │
│  - 函数存在检查                                                 │
│  - 测试覆盖检查                                                 │
│  - 更新 task-checklist.json: status                            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: 代码审查（code-reviewer）                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4.3: 功能完整性检查（新增，集成 OpenSpec）               │
│  - 对照 specs.md 需求验证                                       │
│  - 检查所有关联任务是否完成                                     │
│  - 计算需求覆盖率                                               │
│  - 生成完整性报告                                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4.5: 质量评估（集成 OpenSpec）                           │
│  - 使用 OpenSpec 上下文评估                                     │
│  - 评估 OpenSpec 合规性                                         │
│  - 评估代码质量                                                 │
│  - 评估任务完成度                                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4.2: 交付确认                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 详细集成方案

### 改进 1: Phase 0.5 - OpenSpec 集成检查（P0）

#### 目标
确保 OpenSpec 变更存在且工件完整

#### 检查流程

```markdown
### Phase 0.5: OpenSpec Integration Check

1. **检查 OpenSpec 变更目录**:
   ```bash
   openspec/changes/<change-name>/
   ├── proposal.md      ✅ 必需
   ├── specs.md         ✅ 必需
   ├── design.md        ✅ 必需
   ├── tasks.md         ✅ 必需
   ├── tests.md         ⚠️ 推荐
   ├── risks.md         ⚠️ 推荐
   └── rollback.md      ⚠️ 推荐
   ```

2. **验证工件完整性**:
   - 所有必需工件（proposal, specs, design, tasks）必须存在
   - 工件内容必须符合 OpenSpec 格式

3. **加载 OpenSpec 上下文**:
   - 读取 proposal.md: 目标、范围、背景
   - 读取 specs.md: 需求、验收标准
   - 读取 design.md: 架构、模式、技术决策
   - 读取 tasks.md: 实施任务（用于 Phase 1.5）

4. **检查失败处理**:
   - 如果缺少必需工件 → 提示用户创建或使用传统模式
   - 如果工件格式错误 → 提示用户修复

OUTPUT:
- OpenSpec 上下文对象（存储在内存）
- 工件完整性报告
```

#### 命令行参数

```bash
# OpenSpec 模式执行
/execute --openspec <change-name>
```

---

### 改进 2: Phase 1.5 - 任务拆解（集成 OpenSpec）（P0）

#### 目标
从 OpenSpec tasks.md 读取任务并生成 task-checklist.json

#### tasks.md 格式

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
    - [ ] Uses ORM correctly (TypeORM/Prisma)
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

## Important Tasks (P1)

- [ ] **T3: Implement email validation**
  - **Description**: Validate email format and domain
  - **Priority**: P1
  - **Dependencies**: [T2]
  - **Estimated Time**: 20min
  - **Verification**:
    - [ ] Validation function: `validateEmail()`
    - [ ] Checks email format
    - [ ] Checks email domain
    - [ ] Returns appropriate error messages

- [ ] **T4: Implement password strength validation**
  - **Description**: Validate password strength requirements
  - **Priority**: P1
  - **Dependencies**: [T3]
  - **Estimated Time**: 20min
  - **Verification**:
    - [ ] Validation function: `validatePasswordStrength()`
    - [ ] Minimum 8 characters
    - [ ] Requires uppercase, lowercase, number
    - [ ] Returns strength score

## Optional Tasks (P2)

- [ ] **T5: Add email verification flow**
  - **Description**: Send verification email after registration
  - **Priority**: P2
  - **Dependencies**: [T2]
  - **Estimated Time**: 60min
  - **Verification**:
    - [ ] Email service: `sendVerificationEmail()`
    - [ ] Verification token generation
    - [ ] Verification endpoint: `POST /api/auth/verify-email`
    - [ ] Email template exists

- [ ] **T6: Add rate limiting**
  - **Description**: Limit registration attempts to prevent abuse
  - **Priority**: P2
  - **Dependencies**: [T2]
  - **Estimated Time**: 30min
  - **Verification**:
    - [ ] Rate limiter middleware
    - [ ] Configurable limit: 5 attempts per hour
    - [ ] Returns 429 Too Many Requests
```

#### task-checklist.json 格式

```json
{
  "source": "openspec",
  "changeName": "add-user-auth",
  "proposal": {
    "title": "Add User Authentication",
    "goal": "Enable users to register and login",
    "scope": ["User model", "Registration API", "Login API"]
  },
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
        "Uses ORM correctly (TypeORM/Prisma)",
        "Includes validation decorators"
      ],
      "status": "pending",
      "checkbox": "- [ ]",
      "lineNumber": 8
    },
    {
      "id": "T2",
      "name": "Implement registration API",
      "description": "Create API endpoint for user registration",
      "category": "core",
      "priority": "P0",
      "dependencies": ["T1"],
      "estimatedTime": "45min",
      "verificationCriteria": [
        "Endpoint exists: POST /api/auth/register",
        "Request body: { email, password }",
        "Response: { user, token }",
        "Handles validation errors",
        "Handles duplicate email"
      ],
      "status": "pending",
      "checkbox": "- [ ]",
      "lineNumber": 18
    },
    {
      "id": "T3",
      "name": "Implement email validation",
      "description": "Validate email format and domain",
      "category": "important",
      "priority": "P1",
      "dependencies": ["T2"],
      "estimatedTime": "20min",
      "verificationCriteria": [
        "Validation function: validateEmail()",
        "Checks email format",
        "Checks email domain",
        "Returns appropriate error messages"
      ],
      "status": "pending",
      "checkbox": "- [ ]",
      "lineNumber": 36
    }
  ],
  "statistics": {
    "total": 6,
    "core": 2,
    "important": 2,
    "optional": 2,
    "completed": 0,
    "pending": 6,
    "blocked": 0,
    "skipped": 0
  }
}
```

#### 任务分类说明

| 分类 | 优先级 | 说明 | 验证要求 | 遗漏后果 |
|------|--------|------|---------|---------|
| **core** | P0 | 核心逻辑 | 100% 验证 | 功能完全失效 |
| **important** | P1 | 重要功能 | 100% 验证 | 功能不完整 |
| **optional** | P2 | 可选功能 | 可选验证 | 影响有限 |

---

### 改进 3: Phase 3 - 任务实施（集成 OpenSpec）（P0）

#### 目标
实施任务并自动更新 tasks.md checkbox

#### 实施流程

```markdown
### Phase 3: Task Implementation (OpenSpec Integration)

对于每个 task in task-checklist.json（按优先级和依赖排序）:

1. **显示任务信息**:

   ```markdown
   ## 当前任务: T1 - Create User model
   
   - **类型**: Core (P0)
   - **描述**: Define User database model with required fields
   - **预计时间**: 30min
   - **依赖**: 无
   - **验证标准**:
     * File exists: src/models/User.ts
     * Fields: id, email, passwordHash, createdAt, updatedAt
     * Uses ORM correctly
     * Includes validation decorators
   
   [ ] 开始实施
   ```

2. **实施任务**（根据 OpenSpec 上下文）:
   - 读取 design.md 了解架构和模式
   - 编写代码实现任务
   - 遵循 design.md 中的技术决策

3. **更新 tasks.md checkbox**:

   ```diff
   - [ ] **T1: Create User model**
   + [x] **T1: Create User model**
   ```

4. **更新 task-checklist.json**:
   ```json
   {
     "status": "completed",
     "completedAt": "2026-02-26T10:30:00Z"
   }
   ```

5. **进入 Phase 3.5 验证**

循环直到所有任务完成
```

#### 依赖处理

```markdown
### 依赖解析

1. **构建依赖图**:
   ```
   T1 (无依赖)
     ↓
   T2 (依赖 T1)
     ↓
   T3 (依赖 T2)
   ```

2. **执行顺序**:
   - 按依赖顺序执行任务
   - 如果依赖任务未完成 → 标记为 blocked
   - 提示用户先完成依赖任务

3. **循环检测**:
   - 检测循环依赖
   - 如果发现循环依赖 → 停止执行，提示用户修复
```

---

### 改进 4: Phase 3.5 - 任务验证（P0）

#### 目标
在每个任务完成后验证其完成度

#### 验证流程

```markdown
### Phase 3.5: Task Verification (每个任务完成后)

1. **读取验证标准**（从 tasks.md）:

   ```json
   {
     "verificationCriteria": [
       "File exists: src/models/User.ts",
       "Fields: id, email, passwordHash, createdAt, updatedAt",
       "Uses ORM correctly (TypeORM/Prisma)",
       "Includes validation decorators"
     ]
   }
   ```

2. **执行验证检查**:

   **A. 文件存在检查**:
   ```bash
   # 检查文件是否存在
   test -f src/models/User.ts && echo "✅ File exists" || echo "❌ File missing"
   ```

   **B. 代码模式检查**:
   ```bash
   # 检查 ORM 使用
   grep -q "class User extends.*Entity" src/models/User.ts
   grep -q "@Column()" src/models/User.ts | head -5
   ```

   **C. 字段检查**:
   ```bash
   # 检查必需字段
   grep -q "email:" src/models/User.ts
   grep -q "passwordHash:" src/models/User.ts
   ```

   **D. 函数存在检查**:
   ```bash
   # 检查关键函数
   grep -q "function validateEmail" src/validation/email-validation.ts
   grep -q "function validatePasswordStrength" src/validation/password-validation.ts
   ```

   **E. 测试覆盖检查**:
   ```bash
   # 检查测试文件
   test -f tests/models/User.test.ts
   grep -q "User model" tests/models/User.test.ts
   ```

3. **验证决策**:

   ```python
   IF 所有验证标准通过 THEN
       更新 tasks.md: - [ ] → - [x]
       更新 task-checklist.json: status = "completed"
       继续下一个任务
   
   ELSE IF 核心任务 (core) 未通过 THEN
       更新 tasks.md: - [ ] → - [!] (标记为阻塞)
       更新 task-checklist.json: status = "blocked"
       **停止执行**
       显示失败原因，要求修复
   
   ELSE IF 重要任务 (important) 未通过 THEN
       更新 tasks.md: - [ ] → - [?] (标记为需确认)
       更新 task-checklist.json: status = "blocked"
       询问用户: "重要任务验证失败，修复还是跳过？"
   
   ELSE IF 可选任务 (optional) 未通过 THEN
       更新 tasks.md: - [ ] → - [-] (标记为跳过)
       更新 task-checklist.json: status = "skipped"
       继续下一个任务
   ```

4. **生成验证报告**:

   ```markdown
   ## 验证报告: T1 - Create User model
   
   **结果**: ✅ PASSED
   
   **检查项**:
   - ✅ File exists: src/models/User.ts
   - ✅ Fields: id, email, passwordHash, createdAt, updatedAt
   - ✅ Uses ORM correctly (TypeORM/Prisma)
   - ✅ Includes validation decorators
   
   **tasks.md 更新**: - [ ] → - [x]
   ```

5. **验证失败处理**:

   ```markdown
   ## 验证失败: T3 - Implement email validation
   
   **结果**: ❌ FAILED (重要任务)
   
   **失败检查项**:
   - ✅ Validation function: validateEmail()
   - ❌ Checks email format
   - ❌ Checks email domain
   - ✅ Returns appropriate error messages
   
   **建议修复**:
   1. 添加 email 格式正则表达式验证
   2. 添加 email 域名检查逻辑
   
   **选项**:
   - [ ] 修复任务
   - [ ] 跳过任务（不推荐）
   - [ ] 手动确认完成
   ```

---

### 改进 5: Phase 4.3 - 功能完整性检查（集成 OpenSpec）（P0）

#### 目标
对照 OpenSpec specs.md 验证功能完整性

#### 检查流程

```markdown
### Phase 4.3: Functionality Completeness Check (OpenSpec Integration)

1. **从 specs.md 提取需求**:

   ```markdown
   # Specification: User Authentication System
   
   ## Requirements
   
   ### REQ-1: User Registration
   User should be able to register with email and password.
   
   **Acceptance Criteria**:
   - [ ] User can submit registration form
   - [ ] Email is validated for format
   - [ ] Password is validated for strength
   - [ ] User account is created in database
   - [ ] User receives confirmation
   - [ ] Duplicate email is rejected
   
   ### REQ-2: Email Verification (Optional)
   User should verify email address after registration.
   
   **Acceptance Criteria**:
   - [ ] Verification email is sent
   - [ ] User can verify email via link
   - [ ] Email status is updated
   ```

2. **创建需求-任务映射**:

   ```json
   {
     "requirements": [
       {
         "id": "REQ-1",
         "name": "User Registration",
         "description": "User can register with email and password",
         "source": "specs.md §2.1",
         "tasks": ["T1", "T2", "T3", "T4"],
         "acceptanceCriteria": [
           "User can submit registration form",
           "Email is validated for format",
           "Password is validated for strength",
           "User account is created in database",
           "User receives confirmation",
           "Duplicate email is rejected"
         ],
         "status": "completed",
         "verification": {
           "automated": "npm test -- --testNamePattern='registration'",
           "manual": "Can user register successfully?"
         }
       },
       {
         "id": "REQ-2",
         "name": "Email Verification",
         "description": "User should verify email address after registration",
         "source": "specs.md §2.2",
         "tasks": ["T5"],
         "acceptanceCriteria": [
           "Verification email is sent",
           "User can verify email via link",
           "Email status is updated"
         ],
         "status": "failed",
         "verification": {
           "automated": "npm test -- --testNamePattern='email-verification'",
           "manual": "Can user verify email?"
         }
       }
     ],
     "statistics": {
       "total": 2,
       "completed": 1,
       "partial": 0,
       "failed": 1,
       "coverage": "50%"
     }
   }
   ```

3. **检查需求覆盖**:

   ```markdown
   ### 需求覆盖检查
   
   | 需求 ID | 需求名称 | 关联任务 | 状态 | 覆盖率 |
   |---------|---------|---------|------|--------|
   | REQ-1 | User Registration | T1, T2, T3, T4 | ✅ completed | 100% |
   | REQ-2 | Email Verification | T5 | ❌ failed | 0% |
   
   **整体覆盖率**: 50% ⚠️
   ```

4. **运行验证检查**:

   ```bash
   # 自动化测试
   npm test -- --testNamePattern='REQ-1'
   
   # 手动验证
   - [ ] Can user register with valid email and password?
   - [ ] Does email validation work?
   - [ ] Does password strength validation work?
   - [ ] Is duplicate email rejected?
   ```

5. **计算覆盖率评分**:

   ```python
   coverage_score = (
       completed_count * 100 +
       partial_count * 50 +
       failed_count * 0
   ) / total_requirements
   
   # 示例:
   coverage_score = (1 * 100 + 0 * 50 + 1 * 0) / 2 = 50%
   ```

6. **评分解读与决策**:

   | 覆盖率 | 状态 | 行动 |
   |--------|------|------|
   | 100% | ✅ 完整 | 允许交付 |
   | 80-99% | ⚠️ 基本完整 | 显示缺失需求，询问确认 |
   | <80% | ❌ 不完整 | 阻止交付，要求修复 |

7. **生成完整性报告**:

   ```markdown
   ## 功能完整性检查报告（OpenSpec 集成）
   
   ### 整体评估
   **覆盖率**: 50% ❌ (不完整)
   
   **需求统计**:
   - 总需求: 2
   - 已完成: 1 (REQ-1: User Registration)
   - 部分完成: 0
   - 未完成: 1 (REQ-2: Email Verification)
   
   ### 需求来源
   - Proposal: openspec/changes/add-user-auth/proposal.md
   - Specs: openspec/changes/add-user-auth/specs.md
   
   ### 未完成的需求
   **REQ-2: Email Verification**
   - **来源**: specs.md §2.2
   - **状态**: ❌ failed
   - **关联任务**: T5
   - **验收标准**:
     - [ ] Verification email is sent
     - [ ] User can verify email via link
     - [ ] Email status is updated
   - **缺失功能**:
     - [ ] 邮件发送服务未实现
     - [ ] 邮件模板未创建
     - [ ] 验证端点未创建
   
   ### 建议
   1. 完成核心需求 (REQ-1) ✅
   2. 实现可选需求 (REQ-2) 或标记为未来版本
   
   **决策**: 阻止交付，要求修复或确认跳过可选需求
   ```

---

### 改进 6: Phase 4.5 - 质量评估（集成 OpenSpec）（P0）

#### 目标
使用 OpenSpec 上下文评估整体质量

#### 评估流程

```markdown
### Phase 4.5: Quality Assessment (OpenSpec Integration)

#### 1. OpenSpec 合规性评估

```json
{
  "openspecCompliance": {
    "proposalAlignment": {
      "goalMet": true,
      "scopeWithin": true,
      "score": 100
    },
    "specsCompliance": {
      "requirementsMet": "1/2",
      "acceptanceCriteriaMet": "5/6",
      "score": 50
    },
    "designCompliance": {
      "architectureFollowed": true,
      "patternsUsed": true,
      "technicalDecisionsFollowed": true,
      "score": 100
    },
    "taskCompletion": {
      "core": "2/2 (100%)",
      "important": "2/2 (100%)",
      "optional": "0/2 (0%)",
      "overall": "4/6 (67%)"
    },
    "overallScore": 81.25
  }
}
```

#### 2. 代码质量评估

```markdown
## 代码质量评估

### 设计合规性
- ✅ 遵循 design.md 中的架构
- ✅ 使用指定的模式（Repository 模式）
- ✅ 遵循技术决策（使用 TypeORM）

### 代码质量
- ✅ 代码可读性高
- ✅ 适当的错误处理
- ✅ 输入验证完善
- ⚠️ 测试覆盖率 75% (目标 >80%)

### 安全性
- ✅ 密码使用 bcrypt 加密
- ✅ 输入验证防止注入
- ✅ 错误消息不泄露敏感信息

### 性能
- ✅ 使用数据库索引
- ✅ 避免了 N+1 查询
- ✅ 使用了缓存

### 可维护性
- ✅ 清晰的代码结构
- ✅ 充分的注释
- ✅ 合理的函数粒度
```

#### 3. 综合评分

```markdown
## 质量评估报告

### 综合评分: 81.25/100 ⚠️

| 维度 | 评分 | 权重 | 加权分 |
|------|------|------|--------|
| OpenSpec 合规性 | 81.25 | 40% | 32.5 |
| 代码质量 | 90 | 30% | 27 |
| 功能完整性 | 50 | 20% | 10 |
| 测试覆盖 | 75 | 10% | 7.5 |
| **总计** | | | **77** |

### 评级

| 评分范围 | 评级 | 决策 |
|---------|------|------|
| 90-100 | 优秀 | ✅ 立即交付 |
| 80-89 | 良好 | ⚠️ 建议改进后交付 |
| 70-79 | 及格 | ⚠️ 需要改进，询问确认 |
| <70 | 不及格 | ❌ 阻止交付，要求修复 |

### 当前评级: 及格 ⚠️

### 改进建议

**P0 (必须修复)**:
1. 完成核心需求 REQ-2 (Email Verification) 或明确标记为可选

**P1 (建议改进)**:
2. 提高测试覆盖率到 80% 以上
3. 添加更多边缘情况测试

**P2 (可选改进)**:
4. 优化性能瓶颈
5. 改进代码文档
```

---

## 完整工作流程

### 步骤 1: 创建 OpenSpec 变更

```bash
# 1. 创建新变更
/opsx:new add-user-auth

# 2. 继续 OpenSpec 流程
/opsx:continue add-user-auth

# 3. 按照引导创建工件:
#    - proposal.md (目标和范围)
#    - specs.md (需求和验收标准)
#    - design.md (架构和模式)
#    - tasks.md (实施任务，带 checkbox)
#    - tests.md (测试计划)
```

### 步骤 2: 执行 multi-execute（OpenSpec 模式）

```bash
# 使用 OpenSpec 模式执行
/execute --openspec add-user-auth
```

**执行流程**:

```
Phase 0.5: OpenSpec 集成检查
  ├─ 检查 openspec/changes/add-user-auth/ 目录
  ├─ 验证工件完整性 (proposal, specs, design, tasks)
  └─ 加载 OpenSpec 上下文
      ↓
Phase 1.5: 任务拆解
  ├─ 读取 tasks.md
  ├─ 解析 checkbox 任务
  ├─ 生成 task-checklist.json
  └─ 分析任务依赖关系
      ↓
Phase 2: 上下文收集
  ├─ 读取 proposal.md (目标、范围)
  ├─ 读取 specs.md (需求、验收标准)
  ├─ 读取 design.md (架构、模式)
  └─ 收集相关代码文件
      ↓
Phase 3: 任务实施 (循环)
  ├─ T1: Create User model
  │   ├─ 实施任务
  │   ├─ 更新 tasks.md: - [ ] → - [x]
  │   └─ Phase 3.5: 验证 ✅
  ├─ T2: Implement registration API
  │   ├─ 实施任务
  │   ├─ 更新 tasks.md: - [ ] → - [x]
  │   └─ Phase 3.5: 验证 ✅
  ├─ T3: Implement email validation
  │   ├─ 实施任务
  │   ├─ 更新 tasks.md: - [ ] → - [x]
  │   └─ Phase 3.5: 验证 ✅
  ├─ T4: Implement password strength validation
  │   ├─ 实施任务
  │   ├─ 更新 tasks.md: - [ ] → - [x]
  │   └─ Phase 3.5: 验证 ✅
  ├─ T5: Add email verification flow
  │   ├─ 实施任务
  │   ├─ 更新 tasks.md: - [ ] → - [-] (跳过)
  │   └─ Phase 3.5: 验证 → skipped
  └─ T6: Add rate limiting
      ├─ 实施任务
      ├─ 更新 tasks.md: - [ ] → - [-] (跳过)
      └─ Phase 3.5: 验证 → skipped
      ↓
Phase 4: 代码审查 (code-reviewer)
  └─ 审查代码质量和功能完整性
      ↓
Phase 4.3: 功能完整性检查
  ├─ 对照 specs.md 验证需求
  ├─ 检查任务完成情况
  ├─ 计算需求覆盖率
  └─ 生成完整性报告 (50% coverage)
      ↓
Phase 4.5: 质量评估
  ├─ 评估 OpenSpec 合规性
  ├─ 评估代码质量
  ├─ 评估功能完整性
  └─ 生成质量评估报告 (77/100)
      ↓
Phase 4.2: 交付确认
  ├─ 显示覆盖率: 50% ⚠️
  ├─ 显示质量评分: 77/100 ⚠️
  └─ 询问: 确认交付还是继续改进？
```

### 步骤 3: 归档变更

```bash
# 所有任务完成后，归档变更
/opsx:archive add-user-auth

# 这会将 delta specs 同步到 main specs
```

---

## 命令行参数扩展

```bash
# OpenSpec 模式执行
/execute --openspec <change-name>

# 重试特定任务
/execute --openspec <change-name> --retry-task T3

# 从某个任务继续执行
/execute --openspec <change-name> --continue-from T3

# 跳过某个任务（紧急情况）
/execute --openspec <change-name> --skip-task T5

# 重新运行完整性检查
/execute --openspec <change-name> --retry-completeness

# 强制运行所有任务（包括已完成的）
/execute --openspec <change-name> --force-all

# 仅运行特定类型的任务
/execute --openspec <change-name> --task-types core,important
```

---

## 优势对比

| 特性 | 传统 multi-execute | OpenSpec 集成 |
|------|------------------|--------------|
| **任务来源** | 手动拆解 | OpenSpec tasks.md ✅ |
| **结构化** | 自由文本 | 标准化工件 ✅ |
| **依赖管理** | 手动 | 自动 ✅ |
| **需求追踪** | 分散 | 集中 (proposal → specs → tasks) ✅ |
| **进度跟踪** | 手动 | checkbox 自动更新 ✅ |
| **验证追溯** | 分散 | 集成 (task → requirement → specs) ✅ |
| **复用性** | 低 | 高 (工件可复用) ✅ |
| **文档化** | 分散 | OpenSpec 工件即文档 ✅ |
| **回滚计划** | 无 | 有 (rollback.md) ✅ |
| **风险分析** | 无 | 有 (risks.md) ✅ |

---

## 预期效果

### 量化指标

| 指标 | 改进前 | 改进后 | 提升 |
|------|--------|--------|------|
| **任务遗漏率** | ~30% | <5% | ↓ 83% ✅ |
| **核心功能遗漏** | ~20% | 0% | ↓ 100% ✅ |
| **修复时间** | 2-4h | 15-30min | ↓ 75% ✅ |
| **需求覆盖率** | ~75% | >95% | ↑ 27% ✅ |
| **文档完整性** | ~40% | 100% | ↑ 150% ✅ |
| **可追溯性** | 低 | 高 | - |

### 对比示例

**改进前**:
```
大计划执行结果：
✅ 实现了主要功能
❌ 遗漏了表单验证
❌ 遗漏了错误处理
⚠️ 测试覆盖不完整
⚠️ 需要人工修复
⚠️ 缺少文档
⚠️ 需求追溯困难
```

**改进后**:
```
大计划执行结果：
✅ 所有 P0 任务完成
✅ 所有 P1 任务完成
✅ 核心逻辑完整实现
✅ 验证标准全部通过
✅ 需求覆盖率 100%
✅ OpenSpec 工件完整
✅ 可追溯性完整 (proposal → specs → tasks → code)
✅ 可以直接交付
```

---

## 实施计划

### 优先级

| 优先级 | 改进项 | 预估工作量 | 影响 |
|--------|--------|-----------|------|
| **P0** | Phase 0.5: OpenSpec 集成检查 | 1h | 确保 OpenSpec 可用 |
| **P0** | Phase 1.5: 任务拆解（集成 OpenSpec） | 2h | 读取 tasks.md |
| **P0** | Phase 3: 任务实施（集成 OpenSpec） | 2h | 自动更新 checkbox |
| **P0** | Phase 3.5: 任务验证 | 3h | 实时验证 |
| **P0** | Phase 4.3: 完整性检查（集成 OpenSpec） | 2h | 功能验证 |
| **P0** | Phase 4.5: 质量评估（集成 OpenSpec） | 1.5h | 整体评估 |
| **P1** | Phase 4: 增强审查（包含功能完整性） | 1h | 提高审查质量 |
| **P1** | 重试机制 | 1.5h | 提高修复效率 |

**总工作量**: ~14 小时

### 实施步骤

**Phase 1: 基础集成（P0）**
1. 修改 multi-execute.md，添加 Phase 0.5（OpenSpec 集成检查）
2. 添加 Phase 1.5（任务拆解，集成 OpenSpec）
3. 添加 Phase 3（任务实施，集成 OpenSpec）
4. 添加 Phase 3.5（任务验证）

**Phase 2: 验证集成（P0）**
5. 添加 Phase 4.3（完整性检查，集成 OpenSpec）
6. 添加 Phase 4.5（质量评估，集成 OpenSpec）

**Phase 3: 增强机制（P1）**
7. 修改 Phase 4 的 code-reviewer prompt
8. 添加重试机制和命令行参数

---

## 总结

### 核心改进点

1. **OpenSpec 集成** - 利用 OpenSpec 的标准化工件结构
2. **任务拆解** - 从 tasks.md 读取细粒度任务
3. **自动同步** - 实施时自动更新 tasks.md checkbox
4. **任务验证** - 每个任务完成后立即验证
5. **完整性检查** - 对照 specs.md 验证功能完整性
6. **增强评估** - 使用 OpenSpec 上下文评估质量
7. **可追溯性** - proposal → specs → tasks → code 的完整链路

### 关键价值

- ✅ **防止遗漏** - 核心功能 100% 覆盖
- ✅ **早期发现** - 实时验证，及时修复
- ✅ **精准定位** - 精确到任务级别的追踪
- ✅ **高效修复** - 一键重试，快速修复
- ✅ **质量保证** - 多层次验证机制
- ✅ **标准化** - OpenSpec 提供结构化流程
- ✅ **可追溯** - 完整的需求追溯链路
- ✅ **可复用** - 工件可作为文档和知识库

### 与传统 multi-execute 的关系

```
传统 multi-execute:
  计划 → 上下文 → 分析 → 实现 → 审查 → 评估 → 交付

OpenSpec 模式 multi-execute:
  OpenSpec 检查 → 任务拆解 (tasks.md) → 上下文 → 实现 (更新 checkbox)
  → 验证 → 审查 → 完整性检查 (specs.md) → 评估 (OpenSpec 上下文) → 交付

向后兼容:
  - 不使用 --openspec 参数时，保持原有流程
  - 使用 --openspec 参数时，启用 OpenSpec 集成功能
```

---

## 附录

### OpenSpec 工件模板

#### proposal.md 模板

```markdown
# Proposal: <change-name>

## Goal
Clear statement of what you want to achieve

## Background
Why is this change needed?

## Scope
What is included and excluded?

## Success Criteria
How will we know if this change is successful?

## Risks & Mitigations
What could go wrong and how will we handle it?

## Timeline
When will this be done?
```

#### specs.md 模板

```markdown
# Specification: <feature-name>

## Requirements

### REQ-1: <requirement-name>
<description>

**Acceptance Criteria**:
- [ ] <criteria-1>
- [ ] <criteria-2>

## Non-Functional Requirements
- Performance
- Security
- Scalability
```

#### design.md 模板

```markdown
# Design: <feature-name>

## Architecture Overview
<diagram or description>

## Key Components
<list of components>

## Data Models
<entity definitions>

## API Design
<endpoints>

## Technical Decisions
<decisions and rationale>

## Patterns & Best Practices
<patterns to follow>
```

#### tasks.md 模板

```markdown
# Implementation Tasks

## Core Tasks (P0)

- [ ] **T1: <task-name>**
  - **Description**: <description>
  - **Priority**: P0
  - **Dependencies**: []
  - **Estimated Time**: <time>
  - **Verification**:
    - [ ] <verification-criteria-1>
    - [ ] <verification-criteria-2>

## Important Tasks (P1)

- [ ] **T2: <task-name>**
  - **Description**: <description>
  - **Priority**: P1
  - **Dependencies**: [T1]
  - **Estimated Time**: <time>
  - **Verification**:
    - [ ] <verification-criteria-1>

## Optional Tasks (P2)

- [ ] **T3: <task-name>**
  - **Description**: <description>
  - **Priority**: P2
  - **Dependencies**: [T2]
  - **Estimated Time**: <time>
  - **Verification**:
    - [ ] <verification-criteria-1>
```
