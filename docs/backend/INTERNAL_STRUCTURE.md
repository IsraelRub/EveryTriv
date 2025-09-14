# Backend Internal Structure Documentation

תיעוד המבנה הפנימי של השרת (NestJS).

## סקירה כללית

המבנה הפנימי של השרת מאורגן בתיקיית `internal/` ומכיל קוד משותף בין המודולים השונים.

## מבנה Internal

```
server/src/internal/
├── constants/       # קבועים פנימיים
├── controllers/     # controllers פנימיים
├── entities/        # ישויות TypeORM
├── middleware/      # middleware
├── modules/         # מודולים פנימיים
├── repositories/    # repositories
├── services/        # שירותים פנימיים
├── types/           # טיפוסים פנימיים
└── utils/           # כלים פנימיים
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
  - `auth.middleware.ts` - אימות
  - `bulkOperations.middleware.ts` - פעולות bulk
  - `country-check.middleware.ts` - בדיקת מדינה
  - `decorator-aware.middleware.ts` - מודע לדקורטורים
  - `rateLimit.middleware.ts` - הגבלת קצב

### Modules
- **תיאור**: מודולים פנימיים
- **קבצים**:
  - `redis.module.ts` - מודול Redis
  - `cache/` - מודול מטמון
  - `storage/` - מודול אחסון

### Repositories
- **תיאור**: repositories משותפים
- **קבצים**:
  - `base.repository.ts` - repository בסיסי
  - `user.repository.ts` - repository משתמשים
  - `trivia.repository.ts` - repository טריוויה
  - `game-history.repository.ts` - repository היסטוריית משחקים

### Services
- **תיאור**: שירותים פנימיים משותפים

### Types
- **תיאור**: טיפוסים פנימיים
- **קבצים**:
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
