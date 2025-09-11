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
 * @description Advanced mathematical operations for points
 */
export { PointCalculationService } from './pointCalculation.service';

/**
 * Point validation functions
 * @description Comprehensive validation for points operations
 * @note Validation functions are now available in shared/validation/points.validation.ts
 */
export { validatePointBalance, validatePointPurchase, validatePointTransaction, validatePointTransfer, validatePointRefund, validatePointExpiration, validatePointPackages } from '../../validation/points.validation';