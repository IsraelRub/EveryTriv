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
│   ├── performance.constants.ts # קבועי ביצועים
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

**הערה:** קבועי משחק נמצאים ב-`domain/game.constants.ts` ולא ב-`core/`. קבצי ה-core כוללים רק קבועי API, אימות, שגיאות, ביצועים וולידציה.

### api.constants.ts

```typescript
/**
 * Shared API constants for EveryTriv
 */

// Base API endpoints structure
export const API_ENDPOINTS_BASE = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    PROFILE: '/auth/profile',
  },
  USER: {
    PROFILE: '/user/profile',
    CREDITS: '/user/credits',
    STATS: '/user/stats',
    UPDATE_FIELD: (field: string) => `/users/profile/${field}`,
    UPDATE_PREFERENCE: (preference: string) => `/users/preferences/${preference}`,
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE_CREDITS: (userId: string) => `/users/credits/${userId}`,
    UPDATE_STATUS: (userId: string) => `/users/${userId}/status`,
  },
  TRIVIA: {
    GENERATE: '/trivia/generate',
    VALIDATE: '/trivia/validate',
    HISTORY: '/trivia/history',
  },
  GAME_HISTORY: {
    CREATE: '/game-history',
    GET_ALL: '/game-history',
    LEADERBOARD: '/game-history/leaderboard',
    DELETE: (id: string) => `/game-history/${id}`,
    CLEAR: '/game-history',
  },
  SUBSCRIPTION: {
    PLANS: '/subscription/plans',
    CURRENT: '/subscription/current',
    CREATE: '/subscription/create',
    CANCEL: '/subscription/cancel',
  },
  PAYMENT: {
    HISTORY: '/payment/history',
    CREATE: '/payment/create',
  },
  POINTS: {
    GET: '/credits',
    BALANCE: '/credits/balance',
    HISTORY: '/credits/history',
  },
} as const;

// Complete API endpoints
export const API_ENDPOINTS = {
  ...API_ENDPOINTS_BASE,
  AUTH: {
    ...API_ENDPOINTS_BASE.AUTH,
    ME: '/auth/me',
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
  CLIENT_LOGS_MAX_REQUESTS: 50,
  CLIENT_LOGS_BURST_LIMIT: 10,
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
 * Scoring multipliers for different difficulty levels
 */
export const DIFFICULTY_MULTIPLIERS = {
  [DifficultyLevel.EASY]: 1,
  [DifficultyLevel.MEDIUM]: 1.5,
  [DifficultyLevel.HARD]: 2,
  CUSTOM_DEFAULT: 1.3,
  BONUS_MULTIPLIER: 1.2,
  STREAK_MULTIPLIER: 1.1,
  PERFECT_SCORE_MULTIPLIER: 1.5,
} as const;

/**
 * Custom difficulty multipliers based on detected keywords
 */
export const CUSTOM_DIFFICULTY_MULTIPLIERS = {
  [DifficultyLevel.EASY]: 1.0,
  [DifficultyLevel.MEDIUM]: 1.5,
  [DifficultyLevel.HARD]: 2.0,
  [DifficultyLevel.CUSTOM]: 1.3,
} as const;

/**
 * Valid requested questions options per game
 */
export const VALID_REQUESTED_QUESTIONS = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50] as const;

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
 * Credit operation types enumeration
 */
export enum CreditOperation {
  ADD = 'add',
  DEDUCT = 'deduct',
  SET = 'set',
}

/**
 * Array of all valid credit operations
 */
export const VALID_CREDIT_OPERATIONS = Object.values(CreditOperation);

/**
 * Sort Order Enum
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Array of all valid sort orders
 */
export const VALID_SORT_ORDERS = Object.values(SortOrder);

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
  TOPIC = 'topic',
}

/**
 * Array of all valid leaderboard periods
 */
export const VALID_LEADERBOARD_PERIODS = Object.values(LeaderboardPeriod);

/**
 * Event Result Enum
 */
export enum EventResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  ERROR = 'error',
}

/**
 * Array of all valid event results
 */
export const VALID_EVENT_RESULTS = Object.values(EventResult);

// Custom difficulty keywords for detection
export const CUSTOM_DIFFICULTY_KEYWORDS = {
  LEVELS: ['beginner', 'elementary', 'basic', 'intermediate', 'advanced', 'expert', 'master', 'professional'],
  DIFFICULTY_WORDS: ['easy', 'medium', 'hard', 'difficult', 'challenging', 'simple', 'complex', 'basic', 'advanced'],
  TOPIC_SPECIFIC: [
    'history',
    'science',
    'math',
    'geography',
    'literature',
    'art',
    'music',
    'sports',
    'technology',
    'politics',
  ],
} as const;

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

### performance.constants.ts

```typescript
/**
 * Performance-related constants
 */

/**
 * Cache duration constants (in seconds)
 */
export const CACHE_DURATION = {
  VERY_SHORT: 30,   // 30 seconds
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 600,        // 10 minutes
  VERY_LONG: 3600,  // 1 hour
} as const;

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 300,         // 5 minutes
  MEDIUM: 1800,       // 30 minutes
  LONG: 3600,         // 1 hour
  TRIVIA_QUESTIONS: 3600, // 1 hour
  USER_PROFILE: 1800,     // 30 minutes
  LEADERBOARD: 300,       // 5 minutes
} as const;
```

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

/**
 * Point transaction types
 */
export enum PointTransactionType {
  EARNED = 'earned',
  SPENT = 'spent',
  PURCHASED = 'purchased',
  BONUS = 'bonus',
}

/**
 * Point sources
 */
export enum PointSource {
  GAME = 'game',
  PURCHASE = 'purchase',
  BONUS = 'bonus',
  REFUND = 'refund',
}
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

/**
 * Subscription status enumeration
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

/**
 * Billing cycle enumeration
 */
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
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
 * @note Defined in client/src/constants/storage.constants.ts and exported as CLIENT_STORAGE_KEYS from client/src/constants/index.ts
 * @note Not exported from shared/constants - this is client-only
 * 
 * Storage keys are defined in the client package, not in shared constants:
 * - File: `client/src/constants/storage.constants.ts`
 * - Export name: `STORAGE_KEYS`
 * - Re-exported as: `CLIENT_STORAGE_KEYS` from `client/src/constants/index.ts`
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

/**
 * Application description constant
 */
export const APP_DESCRIPTION = 'Smart Trivia Platform with Custom Difficulty Levels';

/**
 * Contact information and branding constants
 */
export const CONTACT_INFO = {
  email: 'support@everytrivia.com',
  website: 'everytrivia.com',
  description: 'Smart Trivia Platform',
  tagline: 'Challenge your knowledge with our AI-powered trivia platform',
  features: ['Custom difficulty levels', 'Unlimited topics', 'Competitive gameplay', 'AI-powered questions'],
  metadata: {
    version: '2.0.0',
    releaseDate: '2024-01-01',
    apiVersion: 'v1',
    maintenanceWindow: 'Sundays 2-4 AM UTC',
  },
} as const;
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
