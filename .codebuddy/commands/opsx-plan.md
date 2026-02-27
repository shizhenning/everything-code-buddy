---
description: OpenSpec统一计划入口 - 整合/multi-plan和OpenSpec创建流程
---

# /opsx:plan

OpenSpec统一计划入口命令,整合了`/multi-plan`和OpenSpec工件创建的完整流程。

## 概述

`/opsx:plan` 是OpenSpec集成的主要入口点,它:
1. 调用`/multi-plan`生成高质量计划
2. 自动创建OpenSpec工件(proposal, design, specs, tasks)
3. 建立计划与OpenSpec工件的双向链接
4. 执行质量评估并生成报告

## 使用方法

### 基础用法

```bash
/opsx:plan <feature-name> [options]
```

### 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `<feature-name>` | string | 是 | 功能名称或需求描述 |

### 选项

| 选项 | 简写 | 默认值 | 说明 |
|------|------|--------|------|
| `--no-split` | - | false | 不拆分计划,保持单一计划 |
| `--expertise <level>` | `-e` | auto | 专家级分析级别 (expert/auto/beginner) |
| `--context` | `-c` | 10 | 上下文块大小 (5-20) |
| `--verbose` | `-v` | false | 显示详细输出 |

## 执行流程

### Phase 1: 计划生成

调用`/multi-plan`生成实施计划:

```bash
/multi-plan "<feature-name>" --openspec
```

#### 输出:
- `.codebuddy/plan/<feature-name>.md` - 实施计划
- 或 `.codebuddy/plan/<feature-name>-master.md` + 子计划 (如果拆分)

### Phase 2: OpenSpec工件创建

自动创建OpenSpec工件:

#### 2.1 提取信息
- 从计划提取: 目标、范围、技术方案、实施步骤
- 调用task-refiner: 生成粒度任务(3-10分钟/任务)

#### 2.2 创建工件
```
openspec/changes/<change-name>/
├── proposal.md       # 提案文档
├── design.md         # 设计文档
├── specs/            # 规格文件目录
│   ├── spec-1.md
│   ├── spec-2.md
│   └── ...
├── tasks.md          # 任务列表
└── .plan-mapping.md  # 映射表
```

#### 2.3 建立链接
- **前向引用**: Plan → OpenSpec (在计划文件中)
- **后向引用**: Proposal → Plan (在proposal.md中)
- **映射表**: .plan-mapping.md (跟踪映射关系)

### Phase 3: 质量评估

#### 3.1 计算质量得分
- **计划质量** (30%): 目标清晰度、范围边界、实施步骤、风险评估、技术方案
- **OpenSpec完整性** (40%): proposal.md、design.md、specs/、tasks.md、链接完整性
- **任务可执行性** (30%): 任务粒度、依赖关系、验收标准、资源预估

#### 3.2 决策
| 得分 | 决策 |
|------|------|
| ≥90 | ✅ 优秀 - 立即执行 |
| 80-89 | ⚠️ 良好 - 可执行,有小改进空间 |
| 70-79 | ❌ 需要改进 - 需要完善后再执行 |
| <70 | ❌ 拒绝 - 需要重新规划 |

### Phase 4: 输出报告

#### 4.1 控制台输出
```
✅ OpenSpec计划创建完成

📋 计划信息:
- 计划文件: .codebuddy/plan/user-authentication.md
- OpenSpec目录: openspec/changes/user-authentication

📊 质量评估:
- 计划质量: 92/100
- OpenSpec完整性: 95/100
- 任务可执行性: 90/100
- 综合得分: 92.6/100

决策: ✅ 批准执行

📁 创建的工件:
- proposal.md (245行)
- design.md (312行)
- specs/ (5个规格文件)
- tasks.md (47个任务)
- .plan-mapping.md (已验证)

📊 任务统计:
- P0任务: 12个 (关键路径)
- P1任务: 20个 (重要)
- P2任务: 10个 (增强)
- P3任务: 5个 (可选)
- 预计总时间: 6小时30分钟

下一步:
- 运行 /multi-execute .codebuddy/plan/user-authentication.md
- 或运行 /opsx:continue user-authentication 完善工件
```

#### 4.2 生成质量报告
- 生成 `.codebuddy/docs/openspec-quality-reports/<change-name>-assessment.md`
- 包含详细的质量分析、评分明细、改进建议

## 高级功能

### 继续完善计划

如果质量评估显示需要改进,使用:

```bash
/opsx:continue <change-name>
```

这将:
- 加载现有OpenSpec工件
- 识别需要改进的部分
- 提供改进建议
- 更新工件

### 批量创建计划

创建多个相关的计划:

```bash
# 创建主计划
/opsx:plan "用户认证系统"

# 创建子计划 (引用主计划)
/opsx:plan "登录功能" --parent "用户认证系统"
/opsx:plan "注册功能" --parent "用户认证系统"
```

### 重新评估质量

对已有的OpenSpec变更进行质量评估:

