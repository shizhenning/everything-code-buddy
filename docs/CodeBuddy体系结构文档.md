# CodeBuddy CLI 体系结构文档

> **腾讯云代码助手 - CLI 命令行工具技术架构解析**

[![Version](https://img.shields.io/badge/version-1.7.0+-blue)](https://www.codebuddy.cn)
[![Documentation](https://img.shields.io/badge/docs-complete-green)](https://www.codebuddy.cn/docs/cli/overview)
[![License](https://img.shields.io/badge/license-Commercial-orange)](https://www.codebuddy.cn)

---

## 📑 目录

1. [系统概述](#系统概述)
2. [核心架构](#核心架构)
3. [组件详解](#组件详解)
4. [数据流与生命周期](#数据流与生命周期)
5. [扩展机制](#扩展机制)
6. [安全架构](#安全架构)
7. [性能优化](#性能优化)
8. [集成接口](#集成接口)
9. [部署架构](#部署架构)
10. [最佳实践](#最佳实践)
11. [**组件编写指南**](#组件编写指南) ⭐ 新增
    - [Commands 编写指南](#commands-编写指南)
    - [Skills 编写指南](#skills-编写指南)
    - [Agents 编写指南](#agents-编写指南)
    - [Plugins 编写指南](#plugins-编写指南) ⭐ 新增
    - [Hooks 编写指南](#hooks-编写指南)

---

## 系统概述

### 产品定位

CodeBuddy CLI 是腾讯云代码助手的核心**命令行工具**，提供基于自然语言的交互式编程体验，支持交互模式、无头模式（Headless）、斜杠命令、插件扩展等功能。它通过 CLI 接口实现从终端到 AI 的无缝集成。

**国内版本特色**：

- 🌐 **优先支持国产模型**：GLM、Kimi、DeepSeek、腾讯混元等
- 🚀 **低延迟响应**：国内模型访问速度更快
- 🔒 **数据安全合规**：符合国内数据安全要求
- 💰 **成本优势**：国产模型性价比高

**国际版本支持**：

同时支持 Claude、GPT、Gemini 等国际模型，满足全球化开发需求。

### 核心特性

| 特性 | 描述 | 技术实现 |
|------|------|----------|
| 🚀 **交互模式** | 对话式编程，实时交互 | REPL + LLM |
| 📤 **无头模式** | 单次查询，脚本集成 | `-p/--print` 选项 |
| ⚡ **会话管理** | 会话持久化与恢复 | Session ID |
| 🔧 **斜杠命令** | 自定义快捷命令 | `.md` 文件定义 |
| 🛠️ **工具链集成** | 文件、Git、Bash 工具 | 系统工具封装 |
| 🔌 **插件扩展** | Plugin Marketplace | `.codebuddy-plugin` |
| 🔌 **MCP/LSP** | 模型与协议扩展 | MCP/LSP 标准 |

### 技术栈

```
运行环境: Node.js 18.0+
核心语言: TypeScript
AI 引擎: 多模型支持
协议支持: MCP, LSP, ACP
包管理: npm
```

### 支持的 AI 模型

> ⚠️ **注意**：以下模型名称列表来自之前文档，官网 models 页面（https://www.codebuddy.cn/docs/cli/models）主要介绍 models.json 配置方式，未提供具体的内置模型列表。这些模型名称需要进一步验证。

CodeBuddy CLI 支持多种国内外 AI 模型，可根据需求选择：

#### 国内模型（需验证）

| 模型 | 提供商 | 特点 |
|------|--------|------|
| `glm-5.0` | 智谱 AI | 最新一代 GLM 模型，综合能力强 |
| `glm-4.7` | 智谱 AI | GLM-4 系列增强版 |
| `glm-4.6v` | 智谱 AI | 支持视觉多模态 |
| `glm-4.6` | 智谱 AI | GLM-4 基础版本 |
| `kimi-k2.5` | Moonshot AI | Kimi 系列高性能版本 |
| `kimi-k2-Thinking` | Moonshot AI | 思维链推理优化 |
| `deepseek-v3.2` | DeepSeek | DeepSeek V3 最新版本 |
| `deepseek-v3-1-teminus` | DeepSeek | DeepSeek V3 优化版 |
| `deepseek-v3-0324` | DeepSeek | DeepSeek V3 特定版本 |
| `hunyuan-2.0-instruct-20251111` | 腾讯混元 | 混元 2.0 指令微调版 |

#### 国际模型（需验证）

| 模型 | 提供商 | 特点 |
|------|--------|------|
| `claude-3-5-sonnet` | Anthropic | 强推理能力和长上下文 |
| `claude-3-5-haiku` | Anthropic | 快速响应版本 |
| `gpt-4o` | OpenAI | 多功能通用模型 |
| `gpt-4-turbo` | OpenAI | 高性能版本 |
| `gemini-2.5-pro` | Google | 多模态能力强 |

**模型选择示例**:

```bash
# 使用国内模型（模型名称需进一步验证）
codebuddy --model glm-5.0 "分析代码"
codebuddy --model deepseek-v3.2 "生成文档"
codebuddy --model kimi-k2.5 "翻译文本"

# 使用国际模型（模型名称需进一步验证）
codebuddy --model claude-3-5-sonnet "代码审查"
codebuddy --model gpt-4o "问题解答"
```

### 环境变量

> ⚠️ **注意**：以下环境变量基于官网 https://www.codebuddy.cn/docs/cli/settings 验证。

重要环境变量列表（所有变量也可在 `settings.json` 中配置）：

| 变量名 | 描述 | 示例 |
| :--- | :--- | :--- |
| `CODEBUDDY_API_KEY` | **推荐**：API 密钥（用于模型调用） | `export CODEBUDDY_API_KEY="your-key"` |
| `CODEBUDDY_AUTH_TOKEN` | 认证令牌（用于平台完整功能） | `export CODEBUDDY_AUTH_TOKEN="your-token"` |
| `CODEBUDDY_BASE_URL` | 自定义模型服务地址（需兼容 OpenAI 协议） | `export CODEBUDDY_BASE_URL="https://api.example.com"` |
| `CODEBUDDY_INTERNET_ENVIRONMENT` | 网络环境（`internal`：中国版；`iOA`：iOA 账号） | `export CODEBUDDY_INTERNET_ENVIRONMENT=internal` |
| `HTTP_PROXY` / `HTTPS_PROXY` | 设置代理服务器 | `export HTTPS_PROXY="https://proxy.example.com:8080"` |
| `CODEBUDDY_MODEL` | 覆盖默认模型（优先级高于 `settings.json`） | `export CODEBUDDY_MODEL="gpt-4"` |
| `CODEBUDDY_MEMORY_ENABLED` | 启用记忆功能（实验性） | `export CODEBUDDY_MEMORY_ENABLED=1` |

**使用示例（中国版 API KEY）**：
```bash
CODEBUDDY_INTERNET_ENVIRONMENT=internal \
CODEBUDDY_API_KEY="your-api-key" \
codebuddy
```

#### 以下环境变量待验证

以下环境变量在Hook脚本等上下文中使用，但官网settings页面未明确列出：

| 变量 | 用途 | 示例 |
|------|------|------|
| `CODEBUDDY_HOME` | 用户配置目录 | `~/.codebuddy` |
| `CODEBUDDY_PLUGIN_ROOT` | 插件根目录 | `/path/to/plugins` |
| `CODEBUDDY_PROJECT_DIR` | 当前项目目录 | `/current/project` |
| `CODEBUDDY_PACKAGE_MANAGER` | 包管理器 | `npm`, `pnpm`, `yarn` |
| `CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE` | 自动压缩比例 | `50` |
| `E2B_API_KEY` | E2B 沙箱 API 密钥 | `your-api-key` |
| `E2B_TEMPLATE` | E2B 模板 ID | `base-node-v18` |
| `CODEBUDDY_SANDBOX_IMAGE` | 自定义 Docker 镜像 | `ubuntu:22.04` |

---

### 配置文件 (`settings.json`)

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/cli/settings 验证。

CodeBuddy 使用分层配置系统，优先级从高到低为：
1. **命令行参数**（临时覆盖）
2. **本地项目设置** (`.codebuddy/settings.local.json`，不提交至代码仓库)
3. **共享项目设置** (`.codebuddy/settings.json`，团队共享)
4. **用户设置** (`~/.codebuddy/settings.json`，全局生效)

#### 主要配置项（基于官网 settings 验证）

| 配置类别 | 关键配置项 | 描述 | 示例值 |
| :--- | :--- | :--- | :--- |
| **基础设置** | `language` | 设置 AI 响应语言 | `"简体中文"` |
| | `model` | 覆盖默认 AI 模型 | `"gpt-5"` |
| | `cleanupPeriodDays` | 聊天记录本地保留天数 | `30` |
| **权限控制** | `permissions.allow` | **允许**使用的工具规则列表 | `["Bash(npm run lint)"]` |
| | `permissions.ask` | **询问**确认的工具规则列表 | `["Bash(git:*)"]` |
| | `permissions.deny` | **拒绝**使用的工具规则列表 | `["Read(./.env)", "Bash(curl:*)"]` |
| | `permissions.defaultMode` | 启动时的默认权限模式 | `"acceptEdits"` |
| **环境变量** | `env` | 注入到每个会话的环境变量 | `{"NODE_ENV": "dev"}` |
| **功能开关** | `includeCoAuthoredBy` | Git 提交是否包含共同署名 | `false` |
| | `promptSuggestionEnabled` | 是否启用下一步操作建议 | `true` |
| | `memory.enabled` | **实验性**：是否启用记忆功能 | `true` |
| **Bash 沙箱** | `sandbox.enabled` | 是否启用 Bash 命令沙箱 | `true` |
| | `sandbox.excludedCommands` | 在沙箱外运行的命令列表 | `["git", "docker"]` |
| **插件管理** | `enabledPlugins` | 启用或禁用特定插件 | `{"plugin@market": true}` |
| **状态行** | `statusLine` | 配置自定义终端状态行 | `{"type": "command", "command": "~/.script.sh"}` |
| **触发事件** | `hooks` | **配置工具执行前后的触发事件**（见下文详细说明） | `{"PreToolUse": {"Bash": "echo 'start'"}}` |
| **高级控制** | `disableAllHooks` | 禁用所有 `hooks` | `true` |
| | `apiKeyHelper` | 自定义 API Key 生成脚本 | `"/bin/generate_key.sh"` |

#### 权限设置 (`permissions`)

权限分为三类，规则使用前缀匹配：
- `allow`：允许使用的工具/命令（如 `"Bash(npm run lint)"`）
- `ask`：使用时需用户确认（如 `"Bash(git:*)"`）
- `deny`：拒绝访问（如 `"Read(./.env)", "Bash(curl:*)"`）

**示例：保护敏感文件**
```json
{
  "permissions": {
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)"
    ]
  }
}
```

#### hooks 配置（触发事件）

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/cli/settings 验证。

`hooks` 配置允许您在 CodeBuddy Code 使用特定工具**之前**或**之后**自动执行自定义命令（目前主要是 Bash 命令）。

**配置键**：`hooks`
**描述**：配置在工具执行前后运行的自定义命令。

**基础示例**：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Running command...'"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Command finished.'"
          }
        ]
      }
    ]
  }
}
```

**可用的事件类型（Hook Types）**：

CodeBuddy hooks 支持 **9 个完整事件类型**（与 CLI Hooks 文档一致）：

| 事件类型 | 触发时机 | 是否支持 matcher | 说明 |
|----------|----------|------------------|------|
| **PreToolUse** | 工具执行前 | ✅ 是（按工具名称） | 例如 "Bash", "Write|Edit", "*" |
| **PostToolUse** | 工具成功执行后 | ✅ 是（按工具名称） | 例如 "Bash", "*" |
| **PreCompact** | 执行上下文压缩前 | ✅ 是（`manual`/`auto`） | 手动压缩或自动压缩 |
| **SessionStart** | 会话创建或恢复时 | ✅ 是（`startup`/`resume`/`clear`/`compact`） | 会话启动类型 |
| **SessionEnd** | 会话结束时 | ✅ 是（退出原因） | 清理资源、持久化日志 |
| **Stop** | 主代理响应结束时 | ❌ 否 | 要求继续工作、追加提醒 |
| **UserPromptSubmit** | 用户提交消息后（不含内部命令） | ❌ 否 | 内容审查、上下文注入 |
| **SubagentStop** | 子代理（TaskTool）结束时 | ❌ 否 | 子任务后续处理 |
| **Notification** | 发送通知时 | ✅ 是（按通知类型） | 桌面提醒、IM 通知 |

**配置示例说明**：

```json
{
  "hooks": {
    "PreToolUse": [  // 工具使用前触发
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[INFO] Tool is about to be used.'"  // 触发一个 Bash 命令
          }
        ]
      }
    ],
    "PostToolUse": [  // 工具使用后触发
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[INFO] Tool execution completed.'"  // 触发另一个 Bash 命令
          }
        ]
      }
    ]
  }
}
```

**Hook 类型说明**：

| Hook 类型 | 说明 | 适用事件 |
|-----------|------|----------|
| **command** | 执行 Bash 命令 | 所有事件 |
| **prompt** | 使用 LLM 进行基于提示词的评估 | 仅 `Stop`、`UserPromptSubmit`、`PreToolUse` 事件 |

#### 常见场景配置

**团队项目共享配置（`.codebuddy/settings.json`）：**
```json
{
  "model": "gpt-5",
  "permissions": {
    "allow": ["Read", "Edit", "Bash(git:*)", "Bash(npm:*)"],
    "ask": ["WebFetch", "Bash(docker:*)"],
    "deny": ["Bash(rm:*)", "Read(./.env)"]
  }
}
```

**启用 Bash 沙箱（安全增强）：**
```json
{
  "sandbox": {
    "enabled": true,
    "excludedCommands": ["docker", "git"]
  },
  "permissions": {
    "deny": ["Read(~/.aws/**)", "Edit(**/*.env)"]
  }
}
```

#### 配置管理命令

使用 `codebuddy config` 命令快速管理配置：

```bash
# 查看所有配置
codebuddy config list

# 设置模型（项目级）
codebuddy config set model gpt-4

# 设置全局配置
codebuddy config set -g cleanupPeriodDays 30

# 获取特定配置值
codebuddy config get permissions
```

#### 调试与兼容性（基于官网 plugins-reference 验证）

**调试**：
- 使用 `codebuddy --verbose` 查看插件加载日志

**兼容性**：
- 支持Claude Code的 `.claude-plugin/` 目录和 `${CLAUDE_PLUGIN_ROOT}` 变量
- CodeBuddy 优先使用 `.codebuddy-plugin/` 和 `${CODEBUDDY_PLUGIN_ROOT}`

**关键注意事项**：
1. LSP服务器需预装二进制（如 `typescript-language-server`），插件仅配置连接方式
2. Hooks脚本需添加执行权限（`chmod +x script.sh`）
3. 插件版本遵循语义化版本（MAJOR.MINOR.PATCH）

---

### 模型配置文件 (`models.json`)

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/cli/models 验证。

`models.json` 是 CodeBuddy 的模型配置文件，主要用于自定义模型列表和覆盖内置模型配置。

#### 配置文件位置与优先级

| 级别 | 路径 | 说明 |
| :--- | :--- | :--- |
| **项目级** | `<workspace>/.codebuddy/models.json` | 针对特定项目，优先级最高 |
| **用户级** | `~/.codebuddy/models.json` | 全局配置，适用于所有项目 |
| **内置默认** | - | 系统默认配置，优先级最低 |

**注意**：项目级配置会覆盖用户级配置中相同 `id` 的模型定义。`availableModels` 字段是项目级完全覆盖用户级，不进行合并。

#### 配置结构

```json
{
  "models": [
    {
      "id": "model-unique-id",
      "name": "模型显示名称",
      "vendor": "模型供应商",
      "apiKey": "sk-actual-api-key-value",
      "maxInputTokens": 200000,
      "maxOutputTokens": 8192,
      "url": "https://api.example.com/v1/chat/completions",
      "temperature": 0.7,
      "supportsToolCall": true,
      "supportsImages": true,
      "supportsReasoning": false
    }
  ],
  "availableModels": ["model-id-1", "model-id-2"]
}
```

#### `models` 数组字段说明

| 字段 | 类型 | 是否必填 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | string | **是** | 模型的唯一标识符 |
| `name` | string | 否 | 在模型下拉列表中显示的友好名称 |
| `vendor` | string | 否 | 模型供应商（例如：OpenAI, Google） |
| `apiKey` | string | **是** | 调用模型 API 所需的密钥，**强烈建议使用环境变量** `${API_KEY_NAME}` |
| `url` | string | **是** | API 端点的完整路径，必须以 `/chat/completions` 结尾，支持环境变量 |
| `maxInputTokens` | number | 否 | 模型支持的最大输入 Token 数量 |
| `maxOutputTokens` | number | 否 | 模型支持的最大输出 Token 数量 |
| `temperature` | number | 否 | 采样温度，控制输出的随机性（范围 0-2） |
| `supportsToolCall` | boolean | 否 | 是否支持函数/工具调用 |
| `supportsImages` | boolean | 否 | 是否支持图像输入 |
| `supportsReasoning` | boolean | 否 | 是否支持推理模式 |

**重要技术说明**：
- 目前仅支持与 **OpenAI API 格式兼容** 的接口
- `url` 字段必须是完整的接口路径

#### `availableModels` 数组

此字段控制模型下拉列表中显示哪些模型：
- 如果**未配置**或为**空数组**，则显示所有已定义的模型
- 如果**已配置**，则**只显示**在此数组中明确列出的模型 `id`

#### 安全配置（环境变量）

为避免 API 密钥直接暴露，`apiKey` 和 `url` 字段支持使用环境变量引用，语法为 `${环境变量名}`。

**配置示例**：
```json
{
  "models": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o",
      "vendor": "OpenAI",
      "apiKey": "${OPENAI_API_KEY}",
      "url": "https://api.openai.com/v1/chat/completions"
    }
  ]
}
```

**设置环境变量（macOS/Linux）**：
```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export OPENAI_API_KEY="sk-your-actual-api-key"

# 或临时设置
OPENAI_API_KEY="sk-xxx" codebuddy
```

**设置环境变量（Windows PowerShell）**：
```powershell
$env:OPENAI_API_KEY = "sk-your-actual-api-key"
```

#### 常见使用场景

**场景 1：添加本地 Ollama 模型**
```json
{
  "models": [
    {
      "id": "my-local-llama",
      "name": "My Local Llama",
      "vendor": "Ollama",
      "apiKey": "ollama",
      "url": "http://localhost:11434/v1/chat/completions",
      "maxInputTokens": 8192,
      "maxOutputTokens": 2048,
      "supportsToolCall": true
    }
  ]
}
```

**场景 2：覆盖内置模型（使用自定义端点）**
```json
{
  "models": [
    {
      "id": "gpt-4-turbo",
      "name": "GPT-4 Turbo (Custom Endpoint)",
      "vendor": "OpenAI",
      "url": "https://my-proxy.example.com/v1/chat/completions",
      "apiKey": "${MY_OPENAI_PROXY_KEY}"
    }
  ]
}
```

**场景 3：限制下拉列表只显示特定模型**
```json
{
  "availableModels": [
    "gpt-4o",
    "my-local-llama"
  ]
}
```

#### 其他重要特性

- **热重载**：修改并保存 `models.json` 文件后，CodeBuddy 会自动检测（约 1 秒防抖延迟）并重新加载配置，无需重启
- **标签系统**：通过 `models.json` 添加的模型会自动带有 `custom` 标签，便于在界面中识别
- **合并策略**：系统使用智能合并策略，最终生效的配置是项目级和用户级配置合并后的结果

---

### 记忆功能 (Memory)

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/cli/memory 验证。

**记忆功能**使 CodeBuddy 能够跨会话记住您的偏好（如代码风格、常用命令），并通过分层结构管理这些记忆。记忆文件在启动时自动加载到 AI 的上下文中。

#### 记忆类型与位置

记忆分为四种类型，按范围从大到小排列：

| 记忆类型 | 存储位置 | 用途 | 共享范围 |
|----------|----------|------|----------|
| **用户记忆** | `~/.codebuddy/CODEBUDDY.md` | 所有项目的个人偏好（如代码风格、工具快捷方式） | 仅本人 |
| **用户规则** | `~/.codebuddy/rules/*.md` | 模块化的个人规则（如编码习惯、工作流） | 仅本人 |
| **项目记忆** | `./CODEBUDDY.md` 或 `./.codebuddy/CODEBUDDY.md` | 团队共享的项目指令（如架构、编码标准） | 通过 Git 与团队共享 |
| **项目规则** | `./.codebuddy/rules/*.md` | 模块化的项目规则（如语言指南、测试规范） | 通过 Git 与团队共享 |
| **项目记忆（本地）** | `./CODEBUDDY.local.md` | 个人的项目特定偏好（如本地调试配置） | 仅本人，自动加入 .gitignore |

#### 配置方式

**1. 初始化项目记忆**

在项目根目录执行以下命令，引导生成 `CODEBUDDY.md`：

```bash
> /init
```

**2. 编辑记忆文件**

- **手动编辑**：直接创建或修改对应的 `.md` 文件
- **使用命令**：在会话中输入 `/memory`，系统会打开编辑器供您编辑当前已加载的记忆文件

**3. 设置语言偏好**

- **推荐方式**：使用 `/config` 命令，选择 `Language` 并输入偏好语言（如"简体中文"）
- **高级方式**：在记忆文件中添加：
  ```markdown
  ## CodeBuddy Added Memories
  ### 语言偏好
  - 代码注释使用中文
  - 提交信息使用中文
  ```

#### 模块化规则配置

**规则文件结构**

将规则按主题拆分到 `.codebuddy/rules/` 目录下：

```
项目根目录/
├── .codebuddy/
│   ├── CODEBUDDY.md          # 主项目记忆
│   └── rules/
│       ├── code-style.md     # 代码风格规则
│       ├── testing.md        # 测试规范
│       └── security.md       # 安全规则
```

**规则控制字段（YAML Frontmatter）**

在规则文件开头使用以下字段控制加载行为：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | boolean | `true` | 是否加载此规则 |
| `alwaysApply` | boolean | `true` | 是否始终应用 |
| `paths` | string/string[] | - | 触发规则的文件路径（Glob 模式） |

**示例规则文件**：
```markdown
---
alwaysApply: false
paths: src/api/**/*.ts
---

# API 开发规则
- 所有 API 端点必须包含输入验证
- 使用标准错误响应格式
```

#### 记忆加载顺序

1. **用户级**：加载 `~/.codebuddy/CODEBUDDY.md` 和 `~/.codebuddy/rules/` 下的规则
2. **项目级主文件**：从当前目录向上递归加载所有 `CODEBUDDY.md` 和 `CODEBUDDY.local.md`
3. **项目级规则**：仅加载当前工作目录下的 `.codebuddy/rules/` 中的规则
4. **子目录记忆**：当操作子目录文件时，动态加载该子目录的 `CODEBUDDY.md`
5. **本地记忆**：加载 `./CODEBUDDY.local.md`

#### 导入其他文件

在 `CODEBUDDY.md` 中使用 `@path/to/file` 语法导入其他文件：

```markdown
查看 @README.md 了解项目概述。
个人配置：@~/.codebuddy/my-rules.md
```

- 支持相对路径和绝对路径
- 最大导入深度为 5 层
- 使用 `/memory` 命令可查看所有已加载的文件

#### 使用方法

**日常使用**
- 记忆自动加载，无需手动干预
- 在会话中输入 `/memory` 可查看或编辑记忆

**条件规则触发**
- 当使用 `@文件路径` 引用文件，或使用 Read、Edit 等文件操作工具时，匹配的规则会自动注入上下文

**调试与排查**
- 运行 `/memory` 查看已加载的规则
- 手动修改记忆文件后需重启 CodeBuddy 以重新加载缓存

#### 最佳实践

- **内容明确**：如"使用 2 空格缩进"而非"正确格式化代码"
- **结构清晰**：使用 Markdown 标题和列表组织内容
- **定期更新**：随着项目演进更新记忆内容
- **规则模块化**：将大型规范拆分为专注的规则文件

#### 常见问题

**Q1: AGENTS.md 和 CODEBUDDY.md 有什么区别？**

A: CodeBuddy 同时支持两者，但推荐使用 `CODEBUDDY.md`（品牌一致）。系统优先加载 `CODEBUDDY.md`，若不存在则回退到 `AGENTS.md`。

**Q2: 记忆文件如何同步？**

A: 项目记忆通过 Git 同步；用户记忆和本地项目记忆仅存储在本地。

**Q3: 条件规则不触发怎么办？**

A: 检查 `paths` 的 Glob 模式是否正确，并确认文件操作是否匹配。可通过 `/memory` 检查规则是否已加载。

---

### 子代理 (Sub-Agents)

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/cli/sub-agents 验证。

子代理是 CodeBuddy 中的一种专门 AI 代理，可以独立处理特定类型的任务，具有独立的上下文窗口、系统提示和工具权限。

#### 什么是子代理？

- 子代理是预配置的 AI 人格，CodeBuddy 可以将任务委派给它们
- 每个子代理有自己的系统提示、工具集和独立上下文
- 适用于特定任务工作流，避免主对话上下文被污染

#### 主要优势

| 优势 | 说明 |
|------|------|
| **上下文保留** | 子代理在自己的上下文中运行，防止主对话被污染 |
| **专业化知识** | 可针对特定领域进行微调，提高任务成功率 |
| **可重用性** | 可在不同项目中使用，并支持团队共享 |
| **灵活的权限** | 可限制工具访问权限，提高安全性 |

#### 配置方式

**1. 通过 `/agents` 命令创建（推荐）**

运行以下命令进入交互式界面：

```bash
/agents
```

- 选择"创建新代理"
- 选择项目级或用户级子代理
- 使用 AI 生成或手动编写系统提示
- 选择所需工具（或留空继承所有工具）
- 保存配置

**2. 通过文件直接配置**

**项目级子代理（优先级更高）**

位置：`.codebuddy/agents/`

```bash
mkdir -p .codebuddy/agents
cat > .codebuddy/agents/test-runner.md << 'EOF'
---
name: test-runner
description: 主动运行测试并修复失败
tools: Read, Bash, Grep
---

你是一位测试自动化专家...
EOF
```

**用户级子代理**

位置：`~/.codebuddy/agents/`

**3. 通过 CLI 动态配置**

```bash
codebuddy --agents '{
  "code-reviewer": {
    "description": "代码审查专家",
    "prompt": "你是一位高级代码审查员...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "gemini-3.0-flash"
  }
}'
```

**文件格式说明**

```markdown
---
name: your-agent-name
description: 子代理描述
tools: tool1, tool2  # 可选，留空继承所有工具
model: gpt-5.1-codex  # 可选，或 inherit
permissionMode: default  # 权限模式
skills: skill1, skill2  # 可选技能
---

系统提示内容...
```

#### 使用方法

**1. 自动委派**

CodeBuddy 会根据任务描述自动选择适合的子代理。

**提示**：在 `description` 中加入"主动使用"等词汇可提高调用频率。

**2. 显式调用**

在对话中直接指定子代理：

```
> 使用 code-reviewer 子代理检查我最近的更改
> 让 debugger 子代理调查这个错误
```

**3. 内置子代理**

CodeBuddy 内置了以下子代理：

- **General-Purpose**：复杂多步骤任务，可读写文件
- **Plan**：计划模式中使用，用于代码库研究
- **Explore**：快速只读搜索，专用于代码探索

**4. 高级用法**

**链接子代理**

```
> 先用 code-analyzer 找到问题，再用 optimizer 修复
```

**可恢复的子代理**

- 每个子代理执行都有唯一的 `agentId`
- 可通过 `resume` 参数恢复之前的对话上下文

```
> 恢复代理 abc123 继续分析
```

**后台代理**

使用 `run_in_background: true` 在后台运行子代理，不阻塞主对话：

```
> 在后台运行 code-analyzer 审查代码库
```

使用 `TaskOutput` 工具查询后台任务状态。

#### 最佳实践

1. **从 AI 生成开始**：使用 AI 生成初始配置，再手动优化
2. **专注单一职责**：每个子代理应专注于特定任务类型
3. **详细提示词**：提供具体说明、示例和约束条件
4. **限制工具权限**：仅授予必要的工具访问权限
5. **版本控制**：将项目子代理纳入版本管理，便于团队协作

---

### 代理团队 (Agent Teams)

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/cli/agent-teams 验证。
>
> ⚠️ **实验性功能**：默认关闭，需手动启用。存在已知限制。

**Agent Teams** 允许你协调多个 CodeBuddy 实例（即"智能体"或"代理"）组成团队协作。

- **团队领导 (Team Lead)**：主会话，负责协调、分配任务、汇总成果
- **团队成员 (Teammates)**：独立工作的 CodeBuddy 实例，拥有各自的上下文窗口，可通过消息系统直接通信
- **核心机制**：共享任务列表、成员间消息通信、集中式管理

#### 何时使用 Agent Teams？

适用于**并行探索能创造价值**的任务，例如：

- **研究评审**：多成员从不同角度调研同一问题，共享并质疑发现
- **新模块开发**：各成员独立负责不同模块
- **竞争性假设调试**：并行测试不同假设，快速收敛正确答案
- **跨层协调**：前端、后端、测试由不同成员同步推进

#### 与子代理 (Sub-agents) 对比

| 特性 | 子代理 | Agent Teams |
|------|--------|-------------|
| 上下文 | 独立上下文，结果返回主代理 | 完全独立的上下文窗口 |
| 通信 | 仅向主代理报告 | 成员间可直接发送消息 |
| 协调 | 主代理管理所有工作 | 共享任务列表，成员自主认领 |
| 适用场景 | 聚焦型任务，只关心结果 | 需要讨论协作的复杂工作 |
| Token 消耗 | 较低 | 较高（每个成员独立实例） |

#### 启用 Agent Teams

**方式一：通过 `/config` 开关（推荐）**

在交互会话中输入 `/config`，找到 `[Experimental] Agent Teams` 选项，按回车切换为 `true`。

**方式二：通过环境变量**

```bash
export CODEBUDDY_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

或在 `settings.json` 中设置：

```json
{
  "env": {
    "CODEBUDDY_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

或直接使用配置项：

```json
{
  "agentTeam": {
    "enabled": true
  }
}
```

#### 使用指南

**1. 创建团队**

用自然语言描述团队需求，例如：

```
我正在设计一个帮助开发者追踪代码中 TODO 注释的 CLI 工具。
创建一个团队从不同角度探索这个问题：一个负责用户体验设计，
一个负责技术架构，一个扮演"挑刺者"的角色提出质疑。
```

CodeBuddy 会自动创建团队、生成成员、分配任务。

**2. 与团队交互**

- **直接与成员对话**：输入 `@成员名` 后按 Tab 补全，支持模糊搜索
- **广播消息**：输入 `@all` 向所有成员发送消息
- **实时状态栏**：显示各成员状态（● 工作中、✓ 已完成、✗ 失败）及 Token 消耗

**3. 控制团队**

- **指定成员和模型**：明确要求生成特定数量或使用特定模型的成员
- **计划审批模式**：要求成员在实施前提交计划，等待领导审批
- **委派模式**：按 `Shift+Tab` 限制领导仅使用协调工具（不直接修改代码）
- **任务管理**：按 `Ctrl+T` 查看任务列表；任务支持依赖关系
- **关闭成员**：通过领导发送关闭请求，成员优雅退出
- **清理团队**：工作完成后，通知领导清理团队资源（需先关闭所有成员）

#### 工作原理

**团队架构**

- **领导 (Team Lead)**：主会话，创建团队、生成成员、协调工作
- **成员 (Teammates)**：独立的 CodeBuddy Code 实例
- **任务列表 (Task List)**：共享的工作列表，支持状态追踪
- **消息系统 (Mailbox)**：成员间通信机制

**执行模式**

- 成员以进程内方式运行在主终端中，共享同一终端窗口
- 每个成员拥有独立上下文窗口，加载项目上下文（CODEBUDDY.md、MCP 服务器等）

**数据存储**

- 团队配置：`~/.codebuddy/teams/{team-name}/config.json`
- 成员信箱：`~/.codebuddy/teams/{team-name}/inboxes/{member}.json`
- 任务列表：`~/.codebuddy/tasks/{team-name}/`

#### 最佳实践

1. **提供充分上下文**：成员不继承领导对话历史，需在初始 Prompt 中明确任务细节
2. **合理划分任务粒度**：避免任务过小（协调开销大）或过大（返工风险高）
3. **避免文件冲突**：确保各成员负责不同文件集合
4. **定期检查进度**：及时纠正方向偏差，汇总阶段性成果
5. **使用委派模式**：当希望领导专注协调而非直接编码时

#### 故障排除

- **成员未出现**：检查团队状态栏；确认任务复杂度需要团队协作
- **权限请求过多**：预先在权限设置中批准常见操作
- **成员遇错停止**：直接通过 `@成员名` 发送指令，或让领导生成替代成员
- **领导过早结束**：要求领导继续等待，或切换至委派模式

#### 已知限制

- **无会话恢复**：`/resume` 和 `/rewind` 不恢复成员
- **任务状态可能滞后**：需手动检查并更新任务状态
- **关闭较慢**：成员会完成当前请求后再关闭
- **每个会话只能管理一个团队**：需清理当前团队后才能创建新团队
- **不支持嵌套团队**：成员不能创建子团队
- **领导角色固定**：不能转让领导权
- **权限在生成时确定**：所有成员继承领导的权限模式

---

### 技能系统 (Skills)

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/cli/skills 验证。

Skills 是 CodeBuddy 的扩展能力系统，允许用户创建专业的领域知识和工作流模板，使 AI 助手能够更专业地处理特定任务。

#### 什么是 Skills？

- **封装专业知识**：将特定领域的最佳实践和操作流程封装成可复用的技能
- **提供工作流模板**：定义标准化的任务处理流程，提高效率
- **扩展 AI 能力**：让 AI 处理更专业、复杂的任务
- **团队协作共享**：项目级 Skills 可在团队成员间共享

#### Skills 与 Slash Commands 的区别

| 特性 | Skills | Slash Commands |
|------|--------|----------------|
| **触发方式** | AI 自动识别并调用 | 用户手动输入命令 |
| **使用场景** | 专业领域任务处理 | 快捷操作和工作流 |
| **权限控制** | 支持工具白名单限制 | 无特殊权限控制 |
| **工作目录** | 支持自定义基础目录 | 使用当前工作目录 |
| **可见性** | 对用户透明，AI 自动决策 | 用户主动发起 |

**简单总结**：
- **Slash Commands**：用户主动调用的快捷方式
- **Skills**：AI 根据任务需求自动选择的专业能力

#### 创建 Skills

**1. 目录结构**

Skills 通过特定目录中的 `SKILL.md` 文件定义：

- **项目级 Skills**：`.codebuddy/skills/`（项目根目录下）
- **用户级 Skills**：`~/.codebuddy/skills/`（用户主目录下）

每个 Skill 独立一个目录，包含 `SKILL.md` 文件，例如：

```
.codebuddy/skills/
├── pdf/
│   └── SKILL.md
├── data-analysis/
│   └── SKILL.md
└── code-review/
    └── SKILL.md
```

**2. SKILL.md 文件格式**

使用 Markdown 格式，支持 YAML Frontmatter 定义元数据。

**示例**：
```markdown
---
name: pdf
description: PDF 文档处理专家
allowed-tools: Read, Write, Bash, WebFetch
---

你是一个 PDF 文档处理专家，擅长：
- 解析和提取 PDF 内容
- 转换 PDF 为其他格式
- 生成 PDF 报告

当用户需要处理 PDF 相关任务时，请使用以下工作流：
1. 首先检查 PDF 文件是否存在
2. 使用适当的工具提取内容
3. 根据需求进行处理
4. 生成结果报告

可用工具：
- pdftotext：提取文本内容
- pdfinfo：获取 PDF 信息
```

**3. Frontmatter 字段说明**

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `name` | 否 | Skill 名称（未指定时使用目录名） | `pdf` |
| `description` | 否 | Skill 描述，帮助 AI 理解何时使用 | `PDF 文档处理专家（project）` |
| `allowed-tools` | 否 | 允许使用的工具白名单（逗号分隔） | `Read, Write, Bash` |
| `disable-model-invocation` | 否 | 设为 `true` 时，Skill 不自动触发，只能通过 `/skill-name` 手动触发 | `true` |
| `user-invocable` | 否 | 设为 `false` 时，Skill 从 `/` 菜单隐藏，仅供 AI 内部调用（默认 `true`） | `false` |
| `context` | 否 | 设为 `fork` 时，Skill 在独立的 subagent 上下文中执行 | `fork` |
| `agent` | 否 | 指定 subagent 类型（仅在 `context: fork` 时有效） | `Explore` |

**4. Context Fork（上下文隔离）**

使用 `context: fork` 使 Skill 在隔离的子代理上下文中运行，不访问对话历史。

**示例**：
```yaml
---
name: deep-research
description: 深入研究某个主题
context: fork
agent: Explore
---

研究 $ARGUMENTS：
1. 使用 Glob 和 Grep 查找相关文件
2. 读取并分析代码
3. 总结发现并附加具体文件引用
```

**可用 Agent 类型**：
- `general-purpose`：通用（默认）
- `Explore`：只读工具，优化代码库探索
- `Plan`：规划和分析
- 自定义：在 `.codebuddy/agents/` 中定义的 agent

**5. 隐藏 Skill（user-invocable）**

设为 `user-invocable: false` 时，Skill 从 `/` 菜单隐藏，适用于背景知识类 Skill 或仅供其他 Skill 引用的辅助 Skill。

**示例**：
```yaml
---
name: project-guidelines
description: 项目编码规范和最佳实践
user-invocable: false
---

# 项目编码规范
本项目遵循以下编码标准：
- 使用 TypeScript 严格模式
- 函数命名使用 camelCase
- 组件命名使用 PascalCase
...
```

#### 使用示例

**示例 1：PDF 处理 Skill**

**文件路径**：`.codebuddy/skills/pdf/SKILL.md`

**内容**：
```markdown
---
name: pdf
description: PDF 文档处理和转换专家
allowed-tools: Read, Write, Bash, WebFetch
---

# PDF 处理专家
你是一个专业的 PDF 文档处理专家。

## 核心能力
- 提取 PDF 文本内容
- 转换 PDF 为 Markdown、HTML 等格式
- 合并和拆分 PDF 文件
- 提取 PDF 元数据和书签
...
```

**使用**：当用户询问"帮我提取这个 PDF 的内容"时，AI 自动识别并调用该 Skill。

**示例 2：数据分析 Skill**

**文件路径**：`~/.codebuddy/skills/data-analysis/SKILL.md`

**内容**：
```markdown
---
name: data-analysis
description: 数据分析和可视化专家
allowed-tools: Read, Write, Bash, WebFetch, NotebookEdit
---

# 数据分析专家
你是一个专业的数据分析师，擅长使用 Python 和相关工具进行数据分析。
...
```

**示例 3：代码审查 Skill**

**文件路径**：`.codebuddy/skills/code-review/SKILL.md`

**内容**：
```markdown
---
name: code-review
description: 代码审查和质量检查专家
allowed-tools: Read, Grep, Bash, Edit
---

# 代码审查专家
你是一个经验丰富的代码审查者，遵循业界最佳实践。
...
```

#### AI 如何选择 Skills？

AI 根据以下因素决定是否调用 Skill：

1. **任务匹配度**：任务描述与 Skill description 的相关性
2. **工具需求**：任务所需工具是否在 allowed-tools 范围内
3. **上下文相关性**：当前对话上下文是否适合使用该 Skill
4. **Skill 来源**：项目级 Skills 优先于用户级 Skills

#### 权限控制

**1. allowed-tools 白名单**

通过 `allowed-tools` 字段限制 Skill 可使用的工具，支持模式匹配：

- `Bash(git:*)`：只允许 git 相关命令
- `Edit(src/**/*.ts)`：只允许编辑特定路径文件

**2. 工作目录限制**

每个 Skill 有独立的 `baseDirectory`（SKILL.md 所在目录），可在指令中引用：

```markdown
当处理文件时，优先在 {baseDirectory} 目录下查找相关资源。
```

#### 最佳实践

1. **清晰的 Skill 描述**：避免模糊，明确说明功能
2. **详细的指令内容**：包括核心能力、工作流程、工具列表、输出格式
3. **合理的工具权限**：仅授予必要权限，避免过度授权
4. **组织 Skill 目录**：按功能领域分类存放

#### 调试 Skills

- **查看已加载的 Skills**：使用 `/skills` 命令查看当前加载的所有 Skills（包括用户级、项目级、插件级）
- **常见问题**：
  - **Skill 未被触发**：检查 description 是否清晰、任务是否匹配、工具权限是否足够
  - **权限不足**：确认 allowed-tools 配置正确
  - **冲突解决**：项目级 Skills 优先级高于用户级

#### 与其他功能配合

- **Skills + Memory**：Skills 可访问 Memory 系统中存储的信息
- **Skills + Slash Commands**：Slash Commands 可引用 Skills
- **Skills + MCP**：Skills 可调用 MCP 提供的外部工具（若在 allowed-tools 中）

---

## CLI 命令参考

### 交互模式 vs 无头模式

#### 交互模式

进入交互式编程会话：

```bash
# 启动交互模式
codebuddy

# 带初始提示启动
codebuddy "分析这个项目"

# 指定模型启动（国内模型）
codebuddy --model glm-5.0

# 指定模型启动（国际模型）
codebuddy --model claude-3-5-sonnet
```

#### 无头模式 (Headless Mode)

单次查询并退出，适合脚本和管道集成：

```bash
# 基本无头模式
codebuddy -p "解释这个函数"

# 管道输入
cat file.txt | codebuddy -p "分析日志"

# JSON 输出
codebuddy -p "提取所有函数名" --output-format json

# Stream-JSON 输出（实时流式）
codebuddy -p "构建项目" --output-format stream-json

# 需要工具授权的操作（必须添加 -y 或 --dangerously-skip-permissions）
codebuddy -p "修改这个文件" -y
codebuddy -p "运行测试命令" --dangerously-skip-permissions
```

### 顶级命令

| 命令 | 说明 |
|------|------|
| `codebuddy` / `cbc` | 启动交互模式（cbc 为缩写） |
| `codebuddy -p/--print` | 无头模式 |
| `codebuddy -c/--continue` | 继续最近会话 |
| `codebuddy -r/--resume <id>` | 恢复指定会话 |
| `codebuddy update` | 更新 CLI |
| `codebuddy mcp` | 配置 MCP（详细子命令参考官网文档） |
| `codebuddy config` | 管理配置（支持：list, get, set） |

### 全局选项

| 选项 | 说明 |
|------|------|
| `-p, --print` | 打印响应后退出，不进入交互模式 |
| `-c, --continue` | 加载当前目录中最近的对话 |
| `-r, --resume <id>` | 通过 ID 恢复特定会话，或在交互模式下选择 |
| `--continue` | 继续最近对话 |
| `--resume` | 恢复会话 |
| `--output-format` | 指定打印模式的输出格式（选项：`text`, `json`, `stream-json`）|
| `--input-format` | 指定打印模式的输入格式（选项：`text`, `stream-json`）|
| `--json-schema` | 使用 JSON Schema 验证结构化输出 |
| `--permission-mode` | 以指定的权限模式开始 |
| `--permission-prompt-tool` | 指定在非交互模式下处理权限提示的 MCP 工具 |
| `--allowedTools` | 无需提示用户即可允许的工具列表（除 settings.json 外）|
| `--disallowedTools` | 应禁止使用的工具列表（除 settings.json 外）|
| `--tools` | 限制可用的内置工具集（白名单） |
| `--settings` | 从 JSON 文件或 JSON 字符串加载额外的设置配置 |
| `--setting-sources` | 指定要加载的设置源（逗号分隔） |
| `--system-prompt` | 用自定义文本替换整个系统提示词 |
| `--system-prompt-file` | 从文件加载系统提示词，替换默认提示词（仅打印模式）|
| `--append-system-prompt` | 在默认系统提示词末尾追加自定义文本 |
| `--sandbox` | 在沙箱中运行 CodeBuddy（Beta） |
| `--model` | 使用别名设置当前会话的模型 |
| `--text-to-image-model` | 设置文生图功能使用的模型 ID |
| `--image-to-image-model` | 设置图生图功能使用的模型 ID |
| `--max-turns` | 限制非交互模式下的代理轮次数 |
| `--include-partial-messages` | 在输出中包含部分流式事件（需 `--print` 和 `--output-format=stream-json`）|
| `--verbose` | 启用详细日志记录，显示完整的轮次输出 |
| `--debug` | 启用调试模式，支持可选的类别过滤 |
| `-y, --dangerously-skip-permissions` | 跳过权限提示（谨慎使用） |
| `--ide` | 启动时自动连接到 IDE（如果可用） |

### 会话管理

```bash
# 恢复特定会话
codebuddy -r <session-id>

# 继续最近对话
codebuddy -c

# 通过 ID 恢复会话并提问
codebuddy -r <session-id> "查询"
```

### 自定义 Sub-Agents

动态定义代理进行特定任务：

```bash
# JSON 格式定义
codebuddy --agents '[
  {
    "name": "CodeReviewer",
    "description": "代码审查专家",
    "model": "glm-5.0",
    "tools": ["Read", "Write", "Bash"]
  }
]'

# 或使用国际模型
codebuddy --agents '[
  {
    "name": "CodeReviewer",
    "description": "代码审查专家",
    "model": "claude-3-5-sonnet",
    "tools": ["Read", "Write", "Bash"]
  }
]'
```

### Sandbox 模式（Beta）

在隔离环境中执行代码：

```bash
# 本地 Docker/Podman 沙箱
codebuddy --sandbox "分析这个项目"

# E2B 云沙箱
codebuddy --sandbox https://api.e2b.dev "创建应用"

# 上传当前工作目录到沙箱（仅 E2B）
codebuddy --sandbox --sandbox-upload-dir "在沙箱中分析项目"

# 强制新建沙箱
codebuddy --sandbox --sandbox-new "从头开始"

# 连接到指定沙箱
codebuddy --sandbox --sandbox-id sb_abc123 "继续工作"

# 退出时终止沙箱
codebuddy --sandbox --sandbox-kill "临时测试"

# Teleport 模式：连接到远程创建的沙箱
codebuddy --teleport session_abc123XYZ4567890 "连接到远程沙箱"
```

---

## 核心架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         CodeBuddy 体系架构                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      用户交互层                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  CLI Interface  │  IDE Integration  │  Web Interface    │  │
│  │  (终端)         │  (VS Code/JetBrains)│  (浏览器)       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      命令处理层                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Slash Commands  │  Task Manager  │  Permission System  │  │
│  │  (/help, /clear) │  (Todo/Agents) │  (授权控制)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      核心引擎层                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ LLM Engine  │  │ Context     │  │ Memory      │      │  │
│  │  │ (多模型)    │  │ Management  │  │ System      │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │ Tool Router │  │ Hook System │  │ Skill Loader│      │  │
│  │  │ (工具路由)  │  │ (事件钩子)  │  │ (技能加载)  │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      工具执行层                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Bash    │ │  Read    │ │  Write   │ │  Edit    │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Grep    │ │  Glob    │ │  Git     │ │  Web     │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      扩展插件层                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │  Plugins │ │   MCP    │ │   LSP    │ │   ACP    │    │  │
│  │  │  (插件)  │ │ (协议)   │ │ (语言)   │ │ (代理)   │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │ Skills   │ │ Commands │ │  Agents  │ │  Hooks   │    │  │
│  │  │ (技能)   │ │ (命令)   │ │ (代理)   │ │ (钩子)   │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      数据持久层                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Session Storage │  Memory DB  │  Config Files │  Cache  │  │
│  │  (会话存储)      │  (记忆库)   │  (配置文件)   │ (缓存)  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 架构层次说明

| 层次 | 职责 | 关键组件 |
|------|------|----------|
| **用户交互层** | 接收用户输入，展示输出 | CLI、IDE 插件、Web UI |
| **命令处理层** | 解析命令，管理任务 | Slash Commands、Task Manager |
| **核心引擎层** | LLM 推理，工具调用 | LLM Engine、Context、Memory |
| **工具执行层** | 执行具体工具操作 | Bash、Read、Write、Edit 等 |
| **扩展插件层** | 提供扩展能力 | Plugins、MCP、LSP、Skills |
| **数据持久层** | 数据存储和管理 | Session、Memory、Config、Cache |

---

## 组件详解

### 1. 用户交互层

#### 1.1 CLI Interface (命令行接口)

**核心功能**:
- 交互式 REPL (Read-Eval-Print Loop)
- 命令历史和自动补全
- 富文本输出 (颜色、格式)
- 快捷键绑定

**技术实现**:
```typescript
// CLI 启动入口
class CLIInterface {
  private repl: REPLServer;
  private history: CommandHistory;
  private renderer: OutputRenderer;
  
  async start() {
    // 初始化 REPL
    this.repl = createREPL({
      prompt: '> ',
      eval: this.handleInput.bind(this),
    });
    
    // 绑定快捷键
    this.bindKeyboardShortcuts();
    
    // 加载历史
    await this.history.load();
  }
  
  async handleInput(input: string) {
    // 解析命令
    const command = this.parseCommand(input);
    
    // 执行命令
    const result = await this.executor.execute(command);
    
    // 渲染输出
    this.renderer.render(result);
  }
}
```

**支持的操作**:
- 普通对话: `帮我优化这个函数`
- 斜杠命令: `/help`, `/clear`, `/model`
- 管道输入: `cat file.txt | codebuddy "分析这个文件"`
- 脚本模式: `codebuddy --headless "执行任务"`

#### 1.2 IDE Integration (IDE 集成)

CodeBuddy CLI 可以通过 `--ide` 选项自动检测并连接到当前 IDE。

**支持的 IDE**:
- VS Code (需要插件)
- JetBrains 系列 (IntelliJ, PyCharm, WebStorm)
- Cursor (需要插件)

**使用方式**:

```bash
# 自动检测 IDE
codebuddy --ide

# 与 IDE 集成使用
codebuddy --ide "审查当前文件"
```

⚠️ **注意**: CodeBuddy CLI 本身是独立工具，IDE 集成通过外部插件实现，不是插件架构。

### 2. 命令处理层

#### 2.1 Slash Commands (斜杠命令系统)

**内置命令分类**:

| 类别 | 命令示例 | 功能 |
|------|---------|------|
| **会话管理** | `/clear`, `/resume`, `/rewind` | 管理对话会话 |
| **配置管理** | `/config`, `/model`, `/permissions` | 配置系统 |
| **工具管理** | `/plugin`, `/skills`, `/mcp` | 管理扩展 |
| **状态查询** | `/status`, `/cost`, `/context` | 查看状态 |
| **开发工具** | `/agents`, `/todos`, `/bashes` | 开发辅助 |

**命令解析流程**:
```typescript
class CommandParser {
  parse(input: string): Command | UserPrompt {
    // 1. 检查是否为斜杠命令
    if (input.startsWith('/')) {
      const [name, ...args] = input.slice(1).split(' ');
      return this.parseSlashCommand(name, args);
    }
    
    // 2. 检查是否为自定义命令 (插件/项目级)
    const customCommand = this.findCustomCommand(input);
    if (customCommand) {
      return this.parseCustomCommand(customCommand, input);
    }
    
    // 3. 否则作为普通用户提示
    return new UserPrompt(input);
  }
  
  parseSlashCommand(name: string, args: string[]): SlashCommand {
    // 查找命令定义
    const definition = this.registry.get(name);
    
    // 验证参数
    this.validateArguments(definition, args);
    
    // 创建命令对象
    return new SlashCommand(name, args, definition);
  }
}
```

**斜杠命令定义方式**:

斜杠命令通过 **Markdown 文件** 定义，文件路径决定命令名称。

**目录结构**:
```
your-project/
└── .codebuddy/
    └── commands/
        ├── frontend/
        │   ├── build.md      → /frontend:build
        │   ├── test.md       → /frontend:test
        │   └── lint.md       → /frontend:lint
        ├── backend/
        │   ├── migrate.md    → /backend:migrate
        │   └── deploy.md    → /backend:deploy
        └── git/
            ├── commit.md     → /git:commit
            └── review.md     → /git:review
```

**命令文件格式**:

**commands/frontend/build.md**:
```markdown
---
description: 构建前端应用
argument-hint: 请输入构建环境，如 development
allowed-tools: Read, Write, Bash
model: inherit
---

你是一个前端构建助手，负责 {env} 环境的构建任务。

构建步骤：
1. 读取 package.json 确认依赖
2. 运行构建命令
3. 验证输出

! npm run build:{env}
```

**命令优先级**:
1. 项目级命令 (`.codebuddy/commands/`)
2. 个人级命令 (`~/.codebuddy/commands/`)
3. 插件命令

**Frontmatter 字段说明**:
| 字段 | 说明 | 必需 |
|------|------|------|
| `description` | 命令描述 | 是 |
| `argument-hint` | 参数提示 | 否 |
| `allowed-tools` | 允许的工具列表 | 否 |
| `model` | 模型选择 | 否 |
| `context` | 上下文类型 | 否 |

#### 2.2 Task Manager (任务管理器)

**任务类型**:
```typescript
enum TaskType {
  UserPrompt = 'user-prompt',      // 用户提示
  SlashCommand = 'slash-command',  // 斜杠命令
  ToolCall = 'tool-call',          // 工具调用
  SubAgent = 'sub-agent',          // 子代理任务
  BackgroundTask = 'background',   // 后台任务
}

interface Task {
  id: string;
  type: TaskType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  payload: any;
  result?: any;
  error?: Error;
}
```

**任务调度**:
```typescript
class TaskScheduler {
  private queue: PriorityQueue<Task>;
  private running: Map<string, Task>;
  
  async schedule(task: Task) {
    // 添加到队列
    this.queue.enqueue(task);
    
    // 触发调度
    await this.dispatch();
  }
  
  async dispatch() {
    // 检查并发限制
    if (this.running.size >= this.maxConcurrency) {
      return;
    }
    
    // 取出最高优先级任务
    const task = this.queue.dequeue();
    if (!task) return;
    
    // 执行任务
    this.running.set(task.id, task);
    
    try {
      task.status = 'running';
      task.result = await this.execute(task);
      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.error = error;
    } finally {
      this.running.delete(task.id);
      await this.dispatch(); // 继续调度
    }
  }
}
```

#### 2.3 Permission System (权限系统)

**权限模型**:
```typescript
enum PermissionLevel {
  Allow = 'allow',           // 始终允许
  Deny = 'deny',            // 始终拒绝
  Ask = 'ask',              // 每次询问
  AcceptEdits = 'accept',   // 自动接受编辑
  BypassPermissions = 'bypass', // 绕过所有权限检查
}

interface PermissionRule {
  tool: string;              // 工具名称 (支持通配符)
  pattern?: string;          // 参数模式 (正则)
  level: PermissionLevel;
  scope?: 'user' | 'project'; // 作用域
}
```

**权限检查流程**:
```typescript
class PermissionManager {
  async checkPermission(tool: string, input: any): Promise<boolean> {
    // 1. 查找匹配的规则
    const rule = this.findMatchingRule(tool, input);
    
    // 2. 根据规则决定
    switch (rule.level) {
      case PermissionLevel.Allow:
        return true;
      
      case PermissionLevel.Deny:
        return false;
      
      case PermissionLevel.Ask:
        // 询问用户
        return await this.askUser(tool, input);
      
      case PermissionLevel.AcceptEdits:
        // 编辑类工具自动允许
        return tool === 'Edit' || tool === 'Write';
      
      case PermissionLevel.BypassPermissions:
        return true;
    }
  }
  
  async askUser(tool: string, input: any): Promise<boolean> {
    // 显示确认对话框
    const message = this.formatPermissionRequest(tool, input);
    const response = await this.ui.confirm(message, {
      options: ['Allow', 'Deny', 'Always Allow', 'Always Deny']
    });
    
    // 根据用户选择更新规则
    if (response.includes('Always')) {
      this.updateRule(tool, response.includes('Allow') 
        ? PermissionLevel.Allow 
        : PermissionLevel.Deny
      );
    }
    
    return response.includes('Allow');
  }
}
```

### 3. 核心引擎层

#### 3.1 LLM Engine (语言模型引擎)

**多模型支持**:
```typescript
interface ModelConfig {
  provider: 'anthropic' | 'openai' | 'google' | 'custom';
  model: string;
  apiKey: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}

class LLMEngine {
  private providers: Map<string, ModelProvider>;
  private currentModel: ModelConfig;
  
  async complete(messages: Message[]): Promise<LLMResponse> {
    // 1. 选择提供商
    const provider = this.providers.get(this.currentModel.provider);
    
    // 2. 构建请求
    const request = this.buildRequest(messages);
    
    // 3. 调用 API
    const response = await provider.complete(request);
    
    // 4. 解析响应
    return this.parseResponse(response);
  }
  
  async streamComplete(
    messages: Message[], 
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    const provider = this.providers.get(this.currentModel.provider);
    
    // 流式响应
    for await (const chunk of provider.streamComplete(messages)) {
      onChunk(chunk.content);
    }
  }
}
```

**模型切换**:
```typescript
class ModelSwitcher {
  private modelAliases = {
    'gpt-5-codex': {
      provider: 'openai',
      model: 'gpt-4-turbo-2024-04-09',
    },
    'gemini-3.0-flash': {
      provider: 'google',
      model: 'gemini-1.5-flash-latest',
    },
    'gemini-3.0-pro': {
      provider: 'google',
      model: 'gemini-1.5-pro-latest',
    },
  };
  
  switchModel(alias: string) {
    const config = this.modelAliases[alias];
    this.engine.setModel(config);
  }
}
```

#### 3.2 Context Management (上下文管理)

**上下文结构**:
```typescript
interface Context {
  messages: Message[];        // 对话历史
  tools: ToolDefinition[];    // 可用工具
  skills: Skill[];           // 加载的技能
  memory: MemoryEntry[];     // 记忆条目
  files: FileContext[];      // 文件上下文
  projectInfo: ProjectInfo;  // 项目信息
}

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}
```

**上下文压缩**:
```typescript
class ContextCompactor {
  async compact(context: Context): Promise<Context> {
    // 1. 计算当前 token 使用
    const currentTokens = this.estimateTokens(context);
    
    // 2. 如果超过限制,执行压缩
    if (currentTokens > this.maxContextTokens) {
      // 保留最近的消息
      const recentMessages = context.messages.slice(-this.minMessages);
      
      // 压缩早期消息
      const compactedHistory = await this.summarizeHistory(
        context.messages.slice(0, -this.minMessages)
      );
      
      // 合并
      context.messages = [
        ...compactedHistory,
        ...recentMessages
      ];
    }
    
    return context;
  }
  
  async summarizeHistory(messages: Message[]): Promise<Message[]> {
    // 使用 LLM 总结历史对话
    const summary = await this.llm.complete([
      {
        role: 'system',
        content: '请总结以下对话历史,保留关键信息:'
      },
      ...messages
    ]);
    
    return [{
      role: 'system',
      content: `历史对话摘要:\n${summary.content}`
    }];
  }
}
```

**上下文窗口滑动**:
```
┌─────────────────────────────────────────────────┐
│           Context Window (200K tokens)          │
├─────────────────────────────────────────────────┤
│                                                  │
│  [System Prompt] ─────────────────────── 5K     │
│                                                  │
│  [Skills + Tools] ───────────────────── 10K     │
│                                                  │
│  ┌──────────────────────────────────┐           │
│  │   Sliding History Window         │  100K     │
│  │   ┌────────────────────────┐     │           │
│  │   │ Old (Summarized)       │ 20K │           │
│  │   └────────────────────────┘     │           │
│  │   ┌────────────────────────┐     │           │
│  │   │ Recent (Full Detail)   │ 80K │           │
│  │   └────────────────────────┘     │           │
│  └──────────────────────────────────┘           │
│                                                  │
│  [Current Task Context] ──────────── 50K        │
│                                                  │
│  [File Contents] ────────────────── 35K         │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### 3.3 Memory System (记忆系统)

**记忆类型**:
```typescript
enum MemoryType {
  ShortTerm = 'short-term',    // 短期记忆 (当前会话)
  LongTerm = 'long-term',      // 长期记忆 (持久化)
  Procedural = 'procedural',   // 程序性记忆 (技能)
  Semantic = 'semantic',       // 语义记忆 (知识)
}

interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[];        // 向量嵌入
  metadata: {
    timestamp: Date;
    relevance: number;
    accessCount: number;
    tags: string[];
  };
}
```

**记忆检索**:
```typescript
class MemoryRetriever {
  async retrieve(query: string, k: number = 5): Promise<MemoryEntry[]> {
    // 1. 生成查询的向量嵌入
    const queryEmbedding = await this.embedder.embed(query);
    
    // 2. 向量相似度搜索
    const candidates = await this.vectorDB.search(queryEmbedding, k * 2);
    
    // 3. 重排序 (考虑时间衰减)
    const scored = candidates.map(entry => ({
      entry,
      score: this.calculateRelevance(entry, queryEmbedding)
    }));
    
    // 4. 返回 Top-K
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => item.entry);
  }
  
  calculateRelevance(entry: MemoryEntry, queryEmbedding: number[]): number {
    // 余弦相似度
    const similarity = this.cosineSimilarity(
      entry.embedding, 
      queryEmbedding
    );
    
    // 时间衰减因子
    const daysSince = (Date.now() - entry.metadata.timestamp.getTime()) 
      / (1000 * 60 * 60 * 24);
    const timeFactor = Math.exp(-daysSince / 30); // 30天半衰期
    
    // 访问频率因子
    const accessFactor = Math.log(1 + entry.metadata.accessCount);
    
    // 综合评分
    return similarity * 0.7 + timeFactor * 0.2 + accessFactor * 0.1;
  }
}
```

#### 3.4 Tool Router (工具路由器)

**工具注册**:
```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (input: any) => Promise<any>;
  permissions?: PermissionRule[];
}

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  
  register(tool: ToolDefinition) {
    // 验证工具定义
    this.validate(tool);
    
    // 注册工具
    this.tools.set(tool.name, tool);
    
    // 通知 LLM Engine 更新工具列表
    this.llmEngine.updateToolDefinitions(Array.from(this.tools.values()));
  }
  
  async execute(toolCall: ToolCall): Promise<ToolResult> {
    // 1. 查找工具
    const tool = this.tools.get(toolCall.name);
    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.name}`);
    }
    
    // 2. 权限检查
    const allowed = await this.permissions.check(
      toolCall.name, 
      toolCall.input
    );
    if (!allowed) {
      throw new PermissionDeniedError();
    }
    
    // 3. 执行工具
    try {
      const result = await tool.execute(toolCall.input);
      return { success: true, output: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

**内置工具**:

| 工具类别 | 工具名称 | 功能描述 |
|---------|---------|----------|
| **文件操作** | Read | 读取文件内容 |
|  | Write | 写入文件 |
|  | Edit | 编辑文件 (字符串替换) |
|  | Glob | 文件模式匹配 |
|  | Grep | 内容搜索 |
| **命令执行** | Bash | 执行 Shell 命令 |
| **版本控制** | Git | Git 操作 |
| **网络请求** | WebFetch | 获取网页内容 |
|  | WebSearch | 网页搜索 |
| **数据库** | SQL | SQL 查询 |
| **多媒体** | ImageGeneration | 图像生成 |
|  | VideoGeneration | 视频生成 |
|  | MultimodalUnderstanding | 多模态理解 |
| **代理** | Task | 子代理任务 |
|  | TaskOutput | 获取后台任务输出 |
| **其他** | Question | 用户询问 |
|  | TodoWrite | 待办事项管理 |

#### 3.5 Hook System (钩子系统)

**钩子事件生命周期**:
```
用户输入
   ▼
[UserPromptSubmit]  ◄── Hook: 预处理输入
   ▼
LLM 推理
   ▼
工具调用决策
   ▼
[PreToolUse]  ◄──────── Hook: 拦截/记录工具调用
   ▼
执行工具
   ▼
[PostToolUse]  ◄─────── Hook: 验证/格式化输出
   ▼
LLM 继续推理
   ▼
生成响应
   ▼
[Stop]  ◄──────────── Hook: 保存会话/提取模式
   ▼
[Notification]  ◄────── Hook: 自定义通知
   ▼
返回用户
```

**Hook 配置结构**:
```typescript
interface HookConfig {
  hooks: {
    [eventName: string]: HookMatcher[];
  };
}

interface HookMatcher {
  matcher: string;  // 工具名称匹配 (支持正则)
  hooks: Hook[];
}

interface Hook {
  type: 'command';
  command: string;
  timeout?: number;
  description?: string;
}
```

**Hook 执行引擎**:
```typescript
class HookExecutor {
  async execute(
    event: HookEvent, 
    data: any
  ): Promise<HookResult> {
    // 1. 查找匹配的 hooks
    const hooks = this.findMatchingHooks(event, data);
    
    // 2. 顺序执行
    for (const hook of hooks) {
      const result = await this.runHook(hook, data);
      
      // 3. 检查是否需要中断
      if (result.shouldAbort) {
        return result;
      }
      
      // 4. 累积结果
      data = this.mergeResult(data, result);
    }
    
    return { success: true, data };
  }
  
  async runHook(hook: Hook, data: any): Promise<HookResult> {
    // 构建 Shell 命令
    const command = this.substituteVariables(hook.command, data);
    
    // 执行命令 (通过 Bash tool)
    const result = await this.bash.execute({
      command,
      input: JSON.stringify(data),
      timeout: hook.timeout || 60000,
    });
    
    // 解析结果
    return this.parseHookResult(result);
  }
}
```

#### 3.6 Skill Loader (技能加载器)

**技能目录结构**:

```
skills/
├── pdf-processor/
│   ├── SKILL.md              # 必需
│   ├── reference.md         # 可选，参考文档
│   └── scripts/             # 可选，辅助脚本
│       ├── process.py
│       └── utils.sh
└── code-reviewer/
    └── SKILL.md
```

**SKILL.md 格式**:

```markdown
---
name: PDFProcessor
description: 处理 PDF 文件
allowed-tools: Read, Write, Bash
user-invocable: true        # 是否允许用户直接调用
context: fork               # fork 或 main
agent: general-purpose      # 使用的代理类型
---

你是一个 PDF 处理专家...

## 工作流程

1. 读取 PDF 文件
2. 提取文本内容
3. 分析并总结

## 工具

可以使用以下工具：
- `@read_file` - 读取文件
- `@write_to_file` - 写入文件
```

**Frontmatter 字段说明**:

| 字段 | 说明 | 必需 |
|------|------|------|
| `name` | 技能名称 | 是 |
| `description` | 技能描述 | 是 |
| `allowed-tools` | 允许的工具列表 | 否 |
| `user-invocable` | 用户是否可直接调用 | 否（默认 true） |
| `context` | 上下文类型 | 否 |
| `agent` | 使用的代理类型 | 否 |

**技能发现与加载**:
```typescript
class SkillLoader {
  async loadSkills(): Promise<Skill[]> {
    const skills: Skill[] = [];
    
    // 1. 加载内置 Skills
    const builtinSkills = await this.loadBuiltinSkills();
    
    // 2. 加载用户级 Skills
    const userSkills = await this.loadFromDirectory(
      '~/.codebuddy/skills/'
    );
    
    // 3. 加载项目级 Skills
    const projectSkills = await this.loadFromDirectory(
      '.codebuddy/skills/'
    );
    
    // 4. 加载插件 Skills
    const pluginSkills = await this.loadPluginSkills();
    
    // 5. 合并并去重 (优先级: 项目 > 用户 > 插件 > 内置)
    return this.deduplicateSkills([
      ...projectSkills,
      ...userSkills,
      ...pluginSkills,
      ...builtinSkills
    ]);
  }
  
  async loadFromDirectory(dir: string): Promise<Skill[]> {
    const skills: Skill[] = [];
    
    // 遍历技能目录
    for (const skillDir of await fs.readdir(dir)) {
      const skillFile = path.join(dir, skillDir, 'SKILL.md');
      
      if (await fs.exists(skillFile)) {
        const skill = await this.parseSkillFile(skillFile);
        skills.push(skill);
      }
    }
    
    return skills;
  }
  
  async parseSkillFile(filePath: string): Promise<Skill> {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // 解析 frontmatter
    const { data: frontmatter, content: body } = matter(content);
    
    return {
      name: frontmatter.name,
      description: frontmatter.description,
      allowedTools: frontmatter['allowed-tools']?.split(',').map(t => t.trim()),
      userInvocable: frontmatter['user-invocable'] !== false,
      context: frontmatter.context,
      agent: frontmatter.agent,
      prompt: body,
      baseDirectory: path.dirname(filePath),
    };
  }
}
```

**技能调用机制**:
```typescript
class SkillInvoker {
  async invokeSkill(skill: Skill, task: string): Promise<string> {
    // 1. 检查是否需要 fork 上下文
    if (skill.context === 'fork') {
      return await this.invokeInSubAgent(skill, task);
    }
    
    // 2. 在主上下文中调用
    return await this.invokeInMainContext(skill, task);
  }
  
  async invokeInSubAgent(skill: Skill, task: string): Promise<string> {
    // 创建子代理
    const subAgent = await this.createSubAgent({
      type: skill.agent || 'general-purpose',
      systemPrompt: skill.prompt,
      tools: skill.allowedTools,
    });
    
    // 执行任务
    const result = await subAgent.execute(task);
    
    return result;
  }
}
```

### 4. 工具执行层

#### 4.1 Bash Tool (命令执行工具)

**安全执行**:
```typescript
class BashTool implements Tool {
  async execute(input: BashInput): Promise<BashOutput> {
    // 1. 安全检查
    await this.securityCheck(input.command);
    
    // 2. 沙箱模式检查
    if (this.sandboxMode === 'strict') {
      this.validateCommand(input.command);
    }
    
    // 3. 执行命令
    const result = await this.runCommand(input);
    
    return result;
  }
  
  async runCommand(input: BashInput): Promise<BashOutput> {
    return new Promise((resolve, reject) => {
      const proc = spawn('bash', ['-c', input.command], {
        cwd: input.workdir || process.cwd(),
        env: { ...process.env, ...input.env },
        timeout: input.timeout || 600000, // 10分钟
      });
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      proc.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code,
          success: code === 0,
        });
      });
      
      proc.on('error', reject);
    });
  }
}
```

#### 4.2 File Tools (文件工具)

**Read Tool**:
```typescript
class ReadTool implements Tool {
  async execute(input: { filePath: string }): Promise<string> {
    // 1. 路径验证
    const resolvedPath = this.resolvePath(input.filePath);
    
    // 2. 权限检查
    await this.checkReadPermission(resolvedPath);
    
    // 3. 读取文件
    const content = await fs.readFile(resolvedPath, 'utf-8');
    
    // 4. 大文件截断 (>2000行)
    return this.truncateIfNeeded(content);
  }
}
```

**Edit Tool (字符串替换)**:
```typescript
class EditTool implements Tool {
  async execute(input: EditInput): Promise<EditOutput> {
    // 1. 读取文件
    const content = await fs.readFile(input.filePath, 'utf-8');
    
    // 2. 模糊匹配 oldString
    const match = this.fuzzyMatch(content, input.oldString);
    if (!match) {
      throw new Error('oldString not found');
    }
    
    // 3. 执行替换
    const newContent = content.replace(match, input.newString);
    
    // 4. 写回文件
    await fs.writeFile(input.filePath, newContent, 'utf-8');
    
    return { success: true };
  }
  
  fuzzyMatch(content: string, target: string): string | null {
    // 允许缩进和空白差异
    const normalized = (s: string) => s.replace(/^\s+/gm, '').trim();
    
    const targetNorm = normalized(target);
    const lines = content.split('\n');
    
    // 滑动窗口匹配
    for (let i = 0; i < lines.length; i++) {
      const window = lines.slice(i, i + targetNorm.split('\n').length).join('\n');
      if (normalized(window) === targetNorm) {
        return window;
      }
    }
    
    return null;
  }
}
```

#### 4.3 Search Tools (搜索工具)

**Grep Tool (内容搜索)**:
```typescript
class GrepTool implements Tool {
  async execute(input: GrepInput): Promise<GrepOutput> {
    // 使用 ripgrep (rg) 高性能搜索
    const args = [
      input.pattern,
      '--json',  // JSON 输出
      '--max-count', '100',  // 限制结果
    ];
    
    if (input.include) {
      args.push('--glob', input.include);
    }
    
    if (input.path) {
      args.push(input.path);
    }
    
    const result = await this.bash.execute({
      command: `rg ${args.join(' ')}`,
    });
    
    return this.parseRgOutput(result.stdout);
  }
}
```

**Glob Tool (文件匹配)**:
```typescript
class GlobTool implements Tool {
  async execute(input: { pattern: string }): Promise<string[]> {
    // 使用 fast-glob 库
    const files = await glob(input.pattern, {
      cwd: input.path || process.cwd(),
      ignore: ['**/node_modules/**', '**/.git/**'],
      absolute: true,
    });
    
    // 按修改时间排序
    return files.sort((a, b) => {
      const aStat = fs.statSync(a);
      const bStat = fs.statSync(b);
      return bStat.mtime.getTime() - aStat.mtime.getTime();
    });
  }
}
```

### 5. 扩展插件层

#### 5.1 Plugin System (插件系统)

> ⚠️ **注意**：由于官网插件系统页面使用动态加载，无法获取完整文档信息。以下内容基于之前版本和 Claude Code 推导，需要进一步验证。

**插件结构**（待验证）：
```
my-plugin/
├── .codebuddy-plugin/
│   └── plugin.json        # 插件清单
├── commands/              # 命令
│   └── my-command.md
├── agents/                # 代理
│   └── my-agent.md
├── skills/                # 技能
│   └── my-skill/
│       └── SKILL.md
├── hooks/                 # 钩子
│   └── hooks.json
├── .mcp.json              # MCP 配置
└── .lsp.json              # LSP 配置
```

**插件加载流程**:
```typescript
class PluginManager {
  async loadPlugin(pluginPath: string): Promise<Plugin> {
    // 1. 读取 plugin.json
    const manifest = await this.readManifest(pluginPath);
    
    // 2. 验证插件
    await this.validatePlugin(manifest);
    
    // 3. 检查依赖
    await this.checkDependencies(manifest);
    
    // 4. 加载组件
    const plugin = new Plugin(manifest);
    
    await plugin.loadCommands(path.join(pluginPath, 'commands'));
    await plugin.loadAgents(path.join(pluginPath, 'agents'));
    await plugin.loadSkills(path.join(pluginPath, 'skills'));
    await plugin.loadHooks(path.join(pluginPath, 'hooks'));
    
    // 5. 注册插件
    this.registry.set(manifest.name, plugin);
    
    return plugin;
  }
}
```

#### 5.1.1 Plugin Marketplace (插件市场)

CodeBuddy 支持通过 Plugin Marketplace 管理插件来源和安装。

**添加插件市场**:

```bash
# 从 GitHub 仓库添加
/plugin marketplace add owner/repo

# 从本地目录添加
/plugin marketplace add ./my-marketplace

# 从 HTTP URL 添加
/plugin marketplace add https://example.com/marketplace.json
```

**安装插件**:

```bash
# 安装最新版本
/plugin install my-plugin

# 安装指定版本
/plugin install my-plugin@2.1.0

# 查看可用插件
/plugin marketplace list
```

**marketplace.json 格式**:

```json
{
  "name": "my-plugins",
  "owner": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "plugins": [
    {
      "name": "my-plugin",
      "source": "./plugins/my-plugin",
      "description": "My awesome plugin",
      "version": "2.1.0"
    },
    {
      "name": "another-plugin",
      "source": "./plugins/another-plugin",
      "description": "Another useful plugin",
      "version": "1.0.0"
    }
  ]
}
```

**插件目录结构**:

```
marketplace-root/
├── marketplace.json
└── plugins/
    ├── my-plugin/
    │   └── .codebuddy-plugin/
    │       └── plugin.json
    └── another-plugin/
        └── .codebuddy-plugin/
            └── plugin.json
```

#### 5.2 MCP Integration (模型上下文协议)

**MCP 架构**:
```
┌─────────────────┐
│  CodeBuddy CLI  │
├─────────────────┤
│  MCP Client     │
└─────────────────┘
         │
         │ stdio/SSE
         ▼
┌─────────────────┐
│   MCP Server    │
│  (外部进程)     │
├─────────────────┤
│  - GitHub       │
│  - Slack        │
│  - Database     │
│  - Custom...    │
└─────────────────┘
```

**MCP 工具注册**:
```typescript
class MCPIntegration {
  async connectServer(config: MCPConfig): Promise<MCPConnection> {
    // 1. 启动 MCP 服务器进程
    const server = await this.startServer(config);
    
    // 2. 建立连接
    const connection = await this.connect(server);
    
    // 3. 获取工具列表
    const tools = await connection.listTools();
    
    // 4. 注册工具到 Tool Registry
    for (const tool of tools) {
      this.toolRegistry.register({
        name: `mcp__${config.name}__${tool.name}`,
        description: tool.description,
        parameters: tool.inputSchema,
        execute: async (input) => {
          return await connection.callTool(tool.name, input);
        },
      });
    }
    
    return connection;
  }
}
```

**配置示例**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed"]
    }
  }
}
```

#### 5.3 LSP Integration (语言服务器协议)

**LSP 架构**:
```
┌─────────────────┐
│  CodeBuddy      │
├─────────────────┤
│  LSP Client     │
└─────────────────┘
         │
         │ JSON-RPC
         ▼
┌─────────────────┐
│  LSP Server     │
│  (ts-server,    │
│   rust-analyzer,│
│   gopls, etc.)  │
└─────────────────┘
```

**代码智能工具**:
```typescript
class LSPTools {
  // 获取符号定义
  async getDefinition(file: string, position: Position): Promise<Location[]> {
    const lspServer = this.getServerForFile(file);
    return await lspServer.definition(file, position);
  }
  
  // 获取类型信息
  async getHover(file: string, position: Position): Promise<Hover> {
    const lspServer = this.getServerForFile(file);
    return await lspServer.hover(file, position);
  }
  
  // 获取引用
  async getReferences(file: string, position: Position): Promise<Location[]> {
    const lspServer = this.getServerForFile(file);
    return await lspServer.references(file, position);
  }
}
```

**AI 增强的代码理解**:
```typescript
class AICodeUnderstanding {
  async analyzeCode(file: string): Promise<CodeAnalysis> {
    // 1. 使用 LSP 获取代码结构
    const symbols = await this.lsp.getDocumentSymbols(file);
    const diagnostics = await this.lsp.getDiagnostics(file);
    
    // 2. 读取源代码
    const content = await fs.readFile(file, 'utf-8');
    
    // 3. 组合上下文发送给 LLM
    const analysis = await this.llm.complete([
      {
        role: 'system',
        content: 'You are a code analysis expert.'
      },
      {
        role: 'user',
        content: `
          Analyze this code:
          
          Symbols: ${JSON.stringify(symbols)}
          Diagnostics: ${JSON.stringify(diagnostics)}
          
          Source:
          ${content}
        `
      }
    ]);
    
    return analysis;
  }
}
```

### 6. 数据持久层

#### 6.1 Session Storage (会话存储)

**会话数据结构**:
```typescript
interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  context: Context;
  checkpoints: Checkpoint[];
  metadata: {
    projectPath: string;
    model: string;
    totalTokens: number;
    totalCost: number;
  };
}
```

**会话持久化**:
```typescript
class SessionStore {
  private sessionFile = '.codebuddy/session.jsonl';
  
