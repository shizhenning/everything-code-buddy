# Execute - Multi-Agent Collaborative Execution

Multi-agent collaborative execution - Plan analysis 鈫?Implementation 鈫?Code review and delivery.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use **English** when interacting with tools/agents, communicate with user in their language
- **Code Sovereignty**: This command orchestrates implementation and code review using local agents
- **Stop-Loss Mechanism**: Do not proceed to next phase until current phase output is validated
- **Prerequisite**: Only execute after user explicitly confirms plan approval

---

## Local Agent Call Specification

**Call Syntax**:

```
Task({
  subagent_name: "<agent-name>",
  description: "<brief description>",
  prompt: "<task prompt with plan, context, and requirements>"
})
```

**Available Agents**:

| Phase | Backend | Frontend | General |
|-------|---------|----------|---------|
| Analysis | `backend-analyzer` | `frontend-analyzer` | `requirements-analyzer` |
| Planning | `architect` | `architect` | `planner` |
| Implementation | - | - | - |
| Review | `code-reviewer` | `code-reviewer` | `code-reviewer` |

**Agent Focus**:
- `backend-analyzer`: Technical feasibility, architecture impact, performance considerations
- `frontend-analyzer`: UI/UX impact, user experience, visual design, accessibility
- `architect`: System architecture, design patterns, scalability
- `code-reviewer`: Code quality, security, performance, maintainability
- `planner`: Step-by-step implementation planning

---

## Execution Workflow

**Execute Task**: $ARGUMENTS

### Phase 0: Read Plan

`[Mode: Prepare]`

1. **Identify Input Type**:

   | Input Type | Pattern | Mode |
   |------------|---------|------|
   | **Single Plan** | `.codebuddy/plan/*.md` (not master plan) | Single Execution |
   | **Master Plan** | `.codebuddy/plan/*-master.md` or contains "子计划列表" | Batch Execution |
   | **Direct Task** | Text description (not a file path) | Single Execution |

2. **Read Plan Content**:

   **For Single Plan**:
   - Read plan file
   - Extract: task type, implementation steps, key files

   **For Master Plan**:
   - Read master plan file
   - Parse sub-plans list
   - Extract dependencies and execution order
   - Validate all sub-plan files exist

3. **Pre-Execution Confirmation**:

   **For Single Plan**:
   - If input is "direct task description": confirm with user first
   - If cannot confirm user approved plan: must confirm again

   **For Master Plan**:
   - Present master plan and sub-plans summary
   - Confirm user approval for batch execution
   - Ask for execution strategy:
     - Sequential: Execute one-by-one, wait for user confirmation
     - Auto: Execute in dependency order automatically, stop on error

4. **Task Type Routing**:

   | Task Type | Detection | Route |
   |-----------|-----------|-------|
   | **Frontend** | Pages, components, UI, styles, layout | Frontend-focused |
   | **Backend** | API, interfaces, database, logic, algorithms | Backend-focused |
   | **Fullstack** | Contains both frontend and backend | Both agents |

5. **Mode Routing**:

   | Input Type | Next Phase |
   |------------|------------|
   | Single Plan | Phase 1 |
   | Master Plan | Phase 0.5 (Batch Setup) |

---

### Phase 0.5: Batch Execution Setup (NEW - for Master Plan only)

`[Mode: Prepare]`

1. **Parse Master Plan**:

   Extract from master plan file:
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

   Construct dependency relationship:
   ```
   user-registration (no dependencies)
     ↓
   user-login (depends on: user-registration)
     ↓
   {password-reset, user-profile} (parallel execution)
   ```

3. **Determine Execution Order**:

   Use topological sort to determine execution sequence:
   ```
   Execution Order:
   1. user-registration
   2. user-login
   3. password-reset (parallel)
   4. user-profile (parallel)
   ```

4. **Validate Sub-Plans**:

   - Verify all sub-plan files exist
   - Check dependency completeness (no circular dependencies)
   - Validate task type (Frontend/Backend/Fullstack)

