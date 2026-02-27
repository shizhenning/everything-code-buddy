# OpenSpec 示例和常见问题

本文档包含OpenSpec集成系统的完整示例和常见问题解答。

## 📚 完整示例

### 示例1: 简单功能 - 用户头像上传

#### 场景描述

为一个用户系统添加头像上传功能,包括:
- 前端上传组件
- 后端API接收文件
- 文件存储服务
- 用户档案更新

#### 完整流程

**步骤1: 创建计划**

```bash
/opsx:plan "添加用户头像上传功能"
```

**系统生成的计划文件** (`.codebuddy/plan/user-avatar-upload.md`):

```markdown
# 用户头像上传功能

## 目标
为用户系统添加头像上传功能,允许用户上传和更新个人头像。

## 范围
- 创建前端上传组件
- 实现后端API接收文件
- 集成文件存储服务
- 更新用户档案

## 技术方案
- 前端: React + Dropzone组件
- 后端: Express + Multer
- 存储: 本地文件系统或云存储

## 实施步骤
1. 创建AvatarUpload组件
2. 实现上传API端点
3. 配置文件存储
4. 更新用户档案
```

**生成的OpenSpec工件**:

```
openspec/changes/user-avatar-upload/
├── proposal.md       # 提案文档
├── design.md         # 设计文档
├── specs/            # 规格文件
│   ├── api-spec.md
│   └── ui-spec.md
├── tasks.md          # 任务列表
└── .plan-mapping.md  # 映射表
```

**tasks.md示例**:

```markdown
# 任务列表

### P0: 核心功能

- [ ] 创建 `src/components/AvatarUpload.tsx` 组件结构
- [ ] 集成 Dropzone 库实现拖拽上传
- [ ] 实现图片预览功能
- [ ] 添加文件类型验证(jpg, png, gif)
- [ ] 添加文件大小限制(最大5MB)
- [ ] 实现 `POST /api/users/avatar` API端点
- [ ] 配置 Multer 中间件处理文件上传
- [ ] 实现文件存储到 `uploads/avatars/` 目录
- [ ] 更新用户档案中的avatar字段
- [ ] 处理文件上传错误

### P1: 重要功能

- [ ] 添加上传进度显示
- [ ] 实现图片压缩功能
- [ ] 添加头像裁剪功能
- [ ] 实现头像删除功能
- [ ] 添加上传成功通知

### P2: 增强功能

- [ ] 支持云存储(S3/阿里云OSS)
- [ ] 添加CDN加速
- [ ] 实现图片缓存
- [ ] 添加批量上传功能

### P3: 可选功能

- [ ] 添加GIF头像支持
- [ ] 实现头像动画效果
- [ ] 添加头像历史记录
- [ ] 集成第三方头像服务(Gravatar)
```

**步骤2: 执行计划**

```bash
/multi-execute .codebuddy/plan/user-avatar-upload.md
```

**步骤3: 查看进度**

```bash
node .codebuddy/scripts/openspec-progress-visualizer.js user-avatar-upload --html
```

**步骤4: 验证完成**

```bash
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/user-avatar-upload.md
node .codebuddy/scripts/generate-consistency-report.js user-avatar-upload
```

### 示例2: 复杂功能 - 购物车系统

#### 场景描述

实现一个完整的电商购物车系统,包括:
- 商品添加/删除
- 数量调整
- 价格计算
- 优惠券应用
- 库存检查

#### 计划拆分

由于功能复杂,系统会自动拆分为多个子计划:

```
.codebuddy/plan/
├── shopping-cart-master.md    # 主计划
├── cart-core.md              # 核心功能
├── cart-pricing.md           # 价格计算
├── cart-coupons.md           # 优惠券
└── cart-inventory.md         # 库存管理
```

**主计划** (`shopping-cart-master.md`):

```markdown
# 购物车系统

## 目标
实现完整的电商购物车系统。

## 子计划执行顺序
1. cart-core.md - 核心功能(添加、删除、修改数量)
2. cart-inventory.md - 库存管理
3. cart-pricing.md - 价格计算
4. cart-coupons.md - 优惠券

## 依赖关系
- cart-pricing.md 依赖 cart-core.md
- cart-coupons.md 依赖 cart-pricing.md
```

**子计划** (`cart-core.md`):

```markdown
# 购物车核心功能

## 目标
实现购物车的核心功能。

## 关联 OpenSpec 变更
- openspec/changes/shopping-cart/core/

## 实施步骤
1. 创建购物车数据模型
2. 实现添加商品接口
3. 实现删除商品接口
4. 实现修改数量接口
5. 实现获取购物车接口
```

#### 执行流程

