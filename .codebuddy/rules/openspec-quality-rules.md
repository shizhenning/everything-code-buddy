---
ruleName: openspec-quality-rules
ruleScope: project
ruleType: always
ruleDescription: OpenSpec工件质量检查规则
---

# OpenSpec 工件质量检查规则

这些规则适用于创建或修改OpenSpec工件(proposal.md, design.md, tasks.md, specs/)时。

## 通用规则

### 1. 文件结构完整性

**规则**: 每个OpenSpec变更必须包含所有核心工件

**检查项**:
- ✅ `openspec/changes/<change-name>/proposal.md` 存在
- ✅ `openspec/changes/<change-name>/design.md` 存在
- ✅ `openspec/changes/<change-name>/tasks.md` 存在
- ✅ `openspec/changes/<change-name>/specs/` 目录存在
- ✅ `openspec/changes/<change-name>/.plan-mapping.md` 存在

**失败条件**: 任何一个核心工件缺失

---

### 2. 链接完整性

**规则**: 三层链接机制必须完整且有效

**检查项**:
- ✅ 前向引用: 计划文件包含 `关联 OpenSpec 变更` 引用
- ✅ 后向引用: proposal.md 包含 `原始计划` 引用
- ✅ 映射表: .plan-mapping.md 存在且格式正确
- ✅ 所有引用路径有效(文件存在)

**验证方法**:
```bash
node .codebuddy/scripts/validate-plan-links.js <plan-file>
```

**失败条件**: 任何链接缺失或指向不存在的路径

---

## proposal.md 质量规则

### 3. 目标清晰度

**规则**: proposal.md 必须有清晰、具体的目标

**检查项**:
- ✅ 包含 `## 目标` 章节
- ✅ 目标描述具体、可测量
- ✅ 目标数量 ≤ 5 个
- ✅ 每个目标有明确的验收标准

**示例**:
```markdown
## 目标

1. 实现用户认证功能
   - 验收标准: 用户可以使用邮箱/密码登录
   - 验收标准: 登录后返回JWT令牌

2. 实现令牌刷新机制
   - 验收标准: 访问令牌过期时自动刷新
   - 验收标准: 刷新令牌过期时需要重新登录
```

**失败条件**: 目标模糊、不可测量或缺失

---

### 4. 范围边界

**规则**: 变更范围必须明确界定

**检查项**:
- ✅ 包含 `## 范围` 章节
- ✅ 明确列出**包含**的功能
- ✅ 明确列出**不包含**的功能
- ✅ 范围与目标一致

**示例**:
```markdown
## 范围

### 包含的功能
- 用户注册
- 用户登录
- 令牌刷新
- 登出

### 不包含的功能
- 第三方登录(如Google, GitHub)
- 多因素认证
- 密码找回
```

**失败条件**: 范围不明确或超出目标

---

### 5. 验收标准完整性

**规则**: 每个目标必须有明确的验收标准

**检查项**:
- ✅ 每个目标至少有2个验收标准
- ✅ 验收标准可测试(可自动化或手动验证)
- ✅ 验收标准使用"当...时,应该..."格式

**失败条件**: 验收标准缺失、不可测试或模糊

---

## design.md 质量规则

### 6. 架构决策记录

**规则**: design.md 必须记录所有关键架构决策

**检查项**:
- ✅ 包含 `## 架构决策` 章节
- ✅ 每个决策包含: 上下文、选项、选择、后果
- ✅ 决策有明确的理由

**示例**:
```markdown
## 架构决策

### AD001: 使用JWT进行身份验证

**上下文**: 需要一种无状态的身份验证机制
**选项**:
- A. JWT令牌
- B. Session Cookie
- C. OAuth2

**选择**: JWT令牌

**后果**:
- 正面: 无状态、可扩展、跨域友好
- 负面: 无法在服务端撤销令牌
```

**失败条件**: 决策记录不完整或缺失

---

### 7. API设计完整性

**规则**: 如果涉及API,必须包含完整的API设计

**检查项**:
- ✅ 包含 `## API设计` 章节(如适用)
- ✅ 每个端点包含: 路径、方法、请求、响应、错误码
- ✅ 使用OpenAPI或类似标准格式

**失败条件**: API设计不完整或缺失

---

## tasks.md 质量规则

### 8. 任务粒度

**规则**: 每个任务应该是可独立执行的细粒度任务

