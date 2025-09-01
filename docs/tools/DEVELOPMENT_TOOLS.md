# כלי פיתוח - EveryTriv

## סקירה כללית

פרויקט EveryTriv כולל כלי פיתוח מתקדמים לניהול איכות הקוד, עקביות הפורמט, וזרימת עבודה יעילה. מדריך זה מכסה את כל הכלים המותקנים, הגדרותיהם, ושימושיהם.

## כלים מותקנים

### Prettier
- **תיאור**: מעצב קוד אוטומטי המבטיח עקביות בפורמט
- **גרסה**: 3.1.0
- **קבצי הגדרה**: `.prettierrc`, `.prettierignore`
- **תפקיד**: עיצוב קוד אוטומטי ב-JavaScript, TypeScript, JSON, Markdown

### ESLint
- **תיאור**: כלי לניתוח סטטי של קוד לזיהוי שגיאות ובעיות
- **גרסה**: 8.57.0
- **קבצי הגדרה**: `.eslintrc.js`
- **Plugins**: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- **תפקיד**: זיהוי שגיאות, אכיפת סגנון קוד, אופטימיזציות

### TypeScript
- **תיאור**: שפת תכנות מוטיפית המבוססת על JavaScript
- **גרסה**: 5.0+
- **קבצי הגדרה**: `tsconfig.json`, `tsconfig.build.json`
- **תפקיד**: טיפוסים חזקים, זיהוי שגיאות בזמן קומפילציה

### Jest
- **תיאור**: מסגרת בדיקות ל-JavaScript
- **גרסה**: 29.0+
- **קבצי הגדרה**: `jest.config.js`
- **תפקיד**: בדיקות יחידה, בדיקות אינטגרציה

## פקודות זמינות

### עיצוב קוד (Code Formatting)

```bash
# עיצוב כל הקבצים בפרויקט
pnpm run format

# בדיקה שהקוד מעוצב כראוי (ללא שינוי)
pnpm run format:check

# עיצוב קבצים ספציפיים
pnpm prettier --write "src/**/*.{ts,tsx,js,jsx}"
```

### ניתוח קוד (Code Linting)

```bash
# בדיקת שגיאות ובעיות בכל הפרויקט
pnpm run lint

# תיקון אוטומטי של בעיות שניתן לתקן
pnpm run lint:fix

# בדיקת קבצים ספציפיים
pnpm eslint "src/**/*.{ts,tsx}"
```

### בדיקות (Testing)

```bash
# הרצת כל הבדיקות
pnpm run test

# הרצת בדיקות עם coverage
pnpm run test:coverage

# הרצת בדיקות e2e
pnpm run test:e2e

# הרצת בדיקות במצב watch
pnpm run test:watch
```

### בנייה (Building)

```bash
# בניית הפרויקט לייצור
pnpm run build

# בניית הפרויקט לפיתוח
pnpm run build:dev

# בדיקת טיפוסים TypeScript
pnpm run type-check
```

## קבצי הגדרה

### .prettierrc
הגדרות Prettier לפרויקט:
```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### .eslintrc.js
הגדרות ESLint לפרויקט:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error'
  }
};
```

### tsconfig.json
הגדרות TypeScript:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

## קבצים נתמכים

### Prettier
- `.ts`, `.tsx` - קבצי TypeScript/React
- `.js`, `.jsx` - קבצי JavaScript/React
- `.json` - קבצי JSON
- `.md` - קבצי Markdown
- `.css`, `.scss` - קבצי CSS
- `.html` - קבצי HTML

### ESLint
- `.ts`, `.tsx` - TypeScript/React
- `.js`, `.jsx` - JavaScript/React
- `.json` - קבצי JSON

### TypeScript
- `.ts`, `.tsx` - קבצי TypeScript
- `.js`, `.jsx` - קבצי JavaScript (עם הגדרות מתאימות)

## אינטגרציה עם IDE

### VS Code
מומלץ להתקין את התוספים הבאים:
- **Prettier - Code formatter**
- **ESLint**
- **TypeScript Importer**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**

הגדרות מומלצות ב-`settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "editor.tabSize": 2,
  "editor.insertSpaces": true
}
```

### Cursor
Cursor תומך באופן מובנה ב-Prettier ו-ESLint. הגדרות דומות ל-VS Code.

### WebStorm
- תמיכה מובנית ב-TypeScript
- אינטגרציה עם ESLint ו-Prettier
- כלי ניתוח קוד מתקדמים

## זרימת עבודה מומלצת

### לפני כל commit
```bash
# עיצוב קוד
pnpm run format

# תיקון בעיות ESLint
pnpm run lint:fix

# בדיקת טיפוסים
pnpm run type-check

# הרצת בדיקות
pnpm run test
```

### במהלך פיתוח
- השתמש ב-format on save ב-IDE
- בדוק שגיאות ESLint בזמן אמת
- השתמש ב-TypeScript strict mode
- כתוב בדיקות לכל פונקציונליות חדשה

### בדיקה רציפה
```bash
# בדיקת עיצוב
pnpm run format:check

# בדיקת linting
pnpm run lint

# בדיקת טיפוסים
pnpm run type-check

# הרצת בדיקות
pnpm run test
```

## פתרון בעיות נפוצות

### Prettier לא עובד
```bash
# בדוק שהכלי מותקן
pnpm prettier --version

# התקן מחדש אם צריך
pnpm add prettier --save-dev

# בדוק הגדרות
pnpm prettier --config .prettierrc --check "src/**/*.ts"
```

### ESLint מציג שגיאות רבות
```bash
# תיקון אוטומטי
pnpm run lint:fix

# בדיקת הגדרות
pnpm eslint --print-config src/index.ts

# התקנה מחדש של plugins
pnpm add @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
```

### TypeScript שגיאות
```bash
# בדיקת טיפוסים
pnpm tsc --noEmit

# ניקוי cache
rm -rf node_modules/.cache

# התקנה מחדש של dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## כלי אבחון

### Frontend
```bash
# בדיקת bundle size
pnpm run build -- --analyze

# בדיקת dependencies
pnpm audit

# בדיקת TypeScript
pnpm tsc --noEmit

# בדיקת ביצועים
pnpm run build && pnpm lighthouse http://localhost:5173
```

### Backend
```bash
# בדיקת health
curl http://localhost:3001/health

# בדיקת logs
docker logs everytriv-app

# בדיקת database
docker exec -it everytriv-postgres psql -U postgres -d everytriv

# בדיקת memory usage
docker stats everytriv-app
```

## Troubleshooting

### בעיות נפוצות

#### Frontend Issues
- **CORS Errors**: בדוק הגדרות CORS בשרת
- **Build Errors**: נקה node_modules ו-pnpm-lock.yaml
- **Performance Issues**: השתמש ב-React Profiler

#### Backend Issues
- **Database Connection**: בדוק הגדרות מסד נתונים
- **Migration Errors**: בדוק גרסאות מיגרציות
- **Memory Leaks**: השתמש ב-Node.js profiler

### כלי אבחון מתקדמים

#### React Profiler
```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: string,
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`Component ${id} took ${actualDuration}ms to render`);
}

<Profiler id="GameComponent" onRender={onRenderCallback}>
  <GameComponent />
</Profiler>
```

#### Node.js Profiler
```bash
# הפעלת profiler
node --prof server.js

# ניתוח התוצאות
node --prof-process isolate-*.log > processed.txt
```
 