  async save(session: Session) {
    // 追加到 JSONL 文件
    await fs.appendFile(
      this.sessionFile,
      JSON.stringify({
        timestamp: new Date(),
        session: this.serializeSession(session)
      }) + '\n'
    );
  }
  
  async load(sessionId: string): Promise<Session> {
    // 读取 JSONL 文件
    const lines = await fs.readFile(this.sessionFile, 'utf-8').split('\n');
    
    // 查找匹配的会话
    for (const line of lines.reverse()) {
      const entry = JSON.parse(line);
      if (entry.session.id === sessionId) {
        return this.deserializeSession(entry.session);
      }
    }
    
    throw new Error('Session not found');
  }
}
```

#### 6.2 Memory Database (记忆数据库)

**向量数据库集成**:
```typescript
class MemoryDB {
  private vectorDB: VectorDatabase;
  
  async store(entry: MemoryEntry) {
    // 1. 生成向量嵌入
    if (!entry.embedding) {
      entry.embedding = await this.embedder.embed(entry.content);
    }
    
    // 2. 存储到向量数据库
    await this.vectorDB.insert({
      id: entry.id,
      vector: entry.embedding,
      metadata: {
        type: entry.type,
        content: entry.content,
        timestamp: entry.metadata.timestamp,
        tags: entry.metadata.tags,
      }
    });
  }
  