**检查项**:
- ✅ 大部分任务预计时间 3-10 分钟
- ✅ 极少数任务可达 15-20 分钟(需要进一步细化)
- ✅ 每个任务有明确的文件路径
- ✅ 每个任务有清晰的验收标准

**验证方法**:
```javascript
// 使用task-refiner生成任务时自动验证
// 或手动检查tasks.md
```

**失败条件**: 任务粒度过粗(>20分钟)或过细(<2分钟)

---

### 9. 任务依赖关系

**规则**: 任务依赖关系必须清晰且无循环依赖

**检查项**:
- ✅ 依赖任务明确标注 "Requires task #N"
- ✅ 无循环依赖(A依赖B, B依赖A)
- ✅ 依赖图是DAG(有向无环图)

**失败条件**: 依赖关系混乱或存在循环依赖

---

### 10. 任务优先级

**规则**: 任务必须有明确的优先级

**检查项**:
- ✅ 任务按优先级分组(P0, P1, P2, P3)
- ✅ P0任务数量合理(通常占总任务的20-30%)
- ✅ 优先级与实际重要性一致

**失败条件**: 优先级标注混乱或不合理

---

## specs/ 质量规则

### 11. 规格文件组织

**规则**: specs/ 目录必须有良好的组织结构

**检查项**:
- ✅ 每个功能模块有一个独立的规格文件
- ✅ 文件命名清晰反映功能(如 `user-auth.md`, `api-endpoints.md`)
- ✅ 规格文件不超过500行(否则需要拆分)

**失败条件**: 规格文件组织混乱或过于庞大

---

### 12. 规格完整性

**规则**: 每个规格文件必须包含完整的功能描述

**检查项**:
- ✅ 包含功能概述
- ✅ 包含输入/输出规范
- ✅ 包含边界条件和错误处理
- ✅ 包含测试用例示例

**失败条件**: 规格描述不完整或模糊

---

## .plan-mapping.md 质量规则

### 13. 映射表格式

**规则**: 映射表必须遵循标准格式

**检查项**:
- ✅ 包含 `Multi-Plan → OpenSpec Artifact Mapping` 表
- ✅ 包含 `Link Verification` 章节
- ✅ 包含 `Change Metadata` 章节
- ✅ 包含 `Artifact Details` 章节

**验证方法**:
```bash
node .codebuddy/scripts/validate-plan-links.js <plan-file>
```

**失败条件**: 映射表格式不正确或章节缺失

---

### 14. 映射一致性

**规则**: 映射表内容必须与实际文件一致

**检查项**:
- ✅ 表中列出的所有文件实际存在
- ✅ 相对路径正确
- ✅ 状态标记准确

**失败条件**: 映射表内容与实际不符

---

## 一致性规则

### 15. 计划与OpenSpec一致性

**规则**: 计划文件与OpenSpec工件必须保持一致

**检查项**:
- ✅ 计划目标 = proposal.md 目标
- ✅ 计划实施步骤 ⊆ tasks.md 任务
- ✅ 计划技术方案 = design.md 架构决策
- ✅ 时间估算一致

**验证方法**:
```bash
node .codebuddy/scripts/generate-consistency-report.js <change-name>
```

**失败条件**: 计划与OpenSpec存在不一致

---

## 自动化检查

### 推荐工作流

在创建或修改OpenSpec工件后,运行以下检查:

```bash
# 1. 验证链接完整性
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/<plan-file>.md

# 2. 生成一致性报告
node .codebuddy/scripts/generate-consistency-report.js openspec/changes/<change-name>

# 3. 检查所有规则通过
# (上述命令失败表示规则违反)
```

### 集成到CI/CD

可以将这些检查集成到CI/CD流水线:

```yaml
# .github/workflows/openspec-check.yml
name: OpenSpec Quality Check

on: [pull_request]

jobs:
  check-openspec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate plan links
        run: |
          for plan in .codebuddy/plan/*.md; do
            node .codebuddy/scripts/validate-plan-links.js "$plan"
          done
      - name: Generate consistency reports
        run: |
          for change in openspec/changes/*/; do
            node .codebuddy/scripts/generate-consistency-report.js "$change"
          done
```

---

## 规则优先级

- **P0规则**(必须遵守): 规则1, 2, 8, 9, 13, 14, 15
- **P1规则**(强烈推荐): 规则3, 4, 5, 6, 11, 12
- **P2规则**(建议遵守): 规则7, 10

违反P0规则会导致工件无法使用,必须在提交前修复。
