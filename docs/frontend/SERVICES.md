# Frontend Services

תיעוד שכבת השירותים (Services) בצד הלקוח.

## תפקיד
- עטיפת קריאות HTTP.
- החלת מדיניות (Timeout / Retry קל / Logging).
- פורמט תגובות אחיד.

## מבנה מוצע
```
services/
  api/
    http-client.ts
    api.service.ts
  auth/
    auth.service.ts
  game/
    game.service.ts
  media/
    audio.service.ts
  storage/
    storage.service.ts
  utils/
    logger.service.ts
    query-client.ts
```

## Http Client בסיסי
```typescript
export const http = createHttpClient({ baseURL: '/api', timeout: 8000 });
```

## תבנית שירות
```typescript
export const authService = {
  async login(dto: LoginDto) {
    return http.post('/auth/login', dto);
  },
  async me() { return http.get('/auth/me'); }
};
```

## טיפול שגיאות
Hook או שכבה אחת מעל:
```typescript
try {
  const r = await authService.login(data);
  // handle success
} catch(e) {
  // map error → UI message
}
```

## אחידות תגובה
```typescript
interface ApiSuccess<T> { success: true; data: T; }
interface ApiFail { success: false; error: string; }
```

## Caching קל (Query Client לדוגמה)
```typescript
const cache = new Map<string, unknown>();
export function cacheGet<T>(k: string): T | undefined { return cache.get(k) as T|undefined; }
export function cacheSet<T>(k: string, v: T) { cache.set(k, v); }
```

## מדיניות
| מדיניות | כלל |
|---------|-----|
| Timeout | < 10s |
| Retries | Idempotent GET בלבד (עד 2) |
| Logging | שגיאות רשת בלבד |

## אבטחה
- אחסון טוקנים: עדיפות HttpOnly Cookies (אם נתמך), אחרת secure storage.
- אין שמירת מידע רגיש ב-localStorage ללא הצפנה.

---
 