  async search(query: string, k: number = 5): Promise<MemoryEntry[]> {
    // 1. 查询向量化
    const queryVector = await this.embedder.embed(query);
    
    // 2. 向量搜索
    const results = await this.vectorDB.search(queryVector, k);
    
    // 3. 转换为 MemoryEntry
    return results.map(r => this.hydrateMemoryEntry(r));
  }
}
```

#### 6.3 Configuration Management (配置管理)

**配置层级**:
```
优先级从高到低:
1. 命令行参数      (--model, --max-tokens)
2. 环境变量        (CODEBUDDY_MODEL)
3. 项目配置        (.codebuddy/settings.json)
4. 用户配置        (~/.codebuddy/settings.json)
5. 默认配置        (内置)
```

**配置加载**:
```typescript
class ConfigManager {
  async loadConfig(): Promise<Config> {
    // 1. 加载默认配置
    const config = this.defaultConfig();
    
    // 2. 合并用户配置
    const userConfig = await this.loadUserConfig();
    Object.assign(config, userConfig);
    
    // 3. 合并项目配置
    const projectConfig = await this.loadProjectConfig();
    Object.assign(config, projectConfig);
    
    // 4. 应用环境变量
    this.applyEnvVars(config);
    
    // 5. 应用命令行参数
    this.applyCLIArgs(config);
    
    return config;
  }
}
```

---

## 数据流与生命周期

### 完整对话流程

```
1. 用户输入
   │
   ▼
