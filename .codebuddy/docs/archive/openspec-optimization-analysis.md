# OpenSpec Commands & Skills 优化空间分析

## 当前架构概览

### OpenSpec Commands（`.codebuddy/commands/opsx/`）

| Command | 功能 | Skill |
|---------|------|-------|
| `/opsx:new` | 创建新变更 | `openspec-new-change` |
| `/opsx:continue` | 继续创建工件 | `openspec-continue-change` |
| `/opsx:apply` | 执行任务 | `openspec-apply-change` |
| `/opsx:verify` | 验证实现 | `openspec-verify-change` |
| `/opsx:archive` | 归档变更 | `openspec-archive-change` |
| `/opsx:sync` | 同步规格 | `openspec-sync-specs` |
| `/opsx:ff` | 快速创建所有工件 | - |
| `/opsx:explore` | 探索模式 | - |
| `/opsx:onboard` | 引导式入门 | - |
| `/opsx:bulk-archive` | 批量归档 | - |

### 当前 Multi-Plan & Multi-Execute（`.codebuddy/commands/`）

| Command | 功能 | 与 OpenSpec 集成 |
|---------|------|-----------------|
| `/multi-plan` | 多模型协同规划 | ❌ 无集成 |
| `/multi-execute` | 多代理协同执行 | ❌ 无集成 |

---

## 优化空间分析

### 🔴 P0 - 高优先级：与 multi-plan/multi-execute 集成

#### 优化 1: multi-plan 自动生成 OpenSpec 工件

**现状**：
- `multi-plan` 生成 `.codebuddy/plan/<feature>.md`
- OpenSpec 需要手动调用 `/opsx:new` 或 `/opsx:ff` 创建工件
- 两者完全独立，存在重复工作

**问题**：
1. 重复输入需求描述
2. 计划不一致的风险
3. 工作流不连贯

**优化方案**：

```bash
# 新增命令：/multi-plan --openspec
/multi-plan "添加用户认证" --openspec

# 等价于：
# 1. 运行标准 multi-plan
# 2. 自动转换到 OpenSpec 格式
# 3. 生成所有必需工件
# 4. 可选：细粒度任务拆解
```

**实现细节**：

在 `multi-plan.md` 中新增 Phase 4.5:

```markdown
### Phase 4.5: OpenSpec 集成（可选）

[Mode: Integrate]

如果用户传递 `--openspec` 标志：

1. **检查 OpenSpec 环境**
   ```bash
   openspec status --json 2>&1 || echo "NOT_INITIALIZED"
   ```
   
   如果未初始化，提示用户先运行 `openspec init`

2. **创建 OpenSpec 变更**
   ```bash
   # 从计划文件名提取 kebab-case 变更名
   # 例如: user-auth-plan.md → user-auth-plan
   openspec new change "<change-name>"
   ```

3. **生成必需工件**
   
   并行执行：
   - **proposal.md**: 从 Goal, Background, Scope 提取
   - **specs.md**: 从 Requirements, Acceptance Criteria 提取
   - **design.md**: 从 Architecture, Technical Decisions 生成
   - **tasks.md**: 从 Implementation Steps 提取 + 细化

4. **细粒度任务拆解**（可选）
   
   如果检测到任务粒度 > 10 分钟：
   - 调用 `task-refiner` agent
   - 拆解为 3-10 分钟的子任务
   - 更新 tasks.md

5. **显示结果**
   ```
   ✓ 计划已生成: .codebuddy/plan/<feature>.md
   ✓ OpenSpec 变更已创建: openspec/changes/<name>/
   ✓ 工件: proposal, specs, design, tasks
   
   下一步:
   - 运行 /opsx:continue <name> 完善工件
   - 或运行 /multi-execute --openspec <name> 直接执行
   ```

**优先级**: P0  
**工作量**: 4 小时  
**预期效果**: 减少 50% 的初始规划时间

---

#### 优化 2: multi-execute 支持 OpenSpec 模式

**现状**：
- `multi-execute` 读取 `.codebuddy/plan/<feature>.md`
- OpenSpec 的 `openspec-apply-change` 读取 `openspec/changes/<name>/tasks.md`
- 两者执行逻辑类似，但未集成

**问题**：
1. 多个执行入口，用户困惑
2. 两个系统无法共享进度追踪
3. 验证逻辑重复

**优化方案**：

```bash
# 新增命令：/multi-execute --openspec <change-name>
/multi-execute --openspec user-auth

