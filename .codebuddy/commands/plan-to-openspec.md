---
name: plan-to-openspec
description: 自动化转换 .codebuddy/plan 下的计划文件为 OpenSpec 规范格式
---

# Plan to OpenSpec Converter

## Overview

This tool provides automated conversion of `.codebuddy/plan/` files to OpenSpec SDD specification format. It coordinates multiple sub-agents to analyze, transform, and validate plan documents into OpenSpec-compliant specifications.

## Core Philosophy

1. **Spec-Driven Development (SDD)**: Converting implementation plans to behavior specifications
2. **Atomic Changes**: Splitting large plans into small, focused changes
3. **Traceability**: Maintaining complete links from original plans to OpenSpec specs
4. **AI-Friendly Format**: Converting technical details to Gherkin scenarios

## Features

- Parse existing plan files and extract requirements
- Split monolithic plans into atomic OpenSpec changes
- Convert technical implementations to Gherkin scenarios
- Generate complete OpenSpec artifacts (proposal, design, tasks, mapping)
- Maintain full traceability to original plans
- Validate generated specs against OpenSpec standards
- Support incremental updates and conflict resolution
- **支持中英文输出**（默认中文）

## 语言配置

**默认语言**：中文（zh-CN）

**强制使用中文**：
```bash
/plan-to-openspec infrastructure-user-center.md --lang zh-CN
```

**使用英文**：
```bash
/plan-to-openspec infrastructure-user-center.md --lang en-US
```

**配置文件设置**：
```json
{
  "conversion": {
    "language": "zh-CN"  // zh-CN=中文，en-US=英文
  }
}
```

**生成的文件语言影响**：
- ✅ spec.md - 需求描述、场景（GIVEN/WHEN/THEN）
- ✅ design.md - 架构设计、API 设计
- ✅ tasks.md - 任务描述、验收标准
- ✅ proposal.md - 变更提案
- ✅ mapping.md - 映射文档

**重要**：Gherkin 关键字在中文版本中翻译为：
- GIVEN → 假设
- AND → 并且
- WHEN → 当
- THEN → 那么

## Usage

### Convert a Single Plan

```bash
/plan-to-openspec <plan-file>
```

Example:
```bash
/plan-to-openspec infrastructure-user-center.md
```

### Convert All Plans

```bash
/plan-to-openspec --all
```

### Convert with Validation

```bash
/plan-to-openspec <plan-file> --validate
```

### Dry Run (Preview Only)

```bash
/plan-to-openspec <plan-file> --dry-run
```

### 强制使用中文生成

```bash
/plan-to-openspec <plan-file> --lang zh-CN
```

示例：
```bash
/plan-to-openspec infrastructure-user-center.md --lang zh-CN
```

这将生成的所有 OpenSpec 规范文件（spec.md、design.md、tasks.md、proposal.md、mapping.md）都使用中文编写，包括：
- 需求描述
- 场景说明（GIVEN/WHEN/THEN）
- 设计文档
- 任务描述
- 验收标准
- 映射文档

**重要说明**：
- 默认语言为中文（zh-CN）
- 如果需要英文，使用 `--lang en-US`
- 配置文件中的 `language` 选项也会影响输出语言

## Workflow

### 0. Pre-Check Phase

Before conversion, perform the following checks:

1. **Verify OpenSpec CLI Installation**
   ```bash
   openspec --version
   ```
   If not installed, prompt user to install:
   ```bash
   npm install -g @fission-ai/openspec@latest
   ```

2. **Check Directory Structure**
   - Verify `.codebuddy/plan/` exists
   - Check if `openspec/` directory already exists
   - Warn if conflicts detected

3. **Load Configuration**
   - Read `.codebuddy/config/plan-to-openspec.json` if exists
   - Apply default configuration otherwise

### 1. Analysis Phase

**调用 requirements-analyzer agent**:

```bash
Task("analyze-plan", requirements-analyzer, `
分析以下计划文件，提取功能需求、技术方案和任务分解：

[计划文件内容]

请提供：
1. 功能需求列表（带编号FR-XXX-001格式）
2. 技术组件识别
3. 任务边界分析
4. 依赖关系图
5. 建议的原子化拆分方案

注意：不要给出评分，只提取和结构化信息。
`)
```

**Output Format**:
```markdown
# 计划文件分析报告

## 功能需求提取
- FR-PROJ-001: [需求描述]
- FR-PROJ-002: [需求描述]

## 技术组件识别
- Component 1: [名称] - [职责]
- Component 2: [名称] - [职责]

## 原子化变更建议
- Change 1: [名称] - [包含需求]
- Change 2: [名称] - [包含需求]

## 依赖关系
[Mermaid依赖图]

## 任务边界分析
[每个变更的任务清单]
```

### 2. Planning Phase

**调用 planner agent**:

```bash
Task("plan-changes", planner, `
基于以下分析结果，规划 OpenSpec 变更结构：

[分析结果]

请规划：
1. 每个变更的名称和编号
2. 每个变更包含的 spec 模块
3. 每个变更的任务优先级
4. 变更间的依赖关系
`)
```

### 3. Transformation Phase

For each identified change, **并行调用以下子 agents**:

#### 3.1 生成 Spec 文件

**调用 requirements-analyzer**:
```bash
Task("generate-spec", requirements-analyzer, `
将以下需求和场景转换为 OpenSpec spec.md 格式：

[需求和场景]

要求：
1. 使用 SHALL/SHOULD 规范语言
2. 使用 Gherkin 语法（GIVEN/WHEN/THEN）
3. 包含 Purpose、Requirements、Acceptance Criteria
4. 添加 Non-Functional Requirements
5. 包含 References 到原始计划
`)
```

#### 3.2 生成 Design 文档

**调用 backend-analyzer 和 architect**:
```bash
Task("generate-design", backend-analyzer, `
基于以下技术需求，生成 OpenSpec design.md：

[技术需求]

请生成：
1. 架构概览
2. API 设计（包含端点、请求/响应格式）
3. 数据库 schema 设计
4. 安全考虑
5. 测试策略
`)

Task("generate-architecture", architect, `
为以下功能设计系统架构：

[功能需求]

请提供：
1. 架构模式（单体/微服务/Serverless）
2. 模块划分和职责
3. 数据流设计
4. 扩展性考虑
`)
```

#### 3.3 生成 Tasks 清单

**调用 planner**:
```bash
Task("generate-tasks", planner, `
将以下设计方案分解为原子化任务：

[设计方案]

要求：
1. 每个任务可独立完成
2. 包含文件创建列表
3. 每个任务有明确的验收标准
4. 任务按优先级排序
`)
```

#### 3.4 生成 Proposal

**主 agent 生成**:
```markdown
# Proposal for [Change Name]

## Motivation
[描述为什么需要这个变更]

## Goals
- Goal 1: [具体目标]
- Goal 2: [具体目标]

## Impact Analysis
### Scope
- [影响的模块/功能]

### Benefits
- [收益1]
- [收益2]

### Risks
- [风险1] - [缓解措施]
- [风险2] - [缓解措施]

## Dependencies
- [依赖的变更或功能]

## Rollout Plan
1. [阶段1]
2. [阶段2]

## Success Criteria
- [标准1]
- [标准2]
```

