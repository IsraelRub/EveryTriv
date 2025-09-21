/**
 * Server Repositories Index
 *
 * @module ServerRepositories
 * @description Central export point for all server-side repository classes
 * @used_by server/src/features, server/services, server/entities
 */

/**
 * Base repository functionality
 * @description Common repository patterns and utilities
 * @used_by server/src/features, server/services
 */
export * from './base.repository';

/**
 * User repository
 * @description Repository for user data management with enhanced functionality
 * @used_by server/src/features/user, server/services
 */
export * from './user.repository';

/**
 * Trivia repository
 * @description Repository for trivia game data management
 * @used_by server/src/features/game, server/services
 */
export * from './trivia.repository';

/**
 * Game history repository
 * @description Repository for game history data management
 * @used_by server/src/features/game, server/services
 */
export * from './game-history.repository';
