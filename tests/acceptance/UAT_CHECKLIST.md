# User Acceptance Test (UAT) Checklist

## Overview

This checklist guides users through validating the Everything Claude Code (ECC) → CodeBuddy migration.

## Prerequisites

- [ ] CodeBuddy v2.50+ installed
- [ ] ECC project cloned
- [ ] Migration script executed: `node scripts/migrate-to-codebuddy.js`
- [ ] Environment variables configured:
  - [ ] `CODEBUDDY_PROJECT_DIR` set
  - [ ] `CODEBUDDY_PLUGIN_ROOT` set (optional)

---

## 1. Installation Verification

### 1.1 Directory Structure

- [ ] `.codebuddy/` directory exists
- [ ] `.codebuddy/agents/` contains agent files
- [ ] `.codebuddy/commands/` contains command files
- [ ] `.codebuddy/skills/` contains skill directories
- [ ] `.codebuddy/hooks/` contains hook scripts
- [ ] `.codebuddy/plugin.json` exists

### 1.2 Component Counts

```bash
# Verify counts
ls -1 .codebuddy/agents/*.md | wc -l    # Expect: 13+
ls -1 .codebuddy/commands/*.md | wc -l   # Expect: 31
find .codebuddy/skills -name "SKILL.md" | wc -l  # Expect: 37+
```

- [ ] Agents count correct (13+)
- [ ] Commands count correct (31)
- [ ] Skills count correct (37+)

---

## 2. Functional Acceptance

### 2.1 Agent Delegation

**Test**: Ask CodeBuddy to delegate to an agent

```bash
codebuddy "Use the planner agent to create a plan for user authentication"
```

**Acceptance Criteria**:
- [ ] Planner agent is invoked
- [ ] Plan is generated and displayed
- [ ] No errors in logs

### 2.2 Command Execution

**Test**: Run core commands

```bash
codebuddy /plan "Implement Stripe subscription"
codebuddy /tdd
codebuddy /code-review
```

**Acceptance Criteria**:
- [ ] Commands execute without errors
- [ ] Output matches command descriptions
- [ ] All commands complete successfully

### 2.3 Skill Loading

**Test**: Request skill application

```bash
codebuddy "Apply frontend-patterns skill to optimize this component"
```

**Acceptance Criteria**:
- [ ] Skill is recognized
- [ ] Skill guidelines are applied in response
- [ ] No skill loading errors

### 2.4 Hook Triggers

**Test**: Trigger hooks through actions

```bash
# Create a file (triggers PostToolUse)
echo "test" > test-hook.txt

# Delete the file (triggers another hook)
rm test-hook.txt
```

**Acceptance Criteria**:
- [ ] Hooks execute without errors
- [ ] Hook logs are created (if configured)
- [ ] No hook failures in console

### 2.5 Observer Agent

**Test**: Observer captures session data

```bash
# Start a CodeBuddy session
codebuddy "Write a simple function and review it"

# Exit and check observer
cat .codebuddy/sessions/reports/session_*.md
```

**Acceptance Criteria**:
- [ ] Observer hooks are configured
- [ ] Session data is captured
- [ ] Observation report is generated

### 2.6 Continuous Learning v2

**Test**: Instinct CLI works

```bash
# Check status
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status

# Evolve instincts (if any)
python3 "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve
```

**Acceptance Criteria**:
- [ ] Instinct CLI executes without errors
- [ ] CodeBuddyPaths class is used
- [ ] Environment variables are recognized

---

## 3. Configuration Validation

### 3.1 plugin.json

**Test**: Validate plugin configuration

```bash
cat .codebuddy/plugin.json | jq '.'
```

**Acceptance Criteria**:
- [ ] JSON is valid
- [ ] `name` field present
- [ ] `version` field present
- [ ] `commands` array populated
- [ ] `agents` array populated

### 3.2 hooks.json

**Test**: Validate hook configuration

```bash
cat .codebuddy/hooks/hooks.json | jq '.'
```

**Acceptance Criteria**:
- [ ] JSON is valid
- [ ] PreToolUse hooks configured
- [ ] PostToolUse hooks configured
- [ ] Stop hooks configured
- [ ] Observer hooks present
- [ ] `${CODEBUDDY_PLUGIN_ROOT}` used in paths

### 3.3 Environment Variables

**Test**: Verify environment variables

```bash
echo $CODEBUDDY_PROJECT_DIR
echo $CODEBUDDY_PLUGIN_ROOT
```

**Acceptance Criteria**:
- [ ] `CODEBUDDY_PROJECT_DIR` is set (or defaults to CWD)
- [ ] `CODEBUDDY_PLUGIN_ROOT` is set (optional, or uses default)

---

## 4. Performance Validation

### 4.1 Startup Time

**Test**: Measure CodeBuddy startup

```bash
time codebuddy --help
```

**Acceptance Criteria**:
- [ ] Startup completes in < 5 seconds
- [ ] No warnings about missing components

### 4.2 Command Response Time

**Test**: Execute commands and measure response

```bash
time codebuddy /plan "Simple task"
```

**Acceptance Criteria**:
- [ ] Commands execute in reasonable time
- [ ] No excessive delays (> 30s for simple tasks)

### 4.3 Memory Usage

**Test**: Monitor memory during session

**Acceptance Criteria**:
- [ ] Memory usage remains stable
- [ ] No memory leaks detected
- [ ] Context compaction works (if enabled)

---

## 5. Cross-Platform Validation

### 5.1 Windows Compatibility

**Test**: Run on Windows (PowerShell / Git Bash)

**Acceptance Criteria**:
- [ ] CodeBuddy starts without errors
- [ ] Hook scripts execute (Node.js)
- [ ] Path separators handled correctly
- [ ] Junction links work (if used)

