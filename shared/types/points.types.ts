/**
 * Points System Types for EveryTriv
 * Shared between client and server
 *
 * @module PointsTypes
 * @description Points and credits management type definitions
 * @used_by server: server/src/features/points/points.service.ts (PointsService), client: client/src/services/points.service.ts (PointsService), shared/services/storage.service.ts (points data storage)
 */
import type { BaseEntity } from './core/data.types';

export interface PointBalance {
	total_points: number;
	free_questions: number;
	purchased_points: number;
	daily_limit: number;
	can_play_free: boolean;
	next_reset_time: string | null;
	userId?: string;
	balance?: number;
	lastUpdated?: Date;
}

export interface PointPurchaseOption {
	id: string;
	points: number;
	price: number;
	price_display: string;
	price_per_point: number;
	description?: string;
	currency?: string;
	bonus?: number;
	savings?: string;
	popular?: boolean;
}

/**
 * Base points entity interface
 * @interface BasePointsEntity
 * @description Base interface for points entities
 */
export interface BasePointsEntity extends BaseEntity {
	/** User identifier */
	userId: string;
	/** Points amount */
	amount: number;
	/** Transaction type */
	type: 'purchase' | 'deduction' | 'refund' | 'transfer' | 'bonus';
	/** Balance after transaction */
	balanceAfter: number;
	/** Transaction description */
	description?: string;
}

export interface PointTransaction extends BasePointsEntity {
	/** User identifier (legacy field) */
	user_id: string;
	/** Balance after transaction (legacy field) */
	balance_after: number;
	/** Free questions after transaction */
	free_questions_after: number;
	/** Purchased points after transaction */
	purchased_points_after: number;
	/** Transaction metadata */
	metadata: {
		difficulty?: string;
		topic?: string;
		question_count?: number;
		package_id?: string;
	};
	/** Transaction ID */
	id: string;
	/** Creation timestamp */
	createdAt: Date;
	/** Last update timestamp */
	updatedAt: Date;
}

export interface TransferResult {
	success: boolean;
	from_balance: PointBalance;
	to_balance: PointBalance;
	amount: number;
}
