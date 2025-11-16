# Interceptors - Common Structure

תיעוד מפורט על Interceptors ב-NestJS, כולל CacheInterceptor, PerformanceMonitoringInterceptor, ו-ResponseFormattingInterceptor.

## סקירה כללית

Interceptors ב-NestJS פועלים לפני ואחרי ביצוע handler, ומאפשרים עיבוד בקשות ותגובות.

**מיקום:** `server/src/common/interceptors/`

**קבצים:**
- `cache.interceptor.ts` - Interceptor למטמון תגובות
- `performance-monitoring.interceptor.ts` - Interceptor למעקב ביצועים
- `response-formatting.interceptor.ts` - Interceptor לעיצוב תגובות אחיד

**סדר ביצוע:**
1. Middleware
2. Guards
3. **Interceptors (לפני handler)** ← כאן
4. Pipes
5. Controller Handler
6. **Interceptors (אחרי handler)** ← כאן
7. Filters (אם יש שגיאה)

## Cache Interceptor

**מיקום:** `server/src/common/interceptors/cache.interceptor.ts`

**תפקיד:**
- מטמון תגובות API על בסיס `@Cache()` decorator
- בדיקת מטמון לפני ביצוע handler
- שמירת תוצאות במטמון אחרי handler
- תמיכה ב-TTL, תגיות, ותנאי שמירה

### זרימת עבודה

**לפני Handler:**
```
1. קריאת cache metadata מ-req.decoratorMetadata.cache
   ↓
2. אם אין metadata או disabled → דילוג על מטמון
   ↓
3. יצירת cache key מ-request או custom key
   ↓
4. בדיקת מטמון ב-CacheService
   ↓
5. אם יש במטמון → החזרת תוצאה ממטמון (דילוג על handler)
   ↓
6. אם אין במטמון → המשך ל-handler
```

**אחרי Handler:**
```
1. קבלת תוצאה מ-handler
   ↓
2. בדיקת cache condition (אם יש)
   ↓
3. בדיקת serializability (אפשרות לשמירה)
   ↓
4. שמירה במטמון עם TTL
   ↓
5. רישום cache tags (אם יש)
```

### דוגמאות שימוש

#### Cache עם TTL

```typescript
@Controller('leaderboard')
export class LeaderboardController {
  @Get('daily')
  @Cache(300, 'leaderboard-daily') // ← Cache ל-5 דקות
  async getDailyLeaderboard() {
    // תוצאה תישמר במטמון ל-5 דקות
  }
}
```

**מה קורה:**
1. `DecoratorAwareMiddleware` קורא `@Cache(300, 'leaderboard-daily')`
2. `CacheInterceptor` בודק מטמון עם key `cache:leaderboard-daily`
3. אם יש במטמון → החזרת תוצאה (דילוג על handler)
4. אם אין → ביצוע handler → שמירה במטמון

#### מניעת Cache

```typescript
@Controller('points')
export class PointsController {
  @Get('balance')
  @NoCache() // ← אין cache
  async getPointBalance(@CurrentUserId() userId: string) {
    // תוצאה לא תישמר במטמון (נתונים בזמן אמת)
  }
}
```

**מה קורה:**
1. `DecoratorAwareMiddleware` קורא `@NoCache()`
2. `CacheInterceptor` בודק `cache.disabled === true`
3. דילוג על מטמון → ביצוע handler תמיד

### Cache Key Generation

**Custom Key:**
```typescript
@Cache(300, 'leaderboard-daily')
// Key: cache:leaderboard-daily
```

**Dynamic Key (מ-request):**
```typescript
@Cache(300)
// Key נוצר מ:
// - HTTP method (GET, POST, וכו')
// - URL path
// - Query parameters
// - Route parameters
// Key: cache:<hash-of-request-components>
```

### Cache Condition

תמיכה בתנאי שמירה במטמון:

```typescript
@Cache({
  ttl: 300,
  condition: (req, res) => {
    // שמירה במטמון רק אם status code הוא 200
    return res.statusCode === 200;
  }
})
```

### Cache Tags

תמיכה בתגיות מטמון (לעתיד - invalidation לפי tags):

```typescript
@Cache({
  ttl: 300,
  key: 'leaderboard',
  tags: ['game', 'leaderboard']
})
```

### אינטגרציה עם Decorators

**@Cache() Decorator:**
```typescript
// cache.interceptor.ts
const cacheMetadata = request.decoratorMetadata?.cache;

if (!cacheMetadata || cacheMetadata.disabled) {
  return next.handle();
}
```

**Cache Service:**
```typescript
// cache.interceptor.ts
const cachedResult = await this.cacheService.get(cacheKey);
if (cachedResult.success && cachedResult.data) {
  return of(cachedResult.data);
}
```

### לוגים

