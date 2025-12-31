# חבילה משותפת - Shared

תיעוד חבילת Shared המשותפת בין Client ו-Server.

## סקירה כללית

חבילת Shared מכילה קוד משותף בין Frontend ו-Backend, כולל טיפוסים, קבועים, ולידציה, שירותים ופונקציות עזר.

לדיאגרמות מפורטות, ראו: [דיאגרמות - חבילה משותפת](../DIAGRAMS.md#דיאגרמת-חבילה-משותפת-shared)

## מבנה החבילה

```
shared/
├── types/                # טיפוסי TypeScript משותפים
│   ├── core/            # טיפוסי ליבה
│   │   ├── data.types.ts
│   │   ├── error.types.ts
│   │   ├── performance.types.ts
│   │   ├── response.types.ts
│   │   └── index.ts
│   ├── domain/          # טיפוסי תחום
│   │   ├── ai.types.ts
│   │   ├── analytics/   # טיפוסי אנליטיקה
│   │   ├── game/        # טיפוסי משחק
│   │   ├── user/        # טיפוסי משתמש
│   │   ├── validation.types.ts
│   │   └── index.ts
│   ├── infrastructure/  # טיפוסי תשתית
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── cache.types.ts
│   │   ├── config.types.ts
│   │   ├── logging.types.ts
│   │   ├── redis.types.ts
│   │   ├── storage.types.ts
│   │   └── index.ts
│   ├── payment.types.ts
│   ├── points.types.ts
│   ├── subscription.types.ts
│   └── language.types.ts
├── constants/            # קבועים משותפים
│   ├── business/         # קבועי עסק
│   ├── core/            # קבועי ליבה
│   ├── domain/          # קבועי תחום
│   └── infrastructure/  # קבועי תשתית
├── services/             # שירותים משותפים
│   ├── core/            # שירותי ליבה
│   │   └── logging/     # שירותי לוגים
│   ├── domain/          # שירותי תחום
│   │   └── points/      # שירותי נקודות
│   └── infrastructure/  # שירותי תשתית
│       ├── auth/        # שירותי אימות
│       ├── cache/       # שירותי מטמון
│       └── storage/     # שירותי אחסון
├── utils/                # פונקציות עזר משותפות
│   ├── core/            # כלים בסיסיים
│   ├── domain/          # כלי תחום
│   ├── infrastructure/  # כלי תשתית
│   └── validation.utils.ts
├── validation/           # ולידציה משותפת
│   └── domain/          # ולידציה של תחום
│       ├── difficulty.validation.ts
│       ├── payment.validation.ts
│       └── trivia.validation.ts
└── package.json
```

## Types

### Core Types

#### data.types.ts
טיפוסי נתונים בסיסיים:
- `Id` - מזהה ייחודי
- `Timestamp` - חותמת זמן
- `Metadata` - מטא-דאטה

#### error.types.ts
טיפוסי שגיאות:
- `ErrorResponse` - תגובת שגיאה
- `ValidationError` - שגיאת ולידציה

#### response.types.ts
טיפוסי תגובות:
- `ApiResponse<T>` - תגובת API
- `PaginatedResponse<T>` - תגובה עם pagination

### Domain Types

#### game.types.ts
טיפוסי משחק:
- `TriviaQuestion` - שאלת טריוויה
- `TriviaRequest` - בקשה לשאלה
- `GameMode` - מצב משחק
- `GameDifficulty` - קושי משחק

#### user.types.ts
טיפוסי משתמש:
- `BasicUser` - משתמש בסיסי
- `UserPreferences` - העדפות משתמש
- `UserStats` - סטטיסטיקות משתמש

#### analytics.types.ts
טיפוסי אנליטיקה:
- `AnalyticsEvent` - אירוע אנליטיקה
- `AnalyticsMetrics` - מטריקות אנליטיקה

### Infrastructure Types

#### api.types.ts
טיפוסי API:
- `ApiEndpoint` - נקודת קצה API
- `ApiMethod` - שיטת HTTP

#### auth.types.ts
טיפוסי אימות:
- `TokenPayload` - payload של token
- `AuthResponse` - תגובת אימות

## Constants

### Core Constants

#### api.constants.ts
קבועי API:
```typescript
import { API_ENDPOINTS, HTTP_STATUS_CODES } from '@shared/constants';

// נקודות קצה API
API_ENDPOINTS.AUTH.REGISTER    // '/auth/register'
API_ENDPOINTS.AUTH.LOGIN       // '/auth/login'
API_ENDPOINTS.GAME.TRIVIA      // '/game/trivia'
API_ENDPOINTS.GAME.ANSWER      // '/game/answer'
API_ENDPOINTS.USERS.PROFILE    // '/users/profile'

// קודי סטטוס HTTP
HTTP_STATUS_CODES.OK           // 200
HTTP_STATUS_CODES.CREATED      // 201
HTTP_STATUS_CODES.BAD_REQUEST  // 400
HTTP_STATUS_CODES.UNAUTHORIZED // 401
HTTP_STATUS_CODES.NOT_FOUND    // 404
HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR // 500
```

#### validation.constants.ts
קבועי ולידציה:
```typescript
import { VALIDATION_RULES, ERROR_MESSAGES } from '@shared/constants';

// כללי ולידציה
VALIDATION_RULES.USERNAME_MIN_LENGTH  // 3
VALIDATION_RULES.USERNAME_MAX_LENGTH  // 30
VALIDATION_RULES.PASSWORD_MIN_LENGTH  // 6
VALIDATION_RULES.EMAIL_PATTERN        // regex

// הודעות שגיאה
ERROR_MESSAGES.validation.REQUIRED            // 'This field is required'
ERROR_MESSAGES.validation.INVALID_EMAIL       // 'Please enter a valid email address'
```

### Domain Constants

#### game.constants.ts
קבועי משחק:
```typescript
import {
  DIFFICULTY_LEVELS,
  GAME_MODES,
  SCORING_MULTIPLIERS,
  DifficultyLevel,
  GameMode
} from '@shared/constants';

// רמות קושי
DifficultyLevel.EASY      // 'easy'
DifficultyLevel.MEDIUM    // 'medium'
DifficultyLevel.HARD      // 'hard'
DifficultyLevel.CUSTOM    // 'custom'

// מצבי משחק
GameMode.QUESTION_LIMITED // 'question-limited'
GameMode.TIME_LIMITED     // 'time-limited'
GameMode.ENDLESS          // 'endless'

// מכפילי ניקוד
SCORING_MULTIPLIERS.EASY    // 1.0
SCORING_MULTIPLIERS.MEDIUM  // 1.5
SCORING_MULTIPLIERS.HARD    // 2.0
```

#### user.constants.ts
קבועי משתמש:
```typescript
import {
  USER_ROLES,
  USER_STATUSES,
  UserRole,
  UserStatus
} from '@shared/constants';

// תפקידי משתמש
UserRole.USER    // 'user'
UserRole.ADMIN   // 'admin'
UserRole.MODERATOR // 'moderator'

// סטטוסי משתמש
UserStatus.ACTIVE    // 'active'
UserStatus.INACTIVE  // 'inactive'
UserStatus.BANNED    // 'banned'
UserStatus.PENDING   // 'pending'
```

#### points.constants.ts
קבועי נקודות:
```typescript
import {
  CREDIT_PURCHASE_PACKAGES,
  DEFAULT_DAILY_LIMIT,
  CREDIT_DECAY_RATE
} from '@shared/constants';

// חבילות קרדיטים
CREDIT_PURCHASE_PACKAGES[0]   // { credits: 50, price: 2.99 }
CREDIT_PURCHASE_PACKAGES[1]   // { credits: 100, price: 4.99 }
CREDIT_PURCHASE_PACKAGES[2]   // { credits: 250, price: 9.99 }

// מגבלות
DEFAULT_DAILY_LIMIT    // 20
POINT_DECAY_RATE       // 0.001
```

### Infrastructure Constants

#### http.constants.ts
קבועי HTTP:
```typescript
import { HttpMethod, HTTP_HEADERS } from '@shared/constants';

// שיטות HTTP
HttpMethod.GET    // 'GET'
HttpMethod.POST   // 'POST'
HttpMethod.PUT    // 'PUT'
HttpMethod.DELETE // 'DELETE'

// כותרות HTTP
HTTP_HEADERS.AUTHORIZATION  // 'Authorization'
HTTP_HEADERS.CONTENT_TYPE   // 'Content-Type'
HTTP_HEADERS.ACCEPT         // 'Accept'
```

#### storage.constants.ts
קבועי אחסון:
```typescript
import { STORAGE_KEYS, CACHE_TTL } from '@shared/constants';

// מפתחות אחסון
STORAGE_KEYS.USER_SESSION  // 'user_session'
STORAGE_KEYS.USER_PREFERENCES // 'user_preferences'
STORAGE_KEYS.GAME_STATE    // 'game_state'

// זמני cache
CACHE_TTL.SHORT    // 300 (5 minutes)
CACHE_TTL.MEDIUM   // 1800 (30 minutes)
CACHE_TTL.LONG     // 3600 (1 hour)
CACHE_TTL.VERY_LONG // 86400 (24 hours)
```

#### performance.constants.ts
קבועי ביצועים:
```typescript
import { PERFORMANCE_THRESHOLDS } from '@shared/constants';

// ספי ביצועים
PERFORMANCE_THRESHOLDS.ACCEPTABLE  // 1000ms
PERFORMANCE_THRESHOLDS.SLOW        // 3000ms
PERFORMANCE_THRESHOLDS.VERY_SLOW   // 5000ms
```

## Services

### Logging Services

#### clientLogger.service.ts
Logger ללקוח - שימוש ב-console של הדפדפן:
```typescript
import { clientLogger as logger } from '@shared/services';

// לוגים בסיסיים
logger.info('משחק התחיל', { topic: 'history', difficulty: 'medium' });
logger.error('שגיאה במשחק', { error: getErrorMessage(error), questionId: '123' });
logger.warn('אזהרה', { message: 'נקודות נמוכות' });
logger.debug('מידע debug', { state: gameState });

// לוגים ספציפיים למשתמש
logger.userInfo('משתמש התחבר', { userId: '123', username: 'user' });
logger.userError('שגיאה בפרופיל', { userId: '123', field: 'email' });
logger.userWarn('אזהרה למשתמש', { userId: '123' });
logger.logUserActivity('user123', 'login', { timestamp: new Date() });

// לוגים ספציפיים ל-API
logger.apiCreate('game_created', { gameId: '123', userId: 'user123' });
logger.apiRead('user_profile', { userId: 'user123' });
logger.apiUpdate('user_profile', { userId: 'user123', fields: ['firstName'] });
logger.apiDelete('game_history', { gameId: '123' });
logger.apiError('API error', { endpoint: '/game/trivia', statusCode: 500 });

// לוגים ספציפיים למשחק
logger.gameInfo('משחק התחיל', { topic: 'history', difficulty: 'medium' });
logger.gameError('שגיאה במשחק', { error: getErrorMessage(error), questionId: '123' });
logger.gameWarn('אזהרה במשחק', { message: 'זמן עבר' });

// לוגים ספציפיים לביצועים
logger.performance('question_generation', 1500, { topic: 'history' });

// לוגים ספציפיים למטמון
logger.cacheSet('trivia:history:medium', { topic: 'history' });
logger.cacheHit('trivia:history:medium');
logger.cacheMiss('trivia:history:medium');
logger.cacheInfo('Cache cleared', { keys: 10 });

// לוגים ספציפיים לאבטחה
logger.securityLogin('User login', { userId: 'user123' });
logger.securityLogout('User logout', { userId: 'user123' });
logger.securityDenied('Access denied', { userId: 'user123', endpoint: '/admin' });
logger.authRegister('User registered', { userId: 'user123', username: 'user' });
logger.authError('Auth error', { error: getErrorMessage(error) });
logger.authInfo('Auth info', { message: 'Token refreshed' });
logger.authTokenRefresh('Token refresh', { userId: 'user123' });
logger.authLogout('User logout', { userId: 'user123' });
logger.authDebug('Auth debug', { token: 'token...' });
```

#### serverLogger.service.ts
Logger לשרת - שימוש ב-file system ולוגים מובנים:
```typescript
import { serverLogger as logger } from '@shared/services';

// כל ה-methods של clientLogger זמינים גם כאן
// בנוסף, יש תמיכה ב-performance tracking

// Performance tracking
logger.startPerformanceTracking('generate_question');
// ... code ...
const duration = logger.endPerformanceTracking('generate_question', { topic: 'history' });

// לוגים מובנים
logger.databaseError(error, 'Failed to save game', { gameId: '123' });
logger.databaseInfo('Database connected', { host: 'localhost' });
logger.databaseWarn('Slow query detected', { query: 'SELECT * FROM games', duration: 5000 });

// לוגים ספציפיים לאחסון
logger.storageError('Storage error', { key: 'user:123', operation: 'set' });
logger.storageWarn('Storage warning', { key: 'user:123' });

// לוגים ספציפיים לתשלומים
logger.payment('Payment processed', { paymentId: 'pay_123', amount: 10.00 });
logger.paymentFailed('pay_123', 'Payment failed', { error: getErrorMessage(error) });

// Validation logs
logger.validationInfo('Validation passed', { field: 'email', value: 'user@example.com' });
logger.validationWarn('Validation warning', { field: 'password', issue: 'weak' });
logger.validationError('Validation error', { field: 'username', error: 'already exists' });
logger.validationDebug('Validation debug', { field: 'email', checks: ['format', 'length'] });
```

### Score Utilities

#### score.utils.ts
חישוב נקודות - פונקציות טהורות (pure functions):
```typescript
import { calculateAnswerScore } from '@shared/utils';
import { DifficultyLevel } from '@shared/constants';

// חישוב נקודות לתשובה (תומך גם ב-DifficultyLevel enum וגם ב-GameDifficulty string)
// מחזיר 0 אם התשובה שגויה
// כולל: ניקוד בסיסי לפי קושי, בונוס זמן (עד 10 נקודות), בונוס רצף (עד 20 נקודות)
const points = calculateAnswerScore(
  DifficultyLevel.MEDIUM,  // difficulty (enum) או 'medium' (string)
  15000,                    // timeSpentMs in milliseconds
  3,                        // streak - רצף תשובות נכונות
  true                      // isCorrect - האם התשובה נכונה
);
// נקודות בסיס: EASY=10, MEDIUM=20, HARD=30, CUSTOM=20
// בונוס זמן: עד 10 נקודות (תלוי במהירות התשובה)
// בונוס רצף: עד 20 נקודות (streak * 2)
```

### Credits Utilities

#### credits.utils.ts
חישוב קרדיטים - פונקציות טהורות (pure functions):
```typescript
import { 
  calculateRequiredCredits, 
  calculateNewBalance, 
  calculateDailyLimit, 
  calculateOptimalPackage 
} from '@shared/utils';
import { GameMode } from '@shared/constants';
import type { CreditBalance, CreditPurchaseOption } from '@shared/types';

// חישוב קרדיטים נדרשים למשחק
const requiredCredits = calculateRequiredCredits(
  10,              // questionsPerRequest - מספר שאלות
  GameMode.MEDIUM  // gameMode - מצב משחק (משפיע על העלות)
);
// עלויות: TIME_LIMITED=1.5, QUESTION_LIMITED=1, UNLIMITED=0.8

// חישוב יתרה חדשה לאחר ניכוי קרדיטים
const { newBalance, deductionDetails } = calculateNewBalance(
  currentBalance,           // CreditBalance - יתרה נוכחית
  10,                       // questionsPerRequest - מספר שאלות
  GameMode.QUESTION_LIMITED // gameMode - מצב משחק
);
// סדר ניכוי: freeQuestions → purchasedCredits → credits

// חישוב מגבלה יומית וזמן איפוס
const dailyLimitInfo = calculateDailyLimit(
  currentBalance,           // CreditBalance - יתרה נוכחית
  new Date('2024-01-01'),   // lastResetTime - זמן איפוס אחרון (או null)
  20                        // dailyLimit - מגבלה יומית
);

// חישוב חבילת קרדיטים אופטימלית
const recommendation = calculateOptimalPackage(
  availablePackages,        // CreditPurchaseOption[] - חבילות זמינות
  100,                      // targetCredits - מספר קרדיטים מטרה
  50                        // budget - תקציב מקסימלי
);
```

### Storage Services

Storage services are available through `BaseStorageService` and `MetricsService`. 
For caching strategies, use `CacheStrategyService` from the cache module.

### Infrastructure Services

#### tokenExtraction.service.ts
שירות לחילוץ טוקנים מבקשות HTTP:
```typescript
import { TokenExtractionService } from '@shared/services';

// חילוץ טוקן מה-Authorization header או cookies
const token = TokenExtractionService.extractToken(
  request.headers.authorization,
  request.cookies
);

if (token) {
  // טוקן נמצא, המשך עם אימות
  const user = await verifyToken(token);
}
```

#### cache.service.ts
שירות מטמון - ניהול מטמון Redis:
```typescript
import { CacheStrategyService } from '@shared/services';

// יצירת instance (בשימוש בשרת)
const cacheService = new CacheStrategyService(
  cacheStorage,       // StorageService
  persistentStorage   // StorageService
);

// Get value with cache strategy
const result = await cacheService.get('key', 'cache-first');

// Set value in cache
await cacheService.set('key', value, ttl, 'cache-first');

// Delete value from cache
await cacheService.delete('key');
```

## Utils

### Core Utils

#### error.utils.ts
כלי טיפול בשגיאות:
```typescript
import { getErrorMessage, getErrorStack, getErrorType, ensureErrorObject } from '@shared/utils';

// קבלת הודעת שגיאה מתוך כל סוג של error
try {
  // code that might throw
} catch (error) {
  const message = getErrorMessage(error);
  console.log(message);
}

// קבלת stack trace
const stack = getErrorStack(error);

// קבלת סוג השגיאה
const errorType = getErrorType(error); // 'Error', 'TypeError', 'HttpException', etc.

// הבטחה ש-error הוא Error object
const errorObj = ensureErrorObject(error);
```

#### data.utils.ts
כלי נתונים בסיסיים:
```typescript
import {
  isRecord,
  hasProperty,
  hasPropertyOfType,
  calculatePercentage,
  unique,
  groupBy,
  buildCountRecord
} from '@shared/utils';

// בדיקה אם ערך הוא record (object עם string keys)
if (isRecord(value)) {
  // value הוא Record<string, unknown>
}

// בדיקה אם record יש property מסוים
if (hasProperty(data, 'userId')) {
  // data הוא Record<'userId', unknown>
}

// בדיקה אם record יש property עם type מסוים
if (hasPropertyOfType(data, 'userId', (val): val is string => typeof val === 'string')) {
  // data הוא Record<'userId', string>
}

// חישוב אחוז
const percentage = calculatePercentage(75, 100); // 75

// קבלת ערכים ייחודיים
const uniqueValues = unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]

// קיבוץ לפי key (in-memory על מערך שכבר נטען)
const grouped = groupBy(users, 'role');
// { 'admin': [...], 'user': [...] }

// בניית record של counts
const counts = buildCountRecord(
  games,
  (game) => game.topic,
  (game) => game.score
);
// { 'history': 100, 'science': 50 }
```

#### array.utils.ts (מורכב ל-data.utils.ts)
כלי מערכים:
```typescript
import { shuffle, unique, groupBy } from '@shared/utils';

// ערבוב מערך
const shuffled = shuffle([1, 2, 3, 4, 5]); // מערך מעורב

// ערכים ייחודיים
const uniqueValues = unique([1, 2, 2, 3, 3, 3]); // [1, 2, 3]

// קיבוץ לפי מפתח
const grouped = groupBy(users, 'role'); // Record<string, User[]>
```

#### format.utils.ts
כלי עיצוב:
```typescript
import { formatCurrency, calculatePricePerCredit } from '@shared/utils';

// עיצוב מטבע
const formatted = formatCurrency(10.50, 'USD'); // '$10.50'
const formattedIL = formatCurrency(10.50, 'ILS'); // '₪10.50'

// חישוב מחיר לקרדיט
const pricePerCredit = calculatePricePerCredit(10.00, 100); // 0.1
```

### Domain Utils

#### user.utils.ts
כלי משתמש:
```typescript
import { mergeUserPreferences } from '@shared/utils';
import { DEFAULT_USER_PREFERENCES } from '@shared/constants';
import { UserPreferences } from '@shared/types';

// מיזוג העדפות משתמש
const merged = mergeUserPreferences(
  existingPreferences,  // UserPreferences | null | undefined
  newPreferences        // Partial<UserPreferences> | null | undefined
);
// מחזיר UserPreferences מלא עם ערכי ברירת מחדל
```

#### points.utils.ts
כלי נקודות (גרסת client):
```typescript
import { calculateAnswerPoints } from '@shared/utils';

// חישוב נקודות לתשובה (תומך גם ב-DifficultyLevel enum וגם ב-string)
const points = calculateAnswerScore(
  'medium',     // difficulty (string) או DifficultyLevel.MEDIUM (enum)
  15000,        // timeSpentMs in milliseconds
  3,            // streak
  true          // isCorrect
);

// כל הפונקציות זמינות גם ב-client וגם ב-server:
// - calculateAnswerScore
// - calculateBonusScore
// - calculateStreakBonus
// - calculateDailyLimit
// - calculateOptimalPackage
```

### Infrastructure Utils

#### id.utils.ts
כלי יצירת מזהה:
```typescript
import {
  generateId,
  generateTraceId,
  generateSessionId,
  generateUserId,
  generatePaymentIntentId,
  generateQuestionId
} from '@shared/utils';

// יצירת ID רנדומלי
const id = generateId();           // ID באורך 13 (ברירת מחדל)
const longId = generateId(20);     // ID באורך 20

// יצירת trace ID
const traceId = generateTraceId(); // ID באורך 30

// יצירת session ID
const sessionId = generateSessionId(); // ID עם timestamp prefix

// יצירת user ID
const userId = generateUserId(); // 'user_...'

// יצירת payment intent ID
const paymentId = generatePaymentIntentId(); // 'pi_...'

// יצירת question ID
const questionId = generateQuestionId(); // 'q_...'
```

#### sanitization.utils.ts
כלי ניקוי ואבטחה:
```typescript
import {
  sanitizeInput,
  sanitizeLogMessage,
  sanitizeEmail,
  sanitizeCardNumber,
  normalizeText
} from '@shared/utils';

// ניקוי input
const cleaned = sanitizeInput(userInput, 1000); // מסיר HTML ומגביל אורך

// ניקוי הודעת לוג
const safeLog = sanitizeLogMessage('Password: secret123'); // 'Password: ***'

// ניקוי email
const cleanEmail = sanitizeEmail('  USER@EXAMPLE.COM  '); // 'user@example.com'

// ניקוי מספר כרטיס
const cleanCard = sanitizeCardNumber('1234 5678 9012 3456'); // '1234567890123456'

// נירמול טקסט
const normalized = normalizeText('  HELLO   WORLD  '); // 'hello world'
```

#### storage.utils.ts
כלי אחסון:
```typescript
import { isStorageAvailable, getStorageSize, clearStorage } from '@shared/utils';

// בדיקת זמינות אחסון
if (isStorageAvailable('localStorage')) {
  // localStorage זמין
}

// קבלת גודל אחסון
const size = getStorageSize('localStorage'); // בגודל bytes

// ניקוי אחסון
clearStorage('localStorage');
```

## Validation

### Domain Validation

#### trivia.validation.ts
ולידציה של שאלות טריוויה:
- ולידציה של נושא
- ולידציה של קושי
- ולידציה של שאלה ותשובות

#### difficulty.validation.ts
ולידציה של קושי:
- ולידציה של רמת קושי
- ולידציה של קושי מותאם

#### payment.validation.ts
ולידציה של תשלומים:
- ולידציה של סכום
- ולידציה של שיטת תשלום

## הפניות

- [ארכיטקטורה כללית](../ARCHITECTURE.md)
- [טיפוסים](./TYPES.md)
- [קבועים](./CONSTANTS.md)
- [ולידציה](./VALIDATION.md)
- [דיאגרמת חבילה משותפת (Shared)](../DIAGRAMS.md#דיאגרמת-חבילה-משותפת-shared)
