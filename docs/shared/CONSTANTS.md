# Shared Constants - EveryTriv

## סקירה כללית

שכבת הקבועים המשותפת מספקת ערכים קבועים המיושרים בין Client ו-Server, מונעת magic numbers, ומקדמת עקביות.

לקשר לדיאגרמות: `../DIAGRAMS.md#constants-architecture`

## מבנה תיקיית Constants

```
shared/constants/
├── core/                      # ערכים טכניים
│   ├── api.constants.ts       # קבועי API
│   ├── auth.constants.ts      # קבועי אימות
│   ├── error.constants.ts     # קבועי שגיאות
│   ├── game-server.constants.ts # קבועי משחק שרת
│   ├── time.constants.ts      # קבועי זמן (TTL, משכי cache, וכו')
│   ├── validation.constants.ts # קבועי ולידציה
│   └── index.ts
├── domain/                    # ערכים דומייניים
│   ├── game.constants.ts      # קבועי משחק (DifficultyLevel, GameMode, וכו')
│   ├── points.constants.ts    # קבועי נקודות
│   ├── user.constants.ts      # קבועי משתמש
│   ├── payment.constants.ts   # קבועי תשלום
│   └── index.ts
├── infrastructure/            # שמות Channels, Cache Keys
│   ├── http.constants.ts      # קבועי HTTP
│   ├── infrastructure.constants.ts # קבועי תשתית
│   ├── localhost.constants.ts # קבועי localhost
│   ├── logging.constants.ts   # קבועי לוגים
│   ├── storage.constants.ts   # קבועי אחסון
│   └── index.ts
├── business/                  # ערכים עסקיים
│   ├── info.constants.ts      # קבועי מידע
│   ├── language.constants.ts  # קבועי שפה
│   ├── social.constants.ts    # קבועי חברה
│   └── index.ts
└── index.ts                   # ייצוא מרכזי
```

## Core Constants

**הערה:** קבועי משחק נמצאים ב-`domain/game.constants.ts` ולא ב-`core/`. קבצי ה-core כוללים רק קבועי API, אימות, שגיאות, זמן וולידציה.

### api.constants.ts

```typescript
/**
 * Shared API constants for EveryTriv
 */

// Complete API endpoints structure
export const API_ENDPOINTS = {
  AUTH: {
    BASE: '/auth',
    ME: '/auth/me',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    ADMIN_USERS: '/auth/admin/users',
  },
  USER: {
    BASE: '/users',
    PROFILE: '/users/profile',
    AVATAR: '/users/avatar',
    SEARCH: '/users/search',
    ACCOUNT: '/users/account',
    CHANGE_PASSWORD: '/users/change-password',
    PREFERENCES: '/users/preferences',
    PROFILE_FIELD: '/users/profile/:field',
    PREFERENCES_FIELD: '/users/preferences/:preference',
    GET_BY_ID: '/users/:id',
    BY_ID: '/users/:id',
    BY_USER_ID: '/users/:userId',
    UPDATE_CREDITS: '/users/credits/:userId',
    CREDITS_BY_USER_ID: '/users/credits/:userId',
    UPDATE_STATUS: '/users/:userId/status',
    ADMIN: {
      ALL: '/users/admin/all',
      STATUS_BY_USER_ID: '/users/admin/:userId/status',
    },
  },
  // ... additional endpoints
} as const;

// Cookie names
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
} as const;

// API version
export const API_VERSION = 'v1';

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Rate limiting defaults
export const RATE_LIMIT_DEFAULTS = {
  WINDOW_MS: 60000,
  MAX_REQUESTS: 200,
  MAX_REQUESTS_PER_WINDOW: 200,
  BURST_LIMIT: 50,
  BURST_WINDOW_MS: 10000,
  MESSAGE: 'Too many requests, please try again later',
  BURST_MESSAGE: 'Rate limit exceeded, please slow down',
} as const;
```

### game.constants.ts

```typescript
/**
 * Shared game constants for EveryTriv
 */

/**
 * Prefix for custom difficulty levels
 */
export const CUSTOM_DIFFICULTY_PREFIX = 'custom:';

/**
 * Standard difficulty levels enumeration
 */
export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  CUSTOM = 'custom',
}

/**
 * Array of all valid difficulty levels
 */
export const VALID_DIFFICULTIES = Object.values(DifficultyLevel);

/**
 * Set of all valid difficulty levels for fast lookup
 */
export const VALID_DIFFICULTIES_SET = new Set<string>(VALID_DIFFICULTIES);

/**
 * Game mode enumeration
 */
export enum GameMode {
  QUESTION_LIMITED = 'question-limited',
  TIME_LIMITED = 'time-limited',
  UNLIMITED = 'unlimited',
}

/**
 * Array of all valid game modes
 */
export const VALID_GAME_MODES = Object.values(GameMode);

/**
 * Time Period Enum
 */
export enum TimePeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Array of all valid time periods
 */
export const VALID_TIME_PERIODS = Object.values(TimePeriod);

/**
 * Leaderboard Period Enum
 */
export enum LeaderboardPeriod {
  GLOBAL = 'global',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * Array of all valid leaderboard periods
 */
export const VALID_LEADERBOARD_PERIODS = Object.values(LeaderboardPeriod);

/**
 * Game state constants
 */
export const GAME_STATE_DEFAULTS = {
  SCORE: 0,
  STREAK: 0,
  QUESTIONS_ANSWERED: 0,
  QUESTIONS_CORRECT: 0,
  QUESTIONS_INCORRECT: 0,
  TIME_ELAPSED: 0,
  IS_GAME_ACTIVE: false,
  IS_GAME_PAUSED: false,
  IS_GAME_OVER: false,
  QUESTION_INDEX: 0,
  TOTAL_QUESTIONS: 10,
  TIME_LIMIT: 60,
  DIFFICULTY: DifficultyLevel.EASY,
  TOPIC: 'General Knowledge',
} as const;
```

