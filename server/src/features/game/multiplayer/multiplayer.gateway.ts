import { UseGuards } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

import {
	DEFAULT_LANGUAGE,
	ErrorCode,
	GameMode,
	HttpMethod,
	LOCALHOST_CONFIG,
	Locale,
	MULTIPLAYER_TIME_PER_QUESTION,
	MultiplayerEvent,
	PlayerStatus,
	RoomStatus,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { GameEvent, GameEventDataMap, GameEventType, MultiplayerRoom } from '@shared/types';
import { getErrorCode, getErrorMessage } from '@shared/utils';
import { isLocale, toDifficultyLevel } from '@shared/validation';

import { WsCurrentUserId } from '@common/decorators';
import { GameTextLanguageGateService } from '@common/validation';
import { WsAuthGuard } from '@common/guards';
import { serverLogger as logger } from '@internal/services';
import type { TypedSocket } from '@internal/types';

import { GameService } from '../game.service';
import { CreateRoomDto, JoinRoomDto, MultiplayerSubmitAnswerDto, RoomActionDto } from './dtos';
import { MultiplayerService } from './multiplayer.service';
import { QuestionSchedulerService } from './questionScheduler.service';
import { RoomService } from './room.service';

@WebSocketGateway({
	namespace: '/multiplayer',
	cors: {
		origin: [process.env.CLIENT_URL ?? LOCALHOST_CONFIG.urls.CLIENT, 'http://localhost:5173', 'http://localhost:3001'],
		methods: [HttpMethod.GET, HttpMethod.POST],
		credentials: true,
	},
	transports: ['websocket', 'polling'],
	allowEIO3: true,
})
@UseGuards(WsAuthGuard)
export class MultiplayerGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server!: Server;

	private readonly endingRooms = new Set<string>();

	constructor(
		private readonly multiplayerService: MultiplayerService,
		private readonly questionScheduler: QuestionSchedulerService,
		private readonly gameService: GameService,
		private readonly roomService: RoomService,
		private readonly gameTextLanguageGate: GameTextLanguageGateService
	) {}

	private createGameEvent<T extends GameEventType>(type: T, roomId: string, data: GameEventDataMap[T]): GameEvent {
		return {
			type,
			roomId,
			timestamp: new Date(),
			data,
		};
	}

	async handleConnection(client: TypedSocket) {
		const hasAuthToken = !!client.handshake.auth?.token;
		const hasQueryToken = !!client.handshake.query?.token;
		const userId = client.data.userId;

		logger.gameInfo('WebSocket client attempting connection to multiplayer gateway', {
			clientId: client.id,
			url: client.handshake.url,
			userId: userId ?? undefined,
			hasAuthToken,
			hasQueryToken,
		});

		// Handle reconnection - find rooms user is in and send current state
		logger.gameInfo('Client connected to multiplayer gateway', {
			clientId: client.id,
			userId: userId ?? undefined,
		});

		if (userId) {
			await this.handleReconnection(client, userId);
		}
	}

	async handleDisconnect(client: TypedSocket) {
		try {
			const roomId = client.data.roomId;
			const userId = client.data.userId;

			// Cleanup timers if room exists
			if (roomId) {
				this.questionScheduler.cancelSchedule(roomId);
			}

			if (roomId && userId) {
				const room = await this.multiplayerService.leaveRoom(roomId, userId);

				// Check if all players disconnected
				if (room) {
					const activePlayers = room.players.filter(p => p.status !== PlayerStatus.DISCONNECTED);
					if (activePlayers.length === 0) {
						// All players disconnected - cancel game
						await this.handleAllPlayersDisconnected(roomId);
					} else {
						const event = this.createGameEvent(MultiplayerEvent.PLAYER_LEFT, roomId, { userId, players: room.players });
						this.broadcastToRoom(roomId, event);
					}
				}
			}

			logger.gameInfo('Client disconnected from multiplayer gateway', {
				clientId: client.id,
				roomId,
				userId,
			});
		} catch (error) {
			logger.gameError('Error handling disconnect', {
				errorInfo: { message: getErrorMessage(error) },
				clientId: client.id,
			});
		}
	}

	@SubscribeMessage('create-room')
	async handleCreateRoom(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: CreateRoomDto,
		@ConnectedSocket() client: TypedSocket
	) {
		try {
			if (!userId) {
				throw new Error(ErrorCode.USER_NOT_AUTHENTICATED);
			}

			const outputLanguage: Locale =
				data.outputLanguage != null && isLocale(data.outputLanguage) ? data.outputLanguage : DEFAULT_LANGUAGE;
			await this.gameTextLanguageGate.assertTriviaGameInputValid(data.topic, data.difficulty, outputLanguage);

			const { room, code } = await this.multiplayerService.createRoom(userId, {
				topic: data.topic,
				difficulty: data.difficulty,
				questionsPerRequest: data.questionsPerRequest,
				maxPlayers: data.maxPlayers,
				answerCount: data.answerCount,
				mappedDifficulty: data.mappedDifficulty ?? toDifficultyLevel(data.difficulty),
			});

			// Join client to room
			client.join(room.roomId);
			client.data.roomId = room.roomId;

			// Emit room created event
			client.emit('room-created', {
				room,
				code,
			});

			// Broadcast player joined
			const firstPlayer = room.players[0];
			if (firstPlayer != null) {
				const playerJoinedEvent = this.createGameEvent(MultiplayerEvent.PLAYER_JOINED, room.roomId, {
					player: firstPlayer,
					players: room.players,
				});
				this.broadcastToRoom(room.roomId, playerJoinedEvent);
			}

			logger.gameInfo('Room created via WebSocket', {
				roomId: room.roomId,
				userId,
			});
		} catch (error) {
			logger.gameError('Failed to create room via WebSocket', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			const code = getErrorCode(error);
			client.emit('error', {
				message: getErrorMessage(error),
				...(code && { code }),
			});
		}
	}

	@SubscribeMessage('join-room')
	async handleJoinRoom(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: JoinRoomDto,
		@ConnectedSocket() client: TypedSocket
	) {
		try {
			if (!userId) {
				throw new Error(ErrorCode.USER_NOT_AUTHENTICATED);
			}

			// Store player count before join to detect if this is a new join
			const roomBeforeJoin = await this.roomService.getRoom(data.roomId);
			const playerCountBeforeJoin = roomBeforeJoin?.players.length ?? 0;

			const room = await this.multiplayerService.joinRoom(data.roomId, userId);

			// Join client to room
			client.join(room.roomId);
			client.data.roomId = room.roomId;

			// Send current game state if game is playing
			// Always send room state (with gameState) when joining
			await this.sendGameStateToClient(client, room);

			// Only broadcast player joined if this was a new join (player count increased)
			const isNewJoin = room.players.length > playerCountBeforeJoin;
			if (isNewJoin) {
				const joinedPlayer = room.players.find(p => p.userId === userId);
				if (joinedPlayer) {
					const playerJoinedEvent = this.createGameEvent(MultiplayerEvent.PLAYER_JOINED, room.roomId, {
						player: joinedPlayer,
						players: room.players,
					});
					this.broadcastToRoom(room.roomId, playerJoinedEvent);
				}
				// Log only for new joins - rejoin logging is handled in roomService
				logger.gameInfo('Player joined room via WebSocket', {
					roomId: room.roomId,
					userId,
				});
			}
		} catch (error) {
			logger.gameError('Failed to join room via WebSocket', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: data.roomId,
			});
			const code = getErrorCode(error);
			client.emit('error', {
				message: getErrorMessage(error),
				...(code && { code }),
			});
		}
	}

	@SubscribeMessage('leave-room')
	async handleLeaveRoom(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: RoomActionDto,
		@ConnectedSocket() client: TypedSocket
	) {
		try {
			if (!userId) {
				throw new Error(ErrorCode.USER_NOT_AUTHENTICATED);
			}

			const room = await this.multiplayerService.leaveRoom(data.roomId, userId);

			// Leave client from room
			client.leave(data.roomId);
			delete client.data.roomId;

			// Emit room left event
			client.emit('room-left', {
				roomId: data.roomId,
			});

			// Broadcast player left if room still exists
			if (room) {
				const playerLeftEvent = this.createGameEvent(MultiplayerEvent.PLAYER_LEFT, data.roomId, {
					userId,
					players: room.players,
				});
				this.broadcastToRoom(data.roomId, playerLeftEvent);
			}

			logger.gameInfo('Player left room via WebSocket', {
				roomId: data.roomId,
				userId,
			});
		} catch (error) {
			logger.gameError('Failed to leave room via WebSocket', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: data.roomId,
			});
			const code = getErrorCode(error);
			client.emit('error', {
				message: getErrorMessage(error),
				...(code && { code }),
			});
		}
	}

	@SubscribeMessage('start-game')
	async handleStartGame(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: RoomActionDto,
		@ConnectedSocket() client: TypedSocket
	) {
		try {
			if (!userId) {
				throw new Error(ErrorCode.USER_NOT_AUTHENTICATED);
			}

			let room = await this.roomService.getRoom(data.roomId);
			if (!room) {
				throw new Error(ErrorCode.ROOM_NOT_FOUND);
			}
			if (room.hostId !== userId) {
				throw new Error(ErrorCode.ONLY_HOST_CAN_START);
			}
			if (room.status !== RoomStatus.WAITING) {
				throw new Error(ErrorCode.GAME_ALREADY_STARTED_OR_FINISHED);
			}
			if (room.players.length < VALIDATION_COUNT.PLAYERS.MIN) {
				throw new Error(ErrorCode.NEED_AT_LEAST_2_PLAYERS);
			}

			room = await this.roomService.updateRoomStatus(data.roomId, RoomStatus.STARTING);
			this.broadcastToRoom(data.roomId, this.createGameEvent(MultiplayerEvent.ROOM_UPDATED, data.roomId, { room }));

			try {
				room = await this.multiplayerService.startGame(data.roomId, userId);
			} catch (startError) {
				await this.roomService.updateRoomStatus(data.roomId, RoomStatus.WAITING);
				const revertedRoom = await this.roomService.getRoom(data.roomId);
				if (revertedRoom) {
					this.broadcastToRoom(
						data.roomId,
						this.createGameEvent(MultiplayerEvent.ROOM_UPDATED, data.roomId, { room: revertedRoom })
					);
				}
				throw startError;
			}

			const gameStartedEvent = this.createGameEvent(MultiplayerEvent.GAME_STARTED, data.roomId, {
				questions: room.questions,
				config: room.config,
			});
			this.broadcastToRoom(data.roomId, gameStartedEvent);

			await this.startQuestion(room);

			logger.gameInfo('Game started via WebSocket', {
				roomId: data.roomId,
				userId,
			});
		} catch (error) {
			logger.gameError('Failed to start game via WebSocket', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: data.roomId,
			});
			const code = getErrorCode(error);
			client.emit('error', {
				message: getErrorMessage(error),
				...(code && { code }),
			});
		}
	}

	@SubscribeMessage('submit-answer')
	async handleSubmitAnswer(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: MultiplayerSubmitAnswerDto,
		@ConnectedSocket() client: TypedSocket
	) {
		try {
			if (!userId) {
				throw new Error(ErrorCode.USER_NOT_AUTHENTICATED);
			}

			const result = await this.multiplayerService.submitAnswer(
				data.roomId,
				userId,
				data.questionId,
				data.answer,
				data.timeSpent
			);

			const answerReceivedEvent = this.createGameEvent(MultiplayerEvent.ANSWER_RECEIVED, data.roomId, {
				userId,
				questionId: data.questionId,
				answerIndex: data.answer,
				isCorrect: result.isCorrect,
				scoreEarned: result.scoreEarned,
				leaderboard: result.leaderboard,
				answerCounts: result.answerCounts ?? {},
			});
			this.broadcastToRoom(data.roomId, answerReceivedEvent);

			logger.gameInfo('Answer submitted via WebSocket', {
				roomId: data.roomId,
				userId,
				questionId: data.questionId,
				isCorrect: result.isCorrect,
			});
		} catch (error) {
			logger.gameError('Failed to submit answer via WebSocket', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: data.roomId,
			});
			const code = getErrorCode(error);
			client.emit('error', {
				message: getErrorMessage(error),
				...(code && { code }),
			});
		}
	}

	private async startQuestion(room: MultiplayerRoom) {
		if (room.status !== RoomStatus.PLAYING) {
			return;
		}

		const questionStartResponse = await this.multiplayerService.startQuestion(room.roomId);
		if (!questionStartResponse) {
			return;
		}

		const questionStartedEvent = this.createGameEvent(
			MultiplayerEvent.QUESTION_STARTED,
			room.roomId,
			questionStartResponse
		);
		this.broadcastToRoom(room.roomId, questionStartedEvent);

		const durationMs = MULTIPLAYER_TIME_PER_QUESTION * TIME_PERIODS_MS.SECOND;
		this.questionScheduler.scheduleQuestionEnd(room.roomId, durationMs, async () => {
			await this.endQuestion(room.roomId);
		});
	}

	private async endQuestion(roomId: string) {
		if (this.endingRooms.has(roomId)) {
			return;
		}

		try {
			this.endingRooms.add(roomId);

			const endResult = await this.multiplayerService.endQuestion(roomId);
			if (!endResult) {
				this.endingRooms.delete(roomId);
				return;
			}

			// Broadcast question ended (include answerCounts so clients show per-answer player counts at reveal)
			const questionEndedEvent = this.createGameEvent(MultiplayerEvent.QUESTION_ENDED, roomId, {
				questionId: endResult.questionId,
				correctAnswer: endResult.correctAnswer,
				results: endResult.results,
				leaderboard: endResult.leaderboard,
				...(endResult.answerCounts !== undefined && { answerCounts: endResult.answerCounts }),
			});
			this.broadcastToRoom(roomId, questionEndedEvent);

			this.questionScheduler.cancelSchedule(roomId);

			const updatedRoom = await this.multiplayerService.nextQuestion(roomId);

			if (updatedRoom.status === RoomStatus.FINISHED) {
				this.questionScheduler.cancelSchedule(roomId);

				const finalGameState = await this.multiplayerService.getGameState(roomId);
				const leaderboard = finalGameState.leaderboard;
				const first = leaderboard[0] ?? null;
				const tiedAtTop = first !== null && leaderboard.filter(p => p.score === first.score).length > 1;
				const winner = first !== null && !tiedAtTop ? first : null;
				const gameDurationMs =
					updatedRoom.endTime && updatedRoom.startTime
						? new Date(updatedRoom.endTime).getTime() - new Date(updatedRoom.startTime).getTime()
						: 0;
				const gameDurationSeconds = Math.round(gameDurationMs / TIME_PERIODS_MS.SECOND);

				const gameEndedEvent = this.createGameEvent(MultiplayerEvent.GAME_ENDED, roomId, {
					finalLeaderboard: finalGameState.leaderboard,
					winner,
					gameDuration: gameDurationMs,
				});
				this.broadcastToRoom(roomId, gameEndedEvent);

				const topic = updatedRoom.config?.topic ?? '';
				const difficulty =
					updatedRoom.config?.mappedDifficulty ?? toDifficultyLevel(updatedRoom.config?.difficulty ?? 'medium');
				const gameQuestionCount = updatedRoom.questions?.length ?? 0;

				for (const player of finalGameState.leaderboard) {
					try {
						await this.gameService.saveGameHistory({
							userId: player.userId,
							gameData: {
								score: player.score,
								gameQuestionCount,
								correctAnswers: player.correctAnswers ?? 0,
								difficulty,
								gameMode: GameMode.MULTIPLAYER,
								creditsUsed: 0,
								answerHistory: [],
								topic,
								timeSpent: gameDurationSeconds,
							},
						});
					} catch (saveError) {
						logger.gameError('Failed to save multiplayer game to history', {
							errorInfo: { message: getErrorMessage(saveError) },
							roomId,
							userId: player.userId,
						});
					}
				}
			} else {
				setTimeout(() => {
					this.startNextQuestionAsync(updatedRoom, roomId);
				}, TIME_PERIODS_MS.ONE_AND_HALF_SECONDS);
			}

			this.endingRooms.delete(roomId);
		} catch (error) {
			logger.gameError('Failed to end question', {
				errorInfo: { message: getErrorMessage(error) },
				roomId,
			});
			this.endingRooms.delete(roomId);
		}
	}

	private async handleReconnection(client: TypedSocket, userId: string): Promise<void> {
		try {
			const rooms = await this.roomService.findRoomsByUserId(userId);
			for (const room of rooms) {
				try {
					// Rejoin socket to room
					client.join(room.roomId);
					client.data.roomId = room.roomId;

					// Send current game state (may fail if room was deleted after findRoomsByUserId)
					await this.sendGameStateToClient(client, room);

					logger.gameInfo('User reconnected to room', {
						roomId: room.roomId,
						userId,
					});
				} catch (roomError) {
					logger.gameError('Failed to send game state for reconnection, skipping room', {
						errorInfo: { message: getErrorMessage(roomError) },
						roomId: room.roomId,
						userId,
					});
				}
			}
		} catch (error) {
			logger.gameError('Failed to handle reconnection', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
		}
	}

	private async sendGameStateToClient(client: TypedSocket, room: MultiplayerRoom): Promise<void> {
		const gameState = await this.multiplayerService.getGameState(room.roomId);
		client.emit('room-joined', {
			room,
			gameState,
		});

		// If there's a current question, send question-started event
		if (room.status === RoomStatus.PLAYING && gameState.currentQuestion && room.currentQuestionStartTime) {
			const serverStartTimestamp = new Date(room.currentQuestionStartTime).getTime();
			const serverEndTimestamp = serverStartTimestamp + MULTIPLAYER_TIME_PER_QUESTION * TIME_PERIODS_MS.SECOND;
			const questionStartedEvent = this.createGameEvent(MultiplayerEvent.QUESTION_STARTED, room.roomId, {
				question: gameState.currentQuestion,
				questionIndex: gameState.currentQuestionIndex,
				timeLimit: MULTIPLAYER_TIME_PER_QUESTION,
				serverStartTimestamp,
				serverEndTimestamp,
			});
			client.emit('question-started', questionStartedEvent.data);
		}
	}

	private async handleAllPlayersDisconnected(roomId: string): Promise<void> {
		try {
			this.questionScheduler.cancelSchedule(roomId);

			// Update room status to cancelled
			await this.roomService.updateRoomStatus(roomId, RoomStatus.CANCELLED);

			// Broadcast game cancelled as error event
			const errorEvent = this.createGameEvent(MultiplayerEvent.ERROR, roomId, {
				message: 'Game cancelled: All players disconnected',
				code: ErrorCode.GAME_CANCELLED,
			});
			this.broadcastToRoom(roomId, errorEvent);

			logger.gameInfo('Game cancelled - all players disconnected', { roomId });
		} catch (error) {
			logger.gameError('Failed to handle all players disconnected', {
				errorInfo: { message: getErrorMessage(error) },
				roomId,
			});
		}
	}

	private broadcastToRoom(roomId: string, event: GameEvent) {
		this.server.to(roomId).emit(event.type, event);
	}

	private startNextQuestionAsync(room: MultiplayerRoom, roomId: string): void {
		const handleStartQuestion = async () => {
			try {
				await this.startQuestion(room);
			} catch (error) {
				logger.gameError('Failed to start next question', {
					errorInfo: { message: getErrorMessage(error) },
					roomId,
				});
			}
		};
		handleStartQuestion();
	}
}
