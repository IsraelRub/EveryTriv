# אינדקס תיעוד EveryTriv

אינדקס מלא של כל מסמכי התיעוד בפרויקט EveryTriv.

## מסמכים ראשיים

### ארכיטקטורה ופיתוח
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - ארכיטקטורה כללית של הפרויקט
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - הנחיות פיתוח, workflow וכלים
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - פריסה והפעלה
- **[CONFIGURATION.md](./CONFIGURATION.md)** - קבצי תצורה - מיקום, תפקיד והקשר
- **[DIAGRAMS.md](./DIAGRAMS.md)** - דיאגרמות וזרימות

### מסד נתונים
- **[database/DATABASE_SETUP.md](./database/DATABASE_SETUP.md)** - הגדרת מסד נתונים (PostgreSQL + Redis)

## Backend

### מסמכים כלליים
- **[backend/API_REFERENCE.md](./backend/API_REFERENCE.md)** - תיעוד API מלא
- **[backend/AUTHORIZATION.md](./backend/AUTHORIZATION.md)** - מערכת הרשאות
- **[backend/common/README.md](./backend/common/README.md)** - מבנה משותף (Decorators, Guards, Interceptors, Pipes)
- **[backend/internal/README.md](./backend/internal/README.md)** - מבנה פנימי (Middleware, Entities, Modules, Controllers, Constants, Utils, Types)

### מודולי Backend (Features)
סקירה קצרה של מודולי Backend:

| מודול | נתיב בסיס | אחריות עיקרית | תיעוד מפורט |
|-------|-----------|---------------|-------------|
| Auth | `/auth` | אימות, הנפקת JWT, OAuth (Google) | [AUTH.md](./backend/features/AUTH.md) |
| User | `/users` | פרופיל משתמש, סטטיסטיקות | [USER.md](./backend/features/USER.md) |
| Game | `/game` | לוגיקת משחק, trivia, AI providers | [GAME.md](./backend/features/GAME.md) |
| Multiplayer | `/multiplayer` (WebSocket) | משחק סימולטני בזמן אמת (2-4 שחקנים) | [MULTIPLAYER.md](./backend/features/MULTIPLAYER.md) |
| Credits | `/credits` | ניהול קרדיטים | [CREDITS.md](./backend/features/CREDITS.md) |
| Leaderboard | `/leaderboard` | דירוגים וחישובי מיקום | [LEADERBOARD.md](./backend/features/LEADERBOARD.md) |
| Analytics | `/analytics` | מדדים, איסוף שימוש, דוחות | [ANALYTICS.md](./backend/features/ANALYTICS.md) |
| Payment | `/payment` | תשלומים, טרנזקציות | [PAYMENT.md](./backend/features/PAYMENT.md) |

## Frontend

### מבנה ואדריכלות
- **[frontend/REDUX.md](./frontend/REDUX.md)** - ניהול מצב (Redux Toolkit)
- **[frontend/HOOKS.md](./frontend/HOOKS.md)** - ארכיטקטורת Hooks (כולל React Query)
- **[frontend/ROUTING.md](./frontend/ROUTING.md)** - מערכת ניתוב
- **[frontend/services/SERVICES.md](./frontend/services/SERVICES.md)** - שירותי Frontend
- **[frontend/CONSTANTS.md](./frontend/CONSTANTS.md)** - קבועים
- **[frontend/TYPES.md](./frontend/TYPES.md)** - טיפוסים
- **[frontend/UTILS.md](./frontend/UTILS.md)** - פונקציות שירותיות

### UI ו-Components
- **[frontend/VIEWS.md](./frontend/VIEWS.md)** - דפי האפליקציה
- **[frontend/COMPONENTS.md](./frontend/COMPONENTS.md)** - רכיבי UI
- **[frontend/DESIGN_SYSTEM.md](./frontend/DESIGN_SYSTEM.md)** - מערכת עיצוב
- **[frontend/ANIMATION_SYSTEM.md](./frontend/ANIMATION_SYSTEM.md)** - מערכת אנימציות
- **[frontend/AUDIO_SYSTEM.md](./frontend/AUDIO_SYSTEM.md)** - מערכת אודיו

## Shared Layer

### טיפוסים ונתונים
- **[shared/TYPES.md](./shared/TYPES.md)** - טיפוסים משותפים
- **[shared/CONSTANTS.md](./shared/CONSTANTS.md)** - קבועים משותפים
- **[shared/VALIDATION.md](./shared/VALIDATION.md)** - ולידציה משותפת

### שירותים וכלים
- **[shared/SHARED_PACKAGE.md](./shared/SHARED_PACKAGE.md)** - חבילה משותפת
- **[shared/LOGGING_MONITORING.md](./shared/LOGGING_MONITORING.md)** - לוגים וניטור

## ניווט מהיר לפי נושא

### התחלה מהירה
- [פיתוח](./DEVELOPMENT.md) - הוראות פיתוח
- [פריסה](./DEPLOYMENT.md) - הוראות פריסה
- [קבצי תצורה](./CONFIGURATION.md) - מיקום ותפקיד של כל קבצי התצורה
- [מסד נתונים](./database/DATABASE_SETUP.md) - הגדרת מסד נתונים

### ארכיטקטורה
- [ארכיטקטורה כללית](./ARCHITECTURE.md)
- [דיאגרמות](./DIAGRAMS.md)
- [מבנה פנימי Backend](./backend/internal/README.md)
- [ארכיטקטורת Hooks Frontend](./frontend/HOOKS.md)

### Backend
- [API Reference](./backend/API_REFERENCE.md)
- [אימות והרשאות](./backend/AUTHORIZATION.md)
- [מודול אימות](./backend/features/AUTH.md)
- [מודול משחק](./backend/features/GAME.md)
- [מודול מרובה משתתפים](./backend/features/MULTIPLAYER.md)
- [מודול משתמשים](./backend/features/USER.md)
- [מודול קרדיטים](./backend/features/CREDITS.md)
- [מודול אנליטיקה](./backend/features/ANALYTICS.md)

### Frontend
- [ניהול מצב (Redux)](./frontend/REDUX.md)
- [Hooks (כולל React Query)](./frontend/HOOKS.md)
- [דפי האפליקציה](./frontend/VIEWS.md)
- [מרובה משתתפים - Frontend](./frontend/MULTIPLAYER.md)
- [רכיבי UI](./frontend/COMPONENTS.md)
- [מערכת עיצוב](./frontend/DESIGN_SYSTEM.md)
- [ניתוב](./frontend/ROUTING.md)
- [קבועים](./frontend/CONSTANTS.md)
- [טיפוסים](./frontend/TYPES.md)
- [פונקציות שירותיות](./frontend/UTILS.md)

### Shared
- [טיפוסים משותפים](./shared/TYPES.md)
- [קבועים](./shared/CONSTANTS.md)
- [ולידציה](./shared/VALIDATION.md)

### תחזוקה
- [לוגים וניטור](./shared/LOGGING_MONITORING.md)

