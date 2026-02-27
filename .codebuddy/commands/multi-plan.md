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

`[Mode: Prepare]`

**Step 1: Identify Input Type**

First, analyze the input to determine the requirement type:

| Input Type | Pattern | Processing Strategy |
|------------|---------|-------------------|
| **Brief** | Simple text (<500 words) | Standard enhancement via prompt-enhancer |
| **Document** | File path (.md/.docx/.pdf) OR large text (>2000 words) | Document parsing + requirement extraction |
| **Structured** | Document with chapters/sections | Document structuring + module splitting |

**Step 2: Call Appropriate Enhancement Strategy**

**If inputType === "brief" or "unstructured"**:
- Call `prompt-enhancer` agent with standard enhancement (existing logic):

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

**If inputType === "document" or "structured"**:
- Call `prompt-enhancer` agent with special instructions for document parsing:

```
Task({
  subagent_name: "prompt-enhancer",
  description: "Parse and enhance large requirement document",
  prompt: "Original requirement document: $ARGUMENTS

Please identify this is a large requirement document and execute the following:

1. **Parse Document Structure** - Identify chapters, modules, and features
2. **Extract Core Requirements** - Functional, technical, and non-functional requirements
3. **Group Requirements** - By modules, priority (P0/P1/P2), and tech stack
4. **Identify Dependencies** - Dependencies between features
5. **Generate Summary** - Overall overview, module list, key requirements

OUTPUT must include these additional sections:

## Document Analysis
- Document Type: <PRD/FDD/User Story>
- Module Count: <N>
- Estimated Scope: <Small/Medium/Large>

## Functional Modules
1. <Module 1>: <Brief description>
2. <Module 2>: <Brief description>
...

## Dependency Graph
<Module dependency relationship diagram>"
})
```

**Step 3: Process Enhanced Output**

- If output contains **Functional Modules** sections, mark as "potential split needed"
- Pass this information to Phase 2.5 (Plan Scale Assessment) for reference

Wait for enhanced output, **replace original $ARGUMENTS with enhanced result** for all subsequent phases.

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

#### 1.5 Context Optimization & Compression (NEW)

`[Mode: Optimize]`

**Context Size Estimation**:

1. **Token Estimation Rules**:
   - English: 1 token ≈ 0.75 words
   - Chinese: 1 token ≈ 1.5 characters
   - Code: 1 token ≈ 4 characters

2. **Calculate Total Size**:
   ```
   total_tokens = enhanced_requirement_tokens + sum(file_tokens)

   enhanced_requirement_tokens:
   - Count words/characters in Phase 1.1 output

   file_tokens:
   - For each file: lines × avg_tokens_per_line
   - Code: ~10 tokens/line
   - Markdown: ~15 tokens/line
   - JSON: ~8 tokens/line
   ```

3. **Decision Thresholds**:
   - < 20K tokens: No compression needed (skip to Phase 2)
   - 20K - 30K tokens: Light compression (summarize files >300 lines)
   - 30K - 50K tokens: Medium compression + modular routing in Phase 2
   - > 50K tokens: Aggressive compression + mandatory modular routing in Phase 2

**File Relevance Scoring**:

**Scoring Factors**:
| Factor | Weight | Example |
|--------|--------|---------|
| Keyword match count | 30% | "auth" in authentication feature |
| Dependency depth | 25% | Direct imports > indirect |
| File type match | 20% | Component for frontend feature |
| Recent modification | 10% | git log recency |
| File size (penalty) | 15% | Smaller files favored |

**Scoring Algorithm**:
```
relevance_score = (
  keyword_match_count × 0.30 +
  (1 / dependency_depth) × 0.25 +
  file_type_match × 0.20 +
  recency_score × 0.10 +
  (1 / log(file_size)) × 0.15
)

dependency_depth:
  1 = directly related (e.g., component for UI feature)
  2 = one level removed (e.g., utility used by component)
  3+ = indirect (e.g., base classes, shared utilities)
```

**Ranking and Classification**:
- **Critical Priority** (Top 5-10 files): Keep full content
- **High Priority** (Files 11-20): Summarize key parts
- **Medium Priority** (Files 21-30): Brief summary only
- **Low Priority** (Files >30): Reference only (file path + purpose)

**Large File Summarization**:

**Trigger**: Files with >200 lines

