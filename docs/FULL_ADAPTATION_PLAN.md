# Everything Claude Code → CodeBuddy 完整适配计划

> **项目**: Everything Claude Code (ECC) v1.4.1
> **目标**: 腾讯云 CodeBuddy 编程助手 v2.50+
> **计划版本**: v1.0
> **创建日期**: 2026-02-13
> **预计完成**: 2026-03-15

---

## 📋 执行摘要

### 计划概览

| 维度 | 数据 | 说明 |
|------|------|------|
| **组件总数** | 118+ | 包括 Agents, Commands, Skills, Rules, Hooks 等 |
| **完全兼容** | 94 (80%) | 无需修改即可使用 |
| **需要调整** | 15 (13%) | 需要适配工作 |
| **不兼容** | 9 (7%) | 需要重构或替代方案 |
| **总工作量** | ~125 小时 | 约 15.6 个工作日 (含设计不一致修复) |
| **优先级** | P0: 79h, P1: 31h, P2: 15h | 按优先级分配 |

**阶段优先级分布**:
- 阶段 1: P0 15h
- 阶段 2: P0 24h + P1 3h
- 阶段 3: P0 18h + P1 16h (路径硬编码修复 6h + 插件市场发布 8h)
- 阶段 4: P1 12h
- 阶段 5: P0 8h
- **新增: 设计不一致修复** | P0 13h + P1 2h | 详情见 `DESIGN_INCONSISTENCY_FIX_PLAN.md`

### 核心目标

1. ✅ **确保 80%+ 组件完全兼容** - 自动迁移脚本支持
2. ✅ **解决阻塞性问题 (P0)** - Continuous Learning v2 适配
3. ✅ **优化用户体验** - 提供渐进式迁移方案
4. ✅ **完善文档体系** - 覆盖所有适配场景
5. ✅ **建立测试验证** - 确保迁移质量

### 成功标准

- [ ] 迁移脚本 100% 通过测试
- [ ] 所有 P0 问题完全解决
- [ ] 文档完整且易于理解
- [ ] 至少 10 个用户成功迁移
- [ ] 兼容性矩阵准确率 >95%

---

## 🎯 适配策略

### 策略 1: 渐进式迁移 ⭐ 推荐

**理念**: 让用户可以安全、渐进地迁移到 CodeBuddy

```
阶段 1: 并行使用 (1-2 周)
├── 保留 Claude Code 配置
├── 同时测试 CodeBuddy
└── 验证核心功能

阶段 2: 新项目使用 (2-4 周)
├── 新项目使用 CodeBuddy
├── 现有项目继续用 Claude Code
└── 收集反馈并优化

阶段 3: 完全迁移 (之后)
├── 所有项目迁移到 CodeBuddy
├── 保留 Claude Code 作为备份
└── 删除旧配置
```

### 策略 2: 自动化优先

**理念**: 最大化自动化，减少人工干预

| 任务 | 自动化程度 | 工具 |
|------|-----------|------|
| 组件迁移 | 100% | `migrate-to-codebuddy.js` |
| 路径转换 | 100% | 环境变量替换 |
| 文档生成 | 100% | 自动生成报告 |
| 验证测试 | 80% | 自动化测试 + 人工验证 |

### 策略 3: 向后兼容

**理念**: 确保用户可以回滚到 Claude Code

- 保留 `.claude/` 配置目录
- 备份机制
- 双平台并存支持
- 回滚脚本

---

## 📊 工作分解结构 (WBS)

### Level 1: 主要阶段

```
├── 阶段 1: 基础设施 (P0, 15h)
├── 阶段 2: Continuous Learning v2 (P0:24h, P1:3h, 共27h)
├── 阶段 3: 组件适配优化 (P0:18h, P1:16h, 共34h)
├── 阶段 4: 文档完善 (P1, 12h)
└── 阶段 5: 测试验证 (P0, 8h)
```

**详细说明**:
- **阶段 2**: Observer Agent 8h + Hook 脚本 10h + Python CLI 6h + 配置迁移 3h
- **阶段 3**:
  - P0 (18h): MCP Servers 4h + Windows 兼容 8h + 路径硬编码修复 6h
  - P1 (16h): 其他组件优化 8h + **插件市场发布配置 8h**

---

## 🚀 阶段 1: 基础设施建设 (15h, P0)

### 目标

搭建适配所需的基础工具和框架

### 任务清单

#### 1.1 迁移脚本增强 (8h)

**状态**: ✅ 已完成
**优先级**: 🔴 P0
**负责人**: 已完成

**已实现功能**:
- ✅ 自动创建 `.codebuddy/` 目录结构
- ✅ 迁移 agents, commands, skills, rules
- ✅ 转换 hooks.json 到 settings.json
- ✅ 环境变量替换 (CLAUDE_* → CODEBUDDY_*)
- ✅ Windows 支持 (PowerShell 脚本)
- ✅ 生成迁移报告

**增强需求**:
- [ ] 添加回滚功能
- [ ] 支持增量迁移
- [ ] 添加冲突检测
- [ ] 性能优化 (大文件处理)

#### 1.2 安装脚本优化 (4h)

**状态**: ✅ 已完成
**优先级**: 🟡 P1
**负责人**: 已完成

**已实现功能**:
- ✅ 交互式安装向导
- ✅ 支持项目级/全局级安装
- ✅ 语言选择
- ✅ 自动创建 settings.json

**优化需求**:
- [ ] 添加依赖检查
- [ ] 版本兼容性检测
- [ ] 更详细的错误提示
- [ ] 支持自定义配置

#### 1.3 测试框架搭建 (3h)

**状态**: ⏳ 待开始
**优先级**: 🔴 P0
**负责人**: 待分配

**任务**:
```bash
# 测试目录结构
tests/
├── migration/
│   ├── test-migrate-agents.js
│   ├── test-migrate-commands.js
│   ├── test-migrate-skills.js
│   └── test-migrate-hooks.js
├── validation/
│   ├── test-agent-format.js
│   ├── test-command-format.js
│   └── test-settings-json.js
└── e2e/
    ├── test-full-migration.js
    └── test-rollback.js
```

**验收标准**:
- [ ] 所有迁移测试通过
- [ ] 格式验证测试通过
- [ ] 端到端测试通过
- [ ] 测试覆盖率 >80%

---

## 🔬 阶段 2: Continuous Learning v2 适配 (27h, P0:24h, P1:3h)

### 目标

解决 Continuous Learning v2 系统在 CodeBuddy 中的适配问题

### 问题分析

| 组件 | 状态 | 阻塞原因 |
|------|------|---------|
| observer.md (agent) | ❌ 未迁移 | 后台模式不支持 |
| observe.sh (hook) | ⚠️ 部分迁移 | 路径和环境变量 |
| observe.js (hook) | ✅ 已规划 | 新增 Node.js 版本 |
| instinct-cli.py | ❌ 未适配 | 路径硬编码 |
| config.json | ❌ 未迁移 | 配置格式差异 |
| Commands (4个) | ⚠️ 部分工作 | CLI 依赖 |

### 任务清单

#### 2.1 Observer Agent 重构 (8h)

**状态**: ⏳ 待开始
**优先级**: 🔴 P0
**阻塞**: 无

**核心原则**:
- ⭐ **优先使用 Node.js 脚本**（跨平台兼容）
- 🔧 **目录结构规范化**
- 📁 **`~` 用户目录使用规范**

**CodeBuddy 目录结构规范**:

| 目录类型 | 路径 | 说明 | 示例内容 |
|---------|------|------|---------|
| **插件目录** | `${CODEBUDDY_PLUGIN_ROOT}` | CodeBuddy 安装根目录 | `C:\Users\username\.codebuddy` |
| **插件 Hooks** | `${CODEBUDDY_PLUGIN_ROOT}/hooks` | 全局 Hook 脚本 | `observe.js`, `run-observer.js` |
| **插件工具** | `${CODEBUDDY_PLUGIN_ROOT}/tools` | 工具脚本 | `migrate-homunculus-data.js` |
| **项目目录** | `${CODEBUDDY_PROJECT_DIR}` | 项目根目录 | `D:\projects\myapp` |
| **项目数据** | `${CODEBUDDY_PROJECT_DIR}/.codebuddy` | 项目级配置数据 | `session.json`, `continuous-learning.json` |
| **Homunculus** | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus` | 持续学习数据 | `observations.jsonl`, `instincts/` |
| **用户目录** | `~` 或 `%USERPROFILE%` | 用户主目录 | `C:\Users\username` |

**`~` 用户目录使用规范**:

| 规则 | 说明 | Windows | Linux/Mac |
|------|------|---------|-----------|
| ✅ **推荐方式** | 使用 `~` 快捷方式 | `~/.codebuddy` (PowerShell) | `~/.codebuddy` (Bash) |
| ✅ **环境变量** | 明确使用环境变量 | `%USERPROFILE%` | `$HOME` |
| ❌ **硬编码** | 不要硬编码路径 | `C:\Users\username` | `/home/username` |

**重构内容**:

```markdown
# 移除后台运行模式
- 删除 `run_mode: background`
- 删除定时任务配置
- 删除 PID 管理代码