2. 命令解析
   ├─ 斜杠命令? ──→ 执行命令 ──→ 返回结果
   │
   └─ 普通提示
      │
      ▼
3. UserPromptSubmit Hook
   │
   ▼
4. 上下文构建
   ├─ 加载 Skills
   ├─ 加载 Memory
   ├─ 添加工具定义
   └─ 构建消息历史
   │
   ▼
5. LLM 推理
   ├─ 文本响应? ──→ 返回用户
   │
   └─ 工具调用?
      │
      ▼
6. PreToolUse Hook
   │
   ▼
7. 权限检查
   ├─ 拒绝? ──→ 通知 LLM ──→ 返回步骤 5
   │
   └─ 允许
      │
      ▼
8. 执行工具
   │
   ▼
9. PostToolUse Hook
   │
   ▼
10. 工具结果返回 LLM
    │
    └──→ 返回步骤 5 (继续推理)
    
11. Stop Hook
    │
    ▼
12. 返回用户
```

### 子代理生命周期

```
主对话
  │
  ├─ 创建子代理任务
  │  ├─ type: 'Explore' | 'Plan' | 'general-purpose' | custom
  │  ├─ systemPrompt: Skill 内容或自定义提示
  │  └─ tools: 工具白名单
  │
  ▼
子代理上下文 (独立)
  ├─ 系统提示
  ├─ 工具列表 (受限)
  ├─ 空消息历史
  └─ 执行任务
     │
     ├─ LLM 推理
     ├─ 工具调用
     └─ 生成结果
        │
        ▼
  返回主对话
  └─ 结果作为工具输出
```

### 会话恢复流程

```
1. 用户执行 /resume
   │
   ▼
2. 列出可用会话
   ├─ 读取 .codebuddy/*.jsonl
   └─ 显示会话列表 (时间、消息数、模型)
   │
   ▼
3. 用户选择会话
   │
   ▼
4. 加载会话数据
   ├─ 反序列化消息历史
   ├─ 恢复上下文
   └─ 恢复检查点
   │
   ▼
5. 继续对话
```

---

## 扩展机制

### Plugin API

```typescript
// 插件入口
export interface CodeBuddyPlugin {
  name: string;
  version: string;
  
  // 生命周期钩子
  onLoad?(context: PluginContext): Promise<void>;
  onUnload?(): Promise<void>;
  
  // 组件提供
  commands?: Command[];
  agents?: Agent[];
  skills?: Skill[];
  hooks?: HookConfig;
  tools?: ToolDefinition[];
  
  // MCP/LSP 配置
  mcpServers?: MCPServerConfig[];
  lspServers?: LSPServerConfig[];
}

// 插件上下文
interface PluginContext {
  // 工具注册
  registerTool(tool: ToolDefinition): void;
  
  // 命令注册
  registerCommand(command: Command): void;
  
  // 访问核心服务
  getToolRegistry(): ToolRegistry;
  getLLMEngine(): LLMEngine;
  getMemorySystem(): MemorySystem;
  
  // 配置访问
  getConfig(): Config;
  updateConfig(updates: Partial<Config>): void;
}
```

### Custom Tool 开发

```typescript
// 1. 定义工具接口
interface MyCustomTool extends Tool {
  name: 'my-custom-tool';
  execute(input: MyInput): Promise<MyOutput>;
}

// 2. 实现工具
class MyCustomToolImpl implements MyCustomTool {
  name = 'my-custom-tool' as const;
  
  async execute(input: MyInput): Promise<MyOutput> {
    // 业务逻辑
    return { result: 'success' };
  }
  
  // 工具描述 (供 LLM 理解)
  getDescription(): ToolDefinition {
    return {
      name: this.name,
      description: 'Does something useful',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' }
        },
        required: ['input']
      }
    };
  }
}

// 3. 注册工具
context.registerTool(new MyCustomToolImpl());
```

### Skill 开发最佳实践

```markdown
---
name: my-custom-skill
description: 明确描述何时 AI 应该调用此技能
allowed-tools: Read, Write, Bash(npm:*)
user-invocable: true
context: fork  # 如果需要独立上下文
agent: Explore  # 指定子代理类型
---

# Skill 标题

你是一个 [专业领域] 专家。

## 核心能力
- 能力 1
- 能力 2

## 工作流程
1. 步骤 1
2. 步骤 2
3. 步骤 3

## 可用工具
- Read: 读取文件
- Write: 写入文件
- Bash: 执行命令 (限定为 npm 命令)

## 输出格式
```
期望的输出格式示例
```

## 最佳实践
- 实践 1
- 实践 2
```

---

## 安全架构

### 权限隔离

```
┌─────────────────────────────────────┐
│         权限边界                     │
├─────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐  │
│  │   用户工作空间               │  │
│  │   /mnt/workspace/...         │  │
│  │   (完全访问)                 │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │   CodeBuddy 内部目录         │  │
│  │   /opt/skycode/data/...      │  │
│  │   (受限访问)                 │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │   系统目录                   │  │
│  │   /usr, /etc, /sys           │  │
│  │   (只读或禁止)               │  │
│  └──────────────────────────────┘  │
│                                      │
└─────────────────────────────────────┘
```

### Bash 沙箱

**安全级别**:

| 级别 | 描述 | 限制 |
|------|------|------|
| **off** | 无限制 | 允许所有命令 |
| **permissive** | 宽松模式 | 阻止明显危险命令 |
| **strict** | 严格模式 | 仅允许白名单命令 |

**危险命令检测**:
```typescript
const DANGEROUS_PATTERNS = [
  /rm\s+-rf\s+\//, // 删除根目录
  /:\(\)\{.*\};:/, // Fork 炸弹
  /dd\s+if=\/dev\/random/, // 随机覆写
  /mkfs/, // 格式化
  /chmod\s+-R\s+777/, // 全局权限修改
];

class BashSandbox {
  validate(command: string): ValidationResult {
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return {
          allowed: false,
          reason: `Dangerous pattern detected: ${pattern}`
        };
      }
    }
    
    return { allowed: true };
  }
}
```

### 数据隐私

**敏感数据过滤**:
```typescript
class DataSanitizer {
  private sensitivePatterns = [
    /(?:api[_-]?key|token|secret)\s*[:=]\s*['"]?([a-zA-Z0-9_-]+)['"]?/gi,
    /(?:password|passwd)\s*[:=]\s*['"]?([^\s'"]+)['"]?/gi,
    /(?:sk|pk)_(?:test|live)_[a-zA-Z0-9]{24,}/gi, // Stripe keys
  ];
  
  sanitize(content: string): string {
    let sanitized = content;
    
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, (match, capture) => {
        return match.replace(capture, '[REDACTED]');
      });
    }
    
    return sanitized;
  }
}
```

---

## 性能优化

### Token 优化策略

**1. 系统提示压缩**:
```typescript
// 使用简洁的提示词
const COMPACT_PROMPT = `
You are CodeBuddy, an AI coding assistant.

Core rules:
- Be concise
- Use tools effectively
- Follow user's coding style

Available tools: [list]
`;

// 而非冗长的说明
```

**2. 选择性 Skill 加载**:
```typescript
class SmartSkillLoader {
  async loadRelevantSkills(task: string): Promise<Skill[]> {
    // 1. 分析任务关键词
    const keywords = this.extractKeywords(task);
    
    // 2. 向量相似度匹配
    const allSkills = await this.getAllSkills();
    const scored = allSkills.map(skill => ({
      skill,
      score: this.calculateRelevance(skill, keywords)
    }));
    
    // 3. 仅加载 Top-K 相关技能
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.skill);
  }
}
```

**3. 消息历史压缩**:
- 保留最近 N 条消息
- 早期消息用摘要替代
- 工具调用结果截断

### 缓存机制

**LLM 响应缓存**:
```typescript
class LLMCache {
  private cache = new LRUCache<string, LLMResponse>({
    max: 100,
    ttl: 1000 * 60 * 60, // 1小时
  });
  
  async complete(messages: Message[]): Promise<LLMResponse> {
    // 生成缓存键
    const key = this.hashMessages(messages);
    
    // 检查缓存
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    
    // 调用 LLM
    const response = await this.llm.complete(messages);
    
    // 缓存结果
    this.cache.set(key, response);
    
    return response;
  }
}
```

**文件内容缓存**:
```typescript
class FileCache {
  private cache = new Map<string, { content: string; mtime: number }>();
  
  async read(path: string): Promise<string> {
    const stat = await fs.stat(path);
    const cached = this.cache.get(path);
    
    // 检查是否过期
    if (cached && cached.mtime === stat.mtimeMs) {
      return cached.content;
    }
    
    // 读取并缓存
    const content = await fs.readFile(path, 'utf-8');
    this.cache.set(path, { content, mtime: stat.mtimeMs });
    
    return content;
  }
}
```

### 并行化

**多任务并行**:
```typescript
class ParallelExecutor {
  async executeMultiple(tasks: Task[]): Promise<TaskResult[]> {
    // 使用 Promise.all 并行执行
    return await Promise.all(
      tasks.map(task => this.execute(task))
    );
  }
  
  async executeCascade(tasks: Task[][]): Promise<TaskResult[][]> {
    // 级联执行: 每层并行,层间串行
    const results: TaskResult[][] = [];
    
    for (const layer of tasks) {
      const layerResults = await Promise.all(
        layer.map(task => this.execute(task))
      );
      results.push(layerResults);
    }
    
    return results;
  }
}
```

**Git Worktree 并行**:
```bash
# 创建多个 worktree
git worktree add ../project-task1 main
git worktree add ../project-task2 main

# 并行执行任务
codebuddy --project ../project-task1 "任务1" &
codebuddy --project ../project-task2 "任务2" &

wait
```

---

## 集成接口

### REST API

```typescript
// 启动 HTTP 服务器
import express from 'express';

const app = express();

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  
  // 创建或恢复会话
  const session = sessionId 
    ? await sessionStore.load(sessionId)
    : await sessionStore.create();
  
  // 处理消息
  const response = await codebuddy.chat(session, message);
  
  // 返回响应
  res.json({
    sessionId: session.id,
    response: response.content,
    toolCalls: response.toolCalls,
  });
});

app.listen(3000);
```

### WebSocket

```typescript
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  const session = sessionStore.create();
  
  ws.on('message', async (data) => {
    const { message } = JSON.parse(data);
    
    // 流式响应
    for await (const chunk of codebuddy.streamChat(session, message)) {
      ws.send(JSON.stringify({
        type: 'chunk',
        content: chunk
      }));
    }
    
    ws.send(JSON.stringify({ type: 'done' }));
  });
});
```

### SDK 集成

**Python SDK**:
```python
from codebuddy import CodeBuddy

# 创建客户端
client = CodeBuddy(api_key="your-key")

# 同步调用
response = client.chat("帮我优化这个函数")

# 流式调用
for chunk in client.stream_chat("解释这段代码"):
    print(chunk, end="")

# 工具调用
result = client.execute_tool("Bash", {
    "command": "npm test"
})
```

**TypeScript SDK**:
```typescript
import { CodeBuddy } from '@codebuddy/sdk';

const client = new CodeBuddy({
  apiKey: process.env.CODEBUDDY_API_KEY
});

// Async/await
const response = await client.chat('帮我写一个排序函数');

// 流式
for await (const chunk of client.streamChat('分析这个项目')) {
  process.stdout.write(chunk);
}

// 会话管理
const session = await client.createSession();
await session.chat('第一个问题');
await session.chat('第二个问题');
await session.save();
```

---

## 部署架构

### 本地部署 (默认)

```
用户机器
├── CodeBuddy CLI (Node.js)
│   ├── 本地文件系统访问
│   └── 本地进程执行
│
└── 外部 API 调用
    ├── LLM API (Claude, GPT, Gemini)
    ├── MCP 服务器 (可选)
    └── LSP 服务器 (可选)
```

### 团队部署

```
┌─────────────────────────────────────┐
│         团队成员机器                 │
│  ┌─────────────────────────────┐   │
│  │  CodeBuddy CLI              │   │
│  └─────────────────────────────┘   │
│             ▼                        │
│    (.codebuddy/settings.json)      │
│             ▼                        │
│  自动安装插件和配置                  │
└─────────────────────────────────────┘
```

**团队配置示例**:
```json
{
  "extraKnownMarketplaces": {
    "company-plugins": {
      "source": {
        "source": "github",
        "repo": "company/codebuddy-plugins"
      }
    }
  },
  "enabledPlugins": {
    "company-standards@company-plugins": true,
    "security-scanner@company-plugins": true
  }
}
```

### CI/CD 集成

```yaml
# .github/workflows/codebuddy-review.yml
name: CodeBuddy Code Review

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install CodeBuddy
        run: npm install -g @tencent-ai/codebuddy-code
      
      - name: Run Code Review
        run: |
          codebuddy --headless "
            审查 PR #${{ github.event.pull_request.number }} 的代码变更,
            重点检查安全性和性能问题
          " > review.md
      
      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: review
            });
```

---

## 最佳实践

### 1. 项目初始化

```bash
# 1. 创建 CodeBuddy 配置目录
mkdir -p .codebuddy/{commands,agents,skills,hooks}

# 2. 初始化配置
codebuddy /init

# 3. 配置团队插件 (可选)
cat > .codebuddy/settings.json << EOF
{
  "extraKnownMarketplaces": {
    "team": {
      "source": {
        "source": "github",
        "repo": "your-org/codebuddy-plugins"
      }
    }
  }
}
EOF

# 4. 提交配置到版本控制
git add .codebuddy/
git commit -m "Add CodeBuddy configuration"
```

### 2. 命令组织

```
.codebuddy/commands/
├── git/                  # Git 相关命令
│   ├── commit.md
│   ├── review.md
│   └── release.md
├── test/                 # 测试命令
│   ├── unit.md
│   ├── integration.md
│   └── e2e.md
└── deploy/               # 部署命令
    ├── staging.md
    └── production.md
```

### 3. Skills 管理

**按功能领域组织**:
```
.codebuddy/skills/
├── frontend/
│   ├── react-patterns/SKILL.md
│   └── css-optimization/SKILL.md
├── backend/
│   ├── api-design/SKILL.md
│   └── database-optimization/SKILL.md
└── devops/
    ├── docker-best-practices/SKILL.md
    └── ci-cd-patterns/SKILL.md
```

**背景知识 Skills**:
```markdown
---
name: project-coding-standards
description: 项目编码规范和最佳实践
user-invocable: false  # 不出现在 / 菜单
---

# 项目编码规范

[规范内容...]
```

### 4. Hooks 应用

**自动代码格式化**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

**会话持久化**:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/save_session.py"
          }
        ]
      }
    ]
  }
}
```

### 5. 性能优化技巧

**选择合适的模型**:
- **快速任务**: Gemini Flash (低延迟)
- **复杂推理**: GPT-4 / Claude (高质量)
- **代码生成**: GPT-5-codex (专业)

**减少上下文**:
- 使用 `/compact` 压缩历史
- 选择性加载 Skills
- 避免读取大文件全文

**利用并行化**:
- Git worktree 多任务并行
- 后台任务 (`run_in_background: true`)
- Cascade 执行模式

---

## 附录

### A. 配置文件完整示例

```json
{
  "model": "gemini-3.0-flash",
  "maxTokens": 8192,
  "temperature": 0.7,
  
  "permissions": {
    "Bash": "ask",
    "Edit": "accept",
    "Write": "accept"
  },
  
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  },
  
  "extraKnownMarketplaces": {
    "official": {
      "source": {
        "source": "github",
        "repo": "codebuddy/official-plugins"
      }
    }
  },
  
  "enabledPlugins": {
    "typescript-expert@official": true,
    "security-scanner@official": true
  },
  
  "memory": {
    "enabled": true,
    "maxEntries": 1000
  },
  
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $FILE_PATH"
          }
        ]
      }
    ]
  }
}
```

### B. 环境变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `CODEBUDDY_PLUGIN_ROOT` | **插件根目录** | `C:\Users\username\.codebuddy` |
| `CODEBUDDY_PROJECT_DIR` | **项目根目录** | `D:\projects\myapp` |
| `CODEBUDDY_HOME` | **用户配置目录** | `~/.codebuddy` |
| `CODEBUDDY_MODEL` | 默认模型 | `gemini-3.0-flash` |
| `CODEBUDDY_API_KEY` | API 密钥 | `sk-...` |
| `CODEBUDDY_MAX_TOKENS` | 最大 tokens | `8192` |
| `GITHUB_TOKEN` | GitHub Token | `ghp_...` |

**平台路径变量**:
| 平台 | 用户目录环境变量 | 用户目录路径示例 |
|------|-----------------|-----------------|
| Windows | `%USERPROFILE%` | `C:\Users\username` |
| Linux/macOS | `$HOME` | `/home/username` 或 `/Users/username` |

**快捷方式支持**:
- ✅ `~` 表示用户主目录 (跨平台)
- ✅ `~/.codebuddy` 表示用户全局配置目录
- ✅ Windows PowerShell 支持 `~` 快捷方式
- ✅ Linux/macOS Bash 支持 `~` 快捷方式

### C. CLI 命令参考

```bash
# 启动交互模式
codebuddy

# 执行单次任务
codebuddy "帮我优化这个函数"

# 无头模式 (脚本)
codebuddy --headless "运行测试并生成报告"

# 恢复会话
codebuddy --resume <session-id>

# 指定模型（国内）
codebuddy --model glm-5.0

# 指定模型（国际）
codebuddy --model claude-3-5-sonnet

# 管道输入
cat file.txt | codebuddy "分析这个文件"

# 插件管理
codebuddy plugin install <plugin-name>
codebuddy plugin marketplace add <url>

# 配置管理
codebuddy config set model gemini-3.0-flash
codebuddy config get

# 查看帮助
codebuddy --help
```

### D. 术语表

| 术语 | 英文 | 定义 |
|------|------|------|
| **斜杠命令** | Slash Command | 以 `/` 开头的内置命令 |
| **技能** | Skill | AI 自动识别调用的专业能力模板 |
| **代理** | Agent/Subagent | 专用的 AI 助手,处理特定任务 |
| **钩子** | Hook | 在特定事件触发时执行的脚本 |
| **工具** | Tool | LLM 可调用的功能接口 |
| **上下文** | Context | 对话历史和相关信息 |
| **记忆** | Memory | 持久化的知识和经验 |
| **检查点** | Checkpoint | 会话的快照,可恢复 |

---

## 组件编写指南

本章节提供 Commands、Skills、Agents、Hooks 四大核心组件的完整编写指南，包含语法规范、最佳实践、常见模式和实战示例。

---

## Commands 编写指南

### 概述

Commands (斜杠命令) 是用户主动触发的快捷操作，通过 Markdown 文件定义，支持参数、Shell 命令执行和文件引用。

### 基础结构

```markdown
---
description: "命令的简短描述 (必需)"
argument-hint: "[参数提示]"
allowed-tools: Bash, Read, Write
model: glm-5.0
disable-model-invocation: false
---

命令的详细说明和执行逻辑。

## 使用参数
- $1, $2, $3: 位置参数
- $ARGUMENTS: 所有参数

## 执行 Shell 命令
!`command`

## 引用文件
@path/to/file
```

### Frontmatter 字段详解

| 字段 | 必需 | 类型 | 说明 | 示例 |
|------|------|------|------|------|
| `description` | ✅ | string | 命令描述,显示在自动补全中 | `"运行单元测试"` |
| `argument-hint` | ❌ | string | 参数提示,帮助用户理解如何使用 | `"[test-file]"` |
| `allowed-tools` | ❌ | string | 允许使用的工具,逗号分隔 | `"Bash(npm:*), Read"` |
| `model` | ❌ | string | 指定使用的 AI 模型 | `"glm-5.0"`, `"claude-3-5-sonnet"` |
| `disable-model-invocation` | ❌ | boolean | 禁止在 Skill 工具中出现 | `true` |

### 参数处理

#### 位置参数 ($1, $2, $3, ...)

```markdown
---
description: "Git 提交命令"
argument-hint: "[message] [--amend]"
---

执行 Git 提交:
- 提交信息: $1
- 选项: $2

!`git commit -m "$1" $2`
```

**调用**: `/git:commit "feat: add feature" --amend`

#### 捕获所有参数 ($ARGUMENTS)

```markdown
---
description: "运行 npm 脚本"
argument-hint: "[script] [args...]"
---

执行 npm 脚本: $ARGUMENTS

!`npm run $ARGUMENTS`
```

**调用**: `/npm:run test --coverage --watch`

### Shell 命令执行

#### 基础语法

```markdown
!`command`
```

**重要规则**:
- 必须用反引号包围
- 输出会被捕获并注入上下文
- 需要在 `allowed-tools` 中包含 `Bash`

#### 多步骤执行

```markdown
---
description: "构建和部署应用"
allowed-tools: Bash(npm:*), Bash(git:*)
---

## 步骤 1: 构建
!`npm run build`

## 步骤 2: 检查构建结果
!`ls -lh dist/`

## 步骤 3: 部署
!`npm run deploy`

请基于以上输出总结部署结果。
```

#### 条件执行

```markdown
---
description: "智能测试运行"
argument-hint: "[test-file]"
---

检查是否提供了测试文件:

如果提供了 $1:
!`npm test -- $1`

否则运行所有测试:
!`npm test`

分析测试结果并报告。
```

### 文件引用

```markdown
---
description: "代码审查命令"
---

请审查以下文件:

@src/utils/helpers.ts
@src/utils/validators.ts

重点检查:
- 类型安全
- 错误处理
- 性能问题
```

### 工具权限控制

#### 完全访问

```markdown
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
```

#### 细粒度控制

```markdown
# 仅允许 npm 命令
allowed-tools: Bash(npm:*)

# 仅允许 git status 和 git diff
allowed-tools: Bash(git:status), Bash(git:diff)

# 允许多个工具模式
allowed-tools: Bash(git:*), Bash(npm:test*), Read, Write
```

#### 权限模式匹配

| 模式 | 匹配示例 |
|------|----------|
| `Bash` | 所有 Bash 命令 |
| `Bash(git:*)` | `git status`, `git diff`, `git log` |
| `Bash(npm run:*)` | `npm run test`, `npm run build` |
| `Bash(git add:*)` | `git add .`, `git add file.txt` |
| `Edit(src/**/*.ts)` | 仅编辑 src/ 下的 .ts 文件 |

### 层级命名 (子目录组织)

**目录结构**:
```
commands/
├── git/
│   ├── commit.md       → /git:commit
│   ├── review.md       → /git:review
│   └── release.md      → /git:release
├── npm/
│   ├── install.md      → /npm:install
│   └── test.md         → /npm:test
└── docker/
    └── build.md        → /docker:build
