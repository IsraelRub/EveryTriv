/**
 * Shared Utilities Index
 *
 * @module SharedUtils
 * @description Central export point for all shared utility functions and helpers
 * @author EveryTriv Team
 * @used_by client/src/utils/cn.ts, server/src/shared/utils/interceptors.utils.ts, shared/services/storage.service.ts
 */

/**
 * Validation utilities
 * @description Functions for custom difficulty validation and text extraction
 * @exports {Function} Validation utility functions
 * @used_by client/src/utils/cn.ts, server/src/shared/utils/interceptors.utils.ts, shared/validation/validation.utils.ts
 */
export { extractCustomDifficultyText, isCustomDifficulty } from '../validation';

/**
 * Data manipulation utilities
 * @description Functions for data transformation, manipulation, and processing
 * @exports {Function} Data manipulation utility functions
 * @used_by client/src/services/api.service.ts, server/src/features/game/game.service.ts, shared/services/storage.service.ts
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
 * @used_by client/src/services/auth.service.ts, server/src/shared/entities/user.entity.ts, shared/services/logging
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
 * Points calculation utilities (pure, shared by client and server)
 */
export * from './points.utils';
