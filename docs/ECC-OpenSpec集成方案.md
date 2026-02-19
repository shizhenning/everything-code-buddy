# ECC + OpenSpec 软件开发集成方案

## 1. 方案概述

### 1.1 设计理念

将 **OpenSpec (LeanSpec)** 的规格说明管理能力与 **CodeBuddy (ECC)** 的 AI 辅助开发流程深度结合，形成"需求驱动开发"（Requirement-Driven Development, RDD）工作流。

### 1.2 核心价值

- **需求可追溯**：每个功能开发都有完整的 OpenSpec 文档跟踪
- **自动化工作流**：Spec 状态自动与开发进度同步
- **AI 辅助决策**：Planner Agent 基于 Spec 生成实现计划
- **质量门禁**：Spec 的 checklist 验证作为代码提交的准入条件

### 1.3 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户请求                                    │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              /spec 命令 (新建/查询/更新 Spec)                     │
│          ↓ (通过 MCP 调用 leanspec 工具)                          │
│              OpenSpec (.lean-spec/specs/)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              /plan 命令 (基于 Spec 生成实现计划)                    │
│          ↓ (Planner Agent 读取 Spec 内容)                         │
│              实现计划 + Handoff Document                         │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              /orchestrate 命令 (执行开发流程)                      │
│   ↓ (TDD-Guide → Code-Reviewer → Security-Reviewer)                │
│              代码实现 + 测试 + 审查                                │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│              Hook: SpecStatusUpdate (自动更新 Spec 状态)           │
│          ↓ (PostToolUse: 编辑文件后更新 checklist)                │
│              OpenSpec 状态同步 (planned → in-progress → complete) │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构

### 2.1 组件集成矩阵

| ECC 组件 | OpenSpec 集成点 | 实现方式 |
|---------|----------------|---------|
| **Commands** | `/spec` | 新增命令，封装 leanspec MCP 工具 |
| **Agents** | Planner, DocUpdater | 读取 Spec 作为输入源 |
| **Hooks** | SpecStatusUpdate | PostToolUse/SessionEnd 自动更新 |
| **Skills** | openspec-integration | OpenSpec 操作最佳实践 |
| **Continuous Learning** | Spec-Instincts | 学习 Spec-代码映射模式 |

### 2.2 目录结构扩展

```
everything-code-buddy/
├── commands/
│   └── spec.md                      # 新增：OpenSpec 操作命令
├── agents/
│   ├── spec-coordinator.md          # 新增：Spec 协调 Agent
│   ├── doc-updater.md               # 扩展：从 Spec 生成文档
│   └── planner.md                   # 扩展：基于 Spec 计划
├── skills/
│   └── openspec-integration/        # 新增：OpenSpec 集成技能
│       ├── SKILL.md
│       └── templates/
│           ├── feature.md
│           ├── bug.md
│           └── epic.md
├── scripts/hooks/
│   ├── spec-status-update.js        # 新增：Spec 状态同步 Hook
│   ├── spec-pre-commit.js           # 新增：Commit 前验证 Hook
│   └── spec-pr-link.js             # 新增：PR 关联 Hook
├── hooks/hooks.json                 # 扩展：添加 Spec 相关 hooks
└── .lean-spec/                      # OpenSpec 工作目录（由用户创建）
    ├── specs/
    │   ├── 001-authentication.md
    │   ├── 002-user-profile.md
    │   └── ...
    ├── templates/
    └── config.json
```

---

## 3. 核心功能实现

### 3.1 新增 Command: `/spec`

**文件**: `commands/spec.md`

```markdown
---
name: spec
description: OpenSpec 规格说明管理操作
---

# OpenSpec Management

## Usage

```bash
/spec list                    # 列出所有 specs
/spec list --status in-progress --priority high
/spec view 001                # 查看 spec 详情
/spec create my-feature       # 创建新 spec
/spec update 001 --status in-progress
/spec board                   # 查看项目看板
/spec validate                # 验证所有 specs
/spec link 001 002            # 关联依赖
/spec deps 001                # 查看依赖图
/spec stats                   # 统计信息
```

## Workflow

### 1. 创建 Spec

```bash
/spec create user-authentication \
  --title "User Authentication with OAuth 2.0" \
  --priority critical \
  --tags auth,backend,v1.0