# 改用 Stop Hook 触发（Node.js）
- 在 Stop Hook 中调用 observer.js
- 或者通过命令手动触发

# 路径规范化
- `~/.claude/homunculus/` → `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus`
- 脚本使用 `~/.codebuddy` 指向用户全局配置
- 项目数据使用 `${CODEBUDDY_PROJECT_DIR}/.codebuddy`
```

**实现方案**:

```bash
# 方案 1: Stop Hook 触发（推荐，Node.js）
.codebuddy/hooks/run-observer.js

# 方案 2: 命令行触发
codebuddy --agent observer --analyze

# 方案 3: 混合模式
# Stop Hook 自动触发（Node.js） + 手动命令支持
```

**目录迁移示例**:

```javascript
// .codebuddy/tools/migrate-homunculus-data.js
const path = require('path');
const fs = require('fs');
const os = require('os');

// 使用路径变量
const projectDir = process.env.CODEBUDDY_PROJECT_DIR;
const pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT;

// 使用用户目录（跨平台）
const userHome = os.homedir();

// 旧路径（Claude Code）
const oldClaudePath = path.join(userHome, '.claude', 'homunculus');

// 新路径（CodeBuddy 项目级）
const newProjectPath = path.join(projectDir, '.codebuddy', 'homunculus');

// 迁移数据
if (fs.existsSync(oldClaudePath)) {
  fs.cpSync(oldClaudePath, newProjectPath, { recursive: true });
  console.log(`数据已迁移: ${oldClaudePath} → ${newProjectPath}`);
}
```

**验收标准**:
- [ ] observer.md 更新完成，移除后台相关代码
- [ ] Node.js run-observer.js 脚本实现
- [ ] 目录结构符合规范
- [ ] `~` 用户目录正确使用
- [ ] Stop Hook 集成测试通过
- [ ] 手动触发功能正常

#### 2.2 Hook 脚本适配 (10h)

**状态**: ⏳ 待开始
**优先级**: 🔴 P0
**阻塞**: 无

**核心原则**:
- ⭐ **优先使用 Node.js 脚本**（跨平台兼容）
- 🔧 **路径变量规范统一**（见下方路径变量规范）

**路径变量规范**:

| 环境变量 | 用途 | 示例路径 | 使用场景 |
|----------|------|---------|---------|
| `CODEBUDDY_PLUGIN_ROOT` | **CodeBuddy 安装根目录** | `C:\Users\username\.codebuddy` | 插件级配置、全局 Hooks、工具脚本 |
| `CODEBUDDY_PROJECT_DIR` | **项目根目录** | `D:\projects\myapp` | 项目级配置、项目数据、相对路径 |

**规则**:
- ✅ **插件路径**: `${CODEBUDDY_PLUGIN_ROOT}/hooks/xxx.js`
- ✅ **项目数据**: `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus`
- ❌ **错误用法**: `${CODEBUDDY_PROJECT_DIR}/.codebuddy/hooks`（应使用 PLUGIN_ROOT）

**任务清单**:

| 脚本 | 类型 | 平台 | 优先级 | 工作量 |
|------|------|------|--------|--------|
| observe.js | **Node.js（新增，优先）** | All | ⭐ P0 | 3h |
| observe.sh | Bash | Linux/Mac | 🟡 降级为备选 | - |
| observe.ps1 | PowerShell | Windows | 🟡 降级为备选 | 1h |
| run-observer.js | **Node.js（新增）** | All | ⭐ P0 | 2h |
| start-observer.sh | Bash | Linux/Mac | ❌ 需移除 | 0.5h |
| start-observer.ps1 | PowerShell | Windows | ❌ 需移除 | 0.5h |
| 环境变量替换 | - | All | ✅ 已完成 | - |
| 路径验证 | - | All | ⏳ 待测试 | 1h |

**Node.js 实现示例**:

```javascript
// .codebuddy/hooks/observe.js
const path = require('path');
const fs = require('fs');

// 正确使用路径变量
const pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT; // 插件根目录
const projectDir = process.env.CODEBUDDY_PROJECT_DIR;  // 项目根目录

// 数据目录使用 PROJECT_DIR（项目数据）
const homunculusDir = path.join(projectDir, '.codebuddy', 'homunculus');

// 工具脚本使用 PLUGIN_ROOT（插件资源）
const observerAgent = path.join(pluginRoot, 'agents', 'observer.md');

// Hook 输入数据处理
const hookInput = JSON.parse(process.stdin.read() || '{}');

// 观察并写入数据
function observe(toolName, toolInput, toolOutput) {
  const observation = {
    timestamp: Date.now(),
    tool: toolName,
    input: toolInput,
    output: toolOutput,
    project_dir: projectDir
  };

  const obsFile = path.join(homunculusDir, 'observations.jsonl');
  fs.appendFileSync(obsFile, JSON.stringify(observation) + '\n');
}

// 执行观察
observe(hookInput.tool_name, hookInput.tool_input, hookInput.tool_output);

console.log(JSON.stringify({ status: 'success' }));
```

**Hooks.json 配置**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/observe.js\"",
            "timeout": 5000,
            "description": "记录工具调用观察数据"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/run-observer.js\"",
            "timeout": 30000,
            "description": "运行观察分析"
          }
        ]
      }
    ]
  }
}
```

**修改内容**:

```bash
# 路径变量标准化

# ❌ 旧错误用法
HOMUNCULUS_DIR="${CODEBUDDY_PROJECT_DIR}/homunculus"
HOMUNCULUS_DIR="${CODEBUDDY_PLUGIN_ROOT}/homunculus"

# ✅ 正确用法
HOMUNCULUS_DIR="${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"
HOOKS_DIR="${CODEBUDDY_PLUGIN_ROOT}/hooks"
TOOLS_DIR="${CODEBUDDY_PLUGIN_ROOT}/tools"
```

**验收标准**:
- [ ] Node.js 脚本优先实现并测试通过
- [ ] Bash/PowerShell 脚本作为备选保留
- [ ] 路径变量规范统一使用
- [ ] 环境变量正确解析
- [ ] 观察数据正确写入
- [ ] 超时处理正常

#### 2.3 Python CLI 重构 (6h)

**状态**: ⏳ 待开始
**优先级**: 🔴 P0
**阻塞**: 无

**重构内容**:

```python
# instinct-cli.py 修改点

1. 路径配置化（遵循路径变量规范）
   OLD: HOMUNCULUS_DIR = Path.home() / ".claude" / "homunculus"
   NEW: HOMUNCULUS_DIR = Path(os.getenv('CODEBUDDY_PROJECT_DIR',
                                       Path.home())) / ".codebuddy" / "homunculus"

2. 用户目录规范化（使用 ~ 快捷方式）
   OLD: CLAUDE_DIR = Path.home() / ".claude"
   NEW: CODEBUDDY_USER_DIR = Path("~/.codebuddy").expanduser()

3. 添加环境变量支持
   - CODEBUDDY_PROJECT_DIR (项目根目录)
   - CODEBUDDY_PLUGIN_ROOT (插件根目录)
   - HOMUNCULUS_DIR (可选覆盖)

4. 路径兼容性
   - 支持从 ~/.claude 迁移
   - 支持从 ~/.codebuddy 读取
   - 支持从 ${CODEBUDDY_PROJECT_DIR}/.codebuddy 读取
```

**Python 路径处理示例**:

```python
import os
from pathlib import Path
from typing import Optional

class CodeBuddyPaths:
    """CodeBuddy 路径管理（遵循目录规范）"""

    def __init__(self):
        # 环境变量
        self.project_dir = Path(os.getenv('CODEBUDDY_PROJECT_DIR', Path.cwd()))
        self.plugin_root = Path(os.getenv('CODEBUDDY_PLUGIN_ROOT', Path.home() / '.codebuddy'))

        # 用户目录（使用 ~ 快捷方式，跨平台）
        self.user_codebuddy = Path("~/.codebuddy").expanduser()
        self.user_claude = Path("~/.claude").expanduser()

        # 项目数据目录
        self.project_codebuddy = self.project_dir / ".codebuddy"
        self.homunculus_dir = self.project_codebuddy / "homunculus"

        # Instincts 目录
        self.personal_instincts = self.homunculus_dir / "instincts" / "personal"
        self.inherited_instincts = self.homunculus_dir / "instincts" / "inherited"
        self.evolved_dir = self.homunculus_dir / "evolved"

        # 观察数据
        self.observations_file = self.homunculus_dir / "observations.jsonl"

    def migrate_from_claude(self) -> Optional[str]:
        """从 Claude Code 迁移数据"""
        if not self.user_claude.exists():
            return None

        old_homunculus = self.user_claude / "homunculus"
        if not old_homunculus.exists():
            return None

        # 迁移到项目级目录
        if not self.homunculus_dir.exists():
            self.homunculus_dir.parent.mkdir(parents=True, exist_ok=True)
            self.homunculus_dir.mkdir()

        # 复制数据
        import shutil
        shutil.copytree(old_homunculus, self.homunculus_dir, dirs_exist_ok=True)

        return str(old_homunculus)

# 使用示例
paths = CodeBuddyPaths()

# ✅ 正确：使用路径变量
print(f"项目目录: {paths.project_dir}")
print(f"插件目录: {paths.plugin_root}")
print(f"数据目录: {paths.homunculus_dir}")

# ✅ 正确：使用 ~ 快捷方式
print(f"用户配置: {paths.user_codebuddy}")

# 迁移数据
old_path = paths.migrate_from_claude()
if old_path:
    print(f"已迁移: {old_path} → {paths.homunculus_dir}")
```

**Commands 适配**:

**Commands 适配**:

| Command | 状态 | 需要修改 |
|---------|------|---------|
| /instinct-status | ⏳ 待测试 | 路径验证 |
| /instinct-import | ⏳ 待测试 | 路径验证 |
| /instinct-export | ⏳ 待测试 | 路径验证 |
| /evolve | ⏳ 待测试 | 路径验证 |

**验收标准**:
- [ ] Python CLI 所有命令测试通过
- [ ] 环境变量正确读取
- [ ] 从旧路径迁移数据功能正常
- [ ] 4 个 Commands 工作正常

#### 2.4 配置文件整合 (3h)

**状态**: ⏳ 待开始
**优先级**: 🟡 P1
**阻塞**: 无

**配置文件位置规范**:

| 配置文件 | 位置 | 类型 | 说明 |
|---------|------|------|------|
| `continuous-learning.json` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/` | 项目级 | 持续学习配置 |
| `settings.json` | `${CODEBUDDY_PLUGIN_ROOT}/` | 插件级 | CodeBuddy 主配置 |
| `config.json` | `~/.codebuddy/` | 用户级 | 用户全局配置 |

**任务**:

```json
// 新建 ${CODEBUDDY_PROJECT_DIR}/.codebuddy/continuous-learning.json
{
  "observer": {
    "enabled": false,
    "model": "sonnet-mini",
    "trigger": "stop",
    "min_observations": 20,
    "data_dir": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"
  },
  "instincts": {
    "personal_dir": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/instincts/personal",
    "inherited_dir": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/instincts/inherited",
    "evolved_dir": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/evolved"
  },
  "observations": {
    "file": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/observations.jsonl",
    "max_size_mb": 10,
    "archive_dir": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/observations.archive"
  }
}
```

**迁移逻辑（Node.js）**:

```javascript
// .codebuddy/tools/migrate-cl-config.js
const path = require('path');
const fs = require('fs');
const os = require('os');

class ConfigMigrator {
  constructor() {
    this.projectDir = process.env.CODEBUDDY_PROJECT_DIR || process.cwd();
    this.pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT || path.join(os.homedir(), '.codebuddy');
    this.userHome = os.homedir();

    // 旧配置路径
    this.oldClaudeConfig = path.join(this.userHome, '.claude', 'config.json');

    // 新配置路径
    this.newConfigDir = path.join(this.projectDir, '.codebuddy');
    this.newConfigFile = path.join(this.newConfigDir, 'continuous-learning.json');
  }

  migrate() {
    if (!fs.existsSync(this.oldClaudeConfig)) {
      console.log('未找到旧配置文件，无需迁移');
      return null;
    }

    // 读取旧配置
    const oldConfig = JSON.parse(fs.readFileSync(this.oldClaudeConfig, 'utf8'));

    // 创建新配置目录
    fs.mkdirSync(this.newConfigDir, { recursive: true });

    // 生成新配置（遵循目录规范）
    const newConfig = {
      observer: {
        enabled: oldConfig.observer?.enabled || false,
        model: oldConfig.observer?.model || 'sonnet-mini',
        trigger: 'stop',
        min_observations: oldConfig.observer?.min_observations || 20,
        data_dir: `${this.projectDir}/.codebuddy/homunculus`
      },
      instincts: {
        personal_dir: `${this.projectDir}/.codebuddy/homunculus/instincts/personal`,
        inherited_dir: `${this.projectDir}/.codebuddy/homunculus/instincts/inherited`,
        evolved_dir: `${this.projectDir}/.codebuddy/homunculus/evolved`
      },
      observations: {
        file: `${this.projectDir}/.codebuddy/homunculus/observations.jsonl`,
        max_size_mb: oldConfig.observations?.max_size_mb || 10,
        archive_dir: `${this.projectDir}/.codebuddy/homunculus/observations.archive`
      }
    };

    // 写入新配置
    fs.writeFileSync(this.newConfigFile, JSON.stringify(newConfig, null, 2));

    console.log(`配置已迁移: ${this.oldClaudeConfig} → ${this.newConfigFile}`);
    return { old: this.oldClaudeConfig, new: this.newConfigFile };
  }
}

// 执行迁移
const migrator = new ConfigMigrator();
migrator.migrate();
```

**验收标准**:
- [ ] 配置文件格式正确
- [ ] 环境变量支持
- [ ] 目录结构符合规范
- [ ] `~` 用户目录正确使用
- [ ] 迁移脚本自动转换
- [ ] 文档更新完成

#### 2.5 数据迁移工具 (2h)

**状态**: ⏳ 待开始
**优先级**: 🟢 P2
**阻塞**: 无

**任务**:

```bash
# tools/migrate-homunculus-data.js
# 将 .claude/homunculus 数据迁移到 .codebuddy/homunculus

