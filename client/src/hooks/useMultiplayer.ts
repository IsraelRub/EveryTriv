import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ErrorCode, MultiplayerEvent, RoomStatus, TIME_PERIODS_MS, VALIDATION_COUNT } from '@shared/constants';
import type { CreateRoomConfig, MultiplayerRoom } from '@shared/types';
import {
	calculateClockOffset,
	getCorrectAnswerIndex,
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

import { LoadingMessages, MultiplayerSummaryPayloadKey, StorageKeys } from '@/constants';
import type { MultiplayerUnsubscribe, PendingMultiplayerAnswerMerge } from '@/types';
import { clientLogger as logger, multiplayerService, queryInvalidationService, storageService } from '@/services';
import { getMultiplayerSummaryStorageKey } from '@/utils';
import {
	selectIsConnected,
	selectMultiplayerError,
	selectMultiplayerGameState,
	selectMultiplayerLoading,
	selectMultiplayerPersonalAnswerHistory,
	selectMultiplayerRoom,
} from '@/redux/selectors';
import {
	clearPersonalAnswerHistory,
	pushPersonalAnswerEntry,
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
	const queryClient = useQueryClient();
	const isConnected = useAppSelector(selectIsConnected);
	const room = useAppSelector(selectMultiplayerRoom);
	const gameState = useAppSelector(selectMultiplayerGameState);
	const error = useAppSelector(selectMultiplayerError);
	const isLoading = useAppSelector(selectMultiplayerLoading);
	const leaderboard = gameState?.leaderboard ?? [];
	const isConnectingRef = useRef(false);
	const isLoadingRef = useRef(false);
	const listenerCleanupRef = useRef<(() => void) | null>(null);
	const currentUserIdRef = useRef<string | undefined>(undefined);
	const lastSubmittedAnswerRef = useRef<{ questionId: string; answerIndex: number } | null>(null);
	const pendingAnswerMergesRef = useRef(new Map<string, PendingMultiplayerAnswerMerge>());
	const roomIdParamRef = useRef<string | undefined>(roomId);
	roomIdParamRef.current = roomId;

	const currentUser = useCurrentUserData();
	currentUserIdRef.current = currentUser?.id;

	const setupEventListeners = useCallback(() => {
		listenerCleanupRef.current?.();
		// Drop previous app handlers so remounts / repeated connect() do not stack duplicate socket listeners
		// (e.g. React Strict Mode double mount → duplicate QUESTION_ENDED → duplicate breakdown rows).
		multiplayerService.clearAppListeners();
		const subscriptions: MultiplayerUnsubscribe[] = [];
		const registerListener = (event: MultiplayerEvent, callback: (data: unknown) => void): void => {
			const unsubscribe = multiplayerService.stream(event).subscribe(callback);
			subscriptions.push(unsubscribe);
		};

		const flushPendingForQuestion = (newQuestionId: string): void => {
			queueMicrotask(() => {
				const pending = pendingAnswerMergesRef.current.get(newQuestionId);
				if (pending == null) {
					return;
				}
				pendingAnswerMergesRef.current.delete(newQuestionId);
				const gs = selectMultiplayerGameState(store.getState());
				if (!gs || gs.currentQuestion?.id !== newQuestionId) {
					return;
				}
				dispatch(
					updateGameState({
						...gs,
						playersAnswers: { ...gs.playersAnswers, ...pending.playersAnswers },
						playersScores: { ...gs.playersScores, ...pending.playersScores },
						leaderboard: pending.leaderboard ?? gs.leaderboard,
						answerCounts: pending.answerCounts,
					})
				);
			});
		};

		// Room events
		registerListener(MultiplayerEvent.ROOM_CREATED, (data: unknown) => {
			if (isCreateRoomResponse(data)) {
				dispatch(setRoom(data.room));
				dispatch(setError(null));
			}
		});

		registerListener(MultiplayerEvent.ROOM_JOINED, (data: unknown) => {
			if (isRoomStateResponse(data)) {
				pendingAnswerMergesRef.current.clear();
				dispatch(setRoom(data.room));
				dispatch(updateGameState(data.gameState));
			}
		});

		registerListener(MultiplayerEvent.ROOM_LEFT, (data: unknown) => {
			if (isRecord(data) && 'roomId' in data && VALIDATORS.string(data.roomId)) {
				pendingAnswerMergesRef.current.clear();
				dispatch(setRoom(null));
				dispatch(updateGameState(null));
			}
		});

		// Player events
		registerListener(MultiplayerEvent.PLAYER_JOINED, (event: unknown) => {
			if (isPlayerJoinedEvent(event)) {
				const currentRoom = selectMultiplayerRoom(store.getState());
				if (!currentRoom || currentRoom.roomId !== event.roomId) return;
				const updatedRoom = {
					...currentRoom,
					players: event.data.players,
				};
				dispatch(setRoom(updatedRoom));
				if (updatedRoom.hostId === currentUserIdRef.current) {
					void queryInvalidationService.invalidateCreditsQueries(queryClient);
				}
			}
		});

		registerListener(MultiplayerEvent.PLAYER_LEFT, (event: unknown) => {
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
		registerListener(MultiplayerEvent.GAME_STARTED, (event: unknown) => {
			if (isGameStartedEvent(event)) {
				const currentRoom = selectMultiplayerRoom(store.getState());
				if (!currentRoom || currentRoom.roomId !== event.roomId) return;
				pendingAnswerMergesRef.current.clear();
				dispatch(clearPersonalAnswerHistory());
				const updatedRoom: MultiplayerRoom = {
					...currentRoom,
					questions: event.data.questions,
					status: RoomStatus.PLAYING,
					startTime: new Date(),
				};
				dispatch(setRoom(updatedRoom));
			}
		});

		registerListener(MultiplayerEvent.QUESTION_STARTED, (event: unknown) => {
			if (isQuestionStartedEvent(event)) {
				const newQuestionId = event.data.question.id;
				for (const key of [...pendingAnswerMergesRef.current.keys()]) {
					if (key !== newQuestionId) {
						pendingAnswerMergesRef.current.delete(key);
					}
				}
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

				dispatch(setRevealPhase(false));
				dispatch(
					updateGameState(
						!currentGameState || currentGameState.roomId !== event.roomId
							? {
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
								}
							: {
									...currentGameState,
									currentQuestion: event.data.question,
									currentQuestionIndex: event.data.questionIndex,
									gameQuestionCount,
									timeRemaining: event.data.timeLimit,
									playersAnswers: {},
									answerCounts: {},
									...(questionStartTime && { currentQuestionStartTime: questionStartTime }),
									...(serverStartTimestamp !== undefined && { serverStartTimestamp }),
									...(serverEndTimestamp !== undefined && { serverEndTimestamp }),
								}
					)
				);
				flushPendingForQuestion(newQuestionId);
			}
		});

		registerListener(MultiplayerEvent.ANSWER_RECEIVED, (event: unknown) => {
			if (!isAnswerReceivedEvent(event)) {
				return;
			}
			const currentGameState = selectMultiplayerGameState(store.getState());
			if (!currentGameState || currentGameState.roomId !== event.roomId) {
				return;
			}
			const currentQuestionId = currentGameState.currentQuestion?.id;
			const eventQuestionId = event.data.questionId;
			const nextAnswerCounts = event.data.answerCounts ?? {};

			if (currentQuestionId != null && eventQuestionId === currentQuestionId) {
				pendingAnswerMergesRef.current.delete(eventQuestionId);
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
				return;
			}

			if (currentQuestionId != null && eventQuestionId !== currentQuestionId) {
				const prev = pendingAnswerMergesRef.current.get(eventQuestionId);
				const prevCounts = prev?.answerCounts ?? {};
				const incomingCounts = event.data.answerCounts ?? {};
				const mergedCounts: Record<string, number> = { ...prevCounts, ...incomingCounts };
				const nextPending: PendingMultiplayerAnswerMerge = {
					playersAnswers: { ...(prev?.playersAnswers ?? {}), [event.data.userId]: event.data.answerIndex },
					playersScores: { ...(prev?.playersScores ?? {}), [event.data.userId]: event.data.scoreEarned },
					leaderboard: event.data.leaderboard ?? prev?.leaderboard,
					answerCounts: mergedCounts,
				};
				pendingAnswerMergesRef.current.set(eventQuestionId, nextPending);
				return;
			}

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
		});

		registerListener(MultiplayerEvent.QUESTION_ENDED, (event: unknown) => {
			if (isQuestionEndedEvent(event)) {
				const currentGameState = selectMultiplayerGameState(store.getState());
				if (!currentGameState || currentGameState.roomId !== event.roomId) return;
				const userId = currentUserIdRef.current;
				const questionText = currentGameState.currentQuestion?.question;
				const results = event.data.results;
				if (userId && VALIDATORS.string(questionText) && Array.isArray(results)) {
					const myResult = results.find(r => r.userId === userId);
					if (myResult !== undefined) {
						const currentQuestion = currentGameState.currentQuestion;
						const answers = currentQuestion?.answers ?? [];
						const correctIdx = currentQuestion ? getCorrectAnswerIndex(currentQuestion) : -1;
						const lastSubmitted = lastSubmittedAnswerRef.current;
						const isSameQuestion = lastSubmitted && currentQuestion?.id === lastSubmitted.questionId;
						const correctAnswerText =
							correctIdx >= 0 && correctIdx < answers.length ? answers[correctIdx]?.text : undefined;
						const userAnswerText =
							isSameQuestion && lastSubmitted.answerIndex >= 0 && lastSubmitted.answerIndex < answers.length
								? answers[lastSubmitted.answerIndex]?.text
								: undefined;
						dispatch(
							pushPersonalAnswerEntry({
								question: questionText,
								questionId: event.data.questionId,
								isCorrect: myResult.isCorrect,
								...(correctAnswerText !== undefined && { correctAnswerText }),
								...(userAnswerText !== undefined && { userAnswerText }),
							})
						);
						lastSubmittedAnswerRef.current = null;
					}
				}
				dispatch(setRevealPhase(true));
				// Only apply answerCounts when they belong to the current question; otherwise a late
				// QUESTION_ENDED (e.g. after QUESTION_STARTED for next question) would overwrite and show stale bars.
				const countsForCurrentQuestion =
					event.data.answerCounts !== undefined && currentGameState.currentQuestion?.id === event.data.questionId;
				dispatch(
					updateGameState({
						...currentGameState,
						leaderboard: event.data.leaderboard,
						...(countsForCurrentQuestion && { answerCounts: event.data.answerCounts }),
					})
				);
			}
		});

		registerListener(MultiplayerEvent.GAME_ENDED, (event: unknown) => {
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
				const personalAnswerHistory = selectMultiplayerPersonalAnswerHistory(store.getState());
				try {
					const key = getMultiplayerSummaryStorageKey(event.roomId);
					const questionCount = currentRoom?.questions?.length ?? 0;
					const payload =
						questionCount > 0 || personalAnswerHistory.length > 0
							? {
									[MultiplayerSummaryPayloadKey.Leaderboard]: finalLeaderboard,
									...(questionCount > 0 && { [MultiplayerSummaryPayloadKey.QuestionCount]: questionCount }),
									...(personalAnswerHistory.length > 0 && {
										[MultiplayerSummaryPayloadKey.PersonalAnswerHistory]: personalAnswerHistory,
									}),
								}
							: finalLeaderboard;
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

		registerListener(MultiplayerEvent.ROOM_UPDATED, (event: unknown) => {
			if (isRoomUpdatedEvent(event)) {
				dispatch(setRoom(event.data.room));
			}
		});

		registerListener(MultiplayerEvent.ERROR, (error: unknown) => {
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
		listenerCleanupRef.current = () => {
			subscriptions.forEach(unsubscribe => {
				unsubscribe();
			});
			listenerCleanupRef.current = null;
		};
	}, [dispatch, queryClient]);

	const connect = useCallback(async () => {
		// Prevent multiple simultaneous connection attempts
		if (isConnectingRef.current) {
			return;
		}

		// Check if already connected
		if (multiplayerService.isConnected) {
			dispatch(setConnectionStatus(true));
			// Ensure event listeners are set up even if already connected
			setupEventListeners();
			return;
		}

		try {
			isConnectingRef.current = true;

			const tokenResult = await storageService.getString(StorageKeys.AUTH_TOKEN);
			const token = tokenResult.success ? (tokenResult.data ?? null) : null;
			if (!token) {
				dispatch(setError(getErrorMessage(ErrorCode.AUTHENTICATION_TOKEN_REQUIRED)));
				isConnectingRef.current = false;
				return;
			}

			const socket = multiplayerService.connect(token);

			// Setup event listeners after socket is created (only once)
			setupEventListeners();

			socket.on('connect', () => {
				dispatch(setConnectionStatus(true));
				dispatch(setError(null));
				isConnectingRef.current = false;
				const routeRoomId = roomIdParamRef.current;
				if (routeRoomId) {
					const snapRoom = selectMultiplayerRoom(store.getState());
					const snapGame = selectMultiplayerGameState(store.getState());
					const roomMismatch = snapRoom != null && snapRoom.roomId !== routeRoomId;
					const playingWithoutState = snapRoom != null && snapRoom.status === RoomStatus.PLAYING && snapGame == null;
					if (roomMismatch || playingWithoutState) {
						multiplayerService.emit(MultiplayerEvent.JOIN_ROOM, { roomId: routeRoomId });
					}
				}
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
		pendingAnswerMergesRef.current.clear();
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
			multiplayerService.emit(MultiplayerEvent.CREATE_ROOM, config);
		},
		[dispatch]
	);

	const joinRoom = useCallback(
		(targetRoomId: string) => {
			dispatch(setMultiplayerLoading(true));
			isLoadingRef.current = true;
			multiplayerService.emit(MultiplayerEvent.JOIN_ROOM, { roomId: targetRoomId });
		},
		[dispatch]
	);

	const leaveRoom = useCallback(() => {
		const roomIdToLeave = room?.roomId;
		if (roomIdToLeave) {
			multiplayerService.emit(MultiplayerEvent.LEAVE_ROOM, { roomId: roomIdToLeave });
		}
	}, [room]);

	const updatePublicLobbyVisibility = useCallback(
		(nextIsPublic: boolean) => {
			if (!room?.roomId) {
				return;
			}
			multiplayerService.emit(MultiplayerEvent.UPDATE_ROOM_LOBBY_VISIBILITY, {
				roomId: room.roomId,
				isPublicLobby: nextIsPublic,
			});
		},
		[room?.roomId]
	);

	const startGame = useCallback(() => {
		const roomIdToStart = room?.roomId;
		if (roomIdToStart) {
			dispatch(setMultiplayerLoading(true));
			isLoadingRef.current = true;
			multiplayerService.emit(MultiplayerEvent.START_GAME, { roomId: roomIdToStart });
		}
	}, [room, dispatch]);

	const submitAnswer = useCallback((roomId: string, questionId: string, answer: number, timeSpent: number) => {
		lastSubmittedAnswerRef.current = { questionId, answerIndex: answer };
		multiplayerService.emit(MultiplayerEvent.SUBMIT_ANSWER, {
			roomId,
			questionId,
			answer,
			timeSpent,
		});
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

	// Loading state management
	const [loadingStep, setLoadingStep] = useState<LoadingMessages | null>(null);

	useEffect(() => {
		const step = !isConnected
			? room != null &&
				(room.status === RoomStatus.PLAYING ||
					room.status === RoomStatus.STARTING ||
					room.status === RoomStatus.WAITING)
				? LoadingMessages.MULTIPLAYER_RECONNECTING
				: isLoading
					? LoadingMessages.AUTHENTICATING
					: LoadingMessages.CONNECTING_TO_SOCKET
			: !room
				? isLoading
					? LoadingMessages.JOINING_ROOM
					: null
				: !gameState
					? room.status === RoomStatus.PLAYING
						? LoadingMessages.LOADING_MULTIPLAYER_QUESTIONS
						: LoadingMessages.WAITING_FOR_GAME_STATE
					: null;
		setLoadingStep(step);
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
		updatePublicLobbyVisibility,
		startGame,
		submitAnswer,
		loadingStep,
		displayMessage,
	};
};