5. **Present Execution Plan**:

   ```markdown
   # 批量执行计划

   ## 总计划
   <Master plan name>

   ## 子计划列表 (<N>个)

   1. [P0] <Module 1> (<X hours>)
      - 文件: .codebuddy/plan/module-1.md
      - 依赖: <none or list>

   2. [P0] <Module 2> (<X hours>)
      - 文件: .codebuddy/plan/module-2.md
      - 依赖: Plan 1

   ...

   ## 执行顺序
   <Execution sequence with parallel options>

   ## 预计总耗时
   <Estimated total time (considering parallel execution)>

   ## 执行策略
   请选择执行方式：
   - [A] 顺序执行：逐个执行，每个完成后等待您的确认
   - [B] 自动执行：按依赖顺序自动执行，遇到错误时停止
   ```

6. **Wait for User Confirmation**:

   Wait for user to select execution strategy, then proceed to Phase 5.

---

### Phase 1: Context Retrieval

`[Mode: Retrieval]`

**Use Glob + Grep for file discovery**:

1. Use `Glob` to find relevant files:
   - Target files from plan's "Key Files" table
   - Configuration files: `package.json`, `*.config.js`
   - Source files matching patterns

2. Use `Grep` to find key symbols:
   - Search for relevant function names, class names
   - Find similar feature implementations
   - Locate API routes, database schemas

3. Use `Read` to gather complete context:
   - Read full file contents for key files
   - Extract relevant code snippets
   - Understand existing patterns

**IMPORTANT**:
- Build search queries based on plan content
- **NEVER** use Bash + find/ls to manually explore
- Prioritize: entry file + line number + key symbol name

---

### Phase 2: Analysis and Planning

`[Mode: Analysis]`

**Based on task type, call appropriate agents**:

#### Frontend Task

```
Task({
  subagent_name: "frontend-analyzer",
  description: "Analyze frontend requirements",
  prompt: "Please analyze the following frontend implementation task:

Plan: <plan content>
Context: <retrieved context>

Focus on:
- UI/UX impact
- Component architecture
- Accessibility considerations
- Design consistency

OUTPUT: Detailed analysis and implementation approach."
})
```

#### Backend Task

```
Task({
  subagent_name: "backend-analyzer",
  description: "Analyze backend requirements",
  prompt: "Please analyze the following backend implementation task:

Plan: <plan content>
Context: <retrieved context>

Focus on:
- Technical feasibility
- Architecture impact
- Performance considerations
- Security implications

OUTPUT: Detailed analysis and implementation approach."
})
```

#### Fullstack Task

**Parallel call** both agents:
- `frontend-analyzer` for frontend part
- `backend-analyzer` for backend part

Wait for both agents' complete results.

---

### Phase 3: Implementation

`[Mode: Implement]`

**Claude executes the following steps**:

1. **Plan Execution**:
   - Follow implementation steps from plan
   - Use agent analysis as guidance
   - Apply changes in logical order

2. **Code Quality**:
   - Write clean, maintainable, enterprise-grade code
   - Follow project's existing code standards
   - Ensure proper error handling
   - Add necessary type safety

3. **Minimal Scope**:
   - Changes limited to requirement scope only
   - Review for side effects
   - Make targeted corrections

4. **Apply Changes**:
   - Use Edit/Write tools to execute modifications
   - Only modify necessary code
   - Never affect existing functionality

5. **Self-Verification** (strongly recommended):
   - Run project's existing lint / typecheck / tests
   - If failed: fix regressions before proceeding

---

### Phase 4: Code Review

`[Mode: Review]`

**After changes take effect, MUST call** `code-reviewer` agent:

```
Task({
  subagent_name: "code-reviewer",
  description: "Review implemented changes",
  prompt: "Please review the following code changes:

Plan: <plan content>
Changed Files: <list of modified files>
Changes: <git diff or summary>

Focus on:
- Code quality and maintainability
- Security vulnerabilities
- Performance issues
- Edge cases and error handling
- Compliance with best practices

OUTPUT:
1. Summary of findings
2. List of issues (if any) with severity
3. Specific recommendations for fixes"
})
```

#### 4.1 Integrate and Fix

1. Review feedback from code-reviewer
2. Execute necessary fixes for critical issues
3. Repeat Phase 4 if needed (until quality is acceptable)

#### 4.2 Delivery Confirmation

After review passes, proceed to Phase 4.5 for quality assessment.

---

### Phase 4.5: Quality Assessment (Conditional)

`[Mode: Assess]`

After code review is complete, perform quality assessment based on quality gate configuration.

