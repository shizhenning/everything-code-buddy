# OpenSpec 工件生成时机与策略分析

> 深入分析 proposal、specs、design、tasks、tests、risks、rollback 等工件的生成时机

---

## 问题核心

### 用户疑问

> "转换成 openspec 后，openspec 需要的工件比如设计，测试案例等应在什么时机生成"

### 关键问题

1. **哪些工件需要在 multi-plan 阶段生成？**
2. **哪些工件需要在 multi-execute 阶段生成？**
3. **哪些工件需要人工介入？**
4. **哪些工件可以自动生成？**
5. **工件之间的依赖关系是什么？**

---

## OpenSpec 工件体系

### 标准工件列表（spec-driven schema）

```
spec-driven 工作流的工件顺序:

1. proposal.md        ✅ 必需
   ↓ 依赖
2. specs/             ✅ 必需
   └── <capability>/spec.md
   ↓ 依赖
3. design.md          ✅ 必需
   ↓ 依赖
4. tasks.md           ✅ 必需

可选工件（推荐）:
5. tests.md           ⚠️ 推荐
6. risks.md           ⚠️ 推荐
7. rollback.md        ⚠️ 推荐
```

### 各工件的作用

| 工件 | 作用 | 生成难度 | 自动化程度 | 优先级 |
|------|------|---------|-----------|--------|
| **proposal.md** | 变更提案、目标、范围 | 低 | 高 ⭐⭐⭐⭐⭐ | P0 |
| **specs.md** | 需求、验收标准 | 中 | 中 ⭐⭐⭐ | P0 |
| **design.md** | 架构、技术决策 | 高 | 中 ⭐⭐⭐ | P0 |
| **tasks.md** | 实施任务、checkbox | 中 | 高 ⭐⭐⭐⭐ | P0 |
| **tests.md** | 测试计划、用例 | 中 | 中 ⭐⭐⭐ | P1 |
| **risks.md** | 风险分析、缓解措施 | 低 | 高 ⭐⭐⭐⭐ | P1 |
| **rollback.md** | 回滚计划 | 低 | 高 ⭐⭐⭐⭐ | P1 |

---

## 工件生成时机分析

### 方案 A: 全自动生成（激进）

```
multi-plan 阶段:
  一次性生成所有工件
    ├─ proposal.md ✅
    ├─ specs.md ✅
    ├─ design.md ✅
    ├─ tasks.md ✅
    ├─ tests.md ✅
    ├─ risks.md ✅
    └─ rollback.md ✅
  ↓
直接进入 multi-execute
```

**优点**:
- ✅ 一次性完成，无中断
- ✅ 用户体验流畅

**缺点**:
- ❌ 缺少人工审查环节
- ❌ design.md 可能质量不高
- ❌ 无法迭代优化

**适用场景**: 小型、简单的变更

---

### 方案 B: 分阶段生成（推荐）

```
multi-plan 阶段:
  生成必需工件
    ├─ proposal.md ✅ (从 plan 提取)
    ├─ specs.md ✅ (从 plan 提取)
    ├─ design.md ✅ (从 plan 提取，可能需要细化)
    └─ tasks.md ✅ (从 plan 提取 + 细化)
  ↓
[人工审查]
  ↓
multi-execute 阶段:
  生成/更新可选工件
    ├─ tests.md ✅ (基于 tasks.md 生成)
    ├─ risks.md ✅ (基于 tasks.md 生成)
    └─ rollback.md ✅ (基于 tasks.md 生成)
```

**优点**:
- ✅ 必需工件提前生成，可审查
- ✅ 可选工件在执行时生成，更准确
- ✅ 平衡自动化和人工审查

**缺点**:
- ⚠️ 需要人工介入点

**适用场景**: 中等复杂度的变更

---

### 方案 C: 迭代生成（保守）

