# Validation - Common Structure

תיעוד על שימוש בולידציה בצד השרת ו-LanguageTool Service.

## סקירה כללית

בפרויקט **אין** קובץ `validation.service.ts`. Pipes ו-Services משתמשים **ישירות** ב-`@shared/validation` וב-`@shared/constants` לכללי ולידציה (topic, difficulty, email, password, name, payment, וכו'). רשימת פונקציות הוולידציה והשימוש בהן מתועדת ב-[docs/shared/VALIDATION.md](../../shared/VALIDATION.md).

**מיקום:** `server/src/common/validation/`

**קבצים:**
- `languageTool.service.ts` – שירות אינטגרציה עם LanguageTool API (ולידציית שפה, איות, דקדוק)
- `language.validation.ts` – fallback לוקאלי כש-LanguageTool לא זמין
- `validation.module.ts` – מודול Nest (מספק LanguageToolService)
- `difficulty.validation.ts` – פונקציה שרתית `restoreGameDifficulty` (משתמשת ב-`@shared/validation`)

## שימוש בולידציה בשרת

- **TriviaRequestPipe**: קורא ל-`validateTriviaRequest(payload.topic, payload.difficulty)` מ-`@shared/validation` אחרי בניית ה-payload; אם `!result.isValid` זורק `BadRequestException` עם `result.errors`.
- **CustomDifficultyPipe**: קורא ל-`validateCustomDifficultyText` מ-`@shared/validation` ואז ל-`LanguageToolService.checkText`.
- **PaymentDataPipe**: קורא ל-`validateStringLength` (מפתח `CARDHOLDER_NAME`), `validateExpiryDate`, `validateCVV`, `isValidCardNumber` מ-`@shared/validation`.
- **UserDataPipe**: קורא ל-`validateStringLength` (מפתחות `FIRST_NAME`, `LAST_NAME`) מ-`@shared/validation`.
- **DTOs**: משתמשים ב-`VALIDATION_LENGTH`, `VALIDATION_COUNT` מ-`@shared/constants` וב-decorators של class-validator (כולל `@IsGameDifficulty` שמבוסס על `@shared/validation`).

---

## Reference: פונקציות ולידציה משותפות (מקור: shared)

להרשימה המלאה והדוגמאות ראו [docs/shared/VALIDATION.md](../../shared/VALIDATION.md). סיכום קצר:

### פונקציות רלוונטיות (מ-@shared/validation / @shared/utils)

- `validateStringLength` + `validateNoForbiddenWords` עם מפתח `'TOPIC'`/`'CUSTOM_DIFFICULTY'`, `validateTriviaRequest`, `validateTriviaInputQuick` – נושא וקושי
- `validateCustomDifficultyText`, `createCustomDifficulty`, `isCustomDifficulty`, `isRegisteredDifficulty` – קושי מותאם
- `validateEmail`, `validateStringLength` (מפתחות `PASSWORD`, `FIRST_NAME`, `LAST_NAME`, `CARDHOLDER_NAME` וכו'), `validatePasswordMatch` – משתמש ותשלום
- `validateExpiryDate`, `validateCVV`, `isValidCardNumber`, `isPaymentMethod` – תשלום
- `VALIDATORS`, `isUuid`, `isRoomId`, `isGameDifficulty` – type guards וכללים

**תפקיד:** ולידציה של topic + difficulty (אורך נושא, קושי רשום או קושי מותאם). משמש ב-TriviaRequestPipe.

**דוגמה:**
```typescript
import { validateTriviaRequest } from '@shared/validation';

const result = validateTriviaRequest(payload.topic, payload.difficulty);
if (!result.isValid) {
  throw new BadRequestException({ message: 'Trivia request validation failed', errors: result.errors });
}
```

---

## LanguageTool וולידציית שפה

### validateInputWithLanguageTool / LanguageToolService.checkText(value: string, options?)

**תפקיד:** ולידציית שפה עם LanguageTool API (איות ודקדוק).

**ולידציות:**
- אם LanguageTool זמין → שימוש ב-LanguageTool API
- אם לא זמין → fallback ל-local validation (`performLocalLanguageValidationAsync`)
- תמיכה ב-`enableSpellCheck` ו-`enableGrammarCheck`

**דוגמה:**
```typescript
const result = await this.languageToolService.checkText(text, {
  enableSpellCheck: true,
  enableGrammarCheck: true,
});
// { isValid: false, errors: [...], suggestions: ['capital'] }
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

### שימוש ב-LanguageToolService

CustomDifficultyPipe ו-endpoint לולידציית טקסט (validate-text) מזריקים את `LanguageToolService` ומשתמשים ב-`checkText`:

```typescript
const result = await this.languageToolService.checkText(text, {
  enableSpellCheck: true,
  enableGrammarCheck: true,
});
```

## Validation Module

**מיקום:** `server/src/common/validation/validation.module.ts`

**תפקיד:**
- הגדרת ValidationModule
- Export של LanguageToolService בלבד (אין ValidationService)
- זמינות ב-GameModule וכו' עבור Pipes שצריכים LanguageTool

### שימוש במודולים

```typescript
// game.module.ts
import { ValidationModule } from '../../common/validation';

@Module({
  imports: [ValidationModule, ...],
  providers: [TriviaRequestPipe, ...],
})
export class GameModule {}
```

## אינטגרציה עם Pipes

ה-Pipes משתמשים ישירות ב-`@shared/validation` וב-`LanguageToolService` (כשנדרש):

```typescript
// triviaRequest.pipe.ts
import { validateTriviaRequest } from '@shared/validation';

const triviaValidation = validateTriviaRequest(payload.topic, payload.difficulty);
if (!triviaValidation.isValid) {
  throw new BadRequestException({ message: '...', errors: triviaValidation.errors });
}
```

## Best Practices

### 1. שימוש ב-@shared/validation לוולידציה עסקית

```typescript
// ✅ טוב - ולידציה עסקית מפונקציות משותפות
const result = validateTriviaRequest(topic, difficulty);
if (!result.isValid) throw new BadRequestException({ errors: result.errors });

// ❌ רע - ולידציה ישירה בקוד
if (count < 1 || count > 100) throw new BadRequestException();
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

- [Pipes](./PIPES.md) - איך Pipes משתמשים ב-@shared/validation וב-LanguageToolService
- [Shared Validation](../../shared/VALIDATION.md) - ולידציות משותפות מ-`@shared/validation`
- [Shared Utils](../../shared/LOGGING_MONITORING.md) - פונקציות ולידציה מ-`@shared/utils`
- **[Null/Undefined Policy](../../shared/NULL_UNDEFINED_POLICY.md)** - מדיניות טיפול ב-null ו-undefined
- [Common Structure](./README.md) - סקירה כללית
