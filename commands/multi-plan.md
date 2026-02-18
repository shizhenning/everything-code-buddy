# Plan - Hybrid Development Planning

Multi-mode planning: External model (if available) or local planner agent.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use English when interacting with tools/models
- **Hybrid Mode**: Auto-detect available capabilities and use optimal approach
- **Fallback Strategy**: External unavailable → local planner agent
- **Code Sovereignty**: All production code modifications by CodeBuddy only

---

## Configuration Check

First, check available modes:

```bash
# Check current mode and configuration
node scripts/multi-mode-selector.js
```

**Mode Selection Logic:**
1. If `mode === "local"` → Use planner agent
2. If `external.enabled && wrapper exists && API keys configured` → Try external
3. If external fails → Fall back to planner agent

---

## Workflow

### Phase 1: Context Retrieval

Use appropriate tools to gather context:
- `search_content` - Find relevant patterns
- `read_file` - Understand existing code
- `list_files` - Explore project structure

### Phase 2: Planning

**If External Mode Available:**

```
Bash({
  command: "~/.codebuddy/bin/codeagent-wrapper --backend codex \"$PWD\" <<'EOF'
ROLE_FILE: ~/.codebuddy/.ccg/prompts/codex/architect.md
<TASK>
Requirement: $ARGUMENTS
Context: <gathered context>
</TASK>
OUTPUT: Step-by-step implementation plan
EOF",
  run_in_background: true,
  timeout: 3600000
})
```

**If Local Mode (or External Failed):**

Launch the **planner** agent directly:
```
The planner agent will create a detailed implementation plan based on:
- Gathered context from Phase 1
- User requirements
- Project structure and patterns
```

### Phase 3: Plan Output

- Write plan to `.codebuddy/plan/current.md`
- Present summary to user
- Indicate which mode was used (external/local)

---

## Example Usage

### Usage 1: Local Mode (Default)

```bash
# No configuration needed, uses planner agent
/multi-plan Create a REST API for user management
```

### Usage 2: External Mode (After Configuration)

1. Edit `~/.codebuddy/multi-config.json`:
```json
{
  "mode": "auto",
  "external": {
    "enabled": true,
    "codex": {
      "api_key": "sk-...",
      "model": "gpt-4"
    },
    "wrapper_path": "~/.codebuddy/bin/codeagent-wrapper"
  }
}
```

2. Use multi-plan:
```bash
/multi-plan Create a REST API for user management
```

### Usage 3: Force Local Mode

```json
{
  "mode": "local"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| External not working | Check `multi-config.json` and wrapper script |
| Wrapper missing | Use local mode or provide wrapper script |
| API key invalid | Check configuration or fall back to local |
| Fallback not working | Ensure `fallback.use_local_agents: true` |
