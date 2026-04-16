# Cloudflared (דמו ציבורי)

מסמך טכני מלא ל־**Cloudflare Tunnel** בפרויקט EveryTriv. סקירה קצרה למפתחים: `README.md` (סעיף Docker → דמו ציבורי).

## מה זה עושה

**Quick Tunnel** יוצר כתובת `https://*.trycloudflare.com` (או דומה) שמפנה ל־**קונטיינר ה־client** (nginx על פורט 3000). אותו host משרת SPA + `/api` + `/auth` + `/socket.io` (כמו בתיעוד `USE_ORIGIN_API_PREFIX`).

## איך להריץ (שלוש דרכים)

### 1) CLI על המחשב (מומלץ כש־Docker כבר רץ ופורט 3000 פתוח ב־localhost)

**התקנה (Windows, CLI):**

```text
winget install --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
```

פתח טרמינל חדש אחרי ההתקנה. בדיקה:

```text
cloudflared --version
```

**הרצה:**

```text
pnpm run tunnel:cloudflared
```

או ישירות:

```text
cloudflared tunnel --no-autoupdate --url http://127.0.0.1:3000
```

העתק מהפלט את שורת ה־`https://…`.

**macOS (Homebrew):** `brew install cloudflared`  
**Linux:** ראה [הורדות Cloudflare](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).

### 2) קונטיינר בתוך Docker Compose (אותה רשת כמו `client`)

לא דורש התקנת `cloudflared` על ה־host — רק Docker.

```text
docker compose up -d
docker compose --profile demo-tunnel up --build -d
```

**רק קונטיינרים + טונל (בלי סנכרון `.env` / everytriv-link):**

```text
pnpm run start:demo:up
```

**זרם מלא (מומלץ לדמו ציבורי):** stack + המתנה ל־`https://*.trycloudflare.com` בלוגים + `sync-demo-redirect` (בילד `client` כברירת מחדל):

```text
pnpm run start:demo
```

דחיפה ל־GitHub (everytriv-link) היא **ברירת מחדל** עם `pnpm run start:demo`. בלי דחיפה: `pnpm run start:demo:local`.  
(פרמטרים נוספים: `-SkipPages`, `-SkipUp`, `-NoGitPush`, `-RebuildClient:$false` — ראה `scripts/deployment/start-docker-demo-and-sync.ps1`.)

ה־URL מופיע בלוגים אם מריצים רק `start:demo:up`:

```text
pnpm run tunnel:cloudflared:logs
```

או: `docker compose logs cloudflared` (חפש `https://`).

השירות `cloudflared` ב־`docker-compose.yaml` מריץ:

`tunnel --no-autoupdate --url http://client:3000`

כלומר גישה ל־nginx של הקליינט דרך שם השירות `client` ברשת `everytriv-net`.

### 3) שילוב ידני

כל עוד קיים שירות שמקשיב על `3000` (Docker או לא), אפשר תמיד להריץ `cloudflared` עם `--url` המתאים.

## אחרי שיש לך את ה־https הציבורי

**אוטומטי (מומלץ):** מתיקיית השורש של המונוריפו —  

- **הכל ברצף (דוקר + המתנה לטונל + סנכרון + דחיפה ל־Pages):** `pnpm run start:demo` (בלי דחיפה: `pnpm run start:demo:local`).
- עם כתובת מפורשת:  
  `.\scripts\deployment\sync-demo-redirect.ps1 -FrontendTunnelUrl 'https://…' -RebuildClient -GitPush`
- **בלי להעתיק URL ידנית** (טונל בדוקר, פרופיל `demo-tunnel`): הסקריפט קורא את `https://*.trycloudflare.com` מ־`docker compose logs cloudflared`:  
  `.\scripts\deployment\sync-demo-redirect.ps1 -DiscoverUrlFromDockerLogs -RebuildClient -GitPush`
- טונל על ה־host: שמור את פלט הטרמינל לקובץ והרץ עם `-TunnelLogFilePath '…\cloudflared.log'`.

(מעדכן `.env` כולל `COOKIE_SECURE` לטונל HTTPS, כותב ל־`everytriv-link/index.html`, בונה client, `docker compose up -d server client`, דוחף submodule + מצביע במונוריפו.)  
לעדכון `.env` בלבד: הוסף `-SkipPages`.

**ידני:**

1. ב־`.env` בשורש: `SERVER_URL` ו־`CLIENT_URL` = אותו URL; `VITE_API_BASE_URL=USE_ORIGIN_API_PREFIX`.
2. `docker compose build client` ו־`docker compose up -d client`.
3. בריפו `everytriv-link`: עדכן `FRONTEND_DEMO_URL` ב־`index.html` ודחוף ל־`main`.
4. Google OAuth: origins + redirect על אותו host.

## הערות

- כתובת Try Cloudflare **משתנה** בדרך כלל בכל הרצה חדשה של Quick Tunnel.
- `pnpm run tunnel:cloudflared` דורש ש־`cloudflared` יהיה ב־PATH (אחרי winget — לפעמים טרמינל חדש).
