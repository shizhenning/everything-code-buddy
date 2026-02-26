# 质量评估系统集成指南

## 概述

将质量评估方案集成到现有的 multi-plan 和 multi-execute 命令中，确保每个计划的执行都经过严格的质量检查。

---

## 集成架构

### 整体流程图

```
用户请求
    ↓
multi-plan (生成计划)
    ↓
multi-execute (执行计划)
    ├─→ Phase 0: 读取计划
    ├─→ Phase 1: 上下文检索
    ├─→ Phase 2: 分析规划
    ├─→ Phase 3: 实施
    ├─→ Phase 4: 代码审查
    ├─→ Phase 4.5: 质量评估 (新增) ⭐
    │   ├─→ 自动化检查
    │   ├─→ code-reviewer 深度评估
    │   ├─→ 生成质量报告
    │   └─→ 质量决策
    └─→ Phase 5: 交付
```

---

## 文档修改清单

### 1. multi-execute.md 修改

在 `d:\UGit\everything-codebuddy\.codebuddy\commands\multi-execute.md` 中添加：

#### 1.1 在 Phase 4 之后添加 Phase 4.5

```markdown
### Phase 4.5: Quality Assessment

`[Mode: Assess]`

After code review is complete, perform quality assessment.

#### 4.5.1 Run Automated Checks

Execute automated quality checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Unit tests with coverage
npm test -- --coverage

# Build verification
npm run build

# Security audit (optional)
npm audit
```

Collect results:
- TypeScript errors: <count>
- Lint errors: <count>
- Test coverage: <percentage>%
- Build status: <status>

#### 4.5.2 Call code-reviewer for Quality Assessment

```
Task({
  subagent_name: "code-reviewer",
  description: "Quality assessment",
  prompt: "Please assess the quality of the following implementation:

Plan: <plan content>
Changed Files: <list of files>
Changes: <git diff or summary>
Auto-Check Results:
  - TypeScript: <errors> errors, <warnings> warnings
  - Lint: <errors> errors
  - Test Coverage: <percentage>%
  - Build: <status>

Evaluate on 5 dimensions:
1. Functionality - Are all requirements implemented?
2. Code Quality - Is code clean, maintainable, performant?
3. Test Coverage - Is test coverage adequate (≥80%)?
4. Documentation - Is documentation complete?
5. Integration - Any regressions?

OUTPUT:
Quality Score (0-100): <score>
Critical Issues: <list>
Recommendations: <list>
Overall Assessment: <pass/fail/conditional>"
})
```

#### 4.5.3 Generate Quality Report

Generate quality report in format specified in `quality-assessment-scheme.md`:

```markdown
## 质量评估报告

### 计划信息
- 计划名称: <plan name>
- 计划文件: <plan file>

### 综合评分
**<score>/100** <stars>

### 分项评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整性 | <score>/100 | <status> |
| 代码质量 | <score>/100 | <status> |
| 测试覆盖 | <score>/100 | <status> |
| 文档完整性 | <score>/100 | <status> |
| 集成验证 | <score>/100 | <status> |

### 自动化检查结果

| 检查项 | 结果 | 详情 |
|--------|------|------|
| TypeScript | <status> | <details> |
| Lint | <status> | <details> |
| 测试覆盖率 | <percentage>% | <details> |
| Build | <status> | <details> |

### 关键问题

| 严重级别 | 问题 | 建议 |
|----------|------|------|
| <severity> | <issue> | <recommendation> |

### 最终结论

**状态**: <status>

**是否批准**: <yes/no>

**后续行动**:
- [ ] <action 1>
- [ ] <action 2>
```

#### 4.5.4 Quality Decision

Based on quality score and critical issues:

| Score Range | Decision | Action |
|-------------|----------|--------|
| 90-100 | ✅ Pass | Continue to Phase 5 |
| 80-89 | ✅ Pass | Continue to Phase 5 |
| 70-79 | ⚠️ Conditional | Pass with recommendations |
| 60-69 | ⚠️ Require Fix | Require fixes before approval |
| <60 | ❌ Fail | Must fix and re-assess |

**Critical Issues Veto**:
Reject immediately if any critical issue exists:
- 🔴 Security vulnerabilities
- 🔴 Missing functionality
- 🔴 Severe performance issues
- 🔴 Type errors
- 🔴 Breaking changes

