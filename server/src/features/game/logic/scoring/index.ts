/**
 * Scoring System Index
 *
 * @module ScoringSystem
 * @description Game scoring logic and calculation system
 * @used_by server/features/game/logic, server/services/game
 */

/**
 * Scoring controller
 * @description Scoring API endpoints and request handling
 * @used_by server/features/game, server/controllers
 */
export { ScoringController } from './scoring.controller';

/**
 * Scoring module
 * @description Scoring module configuration
 * @used_by server/features/game, server/modules
 */
export { ScoringModule } from './scoring.module';

/**
 * Scoring service
 * @description Game scoring system and points calculation
 * @used_by server/features/game/logic, server/services
 */
export { ScoringService } from './scoring.service';
