# File Saving Policy

> **Golden Rule**: Only save files when explicitly required by the task or user request.

## Confirmation Rule

Before any file write/edit/create/delete operation, apply this rule:

- **Prompt explicitly requests file saving** → No confirmation needed
- **Prompt does NOT explicitly request file saving** → MUST ask user for confirmation

Examples:

**No confirmation needed:**
- User: "Write a test file for user authentication"
- Command: `/multi-execute` (explicitly executes code changes)
- Agent task: "Create test file X" (explicitly requested)

**Confirmation required:**
- User: "Analyze the codebase" (just analyze, no save)
- Agent task: "Review code quality" (just review, no save)
- User: "Design architecture" (just design, no save)

## When to Save Files

### Automatic Saves (No Confirmation Required)

These operations automatically save files without asking:

| Scenario | Files Saved | By Who |
|----------|-------------|--------|
| **Test Creation** | `*.test.ts`, `*.spec.ts`, `__tests__/` | tdd-guide |
| **E2E Test Results** | Screenshots, traces, reports | e2e-runner |
| **Dead Code Removal** | Files with unused code | refactor-cleaner |
| **Security Fixes** | Vulnerability fixes | security-reviewer |
| **Documentation Updates** | Codemaps, READMEs | doc-updater |
| **Plan Execution** | Implementation files | /multi-execute |

### User-Confirmation Required Saves

These operations MUST ask user before saving:

| Scenario | Confirmation Prompt |
|----------|---------------------|
| **Planning Documents** | "Save plan to `.codebuddy/plan/xxx.md`? (yes/no)" |
| **Architecture Proposals** | "Save architecture to `docs/architecture/xxx.md`? (yes/no)" |
| **Orchestration Reports** | "Save report to `.reports/orchestration-xxx.md`? (yes/no)" |
| **Learning New Patterns** | "Save skill to `~/.codebuddy/skills/learned/xxx.md`? (yes/no)" |
| **Analysis Results** | "Save analysis to `.reports/analysis-xxx.md`? (yes/no)" |

### Never Save

These operations should NEVER save files:

- Analysis results (output to terminal only)
- Code review findings (output to terminal only)
- Architecture proposals (output to terminal only)
- Temporary calculations
- Debug output
- Examples and demonstrations

## Before Saving Checklist

For every save operation, verify:

- [ ] File path is within allowed directories (see settings.json permissions)
- [ ] Content is complete and correct
- [ ] File extension is appropriate
- [ ] No duplicate files would be created
- [ ] If confirmation required: User said "yes"

## Allowed Directories

Based on `settings.json` permissions, files can be saved to:

- `*.test.ts`, `*.spec.ts` - Test files
- `__tests__/` - Test directories
- `*.md` - Documentation files in `docs/` and `.reports/`
- `.codebuddy/` - Project configuration and plans
- `docs/` - Documentation
- `.reports/` - Reports and analysis results
- Source code files (when explicitly requested by `/multi-execute`)

## Agent-Specific Policies

### tdd-guide
- **Allowed**: Test files (`*.test.ts`, `*.spec.ts`)
- **Requires Confirmation**: Non-test files
- **Never Saves**: Production code

### doc-updater
- **Allowed**: Documentation (`docs/CODEMAPS/`, `*.md`)
- **Requires Confirmation**: Non-documentation files
- **Never Saves**: Source code

### e2e-runner
- **Allowed**: Test files, screenshots, traces, reports
- **Requires Confirmation**: Other files
- **Never Saves**: Production code

### refactor-cleaner
- **Allowed**: Files with dead code (after verification)
- **Requires Confirmation**: Files not confirmed as dead code
- **Never Saves**: New code

### security-reviewer
- **Allowed**: Security vulnerability fixes
- **Requires Confirmation**: Non-security changes
- **Never Saves**: Refactoring (that's for refactor-cleaner)

## Command-Specific Policies

### /multi-plan
- Saves to: `.codebuddy/plan/<feature-name>.md`
- Confirmation: Required ("Save plan? (yes/no)")

### /multi-frontend
- Saves to: `.codebuddy/plans/frontend-<task>.md`
- Confirmation: Required ("Save plan? (yes/no)")

### /multi-backend
- Saves to: `.codebuddy/plans/backend-<task>-db.md`
- Confirmation: Required ("Save design? (yes/no)")

### /multi-execute
- Saves to: Source files as per plan
- Confirmation: Not required (execution command)

### /orchestrate
- Saves to: `.reports/orchestration-*.md` or `docs/architecture/`
- Confirmation: Required ("Save report? (yes/no)")

### /learn, /learn-eval
- Saves to: `~/.codebuddy/skills/learned/`
- Confirmation: Required ("Save skill? (yes/no)")

## Error Handling

If a save operation fails:

1. **Check permissions**: Verify directory is in allowed list
2. **Check path**: Verify absolute path is correct
3. **Check disk space**: Ensure enough space
4. **Inform user**: Explain the error and suggest solution

## Best Practices

1. **Be explicit**: Always clarify what you're about to save
2. **Show preview**: Show a snippet of what will be saved
3. **Use clear paths**: Use descriptive, consistent file paths
4. **Avoid duplicates**: Check if file exists before saving
5. **Document changes**: Include clear commit messages for VCS

---

**Remember**: Unconfirmed saves can break the codebase. Always verify user intent before writing files.
