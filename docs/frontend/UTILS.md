# Utils - Frontend

תיעוד כל הפונקציות השירותיות (Utilities) ב-Frontend, מאורגנות לפי תחומי אחריות.

לקשר לדיאגרמות:
- [דיאגרמת מבנה Frontend](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

## מבנה תיקיית Utils

```
client/src/utils/
├── data.utils.ts                   # פונקציות עיבוד נתונים
├── datetime/                       # פונקציות תאריך ושעה
│   ├── date.utils.ts               # פונקציות תאריך
│   ├── time.utils.ts               # פונקציות זמן
│   └── index.ts                    # ייצוא מאוחד
├── format.utils.ts                 # פונקציות עיצוב
├── ui/                             # פונקציות UI
│   ├── classNames.utils.ts         # פונקציות class names
│   ├── format.utils.ts             # פונקציות עיצוב UI
│   └── index.ts                    # ייצוא מאוחד
├── user.utils.ts                   # פונקציות משתמש
└── index.ts                        # ייצוא מאוחד
```

## Data Utils

### data.utils.ts

פונקציות עיבוד נתונים:

**isUser:**
```typescript
export function isUser(value: unknown): value is User
```

Type guard לבדיקה אם ערך הוא User:
- בודק אם הערך הוא record
- בודק שדות BasicUser (id, username, email)
- בודק שדות User (status, emailVerified, authProvider)
- בודק שדות מספריים (credits, purchasedPoints, totalPoints, score)

**Usage:**
```typescript
import { isUser } from '@utils';

if (isUser(data)) {
  console.log(data.username); // TypeScript knows data is User
}
```

## Date/Time Utils

### datetime/date.utils.ts

פונקציות תאריך:

**isToday:**
```typescript
export function isToday(date: Date): boolean
```

בודק אם תאריך הוא היום:
```typescript
const today = new Date();
const isTodayDate = isToday(today); // true
```

**isYesterday:**
```typescript
export function isYesterday(date: Date): boolean
```

בודק אם תאריך הוא אתמול:
```typescript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const isYesterdayDate = isYesterday(yesterday); // true
```

**getCurrentTimestamp:**
```typescript
export function getCurrentTimestamp(): number
```

מחזיר timestamp נוכחי במילישניות:
```typescript
const timestamp = getCurrentTimestamp(); // 1234567890123
```

### datetime/time.utils.ts

פונקציות זמן:

**formatTime:**
```typescript
export function formatTime(totalSeconds: number): string
```

מעצב זמן בפורמט MM:SS:
```typescript
formatTime(125); // "02:05"
formatTime(3661); // "61:01"
```

**formatTimeDisplay:**
```typescript
export function formatTimeDisplay(seconds: number): string
```

מעצב זמן עם יחידת זמן מתאימה:
```typescript
formatTimeDisplay(30); // "30s"
formatTimeDisplay(120); // "2m"
formatTimeDisplay(7200); // "2h"
```

**formatTimeUntilReset:**
```typescript
export function formatTimeUntilReset(resetTime: number): string
```

מעצב זמן עד איפוס (לדוגמה, איפוס יומי):
```typescript
const resetTime = Date.now() + 3600000; // שעה מהיום
formatTimeUntilReset(resetTime); // "1h 0m"
formatTimeUntilReset(Date.now() - 1000); // "Reset now"
```

## Format Utils

### format.utils.ts

פונקציות עיצוב:

**formatNumber:**
```typescript
export function formatNumber(
  num: number, 
  decimals: number = 1, 
  includeSuffix: boolean = true
): string
```

מעצב מספר עם סיומת K/M:
```typescript
formatNumber(1234); // "1.2K"
formatNumber(1234567); // "1.2M"
formatNumber(1234, 0, false); // "1234"
```

**formatRelativeTime:**
```typescript
export function formatRelativeTime(
  timestamp: number, 
  now: number = Date.now()
): string
```

מעצב זמן יחסי:
```typescript
const oneHourAgo = Date.now() - 3600000;
formatRelativeTime(oneHourAgo); // "1h ago"

const oneDayAgo = Date.now() - 86400000;
formatRelativeTime(oneDayAgo); // "1d ago"
```

**formatScore:**
```typescript
export function formatScore(
  score: number, 
  showPlus: boolean = true
): string
```

מעצב ניקוד:
```typescript
formatScore(100); // "+100.0"
formatScore(-50); // "50.0"
formatScore(100, false); // "100.0"
```

**formatUsername:**
```typescript
export function formatUsername(username: string): string
```

מעצב שם משתמש (אות ראשונה גדולה, שאר אותיות קטנות):
```typescript
formatUsername('JOHN_DOE'); // "John_doe"
formatUsername('jane smith'); // "Jane smith"
```

**formatTopic:**
```typescript
export function formatTopic(topic: string): string
```

מעצב שם נושא (כל מילה עם אות ראשונה גדולה):
```typescript
formatTopic('world-history'); // "World History"
formatTopic('science_technology'); // "Science Technology"
```

## UI Utils

### ui/classNames.utils.ts

פונקציות class names:

**combineClassNames:**
```typescript
export function combineClassNames(...inputs: ClassValue[]): string
```

משלב class names עם תמיכה ב-Tailwind merge:
- משתמש ב-`clsx` לשילוב conditional classes
- משתמש ב-`twMerge` למיזוג נכון של Tailwind classes
- מונע קונפליקטים בין classes

**Usage:**
```typescript
import { combineClassNames } from '@utils';

const className = combineClassNames(
  'px-4 py-2',
  isActive && 'bg-blue-500',
  'text-white',
  'px-6' // זה יחליף את px-4
); // "py-2 bg-blue-500 text-white px-6"
```

### ui/format.utils.ts

פונקציות עיצוב UI:

**Re-exports:**
מייצא מחדש את כל הפונקציות מ-`format.utils.ts`:
- `formatNumber`
- `formatRelativeTime`
- `formatScore`
- `formatUsername`
- `formatTopic`

**getDifficultyIcon:**
```typescript
export const getDifficultyIcon = (difficulty: string): string
```

מחזיר שם icon עבור רמת קושי:
```typescript
getDifficultyIcon('easy'); // "easy"
getDifficultyIcon('medium'); // "medium"
getDifficultyIcon('hard'); // "hard"
getDifficultyIcon('custom_my-difficulty'); // "question"
getDifficultyIcon('unknown'); // "question"
```

## User Utils

### user.utils.ts

פונקציות משתמש:

**getOrCreateClientUserId:**
```typescript
export async function getOrCreateClientUserId(): Promise<string>
```

מייצר או מחזיר user ID מ-localStorage:
- בודק אם יש user ID ב-localStorage
- אם לא, מייצר user ID חדש ושומר אותו
- מחזיר user ID קיים או חדש

**Usage:**
```typescript
import { getOrCreateClientUserId } from '@utils';

const userId = await getOrCreateClientUserId();
// userId הוא string ייחודי
```

**Error Handling:**
- אם localStorage לא זמין, מייצר user ID זמני
- לוג warning אם storage לא זמין

## Index

### index.ts

Barrel exports לכל ה-utils:

```typescript
// UI utilities
export * from './ui';

// User utilities
export * from './user.utils';

// DateTime utilities
export * from './datetime';

// Data utilities
export * from './data.utils';

// Format utilities
export * from './format.utils';
```

**Usage:**
```typescript
import { 
  isUser,
  formatTime,
  formatNumber,
  combineClassNames,
  getOrCreateClientUserId
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
import { combineClassNames } from '@utils';

const buttonClass = combineClassNames(
  'px-4 py-2 rounded',
  variant === 'primary' && 'bg-blue-500',
  disabled && 'opacity-50',
  className
);
```

### עיצוב זמן
```typescript
import { formatTime, formatTimeDisplay } from '@utils';

const gameTime = formatTime(125); // "02:05"
const displayTime = formatTimeDisplay(3661); // "1h"
```

### עיצוב מספרים
```typescript
import { formatNumber, formatScore } from '@utils';

const points = formatNumber(1234); // "1.2K"
const score = formatScore(100); // "+100.0"
```

### בדיקת User
```typescript
import { isUser } from '@utils';

if (isUser(data)) {
  // TypeScript knows data is User
  console.log(data.username, data.email);
}
```

## קישורים רלוונטיים

- [Constants - Frontend](./CONSTANTS.md)
- [Types - Frontend](./TYPES.md)
- [Services - Frontend](./services/SERVICES.md)
- [Components - Frontend](./COMPONENTS.md)
- [דיאגרמות](../DIAGRAMS.md#דיאגרמת-מבנה-frontend)

