/**
 * Points System Types for EveryTriv
 * Shared between client and server
 *
 * @module PointsTypes
 * @description Points and credits management type definitions
 * @used_by server/src/features/points/points.service.ts, client/src/services/utils/points.service.ts
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
	lastModified?: Date;
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
	userId: string;
	amount: number;
	type: 'purchase' | 'deduction' | 'refund' | 'transfer' | 'bonus';
	balanceAfter: number;
	description?: string;
}

export interface PointTransaction extends BasePointsEntity {
	user_id: string;
	balance_after: number;
	free_questions_after: number;
	purchased_points_after: number;
	metadata: {
		difficulty?: string;
		topic?: string;
		question_count?: number;
		package_id?: string;
	};
	id: string;
	createdAt: Date;
	modifiedAt: Date;
}

export interface TransferResult {
	success: boolean;
	from_balance: PointBalance;
	to_balance: PointBalance;
	amount: number;
}
