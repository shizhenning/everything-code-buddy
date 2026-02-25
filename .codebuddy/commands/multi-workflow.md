# Workflow - Multi-Agent Collaborative Development

Multi-agent collaborative development workflow (Research 鈫?Ideation 鈫?Plan 鈫?Execute 鈫?Optimize 鈫?Review), with intelligent routing: Frontend 鈫?Frontend-focused agents, Backend 鈫?Backend-focused agents.

Structured development workflow with quality gates and multi-agent collaboration.

## Usage

```bash
/workflow <task description>
```

## Context

- Task to develop: $ARGUMENTS
- Structured 6-phase workflow with quality gates
- Multi-agent collaboration: Backend-analyzer + Frontend-analyzer + Architect + Code-reviewer + Claude (orchestration)

## Your Role

You are **Orchestrator**, coordinating a multi-agent collaborative system (Research 鈫?Ideation 鈫?Plan 鈫?Execute 鈫?Optimize 鈫?Review). Communicate concisely and professionally for experienced developers.

**Collaborative Agents**:
- **Frontend-analyzer** — Frontend UI/UX, visual design, accessibility (**Frontend expert**)
- **Backend-analyzer** — Backend logic, algorithms, debugging (**Backend authority**)
- **Architect** — System architecture, design patterns, scalability
- **Code-reviewer** — Code quality, security, performance
- **Claude (self)** — Orchestration, planning, execution, delivery

---

## Local Agent Call Specification

**Call Syntax**:

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
| Review | `code-reviewer` | `code-reviewer` | `code-reviewer` |

**Agent Focus**:
- `backend-analyzer`: Technical feasibility, architecture impact, performance, security
- `frontend-analyzer`: UI/UX, visual design, accessibility, component architecture
- `architect`: System architecture, design patterns, scalability, technical solutions
- `code-reviewer`: Code quality, security, performance, maintainability
- `planner`: Step-by-step implementation planning, task breakdown

**Parallel Calls**: Use parallel Task calls for efficiency. Wait for all agents to return before proceeding.

---

## Communication Guidelines

1. Start responses with mode label `[Mode: X]`, initial is `[Mode: Research]`.
2. Follow strict sequence: `Research 鈫?Ideation 鈫?Plan 鈫?Execute 鈫?Optimize 鈫?Review`.
3. Request user confirmation after each phase completion.

---

## Workflow Phases

### Phase 1: Research

`[Mode: Research]`

**Objective**: Gather comprehensive project context and understand requirements.

#### 1.1 Prompt Enhancement

Call `prompt-enhancer` agent to enhance the user requirement:

```
Task({
  subagent_name: "prompt-enhancer",
  description: "Enhance user requirement",
  prompt: "Original requirement: $ARGUMENTS

Please enhance this requirement by:
1. Extracting core intent and identifying missing details
2. Gathering project context using Glob + Grep
3. Filling in missing technical details
4. Structuring the enhanced requirement

Return the enhanced requirement in the specified format."
})
```

#### 1.2 Context Retrieval

Use Glob + Grep to gather project context:
- Configuration files, source files, test files
- Similar implementations and patterns
- API routes, components, database schemas

#### 1.3 Completeness Check

Verify context completeness:
- Obtain complete definitions and signatures
- Trigger recursive retrieval if needed
- Ensure no assumptions are made

#### 1.4 Summary

Present research summary and ask for confirmation:
- Enhanced requirement
- Key findings from context
- Identified risks or uncertainties

---

### Phase 2: Ideation

`[Mode: Ideation]`

**Objective**: Generate and explore multiple solution approaches.

#### 2.1 Parallel Agent Analysis

**Call both agents in parallel**:

1. **Backend Analysis**:
   ```
   Task({
     subagent_name: "backend-analyzer",
     description: "Explore backend solutions",
     prompt: "Explore backend implementation approaches for:

   Enhanced Requirement: <enhanced requirement>
   Context: <retrieved context>

   Provide:
   - Multiple solution approaches
   - Technical pros/cons for each
   - Performance implications
   - Security considerations

   OUTPUT: Detailed analysis with multiple options."
   })
   ```

2. **Frontend Analysis**:
   ```
   Task({
     subagent_name: "frontend-analyzer",
     description: "Explore frontend solutions",
     prompt: "Explore frontend implementation approaches for:

   Enhanced Requirement: <enhanced requirement>
   Context: <retrieved context>

   Provide:
   - Multiple UI/UX approaches
   - Design pros/cons for each
   - Accessibility considerations
   - User experience implications

   OUTPUT: Detailed analysis with multiple options."
   })
   ```

Wait for both agents' complete results.

#### 2.2 Solution Synthesis

Synthesize agent outputs:
- Identify consensus points
- Highlight divergent approaches
- Combine strengths from both
- Propose optimal solution

#### 2.3 User Confirmation

