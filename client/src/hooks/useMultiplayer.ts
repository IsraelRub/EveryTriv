/**
 * Multiplayer Hook
 *
 * @module useMultiplayer
 * @description Hook for managing multiplayer game WebSocket connection and state
 * @used_by client/src/views/multiplayer
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { ERROR_CODES, RoomStatus } from '@shared/constants';
import type { CreateRoomConfig, GameState, MultiplayerRoom, Player } from '@shared/types';
import {
	getErrorMessage,
	isAnswerReceivedEvent,
	isCreateRoomResponse,
	isGameEndedEvent,
	isGameStartedEvent,
	isLeaderboardUpdateEvent,
	isPlayerJoinedEvent,
	isPlayerLeftEvent,
	isQuestionEndedEvent,
	isQuestionStartedEvent,
	isRecord,
	isRoomStateResponse,
	isRoomUpdatedEvent,
} from '@shared/utils';
import { authService, multiplayerService } from '@/services';
import { selectCurrentUser } from '@/redux/selectors';
import { useAppSelector } from './useRedux';

/**
 * Hook for multiplayer game functionality
 * @param roomId Optional room ID for auto-join functionality
 * @returns Multiplayer game state and methods
 */
export const useMultiplayer = (roomId?: string) => {
	const [isConnected, setIsConnected] = useState(false);
	const [room, setRoom] = useState<MultiplayerRoom | null>(null);
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [leaderboard, setLeaderboard] = useState<Player[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const tokenRef = useRef<string | null>(null);
	const roomRef = useRef<MultiplayerRoom | null>(null);
	const isConnectingRef = useRef(false);
	const hasSetupListenersRef = useRef(false);
	const isLoadingRef = useRef(false);

	const currentUser = useAppSelector(selectCurrentUser);

	/**
	 * Setup event listeners (defined before connect to avoid circular dependency)
	 * Only sets up listeners once to prevent duplicates
	 */
	const setupEventListeners = useCallback(() => {
		// Prevent setting up listeners multiple times
		if (hasSetupListenersRef.current) {
			return;
		}

		hasSetupListenersRef.current = true;

		// Room events
		multiplayerService.onRoomCreated((data: unknown) => {
			if (isCreateRoomResponse(data)) {
				setRoom(data.room);
				roomRef.current = data.room;
				setError(null);
			}
		});

		multiplayerService.onRoomJoined((data: unknown) => {
			if (isRoomStateResponse(data)) {
				setRoom(data.room);
				roomRef.current = data.room;
				setGameState(data.gameState);
			}
		});

		multiplayerService.onRoomLeft((data: unknown) => {
			if (isRecord(data) && 'roomId' in data && typeof data.roomId === 'string') {
				setRoom(null);
				roomRef.current = null;
				setGameState(null);
			}
		});

		// Player events
		multiplayerService.onPlayerJoined((event: unknown) => {
			if (isPlayerJoinedEvent(event)) {
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

		multiplayerService.onPlayerLeft((event: unknown) => {
			if (isPlayerLeftEvent(event)) {
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
		multiplayerService.onGameStarted((event: unknown) => {
			if (isGameStartedEvent(event)) {
				setRoom(prev => {
					if (!prev || prev.roomId !== event.roomId) return prev;
					const updatedRoom: MultiplayerRoom = {
						...prev,
						questions: event.data.questions,
						status: RoomStatus.PLAYING,
						startTime: new Date(),
					};
					roomRef.current = updatedRoom;
					return updatedRoom;
				});
			}
		});

		multiplayerService.onQuestionStarted((event: unknown) => {
			if (isQuestionStartedEvent(event)) {
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

		multiplayerService.onAnswerReceived((event: unknown) => {
			if (isAnswerReceivedEvent(event)) {
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

		multiplayerService.onQuestionEnded((event: unknown) => {
			if (isQuestionEndedEvent(event)) {
				setLeaderboard(event.data.leaderboard);
			}
		});

		multiplayerService.onGameEnded((event: unknown) => {
			if (isGameEndedEvent(event)) {
				setLeaderboard(event.data.finalLeaderboard);
				setRoom(prev => {
					if (!prev || prev.roomId !== event.roomId) return prev;
					return {
						...prev,
						status: RoomStatus.FINISHED,
						endTime: new Date(),
					};
				});
			}
		});

		multiplayerService.onLeaderboardUpdate((event: unknown) => {
			if (isLeaderboardUpdateEvent(event)) {
				setLeaderboard(event.data.leaderboard);
			}
		});

		multiplayerService.onRoomUpdated((event: unknown) => {
			if (isRoomUpdatedEvent(event)) {
				setRoom(event.data.room);
				roomRef.current = event.data.room;
			}
		});

		multiplayerService.onError((error: unknown) => {
			if (isRecord(error) && 'message' in error && typeof error.message === 'string') {
				const errorCode = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
				setError(getErrorMessage(error));

				// Handle specific error codes
				if (errorCode === ERROR_CODES.GAME_CANCELLED || errorCode === ERROR_CODES.ROOM_NOT_FOUND) {
					// Reset room and game state when game is cancelled or room not found
					setRoom(null);
					setGameState(null);
					setLeaderboard([]);
				}
			}
		});
	}, []);

	/**
	 * Connect to multiplayer server
	 */
	const connect = useCallback(async () => {
		// Prevent multiple simultaneous connection attempts
		if (isConnectingRef.current) {
			return;
		}

		// Check if already connected
		if (multiplayerService.isConnected()) {
			setIsConnected(true);
			return;
		}

		try {
			isConnectingRef.current = true;

			const token = await authService.getToken();
			if (!token) {
				setError(getErrorMessage(ERROR_CODES.AUTHENTICATION_TOKEN_REQUIRED));
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
			});

			socket.on('disconnect', () => {
				setIsConnected(false);
				isConnectingRef.current = false;
			});

			socket.on('connect_error', err => {
				setIsConnected(false);
				isConnectingRef.current = false;
				setError(getErrorMessage(err));
			});
		} catch (err) {
			setError(getErrorMessage(err));
			isConnectingRef.current = false;
		}
	}, [setupEventListeners]);

	/**
	 * Disconnect from multiplayer server
	 */
	const disconnect = useCallback(() => {
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
		setIsLoading(true);
		isLoadingRef.current = true;
		multiplayerService.createRoom(config);
	}, []);

	/**
	 * Join a room
	 */
	const joinRoom = useCallback((targetRoomId: string) => {
		setIsLoading(true);
		multiplayerService.joinRoom(targetRoomId);
		setIsLoading(false);
	}, []);

	/**
	 * Leave a room
	 */
	const leaveRoom = useCallback(
		(targetRoomId?: string) => {
			const roomIdToLeave = targetRoomId ?? room?.roomId;
			if (roomIdToLeave) {
				multiplayerService.leaveRoom(roomIdToLeave);
			}
		},
		[room]
	);

	/**
	 * Start the game
	 */
	const startGame = useCallback(
		(targetRoomId?: string) => {
			const roomIdToStart = targetRoomId ?? room?.roomId;
			if (roomIdToStart) {
				multiplayerService.startGame(roomIdToStart);
			}
		},
		[room]
	);

	/**
	 * Submit an answer
	 */
	const submitAnswer = useCallback((roomId: string, questionId: string, answer: number, timeSpent: number) => {
		multiplayerService.submitAnswer(roomId, questionId, answer, timeSpent);
	}, []);

	// Auto-connect on mount if user is authenticated
	// Connection is maintained across multiplayer pages (lobby, game, results)
	// Only disconnect when explicitly leaving multiplayer section
	useEffect(() => {
		if (currentUser) {
			connect();
		}
		// Note: We don't disconnect on unmount to maintain connection across multiplayer pages
		// Disconnect should be called explicitly (e.g., when leaving multiplayer section)
	}, [currentUser, connect]);

	// Auto-join room if roomId provided
	useEffect(() => {
		if (roomId && isConnected && !room) {
			joinRoom(roomId);
		}
	}, [roomId, isConnected, room, joinRoom]);

	// Stop loading when room is created or error occurs during room creation
	useEffect(() => {
		if (isLoadingRef.current && (room || error)) {
			setIsLoading(false);
			isLoadingRef.current = false;
		}
	}, [room, error]);

	// roomCode is now the same as roomId
	const roomCode = room?.roomId ?? null;

	// Check if user is host
	const isHost = room?.hostId === currentUser?.id;

	// Get current player
	const currentPlayer = room?.players.find(p => p.userId === currentUser?.id);

	// Check if room is ready to start
	const isReadyToStart = (room?.players?.length ?? 0) >= 2 && room?.status === RoomStatus.WAITING;

	return {
		isConnected,
		room,
		gameState,
		leaderboard,
		error,
		isLoading,
		isHost,
		currentPlayer,
		isReadyToStart,
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
