# Shared Package Documentation

תיעוד חבילת Shared המשותפת בין Client ו-Server.

## סקירה כללית

חבילת Shared מכילה קוד משותף בין Frontend ו-Backend, כולל טיפוסים, קבועים, ולידציה, שירותים ופונקציות עזר.

## מבנה החבילה

```
shared/
├── types/                # טיפוסי TypeScript משותפים
│   ├── core/            # טיפוסי ליבה
│   ├── domain/          # טיפוסי דומיין
│   ├── infrastructure/  # טיפוסי תשתית
│   ├── ui.types.ts      # טיפוסי UI
│   ├── payment.types.ts # טיפוסי תשלום
│   ├── points.types.ts  # טיפוסי נקודות
│   ├── subscription.types.ts # טיפוסי מנוי
│   └── language.types.ts # טיפוסי שפה
├── constants/           # קבועים משותפים
│   ├── business/        # קבועי עסק
│   ├── core/           # קבועי ליבה
│   ├── infrastructure/ # קבועי תשתית
│   └── navigation/     # קבועי ניווט
├── validation/         # ולידציה משותפת
│   ├── schemas.ts      # סכמות ולידציה
│   ├── validation.utils.ts # פונקציות עזר
│   ├── difficulty.validation.ts # ולידציית קושי
│   ├── payment.validation.ts # ולידציית תשלום
│   ├── points.validation.ts # ולידציית נקודות
│   └── trivia.validation.ts # ולידציית טריוויה
├── services/           # שירותים משותפים
│   ├── logging/        # שירותי לוגים
│   ├── points/         # שירותי נקודות
│   └── storage/        # שירותי אחסון
├── utils/              # פונקציות עזר
│   ├── data.utils.ts   # פונקציות נתונים
│   ├── date.utils.ts   # פונקציות תאריך
│   ├── format.utils.ts # פונקציות פורמט
│   ├── id.utils.ts     # פונקציות ID
│   ├── payment.utils.ts # פונקציות תשלום
│   ├── preferences.utils.ts # פונקציות העדפות
│   ├── sanitization.utils.ts # פונקציות ניקוי
│   ├── storage.utils.ts # פונקציות אחסון
│   └── time.utils.ts   # פונקציות זמן
└── package.json        # הגדרות החבילה
```

## Types (טיפוסים)

### Core Types

#### Base Types
```typescript
// shared/types/core/base.types.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Error Types
```typescript
// shared/types/core/error.types.ts
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
```

### Domain Types

#### Game Types
```typescript
// shared/types/domain/game.types.ts
export interface Game {
  id: string;
  userId: string;
  difficulty: Difficulty;
  topics: string[];
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  status: GameStatus;
  startedAt: Date;
  completedAt?: Date;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: Difficulty;
  topic: string;
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum GameStatus {
  CREATED = 'created',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}
```

#### User Types
```typescript
// shared/types/domain/user.types.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  points: number;
  credits: number;
  subscription: Subscription;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  language: string;
  difficulty: Difficulty;
  topics: string[];
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  gameReminders: boolean;
}
```

### Infrastructure Types

#### API Types
```typescript
// shared/types/infrastructure/api.types.ts
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}
```

#### Storage Types
```typescript
// shared/types/infrastructure/storage.types.ts
export interface StorageConfig {
  type: 'local' | 'session' | 'indexeddb';
  key: string;
  ttl?: number;
}

export interface StorageItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}
```

## Constants (קבועים)

### Business Constants
```typescript
// shared/constants/business/game.constants.ts
export const GAME_CONSTANTS = {
  MAX_QUESTIONS: 50,
  MIN_QUESTIONS: 5,
  DEFAULT_QUESTIONS: 10,
  TIME_LIMIT: {
    EASY: 30,
    MEDIUM: 20,
    HARD: 15
  }
} as const;

// shared/constants/business/points.constants.ts
export const POINTS_CONSTANTS = {
  BASE_POINTS: 10,
  MULTIPLIERS: {
    EASY: 1,
    MEDIUM: 1.5,
    HARD: 2
  },
  STREAK_BONUS: 5
} as const;
```

### Core Constants
```typescript
// shared/constants/core/api.constants.ts
export const API_CONSTANTS = {
  ENDPOINTS: {
    AUTH: '/auth',
    USER: '/user',
    GAME: '/game',
    POINTS: '/points',
    ANALYTICS: '/analytics',
    LEADERBOARD: '/leaderboard',
    PAYMENT: '/payment',
    SUBSCRIPTION: '/subscription'
  },
  TIMEOUTS: {
    DEFAULT: 30000,
    UPLOAD: 60000
  }
} as const;
```

## Validation (ולידציה)

### Schemas
```typescript
// shared/validation/schemas.ts
import { z } from 'zod';

export const CreateGameSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  topics: z.array(z.string()).min(1).max(10),
  questionCount: z.number().min(5).max(50)
});

