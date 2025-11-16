# Constants - Internal Structure

תיעוד מפורט על כל ה-Internal Constants ב-NestJS, כולל Auth Constants, Database Constants, ו-Public Endpoints Constants.

## סקירה כללית

Constants ב-NestJS מספקים קבועים משותפים לכל השרת.

**מיקום:** `server/src/internal/constants/`

**Constants:**
- `auth/` - קבועי אימות (AUTH_CONSTANTS)
- `database/` - קבועי מסד נתונים (REDIS_CONSTANTS)
- `public-endpoints.constants.ts` - רשימת endpoints ציבוריים (PUBLIC_ENDPOINTS)

## Auth Constants

**מיקום:** `server/src/internal/constants/auth/auth.constants.ts`

**תפקיד:**
- קבועי אימות ספציפיים לשרת
- הגדרות JWT, tokens, ו-OAuth

### AUTH_CONSTANTS

```typescript
export const AUTH_CONSTANTS = {
  JWT_EXPIRATION: '24h',                    // תפוגת JWT token
  JWT_REFRESH_EXPIRATION: '7d',             // תפוגת refresh token
  REFRESH_TOKEN_EXPIRATION: '7d',           // תפוגת refresh token (alias)
  TOKEN_TYPE: TokenType.BEARER,             // סוג token (Bearer)
  AUTH_HEADER: AuthHeader.AUTHORIZATION,    // Auth header (Authorization)
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret',           // JWT secret
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret', // Refresh secret
} as const;
```

### פרמטרים

**JWT_EXPIRATION:** תפוגת JWT token (default: '24h')

**JWT_REFRESH_EXPIRATION:** תפוגת refresh token (default: '7d')

**TOKEN_TYPE:** סוג token (Bearer)

**AUTH_HEADER:** Auth header (Authorization)

**JWT_SECRET:** JWT secret (מ-env var או default)

**JWT_REFRESH_SECRET:** Refresh secret (מ-env var או default)

### שימוש

```typescript
import { AUTH_CONSTANTS } from '@internal/constants';

// שימוש ב-JWT secret
const payload = await jwtService.verifyAsync(token, {
  secret: AUTH_CONSTANTS.JWT_SECRET,
});

// שימוש ב-JWT expiration
const token = await jwtService.signAsync(payload, {
  expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION,
});
```

## Database Constants

**מיקום:** `server/src/internal/constants/database/database.constants.ts`

**תפקיד:**
- קבועי מסד נתונים (Redis)
- הגדרות חיבור, key prefixes, ו-TTL

### REDIS_CONSTANTS

```typescript
export const REDIS_CONSTANTS = {
  CONNECTION: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD || '',
    DB: parseInt(process.env.REDIS_DB || '0', 10),
    RECONNECT_ATTEMPTS: 10,
    RECONNECT_DELAY: 1000,
  },
  KEY_PREFIXES: {
    SESSION: 'session:',
    USER: 'user:',
    CACHE: 'cache:',
    RATE_LIMIT: 'rate-limit:',
    TRIVIA_QUEUE: 'trivia-queue:',
    TRIVIA_STATS: 'trivia-stats:',
  },
  TTL: {
    CACHE_SHORT: CACHE_DURATION.MEDIUM,   // 5 דקות
    CACHE_MEDIUM: CACHE_DURATION.VERY_LONG, // שעה
    CACHE_LONG: CACHE_DURATION.EXTREME,   // 24 שעות
    SESSION: CACHE_DURATION.EXTREME,      // 24 שעות
  },
};
```

### RedisKeyPrefix Enum

```typescript
export enum RedisKeyPrefix {
  SESSION = 'session:',
  USER = 'user:',
  CACHE = 'cache:',
  RATE_LIMIT = 'rate-limit:',
  TRIVIA_QUEUE = 'trivia-queue:',
  TRIVIA_STATS = 'trivia-stats:',
}
```

### פרמטרים

**CONNECTION:**
- `HOST` - Redis host (default: 'localhost')
- `PORT` - Redis port (default: 6379)
- `PASSWORD` - Redis password (default: '')
- `DB` - Redis database (default: 0)
- `RECONNECT_ATTEMPTS` - מספר ניסיונות חיבור מחדש (10)
- `RECONNECT_DELAY` - עיכוב חיבור מחדש (1000ms)

**KEY_PREFIXES:**
- `SESSION` - 'session:' (session data)
- `USER` - 'user:' (user data)
- `CACHE` - 'cache:' (cache data)
- `RATE_LIMIT` - 'rate-limit:' (rate limiting)
- `TRIVIA_QUEUE` - 'trivia-queue:' (trivia queue)
- `TRIVIA_STATS` - 'trivia-stats:' (trivia statistics)

