# EveryTriv - ארכיטקטורה כללית

## סקירה כללית

EveryTriv הוא פלטפורמת טריוויה חכמה המבוססת על AI עם ארכיטקטורה מודרנית של Frontend ו-Backend נפרדים. המערכת משלבת טכנולוגיות מתקדמות ליצירת חוויית משחק מרתקת ואינטראקטיבית.

לדיאגרמות מפורטות, ראו: [דיאגרמות](./DIAGRAMS.md)

## Stack טכנולוגי

### Frontend
- **React 18** - ספריית UI מודרנית עם Hooks
- **TypeScript** - טיפוסים חזקים ובטיחות קוד
- **Redux Toolkit** - ניהול מצב גלובלי
- **Redux Persist** - שמירת מצב ב-localStorage
- **React Query** - ניהול מצב שרת
- **Tailwind CSS** - מערכת עיצוב utility-first
- **Framer Motion** - אנימציות
- **Vite** - כלי בנייה מהיר
- **React Router** - ניווט בין דפים
- **Socket.IO Client** - WebSocket client למרובה משתתפים

### Backend
- **NestJS** - מסגרת Node.js מודולרית
- **TypeScript** - טיפוסים חזקים
- **TypeORM** - ORM למסד נתונים
- **PostgreSQL** - מסד נתונים יחסי
- **Redis** - מטמון וניהול session
- **Passport.js** - אימות OAuth
- **JWT** - טוקני גישה
- **bcrypt** - הצפנת סיסמאות
- **WebSocket (Socket.IO)** - תקשורת בזמן אמת למרובה משתתפים

### AI ו-Infrastructure
- **Groq** - פרובידר AI עם תמיכה במודלים מרובים (Llama, GPT-OSS, Mixtral, Gemma)
  - מודלים חינמיים: llama-3.1-8b-instant, gpt-oss-20b (priority 1)
  - מודלים נוספים: gpt-oss-120b, llama-3.1-70b-versatile (priority 2+)
- **Docker** - containerization
- **Docker Compose** - אורכיסטרציה

## מבנה הפרויקט

