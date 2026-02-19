# Observe Hook 调试指南

## 问题：observe.js 无法确认是否触发

### 解决方案

已增强 `observe.js` 的日志功能，现在可以通过多种方式排查触发情况。

---

## 1. 启用调试模式

### 方法一：环境变量（推荐）

设置环境变量启用详细日志：

```bash
# Windows PowerShell
$env:CODEBUDDY_DEBUG_HOOKS = "1"
$env:DEBUG_OBSERVE = "1"

# Windows CMD
set CODEBUDDY_DEBUG_HOOKS=1
set DEBUG_OBSERVE=1

# Linux/macOS
export CODEBUDDY_DEBUG_HOOKS=1
export DEBUG_OBSERVE=1
```

### 方法二：在 hooks.json 中添加环境变量

在调用 observe.js 的 hook 中临时添加环境变量：

```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.js pre ${tool_name}\"",
      "env": {
        "CODEBUDDY_DEBUG_HOOKS": "1",
        "DEBUG_OBSERVE": "1"
      }
    }
  ]
}
```

---

## 2. 运行测试脚本

使用提供的测试脚本验证 observe.js 是否正常工作：

```bash
node scripts/test-observe-hook.js
```

测试脚本会模拟以下场景：
- PreToolUse 事件
- PostToolUse 事件
- SessionStart 事件
- SessionEnd 事件

### 预期输出

```
=== Testing observe.js Hook ===

--- Testing PreToolUse ---
Command: node .../observe.js pre ReadFile
Event data: {"tool_name":"ReadFile","tool_input":{"filePath":"/test/file.txt"}}

[observe:INFO] 2026-02-19T10:00:00.000Z - ====== observe.js starting ======
[observe:INFO] 2026-02-19T10:00:00.000Z - Arguments: pre ReadFile
[observe:INFO] 2026-02-19T10:00:00.000Z - Action: pre, Tool: ReadFile
[observe:INFO] 2026-02-19T10:00:00.000Z - Recording pre-observation for tool: ReadFile
[observe:INFO] 2026-02-19T10:00:00.000Z - ✓ Recorded tool_pre observation: xxxxx-xxxx-xxxx
[observe:INFO] 2026-02-19T10:00:00.000Z - ====== observe.js completed =====
[Exit code: 0]
```

---

## 3. 检查日志输出

### 3.1 实时日志（stderr）

观察 Claude Code 的输出，查找以下标记：

```
[observe:INFO] ... - observe.js starting
[observe:INFO] ... - Action: pre/post/session-start/session-end
[observe:INFO] ... - ✓ Recorded observation: xxxxx
[observe:DEBUG] ... - Observation file: /path/to/observations.jsonl
```

### 3.2 调试日志文件

当启用 `CODEBUDDY_DEBUG_HOOKS` 时，日志会写入：

```
~/.codebuddy/observe-debug.log
```

查看日志：

```bash
# Windows
type %USERPROFILE%\.codebuddy\observe-debug.log

# Linux/macOS
cat ~/.codebuddy/observe-debug.log

# 查看最后 50 行
tail -50 ~/.codebuddy/observe-debug.log
```

### 3.3 观察数据文件

检查记录的数据是否写入：

```bash
# Windows
type %USERPROFILE%\.codebuddy\homunculus\observations.jsonl

# Linux/macOS
cat ~/.codebuddy/homunculus/observations.jsonl

# 统计记录数量
# Windows
powershell -Command "(Get-Content $env:USERPROFILE\.codebuddy\homunculus\observations.jsonl).Count"

# Linux/macOS
wc -l ~/.codebuddy/homunculus/observations.jsonl
```

---

## 4. 检查 Hook 配置

### 验证 hooks.json 配置

```bash
# 检查 hooks.json 中的 observe.js 路径
cat hooks/hooks.json | grep observe.js
```

应该看到：

```json
{
  "matcher": "*",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CODEBUDDY_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.js pre ${tool_name}\""
    }
  ]
}
```

### 验证环境变量

检查 `CODEBUDDY_PLUGIN_ROOT` 是否正确设置：

```bash
# 运行简单测试
node -e "console.log(process.env.CODEBUDDY_PLUGIN_ROOT)"
```

应该输出 ECC 插件的根目录路径。

---

## 5. 手动测试 Hook 触发

### 测试 PreToolUse Hook

在 Claude Code 中执行任意工具调用，例如：

```
Read the file package.json
```

预期输出（stderr）：

```
[observe:INFO] ... - Action: pre, Tool: ReadFile
[observe:INFO] ... - ✓ Recorded tool_pre observation
```

### 测试 PostToolUse Hook

同上，工具执行完成后应该看到：

```
[observe:INFO] ... - Action: post, Tool: ReadFile
[observe:INFO] ... - ✓ Recorded tool_post observation
```

### 测试 SessionStart Hook