```

### 2. 计划开发

```bash
/plan spec:001  # 基于 spec-001 生成计划
```

### 3. 执行开发

```bash
/orchestrate feature
```

### 4. 更新状态

```bash
/spec update 001 --status complete
```

## Integration Notes

此命令封装了以下 LeanSpec MCP 工具：
- `list`: 列出 specs
- `view`: 查看 spec 详情
- `create`: 创建新 spec
- `update`: 更新 spec
- `validate`: 验证 specs
- `deps/link/unlink`: 依赖管理
- `board/stats`: 看板和统计
```

### 3.2 新增 Agent: SpecCoordinator

**文件**: `agents/spec-coordinator.md`

```markdown
---
name: spec-coordinator
description: OpenSpec 规格说明协调 Agent - 管理 Specs 与代码开发的双向同步
tools:
  allowed:
    - MCP:leanspec-list
    - MCP:leanspec-view
    - MCP:leanspec-create
    - MCP:leanspec-update
    - MCP:leanspec-validate
    - MCP:leanspec-deps
    - ReadFile
    - SearchContent
    - SearchFile
model: kimi-k2-Thinking
---

# Spec Coordinator Agent

## Role

协调 OpenSpec 规格说明与代码开发流程，确保需求、设计、实现的一致性。

## Responsibilities

### 1. Spec 状态管理

- 确保 Spec 状态与开发进度同步
- 监控 Spec 的 checklist 完成情况
- 识别阻塞的依赖关系

### 2. 需求追踪

- 将代码变更关联到对应的 Spec
- 验证实现是否覆盖 Spec 中的需求
- 生成需求覆盖报告

### 3. 质量门禁

- 在 Spec 状态设为 `complete` 前验证 checklist
- 检查依赖的 Specs 是否已完成
- 确保 PR 提交包含 Spec 引用

### 4. 文档同步

- 将 Spec 内容同步到项目文档
- 从代码实现反向更新 Spec
- 生成变更日志

## Workflow

### 场景 1: 开始新功能开发

```
用户: /spec create my-feature
↓
SpecCoordinator: 创建 Spec，设置 status=planned
↓
用户: /spec update 001 --status in-progress
↓
SpecCoordinator: 检查依赖，更新 frontmatter
↓
Planner Agent: 基于 Spec 生成计划
```

### 场景 2: 代码变更后同步 Spec

```
代码编辑完成 (PostToolUse Hook 触发)
↓
SpecCoordinator: 识别修改的文件
↓
SpecCoordinator: 匹配对应的 Spec ID
↓
SpecCoordinator: 更新 Spec checklist
↓
SpecCoordinator: 推送状态更新
```

### 场景 3: 完成功能

```
用户: /spec update 001 --status complete
↓
SpecCoordinator: 验证 checklist 完成度
↓
SpecCoordinator: 检查依赖对齐
↓
SpecCoordinator: 运行 spec validate --check-deps
↓
验证通过 → 更新状态为 complete
```

## Output Format

### Spec 状态报告

```markdown
## Spec Status Report: 001-authentication

| Field | Value |
|-------|-------|
| **Status** | in-progress |
| **Priority** | critical |
| **Checklist** | 5/10 completed |
| **Dependencies** | 002-user-profile (blocked) |
| **PRs** | #123, #124 |
| **Last Updated** | 2026-02-19 |

### Checklist Progress

- [x] Design OAuth flow
- [x] Implement login endpoint
- [x] Implement token refresh
- [ ] Add rate limiting (0%)
- [ ] Write unit tests (0%)
```

### 需求覆盖报告

```markdown
## Requirements Coverage Report

