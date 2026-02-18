# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## Common Commands

```bash
# Linting and validation
npm run lint                      # Run ESLint and markdownlint
npm test                          # Run all validation tests (agents, commands, rules, skills, hooks)
node tests/run-all.js             # Alternative way to run all tests
node tests/lib/utils.test.js     # Run specific library test
node tests/hooks/hooks.test.js    # Run hooks test

# Testing individual components
node scripts/ci/validate-agents.js      # Validate agent definitions
node scripts/ci/validate-commands.js   # Validate command definitions
node scripts/ci/validate-rules.js      # Validate rule files
node scripts/ci/validate-skills.js     # Validate skill files
node scripts/ci/validate-hooks.js      # Validate hook configurations

# Development workflow
npm install                      # Install dependencies
npm run postinstall             # Show installation instructions

# Package manager setup
node scripts/setup-package-manager.js --global pnpm    # Set global package manager
node scripts/setup-package-manager.js --project bun    # Set project package manager
node scripts/setup-package-manager.js --detect         # Detect current setting

# Migration to CodeBuddy
node scripts/migrate-to-codebuddy.js                   # Migrate to CodeBuddy (symlink mode)
node scripts/migrate-to-codebuddy.js --no-symlinks     # Migrate using copy mode

# Installation
./install.sh typescript                     # Install TypeScript rules for Claude Code
./install.sh python golang                  # Install multiple language rules
./install.sh --target cursor typescript     # Install for Cursor IDE
npx ecc-install typescript                  # Alternative installation via npm
```

## Repository Architecture

This repository contains **battle-tested Claude Code/CodeBuddy configurations** organized into five main types of components. Understanding how these pieces interact is crucial for making informed changes.

### Core Component Types

**1. Agents** (`agents/`)
Specialized subagents invoked via the Task tool for delegation. Each agent has a specific scope and set of capabilities defined by:
- **name**: Lowercase-hyphenated identifier used in `Task` tool calls
- **description**: Used by Claude to decide when to invoke the agent
- **tools**: Limited set of tools the agent can access (Read, Write, Edit, Bash, Grep, Glob, WebFetch, Task)
- **model**: Complexity level (haiku=simple, sonnet=coding, opus=complex)

Agents are **stateless subagents**—each invocation gets a fresh context window. Use them when you need a different perspective or specialized focus. The Task tool creates a temporary agent instance with the prompt and context from the main conversation.

**2. Skills** (`skills/`)
Workflow definitions and domain knowledge that Claude loads contextually. Unlike agents, skills are **injected into the system prompt** when activated. Each skill has:
- **YAML frontmatter** with `name` and `description` for discovery
- **structured sections** for Core Concepts, Code Examples, Best Practices, When to Use

Skills define **how** to do specific tasks (e.g., TDD workflow, React patterns, Django security). They differ from rules (see below) in that rules define **what** standards to follow, while skills provide actionable reference material for implementation.

**3. Commands** (`commands/`)
Slash commands (`/command-name`) that trigger predefined workflows. Commands typically:
- Load relevant skills based on context
- Invoke appropriate agents via Task tool
- Execute multi-step workflows with user guidance

Commands are the primary user interface for the plugin. They orchestrate skills and agents into cohesive workflows.