**Summarization Template**:
```markdown
### File: src/auth/authentication.ts (245 lines → summarized)

**Purpose**: User authentication and session management

**Key Exports**:
```typescript
export class AuthenticationService {
  login(credentials: LoginRequest): Promise<AuthResponse>
  logout(): Promise<void>
  refreshSession(): Promise<AuthResponse>
  validateToken(token: string): boolean
}
```

**Dependencies**:
- `./session-manager.ts` - Session storage
- `./crypto.ts` - Token generation/validation
- `@external/jwt` - JWT library

**Key Patterns**:
- Uses decorator-based permission checking (@RequireAuth)
- Implements token refresh rotation
- Centralized error handling

**Relevance to Current Task**: High - Directly implements authentication flow
```

**Implementation Notes**:
- Use code-explorer subagent to extract structure
- Preserve function/class signatures
- Keep imports/exports for context understanding
- Highlight patterns relevant to current requirement

**Final Context Structure**:

Output the optimized context in hierarchical format:

```markdown
## Context Summary

### Phase 1: Enhanced Requirement
<Full enhanced requirement from Phase 1.1>

### Phase 2: Project Context

#### High Priority Context (Full Content)
| File | Lines | Purpose |
|------|-------|---------|
| src/auth.ts | 120 | Authentication core |
| components/Login.tsx | 80 | Login UI component |

**Full Content**:
<Complete file contents for high-priority files>

#### Medium Priority Context (Summarized)
| File | Original Lines | Summary |
|------|----------------|---------|
| src/utils/validation.ts | 250 | [Summarized content] |
| api/routes.ts | 180 | [Summarized content] |

#### Low Priority Context (Reference)
| File | Relevance | Note |
|------|-----------|------|
| package.json | 70% | Dependencies available on demand |
| tests/auth.test.ts | 60% | Test patterns can be loaded via code-explorer |
```

**IMPORTANT**:
- Replace the original context with this optimized structure
- Pass this to Phase 2.0 for routing decision
- Total estimated tokens must be included in summary
- If total tokens still exceed target, reduce High Priority count (keep top 5-7)

### Phase 2: Multi-Model Collaborative Analysis

`[Mode: Analysis]`

#### 2.0 Agent Routing Decision (NEW)

`[Mode: Route]`

**Check Context Size from Phase 1.5**:

```
IF total_context_tokens < 30K THEN
    → Use Standard Parallel Calls (Phase 2.1 existing logic)
ELSE IF document_analysis_available AND module_count > 1 THEN
    → Use Modular Batch Calls (Phase 2.1 Enhanced)
ELSE
    → Use Hybrid Calls (Standard + Lazy Loading, Phase 2.1 Alternative)
END IF
```

**Execution Strategy Selection Table**:

| Context Size | Document Analysis | Module Count | Strategy |
|--------------|-------------------|--------------|----------|
| < 30K tokens | N/A | N/A | Standard Parallel Calls (Phase 2.1) |
| 30K - 50K tokens | Available | > 1 | Modular Batch Calls (Phase 2.1 Enhanced) |
| 30K - 50K tokens | Not Available | N/A | Hybrid + Lazy Loading (Phase 2.1 Alternative) |
| > 50K tokens | Any | N/A | Mandatory Modular Batch Calls (Phase 2.1 Enhanced) |

**IMPORTANT**:
- Follow the routing decision strictly based on context size
- Document analysis availability determined in Phase 1.1 (check for "Functional Modules" section)
- Module count available from Phase 1.1 output

#### 2.1 Distribute Inputs

**Use the strategy selected in Phase 2.0**:

---

**Strategy A: Standard Parallel Calls** (for total_context_tokens < 30K)

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

---

**Strategy B: Modular Batch Calls** (for total_context_tokens >= 30K + document analysis available)

**FOR EACH functional_module IN document_analysis.modules**:

