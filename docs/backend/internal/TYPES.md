# Types - Internal Structure

תיעוד מפורט על כל ה-Internal Types ב-NestJS, כולל NestRequest, DecoratorMetadata, ו-BulkMetadata.

## סקירה כללית

Types ב-NestJS מספקים טיפוסים ספציפיים ל-NestJS ולבקשות.

**מיקום:** `server/src/internal/types/`

**Types:**
- `nest.types.ts` - טיפוסים ספציפיים ל-NestJS

## NestRequest

**מיקום:** `server/src/internal/types/nest.types.ts`

**תפקיד:**
- Extension של Express Request
- הוספת שדות מותאמים אישית

### אינטרפייס

```typescript
export interface NestRequest extends Request {
  authToken?: string;              // JWT token
  userRole?: UserRole;             // User role
  user?: UserPayload;              // User payload מ-JWT
  decoratorMetadata?: DecoratorMetadata; // Metadata מ-decorators
  bulkMetadata?: BulkMetadata;     // Metadata ל-bulk operations
  timestamp?: Date;                // Timestamp של הבקשה
  requestId?: string;              // Request ID
  traceId?: string;                // Trace ID (מ-PerformanceMonitoringInterceptor)
}
```

### שדות

**authToken:** JWT token (מ-`Authorization: Bearer <token>`)

**userRole:** תפקיד משתמש (מ-JWT payload)

**user:** User payload מ-JWT (מ-AuthGuard)

**decoratorMetadata:** Metadata מ-decorators (מ-DecoratorAwareMiddleware)

**bulkMetadata:** Metadata ל-bulk operations (מ-BulkOperationsMiddleware)

**timestamp:** Timestamp של הבקשה

**requestId:** Request ID (למעקב)

**traceId:** Trace ID (מ-PerformanceMonitoringInterceptor)

### שימוש

```typescript
import { NestRequest } from '@internal/types';

@Controller('users')
export class UserController {
  @Get('profile')
  async getProfile(@Req() req: NestRequest) {
    const userId = req.user?.sub;           // User ID מ-JWT
    const userRole = req.userRole;          // User role
    const isPublic = req.decoratorMetadata?.isPublic; // מ-@Public()
    const traceId = req.traceId;            // Trace ID
  }
}
```

## DecoratorMetadata

**מיקום:** `server/src/internal/types/nest.types.ts`

**תפקיד:**
- Metadata מ-decorators
- הכנה על ידי DecoratorAwareMiddleware

### אינטרפייס

```typescript
export interface DecoratorMetadata {
  isPublic: boolean;                         // מ-@Public()
  requireAuth: boolean;                      // דרישת אימות
  roles: string[];                           // מ-@Roles()
  permissions: string[];                     // הרשאות
  rateLimit: RateLimitConfig | null;         // מ-@RateLimit()
  cache: CacheConfig | null;                 // מ-@Cache()
  cacheTags: string[];                       // תגיות מטמון
  apiResponse?: ApiResponseConfig;           // מ-@ApiResponse()
  apiResponses?: ApiResponseConfig[];        // מ-@ApiResponses()
  validationSchema?: string | object;        // סכמת ולידציה
  customValidation?: (value: unknown) => boolean; // ולידציה מותאמת
}
```

### שדות

**isPublic:** האם endpoint ציבורי (מ-`@Public()`)

**requireAuth:** דרישת אימות

**roles:** תפקידים נדרשים (מ-`@Roles()`)

**permissions:** הרשאות

**rateLimit:** הגדרת rate limiting (מ-`@RateLimit()`)

**cache:** הגדרת cache (מ-`@Cache()`)

**cacheTags:** תגיות מטמון

**apiResponse:** הגדרת תגובה (מ-`@ApiResponse()`)

**apiResponses:** הגדרות תגובות (מ-`@ApiResponses()`)

**validationSchema:** סכמת ולידציה

**customValidation:** ולידציה מותאמת

### שימוש

```typescript
// decorator-aware.middleware.ts
req.decoratorMetadata = {
  isPublic: decoratorMetadata.isPublic ?? requestAnalysis.isLikelyPublic,
  requireAuth: decoratorMetadata.requireAuth ?? !requestAnalysis.isLikelyPublic,
  roles: decoratorMetadata.roles.length > 0 ? decoratorMetadata.roles : requestAnalysis.requiredRoles,
  rateLimit: decoratorMetadata.rateLimit ?? requestAnalysis.suggestedRateLimit,
  cache: decoratorMetadata.cache ?? requestAnalysis.suggestedCache,
  // ...
};

// auth.guard.ts
const isPublic = req.decoratorMetadata?.isPublic;
if (isPublic) {
  return true; // דילוג על אימות
}

// cache.interceptor.ts
const cacheMetadata = req.decoratorMetadata?.cache;
if (cacheMetadata) {
  // שימוש ב-cache metadata
}
```

## BulkMetadata

**מיקום:** `server/src/internal/types/nest.types.ts`

**תפקיד:**
- Metadata ל-bulk operations
- הכנה על ידי BulkOperationsMiddleware

