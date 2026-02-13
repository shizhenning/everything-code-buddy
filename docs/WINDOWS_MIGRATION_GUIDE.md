# Windows 迁移指南

## 快速开始

### 1. 前置要求

- **Windows 10/11**
- **Node.js** (v18+)
- **Python** (v3.x)
- **CodeBuddy CLI** (已安装)

### 2. 一键迁移

```powershell
# 克隆项目
git clone https://github.com/affaan-m/everything-claude-code.git
cd everything-claude-code

# 运行迁移（默认使用软链接）
node scripts/migrate-to-codebuddy.js

# 如果遇到权限问题，使用复制模式
node scripts/migrate-to-codebuddy.js --no-symlinks
```

### 3. 启用软链接（推荐）

软链接可以节省磁盘空间并支持自动更新。

#### 方法 1: 开发者模式（推荐）

1. 打开 **设置**
2. 进入 **更新和安全**
3. 选择 **开发者选项**
4. 开启 **开发者模式**

#### 方法 2: 管理员权限

1. 右键点击 **PowerShell**
2. 选择 **以管理员身份运行**
3. 执行迁移脚本

### 4. 配置 PowerShell

允许执行本地 PowerShell 脚本：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 5. 验证迁移

```powershell
# 查看迁移报告
cat .codebuddy/MIGRATION_REPORT.md

# 检查软链接（如果使用了软链接模式）
dir .codebuddy\skills\continuous-learning-v2

# 检查 PowerShell 脚本
dir .codebuddy\skills\continuous-learning-v2\hooks\*.ps1
dir .codebuddy\skills\continuous-learning-v2\agents\*.ps1
```

## Windows 特性

### PowerShell Hook 脚本

迁移脚本会自动为 Windows 生成 PowerShell 版本的 Hook 脚本：

| 文件 | 用途 | 平台 |
|------|------|------|
| `observe.sh` | Unix/Linux/macOS Hook | Bash |
| `observe.ps1` | Windows Hook | PowerShell |
| `start-observer.sh` | Unix 启动器 | Bash |
| `start-observer.ps1` | Windows 启动器 | PowerShell |

### 环境变量

自动适配 Windows 环境变量：

| 用途 | Unix | Windows |
|------|------|---------|
| 临时设置 | `export CODEBUDDY_PM=pnpm` | `$env:CODEBUDDY_PM = "pnpm"` |
| 永久设置 | 添加到 `.bashrc` | `[Environment]::SetEnvironmentVariable(...)` |

```powershell
# 临时设置
$env:CODEBUDDY_PACKAGE_MANAGER = "pnpm"

# 永久设置（当前用户）
[Environment]::SetEnvironmentVariable("CODEBUDDY_PACKAGE_MANAGER", "pnpm", "User")

# 永久设置（所有用户，需要管理员）
[Environment]::SetEnvironmentVariable("CODEBUDDY_PACKAGE_MANAGER", "pnpm", "Machine")
```

### 路径映射

自动转换 Unix 路径到 Windows 路径：

| Unix | Windows |
|------|---------|
| `${HOME}/.claude/homunculus` | `%USERPROFILE%\.claude\homunculus` |
| `${CLAUDE_PLUGIN_ROOT}` | `${CODEBUDDY_PROJECT_DIR}` |
| `/path/to/file` | `C:\path\to\file` |

## 故障排除

### 软链接创建失败

**错误信息**: `Warning: Symlinks not supported, falling back to copy`

**解决方案**:

1. 启用开发者模式
2. 以管理员身份运行 PowerShell
3. 或使用 `--no-symlinks` 参数强制复制模式

### PowerShell 执行被阻止

**错误信息**: `Execution Policy` 相关错误

**解决方案**:

```powershell
# 设置执行策略为 RemoteSigned（推荐）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 或临时允许（不推荐）
Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope Process
```

### Python 未找到

**错误信息**: `python: command not found`

**解决方案**:

1. 安装 Python 3.x: https://www.python.org/downloads/
2. 安装时勾选 "Add Python to PATH"
3. 或手动添加到系统 PATH

### 环境变量未生效

**症状**: 设置了环境变量但 IDE 中仍使用旧值

**解决方案**:

1. 重启 IDE
2. 重启 PowerShell
3. 检查系统环境变量设置

## 使用示例

### 迁移后测试

```powershell
# 测试 Commands
codebuddy /plan "test feature"
codebuddy /tdd
codebuddy /code-review

# 测试 Agents
codebuddy --agent python-reviewer
codebuddy --agent database-reviewer

# 查看本能（Continuous Learning v2）
codebuddy /instinct-status
```

### 查看 Hook 日志

```powershell
# 查看观察日志
type %USERPROFILE%\.claude\homunculus\observations.jsonl

# 查看观察器日志
type %USERPROFILE%\.claude\homunculus\observer.log
```

### 管理软链接

```powershell
# 查看软链接目标
dir .codebuddy\skills\continuous-learning-v2\hooks\observe.ps1

# 删除软链接（会删除目标文件吗？不会）
del .codebuddy\skills\continuous-learning-v2\hooks\observe.ps1

# 重新创建软链接
# 手动使用 mklink
mklink /J .codebuddy\skills\continuous-learning-v2\hooks\observe.ps1 skills\continuous-learning-v2\hooks\observe.ps1
```

## 高级配置

### 自定义迁移

编辑迁移脚本配置：

```javascript
const CONFIG = {
  // ... 其他配置
  useSymlinks: false,  // 强制使用复制模式
};
```

### 持久化配置

创建 `migration.config.json`：

```json
{
  "useSymlinks": true,
  "platform": "win32",
  "generateWindowsScripts": true
}
```

### 跳过特定组件

```powershell
# 手动迁移部分组件
node scripts/migrate-to-codebuddy.js

# 然后手动调整
# - 编辑 .codebuddy/settings.json
# - 复制/删除特定文件
```

## 参考文档

- [Windows 支持和软链接迁移方案](./WINDOWS_SYMLINK_MIGRATION.md)
- [CodeBuddy 迁移指南](./CODEBUDDY_MIGRATION_GUIDE.md)
- [兼容性矩阵](./CODEBUDDY_COMPATIBILITY_MATRIX.md)
- [Observer Agent 适配分析](./OBSERVE_AGENT_ANALYSIS.md)

## 社区支持

- **Issues**: https://github.com/affaan-m/everything-claude-code/issues
- **Discussions**: https://github.com/affaan-m/everything-claude-code/discussions

## 许可证

MIT License - 详见项目根目录
