/**
 * Game Logic Module
 *
 * @module GameLogic
 * @description Core game logic and trivia generation services
 * @used_by server/features/game, server/services
 */

/**
 * Trivia generation service
 * @description Generates trivia questions and manages game content
 * @used_by server/features/game, server/controllers
 */
export { TriviaGenerationService } from './triviaGeneration.service';

/**
 * Scoring service
 * @description Handles game scoring and leaderboard management
 * @used_by server/features/game, server/controllers
 */
export { ScoringService } from './scoring';

/**
 * AI providers service
 * @description Manages AI providers for trivia generation
 * @used_by server/features/game, server/controllers
 */
export { AiProvidersService } from './providers/management';