### time.constants.ts

```typescript
/**
 * Time-related constants for cache TTL, storage TTL, intervals, delays, and animation durations
 */

// Time durations in seconds
export const TIME_DURATIONS_SECONDS = {
  // Very short durations (for intervals, delays, animations)
  SECOND: 1,
  TWO_SECONDS: 2,
  THREE_SECONDS: 3,
  FIVE_SECONDS: 5,
  EIGHT_SECONDS: 8,
  
  // Short durations
  THIRTY_SECONDS: 30,
  MINUTE: 60,
  TWO_MINUTES: 120,
  FIVE_MINUTES: 300,
  TEN_MINUTES: 600,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  
  // Medium durations
  HOUR: 3600,
  TWO_HOURS: 7200,
  
  // Long durations
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  YEAR: 31536000,
} as const;

// Time periods in milliseconds
export const TIME_PERIODS_MS = {
  // ... (converted from TIME_DURATIONS_SECONDS)
} as const;

## Domain Constants

### user.constants.ts

```typescript
/**
 * User-related constants
 */

/**
 * User roles enumeration
 * @enum {string} UserRole
 * @description Available user roles in the system
 */
export enum UserRole {
  ADMIN = 'admin',
  GUEST = 'guest',
  USER = 'user',
  PREMIUM = 'premium',
}

/**
 * User status enumeration
 * @enum {string} UserStatus
 * @description Available user statuses in the system
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}
```

### points.constants.ts

```typescript
/**
 * Points-related constants
 */
```

### payment.constants.ts

```typescript
/**
 * Payment-related constants
 */

/**
 * Payment method enumeration
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer',
}

/**
 * Plan type enumeration
 */
export enum PlanType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  PRO = 'pro',
}
```


## Infrastructure Constants

### http.constants.ts

```typescript
/**
 * HTTP-related constants
 */

/**
 * HTTP status codes
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * HTTP client configuration
 */
export const HTTP_CLIENT_CONFIG = {
  TIMEOUT: 10000,        // 10 seconds
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,     // 1 second
} as const;

/**
 * HTTP timeouts
 */
export const HTTP_TIMEOUTS = {
  QUESTION_GENERATION: 30000,  // 30 seconds
  DEFAULT: 10000,              // 10 seconds
} as const;
```

### storage.constants.ts

```typescript
/**
 * Storage-related constants
 */

/**
 * Storage keys (client-side)
 * @description Centralized storage key constants for client
 * @note Defined in client/src/constants/infrastructure/storage.constants.ts
 * @note Not exported from shared/constants - this is client-only
 * 
 * Storage keys are defined in the client package, not in shared constants:
 * - File: `client/src/constants/infrastructure/storage.constants.ts`
 * - Export name: `STORAGE_KEYS`
 * 
 * Available keys include:
 * - AUTH_TOKEN, REFRESH_TOKEN, AUTH_USER
 * - USER_ID, GAME_PREFERENCES
 * - GAME_STATE, GAME_HISTORY, USER_PREFERENCES
 * - CUSTOM_DIFFICULTIES, CUSTOM_DIFFICULTY_HISTORY
 * - AUDIO_SETTINGS, AUDIO_VOLUME, SCORE_HISTORY
 * - REDIRECT_AFTER_LOGIN, ERROR_LOG, ACTIVE_GAME_SESSION
 * 
 * @see client/src/constants/storage.constants.ts for the actual implementation
 */
```

## Business Constants

### info.constants.ts

```typescript
/**
 * Information-related constants
 */

/**
 * Application name constant
 */
export const APP_NAME = 'EveryTriv';

```

## עקרונות עיצוב

### 1. שמות קבועים
- שמות במבנה UPPER_SNAKE או camelCase עקבי
- פונקציות יוצרות מפתחות Cache (Key Factories) במקום שרשור חופשי
- Zero Magic Numbers בקוד מחוץ לקבועים

### 2. Type Safety
- שימוש ב-`as const` ל-type narrowing
- Enum types עבור ערכים מוגדרים
- Type guards ל-runtime validation

### 3. ארגון
- קבועים מאורגנים לפי תחום (core, domain, infrastructure, business)
- ייצוא מרכזי דרך index.ts
- תיעוד JSDoc לכל קבוע

### 4. שימוש חוזר
- קבועים משותפים ב-client ו-server
- אין כפילות בין קבועים
- עדכון במקום יחיד

## קישורים רלוונטיים

- Types: `./TYPES.md`
- Validation: `./VALIDATION.md`
- Shared Package: `./SHARED_PACKAGE.md`
- דיאגרמות: [דיאגרמת חבילה משותפת (Shared)](../DIAGRAMS.md#דיאגרמת-חבילה-משותפת-shared)
