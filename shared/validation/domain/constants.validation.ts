import {
	GAME_MODES,
	GameMode,
	LEADERBOARD_PERIODS,
	LeaderboardPeriod,
	Locale,
	PAYMENT_METHODS,
	PaymentMethod,
} from '@shared/constants';

export function isPaymentMethod(value: string): value is PaymentMethod {
	return PAYMENT_METHODS.has(value);
}

export function isLeaderboardPeriod(value: string): value is LeaderboardPeriod {
	return LEADERBOARD_PERIODS.has(value);
}

export function isLocale(value: unknown): value is Locale {
	return value === Locale.EN || value === Locale.HE;
}

export function isGameMode(value: unknown): value is GameMode {
	return typeof value === 'string' && GAME_MODES.has(value);
}
