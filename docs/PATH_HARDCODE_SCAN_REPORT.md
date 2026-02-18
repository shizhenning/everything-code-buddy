# 路径硬编码扫描报告

> **扫描日期**: 2026-02-18
> **扫描范围**: agents/, commands/, skills/, rules/
> **扫描工具**: grep -rn "\.claude|/claude|~?\.claude"

---

## 📊 执行摘要

| 指标 | 数值 |
|------|------|
| **总扫描文件** | 118+ |
| **发现硬编码文件** | 41 |
| **Agents** | 0 (0%) |
| **Commands** | 18 (44%) |
| **Skills** | 15 (37%) |
| **Rules** | 8 (19%) |
| **预计修复工作量** | 6h (P0) |

---

## 🎯 扫描结果详情

### Commands (18 files)

| 文件 | 硬编码位置 | 优先级 | 修复内容 |
|------|-----------|--------|---------|
| `/checkpoint` | `.claude/checkpoints.log` | 🔴 P0 | `.codebuddy/checkpoints.log` |
| `/eval` | `.claude/evals/` | 🔴 P0 | `.codebuddy/evals/` |
| `/e2e` | `~/.claude/agents/e2e-runner.md` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/agents/` |
| `/evolve` | `~/.claude/homunculus/` (多处) | 🔴 P0 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` |
| `/instinct-status` | `~/.claude/homunculus/` | 🔴 P0 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` |
| `/instinct-import` | `~/.claude/homunculus/` | 🔴 P0 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` |
| `/instinct-export` | `~/.claude/homunculus/` | 🔴 P0 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` |
| `/multi-execute` | `~/.claude/bin/`, `~/.claude/.ccg/` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/bin/`, `.ccg/` |
| `/multi-frontend` | `~/.claude/bin/`, `~/.claude/.ccg/` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/bin/`, `.ccg/` |
| `/multi-backend` | `~/.claude/.ccg/` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/` |
| `/multi-plan` | `.claude/plan/` | 🟡 P1 | `.codebuddy/plan/` |
| `/multi-workflow` | `~/.claude/.ccg/` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/` |
| `/multi-backend` | `~/.claude/.ccg/` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/` |
| `/learn` | 可能引用 | 🟡 P1 | 需检查 |
| `/multi-plan` | 可能引用 | 🟡 P1 | 需检查 |
| `/pm2` | 可能引用 | 🟡 P1 | 需检查 |
| `/plan` | 可能引用 | 🟡 P1 | 需检查 |
| `/setup-pm` | 可能引用 | 🟡 P1 | 需检查 |
| `/sessions` | 可能引用 | 🟡 P1 | 需检查 |
| `/tdd` | 可能引用 | 🟡 P1 | 需检查 |

**Commands 修复优先级**:

1. **🔴 P0 - Continuous Learning 相关** (4 files)
   - `/instinct-status`
   - `/instinct-import`
   - `/instinct-export`
   - `/evolve`

2. **🔴 P0 - 项目级数据** (2 files)
   - `/checkpoint`
   - `/eval`

3. **🟡 P1 - Multi-Agent 命令** (6 files)
   - `/multi-execute`
   - `/multi-frontend`
   - `/multi-backend`
   - `/multi-plan`
   - `/multi-workflow`
   - `/multi-backend`

---

### Skills (15 files)

| 文件 | 硬编码位置 | 优先级 | 修复内容 |
|------|-----------|--------|---------|
| `configure-ecc/SKILL.md` | `~/.claude/` (多处) | 🟡 P1 | `~/.codebuddy/`, `${CODEBUDDY_PLUGIN_ROOT}/` |
| `iterative-retrieval/SKILL.md` | `~/.claude/agents/` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/agents/` |
| `strategic-compact/suggest-compact.sh` | `~/.claude/settings.json` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `strategic-compact/SKILL.md` | `~/.claude/settings.json`, `~/.claude/memory/` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `eval-harness/SKILL.md` | `.claude/evals/` | 🟡 P1 | `.codebuddy/evals/` |
| `security-scan/SKILL.md` | `.claude/`, `CLAUDE.md` | 🟡 P1 | `.codebuddy/`, `CODEBUDDY.md` |
| `continuous-learning-v2/config.json` | `~/.claude/homunculus/` (多处) | 🔴 P0 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` |
| `continuous-learning-v2/SKILL.md` | `~/.claude/settings.json` | 🔴 P0 | `~/.codebuddy/settings.json` |
| `continuous-learning-v2/scripts/instinct-cli.py` | `~/.claude/homunculus/` (代码) | 🔴 P0 | 使用环境变量 + Path.expanduser() |
| `continuous-learning-v2/hooks/observe.sh` | `~/.claude/` (脚本) | 🔴 P0 | 使用环境变量 |
| `continuous-learning-v2/agents/start-observer.sh` | `~/.claude/` (脚本) | 🔴 P0 | 使用环境变量 |
| `continuous-learning-v2/agents/observer.md` | `~/.claude/` (文档) | 🔴 P0 | 更新路径说明 |
| `continuous-learning/SKILL.md` | 可能引用 | 🟡 P1 | 需检查 |
| `continuous-learning/config.json` | 可能引用 | 🟡 P1 | 需检查 |
| `continuous-learning/evaluate-session.sh` | 可能引用 | 🟡 P1 | 需检查 |

