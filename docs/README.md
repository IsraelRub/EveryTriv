# EveryTriv Documentation - אינדקס

תיעוד מאורגן לפי תחום.

## 📋 סקירה כללית

EveryTriv: פלטפורמת טריוויה חכמה (React + NestJS + Shared). ארכיטקטורה מודולרית, טיפוסים אחידים, ולידציה משותפת ותהליכי פיתוח עקביים.

## 🏗️ ארכיטקטורה

### מסמכים עיקריים
- **[ארכיטקטורה כללית](./architecture/ARCHITECTURE.md)**
- **[דיאגרמות](./DIAGRAMS.md)**
- **[סנכרון תרשימים ↔ קוד](./DIAGRAMS.md#diagram-sync-status)**
 - **[זרימת ליבת NestJS](./DIAGRAMS.md#nestjs-core-flow)**
 - **[מפת תלות Shared](./DIAGRAMS.md#shared-deps-map)**
- **[ארכיטקטורת השרת](./architecture/SERVER_ARCHITECTURE.md)**
- **[Hooks מתקדמים](./architecture/HOOKS_ARCHITECTURE.md)**
- **[לוגים וניטור (מאוחד)](./architecture/LOGGING_MONITORING.md)**

### עיצוב וממשק
- **[מערכת העיצוב](./architecture/DESIGN_SYSTEM.md)**

## 🛠️ פיתוח
- **[מדריך פיתוח](./development/DEVELOPMENT.md)**
- **[כלי פיתוח](./tools/DEVELOPMENT_TOOLS.md)**
- **[מערכת האנימציות](./development/ANIMATION_SYSTEM.md)**
- **[מערכת האודיו](./development/AUDIO_SYSTEM.md)**
- **[בדיקות](./TESTING.md)**
- **[מדריך תרומה](./development/contributing.md)**
- **[מדריך סגנון תיעוד](./STYLE_GUIDE.md)**


## 🚀 פריסה ותשתית

- **[מדריך פריסה](./deployment/DEPLOYMENT.md)**
- **[הגדרת Docker](./deployment/DOCKER_SETUP.md)**

## 🗄️ מסד נתונים

- **[הגדרת מסד נתונים](./database/UNIFIED_DATABASE_SETUP.md)**

## 🔧 Backend (NestJS)

- **[רשימת מודולים](./backend/FEATURES.md)**
- **[Auth](./backend/feature-auth.md)**
- **[Game](./backend/feature-game.md)**
- **[Points](./backend/feature-points.md)**
- **[Leaderboard](./backend/feature-leaderboard.md)**
- **[Analytics](./backend/feature-analytics.md)**
- **[Payment](./backend/feature-payment.md)**
- **[Subscription](./backend/feature-subscription.md)**
- **[User](./backend/feature-user.md)**
- **[API Reference](./backend/API_REFERENCE.md)**

## 🎛 Frontend (React)

- **[מבנה Frontend](./frontend/STRUCTURE.md)**
- **[State Management](./frontend/STATE.md)**
- **[Services](./frontend/SERVICES.md)**
- **[Components](./frontend/COMPONENTS.md)**
- **[Routing](./frontend/ROUTING.md)**
- **[Hooks מתקדמים](./architecture/HOOKS_ARCHITECTURE.md)**

## ♻ Shared Layer

- **[Types](./shared/TYPES.md)**
- **[Validation](./shared/VALIDATION.md)**
- **[Constants](./shared/CONSTANTS.md)**

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
- ארכיטקטורה: `architecture/`
- Backend: `backend/`
- Frontend: `frontend/`
- Shared: `shared/`
- פיתוח: `development/`
- פריסה: `deployment/`
- כלים: `tools/`
- מסד נתונים: `database/`

## 🏗️ מבנה פרויקט (תמציתי)

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

## 🛠️ טכנולוגיות
Frontend: React, TS, Redux Toolkit, Vite, Tailwind.
Backend: NestJS, TypeORM, PostgreSQL, Redis.
Shared: Types, Validation, Constants, Utils.

## 🚀 התחלה מהירה
1. התקנת תלויות: `pnpm install`
2. מסד נתונים: `database/UNIFIED_DATABASE_SETUP.md`
3. הפעלה: `pnpm run dev`


## 📝 תרומה
פתח Issue / בצע Pull Request לפי `development/contributing.md`.

## 🔗 קישורים
- GitHub: https://github.com/IsraelRub/EveryTriv
- README ראשי: `../README.md`
- Docker Compose: `../docker-compose.yaml`

---
 


