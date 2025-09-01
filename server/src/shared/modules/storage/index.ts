/**
 * Storage Module Index
 *
 * @module StorageModuleIndex
 * @description Central export point for storage module components
 * @used_by server/src/app.module.ts, server/src/features
 */

/**
 * Storage service
 * @description Server-side persistent storage service using Redis
 * @used_by server/src/features/user/user.service.ts, server/src/features/game/game.service.ts
 */
export { ServerStorageService } from './storage.service';

/**
 * Storage controller
 * @description Controller for storage service management and monitoring
 * @used_by server/src/shared/modules/storage/storage.module.ts
 */
export { StorageController } from './storage.controller';

/**
 * Storage module
 * @description Module for persistent storage operations
 * @used_by server/src/app.module.ts
 */
export { StorageModule } from './storage.module';
