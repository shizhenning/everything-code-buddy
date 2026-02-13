# Windows 支持和软链接迁移方案

## 概述

本文档总结了为 ECC → CodeBuddy 迁移脚本添加的 Windows 支持和软链接功能。

## 主要改进

### 1. Windows 平台支持 ✅

#### 1.1 PowerShell Hook 脚本

为 Continuous Learning v2 生成了 Windows 兼容的 PowerShell 脚本：

**`observe.ps1`** - 观察钩子脚本
- 完整的 PowerShell 实现
- 支持 PreToolUse 和 PostToolUse 事件
- 使用 Python 进行 JSON 解析（与 Bash 版本保持一致）
- Windows 路径处理：`%USERPROFILE%\.claude\homunculus`
- 触发环境变量：`CODEBUDDY_PROJECT_DIR`

**`start-observer.ps1`** - 观察代理启动器
- 支持 start/stop/status 操作
- Windows PID 管理方式
- 注意：CodeBuddy 不支持后台代理模式，仅提供参考

#### 1.2 环境变量适配

自动替换的环境变量：

| Claude Code | CodeBuddy | 用途 |
|-------------|-----------|------|
| `${CLAUDE_PLUGIN_ROOT}` | `${CODEBUDDY_PROJECT_DIR}` | 插件根目录 |
| `${CLAUDE_PROJECT_ROOT}` | `${CODEBUDDY_PROJECT_DIR}` | 项目根目录 |
| `${HOME}/.claude` | `${USERPROFILE}\.claude` | 配置目录 |

#### 1.3 路径处理

- **Bash**: `${HOME}/.claude/homunculus`
- **PowerShell**: `%USERPROFILE%\.claude\homunculus`

### 2. 软链接（符号链接）支持 ✅

#### 2.1 为什么要用软链接？

使用软链接替代文件复制具有以下优势：

| 优势 | 说明 |
|------|------|
| **Plugin Publishing** | 便于作为 CodeBuddy 插件发布 |
| **Auto Updates** | 源文件更改自动反映到 .codebuddy/ |
| **Disk Space** | 减少磁盘占用（无重复文件） |
| **Version Control** | 更好的变更追踪 |

#### 2.2 实现方式

**Unix/Linux/macOS**:
```javascript
fs.symlinkSync(src, dest);  // 符号链接
```

**Windows**:
```javascript
// 优先使用 Junction（目录）
execSync(`mklink /J "${dest}" "${src}"`, { shell: true });

// 文件使用硬链接
execSync(`mklink /H "${dest}" "${src}"`, { shell: true });
```

#### 2.3 权限要求

**Windows**:
- 需要启用开发者模式，或
- 需要管理员权限

**自动降级机制**:
- 如果软链接创建失败，自动回退到文件复制
- 记录警告信息

#### 2.4 使用方法

```bash
# 默认使用软链接
node scripts/migrate-to-codebuddy.js

# 强制使用复制
node scripts/migrate-to-codebuddy.js --no-symlinks
```

### 3. Continuous Learning v2 特殊处理 ✅

#### 3.1 新增迁移方法

```javascript
migrateContinuousLearningV2() {
  // 1. 迁移整个 skill 目录
  // 2. 生成 Windows 脚本（如果需要）
  // 3. 更新环境变量
  // 4. 生成报告
}
```

#### 3.2 Windows 脚本生成

自动检测平台，生成相应脚本：

| 脚本 | Unix | Windows |
|------|------|---------|
| 观察钩子 | `observe.sh` | `observe.ps1` |
| 启动器 | `start-observer.sh` | `start-observer.ps1` |

#### 3.3 环境变量更新

自动更新以下文件中的环境变量：

- `skills/continuous-learning-v2/hooks/observe.sh`
- `skills/continuous-learning-v2/hooks/observe.ps1`
- `skills/continuous-learning-v2/agents/observer.md`
- `skills/continuous-learning-v2/SKILL.md`

### 4. 改进的迁移报告 ✅

#### 4.1 新增信息

- **Platform**: 显示目标平台（win32/darwin/linux）
- **Migration Method**: 软链接/复制
- **CL v2 Status**: Continuous Learning v2 迁移状态

#### 4.2 平台特定章节

**Windows 特有内容**:
- PowerShell 执行策略设置说明
- 环境变量配置方法（永久 vs 临时）
- Junction 权限说明
- Windows 路径映射

**Unix 特有内容**:
- Bash 环境变量配置
- 符号链接说明

#### 4.3 软链接优势说明

新增章节说明使用软链接的好处：
- 插件发布便利性
- 自动更新能力
- 磁盘空间节省
- 版本控制优势

## 文件修改清单

### 主要文件: `scripts/migrate-to-codebuddy.js`

#### 修改部分

