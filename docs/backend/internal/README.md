# Internal Structure - Backend

תיעוד המבנה הפנימי של השרת (NestJS).

## סקירה כללית

המבנה הפנימי של השרת מאורגן בתיקיית `internal/` ומכיל קוד משותף בין המודולים השונים.

## מבנה Internal

```
server/src/internal/
├── constants/       # קבועים פנימיים
│   ├── auth/        # קבועי אימות
│   ├── database/    # קבועי מסד נתונים
│   └── public-endpoints.constants.ts
├── controllers/     # controllers פנימיים
│   ├── client-logs.controller.ts
│   └── middleware-metrics.controller.ts
├── entities/        # ישויות TypeORM
│   ├── base.entity.ts
│   ├── user.entity.ts
│   ├── trivia.entity.ts
│   ├── gameHistory.entity.ts
│   ├── userStats.entity.ts
│   ├── pointTransaction.entity.ts
│   ├── paymentHistory.entity.ts
│   ├── subscription.entity.ts
│   └── leaderboard.entity.ts
├── middleware/      # middleware
│   ├── decorator-aware.middleware.ts
│   ├── rateLimit.middleware.ts
│   └── bulkOperations.middleware.ts
├── modules/         # מודולים פנימיים
│   ├── cache/       # מודול מטמון
│   ├── storage/     # מודול אחסון
│   └── redis.module.ts
├── types/           # טיפוסים פנימיים
│   └── nest.types.ts
└── utils/           # כלים פנימיים
    ├── error.utils.ts
    ├── guards.utils.ts
    └── redis.utils.ts
```

## תיקיות עיקריות

### Entities
תיעוד מפורט: [ENTITIES.md](./ENTITIES.md)

**ישויות:**
- `BaseEntity` - בסיס משותף (id, createdAt, updatedAt)
- `UserEntity` - ישות משתמש
- `TriviaEntity` - ישות שאלת טריוויה
- `GameHistoryEntity` - ישות היסטוריית משחק
- `UserStatsEntity` - ישות סטטיסטיקות משתמש
- `PointTransactionEntity` - ישות עסקת נקודות
- `PaymentHistoryEntity` - ישות היסטוריית תשלום
- `SubscriptionEntity` - ישות מנוי
- `LeaderboardEntity` - ישות לוח תוצאות

