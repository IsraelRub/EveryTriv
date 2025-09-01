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
 * Trivia validation service
 * @description Client-side trivia question validation
 * @used_by client/components/game, client/services/api
 */
// Validation service moved to validation module