**Cache Hit:**
```typescript
logger.cacheHit(cacheKey, {
  ttl: cacheMetadata.ttl,
  key: cacheMetadata.key,
  tags: cacheMetadata.tags,
  method: request.method,
  url: request.originalUrl,
});
```

**Cache Miss:**
```typescript
logger.cacheMiss(cacheKey, {
  ttl: cacheMetadata.ttl,
  key: cacheMetadata.key,
  tags: cacheMetadata.tags,
  method: request.method,
  url: request.originalUrl,
});
```

**Cache Set:**
```typescript
logger.cacheSet(cacheKey, {
  ttl: cacheMetadata.ttl,
  key: cacheMetadata.key,
  tags: cacheMetadata.tags,
  method: request.method,
  url: request.originalUrl,
});
```

## Performance Monitoring Interceptor

**מיקום:** `server/src/common/interceptors/performance-monitoring.interceptor.ts`

**תפקיד:**
- מדידת זמן תגובה לכל בקשה
- מדידת שימוש בזיכרון
- זיהוי בקשות איטיות
- רישום מטריקות ביצועים

### זרימת עבודה

```
1. יצירת trace ID
   ↓
2. רישום זמן תחילת בקשה
   ↓
3. רישום זיכרון התחלתי
   ↓
4. ביצוע handler
   ↓
5. רישום זמן סיום וזיכרון סופי
   ↓
6. חישוב duration ו-memory delta
   ↓
7. רישום מטריקות ב-metricsService
   ↓
8. אם duration > threshold → התראה
   ↓
9. רישום לוגים
```

### מדידת ביצועים

**Duration (זמן תגובה):**
```typescript
const startTime = Date.now();
// ... handler execution ...
const duration = Date.now() - startTime;
```

**Memory Usage:**
```typescript
const startMemory = process.memoryUsage();
// ... handler execution ...
const endMemory = process.memoryUsage();
const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
```

### זיהוי בקשות איטיות

**Thresholds:**
```typescript
private readonly SLOW_REQUEST_THRESHOLD = PERFORMANCE_THRESHOLDS.SLOW; // למשל: 1000ms
private readonly VERY_SLOW_REQUEST_THRESHOLD = PERFORMANCE_THRESHOLDS.VERY_SLOW; // למשל: 3000ms
```

**Alerting:**
```typescript
if (duration > this.SLOW_REQUEST_THRESHOLD) {
  const severity = duration > this.VERY_SLOW_REQUEST_THRESHOLD ? 'critical' : 'warning';
  logger.performance(`request.${severity}`, duration, {
    endpoint,
    method,
    userId,
    threshold: this.SLOW_REQUEST_THRESHOLD,
    severity,
  });
}
```

### מטריקות

**Endpoint Performance:**
```typescript
metricsService.trackEndpointPerformance(endpoint, {
  method,
  duration,
  memoryDelta,
  userId,
  timestamp: new Date(),
});
```

**Method Performance:**
```typescript
metricsService.trackMethodPerformance(method, {
  endpoint,
  duration,
  memoryDelta,
  userId,
  timestamp: new Date(),
});
```

**Slow Request Tracking:**
```typescript
metricsService.trackSlowRequest(endpoint, {
  method,
  duration,
  userId,
  severity,
  timestamp: new Date(),
});
```

### לוגים

**Request Completed:**
```typescript
logger.performance('request.completed', duration, {
  endpoint,
  method,
  memoryDelta,
  userId,
  userAgent,
  context: 'PerformanceMonitoringInterceptor',
});
```

**Slow Request:**
```typescript
logger.performance('request.warning', duration, {
  endpoint,
  method,
  userId,
  threshold: this.SLOW_REQUEST_THRESHOLD,
  severity: 'warning',
});
```

**Very Slow Request:**
```typescript
logger.performance('request.critical', duration, {
  endpoint,
  method,
  userId,
  threshold: this.VERY_SLOW_REQUEST_THRESHOLD,
  severity: 'critical',
});
```

### Trace ID

ה-Interceptor יוצר trace ID לכל בקשה:

```typescript
const traceId = logger.newTrace();
request.traceId = traceId;
```

**שימוש:**
- מעקב אחרי בקשה דרך כל השכבות
- קישור לוגים מאותה בקשה
- ניפוי באגים וניתוח ביצועים

## Response Formatting Interceptor

**מיקום:** `server/src/common/interceptors/response-formatting.interceptor.ts`

**תפקיד:**
- עיצוב אחיד של תגובות API
- הוספת metadata (timestamp, duration, endpoint)
- תמיכה ב-skip formatting עבור תגובות ספציפיות

### זרימת עבודה

```
1. ביצוע handler
   ↓
2. קבלת תוצאה מ-handler
   ↓
3. בדיקת shouldSkipFormatting()
   ↓
4. אם צריך לדלג → החזרת תוצאה כפי שהיא
   ↓
5. אם לא → עיצוב תגובה אחידה
   ↓
6. החזרת תגובה מעוצבת
```

