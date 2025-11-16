# Modules - Internal Structure

תיעוד מפורט על כל ה-Internal Modules ב-NestJS, כולל CacheModule, StorageModule, ו-RedisModule.

## סקירה כללית

Modules ב-NestJS מספקים תשתית משותפת בין feature modules.

**מיקום:** `server/src/internal/modules/`

**Modules:**
- `cache/` - CacheModule (מטמון עם Redis ו-in-memory fallback)
- `storage/` - StorageModule (אחסון מתמיד עם Redis)
- `redis.module.ts` - RedisModule (חיבור Redis גלובלי)

## CacheModule

**מיקום:** `server/src/internal/modules/cache/`

**תפקיד:**
- מטמון תגובות API עם Redis ו-in-memory fallback
- ניהול מטמון, סטטיסטיקות, ו-invalidation
- תמיכה ב-`@Cache()` decorator

### מבנה

```
cache/
├── cache.module.ts    # הגדרת CacheModule
├── cache.service.ts   # CacheService (מטמון)
├── cache.controller.ts # CacheController (ניהול מטמון)
└── index.ts           # Exports
```

### CacheModule

**מיקום:** `server/src/internal/modules/cache/cache.module.ts`

**תפקיד:**
- הגדרת CacheModule
- Export של CacheService ו-CacheController
- תלות ב-RedisModule

### CacheService

**מיקום:** `server/src/internal/modules/cache/cache.service.ts`

**תפקיד:**
- ניהול מטמון עם Redis (אם זמין) ו-in-memory fallback
- TTL support
- Batch operations (mget, mset)
- Increment operations
- Cache-aside pattern עם `getOrSet`

**תכונות:**
- **Redis First:** שימוש ב-Redis אם זמין
- **Memory Fallback:** fallback ל-memory cache אם Redis לא זמין
- **TTL Support:** תמיכה ב-Time To Live
- **Validation:** תמיכה ב-validators לנתונים במטמון
- **Batch Operations:** תמיכה ב-batch get/set
- **Increment:** תמיכה ב-increment operations

**דוגמאות שימוש:**

```typescript
// Set עם TTL
await cacheService.set('key', { data: 'value' }, 300); // 5 דקות

// Get
const result = await cacheService.get('key');

// Get או Set (Cache-aside pattern)
const value = await cacheService.getOrSet(
  'key',
  async () => {
    // Factory function - נבצע רק אם אין במטמון
    return await expensiveOperation();
  },
  300 // TTL
);

// Delete
await cacheService.delete('key');

// Increment
await cacheService.increment('counter', 1);
```

### CacheController

**מיקום:** `server/src/internal/modules/cache/cache.controller.ts`

**תפקיד:**
- Endpoints לניהול מטמון (admin only)
- סטטיסטיקות מטמון
- Invalidation ו-clear

**Endpoints:**
- `GET /cache/stats` - סטטיסטיקות מטמון (ADMIN only)
- `DELETE /cache/clear` - מחיקת כל המטמון (ADMIN only)
- `GET /cache/exists/:key` - בדיקת קיום מפתח (ADMIN only)
- `DELETE /cache/:key` - מחיקת מפתח ספציפי (ADMIN only)

## StorageModule

**מיקום:** `server/src/internal/modules/storage/`

**תפקיד:**
- אחסון מתמיד (persistent storage) עם Redis
- לא למטמון זמני - רק לאחסון מתמיד

### מבנה

```
storage/
├── storage.module.ts   # הגדרת StorageModule
├── storage.service.ts  # ServerStorageService (אחסון מתמיד)
├── storage.controller.ts # StorageController (ניהול אחסון)
└── index.ts            # Exports
```

### StorageModule

**מיקום:** `server/src/internal/modules/storage/storage.module.ts`

**תפקיד:**
- הגדרת StorageModule
- Export של ServerStorageService ו-StorageController
- תלות ב-RedisModule (חובה)
- שימוש ב-MetricsService

**הערה:** דורש Redis - זורק BadRequestException אם Redis לא זמין.

### ServerStorageService

**מיקום:** `server/src/internal/modules/storage/storage.service.ts`

**תפקיד:**
- אחסון מתמיד ב-Redis
- ניהול נתונים שצריכים להישמר לטווח ארוך

**שימוש:**
- Session data (user sessions, game sessions)
- User preferences שנשמרים
- Audit logs ו-historical data
- Configuration data שצריך להישמר

**הערה:** לא למטמון זמני - יש להשתמש ב-CacheService למטמון.

**תכונות:**
- **Persistent Only:** אחסון מתמיד בלבד
- **Redis Required:** דורש Redis (לא fallback)
- **Metrics:** שימוש ב-MetricsService למעקב