```
Step 1: multi-plan 生成基础工件
    ├─ proposal.md ✅
    ├─ specs.md ✅
    └─ draft-tasks.md ✅ (草稿)

Step 2: 人工审查和细化
    ↓ 人工介入
    ├─ 审查 proposal.md
    ├─ 审查 specs.md
    ├─ 创建/细化 design.md ⚠️ 人工主导
    └─ 细化 tasks.md

Step 3: multi-execute 前准备
    ↓
    ├─ tests.md ✅ (基于细化的 tasks.md)
    ├─ risks.md ✅
    └─ rollback.md ✅

Step 4: 执行
    ↓
    multi-execute 执行 tasks.md
```

**优点**:
- ✅ 人工控制质量
- ✅ 迭代优化
- ✅ 适应复杂场景

**缺点**:
- ❌ 流程较长
- ❌ 需要多次人工介入

**适用场景**: 大型、复杂的变更

---

## 各工件的详细生成策略

### 1. proposal.md

#### 生成时机
**multi-plan 阶段立即生成**

#### 数据来源
```markdown
从 multi-plan 输出提取:

- Goal → proposal.md Goal
- Background → proposal.md Background
- Scope (in-scope/out-of-scope) → proposal.md Scope
- Success Criteria → proposal.md Success Criteria
- Dependencies → proposal.md Dependencies
```

#### 自动化程度
**高 (⭐⭐⭐⭐⭐)**

#### 模板

```markdown
# Proposal: <Change Name>

## Goal
<从 plan 的 Goal 提取>

## Background
<从 plan 的 Background 提取>

## Scope

### In Scope
<从 plan 提取>

### Out of Scope
<从 plan 提取或生成默认值>

## Success Criteria
<从 plan 的 Success Criteria 提取>

## Dependencies
<从 plan 的 Dependencies 提取>

## Risks & Mitigations
<从 plan 的 Risks 提取>
```

#### 示例

```markdown
# Proposal: User Authentication

## Goal
Enable users to register and login with email and password authentication.

## Background
The application currently has no authentication system. Users can access all features without login, which limits personalization and security.

## Scope

### In Scope
- User registration with email and password
- User login with session management
- Password hashing and security
- Email validation

### Out of Scope
- OAuth/SSO integration (future phase)
- Two-factor authentication (future phase)
- Social login (future phase)

## Success Criteria
- Users can register with email and password
- Users can login with valid credentials
- Invalid login attempts are rejected
- Passwords are securely hashed
- Email addresses are validated

## Dependencies
- Database setup completed
- Email service configured (for future verification)

## Risks & Mitigations
- Risk: Password storage security → Mitigation: Use bcrypt hashing
- Risk: Email validation bypass → Mitigation: Implement proper validation
```

---

### 2. specs.md

#### 生成时机
**multi-plan 阶段立即生成**

#### 数据来源
```markdown
从 multi-plan 输出提取:

- Requirements → specs.md Requirements
- Acceptance Criteria → specs.md Acceptance Criteria
- Non-functional Requirements → specs.md Non-Functional Requirements
```

#### 自动化程度
**中 (⭐⭐⭐)**

#### 模板

```markdown
# Specification: <Feature Name>

## Requirements

### Functional Requirements

#### REQ-1: <Requirement Name>
<description>

**Acceptance Criteria**:
- [ ] <criteria-1>
- [ ] <criteria-2>

**Priority**: P0 | P1 | P2

... (更多需求)

### Non-Functional Requirements

#### Performance
- <performance-requirement>

#### Security
- <security-requirement>

#### Scalability
- <scalability-requirement>

## Data Models
<从 design.md 提取或生成草稿>

## API Contracts
<从 design.md 提取或生成草稿>
```

#### 示例

