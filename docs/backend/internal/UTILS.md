# Utils - Internal Structure

תיעוד מפורט על כל ה-Internal Utils ב-NestJS, כולל Error Utils, Guards Utils, ו-Redis Utils.

## סקירה כללית

Utils ב-NestJS מספקים כלי עזר משותפים לכל השרת.

**מיקום:** `server/src/internal/utils/`

**Utils:**
- `error.utils.ts` - כלי עזר לטיפול בשגיאות
- `guards.utils.ts` - כלי עזר ל-guards
- `redis.utils.ts` - כלי עזר ל-Redis

## Error Utils

**מיקום:** `server/src/internal/utils/error.utils.ts`

**תפקיד:**
- יצירת שגיאות NestJS מותאמות
- טיפול בשגיאות עם הודעות ברורות

### פונקציות

#### createValidationError(field: string, expectedType: string)

**תפקיד:** יצירת שגיאת ולידציה.

**פרמטרים:**
- `field` (string) - שם השדה
- `expectedType` (string) - טיפוס צפוי (למשל: 'string', 'number', 'boolean')

**החזרה:** `BadRequestException`

**דוגמאות:**
```typescript
throw createValidationError('username', 'string');
// BadRequestException: "username must be a string"
```

#### createStringLengthValidationError(field: string, minLength?: number, maxLength?: number)

**תפקיד:** יצירת שגיאת ולידציית אורך string.

**פרמטרים:**
- `field` (string) - שם השדה
- `minLength` (number, optional) - אורך מינימלי
- `maxLength` (number, optional) - אורך מקסימלי

**החזרה:** `BadRequestException`

**דוגמאות:**
```typescript
throw createStringLengthValidationError('username', 3, 30);
// BadRequestException: "username must be between 3 and 30 characters"

throw createStringLengthValidationError('password', 8);
// BadRequestException: "password must be at least 8 characters long"

throw createStringLengthValidationError('email', undefined, 100);
// BadRequestException: "email must be less than 100 characters"
```

#### createStorageError(operation: string, originalError?: unknown)

**תפקיד:** יצירת שגיאת storage.

**פרמטרים:**
- `operation` (string) - שם הפעולה שנכשלה
- `originalError` (unknown, optional) - שגיאה מקורית

**החזרה:** `InternalServerErrorException`

**דוגמאות:**
```typescript
throw createStorageError('get user data', error);
// InternalServerErrorException: "Failed to get user data: <error message>"

throw createStorageError('set cache');
// InternalServerErrorException: "Failed to set cache"
```

#### createServerError(operation: string, originalError: unknown)

**תפקיד:** יצירת שגיאת שרת.

**פרמטרים:**
- `operation` (string) - שם הפעולה שנכשלה
- `originalError` (unknown) - שגיאה מקורית

**החזרה:** `InternalServerErrorException`

**דוגמאות:**
```typescript
throw createServerError('process payment', error);
// InternalServerErrorException: "Failed to process payment: <error message>"
```

#### createNotFoundError(resource: string)

**תפקיד:** יצירת שגיאת לא נמצא.

**פרמטרים:**
- `resource` (string) - שם המשאב שלא נמצא

**החזרה:** `NotFoundException`

**דוגמאות:**
```typescript
throw createNotFoundError('User');
// NotFoundException: "User not found"
```

#### createCacheError(operation: string, originalError?: unknown)

**תפקיד:** יצירת שגיאת cache.

**פרמטרים:**
- `operation` (string) - שם הפעולה שנכשלה
- `originalError` (unknown, optional) - שגיאה מקורית

**החזרה:** `InternalServerErrorException`

**דוגמאות:**
```typescript
throw createCacheError('get cache', error);
// InternalServerErrorException: "Failed to get cache: <error message>"
```

#### createAuthError(reason?: string)

**תפקיד:** יצירת שגיאת אימות.

**פרמטרים:**
- `reason` (string, optional, default: 'Authentication failed') - סיבת כישלון

**החזרה:** `UnauthorizedException`

**דוגמאות:**
```typescript
throw createAuthError('Invalid token');
// UnauthorizedException: "Invalid token"

throw createAuthError();
// UnauthorizedException: "Authentication failed"
```

### שימוש

```typescript
import { createValidationError, createNotFoundError } from '@internal/utils';

// ולידציה
if (typeof username !== 'string') {
  throw createValidationError('username', 'string');
}

// לא נמצא
const user = await userRepository.findOne({ where: { id: userId } });
if (!user) {
  throw createNotFoundError('User');
}
```

## Guards Utils

**מיקום:** `server/src/internal/utils/guards.utils.ts`

**תפקיד:**
- כלי עזר ל-guards
- בדיקת endpoints ציבוריים

### פונקציות

#### isPublicEndpoint(path: string)

**תפקיד:** בדיקה אם endpoint ציבורי.

**פרמטרים:**
- `path` (string) - נתיב הבקשה

**החזרה:** `boolean`