| 行号 | 修改内容 | 说明 |
|------|---------|------|
| 1-2 | 新增 platform 检测 | `isWindows`, `isSymlinkSupported` |
| 13-21 | 新增 `useSymlinks` 配置 | 默认为 `true` |
| 23-28 | 更新构造函数 | 接受 `options` 参数 |
| 30-43 | 新增 `createSymlinkOrCopy` | 支持软链接/复制双模式 |
| 45-97 | 新增 `symlinkOrCopyDirectory` | 替代原 `copyDirectory` |
| 128-131 | 更新 `copyDirectory` | 调用 `symlinkOrCopyDirectory` |
| 469-497 | 新增 `migrateContinuousLearningV2` | CL v2 专用迁移逻辑 |
| 499-740 | 新增 `generateWindowsHookScripts` | 生成 PowerShell 脚本 |
| 742-777 | 新增 `updateScriptEnvironmentVariables` | 更新环境变量 |
| 363-467 | 更新 `generateReport` | 增加平台/方法信息 |
| 779-857 | 更新 `migrate` | 调用新方法，显示平台信息 |
| 860-865 | 更新 main 执行 | 支持命令行参数 |

## 使用指南

### 1. 基本使用

```bash
# 迁移（默认使用软链接）
node scripts/migrate-to-codebuddy.js

# 使用复制模式
node scripts/migrate-to-codebuddy.js --no-symlinks
```

### 2. Windows 专用设置

#### 2.1 启用软链接

**方法 1: 开发者模式**
```
设置 → 更新和安全 → 开发者模式 → 开启
```

**方法 2: 以管理员身份运行**
```powershell
# 右键 PowerShell/命令提示符
# 选择 "以管理员身份运行"
node scripts/migrate-to-codebuddy.js
```

#### 2.2 配置 PowerShell 执行策略

```powershell
# 允许运行本地脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2.3 设置永久环境变量

```powershell
# 为当前用户设置
[Environment]::SetEnvironmentVariable("CODEBUDDY_PACKAGE_MANAGER", "pnpm", "User")

# 为所有用户设置（需要管理员）
[Environment]::SetEnvironmentVariable("CODEBUDDY_PACKAGE_MANAGER", "pnpm", "Machine")
```

### 3. Unix/Linux/macOS 使用

```bash
# 迁移（默认使用符号链接）
node scripts/migrate-to-codebuddy.js

# 使用复制模式
node scripts/migrate-to-codebuddy.js --no-symlinks

# 检查符号链接
ls -la .codebuddy/skills/continuous-learning-v2/
# 应显示: skills/... -> ../../../skills/...
```

## 兼容性矩阵

| 功能 | Windows | macOS | Linux |
|------|---------|-------|-------|
| 软链接 | ✅ Junction/符号链接 | ✅ 符号链接 | ✅ 符号链接 |
| PowerShell 脚本 | ✅ 自动生成 | ❌ 不适用 | ❌ 不适用 |
| Bash 脚本 | ✅（需 Git Bash/WSL） | ✅ | ✅ |
| 环境变量更新 | ✅ | ✅ | ✅ |
| CL v2 迁移 | ✅ | ✅ | ✅ |

## 注意事项

### Windows

1. **Junction vs Symbolic Link**:
   - 优先使用 Junction（目录）
   - 不需要管理员权限（开发者模式下）
   - 与符号链接功能类似

2. **路径分隔符**:
   - 使用 `path.join()` 自动处理
   - 避免硬编码反斜杠

3. **PowerShell 版本**:
   - 需要 PowerShell 5.1+
   - Windows 10/11 自带

4. **Python 依赖**:
   - 需要 Python 3.x
   - 用于 JSON 解析（与 Bash 版本一致）

### Unix/Linux/macOS

1. **符号链接**:
   - 默认支持
   - 无特殊权限要求
   - 原生支持

2. **Python 依赖**:
   - 需要 Python 3.x
   - 确保 `python3` 在 PATH 中

## 故障排除

### 软链接创建失败

**症状**: 警告 "Symlink failed, falling back to copy"

**解决方案**:
1. Windows: 启用开发者模式或以管理员运行
2. 检查文件系统是否支持符号链接
3. 使用 `--no-symlinks` 强制复制模式

### PowerShell 脚本执行被阻止

**症状**: "Execution Policy" 错误

**解决方案**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python 未找到

**症状**: "python: command not found"

**解决方案**:
1. 安装 Python 3.x
2. 确保 Python 在 PATH 中
3. Windows: 可能需要使用 `python` 而非 `python3`

### 环境变量未更新

**症状**: 仍使用旧的环境变量

**解决方案**:
1. 检查 `.codebuddy/settings.json`
2. 手动替换残留的 `CLAUDE_*` 变量
3. 重启 IDE/终端

## 下一步

1. **测试迁移脚本**:
   ```bash
   node scripts/migrate-to-codebuddy.js
   ```

2. **验证软链接**:
   - Windows: `dir /al .codebuddy\skills\continuous-learning-v2`
   - Unix: `ls -la .codebuddy/skills/continuous-learning-v2`

3. **检查生成的脚本**:
   - Windows: 验证 `.ps1` 文件存在
   - 测试 PowerShell 脚本执行

4. **阅读迁移报告**:
   ```bash
   cat .codebuddy/MIGRATION_REPORT.md
   ```

## 相关文档

- [CODEBUDDY_MIGRATION_GUIDE.md](./CODEBUDDY_MIGRATION_GUIDE.md)
- [OBSERVE_AGENT_ANALYSIS.md](./OBSERVE_AGENT_ANALYSIS.md)
- [MIGRATION_GUIDE_DEEP_ANALYSIS.md](./MIGRATION_GUIDE_DEEP_ANALYSIS.md)

## 贡献者

- Windows 支持和软链接实现
- PowerShell 脚本生成
- 环境变量自动适配
- 平台检测和降级机制
