---
name: coding-standards
description: Universal coding standards, best practices, and patterns for TypeScript, JavaScript, React, and Node.js development.
---

# Coding Standards & Best Practices

Universal coding standards applicable across all projects.

## When to Activate

- Starting a new project or module
- Reviewing code for quality and maintainability
- Refactoring existing code to follow conventions
- Enforcing naming, formatting, or structural consistency
- Setting up linting, formatting, or type-checking rules
- Onboarding new contributors to coding conventions

## Code Quality Principles

### 1. Readability First
- Code is read more than written
- Clear variable and function names
- Self-documenting code preferred over comments
- Consistent formatting

### 2. KISS (Keep It Simple, Stupid)
- Simplest solution that works
- Avoid over-engineering
- No premature optimization
- Easy to understand > clever code

### 3. DRY (Don't Repeat Yourself)
- Extract common logic into functions
- Create reusable components
- Share utilities across modules
- Avoid copy-paste programming

### 4. YAGNI (You Aren't Gonna Need It)
- Don't build features before they're needed
- Avoid speculative generality
- Add complexity only when required
- Start simple, refactor when needed

## TypeScript/JavaScript Standards

### Variable Naming

```typescript
// ‚ú?GOOD: Descriptive names
const marketSearchQuery = 'election'
const isUserAuthenticated = true
const totalRevenue = 1000

// ‚ù?BAD: Unclear names
const q = 'election'
const flag = true
const x = 1000
```

### Function Naming

```typescript
// ‚ú?GOOD: Verb-noun pattern
async function fetchMarketData(marketId: string) { }
function calculateSimilarity(a: number[], b: number[]) { }
function isValidEmail(email: string): boolean { }

// ‚ù?BAD: Unclear or noun-only
async function market(id: string) { }
function similarity(a, b) { }
function email(e) { }
```

### Immutability Pattern (CRITICAL)

```typescript
// ‚ú?ALWAYS use spread operator
const updatedUser = {
  ...user,
  name: 'New Name'
}

const updatedArray = [...items, newItem]

// ‚ù?NEVER mutate directly
user.name = 'New Name'  // BAD
items.push(newItem)     // BAD
```

### Error Handling

```typescript
// ‚ú?GOOD: Comprehensive error handling
async function fetchData(url: string) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw new Error('Failed to fetch data')
  }
}

// ‚ù?BAD: No error handling
async function fetchData(url) {
  const response = await fetch(url)
  return response.json()
}
```

### Async/Await Best Practices

```typescript
// ‚ú?GOOD: Parallel execution when possible
const [users, markets, stats] = await Promise.all([
  fetchUsers(),
  fetchMarkets(),
  fetchStats()
])

// ‚ù?BAD: Sequential when unnecessary
const users = await fetchUsers()
const markets = await fetchMarkets()
const stats = await fetchStats()
```

### Type Safety

```typescript
// ‚ú?GOOD: Proper types
interface Market {
  id: string
  name: string
  status: 'active' | 'resolved' | 'closed'
  created_at: Date
}

function getMarket(id: string): Promise<Market> {
  // Implementation
}

// ‚ù?BAD: Using 'any'
function getMarket(id: any): Promise<any> {
  // Implementation
}
```

## React Best Practices

### Component Structure

```typescript
// ‚ú?GOOD: Functional component with types
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}

// ‚ù?BAD: No types, unclear structure
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### Custom Hooks

```typescript
// ‚ú?GOOD: Reusable custom hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage
const debouncedQuery = useDebounce(searchQuery, 500)
```

### State Management

```typescript
// ‚ú?GOOD: Proper state updates
const [count, setCount] = useState(0)

// Functional update for state based on previous state
setCount(prev => prev + 1)

// ‚ù?BAD: Direct state reference
setCount(count + 1)  // Can be stale in async scenarios
```

### Conditional Rendering

```typescript
// ‚ú?GOOD: Clear conditional rendering
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// ‚ù?BAD: Ternary hell
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

## API Design Standards

### REST API Conventions

```
GET    /api/markets              # List all markets
GET    /api/markets/:id          # Get specific market
POST   /api/markets              # Create new market
PUT    /api/markets/:id          # Update market (full)
PATCH  /api/markets/:id          # Update market (partial)
DELETE /api/markets/:id          # Delete market

# Query parameters for filtering
GET /api/markets?status=active&limit=10&offset=0
```

### Response Format

```typescript
// ‚ú?GOOD: Consistent response structure
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// Success response
return NextResponse.json({
  success: true,
  data: markets,
  meta: { total: 100, page: 1, limit: 10 }
})

// Error response
return NextResponse.json({
  success: false,
  error: 'Invalid request'
}, { status: 400 })
```

### Input Validation

```typescript
import { z } from 'zod'

// ‚ú?GOOD: Schema validation
const CreateMarketSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  endDate: z.string().datetime(),
  categories: z.array(z.string()).min(1)
})

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const validated = CreateMarketSchema.parse(body)
    // Proceed with validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
  }
}
```

