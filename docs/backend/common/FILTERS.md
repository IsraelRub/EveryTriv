# Filters - Common Structure

תיעוד מפורט על Exception Filters ב-NestJS, כולל GlobalExceptionFilter.

## סקירה כללית

Exception Filters ב-NestJS אחראים לטיפול בשגיאות ולעיצוב אחיד של תגובות שגיאה.

**מיקום:** `server/src/common/globalException.filter.ts`

**קבצים:**
- `globalException.filter.ts` - Filter גלובלי לטיפול בכל השגיאות

**סדר ביצוע:**
1. Middleware
2. Guards
3. Interceptors
4. Pipes
5. Controller Handler
6. Interceptors (אחרי handler)
7. **Filters** ← כאן (אם יש שגיאה)

## Global Exception Filter

**מיקום:** `server/src/common/globalException.filter.ts`

**תפקיד:**
- טיפול בכל השגיאות באפליקציה
- עיצוב אחיד של תגובות שגיאה
- רישום שגיאות (server errors בלבד)
- מניעת חשיפת מידע רגיש

### זרימת עבודה

```
1. תפיסת exception
   ↓
2. קביעת status code
   ↓
3. קביעת error message
   ↓
4. זיהוי error type
   ↓
5. טיפול מיוחד ב-validation errors
   ↓
6. רישום שגיאות (server errors בלבד)
   ↓
7. עיצוב תגובת שגיאה
   ↓
8. החזרת תגובת שגיאה ללקוח
```

### טיפול בשגיאות לפי סוג

#### 1. Validation Errors (400 Bad Request)

**טיפול מיוחד:**
```typescript
if (exception instanceof HttpException && status === HttpStatus.BAD_REQUEST) {
  const exceptionResponse = exception.getResponse();
  if (isValidationErrorResponse(exceptionResponse)) {
    // תגובה מפורטת עם errors array
    return response.status(status).json({
      statusCode: status,
      path: request.url ?? 'unknown',
      message: 'Validation failed',
      errors: exceptionResponse.errors,
    });
  }
}
```

**תגובת שגיאה:**
```json
{
  "statusCode": 400,
  "path": "/game/trivia",
  "message": "Validation failed",
  "errors": [
    "Topic is required",
    "Difficulty must be valid"
  ]
}
```

#### 2. Authentication/Authorization Errors (401/403)

**טיפול:**
```typescript
const isAuthError = exception instanceof UnauthorizedException || exception instanceof ForbiddenException;
if (isAuthError) {
  // דילוג על רישום - כבר נרשם ב-Guards
}
```

**לוגיקה:**
- שגיאות אימות כבר נרשמות ב-`AuthGuard` ו-`RolesGuard`
- Filter מדלג על רישום כדי למנוע כפילות
- מחזיר תגובת שגיאה סטנדרטית

#### 3. Server Errors (500+)

**טיפול:**
```typescript
if (status >= 500) {
  logger.systemError(`Global Exception: ${errorMessage}`, {
    status,
    path: request.url ?? 'unknown',
    method: request.method || 'unknown',
    userAgent: request.headers?.['user-agent'] || 'unknown',
    ip: request.ip || 'unknown',
    errorType,
    stack: getErrorStack(exception),
    timestamp: new Date().toISOString(),
  });
}
```

**לוגים:**
- רישום מפורט לכל שגיאת שרת
- כולל stack trace, IP, user agent, וכו'
- לא חושף stack trace בתגובת לקוח

#### 4. Client Errors (400-499)

**טיפול:**
```typescript
// For other 4xx errors, don't log here as they should be handled by specific handlers
```

**לוגיקה:**
- שגיאות לקוח לא נרשמות ב-Filter
- מניח שהשגיאה נרשמה ב-handler הספציפי
- מחזיר תגובת שגיאה סטנדרטית

### עיצוב תגובת שגיאה

**פורמט סטנדרטי:**
```typescript
interface ErrorResponse {
  statusCode: number;
  path: string;
  message: string | string[];
  timestamp: string;
  errorType?: string; // רק עבור client errors (4xx)
}
```

