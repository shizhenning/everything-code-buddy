# CodeBuddy 目录结构设计规范

> **版本**: 1.0
> **更新日期**: 2026-02-18

---

## 目录结构对比

### Claude Code vs CodeBuddy

```
Claude Code                    CodeBuddy
├── .claude/                   ├── .codebuddy/
│   ├── agents/              │   ├── agents/
│   ├── commands/             │   ├── commands/
│   ├── skills/              │   ├── skills/
│   ├── rules/               │   ├── rules/
│   ├── hooks/               │   ├── hooks/
│   ├── settings.json         │   ├── settings.json
│   └── session.jsonl         │   └── session.jsonl
└── .claude-plugin/          └── .codebuddy-plugin/
    ├── plugin.json           │   ├── plugin.json
    └── marketplace.json      │   └── marketplace.json
```

### 配置文件位置映射

| 平台 | 用户级 | 项目级 | 插件级 |
|-----|--------|--------|--------|
| Claude Code | `~/.claude/settings.json` | `.claude/settings.json` | `.claude-plugin/plugin.json` → `hooks/hooks.json` |
| CodeBuddy | `~/.codebuddy/settings.json` | `.codebuddy/settings.json` | `.codebuddy-plugin/plugin.json` → `.codebuddy-plugin/marketplace.json` |

---

## CodeBuddy 插件目录结构

### 标准插件结构

```
my-plugin/
├── .codebuddy-plugin/       # CodeBuddy 插件配置目录 (必需)
│   ├── plugin.json          # 插件元数据和组件路径 (必需)
│   └── marketplace.json     # 市场配置文件 (可选,用于插件市场)
├── agents/                  # 代理定义 (可选)
│   └── my-agent.md
├── commands/                # 斜杠命令 (可选)
│   └── my-command.md
├── skills/                  # 技能定义 (可选)
│   └── my-skill.md
├── rules/                   # 规则集 (可选)
│   └── my-rule.md
├── hooks/                   # 钩子脚本 (可选)
│   ├── hooks.json
│   └── my-hook.js
├── scripts/                 # 工具脚本 (可选)
│   └── migrate.js
└── assets/                  # 市场素材 (可选)
    ├── icon.png
    ├── banner.png
    └── screenshots/
```

### 插件配置文件说明

#### `.codebuddy-plugin/plugin.json`

插件的核心配置文件,定义插件元数据和组件路径:

```json
{
  "name": "ecc-universal",
  "displayName": "Everything Claude Code for CodeBuddy",
  "version": "2.0.0",
  "description": "118+ battle-tested components for CodeBuddy",
  "author": "Affaan Mustafa",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/affaan-m/everything-claude-code.git"
  },
  "homepage": "https://github.com/affaan-m/everything-claude-code",
  "bugs": {
    "url": "https://github.com/affaan-m/everything-claude-code/issues"
  },
  "keywords": [
    "codebuddy",
    "agents",
    "skills",
    "hooks",
    "rules",
    "commands",
    "tdd",
    "code-review",
    "security"
  ],
  "categories": [
    "development-tools",
    "productivity",
    "ai-assistant"
  ],
  "engines": {
    "codebuddy": ">=2.50.0"
  },
  "directories": {
    "agents": "./agents",
    "commands": "./commands",
    "skills": "./skills",
    "rules": "./rules",
    "hooks": "./hooks"
  }
}
```

#### `.codebuddy-plugin/marketplace.json`

市场配置文件,用于 `/plugin marketplace add` 命令:

```json
{
  "marketplaceName": "Everything Claude Code Market",
  "marketplaceVersion": "1.0.0",
  "marketplaceDescription": "Battle-tested CodeBuddy components evolved from Claude Code",
  "marketplaceAuthor": "Affaan Mustafa",
  "marketplaceHomepage": "https://github.com/affaan-m/everything-claude-code",
  "marketplaceRepository": {
    "type": "git",
    "url": "https://github.com/affaan-m/everything-claude-code.git"
  },
  "plugins": {
    "ecc-universal": {
      "name": "ecc-universal",
      "displayName": "Everything Claude Code for CodeBuddy",
      "version": "2.0.0",
      "description": "Complete collection of battle-tested CodeBuddy configs",
      "author": {
        "name": "Affaan Mustafa",
        "email": "affaan@example.com",
        "url": "https://x.com/affaanmustafa"
      },
      "homepage": "https://github.com/affaan-m/everything-claude-code",
      "repository": {
        "type": "git",
        "url": "https://github.com/affaan-m/everything-claude-code.git"
      },
      "license": "MIT",
      "codebuddy": {
        "minVersion": "2.50.0",
        "maxVersion": "3.0.0"
      },
      "keywords": [
        "codebuddy",
        "agents",
        "skills",
        "hooks",
        "rules",
        "commands"
      ],
      "category": "development-tools",
      "icon": "assets/icon.png",
      "banner": "assets/banner.png",
      "screenshots": [
        {
          "url": "assets/screenshots/agents.png",
          "caption": "14+ 专业 Agents",
          "order": 1
        }
      ]
    }
  }
}
```

---

## 从 Claude Code 迁移到 CodeBuddy

### 迁移步骤

#### 1. 目录结构调整

