/**
 * Shared Utilities Index
 *
 * @module SharedUtils
 * @description Central export point for all shared utility functions and helpers
 * @author EveryTriv Team
 * @used_by client/src/utils/cn.ts, server/src/internal/utils/interceptors.utils.ts, shared/services/storage
 */

/**
 * Validation utilities
 * @description Functions for custom difficulty validation and text extraction
 * @exports {Function} Validation utility functions
 * @used_by client/src/utils/cn.ts, server/src/internal/utils/interceptors.utils.ts, shared/validation/validation.utils.ts
 */
export { extractCustomDifficultyText, isCustomDifficulty } from '../validation';

/**
 * Data manipulation utilities
 * @description Functions for data transformation, manipulation, and processing
 * @exports {Function} Data manipulation utility functions
 * @used_by client/src/services/api.service.ts, server/src/features/game/game.service.ts, shared/services/storage
 */
export * from './data.utils';

/**
 * Formatting utilities
 * @description Functions for text formatting, display, and data presentation
 * @exports {Function} Text formatting utility functions
 * @used_by client/src/components/stats/ScoringSystem.tsx, shared/services/logging
 */
export * from './format.utils';

/**
 * ID generation utilities
 * @description Functions for generating unique identifiers and IDs
 * @exports {Function} ID generation utility functions
 * @used_by client/src/services/auth.service.ts, server/src/internal/entities/user.entity.ts, shared/services/logging
 */
export * from './id.utils';

/**
 * Data sanitization utilities
 * @description Functions for data cleaning, validation, and security
 * @exports {Function} Data sanitization utility functions
 * @used_by client/src/components/user, server/src/internal/middleware, shared/services/logging
 */
export * from './sanitization.utils';

/**
 * Time utilities
 * @description Functions for time manipulation, calculations, and formatting
 * @exports {Function} Time-related utility functions
 * @used_by client/src/components/game/GameTimer.tsx, shared/services/logging
 */
export * from './time.utils';

/**
 * Date utilities
 * @description Functions for date manipulation, formatting, and calculations
 * @exports {Function} Date-related utility functions
 * @used_by client/src/components/stats/CustomDifficultyHistory.tsx, shared/services/logging
 */
export * from './date.utils';

/**
 * Storage utilities
 * @description Functions for browser storage management and operations
 * @exports {Function} Storage management utility functions
 * @used_by client/src/services/storage, server/src/internal/middleware
 */
export * from './storage.utils';

/**
 * Preferences utilities
 * @description Functions for user preferences management and defaults
 * @exports {Function} Preferences management utility functions
 * @used_by client/src/views/user/UserProfile.tsx, server/src/features/user/user.service.ts
 */
export * from './preferences.utils';

/**
 * Error handling utilities
 * @description Functions for consistent error processing and handling
 * @exports {Function} Error handling utility functions
 * @used_by server/src/features, client/src/services, shared/services/logging
 */
export * from './error.utils';

/**
 * Re-export functions that should be available from utils
 * @description Functions that are commonly used as utility functions
 */
export {
	validateCustomDifficultyText,
	validateEmail,
	validateInputContent,
	validateInputWithLanguageTool,
	validatePassword,
	validateTopicLength,
	validateUsername
} from '../validation';

// Re-export sanitization utilities
export { escapeHtml, truncateText } from './sanitization.utils';

// Re-export additional types and functions that are commonly used
export type {
	GameAnswerData,
	LanguageValidationData,
	LanguageValidationResult,
	PipeValidationWithSuggestion,
	TriviaQuestionData,
	TriviaRequestData,
	ValidationResult} from '../types';
export type {
	AuthenticationConfig,
	AuthenticationRequest,
	AuthenticationResult,
	JWTDecodedToken,
	LoginCredentials,
	TokenPair,
	TokenPayload,
	TokenValidationResult,
	UserData} from '../types';
export type {
	PaymentData,
	PaymentResult
} from '../types';
export type {
	StorageCleanupOptions,
	StorageConfig,
	StorageOperationResult,
	StorageService,
	StorageStats
} from '../types';
export type {
	AnalyticsEventData,
	AnalyticsResponse,
	CompleteUserAnalytics,
	DifficultyStatsData,
	GameAnalyticsQuery,
	TopicStatsData,
	UserAnalyticsStats
} from '../types';
export type {
	ClientLogsRequest,
	EnhancedLogEntry,
	Logger,
	LogMeta
} from '../types';
export type {
	CachedQuestionDto,
	CacheInvalidationDto,
	CacheQuestionsQueryDto,
	CacheQuestionsResponseDto,
	CacheStats,
	CacheStorage,
	UserProgressData
} from '../types';
export type {
	BaseUser,
	User
} from '../types';
export type {
	AllMiddlewareMetricsResponse,
	MiddlewareMetricsResponse,
	MiddlewareMetricsSummary
} from '../types';

// Re-export server logger
export { serverLogger } from '../services';

/**
 * Points calculation utilities (pure, shared by client and server)
 */
export * from './points.utils';
