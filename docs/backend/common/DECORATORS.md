# Decorators - Common Structure

תיעוד מפורט על Decorators ב-NestJS, כולל שימוש, דוגמאות, ואינטגרציה עם Guards ו-Interceptors.

## סקירה כללית

Decorators ב-NestJS מאפשרים הוספת metadata לקוד, המשמש את Guards, Interceptors, ו-Middleware לקבלת החלטות בזמן ריצה.

**מיקום:** `server/src/common/decorators/`

**קבצים:**
- `auth.decorator.ts` - Decorators לאימות והרשאות
- `cache.decorator.ts` - Decorators למטמון
- `param.decorator.ts` - Parameter decorators לחילוץ מידע מבקשות

## Authentication Decorators

**מיקום:** `server/src/common/decorators/auth.decorator.ts`

### @Public()

מסמן endpoint כ-ציבורי, מדלג על אימות JWT.

**שימוש:**
```typescript
@Get('public')
@Public()
async getPublicData() {
  // לא דורש JWT token
}
```

**איך זה עובד:**
1. Decorator מגדיר metadata `isPublic = true`
2. `DecoratorAwareMiddleware` קורא את ה-metadata
3. `AuthGuard` בודק את `req.decoratorMetadata.isPublic` או `isPublic` metadata
4. אם `isPublic === true` → דילוג על אימות

**דוגמאות שימוש:**
- `POST /auth/register` - הרשמה
- `POST /auth/login` - התחברות
- `GET /auth/google` - OAuth Google

### @Roles(...roles)

מגדיר roles נדרשים לנתיב.

**שימוש:**
```typescript
@Get('admin')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
async getAdminData(@CurrentUserId() userId: string) {
  // דורש ADMIN או MODERATOR role
}
```

**איך זה עובד:**
1. Decorator מגדיר metadata `roles = [UserRole.ADMIN, UserRole.MODERATOR]`
2. `DecoratorAwareMiddleware` קורא את ה-metadata
3. `RolesGuard` בודק את `req.decoratorMetadata.roles`
4. משווה עם `request.user.role`
5. אם אין התאמה → `403 Forbidden`

**דוגמאות שימוש:**
- `GET /admin/users` - רשימת משתמשים (ADMIN בלבד)
- `GET /admin/analytics` - אנליטיקה (ADMIN בלבד)

### @RequireUserStatus(...statuses)

מגדיר user status נדרש לנתיב.

**שימוש:**
```typescript
@Get('profile')
@RequireUserStatus(UserStatus.ACTIVE)
async getProfile(@CurrentUserId() userId: string) {
  // דורש user status ACTIVE
}
```

**איך זה עובד:**
1. Decorator מגדיר metadata `requireUserStatus = [UserStatus.ACTIVE]`
2. Guard בודק את `request.user.status`
3. אם אין התאמה → שגיאה

### @RequireEmailVerified()

מגדיר שדרוש email מאומת לנתיב.

**שימוש:**
```typescript
@Post('payment')
@RequireEmailVerified()
async createPayment(@CurrentUserId() userId: string) {
  // דורש email מאומת
}
```

**איך זה עובד:**
1. Decorator מגדיר metadata `requireEmailVerified = true`
2. Guard בודק את `request.user.emailVerified`
3. אם `emailVerified === false` → שגיאה

## Cache Decorators

**מיקום:** `server/src/common/decorators/cache.decorator.ts`

### @Cache(ttl, key?)

מגדיר מדיניות מטמון לנתיב.

**פרמטרים:**
- `ttl` (number) - Time To Live בשניות
- `key` (string, optional) - מפתח מטמון מותאם

**שימוש:**
```typescript
@Get('leaderboard')
@Cache(300, 'leaderboard') // Cache ל-5 דקות
async getLeaderboard() {
  // תוצאה תישמר במטמון ל-5 דקות
}
```

**איך זה עובד:**
1. Decorator מגדיר metadata `cache = { ttl: 300, key: 'leaderboard' }`
2. `DecoratorAwareMiddleware` קורא את ה-metadata
3. `CacheInterceptor` בודק את `req.decoratorMetadata.cache`
4. לפני handler: בודק מטמון, אם יש → החזרת תוצאה
5. אחרי handler: שומר תוצאה במטמון

**דוגמאות שימוש:**
- `GET /leaderboard/daily` - Cache ל-5 דקות
- `GET /game/history` - Cache ל-10 דקות

### @NoCache()

מנע caching לנתיב.

**שימוש:**
```typescript
@Get('balance')
@NoCache()
async getPointBalance(@CurrentUserId() userId: string) {
  // תוצאה לא תישמר במטמון (נתונים בזמן אמת)
}
```

