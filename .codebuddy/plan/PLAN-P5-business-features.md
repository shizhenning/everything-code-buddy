# 实施计划: P5 - 业务功能开发 (积分+奖品+配置)

## 概述
在核心游戏流程打通后,开发积分系统、奖品兑换功能以及后台管理接口。这是游戏"运营化"的关键阶段。

## 任务类型
- [x] Fullstack (Backend + Frontend)

## 实施步骤

### Phase 1: 积分系统 (1.5 天)

#### Step 5.1: 实现积分变更服务
**文件**: `backend/src/main/java/com/goldminer/service/PointService.java`
- **操作**: Create
- **内容**:
  - 增加积分 (带事务):
    - 检查用户存在
    - 更新积分余额
    - 记录流水
    - 更新 Redis 缓存
  - 扣减积分 (带事务):
    - 检查余额充足
    - 扣减积分
    - 记录流水
    - 更新 Redis 缓存
  - 使用乐观锁 (version 字段) + 重试机制
  - 幂等性控制 (idempotency_key)
- **交付**: 积分变更核心服务

#### Step 5.2: 集成积分到游戏结算
**文件**: `backend/src/main/java/com/goldminer/service/GameSettlementService.java` (Modify)
- **操作**: Modify
- **内容**:
  - 修改结算逻辑, 游戏验证通过后:
    - 调用 PointService 增加积分
    - 记录积分来源 (GAME_REWARD)
  - 处理关卡进度: 首次通关解锁下一关
  - 更新用户总得分
- **交付**: 完整的游戏结算流程

#### Step 5.3: 创建积分系统 API
**文件**: `backend/src/main/java/com/goldminer/controller/PointsController.java`
- **操作**: Create
- **内容**:
  - `GET /api/v1/points/balance` - 获取积分余额
  - `GET /api/v1/points/history` - 获取积分明细 (分页)
  - `GET /api/v1/points/leaderboard` - 获取积分排行榜
  - `GET /api/v1/points/leaderboard/me` - 获取我的排名
- **交付**: 积分系统 API

#### Step 5.4: 前端积分页面与排行榜
**文件**: `frontend/src/pages/PointsPage.tsx`, `frontend/src/pages/LeaderboardPage.tsx`
- **操作**: Create
- **内容**:
  - **积分页面**:
    - 显示积分余额
    - 积分明细列表 (时间、类型、金额)
    - 积分趋势图表 (可选)
  - **排行榜页面**:
    - 排行榜列表 (排名、用户、积分)
    - 我的排名高亮显示
    - 排行榜类型切换 (周榜/总榜)
- **交付**: 积分和排行榜页面 UI

### Phase 2: 奖品兑换 (1.5 天)

#### Step 5.5: 实现奖品兑换逻辑
**文件**: `backend/src/main/java/com/goldminer/service/PrizeService.java`
- **操作**: Create
- **内容**:
  - 奖品列表查询:
    - 过滤有效奖品 (is_active=true, 库存>0)
    - 按类型分组
  - 奖品兑换 (带事务):
    - 检查奖品库存 (使用 SELECT FOR UPDATE)
    - 检查用户积分充足
    - 扣减库存
    - 扣减积分 (调用 PointService)
    - 生成兑换订单
    - 更新 Redis 缓存
  - 幂等性控制 (idempotency_key)
  - 使用数据库悲观锁防止超卖
- **交付**: 奖品兑换核心服务

#### Step 5.6: 创建奖品系统 API
**文件**: `backend/src/main/java/com/goldminer/controller/PrizeController.java`
- **操作**: Create
- **内容**:
  - `GET /api/v1/prizes` - 获取奖品列表 (支持类型筛选)
  - `GET /api/v1/prizes/{id}` - 获取奖品详情
  - `POST /api/v1/prizes/{id}/exchange` - 兑换奖品
  - `GET /api/v1/prizes/exchanges` - 获取兑换记录 (我的)
- **交付**: 奖品系统 API

#### Step 5.7: 前端奖品兑换页
**文件**: `frontend/src/pages/PrizePage.tsx`, `frontend/src/pages/ExchangeHistoryPage.tsx`
- **操作**: Create
- **内容**:
  - **奖品兑换页**:
    - 奖品列表展示 (图片、名称、所需积分、库存)
    - 类型筛选标签
    - 库存紧张标识
    - 兑换确认弹窗
  - **兑换历史页**:
    - 兑换记录列表
    - 订单状态显示 (待发货、已发货、已完成)
    - 查看详情按钮
- **交付**: 奖品兑换页面 UI

### Phase 3: 配置管理 (1 天)

