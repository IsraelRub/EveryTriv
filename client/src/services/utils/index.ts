/**
 * Utility Services Index
 *
 * @module UtilityServices
 * @description Logging, points management, query client, and utility services
 * @used_by client/services, client/components, client/hooks
 */

// Logger service
export { ClientLogger, loggerService } from './logger.service';

/**
 * @description Alias for loggerService
 */
export { loggerService as logger } from './logger.service';

/**
 * Points management service
 * @description User points and credits management
 * @used_by client/components/payment, client/views/user
 */
export { pointsService } from './points.service';