**איך זה עובד:**
1. Decorator מגדיר metadata `cache = { ttl: 0, disabled: true }`
2. `CacheInterceptor` בודק את `cache.disabled`
3. אם `disabled === true` → דילוג על מטמון

**דוגמאות שימוש:**
- `GET /points/balance` - יתרת נקודות בזמן אמת
- `POST /game/trivia` - שאלות טריוויה חדשות
- `GET /leaderboard/user/ranking` - דירוג משתמש בזמן אמת

## Parameter Decorators

**מיקום:** `server/src/common/decorators/param.decorator.ts`

### @CurrentUserId()

מחלץ מזהה משתמש (`user.sub`) מהבקשה.

**שימוש:**
```typescript
@Get('profile')
async getProfile(@CurrentUserId() userId: string) {
  // userId מכיל את user.sub מה-JWT
}
```

**איך זה עובד:**
1. `AuthGuard` כבר בדק JWT ומחלץ payload
2. `AuthGuard` מצרף `payload` ל-`request.user`
3. `@CurrentUserId()` מחלץ `request.user.sub`

**דוגמאות שימוש:**
- `GET /users/profile` - פרופיל משתמש
- `GET /points/balance` - יתרת נקודות
- `GET /game/history` - היסטוריית משחקים

### @CurrentUser()

מחלץ אובייקט משתמש מלא (`TokenPayload`) מהבקשה.

**שימוש:**
```typescript
@Get('profile')
async getProfile(@CurrentUser() user: TokenPayload) {
  // user מכיל את כל ה-JWT payload
  // user.sub, user.role, user.email, וכו'
}
```

**איך זה עובד:**
1. `AuthGuard` כבר בדק JWT ומחלץ payload
2. `AuthGuard` מצרף `payload` ל-`request.user`
3. `@CurrentUser()` מחלץ את כל `request.user`

**דוגמאות שימוש:**
- כאשר צריך גישה למספר שדות מה-JWT
- כאשר צריך role, email, ומידע נוסף

## אינטגרציה עם Middleware ו-Guards

### Decorator Metadata Flow

```
1. Controller עם Decorators
   ↓
2. DecoratorAwareMiddleware קורא metadata
   ↓
3. מגדיר req.decoratorMetadata = { ... }
   ↓
4. Guards משתמשים ב-metadata (AuthGuard, RolesGuard)
   ↓
5. Interceptors משתמשים ב-metadata (CacheInterceptor)
```

**דוגמה מלאה:**
```typescript
@Get('admin-data')
@Public()              // ← Decorator 1
@Cache(300)            // ← Decorator 2
@Roles(UserRole.ADMIN) // ← Decorator 3
async getAdminData(@CurrentUserId() userId: string) {
  // ...
}

// 1. DecoratorAwareMiddleware קורא:
req.decoratorMetadata = {
  isPublic: true,
  cache: { ttl: 300 },
  roles: [UserRole.ADMIN]
}

// 2. AuthGuard בודק isPublic → true → דילוג

// 3. CacheInterceptor בודק cache → שומר במטמון

// 4. RolesGuard בודק roles → ADMIN → מאפשר
```

## Best Practices

### 1. שימוש ב-@Public() עבור endpoints ציבוריים

```typescript
// ✅ טוב
@Post('login')
@Public()
async login(@Body() credentials: LoginDto) {}

// ❌ רע - לא צריך @Public() אם אין AuthGuard
```

### 2. שילוב Decorators

```typescript
// ✅ טוב - שילוב הגיוני
@Get('leaderboard')
@Public()
@Cache(300)
async getLeaderboard() {}

// ❌ רע - לא הגיוני
@Get('balance')
@NoCache()  // ← דילוג על cache
@Cache(300) // ← ניסיון ל-cache
async getBalance() {}
```

### 3. שימוש ב-@CurrentUserId() vs @CurrentUser()

```typescript
// ✅ טוב - רק userId נדרש
@Get('profile')
async getProfile(@CurrentUserId() userId: string) {}

// ✅ טוב - כל ה-user נדרש
@Get('profile')
async getProfile(@CurrentUser() user: TokenPayload) {
  // משתמש ב-user.role, user.email, וכו'
}
```

## הפניות

- [Guards](./GUARDS.md) - איך Guards משתמשים ב-Decorators
- [Interceptors](./INTERCEPTORS.md) - איך Interceptors משתמשים ב-Decorators
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - סדר ביצוע Decorators
- [Common Structure](./README.md) - סקירה כללית

