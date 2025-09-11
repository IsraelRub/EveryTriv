# EveryTriv Documentation - אינדקס

ברוכים הבאים לתיעוד המקיף של פרויקט EveryTriv! כאן תמצאו את כל המסמכים המאורגנים לפי קטגוריות.

## 📋 סקירה כללית

EveryTriv הוא פלטפורמת טריוויה חכמה המבוססת על AI עם ארכיטקטורה מודרנית של Frontend ו-Backend נפרדים. המערכת משלבת React, TypeScript, NestJS, ומערכות AI מתקדמות ליצירת חוויית משחק מרתקת ואינטראקטיבית.

## 🏗️ מסמכי ארכיטקטורה

### מסמכים עיקריים
- **[ארכיטקטורה כללית](./architecture/ARCHITECTURE.md)** - מבנה המערכת, טכנולוגיות וזרימת נתונים
- **[דיאגרמות](./DIAGRAMS.md)** - כל דיאגרמות Mermaid במקום אחד
- **[ארכיטקטורת השרת](./architecture/SERVER_ARCHITECTURE.md)** - מבנה NestJS עם מודולים ותכונות
- **[ארכיטקטורת Hooks](./architecture/HOOKS_ARCHITECTURE.md)** - מבנה מבוסס שכבות עם אופטימיזציות ביצועים
- **[ארכיטקטורת לוגים](./architecture/LOGGER_ARCHITECTURE.md)** - מערכת הלוגים

### עיצוב וממשק
- **[מערכת העיצוב](./architecture/DESIGN_SYSTEM.md)** - מערכת עיצוב מאוחדת עם CSS-in-JS ואייקונים

## 🛠️ מסמכי פיתוח

- **[מדריך פיתוח](./development/DEVELOPMENT.md)** - מדריך פיתוח, API documentation וגיידליינים
- **[מערכת האודיו](./development/AUDIO_SYSTEM.md)** - מערכת האודיו והצלילים, ארכיטקטורה ושימוש
- **[כלי פיתוח](./tools/DEVELOPMENT_TOOLS.md)** - כלי פיתוח, Prettier, ESLint, TypeScript
- **[מדריך תרומה](./development/contributing.md)** - מדריך תרומה לפרויקט


## 🚀 מסמכי פריסה ותשתית

- **[מדריך פריסה](./deployment/deployment.md)** - מדריך הטמעה לייצור כולל Vercel
- **[הגדרת Docker](./deployment/DOCKER_SETUP.md)** - הגדרת Docker וסביבת פיתוח

## 🗄️ מסמכי מסד נתונים

- **[הגדרת מסד נתונים](./database/UNIFIED_DATABASE_SETUP.md)** - הגדרת מסד נתונים מאוחד

## 📚 מדריך שימוש מהיר

### למפתחים חדשים
1. התחילו עם **[ארכיטקטורה כללית](./architecture/ARCHITECTURE.md)** להבנת המבנה הכללי
2. קראו את **[מדריך פיתוח](./development/DEVELOPMENT.md)** להבנת תהליכי הפיתוח
3. עברו על **[ארכיטקטורת השרת](./architecture/SERVER_ARCHITECTURE.md)** להבנת הצד האחורי
4. למדו על **[ארכיטקטורת Hooks](./architecture/HOOKS_ARCHITECTURE.md)** להבנת הצד הקדמי

### למעצבים
1. התחילו עם **[מערכת העיצוב](./architecture/DESIGN_SYSTEM.md)**
2. עברו על **[דיאגרמות](./DIAGRAMS.md)** להבנת זרימת המשתמש

### למנהלי מערכת
1. קראו את **[הגדרת Docker](./deployment/DOCKER_SETUP.md)**
2. עברו על **[הגדרת מסד נתונים](./database/UNIFIED_DATABASE_SETUP.md)**
3. למדו על **[מדריך פריסה](./deployment/deployment.md)**

