# Quality Gate Initialization

Initialize quality assessment configuration for new projects.

---

## Core Protocols

- **Language Protocol**: Use **English** when interacting with tools/agents, communicate with user in their language
- **Interactive Setup**: Guide users through configuration step-by-step
- **Sensible Defaults**: Provide recommended defaults for common scenarios
- **Validation**: Validate configuration before saving

---

## Execution Workflow

### Phase 1: Project Analysis

`[Mode: Analyze]`

**1. Detect Project Type**:

Analyze project structure to detect:
- **Language**: JavaScript/TypeScript, Python, Java, Go, etc.
- **Framework**: React, Vue, Next.js, Django, Spring Boot, etc.
- **Build Tool**: npm, pnpm, yarn, bun, python, mvn, go build, etc.
- **Testing**: jest, vitest, pytest, junit, etc.
- **Linting**: eslint, pyflake, golangci-lint, etc.

**Detection Methods**:
- Check `package.json`, `pyproject.toml`, `pom.xml`, `go.mod`
- Check configuration files: `jest.config.*`, `vitest.config.*`, `pytest.ini`
- Check tool files: `tsconfig.json`, `.eslintrc.*`, `setup.cfg`

**2. Check Existing Configuration**:

Check if quality gate configuration already exists:
- `.codebuddy/quality-config.json` → Use existing config as template
- `.codebuddy/quality-baseline.json` → Use existing baseline as template

If exists:
- Ask: "Existing quality configuration found. Update or recreate?"
  - Update: Modify existing config with new options
  - Recreate: Start fresh with defaults

---

### Phase 2: Interactive Configuration

`[Mode: Configure]`

**Step 1: Choose Quality Gate Mode**

Ask user to select mode:

```
Quality Gate Mode Selection:

1) Auto Mode (Recommended for production)
   - Automatic quality assessment during /execute
   - Enforced by hooks (git push, deploy, publish)
   - Best for: Production releases, strict quality control

2) Manual Mode
   - Manual quality assessment with /quality-assess
   - Optional enforcement (warnings only)
   - Best for: Development, team reviews

3) Off Mode
   - Disable all quality gates
   - No automatic checks
   - Best for: Quick prototyping, debugging

Your choice [1-3, default: 1]:
```

**Save to**: `qualityGate.mode` in `quality-config.json`

---

**Step 2: Choose Strictness Level**

Ask user to select strictness:

```
Strictness Level:

1) Strict (Recommended for production)
   - Fail on: score < 80
   - Block bypass: yes (--force disabled)
   - Test coverage: min 80%, critical paths 100%
   - Best for: Production releases, critical systems

2) Moderate (Recommended for development)
   - Fail on: score < 70
   - Block bypass: no (--force allowed)
   - Test coverage: min 70%, critical paths 90%
   - Best for: Feature development, active iteration

3) Lenient (Recommended for prototyping)
   - Fail on: score < 60
   - Block bypass: no (--force allowed)
   - Test coverage: min 50%, critical paths 80%
   - Best for: MVP, proof-of-concept, early-stage

Your choice [1-3, default: 2]:
```

**Map to Configuration**:

| Choice | scoreThreshold | blockBypass | minCoverage |
|---------|----------------|--------------|--------------|
| Strict | 80 | true | 80% |
| Moderate | 70 | false | 70% |
| Lenient | 60 | false | 50% |

---

**Step 3: Configure Quality Standards**

Based on detected project type, recommend quality standards:

```
Quality Standards Configuration:

Detected Project: JavaScript/TypeScript with React

1) Functionality
   - Requirement completion rate [%, default: 100]:
   - Edge case coverage [none/low/high, default: high]:

2) Code Quality
   - Max function lines [default: 50]:
   - Max cyclomatic complexity [default: 10]:
   - No console.log [true/false, default: true]:

3) Testing
   - Min coverage [%, default: 70]:
   - Critical coverage [%, default: 90]:
   - Require unit tests [true/false, default: true]:
   - Require integration tests [true/false, default: false]:

4) Linting
   - Max lint errors [default: 0]:
   - Max lint warnings [default: 10]:

5) Security
   - No vulnerabilities [true/false, default: true]:
   - No secrets in code [true/false, default: true]:

Press Enter to accept defaults, or modify values:
```

**Save to**: `qualityStandards` in `quality-config.json`

---

**Step 4: Configure Tool Support**

Detect available tools and ask for confirmation:

