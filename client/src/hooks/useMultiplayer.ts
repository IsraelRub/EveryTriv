import { useCallback, useEffect, useRef, useState } from 'react';

import { ErrorCode, RoomStatus, TIME_PERIODS_MS, VALIDATION_COUNT } from '@shared/constants';
import type { CreateRoomConfig, MultiplayerRoom } from '@shared/types';
import {
	calculateClockOffset,
	getErrorMessage,
	isAnswerReceivedEvent,
	isCreateRoomResponse,
	isGameEndedEvent,
	isGameStartedEvent,
	isPlayerJoinedEvent,
	isPlayerLeftEvent,
	isQuestionEndedEvent,
	isQuestionStartedEvent,
	isRecord,
	isRoomStateResponse,
	isRoomUpdatedEvent,
	validateClockOffset,
} from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { getMultiplayerSummaryStorageKey, LoadingMessages } from '@/constants';
import { authService, clientLogger as logger, multiplayerService } from '@/services';
import {
	selectIsConnected,
	selectMultiplayerError,
	selectMultiplayerGameState,
	selectMultiplayerLoading,
	selectMultiplayerRoom,
} from '@/redux/selectors';
import {
	setConnectionStatus,
	setError,
	setMultiplayerLoading,
	setRevealPhase,
	setRoom,
	updateGameState,
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
	const isLoading = useAppSelector(selectMultiplayerLoading);
	const leaderboard = gameState?.leaderboard ?? [];
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
			if (isRecord(data) && 'roomId' in data && VALIDATORS.string(data.roomId)) {
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
				// Convert Date to ISO string for GameState (API response type expects string)
				const rawQuestionStartTime = currentRoom?.currentQuestionStartTime;
				const questionStartTime =
					rawQuestionStartTime && VALIDATORS.date(rawQuestionStartTime)
						? rawQuestionStartTime instanceof Date
							? rawQuestionStartTime.toISOString()
							: rawQuestionStartTime
						: undefined;

				const serverStartTimestamp = event.data.serverStartTimestamp;
				const serverEndTimestamp = event.data.serverEndTimestamp;

				if (!currentGameState || currentGameState.roomId !== event.roomId) {
					dispatch(setRevealPhase(false));
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
							answerCounts: {},
							...(questionStartTime && { currentQuestionStartTime: questionStartTime }),
							...(serverStartTimestamp !== undefined && { serverStartTimestamp }),
							...(serverEndTimestamp !== undefined && { serverEndTimestamp }),
						})
					);
				} else {
					dispatch(setRevealPhase(false));
					dispatch(
						updateGameState({
							...currentGameState,
							currentQuestion: event.data.question,
							currentQuestionIndex: event.data.questionIndex,
							gameQuestionCount,
							timeRemaining: event.data.timeLimit,
							answerCounts: {},
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
				const currentGameState = selectMultiplayerGameState(store.getState());
				if (!currentGameState || currentGameState.roomId !== event.roomId) return;
				const nextAnswerCounts = event.data.answerCounts ?? currentGameState.answerCounts;
				dispatch(
					updateGameState({
						...currentGameState,
						playersAnswers: {
							...currentGameState.playersAnswers,
							[event.data.userId]: event.data.answerIndex,
						},
						playersScores: {
							...currentGameState.playersScores,
							[event.data.userId]: event.data.scoreEarned,
						},
						leaderboard: event.data.leaderboard ?? currentGameState.leaderboard,
						answerCounts: nextAnswerCounts,
					})
				);
			}
		});

		multiplayerService.onQuestionEnded((event: unknown) => {
			if (isQuestionEndedEvent(event)) {
				const currentGameState = selectMultiplayerGameState(store.getState());
				if (!currentGameState || currentGameState.roomId !== event.roomId) return;
				dispatch(setRevealPhase(true));
				dispatch(
					updateGameState({
						...currentGameState,
						leaderboard: event.data.leaderboard,
						...(event.data.answerCounts !== undefined && { answerCounts: event.data.answerCounts }),
					})
				);
			}
		});

		multiplayerService.onGameEnded((event: unknown) => {
			if (isGameEndedEvent(event)) {
				const currentGameState = selectMultiplayerGameState(store.getState());
				if (!currentGameState || currentGameState.roomId !== event.roomId) return;
				const finalLeaderboard = event.data.finalLeaderboard;
				dispatch(
					updateGameState({
						...currentGameState,
						leaderboard: finalLeaderboard,
					})
				);
				const currentRoom = selectMultiplayerRoom(store.getState());
				try {
					const key = getMultiplayerSummaryStorageKey(event.roomId);
					const questionCount = currentRoom?.questions?.length ?? 0;
					const payload = questionCount > 0 ? { leaderboard: finalLeaderboard, questionCount } : finalLeaderboard;
					sessionStorage.setItem(key, JSON.stringify(payload));
				} catch {
					// Ignore sessionStorage errors (private mode, quota, etc.)
				}
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

		multiplayerService.onRoomUpdated((event: unknown) => {
			if (isRoomUpdatedEvent(event)) {
				dispatch(setRoom(event.data.room));
			}
		});

		multiplayerService.onError((error: unknown) => {
			if (isRecord(error) && 'message' in error && VALIDATORS.string(error.message)) {
				const errorCode = 'code' in error && VALIDATORS.string(error.code) ? error.code : undefined;
				if (errorCode === ErrorCode.NEED_AT_LEAST_2_PLAYERS) {
					return;
				}
				dispatch(setError(getErrorMessage(error)));

				if (errorCode === ErrorCode.GAME_CANCELLED || errorCode === ErrorCode.ROOM_NOT_FOUND) {
					const state = store.getState();
					const currentRoom = selectMultiplayerRoom(state);
					const currentGameState = selectMultiplayerGameState(state);
					const hasFinishedGameWithResults =
						currentRoom?.status === RoomStatus.FINISHED && (currentGameState?.leaderboard?.length ?? 0) > 0;
					if (!hasFinishedGameWithResults) {
						dispatch(setRoom(null));
						dispatch(updateGameState(null));
					}
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
			// Ensure event listeners are set up even if already connected
			setupEventListeners();
			return;
		}

		try {
			isConnectingRef.current = true;

			const token = await authService.getToken();
			if (!token) {
				dispatch(setError(getErrorMessage(ErrorCode.AUTHENTICATION_TOKEN_REQUIRED)));
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
		dispatch(setRevealPhase(false));
		dispatch(setError(null));
		isConnectingRef.current = false;
	}, [dispatch]);

	// Note: We don't cleanup listeners on unmount because connection should be maintained
	// across multiplayer pages (lobby, game, summary). Cleanup is handled by disconnect()
	// when explicitly leaving multiplayer section.

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
			isLoadingRef.current = true;
			multiplayerService.joinRoom(targetRoomId);
		},
		[dispatch]
	);

	const leaveRoom = useCallback(() => {
		const roomIdToLeave = room?.roomId;
		if (roomIdToLeave) {
			multiplayerService.leaveRoom(roomIdToLeave);
		}
	}, [room]);

	const startGame = useCallback(() => {
		const roomIdToStart = room?.roomId;
		if (roomIdToStart) {
			dispatch(setMultiplayerLoading(true));
			isLoadingRef.current = true;
			multiplayerService.startGame(roomIdToStart);
		}
	}, [room, dispatch]);

	const submitAnswer = useCallback((roomId: string, questionId: string, answer: number, timeSpent: number) => {
		multiplayerService.submitAnswer(roomId, questionId, answer, timeSpent);
	}, []);

	// Auto-connect on mount if user is authenticated
	// Connection is maintained across multiplayer pages (lobby, game, summary)
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

	// Stop loading when room is created, join completes, error occurs, or after game start (so spinner is visible)
	useEffect(() => {
		if (!isLoadingRef.current) return;

		if (error) {
			dispatch(setMultiplayerLoading(false));
			isLoadingRef.current = false;
			return;
		}

		if (room) {
			if (room.status === RoomStatus.PLAYING) {
				// Game just started – clear loading after a short delay so the "Starting game..." spinner is visible before navigation
				const t = setTimeout(() => {
					dispatch(setMultiplayerLoading(false));
					isLoadingRef.current = false;
				}, TIME_PERIODS_MS.THREE_HUNDRED_MILLISECONDS);
				return () => clearTimeout(t);
			}
			// Room created or join completed (still WAITING)
			dispatch(setMultiplayerLoading(false));
			isLoadingRef.current = false;
		}
	}, [room, room?.status, error, dispatch]);

	// roomCode is now the same as roomId
	const roomCode = room?.roomId ?? null;

	// Check if user is host
	const isHost = room?.hostId === currentUser?.id;

	// Get current player
	const currentPlayer = room?.players.find(p => p.userId === currentUser?.id);

	// Check if room is ready to start (min players to start can be less than max players in room)
	const isReadyToStart =
		(room?.players?.length ?? 0) >= VALIDATION_COUNT.PLAYERS.MIN && room?.status === RoomStatus.WAITING;

	// ============================================================================
	// Loading State Management
	// ============================================================================

	const [loadingStep, setLoadingStep] = useState<LoadingMessages | null>(null);

	useEffect(() => {
		if (!isConnected) {
			if (isLoading) {
				setLoadingStep(LoadingMessages.AUTHENTICATING);
			} else {
				setLoadingStep(LoadingMessages.CONNECTING_TO_SOCKET);
			}
		} else {
			if (!room) {
				if (isLoading) {
					setLoadingStep(LoadingMessages.JOINING_ROOM);
				} else {
					setLoadingStep(null);
				}
			} else if (!gameState) {
				if (room.status === RoomStatus.PLAYING) {
					setLoadingStep(LoadingMessages.LOADING_MULTIPLAYER_QUESTIONS);
				} else {
					setLoadingStep(LoadingMessages.WAITING_FOR_GAME_STATE);
				}
			} else {
				setLoadingStep(null);
			}
		}
	}, [room, gameState, isConnected, isLoading]);

	const displayMessage = loadingStep ?? LoadingMessages.CONNECTING_TO_SOCKET;

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
