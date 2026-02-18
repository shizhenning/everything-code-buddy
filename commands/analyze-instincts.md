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
