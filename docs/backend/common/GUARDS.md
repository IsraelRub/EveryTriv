# Guards - Common Structure

תיעוד מפורט על Guards ב-NestJS, כולל AuthGuard ו-RolesGuard, זרימה, דוגמאות, ואינטגרציה עם Decorators ו-Middleware.

## סקירה כללית

Guards ב-NestJS אחראים להגנה על endpoints ולבדיקת הרשאות. הם פועלים לאחר Middleware ולפני Interceptors ו-Pipes.

**מיקום:** `server/src/common/guards/`

**קבצים:**
- `auth.guard.ts` - Guard לאימות JWT tokens
- `roles.guard.ts` - Guard לבדיקת roles והרשאות

**סדר ביצוע:**
1. Middleware (DecoratorAwareMiddleware, RateLimitMiddleware)
2. **Guards** ← כאן
3. Interceptors (לפני handler)
4. Pipes
5. Controller Handler

## Authentication Guard

**מיקום:** `server/src/common/guards/auth.guard.ts`

**תפקיד:**
- אימות JWT tokens
- חילוץ מידע משתמש מהטוקן
- הצמדת user payload ל-request
- תמיכה ב-endpoints ציבוריים

### זרימת עבודה

```
1. בדיקת @Public() decorator
   ↓
2. בדיקת req.decoratorMetadata.isPublic (מ-Middleware)
   ↓
3. בדיקת רשימת endpoints ציבוריים (hardcoded)
   ↓
4. אם ציבורי → דילוג על אימות
   ↓
5. אם לא ציבורי → חילוץ JWT token מהבקשה
   ↓
6. אם אין token → 401 Unauthorized
   ↓
7. אימות token עם JwtService
   ↓
8. חילוץ payload מה-token
   ↓
9. הצמדת payload ל-request.user ו-request.userRole
   ↓
10. המשך ל-RolesGuard
```

### דוגמאות שימוש

#### Endpoint ציבורי

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @Public() // ← מסומן כ-ציבורי
  async login(@Body() credentials: LoginDto) {
    // לא דורש JWT token
  }
}
```

**מה קורה:**
1. `DecoratorAwareMiddleware` קורא `@Public()` ומגדיר `req.decoratorMetadata.isPublic = true`
2. `AuthGuard` בודק `isPublic` metadata
3. אם `true` → דילוג על אימות → המשך

#### Endpoint מוגן

```typescript
@Controller('users')
export class UserController {
  @Get('profile')
  // אין @Public() → דורש אימות
  async getProfile(@CurrentUserId() userId: string) {
    // דורש JWT token תקין
  }
}
```

**מה קורה:**
1. `AuthGuard` בודק `isPublic` → `false`
2. חילוץ JWT token מ-header (`Authorization: Bearer <token>`)
3. אם אין token → `401 Unauthorized`
4. אימות token עם `JwtService.verifyAsync()`
5. חילוץ payload ומצרף ל-`request.user`
6. המשך ל-RolesGuard

### אינטגרציה עם Decorators

**@Public() Decorator:**
```typescript
// auth.guard.ts
const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
  context.getHandler(),
  context.getClass()
]);
```

**DecoratorAwareMiddleware Metadata:**
```typescript
// auth.guard.ts
const middlewarePublicFlag: boolean | undefined = request?.decoratorMetadata?.isPublic;
```

**Hardcoded Public Endpoints:**
```typescript
// auth.guard.ts
const isHardcodedPublic = isPublicEndpoint(request.path || '');
```

### User Payload Structure

לאחר אימות מוצלח, ה-Guard מצרף את ה-JWT payload ל-request:

```typescript
// request.user מכיל:
{
  sub: string,        // User ID (standard JWT claim)
  role: UserRole,     // User role (ADMIN, USER, וכו')
  email: string,      // User email
  // ... שדות נוספים מה-JWT
}

// request.userRole מכיל:
UserRole.USER | UserRole.ADMIN | ...
```

### לוגים

**Authentication Successful:**
```typescript
logger.securityLogin('Authentication successful', {
  userId: payload.sub,
  role: payload.role,
});
```

**Authentication Failed:**
```typescript
logger.securityDenied('No authentication token provided');
// או
logger.securityDenied('Invalid authentication token', {
  error: getErrorMessage(error),
});
```

## Roles Guard

**מיקום:** `server/src/common/guards/roles.guard.ts`

**תפקיד:**
- בדיקת roles נדרשים לנתיב
- השוואת user role ל-roles נדרשים
- תמיכה ב-endpoints ציבוריים (דילוג)
- החזרת `403 Forbidden` כאשר אין הרשאה

### זרימת עבודה

```
1. בדיקת @Public() decorator
   ↓
2. בדיקת req.decoratorMetadata.isPublic
   ↓
3. בדיקת רשימת endpoints ציבוריים
   ↓
4. אם ציבורי → דילוג על בדיקת roles
   ↓
5. חילוץ required roles מ-@Roles() decorator
   ↓
6. אם אין required roles → המשך (כל משתמש מאומת מותר)
   ↓
7. בדיקת user ב-request.user
   ↓
8. אם אין user → 403 Forbidden
   ↓
9. השוואת user.role ל-required roles
   ↓
10. אם אין התאמה → 403 Forbidden
   ↓