功能:
- 迁移 observations.jsonl
- 迁移 instincts/personal/*.yaml
- 迁移 instincts/inherited/*.yaml
- 迁移 evolved/ 目录
- 保留原始文件 (备份)
```

**验收标准**:
- [ ] 数据完整迁移
- [ ] 原始文件保留
- [ ] 支持重新运行
- [ ] 错误处理完善

---

## 🔧 阶段 3: 组件适配优化 (20h, P0:12h, P1:8h)

### 目标

优化需要调整的组件，提升用户体验

### 任务清单

#### 3.1 MCP Servers 适配 (4h)

**状态**: ⏳ 待开始
**优先级**: 🔴 P0
**阻塞**: 无

**背景**:
Claude Code 的 MCP 配置格式与 CodeBuddy 完全相同，但配置位置不同。

**适配方案**:

```bash
# 配置位置对比
Claude Code: ~/.claude.json → mcpServers
CodeBuddy: ~/.codebuddy/settings.json → mcpServers

# 迁移 MCP 配置
cat ~/.claude.json | jq '.mcpServers' > ~/.codebuddy/mcp-backup.json
cat ~/.codebuddy/settings.json | jq '.mcpServers = $(cat ~/.claude.json | jq '.mcpServers')' > ~/.codebuddy/settings.tmp.json
mv ~/.codebuddy/settings.tmp.json ~/.codebuddy/settings.json
```

**支持的 MCP 服务器**:
- ✅ @modelcontextprotocol/server-github - GitHub 集成
- ✅ @modelcontextprotocol/server-filesystem - 文件系统访问
- ✅ @modelcontextprotocol/server-postgres - PostgreSQL
- ✅ @modelcontextprotocol/server-brave-search - Brave 搜索
- ✅ @modelcontextprotocol/server-puppeteer - Puppeteer
- ✅ @modelcontextprotocol/server-slack - Slack 集成
- ✅ @modelcontextprotocol/server-fetch - HTTP 请求
- ⚠️ Tencent CloudBase - 需适配
- ⚠️ Tencent Cloud Storage - 需适配

**验收标准**:
- [ ] MCP 配置完整迁移
- [ ] 所有 MCP 服务器连接正常
- [ ] 腾讯云 MCP 适配完成
- [ ] 测试脚本覆盖常用场景

---

#### 3.2 Multi-Agent 命令适配 (4h)

**状态**: ⏳ 待开始
**优先级**: 🟡 P1
**阻塞**: 需要确认 CodeBuddy 语法

**影响 Commands**:
- /multi-plan
- /multi-execute
- /multi-backend
- /multi-frontend
- /multi-workflow
- /orchestrate

**适配方案**:

```markdown
# 调查 CodeBuddy 多模型支持
1. 查看 CodeBuddy 文档中关于多模型的说明
2. 确认语法: @model 前缀或其他方式
3. 测试基本的多模型调用
4. 设计适配方案

# 可能的适配方式
# 方式 1: 直接映射
@claude-opus 生成架构设计
@gemini-flash 编写代码

# 方式 2: 模型切换命令
/model claude-opus
[model切换后执行任务]

# 方式 3: 保持原语法 (如果兼容)
```

**验收标准**:
- [ ] CodeBuddy 多模型语法确认
- [ ] 所有 Multi-Agent 命令测试通过
- [ ] 替代方案文档完善
- [ ] 示例代码更新

#### 3.2 Windows 兼容模式适配 (8h)

**状态**: ⏳ 待开始
**优先级**: 🔴 P0
**阻塞**: 无

**背景**:
CodeBuddy 运行在 Windows 环境，需要确保所有 hooks 脚本都能在 Windows 上正常运行。现有的 Bash 脚本需要迁移到 Node.js。

**适配方案**:

1. **创建跨平台工具库** (2h)

```bash
# 创建工具函数目录
mkdir -p .codebuddy/hooks/utils

# 创建核心工具模块
# - platform.js: 平台检测、环境变量、路径处理
# - exec.js: 跨平台命令执行
# - validator.js: 通用验证逻辑
```

2. **迁移现有 Hooks** (3h)

| Hook 脚本 | 当前状态 | 迁移目标 |
|----------|---------|---------|
| `pre-tool-use.sh` | Bash | `pre-tool-use.js` |
| `post-tool-use.sh` | Bash | `post-tool-use.js` |
| `session-start.sh` | Bash | `session-start.js` |
| `session-end.sh` | Bash | `session-end.js` |
| 其他 `.sh` 脚本 | Bash | Node.js 等价实现 |

3. **更新 hooks.json 配置** (1h)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/pre-tool-use.js\"",
            "description": "Validate Bash commands"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/format-code.js\"",
            "description": "Auto-format code"
          }
        ]
      }
    ]
  }
}
```

4. **编写测试用例** (2h)

```javascript
// tests/hooks/windows-compatibility.test.js
async function testHook(hookPath, testData) {
  // 测试 hook 在 Windows 上的执行
  // 验证输出格式
  // 检查错误处理
}
```

**验收标准**:
- [ ] 所有 Bash 脚本迁移到 Node.js
- [ ] 工具函数库完整
- [ ] Windows 环境测试通过
- [ ] 向后兼容（保留内联 `node -e` 脚本）
- [ ] 文档完整（CODEBUDDY_WINDOWS_COMPATIBILITY.md）

---

#### 3.3 路径硬编码扫描与修正 (6h)

**状态**: ⏳ 待开始
**优先级**: 🔴 P0
**阻塞**: 无

**背景**:
扫描所有 agents, commands, skills, rules 文件，找出 Claude Code 路径硬编码情况（`.claude`, `~/.claude`, `/claude` 等），并统一替换为 CodeBuddy 路径规范。

**扫描范围**:
```bash
# 已扫描的文件范围
agents/ (0 files with .claude)
commands/ (18 files with .claude)
skills/ (15 files with .claude)
rules/ (8 files with .claude)

# 总计：41 个文件需要检查
```

**路径映射规则**:

| Claude Code 路径 | CodeBuddy 路径 | 说明 |
|-----------------|----------------|------|
| `~/.claude/` | `~/.codebuddy/` | 用户级配置目录 |
| `~/.claude/homunculus/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` | 项目级持续学习数据 |
| `~/.claude/skills/` | `${CODEBUDDY_PLUGIN_ROOT}/skills/` | 插件级技能目录 |
| `~/.claude/agents/` | `${CODEBUDDY_PLUGIN_ROOT}/agents/` | 插件级代理目录 |
| `~/.claude/rules/` | `${CODEBUDDY_PLUGIN_ROOT}/rules/` | 插件级规则目录 |
| `~/.claude/settings.json` | `~/.codebuddy/settings.json` | 用户级配置 |
| `~/.claude.json` | `~/.codebuddy/settings.json` | 用户级配置（旧格式） |
| `.claude/` (项目级) | `.codebuddy/` (项目级) | 项目配置目录 |
| `.claude/checkpoints.log` | `.codebuddy/checkpoints.log` | 检查点日志 |
| `.claude/evals/` | `.codebuddy/evals/` | 评估定义 |

**关键发现**:

| 组件类型 | 发现问题数量 | 主要问题 |
|---------|------------|---------|
| **Commands** | 18 | 路径硬编码（checkpoint, eval, evolve, instinct-*, multi-* 等） |
| **Skills** | 15 | 路径硬编码（continuous-learning-v2, strategic-compact, configure-ecc 等） |
| **Rules** | 8 | 配置文件路径引用 |
| **Agents** | 0 | 无路径硬编码 |

**详细修复计划**:

**Commands 修复 (18 files, 3h)**:

```bash
# 优先级 1: Continuous Learning 相关命令
# 这些命令依赖 Python CLI，需要优先修复
- /instinct-status (→ 使用环境变量)
- /instinct-import (→ 使用环境变量)
- /instinct-export (→ 使用环境变量)
- /evolve (→ 使用环境变量)

# 优先级 2: 项目级数据命令
- /checkpoint (→ .claude/ → .codebuddy/)
- /eval (→ .claude/evals/ → .codebuddy/evals/)
- /sessions (→ 检查路径引用)

# 优先级 3: Multi-Agent 命令
- /multi-execute (→ ~/.claude/bin/ → ${CODEBUDDY_PLUGIN_ROOT}/bin/)
- /multi-frontend (→ ~/.claude/.ccg/ → ${CODEBUDDY_PLUGIN_ROOT}/.ccg/)
- /multi-backend (→ ~/.claude/.ccg/ → ${CODEBUDDY_PLUGIN_ROOT}/.ccg/)
- /multi-plan (→ 检查路径引用)
- /multi-workflow (→ 检查路径引用)
```

**Skills 修复 (15 files, 2h)**:

```bash
# 优先级 1: Continuous Learning v2
- skills/continuous-learning-v2/config.json (→ 所有路径使用环境变量)
- skills/continuous-learning-v2/SKILL.md (→ 路径说明更新)
- skills/continuous-learning-v2/agents/observer.md (→ 路径更新)
- skills/continuous-learning-v2/scripts/instinct-cli.py (→ Python 代码路径处理)
- skills/continuous-learning-v2/hooks/observe.sh (→ 路径变量替换)

# 优先级 2: Strategic Compact
- skills/strategic-compact/SKILL.md (→ 配置路径更新)
- skills/strategic-compact/suggest-compact.sh (→ 路径变量替换)

# 优先级 3: 其他 Skills
- skills/configure-ecc/SKILL.md (→ 文档中的路径示例)
- skills/eval-harness/SKILL.md (→ .claude/evals/ → .codebuddy/evals/)
- skills/security-scan/SKILL.md (→ 文档说明更新)
```

**Rules 修复 (8 files, 1h)**:

```bash
# 配置文件路径引用更新
- rules/typescript/hooks.md (~/.claude/settings.json → ~/.codebuddy/settings.json)
- rules/golang/hooks.md (~/.claude/settings.json → ~/.codebuddy/settings.json)
- rules/python/hooks.md (~/.claude/settings.json → ~/.codebuddy/settings.json)
- rules/common/hooks.md (~/.claude.json → ~/.codebuddy/settings.json)
- rules/common/performance.md (~/.claude/settings.json → ~/.codebuddy/settings.json)
- rules/common/git-workflow.md (~/.claude/settings.json → ~/.codebuddy/settings.json)
- rules/common/agents.md (~/.claude/agents/ → ${CODEBUDDY_PLUGIN_ROOT}/agents/)
- rules/README.md (安装说明路径更新)
```

**自动化修复脚本**:

```javascript
// scripts/fix-claude-paths.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 路径映射规则
const pathMappings = [
  { from: '~/.claude/', to: '~/.codebuddy/', context: 'user-config' },
  { from: '~/.claude/homunculus/', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/', context: 'project-data' },
  { from: '~/.claude/skills/', to: '${CODEBUDDY_PLUGIN_ROOT}/skills/', context: 'plugin-resource' },
  { from: '~/.claude/agents/', to: '${CODEBUDDY_PLUGIN_ROOT}/agents/', context: 'plugin-resource' },
  { from: '~/.claude/rules/', to: '${CODEBUDDY_PLUGIN_ROOT}/rules/', context: 'plugin-resource' },
  { from: '.claude/', to: '.codebuddy/', context: 'project-config' },
  { from: '~/.claude/settings.json', to: '~/.codebuddy/settings.json', context: 'user-config' },
  { from: '~/.claude.json', to: '~/.codebuddy/settings.json', context: 'user-config' },
];

function fixPathsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  // 应用路径映射
  for (const mapping of pathMappings) {
    const regex = new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, mapping.to);
  }

  // 如果有变化，写入文件
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  return false;
}

// 扫描并修复
const patterns = [
  'commands/**/*.md',
  'skills/**/*.md',
  'skills/**/*.sh',
  'skills/**/*.py',
  'skills/**/*.json',
  'rules/**/*.md'
];