```

**命名规则**:
- 一级目录 = 分类
- 文件名 = 命令名
- 自动生成: `/<category>:<command>`

### 实战示例

#### 示例 1: PM2 进程管理

```markdown
---
description: "PM2 进程管理 - 启动、停止和监控 Node.js 进程"
argument-hint: "[action] [process-name]"
allowed-tools: Bash(pm2:*), Bash(node:*)
model: gemini-3.0-flash
---

# PM2 进程管理命令

## 参数说明
- $1: 操作 (start|stop|restart|status)
- $2: 进程名称 (可选)

## 执行操作

检查 PM2 是否安装:
!`which pm2 || npm install -g pm2`

执行操作:
!`pm2 $1 $2`

显示进程列表:
!`pm2 list`

## 输出格式

根据上述命令输出,生成简洁的状态报告。
```

**使用方式**:
```bash
/pm2 start app.js
/pm2 restart my-app
/pm2 status
```

#### 示例 2: 代码审查工作流

```markdown
---
description: "对最近的 Git 变更进行代码审查"
allowed-tools: Bash(git:*), Read, Grep
---

# 代码审查工作流

## 获取最近变更

查看最近提交:
!`git log --oneline -5`

获取变更文件列表:
!`git diff --name-only HEAD~1`

查看具体变更:
!`git diff HEAD~1`

## 审查要点

基于以上变更,进行全面审查:

1. **代码质量**
   - 命名规范
   - 代码复杂度
   - 重复代码

2. **安全性**
   - 输入验证
   - SQL 注入风险
   - 敏感信息泄露

3. **性能**
   - 算法效率
   - 数据库查询优化
   - 缓存策略

4. **测试**
   - 测试覆盖率
   - 边界条件

## 输出格式

```markdown
## 代码审查报告

### 🔴 严重问题
1. [具体问题]

### 🟡 警告
1. [具体问题]

### 🟢 建议
1. [具体建议]

### ✅ 优点
1. [好的实践]
```
```

#### 示例 3: 智能部署命令

```markdown
---
description: "智能部署到指定环境 (staging/production)"
argument-hint: "[env] [version]"
allowed-tools: Bash(npm:*), Bash(git:*), Bash(docker:*), Read
---

# 智能部署命令

## 参数
- $1: 环境 (staging/production)
- $2: 版本号 (可选,默认使用当前版本)

## 部署前检查

### 1. 检查分支状态
!`git status --short`

### 2. 检查版本号
!`cat package.json | grep version`

### 3. 检查测试状态
!`npm run test`

## 部署流程

如果部署到 production:
1. 警告用户确认
2. 创建 Git 标签
3. 构建 Docker 镜像
4. 推送到生产环境

如果部署到 staging:
1. 直接构建并部署

## 执行部署

根据环境 $1 执行对应部署脚本:

### Staging
!`npm run deploy:staging`

### Production  
!`npm run deploy:production -- --version=$2`

## 部署验证

检查部署状态:
!`curl https://$1.example.com/health`

## 输出报告

生成部署摘要:
- 环境: $1
- 版本: $2
- 状态: [成功/失败]
- 健康检查: [结果]
```

### 最佳实践

#### ✅ DO - 推荐做法

1. **清晰的描述**
```markdown
# ✅ 好
description: "运行单元测试并生成覆盖率报告"

# ❌ 不好
description: "测试"
```

2. **提供参数提示**
```markdown
# ✅ 好
argument-hint: "[test-file] [--coverage] [--watch]"

# ❌ 不好
argument-hint: "[args]"
```

3. **细粒度权限**
```markdown
# ✅ 好
allowed-tools: Bash(npm test:*), Bash(git diff:*), Read

# ❌ 不好
allowed-tools: Bash
```

4. **结构化输出**
```markdown
# ✅ 好
## 测试结果
- 通过: X 个
- 失败: Y 个
- 覆盖率: Z%

## 失败的测试
1. [测试名称]: [失败原因]

# ❌ 不好
显示测试结果 (无结构)
```

#### ❌ DON'T - 避免做法

1. **避免过长的命令**
```markdown
# ❌ 不好 - 单个命令做太多事
!`npm install && npm run build && npm test && npm run deploy`

# ✅ 好 - 分步执行
!`npm install`
!`npm run build`
!`npm test`
!`npm run deploy`
```

2. **避免硬编码路径**
```markdown
# ❌ 不好
!`cd /Users/john/project && npm test`

# ✅ 好
!`npm test`  # 使用 workdir 参数
```

3. **避免暴露敏感信息**
```markdown
# ❌ 不好
!`export API_KEY=sk_live_123456`

# ✅ 好
!`export API_KEY=$SECURE_API_KEY`  # 从环境变量读取
```

### 调试技巧

#### 查看命令列表
```bash
codebuddy
> /help  # 列出所有命令
```

#### 测试命令
```bash
# 1. 创建测试命令
echo '---
description: "测试命令"
---
测试输出: $ARGUMENTS
' > .codebuddy/commands/test.md

# 2. 重启 CodeBuddy

# 3. 测试
> /test hello world
```

#### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 命令未找到 | 文件路径错误或未重启 | 检查路径,重启 CodeBuddy |
| 权限被拒绝 | 缺少 `allowed-tools` | 添加所需工具到配置 |
| Shell 命令失败 | 命令语法错误 | 在终端测试命令 |
| 参数替换失败 | 使用了未定义的变量 | 检查参数名称 |

---

## Skills 编写指南

### 概述

Skills (技能) 是 AI 自动识别并调用的专业能力模板，用于封装领域知识和工作流程。与 Commands 不同，Skills 是被动触发的。

### 基础结构

```markdown
---
name: skill-name
description: 技能描述,AI 用于判断何时调用
allowed-tools: Read, Write, Bash, Grep
disable-model-invocation: false
user-invocable: true
context: fork
agent: Explore
skills: dependency-skill1, dependency-skill2
---

# Skill 标题

你是一个 [专业领域] 专家。

## 核心能力
- 能力 1
- 能力 2

## 工作流程
1. 步骤 1
2. 步骤 2

## 可用工具
- Read: 读取文件
- Write: 写入文件

## 最佳实践
- 实践 1
- 实践 2
```

### Frontmatter 字段详解

| 字段 | 必需 | 类型 | 说明 | 示例 |
|------|------|------|------|------|
| `name` | ✅ | string | 技能名称,唯一标识 | `"typescript-expert"` |
| `description` | ✅ | string | 何时调用此技能 | `"TypeScript 专家,处理类型问题"` |
| `allowed-tools` | ❌ | string | 允许使用的工具 | `"Read, Write, Bash"` |
| `disable-model-invocation` | ❌ | boolean | 禁止 AI 调用 | `false` |
| `user-invocable` | ❌ | boolean | 是否在 / 菜单显示 | `true` |
| `context` | ❌ | string | 上下文模式 (`fork` = 独立) | `"fork"` |
| `agent` | ❌ | string | 子代理类型 | `"Explore"` |
| `skills` | ❌ | string | 依赖的其他技能 | `"skill1, skill2"` |

### 目录结构

**标准结构**:
```
skills/
└── my-skill/
    └── SKILL.md  # 必须命名为 SKILL.md
```

**分类组织**:
```
skills/
├── frontend/
│   ├── react-patterns/
│   │   └── SKILL.md
│   └── css-optimization/
│       └── SKILL.md
├── backend/
│   ├── api-design/
│   │   └── SKILL.md
│   └── database-optimization/
│       └── SKILL.md
└── testing/
    ├── unit-testing/
    │   └── SKILL.md
    └── e2e-testing/
        └── SKILL.md
```

### 描述编写技巧

**描述决定了 AI 何时调用此 Skill,必须清晰明确**。

#### ✅ 好的描述

```markdown
# 明确任务类型
description: "TypeScript 类型错误诊断和修复专家。当遇到类型相关问题时主动使用。"

# 指定触发场景
description: "数据库性能优化专家。分析慢查询并提供优化建议。处理 SQL 性能问题时使用。"

# 包含关键词
description: "React Hooks 最佳实践。当需要重构类组件为函数组件,或优化 Hooks 使用时调用。"
```

#### ❌ 不好的描述

```markdown
# 太模糊
description: "TypeScript 专家"

# 太宽泛
description: "处理所有前端问题"

# 缺少触发条件
description: "帮助编写代码"
```

### Context Fork (独立上下文)

**使用场景**:
- 需要大量代码库探索
- 不希望污染主对话历史
- 任务有明确的开始和结束

**配置**:
```markdown
---
name: code-analyzer
description: 深度代码分析专家
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, Bash(git:*)
---

你是代码分析专家,在独立上下文中工作。

## 任务
1. 使用 Glob 查找相关文件
2. 使用 Grep 搜索关键模式
3. 使用 Read 读取文件内容
4. 生成详细分析报告

## 重要
- 所有发现必须包含具体文件路径
- 报告必须结构化且可操作
```

**Agent 类型**:

| Agent | 用途 | 可用工具 |
|-------|------|----------|
| `general-purpose` | 通用任务,可读写 | 所有工具 |
| `Explore` | 只读探索,快速搜索 | Read, Grep, Glob, Bash(只读命令) |
| `Plan` | 计划模式下使用 | Read, Grep, Glob, Bash |

### 背景知识 Skills (user-invocable: false)

用于提供上下文信息,不直接执行任务。

```markdown
---
name: project-coding-standards
description: 项目编码规范和架构约定
user-invocable: false
allowed-tools: Read
---

# 项目编码规范

## TypeScript 规范
- 使用严格模式 (`strict: true`)
- 禁止 `any` 类型
- 优先使用接口而非类型别名

## 目录结构
```
src/
├── components/  # React 组件
├── hooks/       # 自定义 Hooks
├── utils/       # 工具函数
└── types/       # 类型定义
```

## 命名约定
- 组件: PascalCase (MyComponent.tsx)
- Hooks: camelCase + use 前缀 (useMyHook.ts)
- 工具: camelCase (formatDate.ts)

AI 在生成代码时应自动遵循这些规范。
```

### 实战示例

#### 示例 1: TypeScript 类型专家

```markdown
---
name: typescript-type-expert
description: TypeScript 类型系统专家。处理复杂类型定义、泛型、类型推导问题时主动使用。
allowed-tools: Read, Edit, Bash(tsc:*)
model: inherit
---

# TypeScript 类型系统专家

你是 TypeScript 类型系统的资深专家,擅长解决复杂类型问题。

## 核心能力

### 1. 类型诊断
- 识别类型错误的根本原因
- 理解复杂的类型推导
- 解决泛型约束问题

### 2. 类型优化
- 简化复杂类型定义
- 使用适当的工具类型 (Partial, Pick, Omit, etc.)
- 优化类型性能

### 3. 最佳实践
- 优先使用接口 (`interface`) 定义对象形状
- 使用类型别名 (`type`) 定义联合类型、交叉类型
- 避免过度使用 `any` 和 `unknown`
- 合理使用类型断言

## 工作流程

1. **分析类型错误**
   ```bash
   tsc --noEmit  # 检查类型错误
   ```

2. **理解上下文**
   - 读取相关文件
   - 理解类型依赖关系
   - 识别问题模式

3. **提供解决方案**
   - 修复类型定义
   - 添加必要的类型注解
   - 重构以提高类型安全

4. **验证修复**
   ```bash
   tsc --noEmit  # 验证修复
   ```

## 常见问题模式

### 模式 1: 泛型约束
```typescript
// ❌ 问题
function getValue<T>(obj: T, key: string) {
  return obj[key]; // Error: Element implicitly has 'any' type
}

// ✅ 解决
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 模式 2: 联合类型收窄
```typescript
// ❌ 问题
type Shape = Circle | Square;
function area(shape: Shape) {
  return shape.radius * Math.PI; // Error: Property 'radius' does not exist
}

// ✅ 解决 (类型守卫)
function area(shape: Shape) {
  if ('radius' in shape) {
    return shape.radius * Math.PI;
  }
  return shape.size * shape.size;
}
```

## 输出格式

### 类型错误诊断报告
```markdown
## TypeScript 类型问题诊断

### 错误描述
[具体的类型错误信息]

### 根本原因
[为什么会出现这个错误]

### 解决方案
[具体的代码修改]

### 验证
[如何验证修复是否成功]
```
```

#### 示例 2: 测试驱动开发 Skill

```markdown
---
name: tdd-expert
description: 测试驱动开发专家。编写测试用例、重构代码以提高可测试性时主动使用。
allowed-tools: Read, Write, Edit, Bash(npm test:*), Bash(jest:*)
context: fork
agent: general-purpose
---

# 测试驱动开发 (TDD) 专家

你是 TDD 方法论的资深实践者,遵循 Red-Green-Refactor 循环。

## 核心原则

### TDD 循环
1. **Red** - 编写失败的测试
2. **Green** - 编写最少代码使测试通过
3. **Refactor** - 重构代码保持测试通过

## 工作流程

### 阶段 1: 理解需求
- 明确功能需求
- 识别边界条件
- 确定输入输出

### 阶段 2: 编写测试 (Red)
```typescript
// 示例: 为新功能编写测试
describe('calculateDiscount', () => {
  it('应该为 VIP 用户返回 20% 折扣', () => {
    const result = calculateDiscount(100, 'VIP');
    expect(result).toBe(80);
  });
  
  it('应该为普通用户返回 10% 折扣', () => {
    const result = calculateDiscount(100, 'REGULAR');
    expect(result).toBe(90);
  });
  
  it('应该对无效用户类型抛出错误', () => {
    expect(() => calculateDiscount(100, 'INVALID')).toThrow();
  });
});
```

### 阶段 3: 实现功能 (Green)
```typescript
function calculateDiscount(amount: number, userType: string): number {
  if (userType === 'VIP') {
    return amount * 0.8;
  }
  if (userType === 'REGULAR') {
    return amount * 0.9;
  }
  throw new Error(`Invalid user type: ${userType}`);
}
```

### 阶段 4: 运行测试
```bash
npm test -- calculateDiscount.test.ts
```

### 阶段 5: 重构 (Refactor)
```typescript
// 重构为更清晰的实现
const DISCOUNT_RATES = {
  VIP: 0.2,
  REGULAR: 0.1,
} as const;

function calculateDiscount(
  amount: number, 
  userType: keyof typeof DISCOUNT_RATES
): number {
  const discountRate = DISCOUNT_RATES[userType];
  if (discountRate === undefined) {
    throw new Error(`Invalid user type: ${userType}`);
  }
  return amount * (1 - discountRate);
}
```

### 阶段 6: 验证重构
```bash
npm test -- calculateDiscount.test.ts
```

## 测试类型

### 1. 单元测试
- 测试单个函数/方法
- Mock 外部依赖
- 快速执行

### 2. 集成测试
- 测试多个组件协作
- 使用真实依赖或测试替身
- 验证端到端流程

### 3. 边界测试
- 测试边界条件
- 测试异常情况
- 测试空值/零值

## 最佳实践

### ✅ DO
1. 测试先行,代码随后
2. 一次只测试一个概念
3. 测试名称描述预期行为
4. 保持测试独立
5. 使用 AAA 模式 (Arrange-Act-Assert)

### ❌ DON'T
1. 不要测试实现细节
2. 不要编写脆弱的测试
3. 不要忽略失败的测试
4. 不要过度 Mock

## 输出格式

### TDD 实施报告
```markdown
## TDD 实施报告

### 需求
[功能需求描述]

### 测试用例
1. [测试场景 1]
2. [测试场景 2]
3. [边界条件]

### 实现代码
[代码实现]

### 测试结果
✅ 通过: X 个
❌ 失败: Y 个

### 覆盖率
- 语句覆盖: Z%
- 分支覆盖: W%
```
```

#### 示例 3: 数据库优化 Skill

```markdown
---
name: database-performance-optimizer
description: 数据库性能优化专家。分析慢查询、优化索引、改进查询性能时使用。
allowed-tools: Read, Bash(psql:*), Bash(mysql:*), Grep
context: fork
---

# 数据库性能优化专家

你是数据库性能调优的专家,擅长 PostgreSQL、MySQL 等关系型数据库。

## 核心能力

### 1. 慢查询分析
- 识别性能瓶颈
- 分析查询执行计划
- 找出低效查询模式

### 2. 索引优化
- 设计合适的索引策略
- 识别缺失的索引
- 删除冗余索引

### 3. 查询优化
- 重写低效查询
- 优化 JOIN 操作
- 减少子查询

## 工作流程

### 步骤 1: 识别慢查询

#### PostgreSQL
```sql
-- 开启慢查询日志
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1秒

