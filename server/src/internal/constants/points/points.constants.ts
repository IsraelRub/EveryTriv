/**
 * Server-only points constants for EveryTriv
 */

// Re-export shared constants
// export { POINTS_PRICING_TIERS } from '@shared'; // Commented out for TypeORM CLI compatibility
export const POINTS_PRICING_TIERS = {
	BASIC: { points: 100, price: 1.99 },
	STANDARD: { points: 500, price: 7.99 },
	PREMIUM: { points: 1000, price: 14.99 },
	ULTIMATE: { points: 2500, price: 29.99 },
} as const;

// Re-export types from centralized location
export { PointSource,PointTransactionType } from '../../types/typeorm-compatibility.types';
