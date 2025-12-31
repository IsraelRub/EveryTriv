/**
 * Time Constants for EveryTriv
 *
 * @module TimeConstants
 * @description Time conversion constants in milliseconds for date calculations and time-based operations
 * @author EveryTriv Team
 * @used_by server/src/features, client/src/utils
 */

/**
 * Time period constants (in milliseconds)
 * Used for date calculations, cache TTL, time-based filtering, and React Query configurations
 */

const SECOND_IN_MS = 1000;

export const TIME_PERIODS_MS = {
	SECOND: SECOND_IN_MS,
	TWO_SECONDS: 2 * SECOND_IN_MS,
	MINUTE: 60 * SECOND_IN_MS,
	TWO_MINUTES: 2 * 60 * SECOND_IN_MS,
	FIVE_MINUTES: 5 * 60 * SECOND_IN_MS,
	TEN_MINUTES: 10 * 60 * SECOND_IN_MS,
	THIRTY_MINUTES: 30 * 60 * SECOND_IN_MS,
	HOUR: 60 * 60 * SECOND_IN_MS,
	DAY: 24 * 60 * 60 * SECOND_IN_MS,
	WEEK: 7 * 24 * 60 * 60 * SECOND_IN_MS,
	MONTH: 30 * 24 * 60 * 60 * SECOND_IN_MS,
	YEAR: 365 * 24 * 60 * 60 * SECOND_IN_MS,
} as const;

