# 实施计划: P6 - 防作弊体系、测试与部署优化

## 概述
完善系统的安全性与健壮性。实施多层防作弊检查,补充 E2E 测试,并优化 Docker 部署配置以应对生产环境。

## 任务类型
- [x] Fullstack / QA / DevOps

## 实施步骤

### Phase 1: 防作弊增强 (1.5 天)

#### Step 6.1: 实现请求频率限制
**文件**: `backend/src/main/java/com/goldminer/config/RateLimitConfig.java`
- **操作**: Create
- **内容**:
  - 使用 Bucket4j 或 Redis 实现接口限流:
    - 游戏开始: 每分钟 10 次
    - 游戏提交: 每分钟 5 次
    - 奖品兑换: 每分钟 10 次
  - IP 级别限流 + 用户级别限流
  - 超限响应: 429 Too Many Requests
- **交付**: 接口限流配置

#### Step 6.2: 实现会话与签名校验
**文件**: `backend/src/main/java/com/goldminer/security/RequestSignatureFilter.java`
- **操作**: Create
- **内容**:
  - 验证游戏令牌 (GameToken):
    - JWT 风格签名
    - 绑定游戏会话 ID
    - 防止重放攻击 (timestamp 校验)
  - 验证请求签名:
    - 关键接口 (游戏结算、奖品兑换) 需要签名
    - 使用 HMAC-SHA256 签名算法
    - 防止中间人攻击
  - 时间戳校验: ±5 秒窗口
- **交付**: 请求签名验证机制

#### Step 6.3: 实现行为分析审计
**文件**: `backend/src/main/java/com/goldminer/audit/AuditLogger.java`
- **操作**: Create
- **内容**:
  - 异步记录异常行为:
    - 超速行为 (velocity exceeded)
    - 异常得分分布 (statistical anomaly)
    - 操作频率过高 (rate limit triggered)
    - 连续高分 (multiple high scores)
  - 记录详细信息: 用户 ID、IP、时间、行为类型、参数
  - 审计日志存储: 独立表 `audit_logs` 或 Elasticsearch
  - 风险等级标记: LOW, MEDIUM, HIGH
  - 高风险行为自动封禁 (可选)
- **交付**: 行为审计系统

### Phase 2: E2E 测试 (1 天)

#### Step 6.4: 编写 Playwright 测试配置
**文件**: `frontend/playwright.config.ts`, `frontend/playwright.config.local.ts`
- **操作**: Create
- **内容**:
  - 测试目录配置 (`tests/e2e`)
  - 基础 URL: `http://localhost:3000`
  - 浏览器配置: Chromium, Firefox
  - 截图配置: 仅失败时截图
  - 重试策略: 失败后重试 2 次
- **交付**: Playwright 测试配置

#### Step 6.5: 编写核心流程 E2E 测试
**文件**: `frontend/tests/e2e/game-flow.spec.ts`
- **操作**: Create
- **内容**:
  ```typescript
  import { test, expect } from '@playwright/test';

  test.describe('黄金矿工游戏 E2E 测试', () => {
    test('完整的游戏流程', async ({ page }) => {
      // 1. 访问首页
      await page.goto('http://localhost:3000');
      await expect(page).toHaveTitle(/黄金矿工/);

      // 2. 选择关卡
      await page.click('text=第1关');
      await expect(page.locator('.game-container')).toBeVisible();

      // 3. 开始游戏
      await page.click('button:has-text("开始游戏")');
      await expect(page.locator('.score-board')).toBeVisible();

      // 4. 模拟游戏操作 (抓取物品)
      await page.click('.game-area', { position: { x: 300, y: 200 } });
      await page.waitForTimeout(2000);

      // 5. 游戏结束 (模拟时间到)
      await expect(page.locator('.result-modal')).toBeVisible();
      await expect(page.locator('.final-score')).toContainText(/\d+/);
    });

    test('积分和兑换流程', async ({ page }) => {
      // 1. 查看积分
      await page.goto('http://localhost:3000/points');
      await expect(page.locator('.balance')).toBeVisible();

      // 2. 查看排行榜
      await page.click('text=排行榜');
      await expect(page.locator('.leaderboard')).toBeVisible();

      // 3. 浏览奖品
      await page.goto('http://localhost:3000/prizes');
      await expect(page.locator('.prize-list')).toBeVisible();

      // 4. 兑换奖品 (需要积分)
      await page.click('.prize-card:first-child');
      await page.click('text=兑换');
      // 验证提示或跳转
    });
  });
  ```
- **交付**: 核心用户流程 E2E 测试

#### Step 6.6: 运行 E2E 测试脚本
**文件**: `frontend/package.json` (Modify)
- **操作**: Modify
- **内容**:
  - 添加测试脚本:
    ```json
    "scripts": {
      "test:e2e": "playwright test",
      "test:e2e:ui": "playwright test --ui",
      "test:e2e:debug": "playwright test --debug"
    }
    ```
- **交付**: E2E 测试运行命令

### Phase 3: 性能测试 (0.5 天)

