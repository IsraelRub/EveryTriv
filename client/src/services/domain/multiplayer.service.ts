import { io, Socket } from 'socket.io-client';

import { MultiplayerEvent } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { MULTIPLAYER_WEBSOCKET_RECONNECT } from '@/constants';
import type {
	MultiplayerErrorMessage,
	MultiplayerEventCallback,
	MultiplayerEventStream,
	MultiplayerUnsubscribe,
} from '@/types';
import { ApiConfig, clientLogger as logger } from '@/services';

class MultiplayerService {
	private socket: Socket | null = null;
	private reconnectAttempts = 0;
	private isConnecting = false;
	private pendingListeners: Array<{ event: string; callback: MultiplayerEventCallback }> = [];
	private listeners: Map<string, Set<MultiplayerEventCallback>> = new Map();

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

		const serverUrl = ApiConfig.baseUrl;
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
			reconnectionAttempts: MULTIPLAYER_WEBSOCKET_RECONNECT.MAX_ATTEMPTS,
			reconnectionDelay: MULTIPLAYER_WEBSOCKET_RECONNECT.BASE_DELAY_MS,
			reconnectionDelayMax: MULTIPLAYER_WEBSOCKET_RECONNECT.MAX_DELAY_MS,
			randomizationFactor: 0.5,
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

	get isConnected(): boolean {
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

		this.socket.on(MultiplayerEvent.ERROR, (error: MultiplayerErrorMessage) => {
			logger.gameError('Multiplayer server error', {
				errorInfo: { message: getErrorMessage(error) },
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

	stream(event: string): MultiplayerEventStream {
		return {
			subscribe: (callback: MultiplayerEventCallback): MultiplayerUnsubscribe => {
				return this.attachListener(event, callback);
			},
		};
	}

	private attachListener(event: string, callback: MultiplayerEventCallback): MultiplayerUnsubscribe {
		let isActive = true;
		const wrappedCallback: MultiplayerEventCallback = (data: unknown): void => {
			if (isActive) {
				callback(data);
			}
		};

		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)?.add(wrappedCallback);

		if (!this.socket) {
			this.pendingListeners.push({ event, callback: wrappedCallback });
		} else {
			this.socket.on(event, wrappedCallback);
		}

		return () => {
			if (!isActive) {
				return;
			}
			isActive = false;
			this.removeListener(event, wrappedCallback);
		};
	}

	clearAppListeners(): void {
		this.pendingListeners = [];
		if (!this.socket) {
			return;
		}
		this.listeners.forEach((callbacks, event) => {
			callbacks.forEach(cb => {
				this.socket?.off(event, cb);
			});
		});
		this.listeners.clear();
	}

	private removeListener(event: string, callback: MultiplayerEventCallback): void {
		this.pendingListeners = this.pendingListeners.filter(
			listener => !(listener.event === event && listener.callback === callback)
		);
		this.socket?.off(event, callback);
		const callbacks = this.listeners.get(event);
		if (!callbacks) {
			return;
		}
		callbacks.delete(callback);
		if (callbacks.size === 0) {
			this.listeners.delete(event);
		}
	}
}

export const multiplayerService = new MultiplayerService();