```markdown
# Specification: User Authentication System

## Requirements

### Functional Requirements

#### REQ-1: User Registration
Users should be able to register with email and password.

**Acceptance Criteria**:
- [ ] User can submit registration form with email and password
- [ ] Email is validated for format and domain
- [ ] Password is validated for minimum 8 characters
- [ ] User account is created in database
- [ ] Duplicate email is rejected with clear error message
- [ ] Password is hashed before storage

**Priority**: P0

#### REQ-2: User Login
Users should be able to login with email and password.

**Acceptance Criteria**:
- [ ] User can submit login form with email and password
- [ ] Invalid credentials are rejected
- [ ] Successful login creates session
- [ ] Session token is returned to client
- [ ] Failed attempts are tracked

**Priority**: P0

#### REQ-3: Password Security
Passwords must be securely stored and never logged.

**Acceptance Criteria**:
- [ ] Password is hashed using bcrypt
- [ ] Password is never logged or printed
- [ ] Hash uses minimum 12 rounds
- [ ] Plaintext password is never exposed in errors

**Priority**: P0

### Non-Functional Requirements

#### Performance
- Registration API should respond within 500ms
- Login API should respond within 300ms

#### Security
- All API endpoints use HTTPS
- Password hashing uses bcrypt
- Session tokens are cryptographically secure

#### Scalability
- System should support 10,000 concurrent users
- Database queries are optimized with indexes
```

---

### 3. design.md

#### 生成时机
**multi-plan 阶段生成，推荐人工审查**

#### 数据来源
```markdown
从 multi-plan 输出提取:

- Architecture → design.md Architecture
- Technical Decisions → design.md Technical Decisions
- Patterns → design.md Patterns
- Data Models → design.md Data Models
- API Design → design.md API Design
```

#### 自动化程度
**中 (⭐⭐⭐)** - 需要 agent 分析

#### 模板

```markdown
# Design: <Feature Name>

## Architecture Overview
<架构图和描述>

## Key Components
<组件列表和说明>

## Data Models

### <Entity 1>
<字段定义>
- <field-1>: <type> <constraints>
- <field-2>: <type> <constraints>

## API Design

### Endpoints

#### <Method> <path>
**Description**: <description>

**Request**:
```json
{
  "<field>": "<type>"
}
```

**Response**:
```json
{
  "<field>": "<type>"
}
```

**Error Responses**:
- 400: <description>
- 401: <description>

## Technical Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| <decision> | <why> | <alternatives> |

## Patterns & Best Practices
<使用的模式和最佳实践>

## Security Considerations
<安全考虑>

## Performance Considerations
<性能考虑>
```

#### 示例

```markdown
# Design: User Authentication System

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│  API Layer  │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Auth      │
                    │  Service    │
                    └─────────────┘
```

## Key Components

1. **AuthenticationService** - Handles login, registration, session management
2. **UserService** - Manages user data and persistence
3. **PasswordService** - Handles password hashing and validation
4. **ValidationService** - Validates input data
5. **SessionService** - Manages user sessions and tokens

## Data Models

### User Entity

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 100, nullable: true })
  firstName: string | null;

  @Column({ length: 100, nullable: true })
  lastName: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## API Design

### Endpoints

#### POST /api/auth/register
**Description**: Register a new user account

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- 400: Invalid input (validation errors)
- 409: Email already exists

#### POST /api/auth/login
**Description**: Login with email and password

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- 400: Invalid input
- 401: Invalid credentials

## Technical Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|-------------------------|
| Use bcrypt for password hashing | Industry standard, proven security | Argon2 (more secure but slower), Scrypt |
| Use TypeORM | Integrates well with existing codebase | Prisma (more modern), Sequelize |
| JWT for session tokens | Stateless, scalable | Session storage (requires database) |
| 12 rounds for bcrypt | Good balance of security and performance | 10 rounds (faster), 14 rounds (more secure) |

## Patterns & Best Practices

1. **Service Layer Pattern**: Business logic in service layer, controllers handle routing
2. **Dependency Injection**: Services are injected, not instantiated directly
3. **Repository Pattern**: Data access abstracted through repositories
4. **Validation Decorators**: Use class-validator decorators for input validation
5. **Error Handling**: Centralized error handling with proper HTTP status codes

## Security Considerations

