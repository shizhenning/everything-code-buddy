# CodeBuddy Windows 兼容模式设计文档

## 背景

CodeBuddy 在 Windows 环境下运行，而传统的 hooks 配置大量使用 Bash 脚本（`.sh`），这导致了跨平台兼容性问题。为了解决这个问题，需要设计一套 Windows 友好的兼容模式。

## 现状分析

### 当前问题

1. **Shell 脚本不兼容**：`.sh` 脚本无法直接在 Windows PowerShell/CMD 中运行
2. **环境变量差异**：Windows 使用 `%VAR%` 语法，Unix 使用 `$VAR` 语法
3. **路径分隔符**：Windows 使用 `\`，Unix 使用 `/`
4. **命令差异**：如 `grep`、`sed`、`awk` 等在 Windows 上不可用
5. **权限问题**：Windows 的权限模型与 Unix 不同

### 现有解决方案

从 `hooks/hooks.json` 可以看到，项目已经开始使用 `node -e` 跨平台方案：

```json
{
  "type": "command",
  "command": "node -e \"let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{...})\""
}
```

这种方法的优势：
- ✅ Node.js 在所有平台（包括 Windows）上都能运行
- ✅ 内联脚本无需额外文件
- ✅ 可以直接使用 JavaScript 的跨平台 API

## 兼容模式设计

### 方案一：Node.js 脚本优先（推荐）

#### 设计理念

将所有 hooks 脚本重写为 Node.js 脚本，确保跨平台兼容性。

#### 目录结构

```
.codebuddy/
├── hooks/
│   ├── pre-tool-use.js
│   ├── post-tool-use.js
│   ├── session-start.js
│   ├── session-end.js
│   └── utils/
│       ├── platform.js
│       ├── path.js
│       └── exec.js
└── settings.json
```

#### 工具函数库

创建 `utils/platform.js` 用于跨平台兼容：

```javascript
// utils/platform.js
const os = require('os');
const path = require('path');

/**
 * 跨平台命令执行
 * @param {string} command - 要执行的命令
 * @returns {Object} { stdout, stderr, exitCode }
 */
async function execCommand(command) {
  const { exec } = require('child_process');
  
  return new Promise((resolve, reject) => {
    exec(command, { shell: true }, (error, stdout, stderr) => {
      if (error) {
        resolve({ stdout, stderr, exitCode: error.code || 1 });
      } else {
        resolve({ stdout, stderr, exitCode: 0 });
      }
    });
  });
}

/**
 * 检测当前平台
 */
function getPlatform() {
  const platform = os.platform();
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  return 'linux';
}

/**
 * 跨平台路径处理
 */
function normalizePath(p) {
  return path.normalize(p).split(path.sep).join('/');
}

/**
 * 获取环境变量
 */
function getEnvVar(name) {
  return process.env[name] || process.env[name.toUpperCase()];
}

module.exports = {
  execCommand,
  getPlatform,
  normalizePath,
  getEnvVar
};
```

#### Hook 脚本模板

```javascript
// hooks/pre-tool-use.js
const { execCommand, getPlatform, getEnvVar } = require('./utils/platform');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', async () => {
  try {
    const input = JSON.parse(data);
    const { tool_name, tool_input } = input;
    
    // 平台特定逻辑
    if (getPlatform() === 'windows') {
      // Windows 特定处理
    }
    
    // 输出原始数据（必须）
    console.log(data);
    process.exit(0);
  } catch (error) {
    console.error('[Hook] Error:', error.message);
    console.log(data); // 输出原始数据即使出错
    process.exit(0); // 不阻塞，仅记录错误
  }
});
```

### 方案二：Shell 脚本 + Node.js 封装

#### 设计理念

保留现有的 Bash 脚本，但在 Windows 上使用 Node.js 封装器调用 WSL 或 Git Bash。

#### 封装器实现

```javascript
// hooks/shell-wrapper.js
const { exec } = require('child_process');
const path = require('path');

/**
 * 跨平台 Shell 执行器
 */
async function executeShellScript(scriptPath, args = []) {
  const platform = process.platform;
  
  let command;
  if (platform === 'win32') {
    // Windows: 尝试使用 Git Bash 或 WSL
    if (process.env.GIT_BASH_PATH) {
      command = `"${process.env.GIT_BASH_PATH}" "${scriptPath}" ${args.join(' ')}`;
    } else {
      // 使用 WSL
      command = `wsl bash "${scriptPath}" ${args.join(' ')}`;
    }
  } else {
    // Unix-like: 直接执行
    command = `bash "${scriptPath}" ${args.join(' ')}`;
  }
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ stdout, stderr, exitCode: error.code || 1 });
      } else {
        resolve({ stdout, stderr, exitCode: 0 });
      }
    });
  });
}

