# Frontend - Hybrid Frontend Development

Multi-mode frontend development: Gemini (if available) or frontend-patterns skill.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use English when interacting with tools/models
- **Hybrid Mode**: Auto-detect available capabilities and use optimal approach
- **Fallback Strategy**: External unavailable → frontend-patterns skill
- **Code Sovereignty**: All production code modifications by CodeBuddy only

---

## Configuration Check

```bash
node scripts/multi-mode-selector.js
```

---

## Workflow

### Phase 1: Context Retrieval

Use appropriate tools to gather context:
- `search_content` - Find UI patterns and components
- `read_file` - Understand existing styles and design system
- `list_files` - Explore frontend structure

### Phase 2: Design Planning

**If External Mode (Gemini) Available:**

```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend gemini --gemini-model gemini-3-pro-preview \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/gemini/architect.md
<TASK>
Requirement: $ARGUMENTS
Context: <gathered context>
</TASK>
OUTPUT: Component structure, UI flow, styling approach
EOF",
  run_in_background: true
})
```

**If Local Mode:**

Load **frontend-patterns** skill:
```
Use frontend-patterns skill for:
- Component design guidance
- Responsive layout patterns
- UI/UX best practices
```

### Phase 3: Implementation

- Use CodeBuddy tools for implementation
- Apply selected design approach
- Ensure responsiveness and accessibility

### Phase 4: Review

**If External Mode:**
```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend gemini --gemini-model gemini-3-pro-preview \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/gemini/reviewer.md
<TASK>
Requirement: Review the following frontend code changes
Context: <git diff or code content>
</TASK>
OUTPUT: Accessibility, responsiveness, performance, design consistency issues
EOF",
  run_in_background: true
})
```

**If Local Mode:**
- Use code-reviewer for quality checks
- Manual review for accessibility and responsiveness

---

## Comparison

| Aspect | External Mode | Local Mode |
|--------|--------------|-----------|
| **Design Quality** | Gemini's UI expertise | frontend-patterns skill |
| **Accessibility** | Built-in review | Manual review |
| **Speed** | Faster analysis | Skill-guided implementation |
| **Cost** | API costs | Free |