- Passwords are hashed with bcrypt (12 rounds)
- Passwords are never logged or exposed in errors
- Session tokens use JWT with expiration
- Rate limiting on auth endpoints
- HTTPS required for all auth endpoints
- SQL injection prevented through parameterized queries

## Performance Considerations

- Unique index on email field
- Index on createdAt for user queries
- Connection pooling for database
- Caching for frequent user lookups
- Async/await for all I/O operations
```

---

### 4. tasks.md

#### 生成时机
**multi-plan 阶段生成，使用细粒度转换**

#### 数据来源
```markdown
从 multi-plan 输出提取 + 细化:

- Implementation Steps → tasks.md (转换为 checkbox 格式)
- 使用 task-refiner 细化粗粒度步骤
```

#### 自动化程度
**高 (⭐⭐⭐⭐)** - 需要细粒度转换

#### 模板（参见之前的细粒度转换文档）

---

### 5. tests.md

#### 生成时机
**multi-execute 阶段，基于 tasks.md 生成**

#### 数据来源
```markdown
从 tasks.md 和 specs.md 生成:

- Tasks → Test cases for each task
- Specs → Acceptance criteria → Test scenarios
```

#### 自动化程度
**中高 (⭐⭐⭐⭐)**

#### 模板

```markdown
# Test Plan: <Feature Name>

## Test Strategy

- Unit Tests: <description>
- Integration Tests: <description>
- E2E Tests: <description>

## Test Coverage Goals

- Minimum coverage: <percentage>%
- Critical paths: 100%

## Test Cases

### Unit Tests

#### TC-1: <Test Case Name>
**Description**: <description>

**Preconditions**:
- <condition-1>
- <condition-2>

**Steps**:
1. <step-1>
2. <step-2>

**Expected Result**: <expected-result>

**Coverage**: <task-id>

### Integration Tests

#### TC-10: <Test Case Name>
**Description**: <description>

**Preconditions**:
- <condition-1>

**Steps**:
1. <step-1>

**Expected Result**: <expected-result>

**Coverage**: <requirement-id>

### E2E Tests

#### TC-20: <Test Case Name>
**Description**: <description>

**User Journey**: <journey>

**Steps**:
1. <step-1>

**Expected Result**: <expected-result>

**Coverage**: <user-story>

## Test Data

### Test Users
- <test-user-1>
- <test-user-2>

### Test Scenarios
- <scenario-1>
- <scenario-2>

## Test Execution

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- --testPathPattern=unit

# Run integration tests only
npm test -- --testPathPattern=integration
```
```

#### 示例

