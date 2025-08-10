# EveryTriv - ארכיטקטורה

## מבנה המערכת הכללי

EveryTriv הוא אפליקציית trivia מבוססת AI עם ארכיטקטורה של Frontend ו-Backend נפרדים:

### Stack טכנולוגי
- **Frontend**: React 18 + TypeScript + Redux Toolkit + Tailwind CSS
- **Backend**: NestJS + TypeScript + PostgreSQL + Redis  
- **AI**: OpenAI, Anthropic, Google AI
- **Infrastructure**: Docker, Docker Compose

### תקשורת בין רכיבים
```
Client (React) ←→ REST API ←→ Server (NestJS) ←→ Database (PostgreSQL)
                                    ↓
                               Cache (Redis)
                                    ↓
                              AI Providers
```

## מבנה הפרויקט

```
EveryTriv/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── views/            # דפי האפליקציה
│   │   │   ├── home/         # דף הבית והמשחק
│   │   │   ├── user/         # פרופיל משתמש
│   │   │   ├── leaderboard/  # לוח תוצאות
│   │   │   └── game-history/ # היסטוריית משחקים
│   │   ├── shared/           # קוד משותף
│   │   │   ├── components/   # רכיבי UI
│   │   │   ├── hooks/        # React hooks
│   │   │   ├── services/     # API clients
│   │   │   ├── types/        # טיפוסי TypeScript
│   │   │   ├── utils/        # פונקציות עזר
│   │   │   └── constants/    # קבועים
│   │   └── redux/            # ניהול state
│   └── package.json
├── server/                    # NestJS Backend
│   ├── src/
│   │   ├── features/         # מודולים לפי תחום
│   │   │   ├── trivia/       # לוגיקת הטריוויה
│   │   │   ├── user/         # ניהול משתמשים
│   │   │   ├── auth/         # אימות
│   │   │   └── game-history/ # היסטוריית משחקים
│   │   ├── shared/           # קוד משותף
│   │   │   ├── services/     # שירותים כלליים
│   │   │   ├── middleware/   # middleware
│   │   │   ├── types/        # טיפוסים
│   │   │   └── utils/        # פונקציות עזר
│   │   ├── config/           # קונפיגורציה
│   │   └── main.ts
│   └── package.json
├── shared/                    # קוד משותף בין client ו-server
│   ├── types/                # טיפוסי TypeScript משותפים
│   ├── constants/            # קבועים משותפים
│   └── utils/                # פונקציות עזר משותפות
└── docs/                     # תיעוד
```

## ארכיטקטורה של Frontend

### ניהול State
- **Redux Toolkit**: state גלובלי של האפליקציה
- **React Hooks**: state מקומי של רכיבים
- **React Query**: ניהול data מה-server

### מבנה Redux
```typescript
// Store Structure
{
  game: {
    trivia: TriviaQuestion | null,
    score: number,
    gameMode: GameMode,
    timer: TimerState
  },
  user: {
    profile: UserProfile | null,
    isAuthenticated: boolean
  },
  stats: {
    topicsPlayed: Record<string, number>,
    successRateByDifficulty: DifficultyStats
  },
  favorites: {
    topics: FavoriteTopic[]
  }
}
```

### רכיבי UI עיקריים
- **TriviaForm**: טופס לבחירת נושא וקושי
- **TriviaGame**: המשחק עצמו - שאלה ותשובות
- **ScoringSystem**: מערכת ניקוד
- **Leaderboard**: לוח תוצאות
- **GameMode**: בחירת סוג משחק
- **CustomDifficulty**: הגדרת קושי מותאם

## ארכיטקטורה של Backend

### מבנה מודולרי
כל feature ב-NestJS מאורגן כמודול עצמאי:

```typescript
// Feature Module Structure
feature/
├── controllers/      # API endpoints
├── services/        # לוגיקה עסקית
├── entities/        # מודלים של בסיס נתונים
├── dtos/           # Data Transfer Objects
└── feature.module.ts
```

### שירותים משותפים
- **AIService**: אינטגרציה עם ספקי AI
- **CacheService**: ניהול cache עם Redis
- **LoggerService**: מערכת לוגים
- **ValidationService**: ולידציה של נתונים

### מבנה בסיס הנתונים
טבלאות עיקריות:
- **users**: פרטי משתמשים
- **trivia_questions**: שאלות שנוצרו
- **game_history**: היסטוריית משחקים
- **user_stats**: סטטיסטיקות משתמשים
- **achievements**: הישגים

## זרימת נתונים

### יצירת שאלה חדשה
1. משתמש בוחר נושא וקושי בטופס
2. Frontend שולח בקשה ל-Backend
3. Backend בודק ב-Redis אם יש שאלה במטמון
4. אם אין - Backend שולח בקשה לספק AI
5. השאלה נשמרת במטמון ובבסיס הנתונים
6. השאלה מוחזרת ל-Frontend

### שמירת תוצאות
1. משתמש עונה על שאלה
2. Frontend שולח את התשובה ל-Backend
3. Backend שומר את התוצאה בבסיס הנתונים
4. Backend מעדכן סטטיסטיקות משתמש
5. תוצאה מוחזרת ל-Frontend

## מערכת מטמון (Cache)

### Redis Cache Strategy
- **Question Cache**: שאלות לפי נושא וקושי (TTL: 1 שעה)
- **User Stats Cache**: סטטיסטיקות משתמש (TTL: 30 דקות)
- **Session Cache**: מידע session (TTL: 24 שעות)
- **Rate Limiting**: הגבלת קצב בקשות (TTL: 15 דקות)

## אבטחה

### אימות
- JWT tokens למשתמשים מאומתים
- Refresh tokens לחידוש session
- Password hashing עם bcrypt

### הרשאות
- Role-based access control
- API rate limiting
- Input validation ו-sanitization

## ביצועים

### אופטימיזציות Frontend
- Code splitting עם React.lazy
- Memoization עם React.memo
- Virtual scrolling לרשימות ארוכות
- Image optimization

### אופטימיזציות Backend
- Database indexing
- Connection pooling
- Response caching
- Query optimization

## Monitoring ו-Logging

### מערכת לוגים
- Structured logging עם Winston
- לוגים ברמות שונות (error, warn, info, debug)
- לוגים נשמרים בקבצים ובבסיס נתונים

### Metrics
- Response times
- Database query performance  
- Cache hit rates
- Error rates

## סביבות פיתוח

### Development
```bash
npm run start:dev  # מפעיל client ו-server במקביל
```

### Production
```bash
npm run build     # בונה production builds
npm run start:prod # מפעיל בסביבת production
```

### Docker
```bash
docker-compose up  # מפעיל עם Docker
```

## טכנולוגיות חיצוניות

### AI Providers
- **OpenAI**: GPT-4 לייצור שאלות איכותיות
- **Anthropic**: Claude לשאלות מורכבות
- **Google AI**: Gemini לגיוון

### External Libraries
- **@datastructures-js/priority-queue**: תורי עדיפויות
- **lru-cache**: מטמון LRU
- **Chart.js**: גרפים וויזואליזציות
- **Framer Motion**: אנימציות

## העתיד והרחבות

### תכונות מתוכננות
- Multiplayer mode
- Custom question creation
- Voice questions
- Mobile app

### שיפורים טכניים מתוכננים
- GraphQL API
- Microservices architecture
- Real-time notifications
- Advanced analytics
