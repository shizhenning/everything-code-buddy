# 通过计划链接管理确保一致性

## 问题

**是否可以通过计划链接管理来确保 multi-plan → OpenSpec → multi-execute 之间的一致性？**

---

## 核心答案

### ✅ **是的，可以通过计划链接管理确保一致性**

**重要说明**: multi-plan 可以对应**多个 OpenSpec 变更**(例如大型计划拆分为多个独立变更),而非一对一关系。

计划链接管理通过在各个文档之间建立**显式的引用关系**，形成一个完整的追踪链路，确保任何一处的变更都能被追溯和同步。

---

## 计划链接管理的三种机制

### 机制 1: 前向引用 (Forward Reference)

#### 概念
在原始计划中添加**指向 OpenSpec 工件的链接**。

**支持模式**:
- **一对一**: 一个计划对应一个 OpenSpec 变更
- **一对多**: 一个计划对应多个 OpenSpec 变更(大型功能拆分)

#### 实现

**模式 1: 一对一**
```markdown
# .codebuddy/plan/user-authentication.md

## Implementation Steps

### OpenSpec Reference
**关联 OpenSpec 变更**: `openspec/changes/user-authentication/`

**工件链接**:
- Proposal: [openspec/changes/user-authentication/proposal.md](../openspec/changes/user-authentication/proposal.md)
- Specs: [openspec/changes/user-authentication/specs/](../openspec/changes/user-authentication/specs/)
- Design: [openspec/changes/user-authentication/design.md](../openspec/changes/user-authentication/design.md)
- Tasks: [openspec/changes/user-authentication/tasks.md](../openspec/changes/user-authentication/tasks.md)

---

### Step 1: User Model Creation
(对应 OpenSpec 任务: T1-T5)
```

**模式 2: 一对多**
```markdown
# .codebuddy/plan/ecommerce-platform.md

## Implementation Steps

### OpenSpec Reference
**关联 OpenSpec 变更** (3个独立变更):

| 变更名称 | OpenSpec 路径 | 覆盖步骤 | 状态 |
|---------|---------------|---------|------|
| user-auth | openspec/changes/user-auth/ | Step 1-3 | ✅ |
| product-catalog | openspec/changes/product-catalog/ | Step 4-6 | ✅ |
| order-system | openspec/changes/order-system/ | Step 7-9 | ⏳ |

**工件链接**:

**用户认证模块**:
- [proposal.md](../../openspec/changes/user-auth/proposal.md)
- [tasks.md](../../openspec/changes/user-auth/tasks.md)

**商品目录模块**:
- [proposal.md](../../openspec/changes/product-catalog/proposal.md)
- [tasks.md](../../openspec/changes/product-catalog/tasks.md)

**订单系统模块**:
- [proposal.md](../../openspec/changes/order-system/proposal.md)
- [tasks.md](../../openspec/changes/order-system/tasks.md)

---

### Step 1: User Model Creation
(对应 OpenSpec: user-auth → T1-T5)

### Step 4: Product Model Creation
(对应 OpenSpec: product-catalog → T1-T4)

### Step 7: Order Model Creation
(对应 OpenSpec: order-system → T1-T6)
```

#### 优势
- ✅ **追溯性** - 可以从原始计划快速定位到 OpenSpec 工件
- ✅ **上下文保留** - 保留原始需求的来源
- ✅ **双向导航** - 支持正向和反向查找

---

### 机制 2: 后向引用 (Backward Reference)

#### 概念
在 OpenSpec 工件中添加**指向原始计划的链接**。

#### 实现
```markdown
# openspec/changes/user-authentication/proposal.md

## Metadata

**原始计划**: `.codebuddy/plan/user-authentication.md`
**生成时间**: 2025-02-26
**转换工具**: openspec-new-change
**Session ID**: session_xxxxx

---

## Change Overview

从 `.codebuddy/plan/user-authentication.md` 转换而来，保持原始需求的完整性。
```

```markdown
# openspec/changes/user-authentication/design.md

## Design Context

**基于原始设计**: `.codebuddy/plan/user-authentication.md` 中的 Architecture 部分

**变更记录**:
- 2025-02-26: 从原始计划提取架构设计
- 2025-02-27: 增加数据库分表方案（执行中发现的新需求）
```