```bash
/opsx:assess <change-name>
```

## 集成脚本

### 自动化脚本

创建自动化脚本来执行完整流程:

```bash
#!/bin/bash
# opsx-plan-auto.sh

FEATURE_NAME=$1

echo "🚀 开始OpenSpec计划流程: $FEATURE_NAME"

# Phase 1: 生成计划
echo "📋 Phase 1: 生成计划..."
/opsx:plan "$FEATURE_NAME" || exit 1

# Phase 2: 质量评估
echo "📊 Phase 2: 质量评估..."
ASSESSMENT=$(node .codebuddy/scripts/openspec-quality-assessment.js "$FEATURE_NAME")
SCORE=$(echo "$ASSESSMENT" | grep "综合得分" | grep -oP '\d+\.\d+')

if (( $(echo "$SCORE < 80" | bc -l) )); then
  echo "❌ 质量得分不足 ($SCORE < 80),请先改进"
  exit 1
fi

echo "✅ 质量评估通过 ($SCORE)"

# Phase 3: 自动执行 (可选)
echo "🤔 是否立即执行? (y/n)"
read -r ANSWER

if [ "$ANSWER" = "y" ]; then
  echo "⚡ Phase 3: 执行计划..."
  /multi-execute ".codebuddy/plan/${FEATURE_NAME}.md" --openspec "$FEATURE_NAME"
fi

echo "✅ 完成!"
```

## 与其他命令的对比

| 命令 | 用途 | OpenSpec集成 |
|------|------|--------------|
| `/plan` | 简单计划生成 | 无 |
| `/multi-plan` | 复杂计划生成 + 拆分 | 可选(通过--openspec) |
| `/opsx:plan` | OpenSpec完整流程 | **自动** |
| `/opsx:new` | 创建空OpenSpec变更 | 手动 |
| `/opsx:continue` | 继续完善OpenSpec工件 | 无 |

## 最佳实践

### 1. 小功能直接使用

对于小型功能(1-2小时):

```bash
/opsx:plan "添加用户头像上传功能"
```

### 2. 大功能使用拆分

对于大型功能(4+小时):

```bash
/opsx:plan "重构用户模块"
# multi-plan会自动拆分为子计划
```

### 3. 先评估再执行

```bash
# 1. 创建计划
/opsx:plan "用户认证"

# 2. 查看质量报告
cat .codebuddy/docs/openspec-quality-reports/user-authentication-assessment.md

# 3. 如需改进,继续完善
/opsx:continue user-authentication

# 4. 执行
/multi-execute .codebuddy/plan/user-authentication.md
```

### 4. 使用版本控制

将OpenSpec工件纳入版本控制:

```bash
git add openspec/changes/user-authentication/
git commit -m "feat: add user authentication plan"
```

## 故障排除

### 问题: 计划生成失败

**原因**: 需求描述不清晰

**解决**: 
- 提供更详细的需求描述
- 指定上下文文件
- 增加 --context 大小

### 问题: OpenSpec工件创建失败

**原因**: openspec目录未初始化

**解决**:
```bash
mkdir -p openspec/changes
```

### 问题: 质量评估得分低

**原因**: 计划不完整或任务粒度太大

**解决**:
- 查看 .codebuddy/docs/openspec-quality-decision-matrix.md
- 运行 /opsx:continue 完善工件
- 手动调整计划和任务

### 问题: 链接验证失败

**原因**: 文件路径错误或权限问题

**解决**:
```bash
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/<plan-file>
```

## 示例

### 示例1: 创建简单功能计划

```bash
/opsx:plan "添加用户忘记密码功能"
```

输出:
```
✅ 计划生成完成
✅ OpenSpec工件创建完成
📊 质量得分: 88/100 (良好)
```

### 示例2: 创建大型功能计划(自动拆分)

```bash
/opsx:plan "实现完整的电商购物车"
```

输出:
```
✅ 计划拆分为3个子计划:
  - cart-core.md (购物车核心功能)
  - cart-ui.md (用户界面)
  - cart-checkout.md (结账流程)

✅ 每个子计划都有OpenSpec工件
📊 平均质量得分: 91/100 (优秀)
```

### 示例3: 使用专家级分析

```bash
/opsx:plan "重构数据库层" --expertise expert
```

输出:
```
✅ 专家级分析完成
📊 深度架构审查
📊 技术债务评估
📊 性能影响分析
```

## 参考文档

- [.codebuddy/docs/openspec-best-integration-solution.md](openspec-best-integration-solution.md) - 完整集成方案
- [.codebuddy/docs/openspec-quality-decision-matrix.md](openspec-quality-decision-matrix.md) - 质量评估标准
- [.codebuddy/docs/openspec-quality-rules.md](openspec-quality-rules.md) - 质量检查规则
- [multi-plan.md](multi-plan.md) - 计划生成命令
- [multi-execute.md](multi-execute.md) - 计划执行命令

---

**命令版本**: 1.0  
**最后更新**: 2026-02-27
