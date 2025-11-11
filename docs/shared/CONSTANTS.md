# Shared Constants

מסמך לקבועים משותפים.

## מבנה
```
shared/constants/
  business/     # ערכים דומייניים
  │   ├── info.constants.ts
  │   ├── language.constants.ts
  │   └── social.constants.ts
  core/         # ערכים טכניים
  │   ├── api.constants.ts
  │   ├── auth.constants.ts
  │   ├── error.constants.ts
  │   ├── game-server.constants.ts
  │   ├── game.constants.ts
  │   ├── performance.constants.ts
  │   └── validation.constants.ts
  infrastructure/ # שמות Channels, Cache Keys
  │   ├── http.constants.ts
  │   ├── infrastructure.constants.ts
  │   ├── localhost.constants.ts
  │   ├── logging.constants.ts
  │   └── storage.constants.ts
  index.ts      # יצוא מרוכז
```

## דוגמאות
```typescript
// core/game.constants.ts
export const DIFFICULTY_MULTIPLIERS = {
  easy: 1,
  medium: 1.5,
  hard: 2,
  CUSTOM_DEFAULT: 1.3,
  BONUS_MULTIPLIER: 1.2,
} as const;

// infrastructure/storage.constants.ts
export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  TRIVIA_QUESTIONS: 3600, // 1 hour
  USER_PROFILE: 1800, // 30 minutes
  LEADERBOARD: 300, // 5 minutes
} as const;

// client/src/constants/ui/navigation.constants.ts
export const ROUTE_PATHS = {
  HOME: '/',
  GAME: '/game',
  LEADERBOARD: '/leaderboard',
  PAYMENT: '/payment',
  HISTORY: '/history',
  PROFILE: '/profile',
} as const;

// core/performance.constants.ts
export const CACHE_DURATION = {
  VERY_SHORT: 30, // 30 seconds
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 600, // 10 minutes
  VERY_LONG: 3600, // 1 hour
} as const;
```

## עקרונות
- שמות במבנה UPPER_SNAKE או camelCase עקבי
- פונקציות יוצרות מפתחות Cache (Key Factories) במקום שרשור חופשי
- Zero Magic Numbers בקוד מחוץ לקבועים

---
 
