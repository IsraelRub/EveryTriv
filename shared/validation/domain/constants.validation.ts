import {
	LeaderboardPeriod,
	PaymentMethod,
	TimePeriod,
	VALID_LEADERBOARD_PERIODS_SET,
	VALID_PAYMENT_METHODS_SET,
	VALID_TIME_PERIODS_SET,
} from '@shared/constants';

export function isTimePeriod(value: string): value is TimePeriod {
	return VALID_TIME_PERIODS_SET.has(value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
	return VALID_PAYMENT_METHODS_SET.has(value);
}

export function isLeaderboardPeriod(value: string): value is LeaderboardPeriod {
	return VALID_LEADERBOARD_PERIODS_SET.has(value);
}
