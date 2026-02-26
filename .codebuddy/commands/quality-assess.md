# Quality Assessment

Assess code quality after execution with automated checks and code reviewer evaluation.

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: Use **English** when interacting with tools/agents, communicate with user in their language
- **Comprehensive Assessment**: Evaluate quality from multiple dimensions (functionality, code quality, testing, documentation, integration)
- **Evidence-Based**: All scores must be based on actual check results and code review findings
- **Actionable**: Provide clear recommendations for improvement

---

## Execution Workflow

**Assess Plan**: $ARGUMENTS

---

### Phase 0: Initialization Check (NEW)

`[Mode: Check]`

**Check if quality gate is initialized**:

1. **Check Configuration Files**:

```bash
# Check if quality configuration exists
if [ ! -f ".codebuddy/quality-config.json" ]; then
    echo "❌ Quality gate not initialized"
    echo ""
    echo "To initialize quality gate for this project, run:"
    echo "  /quality-init"
    echo ""
    echo "This will guide you through:"
    echo "  - Project analysis (language, framework, tools)"
    echo "  - Quality gate mode selection (auto/manual/off)"
    echo "  - Strictness level configuration (strict/moderate/lenient)"
    echo "  - Quality standards setup (coverage, complexity, linting)"
    echo "  - Hook installation (git pre-commit, CodeBuddy hooks)"
    echo ""
    echo "After initialization, run /quality-assess again."
    exit 1
fi

if [ ! -f ".codebuddy/quality-baseline.json" ]; then
    echo "⚠️  Quality baseline not found"
    echo "  Creating default baseline based on project detection..."
fi

if [ ! -f ".codebuddy/quality-trends.json" ]; then
    echo "⚠️  Quality trends file not found"
    echo "  Creating new trends file..."
fi
```

2. **Create Missing Files** (if needed):

If baseline or trends files don't exist, create them with defaults:

```json
// quality-baseline.json (created if not exists)
{
  "project": {
    "name": "<detected from package.json or git config>",
    "type": "<detected: web/mobile/backend>",
    "language": "<detected: TypeScript/Python/Java/etc>",
    "framework": "<detected: React/Vue/Django/etc>"
  },
  "qualityStandards": {
    "functionality": { "targetScore": 100 },
    "codeQuality": { "targetScore": 100 },
    "testing": { "targetScore": 100 },
    "linting": { "targetScore": 100 },
    "security": { "targetScore": 100 }
  },
  "createdAt": "<current timestamp>",
  "version": "1.0"
}

// quality-trends.json (created if not exists)
{
  "assessments": [],
  "summary": {
    "totalAssessments": 0,
    "averageScore": 0
  },
  "metadata": {
    "version": "1.0",
    "createdAt": "<current timestamp>"
  }
}
```

3. **Load Configuration**:

Read `.codebuddy/quality-config.json`:
- Quality gate mode (auto/manual/off)
- Quality standards
- Tool support
- Rules

**If mode is "off"**:
- Skip all checks
- Return early with message: "Quality gate disabled"

---

### Phase 1: Load Execution Context

`[Mode: Prepare]`

1. **Read Plan Content**:
   - Parse plan file
   - Extract: task type, requirements, implementation steps, key files

2. **Load Quality Baseline**:
   - Read `.codebuddy/quality-baseline.json` (created in Phase 0 if not exists)
   - Parse quality standards
   - Use as baseline for comparison

3. **Get Changed Files**:
   - Use `git diff` to get list of changed files
   - If git not available, use plan's "Key Files" section
   - Collect file contents for analysis

4. **Load Quality Trends**:
   - Read `.codebuddy/quality-trends.json` (created in Phase 0 if not exists)
   - Calculate historical average scores
   - Prepare for trend comparison

---

### Phase 2: Automated Checks

`[Mode: Auto]`

Execute automated quality checks:

#### 2.1 Type Checking