11. אם יש התאמה → המשך
```

### דוגמאות שימוש

#### Endpoint ללא דרישת Role

```typescript
@Controller('users')
export class UserController {
  @Get('profile')
  // אין @Roles() → כל משתמש מאומת מותר
  async getProfile(@CurrentUserId() userId: string) {
    // כל משתמש מאומת יכול לגשת
  }
}
```

#### Endpoint עם דרישת Role בודד

```typescript
@Controller('admin')
export class AdminController {
  @Get('users')
  @Roles(UserRole.ADMIN) // ← דורש ADMIN role
  async getAllUsers(@CurrentUserId() userId: string) {
    // רק משתמשים עם ADMIN role יכולים לגשת
  }
}
```

#### Endpoint עם מספר Roles מותרים

```typescript
@Controller('admin')
export class AdminController {
  @Get('moderation')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR) // ← דורש ADMIN או MODERATOR
  async getModerationData(@CurrentUserId() userId: string) {
    // משתמשים עם ADMIN או MODERATOR role יכולים לגשת
  }
}
```

### אינטגרציה עם Decorators

**@Roles() Decorator:**
```typescript
// roles.guard.ts
const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
  context.getHandler(),
  context.getClass()
]);
```

**השוואת Roles:**
```typescript
// roles.guard.ts
const userRole = user.role || UserRole.USER;
const hasRole = requiredRoles.includes(userRole);

if (!hasRole) {
  throw new ForbiddenException({
    message: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
    details: {
      userRole,
      requiredRoles,
      userId: user.sub,
    },
  });
}
```

### לוגים

**Role Check Passed:**
```typescript
logger.securityLogin('Role check passed', {
  userId: user.sub,
  role: userRole,
  requiredRoles,
});
```

**Role Check Failed:**
```typescript
logger.securityDenied('Insufficient role for endpoint', {
  userId: user.sub,
  role: userRole,
  requiredRoles,
});
```

## אינטגרציה בין Guards

### סדר ביצוע

```
1. AuthGuard (Global)
   ↓
2. RolesGuard (Global)
   ↓
3. Interceptors
```

**מדוע AuthGuard לפני RolesGuard?**
- `RolesGuard` דורש `request.user` (שנקבע על ידי `AuthGuard`)
- אם אין אימות → אין user → אין משמעות לבדיקת roles

### דוגמה מלאה: Endpoint מוגן עם Role

```typescript
@Controller('admin')
export class AdminController {
  @Get('users')
  @Roles(UserRole.ADMIN) // ← RolesGuard בודק
  // אין @Public() → AuthGuard בודק אימות
  async getAllUsers(@CurrentUserId() userId: string) {
    // כאן: userId כבר מאומת ויש לו ADMIN role
  }
}
```

**זרימה:**
1. `DecoratorAwareMiddleware` קורא `@Roles(UserRole.ADMIN)`
2. `AuthGuard` בודק JWT token → מצרף user ל-request
3. `RolesGuard` בודק `user.role === UserRole.ADMIN`
4. אם כל הבדיקות עברו → המשך ל-Controller

## אינטגרציה עם TokenExtractionService

`AuthGuard` משתמש ב-`TokenExtractionService` לחילוץ JWT token מהבקשה:

```typescript
// auth.guard.ts
const token = TokenExtractionService.extractTokenFromRequest(request);
```

**מיקומים נבדקים:**
1. `Authorization` header: `Bearer <token>`
2. `Cookie`: `token=<token>`
3. Query parameter: `?token=<token>`

## Best Practices

### 1. שימוש ב-@Public() עבור endpoints ציבוריים

```typescript
// ✅ טוב
@Post('login')
@Public()
async login(@Body() credentials: LoginDto) {}

// ❌ רע - endpoint ציבורי ללא @Public()
@Post('login')
async login(@Body() credentials: LoginDto) {}
```

### 2. שילוב @Public() ו-@Roles()

```typescript
// ✅ טוב - @Public() עוקף את כל Guards
@Get('public-data')
@Public()
async getPublicData() {}

// ❌ לא הגיוני - @Public() עוקף @Roles()
@Get('admin-data')
@Public()
@Roles(UserRole.ADMIN) // ← לא ייבדק כי @Public() עוקף
async getAdminData() {}
```

### 3. הגדרת Roles ברורים

```typescript
// ✅ טוב - role ברור
@Get('admin')
@Roles(UserRole.ADMIN)
async getAdminData() {}

// ✅ טוב - מספר roles ברורים
@Get('moderation')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
async getModerationData() {}

// ❌ רע - אין roles → כל משתמש מאומת מותר
@Get('sensitive-data')
// אין @Roles() → כל משתמש מאומת יכול לגשת
async getSensitiveData() {}
```

### 4. שימוש ב-@CurrentUserId() ו-@CurrentUser()

```typescript
// ✅ טוב - רק userId נדרש
@Get('profile')
async getProfile(@CurrentUserId() userId: string) {
  // userId כבר מאומת
}

// ✅ טוב - כל ה-user payload נדרש
@Get('profile')
async getProfile(@CurrentUser() user: TokenPayload) {
  // משתמש ב-user.role, user.email, וכו'
}
```

## הפניות

- [Decorators](./DECORATORS.md) - איך Decorators משמשים את Guards
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - סדר ביצוע Guards
- [Middleware](../internal/MIDDLEWARE.md) - איך Middleware מכין metadata ל-Guards
- [Common Structure](../common/README.md) - סקירה כללית
