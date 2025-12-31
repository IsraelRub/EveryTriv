# Pipes - Common Structure

תיעוד מפורט על Pipes ב-NestJS, כולל כל ה-Pipes הזמינים: TriviaRequestPipe, GameAnswerPipe, CustomDifficultyPipe, PaymentDataPipe, ו-UserDataPipe.

## סקירה כללית

Pipes ב-NestJS אחראים לוולידציה וטרנספורמציה של נתוני קלט לפני הגעתם ל-handler.

**מיקום:** `server/src/common/pipes/`

**קבצים:**
- `triviaRequest.pipe.ts` - Pipe לוולידציית trivia requests
- `gameAnswer.pipe.ts` - Pipe לוולידציית תשובות משחק
- `customDifficulty.pipe.ts` - Pipe לוולידציית קושי מותאם
- `paymentData.pipe.ts` - Pipe לוולידציית נתוני תשלום
- `userData.pipe.ts` - Pipe לוולידציית נתוני משתמש

**סדר ביצוע:**
1. Middleware
2. Guards
3. Interceptors (לפני handler)
4. **Pipes** ← כאן
5. Controller Handler

## Trivia Request Pipe

**מיקום:** `server/src/common/pipes/triviaRequest.pipe.ts`

**תפקיד:**
- ולידציה של trivia request data (topic, difficulty, requestedQuestions)
- טרנספורמציה ונורמליזציה של נתונים
- שימוש ב-ValidationService לוולידציה עסקית

### ולידציות

**1. Question Count:**
- חייב להיות מספר שלם
- חייב להיות גדול מ-0
- מוגבל ל-MAX_QUESTIONS_PER_REQUEST

**2. Topic:**
- חייב להיות string לא ריק
- בדיקת אורך (min/max)
- ולידציה עסקית דרך ValidationService

**3. Difficulty:**
- חייב להיות difficulty תקין (VALID_DIFFICULTIES)
- או custom difficulty (CUSTOM_DIFFICULTY_PREFIX)
- ולידציה עסקית דרך ValidationService

### דוגמאות שימוש

```typescript
@Controller('game')
export class GameController {
  @Post('trivia')
  async getTrivia(
    @Body(TriviaRequestPipe) body: TriviaRequestDto,
    @CurrentUserId() userId: string
  ) {
    // body כבר עבר ולידציה וטרנספורמציה
    return this.gameService.getTriviaQuestion(body, userId);
  }
}
```

**וולידציות:**
```typescript
// ✅ תקין
{
  topic: "Science",
  difficulty: "medium",
  requestedQuestions: 10
}

// ❌ שגיאה - requestedQuestions לא תקין
{
  topic: "Science",
  difficulty: "medium",
  requestedQuestions: 0 // ← חייב להיות > 0
}

// ❌ שגיאה - topic ריק
{
  topic: "", // ← חייב להיות לא ריק
  difficulty: "medium",
  requestedQuestions: 10
}
```

### אינטגרציה עם ValidationService

```typescript
// triviaRequest.pipe.ts
const triviaValidation = await this.validationService.validateTriviaRequest(
  payload.topic,
  payload.difficulty,
  payload.requestedQuestions
);

if (!triviaValidation.isValid) {
  errors.push(...triviaValidation.errors);
}
```

## Game Answer Pipe

**מיקום:** `server/src/common/pipes/gameAnswer.pipe.ts`

**תפקיד:**
- ולידציה של game answer submission
- בדיקת תוכן תשובה (content validation)

### ולידציות