#### 3.5 生成 Mapping 文件

**主 agent 生成**:
```markdown
# Mapping from Original Plan

## Change Overview
- Change ID: change-XXX
- Original Plan: `.codebuddy/plan/[plan-file].md`
- Sections: [章节列表]
- Requirements: [FR 编号列表]

### Requirement to Spec Mapping

| Original Requirement | FR ID | OpenSpec Requirement | Spec Path |
|---------------------|-------|---------------------|-----------|
| [原始需求描述] | FR-XXX-001 | [OpenSpec需求] | changes/change-XXX/specs/[module]/spec.md |

### Task to Implementation Mapping

| Original Step | Task ID | Task Name | Files Created |
|---------------|---------|-----------|---------------|
| [原始步骤] | Task 1 | [任务名称] | [文件列表] |

### Traceability Chain

```
原始计划章节
  ↓
功能需求 (FR-XXX-001)
  ↓
OpenSpec Requirement
  ↓
Scenario (GIVEN/WHEN/THEN)
  ↓
Tasks
  ↓
Implementation Files
  ↓
Tests
```
```

### 4. Validation Phase

**调用 test-analyzer**:
```bash
Task("validate-specs", test-analyzer, `
验证以下 OpenSpec 规范的质量和完整性：

[生成的规范文件]

请验证：
1. 文件结构完整性
2. OpenSpec 合规性（SHALL/SHOULD、Gherkin）
3. 需求覆盖率
4. 可追溯性
5. 测试场景完整性

输出验证报告和改进建议。
`)
```

**验证检查清单**:
- [ ] spec.md 存在于每个模块目录
- [ ] 使用 SHALL/SHOULD 语言
- [ ] 包含 Gherkin 场景
- [ ] 有 Acceptance Criteria
- [ ] 有 References 到原始计划
- [ ] proposal.md 存在
- [ ] design.md 存在
- [ ] tasks.md 存在
- [ ] mapping.md 存在
- [ ] 所有链接有效

### 5. Generation Phase

**主 agent 执行文件生成**:

1. 创建目录结构
2. 写入所有生成的文件
3. 生成转换报告
4. 更新 git 状态

### 6. Post-Generation Phase

1. **生成摘要报告**:
```markdown
# OpenSpec 转换完成

## 转换摘要
- 源文件: `.codebuddy/plan/[plan-file].md`
- 生成变更数: X
- 生成 Spec 数: Y
- 生成任务数: Z

## 变更列表
1. change-001: [名称]
   - Specs: X 个
   - Tasks: Y 个
   - Files: Z 个

## 文件清单
[生成的所有文件列表]

## 验证结果
- 文件结构: ✓ 通过
- OpenSpec 合规: ✓ 通过
- 可追溯性: ✓ 通过

## 下一步
1. 查看生成的规范: `openspec/changes/`
2. 使用 OpenSpec CLI: `openspec propose`
3. 应用变更: `openspec apply`
```

2. **创建转换日志**: `.codebuddy/logs/plan-to-openspec-[timestamp].json`

## Directory Structure

```
openspec/
├── specs/                    # Current truth (populated after apply)
├── changes/                  # Change proposals
│   ├── change-001-xxx/
│   │   ├── proposal.md
│   │   ├── design.md
│   │   ├── tasks.md
│   │   ├── mapping.md
│   │   └── specs/
│   │       └── <module>/
│   │           └── spec.md
│   └── ...
└── project/
    └── conventions.md
```

## Templates

### Spec Template (Complete)

```markdown
# auth-login Specification

## Purpose
Provide secure user authentication functionality including registration, login, and session management for the platform.

## Requirements

### Requirement: User can register with phone number and verification code

The system SHALL allow new users to register using a phone number and verification code.

#### Scenario: Successful registration
- GIVEN the system is initialized and running
- AND a user has a valid phone number
- AND the user has obtained and entered a correct verification code
- WHEN the user submits a registration request
  - phone: "13800138000"
  - password: "SecurePass123!"
  - verifyCode: "123456"
- THEN the system SHALL return a user ID and JWT token
- AND the user's password SHALL be stored using BCrypt encryption
- AND the user's status SHALL be "active"
- AND the system SHALL automatically create a points account for the user
- AND the points account initial points SHALL be 0
- AND the points account initial level SHALL be 1

#### Scenario: Registration fails with invalid verification code
- GIVEN the system is initialized and running
- AND a user has a valid phone number
- WHEN the user submits a registration request with an invalid verification code
  - phone: "13800138000"
  - password: "SecurePass123!"
  - verifyCode: "000000"
- THEN the system SHALL return an error message
- AND the error code SHALL be VERIFICATION_CODE_INVALID
- AND the user account SHALL NOT be created

#### Scenario: Registration fails with duplicate phone number
- GIVEN the system is initialized and running
- AND phone number "13800138000" is already registered
- WHEN a new user attempts to register with the same phone number
- THEN the system SHALL return an error message
- AND the error code SHALL be PHONE_NUMBER_ALREADY_EXISTS

#### Scenario: Password must meet complexity requirements
- GIVEN the system is initialized and running
- WHEN the user submits a registration request with a weak password
  - password: "123"
- THEN the system SHALL return a validation error
- AND the error message SHALL indicate insufficient password length
- AND the user account SHALL NOT be created

### Requirement: User can login with phone and password

The system SHALL allow registered users to login using their phone number and password.

#### Scenario: Successful login
- GIVEN a user is registered with phone number "13800138000"
- AND the user's password is "SecurePass123!"
- WHEN the user submits a login request
  - phone: "13800138000"
  - password: "SecurePass123!"
- THEN the system SHALL return a JWT token
- AND the token SHALL be valid for 7 days
- AND the system SHALL update the last login time

#### Scenario: Login fails with incorrect password
- GIVEN a user is registered with phone number "13800138000"
- WHEN the user submits a login request with an incorrect password
- THEN the system SHALL return an error message
- AND the system SHALL increment the failed login counter
- AND after 5 failed attempts the account SHALL be locked for 30 minutes

## Non-Functional Requirements

### NFR: Registration API performance
The system SHALL handle 100 concurrent registration requests with 95% of requests completing within 1 second and all requests completing within 3 seconds.

### NFR: Security requirements
- Passwords SHALL be encrypted using the BCrypt algorithm with a work factor of at least 10
- JWT tokens SHALL be valid for 7 days
- Tokens SHALL include user ID and expiration time
- Verification codes SHALL expire after 5 minutes
- Same phone number can only request one verification code per minute

### NFR: Availability
The authentication service SHALL have 99.9% uptime.

## Acceptance Criteria

- [ ] Users can register with a valid phone number and verification code
- [ ] Registration automatically creates a points account
- [ ] Invalid verification codes cause registration to fail
- [ ] Duplicate phone numbers cause registration to fail
- [ ] Weak passwords are rejected
- [ ] Returned tokens can be used for subsequent API calls
- [ ] Passwords are stored in encrypted form
- [ ] Users can login with valid credentials
- [ ] Failed login attempts are tracked
- [ ] Accounts are locked after 5 failed login attempts

## References

- Original plan: `.codebuddy/plan/infrastructure-user-center.md` 步骤3
- Feature requirements: FR-AUTH-001, FR-AUTH-002
- API documentation: POST /api/v1/auth/register, POST /api/v1/auth/login
```

