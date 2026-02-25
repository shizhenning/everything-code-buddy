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
   - Plan file path (e.g., `.codebuddy/plan/xxx.md`)
   - Direct task description

2. **Read Plan Content**:
   - If plan file path provided, read and parse
   - Extract: task type, implementation steps, key files

3. **Pre-Execution Confirmation**:
   - If input is "direct task description": confirm with user first
   - If cannot confirm user approved plan: must confirm again

4. **Task Type Routing**:

   | Task Type | Detection | Route |
   |-----------|-----------|-------|
   | **Frontend** | Pages, components, UI, styles, layout | Frontend-focused |
   | **Backend** | API, interfaces, database, logic, algorithms | Backend-focused |
   | **Fullstack** | Contains both frontend and backend | Both agents |

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

After review passes, report to user:

```markdown
## Execution Complete

### Change Summary
| File | Operation | Description |
|------|-----------|-------------|
| path/to/file.ts | Modified | Description |

### Review Results
- Code Review: <Passed/Found N issues>

### Recommendations
1. [ ] <Suggested test steps>
2. [ ] <Suggested verification steps>
```

---

## Key Rules

1. **Plan-Driven** — Follow plan steps, use agents for guidance
2. **Code Quality** — Write clean, maintainable, enterprise-grade code
3. **Minimal Changes** — Only modify necessary code, no side effects
4. **Mandatory Review** — Must perform code review after changes
5. **Trust Rules** — Backend follows backend-analyzer, Frontend follows frontend-analyzer

---

## Usage

```bash
# Execute plan file
/execute .codebuddy/plan/feature-name.md

# Execute task directly
/execute implement user authentication
```

---

## Relationship with /plan

1. `/plan` generates detailed plan
2. User confirms approval
3. `/execute` reads plan and implements
