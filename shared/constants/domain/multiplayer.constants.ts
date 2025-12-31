/**
 * Multiplayer Game Constants
 *
 * @module MultiplayerConstants
 * @description Constants for multiplayer trivia games
 * @used_by server/src/features/game/multiplayer, client/src/views/multiplayer
 */


/**
 * Room status enum
 * @enum RoomStatus
 * @description Status of a multiplayer room
 */
export enum RoomStatus {
	WAITING = 'waiting',
	STARTING = 'starting',
	PLAYING = 'playing',
	FINISHED = 'finished',
	CANCELLED = 'cancelled',
}

/**
 * Player status enum
 * @enum PlayerStatus
 * @description Status of a player in multiplayer game
 */
export enum PlayerStatus {
	WAITING = 'waiting',
	READY = 'ready',
	PLAYING = 'playing',
	ANSWERED = 'answered',
	DISCONNECTED = 'disconnected',
	FINISHED = 'finished',
}
