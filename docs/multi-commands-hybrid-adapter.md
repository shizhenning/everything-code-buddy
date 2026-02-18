# Multi 系列命令适配 CodeBuddy - 融合方案

**文档版本:** v1.0
**制定日期:** 2026-02-18
**方案类型:** 混合适配方案（本地 + 外部可选）

---

## 📋 目录

1. [方案概述](#方案概述)
2. [融合架构](#融合架构)
3. [实施步骤](#实施步骤)
4. [配置说明](#配置说明)
5. [使用指南](#使用指南)

---

## 方案概述

### 1.1 核心理念

**智能降级策略:** 优先尝试使用外部模型（如果可用），否则降级到本地 agent，确保命令始终可用。

### 1.2 功能对比

| 场景 | 外部模型可用 | 外部模型不可用 |
|------|-------------|---------------|
| **Plan** | Codex/Gemini 规划 | planner agent 规划 |
| **Execute** | 外部原型验证 | 直接 CodeBuddy 执行 |
| **Frontend** | Gemini UI 设计 | frontend-patterns skill |
| **Backend** | Codex 后端逻辑 | backend-patterns skill |
| **Workflow** | 多模型协作 | 本地 agent 协作 |

### 1.3 优势

- ✅ **向后兼容** - 保留原版多模型协作能力
- ✅ **优雅降级** - 无外部依赖时自动使用本地能力
- ✅ **用户选择** - 通过配置控制行为
- ✅ **零配置可用** - 默认本地模式，开箱即用
- ✅ **渐进增强** - 可选配置外部模型获得更强能力

---

## 融合架构

### 2.1 分层架构

```
┌─────────────────────────────────────────────────┐
│              Multi 命令层                       │
│         (统一接口，智能路由)                    │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴───────┐
       │  配置检查      │
       │  (降级决策)    │
       └───────┬───────┘
               │
      ┌────────┴────────┐
      │                 │
┌─────▼─────┐    ┌─────▼─────┐
│ 外部模式  │    │ 本地模式  │
│ (可选)   │    │ (默认)   │
└─────┬─────┘    └─────┬─────┘
      │                │
┌─────▼────────────────▼─────┐
│  CodeBuddy Agent 体系        │
│  planner, architect, ...    │
└─────────────────────────────┘
```

### 2.2 配置文件

创建 `~/.codebuddy/multi-config.json`:

```json
{
  "version": "1.0",
  "mode": "local",
  "external": {
    "enabled": false,
    "codex": {
      "api_key": "",
      "model": "gpt-4",
      "base_url": "https://api.openai.com/v1"
    },
    "gemini": {
      "api_key": "",
      "model": "gemini-3-pro-preview",
      "base_url": "https://generativelanguage.googleapis.com/v1"
    },
    "wrapper_path": "~/.codebuddy/bin/codeagent-wrapper"
  },
  "fallback": {
    "use_local_agents": true,
    "prefer_internal_patterns": true
  },
  "prompts": {
    "codex_dir": "~/.codebuddy/.ccg/prompts/codex",
    "gemini_dir": "~/.codebuddy/.ccg/prompts/gemini"
  }
}
```

### 2.3 降级逻辑

```
if (external.enabled && wrapper_exists && api_keys_configured) {
    // 外部模式：尝试使用 codeagent-wrapper
    try {
        return use_external_model();
    } catch (error) {
        console.warn('[Multi] External model failed, falling back to local');
        return use_local_agents();
    }
} else {
    // 本地模式：使用 CodeBuddy 内部能力
    return use_local_agents();
}
```

---

## 实施步骤

### 步骤 1: 创建配置文件

**文件:** `~/.codebuddy/multi-config.json`

```json
{
  "version": "1.0",
  "mode": "local",
  "external": {
    "enabled": false,
    "codex": {
      "api_key": "",
      "model": "gpt-4"
    },
    "gemini": {
      "api_key": "",
      "model": "gemini-3-pro-preview"
    },
    "wrapper_path": "~/.codebuddy/bin/codeagent-wrapper"
  },
  "fallback": {
    "use_local_agents": true
  }
}
```

### 步骤 2: 创建降级脚本

**文件:** `scripts/multi-mode-selector.js`

```javascript
#!/usr/bin/env node

/**
 * Multi Mode Selector - 智能选择外部或本地模式
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.codebuddy', 'multi-config.json');

/**
 * 读取配置
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { mode: 'local', external: { enabled: false } };
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.warn('[Multi] Failed to load config, using local mode');
    return { mode: 'local', external: { enabled: false } };
  }
}

/**
 * 检查外部模型是否可用
 */
function isExternalAvailable(config) {
  if (!config.external?.enabled) {
    return false;
  }

  // 检查 wrapper 脚本
  const wrapperPath = config.external?.wrapper_path
    ?.replace('~', os.homedir());
  if (!wrapperPath || !fs.existsSync(wrapperPath)) {
    return false;
  }

  // 检查 API 密钥
  const hasCodexKey = !!config.external?.codex?.api_key;
  const hasGeminiKey = !!config.external?.gemini?.api_key;

  return hasCodexKey || hasGeminiKey;
}

/**
 * 选择模式
 */
function selectMode() {
  const config = loadConfig();

  // 强制本地模式
  if (config.mode === 'local') {
    return 'local';
  }

  // 尝试外部模式
  if (isExternalAvailable(config)) {
    return 'external';
  }

  // 降级到本地
  return 'local';
}

/**
 * 导出模式信息
 */
function getModeInfo() {
  const mode = selectMode();
  const config = loadConfig();

  return {
    mode,
    config,
    isExternalAvailable: isExternalAvailable(config)
  };
}

// CLI 接口
if (require.main === module) {
  const info = getModeInfo();
  console.log(JSON.stringify(info, null, 2));
}

module.exports = { selectMode, getModeInfo, loadConfig };
```

### 步骤 3: 重写 multi-plan.md（融合版）

```markdown
# Plan - Hybrid Development Planning

Multi-mode planning: External model (if available) or local planner agent.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use English when interacting with tools/models
- **Hybrid Mode**: Auto-detect available capabilities and use optimal approach
- **Fallback Strategy**: External unavailable → local planner agent
- **Code Sovereignty**: All production code modifications by CodeBuddy only

---

## Configuration Check

First, check available modes:

```bash
# Check current mode and configuration
node scripts/multi-mode-selector.js
```

**Mode Selection Logic:**
1. If `mode === "local"` → Use planner agent
2. If `external.enabled && wrapper exists && API keys configured` → Try external
3. If external fails → Fall back to planner agent

---

## Workflow

### Phase 1: Context Retrieval

Use appropriate tools to gather context:
- `search_content` - Find relevant patterns
- `read_file` - Understand existing code
- `list_files` - Explore project structure

### Phase 2: Planning

**If External Mode Available:**

```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend codex \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/codex/architect.md
<TASK>
Requirement: $ARGUMENTS
Context: <gathered context>
</TASK>
OUTPUT: Step-by-step implementation plan
EOF",
  run_in_background: true,
  timeout: 3600000
})
```

**If Local Mode (or External Failed):**

Launch the **planner** agent directly:
```
The planner agent will create a detailed implementation plan based on:
- Gathered context from Phase 1
- User requirements
- Project structure and patterns
```

### Phase 3: Plan Output

- Write plan to `.codebuddy/plan/current.md`
- Present summary to user
- Indicate which mode was used (external/local)

---

## Example Usage

### Usage 1: Local Mode (Default)

```bash
# No configuration needed, uses planner agent
/plan Create a REST API for user management
```

### Usage 2: External Mode (After Configuration)

1. Edit `~/.codebuddy/multi-config.json`:
```json
{
  "mode": "auto",
  "external": {
    "enabled": true,
    "codex": {
      "api_key": "sk-...",
      "model": "gpt-4"
    },
    "wrapper_path": "~/.codebuddy/bin/codeagent-wrapper"
  }
}
```

2. Use multi-plan:
```bash
/multi-plan Create a REST API for user management
```

### Usage 3: Force Local Mode

```json
{
  "mode": "local"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| External not working | Check `multi-config.json` and wrapper script |
| Wrapper missing | Use local mode or provide wrapper script |
| API key invalid | Check configuration or fall back to local |
| Fallback not working | Ensure `fallback.use_local_agents: true` |
```

### 步骤 4: 重写 multi-execute.md（融合版）

```markdown
# Execute - Hybrid Development Execution

Multi-mode execution: External prototype (if available) or direct CodeBuddy implementation.

$ARGUMENTS

---

## Configuration Check

```bash
node scripts/multi-mode-selector.js
```

---

## Workflow

### Phase 1: Mode Selection

Based on configuration:
- **External Available** → Get prototype from external model
- **Local Mode** → Direct implementation by CodeBuddy

### Phase 2: External Mode (Prototype + Refactor)

If external mode available:

1. **Get Prototype:**
```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend codex resume <SESSION_ID> \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/codex/architect.md
<TASK>
Requirement: <from plan>
Context: <target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY
EOF",
  run_in_background: true
})
```

2. **Refactor to Production:**
- Treat external diff as "dirty prototype"
- Refactor to match project standards
- Apply security review
- Add proper error handling

### Phase 3: Local Mode (Direct Implementation)

If local mode (or external failed):

1. **Read Plan:**
   - Load from `.codebuddy/plan/current.md`
   - Verify approval

2. **Direct Implementation:**
   - Use CodeBuddy tools directly
   - Apply best practices via agents
   - Use code-reviewer for quality

3. **Quality Gates:**
   - Run security-reviewer
   - Verify tests pass
   - Check for regressions

---

## Comparison

| Aspect | External Mode | Local Mode |
|--------|--------------|-----------|
| **Speed** | Faster (prototype generation) | Slower (full implementation) |
| **Quality** | Requires refactoring | Production-ready directly |
| **Cost** | API costs | Free |
| **Reliability** | Depends on external API | 100% available |
```

### 步骤 5: 重写 multi-workflow.md（融合版）

```markdown
# Workflow - Hybrid Collaborative Development

Multi-mode workflow: External collaboration (if available) or local agent orchestration.

$ARGUMENTS

---

## Collaborative Models

**External Mode (if configured):**
- **Codex** - Backend authority
- **Gemini** - Frontend expert
- **Claude** - Orchestration and refactoring

**Local Mode:**
- **planner** - Planning phase
- **architect** - Design decisions
- **code-reviewer** - Quality checks
- **security-reviewer** - Security audit
- **tdd-guide** - Test guidance

---

## Workflow Phases

### Phase 1: Research & Analysis

**Mode: Local Always**
- Use `search_content` for patterns
- Analyze dependencies
- Identify risks

### Phase 2: Ideation & Planning

**External Mode:**
- Launch Codex/Gemini for multi-perspective planning
- Consolidate outputs

**Local Mode:**
- Launch **planner** agent
- Launch **architect** agent
- Consolidate outputs

### Phase 3: Execution

**External Mode:**
1. Get prototype from Codex/Gemini
2. CodeBuddy refactors to production
3. Security review

**Local Mode:**
1. Direct implementation
2. Code-reviewer checks
3. Security-reviewer audit

### Phase 4: Optimization

**Both Modes:**
- Performance optimization
- Refactor for maintainability
- Documentation updates

---

## Configuration Examples

### Example 1: Pure Local Mode

```json
{
  "mode": "local",
  "external": { "enabled": false }
}
```

### Example 2: Auto-Select (Recommended)

```json
{
  "mode": "auto",
  "external": {
    "enabled": true,
    "codex": { "api_key": "sk-..." },
    "gemini": { "api_key": "..." },
    "wrapper_path": "~/.codebuddy/bin/codeagent-wrapper"
  },
  "fallback": { "use_local_agents": true }
}
```

### Example 3: Force External

```json
{
  "mode": "external",
  "external": { "enabled": true },
  "fallback": { "use_local_agents": false }
}
```

### Example 4: External Only for Frontend

```json
{
  "mode": "auto",
  "external": {
    "enabled": true,
    "gemini": { "api_key": "..." },
    "codex": { "enabled": false }
  },
  "frontend": { "prefer_external": true }
}
```
```

---

## 配置说明

### 配置选项详解

| 选项 | 类型 | 默认值 | 说明 |
|------|------|-------|------|
| `mode` | string | `"local"` | `"local"` \| `"auto"` \| `"external"` |
| `external.enabled` | boolean | `false` | 是否启用外部模型 |
| `external.codex.api_key` | string | `""` | OpenAI API 密钥 |
| `external.gemini.api_key` | string | `""` | Google API 密钥 |
| `fallback.use_local_agents` | boolean | `true` | 外部失败时是否降级 |
| `wrapper_path` | string | `"~/.codebuddy/bin/codeagent-wrapper"` | wrapper 脚本路径 |

### 模式选择

**local:**
- 强制使用本地 agent
- 忽略外部配置
- 零配置可用

**auto:**
- 智能选择最佳模式
- 外部可用时尝试外部
- 外部失败自动降级

**external:**
- 强制使用外部模型
- 外部不可用时报错
- 不降级到本地

---

## 使用指南

### 快速开始（本地模式）

无需任何配置，直接使用：
```bash
/multi-plan Create user authentication
/multi-execute  # 执行计划
/multi-workflow  # 完整工作流
```

### 启用外部模型

1. 创建配置文件 `~/.codebuddy/multi-config.json`
2. 设置 `mode: "auto"` 或 `"external"`
3. 配置 API 密钥
4. 提供 `codeagent-wrapper` 脚本

### 故障排查

```bash
# 检查当前模式
node scripts/multi-mode-selector.js

# 检查配置
cat ~/.codebuddy/multi-config.json

# 检查 wrapper
ls -la ~/.codebuddy/bin/codeagent-wrapper

# 测试外部模型
/multi-plan Test external connection
```

---

## 总结

### 融合方案优势

| 特性 | 说明 |
|------|------|
| **零配置启动** | 默认本地模式，开箱即用 |
| **渐进增强** | 可选配置外部模型增强能力 |
| **智能降级** | 外部失败自动使用本地能力 |
| **用户控制** | 三种模式完全可控 |
| **向后兼容** | 保留原版多模型能力 |

### 实施优先级

| 任务 | 优先级 | 说明 |
|------|--------|------|
| 创建 `multi-mode-selector.js` | 🔴 P0 | 核心降级逻辑 |
| 创建 `multi-config.json` 模板 | 🔴 P0 | 配置文件 |
| 重写 `multi-plan.md` | 🟡 P1 | 融合版命令 |
| 重写 `multi-execute.md` | 🟡 P1 | 融合版命令 |
| 重写 `multi-workflow.md` | 🟡 P1 | 融合版命令 |
| 创建占位符 wrapper | 🟢 P2 | 外部模式占位符 |

### 立即可用

融合方案实施后，用户可以：
1. ✅ 不配置任何内容，使用本地模式
2. ✅ 配置外部 API，获得多模型协作能力
3. ✅ 外部模型不可用时自动降级，不会中断工作流