**Skills 修复优先级**:

1. **🔴 P0 - Continuous Learning v2** (6 files)
   - `continuous-learning-v2/config.json`
   - `continuous-learning-v2/SKILL.md`
   - `continuous-learning-v2/scripts/instinct-cli.py`
   - `continuous-learning-v2/hooks/observe.sh`
   - `continuous-learning-v2/agents/start-observer.sh`
   - `continuous-learning-v2/agents/observer.md`

2. **🟡 P1 - 其他 Skills** (9 files)
   - `configure-ecc/SKILL.md`
   - `iterative-retrieval/SKILL.md`
   - `strategic-compact/suggest-compact.sh`
   - `strategic-compact/SKILL.md`
   - `eval-harness/SKILL.md`
   - `security-scan/SKILL.md`
   - `continuous-learning/SKILL.md`
   - `continuous-learning/config.json`
   - `continuous-learning/evaluate-session.sh`

---

### Rules (8 files)

| 文件 | 硬编码位置 | 优先级 | 修复内容 |
|------|-----------|--------|---------|
| `typescript/hooks.md` | `~/.claude/settings.json` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `golang/hooks.md` | `~/.claude/settings.json` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `python/hooks.md` | `~/.claude/settings.json` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `common/hooks.md` | `~/.claude.json` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `common/performance.md` | `~/.claude/settings.json` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `common/git-workflow.md` | `~/.claude/settings.json` | 🟡 P1 | `~/.codebuddy/settings.json` |
| `common/agents.md` | `~/.claude/agents/` | 🟡 P1 | `${CODEBUDDY_PLUGIN_ROOT}/agents/` |
| `README.md` | `~/.claude/rules/` (安装说明) | 🟡 P1 | `~/.codebuddy/rules/` |

**Rules 修复优先级**:

所有 rules 文件均为 🟡 P1 优先级，因为主要是配置文件路径引用，不影响核心功能。

---

### Agents (0 files)

✅ **无路径硬编码问题**

---

## 🔧 路径映射规则

### 用户级路径

| Claude Code | CodeBuddy | 使用场景 |
|-------------|-----------|---------|
| `~/.claude/` | `~/.codebuddy/` | 用户配置目录 |
| `~/.claude/settings.json` | `~/.codebuddy/settings.json` | 用户配置文件 |
| `~/.claude.json` | `~/.codebuddy/settings.json` | 用户配置文件（旧格式） |

### 项目级路径

| Claude Code | CodeBuddy | 使用场景 |
|-------------|-----------|---------|
| `.claude/` | `.codebuddy/` | 项目配置目录 |
| `.claude/checkpoints.log` | `.codebuddy/checkpoints.log` | 检查点日志 |
| `.claude/evals/` | `.codebuddy/evals/` | 评估定义 |
| `.claude/plan/` | `.codebuddy/plan/` | 计划文件 |

### 插件级路径

| Claude Code | CodeBuddy | 使用场景 |
|-------------|-----------|---------|
| `~/.claude/skills/` | `${CODEBUDDY_PLUGIN_ROOT}/skills/` | 技能目录 |
| `~/.claude/agents/` | `${CODEBUDDY_PLUGIN_ROOT}/agents/` | 代理目录 |
| `~/.claude/rules/` | `${CODEBUDDY_PLUGIN_ROOT}/rules/` | 规则目录 |
| `~/.claude/bin/` | `${CODEBUDDY_PLUGIN_ROOT}/bin/` | 可执行文件 |
| `~/.claude/.ccg/` | `${CODEBUDDY_PLUGIN_ROOT}/.ccg/` | CCG 配置 |

### 持续学习路径

| Claude Code | CodeBuddy | 说明 |
|-------------|-----------|------|
| `~/.claude/homunculus/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/` | **重要**: 从用户级改为项目级 |
| `~/.claude/homunculus/observations.jsonl` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/observations.jsonl` | 观察数据 |
| `~/.claude/homunculus/instincts/personal/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/instincts/personal/` | 个人本能 |
| `~/.claude/homunculus/instincts/inherited/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/instincts/inherited/` | 继承本能 |
| `~/.claude/homunculus/evolved/` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/evolved/` | 演化内容 |

---

## 🛠️ 修复方案

### 自动化修复 (3h)

**修复脚本**: `scripts/fix-claude-paths.js`