-- 查询最慢的查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### MySQL
```sql
-- 查看慢查询
SELECT * FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;
```

### 步骤 2: 分析执行计划

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id;
```

**关注点**:
- Seq Scan → 应该使用索引扫描
- Nested Loop → 可能需要优化 JOIN
- 高成本 (cost) → 需要优化

### 步骤 3: 索引建议

```sql
-- 创建索引
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 复合索引
CREATE INDEX idx_orders_user_status 
ON orders(user_id, status);
```

### 步骤 4: 查询重写

#### 优化前
```sql
-- ❌ 低效: 使用子查询
SELECT * FROM users
WHERE id IN (
  SELECT user_id FROM orders 
  WHERE status = 'completed'
);
```

#### 优化后
```sql
-- ✅ 高效: 使用 JOIN
SELECT DISTINCT u.* 
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';
```

### 步骤 5: 验证优化效果

```sql
-- 对比优化前后的执行时间
EXPLAIN ANALYZE [优化后的查询];
```

## 常见优化模式

### 模式 1: N+1 查询问题
```sql
-- ❌ N+1 问题
for each user:
  SELECT * FROM orders WHERE user_id = ?

-- ✅ 批量查询
SELECT * FROM orders 
WHERE user_id IN (1, 2, 3, ...);
```

### 模式 2: 全表扫描
```sql
-- ❌ 全表扫描
SELECT * FROM large_table WHERE status = 'active';

-- ✅ 使用索引
CREATE INDEX idx_status ON large_table(status);
SELECT * FROM large_table WHERE status = 'active';
```

### 模式 3: 过度索引
```sql
-- ❌ 冗余索引
CREATE INDEX idx_user_id ON orders(user_id);
CREATE INDEX idx_user_id_status ON orders(user_id, status);
-- 第一个索引是冗余的

-- ✅ 仅保留复合索引
CREATE INDEX idx_user_id_status ON orders(user_id, status);
```

## 输出格式

### 性能优化报告
```markdown
## 数据库性能优化报告

### 1. 慢查询分析
| 查询 | 平均时间 | 调用次数 | 优先级 |
|------|---------|---------|--------|
| [SQL] | XXms | X次 | 高 |

### 2. 优化建议
#### 索引建议
- [CREATE INDEX ...]
- [CREATE INDEX ...]

#### 查询重写
- [原查询] → [优化后查询]

### 3. 预期效果
- 查询时间: XXms → YYms (提升 Z%)
- 吞吐量: 预计提升 W%
```
```

### 最佳实践

#### ✅ DO - 推荐做法

1. **明确专业领域**
```markdown
# ✅ 好
name: react-hooks-optimizer
description: React Hooks 性能优化专家。优化 useEffect 依赖、减少重渲染时使用。

# ❌ 不好
name: react-expert
description: React 专家
```

2. **提供完整工作流程**
```markdown
## 工作流程
1. 分析当前问题
2. 识别优化机会
3. 实施改进
4. 验证效果
```

3. **包含实例和模式**
```markdown
## 常见模式

### 模式 1: [场景]
[示例代码]

### 模式 2: [场景]
[示例代码]
```

4. **结构化输出**
```markdown
## 输出格式
[定义清晰的输出结构]
```

#### ❌ DON'T - 避免做法

1. **避免过于宽泛**
```markdown
# ❌ 太宽泛
description: "处理所有编程问题"

# ✅ 具体
description: "TypeScript 类型错误诊断和修复"
```

2. **避免缺少上下文**
```markdown
# ❌ 缺少上下文
你是专家。帮我解决问题。

# ✅ 完整上下文
你是 [领域] 专家。
核心能力: [列表]
工作流程: [步骤]
```

3. **避免工具权限不足**
```markdown
# ❌ 缺少必要工具
allowed-tools: Read  # 但需要执行测试

# ✅ 完整工具
allowed-tools: Read, Write, Bash(npm test:*)
```

### 调试技巧

#### 查看已加载的 Skills
```bash
codebuddy
> /skills
```

#### 测试 Skill 是否被调用
```bash
# 1. 创建测试 Skill
mkdir -p .codebuddy/skills/test-skill
echo '---
name: test-skill
description: 测试技能,当用户说"测试skill"时调用
---
我是测试技能,已被成功调用!
' > .codebuddy/skills/test-skill/SKILL.md

# 2. 重启 CodeBuddy

# 3. 测试
> 测试skill
# 应该看到 AI 调用了 test-skill
```

---

## Agents 编写指南

### 概述

Agents (子代理) 是专用的 AI 助手,具有独立的上下文窗口和系统提示,用于处理特定类型的任务。

### 基础结构

```markdown
---
name: agent-name
description: 何时调用此代理的明确描述
tools: Read, Write, Bash, Grep
model: inherit
permissionMode: default
skills: skill1, skill2
---

你是一个 [专业领域] 专家。

## 职责
- 职责 1
- 职责 2

## 被调用时
1. 执行步骤 1
2. 执行步骤 2

## 输出格式
[定义输出结构]
```

### Frontmatter 字段详解

| 字段 | 必需 | 类型 | 说明 | 示例 |
|------|------|------|------|------|
| `name` | ✅ | string | 代理名称 | `"code-reviewer"` |
| `description` | ✅ | string | 何时调用此代理 | `"代码审查专家。审查代码质量时使用。"` |
| `tools` | ❌ | string | 允许的工具,逗号分隔 | `"Read, Grep, Bash"` |
| `model` | ❌ | string | 使用的模型或 `inherit` | `"glm-5.0"`, `"claude-3-5-sonnet"` 或 `"inherit"` |
| `permissionMode` | ❌ | string | 权限模式 | `"default"`, `"acceptEdits"`, `"bypassPermissions"` |
| `skills` | ❌ | string | 自动加载的技能 | `"typescript-expert, testing"` |

### Model 配置

```markdown
# 使用国内模型
model: glm-5.0
model: deepseek-v3.2
model: kimi-k2.5

# 使用国际模型
model: claude-3-5-sonnet
model: gpt-4o
model: gemini-2.5-pro

# 继承主对话的模型
model: inherit

# 省略 (使用默认子代理模型)
# model: (不指定)
```

**选择建议**:
- `inherit`: 保持模型一致性
- 特定模型: 需要特定能力 (如 GPT-4 的推理能力)
- 省略: 使用配置的默认模型

### Permission Mode

| 模式 | 说明 | 使用场景 |
|------|------|----------|
| `default` | 正常权限检查 | 默认模式 |
| `acceptEdits` | 自动接受编辑操作 | 代码格式化、自动修复 |
| `bypassPermissions` | 绕过所有权限检查 | 可信的自动化任务 |
| `plan` | 计划模式权限 | 计划阶段的代理 |

### 调用方式

#### 自动调用

AI 根据任务和代理的 `description` 自动选择:

```markdown
---
description: 代码审查专家。主动审查代码质量、安全性。在代码变更后立即使用。
---
```

用户输入: "帮我审查最近的代码变更"
→ AI 自动调用 `code-reviewer` 代理

#### 手动调用

用户显式指定:

```bash
> 使用 code-reviewer 代理审查我的代码
> 让 debugger 代理帮我找出这个 bug
```

### 实战示例

#### 示例 1: 代码审查代理

```markdown
---
name: code-reviewer
description: 代码审查专家。主动审查代码质量、安全性和可维护性。在编写或修改代码后立即使用。
tools: Read, Grep, Glob, Bash(git:*)
model: inherit
permissionMode: default
---

你是一位确保代码质量和安全性高标准的高级代码审查员。

## 被调用时

1. 运行 `git diff` 查看最近的更改
2. 专注于修改的文件
3. 立即开始审查

## 审查清单

### 1. 代码质量

#### 可读性
- ✅ 代码清晰易读
- ✅ 函数和变量命名良好
- ✅ 适当的注释和文档
- ✅ 一致的代码风格

#### 可维护性
- ✅ 没有重复代码 (DRY 原则)
- ✅ 函数保持单一职责 (SRP)
- ✅ 模块化设计良好
- ✅ 避免过度耦合

#### 复杂度
- ✅ 圈复杂度合理 (< 10)
- ✅ 嵌套层级不超过 3 层
- ✅ 函数长度适中 (< 50 行)

### 2. 安全性

#### 凭据安全
- 🔒 没有暴露的 API 密钥
- 🔒 没有硬编码的密码
- 🔒 没有敏感信息泄露

#### 输入验证
- 🔒 实现了输入验证
- 🔒 防范 SQL 注入
- 🔒 防范 XSS 攻击
- 🔒 防范 CSRF 攻击

#### 权限控制
- 🔒 实现了适当的授权检查
- 🔒 遵循最小权限原则

### 3. 性能

#### 算法效率
- ⚡ 使用合适的数据结构
- ⚡ 避免不必要的循环嵌套
- ⚡ 优化数据库查询
- ⚡ 避免 N+1 查询问题

#### 资源管理
- ⚡ 正确关闭文件/连接
- ⚡ 避免内存泄漏
- ⚡ 合理使用缓存

### 4. 测试

#### 测试覆盖
- 🧪 单元测试覆盖关键逻辑
- 🧪 边界条件测试
- 🧪 错误处理测试
- 🧪 集成测试

#### 测试质量
- 🧪 测试清晰且可维护
- 🧪 使用有意义的断言
- 🧪 避免脆弱的测试

## 审查流程

### 步骤 1: 获取变更
```bash
git diff HEAD~1
```

### 步骤 2: 列出修改的文件
```bash
git diff --name-only HEAD~1
```

### 步骤 3: 逐文件审查

对每个修改的文件:
1. 读取完整文件内容 (理解上下文)
2. 关注修改的行 (diff 高亮部分)
3. 检查相关依赖 (导入的模块、调用的函数)
4. 验证测试覆盖 (是否有对应的测试)

### 步骤 4: 编写审查报告

## 输出格式

```markdown
## 代码审查报告

### 🔴 严重问题 (必须修复)
1. **文件: [路径]:[行号]**
   - 问题: [具体问题]
   - 风险: [影响范围]
   - 修复建议:
     ```[language]
     [修复代码]
     ```

### 🟡 警告 (应该修复)
1. **文件: [路径]:[行号]**
   - 问题: [具体问题]
   - 影响: [可能的影响]
   - 修复建议:
     ```[language]
     [修复代码]
     ```

### 🟢 建议 (考虑改进)
1. **文件: [路径]:[行号]**
   - 建议: [改进建议]
   - 好处: [改进带来的好处]
   - 改进方案:
     ```[language]
     [改进代码]
     ```

### ✅ 优点
- [好的实践 1]
- [好的实践 2]

### 📊 统计
- 修改文件: X 个
- 新增代码: +Y 行
- 删除代码: -Z 行
- 严重问题: A 个
- 警告: B 个
- 建议: C 个
```

## 特定语言审查要点

### TypeScript
- 启用 `strict` 模式
- 避免使用 `any` 类型
- 使用接口定义契约
- 优先使用 `const` 和 `let`

### Python
- 遵循 PEP 8 风格指南
- 使用类型提示 (Type Hints)
- 适当的异常处理
- 使用上下文管理器 (with 语句)

### Go
- 遵循 Go 代码规范
- 正确的错误处理 (不忽略错误)
- 使用 defer 清理资源
- 避免过度使用 goroutine

## 审查原则

1. **建设性**: 提供具体可行的改进建议
2. **客观**: 基于事实和标准,而非个人偏好
3. **全面**: 覆盖质量、安全、性能、测试
4. **优先级**: 明确区分必须修复和可选改进
5. **鼓励**: 认可好的实践和改进
```

#### 示例 2: 调试专家代理

```markdown
---
name: debugger
description: 错误、测试失败和异常的调试专家。遇到任何错误或问题时主动使用。
tools: Read, Edit, Bash, Grep, Glob
model: gpt-5-codex
permissionMode: acceptEdits
---

你是一位专门从事根因分析的专家级调试器。

## 被调用时

1. 捕获错误消息和堆栈跟踪
2. 确定复现步骤
3. 隔离故障位置
4. 实现最小修复
5. 验证解决方案有效

## 调试流程

### 步骤 1: 收集信息

#### 错误信息
- 错误类型
- 错误消息
- 堆栈跟踪

#### 环境信息
```bash
node --version
npm --version
git log --oneline -5
```

#### 最近变更
```bash
git diff HEAD~1
```

### 步骤 2: 复现问题

尝试复现:
```bash
npm test
# 或
npm run dev
```

### 步骤 3: 形成假设

基于错误信息和代码,形成可能原因的假设:
1. 假设 1: [原因描述]
2. 假设 2: [原因描述]
3. 假设 3: [原因描述]

### 步骤 4: 验证假设

逐个验证假设:
- 添加日志语句
- 使用调试器
- 编写测试用例

### 步骤 5: 实施修复

找到根因后,实施最小修复:
```[language]
[修复代码]
```

### 步骤 6: 验证修复

```bash
npm test
```

确保:
- 原问题已解决
- 没有引入新问题
- 所有测试通过

## 常见问题模式

### 模式 1: 空值/未定义
```typescript
// ❌ 问题
function getName(user) {
  return user.name.toUpperCase(); // TypeError: Cannot read property 'name' of undefined
}

// ✅ 修复
function getName(user) {
  return user?.name?.toUpperCase() ?? 'Unknown';
}
```

### 模式 2: 异步问题
```typescript
// ❌ 问题
async function fetchData() {
  const data = fetch('/api/data'); // Missing await
  console.log(data); // Promise { <pending> }
}

// ✅ 修复
async function fetchData() {
  const data = await fetch('/api/data');
  console.log(data);
}
```

### 模式 3: 作用域问题
```javascript
// ❌ 问题
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 打印 3, 3, 3
}

// ✅ 修复
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 打印 0, 1, 2
}
```

## 调试工具

### 日志调试
```typescript
console.log('Variable value:', variable);
console.debug('Entering function:', functionName);
console.error('Error occurred:', error);
```

### 断点调试 (Node.js)
```bash
node inspect app.js
```

### 测试驱动调试
```typescript
// 编写失败的测试复现问题
test('should handle null user', () => {
  expect(() => getName(null)).not.toThrow();
});
```

## 输出格式

```markdown
## 调试报告

### 1. 问题描述
[错误消息和堆栈跟踪]

### 2. 复现步骤
1. [步骤 1]
2. [步骤 2]

### 3. 根因分析
[问题的根本原因]

### 4. 解决方案
```[language]
[修复代码]
```

### 5. 验证结果
- ✅ 原问题已解决
- ✅ 所有测试通过
- ✅ 没有引入新问题

### 6. 预防措施
[如何避免类似问题]
```
```

#### 示例 3: 性能优化代理

```markdown
---
name: performance-optimizer
description: 应用性能优化专家。处理性能问题、优化代码效率时使用。
tools: Read, Edit, Bash, Grep
model: gemini-3.0-pro
skills: profiling, caching
---

你是应用性能优化的资深专家。

## 核心能力

### 1. 性能分析
- 识别性能瓶颈
- 分析性能指标
- 生成性能报告

### 2. 代码优化
- 优化算法复杂度
- 减少不必要的计算
- 优化数据结构选择

### 3. 资源优化
- 减少内存占用
- 优化网络请求
- 优化数据库查询

## 工作流程

### 步骤 1: 性能基准测试

#### Node.js 性能分析
```bash
node --prof app.js
node --prof-process isolate-*.log > processed.txt
```

#### 前端性能
```javascript
// 使用 Performance API
performance.mark('start');
// ... 代码
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

### 步骤 2: 识别瓶颈

分析:
- CPU 密集型操作
- 内存泄漏
- 慢速 I/O 操作
- 重复计算

### 步骤 3: 优化实施

#### 优化 1: 算法改进
```typescript
// ❌ O(n²) - 嵌套循环
function findDuplicates(arr: number[]): number[] {
  const duplicates = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}

// ✅ O(n) - 使用 Set
function findDuplicates(arr: number[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  
  for (const num of arr) {
    if (seen.has(num)) {
      duplicates.add(num);
    } else {
      seen.add(num);
    }
  }
  
  return Array.from(duplicates);
}
```

#### 优化 2: 缓存
```typescript
// ❌ 重复计算
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// ✅ 使用缓存
const fibCache = new Map<number, number>();

function fibonacci(n: number): number {
  if (n <= 1) return n;
  
  if (fibCache.has(n)) {
    return fibCache.get(n)!;
  }
  
  const result = fibonacci(n - 1) + fibonacci(n - 2);
  fibCache.set(n, result);
  return result;
}
```

#### 优化 3: 懒加载
```typescript
// ❌ 一次性加载所有数据
const allData = await loadAllData(); // 可能很慢

// ✅ 按需加载
async function* loadDataChunks() {
  for (let i = 0; i < totalChunks; i++) {
    yield await loadChunk(i);
  }
}
```

### 步骤 4: 验证改进

```bash
# 运行性能测试
npm run benchmark

# 对比优化前后
```

## 性能优化模式

### 模式 1: 避免不必要的重渲染 (React)
```typescript
// ❌ 每次都重新创建函数
function Component() {
  const handleClick = () => console.log('clicked');
  return <button onClick={handleClick}>Click</button>;
}

// ✅ 使用 useCallback
function Component() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  return <button onClick={handleClick}>Click</button>;
}
```

### 模式 2: 虚拟化长列表
```typescript
// ❌ 渲染所有项
{items.map(item => <Item key={item.id} data={item} />)}

// ✅ 虚拟化 (react-window)
<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      <Item data={items[index]} />
    </div>
  )}
</FixedSizeList>
```

### 模式 3: 数据库查询优化
```typescript
// ❌ N+1 查询
const users = await User.findAll();
for (const user of users) {
  const posts = await Post.findAll({ where: { userId: user.id } });
}

// ✅ 预加载
const users = await User.findAll({
  include: [{ model: Post }]
});
```

## 输出格式

```markdown
## 性能优化报告

### 1. 性能基准
- 优化前: XXms
- 优化后: YYms
- 提升: ZZ%

### 2. 识别的瓶颈
1. [瓶颈 1]: [描述]
2. [瓶颈 2]: [描述]

### 3. 实施的优化
#### 优化 1: [标题]
- 方法: [优化方法]
- 效果: [性能提升]
- 代码:
  ```[language]
  [优化后的代码]
  ```

### 4. 建议
- [后续优化建议 1]
- [后续优化建议 2]
```
```

### 最佳实践

#### ✅ DO - 推荐做法

1. **明确职责范围**
```markdown
# ✅ 好
description: 代码审查专家。审查代码质量、安全性。代码变更后使用。

# ❌ 不好
description: 代码专家
```

2. **提供详细的工作流程**
```markdown
## 被调用时
1. [具体步骤 1]
2. [具体步骤 2]
3. [具体步骤 3]
```

3. **定义清晰的输出格式**
```markdown
## 输出格式
[结构化的输出模板]
```

4. **合理配置权限**
```markdown
# 代码审查 - 只读
tools: Read, Grep, Glob, Bash(git:*)

# 代码修复 - 可编辑
tools: Read, Edit, Bash(npm test:*)
permissionMode: acceptEdits
```

#### ❌ DON'T - 避免做法

1. **避免职责不清**
```markdown
# ❌ 职责过多
description: "处理所有开发任务的通用代理"

# ✅ 职责明确
description: "TypeScript 类型错误修复专家"
```

2. **避免缺少指导**
```markdown
# ❌ 缺少指导
你是专家,帮我处理问题。

# ✅ 完整指导
你是 [领域] 专家。
核心能力: [列表]
工作流程: [步骤]
输出格式: [模板]
```

---

## Plugins 编写指南

### 概述

Plugins (插件) 是可复用的功能包，用于扩展和定制 CodeBuddy CLI 的功能。插件可以包含 Commands、Skills、Hooks 等组件，支持通过 Plugin Marketplace 进行分发和安装。

**核心组成**：
- **Commands（命令）**：用户可手动触发的斜杠命令（如 `/plugin-name:command`）
- **Skills（技能）**：AI 自动识别并调用的专业能力模板
- **Hooks（钩子）**：在特定事件（如用户提交提示）触发时自动执行的操作
- **MCP/LSP 配置**：扩展模型和语言服务器支持

### 插件目录结构

标准的插件目录结构如下：

```
my-plugin/
├── .codebuddy-plugin/
│   └── plugin.json        # 插件清单文件（必需）
├── commands/              # 命令目录（可选）
│   └── example.md
├── skills/                # 技能目录（可选）
│   └── SKILL.md
├── hooks/                 # 钩子目录（可选）
│   └── hooks.json
├── .mcp.json              # MCP 配置（可选）
└── .lsp.json              # LSP 配置（可选）
```

### plugin.json 格式

插件的清单文件 `plugin.json` 定义了插件的基本信息和包含的组件：

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "插件描述",
  "author": {
    "name": "作者",
    "email": "author@example.com"
  },
  "commands": [
    {
      "name": "example",
      "description": "示例命令"
    }
  ],
  "skills": [
    {
      "name": "custom-skill",
      "description": "自定义技能"
    }
  ],
  "hooks": "./hooks/hooks.json"
}
```

**字段说明**：
- `name`：插件名称（必需）
- `version`：版本号，建议使用语义化版本（必需）
- `description`：插件描述（必需）
- `author`：作者信息（可选）

**完整配置示例（基于官网 plugins-reference 验证）**：

```json
{
  "name": "deployment-tool",
  "version": "1.0.0",
  "description": "部署自动化插件",
  "author": {
    "name": "团队",
    "email": "team@example.com"
  },
  "commands": ["./custom/deploy.md"],  // 补充默认commands/目录
  "agents": "./custom/agents/",
  "hooks": "./hooks/custom.json",
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./servers/server.js"],
      "env": {"PORT": "3000"}
    }
  },
  "lspServers": "./.lsp.json"
}
```

**路径解析规则**：
- 所有路径以 `./` 开头，相对插件根目录。
- 默认目录（如 `commands/`）与自定义路径内容**合并加载**。
- 环境变量 `${CODEBUDDY_PLUGIN_ROOT}` 指向插件绝对路径。

**支持的组件**：
- `commands`：包含的命令列表（可选），可指定自定义路径或数组
- `skills`：包含的技能列表（可选）
- `hooks`：钩子配置文件路径（可选）
- `agents`：Agents 配置路径（可选）
- `mcpServers`：MCP 服务器配置对象（可选）
- `lspServers`：LSP 服务器配置路径（可选）

### Commands 组件

Commands 是用户可以通过斜杠命令手动触发的操作。

**文件位置**：`commands/example.md`

**格式示例**：

```markdown
---
description: "示例命令"
argument-hint: "[参数]"
---

这是一个示例命令。参数：$1
```

**使用方式**：用户输入 `/my-plugin:example` 触发。

### Skills 组件

Skills 是 AI 自动识别和调用的能力模板。

**文件位置**：`skills/SKILL.md`

**格式示例**：

```markdown
---
name: custom-skill
description: 明确描述何时 AI 应该调用此技能
allowed-tools: Read, Write, Bash
user-invocable: true
context: fork
---

# 自定义技能

你是一个 [专业领域] 专家。

## 核心能力
- 能力 1
- 能力 2

## 工作流程
1. 步骤 1
2. 步骤 2

## 可用工具
- Read: 读取文件
- Write: 写入文件
- Bash: 执行命令
```

### Hooks 组件

Hooks 在特定事件触发时自动执行操作。

**文件位置**：`hooks/hooks.json`

**格式示例**：

```json
{
  "hooks": {
    "user-prompt-submit-hook": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'User submitted: $INPUT'"
          }
        ]
      }
    ]
  }
}
```

### LSP 组件

LSP（Language Server Protocol）为 AI 提供实时代码智能功能，如类型定义、函数签名等。

**配置文件**：`.lsp.json`

**格式示例**：

```json
{
  "go": {
    "command": "gopls",
    "args": ["serve"],
    "extensionToLanguage": {
      ".go": "go"
    }
  },
  "python": {
    "command": "pylsp",
    "args": [],
    "extensionToLanguage": {
      ".py": "python"
    }
  }
}
```

**注意**：用户需预先安装对应的语言服务器（如 `gopls`、`pylsp`）。

### 插件市场类型

CodeBuddy 支持四种插件市场类型：

#### 1. GitHub 市场

从 GitHub 仓库获取插件。