**If decision is "Fail" or "Require Fix"**:

Stop execution and report:

```markdown
## 质量评估未通过

### 问题摘要
<summary of issues>

### 必须修复
<list of required fixes>

### 修复后重新评估
用户可以运行:
/execute <plan-file> --retry

或修复问题后继续执行。
```
```

#### 1.2 在 Phase 4.2 之前添加质量评估调用

```markdown
#### 4.1 Code Review
(现有内容)

#### 4.5: Quality Assessment
(新增内容 - 见上)

#### 4.2 Delivery Confirmation
(现有内容 - 仅在质量评估通过后执行)
```

#### 1.3 添加质量基线读取逻辑

在 Phase 0 之前添加：

```markdown
### Pre-Phase: Read Quality Baseline

`[Mode: Prepare]`

1. **Read Project Quality Baseline**:
   - Check if `.codebuddy/quality-baseline.json` exists
   - If exists, read and parse
   - If not exists, use default baseline

2. **Load Quality Standards**:
   ```json
   {
     "qualityStandards": {
       "functionality": { "requirementCompletionRate": 100 },
       "codeQuality": { "maxFunctionLines": 50 },
       "testing": { "minCoverage": 80 },
       "linting": { "maxLintErrors": 0 }
     }
   }
   ```

3. **Use Baseline in Assessment**:
   - Compare actual results against baseline
   - Flag deviations
   - Customize quality thresholds per project
```

---

### 2. multi-plan.md 修改

在 `d:\UGit\everything-codebuddy\.codebuddy\commands\multi-plan.md` 中添加：

#### 2.1 在计划模板中添加质量标准

```markdown
### Phase 2.4: Generate Implementation Plan

在计划模板中添加 "质量标准" 部分：

```markdown
## Implementation Plan: <Task Name>

### Task Type
- [ ] Frontend
- [ ] Backend
- [ ] Fullstack

### Technical Solution
<Optimal solution>

### Implementation Steps
1. <Step 1> - Expected deliverable
2. <Step 2> - Expected deliverable
...

### Key Files
| File | Operation | Description |
|------|-----------|-------------|
| path/to/file.ts:L10-L50 | Modify | Description |

### Quality Standards (新增)
| 维度 | 标准 | 验收标准 |
|------|------|----------|
| 功能完整性 | 100% | 所有需求必须实现 |
| 代码质量 | 遵循规范 | 无 ESLint 错误 |
| 测试覆盖 | ≥80% | 核心逻辑 100% |
| 文档完整性 | 完善 | 关键函数有注释 |
| 集成验证 | 无回归 | 现有测试通过 |

### Risks and Mitigation
| Risk | Mitigation |
|------|------------|
```

#### 2.2 在 Phase 2.3 中添加质量考虑

```markdown
#### 2.3 (Optional but Recommended) Dual-Agent Plan Draft

在提示词中添加质量要求：

**Backend Plan Draft**:
```
Task({
  subagent_name: "architect",
  description: "Draft backend implementation plan",
  prompt: "Please draft a step-by-step backend implementation plan for:

Requirement: <enhanced requirement>
Context: <retrieved project context>
Backend Analysis: <result from 2.1>

Focus on:
- Data flow and architecture
- Edge cases and error handling
- Test strategy
- Security considerations
- Performance optimization
- **Quality considerations: code maintainability, testing coverage, documentation**

OUTPUT: Step-by-step plan with pseudo-code. DO NOT modify any files."
})
```
```

---

## 新增配置文件

### 1. .codebuddy/quality-baseline.json

```json
{
  "projectName": "my-project",
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
      "minCoverage": 80,
      "criticalCoverage": 100,
      "requireUnitTests": true,
      "requireIntegrationTests": false
    },
    "linting": {
      "maxLintErrors": 0,
      "maxLintWarnings": 5
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
  "createdAt": "2026-02-26",
  "version": "1.0"
}
```

### 2. .codebuddy/quality-gate.json