**1. Answer Content:**
- בדיקת תוכן תשובה (אורך, תווים, וכו')
- שימוש ב-ValidationService.validateInputContent()

### דוגמאות שימוש

```typescript
@Controller('game')
export class GameController {
  @Post('answer')
  async submitAnswer(
    @Body(GameAnswerPipe) body: GameAnswerSubmission,
    @CurrentUserId() userId: string
  ) {
    // body כבר עבר ולידציה
    return this.gameService.submitAnswer(body, userId);
  }
}
```

## Custom Difficulty Pipe

**מיקום:** `server/src/common/pipes/customDifficulty.pipe.ts`

**תפקיד:**
- ולידציה של custom difficulty text
- שימוש ב-ValidationService.validateCustomDifficultyText()

### ולידציות

**1. Custom Text:**
- בדיקת אורך (min/max)
- בדיקת תווים מותרים
- ולידציה עסקית דרך ValidationService

### דוגמאות שימוש

```typescript
@Controller('game')
export class GameController {
  @Post('custom-difficulty')
  async createCustomDifficulty(
    @Body(CustomDifficultyPipe) body: { customText: string }
  ) {
    // body.customText כבר עבר ולידציה
    return this.gameService.createCustomDifficulty(body.customText);
  }
}
```

## Payment Data Pipe

**מיקום:** `server/src/common/pipes/paymentData.pipe.ts`

**תפקיד:**
- ולידציה של payment data לפי payment method
- תמיכה ב-MANUAL_CREDIT, PAYPAL, וכו'

### ולידציות לפי Payment Method

**1. MANUAL_CREDIT:**
- Card Number: 13-19 ספרות
- CVV: 3-4 ספרות
- Expiry Date: MM/YY format
- Cardholder Name: 2-50 תווים
- בדיקת תאריך תפוגה (לא פג)

**2. PAYPAL:**
- PayPal Order ID או Payment ID
- בדיקת אורך ואימות

**3. Other Methods:**
- ולידציה בסיסית בלבד

### דוגמאות שימוש

```typescript
@Controller('payment')
export class PaymentController {
  @Post('create')
  async createPayment(
    @Body(PaymentDataPipe) body: PersonalPaymentData | CreatePaymentDto,
    @CurrentUserId() userId: string
  ) {
    // body כבר עבר ולידציה לפי payment method
    return this.paymentService.createPayment(body, userId);
  }
}
```

**ולידציות:**
```typescript
// ✅ תקין - MANUAL_CREDIT
{
  paymentMethod: PaymentMethod.MANUAL_CREDIT,
  cardNumber: "4111111111111111",
  cvv: "123",
  expiryDate: "12/25",
  cardHolderName: "John Doe"
}

// ❌ שגיאה - CVV לא תקין
{
  paymentMethod: PaymentMethod.MANUAL_CREDIT,
  cardNumber: "4111111111111111",
  cvv: "12", // ← חייב להיות 3-4 ספרות
  expiryDate: "12/25"
}

// ✅ תקין - PAYPAL
{
  paymentMethod: PaymentMethod.PAYPAL,
  paypalOrderId: "PAYPAL-ORDER-123456"
}
```

## User Data Pipe

**מיקום:** `server/src/common/pipes/userData.pipe.ts`

**תפקיד:**
- ולידציה של user profile data
- בדיקת username, firstName, lastName

### ולידציות

**1. Username (optional):**
- אם קיים → ולידציה דרך ValidationService.validateUsername()
- בדיקת אורך, תווים מותרים, וכו'

**2. First Name (optional):**
- אם קיים → ולידציית תוכן דרך ValidationService.validateInputContent()

**3. Last Name (optional):**
- אם קיים → ולידציית תוכן דרך ValidationService.validateInputContent()

**הערה:** Password validation מטופל בנפרד ב-AuthService.

### דוגמאות שימוש

```typescript
@Controller('users')
export class UserController {
  @Put('profile')
  async updateProfile(
    @Body(UserDataPipe) body: UpdateUserProfileData,
    @CurrentUserId() userId: string
  ) {
    // body כבר עבר ולידציה
    return this.userService.updateUserProfile(userId, body);
  }
}
```

**ולידציות:**
```typescript
// ✅ תקין
{
  username: "john_doe",
  firstName: "John",
  lastName: "Doe"
}

// ✅ תקין - רק חלק מהשדות
{
  firstName: "John"
}

// ❌ שגיאה - username לא תקין
{
  username: "a" // ← קצר מדי
}
```

## אינטגרציה עם ValidationService

כל ה-Pipes משתמשים ב-ValidationService לוולידציה עסקית:

```typescript
// pipes משתמשים ב-ValidationService
constructor(private readonly validationService: ValidationService) {}

// לדוגמה:
const validationResult = await this.validationService.validateTriviaRequest(
  topic,
  difficulty,
  requestedQuestions
);
```

## אינטגרציה עם לוגים

כל ה-Pipes רושמים לוגים מפורטים:

**Validation Start:**
```typescript
logger.validationDebug('trivia_request', '[REDACTED]', 'validation_start');
```

**Validation Success:**
```typescript
logger.validationInfo('trivia_request', '[REDACTED]', 'validation_success');
```

**Validation Failed:**
```typescript
logger.validationWarn('trivia_request', '[REDACTED]', 'validation_failed', {
  errors,
});
```

**API Call Logging:**
```typescript
logger.apiUpdate('trivia_request_validation', {
  isValid: errors.length === 0,
  errorsCount: errors.length,
  duration: Date.now() - startTime,
});
```

## Error Handling

כל ה-Pipes מחזירים `BadRequestException` עם פרטי שגיאה:

```typescript
throw new BadRequestException({
  message: 'Invalid trivia request',
  errors: ['Error 1', 'Error 2'],
  suggestion: 'Try a more popular topic...'
});
```

**פורמט שגיאה:**
```json
{
  "statusCode": 400,
  "path": "/game/trivia",
  "message": "Invalid trivia request",
  "errors": ["Error 1", "Error 2"],
  "timestamp": "2025-01-15T10:00:00.000Z",
  "errorType": "ValidationError"
}
```

## Best Practices

### 1. שימוש ב-Pipes עבור ולידציה מורכבת

```typescript
// ✅ טוב - Pipe לוולידציה מורכבת
@Post('trivia')
async getTrivia(@Body(TriviaRequestPipe) body: TriviaRequestDto) {}

// ❌ רע - ולידציה ב-handler
@Post('trivia')
async getTrivia(@Body() body: TriviaRequestDto) {
  // ולידציה ב-handler ← לא מומלץ
  if (!body.topic) throw new BadRequestException();
}
```

### 2. שילוב Pipes עם ValidationPipe הגלובלי

```typescript
// ✅ טוב - DTO validation + Custom Pipe
@Post('trivia')
async getTrivia(@Body(TriviaRequestPipe) body: TriviaRequestDto) {}
// ValidationPipe הגלובלי בודק DTO
// TriviaRequestPipe בודק לוגיקה עסקית
```

### 3. Pipe ספציפי לכל סוג נתונים

```typescript
// ✅ טוב - Pipe ספציפי
@Post('payment')
async createPayment(@Body(PaymentDataPipe) body: PaymentData) {}

// ❌ רע - Pipe כללי
@Post('payment')
async createPayment(@Body(ValidationPipe) body: PaymentData) {}
```

## הפניות

- [Validation](./VALIDATION.md) - ValidationService ו-LanguageToolService
- [Request-Response Cycle](../REQUEST_RESPONSE_CYCLE.md) - סדר ביצוע Pipes
- [Guards](./GUARDS.md) - Guards לפני Pipes
- [Filters](./FILTERS.md) - טיפול בשגיאות מ-Pipes
- [Common Structure](./README.md) - סקירה כללית
