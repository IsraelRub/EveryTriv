/**
 * Subscription Feature Module
 *
 * @module SubscriptionFeature
 * @description Subscription management feature module
 * @used_by server/app, server/features
 */

/**
 * Subscription DTOs
 * @description Data transfer objects for subscription operations
 * @used_by server/features/subscription, server/controllers
 */
export * from './dtos';

/**
 * Subscription controller
 * @description Handles subscription-related HTTP requests
 * @used_by server/app, server/routes
 */
export { SubscriptionController } from './subscription.controller';

/**
 * Subscription module
 * @description NestJS module for subscription feature
 * @used_by server/app, server/features
 */
export { SubscriptionModule } from './subscription.module';

/**
 * Subscription service
 * @description Business logic for subscription management
 * @used_by server/features/subscription, server/controllers
 */
export { SubscriptionService } from './subscription.service';
