# Controllers - Internal Structure

תיעוד מפורט על כל ה-Internal Controllers ב-NestJS, כולל MiddlewareMetricsController.

## סקירה כללית

Controllers ב-NestJS מטפלים בבקשות HTTP ומחזירים תגובות.

**מיקום:** `server/src/internal/controllers/`

**Controllers:**
- `middleware-metrics.controller.ts` - Controller למטריקות middleware

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

### 1. Admin Only Endpoints

```typescript
// ✅ טוב - Admin only למטריקות
@Get()
@Roles(UserRole.ADMIN)
async getAllMetrics() {}

// ❌ רע - Public access למטריקות
@Get()
async getAllMetrics() {} // לא בטוח
```

## הפניות

- [Middleware](./MIDDLEWARE.md) - Middleware שמייצרים מטריקות
- [Modules](./MODULES.md) - Modules שמשתמשים ב-Controllers
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - זרימת בקשות
- [Internal Structure](./README.md) - סקירה כללית