```
EveryTriv/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── views/            # דפי האפליקציה
│   │   │   ├── admin/        # דף מנהל
│   │   │   ├── analytics/    # דף אנליטיקה
│   │   │   ├── game/         # דפי משחק
│   │   │   ├── gameHistory/  # היסטוריית משחקים
│   │   │   ├── home/         # דף הבית והמשחק
│   │   │   ├── leaderboard/  # לוח תוצאות
│   │   │   ├── login/        # דף התחברות
│   │   │   ├── payment/      # תשלומים
│   │   │   ├── credits/      # אשראי
│   │   │   ├── registration/ # דף רישום
│   │   │   ├── settings/     # הגדרות
│   │   │   ├── unauthorized/ # דף לא מורשה
│   │   │   └── user/         # פרופיל משתמש
│   │   ├── components/       # רכיבי UI
│   │   │   ├── animations/   # אנימציות
│   │   │   ├── game/         # רכיבי משחק
│   │   │   ├── home/         # רכיבי דף הבית
│   │   │   ├── layout/       # רכיבי פריסה
│   │   │   ├── navigation/   # רכיבי ניווט
│   │   │   ├── stats/        # רכיבי סטטיסטיקות
│   │   │   ├── user/         # רכיבי משתמש
│   │   │   └── ui/           # רכיבי UI בסיסיים
│   │   ├── hooks/            # React Hooks
│   │   ├── redux/            # ניהול מצב
│   │   │   ├── slices/       # Redux slices
│   │   │   ├── selectors.ts
│   │   │   └── store.ts
│   │   ├── services/         # שירותי API
│   │   │   └── interceptors/ # interceptors ל-API
│   │   ├── types/            # טיפוסי TypeScript
│   │   │   ├── game/         # טיפוסי משחק
│   │   │   ├── hooks/        # טיפוסי Hooks
│   │   │   ├── redux/        # טיפוסי Redux
│   │   │   ├── services/     # טיפוסי Services
│   │   │   ├── ui/           # טיפוסי UI
│   │   │   └── user/         # טיפוסי User
│   │   ├── utils/            # פונקציות עזר
│   │   │   ├── cn.utils.ts   # פונקציות class names
│   │   │   └── format.utils.ts # פונקציות עיצוב וזמן
│   │   ├── constants/        # קבועים
│   │   │   ├── game/         # קבועי משחק
│   │   │   ├── services/     # קבועי Services
│   │   │   └── ui/           # קבועי UI
│   │   ├── styles/           # עיצובים
│   │   ├── App.tsx
│   │   ├── AppRoutes.tsx
│   │   └── main.tsx
│   └── package.json
├── server/                    # NestJS Backend
│   ├── src/
│   │   ├── features/         # מודולים לפי תחום
│   │   │   ├── auth/         # אימות והרשאות
│   │   │   ├── user/         # ניהול משתמשים
│   │   │   ├── game/         # לוגיקת משחק (כולל trivia)
│   │   │   │   ├── logic/    # לוגיקת AI providers
│   │   │   │   │   ├── providers/ # ספקי AI
│   │   │   │   │   │   ├── implementations/ # מימושים
│   │   │   │   │   │   ├── management/      # ניהול ספקים
│   │   │   │   │   │   └── prompts/         # תבניות שאלות
│   │   │   │   │   └── triviaGeneration.service.ts
│   │   │   │   └── types/    # טיפוסי משחק
│   │   │   ├── credits/      # מערכת אשראי
│   │   │   ├── payment/      # תשלומים
│   │   │   ├── analytics/    # אנליטיקה
│   │   │   └── leaderboard/  # לוח תוצאות
│   │   ├── internal/         # קוד פנימי משותף
│   │   │   ├── constants/    # קבועים פנימיים
│   │   │   ├── controllers/  # controllers פנימיים
│   │   │   ├── entities/     # ישויות TypeORM
│   │   │   ├── middleware/   # middleware
│   │   │   ├── modules/      # מודולים פנימיים
│   │   │   ├── types/        # טיפוסים פנימיים
│   │   │   └── utils/        # כלים פנימיים
│   │   ├── common/           # קוד משותף גלובלי
│   │   │   ├── auth/         # שירותי אימות
│   │   │   ├── decorators/   # דקורטורים
│   │   │   ├── guards/       # שומרי נתיבים
│   │   │   ├── interceptors/ # interceptors
│   │   │   ├── pipes/        # pipes
│   │   │   └── validation/   # ולידציה
│   │   ├── config/           # קונפיגורציה
│   │   ├── migrations/       # מיגרציות מסד נתונים
│   │   ├── app.controller.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── shared/                    # קוד משותף בין client ו-server
│   ├── types/                # טיפוסי TypeScript משותפים
│   │   ├── core/             # טיפוסי ליבה
│   │   ├── domain/           # טיפוסי תחום
│   │   │   ├── analytics/    # טיפוסי אנליטיקה
│   │   │   ├── game/         # טיפוסי משחק
│   │   │   └── user/         # טיפוסי משתמש
│   │   └── infrastructure/   # טיפוסי תשתית
│   ├── constants/            # קבועים משותפים
│   │   ├── business/         # קבועי עסק
│   │   ├── core/            # קבועי ליבה
│   │   ├── domain/          # קבועי תחום
│   │   └── infrastructure/  # קבועי תשתית
│   ├── utils/                # פונקציות עזר משותפות
│   │   ├── core/            # כלים בסיסיים
│   │   ├── domain/          # כלי תחום
│   │   └── infrastructure/  # כלי תשתית
│   ├── validation/           # ולידציה משותפת
│   │   └── domain/          # ולידציה של תחום
│   ├── services/             # שירותים משותפים
│   │   ├── core/            # שירותי ליבה
│   │   ├── domain/          # שירותי תחום
│   │   └── infrastructure/  # שירותי תשתית
│   └── package.json
└── docs/                     # תיעוד
```

## ארכיטקטורת Frontend

### ניהול מצב (State Management)

#### Redux Toolkit
המערכת משתמשת ב-Redux Toolkit לניהול מצב UI מקומי וסשן משחק. ה-store כולל:
- `gameModeSlice` - מצב משחק והגדרות (persisted ב-localStorage)
- `gameSessionSlice` - מצב סשן משחק פעיל (לא persisted - session only)
- `multiplayerSlice` - מצב משחק מרובה משתתפים (לא persisted - session only)
- `audioSettingsSlice` - הגדרות אודיו (persisted ב-localStorage)
- `uiPreferencesSlice` - העדפות UI (persisted ב-sessionStorage)

