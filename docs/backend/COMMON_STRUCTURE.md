# Backend Common Structure Documentation

תיעוד המבנה המשותף של השרת (NestJS).

## סקירה כללית

המבנה המשותף של השרת מאורגן בתיקיית `common/` ומכיל קוד משותף גלובלי בין כל המודולים.

## מבנה Common

```
server/src/common/
├── auth/            # שירותי אימות
├── decorators/      # דקורטורים
├── guards/          # שומרי נתיבים
├── interceptors/    # interceptors
├── pipes/           # pipes
└── validation/      # ולידציה
```

## תיקיות עיקריות

### Auth
- **תיאור**: שירותי אימות משותפים
- **קבצים**:
  - `authentication.manager.ts` - מנהל אימות
  - `jwt-token.service.ts` - שירות JWT
  - `password.service.ts` - שירות סיסמאות

### Decorators
- **תיאור**: דקורטורים מותאמים אישית
- **קבצים**:
  - `auth.decorator.ts` - סימון נתיבים ציבוריים והגדרת תפקידים נדרשים
  - `cache.decorator.ts` - הגדרת מדיניות מטמון עם TTL ותגיות
  - `param.decorator.ts` - חילוץ מידע משתמש מבקשות (`CurrentUserId`, `CurrentUser`)
  - `repository.decorator.ts` - סימון מחלקות repository
  - `validation.decorator.ts` - סימון שדות לוולידציה מותאמת

#### @NoCache() Decorator
- **תיאור**: דקורטור למניעת caching בנקודות קצה דינמיות
- **מיקום**: `server/src/common/decorators/cache.decorator.ts`
- **שימוש**: נקודות קצה שדורשות נתונים בזמן אמת
- **דוגמאות שימוש**:
  ```typescript
  @Get('balance')
  @NoCache()
  async getPointBalance(@CurrentUserId() userId: string) {
    // נתונים בזמן אמת ללא cache
  }
  ```
- **נקודות קצה בשימוש**:
  - `GET /points/balance` - יתרת נקודות בזמן אמת
  - `GET /leaderboard/user/ranking` - דירוג משתמש בזמן אמת
  - `POST /game/trivia` - שאלות טריוויה חדשות

### Guards
- **תיאור**: שומרי נתיבים
- **קבצים**:
  - `auth.guard.ts` - מאמת JWT tokens ובודק endpoints ציבוריים מול רשימה מוגדרת
  - `roles.guard.ts` - בודק הרשאות משתמש לפי תפקידים נדרשים

### Interceptors
- **תיאור**: interceptors משותפים
- **קבצים**:
  - `cache.interceptor.ts` - מטמן תגובות API על בסיס metadata מהבקשה
  - `performance-monitoring.interceptor.ts` - מודד זמני תגובה, שימוש בזיכרון ומזהה בקשות איטיות
  - `repository.interceptor.ts` - מעבד פעולות repository
  - `response-formatting.interceptor.ts` - מעצב תגובות לפורמט אחיד עם מטא-דאטה

### Pipes
- **תיאור**: pipes ולידציה
- **קבצים**:
  - `customDifficulty.pipe.ts` - pipe קושי מותאם
  - `gameAnswer.pipe.ts` - pipe תשובת משחק
  - `languageValidation.pipe.ts` - pipe ולידציית שפה
  - `paymentData.pipe.ts` - pipe נתוני תשלום
  - `triviaQuestion.pipe.ts` - pipe שאלת טריוויה
  - `triviaRequest.pipe.ts` - pipe בקשת טריוויה
  - `userData.pipe.ts` - pipe נתוני משתמש

### Validation
- **תיאור**: ולידציה משותפת
- **קבצים**:
  - `languageTool.service.ts` - שירות כלי שפה
  - `validation.service.ts` - שירות ולידציה
  - `validation.module.ts` - מודול ולידציה

## עקרונות עיצוב

### דקורטורים
- **מטרה**: הוספת מטא-דאטה לקוד
- **שימוש**: אימות, מטמון, לוגים, ביצועים
- **דוגמה**: `@Auth()`, `@Cache()`, `@Log()`

### Guards
- **מטרה**: הגנה על נתיבים
- **שימוש**: אימות, הרשאות, תפקידים
- **דוגמה**: `@UseGuards(AuthGuard)`, `@UseGuards(RolesGuard)`

### Interceptors
- **מטרה**: עיבוד בקשות ותגובות
- **שימוש**: מטמון, ניטור, עיצוב
- **דוגמה**: `@UseInterceptors(CacheInterceptor)`

### Pipes
- **מטרה**: טרנספורמציה ולידציה
- **שימוש**: המרת נתונים, ולידציה
- **דוגמה**: `@UsePipes(ValidationPipe)`

## תיעוד מפורט למערכות Backend

### Middleware System

המערכת כוללת middleware גלובלי לניהול בקשות ותגובות:

#### Global Middleware
- **Logging Middleware**: רישום כל הבקשות והתגובות
- **CORS Middleware**: ניהול Cross-Origin Resource Sharing
- **Helmet Middleware**: אבטחת headers
- **Rate Limiting Middleware**: הגבלת קצב בקשות