module.exports = { executeShellScript };
```

### 方案三：混合模式（最佳实践）

#### 设计理念

根据场景选择最合适的实现方式：
- 简单逻辑：使用 `node -e` 内联脚本
- 复杂逻辑：使用独立的 `.js` 文件
- 已有的 Unix 脚本：使用封装器

#### 配置示例

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"...\"",  // 简单逻辑，内联
            "description": "Quick validation"
          },
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/validate-bash.js\"",  // 复杂逻辑
            "description": "Bash command validation"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
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

## 迁移指南

### 从 Bash 脚本迁移到 Node.js

#### 示例 1: Bash 验证脚本

**原 Bash 脚本**:
```bash
#!/bin/bash
COMMAND=$(jq -r '.tool_input.command')
if [[ "$COMMAND" == rm* ]]; then
  echo "Blocked: rm commands are not allowed" >&2
  exit 2
fi
```

**迁移后 Node.js 脚本**:
```javascript
let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const command = input.tool_input?.command || '';
    
    if (command.startsWith('rm')) {
      console.error('[Hook] BLOCKED: rm commands are not allowed');
      process.exit(2);
    }
    
    console.log(data);
    process.exit(0);
  } catch (error) {
    console.log(data);
    process.exit(0);
  }
});
```

#### 示例 2: 文件格式化

**原 Bash 脚本**:
```bash
#!/bin/bash
FILE_PATH=$(jq -r '.tool_input.file_path')
if [[ "$FILE_PATH" == *.js || "$FILE_PATH" == *.ts ]]; then
  npx prettier --write "$FILE_PATH"
fi
```

**迁移后 Node.js 脚本**:
```javascript
const { exec } = require('child_process');

let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path || '';
    
    if (/\\.(js|ts|jsx|tsx)$/.test(filePath)) {
      exec(`npx prettier --write "${filePath}"`, (error) => {
        console.log(data);
        process.exit(0);
      });
    } else {
      console.log(data);
      process.exit(0);
    }
  } catch (error) {
    console.log(data);
    process.exit(0);
  }
});
```

## CodeBuddy 目录结构规范

### 标准目录结构

| 目录类型 | 环境变量 | Windows 示例 | Linux/Mac 示例 |
|---------|---------|-------------|---------------|
| **插件目录** | `CODEBUDDY_PLUGIN_ROOT` | `C:\Users\username\.codebuddy` | `/home/username/.codebuddy` |
| **插件 Hooks** | - | `${CODEBUDDY_PLUGIN_ROOT}\hooks` | `${CODEBUDDY_PLUGIN_ROOT}/hooks` |
| **插件工具** | - | `${CODEBUDDY_PLUGIN_ROOT}\tools` | `${CODEBUDDY_PLUGIN_ROOT}/tools` |
| **项目目录** | `CODEBUDDY_PROJECT_DIR` | `D:\projects\myapp` | `/home/username/projects/myapp` |
| **项目数据** | - | `${CODEBUDDY_PROJECT_DIR}\.codebuddy` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy` |
| **用户目录** | `~` / `%USERPROFILE%` / `$HOME` | `C:\Users\username` | `/home/username` |
| **用户配置** | - | `~\.codebuddy` | `~/.codebuddy` |

### 完整目录结构示例

```
# Windows 示例
C:\Users\username\.codebuddy/              ← 插件根目录 (CODEBUDDY_PLUGIN_ROOT)
├── hooks/                                 ← 全局 Hooks
│   ├── observe.js                         ← 持续学习观察脚本
│   ├── run-observer.js                    ← 观察分析触发脚本
│   └── utils/                             ← 工具函数
├── tools/                                 ← 工具脚本
│   └── migrate-homunculus-data.js        ← 数据迁移工具
├── config.json                            ← 插件级配置

D:\projects\myapp\                        ← 项目根目录 (CODEBUDDY_PROJECT_DIR)
├── .codebuddy/                            ← 项目数据目录
│   ├── continuous-learning.json          ← 持续学习配置
│   ├── session.json                       ← 会话数据
│   └── homunculus/                        ← 持续学习数据
│       ├── observations.jsonl            ← 观察记录
│       ├── instincts/                     ← 本能文件
│       │   ├── personal/                  ← 个人本能
│       │   └── inherited/                 ← 继承本能
│       └── evolved/                       ← 演化本能

C:\Users\username\                         ← 用户主目录 (~ 或 %USERPROFILE%)
└── .codebuddy/                             ← 用户全局配置
    └── config.json                        ← 用户配置
```

