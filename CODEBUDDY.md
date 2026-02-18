# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## Common Commands

### Running Tests
```bash
# Run all tests
node tests/run-all.js

# Run individual test files
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

### Linting
```bash
# Run ESLint and markdown linting
npm run lint
```

### Full Test Suite
```bash
# Run all validation and tests
npm test
```

### Validation Scripts
```bash
# Validate agents structure
node scripts/ci/validate-agents.js

# Validate commands structure
node scripts/ci/validate-commands.js

# Validate rules structure
node scripts/ci/validate-rules.js

# Validate skills structure
node scripts/ci/validate-skills.js

# Validate hooks configuration
node scripts/ci/validate-hooks.js
```

### Installation Scripts
```bash
# Install rules for Claude Code (default)
./install.sh typescript

# Install for multiple languages
./install.sh typescript python golang

# Install for Cursor IDE
./install.sh --target cursor typescript

# Setup package manager
node scripts/setup-package-manager.js --detect
node scripts/setup-package-manager.js --project pnpm
node scripts/setup-package-manager.js --global bun
```

### Migration Tools
```bash
# Migrate to CodeBuddy
node scripts/migrate-to-codebuddy.js

# Migrate without symlinks
node scripts/migrate-to-codebuddy.js --no-symlinks
```

## Project Architecture

This is a **Claude Code plugin** repository containing battle-tested configurations for AI-assisted development. The project provides agents, skills, commands, hooks, and rules that integrate with Claude Code CLI.

### Core Components

**Plugin System**
- `.claude-plugin/plugin.json` - Plugin manifest defining available components
- `.claude-plugin/marketplace.json` - Marketplace catalog for `/plugin marketplace add`
- Hooks in `hooks/hooks.json` are auto-loaded by Claude Code v2.1+ (do NOT add to plugin.json)

**Agents** (`agents/`)
- 13 specialized subagents for delegated tasks (planner, code-reviewer, security-reviewer, etc.)
- Each agent is a markdown file with YAML frontmatter (name, description, tools, model)
- Agents are invoked via the Task tool for specific workflows

**Skills** (`skills/`)
- 53+ workflow definitions and domain knowledge modules
- Organized by domain: coding-standards, backend-patterns, frontend-patterns, security-review, etc.
- Skills include language-specific patterns (TypeScript, Python, Go, Java/Django/Spring Boot)
- Each skill is a SKILL.md file with YAML frontmatter (name, description)

**Commands** (`commands/`)
- 31 slash commands starting with `/` (plan, tdd, code-review, e2e, etc.)
- Commands orchestrate workflows using agents and skills
- Each command is a markdown file with YAML frontmatter description

**Hooks** (`hooks/`)
- Trigger-based automations that fire on specific events (PreToolUse, PostToolUse, SessionStart, Stop)
- Hooks are defined in `hooks/hooks.json` using matcher syntax
- Cross-platform Node.js implementations in `scripts/hooks/` (session-start.js, session-end.js, etc.)

**Rules** (`rules/`)
- Always-follow guidelines organized into `common/` (language-agnostic) + language-specific dirs
- Must be manually installed to `~/.claude/rules/` (cannot be distributed via plugin)
- Rules structure: common/ + typescript/ + python/ + golang/

**Scripts** (`scripts/`)
- Cross-platform Node.js scripts for package manager detection and hook implementations
- `lib/utils.js` - Shared utilities for file/path/system operations
- `lib/package-manager.js` - Package manager detection and selection
- `hooks/` - Hook implementations (session-start.js, session-end.js, suggest-compact.js, etc.)

### Cross-Platform Support

All hooks and scripts are written in Node.js for Windows/macOS/Linux compatibility.

**Package Manager Detection**
Priority order: environment variable (`CLAUDE_PACKAGE_MANAGER`) → project config (`.claude/package-manager.json`) → package.json → lock files → global config → first available

**Installation**
- Claude Code: `/plugin marketplace add affaan-m/everything-claude-code` then `/plugin install everything-claude-code@everything-claude-code`
- Rules must be installed manually via `./install.sh <language>`
- Cursor IDE: `./install.sh --target cursor <language>`

### Critical Constraints

**Hooks Auto-Loading**
- Claude Code v2.1+ automatically loads `hooks/hooks.json` from installed plugins
- Do NOT add a `"hooks"` field to `.claude-plugin/plugin.json` - this causes duplicate detection errors
- This is enforced by regression tests (see issues #29, #52, #103)

**Plugin Manifest**
- Component fields must be arrays
- `agents` must use explicit file paths, not directories
- A `version` field is required
- See `.claude-plugin/PLUGIN_SCHEMA_NOTES.md` for undocumented but strict constraints

**Rules Distribution**
- The Claude Code plugin system does not support distributing `rules` via plugins
- Users must manually run `./install.sh <language>` to install rules to `~/.claude/rules/`

### Multi-IDE Support

The repository includes pre-translated configurations for different IDEs:
- **Cursor**: `.cursor/` directory with rules, agents, skills, commands adapted for Cursor format
- **OpenCode**: `.opencode/` directory with full plugin support (12 agents, 24 commands, 16 skills)
- **CodeBuddy**: Migration support via `scripts/migrate-to-codebuddy.js` with symlink handling

### Testing and Validation

- Comprehensive test suite in `tests/` (lib/, hooks/, run-all.js)
- CI validation scripts in `scripts/ci/` validate structure of agents, commands, rules, skills, hooks
- Tests ensure plugin compatibility and prevent regressions (e.g., hooks duplicate detection)
