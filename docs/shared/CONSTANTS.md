# Shared Constants

מסמך לקבועים משותפים.

## מבנה
```
shared/constants/
  core/         # ערכים טכניים (זמנים, פורמטים)
  business/     # ערכים דומייניים (Scoring, Limits)
  infrastructure/ # שמות Channels, Cache Keys
  navigation/   # מסלולי UI / מזהי תפריטים
  index.ts      # יצוא מרוכז
```

## דוגמאות
```typescript
// business/scoring.constants.ts
export const BASE_POINTS = { easy: 10, medium: 20, hard: 30 } as const;

// core/time.constants.ts
export const ONE_MINUTE_MS = 60_000;

// infrastructure/cache.constants.ts
export const CACHE_KEYS = {
  QUESTION: (id: string) => `q:${id}`,
  USER_STATS: (id: string) => `us:${id}`,
} as const;

// navigation/routes.constants.ts
export const ROUTES = {
  HOME: '/',
  GAME: '/game',
  LEADERBOARD: '/leaderboard',
} as const;
```

## עקרונות
- שמות במבנה UPPER_SNAKE או camelCase עקבי
- פונקציות יוצרות מפתחות Cache (Key Factories) במקום שרשור חופשי
- Zero Magic Numbers בקוד מחוץ לקבועים

---
 