# 等价于：
# 1. 读取 OpenSpec 上下文（proposal, specs, design, tasks）
# 2. 细粒度任务执行 + checkbox 更新
# 3. 每个任务完成后验证
# 4. 对照 specs.md 验证完整性
```

**实现细节**：

在 `multi-execute.md` 中新增 OpenSpec 模式：

```markdown
### Phase 0.6: OpenSpec 模式检测

[Mode: Detect]

如果用户传递 `--openspec <change-name>` 标志：

1. **读取 OpenSpec 状态**
   ```bash
   openspec status --change "<name>" --json
   openspec instructions apply --change "<name>" --json
   ```

2. **验证工件完整性**
   - 检查 proposal.md, specs.md, design.md, tasks.md 是否存在
   - 如果缺失，提示运行 `/opsx:continue <name>`

3. **读取上下文文件**
   ```bash
   # 从 instructions.outputPath 读取
   # - proposal.md
   # - specs/*/spec.md
   # - design.md
   # - tasks.md
   ```

4. **更新执行上下文**
   - 将 OpenSpec 上下文合并到执行上下文
   - 将 tasks.md 的 checkbox 映射为执行清单

### Phase 3.5: OpenSpec 任务验证（仅 OpenSpec 模式）

[Mode: Verify]

在每个任务完成后：

1. **更新 checkbox 状态**
   ```markdown
   - [ ] T1: 创建 User 数据模型
   ↓
   - [x] T1: 创建 User 数据模型
   ```

2. **运行验证检查**
   ```bash
   # 基于任务描述生成验证命令
   # 例如: "创建 User.ts" → 检查文件存在
   ```

3. **记录执行时间**
   ```markdown
   - [x] T1: 创建 User 数据模型 (5min) ← 实际时间
   ```

### Phase 4.3: OpenSpec 完整性验证（仅 OpenSpec 模式）

[Mode: Verify]

所有任务完成后：

1. **对照 specs.md 验证**
   ```bash
   # 调用 openspec-verify-change 逻辑
   # - 提取所有 Requirements
   # - 搜索代码库验证实现
   ```

2. **生成验证报告**
   ```
   ## 完整性检查结果
   
   Completeness: 12/12 tasks complete ✓
   Correctness: 8/8 requirements covered ✓
   Coherence: Design followed ✓
   
   状态: Ready for archive
   ```

3. **建议下一步**
   ```
   下一步:
   - 运行 /opsx:verify <name> 详细验证
   - 或运行 /opsx:archive <name> 归档变更
   ```

**优先级**: P0  
**工作量**: 5 小时  
**预期效果**: 统一执行入口，减少 40% 的执行时间

---

### 🟡 P1 - 中优先级：细粒度任务拆解

#### 优化 3: task-refiner Agent

**现状**：
- OpenSpec 的 `tasks.md` 粒度由用户手动控制
- 没有自动细粒度拆解机制
- multi-plan 的粗粒度任务直接转换，质量不高

**问题**：
1. 任务粒度不一致
2. 大任务风险高
3. 进度追踪不精确

**优化方案**：

创建新的 agent: `task-refiner`

```typescript
// .codebuddy/agents/task-refiner.md

---

name: task-refiner
description: 细粒度任务拆解专家 - 将粗粒度任务拆解为 3-10 分钟的可执行子任务

**输入**: 任务列表（粗粒度）

**输出**: 细粒度任务列表（checkbox 格式）

**拆解规则**:

1. **时间粒度**: 每个任务 3-10 分钟
2. **动作具体性**: 必须指定具体文件路径
3. **可验证性**: 每个任务有明确的完成标准
4. **逻辑内聚性**: 每个任务单一关注点
5. **依赖关系**: 明确任务之间的依赖

**拆解示例**:

粗粒度:
```
步骤 1: 创建 User 数据模型 (30min)
```

细粒度:
```
1.1: 定义 User 实体类 (5min)
  - [ ] 创建 src/entities/User.ts 文件
  - [ ] 添加 @Entity() 装饰器

