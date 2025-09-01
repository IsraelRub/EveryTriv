/**
 * Points System Types for EveryTriv
 * Shared between client and server
 *
 * @module PointsTypes
 * @description Points and credits management type definitions
 * @used_by server: server/src/features/points/points.service.ts (PointsService), client: client/src/services/points.service.ts (PointsService), shared/services/storage.service.ts (points data storage)
 */

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
	currency?: string;
	bonus?: number;
	savings?: string;
	popular?: boolean;
}

export interface PointTransaction {
	id: string;
	amount: number;
	balance_after: number;
	free_questions_after: number;
	purchased_points_after: number;
	description?: string;
	created_at: string;
	metadata: {
		difficulty?: string;
		topic?: string;
		question_count?: number;
		package_id?: string;
	};
}

export interface TransferResult {
	success: boolean;
	from_balance: PointBalance;
	to_balance: PointBalance;
	amount: number;
}
