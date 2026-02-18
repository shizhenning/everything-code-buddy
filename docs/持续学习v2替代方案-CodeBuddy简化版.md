# 持续学习 v2 替代方案 - CodeBuddy 简化版

**文档版本:** v1.0  
**制定日期:** 2026-02-18  
**状态:** 方案设计完成

---

## 📋 目录

1. [方案概述](#方案概述)
2. [核心架构设计](#核心架构设计)
3. [组件详细设计](#组件详细设计)
4. [实施计划](#实施计划)
5. [功能对比](#功能对比)
6. [优势与局限](#优势与局限)

---

## 方案概述

### 设计目标

基于 CodeBuddy 的实际能力,设计一个**简化但可用**的持续学习系统,在不依赖后台 Agent 的情况下,实现核心的观察、记录和模式识别功能。

### 核心原则

1. **适应 CodeBuddy 限制** - 不使用后台 Agent、不依赖 Instinct 系统
2. **保留核心价值** - 观察数据收集、手动分析、模式识别
3. **渐进式增强** - 从最小可行版本开始,逐步完善
4. **用户可控** - 所有分析由用户主动触发

---

## 核心架构设计

### 架构对比

```
【原版 v2 架构 (Claude Code)】
Session Activity
      │
      │ Hooks 捕获 (100% 可靠)
      ▼
┌─────────────────────────────────────┐
│       observations.jsonl            │
│   (prompts, tool calls, outcomes)   │
└─────────────────────────────────────┘
      │
      │ Observer agent 分析 (后台, Haiku) ⚠️ CodeBuddy 不支持
      ▼
┌─────────────────────────────────────┐
│          模式检测                   │
│   • 用户纠正 → instinct            │
│   • 错误解决 → instinct           │
│   • 重复工作流 → instinct         │
└─────────────────────────────────────┘
      │
      │ 创建/更新本能
      ▼
┌─────────────────────────────────────┐
│       instincts/personal/          │
│   • prefer-functional.md (0.7)     │
└─────────────────────────────────────┘

【替代方案架构 (CodeBuddy 简化版)】
Session Activity
      │
      │ Hooks 捕获 (100% 可靠)
      ▼
┌─────────────────────────────────────┐
│       observations.jsonl            │
│   (prompts, tool calls, outcomes)   │
└─────────────────────────────────────┘
      │
      │ 用户手动触发分析命令
      ▼
┌─────────────────────────────────────┐
│          分析脚本                   │
│   • 读取 observations.jsonl       │
│   • 识别重复模式                  │
│   • 生成建议文档                  │
└─────────────────────────────────────┘
      │
      │ 创建模式文档
      ▼
┌─────────────────────────────────────┐
│       patterns/                   │
│   • functional-style.md            │
│   • test-first.md                 │
│   • zod-validation.md             │
└─────────────────────────────────────┘
```

### 关键差异

| 特性 | 原版 v2 | 简化版 | 说明 |
|------|---------|---------|------|
| **数据收集** | Hooks 自动 | Hooks 自动 | ✅ 相同 |
| **模式分析** | 后台 Agent | 手动触发 | ⚠️ 改为手动 |
| **置信度评分** | Haiku 评分 | 频率统计 | ⚠️ 简化 |
| **本能系统** | Instinct API | 文档存储 | ⚠️ 重构 |
| **演化机制** | 自动聚类 | 手动组合 | ⚠️ 改为手动 |

---

## 组件详细设计

### 组件 1: Hooks 数据收集 (✅ 完全支持)

#### 1.1 Hook 配置

**文件:** `.codebuddy/hooks/hooks.json`

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-lite/hooks/observe.sh pre",
        "timeout": 10
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-lite/hooks/observe.sh post",
        "timeout": 10
      }]
    }],
    "SessionEnd": [{
      "hooks": [{
        "type": "command",
        "command": "${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-lite/hooks/session-end.sh"
      }]
    }]
  }
}
```

#### 1.2 观察 Hook 实现

**文件:** `skills/continuous-learning-lite/hooks/observe.sh`

```bash
#!/bin/env bash

set -e