1.2: 添加主键字段 (5min)
  - [ ] 添加 id 字段
  - [ ] 添加 @PrimaryGeneratedColumn()

1.3: 添加业务字段 (10min)
  - [ ] 添加 email 字段 + @Column()
  - [ ] 添加 passwordHash 字段 + @Column()

1.4: 添加验证装饰器 (5min)
  - [ ] 为 email 添加 @IsEmail()
  - [ ] 为 passwordHash 添加 @Length(6, 100)

1.5: 添加数据库索引 (3min)
  - [ ] 为 email 添加 @Index({ unique: true })

1.6: 导出 User 实体 (2min)
  - [ ] export default User
```

**拆解模式**:

- 实体创建: 创建文件 → 添加装饰器 → 添加字段 → 添加验证 → 添加索引 → 导出
- 路由创建: 创建文件 → 定义路由 → 添加处理函数 → 添加验证 → 添加错误处理 → 导出
- 组件创建: 创建文件 → 定义接口 → 实现 JSX → 添加样式 → 添加事件处理 → 导出
```

**集成到 multi-plan**:

```markdown
### Phase 2.5: 细粒度任务拆解

[Mode: Refine]

如果检测到任务粒度 > 10 分钟：

1. **调用 task-refiner agent**
   ```
   Task({
     subagent_name: "task-refiner",
     description: "细化任务到 3-10 分钟粒度",
     prompt: "以下任务需要细粒度拆解:\n\n${implementation_steps}\n\n请按照 3-10 分钟粒度拆解为 checkbox 格式。"
   })
   ```

2. **验证拆解质量**
   - 检查每个任务时间估算
   - 检查动作具体性（文件路径）
   - 检查可验证性

3. **更新计划**
   - 替换粗粒度步骤为细粒度任务
   - 添加到 Implementation Steps 部分

4. **记录拆解日志**
   ```markdown
   ## 任务拆解日志
   
   原始任务: "创建 User 数据模型 (30min)"
   拆解为: 6 个子任务，总计 30min
   粒度: 3-10 分钟/任务
   ```

**优先级**: P1  
**工作量**: 3 小时  
**预期效果**: 任务粒度一致性 > 90%

---

### 🟡 P1 - 中优先级：计划链同步

#### 优化 4: 计划链一致性检查工具

**现状**：
- multi-plan 和 OpenSpec 计划可能不一致
- 执行过程中动态更新不同步
- 没有自动检测机制

**问题**：
1. 计划偏差难以发现
2. 变更历史不完整
3. 回溯困难

**优化方案**：

创建新命令: `/opsx:sync-plan`

```bash
# 用法
/opsx:sync-plan <change-name>

# 功能
# 1. 比较 multi-plan 和 OpenSpec 工件
# 2. 检测差异
# 3. 提供同步选项
```

**实现细节**：

```markdown
### 步骤 1: 比较计划

读取:
- `.codebuddy/plan/<change-name>.md` (multi-plan)
- `openspec/changes/<change-name>/tasks.md` (OpenSpec)

比较维度:

| 维度 | multi-plan | OpenSpec | 一致性 |
|------|-----------|---------|--------|
| 任务数 | 12 | 15 | ❌ 不一致 |
| 总时间 | 2h | 2h45m | ❌ 不一致 |
| 需求覆盖率 | 75% | 95% | ✅ 改进 |

### 步骤 2: 检测差异

类型 1: 任务数量差异
- multi-plan: 12 任务
- OpenSpec: 15 任务
- 原因: 执行过程中添加了 3 个新任务

类型 2: 时间估算差异
- multi-plan: 2h
- OpenSpec: 2h45m (实际执行)
- 原因: 任务比预期复杂

