# 原设计不一致报告

> **报告日期**: 2026-02-18
> **对比文档**:
> - FULL_ADAPTATION_PLAN.md
> - PATH_HARDCODE_SCAN_REPORT.md
> - DIRECTORY_STRUCTURE_DESIGN.md
> - CODEBUDDY_COMPATIBILITY_MATRIX.md
> - CodeBuddy体系结构文档.md

---

## 📋 发现的不一致项

### 1. Homunculus 路径位置定义不一致

#### 问题: 用户级 vs 项目级数据位置

| 文档 | 定义位置 | 路径 |
|------|---------|------|
| **FULL_ADAPTATION_PLAN.md** (第231行) | 项目数据 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus` |
| **CODEBUDDY_COMPATIBILITY_MATRIX.md** (第261行) | 用户配置 | `~/.codebuddy` 或 `${CODEBUDDY_HOME}` |
| **DIRECTORY_STRUCTURE_DESIGN.md** (新创建) | 未明确指定 | - |
| **PATH_HARDCODE_SCAN_REPORT.md** (第32行) | 用户级 | `~/.claude/homunculus/` → `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` |

#### 不一致分析:

**原始设计 (Claude Code)**:
```
~/.claude/homunculus/  ← 用户级全局数据
```

**CodeBuddy 适配设计文档 A** (FULL_ADAPTATION_PLAN.md):
```
${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/  ← 项目级数据
```

**CodeBuddy 适配设计文档 B** (CODEBUDDY_COMPATIBILITY_MATRIX.md):
```
~/.codebuddy/  ← 用户级配置
${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/  ← 项目级数据
```

**实际情况** (PATH_HARDCODE_SCAN_REPORT.md 第32-35行):
```
~/.claude/homunculus/  ← 用户级数据 (instinct-status, instinct-import, instinct-export)
```

---

### 2. 目录结构定义不一致

#### 问题: CodeBuddy 插件目录命名

| 文档 | 目录名 | 位置 |
|------|--------|------|
| **CODEBUDDY_MIGRATION_GUIDE.md** (第62-64行) | `.codebuddy-plugin/` | 项目根目录 |
| **DIRECTORY_STRUCTURE_DESIGN.md** (新创建) | `.codebuddy-plugin/` | 项目根目录 |
| **原设计 (Claude Code)** | `.claude-plugin/` | 项目根目录 |
| **CODEBUDDY_COMPATIBILITY_MATRIX.md** | 未明确指定 | - |
| **FULL_ADAPTATION_PLAN.md** | 未明确指定 | - |

#### 不一致分析:

| 平台 | 插件目录 | 配置文件 | 市场文件 |
|-----|----------|---------|---------|
| Claude Code | `.claude-plugin/` | `plugin.json` | `marketplace.json` |
| CodeBuddy | `.codebuddy-plugin/` | `plugin.json` | `marketplace.json` |
| 混合设计 | 未明确 | - | - |

---

### 3. 环境变量使用规范不一致

#### 问题: `CODEBUDDY_HOME` 的作用域定义

| 文档 | `CODEBUDDY_HOME` 作用域 | 示例 |
|------|---------------------|------|
| **CODEBUDDY_COMPATIBILITY_MATRIX.md** | 用户级全局配置 | `~/.codebuddy` |
| **DIRECTORY_STRUCTURE_DESIGN.md** | 用户配置 | `~/.codebuddy` |
| **FULL_ADAPTATION_PLAN.md** | 未明确定义 | - |
| **CodeBuddy体系结构文档.md** (第4458行) | 用户级 | `~/.codebuddy/settings.json` |

#### 不一致分析:

**当前文档中的定义**:

```bash
# 用户级配置
${CODEBUDDY_HOME} → ~/.codebuddy

# 项目级数据
${CODEBUDDY_PROJECT_DIR}/.codebuddy → 项目专属数据

# 插件根目录
${CODEBUDDY_PLUGIN_ROOT} → 插件安装位置
```

**但在 FULL_ADAPTATION_PLAN.md 中**:
- 第232行: `**用户目录** | ~ 或 %USERPROFILE%`
- 未明确 `CODEBUDDY_HOME` 与 `~` 的关系

---

### 4. Hook 脚本路径处理不一致

#### 问题: Hook 脚本应使用的环境变量

| 文档 | Hook 脚本位置 | 使用的变量 |
|------|--------------|-----------|
| **FULL_ADAPTATION_PLAN.md** (第227行) | `${CODEBUDDY_PLUGIN_ROOT}/hooks` | `CODEBUDDY_PLUGIN_ROOT` |
| **DIRECTORY_STRUCTURE_DESIGN.md** (新创建) | `${CODEBUDDY_PLUGIN_ROOT}/hooks` | `CODEBUDDY_PLUGIN_ROOT` |
| **实际配置需求** (observe.sh) | - | `CODEBUDDY_PROJECT_DIR` 或 `CODEBUDDY_HOME` |

#### 不一致分析:

**observe.sh 脚本中的实际需求**:
```bash
# 需要存储数据到
${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/

# 但配置中建议使用
${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh
```

**问题**: Hook 脚本是**用户级插件脚本** (在 `${CODEBUDDY_PLUGIN_ROOT}`)，但需要写入**项目级数据** (`${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/`)

---

### 5. Continuous Learning 配置路径不一致

#### 问题: config.json 中的路径定义

| 文档 | 配置路径 | 数据位置 |
|------|---------|---------|
| **PATH_HARDCODE_SCAN_REPORT.md** (第82行) | `~/.claude/homunculus/` | 用户级 |
| **FULL_ADAPTATION_PLAN.md** (第231行) | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` | 项目级 |
| **实际文件** (instinct-cli.py 第27行) | `~/.claude/homunculus/` | 用户级 |

#### 不一致分析:

**原始设计** (Claude Code):
- Continuous Learning 数据存储在**用户级**目录 `~/.claude/homunculus/`
- 跨项目共享学习数据

**适配设计 A** (FULL_ADAPTATION_PLAN.md):
- Continuous Learning 数据存储在**项目级**目录 `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/`
- 每个项目独立数据

**适配设计 B** (未明确):
- 可能需要支持**用户级**和**项目级**两种模式

---

### 6. Commands 路径修复目标不一致

#### 问题: Commands 中的路径映射

| Command | 原始路径 | 修复目标 (PATH_HARDCODE_SCAN_REPORT.md) | 其他文档支持 |
|----------|---------|-----------------------------------|------------|
| `/instinct-status` | `~/.claude/homunculus/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` | ❌ 未明确 |
| `/instinct-import` | `~/.claude/homunculus/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` | ❌ 未明确 |
| `/instinct-export` | `~/.claude/homunculus/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` | ❌ 未明确 |
| `/evolve` | `~/.claude/homunculus/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` | ❌ 未明确 |
| `/checkpoint` | `.claude/checkpoints.log` | `.codebuddy/checkpoints.log` | ❌ 未明确 |
| `/eval` | `.claude/evals/` | `.codebuddy/evals/` | ❌ 未明确 |

#### 不一致分析:

**PATH_HARDCODE_SCAN_REPORT.md** 建议:
- 将用户级 `~/.claude/homunculus/` 改为项目级 `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/`

**但原始设计意图**:
- Continuous Learning 应该是**跨项目共享**的学习数据
- 从一个项目学到的本能应该可以应用到其他项目

---

### 7. 工作量估算不一致

#### 问题: 修复工作量不匹配

| 文档 | 路径硬编码修复工作量 |
|------|-------------------|
| **FULL_ADAPTATION_PLAN.md** (第27行) | **6h** (P0) |
| **PATH_HARDCODE_SCAN_REPORT.md** (第19行) | **6h** (P0) |
| **CONTINUOUS_LEARNING_ADAPTATION_CHECKLIST.md** | **12.5h** (P0: 2.5h, P1: 5h, P2: 5h) |

#### 不一致分析:

**FULL_ADAPTATION_PLAN.md** 总计:
- 阶段 1-5 总工作量: 110h
- 路径硬编码修复 (任务3.3): 6h

**CONTINUOUS_LEARNING_ADAPTATION_CHECKLIST.md** (新创建):
- Continuous Learning v2 独立工作量: 12.5h
- 如果包含在阶段2中,会导致总工作量计算不一致

---

## 🔧 建议的统一方案

### 方案 A: 用户级数据 (推荐)

**理念**: Continuous Learning 数据应该跨项目共享

```
用户级配置:
~/.codebuddy/
├── homunculus/                    ← Continuous Learning 数据
│   ├── observations.jsonl
│   ├── instincts/
│   │   ├── personal/
│   │   └── inherited/
│   └── evolved/
├── config.json                    ← CodeBuddy 全局配置
└── settings.json                  ← 用户级设置

项目级数据:
${CODEBUDDY_PROJECT_DIR}/.codebuddy/
├── session.json                   ← 项目会话
└── checkpoints/                  ← 项目检查点
```

**路径映射**:
```bash
# Continuous Learning 数据
~/.claude/homunculus/ → ~/.codebuddy/homunculus/

# Hook 配置
${CLAUDE_PLUGIN_ROOT} → ${CODEBUDDY_PLUGIN_ROOT}

# 项目数据
.claude/ → .codebuddy/
```

---

### 方案 B: 项目级数据

**理念**: 每个项目独立的学习数据

```
项目级数据:
${CODEBUDDY_PROJECT_DIR}/.codebuddy/
├── homunculus/                    ← 项目专属学习数据
│   ├── observations.jsonl
│   ├── instincts/
│   └── evolved/
├── session.json
└── checkpoints/

用户级配置:
~/.codebuddy/
├── config.json
└── settings.json
```

**路径映射**:
```bash
# Continuous Learning 数据
~/.claude/homunculus/ → ${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/

# Hook 配置
${CLAUDE_PLUGIN_ROOT} → ${CODEBUDDY_PLUGIN_ROOT}
```

---

### 方案 C: 混合模式 (最佳)

**理念**: 支持用户级和项目级两种模式

```
用户级配置 (共享数据):
~/.codebuddy/
├── homunculus/                    ← 默认: 跨项目共享
│   ├── observations.jsonl
│   ├── instincts/
│   └── evolved/
├── config.json
└── settings.json

项目级数据 (可选覆盖):
${CODEBUDDY_PROJECT_DIR}/.codebuddy/
├── homunculus/                    ← 可选: 项目专属数据
│   └── (结构同用户级)
├── session.json
└── continuous-learning.json         ← 配置选择模式
```

**优先级规则**:
```bash
# 1. 优先使用项目级配置
if [ -f "${CODEBUDDY_PROJECT_DIR}/.codebuddy/continuous-learning.json" ]; then
    HOMUNCULUS_DIR="${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"
# 2. 回退到用户级配置
else
    HOMUNCULUS_DIR="${CODEBUDDY_HOME}/homunculus"
fi
```

---

## ✅ 需要统一的内容

### 1. 明确定义目录结构

创建统一的目录规范文档:

```
CodeBuddy 目录结构:
├── .codebuddy-plugin/              # 插件市场配置
│   ├── plugin.json
│   └── marketplace.json
├── .codebuddy/                   # 项目级配置 (每个项目)
│   ├── homunculus/               # Continuous Learning 数据
│   ├── session.json
│   └── checkpoints/
├── agents/
├── commands/
├── skills/
│   └── continuous-learning-v2/
│       ├── hooks/
│       ├── scripts/
│       └── config.json
└── rules/
```

### 2. 更新所有文档中的路径定义

| 需要更新的文档 | 当前状态 | 目标 |
|--------------|---------|------|
| FULL_ADAPTATION_PLAN.md | 用户级 vs 项目级混淆 | 明确方案 |
| CODEBUDDY_COMPATIBILITY_MATRIX.md | 未指定插件目录 | 添加 `.codebuddy-plugin/` |
| DIRECTORY_STRUCTURE_DESIGN.md | 新创建,需要验证 | 与其他文档一致 |
| PATH_HARDCODE_SCAN_REPORT.md | 修复目标不明确 | 明确最终路径 |
| CONTINUOUS_LEARNING_ADAPTATION_CHECKLIST.md | 工作量独立计算 | 合并到主计划 |

### 3. 统一环境变量使用规范

```bash
# 用户级配置
CODEBUDDY_HOME → ~/.codebuddy

# 项目级配置
CODEBUDDY_PROJECT_DIR → 项目根目录

# 插件根目录
CODEBUDDY_PLUGIN_ROOT → 插件安装位置

# 用户主目录 (跨平台)
~ → %USERPROFILE% (Windows) 或 $HOME (Linux/Mac)
```

### 4. 明确 Continuous Learning 数据位置

**建议**: 采用**方案 C (混合模式)**

```python
# instinct-cli.py 修改建议
import os
from pathlib import Path

# 优先级: 项目级 → 用户级
PROJECT_DIR = Path(os.environ.get('CODEBUDDY_PROJECT_DIR', ''))
USER_HOME = Path(os.environ.get('CODEBUDDY_HOME', ''))

# 方案 C: 混合模式
if PROJECT_DIR and (PROJECT_DIR / '.codebuddy' / 'continuous-learning.json').exists():
    # 项目级模式
    HOMUNCULUS_DIR = PROJECT_DIR / '.codebuddy' / 'homunculus'
elif USER_HOME:
    # 用户级模式 (默认)
    HOMUNCULUS_DIR = USER_HOME / 'homunculus'
else:
    # 回退: 旧路径
    HOMUNCULUS_DIR = Path.home() / '.claude' / 'homunculus'
```

---

## 📋 行动项

### 立即行动 (P0)

- [ ] **确定最终方案** (0.5h)
  - 方案 A: 用户级数据
  - 方案 B: 项目级数据
  - 方案 C: 混合模式 ⭐ **推荐**

- [ ] **更新 FULL_ADAPTATION_PLAN.md** (1h)
  - 明确 Homunculus 数据位置
  - 添加 `.codebuddy-plugin/` 目录定义
  - 统一环境变量使用规范

- [ ] **更新 DIRECTORY_STRUCTURE_DESIGN.md** (0.5h)
  - 与最终方案保持一致
  - 明确混合模式的优先级规则

### 短期行动 (P1)

- [ ] **更新 PATH_HARDCODE_SCAN_REPORT.md** (1h)
  - 明确修复目标的最终路径
  - 根据方案更新修复说明

- [ ] **更新 CODEBUDDY_COMPATIBILITY_MATRIX.md** (0.5h)
  - 添加 `.codebuddy-plugin/` 目录说明
  - 统一路径定义

- [ ] **合并工作量计算** (0.5h)
  - 将 CONTINUOUS_LEARNING_ADAPTATION_CHECKLIST.md 的工作量合并到主计划
  - 确保总工作量准确

---

## 📚 参考文档

- [完整适配计划](./FULL_ADAPTATION_PLAN.md)
- [路径硬编码扫描报告](./PATH_HARDCODE_SCAN_REPORT.md)
- [目录结构设计](./DIRECTORY_STRUCTURE_DESIGN.md)
- [CodeBuddy兼容性矩阵](./CODEBUDDY_COMPATIBILITY_MATRIX.md)
- [Continuous Learning 适配清单](./CONTINUOUS_LEARNING_ADAPTATION_CHECKLIST.md)