```json
{
  "qualityGate": {
    "enabled": true,
    "rules": [
      {
        "check": "typescript",
        "operator": "==",
        "value": "0",
        "onFailure": "block",
        "description": "TypeScript errors must be zero"
      },
      {
        "check": "testCoverage",
        "operator": ">=",
        "value": "80",
        "onFailure": "warn",
        "description": "Test coverage should be at least 80%"
      },
      {
        "check": "lintErrors",
        "operator": "==",
        "value": "0",
        "onFailure": "block",
        "description": "Lint errors must be zero"
      },
      {
        "check": "securityVulnerabilities",
        "operator": "==",
        "value": "0",
        "onFailure": "block",
        "description": "Security vulnerabilities must be zero"
      }
    ]
  }
}
```

### 3. .codebuddy/quality-trends.json

```json
{
  "executions": [],
  "trends": {
    "overall": 0,
    "functionality": 0,
    "codeQuality": 0,
    "testing": 0,
    "documentation": 0,
    "integration": 0
  },
  "createdAt": "2026-02-26"
}
```

---

## 实施步骤

### Step 1: 准备阶段

```bash
# 1. 创建配置文件目录
mkdir -p .codebuddy/plan

# 2. 初始化质量基线
cat > .codebuddy/quality-baseline.json << 'EOF'
{
  "projectName": "$(basename $(pwd))",
  "qualityStandards": {
    "functionality": { "requirementCompletionRate": 100 },
    "codeQuality": { "maxFunctionLines": 50 },
    "testing": { "minCoverage": 80 },
    "linting": { "maxLintErrors": 0 },
    "security": { "noVulnerabilities": true }
  },
  "tools": {
    "typescript": true,
    "eslint": true,
    "jest": true
  }
}
EOF

# 3. 初始化质量门禁
cat > .codebuddy/quality-gate.json << 'EOF'
{
  "qualityGate": {
    "enabled": true,
    "rules": [
      {
        "check": "typescript",
        "operator": "==",
        "value": "0",
        "onFailure": "block"
      },
      {
        "check": "lintErrors",
        "operator": "==",
        "value": "0",
        "onFailure": "block"
      }
    ]
  }
}
EOF

# 4. 初始化质量趋势
cat > .codebuddy/quality-trends.json << 'EOF'
{
  "executions": [],
  "trends": {
    "overall": 0,
    "functionality": 0,
    "codeQuality": 0,
    "testing": 0,
    "documentation": 0,
    "integration": 0
  }
}
EOF
```

### Step 2: 修改命令文档

```bash
# 修改 multi-execute.md
# 在 Phase 4 之后添加 Phase 4.5
# 参考上文 "1. multi-execute.md 修改" 部分

# 修改 multi-plan.md
# 在计划模板中添加质量标准部分
# 参考上文 "2. multi-plan.md 修改" 部分
```

### Step 3: 验证工具链

```bash
# 检查工具是否可用
npm list typescript eslint pretttier jest

# 如果缺失，安装工具
npm install --save-dev typescript eslint prettier jest @types/jest
```

### Step 4: 配置工具（如果项目未配置）

```bash
# TypeScript 配置
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true
  }
}
EOF

# ESLint 配置
cat > .eslintrc.js << 'EOF'
module.exports = {
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020
  }
};
EOF

# Jest 配置
cat > jest.config.js << 'EOF'
module.exports = {
  coverageThreshold: {
    global: {
      lines: 80
    }
  }
};
EOF
```

### Step 5: 更新 package.json 脚本

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --check .",
    "format:fix": "prettier --write .",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "build": "tsc",
    "audit": "npm audit",
    "quality:check": "npm run typecheck && npm run lint && npm test && npm run build"
  }
}
```

---

## 使用示例

### 示例 1: 单计划执行

```bash
# 用户执行计划
/execute .codebuddy/plan/user-registration.md

# multi-execute 执行流程
Phase 0: 读取计划 ✓
Phase 1: 上下文检索 ✓
Phase 2: 分析规划 ✓
Phase 3: 实施 ✓
Phase 4: 代码审查 ✓
Phase 4.5: 质量评估 ✓ (新增)
  - 运行自动化检查
  - code-reviewer 评估
  - 生成质量报告
  - 质量决策
Phase 5: 交付 ✓

