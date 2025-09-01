/**
 * Analytics Feature Index
 *
 * @module AnalyticsFeature
 * @description Analytics and user behavior tracking feature module
 * @used_by server/app.module, server/features/game
 */

/**
 * Analytics controller
 * @description Analytics API endpoints and request handling
 * @used_by server/app, server/controllers
 */
export { AnalyticsController } from './analytics.controller';

/**
 * Analytics module
 * @description Analytics feature module configuration
 * @used_by server/app.module, server/controllers
 */
export { AnalyticsModule } from './analytics.module';

/**
 * Analytics service
 * @description User behavior analytics and event tracking
 * @used_by server/features/analytics, server/controllers
 */
export { AnalyticsService } from './analytics.service';

/**
 * Analytics types
 * @description TypeScript interfaces for analytics functionality
 * @used_by server/features/analytics, server/services
 */
// export * from './types';
