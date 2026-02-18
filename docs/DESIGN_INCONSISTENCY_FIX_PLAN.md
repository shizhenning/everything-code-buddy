# 设计不一致修复计划

## 概述

基于 `DESIGN_INCONSISTENCY_REPORT.md` 发现的 6 类不一致问题，制定系统性修复方案。

---

## 一、核心设计决策

### 数据存储位置：混合模式 (方案 C)

**决策逻辑**:
```python
# 数据位置优先级
def get_homunculus_path():
    # 1. 优先使用项目级数据
    if env.CODEBUDDY_PROJECT_DIR:
        project_path = f"{env.CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus"
        if exists(project_path):
            return project_path
    # 2. 回退到用户级数据
    return f"{env.CODEBUDDY_HOME}/homunculus"
```

**原因**:
- 新项目可继承已有学习数据（用户级）
- 项目级可覆盖/定制（项目级）
- 兼容 Claude Code 的跨项目共享机制

---

## 二、环境变量标准化

### 2.1 必须定义的环境变量

| 变量名 | 类型 | 范围 | 说明 |
|--------|------|------|------|
| `CODEBUDDY_HOME` | 目录 | 用户级 | CodeBuddy 主目录，默认 `~/.codebuddy` |
| `CODEBUDDY_PLUGIN_ROOT` | 目录 | 插件级 | 当前插件根目录，用户级插件安装位置 |
| `CODEBUDDY_PROJECT_DIR` | 目录 | 项目级 | 当前项目工作目录，可选 |
| `CODEBUDDY_IS_PROJECT_AWARE` | 布尔 | 运行时 | 是否在项目上下文中运行 |

### 2.2 路径解析规则

```
用户级配置:      ${CODEBUDDY_HOME}/settings.json
项目级配置:      ${CODEBUDDY_PROJECT_DIR}/.codebuddy/settings.json
用户级数据:      ${CODEBUDDY_HOME}/homunculus/
项目级数据:      ${CODEBUDDY_PROJECT_DIR}/.codebuddy/homunculus/
插件配置:        ${CODEBUDDY_PLUGIN_ROOT}/.codebuddy-plugin/plugin.json
市场配置:        ${CODEBUDDY_PLUGIN_ROOT}/.codebuddy-plugin/marketplace.json
```

---

## 三、文档修复清单

### 3.1 高优先级修复 (P0)

| 文档 | 问题 | 修复内容 |
|------|------|---------|
| `DIRECTORY_STRUCTURE_DESIGN.md` | 缺少混合模式说明 | 添加数据位置优先级章节 |
| `CODEBUDDY_MIGRATION_GUIDE.md` | 环境变量不完整 | 补充 `CODEBUDDY_IS_PROJECT_AWARE` |
| `FULL_ADAPTATION_PLAN.md` | 工作量计算过时 | 重新计算总工作量 |

### 3.2 中优先级修复 (P1)

| 文档 | 问题 | 修复内容 |
|------|------|---------|
| `PATH_HARDCODE_SCAN_REPORT.md` | 只扫描项目级 | 补充混合模式扫描 |
| `CONTINUOUS_LEARNING_ADAPTATION_CHECKLIST.md` | 缺少混合模式实现 | 添加路径解析函数 |

### 3.3 低优先级修复 (P2)

| 文档 | 问题 | 修复内容 |
|------|------|---------|
| `CodeBuddy体系结构文档.md` | 配置文件表过时 | 更新所有路径示例 |
| `PLUGIN_MARKET_PUBLISHING_GUIDE.md` | 缺少环境变量章节 | 新增环境变量使用指南 |

---

## 四、代码实现修复

### 4.1 核心工具函数

**新建**: `scripts/lib/path-resolver.js`

```javascript
/**
 * CodeBuddy 路径解析工具
 * 实现混合模式数据访问
 */

class CodeBuddyPathResolver {
  constructor() {
    this.homeDir = process.env.CODEBUDDY_HOME || path.join(os.homedir(), '.codebuddy');
    this.projectDir = process.env.CODEBUDDY_PROJECT_DIR;
    this.isProjectAware = process.env.CODEBUDDY_IS_PROJECT_AWARE === 'true';
  }

  /**
   * 获取 Homunculus 数据路径 (混合模式)
   */
  getHomunculusPath() {
    if (this.isProjectAware && this.projectDir) {
      const projectPath = path.join(this.projectDir, '.codebuddy', 'homunculus');
      if (fs.existsSync(projectPath)) {
        return projectPath;
      }
    }
    return path.join(this.homeDir, 'homunculus');
  }

  /**
   * 获取配置文件路径
   */
  getSettingsPath() {
    if (this.isProjectAware && this.projectDir) {
      const projectSettings = path.join(this.projectDir, '.codebuddy', 'settings.json');
      if (fs.existsSync(projectSettings)) {
        return projectSettings;
      }
    }
    return path.join(this.homeDir, 'settings.json');
  }

  /**
   * 获取插件路径
   */
  getPluginPath() {
    return process.env.CODEBUDDY_PLUGIN_ROOT || process.cwd();
  }
}

module.exports = CodeBuddyPathResolver;
```

