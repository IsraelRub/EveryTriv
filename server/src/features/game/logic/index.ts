/**
 * Game Logic Module
 *
 * @module GameLogic
 * @description Core game logic and trivia generation services
 * @used_by server/src/features/game, server/src/services
 */

/**
 * Trivia generation service
 * @description Generates trivia questions and manages game content
 * @used_by server/src/features/game, server/src/controllers
 */
export { TriviaGenerationService } from './triviaGeneration.service';
