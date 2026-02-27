# 手动更新计划链命令参考

本文档提供在 OpenSpec 工作流中手动更新计划链所需的命令。

---

## 目录

1. [更新计划链的基本步骤](#更新计划链的基本步骤)
2. [常用命令模板](#常用命令模板)
3. [更新单个 Artifacts](#更新单个-artifacts)
4. [批量更新多个 Artifacts](#批量更新多个-artifacts)
5. [验证更新结果](#验证更新结果)

---

## 更新计划链的基本步骤

### 步骤 1: 确认当前计划链

```
请阅读当前的计划链文件，确认:
- 所有计划的状态
- 每个计划对应的 artifact 文件
- 计划之间的依赖关系
```

### 步骤 2: 确定需要更新的内容

```
明确以下信息:
- 哪些计划需要更新状态?
- 是否需要删除已完成的计划?
- 是否需要添加新的计划?
- 每个计划的具体修改内容是什么?
```

### 步骤 3: 使用 `replace_in_file` 工具更新计划链

```
使用 replace_in_file 工具更新计划链文件:
1. 定位要修改的计划行
2. 替换为新内容
3. 确保格式正确
```

### 步骤 4: 验证更新

```
检查更新后的计划链:
- 格式是否正确
- 状态是否正确
- 是否有遗漏或错误
```

---

## 常用命令模板

### 更新计划状态

```
将某个计划从 "pending" 更新为 "in_progress":
```

```yaml
# 原始内容
- id: "1"
  status: "pending"
  content: "创建 Delta Spec"
  artifact: "delta-spec.md"

# 更新后
- id: "1"
  status: "in_progress"
  content: "创建 Delta Spec"
  artifact: "delta-spec.md"
```

---

## 更新单个 Artifacts

### 更新 Delta Spec

**使用场景:**
- Delta Spec 内容需要调整
- 需求有澄清或变更

**命令示例:**

```markdown
请更新 Delta Spec 文件:

文件路径: `.codebuddy/brain/{conversation-id}/artifacts/delta-spec.md`

修改内容:
- 更新"变更描述"部分
- 调整"成功标准"
- 添加新的"依赖项"

使用 `replace_in_file` 工具进行更新。
```

---

### 更新技术方案

**使用场景:**
- 技术方案需要细化
- 发现更好的技术方案
- 需要添加更多细节

**命令示例:**

```markdown
请更新技术方案文件:

文件路径: `.codebuddy/brain/{conversation-id}/artifacts/technical-solution.md`

修改内容:
- 添加新的技术选型
- 更新架构图
- 补充实现细节

使用 `replace_in_file` 工具进行更新。
```

---

### 更新实施计划

**使用场景:**
- 需要调整实施顺序
- 添加新的实施步骤
- 删除不需要的步骤

**命令示例:**

```markdown
请更新实施计划文件:

文件路径: `.codebuddy/brain/{conversation-id}/artifacts/implementation-plan.md`

修改内容:
- 重新排序实施步骤
- 添加新的任务
- 更新估算工作量

使用 `replace_in_file` 工具进行更新。
```

---

### 更新测试计划

**使用场景:**
- 测试策略需要调整
- 发现新的测试场景
- 测试覆盖率需要提升

**命令示例:**

```markdown
请更新测试计划文件:

文件路径: `.codebuddy/brain/{conversation-id}/artifacts/test-plan.md`

修改内容:
- 添加新的测试用例
- 更新测试优先级
- 调整测试范围

使用 `replace_in_file` 工具进行更新。
```

---

## 批量更新多个 Artifacts

### 场景 1: 需求变更影响多个文档

**步骤:**

1. **先更新 Delta Spec**
   ```markdown
   更新 Delta Spec 中的需求描述
   ```

2. **更新技术方案**
   ```markdown
   根据新的需求调整技术方案
   ```

3. **更新实施计划**
   ```markdown
   调整实施步骤以匹配新的技术方案
   ```

4. **更新测试计划**
   ```markdown
   添加针对新需求的测试用例
   ```

5. **更新计划链**
   ```markdown
   更新所有相关计划的状态
   ```

---

### 场景 2: 实施中发现问题需要调整方案

**步骤:**

1. **暂停当前计划**
   ```yaml
   将当前计划状态改为 "pending"
   ```

2. **更新技术方案**
   ```markdown
   根据发现的问题调整技术方案
   ```

3. **更新实施计划**
   ```markdown
   重新规划实施步骤
   ```

4. **恢复计划链**
   ```yaml
   将计划状态改回 "in_progress"
   ```

---

### 场景 3: 完成某个 Artifact 后更新计划链

**步骤:**

1. **标记计划为已完成**
   ```yaml
   将计划状态从 "in_progress" 改为 "completed"
   ```

2. **启动下一个计划**
   ```yaml
   将下一个计划状态从 "pending" 改为 "in_progress"
   ```

3. **验证计划链**
   ```markdown
   检查计划链的连续性和完整性
   ```
   - 每个 artifact 完成后，计划链是否正确更新
   - 是否有遗漏的计划
   - 计划之间的依赖关系是否正确

---

## 验证更新结果

### 检查计划链格式

```markdown
请检查计划链文件:

1. 确认 YAML 格式正确
2. 检查每个计划都有必需的字段
3. 验证 status 字段只能是: pending, in_progress, completed, cancelled
4. 确认 plan_name 字段为 "Implementation Plan Chain"
```

---

### 检查 Artifacts 一致性

```markdown
请验证计划链与 Artifacts 的一致性:

1. 计划链中列出的所有 artifact 文件是否存在
2. 每个 artifact 的内容是否与计划链中的描述一致
3. 计划链的顺序是否反映了正确的依赖关系
```

---

### 检查进度

```markdown
请检查当前进度:

1. 已完成的计划数量
2. 进行中的计划数量
3. 待处理的计划数量
4. 总体进度百分比
```

---

## 常见问题和解决方案

### 问题 1: 计划链格式错误

**症状:**
- YAML 解析失败
- 字段缺失

**解决方案:**
```markdown
请检查:
1. 缩进是否正确 (使用 2 个空格)
2. 所有必需字段是否都存在 (id, status, content, artifact)
3. status 值是否在允许的范围内
```

---

### 问题 2: Artifact 文件不存在

**症状:**
- 计划链中引用的 artifact 文件不存在

**解决方案:**
```markdown
请执行以下步骤:
1. 检查文件路径是否正确
2. 如果文件需要创建，使用 write_to_file 工具创建
3. 如果计划链有误，使用 replace_in_file 工具修正计划链
```

---

### 问题 3: 计划链状态不一致

**症状:**
- 多个计划状态为 "in_progress"
- 计划链出现断裂

**解决方案:**
```markdown
请执行以下步骤:
1. 确认只有一个计划状态为 "in_progress"
2. 检查计划链的顺序是否正确
3. 确保每个计划完成后才启动下一个
```

---

## 附录

### A. 计划链字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| id | string | 是 | 计划的唯一标识符 |
| status | string | 是 | 计划状态: pending, in_progress, completed, cancelled |
| content | string | 是 | 计划的描述 |
| artifact | string | 是 | 对应的 artifact 文件名 |

---

### B. Artifact 文件命名约定

| Artifact 类型 | 文件名 | 说明 |
|--------------|--------|------|
| Delta Spec | delta-spec.md | 变更规范 |
| Main Spec 更新计划 | main-spec-update-plan.md | 主规范更新计划 |
| 技术方案 | technical-solution.md | 技术实现方案 |
| 实施计划 | implementation-plan.md | 详细实施步骤 |
| 测试计划 | test-plan.md | 测试策略和用例 |
| 部署计划 | deployment-plan.md | 部署方案 |
| 验证报告 | verification-report.md | 验证结果报告 |
| 归档总结 | archive-summary.md | 变更归档总结 |

---

### C. 命令工具参考

| 工具 | 用途 | 适用场景 |
|------|------|----------|
| read_file | 读取文件内容 | 查看当前计划链或 artifact |
| write_to_file | 创建新文件 | 创建新的 artifact 文件 |
| replace_in_file | 替换文件内容 | 更新现有计划链或 artifact |
| open_result_view | 打开结果视图 | 预览 artifact 内容 |

---

### D. 相关文档

- [OpenSpec 计划链维护策略](openspec-plan-chain-maintenance.md)
- [OpenSpec 设计文档](openspec/openspec-design.yaml)
- [完整集成方案评估](complete-integrated-solution-evaluation.md)
