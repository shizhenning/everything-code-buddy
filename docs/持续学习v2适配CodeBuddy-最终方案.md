# 持续学习 v2 适配 CodeBuddy - 最终适配方案

**文档版本:** v1.0
**制定日期:** 2026-02-18
**方案类型:** 最小化适配方案

---

## 📋 目录

1. [方案概述](#方案概述)
2. [核心问题分析](#核心问题分析)
3. [适配策略](#适配策略)
4. [实施计划](#实施计划)
5. [详细设计](#详细设计)
6. [测试验证](#测试验证)
7. [风险评估](#风险评估)

---

## 方案概述

### 1.1 适配目标

将持续学习 v2 的 **Instinct 管理系统** 适配到 CodeBuddy 平台，保留核心功能，最小化修改。

### 1.2 核心原则

✅ **保留现有 Python 客户端** - Instinct 系统代码无需修改
✅ **保留现有 Commands** - 所有 instinct-* 命令可直接使用
✅ **最小化路径调整** - 仅修改配置文件中的路径引用
✅ **Windows 兼容** - 将 sh Hooks 改为 Node.js 实现
✅ **国产模型集成** - 使用国产大模型替代 Haiku

### 1.3 架构对比

**原版 (Claude Code):**
```
Claude Code Hooks (sh)
    ↓
Instinct Python 客户端
    ↓
~/.claude/homunculus/
    ↓
Haiku 后台分析
```

**适配版 (CodeBuddy):**
```
CodeBuddy Hooks (Node.js)
    ↓
Instinct Python 客户端 (路径调整)
    ↓
~/.codebuddy/homunculus/
    ↓
国产模型手动分析
```

---

## 核心问题分析

### 2.1 官方文档确认

根据 [CodeBuddy 官方文档](https://www.codebuddy.cn/docs/cli/hooks):

| 限制项 | Claude Code | CodeBuddy | 影响 |
|--------|-------------|-----------|------|
| **Agent Hook 类型** | ✅ 支持 | ❌ 不支持 | Observer Agent 无法后台运行 |
| **SubagentStart 事件** | ✅ 支持 | ❌ 不支持 | 无法检测后台代理启动 |
| **后台任务** | ✅ 支持 | ❌ 不支持 | 无定时调度机制 |
| **Command Hook** | ✅ 支持 | ✅ 支持 | ✅ 可用 |

### 2.2 关键发现

1. ✅ **Instinct Python 客户端无需修改** - 纯 Python 实现，平台无关
2. ✅ **所有 instinct-* commands 可用** - 仅依赖路径配置
3. ✅ **Hooks 可用** - CodeBuddy 支持 Command 类型 Hook
4. ❌ **Observer Agent 需重写** - 后台 Agent 不支持
5. ⚠️ **Windows 兼容性** - sh 脚本需改为 Node.js

---

## 适配策略

### 3.1 三步走策略

**第一步: 路径适配** (1 天)
- 修改 Instinct 配置中的路径
- `~/.claude/` → `~/.codebuddy/`

**第二步: Hooks 改写** (2 天)
- 将 `observe.sh` 改为 Node.js 脚本
- 保持功能不变，确保跨平台兼容

**第三步: 分析替代** (3 天)
- 使用国产模型替代 Haiku 后台分析
- 改为手动触发或 cron 调度

### 3.2 保留不变的部分

✅ **完全保留:**
- `skills/continuous-learning-v2/` 目录结构
- 所有 Python 代码
- 所有 `commands/instinct-*.md` 命令
- Instinct 数据格式
- 配置文件格式

### 3.3 需要修改的部分

⚠️ **仅修改:**
- `hooks/observe.sh` → `hooks/observe.js` (Node.js)
- 配置文件中的路径
- Observer Agent 实现 (改用国产模型)

---

## 实施计划

### 4.1 工作量估算

| 阶段 | 任务 | 工作量 | 优先级 |
|------|------|--------|--------|
| **阶段 1** | 路径适配 | 4 小时 | 🔴 P0 |
| **阶段 2** | Hooks 改写 | 8 小时 | 🔴 P0 |
| **阶段 3** | 分析替代 | 16 小时 | 🟡 P1 |
| **阶段 4** | 测试验证 | 8 小时 | 🔴 P0 |
| **总计** | - | **36 小时 (约 5 天)** | - |

### 4.2 实施步骤

#### 阶段 1: 路径适配 (4 小时)

**1.1 修改配置文件**

文件: `skills/continuous-learning-v2/config.json`

```diff
{
  "version": "2.0",
  "observation": {
-   "store_path": "~/.claude/homunculus/observations.jsonl",
+   "store_path": "~/.codebuddy/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7
  },
  "instincts": {
-   "personal_path": "~/.claude/homunculus/instincts/personal/",
-   "inherited_path": "~/.claude/homunculus/instincts/inherited/",
+   "personal_path": "~/.codebuddy/homunculus/instincts/personal/",
+   "inherited_path": "~/.codebuddy/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7
  },
  "observer": {
-   "model": "haiku",
+   "model": "glm-5.0",  # 使用国产模型
+   "manual_trigger": true  # 手动触发
  }
}
```

**1.2 修改 Commands 中的路径**

文件: `commands/instinct-status.md`

```diff
```bash
- python ~/.claude/skills/continuous-learning-v2/instinct_cli.py status
+ python ./skills/continuous-learning-v2/instinct_cli.py status
```
```

同样修改:
- `commands/instinct-export.md`
- `commands/instinct-import.md`

**说明:**
- ✅ 使用**项目相对路径** (`./skills/...`)
- ✅ Python 脚本位于项目目录中
- ✅ 与 Hooks 配置保持一致的路径规范

---

#### 阶段 2: Hooks 改写 (8 小时)

**2.1 创建 Node.js Hook 脚本**

文件: `skills/continuous-learning-v2/hooks/observe.js`

```javascript
#!/usr/bin/env node

/**
 * CodeBuddy-compatible observation hook
 * 替代原版 observe.sh，实现跨平台兼容
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// 配置
const CONFIG = {
  // 用户数据目录 (Instinct 数据存储)
  userDir: path.join(os.homedir(), '.codebuddy'),

  // 观察数据文件路径
  observationsFile: path.join(
    os.homedir(),
    '.codebuddy',
    'homunculus',
    'observations.jsonl'
  ),

  maxSizeMB: 10,
  maxBytes: 10 * 1024 * 1024
};

// 确保目录存在
function ensureDirectoryExists(filepath) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 格式化时间戳
function getTimestamp() {
  return new Date().toISOString();
}

// 获取调用信息
function getCallerInfo() {
  return {
    pid: process.pid,
    platform: process.platform,
    node_version: process.version,
    cwd: process.cwd()
  };
}

// 记录观察
function recordObservation(type, data = {}) {
  ensureDirectoryExists(CONFIG.observationsFile);

  const observation = {
    id: crypto.randomUUID(),
    timestamp: getTimestamp(),
    type: type,
    ...data,
    _meta: getCallerInfo()
  };

  const line = JSON.stringify(observation) + '\n';

  // 检查文件大小，超过限制则轮转
  if (fs.existsSync(CONFIG.observationsFile)) {
    const stats = fs.statSync(CONFIG.observationsFile);
    if (stats.size >= CONFIG.maxBytes) {
      const archivePath = CONFIG.observationsFile + '.archive';
      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(archivePath);
      }
      fs.renameSync(CONFIG.observationsFile, archivePath);
    }
  }

  // 追加写入
  fs.appendFileSync(CONFIG.observationsFile, line);
  console.log(`[instinct] Recorded ${type} observation: ${observation.id}`);
}

// 主函数
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node observe.js <pre|post> [tool-name] [data]');
    process.exit(1);
  }

  const action = args[0];
  const toolName = args[1] || 'unknown';
  const additionalData = args[2];

  switch (action) {
    case 'pre':
      recordObservation('tool_pre', {
        tool_name: toolName,
        input: additionalData
      });
      break;

    case 'post':
      recordObservation('tool_post', {
        tool_name: toolName,
        result: additionalData
      });
      break;

    case 'session-start':
      recordObservation('session_start', {
        cwd: process.cwd(),
        args: process.argv
      });
      break;

    case 'session-end':
      recordObservation('session_end', {
        cwd: process.cwd(),
        duration_ms: process.uptime() * 1000
      });
      break;

    default:
      console.error(`Unknown action: ${action}`);
      process.exit(1);
  }
}

// 运行
main();
```

**2.2 修改 CodeBuddy Hooks 配置**

文件: `.codebuddy/settings.json` (项目根目录)

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node ./skills/continuous-learning-v2/hooks/observe.js pre ${tool_name}"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node ./skills/continuous-learning-v2/hooks/observe.js post ${tool_name}"
      }]
    }],
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node ./skills/continuous-learning-v2/hooks/observe.js session-start"
      }]
    }],
    "SessionEnd": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node ./skills/continuous-learning-v2/hooks/observe.js session-end"
      }]
    }]
  }
}
```

**说明:**
- ✅ 使用**项目相对路径** (`./skills/...`) - 推荐方式
- ✅ 所有脚本文件都在项目目录中 (`everything-code-buddy/`)
- ✅ CodeBuddy 从项目根目录执行，相对路径有效
- ✅ 跨平台兼容（Windows/macOS/Linux）

**路径解析:**
```
项目根目录: d:/UGit/everything-code-buddy/
    ↓
