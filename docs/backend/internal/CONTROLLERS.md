# Controllers - Internal Structure

תיעוד מפורט על כל ה-Internal Controllers ב-NestJS, כולל ClientLogsController ו-MiddlewareMetricsController.

## סקירה כללית

Controllers ב-NestJS מטפלים בבקשות HTTP ומחזירים תגובות.

**מיקום:** `server/src/internal/controllers/`

**Controllers:**
- `client-logs.controller.ts` - Controller ללוגים מצד הלקוח
- `middleware-metrics.controller.ts` - Controller למטריקות middleware

## ClientLogsController

**מיקום:** `server/src/internal/controllers/client-logs.controller.ts`

**תפקיד:**
- קבלת לוגים מצד הלקוח
- עיבוד batch של לוגים
- מיפוי רמות לוג ל-LogLevel enum
- שימוש ב-serverLogger לרישום

### Endpoints

#### POST /client-logs/batch

**תפקיד:** קבלת batch של לוגים מהלקוח.

**Request Body:**
```typescript
interface ClientLogsRequest {
  logs: Array<{
    level: string;        // 'error', 'warn', 'info', 'debug'
    message: string;
    meta?: {
      userId?: string;
      sessionId?: string;
      timestamp?: Date;
    };
  }>;
  userId?: string;        // User ID גלובלי
  sessionId?: string;     // Session ID גלובלי
}
```

**Response:**
```typescript
{
  processed: number;      // מספר לוגים שעובדו
}
```

**תהליך:**
1. קבלת batch של לוגים
2. עיבוד כל לוג:
   - חילוץ userId (מ-request או meta)
   - חילוץ sessionId (מ-request או meta)
   - מיפוי רמת לוג ל-LogLevel enum
   - רישום ל-serverLogger עם MESSAGE_FORMATTERS
3. החזרת מספר לוגים שעובדו

**דוגמאות שימוש:**

```typescript
// שליחת batch לוגים
const response = await fetch('/client-logs/batch', {
  method: 'POST',
  body: JSON.stringify({
    logs: [
      {
        level: 'error',
        message: 'Failed to load data',
        meta: {
          userId: 'user-123',
          sessionId: 'session-456',
        },
      },
      {
        level: 'info',
        message: 'User logged in',
      },
    ],
    userId: 'user-123',
    sessionId: 'session-456',
  }),
});

// Response: { processed: 2 }
```

### מיפוי רמות לוג

**Client Log Levels → LogLevel Enum:**
- `'error'` → `LogLevel.ERROR`
- `'warn'` / `'warning'` → `LogLevel.WARN`
- `'info'` → `LogLevel.INFO`
- `'debug'` → `LogLevel.DEBUG`
- אחר → `LogLevel.INFO` (default)

**שימוש ב-serverLogger:**

```typescript
switch (logLevel) {
  case LogLevel.ERROR:
    logger.apiError(MESSAGE_FORMATTERS.client.error(logEntry.message), meta);
    break;
  case LogLevel.WARN:
    logger.apiWarn(MESSAGE_FORMATTERS.client.warn(logEntry.message), meta);
    break;
  case LogLevel.INFO:
    logger.apiInfo(MESSAGE_FORMATTERS.client.info(logEntry.message), meta);
    break;
  case LogLevel.DEBUG:
    logger.apiDebug(MESSAGE_FORMATTERS.client.debug(logEntry.message), meta);
    break;
}
```

### Rate Limiting

**הערה:** Rate limiting מיוחד ל-endpoint זה:
- `CLIENT_LOGS_MAX_REQUESTS` - מספר בקשות מקסימלי
- מוגדר ב-RateLimitMiddleware

## MiddlewareMetricsController

**מיקום:** `server/src/internal/controllers/middleware-metrics.controller.ts`

**תפקיד:**
- גישה למטריקות middleware
- קבלת מטריקות ביצועים של middleware
- איפוס מטריקות (admin only)

### Endpoints

#### GET /admin/middleware-metrics

**תפקיד:** קבלת כל המטריקות של middleware.

**Authorization:** ADMIN only (`@Roles(UserRole.ADMIN)`)

**Response:**
```typescript
// Single middleware metrics
{
  requestCount: number;
  averageDuration: number;
  // ...
}

// Multiple middleware metrics
{
  summary: {
    totalMiddlewares: number;
    totalRequests: number;
    averagePerformance: number;
    slowestMiddleware: string;
    mostUsedMiddleware: string;
  },
  metrics: {
    [middlewareName: string]: {
      requestCount: number;
      averageDuration: number;
      // ...
    }
  },
  storageMetrics: {
    // Storage metrics
  }
}
```