### Design Template (Complete)

```markdown
# Design Document for auth-login

## Architecture Overview

The authentication module follows a layered architecture:

```
┌─────────────────┐
│  Frontend UI    │  Vue.js Components
├─────────────────┤
│  API Layer     │  REST Controllers
├─────────────────┤
│  Service Layer │  Business Logic
├─────────────────┤
│  Data Layer    │  Repository Pattern
├─────────────────┤
│  External      │  SMS Service
│  Services      │  JWT Provider
└─────────────────┘
```

## Component Design

### 1. AuthController
**Responsibilities**:
- Handle HTTP requests for registration and login
- Validate input data
- Return appropriate HTTP responses

**Endpoints**:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/refresh

### 2. AuthService
**Responsibilities**:
- Implement authentication business logic
- Coordinate with external services (SMS, JWT)
- Manage session state

### 3. UserRepository
**Responsibilities**:
- Abstract database operations for User entity
- Implement CRUD operations
- Handle queries

## API Design

### POST /api/v1/auth/register
Register a new user with phone number and verification code.

**Request**:
```json
{
  "phone": "13800138000",
  "password": "SecurePass123!",
  "verifyCode": "123456"
}
```

**Response (Success)**:
```json
{
  "code": 0,
  "message": "Registration successful",
  "data": {
    "userId": 12345,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "pointsAccount": {
      "accountId": 54321,
      "points": 0,
      "level": 1
    }
  }
}
```

**Response (Error)**:
```json
{
  "code": 400,
  "message": "Invalid verification code",
  "errorCode": "VERIFICATION_CODE_INVALID"
}
```

### POST /api/v1/auth/login
Login with phone number and password.

**Request**:
```json
{
  "phone": "13800138000",
  "password": "SecurePass123!"
}
```

**Response (Success)**:
```json
{
  "code": 0,
  "message": "Login successful",
  "data": {
    "userId": 12345,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800
  }
}
```

## Database Schema

### User Table
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive', 'locked') DEFAULT 'active',
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone)
);
```

### PointsAccount Table
```sql
CREATE TABLE points_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  points INT DEFAULT 0,
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

## Security Considerations

### Password Security
- Use BCrypt with work factor 10
- Minimum password length: 8 characters
- Require: uppercase, lowercase, number, special character
- Never log passwords or password hashes

### Token Security
- Use JWT with HS256 algorithm
- Token expiration: 7 days
- Store secret in environment variables
- Implement token refresh mechanism

### Rate Limiting
- Limit verification code requests: 1 per minute per phone number
- Limit login attempts: 5 per 15 minutes per IP
- Use Redis for rate limiting

### Input Validation
- Sanitize all inputs
- Validate phone number format
- Validate password complexity
- Check for SQL injection patterns

## Testing Strategy

### Unit Tests
- Test AuthService business logic
- Test password encryption
- Test token generation
- Test validation logic

### Integration Tests
- Test full registration flow
- Test full login flow
- Test database operations
- Test external service mocks

### E2E Tests
- Test registration from UI to database
- Test login from UI to token
- Test error handling flows

### Performance Tests
- Load test registration endpoint (1000 req/s)
- Load test login endpoint (5000 req/s)
- Measure response times under load

## Error Handling

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| VERIFICATION_CODE_INVALID | 400 | Verification code is incorrect or expired |
| PHONE_NUMBER_ALREADY_EXISTS | 409 | Phone number already registered |
| PASSWORD_TOO_WEAK | 400 | Password does not meet complexity requirements |
| INVALID_CREDENTIALS | 401 | Phone or password is incorrect |
| ACCOUNT_LOCKED | 403 | Account is locked due to failed attempts |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

## Dependencies

- Spring Boot 3.x
- Spring Security 6.x
- JWT library (jjwt)
- BCrypt library
- Redis client
- SMS service SDK
```

### Tasks Template (Complete)

