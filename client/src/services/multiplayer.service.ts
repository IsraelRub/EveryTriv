/**
 * Multiplayer Service
 *
 * @module MultiplayerService
 * @description WebSocket client service for multiplayer simultaneous trivia games
 * @used_by client/src/hooks/useMultiplayer.ts, client/src/views/multiplayer
 */
import { io, Socket } from 'socket.io-client';

import { clientLogger as logger } from '@shared/services';
import type {
	AnswerReceivedEvent,
	GameEndedEvent,
	GameStartedEvent,
	LeaderboardUpdateEvent,
	PlayerJoinedEvent,
	PlayerLeftEvent,
	QuestionEndedEvent,
	QuestionStartedEvent,
	RoomUpdatedEvent,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { ApiConfig } from './api.service';

/**
 * WebSocket client service for multiplayer games
 * @class MultiplayerService
 * @description Manages WebSocket connection and events for multiplayer games
 */
class MultiplayerService {
	private socket: Socket | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private readonly reconnectDelay = 1000;

	/**
	 * Connect to multiplayer WebSocket server
	 * @param token JWT authentication token
	 * @returns Socket instance
	 */
	connect(token: string): Socket {
		if (this.socket?.connected) {
			return this.socket;
		}

		const serverUrl = ApiConfig.getBaseUrl();
		// Convert HTTP/HTTPS URL to WebSocket URL
		const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
		const wsUrl = serverUrl.replace(/^https?:\/\//, '').split('/')[0];

		this.socket = io(`${wsProtocol}://${wsUrl}/multiplayer`, {
			auth: {
				token,
			},
			query: {
				token,
			},
			transports: ['websocket'],
			reconnection: true,
			reconnectionAttempts: this.maxReconnectAttempts,
			reconnectionDelay: this.reconnectDelay,
		});

		this.setupEventHandlers();

		return this.socket;
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.reconnectAttempts = 0;
		}
	}

	/**
	 * Check if connected
	 * @returns True if connected
	 */
	isConnected(): boolean {
		return this.socket?.connected || false;
	}

	/**
	 * Setup event handlers
	 */
	private setupEventHandlers(): void {
		if (!this.socket) return;

		this.socket.on('connect', () => {
			logger.gameInfo('Connected to multiplayer server');
			this.reconnectAttempts = 0;
		});

		this.socket.on('disconnect', reason => {
			logger.gameError('Disconnected from multiplayer server', {
				reason,
			});
		});

		this.socket.on('connect_error', error => {
			logger.gameError('Failed to connect to multiplayer server', {
				error: getErrorMessage(error),
			});
			this.reconnectAttempts++;
		});

		this.socket.on('error', (error: { message: string }) => {
			logger.gameError('Multiplayer server error', {
				error: error.message,
			});
		});
	}

	/**
	 * Emit event to server
	 * @param event Event name
	 * @param data Event data
	 */
	emit(event: string, data: unknown): void {
		if (!this.socket?.connected) {
			logger.gameError('Cannot emit event - not connected', { eventName: event });
			return;
		}
		this.socket.emit(event, data);
	}

	/**
	 * Listen to server event
	 * @param event Event name
	 * @param callback Event handler
	 */
	on<T = unknown>(event: string, callback: (data: T) => void): void {
		if (!this.socket) {
			logger.gameError('Cannot listen to event - socket not initialized', { eventName: event });
			return;
		}
		this.socket.on(event, callback);
	}

	/**
	 * Remove event listener
	 * @param event Event name
	 * @param callback Event handler (optional)
	 */
	off(event: string, callback?: (data: unknown) => void): void {
		if (!this.socket) return;
		if (callback) {
			this.socket.off(event, callback);
		} else {
			this.socket.off(event);
		}
	}

	/**
	 * Create a room
	 * @param config Room configuration
	 */
	createRoom(config: {
		topic: string;
		difficulty: string;
		requestedQuestions: number;
		maxPlayers: number;
		gameMode: string;
	}): void {
		this.emit('create-room', config);
	}

	/**
	 * Join a room
	 * @param roomId Room ID
	 */
	joinRoom(roomId: string): void {
		this.emit('join-room', { roomId });
	}

	/**
	 * Leave a room
	 * @param roomId Room ID
	 */
	leaveRoom(roomId: string): void {
		this.emit('leave-room', { roomId });
	}

	/**
	 * Start the game (host only)
	 * @param roomId Room ID
	 */
	startGame(roomId: string): void {
		this.emit('start-game', { roomId });
	}

	/**
	 * Submit an answer
	 * @param roomId Room ID
	 * @param questionId Question ID
	 * @param answer Answer index
	 * @param timeSpent Time spent in seconds
	 */
	submitAnswer(roomId: string, questionId: string, answer: number, timeSpent: number): void {
		this.emit('submit-answer', {
			roomId,
			questionId,
			answer,
			timeSpent,
		});
	}

	/**
	 * Listen to room created event
	 * @param callback Event handler
	 */
	onRoomCreated(callback: (data: { room: unknown; code: string }) => void): void {
		this.on('room-created', callback);
	}

	/**
	 * Listen to room joined event
	 * @param callback Event handler
	 */
	onRoomJoined(callback: (data: { room: unknown; gameState?: unknown }) => void): void {
		this.on('room-joined', callback);
	}

	/**
	 * Listen to room left event
	 * @param callback Event handler
	 */
	onRoomLeft(callback: (data: { roomId: string }) => void): void {
		this.on('room-left', callback);
	}

	/**
	 * Listen to player joined event
	 * @param callback Event handler
	 */
	onPlayerJoined(callback: (event: PlayerJoinedEvent) => void): void {
		this.on<PlayerJoinedEvent>('player-joined', callback);
	}

	/**
	 * Listen to player left event
	 * @param callback Event handler
	 */
	onPlayerLeft(callback: (event: PlayerLeftEvent) => void): void {
		this.on<PlayerLeftEvent>('player-left', callback);
	}

	/**
	 * Listen to game started event
	 * @param callback Event handler
	 */
	onGameStarted(callback: (event: GameStartedEvent) => void): void {
		this.on<GameStartedEvent>('game-started', callback);
	}

	/**
	 * Listen to question started event
	 * @param callback Event handler
	 */
	onQuestionStarted(callback: (event: QuestionStartedEvent) => void): void {
		this.on<QuestionStartedEvent>('question-started', callback);
	}

	/**
	 * Listen to answer received event
	 * @param callback Event handler
	 */
	onAnswerReceived(callback: (event: AnswerReceivedEvent) => void): void {
		this.on<AnswerReceivedEvent>('answer-received', callback);
	}

	/**
	 * Listen to question ended event
	 * @param callback Event handler
	 */
	onQuestionEnded(callback: (event: QuestionEndedEvent) => void): void {
		this.on<QuestionEndedEvent>('question-ended', callback);
	}

	/**
	 * Listen to game ended event
	 * @param callback Event handler
	 */
	onGameEnded(callback: (event: GameEndedEvent) => void): void {
		this.on<GameEndedEvent>('game-ended', callback);
	}

	/**
	 * Listen to leaderboard update event
	 * @param callback Event handler
	 */
	onLeaderboardUpdate(callback: (event: LeaderboardUpdateEvent) => void): void {
		this.on<LeaderboardUpdateEvent>('leaderboard-update', callback);
	}

	/**
	 * Listen to room updated event
	 * @param callback Event handler
	 */
	onRoomUpdated(callback: (event: RoomUpdatedEvent) => void): void {
		this.on<RoomUpdatedEvent>('room-updated', callback);
	}

	/**
	 * Listen to error event
	 * @param callback Event handler
	 */
	onError(callback: (error: { message: string; code?: string }) => void): void {
		this.on<{ message: string; code?: string }>('error', callback);
	}
}

export const multiplayerService = new MultiplayerService();