| Spec ID | Requirement | Files | Tests | Coverage |
|---------|-------------|-------|-------|----------|
| 001 | OAuth login | src/auth/*.ts | tests/auth/*.test.ts | 85% |
| 001 | Token refresh | src/auth/token.ts | tests/auth/token.test.ts | 60% |

⚠️  Gap: Token refresh testing incomplete
```

## Error Handling

### 常见问题

| 问题 | 原因 | 解决方案 |
|-----|------|---------|
| Spec not found | 文件被删除或命名错误 | 检查 .lean-spec/specs/ 目录 |
| Circular dependency | Spec 互相依赖 | 使用 leanspec deps 检查 |
| Checklist incomplete | 尝试完成未完成的 Spec | 补充 checklist 或使用 --force |
| Dependency blocked | 依赖的 Spec 未完成 | 等待依赖完成或重新评估优先级 |

## Best Practices

1. **始终引用 Spec ID**: 在 commit message、PR 描述中包含 Spec ID
2. **及时更新状态**: 状态变更应在代码变更后立即同步
3. **保持 checklist 更新**: 每个 checklist 对应一个可验证的任务
4. **验证依赖对齐**: 定期运行 `/spec validate --check-deps`
5. **使用模板**: 对于标准功能，使用 Spec 模板加速创建
```

### 3.3 新增 Skill: OpenSpec Integration

**文件**: `skills/openspec-integration/SKILL.md`

```markdown
---
name: openspec-integration
description: OpenSpec 集成最佳实践 - 如何在 ECC 项目中使用 OpenSpec 进行需求驱动的软件开发
version: 1.0.0
setup_env_var: none
mcp_server: @leanspec/mcp
---

# OpenSpec Integration Skill

## Prerequisites

### 安装 OpenSpec

```bash
npm install -g @leanspec/cli

# 初始化项目
cd /path/to/your/project
leanspec init

# 或在 ECC 项目根目录
mkdir -p .lean-spec/specs
mkdir -p .lean-spec/templates
```

### 配置 MCP 服务器

在 `~/.claude/mcp.json` 添加：

```json
{
  "mcpServers": {
    "leanspec": {
      "command": "npx",
      "args": ["@leanspec/mcp"],
      "description": "OpenSpec specification management"
    }
  }
}
```

## Spec 创建模板

### Feature Spec 模板

**文件**: `skills/openspec-integration/templates/feature.md`

```markdown
---
number: NNN
name: feature-name
title: Feature Title
status: planned
priority: medium
tags: [feature, backend, frontend]
assignee: ''
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
---

# Feature: Feature Title

## Overview

Brief description of what this feature does and why it's needed.

## Goals

- [ ] Goal 1
- [ ] Goal 2

## Requirements

### Functional Requirements

1. **FR-001**: Requirement description
   - Acceptance criteria: ...
   - Priority: high

2. **FR-002**: Requirement description
   - Acceptance criteria: ...

### Non-Functional Requirements

- Performance: Response time < 200ms
- Security: Data encryption at rest
- Accessibility: WCAG 2.1 AA compliant

## Design

### Architecture

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ API
┌──────▼──────┐
│  Backend    │
└──────┬──────┘
       │ DB
┌──────▼──────┐
│  Database   │
└─────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/feature | Create new feature |
| GET | /api/v1/feature/:id | Get feature details |
| PUT | /api/v1/feature/:id | Update feature |
| DELETE | /api/v1/feature/:id | Delete feature |

### Data Models

```typescript
interface Feature {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Implementation Plan

### Phase 1: Backend API

- [ ] Design database schema
- [ ] Implement CRUD endpoints
- [ ] Add authentication middleware
- [ ] Write unit tests

### Phase 2: Frontend UI

- [ ] Design UI components
- [ ] Implement API client
- [ ] Add form validation
- [ ] Integrate with routing

### Phase 3: Integration & Testing

- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation

## Testing Strategy

### Unit Tests

- `src/api/feature.test.ts` - API endpoints
- `src/db/feature.test.ts` - Database operations

### Integration Tests

- `tests/integration/feature-flow.test.ts` - Full flow testing

### E2E Tests

- `tests/e2e/feature.spec.ts` - Playwright tests

## Open Questions

1. [ ] Question 1: How to handle edge case X?
2. [ ] Question 2: Should we use caching for Y?

## Checklist

- [ ] Spec reviewed and approved
- [ ] Implementation plan defined
- [ ] Design documented
- [ ] API contracts defined
- [ ] Database schema designed
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] E2E tests written
- [ ] Code reviewed
- [ ] Documentation updated
```

### Bug Fix Spec 模板

**文件**: `skills/openspec-integration/templates/bug.md`

```markdown
---
number: NNN
name: bug-short-name
title: Bug: Short Description
status: planned
priority: high
tags: [bug, fix]
assignee: ''
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
---

# Bug Fix: Short Description

## Overview

Brief description of bug and its impact.

## Reproduction Steps

1. Step 1
2. Step 2
3. Step 3

### Expected Behavior

What should happen.

### Actual Behavior

What actually happens.

## Root Cause

Explanation of why the bug occurred.

## Fix Strategy

### Code Changes

- File 1: What to change
- File 2: What to change

### Testing

- [ ] Unit test for the fix
- [ ] Regression test
- [ ] Manual testing

## Checklist

- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Unit tests added
- [ ] Regression tests passed
- [ ] Code reviewed
- [ ] Bug reproduced and verified fixed
```

## ECC 工作流集成

### 完整开发流程

```bash
# 1. 创建 Spec
/spec create user-authentication --title "User Authentication" --priority critical

# 2. 更新 Spec 内容（添加详细需求）
/spec update 001 --content "$(cat spec-template.md)"

# 3. 开始开发（Planner 基于 Spec 生成计划）
/plan spec:001

# 4. 执行开发流程
/orchestrate feature

# 5. 开发过程中自动更新 checklist
# (Hook: PostToolUse → SpecCoordinator → Update checklist)

# 6. 完成 Spec
/spec update 001 --status complete

# 7. 验证
/spec validate --check-deps
```

### 提交规范

```bash
# Commit message 必须包含 Spec ID
git commit -m "feat(auth): implement OAuth login (spec:001)"

# PR 标题格式
gh pr create --title "[FEAT-001] Implement OAuth login" --body "
This PR implements feature described in spec:001

- Implements OAuth 2.0 with PKCE
- Adds login endpoint
- Includes unit tests

Checklist:
- [x] Backend API
- [x] Frontend UI
- [x] Tests
"
```

## Hook 集成示例

### Spec 状态自动更新

**场景**: 代码编辑后自动更新对应的 Spec checklist

```javascript
// scripts/hooks/spec-status-update.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 从 stdin 读取 PostToolUse 事件
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(data);
    const tool = event.tool_name;
    
    // 只处理 Edit/Write 工具
    if (tool !== 'Edit' && tool !== 'Write') {
      console.log(data);
      return;
    }
    
    const filePath = event.tool_input?.file_path;
    if (!filePath) return;
    
    // 提取 Spec ID（从 commit message 或文件命名约定）
    const specId = extractSpecIdFromPath(filePath);
    if (!specId) return;
    
    // 读取 Spec 文件
    const specPath = path.join(process.cwd(), '.lean-spec/specs', `${specId}-*.md`);
    const specContent = fs.readFileSync(specPath, 'utf8');
    
    // 更新 checklist（基于修改的文件）
    const updatedContent = updateChecklistBasedOnFiles(specContent, [filePath]);
    
    // 写回 Spec
    fs.writeFileSync(specPath, updatedContent);
    
    console.error(`[Hook] Updated spec ${specId} checklist based on ${filePath}`);
  } catch (err) {
    console.error(`[Hook] Error: ${err.message}`);
  }
  
  console.log(data);
});
```

## 最佳实践

### 1. Spec ID 命名约定

```
001-feature-name     # Feature specs
101-bug-short-name   # Bug specs
201-epic-name        # Epic specs
301-tech-debt        # Tech debt specs
```

### 2. Checklist 粒度

- 每个 checklist 应该对应一个可验证的任务
- 避免过于细粒度（"写第一行代码"）
- 避免过于粗粒度（"实现整个功能"）

### 3. 依赖管理

- 使用 `lean-spec link` 创建显式依赖
- 定期运行 `/spec validate --check-deps`
- 阻塞依赖完成后再开始下游任务

### 4. 状态流转

```
planned → in-progress → complete
  ↓         ↓
archived ← archived
```

- **planned**: Spec 创建但未开始
- **in-progress**: 开发进行中
- **complete**: 所有 checklist 完成，测试通过
- **archived**: 已完成且稳定的功能

### 5. 与 Continuous Learning 结合

```yaml
---
id: spec-to-code-pattern
trigger: "when working on a spec-based feature"
confidence: 0.9
domain: openspec
---

# Spec-Driven Development Pattern

## Action
1. Read spec: `/spec view {specId}`
2. Generate plan: `/plan spec:{specId}`
3. Implement: `/orchestrate feature`
4. Update checklist: Hook automatically handles
5. Complete: `/spec update {specId} --status complete`

## Checklist Validation
Always verify all checklist items before setting status to complete.

## Dependency Check
Run `/spec validate --check-deps` before completion.
```

## 故障排查

### 问题 1: MCP 工具不可用

```bash
# 检查 MCP 服务器配置
cat ~/.claude/mcp.json | grep leanspec

# 手动测试 MCP 工具
npx @leanspec/mcp list
```

### 问题 2: Hook 未触发

```bash
# 检查 hooks.json 配置
cat .codebuddy/hooks/hooks.json | grep spec

# 查看 hook 日志
export CODEBUDDY_DEBUG_HOOKS=1
claude-code
```

### 问题 3: Spec 文件未找到

```bash
# 检查目录结构
ls -la .lean-spec/specs/

# 重新初始化
rm -rf .lean-spec
leanspec init
```

## 参考资源

- [OpenSpec Guide](../OpenSpec-SDD规范详细指南.md)
- [LeanSpec CLI](https://github.com/leanspec/leanspec)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [ECC Documentation](../../CODEBUDDY.md)
```

---

## 4. Hook 实现

### 4.1 Spec 状态更新 Hook

**文件**: `scripts/hooks/spec-status-update.js`

```javascript
const fs = require('fs');
const path = require('path');

/**
 * PostToolUse Hook: 代码编辑后自动更新 Spec checklist
 */
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(data);
    const tool = event.tool_name;
    
    // 只处理 Edit/Write 工具
    if (tool !== 'Edit' && tool !== 'Write') {
      console.log(data);
      return;
    }
    
    const filePath = event.tool_input?.file_path;
    if (!filePath) return;
    
    // 提取 Spec ID（从文件路径或 commit message）
    const specId = extractSpecId(filePath);
    if (!specId) return;
    
    // 更新 Spec
    updateSpecChecklist(specId, filePath);
    
    console.error(`[SpecHook] Updated spec ${specId} based on ${filePath}`);
  } catch (err) {
    console.error(`[SpecHook] Error: ${err.message}`);
  }
  
  console.log(data);
});

