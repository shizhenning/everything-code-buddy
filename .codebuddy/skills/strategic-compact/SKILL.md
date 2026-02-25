---
name: strategic-compact
description: Suggests manual context compaction at logical intervals to preserve context through task phases rather than arbitrary auto-compaction.
---

# Strategic Compact Skill

Suggests manual `/compact` at strategic points in your workflow rather than relying on arbitrary auto-compaction.

## When to Activate

- Running long sessions that approach context limits (200K+ tokens)
- Working on multi-phase tasks (research â†?plan â†?implement â†?test)
- Switching between unrelated tasks within the same session
- After completing a major milestone and starting new work
- When responses slow down or become less coherent (context pressure)

## Why Strategic Compaction?

Auto-compaction triggers at arbitrary points:
- Often mid-task, losing important context
- No awareness of logical task boundaries
- Can interrupt complex multi-step operations

Strategic compaction at logical boundaries:
- **After exploration, before execution** â€?Compact research context, keep implementation plan
- **After completing a milestone** â€?Fresh start for next phase
- **Before major context shifts** â€?Clear exploration context before different task

## How It Works

The `suggest-compact.js` script runs on PreToolUse (Edit/Write) and:

1. **Tracks tool calls** â€?Counts tool invocations in session
2. **Threshold detection** â€?Suggests at configurable threshold (default: 50 calls)
3. **Periodic reminders** â€?Reminds every 25 calls after threshold

## Hook Setup

Add to your `~/.codebuddy/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [{ "type": "command", "command": "node ~/.codebuddy/skills/strategic-compact/suggest-compact.js" }]
      },
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "node ~/.codebuddy/skills/strategic-compact/suggest-compact.js" }]
      }
    ]
  }
}
```

## Configuration

Environment variables:
- `COMPACT_THRESHOLD` â€?Tool calls before first suggestion (default: 50)

## Compaction Decision Guide

Use this table to decide when to compact:

| Phase Transition | Compact? | Why |
|-----------------|----------|-----|
| Research â†?Planning | Yes | Research context is bulky; plan is the distilled output |
| Planning â†?Implementation | Yes | Plan is in TodoWrite or a file; free up context for code |
| Implementation â†?Testing | Maybe | Keep if tests reference recent code; compact if switching focus |
| Debugging â†?Next feature | Yes | Debug traces pollute context for unrelated work |
| Mid-implementation | No | Losing variable names, file paths, and partial state is costly |
| After a failed approach | Yes | Clear the dead-end reasoning before trying a new approach |

## What Survives Compaction

Understanding what persists helps you compact with confidence:

| Persists | Lost |
|----------|------|
| CLAUDE.md instructions | Intermediate reasoning and analysis |
| TodoWrite task list | File contents you previously read |
| Memory files (`~/.codebuddy/memory/`) | Multi-step conversation context |
| Git state (commits, branches) | Tool call history and counts |
| Files on disk | Nuanced user preferences stated verbally |

## Best Practices

1. **Compact after planning** â€?Once plan is finalized in TodoWrite, compact to start fresh
2. **Compact after debugging** â€?Clear error-resolution context before continuing
3. **Don't compact mid-implementation** â€?Preserve context for related changes
4. **Read the suggestion** â€?The hook tells you *when*, you decide *if*
5. **Write before compacting** â€?Save important context to files or memory before compacting
6. **Use `/compact` with a summary** â€?Add a custom message: `/compact Focus on implementing auth middleware next`

## Related

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) â€?Token optimization section
- Memory persistence hooks â€?For state that survives compaction
- `continuous-learning` skill â€?Extracts patterns before session ends
