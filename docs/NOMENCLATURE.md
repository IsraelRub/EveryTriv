# נומנקלטורה מלאה - EveryTriv

מסמך מקיף המתעד את כל הנומנקלטורה (מערכת השמות) בפרויקט EveryTriv.

## תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [עקרונות כלליים](#עקרונות-כלליים)
3. [שמות קבצים](#שמות-קבצים)
4. [Classes](#classes)
5. [Validation Functions (Shared)](#validation-functions-shared)
6. [Interfaces & Types](#interfaces--types)
7. [Functions](#functions)
8. [Constants & Enums](#constants--enums)
9. [Services (Singletons)](#services-singletons)
10. [Hooks (Client)](#hooks-client)
11. [Components (Client)](#components-client)
12. [Views (Client)](#views-client)
13. [Redux (Client)](#redux-client)
14. [DTOs (Server)](#dtos-server)
15. [Entities (Server)](#entities-server)
16. [Modules (Server)](#modules-server)
17. [Guards (Server)](#guards-server)
18. [Pipes (Server)](#pipes-server)
19. [Interceptors (Server)](#interceptors-server)
20. [Decorators (Server)](#decorators-server)
21. [Middleware (Server)](#middleware-server)
22. [Gateways (Server)](#gateways-server)
23. [Strategies (Server)](#strategies-server)
24. [Exception Filters (Server)](#exception-filters-server)
25. [Config Classes & Exports (Server)](#config-classes--exports-server)
26. [Internal Controllers (Server)](#internal-controllers-server)
27. [Internal Services (Server)](#internal-services-server)
28. [Internal Types (Server)](#internal-types-server)
29. [Internal Constants (Server)](#internal-constants-server)

---

## סקירה כללית

הפרויקט EveryTriv מאורגן כמונורפו (monorepo) עם שלושה חבילות עיקריות:
- **client/** - React + TypeScript frontend
- **server/** - NestJS backend
- **shared/** - קוד משותף בין client ו-server

---

## עקרונות כלליים

### סוגי שמות

| סוג | נומנקלטורה | דוגמה |
|-----|------------|-------|
| **Classes** | PascalCase | `UserService`, `GameController` |
| **Interfaces** | PascalCase | `UserProfile`, `GameHistoryEntry` |
| **Types** | PascalCase | `GameConfig`, `AnalyticsResponse` |
| **Functions** | camelCase | `calculateGameStats`, `normalizeGameData` |
| **Constants** | UPPER_SNAKE_CASE | `API_ENDPOINTS`, `ERROR_MESSAGES` |
| **Enums** | PascalCase | `DifficultyLevel`, `GameMode` |
| **Enum Values** | UPPER_SNAKE_CASE | `EASY`, `MEDIUM`, `HARD` |
| **Hooks** | camelCase + `use` prefix | `useAuth`, `useLogin` |
| **Components** | PascalCase | `GameTimer`, `PaymentDialog` |
| **Files** | camelCase | `analytics.service.ts`, `user.entity.ts` |
| **DTOs** | PascalCase + `Dto` suffix | `CreateUserDto`, `UpdateProfileDto` |
| **Modules** | PascalCase + `Module` suffix | `AuthModule`, `GameModule` |

---

## שמות קבצים

### Client (`client/src/`)

#### Services
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `analytics.service.ts` | `services/domain/` | שירות אנליטיקה |
| `game.service.ts` | `services/domain/` | שירות משחק |
| `user.service.ts` | `services/domain/` | שירות משתמש |
| `credits.service.ts` | `services/domain/` | שירות נקודות |
| `payment.service.ts` | `services/domain/` | שירות תשלום |
| `multiplayer.service.ts` | `services/domain/` | שירות מרובה משתמשים |
| `api.service.ts` | `services/infrastructure/` | שירות API כללי |
| `auth.service.ts` | `services/infrastructure/` | שירות אימות |
| `audio.service.ts` | `services/infrastructure/` | שירות אודיו |
| `storage.service.ts` | `services/infrastructure/` | שירות אחסון |

#### Hooks
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `useAuth.ts` | `hooks/` | hook לאימות |
| `useAuthState.ts` | `hooks/` | hook למצב אימות |
| `useCredits.ts` | `hooks/` | hook לנקודות |
| `useTrivia.ts` | `hooks/` | hook לשאלות טריוויה |
| `useMultiplayer.ts` | `hooks/` | hook למרובה משתמשים |
| `useAnalyticsDashboard.ts` | `hooks/` | hook לדשבורד אנליטיקה |
| `useAdminAnalytics.ts` | `hooks/` | hook לאנליטיקה אדמין |

#### Components
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `GameTimer.tsx` | `components/game/` | טיימר משחק |
| `GameSettingsForm.tsx` | `components/game/` | טופס הגדרות משחק |
| `PaymentDialog.tsx` | `components/payment/` | דיאלוג תשלום |
| `Navigation.tsx` | `components/navigation/` | ניווט ראשי |
| `ProtectedRoute.tsx` | `components/routing/` | נתיב מוגן |

#### Types
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `game.types.ts` | `types/domain/game/` | טיפוסי משחק |
| `user.types.ts` | `types/domain/user/` | טיפוסי משתמש |
| `analytics.types.ts` | `types/domain/analytics/` | טיפוסי אנליטיקה |
| `api.types.ts` | `types/infrastructure/` | טיפוסי API |

### Server (`server/src/`)

#### Services
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `game.service.ts` | `features/game/` | שירות משחק |
| `user.service.ts` | `features/user/` | שירות משתמש |
| `auth.service.ts` | `features/auth/` | שירות אימות |
| `payment.service.ts` | `features/payment/` | שירות תשלום |
| `credits.service.ts` | `features/credits/` | שירות נקודות |
| `multiplayer.service.ts` | `features/game/multiplayer/` | שירות מרובה משתמשים |
| `analytics-tracker.service.ts` | `features/analytics/services/` | שירות מעקב אנליטיקה |
| `user-analytics.service.ts` | `features/analytics/services/` | שירות אנליטיקה משתמש |
| `business-analytics.service.ts` | `features/analytics/services/` | שירות אנליטיקה עסקית |

**הערה על אי-עקביות:** יש שימוש ב-kebab-case (`business-analytics.service.ts`) לעומת camelCase (`user.service.ts`). מומלץ לאחד את הסגנון.

#### Controllers
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `game.controller.ts` | `features/game/` | בקר משחק |
| `user.controller.ts` | `features/user/` | בקר משתמש |
| `auth.controller.ts` | `features/auth/` | בקר אימות |
| `analytics.controller.ts` | `features/analytics/` | בקר אנליטיקה |
| `admin.controller.ts` | `features/admin/` | בקר אדמין |
| `multiplayer.controller.ts` | `features/game/multiplayer/` | בקר מרובה משתמשים |
| `paypalWebhook.controller.ts` | `features/payment/webhooks/` | בקר webhook PayPal |

#### DTOs
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `auth.dto.ts` | `features/auth/dtos/` | DTOs אימות |
| `user.dto.ts` | `features/user/dtos/` | DTOs משתמש |
| `gameHistoryQuery.dto.ts` | `features/game/dtos/` | DTO שאילתת היסטוריה |
| `startGameSession.dto.ts` | `features/game/dtos/` | DTO התחלת משחק |
| `analytics.dto.ts` | `features/analytics/dtos/` | DTOs אנליטיקה |

#### Entities
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `user.entity.ts` | `internal/entities/` | Entity משתמש |
| `gameHistory.entity.ts` | `internal/entities/` | Entity היסטוריית משחק |
| `creditTransaction.entity.ts` | `internal/entities/` | Entity עסקת נקודות |
| `leaderboard.entity.ts` | `internal/entities/` | Entity טבלת לוחות |

### Shared (`shared/`)

#### Types
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `game.types.ts` | `types/domain/game/` | טיפוסי משחק משותפים |
| `user.types.ts` | `types/domain/user/` | טיפוסי משתמש משותפים |
| `analyticsCommon.types.ts` | `types/domain/analytics/` | טיפוסי אנליטיקה משותפים |
| `api.types.ts` | `types/infrastructure/` | טיפוסי API משותפים |

#### Constants
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `api.constants.ts` | `constants/core/` | קבועי API |
| `game.constants.ts` | `constants/domain/` | קבועי משחק |
| `auth.constants.ts` | `constants/core/` | קבועי אימות |
| `error.constants.ts` | `constants/core/` | קבועי שגיאות |
| `cacheKeys.constants.ts` | `constants/infrastructure/` | מפתחות cache |

#### Utils
| שם קובץ | מיקום | תיאור |
|---------|-------|-------|
| `game.utils.ts` | `utils/domain/` | פונקציות עזר למשחק |
| `user.utils.ts` | `utils/domain/` | פונקציות עזר למשתמש |
| `format.utils.ts` | `utils/core/` | פונקציות עזר לעיצוב |
| `error.utils.ts` | `utils/core/` | פונקציות עזר לשגיאות |

---

## Classes

### Server Classes

#### Services
| שם Class | מיקום קובץ | תיאור |
|---------|------------|-------|
| `GameService` | `server/src/features/game/game.service.ts` | שירות משחק ראשי |
| `UserService` | `server/src/features/user/user.service.ts` | שירות משתמש |
| `AuthService` | `server/src/features/auth/auth.service.ts` | שירות אימות |
| `PaymentService` | `server/src/features/payment/payment.service.ts` | שירות תשלום |
| `CreditsService` | `server/src/features/credits/credits.service.ts` | שירות נקודות |
| `MultiplayerService` | `server/src/features/game/multiplayer/multiplayer.service.ts` | שירות מרובה משתמשים |
| `AnalyticsTrackerService` | `server/src/features/analytics/services/analytics-tracker.service.ts` | מעקב אירועי אנליטיקה |
| `UserAnalyticsService` | `server/src/features/analytics/services/user-analytics.service.ts` | אנליטיקה משתמש |
| `BusinessAnalyticsService` | `server/src/features/analytics/services/business-analytics.service.ts` | אנליטיקה עסקית |
| `GlobalAnalyticsService` | `server/src/features/analytics/services/global-analytics.service.ts` | אנליטיקה גלובלית |
| `RankingAnalyticsService` | `server/src/features/analytics/services/ranking-analytics.service.ts` | אנליטיקה דירוג |
| `SystemAnalyticsService` | `server/src/features/analytics/services/system-analytics.service.ts` | אנליטיקה מערכת |
| `AnalyticsCommonService` | `server/src/features/analytics/services/analytics-common.service.ts` | פונקציות משותפות אנליטיקה |
| `TriviaGenerationService` | `server/src/features/game/logic/triviaGeneration.service.ts` | יצירת שאלות טריוויה |
| `GroqTriviaProvider` | `server/src/features/game/logic/providers/groq/groq.provider.ts` | ספק טריוויה Groq |
| `GroqApiClient` | `server/src/features/game/logic/providers/groq/groq.apiClient.ts` | לקוח API Groq |
| `GroqResponseParser` | `server/src/features/game/logic/providers/groq/groq.responseParser.ts` | מפענח תגובות Groq |
| `RoomService` | `server/src/features/game/multiplayer/room.service.ts` | שירות חדרים |
| `QuestionSchedulerService` | `server/src/features/game/multiplayer/questionScheduler.service.ts` | תזמון שאלות |
| `GameStateService` | `server/src/features/game/multiplayer/gameState.service.ts` | ניהול מצב משחק |
| `AdminService` | `server/src/features/admin/admin.service.ts` | שירות אדמין |

#### Config Classes
| שם Class/Export | מיקום קובץ | סוג | תיאור |
|----------------|------------|-----|-------|
| `AppConfig` | `server/src/config/app.config.ts` | class | הגדרות אפליקציה |
| `DatabaseConfig` | `server/src/config/database.config.ts` | const object | הגדרות מסד נתונים |
| `redisConfig` | `server/src/config/redis.config.ts` | const object | הגדרות Redis |
| `validateEnvironmentVariables` | `server/src/config/environment.validation.ts` | function | ולידציית משתני סביבה |
| `dataSource` | `server/src/config/dataSource.ts` | export | מקור נתונים TypeORM |

#### Exception Filters
| שם Class | מיקום קובץ | תיאור |
|---------|------------|-------|
| `GlobalExceptionFilter` | `server/src/common/globalException.filter.ts` | Filter גלובלי לטיפול בשגיאות |

#### Controllers
| שם Class | מיקום קובץ | תיאור |
|---------|------------|-------|
| `AppController` | `server/src/app.controller.ts` | בקר אפליקציה ראשי |
| `GameController` | `server/src/features/game/game.controller.ts` | בקר משחק |
| `UserController` | `server/src/features/user/user.controller.ts` | בקר משתמש |
| `AuthController` | `server/src/features/auth/auth.controller.ts` | בקר אימות |
| `AnalyticsController` | `server/src/features/analytics/analytics.controller.ts` | בקר אנליטיקה |
| `AdminController` | `server/src/features/admin/admin.controller.ts` | בקר אדמין |
| `MultiplayerController` | `server/src/features/game/multiplayer/multiplayer.controller.ts` | בקר מרובה משתמשים |
| `PaymentController` | `server/src/features/payment/payment.controller.ts` | בקר תשלום |
| `CreditsController` | `server/src/features/credits/credits.controller.ts` | בקר נקודות |
| `AiProvidersController` | `server/src/features/game/aiProviders.controller.ts` | בקר ספקי AI |
| `PayPalWebhookController` | `server/src/features/payment/webhooks/paypalWebhook.controller.ts` | בקר webhook PayPal |

#### Modules
| שם Class | מיקום קובץ | תיאור |
|---------|------------|-------|
| `GameModule` | `server/src/features/game/game.module.ts` | מודול משחק |
| `UserModule` | `server/src/features/user/user.module.ts` | מודול משתמש |
| `AuthModule` | `server/src/features/auth/auth.module.ts` | מודול אימות |
| `AnalyticsModule` | `server/src/features/analytics/analytics.module.ts` | מודול אנליטיקה |
| `AdminModule` | `server/src/features/admin/admin.module.ts` | מודול אדמין |
| `MultiplayerModule` | `server/src/features/game/multiplayer/multiplayer.module.ts` | מודול מרובה משתמשים |
| `PaymentModule` | `server/src/features/payment/payment.module.ts` | מודול תשלום |
| `CreditsModule` | `server/src/features/credits/credits.module.ts` | מודול נקודות |

#### Entities
| שם Class | מיקום קובץ | תיאור |
|---------|------------|-------|
| `UserEntity` | `server/src/internal/entities/user.entity.ts` | Entity משתמש |
| `GameHistoryEntity` | `server/src/internal/entities/gameHistory.entity.ts` | Entity היסטוריית משחק |
| `CreditTransactionEntity` | `server/src/internal/entities/creditTransaction.entity.ts` | Entity עסקת נקודות |
| `LeaderboardEntity` | `server/src/internal/entities/leaderboard.entity.ts` | Entity טבלת לוחות |
| `PaymentHistoryEntity` | `server/src/internal/entities/paymentHistory.entity.ts` | Entity היסטוריית תשלום |
| `TriviaEntity` | `server/src/internal/entities/trivia.entity.ts` | Entity שאלות טריוויה |
| `UserStatsEntity` | `server/src/internal/entities/userStats.entity.ts` | Entity סטטיסטיקות משתמש |
| `BaseEntity` | `server/src/internal/entities/base.entity.ts` | Entity בסיס |

### Client Classes

#### Services
| שם Class | מיקום קובץ | תיאור |
|---------|------------|-------|
| `AnalyticsService` | `client/src/services/domain/analytics.service.ts` | שירות אנליטיקה |
| `GameService` | `client/src/services/domain/game.service.ts` | שירות משחק |
| `UserService` | `client/src/services/domain/user.service.ts` | שירות משתמש |
| `CreditsService` | `client/src/services/domain/credits.service.ts` | שירות נקודות |
| `PaymentService` | `client/src/services/domain/payment.service.ts` | שירות תשלום |
| `MultiplayerService` | `client/src/services/domain/multiplayer.service.ts` | שירות מרובה משתמשים |
| `ApiService` | `client/src/services/infrastructure/api.service.ts` | שירות API |
| `AuthService` | `client/src/services/infrastructure/auth.service.ts` | שירות אימות |
| `AudioService` | `client/src/services/infrastructure/audio.service.ts` | שירות אודיו |
| `StorageService` | `client/src/services/infrastructure/storage.service.ts` | שירות אחסון |
| `ClientLoggerService` | `client/src/services/infrastructure/clientLogger.service.ts` | שירות לוגים |
| `QueryInvalidationService` | `client/src/services/infrastructure/queryInvalidation.service.ts` | שירות invalidate queries |

#### Components
| שם Class | מיקום קובץ | תיאור |
|---------|------------|-------|
| `ErrorBoundary` | `client/src/components/ui/ErrorBoundary.tsx` | גבול שגיאות |

---

## Interfaces & Types

### Shared Types (Domain)

#### Game Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `BaseGameStatistics` | `shared/types/domain/game/game.types.ts` | סטטיסטיקות משחק בסיסיות |
| `BaseScoreData` | `shared/types/domain/game/game.types.ts` | נתוני ציון בסיסיים |
| `BaseGameEntity` | `shared/types/domain/game/game.types.ts` | Entity משחק בסיסי |
| `GameHistoryEntry` | `shared/types/domain/game/game.types.ts` | רשומת היסטוריית משחק |
| `SaveGameHistoryData` | `shared/types/domain/game/game.types.ts` | נתונים לשמירת היסטוריה |
| `LeaderboardEntry` | `shared/types/domain/game/game.types.ts` | רשומה בטבלת לוחות |
| `UserRankData` | `shared/types/domain/game/game.types.ts` | נתוני דירוג משתמש |
| `UserStatsData` | `shared/types/domain/game/game.types.ts` | נתוני סטטיסטיקות משתמש |
| `GameModeConfig` | `shared/types/domain/game/game.types.ts` | הגדרות מצב משחק |
| `GameConfig` | `shared/types/domain/game/game.types.ts` | הגדרות משחק |
| `LeaderboardResponse` | `shared/types/domain/game/game.types.ts` | תגובת טבלת לוחות |
| `CategoryStatistics` | `shared/types/domain/game/game.types.ts` | סטטיסטיקות קטגוריה |
| `LeaderboardStats` | `shared/types/domain/game/game.types.ts` | סטטיסטיקות טבלת לוחות |
| `AdminStatisticsBase` | `shared/types/domain/game/game.types.ts` | בסיס סטטיסטיקות אדמין |
| `AdminGameStatistics` | `shared/types/domain/game/game.types.ts` | סטטיסטיקות משחק אדמין |
| `AdminStatisticsRaw` | `shared/types/domain/game/game.types.ts` | סטטיסטיקות אדמין גולמיות |
| `GameHistoryResponse` | `shared/types/domain/game/game.types.ts` | תגובת היסטוריית משחק |
| `ClearOperationResponse` | `shared/types/domain/game/game.types.ts` | תגובת פעולת ניקוי |
| `Player` | `shared/types/domain/game/multiplayer.types.ts` | שחקן במרובה משתמשים |
| `CreateRoomConfig` | `shared/types/domain/game/multiplayer.types.ts` | הגדרות יצירת חדר |
| `RoomConfig` | `shared/types/domain/game/multiplayer.types.ts` | הגדרות חדר |
| `PlayerAnswerMap` | `shared/types/domain/game/multiplayer.types.ts` | מפת תשובות שחקנים |
| `PlayerScoreMap` | `shared/types/domain/game/multiplayer.types.ts` | מפת ניקוד שחקנים |
| `MultiplayerRoom` | `shared/types/domain/game/multiplayer.types.ts` | חדר מרובה משתמשים |
| `GameState` | `shared/types/domain/game/multiplayer.types.ts` | מצב משחק |
| `QuestionResult` | `shared/types/domain/game/multiplayer.types.ts` | תוצאות שאלה |
| `GameEventDataMap` | `shared/types/domain/game/multiplayer.types.ts` | type map אירועי משחק |
| `GameEventType` | `shared/types/domain/game/multiplayer.types.ts` | type סוגי אירועי משחק |
| `GameEvent` | `shared/types/domain/game/multiplayer.types.ts` | interface אירוע משחק |
| `MultiplayerGameEvent` | `shared/types/domain/game/multiplayer.types.ts` | type אירוע משחק מרובה משתמשים |
| `CreateRoomResponse` | `shared/types/domain/game/multiplayer.types.ts` | תגובת יצירת חדר |
| `RoomStateResponse` | `shared/types/domain/game/multiplayer.types.ts` | תגובת מצב חדר |
| `MultiplayerAnswerResult` | `shared/types/domain/game/multiplayer.types.ts` | תוצאות תשובה מרובה משתמשים |
| `QuestionEndResult` | `shared/types/domain/game/multiplayer.types.ts` | תוצאות סיום שאלה |
| `BaseTriviaParams` | `shared/types/domain/game/trivia.types.ts` | פרמטרים בסיסיים טריוויה |
| `TriviaQuestionDetailsMetadata` | `shared/types/domain/game/trivia.types.ts` | מטא-דאטה פרטי שאלת טריוויה |
| `TriviaAnswer` | `shared/types/domain/game/trivia.types.ts` | תשובת טריוויה |
| `BaseGameTopicDifficulty` | `shared/types/domain/game/trivia.types.ts` | בסיס נושא-קושי משחק |
| `BaseTriviaConfig` | `shared/types/domain/game/trivia.types.ts` | הגדרות טריוויה בסיסיות |
| `CustomDifficultyString` | `shared/types/domain/game/trivia.types.ts` | type מחרוזת קושי מותאם |
| `GameDifficulty` | `shared/types/domain/game/trivia.types.ts` | type קושי משחק |
| `TriviaQuestionInput` | `shared/types/domain/game/trivia.types.ts` | type קלט שאלת טריוויה |
| `TriviaQuestion` | `shared/types/domain/game/trivia.types.ts` | interface שאלת טריוויה |
| `BaseAnswerPayload` | `shared/types/domain/game/trivia.types.ts` | interface payload תשובה בסיסי |
| `TriviaRequest` | `shared/types/domain/game/trivia.types.ts` | interface בקשת טריוויה |
| `GameAnswerSubmission` | `shared/types/domain/game/trivia.types.ts` | interface שליחת תשובת משחק |
| `TriviaInputValidationResult` | `shared/types/domain/game/trivia.types.ts` | interface תוצאת ולידציית קלט טריוויה |
| `TriviaResponse` | `shared/types/domain/game/trivia.types.ts` | interface תגובת טריוויה |
| `AnswerResult` | `shared/types/domain/game/trivia.types.ts` | interface תוצאת תשובה |
| `TriviaSession` | `shared/types/domain/game/trivia.types.ts` | interface סשן טריוויה |
| `SavedGameConfiguration` | `shared/types/domain/game/gameCache.types.ts` | interface הגדרות משחק שמורות |
| `Achievement` | `shared/types/domain/game/achievements.types.ts` | interface הישג |
| `GroqModelConfig` | `shared/types/domain/game/groq.types.ts` | interface הגדרות מודל Groq |

#### User Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `BasicUser` | `shared/types/domain/user/user.types.ts` | משתמש בסיסי |
| `UserProfile` | `shared/types/domain/user/user.types.ts` | פרופיל משתמש |
| `UserPrivacyPreferences` | `shared/types/domain/user/user.types.ts` | העדפות פרטיות משתמש |
| `UserGamePreferences` | `shared/types/domain/user/user.types.ts` | העדפות משחק משתמש |
| `UserPreferences` | `shared/types/domain/user/user.types.ts` | העדפות משתמש |
| `User` | `shared/types/domain/user/user.types.ts` | משתמש מלא |
| `UserStatistics` | `shared/types/domain/user/user.types.ts` | סטטיסטיקות משתמש |
| `UpdateUserProfileData` | `shared/types/domain/user/user.types.ts` | נתוני עדכון פרופיל |
| `ChangePasswordData` | `shared/types/domain/user/user.types.ts` | נתוני שינוי סיסמה |
| `UpdateCreditsData` | `shared/types/domain/user/user.types.ts` | נתוני עדכון נקודות |
| `DeductCreditsResponse` | `shared/types/domain/user/user.types.ts` | תגובת ניכוי נקודות |
| `CustomDifficultyItem` | `shared/types/domain/user/userOperations.types.ts` | פריט קושי מותאם |
| `UserProfileResponseType` | `shared/types/domain/user/userOperations.types.ts` | type תגובת פרופיל משתמש |
| `UserStatsCacheEntry` | `shared/types/domain/user/userCache.types.ts` | רשומת cache סטטיסטיקות משתמש |
| `UserSearchCacheResult` | `shared/types/domain/user/userCache.types.ts` | תוצאות cache חיפוש משתמש |
| `UserSearchCacheEntry` | `shared/types/domain/user/userCache.types.ts` | רשומת cache חיפוש משתמש |
| `AuditLogEntry` | `shared/types/domain/user/userCache.types.ts` | רשומת audit log |

#### Analytics Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `TimeStat` | `shared/types/domain/analytics/analyticsCommon.types.ts` | interface סטט זמן |
| `AnalyticsPaginationMetadata` | `shared/types/domain/analytics/analyticsCommon.types.ts` | interface מטא-דאטה pagination אנליטיקה |
| `AnalyticsResponse<T>` | `shared/types/domain/analytics/analyticsCommon.types.ts` | interface תגובת אנליטיקה |
| `HistoryFilterOptions` | `shared/types/domain/analytics/analyticsCommon.types.ts` | interface אפשרויות סינון היסטוריה |
| `TrendQueryOptions` | `shared/types/domain/analytics/analyticsCommon.types.ts` | interface אפשרויות שאילתת מגמה |
| `ComparisonQueryOptions` | `shared/types/domain/analytics/analyticsCommon.types.ts` | interface אפשרויות שאילתת השוואה |
| `TopicAnalyticsRecord` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface רשומת אנליטיקה נושא |
| `QuestionAnalytics` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface אנליטיקת שאלה |
| `GameAnalyticsQuery` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface שאילתת אנליטיקה משחק |
| `GameAnalyticsStatsEntry` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface רשומת סטטיסטיקות אנליטיקה משחק |
| `GameAnalyticsStats` | `shared/types/domain/analytics/analyticsGame.types.ts` | type סטטיסטיקות אנליטיקה משחק |
| `GameStatsCore` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface ליבת סטטיסטיקות משחק |
| `GameStatsData` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface נתוני סטטיסטיקות משחק |
| `TopicStatsData` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface נתוני סטטיסטיקות נושא |
| `DifficultyStatsData` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface נתוני סטטיסטיקות קושי |
| `GlobalStatsResponse` | `shared/types/domain/analytics/analyticsGame.types.ts` | interface תגובת סטטיסטיקות גלובליות |
| `UserAnalyticsQuery` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface שאילתת אנליטיקה משתמש |
| `UserAnalyticsRecord` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface רשומת אנליטיקה משתמש |
| `UserBasicInfo` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface מידע בסיסי משתמש |
| `UserPerformanceMetrics` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface מטריקות ביצועי משתמש |
| `CompleteUserAnalytics` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface אנליטיקה משתמש מלאה |
| `UserProgressTopic` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface נושא התקדמות משתמש |
| `UserTrendPoint` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface נקודת מגמה משתמש |
| `UserProgressAnalytics` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface אנליטיקת התקדמות משתמש |
| `UserProgressData` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface נתוני התקדמות משתמש |
| `UserInsightsData` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface נתוני תובנות משתמש |
| `UserComparisonMetrics` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface מטריקות השוואה משתמש |
| `UserComparisonResult` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface תוצאת השוואה משתמש |
| `UserRankData` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface נתוני דירוג משתמש |
| `UserSummaryData` | `shared/types/domain/analytics/analyticsUser.types.ts` | interface נתוני סיכום משתמש |
| `AnalyticsQuestionDetail` | `shared/types/domain/analytics/analyticsEvents.types.ts` | interface פרטי שאלה אנליטיקה |
| `AnalyticsProviderError` | `shared/types/domain/analytics/analyticsEvents.types.ts` | interface שגיאת ספק אנליטיקה |
| `AnalyticsEventData` | `shared/types/domain/analytics/analyticsEvents.types.ts` | interface נתוני אירוע אנליטיקה |
| `AnalyticsMetadata` | `shared/types/domain/analytics/analyticsEvents.types.ts` | interface מטא-דאטה אנליטיקה |
| `AnalyticsAnswerData` | `shared/types/domain/analytics/analyticsEvents.types.ts` | interface נתוני תשובה אנליטיקה |
| `TrackEventResponse` | `shared/types/domain/analytics/analyticsEvents.types.ts` | interface תגובת מעקב אירוע |
| `SystemStats` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface סטטיסטיקות מערכת |
| `SystemStatsQuery` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface שאילתת סטטיסטיקות מערכת |
| `SystemInsights` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface תובנות מערכת |
| `BusinessMetricsRevenue` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface מטריקות עסקיות הכנסות |
| `BusinessMetricsUsers` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface מטריקות עסקיות משתמשים |
| `BusinessMetricsEngagement` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface מטריקות עסקיות מעורבות |
| `BusinessMetrics` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface מטריקות עסקיות |
| `SystemRecommendation` | `shared/types/domain/analytics/analyticsSystem.types.ts` | interface המלצת מערכת |
| `MiddlewareMetrics` | `shared/types/domain/analytics/metrics.types.ts` | interface מטריקות middleware |
| `SystemPerformanceMetrics` | `shared/types/domain/analytics/metrics.types.ts` | interface מטריקות ביצועי מערכת |
| `SecurityMetrics` | `shared/types/domain/analytics/metrics.types.ts` | interface מטריקות אבטחה |

### Shared Types (Core)

#### Core Data Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `TypeGuard<T>` | `shared/types/core/data.types.ts` | type type guard function |
| `BasicValue` | `shared/types/core/data.types.ts` | type ערך בסיסי |
| `StatsValue` | `shared/types/core/data.types.ts` | type ערך סטטיסטיקה |
| `StorageValue` | `shared/types/core/data.types.ts` | type ערך אחסון |
| `RequestData` | `shared/types/core/data.types.ts` | type נתוני בקשה |
| `BaseDataValue` | `shared/types/core/data.types.ts` | type ערך נתונים בסיסי |
| `BaseData` | `shared/types/core/data.types.ts` | interface נתונים בסיסיים |
| `BaseTimestamps` | `shared/types/core/data.types.ts` | interface timestamps בסיסיים |
| `BaseEntity` | `shared/types/core/data.types.ts` | interface Entity בסיסי |
| `BaseCacheEntry` | `shared/types/core/data.types.ts` | interface רשומת cache בסיסית |
| `SlowOperation` | `shared/types/core/data.types.ts` | interface פעולה איטית |
| `SelectOption` | `shared/types/core/data.types.ts` | interface אפשרות בחירה |
| `ActivityEntry` | `shared/types/core/data.types.ts` | interface רשומת פעילות |
| `CountRecord` | `shared/types/core/data.types.ts` | type רשומת ספירה |
| `TotalCorrectStats` | `shared/types/core/data.types.ts` | interface סטטיסטיקות סה"כ נכון |
| `DifficultyStats` | `shared/types/core/data.types.ts` | interface סטטיסטיקות קושי |
| `DifficultyStatsRaw` | `shared/types/core/data.types.ts` | interface סטטיסטיקות קושי גולמיות |
| `DifficultyBreakdown` | `shared/types/core/data.types.ts` | type פירוט קושי |
| `TextPosition` | `shared/types/core/data.types.ts` | interface מיקום טקסט |

#### Core Response Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `BaseApiResponse<T>` | `shared/types/core/response.types.ts` | interface תגובת API בסיסית |
| `UrlResponse` | `shared/types/core/response.types.ts` | interface תגובת URL |
| `CorePagination` | `shared/types/core/response.types.ts` | interface pagination ליבה |
| `PagePagination` | `shared/types/core/response.types.ts` | interface pagination עמודים |
| `OffsetPagination` | `shared/types/core/response.types.ts` | interface pagination offset |
| `PaginatedResponse<T>` | `shared/types/core/response.types.ts` | interface תגובה מפוגלת |

#### Core Error Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `NestExceptionName` | `shared/types/core/error.types.ts` | type שם exception NestJS |
| `HttpError` | `shared/types/core/error.types.ts` | interface שגיאת HTTP |
| `ProviderAuthError` | `shared/types/core/error.types.ts` | interface שגיאת אימות ספק |
| `ProviderRateLimitError` | `shared/types/core/error.types.ts` | interface שגיאת rate limit ספק |
| `ProviderErrorWithStatusCode` | `shared/types/core/error.types.ts` | interface שגיאת ספק עם קוד סטטוס |

#### Core ID Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `GeneratedUserId` | `shared/types/core/id.types.ts` | type ID משתמש שנוצר |
| `GeneratedPaymentIntentId` | `shared/types/core/id.types.ts` | type ID payment intent שנוצר |
| `GeneratedInterceptorId` | `shared/types/core/id.types.ts` | type ID interceptor שנוצר |
| `GeneratedId` | `shared/types/core/id.types.ts` | type ID שנוצר (union) |

### Shared Types (Infrastructure)

#### Infrastructure API Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `ApiResponse<T>` | `shared/types/infrastructure/api.types.ts` | interface תגובת API |
| `PaymentResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת תשלום |
| `ApiMetadata` | `shared/types/infrastructure/api.types.ts` | interface מטא-דאטה API |
| `ApiError` | `shared/types/infrastructure/api.types.ts` | interface שגיאת API |
| `ErrorDetail` | `shared/types/infrastructure/api.types.ts` | type פרטי שגיאה |
| `ErrorResponseData` | `shared/types/infrastructure/api.types.ts` | interface נתוני תגובת שגיאה |
| `ErrorResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת שגיאה |
| `ValidationErrorResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת שגיאת ולידציה |
| `AmountDto` | `shared/types/infrastructure/api.types.ts` | interface DTO סכום |
| `PurchaseDto` | `shared/types/infrastructure/api.types.ts` | interface DTO רכישה |
| `ConfirmCreditPurchaseDto` | `shared/types/infrastructure/api.types.ts` | interface DTO אישור רכישת נקודות |
| `PurchaseResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת רכישה |
| `DeductCreditsRequest` | `shared/types/infrastructure/api.types.ts` | interface בקשת ניכוי נקודות |
| `QuestionData` | `shared/types/infrastructure/api.types.ts` | interface נתוני שאלה |
| `GameData` | `shared/types/infrastructure/api.types.ts` | interface נתוני משחק |
| `AdminUserData` | `shared/types/infrastructure/api.types.ts` | interface נתוני משתמש אדמין |
| `UsersListResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת רשימת משתמשים |
| `AdminUsersListResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת רשימת משתמשים אדמין |
| `UpdateUserFieldResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת עדכון שדה משתמש |
| `RefreshTokenResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת רענון טוקן |
| `MiddlewareMetricsSummary` | `shared/types/infrastructure/api.types.ts` | interface סיכום מטריקות middleware |
| `AllMetricsResponse` | `shared/types/infrastructure/api.types.ts` | interface תגובת כל המטריקות |
| `MetricsResponse` | `shared/types/infrastructure/api.types.ts` | type תגובת מטריקות |

#### Infrastructure Auth Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `AuthenticationResult` | `shared/types/infrastructure/auth.types.ts` | interface תוצאת אימות |
| `LoginCredentials` | `shared/types/infrastructure/auth.types.ts` | interface פרטי התחברות |
| `AuthCredentials` | `shared/types/infrastructure/auth.types.ts` | interface פרטי אימות |
| `UserData` | `shared/types/infrastructure/auth.types.ts` | interface נתוני משתמש |
| `TokenPayload` | `shared/types/infrastructure/auth.types.ts` | interface payload token |
| `TokenPair` | `shared/types/infrastructure/auth.types.ts` | interface זוג tokens |
| `TokenValidationResult` | `shared/types/infrastructure/auth.types.ts` | interface תוצאת ולידציית token |
| `AuthenticationRequest` | `shared/types/infrastructure/auth.types.ts` | interface בקשת אימות |
| `AuthRequest` | `shared/types/infrastructure/auth.types.ts` | interface בקשת auth |
| `GoogleAuthPayload` | `shared/types/infrastructure/auth.types.ts` | interface payload אימות Google |
| `GoogleAuthRequest` | `shared/types/infrastructure/auth.types.ts` | interface בקשת אימות Google |
| `JWTDecodedToken` | `shared/types/infrastructure/auth.types.ts` | interface token JWT מפוענח |

#### Infrastructure Config Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `DatabaseConfigType` | `shared/types/infrastructure/config.types.ts` | interface סוג הגדרות מסד נתונים |
| `JwtConfig` | `shared/types/infrastructure/config.types.ts` | interface הגדרות JWT |
| `PayPalConfig` | `shared/types/infrastructure/config.types.ts` | interface הגדרות PayPal |
| `ViteProxyConfig` | `shared/types/infrastructure/config.types.ts` | interface הגדרות proxy Vite |
| `AppConfigInterface` | `shared/types/infrastructure/config.types.ts` | interface הגדרות אפליקציה |

#### Infrastructure Storage Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `StorageService` | `shared/types/infrastructure/storage.types.ts` | interface שירות אחסון |
| `StorageConfig` | `shared/types/infrastructure/storage.types.ts` | interface הגדרות אחסון |
| `StorageOperationResult<T>` | `shared/types/infrastructure/storage.types.ts` | interface תוצאת פעולת אחסון |
| `StorageStatsResult` | `shared/types/infrastructure/storage.types.ts` | interface תוצאת סטטיסטיקות אחסון |
| `StorageItemMetadata` | `shared/types/infrastructure/storage.types.ts` | interface מטא-דאטה פריט אחסון |
| `CacheEntry` | `shared/types/infrastructure/storage.types.ts` | type רשומת cache |
| `StorageStatsItem` | `shared/types/infrastructure/storage.types.ts` | interface פריט סטטיסטיקות אחסון |
| `StorageStats` | `shared/types/infrastructure/storage.types.ts` | interface סטטיסטיקות אחסון |
| `StorageCleanupOptions` | `shared/types/infrastructure/storage.types.ts` | interface אפשרויות ניקוי אחסון |
| `StorageMigrationOptions` | `shared/types/infrastructure/storage.types.ts` | interface אפשרויות מיגרציית אחסון |
| `StorageSyncOptions` | `shared/types/infrastructure/storage.types.ts` | interface אפשרויות סנכרון אחסון |
| `StorageSyncProgress` | `shared/types/infrastructure/storage.types.ts` | interface התקדמות סנכרון אחסון |
| `StorageSyncResult` | `shared/types/infrastructure/storage.types.ts` | interface תוצאת סנכרון אחסון |
| `StorageMetrics` | `shared/types/infrastructure/storage.types.ts` | interface מטריקות אחסון |

#### Infrastructure Logging Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `LogEntry` | `shared/types/infrastructure/logging.types.ts` | interface רשומת לוג |
| `HttpLogData` | `shared/types/infrastructure/logging.types.ts` | interface נתוני לוג HTTP |
| `LogContext` | `shared/types/infrastructure/logging.types.ts` | type הקשר לוג |
| `BaseLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר בסיסי |
| `TraceStorage` | `shared/types/infrastructure/logging.types.ts` | interface אחסון trace |
| `UserLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר משתמש |
| `DatabaseLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר מסד נתונים |
| `ApiLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר API |
| `PerformanceLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר ביצועים |
| `CacheLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר cache |
| `StorageLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר אחסון |
| `PaymentLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר תשלום |
| `SecurityLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר אבטחה |
| `ValidationLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר ולידציה |
| `SystemLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר מערכת |
| `AnalyticsLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר אנליטיקה |
| `ProviderLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר ספק |
| `AuthLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר אימות |
| `LanguageToolLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר כלי שפה |
| `NavigationLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר ניווט |
| `GameLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר משחק |
| `MediaLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר מדיה |
| `EnhancedLogger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר משופר |
| `Logger` | `shared/types/infrastructure/logging.types.ts` | interface לוגר |
| `LogUserIds` | `shared/types/infrastructure/logging.types.ts` | interface ID משתמשים לוג |
| `LogUserName` | `shared/types/infrastructure/logging.types.ts` | interface שם משתמש לוג |
| `LogUserEmails` | `shared/types/infrastructure/logging.types.ts` | interface אימיילים משתמש לוג |
| `LogErrorInfo` | `shared/types/infrastructure/logging.types.ts` | interface מידע שגיאה לוג |
| `LogHttpStatus` | `shared/types/infrastructure/logging.types.ts` | interface סטטוס HTTP לוג |
| `LogRequestCounts` | `shared/types/infrastructure/logging.types.ts` | interface ספירת בקשות לוג |
| `LogMeta` | `shared/types/infrastructure/logging.types.ts` | interface מטא-דאטה לוג |
| `LoggerConfig` | `shared/types/infrastructure/logging.types.ts` | interface הגדרות לוגר |
| `LoggerConfigUpdate` | `shared/types/infrastructure/logging.types.ts` | interface עדכון הגדרות לוגר |
| `LogMessageFn` | `shared/types/infrastructure/logging.types.ts` | type function הודעת לוג |
| `LogAuthEnhancedFn` | `shared/types/infrastructure/logging.types.ts` | type function לוג אימות משופר |
| `LogSecurityEnhancedFn` | `shared/types/infrastructure/logging.types.ts` | type function לוג אבטחה משופר |
| `LogComponentErrorFn` | `shared/types/infrastructure/logging.types.ts` | type function שגיאת רכיב לוג |
| `LogPaymentErrorFn` | `shared/types/infrastructure/logging.types.ts` | type function שגיאת תשלום לוג |
| `LogProviderErrorFn` | `shared/types/infrastructure/logging.types.ts` | type function שגיאת ספק לוג |
| `LogProviderFn` | `shared/types/infrastructure/logging.types.ts` | type function ספק לוג |
| `LogResourceErrorFn` | `shared/types/infrastructure/logging.types.ts` | type function שגיאת משאב לוג |

#### Infrastructure Retry Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `JitterOptions` | `shared/types/infrastructure/retry.types.ts` | interface אפשרויות jitter |
| `RetryOptions` | `shared/types/infrastructure/retry.types.ts` | interface אפשרויות ניסיון חוזר |
| `RetryConfig` | `shared/types/infrastructure/retry.types.ts` | interface הגדרות ניסיון חוזר |
| `RetryResponse<T>` | `shared/types/infrastructure/retry.types.ts` | interface תגובת ניסיון חוזר |

#### Infrastructure Redis Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `RedisConfig` | `shared/types/infrastructure/redis.types.ts` | interface הגדרות Redis |
| `RedisStats` | `shared/types/infrastructure/redis.types.ts` | interface סטטיסטיקות Redis |

#### Infrastructure Storage Types (Shared)
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `StorageService` (interface) | `shared/types/infrastructure/storage.types.ts` | interface שירות אחסון |

### Shared Types (Domain - Additional)

#### Payment Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `PaymentMetadata` | `shared/types/domain/payment.types.ts` | interface מטא-דאטה תשלום |
| `ManualPaymentDetails` | `shared/types/domain/payment.types.ts` | interface פרטי תשלום ידני |
| `PayPalOrderRequest` | `shared/types/domain/payment.types.ts` | interface בקשת הזמנה PayPal |
| `PaymentData` | `shared/types/domain/payment.types.ts` | interface נתוני תשלום |
| `PaymentResult` | `shared/types/domain/payment.types.ts` | interface תוצאת תשלום |

#### Credits Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `CreditBalance` | `shared/types/domain/credits.types.ts` | interface יתרת נקודות |
| `CreditPurchaseOption` | `shared/types/domain/credits.types.ts` | interface אפשרות רכישת נקודות |
| `CreditTransaction` | `shared/types/domain/credits.types.ts` | interface עסקת נקודות |
| `CanPlayResponse` | `shared/types/domain/credits.types.ts` | interface תגובת יכולת משחק |
| `CreditsPurchaseRequest` | `shared/types/domain/credits.types.ts` | interface בקשת רכישת נקודות |

#### AI Provider Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `ProviderDetails` | `shared/types/domain/ai/aiProvider.types.ts` | interface פרטי ספק |
| `AiProviderStats` | `shared/types/domain/ai/aiProvider.types.ts` | interface סטטיסטיקות ספק AI |
| `AiProviderHealth` | `shared/types/domain/ai/aiProvider.types.ts` | interface בריאות ספק AI |

#### Validation Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `Position` | `shared/types/domain/validation.types.ts` | interface מיקום |
| `BaseValidationResult` | `shared/types/domain/validation.types.ts` | interface תוצאת ולידציה בסיסית |
| `PasswordValidationResult` | `shared/types/domain/validation.types.ts` | interface תוצאת ולידציית סיסמה |
| `ValidationResult` | `shared/types/domain/validation.types.ts` | interface תוצאת ולידציה |
| `ValidationOptions` | `shared/types/domain/validation.types.ts` | interface אפשרויות ולידציה |
| `CustomDifficultyRequest` | `shared/types/domain/validation.types.ts` | interface בקשת קושי מותאם |
| `LanguageToolError` | `shared/types/domain/validation.types.ts` | interface שגיאת כלי שפה |
| `LanguageToolResponse` | `shared/types/domain/validation.types.ts` | interface תגובת כלי שפה |
| `LanguageValidationOptions` | `shared/types/domain/validation.types.ts` | interface אפשרויות ולידציית שפה |
| `LanguageValidationResult` | `shared/types/domain/validation.types.ts` | interface תוצאת ולידציית שפה |

### Client Types

#### Domain Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `CurrentGameStats` | `client/src/types/domain/analytics/analytics.types.ts` | interface סטטיסטיקות משחק נוכחי |
| `ClientGameData` | `client/src/types/domain/game/game.types.ts` | interface נתוני משחק לקוח |
| `CustomSettings` | `client/src/types/domain/game/game.types.ts` | interface הגדרות מותאמות |
| `GameModeState` | `client/src/types/domain/game/game.types.ts` | interface מצב מצב משחק |
| `ClientGameState` | `client/src/types/domain/game/game.types.ts` | interface מצב משחק לקוח |
| `ClientGameSessionStats` | `client/src/types/domain/game/game.types.ts` | interface סטטיסטיקות סשן משחק לקוח |
| `GameModeOption` | `client/src/types/domain/game/game.types.ts` | interface אפשרות מצב משחק |
| `GameSummaryState` | `client/src/types/domain/game/game.types.ts` | interface מצב סיכום משחק |
| `GameKey` | `client/src/types/domain/game/game.types.ts` | interface מפתח משחק |
| `GameSummaryStats` | `client/src/types/domain/game/game.types.ts` | interface סטטיסטיקות סיכום משחק |
| `DeductCreditsParams` | `client/src/types/domain/game/game.types.ts` | interface פרמטרי ניכוי נקודות |
| `GameSettingsFormProps` | `client/src/types/domain/game/game.types.ts` | interface props טופס הגדרות משחק |
| `UserLoginRequest` | `client/src/types/domain/user/user.types.ts` | interface בקשת התחברות |
| `UserRegisterRequest` | `client/src/types/domain/user/user.types.ts` | interface בקשת הרשמה |

#### Infrastructure Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `AuthResponse` | `client/src/types/infrastructure/api.types.ts` | interface תגובת אימות |
| `AuthState` | `client/src/types/infrastructure/api.types.ts` | interface מצב אימות |
| `CreditsPurchaseResponse` | `client/src/types/infrastructure/api.types.ts` | interface תגובת רכישת נקודות |
| `ModalRouteState` | `client/src/types/infrastructure/modal.types.ts` | interface מצב נתיב modal |
| `ModalRouteProps` | `client/src/types/infrastructure/modal.types.ts` | interface props נתיב modal |
| `UseModalRouteReturn` | `client/src/types/infrastructure/modal.types.ts` | interface החזרת hook נתיב modal |
| `NavigationLink` | `client/src/types/infrastructure/navigation.types.ts` | interface קישור ניווט |
| `NavigationLinks` | `client/src/types/infrastructure/navigation.types.ts` | interface קישורי ניווט |
| `NavigationMenuLink` | `client/src/types/infrastructure/navigation.types.ts` | interface קישור תפריט ניווט |
| `NavigationUserDisplay` | `client/src/types/infrastructure/navigation.types.ts` | interface תצוגת משתמש ניווט |
| `NavUserActions` | `client/src/types/infrastructure/navigation.types.ts` | interface פעולות משתמש ניווט |
| `NavigationBrandProps` | `client/src/types/infrastructure/navigation.types.ts` | interface props מותג ניווט |
| `NavigationMenuProps` | `client/src/types/infrastructure/navigation.types.ts` | interface props תפריט ניווט |
| `NavigationActionsProps` | `client/src/types/infrastructure/navigation.types.ts` | interface props פעולות ניווט |
| `NavigationCreditsState` | `client/src/types/infrastructure/navigation.types.ts` | interface מצב נקודות ניווט |
| `NavLinkProps` | `client/src/types/infrastructure/navigation.types.ts` | interface props קישור ניווט |
| `RouteState` | `client/src/types/infrastructure/route.types.ts` | interface מצב נתיב |
| `ConfigTypes` | `client/src/types/infrastructure/config.types.ts` | interface סוגי הגדרות |
| `InterceptorsConfig` | `client/src/types/infrastructure/interceptors.types.ts` | interface הגדרות interceptors |
| `LoggerConfig` | `client/src/types/infrastructure/logger.types.ts` | interface הגדרות לוגר |
| `ModalConfig` | `client/src/types/infrastructure/modal.types.ts` | interface הגדרות modal |

#### UI Types
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `BaseComponentProps` | `client/src/types/core/ui-base.types.ts` | interface props רכיב בסיסי |
| `FeatureHighlightItem` | `client/src/types/core/ui-base.types.ts` | interface פריט הדגשת תכונה |
| `ErrorBoundaryProps` | `client/src/types/core/ui-base.types.ts` | interface props גבול שגיאות |
| `ErrorBoundaryState` | `client/src/types/core/ui-base.types.ts` | interface מצב גבול שגיאות |
| `FeatureErrorBoundaryProps` | `client/src/types/core/ui-base.types.ts` | interface props גבול שגיאות תכונה |
| `ErrorState` | `client/src/types/core/ui-base.types.ts` | interface מצב שגיאה |
| `AudioData` | `client/src/types/ui/audio.types.ts` | interface נתוני אודיו |
| `AudioControlsProps` | `client/src/types/ui/audio.types.ts` | interface props בקרות אודיו |
| `IconProps` | `client/src/types/ui/icon.types.ts` | interface props אייקון |
| `IconAnimation` | `client/src/types/ui/icon.types.ts` | interface אנימציית אייקון |
| `BackgroundAnimationProps` | `client/src/types/ui/backgroundAnimation.types.ts` | interface props אנימציית רקע |
| `PieChartDataPoint` | `client/src/types/ui/charts.types.ts` | interface נקודת נתונים גרף עוגה |
| `PieChartProps` | `client/src/types/ui/charts.types.ts` | interface props גרף עוגה |
| `TrendChartProps` | `client/src/types/ui/charts.types.ts` | interface props גרף מגמה |
| `DistributionDataPoint` | `client/src/types/ui/charts.types.ts` | interface נקודת נתונים התפלגות |
| `DistributionChartProps` | `client/src/types/ui/charts.types.ts` | interface props גרף התפלגות |
| `ChartCardProps` | `client/src/types/ui/charts.types.ts` | interface props כרטיס גרף |
| `LeaderboardEntry` | `client/src/types/ui/leaderboard.types.ts` | interface רשומה בטבלת לוחות |
| `SocialShareProps` | `client/src/types/ui/social.types.ts` | interface props שיתוף חברתי |
| `StatCardProps` | `client/src/types/ui/stats.types.ts` | interface props כרטיס סטטיסטיקה |
| `DifficultyBarProps` | `client/src/types/ui/stats.types.ts` | interface props גרף עמודות קושי |
| `TopicBarProps` | `client/src/types/ui/stats.types.ts` | interface props גרף עמודות נושא |
| `ComponentsTypes` | `client/src/types/ui/components.types.ts` | interface סוגי רכיבים |
| `FormFieldTypes` | `client/src/types/ui/forms.types.ts` | interface סוגי שדות טופס |
| `PayPalButtonInstance` | `client/src/types/domain/payment/components.types.ts` | interface instance כפתור PayPal |
| `PaymentDialogProps` | `client/src/types/domain/payment/components.types.ts` | interface props דיאלוג תשלום |
| `ClearOperation` | `client/src/types/domain/admin/components.types.ts` | interface פעולת ניקוי |
| `AdminTriviaQuestion` | `client/src/types/domain/admin/components.types.ts` | interface שאלת טריוויה אדמין |
| `TriviaQuestionsResponse` | `client/src/types/domain/admin/components.types.ts` | interface תגובת שאלות טריוויה |
| `CurrentGameStats` | `client/src/types/domain/game/game.types.ts` | interface סטטיסטיקות משחק נוכחי |

#### Core Types (Client)
| שם Interface/Type | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `ValidationHookOptions` | `client/src/types/core/validation.types.ts` | interface אפשרויות hook ולידציה |
| `CreditBalancePayload` | `client/src/types/core/redux.types.ts` | interface payload יתרת נקודות |
| `ScoreUpdatePayload` | `client/src/types/core/redux.types.ts` | interface payload עדכון ניקוד |
| `RootState` | `client/src/types/core/redux.types.ts` | interface root state |
| `HooksTypes` | `client/src/types/core/hooks.types.ts` | interface סוגי hooks |

---

## Validation Functions (Shared)

### Core Validation
| שם Function | מיקום קובץ | תיאור |
|------------|------------|-------|
| `validateEmail` | `shared/validation/core/email.validation.ts` | ולידציית אימייל |
| `validatePassword` | `shared/validation/core/password.validation.ts` | ולידציית סיסמה |
| `validateTopicLength` | `shared/validation/core/topic.validation.ts` | ולידציית אורך נושא |
| `isUuid` | `shared/validation/core/id.validation.ts` | בדיקת type guard ל-UUID |
| `isRoomId` | `shared/validation/core/id.validation.ts` | בדיקת type guard ל-room ID |
| `isGeneratedUserId` | `shared/validation/core/generatedId.validation.ts` | בדיקת type guard ל-generated user ID |
| `isGeneratedPaymentIntentId` | `shared/validation/core/generatedId.validation.ts` | בדיקת type guard ל-generated payment intent ID |
| `isGeneratedInterceptorId` | `shared/validation/core/generatedId.validation.ts` | בדיקת type guard ל-generated interceptor ID |
| `performLocalLanguageValidation` | `shared/validation/core/language.validation.ts` | ולידציית שפה מקומית |
| `performLocalLanguageValidationAsync` | `shared/validation/core/language.validation.ts` | ולידציית שפה מקומית אסינכרונית |

### Domain Validation
| שם Function | מיקום קובץ | תיאור |
|------------|------------|-------|
| `validateTriviaRequest` | `shared/validation/domain/trivia.validation.ts` | ולידציית בקשת טריוויה |
| `validateTriviaInputQuick` | `shared/validation/domain/trivia.validation.ts` | ולידציית קלט טריוויה מהירה |
| `toDifficultyLevel` | `shared/validation/domain/difficulty.validation.ts` | המרה לרמת קושי |
| `restoreGameDifficulty` | `shared/validation/domain/difficulty.validation.ts` | שחזור קושי משחק |
| `isCustomDifficulty` | `shared/validation/domain/difficulty.validation.ts` | בדיקת type guard לקושי מותאם |
| `isRegisteredDifficulty` | `shared/validation/domain/difficulty.validation.ts` | בדיקת type guard לקושי רשום |
| `isValidDifficulty` | `shared/validation/domain/difficulty.validation.ts` | בדיקת תקינות קושי |
| `isGameDifficulty` | `shared/validation/domain/difficulty.validation.ts` | בדיקת type guard לקושי משחק |
| `extractCustomDifficultyText` | `shared/validation/domain/difficulty.validation.ts` | חילוץ טקסט קושי מותאם |
| `createCustomDifficulty` | `shared/validation/domain/difficulty.validation.ts` | יצירת קושי מותאם |
| `getDifficultyDisplayText` | `shared/validation/domain/difficulty.validation.ts` | קבלת טקסט תצוגת קושי |
| `validateCustomDifficultyText` | `shared/validation/domain/difficulty.validation.ts` | ולידציית טקסט קושי מותאם |
| `isValidCardNumber` | `shared/validation/domain/payment.validation.ts` | בדיקת תקינות מספר כרטיס |
| `isTimePeriod` | `shared/validation/domain/constants.validation.ts` | בדיקת type guard לתקופת זמן |
| `isPaymentMethod` | `shared/validation/domain/constants.validation.ts` | בדיקת type guard לשיטת תשלום |
| `isLeaderboardPeriod` | `shared/validation/domain/constants.validation.ts` | בדיקת type guard לתקופת טבלת לוחות |

---

## Functions

### Shared Utils

#### Domain Utils
| שם Function | מיקום קובץ | תיאור |
|------------|------------|-------|
| `normalizeGameData` | `shared/utils/domain/game.utils.ts` | נירמול נתוני משחק |
| `toSavedGameConfiguration` | `shared/utils/domain/game.utils.ts` | המרה להגדרות שמורות |
| `checkAnswerCorrectness` | `shared/utils/domain/answer.utils.ts` | בדיקת נכונות תשובה |
| `createAnswerResult` | `shared/utils/domain/answer.utils.ts` | יצירת תוצאות תשובה |
| `createQuestionData` | `shared/utils/domain/question.utils.ts` | יצירת נתוני שאלה |
| `calculateAnswerScore` | `shared/utils/domain/score.utils.ts` | חישוב ניקוד תשובה |
| `calculateTimeLimitedCredits` | `shared/utils/domain/credits.utils.ts` | חישוב נקודות מוגבלות זמן |
| `calculateRequiredCredits` | `shared/utils/domain/credits.utils.ts` | חישוב נקודות נדרשות |
| `shouldChargeAfterGame` | `shared/utils/domain/credits.utils.ts` | בדיקה אם לחייב אחרי משחק |
| `isHostPaysOnly` | `shared/utils/domain/credits.utils.ts` | בדיקה אם רק מארח משלם |
| `calculateNewBalance` | `shared/utils/domain/credits.utils.ts` | חישוב יתרה חדשה |
| `mergeUserPreferences` | `shared/utils/domain/user.utils.ts` | מיזוג העדפות משתמש |
| `validateGameMode` | `shared/utils/domain/gameMode.utils.ts` | ולידציית מצב משחק |
| `normalizeGameMode` | `shared/utils/domain/gameMode.utils.ts` | נירמול מצב משחק |
| `detectCardBrand` | `shared/utils/domain/payment.utils.ts` | זיהוי סוג כרטיס |
| `extractLastFourDigits` | `shared/utils/domain/payment.utils.ts` | חילוץ 4 ספרות אחרונות |
| `isPlayer` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לשחקן |
| `isRoomConfig` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard להגדרת חדר |
| `isMultiplayerRoom` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לחדר |
| `isCreateRoomResponse` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לתגובת יצירת חדר |
| `isRoomStateResponse` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לתגובת מצב חדר |
| `isGameState` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard למצב משחק |
| `isPlayerJoinedEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע שחקן הצטרף |
| `isPlayerLeftEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע שחקן עזב |
| `isGameStartedEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע משחק התחיל |
| `isQuestionStartedEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע שאלה התחילה |
| `isAnswerReceivedEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע תשובה התקבלה |
| `isQuestionEndedEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע שאלה הסתיימה |
| `isGameEndedEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע משחק הסתיים |
| `isLeaderboardUpdateEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע עדכון טבלת לוחות |
| `isRoomUpdatedEvent` | `shared/utils/domain/multiplayerGuards.ts` | בדיקת type guard לאירוע חדר עודכן |
| `createArrayGuard` | `shared/utils/domain/entityGuards.ts` | יצירת type guard למערך |
| `createNullableGuard` | `shared/utils/domain/entityGuards.ts` | יצירת type guard ל-nullable |
| `createLeaderboardEntryGuard` | `shared/utils/domain/entityGuards.ts` | יצירת type guard לרשומת טבלת לוחות |
| `isCreditBalanceCacheEntry` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לרשומת cache יתרה |
| `isCreditPurchaseOption` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לאפשרות רכישת נקודות |
| `isCreditPurchaseOptionArray` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard למערך אפשרויות רכישה |
| `isTopicAnalyticsRecordArray` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard למערך רשומות אנליטיקה נושא |
| `isTriviaQuestionArray` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard למערך שאלות טריוויה |
| `isDifficultyStatsRecord` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לרשומת סטטיסטיקות קושי |
| `isBusinessMetricsData` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לנתוני מטריקות עסקיות |
| `isCompleteUserAnalyticsData` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לנתוני אנליטיקה משתמש מלאים |
| `isUserSearchCacheEntry` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לרשומת cache חיפוש משתמש |
| `isAuditLogEntry` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לרשומת audit log |
| `isSavedGameConfiguration` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard להגדרות משחק שמורות |
| `isUserProgressData` | `shared/utils/domain/entityGuards.ts` | בדיקת type guard לנתוני התקדמות משתמש |

#### Core Utils
| שם Function | מיקום קובץ | תיאור |
|------------|------------|-------|
| `formatCurrency` | `shared/utils/core/format.utils.ts` | עיצוב מטבע |
| `calculatePricePerCredit` | `shared/utils/core/format.utils.ts` | חישוב מחיר לנקודה |
| `formatForDisplay` | `shared/utils/core/format.utils.ts` | עיצוב לתצוגה |
| `getCurrentTimestampInSeconds` | `shared/utils/core/number.utils.ts` | קבלת timestamp בשניות |
| `calculateElapsedSeconds` | `shared/utils/core/number.utils.ts` | חישוב שניות שחלפו |
| `calculateDuration` | `shared/utils/core/number.utils.ts` | חישוב משך זמן |
| `calculateRetryDelay` | `shared/utils/core/retry.utils.ts` | חישוב השהיה לניסיון חוזר |
| `calculateCurrentPage` | `shared/utils/core/pagination.utils.ts` | חישוב עמוד נוכחי |
| `calculateTotalPages` | `shared/utils/core/pagination.utils.ts` | חישוב סך עמודים |
| `calculateHasMore` | `shared/utils/core/pagination.utils.ts` | חישוב האם יש עוד |
| `calculateHasNext` | `shared/utils/core/pagination.utils.ts` | חישוב האם יש הבא |
| `calculateHasPrev` | `shared/utils/core/pagination.utils.ts` | חישוב האם יש קודם |
| `getErrorMessage` | `shared/utils/core/error.utils.ts` | קבלת הודעת שגיאה |
| `getErrorStack` | `shared/utils/core/error.utils.ts` | קבלת stack trace שגיאה |
| `getErrorType` | `shared/utils/core/error.utils.ts` | קבלת סוג שגיאה |
| `ensureErrorObject` | `shared/utils/core/error.utils.ts` | וידוא אובייקט שגיאה |
| `extractValidationErrors` | `shared/utils/core/error.utils.ts` | חילוץ שגיאות ולידציה |
| `isProviderAuthError` | `shared/utils/core/error.utils.ts` | בדיקת type guard לשגיאת אימות ספק |
| `isProviderRateLimitError` | `shared/utils/core/error.utils.ts` | בדיקת type guard לשגיאת rate limit ספק |
| `isProviderErrorWithStatusCode` | `shared/utils/core/error.utils.ts` | בדיקת type guard לשגיאת ספק עם קוד סטטוס |
| `isRecord` | `shared/utils/core/data.utils.ts` | בדיקת type guard ל-record |
| `hasProperty` | `shared/utils/core/data.utils.ts` | בדיקה אם יש property |
| `hasPropertyOfType` | `shared/utils/core/data.utils.ts` | בדיקה אם יש property מסוג מסוים |
| `isStringArray` | `shared/utils/core/data.utils.ts` | בדיקת type guard למערך מחרוזות |
| `isNonEmptyString` | `shared/utils/core/data.utils.ts` | בדיקת type guard למחרוזת לא ריקה |
| `isOneOf` | `shared/utils/core/data.utils.ts` | בדיקת type guard לערך מתוך רשימה |
| `normalizeStringArray` | `shared/utils/core/data.utils.ts` | נירמול מערך מחרוזות |
| `calculatePercentage` | `shared/utils/core/data.utils.ts` | חישוב אחוז |
| `groupBy` | `shared/utils/core/data.utils.ts` | קיבוץ לפי מפתח |
| `buildCountRecord` | `shared/utils/core/data.utils.ts` | בניית רשומת ספירה |
| `shuffle` | `shared/utils/core/data.utils.ts` | ערבוב מערך |

#### Infrastructure Utils
| שם Function | מיקום קובץ | תיאור |
|------------|------------|-------|
| `generateId` | `shared/utils/infrastructure/id.utils.ts` | יצירת ID |
| `generateTraceId` | `shared/utils/infrastructure/id.utils.ts` | יצירת trace ID |
| `generateSessionId` | `shared/utils/infrastructure/id.utils.ts` | יצירת session ID |
| `generateUserId` | `shared/utils/infrastructure/id.utils.ts` | יצירת user ID |
| `generatePaymentIntentId` | `shared/utils/infrastructure/id.utils.ts` | יצירת payment intent ID |
| `generateInterceptorId` | `shared/utils/infrastructure/id.utils.ts` | יצירת interceptor ID |
| `sanitizeInput` | `shared/utils/infrastructure/sanitization.utils.ts` | סניטציה של קלט |
| `sanitizeLogMessage` | `shared/utils/infrastructure/sanitization.utils.ts` | סניטציה של הודעת לוג |
| `sanitizeEmail` | `shared/utils/infrastructure/sanitization.utils.ts` | סניטציה של אימייל |
| `sanitizeCardNumber` | `shared/utils/infrastructure/sanitization.utils.ts` | סניטציה של מספר כרטיס |
| `normalizeText` | `shared/utils/infrastructure/sanitization.utils.ts` | נירמול טקסט |
| `parseErrorResponseData` | `shared/utils/infrastructure/errorParsing.utils.ts` | פענוח נתוני תגובת שגיאה |
| `parseErrorResponse` | `shared/utils/infrastructure/errorParsing.utils.ts` | פענוח תגובת שגיאה |
| `parseValidationErrorResponse` | `shared/utils/infrastructure/errorParsing.utils.ts` | פענוח תגובת שגיאת ולידציה |
| `isValidationErrorResponse` | `shared/utils/infrastructure/errorParsing.utils.ts` | בדיקת type guard לתגובת שגיאת ולידציה |
| `createTimedResult` | `shared/utils/infrastructure/storage.utils.ts` | יצירת תוצאה עם זמן |

### Client Utils
| שם Function | מיקום קובץ | תיאור |
|------------|------------|-------|
| `formatTime` | `client/src/utils/core/format.utils.ts` | עיצוב זמן |
| `formatTimeDisplay` | `client/src/utils/core/format.utils.ts` | עיצוב תצוגת זמן |
| `formatDate` | `client/src/utils/core/format.utils.ts` | עיצוב תאריך |
| `formatDuration` | `client/src/utils/core/format.utils.ts` | עיצוב משך זמן |
| `cn` | `client/src/utils/core/cn.utils.ts` | שילוב class names (clsx) |
| `isValidAvatarId` | `client/src/utils/domain/avatar.utils.ts` | בדיקת תקינות ID אווטר |
| `getAvatarUrl` | `client/src/utils/domain/avatar.utils.ts` | קבלת URL אווטר |
| `isModalRouteState` | `client/src/utils/infrastructure/routing.utils.ts` | בדיקת type guard למצב נתיב modal |
| `isGameSummaryNavigationState` | `client/src/utils/infrastructure/routing.utils.ts` | בדיקת type guard למצב ניווט סיכום משחק |

### Server Utils
| שם Function | מיקום קובץ | תיאור |
|------------|------------|-------|
| `calculateStreak` | `server/src/common/utils/gameStats.utils.ts` | חישוב רצף |
| `calculateSuccessRate` | `server/src/common/utils/gameStats.utils.ts` | חישוב אחוז הצלחה |
| `calculateCategoryStats` | `server/src/common/utils/gameStats.utils.ts` | חישוב סטטיסטיקות קטגוריה |
| `calculateCategoryPerformance` | `server/src/common/utils/gameStats.utils.ts` | חישוב ביצועי קטגוריה |
| `addSearchConditions` | `server/src/common/queries/search.query.ts` | הוספת תנאי חיפוש |
| `addDateRangeConditions` | `server/src/common/queries/dateRange.query.ts` | הוספת תנאי טווח תאריכים |
| `createGroupByQuery` | `server/src/common/queries/groupBy.query.ts` | יצירת שאילתת GROUP BY |
| `createValidationError` | `server/src/internal/utils/error.utils.ts` | יצירת שגיאת ולידציה |
| `createStringLengthValidationError` | `server/src/internal/utils/error.utils.ts` | יצירת שגיאת ולידציית אורך מחרוזת |
| `createNotFoundError` | `server/src/internal/utils/error.utils.ts` | יצירת שגיאת לא נמצא |
| `createStorageError` | `server/src/internal/utils/error.utils.ts` | יצירת שגיאת אחסון |
| `createServerError` | `server/src/internal/utils/error.utils.ts` | יצירת שגיאת שרת |
| `createCacheError` | `server/src/internal/utils/error.utils.ts` | יצירת שגיאת cache |
| `createAuthError` | `server/src/internal/utils/error.utils.ts` | יצירת שגיאת אימות |
| `isPublicEndpoint` | `server/src/internal/utils/guards.utils.ts` | בדיקה אם endpoint ציבורי |
| `isErrorWithProperties` | `server/src/internal/utils/guards.utils.ts` | בדיקת type guard לשגיאה עם properties |
| `isGameSessionState` | `server/src/internal/utils/guards.utils.ts` | בדיקת type guard למצב סשן משחק |
| `isValidGameDifficulty` | `server/src/internal/utils/guards.utils.ts` | בדיקת type guard לקושי משחק תקין |
| `isLeaderboardEntityOrNull` | `server/src/internal/utils/guards.utils.ts` | בדיקת type guard ל-Entity טבלת לוחות או null |
| `isLeaderboardEntityArray` | `server/src/internal/utils/guards.utils.ts` | בדיקת type guard למערך Entities טבלת לוחות |
| `isLeaderboardStats` | `server/src/internal/utils/guards.utils.ts` | בדיקת type guard לסטטיסטיקות טבלת לוחות |
| `validateTriviaQuestion` | `server/src/internal/validation/domain/trivia.validation.ts` | ולידציית שאלת טריוויה |
| `validateName` | `server/src/internal/validation/core/name.validation.ts` | ולידציית שם |
| `createRedisKey` | `server/src/internal/utils/redis.utils.ts` | יצירת מפתח Redis |
| `deleteKeysByPattern` | `server/src/internal/utils/redis.utils.ts` | מחיקת מפתחות לפי דפוס |
| `scanKeys` | `server/src/internal/utils/redis.utils.ts` | סריקת מפתחות |

### Provider Functions (Server)
| שם Function/Constant | מיקום קובץ | סוג | תיאור |
|---------------------|------------|-----|-------|
| `generateTriviaQuestion` | `server/src/features/game/logic/providers/prompts/prompts.ts` | function | יצירת שאלת טריוויה |
| `SYSTEM_PROMPT` | `server/src/features/game/logic/providers/prompts/prompts.ts` | const string | system prompt ליצירת שאלות |

---

## Constants & Enums

### Shared Constants

#### Core Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `API_ENDPOINTS` | `shared/constants/core/api.constants.ts` | const object | נקודות קצה API |
| `API_VERSION` | `shared/constants/core/api.constants.ts` | const string | גרסת API |
| `PAGINATION_DEFAULTS` | `shared/constants/core/api.constants.ts` | const object | ברירות מחדל pagination |
| `RATE_LIMIT_DEFAULTS` | `shared/constants/core/api.constants.ts` | const object | ברירות מחדל הגבלת קצב |
| `COOKIE_NAMES` | `shared/constants/core/api.constants.ts` | const object | שמות cookies |
| `QUERY_PARAMS` | `shared/constants/core/api.constants.ts` | const object | פרמטרי שאילתה |
| `APP_NAME` | `shared/constants/core/app.constants.ts` | const string | שם אפליקציה |
| `AuthenticationEvent` | `shared/constants/core/auth.constants.ts` | enum | אירועי אימות |
| `CallbackStatus` | `shared/constants/core/auth.constants.ts` | enum | סטטוסי callback |
| `OAuthErrorType` | `shared/constants/core/auth.constants.ts` | enum | סוגי שגיאת OAuth |
| `AuthProvider` | `shared/constants/core/auth.constants.ts` | enum | ספקי אימות |
| `AUTH_CONSTANTS` | `shared/constants/core/auth.constants.ts` | const object | קבועי אימות |
| `ERROR_CODES` | `shared/constants/core/error.constants.ts` | const object | קודי שגיאה |
| `ERROR_MESSAGES` | `shared/constants/core/error.constants.ts` | const object | הודעות שגיאה |
| `NEST_EXCEPTION_NAMES` | `shared/constants/core/error.constants.ts` | const array | שמות exceptions NestJS |
| `NEST_EXCEPTION_NAME_SET` | `shared/constants/core/error.constants.ts` | const Set | Set שמות exceptions NestJS |
| `MAX_NESTED_ERROR_DEPTH` | `shared/constants/core/error.constants.ts` | const number | מקסימום עומק שגיאה מקוננת |
| `HTTP_TIMEOUT_ERROR_CODES_SET` | `shared/constants/core/error.constants.ts` | const Set | Set קודי שגיאת timeout HTTP |
| `HTTP_NETWORK_ERROR_CODES_SET` | `shared/constants/core/error.constants.ts` | const Set | Set קודי שגיאת רשת HTTP |
| `VALIDATION_DEBOUNCE_DELAYS` | `shared/constants/core/validation.constants.ts` | const object | השהיות debounce ולידציה |
| `ClientValidationType` | `shared/constants/core/validation.constants.ts` | enum | סוגי ולידציה לקוח |
| `VALIDATION_LENGTH` | `shared/constants/core/validation.constants.ts` | const object | אורכי ולידציה |
| `VALIDATION_COUNT` | `shared/constants/core/validation.constants.ts` | const object | ספירות ולידציה |
| `LANGUAGE_VALIDATION_THRESHOLDS` | `shared/constants/core/validation.constants.ts` | const object | ספי ולידציית שפה |
| `LANGUAGE_TOOL_CONSTANTS` | `shared/constants/core/validation.constants.ts` | const object | קבועי כלי שפה |
| `COMMON_MISSPELLINGS` | `shared/constants/core/validation.constants.ts` | const object | שגיאות כתיב נפוצות |
| `LLM_PARSER` | `shared/constants/core/validation.constants.ts` | const object | מפענח LLM |
| `GRAMMAR_PATTERNS` | `shared/constants/core/validation.constants.ts` | const array | דפוסי דקדוק |
| `VALIDATORS` | `shared/constants/core/validation.constants.ts` | const object | ולידטורים |
| `TIME_PERIODS_MS` | `shared/constants/core/time.constants.ts` | const object | תקופות זמן במילישניות |
| `GENERATED_USER_ID_PREFIX` | `shared/constants/core/idPrefix.constants.ts` | const string | קידומת ID משתמש שנוצר |
| `GENERATED_PAYMENT_INTENT_ID_PREFIX` | `shared/constants/core/idPrefix.constants.ts` | const string | קידומת ID payment intent שנוצר |
| `GENERATED_INTERCEPTOR_ID_PREFIX` | `shared/constants/core/idPrefix.constants.ts` | const string | קידומת ID interceptor שנוצר |

#### Domain Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `DifficultyLevel` | `shared/constants/domain/game.constants.ts` | enum | רמות קושי |
| `GameMode` | `shared/constants/domain/game.constants.ts` | enum | מצבי משחק |
| `TimePeriod` | `shared/constants/domain/game.constants.ts` | enum | תקופות זמן |
| `LeaderboardPeriod` | `shared/constants/domain/game.constants.ts` | enum | תקופות טבלת לוחות |
| `PlayerType` | `shared/constants/domain/game.constants.ts` | enum | סוגי שחקנים |
| `GameStatus` | `shared/constants/domain/game.constants.ts` | enum | סטטוסי משחק |
| `TriviaQuestionSource` | `shared/constants/domain/game.constants.ts` | enum | מקורות שאלות טריוויה |
| `ProviderStatus` | `shared/constants/domain/game.constants.ts` | enum | סטטוסי ספק |
| `CUSTOM_DIFFICULTY_PREFIX` | `shared/constants/domain/game.constants.ts` | const string | קידומת קושי מותאם |
| `TIME_LIMITED_CREDITS_PER_30_SECONDS` | `shared/constants/domain/game.constants.ts` | const number | נקודות מוגבלות זמן לכל 30 שניות |
| `CREDIT_COSTS` | `shared/constants/domain/game.constants.ts` | const object | עלויות נקודות |
| `GAME_MODE_DEFAULTS` | `shared/constants/domain/game.constants.ts` | const object | ברירות מחדל מצב משחק |
| `GAME_MODES_CONFIG` | `shared/constants/domain/game.constants.ts` | const object | הגדרות מצבי משחק |
| `DEFAULT_GAME_CONFIG` | `shared/constants/domain/game.constants.ts` | const object | הגדרות משחק ברירת מחדל |
| `GAME_STATE_DEFAULTS` | `shared/constants/domain/game.constants.ts` | const object | ברירות מחדל מצב משחק |
| `BASIC_TOPICS` | `shared/constants/domain/game.constants.ts` | const array | נושאים בסיסיים |
| `GROQ_DEFAULT_MODEL` | `shared/constants/domain/game.constants.ts` | const string | מודל Groq ברירת מחדל |
| `GROQ_FREE_TIER_MODELS` | `shared/constants/domain/game.constants.ts` | const array | מודלי Groq חינמיים |
| `GROQ_MODELS` | `shared/constants/domain/game.constants.ts` | const object | מודלי Groq |
| `GROQ_DEFAULT_MODEL_CONFIG` | `shared/constants/domain/game.constants.ts` | const object | הגדרות מודל Groq ברירת מחדל |
| `GROQ_DEFAULT_REQUESTS_PER_MINUTE` | `shared/constants/domain/game.constants.ts` | const number | בקשות Groq לדקה ברירת מחדל |
| `GROQ_DEFAULT_TOKENS_PER_MINUTE` | `shared/constants/domain/game.constants.ts` | const number | טוקנים Groq לדקה ברירת מחדל |
| `GROQ_PROVIDER_NAME` | `shared/constants/domain/game.constants.ts` | const string | שם ספק Groq |
| `GROQ_API_BASE_URL` | `shared/constants/domain/game.constants.ts` | const string | כתובת בסיס API Groq |
| `GROQ_DEFAULT_TEMPERATURE` | `shared/constants/domain/game.constants.ts` | const number | טמפרטורה Groq ברירת מחדל |
| `GROQ_DEFAULT_MAX_TOKENS` | `shared/constants/domain/game.constants.ts` | const number | מקסימום טוקנים Groq ברירת מחדל |
| `GROQ_PROVIDER_MAX_TOKENS` | `shared/constants/domain/game.constants.ts` | const number | מקסימום טוקנים ספק Groq |
| `GROQ_PROVIDER_VERSION` | `shared/constants/domain/game.constants.ts` | const string | גרסת ספק Groq |
| `VALID_DIFFICULTIES` | `shared/constants/domain/game.constants.ts` | const array | קושיים תקינים |
| `VALID_DIFFICULTIES_SET` | `shared/constants/domain/game.constants.ts` | const Set | Set קושיים תקינים |
| `VALID_GAME_MODES` | `shared/constants/domain/game.constants.ts` | const array | מצבי משחק תקינים |
| `VALID_GAME_MODES_SET` | `shared/constants/domain/game.constants.ts` | const Set | Set מצבי משחק תקינים |
| `VALID_TIME_PERIODS` | `shared/constants/domain/game.constants.ts` | const array | תקופות זמן תקינות |
| `VALID_TIME_PERIODS_SET` | `shared/constants/domain/game.constants.ts` | const Set | Set תקופות זמן תקינות |
| `VALID_LEADERBOARD_PERIODS` | `shared/constants/domain/game.constants.ts` | const array | תקופות טבלת לוחות תקינות |
| `VALID_LEADERBOARD_PERIODS_SET` | `shared/constants/domain/game.constants.ts` | const Set | Set תקופות טבלת לוחות תקינות |
| `ALLOWED_TRIVIA_SOURCES` | `shared/constants/domain/game.constants.ts` | const array | מקורות טריוויה מותרים |
| `AnalyticsResult` | `shared/constants/domain/analytics.constants.ts` | enum | תוצאות אנליטיקה |
| `ComparisonTarget` | `shared/constants/domain/analytics.constants.ts` | enum | יעדי השוואה |
| `AnalyticsEnvironment` | `shared/constants/domain/analytics.constants.ts` | enum | סביבות אנליטיקה |
| `TrendPeriod` | `shared/constants/domain/analytics.constants.ts` | enum | תקופות מגמה |
| `AnalyticsEventType` | `shared/constants/domain/analytics.constants.ts` | enum | סוגי אירועי אנליטיקה |
| `AnalyticsPageName` | `shared/constants/domain/analytics.constants.ts` | enum | שמות דפי אנליטיקה |
| `AnalyticsAction` | `shared/constants/domain/analytics.constants.ts` | enum | פעולות אנליטיקה |
| `CreditTransactionType` | `shared/constants/domain/credits.constants.ts` | enum | סוגי עסקות נקודות |
| `CreditSource` | `shared/constants/domain/credits.constants.ts` | enum | מקורות נקודות |
| `PaymentStatus` | `shared/constants/domain/payment.constants.ts` | enum | סטטוסי תשלום |
| `PaymentMethod` | `shared/constants/domain/payment.constants.ts` | enum | שיטות תשלום |
| `PayPalEnvironment` | `shared/constants/domain/payment.constants.ts` | enum | סביבות PayPal |
| `PaymentClientAction` | `shared/constants/domain/payment.constants.ts` | enum | פעולות תשלום לקוח |
| `PlanType` | `shared/constants/domain/payment.constants.ts` | enum | סוגי תוכניות |
| `RequestSource` | `shared/constants/domain/payment.constants.ts` | enum | מקורות בקשה |
| `VALID_PAYMENT_METHODS` | `shared/constants/domain/payment.constants.ts` | const array | שיטות תשלום תקינות |
| `VALID_PAYMENT_METHODS_SET` | `shared/constants/domain/payment.constants.ts` | const Set | Set שיטות תשלום תקינות |
| `VALID_PLAN_TYPES` | `shared/constants/domain/payment.constants.ts` | const array | סוגי תוכניות תקינים |
| `MANUAL_CREDIT_SUPPORTED_CARD_LENGTHS` | `shared/constants/domain/payment.constants.ts` | const object | אורכי כרטיסים נתמכים תשלום ידני |
| `CREDIT_PURCHASE_PACKAGES` | `shared/constants/domain/payment.constants.ts` | const array | חבילות רכישת נקודות |
| `CREDIT_PURCHASE_PACKAGES_BY_ID` | `shared/constants/domain/payment.constants.ts` | const Map | Map חבילות רכישה לפי ID |
| `CREDIT_PURCHASE_PACKAGES_BY_CREDITS` | `shared/constants/domain/payment.constants.ts` | const Map | Map חבילות רכישה לפי נקודות |
| `PAYPAL_API_BASE_URLS` | `shared/constants/domain/payment.constants.ts` | const object | כתובות בסיס API PayPal |
| `PAYPAL_API_ENDPOINTS` | `shared/constants/domain/payment.constants.ts` | const object | נקודות קצה API PayPal |
| `PAYPAL_ORDER_STATUSES` | `shared/constants/domain/payment.constants.ts` | const object | סטטוסי הזמנה PayPal |
| `PAYPAL_WEBHOOK_EVENTS` | `shared/constants/domain/payment.constants.ts` | const object | אירועי webhook PayPal |
| `PAYPAL_RETRY_CONFIG` | `shared/constants/domain/payment.constants.ts` | const object | הגדרות ניסיון חוזר PayPal |
| `RoomStatus` | `shared/constants/domain/multiplayer.constants.ts` | enum | סטטוסי חדר |
| `PlayerStatus` | `shared/constants/domain/multiplayer.constants.ts` | enum | סטטוסי שחקן |
| `MultiplayerEvent` | `shared/constants/domain/multiplayer.constants.ts` | enum | אירועי מרובה משתמשים |
| `QuestionState` | `shared/constants/domain/multiplayer.constants.ts` | enum | מצבי שאלה |
| `LLMResponseStatus` | `shared/constants/domain/ai.constants.ts` | enum | סטטוסי תגובת LLM |
| `ProviderHealthStatus` | `shared/constants/domain/ai.constants.ts` | enum | סטטוסי בריאות ספק |
| `PROVIDER_HEALTH_STATUSES` | `shared/constants/domain/ai.constants.ts` | const array | סטטוסי בריאות ספק תקינים |
| `UserRole` | `shared/constants/domain/user.constants.ts` | enum | תפקידי משתמש |
| `UserStatus` | `shared/constants/domain/user.constants.ts` | enum | סטטוסי משתמש |
| `VALID_USER_STATUSES` | `shared/constants/domain/user.constants.ts` | const array | סטטוסי משתמש תקינים |
| `VALID_USER_STATUSES_SET` | `shared/constants/domain/user.constants.ts` | const Set | Set סטטוסי משתמש תקינים |
| `DEFAULT_USER_PREFERENCES` | `shared/constants/domain/user.constants.ts` | const object | העדפות משתמש ברירת מחדל |

#### Infrastructure Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `CACHE_KEYS` | `shared/constants/infrastructure/cacheKeys.constants.ts` | const object | מפתחות cache (מקור) |
| `SERVER_CACHE_KEYS` | `shared/constants/infrastructure/cacheKeys.constants.ts` | const object | מפתחות cache שרת (alias ל-CACHE_KEYS) |
| `CLIENT_TO_SERVER_MAP` | `shared/constants/infrastructure/cacheKeys.constants.ts` | const object | מיפוי client לשרת |
| `DEFAULT_PORTS` | `shared/constants/infrastructure/infrastructure.constants.ts` | const object | פורטים ברירת מחדל |
| `DEFAULT_URLS` | `shared/constants/infrastructure/infrastructure.constants.ts` | const object | כתובות ברירת מחדל |
| `LOCALHOST_URLS` | `shared/constants/infrastructure/localhost.constants.ts` | const object | כתובות localhost |
| `LOCALHOST_PORTS` | `shared/constants/infrastructure/localhost.constants.ts` | const object | פורטים localhost |
| `LOCALHOST_HOSTS` | `shared/constants/infrastructure/localhost.constants.ts` | const object | hosts localhost |
| `ENV_VAR_NAMES` | `shared/constants/infrastructure/localhost.constants.ts` | const object | שמות משתני סביבה |
| `ENV_FALLBACKS` | `shared/constants/infrastructure/localhost.constants.ts` | const object | ערכי fallback משתני סביבה |
| `LOCALHOST_CONFIG` | `shared/constants/infrastructure/localhost.constants.ts` | const object | הגדרות localhost |
| `STORAGE_CONFIG` | `shared/constants/infrastructure/storage.constants.ts` | const object | הגדרות אחסון |
| `StorageType` | `shared/constants/infrastructure/storage.constants.ts` | enum | סוגי אחסון |
| `CACHE_DURATION` | `shared/constants/infrastructure/storage.constants.ts` | const object | משכי cache |
| `LogLevel` | `shared/constants/infrastructure/logging.constants.ts` | enum | רמות לוג |
| `LOG_ICONS` | `shared/constants/infrastructure/logging.constants.ts` | const object | אייקוני לוג |
| `LOG_LEVEL_PROPERTIES` | `shared/constants/infrastructure/logging.constants.ts` | const object | תכונות רמות לוג |
| `LOG_DOMAINS` | `shared/constants/infrastructure/logging.constants.ts` | const object | תחומי לוג |
| `MESSAGE_FORMATTERS` | `shared/constants/infrastructure/logging.constants.ts` | const object | מעצבי הודעות |
| `PERFORMANCE_THRESHOLDS` | `shared/constants/infrastructure/logging.constants.ts` | const object | ספי ביצועים |
| `API_BASE_URL` | `shared/constants/infrastructure/http.constants.ts` | const object | כתובות בסיס API |
| `HTTP_CLIENT_CONFIG` | `shared/constants/infrastructure/http.constants.ts` | const object | הגדרות לקוח HTTP |
| `HTTP_TIMEOUTS` | `shared/constants/infrastructure/http.constants.ts` | const object | timeouts HTTP |
| `HTTP_STATUS_CODES` | `shared/constants/infrastructure/http.constants.ts` | const object | קודי סטטוס HTTP |
| `HttpMethod` | `shared/constants/infrastructure/http.constants.ts` | enum | שיטות HTTP |
| `HTTP_ERROR_MESSAGES` | `shared/constants/infrastructure/http.constants.ts` | const object | הודעות שגיאה HTTP |

### Client Constants

#### UI Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `ComponentSize` | `client/src/constants/core/ui/size.constants.ts` | enum | גדלי רכיבים |
| `ModalSize` | `client/src/constants/core/ui/size.constants.ts` | enum | גדלי modal |
| `InteractiveSize` | `client/src/constants/core/ui/size.constants.ts` | type | גדלים אינטראקטיביים |
| `ButtonSize` | `client/src/constants/core/ui/size.constants.ts` | enum | גדלי כפתור |
| `SpinnerSize` | `client/src/constants/core/ui/size.constants.ts` | enum | גדלי ספינר |
| `ButtonVariant` | `client/src/constants/core/ui/variant.constants.ts` | enum | וריאנטים של כפתור |
| `StatCardVariant` | `client/src/constants/core/ui/variant.constants.ts` | enum | וריאנטים של כרטיס סטטיסטיקה |
| `ToastVariant` | `client/src/constants/core/ui/variant.constants.ts` | enum | וריאנטים של toast |
| `SpinnerVariant` | `client/src/constants/core/ui/variant.constants.ts` | enum | וריאנטים של ספינר |
| `VariantBase` | `client/src/constants/core/ui/variant.constants.ts` | enum | בסיס וריאנט |
| `TextColor` | `client/src/constants/core/ui/color.constants.ts` | enum | צבעי טקסט |
| `BgColor` | `client/src/constants/core/ui/color.constants.ts` | enum | צבעי רקע |
| `MetricColor` | `client/src/constants/core/ui/color.constants.ts` | enum | צבעי מטריקות |
| `TrendDirection` | `client/src/constants/core/ui/color.constants.ts` | enum | כיווני מגמה |
| `FeatureHighlightAccent` | `client/src/constants/core/ui/color.constants.ts` | enum | הדגשת תכונות |
| `Easing` | `client/src/constants/core/ui/easing.constants.ts` | enum | סוגי easing |
| `IconAnimationType` | `client/src/constants/core/ui/animation.constants.ts` | enum | סוגי אנימציית אייקון |
| `FormFieldType` | `client/src/constants/core/ui/form.constants.ts` | enum | סוגי שדות טופס |
| `PaymentTab` | `client/src/constants/core/ui/payment.constants.ts` | enum | טאבים תשלום |
| `ANIMATION_CONFIG` | `client/src/constants/core/ui/animation.constants.ts` | const object | הגדרות אנימציה |
| `ACCESSIBILITY_CONFIG` | `client/src/constants/core/ui/animation.constants.ts` | const object | הגדרות נגישות |
| `VALIDATION_MESSAGES` | `client/src/constants/core/ui/validation-messages.constants.ts` | const object | הודעות ולידציה |
| `TOAST_LIMIT` | `client/src/constants/core/ui/toast.constants.ts` | const number | מגבלת התראות |
| `TOAST_REMOVE_DELAY` | `client/src/constants/core/ui/toast.constants.ts` | const number | השהיית הסרת התראה |
| `DEFAULT_TOAST_DURATION` | `client/src/constants/core/ui/toast.constants.ts` | const number | משך התראה ברירת מחדל |
| `ToastActionType` | `client/src/constants/core/ui/toast.constants.ts` | enum | סוגי פעולות התראה |
| `TRIVIA_WORDS` | `client/src/constants/core/ui/backgroundAnimation.constants.ts` | const array | מילים לאנימציית רקע |
| `ANIMATION_FONTS` | `client/src/constants/core/ui/backgroundAnimation.constants.ts` | const array | פונטים לאנימציה |
| `ANIMATION_COLORS` | `client/src/constants/core/ui/backgroundAnimation.constants.ts` | const array | צבעים לאנימציה |
| `WORD_DIRECTIONS` | `client/src/constants/core/ui/backgroundAnimation.constants.ts` | const array | כיוונים למילים |
| `BACKGROUND_ANIMATION_CONFIG` | `client/src/constants/core/ui/backgroundAnimation.constants.ts` | const object | הגדרות אנימציית רקע |
| `MAX_RETRIES` | `client/src/constants/core/ui/errorBoundary.constants.ts` | const number | מקסימום ניסיונות חוזרים |
| `ERROR_LOG_KEY_PREFIX` | `client/src/constants/core/ui/errorBoundary.constants.ts` | const string | קידומת מפתח לוג שגיאה |

#### Infrastructure Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `QUERY_KEYS` | `client/src/constants/infrastructure/query.constants.ts` | const object | מפתחות React Query |
| `STORAGE_KEYS` | `client/src/constants/infrastructure/storage.constants.ts` | const object | מפתחות אחסון |
| `AudioCategory` | `client/src/constants/infrastructure/audio.constants.ts` | enum | קטגוריות אודיו |
| `AudioKey` | `client/src/constants/infrastructure/audio.constants.ts` | enum | מפתחות אודיו |
| `AUDIO_DATA` | `client/src/constants/infrastructure/audio.constants.ts` | const object | נתוני אודיו |
| `LOGGER_CSS_COLORS` | `client/src/constants/infrastructure/logger.constants.ts` | const object | צבעי CSS לוגר |
| `TOAST_ENABLED_METHODS` | `client/src/constants/infrastructure/logger.constants.ts` | const Set | שיטות מופעלות toast |

#### Domain Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `CREDIT_BALANCE_DEFAULT_VALUES` | `client/src/constants/domain/user-defaults.constants.ts` | const object | ערכי ברירת מחדל יתרת נקודות |
| `SCORING_DEFAULTS` | `client/src/constants/domain/game.constants.ts` | const object | ברירות מחדל ניקוד |
| `GameClientStatus` | `client/src/constants/domain/game-state.constants.ts` | enum | סטטוסי משחק לקוח |
| `GAME_STATE_CONFIG` | `client/src/constants/domain/game-state.constants.ts` | const object | הגדרות מצב משחק |

#### Navigation Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `ROUTES` | `client/src/constants/core/ui/navigation.constants.ts` | const object | נתיבי אפליקציה |
| `NAVIGATION_LINKS` | `client/src/constants/core/ui/navigation.constants.ts` | const object | קישורי ניווט |
| `SOCIAL_DATA` | `client/src/constants/core/ui/social.constants.ts` | const array | נתוני שיתוף חברתי |

---

## Services (Singletons)

### Client Services
| שם Instance | Class | מיקום קובץ | תיאור |
|------------|-------|------------|-------|
| `analyticsService` | `AnalyticsService` | `client/src/services/domain/analytics.service.ts` | שירות אנליטיקה |
| `gameService` | `GameService` | `client/src/services/domain/game.service.ts` | שירות משחק |
| `gameHistoryService` | `GameHistoryService` | `client/src/services/domain/gameHistory.service.ts` | שירות היסטוריית משחק |
| `userService` | `UserService` | `client/src/services/domain/user.service.ts` | שירות משתמש |
| `creditsService` | `CreditsService` | `client/src/services/domain/credits.service.ts` | שירות נקודות |
| `paymentService` | `PaymentService` | `client/src/services/domain/payment.service.ts` | שירות תשלום |
| `multiplayerService` | `MultiplayerService` | `client/src/services/domain/multiplayer.service.ts` | שירות מרובה משתמשים |
| `adminService` | `AdminService` | `client/src/services/domain/admin.service.ts` | שירות אדמין |
| `apiService` | `ApiService` | `client/src/services/infrastructure/api.service.ts` | שירות API |
| `authService` | `AuthService` | `client/src/services/infrastructure/auth.service.ts` | שירות אימות |
| `authSyncService` | `AuthSyncService` | `client/src/services/infrastructure/authSync.service.ts` | שירות סנכרון אימות |
| `audioService` | `AudioService` | `client/src/services/infrastructure/audio.service.ts` | שירות אודיו |
| `storageService` | `StorageService` | `client/src/services/infrastructure/storage.service.ts` | שירות אחסון |
| `clientLogger` | `ClientLoggerService` | `client/src/services/infrastructure/clientLogger.service.ts` | שירות לוגים |
| `queryClient` | `QueryClient` | `client/src/services/infrastructure/queryClient.service.ts` | React Query client |
| `queryInvalidationService` | `QueryInvalidationService` | `client/src/services/infrastructure/queryInvalidation.service.ts` | שירות invalidate |
| `baseService` | `BaseService` | `client/src/services/infrastructure/base.service.ts` | שירות בסיס |
| `interceptorsService` | `InterceptorsService` | `client/src/services/infrastructure/interceptors.service.ts` | שירות interceptors |

### Shared Services
| שם Service | Class | מיקום קובץ | תיאור |
|-----------|-------|------------|-------|
| `BaseLoggerService` | `BaseLoggerService` | `shared/services/baseLogger.service.ts` | שירות לוגים בסיסי משותף (abstract class) |

### Server Services (Via DI)
| שם Service | Class | מיקום קובץ | תיאור |
|-----------|-------|------------|-------|
| `serverLogger` | `ServerLoggerService` | `server/src/internal/services/logging/serverLogger.service.ts` | שירות לוגים שרת |
| `metricsService` | `MetricsService` | `server/src/internal/services/metrics/metrics.service.ts` | שירות מטריקות (Singleton) |
| `storageMetricsTracker` | `StorageMetricsTracker` | `server/src/internal/services/metrics/metricsTracker.ts` | מעקב מטריקות אחסון |

---

## Hooks (Client)

### Auth Hooks
| שם Hook | מיקום קובץ | תיאור |
|---------|------------|-------|
| `useLogin` | `client/src/hooks/useAuth.ts` | hook להתחברות |
| `useRegister` | `client/src/hooks/useAuth.ts` | hook להרשמה |
| `useCurrentUser` | `client/src/hooks/useAuthState.ts` | hook למשתמש נוכחי |
| `useAuth` | `client/src/hooks/useAuth.ts` | hook אימות כללי |

### Game Hooks
| שם Hook | מיקום קובץ | תיאור |
|---------|------------|-------|
| `useGameHistory` | `client/src/hooks/useTrivia.ts` | hook להיסטוריית משחק |
| `useTriviaQuestionMutation` | `client/src/hooks/useTrivia.ts` | hook לשאלת טריוויה |
| `useStartGameSession` | `client/src/hooks/useTrivia.ts` | hook להתחלת משחק |
| `useSubmitAnswerToSession` | `client/src/hooks/useTrivia.ts` | hook לשליחת תשובה |
| `useFinalizeGameSession` | `client/src/hooks/useTrivia.ts` | hook לסיום משחק |
| `useValidateCustomDifficulty` | `client/src/hooks/useTrivia.ts` | hook לולידציית קושי מותאם |

### Analytics Hooks
| שם Hook | מיקום קובץ | תיאור |
|---------|------------|-------|
| `useUserAnalytics` | `client/src/hooks/useAnalyticsDashboard.ts` | hook לאנליטיקה משתמש |
| `useGlobalStats` | `client/src/hooks/useAnalyticsDashboard.ts` | hook לסטטיסטיקות גלובליות |
| `useGlobalTrends` | `client/src/hooks/useAnalyticsDashboard.ts` | hook למגמות גלובליות |
| `useTrackAnalyticsEvent` | `client/src/hooks/useAnalyticsDashboard.ts` | hook למעקב אירוע |
| `useUserRanking` | `client/src/hooks/useAnalyticsDashboard.ts` | hook לדירוג משתמש |
| `useGlobalLeaderboard` | `client/src/hooks/useAnalyticsDashboard.ts` | hook לטבלת לוחות גלובלית |
| `useLeaderboardByPeriod` | `client/src/hooks/useAnalyticsDashboard.ts` | hook לטבלת לוחות לפי תקופה |

### Admin Hooks
| שם Hook | מיקום קובץ | תיאור |
|---------|------------|-------|
| `useUserSummaryById` | `client/src/hooks/useAdminAnalytics.ts` | hook לסיכום משתמש לפי ID |
| `useUserPerformanceById` | `client/src/hooks/useAdminAnalytics.ts` | hook לביצועי משתמש |
| `useBusinessMetrics` | `client/src/hooks/useAdminAnalytics.ts` | hook למטריקות עסקיות |
| `useSystemPerformanceMetrics` | `client/src/hooks/useAdminAnalytics.ts` | hook למטריקות ביצועי מערכת |
| `useGameStatistics` | `client/src/hooks/useAdminGame.ts` | hook לסטטיסטיקות משחק |
| `useAllTriviaQuestions` | `client/src/hooks/useAdminGame.ts` | hook לכל השאלות |

### Other Hooks
| שם Hook | מיקום קובץ | תיאור |
|---------|------------|-------|
| `useCredits` | `client/src/hooks/useCredits.ts` | hook לנקודות |
| `useMultiplayer` | `client/src/hooks/useMultiplayer.ts` | hook למרובה משתמשים |
| `useModalRoute` | `client/src/hooks/useModalRoute.ts` | hook לנתיב modal |
| `useRedux` | `client/src/hooks/useRedux.ts` | hook ל-Redux |
| `useAppDispatch` | `client/src/hooks/useRedux.ts` | hook ל-dispatch |
| `useAppSelector` | `client/src/hooks/useRedux.ts` | hook ל-selector |
| `useAudioSettings` | `client/src/hooks/useAudioSettings.ts` | hook להגדרות אודיו |
| `useUserPreferences` | `client/src/hooks/useUserPreferences.ts` | hook להעדפות משתמש |
| `useAccountManagement` | `client/src/hooks/useAccountManagement.ts` | hook לניהול חשבון |
| `useChangePassword` | `client/src/hooks/useAccountManagement.ts` | hook לשינוי סיסמה |
| `useUser` | `client/src/hooks/useUser.ts` | hook למשתמש |
| `useCountUp` | `client/src/hooks/useCountUp.ts` | hook לספירה |
| `useToast` | `client/src/hooks/useToast.ts` | hook להתראות |
| `useNavigationClose` | `client/src/hooks/useNavigationClose.ts` | hook לסגירת ניווט |
| `useAppInitialization` | `client/src/hooks/useAppInitialization.ts` | hook לאתחול אפליקציה |
| `useAiProviders` | `client/src/hooks/useAiProviders.ts` | hook לספקי AI |
| `useAiProviderStats` | `client/src/hooks/useAiProviders.ts` | hook לסטטיסטיקות ספק AI |
| `useAiProviderHealth` | `client/src/hooks/useAiProviders.ts` | hook לבריאות ספק AI |

---

## Components (Client)

### Game Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `GameTimer` | `client/src/components/game/GameTimer.tsx` | טיימר משחק |
| `GameSettingsForm` | `client/src/components/game/GameSettingsForm.tsx` | טופס הגדרות משחק |
| `GameStats` | `client/src/components/game/GameStats.tsx` | סטטיסטיקות משחק |
| `GameMode` | `client/src/components/game/GameMode.tsx` | בחירת מצב משחק |

### UI Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `Button` | `client/src/components/ui/Button.tsx` | כפתור |
| `BackToHomeButton` | `client/src/components/ui/Button.tsx` | כפתור חזרה לבית |
| `LinkButton` | `client/src/components/ui/Button.tsx` | כפתור קישור |
| `CloseButton` | `client/src/components/ui/Button.tsx` | כפתור סגירה |
| `Card` | `client/src/components/ui/Card.tsx` | כרטיס |
| `CardHeader` | `client/src/components/ui/Card.tsx` | כותרת כרטיס |
| `CardTitle` | `client/src/components/ui/Card.tsx` | כותרת כרטיס |
| `CardDescription` | `client/src/components/ui/Card.tsx` | תיאור כרטיס |
| `CardContent` | `client/src/components/ui/Card.tsx` | תוכן כרטיס |
| `CardFooter` | `client/src/components/ui/Card.tsx` | תחתית כרטיס |
| `Dialog` | `client/src/components/ui/dialog.tsx` | דיאלוג |
| `DialogContent` | `client/src/components/ui/dialog.tsx` | תוכן דיאלוג |
| `DialogHeader` | `client/src/components/ui/dialog.tsx` | כותרת דיאלוג |
| `DialogFooter` | `client/src/components/ui/dialog.tsx` | תחתית דיאלוג |
| `DialogTitle` | `client/src/components/ui/dialog.tsx` | כותרת דיאלוג |
| `DialogDescription` | `client/src/components/ui/dialog.tsx` | תיאור דיאלוג |
| `AlertDialog` | `client/src/components/ui/dialog.tsx` | דיאלוג אזהרה |
| `AlertDialogContent` | `client/src/components/ui/dialog.tsx` | תוכן דיאלוג אזהרה |
| `AlertDialogHeader` | `client/src/components/ui/dialog.tsx` | כותרת דיאלוג אזהרה |
| `AlertDialogFooter` | `client/src/components/ui/dialog.tsx` | תחתית דיאלוג אזהרה |
| `AlertDialogTitle` | `client/src/components/ui/dialog.tsx` | כותרת דיאלוג אזהרה |
| `AlertDialogDescription` | `client/src/components/ui/dialog.tsx` | תיאור דיאלוג אזהרה |
| `AlertDialogAction` | `client/src/components/ui/dialog.tsx` | פעולה דיאלוג אזהרה |
| `AlertDialogCancel` | `client/src/components/ui/dialog.tsx` | ביטול דיאלוג אזהרה |
| `Alert` | `client/src/components/ui/alert.tsx` | התראה |
| `AlertTitle` | `client/src/components/ui/alert.tsx` | כותרת התראה |
| `AlertDescription` | `client/src/components/ui/alert.tsx` | תיאור התראה |
| `Input` | `client/src/components/ui/Input.tsx` | שדה קלט |
| `NumberInput` | `client/src/components/ui/numberInput.tsx` | שדה קלט מספר |
| `Textarea` | `client/src/components/ui/textarea.tsx` | אזור טקסט |
| `Badge` | `client/src/components/ui/badge.tsx` | תג |
| `Skeleton` | `client/src/components/ui/skeleton.tsx` | שלד טעינה |
| `Spinner` | `client/src/components/ui/spinner.tsx` | ספינר |
| `Progress` | `client/src/components/ui/progress.tsx` | סרגל התקדמות |
| `Slider` | `client/src/components/ui/slider.tsx` | מחוון |
| `Table` | `client/src/components/ui/table.tsx` | טבלה |
| `TableHeader` | `client/src/components/ui/table.tsx` | כותרת טבלה |
| `TableBody` | `client/src/components/ui/table.tsx` | גוף טבלה |
| `TableRow` | `client/src/components/ui/table.tsx` | שורת טבלה |
| `TableHead` | `client/src/components/ui/table.tsx` | תא כותרת |
| `TableCell` | `client/src/components/ui/table.tsx` | תא טבלה |
| `Toast` | `client/src/components/ui/toast.tsx` | התראה |
| `Toaster` | `client/src/components/ui/toaster.tsx` | מנהל התראות |
| `Tabs` | `client/src/components/ui/tabs.tsx` | טאבים |
| `Checkbox` | `client/src/components/ui/checkbox.tsx` | תיבת סימון |
| `RadioGroup` | `client/src/components/ui/radio-group.tsx` | קבוצת רדיו |
| `RadioGroupItem` | `client/src/components/ui/radio-group.tsx` | פריט רדיו |
| `Separator` | `client/src/components/ui/separator.tsx` | מפריד |
| `Label` | `client/src/components/ui/label.tsx` | תווית |
| `Form` | `client/src/components/ui/form.tsx` | טופס |
| `FormField` | `client/src/components/ui/form.tsx` | שדה טופס |
| `FormItem` | `client/src/components/ui/form.tsx` | פריט טופס |
| `FormLabel` | `client/src/components/ui/form.tsx` | תווית טופס |
| `FormControl` | `client/src/components/ui/form.tsx` | בקרת טופס |
| `FormDescription` | `client/src/components/ui/form.tsx` | תיאור טופס |
| `FormMessage` | `client/src/components/ui/form.tsx` | הודעת טופס |
| `useFormField` | `client/src/components/ui/form.tsx` | hook שדה טופס |
| `Avatar` | `client/src/components/ui/Avatar.tsx` | אווטר |
| `AvatarImage` | `client/src/components/ui/Avatar.tsx` | תמונת אווטר |
| `AvatarFallback` | `client/src/components/ui/Avatar.tsx` | אווטר גיבוי |
| `DropdownMenu` | `client/src/components/ui/dropdown-menu.tsx` | תפריט נפתח |
| `DropdownMenuTrigger` | `client/src/components/ui/dropdown-menu.tsx` | טריגר תפריט נפתח |
| `DropdownMenuContent` | `client/src/components/ui/dropdown-menu.tsx` | תוכן תפריט נפתח |
| `DropdownMenuItem` | `client/src/components/ui/dropdown-menu.tsx` | פריט תפריט נפתח |
| `DropdownMenuCheckboxItem` | `client/src/components/ui/dropdown-menu.tsx` | פריט תיבת סימון תפריט נפתח |
| `DropdownMenuSeparator` | `client/src/components/ui/dropdown-menu.tsx` | מפריד תפריט נפתח |
| `ErrorBoundary` | `client/src/components/ui/ErrorBoundary.tsx` | גבול שגיאות |
| `BackgroundAnimation` | `client/src/components/ui/BackgroundAnimation.tsx` | אנימציית רקע |

### Routing Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `ProtectedRoute` | `client/src/components/routing/ProtectedRoute.tsx` | נתיב מוגן |
| `PublicRoute` | `client/src/components/routing/PublicRoute.tsx` | נתיב ציבורי |
| `NotFound` | `client/src/components/routing/NotFound.tsx` | דף לא נמצא |
| `ModalRouteWrapper` | `client/src/components/routing/ModalRouteWrapper.tsx` | עטיפה לנתיב modal |

### Statistics Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `StatCard` | `client/src/components/statistics/StatCard.tsx` | כרטיס סטטיסטיקה |
| `LeaderboardTable` | `client/src/components/statistics/LeaderboardTable.tsx` | טבלת לוחות |
| `RankBadge` | `client/src/components/statistics/RankBadge.tsx` | תג דירוג |
| `Bar` | `client/src/components/statistics/Bar.tsx` | גרף עמודות |
| `LeaderboardSkeleton` | `client/src/components/statistics/skeletons.tsx` | שלד טעינה טבלת לוחות |
| `OverviewSkeleton` | `client/src/components/statistics/skeletons.tsx` | שלד טעינה סקירה |
| `ProfileSkeleton` | `client/src/components/statistics/skeletons.tsx` | שלד טעינה פרופיל |

### Charts Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `PieChart` | `client/src/components/charts/PieChart.tsx` | גרף עוגה |
| `TrendChart` | `client/src/components/charts/TrendChart.tsx` | גרף מגמה |
| `DistributionChart` | `client/src/components/charts/DistributionChart.tsx` | גרף התפלגות |
| `ChartCard` | `client/src/components/charts/ChartCard.tsx` | כרטיס גרף |

### Admin Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `GameStatisticsCard` | `client/src/components/admin/GameStatisticsCard.tsx` | כרטיס סטטיסטיקות משחק |
| `ManagementActions` | `client/src/components/admin/ManagementActions.tsx` | פעולות ניהול |
| `TriviaManagementTable` | `client/src/components/admin/TriviaManagementTable.tsx` | טבלת ניהול טריוויה |
| `UserSearchSection` | `client/src/components/admin/UserSearchSection.tsx` | חיפוש משתמשים |
| `UsersTable` | `client/src/components/admin/UsersTable.tsx` | טבלת משתמשים |
| `ConfirmClearDialog` | `client/src/components/admin/ConfirmClearDialog.tsx` | דיאלוג אישור ניקוי |

### User Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `AvatarSelector` | `client/src/components/user/AvatarSelector.tsx` | בוחר אווטר |
| `ChangePasswordDialog` | `client/src/components/user/ChangePasswordDialog.tsx` | דיאלוג שינוי סיסמה |
| `ProfileEditDialog` | `client/src/components/user/ProfileEditDialog.tsx` | דיאלוג עריכת פרופיל |

### Auth Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `CompleteProfile` | `client/src/components/auth/CompleteProfile.tsx` | השלמת פרופיל |
| `OAuthCallback` | `client/src/components/auth/OAuthCallback.tsx` | קריאת OAuth |

### Payment Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `CreditBalance` | `client/src/components/payment/CreditBalance.tsx` | יתרת נקודות |

### Home Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `HomeTitle` | `client/src/components/home/HomeTitle.tsx` | כותרת דף בית |

### Layout Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `Footer` | `client/src/components/layout/Footer.tsx` | תחתית דף |

### Audio Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `AudioControls` | `client/src/components/audio/AudioControls.tsx` | בקרות אודיו |

### Social Components
| שם Component | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `SocialShare` | `client/src/components/social/SocialShare.tsx` | שיתוף חברתי |

---

## DTOs (Server)

### Auth DTOs
| שם DTO | מיקום קובץ | תיאור |
|--------|------------|-------|
| `LoginDto` | `server/src/features/auth/dtos/auth.dto.ts` | DTO התחברות |
| `RegisterDto` | `server/src/features/auth/dtos/auth.dto.ts` | DTO הרשמה |
| `AuthResponseDto` | `server/src/features/auth/dtos/auth.dto.ts` | DTO תגובת אימות |
| `RefreshTokenDto` | `server/src/features/auth/dtos/auth.dto.ts` | DTO רענון טוקן |
| `RefreshTokenResponseDto` | `server/src/features/auth/dtos/auth.dto.ts` | DTO תגובת רענון טוקן |

### User DTOs
| שם DTO | מיקום קובץ | תיאור |
|--------|------------|-------|
| `UpdateUserProfileDto` | `server/src/features/user/dtos/user.dto.ts` | DTO עדכון פרופיל |
| `SearchUsersDto` | `server/src/features/user/dtos/user.dto.ts` | DTO חיפוש משתמשים |
| `UpdateUserFieldDto` | `server/src/features/user/dtos/user.dto.ts` | DTO עדכון שדה משתמש |
| `UpdateUserPreferencesDto` | `server/src/features/user/dtos/user.dto.ts` | DTO עדכון העדפות |
| `UpdateSinglePreferenceDto` | `server/src/features/user/dtos/user.dto.ts` | DTO עדכון העדפה בודדת |
| `UpdateUserCreditsDto` | `server/src/features/user/dtos/user.dto.ts` | DTO עדכון נקודות משתמש |
| `UpdateUserStatusDto` | `server/src/features/user/dtos/user.dto.ts` | DTO עדכון סטטוס משתמש |
| `ChangePasswordDto` | `server/src/features/user/dtos/user.dto.ts` | DTO שינוי סיסמה |
| `SetAvatarDto` | `server/src/features/user/dtos/user.dto.ts` | DTO הגדרת אווטר |

### Game DTOs
| שם DTO | מיקום קובץ | תיאור |
|--------|------------|-------|
| `TriviaRequestDto` | `server/src/features/game/dtos/triviaRequest.dto.ts` | DTO בקשת טריוויה |
| `StartGameSessionDto` | `server/src/features/game/dtos/startGameSession.dto.ts` | DTO התחלת משחק |
| `SubmitAnswerToSessionDto` | `server/src/features/game/dtos/submitAnswerToSession.dto.ts` | DTO שליחת תשובה |
| `FinalizeGameSessionDto` | `server/src/features/game/dtos/finalizeGameSession.dto.ts` | DTO סיום משחק |
| `GameHistoryQueryDto` | `server/src/features/game/dtos/gameHistoryQuery.dto.ts` | DTO שאילתת היסטוריה |
| `ValidateCustomDifficultyDto` | `server/src/features/game/dtos/customDifficulty.dto.ts` | DTO ולידציית קושי מותאם |

### Multiplayer DTOs
| שם DTO | מיקום קובץ | תיאור |
|--------|------------|-------|
| `CreateRoomDto` | `server/src/features/game/multiplayer/dtos/createRoom.dto.ts` | DTO יצירת חדר |
| `JoinRoomDto` | `server/src/features/game/multiplayer/dtos/joinRoom.dto.ts` | DTO הצטרפות לחדר |
| `RoomActionDto` | `server/src/features/game/multiplayer/dtos/roomAction.dto.ts` | DTO פעולה בחדר |
| `GameStateDto` | `server/src/features/game/multiplayer/dtos/gameState.dto.ts` | DTO מצב משחק |
| `RoomStateDto` | `server/src/features/game/multiplayer/dtos/gameState.dto.ts` | DTO מצב חדר |
| `PlayerStatusDto` | `server/src/features/game/multiplayer/dtos/playerStatus.dto.ts` | DTO סטטוס שחקן |
| `MultiplayerSubmitAnswerDto` | `server/src/features/game/multiplayer/dtos/submitAnswer.dto.ts` | DTO שליחת תשובה מרובה משתמשים |

### Analytics DTOs
| שם DTO | מיקום קובץ | תיאור |
|--------|------------|-------|
| `TrackEventDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO מעקב אירוע |
| `TopicAnalyticsQueryDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO שאילתת אנליטיקה נושא |
| `UserIdParamDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO פרמטר ID משתמש |
| `UserActivityQueryDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO שאילתת פעילות משתמש |
| `UserTrendQueryDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO שאילתת מגמה משתמש |
| `UserComparisonQueryDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO שאילתת השוואה משתמש |
| `UserSummaryQueryDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO שאילתת סיכום משתמש |
| `GetLeaderboardDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO קבלת טבלת לוחות |
| `GetLeaderboardStatsDto` | `server/src/features/analytics/dtos/analytics.dto.ts` | DTO סטטיסטיקות טבלת לוחות |

### Payment DTOs
| שם DTO | מיקום קובץ | תיאור |
|--------|------------|-------|
| `PaymentMethodDetailsDto` | `server/src/features/payment/dtos/payment.dto.ts` | DTO פרטי אמצעי תשלום |
| `CreatePaymentDto` | `server/src/features/payment/dtos/payment.dto.ts` | DTO יצירת תשלום |

### Credits DTOs
| שם DTO | מיקום קובץ | תיאור |
|--------|------------|-------|
| `DeductCreditsDto` | `server/src/features/credits/dtos/credits.dto.ts` | DTO ניכוי נקודות |
| `PurchaseCreditsDto` | `server/src/features/credits/dtos/credits.dto.ts` | DTO רכישת נקודות |
| `GetCreditHistoryDto` | `server/src/features/credits/dtos/credits.dto.ts` | DTO קבלת היסטוריית נקודות |
| `CanPlayDto` | `server/src/features/credits/dtos/credits.dto.ts` | DTO בדיקת יכולת משחק |

---

## Entities (Server)

| שם Entity | מיקום קובץ | תיאור |
|----------|------------|-------|
| `BaseEntity` | `server/src/internal/entities/base.entity.ts` | Entity בסיס |
| `UserEntity` | `server/src/internal/entities/user.entity.ts` | Entity משתמש |
| `GameHistoryEntity` | `server/src/internal/entities/gameHistory.entity.ts` | Entity היסטוריית משחק |
| `CreditTransactionEntity` | `server/src/internal/entities/creditTransaction.entity.ts` | Entity עסקת נקודות |
| `LeaderboardEntity` | `server/src/internal/entities/leaderboard.entity.ts` | Entity טבלת לוחות |
| `PaymentHistoryEntity` | `server/src/internal/entities/paymentHistory.entity.ts` | Entity היסטוריית תשלום |
| `TriviaEntity` | `server/src/internal/entities/trivia.entity.ts` | Entity שאלות טריוויה |
| `UserStatsEntity` | `server/src/internal/entities/userStats.entity.ts` | Entity סטטיסטיקות משתמש |

---

## Modules (Server)

| שם Module | מיקום קובץ | תיאור |
|----------|------------|-------|
| `AppModule` | `server/src/app.module.ts` | מודול ראשי |
| `GameModule` | `server/src/features/game/game.module.ts` | מודול משחק |
| `UserModule` | `server/src/features/user/user.module.ts` | מודול משתמש |
| `AuthModule` | `server/src/features/auth/auth.module.ts` | מודול אימות |
| `AnalyticsModule` | `server/src/features/analytics/analytics.module.ts` | מודול אנליטיקה |
| `AdminModule` | `server/src/features/admin/admin.module.ts` | מודול אדמין |
| `MultiplayerModule` | `server/src/features/game/multiplayer/multiplayer.module.ts` | מודול מרובה משתמשים |
| `PaymentModule` | `server/src/features/payment/payment.module.ts` | מודול תשלום |
| `CreditsModule` | `server/src/features/credits/credits.module.ts` | מודול נקודות |
| `CacheModule` | `server/src/internal/modules/cache/cache.module.ts` | מודול cache |
| `StorageModule` | `server/src/internal/modules/storage/storage.module.ts` | מודול אחסון |
| `RedisModule` | `server/src/internal/modules/redis.module.ts` | מודול Redis |
| `ValidationModule` | `server/src/common/validation/validation.module.ts` | מודול ולידציה |

---

## Views (Client)

### Main Views
| שם View | מיקום קובץ | תיאור |
|---------|------------|-------|
| `HomeView` | `client/src/views/home/HomeView.tsx` | דף בית |
| `LoginView` | `client/src/views/login/LoginView.tsx` | דף התחברות |
| `RegistrationView` | `client/src/views/registration/RegistrationView.tsx` | דף הרשמה |
| `StatisticsView` | `client/src/views/statistics/StatisticsView.tsx` | דף סטטיסטיקות |
| `PaymentView` | `client/src/views/payment/PaymentView.tsx` | דף תשלום |
| `AdminDashboard` | `client/src/views/admin/AdminDashboard.tsx` | דשבורד אדמין |
| `UnauthorizedView` | `client/src/views/unauthorized/UnauthorizedView.tsx` | דף לא מורשה |

### Game Views
| שם View | מיקום קובץ | תיאור |
|---------|------------|-------|
| `GameSessionView` | `client/src/views/game/GameSessionView.tsx` | מסך משחק |
| `GameSummaryView` | `client/src/views/game/GameSummaryView.tsx` | מסך סיכום משחק |

### Multiplayer Views
| שם View | מיקום קובץ | תיאור |
|---------|------------|-------|
| `MultiplayerLobbyView` | `client/src/views/multiplayer/MultiplayerLobbyView.tsx` | לובי מרובה משתמשים |
| `MultiplayerGameView` | `client/src/views/multiplayer/MultiplayerGameView.tsx` | משחק מרובה משתמשים |
| `MultiplayerResultsView` | `client/src/views/multiplayer/MultiplayerResultsView.tsx` | תוצאות מרובה משתמשים |

### Legal Views
| שם View | מיקום קובץ | תיאור |
|---------|------------|-------|
| `TermsOfServiceView` | `client/src/views/legal/TermsOfServiceView.tsx` | תנאי שירות |
| `PrivacyPolicyView` | `client/src/views/legal/PrivacyPolicyView.tsx` | מדיניות פרטיות |
| `ContactView` | `client/src/views/legal/ContactView.tsx` | יצירת קשר |

---

## Redux (Client)

### Slices
| שם Slice | מיקום קובץ | תיאור |
|---------|------------|-------|
| `gameModeSlice` | `client/src/redux/slices/gameModeSlice.ts` | State מצב משחק והגדרות (persisted ב-localStorage) |
| `gameSessionSlice` | `client/src/redux/slices/gameSessionSlice.ts` | State סשן משחק פעיל (לא persisted - session only) |
| `multiplayerSlice` | `client/src/redux/slices/multiplayerSlice.ts` | State משחק מרובה משתתפים (לא persisted - session only) |
| `audioSettingsSlice` | `client/src/redux/slices/audioSettingsSlice.ts` | State הגדרות אודיו (persisted ב-localStorage) |
| `uiPreferencesSlice` | `client/src/redux/slices/uiPreferencesSlice.ts` | State העדפות UI (persisted ב-sessionStorage) |

**הערה:** מצב משתמש/סטטיסטיקות מנוהלים ב-React Query.

### Selectors
| שם Selector | מיקום קובץ | תיאור |
|------------|------------|-------|
| `selectCurrentGameMode` | `client/src/redux/selectors.ts` | בחירת מצב משחק נוכחי |
| `selectCurrentTopic` | `client/src/redux/selectors.ts` | בחירת נושא נוכחי |
| `selectCurrentDifficulty` | `client/src/redux/selectors.ts` | בחירת קושי נוכחי |
| `selectCurrentSettings` | `client/src/redux/selectors.ts` | בחירת הגדרות נוכחיות |
| `selectGameId` | `client/src/redux/selectors.ts` | בחירת מזהה משחק |
| `selectGameScore` | `client/src/redux/selectors.ts` | בחירת ניקוד משחק |
| `selectCurrentQuestion` | `client/src/redux/selectors.ts` | בחירת שאלה נוכחית |
| `selectIsConnected` | `client/src/redux/selectors.ts` | בחירת מצב חיבור multiplayer |
| `selectMultiplayerRoom` | `client/src/redux/selectors.ts` | בחירת חדר multiplayer |
| `selectVolume` | `client/src/redux/selectors.ts` | בחירת עוצמת קול |
| `selectIsMuted` | `client/src/redux/selectors.ts` | בחירת מצב השתקה |
| `selectLeaderboardPeriod` | `client/src/redux/selectors.ts` | בחירת תקופת לוח תוצאות |

### Store
| שם Export | מיקום קובץ | תיאור |
|----------|------------|-------|
| `store` | `client/src/redux/store.ts` | Redux store |
| `persistor` | `client/src/redux/store.ts` | Redux persist store |
| `AppDispatch` | `client/src/redux/store.ts` | Type dispatch |
| `RootState` | `client/src/redux/store.ts` | Type root state |

---

## Guards (Server)

| שם Guard | מיקום קובץ | תיאור |
|---------|------------|-------|
| `AuthGuard` | `server/src/common/guards/auth.guard.ts` | Guard לאימות JWT |
| `RolesGuard` | `server/src/common/guards/roles.guard.ts` | Guard לבדיקת תפקידים |
| `WsAuthGuard` | `server/src/common/guards/ws-auth.guard.ts` | Guard לאימות WebSocket |

---

## Pipes (Server)

| שם Pipe | מיקום קובץ | תיאור |
|---------|------------|-------|
| `TriviaRequestPipe` | `server/src/common/pipes/triviaRequest.pipe.ts` | Pipe לוולידציית בקשת טריוויה |
| `CustomDifficultyPipe` | `server/src/common/pipes/customDifficulty.pipe.ts` | Pipe לוולידציית קושי מותאם |
| `GameAnswerPipe` | `server/src/common/pipes/gameAnswer.pipe.ts` | Pipe לוולידציית תשובת משחק |
| `UserDataPipe` | `server/src/common/pipes/userData.pipe.ts` | Pipe לוולידציית נתוני משתמש |
| `PaymentDataPipe` | `server/src/common/pipes/paymentData.pipe.ts` | Pipe לוולידציית נתוני תשלום |

---

## Interceptors (Server)

| שם Interceptor | מיקום קובץ | תיאור |
|---------------|------------|-------|
| `CacheInterceptor` | `server/src/common/interceptors/cache.interceptor.ts` | Interceptor לניהול cache |
| `PerformanceInterceptor` | `server/src/common/interceptors/performanceMonitoring.interceptor.ts` | Interceptor למעקב ביצועים |
| `ResponseFormatter` | `server/src/common/interceptors/responseFormatting.interceptor.ts` | Interceptor לעיצוב תגובות |

---

## Decorators (Server)

### Auth Decorators
| שם Decorator | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `@Public()` | `server/src/common/decorators/auth.decorator.ts` | סימון endpoint כציבורי |
| `@Roles(...roles)` | `server/src/common/decorators/auth.decorator.ts` | דרישת תפקידים |
| `@RequireUserStatus(...statuses)` | `server/src/common/decorators/auth.decorator.ts` | דרישת סטטוס משתמש |
| `@RequireEmailVerified()` | `server/src/common/decorators/auth.decorator.ts` | דרישת אימייל מאומת |

### Cache Decorators
| שם Decorator | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `@Cache(ttl, key?)` | `server/src/common/decorators/cache.decorator.ts` | הגדרת cache |
| `@NoCache()` | `server/src/common/decorators/cache.decorator.ts` | ביטול cache |

### Param Decorators
| שם Decorator | מיקום קובץ | תיאור |
|-------------|------------|-------|
| `@CurrentUserId()` | `server/src/common/decorators/param.decorator.ts` | קבלת userId נוכחי |
| `@CurrentUser()` | `server/src/common/decorators/param.decorator.ts` | קבלת משתמש נוכחי |
| `@WsCurrentUserId()` | `server/src/common/decorators/wsParam.decorator.ts` | קבלת userId WebSocket |
| `@WsCurrentUser()` | `server/src/common/decorators/wsParam.decorator.ts` | קבלת משתמש WebSocket |
| `@ConnectedSocket()` | `server/src/common/decorators/wsParam.decorator.ts` | קבלת socket מחובר |

---

## Middleware (Server)

| שם Middleware | מיקום קובץ | תיאור |
|--------------|------------|-------|
| `BulkOperationsMiddleware` | `server/src/internal/middleware/bulkOperations.middleware.ts` | Middleware לפעולות bulk |
| `RateLimitMiddleware` | `server/src/internal/middleware/rateLimit.middleware.ts` | Middleware להגבלת קצב |

---

## Gateways (Server)

| שם Gateway | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `MultiplayerGateway` | `server/src/features/game/multiplayer/multiplayer.gateway.ts` | Gateway למרובה משתמשים (WebSocket) |

---

## Strategies (Server)

| שם Strategy | מיקום קובץ | תיאור |
|------------|------------|-------|
| `GoogleStrategy` | `server/src/features/auth/google.strategy.ts` | Passport strategy ל-Google OAuth |

---

## Exception Filters (Server)

| שם Filter | מיקום קובץ | תיאור |
|----------|------------|-------|
| `GlobalExceptionFilter` | `server/src/common/globalException.filter.ts` | Filter גלובלי לטיפול בשגיאות |

---

## Config Classes & Exports (Server)

| שם Class/Export | מיקום קובץ | סוג | תיאור |
|----------------|------------|-----|-------|
| `AppConfig` | `server/src/config/app.config.ts` | class | הגדרות אפליקציה |
| `DatabaseConfig` | `server/src/config/database.config.ts` | const object | הגדרות מסד נתונים TypeORM |
| `redisConfig` | `server/src/config/redis.config.ts` | const object | הגדרות Redis |
| `dataSource` | `server/src/config/dataSource.ts` | export | מקור נתונים TypeORM |
| `validateEnvironmentVariables` | `server/src/config/environment.validation.ts` | function | ולידציית משתני סביבה |

---

## Internal Controllers (Server)

| שם Controller | מיקום קובץ | תיאור |
|--------------|------------|-------|
| `HealthController` | `server/src/internal/controllers/health.controller.ts` | בקר health checks |
| `MetricsController` | `server/src/internal/controllers/middlewareMetrics.controller.ts` | בקר מטריקות middleware |
| `CacheController` | `server/src/internal/modules/cache/cache.controller.ts` | בקר cache |
| `StorageController` | `server/src/internal/modules/storage/storage.controller.ts` | בקר אחסון |

---

## Internal Services (Server)

### Auth Services
| שם Service | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `TokenExtractionService` | `server/src/internal/services/auth/tokenExtraction.service.ts` | שירות לחילוץ token |
| `AuthenticationManager` | `server/src/common/auth/authentication.manager.ts` | מנהל אימות |
| `JwtTokenService` | `server/src/common/auth/jwt-token.service.ts` | שירות JWT |
| `PasswordService` | `server/src/common/auth/password.service.ts` | שירות סיסמה |

### PayPal Services
| שם Service | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `PayPalApiService` | `server/src/internal/services/paypal/paypalApi.service.ts` | שירות API PayPal |
| `PayPalAuthService` | `server/src/internal/services/paypal/paypalAuth.service.ts` | שירות אימות PayPal |
| `PayPalWebhookService` | `server/src/features/payment/webhooks/paypalWebhook.service.ts` | שירות webhook PayPal |

### Cache Services
| שם Service | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `CacheService` | `server/src/internal/modules/cache/cache.service.ts` | שירות cache |
| `CacheInvalidationService` | `server/src/internal/services/cache/cacheInvalidation.service.ts` | שירות ביטול cache |

### Storage Services
| שם Service | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `StorageService` | `server/src/internal/modules/storage/storage.service.ts` | שירות אחסון |
| `StorageUtils` | `server/src/internal/modules/storage/utils.ts` | כלי עזר אחסון |

### Metrics Services
| שם Service | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `MetricsService` | `server/src/internal/services/metrics/metrics.service.ts` | שירות מטריקות |
| `StorageMetricsTracker` | `server/src/internal/services/metrics/metricsTracker.ts` | מעקב מטריקות אחסון |

### Validation Services
| שם Service | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `LanguageToolService` | `server/src/common/validation/languageTool.service.ts` | שירות ולידציית שפה |

### Schedulers
| שם Service | מיקום קובץ | תיאור |
|-----------|------------|-------|
| `ScoreResetScheduler` | `server/src/features/analytics/services/score-reset.scheduler.ts` | Scheduler לאיפוס ניקוד |
| `AdminBootstrapService` | `server/src/features/auth/services/adminBootstrap.service.ts` | שירות bootstrap אדמין |

---

## Internal Types (Server)

### Core Types
| שם Type/Interface | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `CacheConfig` | `server/src/internal/types/core/nest.types.ts` | הגדרות cache |
| `BulkMetadata` | `server/src/internal/types/core/nest.types.ts` | מטא-דאטה פעולות bulk |
| `NestRequest` | `server/src/internal/types/core/nest.types.ts` | בקשת NestJS מורחבת |
| `DecoratorMetadata` | `server/src/internal/types/core/nest.types.ts` | מטא-דאטה decorators |
| `RateLimitConfig` | `server/src/internal/types/core/nest.types.ts` | הגדרות הגבלת קצב |
| `UserPayload` | `server/src/internal/types/core/nest.types.ts` | Payload משתמש |

### Domain Types
| שם Type/Interface | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `RoomTimer` | `server/src/internal/types/domain/game.types.ts` | טיימר חדר |
| `QuestionSchedule` | `server/src/internal/types/domain/game.types.ts` | לוח זמנים שאלות |
| `SocketData` | `server/src/internal/types/domain/game.types.ts` | נתוני socket |
| `TypedSocket` | `server/src/internal/types/domain/game.types.ts` | Socket מוטיפוס |
| `MultiplayerConnectionInfo` | `server/src/internal/types/domain/game.types.ts` | מידע חיבור מרובה משתמשים |
| `RoomHttpResponse` | `server/src/internal/types/domain/game.types.ts` | תגובת HTTP חדר |
| `TriviaQuestionMetadata` | `server/src/internal/types/domain/game.types.ts` | מטא-דאטה שאלת טריוויה |
| `QuestionCacheEntry` | `server/src/internal/types/domain/game.types.ts` | רשומת cache שאלה |
| `StreakData` | `server/src/internal/types/domain/game.types.ts` | נתוני רצף |
| `LLMQuestion` | `server/src/internal/types/domain/ai.types.ts` | שאלת LLM |
| `LLMTriviaResponse` | `server/src/internal/types/domain/ai.types.ts` | תגובת טריוויה LLM |
| `ProviderConfig` | `server/src/internal/types/domain/ai.types.ts` | הגדרות ספק |
| `ProviderStats` | `server/src/internal/types/domain/ai.types.ts` | סטטיסטיקות ספק |
| `TopicAnalyticsAccumulator` | `server/src/internal/types/domain/analytics.types.ts` | מצבר אנליטיקה נושא |
| `DifficultyStatsRecord` | `server/src/internal/types/domain/analytics.types.ts` | רשומת סטטיסטיקות קושי |
| `GetUserSummaryParams` | `server/src/internal/types/domain/analytics.types.ts` | פרמטרים סיכום משתמש |
| `UserSearchCacheResult` | `server/src/internal/types/domain/user.types.ts` | תוצאות cache חיפוש משתמש |
| `AuditLogEntry` | `server/src/internal/types/domain/user.types.ts` | רשומת audit log |
| `CustomDifficultyItem` | `server/src/internal/types/domain/user.types.ts` | פריט קושי מותאם |
| `UserRegistrationData` | `server/src/internal/types/domain/user.types.ts` | נתוני הרשמה |
| `PayPalOrderStatus` | `server/src/internal/types/domain/paypal.types.ts` | enum סטטוס הזמנה PayPal |
| `PayPalCaptureStatus` | `server/src/internal/types/domain/paypal.types.ts` | enum סטטוס capture PayPal |
| `PayPalAccessTokenResponse` | `server/src/internal/types/domain/paypal.types.ts` | תגובת access token PayPal |
| `PayPalOrderResponse` | `server/src/internal/types/domain/paypal.types.ts` | תגובת הזמנה PayPal |
| `PayPalWebhookEvent` | `server/src/internal/types/domain/paypal.types.ts` | אירוע webhook PayPal |

### Infrastructure Types
| שם Type/Interface | מיקום קובץ | תיאור |
|------------------|------------|-------|
| `TokenUserData` | `server/src/internal/types/infrastructure/auth.types.ts` | נתוני משתמש token |
| `HealthCheck` | `server/src/internal/types/infrastructure/health.types.ts` | בדיקת health |
| `HealthCheckResponse` | `server/src/internal/types/infrastructure/health.types.ts` | תגובת health check |
| `LivenessCheckResponse` | `server/src/internal/types/infrastructure/health.types.ts` | תגובת liveness |
| `ReadinessCheckResponse` | `server/src/internal/types/infrastructure/health.types.ts` | תגובת readiness |
| `MiddlewareMetrics` | `server/src/internal/types/domain/metrics.types.ts` | מטריקות middleware |
| `SystemPerformanceMetrics` | `server/src/internal/types/domain/metrics.types.ts` | מטריקות ביצועי מערכת |
| `SecurityMetrics` | `server/src/internal/types/domain/metrics.types.ts` | מטריקות אבטחה |

---

## Internal Constants (Server)

### Domain Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `CreditSource` | `server/src/internal/constants/domain/credits.constants.ts` | enum | מקורות נקודות |

### Infrastructure Constants
| שם Constant/Enum | מיקום קובץ | סוג | תיאור |
|-----------------|------------|-----|-------|
| `PUBLIC_ENDPOINTS` | `server/src/internal/constants/infrastructure/publicEndpoints.constants.ts` | const array | נקודות קצה ציבוריות |
| `SERVER_STORAGE_CONFIG` | `server/src/internal/constants/infrastructure/storage.constants.ts` | const object | הגדרות אחסון שרת |
| `CACHE_CONFIG` | `server/src/internal/constants/infrastructure/storage.constants.ts` | const object | הגדרות cache |
| `StorageOperation` | `server/src/internal/constants/infrastructure/storage.constants.ts` | enum | פעולות אחסון |
| `HealthStatus` | `server/src/internal/constants/infrastructure/health.constants.ts` | enum | סטטוסי health |
| `OptimizationLevel` | `server/src/internal/constants/infrastructure/optimization.constants.ts` | enum | רמות אופטימיזציה |
| `WildcardPattern` | `server/src/internal/constants/infrastructure/query.constants.ts` | enum | דפוסי wildcard |
| `SQL_CONDITIONS` | `server/src/internal/constants/infrastructure/query.constants.ts` | const object | תנאי SQL |

---

## סיכום והמלצות

### סטטוס המסמך

המסמך כולל כעת **29+ קטגוריות** עם טבלאות מפורטות:
- ✅ Client: Services, Hooks, Components, Views, Redux, Utils, Constants, Types
- ✅ Server: Services, Controllers, DTOs, Entities, Modules, Providers, Config, Filters
- ✅ Server Infrastructure: Guards, Pipes, Interceptors, Decorators, Middleware, Gateways, Strategies, Exception Filters
- ✅ Internal: Controllers, Services, Types, Constants, Utils, Validations
- ✅ Shared: Types (Core, Domain, Infrastructure), Constants, Utils, Services, Validation Functions

**סה"כ רשומים במסמך (מעודכן סופי):**
- 130+ Classes (כולל Providers, Config, Filters)
- 300+ Interfaces/Types (כולל כל ה-Types מ-Shared)
- 120+ Functions (כולל Validation Functions, Provider Functions, Utils)
- 180+ Constants/Enums (כולל כל ה-Constants מ-Shared ו-Client)
- 30+ Hooks
- 60+ Components
- 15+ Views
- 25+ DTOs (כולל כל ה-DTOs החסרים)
- 15+ Guards/Pipes/Interceptors/Decorators
- 20+ Internal Services
- 10+ Providers & Utilities
- 25+ Validation Functions
- 5+ Config Classes & Exports
- 1+ Exception Filters

### נקודות חוזק

1. ✅ **עקביות גבוהה** - רוב הקבצים והסימבולים עוקבים אחרי הקונבנציות
2. ✅ **ארגון טוב** - מבנה תיקיות ברור ומאורגן לפי domain/core/infrastructure
3. ✅ **Barrel exports** - שימוש נכון ב-index.ts לייצוא מרכזי
4. ✅ **Type safety** - שימוש נרחב ב-TypeScript עם types מפורשים
5. ✅ **תיעוד מקיף** - המסמך כולל כעת את כל הקטגוריות העיקריות בפרויקט

### נקודות לשיפור

1. ⚠️ **אי-עקביות בשמות קבצי services בתת-תיקיות:**
   - `business-analytics.service.ts` (kebab-case)
   - `user-analytics.service.ts` (kebab-case)
   - `analytics-tracker.service.ts` (kebab-case)
   - `analytics-common.service.ts` (kebab-case)
   - `score-reset.scheduler.ts` (kebab-case)
   - לעומת: `user.service.ts`, `game.service.ts` (camelCase)
   - **הערה:** שינוי זה דורש שינוי שמות קבצים, ולכן לא יבוצע כעת (כפי שביקשת)

2. ✅ **עקביות DTOs:**
   - כל ה-DTOs עקביים - כל קובץ `*.dto.ts` מכיל class עם שם PascalCase שמסתיים ב-`Dto`
   - דוגמאות: `LoginDto`, `CreatePaymentDto`, `UserSummaryQueryDto`, `GetLeaderboardStatsDto`
   - כל ה-DTOs מתועדים במסמך (25+ DTOs)

3. ✅ **שימוש בעקרונות Clean Code:**
   - שמות תיאוריים
   - הפרדת אחריויות
   - Single Responsibility Principle
   - Type safety עם TypeScript strict mode

4. ✅ **עקביות בשמות:**
   - כל ה-Classes: PascalCase
   - כל ה-Interfaces: PascalCase
   - כל ה-Constants: UPPER_SNAKE_CASE
   - כל ה-Functions: camelCase
   - כל ה-Hooks: camelCase + `use` prefix
   - כל ה-Components: PascalCase
   - כל ה-DTOs: PascalCase + `Dto` suffix

### הערות חשובות

- המסמך מתעד את הנומנקלטורה כפי שהיא **כרגע** בפרויקט
- יש לבדוק ולהתאים את המסמך כשיש שינויים בפרויקט
- מומלץ לעדכן את המסמך באופן שוטף עם כל שינוי משמעותי
- המסמך כולל כעת את כל הקטגוריות העיקריות בפרויקט
- כל ה-DTOs מתועדים ועקביים (PascalCase + `Dto` suffix)
- שמות קבצים עם kebab-case בתת-תיקיות נשמרו כפי שהם (כפי שביקשת)

---

## רשימת מקורות

- [React TypeScript Rules](../.cursor/rules/react-ts.mdc)
- [NestJS Rules](../.cursor/rules/nestjs.mdc)
- [Shared Constants Documentation](shared/CONSTANTS.md)
- [Frontend Types Documentation](frontend/TYPES.md)

---

**מסמך זה עודכן לאחרונה:** 11/01/2026
**מחבר:** EveryTriv Development Team