let fixedCount = 0;
patterns.forEach(pattern => {
  const files = glob.sync(pattern);
  files.forEach(file => {
    if (fixPathsInFile(file)) fixedCount++;
  });
});

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);
```

**手动修复清单**:

以下情况需要手动审查和修复：

1. **Python 脚本中的路径** (instinct-cli.py)
   ```python
   # 需要使用 Path.expanduser() 和环境变量
   HOMUNCULUS_DIR = Path(os.getenv('CODEBUDDY_PROJECT_DIR', Path.cwd())) / ".codebuddy" / "homunculus"
   ```

2. **Bash 脚本中的路径** (observe.sh, start-observer.sh)
   ```bash
   # 需要使用环境变量
   HOMUNCULUS_DIR="${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"
   ```

3. **文档中的示例代码** (各 MD 文件)
   ```markdown
   # 需要更新示例中的路径
   python3 ~/.claude/skills/... → python3 ${CODEBUDDY_PLUGIN_ROOT}/skills/...
   ```

4. **Config.json 中的路径** (continuous-learning-v2/config.json)
   ```json
   {
     "observation": {
       "store_path": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/observations.jsonl"
     },
     "instincts": {
       "personal_path": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/instincts/personal/",
       "inherited_path": "${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/instincts/inherited/"
     }
   }
   ```

**验收标准**:
- [ ] 扫描完成所有 41 个文件
- [ ] 自动修复脚本编写完成
- [ ] 手动修复清单执行完成
- [ ] 所有 `.claude` 路径替换为 CodeBuddy 路径
- [ ] Python/Bash 脚本使用环境变量
- [ ] 配置文件使用正确的路径变量
- [ ] 文档中的示例代码已更新
- [ ] 验证脚本检查无残留路径硬编码

**验证脚本**:

```bash
#!/bin/bash
# verify-no-claude-paths.sh
echo "🔍 Scanning for Claude Code path references..."

# 排除已知的 CodeBuddy 路径
exclusions=".codebuddy|CODEBUDDY_|@codebuddy"

# 搜索残留的 .claude 路径
grep -rn "\.claude/" commands/ skills/ rules/ agents/ \
  | grep -v "$exclusions" \
  | grep -v "Binary file" \
  > path-scan-report.txt

# 统计结果
if [ -s path-scan-report.txt ]; then
  echo "❌ Found $(wc -l < path-scan-report.txt) Claude path references!"
  cat path-scan-report.txt
  exit 1
else
  echo "✅ No Claude path references found!"
  exit 0
fi
```

---

#### 3.4 Multi-Agent 命令适配 (4h)

**状态**: ⏳ 待开始
**优先级**: 🟢 P2
**阻塞**: 无

**任务**:

```bash
# 验证 PM2 命令兼容性
codebuddy "使用 PM2 启动 app 服务"

# 测试场景
- PM2 进程管理
- 配置文件生成
- 日志查看
- 重启/停止
```

**验收标准**:
- [ ] PM2 命令验证完成
- [ ] 文档更新 (支持/不支持)
- [ ] 替代方案提供

#### 3.4 Hooks 优化 (3h)

**状态**: ⏳ 待开始
**优先级**: 🟡 P1
**阻塞**: 无

**需要优化的 Hooks**:

| Hook | 问题 | 解决方案 |
|------|------|---------|
| tmux 相关 | CodeBuddy 无 tmux 集成 | 移除或标记为可选 |
| session-start.js | 事件名称可能不同 | 验证并适配 |
| session-end.js | 事件名称可能不同 | 验证并适配 |
| 超时限制 | 默认 30s 可能不够 | 配置到 settings.json |

**优化内容**:

```json
// .codebuddy/settings.json
{
  "hooks": {
    "timeout": 60  // 增加超时时间
  }
}
```

**验收标准**:
- [ ] 所有 Hooks 测试通过
- [ ] 超时配置正确
- [ ] 不兼容 Hooks 标记清楚

#### 3.4 环境变量统一 (4h)

**状态**: ⏳ 待开始
**优先级**: 🟡 P1
**阻塞**: 无

**任务**:

```bash
# 创建环境变量映射表
CLAUDE_PLUGIN_ROOT → CODEBUDDY_PLUGIN_ROOT
CLAUDE_PROJECT_ROOT → CODEBUDDY_PROJECT_DIR
CLAUDE_AUTOCOMPACT_PCT_OVERRIDE → CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE
CLAUDE_PACKAGE_MANAGER → CODEBUDDY_PACKAGE_MANAGER
CLAUDE_* → CODEBUDDY_* (通用映射)