#### Custom Middleware
```typescript
// דוגמה ל-middleware מותאם
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  }
}
```

### Interceptors System

מערכת interceptors לעיבוד בקשות ותגובות:

#### Cache Interceptor (`cache.interceptor.ts`)
- מטמן תגובות API על בסיס metadata מה-decorator `@Cache()`
- קורא metadata מה-`request.decoratorMetadata?.cache`
- מייצר מפתחות מטמון דינמיים מ-URL, method, query ו-params
- תומך ב-TTL (Time To Live) מותאם אישית
- בודק תנאים לפני שמירה במטמון (cache condition)
- מטפל בשגיאות מטמון בגרייספולי ומאפשר המשך הבקשה

#### Performance Monitoring Interceptor (`performance-monitoring.interceptor.ts`)
- מודד זמן תגובה ושימוש בזיכרון לכל בקשה
- מזהה בקשות איטיות לפי סף מוגדר (slow/very slow)
- שולח מטריקות ל-`metricsService`
- רושם לוגים מפורטים עם מזהה משתמש (`user.sub`)
- עוקב אחרי ביצועים גם במקרה של שגיאות

#### Response Formatting Interceptor (`response-formatting.interceptor.ts`)
- מעצב תגובות לפורמט אחיד: `{ success, data, timestamp, meta }`
- מוסיף מטא-דאטה: זמן תגובה, endpoint, method
- מטפל בשגיאות באופן רובוסטי עם null checks

### Guards System

מערכת הגנה על נתיבים:

#### Authentication Guard (`auth.guard.ts`)
- מאמת JWT tokens באמצעות `JwtService`
- בודק אם נתיב מוגדר כציבורי באמצעות decorators או רשימה מוגדרת
- מחלץ מידע משתמש מהטוקן ומצרף אותו לבקשה
- מחזיר `401 Unauthorized` בעת אי-אימות
- משתמש ב-`sub` claim כמזהה משתמש (תקן JWT)

#### Roles Guard (`roles.guard.ts`)
- בודק הרשאות משתמש לפי תפקידים נדרשים
- מאפשר גישה לנתיבים ציבוריים ללא בדיקה
- מחזיר `403 Forbidden` כאשר למשתמש אין הרשאה מתאימה
- מזהה תפקידים נדרשים דרך decorator `@Roles()`

### Pipes System

מערכת pipes מקיפה לוולידציה וטרנספורמציה:

#### Custom Validation Pipes
- `CustomDifficultyPipe`: ולידציית קושי משחק
- `GameAnswerPipe`: ולידציית תשובות משחק
- `LanguageValidationPipe`: ולידציית שפה
- `PaymentDataPipe`: ולידציית נתוני תשלום
- `TriviaQuestionPipe`: ולידציית שאלות טריוויה
- `UserDataPipe`: ולידציית נתוני משתמש

#### Transformation Pipes
- המרת נתונים בין פורמטים
- ניקוי וסינון קלט
- עיצוב נתונים

### Decorators System

מערכת דקורטורים מותאמת אישית:

#### Authentication Decorators (`auth.decorator.ts`)
- `@Public()`: מסמן נתיב כציבורי, מדלג על אימות
- `@Roles(...roles)`: מגדיר תפקידים נדרשים לנתיב (למשל: `@Roles(UserRole.ADMIN)`)

#### Cache Decorator (`cache.decorator.ts`)
- `@Cache(options)`: מגדיר מדיניות מטמון
- תומך ב-TTL, תגיות, מפתח מותאם אישית ותנאי שמירה
- דוגמה: `@Cache({ ttl: 300, key: 'leaderboard', tags: ['game'] })`

#### Parameter Decorators (`param.decorator.ts`)
- `@CurrentUserId()`: מחלץ מזהה משתמש (`user.sub`) מהבקשה
- `@CurrentUser()`: מחלץ אובייקט משתמש מלא (`TokenPayload`) מהבקשה
- משמשים להזרקת מידע משתמש מאומת לפרמטרים של controller methods

#### Validation Decorators (`validation.decorator.ts`)
- דקורטורים לסימון שדות ולידציה מותאמת אישית

#### Repository Decorator (`repository.decorator.ts`)
- מסמן מחלקות repository לניהול אוטומטי

## שימוש במודולים

### ייבוא דקורטורים
```typescript
import { Auth, Cache, Log } from '../common/decorators';
```

### שימוש ב-Guards
```typescript
@UseGuards(AuthGuard, RolesGuard)
@Controller('protected')
export class ProtectedController {}
```

### שימוש ב-Interceptors
```typescript
@UseInterceptors(CacheInterceptor, PerformanceInterceptor)
@Controller('cached')
export class CachedController {}
```

### שימוש ב-Pipes
```typescript
@UsePipes(ValidationPipe, CustomDifficultyPipe)
@Post('trivia')
async createTrivia(@Body() data: TriviaRequestDto) {}
```

## קישורים רלוונטיים

- [Internal Structure](./INTERNAL_STRUCTURE.md)
- [Repository Integration](./REPOSITORY_INTEGRATION.md)
- [API Reference](./API_REFERENCE.md)