function extractSpecId(filePath) {
  // 从文件路径提取 Spec ID
  // 例如: src/features/auth/login.ts -> spec:001-auth
  const match = filePath.match(/features\/(\d+)-/);
  return match ? match[1] : null;
}

function updateSpecChecklist(specId, changedFile) {
  const specDir = path.join(process.cwd(), '.lean-spec', 'specs');
  const specFiles = fs.readdirSync(specDir).filter(f => f.startsWith(specId));
  
  if (specFiles.length === 0) return;
  
  const specPath = path.join(specDir, specFiles[0]);
  let content = fs.readFileSync(specPath, 'utf8');
  
  // 根据修改的文件更新对应的 checklist 项
  content = content.replace(
    /(\[\s\]\s+.*)(.*${changedFile.split('/').pop()}.*)/i,
    (match, p1, p2) => {
      return match.replace(p1, '[x]');
    }
  );
  
  // 更新 frontmatter
  content = content.replace(
    /(updated_at:\s*)(.+)/,
    `$1${new Date().toISOString().split('T')[0]}`
  );
  
  fs.writeFileSync(specPath, content);
}
```

### 4.2 Pre-Commit 验证 Hook

**文件**: `scripts/hooks/spec-pre-commit.js`

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * PreToolUse Hook (Bash): Git commit 前验证 Spec 状态
 */
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(data);
    const tool = event.tool_name;
    const command = event.tool_input?.command || '';
    
    // 只处理 git commit
    if (tool !== 'Bash' || !/git commit/.test(command)) {
      console.log(data);
      return;
    }
    
    // 检查 commit message 是否包含 Spec ID
    const specId = extractSpecIdFromCommand(command);
    if (!specId) {
      console.warn('[SpecHook] ⚠️  Commit message should include spec ID (e.g., "feat: login (spec:001)")');
      console.log(data);
      return;
    }
    
    // 验证 Spec 状态
    validateSpecBeforeCommit(specId);
    
  } catch (err) {
    console.error(`[SpecHook] Error: ${err.message}`);
  }
  
  console.log(data);
});

function extractSpecIdFromCommand(command) {
  // 从 -m 参数中提取 Spec ID
  const match = command.match(/spec:(\d+)/);
  return match ? match[1] : null;
}

function validateSpecBeforeCommit(specId) {
  const specDir = path.join(process.cwd(), '.lean-spec', 'specs');
  const specFiles = fs.readdirSync(specDir).filter(f => f.startsWith(specId));
  
  if (specFiles.length === 0) {
    console.error(`[SpecHook] ❌ Spec ${specId} not found`);
    process.exit(1);
  }
  
  const specPath = path.join(specDir, specFiles[0]);
  const content = fs.readFileSync(specPath, 'utf8');
  
  // 检查状态
  const statusMatch = content.match(/status:\s*(\w+)/);
  if (statusMatch && statusMatch[1] === 'planned') {
    console.error(`[SpecHook] ❌ Spec ${specId} is still in "planned" status`);
    console.error(`[SpecHook] Use: /spec update ${specId} --status in-progress`);
    process.exit(1);
  }
  
  // 检查 checklist 完成度
  const checklistItems = content.matchAll(/\[-?\s?\]/g);
  const total = Array.from(checklistItems).length;
  const completed = content.matchAll(/\[x\]/g);
  const completedCount = Array.from(completed).length;
  
  if (total > 0 && completedCount < total * 0.5) {
    console.warn(`[SpecHook] ⚠️  Spec ${specId} checklist only ${completedCount}/${total} completed`);
  }
  
  console.error(`[SpecHook] ✅ Spec ${specId} validation passed`);
}
```