### פורמט תגובה סטנדרטי

```typescript
{
  success: true,
  data: <handler-result>,
  timestamp: "2025-01-15T10:00:00.000Z",
  meta: {
    duration: 150,        // ms
    endpoint: "/game/trivia",
    method: "POST"
  }
}
```

### Skip Formatting

ה-Interceptor מדלג על עיצוב עבור:

**1. תגובות שכבר מכילות `success` field:**
```typescript
// תגובת אימות
{
  success: true,
  user: { ... },
  token: "..."
}
```

**2. תגובות עם שדות ספציפיים:**
- `isValid` - תגובת ולידציה
- `timestamp` - תגובה עם timestamp מובנה
- `data` - תגובה שכבר מעוצבת
- `pipe` - תגובת pipe
- `url` - תגובת redirect

**3. Static Files:**
```typescript
if (request.path.includes('/static/') || request.path.includes('/assets/')) {
  return true; // skip formatting
}
```

**4. Health Check Endpoints:**
```typescript
if (request.path === '/health' || request.path === '/status') {
  return true; // skip formatting
}
```

### דוגמאות שימוש

#### תגובה מעוצבת אוטומטית

```typescript
@Controller('game')
export class GameController {
  @Get('trivia')
  async getTrivia() {
    return { questions: [...] };
  }
}
```

**תגובה מעוצבת:**
```json
{
  "success": true,
  "data": {
    "questions": [...]
  },
  "timestamp": "2025-01-15T10:00:00.000Z",
  "meta": {
    "duration": 150,
    "endpoint": "/game/trivia",
    "method": "GET"
  }
}
```

#### תגובה ללא עיצוב (skip)

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return {
      success: true, // ← יש success field → skip formatting
      user: { ... },
      token: "..."
    };
  }
}
```

**תגובה כפי שהיא:**
```json
{
  "success": true,
  "user": { ... },
  "token": "..."
}
```

## אינטגרציה בין Interceptors

### סדר ביצוע

**לפני Handler:**
1. `CacheInterceptor` - בדיקת מטמון (אם יש → דילוג על handler)
2. `PerformanceMonitoringInterceptor` - התחלת מדידת זמן
3. `ResponseFormattingInterceptor` - הכנה לעיצוב

**אחרי Handler (סדר הפוך):**
1. `ResponseFormattingInterceptor` - עיצוב תגובה
2. `PerformanceMonitoringInterceptor` - סיום מדידה ורישום
3. `CacheInterceptor` - שמירה במטמון

### דוגמה מלאה

```typescript
@Controller('leaderboard')
export class LeaderboardController {
  @Get('daily')
  @Cache(300, 'leaderboard-daily')
  async getDailyLeaderboard() {
    return { rankings: [...] };
  }
}
```

**זרימה:**
1. `CacheInterceptor` בודק מטמון → אין → המשך
2. `PerformanceMonitoringInterceptor` מתחיל מדידה
3. `ResponseFormattingInterceptor` ממתין לתגובה
4. Handler מבצע לוגיקה
5. `ResponseFormattingInterceptor` מעצב תגובה
6. `PerformanceMonitoringInterceptor` מודד זמן ומתעד
7. `CacheInterceptor` שומר במטמון

## Best Practices

### 1. שימוש ב-Cache עבור נתונים סטטיים

```typescript
// ✅ טוב - נתונים סטטיים
@Get('leaderboard')
@Cache(300, 'leaderboard')
async getLeaderboard() {}

// ❌ רע - נתונים דינמיים
@Get('balance')
@Cache(300) // ← לא הגיוני, balance משתנה תמיד
async getBalance() {}
```

### 2. שימוש ב-@NoCache() עבור נתונים בזמן אמת

```typescript
// ✅ טוב - נתונים בזמן אמת
@Get('balance')
@NoCache()
async getBalance() {}

// ❌ רע - cache על נתונים דינמיים
@Get('balance')
@Cache(300)
async getBalance() {}
```

### 3. TTL מותאם לסוג הנתונים

```typescript
// ✅ טוב - TTL קצר לנתונים משתנים
@Get('leaderboard')
@Cache(60) // ← 1 דקה

// ✅ טוב - TTL ארוך לנתונים סטטיים
@Get('categories')
@Cache(3600) // ← שעה
```

## הפניות

- [Decorators](./DECORATORS.md) - איך Decorators משמשים את Interceptors
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - סדר ביצוע Interceptors
- [Guards](./GUARDS.md) - Guards לפני Interceptors
- [Modules](../internal/MODULES.md) - CacheService ו-MetricsService
- [Common Structure](./README.md) - סקירה כללית
