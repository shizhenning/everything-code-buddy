# 迁移快速参考

## Windows

### 快速迁移

```powershell
# 1. 启用开发者模式或以管理员身份运行

# 2. 允许 PowerShell 脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. 迁移（软链接模式）
node scripts/migrate-to-codebuddy.js

# 4. 测试
codebuddy /plan "test"
```

### 常见问题

| 问题 | 解决方案 |
|------|---------|
| 软链接失败 | 启用开发者模式或使用 `--no-symlinks` |
| PowerShell 被阻止 | 设置执行策略为 RemoteSigned |
| Python 未找到 | 安装 Python 3.x 并添加到 PATH |
| 环境变量不生效 | 重启 IDE 和 PowerShell |

### 验证

```powershell
# 检查软链接
dir .codebuddy\skills\continuous-learning-v2\hooks\observe.ps1

# 查看日志
type .codebuddy\MIGRATION_REPORT.md
type %USERPROFILE%\.claude\homunculus\observations.jsonl
```

## macOS/Linux

### 快速迁移

```bash
# 迁移（符号链接模式）
node scripts/migrate-to-codebuddy.js

# 查看报告
cat .codebuddy/MIGRATION_REPORT.md

# 测试
codebuddy /plan "test"
```

### 验证

```bash
# 检查符号链接
ls -la .codebuddy/skills/continuous-learning-v2/

# 查看日志
cat .codebuddy/MIGRATION_REPORT.md
cat ~/.claude/homunculus/observations.jsonl
```

## 命令行选项

```bash
# 默认：使用软链接
node scripts/migrate-to-codebuddy.js

# 强制使用复制
node scripts/migrate-to-codebuddy.js --no-symlinks
```

## 环境变量

| 用途 | Windows | macOS/Linux |
|------|---------|-------------|
| 包管理器 | `$env:CODEBUDDY_PM = "pnpm"` | `export CODEBUDDY_PM=pnpm` |
| 临时 | Set-ExecutionPolicy... | `export ...` |
| 永久 | `[Environment]::SetEnvironmentVariable(...)` | 添加到 `~/.bashrc` |

## 文件结构

```
.codebuddy/
├── agents/              # 14 agents (含 observer)
├── commands/            # 31 commands
├── skills/              # 38 skills (含 continuous-learning-v2)
├── hooks/               # Hook 脚本
├── rules/               # Rules (需手动安装)
├── mcp-configs/        # MCP 配置
├── scripts/             # 迁移脚本
├── settings.json        # Hooks 和权限配置
└── MIGRATION_REPORT.md  # 迁移报告
```

## 关键特性

| 特性 | 说明 |
|------|------|
| 🔗 软链接 | 便于插件发布，自动更新，节省空间 |
| 📦 CL v2 | Continuous Learning v2 完整支持 |
| 🔧 Windows 脚本 | 自动生成 PowerShell Hook 脚本 |
| 🔄 自动适配 | 环境变量、路径自动转换 |
| 📊 详细报告 | 生成完整的迁移报告 |

## 相关文档

- 📖 [Windows Migration Guide](./WINDOWS_MIGRATION_GUIDE.md)
- 📖 [Windows Support & Symlink Migration](./WINDOWS_SYMLINK_MIGRATION.md)
- 📖 [CodeBuddy Migration Guide](./CODEBUDDY_MIGRATION_GUIDE.md)
- 📖 [Compatibility Matrix](./CODEBUDDY_COMPATIBILITY_MATRIX.md)
- 📖 [Observer Agent Analysis](./OBSERVE_AGENT_ANALYSIS.md)
