# multi-execute 修改方案 - 支持计划拆分执行

## 状态

✅ **已完成实施** (2026-02-26)

## 修改目标

让 multi-execute 支持两种执行模式：
1. **单计划执行** - 现有功能，执行单个计划文件
2. **批量计划执行** - 新增功能，按依赖顺序执行多个子计划

---

## Phase 0: 计划类型识别（新增）

### 0.1 输入类型检测

```markdown
### Phase 0: Read Plan

`[Mode: Prepare]`

1. **Identify Input Type**:

   | Input Type | Pattern | Mode |
   |------------|---------|------|
   | **Single Plan** | `.codebuddy/plan/*.md` (非总计划) | Single Execution |
   | **Master Plan** | `.codebuddy/plan/*-master.md` 或包含"子计划列表" | Batch Execution |
   | **Direct Task** | 文本描述（非文件路径） | Single Execution (需要先确认) |

2. **Read Plan Content**:

   **Single Plan Mode**:
   - 读取计划文件
   - 提取：任务类型、实施步骤、关键文件

   **Batch Execution Mode**:
   - 读取总计划文件
   - 解析子计划列表
   - 提取依赖关系和执行顺序
   - 验证所有子计划文件存在

3. **Pre-Execution Confirmation**:

   **Single Plan**:
   - 如果是直接任务描述：确认用户批准
   - 如果无法确认用户已批准：必须再次确认

   **Batch Execution**:
   - 展示总计划和子计划列表
   - 确认用户批准批量执行
   - 询问执行策略：
     - 顺序执行（逐个执行，等待用户确认）
     - 自动执行（按依赖顺序自动执行）
```

---

## Phase 0.5: 批量执行初始化（新增）

### 批量执行模式初始化

```markdown
### Phase 0.5: Batch Execution Setup (仅 Batch Execution)

`[Mode: Prepare]`

1. **Parse Master Plan**:

   从总计划文件中提取：
   ```yaml
   Sub-Plans:
     - name: "user-registration"
       file: ".codebuddy/plan/user-registration.md"
       priority: "P0"
       dependencies: []
       estimated_time: "2h"

     - name: "user-login"
       file: ".codebuddy/plan/user-login.md"
       priority: "P0"
       dependencies: ["user-registration"]
       estimated_time: "1.5h"
   ```

2. **Build Dependency Graph**:

   构建依赖关系图：
   ```
   user-registration (无依赖)
     ↓
   user-login (依赖: user-registration)
     ↓
   {password-reset, user-profile} (并行执行)
   ```

3. **Determine Execution Order**:

   使用拓扑排序确定执行顺序：
   ```
   Execution Order:
   1. user-registration
   2. user-login
   3. password-reset (并行)
   4. user-profile (并行)
   ```

4. **Validate Sub-Plans**:

   - 验证所有子计划文件存在
   - 检查依赖关系完整性（无循环依赖）
   - 验证任务类型（Frontend/Backend/Fullstack）

5. **Present Execution Plan**:

   ```markdown
   # 批量执行计划

   ## 总计划
   用户认证系统

   ## 子计划列表 (4个)

   1. [P0] 用户注册模块 (2h)
      - 文件: .codebuddy/plan/user-registration.md
      - 依赖: 无

   2. [P0] 用户登录模块 (1.5h)
      - 文件: .codebuddy/plan/user-login.md
      - 依赖: 计划1

   3. [P1] 密码重置模块 (2h)
      - 文件: .codebuddy/plan/password-reset.md
      - 依赖: 计划1

   4. [P1] 用户资料管理模块 (2.5h)
      - 文件: .codebuddy/plan/user-profile.md
      - 依赖: 计划1, 计划2

   ## 执行顺序
   1. 计划1 (用户注册)
   2. 计划2 (用户登录)
   3. 计划3 (密码重置) ← 并行
   4. 计划4 (用户资料管理) ← 并行

   ## 预计总耗时
   6-7 小时（并行情况下）

   ## 执行策略
   请选择执行方式：
   - [A] 顺序执行：逐个执行，每个完成后等待您的确认
   - [B] 自动执行：按依赖顺序自动执行，遇到错误时停止
   ```

6. **Wait for User Confirmation**:

   等待用户选择执行策略，然后继续。
```

---

## Phase 1-4: 执行单个子计划

### 执行流程（复用现有逻辑）

```markdown
### Phase 1: Context Retrieval
### Phase 2: Analysis and Planning
### Phase 3: Implementation
### Phase 4: Code Review

（与现有 multi-execute 流程相同）
```

每个子计划执行完成后：

```markdown
### Phase 4.3: Sub-Plan Completion Report

为每个子计划生成完成报告：

```markdown
## 子计划完成

### 计划信息
- 计划名称: 用户注册模块
- 计划文件: .codebuddy/plan/user-registration.md
- 执行状态: ✅ 成功

### 变更摘要
| File | Operation | Description |
|------|-----------|-------------|
| src/models/User.ts | Create | 用户模型 |
| src/api/register.ts | Create | 注册接口 |
| src/services/auth.ts | Modify | 认证服务 |

### 审查结果
- 代码审查: 通过

### 后续依赖
- 依赖此计划: [用户登录模块, 密码重置模块, 用户资料管理模块]
```

### 保存执行状态

将执行状态保存到 `.codebuddy/plan/master-plan-status.json`:

```json
{
  "masterPlan": "user-authentication-master.md",
  "status": "in_progress",
  "currentSubPlan": "user-registration",
  "completedSubPlans": ["user-registration"],
  "pendingSubPlans": ["user-login", "password-reset", "user-profile"],
  "startTime": "2026-02-26T10:00:00Z",
  "lastUpdate": "2026-02-26T12:00:00Z"
}
```
```

---

## Phase 5: 批量执行协调（新增）

### 5.1 顺序执行模式

```markdown
### Phase 5: Sequential Execution Coordinator

`[Mode: Coordinate]`

1. **Execute Current Sub-Plan**:
   - 执行当前子计划（Phase 1-4）
   - 等待执行完成

2. **Check Execution Result**:

   **成功**:
   - 标记子计划为已完成
   - 更新状态文件
   - 呈现完成报告
   - **询问用户是否继续**:
     ```markdown
     子计划 [1/4] 完成 ✅

     下一步: 用户登录模块
     是否继续执行？(yes/no)
     ```

   **失败**:
   - 标记子计划为失败
   - 呈现错误详情
   - **停止执行**:
     ```markdown
     子计划 [1/4] 失败 ❌

     错误: [错误详情]

     执行已停止。
     您可以：
     - 修复问题后继续: /execute .codebuddy/plan/user-authentication-master.md
     - 跳过此计划: /execute .codebuddy/plan/user-authentication-master.md --skip-failed
     ```

3. **Determine Next Step**:

   - 如果用户确认继续：执行下一个子计划
   - 如果用户取消：保存状态，等待后续恢复
   - 如果所有计划完成：进入 Phase 6

4. **Resume from Checkpoint**:

   如果执行中断，用户可以恢复：
   ```bash
   /execute .codebuddy/plan/user-authentication-master.md --resume
   ```

   从上次中断的位置继续执行。
```

### 5.2 自动执行模式

```markdown
### Phase 5: Auto Execution Coordinator

`[Mode: Coordinate]`

1. **Execute Current Sub-Plan**:
   - 执行当前子计划（Phase 1-4）
   - 自动等待执行完成

2. **Check Execution Result**:

   **成功**:
   - 标记子计划为已完成
   - 更新状态文件
   - 自动继续下一个子计划
   - 在完成时记录日志：
     ```markdown
     [INFO] Sub-plan [1/4] completed: user-registration
     ```

   **失败**:
   - 标记子计划为失败
   - **立即停止执行**
   - 呈现完整错误报告：
     ```markdown
     # 批量执行失败

     执行已停止，共完成 1/4 个子计划。

     ### 失败详情
     **子计划**: 用户注册模块
     **错误**: [错误详情]

     ### 下一步
     - 修复问题后恢复: /execute .codebuddy/plan/user-authentication-master.md --resume
     - 查看完整日志: .codebuddy/plan/master-plan-execution.log
     ```

3. **Continue Until All Plans Completed**:

   按照执行顺序自动执行所有子计划，直到：
   - 所有子计划完成 → 进入 Phase 6
   - 任一子计划失败 → 停止并报告

4. **Parallel Execution Support** (可选高级功能):

   对于无依赖关系的子计划，支持并行执行：
   ```markdown
   [INFO] Executing parallel plans:
   - password-reset
   - user-profile
   ```
```

---

## Phase 6: 批量完成报告（新增）

### 最终交付

```markdown
### Phase 6: Final Delivery Report

`[Mode: Report]`

当所有子计划完成时，生成最终报告：

```markdown
# 批量执行完成

## 执行摘要

| 指标 | 值 |
|------|-----|
| 总计划数 | 4 |
| 成功 | 4 |
| 失败 | 0 |
| 总耗时 | 6.5 小时 |
| 开始时间 | 2026-02-26 10:00 |
| 结束时间 | 2026-02-26 16:30 |

## 子计划状态

| 计划 | 状态 | 耗时 | 变更文件 |
|------|------|------|----------|
| 用户注册模块 | ✅ | 2h | 3 |
| 用户登录模块 | ✅ | 1.5h | 2 |
| 密码重置模块 | ✅ | 2h | 4 |
| 用户资料管理模块 | ✅ | 1.5h | 3 |

## 所有变更文件

| File | Operation | Description |
|------|-----------|-------------|
| src/models/User.ts | Create | 用户模型 |
| src/api/register.ts | Create | 注册接口 |
| src/api/login.ts | Create | 登录接口 |
| src/api/reset-password.ts | Create | 密码重置接口 |
| src/api/profile.ts | Create | 资料接口 |
| src/services/auth.ts | Modify | 认证服务 |
| src/components/LoginForm.tsx | Create | 登录表单 |
| src/components/RegisterForm.tsx | Create | 注册表单 |
| ...

## 审查结果

| 子计划 | 审查状态 | 发现问题 |
|--------|----------|----------|
| 用户注册模块 | 通过 | 0 |
| 用户登录模块 | 通过 | 0 |
| 密码重置模块 | 通过 | 0 |
| 用户资料管理模块 | 通过 | 0 |

## 测试建议

1. [ ] 运行单元测试: `npm test`
2. [ ] 运行集成测试: `npm run test:integration`
3. [ ] 手动测试用户注册流程
4. [ ] 手动测试用户登录流程
5. [ ] 手动测试密码重置流程
6. [ ] 手动测试资料管理流程

## 日志文件

- 执行日志: `.codebuddy/plan/master-plan-execution.log`
- 状态文件: `.codebuddy/plan/master-plan-status.json`

## 归档

执行记录已保存，您可以通过以下命令查看：

```bash
# 查看执行历史
/execute --history .codebuddy/plan/user-authentication-master.md
```

---

**所有子计划执行完成！** ✅
```

### 清理临时文件

- 将执行日志归档到 `.codebuddy/plan/archive/`
- 保留状态文件用于审计
- 可选：删除子计划文件（需用户确认）
```

---

## 状态管理

### 执行状态文件

```json
// .codebuddy/plan/master-plan-status.json
{
  "masterPlan": "user-authentication-master.md",
  "status": "completed", // pending, in_progress, completed, failed
  "executionMode": "auto", // sequential, auto
  "currentSubPlan": null,
  "completedSubPlans": [
    {
      "name": "user-registration",
      "file": ".codebuddy/plan/user-registration.md",
      "status": "completed",
      "startTime": "2026-02-26T10:00:00Z",
      "endTime": "2026-02-26T12:00:00Z",
      "duration": "2h",
      "changedFiles": 3,
      "reviewResult": "passed"
    },
    {
      "name": "user-login",
      "file": ".codebuddy/plan/user-login.md",
      "status": "completed",
      "startTime": "2026-02-26T12:00:00Z",
      "endTime": "2026-02-26T13:30:00Z",
      "duration": "1.5h",
      "changedFiles": 2,
      "reviewResult": "passed"
    },
    ...
  ],
  "pendingSubPlans": [],
  "failedSubPlans": [],
  "startTime": "2026-02-26T10:00:00Z",
  "endTime": "2026-02-26T16:30:00Z",
  "totalDuration": "6.5h"
}
```

---

## 错误处理

### 子计划失败处理

```markdown
### 子计划失败场景

1. **编译/类型错误**:
   - 立即停止执行
   - 提供详细错误信息
   - 建议修复方案

2. **测试失败**:
   - 询问用户是否继续（可选）
   - 记录失败详情
   - 生成修复建议

3. **代码审查失败**:
   - 如果是严重问题：停止执行
   - 如果是轻微问题：询问是否继续

4. **依赖关系验证失败**:
   - 立即停止执行
   - 提示用户修复依赖关系

5. **用户中断**:
   - 保存当前状态
   - 支持后续恢复
```

---

## 恢复机制

### 从中断恢复

```bash
# 恢复执行
/execute .codebuddy/plan/user-authentication-master.md --resume

# 跳过失败的计划继续
/execute .codebuddy/plan/user-authentication-master.md --skip-failed

# 重新执行某个子计划
/execute .codebuddy/plan/user-registration.md

# 查看执行历史
/execute --history .codebuddy/plan/user-authentication-master.md
```

---

## 新增工具支持

### 辅助函数（伪代码）

```javascript
// 解析总计划
function parseMasterPlan(planPath) {
  const content = readFile(planPath);
  return {
    subPlans: extractSubPlans(content),
    dependencies: extractDependencies(content),
    executionOrder: calculateExecutionOrder(dependencies)
  };
}

// 构建依赖图
function buildDependencyGraph(subPlans) {
  const graph = {};
  subPlans.forEach(plan => {
    graph[plan.name] = plan.dependencies;
  });
  return graph;
}

// 拓扑排序
function topologicalSort(graph) {
  // 实现拓扑排序算法
  // 返回执行顺序
}

// 更新状态文件
function updateStatus(statusFile, data) {
  const current = readJson(statusFile);
  const updated = { ...current, ...data };
  writeJson(statusFile, updated);
}
```

---

## 修改总结

### 新增功能

1. **计划类型识别** - 区分单计划和总计划
2. **批量执行模式** - 支持执行多个子计划
3. **依赖关系解析** - 自动计算执行顺序
4. **两种执行策略** - 顺序执行和自动执行
5. **状态管理** - 保存和恢复执行状态
6. **错误处理** - 子计划失败时的处理机制
7. **恢复机制** - 支持从中断位置恢复

### 保持兼容

- 单计划执行模式完全兼容现有逻辑
- 现有命令格式不变
- 不影响现有功能

### 文件变更

## 实施结果

### 修改的文件
✅ `.codebuddy/commands/multi-execute.md` - 已完成批量执行逻辑

### 新增功能
1. **Phase 0** - 计划类型识别（单计划 vs 总计划）
2. **Phase 0.5** - 批量执行初始化（依赖图构建、执行顺序计算）
3. **Phase 5** - 批量执行协调（顺序执行 + 自动执行两种模式）
4. **Phase 6** - 批量完成报告
5. **错误处理** - 子计划失败场景处理
6. **恢复机制** - 支持中断后恢复执行

### 运行时文件（由执行时生成）
- `.codebuddy/plan/master-plan-status.json` - 状态文件
- `.codebuddy/plan/master-plan-execution.log` - 执行日志

### 兼容性
✅ 保持完全向后兼容，单计划执行模式不受影响

---
