# Shared Validation

מסמך זה של שכבת הולידציה.

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
  validation.utils.ts
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
 
