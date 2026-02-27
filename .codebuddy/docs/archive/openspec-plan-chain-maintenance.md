# OpenSpec 转换后的整体计划链维护与更新策略

## 问题：转换成 OpenSpec 后，整体计划链如何维护与更新？

### 核心挑战

当从 multi-plan 生成的计划转换到 OpenSpec 后，涉及多个层面的维护和更新：

```
.multi-plan 计划
  ↓ 转换
OpenSpec 工件（proposal, specs, design, tasks, tests, risks, rollback）
  ↓ 执行
实际代码变更
```

问题：如何在**执行过程中**和**执行后**保持这条链路的同步和一致性？

---

## 1. 计划链的完整视图

### 链路结构

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 0: 需求收集                                         │
│  用户描述 → multi-plan 输入                                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: multi-plan 生成                                   │
│  .codebuddy/plan/<feature>.md                              │
│  - Goal, Background, Scope                                  │
│  - Requirements, Acceptance Criteria                        │
│  - Architecture, Technical Decisions                        │
│  - Implementation Steps (粗粒度)                             │
└────────────────────┬────────────────────────────────────────┘
                     ↓ 转换
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: OpenSpec 工件生成                                 │
│  openspec/changes/<feature>/                                │
│  - proposal.md (从 multi-plan 提取)                         │
│  - specs/<capability>/spec.md (从 Requirements 提取)         │
│  - design.md (从 Architecture 提取)                          │
│  - tasks.md (细化 Implementation Steps)                    │
│  - tests.md (从 specs 和 tasks 生成)                        │
│  - risks.md (从 tasks 和 design 分析)                       │
│  - rollback.md (从 tasks 和 design 分析)                    │
└────────────────────┬────────────────────────────────────────┘
                     ↓ 执行
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: multi-execute 执行                                 │
│  代码变更 + checkbox 更新                                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓ 验证
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: 验证与归档                                         │
│  验证完整性 → 更新工件 → 归档变更                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 维护与更新的关键场景

### 场景 1：执行过程中的动态更新

#### 问题

在 multi-execute 执行过程中，可能会发现：

- 某个任务比预期复杂，需要拆分
- 发现新的需求或边界情况
- 技术方案需要调整
- 出现未预期的风险

#### 解决方案：双向同步机制

```
multi-execute 执行
  ├─ 发现变更需求
  │
  ├─ [自动] 更新 tasks.md
  │   ├─ 添加新任务
  │   ├─ 拆分现有任务
  │   └─ 更新 checkbox 状态
  │
  ├─ [可选] 更新 design.md
  │   ├─ 记录技术方案变更
  │   └─ 更新架构决策
  │
  ├─ [可选] 更新 specs.md
  │   ├─ 添加新的验收标准
  │   └─ 更新需求描述
  │
  └─ [可选] 更新 risks.md
      ├─ 记录新发现的风险
      └─ 更新缓解策略
```

#### 实施细节

**自动更新规则**：

1. **任务状态更新** - 每个任务完成后立即更新 checkbox
2. **任务拆分** - 当检测到任务执行时间 > 预期 50% 时，提示拆分
3. **新任务添加** - 发现未覆盖的需求时，自动添加到 tasks.md
4. **设计变更记录** - 重大技术方案变更时，自动更新 design.md

**示例：动态更新流程**

```markdown
## 原始 tasks.md

- [ ] T1: 创建 User 数据模型 (30min)
  - [ ] 定义 User 实体
  - [ ] 添加 email 字段
  - [ ] 添加 passwordHash 字段

## 执行过程中更新

- [x] T1: 创建 User 数据模型 (30min)
  - [x] 定义 User 实体
  - [x] 添加 email 字段
  - [ ] 添加 passwordHash 字段 ← 发现需要添加验证装饰器

## 自动更新后的 tasks.md

- [x] T1: 创建 User 数据模型 (45min) ← 更新时间
  - [x] 定义 User 实体
  - [x] 添加 email 字段
  - [x] 添加 passwordHash 字段
  - [x] 添加验证装饰器 ← 自动添加新子任务
  - [x] 添加数据库索引 ← 自动添加新子任务

- [ ] T2: 添加用户认证中间件 (25min) ← 自动添加的新任务
```

---

