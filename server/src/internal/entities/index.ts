/**
 * Server Entities Index
 *
 * @module ServerEntities
 * @description Central export point for all server-side database entities
 * @used_by server/src/features, server/src/repositories, server/src/migrations
 */

/**
 * Base entity class
 * @description Abstract base class with common columns for all entities
 * @used_by server/src/internal/entities/*
 */
export * from './base.entity';

/**
 * Game history entity
 * @description Database entity for storing game history records
 * @used_by server/src/features/gameHistory, server/src/repositories
 */
export * from './gameHistory.entity';

/**
 * Payment history entity
 * @description Database entity for storing payment transaction records
 * @used_by server/src/features/payment, server/src/repositories
 */
export * from './paymentHistory.entity';

/**
 * Credit transaction entity
 * @description Database entity for storing credit transaction records
 * @used_by server/src/features/credits, server/src/repositories
 */
export * from './creditTransaction.entity';

/**
 * Trivia entity
 * @description Database entity for storing trivia question records
 * @used_by server/src/features/game, server/src/repositories
 */
export * from './trivia.entity';

/**
 * User entity
 * @description Database entity for storing user account records
 * @used_by server/src/features/user, server/src/features/auth, server/src/repositories
 */
export * from './user.entity';

/**
 * User stats entity
 * @description Database entity for storing user game statistics and performance metrics
 * @used_by server/src/features/analytics, server/src/features/game, server/src/features/leaderboard
 */
export * from './userStats.entity';

/**
 * Leaderboard entity
 * @description Database entity for storing user ranking and leaderboard records
 * @used_by server/src/features/leaderboard, server/src/features/analytics
 */
export * from './leaderboard.entity';