```bash
# 1. 创建主计划(自动生成子计划)
/opsx:plan "实现购物车系统"

# 2. 执行主计划(会自动按顺序执行子计划)
/multi-execute .codebuddy/plan/shopping-cart-master.md

# 3. 查看每个子计划的进度
node .codebuddy/scripts/openspec-progress-visualizer.js shopping-cart --html
```

### 示例3: 质量改进流程

#### 场景

创建计划后质量评估得分低于阈值(75/100),需要改进。

#### 改进流程

**步骤1: 创建计划**

```bash
/opsx:plan "实现用户订阅系统"
```

**输出**:
```
✅ OpenSpec计划创建完成

📊 质量评估:
- 计划质量: 70/100
- OpenSpec完整性: 75/100
- 任务可执行性: 80/100
- 综合得分: 75/0/100

决策: ❌ 需要改进

问题:
- 任务粒度太大(部分任务超过30分钟)
- 缺少规格文件
- 验收标准不够明确
```

**步骤2: 查看详细评估报告**

```bash
cat .codebuddy/docs/openspec-quality-reports/user-subscription-assessment.md
```

**步骤3: 继续完善**

```bash
/opsx:continue user-subscription
```

系统会:
- 使用task-refiner重新细化任务
- 补充缺失的规格文件
- 明确验收标准

**步骤4: 重新评估**

```bash
node .codebuddy/scripts/openspec-quality-assessment.js user-subscription
```

**输出**:
```
✅ 质量评估更新

📊 质量评估:
- 计划质量: 88/100
- OpenSpec完整性: 90/100
- 任务可执行性: 92/100
- 综合得分: 90.0/100

决策: ✅ 批准执行
```

**步骤5: 执行计划**

```bash
/multi-execute .codebuddy/plan/user-subscription.md
```

---

## ❓ 常见问题 (FAQ)

### 基础问题

#### Q1: 什么是OpenSpec?

**A**: OpenSpec是一个结构化的变更管理系统,用于跟踪从计划到实现的完整流程。它包括:
- **计划文档**: 实施计划
- **OpenSpec工件**: proposal, design, specs, tasks
- **双向链接**: 确保可追溯性
- **质量评估**: 多维度质量保证

#### Q2: 什么时候应该使用OpenSpec?

**A**: 建议:
- **必须使用**: 复杂功能(>2小时)、团队协作、需要质量保证
- **推荐使用**: 中等功能(30分钟-2小时)、需要可追溯性
- **可选**: 简单功能(<30分钟)、个人项目

#### Q3: OpenSpec和普通/multi-plan有什么区别?

**A**: 
| 特性 | /multi-plan | /opsx:plan |
|------|-------------|------------|
| 计划生成 | ✅ | ✅(调用/multi-plan) |
| OpenSpec工件 | ❌ | ✅自动创建 |
| 任务细化 | 可选 | ✅自动 |
| 质量评估 | ❌ | ✅自动 |
| 链接管理 | ❌ | ✅自动 |
| 进度跟踪 | ❌ | ✅支持 |

### 使用问题

#### Q4: 如何开始使用OpenSpec?

**A**: 最简单的方式:
```bash
/opsx:plan "你的功能描述"
```

就这么简单!系统会自动完成所有工作。

#### Q5: 质量评估得分低怎么办?

**A**: 按以下步骤:
```bash
# 1. 查看详细评估报告
cat .codebuddy/docs/openspec-quality-reports/your-change-assessment.md

# 2. 继续完善
/opsx:continue your-change

# 3. 重新评估
node .codebuddy/scripts/openspec-quality-assessment.js your-change

# 4. 得分≥80后执行
/multi-execute .codebuddy/plan/your-change.md
```

#### Q6: 如何查看进度?

**A**: 有多种方式:
```bash
# 方式1: 终端报告
node .codebuddy/scripts/openspec-progress-visualizer.js your-change

# 方式2: HTML报告
node .codebuddy/scripts/openspec-progress-visualizer.js your-change --html

# 方式3: 直接查看tasks.md
cat openspec/changes/your-change/tasks.md
```

#### Q7: 任务状态没有自动更新怎么办?

**A**: 检查以下几点:
```bash
# 1. 确认使用的是OpenSpec模式
/multi-execute .codebuddy/plan/your-plan.md
# 确保有 --openspec your-change 参数

# 2. 检查tasks.md格式
# 必须使用checkbox格式:
# - [x] 已完成
# - [ ] 未完成

# 3. 手动更新任务状态
# 使用 replace_in_file 或直接编辑 tasks.md
```

#### Q8: 如何修改计划?

**A**: 
- **小修改**: 直接编辑 `.codebuddy/plan/your-plan.md`
- **大修改**: 重新生成 `/opsx:plan "更新后的描述"`
- **继续完善**: `/opsx:continue your-change`

