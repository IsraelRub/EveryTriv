# EveryTriv Documentation - אינדקס

תיעוד מאורגן לפי תחום.

## 📋 סקירה כללית

EveryTriv: פלטפורמת טריוויה חכמה (React + NestJS + Shared). ארכיטקטורה מודולרית, טיפוסים אחידים, ולידציה משותפת ותהליכי פיתוח עקביים.

## 🏗️ ארכיטקטורה

### מסמכים עיקריים
- **[ארכיטקטורה כללית](./ARCHITECTURE.md)** - סקירה מקיפה של המערכת
- **[דיאגרמות מפורטות](./DIAGRAMS.md)** - תרשימים מפורטים של כל המערכת
- **[סנכרון תרשימים ↔ קוד](./DIAGRAMS.md#diagram-sync-status)** - מיפוי בין תרשימים לקוד
- **[זרימת ליבת NestJS](./DIAGRAMS.md#nestjs-core-flow)** - תרשים זרימת בקשות
- **[מפת תלות Shared](./DIAGRAMS.md#shared-deps-map)** - תרשים תלויות Shared
- **[ארכיטקטורה כללית](./ARCHITECTURE.md)** - מבנה המערכת המפורט
- **[Hooks מתקדמים](./frontend/HOOKS_ARCHITECTURE.md)** - ארכיטקטורת Hooks
- **[לוגים וניטור](./shared/LOGGING_MONITORING.md)** - מערכת לוגים וניטור

### עיצוב וממשק
- **[מערכת העיצוב](./frontend/DESIGN_SYSTEM.md)** - עקרונות עיצוב ו-UI

## 🛠️ פיתוח
- **[מדריך פיתוח מקיף](./DEVELOPMENT.md)** - מדריך מקיף לכל היבטי הפיתוח
- **[בדיקות](./TESTING.md)** - מדריך בדיקות ו-QA


## 🚀 פריסה ותשתית

- **[מדריך פריסה](./DEPLOYMENT.md)** - מדריך מקיף לפריסה לייצור

## 🗄️ מסד נתונים

- **[הגדרת מסד נתונים](./database/DATABASE_SETUP.md)**

## 🔧 Backend (NestJS)

- **[רשימת מודולים](./backend/FEATURES.md)** - סקירת מודולי Backend
- **[Internal Structure](./backend/INTERNAL_STRUCTURE.md)** - מבנה פנימי של השרת
- **[Common Structure](./backend/COMMON_STRUCTURE.md)** - מבנה משותף של השרת
- **[API Reference](./backend/API_REFERENCE.md)** - תיעוד מלא של API endpoints
- **[Auth](./backend/feature-auth.md)** - מערכת אימות והרשאות
- **[Game](./backend/feature-game.md)** - לוגיקת משחק ו-trivia
- **[Points](./backend/feature-points.md)** - מערכת נקודות
- **[Leaderboard](./backend/feature-leaderboard.md)** - לוח תוצאות
- **[Analytics](./backend/feature-analytics.md)**
- **[Payment](./backend/feature-payment.md)**
- **[Subscription](./backend/feature-subscription.md)**
- **[User](./backend/feature-user.md)**
- **[Repository Integration](./backend/REPOSITORY_INTEGRATION.md)** - אינטגרציה של repositories עם decorator system

## 🎛 Frontend (React)

- **[מבנה Frontend](./ARCHITECTURE.md#ארכיטקטורת-frontend)** - מבנה הפרויקט
- **[State Management](./frontend/STATE.md)** - ניהול מצב Redux
- **[Services](./frontend/SERVICES.md)** - שירותי API
- **[Components](./frontend/COMPONENTS.md)** - תיעוד מפורט של רכיבי UI
- **[Views](./frontend/VIEWS.md)** - דפי האפליקציה
- **[מערכת האנימציות](./frontend/ANIMATION_SYSTEM.md)** - מערכת אנימציות מתקדמת
- **[מערכת האודיו](./frontend/AUDIO_SYSTEM.md)** - מערכת אודיו וצלילים
- **[Routing](./frontend/ROUTING.md)** - מערכת ניתוב
- **[Hooks מתקדמים](./frontend/HOOKS_ARCHITECTURE.md)** - ארכיטקטורת Hooks

## ♻ Shared Layer

- **[Shared Package](./shared/SHARED_PACKAGE.md)** - תיעוד מקיף של חבילת Shared
- **[לוגים וניטור](./shared/LOGGING_MONITORING.md)** - מערכת לוגים וניטור
- **[Types](./shared/TYPES.md)** - טיפוסי TypeScript משותפים
- **[Validation](./shared/VALIDATION.md)** - ולידציה משותפת
- **[Constants](./shared/CONSTANTS.md)** - קבועים משותפים

## 📚 מסלולי התחלה

### מפתח
1. ארכיטקטורה כללית
2. פיתוח
3. מודולי Backend
4. Hooks Frontend

### עיצוב
1. מערכת עיצוב
2. דיאגרמות

### DevOps
1. Docker
2. מסד נתונים
3. פריסה

## 🔍 אינדקס מהיר
- ארכיטקטורה: `ARCHITECTURE.md`
- Backend: `backend/`
- Frontend: `frontend/`
- Shared: `shared/`
- פיתוח: `DEVELOPMENT.md`
- פריסה: `DEPLOYMENT.md`
- כלים: `tools/`
- מסד נתונים: `database/`

## 🏗️ מבנה פרויקט (מעודכן)

```
EveryTriv/
├── client/                    # אפליקציית React
│   ├── src/
│   │   ├── views/            # דפי האפליקציה
│   │   │   ├── admin/        # דף מנהל
│   │   │   ├── analytics/    # דף אנליטיקה
│   │   │   ├── gameHistory/  # היסטוריית משחקים
│   │   │   ├── home/         # דף הבית והמשחק
│   │   │   ├── leaderboard/  # לוח תוצאות
│   │   │   ├── login/        # דף התחברות
│   │   │   ├── payment/      # תשלומים
│   │   │   ├── registration/ # דף רישום
│   │   │   ├── unauthorized/ # דף לא מורשה
│   │   │   └── user/         # פרופיל משתמש
│   │   ├── components/       # רכיבי UI
│   │   │   ├── analytics/    # רכיבי אנליטיקה
│   │   │   ├── animations/   # אנימציות
│   │   │   ├── audio/        # בקרת אודיו
│   │   │   ├── auth/         # רכיבי אימות
│   │   │   ├── forms/        # רכיבי טפסים
│   │   │   ├── game/         # רכיבי משחק
│   │   │   ├── gameMode/     # בחירת מצב משחק
│   │   │   ├── home/         # רכיבי דף הבית
│   │   │   ├── icons/        # ספריית אייקונים
│   │   │   ├── layout/       # רכיבי פריסה
│   │   │   ├── leaderboard/  # רכיבי לוח תוצאות
│   │   │   ├── monitoring/   # רכיבי ניטור
│   │   │   ├── navigation/   # רכיבי ניווט
│   │   │   ├── points/       # רכיבי נקודות
│   │   │   ├── stats/        # רכיבי סטטיסטיקות
│   │   │   ├── subscription/ # רכיבי מנוי
│   │   │   ├── ui/           # רכיבי UI בסיסיים
│   │   │   └── user/         # רכיבי משתמש
│   │   ├── hooks/            # React Hooks
│   │   │   ├── api/          # Hooks ל-API
│   │   │   └── layers/       # Hooks בשכבות (ui/utils)
│   │   ├── redux/            # ניהול מצב
│   │   │   └── slices/       # Redux slices
│   │   ├── services/         # שירותי API
│   │   ├── types/            # טיפוסי TypeScript
│   │   ├── utils/            # פונקציות עזר
│   │   ├── constants/        # קבועים
│   │   └── styles/           # עיצובים
├── server/                    # שרת NestJS
│   ├── src/
│   │   ├── features/         # מודולים לפי תחום
│   │   │   ├── auth/         # אימות והרשאות
│   │   │   ├── user/         # ניהול משתמשים
│   │   │   ├── game/         # לוגיקת משחק (כולל trivia)
│   │   │   ├── points/       # מערכת נקודות
│   │   │   ├── payment/      # תשלומים
│   │   │   ├── subscription/ # מנויים
│   │   │   ├── analytics/    # אנליטיקה
│   │   │   └── leaderboard/  # לוח תוצאות
│   │   ├── internal/         # קוד פנימי משותף
│   │   │   ├── constants/    # קבועים פנימיים
│   │   │   ├── controllers/  # controllers פנימיים
│   │   │   ├── entities/     # ישויות TypeORM
│   │   │   ├── middleware/   # middleware
│   │   │   ├── modules/      # מודולים פנימיים
│   │   │   ├── repositories/ # repositories
│   │   │   ├── services/     # שירותים פנימיים
│   │   │   ├── types/        # טיפוסים פנימיים
│   │   │   └── utils/        # כלים פנימיים
│   │   ├── common/           # קוד משותף גלובלי
│   │   │   ├── auth/         # שירותי אימות
│   │   │   ├── decorators/   # דקורטורים
│   │   │   ├── guards/       # שומרי נתיבים
│   │   │   ├── interceptors/ # interceptors
│   │   │   ├── pipes/        # pipes
│   │   │   └── validation/   # ולידציה
│   │   ├── config/           # קונפיגורציה
│   │   ├── migrations/       # מיגרציות מסד נתונים
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   └── main.ts
├── shared/                    # ספריות משותפות
│   ├── types/                # טיפוסי TypeScript משותפים
│   │   ├── core/             # טיפוסי ליבה
│   │   ├── domain/           # טיפוסי תחום
│   │   ├── infrastructure/   # טיפוסי תשתית
│   │   └── ...               # קבצי טיפוסים נוספים
│   ├── constants/            # קבועים משותפים
│   ├── validation/           # ולידציה משותפת
│   ├── services/             # שירותים משותפים
│   ├── utils/                # פונקציות עזר משותפות
│   └── hooks/                # hooks משותפים
├── docs/                     # תיעוד
│   ├── ARCHITECTURE.md       # מסמכי ארכיטקטורה
│   ├── backend/              # תיעוד Backend
│   ├── frontend/             # תיעוד Frontend
│   ├── shared/               # תיעוד Shared
│   ├── database/             # מסמכי מסד נתונים
│   ├── tools/                # כלי פיתוח
│   ├── DEVELOPMENT.md  # מדריך פיתוח מקיף
│   ├── DEPLOYMENT.md         # מדריך פריסה
│   ├── DIAGRAMS.md           # תרשימים מפורטים
│   └── README.md             # אינדקס ראשי
└── scripts/                  # סקריפטים אוטומטיים
```

## 🛠️ טכנולוגיות
Frontend: React, TS, Redux Toolkit, Vite, Tailwind.
Backend: NestJS, TypeORM, PostgreSQL, Redis.
Shared: Types, Validation, Constants, Utils.

## 🚀 התחלה מהירה
1. התקנת תלויות: `pnpm install`
2. מסד נתונים: `database/DATABASE_SETUP.md`
3. הפעלה: `pnpm run dev`


## 📝 תרומה
פתח Issue / בצע Pull Request לפי הכללים הסטנדרטיים של GitHub.

## 🔗 קישורים
- GitHub: https://github.com/IsraelRub/EveryTriv
- README ראשי: `../README.md`
- Docker Compose: `../docker-compose.yaml`

---
 