```
1. Extract module-specific context:
   - Module requirements
   - Related files (from prioritized list in Phase 1.5)
   - Module dependencies

2. Call agents for this module:
   PARALLEL(
     Task({
       subagent_name: "backend-analyzer",
       description: "Analyze <module_name> backend requirements",
       prompt: "Please analyze the following module from a backend perspective:

   Module: <module_name>
   Description: <module_description>
   Requirements: <module_requirements>
   Dependencies: <module_dependencies>
   Context: <module_specific_context>

   Focus on:
   - Technical feasibility
   - Architecture impact
   - Performance considerations
   - Potential risks
   - API design (if applicable)
   - Database implications (if applicable)

   OUTPUT: Multi-perspective solutions + pros/cons analysis for this module"
     }),
     Task({
       subagent_name: "frontend-analyzer",
       description: "Analyze <module_name> frontend requirements",
       prompt: "Please analyze the following module from a frontend perspective:

   Module: <module_name>
   Description: <module_description>
   Requirements: <module_requirements>
   Dependencies: <module_dependencies>
   Context: <module_specific_context>

   Focus on:
   - UI/UX impact
   - User experience
   - Visual design
   - Accessibility considerations
   - Responsive design
   - Component architecture

   OUTPUT: Multi-perspective solutions + pros/cons analysis for this module"
     })
   )

3. Store module analysis result
END FOR
```

**Module-Specific Context Extraction Logic**:

```
function extractModuleContext(module, prioritizedFiles) {
  const moduleContext = {
    requirements: module.requirements,
    dependencies: module.dependencies,
    files: []
  };

  // Match files to module based on:
  // - Keyword similarity (module.name vs file.path)
  // - Dependency graph (files used by module)
  // - Relevance score from Phase 1.5

  for (const file of prioritizedFiles) {
    const relevance = calculateModuleRelevance(module, file);
    if (relevance > 0.6) {
      moduleContext.files.push({
        path: file.path,
        content: file.content, // Full or summarized based on priority
        relevance: relevance
      });
    }
  }

  return moduleContext;
}

calculateModuleRelevance(module, file):
  - Exact keyword match: +0.8
  - Partial keyword match: +0.5
  - File in dependency chain: +0.6
  - File type match (component for UI, api for backend): +0.4
  - Adjust by Phase 1.5 relevance score (weighted average)
```

**Wait for all module analyses** before proceeding to Phase 2.2 Enhanced.

---

**Strategy C: Hybrid + Lazy Loading** (for total_context_tokens >= 30K + no document analysis)

**Initial Agent Call** (with high-priority context only):

```
Task({
  subagent_name: "backend-analyzer",
  description: "Analyze backend requirements",
  prompt: "Please analyze the following requirement from a backend perspective:

Requirement: <enhanced requirement>

High Priority Context:
<Full content of high-priority files from Phase 1.5>

Additional Context Available:
- Medium priority files: N files (summarized)
- Low priority files: M files (reference only)

If you need more details about specific files, use the code-explorer subagent:
Task({
  subagent_name: "code-explorer",
  description: "Get detailed file context",
  prompt: "Retrieve full content and analysis for: <file_path>
   Include: file structure, key functions/classes, dependencies, patterns"
})

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

**Repeat for frontend-analyzer** with same lazy loading pattern.

**Lazy Loading Benefits**:
- Reduces initial token payload by 40-60%
- Allows agent to request relevant context on-demand
- Maintains flexibility for complex scenarios

**IMPORTANT**:
- Track cumulative tokens across lazy loads
- Set hard limit: total tokens < 60K
- If limit reached, summarize lazy-loaded responses

---

#### 2.2 Cross-Validation (Enhanced)

**Standard Cross-Validation** (for Strategy A and C):

Integrate perspectives and iterate for optimization:

1. **Identify consensus** (strong signal)
2. **Identify divergence** (needs weighing)
3. **Complementary strengths**: Backend logic follows backend-analyzer, Frontend design follows frontend-analyzer
4. **Logical reasoning**: Eliminate logical gaps in solutions

**Enhanced Cross-Validation for Modular Batch Calls** (Strategy B):

1. **Cross-Module Consistency Check**:
   - Identify conflicting solutions between modules
   - Detect shared dependencies (common patterns, utilities)
   - Verify dependency graph alignment from Phase 1.1

2. **Integration Points Identification**:
   - Module A's output → Module B's input
   - Shared data models
   - Common UI components
   - API contracts between modules

3. **Architectural Coherence**:
   - Ensure consistent tech stack across modules
   - Validate data flow alignment
   - Check for overlapping responsibilities

4. **Generate Integrated Analysis**:
   - Combine module-specific perspectives
   - Add integration considerations
   - Optimize execution order using dependency graph

**Output Format for Enhanced Validation**:

```markdown
## Integrated Analysis

### Module-wise Perspectives
1. Module A: <backend-analyzer + frontend-analyzer results>
2. Module B: <backend-analyzer + frontend-analyzer results>
...

