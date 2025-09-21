/**
 * Leaderboard Feature Module
 *
 * @module LeaderboardFeature
 * @description Leaderboard and ranking functionality
 * @used_by server/src/app, server/src/features, server/src/controllers
 */

/**
 * Leaderboard DTOs
 * @description Data transfer objects for leaderboard operations
 * @used_by server/src/features/leaderboard, server/src/controllers
 */
export * from './dtos';

/**
 * Leaderboard controller
 * @description Handles leaderboard-related HTTP requests
 * @used_by server/src/app, server/src/routes
 */
export { LeaderboardController } from './leaderboard.controller';

/**
 * Leaderboard service
 * @description Business logic for leaderboard management
 * @used_by server/src/features/leaderboard, server/src/controllers
 */
export { LeaderboardService } from './leaderboard.service';

/**
 * Leaderboard module
 * @description NestJS module for leaderboard feature
 * @used_by server/src/app, server/src/features
 */
export { LeaderboardModule } from './leaderboard.module';
