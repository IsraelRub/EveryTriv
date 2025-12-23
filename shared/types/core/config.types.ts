/**
 * Configuration types for EveryTriv
 * Shared between client and server
 *
 * @module ConfigTypes
 * @description Configuration type definitions
 */

/**
 * Validation configuration type
 * @type ValidationConfig
 * @description Type for validation configuration including debounce delays, hook config, limits, and thresholds
 */
export type ValidationConfig = {
	debounceDelays: {
		QUICK: number;
		STANDARD: number;
		LANGUAGE_CHECK: number;
		ASYNC_VALIDATION: number;
	};
	hookConfig: {
		DEFAULT_DEBOUNCE_MS: number;
		DEFAULT_VALIDATE_ON_MOUNT: boolean;
		DEFAULT_REQUIRED: boolean;
	};
	limits: {
		PASSWORD: {
			MIN_LENGTH: number;
			MAX_LENGTH: number;
		};
		EMAIL: {
			MAX_LENGTH: number;
		};
		TOPIC: {
			MIN_LENGTH: number;
			MAX_LENGTH: number;
		};
		CUSTOM_DIFFICULTY: {
			MIN_LENGTH: number;
			MAX_LENGTH: number;
		};
		FIRST_NAME: {
			MIN_LENGTH: number;
			MAX_LENGTH: number;
		};
		LAST_NAME: {
			MIN_LENGTH: number;
			MAX_LENGTH: number;
		};
		QUESTIONS: {
			MIN: number;
			MAX: number;
			STEP: number;
			UNLIMITED: number;
		};
		ANSWER_COUNT: {
			MIN: number;
			MAX: number;
			STEP: number;
			DEFAULT: number;
		};
		TIME_LIMIT: {
			MIN: number;
			MAX: number;
			STEP: number;
		};
		CREDITS: {
			MIN: number;
			MAX: number;
		};
		REASON: {
			MAX_LENGTH: number;
		};
		LEADERBOARD: {
			MIN: number;
			MAX: number;
		};
		PLAYERS: {
			MIN: number;
			MAX: number;
		};
		GAME_ANSWER: {
			MAX_LENGTH: number;
		};
		TRIVIA_QUESTION: {
			MIN_LENGTH: number;
			MAX_LENGTH: number;
		};
		TRIVIA_ANSWER: {
			MAX_LENGTH: number;
		};
	};
	thresholds: {
		EXCESSIVE_PUNCTUATION: number;
		EXCESSIVE_CAPITALIZATION: number;
	};
};

/**
 * Localhost configuration type
 * @type LocalhostConfig
 * @description Type for localhost configuration including URLs, ports, and hosts
 */
export type LocalhostConfig = {
	urls: {
		SERVER: string;
		CLIENT: string;
		PGADMIN_URL: string;
		REDIS_COMMANDER_URL: string;
		WEBDB_URL: string;
	};
	ports: {
		SERVER: number;
		CLIENT: number;
		DATABASE: number;
		REDIS: number;
		PGADMIN: number;
		REDIS_COMMANDER: number;
		WEBDB: number;
	};
	hosts: {
		DATABASE: string;
		REDIS: string;
		DOMAIN: string;
	};
};
