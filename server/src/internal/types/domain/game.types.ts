import type { Socket } from 'socket.io';

import { DifficultyLevel } from '@shared/constants';
/**
 * HTTP response for submitting an answer
 */
import type { GameDifficulty, MultiplayerRoom, Player, TriviaQuestionInput } from '@shared/types';

import type { BaseCacheEntry } from '@internal/types';

/**
 * Multiplayer Types
 */

/**
 * Room timer interface for managing question timers
 * @interface RoomTimer
 * @description Stores interval and timeout IDs for a room's question timer
 */
export interface RoomTimer {
	checkInterval: NodeJS.Timeout;
	timeoutId: NodeJS.Timeout;
}

/**
 * Room timer map type
 * @type RoomTimerMap
 * @description Maps room IDs to their timers
 */
export type RoomTimerMap = Record<string, RoomTimer>;

/**
 * Socket data interface for WebSocket connections
 * @interface SocketData
 * @description Typed structure for Socket.data in multiplayer gateway
 */
export interface SocketData {
	user?: {
		sub: string;
		email?: string;
		role?: string;
		[key: string]: unknown;
	};
	userId?: string;
	userRole?: string;
	roomId?: string;
}

/**
 * Extended Socket type with typed data
 * @type TypedSocket
 * @description Socket with typed data property
 */
export type TypedSocket = Socket & {
	data: SocketData;
};

/**
 * HTTP response describing multiplayer connection info
 */
export interface MultiplayerConnectionInfo {
	websocketUrl: string;
	namespace: string;
	transports: string[];
	requiresAuthentication: boolean;
	supportsSocketIo: boolean;
	description: string;
}

/**
 * Base HTTP response containing a room
 */
export interface RoomHttpResponse {
	room: MultiplayerRoom;
}

/**
 * HTTP response when leaving a room
 */
export interface LeaveRoomHttpResponse {
	status: 'room-closed' | 'player-left';
	remainingPlayers: number;
	room: MultiplayerRoom | null;
}

export type SubmitAnswerHttpResponse = {
	roomId: string;
	data: {
		userId: string;
		questionId: string;
		isCorrect: boolean;
		scoreEarned: number;
		leaderboard?: Player[];
	};
};

/**
 * Trivia Types
 */

/**
 * Trivia question metadata interface (server-side)
 * @interface TriviaQuestionMetadata
 * @description Provides additional context for generated questions used internally
 */
export interface TriviaQuestionMetadata {
	actualDifficulty: GameDifficulty;
	gameQuestionCount: number;
	customDifficultyMultiplier: number;
	mappedDifficulty: DifficultyLevel;
}

/**
 * Server-side trivia question input type
 * @type ServerTriviaQuestionInput
 * @description Alias for TriviaQuestionInput with DifficultyLevel constraint
 */
export type ServerTriviaQuestionInput = TriviaQuestionInput<DifficultyLevel>;

/**
 * Cached question entry for provider-level caches (server-only)
 * @interface QuestionCacheEntry
 * @description Cache entry structure for trivia questions
 */
export interface QuestionCacheEntry extends BaseCacheEntry {
	question: ServerTriviaQuestionInput;
	accessCount: number;
}

/**
 * Question cache map type
 * @type QuestionCacheMap
 * @description Maps question keys to cache entries
 */
export type QuestionCacheMap = Record<string, QuestionCacheEntry>;

/**
 * User game achievements
 * @interface Achievement
 * @description Achievement-related types for server-side entities
 * @used_by server/src/internal/entities/user.entity.ts
 */
export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt?: string;
	progress?: number;
	maxProgress?: number;
	category: string;
	points: number;
}

/**
 * Saved game configuration
 * @interface SavedGameConfiguration
 * @description Configuration for saved game settings
 * @used_by server/src/features/game/game.service.ts
 */
export interface SavedGameConfiguration extends Record<string, unknown> {
	defaultDifficulty: GameDifficulty;
	defaultTopic: string;
	questionsPerRequest: number;
	timeLimit: number;
	soundEnabled: boolean;
}

/**
 * Streak data for leaderboard calculations
 * @interface StreakData
 * @description Streak data structure for leaderboard service
 * @used_by server/src/features/leaderboard/leaderboard.service.ts
 */
export interface StreakData {
	current: number;
	best: number;
}