PLUGIN_ROOT="${CODEBUDDY_PLUGIN_ROOT}"
HOMUNCULUS_DIR="$HOME/.codebuddy/homunculus"
OBSERVATIONS_FILE="$HOMUNCULUS_DIR/observations.jsonl"

# 创建目录
mkdir -p "$HOMUNCULUS_DIR"
mkdir -p "$HOMUNCULUS_DIR/observations.archive"

# 归档旧的观察数据 (超过 10MB)
if [ -f "$OBSERVATIONS_FILE" ] && [ $(stat -f%z "$OBSERVATIONS_FILE" 2>/dev/null || stat -c%s "$OBSERVATIONS_FILE" 2>/dev/null || echo 0) -gt 10485760 ]; then
    ARCHIVE_FILE="$HOMUNCULUS_DIR/observations.archive/$(date +%Y%m%d-%H%M%S).jsonl"
    mv "$OBSERVATIONS_FILE" "$ARCHIVE_FILE"
fi

# 读取输入数据
INPUT=$(cat)

# 记录观察
echo "$(date -Iseconds)|$INPUT" >> "$OBSERVATIONS_FILE"

exit 0
```

#### 1.3 会话结束 Hook 实现

**文件:** `skills/continuous-learning-lite/hooks/session-end.sh`

```bash
#!/bin/env bash

set -e

PLUGIN_ROOT="${CODEBUDDY_PLUGIN_ROOT}"
HOMUNCULUS_DIR="$HOME/.codebuddy/homunculus"
SESSION_SUMMARY="$HOMUNCULUS_DIR/session-summary.json"

# 读取输入
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TIMESTAMP=$(date -Iseconds)

# 更新会话摘要
if [ -n "$SESSION_ID" ]; then
    cat > "$SESSION_SUMMARY.tmp" <<EOF
{
  "last_session_id": "$SESSION_ID",
  "last_session_time": "$TIMESTAMP",
  "total_sessions": $(jq '.total_sessions + 1 // 1' "$SESSION_SUMMARY" 2>/dev/null || echo 1)
}
EOF
    mv "$SESSION_SUMMARY.tmp" "$SESSION_SUMMARY"
fi

exit 0
```

---

### 组件 2: 分析脚本 (🟡 手动触发 + 国产模型)

#### 2.0 国产模型集成

**说明:** 替代方案使用国产大模型进行智能分析,完全适配 CodeBuddy 的模型支持。

**支持的国产模型:**

| 模型 | 提供商 | 特点 | 推荐场景 |
|------|--------|------|---------|
| `glm-5.0` | 智谱 AI | 最新一代 GLM,综合能力强 | 🔴 强烈推荐 |
| `kimi-k2.5` | Moonshot AI | Kimi 系列高性能版本 | 🟡 推荐 |
| `deepseek-v3.2` | DeepSeek | DeepSeek V3 最新版本 | 🟡 推荐 |
| `hunyuan-2.0-instruct-20251111` | 腾讯混元 | 混元 2.0 指令微调版 | 🟢 可用 |

**配置选择:**

```json
{
  "analysis": {
    "model": "glm-5.0",
    "model_fallback": ["deepseek-v3.2", "kimi-k2.5"],
    "max_tokens": 4096,
    "temperature": 0.3
  }
}
```

**模型调用示例:**

```bash
# 使用 GLM-5.0 进行模式分析
codebuddy -m glm-5.0 "分析 ~/.codebuddy/homunculus/observations.jsonl 中的模式"

# 使用 DeepSeek V3.2 作为备选
codebuddy -m deepseek-v3.2 "总结以下工作流模式..."
```

---

#### 2.1 模式识别脚本 (国产模型增强版)

**文件:** `skills/continuous-learning-lite/scripts/analyze-patterns.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOMUNCULUS_DIR = path.join(process.env.HOME || process.env.USERPROFILE, '.codebuddy', 'homunculus');
const OBSERVATIONS_FILE = path.join(HOMUNCULUS_DIR, 'observations.jsonl');
const PATTERNS_DIR = path.join(HOMUNCULUS_DIR, 'patterns');

// 创建目录
if (!fs.existsSync(PATTERNS_DIR)) {
  fs.mkdirSync(PATTERNS_DIR, { recursive: true });
}

