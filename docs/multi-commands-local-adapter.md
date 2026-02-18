# Multi 系列命令适配 CodeBuddy - 本地化方案

**文档版本:** v1.0
**制定日期:** 2026-02-18
**方案类型:** 本地化适配方案（无需外部模型）

---

## 📋 目录

1. [问题分析](#问题分析)
2. [适配方案](#适配方案)
3. [实施步骤](#实施步骤)
4. [修改清单](#修改清单)

---

## 问题分析

### 1.1 现状

| 问题 | 现状 |
|------|------|
| **multi 命令存在** | 4 个命令文件已更新路径到 `~/.codebuddy/` |
| **依赖缺失** | `codeagent-wrapper` 脚本不存在 |
| **提示词缺失** | `.ccg/prompts/` 目录不存在 |
| **外部 API** | 需要配置 OpenAI 和 Google API 密钥 |
| **CodeBuddy 限制** | 不支持 Bash 工具调用外部模型 |

### 1.2 核心冲突

**原版设计:**
```
Claude (协调器) → codeagent-wrapper → Codex/Gemini API
```

**CodeBaddy 现状:**
```
CodeBuddy (协调器) → ❌ 无外部模型调用能力
```

---

## 适配方案

### 2.1 方案 A：移除依赖，简化为单模型工作流

**核心理念:** 移除 multi 命令的外部模型依赖，改为 CodeBuddy 自身能力实现。

**修改策略:**

| 命令 | 修改内容 |
|-------|---------|
| `multi-plan.md` | 移除 `codeagent-wrapper` 调用，使用内部 planner agent |
| `multi-execute.md` | 移除外部原型验证，直接 CodeBuddy 执行 |
| `multi-frontend.md` | 改为前端专项优化提示词 |
| `multi-backend.md` | 改为后端专项优化提示词 |
| `multi-workflow.md` | 简化为本地区域协调工作流 |

**优点:**
- ✅ 无需外部 API 配置
- ✅ 立即可用
- ✅ 保持工作流结构

**缺点:**
- ❌ 失去多模型协作优势

### 2.2 方案 B：保留命令，添加使用说明

**核心理念:** 保留原命令结构，添加说明文档指导用户自行配置。

**实施内容:**

1. **添加前置检查** - 检测依赖是否存在
2. **创建占位符脚本** - `~/.codebuddy/bin/codeagent-wrapper` 占位符
3. **配置指南** - 创建 `docs/multi-model-setup.md`

**优点:**
- ✅ 保留原有设计
- ✅ 用户可自行扩展

**缺点:**
- ❌ 默认不可用
- ❌ 需要用户手动配置

---

## 实施步骤

### 推荐方案：方案 A（本地化改造）

#### 步骤 1: 重写 multi-plan.md

**核心修改:**
```diff
- Bash({
-   command: "~/.codebuddy/bin/codeagent-wrapper --backend codex \"$PWD\" <<'EOF'
- ...
- EOF"
- })
+ Launch the **planner** agent to create implementation plan
```

**完整实现:**
```markdown
# Plan - Local Development Planning

Single-model planning using CodeBuddy's internal planner agent.

$ARGUMENTS

---

## Your Role

You are **Planning Coordinator**, using CodeBuddy's planner agent to create step-by-step implementation plans.

---

## Workflow

1. **Context Retrieval**
   - Use `search_content` to find relevant code patterns
   - Use `read_file` to understand current implementation
   - Use `list_files` to explore project structure

2. **Planning Phase**
   - Launch the **planner** agent with gathered context
   - Generate detailed implementation plan
   - Plan should include:
     * Step-by-step tasks
     * Required files to modify
     * Potential risks
     * Testing strategy

3. **Output**
   - Write plan to `.codebuddy/plan/current.md`
   - Present summary to user for review
   - Wait for user confirmation before proceeding
```

#### 步骤 2: 重写 multi-execute.md

**核心修改:**
```markdown
# Execute - Local Development Execution

Single-model execution using CodeBuddy's native capabilities.

$ARGUMENTS

---

## Your Role

You are **Execution Coordinator**, implementing the approved plan using CodeBuddy's tools.

---

## Workflow

1. **Read Plan**
   - Load plan from `.codebuddy/plan/current.md`
   - Verify plan is approved by user

2. **Implementation**
   - Execute each step using appropriate tools:
     * `read_file` - Read existing code
     * `replace_in_file` - Make targeted changes
     * `write_to_file` - Create new files
     * `execute_command` - Run build/test commands

3. **Quality Gates**
   - After each change:
     * Verify syntax with linter
     * Run tests if applicable
     * Check for regressions

4. **Validation**
   - Request user confirmation at major milestones
   * Pause for review after completing phases
   * Allow rollback if issues arise
```

#### 步骤 3: 重写 multi-frontend.md

**核心修改:**
```markdown
# Frontend - Frontend Development Guide

Frontend-focused development workflow using CodeBuddy's frontend patterns.

$ARGUMENTS

---

## Your Role

You are **Frontend Specialist**, applying best practices for frontend development.

---

## Frontend Patterns

Load frontend-specific skills:
- `frontend-patterns` - Component design, state management
- `react-patterns` - React best practices (if applicable)
- `vue-patterns` - Vue best practices (if applicable)

---

## Workflow

1. **Analyze Requirements**
   - Identify UI components needed
   - Determine state management approach
   - Plan component hierarchy

2. **Implementation**
   - Apply frontend coding standards
   * Use functional components
   * Implement proper state management
   * Add accessibility (ARIA labels)
   * Ensure responsive design

3. **Quality Checks**
   - Verify component reusability
   - Check for performance issues
   - Test cross-browser compatibility
```

#### 步骤 4: 重写 multi-backend.md

**核心修改:**
```markdown
# Backend - Backend Development Guide

Backend-focused development workflow using CodeBuddy's backend patterns.

$ARGUMENTS

---

## Your Role

You are **Backend Specialist**, applying best practices for backend development.

---

## Backend Patterns

Load backend-specific skills:
- `backend-patterns` - API design, error handling
- `django-patterns` - Django best practices (if applicable)
- `springboot-patterns` - Spring Boot best practices (if applicable)

---

## Workflow

1. **Analyze Requirements**
   - Design API endpoints
   - Plan database schema
   - Define error handling strategy

2. **Implementation**
   - Apply backend coding standards
   * RESTful API design
   * Proper error handling
   * Input validation
   * Security best practices

3. **Quality Checks**
   - Verify API consistency
   - Check for SQL injection vulnerabilities
   - Test error scenarios
```

#### 步骤 5: 重写 multi-workflow.md

**核心修改:**
```markdown
# Workflow - Local Collaborative Workflow

Structured local development workflow (Plan → Execute → Optimize → Review) with intelligent agent routing.

$ARGUMENTS

---

## Your Role

You are **Orchestrator**, coordinating a local multi-agent collaborative system.

---

## Collaborative Agents

| Phase | Agent | Purpose |
|-------|--------|---------|
| **Planning** | planner | Break down requirements into implementation plan |
| **Architecture** | architect | Make system design decisions |
| **Execution** | code-reviewer | Review and implement code changes |
| **Security** | security-reviewer | Verify security best practices |
| **Testing** | tdd-guide | Guide test-driven development |

---

## Workflow Phases

### Phase 1: Research & Analysis
- Search for existing patterns in codebase
- Analyze requirements and dependencies
- Identify potential risks

### Phase 2: Ideation & Planning
- Launch **planner** agent for detailed plan
- Launch **architect** agent for design review
- Consolidate outputs into unified plan

### Phase 3: Execution
- Implement according to approved plan
- Apply appropriate language patterns
- Use code-reviewer for quality checks

### Phase 4: Optimization
- Run security-reviewer for security audit
- Optimize performance bottlenecks
- Refactor for maintainability

### Phase 5: Review & Delivery
- Final quality checks
- Documentation updates
- Delivery summary
```

---

## 修改清单

### 需要修改的文件

| 文件 | 修改类型 | 优先级 |
|------|---------|--------|
| `commands/multi-plan.md` | 完全重写 | 🔴 P0 |
| `commands/multi-execute.md` | 完全重写 | 🔴 P0 |
| `commands/multi-frontend.md` | 完全重写 | 🟡 P1 |
| `commands/multi-backend.md` | 完全重写 | 🟡 P1 |
| `commands/multi-workflow.md` | 完全重写 | 🟡 P1 |

### 无需修改的文件

| 文件 | 原因 |
|------|------|
| `commands/plan.md` | 独立命令，正常工作 |
| `commands/code-review.md` | 独立命令，正常工作 |
| `agents/planner.md` | 正常工作 |
| `agents/architect.md` | 正常工作 |

---

## 总结

### 方案对比

| 方案 | 外部依赖 | 立即可用 | 多模型协作 |
|------|---------|---------|-----------|
| **A: 本地化改造** | ❌ 无需 | ✅ 是 | ❌ 单模型 |
| **B: 保留原设计** | ✅ 需要 | ❌ 否 | ✅ 多模型 |

### 推荐方案

**推荐方案 A（本地化改造）**

**理由:**
1. CodeBuddy 当前不支持外部模型调用
2. 无需用户配置 API 密钥
3. 保持工作流结构的同时简化依赖
4. 立即可用，降低使用门槛

### 实施效果

修改后的 multi 命令将：
- ✅ 使用 CodeBuddy 内置 agent 体系
- ✅ 保持结构化工作流
- ✅ 无需外部依赖
- ✅ 与现有命令协调工作

---

## 后续扩展

如果未来支持外部模型调用，可以考虑：
1. 恢复原版 multi 命令设计
2. 添加外部模型配置选项
3. 实现自动模型切换逻辑
