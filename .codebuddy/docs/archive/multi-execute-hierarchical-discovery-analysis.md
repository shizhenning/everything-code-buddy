# Multi-Execute 从总计划入口执行的层次查找分析

## 问题

**当前 multi-execute 从总计划入口执行时，是否会按层次找到 OpenSpec 待执行规格？**

---

## 现状分析

### 1. 当前 multi-execute 的执行逻辑

根据 `commands/multi-execute.md` 的实现：

```
Phase 0: Read Plan
  ├─ 识别输入类型
  │   ├─ Plan 文件路径 (如 .codebuddy/plan/xxx.md)
  │   └─ 直接任务描述
  │
  ├─ 读取计划内容
  │   ├─ 如果是文件路径 → 读取并解析
  │   └─ 提取：任务类型、实施步骤、关键文件、SESSION_ID
  │
  └─ 任务类型路由
      ├─ Frontend → Gemini
      ├─ Backend → Codex
      └─ Fullstack → Codex ∥ Gemini 并行
```

**关键特点**：
- ✅ 读取单个计划文件
- ✅ 直接从计划中提取任务
- ❌ **不支持层次化查找**
- ❌ **不查找 OpenSpec 规格**

### 2. 缺失的层次化查找机制

**问题**：

```
当前行为：
.multi-execute 执行
  ↓
直接读取指定的 .md 文件
  ↓
执行文件中的任务
  ↓
❌ 不会查找关联的 OpenSpec 工件

期望行为：
.multi-execute 执行
  ↓
读取计划文件
  ↓
检测是否有关联的 OpenSpec 变更
  ↓
按层次查找：
  ├─ proposal.md (目标、范围)
  ├─ specs.md (需求、验收标准)
  ├─ design.md (架构、设计)
  └─ tasks.md (细粒度任务清单)
  ↓
执行细粒度任务 + checkbox 追踪
```

---

## 解决方案设计

### 方案 1: 增强 multi-execute 的 Phase 0

在 `multi-execute.md` 的 **Phase 0: Read Plan** 中添加层次查找逻辑：

```markdown
### Phase 0: Read Plan (增强版)

`[Mode: Prepare]`

1. **识别输入类型**:
   - Plan 文件路径 (e.g., `.codebuddy/plan/xxx.md`)
   - OpenSpec 变更名 (e.g., `--openspec user-auth`)
   - 直接任务描述

2. **层次化查找逻辑**:

   **场景 A: 提供 --openspec 参数**
   ```bash
   /multi-execute --openspec <change-name>
   
   查找路径：
   1. openspec/changes/<change-name>/tasks.md
   2. 读取所有相关工件：
      - proposal.md
      - specs.md
      - design.md
      - tasks.md
   ```

   **场景 B: 读取 .codebuddy/plan 文件**
   ```bash
   /multi-execute .codebuddy/plan/feature-name.md
   
   查找路径：
   1. 读取计划文件
   2. 检查是否有对应的 OpenSpec 变更：
      - 从文件名提取：feature-name → feature-name
      - 检查：openspec/changes/feature-name/
   3. 如果存在 → 使用 OpenSpec 模式
   4. 如果不存在 → 使用标准模式
   ```

   **场景 C: 读取 openspec/changes 文件**
   ```bash
   /multi-execute openspec/changes/feature-name/tasks.md
   
   查找路径：
   1. 自动识别这是 OpenSpec 变更
   2. 加载同目录下的所有工件
   3. 使用 OpenSpec 模式执行
   ```

3. **工件完整性检查**:

   对于 OpenSpec 模式，必须存在以下工件：
   ```bash
   REQUIRED_ARTIFACTS=(
     "proposal.md"
     "specs.md"
     "design.md"
     "tasks.md"
   )
   
   for artifact in "${REQUIRED_ARTIFACTS[@]}"; do
     if [ ! -f "openspec/changes/$CHANGE_NAME/$artifact" ]; then
       echo "❌ 缺少必需工件: $artifact"
       echo "请运行: /opsx:continue $CHANGE_NAME"
       exit 1
     fi
   done
   ```

4. **任务类型路由（OpenSpec 模式）**:

   | 任务类型 | 检测方式 | Route |
   |---------|---------|-------|
   | **Frontend** | tasks.md 包含 UI、组件、样式相关任务 | Gemini |
   | **Backend** | tasks.md 包含 API、数据库、逻辑相关任务 | Codex |
   | **Fullstack** | tasks.md 同时包含前端和后端任务 | Codex ∥ Gemini 并行 |
```