### 4.3 hooks.json 配置更新

在现有的 `hooks/hooks.json` 中添加：

```json
{
  "$schema": "https://json.schemastore.org/codebuddy-settings.json",
  "hooks": {
    "PostToolUse": [
      // ... existing hooks ...
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/scripts/hooks/spec-status-update.js\""
          }
        ],
        "description": "Update Spec checklist after file edits"
      }
    ],
    "PreToolUse": [
      // ... existing hooks ...
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/scripts/hooks/spec-pre-commit.js\""
          }
        ],
        "description": "Validate Spec status before git commit"
      }
    ]
  }
}
```

---

## 5. 实施计划

### 阶段 1: 基础设置 (1-2 天)

- [ ] 安装和配置 LeanSpec MCP 服务器
- [ ] 初始化 `.lean-spec/` 目录结构
- [ ] 创建 `/spec` command
- [ ] 测试基本 CRUD 操作

### 阶段 2: Agent 集成 (2-3 天)

- [ ] 创建 `spec-coordinator` agent
- [ ] 扩展 `planner` agent 读取 Spec
- [ ] 扩展 `doc-updater` 生成 Spec 文档
- [ ] 实现 Spec → Plan 转换逻辑

### 阶段 3: Hook 自动化 (2-3 天)

- [ ] 实现 `spec-status-update.js`
- [ ] 实现 `spec-pre-commit.js`
- [ ] 实现 `spec-pr-link.js`
- [ ] 更新 `hooks/hooks.json`

