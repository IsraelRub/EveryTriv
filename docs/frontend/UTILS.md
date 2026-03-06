# Utils - Frontend

תיעוד כל הפונקציות השירותיות (Utilities) ב-Frontend, מאורגנות לפי תחומי אחריות.

לקשר לדיאגרמות:
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## מבנה תיקיית Utils

```
client/src/utils/
├── core/
│   ├── cn.utils.ts                 # פונקציות class names (cn)
│   ├── format.utils.ts             # פונקציות עיצוב (כולל זמן)
│   └── index.ts                    # ייצוא מאוחד
├── domain/                         # פונקציות domain-specific
├── infrastructure/                 # פונקציות infrastructure
├── validation/                     # פונקציות validation
└── index.ts                        # ייצוא מאוחד
```

## Format Utils

### format.utils.ts

פונקציות עיצוב ופורמט:

**formatTime:**
```typescript
export function formatTime(totalSeconds: number): string
```

מעצב זמן בפורמט MM:SS:
```typescript
formatTime(125); // "02:05"
formatTime(3661); // "61:01"
```

**formatPlayTime:**
```typescript
export function formatPlayTime(time: number, unit: 'seconds' | 'minutes' = 'seconds'): string
```

מעצב משך זמן לקריאה (שעות ודקות):
```typescript
formatPlayTime(3665); // "1h 1m"
formatPlayTime(90, 'seconds'); // "1m"
formatPlayTime(0); // "0m"
```

**formatDate:**
```typescript
export function formatDate(date: Date | string | null | undefined, defaultValue: string = '-'): string
```

מעצב תאריך בפורמט DD/MM/YYYY (מקור: shared):
```typescript
formatDate(new Date('2024-01-15')); // "15/01/2024"
formatDate('2024-01-15'); // "15/01/2024"
formatDate(null); // "-"
```

**formatDateShort:**
```typescript
export function formatDateShort(date: Date | string | null | undefined, defaultValue: string = '-'): string
```

תאריך קצר DD/MM (ללא שנה):
```typescript
formatDateShort(new Date('2024-01-15')); // "15/01"
```

**formatDateTime:**
```typescript
export function formatDateTime(date: Date | string | null | undefined, defaultValue: string = '-'): string
```

תאריך ושעה DD/MM/YYYY HH:mm:
```typescript
formatDateTime(new Date('2024-01-15T14:30:00')); // "15/01/2024 14:30"
formatDateTime(null, 'Never'); // "Never"
```

## Class Names Utils

### cn.utils.ts

פונקציות class names:

**cn:**
```typescript
export function cn(...inputs: ClassValue[]): string
```

משלב class names עם תמיכה ב-Tailwind merge:
- משתמש ב-`clsx` לשילוב conditional classes
- משתמש ב-`twMerge` למיזוג נכון של Tailwind classes
- מונע קונפליקטים בין classes

**Usage:**
```typescript
import { cn } from '@utils';

const className = cn(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  'text-white',
  'px-6' // זה יחליף את px-4
); // "py-2 bg-blue-500 text-white px-6"
```

## Index

### index.ts

Barrel exports לכל ה-utils:

```typescript
export * from './cn.utils';
export * from './format.utils';
```

**Usage:**
```typescript
import { 
  cn,
  formatTime,
  formatPlayTime,
  formatDate,
  formatDateShort,
  formatDateTime
} from '@utils';
```

## עקרונות עיצוב

### 1. ארגון לפי תחום
- כל utility מאורגן לפי תחום אחריות
- תיקיות משנה רק אם יש מספר קבצים

### 2. Type Safety
- כל הפונקציות מוגדרות עם types מפורשים
- Type guards עבור בדיקות runtime
- Generic types כאשר צריך

### 3. Consistency
- שמות עקביים לכל הפונקציות
- מבנה אחיד לכל הקבצים
- Barrel exports ב-index.ts

### 4. Reusability
- פונקציות קטנות וממוקדות
- ללא side effects (כאשר אפשר)
- קל לבדיקה ולתחזוקה

## דוגמאות שימוש

### שילוב Class Names
```typescript
import { cn } from '@utils';

const buttonClass = cn(
  'px-4 py-2 rounded',
  variant === 'primary' && 'bg-blue-500',
  disabled && 'opacity-50',
  className
);
```

### עיצוב זמן ותאריך
```typescript
import { formatTime, formatPlayTime, formatDate, formatDateShort, formatDateTime } from '@utils';

const gameTime = formatTime(125); // "02:05"
const playDuration = formatPlayTime(3661); // "1h 1m"
const date = formatDate(new Date()); // "15/01/2025"
const shortDate = formatDateShort(new Date()); // "17/02"
const dateAndTime = formatDateTime(new Date()); // "17/02/2025 14:30"
```

## קישורים רלוונטיים

- [Constants - Frontend](./CONSTANTS.md)
- [Types - Frontend](./TYPES.md)
- [Services - Frontend](./services/SERVICES.md)
- [Components - Frontend](./COMPONENTS.md)
- [דיאגרמות](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