```
Tool Configuration:

Detected tools:
✓ TypeScript (tsconfig.json found)
✓ ESLint (.eslintrc.js found)
✓ Jest (jest.config.js found)
✓ npm (package.json found)

Additional tools to enable:
[ ] prettier (recommended)
[ ] prettier (recommended)
[ ] vitest (if using vitest instead of jest)
[ ] pytest (if Python project)
[ ] mvn (if Java project)
[ ] go test (if Go project)

Confirm tool configuration [Y/n, default: Y]:
```

**Save to**: `tools` in `quality-config.json`

---

**Step 5: Configure Hooks**

Ask user to enable hooks:

```
Hook Configuration:

Quality gate enforcement requires hooks:

1) Git pre-commit hook
   - Blocks git commit if quality gate not passed
   - Checks: quality-status.json
   - Location: .git/hooks/pre-commit

2) CodeBuddy PreToolUse hook
   - Blocks git push, deploy, publish if quality gate not passed
   - Checks: quality-status.json
   - Location: .codebuddy/settings.json

Enable hooks? [Y/n, default: Y]:
```

If user confirms:
- Run appropriate install script:
  - Unix: `bash .codebuddy/scripts/install-quality-hooks.sh`
  - Windows: `pwsh -File .codebuddy/scripts/install-quality-hooks.ps1`
- Update `.codebuddy/settings.json` to add CodeBuddy hook

---

### Phase 3: Create Configuration Files

`[Mode: Create]`

**1. Create quality-config.json**:

```json
{
  "qualityGate": {
    "enabled": true,
    "mode": "auto",  // auto | manual | off
    "description": "Quality assessment configuration",
    "rules": [
      {
        "check": "typescript",
        "operator": "==",
        "value": "0",
        "onFailure": "block",
        "description": "TypeScript errors must be zero"
      },
      {
        "check": "lintErrors",
        "operator": "==",
        "value": "0",
        "onFailure": "block",
        "description": "Lint errors must be zero"
      },
      {
        "check": "testCoverage",
        "operator": ">=",
        "value": "70",
        "onFailure": "warn",
        "description": "Test coverage should be at least 70%"
      },
      {
        "check": "securityVulnerabilities",
        "operator": "==",
        "value": "0",
        "onFailure": "block",
        "description": "Security vulnerabilities must be zero"
      }
    ]
  },
  "qualityStandards": {
    "functionality": {
      "requirementCompletionRate": 100,
      "edgeCaseCoverage": "high"
    },
    "codeQuality": {
      "maxFunctionLines": 50,
      "maxCyclomaticComplexity": 10,
      "noConsoleLog": true
    },
    "testing": {
      "minCoverage": 70,
      "criticalCoverage": 90,
      "requireUnitTests": true,
      "requireIntegrationTests": false
    },
    "linting": {
      "maxLintErrors": 0,
      "maxLintWarnings": 10
    },
    "security": {
      "noVulnerabilities": true,
      "noSecretsInCode": true
    }
  },
  "tools": {
    "typescript": true,
    "eslint": true,
    "prettier": true,
    "jest": true
  },
  "createdAt": "<current ISO timestamp>",
  "version": "1.0"
}
```

**2. Create quality-baseline.json**:

```json
{
  "project": {
    "name": "<detected project name>",
    "type": "<detected project type>",
    "language": "<detected language>",
    "framework": "<detected framework>"
  },
  "qualityStandards": {
    "functionality": {
      "requirementCompletionRate": 100,
      "edgeCaseCoverage": "high",
      "targetScore": 100
    },
    "codeQuality": {
      "maxFunctionLines": 50,
      "maxCyclomaticComplexity": 10,
      "noConsoleLog": true,
      "targetScore": 100
    },
    "testing": {
      "minCoverage": 70,
      "criticalCoverage": 90,
      "requireUnitTests": true,
      "requireIntegrationTests": false,
      "targetScore": 100
    },
    "linting": {
      "maxLintErrors": 0,
      "maxLintWarnings": 10,
      "targetScore": 100
    },
    "security": {
      "noVulnerabilities": true,
      "noSecretsInCode": true,
      "targetScore": 100
    }
  },
  "createdAt": "<current ISO timestamp>",
  "version": "1.0"
}
```

**3. Create quality-trends.json**:

```json
{
  "assessments": [],
  "summary": {
    "totalAssessments": 0,
    "averageScore": 0,
    "averageFunctionalityScore": 0,
    "averageCodeQualityScore": 0,
    "averageTestingScore": 0,
    "averageDocumentationScore": 0,
    "averageIntegrationScore": 0
  },
  "metadata": {
    "version": "1.0",
    "createdAt": "<current ISO timestamp>"
  }
}
```

**4. Create .gitignore entries**:

Check if `.gitignore` exists, add:

```gitignore
# Quality assessment files (local state)
.codebuddy/quality-status.json
.codebuddy/quality-bypass-log.json
```