执行命令: node ./skills/continuous-learning-v2/hooks/observe.js
    ↓
实际路径: d:/UGit/everything-code-buddy/skills/continuous-learning-v2/hooks/observe.js
```

---

#### 阶段 3: 分析替代 (16 小时)

**3.1 创建国产模型分析脚本**

文件: `skills/continuous-learning-v2/scripts/analyze-instincts.js`

```javascript
#!/usr/bin/env node

/**
 * 使用国产模型分析 Instincts
 * 替代原版 Haiku 后台 Agent
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// 配置
const CONFIG = {
  // 观察数据文件路径 (用户目录)
  observationsFile: path.join(
    os.homedir(),
    '.codebuddy',
    'homunculus',
    'observations.jsonl'
  ),

  // Instinct 目录 (用户目录)
  instinctsDir: path.join(
    os.homedir(),
    '.codebuddy',
    'homunculus',
    'instincts',
    'personal'
  ),

  // 国产模型配置
  models: {
    primary: 'glm-5.0',
    fallback: ['deepseek-v3.2', 'kimi-k2.5', 'hunyuan-2.0']
  },

  // 分析配置
  maxTokens: 4096,
  temperature: 0.3,
  minObservations: 10
};

// 加载观察数据
function loadObservations() {
  if (!fs.existsSync(CONFIG.observationsFile)) {
    console.log('✓ No observations found yet.');
    return [];
  }

  const content = fs.readFileSync(CONFIG.observationsFile, 'utf8');
  const lines = content.trim().split('\n');

  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.warn(`⚠️ Failed to parse line: ${line.substring(0, 50)}...`);
      return null;
    }
  }).filter(Boolean);
}

// 构建分析提示词
function buildAnalysisPrompt(observations) {
  const recentObs = observations.slice(-50).map(obs => {
    return `- Type: ${obs.type}, Tool: ${obs.tool_name || 'N/A'}, Time: ${obs.timestamp}`;
  }).join('\n');

  return `
分析以下 CodeBuddy 会话观察数据，识别用户的 Instincts（本能）模式：

## 观察数据（最近 50 条）
${recentObs}

## 任务要求

1. **识别模式**：查找重复的行为模式，包括：
   - 代码风格偏好（如函数式 vs 面向对象）
   - 测试习惯（如 TDD vs 测试后写）
   - 调试方法（如 print 语句 vs debugger）
   - 工具选择（如偏好使用哪些工具）

2. **分配置信度**：为每个模式分配 0.3-0.9 的置信度分数：
   - 0.3: 尝试性的，偶尔使用
   - 0.5: 中等频率，部分场景使用
   - 0.7: 强烈倾向，经常使用
   - 0.9: 几乎确定，核心习惯

3. **生成 Instinct**：为每个模式创建 Instinct 定义

## 输出格式

JSON 格式：
\`\`\`json
{
  "instincts": [
    {
      "id": "prefer-functional-style",
      "trigger": "when writing new functions",
      "action": "Use functional patterns over classes",
      "confidence": 0.7,
      "domain": "code-style",
      "evidence": "Observed 5 instances in 20 tool calls"
    }
  ]
}
\`\`\`
`;
}

// 调用 CodeBuddy CLI 进行分析
function analyzeWithCodeBuddy(prompt, model) {
  try {
    const command = `codebuddy -m ${model} -p "${prompt.replace(/"/g, '\\"')}"`;
    const result = execSync(command, {
      encoding: 'utf8',
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024
    });

    return result;
  } catch (error) {
    console.warn(`⚠️ Analysis with ${model} failed: ${error.message}`);
    return null;
  }
}

// 解析 AI 响应
function parseAIResponse(response) {
  try {
    // 提取 JSON 部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found in AI response');
      return null;
    }

    const data = JSON.parse(jsonMatch[0]);
    return data.instincts || [];
  } catch (error) {
    console.warn(`⚠️ Failed to parse AI response: ${error.message}`);
    return null;
  }
}

// 创建 Instinct 文件
function createInstinctFile(instinct) {
  ensureDirectoryExists(CONFIG.instinctsDir);

  const filename = `${instinct.id}.md`;
  const filepath = path.join(CONFIG.instinctsDir, filename);

  const content = `---
id: ${instinct.id}
trigger: "${instinct.trigger}"
confidence: ${instinct.confidence}
domain: "${instinct.domain}"
source: "session-observation"
created_at: "${new Date().toISOString()}"
---

# ${instinct.id}

## Trigger
${instinct.trigger}

## Action
${instinct.action}

## Evidence
${instinct.evidence}

## Confidence Score
${getConfidenceLabel(instinct.confidence)}

---

*Created automatically by Instinct System v2*
`;

  fs.writeFileSync(filepath, content);
  console.log(`  ✓ Created: ${filename}`);
}

// 获取置信度标签
function getConfidenceLabel(score) {
  if (score >= 0.9) return '0.9 - 近乎确定';
  if (score >= 0.7) return '0.7 - 强烈倾向';
  if (score >= 0.5) return '0.5 - 中等频率';
  return '0.3 - 尝试性使用';
}

// 确保目录存在
function ensureDirectoryExists(dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}

// 主函数
async function main() {
  console.log('🔍 Instinct Analysis with Domestic Models\n');

  // 加载观察数据
  const observations = loadObservations();
  console.log(`📊 Loaded ${observations.length} observations\n`);

  if (observations.length < CONFIG.minObservations) {
    console.log(`✨ Not enough observations yet (${observations.length}/${CONFIG.minObservations}).`);
    console.log('   Continue using CodeBuddy to build observation history.');
    return;
  }

  // 构建提示词
  const prompt = buildAnalysisPrompt(observations);

  // 尝试主模型
  console.log(`🤖 Analyzing with ${CONFIG.models.primary}...`);
  let response = analyzeWithCodeBuddy(prompt, CONFIG.models.primary);

  // 如果失败，尝试备选模型
  if (!response) {
    for (const fallbackModel of CONFIG.models.fallback) {
      console.log(`🔄 Trying fallback model: ${fallbackModel}...`);
      response = analyzeWithCodeBuddy(prompt, fallbackModel);
      if (response) break;
    }
  }

  if (!response) {
    console.error('❌ All models failed to analyze.');
    process.exit(1);
  }

  // 解析响应
  const instincts = parseAIResponse(response);

  if (!instincts || instincts.length === 0) {
    console.log('✨ No instincts detected.');
    return;
  }

  // 创建 Instinct 文件
  console.log(`\n✓ Detected ${instincts.length} instincts:\n`);
  instincts.forEach(instinct => createInstinctFile(instinct));

  console.log(`\n✓ Analysis complete. Instincts saved to: ${CONFIG.instinctsDir}`);
  console.log('\n💡 Run /instinct-status to view all learned instincts.');
}

// 运行
main().catch(console.error);
```

**3.2 创建手动触发命令**

文件: `commands/analyze-instincts.md`

```markdown
---
name: analyze-instincts
description: 手动触发 Instinct 分析（使用国产模型）
---

# Analyze Instincts

手动触发 Instinct 分析，使用国产模型（GLM/Kimi/DeepSeek）识别学习模式。

## Usage

```bash
/analyze-instincts
```

## What It Does

1. 加载 `~/.codebuddy/homunculus/observations.jsonl` 中的观察数据
2. 使用国产模型（默认 GLM-5.0）分析模式
3. 自动创建或更新 Instinct 文件
4. 分配置信度分数（0.3-0.9）

## Supported Models

- **GLM-5.0** (默认) - 智谱 AI 最新模型
- **DeepSeek-V3.2** - 备选模型 1
- **Kimi-K2.5** - 备选模型 2
- **Hunyuan-2.0** - 腾讯混元

## Configuration

编辑 `~/.codebuddy/homunculus/config.json`:

```json
{
  "observer": {
    "model": "glm-5.0",
    "model_fallback": ["deepseek-v3.2", "kimi-k2.5"],
    "manual_trigger": true
  }
}
```

## See Also

- `/instinct-status` - View learned instincts
- `/instinct-export` - Export instincts
- `/instinct-import` - Import instincts
```

**3.3 创建定时任务配置（可选）**

文件: `skills/continuous-learning-v2/scripts/schedule-analysis.sh` (Linux/Mac) 或 `schedule-analysis.bat` (Windows)

**Linux/Mac (cron):**
```bash
#!/bin/bash
# 每天凌晨 2 点自动分析

0 2 * * * /usr/bin/node ~/.codebuddy/skills/continuous-learning-v2/scripts/analyze-instincts.js
```

**Windows (Task Scheduler):**
```batch
@echo off
REM 使用 Windows 任务计划程序设置定时任务
REM 每天凌晨 2 点运行

node %USERPROFILE%\.codebuddy\skills\continuous-learning-v2\scripts\analyze-instincts.js
```

---

#### 阶段 4: 测试验证 (8 小时)

**4.1 单元测试**

文件: `tests/continuous-learning-v2/test-hooks.js`

```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Instinct Hooks', () => {
  const testObservationsFile = path.join(__dirname, 'temp', 'observations.jsonl');

  before(() => {
    // 创建测试目录
    fs.mkdirSync(path.dirname(testObservationsFile), { recursive: true });
  });

  after(() => {
    // 清理测试文件
    if (fs.existsSync(testObservationsFile)) {
      fs.unlinkSync(testObservationsFile);
    }
  });

  it('should record pre-tool observation', () => {
    const output = execSync(
      `node skills/continuous-learning-v2/hooks/observe.js pre read_file`,
      { encoding: 'utf8' }
    );

    assert.ok(output.includes('tool_pre'));
    assert.ok(fs.existsSync(testObservationsFile));
  });

  it('should record post-tool observation', () => {
    const output = execSync(
      `node skills/continuous-learning-v2/hooks/observe.js post read_file`,
      { encoding: 'utf8' }
    );

    assert.ok(output.includes('tool_post'));
  });

  it('should handle session-start and session-end', () => {
    const startOutput = execSync(
      `node skills/continuous-learning-v2/hooks/observe.js session-start`,
      { encoding: 'utf8' }
    );
    assert.ok(startOutput.includes('session_start'));

    const endOutput = execSync(
      `node skills/continuous-learning-v2/hooks/observe.js session-end`,
      { encoding: 'utf8' }
    );
    assert.ok(endOutput.includes('session_end'));
  });
});
```

**4.2 集成测试**

文件: `tests/continuous-learning-v2/test-full-workflow.js`

```javascript
describe('Instinct Full Workflow', () => {
  it('should record observations and analyze instincts', () => {
    // 1. 模拟观察数据
    execSync(`node skills/continuous-learning-v2/hooks/observe.js pre search_file`);
    execSync(`node skills/continuous-learning-v2/hooks/observe.js post search_file`);

    // 2. 运行分析
    execSync(`node skills/continuous-learning-v2/scripts/analyze-instincts.js`);

    // 3. 验证 Instinct 文件创建
    const instinctsDir = path.join(os.homedir(), '.codebuddy', 'homunculus', 'instincts', 'personal');
    const files = fs.readdirSync(instinctsDir);
    assert.ok(files.length > 0);
  });
});
```

**4.3 手动测试清单**

- [ ] Hooks 正常记录观察数据
- [ ] `/instinct-status` 正常显示本能列表
- [ ] `/analyze-instincts` 成功分析并创建本能
- [ ] 置信度评分正确（0.3-0.9）
- [ ] 国产模型正常调用（GLM/Kimi/DeepSeek）
- [ ] Windows 环境下 Hooks 正常工作
- [ ] 路径适配正确（~/.codebuddy/）
- [ ] 导入/导出功能正常

---

## 详细设计

### 5.1 文件结构

#### 5.1.1 项目目录 (Project Directory)

```
everything-code-buddy/                    # 项目根目录
├── skills/
│   └── continuous-learning-v2/           # 持续学习 v2 技能
│       ├── hooks/
│       │   ├── observe.sh               # 原版: Shell Hook (保留)
│       │   └── observe.js              # 新增: Node.js Hook (CodeBuddy 兼容)
│       ├── scripts/
│       │   └── analyze-instincts.js    # 新增: 国产模型分析脚本
│       ├── config.json                 # 修改: 路径适配
│       ├── instinct_cli.py              # 保留: Python 客户端
│       └── agents/
│           └── observer.md             # 保留: Agent 定义 (参考)
│
├── commands/
│   ├── analyze-instincts.md            # 新增: 手动分析命令
│   ├── instinct-status.md              # 保留: 状态查询 (修改路径)
│   ├── instinct-export.md              # 保留: 导出 (修改路径)
│   └── instinct-import.md              # 保留: 导入 (修改路径)
│
├── tests/
│   └── continuous-learning-v2/
│       ├── test-hooks.js              # 测试: Hooks 单元测试
│       └── test-full-workflow.js      # 测试: 集成测试
│
└── .codebuddy/
    └── settings.json                  # CodeBuddy 项目配置
```

#### 5.1.2 用户目录 (User Directory - ~/.codebuddy/)

```
~/.codebuddy/                           # CodeBuddy 用户配置目录
├── homunculus/                         # Instinct 系统数据目录
│   ├── observations.jsonl              # 观察数据
│   ├── instincts/
│   │   ├── personal/                   # 用户本能
│   │   └── inherited/                 # 继承本能
│   └── config.json                    # Instinct 配置文件
│
└── settings.json                       # CodeBuddy 全局配置 (可选)
```

#### 5.1.3 目录路径说明

| 目录类型 | 路径 | 用途 | 配置方式 |
|---------|------|------|---------|
| **项目根目录** | `d:/UGit/everything-code-buddy/` | 代码仓库 | Git 管理 |
| **项目技能目录** | `skills/continuous-learning-v2/` | 持续学习代码 | 项目内相对路径 |
| **项目命令目录** | `commands/` | CodeBuddy 命令 | 项目内相对路径 |
| **用户配置目录** | `~/.codebuddy/` | CodeBuddy 配置 | 用户级别 |
| **Instinct 数据目录** | `~/.codebuddy/homunculus/` | Instinct 数据 | 用户级别 |

#### 5.1.4 路径引用规则

**Hooks 配置 (项目目录):**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        // 使用项目相对路径
        "command": "node ./skills/continuous-learning-v2/hooks/observe.js pre ${tool_name}"
      }]
    }]
  }
}
```

**Commands 配置 (项目目录):**
```bash
# 使用项目相对路径
python ./skills/continuous-learning-v2/instinct_cli.py status
```

**Instinct 配置 (用户目录):**
```json
{
  "observation": {
    "store_path": "~/.codebuddy/homunculus/observations.jsonl"
  },
  "instincts": {
    "personal_path": "~/.codebuddy/homunculus/instincts/personal/"
  }
}
```

### 5.2 数据流

```
用户使用 CodeBuddy
    ↓
CodeBuddy Hooks (PreToolUse/PostToolUse)
    ↓
Node.js Hook (observe.js)
    ↓
~/.codebuddy/homunculus/observations.jsonl
    ↓
用户运行 /analyze-instincts (手动触发)
    ↓
国产模型 (GLM/Kimi/DeepSeek)
    ↓
~/.codebuddy/homunculus/instincts/personal/*.md
    ↓
用户运行 /instinct-status 查看
```

---

## 测试验证

### 6.1 测试环境

- ✅ Windows 11 (主要测试环境)
- ✅ macOS 14
- ✅ Linux (Ubuntu 22.04)

### 6.2 测试用例

| 测试项 | 预期结果 | 状态 |
|--------|---------|------|
| Hooks 记录观察 | JSONL 文件正确写入 | ⏳ 待测试 |
| 路径适配 | 所有路径指向 ~/.codebuddy/ | ⏳ 待测试 |
| 国产模型分析 | 成功生成 Instinct | ⏳ 待测试 |
| Windows 兼容 | Node.js 脚本正常运行 | ⏳ 待测试 |
| instinct-status | 正常显示本能列表 | ⏳ 待测试 |
| 导入/导出 | 功能正常 | ⏳ 待测试 |

---

## 风险评估

### 7.1 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 国产模型 API 不可用 | 中 | 高 | 支持多模型备选，本地 fallback |
| Hooks 性能影响 | 低 | 中 | 异步写入，限制文件大小 |
| Windows 路径问题 | 低 | 低 | 使用 path.join() 跨平台处理 |
| 分析质量下降 | 中 | 中 | 可手动调整 Instinct |

### 7.2 兼容性风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| CodeBuddy 更新破坏 Hooks | 低 | 高 | 监控版本，及时适配 |
| Python 环境依赖 | 低 | 低 | Python CLI 独立，不影响核心 |
| 路径冲突 | 低 | 中 | 明确使用 ~/.codebuddy/ |

---

## 总结

### 适配成果

✅ **保留核心功能:**
- Instinct Python 客户端（无需修改）
- 所有 instinct-* commands（仅调整路径）
- 数据收集和模式识别能力

✅ **新增功能:**
- 跨平台 Node.js Hooks（Windows 兼容）
- 国产模型支持（GLM/Kimi/DeepSeek/混元）
- 手动触发分析（更可控）

✅ **最小化修改:**
- 仅修改配置文件中的路径
- 仅重写 Hooks（sh → Node.js）
- 仅重写 Observer Agent（Haiku → 国产模型）

### 工作量

- **总工作量:** 36 小时 (约 5 个工作日)
- **核心改动:** 3 个文件新增，3 个文件修改
- **风险等级:** 低

### 推荐度

⭐⭐⭐⭐⭐ (强烈推荐)

**理由:**
1. 最大化保留现有代码
2. 最小化修改范围
3. 完全兼容 CodeBuddy
4. Windows 友好
5. 支持国产模型
6. 工作量可控

---

## 附录

### A. 路径规范说明

#### A.1 路径类型分类

| 类型 | 路径前缀 | 示例 | 用途 | 是否 Git 管理 |
|------|----------|------|------|-------------|
| **项目脚本** | `./` 或项目相对路径 | `./skills/continuous-learning-v2/hooks/observe.js` | Hooks/Commands 引用 | ✅ 是 |
| **用户数据** | `~/` 或 `%USERPROFILE%` | `~/.codebuddy/homunculus/observations.jsonl` | Instinct 数据存储 | ❌ 否 |
| **项目配置** | `./` | `./.codebuddy/settings.json` | CodeBuddy 项目配置 | ✅ 是 |
| **用户配置** | `~/` 或 `%USERPROFILE%` | `~/.codebuddy/settings.json` | CodeBuddy 全局配置 | ❌ 否 |

#### A.2 路径使用场景

**场景 1: Hooks 配置 (项目配置)**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "node ./skills/continuous-learning-v2/hooks/observe.js pre ${tool_name}"
      }]
    }]
  }
}
```
- 文件: `./.codebuddy/settings.json` (项目根目录)
- 路径: **项目相对路径** (`./skills/...`)
- 说明: 引用项目内的脚本文件

---

**场景 2: Commands 配置 (项目配置)**
```bash
python ./skills/continuous-learning-v2/instinct_cli.py status
```
- 文件: `commands/instinct-status.md` (项目内)
- 路径: **项目相对路径** (`./skills/...`)
- 说明: 引用项目内的 Python 脚本

---

**场景 3: Instinct 配置 (用户数据)**
```json
{
  "observation": {
    "store_path": "~/.codebuddy/homunculus/observations.jsonl"
  },
  "instincts": {
    "personal_path": "~/.codebuddy/homunculus/instincts/personal/"
  }
}
```
- 文件: `~/.codebuddy/homunculus/config.json`
- 路径: **用户目录** (`~/.codebuddy/`)
- 说明: 存储用户的 Instinct 数据

---

**场景 4: Node.js Hook 脚本 (用户数据)**
```javascript
const CONFIG = {
  observationsFile: path.join(
    os.homedir(),  // 用户主目录
    '.codebuddy',  // CodeBuddy 用户目录
    'homunculus',
    'observations.jsonl'
  )
};
```
- 文件: `./skills/continuous-learning-v2/hooks/observe.js` (项目内)
- 路径: **用户目录** (`~/.codebuddy/`)
- 说明: 脚本在项目中，但写入用户数据目录

#### A.3 跨平台路径处理

| 操作系统 | 用户主目录 | 示例路径 |
|---------|-----------|---------|
| **Windows** | `%USERPROFILE%` | `C:\Users\username\.codebuddy\homunculus\` |
| **macOS** | `~` | `/Users/username/.codebuddy/homunculus/` |
| **Linux** | `~` | `/home/username/.codebuddy/homunculus/` |

**Node.js 跨平台处理:**
```javascript
const path = require('path');
const os = require('os');

// 自动处理路径分隔符
const userDir = path.join(os.homedir(), '.codebuddy');
// Windows: C:\Users\username\.codebuddy
// macOS/Linux: /Users/username/.codebuddy
```

#### A.4 路径迁移清单

从 Claude Code 迁移到 CodeBuddy 时的路径变更:

| 原路径 (Claude) | 新路径 (CodeBuddy) | 说明 |
|-----------------|-------------------|------|
| `~/.claude/homunculus/` | `~/.codebuddy/homunculus/` | 用户数据目录 |
| `~/.claude/skills/` | `./skills/` | 技能目录 |
| `~/.claude/commands/` | `./commands/` | 命令目录 |
| `${CLAUDE_PLUGIN_ROOT}` | `./` (项目根目录) | 插件根目录 |

---

### B. 文件清单

| 文件 | 操作 | 工作量 |
|------|------|--------|
| `skills/continuous-learning-v2/hooks/observe.js` | 新增 | 4h |
| `skills/continuous-learning-v2/scripts/analyze-instincts.js` | 新增 | 8h |
| `commands/analyze-instincts.md` | 新增 | 2h |
| `skills/continuous-learning-v2/config.json` | 修改 | 1h |
| `commands/instinct-status.md` | 修改 | 0.5h |
| `commands/instinct-export.md` | 修改 | 0.5h |
| `commands/instinct-import.md` | 修改 | 0.5h |
| 测试文件 | 新增 | 8h |
| 配置文件 | 新增 | 2h |
| 文档更新 | 修改 | 4h |

### B. 关键代码片段

详见各章节的代码示例。

### C. 相关文档

- [持续学习 v2 英文文档](../skills/continuous-learning-v2/SKILL.md)
- [Instinct 管理系统详解](./Instinct管理系统详解.md)
- [CodeBuddy 体系结构文档](./CodeBuddy体系结构文档.md)
- [持续学习v2适配CodeBuddy分析报告](./持续学习v2适配CodeBuddy分析报告.md)
