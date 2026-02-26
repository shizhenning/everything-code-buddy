# 实施计划: P4 - 前端架构与游戏引擎集成

## 概述
构建前端的核心架构,实现 React UI 与 Phaser 游戏引擎的深度集成。完成钩子摆动、发射、抓取的物理表现,并建立与后端 API 的数据通道。

## 任务类型
- [x] Frontend / Fullstack

## 实施步骤

### Phase 1: 游戏引擎基础 (2 天)

#### Step 4.1: 封装 Phaser Game 组件
**文件**: `frontend/src/components/game/PhaserGame.tsx`
- **操作**: Create
- **内容**:
  - React 组件包裹 Phaser.Game 实例
  - 处理生命周期: 挂载时初始化, 卸载时销毁
  - 场景管理: BootScene, MenuScene, PlayScene, ResultScene
  - 配置: 响应式缩放 (FIT, CENTER_BOTH)
  - 错误处理: 游戏崩溃时显示错误 UI
- **交付**: 可复用的 Phaser 游戏容器组件

#### Step 4.2: 实现主场景与钩子物理
**文件**: `frontend/src/game/scenes/PlayScene.ts`
- **操作**: Create
- **内容**:
  - 初始化钩子实体 (Hook)
  - 实现摆动动画 (左右自动摆动)
  - 实现发射逻辑 (点击/空格键触发)
  - 实现钩子运动 (向下移动, 触碰检测后回收)
  - 物理参数: 速度、角度、长度限制
  - 碰撞检测: 使用 Phaser Arcade Physics
- **交付**: 核心游戏玩法场景

#### Step 4.3: 实现宝物生成与碰撞
**文件**: `frontend/src/game/managers/ItemManager.ts`
- **操作**: Create
- **内容**:
  - 根据关卡配置生成宝物实例
  - 宝物类型: Gold, Diamond, Stone, Bomb, Mystery
  - 宝物属性: 重量、价值、碰撞体大小
  - 碰撞检测: 钩子与宝物碰撞识别
  - 抓取动画: 钩子回收时携带宝物
- **交付**: 宝物管理系统

### Phase 2: 状态桥接与通信 (1.5 天)

#### Step 4.4: 创建 Event Bus 桥接层
**文件**: `frontend/src/core/bridge/GameEventBus.ts`
- **操作**: Create
- **内容**:
  - 定义事件类型 (TypeScript):
    - React → Phaser: GAME_START, GAME_PAUSE, GAME_RESUME
    - Phaser → React: SCORE_UPDATE, LEVEL_COMPLETE, GAME_OVER
  - 实现 EventEmitter
  - 类型安全的事件订阅/发布
- **交付**: React-Phaser 通信桥

#### Step 4.5: 集成全局状态管理
**文件**: `frontend/src/store/useGameStore.ts`
- **操作**: Create
- **内容**:
  - Zustand store 定义:
    - 当前用户信息
    - 当前关卡
    - 实时分数
    - 关卡进度 (unlockedLevels)
    - UI 状态 (弹窗、Loading)
  - 持久化: localStorage (用户信息)
  - Actions: setLevel, updateScore, unlockLevel
- **交付**: 游戏全局状态管理

### Phase 3: UI 页面与 API 对接 (1.5 天)

#### Step 4.6: 实现游戏主页面 UI
**文件**: `frontend/src/pages/GamePage.tsx`
- **操作**: Create
- **内容**:
  - 布局: 游戏画面 + HUD (分数板、倒计时)
  - 监听 EventBus: 实时更新分数、倒计时
  - 控制按钮: 暂停、退出
  - 加载状态: 资源加载进度条
  - 暂停模态框: 游戏暂停时显示
- **交付**: 游戏主页面 UI

#### Step 4.7: 实现首页和关卡选择页
**文件**: `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/LevelSelectPage.tsx`
- **操作**: Create
- **内容**:
  - **首页**:
    - 活动信息展示
    - 用户等级和积分显示
    - 快速开始按钮
  - **关卡选择页**:
    - 关卡卡片列表
    - 解锁状态标识
    - 星级评分显示
    - 点击选择关卡
- **交付**: 首页和关卡选择页面

#### Step 4.8: 对接 TanStack Query
**文件**: `frontend/src/api/gameApi.ts`, `frontend/src/api/userApi.ts`
- **操作**: Create
- **内容**:
  - 封装 Axios 实例 (拦截器、错误处理)
  - 定义 API 函数:
    - 获取关卡配置
    - 创建游戏会话
    - 提交游戏结果
    - 获取用户信息
  - TanStack Query hooks:
    - `useGameConfig()`
    - `useStartGame()`
    - `useSubmitGameResult()`
- **交付**: API 客户端封装

## 关键文件

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `frontend/src/components/game/PhaserGame.tsx` | Create | Phaser 游戏容器 |
| `frontend/src/game/scenes/PlayScene.ts` | Create | 主游戏场景 |
| `frontend/src/game/objects/Hook.ts` | Create | 钩子实体 |
| `frontend/src/game/managers/ItemManager.ts` | Create | 宝物管理系统 |
| `frontend/src/core/bridge/GameEventBus.ts` | Create | React-Phaser 事件桥 |
| `frontend/src/store/useGameStore.ts` | Create | 全局状态管理 |
| `frontend/src/pages/HomePage.tsx` | Create | 首页 |
| `frontend/src/pages/LevelSelectPage.tsx` | Create | 关卡选择页 |
| `frontend/src/pages/GamePage.tsx` | Create | 游戏主页面 |
| `frontend/src/api/gameApi.ts` | Create | 游戏 API |
| `frontend/src/api/userApi.ts` | Create | 用户 API |

## 测试策略

### 游戏功能测试
- [ ] 钩子摆动测试: 左右自动摆动
- [ ] 钩子发射测试: 点击/空格键发射
- [ ] 宝物抓取测试: 碰撞检测正确
- [ ] 得分计算测试: 抓取后得分正确
- [ ] 关卡切换测试: 下一关加载正确

### UI 交互测试
- [ ] 首页导航测试: 各按钮跳转正确
- [ ] 关卡选择测试: 关卡解锁状态正确
- [ ] 游戏暂停测试: 暂停/恢复功能正常
- [ ] 实时更新测试: 分数、倒计时实时同步

### 性能测试
- [ ] 帧率测试: 游戏 FPS ≥ 30fps (移动端)
- [ ] 内存测试: 无内存泄漏
- [ ] 加载时间测试: 游戏加载时间 < 3s

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Phaser 物理效果不理想 | 高 | 充分调试物理参数, 支持运行时调整 |
| React-Phaser 通信复杂 | 中 | 提前定义清晰的事件协议, 使用 TypeScript 类型 |
| 内存泄漏 | 高 | 严格在 React useEffect 中执行 Phaser destroy |
| 游戏性能不达标 | 高 | 使用对象池、纹理图集优化, 定期 Profile |
| API 对接困难 | 中 | 使用 Mock 数据先行开发, 后端 API 就位后对接 |

## 依赖
- P1: 基础设施与项目脚手架 (依赖前端项目结构)
- P3: 后端核心服务与 API (依赖 API 接口定义, 可并行开发使用 Mock)

## 后续依赖
- P5: 业务功能开发 (依赖本计划的游戏核心逻辑和 UI 基础)

## 交付物
- Phaser 游戏引擎集成
- 核心游戏玩法 (钩子摆动、发射、抓取)
- React-Phaser 通信桥接
- 首页、关卡选择、游戏主页面 UI
- API 客户端封装
- 游戏功能和性能测试用例
