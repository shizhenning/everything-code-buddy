# Continuous Learning v2 适配清单

> **版本**: 1.0
> **更新日期**: 2026-02-18

---

## 📋 需要修改的文件清单

### 1. Hook 脚本修改

#### `skills/continuous-learning-v2/hooks/observe.sh`

**问题**:
- 第 7 行: 注释中提到 `~/.claude/settings.json`
- 第 10 行: 使用 `${CLAUDE_PLUGIN_ROOT}` 环境变量
- 第 23 行: 注释中提到 `~/.claude/skills`
- 第 39 行: 硬编码路径 `"${HOME}/.claude/homunculus"`

**修改内容**:

```bash
# 原始代码
CONFIG_DIR="${HOME}/.claude/homunculus"

# 修改为
CONFIG_DIR="${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"

# 或者使用环境变量
CONFIG_DIR="${CODEBUDDY_HOME}/homunculus"
```

**Hook 配置注释更新**:

```bash
# 修改前
# Hook config (in ~/.claude/settings.json):
# {
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "*",
#       "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre" }]
#     }],
#     "PostToolUse": [{
#       "matcher": "*",
#       "hooks": [{ "type": "command", "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post" }]
#     }]
#   }
# }

# 修改后
# Hook config (in ~/.codebuddy/settings.json):
# {
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "*",
#       "hooks": [{ "type": "command", "command": "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre" }]
#     }],
#     "PostToolUse": [{
#       "matcher": "*",
#       "hooks": [{ "type": "command", "command": "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post" }]
#     }]
#   }
# }
```

---

### 2. Python 脚本修改

#### `skills/continuous-learning-v2/scripts/instinct-cli.py`

**问题**:
- 第 27-32 行: 硬编码路径 `~/.claude/homunculus`

**修改内容**:

```python
# 原始代码
HOMUNCULUS_DIR = Path.home() / ".claude" / "homunculus"
INSTINCTS_DIR = HOMUNCULUS_DIR / "instincts"
PERSONAL_DIR = INSTINCTS_DIR / "personal"
INHERITED_DIR = INSTINCTS_DIR / "inherited"
EVOLVED_DIR = HOMUNCULUS_DIR / "evolved"
OBSERVATIONS_FILE = HOMUNCULUS_DIR / "observations.jsonl"

# 修改为
# 优先使用 CODEBUDDY_HOME，回退到旧路径
CODEBUDDY_HOME = Path(os.environ.get('CODEBUDDY_HOME', 
                        os.environ.get('HOME', '') + '/.codebuddy'))
HOMUNCULUS_DIR = CODEBUDDY_HOME / "homunculus"
INSTINCTS_DIR = HOMUNCULUS_DIR / "instincts"
PERSONAL_DIR = INSTINCTS_DIR / "personal"
INHERITED_DIR = INSTINCTS_DIR / "inherited"
EVOLVED_DIR = HOMUNCULUS_DIR / "evolved"
OBSERVATIONS_FILE = HOMUNCULUS_DIR / "observations.jsonl"
```

---

### 3. Observer Agent 修改

#### `skills/continuous-learning-v2/agents/observer.md`

**问题**:
- 可能包含后台模式相关配置
- 可能使用 `${CLAUDE_PLUGIN_ROOT}` 变量

**需要检查和修改**:
1. 移除后台模式相关配置
2. 更新路径变量为 `${CODEBUDDY_PLUGIN_ROOT}`
3. 更新配置目录路径

---

### 4. 配置文件修改

#### `skills/continuous-learning-v2/config.json`

**问题**:
- 可能包含 Claude Code 特定配置
- 路径引用可能需要更新

**需要检查**:
1. 路径配置是否包含 `.claude`
2. 环境变量引用是否为 `CLAUDE_*`
3. Hook 路径配置

---

### 5. Shell 脚本修改

#### `skills/continuous-learning-v2/agents/start-observer.sh`

**问题**:
- 可能使用 `${CLAUDE_PLUGIN_ROOT}`
- 可能硬编码 `.claude` 路径

**需要检查**:
1. 环境变量引用
2. 路径硬编码
3. 后台模式相关代码

---

## 📝 修改优先级

### P0 - 阻塞性修改 (必须完成)

| 文件 | 修改项 | 预计时间 |
|------|--------|---------|
| `instinct-cli.py` | 路径硬编码修复 | 1h |
| `hooks/observe.sh` | 路径硬编码修复 | 1h |
| `config.json` | 路径配置更新 | 0.5h |

**总计**: 2.5h

---

### P1 - 功能性修改

| 文件 | 修改项 | 预计时间 |
|------|--------|---------|
| `observer.md` | 后台模式移除 | 3h |
| `start-observer.sh` | 脚本适配 | 2h |

**总计**: 5h

---

### P2 - 优化性修改

| 文件 | 修改项 | 预计时间 |
|------|--------|---------|
| 新增 `observe.js` (Node.js 版本) | 跨平台兼容 | 4h |
| 测试脚本更新 | 环境适配 | 1h |

**总计**: 5h

---

## 🔧 详细修改指南