### 方案 2: 添加检测逻辑

在 Phase 0 的开头添加自动检测：

```markdown
### Phase 0: Read Plan

`[Mode: Prepare]`

0.5 **OpenSpec 自动检测** (新增)

```javascript
// 检测逻辑
function detectOpenSpecMode(input) {
  // 情况 1: 明确的 --openspec 参数
  if (input.includes('--openspec')) {
    const changeName = extractChangeName(input);
    return {
      mode: 'openspec',
      changeName: changeName,
      basePath: `openspec/changes/${changeName}`
    };
  }
  
  // 情况 2: 输入是 .codebuddy/plan 文件
  if (input.startsWith('.codebuddy/plan/')) {
    const planName = extractPlanName(input);
    const potentialOpenSpecPath = `openspec/changes/${planName}`;
    
    if (fs.existsSync(potentialOpenSpecPath)) {
      return {
        mode: 'openspec',
        changeName: planName,
        basePath: potentialOpenSpecPath,
        planPath: input
      };
    } else {
      return {
        mode: 'standard',
        planPath: input
      };
    }
  }
  
  // 情况 3: 输入是 openspec/changes 文件
  if (input.startsWith('openspec/changes/')) {
    const match = input.match(/openspec\/changes\/([^/]+)/);
    if (match) {
      const changeName = match[1];
      return {
        mode: 'openspec',
        changeName: changeName,
        basePath: `openspec/changes/${changeName}`
      };
    }
  }
  
  // 默认：标准模式
  return {
    mode: 'standard',
    input: input
  };
}
```

1. **识别输入类型** (原有逻辑)
   - Plan 文件路径
   - OpenSpec 变更名
   - 直接任务描述

2. **根据检测模式选择执行路径**:

   ```javascript
   const mode = detectOpenSpecMode(ARGUMENTS);
   
   if (mode.mode === 'openspec') {
     // 进入 OpenSpec 执行路径
     await executeOpenSpecMode(mode);
   } else {
     // 进入标准执行路径
     await executeStandardMode(mode);
   }
   ```

   **OpenSpec 执行路径**:
   ```javascript
   async function executeOpenSpecMode(mode) {
     // 1. 读取 OpenSpec 工件
     const proposal = await readFile(`${mode.basePath}/proposal.md`);
     const specs = await readFile(`${mode.basePath}/specs.md`);
     const design = await readFile(`${mode.basePath}/design.md`);
     const tasks = await readFile(`${mode.basePath}/tasks.md`);
     
     // 2. 解析 tasks.md 中的 checkbox 任务
     const taskList = parseCheckboxTasks(tasks);
     
     // 3. 构建执行上下文
     const context = {
       changeName: mode.changeName,
       proposal: proposal,
       specs: specs,
       design: design,
       tasks: taskList
     };
     
     // 4. 进入 Phase 1.5: 任务拆解
     // ...
   }
   ```

   **标准执行路径**:
   ```javascript
   async function executeStandardMode(mode) {
     // 原有的 Phase 0 逻辑
     // 读取计划文件
     // 提取任务类型
     // ...
   }
   ```

3. **读取计划内容** (原有逻辑，根据模式分支)
```

### 方案 3: 完整的层次查找流程图

```
用户执行: /multi-execute <input>
  ↓
┌─────────────────────────────────────────────────────┐
│  Phase 0: Read Plan (增强版)                        │
│                                                      │
│  0.5 自动检测模式:                                   │
│    ├─ 检查 --openspec 参数?                         │
│    ├─ 检查是 .codebuddy/plan 文件?                  │
│    ├─ 检查是 openspec/changes 文件?                │
│    └─ 检查计划对应的 OpenSpec 是否存在?             │
└────────────────────┬────────────────────────────────┘
                     ↓
         ┌───────────┴───────────┐
         │                       │
         ↓                       ↓
  [OpenSpec 模式]         [标准模式]
         │                       │
         ↓                       ↓
┌─────────────────────────────────────────────────────┐
│  OpenSpec 模式执行路径                               │
│                                                      │
│  Phase 0.5: 工件加载                                 │
│    ├─ 读取 proposal.md                              │
│    ├─ 读取 specs.md                                  │
│    ├─ 读取 design.md                                │
│    └─ 读取 tasks.md                                 │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  Phase 1.5: 任务解析                                 │
│    ├─ 解析 tasks.md 中的 checkbox                   │
│    ├─ 构建任务列表                                   │
│    ├─ 分析依赖关系                                   │
│    └─ 生成执行顺序                                   │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  Phase 3: 任务执行 (细粒度)                         │
│    ┌────────────────────────────────────────────┐  │
│    │  对于每个 checkbox 任务:                   │  │
│    │    1. 显示任务信息                          │  │
│    │    2. 实施任务                              │  │
│    │    3. 更新 checkbox: [ ] → [x]            │  │
│    │    4. 验证任务                              │  │
│    └────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  Phase 4.3: 完整性验证                               │
│    ├─ 对照 specs.md 验证需求覆盖                   │
│    ├─ 检查所有任务是否完成                         │
│    └─ 生成验证报告                                 │
└─────────────────────────────────────────────────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
           [执行完成]
```

