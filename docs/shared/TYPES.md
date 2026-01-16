# Shared Types Layer - EveryTriv

## סקירה כללית

שכבת הטיפוסים המשותפת מספקת חוזה אחיד בין Client ו-Server, מקטינה שימוש ב-casting, ומקדמת בטיחות בזמן קומפילציה.

לקשר לדיאגרמות: `../DIAGRAMS.md#shared-types`

## מבנה תיקיית Types

```
shared/types/
├── core/                      # טיפוסים בסיסיים
│   ├── data.types.ts          # מבני נתונים בסיסיים
│   ├── error.types.ts         # טיפוסי שגיאות
│   ├── performance.types.ts   # טיפוסי ביצועים
│   ├── response.types.ts      # מבני תגובה
│   └── index.ts               # ייצוא מאוחד
├── domain/                    # ישויות לוגיות
│   ├── ai/                    # טיפוסי AI
│   ├── analytics/             # טיפוסי אנליטיקה
│   ├── game/                  # טיפוסי משחק
│   │   ├── game.types.ts      # ישויות משחק
│   │   ├── trivia.types.ts    # ישויות טריוויה
│   │   ├── achievements.types.ts # הישגים
│   │   ├── gameCache.types.ts # Cache משחק
│   │   └── index.ts
│   ├── user/                  # טיפוסי משתמש
│   │   ├── user.types.ts      # ישויות משתמש
│   │   ├── userCache.types.ts # Cache משתמש
│   │   ├── userOperations.types.ts # פעולות משתמש
│   │   └── index.ts
│   ├── validation.types.ts    # טיפוסי ולידציה
│   └── index.ts
├── infrastructure/            # חוזים טכניים
│   ├── api.types.ts           # טיפוסי API
│   ├── auth.types.ts          # טיפוסי אימות
│   ├── cache.types.ts         # טיפוסי cache
│   ├── config.types.ts        # טיפוסי קונפיגורציה
│   ├── api.types.ts           # טיפוסי API (כולל HttpMethod)
│   ├── logging.types.ts       # טיפוסי לוגים
│   ├── redis.types.ts         # טיפוסי Redis
│   ├── storage.types.ts       # טיפוסי אחסון
│   └── index.ts
├── language.types.ts          # טיפוסי שפה
├── payment.types.ts           # טיפוסי תשלום
├── points.types.ts            # טיפוסי נקודות
└── index.ts                   # ייצוא מרכזי
```

## Core Types

### data.types.ts

```typescript
/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Basic value types
 */
export type BasicValue = string | number | boolean | null | undefined;

/**
 * Generic data structure
 */
export interface BaseData {
  [key: string]: BasicValue | BasicValue[] | BaseData | BaseData[];
}
```

### error.types.ts

```typescript
/**
 * HTTP error interface
 * @description HTTP error structure for network requests
 */
export interface HttpError extends Error {
  code?: 'ECONNABORTED' | 'ENOTFOUND' | 'ECONNREFUSED' | 'ECONNRESET' | 'ETIMEDOUT' | string;
  response?: {
    status?: number;
    statusText?: string;
    data?: ErrorResponseData;
  };
  config?: {
    url?: string;
    method?: string;
    timeout?: number;
  };
}

/**
 * API error response interface
 * @description Standard error response structure
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  timestamp?: string;
  details?: BaseData;
}
```

### response.types.ts

```typescript
/**
 * Base API response interface
 * @description Generic wrapper for all API responses
 */
export interface BaseApiResponse<T = StorageValue> {
  data: T;
  success: boolean;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

/**
 * Standard API response wrapper interface
 * @description Generic wrapper for all API responses with optional metadata
 */
export interface ApiResponse<T = BaseData> extends BaseApiResponse<T> {
  metadata?: ApiMetadata;
}

/**
 * Generic API response type
 * @description Union type for API responses
 */
export type ApiResponse<T> = ApiResponse<T> | ApiError;
```

## Domain Types - Game

### game.types.ts