```bash
# Detect framework and run type check
if [ -f "tsconfig.json" ]; then
  npx tsc --noEmit 2>&1
elif [ -f "go.mod" ]; then
  go build ./... 2>&1
elif [ -f "pom.xml" ]; then
  mvn compile 2>&1
fi
```

Collect results:
- TypeScript errors: `<count>`
- Warnings: `<count>`

#### 2.2 Linting

```bash
# Detect framework and run linter
if [ -f ".eslintrc.js" ] || grep -q "eslint" package.json; then
  npm run lint 2>&1
elif [ -f "pylintrc" ]; then
  pylint **/*.py 2>&1
fi
```

Collect results:
- Lint errors: `<count>`
- Lint warnings: `<count>`

#### 2.3 Test Coverage

```bash
# Detect framework and run coverage
if [ -f "jest.config.js" ] || grep -q "jest" package.json; then
  npm test -- --coverage --coverageReporters=json-summary
elif [ -f "vitest.config.ts" ]; then
  npx vitest run --coverage
elif [ -f "pytest.ini" ] || grep -q "pytest" pyproject.toml; then
  pytest --cov=src --cov-report=json
elif [ -f "go.mod" ]; then
  go test -coverprofile=coverage.out ./...
  go tool cover -func=coverage.out
fi
```

Collect results:
- Test coverage: `<percentage>%`
- Total tests: `<count>`
- Failed tests: `<count>`

#### 2.4 Build Verification

```bash
# Detect framework and run build
if [ -f "tsconfig.json" ]; then
  npm run build 2>&1
elif [ -f "package.json" ]; then
  npm run build 2>&1
fi
```

Collect results:
- Build status: `<success/failure>`
- Build errors: `<count>`

#### 2.5 Security Audit (Optional)

```bash
# Run security audit
if [ -f "package.json" ]; then
  npm audit --audit-level=high 2>&1
fi
```

Collect results:
- Vulnerabilities: `<count>`
- Severity: `<high/moderate/low>`

---

### Phase 3: Code Reviewer Assessment

`[Mode: Review]`

Call code-reviewer agent for comprehensive quality evaluation:

```
Task({
  subagent_name: "code-reviewer",
  description: "Quality assessment for implemented feature",
  prompt: "Please assess the quality of the following implementation:

Plan: <plan content>
Changed Files: <list of files with line numbers>
Changes: <git diff or summary>

Quality Standards from Baseline:
- Functionality: 100% requirement completion rate
- Code Quality: Max 50 lines/function, complexity ≤ 10
- Testing: Min 80% coverage, critical paths 100%
- Linting: 0 errors, max 10 warnings
- Security: No vulnerabilities, no secrets in code

Automated Check Results:
- TypeScript: <errors> errors, <warnings> warnings
- Lint: <errors> errors, <warnings> warnings
- Test Coverage: <percentage>%
- Build: <status>
- Security: <vulnerabilities> vulnerabilities (if checked)

Please evaluate on 5 dimensions:

1. **Functionality** (0-100)
   - Are all requirements implemented?
   - Are edge cases handled?
   - Is error handling comprehensive?
   Score: <score>/100
   Notes: <notes>

2. **Code Quality** (0-100)
   - Is code clean and readable?
   - Are functions reasonably sized?
   - Is complexity manageable?
   - Are there code smells?
   Score: <score>/100
   Notes: <notes>

3. **Test Coverage** (0-100)
   - Is test coverage adequate (≥80%)?
   - Are critical paths tested?
   - Are error scenarios covered?
   - Are edge cases tested?
   Score: <score>/100
   Notes: <notes>

4. **Documentation** (0-100)
   - Are key functions documented?
   - Are complex algorithms explained?
   - Are API contracts clear?
   - Are inline comments appropriate?
   Score: <score>/100
   Notes: <notes>

5. **Integration** (0-100)
   - Are there breaking changes?
   - Do existing tests pass?
   - Is backward compatibility maintained?
   - Are dependencies handled correctly?
   Score: <score>/100
   Notes: <notes>

CRITICAL ISSUES (Veto):
- 🔴 Security vulnerabilities
- 🔴 Missing functionality
- 🔴 Breaking changes
- 🔴 Type errors
- 🔴 Severe performance issues

Please list all critical issues found.

OUTPUT FORMAT:

## Quality Assessment Report

### Dimension Scores
- Functionality: <score>/100 - <status>
- Code Quality: <score>/100 - <status>
- Test Coverage: <score>/100 - <status>
- Documentation: <score>/100 - <status>
- Integration: <score>/100 - <status>

### Overall Quality Score
**<score>/100** <stars>

### Critical Issues
<list of critical issues or "None">

### Recommendations
<list of recommendations for improvement>

### Detailed Analysis
<dimension-by-dimension analysis with findings>
"
})
```

