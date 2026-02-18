# Backend - Hybrid Backend Development

Multi-mode backend development: Codex (if available) or backend-patterns skill.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use English when interacting with tools/models
- **Hybrid Mode**: Auto-detect available capabilities and use optimal approach
- **Fallback Strategy**: External unavailable → backend-patterns skill
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
- `search_content` - Find backend patterns and APIs
- `read_file` - Understand existing data models and services
- `list_files` - Explore backend structure

### Phase 2: Design Planning

**If External Mode (Codex) Available:**

```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend codex \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/codex/architect.md
<TASK>
Requirement: $ARGUMENTS
Context: <gathered context>
</TASK>
OUTPUT: File structure, function/class design, dependency relationships
EOF",
  run_in_background: true
})
```

**If Local Mode:**

Load **backend-patterns** skill:
```
Use backend-patterns skill for:
- API design patterns
- Database design guidance
- Error handling best practices
```

### Phase 3: Implementation

- Use CodeBuddy tools for implementation
- Apply selected design approach
- Ensure error handling and security

### Phase 4: Review

**If External Mode:**
```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend codex \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/codex/reviewer.md
<TASK>
Requirement: Review the following backend code changes
Context: <git diff or code content>
</TASK>
OUTPUT: Security, performance, error handling, API compliance issues
EOF",
  run_in_background: true
})
```

**If Local Mode:**
- Use security-reviewer for security checks
- Use code-reviewer for quality checks
- Manual review for performance

---

## Comparison

| Aspect | External Mode | Local Mode |
|--------|--------------|-----------|
| **Design Quality** | Codex's backend expertise | backend-patterns skill |
| **Security** | Built-in review | security-reviewer agent |
| **Speed** | Faster analysis | Skill-guided implementation |
| **Cost** | API costs | Free |
