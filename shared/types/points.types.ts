/**
 * Points System Types for EveryTriv
 * Shared between client and server
 *
 * @module PointsTypes
 * @description Points and credits management type definitions
 * @used_by server/src/features/points/points.service.ts, client/src/services/utils/points.service.ts
 */
import { PaymentMethod } from '../constants';
import type { BaseEntity } from './core/data.types';

export interface PointBalance {
	totalPoints: number;
	freeQuestions: number;
	purchasedPoints: number;
	dailyLimit: number;
	canPlayFree: boolean;
	nextResetTime: string | null;
	userId?: string;
	balance?: number;
	lastModified?: Date;
}

export interface PointPurchaseOption {
	id: string;
	points: number;
	price: number;
	priceDisplay: string;
	pricePerPoint: number;
	description?: string;
	currency?: string;
	bonus?: number;
	savings?: string;
	popular?: boolean;
	paypalProductId?: string;
	paypalPrice?: string;
	supportedMethods?: PaymentMethod[];
}

/**
 * Base points entity interface
 * @interface BasePointsEntity
 * @description Base interface for points entities
 */
export interface BasePointsEntity extends BaseEntity {
	userId: string;
	amount: number;
	type: 'DAILY_RESET' | 'PURCHASE' | 'GAME_USAGE' | 'ADMIN_ADJUSTMENT' | 'REFUND';
	balanceAfter: number;
	description?: string;
}

/**
 * Point transaction entity interface
 * @interface PointTransaction
 * @description Entity for point transactions
 * @used_by server/src/internal/entities/pointTransaction.entity.ts
 */
export interface PointTransaction extends BasePointsEntity {
	freeQuestionsAfter: number;
	purchasedPointsAfter: number;
	metadata: {
		difficulty?: string;
		topic?: string;
		questionCount?: number;
		packageId?: string;
	};
}

/**
 * Transfer result interface
 * @interface TransferResult
 * @description Result of a points transfer operation
 * @used_by server/src/features/points/points.service.ts (transferPoints)
 */
export interface TransferResult {
	success: boolean;
	fromBalance: PointBalance;
	toBalance: PointBalance;
	amount: number;
}

/**
 * Can play response interface
 * @interface CanPlayResponse
 * @description Response for checking if user can play
 * @used_by client/src/services/api.service.ts (canPlay), client/src/services/utils/points.service.ts (canPlay)
 */
export interface CanPlayResponse {
	canPlay: boolean;
	reason?: string;
}