### 阶段 4: Skill 和模板 (1-2 天)

- [ ] 创建 `openspec-integration` skill
- [ ] 创建 feature, bug, epic 模板
- [ ] 编写最佳实践文档

### 阶段 5: 测试和优化 (2-3 天)

- [ ] 端到端测试完整工作流
- [ ] 性能优化
- [ ] 文档完善
- [ ] 用户培训

### 阶段 6: Continuous Learning 集成 (1-2 天)

- [ ] 定义 Spec-to-Code patterns
- [ ] 实现自动学习机制
- [ ] 聚合 Instincts 为 Skills

**总计**: 9-15 天

---

## 6. 使用示例

### 示例 1: 完整功能开发流程

```bash
# 1. 创建 Spec
/spec create user-authentication \
  --title "User Authentication with OAuth 2.0" \
  --priority critical \
  --tags auth,backend,v1.0

# 输出: Spec 001 created at .lean-spec/specs/001-user-authentication.md

# 2. 查看 Spec
/spec view 001

# 输出: 显示完整的 Spec 内容

# 3. 编辑 Spec 内容（添加详细需求）
# 手动编辑 .lean-spec/specs/001-user-authentication.md

# 4. 开始开发
/spec update 001 --status in-progress

# 输出: Spec 001 status updated to in-progress

# 5. 基于 Spec 生成计划
/plan spec:001

# 输出: Planner Agent 基于 Spec 生成实现计划

# 6. 执行开发流程
/orchestrate feature

# 输出:
# TDD-Guide: Writing tests...
# Code-Reviewer: Reviewing code...
# Security-Reviewer: Security check...

# 7. 提交代码（Hook 自动验证 Spec）
git add .
git commit -m "feat(auth): implement OAuth login (spec:001)"

# 输出:
# [SpecHook] ✅ Spec 001 validation passed

# 8. 创建 PR（自动关联 Spec）
gh pr create --title "[FEAT-001] Implement OAuth login" \
  --body "Implements spec:001"

# 9. 完成 Spec
/spec update 001 --status complete

# 输出:
# ✅ Checklist complete: 10/10
# ✅ Dependencies aligned
# ✅ Spec 001 marked as complete

# 10. 验证
/spec validate --check-deps

# 输出: All specs validated
```