### `~` 用户目录使用规范

| 场景 | Windows | Linux/Mac | 说明 |
|------|---------|-----------|------|
| **推荐方式** | `~` (PowerShell) | `~` (Bash) | ✅ 跨平台通用 |
| **环境变量** | `%USERPROFILE%` | `$HOME` | ✅ 明确指定 |
| **Node.js** | `os.homedir()` | `os.homedir()` | ✅ 跨平台函数 |
| **Python** | `Path("~").expanduser()` | `Path("~").expanduser()` | ✅ pathlib 自动处理 |
| ❌ **硬编码** | `C:\Users\username` | `/home/username` | ❌ 不推荐 |

**Node.js 示例**:

```javascript
const path = require('path');
const os = require('os');

// ✅ 正确：使用 os.homedir() 获取用户目录
const userHome = os.homedir(); // Windows: C:\Users\username, Unix: /home/username

// ✅ 正确：使用 ~ 快捷方式（需要配合 expanduser 库）
// 或直接使用 os.homedir()
const userConfigDir = path.join(userHome, '.codebuddy');

// ✅ 正确：使用环境变量
const projectDir = process.env.CODEBUDDY_PROJECT_DIR;
const pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT;
```

**Python 示例**:

```python
from pathlib import Path

# ✅ 正确：使用 ~ 快捷方式（自动展开）
user_config_dir = Path("~/.codebuddy").expanduser()

# ✅ 正确：使用 Path.home()
user_home = Path.home()
user_config = user_home / ".codebuddy"
```

### 路径使用规则

| 规则 | 用途 | 正确示例 | 错误示例 |
|------|------|---------|---------|
| ✅ **插件路径** | Hook 脚本、工具脚本 | `${CODEBUDDY_PLUGIN_ROOT}/hooks/xxx.js` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/hooks` |
| ✅ **项目数据** | 会话、配置、持续学习 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus` | `${CODEBUDDY_PLUGIN_ROOT}/homunculus` |
| ✅ **用户配置** | 全局用户设置 | `~/.codebuddy/config.json` | `C:\Users\username\.codebuddy` |
| ❌ **混用变量** | 不要混用不同作用域的变量 | - | 使用 PROJECT_DIR 引用插件脚本 |

---

## 配置文件适配

### settings.json 更新

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
            "timeout": 5000,
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
            "timeout": 10000,
            "description": "Auto-format code"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/hooks/session-start.js\"",
            "description": "Initialize session"
          }
        ]
      }
    ]
  }
}
```

## 环境变量支持

### CodeBuddy 提供的环境变量

| 变量名 | 用途 | Windows 示例 |
|--------|------|-------------|
| `CODEBUDDY_PLUGIN_ROOT` | **插件根目录** | `C:\Users\username\.codebuddy` |
| `CODEBUDDY_PROJECT_DIR` | **项目根目录** | `D:\projects\myapp` |
| `CODEBUDDY_HOME` | CodeBuddy 主目录 | `C:\Program Files\CodeBuddy` |
| `CODEBUDDY_MODEL` | 默认模型 | `gemini-3.0-flash` |

### 路径变量使用规范

| 规则 | 说明 | 示例 |
|------|------|------|
| ✅ **插件路径** | 使用 `CODEBUDDY_PLUGIN_ROOT` | `${CODEBUDDY_PLUGIN_ROOT}/hooks/xxx.js` |
| ✅ **项目数据** | 使用 `CODEBUDDY_PROJECT_DIR/.codebuddy` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus` |
| ❌ **错误用法** | 不要混用变量 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/hooks` |

### 在 Node.js 脚本中使用

```javascript
const path = require('path');
const pluginRoot = process.env.CODEBUDDY_PLUGIN_ROOT;
const projectDir = process.env.CODEBUDDY_PROJECT_DIR;

// ✅ 正确：插件配置/脚本
const hooksDir = path.join(pluginRoot, 'hooks');
const toolsDir = path.join(pluginRoot, 'tools');

// ✅ 正确：项目数据
const homunculusDir = path.join(projectDir, '.codebuddy', 'homunculus');
const sessionFile = path.join(projectDir, '.codebuddy', 'session.json');

// ❌ 错误：不要混用
const wrongPath = path.join(projectDir, '.codebuddy', 'hooks'); // 应该用 pluginRoot
```

## 测试验证

### 自动化测试脚本

```javascript
// tests/hooks/windows-compatibility.test.js
const { exec } = require('child_process');
const path = require('path');