```markdown
# Test Plan: User Authentication System

## Test Strategy

- Unit Tests: Test individual functions and services
- Integration Tests: Test API endpoints with database
- E2E Tests: Test complete user flows from frontend

## Test Coverage Goals

- Minimum coverage: 80%
- Critical paths (auth, session): 100%

## Test Cases

### Unit Tests

#### TC-1: Password Hashing
**Description**: Verify password is hashed correctly

**Preconditions**:
- PasswordService is initialized

**Steps**:
1. Call `hashPassword('password123')`

**Expected Result**: 
- Returns a hash string
- Hash is different from plaintext
- Hash can be verified

**Coverage**: T3 (Add Password Service)

#### TC-2: Email Validation
**Description**: Verify email validation logic

**Preconditions**:
- ValidationService is initialized

**Steps**:
1. Call `validateEmail('user@example.com')`
2. Call `validateEmail('invalid-email')`

**Expected Result**: 
- Valid email returns true
- Invalid email returns false

**Coverage**: T4 (Add Email Validation)

### Integration Tests

#### TC-10: User Registration Success
**Description**: Verify successful user registration

**Preconditions**:
- Database is clean
- API server is running

**Steps**:
1. POST /api/auth/register with valid data
2. Verify response status 201
3. Verify user in database
4. Verify password is hashed

**Expected Result**: 
- Registration succeeds
- User is created
- Password is hashed

**Coverage**: REQ-1

#### TC-11: Duplicate Email Rejection
**Description**: Verify duplicate email is rejected

**Preconditions**:
- User with email exists
- API server is running

**Steps**:
1. POST /api/auth/register with duplicate email
2. Verify response status 409
3. Verify error message

**Expected Result**: 
- Registration fails
- Error message is clear

**Coverage**: REQ-1

### E2E Tests

#### TC-20: Complete Registration Flow
**Description**: Verify user can register from frontend

**User Journey**: User lands on registration page → fills form → submits → sees success

**Steps**:
1. Open registration page
2. Fill in email, password, name
3. Click register button
4. Verify redirect to dashboard
5. Verify user is logged in

**Expected Result**: 
- Registration completes successfully
- User is redirected to dashboard
- User is authenticated

**Coverage**: User Story

## Test Data

### Test Users
- test-user-1@example.com / TestPass123
- test-user-2@example.com / TestPass456

### Test Scenarios
- Valid registration with all fields
- Registration with missing fields
- Registration with invalid email
- Registration with weak password

## Test Execution

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- --testPathPattern=unit

# Run integration tests only
npm test -- --testPathPattern=integration

# Run E2E tests only
npm test -- --testPathPattern=e2e

# Run with coverage
npm test -- --coverage
```
```

---

### 6. risks.md

#### 生成时机
**multi-execute 阶段，基于 tasks.md 和 design.md 生成**

#### 数据来源
```markdown
从 tasks.md 和 design.md 分析生成:

- Complex tasks → Risk identification
- Technical decisions → Risk analysis
```

#### 自动化程度
**高 (⭐⭐⭐⭐)**

#### 模板

```markdown
# Risk Analysis: <Feature Name>

## Risk Categories

### Technical Risks
<technical-related risks>

### Security Risks
<security-related risks>

### Performance Risks
<performance-related risks>

### Operational Risks
<operational-related risks>

## Identified Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|-----------|--------|-----------|-------|
| R-1 | <risk> | Low/Medium/High | Low/Medium/High | <mitigation> | <owner> |

## Risk Response Plans

### <Risk ID>: <Risk Name>
**Description**: <detailed description>

**Likelihood**: <Low/Medium/High>
**Impact**: <Low/Medium/High>

**Mitigation Strategy**:
- <mitigation-1>
- <mitigation-2>

**Contingency Plan**:
- <contingency-1>
- <contingency-2>

**Owner**: <responsible person/team>
**Due Date**: <date>

## Risk Monitoring
<How to monitor risks>

## Risk Review Schedule
<When to review risks>
```

#### 示例

```markdown
# Risk Analysis: User Authentication System

## Risk Categories

### Technical Risks
- Database migration issues
- Authentication service failures
- Token generation errors

### Security Risks
- Password storage vulnerabilities
- Session hijacking
- Brute force attacks

### Performance Risks
- Slow password hashing
- Database query performance
- Session token size

### Operational Risks
- User account recovery
- Email service outages
- Rate limiting effectiveness

## Identified Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|-----------|--------|-----------|-------|
| R-1 | Password hash too weak | Low | High | Use bcrypt with 12 rounds | Backend Team |
| R-2 | Session token exposure | Medium | High | Use JWT with expiration | Backend Team |
| R-3 | Brute force attacks | Medium | Medium | Rate limiting on auth endpoints | Backend Team |
| R-4 | Email validation bypass | Low | Medium | Use regex + domain validation | Backend Team |
| R-5 | Database migration failure | Low | High | Test migrations in staging | DevOps |

## Risk Response Plans

### R-1: Password Hash Too Weak
**Description**: If bcrypt rounds are too low, passwords may be vulnerable to brute force

**Likelihood**: Low
**Impact**: High

**Mitigation Strategy**:
- Use bcrypt with minimum 12 rounds
- Periodically review hash strength
- Plan for algorithm upgrade

**Contingency Plan**:
- If vulnerability discovered, force password reset
- Increase rounds immediately
- Notify users of security update

