/**
 * Points Constants for EveryTriv
 *
 * @module PointsConstants
 * @description Points-related enums and constants shared between client and server
 * @used_by server/src/features/points, client/src/services/points, shared/types
 */

/**
 * Point Transaction Type Enum
 * @enum PointTransactionType
 * @description Types of point transactions
 * @used_by server/src/features/points, shared/types/domain/points.types.ts
 */
export enum PointTransactionType {
	PURCHASE = 'purchase',
	DEDUCTION = 'deduction',
}

/**
 * Point Source Enum
 * @enum PointSource
 * @description Sources of point transactions
 * @used_by server/src/features/points, shared/types/domain/points.types.ts
 */
export enum PointSource {
	PURCHASE = 'purchase',
}