**添加命令**：
```bash
/plugin marketplace add owner/repo
```

**要求**：目标 GitHub 仓库的根目录下必须存在 `.codebuddy-plugin/marketplace.json` 文件。

**仓库结构**：

```
repo/
├── .codebuddy-plugin/
│   └── marketplace.json
└── plugins/
    └── plugin1/
        └── .codebuddy-plugin/
            └── plugin.json
```

**marketplace.json 格式**：

```json
{
  "name": "market-name",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@company.com"
  },
  "plugins": [
    {
      "name": "plugin1",
      "source": "plugins/plugin1",
      "description": "插件描述",
      "version": "2.1.0"
    }
  ]
}
```

#### 2. Git 仓库市场

从任何 Git 仓库（如 GitLab、Gitee 等）获取插件。

**添加命令**：
```bash
# 使用 HTTPS URL
/plugin marketplace add https://gitlab.com/company/plugins.git

# 使用 SSH URL
/plugin marketplace add git@gitlab.com:company/plugins.git

# 支持带 .git 后缀的 URL
/plugin marketplace add https://github.com/owner/repo.git
```

**仓库结构**：与 GitHub 市场相同。

#### 3. 本地目录市场（开发用）

从本地文件系统加载插件，适用于分发前的本地测试和开发。

**添加命令**：
```bash
# 添加本地目录
/plugin marketplace add ./my-marketplace

# 或直接指向 marketplace.json 文件
/plugin marketplace add ./path/to/marketplace.json
```

**结构**：与 GitHub 市场类似，但基于本地文件系统。

#### 4. HTTP 市场

通过 HTTP(S) 服务器获取插件清单和插件包。

**添加命令**：
```bash
/plugin marketplace add https://url.of/marketplace.json
```

**要求**：
- 服务器需提供 `/marketplace.json`（市场清单）
- 服务器需提供 `/plugins/<plugin-name>/plugin.json`（插件清单）
- 支持插件文件下载

### 使用插件市场

#### 从市场安装插件

```bash
# 从指定市场安装插件
/plugin install plugin-name@marketplace-name

# 交互式浏览并安装插件
/plugin
```

#### 验证和管理市场

```bash
# 列出所有已添加的市场
/plugin marketplace list

# 更新指定市场的元数据
/plugin marketplace update marketplace-name

# 移除市场（注意：会同时卸载从其安装的所有插件）
/plugin marketplace remove marketplace-name
```

### 插件管理方式

#### 方式一：团队配置自动安装（推荐）

通过项目根目录下的 `.codebuddy/settings.json` 文件配置插件市场和插件，实现自动化安装。

**配置示例**：

```json
{
  "extraKnownMarketplaces": {
    "team-marketplace": {
      "source": {
        "source": "github",
        "repo": "your-org/team-plugins-marketplace"
      }
    }
  },
  "enabledPlugins": {
    "team-plugin-a@team-marketplace": true,
    "team-plugin-b@team-marketplace": true
  }
}
```

**配置说明**：
- `extraKnownMarketplaces`：定义额外的插件市场（支持 `github`、`git`、`url` 类型）
- `enabledPlugins`：指定要启用的插件（格式为 `插件名@市场名`）

**自动安装流程**：
1. CodeBuddy 启动时检测配置文件
2. 自动安装 `extraKnownMarketplaces` 中未安装的市场
3. 自动安装 `enabledPlugins` 中已启用但未安装的插件
4. 整个过程在后台异步执行，不影响启动速度

**优势**：
- 团队统一配置
- 自动化安装
- 版本控制

#### 方式二：交互式界面

在 CodeBuddy 对话中输入 `/plugin` 打开插件管理界面。

**界面标签页**：
- **Discover**：浏览所有可用插件
- **Browse**：从已配置的市场中安装插件
- **Installed**：管理已安装插件（启用/禁用/卸载）
- **Marketplaces**：管理插件市场
- **Add Marketplace**：添加新市场源
- **Errors**：查看错误信息

**示例命令**：

```bash
/plugin                          # 打开管理界面
/plugin install my-plugin        # 安装插件
/plugin enable my-plugin         # 启用插件
```

#### 方式三：命令行子命令

在终端中使用 `codebuddy plugin` 命令管理插件。

**常用命令**：

```bash
# 安装插件
codebuddy plugin install my-plugin
codebuddy plugin install my-plugin@marketplace-name

# 启用/禁用插件
codebuddy plugin enable my-plugin
codebuddy plugin disable my-plugin

# 管理市场
codebuddy plugin marketplace add https://github.com/username/repo
codebuddy plugin marketplace list

# 查看插件信息
codebuddy plugin info my-plugin

# 卸载插件
codebuddy plugin uninstall my-plugin
```

### 插件文件位置

插件安装后的文件位置：

```
~/.codebuddy/plugins/
├── cache/                    # 下载的插件
├── installed_plugins.json    # 已安装插件列表
├── known_marketplaces.json   # 已添加的市场
└── marketplaces/             # 市场数据
```

### 最佳实践

#### 插件开发

1. **遵循命名规范**
   - 使用清晰的插件名称
   - 遵循语义化版本

2. **提供完整元数据**
   - 描述清晰准确
   - 包含作者信息和联系方式

3. **测试充分**
   - 本地测试所有功能
   - 验证与不同工具的兼容性

4. **文档完善**
   - 提供使用说明
   - 包含示例和最佳实践

#### 安全

1. **仅从可信源安装插件**
   - 官方市场
   - 受信任的社区市场

2. **审查插件代码**
   - 检查安全性
   - 验证权限要求

3. **限制权限**
   - 最小权限原则
   - 避免不必要的工具访问

#### 发布流程

1. **本地测试**
   - 功能测试
   - 兼容性测试

2. **创建市场清单**
   - 准备 `marketplace.json`
   - 上传插件到仓库或服务器

3. **分享市场地址**
   - 提供市场 URL
   - 添加安装说明

### 创建自己的市场

#### 1. 创建市场文件

在 Git 仓库根目录创建 `.codebuddy-plugin/marketplace.json` 文件。

**基本结构示例**：
```json
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@company.com"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0"
    },
    {
      "name": "deployment-tools",
      "source": {
        "source": "github",
        "repo": "company/deploy-plugin"
      },
      "description": "Deployment automation tools"
    }
  ]
}
```

#### 2. 插件来源（Source）类型

插件条目的 `source` 字段支持以下类型：

**相对路径（Local）**：
```json
"source": "./plugins/my-plugin"
```

**GitHub 仓库**：
```json
"source": {
  "source": "github",
  "repo": "owner/repo"
}
```

**Git URL**：
```json
"source": {
  "source": "url",
  "url": "https://gitlab.com/team/plugin.git"
}
```

#### 3. 高级插件配置

插件条目支持丰富的元数据和组件配置：

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "version": "1.0.0",
  "description": "插件描述",
  "author": {
    "name": "Author Name",
    "email": "author@example.com"
  },
  "license": "MIT",
  "commands": [
    {
      "name": "example",
      "description": "示例命令"
    }
  ],
  "agents": [
    {
      "name": "my-agent",
      "description": "专用代理"
    }
  ],
  "skills": [
    {
      "name": "custom-skill",
      "description": "自定义技能"
    }
  ],
  "hooks": "./hooks/hooks.json",
  "mcpServers": [
    {
      "name": "my-mcp",
      "config": "./.mcp.json"
    }
  ]
}
```

### 故障排除

#### 市场无法加载

**检查项**：
1. URL 可访问性（使用浏览器或 curl 测试）
2. `marketplace.json` 文件路径和格式是否正确
3. 网络连接状态
4. 对于私有仓库，确认有访问权限

#### 插件安装失败

**检查项**：
1. 插件源是否可访问
2. 插件目录结构是否完整（检查 `.codebuddy-plugin/plugin.json`）
3. 依赖项是否满足（如 LSP 需要对应的语言服务器）

#### 命令不可用

**检查项**：
1. 命令路径配置是否正确
2. Markdown 文件格式是否正确
3. 插件是否已启用

#### LSP 不工作

**检查项**：
1. 语言服务器是否已安装
2. `.lsp.json` 配置是否正确
3. 命令路径是否在 PATH 中

**启用调试**：
```bash
# 启动 CodeBuddy 时启用调试模式，查看详细日志
codebuddy --debug
```

调试模式会输出：
- 市场加载过程
- 插件安装详情
- 错误堆栈信息
- 网络请求详情

### 相关文档

- [Commands 编写指南](#commands-编写指南)
- [Skills 编写指南](#skills-编写指南)
- [Agents 编写指南](#agents-编写指南)
- [Hooks 编写指南](#hooks-编写指南)
- [Slash Commands 文档](./commands/README.md)
- [MCP 文档](https://modelcontextprotocol.io/)

---

## Hooks 编写指南

### 概述

Hooks (钩子) 是在特定事件发生时自动执行的脚本,用于自动化工作流、验证操作、记录日志等。

**功能状态**：Beta阶段（接口和行为可能在未来版本中调整）

**核心功能**：
- 完整支持九大事件类型
- 基于正则表达式的matcher匹配机制
- 自动注入session_id、会话转录文件等上下文信息
- 支持退出码与JSON输出双模式
- 提供CLI `/hooks`面板进行图形化配置
- 钩子脚本60秒超时自动终止

### 基础结构

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolName",
        "hooks": [
          {
            "type": "command",
            "command": "script to execute",
            "timeout": 60000,
            "description": "What this hook does"
          }
        ]
      }
    ]
  }
}
```

### Hook 事件类型

> ⚠️ **注意**：以下内容基于官网 https://www.codebuddy.cn/docs/ide/Features/Hooks 验证。IDE Hooks 支持7个核心触发事件。

| 事件名称 | 触发时机 | 匹配字段 | 主要用途 |
|---------|---------|-----------|---------|
| **SessionStart** | 新会话开始时（每个会话仅触发一次） | `source` (目前仅支持 `startup`) | 初始化项目环境、注入项目特定上下文、设置会话配置 |
| **SessionEnd** | 会话终止时（如切换、删除或清空会话） | `reason` (目前仅支持 `other`) | 清理临时资源、保存会话状态、生成报告 |
| **PreToolUse** | **任何工具执行之前** | `tool_name` (如 `Bash`, `Write`) | 验证/修改工具参数、阻止危险操作、权限检查、记录审计日志 |
| **PostToolUse** | 工具执行完成之后 | `tool_name` | 记录执行日志、后处理工具输出、触发后续操作 |
| **UserPromptSubmit** | 用户提交消息时 | (无匹配器，所有提交都触发) | 预处理用户输入、添加上下文信息、输入验证 |
| **Stop** | Agent完成响应时 | (无匹配器) | 提供反馈给Agent、记录执行状态 |
| **PreCompact** | 上下文即将被压缩时（手动或自动） | `trigger` (`manual` 或 `auto`) | 保存重要信息、提供压缩指导、备份完整上下文 |

### 核心事件详解

**1. SessionStart（会话启动）**
- **输入数据示例**：包含 `session_id`, `cwd`（项目路径）等。
- **典型应用**：在会话开始时自动告知AI项目使用的技术栈（如"本项目使用TypeScript + React"）。

**2. PreToolUse（工具执行前）** - **最常用的事件**
- **核心控制能力**：通过返回的JSON中的 `permissionDecision` 字段，可以实现：
    - **`allow`**：允许执行。
    - **`deny`**：阻止执行，并提供原因。
    - **`ask`**：请求用户确认。
    - **`modifiedInput`**：修改工具的参数后再执行（如自动为`npm install`添加安全参数）。
- **安全应用**：拦截危险的系统命令（如 `rm -rf /`）或文件操作。

**3. UserPromptSubmit（用户输入提交）**
- **典型应用**：检测用户输入中的特定关键词，并自动附加相关的项目文档或代码规范作为上下文，使AI的回答更准确。

**4. PreCompact（上下文压缩前）**
- **典型应用**：在AI忘记之前的长对话上下文前，自动将重要的讨论要点（如API设计、数据库 Schema）备份到文件或注入到压缩指导中。

### 工具名称说明（用于Pre/PostToolUse事件）

在Hook配置的`matcher`中，或脚本接收到的`tool_name`字段，会是以下工具名：

| CLI风格 | IDE风格 | 功能描述 |
| :--- | :--- | :--- |
| `Bash` | `execute_command` | 执行Shell命令 |
| `Write` | `write_to_file` | 写入文件 |
| `Edit` | `replace_in_file` | 编辑文件内容 |
| `Read` | `read_file` | 读取文件 |
| `Glob` | `list_dir` | 搜索/列出文件 |
| `Grep` | `search_content` | 搜索文件内容 |

### Claude Code vs CodeBuddy Hooks 完整对比

#### 一、Hook 事件类型对比

| Claude Code | CodeBuddy | 兼容性 | 说明 |
|-------------|-----------|--------|------|
| ✅ **PreToolUse** | ✅ **PreToolUse** | 🟢 完全相同 | 工具调用前触发 |
| ✅ **PostToolUse** | ✅ **PostToolUse** | 🟢 完全相同 | 工具调用后触发 |
| ✅ **PostToolUseFailure** | ❌ 不支持 | 🔴 不支持 | 工具调用失败时触发 |
| ✅ **PermissionRequest** | ❌ 不支持 | 🔴 不支持 | 权限请求时触发 |
| ✅ **Stop** | ✅ **Stop** | 🟢 完全相同 | 响应完成时触发 |
| ✅ **SubagentStart** | ❌ 不支持 | 🔴 不支持 | 子代理启动时触发 |
| ✅ **SubagentStop** | ✅ **SubagentStop** | 🟡 部分支持 | 子代理完成时触发 |
| ✅ **SessionStart** | ✅ **SessionStart** | 🟢 完全相同 | 会话启动时触发 |
| ✅ **SessionEnd** | ✅ **SessionEnd** | 🟢 完全相同 | 会话结束时触发 |
| ✅ **UserPromptSubmit** | ✅ **UserPromptSubmit** | 🟢 完全相同 | 用户提交输入时触发 |
| ✅ **PreCompact** | ✅ **PreCompact** | 🟡 环境变量调整 | 上下文压缩前触发 |
| ✅ **Notification** | ✅ **Notification** | 🔵 CodeBuddy 独有 | 发送通知时触发 |
| ✅ **TeammateIdle** | ❌ 不支持 | 🔴 不支持 | 团队成员空闲时触发 |
| ✅ **TaskCompleted** | ❌ 不支持 | 🔴 不支持 | 任务完成时触发 |

**统计对比：**

| 平台 | 支持的事件数 | 独有事件 |
|-----|------------|---------|
| **Claude Code** | 14 | PostToolUseFailure, PermissionRequest, SubagentStart, TeammateIdle, TaskCompleted |
| **CodeBuddy** | 9 | Notification |
| **共同支持** | 9 | PreToolUse, PostToolUse, Stop, SessionStart, SessionEnd, UserPromptSubmit, PreCompact, SubagentStop |

#### 二、Hook 配置兼容性

| Hook 类型 | 兼容性 | 需要调整 |
|-----------|--------|---------|
| PreToolUse - Bash | 🟢 兼容 | 环境变量 |
| PostToolUse - Edit | 🟢 兼容 | 路径引用 |
| Stop - * | 🟢 兼容 | 无需调整 |
| SessionStart - * | 🟢 兼容 | 无需调整 |
| SessionEnd - * | 🟢 兼容 | 无需调整 |
| PreCompact | 🟢 兼容 | 环境变量 |
| async hooks | 🟢 兼容 | 无需调整 |

#### 三、Hook 类型（执行方式）对比

| Hook 类型 | Claude Code | CodeBuddy |
|-----------|-------------|-----------|
| **Command** | ✅ 支持 | ✅ 支持 |
| **Prompt** | ✅ 支持 | ✅ 支持（仅 Stop、UserPromptSubmit、PreToolUse 事件） |
| **Agent** | ✅ 支持 | ❌ 不支持 |

#### 四、环境变量映射

| Claude Code | CodeBuddy | 用途 |
|-------------|-----------|------|
| `CLAUDE_PLUGIN_ROOT` | `CODEBUDDY_PLUGIN_ROOT` | 插件根目录 |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | `CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE` | 自动压缩比例 |
| `CLAUDE_PACKAGE_MANAGER` | `CODEBUDDY_PACKAGE_MANAGER` | 包管理器 |
| `CLAUDE_*` | `CODEBUDDY_*` | 其他配置 |

**CodeBuddy 新增环境变量**:
| 变量名 | 用途 | 示例 |
|--------|------|------|
| `CODEBUDDY_HOME` | 用户配置目录 | `~/.codebuddy` |

**平台特定环境变量**:
| 平台 | 用户目录变量 | 示例 |
|------|-------------|------|
| Windows | `%USERPROFILE%` | `C:\Users\username` |
| Linux/macOS | `$HOME` | `/home/username` |

**批量迁移命令：**
```bash
# 从 Claude Code 迁移到 CodeBuddy
find .codebuddy/scripts -name "*.js" -exec sed -i 's/CLAUDE_/CODEBUDDY_/g' {} \;

# 从 CodeBuddy 迁移到 Claude Code
find .claude/scripts -name "*.js" -exec sed -i 's/CODEBUDDY_/CLAUDE_/g' {} \;
```

#### 五、决策控制对比

**Claude Code 支持的决策模式：**

| 事件 | 决策模式 | 关键字段 |
|-----|---------|---------|
| UserPromptSubmit, PostToolUse, PostToolUseFailure, Stop, SubagentStop | Top-level | `decision: "block"`, `reason` |
| TeammateIdle, TaskCompleted | Exit code only | `exit 2` blocks |
| PreToolUse | hookSpecificOutput | `permissionDecision` (allow/deny/ask) |
| PermissionRequest | hookSpecificOutput | `decision.behavior` (allow/deny) |

**CodeBuddy 决策控制：**
- **简化模式**：主要依赖 exit codes (0=允许, 2=阻止)
- **JSON 输出**：支持基础 decision 字段
- **重要限制**：
  - ❌ **不支持** Agent 类型的 hooks
  - 支持 Command 和 Prompt 类型的 hooks（Prompt 类型仅适用于 Stop、UserPromptSubmit、PreToolUse 事件）

#### 六、Matcher 支持对比

| 事件 | Claude Code Matcher | CodeBuddy Matcher |
|-----|---------------------|-------------------|
| PreToolUse | 按工具名称 (Bash, Edit, Write, Read, Glob, Grep, Task, WebFetch, WebSearch, MCP) | 按工具名称 |
| PostToolUse | 按工具名称 | 按工具名称 |
| SessionStart | startup, resume, clear, compact | startup, resume, clear, compact |
| SessionEnd | clear, logout, prompt_input_exit, bypass_permissions_disabled, other | clear, logout, other |
| Notification | permission_prompt, idle_prompt, auth_success, elicitation_dialog | ⚠️ 仅支持 permission_prompt、idle_prompt |
| Stop | ❌ 不支持 matcher | ❌ 不支持 matcher |
| UserPromptSubmit | ❌ 不支持 matcher | ❌ 不支持 matcher |

#### 七、配置文件位置

> ⚠️ **重要**：CodeBuddy 使用统一的 `settings.json` 配置方式。虽然插件目录下可能有 `hooks/hooks.json` 文件，但仅作为配置来源，最终会合并到主 `settings.json` 的 `hooks` 字段中，不存在独立的 `hooks.json` 配置文件入口。

| 平台 | 用户级配置 | 项目级配置 | 配置方式 |
|-----|-----------|-----------|----------|
| Claude Code | `~/.claude/settings.json` | `.claude/settings.json` | hooks 配置在 `settings.json` 中 |
| CodeBuddy | `~/.codebuddy/settings.json` | `.codebuddy/settings.json` | hooks 配置在 `settings.json` 中（数组格式） |
| **CodeBuddy 扩展** | `~/.codebuddy/settings.local.json` | `.codebuddy/settings.local.json` | 本地配置（通常不提交到版本控制） |

#### 八、迁移建议

**从 Claude Code 迁移到 CodeBuddy：**
1. **配置方式**：使用 `.codebuddy/settings.json`（数组格式）
2. **事件类型**：移除 PostToolUseFailure, PermissionRequest, SubagentStart, TeammateIdle, TaskCompleted
3. **Hook 类型**：保留 Command 和 Prompt 类型的 hooks，移除 Agent 类型的 hooks
4. **环境变量**：批量替换 `CLAUDE_` → `CODEBUDDY_`
5. **决策控制**：简化 JSON 输出，优先使用 exit codes

**从 CodeBuddy 迁移到 Claude Code：**
1. **扩展支持**：可使用更多事件类型（如 TeammateIdle 用于质量门控）
2. **高级 Hooks**：可使用 agent hooks 实现智能决策
3. **环境变量**：批量替换 `CODEBUDDY_` → `CLAUDE_`

#### 用户级/项目级配置示例

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/validate_bash.py",
            "timeout": 3000,
            "description": "验证 Bash 命令安全性"
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
            "command": "python3 .codebuddy/hooks/format_code.py",
            "timeout": 8000,
            "description": "自动格式化代码"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/save_session.py",
            "timeout": 5000
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/extract_patterns.py",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

### Matcher 模式

| 模式 | 匹配规则 | 示例 |
|------|---------|------|
| `""` (空字符串) | 匹配所有 | `"matcher": ""` |
| `ToolName` | 精确匹配 | `"matcher": "Bash"` |
| `Tool1|Tool2` | 匹配任一工具 | `"matcher": "Edit|Write"` |
| `Bash(pattern)` | 工具 + 参数模式 | `"matcher": "Bash(git:*)"` |
| 正则表达式 | 复杂模式 | `"matcher": "mcp__.*"` |

### 环境变量

Hook 脚本可访问的环境变量:

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `CODEBUDDY_PLUGIN_ROOT` | **插件根目录** | `C:\Users\username\.codebuddy` |
| `CODEBUDDY_PROJECT_DIR` | **项目根目录** | `D:\projects\myapp` |
| `CODEBUDDY_HOME` | **用户配置目录** | `~/.codebuddy` |
| `FILE_PATH` | 文件路径 (PostToolUse) | `src/app.ts` |
| `TOOL_NAME` | 工具名称 | `"Edit"` |

**平台路径变量**:
| 平台 | 用户目录环境变量 | 用户目录路径 | ~ 快捷方式支持 |
|------|-----------------|-------------|---------------|
| Windows | `%USERPROFILE%` | `C:\Users\username` | ✅ PowerShell 支持 |
| Linux | `$HOME` | `/home/username` | ✅ Bash 支持 |
| macOS | `$HOME` | `/Users/username` | ✅ Bash/Zsh 支持 |

**路径变量使用规范**:

| 规则 | 说明 | 示例 |
|------|------|------|
| ✅ **插件脚本** | 使用 `CODEBUDDY_PLUGIN_ROOT` | `${CODEBUDDY_PLUGIN_ROOT}/hooks/xxx.js` |
| ✅ **项目数据** | 使用 `CODEBUDDY_PROJECT_DIR/.codebuddy` | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus` |
| ❌ **错误用法** | 不要混用变量 | `${CODEBUDDY_PROJECT_DIR}/.codebuddy/hooks` |

### Hooks 管理面板

CodeBuddy 提供了 CLI `/hooks` 命令来图形化管理hooks配置。

**使用方法**：
```bash
# 在CodeBuddy会话中执行
/hooks
```

**功能**：
- 查看所有已注册的hooks
- 启用/禁用特定hook
- 查看hook执行日志
- 快速添加新hook配置
- 导出/导入hook配置

**调试方法**：
1. 运行 `/hooks` 命令检查hook注册状态
2. 验证JSON配置语法
3. 手动测试hook命令
4. 检查脚本执行权限
5. 使用 `codebuddy --debug` 查看详细日志

**调试输出示例**：
```
[DEBUG] Executing hooks for PostToolUse:Write
[DEBUG] Found 1 hook commands to execute
[DEBUG] Hook command completed with status 0
```

### 输入输出

#### 输入 (stdin)

Hook 通过 stdin 接收 JSON 数据，包含以下基础字段：

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.json",
  "cwd": "/project/root",
  "permission_mode": "allow",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "src/app.ts",
    "old_string": "...",
    "new_string": "..."
  },
  "tool_output": {
    "success": true
  }
}
```

**方式2：JSON输出控制（高级）**

