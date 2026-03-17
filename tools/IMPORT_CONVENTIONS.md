# Import Conventions (כללי ייבוא)

תצורת הייבואים בפרויקט נאכפת דרך **Prettier** עם הפלאגין `@ianvs/prettier-plugin-sort-imports` (קובץ: `tools/.prettierrc`).

## איך להחיל

- **פורמט ידני:** `pnpm run format`
- **בדיקה בלי לשנות:** `pnpm run format:check`
- **ב-IDE:** הפעלת "Format on Save" עם Prettier כפורמטר המוגדר לפרויקט.

## מה ממוין אוטומטית

1. **סדר בלוקי הייבוא** – לפי `importOrder` ב-`tools/.prettierrc`:
   - React → חיצוניים → `@shared` → `@config` → `@internal` → `@features` → `@common` → `@/...` → יחסיים.

2. **שמות בתוך כל שורת ייבוא (ABC)** – הפלאגין ממיין את הספקיפיירים באלפבית (A–Z) בתוך כל `import { ... }`.
   - דוגמה:  
     `import { useEffect, FC, useRef } from 'react'`  
     →  
     `import { FC, useEffect, useRef } from 'react'`

## התעלמות ממיון

- **שורת ייבוא בודדת:** להוסיף מעליה `// prettier-ignore`.
- **כל הקובץ:** לא מומלץ; עדיף לתקן את סדר הייבוא.

## קבצים רלוונטיים

- `tools/.prettierrc` – תצורת Prettier + `importOrder` + פלאגין מיון ייבואים.
- `tools/.prettierignore` – קבצים שלא עוברים פורמט.
- `package.json` – סקריפטים `format` ו-`format:check`.
