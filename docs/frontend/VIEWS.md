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
- **תכונות**: בחירת נושא, קושי, מצב משחק

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

### Analytics
- **קובץ**: `analytics/AnalyticsView.tsx`
- **תיאור**: דף אנליטיקה למנהלים
- **תכונות**: גרפים, מדדים, דוחות

### Payment
- **קובץ**: `payment/PaymentView.tsx`
- **תיאור**: דף תשלומים ומנויים
- **תכונות**: תשלום, מנוי, היסטוריית תשלומים

### Admin Dashboard
- **קובץ**: `admin/AdminDashboard.tsx`
- **תיאור**: לוח בקרה למנהלים
- **תכונות**: ניהול משתמשים, סטטיסטיקות, הגדרות

## ניווט בין דפים

הניווט מתבצע באמצעות React Router עם הגדרות ב-`AppRoutes.tsx`.

## הגנות גישה

- **Protected Routes**: דפים שדורשים אימות
- **Admin Routes**: דפים שדורשים הרשאות מנהל
- **Public Routes**: דפים פתוחים לכל המשתמשים

## קישורים רלוונטיים

- [מערכת הניווט](./ROUTING.md)
- [רכיבי UI](./COMPONENTS.md)
- [ניהול מצב](./STATE.md)