类型 3: 需求覆盖率差异
- multi-plan: 75% (从 Requirements 提取)
- OpenSpec: 95% (执行后验证)
- 原因: 发现遗漏的需求

### 步骤 3: 同步选项

选项 1: 更新 multi-plan
- 将 OpenSpec 的细粒度任务同步回 multi-plan
- 更新时间估算
- 添加执行时间记录

选项 2: 保留差异
- 计划保持原样
- 记录差异原因
- 仅归档时同步

选项 3: 生成报告
- 生成同步报告
- 不修改任何文件
- 用户决定后续操作

**优先级**: P1  
**工作量**: 2 小时  
**预期效果**: 计划一致性 > 95%

---

### 🟢 P2 - 低优先级：用户体验优化

#### 优化 5: 统一入口命令

**现状**：
- 多个命令入口（`/multi-plan`, `/opsx:new`, `/opsx:ff`）
- 用户容易混淆
- 学习成本高

**问题**：
1. 命令分散
2. 新手上手困难
3. 工作流不清晰

**优化方案**：

创建统一命令: `/opsx:plan`

```bash
# 智能规划命令，自动选择最佳方式

/opsx:plan "添加用户认证"

# 自动判断:
# 1. 检查 OpenSpec 是否初始化
# 2. 检查是否需要 multi-model 协同分析
# 3. 选择最佳执行路径
```

**智能决策逻辑**：

```typescript
if (!openspecInitialized) {
  if (needsMultiModelAnalysis) {
    // 情况 1: 首次使用 + 复杂需求
    // 运行 multi-plan + 初始化 OpenSpec
    return runMultiPlanWithOpenSpec();
  } else {
    // 情况 2: 首次使用 + 简单需求
    // 仅初始化 OpenSpec
    return initializeOpenSpec();
  }
} else {
  if (needsMultiModelAnalysis) {
    // 情况 3: 已初始化 + 复杂需求
    // 运行 multi-plan → 转换 OpenSpec
    return runMultiPlanConvertToOpenSpec();
  } else {
    // 情况 4: 已初始化 + 简单需求
    // 直接使用 OpenSpec
    return runOpenSpecFF();
  }
}
```

**优先级**: P2  
**工作量**: 3 小时  
**预期效果**: 降低 60% 的学习成本

---

#### 优化 6: 执行进度可视化

**现状**：
- OpenSpec 只显示 checkbox 状态
- multi-execute 显示文本进度
- 没有可视化仪表板

**问题**：
1. 进度不直观
2. 难以快速了解状态
3. 用户体验不佳

**优化方案**：

创建进度可视化组件:

```markdown
### 进度仪表板

```
┌─────────────────────────────────────────────────────┐
│  add-user-auth (spec-driven)                        │
├─────────────────────────────────────────────────────┤
│  完整性: ████████████████░░░░░ 80% (16/20)          │
│  质量:   ████████████████░░░░░ 85%                  │
│  时间:   ██████████████████░░ 90% (2h15m / 2h30m)   │
├─────────────────────────────────────────────────────┤
│  工件状态:                                           │
│  ✓ proposal.md                                      │
│  ✓ specs/authentication/spec.md                     │
│  ✓ design.md                                        │
│  🔄 tasks.md (16/20 done)                           │
│  ⬜ tests.md                                        │
│  ⬜ risks.md                                        │
│  ⬜ rollback.md                                    │
├─────────────────────────────────────────────────────┤
│  最近活动:                                           │
│  [11:45] 完成 T16: 添加密码验证                     │
│  [11:40] 完成 T15: 添加邮箱验证                     │
│  [11:35] 开始 T16: 添加密码验证                     │
├─────────────────────────────────────────────────────┤
│  下一步:                                             │
│  T17: 添加登录路由 (10min)                          │
│  T18: 添加登出路由 (5min)                           │
└─────────────────────────────────────────────────────┘
```

**优先级**: P2  
**工作量**: 4 小时  
**预期效果**: 提升 50% 的进度感知

---

## 优化优先级总结

| 优化项 | 优先级 | 工作量 | 预期效果 | 依赖 |
|--------|--------|--------|---------|------|
| 1. multi-plan → OpenSpec 集成 | P0 | 4h | ↓ 50% 规划时间 | - |
| 2. multi-execute OpenSpec 模式 | P0 | 5h | ↓ 40% 执行时间 | 优化 1 |
| 3. task-refiner Agent | P1 | 3h | ↑ 90% 粒度一致性 | - |
| 4. 计划链一致性检查 | P1 | 2h | ↑ 95% 计划一致性 | 优化 1, 2 |
| 5. 统一入口命令 | P2 | 3h | ↓ 60% 学习成本 | - |
| 6. 执行进度可视化 | P2 | 4h | ↑ 50% 进度感知 | 优化 2 |

**总工作量**: 21 小时  
**分阶段实施**:
- Phase 1 (P0): 9 小时
- Phase 2 (P1): 5 小时
- Phase 3 (P2): 7 小时

---

## 具体实施建议

### 第一阶段：核心集成（P0）

目标：打通 multi-plan/multi-execute 与 OpenSpec 的集成

1. **实施优化 1**: multi-plan → OpenSpec
   - 修改 `multi-plan.md`
   - 添加 Phase 4.5
   - 集成 openspec CLI 调用

2. **实施优化 2**: multi-execute OpenSpec 模式
   - 修改 `multi-execute.md`
   - 添加 Phase 0.6, 3.5, 4.3
   - 复用 openspec-verify-change 逻辑

**预期收益**:
- 端到端自动化流程
- 减少重复输入
- 统一执行入口

### 第二阶段：质量提升（P1）

目标：提升任务质量和计划一致性

3. **实施优化 3**: task-refiner Agent
   - 创建 `.codebuddy/agents/task-refiner.md`
   - 定义拆解规则和模式
   - 集成到 multi-plan

4. **实施优化 4**: 计划链同步
   - 创建 `.codebuddy/commands/opsx/sync-plan.md`
   - 实现比较和同步逻辑
   - 生成同步报告

**预期收益**:
- 任务粒度一致性 > 90%
- 计划一致性 > 95%
- 完整的变更追溯

### 第三阶段：体验优化（P2）

目标：改善用户体验和学习曲线

5. **实施优化 5**: 统一入口
   - 创建 `.codebuddy/commands/opsx/plan.md`
   - 实现智能决策逻辑
   - 简化工作流程

6. **实施优化 6**: 进度可视化
   - 创建仪表板组件
   - 集成到 OpenSpec status
   - 实时更新进度

**预期收益**:
- 降低 60% 学习成本
- 提升 50% 进度感知
- 更直观的用户体验

---

## 风险与缓解

### 风险 1: 向后兼容性

**风险**: 修改现有命令可能破坏用户工作流

**缓解**:
- 保留所有现有命令不变
- 新增可选参数（如 `--openspec`）
- 新增命令不影响旧命令

### 风险 2: 复杂度增加

**风险**: 集成后系统复杂度增加

**缓解**:
- 模块化设计，降低耦合
- 完善的文档和示例
- 渐进式发布，逐步迭代

### 风险 3: 性能影响

**风险**: 额外的调用增加执行时间

**缓解**:
- 并行调用，减少等待
- 缓存上下文，避免重复读取
- 可选的优化步骤，不影响核心流程

---

## 总结

OpenSpec 与 multi-plan/multi-execute 有巨大的优化空间，主要集中在：

1. **核心集成（P0）**: 打通端到端自动化流程
2. **质量提升（P1）**: 提升任务质量和计划一致性
3. **体验优化（P2）**: 改善用户体验和学习曲线

通过分阶段实施，预计可以实现：
- 规划时间减少 50%
- 执行时间减少 40%
- 任务粒度一致性 > 90%
- 计划一致性 > 95%
- 学习成本降低 60%

总工作量约 21 小时，建议按优先级分三个阶段实施。

---

**文档版本**: 1.0  
**创建日期**: 2026-02-26  
**作者**: CodeBuddy AI Assistant
