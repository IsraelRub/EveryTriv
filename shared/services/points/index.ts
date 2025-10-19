/**
 * Points Services Index
 *
 * @module PointsServices
 * @description Central export point for all points-related services
 * @author EveryTriv Team
 */

/**
 * Base points service with shared business logic
 * @description Abstract base class for points management
 */
export { BasePointsService } from './basePoints.service';

/**
 * Point calculation service
 * @description Server-only service for calculating points based on game performance
 * @note This service is server-only and depends on NestJS
 */
export { PointCalculationService } from './pointCalculation.service';

/**
 * Point validation functions
 * @description Comprehensive validation for points operations
 * @note Validation functions are available in shared/validation/points.validation.ts
 */
export {
	validatePointBalance,
	validatePointExpiration,
	validatePointPackages,
	validatePointPurchase,
	validatePointRefund,
	validatePointTransaction,
	validatePointTransfer,
} from '../../validation/points.validation';