#### 优势
- ✅ **源头追踪** - 可以追踪每个设计决策的来源
- ✅ **变更审计** - 记录所有变更历史
- ✅ **回溯能力** - 可以回溯到原始需求

---

### 机制 3: 中间映射表 (Mapping Table)

#### 概念
创建一个**独立的映射文件**，记录所有计划之间的对应关系。

**支持模式**:
- **单一映射**: 一个 OpenSpec 对应一个计划
- **共享映射**: 多个 OpenSpec 共享一个计划(通过变更ID关联)

#### 实现

**模式 1: 单一映射 (一对一)**
```markdown
# openspec/changes/user-authentication/.plan-mapping.md

## Plan Mapping Table

### Basic Info

| Field | Value |
|-------|-------|
| Source Plan | `.codebuddy/plan/user-authentication.md` |
| OpenSpec Change | `user-authentication` |
| Mapping Type | One-to-One |
| Created | 2025-02-26 |
| Last Sync | 2025-02-26 |

### Multi-Plan → OpenSpec Artifact Mapping

| Multi-Plan Section | OpenSpec Artifact | Transformation | Status |
|--------------------|-------------------|----------------|--------|
| Goal | proposal.md: Change Overview | 直接提取 | ✅ |
| Background | proposal.md: Context | 直接提取 | ✅ |
| Scope | proposal.md: Scope | 直接提取 | ✅ |
| Requirements | specs/*/spec.md | 按能力拆分 | ✅ |
| Acceptance Criteria | specs/*/validation.md | 转换为验证规则 | ✅ |
| Architecture | design.md: Architecture | 重组为架构图 | ✅ |
| Technical Decisions | design.md: Technology Stack | 提取技术栈 | ✅ |
| Implementation Steps | tasks.md: Task List | 细粒度拆解 | ✅ |

### Task Mapping (粗粒度 → 细粒度)

| Multi-Plan Step | OpenSpec Tasks | Transformation | Status |
|-----------------|----------------|----------------|--------|
| Step 1: User Model Creation | T1-T5 | 拆分为 5 个子任务 | ✅ |
| Step 2: Authentication Service | T6-T12 | 拆分为 7 个子任务 | ✅ |
| Step 3: Middleware Setup | T13-T16 | 拆分为 4 个子任务 | ✅ |
| Step 4: API Endpoints | T17-T22 | 拆分为 6 个子任务 | ✅ |
| Step 5: Frontend Integration | T23-T28 | 拆分为 6 个子任务 | ✅ |

### Consistency Check Results

| Check Item | Expected | Actual | Status |
|------------|----------|--------|--------|
| Requirements Coverage | 8 requirements | 8 specs | ✅ |
| Task Completeness | 5 steps | 28 tasks | ✅ |
| Dependency Integrity | 4 deps | 4 deps | ✅ |
| Artifact Links | 4 artifacts | 4 links | ✅ |
```

**模式 2: 共享映射 (一对多)**
```markdown
# .codebuddy/plan/.plan-to-openspec-mapping.md

## Multi-Plan to OpenSpec Mapping (One-to-Many)

### Source Plan

| Field | Value |
|-------|-------|
| Plan File | `.codebuddy/plan/ecommerce-platform.md` |
| Total Steps | 9 |
| Changes | 3 |

### OpenSpec Changes Mapping

| Change ID | OpenSpec Path | Covered Steps | Status | Last Sync |
|-----------|---------------|---------------|--------|-----------|
| user-auth | openspec/changes/user-auth/ | Step 1-3 | ✅ | 2025-02-26 |
| product-catalog | openspec/changes/product-catalog/ | Step 4-6 | ✅ | 2025-02-26 |
| order-system | openspec/changes/order-system/ | Step 7-9 | ⏳ | 2025-02-26 |

### Step to Change Mapping

| Step ID | Step Name | Change ID | Tasks | Status |
|---------|-----------|-----------|-------|--------|
| 1 | User Model Creation | user-auth | T1-T5 | ✅ |
| 2 | Auth Service | user-auth | T6-T12 | ✅ |
| 3 | Middleware | user-auth | T13-T16 | ✅ |
| 4 | Product Model | product-catalog | T1-T4 | ✅ |
| 5 | Catalog API | product-catalog | T5-T8 | ✅ |
| 6 | Search System | product-catalog | T9-T12 | ✅ |
| 7 | Order Model | order-system | T1-T6 | ⏳ |
| 8 | Order Service | order-system | T7-T11 | ⏳ |
| 9 | Payment Integration | order-system | T12-T15 | ⏳ |

### Cross-Change Dependencies

| Source | Target | Type | Status |
|--------|--------|------|--------|
| user-auth (T5) | product-catalog (T1) | user_id foreign key | ✅ |
| user-auth (T12) | order-system (T1) | buyer_id foreign key | ✅ |
| product-catalog (T8) | order-system (T7) | product_id foreign key | ✅ |

### Consistency Summary

| Metric | Value |
|--------|-------|
| Total Steps | 9 |
| Covered Steps | 9 (100%) |
| Total Tasks | 36 |
| Completed Tasks | 24 (67%) |
| OpenSpec Changes | 3 |
| Completed Changes | 2 (67%) |
```