**TTL:**
- `CACHE_SHORT` - 5 דקות (CACHE_DURATION.MEDIUM)
- `CACHE_MEDIUM` - שעה (CACHE_DURATION.VERY_LONG)
- `CACHE_LONG` - 24 שעות (CACHE_DURATION.EXTREME)
- `SESSION` - 24 שעות (CACHE_DURATION.EXTREME)

### שימוש

```typescript
import { REDIS_CONSTANTS } from '@internal/constants';

// שימוש ב-Redis connection
const redisClient = new Redis({
  host: REDIS_CONSTANTS.CONNECTION.HOST,
  port: REDIS_CONSTANTS.CONNECTION.PORT,
  password: REDIS_CONSTANTS.CONNECTION.PASSWORD,
  db: REDIS_CONSTANTS.CONNECTION.DB,
});

// שימוש ב-key prefix
const key = `${REDIS_CONSTANTS.KEY_PREFIXES.SESSION}${sessionId}`;

// שימוש ב-TTL
await redisClient.setex(key, REDIS_CONSTANTS.TTL.SESSION, sessionData);
```

## Public Endpoints Constants

**מיקום:** `server/src/internal/constants/public-endpoints.constants.ts`

**תפקיד:**
- רשימת endpoints ציבוריים שלא דורשים אימות
- שימוש ב-Guards ו-Middleware

### PUBLIC_ENDPOINTS

```typescript
export const PUBLIC_ENDPOINTS = [
  '/leaderboard/global',
  '/leaderboard/period',
  '/health',
  '/status',
] as const;
```

### פרמטרים

**רשימת Endpoints ציבוריים:**
- `/leaderboard/global` - לוח תוצאות גלובלי
- `/leaderboard/period` - לוח תוצאות תקופתי
- `/health` - health check
- `/status` - status check

### שימוש

**ב-Guards:**
```typescript
import { isPublicEndpoint } from '@internal/utils';

// auth.guard.ts
const isHardcodedPublic = isPublicEndpoint(request.path || '');
if (isPublic || middlewarePublicFlag || isHardcodedPublic) {
  return true; // דילוג על אימות
}
```

**ב-Middleware:**
```typescript
import { PUBLIC_ENDPOINTS } from '@internal/constants';

// decorator-aware.middleware.ts
const publicPatterns = [
  '/health',
  '/status',
  '/ping',
  '/version',
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/public',
  '/docs',
  '/swagger',
];
const isLikelyPublic = publicPatterns.some(pattern => path.includes(pattern));
```

### isPublicEndpoint Utility

**מיקום:** `server/src/internal/utils/guards.utils.ts`

**תפקיד:** בדיקה אם endpoint ציבורי.

```typescript
export function isPublicEndpoint(path: string): boolean {
  return PUBLIC_ENDPOINTS.some(
    endpoint => path === endpoint || path?.startsWith(endpoint + '?') || path?.startsWith(endpoint + '/')
  );
}
```

**דוגמאות:**
```typescript
isPublicEndpoint('/leaderboard/global');     // true
isPublicEndpoint('/leaderboard/period');     // true
isPublicEndpoint('/health');                 // true
isPublicEndpoint('/status');                 // true
isPublicEndpoint('/game/trivia');            // false
isPublicEndpoint('/users/profile');          // false
```

## Best Practices

### 1. שימוש ב-Environment Variables

```typescript
// ✅ טוב - Environment variables עם defaults
JWT_SECRET: process.env.JWT_SECRET || 'default-secret',

// ❌ רע - Hardcoded secrets
JWT_SECRET: 'hardcoded-secret',
```

### 2. שימוש ב-Key Prefixes

```typescript
// ✅ טוב - שימוש ב-key prefixes
const key = `${REDIS_CONSTANTS.KEY_PREFIXES.SESSION}${sessionId}`;

// ❌ רע - Hardcoded keys
const key = `session:${sessionId}`;
```

### 3. שימוש ב-Public Endpoints

```typescript
// ✅ טוב - שימוש ב-isPublicEndpoint
if (isPublicEndpoint(request.path)) {
  return true;
}

// ❌ רע - Hardcoded checks
if (request.path === '/health' || request.path === '/status') {
  return true;
}
```

## הפניות

- [Guards](../common/GUARDS.md) - Guards משתמשים ב-PUBLIC_ENDPOINTS
- [Middleware](./MIDDLEWARE.md) - Middleware משתמש ב-PUBLIC_ENDPOINTS
- [Utils](./UTILS.md) - Utils משתמשים ב-CONSTANTS
- [Internal Structure](./README.md) - סקירה כללית
