---
description: 分析项目PRD需求，对比现有codebuddy skills，识别并推荐需要补充的skills
---

# PRD Skills Gap Analysis

## When to Use

Use this skill when:

1. **PRD analysis complete**: After analyzing a PRD and identifying technical requirements
2. **Skills inventory needed**: Need to understand what skills are available in `.codebuddy/skills`
3. **Gap analysis required**: Need to identify missing skills for the project
4. **Skill planning**: Want to plan which skills to create or import
5. **Team capability assessment**: Need to assess skill coverage for development team

## How It Works

### Phase 1: Analyze Project Requirements

Extract technical skill requirements from PRD analysis:

**Frontend Requirements**:
- Framework and library skills (React, Vue, Angular, Next.js, etc.)
- UI component library skills (Ant Design, Material-UI, TDesign, shadcn, etc.)
- State management skills (Redux, Zustand, Pinia, etc.)
- Styling skills (CSS-in-JS, Tailwind, Sass, etc.)
- Testing skills (Jest, Testing Library, Playwright, etc.)

**Backend Requirements**:
- Framework skills (Express, NestJS, Fastify, Spring Boot, etc.)
- Database skills (PostgreSQL, MySQL, MongoDB, Prisma, TypeORM, etc.)
- API design skills (REST, GraphQL, gRPC)
- Authentication/Authorization skills (OAuth2, JWT, SAML, etc.)
- Performance optimization skills (caching, CDN, load balancing)

**DevOps Requirements**:
- CI/CD skills (GitHub Actions, GitLab CI, Jenkins)
- Containerization skills (Docker, Kubernetes)
- Deployment skills (Vercel, Netlify, AWS, CloudBase)
- Monitoring/logging skills (Prometheus, Grafana, Sentry)

**Domain-Specific Requirements**:
- E-commerce skills (payment, inventory, order management)
- Social media skills (feeds, comments, real-time updates)
- Analytics skills (data visualization, reporting, dashboards)
- AI/ML skills (LLM integration, RAG, vector databases)

### Phase 2: Inventory Existing Skills

Scan `.codebuddy/skills` directory to catalog available skills:

1. **List all skill files** in `.codebuddy/skills` directory
2. **Read skill descriptions** to understand capabilities
3. **Categorize skills** by:
   - Framework (React, Vue, Spring Boot, Django, etc.)
   - Pattern (coding standards, testing patterns, deployment, etc.)
   - Domain (e-commerce, analytics, AI, etc.)
4. **Tag skills** with technical keywords for matching

### Phase 3: Gap Analysis

Compare project requirements with existing skills:

**Matching Strategy**:
- Exact match: Skill name or description matches requirement exactly
- Partial match: Skill covers part of the requirement
- Related match: Skill is in the same domain and can be adapted
- No match: No relevant skill exists

**Gap Categories**:
1. **Critical Gaps**: Skills required for core features, no alternative exists
2. **Important Gaps**: Skills required for important features, can work around
3. **Nice-to-Have Gaps**: Skills that would improve quality but not essential
4. **Outdated Skills**: Existing skills that need updates

**Gap Scoring**:
```
Score = (Importance × 3) + (Frequency × 2) + (Complexity × 1)

Where:
- Importance: Critical(3) / Important(2) / Nice-to-Have(1)
- Frequency: High(3) / Medium(2) / Low(1)
- Complexity: High(3) / Medium(2) / Low(1)

Score ranges:
- 15+: Critical gap, immediate action
- 10-14: Important gap, prioritize soon
- 5-9: Nice-to-have, consider later
- <5: Low priority
```

### Phase 4: Skill Recommendations

Generate actionable recommendations:

**For Critical Gaps**:
```
## Gap: E-commerce Payment Integration

**Requirement**: Integrate payment gateway (Stripe/Alipay/WeChat Pay)
**Current Coverage**: No matching skills
**Impact**: Cannot complete payment flow
**Recommendation**: Create new skill: `ecommerce-payment-integration`
**Priority**: Critical (Score: 21)

**Suggested Skill Structure**:
- Payment gateway selection and integration
- Order lifecycle management
- Payment flow security best practices
- Error handling and retry logic
- Testing strategies for payment flows
```

**For Important Gaps**:
```
## Gap: Real-time Notifications

**Requirement**: WebSocket real-time message push
**Current Coverage**: Partial (generic web-development skill)
**Impact**: Delayed message delivery
**Recommendation**: Enhance existing `web-development` skill OR create `websocket-patterns`
**Priority**: Important (Score: 12)
```

**For Nice-to-Have Gaps**:
```
## Gap: Advanced Analytics Dashboard

**Requirement**: Custom data visualization with complex charts
**Current Coverage**: Partial (general frontend patterns)
**Impact**: Reduced data insight quality
**Recommendation**: Consider creating `data-visualization-patterns`
**Priority**: Nice-to-Have (Score: 7)
```

### Phase 5: Implementation Roadmap

Create a prioritized implementation plan:

```markdown
## Skills Implementation Roadmap

### Phase 1: Critical Skills (Week 1-2)
- [ ] ecommerce-payment-integration (Score: 21)
- [ ] oauth2-jwt-authentication (Score: 18)
- [ ] websocket-real-time (Score: 16)

### Phase 2: Important Skills (Week 3-4)
- [ ] database-migration-patterns (Score: 14)
- [ ] api-rate-limiting (Score: 13)
- [ ] caching-strategies (Score: 12)

### Phase 3: Nice-to-Have Skills (Week 5+)
- [ ] data-visualization-patterns (Score: 9)
- [ ] performance-monitoring (Score: 7)
- [ ] advanced-testing-strategies (Score: 6)
```

## Output Format

Generate a structured report:

```markdown
# Skills Gap Analysis Report

## Executive Summary

- **Total Requirements**: 25 skills needed
- **Existing Skills**: 18 available
- **Critical Gaps**: 5 missing (Score 15+)
- **Important Gaps**: 2 missing (Score 10-14)
- **Nice-to-Have Gaps**: 3 missing (Score 5-9)
- **Coverage Rate**: 72%

## Detailed Gap Analysis

### Critical Gaps

| Gap | Requirement | Current | Impact | Score |
|-----|-------------|---------|--------|-------|
| Payment Integration | Stripe/Alipay integration | None | Cannot complete payment flow | 21 |
| OAuth2/JWT | Token-based auth | Partial (auth-web) | Security risk | 18 |

### Existing Skills Inventory

| Skill | Description | Category | Coverage |
|-------|-------------|----------|----------|
| react-patterns | React best practices | Frontend | 80% |
| springboot-patterns | Spring Boot patterns | Backend | 85% |

### Recommendations

#### Create New Skills

1. **ecommerce-payment-integration** (Critical)
   - Estimated effort: 2 days
   - Skills needed: Payment API knowledge, security patterns
   - Dependencies: None

2. **websocket-real-time** (Critical)
   - Estimated effort: 1.5 days
   - Skills needed: WebSocket patterns, scaling strategies
   - Dependencies: web-development

#### Enhance Existing Skills

1. **auth-web** → Add OAuth2/JWT patterns
   - Current: Basic web auth
   - Enhancement: Add OAuth2 flow, JWT validation
   - Estimated effort: 1 day

## Implementation Priority

1. **Week 1**: ecommerce-payment-integration, oauth2-jwt-authentication
2. **Week 2**: websocket-real-time, database-migration-patterns
3. **Week 3+**: caching-strategies, data-visualization-patterns

## Next Steps

- [ ] Review and approve recommendations
- [ ] Assign owners to each skill creation
- [ ] Set up skill creation sprints
- [ ] Establish skill review process
- [ ] Plan skill training for team
```

## Examples

### Example 1: E-commerce Project

**Requirements**:
- Product catalog (filtering, search, pagination)
- Shopping cart (add/remove, persistence)
- Checkout (payment integration)
- Order management (status tracking)
- User authentication (login, profile)

**Gap Analysis**:

```
Critical Gaps:
- ecommerce-payment-integration (Score: 21)
  - Requirement: Stripe/Alipay/WeChat Pay
  - Current: None
  - Action: Create new skill

Important Gaps:
- ecommerce-catalog-search (Score: 12)
  - Requirement: Product search with filters
  - Current: Partial (generic search patterns)
  - Action: Enhance existing search patterns

Nice-to-Have Gaps:
- order-tracking-real-time (Score: 8)
  - Requirement: Real-time order status updates
  - Current: Partial (websocket pattern)
  - Action: Leverage websocket skill
```

### Example 2: Social Media App

**Requirements**:
- User authentication and profiles
- Post creation and feeds
- Comments and likes
- Real-time notifications
- Media upload (images, videos)

**Gap Analysis**:

```
Critical Gaps:
- media-upload-patterns (Score: 19)
  - Requirement: Image/video upload, compression, CDN
  - Current: None
  - Action: Create new skill

Important Gaps:
- feed-algorithm (Score: 14)
  - Requirement: Personalized feed ranking
  - Current: None
  - Action: Create new skill OR use third-party API

Nice-to-Have Gaps:
- real-time-collaboration (Score: 7)
  - Requirement: Live comments/updates
  - Current: Partial (websocket skill)
  - Action: Leverage websocket skill
```

## Best Practices

1. **Start with critical gaps**: Focus on skills blocking development
2. **Leverage existing skills**: Don't reinvent, enhance when possible
3. **Consider skill reuse**: Can existing skills be adapted?
4. **Plan skill dependencies**: Some skills depend on others
5. **Establish skill review**: Review gaps quarterly as requirements evolve
6. **Document skill rationale**: Keep track of why skills were created

## Integration with PRD Analysis

This skill should be called after `prd-architecture-analysis`:

```
/prd-analyze workflow:
1. prd-requirements-extraction
2. prd-architecture-analysis ← Get technical stack
3. prd-skills-gap-analysis ← Compare with existing skills
4. prd-risk-analysis
5. prd-ui-ue-analysis
```

The gap analysis output informs:
- Which skills to create during project setup
- Which skills to prioritize for team training
- Potential risks from missing skills
- Resource planning for skill development

## Notes

- Gap analysis is iterative; re-run when PRD changes significantly
- Skills directory may change; always scan current state
- Consider both project-specific and reusable skills
- Balance creating new skills vs. using external solutions
- Maintain skill quality standards (format, documentation, testing)
