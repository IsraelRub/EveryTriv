import { TIME_PERIODS_MS } from '../core/time.constants';

export const CREDITS_CONFIG_KEY_PACKAGES = 'credit_packages';

export const GRANTED_CREDITS_CAP = 150;

export const GRANTED_CREDITS_REFILL_INTERVAL_MS = TIME_PERIODS_MS.DAY;

export enum CreditTransactionType {
	DAILY_RESET = 'DAILY_RESET',
	PURCHASE = 'PURCHASE',
	GAME_USAGE = 'GAME_USAGE',
	ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
	REFUND = 'REFUND',
}

export enum CreditSource {
	GRANTED = 'GRANTED',
	PURCHASED = 'PURCHASED',
}
