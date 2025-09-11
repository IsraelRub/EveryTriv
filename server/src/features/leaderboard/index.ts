/**
 * Leaderboard Feature Module
 *
 * @module LeaderboardFeature
 * @description Leaderboard and ranking functionality
 * @used_by server/app, server/features, server/controllers
 */

/**
 * Leaderboard DTOs
 * @description Data transfer objects for leaderboard operations
 * @used_by server/features/leaderboard, server/controllers
 */
export * from './dtos';

/**
 * Leaderboard controller
 * @description Handles leaderboard-related HTTP requests
 * @used_by server/app, server/routes
 */
export { LeaderboardController } from './leaderboard.controller';

/**
 * Leaderboard service
 * @description Business logic for leaderboard management
 * @used_by server/features/leaderboard, server/controllers
 */
export { LeaderboardService } from './leaderboard.service';

/**
 * Leaderboard module
 * @description NestJS module for leaderboard feature
 * @used_by server/app, server/features
 */
export { LeaderboardModule } from './leaderboard.module';
