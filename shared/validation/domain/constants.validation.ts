/**
 * Constants Validation
 *
 * @module ConstantsValidation
 * @description Type guards for enum constants (TimePeriod, PaymentMethod, LeaderboardPeriod)
 * @used_by client/src/components, server/src/features
 */

import {
	LeaderboardPeriod,
	PaymentMethod,
	TimePeriod,
	VALID_LEADERBOARD_PERIODS,
	VALID_PAYMENT_METHODS,
	VALID_TIME_PERIODS,
} from '@shared/constants';

/**
 * Type guard for TimePeriod enum
 * @param value String value to check
 * @returns True if value is a valid TimePeriod
 */
export function isTimePeriod(value: string): value is TimePeriod {
	return VALID_TIME_PERIODS.some(period => period === value);
}

/**
 * Type guard for PaymentMethod enum
 * @param value String value to check
 * @returns True if value is a valid PaymentMethod
 */
export function isPaymentMethod(value: string): value is PaymentMethod {
	return VALID_PAYMENT_METHODS.some(method => method === value);
}

/**
 * Type guard for LeaderboardPeriod enum
 * @param value String value to check
 * @returns True if value is a valid LeaderboardPeriod
 */
export function isLeaderboardPeriod(value: string): value is LeaderboardPeriod {
	return VALID_LEADERBOARD_PERIODS.some(period => period === value);
}
