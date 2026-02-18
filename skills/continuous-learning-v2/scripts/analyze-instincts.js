#!/usr/bin/env node

/**
 * 使用国产模型分析 Instincts
 * 替代原版 Haiku 后台 Agent
 */

const fs = require('fs');
const path = require('path');
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

  // 配置文件路径
  configFile: path.join(
    os.homedir(),
    '.codebuddy',
    'homunculus',
    'config.json'
  ),

  // 分析配置
  minObservations: 10,
  maxObservations: 50
};

// 确保目录存在
function ensureDirectoryExists(dirpath) {
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
}

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
  const recentObs = observations.slice(-CONFIG.maxObservations).map(obs => {
    return `- Type: ${obs.type}, Tool: ${obs.tool_name || 'N/A'}, Time: ${obs.timestamp}`;
  }).join('\n');

  return `
分析以下 CodeBuddy 会话观察数据，识别用户的 Instincts（本能）模式：

## 观察数据（最近 ${Math.min(observations.length, CONFIG.maxObservations)} 条）
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

// 主函数（简化版，等待后续集成国产模型 API）
function main() {
  console.log('🔍 Instinct Analysis - Domestic Models\n');

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

  console.log('🤖 Analysis prompt prepared.');
  console.log('\n⚠️ Note: Actual model analysis will be implemented after CodeBuddy API integration.');
  console.log('   Current output is the analysis prompt for manual review:\n');
  console.log('---');
  console.log(prompt);
  console.log('---');
  console.log('\n💡 Run /instinct-status to view existing instincts.');
}

// 运行
main().catch(console.error);