**דוגמאות שימוש:**

```typescript
// Set (persistent)
await storageService.set('session:user-123', sessionData, 86400); // 24 שעות

// Get
const result = await storageService.get('session:user-123');

// Delete
await storageService.delete('session:user-123');

// Exists
const exists = await storageService.exists('session:user-123');
```

### StorageController

**מיקום:** `server/src/internal/modules/storage/storage.controller.ts`

**תפקיד:**
- Endpoints לניהול אחסון (admin ו-public)
- מטריקות אחסון
- ניהול keys

**Endpoints:**
- `GET /storage/metrics` - מטריקות אחסון (PUBLIC, cached)
- `POST /storage/metrics/reset` - איפוס מטריקות (ADMIN only)
- `GET /storage/keys` - רשימת keys (ADMIN only, cached)
- `GET /storage/:key` - קבלת נתון (ADMIN only)
- `POST /storage/:key` - שמירת נתון (ADMIN only)
- `DELETE /storage/:key` - מחיקת נתון (ADMIN only)

## RedisModule

**מיקום:** `server/src/internal/modules/redis.module.ts`

**תפקיד:**
- חיבור Redis גלובלי
- Configuration ו-connection management
- Error handling ו-retry logic
- Injection token: `REDIS_CLIENT`

### תכונות

**Global Module:**
- `@Global()` decorator - זמין בכל המודולים ללא import
- Provider: `REDIS_CLIENT` (Redis | null)

**Configuration:**
- Host, Port, Password, DB
- Connection timeout, Command timeout
- Key prefix
- Reconnect attempts & delay

**Error Handling:**
- Event listeners (connect, ready, error, reconnecting, end)
- Logging events
- Fallback ל-null אם Redis לא מוגדר

**דוגמאות שימוש:**

```typescript
// Injection ב-service
constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis | null) {}

// בדיקת זמינות
if (this.redis) {
  // שימוש ב-Redis
  await this.redis.set('key', 'value');
}
```

### Event Logging

```typescript
// Connect
redisClient.on('connect', () => {
  logger.appStartup();
});

// Ready
redisClient.on('ready', () => {
  logger.appStartup();
});

// Error
redisClient.on('error', (err: Error) => {
  logger.systemError(`Redis client error: ${err.message}`, {...});
});

// Reconnecting
redisClient.on('reconnecting', (delay: number) => {
  logger.systemError(`Redis client reconnecting in ${delay}ms`, {...});
});

// End
redisClient.on('end', () => {
  logger.systemInfo('Redis client connection closed', {...});
});
```

## אינטגרציה בין Modules

### CacheModule → RedisModule

```typescript
@Module({
  imports: [RedisModule], // תלות ב-RedisModule
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
```

### StorageModule → RedisModule

```typescript
@Module({
  imports: [RedisModule], // תלות ב-RedisModule
  providers: [
    {
      provide: ServerStorageService,
      useFactory: (redisClient: Redis | null) => {
        if (!redisClient) {
          throw new BadRequestException('Redis client is required');
        }
        return new ServerStorageService(redisClient, {});
      },
      inject: ['REDIS_CLIENT'],
    },
  ],
  exports: [ServerStorageService],
})
export class StorageModule {}
```

### RedisModule → Global

```typescript
@Global() // זמין בכל המודולים
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (): Redis | null => {
        // יצירת Redis client
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
```

## Best Practices

### 1. שימוש ב-CacheService למטמון זמני

```typescript
// ✅ טוב - CacheService למטמון זמני
await cacheService.set('leaderboard', data, 300); // 5 דקות

// ❌ רע - StorageService למטמון זמני
await storageService.set('leaderboard', data, 300); // לא למטמון
```

### 2. שימוש ב-StorageService לאחסון מתמיד

```typescript
// ✅ טוב - StorageService לאחסון מתמיד
await storageService.set('session:user-123', sessionData, 86400);

// ❌ רע - CacheService לאחסון מתמיד
await cacheService.set('session:user-123', sessionData, 86400); // עלול להימחק
```

### 3. בדיקת זמינות Redis

```typescript
// ✅ טוב - בדיקת זמינות Redis
if (this.redis) {
  await this.redis.set('key', 'value');
} else {
  // Fallback logic
}

// ❌ רע - שימוש בלי בדיקה
await this.redis.set('key', 'value'); // עלול להיכשל
```

## הפניות

- [Entities](./ENTITIES.md) - Entities שמשתמשות ב-Modules
- [Controllers](./CONTROLLERS.md) - Controllers של Modules
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - זרימת בקשות
- [Internal Structure](./README.md) - סקירה כללית
