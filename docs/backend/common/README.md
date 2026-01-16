# Common Structure - Backend

תיעוד המבנה המשותף של השרת (NestJS).

## סקירה כללית

המבנה המשותף של השרת מאורגן בתיקיית `common/` ומכיל קוד משותף גלובלי בין כל המודולים.

## מבנה Common

```
server/src/common/
├── decorators/      # דקורטורים
├── guards/          # שומרי נתיבים
├── interceptors/    # interceptors
├── pipes/           # pipes
├── validation/      # ולידציה
└── globalException.filter.ts  # Exception filter
```

## תיקיות עיקריות

### Decorators
תיעוד מפורט: [DECORATORS.md](./DECORATORS.md)

**קבצים:**
- `auth.decorator.ts` - סימון נתיבים ציבוריים והגדרת תפקידים נדרשים
- `cache.decorator.ts` - הגדרת מדיניות מטמון עם TTL ותגיות
- `param.decorator.ts` - חילוץ מידע משתמש מבקשות (`CurrentUserId`, `CurrentUser`)

**דקורטורים עיקריים:**
- `@Public()` - מסמן endpoint כ-ציבורי, מדלג על אימות
- `@Roles(...roles)` - מגדיר תפקידים נדרשים לנתיב
- `@Cache(options)` - מגדיר מדיניות מטמון
- `@NoCache()` - מניעת cache
- `@CurrentUserId()` - מחלץ userId מ-JWT
- `@CurrentUser()` - מחלץ user object מ-JWT

### Guards
תיעוד מפורט: [GUARDS.md](./GUARDS.md)

**קבצים:**
- `auth.guard.ts` - מאמת JWT tokens ובודק endpoints ציבוריים
- `roles.guard.ts` - בודק הרשאות משתמש לפי תפקידים נדרשים

**תפקידים:**
- **AuthGuard:** אימות JWT tokens, חילוץ user payload, תמיכה ב-`@Public()`
- **RolesGuard:** בדיקת roles, תמיכה ב-`@Roles()`, החזרת `403 Forbidden` כאשר אין הרשאה

### Interceptors
תיעוד מפורט: [INTERCEPTORS.md](./INTERCEPTORS.md)

**קבצים:**
- `cache.interceptor.ts` - מטמן תגובות API על בסיס `@Cache()` decorator
- `performance-monitoring.interceptor.ts` - מודד זמני תגובה ושימוש בזיכרון
- `response-formatting.interceptor.ts` - מעצב תגובות לפורמט אחיד

**תפקידים:**
- **CacheInterceptor:** מטמון תגובות, TTL support, cache tags
- **PerformanceMonitoringInterceptor:** מדידת ביצועים, זיהוי בקשות איטיות, מטריקות
- **ResponseFormattingInterceptor:** עיצוב אחיד של תגובות, metadata

### Pipes
תיעוד מפורט: [PIPES.md](./PIPES.md)

**קבצים:**
- `triviaRequest.pipe.ts` - pipe ולידציית trivia requests
- `gameAnswer.pipe.ts` - pipe ולידציית תשובות משחק
- `customDifficulty.pipe.ts` - pipe ולידציית קושי מותאם
- `paymentData.pipe.ts` - pipe ולידציית נתוני תשלום
- `userData.pipe.ts` - pipe ולידציית נתוני משתמש

**תפקידים:**
- ולידציה וטרנספורמציה של נתוני קלט
- שימוש ב-ValidationService לוולידציה עסקית
- לוגים מפורטים

### Validation
תיעוד מפורט: [VALIDATION.md](./VALIDATION.md)

**קבצים:**
- `validation.service.ts` - שירות ולידציה מרכזי
- `languageTool.service.ts` - שירות אינטגרציה עם LanguageTool API
- `validation.module.ts` - מודול ולידציה

**תפקידים:**
- ולידציה של נתוני קלט (username, email, password, וכו')
- אינטגרציה עם LanguageTool API (איות ודקדוק)
- סניטיזציה של קלט

### Filters
תיעוד מפורט: [FILTERS.md](./FILTERS.md)

**קבצים:**
- `globalException.filter.ts` - Filter גלובלי לטיפול בכל השגיאות

**תפקידים:**
- טיפול בכל השגיאות באפליקציה
- עיצוב אחיד של תגובות שגיאה
- רישום שגיאות (server errors בלבד)
- מניעת חשיפת מידע רגיש

## עקרונות עיצוב

### דקורטורים
- **מטרה:** הוספת מטא-דאטה לקוד
- **שימוש:** אימות, מטמון, לוגים, ביצועים
- **דוגמה:** `@Public()`, `@Cache()`, `@Roles()`

### Guards
- **מטרה:** הגנה על נתיבים
- **שימוש:** אימות, הרשאות, תפקידים
- **דוגמה:** `@UseGuards(AuthGuard)`, `@UseGuards(RolesGuard)`

### Interceptors
- **מטרה:** עיבוד בקשות ותגובות
- **שימוש:** מטמון, ניטור, עיצוב
- **דוגמה:** `@UseInterceptors(CacheInterceptor)`

### Pipes
- **מטרה:** טרנספורמציה ולידציה
- **שימוש:** המרת נתונים, ולידציה
- **דוגמה:** `@Body(ValidationPipe)`

### Filters
- **מטרה:** טיפול בשגיאות
- **שימוש:** עיצוב תגובות שגיאה, לוגים
- **דוגמה:** `APP_FILTER` (גלובלי)

## סדר ביצוע Request-Response Cycle

1. **Middleware** - עיבוד ראשוני, metadata
2. **Guards** - אימות והרשאות
3. **Interceptors** (לפני handler) - מטמון, מדידה
4. **Pipes** - ולידציה וטרנספורמציה
5. **Controller Handler** - לוגיקה עסקית
6. **Interceptors** (אחרי handler) - עיצוב, מדידה
7. **Filters** - טיפול בשגיאות

תיעוד מפורט: [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md)

## קישורים רלוונטיים

### תיעוד מפורט
- [Decorators](./DECORATORS.md) - דקורטורים מפורטים
- [Guards](./GUARDS.md) - Guards מפורטים
- [Interceptors](./INTERCEPTORS.md) - Interceptors מפורטים
- [Pipes](./PIPES.md) - Pipes מפורטים
- [Validation](./VALIDATION.md) - Validation Service מפורט
- [Filters](./FILTERS.md) - Exception Filters מפורטים

### תיעוד מבני
- [Internal Structure](../internal/README.md) - מבנה פנימי
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - זרימת בקשות
- [Features](../features/AUTH.md) - מודולי Features (AUTH, GAME, USER, PAYMENT, CREDITS, LEADERBOARD, ANALYTICS)

### דיאגרמות
- [DIAGRAMS.md](../../DIAGRAMS.md) - דיאגרמות ארכיטקטורה
  - [דיאגרמת מודולי Backend](../../DIAGRAMS.md#דיאגרמת-מודולי-backend)
  - [דיאגרמת Middleware Stack](../../DIAGRAMS.md#דיאגרמת-middleware-stack) - כולל Request-Response Cycle