#### Step 5.8: 后台配置接口
**文件**: `backend/src/main/java/com/goldminer/controller/AdminController.java`
- **操作**: Create
- **内容**:
  - `GET /api/v1/admin/game-config` - 获取游戏配置
  - `PUT /api/v1/admin/game-config` - 更新游戏配置
  - `GET /api/v1/admin/levels` - 获取所有关卡配置
  - `PUT /api/v1/admin/levels/{id}` - 更新关卡配置
  - `GET /api/v1/admin/treasures` - 获取所有宝物配置
  - `PUT /api/v1/admin/treasures/{id}` - 更新宝物配置
  - `GET /api/v1/admin/prizes` - 获取所有奖品配置
  - `PUT /api/v1/admin/prizes/{id}` - 更新奖品配置
  - `GET /api/v1/admin/statistics/overview` - 活动数据总览
  - `GET /api/v1/admin/statistics/treasures` - 宝物抓取统计
- **交付**: 后台管理 API

#### Step 5.9: 前端游戏结果页
**文件**: `frontend/src/pages/ResultPage.tsx`
- **操作**: Create
- **内容**:
  - 游戏结果展示:
    - 通关/未通关状态
    - 当前得分、目标分数
    - 等级提升动画
    - 获得积分展示
    - 宝物抓取统计
  - 操作按钮:
    - 返回首页
    - 再玩一次
- **交付**: 游戏结果页面 UI

## 关键文件

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `backend/src/main/java/com/goldminer/service/PointService.java` | Create | 积分变更服务 |
| `backend/src/main/java/com/goldminer/service/GameSettlementService.java` | Modify | 游戏结算服务 (集成积分) |
| `backend/src/main/java/com/goldminer/controller/PointsController.java` | Create | 积分系统 API |
| `backend/src/main/java/com/goldminer/service/PrizeService.java` | Create | 奖品兑换服务 |
| `backend/src/main/java/com/goldminer/controller/PrizeController.java` | Create | 奖品系统 API |
| `backend/src/main/java/com/goldminer/controller/AdminController.java` | Create | 后台管理 API |
| `frontend/src/pages/PointsPage.tsx` | Create | 积分页面 |
| `frontend/src/pages/LeaderboardPage.tsx` | Create | 排行榜页面 |
| `frontend/src/pages/PrizePage.tsx` | Create | 奖品兑换页 |
| `frontend/src/pages/ExchangeHistoryPage.tsx` | Create | 兑换历史页 |
| `frontend/src/pages/ResultPage.tsx` | Create | 游戏结果页 |
| `frontend/src/api/pointsApi.ts` | Create | 积分 API |
| `frontend/src/api/prizeApi.ts` | Create | 奖品 API |

## 测试策略

### 积分系统测试
- [ ] 积分增加测试: 正确增加余额、记录流水
- [ ] 积分扣减测试: 余额充足时扣减、不足时拒绝
- [ ] 并发测试: 多用户同时扣减积分, 余额正确
- [ ] 幂等性测试: 相同请求只扣减一次

### 奖品系统测试
- [ ] 奖品列表测试: 过滤有效奖品
- [ ] 奖品兑换测试: 库存充足时成功、不足时失败
- [ ] 超卖测试: 多用户同时兑换, 只有 1 个成功
- [ ] 积分不足测试: 积分不足时兑换失败
- [ ] 幂等性测试: 相同请求只兑换一次

### 集成测试
- [ ] 完整流程测试: 游戏 → 积分 → 兑换 → 查看历史
- [ ] 排行榜测试: 积分变化后排名更新
- [ ] 管理后台测试: 配置修改后游戏生效

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 积分并发扣减错误 | 高 | 使用乐观锁 (version 字段) + Redis 原子操作 |
| 奖品超卖 | 高 | 使用数据库悲观锁 (SELECT FOR UPDATE) + Redis 原子操作 |
| 积分系统性能瓶颈 | 中 | 使用 Redis 缓存积分余额, 异步持久化 |
| 配置变更导致游戏异常 | 低 | 使用配置版本号机制, 会话级快照 |
| 管理后台权限控制不足 | 中 | 实现角色权限控制 (RBAC) |

## 依赖
- P2: 数据库设计与缓存策略 (依赖积分和奖品表结构)
- P3: 后端核心服务与 API (依赖游戏结算逻辑)
- P4: 前端架构与游戏引擎集成 (依赖前端 UI 基础)

## 后续依赖
- P6: 防作弊体系、测试与部署优化 (依赖本计划的完整业务流程)

## 交付物
- 积分系统服务 (增加、扣减、明细、排行榜)
- 奖品兑换系统 (配置、兑换、订单)
- 后台管理 API (配置管理、数据统计)
- 积分页面、排行榜页面
- 奖品兑换页面、兑换历史页面
- 游戏结果页面
- 完整的业务功能测试用例
