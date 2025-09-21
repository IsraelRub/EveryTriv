/**
 * Analytics Feature Index
 *
 * @module AnalyticsFeature
 * @description Analytics and user behavior tracking feature module
 * @used_by server/src/app.module, server/src/features/game
 */

/**
 * Analytics DTOs
 * @description Data transfer objects for analytics operations
 * @used_by server/src/features/analytics, server/src/controllers
 */
export * from './dtos';

/**
 * Analytics controller
 * @description Analytics API endpoints and request handling
 * @used_by server/src/app, server/src/controllers
 */
export { AnalyticsController } from './analytics.controller';

/**
 * Analytics module
 * @description Analytics feature module configuration
 * @used_by server/src/app.module, server/src/controllers
 */
export { AnalyticsModule } from './analytics.module';

/**
 * Analytics service
 * @description User behavior analytics and event tracking
 * @used_by server/src/features/analytics, server/src/controllers
 */
export { AnalyticsService } from './analytics.service';
