# Plan - Multi-Model Collaborative Planning

Multi-model collaborative planning - Context retrieval + Dual-model analysis 鈫?Generate step-by-step implementation plan.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use **English** when interacting with tools/agents, communicate with user in their language
- **Mandatory Parallel**: Agent calls MUST use parallel Task tool calls to avoid blocking main thread
- **Code Sovereignty**: This command only generates plans, all modifications by implementation commands
- **Stop-Loss Mechanism**: Do not proceed to next phase until current phase output is validated
- **Planning Only**: This command allows reading context and writing to `.codebuddy/plan/*` plan files, but **NEVER modify production code**

---

## Local Agent Call Specification

**Call Syntax** (parallel: use Task tool):

```
Task({
  subagent_name: "<agent-name>",
  description: "<brief description>",
  prompt: "<task prompt with requirement and context>"
})
```

**Available Agents**:

| Phase | Backend | Frontend | General |
|-------|---------|----------|---------|
| Analysis | `backend-analyzer` | `frontend-analyzer` | `requirements-analyzer` |
| Planning | `architect` | `architect` | `planner` |

**Agent Focus**:
- `backend-analyzer`: Technical feasibility, architecture impact, performance considerations, potential risks
- `frontend-analyzer`: UI/UX impact, user experience, visual design, accessibility
- `architect`: System architecture, design patterns, scalability, technical solutions
- `planner`: Step-by-step implementation planning, task breakdown

**Wait for Agent Tasks**:

Task tool calls are synchronous by default. For multiple parallel agent calls, invoke all Task calls in the same message batch.

---

## Execution Workflow

**Planning Task**: $ARGUMENTS

### Phase 1: Full Context Retrieval

`[Mode: Research]`

#### 1.1 Prompt Enhancement (MUST execute first)

**MUST call `prompt-enhancer` agent**:

```
Task({
  subagent_name: "prompt-enhancer",
  description: "Enhance user requirement",
  prompt: "Original requirement: $ARGUMENTS

Please enhance this requirement by:
1. Extracting the core intent and identifying missing details
2. Gathering project context using Glob + Grep to find:
   - Similar features and implementations
   - Existing patterns and conventions
   - Configuration files, API routes, components
3. Filling in missing technical details (frameworks, database, APIs, UI/UX, error handling, testing, performance, security)
4. Structuring the enhanced requirement according to the output template

Return the enhanced requirement in the format specified in your prompt-enhancer agent definition."
})
```

Wait for enhanced prompt, **replace original $ARGUMENTS with enhanced result** for all subsequent phases.

**Fallback**: If prompt-enhancer agent unavailable, use simple enhancement:
1. Extract key terms and entities from $ARGUMENTS
2. Use Glob + Grep to find similar implementations and patterns
3. Add basic context (project type, tech stack from package.json)
4. Structure into: Overview, Context, Requirements, Success Criteria

#### 1.2 Context Retrieval

**Use Glob + Grep for file discovery**:

1. Use `Glob` to find relevant files:
   - Configuration files: `package.json`, `*.config.js`, `.env.*`
   - Source files matching patterns: `src/**/*`, `components/**/*`, `api/**/*`
   - Test files: `tests/**/*`, `**/*.test.js`

2. Use `Grep` to find key symbols and patterns:
   - Search for relevant function names, class names
   - Find similar feature implementations
   - Locate API routes, database schemas, component definitions

3. Use `Read` to gather complete context:
   - Read full file contents for key files
   - Extract relevant code snippets
   - Understand existing patterns and conventions

**IMPORTANT**:
- Build search queries based on the enhanced requirement
- **NEVER answer based on assumptions**
- Prioritize: entry file + line number + key symbol name
- Add minimal code snippets only when necessary to resolve ambiguity

#### 1.3 Completeness Check

- Must obtain **complete definitions and signatures** for relevant classes, functions, variables
- If context insufficient, trigger **recursive retrieval**
- Prioritize output: entry file + line number + key symbol name; add minimal code snippets only when necessary to resolve ambiguity

#### 1.4 Requirement Alignment

- If requirements still have ambiguity, **MUST** output guiding questions for user
- Until requirement boundaries are clear (no omissions, no redundancy)

### Phase 2: Multi-Model Collaborative Analysis

`[Mode: Analysis]`

#### 2.1 Distribute Inputs

**Parallel call** local agents (using `Task` tool):

Distribute **enhanced requirement** (from Phase 1.1) to both agents:

1. **Backend Analysis**:
   ```
   Task({
     subagent_name: "backend-analyzer",
     description: "Analyze backend requirements",
     prompt: "Please analyze the following requirement from a backend perspective:

   Requirement: <enhanced requirement>
   Context: <retrieved project context>

   Focus on:
   - Technical feasibility
   - Architecture impact
   - Performance considerations
   - Potential risks
   - API design (if applicable)
   - Database implications (if applicable)

   OUTPUT: Multi-perspective solutions + pros/cons analysis"
   })
   ```

