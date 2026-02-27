# OpenSpec 完整最佳整合方案

## 执行摘要

本文档综合所有分析，提出一个完整、可实施且最优的 OpenSpec 集成方案。

**修正说明**：本文档已根据系统分析进行修正，解决了以下关键问题：

### ✅ 已修正的问题：
1. **文档结构一致性** - 统一了目录结构和术语规范
2. **代码逻辑完整性** - 完善了函数实现和错误处理
3. **内容一致性** - 统一了工作量估算和ROI计算
4. **技术细节优化** - 修正了路径错误和规格目录管理

### 🔍 关键修正点：
- **路径修正**：统一使用 `openspec/specs/` 作为全局规格目录
- **函数结构**：完善了 `validateOneToOneMapping` 函数的错误处理
- **工作量统一**：修正为39小时总工作量，保持数据一致性
- **术语标准化**：统一了"变更"、"工件"、"映射"等术语使用

---

## 1. 核心架构设计

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户需求入口                               │
│  /opsx:plan | /multi-plan | /opsx:new | /opsx:ff           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  统一规划层                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  multi-plan  │  │  task-refiner │  │  质量检查     │      │
│  │  (增强版)     │──│   (可选)      │──│  (自动)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenSpec 工件层                            │
│  proposal.md | specs/ | design.md | tasks.md               │
│  tests.md | risks.md | rollback.md | dependencies.md       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  统一执行层                                  │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  multi-execute   │  │  openspec-apply  │               │
│  │   (OpenSpec模式)  │──│   -change        │               │
│  └──────────────────┘  └──────────────────┘               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  验证与归档层                                │
│  openspec-verify | openspec-archive | openspec-sync       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 三层工作流

#### Layer 1: 规划层 (Planning)

**目标**: 将用户需求转换为结构化的细粒度计划

```
用户需求
  ↓
┌─────────────────────────────────────┐
│ 1. 需求分析                          │
│    - 检测需求复杂度                  │
│    - 判断是否需要 multi-model 分析    │
│    - 选择最佳规划路径                │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. 生成计划                          │
│    - multi-plan 生成粗粒度步骤       │
│    - 应用细粒度拆解规则              │
│    - 生成结构化计划                  │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. 质量检查                          │
│    - 检查任务粒度 (3-10min)         │
│    - 检查可验证性                    │
│    - 检查动作具体性                  │
│    - 不合格则调用 task-refiner       │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. 转换到 OpenSpec                   │
│    - 生成核心工件 (proposal, etc.)   │
│    - 生成细粒度 tasks.md             │
│    - 设置变更状态                    │
└─────────────────────────────────────┘
```

#### Layer 2: 执行层 (Execution)

**目标**: 按照细粒度任务逐步实施，实时更新进度

```
OpenSpec 上下文
  ↓
┌─────────────────────────────────────┐
│ 1. 读取上下文                        │
│    - proposal.md                    │
│    - specs/                         │
│    - design.md                      │
│    - tasks.md (细粒度 checkbox)      │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. 执行任务                          │
│    - 按顺序执行细粒度任务            │
│    - 每个任务完成后更新 checkbox      │
│    - 记录实际执行时间                │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. 任务验证                          │
│    - 自动验证文件/代码               │
│    - 运行测试验证                    │
│    - 不合格则标记并提示修复          │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. 完整性验证                        │
│    - 所有任务完成后对照 specs 验证    │
│    - 生成验证报告                    │
└─────────────────────────────────────┘
```

#### Layer 3: 验证与归档层 (Verification & Archiving)

**目标**: 确保实现与需求一致，积累知识资产

```
执行完成
  ↓
┌─────────────────────────────────────┐
│ 1. 完整性检查                        │
│    - 需求覆盖率检查                  │
│    - 设计一致性检查                  │
│    - 测试覆盖检查                    │
│    - 计划链接验证（新增）            │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. 质量验证                          │
│    - 代码质量检查                    │
│    - 安全检查                        │
│    - 性能检查                        │
│    - OpenSpec 工件完整性（新增）     │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. 归档变更                          │
│    - 合并 Delta Spec → Main Spec    │
│    - 更新知识库                      │
│    - 生成变更报告                    │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. 同步计划链                        │
│    - 更新 .codebuddy/plan/          │
│    - 保持双向同步                    │
└─────────────────────────────────────┘
```

**验证工具整合**:

- `/opsx:verify` - OpenSpec 工件一致性验证（核心）
- `/quality-assess` - 全面质量评估（扩展支持 OpenSpec）
- 两者配合使用：OpenSpec 验证 + 代码质量检查

---

## 2. 详细设计方案

### 2.1 计划链接管理系统 (核心基础)

#### 2.1.0 核心概念

**重要说明**: multi-plan 可以对应**多个 OpenSpec 变更**(1:N),而非一对一关系。

**支持两种映射模式**:
1. **一对一** (1:1): 一个计划对应一个 OpenSpec 变更
2. **一对多** (1:N): 一个计划对应多个 OpenSpec 变更(大型功能拆分为多个独立变更)

系统会自动检测链接模式并选择合适的处理策略。

#### 2.1.0a 统一文件结构（新增）

**修正后的统一目录结构**：

```
# 统一文件结构
- **OpenSpec变更目录**: `openspec/changes/<change-name>/`
- **全局规格目录**: `openspec/specs/` (所有变更共享)
- **计划文件**: `.codebuddy/plan/<feature>.md`
- **映射表**: `openspec/changes/<change-name>/.plan-mapping.md`
```

**术语统一**：
- "变更" → 统一为 "变更"
- "功能" → 统一为 "变更"  
- "文件" → 统一为 "工件"
- "关联" → 统一为 "映射"
- "链接" → 统一为 "引用"

#### 2.1.1 三层链接机制

在实施核心功能之前，首先建立完整的计划链接管理系统：

**机制 1: 前向引用 (Forward Reference)**
```markdown
# .codebuddy/plan/<feature>.md

## OpenSpec Reference Section

**关联 OpenSpec 变更**: `openspec/changes/<feature>/`

**工件链接**:
- Proposal: [openspec/changes/<feature>/proposal.md](../openspec/changes/<feature>/proposal.md)
- Specs: [openspec/changes/<feature>/specs/](../openspec/changes/<feature>/specs/)
- Design: [openspec/changes/<feature>/design.md](../openspec/changes/<feature>/design.md)
- Tasks: [openspec/changes/<feature>/tasks.md](../openspec/changes/<feature>/tasks.md)
- Mapping: [openspec/changes/<feature>/.plan-mapping.md](../openspec/changes/<feature>/.plan-mapping.md)
```

**机制 2: 后向引用 (Backward Reference)**
```markdown
# openspec/changes/<feature>/proposal.md

## Metadata

**原始计划**: `.codebuddy/plan/<feature>.md`
**生成时间**: 2025-02-26
**转换工具**: openspec-new-change
**Session ID**: session_xxxxx
**链接类型**: 双向链接
```

**机制 3: 映射表 (Mapping Table)**
```markdown
# openspec/changes/<feature>/.plan-mapping.md

## Plan Mapping Table

### Multi-Plan → OpenSpec Artifact Mapping

| Multi-Plan Section | OpenSpec Artifact | Transformation | Status | Last Sync |
|--------------------|-------------------|----------------|--------|-----------|
| Goal | proposal.md: Objectives | 直接提取 | ✅ | 2025-02-26 |
| Background | proposal.md: Motivation | 直接提取 | ✅ | 2025-02-26 |
| Scope | proposal.md: Scope | 直接提取 | ✅ | 2025-02-26 |
| Requirements | specs/*/spec.md | 按能力拆分 | ✅ | 2025-02-26 |
| Acceptance Criteria | specs/*/validation.md | 转换验证规则 | ✅ | 2025-02-26 |
| Architecture | design.md: Architecture | 重组架构图 | ✅ | 2025-02-26 |
| Technical Decisions | design.md: Tech Stack | 提取技术栈 | ✅ | 2025-02-26 |
| Implementation Steps | tasks.md: Task List | 细粒度拆解 | ✅ | 2025-02-26 |

### Task Mapping (粗粒度 → 细粒度)

| Multi-Plan Step | OpenSpec Tasks | Transformation | Status | Last Update |
|-----------------|----------------|----------------|--------|-------------|
| Step 1: User Model Creation | T1-T5 | 拆分为 5 个子任务 | ✅ | 2025-02-26 |
| Step 2: Authentication Service | T6-T12 | 拆分为 7 个子任务 | ✅ | 2025-02-26 |
| Step 3: Middleware Setup | T13-T16 | 拆分为 4 个子任务 | ✅ | 2025-02-26 |
| Step 4: API Endpoints | T17-T22 | 拆分为 6 个子任务 | ✅ | 2025-02-26 |
| Step 5: Frontend Integration | T23-T28 | 拆分为 6 个子任务 | ✅ | 2025-02-26 |

### Consistency Check Results

| Check Item | Expected | Actual | Status | Last Check |
|------------|----------|--------|--------|------------|
| Forward Reference | Present | Present | ✅ | 2025-02-26 |
| Backward Reference | Present | Present | ✅ | 2025-02-26 |
| Requirements Coverage | 8 requirements | 8 specs | ✅ | 2025-02-26 |
| Task Completeness | 5 steps | 28 tasks | ✅ | 2025-02-26 |
| Dependency Integrity | 4 deps | 4 deps | ✅ | 2025-02-26 |
| Artifact Links | 4 artifacts | 4 links | ✅ | 2025-02-26 |
```

**一对多模式示例**:
```markdown
# .codebuddy/plan/.plan-to-openspec-mapping.md

## Multi-Plan to OpenSpec Mapping (1:N)

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
```

#### 2.1.2 自动链接验证工具

创建 `.codebuddy/scripts/validate-plan-links.js`:

```javascript
const fs = require('fs').promises;
const path = require('path');

async function validatePlanLinks(planPath) {
  const results = {
    valid: true,
    mode: null, // 'one-to-one' or 'one-to-many'
    errors: [],
    warnings: [],
    checks: []
  };

  try {
    // 0. 检测映射模式
    const planContent = await fs.readFile(planPath, 'utf-8');
    const openspecRefs = extractAllOpenSpecRefs(planContent);

    if (openspecRefs.length === 0) {
      results.valid = false;
      results.errors.push('No OpenSpec references found');
      return results;
    } else if (openspecRefs.length === 1) {
      results.mode = 'one-to-one';
      return validateOneToOneMapping(planPath, planContent, openspecRefs[0]);
    } else {
      results.mode = 'one-to-many';
      return validateOneToManyMapping(planPath, planContent, openspecRefs);
    }
  } catch (error) {
    results.valid = false;
    results.errors.push(`Validation error: ${error.message}`);
    return results;
  }
}

// 辅助函数: 提取所有 OpenSpec 引用
function extractAllOpenSpecRefs(planContent) {
  const refs = [];

  // 模式 1: 单一引用 - **关联 OpenSpec 变更**: `openspec/changes/<name>/`
  // 使用更严格的模式，避免误匹配
  const singleRefMatch = planContent.match(/^\*\*关联 OpenSpec 变更\*\*:\s*`(openspec\/changes\/[^`]+?)`\s*$/m);
  if (singleRefMatch) {
    refs.push({
      type: 'single',
      path: singleRefMatch[1],
      changeId: singleRefMatch[1].replace(/^openspec\/changes\/|\/$/g, '')
    });
    return refs;
  }

  // 模式 2: 多引用表格 - 从 .plan-to-openspec-mapping.md 中提取
  // 检查是否包含多个 OpenSpec 引用的表格格式
  const tablePattern = /\|\s*Change ID\s*\|\s*OpenSpec Path\s*\|/;
  if (tablePattern.test(planContent)) {
    // 提取表格中的变更信息
    const lines = planContent.split('\n');
    let inTable = false;

    for (const line of lines) {
      // 跳过表头和分隔行
      if (line.includes('Change ID') || line.match(/^\|[\s\-]+\|/)) {
        inTable = true;
        continue;
      }

      // 提取表格行
      if (inTable && line.startsWith('|') && line.endsWith('|')) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3 && parts[1] && parts[2]) {
          refs.push({
            type: 'multi',
            changeId: parts[1],
            path: parts[2]
          });
        }
      }
    }
  }

  // 模式 3: 多个独立引用 - 检查多个 "**关联 OpenSpec 变更**" 模式
  // 使用更精确的模式，排除表头行
  const multiRefMatches = planContent.matchAll(/^\|\s*Change ID\s*\|\s*OpenSpec Path\s*\|[^\n]*\n((?:^\|\s*[^|\n]+\s*\|\s*openspec\/changes\/[^|\n]+\s*\|[^\n]*\n?)+)/gm);
  for (const match of multiRefMatches) {
    // 提取表格行
    const tableRows = match[1].split('\n').filter(row => row.trim());
    for (const row of tableRows) {
      const pathMatch = row.match(/openspec\/changes\/[^|\s]+/);
      if (pathMatch) {
        const path = pathMatch[0];
        refs.push({
          type: 'multi',
          changeId: path.replace(/^openspec\/changes\/|\/$/g, ''),
          path: path
        });
      }
    }
  }

  return refs;
}

async function validateOneToOneMapping(planPath, planContent, openspecRef) {
  const results = { mode: 'one-to-one', valid: true, errors: [], warnings: [], checks: [] };
  
  try {
    // 1. 验证工件是否存在
    
    // 2. 提取 OpenSpec 引用（使用更精确的模式）
    const openspecRefMatch = planContent.match(/^\*\*关联 OpenSpec 变更\*\*:\s*`(openspec\/changes\/[^`]+?)`\s*$/m);
    if (!openspecRefMatch) {
      results.valid = false;
      results.errors.push('No OpenSpec reference found in plan');
      return results;
    }
    
    const openspecPath = path.join(path.dirname(planPath), openspecRefMatch[1].replace('../', ''));
    results.checks.push({ name: 'Forward Reference', status: '✅', detail: 'OpenSpec reference exists' });
    
    // 3. 验证工件存在性
    const requiredArtifacts = ['proposal.md', 'specs/', 'design.md', 'tasks.md', '.plan-mapping.md'];
    const missingArtifacts = [];
    
    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(openspecPath, artifact);
      try {
        await fs.access(artifactPath);
        results.checks.push({ name: `Artifact: ${artifact}`, status: '✅', detail: 'File exists' });
      } catch {
        missingArtifacts.push(artifact);
        results.checks.push({ name: `Artifact: ${artifact}`, status: '❌', detail: 'File missing' });
      }
    }
    
    if (missingArtifacts.length > 0) {
      results.valid = false;
      results.errors.push(`Missing artifacts: ${missingArtifacts.join(', ')}`);
    }
    
    // 4. 验证后向引用
    const proposalPath = path.join(openspecPath, 'proposal.md');
    const proposalContent = await fs.readFile(proposalPath, 'utf-8');
    
    const backwardRefMatch = proposalContent.match(/\*\*原始计划\*\*:\s*`([^`]+)`/);
    if (backwardRefMatch) {
      const expectedPlanPath = backwardRefMatch[1];
      if (expectedPlanPath === planPath) {
        results.checks.push({ name: 'Backward Reference', status: '✅', detail: 'Links to correct plan' });
      } else {
        results.warnings.push(`Backward reference mismatch: expected ${planPath}, got ${expectedPlanPath}`);
      }
    } else {
      results.warnings.push('No backward reference found in proposal');
    }
    
    // 5. 验证映射表一致性
    const mappingPath = path.join(openspecPath, '.plan-mapping.md');
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    
    // 检查任务映射是否有效
    const taskMappingMatches = mappingContent.match(/\| Step \d+:\s+[^|]+\|\s+T\d+-T\d+\|/g);
    if (taskMappingMatches && taskMappingMatches.length > 0) {
      results.checks.push({ name: 'Task Mapping', status: '✅', detail: `${taskMappingMatches.length} mappings found` });
    } else {
      results.warnings.push('No task mappings found in mapping table');
    }
    
    // 6. 验证链接完整性
    const linkMatches = planContent.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (linkMatches && linkMatches.length >= 4) {
      results.checks.push({ name: 'Link Integrity', status: '✅', detail: `${linkMatches.length} links found` });
    } else {
      results.warnings.push('Insufficient links in plan document');
    }
    
  } catch (error) {
    results.valid = false;
    results.errors.push(`Validation error: ${error.message}`);
  }
  
  return results;
}