```json
{
  "continue": true,
  "stopReason": "string",
  "suppressOutput": true,
  "systemMessage": "string",
  "hookSpecificOutput": {
    // 事件特定输出...
  }
}
```

### 安全注意事项

#### 重要免责声明

**使用风险自负**：Hooks会在系统上自动执行任意shell命令，可能：
- 修改、删除或访问任何文件
- 导致数据丢失或系统损坏
- 需要用户对配置的命令负全部责任

#### 安全最佳实践

1. **验证和清理所有输入数据**
   - 对从stdin接收的所有数据进行验证
   - 避免直接将输入拼接到shell命令中

2. **始终引用shell变量**
   ```bash
   # ✅ 正确
   "$FILE_PATH"
   
   # ❌ 错误（易受注入攻击）
   $FILE_PATH
   ```

3. **阻止路径遍历攻击**
   - 验证文件路径不包含 `../` 等模式
   - 限制访问的目录范围

4. **使用绝对路径执行脚本**
   - 避免使用相对路径
   - 使用 `${CODEBUDDY_PROJECT_DIR}` 或 `${CODEBUDDY_PLUGIN_ROOT}`

5. **避免处理敏感文件**
   - 不要将密钥、密码、token写入日志
   - 谨慎处理包含敏感信息的文件

### Hook 数据格式

| 退出码 | 含义 | 效果 |
|--------|------|------|
| 0 | 成功 | 继续执行 |
| 1 | 失败 (非阻塞) | 记录错误,继续 |
| 2 | 阻止操作 (PreToolUse) | 取消工具调用 |

### 实战示例

#### 示例 1: 自动代码格式化

**hooks.json**:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/format_code.py",
            "timeout": 8000,
            "description": "自动格式化已编辑的代码"
          }
        ]
      }
    ]
  }
}
```

**format_code.py**:
```python
#!/usr/bin/env python3
"""自动格式化代码"""
import json
import sys
import subprocess
from pathlib import Path

def format_file(file_path: str):
    """根据文件类型选择格式化工具"""
    path = Path(file_path)
    
    # TypeScript/JavaScript
    if path.suffix in ['.ts', '.tsx', '.js', '.jsx']:
        subprocess.run(['npx', 'prettier', '--write', file_path])
        print(f"✓ Formatted with Prettier: {file_path}")
    
    # Python
    elif path.suffix == '.py':
        subprocess.run(['black', file_path])
        print(f"✓ Formatted with Black: {file_path}")
    
    # Go
    elif path.suffix == '.go':
        subprocess.run(['gofmt', '-w', file_path])
        print(f"✓ Formatted with gofmt: {file_path}")

def main():
    # 读取 stdin 输入
    data = json.load(sys.stdin)
    
    # 获取文件路径
    file_path = data.get('tool_input', {}).get('file_path')
    
    if not file_path:
        sys.exit(0)  # 没有文件路径,跳过
    
    try:
        format_file(file_path)
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

**使用**:
```bash
# 1. 保存脚本
chmod +x .codebuddy/hooks/format_code.py

# 2. 配置 hooks.json

# 3. 编辑文件后自动格式化
> 帮我修改 src/app.ts
# (编辑完成后自动运行 prettier)
```

#### 示例 2: 会话持久化

**hooks.json**:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/save_session.py",
            "timeout": 5000
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/update_session.py",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

**save_session.py**:
```python
#!/usr/bin/env python3
"""保存用户输入到会话历史"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

def save_session(user_input: str):
    """保存会话数据"""
    project_dir = os.getenv('CODEBUDDY_PROJECT_DIR', '.')
    session_dir = Path(project_dir) / '.codebuddy'
    session_dir.mkdir(exist_ok=True)
    
    session_file = session_dir / 'session-history.jsonl'
    
    # 创建会话条目
    entry = {
        'timestamp': datetime.now().isoformat(),
        'type': 'user_input',
        'content': user_input
    }
    
    # 追加到 JSONL 文件
    with open(session_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    
    print(f"✓ Session saved to {session_file}")

def main():
    data = json.load(sys.stdin)
    user_input = data.get('user_input', '')
    
    if user_input:
        save_session(user_input)
    
    sys.exit(0)

if __name__ == "__main__":
    main()
```

**update_session.py**:
```python
#!/usr/bin/env python3
"""更新会话与 AI 响应"""
import json
import sys
import os
from datetime import datetime
from pathlib import Path

def update_session(response: str):
    """保存 AI 响应"""
    project_dir = os.getenv('CODEBUDDY_PROJECT_DIR', '.')
    session_file = Path(project_dir) / '.codebuddy' / 'session-history.jsonl'
    
    entry = {
        'timestamp': datetime.now().isoformat(),
        'type': 'ai_response',
        'content': response
    }
    
    with open(session_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')

def main():
    data = json.load(sys.stdin)
    # 从 session_data 获取响应
    response = data.get('session_data', {}).get('last_response', '')
    
    if response:
        update_session(response)
    
    sys.exit(0)

if __name__ == "__main__":
    main()
```

#### 示例 3: Bash 命令安全验证

**hooks.json**:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/validate_bash.py",
            "timeout": 3000,
            "description": "验证 Bash 命令安全性"
          }
        ]
      }
    ]
  }
}
```

**validate_bash.py**:
```python
#!/usr/bin/env python3
"""验证 Bash 命令安全性"""
import json
import sys
import re

# 危险命令模式
DANGEROUS_PATTERNS = [
    r'rm\s+-rf\s+/',          # 删除根目录
    r':\(\)\{.*\};:',         # Fork 炸弈
    r'dd\s+if=/dev/random',   # 随机覆写
    r'mkfs',                  # 格式化
    r'chmod\s+-R\s+777\s+/',  # 全局权限修改
    r'wget.*\|\s*sh',         # 下载并执行
    r'curl.*\|\s*bash',       # 下载并执行
]

def validate_command(command: str) -> tuple[bool, str]:
    """验证命令安全性"""
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, command):
            return False, f"Dangerous pattern detected: {pattern}"
    
    return True, "Command is safe"

def main():
    data = json.load(sys.stdin)
    command = data.get('tool_input', {}).get('command', '')
    
    is_safe, message = validate_command(command)
    
    if not is_safe:
        print(f"❌ BLOCKED: {message}", file=sys.stderr)
        print(f"Command: {command}", file=sys.stderr)
        sys.exit(2)  # 退出码 2 = 阻止操作
    
    print(f"✓ Command validated: {command[:50]}...")
    sys.exit(0)

if __name__ == "__main__":
    main()
```

#### 示例 4: 提取可复用模式

**hooks.json**:
```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .codebuddy/hooks/extract_patterns.py",
            "timeout": 15000,
            "description": "从会话中提取可复用模式"
          }
        ]
      }
    ]
  }
}
```

**extract_patterns.py**:
```python
#!/usr/bin/env python3
"""从会话中提取可复用模式"""
import json
import sys
import os
import re
from pathlib import Path
from collections import defaultdict

def extract_patterns(session_data: dict) -> list:
    """提取常见模式"""
    patterns = defaultdict(int)
    
    # 分析工具调用
    tool_calls = session_data.get('tool_calls', [])
    for call in tool_calls:
        tool_name = call.get('name')
        patterns[f"tool:{tool_name}"] += 1
    
    # 分析命令模式
    for call in tool_calls:
        if call.get('name') == 'Bash':
            command = call.get('input', {}).get('command', '')
            # 提取命令前缀 (如 npm, git, docker)
            cmd_prefix = command.split()[0] if command else ''
            if cmd_prefix:
                patterns[f"bash:{cmd_prefix}"] += 1
    
    # 返回高频模式 (>= 3 次)
    frequent = [(k, v) for k, v in patterns.items() if v >= 3]
    return frequent

def save_patterns(patterns: list):
    """保存模式到文件"""
    project_dir = os.getenv('CODEBUDDY_PROJECT_DIR', '.')
    patterns_file = Path(project_dir) / '.codebuddy' / 'learned-patterns.json'
    
    # 读取现有模式
    existing = {}
    if patterns_file.exists():
        with open(patterns_file, 'r') as f:
            existing = json.load(f)
    
    # 更新计数
    for pattern, count in patterns:
        existing[pattern] = existing.get(pattern, 0) + count
    
    # 保存
    with open(patterns_file, 'w') as f:
        json.dump(existing, f, indent=2)
    
    print(f"✓ Extracted {len(patterns)} patterns")

def main():
    data = json.load(sys.stdin)
    session_data = data.get('session_data', {})
    
    patterns = extract_patterns(session_data)
    
    if patterns:
        save_patterns(patterns)
    
    sys.exit(0)

if __name__ == "__main__":
    main()
```

### 最佳实践

#### ✅ DO - 推荐做法

1. **清晰的描述**
```json
{
  "type": "command",
  "command": "...",
  "description": "自动格式化 TypeScript 代码"
}
```

2. **合理的超时**
```json
{
  "timeout": 5000   // 简单操作
}
{
  "timeout": 30000  // 复杂操作
}
```

3. **错误处理**
```python
try:
    # 操作
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
```

4. **日志输出**
```python
print(f"✓ Operation completed")  # 成功
print(f"❌ Error occurred", file=sys.stderr)  # 失败
```

#### ❌ DON'T - 避免做法

1. **避免阻塞操作**
```python
# ❌ 不好 - 长时间阻塞
time.sleep(60)

# ✅ 好 - 快速完成
async_operation.start()  # 异步启动
```

2. **避免过度日志**
```python
# ❌ 不好 - 过多日志
for i in range(1000):
    print(f"Processing {i}")

# ✅ 好 - 简洁输出
print(f"Processed {count} items")
```

3. **避免硬编码路径**
```python
# ❌ 不好
SESSION_FILE = "/Users/john/project/.codebuddy/session.json"

# ✅ 好
project_dir = os.getenv('CODEBUDDY_PROJECT_DIR', '.')
SESSION_FILE = Path(project_dir) / '.codebuddy' / 'session.json'
```

### 调试技巧

#### 测试 Hook

```bash
# 1. 创建测试 Hook
cat > .codebuddy/hooks/test.py << 'EOF'
#!/usr/bin/env python3
import json, sys
data = json.load(sys.stdin)
print(f"Hook triggered: {data.get('event')}")
sys.exit(0)
EOF

chmod +x .codebuddy/hooks/test.py

# 2. 配置 hooks.json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          { 
            "type": "command",
            "command": "python3 .codebuddy/hooks/test.py"
          }
        ]
      }
    ]
  }
}

# 3. 触发工具调用
> 帮我读取 README.md
# 应该看到 "Hook triggered: PostToolUse"
```

#### 查看 Hook 输出

```bash
# 使用 --debug 模式
```

---

## 验证说明

本文档基于以下官网信息进行验证和修正：

### 已验证的官网文档

1. **CLI 概述** - https://www.codebuddy.cn/docs/cli/overview
   - 核心特性
   - 安装命令：`npm install -g @tencent-ai/codebuddy-code`
   - CLI 缩写：`cbc`
   - 环境要求：Node.js 18.0+

2. **CLI 参考** - https://www.codebuddy.cn/docs/cli/cli-reference
   - 完整的 CLI 命令、参数、选项列表
   - 沙箱模式参数（Beta）
   - --agents 自定义代理参数
   - --json-schema 参数

3. **设置配置** - https://www.codebuddy.cn/docs/cli/settings
   - 配置文件 (`settings.json`) 分层结构
   - 主要配置项（language, model, env, permissions, sandbox, cleanupPeriodDays, hooks 等）
   - 权限设置（allow, ask, deny）
   - 重要环境变量（CODEBUDDY_API_KEY, CODEBUDDY_AUTH_TOKEN, CODEBUDDY_BASE_URL, CODEBUDDY_INTERNET_ENVIRONMENT 等）
   - 配置管理命令（config list, get, set）
   - 常见场景配置示例

4. **模型配置** - https://www.codebuddy.cn/docs/cli/models
   - models.json 配置文件结构
   - models 数组字段说明（id, name, vendor, apiKey, url 等）
   - availableModels 数组控制显示
   - 环境变量引用语法
   - 常见使用场景（添加本地模型、覆盖内置模型、限制显示模型）
   - 热重载特性

5. **记忆功能** - https://www.codebuddy.cn/docs/cli/memory
   - 记忆类型与位置（用户记忆、用户规则、项目记忆、项目规则、项目本地记忆）
   - 配置方式（/init 命令、编辑记忆文件、设置语言偏好）
   - 模块化规则配置（.codebuddy/rules/ 目录结构、YAML Frontmatter）
   - 记忆加载顺序
   - 导入其他文件语法（@path/to/file）
   - 使用方法和最佳实践

6. **子代理** - https://www.codebuddy.cn/docs/cli/sub-agents
   - 子代理概念和主要优势
   - 配置方式（/agents 命令、文件配置、CLI 动态配置）
   - 文件格式说明（YAML Frontmatter）
   - 使用方法（自动委派、显式调用、内置子代理）
   - 高级用法（链接子代理、可恢复子代理、后台代理）
   - 最佳实践

7. **代理团队** - https://www.codebuddy.cn/docs/cli/agent-teams
   - 代理团队概念和适用场景
   - 与子代理对比
   - 启用方式（/config、环境变量、settings.json）
   - 使用指南（创建团队、与团队交互、控制团队）
   - 工作原理（团队架构、执行模式、数据存储）
   - 最佳实践和故障排除
   - 已知限制

8. **技能系统** - https://www.codebuddy.cn/docs/cli/skills
   - Skills 概念和与 Slash Commands 的区别
   - 创建 Skills（目录结构、SKILL.md 文件格式）
   - Frontmatter 字段说明（7个字段）
   - Context Fork 和隐藏 Skill
   - 使用示例（PDF 处理、数据分析、代码审查）
   - AI 如何选择 Skills
   - 权限控制（allowed-tools 白名单、工作目录限制）
   - 最佳实践和调试
   - 与其他功能配合

### 动态加载无法验证的页面

以下官网页面使用动态加载，web_fetch 工具无法获取完整内容，需要手动访问验证：

1. **Plugin 系统** - https://www.codebuddy.cn/docs/plugin/
2. **斜杠命令** - https://www.codebuddy.cn/docs/slash-commands
3. **MCP 集成** - https://www.codebuddy.cn/docs/mcp

### 文档中的验证标记

本文档中以下内容已标记为"需验证"：

- **部分环境变量**：官网 settings 页面未明确列出 `CODEBUDDY_PLUGIN_ROOT`, `CODEBUDDY_PROJECT_DIR`, `CODEBUDDY_PACKAGE_MANAGER`, `CODEBUDDY_AUTOCOMPACT_PCT_OVERRIDE`, `E2B_API_KEY`, `E2B_TEMPLATE`, `CODEBUDDY_SANDBOX_IMAGE`，但这些变量在 Hook 脚本等上下文中使用

- **内置模型列表**：官网 models 页面主要介绍 models.json 配置方式，未提供具体的内置模型列表。文档中的模型名称（glm-5.0, deepseek-v3.2, kimi-k2.5, claude-3-5-sonnet, gpt-4o 等）需要进一步验证
- **mcp 子命令**：官网 CLI 参考未提供详细说明，仅提到"参见 MCP 文档"（需要手动访问 https://www.codebuddy.cn/docs/mcp 验证）
- **模型名称**（glm-5.0, deepseek-v3.2, kimi-k2.5, claude-3-5-sonnet, gpt-4o）：官网 CLI 参考中未找到
- **插件系统结构**：官网 Plugin 页面动态加载无法获取

- **内置模型列表**：官网 models 页面未提供具体的内置模型名称列表
- **Skills、Commands、Agents、Hooks 详细实现**：需要手动访问官网验证

### 已修正的错误

1. 移除了不存在的 CLI 选项：
   - `--list-sessions`
   - `--delete-session`
   - `--mcp-config`
   - `--strict-mcp-config`
   - `--session-id`
   - `--fallback-model`
   - `-V, --version`
   - `-h, --help`

2. 补充了官网 CLI 参考中确认的选项：
   - `--tools`
   - `--settings`
   - `--setting-sources`
   - `--system-prompt`
   - `--system-prompt-file`
   - `--append-system-prompt`
   - `--include-partial-messages`
   - `--max-turns`
   - `--text-to-image-model`
   - `--image-to-image-model`
   - `--permission-prompt-tool`
   - `--teleport`
   - `-y` (--dangerously-skip-permissions 的缩写)

3. 修正了目录结构：
   - 将 `.claude-plugin` 改为 `.codebuddy-plugin`

4. 更新了沙箱模式章节，补充了完整的参数列表

5. 标记了未验证内容，避免误导读者

6. 新增了完整的 `settings.json` 配置文件章节（基于官网 settings 页面验证）

7. 新增了完整的 `models.json` 配置文件章节（基于官网 models 页面验证）
   - 模型配置文件结构
   - models 数组字段说明
   - availableModels 数组控制显示
   - 环境变量引用语法
   - 常见使用场景
   - 热重载特性

8. 新增了完整的记忆功能章节（基于官网 memory 页面验证）
   - 记忆类型与位置（5种类型）
   - 配置方式（/init、/memory、/config 命令）
   - 模块化规则配置（YAML Frontmatter 控制字段）
   - 记忆加载顺序（5步加载流程）
   - 导入其他文件语法（@path/to/file）
   - 使用方法和最佳实践
   - 常见问题解答

9. 新增了完整的子代理章节（基于官网 sub-agents 页面验证）
   - 子代理概念和主要优势
   - 配置方式（/agents 命令、文件配置、CLI 动态配置）
   - 文件格式说明（YAML Frontmatter）
   - 使用方法（自动委派、显式调用、内置子代理）
   - 高级用法（链接子代理、可恢复子代理、后台代理）
   - 最佳实践

10. 新增了完整的代理团队章节（基于官网 agent-teams 页面验证）
    - 代理团队概念和适用场景
    - 与子代理对比（5个特性对比）
    - 启用方式（3种方式：/config、环境变量、settings.json）
    - 使用指南（创建团队、与团队交互、控制团队）
    - 工作原理（团队架构、执行模式、数据存储）
    - 最佳实践和故障排除
    - 已知限制（7个限制）

11. 新增了完整的技能系统章节（基于官网 skills 页面验证）
    - Skills 概念和与 Slash Commands 的区别（5个特性对比）
    - 创建 Skills（目录结构、SKILL.md 文件格式）
    - Frontmatter 字段说明（7个字段：name, description, allowed-tools, disable-model-invocation, user-invocable, context, agent）
    - Context Fork（上下文隔离）和隐藏 Skill
    - 使用示例（PDF 处理、数据分析、代码审查）
    - AI 如何选择 Skills（4个因素）
    - 权限控制（allowed-tools 白名单、工作目录限制）
    - 最佳实践（4条）和调试
    - 与其他功能配合（Memory, Slash Commands, MCP）

12. 新增了完整的 Hooks 管理面板章节（基于官网 hooks 页面验证）
    - Hooks 功能状态说明（Beta阶段）
    - 九大事件类型及其matcher支持情况
    - Notification事件matcher支持范围（permission_prompt、idle_prompt）
    - CLI `/hooks` 管理面板功能说明
    - 调试方法和示例
    - 完整的Hook输入数据结构（包含session_id、transcript_path等基础字段）
    - 双模式输出控制（退出代码和JSON输出）
    - 安全注意事项和最佳实践
    - 60秒超时自动终止机制

13. 新增了完整的 Plugins 编写指南章节（基于官网 plugins 页面验证）
    - Plugins 概念和核心组成（Commands、Skills、Hooks、MCP/LSP）
    - 标准插件目录结构说明
    - plugin.json 完整格式和字段说明
    - Commands 组件（斜杠命令）的使用方式和格式
    - Skills 组件（AI自动识别）的配置方法
    - Hooks 组件（事件触发）的配置格式
    - LSP 组件（语言服务器）配置和示例
    - 四种插件市场类型（GitHub、Git 仓库、本地目录、HTTP）
    - marketplace.json 格式和仓库结构（包含 owner 字段和高级配置）
    - 三种插件管理方式（团队配置、交互式界面、命令行）
    - 团队配置自动安装的 settings.json 示例和自动安装流程说明
    - 交互式界面的6个标签页功能
    - 命令行子命令（install、enable、disable、uninstall、marketplace等）
    - 插件文件位置说明
    - 最佳实践（插件开发、安全、发布流程）
    - 创建自己的市场章节（marketplace.json 创建、Source 类型、高级配置）
    - 故障排除（市场无法加载、插件安装失败、命令不可用、LSP不工作）
    - 调试模式启用方法和输出信息说明

14. 修正了 Plugins 编写指南中的插件市场类型章节（基于官网 plugin-marketplaces 页面验证）
    - 将市场类型从3种更新为4种（新增 Git 仓库市场）
    - 更新 GitHub 市场添加命令为简短格式（owner/repo）
    - 添加 Git 仓库市场的完整说明（HTTPS、SSH、.git 后缀支持）
    - 更新 marketplace.json 格式，添加 owner 字段和 version 字段示例
    - 添加市场管理命令（list、update、remove）
    - 添加市场使用说明章节（从市场安装插件、验证和管理市场）
    - 添加创建自己的市场章节（市场文件创建、Source 类型、高级配置）
    - 更新故障排除章节，添加调试模式说明
    - 更新自动安装流程（4个步骤：检测配置、安装市场、安装插件、后台异步执行）

15. 修正了 Hooks 编写指南中的 Hook 事件类型章节（基于官网 IDE Hooks 页面验证）
    - 更新事件类型表格为7个核心事件（SessionStart、SessionEnd、PreToolUse、PostToolUse、UserPromptSubmit、Stop、PreCompact）
    - 添加事件匹配字段说明（source、reason、tool_name、trigger）
    - 添加核心事件详解（SessionStart 输入数据示例、PreToolUse 核心控制能力、UserPromptSubmit 典型应用、PreCompact 典型应用）
    - 添加工具名称说明表格（CLI风格 vs IDE风格：Bash/execute_command、Write/write_to_file等）
    - 添加如何使用说明（创建配置文件、编写Hook脚本、配置事件监听）

16. 修正了 plugin.json 格式章节（基于官网 plugins-reference 页面验证）
    - 添加完整配置示例（包含 commands、agents、hooks、mcpServers、lspServers 等完整组件）
    - 添加路径解析规则说明（./ 前缀、默认目录合并加载、CODEBUDDY_PLUGIN_ROOT 环境变量）
    - 添加支持的组件列表（commands、skills、hooks、agents、mcpServers、lspServers）
    - 添加 agents、mcpServers、lspServers 的配置说明

17. 修正了 settings.json 配置文件章节（基于官网 settings 页面验证）
    - 将主要配置项表格更新为配置类别表格（基础设置、权限控制、环境变量、功能开关、Bash沙箱、插件管理、状态行、触发事件、高级控制）
    - 添加新增配置项（permissions.defaultMode、promptSuggestionEnabled、memory.enabled、sandbox.excludedCommands、enabledPlugins、disableAllHooks、apiKeyHelper）
    - 添加 hooks 配置章节（PreToolUse 和 PostToolUse 两类基本事件）
    - 添加 hooks 配置示例
    - 添加调试与兼容性说明（--verbose 查看插件加载日志、Claude Code 兼容性）
    - 添加关键注意事项（LSP 需预装二进制、Hooks 脚本需执行权限、插件版本语义化）

### 建议后续工作

1. 手动访问动态加载的官网页面，验证插件系统、斜杠命令、MCP 集成的详细信息
2. 验证内置模型列表的准确性（官网 models 页面未提供具体列表）

---

**文档版本**：1.7.0+
**最后更新**：2026年2月25日
**数据来源**：CodeBuddy 官网文档（基于静态页面内容）
codebuddy --debug

# Hook 的 stdout/stderr 会显示在日志中
```

#### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Hook 未执行 | 路径错误或权限不足 | 检查脚本路径和执行权限 |
| 超时 | 脚本执行时间过长 | 增加 timeout 或优化脚本 |
| JSON 解析失败 | stdin 格式错误 | 添加 try-except 处理 |
| 退出码错误 | 脚本异常退出 | 添加错误处理 |

---

**文档版本**: v1.2 (基于官方文档修正)  
**最后更新**: 2026-02-18  
**适用版本**: CodeBuddy CLI 1.7.0+

**作者**: 软件体系架构分析团队  
**联系**: codebuddy@tencent.com  
**官网**: https://www.codebuddy.cn

---

**CodeBuddy - 让 AI 编程助手更智能、更高效** 🚀