---

### Phase 4: Install Hooks

`[Mode: Install]`

**1. Install Git pre-commit hook**:

Detect OS and run appropriate script:

```bash
# Unix-like
if [[ "$OSTYPE" == "darwin"* || "$OSTYPE" == "linux"* ]]; then
    bash .codebuddy/scripts/install-quality-hooks.sh
fi

# Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    pwsh -File .codebuddy/scripts/install-quality-hooks.ps1
fi
```

**2. Configure CodeBuddy hook**:

Check `.codebuddy/settings.json` and add PreToolUse hook if not exists:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"<project-path>/.codebuddy/scripts/hooks/check-quality-gate.js\"",
            "description": "Block critical operations if quality gate not passed"
          }
        ]
      }
    ]
  }
}
```

---

### Phase 5: Verification

`[Mode: Verify]`

**1. Verify Configuration Files**:

Check all files exist and are valid:

- [ ] `.codebuddy/quality-config.json` → Valid JSON
- [ ] `.codebuddy/quality-baseline.json` → Valid JSON
- [ ] `.codebuddy/quality-trends.json` → Valid JSON
- [ ] `.git/hooks/pre-commit` → Executable
- [ ] `.codebuddy/settings.json` → CodeBuddy hook configured

**2. Run Initial Quality Check** (Optional):

Ask user: "Run initial quality check now?"

If yes:
```
/quality-assess <first-plan-file>
```

If no:
"Quality gate initialized successfully. First assessment will run when you execute your first plan."

---

## Output

After successful initialization, display:

```markdown
## ✅ Quality Gate Initialized Successfully

### Configuration Summary

**Project**: <detected project name>
**Type**: <detected project type>
**Language**: <detected language>

### Quality Gate Settings

- **Mode**: auto | manual | off
- **Strictness**: strict | moderate | lenient
- **Enabled Hooks**: Git pre-commit, CodeBuddy PreToolUse

### Quality Standards

- **Functionality**: 100% completion, high edge case coverage
- **Code Quality**: Max 50 lines/function, complexity ≤ 10
- **Testing**: Min 70% coverage, critical paths 90%
- **Linting**: 0 errors, max 10 warnings
- **Security**: No vulnerabilities, no secrets in code

### Next Steps

1. **Execute your first plan**:
   ```
   /execute .codebuddy/plan/your-first-plan.md
   ```

2. **Quality assessment will run automatically** (in auto mode)

3. **Review quality report** in `.codebuddy/quality-trends.json`

4. **Commit and push** - hooks will enforce quality gate

### Configuration Files

- `.codebuddy/quality-config.json` - Quality gate configuration
- `.codebuddy/quality-baseline.json` - Quality baseline
- `.codebuddy/quality-trends.json` - Quality trends
- `.git/hooks/pre-commit` - Git hook
- `.codebuddy/settings.json` - CodeBuddy hooks

### Modify Configuration

To modify settings later, edit:
```bash
nano .codebuddy/quality-config.json
```

Or re-run initialization:
```bash
/quality-init
```

### Disable Quality Gate

To disable quality gate temporarily:
```bash
# Edit .codebuddy/quality-config.json
{ "qualityGate": { "mode": "off" } }
```

For permanent removal, remove hooks:
```bash
rm .git/hooks/pre-commit
# Remove PreToolUse hook from .codebuddy/settings.json
```

---

## Quick Start Templates

### Template 1: New React/Next.js Project

```
/quality-init
# Select: Auto mode
# Select: Moderate strictness
# Accept defaults for standards
# Enable hooks
```

### Template 2: Existing Python Django Project

```
/quality-init
# Select: Manual mode (team reviews)
# Select: Moderate strictness
# Adjust: Min coverage to 80%
# Enable hooks
```

### Template 3: MVP / Prototype

```
/quality-init
# Select: Off mode (or Lenient)
# Select: Lenient strictness
# Adjust: Min coverage to 50%
# Skip hooks (optional)
```

---

## Troubleshooting

**Issue: "Hook not found"**
- Ensure `.codebuddy/scripts/` contains hook scripts
- Re-run installation script

**Issue: "Permission denied"**
- Make sure `.git/hooks/pre-commit` is executable
- Run: `chmod +x .git/hooks/pre-commit`

**Issue: "CodeBuddy hook not working"**
- Check `.codebuddy/settings.json` has PreToolUse hook
- Restart CodeBuddy session

---

## Notes

- **Backup**: Existing configuration files are backed up with `.backup` extension
- **Updates**: Running `/quality-init` again will update existing config
- **Defaults**: Press Enter to accept recommended defaults
- **Validation**: All configuration is validated before saving
