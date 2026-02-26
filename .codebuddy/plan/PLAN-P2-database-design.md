# 实施计划: P2 - 数据库设计与缓存策略

## 概述
设计并实现 PostgreSQL 数据库模式 和 Redis 数据结构。重点在于游戏配置的高效读取、用户积分的事务安全以及抓取日志的存储。

## 任务类型
- [x] Backend / Database

## 实施步骤

### Phase 1: 核心业务表设计 (1 天)

#### Step 2.1: 创建用户与积分表
**文件**: `backend/src/main/resources/db/migration/V1__create_user_tables.sql`
- **操作**: Create
- **内容**:
  ```sql
  -- 用户表
  CREATE TABLE users (
      user_id BIGSERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      session_key VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 积分账户表
  CREATE TABLE user_points (
      user_id BIGINT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0,
      total_earned INTEGER NOT NULL DEFAULT 0,
      total_consumed INTEGER NOT NULL DEFAULT 0,
      version BIGINT DEFAULT 0, -- 乐观锁
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 积分流水表
  CREATE TABLE point_transactions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(user_id),
      transaction_type VARCHAR(20) NOT NULL, -- GAME_REWARD, EXCHANGE, ADJUST
      amount INTEGER NOT NULL,
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 索引
  CREATE INDEX idx_transactions_user_created ON point_transactions(user_id, created_at DESC);
  CREATE INDEX idx_users_session_key ON users(session_key) WHERE session_key IS NOT NULL;
  ```
- **交付**: 用户和积分相关表结构

#### Step 2.2: 创建游戏配置表
**文件**: `backend/src/main/resources/db/migration/V2__create_game_config.sql`
- **操作**: Create
- **内容**:
  ```sql
  -- 游戏配置表
  CREATE TABLE game_configs (
      id SERIAL PRIMARY KEY,
      config_key VARCHAR(64) UNIQUE NOT NULL,
      config_value JSONB NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 关卡配置表
  CREATE TABLE levels (
      id SERIAL PRIMARY KEY,
      level_number INTEGER UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      target_score INTEGER NOT NULL,
      time_limit_seconds INTEGER NOT NULL DEFAULT 60,
      hook_speed_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
      item_spawn_rules JSONB NOT NULL, -- 宝物生成规则
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 宝物配置表
  CREATE TABLE treasures (
      id SERIAL PRIMARY KEY,
      treasure_type VARCHAR(32) NOT NULL, -- GOLD, DIAMOND, STONE, BOMB, MYSTERY
      name VARCHAR(100) NOT NULL,
      base_weight INTEGER NOT NULL, -- 重量
      base_value INTEGER NOT NULL, -- 价值
      probability DECIMAL(5,4) NOT NULL, -- 出现概率 0-1
      rarity VARCHAR(16) NOT NULL, -- COMMON, RARE, EPIC, LEGENDARY
      sprite_key VARCHAR(64) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE
  );

  -- 等级规则表
  CREATE TABLE level_rules (
      id SERIAL PRIMARY KEY,
      level INTEGER UNIQUE NOT NULL,
      level_name VARCHAR(50) NOT NULL,
      min_score INTEGER NOT NULL,
      max_score INTEGER,
      reward_points INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 索引
  CREATE INDEX idx_levels_number ON levels(level_number);
  CREATE INDEX idx_treasures_type ON treasures(treasure_type);
  ```
- **交付**: 游戏配置相关表结构

#### Step 2.3: 创建奖品与订单表
**文件**: `backend/src/main/resources/db/migration/V3__create_prize_tables.sql`
- **操作**: Create
- **内容**:
  ```sql
  -- 奖品表
  CREATE TABLE prizes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      image_url VARCHAR(255),
      type VARCHAR(20) NOT NULL, -- PHYSICAL, VIRTUAL, COUPON
      cost_score INTEGER NOT NULL,
      total_stock INTEGER NOT NULL DEFAULT 0,
      remaining_stock INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 兑换订单表
  CREATE TABLE prize_exchanges (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(user_id),
      prize_id INTEGER NOT NULL REFERENCES prizes(id),
      cost_score INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
      idempotency_key VARCHAR(64) UNIQUE NOT NULL, -- 幂等性控制
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
  );

  -- 索引
  CREATE INDEX idx_exchanges_user_created ON prize_exchanges(user_id, created_at DESC);
  CREATE INDEX idx_prizes_stock ON prizes(remaining_stock) WHERE is_active = TRUE;
  ```
- **交付**: 奖品相关表结构

### Phase 2: 游戏数据与统计表 (0.5 天)