### 场景 2：需求变更的级联更新

#### 问题

在执行过程中，用户或团队发现需求需要变更，如何级联更新整个计划链？

#### 解决方案：需求追踪矩阵

```
需求 ID → specs.md → design.md → tasks.md → 代码
  ↓        ↓          ↓          ↓         ↓
 变更检测 → 影响分析 → 方案调整 → 任务更新 → 代码重构
```

#### 实施细节

**需求追踪矩阵**：

| 需求 ID | 描述 | 影响 specs | 影响 design | 影响 tasks | 状态 |
|---------|------|------------|------------|-----------|------|
| REQ-001 | 支持邮箱登录 | ✅ 是 | ✅ 是 | ✅ 是 | 完成 |
| REQ-002 | 支持手机登录 | ✅ 是 | ✅ 是 | ✅ 是 | 进行中 |
| REQ-003 | 支持第三方登录 | ✅ 是 | ✅ 是 | ❌ 否 | 待办 |

**需求变更流程**：

```markdown
## 步骤 1: 检测变更

用户提出："手机登录需要支持国际区号"

## 步骤 2: 影响分析

[自动] 扫描所有工件
  ├─ specs.md: "支持手机登录" → 需要更新
  ├─ design.md: 手机号字段设计 → 需要更新
  ├─ tasks.md: 添加手机字段 → 需要更新
  └─ 代码: PhoneNumber 类型 → 需要重构

## 步骤 3: 更新工件

1. 更新 specs.md
   ```markdown
   - 支持国际区号格式（+86, +1, +44 等）
   ```

2. 更新 design.md
   ```markdown
   - 使用 libphonenumber-js 处理国际区号
   - 数据库存储：countryCode + phoneNumber
   ```

3. 更新 tasks.md
   ```markdown
   - [ ] 添加 countryCode 字段
   - [ ] 集成 libphonenumber-js
   - [ ] 更新验证逻辑
   ```

## 步骤 4: 代码重构

[提示] 需要修改以下文件：
  - src/entities/User.ts
  - src/auth/phone-auth.ts
  - src/validators/phone.validator.ts
```

---

### 场景 3：执行完成后的归档与追溯

#### 问题

执行完成后，如何将 OpenSpec 工件同步回原始计划，并归档变更？

#### 解决方案：双向归档机制

```
multi-execute 执行完成
  ↓
[Phase 1] 验证完整性
  ├─ 对照 specs.md 验证功能实现
  ├─ 对照 tasks.md 验证任务完成
  └─ 对照 design.md 验证设计一致性
      ↓
[Phase 2] 生成执行报告
  ├─ 统计任务完成情况
  ├─ 记录变更历史
  └─ 生成问题清单
      ↓
[Phase 3] 更新原始计划（可选）
  ├─ 更新 .codebuddy/plan/<feature>.md
  ├─ 标记完成状态
  └─ 添加实际执行时间
      ↓
[Phase 4] 归档 OpenSpec
  ├─ 移动到 openspec/changes/archive/
  ├─ 生成最终快照
  └─ 更新变更日志
```

#### 实施细节

**执行报告示例**：

```markdown
# 执行报告：add-user-auth

## 完成统计

| 指标 | 计划 | 实际 | 差异 |
|------|------|------|------|
| 总任务数 | 12 | 15 | +3 |
| 已完成 | 0 | 15 | - |
| 进行中 | 0 | 0 | - |
| 未开始 | 12 | 0 | -12 |
| 总时间 | 2h | 2h45m | +45m |

## 变更历史

| 时间 | 工件 | 变更类型 | 描述 |
|------|------|---------|------|
| 10:00 | tasks.md | 添加 | 添加任务 T13: 国际区号支持 |
| 10:30 | design.md | 更新 | 使用 libphonenumber-js |
| 11:00 | specs.md | 更新 | 添加国际区号验收标准 |
| 11:45 | tasks.md | 拆分 | T12 拆分为 T12.1 和 T12.2 |

## 问题清单

| 严重性 | 问题描述 | 状态 |
|--------|---------|------|
| 低 | libphonenumber-js 包较大 | 已记录 |
| 中 | 国际区号验证未完成测试 | 待修复 |

## 建议

- 考虑使用 CDN 加载 libphonenumber-js
- 为国际区号验证添加更多测试用例
```

