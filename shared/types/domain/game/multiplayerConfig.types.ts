/**
 * Multiplayer Configuration Types
 * @module MultiplayerConfigTypes
 * @description Type definitions for multiplayer game configuration
 */

/**
 * Multiplayer configuration interface
 * @interface MultiplayerConfig
 * @description Unified configuration for multiplayer game settings (constants only, validation limits are in VALIDATION_CONFIG)
 */
export interface MultiplayerConfig {
	MIN_PLAYERS: number;
	MAX_PLAYERS: number;
	DEFAULT_MAX_PLAYERS: number;
	TIME_PER_QUESTION: number;
	ROOM_TTL: number;
	DEFAULT_QUESTIONS_PER_REQUEST: number;
}
