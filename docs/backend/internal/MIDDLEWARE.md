# Middleware - Internal Structure

תיעוד מפורט על Middleware ב-NestJS, כולל DecoratorAwareMiddleware, RateLimitMiddleware, ו-BulkOperationsMiddleware.

## סקירה כללית

Middleware ב-NestJS פועל לפני Guards ו-Interceptors, ומספק עיבוד בקשות, metadata preparation, ו-optimization.

**מיקום:** `server/src/internal/middleware/`

**קבצים:**
- `decorator-aware.middleware.ts` - Middleware לקריאת decorators והכנת metadata
- `rateLimit.middleware.ts` - Middleware להגבלת קצב בקשות
- `bulkOperations.middleware.ts` - Middleware לאופטימיזציה של פעולות bulk

**סדר ביצוע:**
1. **Middleware** ← כאן
2. Guards
3. Interceptors
4. Pipes
5. Controller Handler

## DecoratorAwareMiddleware

**מיקום:** `server/src/internal/middleware/decorator-aware.middleware.ts`

**תפקיד:**
- קריאת decorator metadata מ-handlers
- הכנת metadata structure ל-Guards, Interceptors, ו-Pipes
- ניתוח חכם של דפוסי בקשה (smart defaults)
- הכנת `req.decoratorMetadata` עם כל המידע הנדרש

### זרימת עבודה

```
1. ניתוח request pattern (smart defaults)
   ↓
2. קריאת decorator metadata מה-handler
   ↓
3. מיזוג smart defaults עם decorator values
   ↓
4. יצירת req.decoratorMetadata
   ↓
5. המשך ל-Guards
```

### Decorator Metadata Structure

```typescript
interface DecoratorMetadata {
  isPublic: boolean;                    // מ-@Public()
  requireAuth: boolean;                 // דרישת אימות
  roles: string[];                      // מ-@Roles()
  permissions: string[];                // הרשאות
  rateLimit: RateLimitConfig | null;    // מ-@RateLimit()
  cache: CacheConfig | null;            // מ-@Cache()
  cacheTags: string[];                  // תגיות מטמון
  apiResponse?: ApiResponseConfig;      // מ-@ApiResponse()
  apiResponses?: ApiResponseConfig[];   // מ-@ApiResponses()
  validationSchema?: string | object;   // סכמת ולידציה
  customValidation?: Function;          // ולידציה מותאמת
}
```

### Smart Defaults

**Public Endpoint Detection:**
```typescript
const publicPatterns = [
  '/health', '/status', '/ping', '/version',
  '/auth/register', '/auth/login', '/auth/refresh',
  '/public', '/docs', '/swagger'
];
const isLikelyPublic = publicPatterns.some(pattern => path.includes(pattern));
```

**Role Detection:**
```typescript
// Path כולל '/admin' → requiredRoles = [UserRole.ADMIN]
// Path כולל '/user' או '/profile' → requiredRoles = [UserRole.USER, UserRole.ADMIN]
```

**Rate Limit Suggestions:**
```typescript
if (path.includes('/auth/login')) {
  suggestedRateLimit = { limit: 5, window: 60 }; // 5 per minute
} else if (path.includes('/auth/register')) {
  suggestedRateLimit = { limit: 3, window: 300 }; // 3 per 5 minutes
} else if (method === 'GET' && !path.includes('/admin')) {
  suggestedRateLimit = { limit: 100, window: 60 }; // 100 per minute
}
```

**Cache Suggestions:**
```typescript
if (method === 'GET' && !path.includes('/auth') && !path.includes('/admin')) {
  suggestedCache = { ttl: CACHE_DURATION.MEDIUM }; // 5 minutes
}
```

### אינטגרציה עם Decorators

**קריאת Decorators:**
```typescript
// decorator-aware.middleware.ts
const isPublic = this.reflector.get<boolean>('isPublic', handler);
const requireAuth = this.reflector.get<boolean>('requireAuth', handler);
const roles = this.reflector.get<string[]>('roles', handler);
const cache = this.reflector.get<{ ttl: number; key?: string }>('cache', handler);
```

**מיזוג עם Smart Defaults:**
```typescript
req.decoratorMetadata = {
  isPublic: decoratorMetadata.isPublic ?? requestAnalysis.isLikelyPublic,
  requireAuth: decoratorMetadata.requireAuth ?? !requestAnalysis.isLikelyPublic,
  roles: decoratorMetadata.roles.length > 0 ? decoratorMetadata.roles : requestAnalysis.requiredRoles,
  // ...
};
```

### לוגים

**Performance Logging:**
```typescript
logger.performance('middleware.decorator-aware', duration, {
  path: req.path,
  method: req.method,
  analysis: JSON.stringify(requestAnalysis),
});
```

## RateLimitMiddleware

**מיקום:** `server/src/internal/middleware/rateLimit.middleware.ts`

**תפקיד:**
- הגבלת קצב בקשות לפי IP ו-endpoint
- תמיכה ב-custom rate limits דרך decorators
- מניעת abuse ו-DDoS

### זרימת עבודה

```
1. חילוץ rate limit config מ-req.decoratorMetadata.rateLimit
   ↓
2. אם אין config → שימוש ב-default rate limit
   ↓
3. יצירת key מ-IP + endpoint
   ↓
4. בדיקת מספר בקשות בפרק זמן
   ↓
5. אם חרג → 429 Too Many Requests
   ↓
6. אם לא → רישום בקשה והמשך
```

### אינטגרציה עם Decorators

**@RateLimit() Decorator:**
```typescript
@Get('sensitive-data')
@RateLimit(10, 60) // 10 requests per minute
async getSensitiveData() {}
```

