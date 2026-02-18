# Plan - Multi-Model Collaborative Planning

Multi-model collaborative planning - Context retrieval + Dual-model analysis → Generate step-by-step implementation plan.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use **English** when interacting with tools/models, communicate with user in their language
- **Hybrid Mode**: External models (Codex/Gemini)优先，不可用时使用 CodeBuddy native subagents
- **Code Sovereignty**: External models have **zero filesystem write access**, all modifications by Claude
- **Stop-Loss Mechanism**: Do not proceed to next phase until current phase output is validated
- **Planning Only**: This command allows reading context and writing to `${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/*` plan files, but **NEVER modify production code**

---

## Multi-Model Call Specification

**Call Syntax** (parallel: use `run_in_background: true`):

```
Bash({
  command: "${CODEBUDDY_PLUGIN_ROOT}/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement>
Context: <retrieved project context>
</TASK>
OUTPUT: Step-by-step implementation plan with pseudo-code. DO NOT modify any files.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Brief description"
})
```

**Model Parameter Notes**:
- `{{GEMINI_MODEL_FLAG}}`: When using `--backend gemini`, replace with `--gemini-model gemini-3-pro-preview` (note trailing space); use empty string for codex

**Role Prompts**:

| Phase | Codex | Gemini |
|-------|-------|--------|
| Analysis | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/codex/analyzer.md` | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/gemini/analyzer.md` |
| Planning | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/codex/architect.md` | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/gemini/architect.md` |

**Session Reuse**: Each call returns `SESSION_ID: xxx` (typically output by wrapper), **MUST save** for subsequent `/ccg:execute` use.

**Wait for Background Tasks** (max timeout 600000ms = 10 minutes):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**IMPORTANT**:
- Must specify `timeout: 600000`, otherwise default 30 seconds will cause premature timeout
- If still incomplete after 10 minutes, continue polling with `TaskOutput`, **NEVER kill the process**
- If waiting is skipped due to timeout, **MUST call `AskUserQuestion` to ask user whether to continue waiting or kill task**

---

## Execution Workflow

**Planning Task**: $ARGUMENTS

### Phase 1: Full Context Retrieval

`[Mode: Research]`

#### 1.1 Analyze Requirement

Parse the input requirement ($ARGUMENTS) and identify:
- Task type: Frontend, Backend, or Fullstack
- Key modules/features involved
- Technical domains (e.g., authentication, database, UI components)

#### 1.2 Context Retrieval (Native Tools)

**Use CodeBuddy native tools** - Glob, Grep, and Read:

1. **Discover project structure**:
   ```
   Glob({ pattern: "**/*.{js,ts,jsx,tsx,py,java,go,rs}" })
   ```
   - Identify main source directories
   - Find configuration files (package.json, requirements.txt, go.mod, etc.)

2. **Search relevant code patterns**:
   ```
   Grep({ pattern: "<keyword from requirement>", fileTypes: "<lang>" })
   ```
   - Search for related function names, class names, imports
   - Find existing implementations

3. **Read key files**:
   ```
   Read({ filePath: "<path/to/file>" })
   ```
   - Get complete definitions
   - Understand existing patterns

4. **Recursive retrieval** (if needed):
   - Follow import/dependency chains
   - Get function signatures and interfaces
   - Understand data flow

**IMPORTANT**:
- Prioritize entry files (main, index, app)
- Get function signatures and type definitions
- Build understanding of existing patterns
- Never assume - use tools to verify

#### 1.3 Completeness Check

- Must obtain **complete definitions and signatures** for relevant classes, functions, variables
- If context insufficient, continue with recursive retrieval
- Prioritize: entry file + line number + key symbol; add snippets only when necessary

#### 1.4 Requirement Alignment

- If requirements have ambiguity, output guiding questions for user
- Ensure requirement boundaries are clear (no omissions, no redundancy)

### Phase 2: Multi-Model Collaborative Analysis

`[Mode: Analysis]`

#### 2.1 Check External Model Availability

**First, check if `codeagent-wrapper` exists**:

```bash
Bash({
  command: "test -f \"${CODEBUDDY_PLUGIN_ROOT}/bin/codeagent-wrapper\" && echo \"AVAILABLE\" || echo \"NOT_AVAILABLE\"",
  requires_approval: false
})
```

- If output is "AVAILABLE" → Use External Models (Codex/Gemini)
- If output is "NOT_AVAILABLE" → Use CodeBuddy Native Subagents

#### 2.2A Distribute Inputs (External Models Mode)

**If codeagent-wrapper is available**, parallel call Codex and Gemini (`run_in_background: true`):

Distribute **original requirement** (without preset opinions) to both models:

1. **Codex Backend Analysis**:
   - ROLE_FILE: `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/codex/analyzer.md`
   - Focus: Technical feasibility, architecture impact, performance considerations, potential risks
   - OUTPUT: Multi-perspective solutions + pros/cons analysis

2. **Gemini Frontend Analysis**:
   - ROLE_FILE: `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/gemini/analyzer.md`
   - Focus: UI/UX impact, user experience, visual design
   - OUTPUT: Multi-perspective solutions + pros/cons analysis

Wait for both models' complete results with `TaskOutput`. **Save SESSION_ID** (`CODEX_SESSION` and `GEMINI_SESSION`).

#### 2.2B Distribute Inputs (Native Subagents Mode)

**If codeagent-wrapper is NOT available**, use CodeBuddy native subagents:

Parallel call architect and planner agents:

1. **Architecture Analysis**:
   ```
   Task({
     subagent_name: "architect",
     description: "Architecture analysis",
     prompt: "Analyze the following requirement for architecture impact, technical feasibility, and performance considerations:\n\n$ARGUMENTS\n\nContext:\n<retrieved project context>"
   })
   ```
   - Focus: Architecture design, technical decisions, risk assessment