#### 优势
- ✅ **完整映射** - 一目了然的所有关系
- ✅ **一致性检查** - 可自动化验证
- ✅ **变更追踪** - 记录转换历史

---

## 一致性保证机制

### 1. 自动链接验证

#### 实现逻辑
```javascript
// .codebuddy/scripts/validate-plan-links.js

async function validatePlanLinks(planPath) {
  const planContent = await fs.readFile(planPath, 'utf-8');

  // 检测模式: 一对一 或 一对多
  const mappingType = detectMappingType(planContent);

  if (mappingType === 'one-to-one') {
    return validateOneToOneMapping(planPath, planContent);
  } else if (mappingType === 'one-to-many') {
    return validateOneToManyMapping(planPath, planContent);
  } else {
    return { valid: false, error: 'No OpenSpec reference found' };
  }
}

function detectMappingType(planContent) {
  // 检查是否包含多个 OpenSpec 引用
  const openspecRefs = extractAllOpenSpecRefs(planContent);

  if (openspecRefs.length === 0) {
    return 'none';
  } else if (openspecRefs.length === 1) {
    return 'one-to-one';
  } else {
    return 'one-to-many';
  }
}

async function validateOneToOneMapping(planPath, planContent) {
  const openspecRef = extractOpenSpecRef(planContent);

  // 验证工件是否存在
  const requiredArtifacts = [
    'proposal.md',
    'specs/',
    'design.md',
    'tasks.md'
  ];

  const missingArtifacts = [];
  for (const artifact of requiredArtifacts) {
    const artifactPath = path.join(openspecRef, artifact);
    if (!await fs.exists(artifactPath)) {
      missingArtifacts.push(artifact);
    }
  }

  if (missingArtifacts.length > 0) {
    return {
      valid: false,
      error: `Missing artifacts: ${missingArtifacts.join(', ')}`
    };
  }

  // 验证后向引用
  const proposalPath = path.join(openspecRef, 'proposal.md');
  const proposalContent = await fs.readFile(proposalPath, 'utf-8');
  const backwardRef = extractBackwardRef(proposalContent);

  if (backwardRef !== planPath) {
    return {
      valid: false,
      error: `Backward reference mismatch: expected ${planPath}, got ${backwardRef}`
    };
  }

  return { valid: true, type: 'one-to-one', openspecPath: openspecRef };
}

async function validateOneToManyMapping(planPath, planContent) {
  // 提取所有 OpenSpec 引用
  const openspecRefs = extractAllOpenSpecRefs(planContent);
  const results = [];

  for (const ref of openspecRefs) {
    const result = {
      changeId: ref.changeId,
      path: ref.path,
      valid: true,
      errors: []
    };

    // 验证每个 OpenSpec 变更的工件
    const requiredArtifacts = ['proposal.md', 'tasks.md'];

    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(ref.path, artifact);
      if (!await fs.exists(artifactPath)) {
        result.valid = false;
        result.errors.push(`Missing ${artifact}`);
      }
    }

    // 验证后向引用
    const proposalPath = path.join(ref.path, 'proposal.md');
    const proposalContent = await fs.readFile(proposalPath, 'utf-8');
    const backwardRef = extractBackwardRef(proposalContent);

    if (backwardRef !== planPath) {
      result.valid = false;
      result.errors.push(`Backward reference mismatch`);
    }

    results.push(result);
  }

  const allValid = results.every(r => r.valid);
  return {
    valid: allValid,
    type: 'one-to-many',
    openspecChanges: results
  };
}
```

