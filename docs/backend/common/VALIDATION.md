# Validation - Common Structure

תיעוד מפורט על Validation Service ו-LanguageTool Service, כולל כל הולידציות הזמינות ושימוש.

## סקירה כללית

Validation Service מספק ולידציה משותפת לכל השרת, תוך שימוש בפונקציות ולידציה משותפות מ-`@shared/utils` ו-`@shared/validation`.

**מיקום:** `server/src/common/validation/`

**קבצים:**
- `validation.service.ts` - שירות ולידציה מרכזי
- `languageTool.service.ts` - שירות אינטגרציה עם LanguageTool API
- `validation.module.ts` - מודול ולידציה

## Validation Service

**מיקום:** `server/src/common/validation/validation.service.ts`

**תפקיד:**
- ולידציה של נתוני קלט (username, email, password, וכו')
- שימוש בפונקציות ולידציה משותפות
- רישום לוגים מפורטים
- סניטיזציה של קלט

### ולידציות זמינות

#### 1. validateUsername(value: string, options?: ValidationOptions)

**תפקיד:** ולידציה של username.

**ולידציות:**
- אורך: מ-3 עד 30 תווים
- תווים מותרים: אותיות, מספרים, underscore, hyphen
- לא מתחיל/מסתיים ב-underscore או hyphen
- שימוש ב-`validateUsername()` מ-`@shared/utils`

**דוגמה:**
```typescript
const result = await validationService.validateUsername('john_doe');
// { isValid: true, errors: [] }
```

#### 2. validateEmail(value: string, options?: ValidationOptions)

**תפקיד:** ולידציה של email.

**ולידציות:**
- פורמט email תקין
- סניטיזציה (הסרת רווחים, וכו')
- שימוש ב-`validateEmail()` מ-`@shared/utils`

**דוגמה:**
```typescript
const result = await validationService.validateEmail('user@example.com');
// { isValid: true, errors: [] }
```

#### 3. validatePassword(value: string, options?: ValidationOptions)

**תפקיד:** ולידציה של password.

**ולידציות:**
- אורך: מ-6 עד 15 תווים
- שימוש ב-`validatePassword()` מ-`@shared/utils`

**הערה:** Password לא נרשם בלוגים (REDACTED).

**דוגמה:**
```typescript
const result = await validationService.validatePassword('password123');
// { isValid: true, errors: [] }
```

#### 4. validateInputContent(value: string, options?: ValidationOptions)

**תפקיד:** ולידציה של תוכן כללי (שאלות, תשובות, וכו').

**ולידציות:**
- אורך מינימלי ומקסימלי
- בדיקת תווים מותרים
- סניטיזציה (הסרת HTML tags)
- שימוש ב-`validateInputContent()` מ-`@shared/utils`

**דוגמה:**
```typescript
const result = await validationService.validateInputContent('What is the capital of France?');
// { isValid: true, errors: [] }
```

#### 5. validateCustomDifficultyText(value: string, options?: ValidationOptions)

**תפקיד:** ולידציה של קושי מותאם.

**ולידציות:**
- אורך מינימלי ומקסימלי
- בדיקת תווים מותרים
- שימוש ב-`validateCustomDifficultyText()` מ-`@shared/validation`

**דוגמה:**
```typescript
const result = await validationService.validateCustomDifficultyText('Very Hard');
// { isValid: true, errors: [] }
```

#### 6. validateTopicLength(value: string, options?: ValidationOptions)

**תפקיד:** ולידציה של אורך נושא (topic).

**ולידציות:**
- אורך מינימלי ומקסימלי (לפי VALIDATION_LIMITS)
- סניטיזציה
- שימוש ב-`validateTopicLength()` מ-`@shared/utils`

**דוגמה:**
```typescript
const result = await validationService.validateTopicLength('Science');
// { isValid: true, errors: [] }
```

#### 7. validateTriviaRequest(topic: string, difficulty: GameDifficulty, count: number)

**תפקיד:** ולידציה של trivia request מלא.

**ולידציות:**
- **Topic:** ולידציית אורך דרך `validateTopicLength()`
- **Difficulty:** בדיקת difficulty תקין (VALID_DIFFICULTIES) או custom difficulty
- **Requested Questions:** בדיקת טווח (MIN-MAX לפי VALIDATION_LIMITS.REQUESTED_QUESTIONS)

**דוגמה:**
```typescript
const result = await validationService.validateTriviaRequest(
  'Science',
  'medium',
  10
);
// { isValid: true, errors: [] }
```

#### 8. validateCreditsPurchase(userId: string, packageId: string)

**תפקיד:** ולידציה של בקשת רכישת קרדיטים.

**ולידציות:**
- **User ID:** חייב להיות לא ריק
- **Package ID:** פורמט תקין (`package_<number>`) וטווח נקודות (1-10000)

**דוגמה:**
```typescript
const result = await validationService.validatePointsPurchase(
  'user-id-123',
  'package_100'
);
// { isValid: true, errors: [] }
```

#### 9. validatePaymentData(data: PersonalPaymentData | CreatePaymentDto)

**תפקיד:** ולידציה של נתוני תשלום.

**ולידציות לפי Payment Method:**
- **MANUAL_CREDIT:** Card Number, CVV, Expiry Date, Cardholder Name
- **PAYPAL:** PayPal Order ID או Payment ID
- שיטות אחרות: ולידציה בסיסית

**דוגמה:**
```typescript
const result = await validationService.validatePaymentData({
  paymentMethod: PaymentMethod.MANUAL_CREDIT,
  cardNumber: '4111111111111111',
  cvv: '123',
  expiryDate: '12/25',
  cardHolderName: 'John Doe'
});
// { isValid: true, errors: [] }
```

#### 10. validateAnalyticsEvent(eventData: AnalyticsEventData)

**תפקיד:** ולידציה של נתוני analytics event.

**ולידציות:**
- **Event Type:** חייב להיות לא ריק
- **Timestamp:** חייב להיות לא ריק ובפורמט תקין
- **Properties (optional):** אם קיים → חייב להיות object

**דוגמה:**
```typescript
const result = await validationService.validateAnalyticsEvent({
  eventType: 'game_started',
  timestamp: '2025-01-15T10:00:00.000Z',
  properties: { topic: 'Science', difficulty: 'medium' }
});
// { isValid: true, errors: [] }
```

#### 11. validateGameAnswer(answer: string, options?: ValidationOptions)

**תפקיד:** ולידציה של תשובת משחק.

**ולידציות:**
- אורך: לא ריק, מקסימום 1000 תווים
- בדיקת תוכן לא הולם (spam, fake, dummy)
- בדיקת חזרתיות מוגזמת

**דוגמה:**
```typescript
const result = await validationService.validateGameAnswer('Paris');
// { isValid: true, errors: [] }
```

#### 12. validateUserProfile(profileData: UpdateUserProfileData, options?: ValidationOptions)

**תפקיד:** ולידציה של נתוני פרופיל משתמש.

**ולידציות:**
- **Username (optional):** אם קיים → `validateUsername()`
- **FirstName (optional):** מקסימום 50 תווים, רק אותיות, רווחים, apostrophes, ו-hyphens
- **LastName (optional):** מקסימום 50 תווים, רק אותיות, רווחים, apostrophes, ו-hyphens

**דוגמה:**
```typescript
const result = await validationService.validateUserProfile({
  username: 'john_doe',
  firstName: 'John',
  lastName: 'Doe'
});
// { isValid: true, errors: [] }
```

#### 14. validateCreditsAmount(amount: number)

**תפקיד:** ולידציה של סכום קרדיטים.

**ולידציות:**
- חייב להיות >= 0
- חייב להיות <= 100,000
- חייב להיות מספר שלם

**דוגמה:**
```typescript
const result = await validationService.validateCreditsAmount(100);
// { isValid: true, errors: [] }
```

#### 15. validateInputWithLanguageTool(value: string, options?: LanguageValidationOptions)

**תפקיד:** ולידציית שפה עם LanguageTool API (איות ודקדוק).

**ולידציות:**
- אם LanguageTool זמין → שימוש ב-LanguageTool API
- אם לא זמין → fallback ל-local validation (`performLocalLanguageValidationAsync`)
- תמיכה ב-`enableSpellCheck` ו-`enableGrammarCheck`

**דוגמה:**
```typescript
const result = await validationService.validateInputWithLanguageTool(
  'What is the captal of France?',
  { enableSpellCheck: true, enableGrammarCheck: true }
);
// { isValid: false, errors: ['Possible spelling mistake...'], suggestion: 'capital' }
```

### Validation Result Format

**פורמט:**
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  suggestion?: string;
}
```

**דוגמה - Success:**
```typescript
{
  isValid: true,
  errors: []
}
```

**דוגמה - Failed:**
```typescript
{
  isValid: false,
  errors: [
    'Username must be between 3 and 30 characters',
    'Username can only contain letters, numbers, underscore, and hyphen'
  ],
  suggestion: 'Try a username between 3-30 characters'
}
```

### Sanitization

כל הולידציות מתחילות בסניטיזציה:

**1. Sanitize Input:**
```typescript
const sanitizedValue = sanitizeInput(value);
// הסרת HTML tags, trimming, וכו'
```

**2. Sanitize Email:**
```typescript
const sanitizedEmail = sanitizeEmail(sanitizedValue);
// ניקוי email ספציפי
```

**3. Sanitize Card Number:**
```typescript
const sanitizedCard = sanitizeCardNumber(value);
// הסרת רווחים וטאבים
```

### לוגים

**Validation Start:**
```typescript
logger.validationDebug('username', value, 'validation_start');
```

**Validation Success:**
```typescript
logger.validationInfo('username', value, 'validation_success');
```

**Validation Failed:**
```typescript
logger.validationWarn('username', value, 'validation_failed', {
  errors: result.errors,
});
```

**Validation Error:**
```typescript
logger.validationError('username', value, 'validation_error', {
  error: getErrorMessage(error),
});
```

## LanguageTool Service

**מיקום:** `server/src/common/validation/languageTool.service.ts`

**תפקיד:**
- אינטגרציה עם LanguageTool API
- בדיקת דקדוק ואיות
- תמיכה בשפות שונות
- Retry logic ו-timeout handling

### זמינות

**בדיקת זמינות:**
```typescript
const isAvailable = await languageToolService.isAvailable();
```

**Endpoint:** `GET /languages` (LanguageTool API)

### בדיקת טקסט

**checkText(text: string, options?: LanguageToolCheckOptions)**

**תפקיד:** בדיקת טקסט עם LanguageTool API.

**פרמטרים:**
- `text` (string) - הטקסט לבדיקה
- `options` (optional):
  - `language` - שפה לבדיקה (default: English)
  - `enableGrammarCheck` - הפעלת בדיקת דקדוק (default: true)
  - `enableSpellCheck` - הפעלת בדיקת איות (default: true)

**תגובה:**
```typescript
interface LanguageToolResponse {
  matches: Array<{
    message: string;
    shortMessage: string;
    replacements: Array<{ value: string }>;
    // ...
  }>;
}
```

**דוגמה:**
```typescript
const result = await languageToolService.checkText(
  'What is the captal of France?',
  { language: 'en' }
);

// result.matches מכיל שגיאות (למשל: "captal" → "capital")
```

### תכונות

**1. Retry Logic:**
- מספר ניסיונות: `LANGUAGE_TOOL_CONSTANTS.MAX_RETRIES` (default: 3)
- Retry על שגיאות network/timeout

**2. Timeout:**
- Timeout לכל request: `LANGUAGE_TOOL_CONSTANTS.TIMEOUT` (default: 5000ms)

**3. API Key (Optional):**
- תמיכה ב-API key דרך `LANGUAGE_TOOL_API_KEY` env var
- הוספה ל-`Authorization: Bearer <key>` header

**4. Languages:**
- תמיכה בשפות שונות
- Default: English
- הגדרה דרך `options.language`

### אינטגרציה עם ValidationService

`ValidationService` משתמש ב-`LanguageToolService` לוולידציית שפה מורכבת:

```typescript
// validation.service.ts
constructor(private readonly languageToolService: LanguageToolService) {}

// שימוש:
const languageResult = await this.languageToolService.checkText(text, options);
```

## Validation Module

**מיקום:** `server/src/common/validation/validation.module.ts`

**תפקיד:**
- הגדרת ValidationModule
- Export של ValidationService ו-LanguageToolService
- זמינות ב-feature modules

### שימוש במודולים

```typescript
// game.module.ts
import { ValidationModule } from '../../common/validation/validation.module';

@Module({
  imports: [ValidationModule, ...],
  providers: [
    TriviaRequestPipe, // משתמש ב-ValidationService
    // ...
  ],
})
export class GameModule {}
```

## אינטגרציה עם Pipes

כל ה-Pipes משתמשים ב-ValidationService:

```typescript
// triviaRequest.pipe.ts
constructor(private readonly validationService: ValidationService) {}

async transform(value: TriviaRequest | string): Promise<TriviaRequest> {
  const triviaValidation = await this.validationService.validateTriviaRequest(
    payload.topic,
    payload.difficulty,
    payload.requestedQuestions
  );
  // ...
}
```

## Best Practices

### 1. שימוש ב-ValidationService עבור ולידציה עסקית

```typescript
// ✅ טוב - ולידציה עסקית דרך ValidationService
const result = await validationService.validateTriviaRequest(topic, difficulty, count);

// ❌ רע - ולידציה ישירה בקוד
if (count < 1 || count > 100) {
  throw new BadRequestException();
}
```

### 2. שימוש בפונקציות משותפות

```typescript
// ✅ טוב - שימוש בפונקציה משותפת
const result = validateUsername(value); // מ-@shared/utils

// ❌ רע - ולידציה כפולה
const result = this.customValidateUsername(value); // כפילות
```

### 3. סניטיזציה לפני ולידציה

```typescript
// ✅ טוב - סניטיזציה לפני ולידציה
const sanitizedValue = sanitizeInput(value);
const result = validateUsername(sanitizedValue);

// ❌ רע - ולידציה ללא סניטיזציה
const result = validateUsername(value); // עלול להיכשל על input לא נקי
```

### 4. לוגים מפורטים

```typescript
// ✅ טוב - לוגים מפורטים
logger.validationDebug('username', value, 'validation_start');
logger.validationInfo('username', value, 'validation_success');

// ❌ רע - ללא לוגים
// ולידציה ללא מעקב
```

### 5. טיפול ב-null/undefined

```typescript
// ✅ טוב - שימוש ב-nullish coalescing
const sanitized = sanitizeInput(value ?? '');
const logFailures = options?.logFailures ?? true;

// ✅ טוב - בדיקת null/undefined
if (value == null) {
  return { isValid: false, errors: ['Value is required'] };
}

// ❌ רע - שימוש ב-|| עבור ערכים שעשויים להיות 0/false
const timeout = options?.timeout || 5000; // 0 יהפוך ל-5000!

// ראה מדיניות מלאה: ../../shared/NULL_UNDEFINED_POLICY.md
```

## הפניות

- [Pipes](./PIPES.md) - איך Pipes משתמשים ב-ValidationService
- [Shared Validation](../../shared/VALIDATION.md) - ולידציות משותפות מ-`@shared/validation`
- [Shared Utils](../../shared/LOGGING_MONITORING.md) - פונקציות ולידציה מ-`@shared/utils`
- **[Null/Undefined Policy](../../shared/NULL_UNDEFINED_POLICY.md)** - מדיניות טיפול ב-null ו-undefined
- [Common Structure](./README.md) - סקירה כללית
