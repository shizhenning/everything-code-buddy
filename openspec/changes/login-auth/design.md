# Design: Login Authentication

## Architecture Overview

### High-Level Components

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│   Database      │
│  (React/Vue)    │     │  (Express/Node) │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
   ┌─────────┐            ┌─────────────┐        ┌─────────────┐
   │ Social  │            │   Auth      │        │   Users     │
   │ Providers            │ Middleware  │        │   Table     │
   │ (OAuth) │            │             │        │             │
   └─────────┘            └─────────────┘        └─────────────┘
```

### Technology Stack

- **Frontend**: React (or Vue) with Axios
- **Backend**: Express.js with JWT
- **Database**: PostgreSQL (or use project's existing DB)
- **Security**: bcrypt, helmet, rate-limit
- **Social Auth**: passport.js with OAuth 2.0 strategies

## Data Model

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  provider VARCHAR(50), -- 'local', 'google', 'github'
  provider_id VARCHAR(255), -- OAuth provider user ID
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider, provider_id);
```

### Sessions (if using refresh tokens)

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login with email/password | Public |
| POST | `/api/auth/logout` | Logout user | Required |
| POST | `/api/auth/refresh` | Refresh access token | Public (with refresh token) |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password with token | Public |
| GET | `/api/auth/google` | Initiate Google OAuth | Public |
| GET | `/api/auth/google/callback` | Google OAuth callback | Public |
| GET | `/api/auth/github` | Initiate GitHub OAuth | Public |
| GET | `/api/auth/github/callback` | GitHub OAuth callback | Public |

### User Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user profile | Required |
| PUT | `/api/users/me` | Update current user profile | Required |
| DELETE | `/api/users/me` | Delete current user account | Required |
| PUT | `/api/users/me/password` | Change password | Required |

## Authentication Flow

### 1. Email/Password Login

```
User
  │
  ├─ POST /api/auth/login { email, password }
  │
  ▼
Backend
  │
  ├─ Validate input
  ├─ Find user by email
  ├─ Compare password hash
  ├─ Generate JWT access token (15min)
  ├─ Generate refresh token (7 days)
  ├─ Store refresh token in DB
  │
  ▼
Response
  │
  └─ { accessToken, refreshToken } stored in httpOnly cookies
```

### 2. Social Login (Google/GitHub)

```
User
  │
  ├─ GET /api/auth/google
  │
  ▼
Backend
  │
  ├─ Redirect to Google OAuth
  │
  ▼
Google
  │
  ├─ User authorizes
  ├─ Redirect to /api/auth/google/callback
  │
  ▼
Backend
  │
  ├─ Exchange code for tokens
  ├─ Get user profile from Google
  ├─ Find or create user in DB
  ├─ Generate JWT tokens
  │
  ▼
Response
  │
  └─ { accessToken, refreshToken }
```

### 3. Token Refresh

```
Frontend
  │
  ├─ POST /api/auth/refresh (with refreshToken cookie)
  │
  ▼
Backend
  │
  ├─ Validate refresh token
  ├─ Check if exists in DB
  ├─ Verify not expired
  ├─ Generate new access token
  ├─ Optional: Rotate refresh token
  │
  ▼
Response
  │
  └─ { accessToken } (new refresh token in cookie if rotated)
```

## Security Considerations

### 1. Password Security
- Hash passwords with bcrypt (10-12 rounds)
- Minimum 8 characters length
- Require: uppercase, lowercase, number, special character
- Never store plain text passwords

### 2. Token Security
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Store in httpOnly, secure, sameSite cookies
- Sign tokens with strong secret (256-bit)
- Include user ID and role in JWT payload

### 3. API Security
- Rate limiting: 5 login attempts per 15 minutes per IP
- Input validation on all endpoints
- Sanitize all user inputs
- Use HTTPS in production
- CSRF protection for state-changing requests
- Helmet.js for HTTP headers

### 4. OAuth Security
- Use state parameter to prevent CSRF
- Validate redirect URIs
- Store OAuth tokens securely (if needed for future API calls)

## Frontend Components

### Authentication Pages
- `/login` - Login form
- `/register` - Registration form
- `/forgot-password` - Forgot password form
- `/reset-password/:token` - Reset password form

### Protected Components
- `AuthProvider` - Context provider for auth state
- `useAuth` - Hook for auth operations
- `PrivateRoute` - Route protection wrapper
- `AuthNavbar` - Navbar with login/logout buttons

## Error Handling

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Invalid input | Request validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 409 | Conflict | Email already registered |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

## Testing Strategy

### Unit Tests
- Password hashing/validation
- JWT token generation/validation
- User model CRUD operations
- Input validation functions

### Integration Tests
- Login flow (success and failure)
- Registration flow
- Password reset flow
- Social OAuth callbacks
- Token refresh flow

### E2E Tests
- Complete registration → login → logout flow
- Social login flow
- Password reset via email
- Protected route access

## Deployment Notes

### Environment Variables
```
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=another-secret-key
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Email (for password reset)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@example.com
FRONTEND_URL=http://localhost:3000
```

### Migration Steps
1. Create database tables
2. Seed admin user if needed
3. Configure OAuth apps in provider consoles
4. Set environment variables
5. Deploy backend with new endpoints
6. Deploy frontend with auth components