```markdown
# Task List for auth-login

## Task 1: Implement User Entity and Repository
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: None

**Description**:
Create the User entity with JPA annotations and the UserRepository interface with custom query methods.

**Files to Create**:
- `backend/src/main/java/com/game/entity/User.java`
- `backend/src/main/java/com/game/repository/UserRepository.java`

**Acceptance Criteria**:
- [ ] User entity has all required fields (id, phone, passwordHash, status, etc.)
- [ ] UserRepository extends JpaRepository
- [ ] Custom query method `findByPhone()` exists
- [ ] Unit tests for repository methods pass
- [ ] Database migration script generated

**References**:
- Original plan: Step 3.1.1

---

## Task 2: Implement Password Encryption Service
**Priority**: P0
**Estimated Time**: 1 hour
**Dependencies**: None

**Description**:
Create a service class for password encryption using BCrypt algorithm with work factor 10.

**Files to Create**:
- `backend/src/main/java/com/game/service/PasswordService.java`

**Acceptance Criteria**:
- [ ] Service uses BCrypt with work factor 10
- [ ] `hashPassword()` method encrypts passwords
- [ ] `checkPassword()` method verifies passwords
- [ ] Unit tests cover encryption and verification
- [ ] Passwords are never logged

**References**:
- Original plan: Step 3.1.2

---

## Task 3: Implement Verification Code Service
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: None

**Description**:
Create a service for generating, storing, and validating verification codes with Redis caching.

**Files to Create**:
- `backend/src/main/java/com/game/service/VerificationCodeService.java`
- `backend/src/main/java/com/game/service/SmsService.java`

**Acceptance Criteria**:
- [ ] Generates 6-digit numeric codes
- [ ] Stores codes in Redis with 5-minute expiration
- [ ] Validates codes correctly
- [ ] Enforces rate limiting (1 per minute per phone)
- [ ] Integrates with SMS service
- [ ] Unit tests pass

**References**:
- Original plan: Step 3.1.3

---

## Task 4: Implement JWT Token Service
**Priority**: P0
**Estimated Time**: 1 hour
**Dependencies**: None

**Description**:
Create a service for generating and validating JWT tokens.

**Files to Create**:
- `backend/src/main/java/com/game/service/TokenService.java`

**Acceptance Criteria**:
- [ ] Generates tokens with HS256 algorithm
- [ ] Tokens include userId and expiration
- [ ] Tokens valid for 7 days
- [ ] Validates tokens correctly
- [ ] Throws exception for invalid tokens
- [ ] Unit tests pass

**References**:
- Original plan: Step 3.1.4

---

## Task 5: Implement Auth Service
**Priority**: P0
**Estimated Time**: 3 hours
**Dependencies**: Task 1, Task 2, Task 3, Task 4

**Description**:
Create the main authentication service with registration and login business logic.

**Files to Create**:
- `backend/src/main/java/com/game/service/AuthService.java`

**Acceptance Criteria**:
- [ ] `register()` method implements full registration flow
- [ ] `login()` method implements full login flow
- [ ] Creates points account on registration
- [ ] Tracks failed login attempts
- [ ] Locks account after 5 failures
- [ ] Handles all edge cases
- [ ] Integration tests pass

**References**:
- Original plan: Step 3.1.5

---

## Task 6: Implement Auth Controller
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: Task 5

**Description**:
Create REST controller for authentication endpoints.

**Files to Create**:
- `backend/src/main/java/com/game/controller/AuthController.java`

**Acceptance Criteria**:
- [ ] POST /api/v1/auth/register endpoint exists
- [ ] POST /api/v1/auth/login endpoint exists
- [ ] Input validation in place
- [ ] Returns correct HTTP status codes
- [ ] Error responses follow standard format
- [ ] API documentation generated (Swagger)
- [ ] Integration tests pass

**References**:
- Original plan: Step 3.1.6

---

## Task 7: Implement Rate Limiting
**Priority**: P1
**Estimated Time**: 2 hours
**Dependencies**: None

**Description**:
Implement rate limiting using Redis for API endpoints.

**Files to Create**:
- `backend/src/main/java/com/game/config/RateLimitConfig.java`
- `backend/src/main/java/com/game/aspect/RateLimitAspect.java`

**Acceptance Criteria**:
- [ ] Verification code requests: 1 per minute per phone
- [ ] Login attempts: 5 per 15 minutes per IP
- [ ] Returns 429 status when limit exceeded
- [ ] Unit tests pass

**References**:
- Original plan: Step 3.2.1

---

## Task 8: Configure Spring Security
**Priority**: P0
**Estimated Time**: 2 hours
**Dependencies**: Task 4

**Description**:
Configure Spring Security for JWT authentication and authorization.

**Files to Create**:
- `backend/src/main/java/com/game/config/SecurityConfig.java`
- `backend/src/main/java/com/game/filter/JwtAuthenticationFilter.java`

**Acceptance Criteria**:
- [ ] Public endpoints: /api/v1/auth/register, /api/v1/auth/login
- [ ] Protected endpoints require valid JWT
- [ ] JWT filter validates tokens
- [ ] CORS configuration in place
- [ ] Integration tests pass

**References**:
- Original plan: Step 3.2.2

---

## Task 9: Create Frontend Login Page
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: Task 6

**Description**:
Create Vue.js login page with form validation and API integration.

**Files to Create**:
- `frontend/src/views/Login.vue`
- `frontend/src/components/PhoneInput.vue`
- `frontend/src/api/auth.js`

**Acceptance Criteria**:
- [ ] Login form with phone and password fields
- [ ] Form validation (phone format, password complexity)
- [ ] Calls login API
- [ ] Stores token on success
- [ ] Shows error messages
- [ ] Redirects to dashboard on success

**References**:
- Original plan: Step 4.1.1

---

## Task 10: Create Frontend Registration Page
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: Task 6

**Description**:
Create Vue.js registration page with verification code and form validation.

**Files to Create**:
- `frontend/src/views/Register.vue`
- `frontend/src/components/VerificationCodeInput.vue`
- `frontend/src/api/auth.js` (extend)

**Acceptance Criteria**:
- [ ] Registration form with phone, password, verify code
- [ ] Send verification code button
- [ ] 60-second countdown on button
- [ ] Form validation
- [ ] Calls registration API
- [ ] Shows error messages
- [ ] Redirects to login on success

**References**:
- Original plan: Step 4.1.2

---

## Task 11: Write Unit Tests
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: Task 1, Task 2, Task 3, Task 4, Task 5

**Description**:
Write comprehensive unit tests for all service classes.

**Files to Create**:
- `backend/src/test/java/com/game/service/PasswordServiceTest.java`
- `backend/src/test/java/com/game/service/VerificationCodeServiceTest.java`
- `backend/src/test/java/com/game/service/TokenServiceTest.java`
- `backend/src/test/java/com/game/service/AuthServiceTest.java`

**Acceptance Criteria**:
- [ ] All service classes have unit tests
- [ ] Test coverage >= 80%
- [ ] All tests pass
- [ ] Edge cases covered

**References**:
- Original plan: Step 5.1

---

## Task 12: Write Integration Tests
**Priority**: P0
**Estimated Time**: 4 hours
**Dependencies**: Task 6, Task 8

**Description**:
Write integration tests for authentication endpoints.

**Files to Create**:
- `backend/src/test/java/com/game/integration/AuthIntegrationTest.java`

**Acceptance Criteria**:
- [ ] Tests full registration flow
- [ ] Tests full login flow
- [ ] Tests error scenarios
- [ ] Tests with real database (H2)
- [ ] All tests pass

**References**:
- Original plan: Step 5.2

---

## Task 13: Write E2E Tests
**Priority**: P1
**Estimated Time**: 3 hours
**Dependencies**: Task 9, Task 10

**Description**:
Write Playwright E2E tests for authentication flows.

**Files to Create**:
- `e2e/tests/auth.spec.ts`

**Acceptance Criteria**:
- [ ] Tests registration from UI
- [ ] Tests login from UI
- [ ] Tests error handling
- [ ] All tests pass
- [ ] Screenshots on failure

**References**:
- Original plan: Step 5.3

---

## Task 14: API Documentation
**Priority**: P2
**Estimated Time**: 1 hour
**Dependencies**: Task 6

**Description**:
Generate and customize Swagger/OpenAPI documentation.

**Files to Update**:
- `backend/pom.xml` (add swagger dependencies)
- `backend/src/main/java/com/game/config/SwaggerConfig.java`

**Acceptance Criteria**:
- [ ] Swagger UI accessible at /swagger-ui.html
- [ ] All endpoints documented
- [ ] Request/response schemas shown
- [ ] Example values provided

**References**:
- Original plan: Step 6.1
```

### Mapping Template (Complete)

