# Request-Response Cycle - NestJS

תיעוד מקיף על מחזור החיים של בקשה בשרת NestJS, כולל הסדר המדויק שבו Middleware, Guards, Interceptors, Pipes, Controllers, Services, ו-Filters פועלים יחד.

## סקירה כללית

בכל בקשה HTTP לשרת NestJS, המידע עובר דרך מספר שכבות בסדר מוגדר:

```
Client Request
    ↓
1. Middleware (Global & Route-specific)
    ↓
2. Guards (Global & Route-specific)
    ↓
3. Interceptors (Before - Global & Route-specific)
    ↓
4. Pipes (Global & Route-specific)
    ↓
5. Controller Handler
    ↓
6. Service Method
    ↓
7. Interceptors (After - Global & Route-specific)
    ↓
8. Filters (Exception Handling)
    ↓
Client Response
```

## סדר הביצוע המפורט

### 1. Middleware

**סדר ביצוע:**
1. `DecoratorAwareMiddleware` - קריאת metadata מ-decorators (`@Public`, `@Roles`, `@RateLimit`, `@Cache`)
2. `RateLimitMiddleware` - בדיקת קצב בקשות (rate limiting)
3. `BulkOperationsMiddleware` - אופטימיזציית פעולות bulk

**תפקיד:**
- ניתוח וטיפול מוקדם בבקשה
- קריאת metadata מ-decorators והעברתו לשכבות הבאות
- הגבלת קצב בקשות
- אופטימיזציית בקשות

**מיקום:** `server/src/internal/middleware/`

**דוגמה:**
```typescript
// DecoratorAwareMiddleware קורא את @Public() decorator
// ומגדיר req.decoratorMetadata.isPublic = true
@Get('public')
@Public()
async getPublicData() {
  // ...
}
```

### 2. Guards

**סדר ביצוע:**
1. `AuthGuard` (Global) - אימות JWT tokens
2. `RolesGuard` (Global) - בדיקת roles

**תפקיד:**
- הגנה על נתיבים
- אימות משתמשים (JWT)
- בדיקת הרשאות (roles)
- בדיקת metadata מ-`DecoratorAwareMiddleware` (למשל: `@Public()`)

**מיקום:** `server/src/common/guards/`

**זרימה:**
```typescript
// AuthGuard בודק:
// 1. האם יש JWT token?
// 2. האם הנתיב ציבורי (req.decoratorMetadata.isPublic)?
// 3. אם לא - האם ה-token תקין?
// 4. מחלץ מידע משתמש מהטוקן ומצרף ל-request

// RolesGuard בודק:
// 1. האם הנתיב ציבורי? → דילוג
// 2. האם יש role נדרש (req.decoratorMetadata.roles)?
// 3. האם למשתמש יש role מתאים?
```

**דוגמה:**
```typescript
@Get('protected')
@Roles(UserRole.ADMIN)
async getProtectedData(@CurrentUserId() userId: string) {
  // AuthGuard כבר בדק את ה-JWT
  // RolesGuard כבר בדק שיש role ADMIN
  // @CurrentUserId() מחלץ userId מה-JWT
}
```

### 3. Interceptors (Before Handler)

**סדר ביצוע:**
1. `CacheInterceptor` (Global) - בדיקת מטמון לפני ביצוע handler
2. `PerformanceMonitoringInterceptor` (Global) - התחלת מדידת זמן
3. `ResponseFormattingInterceptor` (Global) - הכנה לעיצוב תגובה

**תפקיד:**
- בדיקת מטמון לפני ביצוע handler
- מדידת ביצועים (זמן תחילת בקשה)
- הכנה לעיבוד תגובה

**מיקום:** `server/src/common/interceptors/`

**זרימה:**
```typescript
// CacheInterceptor בודק:
// 1. האם יש metadata מטמון (req.decoratorMetadata.cache)?
// 2. אם כן - האם יש תוצאה במטמון?
// 3. אם יש - החזרת תוצאה ממטמון (דילוג על handler)
// 4. אם לא - המשך ל-handler
```

### 4. Pipes

**סדר ביצוע:**
1. `ValidationPipe` (Global) - ולידציה של DTOs
2. Custom Pipes (Route-specific) - ולידציה וטרנספורמציה מותאמת

**תפקיד:**
- ולידציה של נתוני קלט (DTOs)
- טרנספורמציה של נתונים (למשל: המרת string ל-enum)
- ניקוי וסינון קלט

**מיקום:** `server/src/common/pipes/`

**דוגמה:**
```typescript
@Post('trivia')
async getTrivia(
  @Body(TriviaRequestPipe) body: TriviaRequestDto, // Pipe בודק וממיר נתונים
  @CurrentUserId() userId: string
) {
  // body כבר עבר ולידציה וטרנספורמציה
}
```

### 5. Controller Handler

**תפקיד:**
- קבלת בקשה מעובדת
- קריאה ל-Service methods
- החזרת תגובה

**דוגמה:**
```typescript
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('trivia')
  async getTrivia(@Body() body: TriviaRequestDto, @CurrentUserId() userId: string) {
    // כל השכבות הקודמות כבר עברו
    // body ו-userId כבר מאומתים ומעובדים
    return this.gameService.getTriviaQuestion(body, userId);
  }
}
```

### 6. Service Method