**Owner**: Backend Team
**Due Date**: Before launch

### R-2: Session Token Exposure
**Description**: JWT tokens may be intercepted or exposed in logs

**Likelihood**: Medium
**Impact**: High

**Mitigation Strategy**:
- Use HTTPS only
- Set secure cookie flags
- Implement token expiration
- Never log tokens

**Contingency Plan**:
- If tokens exposed, invalidate all sessions
- Force user re-login
- Review security logs

**Owner**: Backend Team
**Due Date**: Before launch

### R-3: Brute Force Attacks
**Description**: Attackers may attempt to guess passwords

**Likelihood**: Medium
**Impact**: Medium

**Mitigation Strategy**:
- Implement rate limiting (5 attempts/hour)
- Add delay after failed attempts
- Lock accounts after repeated failures

**Contingency Plan**:
- If attack detected, increase rate limiting
- Temporarily block suspicious IPs
- Notify security team

**Owner**: Backend Team
**Due Date**: Before launch

## Risk Monitoring

- Monitor authentication failure rates
- Track brute force attempts
- Review security logs weekly
- Stay updated on security advisories

## Risk Review Schedule

- **Initial Review**: Before development starts
- **Progress Review**: Weekly during development
- **Pre-Launch Review**: Before production deployment
- **Post-Launch Review**: 1 month after launch
- **Quarterly Review**: Ongoing security assessment
```

---

### 7. rollback.md

#### 生成时机
**multi-execute 阶段，基于 tasks.md 和 design.md 生成**

#### 数据来源
```markdown
从 tasks.md 和 design.md 分析生成:

- Database changes → Rollback migrations
- API changes → Rollback endpoints
- Configuration changes → Rollback configs
```

#### 自动化程度
**高 (⭐⭐⭐⭐)**

#### 模板

```markdown
# Rollback Plan: <Feature Name>

## Rollback Strategy
<Overall rollback strategy>

## Rollback Triggers
<Conditions that trigger rollback>

## Rollback Procedures

### Database Rollback

#### Migration Rollback
```bash
# Rollback migration
npm run migration:rollback <migration-name>
```

**Verification**:
```sql
-- Verify rollback
SELECT * FROM information_schema.tables WHERE table_name = '<table>';
```

### API Rollback

#### Endpoint Changes
<API endpoint rollback procedures>

### Configuration Rollback

#### Environment Variables
<Configuration rollback procedures>

## Rollback Verification

### Checklist
- [ ] Database rolled back
- [ ] API endpoints removed/updated
- [ ] Configuration reverted
- [ ] Cache cleared
- [ ] Services restarted

## Rollback Time Estimate
<Estimated time to rollback>

## Rollback Communication Plan
<How to communicate rollback>

## Rollback Post-Mortem
<What to do after rollback>
```

#### 示例

```markdown
# Rollback Plan: User Authentication System

## Rollback Strategy

**Strategy**: Complete rollback removes all authentication features and reverts to previous state

**Backup Requirements**:
- Database backup taken before deployment
- Code branch tagged with version
- Configuration files backed up

## Rollback Triggers

Rollback should be triggered if:
- Critical security vulnerability discovered
- Database corruption or data loss
- Performance degradation (> 50% slower)
- User complaints exceed threshold (100 per hour)
- Authentication success rate < 80%

## Rollback Procedures

### Database Rollback

#### Migration Rollback
```bash
# Rollback to previous migration
npm run migration:rollback
```

**Expected Changes**:
- Drop `users` table
- Drop related indexes
- Remove constraints

**Verification**:
```sql
-- Verify users table is removed
SELECT count(*) 
FROM information_schema.tables 
WHERE table_name = 'users';

-- Expected: 0 rows (table removed)
```

#### Data Cleanup (if table still exists)
```sql
-- Delete all user data (use with caution)
DELETE FROM users WHERE 1=1;
```

### API Rollback