---

### 场景 4：跨变更的依赖管理

#### 问题

当有多个并行的 OpenSpec 变更时，如何处理依赖关系和冲突？

#### 解决方案：变更依赖图

```
openspec/changes/
  ├─ change-a/ ← 独立变更
  ├─ change-b/ ← 独立变更
  ├─ change-c/ ← 依赖 change-a
  │  └─ depends-on: change-a
  └─ change-d/ ← 依赖 change-a 和 change-b
     └─ depends-on: [change-a, change-b]
```

#### 实施细节

**依赖声明**：

在每个 `openspec/changes/<change>/proposal.md` 中添加：

```markdown
## Dependencies

This change depends on:
- [x] **change-a** (completed) - User 数据模型
- [ ] **change-b** (in-progress) - 认证系统

This change is required by:
- **change-e** (pending) - 用户授权
```

**依赖检查机制**：

```
multi-execute 执行前
  ↓
[自动] 检查依赖
  ├─ 所有依赖变更是否已完成？
  ├─ 是否存在循环依赖？
  └─ 是否存在文件冲突？
      ↓
  ├─ 通过 → 继续执行
  └─ 失败 → 阻塞并提示
```

**冲突解决**：

```markdown
## 检测到冲突

文件: src/entities/User.ts
  - change-a 添加了 email 字段
  - change-c 想要修改 email 字段的验证规则

解决方案:
- [ ] 合并变更（推荐）
- [ ] 重构 change-c，避免冲突
- [ ] 按顺序执行（先 change-a，后 change-c）
```

---

## 3. 自动化工具与脚本

### 工具 1: OpenSpec 同步守护进程

```typescript
// tools/openspec-sync-daemon.ts

interface SyncRule {
  trigger: 'task_complete' | 'design_change' | 'spec_update';
  action: 'update_tasks' | 'update_design' | 'update_specs';
  auto?: boolean;
}

const SYNC_RULES: SyncRule[] = [
  {
    trigger: 'task_complete',
    action: 'update_tasks',
    auto: true // 自动更新 checkbox
  },
  {
    trigger: 'design_change',
    action: 'update_tasks',
    auto: false // 需要用户确认
  },
  {
    trigger: 'spec_update',
    action: 'update_tasks',
    auto: false // 需要用户确认
  }
];

class OpenSpecSyncDaemon {
  async onEvent(event: any) {
    const rule = SYNC_RULES.find(r => r.trigger === event.type);
    
    if (rule?.auto) {
      await this.applyAction(rule.action, event);
    } else {
      await this.promptUser(rule, event);
    }
  }
  
  private async applyAction(action: string, event: any) {
    switch (action) {
      case 'update_tasks':
        await this.updateTasks(event);
        break;
      case 'update_design':
        await this.updateDesign(event);
        break;
      case 'update_specs':
        await this.updateSpecs(event);
        break;
    }
  }
  
  private async promptUser(rule: SyncRule, event: any) {
    // 提示用户是否要同步更新
  }
}
```

### 工具 2: 计划链一致性检查器

```bash
#!/bin/bash
# scripts/check-plan-chain-consistency.sh

echo "Checking OpenSpec plan chain consistency..."

# 1. 检查 multi-plan 和 OpenSpec 的一致性
echo "1. Checking multi-plan → OpenSpec consistency..."
node scripts/check-multiplan-openspec.js

# 2. 检查 OpenSpec 工件之间的依赖关系
echo "2. Checking artifact dependencies..."
node scripts/check-artifact-dependencies.js

# 3. 检查任务完成状态
echo "3. Checking task completion status..."
node scripts/check-task-completion.js

# 4. 检查代码和工件的一致性
echo "4. Checking code-artifact consistency..."
node scripts/check-code-artifact.js

echo "Consistency check completed."
```

### 工具 3: 变更影响分析器

