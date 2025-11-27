import type { Socket } from 'socket.io';

import type { GameState, MultiplayerRoom, Player } from '@shared/types';

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
 * Room search filters for finding available rooms
 * @interface RoomSearchFilters
 * @description Filters for searching available multiplayer rooms
 */
export interface RoomSearchFilters {
	topic?: string;
	difficulty?: string;
	maxPlayers?: number;
	status?: MultiplayerRoom['status'];
}

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
 * HTTP response when creating a room
 */
export interface CreateRoomHttpResponse {
	room: MultiplayerRoom;
	code: string;
}

/**
 * HTTP response when joining a room
 */
export interface JoinRoomHttpResponse {
	room: MultiplayerRoom;
}

/**
 * HTTP response when leaving a room
 */
export interface LeaveRoomHttpResponse {
	roomId: string;
	status: 'room-closed' | 'player-left';
	remainingPlayers: number;
	room?: MultiplayerRoom | null;
}

/**
 * HTTP response when starting a game
 */
export interface StartGameHttpResponse {
	room: MultiplayerRoom;
}

/**
 * HTTP response for submitting an answer
 */
export interface SubmitAnswerHttpResponse {
	roomId: string;
	questionId: string;
	isCorrect: boolean;
	scoreEarned: number;
	leaderboard: Player[];
}

/**
 * HTTP response for fetching room state
 */
export interface RoomStateHttpResponse {
	room: MultiplayerRoom;
	gameState: GameState;
}

/**
 * HTTP response for fetching room details
 */
export interface RoomDetailsHttpResponse {
	room: MultiplayerRoom;
}