#### Endpoint Changes
```bash
# Revert API changes
git checkout <previous-tag>

# Remove authentication middleware
# Remove auth routes from router
```

**Changes to Rollback**:
- Remove `/api/auth/register` endpoint
- Remove `/api/auth/login` endpoint
- Remove authentication middleware
- Remove session management

**Verification**:
```bash
# Verify endpoints are removed
curl -X POST http://localhost:3000/api/auth/register

# Expected: 404 Not Found
```

### Configuration Rollback

#### Environment Variables
```bash
# Restore previous environment variables
git checkout <previous-tag> .env

# Clear authentication-related configs
unset JWT_SECRET
unset SESSION_SECRET
```

#### Configuration Files
```bash
# Remove auth configs
rm -f config/auth.config.ts
rm -f config/jwt.config.ts
```

## Rollback Verification

### Checklist
- [ ] Database: `users` table removed
- [ ] Database: Indexes removed
- [ ] API: `/api/auth/register` returns 404
- [ ] API: `/api/auth/login` returns 404
- [ ] API: Authentication middleware removed
- [ ] Config: Auth configs removed
- [ ] Cache: Redis cache cleared (if applicable)
- [ ] Services: Backend server restarted
- [ ] Services: Frontend server restarted

**Command to verify all**:
```bash
npm run verify:rollback
```

## Rollback Time Estimate

| Component | Time |
|-----------|------|
| Database rollback | 5 min |
| API rollback | 3 min |
| Configuration rollback | 2 min |
| Service restart | 2 min |
| Verification | 5 min |
| **Total** | **17 min** |

## Rollback Communication Plan

### Internal Team Notification
- **When**: Immediately after rollback decision
- **Who**: Engineering team, Product team
- **Channel**: Slack #engineering
- **Template**:
  ```
  🚨 Rollback Initiated: User Authentication
  
  Reason: <reason>
  Estimated completion: <time>
  Lead: <name>
  ```

### User Communication
- **When**: After rollback is complete
- **Who**: Affected users
- **Channel**: In-app notification, email
- **Template**:
  ```
  We temporarily rolled back the authentication feature.
  We're working on improvements and will notify you when it's back.
  Sorry for the inconvenience.
  ```

### External Communication (if necessary)
- **When**: If public issue
- **Who**: Customers, stakeholders
- **Channel**: Status page, email
- **Template**:
  ```
  We experienced an issue with the authentication system
  and have temporarily disabled it. We're working on a fix.
  ```

## Rollback Post-Mortem

### Immediate Actions
- Schedule post-mortem meeting within 24 hours
- Document root cause
- Identify preventive measures

### Post-Mortem Meeting Agenda
1. Timeline of events
2. Root cause analysis
3. What went well
4. What didn't go well
5. Action items and owners
6. Timeline for fixes

### Follow-up Actions
- Create Jira tickets for improvements
- Update risk analysis
- Review deployment process
- Consider implementing feature flags

### Learning Capture
- Document lessons learned
- Update runbooks
- Share with team
```

---

## 推荐的工件生成时机方案

### 方案: 智能分阶段生成 ⭐⭐⭐⭐⭐

#### 阶段 1: multi-plan（必需工件）

```markdown
/multi-plan "实现用户认证功能" --openspec
```

**自动生成**:
- ✅ proposal.md (从 Goal, Background, Scope 提取)
- ✅ specs.md (从 Requirements, Acceptance Criteria 提取)
- ✅ design.md (从 Architecture, Technical Decisions 提取)
- ✅ tasks.md (从 Implementation Steps 提取 + 细化)

**触发条件**: 用户选择 OpenSpec 格式

**质量保证**:
- 自动验证工件完整性
- 检查任务粒度（必要时调用 task-refiner）
- 验证依赖关系正确性

#### 阶段 2: 人工审查（可选但推荐）

```
审查要点:
□ proposal.md - 目标和范围是否清晰？
□ specs.md - 需求是否完整？
□ design.md - 技术方案是否合理？
□ tasks.md - 任务是否足够细粒度？
```

**用户操作**:
```bash
# 查看生成的工件
/opsx:continue <change-name>