# 更新所有引用
- agents/*.md
- commands/*.md
- hooks/*.sh
- scripts/*.js
```

**验收标准**:
- [ ] 所有环境变量替换完成
- [ ] 映射文档清晰
- [ ] 测试通过

---

#### 3.5 插件市场发布配置 (8h, P1)

**状态**: ⏳ 待开始
**优先级**: 🟡 P1
**阻塞**: 无

**背景**:
适配完成后的插件需要发布到 CodeBuddy 插件市场，需要完善插件配置文件、元数据、截图、文档等市场发布所需的材料。

**发布要求清单**:

**1. 插件配置文件完善 (2h)**

```json
{
  "name": "ecc-universal",
  "version": "2.0.0",
  "displayName": "Everything Claude Code for CodeBuddy",
  "description": "Complete collection of battle-tested CodeBuddy configs - 118+ agents, skills, hooks, and rules evolved from Claude Code. Supports TDD, code review, security scanning, multi-model workflows, and continuous learning.",
  "author": {
    "name": "Affaan Mustafa",
    "email": "affaan@example.com",
    "url": "https://x.com/affaanmustafa"
  },
  "homepage": "https://github.com/affaan-m/everything-claude-code",
  "repository": {
    "type": "git",
    "url": "https://github.com/affaan-m/everything-claude-code.git"
  },
  "license": "MIT",
  "codebuddy": {
    "minVersion": "2.50.0",
    "maxVersion": "3.0.0"
  },
  "keywords": [
    "codebuddy",
    "agents",
    "skills",
    "hooks",
    "rules",
    "commands",
    "tdd",
    "code-review",
    "security",
    "workflow",
    "automation",
    "best-practices",
    "continuous-learning",
    "multi-model",
    "tencent-cloud",
    "mcp",
    "claude-code-migration"
  ],
  "category": "development-tools",
  "tags": [
    "development",
    "productivity",
    "ai-assistant",
    "code-quality",
    "testing",
    "documentation"
  ],
  "icon": "assets/icon.png",
  "banner": "assets/banner.png",
  "screenshots": [
    {
      "url": "assets/screenshots/agents.png",
      "caption": "14+ 专业 Agents 覆盖各种开发场景"
    },
    {
      "url": "assets/screenshots/commands.png",
      "caption": "31+ Commands 快速执行常见任务"
    },
    {
      "url": "assets/screenshots/skills.png",
      "caption": "37+ Skills 灵活扩展能力"
    },
    {
      "url": "assets/screenshots/continuous-learning.png",
      "caption": "Continuous Learning v2 智能学习系统"
    },
    {
      "url": "assets/screenshots/multi-model.png",
      "caption": "多模型协同工作流"
    }
  ],
  "features": [
    {
      "title": "118+ 组件库",
      "description": "包含 14+ Agents, 31+ Commands, 37+ Skills, 8+ Rules, Hooks 等完整组件"
    },
    {
      "title": "Continuous Learning v2",
      "description": "智能观察、学习、演化系统，持续优化开发模式"
    },
    {
      "title": "多模型工作流",
      "description": "支持 Gemini、Claude、Codex 等多模型协同"
    },
    {
      "title": "跨平台兼容",
      "description": "完整支持 Windows、Linux、macOS"
    },
    {
      "title": "开箱即用",
      "description": "一行命令安装，零配置启动"
    }
  ],
  "compatibility": {
    "platforms": ["windows", "linux", "macos"],
    "languages": ["javascript", "typescript", "python", "go", "java", "csharp", "rust"],
    "engines": {
      "node": ">=18.0.0",
      "npm": ">=8.0.0"
    }
  },
  "changelog": {
    "2.0.0": "🎉 CodeBuddy 适配完成 - 全面迁移到 CodeBuddy 平台",
    "1.4.1": "Bug fixes and performance improvements"
  }
}
```

**2. README.md 更新 (1h)**

```markdown
# Everything Claude Code for CodeBuddy

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![CodeBuddy](https://img.shields.io/badge/CodeBuddy-2.50%2B-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Downloads](https://img.shields.io/badge/downloads-1K%2B-brightgreen.svg)

**118+ Battle-Tested Components for Professional Development**

[安装](#-安装) • [功能](#-功能) • [文档](#-文档) • [贡献](#-贡献)

</div>

---

## 🚀 快速开始

### 安装

```bash
# 通过 CodeBuddy 插件市场安装（推荐）
codebuddy plugin install ecc-universal

# 或通过 npm 安装
npm install -g ecc-universal
```

### 一行命令启动

```bash
# TypeScript 项目
ecc-install typescript

# Python 项目
ecc-install python

# Go 项目
ecc-install go

# Java 项目
ecc-install java
```

---

## ✨ 核心功能

### 🤖 14+ 专业 Agents

| Agent | 用途 | 适用场景 |
|-------|------|---------|
| planner | 功能规划 | 需求分析、架构设计 |
| architect | 系统架构 | 模块设计、技术选型 |
| code-reviewer | 代码审查 | 代码质量、最佳实践 |
| security-reviewer | 安全审查 | 安全漏洞、敏感数据 |
| tdd-guide | TDD 指导 | 测试驱动开发 |
| e2e-runner | E2E 测试 | 端到端测试 |
| ... | 更多 | [查看完整列表](docs/AGENTS.md) |

### ⚡ 31+ 快捷 Commands

```bash
/tdd         # 测试驱动开发工作流
/plan        # 功能规划
/code-review # 代码审查
/build-fix   # 修复构建错误
/refactor    # 代码重构
/learn       # 提取代码模式
/checkpoint  # 保存检查点
/eval        # 评估功能
...          # 31+ 更多命令
```

### 🎯 37+ 灵活 Skills

- 🧠 continuous-learning-v2: 智能学习系统
- 🔒 security-scan: 安全扫描
- 📊 eval-harness: 测试评估
- 🔄 strategic-compact: 策略压缩
- ... 更多 [Skills 文档](skills/)

### 🎓 8+ 专业 Rules

- TypeScript 最佳实践
- Python 代码规范
- Go 语言规则
- 通用编码规范
- ... 更多 [Rules 文档](rules/)

---

## 🔥 热门功能

### Continuous Learning v2

智能观察、学习、演化系统：
- 🔍 自动观察工具调用模式
- 🧠 提取并学习编程模式
- 📈 聚类演化高阶技能
- 🚀 持续优化开发效率

### Multi-Agent 工作流

多模型协同：
- Gemini: 架构设计、前端规划
- Claude: 代码实现、逻辑推理
- Codex: 代码生成、补全
- [Multi-Agent 指南](docs/MULTI_AGENT_GUIDE.md)

### MCP Servers 集成

开箱即用的 MCP 服务器：
- GitHub 集成
- 文件系统访问
- PostgreSQL 支持
- [MCP 配置](mcp-configs/)

---

## 📦 完整组件列表

| 类型 | 数量 | 兼容性 |
|------|------|--------|
| Agents | 14 | ✅ 100% |
| Commands | 31 | ✅ 100% |
| Skills | 37 | ✅ 100% |
| Rules | 8+ | ✅ 100% |
| Hooks | 20+ | ✅ 95% |
| MCP Servers | 10+ | ✅ 100% |

---

## 🛠️ 技术栈

- **CodeBuddy**: 2.50+
- **Node.js**: >=18.0.0
- **平台**: Windows, Linux, macOS
- **语言**: TypeScript, Python, Go, Java, C#, Rust

---

## 📚 文档

- [完整文档](https://github.com/affaan-m/everything-claude-code)
- [适配计划](docs/FULL_ADAPTATION_PLAN.md)
- [兼容性矩阵](docs/CODEBUDDY_COMPATIBILITY_MATRIX.md)
- [Windows 兼容](docs/CODEBUDDY_WINDOWS_COMPATIBILITY.md)
- [路径规范](docs/PATH_HARDCODE_SCAN_REPORT.md)

---

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🙏 致谢

- 基于 [Claude Code](https://claude.ai/code) 组件演化
- 腾讯云 CodeBuddy 平台支持
- 社区贡献者

---

<div align="center">

Made with ❤️ by [Affaan Mustafa](https://x.com/affaanmustafa)

[⭐ Star](https://github.com/affaan-m/everything-claude-code) • [🐛 Issues](https://github.com/affaan-m/everything-claude-code/issues) • [📖 Docs](https://github.com/affaan-m/everything-claude-code)

</div>
```

**3. 市场素材准备 (2h)**

| 素材类型 | 规格 | 说明 | 文件位置 |
|---------|------|------|---------|
| **插件图标** | 128x128px, PNG | 插件市场展示图标 | `assets/icon.png` |
| **横幅图** | 1280x640px, PNG | 插件详情页横幅 | `assets/banner.png` |
| **截图 1** | 1280x720px, PNG | Agents 展示 | `assets/screenshots/agents.png` |
| **截图 2** | 1280x720px, PNG | Commands 展示 | `assets/screenshots/commands.png` |
| **截图 3** | 1280x720px, PNG | Skills 展示 | `assets/screenshots/skills.png` |
| **截图 4** | 1280x720px, PNG | Continuous Learning | `assets/screenshots/continuous-learning.png` |
| **截图 5** | 1280x720px, PNG | Multi-Model | `assets/screenshots/multi-model.png` |
| **预览视频** | 1080p, MP4, 30-60s | 功能演示视频 | `assets/demo-video.mp4` |

**设计规范**:
- 使用 CodeBuddy 品牌色
- 保持简洁清晰的设计风格
- 突出核心功能点
- 添加水印和版本信息

**4. 市场文档编写 (2h)**

**简短描述** (150 字符):
```
118+ battle-tested components for CodeBuddy: agents, skills, hooks, rules. TDD, code review, security, continuous learning.
```

**详细描述** (500 字符):
```
Everything Claude Code for CodeBuddy provides 118+ production-ready components evolved from 10+ months of intensive use. Includes 14+ specialized agents, 31+ quick commands, 37+ flexible skills, 8+ coding rules, hooks, and MCP server configs. Supports TDD workflows, automated code review, security scanning, continuous learning v2, multi-model orchestration, and cross-platform development (Windows/Linux/macOS). One-command install, zero configuration required.
```

**使用指南**:
```markdown
# 快速开始

1. 安装插件
2. 选择项目类型
3. 开始使用

# 常见问题

Q: 如何使用 Agents?
A: 使用 "使用 [agent-name] [任务]" 命令

Q: Continuous Learning 如何工作?
A: 自动观察、学习、演化模式

Q: 支持哪些平台?
A: Windows, Linux, macOS 完全支持
```

**5. 版本发布检查清单 (1h)**

```markdown
# 发布前检查清单

## 配置文件
- [ ] `.codebuddy-plugin/plugin.json` 版本号更新 (2.0.0)
- [ ] `.codebuddy-plugin/marketplace.json` 创建并配置
- [ ] `package.json` 版本号同步
- [ ] CodeBuddy 最低版本号确认 (2.50+)
- [ ] 关键词和标签完善
- [ ] 作者信息和链接正确

## 文档
- [ ] README.md 更新
- [ ] CHANGELOG.md 完整更新
- [ ] 安装说明清晰
- [ ] 快速开始示例完整
- [ ] 常见问题文档

## 素材
- [ ] 插件图标 (128x128px)
- [ ] 横幅图 (1280x640px)
- [ ] 截图 (至少 3 张)
- [ ] 预览视频 (可选)

## 测试
- [ ] 所有功能测试通过
- [ ] 跨平台测试 (Windows, Linux, macOS)
- [ ] 安装/卸载测试
- [ ] 版本兼容性测试

## 代码质量
- [ ] ESLint 检查通过
- [ ] Markdown Lint 检查通过
- [ ] 无 deprecated API 使用
- [ ] 所有 console.log 清理

## 安全
- [ ] 敏感信息检查
- [ ] 依赖包安全扫描
- [ ] 许可证合规检查
```

**6. 发布脚本编写 (1h)**

```bash
#!/bin/bash
# scripts/publish-to-market.sh

set -e

echo "🚀 Preparing to publish to CodeBuddy Market..."

# 1. 检查版本号
VERSION=$(node -p "require('./package.json').version")
echo "📦 Version: $VERSION"

# 2. 运行测试
echo "🧪 Running tests..."
npm test

# 3. 生成文档
echo "📚 Generating documentation..."
npm run docs:generate

# 4. 构建插件包
echo "📦 Building plugin package..."
npm run build:plugin

# 5. 验证插件配置
echo "✅ Validating plugin configuration..."
node scripts/validate-plugin.js

# 6. 创建发布标签
echo "🏷️  Creating release tag..."
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"

# 7. 发布到市场
echo "📤 Publishing to CodeBuddy Market..."
codebuddy plugin publish --token $CODEBUDDY_TOKEN

echo "✅ Successfully published to CodeBuddy Market!"
echo "🔗 View at: https://market.codebuddy.com/plugins/ecc-universal"
```

**验收标准**:
- [ ] plugin.json 配置完整且符合市场规范
- [ ] README.md 美观且信息完整
- [ ] 市场素材准备齐全（图标、横幅、截图）
- [ ] 发布检查清单全部完成
- [ ] 发布脚本可正常执行
- [ ] 跨平台测试通过
- [ ] 文档齐全（安装、使用、FAQ）

---

## 📚 阶段 4: 文档完善 (12h, P1)

### 目标

创建完整、易用的文档体系

### 任务清单

#### 4.1 迁移指南增强 (3h)

**状态**: ⏳ 待完成
**优先级**: 🔴 P0

**需要补充的内容**:

```markdown
# CODEBUDDY_MIGRATION_GUIDE.md 增强章节

## Continuous Learning v2 适配 (新增)
- Observer Agent 适配方法
- Hook 脚本配置
- Python CLI 使用
- 数据迁移步骤

## Multi-Agent 命令 (新增)
- 多模型调用语法
- 命令列表和说明
- 示例代码

## 故障排除 (增强)
- Continuous Learning 问题
- Hook 触发失败
- 环境变量问题
- 路径问题
```

#### 4.2 快速开始优化 (2h)

**状态**: ⏳ 待完成
**优先级**: 🟡 P1

**优化内容**:

```markdown
# CODEBUDDY_QUICKSTART.md 优化

## 5 分钟快速迁移
1. 运行迁移脚本
2. 测试核心功能
3. 验证配置

## 常见问题 FAQ
- Q: Observer Agent 如何使用?
- A: ...

- Q: 多模型怎么调用?
- A: ...
```

#### 4.3 兼容性矩阵更新 (2h)

**状态**: ✅ 已完成
**优先级**: 🟡 P1

**已完成**:
- ✅ 完整的组件兼容性列表
- ✅ 详细的调整说明
- ✅ 参考文档链接

**需补充**:
- [ ] Continuous Learning v2 专项章节
- [ ] 验证状态标记

#### 4.4 API 参考文档 (2h)

**状态**: ⏳ 待创建
**优先级**: 🟢 P2

**创建内容**:

```markdown
# docs/CODEBUDDY_API_REFERENCE.md

## Agent API
- 调用方式
- 参数说明
- 示例代码

## Command API
- 斜杠命令列表
- 参数格式
- 使用示例

## Skill API
- 技能加载机制
- 自定义技能
- 最佳实践
```

#### 4.5 故障排除指南 (2h)

**状态**: ⏳ 待创建
**优先级**: 🟡 P1

**创建内容**:

```markdown
# docs/CODEBUDDY_TROUBLESHOOTING.md

## 常见错误
### 迁移失败
### Hook 不触发
### Agent 不工作
### Command 执行错误

## 调试技巧
- 启用调试模式
- 查看日志
- 环境检查

## 性能问题
- Token 优化
- 模型选择
- 缓存使用
```

#### 4.6 视频教程 (可选, 1h)

**状态**: ⏳ 待规划
**优先级**: 🟢 P2

**视频内容**:
1. 快速迁移演示
2. Continuous Learning 配置
3. 多模型使用示例

---

## ✅ 阶段 5: 测试验证 (8h, P0)

### 目标

确保所有适配工作质量

### 任务清单

#### 5.1 单元测试 (3h)

**状态**: ⏳ 待编写
**优先级**: 🔴 P0

**测试范围**:

```javascript
// tests/unit/

describe('Migration Script', () => {
  test('migrateAgents() should copy all agents')
  test('migrateCommands() should preserve content')
  test('updateEnvironmentVariables() should replace all refs')
})

describe('CLv2 Migration', () => {
  test('migrateObserverAgent() should remove background mode')
  test('migrateInstinctCLI() should update paths')
  test('migrateConfig() should generate correct JSON')
})
```

#### 5.2 集成测试 (3h)

**状态**: ⏳ 待编写
**优先级**: 🔴 P0

**测试场景**:

```javascript
// tests/integration/

describe('End-to-End Migration', () => {
  test('Full migration should complete without errors')
  test('All components should be valid JSON/Markdown')
  test('settings.json should have correct hooks')
})

describe('CLv2 Integration', () => {
  test('Observer should work via Stop Hook')
  test('instinct-status should display data')
  test('evolve should generate skills')
})
```

#### 5.3 用户验收测试 (2h)

**状态**: ⏳ 待执行
**优先级**: 🔴 P0

**测试场景**:

| 场景 | 步骤 | 预期结果 |
|------|------|---------|
| 新用户首次迁移 | 运行脚本 → 验证结果 | 一次性成功 |
| 现有用户迁移 | 保留旧配置 → 迁移新配置 | 数据完整 |
| Windows 用户 | 运行 PowerShell 脚本 | 正常工作 |
| Mac 用户 | 运行 Shell 脚本 | 正常工作 |
| Linux 用户 | 运行 Shell 脚本 | 正常工作 |

**测试清单**:

- [ ] 5 个新用户测试迁移流程
- [ ] 3 个现有用户测试迁移
- [ ] 跨平台测试 (Windows, Mac, Linux)
- [ ] 反馈收集和整理

#### 5.4 性能测试 (可选, 2h)

**状态**: ⏳ 待规划
**优先级**: 🟢 P2

**测试指标**:

| 指标 | 目标 | 实际 |
|------|------|------|
| 迁移时间 | <2 分钟 | - |
| Hook 响应时间 | <1 秒 | - |
| Agent 调用延迟 | <2 秒 | - |
| 内存占用 | <500MB | - |

---

## 📅 项目时间线

### Gantt 图 (简化版)

```
Week 1 (2/13 - 2/19)
├── 阶段 1: 基础设施 (15h) → ✅
└── 阶段 2.1: Observer Agent (8h) → ✅

Week 2 (2/20 - 2/26)
├── 阶段 2.2: Hook 脚本 (6h) → ✅
├── 阶段 2.3: Python CLI (6h) → ✅
├── 阶段 2.4: 配置整合 (3h) → ✅
└── 阶段 2.5: 数据迁移 (2h) → ✅

Week 3 (2/27 - 3/5)
├── 阶段 3.1: Multi-Agent 命令 (8h) → ✅
├── 阶段 3.2: PM2 验证 (3h) → ✅
├── 阶段 3.3: Hooks 优化 (5h) → ✅
├── 阶段 3.4: 环境变量 (4h) → ✅
└── 阶段 4.1-4.3: 文档 (7h) → ✅

Week 4 (3/6 - 3/12)
├── 阶段 4.4-4.6: 文档 (5h) → ✅
├── 阶段 5.1-5.3: 测试 (8h) → ✅
└── 阶段 5.4: 性能测试 (2h, 可选) → ⏸

Week 5 (3/13 - 3/15)
├── 修复发现的问题
├── 最终验证
└── 发布准备
```

### 里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| **M1: 基础设施完成** | 2026-02-15 | 迁移脚本 v2.0, 测试框架 |
| **M2: CLv2 适配完成** | 2026-02-26 | Observer, Hooks, CLI 全部适配 |
| **M3: 组件适配完成** | 2026-03-05 | 所有组件验证通过 |
| **M4: 文档完成** | 2026-03-08 | 完整文档体系 |
| **M5: 测试通过** | 2026-03-12 | 所有测试通过 |
| **M6: 发布就绪** | 2026-03-15 | v1.0 正式发布 |

---

## 👥 资源分配

### 团队角色

| 角色 | 姓名 | 职责 | 投入时间 |
|------|------|------|---------|
| **项目负责人** | - | 整体协调、决策、文档 | 40h |
| **开发工程师** | - | 代码实现、测试 | 60h |
| **测试工程师** | - | 测试用例、验证 | 20h |
| **文档工程师** | - | 文档编写、维护 | 20h |
| **用户测试者** | 5人 | 用户体验测试 | 10h |

### 技能需求

- **Node.js/JavaScript**: 熟练 (迁移脚本开发)
- **Python**: 熟练 (instinct-cli.py 改造)
- **Shell/PowerShell**: 熟练 (Hook 脚本适配)
- **测试**: 熟练 (测试框架搭建)
- **文档撰写**: 良好 (文档完善)

---

## 🎯 风险管理

### 风险评估

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|---------|
| **CodeBuddy API 变化** | 中 | 高 | 版本锁定、定期检查 |
| **Continuous Learning 复杂度超出预期** | 高 | 高 | 增加时间缓冲、简化功能 |
| **跨平台兼容性问题** | 中 | 中 | 充分测试、虚拟环境 |
| **用户反馈不佳** | 中 | 中 | 提前收集反馈、快速迭代 |
| **文档不完整** | 低 | 中 | 多次审查、用户测试 |

### 应急计划

#### 场景 1: CLv2 适配超时

**触发条件**: 超过预计时间 50%

**应对**:
- 优先实现核心功能 (Observer + Hooks)
- 简化本能系统 (暂时不支持 evolve)
- 分阶段发布

#### 场景 2: 关键 Bug 发现

**触发条件**: P0 级 Bug

**应对**:
- 立即暂停发布
- 集中资源修复
- 延期发布

#### 场景 3: 用户无法迁移

**触发条件**: 3+ 用户反馈迁移失败

**应对**:
- 增强错误提示
- 提供远程协助
- 发布修复补丁

---

## 📈 质量保证

### 质量标准

| 维度 | 标准 |
|------|------|
| **代码覆盖率** | >80% |
| **文档完整性** | 100% |
| **用户成功率** | >95% |
| **Bug 密度** | <1/1000 LOC |
| **性能达标率** | 100% |

### 检查清单

#### 发布前检查

- [ ] 所有 P0 任务完成
- [ ] 所有测试通过
- [ ] 文档完整且准确
- [ ] 用户验收测试通过
- [ ] 性能测试达标
- [ ] 已知问题已记录
- [ ] 回滚计划已准备

#### 每个阶段检查

- [ ] 任务完成度 100%
- [ ] 代码审查通过
- [ ] 测试用例编写完成
- [ ] 文档已更新
- [ ] 风险已识别

---

## 📊 成功指标

### 定量指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| **组件兼容性** | 95% | 兼容性矩阵统计 |
| **迁移成功率** | 95% | 用户反馈统计 |
| **测试覆盖率** | 80% | 自动化测试报告 |
| **文档完整度** | 100% | 文档清单 |
| **用户满意度** | 4.5/5 | 用户评分 |

### 定性指标

- 用户反馈正面
- 社区讨论积极
- 问题报告数量低
- 文档易于理解
- 迁移体验流畅

---

## 🎁 交付物

### 代码交付物

- [ ] `scripts/migrate-to-codebuddy.js` v2.0
- [ ] `scripts/migrate-cl-config.js`
- [ ] `tools/migrate-homunculus-data.js`
- [ ] `.codebuddy/skills/continuous-learning-v2/` 完整适配版本
- [ ] 测试代码 (`tests/` 目录)

### 文档交付物

- [ ] `docs/CODEBUDDY_MIGRATION_GUIDE.md` (增强版)
- [ ] `docs/CODEBUDDY_QUICKSTART.md` (优化版)
- [ ] `docs/CODEBUDDY_COMPATIBILITY_MATRIX.md` (更新版)
- [ ] `docs/CODEBUDDY_TROUBLESHOOTING.md` (新建)
- [ ] `docs/CODEBUDDY_API_REFERENCE.md` (新建)
- [ ] `docs/DIRECTORY_STRUCTURE_DESIGN.md` (新建,目录结构设计规范)
- [ ] `docs/OBSERVER_AGENT_ANALYSIS.md` (已完成)
- [ ] `docs/OBSERVER_DEEP_ANALYSIS.md` (已完成)
- [ ] `docs/MIGRATION_GUIDE_DEEP_ANALYSIS.md` (已完成)
- [ ] `docs/FULL_ADAPTATION_PLAN.md` (本文档)

### 配置交付物

- [ ] `.codebuddy/settings.json` (示例)
- [ ] `.codebuddy/continuous-learning.json` (新建)
- [ ] `.codebuddy-plugin/plugin.json` (已配置)
- [ ] `.codebuddy-plugin/marketplace.json` (市场配置)

---

## 🔄 维护计划

### 发布后支持

#### 第一周 (3/16 - 3/22)

- [ ] 监控 GitHub Issues
- [ ] 收集用户反馈
- [ ] 快速响应 Bug 报告
- [ ] 发布 hotfix (如需要)

#### 第一个月 (3/16 - 4/15)

- [ ] 每周发布更新
- [ ] 文档持续优化
- [ ] 性能监控
- [ ] 用户调研

### 长期维护

- [ ] 跟踪 CodeBuddy 版本更新
- [ ] 定期审查兼容性
- [ ] 社区贡献支持
- [ ] 文档更新

---

## 📝 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| **ECC** | Everything Claude Code |
| **CLv2** | Continuous Learning v2 |
| **P0/P1/P2** | 优先级 (P0=最高, P2=最低) |
| **Hook** | 事件钩子机制 |
| **Agent** | 专门处理特定任务的 AI 代理 |
| **Skill** | 特定领域的知识模块 |
| **Command** | 斜杠命令 (/xxx) |

### B. 参考资源

- [CodeBuddy 官方文档](https://www.codebuddy.cn/docs/cli/overview)
- [Everything Claude Code GitHub](https://github.com/affaan-m/everything-claude-code)
- [Observer Agent 分析](./OBSERVER_AGENT_ANALYSIS.md)
- [深度问题分析](./OBSERVER_DEEP_ANALYSIS.md)
- [迁移指南分析](./MIGRATION_GUIDE_DEEP_ANALYSIS.md)

### C. 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0 | 2026-02-13 | 初始版本 |

---

## 📞 联系方式

### 项目反馈

- **GitHub Issues**: [everything-claude-code/issues](https://github.com/affaan-m/everything-claude-code/issues)
- **社区讨论**: [CodeBuddy 社区](https://community.codebuddy.cn)

### 问题报告模板

```markdown
## 问题描述
简要描述遇到的问题

## 复现步骤
1. ...
2. ...
3. ...

## 预期行为
期望的结果

## 实际行为
实际的结果

## 环境信息
- CodeBuddy 版本:
- 操作系统:
- ECC 版本:

## 附加信息
- 错误日志
- 截图
- 相关配置文件
```

---

**文档结束**

祝适配工作顺利! 🚀
