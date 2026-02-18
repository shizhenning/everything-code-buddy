# Execute - Hybrid Development Execution

Multi-mode execution: External prototype (if available) or direct CodeBuddy implementation.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use English when interacting with tools/models
- **Hybrid Mode**: Auto-detect available capabilities and use optimal approach
- **Code Sovereignty**: All production code modifications by CodeBuddy only
- **Quality First**: Always use code-reviewer and security-reviewer

---

## Configuration Check

```bash
node scripts/multi-mode-selector.js
```

---

## Workflow

### Phase 1: Mode Selection

Based on configuration:
- **External Available** → Get prototype from external model
- **Local Mode** → Direct implementation by CodeBuddy

### Phase 2: External Mode (Prototype + Refactor)

If external mode available:

1. **Get Prototype:**
```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend codex \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/codex/architect.md
<TASK>
Requirement: $ARGUMENTS
Context: <target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY
EOF",
  run_in_background: true
})
```

2. **Refactor to Production:**
- Treat external diff as "dirty prototype"
- Refactor to match project standards
- Apply security review
- Add proper error handling

### Phase 3: Local Mode (Direct Implementation)

If local mode (or external failed):

1. **Read Plan:**
   - Load from `.codebuddy/plan/current.md`
   - Verify approval

2. **Direct Implementation:**
   - Use CodeBuddy tools directly
   - Apply best practices via agents
   - Use code-reviewer for quality

3. **Quality Gates:**
   - Run security-reviewer
   - Verify tests pass
   - Check for regressions

---

## Comparison

| Aspect | External Mode | Local Mode |
|--------|--------------|-----------|
| **Speed** | Faster (prototype generation) | Slower (full implementation) |
| **Quality** | Requires refactoring | Production-ready directly |
| **Cost** | API costs | Free |
| **Reliability** | Depends on external API | 100% available |