**דוגמאות:**
```typescript
isPublicEndpoint('/leaderboard/global');     // true
isPublicEndpoint('/leaderboard/period');     // true
isPublicEndpoint('/health');                 // true
isPublicEndpoint('/status');                 // true
isPublicEndpoint('/game/trivia');            // false
isPublicEndpoint('/users/profile');          // false
```

**מימוש:**
```typescript
export function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.some(
    endpoint => path === endpoint || path?.startsWith(endpoint + '?') || path?.startsWith(endpoint + '/')
  );
}
```

### שימוש

```typescript
import { isPublicEndpoint } from '@internal/utils';

// auth.guard.ts
const isHardcodedPublic = isPublicEndpoint(request.path || '');
if (isPublic || middlewarePublicFlag || isHardcodedPublic) {
  return true; // דילוג על אימות
}
```

## Redis Utils

**מיקום:** `server/src/internal/utils/redis.utils.ts`

**תפקיד:**
- כלי עזר ל-Redis operations
- SCAN ו-DELETE operations

### פונקציות

#### scanKeys(redisClient: Redis | null, pattern: string, count?: number)

**תפקיד:** סריקת מפתחות Redis באמצעות SCAN (לא חוסם).

**פרמטרים:**
- `redisClient` (Redis | null) - Redis client
- `pattern` (string) - תבנית מפתחות (למשל: 'prefix:*')
- `count` (number, optional, default: 100) - גודל batch ל-SCAN

**החזרה:** `Promise<string[]>` - רשימת מפתחות תואמים

**דוגמאות:**
```typescript
const keys = await scanKeys(redisClient, 'session:*', 100);
// ['session:123', 'session:456', ...]

const keys = await scanKeys(redisClient, 'cache:leaderboard:*', 50);
// ['cache:leaderboard:daily', 'cache:leaderboard:weekly', ...]
```

**מימוש:**
```typescript
export async function scanKeys(redisClient: Redis | null, pattern: string, count: number = 100): Promise<string[]> {
  if (!redisClient) return [];

  const keys: string[] = [];
  let cursor = '0';

  do {
    const [nextCursor, scannedKeys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', count.toString());
    cursor = nextCursor;
    keys.push(...scannedKeys);
  } while (cursor !== '0');

  return keys;
}
```

#### deleteKeysByPattern(redisClient: Redis | null, pattern: string, count?: number)

**תפקיד:** מחיקת מפתחות Redis לפי תבנית באמצעות SCAN ו-pipeline.

**פרמטרים:**
- `redisClient` (Redis | null) - Redis client
- `pattern` (string) - תבנית מפתחות (למשל: 'prefix:*')
- `count` (number, optional, default: 100) - גודל batch ל-SCAN

**החזרה:** `Promise<number>` - מספר מפתחות שנמחקו

**דוגמאות:**
```typescript
const deleted = await deleteKeysByPattern(redisClient, 'session:*', 100);
// 50 (50 מפתחות נמחקו)

const deleted = await deleteKeysByPattern(redisClient, 'cache:leaderboard:*', 50);
// 10 (10 מפתחות נמחקו)
```

**מימוש:**
```typescript
export async function deleteKeysByPattern(
  redisClient: Redis | null,
  pattern: string,
  count: number = 100
): Promise<number> {
  if (!redisClient) return 0;

  const keys = await scanKeys(redisClient, pattern, count);

  if (keys.length === 0) return 0;

  // Use pipeline for batch deletion
  const pipeline = redisClient.pipeline();
  for (const key of keys) {
    pipeline.del(key);
  }
  await pipeline.exec();

  return keys.length;
}
```

### שימוש

```typescript
import { scanKeys, deleteKeysByPattern } from '@internal/utils';

// סריקת מפתחות
const keys = await scanKeys(redisClient, 'session:*');
console.log(`Found ${keys.length} session keys`);

// מחיקת מפתחות לפי תבנית
const deleted = await deleteKeysByPattern(redisClient, 'cache:leaderboard:*');
console.log(`Deleted ${deleted} cache keys`);
```

## Best Practices

### 1. שימוש ב-Error Utils

```typescript
// ✅ טוב - שימוש ב-error utils
throw createValidationError('username', 'string');
throw createNotFoundError('User');

// ❌ רע - יצירת שגיאות ישירות
throw new BadRequestException('Invalid input');
throw new NotFoundException('Not found');
```

### 2. בדיקת זמינות Redis

```typescript
// ✅ טוב - בדיקת זמינות Redis
if (!redisClient) return [];

// ❌ רע - שימוש בלי בדיקה
const keys = await redisClient.scan(...); // עלול להיכשל
```

### 3. שימוש ב-SCAN במקום KEYS

```typescript
// ✅ טוב - SCAN (לא חוסם)
const keys = await scanKeys(redisClient, 'prefix:*');

// ❌ רע - KEYS (חוסם)
const keys = await redisClient.keys('prefix:*'); // חוסם Redis
```

## הפניות

- [Guards](../common/GUARDS.md) - Guards משתמשים ב-guards utils
- [Modules](./MODULES.md) - Modules משתמשים ב-redis utils
- [Constants](./CONSTANTS.md) - Constants משמשים את utils
- [Internal Structure](./README.md) - סקירה כללית
