# Workflow - Hybrid Collaborative Development

Multi-mode workflow: External collaboration (if available) or local agent orchestration.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use English when interacting with tools/models
- **Hybrid Mode**: Auto-detect available capabilities and use optimal approach
- **Fallback Strategy**: External unavailable → local agent orchestration
- **Code Sovereignty**: All production code modifications by CodeBuddy only

---

## Configuration Check

```bash
node scripts/multi-mode-selector.js
```

---

## Collaborative Models

**External Mode (if configured):**
- **Codex** - Backend authority
- **Gemini** - Frontend expert
- **Claude** - Orchestration and refactoring

**Local Mode:**
- **planner** - Planning phase
- **architect** - Design decisions
- **code-reviewer** - Quality checks
- **security-reviewer** - Security audit
- **tdd-guide** - Test guidance

---

## Workflow Phases

### Phase 1: Research & Analysis

**Mode: Local Always**
- Use `search_content` for patterns
- Analyze dependencies
- Identify risks

### Phase 2: Ideation & Planning

**External Mode:**
- Launch Codex/Gemini for multi-perspective planning
- Consolidate outputs

**Local Mode:**
- Launch **planner** agent
- Launch **architect** agent
- Consolidate outputs

### Phase 3: Execution

**External Mode:**
1. Get prototype from Codex/Gemini
2. CodeBuddy refactors to production
3. Security review

**Local Mode:**
1. Direct implementation
2. Code-reviewer checks
3. Security-reviewer audit

### Phase 4: Optimization

**Both Modes:**
- Performance optimization
- Refactor for maintainability
- Documentation updates

---

## Configuration Examples

### Example 1: Pure Local Mode

```json
{
  "mode": "local",
  "external": { "enabled": false }
}
```

### Example 2: Auto-Select (Recommended)

```json
{
  "mode": "auto",
  "external": {
    "enabled": true,
    "codex": {
      "api_key": "sk-...",
      "model": "gpt-4"
    },
    "gemini": {
      "api_key": "AI...",
      "model": "gemini-3-pro-preview"
    }
  }
}
```

### Example 3: Force External

```json
{
  "mode": "external",
  "external": {
    "enabled": true,
    "codex": { "api_key": "sk-..." },
    "wrapper_path": "~/.codebuddy/bin/codeagent-wrapper"
  }
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| External not starting | Check `multi-config.json` and API keys |
| Wrapper script missing | Set `mode: "local"` or provide wrapper |
| Fallback not working | Verify `fallback.use_local_agents: true` |