**שינוי ארכיטקטוני:** כל מצב שמגיע מהשרת (server state) מנוהל על ידי React Query בלבד. Redux משמש למצב UI מקומי שצריך persist ולמצב סשן משחק.
- מצב המשחק עצמו (game session) מנוהל ב-`useState` מקומי - זה session state זמני שלא צריך להיות global
- מצב משתמש, סטטיסטיקות - מנוהלים ב-React Query
- מועדפים - לא קיימים כרגע באפליקציה

לדיאגרמת Redux מפורטת, ראו: [דיאגרמות - Redux State](./DIAGRAMS.md#דיאגרמת-redux-state)

#### React Query
React Query הוא ה-Source of Truth היחיד למצב שרת (server state) עם cache אוטומטי ו-invalidation:
- `useCurrentUser` - פרטי משתמש נוכחי (מחליף Redux userSlice)
- `useCreditBalance` - יתרת קרדיטים (מחליף Redux creditBalance)
- `useIsAuthenticated` - מצב אימות (מחליף Redux isAuthenticated)
- `useUserRole` - תפקיד משתמש (מחליף Redux userRole)
- `useTrivia` - שאלות טריוויה
- `useUserStats` - סטטיסטיקות משתמש
- `useGameHistory` - היסטוריית משחקים
- `useLeaderboard` - לוח תוצאות

לדיאגרמת React Query מפורטת, ראו: [דיאגרמות - React Query Cache](./DIAGRAMS.md#דיאגרמת-react-query-cache)

### רכיבי UI עיקריים

#### רכיבי משחק
- **Game.tsx** - הרכיב הראשי של המשחק
- **GameTimer.tsx** - טיימר המשחק
- **TriviaForm.tsx** - טופס שאלות טריוויה
- **TriviaGame.tsx** - משחק טריוויה מלא

#### רכיבי UI בסיסיים
- **Button.tsx** - כפתורים עם וריאנטים
- **Card.tsx** - כרטיסים
- **Modal.tsx** - חלונות מודאליים
- **Input.tsx** - שדות קלט
- **Select.tsx** - רשימות נפתחות
- **Avatar.tsx** - תמונות פרופיל
- **ErrorBoundary.tsx** - טיפול בשגיאות

#### רכיבי אנימציה ואודיו
- **AnimationLibrary.tsx** - ספריית אנימציות
- **AudioControls.tsx** - בקרת אודיו

#### רכיבי משתמש וסטטיסטיקות
- **ScoringSystem.tsx** - מערכת ניקוד
- **CustomDifficultyHistory.tsx** - היסטוריית קושי מותאם

### מערכת הניווט
- **AppRoutes.tsx** - הגדרת הנתיבים
- **Navigation.tsx** - תפריט ניווט
- **ProtectedRoute.tsx** - הגנה על נתיבים
- **PublicRoute.tsx** - נתיבים ציבוריים

## ארכיטקטורת Backend

### מבנה מודולרי

השרת מאורגן במודולים לפי תחום עסקי. כל מודול כולל:
- **Controller** - נקודות קצה API
- **Service** - לוגיקה עסקית
- **DTOs** - Data Transfer Objects לולידציה
- **Module** - הגדרת המודול

#### מודול Auth
מודול אימות מטפל ב:
- רישום והתחברות משתמשים
- OAuth עם Google
- הנפקת JWT tokens
- שירותי אימות משותפים

#### מודול Game
מודול משחק מטפל ב:
- יצירת שאלות טריוויה באמצעות Groq AI provider
- תמיכה במודלים מרובים דרך Groq (Llama, GPT-OSS, Mixtral, Gemma)
- בחירת מודל לפי priority (חינמי = priority 1)
- לוגיקת משחק וניקוד
- היסטוריית משחקים

#### מודול Credits
מודול אשראי מטפל ב:
- ניהול מאזן אשראי משתמש
- שמירת טרנזקציות אשראי
- עדכון מאזן אשראי משתמש

#### מודול Leaderboard
מודול לוח תוצאות מטפל ב:
- דירוג משתמשים
- חישובי מיקום לפי תקופות
- אגרגציות של סטטיסטיקות

#### מודול Analytics
מודול אנליטיקה מטפל ב:
- איסוף מטריקות שימוש
- דוחות וניתוחים
- מדידת ביצועים

#### מודול Payment
מודול תשלומים מטפל ב:
- אינטגרציה עם PayPal
- ניהול תשלומים
- webhooks

### שירותים משותפים

#### שירותי AI
- **BaseProvider** - ממשק בסיס לספקי AI
- **GroqProvider** - אינטגרציה עם Groq עם תמיכה במודלים מרובים
  - מודלים חינמיים (priority 1): llama-3.1-8b-instant, gpt-oss-20b
  - מודלים בתשלום (priority 2+): gpt-oss-120b, llama-3.1-70b-versatile, וכו'
- **Models Configuration** - הגדרת מודלים עם priority, cost, rate limits

לדיאגרמת AI Providers מפורטת, ראו: [דיאגרמות - AI Providers](./DIAGRAMS.md#דיאגרמת-ai-providers)

#### שירותי תשתית
- **LoggerService** - מערכת לוגים (מ-shared)
- **CacheService** - ניהול מטמון Redis
- **StorageService** - ניהול אחסון
- **ValidationService** - ולידציה (מ-shared)
- **AuthenticationManager** - ניהול אימות
- **JWTTokenService** - ניהול JWT tokens
- **PasswordService** - ניהול סיסמאות

#### Query Helpers

**מיקום:** `server/src/common/queries/`

Helper functions לשאילתות חוזרות עם TypeORM:

- **Date Range Queries** (`date-range.query.ts`) - Helper לשאילתות לפי טווח תאריכים
- **Search Queries** (`search.query.ts`) - Helper לשאילתות ILIKE (חיפוש טקסט)
- **Random Queries** (`random.query.ts`) - Helper לשאילתות RANDOM() (שאלות אקראיות)
- **GROUP BY Queries** (`group-by.query.ts`) - Helper לשאילתות GROUP BY

**דוגמאות שימוש:**
```typescript
// Date range query
const { addDateRangeConditions } = require('../../common/queries');
addDateRangeConditions(queryBuilder, 'game', 'createdAt', startDate, endDate);

// Search query
const { addSearchConditions } = require('../../common/queries');
addSearchConditions(queryBuilder, 'user', ['username', 'firstName', 'lastName'], searchTerm);

// Random query
const queryBuilder = repository
  .createQueryBuilder('trivia')
  .where('trivia.topic = :topic', { topic })
  .andWhere('trivia.difficulty = :difficulty', { difficulty })
  .orderBy('RANDOM()')
  .limit(limit);
```

**תיעוד מפורט:** [Database Queries](./backend/DATABASE_QUERIES.md)

### מבנה מסד הנתונים

#### טבלאות עיקריות
- **users** - משתמשים
- **trivia** - שאלות טריוויה
- **game_history** - היסטוריית משחקים
- **user_stats** - סטטיסטיקות משתמשים
- **leaderboard** - לוח תוצאות
- **payment_history** - היסטוריית תשלומים
- **credit_transactions** - עסקאות אשראי

#### אינדקסים

המערכת כוללת אינדקסים אופטימליים לשדות נפוצים:

**GameHistoryEntity:**
- `user_id` - לשאילתות לפי משתמש
- `created_at` - לשאילתות date range
- `topic` - לשאילתות GROUP BY ו-WHERE
- `difficulty` - לשאילתות GROUP BY ו-WHERE
- `(user_id, created_at)` - Composite index לשאילתות משולבות

**TriviaEntity:**
- `topic` - לשאילתות WHERE
- `difficulty` - לשאילתות WHERE
- `(topic, difficulty)` - Composite index לשאילתות משולבות

**UserStatsEntity:**
- `user_id` - UNIQUE, לשאילתות לפי משתמש
- `weekly_score`, `monthly_score`, `yearly_score` - לשאילתות leaderboard לפי תקופה

**מידע נוסף:** [Database Queries - Indexes](./backend/DATABASE_QUERIES.md#אינדקסים-במסד-הנתונים)

לדיאגרמת ERD מפורטת, ראו: [דיאגרמות - מסד נתונים](./DIAGRAMS.md#דיאגרמת-מסד-נתונים-erd)

## זרימת נתונים

### יצירת שאלה חדשה

לדיאגרמת זרימת נתונים מפורטת, ראו: [דיאגרמות - יצירת שאלה](./DIAGRAMS.md#דיאגרמת-זרימת-נתונים---יצירת-שאלה)

1. משתמש בוחר נושא וקושי
2. Frontend שולח בקשה ל-`POST /api/game/trivia`
3. Backend בודק מטמון Redis
4. אם יש במטמון - מחזיר שאלה
5. אם אין במטמון - יוצר שאלה באמצעות AI provider
6. שומר שאלה במסד נתונים
7. שומר במטמון Redis
8. מחזיר שאלה ל-Frontend

### שמירת תוצאות

לדיאגרמת זרימת נתונים מפורטת, ראו: [דיאגרמות - תשובה לשאלה](./DIAGRAMS.md#דיאגרמת-זרימת-נתונים---תשובה-לשאלה)

1. משתמש עונה על שאלה
2. Frontend שולח תשובה ל-`POST /api/game/session/answer`
3. Backend בודק נכונות תשובה
4. `calculateAnswerScore` מ-`@shared/utils` מחשב ניקוד לפי קושי וזמן
5. שומר טרנזקציית אשראי
6. מעדכן סטטיסטיקות משתמש
7. מחזיר תוצאה וניקוד ל-Frontend

## מערכת מטמון (Cache)

### סוגי מטמון
- **User Stats Cache**: סטטיסטיקות משתמש (TTL: 30 דקות)
- **Session Cache**: מידע session (TTL: 24 שעות)
- **Question Cache**: שאלות נפוצות (TTL: 60 דקות)
- **Rate Limiting**: הגבלת קצב בקשות (TTL: 15 דקות)

### אסטרטגיות מטמון
- **LRU Cache**: למטמון שאלות
- **TTL Cache**: לסטטיסטיקות
- **Distributed Cache**: למטמון session

## אבטחה

### אימות והרשאות
- **JWT Tokens**: לאימות משתמשים
- **Refresh Tokens**: לחידוש session
- **Password Hashing**: עם bcrypt
- **Role-based Access Control**: בקרת גישה מבוססת תפקידים

לדיאגרמת זרימת אימות מפורטת, ראו: [דיאגרמות - זרימת אימות](./DIAGRAMS.md#דיאגרמת-זרימת-אימות)

### הגנות נוספות
- **API Rate Limiting**: הגבלת קצב בקשות
- **Input Validation**: ולידציה של קלט
- **CORS Configuration**: הגדרת CORS
- **Global Exception Filter**: טיפול מרכזי בשגיאות

## Middleware Stack

השרת משתמש ב-middleware stack הבא (בסדר):

1. **DecoratorAwareMiddleware** - קורא metadata של decorators
2. **RateLimitMiddleware** - הגבלת קצב בקשות
3. **BulkOperationsMiddleware** - אופטימיזציה של פעולות bulk
4. **AuthGuard** - אימות משתמש
5. **RolesGuard** - בדיקת הרשאות
6. **ValidationPipe** - ולידציה של DTOs

לדיאגרמת Middleware מפורטת, ראו: [דיאגרמות - Middleware Stack](./DIAGRAMS.md#דיאגרמת-middleware-stack)

## Interceptors

השרת משתמש ב-interceptors הבאים:
- **CacheInterceptor** - מטמון תגובות לפי decorator
- **ResponseFormattingInterceptor** - עיצוב אחיד של תגובות
- **PerformanceMonitoringInterceptor** - מדידת ביצועים

## ביצועים

### אופטימיזציות Frontend
- **Code Splitting**: עם React.lazy
- **Memoization**: עם React.memo
- **Redux Persist**: שמירת מצב ב-localStorage
- **React Query Cache**: מטמון אוטומטי של תגובות API
- **Image Optimization**: אופטימיזציית תמונות

### אופטימיזציות Backend
- **Database Indexing**: אינדקסים למסד נתונים
- **Connection Pooling**: בריכת חיבורים
- **Response Caching**: מטמון תגובות
- **Query Optimization**: אופטימיזציית שאילתות

## Monitoring ו-Logging

### מערכת לוגים
- **Structured Logging**: עם מערכת לוגים מותאמת אישית
- **צבעים מותאמים**: תמיכה בצבעים לכל פורמט (קונסול, קובץ, דפדפן)
- **ניקוי אוטומטי**: הלוג מתנקה בכל הפעלה של השרת
- **זמן מקומי**: תמיכה בעברית עם timestamp מקומי
- **Log Levels**: error, warn, info, debug
- **Log Storage**: בקבצים ובמסד נתונים

## הפניות

- [דיאגרמות מפורטות](./DIAGRAMS.md)
- [מדריך פיתוח](./DEVELOPMENT.md)
- [מדריך פריסה](./DEPLOYMENT.md)
- [מבנה Backend](./backend/internal/README.md)
- [מבנה Frontend](./frontend/REDUX.md)
- [מסד נתונים](./database/DATABASE_SETUP.md)
