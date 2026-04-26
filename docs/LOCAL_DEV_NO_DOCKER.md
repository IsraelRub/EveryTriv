# פיתוח מקומי בלי Docker (PostgreSQL + Redis על המחשב)

מסמך זה משלים את `.env.dev` (מארח `localhost` ל־DB ו־Redis). **לא נדרש לערוך קבצי Docker** בפרויקט.

## דרישות

1. **PostgreSQL 16+** (או תואם) — מאזין בדרך כלל על **5432**.
2. **Redis** — בפרויקט זה Redis מקומי על Windows (winget) מוגדר על **6380** כדי לא להתנגש עם Docker שמשתמש ב־**6379** על המארח (גרסת `Redis on Windows` מ־winget היא 3.x; מספיקה לפיתוח מקומי).
3. קובץ **`.env`** בשורש הריפו (העתק מ־`.env.example`) + פרופיל **`.env.dev`** (נשמר ב־git).

## סנכרון `.env` עם השירותים המקומיים

| משתנה | הערה |
|--------|------|
| `DATABASE_HOST` / `DATABASE_PORT` | ב־`.env.dev` כבר `localhost` ו־`5432`; הסיסמה והמשתמש ב־`.env`. |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME` | חייבים להתאים למה שיצרת ב־Postgres (למשל `everytriv_user` / `everytriv`). |
| `REDIS_HOST` / `REDIS_PORT` | ב־`.env.dev` כבר `localhost` ו־**`6380`** (מקביל ל־Docker על 6379). |
| `REDIS_PASSWORD` | ב־`.env.dev` מוגדרת סיסמת פיתוח **`EveryTrivLocalRedis6380!`** — חייבת **בדיוק** להתאים ל־`requirepass` ב־`redis.windows.conf` של השירות המקומי. אם Redis **ללא סיסמה**, השאר ריק ב־`.env` ובטל `requirepass` בקונפיג (השרת מתייחס לערך ריק כאל «ללא אימות»). |

## אפשרויות להרצת Redis על Windows (בלי עריכת קבצי Docker של הפרויקט)

### ד) התקנה מהירה — `winget` (Redis on Windows, Microsoft archive)

מהשורש (או מכל מקום), עם טרמינל רגיל:

```powershell
winget install --id Redis.Redis --accept-package-agreements --accept-source-agreements
```

או מהריפו:

```bash
pnpm run redis:install:windows
```

אחרי ההתקנה **סגור ופתח מחדש את הטרמינל** כדי ש־`redis-cli` ו־`redis-server` יהיו ב־`PATH`.  
ברירת מחדל: התקנה תחת `C:\Program Files\Redis`, קובץ הגדרות `redis.windows.conf`, שירות Windows בשם **Redis**.

**הערה:** שירות Windows (`sc qc Redis`) משתמש ב־**`redis.windows-service.conf`**, לא רק ב־`redis.windows.conf`. אחרי התקנה מומלץ: `pnpm run redis:apply:windows-local` (מעדכן את שני הקבצים ומפעיל את השירות).

**הגדרה מומלצת (מקביל ל־Docker על 6379):** ערוך את `redis.windows-service.conf` / `redis.windows.conf` (כמנהל אם צריך):

- `port 6380` (במקום `6379`)
- `requirepass EveryTrivLocalRedis6380!` (או הסר את השורה אם בוחרים Redis ללא סיסמה — ואז רוקן `REDIS_PASSWORD` ב־`.env.dev`)

**אלטרנטיבה בלי לערוך את גוף הקובץ ב־Program Files:** הוסף **בשורה האחרונה** של `redis.windows.conf` (נתיב מלא לפי מיקום הריפו שלך):

```text
include C:/Software/Fullstack/Projects/EveryTriv/tools/redis/everytriv-local-override.conf
```

(הקובץ `tools/redis/everytriv-local-override.conf` מכיל את `port` וה־`requirepass` המתואמים ל־`.env.dev`.)

הפעלה (נדרש לעיתים **הרצה כמנהל** אם השירות לא עולה):

```powershell
Start-Service Redis
```

בדיקה **עם סיסמה** (אם הגדרת `requirepass` או אם אתה מצביע על Redis שדורש AUTH — למשל כמו ב־Docker):

```powershell
redis-cli -p 6380 -a "EveryTrivLocalRedis6380!" ping
```

### התנגשות על פורט 6379 / 6380

אם קונטיינר Docker עדיין מאזין על **`6379`** על המארח, השאר את Redis של Windows על **`6380`** (כמו ב־`.env.dev`). אם גם `6380` תפוס, שנה פורט ב־`redis.windows.conf` וב־`REDIS_PORT` ב־`.env.dev` באותו ערך.

כל עוד האפליקציה מצביעה על `REDIS_HOST`/`REDIS_PORT`, `REDIS_PASSWORD` חייב להתאים **בדיוק** לאותו instance של Redis (כולל `requirepass`).

### א) WSL2 (מומלץ אם כבר משתמשים ב־WSL)

```bash
sudo apt update && sudo apt install -y redis-server
sudo service redis-server start
redis-cli ping   # צריך להחזיר PONG
```

ברירת מחדל: **ללא סיסמה**. אז ב־`.env` השאר `REDIS_PASSWORD` ריק או הערה בלבד.

### ב) Memurai Developer (Redis תואם ל־Windows)

הורדה מהאתר של Memurai, התקנה, הפעלת השירות. הגדר סיסמה בממשק או בקובץ config — ואז אותה סיסמה ב־`REDIS_PASSWORD` ב־`.env`.

### ג) Redis מקורי על Windows (למשל דרך Chocolatey / פריטים אחרים)

ודא שהשירות רץ על `127.0.0.1:6379` ושהסיסמה (אם יש) תואמת ל־`.env`.

## PostgreSQL מקומי

צור משתמש ומסד נתונים שתואמים ל־`.env`:

```sql
CREATE USER everytriv_user WITH PASSWORD 'your-database-password-here';
CREATE DATABASE everytriv OWNER everytriv_user;
```

הרץ מיגרציות מהשרת (אחרי `pnpm install` בשורש):

```bash
cd server && pnpm exec typeorm-ts-node-commonjs migration:run -d src/config/dataSource.ts
```

(או הפקודה המתועדת ב־`server/package.json` תחת `migration:run`.)

## בדיקה מהירה לפני `pnpm run start:dev`

מהשורש:

```bash
pnpm run dev:check
```

הסקריפט בודק ש־**TCP** פתוח על מארחי ה־DB וה־Redis לפי הערכים ב־`.env` (או ברירות מחדל).

## הרצת האפליקציה

```bash
pnpm install
pnpm run dev:check    # אופציונלי אך מומלץ
pnpm run start:dev
```

- API מקומי: **http://localhost:3001**  
- Vite: **http://localhost:5173**

## תקלות נפוצות

| תסמין | כיוון בדיקה |
|--------|-------------|
| שגיאות חיבור Redis | סיסמה, פורט, שירות לא רץ — `redis-cli ping`. |
| שגיאות DB | `DATABASE_HOST`/`PORT`, משתמש/סיסמה, האם Postgres מאזין. |
| 500 על leaderboard / cache | לעיתים Redis לא זמין או סיסמה שגויה — לוגים ב־`server/logs/server.log`. |
