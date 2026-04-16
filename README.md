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

שרת ברירת מחדל (מקומי): `http://localhost:3002`  |  ממשק לקוח (Vite): `http://localhost:5173`

## 📋 סקריפטים שימושיים

```bash
pnpm run dev           # פיתוח מלא
pnpm run build         # בנייה לכל החבילות הרלוונטיות
pnpm run lint          # בדיקות ESLint
pnpm run format        # עיצוב קוד
pnpm run tunnel:cloudflared       # Quick Tunnel מול localhost:3000 (דורש cloudflared ב-PATH)
pnpm run start:demo               # דמו מלא: up + URL + .env + everytriv-link + בילד client + דחיפת Git ל-Pages + restart server/client
pnpm run start:demo:local         # כמו start:demo בלי commit/push ל-GitHub
pnpm run start:demo:up            # docker compose + demo-tunnel + --build (כמו docker:start), בלי סנכרון .env / everytriv-link
pnpm run tunnel:cloudflared:logs  # לוגים של קונטיינר cloudflared (אחרי start:demo:up או אם מריצים רק את הטונל)
```

סקריפטים מפורטים נוספים: ראה תיקיית `scripts/` ותיעוד ייעודי ב-`docs/DEVELOPMENT.md`.

## 🐳 סביבת Docker בסיסית

העתק `.env.example` ל־`.env` בשורש הריפו, מלא סודות ומפתחות (JWT, DB, Redis, OAuth וכו'), ואז:

```bash
docker compose up -d
```

ברירת מחדל: שרת על פורט `3002`, לקוח (nginx) על `3000`; `VITE_API_BASE_URL=USE_ORIGIN_API_PREFIX` גורם ל־REST דרך אותו מארח כמו ה־SPA (`/api` מאחורי nginx).

#### `.env` ובניית הקליינט (Docker)

- תבנית מלאה: **`.env.example`** — העתק ל־**`.env`** בשורש הריפו (הקובץ האמיתי לא ב־git).
- שירות `server` קורא את `.env` בזמן ריצה; אימות חובה: `server/src/config/environment.validation.ts`.
- משתני **`VITE_*`** נכנסים ל־**בילד** של תמונת הקליינט (`docker compose build client`), לא נטענים דינמית בקונטיינר. אחרי שינוי `VITE_API_BASE_URL` או כתובות ציבוריות לדמו — **בנה מחדש** את `client` ואז `docker compose up -d client` (או `up -d` לכל ה־stack).

### דמו ציבורי (Cloudflare Quick Tunnel)

טונל פותח את מה שרץ אצלך על פורט **3000** (קונטיינר `client` / nginx) לכתובת **`https` ציבורית** (`*.trycloudflare.com` ב־Quick Tunnel). **`cloudflared` אינו חלק מ־`pnpm install`** (CLI חיצוני). בפרויקט: סקריפטים ב־`package.json`, שירות Docker אופציונלי (פרופיל `demo-tunnel`), ו־`scripts/deployment/sync-demo-redirect.ps1`. **התקנת CLI על ה־host, טונל בדוקר, ופקודות מלאות:** `docs/deployment/CLOUDFLARED.md`.

#### צעדים (טונל יחיד — מומלץ)

1. `.env` בשורש המונוריפו (העתק מ־`.env.example` והשלם סודות).
2. **`pnpm run start:demo`** — מרים stack כולל `demo-tunnel`, מחכה ל־URL בלוגי cloudflared, מעדכן `.env` (כולל `COOKIE_SECURE` לטונל HTTPS), `everytriv-link/index.html`, בונה `client`, מריץ `docker compose up -d server client`, ודוחף ל־GitHub Pages (ברירת מחדל). בלי דחיפה: `pnpm run start:demo:local`.  
   **חלופות:** רק קונטיינרים + טונל בלי סנכרון — `pnpm run start:demo:up`; טונל מה־host — `pnpm run tunnel:cloudflared` אחרי ש־`client` על `3000`; סנכרון ידני — `.\scripts\deployment\sync-demo-redirect.ps1` (ראה `docs/deployment/CLOUDFLARED.md`).
3. **Google OAuth (אם בשימוש):** ב־Google Cloud Console — origins + redirect `…/auth/google/callback` על אותו host כמו כתובת הטונל.

#### אימות

- `scripts/deployment/verify-demo-remote.ps1 -TunnelBaseUrl 'https://…'` — אופציונלי `-PagesUrl` (everytriv-link) ו־`-SkipLocal` אם אין לקוח על `127.0.0.1:3000`. עזר: `DemoDeployment.Common.ps1`.
- דפדפן: כתובת הטונל; `/api/health/liveness` על אותו host.

מצביע: `scripts/deployment/DEMO_STATIC_LINK.md`.

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
