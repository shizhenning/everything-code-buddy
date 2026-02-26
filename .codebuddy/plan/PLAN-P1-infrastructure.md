# 实施计划: P1 - 基础设施与项目脚手架

## 概述
搭建项目的基础运行环境,包括前后端代码库初始化、Docker 编排配置、数据库连接池配置以及基础的 CI/CD 框架。这是所有后续开发的基石。

## 任务类型
- [x] Backend / Frontend / DevOps

## 实施步骤

### Phase 1: 后端脚手架 (1.5 天)

#### Step 1.1: 初始化 Spring Boot 项目
**文件**: `backend/pom.xml`
- **操作**: Create
- **内容**:
  - 配置 Spring Boot 3.2, Java 17
  - 核心依赖:
    - spring-boot-starter-web (Web 框架)
    - spring-boot-starter-data-jpa (JPA 数据访问)
    - spring-boot-starter-data-redis (Redis 缓存)
    - spring-boot-starter-validation (参数验证)
    - spring-boot-starter-actuator (监控端点)
    - spring-boot-starter-security (安全认证)
    - flyway-core (数据库迁移)
    - postgresql (数据库驱动)
    - redisson-spring-boot-starter (分布式锁)
    - Lombok (代码简化)
- **交付**: 可执行的 Spring Boot 项目骨架

#### Step 1.2: 配置数据库与缓存连接
**文件**: `backend/src/main/resources/application.yml`
- **操作**: Create
- **内容**:
  - PostgreSQL 连接配置 (HikariCP 连接池)
  - Redis 连接配置 (Lettuce 客户端)
  - Flyway 迁移脚本路径
  - 支持环境变量覆盖 (SPRING_PROFILES_ACTIVE)
  - 多环境配置: dev, docker, prod
- **交付**: 数据库和缓存的连接配置

#### Step 1.3: 建立全局异常处理与响应封装
**文件**: `backend/src/main/java/com/goldminer/common/GlobalExceptionHandler.java`
- **操作**: Create
- **内容**:
  - 统一响应对象 `Result<T>` (code, message, data)
  - 全局异常处理器 `@ControllerAdvice`
  - 处理常见异常: `ValidationException`, `BusinessException`, `DataAccessException`
- **交付**: 规范的 API 响应格式

#### Step 1.4: 创建应用主类与基础包结构
**文件**: `backend/src/main/java/com/goldminer/GoldMinerApplication.java`
- **操作**: Create
- **内容**:
  - `@SpringBootApplication` 主类
  - 包结构: `controller/`, `service/`, `repository/`, `entity/`, `dto/`, `config/`, `exception/`, `common/`
- **交付**: 清晰的后端项目结构

### Phase 2: 前端脚手架 (1 天)

#### Step 2.1: 初始化 React + Vite 项目
**文件**: `frontend/package.json`
- **操作**: Create
- **内容**:
  - React 18, TypeScript
  - Vite 5 (构建工具)
  - Phaser 3.70+ (游戏引擎)
  - Zustand (状态管理)
  - TanStack Query v5 (数据获取)
  - TailwindCSS (样式框架)
  - Playwright (E2E 测试)
- **交付**: 可运行的前端项目

#### Step 2.2: 配置构建代理与目录结构
**文件**: `frontend/vite.config.ts`
- **操作**: Create
- **内容**:
  - `/api` 代理到后端服务 (http://localhost:8080)
  - 路径别名 `@/` 指向 `src`
  - TypeScript 配置
  - 构建优化配置
- **交付**: 开发环境代理配置

#### Step 2.3: 创建基础布局与路由
**文件**: `frontend/src/App.tsx`, `frontend/src/main.tsx`
- **操作**: Create
- **内容**:
  - React Router 6 配置
  - 基础路由: `/`, `/levels`, `/game`, `/result`, `/points`, `/prizes`
  - MainLayout 组件 (导航栏、页脚)
  - 页面占位符组件
- **交付**: 页面路由骨架

### Phase 3: 容器化编排 (0.5 天)

#### Step 3.1: 编写 Docker Compose 配置
**文件**: `docker-compose.yml`
- **操作**: Create
- **内容**:
  - postgres: PostgreSQL 14 容器
  - redis: Redis 7 容器
  - backend: Spring Boot 服务
  - frontend: 前端服务 (可选, 可本地运行)
  - 健康检查配置
  - 依赖关系管理 (depends_on)
- **交付**: 一键启动开发环境

#### Step 3.2: 创建后端 Dockerfile
**文件**: `backend/Dockerfile`
- **操作**: Create
- **内容**:
  - 多阶段构建 (Maven 构建 → JRE 运行)
  - 优化镜像体积
  - 健康检查配置
- **交付**: 后端 Docker 镜像构建文件

#### Step 3.3: 创建环境变量配置文件
**文件**: `.env`, `.env.example`
- **操作**: Create
- **内容**:
  - 数据库连接信息
  - Redis 连接信息
  - 端口映射配置
- **交付**: 环境变量模板

## 关键文件

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `backend/pom.xml` | Create | Maven 依赖配置 |
| `backend/src/main/resources/application.yml` | Create | Spring Boot 配置 |
| `backend/src/main/java/com/goldminer/GoldMinerApplication.java` | Create | 应用主类 |
| `backend/src/main/java/com/goldminer/common/GlobalExceptionHandler.java` | Create | 全局异常处理 |
| `frontend/package.json` | Create | 前端依赖配置 |
| `frontend/vite.config.ts` | Create | Vite 构建配置 |
| `frontend/src/App.tsx` | Create | React 主组件 |
| `docker-compose.yml` | Create | Docker 编排配置 |
| `backend/Dockerfile` | Create | 后端镜像构建 |
| `.env.example` | Create | 环境变量模板 |

## 测试策略

### 基础功能测试
- [ ] Spring Boot 应用启动成功 (`mvn spring-boot:run`)
- [ ] React 应用启动成功 (`npm run dev`)
- [ ] Docker Compose 启动成功 (`docker-compose up -d`)

### 健康检查
- [ ] 后端健康检查通过: `curl http://localhost:8080/actuator/health`
- [ ] PostgreSQL 连接正常: `pg_isready`
- [ ] Redis 连接正常: `redis-cli ping`

## 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 端口冲突 (8080, 3000, 5432, 6379) | 中 | 在 `.env` 文件中配置端口映射, 使用 `lsof` 检查占用 |
| Maven 依赖下载慢 | 低 | 配置国内镜像源 (阿里云/腾讯云) |
| Node.js 版本不兼容 | 低 | 使用 nvm 管理 Node 版本, 确保版本 ≥ 18 |
| Docker 网络问题 | 中 | 检查 Docker 网络配置, 使用 `--network host` 调试 |

## 依赖
- 无 (第一个计划)

## 后续依赖
- P2: 数据库设计与缓存策略 (依赖本计划的基础设施)
- P3: 后端核心服务与 API (依赖本计划的后端脚手架)
- P4: 前端架构与游戏引擎集成 (依赖本计划的前端脚手架)

## 交付物
- 可运行的 Spring Boot 项目
- 可运行的 React + Vite 项目
- 完整的 Docker Compose 配置
- 开发环境一键启动脚本