Wait for code-reviewer's complete assessment.

---

### Phase 4: Generate Quality Report

`[Mode: Report]`

Generate comprehensive quality report:

```markdown
## 质量评估报告

### 计划信息
- **计划名称**: <plan name>
- **计划文件**: <plan file path>
- **评估时间**: <timestamp>

### 综合评分
**<score>/100** <stars>

### 分项评分

| 维度 | 评分 | 标准 | 状态 |
|------|------|------|------|
| 功能完整性 | <score>/100 | 100% | <status> |
| 代码质量 | <score>/100 | Clean, ≤10 complexity | <status> |
| 测试覆盖 | <score>/100 | ≥80% | <status> |
| 文档完整性 | <score>/100 | Complete | <status> |
| 集成验证 | <score>/100 | No regressions | <status> |

### 自动化检查结果

| 检查项 | 结果 | 详情 |
|--------|------|------|
| TypeScript | <status> | <errors> errors, <warnings> warnings |
| Lint | <status> | <errors> errors, <warnings> warnings |
| 测试覆盖率 | <percentage>% | <total> tests, <failed> failed |
| Build | <status> | <details> |
| 安全审计 | <status> | <vulnerabilities> vulnerabilities |

### 关键问题

| 严重级别 | 问题 | 位置 | 建议 |
|----------|------|------|------|
| <severity> | <issue> | <file:line> | <recommendation> |

<critical issues list or "无关键问题">

### 改进建议

1. <recommendation 1>
2. <recommendation 2>
3. <recommendation 3>

### 质量趋势

<if trends available>
| 维度 | 本次 | 历史 | 趋势 |
|------|------|------|------|
| 整体 | <current>% | <average>% | <trend> |
| 功能完整性 | <current>% | <average>% | <trend> |
| 代码质量 | <current>% | <average>% | <trend> |
| 测试覆盖 | <current>% | <average>% | <trend> |
| 文档完整性 | <current>% | <average>% | <trend> |
| 集成验证 | <current>% | <average>% | <trend> |
</if>

### 最终结论

**状态**: <status>

**是否批准**: <yes/no>

**后续行动**:
- [ ] <action 1>
- [ ] <action 2>
- [ ] <action 3>

### 质量决策

| 评分范围 | 决策 | 行动 |
|----------|------|------|
| 90-100 | ✅ Pass | 可以继续/交付 |
| 80-89 | ✅ Pass | 可以继续/交付（有改进建议） |
| 70-79 | ⚠️ Conditional | 可以继续/交付（需要关注建议） |
| 60-69 | ⚠️ Require Fix | 建议修复后再继续 |
| <60 | ❌ Fail | 必须修复后重新评估 |

**关键问题否决**: <if any critical issues, reject regardless of score>
```

---

### Phase 5: Quality Decision & Actions

`[Mode: Decision]`

Based on quality score and critical issues:

#### 5.1 Score-Based Decision

| Score Range | Decision | Action |
|-------------|----------|--------|
| 90-100 | ✅ Pass | Continue/Approve |
| 80-89 | ✅ Pass | Continue/Approve (with recommendations) |
| 70-79 | ⚠️ Conditional | Continue (address recommendations) |
| 60-69 | ⚠️ Require Fix | Recommend fixes |
| <60 | ❌ Fail | Must fix and re-assess |

