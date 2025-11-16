# Shared Validation - EveryTriv

## סקירה כללית

שכבת הולידציה מספקת כללי אימות אחידים בין שרת ללקוח, מונעת כפילות Regex, ומאפשרת שימוש חוזר בסכמות מרכזיות.

לקשר לדיאגרמות: `../DIAGRAMS.md#validation-flow`

## מבנה תיקיית Validation

```
shared/validation/
├── domain/                    # ולידציות דומיין
│   ├── difficulty.validation.ts # ולידציית קושי
│   ├── trivia.validation.ts     # ולידציית טריוויה
│   ├── payment.validation.ts    # ולידציית תשלום
│   └── index.ts
└── index.ts                   # ייצוא מרכזי
```

## Domain Validation

### difficulty.validation.ts

ולידציה מקיפה לניהול קושי משחק:

```typescript
import { CUSTOM_DIFFICULTY_PREFIX, DifficultyLevel, VALID_DIFFICULTIES } from '@shared/constants';
import type { BaseValidationResult, GameDifficulty } from '@shared/types';

/**
 * Converts GameDifficulty to DifficultyLevel for database storage
 * Custom difficulties are converted to DifficultyLevel.CUSTOM
 */
export function toDifficultyLevel(difficulty: GameDifficulty): DifficultyLevel {
  if (isCustomDifficulty(difficulty)) {
    return DifficultyLevel.CUSTOM;
  }

  const normalizedDifficulty = difficulty.toLowerCase();
  const matchedDifficulty = VALID_DIFFICULTIES.find(level => level.toLowerCase() === normalizedDifficulty);

  if (matchedDifficulty) {
    return matchedDifficulty;
  }

  return DifficultyLevel.MEDIUM;
}

/**
 * Checks if the provided difficulty string represents a custom difficulty
 */
export function isCustomDifficulty(difficulty: string): boolean {
  return difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX);
}

/**
 * Checks if the provided difficulty matches a registered difficulty level
 */
export function isRegisteredDifficulty(difficulty: string): difficulty is DifficultyLevel {
  const normalizedDifficulty = difficulty.toLowerCase();
  return VALID_DIFFICULTIES.some(validDiff => validDiff.toLowerCase() === normalizedDifficulty);
}

/**
 * Checks if a difficulty value is valid (registered or custom)
 */
export function isValidDifficulty(difficulty: string): boolean {
  return isRegisteredDifficulty(difficulty) || isCustomDifficulty(difficulty);
}

/**
 * Extracts the custom difficulty text from a full difficulty string
 */
export function extractCustomDifficultyText(difficulty: string): string {
  if (!isCustomDifficulty(difficulty)) return '';
  return difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
}

/**
 * Creates a custom difficulty string from user input text
 */
export function createCustomDifficulty(text: string): string {
  return `${CUSTOM_DIFFICULTY_PREFIX}${text.trim()}`;
}

/**
 * Gets display text for difficulty with length constraints
 */
export function getDifficultyDisplayText(difficulty: string, maxLength: number = 50): string {
  if (!isCustomDifficulty(difficulty)) {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  }

  const customText = extractCustomDifficultyText(difficulty);
  if (customText.length <= maxLength) {
    return customText;
  }

  return customText.substring(0, maxLength - 3) + '...';
}

/**
 * Gets the score multiplier based on mapped difficulty level
 */
export function getCustomDifficultyMultiplier(mappedDifficulty: DifficultyLevel): number {
  switch (mappedDifficulty) {
    case DifficultyLevel.EASY:
      return 1;
    case DifficultyLevel.MEDIUM:
      return 1.5;
    case DifficultyLevel.HARD:
      return 2;
    default:
      return 1.3;
  }
}

/**
 * Normalizes custom difficulty text for consistent processing
 */
export function normalizeCustomDifficulty(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim();
}

/**
 * Checks if custom difficulty text contains meaningful content
 */
export function hasValidCustomDifficultyContent(text: string): boolean {
  const normalized = normalizeCustomDifficulty(text);

  const meaningfulWords = normalized
    .split(' ')
    .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'that'].includes(word));

  return meaningfulWords.length > 0;
}

/**
 * Validates custom difficulty text input for format and content
 */
export function validateCustomDifficultyText(text: string): BaseValidationResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { isValid: false, errors: ['Please enter a difficulty description'] };
  }

  if (trimmed.length < 3) {
    return {
      isValid: false,
      errors: ['Description must be at least 3 characters long'],
    };
  }

  if (trimmed.length > 200) {
    return {
      isValid: false,
      errors: ['Description must be less than 200 characters'],
    };
  }

  const forbiddenWords = ['spam', 'test', 'xxx'];
  const lowerText = trimmed.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerText.includes(word)) {
      return {
        isValid: false,
        errors: ['Please enter a meaningful difficulty description'],
      };
    }
  }

  return { isValid: true, errors: [] };
}
```

### trivia.validation.ts

ולידציה מקיפה לטריוויה:

```typescript
import { CUSTOM_DIFFICULTY_PREFIX } from '@shared/constants';
import type { TriviaInputValidationResult } from '@shared/types';
import { validateTopicLength } from '@shared/utils';
import { isCustomDifficulty, isRegisteredDifficulty } from './difficulty.validation';

/**
 * Performs quick validation for trivia input without external API calls
 */
export function validateTriviaInputQuick(topic: string, difficulty: string): TriviaInputValidationResult {
  const result: TriviaInputValidationResult = {
    topic: { isValid: true, errors: [] },
    difficulty: { isValid: true, errors: [] },
    overall: { isValid: true, canProceed: true },
  };

  if (!topic.trim()) {
    result.topic.isValid = false;
    result.topic.errors.push('Topic is required');
  } else {
    const topicValidation = validateTopicLength(topic);
    if (!topicValidation.isValid && topicValidation.errors.length > 0) {
      result.topic.isValid = false;
      result.topic.errors.push(topicValidation.errors[0]);
    }
  }

  if (!difficulty) {
    result.difficulty.isValid = false;
    result.difficulty.errors.push('Difficulty is required');
  } else if (isCustomDifficulty(difficulty)) {
    const customText = difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length);
    if (customText.length < 3) {
      result.difficulty.isValid = false;
      result.difficulty.errors.push('Custom difficulty must be at least 3 characters');
    }
  } else {
    if (!isRegisteredDifficulty(difficulty)) {
      result.difficulty.isValid = false;
      result.difficulty.errors.push('Please select a valid difficulty level');
    }
  }

  result.overall.isValid = result.topic.isValid && result.difficulty.isValid;
  result.overall.canProceed = result.overall.isValid;

  return result;
}
```

## שימוש בצד השרת

### Server-side validation

```typescript
import { BadRequestException } from '@nestjs/common';
import { validateCustomDifficultyText, validateTriviaInputQuick } from '@shared/validation';

@Post('trivia')
async getTriviaQuestions(@Body() dto: TriviaRequestDto) {
  const validation = validateTriviaInputQuick(dto.topic, dto.difficulty);
  
  if (!validation.overall.isValid) {
    const errors = [
      ...validation.topic.errors,
      ...validation.difficulty.errors,
    ];
    throw new BadRequestException(errors.join(', '));
  }

  // Continue with trivia generation
}
```

## שימוש בצד הלקוח

### Client-side validation

```typescript
import { validateCustomDifficultyText, validateTriviaInputQuick } from '@shared/validation';

const handleTriviaSubmit = (topic: string, difficulty: string) => {
  const validation = validateTriviaInputQuick(topic, difficulty);
  
  if (!validation.topic.isValid) {
    setTopicError(validation.topic.errors[0]);
    return;
  }
  
  if (!validation.difficulty.isValid) {
    setDifficultyError(validation.difficulty.errors[0]);
    return;
  }
  
  if (!validation.overall.canProceed) {
    return;
  }
  
  // Proceed with trivia request
};
```

## עקרונות עיצוב

### 1. אחידות
- אותם כללי ולידציה ב-client ו-server
- שמות שגיאה בקונבנציית UPPER_SNAKE
- מבנה אחיד של תוצאות ולידציה

### 2. No Side Effects
- פונקציות ולידציה טהורות ללא IO
- אין זריקת חריגים (Return Object בלבד)
- אין תלויות חיצוניות

### 3. Type Safety
- Type guards ל-runtime validation
- Explicit return types
- Type-safe function signatures

### 4. הרחבה
- קל להוסיף ולידציות חדשות
- פונקציות קטנות וממוקדות
- שימוש חוזר ב-utilities

## LanguageTool Integration

### Server-side LanguageTool

הלקוח אינו מתקשר ישירות ל-LanguageTool. הוא קורא ל-`POST /game/validate-language`, והשרת משתמש ב-`LanguageToolService`:

```typescript
// Server-side
@Post('validate-language')
async validateLanguage(@Body() dto: LanguageValidationDto) {
  try {
    const result = await this.languageToolService.validateInput(
      dto.text,
      { enableSpellCheck: true, enableGrammarCheck: true }
    );
    return result;
  } catch (error) {
    // Fallback to local validation
    return performLocalLanguageValidationAsync(dto.text);
  }
}
```

### Fallback Strategy

כאשר השירות החיצוני לא זמין, נעשה שימוש בפונקציה טהורה מ-shared:

```typescript
import { performLocalLanguageValidationAsync } from '@shared/utils';

// Fallback when external service unavailable
const result = await performLocalLanguageValidationAsync(text, {
  enableSpellCheck: true,
  enableGrammarCheck: true,
});
```

### Cache Strategy

Cache קצר-טווח בשרת לקריאות זהות (TTL ~30s):

```typescript
const cacheKey = `lang_validation:${hash(text)}`;
const cached = await cacheService.get(cacheKey);

if (cached) {
  return cached;
}

const result = await languageToolService.validateInput(text);
await cacheService.set(cacheKey, result, 30); // 30 seconds TTL
```

### Debounce בלקוח

Debounce בלקוח לפני קריאה ל-endpoint:

```typescript
import { useDebouncedCallback } from '../hooks';

const debouncedValidate = useDebouncedCallback(
  async (text: string) => {
    const result = await apiService.validateLanguage(text);
    setValidationResult(result);
  },
  500 // 500ms debounce
);
```

## קישורים רלוונטיים

- Types: `./TYPES.md`
- Constants: `./CONSTANTS.md`
- Shared Package: `./SHARED_PACKAGE.md`
- דיאגרמות: [דיאגרמת חבילה משותפת (Shared)](../DIAGRAMS.md#דיאגרמת-חבילה-משותפת-shared)