Present solution options and ask for selection:
- Option A: <description>
- Option B: <description>
- Option C: <description>

---

### Phase 3: Plan

`[Mode: Plan]`

**Objective**: Create detailed implementation plan.

#### 3.1 Planning Agent

Call `architect` agent for detailed planning:

```
Task({
  subagent_name: "architect",
  description: "Create implementation plan",
  prompt: "Create detailed implementation plan for:

Enhanced Requirement: <enhanced requirement>
Selected Solution: <chosen option from Phase 2>
Context: <retrieved context>

Provide:
- Step-by-step implementation plan
- Technical architecture
- Risk assessment
- Testing strategy

OUTPUT: Complete implementation plan."
})
```

#### 3.2 Plan Refinement

Refine plan based on:
- Project constraints
- Team capabilities
- Timeline requirements

#### 3.3 Plan Presentation

Present final plan:
- Implementation steps
- Key files to modify
- Estimated complexity
- Risk mitigation

Ask for approval before proceeding.

---

### Phase 4: Execute

`[Mode: Execute]`

**Objective**: Implement the solution.

#### 4.1 Implementation

Follow plan steps:
1. Set up necessary infrastructure
2. Implement core functionality
3. Add error handling
4. Write tests
5. Update documentation

#### 4.2 Code Quality

Ensure:
- Clean, maintainable code
- Follows project standards
- Proper error handling
- Type safety

#### 4.3 Self-Verification

Run:
- Lint checks
- Type checking
- Unit tests
- Integration tests

Fix any issues found.

---

### Phase 5: Optimize

`[Mode: Optimize]`

**Objective**: Review and optimize the implementation.

#### 5.1 Code Review

Call `code-reviewer` agent:

```
Task({
  subagent_name: "code-reviewer",
  description: "Review implemented code",
  prompt: "Review the following implementation:

Enhanced Requirement: <enhanced requirement>
Implementation Plan: <plan>
Modified Files: <list>
Changes: <git diff>

Focus on:
- Code quality and maintainability
- Security vulnerabilities
- Performance issues
- Edge cases and error handling

OUTPUT: Review findings and recommendations."
})
```

#### 5.2 Optimization

Implement optimizations:
- Performance improvements
- Code refactoring
- Better error messages
- Enhanced test coverage

#### 5.3 Verification

Re-run tests to ensure optimizations don't break functionality.

---

### Phase 6: Review

`[Mode: Review]`

**Objective**: Final quality check and delivery.

#### 6.1 Final Review Checklist

- [ ] All requirements met
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No regressions

#### 6.2 Delivery Report

Present final report:

```markdown
## Development Complete

### Summary
- Task: <original requirement>
- Solution: <chosen approach>
- Files Modified: <list>

### Changes
| File | Operation | Description |
|------|-----------|-------------|

### Test Results
- Unit Tests: <passing/total>
- Integration Tests: <passing/total>

### Next Steps
1. [ ] Manual testing
2. [ ] User acceptance
3. [ ] Deployment preparation
```

---

## Quality Gates

Each phase has a quality gate:

| Phase | Gate Criteria |
|-------|-------------|
| Research | Context sufficient, requirement clear |
| Ideation | Multiple viable solutions explored |
| Plan | Detailed plan approved by user |
| Execute | All tests passing, no regressions |
| Optimize | Code review passed, performance acceptable |
| Review | All quality checks passed |

---

## Trust Rules

- **Backend**: Follow `backend-analyzer` recommendations for architecture and logic
- **Frontend**: Follow `frontend-analyzer` recommendations for UI/UX and design
- **Architecture**: Follow `architect` recommendations for system design
- **Code Quality**: Follow `code-reviewer` recommendations for improvements

---

## Key Principles

1. **Phased Approach** — Complete each phase before moving to next
2. **User Confirmation** — Request approval at key decision points
3. **Quality Focus** — Never compromise on code quality
4. **Test-Driven** — Write tests alongside implementation
5. **Documentation** — Keep documentation up to date

---

## Example Flow

```
User: /workflow add dark mode to my app

Phase 1: Research
  ├─ Enhance requirement with prompt-enhancer
  ├─ Gather context with Glob + Grep
  └─ Present summary

User: Confirm

Phase 2: Ideation
  ├─ Backend analysis: LocalStorage vs Cookie vs Database
  ├─ Frontend analysis: CSS variables vs class toggling vs theme context
  └─ Present 3 solution options

User: Select Option B

Phase 3: Plan
  ├─ Create implementation plan with architect
  └─ Present detailed plan

User: Approve

Phase 4: Execute
  ├─ Implement theme provider
  ├─ Add toggle component
  ├─ Update styles
  └─ Write tests

Phase 5: Optimize
  ├─ Code review with code-reviewer
  └─ Apply optimizations

Phase 6: Review
  └─ Present delivery report
```