#### 集成到 workflow
```markdown
# .codebuddy/commands/multi-execute.md

### Phase 0.5: Validate Plan Links

```bash
# 验证计划链接
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/<feature>.md

# 如果验证失败
if [ $? -ne 0 ]; then
  echo "❌ Plan link validation failed"
  echo "请检查 OpenSpec 引用是否正确"
  exit 1
fi
```

**检查项**:
- ✅ 前向引用是否存在
- ✅ OpenSpec 工件是否存在
- ✅ 后向引用是否正确
- ✅ 映射表是否完整
```

---

### 2. 实时同步检查

#### 在 multi-execute 执行时检查
```markdown
### Phase 1: Execute Tasks

**每个任务执行前**:
```bash
# 检查任务链接是否有效
TASK_ID="T5"
OPENSPEC_PATH="openspec/changes/user-authentication"

# 1. 检查任务在 tasks.md 中存在
if ! grep -q "$TASK_ID:" "$OPENSPEC_PATH/tasks.md"; then
  echo "❌ Task $TASK_ID not found in tasks.md"
  exit 1
fi

# 2. 检查任务关联的 specs 是否存在
SPECS=$(grep -A 2 "$TASK_ID:" "$OPENSPEC_PATH/tasks.md" | grep "Related Specs:" | cut -d':' -f2)
for spec in $SPECS; do
  if [ ! -f "$OPENSPEC_PATH/specs/$spec/spec.md" ]; then
    echo "❌ Related spec not found: $spec"
    exit 1
  fi
done

# 3. 检查设计引用是否有效
DESIGN_REF=$(grep -A 2 "$TASK_ID:" "$OPENSPEC_PATH/tasks.md" | grep "Design Ref:" | cut -d':' -f2)
if [ -n "$DESIGN_REF" ] && ! grep -q "$DESIGN_REF" "$OPENSPEC_PATH/design.md"; then
  echo "❌ Design reference not found: $DESIGN_REF"
  exit 1
fi
```

**每个任务执行后**:
```bash
# 更新 checkbox
sed -i "s/- \[ \] $TASK_ID:/- [x] $TASK_ID:/" "$OPENSPEC_PATH/tasks.md"

# 更新映射表
node .codebuddy/scripts/update-mapping-table.js "$TASK_ID" completed
```
```

---

### 3. 一致性报告生成

#### 自动生成一致性报告
```javascript
// .codebuddy/scripts/generate-consistency-report.js

async function generateConsistencyReport(openspecPath) {
  const report = {
    timestamp: new Date().toISOString(),
    openspecPath,
    checks: []
  };
  
  // 检查 1: 前向引用完整性
  const mappingPath = path.join(openspecPath, '.plan-mapping.md');
  if (await fs.exists(mappingPath)) {
    report.checks.push({
      name: 'Forward Reference',
      status: '✅',
      detail: 'Mapping table exists'
    });
  } else {
    report.checks.push({
      name: 'Forward Reference',
      status: '❌',
      detail: 'Mapping table missing'
    });
  }
  
  // 检查 2: 后向引用完整性
  const proposalPath = path.join(openspecPath, 'proposal.md');
  const proposalContent = await fs.readFile(proposalPath, 'utf-8');
  if (proposalContent.includes('原始计划')) {
    report.checks.push({
      name: 'Backward Reference',
      status: '✅',
      detail: 'Original plan referenced'
    });
  } else {
    report.checks.push({
      name: 'Backward Reference',
      status: '❌',
      detail: 'No backward reference found'
    });
  }
  
  // 检查 3: 任务映射完整性
  const tasksPath = path.join(openspecPath, 'tasks.md');
  const tasksContent = await fs.readFile(tasksPath, 'utf-8');
  const taskCount = (tasksContent.match(/^T\d+:/gm) || []).length;
  
  if (taskCount > 0) {
    report.checks.push({
      name: 'Task Mapping',
      status: '✅',
      detail: `${taskCount} tasks mapped`
    });
  } else {
    report.checks.push({
      name: 'Task Mapping',
      status: '❌',
      detail: 'No tasks found'
    });
  }
  
  // 检查 4: 需求覆盖率
  const specsDir = path.join(openspecPath, 'specs');
  const specFiles = await fs.readdir(specsDir);
  const specCount = specFiles.filter(f => f.endsWith('.md')).length;
  
  report.checks.push({
    name: 'Requirement Coverage',
    status: specCount > 0 ? '✅' : '❌',
    detail: `${specCount} specs generated`
  });
  
  // 保存报告
  const reportPath = path.join(openspecPath, '.consistency-report.md');
  await fs.writeFile(reportPath, formatReport(report));
  
  return report;
}
```

