import { TIME_PERIODS_MS } from '../core/time.constants';

export const CREDITS_CONFIG_KEY_PACKAGES = 'credit_packages';

/** Maximum granted `UserEntity.credits` from rolling refill (not purchased pool). */
export const GRANTED_CREDITS_CAP = 150;

/** Rolling window length between granted-credits refills to `GRANTED_CREDITS_CAP`. */
export const GRANTED_CREDITS_REFILL_INTERVAL_MS = TIME_PERIODS_MS.DAY;

export enum CreditTransactionType {
	DAILY_RESET = 'DAILY_RESET',
	PURCHASE = 'PURCHASE',
	GAME_USAGE = 'GAME_USAGE',
	ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
	REFUND = 'REFUND',
}

export enum CreditSource {
	FREE_DAILY = 'FREE_DAILY',
	PURCHASED = 'PURCHASED',
	BONUS = 'BONUS',
	REFUND = 'REFUND',
}