### Cross-Module Integration
- Shared dependencies: <list>
- Integration points: <list>
- Dependency flow: <diagram>

### Architectural Coherence
✓ Tech stack consistency: <confirmed/needs adjustment>
✓ Data flow alignment: <confirmed/needs adjustment>
⚠️ Conflicts to resolve: <list>
```

#### 2.3 (Optional but Recommended) Dual-Agent Plan Draft

**For Standard Parallel Calls (Strategy A/C)**:

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

**For Modular Batch Calls (Strategy B)**:

Skip this phase - plan drafts are already generated per module in Phase 2.1.

---

#### 2.5 Plan Scale Assessment (NEW)

**Enhanced Assessment with Document Analysis** (when available):

If Phase 1.1 identified the input as a large document and returned **Functional Modules**:

1. **Use Document Analysis Results**:
   - Check if Document Analysis indicates **"Recommended Split: Yes"**
   - Review the **Module Count** from document analysis
   - Examine the **Dependency Graph** for natural split points

2. **Document-Based Decision**:
   - Large documents (>2000 words, Module Count > 3) → **Recommend split**
   - Use functional modules as natural split boundaries
   - Dependency graph provides execution order

**Standard Scale Assessment** (when no document analysis):

**Evaluation Criteria**:

| Metric | Suggest Split | Force Split |
|--------|--------------|-------------|
| Steps | > 7 | > 10 |
| Files | > 15 | > 20 |
| Estimated Time | > 4h | > 8h |
| Functional Modules | Multiple | Multiple |
| Tech Stacks Involved | Frontend+Backend+DB | Any |

**Decision Logic**:

- **No split needed**: All metrics below "Suggest Split" thresholds
- **Suggest split**: Any metric reaches "Suggest Split" threshold
- **Force split**: Any metric reaches "Force Split" threshold

**If splitting is needed**, skip to **Phase 2.6: Plan Splitting**

**If no splitting needed**, proceed to **Phase 2.7: Generate Single Plan**

---

#### 2.6 Plan Splitting (NEW - when triggered)

`[Mode: Split]`

When plan scale assessment indicates splitting is needed:

##### 2.6.1 Choose Splitting Strategy

Analyze the plan characteristics and choose the most appropriate strategy:

**If Document Analysis Available (from Phase 1.1)**:

Prioritize using document's **Functional Modules** and **Dependency Graph**:

| Strategy | When to Use | Key Indicator |
|----------|-------------|---------------|
| **By Functional Module** | Document provides module list | Use Functional Modules directly |
| **By Document Structure** | Document has clear chapters | Align with document chapters |
| **By Dependency Graph** | Document provides dependencies | Use Dependency Graph for order |
| **By Priority** | Document indicates priorities | Use P0/P1/P2 from document |

**Standard Strategy Selection (no document analysis)**:

| Strategy | When to Use | Key Indicator |
|----------|-------------|---------------|
| **By Functional Module** | Multiple independent features | "Implement A, B, C, D" |
| **By Tech Stack** | Large frontend & backend work | "UI + API" |
| **By Dependencies** | Features have clear order | "A depends on B" |
| **By Priority** | Features have different priorities | "Core (P0), Enhancement (P1)" |

##### 2.6.2 Generate Master Plan

Create a master plan file: `.codebuddy/plan/<feature-name>-master.md`

```markdown
## 总计划：<Feature Name>

### 子计划列表

1. **计划1: <Module 1 Name>** (`<module-1-slug>`)
   - 优先级: <P0/P1/P2/P3>
   - 依赖: <none or list>
   - 预计耗时: <X hours>

2. **计划2: <Module 2 Name>** (`<module-2-slug>`)
   - 优先级: <P0/P1/P2/P3>
   - 依赖: <none or list>
   - 预计耗时: <X hours>

...

### 执行顺序
<Dependency graph or execution sequence>

### 总耗时
<Estimated total time (considering parallel execution)>
```

##### 2.6.3 Generate Sub-Plans

For each sub-plan, generate a detailed plan file:

`.codebuddy/plan/<module-slug>.md`

Each sub-plan must include:

```markdown
## 子计划：<Module Name>

### 概述
<Brief description of this module>

### 任务类型
- [x] Backend / Frontend / Fullstack

### 实施步骤
1. <Step 1> - Expected deliverable
2. <Step 2> - Expected deliverable
...