```typescript
// tools/analyze-change-impact.ts

interface ImpactAnalysis {
  changedArtifacts: string[];
  affectedFiles: string[];
  dependentChanges: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

async function analyzeImpact(
  changeName: string,
  modifiedFiles: string[]
): Promise<ImpactAnalysis> {
  // 1. 扫描修改的文件，影响哪些工件
  // 2. 查找依赖此变更的其他变更
  // 3. 评估风险等级
  // 4. 生成建议
  return {
    changedArtifacts: ['tasks.md', 'design.md'],
    affectedFiles: ['src/entities/User.ts'],
    dependentChanges: ['change-c', 'change-d'],
    riskLevel: 'medium',
    recommendations: [
      '更新 change-c 的依赖声明',
      '添加回归测试'
    ]
  };
}
```

---

## 4. 维护策略总结

### 预防性维护（执行前）

| 策略 | 目的 | 实施方式 |
|------|------|---------|
| **完整性检查** | 确保工件齐全 | 自动检查所有必需文件 |
| **依赖验证** | 避免依赖冲突 | 检查依赖关系和文件冲突 |
| **质量评分** | 评估计划质量 | 检查任务粒度、验证标准等 |

### 反应性维护（执行中）

| 策略 | 目的 | 实施方式 |
|------|------|---------|
| **动态更新** | 及时反映变更 | 自动更新 checkbox、添加新任务 |
| **变更追踪** | 记录所有修改 | 维护变更日志 |
| **冲突检测** | 避免文件冲突 | 实时监控文件修改 |

### 后期维护（执行后）

| 策略 | 目的 | 实施方式 |
|------|------|---------|
| **完整性验证** | 确保需求覆盖 | 对照 specs.md 验证代码 |
| **归档与快照** | 保留执行历史 | 移动到 archive，生成快照 |
| **经验总结** | 改进未来计划 | 分析偏差，优化模板 |

---

## 5. 实施路线图

### Phase 1: 基础同步机制（优先级：P0）

- [ ] 自动更新任务 checkbox
- [ ] 任务完成状态追踪
- [ ] 基本的变更日志

**工作量**: 2 小时

### Phase 2: 一致性检查（优先级：P0）

- [ ] multi-plan → OpenSpec 一致性检查
- [ ] OpenSpec 工件依赖关系检查
- [ ] 代码和工件一致性检查

**工作量**: 3 小时

### Phase 3: 动态更新（优先级：P1）

- [ ] 自动任务拆分检测
- [ ] 新任务自动添加
- [ ] 设计变更自动同步

**工作量**: 4 小时

### Phase 4: 依赖管理（优先级：P1）

- [ ] 变更依赖声明
- [ ] 依赖检查机制
- [ ] 冲突检测与解决

**工作量**: 3 小时

### Phase 5: 分析与报告（优先级：P2）

- [ ] 变更影响分析器
- [ ] 执行报告生成
- [ ] 经验总结系统

**工作量**: 4 小时

---

## 6. 最佳实践

### ✅ 推荐做法

1. **保持简洁** - 只更新必要的工件，避免过度同步
2. **增量更新** - 采用小步快跑，频繁提交更新
3. **透明追踪** - 所有变更都应该有明确的记录
4. **灵活配置** - 允许用户自定义同步规则
5. **向后兼容** - 不强制要求用户使用所有功能

### ❌ 避免做法

1. **过度自动化** - 不应该完全移除人工审查
2. **频繁全量同步** - 避免不必要的全量更新
3. **忽略边界情况** - 需要处理冲突、错误等场景
4. **硬编码规则** - 应该提供配置接口

---

## 7. 总结

### 核心原则

```
multi-plan → OpenSpec → 执行 → 验证 → 归档
    ↓          ↓          ↓      ↓       ↓
   提取       转换       更新    同步    追溯
```

### 关键点

1. **双向同步** - multi-plan 和 OpenSpec 保持一致
2. **动态更新** - 执行过程中及时更新工件
3. **依赖管理** - 处理跨变更的依赖关系
4. **质量保证** - 全过程的一致性检查
5. **经验积累** - 从执行历史中学习改进

### 预期效果

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| 计划一致性 | ~60% | >95% | ↑ 58% |
| 变更追溯性 | ~40% | >90% | ↑ 125% |
| 依赖冲突率 | ~20% | <5% | ↓ 75% |
| 维护工作量 | 高 | 中 | ↓ 40% |

---

**文档版本**: 1.0  
**创建日期**: 2026-02-26  
**作者**: CodeBuddy AI Assistant
