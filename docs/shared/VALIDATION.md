# Shared Validation

תיעוד שכבת הולידציה (מודל מיושר שרת/לקוח + LanguageTool).

## מטרות
- אחידות כללי אימות בין שרת ללקוח
- מניעת כפילות Regex / כללי אורך
- שימוש חוזר בסכמות מרכזיות

## מבנה
```
shared/validation/
  difficulty.validation.ts
  points.validation.ts
  payment.validation.ts
  trivia.validation.ts
  schemas.ts          # סכמות כלליות / Primitive Builders
  validation.utils.ts # פונקציות טהורות בלבד, ללא IO
```

## עקרון סכמות
```typescript
export interface ValidationResult { valid: boolean; errors?: string[]; }

export function validateDifficulty(value: string): ValidationResult {
  const allowed = ['easy','medium','hard'];
  return allowed.includes(value)
    ? { valid: true }
    : { valid: false, errors: ['DIFFICULTY_INVALID'] };
}
```

## שימוש בצד השרת
```typescript
const diff = validateDifficulty(dto.difficulty);
if (!diff.valid) throw new BadRequestException(diff.errors);
```

## שימוש בצד הלקוח
```typescript
const r = validateDifficulty(form.difficulty);
if (!r.valid) setFormError('difficulty', 'ערך לא חוקי');
```

## הנחיות
- שמות שגיאה בקונבנציית UPPER_SNAKE
- החזרת מבנה אחיד (valid + errors?)
- ללא זריקת חריגים בספריית shared (Return Object בלבד)

---

## LanguageTool – מדיניות שימוש

- Client → Server בלבד: הלקוח אינו מתקשר ישירות ל‑LanguageTool; הוא קורא ל־`POST /game/validate-language`.
- Server Runtime: שימוש ב־`LanguageToolService` לקריאת API חיצוני; Masking בלוגים, Timeout/Retry.
- Fallback: כאשר השירות החיצוני לא זמין → שימוש בפונקציה טהורה מ־shared: `performLocalLanguageValidation`.
- Cache קצר־טווח בשרת לקריאות זהות (TTL ~30s) להפחתת Latency ועלויות.
- Debounce בלקוח לפני קריאה ל־endpoint כדי לצמצם עומס.

### שמות פונקציות
- Shared: `performLocalLanguageValidation` / `performLocalLanguageValidationAsync` (טהור, ללא IO)
- Server: `ValidationService.validateInputWithLanguageTool` (מחליט בין External API ↔ Local)

### טיפוסים
- `LanguageValidationOptions`, `LanguageValidationResult` תחת `shared/types/domain/validation` כמקור אמת.

---
 
