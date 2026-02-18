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

- Comprehensive test suite in `tests/` (11 test files covering lib/, hooks/, integration, CI validation)
- Key test: `tests/hooks/hooks.test.js` (175KB - most comprehensive test coverage)
- CI validation scripts in `scripts/ci/` validate structure of agents, commands, rules, skills, hooks
- Tests ensure plugin compatibility and prevent regressions (e.g., hooks duplicate detection)

### Known Issues and Caveats

**Hooks Duplication Prevention**
- Claude Code v2.1+ automatically loads `hooks/hooks.json` from installed plugins
- Adding `"hooks"` field to `.claude-plugin/plugin.json` causes duplicate detection errors
- This is strictly enforced - DO NOT add hooks field to plugin manifest

**Rules Installation Limitations**
- Claude Code plugin system does not support distributing `rules` via plugins
- Users must manually run `./install.sh <language>` to install rules
- Project-level rules in `.claude/rules/` take precedence over user-level `~/.claude/rules/`
- Warning: Running `./install.sh` in a project with existing project-level rules will overwrite them

**Platform-Specific Considerations**
- **Windows**: PowerShell execution flow for hooks may require explicit permissions
- **Cross-platform scripts**: All hooks written in Node.js for consistency, but platform-specific paths must use `path` module
- **Package manager conflicts**: When multiple detection methods disagree, the first available package manager in priority order is used

**Continuous Learning v2 (Instincts)**
- Instinct import/export requires proper session persistence
- Confidence scores are calculated based on frequency and success rate (exact algorithm not fully documented)
- Clustering instincts into skills via `/evolve` command uses heuristic grouping

**Token Optimization Trade-offs**
- Lowering `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` from 95% to 50% causes earlier compression but may improve context quality
- Reducing `MAX_THINKING_TOKENS` from 31,999 to 10,000 saves ~70% thinking costs but may reduce reasoning depth
- Limiting MCP servers to <10 and tools to <80 is recommended but not enforced

**Session Management**
- Session evaluation runs at session end; may add overhead on large projects
- Timezone handling in session aliases uses system local time
- Session state persistence may fail if `~/.claude-code-sessions/` directory has permission issues

**Agent Auto-Activation**
- Some agents (e.g., `architect`, `database-reviewer`) activate automatically based on context
- Auto-activation conditions are heuristically determined and not always predictable
- Manual invocation via Task tool is always possible

### Documentation References

- **Project evaluation**: `docs/ECC项目深度评估报告.md` - Comprehensive analysis with 5/5 rating
- **Caveats and issues**: `docs/ECC深度分析补充-不明确与潜在问题.md` - Known limitations and risk assessment
- **Detailed architecture**: `docs/CodeBuddy体系结构文档.md` - 5555-line in-depth documentation
- **Quick start**: `the-shortform-guide.md` (430 lines)
- **Full guide**: `the-longform-guide.md` (354 lines)

### Project Statistics

| Component | Count | Notes |
|-----------|-------|-------|
| Agents | 13 | Multi-model selection (opus/sonnet/haiku) |
| Commands | 31 | Slash commands with agent/skill orchestration |
| Skills | 53+ | Organized by domain and language |
| Rules | 28 | Common + language-specific (TS/Python/Go) |
| Hooks | 6 types | PreToolUse, PostToolUse, SessionStart, Stop, PreCompact, SessionEnd |
| MCP Configs | 14 servers | GitHub, Supabase, Vercel, etc. |
| Tests | 11 files | ~630KB total test code |
| Documentation | 500+ files | Multi-language support |

### Key Success Metrics

- **Production validation**: 10+ months of high-intensity daily use
- **Community adoption**: 42K+ GitHub stars, 5K+ forks, 24 contributors
- **Hackathon recognition**: Anthropic Hackathon winner
- **Test coverage**: Comprehensive with hooks.test.js at 175KB alone
- **Cross-platform**: Windows/macOS/Linux full support
