# 大型需求文档处理方案

## 状态

✅ **已完成实施** (2026-02-26)

## 问题背景

multi-plan 命令在处理大型需求文档(如 PRD、功能规格说明等)时,现有流程缺乏专门的处理策略。

## 需求类型识别

在 Phase 1.1 首先识别需求类型:

| 需求特征 | 类型 | 处理策略 |
|---------|------|---------|
| 简短文本(<500字) | 简单需求 | 使用 prompt-enhancer |
| 文件路径(.md/.docx/.pdf) | 文档需求 | 文档解析 + 需求提取 |
| 大量文本(>2000字) | 大型需求 | 需求文档处理器 |
| 结构化文档(有章节) | 规格文档 | 文档结构化 + 模块拆分 |

## 处理方案

### 方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. 新建 document-parser 代理 | 职责清晰,易于扩展 | 需要新增代理,增加复杂度 |
| B. 增强 prompt-enhancer | 统一入口,易于维护,输出一致 | 需修改现有代理 |

### 推荐方案: 方案 B (增强 prompt-enhancer)

**原因:**
- ✅ 统一入口 - 需求增强都在一个代理中处理
- ✅ 灵活适配 - 简单需求和复杂文档都能处理
- ✅ 易于维护 - 不需要新增代理
- ✅ 输出一致 - 无论输入类型,输出格式统一

## 具体实现

### Phase 1.1 修改建议

在 `multi-plan.md` 的 Phase 1.1 中添加以下逻辑:

#### Step 1: 识别输入类型

```javascript
// 判断需求类型
const inputType = analyzeInput($ARGUMENTS);
// inputType 可能是:
// - "brief": 简短需求(<500字)
// - "document": 文件路径或大型文本(>2000字)
// - "structured": 结构化文档(有章节标记)
```

#### Step 2: 调用相应的增强策略

**If inputType === "brief" or "unstructured"**:
- 调用 `prompt-enhancer` 代理(现有逻辑)

**If inputType === "document" or "structured"**:
- 调用 `prompt-enhancer` 代理,并传递特殊指令

```javascript
Task({
  subagent_name: "prompt-enhancer",
  description: "Parse and enhance large requirement document",
  prompt: "原始需求文档: $ARGUMENTS

请识别这是一个大型需求文档,并执行以下操作:
1. **解析文档结构** - 识别章节、模块、功能
2. **提取核心需求** - 功能需求、技术需求、非功能性需求
3. **需求分组** - 按模块、优先级、技术栈分组
4. **识别依赖** - 功能间的依赖关系
5. **生成摘要** - 总体概述、模块列表、关键需求

输出格式应包含以下额外部分:
## Document Analysis
- Document Type: <PRD/FDD/User Story>
- Module Count: <N>
- Estimated Scope: <Small/Medium/Large>

## Functional Modules
1. <Module 1>: <Brief description>
2. <Module 2>: <Brief description>

## Dependency Graph
<模块间的依赖关系>"
})
```

#### Step 3: 处理增强输出

- 如果输出包含 **Functional Modules**,标记为"可能需要拆分"
- 传递到 Phase 2.5 供规模评估参考

### 增强后的 prompt-enhancer 功能

当需求是大型文档时(字数 > 2000 或是文件路径):

1. **文档解析**:
   - 读取文档内容
   - 识别文档结构(章节、标题、列表)
   - 提取关键章节(需求、功能、技术、约束)

2. **需求提取**:
   - 功能需求: 提取所有功能描述
   - 技术需求: 提取技术约束和规范
   - 非功能性需求: 性能、安全、可扩展性
   - 依赖关系: 功能间的前后依赖

3. **需求分组**:
   - 按模块分组(如"用户管理"、"订单系统"、"支付功能")
   - 按优先级分组(P0 核心、P1 重要、P2 增强)
   - 按技术栈分组(前端、后端、数据库)

4. **生成摘要**:
   - 总体概述
   - 功能模块列表
   - 关键需求摘要
   - 优先级排序

## 与计划拆分的集成

```
大型需求文档
    ↓
文档解析(增强的 prompt-enhancer)
    ↓
提取: 功能模块、技术栈、依赖关系
    ↓
初步评估:
  - 是否需要分模块实施?
  - 是否有清晰的功能边界?
  - 模块间依赖关系如何?
    ↓
Phase 2.5: 计划规模评估
  - 直接基于文档分析结果判断
  - 大型文档通常建议拆分
    ↓
Phase 2.6: 计划拆分
  - 按功能模块拆分(最自然)
  - 按文档章节拆分
  - 按优先级拆分
```

## 输出格式示例

```markdown
# Enhanced Requirements

## Original Request
<原始需求文档内容>

## Analysis Summary
- Type: Large Document (PRD)
- Estimated Size: Large (>2000 words)
- Module Count: 5
- Recommended Split: Yes

## Refined Requirements

### Core Objectives
<核心目标>

### Functional Requirements

#### Module 1: 用户管理
<功能描述>
- Feature 1.1
- Feature 1.2

#### Module 2: 订单系统
<功能描述>
- Feature 2.1
- Feature 2.2

### Technical Requirements
<技术需求>

### Non-Functional Requirements
<非功能性需求>

### Dependency Graph
```
Module 1 (用户管理)
    ↓
Module 2 (订单系统) → Module 3 (支付)
    ↓
Module 4 (通知系统)
```

### Implementation Notes
<实施说明>
```

## 优势

1. **无缝集成** - 不改变 multi-plan 的现有流程
2. **智能识别** - 自动判断需求类型并选择处理策略
3. **可扩展性** - 输出格式可复用于后续的规模评估和计划拆分
4. **向后兼容** - 简单需求的处理流程保持不变

## 实施结果

### 修改的文件
✅ `.codebuddy/commands/multi-plan.md` - 已添加大型需求文档处理能力

### 新增功能

1. **Phase 1.1 增强需求增强**
   - 输入类型识别（简短/文档/结构化）
   - 文档解析和结构提取
   - 功能模块识别
   - 依赖关系图生成

2. **Phase 2.5 增强规模评估**
   - 支持文档分析结果
   - 基于模块数量判断拆分需求
   - 利用文档的依赖关系图

3. **Phase 2.6 增强拆分策略**
   - 优先使用文档的功能模块
   - 对齐文档结构
   - 利用文档的优先级信息

### 兼容性
✅ 完全向后兼容，简单需求处理流程保持不变

---