#### 5.2 Critical Issues Veto

**Reject immediately** if any critical issue exists:
- 🔴 Security vulnerabilities (high severity)
- 🔴 Missing functionality (core requirements not met)
- 🔴 Breaking changes
- 🔴 Type errors
- 🔴 Severe performance issues

#### 5.3 Action Output

**If decision is "Pass" or "Conditional"**:

```markdown
## ✅ 质量评估通过

综合评分: <score>/100 <stars>

**状态**: 可以继续/交付

**改进建议**:
<list of recommendations>

下一步:
- 继续当前工作流
- 或根据改进建议优化代码
```

**If decision is "Require Fix" or "Fail"**:

```markdown
## ⚠️/❌ 质量评估未通过

综合评分: <score>/100 <stars>

**状态**: <status>

### 必须修复
<list of critical and required fixes>

### 建议修复
<list of recommended fixes>

### 修复后重新评估

运行以下命令重新评估:
```
/quality-assess <plan-file>
```

或修复问题后，质量评估将自动更新。
```

---

### Phase 6: Update Quality Trends

`[Mode: Update]`

Save quality assessment results to trends file:

```javascript
// Read current trends
const trends = readJson('.codebuddy/quality-trends.json');

// Add execution record
trends.executions.push({
  planName: <plan name>,
  timestamp: <ISO timestamp>,
  score: <overall score>,
  dimensions: {
    functionality: <score>,
    codeQuality: <score>,
    testing: <score>,
    documentation: <score>,
    integration: <score>
  },
  automatedChecks: {
    typescript: <result>,
    lint: <result>,
    testCoverage: <result>,
    build: <result>
  }
});

// Calculate trends
trends.trends = calculateTrends(trends.executions);

// Save updated trends
writeJson('.codebuddy/quality-trends.json', trends);
```

Trend calculation:
- Overall: moving average of last 10 executions
- Per-dimension: same as overall
- Trend indicator: ↑ (improving), → (stable), ↓ (declining)

---

## Focus Areas

When assessing quality, pay special attention to:

1. **Functions with complex branching** (high cyclomatic complexity)
2. **Error handlers and catch blocks** (comprehensive coverage)
3. **Utility functions used across codebase** (critical paths)
4. **API endpoint handlers** (request → response flow)
5. **Edge cases**: null, undefined, empty string, empty array, zero, negative numbers

---

## Usage Examples

### Example 1: Assess After Execution

```bash
# After multi-execute completes
/quality-assess .codebuddy/plan/user-registration.md

# Output:
## 质量评估报告

### 综合评分
**85/100** ⭐⭐⭐⭐

### 分项评分
| 维度 | 评分 | 状态 |
|------|------|------|
| 功能完整性 | 90/100 | ✅ |
| 代码质量 | 85/100 | ✅ |
| 测试覆盖 | 78/100 | ⚠️ |
| 文档完整性 | 90/100 | ✅ |
| 集成验证 | 90/100 | ✅ |

### 最终结论
**状态**: ✅ Pass
```

### Example 2: Assess with Critical Issues

```bash
/quality-assess .codebuddy/plan/payment-processing.md

# Output:
## ⚠️ 质量评估未通过

### 关键问题
| 严重级别 | 问题 | 位置 |
|----------|------|------|
| 🔴 Security vulnerability | XSS in payment form | src/components/PaymentForm.ts:45 |
| 🔴 Type error | Type mismatch | src/api/payment.ts:23 |

### 最终结论
**状态**: ❌ Fail
**必须修复**: Security vulnerability, Type error
```

---

## Notes

- This command only assesses quality, does not modify code
- Quality trends are tracked in `.codebuddy/quality-trends.json`
- Baseline standards can be customized in `.codebuddy/quality-baseline.json`
- Critical issues result in automatic "Fail" decision regardless of score