#### Step 6.7: 编写 k6 性能测试
**文件**: `k6/game-test.js` (Modify)
- **操作**: Modify
- **内容**:
  ```javascript
  import http from 'k6/http';
  import { check, sleep } from 'k6';

  export let options = {
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<200'],
    },
  };

  export default function () {
    // 测试游戏开始接口
    let res1 = http.post('http://localhost:8080/api/v1/game/sessions', JSON.stringify({
      levelId: 1,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res1, { 'game start status 200': (r) => r.status == 200 });

    // 测试获取配置接口
    let res2 = http.get('http://localhost:8080/api/v1/config');
    check(res2, { 'config status 200': (r) => r.status == 200 });

    sleep(1);
  }
  ```
- **交付**: 性能测试脚本

### Phase 4: 部署优化 (0.5 天)

#### Step 6.8: 优化 Docker 镜像
**文件**: `backend/Dockerfile`, `frontend/Dockerfile`
- **操作**: Modify
- **内容**:
  - 后端 Dockerfile:
    - 多阶段构建: Maven 构建 → JRE 运行
    - 最小化镜像: 使用 alpine 基础镜像
    - 配置健康检查: `/actuator/health`
    - JVM 参数优化: `-XX:+UseG1GC -XX:MaxRAMPercentage=75.0`
  - 前端 Dockerfile:
    - 多阶段构建: Node 构建 → Nginx 静态资源服务
    - 最小化镜像: 使用 nginx:alpine
    - 配置 gzip 压缩
- **交付**: 优化的 Docker 镜像配置

#### Step 6.9: 配置生产环境 Compose
**文件**: `docker-compose.prod.yml`
- **操作**: Create
- **内容**:
  - 配置资源限制:
    - CPU 限制: `cpus: '2'`
    - 内存限制: `memory: 2G`
  - 配置日志驱动:
    - 使用 JSON 日志格式
    - 日志轮转配置
  - 配置持久化卷:
    - PostgreSQL 数据卷
    - Redis 数据卷
  - 配置健康检查:
    - 所有服务配置 healthcheck
  - 配置重启策略:
    - `restart: unless-stopped`
- **交付**: 生产级 Docker Compose 配置

#### Step 6.10: 创建部署脚本
**文件**: `scripts/deploy.sh`, `scripts/deploy.ps1`
- **操作**: Create
- **内容**:
  - 停止旧容器
  - 拉取最新代码
  - 构建新镜像
  - 启动新容器
  - 健康检查
  - 回滚机制 (失败时恢复旧版本)
- **交付**: 部署自动化脚本

## 关键文件

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `backend/src/main/java/com/goldminer/config/RateLimitConfig.java` | Create | 接口限流配置 |
| `backend/src/main/java/com/goldminer/security/RequestSignatureFilter.java` | Create | 请求签名验证 |
| `backend/src/main/java/com/goldminer/audit/AuditLogger.java` | Create | 行为审计系统 |
| `frontend/playwright.config.ts` | Create | Playwright 配置 |
| `frontend/tests/e2e/game-flow.spec.ts` | Create | E2E 测试用例 |
| `k6/game-test.js` | Modify | k6 性能测试 |
| `backend/Dockerfile` | Modify | 后端镜像优化 |
| `frontend/Dockerfile` | Modify | 前端镜像优化 |
| `docker-compose.prod.yml` | Create | 生产环境配置 |
| `scripts/deploy.sh`, `scripts/deploy.ps1` | Create | 部署脚本 |

## 测试策略

### 防作弊测试
- [ ] 超速作弊测试: 修改钩子速度, 验证被检测
- [ ] 时间篡改测试: 修改游戏时间, 验证被拒绝
- [ ] 重放攻击测试: 重复提交相同请求, 验证被拦截
- [ ] 签名伪造测试: 修改请求签名, 验证被拒绝
- [ ] 频率限制测试: 快速重复请求, 验证被限流

### E2E 测试
- [ ] 首页 → 关卡选择 → 游戏流程测试
- [ ] 游戏 → 积分 → 排行榜流程测试
- [ ] 游戏 → 积分 → 奖品兑换流程测试
- [ ] 多浏览器测试 (Chromium, Firefox)

### 性能测试
- [ ] 压力测试: 模拟 100 并发用户
- [ ] 响应时间测试: P95 < 200ms
- [ ] 游戏性能测试: FPS ≥ 30fps

### 安全测试
- [ ] 使用 Postman/Burp Suite 尝试篡改分数
- [ ] SQL 注入测试
- [ ] XSS 攻击测试

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 正常用户被误判为作弊 | 中 | 设置宽松的阈值, 仅记录日志不直接阻断, 人工审核 |
| 限流影响正常用户体验 | 低 | 提供限流提示, 合理设置限流阈值 |
| E2E 测试不稳定 | 中 | 使用 Playwright 自动等待机制, 增加重试次数 |
| 性能测试资源不足 | 低 | 在独立环境运行性能测试, 不影响开发环境 |
| 生产部署失败 | 高 | 实现回滚机制, 保留旧版本镜像 |

## 依赖
- P1: 基础设施与项目脚手架 (依赖 Docker 配置)
- P3: 后端核心服务与 API (依赖游戏核心逻辑)
- P5: 业务功能开发 (依赖完整业务流程)

## 后续依赖
- 无 (最后一个计划)

## 交付物
- 多层防作弊机制 (限流、签名验证、行为审计)
- E2E 测试套件 (Playwright)
- 性能测试脚本 (k6)
- 优化的 Docker 镜像和部署配置
- 部署自动化脚本
- 完整的安全和性能测试用例
- 生产环境就绪的系统