# 或直接审查特定工件
code openspec/changes/<change-name>/proposal.md
code openspec/changes/<change-name>/design.md
code openspec/changes/<change-name>/tasks.md
```

#### 阶段 3: multi-execute（可选工件）

```markdown
/execute --openspec <change-name>
```

**执行前自动生成**:
- ✅ tests.md (基于 tasks.md 和 specs.md 生成)
- ✅ risks.md (基于 tasks.md 和 design.md 分析)
- ✅ rollback.md (基于 tasks.md 和 design.md 生成)

**时机**:
- 在 multi-execute 启动时（Phase 0.5）
- 读取已生成的必需工件
- 基于这些工件生成可选工件

#### 阶段 4: 执行中更新

**动态更新**:
- 如果修改了 tasks.md，自动更新 tests.md
- 如果修改了 design.md，自动更新 risks.md

---

## 完整流程图

```
用户需求
  ↓
┌─────────────────────────────────────┐
│  multi-plan                         │
│                                     │
│  自动生成:                           │
│  ✅ proposal.md                     │
│  ✅ specs.md                        │
│  ✅ design.md                       │
│  ✅ tasks.md (细粒度)               │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  质量检查                            │
│                                     │
│  检查:                               │
│  □ 工件完整性                        │
│  □ 任务粒度                          │
│  □ 依赖关系                          │
│                                     │
│  不合格? → task-refiner 细化         │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  人工审查（可选）                    │
│                                     │
│  用户审查:                           │
│  □ proposal.md                      │
│  □ specs.md                         │
│  □ design.md                        │
│  □ tasks.md                         │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│  multi-execute (OpenSpec 模式)      │
│                                     │
│  执行前自动生成:                     │
│  ✅ tests.md                        │
│  ✅ risks.md                        │
│  ✅ rollback.md                     │
└─────────────────────────────────────┘
  ↓
执行 tasks.md
  ↓
完成
  ↓
归档
```

---

## 总结

### 工件生成时机总结表

| 工件 | 生成阶段 | 生成方式 | 人工介入 | 自动化程度 |
|------|---------|---------|---------|-----------|
| **proposal.md** | multi-plan | 提取 | 可选 | ⭐⭐⭐⭐⭐ |
| **specs.md** | multi-plan | 提取 | 可选 | ⭐⭐⭐ |
| **design.md** | multi-plan | 生成 + 提取 | 推荐 | ⭐⭐⭐ |
| **tasks.md** | multi-plan | 提取 + 细化 | 推荐 | ⭐⭐⭐⭐ |
| **tests.md** | multi-execute | 基于 tasks 生成 | 可选 | ⭐⭐⭐⭐ |
| **risks.md** | multi-execute | 分析生成 | 可选 | ⭐⭐⭐⭐ |
| **rollback.md** | multi-execute | 分析生成 | 可选 | ⭐⭐⭐⭐ |

### 核心原则

1. **必需工件提前生成**: proposal, specs, design, tasks 在 multi-plan 阶段生成
2. **可选工件按需生成**: tests, risks, rollback 在 multi-execute 阶段生成
3. **依赖关系严格遵循**: 按照 spec-driven 顺序生成
4. **质量保证贯穿始终**: 每个阶段都有质量检查
5. **人工介入灵活可选**: 提供审查点，但不强制

### 推荐方案

**智能分阶段生成**:
- Phase 1 (multi-plan): 生成必需工件
- Phase 2 (审查): 可选人工审查
- Phase 3 (multi-execute): 生成可选工件
- Phase 4 (执行): 动态更新

**优势**:
- ✅ 平衡自动化和质量
- ✅ 灵活的审查机制
- ✅ 高效的执行流程
- ✅ 完整的可追溯性

需要我详细说明某个工件的生成策略吗？