// 读取观察数据
function loadObservations() {
  if (!fs.existsSync(OBSERVATIONS_FILE)) {
    return [];
  }
  
  const content = fs.readFileSync(OBSERVATIONS_FILE, 'utf8');
  return content.split('\n')
    .filter(line => line.trim())
    .map(line => {
      try {
        const parts = line.split('|');
        const timestamp = parts[0];
        const data = JSON.parse(parts.slice(1).join('|'));
        return { timestamp, ...data };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

// 识别重复的工具使用模式
function detectToolPatterns(observations) {
  const toolUsage = {};
  
  observations.forEach(obs => {
    if (obs.tool && obs.tool_name) {
      const key = `${obs.tool_name}|${obs.tool_input?.substring(0, 50) || ''}`;
      toolUsage[key] = (toolUsage[key] || 0) + 1;
    }
  });
  
  // 返回使用频率 >= 3 的模式
  return Object.entries(toolUsage)
    .filter(([_, count]) => count >= 3)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);
}

// 识别代码风格模式
function detectCodeStylePatterns(observations) {
  const patterns = {
    functional: 0,
    classBased: 0,
    asyncAwait: 0,
    callbacks: 0,
    typescript: 0,
    javascript: 0
  };
  
  observations.forEach(obs => {
    const input = (obs.tool_input || '').toLowerCase();
    
    // 检测函数式风格
    if (input.includes('.map(') || input.includes('.filter(') || input.includes('.reduce(')) {
      patterns.functional++;
    }
    
    // 检测类定义
    if (input.includes('class ') && input.includes(' extends ')) {
      patterns.classBased++;
    }
    
    // 检测 async/await
    if (input.includes('await ') || input.includes('async ')) {
      patterns.asyncAwait++;
    }
    
    // 检测回调
    if (input.includes('function(') && input.includes(', function(')) {
      patterns.callbacks++;
    }
    
    // 检测 TypeScript
    if (input.includes(': string') || input.includes(': number') || input.includes('interface ')) {
      patterns.typescript++;
    }
  });
  
  // 返回频率 >= 2 的模式
  return Object.entries(patterns)
    .filter(([_, count]) => count >= 2)
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count);
}

// 生成模式文档
function generatePatternDocuments(patterns) {
  const timestamp = new Date().toISOString();

  patterns.forEach(({ pattern, count }) => {
    const patternType = classifyPattern(pattern);
    const filename = `${patternType}-${Date.now()}.md`;
    const filepath = path.join(PATTERNS_DIR, filename);

    const content = `---
id: ${patternType}-${Date.now()}
trigger: "detected_${patternType}_pattern"
frequency: ${count}
domain: "workflow"
detected_at: "${timestamp}"
---

# ${patternType} Pattern Detected

## Description
This pattern was detected ${count} times in your session history.

## Pattern Details
- **Type**: ${patternType}
- **Frequency**: ${count} occurrences
- **Detected**: ${timestamp}

## Suggested Action
${getSuggestedAction(patternType, pattern)}

## Observations
The following observations contributed to this pattern:
<!-- Add specific observations here -->
`;

    fs.writeFileSync(filepath, content);
    console.log(`✓ Created pattern document: ${filename}`);
  });
}

// 调用国产模型进行智能分析 (新功能)
async function analyzeWithAIModel(observations, patterns) {
  try {
    const model = process.env.CODEBUDDY_ANALYSIS_MODEL || 'glm-5.0';
    const analysisPrompt = buildAnalysisPrompt(observations, patterns);

    console.log(`🤖 Analyzing with ${model}...`);

    // 调用 CodeBuddy CLI 进行分析
    const result = execSync(
      `codebuddy -m ${model} -p "${analysisPrompt.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 60000 }
    );

    // 解析 AI 返回的建议
    return parseAIResponse(result);
  } catch (error) {
    console.warn(`⚠️ AI analysis failed: ${error.message}`);
    return null;
  }
}

// 构建分析提示词
function buildAnalysisPrompt(observations, patterns) {
  const recentObs = observations.slice(-50).map(obs =>
    `- Tool: ${obs.tool_name || 'N/A'}\n  Input: ${obs.tool_input?.substring(0, 100) || 'N/A'}`
  ).join('\n');

  const patternsSummary = patterns.map(p =>
    `- ${p.patternType}: ${p.count} occurrences`
  ).join('\n');

  return `
分析以下 CodeBuddy 会话观察数据,识别重要的工作流和代码模式:

## 观察数据 (最近 50 条)
${recentObs}

## 已识别模式
${patternsSummary}

## 请提供:

1. **模式分类**: 将这些模式归类为以下类别:
   - code-style (代码风格)
   - workflow (工作流程)
   - testing (测试习惯)
   - debugging (调试方法)
   - architecture (架构选择)

2. **置信度评分**: 为每个模式分配 0.3-0.9 的置信度分数:
   - 0.3: 尝试性的,偶尔使用
   - 0.5: 中等频率,部分场景使用
   - 0.7: 强烈倾向,经常使用
   - 0.9: 几乎确定,核心习惯

3. **改进建议**: 为每个模式提供具体的改进建议

4. **优先级排序**: 按重要性和改进潜力排序

## 输出格式:
JSON 格式:
{
  "patterns": [
    {
      "type": "category",
      "name": "pattern_name",
      "confidence": 0.7,
      "evidence": "观察摘要",
      "suggestion": "具体建议",
      "priority": "high|medium|low"
    }
  ]
}
`;
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
    return data.patterns || [];
  } catch (error) {
    console.warn(`⚠️ Failed to parse AI response: ${error.message}`);
    return null;
  }
}

// 分类模式类型
function classifyPattern(pattern) {
  const lower = pattern.toLowerCase();
  
  if (lower.includes('bash')) return 'shell-command';
  if (lower.includes('write') || lower.includes('edit')) return 'code-editing';
  if (lower.includes('functional')) return 'functional-style';
  if (lower.includes('class')) return 'class-based';
  if (lower.includes('async')) return 'async-pattern';
  if (lower.includes('test')) return 'testing';
  
  return 'general-pattern';
}

// 获取建议操作
function getSuggestedAction(patternType, pattern) {
  const actions = {
    'shell-command': 'Consider creating a command alias or script for this frequently used shell command.',
    'code-editing': 'Consider automating this edit with a custom command or skill.',
    'functional-style': 'Continue using functional patterns for this type of task.',
    'class-based': 'Consider refactoring to functional style if appropriate.',
    'async-pattern': 'Ensure proper error handling with try/catch blocks.',
    'testing': 'Ensure tests are comprehensive and maintain coverage.',
    'general-pattern': 'Review this pattern and consider if it should be formalized.'
  };
  
  return actions[patternType] || 'Review this pattern for potential automation.';
}

// 主函数
async function main() {
  console.log('🔍 Analyzing observation patterns...\n');

  const observations = loadObservations();
  console.log(`📊 Loaded ${observations.length} observations\n`);

  const toolPatterns = detectToolPatterns(observations);
  console.log(`🔧 Detected ${toolPatterns.length} tool patterns`);

  const codeStylePatterns = detectCodeStylePatterns(observations);
  console.log(`📝 Detected ${codeStylePatterns.length} code style patterns\n`);

  const allPatterns = [...toolPatterns, ...codeStylePatterns];

  if (allPatterns.length === 0) {
    console.log('✨ No significant patterns detected yet. Continue using CodeBuddy to build observation history.');
    return;
  }

  // 先生成基础模式文档
  generatePatternDocuments(allPatterns);

  // 调用国产模型进行智能分析 (如果可用)
  console.log('\n🤖 Running AI analysis with domestic model...');
  const aiPatterns = await analyzeWithAIModel(observations, allPatterns);

  if (aiPatterns && aiPatterns.length > 0) {
    console.log(`✓ AI analysis complete. Generated ${aiPatterns.length} enhanced patterns.`);
    // 将 AI 分析结果整合到模式文档
    enhancePatternsWithAI(aiPatterns);
  } else {
    console.log('⚠️ AI analysis skipped or failed. Using statistical analysis only.');
  }

  console.log(`\n✓ Analysis complete. Created ${allPatterns.length} pattern documents.`);
  console.log(`📁 Patterns saved to: ${PATTERNS_DIR}`);
}

// 用 AI 分析结果增强模式文档
function enhancePatternsWithAI(aiPatterns) {
  aiPatterns.forEach(({ type, name, confidence, evidence, suggestion, priority }) => {
    const filename = `${type}-${Date.now()}.md`;
    const filepath = path.join(PATTERNS_DIR, filename);

    const content = `---
id: ${type}-${Date.now()}
trigger: "ai_detected_${name}"
confidence: ${confidence}
domain: "workflow"
detected_at: "${new Date().toISOString()}"
ai_enhanced: true
---

# ${name} (AI Analysis)

## Description
${evidence}

## Pattern Details
- **Type**: ${type}
- **Confidence**: ${confidence} (${getConfidenceLabel(confidence)})
- **Priority**: ${priority}
- **AI Enhanced**: Yes

## AI Suggested Action
${suggestion}

## Priority Level
${getPriorityLabel(priority)}
`;

    fs.writeFileSync(filepath, content);
    console.log(`  ✓ Created AI-enhanced pattern: ${filename}`);
  });
}

// 获取置信度标签
function getConfidenceLabel(score) {
  if (score >= 0.9) return '近乎确定';
  if (score >= 0.7) return '强烈倾向';
  if (score >= 0.5) return '中等频率';
  return '尝试性使用';
}

// 获取优先级标签
function getPriorityLabel(priority) {
  const labels = {
    'high': '🔴 高优先级 - 建议立即关注',
    'medium': '🟡 中优先级 - 建议适当时候处理',
    'low': '🟢 低优先级 - 可以后续考虑'
  };
  return labels[priority] || '未知优先级';
}

main().catch(console.error);
```

#### 2.2 模式查看命令

**文件:** `commands/learn-status.md`

```markdown
---
name: learn-status
description: 显示学习到的模式
---

# 学习状态查看

## 使用方法

输入 `/learn-status` 查看已识别的模式。

## 功能

- 显示所有学习到的模式
- 显示模式使用频率
- 提供模式文件路径

## 输出示例

```
已识别模式: 5 个

1. functional-style (频率: 7)
   - 文件: ~/.codebuddy/homunculus/patterns/functional-style-1234567890.md
   - 建议: 继续使用函数式风格

2. shell-command (频率: 5)
   - 文件: ~/.codebuddy/homunculus/patterns/shell-command-1234567890.md
   - 建议: 考虑创建命令别名
...
```
```

#### 2.3 模式分析命令

**文件:** `commands/analyze-learning.md`

```markdown
---
name: analyze-learning
description: 分析观察数据并识别模式
---

# 学习数据分析

## 使用方法

输入 `/analyze-learning` 手动触发模式分析。

## 功能

- 读取 observations.jsonl
- 识别重复的工具使用模式
- 识别代码风格模式
- 生成模式文档

## 输出

- 显示识别到的模式数量
- 显示模式文件路径
- 提供改进建议

## 注意

此命令需要手动触发,不会自动运行。
建议在每次长时间使用 CodeBuddy 后执行。
```

---

### 组件 3: 模式管理 (🟡 简化版)

#### 3.1 模式文档结构

**目录:** `~/.codebuddy/homunculus/patterns/`

```
patterns/
├── functional-style-1234567890.md
├── shell-command-2345678901.md
├── async-pattern-3456789012.md
└── ...
```

#### 3.2 模式文档格式

```markdown
---
id: functional-style-1234567890
trigger: "detected_functional_pattern"
frequency: 7
domain: "code-style"
detected_at: "2026-02-18T10:30:00Z"
---

# Functional Style Pattern Detected

## Description
This pattern was detected 7 times in your session history.

## Pattern Details
- **Type**: functional-style
- **Frequency**: 7 occurrences
- **Detected**: 2026-02-18T10:30:00Z

## Suggested Action
Continue using functional patterns for this type of task.

## Observations
The following observations contributed to this pattern:
- Observation 1: Used .map() for array transformation
- Observation 2: Used .filter() for data filtering
- ...
```

#### 3.3 模式导出命令

**文件:** `commands/export-patterns.md`

```markdown
---
name: export-patterns
description: 导出学习到的模式
---

# 模式导出

## 使用方法

输入 `/export-patterns [目录路径]` 导出模式。

## 功能

- 打包所有模式文档
- 创建压缩文件
- 生成导出摘要

## 输出格式

```
patterns-export-20260218.tar.gz
├── patterns/
│   ├── functional-style-1234567890.md
│   └── ...
└── export-summary.json
```

## 用途

- 备份学习数据
- 分享给其他用户
- 迁移到其他机器
```

#### 3.4 模式导入命令

**文件:** `commands/import-patterns.md`

```markdown
---
name: import-patterns
description: 导入模式
---

# 模式导入

## 使用方法

输入 `/import-patterns [文件路径]` 导入模式。

## 功能

- 解压模式文件
- 验证格式
- 合并到现有模式

## 冲突处理

- 相同 ID 的模式会被覆盖
- 其他模式会被保留
- 会生成导入报告

## 输出

```
✓ 导入完成
- 新增模式: 3 个
- 覆盖模式: 1 个
- 失败: 0 个
```
```

---

### 组件 4: 配置文件

#### 4.1 主配置文件

**文件:** `~/.codebuddy/homunculus/config.json`

```json
{
  "version": "2.0.0-lite",
  "observation": {
    "max_file_size_mb": 10,
    "archive_enabled": true,
    "retention_days": 90
  },
  "analysis": {
    "model": "glm-5.0",
    "model_fallback": ["deepseek-v3.2", "kimi-k2.5"],
    "auto_analyze": false,
    "ai_analysis_enabled": true,
    "min_frequency": 3,
    "pattern_types": [
      "tool-usage",
      "code-style",
      "workflow"
    ],
    "max_tokens": 4096,
    "temperature": 0.3
  },
  "patterns": {
    "directory": "~/.codebuddy/homunculus/patterns",
    "max_patterns": 100
  },
  "models": {
    "glm": {
      "primary": "glm-5.0",
      "description": "智谱 AI 最新一代 GLM 模型,综合能力强",
      "recommended_for": ["general", "code-analysis", "pattern-detection"]
    },
    "kimi": {
      "primary": "kimi-k2.5",
      "description": "Moonshot AI Kimi 系列高性能版本",
      "recommended_for": ["long-context", "document-analysis"]
    },
    "deepseek": {
      "primary": "deepseek-v3.2",
      "description": "DeepSeek V3 最新版本,性价比高",
      "recommended_for": ["coding", "refactoring", "debugging"]
    },
    "hunyuan": {
      "primary": "hunyuan-2.0-instruct-20251111",
      "description": "腾讯混元 2.0 指令微调版",
      "recommended_for": ["chinese-tasks", "general-purpose"]
    }
  }
}
```

---

#### 4.2 环境变量配置

**可选环境变量:**

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|---------|------|
| `CODEBUDDY_ANALYSIS_MODEL` | 优先使用的分析模型 | `glm-5.0` | `export CODEBUDDY_ANALYSIS_MODEL=kimi-k2.5` |
| `CODEBUDDY_AI_ENABLED` | 是否启用 AI 增强 | `true` | `export CODEBUDDY_AI_ENABLED=true` |
| `CODEBUDDY_MODEL_FALLBACK` | 备选模型列表 | - | `export CODEBUDDY_MODEL_FALLBACK=deepseek-v3.2,kimi-k2.5` |

**配置示例:**

```bash
# 优先使用 GLM-5.0
export CODEBUDDY_ANALYSIS_MODEL=glm-5.0

# 如果 GLM-5.0 不可用,自动尝试 DeepSeek 和 Kimi
export CODEBUDDY_MODEL_FALLBACK=deepseek-v3.2,kimi-k2.5

# 启用 AI 增强分析
export CODEBUDDY_AI_ENABLED=true
```

---

#### 4.3 模型选择指南

**根据场景选择合适的国产模型:**

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| **通用分析** | `glm-5.0` | 综合能力强,适合多种分析任务 |
| **长上下文** | `kimi-k2.5` | 支持长对话历史分析 |
| **代码分析** | `deepseek-v3.2` | 在编程任务上表现优秀 |
| **中文任务** | `hunyuan-2.0` | 对中文理解更好 |
| **成本敏感** | `deepseek-v3.2` | 性价比高 |

**模型调用优先级:**

```javascript
// 优先级顺序: 环境变量 > 配置文件 > 默认值
const model =
  process.env.CODEBUDDY_ANALYSIS_MODEL ||        // 1. 环境变量
  config.analysis.model ||                        // 2. 配置文件
  'glm-5.0';                                 // 3. 默认值

// 失败后自动切换到备选模型
const fallbackModels = config.analysis.model_fallback || [
  'deepseek-v3.2',
  'kimi-k2.5',
  'hunyuan-2.0-instruct-20251111'
];
```

---

## 实施计划

### 阶段 1: 基础数据收集 (1 周)

**目标:** 实现 Hooks 数据收集功能

**任务:**
- [ ] 创建 `continuous-learning-lite` 目录结构
- [ ] 实现 `observe.sh` Hook
- [ ] 实现 `session-end.sh` Hook
- [ ] 配置 `hooks/hooks.json`
- [ ] 测试数据收集功能

**交付物:**
- ✅ `hooks/observe.sh`
- ✅ `hooks/session-end.sh`
- ✅ `hooks/hooks.json`
- ✅ `~/.codebuddy/homunculus/observations.jsonl`

---

### 阶段 2: 模式分析脚本 (2 周)

**目标:** 实现模式识别和分析功能

**任务:**
- [ ] 实现 `analyze-patterns.js` 脚本
- [ ] 实现工具使用模式识别
- [ ] 实现代码风格模式识别
- [ ] 实现模式文档生成
- [ ] 测试模式识别准确性

**交付物:**
- ✅ `scripts/analyze-patterns.js`
- ✅ `~/.codebuddy/homunculus/patterns/` 目录

---

### 阶段 3: 命令集成 (1 周)

**目标:** 实现 CodeBuddy 命令接口

**任务:**
- [ ] 实现 `/learn-status` 命令
- [ ] 实现 `/analyze-learning` 命令
- [ ] 实现 `/export-patterns` 命令
- [ ] 实现 `/import-patterns` 命令
- [ ] 测试命令功能

**交付物:**
- ✅ `commands/learn-status.md`
- ✅ `commands/analyze-learning.md`
- ✅ `commands/export-patterns.md`
- ✅ `commands/import-patterns.md`

---

### 阶段 4: 文档和测试 (1 周)

**目标:** 完善文档和测试

**任务:**
- [ ] 编写使用文档
- [ ] 编写 README
- [ ] 编写测试用例
- [ ] 进行用户测试
- [ ] 修复发现的问题

**交付物:**
- ✅ README.md
- ✅ 使用指南
- ✅ 测试报告

---

### 总计工作量

| 阶段 | 时间 | 优先级 |
|------|------|--------|
| 阶段 1: 数据收集 | 1 周 | 🔴 高 |
| 阶段 2: 模式分析 | 2 周 | 🔴 高 |
| 阶段 3: 命令集成 | 1 周 | 🟡 中 |
| 阶段 4: 文档和测试 | 1 周 | 🟡 中 |
| **总计** | **5 周** | - |

---

## 功能对比

### 原版 v2 vs 简化版

| 功能 | 原版 v2 | 简化版 | 状态 |
|------|---------|---------|------|
| **数据收集** | Hooks 自动 | Hooks 自动 | ✅ 相同 |
| **后台分析** | Agent 自动 (Haiku) | 手动触发 (国产模型) | ⚠️ 改为手动 | ✅ 使用国产模型替代 |
| **置信度评分** | Haiku 0.3-0.9 | 频率统计 + AI 评分 | ⚠️ 简化 | ✅ 国产模型提供评分 |
| **本能存储** | Instinct API | Markdown 文档 | ⚠️ 重构 |
| **模式识别** | 自动聚类 | 统计 + AI 增强 | ⚠️ 改为混合 | ✅ 提高准确率 |
| **命令支持** | /instinct-* | /learn-* | ✅ 实现 |
| **导出/导入** | 支持 | 支持 | ✅ 实现 |
| **演化机制** | 自动演化 | 手动组合 | ⚠️ 改为手动 | ✅ AI 辅助组合 |

### 核心能力保留

✅ **保留的核心能力:**
1. 数据收集 - 100% 可靠
2. 模式识别 - 基于频率统计
3. 文档生成 - Markdown 格式
4. 导出/导入 - 可共享模式
5. 命令接口 - CodeBuddy 集成

⚠️ **简化的能力:**
1. 自动分析 → 手动触发
2. Haiku 评分 → 频率统计
3. Instinct API → 文件系统
4. 自动演化 → 手动组合

❌ **缺失的能力:**
1. 后台 Agent 分析
2. 实时模式识别
3. 置信度评分系统
4. 自动演化机制

---

## 优势与局限

### 优势

| 优势 | 说明 |
|------|------|
| ✅ **完全兼容 CodeBuddy** | 不依赖后台 Agent,仅使用 Command Hook |
| ✅ **保留核心价值** | 数据收集、模式识别、文档生成 |
| ✅ **简单可靠** | 基于文件系统,无复杂依赖 |
| ✅ **用户可控** | 所有分析由用户主动触发 |
| ✅ **易于维护** | 代码量小,逻辑清晰 |
| ✅ **可移植性强** | 纯脚本实现,易于迁移 |
| ✅ **低技术债务** | 无需维护后台系统 |
| ✅ **渐进增强** | 可逐步添加功能 |

### 局限

| 局限 | 影响 | 缓解方案 |
|------|------|---------|
| ❌ **需手动触发** | 失去自动化 | 定期提醒用户执行分析 |
| ❌ **无置信度评分** | 评分精度降低 | 使用频率统计作为替代 |
| ❌ **无实时识别** | 延迟发现模式 | 建议每次会话后分析 |
| ❌ **无自动演化** | 需手动组合 | 提供演化指导文档 |
| ❌ **分析精度较低** | 可能漏掉模式 | 改进算法,增加规则 |

### 使用建议

**最佳实践:**
1. 每天结束时执行 `/analyze-learning`
2. 每周查看 `/learn-status`
3. 定期导出模式备份
4. 手动将相关模式组合为技能
5. 根据模式优化工作流

**不适合的场景:**
- 需要实时模式识别
- 需要高度自动化的分析
- 需要复杂的置信度评分
- 需要自动演化机制

---

## 总结

### 方案可行性

**可行性:** 🟢 **高** (85%) - 使用国产模型后提升

**理由:**
- ✅ 完全兼容 CodeBuddy 能力
- ✅ 保留核心学习价值
- ✅ 使用国产模型,无外部依赖
- ✅ 工作量可控 (5 周)
- ✅ 支持多种国产模型 (GLM/Kimi/DeepSeek/混元)
- ✅ 中英文友好,适合国内用户
- ⚠️ 功能有所简化
- ⚠️ 需用户主动操作

### 推荐决策

**推荐采用:** ⭐⭐⭐⭐⭐ (强烈推荐)

**理由:**
1. 在 CodeBuddy 限制下实现了核心功能
2. 保留了数据收集和模式识别的价值
3. **使用国产模型,完全自主可控**
4. **支持多种国产模型,灵活选择**
5. 工作量可控,风险较低
6. 为未来增强留出空间
7. **适合国内用户,中文友好**

**不采用的理由:**
- 功能简化较多
- 需要用户主动操作
- 不如原版自动化程度高

### 国产模型优势

| 优势 | 说明 |
|------|------|
| ✅ **完全自主** | 不依赖国外模型 API |
| ✅ **成本更低** | 国产模型性价比高 |
| ✅ **延迟更低** | 国内网络访问更快 |
| ✅ **中文友好** | 对中文理解更准确 |
| ✅ **符合合规** | 数据在国内处理 |
| ✅ **多模型可选** | GLM/Kimi/DeepSeek/混元 |

### 长期展望

**未来可能增强:**
1. 集成外部定时任务 (cron/CI/CD) 实现自动分析
2. 改进模式识别算法,提高精度
3. 添加基于规则的置信度估算
4. 实现半自动的模式演化机制
5. 等待 CodeBuddy 支持后台 Agent 后升级
6. **支持更多国产模型** (如通义千问、文心一言等)
7. **实现模型自动切换** - 根据任务类型自动选择最优模型
8. **添加多语言支持** - 更好的中文输出

---

**文档版本:** v1.0  
**最后更新:** 2026-02-18  
**维护者:** ECC 项目组