**תכונות:**
- יורשים מ-BaseEntity
- TypeORM decorators (@Entity, @Column, @Index, וכו')
- קשרים (ManyToOne, וכו')
- JSONB למטא-דאטה דינמית

### Middleware
תיעוד מפורט: [MIDDLEWARE.md](./MIDDLEWARE.md)

**Middleware:**
- `DecoratorAwareMiddleware` - קריאת decorators והכנת metadata
- `RateLimitMiddleware` - הגבלת קצב בקשות
- `BulkOperationsMiddleware` - אופטימיזציה של פעולות bulk

**תפקידים:**
- **DecoratorAwareMiddleware:** קריאת decorators, smart defaults, הכנת `req.decoratorMetadata`
- **RateLimitMiddleware:** הגבלת קצב, burst protection, תמיכה ב-`@RateLimit()`
- **BulkOperationsMiddleware:** זיהוי bulk operations, batch processing

### Modules
תיעוד מפורט: [MODULES.md](./MODULES.md)

**Modules:**
- `CacheModule` - מטמון עם Redis ו-in-memory fallback
- `StorageModule` - אחסון מתמיד עם Redis
- `RedisModule` - חיבור Redis גלובלי

**תפקידים:**
- **CacheModule:** מטמון זמני (TTL), Redis fallback
- **StorageModule:** אחסון מתמיד (sessions, preferences), Redis required
- **RedisModule:** חיבור Redis גלובלי (@Global())

### Controllers
תיעוד מפורט: [CONTROLLERS.md](./CONTROLLERS.md)

**Controllers:**
- `ClientLogsController` - Controller ללוגים מצד הלקוח
- `MiddlewareMetricsController` - Controller למטריקות middleware

**Endpoints:**
- `POST /client-logs/batch` - קבלת batch של לוגים מהלקוח
- `GET /admin/middleware-metrics` - קבלת מטריקות middleware (ADMIN only)
- `GET /admin/middleware-metrics/:middlewareName` - מטריקות ל-middleware ספציפי (ADMIN only)
- `DELETE /admin/middleware-metrics/:middlewareName` - איפוס מטריקות (ADMIN only)
- `DELETE /admin/middleware-metrics` - איפוס כל המטריקות (ADMIN only)

### Constants
תיעוד מפורט: [CONSTANTS.md](./CONSTANTS.md)

**Constants:**
- `AUTH_CONSTANTS` - קבועי אימות (JWT settings, token expiration)
- `REDIS_CONSTANTS` - קבועי Redis (connection, key prefixes, TTL)
- `PUBLIC_ENDPOINTS` - רשימת endpoints ציבוריים

**תפקידים:**
- **AUTH_CONSTANTS:** JWT secret, expiration, token type, auth header
- **REDIS_CONSTANTS:** Connection settings, key prefixes, TTL values
- **PUBLIC_ENDPOINTS:** רשימת endpoints שלא דורשים אימות

### Utils
תיעוד מפורט: [UTILS.md](./UTILS.md)

**Utils:**
- `error.utils.ts` - כלי עזר לטיפול בשגיאות
- `guards.utils.ts` - כלי עזר ל-guards
- `redis.utils.ts` - כלי עזר ל-Redis

**פונקציות:**
- **Error Utils:** `createValidationError()`, `createNotFoundError()`, `createServerError()`, וכו'
- **Guards Utils:** `isPublicEndpoint()` - בדיקה אם endpoint ציבורי
- **Redis Utils:** `scanKeys()`, `deleteKeysByPattern()` - SCAN ו-DELETE operations

### Types
תיעוד מפורט: [TYPES.md](./TYPES.md)

**Types:**
- `NestRequest` - Extension של Express Request
- `DecoratorMetadata` - Metadata מ-decorators
- `BulkMetadata` - Metadata ל-bulk operations
- `RateLimitConfig` - הגדרת rate limiting
- `CacheConfig` - הגדרת cache
- `ApiResponseConfig` - הגדרת תגובה
- `UserPayload` - User payload מ-JWT

**תפקידים:**
- **NestRequest:** Extension של Request עם שדות מותאמים (user, decoratorMetadata, וכו')
- **DecoratorMetadata:** Metadata מ-decorators (isPublic, roles, cache, וכו')
- **BulkMetadata:** Metadata ל-bulk operations (isBulk, batchSize, וכו')

## אינטגרציה

### Middleware → Decorators
- `DecoratorAwareMiddleware` קורא decorators → יוצר `req.decoratorMetadata`
- `Guards` ו-`Interceptors` משתמשים ב-`req.decoratorMetadata`

### Modules → Redis
- `CacheModule` ו-`StorageModule` תלויים ב-`RedisModule`
- `RedisModule` הוא `@Global()` - זמין בכל המודולים

### Controllers → Services
- `ClientLogsController` משתמש ב-`serverLogger`
- `MiddlewareMetricsController` משתמש ב-`MetricsService`

### Utils → Constants
- `guards.utils.ts` משתמש ב-`PUBLIC_ENDPOINTS`
- `redis.utils.ts` משתמש ב-Redis client

## Best Practices

### 1. Entities
- יורשים מ-BaseEntity
- שימוש ב-indexes על שדות שמושאלים לעיתים קרובות
- JSONB למטא-דאטה דינמית

### 2. Middleware
- `DecoratorAwareMiddleware` ראשון (יוצר metadata)
- `RateLimitMiddleware` משתמש ב-`req.decoratorMetadata.rateLimit`
- `BulkOperationsMiddleware` מזהה bulk operations

### 3. Modules
- `CacheModule` למטמון זמני
- `StorageModule` לאחסון מתמיד
- `RedisModule` גלובלי

### 4. Controllers
- Admin only endpoints עם `@Roles(UserRole.ADMIN)`
- Batch processing ללוגים
- שימוש ב-serverLogger לרישום

## קישורים רלוונטיים

### תיעוד מפורט
- [Entities](./ENTITIES.md) - Entities מפורטים
- [Middleware](./MIDDLEWARE.md) - Middleware מפורטים
- [Modules](./MODULES.md) - Modules מפורטים
- [Controllers](./CONTROLLERS.md) - Controllers מפורטים
- [Constants](./CONSTANTS.md) - Constants מפורטים
- [Utils](./UTILS.md) - Utils מפורטים
- [Types](./TYPES.md) - Types מפורטים

### תיעוד מבני
- [Common Structure](../common/README.md) - מבנה משותף
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - זרימת בקשות
- [Features](../features/AUTH.md) - מודולי Features (AUTH, GAME, USER, PAYMENT, SUBSCRIPTION, POINTS, LEADERBOARD, ANALYTICS)

### דיאגרמות
- [DIAGRAMS.md](../../DIAGRAMS.md) - דיאגרמות ארכיטקטורה
  - [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)
  - [דיאגרמת Middleware Stack](../../DIAGRAMS.md#דיאגרמת-middleware-stack)
  - [דיאגרמת מסד נתונים (ERD)](../../DIAGRAMS.md#דיאגרמת-מסד-נתונים-erd) - כולל Entities
