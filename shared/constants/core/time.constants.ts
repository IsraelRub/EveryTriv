// Time durations in seconds
const MINUTE = 60;

export const TIME_DURATIONS_SECONDS = {
	// Very short durations (for intervals, delays, animations)
	SECOND: 1,
	ONE_AND_HALF_SECONDS: 1.5,
	TWO_SECONDS: 2,
	THREE_SECONDS: 3,
	FIVE_SECONDS: 5,
	EIGHT_SECONDS: 8,
	TEN_SECONDS: 10,

	// Short durations
	THIRTY_SECONDS: 30,
	MINUTE: MINUTE,
	TWO_MINUTES: 2 * MINUTE,
	FIVE_MINUTES: 5 * MINUTE,
	TEN_MINUTES: 10 * MINUTE,
	FIFTEEN_MINUTES: 15 * MINUTE,
	THIRTY_MINUTES: 30 * MINUTE,

	// Medium durations
	HOUR: 60 * MINUTE,
	TWO_HOURS: 2 * 60 * MINUTE,

	// Long durations
	DAY: 24 * 60 * MINUTE,
	WEEK: 7 * 24 * 60 * MINUTE,
	MONTH: 30 * 24 * 60 * MINUTE,
	YEAR: 365 * 24 * 60 * MINUTE,
} as const;

// Time periods in milliseconds
// First, convert seconds-based durations to milliseconds
const millisecondsFromSeconds = Object.fromEntries(
	Object.entries(TIME_DURATIONS_SECONDS).map(([key, value]) => [key, value * 1000])
);

export const TIME_PERIODS_MS = {
	...millisecondsFromSeconds,
	// Very short durations in milliseconds (for delays, retries, exponential backoff)
	FIFTY_MILLISECONDS: 50,
	HUNDRED_MILLISECONDS: 100,
	TWO_HUNDRED_MILLISECONDS: 200,
	THREE_HUNDRED_MILLISECONDS: 300,
	FOUR_HUNDRED_MILLISECONDS: 400,
} as {
	readonly SECOND: number;
	readonly ONE_AND_HALF_SECONDS: number;
	readonly TWO_SECONDS: number;
	readonly THREE_SECONDS: number;
	readonly FIVE_SECONDS: number;
	readonly EIGHT_SECONDS: number;
	readonly TEN_SECONDS: number;
	readonly THIRTY_SECONDS: number;
	readonly MINUTE: number;
	readonly TWO_MINUTES: number;
	readonly FIVE_MINUTES: number;
	readonly TEN_MINUTES: number;
	readonly FIFTEEN_MINUTES: number;
	readonly THIRTY_MINUTES: number;
	readonly HOUR: number;
	readonly TWO_HOURS: number;
	readonly DAY: number;
	readonly WEEK: number;
	readonly MONTH: number;
	readonly YEAR: number;
	readonly FIFTY_MILLISECONDS: number;
	readonly HUNDRED_MILLISECONDS: number;
	readonly TWO_HUNDRED_MILLISECONDS: number;
	readonly THREE_HUNDRED_MILLISECONDS: number;
	readonly FOUR_HUNDRED_MILLISECONDS: number;
};
