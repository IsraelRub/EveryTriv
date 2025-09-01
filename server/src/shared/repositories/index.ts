/**
 * Server Repositories Index
 *
 * @module ServerRepositories
 * @description Central export point for all server-side repository classes
 * @used_by server/features, server/services, server/entities
 */

/**
 * Base repository functionality
 * @description Common repository patterns and utilities
 * @used_by server/features, server/services
 */
export * from './base.repository';

/**
 * Trivia repository
 * @description Repository for trivia game data management
 * @used_by server/features/game, server/services
 */
export * from './trivia.repository';