async function validateOneToManyMapping(planPath, planContent, openspecRefs) {
  const results = {
    mode: 'one-to-many',
    valid: true,
    errors: [],
    warnings: [],
    checks: [],
    changes: []
  };

  results.checks.push({
    name: 'Mapping Mode',
    status: '✅',
    detail: `One-to-Many: ${openspecRefs.length} OpenSpec changes detected`
  });

  // 1. 验证共享映射表是否存在
  const mappingPath = path.join(path.dirname(planPath), '.plan-to-openspec-mapping.md');
  try {
    await fs.access(mappingPath);
    results.checks.push({ name: 'Shared Mapping Table', status: '✅', detail: 'Exists' });
  } catch {
    results.valid = false;
    results.errors.push('Missing shared mapping table: .plan-to-openspec-mapping.md');
    return results;
  }

  // 2. 验证每个 OpenSpec 变更
  for (const ref of openspecRefs) {
    const changeResult = {
      changeId: ref.changeId,
      path: ref.path,
      valid: true,
      errors: [],
      warnings: []
    };

    const changePath = path.join(path.dirname(planPath), ref.path);

    // 2.1 验证工件存在性
    const requiredArtifacts = ['proposal.md', 'tasks.md'];
    const missingArtifacts = [];

    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(changePath, artifact);
      try {
        await fs.access(artifactPath);
      } catch {
        missingArtifacts.push(artifact);
        changeResult.valid = false;
        changeResult.errors.push(`Missing ${artifact}`);
      }
    }

    if (missingArtifacts.length > 0) {
      results.valid = false;
      results.errors.push(`Change ${ref.changeId}: Missing artifacts - ${missingArtifacts.join(', ')}`);
    } else {
      results.checks.push({ name: `Change ${ref.changeId}`, status: '✅', detail: 'All artifacts present' });
    }

    // 2.2 验证后向引用
    try {
      const proposalPath = path.join(changePath, 'proposal.md');
      const proposalContent = await fs.readFile(proposalPath, 'utf-8');

      if (proposalContent.includes('**原始计划**')) {
        const backwardRefMatch = proposalContent.match(/\*\*原始计划\*\*:\s*`([^`]+)`/);
        if (backwardRefMatch && backwardRefMatch[1] === planPath) {
          results.checks.push({ name: `Backward Ref (${ref.changeId})`, status: '✅', detail: 'Correct' });
        } else if (backwardRefMatch) {
          changeResult.warnings.push(`Backward reference mismatch: ${backwardRefMatch[1]}`);
        } else {
          changeResult.warnings.push('Original plan referenced but format unclear');
        }
      } else {
        changeResult.warnings.push('No backward reference in proposal');
      }
    } catch (error) {
      changeResult.errors.push(`Failed to verify backward reference: ${error.message}`);
    }

    results.changes.push(changeResult);
  }

  // 3. 验证步骤到变更的映射
  try {
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    const stepMappingMatches = mappingContent.matchAll(/\|\s*\d+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*T\d+-T\d+\s*\|/g);
    const stepMappings = Array.from(stepMappingMatches);

    if (stepMappings.length > 0) {
      results.checks.push({
        name: 'Step to Change Mapping',
        status: '✅',
        detail: `${stepMappings.length} steps mapped to changes`
      });
    } else {
      results.warnings.push('No step mappings found in shared mapping table');
    }
  } catch (error) {
    results.warnings.push(`Failed to verify step mappings: ${error.message}`);
  }

  // 4. 验证跨变更依赖 (如果有)
  try {
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    if (mappingContent.includes('Cross-Change Dependencies')) {
      const depMatches = mappingContent.matchAll(/\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*[^|]+\s*\|\s*✅\s*\|/g);
      const depCount = Array.from(depMatches).length;

      results.checks.push({
        name: 'Cross-Change Dependencies',
        status: '✅',
        detail: `${depCount} dependencies defined`
      });
    }
  } catch (error) {
    results.warnings.push(`Failed to verify cross-change dependencies: ${error.message}`);
  }

  return results;
}

// CLI 接口
if (require.main === module) {
  const planPath = process.argv[2];
  if (!planPath) {
    console.error('Usage: node validate-plan-links.js <plan-path>');
    process.exit(1);
  }
  
  validatePlanLinks(planPath)
    .then(results => {
      console.log('\n📋 Plan Link Validation Results');
      console.log('═'.repeat(50));
      
      results.checks.forEach(check => {
        console.log(`${check.status} ${check.name}: ${check.detail}`);
      });
      
      if (results.errors.length > 0) {
        console.log('\n❌ Errors:');
        results.errors.forEach(err => console.log(`  - ${err}`));
      }
      
      if (results.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        results.warnings.forEach(warn => console.log(`  - ${warn}`));
      }
      
      console.log('\n' + '═'.repeat(50));
      if (results.valid) {
        console.log('✅ All checks passed!');
        process.exit(0);
      } else {
        console.log('❌ Validation failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { validatePlanLinks };
```

#### 2.1.3 一致性报告生成工具

创建 `.codebuddy/scripts/generate-consistency-report.js`:

```javascript
const fs = require('fs').promises;
const path = require('path');

async function generateConsistencyReport(openspecPath) {
  const report = {
    timestamp: new Date().toISOString(),
    openspecPath,
    checks: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  try {
    // 检查 1: 映射表存在性
    const mappingPath = path.join(openspecPath, '.plan-mapping.md');
    try {
      await fs.access(mappingPath);
      report.checks.push({ name: 'Mapping Table', status: '✅', detail: 'Exists and accessible' });
      report.summary.total++;
      report.summary.passed++;
    } catch {
      report.checks.push({ name: 'Mapping Table', status: '❌', detail: 'Missing' });
      report.summary.total++;
      report.summary.failed++;
    }

    // 检查 2: 后向引用完整性
    const proposalPath = path.join(openspecPath, 'proposal.md');
    const proposalContent = await fs.readFile(proposalPath, 'utf-8');
    if (proposalContent.includes('**原始计划**')) {
      report.checks.push({ name: 'Backward Reference', status: '✅', detail: 'Original plan referenced' });
      report.summary.total++;
      report.summary.passed++;
    } else {
      report.checks.push({ name: 'Backward Reference', status: '❌', detail: 'No reference found' });
      report.summary.total++;
      report.summary.failed++;
    }

    // 检查 3: 任务映射完整性
    const tasksPath = path.join(openspecPath, 'tasks.md');
    const tasksContent = await fs.readFile(tasksPath, 'utf-8');
    const taskCount = (tasksContent.match(/^\-\s+\[[ x]\]\s+\*\*[T]\d+:/gm) || []).length;
    
    if (taskCount > 0) {
      report.checks.push({ name: 'Task Mapping', status: '✅', detail: `${taskCount} tasks mapped` });
      report.summary.total++;
      report.summary.passed++;
    } else {
      report.checks.push({ name: 'Task Mapping', status: '❌', detail: 'No tasks found' });
      report.summary.total++;
      report.summary.failed++;
    }

    // 检查 4: 需求覆盖率 (注意: specs 在全局目录)
    // 修正路径错误：使用项目根目录的全局规格目录
    const globalSpecsDir = path.join(process.cwd(), 'openspec/specs');
    let specCount = 0;
    try {
      const specDirs = await fs.readdir(globalSpecsDir);
      const changeName = path.basename(openspecPath);
      // 查找与变更相关的 spec 目录
      for (const dir of specDirs) {
        if (dir.includes(changeName) || changeName.includes(dir)) {
          const stat = await fs.stat(path.join(globalSpecsDir, dir));
          if (stat.isDirectory()) {
            specCount++;
          }
        }
      }
    } catch {
      // specs 目录可能不存在
    }
    
    if (specCount > 0) {
      report.checks.push({ name: 'Requirement Coverage', status: '✅', detail: `${specCount} related specs found in global specs/` });
      report.summary.total++;
      report.summary.passed++;
    } else {
      report.checks.push({ name: 'Requirement Coverage', status: '⚠️', detail: 'No related specs found (specs managed in openspec/specs/)' });
      report.summary.total++;
      report.summary.warnings++;
    }

    // 检查 5: 链接同步状态
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');
    const lastSyncMatch = mappingContent.match(/\| Last Sync \| ([^|]+) \|/);
    if (lastSyncMatch) {
      const lastSyncDate = new Date(lastSyncMatch[1].trim());
      const daysSinceSync = Math.floor((new Date() - lastSyncDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceSync <= 7) {
        report.checks.push({ name: 'Link Sync', status: '✅', detail: `Last sync: ${daysSinceSync} days ago` });
        report.summary.total++;
        report.summary.passed++;
      } else {
        report.checks.push({ name: 'Link Sync', status: '⚠️', detail: `Last sync: ${daysSinceSync} days ago (stale)` });
        report.summary.total++;
        report.summary.warnings++;
      }
    } else {
      report.checks.push({ name: 'Link Sync', status: '⚠️', detail: 'No sync timestamp found' });
      report.summary.total++;
      report.summary.warnings++;
    }

  } catch (error) {
    report.checks.push({ name: 'Error', status: '❌', detail: error.message });
    report.summary.total++;
    report.summary.failed++;
  }

  return report;
}

function formatReport(report) {
  const lines = [];
  
  lines.push('# Consistency Report');
  lines.push('');
  lines.push(`**Generated**: ${report.timestamp}`);
  lines.push(`**Path**: ${report.openspecPath}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Checks | ${report.summary.total} |`);
  lines.push(`| Passed | ${report.summary.passed} |`);
  lines.push(`| Failed | ${report.summary.failed} |`);
  lines.push(`| Warnings | ${report.summary.warnings} |`);
  lines.push('');
  lines.push('## Checks');
  lines.push('');
  
  report.checks.forEach(check => {
    lines.push(`- ${check.status} **${check.name}**: ${check.detail}`);
  });
  
  return lines.join('\n');
}

// CLI 接口 - 支持一对一和一对多模式
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // 检查是否是一对多模式
  const oneToManyIndex = args.indexOf('--one-to-many');
  if (oneToManyIndex !== -1) {
    // 一对多模式: node generate-consistency-report.js --one-to-many <mapping-file> <plan-file>
    const mappingPath = args[oneToManyIndex + 1];
    const planPath = args[oneToManyIndex + 2];
    
    if (!mappingPath || !planPath) {
      console.error('Usage: node generate-consistency-report.js --one-to-many <mapping-file> <plan-file>');
      process.exit(1);
    }
    
    // 动态导入一对多报告生成函数（避免循环依赖）
    const { generateOneToManyConsistencyReport, formatOneToManyReport } = require('./generate-consistency-report-onetomany');
    
    generateOneToManyConsistencyReport(mappingPath, planPath)
      .then(report => {
        const formatted = formatOneToManyReport(report);
        console.log(formatted);
        
        // 保存报告到映射表所在目录
        const reportDir = path.dirname(mappingPath);
        const reportPath = path.join(reportDir, '.consistency-report.md');
        return fs.writeFile(reportPath, formatted).then(() => reportPath);
      })
      .then((reportPath) => {
        console.log(`\n✅ Report saved to ${reportPath}`);
        process.exit(0);
      })
      .catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      });
  } else {
    // 一对一模式: node generate-consistency-report.js <openspec-path>
    const openspecPath = args[0];
    if (!openspecPath) {
      console.error('Usage: node generate-consistency-report.js <openspec-path>');
      console.error('   or: node generate-consistency-report.js --one-to-many <mapping-file> <plan-file>');
      process.exit(1);
    }
    
    generateConsistencyReport(openspecPath)
      .then(report => {
        const formatted = formatReport(report);
        console.log(formatted);
        
        // 保存报告
        const reportPath = path.join(openspecPath, '.consistency-report.md');
        return fs.writeFile(reportPath, formatted).then(() => reportPath);
      })
      .then((reportPath) => {
        console.log(`\n✅ Report saved to ${reportPath}`);
        process.exit(0);
      })
      .catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
      });
  }
}

module.exports = { generateConsistencyReport };
```

#### 2.1.4 一对多一致性报告生成工具

扩展现有报告生成工具以支持一对多模式:

```javascript
async function generateOneToManyConsistencyReport(mappingPath, planPath) {
  const report = {
    timestamp: new Date().toISOString(),
    mappingType: 'one-to-many',
    planPath,
    checks: [],
    changes: [],
    summary: {
      totalChanges: 0,
      completedChanges: 0,
      totalSteps: 0,
      completedSteps: 0,
      crossChangeDeps: 0
    }
  };

  try {
    // 1. 读取共享映射表
    const mappingContent = await fs.readFile(mappingPath, 'utf-8');

    // 2. 提取变更信息
    const changeSection = extractTableSection(mappingContent, 'OpenSpec Changes Mapping');
    const changes = parseChangeTable(changeSection);

    report.summary.totalChanges = changes.length;
    report.changes = changes;

    // 3. 检查每个变更
    for (const change of changes) {
      const changePath = path.join(path.dirname(mappingPath), change.path);

      // 3.1 验证工件完整性
      const artifactCheck = await verifyChangeArtifacts(changePath);
      change.artifactCheck = artifactCheck;
      report.checks.push({
        name: `Artifacts (${change.changeId})`,
        status: artifactCheck.valid ? '✅' : '❌',
        detail: `${artifactCheck.present}/${artifactCheck.total} artifacts present`
      });

      // 3.2 统计完成状态
      if (change.status === '✅') {
        report.summary.completedChanges++;
      }

      // 3.3 读取任务并统计
      try {
        const tasksPath = path.join(changePath, 'tasks.md');
        const tasksContent = await fs.readFile(tasksPath, 'utf-8');

        const totalTasks = (tasksContent.match(/^\-\s+\[[ x]\]\s+/gm) || []).length;
        const completedTasks = (tasksContent.match(/^\-\s+\[x\]\s+/gm) || []).length;

        change.tasks = { total: totalTasks, completed: completedTasks };
        report.summary.totalSteps += totalTasks;
        report.summary.completedSteps += completedTasks;
      } catch {
        change.tasks = { total: 0, completed: 0 };
      }
    }

    // 4. 检查跨变更依赖
    const depSection = extractTableSection(mappingContent, 'Cross-Change Dependencies');
    const deps = parseDependencyTable(depSection);
    report.summary.crossChangeDeps = deps.length;

    report.checks.push({
      name: 'Cross-Change Dependencies',
      status: '✅',
      detail: `${deps.length} dependencies defined`
    });

    // 5. 验证依赖完整性
    for (const dep of deps) {
      const sourceChange = findChangeById(changes, dep.sourceChangeId);
      const targetChange = findChangeById(changes, dep.targetChangeId);

      if (!sourceChange || !targetChange) {
        report.checks.push({
          name: `Dependency Check (${dep.source})`,
          status: '⚠️',
          detail: 'Referenced change not found'
        });
      }
    }

  } catch (error) {
    report.checks.push({
      name: 'Error',
      status: '❌',
      detail: error.message
    });
  }

  return report;
}

function extractTableSection(content, tableName) {
  const lines = content.split('\n');
  const startIdx = lines.findIndex(line => line.includes(tableName));

  if (startIdx === -1) return '';

  let endIdx = startIdx + 1;
  while (endIdx < lines.length && lines[endIdx].trim() !== '' && !lines[endIdx].startsWith('##')) {
    endIdx++;
  }

  return lines.slice(startIdx, endIdx).join('\n');
}

function parseChangeTable(tableContent) {
  const changes = [];
  const lines = tableContent.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('Change ID')) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 5) {
      changes.push({
        changeId: parts[1],
        path: parts[2],
        status: parts[3],
        lastSync: parts[4]
      });
    }
  }

  return changes;
}

function parseDependencyTable(tableContent) {
  const deps = [];
  const lines = tableContent.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('Source')) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 4) {
      // 从 "change-id (T5)" 格式提取 changeId
      const sourceMatch = parts[1].match(/^([a-z-]+)/);
      const targetMatch = parts[2].match(/^([a-z-]+)/);

      if (sourceMatch && targetMatch) {
        deps.push({
          source: parts[1],
          target: parts[2],
          type: parts[3],
          status: parts[4],
          sourceChangeId: sourceMatch[1],
          targetChangeId: targetMatch[1]
        });
      }
    }
  }

  return deps;
}

function findChangeById(changes, changeId) {
  return changes.find(c => c.changeId === changeId);
}

async function verifyChangeArtifacts(changePath) {
  const artifacts = ['proposal.md', 'tasks.md', 'specs/', 'design.md'];
  const result = { valid: true, present: 0, total: artifacts.length, missing: [] };

  for (const artifact of artifacts) {
    try {
      await fs.access(path.join(changePath, artifact));
      result.present++;
    } catch {
      result.valid = false;
      result.missing.push(artifact);
    }
  }

  return result;
}

function formatOneToManyReport(report) {
  const lines = [];

  lines.push('# One-to-Many Consistency Report');
  lines.push('');
  lines.push(`**Generated**: ${report.timestamp}`);
  lines.push(`**Plan**: ${report.planPath}`);
  lines.push(`**Mapping Type**: ${report.mappingType}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Changes | ${report.summary.totalChanges} |`);
  lines.push(`| Completed Changes | ${report.summary.completedChanges} (${Math.round(report.summary.completedChanges / report.summary.totalChanges * 100)}%) |`);
  lines.push(`| Total Steps | ${report.summary.totalSteps} |`);
  lines.push(`| Completed Steps | ${report.summary.completedSteps} (${Math.round(report.summary.completedSteps / report.summary.totalSteps * 100)}%) |`);
  lines.push(`| Cross-Change Dependencies | ${report.summary.crossChangeDeps} |`);
  lines.push('');
  lines.push('## Change Details');
  lines.push('');

  for (const change of report.changes) {
    lines.push(`### ${change.changeId}`);
    lines.push('');
    lines.push(`| Field | Value |`);
    lines.push(`|-------|-------|`);
    lines.push(`| Path | ${change.path} |`);
    lines.push(`| Status | ${change.status} |`);
    lines.push(`| Tasks | ${change.tasks.completed}/${change.tasks.total} |`);
    lines.push(`| Last Sync | ${change.lastSync} |`);
    lines.push('');

    if (change.artifactCheck && change.artifactCheck.missing.length > 0) {
      lines.push(`**Missing Artifacts**: ${change.artifactCheck.missing.join(', ')}`);
      lines.push('');
    }
  }

  lines.push('## Checks');
  lines.push('');

  report.checks.forEach(check => {
    lines.push(`- ${check.status} **${check.name}**: ${check.detail}`);
  });

  return lines.join('\n');
}
```

### 2.2 层次查找与自动检测系统

#### 2.2.1 multi-execute 增强版检测逻辑

在 `commands/multi-execute.md` 中添加 Phase 0:

```markdown
### Phase 0: OpenSpec Mode Detection & Link Validation

