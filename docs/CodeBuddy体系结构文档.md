# CodeBuddy 智能编程助手体系结构文档

> **腾讯云 AI 代码助手 - 完整技术架构解析**

[![Version](https://img.shields.io/badge/version-2.50.0+-blue)](https://www.codebuddy.cn)
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
    - [Hooks 编写指南](#hooks-编写指南)

---

## 系统概述

### 产品定位

CodeBuddy Code 是基于**腾讯云 AI 技术**的智能编程工具，提供从代码编写到项目部署的全链路 AI 辅助。它通过自然语言驱动开发流程，集成了强大的工具链和扩展能力。

### 核心特性

| 特性 | 描述 | 技术实现 |
|------|------|----------|
| 🚀 **自然语言驱动** | 用对话式交互完成开发全流程 | LLM + 工具调用 |
| 🔧 **终端原生** | 完美融入命令行环境 | Node.js CLI |
| ⚡ **内置工具链** | 文件编辑、命令运行、Git 操作 | 系统工具封装 |
| 🛠️ **Unix 哲学** | 支持管道、脚本集成 | stdin/stdout |
| 🔌 **强大扩展** | Plugins、MCP、LSP 支持 | 插件架构 |

### 技术栈

```
运行环境: Node.js 18.0+
核心语言: TypeScript
AI 引擎: 多模型支持 (Claude, GPT, Gemini)
协议支持: MCP, LSP, ACP
包管理: npm
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

**支持的 IDE**:
- VS Code (官方插件)
- JetBrains 系列 (IntelliJ, PyCharm, WebStorm)
- Vim/Neovim (通过 LSP)
- Cursor (原生集成)

**集成方式**:
```
┌─────────────────────┐
│   IDE (VS Code)     │
├─────────────────────┤
│  CodeBuddy 插件     │
│  ├─ Sidebar         │
│  ├─ Chat Panel      │
│  └─ Inline Assist   │
└─────────────────────┘
         ▼
    (WebSocket)
         ▼
┌─────────────────────┐
│  CodeBuddy Server   │
│  (本地进程)         │
└─────────────────────┘
```

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

**自定义命令加载**:
```typescript
class CustomCommandLoader {
  async loadCommands() {
    const commands: Command[] = [];
    
    // 1. 加载项目级命令
    const projectCommands = await this.loadFromDirectory(
      '.codebuddy/commands/'
    );
    
    // 2. 加载用户级命令
    const userCommands = await this.loadFromDirectory(
      '~/.codebuddy/commands/'
    );
    
    // 3. 加载插件命令
    const pluginCommands = await this.loadPluginCommands();
    
    // 4. 合并并注册 (优先级: 项目 > 用户 > 插件)
    return [...projectCommands, ...userCommands, ...pluginCommands];
  }
}
```

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

**插件结构**:
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

# 指定模型
codebuddy --model gemini-3.0-pro

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
model: gemini-3.0-flash
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
| `model` | ❌ | string | 指定使用的 AI 模型 | `"gemini-3.0-pro"` |
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
| `model` | ❌ | string | 使用的模型或 `inherit` | `"gemini-3.0-pro"` 或 `"inherit"` |
| `permissionMode` | ❌ | string | 权限模式 | `"default"`, `"acceptEdits"`, `"bypassPermissions"` |
| `skills` | ❌ | string | 自动加载的技能 | `"typescript-expert, testing"` |

### Model 配置

```markdown
# 使用特定模型
model: gemini-3.0-pro

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

## Hooks 编写指南

### 概述

Hooks (钩子) 是在特定事件发生时自动执行的脚本,用于自动化工作流、验证操作、记录日志等。

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

| 事件名称 | 触发时机 | 用途 | 输入数据 |
|---------|---------|------|---------|
| `PreToolUse` | 工具调用之前 | 验证、记录、阻止 | tool_name, tool_input |
| `PostToolUse` | 工具调用之后 | 格式化、验证结果 | tool_name, tool_input, tool_output |
| `UserPromptSubmit` | 用户提交输入后 | 预处理、注入上下文 | user_input |
| `Notification` | 发送通知时 | 自定义通知 | message |
| `Stop` | 响应完成时 | 保存会话、提取模式 | session_data |
| `SubagentStop` | 子代理完成时 | 收集结果 | agent_result |
| `PreCompact` | 压缩前 | 备份上下文 | context |
| `SessionStart` | 会话启动时 | 初始化环境 | session_info |
| `SessionEnd` | 会话结束时 | 清理、生成报告 | session_summary |

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
| **Prompt** | ✅ 支持 | ❌ 不支持 |
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
  - ❌ **不支持** Prompt 类型的 hooks
  - ❌ **不支持** Agent 类型的 hooks
  - 仅支持 Command 类型的 hooks

#### 六、Matcher 支持对比

| 事件 | Claude Code Matcher | CodeBuddy Matcher |
|-----|---------------------|-------------------|
| PreToolUse | 按工具名称 (Bash, Edit, Write, Read, Glob, Grep, Task, WebFetch, WebSearch, MCP) | 按工具名称 |
| PostToolUse | 按工具名称 | 按工具名称 |
| SessionStart | startup, resume, clear, compact | startup, resume, clear, compact |
| SessionEnd | clear, logout, prompt_input_exit, bypass_permissions_disabled, other | clear, logout, other |
| Notification | permission_prompt, idle_prompt, auth_success, elicitation_dialog | permission_prompt, idle_prompt |
| Stop | ❌ 不支持 matcher | ❌ 不支持 matcher |
| UserPromptSubmit | ❌ 不支持 matcher | ❌ 不支持 matcher |

#### 七、配置文件位置

| 平台 | 用户级 | 项目级 | 插件级 |
|-----|--------|--------|--------|
| Claude Code | `~/.claude/settings.json` | `.claude/settings.json` | `.claude-plugin/plugin.json` → `hooks/hooks.json` |
| CodeBuddy | `~/.codebuddy/settings.json` | `.codebuddy/settings.json` | `.codebuddy-plugin/plugin.json` → `.codebuddy-plugin/marketplace.json` |

#### 八、迁移建议

**从 Claude Code 迁移到 CodeBuddy：**
1. **事件类型**：移除 PostToolUseFailure, PermissionRequest, SubagentStart, TeammateIdle, TaskCompleted
2. **Hook 类型**：将 prompt/agent hooks 转换为 command hooks
3. **环境变量**：批量替换 `CLAUDE_` → `CODEBUDDY_`
4. **决策控制**：简化 JSON 输出，优先使用 exit codes

**从 CodeBuddy 迁移到 Claude Code：**
1. **扩展支持**：可使用更多事件类型（如 TeammateIdle 用于质量门控）
2. **高级 Hooks**：可使用 prompt/agent hooks 实现智能决策
3. **环境变量**：批量替换 `CODEBUDDY_` → `CLAUDE_`

### 配置格式

#### 基础配置

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$FILE_PATH\"",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

#### 完整配置

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

### 输入输出

#### 输入 (stdin)

Hook 通过 stdin 接收 JSON 数据:

```json
{
  "event": "PostToolUse",
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

#### 输出 (stdout/exit code)

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

**文档版本**: v1.1 (增加组件编写指南)  
**最后更新**: 2026-02-13  
**适用版本**: CodeBuddy 2.40.0+

**作者**: 软件体系架构分析团队  
**联系**: codebuddy@tencent.com  
**官网**: https://www.codebuddy.cn

---

**CodeBuddy - 让 AI 编程助手更智能、更高效** 🚀