---

## 实施步骤

### Step 1: 修改 multi-execute.md

在 `Phase 0: Read Plan` 之前添加：

```markdown
### Phase 0: OpenSpec Mode Detection (新增)

`[Mode: Detect]`

```bash
# 检测逻辑
if [[ "$ARGUMENTS" == *"--openspec"* ]]; then
  # 模式 1: 显式指定 OpenSpec
  CHANGE_NAME=$(echo "$ARGUMENTS" | grep -oP '(?<=--openspec\s)\S+')
  OPENSPEC_MODE=true
  OPENSPEC_PATH="openspec/changes/${CHANGE_NAME}"
  
elif [[ "$ARGUMENTS" == ".codebuddy/plan/"* ]]; then
  # 模式 2: 读取计划文件，检查关联的 OpenSpec
  PLAN_FILE="$ARGUMENTS"
  CHANGE_NAME=$(basename "$PLAN_FILE" .md)
  
  if [ -d "openspec/changes/${CHANGE_NAME}" ]; then
    # 发现关联的 OpenSpec
    OPENSPEC_MODE=true
    OPENSPEC_PATH="openspec/changes/${CHANGE_NAME}"
    PLAN_PATH="$PLAN_FILE"
  else
    # 没有关联的 OpenSpec，使用标准模式
    OPENSPEC_MODE=false
    PLAN_PATH="$PLAN_FILE"
  fi
  
elif [[ "$ARGUMENTS" == "openspec/changes/"* ]]; then
  # 模式 3: 直接指定 OpenSpec 变更路径
  CHANGE_NAME=$(echo "$ARGUMENTS" | grep -oP '(?<=openspec/changes/)[^/]+')
  OPENSPEC_MODE=true
  OPENSPEC_PATH="openspec/changes/${CHANGE_NAME}"
  
else
  # 模式 4: 直接任务描述，使用标准模式
  OPENSPEC_MODE=false
fi
```

### Step 2: 添加 OpenSpec 执行分支

```markdown
### Phase 1: Context Loading (分支)

```bash
if [ "$OPENSPEC_MODE" = true ]; then
  # OpenSpec 模式：加载所有工件
  echo "🔍 OpenSpec 模式已启用"
  echo "📂 变更路径: $OPENSPEC_PATH"
  
  # 验证工件完整性
  REQUIRED_ARTIFACTS=("proposal.md" "specs.md" "design.md" "tasks.md")
  
  for artifact in "${REQUIRED_ARTIFACTS[@]}"; do
    if [ ! -f "${OPENSPEC_PATH}/${artifact}" ]; then
      echo "❌ 缺少必需工件: ${artifact}"
      echo "请运行: /opsx:continue ${CHANGE_NAME}"
      exit 1
    fi
  done
  
  # 加载工件
  PROPOSAL=$(cat "${OPENSPEC_PATH}/proposal.md")
  SPECS=$(cat "${OPENSPEC_PATH}/specs.md")
  DESIGN=$(cat "${OPENSPEC_PATH}/design.md")
  TASKS=$(cat "${OPENSPEC_PATH}/tasks.md")
  
  echo "✅ 所有工件已加载"
  echo "   - proposal.md ✓"
  echo "   - specs.md ✓"
  echo "   - design.md ✓"
  echo "   - tasks.md ✓"
  
else
  # 标准模式：原有逻辑
  # ...
fi
```

### Step 3: 添加任务解析