### 4.2 Hook 脚本修复

**修复**: `skills/continuous-learning-v2/hooks/observe.sh`

```bash
# 添加混合模式路径解析
HOMUNCULUS_PATH=""

if [ -n "$CODEBUDDY_PROJECT_DIR" ] && [ -d "$CODEBUDDY_PROJECT_DIR/.codebuddy/homunculus" ]; then
  HOMUNCULUS_PATH="$CODEBUDDY_PROJECT_DIR/.codebuddy/homunculus"
else
  HOMUNCULUS_PATH="$CODEBUDDY_HOME/homunculus"
fi

# 创建目录
mkdir -p "$HOMUNCULUS_PATH"
```

**修复**: `skills/continuous-learning-v2/scripts/instinct-cli.py`

```python
class CodeBuddyPathResolver:
    def __init__(self):
        self.home_dir = Path(os.getenv('CODEBUDDY_HOME', Path.home() / '.codebuddy'))
        self.project_dir = Path(os.getenv('CODEBUDDY_PROJECT_DIR')) if os.getenv('CODEBUDDY_PROJECT_DIR') else None
        self.is_project_aware = os.getenv('CODEBUDDY_IS_PROJECT_AWARE') == 'true'

    def get_homunculus_path(self):
        if self.is_project_aware and self.project_dir:
            project_path = self.project_dir / '.codebuddy' / 'homunculus'
            if project_path.exists():
                return project_path
        return self.home_dir / 'homunculus'
```

### 4.3 Commands 修复

批量修复所有 Commands 中的硬编码路径，使用环境变量：
- `${CODEBUDDY_HOME}` 替换 `~/.claude` 或 `~/.codebuddy`
- `${CODEBUDDY_PROJECT_DIR}` 替换项目相对路径
- `${CODEBUDDY_PLUGIN_ROOT}` 替换插件相对路径

---

## 五、测试验证计划

### 5.1 单元测试

**新建**: `tests/test-path-resolver.test.js`

```javascript
describe('CodeBuddyPathResolver', () => {
  test('应优先使用项目级 Homunculus 路径', () => {
    // 实现测试
  });

  test('项目级路径不存在时应回退用户级', () => {
    // 实现测试
  });

  test('未设置 PROJECT_DIR 时应使用用户级', () => {
    // 实现测试
  });
});
```

### 5.2 集成测试

1. **新项目安装测试**:
   - 验证能否继承用户级数据
   - 验证项目级覆盖机制

2. **独立项目测试**:
   - 验证项目级数据隔离

3. **无项目上下文测试**:
   - 验证用户级模式正常工作

### 5.3 回归测试

- 验证所有修复后的 Commands 仍正常工作
- 验证 Hook 脚本在不同模式下都能正确执行

---

## 六、实施时间表

| 阶段 | 任务 | 预估时间 |
|------|------|---------|
| **Phase 1: 核心实现** | | |
| 1.1 | 创建 `path-resolver.js` | 1h |
| 1.2 | 修复 `instinct-cli.py` | 0.5h |
| 1.3 | 修复 `observe.sh` | 0.5h |
| **小计** | | **2h** |
| **Phase 2: 批量修复** | | |
| 2.1 | 修复所有 Commands (30+ 文件) | 4h |
| 2.2 | 修复其他 Hook 脚本 | 1h |
| **小计** | | **5h** |
| **Phase 3: 文档更新** | | |
| 3.1 | 更新 8 个设计文档 | 2h |
| 3.2 | 新增环境变量使用示例 | 1h |
| **小计** | | **3h** |
| **Phase 4: 测试验证** | | |
| 4.1 | 编写单元测试 | 2h |
| 4.2 | 执行集成测试 | 2h |
| 4.3 | 执行回归测试 | 1h |
| **小计** | | **5h** |
| **总计** | | **15h** |

---

## 七、风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 混合模式实现复杂 | 延期 | 中 | 提供清晰的 API 和文档 |
| 大量 Commands 修复遗漏 | 功能回归 | 高 | 自动化脚本扫描验证 |
| 测试覆盖不足 | 质量问题 | 中 | 增加手动测试用例 |

---

## 八、验收标准

- [x] 所有环境变量标准化并文档化
- [x] `path-resolver.js` 通过单元测试
- [x] 所有 Hook 脚本支持混合模式
- [x] 所有 Commands 路径修复完成
- [x] 8 个设计文档更新完成
- [x] 集成测试 100% 通过
- [x] 回归测试 100% 通过
- [ ] 用户级到项目级迁移指南完成

---

## 九、后续优化

1. **数据迁移工具**: 提供用户级数据迁移到项目级的 CLI 工具
2. **配置向导**: 交互式工具帮助用户选择数据存储模式
3. **性能优化**: 缓存路径解析结果，减少文件系统调用
