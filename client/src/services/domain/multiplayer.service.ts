import { io, Socket } from 'socket.io-client';

import { MultiplayerEvent, TIME_PERIODS_MS } from '@shared/constants';
import type { CreateRoomConfig } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { ApiConfig, clientLogger as logger } from '@/services';

class MultiplayerService {
	private socket: Socket | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private readonly reconnectDelay = TIME_PERIODS_MS.SECOND;
	private isConnecting = false;
	private pendingListeners: { event: string; callback: (data: unknown) => void }[] = [];
	private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

	connect(token: string): Socket {
		// Check if already connected and socket exists
		if (this.socket?.connected) {
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

	disconnect(): void {
		if (this.socket) {
			logger.gameInfo('Disconnecting multiplayer socket');
			this.cleanup();
			this.socket.disconnect();
			this.socket = null;
			this.reconnectAttempts = 0;
			this.isConnecting = false;
		}
	}

	isConnected(): boolean {
		return this.socket?.connected ?? false;
	}

	private removeAllListeners(): void {
		if (!this.socket) return;

		logger.gameInfo('Removing all multiplayer event listeners');

		this.socket.off(MultiplayerEvent.CONNECT);
		this.socket.off(MultiplayerEvent.DISCONNECT);
		this.socket.off(MultiplayerEvent.CONNECT_ERROR);
		this.socket.off(MultiplayerEvent.ERROR);
		this.socket.off(MultiplayerEvent.ROOM_CREATED);
		this.socket.off(MultiplayerEvent.ROOM_JOINED);
		this.socket.off(MultiplayerEvent.ROOM_LEFT);
		this.socket.off(MultiplayerEvent.PLAYER_JOINED);
		this.socket.off(MultiplayerEvent.PLAYER_LEFT);
		this.socket.off(MultiplayerEvent.GAME_STARTED);
		this.socket.off(MultiplayerEvent.QUESTION_STARTED);
		this.socket.off(MultiplayerEvent.ANSWER_RECEIVED);
		this.socket.off(MultiplayerEvent.QUESTION_ENDED);
		this.socket.off(MultiplayerEvent.GAME_ENDED);
		this.socket.off(MultiplayerEvent.LEADERBOARD_UPDATE);
		this.socket.off(MultiplayerEvent.ROOM_UPDATED);
	}

	cleanup(): void {
		if (this.socket) {
			this.listeners.forEach((callbacks, event) => {
				callbacks.forEach(callback => {
					this.socket?.off(event, callback);
				});
			});
		}

		this.removeAllListeners();
		this.listeners.clear();
		this.pendingListeners = [];
	}

	private setupEventHandlers(): void {
		if (!this.socket) return;

		logger.gameInfo('Setting up multiplayer socket event handlers');

		this.socket.on(MultiplayerEvent.CONNECT, () => {
			logger.gameInfo('Connected to multiplayer server');
			this.reconnectAttempts = 0;
			this.isConnecting = false;
		});

		this.socket.on(MultiplayerEvent.DISCONNECT, reason => {
			logger.gameError('Disconnected from multiplayer server', {
				reason,
			});
			this.isConnecting = false;
		});

		this.socket.on(MultiplayerEvent.CONNECT_ERROR, error => {
			logger.gameError('Failed to connect to multiplayer server', {
				errorInfo: { message: getErrorMessage(error) },
			});
			this.reconnectAttempts++;
			this.isConnecting = false;
		});

		this.socket.on(MultiplayerEvent.ERROR, (error: { message: string }) => {
			logger.gameError('Multiplayer server error', {
				errorInfo: { message: error.message },
			});
		});
	}

	emit(event: string, data: unknown): void {
		if (!this.socket?.connected) {
			logger.gameError('Cannot emit event - not connected', { eventName: event });
			return;
		}
		this.socket.emit(event, data);
	}

	on(eventListener: { event: string; callback: (data: unknown) => void }): void {
		const wrappedCallback = (data: unknown): void => {
			eventListener.callback(data);
		};

		if (!this.socket) {
			this.pendingListeners.push({ event: eventListener.event, callback: wrappedCallback });
			return;
		}

		if (!this.listeners.has(eventListener.event)) {
			this.listeners.set(eventListener.event, new Set());
		}
		this.listeners.get(eventListener.event)?.add(wrappedCallback);
		this.socket.on(eventListener.event, wrappedCallback);
	}

	off(event: string, callback?: (data: unknown) => void): void {
		if (!this.socket) return;

		if (callback) {
			this.socket.off(event, callback);
			const callbacks = this.listeners.get(event);
			if (callbacks) {
				callbacks.delete(callback);
				if (callbacks.size === 0) {
					this.listeners.delete(event);
				}
			}
		} else {
			const callbacks = this.listeners.get(event);
			if (callbacks) {
				callbacks.forEach(cb => {
					this.socket?.off(event, cb);
				});
				this.listeners.delete(event);
			} else {
				this.socket.off(event);
			}
		}
	}

	createRoom(config: CreateRoomConfig): void {
		this.emit(MultiplayerEvent.CREATE_ROOM, config);
	}

	joinRoom(roomId: string): void {
		this.emit(MultiplayerEvent.JOIN_ROOM, { roomId });
	}

	leaveRoom(roomId: string): void {
		this.emit(MultiplayerEvent.LEAVE_ROOM, { roomId });
	}

	startGame(roomId: string): void {
		this.emit(MultiplayerEvent.START_GAME, { roomId });
	}

	submitAnswer(roomId: string, questionId: string, answer: number, timeSpent: number): void {
		this.emit(MultiplayerEvent.SUBMIT_ANSWER, {
			roomId,
			questionId,
			answer,
			timeSpent,
		});
	}

	onRoomCreated(callback: (data: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.ROOM_CREATED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onRoomJoined(callback: (data: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.ROOM_JOINED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onRoomLeft(callback: (data: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.ROOM_LEFT,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onPlayerJoined(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.PLAYER_JOINED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onPlayerLeft(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.PLAYER_LEFT,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onGameStarted(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.GAME_STARTED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onQuestionStarted(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.QUESTION_STARTED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onAnswerReceived(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.ANSWER_RECEIVED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onQuestionEnded(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.QUESTION_ENDED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onGameEnded(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.GAME_ENDED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onLeaderboardUpdate(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.LEADERBOARD_UPDATE,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onRoomUpdated(callback: (event: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.ROOM_UPDATED,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}

	onError(callback: (error: unknown) => void): void {
		this.on({
			event: MultiplayerEvent.ERROR,
			callback: (data: unknown) => {
				callback(data);
			},
		});
	}
}

export const multiplayerService = new MultiplayerService();
