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
pnpm run start:docker:demo        # docker compose + פרופיל demo-tunnel (טונל בתוך Docker)
pnpm run tunnel:cloudflared:logs  # לוגים של קונטיינר cloudflared (אחרי start:docker:demo)
```

סקריפטים מפורטים נוספים: ראה תיקיית `scripts/` ותיעוד ייעודי ב-`docs/DEVELOPMENT.md`.

## 🐳 סביבת Docker בסיסית

העתק `.env.example` ל־`.env` בשורש הריפו, מלא סודות ומפתחות (JWT, DB, Redis, OAuth וכו'), ואז:

```bash
docker compose up -d
```

ברירת מחדל: שרת על פורט `3002`, לקוח (nginx) על `3000`; `VITE_API_BASE_URL=USE_ORIGIN_API_PREFIX` גורם ל־REST דרך אותו מארח כמו ה־SPA (`/api` מאחורי nginx).

### דמו ציבורי — טונל אחד

טונל הוא **שירות חיצוני** שפותח את מה שרץ אצלך ב־`localhost` (או בקונטיינר `client`) לכתובת `https` ציבורית. **התקנת `cloudflared` על המחשב** אינה חלק מ־`pnpm install`; עם זאת הפרויקט כולל **סקריפטים ב־`package.json`** ושירות **אופציונלי ב־Docker Compose** (פרופיל `demo-tunnel`) — ראה גם `docs/deployment/CLOUDFLARED.md`.

#### מה כדאי להתקין

| כלי | מתאים כש… | יתרונות | חסרונות |
|-----|-----------|---------|---------|
| **Cloudflare Tunnel (`cloudflared`)** | רוצים דמו חינמי עם פקודה אחת, בלי מנוי | Quick Tunnel חינמי, ללא הגבלת זמן סשן כמו ב־ngrok חינמי, תעבורה HTTP בדרך כלל בלי תשלום | כתובת ה־URL **משתנה** בכל הרצה של Try Cloudflare; אין לובי בדיקות מתקדם כמו ב־ngrok |
| **ngrok** | רוצים ממשק אתר לבקשות, חיבור מהיר אחרי `authtoken` | חוויית מפתח ויזואלית, תיעוד רחב | חשבון חובה; בשכבה החינמית יש **הגבלות** (אורך סשן, תהליך אחד, וכו' לפי מדיניות ngrok) |

**המלצה ברירת מחדל לדמו אישי חד־פעמי:** התקן **`cloudflared`** והרץ Quick Tunnel לפורט `3000`. אם כבר משתמש ב־ngrok או צריך את לוח הבקשות — השתמש ב־ngrok.

#### התקנה ב־Windows

**Cloudflared (מומלץ להתחלה):**

```text
winget install --id Cloudflare.cloudflared
```

פתח טרמינל חדש ובדוק: `cloudflared --version`.

**ngrok:** הורדה מ־[ngrok.com/download](https://ngrok.com/download), הרשמה, ואז `ngrok config add-authtoken <הטוקן מהדשבורד>`.

#### צעדים מלאים (מצב tunnel יחיד לפורט 3000)

1. **הרץ את המערכת:** משרש הריפו — `docker compose up -d` (וודא שהקונטיינר `client` מקשיב על `3000` וה־stack בריא).
2. **הרץ טונל** (בחר אחת):
   - **CLI מהשורש:** `pnpm run tunnel:cloudflared` (שקול ל־`cloudflared tunnel --no-autoupdate --url http://127.0.0.1:3000`).
   - **Docker (בלי cloudflared על ה־host):** `pnpm run start:docker:demo` — מפעיל את כל ה־stack כולל קונטיינר `cloudflared` (פרופיל `demo-tunnel`). את ה־`https://…` רואים ב־`pnpm run tunnel:cloudflared:logs` או `docker compose logs cloudflared`.
   - **ידני:** `cloudflared tunnel --no-autoupdate --url http://127.0.0.1:3000` או `ngrok http 3000`.
3. **העתק את כתובת ה־`https://…`** מהפלט (זו כתובת הציבור של הדמו לסשן הזה).
4. **עדכן את `.env` בשורש הריפו** (אותה כתובת בשני השדות, בלי סלאש בסוף):
   - `SERVER_URL=<https://…>`
   - `CLIENT_URL=<https://…>`
   - `VITE_API_BASE_URL=USE_ORIGIN_API_PREFIX`
5. **הטמע את ה־URL בבילד של הקליינט:**  
   `docker compose build client`  
   ואז `docker compose up -d client`.
6. **דף הקישור הקבוע (GitHub Pages — ריפו `everytriv-link`):** בקובץ `index.html` עדכן את השורה  
   `var FRONTEND_DEMO_URL = "";`  
   ל־  
   `var FRONTEND_DEMO_URL = "https://…";`  
   (אותה כתובת כמו ב־`CLIENT_URL`), commit ו־push ל־`main`.
7. **Google OAuth (אם בשימוש):** ב־Google Cloud Console — **Authorized JavaScript origins** ו־**Authorized redirect URIs** (`…/auth/google/callback`) על אותו host כמו כתובת הטונל.

#### אימות שזה עובד

- בדפדפן (אפשר מכשיר אחר או חלון גלישה בסתר): פתיחת כתובת הטונל — אמור להיטען האפליקציה; בדיקה ש־`/api/health/liveness` דרך אותו host מחזירה תשובה תקינה (למשל מהדפדפן או כלי HTTP).
- פתיחת כתובת ה־Pages של `everytriv-link` — אמורה להפנות לטונל (אם `FRONTEND_DEMO_URL` עודכן ונדחף).

#### מצב ישן: שני טונלים (3000 + 3002)

אם בוחרים טונל נפרד ל־API: ב־`.env` — `CLIENT_URL` = טונל ל־3000, `SERVER_URL` ו־`VITE_API_BASE_URL` = טונל ל־3002, ובניית client מחדש אחרי שינוי.

מצביעים טכניים: `docs/deployment/CLOUDFLARED.md` (מלא), `scripts/deployment/DEMO_STATIC_LINK.md` (קישור ל־README).

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