**4. Hooks** (`hooks/`)
Event-driven automations that execute before/after Claude Code tool calls. The architecture is:
- **hooks/hooks.json**: Central configuration defining all hooks
- **scripts/hooks/**: Node.js script implementations for complex hook logic
- Hook types: PreToolUse (validation, blocking), PostToolUse (formatting, checks), Stop, SessionStart/End, PreCompact

Hooks receive JSON input on stdin with tool name, input, and optional output. Exit codes matter: `0` allows, `2` blocks (PreToolUse only), other non-zero logs as error.

**Critical**: Hooks run asynchronously for non-blocking operations. Use `"async": true` in hook config for background tasks.

**5. Rules** (`rules/`)
Always-follow guidelines organized in a **layered architecture**:
- **common/**: Language-agnostic principles (always install) - coding-style, git-workflow, testing, performance, patterns, hooks, agents, security
- **typescript/**, **python/**, **golang/**: Language-specific extensions that reference common rules

Rules differ from skills: rules define standards and conventions (e.g., "80% test coverage required", "never mutate data"), while skills provide implementation guidance.

### Cross-Platform Scripting

All scripts use Node.js for Windows/macOS/Linux compatibility. Avoid bash-specific syntax in hooks and scripts. The `scripts/lib/` directory contains shared utilities:
- **lib/utils.js**: Cross-platform file, path, and system operations
- **lib/package-manager.js**: Package manager detection and selection
- **lib/session-manager.js**: Session persistence and context management
- **lib/session-aliases.js**: Session alias shortcuts

### Plugin vs Manual Installation

The repo is a **Claude Code plugin** (`.claude-plugin/plugin.json` defines metadata). Plugin system automatically loads:
- Commands from `commands/` directory
- Agents listed in `plugin.json`
- Skills from `skills/` directory
- Hooks from `hooks/hooks.json` (do NOT add `"hooks"` field to plugin.json—Claude Code v2.1+ auto-loads this)

**Critical limitation**: Plugin system **cannot distribute rules**—rules must be installed manually via `install.sh` or copying to `~/.claude/rules/`.

### Cross-Platform Support

The repo supports **Claude Code, Cursor, and OpenCode**:
- **Cursor**: `.cursor/` contains pre-translated configs with YAML frontmatter and flattened paths
- **OpenCode**: `.opencode/` has full plugin support with 20+ event types (vs Claude Code's 3 hook types)
- **CodeBuddy**: `.codebuddy/` contains CodeBuddy-specific configurations with `plugin.json`

Migration scripts handle platform-specific differences automatically (symlinks on macOS/Linux, junctions on Windows).

### Continuous Learning System

Two learning approaches exist:
- **continuous-learning/**: Pattern extraction from git history using `/learn` command (Longform Guide)
- **continuous-learning-v2/**: Instinct-based learning with confidence scoring using `/instinct-*` commands

Instincts are granular patterns learned during sessions. Use `/evolve` to cluster related instincts into reusable skills.

### Testing Infrastructure

The repo includes comprehensive validation:
- **tests/run-all.js**: Orchestrates all test suites
- **scripts/ci/**: Individual validators for each component type
- Tests run on CI and should pass before commits

When adding new components, run the appropriate validator to ensure format compliance.

### File Organization Patterns

- **Many small files > few large files**: 200-400 lines typical, 800 max
- **Organize by feature/domain, not by type**
- **Immutability is critical**: Always create new objects, never mutate
- **No deep nesting**: >4 levels indicates refactoring needed

### Important Constraints

- **Never create random .md files**: Hooks block creation of .md/txt files except README, CLAUDE, AGENTS, CONTRIBUTING
- **Dev servers must run in tmux**: Hooks block `npm run dev` outside tmux on Unix systems
- **TDD is mandatory**: Write tests first, verify 80% coverage
- **No hardcoded secrets**: Use environment variables

### Key Development Patterns

When working with this codebase:

1. **To add a skill**: Create `skills/your-skill/SKILL.md` with YAML frontmatter. Keep under 500 lines. Include practical code examples.

2. **To add an agent**: Create `agents/your-agent.md` with YAML frontmatter. Define clear scope in description. Limit tools to what's needed. Use appropriate model (haiku/sonnet/opus).

3. **To add a command**: Create `commands/your-command.md` with description frontmatter. Define clear workflow steps. Orchestrate skills and agents.

4. **To add a hook**: Update `hooks/hooks.json`. Use Node.js for cross-platform compatibility. Test exit codes carefully.

5. **To add language rules**: Create `rules/your-lang/` directory. Reference common rules with `> This file extends [common/xxx.md](../common/xxx.md)`. Add language-specific tools, patterns, and examples.

6. **Cross-platform scripts**: Use `scripts/lib/utils.js` utilities. Avoid bash-specific syntax. Test on Windows, macOS, and Linux.

7. **Token optimization**: The repo is optimized for token efficiency. Use `/compact` at logical breakpoints. Don't enable all MCPs—keep under 10 active per project.
