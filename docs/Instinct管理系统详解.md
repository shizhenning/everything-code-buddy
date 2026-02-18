# Instinct (本能) 管理系统详解

**文档版本:** v1.0
**制定日期:** 2026-02-18
**关联项目:** 持续学习 v2 (Continuous Learning v2)

---

## 📋 目录

1. [什么是 Instinct 系统](#什么是-instinct-系统)
2. [Instinct 的核心概念](#instinct-的核心概念)
3. [系统架构](#系统架构)
4. [数据结构](#数据结构)
5. [调用流程](#调用流程)
6. [置信度评分机制](#置信度评分机制)
7. [命令接口](#命令接口)
8. [API 接口](#api-接口)
9. [文件系统组织](#文件系统组织)
10. [与 Claude Code 的集成](#与-claude-code-的集成)

---

## 什么是 Instinct 系统

### 1.1 定义

**Instinct (本能)** 是持续学习 v2 系统的核心概念,它是一种**小型的、原子的学习行为**,描述了在特定触发条件下应该采取的行动。

### 1.2 核心思想

传统技能 (Skills) 是完整的知识库,而本能 (Instincts) 是**原子化的、可组合的**学习单元:

| 特性 | Skills (技能) | Instincts (本能) |
|------|--------------|-----------------|
| **粒度** | 完整知识库 | 单一触发-动作对 |
| **大小** | 大(数百行) | 小(几十行) |
| **创建方式** | 手动编写 | 自动学习 |
| **组合性** | 独立使用 | 可聚类演化 |
| **评分** | 无 | 0.3-0.9 置信度 |
| **演化** | 手动维护 | 自动演化 |

### 1.3 为什么要用 Instinct?

**问题:** 传统的持续学习 v1 创建完整的技能,但:
- 技能太大,难以精确匹配场景
- 无法量化"学习程度"
- 难以组合和演化
- 触发概率不稳定(50-80%)

**解决方案:** Instinct 系统
- **原子化:** 每个本能只有"一个触发,一个动作"
- **置信度:** 量化学习程度(0.3-0.9)
- **可组合:** 多个本能可聚类为技能/命令/代理
- **100% 触发:** 通过 Hooks 保证,不依赖 AI 判断

---

## Instinct 的核心概念

### 2.1 本能的四个属性

#### 2.1.1 原子性 (Atomicity)

一个本能只包含:
- **一个触发条件** (Trigger) - 何时应用
- **一个动作** (Action) - 做什么

**示例:**
```yaml
trigger: "when writing new functions"
action: "Use functional patterns over classes"
```

#### 2.1.2 置信度加权 (Confidence-weighted)

置信度范围: 0.3 - 0.9

| 分数 | 含义 | 行为 |
|------|------|------|
| 0.3 | 尝试性的 | 建议但不强制执行 |
| 0.5 | 中等的 | 相关时应用 |
| 0.7 | 强烈的 | 自动批准应用 |
| 0.9 | 近乎确定的 | 核心行为 |

#### 2.1.3 领域标记 (Domain-tagged)

本能被分类到不同领域:
- `code-style` - 代码风格
- `testing` - 测试
- `git` - Git 工作流
- `debugging` - 调试
- `workflow` - 工作流程
- `tool-preference` - 工具偏好

#### 2.1.4 证据支持 (Evidence-backed)

每个本能记录:
- 观察次数
- 创建时间
- 最后观察时间
- 来源 (session-observation / repo-analysis / inherited)

### 2.2 本能的生命周期

```
1. 创建阶段
   ↓
   通过观察检测到模式 (Observer Agent)
   ↓
   创建初始本能 (confidence = 0.3-0.5)
   
2. 学习阶段
   ↓
   反复观察相同模式
   ↓
   置信度提升 (+0.05 每次)
   ↓
   达到高置信度 (0.7+)
   
3. 应用阶段
   ↓
   满足触发条件
   ↓
   根据置信度决定是否应用
   
4. 演化阶段
   ↓
   相关本能聚类
   ↓
   演化为技能/命令/代理
```

---

## 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code 环境                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 1. Hook 触发 (100% 可靠)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Hooks 系统                               │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ PreToolUse  │  │ PostToolUse │                │
│  │   Hook      │  │   Hook      │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 2. 写入观察数据
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              observations.jsonl                            │
│  (prompts, tool calls, outcomes)                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 3. 后台分析
                          ↓
┌─────────────────────────────────────────────────────────────┐
│             Observer Agent (Haiku)                       │
│                                                       │
│  模式检测:                                            │
│  • 用户纠正 → instinct                                │
│  • 错误解决 → instinct                               │
│  • 重复工作流 → instinct                              │
│  • 工具偏好 → instinct                                │
│                                                       │
│  置信度计算:                                            │
│  • 基于观察次数                                      │
│  • 基于历史记录                                      │
│  • 动态调整                                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 4. 创建/更新本能
                          ↓
┌─────────────────────────────────────────────────────────────┐
│           Instinct 存储系统 (文件系统)                    │
│                                                       │
│  ~/.claude/homunculus/instincts/                      │
│  ├── personal/      ← 自动学习的本能                    │
│  └── inherited/     ← 导入的本能                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 5. 查询和操作
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              Instinct CLI (Python 脚本)                  │
│                                                       │
│  命令:                                                │
│  • status   - 查看所有本能                          │
│  • export   - 导出本能                              │
│  • import   - 导入本能                              │
│  • evolve   - 聚类演化本能                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ 6. Claude Code 命令
                          ↓
┌─────────────────────────────────────────────────────────────┐
│            Claude Code 命令系统                         │
│  /instinct-status                                      │
│  /instinct-export                                      │
│  /instinct-import                                      │
│  /evolve                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心组件

#### 3.2.1 Hooks 系统

**位置:** `~/.claude/settings.json`

**作用:** 100% 可靠地捕获所有工具调用

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

**调用流程:**
1. 用户使用工具 (如 Edit)
2. Claude Code 触发 PreToolUse Hook
3. 执行 `observe.sh pre`
4. 记录工具开始事件
5. 工具执行完成
6. Claude Code 触发 PostToolUse Hook
7. 执行 `observe.sh post`
8. 记录工具完成事件
9. 数据写入 `observations.jsonl`

#### 3.2.2 Observer Agent

**位置:** `skills/continuous-learning-v2/agents/observer.md`

**作用:** 后台分析观察数据,创建本能

**运行模式:**
- Haiku 模型 (成本优化)
- 后台运行
- 每 5 分钟或收集 20+ 观察后触发

**模式检测:**
1. **用户纠正 (User Corrections)**
   - 检测: "No, use X instead of Y"
   - 创建: "When doing X, prefer Y"

2. **错误解决 (Error Resolutions)**
   - 检测: 工具错误 → 修复模式
   - 创建: "When encountering error X, try Y"

3. **重复工作流 (Repeated Workflows)**
   - 检测: 相同工具序列重复出现
   - 创建: "When doing X, follow steps Y, Z, W"

4. **工具偏好 (Tool Preferences)**
   - 检测: 一直使用特定工具组合
   - 创建: "When needing X, use tool Y"

#### 3.2.3 Instinct CLI

**位置:** `skills/continuous-learning-v2/scripts/instinct-cli.py`

**作用:** 提供 Python API 和 CLI 命令

**API 函数:**
- `load_all_instincts()` - 加载所有本能
- `parse_instinct_file()` - 解析本能文件
- `save_instinct()` - 保存本能
- `update_confidence()` - 更新置信度
- `cluster_instincts()` - 聚类本能

**CLI 命令:**
- `python3 instinct-cli.py status` - 显示所有本能
- `python3 instinct-cli.py export` - 导出本能
- `python3 instinct-cli.py import` - 导入本能
- `python3 instinct-cli.py evolve` - 聚类演化本能

#### 3.2.4 文件系统

**位置:** `~/.claude/homunculus/`

```
~/.claude/homunculus/
├── identity.json           # 用户档案,技术水平
├── observations.jsonl      # 当前会话观察
├── observations.archive/   # 已处理的观察
├── instincts/
│   ├── personal/           # 自动学习的本能
│   │   ├── prefer-functional-style.yaml
│   │   ├── always-test-first.yaml
│   │   └── use-zod-validation.yaml
│   └── inherited/          # 导入的本能
│       └── team-patterns.yaml
└── evolved/
    ├── agents/             # 生成的专家代理
    ├── skills/             # 生成的技能
    └── commands/           # 生成的命令
```

---

## 数据结构

### 4.1 本能文件格式

本能使用 YAML 前置元数据 + Markdown 内容的格式:

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
source: "session-observation"
created: "2025-01-22T10:30:00Z"
last_observed: "2025-01-22T10:30:00Z"
observation_count: 5
---

# Prefer Functional Style

## Action
Use functional patterns over classes when appropriate.

## Evidence
- Observed 5 instances of functional pattern preference
- User corrected class-based approach to functional on 2025-01-15
- Pattern appeared in 3 different files

## Examples

### Bad (What Not to Do)
```typescript
class UserService {
  // ...
}
```

### Good (What to Do)
```typescript
const UserService = {
  // ...
}
```
```

### 4.2 元数据字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识符 |
| `trigger` | string | ✅ | 触发条件描述 |
| `confidence` | float | ✅ | 置信度 (0.3-0.9) |
| `domain` | string | ✅ | 领域分类 |
| `source` | string | ✅ | 来源 |
| `created` | ISO8601 | ⚠️ | 创建时间 |
| `last_observed` | ISO8601 | ⚠️ | 最后观察时间 |
| `observation_count` | int | ⚠️ | 观察次数 |

### 4.3 观察数据格式

`observations.jsonl` 使用 JSONL (每行一个 JSON):

```jsonl
{"timestamp":"2025-01-22T10:30:00Z","event":"tool_start","session":"abc123","tool":"Edit","input":"src/app.ts line 10"}
{"timestamp":"2025-01-22T10:30:01Z","event":"tool_complete","session":"abc123","tool":"Edit","output":"Success"}
{"timestamp":"2025-01-22T10:30:05Z","event":"tool_start","session":"abc123","tool":"Bash","input":"npm test"}
{"timestamp":"2025-01-22T10:30:10Z","event":"tool_complete","session":"abc123","tool":"Bash","output":"All tests pass"}
```

---

## 调用流程

### 5.1 完整调用链

```
用户操作
   ↓
[1] Claude Code 调用工具
   ↓
[2] 触发 PreToolUse Hook
   ↓
[3] 执行 observe.sh pre
   ↓
[4] 写入 tool_start 事件到 observations.jsonl
   ↓
[5] 工具执行
   ↓
[6] 触发 PostToolUse Hook
   ↓
[7] 执行 observe.sh post
   ↓
[8] 写入 tool_complete 事件到 observations.jsonl
   ↓
[9] 触发 Observer (SIGUSR1 或定时)
   ↓
[10] Observer Agent 读取 observations.jsonl
   ↓
[11] 模式检测 (Haiku)
   ↓
[12] 创建/更新本能文件
   ↓
[13] 用户调用 /instinct-status
   ↓
[14] 执行 instinct-cli.py status
   ↓
[15] 读取所有本能文件
   ↓
[16] 解析并显示给用户
```

### 5.2 详细调用示例

#### 示例 1: 用户纠正导致本能创建

```
[时间: 10:30:00]
用户: "创建一个 UserService 类"
Claude: 使用 Edit 创建类文件
  → Hook: observe.sh pre → 写入 tool_start
  → Edit 完成
  → Hook: observe.sh post → 写入 tool_complete

[时间: 10:30:15]
用户: "不对,应该是函数式风格,不是类"
Claude: 使用 Edit 改为函数式
  → Hook: observe.sh pre → 写入 tool_start
  → Edit 完成
  → Hook: observe.sh post → 写入 tool_complete

[时间: 10:35:00] (5分钟后或20+观察后)
Observer Agent 分析:
  → 检测到模式: 用户纠正 "类 → 函数式"
  → 查看历史: 此模式出现 5 次
  → 计算置信度: 0.7
  → 创建文件: ~/.claude/homunculus/instincts/personal/prefer-functional-style.yaml

[时间: 10:40:00]
用户: "/instinct-status"
Claude: 执行 python3 instinct-cli.py status
  → 读取 ~/.claude/homunculus/instincts/personal/prefer-functional-style.yaml
  → 解析 YAML 元数据
  → 显示: "prefer-functional-style (70%) - 当编写新函数时使用函数式风格"
```

#### 示例 2: 导出本能

```
[时间: 11:00:00]
用户: "/instinct-export"
Claude: 执行 python3 instinct-cli.py export
  → 读取所有本能文件
  → 打包为 JSON
  → 保存到 ~/instincts-export.json

[时间: 11:05:00]
用户: 分享 ~/instincts-export.json 给团队
其他成员: 下载并执行 /instinct-import
  → python3 instinct-cli.py import ~/instincts-export.json
  → 保存到 ~/.claude/homunculus/instincts/inherited/
```

---

## 置信度评分机制

### 6.1 初始置信度计算

基于观察次数:

| 观察次数 | 初始置信度 | 含义 |
|---------|------------|------|
| 1-2 | 0.3 | 尝试性的 |
| 3-5 | 0.5 | 中等的 |
| 6-10 | 0.7 | 强烈的 |
| 11+ | 0.85 | 非常强 |

### 6.2 动态调整

#### 6.2.1 置信度增加 (+0.05)

触发条件:
- 模式被反复观察到
- 用户未纠正建议的行为
- 来自其他来源的相似本能一致

#### 6.2.2 置信度降低 (-0.1)

触发条件:
- 用户明确纠正该行为
- 出现矛盾证据

#### 6.2.3 衰减 (-0.02/周)

触发条件:
- 长时间未观察到该模式
- 本能不再相关

### 6.3 置信度应用

| 置信度 | 应用行为 | 场景 |
|--------|---------|------|
| 0.3-0.4 | **建议但提示用户** | 新学习的模式 |
| 0.5-0.6 | **相关时自动应用** | 有一定信心的模式 |
| 0.7-0.8 | **自动批准应用** | 强烈的信号 |
| 0.9+ | **核心行为,无需提示** | 确定的习惯 |

### 6.4 置信度可视化

```
prefer-functional-style (70%)
█████████░░
```

---

## 命令接口

### 7.1 /instinct-status

**描述:** 显示所有已学习的本能及其置信度

**调用方式:**
```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

**输出示例:**
```
============================================================
  INSTINCT STATUS - 12 total
============================================================

  Personal:  10
  Inherited:  2

## CODE-STYLE (4)

  █████████░░ 70%  prefer-functional-style
            trigger: when writing new functions
            action: Use functional patterns over classes

  ████████░░░ 85%  always-immutable-data
            trigger: when handling state
            action: Always use immutable data structures

## TESTING (3)

  ████████████ 90%  always-test-first
            trigger: when writing new code
            action: Write tests before implementation

## WORKFLOW (5)

  ███████░░░░  60%  grep-then-read-then-edit
            trigger: when modifying code
            action: Search with Grep, confirm with Read, then Edit

------------------------------------------------------------
  Observations: 156 events logged
  File: /home/user/.claude/homunculus/observations.jsonl

============================================================
```

### 7.2 /instinct-export

**描述:** 导出本能用于分享

**调用方式:**
```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py export > my-instincts.json
```

**输出格式:**
```json
{
  "version": "2.0",
  "exported_at": "2025-01-22T11:00:00Z",
  "instincts": [
    {
      "id": "prefer-functional-style",
      "trigger": "when writing new functions",
      "confidence": 0.7,
      "domain": "code-style",
      "content": "..."
    }
  ]
}
```

### 7.3 /instinct-import

**描述:** 从他人处导入本能

**调用方式:**
```bash
# 从文件导入
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import ~/instincts-export.json

# 从 URL 导入
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import https://example.com/instincts.json
```

**行为:**
- 导入到 `~/.claude/homunculus/instincts/inherited/`
- 标记 `source: "inherited"`
- 保留原始置信度

### 7.4 /evolve

**描述:** 将相关本能聚类为技能/命令/代理

**调用方式:**
```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve
```

**行为:**
1. 读取所有本能
2. 按领域分组
3. 检测聚类 (相似的本能)
4. 生成技能/命令/代理
5. 保存到 `~/.claude/homunculus/evolved/`

**输出示例:**
```
Evolving 12 instincts...

Found clusters:
  - Testing workflow (3 instincts) → skill
  - Code style preferences (4 instincts) → command
  - Error resolution patterns (2 instincts) → agent

Generated:
  ✅ skills/testing-workflow.md
  ✅ commands/apply-style.md
  ✅ agents/error-specialist.md
```

---

## API 接口

### 8.1 Python API

位置: `skills/continuous-learning-v2/scripts/instinct-cli.py`

#### 8.1.1 加载本能

```python
from pathlib import Path

# 添加到 Python 路径
import sys
sys.path.insert(0, str(Path.home() / '.claude/skills/continuous-learning-v2/scripts'))

from instinct_cli import load_all_instincts

# 加载所有本能 (personal + inherited)
instincts = load_all_instincts()

# 按领域筛选
code_style_instincts = [i for i in instincts if i.get('domain') == 'code-style']

# 按置信度排序
high_confidence = [i for i in instincts if i.get('confidence') >= 0.7]
```

#### 8.1.2 查询本能

```python
from instinct_cli import load_all_instincts

instincts = load_all_instincts()

# 按 ID 查找
instinct = next((i for i in instincts if i.get('id') == 'prefer-functional-style'), None)

# 按触发条件查找
relevant = [i for i in instincts if 'functional' in i.get('trigger', '')]

# 按置信度筛选
approved = [i for i in instincts if i.get('confidence') >= 0.7]
```

#### 8.1.3 更新置信度

```python
from instinct_cli import update_confidence, parse_instinct_file, save_instinct

# 读取本能文件
content = Path('~/.claude/homunculus/instincts/personal/prefer-functional-style.yaml').read_text()
instinct = parse_instinct_file(content)[0]

# 增加置信度
new_confidence = min(0.9, instinct['confidence'] + 0.05)
instinct['confidence'] = new_confidence

# 保存更新后的本能
save_instinct(instinct, 'personal')
```

#### 8.1.4 聚类本能

```python
from instinct_cli import cluster_instincts, load_all_instincts

instincts = load_all_instincts()

# 聚类相似本能
clusters = cluster_instincts(
    instincts, 
    threshold=0.7,  # 相似度阈值
    min_cluster_size=3  # 最小聚类大小
)

# clusters 格式:
# [
#   {
#     'domain': 'testing',
#     'instincts': [inst1, inst2, inst3],
#     'suggested_type': 'skill'
#   },
#   ...
# ]
```

---

## 文件系统组织

### 9.1 目录结构

```
~/.claude/homunculus/
├── identity.json           # 用户档案
├── observations.jsonl      # 观察数据 (JSONL)
├── observations.archive/   # 归档的观察
│   ├── observations-20250115-100000.jsonl
│   └── observations-20250116-100000.jsonl
├── instincts/
│   ├── personal/           # 自动学习的本能
│   │   ├── prefer-functional-style.yaml
│   │   ├── always-test-first.yaml
│   │   └── use-zod-validation.yaml
│   └── inherited/          # 导入的本能
│       └── team-patterns.yaml
├── evolved/              # 演化结果
│   ├── agents/             # 生成的代理
│   │   └── refactor-specialist.md
│   ├── skills/             # 生成的技能
│   │   └── testing-workflow.md
│   └── commands/           # 生成的命令
│       └── apply-style.md
├── .observer.pid          # Observer 进程 ID
├── disabled             # 存在此文件时禁用观察
└── config.json           # 系统配置
```

### 9.2 配置文件

`config.json` 完整配置:

```json
{
  "version": "2.0",
  "observation": {
    "enabled": true,
    "store_path": "~/.claude/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7,
    "capture_tools": ["Edit", "Write", "Bash", "Read", "Grep", "Glob"],
    "ignore_tools": ["TodoWrite"]
  },
  "instincts": {
    "personal_path": "~/.claude/homunculus/instincts/personal/",
    "inherited_path": "~/.claude/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7,
    "confidence_decay_rate": 0.02,
    "max_instincts": 100
  },
  "observer": {
    "enabled": false,
    "model": "haiku",
    "run_interval_minutes": 5,
    "min_observations_to_analyze": 20,
    "patterns_to_detect": [
      "user_corrections",
      "error_resolutions",
      "repeated_workflows",
      "tool_preferences",
      "file_patterns"
    ]
  },
  "evolution": {
    "cluster_threshold": 3,
    "evolved_path": "~/.claude/homunculus/evolved/",
    "auto_evolve": false
  },
  "integration": {
    "skill_creator_api": "https://skill-creator.app/api",
    "backward_compatible_v1": true
  }
}
```

---

## 与 Claude Code 的集成

### 10.1 Hook 集成

Claude Code 通过 `~/.claude/settings.json` 中的 Hooks 配置集成:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

**关键点:**
- 使用 `${CLAUDE_PLUGIN_ROOT}` 环境变量
- matcher 为 `"*"` 表示所有工具
- type 为 `"command"` 表示执行脚本

### 10.2 命令集成

持续学习 v2 的命令通过 Claude Code 的命令系统调用:

**方式 1: 直接调用 Python 脚本**
```bash
/instinct-status
```
→ 实际执行: `python3 instinct-cli.py status`

**方式 2: 通过 Claude Code 技能系统**
```bash
/evolve
```
→ Claude Code 识别为持续学习 v2 技能
→ 调用技能中的脚本

### 10.3 Agent 集成

Observer Agent 作为后台 Agent 运行:

```bash
# 启动 Observer
~/.claude/skills/continuous-learning-v2/agents/start-observer.sh

# Agent 配置 (observer.md)
---
name: observer
description: Background agent that analyzes session observations...
model: haiku
run_mode: background
---
```

**特点:**
- 使用 Haiku 模型 (成本优化)
- 后台运行
- 监听信号 (SIGUSR1) 立即触发分析

---

## 附录

### A. 为什么 Instinct 系统是 Claude Code 特有的?

#### A.1 依赖 Claude Code 特有功能

| 功能 | Claude Code | 其他平台 | 说明 |
|------|-------------|-----------|------|
| **Hooks 系统** | ✅ | ⚠️ 部分 | CodeBuddy 支持基础 Hooks |
| **后台 Agent** | ✅ | ❌ | CodeBuddy 不支持 |
| **Haiku 集成** | ✅ | ❌ | 模型 API 集成 |
| **Instinct API** | ✅ | ❌ | 专有 API |
| **环境变量** | CLAUDE_* | 不同 | 平台特定变量 |

#### A.2 平台对比

**Claude Code:**
- ✅ 完整 Hooks 系统
- ✅ 后台 Agent 支持
- ✅ Haiku 模型集成
- ✅ Instinct 管理系统
- ✅ 命令系统集成

**CodeBuddy:**
- ⚠️ 基础 Hooks (无后台)
- ❌ 无后台 Agent
- ❌ 无 Haiku 集成
- ❌ 无 Instinct 系统
- ⚠️ 需手动配置命令

### B. 代码示例

#### B.1 读取本能文件

```python
import yaml
from pathlib import Path

instinct_path = Path.home() / '.claude/homunculus/instincts/personal/prefer-functional-style.yaml'

with open(instinct_path) as f:
    content = f.read()
    
# 解析 YAML 前置元数据
frontmatter_end = content.find('\n---', 1)  # 第二个 ---
frontmatter_yaml = content[:frontmatter_end]
metadata = yaml.safe_load(frontmatter_yaml)

print(f"ID: {metadata['id']}")
print(f"Confidence: {metadata['confidence']}")
print(f"Domain: {metadata['domain']}")
```

#### B.2 写入本能文件

```python
import yaml
from pathlib import Path
from datetime import datetime

instinct = {
    'id': 'prefer-functional-style',
    'trigger': 'when writing new functions',
    'confidence': 0.7,
    'domain': 'code-style',
    'source': 'session-observation',
    'created': datetime.now().isoformat(),
    'observation_count': 5
}

frontmatter = yaml.dump(instinct, default_flow_style=False)
content = f"""---
{frontmatter}
---

# Prefer Functional Style

## Action
Use functional patterns over classes.

## Evidence
- Observed 5 instances
"""

output_path = Path.home() / '.claude/homunculus/instincts/personal/prefer-functional-style.yaml'
output_path.write_text(content)
```

### C. 常见问题

**Q: Instinct 系统会记录我的代码吗?**
A: 不会。Instinct 系统只记录:
- 模式 (如"用户偏好函数式风格")
- 置信度评分
- 观察次数

不记录实际的代码内容或对话内容。

**Q: 可以在 CodeBuddy 中使用吗?**
A: 目前不行。CodeBuddy 不支持:
- 后台 Agent
- Instinct API
- 置信度评分系统

详见 [持续学习v2适配CodeBuddy分析报告.md](./持续学习v2适配CodeBuddy分析报告.md)

**Q: 如何分享本能?**
A: 使用 `/instinct-export` 导出,然后分享文件:
```bash
/instinct-export > my-instincts.json
```

接收方使用 `/instinct-import` 导入:
```bash
/instinct-import ~/instincts-export.json
```

---

**文档版本:** v1.0
**最后更新:** 2026-02-18
**维护者:** ECC 项目组
