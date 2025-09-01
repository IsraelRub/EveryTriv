/**
 * Server-only points constants for EveryTriv
 */

// Re-export shared constants
export { POINTS_PRICING_TIERS } from '../../../../shared/constants/payment.constants';

// Point transaction types (shared with client)
export enum PointTransactionType {
	DAILY_RESET = 'daily_reset',
	PURCHASE = 'purchase',
	DEDUCTION = 'deduction',
	GAME_USAGE = 'game_usage',
	ADMIN_ADJUSTMENT = 'admin_adjustment',
	REFUND = 'refund',
}

// Point sources (shared with client)
export enum PointSource {
	FREE_DAILY = 'free_daily',
	PURCHASED = 'purchased',
	GAME_PLAY = 'game_play',
}

// Points pricing tiers moved to shared constants
