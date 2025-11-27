/**
 * Game Feature Index
 *
 * @module GameFeature
 * @description Core trivia game functionality and logic feature module
 * @used_by server/app.module, server/controllers
 */

/**
 * Game DTOs
 * @description Data transfer objects for game operations
 * @used_by server/features/game, server/controllers
 */

/**
 * Game controller
 * @description Game API endpoints and request handling
 * @used_by server/app, server/controllers
 */
export { GameController } from './game.controller';

/**
 * Game module
 * @description Game feature module configuration
 * @used_by server/app.module, server/controllers
 */
export { GameModule } from './game.module';

/**
 * Game service
 * @description Core game logic and trivia question generation
 * @used_by server/features/game, server/controllers
 */
export { GameService } from './game.service';

/**
 * Game logic and providers
 * @description Game logic services and AI providers
 * @used_by server/features/game, server/services
 */
export * from './logic';

/**
 * Multiplayer module
 * @description Multiplayer simultaneous trivia games
 * @used_by server/app.module
 */
export { MultiplayerModule } from './multiplayer/multiplayer.module';
export { MultiplayerController } from './multiplayer/multiplayer.controller';