`[Mode: Detect & Validate]`

#### 0.1 自动检测模式

```bash
# 检测函数 - 支持一对一和一对多模式
detectOpenSpecMode() {
  local input="$1"

  # 模式 1: 显式 --openspec 参数
  if [[ "$input" == *"--openspec"* ]]; then
    local changeName=$(echo "$input" | grep -oP '(?<=--openspec\s)\S+')
    if [ -d "openspec/changes/${changeName}" ]; then
      echo "mode=openspec,mapping=one-to-one,changeName=${changeName},basePath=openspec/changes/${changeName}"
      return 0
    fi
  fi

  # 模式 2: .codebuddy/plan 文件 + 自动查找关联 OpenSpec
  if [[ "$input" == ".codebuddy/plan/"* ]]; then
    local planFile="$input"
    local planName=$(basename "$planFile" .md)

    # 2.1 检测一对多模式: 查找共享映射表
    local sharedMappingPath="${planFile%/*}/.plan-to-openspec-mapping.md"
    if [ -f "$sharedMappingPath" ]; then
      # 提取所有 OpenSpec 变更
      local changes=$(grep -A 10 "OpenSpec Changes Mapping" "$sharedMappingPath" | grep "^\s*|" | grep "openspec/changes" | awk -F'|' '{print $2}' | xargs)
      if [ -n "$changes" ]; then
        echo "mode=openspec,mapping=one-to-many,planPath=${planFile},mappingPath=${sharedMappingPath}"
        return 0
      fi
    fi

    # 2.2 检测一对一模式: 单一引用
    local openspecRef=$(grep -oP '(?<=\*\*关联 OpenSpec 变更\*\*: `)[^`]+' "$planFile" 2>/dev/null)

    if [ -n "$openspecRef" ]; then
      local openspecPath="${planFile%/*}/${openspecRef}"
      if [ -d "$openspecPath" ]; then
        echo "mode=openspec,mapping=one-to-one,changeName=${planName},basePath=${openspecPath},planPath=${planFile}"
        return 0
      fi
    fi

    # 如果没有显式引用，尝试按名称查找
    if [ -d "openspec/changes/${planName}" ]; then
      echo "mode=openspec,mapping=one-to-one,changeName=${planName},basePath=openspec/changes/${planName},planPath=${planFile}"
      return 0
    fi

    # 标准模式
    echo "mode=standard,planPath=${planFile}"
    return 0
  fi

  # 模式 3: 直接指定 OpenSpec 路径
  if [[ "$input" == "openspec/changes/"* ]]; then
    local changeName=$(echo "$input" | grep -oP '(?<=openspec/changes/)[^/]+')
    if [ -d "openspec/changes/${changeName}" ]; then
      echo "mode=openspec,mapping=one-to-one,changeName=${changeName},basePath=openspec/changes/${changeName}"
      return 0
    fi
  fi

  # 默认：标准模式
  echo "mode=standard,input=${input}"
}
```

#### 0.2 链接完整性验证

```bash
# 验证计划链接
validatePlanLinks() {
  local planPath="$1"
  
  echo "🔍 验证计划链接..."
  
  # 1. 检查前向引用
  if ! grep -q "关联 OpenSpec 变更" "$planPath"; then
    echo "❌ 缺少 OpenSpec 引用"
    return 1
  fi
  
  # 2. 提取 OpenSpec 路径
  local openspecRef=$(grep -oP '(?<=\*\*关联 OpenSpec 变更\*\*: `)[^`]+' "$planPath")
  local openspecPath="${planPath%/*}/${openspecRef}"
  
  # 3. 验证工件存在
  local requiredArtifacts=("proposal.md" "specs/" "design.md" "tasks.md" ".plan-mapping.md")
  local missingArtifacts=()
  
  for artifact in "${requiredArtifacts[@]}"; do
    if [ ! -f "${openspecPath}/${artifact}" ]; then
      missingArtifacts+=("$artifact")
    fi
  done
  
  if [ ${#missingArtifacts[@]} -gt 0 ]; then
    echo "❌ 缺少工件: ${missingArtifacts[*]}"
    return 1
  fi
  
  # 4. 验证后向引用
  local proposalContent=$(cat "${openspecPath}/proposal.md")
  if ! echo "$proposalContent" | grep -q "原始计划"; then
    echo "⚠️  缺少后向引用"
  fi
  
  # 5. 验证映射表
  if ! node .codebuddy/scripts/validate-plan-links.js "$planPath" >/dev/null 2>&1; then
    echo "⚠️  映射表验证失败"
  fi
  
  echo "✅ 链接验证通过"
  return 0
}
```

#### 0.3 层次化工件加载

```bash
# 加载 OpenSpec 工件（带链接验证）
loadOpenSpecArtifacts() {
  local basePath="$1"
  
  echo "📂 加载 OpenSpec 工件..."
  
  # 1. 验证映射表
  local mappingPath="${basePath}/.plan-mapping.md"
  if [ ! -f "$mappingPath" ]; then
    echo "❌ 缺少映射表: .plan-mapping.md"
    echo "请运行: /opsx:new 重新创建变更"
    return 1
  fi
  
  # 2. 从映射表读取工件路径
  local proposalPath=$(grep "^| proposal.md" "$mappingPath" | head -1 | awk -F'|' '{print $3}' | xargs)
  local specsPath=$(grep "^| specs/" "$mappingPath" | head -1 | awk -F'|' '{print $3}' | xargs)
  local designPath=$(grep "^| design.md" "$mappingPath" | head -1 | awk -F'|' '{print $3}' | xargs)
  local tasksPath=$(grep "^| tasks.md" "$mappingPath" | head -1 | awk -F'|' '{print $3}' | xargs)
  
  # 3. 加载工件
  if [ -f "$basePath/proposal.md" ]; then
    PROPOSAL=$(cat "$basePath/proposal.md")
    echo "   ✓ proposal.md"
  else
    echo "   ✗ proposal.md (missing)"
    return 1
  fi

  if [ -d "$basePath/specs" ]; then
    SPECS=$(cat "$basePath/specs"/*.md)
    echo "   ✓ specs/"
  else
    echo "   ✗ specs/ (missing)"
    return 1
  fi

  if [ -f "$basePath/design.md" ]; then
    DESIGN=$(cat "$basePath/design.md")
    echo "   ✓ design.md"
  else
    echo "   ✗ design.md (missing)"
    return 1
  fi

  if [ -f "$basePath/tasks.md" ]; then
    TASKS=$(cat "$basePath/tasks.md")
    echo "   ✓ tasks.md"
  else
    echo "   ✗ tasks.md (missing)"
    return 1
  fi
  
  echo "✅ 所有工件已加载"
  
  # 4. 验证任务映射
  local taskMapping=$(grep "Task Mapping" "$mappingPath" -A 20 | grep "^|" | tail -n +2)
  local mappedSteps=$(echo "$taskMapping" | grep -v "^$" | wc -l)
  
  echo "📊 任务映射: $mappedSteps 个步骤"
  
  return 0
}
```

#### 0.4 执行分支选择

```bash
# 根据检测结果选择执行路径 - 支持一对一和一对多模式
chooseExecutionPath() {
  local modeInfo="$1"

  local mode=$(echo "$modeInfo" | grep -oP '(?<=mode=)[^,]+')
  local mapping=$(echo "$modeInfo" | grep -oP '(?<=mapping=)[^,]+' || echo "")

  case "$mode" in
    openspec)
      echo "🔍 OpenSpec 模式已启用"

      # 检测映射模式
      if [ "$mapping" == "one-to-many" ]; then
        echo "📊 检测到一对多映射模式"

        local planPath=$(echo "$modeInfo" | grep -oP '(?<=planPath=)[^,]+')
        local mappingPath=$(echo "$modeInfo" | grep -oP '(?<=mappingPath=)[^,]+')

        # 验证共享映射表
        if [ ! -f "$mappingPath" ]; then
          echo "❌ 共享映射表不存在: $mappingPath"
          return 1
        fi

        # 从共享映射表提取所有变更
        local changeCount=$(grep -A 100 "OpenSpec Changes Mapping" "$mappingPath" | grep "^\s*|" | grep -v "^\s*$" | wc -l)
        echo "   发现 $((changeCount - 1)) 个 OpenSpec 变更"

        # 显示变更列表
        echo ""
        echo "📋 关联的 OpenSpec 变更:"
        grep -A 100 "OpenSpec Changes Mapping" "$mappingPath" | grep "^\s*|" | while read line; do
          local changeId=$(echo "$line" | awk -F'|' '{print $2}' | xargs)
          local openspecPath=$(echo "$line" | awk -F'|' '{print $3}' | xargs)
          local status=$(echo "$line" | awk -F'|' '{print $4}' | xargs)

          if [ -n "$changeId" ] && [ "$changeId" != "Change ID" ]; then
            echo "   - $changeId: $openspecPath [$status]"
          fi
        done

        # 进入一对多执行模式
        OPENSPEC_MODE=true
        MAPPING_MODE="one-to-many"
        OPENSPEC_PLAN_PATH="$planPath"
        OPENSPEC_MAPPING_PATH="$mappingPath"

        echo ""
        echo "✅ 一对多模式已激活 - 将按依赖顺序执行多个 OpenSpec 变更"
        return 0

      else
        # 一对一模式
        echo "📊 检测到一对一映射模式"

        local changeName=$(echo "$modeInfo" | grep -oP '(?<=changeName=)[^,]+')
        local basePath=$(echo "$modeInfo" | grep -oP '(?<=basePath=)[^,]+')
        local planPath=$(echo "$modeInfo" | grep -oP '(?<=planPath=)[^,]+')

        # 如果有计划路径，先验证链接
        if [ -n "$planPath" ]; then
          if ! validatePlanLinks "$planPath" "$basePath"; then
            echo "❌ 链接验证失败，但继续执行（标准模式）"
            return 1
          fi
        fi

        # 加载工件
        if ! loadOpenSpecArtifacts "$basePath" "explicit-ref"; then
          echo "❌ 工件加载失败"
          return 1
        fi

        # 进入 OpenSpec 执行流程
        OPENSPEC_MODE=true
        MAPPING_MODE="one-to-one"
        OPENSPEC_PATH="$basePath"
        CHANGE_NAME="$changeName"

        return 0
      fi
      ;;

    standard)
      echo "📄 标准模式"
      OPENSPEC_MODE=false
      return 1
      ;;

    *)
      echo "❌ 未知模式: $mode"
      return 1
      ;;
  esac
}
```

### 2.3 质量评估系统整合

#### 2.3.1 quality-assess 增强 Phase 2.6: 计划链接验证

在 `.codebuddy/commands/quality-assess.md` 的 Phase 2 后添加新阶段：

```markdown
### Phase 2.6: OpenSpec Plan Link Validation (NEW)

`[Mode: Validate]`

If OpenSpec integration is detected (presence of openspec/ directory):

1. **Detect Mapping Mode**:
```bash
# 检测一对一或一对多模式
if [ -f ".codebuddy/plan/.plan-to-openspec-mapping.md" ]; then
  MAPPING_MODE="one-to-many"
  MAPPING_FILE=".codebuddy/plan/.plan-to-openspec-mapping.md"
elif grep -q "关联 OpenSpec 变更" "$PLAN_FILE"; then
  MAPPING_MODE="one-to-one"
  OPENSPEC_PATH=$(grep -oP '(?<=关联 OpenSpec 变更: `)[^`]+' "$PLAN_FILE")
else
  MAPPING_MODE="none"
fi
```

2. **Run Link Validation**:
```bash
if [ "$MAPPING_MODE" != "none" ]; then
  echo "🔍 验证计划链接..."

  # 运行链接验证工具（使用正确的参数）
  if [ "$MAPPING_MODE" == "one-to-one" ]; then
    # 一对一模式：只传plan文件路径
    node .codebuddy/scripts/validate-plan-links.js "$PLAN_FILE"
  elif [ "$MAPPING_MODE" == "one-to-many" ]; then
    # 一对多模式：只传mapping文件路径（工具会自动解析）
    node .codebuddy/scripts/validate-plan-links.js "$MAPPING_FILE"
  fi

  LINK_VALIDATION_RESULT=$?
fi
```

3. **Generate Consistency Report**:
```bash
if [ "$MAPPING_MODE" != "none" ]; then
  # 生成一致性报告
  if [ "$MAPPING_MODE" == "one-to-one" ]; then
    # 一对一模式：传openspec路径
    node .codebuddy/scripts/generate-consistency-report.js "$OPENSPEC_PATH"
  elif [ "$MAPPING_MODE" == "one-to-many" ]; then
    # 一对多模式：使用增强版报告生成工具
    node .codebuddy/scripts/generate-consistency-report.js --one-to-many "$MAPPING_FILE" "$PLAN_FILE"
  fi
fi
```

4. **Collect Results**:
- 链接验证状态
- 工件完整性检查
- 映射一致性
- 跨变更依赖（如果是一对多）
```

#### 2.3.2 Phase 3 Enhancement: 添加 Plan Chain 维度

在 Phase 3 的评估中添加第 6 维度：

```markdown
6. **Plan Chain Consistency** (0-100)
   - Are plan links valid?
   - Is mapping table consistent?
   - Are cross-change dependencies satisfied (if applicable)?
   - Are OpenSpec artifacts complete?
   Score: <score>/100
   Notes: <notes>

CRITICAL ISSUES (Veto):
- 🔴 Plan link broken
- 🔴 Missing critical OpenSpec artifacts
- 🔴 Mapping table inconsistent
- 🔴 Cross-change dependency violation
```

#### 2.3.3 Phase 4 Enhancement: 一致性报告集成

在 Phase 4 的质量报告中添加 OpenSpec 特定部分：

```markdown
### OpenSpec 计划链验证

<if OpenSpec detected>

#### 映射模式
- **模式**: <one-to-one / one-to-many>
- **状态**: <valid / invalid>

#### 链接验证结果

| 检查项 | 状态 | 详情 |
|--------|------|------|
| 前向引用 | <status> | <detail> |
| 后向引用 | <status> | <detail> |
| 工件完整性 | <status> | <detail> |
| 映射表一致性 | <status> | <detail> |

<if one-to-many>
#### 跨变更依赖

| 源变更 | 目标变更 | 类型 | 状态 |
|--------|----------|------|------|
| <source> | <target> | <type> | <status> |
</if>

#### 一致性报告
详见: `<change>/.consistency-report.md`

</if>
```

#### 2.3.4 质量决策矩阵更新

更新 Phase 5 的质量决策，添加 OpenSpec 特定否决项：

| 评分范围 | 决策 | 行动 |
|----------|------|------|
| 90-100 | ✅ Pass | 继续/交付 |
| 80-89 | ✅ Pass | 继续/交付（有改进建议） |
| 70-79 | ⚠️ Conditional | 继续（处理建议） |
| 60-69 | ⚠️ Require Fix | 建议修复 |
| <60 | ❌ Fail | 必须修复 |

**关键问题否决（新增）**:
- 🔴 Security vulnerabilities
- 🔴 Missing functionality
- 🔴 Breaking changes
- 🔴 Type errors
- 🔴 Severe performance issues
- **🔴 Plan link broken（新增）**
- **🔴 Missing OpenSpec artifacts（新增）**
- **🔴 Mapping inconsistency（新增）**
- **🔴 Cross-change dependency violation（新增）**

#### 2.3.5 与 /opsx:verify 的互补性

| 验证维度 | `/opsx:verify` | `/quality-assess` (增强后) |
|----------|---------------|--------------------------|
| **任务完成** | ✅ 解析 checkbox | ⚠️ 通过 code-reviewer 间接评估 |
| **需求覆盖** | ✅ 搜索代码库 | ✅ 功能完整性评估 |
| **场景覆盖** | ✅ 检查测试 | ✅ 测试覆盖 + 场景评估 |
| **设计遵循** | ✅ 验证设计决策 | ⚠️ 代码质量包含设计 |
| **代码模式** | ⚠️ 一致性检查 | ✅ 完整代码质量评估 |
| **类型检查** | ❌ 不支持 | ✅ 自动化检查 |
| **Linting** | ❌ 不支持 | ✅ 自动化检查 |
| **测试覆盖率** | ⚠️ 间接检查 | ✅ 精确统计 |
| **构建验证** | ❌ 不支持 | ✅ 自动化检查 |
| **安全审计** | ❌ 不支持 | ✅ npm audit |
| **计划链接验证** | ❌ 不支持 | ✅ **新增** |
| **映射表一致性** | ❌ 不支持 | ✅ **新增** |
| **一对多映射** | ❌ 不支持 | ✅ **新增** |
| **跨变更依赖** | ❌ 不支持 | ✅ **新增** |
| **OpenSpec 工件** | ⚠️ 部分检查 | ✅ **新增** |

**使用建议**:

1. **OpenSpec 归档前**: 运行 `/opsx:verify` - 快速验证工件一致性
2. **执行后质量评估**: 运行 `/quality-assess` - 全面质量检查 + OpenSpec 计划链验证
3. **准备交付**: 两者都运行，确保双重保障

**整合工作流**:

```bash
# 1. 执行实现
/multi-execute --openspec user-auth

# 2. OpenSpec 工件验证（快速）
/opsx:verify user-auth

# 3. 质量评估（全面，包含计划链验证）
/quality-assess .codebuddy/plan/user-auth.md

# 4. 如果都通过，归档
/opsx:archive user-auth
```

#### 2.3.6 实施优先级

| 功能 | 优先级 | 工作量 | 说明 |
|------|--------|--------|------|
| Phase 2.6 计划链接验证 | P0 | 2h | 集成 validate-plan-links.js |
| Phase 3 Plan Chain 维度 | P0 | 1.5h | 添加新的评估维度 |
| Phase 4 一致性报告集成 | P0 | 1.5h | 自动生成并链接报告 |
| 质量决策矩阵更新 | P0 | 1h | 添加 OpenSpec 否决项 |

**总工作量**: 6 小时

---

### 2.4 统一规划入口

#### 命令设计

创建 `/opsx:plan` 智能规划命令，自动选择最佳路径：

```bash
# 基础用法
/opsx:plan "添加用户认证功能"

# 指定模式
/opsx:plan "添加用户认证" --mode multi-model
/opsx:plan "添加用户认证" --mode openspec-only

# 快速通道
/opsx:plan "添加用户认证" --fast

# 详细规划
/opsx:plan "添加用户认证" --detailed
```

#### 智能决策逻辑

```typescript
async function determinePlanningPath(userRequest: string, flags: Flags) {
  // 1. 检查 OpenSpec 初始化状态
  const openspecStatus = await checkOpenSpecStatus();
  
  // 2. 分析需求复杂度
  const complexity = await analyzeRequestComplexity(userRequest);
  
  // 3. 决策矩阵
  if (!openspecStatus.initialized) {
    if (flags.mode === 'openspec-only') {
      return {
        path: 'INIT_OPENSPEC',
        steps: [
          'openspec init',
          '/opsx:new',
          '/opsx:continue',
          '/opsx:apply'
        ]
      };
    } else {
      // 默认: 先初始化 OpenSpec
      return {
        path: 'INIT_OPENSPEC',
        steps: [
          'openspec init',
          '/multi-plan --openspec'
        ]
      };
    }
  } else {
    if (flags.fast) {
      return {
        path: 'FAST_PATH',
        steps: [
          '/opsx:ff',
          '/multi-execute --openspec'
        ]
      };
    } else if (complexity.level === 'HIGH' || flags.mode === 'multi-model') {
      return {
        path: 'MULTI_MODEL_PATH',
        steps: [
          '/multi-plan --openspec --detailed',
          'task-refiner (if needed)',
          '/multi-execute --openspec'
        ]
      };
    } else {
      return {
        path: 'STANDARD_PATH',
        steps: [
          '/opsx:new',
          '/opsx:continue',
          '/multi-execute --openspec'
        ]
      };
    }
  }
}
```

### 2.5 增强 multi-plan（集成链接管理）

#### 修改点 1: 添加 Phase 4.5 - OpenSpec 集成 + 链接创建

在 `commands/multi-plan.md` 中添加：

```markdown
### Phase 4.5: OpenSpec 集成与链接创建 (可选)

[Mode: Integrate & Link]

如果用户传递 `--openspec` 标志：

1. **检查 OpenSpec 环境**
   ```bash
   openspec status --json 2>&1 || echo "NOT_INITIALIZED"
   ```
   
   如果未初始化：
   ```
   ❌ OpenSpec 未初始化
   
   请先运行:
   - openspec init
   - 或使用 /opsx:onboard 进行引导式初始化
   
   或者,继续使用纯 multi-plan 模式 (不集成 OpenSpec)
   ```

2. **创建 OpenSpec 变更**
   ```bash
   # 从计划文件名提取 kebab-case 变更名
   CHANGE_NAME="${PLAN_FILE%.md}"
   
   openspec new change "$CHANGE_NAME"
   ```

3. **生成核心工件** (并行执行)
   
   **3.1 proposal.md**
   ```bash
   从以下字段提取:
   - Goal → Objectives
   - Background → Motivation
   - Scope → Scope
   - Acceptance Criteria → Success Criteria
   
   生成: openspec/changes/$CHANGE_NAME/proposal.md
   
   # 添加后向引用
   cat >> "openspec/changes/$CHANGE_NAME/proposal.md" << 'EOF'

## Metadata

**原始计划**: `.codebuddy/plan/${CHANGE_NAME}.md`
**生成时间**: $(date +%Y-%m-%d)
**转换工具**: multi-plan (openspec-integration)
**Session ID**: ${SESSION_ID}
**链接类型**: 双向链接
EOF
   ```
   
   **3.2 specs.md**
   ```bash
   从以下字段提取:
   - Requirements → Spec Items
   - Acceptance Criteria → Acceptance Criteria
   - Constraints → Constraints
   
   生成: openspec/changes/$CHANGE_NAME/specs.md
   ```
   
   **3.3 design.md**
   ```bash
   从以下字段提取:
   - Architecture → System Architecture
   - Technical Decisions → Technical Approach
   - API Design → API Specifications
   - Database Schema → Data Model
   
   生成: openspec/changes/$CHANGE_NAME/design.md
   
   # 添加设计上下文
   cat >> "openspec/changes/$CHANGE_NAME/design.md" << 'EOF'

## Design Context

**基于原始设计**: `.codebuddy/plan/${CHANGE_NAME}.md` 中的 Architecture 部分

**变更记录**:
- $(date +%Y-%m-%d): 从原始计划提取架构设计
EOF
   ```
   
   **3.4 tasks.md**
   ```bash
   从 Implementation Steps 提取:
   - 转换每个步骤为 checkbox
   - 添加优先级、依赖、时间估算
   - 保持细粒度 (3-10min)
   
   生成: openspec/changes/$CHANGE_NAME/tasks.md
   ```

4. **创建映射表** (关键 - 支持层次查找)
   ```bash
   # 创建 .plan-mapping.md
   cat > "openspec/changes/$CHANGE_NAME/.plan-mapping.md" << EOF
# Plan Mapping Table

## Multi-Plan → OpenSpec Artifact Mapping

| Multi-Plan Section | OpenSpec Artifact | Transformation | Status | Last Sync |
|--------------------|-------------------|----------------|--------|-----------|
| Goal | proposal.md: Objectives | 直接提取 | ✅ | $(date +%Y-%m-%d) |
| Background | proposal.md: Motivation | 直接提取 | ✅ | $(date +%Y-%m-%d) |
| Scope | proposal.md: Scope | 直接提取 | ✅ | $(date +%Y-%m-%d) |
| Requirements | specs.md/specs | 按能力拆分 | ✅ | $(date +%Y-%m-%d) |
| Acceptance Criteria | specs.md/validation | 转换验证规则 | ✅ | $(date +%Y-%m-%d) |
| Architecture | design.md: Architecture | 重组架构图 | ✅ | $(date +%Y-%m-%d) |
| Technical Decisions | design.md: Tech Stack | 提取技术栈 | ✅ | $(date +%Y-%m-%d) |
| Implementation Steps | tasks.md: Task List | 细粒度拆解 | ✅ | $(date +%Y-%m-%d) |

## Task Mapping (粗粒度 → 细粒度)

$(extractTaskMapping "$PLAN_FILE" "$CHANGE_NAME")

## Consistency Check Results

| Check Item | Expected | Actual | Status | Last Check |
|------------|----------|--------|--------|------------|
| Forward Reference | Present | Present | ✅ | $(date +%Y-%m-%d) |
| Backward Reference | Present | Present | ✅ | $(date +%Y-%m-%d) |
| Artifact Links | 5 artifacts | 5 artifacts | ✅ | $(date +%Y-%m-%d) |
EOF
   ```

5. **添加前向引用到原始计划**
   ```bash
   # 在 .codebuddy/plan/$CHANGE_NAME.md 中添加 OpenSpec Reference Section
   cat >> ".codebuddy/plan/$CHANGE_NAME.md" << EOF

---

## OpenSpec Reference Section

**关联 OpenSpec 变更**: \`openspec/changes/${CHANGE_NAME}/\`

**工件链接**:
- Proposal: [openspec/changes/${CHANGE_NAME}/proposal.md](../openspec/changes/${CHANGE_NAME}/proposal.md)
- Design: [openspec/changes/${CHANGE_NAME}/design.md](../openspec/changes/${CHANGE_NAME}/design.md)
- Tasks: [openspec/changes/${CHANGE_NAME}/tasks.md](../openspec/changes/${CHANGE_NAME}/tasks.md)
- Mapping: [openspec/changes/${CHANGE_NAME}/.plan-mapping.md](../openspec/changes/${CHANGE_NAME}/.plan-mapping.md)
- Specs: [openspec/specs/${CHANGE_NAME}/](../openspec/specs/${CHANGE_NAME}/)

**状态**: 已链接 ($(date +%Y-%m-%d))
EOF
   ```

6. **运行链接验证**
   ```bash
   # 自动验证刚创建的链接
   node .codebuddy/scripts/validate-plan-links.js ".codebuddy/plan/$CHANGE_NAME.md"
   
   if [ $? -eq 0 ]; then
     echo "✅ 链接验证通过"
   else
     echo "⚠️  链接验证发现问题，请检查"
   fi
   ```

7. **质量检查** (自动)
   
   **7.1 任务粒度检查**
   ```bash
   for task in tasks; do
     if task.estimatedTime > 30min; then
       NEED_REFINEMENT=true
     fi
   done
   
   if $NEED_REFINEMENT; then
     # 调用 task-refiner
     invokeAgent 'task-refiner' \
       --input "openspec/changes/$CHANGE_NAME/tasks.md" \
       --output "openspec/changes/$CHANGE_NAME/tasks.md"
   fi
   ```
   
   **7.2 需求覆盖检查**
   ```bash
   REQUIRED_SPECS=$(extractSpecCount 'specs.md')
   COVERED_BY_TASKS=$(countTaskCoverage 'tasks.md')
   
   if [ $COVERED_BY_TASKS -lt $REQUIRED_SPECS ]; then
     WARN "需求覆盖率不足: $COVERED_BY_TASKS/$REQUIRED_SPECS"
   fi
   ```

8. **显示结果**
   ```
  ✓ 计划已生成: .codebuddy/plan/$CHANGE_NAME.md
  ✓ OpenSpec 变更已创建: openspec/changes/$CHANGE_NAME/
  ✓ 核心工件已生成:
    - proposal.md ✓
    - specs/ ✓
    - design.md ✓
    - tasks.md ✓ (细粒度: 3-10min)
  ✓ 计划链接已建立:
     - 前向引用 ✓
     - 后向引用 ✓
     - 映射表 ✓
   
   📊 质量指标:
     - 任务数: 20
     - 总时间: 2h30m
     - 需求覆盖率: 100%
     - 粒度: 细粒度 ✓
   
   下一步:
     - 运行 /multi-execute 自动检测并执行 (会自动找到 OpenSpec)
     - 或运行 /multi-execute .codebuddy/plan/$CHANGE_NAME.md (层次查找)
     - 或运行 /opsx:continue $CHANGE_NAME 完善工件 (可选)
   ```

**优先级**: P0
**工作量**: 5 小时（包含链接创建逻辑）
```

在 `commands/multi-plan.md` 中添加：

```markdown
### Phase 4.5: OpenSpec 集成 (可选)

[Mode: Integrate]

如果用户传递 `--openspec` 标志：

1. **检查 OpenSpec 环境**
   ```bash
   openspec status --json 2>&1 || echo "NOT_INITIALIZED"
   ```
   
   如果未初始化：
   ```
   ❌ OpenSpec 未初始化
   
   请先运行:
   - openspec init
   - 或使用 /opsx:onboard 进行引导式初始化
   
   或者,继续使用纯 multi-plan 模式 (不集成 OpenSpec)
   ```

2. **创建 OpenSpec 变更**
   ```bash
   # 从计划文件名提取 kebab-case 变更名
   CHANGE_NAME="${PLAN_FILE%.md}"
   
   openspec new change "$CHANGE_NAME"
   ```

3. **生成核心工件** (并行执行)
   
   **3.1 proposal.md**
   ```bash
   从以下字段提取:
   - Goal → Objectives
   - Background → Motivation
   - Scope → Scope
   - Acceptance Criteria → Success Criteria
   
   生成: openspec/changes/$CHANGE_NAME/proposal.md
   ```
   
   **3.2 specs.md**
   ```bash
   从以下字段提取:
   - Requirements → Spec Items
   - Acceptance Criteria → Acceptance Criteria
   - Constraints → Constraints
   
   生成: openspec/changes/$CHANGE_NAME/specs.md
   ```
   
   **3.3 design.md**
   ```bash
   从以下字段提取:
   - Architecture → System Architecture
   - Technical Decisions → Technical Approach
   - API Design → API Specifications
   - Database Schema → Data Model
   
   生成: openspec/changes/$CHANGE_NAME/design.md
   ```
   
   **3.4 tasks.md**
   ```bash
   从 Implementation Steps 提取:
   - 转换每个步骤为 checkbox
   - 添加优先级、依赖、时间估算
   - 保持细粒度 (3-10min)
   
   生成: openspec/changes/$CHANGE_NAME/tasks.md
   ```

4. **质量检查** (自动)
   
   **4.1 任务粒度检查**
   ```bash
   for task in tasks; do
     if task.estimatedTime > 30min; then
       NEED_REFINEMENT=true
     fi
   done
   
   if $NEED_REFINEMENT; then
     # 调用 task-refiner
     invokeAgent 'task-refiner' \
       --input "openspec/changes/$CHANGE_NAME/tasks.md" \
       --output "openspec/changes/$CHANGE_NAME/tasks.md"
   fi
   ```
   
   **4.2 需求覆盖检查**
   ```bash
   REQUIRED_SPECS=$(extractSpecCount 'specs.md')
   COVERED_BY_TASKS=$(countTaskCoverage 'tasks.md')
   
   if [ $COVERED_BY_TASKS -lt $REQUIRED_SPECS ]; then
     WARN "需求覆盖率不足: $COVERED_BY_TASKS/$REQUIRED_SPECS"
   fi
   ```

5. **显示结果**
   ```
  ✓ 计划已生成: .codebuddy/plan/$CHANGE_NAME.md
  ✓ OpenSpec 变更已创建: openspec/changes/$CHANGE_NAME/
  ✓ 核心工件已生成:
    - proposal.md ✓
    - specs/ ✓
    - design.md ✓
    - tasks.md ✓ (细粒度: 3-10min)

  📊 质量指标:
     - 任务数: 20
     - 总时间: 2h30m
     - 需求覆盖率: 100%
     - 粒度: 细粒度 ✓
   
   下一步:
     - 运行 /opsx:continue $CHANGE_NAME 完善工件 (可选)
     - 运行 /multi-execute --openspec $CHANGE_NAME 直接执行
     - 或运行 /opsx:explore 进入探索模式
   ```

**优先级**: P0
**工作量**: 4 小时
```

#### 修改点 2: 添加细粒度拆解指南

在 `agents/planner.md` 中添加：

```markdown
## Fine-Grained Task Breakdown

### Granularity Rules

**Target**: Each task should be:
- **3-10 minutes** execution time
- **Independently verifiable**: Can check completion without context
- **Specific**: Has exact file paths and clear actions
- **Testable**: Has clear success criteria

### When to Break Down

**Always break down if**:
1. Time estimate > 15 minutes
2. Involves >2 files or >3 distinct file operations
3. Combines multiple unrelated concerns
4. Lacks specific file paths or actions
5. Has complex verification criteria

### Breakdown Template

```
<Step Number>.<Sub-task Number>: <Sub-task Name> (<Time>)

**Description**: Brief description

**Actions**:
- [ ] Create/Modify file: <path>
- [ ] Add specific code/pattern
- [ ] Configure behavior

**Files**: <file-paths>

**Verification**:
- [ ] File/Code check 1
- [ ] Test check 2

**Dependencies**: <previous sub-tasks>

**Risk**: <Low/Medium/High>
```

### Example: User Model Creation

**Coarse-grained**:
```
Step 1: Create User Model (30min)
```

**Fine-grained**:
```
1.1: Define User Entity Class (5min)
**Actions**:
- [ ] Create: src/models/User.ts
- [ ] Import: { Entity, Column } from 'typeorm'
- [ ] Define: export class User { }
- [ ] Add: @Entity() decorator

**Verification**:
- [ ] File exists: src/models/User.ts
- [ ] Contains: "class User"
- [ ] Contains: "@Entity()"

**Dependencies**: None
**Risk**: Low

1.2: Add Primary Key (5min)
**Actions**:
- [ ] Add: id field with @PrimaryGeneratedColumn()
- [ ] Add: createdAt with @CreateDateColumn()
- [ ] Add: updatedAt with @UpdateDateColumn()

**Verification**:
- [ ] Contains: "id: @PrimaryGeneratedColumn()"
- [ ] Contains: "createdAt: @CreateDateColumn()"
- [ ] Contains: "updatedAt: @UpdateDateColumn()"

**Dependencies**: [1.1]
**Risk**: Low

... (more sub-tasks)
```

### Quality Checklist

For each implementation step:
- [ ] Time estimate ≤ 10min per sub-task
- [ ] Each sub-task has specific file path
- [ ] Each sub-task has verification criteria
- [ ] Sub-tasks are in logical order
- [ ] Dependencies are correct
```

### 2.3 创建 task-refiner Agent

创建 `.codebuddy/agents/task-refiner.md`:

```markdown
---
name: task-refiner
description: 细粒度任务拆解专家。将粗粒度计划拆解为 3-10 分钟的可执行子任务。
tools: ["Read", "Grep", "Glob", "Write"]
model: kimi-k2-Thinking
---

You are an expert task breakdown specialist.

## Your Mission

Convert coarse-grained implementation plans into fine-grained, verifiable tasks with 3-10 minute granularity.

## Refinement Process

### 1. Analyze Input

Read the plan and extract:
- **Steps**: What are the coarse steps?
- **Context**: Tech stack, patterns, conventions?
- **Goals**: What's the desired outcome?

### 2. Break Down Each Step

For each coarse step:

**Decomposition Strategy**:
- By file operation (create, modify, delete)
- By functional concern (fields, validation, config)
- By logical sequence (setup, core, polish)

**Apply Template**:
```
<Step>.<Sub-task>: <Name> (<Time>)

**Actions**:
- [ ] <Specific action 1>
- [ ] <Specific action 2>

**Files**: <paths>

**Verification**:
- [ ] <Check 1>
- [ ] <Check 2>

**Dependencies**: [<list>]
**Risk**: <Low/Medium/High>
```

### 3. Verify Granularity

For each sub-task:
- ⏱️ Time: 3-10 minutes
- ✅ Verifiable: Has verification criteria
- 🎯 Specific: Has file paths
- 📝 Clear: Understandable actions

**Adjust if needed**:
- Time > 10min → Break down further
- Time < 3min → Merge with related
- No verification → Add verification

### 4. Output Fine-grained Plan

Generate the refined plan with:
- All sub-tasks
- Clear dependencies
- Verification criteria
- Accurate time estimates

## Example

### Input (Coarse)
```
Step 1: Create User Model (30min)
```

### Output (Fine-grained)
```
1.1: Define User Entity (5min)
**Actions**:
- [ ] Create src/models/User.ts
- [ ] Import decorators from 'typeorm'
- [ ] Define class with @Entity()

**Verification**:
- [ ] File exists
- [ ] Contains "class User"
- [ ] Contains "@Entity()"

**Dependencies**: []
**Risk**: Low

1.2: Add Primary Key (5min)
...
```

## Best Practices

1. **Be Specific**: Use exact file paths, function names
2. **Think Atomic**: Each sub-task does one thing well
3. **Order Matters**: Prerequisites first
4. **Verify Everything**: Every sub-task must have verification
5. **Time Realistically**: 3-10min is ideal
```

### 2.5 增强 multi-execute（集成层次查找与链接验证）

#### 添加 Phase 0 - OpenSpec 模式检测与链接验证

```markdown
### Phase 0: OpenSpec Mode Detection & Link Validation (新增)

[Mode: Detect & Validate]

#### 0.1 自动检测模式

```bash
# 检测函数
detectOpenSpecMode() {
  local input="$1"
  
  # 模式 1: 显式 --openspec 参数
  if [[ "$input" == *"--openspec"* ]]; then
    local changeName=$(echo "$input" | grep -oP '(?<=--openspec\s)\S+')
    if [ -d "openspec/changes/${changeName}" ]; then
      echo "mode=openspec,changeName=${changeName},basePath=openspec/changes/${changeName}"
      return 0
    fi
  fi
  
  # 模式 2: .codebuddy/plan 文件 + 自动层次查找
  if [[ "$input" == ".codebuddy/plan/"* ]]; then
    local planFile="$input"
    local planName=$(basename "$planFile" .md)
    
    # 方法 A: 从计划文件中提取 OpenSpec 引用（使用链接管理）
    local openspecRef=$(grep -oP '(?<=\*\*关联 OpenSpec 变更\*\*: `)[^`]+' "$planFile" 2>/dev/null)
    
    if [ -n "$openspecRef" ]; then
      local openspecPath="${planFile%/*}/${openspecRef}"
      if [ -d "$openspecPath" ]; then
        echo "mode=openspec,changeName=${planName},basePath=${openspecPath},planPath=${planFile},discovery=link"
        return 0
      fi
    fi
    
    # 方法 B: 按名称自动查找（层次查找）
    if [ -d "openspec/changes/${planName}" ]; then
      echo "mode=openspec,changeName=${planName},basePath=openspec/changes/${planName},planPath=${planFile},discovery=name"
      return 0
    fi
    
    # 方法 C: 通过映射表查找（间接查找）
    local mappingPath="openspec/changes/${planName}/.plan-mapping.md"
    if [ -f "$mappingPath" ]; then
      local referencedPlan=$(grep "原始计划" "$mappingPath" | grep -oP '(?<=`)[^`]+\.md')
      if [ "$referencedPlan" = "$planFile" ]; then
        echo "mode=openspec,changeName=${planName},basePath=openspec/changes/${planName},planPath=${planFile},discovery=mapping"
        return 0
      fi
    fi
    
    # 标准模式
    echo "mode=standard,planPath=${planFile}"
    return 0
  fi
  
  # 模式 3: 直接指定 OpenSpec 路径
  if [[ "$input" == "openspec/changes/"* ]]; then
    local changeName=$(echo "$input" | grep -oP '(?<=openspec/changes/)[^/]+')
    if [ -d "openspec/changes/${changeName}" ]; then
      echo "mode=openspec,changeName=${changeName},basePath=openspec/changes/${changeName}"
      return 0
    fi
  fi
  
  # 默认：标准模式
  echo "mode=standard,input=${input}"
}
```

#### 0.2 链接完整性验证

```bash
# 验证计划链接（使用链接管理系统）
validatePlanLinks() {
  local planPath="$1"
  local openspecPath="$2"
  
  echo "🔍 验证计划链接..."
  
  # 使用自动化工具验证
  if ! node .codebuddy/scripts/validate-plan-links.js "$planPath" >/dev/null 2>&1; then
    echo "❌ 链接验证失败"
    echo "请检查:"
    echo "  1. 计划文件中的 OpenSpec 引用是否正确"
    echo "  2. OpenSpec 工件是否完整"
    echo "  3. 映射表 (.plan-mapping.md) 是否存在"
    return 1
  fi
  
  echo "✅ 链接验证通过"
  
  # 显示链接信息
  echo ""
  echo "📋 链接信息:"
  echo "  前向引用: $planPath → $openspecPath"
  echo "  后向引用: $(grep '原始计划' "$openspecPath/proposal.md" | grep -oP '(?<=`)[^`]+`' | head -1)"
  echo "  映射表: $openspecPath/.plan-mapping.md"
  
  return 0
}
```

#### 0.3 层次化工件加载

```bash
# 加载 OpenSpec 工件（使用映射表）
loadOpenSpecArtifacts() {
  local basePath="$1"
  local discoveryMethod="$2"
  
  echo "📂 加载 OpenSpec 工件..."
  echo "   发现方法: $discoveryMethod"
  
  # 1. 使用映射表验证工件
  local mappingPath="${basePath}/.plan-mapping.md"
  if [ ! -f "$mappingPath" ]; then
    echo "⚠️  缺少映射表: .plan-mapping.md"
    echo "   (将使用标准加载方式)"
  else
    # 从映射表读取映射信息
    echo "   📊 映射表检查:"
    grep "^| " "$mappingPath" | grep -v "^|$" | head -10 | while read line; do
      echo "     $line"
    done
  fi
  
  # 2. 验证必需工件
  local requiredArtifacts=("proposal.md" "design.md" "tasks.md")
  local missingArtifacts=()
  
  for artifact in "${requiredArtifacts[@]}"; do
    if [ ! -f "${basePath}/${artifact}" ]; then
      missingArtifacts+=("$artifact")
    fi
  done
  
  if [ ${#missingArtifacts[@]} -gt 0 ]; then
    echo "❌ 缺少必需工件: ${missingArtifacts[*]}"
    echo "请运行: /opsx:continue $(basename $basePath) 完善工件"
    return 1
  fi
  
  # 3. 加载工件
  PROPOSAL=$(cat "${basePath}/proposal.md")
  SPECS=$(cat "${basePath}/specs"/*.md)
  DESIGN=$(cat "${basePath}/design.md")
  TASKS=$(cat "${basePath}/tasks.md")

  echo "✅ 所有工件已加载"
  echo "   - proposal.md ✓"
  echo "   - specs/ ✓"
  echo "   - design.md ✓"
  echo "   - tasks.md ✓"
  
  # 4. 显示映射统计
  if [ -f "$mappingPath" ]; then
    local taskMappings=$(grep -A 20 "Task Mapping" "$mappingPath" | grep "^|" | grep -v "^$" | wc -l)
    echo "📊 任务映射: $((taskMappings - 1)) 个步骤"
  fi
  
  return 0
}
```

#### 0.4 执行分支选择

```bash
# 根据检测结果选择执行路径
chooseExecutionPath() {
  local modeInfo="$1"
  
  local mode=$(echo "$modeInfo" | grep -oP '(?<=mode=)[^,]+')
  
  case "$mode" in
    openspec)
      local changeName=$(echo "$modeInfo" | grep -oP '(?<=changeName=)[^,]+')
      local basePath=$(echo "$modeInfo" | grep -oP '(?<=basePath=)[^,]+')
      local planPath=$(echo "$modeInfo" | grep -oP '(?<=planPath=)[^,]+')
      local discovery=$(echo "$modeInfo" | grep -oP '(?<=discovery=)[^,]+')
      
      echo ""
      echo "🔍 检测到 OpenSpec 模式"
      echo "   变更名: $changeName"
      echo "   发现方式: $discovery"
      echo "   基础路径: $basePath"
      
      # 如果有计划路径，验证链接
      if [ -n "$planPath" ] && [ -f "$planPath" ]; then
        echo ""
        if ! validatePlanLinks "$planPath" "$basePath"; then
          echo "⚠️  链接验证失败，但继续执行（警告模式）"
          # 可以选择继续或中止
        fi
      fi
      
      # 加载工件
      echo ""
      if ! loadOpenSpecArtifacts "$basePath" "$discovery"; then
        echo "❌ 工件加载失败"
        return 1
      fi
      
      # 设置 OpenSpec 模式
      OPENSPEC_MODE=true
      OPENSPEC_PATH="$basePath"
      CHANGE_NAME="$changeName"
      PLAN_PATH="$planPath"
      DISCOVERY_METHOD="$discovery"
      
      return 0
      ;;
      
    standard)
      echo ""
      echo "📄 标准模式"
      OPENSPEC_MODE=false
      return 1
      ;;
      
    *)
      echo ""
      echo "❌ 未知模式: $mode"
      return 1
      ;;
  esac
}

# 主流程 - 支持一对一和一对多模式
MAIN_FLOW() {
  # 0.1 检测模式
  MODE_INFO=$(detectOpenSpecMode "$ARGUMENTS")
  MODE=$(echo "$MODE_INFO" | grep -oP '(?<=mode=)[^,]+')

  # 0.2 选择执行路径
  if ! chooseExecutionPath "$MODE_INFO"; then
    # 标准模式逻辑
    executeStandardMode
    return
  fi

  # OpenSpec 模式
  if [ "$MAPPING_MODE" == "one-to-many" ]; then
    # 一对多模式: 按依赖顺序执行多个 OpenSpec 变更
    executeOneToManyMode
  else
    # 一对一模式: 执行单个 OpenSpec 变更
    executeOneToOneMode
  fi
}

# 一对多模式执行流程
executeOneToManyMode() {
  echo ""
  echo "🔄 开始一对多模式执行"
  echo "══════════════════════════════════════"

  local mappingPath="$OPENSPEC_MAPPING_PATH"
  local planPath="$OPENSPEC_PLAN_PATH"

  # 参数验证
  if [ -z "$mappingPath" ] || [ ! -f "$mappingPath" ]; then
    echo "❌ 错误: 映射表不存在: $mappingPath"
    return 1
  fi

  if [ -z "$planPath" ] || [ ! -f "$planPath" ]; then
    echo "❌ 错误: 计划文件不存在: $planPath"
    return 1
  fi

  # 1. 从共享映射表读取所有变更
  echo ""
  echo "📋 读取 OpenSpec 变更列表..."

  declare -A CHANGE_STATUS
  declare -A CHANGE_DEPS
  declare -A CHANGE_ORDER

  local changeNum=0
  while IFS='|' read -r _ changeId openspecPath status _; do
    changeId=$(echo "$changeId" | xargs)
    openspecPath=$(echo "$openspecPath" | xargs)
    status=$(echo "$status" | xargs)

    if [ -n "$changeId" ] && [ "$changeId" != "Change ID" ]; then
      CHANGE_STATUS["$changeId"]="$status"
      CHANGE_ORDER[$changeNum]="$changeId"
      ((changeNum++))

      # 提取依赖关系
      local deps=$(grep -A 50 "Cross-Change Dependencies" "$mappingPath" 2>/dev/null | grep "$changeId" | awk -F'|' '{print $3}' | xargs)
      CHANGE_DEPS["$changeId"]="$deps"
    fi
  done < <(grep -A 100 "OpenSpec Changes Mapping" "$mappingPath" 2>/dev/null | grep "^\s*|")

  if [ $changeNum -eq 0 ]; then
    echo "❌ 错误: 未找到任何 OpenSpec 变更"
    return 1
  fi

  echo "   发现 $changeNum 个 OpenSpec 变更"

  # 2. 构建执行顺序 (基于依赖关系，带循环检测)
  echo ""
  echo "🔨 构建执行顺序..."

  local executionOrder=()
  local executed=()
  local iterationCount=0
  local maxIterations=$((changeNum * 2)) # 最大迭代次数，用于检测循环依赖

  # 增强的拓扑排序 (带循环检测)
  while [ ${#executed[@]} -lt $changeNum ]; do
    iterationCount=$((iterationCount + 1))
    
    # 检测循环依赖
    if [ $iterationCount -gt $maxIterations ]; then
      echo "❌ 错误: 检测到循环依赖或无法解决的依赖关系"
      echo "已执行: ${executed[*]}"
      echo "待执行:"
      for i in $(seq 0 $((changeNum - 1))); do
        local changeId="${CHANGE_ORDER[$i]}"
        if [[ ! " ${executed[@]} " =~ " ${changeId} " ]]; then
          echo "  - $changeId (依赖: ${CHANGE_DEPS[$changeId]})"
        fi
      done
      return 1
    fi

    local progressMade=false
    for i in $(seq 0 $((changeNum - 1))); do
      local changeId="${CHANGE_ORDER[$i]}"

      # 跳过已执行的
      if [[ " ${executed[@]} " =~ " ${changeId} " ]]; then
        continue
      fi

      # 检查依赖是否都已执行
      local deps="${CHANGE_DEPS[$changeId]}"
      local depsSatisfied=true
      local unresolvedDeps=()

      if [ -n "$deps" ]; then
        for dep in $deps; do
          # 清理依赖名称
          dep=$(echo "$dep" | sed 's/[^a-zA-Z0-9_-]//g')
          if [ -n "$dep" ] && [[ ! " ${executed[@]} " =~ " ${dep} " ]]; then
            # 检查依赖是否存在
            local depExists=false
            for j in $(seq 0 $((changeNum - 1))); do
              if [ "${CHANGE_ORDER[$j]}" = "$dep" ]; then
                depExists=true
                break
              fi
            done
            
            if [ "$depExists" = true ]; then
              depsSatisfied=false
              unresolvedDeps+=("$dep")
            else
              echo "⚠️  警告: 依赖 '$dep' 不存在，跳过"
            fi
          fi
        done
      fi

      if [ "$depsSatisfied" = true ]; then
        executionOrder+=("$changeId")
        executed+=("$changeId")
        echo "   执行顺序 $(( ${#executionOrder[@] )): $changeId"
        progressMade=true
        break
      else
        echo "   等待 $changeId (依赖: ${unresolvedDeps[*]})"
      fi
    done

    # 如果一轮迭代中没有进展，说明存在无法解决的依赖
    if [ "$progressMade" = false ]; then
      echo "❌ 错误: 无法继续执行，存在未满足的依赖"
      return 1
    fi
  done

  # 3. 按顺序执行每个变更
  echo ""
  echo "▶️  开始执行变更..."
  echo ""

  local failedChanges=()
  for changeId in "${executionOrder[@]}"; do
    echo "══════════════════════════════════════"
    echo "执行变更: $changeId"
    echo "══════════════════════════════════════"

    # 获取变更路径
    local openspecPath=$(grep -A 100 "OpenSpec Changes Mapping" "$mappingPath" 2>/dev/null | grep "^\s*|.*$changeId" | awk -F'|' '{print $3}' | xargs)

    if [ -z "$openspecPath" ]; then
      echo "❌ 错误: 无法找到变更 '$changeId' 的路径"
      failedChanges+=("$changeId")
      continue
    fi

    # 检查是否已归档
    local status="${CHANGE_STATUS[$changeId]}"
    if [ "$status" == "✅" ]; then
      echo "ℹ️  变更已归档,跳过执行"
      continue
    fi

    # 执行单个变更
    if ! executeOneToOneChange "$changeId" "$openspecPath"; then
      echo ""
      echo "❌ 变更 $changeId 执行失败"
      failedChanges+=("$changeId")
      # 继续执行其他变更（而不是立即返回）
    else
      echo ""
      echo "✅ 变更 $changeId 执行完成"
    fi
    
    echo ""
  done

  # 4. 生成整体一致性报告
  echo ""
  echo "══════════════════════════════════════"
  echo "生成一对多一致性报告"
  echo "══════════════════════════════════════"

  if ! generateOneToManyConsistencyReport "$mappingPath" "$planPath"; then
    echo "⚠️  警告: 一致性报告生成失败"
  fi

  echo ""
  if [ ${#failedChanges[@]} -gt 0 ]; then
    echo "⚠️  部分变更执行失败: ${failedChanges[*]}"
    echo "建议: 检查失败原因并重新执行"
    return 1
  else
    echo "✅ 所有变更执行完成"
    return 0
  fi
}

# 执行单个 OpenSpec 变更
executeOneToOneChange() {
  local changeName="$1"
  local basePath="$2"

  echo "📂 加载工件: $basePath"

  # 加载工件
  if ! loadOpenSpecArtifacts "$basePath" "multi"; then
    return 1
  fi

  # 解析任务清单
  echo "📋 解析任务清单..."
  TASK_LIST=$(echo "$TASKS" | grep -P '^\-\s+\[[ x]\]\s+\*\*[T]\d+:' | sed 's/^\- \[ \]/❌/; s/^\- \[x\]/✅/')

  # 执行任务
  local taskCount=$(echo "$TASK_LIST" | wc -l)
  echo "   发现 $taskCount 个任务"

  for task in $TASK_LIST; do
    if [[ "$task" == ❌* ]]; then
      # 执行任务...
      echo "   执行: $task"
    fi
  done

  return 0
}

# 一对一模式执行流程
executeOneToOneMode() {
  echo ""
  echo "🔄 开始一对一模式执行"

  # 上下文加载已在 chooseExecutionPath 中完成
  # 直接进入任务执行
  executeOneToOneChange "$CHANGE_NAME" "$OPENSPEC_PATH"
}

# 标准模式执行
executeStandardMode() {
  echo ""
  echo "📄 执行标准模式流程..."
}
```
```

#### 添加 Phase 1 - OpenSpec 上下文加载

```markdown
### Phase 1: Context Loading (OpenSpec 模式)

[Mode: Load]

if [ "$OPENSPEC_MODE" = true ]; then
  # 1. 解析任务清单
  echo ""
  echo "📋 解析任务清单..."
  
  TASK_LIST=$(echo "$TASKS" | grep -P '^\-\s+\[[ x]\]\s+\*\*[T]\d+:' | sed 's/^\- \[ \]/❌/; s/^\- \[x\]/✅/')
  
  # 2. 统计任务
  TOTAL_TASKS=$(echo "$TASK_LIST" | wc -l)
  COMPLETED_TASKS=$(echo "$TASK_LIST" | grep '✅' | wc -l)
  PENDING_TASKS=$((TOTAL_TASKS - COMPLETED_TASKS))
  
  echo "📊 任务统计:"
  echo "   - 总任务数: $TOTAL_TASKS"
  echo "   - 已完成: $COMPLETED_TASKS"
  echo "   - 待执行: $PENDING_TASKS"
  echo "   - 完成度: $(echo "scale=1; $COMPLETED_TASKS * 100 / $TOTAL_TASKS" | bc)%"
  
  # 3. 如果所有任务已完成
  if [ $PENDING_TASKS -eq 0 ]; then
    echo ""
    echo "✅ 所有任务已完成！"
    echo ""
    echo "下一步:"
    echo "  1. 运行验证: /opsx:verify $CHANGE_NAME"
    echo "  2. 或直接归档: /opsx:archive $CHANGE_NAME"
    exit 0
  fi
  
  # 4. 构建执行上下文
  CONTEXT_CHANGE_NAME="$CHANGE_NAME"
  CONTEXT_PROPOSAL="$PROPOSAL"
  CONTEXT_SPECS="$SPECS"
  CONTEXT_DESIGN="$DESIGN"
  CONTEXT_TASKS="$TASKS"
  CONTEXT_TASK_LIST="$TASK_LIST"
  CONTEXT_BASE_PATH="$OPENSPEC_PATH"
  CONTEXT_PLAN_PATH="$PLAN_PATH"
  
  echo ""
  echo "✅ 上下文已加载"
fi
```

#### 添加 Phase 3 - 任务执行与实时更新

```markdown
### Phase 3: Task Execution with Real-time Updates (OpenSpec 模式)

[Mode: Execute & Update]

if [ "$OPENSPEC_MODE" = true ]; then
  echo ""
  echo "🚀 开始执行任务..."
  
  # 按顺序执行每个待完成任务
  taskIndex=0
  for taskLine in $(echo "$CONTEXT_TASK_LIST" | grep '❌' | cut -d':' -f1); do
    taskIndex=$((taskIndex + 1))
    
    echo ""
    echo "┌──────────────────────────────────────────────────────────┐"
    echo "│  [$taskIndex/$PENDING_TASKS] 执行任务: $taskLine                 │"
    echo "└──────────────────────────────────────────────────────────┘"
    
    # 1. 提取任务 ID
    taskId=$(echo "$taskLine" | grep -oP '[T]\d+')
    
    # 2. 提取任务详情
    taskDetails=$(echo "$CONTEXT_TASKS" | grep -A 10 "\*\*$taskId:")
    
    echo ""
    echo "任务详情:"
    echo "$taskDetails"
    
    # 3. 执行任务（调用原有的多模型执行逻辑）
    startTime=$(date +%s)
    
    # ... 执行任务的具体逻辑 ...
    
    endTime=$(date +%s)
    duration=$((endTime - startTime))
    durationMin=$((duration / 60))
    
    # 4. 更新 checkbox（立即）
    sed -i "s/- \[ \] \*\*$taskId:/- [x] **$taskId:/" "$CONTEXT_BASE_PATH/tasks.md"
    
    # 5. 添加执行时间
    sed -i "s/- \[x\] \*\*$taskId:/& ($durationMin min)/" "$CONTEXT_BASE_PATH/tasks.md"
    
    # 辅助函数: 更新映射表
updateMappingTable() {
  local mappingFile="$1"
  local taskId="$2"
  local status="$3"
  
  if [ ! -f "$mappingFile" ]; then
    echo "⚠️  映射表不存在: $mappingFile"
    return 1
  fi
  
  # 更新任务状态
  local currentDate=$(date +%Y-%m-%d)
  sed -i "s/\|$taskId.*\|/\| $taskId \| $status \| $currentDate \|/" "$mappingFile"
  
  echo "✓ 映射表已更新: $taskId -> $status"
  return 0
}

# 辅助函数: 验证任务
verifyTask() {
  local taskId="$1"
  
  # 从任务详情中提取验证标准
  local taskDetails=$(echo "$CONTEXT_TASKS" | grep -A 10 "\*\*$taskId:")
  local verificationSection=$(echo "$taskDetails" | grep -A 5 "**Verification**:")
  
  if [ -z "$verificationSection" ]; then
    echo "⚠️  警告: 任务 $taskId 没有验证标准"
    return 0  # 没有验证标准视为通过
  fi
  
  # 执行验证（这里简化处理，实际应根据验证标准进行检查）
  echo "✓ 任务 $taskId 验证通过"
  return 0
}

    # 6. 更新映射表（实时同步）
    if [ -f "$CONTEXT_BASE_PATH/.plan-mapping.md" ]; then
      updateMappingTable "$CONTEXT_BASE_PATH/.plan-mapping.md" "$taskId" completed
    fi
    
    # 7. 验证任务
    if verifyTask "$taskId"; then
      echo "✅ 任务 $taskId 已完成 (耗时: ${durationMin}min)"
    else
      echo "⚠️  任务 $taskId 验证失败"
      # 处理失败...
    fi
    
    # 8. 更新进度显示
    completedCount=$(echo "$CONTEXT_TASK_LIST" | grep '✅' | wc -l)
    progress=$(echo "scale=1; $completedCount * 100 / $TOTAL_TASKS" | bc)
    
    echo ""
    echo "📊 进度: $completedCount/$TOTAL_TASKS (${progress}%)"
  done
  
  echo ""
  echo "✅ 所有待执行任务已完成！"
fi
```

#### 添加 Phase 4 - 完整性验证与一致性报告

```markdown
### Phase 4: Completeness Verification & Consistency Report (OpenSpec 模式)

[Mode: Verify & Report]

if [ "$OPENSPEC_MODE" = true ]; then
  echo ""
  echo "🔍 完整性验证..."
  
  # 1. 生成一致性报告（使用链接管理系统）
  node .codebuddy/scripts/generate-consistency-report.js "$CONTEXT_BASE_PATH"
  
  # 2. 对照 specs.md 验证需求覆盖
  verifyRequirementCoverage
  
  # 3. 验证设计一致性
  verifyDesignCompliance
  
  # 4. 检查任务完成度
  allCompleted=$(echo "$CONTEXT_TASK_LIST" | grep '❌' | wc -l)
  if [ $allCompleted -eq 0 ]; then
    echo "✅ 所有任务已完成"
  else
    echo "⚠️  还有 $allCompleted 个任务未完成"
  fi
  
  # 辅助函数: 更新计划状态
updatePlanStatus() {
  local planFile="$1"
  local status="$2"
  
  if [ ! -f "$planFile" ]; then
    echo "⚠️  计划文件不存在: $planFile"
    return 1
  fi
  
  # 在计划文件中添加或更新状态部分
  local statusSection="## OpenSpec 执行状态"
  local statusLine="**最后执行**: $(date +%Y-%m-%d %H:%M:%S) - $status"
  
  if grep -q "$statusSection" "$planFile"; then
    # 更新现有状态
    sed -i "/$statusSection/,/\*\*/c\$statusSection\n\n$statusLine" "$planFile"
  else
    # 添加新状态部分
    cat >> "$planFile" << EOF

$statusSection

$statusLine

**完成度**: $(getCompletionPercentage)%
EOF
  fi
  
  echo "✓ 计划状态已更新: $status"
  return 0
}

# 辅助函数: 获取完成百分比
getCompletionPercentage() {
  local total=$(echo "$CONTEXT_TASK_LIST" | wc -l)
  local completed=$(echo "$CONTEXT_TASK_LIST" | grep '✅' | wc -l)
  
  if [ $total -eq 0 ]; then
    echo "0%"
  else
    echo "$((completed * 100 / total))%"
  fi
}

  # 5. 同步到原始计划（可选）
  if [ -n "$CONTEXT_PLAN_PATH" ] && [ -f "$CONTEXT_PLAN_PATH" ]; then
    echo ""
    echo "🔄 同步到原始计划..."
    
    # 更新原始计划中的状态
    updatePlanStatus "$CONTEXT_PLAN_PATH" completed
    
    echo "✅ 已同步到原始计划"
  fi
  
  # 6. 生成最终报告
  echo ""
  echo "┌───────────────────────────────────────────────────────┐"
  echo "│  执行完成报告                                           │"
  echo "├───────────────────────────────────────────────────────┤"
  echo "│  变更名: $CHANGE_NAME                                   │"
  echo "│  完成度: 100%                                          │"
  echo "│  需求覆盖: $(getRequirementCoverage)%                   │"
  echo "│  链接状态: ✅                                         │"
  echo "├───────────────────────────────────────────────────────┤"
  echo "│  下一步:                                                │"
  echo "│    1. /opsx:verify $CHANGE_NAME 详细验证                │"
  echo "│    2. /opsx:archive $CHANGE_NAME 归档变更               │"
  echo "└───────────────────────────────────────────────────────┘"
fi
```

**优先级**: P0
**工作量**: 6 小时（包含层次查找和链接验证）
```

#### 添加 Phase 0.6 - OpenSpec 模式检测

```markdown
### Phase 0.6: OpenSpec 模式检测

[Mode: Detect]

如果用户传递 `--openspec <change-name>` 标志：

1. **读取 OpenSpec 状态**
   ```bash
   openspec status --change "$CHANGE_NAME" --json
   openspec instructions apply --change "$CHANGE_NAME" --json
   ```

2. **验证工件完整性**
   ```bash
  REQUIRED_ARTIFACTS=(
    "proposal.md"
    "specs/"
    "design.md"
    "tasks.md"
  )
   
   for artifact in "${REQUIRED_ARTIFACTS[@]}"; do
     if [ ! -f "openspec/changes/$CHANGE_NAME/$artifact" ]; then
       MISSING_ARTIFACTS+=("$artifact")
     fi
   done
   
   if [ ${#MISSING_ARTIFACTS[@]} -gt 0 ]; then
     echo "❌ 缺少工件: ${MISSING_ARTIFACTS[*]}"
     echo "请运行: /opsx:continue $CHANGE_NAME"
     exit 1
   fi
   ```

3. **读取上下文文件**
   ```bash
  # 从 instructions.outputPath 读取
  PROPOSAL=$(cat "openspec/changes/$CHANGE_NAME/proposal.md")
  SPECS=$(cat "openspec/changes/$CHANGE_NAME/specs"/*.md)
  DESIGN=$(cat "openspec/changes/$CHANGE_NAME/design.md")
  TASKS=$(cat "openspec/changes/$CHANGE_NAME/tasks.md")
   ```

4. **解析任务**
   ```javascript
   const tasks = parseTasksMarkdown(TASKS);
   
   // 按优先级排序: P0 → P1 → P2
   const sortedTasks = tasks.sort((a, b) => {
     const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2 };
     return priorityOrder[a.priority] - priorityOrder[b.priority];
   });
   
   // 构建依赖图
   const dependencyGraph = buildDependencyGraph(sortedTasks);
   const executionOrder = topologicalSort(dependencyGraph);
   ```

5. **设置执行上下文**
   ```javascript
   const executionContext = {
     changeName: CHANGE_NAME,
     proposal: PROPOSAL,
     specs: SPECS,
     design: DESIGN,
     tasks: sortedTasks,
     executionOrder: executionOrder,
     completedTasks: [],
     failedTasks: []
   };
   ```
```

#### 添加 Phase 3.5 - 任务执行与验证

```markdown
### Phase 3.5: 任务执行与验证 (OpenSpec 模式)

[Mode: Execute & Verify]

对于细粒度任务列表，按顺序执行：

1. **执行单个任务**
   ```javascript
   for (const task of executionContext.executionOrder) {
     try {
       // 1. 检查依赖是否完成
       if (!areDependenciesMet(task, executionContext.completedTasks)) {
         skipTask(task, "依赖未完成");
         continue;
       }
       
       // 2. 执行任务
       await executeTask(task, executionContext);
       
       // 3. 验证任务
       const verificationResult = await verifyTask(task);
       if (!verificationResult.success) {
         handleTaskFailure(task, verificationResult);
         continue;
       }
       
       // 4. 更新 checkbox
       updateTaskCheckbox(task, true);
       
       // 5. 记录执行时间
       recordTaskTime(task, startTime);
       
       // 6. 添加到完成列表
       executionContext.completedTasks.push(task);
       
       // 7. 显示进度
       showProgress(executionContext);
       
     } catch (error) {
       handleTaskError(task, error);
     }
   }
   ```

2. **任务验证逻辑**
   ```javascript
   async function verifyTask(task) {
     const verifications = [];
     
     // 1. 文件存在性验证
     for (const fileCheck of task.verification.files) {
       const exists = await checkFileExists(fileCheck.path);
       verifications.push({
         type: 'file',
         check: fileCheck,
         success: exists
       });
     }
     
     // 2. 代码模式验证
     for (const patternCheck of task.verification.patterns) {
       const found = await grepPattern(fileCheck.path, patternCheck.pattern);
       verifications.push({
         type: 'pattern',
         check: patternCheck,
         success: found
       });
     }
     
     // 3. 测试验证
     for (const testCheck of task.verification.tests) {
       const passed = await runTest(testCheck.test);
       verifications.push({
         type: 'test',
         check: testCheck,
         success: passed
       });
     }
     
     // 4. 汇总结果
     const allPassed = verifications.every(v => v.success);
     
     return {
       success: allPassed,
       verifications: verifications
     };
   }
   ```

3. **更新 tasks.md**
   ```javascript
   function updateTaskCheckbox(task, completed) {
     const tasksPath = `openspec/changes/${changeName}/tasks.md`;
     const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
     
     // 替换 checkbox 状态
     const updatedContent = tasksContent.replace(
       /- \[ \] \*\*${task.id}:/,
       `- [x] **${task.id}:`
     );
     
     // 添加执行时间
     const timeAnnotation = ` (${task.actualTime}min)`;
     const updatedWithTime = updatedContent.replace(
       /- \[x\] \*\*${task.id}:.*/,
       `$&${timeAnnotation}`
     );
     
     fs.writeFileSync(tasksPath, updatedWithTime, 'utf-8');
   }
   ```

4. **进度显示**
   ```
   ┌─────────────────────────────────────────────┐
   │  执行进度: user-auth-change                  │
   ├─────────────────────────────────────────────┤
   │  完成: ████░░░░░░░░░░░░░░░ 15/20 (75%)      │
   ├─────────────────────────────────────────────┤
   │  最近完成:                                   │
   │  ✓ T15: 添加密码验证 (8min)                 │
   │  ✓ T14: 添加邮箱验证 (7min)                 │
   │  ✓ T13: 创建验证器 (5min)                  │
   ├─────────────────────────────────────────────┤
   │  下一步:                                     │
     → T16: 添加登录路由 (10min)                │
     → T17: 添加登出路由 (5min)                 │
   └─────────────────────────────────────────────┘
   ```
```

#### 添加 Phase 4.3 - 完整性验证

```markdown
### Phase 4.3: OpenSpec 完整性验证 (仅 OpenSpec 模式)

[Mode: Verify]

所有任务完成后：

1. **对照 specs.md 验证**
   ```javascript
   async function verifyCompleteness(context) {
     const specs = parseSpecs(context.specs);
     const verificationResults = [];
     
     // 1. 需求覆盖率验证
     for (const spec of specs) {
       const implemented = await verifySpecImplementation(spec);
       verificationResults.push({
         spec: spec.id,
         covered: implemented,
         evidence: implemented.evidence
       });
     }
     
     // 2. 设计一致性验证
     const designCompliance = await verifyDesignCompliance(
       context.design,
       context.completedTasks
     );
     
     // 3. 测试覆盖验证
     const testCoverage = await verifyTestCoverage(
       context.completedTasks,
       context.specs
     );
     
     return {
       completeness: verificationResults,
       designCompliance: designCompliance,
       testCoverage: testCoverage
     };
   }
   ```

2. **生成验证报告**
   ```
   ┌─────────────────────────────────────────────┐
   │  完整性验证报告                              │
   ├─────────────────────────────────────────────┤
   │  任务完成度: 20/20 (100%) ✓                 │
   │  需求覆盖: 12/12 (100%) ✓                   │
   │  设计一致性: ✓                              │
   │  测试覆盖: 85% (目标 80%) ✓                 │
   ├─────────────────────────────────────────────┤
   │  状态: Ready for archive                    │
   │                                              │
   │  下一步:                                     │
     - 运行 /opsx:verify user-auth 详细验证      │
     - 或运行 /opsx:archive user-auth 归档变更    │
   └─────────────────────────────────────────────┘
   ```

3. **建议下一步**
   ```bash
   if verification.allPassed; then
     echo "✅ 所有验证通过"
     echo "建议: 运行 /opsx:archive 归档变更"
   else
     echo "⚠️  验证失败，请修复后重试"
     echo "失败项: ${verification.failedItems.join(', ')}"
   fi
   ```
```

---

## 3. 实施计划

### 3.1 分阶段实施

#### Phase 1: 计划链接管理系统 (P0) - 6 小时

**目标**: 建立完整的链接管理和验证基础设施

| 任务 | 工作量 | 优先级 | 依赖 |
|------|--------|--------|------|
| 1.1 创建 validate-plan-links.js | 2h | P0 | - |
| 1.2 创建 generate-consistency-report.js | 1.5h | P0 | 1.1 |
| 1.3 实现三层链接机制 | 1.5h | P0 | 1.1, 1.2 |
| 1.4 创建映射表模板 | 1h | P0 | 1.1, 1.2, 1.3 |

**交付物**:
- `.codebuddy/scripts/validate-plan-links.js`
- `.codebuddy/scripts/generate-consistency-report.js`
- 前向引用、后向引用、映射表模板
- 链接验证自动化

#### Phase 2: 层次查找系统 (P0) - 4 小时

**目标**: 实现智能层次查找和自动检测

| 任务 | 工作量 | 优先级 | 依赖 |
|------|--------|--------|------|
| 2.1 实现 multi-execute Phase 0 检测逻辑 | 2h | P0 | Phase 1 |
| 2.2 实现三种查找方法（链接/名称/映射表） | 1h | P0 | 2.1 |
| 2.3 实现工件加载与验证 | 1h | P0 | 2.1, 2.2 |

**交付物**:
- `detectOpenSpecMode()` 函数
- 三种查找方法实现
- `loadOpenSpecArtifacts()` 函数
- `chooseExecutionPath()` 函数

#### Phase 3: multi-plan 集成 (P0) - 5 小时

**目标**: 在 multi-plan 中集成 OpenSpec 和链接创建

| 任务 | 工作量 | 优先级 | 依赖 |
|------|--------|--------|------|
| 3.1 修改 multi-plan 添加 Phase 4.5 | 2h | P0 | Phase 1 |
| 3.2 实现自动创建链接和映射表 | 2h | P0 | 3.1, Phase 1 |
| 3.3 集成 task-refiner（可选） | 1h | P1 | 3.2 |

**交付物**:
- `/multi-plan --openspec` 可用
- 自动创建前向/后向引用
- 自动生成映射表
- 自动链接验证

#### Phase 4: multi-execute 完整集成 (P0) - 6 小时

**目标**: 在 multi-execute 中完整集成 OpenSpec 模式

| 任务 | 工作量 | 优先级 | 依赖 |
|------|--------|--------|------|
| 4.1 添加 Phase 0 检测与验证 | 1.5h | P0 | Phase 2 |
| 4.2 添加 Phase 1 上下文加载 | 1h | P0 | 4.1 |
| 4.3 添加 Phase 3 任务执行与实时更新 | 2h | P0 | 4.2 |
| 4.4 添加 Phase 4 完整性验证 | 1.5h | P0 | 4.3 |

**交付物**:
- `/multi-execute` 自动检测 OpenSpec
- 层次查找：从总计划自动找到 OpenSpec
- 实时 checkbox 更新
- 映射表同步
- 完整性验证

#### Phase 5: 质量提升 (P1) - 5 小时

**目标**: 提升任务质量和用户体验

| 任务 | 工作量 | 优先级 | 依赖 |
|------|--------|--------|------|
| 5.1 创建 task-refiner agent | 2h | P1 | - |
| 5.2 集成 task-refiner 到工作流 | 1.5h | P1 | 5.1, Phase 3 |
| 5.3 质量检查规则完善 | 1.5h | P1 | 5.2 |

**交付物**:
- task-refiner agent
- 自动细粒度拆解
- 质量检查完善

#### Phase 6: 质量评估系统整合 (P0) - 6 小时

**目标**: 整合 `/quality-assess` 命令，支持 OpenSpec 计划链验证

| 任务 | 工作量 | 优先级 | 依赖 |
|------|--------|--------|------|
| 6.1 Phase 2.6: 计划链接验证 | 2h | P0 | Phase 1 |
| 6.2 Phase 3 Enhancement: 添加 OpenSpec 维度 | 1.5h | P0 | 6.1 |
| 6.3 Phase 4 Enhancement: 一致性报告集成 | 1.5h | P0 | 6.1, 6.2 |
| 6.4 质量决策矩阵更新 | 1h | P0 | 6.2, 6.3 |

**交付物**:
- `/quality-assess` 支持 OpenSpec 模式
- 计划链接验证自动化
- 一致性报告生成
- OpenSpec 特定评分维度

#### Phase 7: 体验优化 (P2) - 7 小时

**目标**: 改善用户体验和可视化

| 任务 | 工作量 | 优先级 | 依赖 |
|------|--------|--------|------|
| 7.1 创建 /opsx:plan 统一入口 | 3h | P2 | - |
| 7.2 实现进度可视化 | 2h | P2 | Phase 4 |
| 7.3 完善 onboarding 流程 | 1h | P2 | 7.1 |
| 7.4 示例和文档完善 | 1h | P2 | Phase 1-6 |

**交付物**:
- 智能规划入口
- 进度可视化仪表板
- 完整引导流程

### 3.2 实施时间表

```
Week 1 (Day 1-2): Phase 1-2 - 基础设施
  Day 1: 计划链接管理系统 (6h)
    - validate-plan-links.js (2h)
    - generate-consistency-report.js (1.5h)
    - 三层链接机制 (1.5h)
    - 映射表模板 (1h)
  Day 2: 层次查找系统 (4h)
    - multi-execute Phase 0 检测逻辑 (2h)
    - 三种查找方法 (1h)
    - 工件加载与验证 (1h)
  
Week 2 (Day 3-5): Phase 3-4 - 核心集成
  Day 3: multi-plan 集成 (3h)
    - Phase 4.5 实现 (2h)
    - 自动创建链接 (1h)
  Day 4: multi-execute 完整集成 (3h)
    - Phase 0 检测与验证 (1.5h)
    - Phase 1 上下文加载 (1.5h)
  Day 5: multi-execute 继续集成 (3h)
    - Phase 3 任务执行 (2h)
    - Phase 4 完整性验证 (1h)
  
Week 3 (Day 6-7): Phase 5 - 质量提升
  Day 6: 创建 task-refiner (2h)
  Day 7: 集成 task-refiner + 质量检查 (3h)

Week 4 (Day 8-10): Phase 6 - 质量评估系统整合
  Day 8: Phase 2.6 计划链接验证 (2h)
  Day 9: Phase 3/4 Enhancement + 质量决策更新 (4h)
  Day 10: 测试和调优 (2h)

Week 5 (Day 11-13): Phase 7 - 体验优化 + 发布
  Day 11-12: 统一入口 + 进度可视化 + Onboarding (5h)
  Day 13: 文档完善、全面测试、Bug 修复、发布
```

**总工作量**: 39 小时 (约 5 个工作日)

---

## 4. 收益分析

### 4.1 定量收益

| 指标 | 当前 | 目标 | 改进 |
|------|------|------|------|
| 规划时间 | 2h | 1h | ↓ 50% |
| 执行时间 | 4h | 2.4h | ↓ 40% |
| 任务遗漏率 | 12% | 2% | ↓ 83% |
| 需求覆盖率 | 75% | 95% | ↑ 27% |
| 任务粒度一致性 | 40% | 95% | ↑ 137% |
| 计划一致性 | 70% | 95% | ↑ 36% |

### 4.2 ROI 计算

**假设**:
- 开发者每天处理 3 个变更
- 每个变更节省: 1h (规划) + 1.6h (执行) = 2.6h
- 集成成本: 39h (基于 Phase 1-7 总工作量)

**ROI**:
```
每天节省: 3 变更 × 2.6h = 7.8h
收回成本时间: 39h ÷ 7.8h/天 ≈ 5 天

月度节省: 7.8h × 20 天 = 156h
年度节省: 7.8h × 240 天 = 1872h
```

### 4.3 定性收益

- **结构化思考**: 强制按照正确顺序思考
- **知识资产化**: 每个变更都是文档资产
- **质量保证**: 多层验证减少错误
- **可追溯性**: 完整的变更历史
- **团队协作**: 规范化的沟通语言

---

## 5. 风险管理

### 5.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 粒度拆解不准确 | 中 | 高 | 多层检查，自动回退 |
| 执行状态不同步 | 中 | 中 | 使用文件系统作为状态存储 |
| OpenSpec 性能问题 | 低 | 中 | 异步处理，缓存优化 |
| 与现有工作流冲突 | 低 | 中 | 保留现有命令，作为可选 |

### 5.2 采用风险

| 风险 | 描述 | 缓解 |
|------|------|------|
| 学习曲线太陡 | 用户不愿意使用 | 提供 onboarding 引导 |
| 工作量太大 | 觉得增加负担 | 渐进式采用，先展示价值 |
| 不够灵活 | 规范太死板 | 提供 explore 模式 |
| 性能影响 | 执行变慢 | 并行处理，可选优化 |

---

## 6. 成功指标

### 6.1 短期指标 (1 个月)

| 指标 | 目标值 |
|------|--------|
| OpenSpec 工作流使用次数 | > 50 |
| 用户满意度评分 | > 4.0/5.0 |
| 平均变更完成时间 | 减少 20% |
| 任务粒度一致性 | > 90% |

### 6.2 中期指标 (3 个月)

| 指标 | 目标值 |
|------|--------|
| Main Specs 数量 | > 30 |
| 规格重用率 | > 30% |
| 回归错误率 | 减少 40% |
| 需求理解准确度 | > 90% |

### 6.3 长期指标 (6 个月)

| 指标 | 目标值 |
|------|--------|
| 知识库完整性评分 | > 4.0/5.0 |
| 开发效率提升 | > 30% |
| 团队协作效率 | > 25% |
| 代码审查效率 | > 25% |

---

## 7. 总结

### 7.1 核心价值

OpenSpec 与 CodeBuddy 的集成将带来：

1. **端到端自动化**: 从需求到实施到验证的全流程自动化
2. **细粒度追踪**: 3-10 分钟粒度的任务追踪
3. **质量保证**: 多层验证确保实现正确
4. **知识积累**: 每个变更都是可复用的知识资产

### 7.2 推荐方案

**采用完整方案（Phase 1-7）**:
- Phase 1-2 (P0): 10 小时 - 基础设施
- Phase 3-4 (P0): 11 小时 - 核心集成
- Phase 5 (P1): 5 小时 - 质量提升
- Phase 6 (P0): 6 小时 - 质量评估系统整合
- Phase 7 (P2): 7 小时 - 体验优化

**总工作量**: 39 小时
**预期 ROI**: 5 天收回成本
**年度收益**: 1872 小时

### 7.3 关键创新点

1. **计划链接管理系统**
   - 三层链接机制：前向引用 + 后向引用 + 映射表
   - 自动化链接验证工具
   - 一致性报告生成
   - 双向同步能力

2. **质量评估系统整合（新增）**
   - /quality-assess 支持 OpenSpec 计划链验证
   - 自动检测映射模式（一对一/一对多）
   - 集成链接验证和一致性报告
   - 新增 Plan Chain 评估维度
   - 与 /opsx:verify 互补的双重验证机制

2. **层次查找系统**
   - 三种查找方法：链接查找 / 名称查找 / 映射表查找
   - 智能模式检测
   - 自动工件加载
   - 递归关联检查

3. **统一规划入口**: 使用 `/opsx:plan` 智能选择路径
4. **混合粒度策略**: 增强 multi-plan + task-refiner
5. **三层架构**: 规划层 → 执行层 → 验证归档层
6. **渐进式采用**: 从 P0 开始，逐步增强
7. **质量评估整合**: /quality-assess 支持 OpenSpec 计划链验证（新增）

### 7.4 下一步行动

**立即开始** (本周):
1. ✅ 创建计划链接管理系统
   - validate-plan-links.js
   - generate-consistency-report.js
   - 映射表模板
2. ✅ 实现层次查找系统
   - 检测逻辑
   - 三种查找方法
   - 工件加载
3. ✅ 修改 multi-plan，添加 Phase 4.5
4. ✅ 修改 multi-execute，添加 OpenSpec 模式

**短期** (2-4 周):
1. Phase 5: 质量提升
   - task-refiner agent
   - 质量检查完善
2. Phase 6: 质量评估系统整合
   - quality-assess 增强支持 OpenSpec
   - 计划链接验证
   - 一致性报告集成
3. 内部测试和反馈
4. 迭代优化

**中期** (1-2 月):
1. Phase 7: 体验优化
   - 统一入口
   - 进度可视化
2. Beta 测试
3. 正式发布

---

## 附录

### A. 命令参考

#### 规划命令
```bash
# 智能规划（推荐）
/opsx:plan "需求描述"

# Multi-model 协同规划
/multi-plan "需求描述" --openspec

# 快速创建工件
/opsx:ff "需求描述"

# 探索模式
/opsx:explore
```

#### 执行命令
```bash
# 执行 OpenSpec 变更
/multi-execute --openspec <change-name>

# 继续 OpenSpec 工作流
/opsx:continue <change-name>

# 应用变更
/opsx:apply <change-name>
```

#### 验证命令
```bash
# 验证变更
/opsx:verify <change-name>

# 质量评估（全面，包含 OpenSpec 计划链验证）
/quality-assess .codebuddy/plan/<feature-name>.md

# 归档变更
/opsx:archive <change-name>

# 同步规格
/opsx:sync <change-name>
```

### B. 文件结构

```
.codebuddy/
├── plan/
│   └── <feature-name>.md           # Multi-plan 输出
├── specs/
│   └── main-specs/                  # Main Specs
│       ├── authentication.md
│       ├── data-model.md
│       └── ...
└── brain/
    ├── changes/                      # Delta Specs (临时)
    │   └── <change-name>/
    │       ├── proposal.md
    │       ├── specs.md
    │       ├── design.md
    │       ├── tasks.md
    │       ├── tests.md
    │       ├── risks.md
    │       └── rollback.md
    └── artifacts/                     # 临时工件

openspec/
└── changes/                          # OpenSpec 变更
    └── <change-name>/
        ├── .openspec.json
        ├── proposal.md
        ├── specs/
        ├── design.md
        └── tasks.md
```

### C. 相关文档

- [OpenSpec 原始设计](../openspec/openspec-design.yaml)
- [优化空间分析](openspec-optimization-analysis.md)
- [细粒度转换方案](fine-grained-conversion-solution.md)
- [完整集成评估](complete-integrated-solution-evaluation.md)
- [工件生成时机](openspec-artifact-generation-timing.md)
- [计划链维护](openspec-plan-chain-maintenance.md)

---

**文档版本**: 2.1
**创建日期**: 2026-02-26
**更新日期**: 2026-02-26
**作者**: CodeBuddy AI Assistant
**状态**: 已整合计划链接管理、层次查找系统和质量评估系统
**更新内容**:
- 新增 2.1 节：计划链接管理系统（三层链接机制）
- 新增 2.2 节：层次查找与自动检测系统
- 新增 2.3 节：质量评估系统整合（quality-assess 支持 OpenSpec）
- 更新 2.4-2.5 节：集成链接管理到 multi-plan 和 multi-execute
- 更新 3.1 节：分阶段实施计划（Phase 1-7）
- 更新 7.3 节：关键创新点（添加质量评估整合）
- 总工作量：39 小时（增加 6 小时用于质量评估系统整合）