```markdown
### Phase 1.5: Task Parsing (OpenSpec 模式)

```bash
if [ "$OPENSPEC_MODE" = true ]; then
  # 解析 tasks.md 中的 checkbox 任务
  echo "📋 解析任务清单..."
  
  # 提取所有 checkbox 任务
  TASK_LIST=$(echo "$TASKS" | grep -P '^\-\s+\[[ x]\]\s+\*\*[T]\d+:' | sed 's/^\- \[ \]/❌/; s/^\- \[x\]/✅/')
  
  # 统计任务
  TOTAL_TASKS=$(echo "$TASK_LIST" | wc -l)
  COMPLETED_TASKS=$(echo "$TASK_LIST" | grep '✅' | wc -l)
  PENDING_TASKS=$((TOTAL_TASKS - COMPLETED_TASKS))
  
  echo "📊 任务统计:"
  echo "   - 总任务数: $TOTAL_TASKS"
  echo "   - 已完成: $COMPLETED_TASKS"
  echo "   - 待执行: $PENDING_TASKS"
  
  if [ $PENDING_TASKS -eq 0 ]; then
    echo "✅ 所有任务已完成！"
    echo "请运行: /opsx:verify ${CHANGE_NAME} 进行验证"
    exit 0
  fi
  
else
  # 标准模式：跳过此 Phase
fi
```

### Step 4: 添加任务执行循环

```markdown
### Phase 3: Task Execution (OpenSpec 模式)

```bash
if [ "$OPENSPEC_MODE" = true ]; then
  # 按顺序执行每个待完成任务
  echo "🚀 开始执行任务..."
  
  for task in $(echo "$TASK_LIST" | grep '❌' | cut -d':' -f1); do
    echo ""
    echo "┌──────────────────────────────────────────┐"
    echo "│  执行任务: $task                          │"
    echo "└──────────────────────────────────────────┘"
    
    # 1. 提取任务详情
    task_info=$(echo "$TASKS" | grep -A 10 "$task")
    
    # 2. 显示任务信息
    echo "$task_info"
    
    # 3. 执行任务（调用原有的多模型执行逻辑）
    # ...
    
    # 4. 更新 checkbox
    sed -i "s/- \[ \] $task/- [x] $task/g" "${OPENSPEC_PATH}/tasks.md"
    
    # 5. 验证任务
    # ...
    
    echo "✅ 任务 $task 已完成"
  done
  
else
  # 标准模式：原有逻辑
  # ...
fi
```

---

## 代码示例

### 完整的检测和路由逻辑

