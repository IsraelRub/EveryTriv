# Backend Internal Structure Documentation

תיעוד המבנה הפנימי של השרת (NestJS).

## סקירה כללית

המבנה הפנימי של השרת מאורגן בתיקיית `internal/` ומכיל קוד משותף בין המודולים השונים.

## מבנה Internal

```
server/src/internal/
├── constants/       # קבועים פנימיים
│   ├── app/         # קבועי אפליקציה
│   ├── auth/        # קבועי אימות
│   ├── database/    # קבועי מסד נתונים
│   ├── game/        # קבועי משחק
│   └── points/      # קבועי נקודות
├── controllers/     # controllers פנימיים
│   ├── client-logs.controller.ts
│   └── middleware-metrics.controller.ts
├── entities/        # ישויות TypeORM
│   ├── gameHistory.entity.ts
│   ├── leaderboard.entity.ts
│   ├── paymentHistory.entity.ts
│   ├── pointTransaction.entity.ts
│   ├── subscription.entity.ts
│   ├── trivia.entity.ts
│   ├── user.entity.ts
│   └── userStats.entity.ts
├── middleware/      # middleware
│   ├── auth.middleware.ts
│   ├── bulkOperations.middleware.ts
│   ├── country-check.middleware.ts
│   ├── decorator-aware.middleware.ts
│   └── rateLimit.middleware.ts
├── modules/         # מודולים פנימיים
│   ├── cache/       # מודול מטמון
│   ├── redis.module.ts
│   └── storage/     # מודול אחסון
├── repositories/    # repositories
│   ├── base.repository.ts
│   ├── game-history.repository.ts
│   ├── trivia.repository.ts
│   └── user.repository.ts
├── types/           # טיפוסים פנימיים
│   ├── exports/
│   ├── metadata.types.ts
│   ├── nest.types.ts
│   ├── payment.types.ts
│   ├── trivia.types.ts
│   ├── typeorm-compatibility.types.ts
│   └── user.types.ts
└── utils/           # כלים פנימיים
    ├── interceptors.utils.ts
    └── retry.utils.ts
```

## תיקיות עיקריות

### Constants
- **תיאור**: קבועים פנימיים של השרת
- **קבצים**:
  - `app/` - קבועי אפליקציה
  - `auth/` - קבועי אימות
  - `database/` - קבועי מסד נתונים
  - `game/` - קבועי משחק
  - `points/` - קבועי נקודות
  - `public-endpoints.constants.ts` - רשימת נתיבים ציבוריים שלא דורשים אימות

### Controllers
- **תיאור**: controllers פנימיים
- **קבצים**:
  - `client-logs.controller.ts` - לוגים מהקליינט
  - `middleware-metrics.controller.ts` - מדדי middleware

### Entities
- **תיאור**: ישויות TypeORM
- **קבצים**:
  - `user.entity.ts` - ישות משתמש
  - `trivia.entity.ts` - ישות טריוויה
  - `gameHistory.entity.ts` - היסטוריית משחקים
  - `leaderboard.entity.ts` - לוח תוצאות
  - `paymentHistory.entity.ts` - היסטוריית תשלומים
  - `pointTransaction.entity.ts` - עסקאות נקודות
  - `subscription.entity.ts` - מנויים
  - `userStats.entity.ts` - סטטיסטיקות משתמש

### Middleware
- **תיאור**: middleware משותף
- **קבצים**:
  - `bulkOperations.middleware.ts` - פעולות bulk
  - `country-check.middleware.ts` - בדיקת מדינה
  - `decorator-aware.middleware.ts` - מודע לדקורטורים, מחלץ metadata מ-decorators
  - `rateLimit.middleware.ts` - הגבלת קצב בקשות

**הערה**: `auth.middleware.ts` הוסר - האימות מתבצע ב-`AuthGuard` בלבד למניעת כפילות.

### Modules
- **תיאור**: מודולים פנימיים
- **קבצים**:
  - `redis.module.ts` - מודול Redis
  - `cache/` - מודול מטמון עם controller ו-service
  - `storage/` - מודול אחסון עם controller ו-service

### Repositories
- **תיאור**: repositories משותפים
- **קבצים**:
  - `base.repository.ts` - repository בסיסי
  - `user.repository.ts` - repository משתמשים
  - `trivia.repository.ts` - repository טריוויה
  - `game-history.repository.ts` - repository היסטוריית משחקים

### Types
- **תיאור**: טיפוסים פנימיים
- **קבצים**:
  - `exports/config.types.ts` - טיפוסי קונפיגורציה
  - `metadata.types.ts` - טיפוסי metadata
  - `nest.types.ts` - טיפוסי NestJS
  - `payment.types.ts` - טיפוסי תשלום
  - `trivia.types.ts` - טיפוסי טריוויה
  - `typeorm-compatibility.types.ts` - תאימות TypeORM
  - `user.types.ts` - טיפוסי משתמש

### Utils
- **תיאור**: כלים פנימיים
- **קבצים**:
  - `interceptors.utils.ts` - כלי interceptors
  - `retry.utils.ts` - כלי retry
  - `guards.utils.ts` - פונקציות עזר ל-Guards, כולל `isPublicEndpoint()` לבדיקת נתיבים ציבוריים

## עקרונות עיצוב

### הפרדת אחריות
- כל תיקייה מטפלת בהיבט ספציפי
- אין תלויות מעגליות
- שימוש ב-Dependency Injection

### שימוש חוזר
- קוד משותף מועבר ל-internal
- מודולים פנימיים ניתנים לשימוש חוזר
- טיפוסים משותפים

### ביצועים
- מטמון Redis לנתונים נפוצים
- Middleware אופטימלי
- Repositories יעילים

## קישורים רלוונטיים

- [רשימת מודולים](./FEATURES.md)
- [Repository Integration](./REPOSITORY_INTEGRATION.md)
- [API Reference](./API_REFERENCE.md)
