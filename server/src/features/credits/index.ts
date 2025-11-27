/**
 * Credits Feature Module
 *
 * @module CreditsFeature
 * @description Central export point for all credits-related functionality
 * @used_by server/features/credits, server/controllers
 */

/**
 * Credits Controller
 * @description REST API controller for credits management endpoints
 * @used_by server/features/credits, server/controllers
 */
export { CreditsController } from './credits.controller';

/**
 * Credits Module
 * @description NestJS module for credits feature
 * @used_by server/features/credits, server/controllers
 */
export { CreditsModule } from './credits.module';

/**
 * Credits Service
 * @description Business logic service for credits management
 * @used_by server/features/credits, server/controllers
 */
export { CreditsService } from './credits.service';
