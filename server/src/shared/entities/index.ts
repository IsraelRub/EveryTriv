/**
 * Server Entities Index
 *
 * @module ServerEntities
 * @description Central export point for all server-side database entities
 * @used_by server/features, server/repositories, server/migrations
 */

/**
 * Game history entity
 * @description Database entity for storing game history records
 * @used_by server/features/gameHistory, server/repositories
 */
export * from './gameHistory.entity';

/**
 * Payment history entity
 * @description Database entity for storing payment transaction records
 * @used_by server/features/payment, server/repositories
 */
export * from './paymentHistory.entity';

/**
 * Point transaction entity
 * @description Database entity for storing point transaction records
 * @used_by server/features/points, server/repositories
 */
export * from './pointTransaction.entity';

/**
 * Subscription entity
 * @description Database entity for storing user subscription records
 * @used_by server/features/payment, server/repositories
 */
export * from './subscription.entity';

/**
 * Trivia entity
 * @description Database entity for storing trivia question records
 * @used_by server/features/game, server/repositories
 */
export * from './trivia.entity';

/**
 * User entity
 * @description Database entity for storing user account records
 * @used_by server/features/user, server/features/auth, server/repositories
 */
export * from './user.entity';