```typescript
import { DifficultyLevel, GameMode } from '@shared/constants';
import type { BaseEntity } from '../../core/data.types';
import type { QuestionData } from '../../infrastructure/api.types';


/**
 * Base game statistics interface
 */
export interface BaseGameStatistics {
  totalGames: number;
  totalQuestions: number;
  successRate: number;
  averageScore: number;
  bestScore: number;
  totalPlayTime: number;
}

/**
 * Base score data interface
 */
export interface BaseScoreData {
  score: number;
  averageScore: number;
  bestScore: number;
}

/**
 * Base game entity interface
 */
export interface BaseGameEntity extends BaseEntity {
  topic: string;
  difficulty: DifficultyLevel;
  gameMode: GameMode;
  userId: string;
  score: number;
}

/**
 * Game history entry interface
 */
export interface GameHistoryEntry extends BaseGameEntity {
  questionsData: QuestionData[];
  correctAnswers: number;
  totalQuestions: number;
  timeSpent?: number;
  creditsUsed?: number;
}

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry extends BaseScoreData {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  gamesPlayed: number;
  lastPlayed: Date;
  successRate: number;
  totalGames: number;
  totalQuestions: number;
  totalPlayTime: number;
}

/**
 * User rank data interface
 */
export interface UserRankData {
  userId?: string;
  rank: number;
  score: number;
  totalUsers: number;
  percentile: number;
}

/**
 * User stats data interface
 */
export interface UserStatsData {
  userId: string;
  gamesPlayed: number;
  correctAnswers: number;
  totalQuestions: number;
  averageScore: number;
  bestScore: number;
  successRate: number;
  totalPlayTime: number;
}
```

### trivia.types.ts

```typescript
import { DifficultyLevel } from '@shared/constants';
import type { BaseEntity } from '../../core/data.types';


/**
 * Trivia question interface
 */
export interface TriviaQuestion extends BaseEntity {
  question: string;
  answers: TriviaAnswer[];
  correctAnswerIndex: number;
  topic: string;
  difficulty: GameDifficulty;
  metadata?: TriviaQuestionDetailsMetadata;
  rating?: number;
  timesAnswered?: number;
  successRate?: number;
}

/**
 * Trivia question details metadata
 */
export interface TriviaQuestionDetailsMetadata {
  category?: string;
  tags?: string[];
  source?: TriviaQuestionSource;
  providerName?: string;
  difficulty?: GameDifficulty;
  difficultyScore?: number;
  customDifficultyDescription?: string;
  generatedAt?: string;
  language?: string;
  explanation?: string;
  referenceUrls?: string[];
  hints?: string[];
  usageCount?: number;
  correctAnswerCount?: number;
  aiConfidenceScore?: number;
  safeContentScore?: number;
  flaggedReasons?: string[];
  popularityScore?: number;
  averageAnswerTimeMs?: number;
  mappedDifficulty?: DifficultyLevel;
}
```

/**
 * Trivia request interface
 */
export interface TriviaRequest {
  topic: string;
  difficulty: string;
  requestedQuestions: number;
}

/**
 * Answer result interface
 */
export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: number;
  scoreEarned: number;
  explanation?: string;
}
```

## Domain Types - User

### user.types.ts

```typescript
import { DifficultyLevel, GameMode, UserRole, UserStatus } from '@shared/constants';
import type { BaseEntity } from '../../core/data.types';
import type { BaseGameStatistics } from '../game/game.types';

/**
 * Basic User interface (minimal - identity only)
 */
export interface BasicUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

/**
 * User profile interface for API responses
 */
export interface UserProfile extends BasicUser, BaseEntity {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

/**
 * User privacy preferences interface
 */
export interface UserPrivacyPreferences {
  profileVisibility?: 'public' | 'private' | 'friends';
  showOnlineStatus?: boolean;
  showActivity?: boolean;
  showAchievements?: boolean;
}

/**
 * User game preferences interface
 */
export interface UserGamePreferences {
  defaultDifficulty: DifficultyLevel;
  defaultTopic?: string;
  defaultGameMode?: GameMode;
  timeLimit?: number;
  questionLimit?: number;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  animationsEnabled: boolean;
  privacy: UserPrivacyPreferences;
  game: UserGamePreferences;
}

/**
 * User interface (complete entity)
 */
export interface User extends UserProfile {
  status: UserStatus;
  emailVerified: boolean;
  lastLogin?: Date;
  credits: number;
  purchasedCredits: number;
  totalCredits: number;
  dailyFreeQuestions: number;
  remainingFreeQuestions: number;
  achievements: Achievement[];
  stats: BaseGameStatistics;
}
```

## Infrastructure Types

### api.types.ts

```typescript
/**
 * HTTP method enumeration
 * @description Enum of all valid HTTP methods
 */
export enum HttpMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	PATCH = 'PATCH',
	DELETE = 'DELETE',
	OPTIONS = 'OPTIONS',
}

