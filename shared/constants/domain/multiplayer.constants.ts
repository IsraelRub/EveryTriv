/**
 * Multiplayer Game Constants
 *
 * @module MultiplayerConstants
 * @description Constants for multiplayer trivia games
 * @used_by server/src/features/game/multiplayer, client/src/views/multiplayer
 */

/**
 * Multiplayer room configuration constants
 */
export const MULTIPLAYER_CONSTANTS = {
	/**
	 * Minimum number of players required in a room
	 */
	MIN_PLAYERS: 2,

	/**
	 * Maximum number of players allowed in a room
	 */
	MAX_PLAYERS: 4,

	/**
	 * Default number of players for new rooms
	 */
	DEFAULT_MAX_PLAYERS: 4,

	/**
	 * Time per question in seconds for multiplayer games
	 */
	TIME_PER_QUESTION: 30,

	/**
	 * Room TTL (Time To Live) in seconds
	 * Rooms expire after this duration of inactivity
	 */
	ROOM_TTL: 3600, // 1 hour

	/**
	 * Default number of questions per request for multiplayer rooms
	 */
	DEFAULT_QUESTIONS_PER_REQUEST: 10,
} as const;

/**
 * Multiplayer room validation limits
 */
export const MULTIPLAYER_VALIDATION = {
	MAX_PLAYERS: {
		MIN: MULTIPLAYER_CONSTANTS.MIN_PLAYERS,
		MAX: MULTIPLAYER_CONSTANTS.MAX_PLAYERS,
	},
} as const;
