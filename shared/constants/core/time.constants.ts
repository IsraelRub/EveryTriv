// Time durations in seconds
const MINUTE = 60;

// Used for: cache TTL, storage TTL, intervals, delays, animation durations (in seconds)
export const TIME_DURATIONS_SECONDS = {
	// Very short durations (for intervals, delays, animations)
	SECOND: 1,
	TWO_SECONDS: 2,
	THREE_SECONDS: 3,
	FIVE_SECONDS: 5,
	EIGHT_SECONDS: 8,

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
export const TIME_PERIODS_MS = Object.fromEntries(
	Object.entries(TIME_DURATIONS_SECONDS).map(([key, value]) => [key, value * 1000])
) as {
	readonly SECOND: number;
	readonly TWO_SECONDS: number;
	readonly THREE_SECONDS: number;
	readonly FIVE_SECONDS: number;
	readonly EIGHT_SECONDS: number;
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
};
