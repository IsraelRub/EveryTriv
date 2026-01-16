import { useCallback, useEffect, useRef, useState } from 'react';

import { ERROR_CODES, RoomStatus } from '@shared/constants';
import type { CreateRoomConfig, MultiplayerRoom } from '@shared/types';
import {
	calculateClockOffset,
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
	validateClockOffset,
} from '@shared/utils';

import { GameLoadingStep } from '@/constants';
import { authService, clientLogger as logger, multiplayerService } from '@/services';
import {
	selectIsConnected,
	selectMultiplayerError,
	selectMultiplayerGameState,
	selectMultiplayerLeaderboard,
	selectMultiplayerLoading,
	selectMultiplayerRoom,
} from '@/redux/selectors';
import {
	setConnectionStatus,
	setError,
	setMultiplayerLoading,
	setRoom,
	updateGameState,
	updateLeaderboard,
} from '@/redux/slices';
import { store } from '@/redux/store';
import { useCurrentUserData } from './useAuth';
import { useAppDispatch, useAppSelector } from './useRedux';

export const useMultiplayer = (roomId?: string) => {
	const dispatch = useAppDispatch();
	const isConnected = useAppSelector(selectIsConnected);
	const room = useAppSelector(selectMultiplayerRoom);
	const gameState = useAppSelector(selectMultiplayerGameState);
	const error = useAppSelector(selectMultiplayerError);
	const leaderboard = useAppSelector(selectMultiplayerLeaderboard);
	const isLoading = useAppSelector(selectMultiplayerLoading);
	const tokenRef = useRef<string | null>(null);
	const isConnectingRef = useRef(false);
	const hasSetupListenersRef = useRef(false);
	const isLoadingRef = useRef(false);

	const currentUser = useCurrentUserData();

	const setupEventListeners = useCallback(() => {
		// Prevent setting up listeners multiple times
		if (hasSetupListenersRef.current) {
			return;
		}

		hasSetupListenersRef.current = true;

		// Room events
		multiplayerService.onRoomCreated((data: unknown) => {
			if (isCreateRoomResponse(data)) {
				dispatch(setRoom(data.room));
				dispatch(setError(null));
			}
		});

		multiplayerService.onRoomJoined((data: unknown) => {
			if (isRoomStateResponse(data)) {
				dispatch(setRoom(data.room));
				dispatch(updateGameState(data.gameState));
			}
		});

		multiplayerService.onRoomLeft((data: unknown) => {
			if (isRecord(data) && 'roomId' in data && typeof data.roomId === 'string') {
				dispatch(setRoom(null));
				dispatch(updateGameState(null));
			}
		});

		// Player events
		multiplayerService.onPlayerJoined((event: unknown) => {
			if (isPlayerJoinedEvent(event)) {
				const currentRoom = selectMultiplayerRoom(store.getState());
				if (!currentRoom || currentRoom.roomId !== event.roomId) return;
				const updatedRoom = {
					...currentRoom,
					players: event.data.players,
				};
				dispatch(setRoom(updatedRoom));
			}
		});

		multiplayerService.onPlayerLeft((event: unknown) => {
			if (isPlayerLeftEvent(event)) {
				const currentRoom = selectMultiplayerRoom(store.getState());
				if (!currentRoom || currentRoom.roomId !== event.roomId) return;
				const updatedRoom = {
					...currentRoom,
					players: event.data.players,
				};
				dispatch(setRoom(updatedRoom));
			}
		});

		// Game events
		multiplayerService.onGameStarted((event: unknown) => {
			if (isGameStartedEvent(event)) {
				const currentRoom = selectMultiplayerRoom(store.getState());
				if (!currentRoom || currentRoom.roomId !== event.roomId) return;
				const updatedRoom: MultiplayerRoom = {
					...currentRoom,
					questions: event.data.questions,
					status: RoomStatus.PLAYING,
					startTime: new Date(),
				};
				dispatch(setRoom(updatedRoom));
			}
		});

		multiplayerService.onQuestionStarted((event: unknown) => {
			if (isQuestionStartedEvent(event)) {
				const state = store.getState();
				const currentGameState = selectMultiplayerGameState(state);
				const currentRoom = selectMultiplayerRoom(state);
				const gameQuestionCount = currentRoom?.questions?.length ?? currentGameState?.gameQuestionCount ?? 0;

				// Clock sync check - use room.currentQuestionStartTime if available
				// The server sets currentQuestionStartTime in the room when starting a question
				if (currentRoom?.currentQuestionStartTime) {
					const serverTimestamp = new Date(currentRoom.currentQuestionStartTime).getTime();
					const offset = calculateClockOffset(serverTimestamp);
					if (!validateClockOffset(offset)) {
						logger.systemError('Significant clock offset detected', {
							duration: offset,
							roomId: event.roomId,
						});
					}
				}

				// Update gameState with currentQuestionStartTime from room if available
				const questionStartTime = currentRoom?.currentQuestionStartTime;

				// Extract server timestamps from event data
				const serverStartTimestamp = 'serverStartTimestamp' in event.data ? event.data.serverStartTimestamp : undefined;
				const serverEndTimestamp = 'serverEndTimestamp' in event.data ? event.data.serverEndTimestamp : undefined;

				if (!currentGameState || currentGameState.roomId !== event.roomId) {
					dispatch(
						updateGameState({
							roomId: event.roomId,
							currentQuestion: event.data.question,
							currentQuestionIndex: event.data.questionIndex,
							gameQuestionCount,
							timeRemaining: event.data.timeLimit,
							playersAnswers: {},
							playersScores: {},
							leaderboard: [],
							...(questionStartTime && { currentQuestionStartTime: questionStartTime }),
							...(serverStartTimestamp !== undefined && { serverStartTimestamp }),
							...(serverEndTimestamp !== undefined && { serverEndTimestamp }),
						})
					);
				} else {
					dispatch(
						updateGameState({
							...currentGameState,
							currentQuestion: event.data.question,
							currentQuestionIndex: event.data.questionIndex,
							gameQuestionCount,
							timeRemaining: event.data.timeLimit,
							...(questionStartTime && { currentQuestionStartTime: questionStartTime }),
							...(serverStartTimestamp !== undefined && { serverStartTimestamp }),
							...(serverEndTimestamp !== undefined && { serverEndTimestamp }),
						})
					);
				}
			}
		});

		multiplayerService.onAnswerReceived((event: unknown) => {
			if (isAnswerReceivedEvent(event)) {
				// Update leaderboard if provided
				if (event.data.leaderboard) {
					dispatch(updateLeaderboard(event.data.leaderboard));
				}

				const currentGameState = selectMultiplayerGameState(store.getState());
				if (!currentGameState || currentGameState.roomId !== event.roomId) return;
				dispatch(
					updateGameState({
						...currentGameState,
						playersAnswers: {
							...currentGameState.playersAnswers,
							[event.data.userId]: event.data.isCorrect ? 1 : 0,
						},
						playersScores: {
							...currentGameState.playersScores,
							[event.data.userId]: event.data.scoreEarned,
						},
						// Update leaderboard in gameState if provided
						leaderboard: event.data.leaderboard ?? currentGameState.leaderboard,
					})
				);
			}
		});

		multiplayerService.onQuestionEnded((event: unknown) => {
			if (isQuestionEndedEvent(event)) {
				dispatch(updateLeaderboard(event.data.leaderboard));
			}
		});

		multiplayerService.onGameEnded((event: unknown) => {
			if (isGameEndedEvent(event)) {
				dispatch(updateLeaderboard(event.data.finalLeaderboard));
				const currentRoom = selectMultiplayerRoom(store.getState());
				if (!currentRoom || currentRoom.roomId !== event.roomId) return;
				dispatch(
					setRoom({
						...currentRoom,
						status: RoomStatus.FINISHED,
						endTime: new Date(),
					})
				);
			}
		});

		multiplayerService.onLeaderboardUpdate((event: unknown) => {
			if (isLeaderboardUpdateEvent(event)) {
				dispatch(updateLeaderboard(event.data.leaderboard));
			}
		});

		multiplayerService.onRoomUpdated((event: unknown) => {
			if (isRoomUpdatedEvent(event)) {
				dispatch(setRoom(event.data.room));
			}
		});

		multiplayerService.onError((error: unknown) => {
			if (isRecord(error) && 'message' in error && typeof error.message === 'string') {
				const errorCode = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
				dispatch(setError(getErrorMessage(error)));

				// Handle specific error codes
				if (errorCode === ERROR_CODES.GAME_CANCELLED || errorCode === ERROR_CODES.ROOM_NOT_FOUND) {
					// Reset room and game state when game is cancelled or room not found
					dispatch(setRoom(null));
					dispatch(updateGameState(null));
					dispatch(updateLeaderboard([]));
				}
			}
		});
	}, [dispatch]);

	const connect = useCallback(async () => {
		// Prevent multiple simultaneous connection attempts
		if (isConnectingRef.current) {
			return;
		}

		// Check if already connected
		if (multiplayerService.isConnected()) {
			dispatch(setConnectionStatus(true));
			return;
		}

		try {
			isConnectingRef.current = true;

			const token = await authService.getToken();
			if (!token) {
				dispatch(setError(getErrorMessage(ERROR_CODES.AUTHENTICATION_TOKEN_REQUIRED)));
				isConnectingRef.current = false;
				return;
			}

			tokenRef.current = token;

			const socket = multiplayerService.connect(token);

			// Setup event listeners after socket is created (only once)
			setupEventListeners();

			socket.on('connect', () => {
				dispatch(setConnectionStatus(true));
				dispatch(setError(null));
				isConnectingRef.current = false;
			});

			socket.on('disconnect', () => {
				dispatch(setConnectionStatus(false));
				isConnectingRef.current = false;
			});

			socket.on('connect_error', err => {
				dispatch(setConnectionStatus(false));
				isConnectingRef.current = false;
				dispatch(setError(getErrorMessage(err)));
			});
		} catch (err) {
			dispatch(setError(getErrorMessage(err)));
			isConnectingRef.current = false;
		}
	}, [setupEventListeners, dispatch]);

	const disconnect = useCallback(() => {
		multiplayerService.disconnect();
		dispatch(setConnectionStatus(false));
		dispatch(setRoom(null));
		dispatch(updateGameState(null));
		dispatch(updateLeaderboard([]));
		dispatch(setError(null));
		isConnectingRef.current = false;
	}, [dispatch]);

	useEffect(() => {
		return () => {
			multiplayerService.cleanup();
		};
	}, []);

	const createRoom = useCallback(
		(config: CreateRoomConfig) => {
			dispatch(setMultiplayerLoading(true));
			isLoadingRef.current = true;
			multiplayerService.createRoom(config);
		},
		[dispatch]
	);

	const joinRoom = useCallback(
		(targetRoomId: string) => {
			dispatch(setMultiplayerLoading(true));
			multiplayerService.joinRoom(targetRoomId);
			dispatch(setMultiplayerLoading(false));
		},
		[dispatch]
	);

	const leaveRoom = useCallback(
		(targetRoomId?: string) => {
			const roomIdToLeave = targetRoomId ?? room?.roomId;
			if (roomIdToLeave) {
				multiplayerService.leaveRoom(roomIdToLeave);
			}
		},
		[room]
	);

	const startGame = useCallback(
		(targetRoomId?: string) => {
			const roomIdToStart = targetRoomId ?? room?.roomId;
			if (roomIdToStart) {
				multiplayerService.startGame(roomIdToStart);
			}
		},
		[room]
	);

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
		if (isLoadingRef.current && (room ?? error)) {
			dispatch(setMultiplayerLoading(false));
			isLoadingRef.current = false;
		}
	}, [room, error, dispatch]);

	// roomCode is now the same as roomId
	const roomCode = room?.roomId ?? null;

	// Check if user is host
	const isHost = room?.hostId === currentUser?.id;

	// Get current player
	const currentPlayer = room?.players.find(p => p.userId === currentUser?.id);

	// Check if room is ready to start
	const isReadyToStart = (room?.players?.length ?? 0) >= 2 && room?.status === RoomStatus.WAITING;

	// ============================================================================
	// Loading State Management
	// ============================================================================

	const [loadingStep, setLoadingStep] = useState<GameLoadingStep | null>(null);

	useEffect(() => {
		if (!isConnected) {
			if (isLoading) {
				setLoadingStep(GameLoadingStep.AUTHENTICATING);
			} else {
				setLoadingStep(GameLoadingStep.CONNECTING_TO_SOCKET);
			}
		} else {
			if (!room) {
				if (isLoading) {
					setLoadingStep(GameLoadingStep.JOINING_ROOM);
				} else {
					setLoadingStep(null);
				}
			} else if (!gameState) {
				if (room.status === RoomStatus.PLAYING) {
					setLoadingStep(GameLoadingStep.LOADING_MULTIPLAYER_QUESTIONS);
				} else {
					setLoadingStep(GameLoadingStep.WAITING_FOR_GAME_STATE);
				}
			} else {
				setLoadingStep(null);
			}
		}
	}, [room, gameState, isConnected, isLoading]);

	const displayMessage = loadingStep ?? GameLoadingStep.CONNECTING_TO_SOCKET;

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
		// Loading state
		loadingStep,
		displayMessage,
	};
};
