# OpenSpec SDD 规范分析指南

## 概述

OpenSpec (LeanSpec) 是一个轻量级的规格说明管理系统，采用 Markdown 文件格式组织项目需求和设计文档。SDD (Software Design Document) 是软件设计文档的简称，在 OpenSpec 框架下以规范的格式呈现。

## 核心概念

### Spec 结构

每个 Spec 文件包含以下组成部分：

#### Frontmatter (元数据)

位于文件开头的 YAML 格式元数据，包含：
- `number`: Spec 编号（自动生成，如 001, 002, ...）
- `name`: Spec 名称（kebab-case 格式）
- `title`: 人类可读的标题
- `status`: 状态（planned, in-progress, complete, archived）
- `priority`: 优先级（low, medium, high, critical）
- `tags`: 标签数组（用于分类和过滤）
- `assignee`: 负责人
- `dependencies`: 依赖的其他 Spec
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### 正文内容

使用 Markdown 编写的内容部分，建议包含以下章节：

- **Overview**: 概述/背景
- **Goals**: 目标
- **Requirements**: 需求列表
- **Design**: 设计方案
- **Implementation**: 实现细节
- **Testing**: 测试计划
- **Open Questions**: 开放问题
- **Checklist**: 检查清单（可打勾）

## 命令行工具

### 基础命令

```bash
# 安装 LeanSpec
npm install -g @leanspec/cli

# 初始化项目
leanspec init

# 列出所有 specs
leanspec list
leanspec list --status in-progress
leanspec list --priority high
leanspec list --tags backend api

# 查看 spec 详情
leanspec view 001
leanspec view 001-my-feature

# 创建新 spec
leanspec create my-feature --title "My New Feature" --priority high
leanspec create my-feature --template sdd

# 更新 spec
leanspec update 001 --status in-progress
leanspec update 001 --assignee john --add-tags urgent

# 更新内容
leanspec update 001 --content "# New Content\n..."

# 精准内容替换
leanspec update 001 --replacements '[
  {"oldString": "old text", "newString": "new text"}
]'

# 操作 checklist
leanspec update 001 --checklist-toggles '[
  {"itemText": "Task 1", "checked": true}
]'

# 验证 spec
leanspec validate
leanspec validate 001
leanspec validate --check-deps

# 依赖管理
leanspec deps 001
leanspec link 001 002
leanspec unlink 001 002
leanspec set-parent 001 002
leanspec relationships 001

# 统计和看板
leanspec stats
leanspec board --status
leanspec board --priority

# Token 统计
leanspec tokens 001
```

### 高级功能

#### 依赖关系管理

```bash
# 查看依赖图
leanspec deps 001

# 创建依赖链接
leanspec link 001 002

# 解除依赖
leanspec unlink 001 002

# 设置父级
leanspec set-parent 001 002

# 查看所有关系
leanspec relationships 001

# 列出子级 specs
leanspec list-children 002

# 列出 umbrella specs
leanspec list-umbrellas
```

#### 项目看板

```bash
# 按状态分组
leanspec board --status

# 按优先级分组
leanspec board --priority

# 按负责人分组
leanspec board --assignee
```

#### 验证

```bash
# 验证所有 specs
leanspec validate

# 验证特定 spec
leanspec validate 001

# 验证并检查依赖对齐
leanspec validate --check-deps
```

## MCP 工具集成

### 可用的 MCP 工具

OpenSpec 通过 MCP 服务器提供以下工具：

#### `list`
列出所有 specs，支持过滤：
- `status`: 按 status 过滤
- `priority`: 按 priority 过滤
- `tags`: 按标签过滤（必须包含所有指定标签）

#### `view`
查看 spec 的完整内容和元数据
- `specPath`: Spec 路径或编号

#### `create`
创建新 spec
- `name`: Spec 名称（kebab-case）
- `title`: 人类可读标题
- `status`: 初始状态
- `priority`: 优先级
- `tags`: 标签数组
- `content`: 正文内容（自动生成 frontmatter 和标题）
- `template`: 使用的模板名称

#### `update`
更新 spec 的元数据和/或内容
- `specPath`: Spec 路径或编号
- `status`: 新状态
- `priority`: 新优先级
- `assignee`: 新负责人
- `addTags`: 添加标签
- `removeTags`: 移除标签
- `content`: 完整内容替换
- `replacements`: 精准字符串替换（推荐）
- `sectionUpdates`: 按章节更新内容
- `checklistToggles`: 切换 checklist 状态
- `force`: 强制完成（跳过验证）

