# Frontend Views Documentation

תיעוד דפי האפליקציה (Views) ב-React.

## סקירה כללית

דפי האפליקציה מאורגנים בתיקיית `views/` ומכילים את הדפים הראשיים של האפליקציה.

## מבנה Views

```
client/src/views/
├── admin/           # דף מנהל
├── analytics/       # דף אנליטיקה
├── gameHistory/     # היסטוריית משחקים
├── home/            # דף הבית והמשחק
├── leaderboard/     # לוח תוצאות
├── login/           # דף התחברות
├── payment/         # תשלומים
├── registration/    # דף רישום
├── unauthorized/    # דף לא מורשה
└── user/            # פרופיל משתמש
```

## דפים עיקריים

### Home View
- **קובץ**: `home/HomeView.tsx`
- **תיאור**: דף הבית הראשי עם אפשרויות משחק
- **תכונות**: בחירת נושא, קושי, מצב משחק, טופס טריוויה, משחק פעיל
- **רכיבים**: Game, TriviaForm, GameMode, DifficultyDisplay, Leaderboard

### User Profile
- **קובץ**: `user/UserProfile.tsx`
- **תיאור**: פרופיל משתמש עם סטטיסטיקות
- **תכונות**: עריכת פרופיל, העדפות, היסטוריה

### Game History
- **קובץ**: `gameHistory/GameHistory.tsx`
- **תיאור**: היסטוריית משחקים של המשתמש
- **תכונות**: סינון, חיפוש, סטטיסטיקות

### Leaderboard
- **קובץ**: `leaderboard/LeaderboardView.tsx`
- **תיאור**: לוח תוצאות גלובלי
- **תכונות**: דירוגים, פילטרים, סטטיסטיקות

### Admin Dashboard
- **קובץ**: `admin/AdminDashboard.tsx`
- **תיאור**: דף ניהול מערכת למנהלים
- **תכונות**: ניהול משתמשים, סטטיסטיקות מערכת, הגדרות

### Analytics
- **קובץ**: `analytics/AnalyticsView.tsx`
- **תיאור**: דף אנליטיקה למנהלים
- **תכונות**: גרפים, מדדים, דוחות

### Payment
- **קובץ**: `payment/PaymentView.tsx`
- **תיאור**: דף תשלומים ומנויים
- **תכונות**: תשלום, מנוי, היסטוריית תשלומים

### Login
- **קובץ**: `login/LoginView.tsx`
- **תיאור**: דף התחברות עם Google OAuth
- **תכונות**: התחברות עם Google, טופס התחברות בסיסי

### Registration
- **קובץ**: `registration/RegistrationView.tsx`
- **תיאור**: דף רישום משתמש חדש
- **תכונות**: טופס רישום, ולידציה

### Unauthorized
- **קובץ**: `unauthorized/UnauthorizedView.tsx`
- **תיאור**: דף לא מורשה
- **תכונות**: הודעת שגיאה, הפניה להתחברות

## ניווט בין דפים

הניווט מתבצע באמצעות React Router עם הגדרות ב-`AppRoutes.tsx`.

### נתיבים ציבוריים
- `/` - דף הבית
- `/game` - דף משחק
- `/play` - דף משחק
- `/start` - דף התחלה
- `/leaderboard` - לוח תוצאות
- `/register` - דף רישום
- `/auth/callback` - OAuth callback
- `/unauthorized` - דף לא מורשה

### נתיבים מוגנים
- `/profile` - פרופיל משתמש
- `/history` - היסטוריית משחקים
- `/payment` - תשלומים
- `/complete-profile` - השלמת פרופיל

## הגנות גישה

- **Protected Routes**: דפים שדורשים אימות (ProtectedRoute)
- **Public Routes**: דפים פתוחים לכל המשתמשים (PublicRoute)
- **OAuth Callback**: ללא הגנה נדרשת

## קישורים רלוונטיים

- [מערכת הניווט](./ROUTING.md)
- [רכיבי UI](./COMPONENTS.md)
- [ניהול מצב](./STATE.md)