#### Step 2.4: 创建游戏记录与统计表
**文件**: `backend/src/main/resources/db/migration/V4__create_stats_tables.sql`
- **操作**: Create
- **内容**:
  ```sql
  -- 游戏会话表 (核心)
  CREATE TABLE game_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id BIGINT NOT NULL REFERENCES users(user_id),
      level_id INTEGER NOT NULL REFERENCES levels(id),

      -- 状态机
      status VARCHAR(16) NOT NULL DEFAULT 'PREPARING',
      -- PREPARING, PLAYING, COMPLETED, CHEAT_DETECTED, EXPIRED

      -- 配置快照
      config_snapshot JSONB NOT NULL,

      -- 时间控制
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      expires_at TIMESTAMP NOT NULL,

      -- 结果数据
      client_score INTEGER,
      server_score INTEGER,
      validation_result VARCHAR(16), -- PENDING, VERIFIED, REJECTED

      -- 乐观锁
      version BIGINT DEFAULT 0,

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      CONSTRAINT valid_time_order CHECK (completed_at IS NULL OR completed_at > started_at)
  );

  -- 钩子动作明细表 (可选, 调试用)
  CREATE TABLE hook_actions (
      id BIGSERIAL PRIMARY KEY,
      session_id UUID NOT NULL REFERENCES game_sessions(id),
      sequence INTEGER NOT NULL,
      action_time TIMESTAMP NOT NULL,
      action_type VARCHAR(16) NOT NULL, -- SWING, SHOOT, RETRACT, GRAB
      angle DECIMAL(8,5),
      pos_x DECIMAL(8,2),
      pos_y DECIMAL(8,2),
      treasure_id INTEGER REFERENCES treasures(id),
      UNIQUE(session_id, sequence)
  );

  -- 宝物抓取日志表
  CREATE TABLE treasure_catch_logs (
      id BIGSERIAL PRIMARY KEY,
      session_id UUID NOT NULL REFERENCES game_sessions(id),
      treasure_id INTEGER NOT NULL REFERENCES treasures(id),
      count INTEGER NOT NULL DEFAULT 1,
      catch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 排行榜快照表 (Redis 备份)
  CREATE TABLE leaderboard_snapshots (
      id SERIAL PRIMARY KEY,
      snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      snapshot_type VARCHAR(20) NOT NULL, -- DAILY, WEEKLY, ALL_TIME
      rankings JSONB NOT NULL
  );

  -- 索引
  CREATE INDEX idx_sessions_user_created ON game_sessions(user_id, created_at DESC);
  CREATE INDEX idx_sessions_expires ON game_sessions(expires_at) WHERE status IN ('PREPARING', 'PLAYING');
  CREATE INDEX idx_catch_logs_session ON treasure_catch_logs(session_id);
  ```
- **交付**: 游戏记录和统计表结构

### Phase 3: 缓存策略与实现 (0.5 天)

#### Step 2.5: 定义 Redis Key 命名空间
**文件**: `backend/src/main/java/com/goldminer/config/RedisConfig.java`
- **操作**: Create
- **内容**:
  - 配置 RedisTemplate
  - 定义 Key 常量:
    ```java
    public class RedisKeys {
        public static final String GAME_CONFIG_PREFIX = "game:config:";
        public static final String USER_SESSION_PREFIX = "session:";
        public static final String USER_SCORE_PREFIX = "score:";
        public static final String LEADERBOARD_PREFIX = "leaderboard:";
        public static final String PRIZE_STOCK_PREFIX = "prize:stock:";
    }
    ```
- **交付**: Redis 配置和 Key 管理类

#### Step 2.6: 实现配置缓存加载器
**文件**: `backend/src/main/java/com/goldminer/cache/ConfigCache.java`
- **操作**: Create
- **内容**:
  - 从 DB 加载配置并写入 Redis
  - 设置 TTL (1 小时)
  - 提供刷新缓存方法
  - 版本号机制 (支持热更新)
- **交付**: 配置缓存服务

## 关键文件

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `backend/src/main/resources/db/migration/V1__create_user_tables.sql` | Create | 用户和积分表 |
| `backend/src/main/resources/db/migration/V2__create_game_config.sql` | Create | 游戏配置表 |
| `backend/src/main/resources/db/migration/V3__create_prize_tables.sql` | Create | 奖品表 |
| `backend/src/main/resources/db/migration/V4__create_stats_tables.sql` | Create | 游戏记录和统计表 |
| `backend/src/main/java/com/goldminer/config/RedisConfig.java` | Create | Redis 配置 |
| `backend/src/main/java/com/goldminer/cache/ConfigCache.java` | Create | 配置缓存服务 |

## 测试策略

### Schema 验证测试
- [ ] 约束验证: 测试外键约束、唯一约束、检查约束
- [ ] 索引验证: 使用 `EXPLAIN ANALYZE` 验证索引生效

### 缓存测试
- [ ] 配置加载测试: 验证配置从 DB 加载到 Redis
- [ ] 缓存命中测试: 验证重复读取走缓存
- [ ] 缓存过期测试: 验证 TTL 机制

### 事务测试
- [ ] 并发扣减积分测试: 模拟多用户同时扣减积分, 验证余额正确性

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Schema 设计不合理, 后期修改困难 | 中 | 充分分析需求, 使用 JSONB 字段增加灵活性 |
| 缓存一致性问题 | 高 | 使用版本号机制, 配置变更时清除缓存 |
| 积分并发扣减错误 | 高 | 使用乐观锁 (version 字段) + Redis 原子操作 |
| 迁移脚本执行失败 | 中 | 使用 Flyway, 支持版本回滚 |

## 依赖
- P1: 基础设施与项目脚手架 (依赖数据库和缓存连接配置)

## 后续依赖
- P3: 后端核心服务与 API (依赖本计划的数据库和缓存)
- P5: 业务功能开发 (依赖本计划的积分和奖品表结构)

## 交付物
- 完整的数据库 Schema (4 个 Flyway 迁移脚本)
- Redis 配置和缓存服务
- 数据库和缓存集成测试用例