### 技术问题

#### Q9: 链接验证失败怎么办?

**A**: 
```bash
# 1. 查看详细错误
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/your-plan.md

# 2. 重新创建链接
node .codebuddy/scripts/openspec-link-creator.js create \
  .codebuddy/plan/your-plan.md \
  openspec/changes/your-change

# 3. 重新验证
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/your-plan.md
```

#### Q10: 如何集成到CI/CD?

**A**: 创建GitHub Actions workflow:

```yaml
# .github/workflows/openspec-check.yml
name: OpenSpec Quality Check

on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Run Quality Check
        run: |
          node .codebuddy/scripts/openspec-quality-assessment.js ${{ github.event.head_commit.message }}
```

#### Q11: 如何自定义质量评估规则?

**A**: 创建自定义评估脚本:

```javascript
// .codebuddy/scripts/custom-quality-assessment.js
const fs = require('fs');

function customAssessment(changeName) {
  const tasksPath = `openspec/changes/${changeName}/tasks.md`;
  const content = fs.readFileSync(tasksPath, 'utf-8');
  
  // 自定义规则
  const taskCount = (content.match(/-\s+\[[ x]\]/g) || []).length;
  
  return {
    score: taskCount > 50 ? 100 : 80,
    message: taskCount > 50 ? '任务数量充足' : '建议增加更多任务'
  };
}

module.exports = { customAssessment };
```

#### Q12: 如何迁移现有计划到OpenSpec?

**A**: 
```bash
# 1. 手动创建OpenSpec目录结构
mkdir -p openspec/changes/your-change/specs

# 2. 复制现有计划
cp .codebuddy/plan/your-plan.md openspec/changes/your-change/proposal.md

# 3. 创建链接
node .codebuddy/scripts/openspec-link-creator.js create \
  .codebuddy/plan/your-plan.md \
  openspec/changes/your-change

# 4. 细化任务(使用task-refiner)
Task({
  subagent_name: "task-refiner",
  description: "Refine tasks",
  prompt: "Please refine the plan into granular tasks."
})
```

### 高级问题

#### Q13: 如何批量创建相关计划?

**A**: 使用父计划引用:

```bash
# 1. 创建主计划
/opsx:plan "用户认证系统"

# 2. 创建子计划(引用主计划)
/opsx:plan "登录功能" --parent "用户认证系统"
/opsx:plan "注册功能" --parent "用户认证系统"
/opsx:plan "密码重置" --parent "用户认证系统"
```

#### Q14: 如何回滚已完成的工作?

**A**: 
```bash
# 1. 使用git回滚代码
git reset --hard HEAD~1

# 2. 更新tasks.md中的任务状态
# 将已完成的任务改为未完成

# 3. 重新验证
node .codebuddy/scripts/validate-plan-links.js .codebuddy/plan/your-plan.md
```

#### Q15: 如何导出OpenSpec工件?

**A**: 
```bash
# 1. 导出为ZIP
zip -r openspec-export.zip openspec/changes/your-change/

# 2. 导出为PDF(需要pandoc)
pandoc openspec/changes/your-change/proposal.md -o proposal.pdf
pandoc openspec/changes/your-change/design.md -o design.pdf
pandoc openspec/changes/your-change/tasks.md -o tasks.pdf
```

---

## 🎓 最佳实践总结

### 命名规范

- ✅ 使用kebab-case: `user-authentication`, `shopping-cart`
- ✅ 描述性名称: `user-avatar-upload`, `api-rate-limiting`
- ❌ 避免空格和特殊字符

### 任务粒度

- ✅ 3-10分钟/任务
- ✅ 独立可执行
- ✅ 明确的验收标准
- ❌ 避免超过15分钟的大任务

### 质量保证

- ✅ 综合得分≥80才执行
- ✅ 定期运行质量评估
- ✅ 修复所有P0问题
- ✅ 参考质量决策矩阵

### 进度跟踪

- ✅ 每次会话后查看进度
- ✅ 生成HTML报告便于分享
- ✅ 实时更新任务状态
- ✅ 定期验证链接完整性

### 版本控制

- ✅ 将OpenSpec工件纳入git
- ✅ 每个变更独立commit
- ✅ 使用清晰的commit message
- ✅ 定期push到远程

---

## 📖 更多资源

- [OpenSpec Onboarding Guide](openspec-onboarding-guide.md) - 快速入门指南
- [OpenSpec最佳集成方案](openspec-best-integration-solution.md) - 完整技术方案
- [质量决策矩阵](openspec-quality-decision-matrix.md) - 质量评估标准
- [质量检查规则](../rules/openspec-quality-rules.md) - 15条质量规则

---

**文档版本**: 1.0  
**最后更新**: 2026-02-27