#### `validate`
验证 spec 的问题
- `specPath`: 特定 spec（不提供则验证所有）
- `checkDeps`: 检查依赖对齐

#### `deps`
显示依赖关系图

#### `link` / `unlink`
创建/删除依赖关系

#### `set_parent`
设置父级 spec

#### `relationships`
管理 spec 关系

#### `list_children`
列出子级 specs

#### `list_umbrellas`
列出 umbrella specs

#### `board`
项目看板视图

#### `stats`
统计信息

#### `tokens`
统计 token 使用

## 文件结构

```
.lean-spec/
├── specs/              # 规格说明文件
│   ├── 001-my-feature.md
│   ├── 002-another-feature.md
│   └── ...
├── templates/          # 模板文件
│   ├── sdd.md
│   ├── feature.md
│   └── ...
└── config.json        # 配置文件
```

## 最佳实践

### Spec 命名

- 使用 kebab-case 格式：`my-awesome-feature`
- 名称应简洁、描述性强
- 避免使用编号（编号自动生成）

### 状态流转

```
planned → in-progress → complete
  ↓         ↓
archived ← archived
```

### 优先级定义

- `low`: 可以后续处理的低优先级任务
- `medium`: 常规优先级
- `high`: 高优先级，需要尽快处理
- `critical`: 关键路径，阻塞其他任务

### 标签使用

- 按功能域：`backend`, `frontend`, `api`, `database`
- 按类型：`feature`, `bug`, `refactor`, `docs`
- 按里程碑：`v1.0`, `v2.0`, `sprint-1`

### Checklist 管理

在 Spec 中使用 checklist 跟踪任务进度：

```markdown
## Implementation Checklist

- [ ] Design API endpoints
- [ ] Implement backend logic
- [ ] Write unit tests
- [ ] Update documentation
```

设置状态为 `complete` 时会自动验证所有 checklist 是否完成。

## 验证规则

### Frontmatter 验证
- 必需字段检查
- 字段类型验证
- 枚举值验证

### 结构验证
- Markdown 标题层级
- 文件命名规范

### 依赖验证
- 循环依赖检测
- 未找到的依赖引用

## 与 Git 工作流集成

```bash
# 创建新分支
lean-spec create feature/login
lean-spec update 001 --status in-progress
git checkout -b feature/001-login

# 提交更改
git add .lean-spec/specs/001-login.md
git commit -m "docs: update login spec"

# PR 流程
# 1. 更新 spec 状态为 in-progress
lean-spec update 001 --status in-progress

# 2. 完成实现
# ... 编写代码 ...

# 3. 更新 spec 状态为 complete
lean-spec update 001 --status complete

# 4. 提交 PR
git push origin feature/001-login
```

## 进阶技巧

### 使用模板

创建自定义模板：

```bash
# 创建模板文件
cat > .lean-spec/templates/custom-sdd.md << 'EOF'
## Overview

## Goals

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2

## Design

## Implementation

## Testing

## Checklist
- [ ] Task 1
- [ ] Task 2
EOF

# 使用模板创建
lean-spec create my-feature --template custom-sdd
```

### 内容替换策略

使用 `replacements` 进行精准更新：

```bash
lean-spec update 001 --replacements '[
  {
    "oldString": "Old content\nWith context",
    "newString": "New content",
    "matchMode": "unique"
  }
]'
```

`matchMode` 选项：
- `unique`: 唯一匹配（默认），多处匹配时报错
- `all`: 替换所有匹配
- `first`: 只替换第一个匹配

### 依赖对齐检查

确保依赖的 specs 状态正确：

```bash
lean-spec validate --check-deps
```

## Token 优化

### Token 统计

```bash
# 统计单个 spec
lean-spec tokens 001

# 统计多个 specs
lean-spec tokens 001 002 003
```

### Token 节省技巧

1. 使用简洁的标题
2. 避免冗余的描述
3. 使用 checklist 替代长段落
4. 合并相似的 specs

## 常见问题

### Q: 如何恢复已删除的 spec？
A: Spec 文件存储在 `.lean-spec/specs/` 目录，可以从 Git 历史恢复。

### Q: 如何批量更新 specs？
A: 使用脚本结合 `lean-spec update` 命令进行批量操作。

### Q: checklist 和 status 的关系？
A: 设置 status 为 `complete` 会验证 checklist，但可以使用 `--force` 跳过验证。

### Q: 如何重命名 spec？
A: 手动重命名文件，然后运行 `lean-spec validate` 检查依赖引用。

## 参考资源

- [LeanSpec GitHub](https://github.com/leanspec/leanspec)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

*此指南基于 OpenSpec/LeanSpec v1.0 规范编写*