### 关键文件
| File | Operation | Description |
|------|-----------|-------------|
| path/to/file.ts | Create/Modify | Description |

### 风险和缓解
| Risk | Mitigation |
|------|------------|

### 依赖
<List of dependencies (or "无")>

### 后续依赖
<List of plans that depend on this one>
```

##### 2.6.4 OpenSpec Link Validation (NEW - for --openspec mode)

`[Mode: Validate]`

If the `--openspec` flag was provided:

1. **Detect if linking to existing OpenSpec changes**:
   - Check if any sub-plans link to existing OpenSpec changes
   - Look for `关联 OpenSpec 变更` references in sub-plans

2. **Validate OpenSpec linkages** (if any found):
   ```bash
   # For each sub-plan with OpenSpec linkage:
   for subplan in .codebuddy/plan/*.md; do
     if grep -q "关联 OpenSpec 变更" "$subplan"; then
       node .codebuddy/scripts/validate-plan-links.js "$subplan"
     fi
   done
   ```

3. **Report linkage status**:
   - List all sub-plans with OpenSpec linkages
   - Show validation results (pass/fail)
   - Note any missing or broken links

4. **For new plans without OpenSpec linkages**:
   - Skip validation
   - Phase 4.5 will create new OpenSpec changes later

---

**Important Requirements for Sub-Plans**:
- Each sub-plan should be 3-7 steps
- Estimated 2-4 hours to complete
- Must be independently testable
- Clear dependencies declared

##### 2.6.4 Present Split Plan to User

```markdown
# 计划拆分完成

## 总览
原始需求规模较大，已拆分为 <N> 个子计划。

## 总计划文件
`.codebuddy/plan/<feature-name>-master.md`

## 子计划列表
<Numbered list of sub-plans with file paths>

## 执行顺序
<Clear execution sequence with parallel options>

## 下一步
- **查看总计划**: `/plan .codebuddy/plan/<feature-name>-master.md`
- **执行子计划1**: `/execute .codebuddy/plan/<module-1-slug>.md`
```

**Save all plans** before presenting to user.

**Then terminate response** (do not proceed to execution).

---

#### 2.7 Generate Implementation Plan (single plan - when no splitting needed)

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

#### 2.8 Task Refinement (Enhanced for OpenSpec) (NEW)

`[Mode: Refine]`

**For OpenSpec Mode (--openspec flag)**:

If the `--openspec` flag is provided, task refinement is REQUIRED to generate granular tasks for `tasks.md`:

1. **Call task-refiner agent**:
   ```
   Task({
     subagent_name: "task-refiner",
     description: "Refine implementation tasks for OpenSpec",
     prompt: "Please refine the following implementation plan into granular tasks:

   Plan Name: ${PLAN_NAME}
   
   Implementation Steps:
   <The implementation steps from Phase 2.7>
   
   Technical Solution:
   <The technical solution from Phase 2.7>
   
   Requirements:
   - Generate tasks that are 3-10 minutes each
   - Each task must have clear acceptance criteria
   - Mark dependencies between tasks
   - Assign priorities (P0, P1, P2, P3)
   - Specify exact file paths for all operations
   - Make tasks independently executable
   
   Output format: Use the task-refiner's standard format with checkboxes."
   })
   ```

2. **Wait for refined tasks**: The task-refiner will return a detailed task list with checkboxes

3. **Store refined tasks** for use in Phase 4.5 (when creating OpenSpec artifacts)

**For Standard Mode**:

Task refinement is OPTIONAL but RECOMMENDED for complex plans:

- If plan has >7 steps → Call task-refiner
- If plan has estimated time >4 hours → Call task-refiner
- Otherwise → Skip task refinement

---

### Phase 2 End: Plan Delivery (Not Execution)

**`/ccg:plan` responsibilities end here, MUST execute the following actions**:

**For Single Plan (no splitting)**:

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

**For Split Plan (master + sub-plans)**:

1. Present master plan and sub-plans summary to user
2. Save master plan to `.codebuddy/plan/<feature-name>-master.md`
3. Save all sub-plans to `.codebuddy/plan/<module-slug>.md`
4. Output prompt in **bold text**:

   ---
   **Plan split and saved. Master plan: `.codebuddy/plan/actual-feature-name-master.md`**

   **Sub-plans generated:**
   - Plan 1: `.codebuddy/plan/module-1.md`
   - Plan 2: `.codebuddy/plan/module-2.md`
   ...

   **Next steps:**
   - **Review master plan**: Check execution order and dependencies
   - **Execute sub-plans**: Run in the specified order, or use batch execution

   ```
   /execute .codebuddy/plan/actual-feature-name-master.md
   ```
   ---

4. **Immediately terminate current response** (Stop here. No more tool calls.)

**ABSOLUTELY FORBIDDEN**:
- Ask user "Y/N" then auto-execute (execution is separate command's responsibility)
- Any write operations to production code
- Automatically call execution commands or any implementation actions
- Continue triggering agent calls when user hasn't explicitly requested modifications

---

### Phase 4.5: OpenSpec 集成与链接创建 (可选)

`[Mode: Integrate & Link]`

如果用户传递 `--openspec` 标志:

1. **检测是否需要创建OpenSpec变更**:
   - 检查 `openspec/changes/` 目录是否存在
   - 检查 `openspec` CLI 是否可用
   - 如果环境未初始化,提示用户先运行 `openspec init` 或跳过此步骤

2. **获取细化后的任务列表**:
   - 使用Phase 2.8中task-refiner生成的任务列表
   - 如果Phase 2.8未执行,调用task-refiner now

3. **创建OpenSpec目录结构**:
   ```bash
   CHANGE_NAME="${PLAN_FILE%.md}"
   mkdir -p "openspec/changes/${CHANGE_NAME}/specs"
   ```

4. **生成OpenSpec工件**:
   - **proposal.md**: 从计划的目标和范围生成
     - 包含变更概述、目标、范围、验收标准
     - 添加后向引用到计划文件
   
   - **specs/**: 创建详细的规格文件
     - 根据技术方案分解为多个规格文件
     - 每个规格文件专注于特定功能模块
   
   - **design.md**: 从技术方案生成
     - 包含架构决策、技术选型、设计模式
     - API设计、数据模型、关键算法
   
   - **tasks.md**: 使用task-refiner生成的任务列表
     - 包含所有细化后的任务(3-10分钟/任务)
     - 格式化为checkbox列表
     - 包含任务优先级和依赖关系

5. **建立双向链接** (使用 openspec-link-creator.js):
   ```bash
   node .codebuddy/scripts/openspec-link-creator.js create \
     .codebuddy/plan/${PLAN_FILE} \
     openspec/changes/${CHANGE_NAME}
   ```
   
   这将自动:
   - 在计划文件中添加前向引用 (Plan → OpenSpec)
   - 在proposal.md中添加后向引用 (Proposal → Plan)
   - 创建 .plan-mapping.md 映射表

6. **验证链接**:
   ```bash
   node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/${PLAN_FILE}
   ```
   - 确认前向引用、后向引用、映射表都存在
   - 确认所有工件文件都已创建

7. **输出完成信息**:
   ```
   ✓ OpenSpec 集成完成
   ✓ 链接已建立: .codebuddy/plan/${PLAN_FILE} ↔ openspec/changes/${CHANGE_NAME}
   ✓ 映射表已创建: openspec/changes/${CHANGE_NAME}/.plan-mapping.md
   
   📊 任务统计:
   - 总任务数: N 个
   - P0任务: X 个 (关键路径)
   - P1任务: Y 个 (重要)
   - P2任务: Z 个 (增强)
   - P3任务: W 个 (可选)
   - 预计总时间: X小时Y分钟
   
   下一步:
   - 运行 /multi-execute .codebuddy/plan/${PLAN_FILE} (会自动检测 OpenSpec)
   - 或运行 /opsx:continue ${CHANGE_NAME} 完善工件
   ```

8. **可选: 质量评估**:
   - 运行质量评估以确定是否可以执行:
   ```bash
   # 参考 .codebuddy/docs/openspec-quality-decision-matrix.md
   node .codebuddy/scripts/openspec-quality-assessment.js ${CHANGE_NAME}
   ```
   - 综合得分 ≥80 批准执行
   - 70-79 需要改进
   - <70 需要重新规划

---

## Plan Saving

After planning completes:

1. **Ask user**: "Save plan to `.codebuddy/plan/<feature-name>.md`? (yes/no)"
2. If user says "yes":
   - Save plan to `.codebuddy/plan/<feature-name>.md`
   - Plan file write should complete before presenting plan to user
3. If user says "no":
   - Present plan to user in terminal only
   - Do not save to file

**Note**: This command does NOT execute any code changes, only saves plans.

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
