/**
 * Features Module
 *
 * @module FeaturesModule
 * @description All feature modules for the application
 * @used_by server/src/app, server/main
 */

/**
 * Analytics feature
 * @description Analytics and metrics collection
 * @used_by server/src/app, server/src/controllers
 */
export * from './analytics';

/**
 * Auth feature
 * @description Authentication and authorization
 * @used_by server/src/app, server/src/controllers
 */
export * from './auth';

/**
 * Cache feature
 * @description Caching and performance optimization
 * @used_by server/src/app, server/src/features, server/src/controllers
 */
export * from '../internal/modules/cache';

/**
 * Game feature
 * @description Game logic and trivia management
 * @used_by server/src/app, server/src/controllers
 */
export * from './game';

/**
 * Leaderboard feature
 * @description Leaderboard and ranking management
 * @used_by server/src/app, server/src/controllers
 */
export * from './leaderboard';

/**
 * Payment feature
 * @description Payment processing and transactions
 * @used_by server/src/app, server/src/controllers
 */
export * from './payment';

/**
 * Points feature
 * @description Points management and transactions
 * @used_by server/src/app, server/src/controllers
 */
export * from './points';

/**
 * Subscription feature
 * @description Subscription management and billing
 * @used_by server/src/app, server/src/controllers
 */
export * from './subscription';

/**
 * User feature
 * @description User management and authentication
 * @used_by server/src/app, server/src/controllers
 */
export * from './user';