2. **Frontend Analysis**:
   ```
   Task({
     subagent_name: "frontend-analyzer",
     description: "Analyze frontend requirements",
     prompt: "Please analyze the following requirement from a frontend perspective:

   Requirement: <enhanced requirement>
   Context: <retrieved project context>

   Focus on:
   - UI/UX impact
   - User experience
   - Visual design
   - Accessibility considerations
   - Responsive design
   - Component architecture

   OUTPUT: Multi-perspective solutions + pros/cons analysis"
   })
   ```

Wait for both agents' complete results.

#### 2.2 Cross-Validation

Integrate perspectives and iterate for optimization:

1. **Identify consensus** (strong signal)
2. **Identify divergence** (needs weighing)
3. **Complementary strengths**: Backend logic follows backend-analyzer, Frontend design follows frontend-analyzer
4. **Logical reasoning**: Eliminate logical gaps in solutions

#### 2.3 (Optional but Recommended) Dual-Agent Plan Draft

To reduce risk of omissions in Claude's synthesized plan, can parallel have both agents output "plan drafts" (still **NOT allowed** to modify files):

1. **Backend Plan Draft**:
   ```
   Task({
     subagent_name: "architect",
     description: "Draft backend implementation plan",
     prompt: "Please draft a step-by-step backend implementation plan for:

   Requirement: <enhanced requirement>
   Context: <retrieved project context>
   Backend Analysis: <result from 2.1>

   Focus on:
   - Data flow and architecture
   - Edge cases and error handling
   - Test strategy
   - Security considerations
   - Performance optimization

   OUTPUT: Step-by-step plan with pseudo-code. DO NOT modify any files."
   })
   ```

2. **Frontend Plan Draft**:
   ```
   Task({
     subagent_name: "architect",
     description: "Draft frontend implementation plan",
     prompt: "Please draft a step-by-step frontend implementation plan for:

   Requirement: <enhanced requirement>
   Context: <retrieved project context>
   Frontend Analysis: <result from 2.1>

   Focus on:
   - Information architecture
   - User interaction flows
   - Accessibility
   - Visual consistency
   - Responsive design

   OUTPUT: Step-by-step plan with pseudo-code. DO NOT modify any files."
   })
   ```

Wait for both agents' complete results, record key differences in their suggestions.

#### 2.4 Generate Implementation Plan (Claude Final Version)

Synthesize both analyses, generate **Step-by-step Implementation Plan**:

```markdown
## Implementation Plan: <Task Name>

### Task Type
- [ ] Frontend (→ Frontend-focused agents)
- [ ] Backend (→ Backend-focused agents)
- [ ] Fullstack (→ Both agents)

### Technical Solution
<Optimal solution synthesized from Backend + Frontend agent analysis>

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
```

### Phase 2 End: Plan Delivery (Not Execution)

**`/ccg:plan` responsibilities end here, MUST execute the following actions**:

1. Present complete implementation plan to user (including pseudo-code)
2. Save plan to `.codebuddy/plan/<feature-name>.md` (extract feature name from requirement, e.g., `user-auth`, `payment-module`)
3. Output prompt in **bold text** (MUST use actual saved file path):

   ---
   **Plan generated and saved to `.codebuddy/plan/actual-feature-name.md`**

   **Please review the plan above. You can:**
   - **Modify plan**: Tell me what needs adjustment, I'll update the plan
   - **Execute plan**: Copy the following command to a new session

   ```
   /plan .codebuddy/plan/actual-feature-name.md
   ```
   ---

   **NOTE**: The `actual-feature-name.md` above MUST be replaced with the actual saved filename!

4. **Immediately terminate current response** (Stop here. No more tool calls.)

**ABSOLUTELY FORBIDDEN**:
- Ask user "Y/N" then auto-execute (execution is separate command's responsibility)
- Any write operations to production code
- Automatically call execution commands or any implementation actions
- Continue triggering agent calls when user hasn't explicitly requested modifications

---

## Plan Saving

After planning completes, save plan to:

- **First planning**: `.codebuddy/plan/<feature-name>.md`
- **Iteration versions**: `.codebuddy/plan/<feature-name>-v2.md`, `.codebuddy/plan/<feature-name>-v3.md`...

Plan file write should complete before presenting plan to user.

---

## Plan Modification Flow

If user requests plan modifications:

1. Adjust plan content based on user feedback
2. Update `.codebuddy/plan/<feature-name>.md` file
3. Re-present modified plan
4. Prompt user to review or execute again

---

## Next Steps

After user approves, **manually** execute:

```bash
/ccg:execute .codebuddy/plan/<feature-name>.md
```

---

## Key Rules

1. **Plan only, no implementation** — This command does not execute any code changes
2. **No Y/N prompts** — Only present plan, let user decide next steps
3. **Trust Rules** — Backend logic follows backend-analyzer, Frontend design follows frontend-analyzer
4. This command only generates plans, all modifications by implementation commands
5. Use local agents only - no external model dependencies
