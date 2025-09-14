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
  - `auth.decorator.ts` - דקורטור אימות
  - `cache.decorator.ts` - דקורטור מטמון
  - `game.decorator.ts` - דקורטור משחק
  - `logging.decorator.ts` - דקורטור לוגים
  - `param.decorator.ts` - דקורטור פרמטרים
  - `performance.decorator.ts` - דקורטור ביצועים
  - `repository.decorator.ts` - דקורטור repository
  - `validation.decorator.ts` - דקורטור ולידציה

### Guards
- **תיאור**: שומרי נתיבים
- **קבצים**:
  - `auth.guard.ts` - שומר אימות
  - `roles.guard.ts` - שומר תפקידים

### Interceptors
- **תיאור**: interceptors משותפים
- **קבצים**:
  - `cache.interceptor.ts` - interceptor מטמון
  - `performance-monitoring.interceptor.ts` - ניטור ביצועים
  - `repository.interceptor.ts` - interceptor repository
  - `response-formatting.interceptor.ts` - עיצוב תגובות

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
