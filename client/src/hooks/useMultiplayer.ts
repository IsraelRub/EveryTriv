/**
 * Multiplayer Hook
 *
 * @module useMultiplayer
 * @description Hook for managing multiplayer game WebSocket connection and state
 * @used_by client/src/views/multiplayer
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { clientLogger as logger } from '@shared/services';
import type {
	AnswerReceivedEvent,
	CreateRoomConfig,
	GameEndedEvent,
	GameStartedEvent,
	GameState,
	LeaderboardUpdateEvent,
	MultiplayerRoom,
	Player,
	PlayerJoinedEvent,
	PlayerLeftEvent,
	QuestionEndedEvent,
	QuestionStartedEvent,
	RoomStatus,
	RoomUpdatedEvent,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { authService, multiplayerService } from '../services';
import type { RootState } from '../types';
import { useAppSelector } from './useRedux';

/**
 * Hook for multiplayer game functionality
 * @returns Multiplayer game state and methods
 */
export const useMultiplayer = () => {
	const [isConnected, setIsConnected] = useState(false);
	const [room, setRoom] = useState<MultiplayerRoom | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [leaderboard, setLeaderboard] = useState<Player[]>([]);
	const [roomCode, setRoomCode] = useState<string | null>(null);
	const tokenRef = useRef<string | null>(null);
	const roomRef = useRef<MultiplayerRoom | null>(null);
	const isConnectingRef = useRef(false);
	const hasSetupListenersRef = useRef(false);

	const { currentUser } = useAppSelector((state: RootState) => state.user);

	/**
	 * Setup event listeners (defined before connect to avoid circular dependency)
	 * Only sets up listeners once to prevent duplicates
	 */
	const setupEventListeners = useCallback(() => {
		// Prevent setting up listeners multiple times
		if (hasSetupListenersRef.current) {
			logger.gameInfo('Event listeners already setup, skipping');
			return;
		}

		logger.gameInfo('Setting up multiplayer event listeners');
		hasSetupListenersRef.current = true;

		// Room events
		multiplayerService.onRoomCreated(({ room: newRoom, code }) => {
			setRoom(newRoom);
			roomRef.current = newRoom;
			setError(null);
			if (code) {
				setRoomCode(code);
			}
			logger.gameInfo('Room created', { roomId: newRoom.roomId, code });
		});

		multiplayerService.onRoomJoined(({ room: newRoom, gameState: receivedGameState }) => {
			setRoom(newRoom);
			roomRef.current = newRoom;
			logger.gameInfo('Room joined', { roomId: newRoom.roomId });

			// If gameState is provided (reconnection during active game), update it
			if (receivedGameState) {
				setGameState(receivedGameState);
				logger.gameInfo('Game state restored on reconnection', { roomId: newRoom.roomId });
			}
		});

		multiplayerService.onRoomLeft(({ roomId }) => {
			setRoom(null);
			roomRef.current = null;
			setGameState(null);
			setRoomCode(null);
			logger.gameInfo('Room left', { roomId });
		});

		// Player events
		multiplayerService.onPlayerJoined((event: PlayerJoinedEvent) => {
			if (event.data) {
				setRoom(prev => {
					if (!prev || prev.roomId !== event.roomId) return prev;
					const updatedRoom = {
						...prev,
						players: event.data.players,
					};
					roomRef.current = updatedRoom;
					return updatedRoom;
				});
			}
		});

		multiplayerService.onPlayerLeft((event: PlayerLeftEvent) => {
			if (event.data) {
				setRoom(prev => {
					if (!prev || prev.roomId !== event.roomId) return prev;
					const updatedRoom = {
						...prev,
						players: event.data.players,
					};
					roomRef.current = updatedRoom;
					return updatedRoom;
				});
			}
		});

		// Game events
		multiplayerService.onGameStarted((event: GameStartedEvent) => {
			if (event.data) {
				setRoom(prev => {
					if (!prev || prev.roomId !== event.roomId) return prev;
					const status: RoomStatus = 'playing';
					const updatedRoom: MultiplayerRoom = {
						...prev,
						questions: event.data.questions,
						status,
						startTime: new Date(),
					};
					roomRef.current = updatedRoom;
					return updatedRoom;
				});
			}
		});

		multiplayerService.onQuestionStarted((event: QuestionStartedEvent) => {
			if (event.data) {
				setGameState(prev => {
					// Get gameQuestionCount from room ref (current value) if available, otherwise use previous value or 0
					const gameQuestionCount = roomRef.current?.questions?.length ?? prev?.gameQuestionCount ?? 0;

					if (!prev || prev.roomId !== event.roomId) {
						return {
							roomId: event.roomId,
							currentQuestion: event.data.question,
							currentQuestionIndex: event.data.questionIndex,
							gameQuestionCount,
							timeRemaining: event.data.timeLimit,
							playersAnswers: {},
							playersScores: {},
							leaderboard: [],
						};
					}
					return {
						...prev,
						currentQuestion: event.data.question,
						currentQuestionIndex: event.data.questionIndex,
						gameQuestionCount,
						timeRemaining: event.data.timeLimit,
					};
				});
			}
		});

		multiplayerService.onAnswerReceived((event: AnswerReceivedEvent) => {
			if (event.data) {
				// Update leaderboard if provided
				if (event.data.leaderboard) {
					setLeaderboard(event.data.leaderboard);
				}

				setGameState(prev => {
					if (!prev || prev.roomId !== event.roomId) return prev;
					return {
						...prev,
						playersAnswers: {
							...prev.playersAnswers,
							[event.data.userId]: event.data.isCorrect ? 1 : 0,
						},
						playersScores: {
							...prev.playersScores,
							[event.data.userId]: event.data.scoreEarned,
						},
						// Update leaderboard in gameState if provided
						leaderboard: event.data.leaderboard ?? prev.leaderboard,
					};
				});
			}
		});

		multiplayerService.onQuestionEnded((event: QuestionEndedEvent) => {
			if (event.data) {
				setLeaderboard(event.data.leaderboard);
			}
		});

		multiplayerService.onGameEnded((event: GameEndedEvent) => {
			if (event.data) {
				setLeaderboard(event.data.finalLeaderboard);
				setRoom(prev => {
					if (!prev || prev.roomId !== event.roomId) return prev;
					return {
						...prev,
						status: 'finished',
						endTime: new Date(),
					};
				});
			}
		});

		multiplayerService.onLeaderboardUpdate((event: LeaderboardUpdateEvent) => {
			if (event.data) {
				setLeaderboard(event.data.leaderboard);
			}
		});

		multiplayerService.onRoomUpdated((event: RoomUpdatedEvent) => {
			if (event.data) {
				setRoom(event.data.room);
				roomRef.current = event.data.room;
			}
		});

		multiplayerService.onError((error: { message: string; code?: string }) => {
			setError(error.message);
			logger.gameError('Multiplayer error', { error: error.message, code: error.code });

			// Handle specific error codes
			if (error.code === 'GAME_CANCELLED') {
				// Reset room and game state when game is cancelled
				setRoom(null);
				setGameState(null);
				setLeaderboard([]);
			}
		});
	}, []);

	/**
	 * Connect to multiplayer server
	 */
	const connect = useCallback(async () => {
		// Prevent multiple simultaneous connection attempts
		if (isConnectingRef.current) {
			logger.gameInfo('Connection already in progress, skipping');
			return;
		}

		// Check if already connected
		if (multiplayerService.isConnected()) {
			logger.gameInfo('Already connected to multiplayer server');
			setIsConnected(true);
			return;
		}

		try {
			isConnectingRef.current = true;
			logger.gameInfo('Initiating multiplayer connection');

			const token = await authService.getToken();
			if (!token) {
				logger.gameError('Cannot connect - no token available');
				setError('Authentication required');
				isConnectingRef.current = false;
				return;
			}

			tokenRef.current = token;

			const socket = multiplayerService.connect(token);

			// Setup event listeners after socket is created (only once)
			setupEventListeners();

			socket.on('connect', () => {
				setIsConnected(true);
				setError(null);
				isConnectingRef.current = false;
				logger.gameInfo('Connected to multiplayer server');
			});

			socket.on('disconnect', () => {
				setIsConnected(false);
				isConnectingRef.current = false;
				logger.gameInfo('Disconnected from multiplayer server');
			});

			socket.on('connect_error', err => {
				setIsConnected(false);
				isConnectingRef.current = false;
				setError(getErrorMessage(err));
				logger.gameError('Failed to connect to multiplayer server', {
					error: getErrorMessage(err),
				});
			});
		} catch (err) {
			setError(getErrorMessage(err));
			isConnectingRef.current = false;
			logger.gameError('Failed to initialize multiplayer connection', {
				error: getErrorMessage(err),
			});
		}
	}, [setupEventListeners]);

	/**
	 * Disconnect from multiplayer server
	 */
	const disconnect = useCallback(() => {
		logger.gameInfo('Disconnecting from multiplayer server');
		multiplayerService.disconnect();
		setIsConnected(false);
		setRoom(null);
		setGameState(null);
		setLeaderboard([]);
		setError(null);
		isConnectingRef.current = false;
	}, []);

	/**
	 * Create a room
	 */
	const createRoom = useCallback((config: CreateRoomConfig) => {
		multiplayerService.createRoom(config);
	}, []);

	/**
	 * Join a room
	 */
	const joinRoom = useCallback((roomId: string) => {
		multiplayerService.joinRoom(roomId);
	}, []);

	/**
	 * Leave a room
	 */
	const leaveRoom = useCallback((roomId: string) => {
		multiplayerService.leaveRoom(roomId);
	}, []);

	/**
	 * Start the game
	 */
	const startGame = useCallback((roomId: string) => {
		multiplayerService.startGame(roomId);
	}, []);

	/**
	 * Submit an answer
	 */
	const submitAnswer = useCallback((roomId: string, questionId: string, answer: number, timeSpent: number) => {
		multiplayerService.submitAnswer(roomId, questionId, answer, timeSpent);
	}, []);

	// Auto-connect on mount if user is authenticated
	// Separated into two effects to prevent disconnect loop
	useEffect(() => {
		if (currentUser) {
			connect();
		}

		// Cleanup only on unmount (empty dependency array for cleanup)
		return () => {
			logger.gameInfo('useMultiplayer hook unmounting, disconnecting');
			disconnect();
		};
	}, [currentUser]);

	return {
		isConnected,
		room,
		gameState,
		leaderboard,
		error,
		roomCode,
		connect,
		disconnect,
		createRoom,
		joinRoom,
		leaveRoom,
		startGame,
		submitAnswer,
	};
};
