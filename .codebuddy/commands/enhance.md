---
description: 需求增强命令 - 将简短需求转换为详细可执行的开发需求，支持完整性分析和提示词增强
---

# Prompt Enhance - 需求增强

将简短、模糊的用户需求转换为详细、具体、可执行的开发需求。

$ARGUMENTS

---

## Execution Workflow

**Target Requirement**: $ARGUMENTS

### Phase 1: Requirements Analysis

`[Mode: Analysis]`

**Call `requirements-analyzer` agent**:

```
Task({
  subagent_name: "requirements-analyzer",
  description: "Analyze requirement completeness",
  prompt: "Please analyze the following requirement for completeness and provide a detailed assessment:

Requirement: $ARGUMENTS

Use your evaluation framework to:
1. Score each category (0-3 for functional completeness, 0-2 for technical specificity, UX/UI clarity, non-functional requirements, and 0-1 for implementation constraints)
2. Identify missing information and gaps
3. Provide clarifying questions if needed
4. Give actionable recommendations

Return the complete Requirements Analysis Report with scores, gaps, and recommendations."
})
```

Wait for analysis report.

### Phase 2: Enhancement Decision

**Based on the total score**:

- **Score >= 7**: The requirement is sufficiently detailed. Present the original requirement with minor clarifications.
- **Score < 7**: The requirement needs enhancement. Proceed to Phase 3.

### Phase 3: Prompt Enhancement (if needed)

`[Mode: Enhancement]`

**Call `prompt-enhancer` agent**:

```
Task({
  subagent_name: "prompt-enhancer",
  description: "Enhance requirement details",
  prompt: "Original requirement: $ARGUMENTS

Requirements Analysis Report:
[Insert the analysis report from Phase 1 here]

Please enhance this requirement based on the gaps identified in the analysis. Use your enhancement process to:
1. Expand the requirement to address missing functional and technical details
2. Enrich with project context from the codebase
3. Structure the enhanced requirement according to your output template

Return the complete enhanced requirement with all sections filled out."
})
```

### Phase 4: Result Presentation

**Present the results** to the user in the following format:

```markdown
# Requirement Enhancement Result

## Original Request
$ARGUMENTS

## Requirements Analysis
[Insert analysis report from Phase 1]

## Enhanced Requirement
[If score >= 7, present original requirement]
[If score < 7, present enhanced requirement from Phase 3]

## Next Steps
- Review the enhanced requirement above
- If satisfied, use it for planning: `/plan <enhanced requirement>`
- If not satisfied, provide feedback for further refinement
```

---

## Enhancement Guidelines

The enhancement process focuses on:

1. **Functional Completeness**: Core features, user stories, edge cases
2. **Technical Specificity**: Tech stack, performance requirements, integration points
3. **UX/UI Clarity**: Interface requirements, user flows
4. **Non-Functional Requirements**: Security, scalability, performance
5. **Implementation Constraints**: Timeline, resources, dependencies

---

## Example

**Input**: `/enhance add dark mode to my app`

**Phase 1 Output** (Analysis):
```
Total Score: 4/10
- Functional Completeness: 1/3 (missing specific features)
- Technical Specificity: 1/2 (missing framework info)
- UX/UI Clarity: 1/2 (missing UI specifics)
- Non-Functional Requirements: 0/2 (missing performance/security)
- Implementation Constraints: 1/1 (reasonable)

Missing Information:
- What framework? (React, Vue, Angular?)
- Should it persist user preference?
- System preference detection?
- Accessibility requirements?
```

**Phase 3 Output** (Enhanced):
```
# Enhanced Requirement: Dark Mode Feature

## Original Request
"add dark mode to my app"

## Context
- Project Type: React Web Application
- Technology Stack: React, Tailwind CSS, TypeScript
- Related Files: src/components/Layout.tsx
- Existing Patterns: Theme provider pattern

## Detailed Requirements
[Complete detailed requirements...]
```

---

## When to Use

Use this command when:
- User provides very brief requirements ("add login", "optimize queries")
- Requirements are vague or ambiguous
- Missing technical details (frameworks, database, APIs)
- Before passing to `/plan` or `/tdd` workflows
- Need to ensure requirement completeness before implementation