启动新的 Claude Code 会话：

```
[observe:INFO] ... - Recording session-start observation
[observe:INFO] ... - Session-start observation recorded
```

### 测试 SessionEnd Hook

结束 Claude Code 会话：

```
[observe:INFO] ... - Recording session-end observation
[observe:INFO] ... - Session-end observation recorded
```

---

## 6. 故障排查

### 问题 1：看不到任何日志

**可能原因**：
- Hook 未被触发
- stderr 输出被屏蔽

**解决方案**：
1. 运行测试脚本：`node scripts/test-observe-hook.js`
2. 检查日志文件：`cat ~/.codebuddy/observe-debug.log`
3. 验证 hooks.json 语法

### 问题 2：日志有错误 "Observations file not found"

**可能原因**：
- 目录不存在
- 权限问题

**解决方案**：
```bash
# 创建目录
mkdir -p ~/.codebuddy/homunculus

# Linux/macOS
chmod 755 ~/.codebuddy
chmod 755 ~/.codebuddy/homunculus

# Windows: 以管理员身份运行 Claude Code
```

### 问题 3：日志显示 "Failed to parse stdin as JSON"

**可能原因**：
- stdin 数据格式错误（正常现象）

**解决方案**：
这是警告信息，不影响功能。某些 hook 调用可能不提供 stdin 数据。

### 问题 4：日志显示 "stdinData length: 0 bytes"

**可能原因**：
- Hook 未传递 stdin 数据（正常现象）

**解决方案**：
不是错误，某些 hook 事件可能没有 stdin 数据。

### 问题 5：CODEBUDDY_PLUGIN_ROOT 未定义

**可能原因**：
- 环境变量未设置

**解决方案**：
检查 Claude Code 配置文件：

```bash
cat ~/.claude/settings.json | grep pluginRoot
```

如果没有 `pluginRoot`，添加：

```json
{
  "pluginRoot": "/path/to/everything-code-buddy"
}
```

---

## 7. 增强的日志内容

### 日志级别

- **INFO**: 正常操作信息
- **DEBUG**: 调试信息（仅在调试模式显示）
- **WARN**: 警告信息
- **ERROR**: 错误信息

### 日志输出位置

| 类型 | 输出位置 | 说明 |
|-----|---------|------|
| stderr | Claude Code 输出 | 实时日志 |
| log file | `~/.codebuddy/observe-debug.log` | 调试日志（仅调试模式） |
| observations | `~/.codebuddy/homunculus/observations.jsonl` | 观察数据 |

### 关键日志标记

观察这些标记确认 Hook 触发：

1. `===== observe.js starting =====` - Hook 开始执行
2. `Action: <type>` - 触发的事件类型
3. `✓ Recorded observation` - 数据记录成功
4. `===== observe.js completed =====` - Hook 执行完成

---

## 8. 监控实时日志

### Linux/macOS

```bash
# 实时查看调试日志
tail -f ~/.codebuddy/observe-debug.log

# 实时查看观察数据
tail -f ~/.codebuddy/homunculus/observations.jsonl | jq .
```

### Windows PowerShell

```powershell
# 实时查看调试日志
Get-Content $env:USERPROFILE\.codebuddy\observe-debug.log -Wait -Tail 10

# 实时查看观察数据（需要 jq）
Get-Content $env:USERPROFILE\.codebuddy\homunculus\observations.jsonl -Wait | ConvertFrom-Json | Format-Table
```

---

## 9. 总结

### 快速排查步骤

1. **启用调试模式**：
   ```bash
   export CODEBUDDY_DEBUG_HOOKS=1
   ```

2. **运行测试脚本**：
   ```bash
   node scripts/test-observe-hook.js
   ```

3. **检查日志输出**：
   - 查看 Claude Code stderr 输出
   - 查看 `~/.codebuddy/observe-debug.log`

4. **检查观察数据**：
   - 查看 `~/.codebuddy/homunculus/observations.jsonl`

5. **手动测试 Hook**：
   - 在 Claude Code 中执行任意工具
   - 观察日志输出

### 常见问题对照表

| 症状 | 原因 | 解决方案 |
|-------|------|---------|
| 没有任何日志 | Hook 未触发 | 检查 hooks.json 配置 |
| 日志有错误 | 文件权限/路径 | 创建目录，检查权限 |
| "Failed to parse stdin" | 正常现象 | 忽略警告 |
| "stdinData length: 0" | 正常现象 | 忽略警告 |
| PLUGIN_ROOT 未定义 | 配置缺失 | 添加 pluginRoot 到 settings.json |

---

## 10. 参考资源

- [OpenSpec 集成方案](./ECC-OpenSpec集成方案.md)
- [ECC 文档](../CODEBUDDY.md)
- [Continuous Learning v2](../skills/continuous-learning-v2/SKILL.md)

---

*最后更新: 2026-02-19*