#### 4.5.0: Check Quality Gate Configuration

Read `.codebuddy/quality-config.json`:

```json
{
  "qualityGate": {
    "enabled": true,
    "mode": "auto",  // auto | manual | off
    "rules": [...]
  }
}
```

**If file does not exist**:
- Use default settings: `enabled: true`, `mode: "auto"`
- Prompt user: "Quality assessment enabled (auto mode). Create `.codebuddy/quality-config.json` to customize."

#### 4.5.1: Quality Gate Decision Logic

```
IF qualityGate.enabled !== true OR qualityGate.mode === "off" THEN
    Skip Phase 4.5
    Log: "Quality assessment disabled"
    Proceed to Phase 4.2 (Delivery Confirmation)

ELSE IF qualityGate.mode === "manual" THEN
    Skip Phase 4.5
    Output hint:
    ```markdown
    ## Quality Assessment Available

    Quality assessment is configured for **manual mode**.

    Run quality assessment after delivery:
    ```
    /quality-assess <plan-file>
    ```

    Proceed to Phase 4.2 (Delivery Confirmation)

ELSE IF qualityGate.mode === "auto" THEN
    Execute Phase 4.5.2 - 4.5.4 (Quality Assessment)
END IF
```

#### 4.5.2: Run Automated Checks (Auto Mode Only)

Execute automated quality checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests with coverage
npm test -- --coverage

# Build verification
npm run build

# Security audit (optional)
npm audit
```

Collect results:
- TypeScript errors: `<count>`
- Lint errors: `<count>`
- Test coverage: `<percentage>%`
- Build status: `<status>`

#### 4.5.3: Call code-reviewer for Quality Assessment (Auto Mode Only)

```
Task({
  subagent_name: "code-reviewer",
  description: "Quality assessment",
  prompt: "Please assess quality of following implementation:

Plan: <plan content>
Changed Files: <list of files>
Changes: <git diff or summary>

Quality Standards from Baseline:
- Functionality: 100% requirement completion rate
- Code Quality: Max 50 lines/function, complexity ≤ 10
- Testing: Min 80% coverage, critical paths 100%
- Linting: 0 errors, max 10 warnings

Auto-Check Results:
  - TypeScript: <errors> errors, <warnings> warnings
  - Lint: <errors> errors, <warnings> warnings
  - Test Coverage: <percentage>%
  - Build: <status>

Evaluate on 5 dimensions:
1. Functionality - Are all requirements implemented?
2. Code Quality - Is code clean, maintainable, performant?
3. Test Coverage - Is test coverage adequate (≥80%)?
4. Documentation - Is documentation complete?
5. Integration - Any regressions?

OUTPUT:
Quality Score (0-100): <score>
Critical Issues: <list>
Recommendations: <list>
Overall Assessment: <pass/fail/conditional>"
})
```

#### 4.5.4: Generate Quality Report (Auto Mode Only)

Generate quality report:

```markdown
## 质量评估报告

### 计划信息
- 计划名称: <plan name>
- 计划文件: <plan file>

### 综合评分
**<score>/100** <stars>

### 分项评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整性 | <score>/100 | <status> |
| 代码质量 | <score>/100 | <status> |
| 测试覆盖 | <score>/100 | <status> |
| 文档完整性 | <score>/100 | <status> |
| 集成验证 | <score>/100 | <status> |

### 自动化检查结果

| 检查项 | 结果 | 详情 |
|--------|------|------|
| TypeScript | <status> | <details> |
| Lint | <status> | <details> |
| 测试覆盖率 | <percentage>% | <details> |
| Build | <status> | <details> |

### 关键问题

| 严重级别 | 问题 | 建议 |
|----------|------|------|
| <severity> | <issue> | <recommendation> |

### 最终结论

**状态**: <status>

**是否批准**: <yes/no>

**后续行动**:
- [ ] <action 1>
- [ ] <action 2>
```

#### 4.5.5: Quality Decision & Execution Control (Auto Mode Only)

**CRITICAL: This is a GATE - execution must be BLOCKED if not passed**

Based on quality score and critical issues:

| Score Range | Decision | Action | canProceed |
|-------------|----------|--------|------------|
| 90-100 | ✅ Pass | Continue to Phase 4.2 | true |
| 80-89 | ✅ Pass | Continue to Phase 4.2 | true |
| 70-79 | ⚠️ Conditional | Continue to Phase 4.2 (with warnings) | true |
| 60-69 | ⚠️ Require Fix | **STOP EXECUTION** | false |
| <60 | ❌ Fail | **STOP EXECUTION** | false |

**Critical Issues Veto**:
**REJECT IMMEDIATELY** if any critical issue exists:
- 🔴 Security vulnerabilities
- 🔴 Missing functionality
- 🔴 Severe performance issues
- 🔴 Type errors
- 🔴 Breaking changes

**IMPORTANT: When execution is STOPPED**:

1. **Write quality status file** (blocking state):
```bash
# Generate .codebuddy/quality-status.json
{
  "status": "Require Fix",  // or "Fail"
  "score": <score>,
  "timestamp": "<current ISO timestamp>",
  "planFile": "<plan file path>",
  "canProceed": false
}
```

2. **Update quality-trends.json** with failed assessment record:
```json
{
  "assessments": [
    {
      "timestamp": "<ISO timestamp>",
      "plan": "<plan file path>",
      "overallScore": <score>,
      "overallStatus": "Require Fix",
      "canProceed": false,
      "executionBlocked": true
    }
  ]
}
```

3. **Generate BLOCKING report** and stop execution:
```markdown
## 🛑 质量评估未通过 - 执行已终止

### 综合评分
**<score>/100** ⚠️

### 阻止原因
<reason for blocking: score range or critical issue>

### 必须修复的问题
1. [ ] <critical issue 1>
2. [ ] <critical issue 2>
...

### 下一步行动

**选项 A: 修复后重新评估**（推荐）
```bash
# 修复问题后运行
/execute .codebuddy/plan/<plan-name>.md --retry
```

**选项 B: 手动质量评估**
```bash
/quality-assess .codebuddy/plan/<plan-name>.md
```

**选项 C: 强制执行**（仅紧急情况，不推荐）
```bash
/execute .codebuddy/plan/<plan-name>.md --force
```
⚠️ **警告**: --force 标志会跳过质量门禁检查，可能导致代码质量问题。

---

**执行已终止**
质量门禁已阻止执行。请修复问题后重新运行。
```

4. **DO NOT** (CRITICAL - execution must stop):
- ❌ Proceed to Phase 4.2 (Delivery Confirmation)
- ❌ Show delivery summary
- ❌ Generate deployment artifacts
- ❌ Allow user to continue to next step

5. **End execution**:
- Show blocking report above
- Wait for user to fix issues and run with `--retry` or `--force`
- Session ends without proceeding to Phase 4.2

---

**If decision is "Pass" or "Conditional"**:

1. **Write quality status file** (allow state):
```bash
# Generate .codebuddy/quality-status.json
{
  "status": "Pass",  // or "Pass (Conditional)"
  "score": <score>,
  "timestamp": "<current ISO timestamp>",
  "planFile": "<plan file path>",
  "canProceed": true
}
```

2. **Update quality-trends.json** with passed assessment record

3. **Proceed to Phase 4.2** (Delivery Confirmation)
- Include quality report in delivery summary
- Add quality badge: `✅ Quality Assessment Passed (<score>/100)`

---

#### 4.5.6: Command Line Flags (Emergency Override)

**Flag Processing Logic**:

Check user input for special flags before executing Phase 4.5:

```
IF user_input.includes("--force") THEN
    IF qualityGate.mode === "auto" OR qualityGate.mode === "manual" THEN
        IF qualityGate.blockBypass !== true THEN
            # Request explicit confirmation
            Prompt user:
            "⚠️  WARNING: You are about to BYPASS the quality gate!

            This may introduce:
            - Security vulnerabilities
            - Code quality issues
            - Test coverage gaps
            - Integration problems

            Current quality score: <score>/100
            Status: <status>

            Confirm bypass? [y/N]"

            IF user_confirms THEN
                # Log security event
                Append to .codebuddy/quality-bypass-log.json:
                {
                  "timestamp": "<ISO timestamp>",
                  "plan": "<plan file path>",
                  "reason": "<user provided reason>",
                  "approvedBy": "<admin>",
                  "riskLevel": "high",
                  "originalScore": <score>,
                  "originalStatus": "<status>"
                }

                # Skip Phase 4.5 quality assessment
                Log: "Quality gate bypassed by user"

                # Proceed to Phase 4.1 (Code Review) and Phase 4.2
                Add warning badge: "⚠️ Quality gate bypassed (emergency use)"
            ELSE
                Exit
            END IF
        ELSE
            Error: "--force is disabled in strict mode. Set qualityGate.blockBypass to false to enable."
            Exit
        END IF
    ELSE
        # qualityGate.mode === "off", proceed normally
        Skip Phase 4.5
    END IF
END IF

IF user_input.includes("--retry") THEN
    # Force re-run quality assessment
    Log: "Re-running quality assessment (retry mode)"
    Execute Phase 4.5.2 - 4.5.4
    Update quality-status.json
    Continue to Phase 4.5.5 decision
END IF

IF user_input.includes("--no-quality") THEN
    IF qualityGate.mode === "off" THEN
        Skip Phase 4.5 entirely
        Log: "Quality assessment disabled (--no-quality)"
        Proceed to Phase 4.1
    ELSE
        Error: "--no-quality only works when qualityGate.mode is 'off'"
        Exit
    END IF
END IF
```

**Note**: Flags are processed at the beginning of Phase 4.5, before quality assessment runs.

---

### Phase 5: Batch Execution Coordinator (Master Plan Only)

`[Mode: Coordinate]`

This phase only applies when executing a master plan. It coordinates the execution of multiple sub-plans.

#### 5.1 Sequential Execution Mode

```markdown
### Phase 5: Sequential Execution Coordinator

`[Mode: Coordinate]`

1. **Execute Current Sub-Plan**:
   - Run Phase 1-4 for the current sub-plan
   - Wait for execution to complete

2. **Check Execution Result**:

   **Success**:
   - Mark sub-plan as completed
   - Update status file (.codebuddy/plan/master-plan-status.json)
   - Present completion report
   - **Ask user whether to continue**:
     ```markdown
     子计划 [<current>/<total>] 完成 ✅

     下一步: <next plan name>
     是否继续执行？(yes/no)
     ```

   **Failure**:
   - Mark sub-plan as failed
   - Present error details
   - **Stop execution**:
     ```markdown
     子计划 [<current>/<total>] 失败 ❌

     错误: <error details>

     执行已停止。
     您可以：
     - 修复问题后继续: /execute .codebuddy/plan/<master-plan>.md
     - 跳过此计划: /execute .codebuddy/plan/<master-plan>.md --skip-failed
     ```

3. **Determine Next Step**:

   - If user confirms continue: execute next sub-plan
   - If user cancels: save status, wait for resume
   - If all plans complete: proceed to Phase 6

4. **Resume from Checkpoint**:

   If execution is interrupted, user can resume:
   ```bash
   /execute .codebuddy/plan/<master-plan>.md --resume
   ```

   Continue from where it left off.
```

#### 5.2 Auto Execution Mode

```markdown
### Phase 5: Auto Execution Coordinator

`[Mode: Coordinate]`

1. **Execute Current Sub-Plan**:
   - Run Phase 1-4 for the current sub-plan
   - Automatically wait for completion

2. **Check Execution Result**:

   **Success**:
   - Mark sub-plan as completed
   - Update status file
   - Automatically continue to next sub-plan
   - Log progress:
     ```markdown
     [INFO] Sub-plan [<current>/<total>] completed: <plan name>
     ```

   **Failure**:
   - Mark sub-plan as failed
   - **Immediately stop execution**
   - Present complete error report:
     ```markdown
     # 批量执行失败

     执行已停止，共完成 <completed>/<total> 个子计划。

     ### 失败详情
     **子计划**: <plan name>
     **错误**: <error details>

     ### 下一步
     - 修复问题后恢复: /execute .codebuddy/plan/<master-plan>.md --resume
     - 查看完整日志: .codebuddy/plan/master-plan-execution.log
     ```

3. **Continue Until All Plans Completed**:

   Automatically execute all sub-plans in order until:
   - All sub-plans complete → Proceed to Phase 6
   - Any sub-plan fails → Stop and report
```

#### 5.3 Sub-Plan Completion Report

For each completed sub-plan, generate:

```markdown
## 子计划完成

### 计划信息
- 计划名称: <plan name>
- 计划文件: .codebuddy/plan/<plan>.md
- 执行状态: ✅ 成功 / ❌ 失败

### 变更摘要
| File | Operation | Description |
|------|-----------|-------------|
| path/to/file.ts | Modified | Description |

### 审查结果
- 代码审查: <Passed/Failed>

### 后续依赖
- 依赖此计划: [list of dependent plans]
```

#### 5.4 Status File Management

Maintain execution state in `.codebuddy/plan/master-plan-status.json`:

```json
{
  "masterPlan": "user-authentication-master.md",
  "status": "in_progress",
  "executionMode": "auto",
  "currentSubPlan": "user-registration",
  "completedSubPlans": ["user-registration"],
  "pendingSubPlans": ["user-login", "password-reset", "user-profile"],
  "failedSubPlans": [],
  "startTime": "2026-02-26T10:00:00Z",
  "lastUpdate": "2026-02-26T12:00:00Z"
}
```

---

### Phase 6: Batch Completion Report (Master Plan Only)

`[Mode: Report]`

When all sub-plans complete, generate final report:

```markdown
# 批量执行完成

## 执行摘要

| 指标 | 值 |
|------|-----|
| 总计划数 | <N> |
| 成功 | <M> |
| 失败 | <K> |
| 总耗时 | <X hours> |
| 开始时间 | <start time> |
| 结束时间 | <end time> |

## 子计划状态

| 计划 | 状态 | 耗时 | 变更文件 |
|------|------|------|----------|
| <plan 1> | ✅ | <time> | <count> |
| <plan 2> | ✅ | <time> | <count> |
| ...

## 所有变更文件

| File | Operation | Description |
|------|-----------|-------------|
| path/to/file.ts | Create/Modify | Description |
| ...

## 审查结果

| 子计划 | 审查状态 | 发现问题 |
|--------|----------|----------|
| <plan 1> | Passed | 0 |
| <plan 2> | Passed | 1 |
| ...

## 测试建议

1. [ ] Run unit tests: `npm test`
2. [ ] Run integration tests: `npm run test:integration`
3. [ ] Manual test <feature 1>
4. [ ] Manual test <feature 2>
5. [ ] ...

## 日志文件

- 执行日志: `.codebuddy/plan/master-plan-execution.log`
- 状态文件: `.codebuddy/plan/master-plan-status.json`

## 归档

执行记录已保存，您可以通过以下命令查看：

```bash
# 查看执行历史
/execute --history .codebuddy/plan/<master-plan>.md
```

---

**所有子计划执行完成！** ✅
```

#### 6.1 Cleanup

- Archive execution log to `.codebuddy/plan/archive/`
- Keep status file for audit
- Optionally delete sub-plan files (with user confirmation)

---

## Error Handling

### Sub-Plan Failure Scenarios

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

## Recovery Mechanism

### Resume from Interruption

```bash
# 恢复执行
/execute .codebuddy/plan/<master-plan>.md --resume

# 跳过失败的计划继续
/execute .codebuddy/plan/<master-plan>.md --skip-failed

# 重新执行某个子计划
/execute .codebuddy/plan/<sub-plan>.md

# 查看执行历史
/execute --history .codebuddy/plan/<master-plan>.md
```

---

## Key Rules

1. **Plan-Driven** — Follow plan steps, use agents for guidance
2. **Code Quality** — Write clean, maintainable, enterprise-grade code
3. **Minimal Changes** — Only modify necessary code, no side effects
4. **Mandatory Review** — Must perform code review after changes
5. **Trust Rules** — Backend follows backend-analyzer, Frontend follows frontend-analyzer
6. **Stop-Loss** — Do not proceed to next phase until current phase output is validated

---

## Usage

```bash
# Execute single plan file
/execute .codebuddy/plan/feature-name.md

# Execute master plan (batch execution)
/execute .codebuddy/plan/feature-name-master.md

# Resume interrupted execution
/execute .codebuddy/plan/feature-name-master.md --resume

# Skip failed plans and continue
/execute .codebuddy/plan/feature-name-master.md --skip-failed

# View execution history
/execute --history .codebuddy/plan/feature-name-master.md
```

---

## Relationship with /plan

1. `/plan` generates detailed plan (or master plan + sub-plans)
2. User confirms approval
3. `/execute` reads plan and implements (single or batch)