```markdown
# Mapping from Original Plan to OpenSpec

## Change Overview

- **Change ID**: change-002-user-auth
- **Change Name**: User Authentication System
- **Original Plan**: `.codebuddy/plan/infrastructure-user-center.md`
- **Sections Covered**: 步骤3: 后端用户认证实现, 步骤4: 前端用户界面, 步骤5: 测试
- **Requirements**: FR-AUTH-001, FR-AUTH-002, FR-AUTH-003
- **Generated At**: 2025-03-04T10:30:00Z

## Requirement to Spec Mapping

| Original Plan Section | FR ID | Requirement Summary | OpenSpec Requirement | Spec Path |
|----------------------|-------|-------------------|---------------------|-----------|
| 步骤3.1 - 用户注册功能 | FR-AUTH-001 | User can register with phone number and verification code | User can register with phone number and verification code | changes/change-002-user-auth/specs/auth-login/spec.md |
| 步骤3.1 - 用户登录功能 | FR-AUTH-002 | User can login with phone and password | User can login with phone and password | changes/change-002-user-auth/specs/auth-login/spec.md |
| 步骤3.1 - 用户信息获取 | FR-AUTH-003 | User can retrieve own profile | User can retrieve own profile | changes/change-002-user-auth/specs/auth-session/spec.md |
| 步骤3.1 - 密码加密 | NFR-SEC-001 | Password must be encrypted | Passwords SHALL be encrypted using BCrypt | changes/change-002-user-auth/specs/auth-login/spec.md |
| 步骤3.1 - 验证码时效性 | NFR-SEC-002 | Verification code expiration | Verification codes SHALL expire after 5 minutes | changes/change-002-user-auth/specs/auth-login/spec.md |
| 步骤3.1 - 注册API性能 | NFR-PERF-001 | Registration API performance | Handle 100 concurrent requests | changes/change-002-user-auth/specs/auth-login/spec.md |

## Scenario to Task Mapping

| Spec Scenario | Spec Section | Related Tasks | Files |
|--------------|--------------|---------------|-------|
| Successful registration | auth-login/spec.md # Scenario 1 | Task 1, 2, 3, 4, 5, 6 | User.java, PasswordService.java, AuthService.java, AuthController.java |
| Registration fails with invalid verification code | auth-login/spec.md # Scenario 2 | Task 3, 5, 6 | VerificationCodeService.java, AuthService.java |
| Registration fails with duplicate phone number | auth-login/spec.md # Scenario 3 | Task 1, 5, 6 | UserRepository.java, AuthService.java |
| Password must meet complexity requirements | auth-login/spec.md # Scenario 4 | Task 2, 5, 6 | PasswordService.java, AuthService.java, AuthController.java |
| Successful login | auth-login/spec.md # Scenario 5 | Task 1, 2, 4, 5, 6, 8 | UserRepository.java, PasswordService.java, TokenService.java, AuthService.java |
| Login fails with incorrect password | auth-login/spec.md # Scenario 6 | Task 1, 5, 6, 7 | AuthService.java, RateLimitAspect.java |

## Task to Implementation Mapping

| Original Step | Task ID | Task Name | Implementation Files | Test Files |
|---------------|---------|-----------|---------------------|------------|
| 步骤3.1.1 - 用户实体 | Task 1 | Implement User Entity and Repository | entity/User.java, repository/UserRepository.java | repository/UserRepositoryTest.java |
| 步骤3.1.2 - 密码加密 | Task 2 | Implement Password Encryption Service | service/PasswordService.java | service/PasswordServiceTest.java |
| 步骤3.1.3 - 验证码服务 | Task 3 | Implement Verification Code Service | service/VerificationCodeService.java, service/SmsService.java | service/VerificationCodeServiceTest.java |
| 步骤3.1.4 - JWT Token | Task 4 | Implement JWT Token Service | service/TokenService.java | service/TokenServiceTest.java |
| 步骤3.1.5 - 认证服务 | Task 5 | Implement Auth Service | service/AuthService.java | service/AuthServiceTest.java |
| 步骤3.1.6 - 认证控制器 | Task 6 | Implement Auth Controller | controller/AuthController.java | integration/AuthIntegrationTest.java |
| 步骤3.2.1 - 限流 | Task 7 | Implement Rate Limiting | config/RateLimitConfig.java, aspect/RateLimitAspect.java | aspect/RateLimitAspectTest.java |
| 步骤3.2.2 - 安全配置 | Task 8 | Configure Spring Security | config/SecurityConfig.java, filter/JwtAuthenticationFilter.java | integration/SecurityIntegrationTest.java |
| 步骤4.1.1 - 登录页面 | Task 9 | Create Frontend Login Page | views/Login.vue, components/PhoneInput.vue, api/auth.js | e2e/tests/auth.spec.ts |
| 步骤4.1.2 - 注册页面 | Task 10 | Create Frontend Registration Page | views/Register.vue, components/VerificationCodeInput.vue | e2e/tests/auth.spec.ts |
| 步骤5.1 - 单元测试 | Task 11 | Write Unit Tests | (various test files) | - |
| 步骤5.2 - 集成测试 | Task 12 | Write Integration Tests | integration/AuthIntegrationTest.java | - |
| 步骤5.3 - E2E测试 | Task 13 | Write E2E Tests | e2e/tests/auth.spec.ts | - |
| 步骤6.1 - API文档 | Task 14 | API Documentation | config/SwaggerConfig.java | - |

## API to Spec Mapping

| Original API | Spec Requirement | Spec Path | Implementation |
|--------------|-----------------|-----------|-----------------|
| POST /api/v1/auth/register | User can register with phone number and verification code | auth-login/spec.md | AuthController.register() |
| POST /api/v1/auth/login | User can login with phone and password | auth-login/spec.md | AuthController.login() |
| POST /api/v1/auth/logout | User can logout | auth-session/spec.md | AuthController.logout() |
| GET /api/v1/users/me | User can retrieve own profile | auth-session/spec.md | UserController.getCurrentUser() |

## Traceability Chain

```
原始计划: infrastructure-user-center.md 步骤3.1
  ↓
功能需求: FR-AUTH-001 用户可以通过手机号和验证码注册
  ↓
OpenSpec Requirement: User can register with phone number and verification code
  ↓
Spec Scenario: Successful registration (GIVEN/WHEN/THEN)
  ↓
Design Document: AuthController, AuthService, PasswordService
  ↓
Tasks: Task 1, 2, 3, 4, 5, 6, 7, 8
  ↓
Implementation Files: User.java, PasswordService.java, VerificationCodeService.java,
                        TokenService.java, AuthService.java, AuthController.java
  ↓
Tests: PasswordServiceTest.java, AuthServiceTest.java,
       AuthIntegrationTest.java, auth.spec.ts
  ↓
实现完成 ✓
```

## Change Summary

- **Total Requirements**: 6 (5 FR, 1 NFR)
- **Total Scenarios**: 6
- **Total Tasks**: 14
- **Total Files Created**: 20+ implementation files, 10+ test files
- **Estimated Total Time**: 32 hours
- **Priority Distribution**: P0 (8 tasks), P1 (5 tasks), P2 (1 task)

## Dependencies

- Depends on: change-001-project-init
- Blocks: change-003-user-points, change-004-user-frontend

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| SMS service integration fails | High | Implement mock service for testing |
| JWT token security | High | Use industry-standard libraries, code review |
| Rate limiting performance | Medium | Benchmark with Redis cluster |
| Frontend state management | Medium | Use Vuex/Pinia for state |

## Notes

- All passwords must use BCrypt with work factor 10
- JWT tokens expire after 7 days
- Verification codes expire after 5 minutes
- Rate limiting uses Redis
- Frontend uses Vue.js with Pinia for state management
```

## Configuration

### Config File Location

`.codebuddy/config/plan-to-openspec.json`

### Config File Format (Complete)

