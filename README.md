# EveryTriv

פלטפורמת טריוויה חכמה (AI‑Enhanced Trivia) עם Frontend ב-React ו-Backend ב-NestJS. מסמך זה מספק סקירה סטטית ותמציתית של המבנה, ללא פירוט היסטוריית שינויים או תכונות עתידיות.

## 🧭 מבנה תיעוד מרכזי

לכלל המסמכים הארגוניים: ראה `docs/README.md` (אינדקס מלא). להלן כניסות מהירות עיקריות:

- ארכיטקטורה כללית: `docs/ARCHITECTURE.md`
- ארכיטקטורת Hooks (Frontend): `docs/frontend/HOOKS_ARCHITECTURE.md`
- מערכת עיצוב: `docs/frontend/DESIGN_SYSTEM.md`
- דיאגרמות: `docs/DIAGRAMS.md`
- פיתוח (Workflow וכלים): `docs/DEVELOPMENT.md`
- פריסה: `docs/DEPLOYMENT.md`
- קבצי תצורה: `docs/CONFIGURATION.md`
- מסד נתונים: `docs/database/DATABASE_SETUP.md`
- ספרייה משותפת (Shared): `docs/shared/SHARED_PACKAGE.md`

תיעוד מפורט נוסף מחולק לפי תחומים חדשים:

- Backend Features: `docs/backend/features/README.md` (כולל Auth, User, Game, Multiplayer, Analytics, Leaderboard, Credits, Payment, Admin, Maintenance)
- Frontend Structure: `docs/frontend/` (State, Hooks, Services, Components, Routing)
- Shared Layer: `docs/shared/` (Types, Validation, Constants, Utilities)

## 🛠 טכנולוגיות עיקריות

### Frontend
- React 18 + TypeScript
- Redux Toolkit לניהול מצב
- Vite לבנייה מהירה
- Tailwind CSS + מערכת טוקנים מותאמת

### Backend
- NestJS (מודולריות + DI)
- PostgreSQL (Persistency) + TypeORM
- Redis (Cache / Rate Limiting)
- OpenAPI (Swagger) ל-API

### שכבה משותפת (Shared)
- טיפוסים אחידים (Domain / Core / Infrastructure)
- ולידציה משותפת (Schemas)
- Utilities + Constants

## 🚀 התחלה מהירה

```bash
git clone https://github.com/IsraelRub/EveryTriv.git
cd EveryTriv
pnpm install
pnpm run dev   # הפעלה מקבילה של client+server
```

שרת ברירת מחדל: `http://localhost:3001`  |  ממשק לקוח: `http://localhost:5173`

## 📋 סקריפטים שימושיים

```bash
pnpm run dev           # פיתוח מלא
pnpm run build         # בנייה לכל החבילות הרלוונטיות
pnpm run lint          # בדיקות ESLint
pnpm run format        # עיצוב קוד
```

סקריפטים מפורטים נוספים: ראה תיקיית `scripts/` ותיעוד ייעודי ב-`docs/DEVELOPMENT.md`.

## 🐳 סביבת Docker בסיסית

```bash
docker-compose up -d
```
תצורות מלאות ופרופילי פיתוח מורחבים: `docs/DEPLOYMENT.md`.

## 💾 מסד נתונים

הגדרה מאוחדת (PostgreSQL + Redis) בדוקר: `docs/database/DATABASE_SETUP.md`.

## 🔐 אבטחה

JWT + Refresh Flow, בקרות תפקידים, ולידציה בכל שכבת כניסה (DTO + Pipes), Rate Limiting, Cache Layer.
פרטים: `docs/ARCHITECTURE.md` ו-`docs/backend/features/AUTH.md`.

## 🧩 מודולריות (Backend)

כל מודול תחום (Feature) כולל: Controller(s) + Service(s) + DTOs. ראה `docs/backend/features/` לפרטים על כל מודול.

## 🧠 לוגיקת משחק (Game Flow)

תיעוד סטטי לזרימות ושכבות: `docs/backend/features/GAME.md` + דיאגרמות ב-`docs/DIAGRAMS.md`.

## 🎨 UI ו-Hooks

Frontend Hooks בשכבות (API / Business / UI / Utils): ראה `docs/frontend/HOOKS_ARCHITECTURE.md` + פירוט שכבות ב-`docs/frontend/STATE.md`.

## 📚 קונסיסטנטיות טיפוסים

כל שימוש בנתונים בין לקוח ושרת עובר דרך טיפוסים משותפים ב-`shared/types`. ראה `docs/shared/TYPES.md`.