### 示例 2: Bug 修复流程

```bash
# 1. 创建 Bug Spec
/spec create login-failure \
  --title "Bug: Users cannot login after password reset" \
  --priority high \
  --tags bug,fix,auth

# 2. 使用 Bug 模板更新 Spec
/spec update 101 --content "$(cat bug-template.md)"

# 3. 开始修复
/spec update 101 --status in-progress

# 4. 实现修复
# ... 编写代码 ...

# 5. 提交
git commit -m "fix(auth): password reset login issue (spec:101)"

# 6. 完成修复
/spec update 101 --status complete
```

### 示例 3: Epic 管理

```bash
# 1. 创建 Epic Spec
/spec create user-management-system \
  --title "Epic: User Management System" \
  --priority high \
  --tags epic,backend,v1.0

# 2. 添加子需求
/spec update 201 \
  --replacements '[{"oldString": "## Sub-Requirements\n- [ ]", "newString": "## Sub-Requirements\n- [ ] User authentication (spec:001)\n- [ ] User profile (spec:002)\n- [ ] User permissions (spec:003)\n"}]'

# 3. 链接依赖
/spec link 001 201
/spec link 002 201
/spec link 003 201

# 4. 查看依赖图
/spec deps 201

# 输出:
# 201-user-management-system
#   ├── 001-user-authentication
#   ├── 002-user-profile
#   └── 003-user-permissions
```