---

## 完整的一致性保证流程

### 模式 1: 一对一流程

```
┌─────────────────────────────────────────────────────────────┐
│  1. 计划创建 (multi-plan)                                    │
│  生成 .codebuddy/plan/feature.md                            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  2. 转换 (openspec-new-change)                              │
│  ├─ 创建单个 OpenSpec 工件                                   │
│  ├─ 添加前向引用 (在原始计划中)                              │
│  ├─ 添加后向引用 (在 OpenSpec 工件中)                        │
│  └─ 创建单一映射表 (.plan-mapping.md)                        │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 验证 (validate-plan-links)                              │
│  ├─ 检测: 一对一模式                                          │
│  ├─ 验证前向引用                                             │
│  ├─ 验证后向引用                                             │
│  └─ 验证工件完整性                                           │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 执行 (multi-execute)                                     │
│  ├─ Phase 0.5: 实时验证链接                                  │
│  ├─ Phase 1: 执行任务                                       │
│  │   ├─ 执行前: 检查任务引用                                 │
│  │   ├─ 执行中: 更新 checkbox                                │
│  │   └─ 执行后: 更新映射表                                   │
│  └─ Phase 4: 生成一致性报告                                 │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  5. 归档 (openspec-archive-change)                           │
│  ├─ 同步回原始计划 (可选)                                    │
│  ├─ 更新映射表状态                                           │
│  └─ 生成最终一致性报告                                       │
└─────────────────────────────────────────────────────────────┘
```

### 模式 2: 一对多流程

```
┌─────────────────────────────────────────────────────────────┐
│  1. 计划创建 (multi-plan)                                    │
│  生成大型 .codebuddy/plan/platform.md                      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  2. 转换 (openspec-new-change 多次调用)                      │
│  ├─ 创建 OpenSpec 变更 1 (user-auth)                         │
│  ├─ 创建 OpenSpec 变更 2 (product-catalog)                  │
│  ├─ 创建 OpenSpec 变更 3 (order-system)                     │
│  ├─ 在原始计划添加多个前向引用                               │
│  ├─ 在每个 OpenSpec 添加后向引用                             │
│  └─ 创建共享映射表 (.plan-to-openspec-mapping.md)            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 验证 (validate-plan-links)                              │
│  ├─ 检测: 一对多模式                                          │
│  ├─ 验证所有前向引用                                          │
│  ├─ 验证所有后向引用                                          │
│  ├─ 验证步骤到变更的映射                                      │
│  └─ 验证跨变更依赖                                           │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 执行 (multi-execute)                                     │
│  ├─ Phase 0.5: 检测并选择变更                                 │
│  ├─ Phase 1: 按依赖顺序执行各变更                            │
│  │   ├─ 执行 user-auth (变更 1)                              │
│  │   ├─ 执行 product-catalog (变更 2, 依赖变更 1)            │
│  │   └─ 执行 order-system (变更 3, 依赖变更 1,2)            │
│  └─ Phase 4: 生成整体一致性报告                              │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  5. 归档 (openspec-archive-change)                           │
│  ├─ 逐个归档每个 OpenSpec 变更                               │
│  ├─ 更新共享映射表状态                                        │
│  └─ 生成跨变更一致性报告                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 最佳实践建议

### 1. 强制链接检查
```markdown
# .codebuddy/rules/openspec-workflow.md