**תפקיד:**
- לוגיקה עסקית
- אינטראקציה עם מסד נתונים
- קריאה לשירותים חיצוניים
- חישובים ועסקים לוגיים

**דוגמה:**
```typescript
@Injectable()
export class GameService {
  async getTriviaQuestion(request: TriviaRequestDto, userId: string) {
    // לוגיקה עסקית
    const questions = await this.generateQuestions(request);
    // אינטראקציה עם מסד נתונים
    await this.saveGameHistory(userId, questions);
    return { questions };
  }
}
```

### 7. Interceptors (After Handler)

**סדר ביצוע (הפוך מהסדר לפני handler):**
1. `ResponseFormattingInterceptor` (Global) - עיצוב תגובה אחיד
2. `PerformanceMonitoringInterceptor` (Global) - סיום מדידת זמן ורישום
3. `CacheInterceptor` (Global) - שמירה במטמון (אם יש metadata)

**תפקיד:**
- עיצוב תגובה אחיד (`{ success, data, timestamp, meta }`)
- מדידת ביצועים (זמן סיום, רישום מטריקות)
- שמירת תוצאות במטמון (אם יש metadata)

**זרימה:**
```typescript
// ResponseFormattingInterceptor מעצב תגובה:
{
  success: true,
  data: { questions: [...] },
  timestamp: "2025-01-15T10:00:00Z",
  meta: {
    duration: 150, // ms
    endpoint: "/game/trivia",
    method: "POST"
  }
}

// CacheInterceptor שומר במטמון (אם יש metadata):
await cacheService.set(cacheKey, response, ttl);
```

### 8. Filters (Exception Handling)

**תפקיד:**
- טיפול בשגיאות
- עיצוב אחיד של תגובות שגיאה
- רישום שגיאות
- מניעת חשיפת מידע רגיש

**מיקום:** `server/src/common/globalException.filter.ts`

**זרימה:**
```typescript
// GlobalExceptionFilter תופס כל exception:
try {
  // כל השכבות לעיל
} catch (exception) {
  // GlobalExceptionFilter מטפל:
  // 1. קביעת status code
  // 2. עיצוב תגובת שגיאה אחידה
  // 3. רישום שגיאה (אם צריך)
  // 4. החזרת תגובת שגיאה ללקוח
}
```

## אינטגרציה בין השכבות

### שימוש ב-Decorator Metadata

**DecoratorAwareMiddleware** קורא metadata מ-decorators ומעביר אותו דרך `req.decoratorMetadata`:

```typescript
// בקוד:
@Get('data')
@Public()
@Cache({ ttl: 300 })
@Roles(UserRole.USER)
async getData() {}

// ב-Middleware:
req.decoratorMetadata = {
  isPublic: true,           // מ-@Public()
  cache: { ttl: 300 },      // מ-@Cache()
  roles: [UserRole.USER]    // מ-@Roles()
}

// Guards משתמשים ב-isPublic
// Interceptors משתמשים ב-cache
// Guards משתמשים ב-roles
```

### דוגמה מלאה: בקשה עם כל השכבות

```typescript
// 1. Controller עם decorators
@Controller('game')
export class GameController {
  @Post('trivia')
  @NoCache() // אין cache
  async getTrivia(
    @Body(TriviaRequestPipe) body: TriviaRequestDto,
    @CurrentUserId() userId: string
  ) {
    return this.gameService.getTriviaQuestion(body, userId);
  }
}

// 2. DecoratorAwareMiddleware קורא @NoCache()
//    ומגדיר req.decoratorMetadata.cache.disabled = true

// 3. AuthGuard בודק JWT ומאמת משתמש

// 4. CacheInterceptor רואה cache.disabled = true
//    ומדלג על בדיקת מטמון

// 5. TriviaRequestPipe בודק וממיר את body

// 6. Controller handler נקרא

// 7. Service method מבצע לוגיקה עסקית

// 8. ResponseFormattingInterceptor מעצב תגובה

// 9. PerformanceMonitoringInterceptor מודד זמן

// 10. אם יש שגיאה - GlobalExceptionFilter מטפל
```

## סדר עדיפויות

### Global vs Route-specific

**Guards:**
1. Global Guards (ב-app.module.ts)
2. Route-specific Guards (ב-controller)

**Interceptors:**
1. Global Interceptors (ב-app.module.ts)
2. Route-specific Interceptors (ב-controller)

**Pipes:**
1. Global Pipes (ב-app.module.ts)
2. Route-specific Pipes (ב-controller method)

### סדר ביצוע בתוך כל סוג

**Middleware:** לפי הסדר ב-`app.module.ts` → `configure()`

**Guards:** לפי הסדר בהגדרה (Global או `@UseGuards()`)

**Interceptors:**
- **לפני handler:** לפי הסדר (Global → Route-specific)
- **אחרי handler:** בסדר הפוך (Route-specific → Global)

**Pipes:** לפי הסדר (Global → Route-specific)

## הפניות

- [Common Structure](./common/README.md) - תיעוד מפורט על כל שכבה
- [Internal Structure](./internal/README.md) - תיעוד על Middleware ו-Modules
- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [דיאגרמות](../DIAGRAMS.md)
  - [דיאגרמת Middleware Stack](../DIAGRAMS.md#דיאגרמת-middleware-stack)
  - [דיאגרמת מודולי Backend](../DIAGRAMS.md#דיאגרמת-מודולי-backend)

