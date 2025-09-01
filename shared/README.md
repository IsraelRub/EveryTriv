# EveryTriv Shared Library

ספרייה משותפת המכילה קוד, טיפוסים ופונקציות שימושיות המשמשות את הפרויקטים `client` ו-`server`.

## מבנה התקיות

```
shared/
├── constants/     # קבועים משותפים
├── services/      # שירותים משותפים (HTTP client, etc.)
├── types/         # הגדרות TypeScript משותפות
├── utils/         # פונקציות שימושיות
├── validation/    # פונקציות אימות
└── dist/          # קבצים מקומפלים (נוצר אוטומטית)
```

## שימוש

### התקנה

```bash
cd shared
npm install
```

### בנייה

```bash
npm run build        # בנייה רגילה
npm run typecheck    # בדיקת טיפוסים בלבד
npm run watch        # בנייה עם מעקב אחר שינויים
npm run dev          # בדיקת טיפוסים + בנייה
```

### ייבוא בפרויקטים

#### Client (React)

```typescript
import { ApiResponse, ValidationResult } from '../../shared';
import { HttpClient } from '../../shared/services';
```

#### Server (NestJS)

```typescript
import { ApiResponse, ValidationResult } from '../../shared';
import { HttpClient } from '../../shared/services';
```

## קבצים עיקריים

- `constants/` - קבועים של המשחק והאפליקציה
- `services/http-client.ts` - לקוח HTTP משותף
- `types/core.types.ts` - טיפוסים בסיסיים
- `utils/logger.ts` - מערכת לוגים
- `validation/` - פונקציות אימות נתונים

## פיתוח

1. ערוך קבצים ב-`src/`
2. הרץ `npm run typecheck` לבדיקת שגיאות
3. הרץ `npm run build` לבנייה
4. הקבצים המקומפלים יישמרו ב-`dist/`

## הערות חשובות

- כל השינויים חייבים לעבור בדיקת TypeScript
- שמור על תאימות עם client ו-server
- השתמש ב-`export *` בקבצי index.ts
- הוסף תיעוד JSDoc לפונקציות חדשות
