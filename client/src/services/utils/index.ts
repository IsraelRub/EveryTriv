/**
 * Utility Services Index
 *
 * @module UtilityServices
 * @description Logging, points management, query client, and utility services
 * @used_by client/services, client/src/components, client/src/hooks
 */

/**
 * Points management service
 * @description User points and credits management
 * @used_by client/src/components/payment, client/src/views/user
 */
export { pointsService } from './points.service';

/**
 * Subscription management service
 * @description User subscription and billing management
 * @used_by client/src/components/payment, client/src/views/payment
 */
export { subscriptionService } from './subscription.service';

/**
 * Query client service
 * @description Query client for API requests
 * @used_by client/src/components, client/src/views, client/src/hooks
 */
export { queryClient } from './queryClient.service';