```json
{
  "version": "1.0.0",
  "outputDir": "openspec",
  "planDir": ".codebuddy/plan",
  "changePrefix": "change-",
  "validateOnGenerate": true,
  "preserveOriginal": true,

  "conversion": {
    "language": "zh-CN",
    "specLanguage": "SHALL",
    "scenarioStyle": "gherkin",
    "includeNonFunctional": true,
    "includeAcceptanceCriteria": true
  },

  "tasks": {
    "estimateTime": true,
    "includeDependencies": true,
    "includePriority": true,
    "taskGranularity": "fine"
  },

  "validation": {
    "strictMode": false,
    "failOnError": false,
    "generateReport": true
  },

  "output": {
    "format": "markdown",
    "includeMetadata": true,
    "addLineNumbers": false
  },

  "git": {
    "autoCommit": false,
    "commitMessage": "chore: convert plan to OpenSpec specs",
    "createBranch": false,
    "branchName": "openspec/conversion"
  },

  "advanced": {
    "customTemplates": ".codebuddy/templates/plan-to-openspec/",
    "preProcessScript": ".codebuddy/scripts/plan-to-openspec-pre.js",
    "postProcessScript": ".codebuddy/scripts/plan-to-openspec-post.js",
    "skipExistingChanges": false,
    "mergeStrategy": "replace"
  }
}
```

### Config Options Explained

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | string | "1.0.0" | Config file version |
| `outputDir` | string | "openspec" | Output directory for OpenSpec files |
| `planDir` | string | ".codebuddy/plan" | Source directory for plan files |
| `changePrefix` | string | "change-" | Prefix for change directories |
| `validateOnGenerate` | boolean | true | Validate specs after generation |
| `preserveOriginal` | boolean | true | Keep original plan files |
| `language` | string | "zh-CN" | **输出语言（zh-CN=中文，en-US=英文），默认中文** |
| `specLanguage` | string | "SHALL" | Requirement language (SHALL, MUST) |
| `scenarioStyle` | string | "gherkin" | Scenario format (gherkin, plain) |
| `includeNonFunctional` | boolean | true | Include NFRs in specs |
| `includeAcceptanceCriteria` | boolean | true | Include acceptance criteria |
| `estimateTime` | boolean | true | Add time estimates to tasks |
| `includeDependencies` | boolean | true | Include task dependencies |
| `includePriority` | boolean | true | Include task priorities |
| `taskGranularity` | string | "fine" | Task size (fine, medium, coarse) |
| `strictMode` | boolean | false | Fail on any validation error |
| `failOnError` | boolean | false | Stop on generation errors |
| `generateReport` | boolean | true | Generate validation report |
| `autoCommit` | boolean | false | Auto-commit generated files |
| `commitMessage` | string | "chore: ..." | Git commit message |
| `createBranch` | boolean | false | Create git branch |
| `branchName` | string | "openspec/..." | Branch name template |
| `customTemplates` | string | null | Path to custom templates |
| `preProcessScript` | string | null | Pre-processing script |
| `postProcessScript` | string | null | Post-processing script |
| `skipExistingChanges` | boolean | false | Skip if change exists |
| `mergeStrategy` | string | "replace" | How to merge (replace, merge, skip) |

## Integration with Other Commands

### 1. Integration with `/prd-optimize`

```
Plan (.codebuddy/plan/*.md)
  ↓
/plan-to-openspec (Convert to OpenSpec format)
  ↓
/prd-optimize (Optimize PRD and requirements)
  ↓
OpenSpec Specs (specs/, changes/)
```

**Use Case**:
1. User has existing plan files in `.codebuddy/plan/`
2. Run `/plan-to-openspec infrastructure-user-center.md` to convert to OpenSpec
3. Run `/prd-optimize openspec/changes/change-002-user-auth/proposal.md` to optimize
4. Result: Improved OpenSpec specs with better requirements

### 2. Integration with OpenSpec CLI

**Installation**:
```bash
npm install -g @fission-ai/openspec@latest
```

**Workflow**:
```bash
# Step 1: Convert plan to OpenSpec
/plan-to-openspec infrastructure-user-center.md

# Step 2: Initialize OpenSpec (if not already)
cd openspec
openspec init

# Step 3: Propose changes
openspec propose

# Step 4: Review and approve (via PR)
# ... manual review ...

# Step 5: Apply changes
openspec apply

# Step 6: Implement (follow tasks.md)
# ... manual implementation ...

# Step 7: Archive completed changes
openspec archive
```

### 3. Integration with `/plan` Command

```bash
# Create implementation plan from OpenSpec
/plan openspec/changes/change-002-user-auth/design.md

# This generates detailed implementation plan
# Based on tasks.md in the change directory
```

### 4. Integration with `/tdd` Command

```bash
# After generating specs, use TDD to implement
/tdd openspec/changes/change-002-user-auth/specs/auth-login/spec.md

# This will:
# 1. Read spec scenarios
# 2. Generate test cases first
# 3. Implement code to pass tests
```

### 5. Integration with `/e2e` Command

```bash
# Generate E2E tests from specs
/e2e openspec/changes/change-002-user-auth/specs/auth-login/spec.md

# This generates Playwright E2E tests
# For all scenarios in the spec
```

### 6. Integration with Git Hooks

Add to `.codebuddy/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "pathPattern": "openspec/**/*.md",
        "hooks": [
          {
            "type": "command",
            "command": "node .codebuddy/scripts/validate-openspec.js"
          }
        ]
      }
    ]
  }
}
```

### 7. Integration with CI/CD

**GitHub Actions Example**:

```yaml
# .github/workflows/openspec-validation.yml
name: Validate OpenSpec Specs

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install OpenSpec
        run: npm install -g @fission-ai/openspec
      - name: Validate specs
        run: |
          cd openspec
          openspec validate
```

### 8. Integration with Documentation

**Auto-generate API Docs**:

```bash
# From design.md, generate Swagger/OpenAPI
npm run generate:docs --from=openspec/changes/*/design.md
```

**Auto-generate Architecture Docs**:

```bash
# From specs, generate architecture documentation
npm run generate:arch-docs --from=openspec/specs/
```

## Best Practices

1. **Atomic Changes**: Split large plans into small, focused changes
2. **Traceability**: Always maintain mapping to original plan
3. **Validation**: Always validate generated specs
4. **Review**: Have generated specs reviewed before implementation
5. **Iteration**: Start with dry-run to preview changes

## Examples

### Example 1: Single Plan Conversion

```bash
/plan-to-openspec infrastructure-user-center.md
```

Output:
```
Analyzing infrastructure-user-center.md...
Found 3 functional modules
Generating change-001-project-init...
Generating change-002-user-auth...
Generating change-003-user-frontend...
✓ Generated 3 changes
```

### Example 2: Dry Run

```bash
/plan-to-openspec infrastructure-user-center.md --dry-run
```

Output:
```
DRY RUN - No files will be created

Proposed changes:
- change-001-project-init
  - 5 specs
  - 8 tasks
  - 12 files
- change-002-user-auth
  - 3 specs
  - 10 tasks
  - 15 files
- change-003-user-frontend
  - 4 specs
  - 6 tasks
  - 8 files

Total: 3 changes, 12 specs, 24 tasks, 35 files
```

### Example 3: All Plans

```bash
/plan-to-openspec --all
```

Output:
```
Processing all plans in .codebuddy/plan/...
✓ infrastructure-user-center.md -> 3 changes
✓ game-template.md -> 2 changes
✓ activity-management.md -> 2 changes
✓ Generated 7 changes total
```

