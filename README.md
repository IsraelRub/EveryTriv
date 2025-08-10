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
- ⚡ **[פיתוח ו-API](docs/DEVELOPMENT.md)** - מדריך פיתוח, API documentation וגיידליינים

### מסמכים נוספים
- 🚀 **[Deployment](docs/deployment.md)** - מדריך הטמעה לייצור
- 🤝 **[Contributing](docs/contributing.md)** - מדריך תרומה לפרויקט

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

## Database Administration

### WebDB - Modern Database Client

EveryTriv includes WebDB for easy database management and querying.

#### Option 1: Using Docker (Recommended)
```bash
# Local development
docker-compose -f docker-compose.local.yaml up -d

# Production
docker-compose up -d
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