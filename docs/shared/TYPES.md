# Shared Types Layer

תיעוד שכבת הטיפוסים המשותפת.

## ארגון
```
shared/types/
  core/            # טיפוסים בסיסיים
  │   ├── data.types.ts
  │   ├── error.types.ts
  │   ├── response.types.ts
  │   └── utility.types.ts
  domain/          # ישויות לוגיות
  │   ├── ai/      # טיפוסי AI
  │   ├── analytics/ # טיפוסי אנליטיקה
  │   ├── game/    # טיפוסי משחק
  │   ├── user/    # טיפוסי משתמש
  │   └── validation/ # טיפוסי ולידציה
  infrastructure/  # חוזים טכניים
  │   ├── api.types.ts
  │   ├── auth.types.ts
  │   ├── cache.types.ts
  │   ├── config.types.ts
  │   ├── http.types.ts
  │   ├── logging.types.ts
  │   ├── redis.types.ts
  │   └── storage.types.ts
  language.types.ts
  payment.types.ts
  points.types.ts
  subscription.types.ts
  ui.types.ts
```

## מטרות
- חוזה אחיד בין Client ↔ Server
- הקטנת שימוש ב-casting
- קידום בטיחות בזמן קומפילציה

## Response Wrapper בסיסי
```typescript
export interface SuccessResponse<T> { success: true; data: T; }
export interface ApiError { success: false; error: string; code?: string; }
export type ApiResponse<T> = SuccessResponse<T> | ApiError;
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
export interface PointTransaction {
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
 