**שימוש ב-Middleware:**
```typescript
// rateLimit.middleware.ts
const rateLimit = req.decoratorMetadata?.rateLimit ?? defaultRateLimit;
// הגבלת קצב לפי config
```

## BulkOperationsMiddleware

**מיקום:** `server/src/internal/middleware/bulkOperations.middleware.ts`

**תפקיד:**
- זיהוי פעולות bulk (batch operations)
- אופטימיזציה של פעולות batch
- הפחתת קריאות למסד נתונים

### זיהוי Bulk Operations

**מערך ב-body:**
```typescript
if (req.body && Array.isArray(req.body)) {
  return req.body.length > 1; // יותר מ-item אחד = bulk operation
}
```

**Bulk Endpoints:**
```typescript
const bulkEndpoints = [
  '/bulk', '/batch', '/multiple',
  '/batch-update', '/batch-create', '/batch-delete'
];
```

### Bulk Metadata

```typescript
interface BulkMetadata {
  isBulk: boolean;
  batchSize?: number;
  operationType?: 'create' | 'read' | 'update' | 'delete';
  optimization?: 'none' | 'basic' | 'aggressive';
}
```

**הגדרת Metadata:**
```typescript
req.bulkMetadata = {
  isBulk: this.isBulkOperation(req),
  batchSize: this.getBatchSize(req),
  operationType: this.getOperationType(req),
  optimization: this.getOptimizationLevel(req),
};
```

### Optimization Levels

**None:** batch size < 5
**Basic:** batch size 5-19
**Aggressive:** batch size >= 20

### Batch Processing

**Max Batch Size:** 50 operations
**Batch Timeout:** 1000ms (1 second)

**זרימה:**
```
1. זיהוי bulk operation
   ↓
2. הוספה ל-operation queue
   ↓
3. אם queue >= MAX_BATCH_SIZE → process batch מיד
   ↓
4. אם לא → set timer (1 second)
   ↓
5. אחרי timer → process batch
```

### לוגים

**Bulk Operation Detected:**
```typescript
logger.systemInfo('Bulk operation detected', {
  operationKey,
  operationCount: operations.length,
  queueSize: queue.length,
  endpoint: req.path,
  method: req.method,
});
```

**Processing Batch:**
```typescript
logger.systemInfo('Processing bulk operation batch', {
  operationKey,
  batchSize: batch.length,
  remainingInQueue: queue.length,
});
```

## אינטגרציה בין Middleware

### סדר ביצוע

```
1. DecoratorAwareMiddleware
   ↓ (יוצר req.decoratorMetadata)
2. RateLimitMiddleware
   ↓ (משתמש ב-req.decoratorMetadata.rateLimit)
3. BulkOperationsMiddleware
   ↓ (משתמש ב-req.body)
4. Guards
```

### דוגמה מלאה

```typescript
@Controller('admin')
export class AdminController {
  @Get('users')
  @RateLimit(50, 60) // 50 requests per minute
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    // req.decoratorMetadata מכיל:
    // - isPublic: false
    // - requireAuth: true
    // - roles: [UserRole.ADMIN]
    // - rateLimit: { limit: 50, window: 60 }
  }
}
```

**זרימה:**
1. `DecoratorAwareMiddleware` קורא decorators → יוצר `req.decoratorMetadata`
2. `RateLimitMiddleware` משתמש ב-`req.decoratorMetadata.rateLimit` → בודק rate limit
3. `BulkOperationsMiddleware` בודק bulk operations → לא רלוונטי כאן
4. Guards משתמשים ב-`req.decoratorMetadata` → בודקים אימות והרשאות

## Best Practices

### 1. שימוש ב-DecoratorAwareMiddleware לפני כל Middleware אחר

```typescript
// ✅ טוב - DecoratorAwareMiddleware ראשון
app.use(DecoratorAwareMiddleware);
app.use(RateLimitMiddleware);
app.use(BulkOperationsMiddleware);

// ❌ רע - Middleware אחר לפני DecoratorAwareMiddleware
app.use(RateLimitMiddleware); // לא יכול להשתמש ב-decoratorMetadata
app.use(DecoratorAwareMiddleware);
```

### 2. שימוש ב-Smart Defaults כאשר אין Decorator

```typescript
// ✅ טוב - Smart defaults עובדים אוטומטית
@Get('leaderboard')
async getLeaderboard() {
  // req.decoratorMetadata.isPublic = true (מ-smart defaults)
  // req.decoratorMetadata.cache = { ttl: 300 } (מ-smart defaults)
}

// ✅ טוב - Override עם Decorator
@Get('leaderboard')
@Cache(600, 'leaderboard') // Override smart default
async getLeaderboard() {}
```

### 3. Rate Limiting מותאם לסוג Endpoint

```typescript
// ✅ טוב - Rate limit נמוך ל-endpoints רגישים
@Post('auth/login')
@RateLimit(5, 60) // 5 per minute
async login() {}

// ✅ טוב - Rate limit גבוה ל-endpoints ציבוריים
@Get('leaderboard')
@RateLimit(100, 60) // 100 per minute
async getLeaderboard() {}
```

## הפניות

- [Decorators](../common/DECORATORS.md) - איך Decorators משמשים את Middleware
- [Guards](../common/GUARDS.md) - Guards משתמשים ב-decoratorMetadata
- [Interceptors](../common/INTERCEPTORS.md) - Interceptors משתמשים ב-decoratorMetadata
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - סדר ביצוע Middleware
- [Internal Structure](./README.md) - סקירה כללית