**דוגמאות:**

**Client Error (4xx):**
```json
{
  "statusCode": 400,
  "path": "/game/trivia",
  "message": "Invalid trivia request",
  "timestamp": "2025-01-15T10:00:00.000Z",
  "errorType": "ValidationError"
}
```

**Server Error (5xx):**
```json
{
  "statusCode": 500,
  "path": "/game/trivia",
  "message": "Internal server error",
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

**הערה:** Server errors לא כוללים `errorType` כדי למנוע חשיפת מידע רגיש.

### מניעת חשיפת מידע רגיש

**לא חושף:**
- Stack traces (ב-client response)
- מידע פנימי של מערכת
- מיקומי קבצים
- סודות ו-tokens

**חושף:**
- Status code
- Error message (sanitized)
- Path
- Timestamp
- Error type (רק עבור client errors)

### לוגים

**Server Error:**
```typescript
logger.systemError(`Global Exception: ${errorMessage}`, {
  status,
  path: request.url ?? 'unknown',
  method: request.method || 'unknown',
  userAgent: request.headers?.['user-agent'] || 'unknown',
  ip: request.ip || 'unknown',
  errorType,
  stack: getErrorStack(exception),
  timestamp: new Date().toISOString(),
});
```

**הערה:** Authentication/Authorization errors לא נרשמות כאן (כבר נרשמות ב-Guards).

## אינטגרציה עם Guards ו-Pipes

### שגיאות מ-Guards

**AuthGuard:**
```typescript
// auth.guard.ts
throw new UnauthorizedException('Invalid authentication token');
```

**RolesGuard:**
```typescript
// roles.guard.ts
throw new ForbiddenException({
  message: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
  details: { ... }
});
```

**טיפול ב-Filter:**
- Filter מזהה `UnauthorizedException` ו-`ForbiddenException`
- מדלג על רישום (כבר נרשם ב-Guard)
- מחזיר תגובת שגיאה סטנדרטית

### שגיאות מ-Pipes

**Validation Errors:**
```typescript
// triviaRequest.pipe.ts
throw new BadRequestException({
  message: 'Invalid trivia request',
  errors: ['Error 1', 'Error 2'],
  suggestion: 'Try...'
});
```

**טיפול ב-Filter:**
- Filter מזהה validation errors (400 + errors array)
- מחזיר תגובה מפורטת עם errors array
- כולל message ו-errors

## Global Registration

**מיקום:** `server/src/app.module.ts`

```typescript
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // ...
  ],
})
```

**משמעות:**
- Filter פועל גלובלית על כל הבקשות
- תופס כל exception שלא טופל ב-handler
- מעטפת אחרונה לפני שליחת תגובה ללקוח

## Best Practices

### 1. טיפול בשגיאות ב-Handlers

```typescript
// ✅ טוב - טיפול בשגיאה ב-handler
@Controller('game')
export class GameController {
  @Post('trivia')
  async getTrivia(@Body() body: TriviaRequestDto) {
    try {
      return await this.gameService.getTrivia(body);
    } catch (error) {
      if (error instanceof SpecificError) {
        throw new BadRequestException('Specific error message');
      }
      throw error; // Filter יתפס
    }
  }
}
```

### 2. שימוש בשגיאות ספציפיות

```typescript
// ✅ טוב - שגיאה ספציפית
throw new BadRequestException('Invalid input');

// ❌ רע - שגיאה כללית
throw new Error('Something went wrong');
```

### 3. מניעת חשיפת מידע רגיש

```typescript
// ✅ טוב - error message סניטרי
throw new InternalServerErrorException('Internal server error');

// ❌ רע - חשיפת מידע רגיש
throw new InternalServerErrorException(`Database connection failed: ${dbPassword}`);
```

## הפניות

- [Guards](./GUARDS.md) - Guards שמזריקים שגיאות
- [Pipes](./PIPES.md) - Pipes שמזריקים validation errors
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - סדר ביצוע Filters
- [Common Structure](./README.md) - סקירה כללית