2. **Planning Analysis**:
   ```
   Task({
     subagent_name: "planner",
     description: "Implementation planning",
     prompt: "Create detailed implementation plan for:\n\n$ARGUMENTS\n\nContext:\n<retrieved project context>"
   })
   ```
   - Focus: Step-by-step breakdown, dependencies, testing strategy

**Set SESSION_ID to "NATIVE_MODE"** for both models.

#### 2.2 Cross-Validation

Integrate perspectives and iterate for optimization:

1. **Identify consensus** (strong signal)
2. **Identify divergence** (needs weighing)
3. **Complementary strengths**: Backend logic follows Codex, Frontend design follows Gemini
4. **Logical reasoning**: Eliminate logical gaps in solutions

#### 2.3A Dual-Model Plan Draft (External Models Mode)

To reduce risk of omissions in Claude's synthesized plan, can parallel have both models output "plan drafts" (still **NOT allowed** to modify files):

1. **Codex Plan Draft** (Backend authority):
   - ROLE_FILE: `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/codex/architect.md`
   - OUTPUT: Step-by-step plan + pseudo-code (focus: data flow/edge cases/error handling/test strategy)

2. **Gemini Plan Draft** (Frontend authority):
   - ROLE_FILE: `${CODEBUDDY_PLUGIN_ROOT}/.ccg/prompts/gemini/architect.md`
   - OUTPUT: Step-by-step plan + pseudo-code (focus: information architecture/interaction/accessibility/visual consistency)

Wait for both models' complete results with `TaskOutput`, record key differences in their suggestions.

#### 2.3B Native Subagent Planning (Native Mode)

**Already received plans from architect and planner agents in Phase 2.2B**.

Review both plans and:
- Identify consensus between architect and planner
- Note any diverging recommendations
- Prioritize architect's architectural decisions
- Prioritize planner's implementation details

#### 2.4 Generate Implementation Plan (Claude Final Version)

Synthesize both analyses, generate **Step-by-step Implementation Plan**:

```markdown
## Implementation Plan: <Task Name>

### Execution Mode
- **Mode**: <EXTERNAL_MODE | NATIVE_MODE>
- **Backend Analysis**: <Codex | architect agent>
- **Frontend Analysis**: <Gemini | planner agent>

### Task Type
- [ ] Frontend (→ Gemini / planner)
- [ ] Backend (→ Codex / architect)
- [ ] Fullstack (→ Parallel / planner)

### Technical Solution
<Optimal solution synthesized from analysis>

### Implementation Steps
1. <Step 1> - Expected deliverable
2. <Step 2> - Expected deliverable
...

### Key Files
| File | Operation | Description |
|------|-----------|-------------|
| path/to/file.ts:L10-L50 | Modify | Description |

### Risks and Mitigation
| Risk | Mitigation |
|------|------------|

### SESSION_ID (for /multi-execute use)
- MODE: <EXTERNAL_MODE | NATIVE_MODE>
- CODEX_SESSION: <session_id | N/A>
- GEMINI_SESSION: <session_id | N/A>
```

### Phase 2 End: Plan Delivery (Not Execution)

**`/ccg:plan` responsibilities end here, MUST execute the following actions**:

1. Present complete implementation plan to user (including pseudo-code)
2. Save plan to `${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/<feature-name>.md` (extract feature name from requirement, e.g., `user-auth`, `payment-module`)
3. Output prompt in **bold text** (MUST use actual saved file path):

   ---
   **Plan generated and saved to `${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/actual-feature-name.md`**

   **Please review the plan above. You can:**
   - **Modify plan**: Tell me what needs adjustment, I'll update the plan
   - **Execute plan**: Copy the following command to a new session

   ```
   /ccg:execute ${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/actual-feature-name.md
   ```
   ---

   **NOTE**: The `actual-feature-name.md` above MUST be replaced with the actual saved filename!

5. **If NATIVE_MODE was used**, remind user:
   > **Note**: CodeBuddy native subagents were used for planning. External models (Codex/Gemini) were not available.

4. **Immediately terminate current response** (Stop here. No more tool calls.)

**ABSOLUTELY FORBIDDEN**:
- Ask user "Y/N" then auto-execute (execution is `/ccg:execute`'s responsibility)
- Any write operations to production code
- Automatically call `/ccg:execute` or any implementation actions
- Continue triggering model calls when user hasn't explicitly requested modifications

---

## Plan Saving

After planning completes, save plan to:

- **First planning**: `${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/<feature-name>.md`
- **Iteration versions**: `${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/<feature-name>-v2.md`, `${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/<feature-name>-v3.md`...

Plan file write should complete before presenting plan to user.

---

## Plan Modification Flow

If user requests plan modifications:

1. Adjust plan content based on user feedback
2. Update `${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/<feature-name>.md` file
3. Re-present modified plan
4. Prompt user to review or execute again

---

## Next Steps

After user approves, **manually** execute:

```bash
/ccg:execute ${CODEBUDDY_PROJECT_DIR}/.codebuddy/plan/<feature-name>.md
```

---

## Key Rules

1. **Plan only, no implementation** – This command does not execute any code changes
2. **No Y/N prompts** – Only present plan, let user decide next steps
3. **Hybrid Mode** – External models (Codex/Gemini)优先，fallback to native subagents
4. **Trust Rules** – Backend follows Codex/architect, Frontend follows Gemini/planner
5. **Zero Write Access** – External models and native subagents have no write access
6. **SESSION_ID Handoff** – Plan must include MODE and SESSION_ID for `/multi-execute` use