## 🔍 חיפוש במסמכים

### לפי נושא
- **ארכיטקטורה**: `./architecture/` - כל מסמכי הארכיטקטורה
- **פיתוח**: `./development/` - מדריכי פיתוח ותרומה
- **פריסה**: `./deployment/` - מדריכי פריסה ו-Docker
- **כלי פיתוח**: `./tools/` - כלי פיתוח
- **מסד נתונים**: `./database/` - הגדרות מסד נתונים

### לפי רמת ניסיון
- **מתחילים**: `./architecture/ARCHITECTURE.md`, `./development/DEVELOPMENT.md`
- **מתקדמים**: `./architecture/HOOKS_ARCHITECTURE.md`, `./architecture/SERVER_ARCHITECTURE.md`
- **מומחים**: `./database/UNIFIED_DATABASE_SETUP.md`, `./deployment/deployment.md`

## 🏗️ מבנה הפרויקט

```
EveryTriv/
├── client/          # אפליקציית React
├── server/          # שרת NestJS
├── shared/          # ספריות משותפות
├── docs/            # תיעוד
│   ├── architecture/    # מסמכי ארכיטקטורה
│   ├── development/     # מסמכי פיתוח
│   ├── deployment/      # מסמכי פריסה
│   ├── tools/           # כלי פיתוח
│   ├── database/        # מסמכי מסד נתונים
│   ├── DIAGRAMS.md      # תרשימים מרוכזים
│   └── README.md        # אינדקס ראשי (זה)
└── scripts/         # סקריפטים אוטומטיים
```

## 🛠️ טכנולוגיות עיקריות

### Frontend
- React 18 עם TypeScript
- Redux Toolkit לניהול state
- Vite לבנייה
- Tailwind CSS לעיצוב

### Backend
- NestJS עם TypeScript
- TypeORM לבסיס נתונים
- PostgreSQL כבסיס נתונים ראשי
- Redis למטמון

### Shared
- TypeScript types משותפים
- Validation schemas
- Utility functions
- Constants

## 🚀 התחלה מהירה

1. **התקנת תלויות**: `pnpm install`
2. **הגדרת בסיס נתונים**: ראה [הגדרת מסד נתונים](./database/UNIFIED_DATABASE_SETUP.md)
3. **הפעלת פיתוח**: `pnpm run dev`

## 🔄 עדכונים אחרונים

### שיפורי טיפוסיות (נובמבר 2024)
- **הוספת ממשקים חדשים**: `CanPlayResponse`, `PurchaseResponse`, `DifficultyStats`, `UserRank`, `UserStats`
- **שיפור ממשקי בקשה**: `DeductPointsRequest`, `ValidateCustomDifficultyRequest`, `ValidateLanguageRequest`
- **החלפת `as unknown` casts**: שימוש בממשקים ספציפיים במקום type assertions
- **תיעוד משופר**: עדכון `@used_by` annotations עם הפניות מדויקות
- **סימון ממשקים מיושנים**: `DeductPointsDto` מסומן כ-`@deprecated`
- **עדכון תיעוד**: התיעוד עכשיו משקף את המבנה האמיתי של הפרויקט

## 📝 תרומה לתיעוד

אם מצאתם שגיאות או שיש לכם הצעות לשיפור התיעוד:

1. פתחו issue ב-GitHub
2. צרו Pull Request עם התיקונים
3. עקבו אחר **[מדריך התרומה](./development/contributing.md)**

## 🔗 קישורים שימושיים

- [GitHub Repository](https://github.com/IsraelRub/EveryTriv)
- [Live Demo](https://everytriv.com)
- [API Documentation](https://api.everytriv.com/docs)
- [README הראשי](../README.md) - מידע כללי על הפרויקט
- [Package.json הראשי](../package.json) - תלויות וסקריפטים
- [Docker Compose](../docker-compose.yaml) - הגדרות Docker
 