## Validation

The tool performs the following validations:

1. **File Structure**
   - ✓ spec.md exists in each module directory
   - ✓ proposal.md exists in each change
   - ✓ design.md exists in each change
   - ✓ tasks.md exists in each change

2. **Content Quality**
   - ✓ Uses SHALL/SHOULD language
   - ✓ Has Gherkin scenarios
   - ✓ Has acceptance criteria
   - ✓ Has references to original plan

3. **Traceability**
   - ✓ All specs have mapping entries
   - ✓ All tasks have original step references
   - ✓ No orphaned requirements

## Troubleshooting

### Issue: "Cannot parse plan file"
**Symptoms**:
- Error: "Failed to parse plan file"
- No requirements extracted

**Solution**:
1. Check plan file exists: `ls .codebuddy/plan/`
2. Verify file format is Markdown
3. Ensure clear section headers (## or ###)
4. Check for encoding issues
5. Try with `--verbose` flag for details

### Issue: "Cannot determine change boundaries"
**Symptoms**:
- Error: "Unable to split into atomic changes"
- All content in one giant change

**Solution**:
1. Add section markers to plan file
2. Manually specify change boundaries in config
3. Use `--manual-split` flag
4. Review plan for logical groupings

### Issue: "Validation failed"
**Symptoms**:
- Error: "Validation failed with X errors"
- Specs not generated

**Solution**:
1. Run with `--verbose` to see detailed errors
2. Check `openspec/validation-report.md`
3. Fix individual validation issues
4. Use `--continue-on-error` flag to generate partial specs

### Issue: "Mapping links broken"
**Symptoms**:
- Links in mapping.md don't work
- Traceability chain broken

**Solution**:
1. Verify file paths are correct
2. Check for relative vs absolute paths
3. Use `--fix-links` flag to auto-fix
4. Manually update mapping.md

### Issue: "OpenSpec CLI not found"
**Symptoms**:
- Error: "openspec command not found"
- Cannot propose changes

**Solution**:
```bash
# Install OpenSpec CLI
npm install -g @fission-ai/openspec@latest

# Verify installation
openspec --version
```

### Issue: "Git conflicts on merge"
**Symptoms**:
- Git merge conflicts
- Cannot apply changes

**Solution**:
1. Create branch for conversion: `git checkout -b openspec/conversion`
2. Merge manually: `git merge main`
3. Resolve conflicts
4. Commit: `git commit -m "chore: merge openspec specs"`

### Issue: "Task estimates are unrealistic"
**Symptoms**:
- Tasks take longer than estimated
- Planning accuracy is poor

**Solution**:
1. Adjust config: `"taskGranularity": "medium"`
2. Use historical data from previous projects
3. Include buffer time: `"estimateBuffer": 1.2`
4. Manually review and adjust time estimates

### Issue: "Generated specs too generic"
**Symptoms**:
- Scenarios lack detail
- Acceptance criteria are vague

**Solution**:
1. Use `--detail-level high` flag
2. Add more examples to original plan
3. Manually enhance generated specs
4. Run `/prd-optimize` on specs to improve

## Advanced Usage

### Custom Templates

**Template Directory**: `.codebuddy/templates/plan-to-openspec/`

**Available Templates**:
- `spec.md.template` - Specification template
- `design.md.template` - Design document template
- `tasks.md.template` - Task list template
- `proposal.md.template` - Proposal template
- `mapping.md.template` - Mapping template

**Template Variables**:
```markdown
# {{changeName}} Specification

## Purpose
{{purpose}}

## Requirements

{{#each requirements}}
### Requirement: {{title}}
{{description}}
{{#each scenarios}}
#### Scenario: {{name}}
- GIVEN {{given}}
- WHEN {{when}}
- THEN {{then}}
{{/each}}
{{/each}}
```

**Custom Template Example**:
```markdown
# {{changeName}} Specification

## Overview
This spec defines the behavior for {{purpose}}.

## Background
{{background}}

## Scenarios
{{#each scenarios}}
### {{name}}
**Given** {{given}}
**When** {{when}}
**Then** {{then}}
{{/each}}
```

### Pre-processing Scripts

**Script Location**: `.codebuddy/scripts/plan-to-openspec-pre.js`

**Purpose**: Transform plan files before conversion

**Example**:
```javascript
// .codebuddy/scripts/plan-to-openspec-pre.js

const fs = require('fs');

function preprocessPlan(planPath, outputPath) {
  const content = fs.readFileSync(planPath, 'utf8');

  // Add requirement IDs
  let enhanced = content.replace(/## 功能需求/, '## 功能需求\\n\\n');
  let reqCounter = 1;
  enhanced = enhanced.replace(/^- (.*)/gm, (match, req) => {
    if (req.startsWith('FR-')) return match;
    return `- FR-${reqCounter++}: ${req}`;
  });

  fs.writeFileSync(outputPath, enhanced);
  console.log('Preprocessed plan written to', outputPath);
}

// Export for CodeBuddy
module.exports = { preprocessPlan };
```

**Usage**:
```json
{
  "advanced": {
    "preProcessScript": ".codebuddy/scripts/plan-to-openspec-pre.js"
  }
}
```

### Post-processing Scripts

**Script Location**: `.codebuddy/scripts/plan-to-openspec-post.js`

**Purpose**: Transform generated specs after conversion

**Example**:
```javascript
// .codebuddy/scripts/plan-to-openspec-post.js

const fs = require('fs');
const path = require('path');

function postProcessSpecs(changesDir) {
  const changes = fs.readdirSync(changesDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  changes.forEach(change => {
    const specDir = path.join(changesDir, change.name, 'specs');
    const modules = fs.readdirSync(specDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    modules.forEach(module => {
      const specPath = path.join(specDir, module.name, 'spec.md');
      const content = fs.readFileSync(specPath, 'utf8');

      // Add custom sections
      const enhanced = content.replace(
        /## References/,
        '## Code Examples\\n\\n```javascript\\n// Example code\\n```\\n\\n## References'
      );

      fs.writeFileSync(specPath, enhanced);
      console.log('Post-processed', specPath);
    });
  });
}

// Export for CodeBuddy
module.exports = { postProcessSpecs };
```

### Incremental Updates

**Scenario**: Original plan file changes after conversion

**Strategy 1: Re-run Conversion**
```bash
/plan-to-openspec infrastructure-user-center.md --force
```

**Strategy 2: Merge Changes**
```bash
/plan-to-openspec infrastructure-user-center.md --merge-strategy merge
```

**Strategy 3: Selective Update**
```bash
# Update specific change only
/plan-to-openspec infrastructure-user-center.md --change change-002-user-auth
```

### Conflict Resolution

**Git Conflict Markers**:
```markdown
<<<<<<< HEAD
Current spec content
=======
Incoming spec content
>>>>>>> incoming
```

**Resolution Commands**:
```bash
# View conflicts
git diff

# Edit and resolve
# (manual editing)

# Mark resolved
git add <file>

# Continue
git commit
```

### Performance Optimization

**Large Plans** (>10,000 lines):
```bash
# Use batch processing
/plan-to-openspec large-plan.md --batch-size 1000