### אינטרפייס

```typescript
export interface BulkMetadata {
  isBulk: boolean;                           // האם bulk operation
  batchSize?: number;                        // גודל batch
  operationType?: string;                    // סוג פעולה ('create', 'read', 'update', 'delete')
  optimization?: 'none' | 'basic' | 'aggressive'; // רמת אופטימיזציה
}
```

### שדות

**isBulk:** האם bulk operation

**batchSize:** גודל batch

**operationType:** סוג פעולה ('create', 'read', 'update', 'delete')

**optimization:** רמת אופטימיזציה ('none', 'basic', 'aggressive')

### שימוש

```typescript
// bulk-operations.middleware.ts
req.bulkMetadata = {
  isBulk: this.isBulkOperation(req),
  batchSize: this.getBatchSize(req),
  operationType: this.getOperationType(req),
  optimization: this.getOptimizationLevel(req),
};

// service
if (req.bulkMetadata?.isBulk) {
  // אופטימיזציה ל-bulk operations
  const batchSize = req.bulkMetadata.batchSize || 10;
  // ...
}
```

## RateLimitConfig

**מיקום:** `server/src/internal/types/nest.types.ts`

**תפקיד:** הגדרת rate limiting.

### אינטרפייס

```typescript
export interface RateLimitConfig {
  limit: number;         // מספר בקשות
  window: number;        // פרק זמן (שניות)
}
```

### שימוש

```typescript
@Get('sensitive-data')
@RateLimit({ limit: 10, window: 60 }) // 10 בקשות לדקה
async getSensitiveData() {}
```

## CacheConfig

**מיקום:** `server/src/internal/types/nest.types.ts`

**תפקיד:** הגדרת cache.

### אינטרפייס

```typescript
export interface CacheConfig {
  ttl: number;                              // Time To Live (שניות)
  key?: string;                             // מפתח מותאם
  tags?: string[];                          // תגיות מטמון
  disabled?: boolean;                       // האם cache מושבת
  condition?: (request: NestRequest, response: Response) => boolean; // תנאי שמירה
}
```

### שימוש

```typescript
@Get('leaderboard')
@Cache({ ttl: 300, key: 'leaderboard', tags: ['game'] })
async getLeaderboard() {}
```

## ApiResponseConfig

**מיקום:** `server/src/internal/types/nest.types.ts`

**תפקיד:** הגדרת תגובה.

### אינטרפייס

```typescript
export interface ApiResponseConfig {
  status: number;          // Status code
  description?: string;    // תיאור תגובה
}
```

### שימוש

```typescript
@ApiResponse({ status: 200, description: 'Success' })
@Get('data')
async getData() {}
```

## UserPayload

**מיקום:** `server/src/internal/types/nest.types.ts`

**תפקיד:** User payload מ-JWT.

### אינטרפייס

```typescript
export interface UserPayload {
  sub: string;             // User ID (standard JWT claim)
  username: string;        // Username
  email: string;           // Email
  role: UserRole;          // User role
  iat: number;             // Issued at (timestamp)
  exp: number;             // Expiration (timestamp)
}
```

### שימוש

```typescript
// auth.guard.ts
const payload = await jwtService.verifyAsync(token, {
  secret: AUTH_CONSTANTS.JWT_SECRET,
});

request.user = payload; // UserPayload

// controller
@Get('profile')
async getProfile(@CurrentUser() user: UserPayload) {
  const userId = user.sub;
  const username = user.username;
  const role = user.role;
}
```

## Best Practices

### 1. שימוש ב-NestRequest

```typescript
// ✅ טוב - שימוש ב-NestRequest
@Get('profile')
async getProfile(@Req() req: NestRequest) {
  const userId = req.user?.sub;
}

// ❌ רע - שימוש ב-Request גנרי
@Get('profile')
async getProfile(@Req() req: Request) {
  const userId = (req as any).user?.sub; // לא בטוח
}
```

### 2. בדיקת decoratorMetadata

```typescript
// ✅ טוב - בדיקת decoratorMetadata
const isPublic = req.decoratorMetadata?.isPublic;
if (isPublic) {
  return true;
}

// ❌ רע - שימוש בלי בדיקה
const isPublic = req.decoratorMetadata.isPublic; // עלול להיות undefined
```

### 3. שימוש ב-bulkMetadata

```typescript
// ✅ טוב - שימוש ב-bulkMetadata
if (req.bulkMetadata?.isBulk) {
  // אופטימיזציה ל-bulk operations
}

// ❌ רע - בדיקה ידנית
if (req.body && Array.isArray(req.body) && req.body.length > 1) {
  // כפילות
}
```

## הפניות

- [Middleware](./MIDDLEWARE.md) - Middleware יוצרים metadata
- [Guards](../common/GUARDS.md) - Guards משתמשים ב-metadata
- [Interceptors](../common/INTERCEPTORS.md) - Interceptors משתמשים ב-metadata
- [Internal Structure](./README.md) - סקירה כללית