### 修改 1: instinct-cli.py 路径配置

```python
# 在文件顶部添加环境变量检测
import os
from pathlib import Path

# 修改前
HOMUNCULUS_DIR = Path.home() / ".claude" / "homunculus"

# 修改后
# 支持 CODEBUDDY_HOME 和旧路径回退
CODEBUDDY_HOME = Path(os.environ.get('CODEBUDDY_HOME', 
                        os.path.get('HOME', '') + '/.codebuddy'))
HOMUNCULUS_DIR = CODEBUDDY_HOME / "homunculus"
```

---

### 修改 2: observe.sh Hook 脚本

```bash
# 修改前
CONFIG_DIR="${HOME}/.claude/homunculus"

# 修改后 (优先使用 CODEBUDDY_HOME)
if [ -n "${CODEBUDDY_HOME}" ]; then
    CONFIG_DIR="${CODEBUDDY_HOME}/homunculus"
elif [ -n "${CODEBUDDY_PROJECT_DIR}" ]; then
    CONFIG_DIR="${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"
else
    CONFIG_DIR="${HOME}/.codebuddy/homunculus"
fi
```

---

### 修改 3: Hook 配置示例更新

创建新的配置示例文件 `.codebuddy/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

---

## 📦 跨平台兼容性增强

### 推荐添加的 Node.js 版本 Hook

创建 `skills/continuous-learning-v2/hooks/observe.js`:

```javascript
#!/usr/bin/env node
/**
 * Continuous Learning v2 - Observation Hook (Node.js version)
 * 
 * Cross-platform compatible hook for capturing tool use events
 */

const fs = require('fs');
const path = require('path');

// Get paths from environment variables
const CODEBUDDY_HOME = process.env.CODEBUDDY_HOME || 
                        path.join(process.env.HOME || process.env.USERPROFILE, '.codebuddy');
const CONFIG_DIR = path.join(CODEBUDDY_HOME, 'homunculus');
const OBSERVATIONS_FILE = path.join(CONFIG_DIR, 'observations.jsonl');

// Ensure directory exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Read hook data from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
    inputData += chunk.toString();
});

process.stdin.on('end', () => {
    if (!inputData.trim()) {
        process.exit(0);
    }

    try {
        const data = JSON.parse(inputData);
        const hookType = data.hook_type || 'unknown';
        const toolName = data.tool_name || data.tool || 'unknown';
        
        // Determine event type
        const event = hookType.includes('Pre') ? 'tool_start' : 'tool_complete';
        
        const observation = {
            timestamp: new Date().toISOString(),
            event: event,
            tool: toolName,
            session: data.session_id || 'unknown'
        };

        if (event === 'tool_start' && data.tool_input) {
            observation.input = JSON.stringify(data.tool_input).slice(0, 5000);
        }
        
        if (event === 'tool_complete' && data.tool_output) {
            observation.output = JSON.stringify(data.tool_output).slice(0, 5000);
        }

        // Write observation
        fs.appendFileSync(OBSERVATIONS_FILE, JSON.stringify(observation) + '\n');
    } catch (error) {
        console.error('Error processing hook data:', error.message);
        process.exit(0);
    }
});
```

---

## ✅ 修改检查清单

### 必须完成的修改 (P0)

- [ ] `instinct-cli.py` 路径硬编码修复
- [ ] `observe.sh` 路径硬编码修复
- [ ] `config.json` 路径配置更新
- [ ] Hook 配置注释更新

### 功能性修改 (P1)

- [ ] `observer.md` 后台模式移除
- [ ] `start-observer.sh` 环境变量更新
- [ ] 文档中路径引用更新

### 优化性修改 (P2)

- [ ] `observe.js` Node.js 版本实现
- [ ] 跨平台测试脚本
- [ ] 迁移脚本更新

---

## 🧪 测试计划

### 单元测试

1. **路径解析测试**
   ```bash
   # 测试 CODEBUDDY_HOME 环境变量
   export CODEBUDDY_HOME=/tmp/test-codebuddy
   python3 skills/continuous-learning-v2/scripts/instinct-cli.py status
   ```

2. **Hook 测试**
   ```bash
   # 测试 hook 脚本
   echo '{"hook_type":"PreToolUse","tool_name":"test","session_id":"123"}' | \
       bash skills/continuous-learning-v2/hooks/observe.sh pre
   ```

### 集成测试

1. **完整流程测试**
   - 安装 hook 配置
   - 运行 CodeBuddy 会话
   - 验证 observations.jsonl 生成
   - 验证 instinct 生成

2. **跨平台测试**
   - Windows (PowerShell, CMD)
   - Linux (Bash)
   - macOS (Zsh, Bash)

---

## 📚 参考文档

- [CodeBuddy 目录结构设计](./DIRECTORY_STRUCTURE_DESIGN.md)
- [路径硬编码扫描报告](./PATH_HARDCODE_SCAN_REPORT.md)
- [CodeBuddy 兼容性矩阵](./CODEBUDDY_COMPATIBILITY_MATRIX.md)
- [完整适配计划](./FULL_ADAPTATION_PLAN.md)