```javascript
const fs = require('fs');
const path = require('path');

// 路径映射规则（按优先级排序）
const pathMappings = [
  // 持续学习路径（优先级最高）
  { from: '~/.claude/homunculus/', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/', context: 'cl-data' },
  { from: '~/.claude/homunculus/observations.jsonl', to: '${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/observations.jsonl', context: 'cl-data' },

  // 插件级路径
  { from: '~/.claude/skills/', to: '${CODEBUDDY_PLUGIN_ROOT}/skills/', context: 'plugin' },
  { from: '~/.claude/agents/', to: '${CODEBUDDY_PLUGIN_ROOT}/agents/', context: 'plugin' },
  { from: '~/.claude/rules/', to: '${CODEBUDDY_PLUGIN_ROOT}/rules/', context: 'plugin' },
  { from: '~/.claude/bin/', to: '${CODEBUDDY_PLUGIN_ROOT}/bin/', context: 'plugin' },
  { from: '~/.claude/.ccg/', to: '${CODEBUDDY_PLUGIN_ROOT}/.ccg/', context: 'plugin' },

  // 用户级配置
  { from: '~/.claude/settings.json', to: '~/.codebuddy/settings.json', context: 'user-config' },
  { from: '~/.claude.json', to: '~/.codebuddy/settings.json', context: 'user-config' },

  // 项目级路径
  { from: '.claude/', to: '.codebuddy/', context: 'project' },

  // 通用路径
  { from: '~/.claude/', to: '~/.codebuddy/', context: 'user-general' },
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
  const glob = require('glob');
  const files = glob.sync(pattern);
  files.forEach(file => {
    if (fixPathsInFile(file)) fixedCount++;
  });
});

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);
```

### 手动修复 (2h)

**需要手动审查的文件**:

1. **Python 脚本** (`instinct-cli.py`)
   ```python
   # 需要使用 Path.expanduser() 和环境变量
   import os
   from pathlib import Path

   HOMUNCULUS_DIR = Path(os.getenv('CODEBUDDY_PROJECT_DIR', Path.cwd())) / ".codebuddy" / "homunculus"
   ```

2. **Bash 脚本** (`observe.sh`, `start-observer.sh`)
   ```bash
   # 需要使用环境变量
   HOMUNCULUS_DIR="${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"
   ```

3. **Config.json** (`continuous-learning-v2/config.json`)
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

4. **文档示例代码** (各 MD 文件中的示例)
   ```markdown
   # 需要更新示例中的路径
   python3 ~/.claude/skills/... → python3 ${CODEBUDDY_PLUGIN_ROOT}/skills/...
   ```

### 验证脚本 (1h)

**验证脚本**: `scripts/verify-no-claude-paths.sh`

```bash
#!/bin/bash
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
  echo ""
  echo "📄 Report saved to: path-scan-report.txt"
  cat path-scan-report.txt
  exit 1
else
  echo "✅ No Claude path references found!"
  rm -f path-scan-report.txt
  exit 0
fi
```

---

## 📅 修复计划

### Week 1 (2/18 - 2/24)

**Day 1-2 (4h)**: 自动化修复
- [ ] 编写 `fix-claude-paths.js` 脚本
- [ ] 对所有 41 个文件执行自动修复
- [ ] 验证自动修复结果

**Day 3 (2h)**: 手动修复 Python/Bash 脚本
- [ ] 修复 `instinct-cli.py`
- [ ] 修复 `observe.sh`
- [ ] 修复 `start-observer.sh`
- [ ] 修复 `continuous-learning-v2/config.json`

**Day 4 (1h)**: 手动审查和修正
- [ ] 审查 Commands 中的示例代码
- [ ] 审查 Skills 中的配置说明
- [ ] 修正误替换的路径

**Day 5 (1h)**: 验证和测试
- [ ] 运行 `verify-no-claude-paths.sh`
- [ ] 手动验证修复后的文件
- [ ] 生成最终报告

---

## ✅ 验收标准

### 完整性
- [ ] 所有 41 个文件已扫描
- [ ] 所有 `.claude` 路径已替换
- [ ] 验证脚本无残留路径

### 正确性
- [ ] Python 脚本使用环境变量
- [ ] Bash 脚本使用环境变量
- [ ] Config.json 使用正确的路径变量
- [ ] 文档示例代码已更新

### 测试
- [ ] Continuous Learning v2 命令测试通过
- [ ] 项目级数据路径测试通过
- [ ] Multi-Agent 命令测试通过

---

## 📊 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| **误替换路径** | 中 | 中 | 使用版本控制，提交前审查 diff |
| **Python/Bash 脚本错误** | 低 | 高 | 手动审查 + 单元测试 |
| **文档示例不完整** | 中 | 低 | 逐步验证每个示例 |
| **Config.json 格式错误** | 低 | 高 | JSON 格式验证 |

---

## 📝 参考文档

- [FULL_ADAPTATION_PLAN.md](./FULL_ADAPTATION_PLAN.md) - 完整适配计划
- [CODEBUDDY_COMPATIBILITY_MATRIX.md](./CODEBUDDY_COMPATIBILITY_MATRIX.md) - 兼容性矩阵
- [CODEBUDDY_WINDOWS_COMPATIBILITY.md](./CODEBUDDY_WINDOWS_COMPATIBILITY.md) - Windows 兼容性
- [CodeBuddy体系结构文档.md](./CodeBuddy体系结构文档.md) - 系统架构

---

## 🔄 更新历史

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2026-02-18 | v1.0 | 初始扫描报告 |
