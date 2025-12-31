/**
 * Multiplayer Service
 *
 * @module MultiplayerService
 * @description WebSocket client service for multiplayer simultaneous trivia games
 * @used_by client/src/hooks/useMultiplayer.ts, client/src/views/multiplayer
 */
import { io, Socket } from 'socket.io-client';

import type { CreateRoomConfig } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { ApiConfig, clientLogger as logger } from '@/services';

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
	private isConnecting = false;
	private pendingListeners: Array<{ event: string; callback: (data: unknown) => void }> = [];

	/**
	 * Connect to multiplayer WebSocket server
	 * @param token JWT authentication token
	 * @returns Socket instance
	 */
	connect(token: string): Socket {
		// Check if already connected and socket exists
		if (this.socket && this.socket.connected) {
			logger.gameInfo('Multiplayer service already connected, reusing socket');
			// Register any pending listeners
			while (this.pendingListeners.length > 0) {
				const listener = this.pendingListeners.shift();
				if (listener) {
					const { event, callback } = listener;
					this.socket.on(event, callback);
				}
			}
			return this.socket;
		}

		// Check if socket exists but disconnected - try to reconnect
		if (this.socket && !this.socket.connected) {
			logger.gameInfo('Multiplayer socket exists but disconnected, reconnecting');
			// Register any pending listeners
			while (this.pendingListeners.length > 0) {
				const listener = this.pendingListeners.shift();
				if (listener) {
					const { event, callback } = listener;
					this.socket.on(event, callback);
				}
			}
			this.socket.connect();
			return this.socket;
		}

		// Prevent multiple simultaneous connection attempts
		if (this.isConnecting) {
			logger.gameInfo('Connection already in progress in service');
			if (this.socket) {
				return this.socket;
			}
		}

		this.isConnecting = true;
		logger.gameInfo('Creating new multiplayer WebSocket connection');

		const serverUrl = ApiConfig.getBaseUrl();
		// Convert HTTP/HTTPS URL to WebSocket URL
		const wsProtocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
		const wsUrl = serverUrl.replace(/^https?:\/\//, '').split('/')[0];

		// Clean up old listeners before creating new socket
		if (this.socket) {
			this.removeAllListeners();
		}

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

		// Register any pending listeners that were set up before socket was created
		while (this.pendingListeners.length > 0) {
			const listener = this.pendingListeners.shift();
			if (listener) {
				const { event, callback } = listener;
				this.socket.on(event, callback);
			}
		}

		this.isConnecting = false;

		return this.socket;
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect(): void {
		if (this.socket) {
			logger.gameInfo('Disconnecting multiplayer socket');
			this.removeAllListeners();
			this.socket.disconnect();
			this.socket = null;
			this.reconnectAttempts = 0;
			this.isConnecting = false;
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
	 * Remove all event listeners from socket
	 */
	private removeAllListeners(): void {
		if (!this.socket) return;

		logger.gameInfo('Removing all multiplayer event listeners');

		// Remove connection event listeners
		this.socket.off('connect');
		this.socket.off('disconnect');
		this.socket.off('connect_error');
		this.socket.off('error');

		// Remove game event listeners
		this.socket.off('room-created');
		this.socket.off('room-joined');
		this.socket.off('room-left');
		this.socket.off('player-joined');
		this.socket.off('player-left');
		this.socket.off('game-started');
		this.socket.off('question-started');
		this.socket.off('answer-received');
		this.socket.off('question-ended');
		this.socket.off('game-ended');
		this.socket.off('leaderboard-update');
		this.socket.off('room-updated');
	}

	/**
	 * Setup event handlers
	 */
	private setupEventHandlers(): void {
		if (!this.socket) return;

		logger.gameInfo('Setting up multiplayer socket event handlers');

		this.socket.on('connect', () => {
			logger.gameInfo('Connected to multiplayer server');
			this.reconnectAttempts = 0;
			this.isConnecting = false;
		});

		this.socket.on('disconnect', reason => {
			logger.gameError('Disconnected from multiplayer server', {
				reason,
			});
			this.isConnecting = false;
		});

		this.socket.on('connect_error', error => {
			logger.gameError('Failed to connect to multiplayer server', {
				error: getErrorMessage(error),
			});
			this.reconnectAttempts++;
			this.isConnecting = false;
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
	 * @param eventListener Event listener with event name and callback
	 */
	on(eventListener: { event: string; callback: (data: unknown) => void }): void {
		if (!this.socket) {
			// Store listener in queue to be registered when socket is created
			// Socket.io provides data as unknown at runtime
			const wrappedCallback = (data: unknown): void => {
				eventListener.callback(data);
			};
			this.pendingListeners.push({ event: eventListener.event, callback: wrappedCallback });
			return;
		}
		// When socket exists, register directly
		// Socket.io's on method accepts (event: string, callback: (data: unknown) => void)
		const socketCallback = (data: unknown): void => {
			eventListener.callback(data);
		};
		this.socket.on(eventListener.event, socketCallback);
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
	createRoom(config: CreateRoomConfig): void {
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
	onRoomCreated(callback: (data: unknown) => void): void {
		this.on({
			event: 'room-created',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to room joined event
	 * @param callback Event handler
	 */
	onRoomJoined(callback: (data: unknown) => void): void {
		this.on({
			event: 'room-joined',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to room left event
	 * @param callback Event handler
	 */
	onRoomLeft(callback: (data: unknown) => void): void {
		this.on({
			event: 'room-left',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to player joined event
	 * @param callback Event handler
	 */
	onPlayerJoined(callback: (event: unknown) => void): void {
		this.on({
			event: 'player-joined',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to player left event
	 * @param callback Event handler
	 */
	onPlayerLeft(callback: (event: unknown) => void): void {
		this.on({
			event: 'player-left',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to game started event
	 * @param callback Event handler
	 */
	onGameStarted(callback: (event: unknown) => void): void {
		this.on({
			event: 'game-started',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to question started event
	 * @param callback Event handler
	 */
	onQuestionStarted(callback: (event: unknown) => void): void {
		this.on({
			event: 'question-started',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to answer received event
	 * @param callback Event handler
	 */
	onAnswerReceived(callback: (event: unknown) => void): void {
		this.on({
			event: 'answer-received',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to question ended event
	 * @param callback Event handler
	 */
	onQuestionEnded(callback: (event: unknown) => void): void {
		this.on({
			event: 'question-ended',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to game ended event
	 * @param callback Event handler
	 */
	onGameEnded(callback: (event: unknown) => void): void {
		this.on({
			event: 'game-ended',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to leaderboard update event
	 * @param callback Event handler
	 */
	onLeaderboardUpdate(callback: (event: unknown) => void): void {
		this.on({
			event: 'leaderboard-update',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to room updated event
	 * @param callback Event handler
	 */
	onRoomUpdated(callback: (event: unknown) => void): void {
		this.on({
			event: 'room-updated',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	/**
	 * Listen to error event
	 * @param callback Event handler
	 */
	onError(callback: (error: unknown) => void): void {
		this.on({
			event: 'error',
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}
}

export const multiplayerService = new MultiplayerService();
