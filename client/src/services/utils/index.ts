/**
 * Utility Services Index
 *
 * @module UtilityServices
 * @description Logging, points management, query client, and utility services
 * @used_by client/services, client/components, client/hooks
 */

/**
 * Points management service
 * @description User points and credits management
 * @used_by client/components/payment, client/views/user
 */
export { pointsService } from './points.service';

/**
 * Subscription management service
 * @description User subscription and billing management
 * @used_by client/components/payment, client/views/payment
 */
export { subscriptionService } from './subscription.service';

/**
 * Query client service
 * @description Query client for API requests
 * @used_by client/components, client/views, client/hooks
 */
export { queryClient } from './queryClient.service';