export const AnswerSchema = z.object({
  gameId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.number().min(0).max(3),
  timeSpent: z.number().min(0)
});
```

### Validation Utils
```typescript
// shared/validation/validation.utils.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}
```

## Services (שירותים)

### Logging Service
```typescript
// shared/services/logging/logger.service.ts
export interface LoggerService {
  log(level: LogLevel, message: string, context?: any): void;
  error(message: string, error?: Error, context?: any): void;
  warn(message: string, context?: any): void;
  info(message: string, context?: any): void;
  debug(message: string, context?: any): void;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}
```

### Points Service
```typescript
// shared/services/points/points.service.ts
export interface PointsService {
  calculatePoints(
    difficulty: Difficulty,
    timeSpent: number,
    isCorrect: boolean,
    streak: number
  ): number;
  
  formatPoints(points: number): string;
  validatePointsTransaction(amount: number): boolean;
}
```

### Storage Service
```typescript
// shared/services/storage/storage.service.ts
export interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

## Utils (פונקציות עזר)

### Data Utils
```typescript
// shared/utils/data.utils.ts
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}
```

### Date Utils
```typescript
// shared/utils/date.utils.ts
export function formatDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleDateString('he-IL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'iso':
      return date.toISOString();
  }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

### Format Utils
```typescript
// shared/utils/format.utils.ts
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('he-IL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(amount: number, currency: string = 'ILS'): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency
  }).format(amount);
}
```

## שימוש בחבילה

### התקנה
```bash
# ב-Client
npm install @everytriv/shared

# ב-Server
npm install @everytriv/shared
```

### Import
```typescript
// Import types
import { Game, Difficulty, ApiResponse } from '@everytriv/shared';

// Import constants
import { GAME_CONSTANTS, API_CONSTANTS } from '@everytriv/shared';

// Import validation
import { CreateGameSchema } from '@everytriv/shared';

// Import services
import { LoggerService, PointsService } from '@everytriv/shared';

// Import utils
import { formatDate, formatNumber } from '@everytriv/shared';
```

### דוגמת שימוש
```typescript
import { 
  Game, 
  Difficulty, 
  CreateGameSchema,
  GAME_CONSTANTS,
  formatDate 
} from '@everytriv/shared';

// יצירת משחק
const gameData = {
  difficulty: Difficulty.MEDIUM,
  topics: ['science', 'history'],
  questionCount: 10
};

// ולידציה
const validatedData = CreateGameSchema.parse(gameData);

// שימוש בקבועים
const maxQuestions = GAME_CONSTANTS.MAX_QUESTIONS;

// פורמט תאריך
const formattedDate = formatDate(new Date(), 'long');
```

## Testing

### Unit Tests
```typescript
// shared/__tests__/utils/format.utils.test.ts
import { formatNumber, formatCurrency } from '../format.utils';

describe('formatNumber', () => {
  it('should format number with default decimals', () => {
    expect(formatNumber(1234.56)).toBe('1,235');
  });

  it('should format number with custom decimals', () => {
    expect(formatNumber(1234.56, 2)).toBe('1,234.56');
  });
});
```

### Integration Tests
```typescript
// shared/__tests__/services/points.service.test.ts
import { PointsService } from '../services/points/points.service';

describe('PointsService', () => {
  let pointsService: PointsService;

  beforeEach(() => {
    pointsService = new PointsService();
  });

  it('should calculate points correctly', () => {
    const points = pointsService.calculatePoints(
      Difficulty.MEDIUM,
      15,
      true,
      3
    );
    expect(points).toBe(22.5); // 10 * 1.5 * 1.5
  });
});
```

## Best Practices

### 1. Type Safety
- השתמש בטיפוסים מפורשים
- הימנע מ-`any`
- השתמש ב-generics כשצריך

### 2. Constants
- השתמש ב-`as const` לקבועים
- ארגן קבועים לפי קטגוריות
- השתמש ב-enums עבור ערכים מוגבלים

### 3. Validation
- השתמש ב-Zod לסכמות ולידציה
- הוסף ולידציה לכל input
- החזר שגיאות ברורות

### 4. Services
- הגדר interfaces עבור שירותים
- השתמש ב-dependency injection
- הוסף error handling

### 5. Utils
- כתוב פונקציות pure
- הוסף JSDoc comments
- כתוב tests מקיפים

## Versioning

החבילה משתמשת ב-Semantic Versioning:

- **Major**: שינויים לא תואמים
- **Minor**: תכונות חדשות (תואמות לאחור)
- **Patch**: תיקוני באגים

## Changelog

### v1.0.0
- הוספת טיפוסי ליבה
- הוספת קבועים בסיסיים
- הוספת ולידציה בסיסית
- הוספת שירותי לוגים ונקודות
- הוספת פונקציות עזר בסיסיות
