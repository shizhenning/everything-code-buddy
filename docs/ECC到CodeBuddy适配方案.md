# ECC 到 CodeBuddy 完整适配方案

**版本：** v1.0  
**日期：** 2026 年 2 月 18 日  
**状态：** 待执行

---

## 📋 目录

1. [项目概述](#项目概述)
2. [架构差异分析](#架构差异分析)
3. [适配策略](#适配策略)
4. [分阶段实施计划](#分阶段实施计划)
5. [详细执行步骤](#详细执行步骤)
6. [风险评估与缓解](#风险评估与缓解)
7. [验收标准](#验收标准)
8. [回滚方案](#回滚方案)

---

## 一、项目概述

### 1.1 适配目标

将 Everything Claude Code (ECC) 套件完整适配到 CodeBuddy 架构，保持核心功能的同时，充分利用 CodeBuddy 的增强特性。

**核心目标：**
- ✅ 保持 ECC 的 13 个 Agents 完整功能
- ✅ 迁移 31 个 Commands 到 CodeBuddy 格式
- ✅ 适配 53+ 个 Skills 到 CodeBuddy 结构
- ✅ 转换 Hooks 配置到 CodeBuddy 格式
- ✅ 利用 CodeBuddy 的多模型支持（GLM、Kimi、DeepSeek、混元）
- ✅ 适配 CodeBuddy 的 Session 管理系统
- ✅ 集成 CodeBuddy 的 MCP 服务器架构

### 1.2 关键差异对比

| 特性 | Claude Code | CodeBuddy | 适配策略 |
|------|-------------|------------|----------|
| **模型支持** | Claude 系列 | Claude + 国产模型 | 保留 Claude 配置，添加国产模型选项 |
| **Commands** | `/command.md` | `/path/command.md` | 重构目录结构 |
| **Agents** | Task tool 委托 | Sub-agent 机制 | 基本兼容，微调模型映射 |
| **Skills** | `SKILL.md` | `SKILL.md` | 格式兼容，需优化 frontmatter |
| **Hooks** | `hooks/hooks.json` | `hooks/hooks.json` | 格式兼容，验证事件映射 |
| **Session** | 基础会话 | 持久化 + 别名 | 利用增强功能 |
| **MCP** | stdio/SSE | stdio/SSE + HTTP | 完全兼容 |

### 1.3 适配范围

**包含：**
- ✅ 全部 13 个 Agents
- ✅ 全部 31 个 Commands
- ✅ 全部 53+ 个 Skills
- ✅ 全部 6 种 Hooks
- ✅ MCP 配置
- ✅ 测试套件适配

**不包含：**
- ❌ Rules（CodeBuddy 不支持通过插件分发规则）
- ❌ 部分生态系统工具（Skill Creator、AgentShield 需独立评估）

---

## 二、架构差异分析

### 2.1 Commands 目录结构差异

#### Claude Code 格式
```
commands/
├── plan.md           → /plan
├── tdd.md            → /tdd
└── code-review.md    → /code-review
```

#### CodeBuddy 格式
```
.codebuddy/
└── commands/
    ├── workflow/
    │   ├── plan.md         → /workflow:plan
    │   └── tdd.md          → /workflow:tdd
    ├── review/
    │   └── code-review.md  → /review:code-review
    └── build/
        └── build-fix.md     → /build:fix
```

**适配策略：**
1. 按功能分类重新组织 Commands
2. 使用层级命名空间（`:` 分隔符）
3. 保持向后兼容（通过别名）

### 2.2 Agents 模型映射

#### Claude Code 模型
| 模型 | 用途 |
|------|------|
| `opus` | 深度思考、架构设计 |
| `sonnet` | 日常开发、平衡性能 |
| `haiku` | 快速任务、成本优化 |

#### CodeBuddy 模型映射
| ECC 模型 | CodeBuddy 等价 | 国产模型选项 |
|----------|---------------|--------------|
| `opus` | `claude-3-5-sonnet` / `claude-3-opus` | `glm-5.0`, `deepseek-v3.2` |
| `sonnet` | `claude-3-5-sonnet` | `glm-4.7`, `kimi-k2.5` |
| `haiku` | `claude-3-5-haiku` | `glm-4.6`, `hunyuan-2.0-instruct-20251111` |

**适配策略：**
1. 保留 Claude 模型作为默认
2. 添加国产模型配置选项
3. 支持运行时模型切换

### 2.3 Hooks 事件映射

| Claude Code 事件 | CodeBuddy 事件 | 兼容性 |
|------------------|----------------|--------|
| `PreToolUse` | `PreToolUse` | ✅ 完全兼容 |
| `PostToolUse` | `PostToolUse` | ✅ 完全兼容 |
| `SessionStart` | `SessionStart` | ✅ 完全兼容 |
| `Stop` | `Stop` | ✅ 完全兼容 |
| `PreCompact` | `PreCompact` | ✅ 完全兼容 |
| `SessionEnd` | `SessionEnd` | ✅ 完全兼容 |
| N/A | `UserPromptSubmit` | ⚠️ 新增事件 |
| N/A | `Notification` | ⚠️ 新增事件 |

**适配策略：**
1. 现有 Hooks 完全兼容
2. 可选：利用新增事件增强功能

---

## 三、适配策略

### 3.1 总体策略

采用 **渐进式适配** 策略，分阶段验证功能，降低风险。

**核心原则：**
1. **最小改动原则** - 优先保持格式兼容
2. **功能优先** - 先确保功能完整，再优化体验
3. **向后兼容** - 支持原有工作流
4. **增量验证** - 每个阶段独立测试验证

### 3.2 目录结构设计

```
.codebuddy/                    # CodeBuddy 配置根目录
├── plugin.json                # 插件清单（新增）
├── marketplace.json           # 市场配置
├── commands/                  # 命令集（重构）
│   ├── workflow/              # 工作流命令
│   │   ├── plan.md
│   │   ├── tdd.md
│   │   └── orchestrate.md
│   ├── review/                # 审查命令
│   │   ├── code-review.md
│   │   └── security-scan.md
│   ├── testing/               # 测试命令
│   │   ├── e2e.md
│   │   └── test-coverage.md
│   ├── learning/              # 学习命令
│   │   ├── learn.md
│   │   └── checkpoint.md
│   ├── multi/                 # 多 Agent 编排
│   │   ├── multi-plan.md
│   │   └── multi-execute.md
│   └── utils/                 # 工具命令
│       ├── sessions.md
│       └── model.md
├── agents/                    # 智能代理（复制）
├── skills/                    # 技能库（复制 + 优化）
│   ├── core/
│   ├── languages/
│   ├── testing/
│   └── security/
├── hooks/                     # 钩子系统（复制）
│   └── hooks.json
├── mcp.json                   # MCP 配置（新增）
└── settings.json             # CodeBuddy 设置（新增）
```

### 3.3 配置文件设计

#### plugin.json
```json
{
  "name": "everything-codebuddy",
  "version": "1.0.0",
  "description": "Complete collection of battle-tested CodeBuddy configs evolved from ECC",
  "author": {
    "name": "ECC Community",
    "url": "https://github.com/affaan-m/everything-claude-code"
  },
  "homepage": "https://github.com/affaan-m/everything-claude-code",
  "repository": "https://github.com/affaan-m/everything-claude-code",
  "license": "MIT",
  "keywords": [
    "codebuddy",
    "agents",
    "skills",
    "hooks",
    "tdd",
    "code-review",
    "security",
    "workflow"
  ],
  "skills": ["./skills/"],
  "commands": ["./commands/"],
  "agents": [
    "./agents/architect.md",
    "./agents/build-error-resolver.md",
    "./agents/code-reviewer.md",
    "./agents/database-reviewer.md",
    "./agents/doc-updater.md",
    "./agents/e2e-runner.md",
    "./agents/go-build-resolver.md",
    "./agents/go-reviewer.md",
    "./agents/planner.md",
    "./agents/python-reviewer.md",
    "./agents/refactor-cleaner.md",
    "./agents/security-reviewer.md",
    "./agents/tdd-guide.md"
  ],
  "mcpServers": "./mcp.json",
  "codebuddy": {
    "minVersion": "1.7.0",
    "recommendedModel": {
      "default": "claude-3-5-sonnet",
      "alternatives": ["glm-5.0", "deepseek-v3.2", "kimi-k2.5"]
    }
  }
}
```

#### mcp.json
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${CODEBUDDY_PROJECT_DIR}"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

#### settings.json
```json
{
  "model": "claude-3-5-sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CODEBUDDY_SUBAGENT_MODEL": "haiku"
  },
  "features": {
    "sessionPersistence": true,
    "sessionAliases": true,
    "instinctLearning": true
  }
}
```

---

## 四、分阶段实施计划

### 阶段 1：基础结构迁移（Phase 1 - Foundation）

**目标：** 建立基础目录结构和配置文件

**任务清单：**
- [ ] 创建 `.codebuddy/` 目录结构
- [ ] 创建 `plugin.json` 配置文件
- [ ] 创建 `mcp.json` 配置文件
- [ ] 创建 `settings.json` 配置文件
- [ ] 创建 `marketplace.json` 配置文件

**验收标准：**
- ✅ 目录结构符合 CodeBuddy 规范
- ✅ 配置文件通过验证
- ✅ 可以通过 `/plugin list` 查看插件

**预计耗时：** 2 小时

---

### 阶段 2：Agents 迁移（Phase 2 - Agents）

**目标：** 迁移所有 Agents 并适配模型映射

**任务清单：**
- [ ] 复制 13 个 Agents 到 `.codebuddy/agents/`
- [ ] 更新模型映射（添加国产模型选项）
- [ ] 验证 Agent 格式兼容性
- [ ] 测试 Agent 调用功能

**模型映射策略：**

```javascript
const MODEL_MAPPING = {
  // Claude models
  'opus': 'claude-3-5-sonnet', // fallback to sonnet
  'sonnet': 'claude-3-5-sonnet',
  'haiku': 'claude-3-5-haiku',
  
  // Chinese models (alternatives)
  'opus-alt': ['glm-5.0', 'deepseek-v3.2', 'kimi-k2.5'],
  'sonnet-alt': ['glm-4.7', 'deepseek-v3.2', 'kimi-k2.5'],
  'haiku-alt': ['glm-4.6', 'hunyuan-2.0-instruct-20251111']
};
```

**验收标准：**
- ✅ 所有 13 个 Agents 正确加载
- ✅ 模型映射正确工作
- ✅ Agent 可以通过 Task tool 调用
- ✅ 支持国产模型切换

**预计耗时：** 4 小时

---

### 阶段 3：Commands 重构（Phase 3 - Commands）

**目标：** 重构 Commands 到 CodeBuddy 分类结构

**任务清单：**
- [ ] 创建 Commands 分类目录结构
- [ ] 迁移 31 个 Commands 到新目录
- [ ] 更新命令路径引用
- [ ] 创建向后兼容别名
- [ ] 更新命令 frontmatter

**命令分类映射：**

| 原命令 | 新路径 | 说明 |
|--------|--------|------|
| `plan.md` | `workflow/plan.md` | 工作流分类 |
| `tdd.md` | `workflow/tdd.md` | 工作流分类 |
| `code-review.md` | `review/code-review.md` | 审查分类 |
| `security-scan.md` | `review/security-scan.md` | 审查分类 |
| `e2e.md` | `testing/e2e.md` | 测试分类 |
| `multi-plan.md` | `multi/multi-plan.md` | 多 Agent 分类 |
| `sessions.md` | `utils/sessions.md` | 工具分类 |

**向后兼容别名：**
在 `.codebuddy/commands/` 创建别名文件，指向新路径：
```markdown
---
alias: workflow:plan
---
See /workflow:plan for details.
```

**验收标准：**
- ✅ 所有 31 个 Commands 正确加载
- ✅ 新命令路径正常工作
- ✅ 旧命令路径通过别名可用
- ✅ 命令分类符合逻辑

**预计耗时：** 6 小时

---

### 阶段 4：Skills 优化（Phase 4 - Skills）

**目标：** 优化 Skills 结构和 frontmatter

**任务清单：**
- [ ] 复制 53+ 个 Skills 到 `.codebuddy/skills/`
- [ ] 按分类重新组织 Skills
- [ ] 更新 Skills frontmatter（添加 CodeBuddy 特定字段）
- [ ] 验证 Skill 格式兼容性
- [ ] 优化 Skill 加载性能

**Skills 分类结构：**
```
.codebuddy/skills/
├── core/                    # 核心技能
│   ├── coding-standards/
│   ├── backend-patterns/
│   ├── frontend-patterns/
│   └── tdd-workflow/
├── languages/               # 语言专项
│   ├── typescript/
│   ├── python/
│   ├── golang/
│   ├── cpp/
│   └── java/
├── testing/                 # 测试技能
│   ├── tdd/
│   ├── e2e-testing/
│   └── testing-patterns/
├── security/                # 安全技能
│   ├── security-review/
│   └── security-scan/
├── devops/                  # DevOps 技能
│   ├── docker-patterns/
│   └── deployment-patterns/
└── learning/                # 学习技能
    ├── continuous-learning/
    ├── continuous-learning-v2/
    └── verification-loop/
```

**Frontmatter 增强字段：**
```yaml
---
name: CodingStandards
description: Best practices for writing clean, maintainable code
allowed-tools: Read, Write, Edit, Grep, Glob
user-invocable: true
context: fork
agent: general-purpose
codebuddy:
  model-alias: sonnet-alt
  priority: high
  categories: [core, development]
---
```

**验收标准：**
- ✅ 所有 53+ 个 Skills 正确加载
- ✅ Skills 分类清晰合理
- ✅ Frontmatter 符合 CodeBuddy 规范
- ✅ Skill 调用性能良好

**预计耗时：** 8 小时

---

### 阶段 5：Hooks 适配（Phase 5 - Hooks）

**目标：** 适配 Hooks 到 CodeBuddy 格式

**任务清单：**
- [ ] 复制 Hooks 配置到 `.codebuddy/hooks/`
- [ ] 验证 Hook 事件映射
- [ ] 更新 Node.js 脚本路径引用
- [ ] 测试 Hook 触发逻辑
- [ ] 优化 Hook 性能

**Hooks 配置验证：**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node scripts/hooks/block-dev-servers.js",
          "timeout": 5000,
          "description": "Block dev servers outside tmux"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "node scripts/hooks/post-edit-format.js",
          "timeout": 30000,
          "description": "Auto-format after edits"
        }]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node scripts/hooks/session-start.js",
          "timeout": 10000,
          "description": "Initialize session"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node scripts/hooks/check-console-log.js",
          "timeout": 5000,
          "description": "Check for console.log statements"
        }]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "node scripts/hooks/session-end.js",
          "timeout": 15000,
          "description": "Persist session data"
        }]
      }
    ]
  }
}
```

**验收标准：**
- ✅ 所有 6 种 Hooks 正确加载
- ✅ Hook 事件正确触发
- ✅ Hook 脚本正确执行
- ✅ Hook 性能满足要求

**预计耗时：** 4 小时

---

### 阶段 6：测试套件适配（Phase 6 - Tests）

**目标：** 适配测试套件到 CodeBuddy

**任务清单：**
- [ ] 更新测试脚本路径引用
- [ ] 适配测试用例到 CodeBuddy 格式
- [ ] 添加 CodeBuddy 特定测试
- [ ] 运行完整测试套件
- [ ] 修复测试失败

**测试适配重点：**
```javascript
// 示例：适配 hooks.test.js
const codebuddyDir = path.join(process.cwd(), '.codebuddy');
const hooksPath = path.join(codebuddyDir, 'hooks', 'hooks.json');