### 5.2 Unix Compatibility

**Test**: Run on Linux / macOS

**Acceptance Criteria**:
- [ ] CodeBuddy starts without errors
- [ ] Symlinks work (if used)
- [ ] Hook scripts execute
- [ ] Path separators handled correctly

---

## 6. Documentation Validation

### 6.1 Migration Guide

**Test**: Read migration guide

```bash
cat docs/CODEBUDDY_MIGRATION_GUIDE.md
```

**Acceptance Criteria**:
- [ ] Guide is comprehensive
- [ ] All steps are clear
- [ ] Examples are accurate
- [ ] Continuous Learning v2 section present

### 6.2 Windows Compatibility Guide

**Test**: Read Windows guide

```bash
cat docs/WINDOWS_COMPATIBILITY.md
```

**Acceptance Criteria**:
- [ ] Windows-specific instructions are clear
- [ ] Troubleshooting section helpful
- [ ] Path handling explained

### 6.3 README and CODEBUDDY.md

**Test**: Read main documentation

**Acceptance Criteria**:
- [ ] README.md is updated
- [ ] CODEBUDDY.md is comprehensive
- [ ] Links are valid

---

## 7. Error Handling

### 7.1 Missing Agent

**Test**: Request non-existent agent

```bash
codebuddy "Delegate to nonexistent-agent"
```

**Acceptance Criteria**:
- [ ] Clear error message
- [ ] Suggestion of available agents
- [ ] No crash

### 7.2 Missing Command

**Test**: Run non-existent command

```bash
codebuddy /nonexistent
```

**Acceptance Criteria**:
- [ ] Clear error message
- [ ] Suggestion of available commands
- [ ] No crash

### 7.3 Hook Failure

**Test**: Force a hook error (optional)

**Acceptance Criteria**:
- [ ] Error is logged
- [ ] Session continues (non-critical hooks)
- [ ] Clear error message

---

## 8. Integration Validation

### 8.1 MCP Servers

**Test**: Configure and test MCP servers

**Acceptance Criteria**:
- [ ] MCP servers load (if configured)
- [ ] MCP tools are available
- [ ] MCP connections work

### 8.2 Git Integration

**Test**: Use CodeBuddy in a git repo

**Acceptance Criteria**:
- [ ] Git commands work
- [ ] Git hooks don't interfere
- [ ] Session management works

---

## Sign-Off

### Tester Information

- **Name**: __________________________
- **Date**: __________________________
- **CodeBuddy Version**: __________
- **OS**: __________________________

### Test Results

- **Total Tests**: ___
- **Passed**: ___
- **Failed**: ___
- **Pass Rate**: ___%

### Overall Assessment

- [ ] **Ready for Production** - All critical tests passed
- [ ] **Ready with Reservations** - Minor issues, non-blocking
- [ ] **Not Ready** - Critical issues found

### Comments

_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________

### Approval

- [ ] **Approved by Developer**
- [ ] **Approved by QA**
- [ ] **Approved by Tech Lead**

---

## Appendix: Quick Test Script

```bash
#!/usr/bin/env bash

echo "=== ECC → CodeBuddy UAT Quick Test ==="

# 1. Directory structure
echo "[1/8] Checking directory structure..."
[ -d .codebuddy ] && echo "✓ .codebuddy exists" || echo "✗ .codebuddy missing"
[ -d .codebuddy/agents ] && echo "✓ agents exists" || echo "✗ agents missing"
[ -d .codebuddy/commands ] && echo "✓ commands exists" || echo "✗ commands missing"
[ -d .codebuddy/skills ] && echo "✓ skills exists" || echo "✗ skills missing"

# 2. Plugin config
echo "[2/8] Checking plugin.json..."
jq -e '.name' .codebuddy/plugin.json > /dev/null 2>&1 && echo "✓ plugin.json valid" || echo "✗ plugin.json invalid"

# 3. Hooks config
echo "[3/8] Checking hooks.json..."
jq -e '.hooks.PreToolUse' .codebuddy/hooks/hooks.json > /dev/null 2>&1 && echo "✓ hooks.json valid" || echo "✗ hooks.json invalid"

# 4. Agent count
echo "[4/8] Counting agents..."
AGENT_COUNT=$(ls -1 .codebuddy/agents/*.md 2>/dev/null | wc -l)
echo "Agents: $AGENT_COUNT (expected: 13+)"

# 5. Command count
echo "[5/8] Counting commands..."
CMD_COUNT=$(ls -1 .codebuddy/commands/*.md 2>/dev/null | wc -l)
echo "Commands: $CMD_COUNT (expected: 31)"

# 6. Skill count
echo "[6/8] Counting skills..."
SKILL_COUNT=$(find .codebuddy/skills -name "SKILL.md" 2>/dev/null | wc -l)
echo "Skills: $SKILL_COUNT (expected: 37+)"

# 7. Environment variables
echo "[7/8] Checking environment..."
[ -n "$CODEBUDDY_PROJECT_DIR" ] && echo "✓ CODEBUDDY_PROJECT_DIR set" || echo "⚠ CODEBUDDY_PROJECT_DIR not set"
[ -n "$CODEBUDDY_PLUGIN_ROOT" ] && echo "✓ CODEBUDDY_PLUGIN_ROOT set" || echo "⚠ CODEBUDDY_PLUGIN_ROOT not set"

# 8. Test observer script
echo "[8/8] Testing observer script..."
[ -f .codebuddy/hooks/observe.js ] && echo "✓ observe.js exists" || echo "✗ observe.js missing"

echo "=== UAT Quick Test Complete ==="
```

Save as `tests/acceptance/quick-test.sh` and run with `bash tests/acceptance/quick-test.sh`.
