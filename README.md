# EveryTriv

EveryTriv הוא פלטפורמת טריוויה חכמה עם רמות קושי מותאמות אישית, נבנה עם React, TypeScript ו-NestJS.

## תכונות עיקריות

- רמות קושי מותאמות עם עיבוד שפה טבעית
- יצירת שאלות טריוויה בזמן אמת באמצעות ספקי AI
- מעקב אחר התקדמות משתמשים והישגים
- לוח תוצאות ותכונות חברתיות
- ממשק משתמש רספונסיבי ומונפש
- מערכת cache רב-שכבתית

## 📚 תיעוד מרוכז

### מסמכים עיקריים
- 🏗️ **[ארכיטקטורה](docs/ARCHITECTURE.md)** - מבנה המערכת, טכנולוגיות וזרימת נתונים
- 📊 **[דיאגרמות](docs/DIAGRAMS.md)** - כל דיאגרמות Mermaid במקום אחד  
- ⚡ **[פיתוח ו-API](docs/DEVELOPMENT.md)** - מדריך פיתוח, API documentation ומערכת טיפוסים מאוחדת

### מסמכי ארכיטקטורה מפורטים
- 🔧 **[ארכיטקטורת Hooks](docs/HOOKS_ARCHITECTURE.md)** - מבנה מבוסס שכבות עם אופטימיזציות ביצועים
- 🎨 **[מערכת העיצוב](docs/DESIGN_SYSTEM.md)** - מערכת עיצוב מאוחדת עם CSS-in-JS ואייקונים
- 🖥️ **[ארכיטקטורת השרת](docs/SERVER_ARCHITECTURE.md)** - מבנה NestJS עם מודולים ותכונות

### מסמכי DevOps
- 🚀 **[Deployment](docs/deployment.md)** - מדריך הטמעה לייצור ופלטפורמות שונות
- 🐳 **[Docker Setup](docs/DOCKER_SETUP.md)** - הגדרת Docker וסביבת פיתוח
- 🗄️ **[Database Setup](docs/UNIFIED_DATABASE_SETUP.md)** - הגדרת מסד נתונים מאוחד עם חיבורים וניטור

## התחלה מהירה

1. שכפול הפרויקט:
```bash
git clone https://github.com/IsraelRub/EveryTriv.git
cd EveryTriv
```

2. התקנת dependencies:
```bash
npm install --legacy-peer-deps
```

3. הפעלת סביבת פיתוח:
```bash
npm run start:dev  # מפעיל גם client וגם server
```

4. פתיחת הדפדפן בכתובת http://localhost:5173

## 🛠️ כלי פיתוח

הפרויקט כולל כלי פיתוח מתקדמים לניהול איכות הקוד:

### עיצוב קוד
```bash
npm run format        # עיצוב כל הקבצים
npm run format:check  # בדיקה שהקוד מעוצב כראוי
```

### ניתוח קוד
```bash
npm run lint          # בדיקת שגיאות ובעיות
npm run lint:fix      # תיקון אוטומטי של בעיות
```

📖 **[מדריך מפורט לכלי הפיתוח](docs/DEVELOPMENT_TOOLS.md)**

## 📜 סקריפטים

הפרויקט כולל סקריפטים מאורגנים לניהול קל:

### 🐳 Docker
```bash
# Windows
.\scripts\docker\start-docker.bat
.\scripts\docker\stop-docker.bat

# Linux/macOS
./scripts/docker/start-docker.sh
./scripts/docker/stop-docker.sh
```

### 🚀 Deployment
```bash
# הטמעה ל-Vercel
.\scripts\deployment\deploy-vercel.bat

# הפעלת ngrok
.\scripts\deployment\start-ngrok.bat
```

### 💻 Development
```bash
# Windows
.\scripts\development\start-local.bat

# Linux/macOS
./scripts/development/start-local.sh
```

📖 **[מדריך מפורט לסקריפטים](scripts/README.md)**

## Database Administration

### WebDB - Modern Database Client

EveryTriv includes WebDB for easy database management and querying.

#### Option 1: Using Docker (Recommended)
```bash
# Production (default)
docker-compose up -d

# Development with admin tools
docker-compose --profile dev up -d
```
Then visit: http://127.0.0.1:22071

#### Option 2: Using NPM
```bash
# Install WebDB globally
npm run webdb:install

# Start WebDB (localhost only)
npm run webdb:start

# Or use the shorthand
npm run db:admin

# Start WebDB (accessible from network)
npm run webdb:start:public
```

#### Alternative Database Clients
- **pgAdmin**: Available at http://localhost:8080 (local development only)
  - Email: admin@everytriv.local
  - Password: admin123
- **Redis Commander**: Available at http://localhost:8081 (local development only)

### Database Configuration - Unified Docker Setup

The project uses a unified database configuration running entirely on Docker:

**All Environments:**
- **Host:** localhost
- **Port:** 5432
- **Database:** everytriv
- **Username:** everytriv_user
- **Password:** EvTr!v_Pr0d_P@ssw0rd_2025_S3cur3!

**Development Tools (with --profile dev):**
- **pgAdmin:** http://localhost:8080 (admin@everytriv.local / admin123)
- **Redis Commander:** http://localhost:8081
- **WebDB:** http://localhost:22071

**No AWS or external cloud services required!**

## Tech Stack

### Frontend
- React with TypeScript
- Redux Toolkit for state management
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons

### Backend
- NestJS framework
- PostgreSQL database
- Redis for caching
- TypeORM for database access
- OpenAPI/Swagger for API docs

## Contributing

Please read our [Contributing Guide](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.