/**
 * Question data interface
 */
export interface QuestionData {
  questionId: string;
  question: string;
  options: string[];
  selectedAnswer?: number;
  correctAnswer: number;
  isCorrect?: boolean;
  timeSpent?: number;
  pointsEarned?: number;
}

/**
 * Request data type
 * @description Data type for API request bodies that supports both StorageValue and interfaces without index signatures
 */
export type RequestData = StorageValue | unknown;
```

### auth.types.ts

```typescript
/**
 * Authentication credentials
 */
export interface AuthCredentials {
  username: string;
  email: string;
  password: string;
}

/**
 * Authentication result
 */
export interface AuthenticationResult {
  access_token: string;
  refresh_token: string;
  user: BasicUser;
}

/**
 * Token payload
 */
export interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
```

### storage.types.ts

```typescript
/**
 * Storage operation result
 */
export interface StorageOperationResult<T> {
  success: boolean;
  data?: T;
  timestamp: Date;
}
```

### logging.types.ts

```typescript
/**
 * Log metadata
 */
export interface LogMeta {
  [key: string]: unknown;
}

/**
 * Logger configuration update
 */
export interface LoggerConfigUpdate {
  enableFile?: boolean;
  enablePerformanceLogging?: boolean;
  enableSecurityLogging?: boolean;
  enableUserActivityLogging?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Enhanced logger interface
 */
export interface EnhancedLogger {
  // Enhanced logging methods
  logSecurityEventEnhanced(message: string, level: LogLevel, context?: LogMeta): void;
  logAuthenticationEnhanced(action: string, userId: string, email: string, context?: LogMeta): void;
}
```

## Validation Types

### validation.types.ts

```typescript
/**
 * Base validation result
 */
export interface BaseValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Trivia input validation result
 */
export interface TriviaInputValidationResult {
  topic: BaseValidationResult;
  difficulty: BaseValidationResult;
  overall: {
    isValid: boolean;
    canProceed: boolean;
  };
}

/**
 * Language validation result
 */
export interface LanguageValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: string[];
}
```

## Points Types

### points.types.ts

```typescript
/**
 * Credit balance interface
 */
export interface CreditBalance {
  totalCredits: number;
  freeQuestions: number;
  purchasedCredits: number;
  dailyLimit: number;
  canPlayFree: boolean;
  nextResetTime: string;
}

/**
 * Point purchase option interface
 */
export interface CreditPurchaseOption {
  id: string;
  points: number;
  price: number;
  currency: string;
  bonus?: number;
}
```

## Payment Types

### payment.types.ts

```typescript
/**
 * Payment result interface
 */
export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

/**
 * Payment method types
 */
export type PaymentMethod = 'credit_card' | 'paypal' | 'stripe' | 'bank_transfer';
```

## עקרונות עיצוב

### 1. הפרדת שכבות
- Core types לא תלויים ב-domain types
- Infrastructure types מנותקים מ-domain logic
- אין תלויות מעגליות

### 2. Type Safety
- שימוש ב-type guards ל-runtime validation
- Explicit types במקום `any`
- Union types למקרים שונים

### 3. שימוש חוזר
- Base interfaces למבנים משותפים
- Extension interfaces להרחבה
- Utility types לחישובים מורכבים

### 4. תיעוד
- JSDoc comments לכל interface
- דוגמאות שימוש בעת הצורך
- הסברים על השימוש

### 5. מדיניות Null/Undefined
- שימוש עקבי ב-`null` ו-`undefined` לפי הקשר
- `Type | null` לשדות DB עם `nullable: true`
- `Type?` לשדות אופציונליים בממשקים ו-DTOs
- `Type | undefined` לשדות computed/transient
- ראה מדיניות מלאה: [`NULL_UNDEFINED_POLICY.md`](./NULL_UNDEFINED_POLICY.md)

## קישורים רלוונטיים

- מבנה Shared Package: `./SHARED_PACKAGE.md`
- Validation: `./VALIDATION.md`
- Constants: `./CONSTANTS.md`
- **מדיניות Null/Undefined:** [`NULL_UNDEFINED_POLICY.md`](./NULL_UNDEFINED_POLICY.md)
- דיאגרמות: [דיאגרמת חבילה משותפת (Shared)](../DIAGRAMS.md#דיאגרמת-חבילה-משותפת-shared)