```javascript
// multi-execute OpenSpec 集成逻辑

const ARGUMENTS = process.argv.slice(2).join(' ');

async function detectAndExecute() {
  const mode = detectOpenSpecMode(ARGUMENTS);
  
  console.log(`检测到模式: ${mode.mode}`);
  
  if (mode.mode === 'openspec') {
    await executeOpenSpecFlow(mode);
  } else {
    await executeStandardFlow(mode);
  }
}

function detectOpenSpecMode(input) {
  // 模式 1: 显式 --openspec 参数
  if (input.includes('--openspec')) {
    const changeName = input.match(/--openspec\s+(\S+)/)?.[1];
    if (changeName) {
      return {
        mode: 'openspec',
        changeName,
        basePath: `openspec/changes/${changeName}`
      };
    }
  }
  
  // 模式 2: .codebuddy/plan 文件
  if (input.startsWith('.codebuddy/plan/')) {
    const planName = input.match(/\.codebuddy\/plan\/(.+?)\.md/)?.[1];
    if (planName) {
      const openspecPath = `openspec/changes/${planName}`;
      if (fs.existsSync(openspecPath)) {
        return {
          mode: 'openspec',
          changeName: planName,
          basePath: openspecPath,
          planPath: input
        };
      }
    }
    return {
      mode: 'standard',
      planPath: input
    };
  }
  
  // 模式 3: openspec/changes 路径
  if (input.startsWith('openspec/changes/')) {
    const match = input.match(/openspec\/changes\/([^/]+)/);
    if (match) {
      return {
        mode: 'openspec',
        changeName: match[1],
        basePath: `openspec/changes/${match[1]}`
      };
    }
  }
  
  // 默认：标准模式
  return { mode: 'standard', input };
}

async function executeOpenSpecFlow(mode) {
  console.log(`🔍 OpenSpec 模式`);
  console.log(`📂 变更: ${mode.changeName}`);
  
  // 1. 验证工件
  const artifacts = ['proposal.md', 'specs.md', 'design.md', 'tasks.md'];
  for (const artifact of artifacts) {
    const path = `${mode.basePath}/${artifact}`;
    if (!fs.existsSync(path)) {
      console.error(`❌ 缺少工件: ${artifact}`);
      console.error(`请运行: /opsx:continue ${mode.changeName}`);
      process.exit(1);
    }
  }
  
  // 2. 加载工件
  const context = {
    proposal: fs.readFileSync(`${mode.basePath}/proposal.md`, 'utf-8'),
    specs: fs.readFileSync(`${mode.basePath}/specs.md`, 'utf-8'),
    design: fs.readFileSync(`${mode.basePath}/design.md`, 'utf-8'),
    tasks: fs.readFileSync(`${mode.basePath}/tasks.md`, 'utf-8')
  };
  
  console.log('✅ 所有工件已加载');
  
  // 3. 解析任务
  const tasks = parseCheckboxTasks(context.tasks);
  const pendingTasks = tasks.filter(t => !t.completed);
  
  console.log(`📊 待执行任务: ${pendingTasks.length}/${tasks.length}`);
  
  // 4. 执行任务
  for (const task of pendingTasks) {
    console.log(`\n🚀 执行任务: ${task.id}`);
    await executeTask(task, context);
    updateTaskCheckbox(task.id, mode.basePath);
  }
  
  // 5. 验证完整性
  await verifyCompleteness(context);
  
  console.log('✅ 执行完成！');
}

function parseCheckboxTasks(tasksMd) {
  const lines = tasksMd.split('\n');
  const tasks = [];
  
  for (const line of lines) {
    const match = line.match(/^\-\s+\[(.)\]\s+\*\*[T](\d+):/);
    if (match) {
      tasks.push({
        id: match[2],
        completed: match[1] === 'x',
        content: line
      });
    }
  }
  
  return tasks;
}

function updateTaskCheckbox(taskId, basePath) {
  const tasksPath = `${basePath}/tasks.md`;
  let tasksMd = fs.readFileSync(tasksPath, 'utf-8');
  
  tasksMd = tasksMd.replace(
    new RegExp(`- \\[ \\] \\*\\*T${taskId}:`),
    `- [x] **T${taskId}:`
  );
  
  fs.writeFileSync(tasksPath, tasksMd, 'utf-8');
}

async function verifyCompleteness(context) {
  // 对照 specs.md 验证需求覆盖
  console.log('🔍 验证完整性...');
  
  // 解析 specs.md
  const specs = parseSpecs(context.specs);
  
  // 检查需求覆盖
  let coverageCount = 0;
  for (const spec of specs) {
    const covered = await checkSpecCoverage(spec);
    if (covered) coverageCount++;
  }
  
  const coverageRate = (coverageCount / specs.length * 100).toFixed(1);
  
  console.log(`📊 需求覆盖率: ${coverageCount}/${specs.length} (${coverageRate}%)`);
  
  if (coverageRate < 90) {
    console.warn('⚠️ 需求覆盖率不足 90%');
  } else {
    console.log('✅ 需求覆盖率达标');
  }
}

// 启动执行
detectAndExecute();
```

---

## 总结

### 问题答案

**当前 multi-execute 从总计划入口执行时，不会自动按层次查找 OpenSpec 待执行规格。**

### 原因

1. ❌ 缺少自动检测逻辑
2. ❌ 缺少层次化查找机制
3. ❌ 没有关联检查
4. ❌ 不支持 OpenSpec 工件加载

### 解决方案

通过增强 `multi-execute.md` 实现：

1. ✅ **Phase 0.5: 自动检测** - 检测多种输入模式
2. ✅ **层次化查找** - 自动查找关联的 OpenSpec 工件
3. ✅ **工件完整性验证** - 确保所有必需工件存在
4. ✅ **任务解析** - 解析细粒度 checkbox 任务
5. ✅ **双分支执行** - OpenSpec 模式 vs 标准模式

### 实施优先级

| 改进点 | 优先级 | 工作量 | 效果 |
|--------|--------|--------|------|
| 自动检测逻辑 | P0 | 2h | 支持多种输入方式 |
| 工件加载 | P0 | 1h | 加载 OpenSpec 工件 |
| 任务解析 | P0 | 1.5h | 解析 checkbox 任务 |
| 任务执行循环 | P0 | 2h | 执行细粒度任务 |
| 完整性验证 | P1 | 1.5h | 验证需求覆盖 |

**总工作量**: 8 小时

---

**文档版本**: 1.0  
**创建日期**: 2026-02-26  
**作者**: CodeBuddy AI Assistant