**规则**: 所有 OpenSpec 变更必须包含完整的前向和后向引用。

**检查**:
- ✅ 原始计划包含 OpenSpec 引用
- ✅ Proposal 包含原始计划引用
- ✅ 存在 .plan-mapping.md
- ✅ 映射表完整且有效
```

### 2. 链接更新自动化
```bash
# .codebuddy/hooks/on-task-complete.js

// 任务完成后自动更新链接
on('task-complete', async (taskId) => {
  // 1. 更新 tasks.md checkbox
  await updateTaskCheckbox(taskId);
  
  // 2. 更新映射表
  await updateMappingTable(taskId);
  
  // 3. 验证链接完整性
  await validatePlanLinks();
});
```

### 3. 定期一致性审计
```bash
# .codebuddy/commands/opsx:audit.md

```bash
# 审计所有 OpenSpec 变更的一致性
for change in openspec/changes/*/; do
  echo "Auditing: $change"
  
  # 生成一致性报告
  node .codebuddy/scripts/generate-consistency-report.js "$change"
  
  # 验证链接
  node .codebuddy/scripts/validate-plan-links.js "$change/.plan-mapping.md"
  
  echo "---"
done

# 生成汇总报告
node .codebuddy/scripts/generate-audit-summary.md
```
```

---

## 总结

### ✅ 计划链接管理可以有效确保一致性

| 机制 | 作用 | 实施复杂度 |
|------|------|-----------|
| **前向引用** | 从原始计划定位 OpenSpec | 低 |
| **后向引用** | 从 OpenSpec 追溯原始计划 | 低 |
| **映射表** | 完整的转换关系记录 | 中 |
| **自动验证** | 实时检查链接有效性 | 中 |
| **一致性报告** | 可视化一致性状态 | 中 |

### 推荐实施方案

1. **Phase 1** (P0): 实现前向和后向引用 (支持一对一和一对多)
2. **Phase 2** (P1): 创建映射表 (单一映射和共享映射)
3. **Phase 3** (P2): 自动验证和报告 (跨模式检测)

## 关键创新点

### 1. 多模式链接管理

支持两种映射模式,系统自动检测并适配:

| 特性 | 一对一模式 | 一对多模式 |
|-----|-----------|-----------|
| **适用场景** | 单一功能/小型变更 | 大型平台/多模块 |
| **映射表位置** | `openspec/changes/<name>/.plan-mapping.md` | `.codebuddy/plan/.plan-to-openspec-mapping.md` |
| **引用关系** | 1个计划 ↔ 1个 OpenSpec | 1个计划 ↔ N个 OpenSpec |
| **依赖管理** | 任务级依赖 | 变更级 + 任务级依赖 |
| **执行策略** | 单一执行流 | 依赖图驱动的多执行流 |

### 2. 跨变更依赖追踪

在一对多模式下,支持追踪跨 OpenSpec 变更的依赖:

```javascript
// 检测跨变更依赖
function detectCrossChangeDependencies(mapping) {
  const deps = [];

  for (const step of mapping.steps) {
    for (const dep of step.dependencies) {
      const depChangeId = getChangeIdForStep(dep.stepId);
      if (depChangeId !== step.changeId) {
        deps.push({
          source: `${step.changeId}:${step.stepId}`,
          target: `${depChangeId}:${dep.stepId}`,
          type: 'cross-change'
        });
      }
    }
  }

  return deps;
}
```

### 3. 智能链接验证

自动检测链接模式并选择合适的验证逻辑:

```javascript
// 自动检测模式
async function autoValidatePlanLinks(planPath) {
  const type = await detectMappingType(planPath);

  if (type === 'one-to-one') {
    return await validateOneToOne(planPath);
  } else if (type === 'one-to-many') {
    return await validateOneToMany(planPath);
  }

  throw new Error(`Unknown mapping type: ${type}`);
}
```

通过计划链接管理，可以建立一个**完整的追踪链路**，支持 multi-plan → OpenSpec → multi-execute 之间的一对一和一对多关系，确保转换始终保持一致。