---

## 7. 进阶功能

### 7.1 自动需求覆盖分析

```bash
# 生成需求覆盖报告
/spec coverage

# 输出:
## Requirements Coverage Report

| Spec ID | Requirement | Coverage | Files | Tests |
|---------|-------------|----------|-------|-------|
| 001 | OAuth login | 85% | 12 | 8 |
| 001 | Token refresh | 60% | 3 | 1 |
| 002 | User profile | 0% | 0 | 0 |

⚠️  Gaps:
- spec:001 token refresh testing incomplete
- spec:002 not started
```

### 7.2 Spec 优先级自动计算

基于依赖关系和业务价值自动计算优先级：

```javascript
// 自动优先级算法
function calculatePriority(spec) {
  const basePriority = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25
  };
  
  // 依赖数量影响
  const dependencyCount = spec.dependencies.length;
  const dependencyBonus = dependencyCount * 5;
  
  // 阻塞数量影响
  const blockingCount = spec.blockingCount || 0;
  const blockingBonus = blockingCount * 10;
  
  return basePriority[spec.priority] + dependencyBonus + blockingBonus;
}
```

### 7.3 Spec 变更通知

当 Spec 更新时自动通知相关人员：

```javascript
// 在 Spec 更新时触发通知
function notifySpecUpdate(specId, changes) {
  const assignee = getSpecAssignee(specId);
  const dependencies = getSpecDependencies(specId);
  
  // 发送通知
  sendNotification({
    to: [assignee, ...dependencies.map(d => d.assignee)],
    subject: `Spec ${specId} updated`,
    body: `
Changes made to ${specId}:
${changes.join('\n')}

View spec: /spec view ${specId}
    `
  });
}
```

### 7.4 与 CI/CD 集成

在 CI 流水线中验证 Spec 状态：

```yaml
# .github/workflows/spec-validation.yml
name: Spec Validation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install LeanSpec
        run: npm install -g @leanspec/cli
      
      - name: Validate Specs
        run: |
          # 从 PR 提取 Spec ID
          SPEC_ID=$(echo "${{ github.event.pull_request.title }}" | grep -o 'spec:[0-9]*' | cut -d: -f2)
          
          if [ -n "$SPEC_ID" ]; then
            leanspec validate $SPEC_ID --check-deps
          fi
```

---

## 8. 总结

### 核心优势

1. **需求可追溯**: 每个代码变更都有明确的 Spec 关联
2. **自动化同步**: Hook 自动更新 Spec 状态和 checklist
3. **AI 辅助**: Planner 基于 Spec 生成更精准的计划
4. **质量门禁**: Spec 验证作为代码提交的准入条件
5. **团队协作**: 统一的 Spec 格式和流程规范

### 适用场景

- ✅ 中大型团队项目
- ✅ 需要严格需求追溯的项目
- ✅ 复杂业务逻辑的功能开发
- ✅ 有明确产品需求文档（PRD）的项目
- ❌ 小型快速原型开发
- ❌ 个人实验性项目

### 下一步行动

1. 阅读本文档，理解整体架构
2. 安装和配置 LeanSpec MCP 服务器
3. 从 `/spec` command 开始实施
4. 逐步扩展到 Agent 和 Hook 集成
5. 根据团队需求定制工作流

---

*本文档版本: v1.0.0*
*最后更新: 2026-02-19*
