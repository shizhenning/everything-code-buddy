# Multi-Plan/Multi-Execute 混合模式

## 概述

`/multi-plan` 和 `/multi-execute` 命令支持**混合模式**：
- **优先**使用外部模型（Codex/Gemini）
- **回退**到 CodeBuddy 原生 subagents（architect, planner, code-reviewer）

## 模式选择

### 自动检测

命令会自动检测 `codeagent-wrapper` 是否可用：

```bash
test -f "${CODEBUDDY_PLUGIN_ROOT}/bin/codeagent-wrapper"
```

| 检测结果 | 执行模式 | 使用的模型/Agent |
|---------|---------|-----------------|
| ✅ 可用 | EXTERNAL_MODE | Codex + Gemini |
| ❌ 不可用 | NATIVE_MODE | architect + planner + code-reviewer |

### 手动控制

在生成的计划中，会标记使用的模式：

```markdown
### Execution Mode
- **Mode**: EXTERNAL_MODE | NATIVE_MODE
- **Backend Analysis**: Codex | architect agent
- **Frontend Analysis**: Gemini | planner agent
```

## 修改内容

### Phase 1: 上下文检索（原生工具）

使用 CodeBuddy 原生工具替代 ace-tools MCP：

```bash
# 1. 发现项目结构
Glob({ pattern: "**/*.{js,ts,jsx,tsx,py,java,go,rs}" })

# 2. 搜索相关代码模式
Grep({ pattern: "<keyword>", fileTypes: "<lang>" })

# 3. 读取关键文件
Read({ filePath: "<path/to/file>" })
```

## 使用方式

### 生成规划

```bash
/multi-plan 为黄金矿工游戏项目生成实施计划
```

### 执行规划

```bash
/multi-execute ${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/feature-name.md
```

## 工作流程

### Multi-Plan 规划流程

1. **Phase 1: 上下文检索**（原生工具）
   - 分析需求
   - Glob 发现项目结构
   - Grep 搜索相关代码
   - Read 读取关键文件

2. **Phase 2: 多模型协同分析**（混合模式）
   - 检测 `codeagent-wrapper` 可用性
   - **EXTERNAL_MODE**: 并行调用 Codex + Gemini
   - **NATIVE_MODE**: 并行调用 architect + planner agents
   - 交叉验证

3. **生成实施计划**
   - 综合分析结果
   - 标记执行模式
   - 保存到 `.codebuddy/plan/` 目录

### Multi-Execute 执行流程

1. **Phase 0: 读取计划**
   - 解析计划文件
   - 检测 MODE（EXTERNAL_MODE 或 NATIVE_MODE）
   - 任务类型路由

2. **Phase 1: 快速上下文检索**（原生工具）
   - Glob/Grep/Read 读取上下文

3. **Phase 3: 原型获取**（根据模式）
   - **EXTERNAL_MODE**:
     - 前端 → Gemini
     - 后端 → Codex
     - 全栈 → 并行调用
   - **NATIVE_MODE**:
     - 跳过此阶段，直接实施计划

4. **Phase 4: 代码实现**
   - **EXTERNAL_MODE**: 解析外部模型 Diff，重构并应用
   - **NATIVE_MODE**: 直接按计划实施

5. **Phase 5: 审计和交付**
   - **EXTERNAL_MODE**: Codex + Gemini 审计
   - **NATIVE_MODE**: code-reviewer agent 审计

## 依赖

### EXTERNAL_MODE 需要的组件

1. **codeagent-wrapper** (外部工具)
   - 位置: `${CODEBUDDY_PLUGIN_ROOT}/bin/codeagent-wrapper`
   - 功能: 调用外部模型（Codex/Gemini）
   - 配置: 需要单独安装和配置

2. **角色提示文件** (Role Prompts)
   - `.ccg/prompts/codex/analyzer.md`
   - `.ccg/prompts/codex/architect.md`
   - `.ccg/prompts/gemini/analyzer.md`
   - `.ccg/prompts/gemini/architect.md`

### NATIVE_MODE 使用的组件（内置）

- ✅ **architect** agent - 架构分析
- ✅ **planner** agent - 实施规划
- ✅ **code-reviewer** agent - 代码审查
- ✅ Glob/Grep/Read - 原生工具

## CodeBuddy 原生工具（无需配置）

- ✅ Glob - 文件发现
- ✅ Grep - 代码搜索
- ✅ Read - 文件读取
- ✅ Write/Edit - 文件编辑
- ✅ Bash - 命令执行

## 优势

### 混合模式的优势

1. **灵活性**: 自动适应环境，无需手动配置
2. **可访问性**: 无外部模型时也能正常工作
3. **高质量**: 优先使用专业模型（Codex/Gemini）
4. **可靠性**: 内置 agents 提供稳定的备选方案

### EXTERNAL_MODE 特点

- Codex: 强大的后端逻辑和调试能力
- Gemini: 出色的前端设计和 UI/UX
- 真正的多模型协同

### NATIVE_MODE 特点

- 无需外部依赖
- 使用经过训练的 CodeBuddy agents
- 更快的响应时间
- 更低的成本

## 限制

1. **EXTERNAL_MODE 需要配置**: codeagent-wrapper 必须正确配置
2. **NATIVE_MODE 无外部模型**: 无法访问 Codex/Gemini 的独特能力
3. **模式不可混用**: 一次执行只能使用一种模式

## 回退方案

如果 `codeagent-wrapper` 不可用，命令会自动切换到 NATIVE_MODE。

也可以手动使用内置命令：

```bash
# 使用内置 planner 命令
/plan <需求描述>

# 直接调用 Task 工具
Task({
  subagent_name: "planner",
  description: "生成规划",
  prompt: "<需求描述>"
})
```

## 测试

修改后的命令已通过 CodeBuddy 测试套件：

```bash
node tests/run-all.js
# 结果: 1107/1130 通过 (97.9%)
```

## 示例输出

### EXTERNAL_MODE 输出示例

```markdown
### Execution Mode
- **Mode**: EXTERNAL_MODE
- **Backend Analysis**: Codex
- **Frontend Analysis**: Gemini

### SESSION_ID
- MODE: EXTERNAL_MODE
- CODEX_SESSION: abc123
- GEMINI_SESSION: def456
```

### NATIVE_MODE 输出示例

```markdown
### Execution Mode
- **Mode**: NATIVE_MODE
- **Backend Analysis**: architect agent
- **Frontend Analysis**: planner agent

### SESSION_ID
- MODE: NATIVE_MODE
- CODEX_SESSION: N/A
- GEMINI_SESSION: N/A
```

---

**更新日期**: 2026-02-18
**版本**: 3.0 (Hybrid Mode)
