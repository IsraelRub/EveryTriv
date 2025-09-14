# Shared Types Layer

תיעוד שכבת הטיפוסים המשותפת.

## ארגון
```
shared/types/
  core/            # טיפוסים בסיסיים (Ids, Pagination, Base Responses)
  domain/          # ישויות לוגיות (Game, Trivia, User, Points)
  infrastructure/  # חוזים טכניים (Cache, Logger, External Providers)
  payment.types.ts
  points.types.ts
  subscription.types.ts
  language.types.ts
  ui.types.ts
```

## מטרות
- חוזה אחיד בין Client ↔ Server
- הקטנת שימוש ב-casting
- קידום בטיחות בזמן קומפילציה

## Response Wrapper בסיסי
```typescript
export interface ApiSuccess<T> { success: true; data: T; }
export interface ApiError { success: false; error: string; code?: string; }
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

## Entity לדוגמה
```typescript
export interface TriviaQuestion {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  answers: string[];
  correctIndex: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

## דוגמת Points
```typescript
export interface PointsTransaction {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  createdAt: string;
}
```

## עקרונות
- אין הזרקת לוגיקה בקבצי טיפוסים
- איסור תלות מעגלית (core לא תלוי ב-domain)
- שימוש ב-`export *` ב-index.ts ליצוא מרוכז

---
 
