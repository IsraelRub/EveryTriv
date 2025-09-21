/**
 * Game Services Index
 *
 * @module GameServices
 * @description Game session history, trivia validation, and game-related services
 * @used_by client/src/views/game-history, client/src/components/stats, client/src/components/game
 */
/**
 * Game history service
 * @description Game session history and statistics
 * @used_by client/src/views/game-history, client/src/components/stats
 */
export { gameHistoryService } from './gameHistory.service';

/**
 * Score calculation service
 * @description Game scoring, multipliers, and statistics calculation
 * @used_by client/redux/features/gameSlice, client/src/components/game
 */
export * from './scoreCalculation.service';

/**
 * Trivia validation service
 * @description Client-side trivia question validation
 * @used_by client/src/components/game, client/services/api
 */