```bash
# 从 Claude Code 迁移
mv .claude-plugin/plugin.json .codebuddy-plugin/plugin.json
mv .claude-plugin/marketplace.json .codebuddy-plugin/marketplace.json

# 迁移配置目录
mv .claude .codebuddy
```

#### 2. 配置文件转换

**plugin.json 变更**:
- 添加 `engines.codebuddy` 字段
- 更新 `keywords` 添加 CodeBuddy 相关标签
- 检查 `directories` 路径引用

**marketplace.json 变更**:
- 添加 `codebuddy` 版本范围字段
- 更新描述和文档链接
- 确保素材路径正确

#### 3. 环境变量替换

| Claude Code | CodeBuddy |
|-------------|-----------|
| `${CLAUDE_PLUGIN_ROOT}` | `${CODEBUDDY_PLUGIN_ROOT}` |
| `${CLAUDE_PROJECT_DIR}` | `${CODEBUDDY_PROJECT_DIR}` |
| `${CLAUDE_HOME}` | `${CODEBUDDY_HOME}` |

#### 4. 路径硬编码修复

遵循路径规范:
- 使用 `~` 快捷方式
- 使用平台环境变量 (`%USERPROFILE%` / `$HOME`)
- 使用 CodeBuddy 环境变量
- 避免硬编码绝对路径

---

## 目录规范

### 路径命名规范

| 目录类型 | 环境变量 | Windows 示例 | Linux/Mac 示例 |
|---------|----------|-------------|---------------|
| **用户配置** | `${CODEBUDDY_HOME}` | `%USERPROFILE%\.codebuddy` | `$HOME/.codebuddy` |
| **项目配置** | `${CODEBUDDY_PROJECT_DIR}/.codebuddy` | `D:\project\.codebuddy` | `/project/.codebuddy` |
| **插件根** | `${CODEBUDDY_PLUGIN_ROOT}` | `C:\Users\user\.codebuddy` | `/home/user/.codebuddy` |
| **Hook 目录** | `${CODEBUDDY_PLUGIN_ROOT}/hooks` | `C:\Users\user\.codebuddy\hooks` | `/home/user/.codebuddy/hooks` |

### `~` 用户目录使用规范

| 规则 | 说明 | Windows | Linux/Mac |
|------|------|---------|-----------|
| ✅ **推荐方式** | 使用 `~` 快捷方式 | `~/.codebuddy` (PowerShell) | `~/.codebuddy` (Bash) |
| ✅ **环境变量** | 明确使用环境变量 | `%USERPROFILE%` | `$HOME` |
| ❌ **硬编码** | 不要硬编码路径 | `C:\Users\username` | `/home/username` |

---

## 市场发布规范

### 发布前检查清单

#### 配置文件

- [ ] `.codebuddy-plugin/plugin.json` 创建并配置
- [ ] `.codebuddy-plugin/marketplace.json` 创建并配置
- [ ] `package.json` 版本号同步 (2.0.0)
- [ ] CodeBuddy 最低版本号确认 (2.50+)
- [ ] 关键词和标签完善
- [ ] 作者信息和链接正确

#### 市场素材

- [ ] 插件图标 (128x128px, PNG)
- [ ] 横幅图 (1280x640px, PNG)
- [ ] 截图 (至少 3 张, 1280x720px)
- [ ] 预览视频 (可选, 1080p MP4, 30-60s)

### 市场安装方式

```bash
# 方式 1: 添加市场源
/plugin marketplace add https://github.com/affaan-m/everything-claude-code.git
/plugin install ecc-universal

# 方式 2: 直接安装
/plugin install https://github.com/affaan-m/everything-claude-code

# 方式 3: 手动配置
# 在 settings.json 中添加:
{
  "plugins": {
    "ecc-universal": {
      "path": "D:/projects/everything-claude-code"
    }
  }
}
```

---

## 最佳实践

### 1. 双平台兼容

如果需要同时支持 Claude Code 和 CodeBuddy:

```
everything-claude-code/
├── .claude-plugin/        # Claude Code 配置
│   ├── plugin.json
│   └── marketplace.json
├── .codebuddy-plugin/     # CodeBuddy 配置
│   ├── plugin.json
│   └── marketplace.json
├── agents/               # 共享组件
├── commands/
├── skills/
├── rules/
└── hooks/
```

### 2. 配置文件同步

使用符号链接或脚本同步配置:

```bash
# 创建符号链接 (Linux/Mac)
ln -s .claude-plugin/plugin.json .codebuddy-plugin/plugin.json
ln -s .claude-plugin/marketplace.json .codebuddy-plugin/marketplace.json
```

### 3. 版本管理

- 使用语义化版本 (SemVer)
- plugin.json 和 marketplace.json 版本号保持一致
- package.json 版本号同步更新

---

## 参考文档

- [CodeBuddy 迁移指南](./CODEBUDDY_MIGRATION_GUIDE.md)
- [CodeBuddy 兼容性矩阵](./CODEBUDDY_COMPATIBILITY_MATRIX.md)
- [路径硬编码扫描报告](./PATH_HARDCODE_SCAN_REPORT.md)
- [插件市场发布指南](./PLUGIN_MARKET_PUBLISHING_GUIDE.md)
