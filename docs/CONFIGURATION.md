# קבצי תצורה - EveryTriv

מסמך מקיף המתאר את כל קבצי התצורה בפרויקט EveryTriv, מיקומם, תפקידם והקשר ביניהם.

## תוכן עניינים

- [סקירה כללית](#סקירה-כללית)
- [קבצי תצורה ברמה העליונה (Root)](#קבצי-תצורה-ברמה-העליונה-root)
- [קבצי תצורה - Client](#קבצי-תצורה---client)
- [קבצי תצורה - Server](#קבצי-תצורה---server)
- [קבצי תצורה - Shared](#קבצי-תצורה---shared)
- [קבצי תצורה - Tools](#קבצי-תצורה---tools)
- [קבצי תצורה - Docker](#קבצי-תצורה---docker)
- [קבצי תצורה נוספים](#קבצי-תצורה-נוספים)
- [תלויות בין קבצי תצורה](#תלויות-בין-קבצי-תצורה)

---

## סקירה כללית

הפרויקט EveryTriv הוא מונורפו (monorepo) המאורגן בכמה חבילות:
- **client/** - React Frontend (Vite)
- **server/** - NestJS Backend
- **shared/** - קוד משותף בין client ו-server
- **tools/** - קבצי תצורה משותפים לכל הפרויקט

כל חבילה שומרת את קבצי התצורה שלה קרוב לקוד, בהתאם לסטנדרטים של הכלים המשמשים.

---

## קבצי תצורה ברמה העליונה (Root)

### `package.json`
**מיקום:** `./package.json`  
**תפקיד:** הגדרת workspace, סקריפטים גלובליים ותלויות משותפות  
**תכונות עיקריות:**
- מנהל חבילות: `pnpm@8.15.0`
- סקריפטים גלובליים: `format`, `lint`, `build:all`, `start:dev`, וכו'
- תלויות משותפות: `concurrently`, `prettier`, `eslint`, `knip`

**סקריפטים מרכזיים:**
```json
{
  "format": "prettier --config tools/.prettierrc ...",
  "lint": "eslint . --config tools/eslint.config.js",
  "build:all": "pnpm run build:server && pnpm run build:client"
}
```

### `pnpm-workspace.yaml`
**מיקום:** `./pnpm-workspace.yaml`  
**תפקיד:** הגדרת pnpm workspace למונורפו  
**תוכן:**
```yaml
packages:
  - 'client'
  - 'server'
```

### `.gitignore`
**מיקום:** `./.gitignore`  
**תפקיד:** הגדרת קבצים ותיקיות להתעלם מ-git  
**קטגוריות:**
- Dependencies (`node_modules/`, `pnpm-debug.log*`)
- Build outputs (`dist/`, `build/`, `dist-temp/`)
- Environment variables (`.env*`)
- IDE files (`.vscode/`, `.idea/`, `.cursor/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Logs, cache, temporary files

### `docker-compose.yaml`
**מיקום:** `./docker-compose.yaml`  
**תפקיד:** הגדרת שירותי Docker (PostgreSQL, Redis, Server, Client)  
**שירותים:**
- `postgres` - PostgreSQL 16 Alpine
- `redis` - Redis 7 Alpine
- `server` - NestJS Backend
- `client` - React Frontend (Nginx)

---

## קבצי תצורה - Client

### `client/package.json`
**מיקום:** `client/package.json`  
**תפקיד:** הגדרת חבילת React Frontend  
**תכונות:**
- Type: `module` (ESM)
- Package Manager: `pnpm@8.15.0`
- Dependencies: React 18, Redux Toolkit, React Query, Tailwind CSS, וכו'
- Scripts: `start`, `build`, `lint`, `format`

### `client/vite.config.ts`
**מיקום:** `client/vite.config.ts`  
**תפקיד:** תצורת Vite לבנייה ופיתוח  
**תכונות עיקריות:**
- Plugin: `@vitejs/plugin-react`
- Build output: `dist/`
- Server port: `3000` (מוגדר ב-`LOCALHOST_CONFIG`)
- Proxy: כל ה-API requests מועברים לשרת
- Path aliases:
  - `@/*` → `./src/*`
  - `@shared/*` → `../shared/*`
- HMR: מוגדר עם WebSocket על פורט `24678`

**דוגמה:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: LOCALHOST_CONFIG.ports.CLIENT,
    proxy: { /* API proxy configuration */ }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
});
```

### `client/tsconfig.json`
**מיקום:** `client/tsconfig.json`  
**תפקיד:** תצורת TypeScript ל-Client  
**תכונות:**
- Target: `ES2020`
- Module: `ESNext`
- JSX: `react-jsx`
- Strict mode: מופעל
- Path aliases: תואם ל-`vite.config.ts`
- OutDir: `./dist-temp` (לבדיקות TypeScript)

**Path Aliases:**
```json
{
  "@/*": ["./src/*"],
  "@shared/*": ["../shared/*"],
  "@shared/constants": ["../shared/constants"]
}
```

### `client/tailwind.config.ts`
**מיקום:** `client/tailwind.config.ts`  
**תפקיד:** תצורת Tailwind CSS  
**תכונות:**
- Content: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- Theme extensions: צבעים מותאמים (primary, secondary, success, warning, error)
- Plugins: `tailwindcss-animate`

### `client/postcss.config.js`
**מיקום:** `client/postcss.config.js`  
**תפקיד:** תצורת PostCSS  
**תכונות:**
- Plugins: `tailwindcss`, `autoprefixer`
- נחוץ ל-Tailwind CSS לעבוד

### `client/index.html`
**מיקום:** `client/index.html`  
**תפקיד:** קובץ HTML ראשי  
**תכונות:**
- Entry point: `/src/main.tsx`
- Favicon: `/assets/logo.svg`
- Meta tags: viewport, description

### `client/Dockerfile`
**מיקום:** `client/Dockerfile`  
**תפקיד:** הגדרת Docker image ל-Client  
**שלבים:**
1. Builder: Node.js 18 Alpine - בונה את האפליקציה
2. Production: Nginx Alpine - משרת את הקבצים הסטטיים

**שימוש:**
```dockerfile
FROM node:18-alpine AS builder
# ... build steps ...
FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/nginx.conf
```

### `client/nginx.conf`
**מיקום:** `client/nginx.conf`  
**תפקיד:** תצורת Nginx ל-production  
**תכונות:**
- Port: `3000`
- SPA routing: `try_files $uri $uri/ /index.html`
- Gzip compression: מופעל
- Cache: 1 year לקבצים סטטיים
- Security headers: X-Frame-Options, X-Content-Type-Options, וכו'
- Health check: `/health` endpoint

---

## קבצי תצורה - Server

### `server/package.json`
**מיקום:** `server/package.json`  
**תפקיד:** הגדרת חבילת NestJS Backend  
**תכונות:**
- Package Manager: `pnpm@9.15.0`
- Dependencies: NestJS 11, TypeORM, PostgreSQL, Redis, Socket.IO, וכו'
- Scripts: `start:dev`, `build`, `migration:run`, וכו'

### `server/tsconfig.json`
**מיקום:** `server/tsconfig.json`  
**תפקיד:** תצורת TypeScript ל-Server  
**תכונות:**
- Target: `ES2021`
- Module: `commonjs`
- Decorators: מופעלים (לצורך NestJS)
- Strict mode: מופעל
- Path aliases: `@shared/*`, `@internal/*`, `@features/*`, `@common/*`

**Path Aliases:**
```json
{
  "@shared/*": ["../shared/*"],
  "@internal/*": ["src/internal/*"],
  "@features/*": ["src/features/*"],
  "@common/*": ["src/common/*"]
}
```

### `server/tsconfig.build.json`
**מיקום:** `server/tsconfig.build.json`  
**תפקיד:** תצורת TypeScript לבנייה  
**תכונות:**
- Extends: `./tsconfig.json`
- Excludes: `test`, `**/*spec.ts` (לא נכללים ב-build)

### `server/nest-cli.json`
**מיקום:** `server/nest-cli.json`  
**תפקיד:** תצורת NestJS CLI  
**תכונות:**
- Source root: `src`
- Entry file: `main`
- OutDir: `dist`
- Delete outDir: `true` (מנקה לפני build)

### `server/Dockerfile`
**מיקום:** `server/Dockerfile`  
**תפקיד:** הגדרת Docker image ל-Server  
**תכונות:**
- Base: Node.js 20 Alpine
- pnpm: גרסה 9
- Build: בונה את כל ה-workspace
- Runtime: מפעיל את ה-server מה-`dist/`

---

## קבצי תצורה - Shared

### `shared/tsconfig.json`
**מיקום:** `shared/tsconfig.json`  
**תפקיד:** תצורת TypeScript ל-Shared package  
**תכונות:**
- Target: `ES2020`
- Module: `CommonJS`
- Path aliases: `@shared/*` → `./*`
- Strict mode: מופעל

**Path Aliases:**
```json
{
  "@shared": ["."],
  "@shared/*": ["./*"],
  "@shared/constants": ["./constants"],
  "@shared/services": ["./services"]
}
```

---

## קבצי תצורה - Tools

### `tools/.prettierrc`
**מיקום:** `tools/.prettierrc`  
**תפקיד:** תצורת Prettier לכל הפרויקט  
**תכונות:**
- Print width: `120`
- Use tabs: `true`
- Single quote: `true`
- Semicolons: `true`
- Plugin: `@ianvs/prettier-plugin-sort-imports` (מיון ייבואים אוטומטי)

**Import Order:**
1. React packages
2. External packages
3. `@shared` imports
4. `@internal` imports
5. `@features` imports
6. `@common` imports
7. `@/` imports (client only)
8. Relative imports

**שימוש:**
- Root: `pnpm run format`
- Client: `pnpm run format` (משתמש ב-`../tools/.prettierrc`)
- Server: `pnpm run format` (משתמש ב-`../tools/.prettierrc`)

### `tools/.prettierignore`
**מיקום:** `tools/.prettierignore`  
**תפקיד:** קבצים להתעלם מ-Prettier  
**תכונות:**
- `node_modules/`, `dist/`, `build/`
- `*.md`, `*.json`, `*.html`
- קבצי תצורה שונים

### `tools/eslint.config.js`
**מיקום:** `tools/eslint.config.js`  
**תפקיד:** תצורת ESLint מאוחדת לכל הפרויקט  
**תכונות:**
- Configs נפרדים ל-Client ו-Server
- TypeScript support
- React support (ל-Client)
- Import rules
- Prettier integration

**שימוש:**
- Root: `pnpm run lint`
- Client: `pnpm run lint` (משתמש ב-`../tools/eslint.config.js`)
- Server: `pnpm run lint` (משתמש ב-`../tools/eslint.config.js`)

### `tools/knip.json`
**מיקום:** `tools/knip.json`  
**תפקיד:** תצורת Knip לזיהוי קוד לא בשימוש  
**תכונות:**
- Workspaces: client, server, shared
- Ignore patterns: קבצים שמוכרים כשימושיים אבל Knip לא מזהה
- TypeScript configs: מצביעים לקבצי `tsconfig.json` של כל package

### `tools/endpoints-collection.json`
**מיקום:** `tools/endpoints-collection.json`  
**תפקיד:** אוסף endpoints לבדיקות API עם Newman  
**שימוש:** `pnpm run api:test`

---

## קבצי תצורה - Docker

### `docker-compose.yaml`
**מיקום:** `./docker-compose.yaml`  
**תפקיד:** הגדרת כל שירותי Docker  
**שירותים:**

#### PostgreSQL
- Image: `postgres:16-alpine`
- Port: `5432`
- Database: `everytriv`
- Health check: `pg_isready`

#### Redis
- Image: `redis:7-alpine`
- Port: `6379`
- Password: מוגדר ב-command
- Health check: `redis-cli ping`

#### Server
- Build: `server/Dockerfile`
- Port: `3002`
- Depends on: postgres, redis

#### Client
- Build: `client/Dockerfile`
- Port: `3000`
- Depends on: server

---

## קבצי תצורה נוספים

### `.vscode/tasks.json`
**מיקום:** `.vscode/tasks.json`  
**תפקיד:** הגדרת tasks ל-VS Code  
**תכונות:** Tasks להרצת client/server בפיתוח

### `.npmrc` (אם קיים)
**מיקום:** `./.npmrc`  
**תפקיד:** תצורת npm/pnpm  
**תכונות:** הגדרות registry, cache, וכו'

---

## תלויות בין קבצי תצורה

### היררכיית תלויות:

```
Root package.json
├── pnpm-workspace.yaml (מגדיר את ה-workspace)
├── tools/.prettierrc (משמש את כל הסקריפטים)
├── tools/eslint.config.js (משמש את כל הסקריפטים)
│
├── client/
│   ├── package.json (תלוי ב-shared)
│   ├── vite.config.ts (משתמש ב-shared/constants)
│   ├── tsconfig.json (מפנה ל-shared)
│   ├── tailwind.config.ts
│   ├── postcss.config.js (תלוי ב-tailwind.config.ts)
│   ├── Dockerfile (משתמש ב-nginx.conf)
│   └── nginx.conf
│
├── server/
│   ├── package.json (תלוי ב-shared)
│   ├── tsconfig.json (מפנה ל-shared)
│   ├── nest-cli.json
│   └── Dockerfile
│
└── shared/
    └── tsconfig.json
```

### Path Aliases משותפים:

כל הקבצים משתמשים ב-path aliases זהים ל-shared:
- `@shared` → `../shared`
- `@shared/*` → `../shared/*`
- `@shared/constants` → `../shared/constants`
- `@shared/services` → `../shared/services`
- `@shared/types` → `../shared/types`
- `@shared/utils` → `../shared/utils`
- `@shared/validation` → `../shared/validation`

### Environment Variables:

**Client:**
- `VITE_API_BASE_URL` - כתובת ה-API
- `VITE_APP_NAME` - שם האפליקציה

**Server:**
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, וכו'
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- API keys ל-AI providers

---

## המלצות לתחזוקה

1. **עקביות:** כל קבצי התצורה משתמשים באותה תצורת Prettier ו-ESLint מ-`tools/`
2. **Path Aliases:** וודא שכל ה-path aliases זהים בכל הקבצים
3. **Versions:** שמור על גרסאות עקביות של כלים (pnpm, TypeScript, וכו')
4. **Documentation:** עדכן מסמך זה כאשר מוסיפים או משנים קבצי תצורה

---

## הפניות

- [מדריך פיתוח](./DEVELOPMENT.md) - הוראות פיתוח
- [מדריך פריסה](./DEPLOYMENT.md) - הוראות פריסה
- [ארכיטקטורה](./ARCHITECTURE.md) - מבנה הפרויקט

