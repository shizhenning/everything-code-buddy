# 实施计划: P3 - 后端核心服务与 API

## 概述
实现游戏的核心后端逻辑,包括"服务端验证"引擎、用户会话管理、游戏流程 API。此阶段不涉及具体的积分扣减和奖品兑换 (在 P5 实现), 专注于游戏玩法的数据校验。

## 任务类型
- [x] Backend

## 实施步骤

### Phase 1: 游戏验证引擎 (2 天)

#### Step 3.1: 实现物理参数验证服务
**文件**: `backend/src/main/java/com/goldminer/service/verification/PhysicsVerificationService.java`
- **操作**: Create
- **内容**:
  - 基于时间戳和角度的钩子轨迹计算
  - 判断抓取结果是否合法:
    - 运动学合理性检查 (速度不超过配置最大值)
    - 碰撞检测回溯验证
    - 时间窗口验证
  - 容差机制 (+/- 100ms, +/- 2度)
- **交付**: 核心防作弊验证逻辑

#### Step 3.2: 实现游戏会话管理
**文件**: `backend/src/main/java/com/goldminer/service/GameSessionService.java`
- **操作**: Create
- **内容**:
  - 创建游戏会话 (生成 sessionId, 关联关卡配置)
  - 更新会话状态 (PREPARING → PLAYING → COMPLETED)
  - 会话超时处理 (5 分钟自动过期)
  - 配置快照机制 (游戏开始时冻结配置)
  - 乐观锁并发控制
- **交付**: 游戏会话生命周期管理

#### Step 3.3: 实现结果结算服务
**文件**: `backend/src/main/java/com/goldminer/service/GameSettlementService.java`
- **操作**: Create
- **内容**:
  - 根据验证结果计算得分
  - 记录游戏日志 (hook_actions, treasure_catch_logs)
  - 标记会话状态 (VERIFIED/REJECTED/CHEAT_DETECTED)
  - 暂不写入积分余额 (在 P5 阶段对接)
- **交付**: 游戏结果结算逻辑

### Phase 2: 核心 API 开发 (2 天)

#### Step 3.4: 创建游戏配置获取接口
**文件**: `backend/src/main/java/com/goldminer/controller/GameConfigController.java`
- **操作**: Create
- **内容**:
  - `GET /api/v1/config` - 获取全局游戏配置
  - `GET /api/v1/levels` - 获取关卡列表
  - `GET /api/v1/levels/{id}/config` - 获取关卡配置
  - `GET /api/v1/treasures` - 获取宝物配置
  - 响应 DTO 封装
- **交付**: 游戏配置 API

#### Step 3.5: 创建游戏流程控制接口
**文件**: `backend/src/main/java/com/goldminer/controller/GameController.java`
- **操作**: Create
- **内容**:
  - `POST /api/v1/game/sessions` - 创建游戏会话
  - `GET /api/v1/game/sessions/{id}` - 获取会话状态
  - `POST /api/v1/game/sessions/{id}/complete` - 提交游戏结果
  - `POST /api/v1/game/sessions/{id}/abort` - 中止游戏
  - 请求参数验证 (@Validated)
- **交付**: 游戏流程 API

#### Step 3.6: 创建用户状态接口
**文件**: `backend/src/main/java/com/goldminer/controller/UserController.java`
- **操作**: Create
- **内容**:
  - `GET /api/v1/users/me` - 获取当前用户信息
  - `GET /api/v1/users/me/sessions` - 获取用户游戏记录
  - `GET /api/v1/users/me/levels` - 获取用户关卡进度
- **交付**: 用户状态 API

### Phase 3: 集成测试 (1 天)

#### Step 3.7: 编写游戏流程集成测试
**文件**: `backend/src/test/java/integration/GameFlowIntegrationTest.java`
- **操作**: Create
- **内容**:
  - 使用 Testcontainers 启动 PostgreSQL 和 Redis
  - 模拟完整流程: 创建会话 → 提交游戏结果 → 验证
  - 测试物理验证: 超速作弊检测
  - 测试会话超时: 验证过期会话被拒绝
  - 测试并发: 多用户同时游戏
- **交付**: 游戏核心流程集成测试

#### Step 3.8: 编写单元测试
**文件**: `backend/src/test/java/service/PhysicsVerificationServiceTest.java`
- **操作**: Create
- **内容**:
  - 测试速度验证算法
  - 测试时间窗口验证
  - 测试碰撞检测逻辑
  - 测试边界条件 (0 速度, 最大速度)
- **交付**: 物理验证服务单元测试

## 关键文件

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `backend/src/main/java/com/goldminer/service/verification/PhysicsVerificationService.java` | Create | 物理验证服务 |
| `backend/src/main/java/com/goldminer/service/GameSessionService.java` | Create | 游戏会话管理 |
| `backend/src/main/java/com/goldminer/service/GameSettlementService.java` | Create | 游戏结果结算 |
| `backend/src/main/java/com/goldminer/controller/GameConfigController.java` | Create | 游戏配置 API |
| `backend/src/main/java/com/goldminer/controller/GameController.java` | Create | 游戏流程 API |
| `backend/src/main/java/com/goldminer/controller/UserController.java` | Create | 用户状态 API |
| `backend/src/test/java/integration/GameFlowIntegrationTest.java` | Create | 游戏流程集成测试 |
| `backend/src/test/java/service/PhysicsVerificationServiceTest.java` | Create | 物理验证单元测试 |

## 测试策略

### 单元测试
- [ ] 物理验证算法测试 (速度、时间、碰撞)
- [ ] 会话管理测试 (创建、更新、过期)
- [ ] 结果结算测试 (得分计算、状态标记)

### 集成测试
- [ ] 完整游戏流程: 创建会话 → 提交结果 → 验证
- [ ] 防作弊测试: 超速、时间篡改、重放攻击
- [ ] 并发测试: 多用户同时游戏
- [ ] 异常场景测试: 网络超时、数据库异常

### API 测试
- [ ] 使用 Postman/MVC 测试所有 API 端点
- [ ] 验证响应格式和状态码

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 物理验证过于严格导致误判 | 高 | 设置合理的容差窗口 (+/- 100ms, +/- 2度) |
| 前后端物理计算不一致 | 高 | P2 阶段明确定义物理参数, P6 阶段编写确定性测试 |
| 会话状态并发冲突 | 中 | 使用乐观锁 (version 字段) + 重试机制 |
| API 接口设计不合理 | 低 | 使用 OpenAPI 规范, 支持接口版本管理 |

## 依赖
- P1: 基础设施与项目脚手架 (依赖 Spring Boot 项目和配置)
- P2: 数据库设计与缓存策略 (依赖数据库表结构和缓存服务)

## 后续依赖
- P4: 前端架构与游戏引擎集成 (依赖本计划的 API 接口)
- P5: 业务功能开发 (依赖本计划的游戏核心逻辑)

## 交付物
- 游戏物理验证服务
- 游戏会话管理和结算服务
- 完整的 REST API (配置、游戏流程、用户)
- 集成测试和单元测试用例
- API 文档 (Swagger/OpenAPI)