## File Organization

### Project Structure

```
src/
‚îú‚îÄ‚îÄ app/                    # Next.js App Router
‚î?  ‚îú‚îÄ‚îÄ api/               # API routes
‚î?  ‚îú‚îÄ‚îÄ markets/           # Market pages
‚î?  ‚îî‚îÄ‚îÄ (auth)/           # Auth pages (route groups)
‚îú‚îÄ‚îÄ components/            # React components
‚î?  ‚îú‚îÄ‚îÄ ui/               # Generic UI components
‚î?  ‚îú‚îÄ‚îÄ forms/            # Form components
‚î?  ‚îî‚îÄ‚îÄ layouts/          # Layout components
‚îú‚îÄ‚îÄ hooks/                # Custom React hooks
‚îú‚îÄ‚îÄ lib/                  # Utilities and configs
‚î?  ‚îú‚îÄ‚îÄ api/             # API clients
‚î?  ‚îú‚îÄ‚îÄ utils/           # Helper functions
‚î?  ‚îî‚îÄ‚îÄ constants/       # Constants
‚îú‚îÄ‚îÄ types/                # TypeScript types
‚îî‚îÄ‚îÄ styles/              # Global styles
```

### File Naming

```
components/Button.tsx          # PascalCase for components
hooks/useAuth.ts              # camelCase with 'use' prefix
lib/formatDate.ts             # camelCase for utilities
types/market.types.ts         # camelCase with .types suffix
```

## Comments & Documentation

### When to Comment

```typescript
// ‚ú?GOOD: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API during outages
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

// Deliberately using mutation here for performance with large arrays
items.push(newItem)

// ‚ù?BAD: Stating the obvious
// Increment counter by 1
count++

// Set name to user's name
name = user.name
```

### JSDoc for Public APIs

```typescript
/**
 * Searches markets using semantic similarity.
 *
 * @param query - Natural language search query
 * @param limit - Maximum number of results (default: 10)
 * @returns Array of markets sorted by similarity score
 * @throws {Error} If OpenAI API fails or Redis unavailable
 *
 * @example
 * ```typescript
 * const results = await searchMarkets('election', 5)
 * console.log(results[0].name) // "Trump vs Biden"
 * ```
 */
export async function searchMarkets(
  query: string,
  limit: number = 10
): Promise<Market[]> {
  // Implementation
}
```

## Performance Best Practices

### Memoization

```typescript
import { useMemo, useCallback } from 'react'

// ‚ú?GOOD: Memoize expensive computations
const sortedMarkets = useMemo(() => {
  return markets.sort((a, b) => b.volume - a.volume)
}, [markets])

// ‚ú?GOOD: Memoize callbacks
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react'

// ‚ú?GOOD: Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### Database Queries

```typescript
// ‚ú?GOOD: Select only needed columns
const { data } = await supabase
  .from('markets')
  .select('id, name, status')
  .limit(10)

// ‚ù?BAD: Select everything
const { data } = await supabase
  .from('markets')
  .select('*')
```

## Testing Standards

### Test Structure (AAA Pattern)

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

### Test Naming

```typescript
// ‚ú?GOOD: Descriptive test names
test('returns empty array when no markets match query', () => { })
test('throws error when OpenAI API key is missing', () => { })
test('falls back to substring search when Redis unavailable', () => { })

// ‚ù?BAD: Vague test names
test('works', () => { })
test('test search', () => { })
```

## Code Smell Detection

Watch for these anti-patterns:

### 1. Long Functions
```typescript
// ‚ù?BAD: Function > 50 lines
function processMarketData() {
  // 100 lines of code
}

// ‚ú?GOOD: Split into smaller functions
function processMarketData() {
  const validated = validateData()
  const transformed = transformData(validated)
  return saveData(transformed)
}
```

### 2. Deep Nesting
```typescript
// ‚ù?BAD: 5+ levels of nesting
if (user) {
  if (user.isAdmin) {
    if (market) {
      if (market.isActive) {
        if (hasPermission) {
          // Do something
        }
      }
    }
  }
}

// ‚ú?GOOD: Early returns
if (!user) return
if (!user.isAdmin) return
if (!market) return
if (!market.isActive) return
if (!hasPermission) return

// Do something
```

### 3. Magic Numbers
```typescript
// ‚ù?BAD: Unexplained numbers
if (retryCount > 3) { }
setTimeout(callback, 500)

// ‚ú?GOOD: Named constants
const MAX_RETRIES = 3
const DEBOUNCE_DELAY_MS = 500

if (retryCount > MAX_RETRIES) { }
setTimeout(callback, DEBOUNCE_DELAY_MS)
```

**Remember**: Code quality is not negotiable. Clear, maintainable code enables rapid development and confident refactoring.