# 输出示例
```

## 执行完成

### 变更摘要
| File | Operation | Description |
|------|-----------|-------------|
| src/models/User.ts | Create | 用户模型 |
| src/api/register.ts | Create | 注册接口 |

### 质量评估结果
- 综合评分: 85/100 ⭐⭐⭐⭐
- 状态: ✅ 通过

### 分项评分
| 维度 | 评分 | 状态 |
|------|------|------|
| 功能完整性 | 90/100 | ✅ |
| 代码质量 | 85/100 | ✅ |
| 测试覆盖 | 78/100 | ⚠️ |
| 文档完整性 | 90/100 | ✅ |
| 集成验证 | 90/100 | ✅ |

### 自动化检查
- TypeScript: ✅ Pass (0 errors)
- Lint: ✅ Pass (0 errors)
- 测试覆盖率: ⚠️ 78% (目标: 80%)
- Build: ✅ Pass

### 改进建议
- [ ] 提升测试覆盖率至 80% 以上（可选）
```

### 示例 2: 批量执行

```bash
# 用户执行总计划
/execute .codebuddy/plan/user-authentication-master.md

# 批量执行流程
Phase 0: 识别为总计划 ✓
Phase 0.5: 批量执行初始化 ✓
  - 解析子计划: 4个
  - 构建依赖图
  - 确定执行顺序
Phase 1-4.5: 执行子计划1 (用户注册) ✓
Phase 1-4.5: 执行子计划2 (用户登录) ✓
Phase 1-4.5: 执行子计划3 (密码重置) ✓
Phase 1-4.5: 执行子计划4 (用户资料管理) ✓
Phase 6: 批量完成报告 ✓
Phase 6.5: 批量质量评估 ✓ (新增)

# 最终输出
```

## 批量执行完成

### 执行摘要
| 指标 | 值 |
|------|-----|
| 子计划数 | 4 |
| 成功 | 4 |
| 平均质量评分 | 87/100 |
| 整体状态 | ✅ 通过 |

### 质量趋势
| 维度 | 平均分 | 趋势 |
|------|--------|------|
| 功能完整性 | 90/100 | ✅ |
| 代码质量 | 85/100 | ✅ |
| 测试覆盖 | 78/100 | ⚠️ |
| 文档完整性 | 90/100 | ✅ |
| 集成验证 | 92/100 | ✅ |

### 改进建议
1. 提升整体测试覆盖率至 80% 以上
2. 重构 `password-reset` 中的 `sendEmail` 函数
```

### 示例 3: 质量不通过

```bash
# 用户执行计划
/execute .codebuddy/plan/user-registration.md

# 执行到 Phase 4.5 发现质量问题
```

## 质量评估未通过 ❌

### 问题摘要
发现 1 个关键问题

### 必须修复
- 🔴 TypeScript 错误: src/api/register.ts:15 - Type 'string' is not assignable to type 'number'

### 自动化检查结果
- TypeScript: ❌ Fail (1 error)
- Lint: ✅ Pass (0 errors)
- 测试覆盖率: ⚠️ 75% (目标: 80%)

### 下一步
修复类型错误后，运行:
/execute .codebuddy/plan/user-registration.md --retry

或直接修复问题，系统会自动重试评估。
```

---

## 质量评估 API（伪代码）

