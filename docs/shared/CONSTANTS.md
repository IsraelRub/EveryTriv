# Shared Constants

מסמך לקבועים משותפים.

## מבנה
```
shared/constants/
  business/     # ערכים דומייניים
  │   ├── info.constants.ts
  │   ├── language.constants.ts
  │   ├── payment.constants.ts
  │   └── social.constants.ts
  core/         # ערכים טכניים
  │   ├── api.constants.ts
  │   ├── auth.constants.ts
  │   ├── error.constants.ts
  │   ├── game-server.constants.ts
  │   ├── game.constants.ts
  │   └── validation.constants.ts
  infrastructure/ # שמות Channels, Cache Keys
  │   ├── http.constants.ts
  │   ├── infrastructure.constants.ts
  │   ├── logging.constants.ts
  │   └── storage.constants.ts
  navigation/   # מסלולי UI / מזהי תפריטים
  │   └── navigation.constants.ts
  index.ts      # יצוא מרוכז
```

## דוגמאות
```typescript
// business/payment.constants.ts
export const POINTS_PRICING_TIERS = [
  { points: 100, price: 5.99 },
  { points: 500, price: 24.99 },
  { points: 1000, price: 44.99 }
] as const;

// infrastructure/storage.constants.ts
export const CACHE_TTL = {
  QUESTION: 5 * 60 * 1000, // 5 minutes
  USER_STATS: 10 * 60 * 1000, // 10 minutes
} as const;

// navigation/navigation.constants.ts
export const ROUTE_PATHS = {
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
 