// 替换原有的 .claude/hooks/hooks.json 引用
```

**新增测试：**
- [ ] CodeBuddy 模型切换测试
- [ ] 命令别名测试
- [ ] Session 持久化测试
- [ ] 国产模型集成测试

**验收标准：**
- ✅ 所有原有测试通过
- ✅ 新增测试通过
- ✅ 测试覆盖率 > 80%

**预计耗时：** 6 小时

---

### 阶段 7：文档更新（Phase 7 - Documentation）

**目标：** 更新所有文档到 CodeBuddy 版本

**任务清单：**
- [ ] 更新 README.md（添加 CodeBuddy 安装指南）
- [ ] 创建 MIGRATION.md（ECC → CodeBuddy 迁移指南）
- [ ] 更新 CODEBUDDY.md（集成架构文档）
- [ ] 更新 Commands 文档
- [ ] 创建 CodeBuddy 特定示例

**文档结构：**
```
docs/
├── CODEBUDDY-ADAPTATION.md    # 本适配方案
├── MIGRATION.md               # ECC → CodeBuddy 迁移指南
├── CODEBUDDY-GUIDE.md         # CodeBuddy 使用指南
├── COMMANDS.md                # 命令参考
├── AGENTS.md                  # Agents 参考
└── EXAMPLES.md                # CodeBuddy 使用示例
```

**验收标准：**
- ✅ 文档完整准确
- ✅ 安装步骤清晰
- ✅ 示例代码可运行
- ✅ 文档格式统一

**预计耗时：** 4 小时

---

### 阶段 8：整体测试与优化（Phase 8 - Integration & Optimization）

**目标：** 整体测试、性能优化、Bug 修复

**任务清单：**
- [ ] 运行完整测试套件
- [ ] 执行集成测试
- [ ] 性能基准测试
- [ ] 优化加载性能
- [ ] 修复发现的 Bug
- [ ] 用户体验优化

**性能优化重点：**
- [ ] Skill 加载优化（选择性加载）
- [ ] 命令别名查询优化
- [ ] Hook 执行性能优化
- [ ] Session 恢复性能优化

**验收标准：**
- ✅ 所有测试通过
- ✅ 性能指标达标
- ✅ 无严重 Bug
- ✅ 用户体验良好

**预计耗时：** 8 小时

---

## 五、详细执行步骤

### 步骤 1：初始化 CodeBuddy 结构

```bash
# 创建目录结构
mkdir -p .codebuddy/{commands/{workflow,review,testing,learning,multi,utils},agents,skills/{core,languages,testing,security,devops,learning},hooks,mcp}

