/**
 * Game Services Index
 *
 * @module GameServices
 * @description Game session history, trivia validation, and game-related services
 * @used_by client/views/game-history, client/components/stats, client/components/game
 */
/**
 * Game history service
 * @description Game session history and statistics
 * @used_by client/views/game-history, client/components/stats
 */
export { gameHistoryService } from './gameHistory.service';

/**
 * Score calculation service
 * @description Game scoring, multipliers, and statistics calculation
 * @used_by client/redux/features/gameSlice, client/components/game
 */
export * from './scoreCalculation.service';

/**
 * Trivia validation service
 * @description Client-side trivia question validation
 * @used_by client/components/game, client/services/api
 */
// Validation service moved to validation module