```javascript
// .codebuddy/scripts/quality-assessment.js

class QualityAssessment {
  constructor(baseline) {
    this.baseline = baseline;
    this.results = {};
  }

  // 运行自动化检查
  async runAutomatedChecks() {
    const results = {
      typescript: await this.checkTypeScript(),
      lint: await this.checkLint(),
      testCoverage: await this.checkTestCoverage(),
      build: await this.checkBuild(),
      security: await this.checkSecurity()
    };
    return results;
  }

  // 评估代码质量
  async assessQuality(plan, changes, autoResults) {
    const assessment = {
      functionality: this.assessFunctionality(plan, changes),
      codeQuality: this.assessCodeQuality(changes),
      testing: this.assessTesting(autoResults.testCoverage),
      documentation: this.assessDocumentation(changes),
      integration: this.assessIntegration(autoResults)
    };

    const overallScore = this.calculateOverallScore(assessment);
    const decision = this.makeDecision(assessment, autoResults);

    return {
      score: overallScore,
      dimensions: assessment,
      autoResults: autoResults,
      decision: decision
    };
  }

  // 计算综合评分
  calculateOverallScore(assessment) {
    const weights = {
      functionality: 0.3,
      codeQuality: 0.25,
      testing: 0.2,
      documentation: 0.1,
      integration: 0.15
    };

    return Object.keys(assessment).reduce((total, key) => {
      return total + assessment[key].score * weights[key];
    }, 0);
  }

  // 质量决策
  makeDecision(assessment, autoResults) {
    // 检查关键问题（一票否决）
    if (autoResults.typescript.errors > 0) return 'fail';
    if (autoResults.lint.errors > 0) return 'fail';
    if (autoResults.security.vulnerabilities > 0) return 'fail';

    const overallScore = this.calculateOverallScore(assessment);

    if (overallScore >= 80) return 'pass';
    if (overallScore >= 70) return 'conditional';
    if (overallScore >= 60) return 'require-fix';
    return 'fail';
  }

  // 生成质量报告
  generateReport(assessment, autoResults) {
    // 生成 Markdown 格式的质量报告
    // 参考质量评估方案中的格式
  }

  // 保存质量趋势
  saveTrends(executionData) {
    const trendsFile = '.codebuddy/quality-trends.json';
    const trends = readJson(trendsFile);
    trends.executions.push(executionData);
    trends.trends = this.calculateTrends(trends.executions);
    writeJson(trendsFile, trends);
  }
}

// 使用示例
const baseline = readJson('.codebuddy/quality-baseline.json');
const qa = new QualityAssessment(baseline);

const autoResults = await qa.runAutomatedChecks();
const assessment = await qa.assessQuality(plan, changes, autoResults);
const report = qa.generateReport(assessment, autoResults);

console.log(report);
```

---

## 集成检查清单

### 部署前检查

- [ ] 创建 `.codebuddy/quality-baseline.json`
- [ ] 创建 `.codebuddy/quality-gate.json`
- [ ] 创建 `.codebuddy/quality-trends.json`
- [ ] 修改 `multi-execute.md` 添加 Phase 4.5
- [ ] 修改 `multi-plan.md` 添加质量标准
- [ ] 验证工具链可用（TypeScript, ESLint, Jest）
- [ ] 配置 package.json 脚本
- [ ] 运行测试验证集成

### 功能验证

- [ ] 执行单计划，确认质量评估运行
- [ ] 验证自动化检查正确运行
- [ ] 验证 code-reviewer 被调用
- [ ] 验证质量报告正确生成
- [ ] 验证质量决策正确执行
- [ ] 验证不通过时的错误处理
- [ ] 执行批量计划，确认聚合评估

---

## 潜在问题和解决方案

### 问题 1: 工具未安装

**问题**: 项目缺少必要的质量检查工具

**解决**:
```bash
npm install --save-dev typescript eslint prettier jest @types/jest
```

### 问题 2: 质量基线不存在

**问题**: `.codebuddy/quality-baseline.json` 不存在

**解决**: 自动使用默认基线，提示用户创建自定义基线

### 问题 3: 测试覆盖率低

**问题**: 项目没有测试或测试覆盖率低

**解决**:
- 设置更低的初始阈值（如 60%）
- 逐步提升至 80%
- 使用 `require-fix` 模式而非 `fail`

### 问题 4: 执行时间过长

**问题**: 质量检查增加执行时间

**解决**:
- 并行运行多个检查
- 缓存测试结果
- 可选跳过某些检查（`--skip-quality`）

---

## 总结

### 集成要点

1. **在 multi-execute.md 中添加 Phase 4.5** - 质量评估流程
2. **在 multi-plan.md 中添加质量标准** - 计划模板包含质量要求
3. **创建三个配置文件** - 质量基线、质量门禁、质量趋势
4. **配置工具链** - TypeScript, ESLint, Jest 等
5. **更新 package.json** - 添加质量检查脚本

### 关键特性

- **无缝集成** - 不影响现有功能
- **可配置** - 项目可自定义质量标准
- **自动化** - 自动检查和评估
- **可追溯** - 记录质量趋势
- **可扩展** - 易于添加新的检查项

### 向后兼容

- 单计划执行保持不变
- 现有命令格式不变
- 质量检查失败时可以跳过（`--skip-quality`）

---

集成完成后，每个计划执行都会自动经过严格的质量评估，确保代码质量符合项目标准。