# 复制现有 Hooks
cp -r hooks/* .codebuddy/hooks/

# 复制现有 Agents
cp -r agents/* .codebuddy/agents/

# 复制现有 Skills
cp -r skills/* .codebuddy/skills/
```

### 步骤 2：创建配置文件

#### 创建 plugin.json
```bash
cat > .codebuddy/plugin.json << 'EOF'
{
  "name": "everything-codebuddy",
  "version": "1.0.0",
  "description": "Complete collection of battle-tested CodeBuddy configs",
  "author": {
    "name": "ECC Community",
    "url": "https://github.com/affaan-m/everything-claude-code"
  },
  "homepage": "https://github.com/affaan-m/everything-claude-code",
  "repository": "https://github.com/affaan-m/everything-claude-code",
  "license": "MIT",
  "skills": ["./skills/"],
  "commands": ["./commands/"],
  "agents": [
    "./agents/architect.md",
    "./agents/build-error-resolver.md",
    "./agents/code-reviewer.md",
    "./agents/database-reviewer.md",
    "./agents/doc-updater.md",
    "./agents/e2e-runner.md",
    "./agents/go-build-resolver.md",
    "./agents/go-reviewer.md",
    "./agents/planner.md",
    "./agents/python-reviewer.md",
    "./agents/refactor-cleaner.md",
    "./agents/security-reviewer.md",
    "./agents/tdd-guide.md"
  ],
  "mcpServers": "./mcp.json",
  "codebuddy": {
    "minVersion": "1.7.0",
    "recommendedModel": {
      "default": "claude-3-5-sonnet",
      "alternatives": ["glm-5.0", "deepseek-v3.2", "kimi-k2.5"]
    }
  }
}
EOF
```

#### 创建 mcp.json
```bash
cat > .codebuddy/mcp.json << 'EOF'
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${CODEBUDDY_PROJECT_DIR}"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
EOF
```

#### 创建 settings.json
```bash
cat > .codebuddy/settings.json << 'EOF'
{
  "model": "claude-3-5-sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE": "50",
    "CODEBUDDY_SUBAGENT_MODEL": "haiku"
  },
  "features": {
    "sessionPersistence": true,
    "sessionAliases": true,
    "instinctLearning": true
  }
}
EOF
```

### 步骤 3：重构 Commands

```bash
# 移动 Commands 到分类目录
mv commands/plan.md .codebuddy/commands/workflow/
mv commands/tdd.md .codebuddy/commands/workflow/
mv commands/code-review.md .codebuddy/commands/review/
mv commands/security-scan.md .codebuddy/commands/review/
mv commands/e2e.md .codebuddy/commands/testing/
# ... 继续移动所有 Commands

# 创建向后兼容别名
cat > .codebuddy/commands/plan.md << 'EOF'
---
alias: workflow:plan
---
See /workflow:plan for details.
EOF
# ... 继续创建其他别名
```

### 步骤 4：更新 Agents 模型映射

创建脚本批量更新 Agents：
```javascript
// scripts/update-agents-models.js
const fs = require('fs');
const path = require('path');

const MODEL_MAPPING = {
  'opus': 'claude-3-5-sonnet',
  'sonnet': 'claude-3-5-sonnet',
  'haiku': 'claude-3-5-haiku'
};

const agentsDir = path.join(process.cwd(), '.codebuddy/agents');

fs.readdirSync(agentsDir).forEach(file => {
  if (file.endsWith('.md')) {
    const filePath = path.join(agentsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Update model references
    for (const [old, newModel] of Object.entries(MODEL_MAPPING)) {
      content = content.replace(
        new RegExp(`^model:\\s*${old}$`, 'gm'),
        `model: ${newModel}`
      );
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
```

### 步骤 5：更新 Hooks 路径

更新 `hooks/hooks.json` 中的脚本路径：
```javascript
// scripts/update-hooks-paths.js
const fs = require('fs');
const path = require('path');

const hooksConfig = require('../.codebuddy/hooks/hooks.json');

// Update command paths in hooks
function updateHooks(hooks) {
  for (const key in hooks) {
    if (Array.isArray(hooks[key])) {
      hooks[key].forEach(hook => {
        if (hook.hooks && Array.isArray(hook.hooks)) {
          hook.hooks.forEach(h => {
            if (h.command && h.command.startsWith('node ')) {
              // Update path to use scripts/ directory
              h.command = h.command.replace(
                /^node\s+scripts\//,
                'node scripts/'
              );
            }
          });
        }
      });
    }
  }
}

updateHooks(hooksConfig.hooks);

fs.writeFileSync(
  path.join(process.cwd(), '.codebuddy/hooks/hooks.json'),
  JSON.stringify(hooksConfig, null, 2)
);
```

### 步骤 6：运行测试

```bash
# 运行完整测试套件
npm test

# 运行特定测试
node tests/run-all.js

# 验证插件配置
codebuddy plugin validate .codebuddy/plugin.json
```

---

## 六、风险评估与缓解

### 6.1 风险矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **Commands 路径破坏** | 中 | 高 | 创建向后兼容别名 |
| **模型映射错误** | 低 | 高 | 模型切换测试套件 |
| **Hooks 不触发** | 中 | 中 | 事件映射验证 |
| **性能下降** | 中 | 中 | 性能基准测试 |
| **用户迁移困难** | 高 | 中 | 详细迁移文档 |

### 6.2 缓解策略

#### Commands 路径破坏缓解
1. 创建完整的命令别名
2. 在文档中明确标注新路径
3. 提供迁移脚本自动更新用户配置

#### 模型映射错误缓解
1. 建立模型测试矩阵
2. 提供模型回退机制
3. 支持用户自定义模型配置

#### Hooks 不触发缓解
1. 详细的事件映射文档
2. Hook 触发测试用例
3. Hook 调试模式

---

## 七、验收标准

### 7.1 功能验收

| 功能 | 验收标准 |
|------|----------|
| **Commands** | 所有 31 个 Commands 可用，别名正常工作 |
| **Agents** | 所有 13 个 Agents 正确加载，模型映射正确 |
| **Skills** | 所有 53+ 个 Skills 正确加载，分类清晰 |
| **Hooks** | 所有 6 种 Hooks 正确触发，脚本正常执行 |
| **MCP** | MCP 服务器正确连接，工具可用 |

### 7.2 性能验收

| 指标 | 目标值 |
|------|--------|
| **插件加载时间** | < 5 秒 |
| **Command 响应时间** | < 1 秒 |
| **Agent 调用延迟** | < 2 秒 |
| **Hook 执行时间** | < 500 ms |

### 7.3 质量验收

| 指标 | 目标值 |
|------|--------|
| **测试覆盖率** | > 80% |
| **Linter 错误** | 0 |
| **文档完整性** | 100% |
| **向后兼容性** | 100% |

---

## 八、回滚方案

### 8.1 回滚触发条件

- ⚠️ 功能验收不通过
- ⚠️ 性能严重下降（> 50%）
- ⚠️ 发现重大安全漏洞
- ⚠️ 用户反馈强烈负面

### 8.2 回滚步骤

```bash
# 1. 备份当前代码
git add -A
git commit -m "Backup before rollback"

# 2. 回滚到适配前版本
git reset --hard <commit-hash-before-adaptation>

# 3. 删除 .codebuddy 目录
rm -rf .codebuddy

# 4. 恢复原始配置
git restore .claude/
```

### 8.3 回滚验证

- ✅ 原有功能正常工作
- ✅ 无数据丢失
- ✅ 测试全部通过

---

## 九、时间估算

| 阶段 | 预计耗时 | 依赖 |
|------|----------|------|
| **Phase 1** | 2 小时 | 无 |
| **Phase 2** | 4 小时 | Phase 1 |
| **Phase 3** | 6 小时 | Phase 1 |
| **Phase 4** | 8 小时 | Phase 1 |
| **Phase 5** | 4 小时 | Phase 1 |
| **Phase 6** | 6 小时 | Phase 2-5 |
| **Phase 7** | 4 小时 | Phase 1-6 |
| **Phase 8** | 8 小时 | Phase 1-7 |
| **总计** | **42 小时** | - |

**建议排期：** 1-2 周（考虑测试和修复）

---

## 十、后续优化方向

### 10.1 短期优化（1-2 个月）

- [ ] 添加更多国产模型支持
- [ ] 优化 Session 恢复性能
- [ ] 增强命令别名系统
- [ ] 添加性能监控

### 10.2 中期优化（3-6 个月）

- [ ] Skill 选择性加载
- [ ] 智能模型推荐
- [ ] 用户使用分析
- [ ] A/B 测试框架

### 10.3 长期优化（6-12 个月）

- [ ] 机器学习优化模型选择
- [ ] 社区贡献者系统
- [ ] 插件市场集成
- [ ] 多语言支持扩展

---

## 附录

### A. 配置文件模板

详见上方各配置文件示例。

### B. 测试用例清单

```bash
# 功能测试
- Commands 加载测试
- Agents 调用测试
- Skills 查询测试
- Hooks 触发测试
- MCP 连接测试

# 性能测试
- 插件加载时间
- Command 响应时间
- Agent 调用延迟
- Hook 执行时间

# 兼容性测试
- Claude 模型测试
- 国产模型测试
- 跨平台测试（Windows/macOS/Linux）
- 命令别名测试
```

### C. 常见问题

**Q1: 如何切换到国产模型？**

A: 在 `.codebuddy/settings.json` 中修改 `model` 字段：
```json
{
  "model": "glm-5.0"
}
```

**Q2: 如何禁用某些 MCP 服务器？**

A: 在 `.codebuddy/mcp.json` 中删除或注释对应配置。

**Q3: 如何添加自定义 Skill？**

A: 在 `.codebuddy/skills/` 下创建新目录，添加 `SKILL.md` 文件。

---

**方案结束**

**版本：** v1.0  
**日期：** 2026 年 2 月 18 日  
**作者：** AI 分析系统