async function testHook(hookPath, testData) {
  return new Promise((resolve, reject) => {
    const proc = exec(`node "${hookPath}"`, (error, stdout, stderr) => {
      if (error && error.code !== 0) {
        reject({ stdout, stderr, exitCode: error.code });
      } else {
        resolve({ stdout, stderr, exitCode: 0 });
      }
    });
    
    proc.stdin.write(JSON.stringify(testData));
    proc.stdin.end();
  });
}

async function runTests() {
  const hookPath = path.join(__dirname, '../../hooks/pre-tool-use.js');
  
  const testData = {
    tool_name: 'Bash',
    tool_input: { command: 'rm -rf node_modules' }
  };
  
  const result = await testHook(hookPath, testData);
  
  if (result.exitCode === 2) {
    console.log('✓ Hook correctly blocked dangerous command');
  } else {
    console.log('✗ Hook failed to block dangerous command');
  }
}

runTests();
```

## 最佳实践

### 1. 使用跨平台 API

```javascript
// ❌ 不推荐 - 硬编码路径
const configPath = '/home/user/.config';

// ✅ 推荐 - 使用 path 模块
const path = require('path');
const configPath = path.join(os.homedir(), '.config');
```

### 2. 平台检测

```javascript
const platform = require('os').platform();

if (platform === 'win32') {
  // Windows 特定代码
} else {
  // Unix-like 代码
}
```

### 3. 错误处理

```javascript
try {
  const input = JSON.parse(data);
  // 处理逻辑
} catch (error) {
  // 记录错误但不阻塞
  console.error('[Hook] Error:', error.message);
  console.log(data); // 输出原始数据
  process.exit(0);
}
```

### 4. 路径规范化

```javascript
const { normalizePath } = require('./utils/platform');

const filePath = normalizePath(input.tool_input.file_path);
// 将 C:\\path\\to\\file.js 转换为 C:/path/to/file.js
```

## 性能优化

### 1. 缓存常用操作

```javascript
const cache = new Map();

function formatCode(filePath) {
  if (cache.has(filePath)) {
    return cache.get(filePath);
  }
  
  // 执行格式化
  const result = executeFormat(filePath);
  cache.set(filePath, result);
  
  return result;
}
```

### 2. 异步处理

```javascript
const { exec } = require('child_process').promises;

async function runTests() {
  try {
    await exec('npm test');
  } catch (error) {
    console.error('Tests failed:', error);
  }
}
```

### 3. 并行执行

```javascript
const tasks = [
  runLinter(),
  runFormatter(),
  runTests()
];

await Promise.allSettled(tasks);
```

## 总结

### 推荐方案

**混合模式**是最实用的方案：
1. 简单逻辑使用 `node -e` 内联脚本
2. 复杂逻辑使用独立的 `.js` 文件
3. 保留工具函数库统一跨平台处理

### 优势

- ✅ 完全跨平台兼容
- ✅ Node.js 在 Windows 上原生支持
- ✅ 可以利用 npm 生态系统
- ✅ 调试方便（支持断点调试）
- ✅ 性能良好（V8 引擎优化）

### 后续工作

1. 创建工具函数库 (`utils/platform.js`)
2. 迁移现有 Bash 脚本到 Node.js
3. 添加测试用例覆盖 Windows 环境
4. 编写详细的迁移文档
5. 提供自动化迁移脚本

## 附录

### A. 常用命令对照表

| 功能 | Bash | Node.js |
|------|------|---------|
| JSON 解析 | `jq` | `JSON.parse()` |
| 字符串匹配 | `grep` | `String.match()` / RegExp |
| 文件读取 | `cat` | `fs.readFile()` |
| 文件写入 | `echo >` | `fs.writeFile()` |
| 目录遍历 | `find` | `fs.readdirSync()` + 递归 |
| 命令执行 | 直接执行 | `child_process.exec()` |

### B. 环境变量检查脚本

```javascript
// check-env.js
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('CODEBUDDY_PLUGIN_ROOT:', process.env.CODEBUDDY_PLUGIN_ROOT);
console.log('CODEBUDDY_PROJECT_DIR:', process.env.CODEBUDDY_PROJECT_DIR);
console.log('CODEBUDDY_HOME:', process.env.CODEBUDDY_HOME);
```

### C. 快速迁移模板

```javascript
// hook-template.js
let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    
    // TODO: 实现 hook 逻辑
    
    console.log(data);
    process.exit(0);
  } catch (error) {
    console.error('[Hook] Error:', error.message);
    console.log(data);
    process.exit(0);
  }
});
```