**תהליך:**
1. קבלת מטריקות מ-MetricsService
2. יצירת summary (אם multiple middleware)
3. זיהוי slowestMiddleware ו-mostUsedMiddleware
4. החזרת מטריקות

#### GET /admin/middleware-metrics/:middlewareName

**תפקיד:** קבלת מטריקות ל-middleware ספציפי.

**Authorization:** ADMIN only (`@Roles(UserRole.ADMIN)`)

**Parameters:**
- `middlewareName` (string) - שם ה-middleware

**Response:**
```typescript
{
  requestCount: number;
  averageDuration: number;
  // ...
}
```

**Errors:**
- `404 NotFoundException` - אם אין מטריקות ל-middleware

#### DELETE /admin/middleware-metrics/:middlewareName

**תפקיד:** איפוס מטריקות ל-middleware ספציפי.

**Authorization:** ADMIN only (`@Roles(UserRole.ADMIN)`)

**Parameters:**
- `middlewareName` (string) - שם ה-middleware

**Response:**
```typescript
{
  message: `Metrics reset for middleware: ${middlewareName}`
}
```

#### DELETE /admin/middleware-metrics

**תפקיד:** איפוס כל המטריקות.

**Authorization:** ADMIN only (`@Roles(UserRole.ADMIN)`)

**Response:**
```typescript
{
  reset: true
}
```

### דוגמאות שימוש

```typescript
// קבלת כל המטריקות
const response = await fetch('/admin/middleware-metrics', {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});

// Response:
// {
//   summary: {
//     totalMiddlewares: 3,
//     totalRequests: 1000,
//     averagePerformance: 150,
//     slowestMiddleware: 'BulkOperationsMiddleware',
//     mostUsedMiddleware: 'DecoratorAwareMiddleware',
//   },
//   metrics: {
//     DecoratorAwareMiddleware: { requestCount: 500, averageDuration: 100 },
//     RateLimitMiddleware: { requestCount: 300, averageDuration: 50 },
//     BulkOperationsMiddleware: { requestCount: 200, averageDuration: 300 },
//   },
// }

// קבלת מטריקות ל-middleware ספציפי
const metrics = await fetch('/admin/middleware-metrics/DecoratorAwareMiddleware', {
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});

// איפוס מטריקות ל-middleware ספציפי
await fetch('/admin/middleware-metrics/DecoratorAwareMiddleware', {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});

// איפוס כל המטריקות
await fetch('/admin/middleware-metrics', {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${adminToken}`,
  },
});
```

## אינטגרציה

### ClientLogsController → serverLogger

```typescript
// client-logs.controller.ts
@Controller('client-logs')
export class ClientLogsController {
  @Post('batch')
  async receiveClientLogs(@Body() request: ClientLogsRequest) {
    // עיבוד לוגים
    for (const logEntry of logs) {
      // מיפוי רמת לוג
      const logLevel = this.mapClientLogLevel(logEntry.level);
      
      // רישום ל-serverLogger
      logger.apiError(MESSAGE_FORMATTERS.client.error(logEntry.message), meta);
    }
  }
}
```

### MiddlewareMetricsController → MetricsService

```typescript
// middleware-metrics.controller.ts
@Controller('admin/middleware-metrics')
export class MiddlewareMetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllMetrics() {
    // קבלת מטריקות
    const allMetrics = this.metricsService.getMetrics();
    const middlewareMetrics = this.metricsService.getMiddlewareMetrics();
    
    // יצירת summary
    // החזרת מטריקות
  }
}
```

## Best Practices

### 1. Rate Limiting ל-Client Logs

```typescript
// ✅ טוב - Rate limiting מיוחד ל-client logs
@Post('batch')
async receiveClientLogs(@Body() request: ClientLogsRequest) {
  // Rate limiting ב-RateLimitMiddleware
}
```

### 2. Admin Only Endpoints

```typescript
// ✅ טוב - Admin only למטריקות
@Get()
@Roles(UserRole.ADMIN)
async getAllMetrics() {}

// ❌ רע - Public access למטריקות
@Get()
async getAllMetrics() {} // לא בטוח
```

### 3. Batch Processing

```typescript
// ✅ טוב - Batch processing ללוגים
@Post('batch')
async receiveClientLogs(@Body() request: ClientLogsRequest) {
  for (const logEntry of logs) {
    // עיבוד כל לוג
  }
  return { processed: logs.length };
}

// ❌ רע - בקשה נפרדת לכל לוג
@Post()
async receiveClientLog(@Body() log: ClientLog) {
  // לא יעיל
}
```

## הפניות

- [Middleware](./MIDDLEWARE.md) - Middleware שמייצרים מטריקות
- [Modules](./MODULES.md) - Modules שמשתמשים ב-Controllers
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - זרימת בקשות
- [Internal Structure](./README.md) - סקירה כללית