# Use parallel processing
/plan-to-openspec large-plan.md --parallel 4
```

**Memory Management**:
```bash
# Stream processing (don't load full file)
/plan-to-openspec large-plan.md --stream

# Clean up temp files
/plan-to-openspec large-plan.md --cleanup
```

## Related Commands

### CodeBuddy Commands

- `/plan` - Generate implementation plan from specs
- `/prd-optimize` - Optimize PRD and requirements
- `/tdd` - Test-driven development workflow
- `/e2e` - Generate and run E2E tests
- `/code-review` - Review generated code

### OpenSpec Commands

- `/opsx:propose` - Create OpenSpec change proposal
- `/opsx:apply` - Apply OpenSpec changes
- `/opsx:archive` - Archive completed changes
- `/specify` - Generate specification document
- `/plan` - Generate technical plan
- `/tasks` - Generate task breakdown

## Best Practices

### 1. Start Small

**❌ Bad**: Convert entire project at once
```bash
/plan-to-openspec --all  # 50+ changes, overwhelming
```

**✅ Good**: Convert incrementally
```bash
/plan-to-openspec infrastructure-user-center.md  # 3 changes
# Review, validate, then next plan
```

### 2. Validate Early and Often

```bash
# Always validate after generation
/plan-to-openspec infrastructure-user-center.md --validate

# Review validation report
cat openspec/validation-report.md

# Fix issues, then re-validate
```

### 3. Maintain Traceability

```bash
# Always keep mapping.md files
/plan-to-openspec infrastructure-user-center.md --preserve-mapping

# Review mapping before implementation
cat openspec/changes/change-002-user-auth/mapping.md
```

### 4. Use Dry Run First

```bash
# Preview before generating
/plan-to-openspec infrastructure-user-center.md --dry-run

# Review proposed changes
# Adjust if needed
# Then generate for real
/plan-to-openspec infrastructure-user-center.md
```

### 5. Collaborate via Git

```bash
# Create branch for review
git checkout -b openspec/conversion-auth

# Generate specs
/plan-to-openspec infrastructure-user-center.md

# Commit and push
git add openspec/
git commit -m "chore: convert auth plan to OpenSpec"
git push origin openspec/conversion-auth

# Create PR for review
gh pr create --title "Convert auth plan to OpenSpec" --body "..."
```

### 6. Iterate and Improve

```bash
# First pass: Basic conversion
/plan-to-openspec infrastructure-user-center.md

# Second pass: Optimize specs
/prd-optimize openspec/changes/change-002-user-auth/proposal.md

# Third pass: Enhance with AI
# (manual review and enhancement)

# Fourth pass: Validate
openspec validate
```

## Error Handling and Recovery

### Automated Recovery

```bash
# Auto-fix common issues
/plan-to-openspec infrastructure-user-center.md --auto-fix

# Continue on errors
/plan-to-openspec infrastructure-user-center.md --continue-on-error
```

### Manual Recovery

```bash
# Restore from backup
cp openspec/backup/changes.backup/* openspec/changes/

# Revert specific change
git restore openspec/changes/change-002-user-auth

# Clean and retry
rm -rf openspec/changes/
/plan-to-openspec infrastructure-user-center.md --fresh
```

### Rollback Strategy

```bash
# Create backup before conversion
cp -r openspec openspec.backup.$(date +%s)

# If conversion fails
rm -rf openspec
mv openspec.backup.$(timestamp) openspec

# Or use git
git checkout -- openspec/
```

## Version Control Strategy

### Branch Strategy

```
main
  ↑
  └─ openspec/conversion-auth
      ├─ change-001-project-init
      ├─ change-002-user-auth
      └─ change-003-user-points
```

### Commit Conventions

```bash
# Conversion commits
git commit -m "chore: convert infrastructure plan to OpenSpec"

# Individual change commits
git commit -m "feat: add change-002-user-auth specs"

# Validation commits
git commit -m "fix: resolve validation errors in auth spec"

# Optimization commits
git commit -m "refactor: optimize auth spec after review"
```

### Tagging Releases

```bash
# Tag major conversion milestone
git tag -a v1.0.0-openspec -m "Complete OpenSpec conversion"

# Tag individual change releases
git tag change-002-user-auth-v1.0.0
```

## Continuous Integration

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Validate OpenSpec specs on commit
openspec validate
if [ $? -ne 0 ]; then
  echo "❌ OpenSpec validation failed"
  exit 1
fi

echo "✅ OpenSpec validation passed"
```

### CI Pipeline

```yaml
# .github/workflows/openspec.yml
name: OpenSpec Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @fission-ai/openspec
      - run: openspec validate
      - run: openspec lint
```

## Metrics and Reporting

### Conversion Metrics

```bash
# Generate conversion report
/plan-to-openspec infrastructure-user-center.md --report

# Output example:
{
  "sourceFile": "infrastructure-user-center.md",
  "changesGenerated": 3,
  "specsGenerated": 8,
  "tasksGenerated": 32,
  "filesCreated": 56,
  "validationErrors": 0,
  "warnings": 2,
  "conversionTime": "45s"
}
```

### Quality Metrics

```bash
# Analyze spec quality
openspec analyze

# Output:
- Average scenarios per requirement: 2.5
- Coverage: 95%
- Traceability: 100%
- Gherkin compliance: 100%
```

### Progress Tracking

```bash
# Track conversion progress
/plan-to-openspec --all --track-progress

# Real-time progress:
[1/3] Converting infrastructure-user-center.md...
[2/3] Converting game-template.md...
[3/3] Converting activity-management.md...
✓ Complete
```

## See Also

### Documentation
- [OpenSpec Documentation](https://openspec.dev/docs)
- [SDD Workflow](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/)
- [OpenSpec GitHub Repository](https://github.com/Fission-AI/OpenSpec)
- [Plan to OpenSpec Conversion Scheme](../../brain/e393bc5917084e45ad0811583e06df20/plan-to-openspec-conversion-scheme.md)

### Internal Resources
- `.codebuddy/plan/` - Source plan files
- `.codebuddy/commands/` - Command definitions
- `.codebuddy/agents/` - Agent definitions
- `.codebuddy/skills/` - Skill definitions

### External Tools
- [OpenSpec CLI](https://www.npmjs.com/package/@fission-ai/openspec)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/reference/)
- [Markdown Guide](https://www.markdownguide.org/)

## Support and Community

### Getting Help

```bash
# Help command
/plan-to-openspec --help

# Detailed help
/plan-to-openspec --help-verbose

# Examples
/plan-to-openspec --examples
```

### Reporting Issues

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Run with `--verbose` for details
3. Check OpenSpec GitHub Issues
4. File issue with:
   - Plan file (sanitized)
   - Config file
   - Error message
   - `--verbose` output

### Contributing

To improve this command:

1. Read [CONTRIBUTING.md](../../CONTRIBUTING.md)
2. Follow command format
3. Add tests
4. Update documentation
5. Submit PR

---

**Version**: 1.0.0
**Last Updated**: 2025-03-04
**Author**: CodeBuddy
**License**: MIT
