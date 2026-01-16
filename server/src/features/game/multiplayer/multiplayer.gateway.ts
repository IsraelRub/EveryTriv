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
	ERROR_CODES,
	GAME_MODE_DEFAULTS,
	GameMode,
	HttpMethod,
	MultiplayerEvent,
	PlayerStatus,
	RoomStatus,
	TIME_PERIODS_MS,
} from '@shared/constants';
import type { GameEventDataMap, GameEventType, MultiplayerGameEvent, MultiplayerRoom } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import type { TypedSocket } from '@internal/types';

import { WsCurrentUserId } from '../../../common/decorators';
import { WsAuthGuard } from '../../../common/guards';
import { LOCALHOST_CONFIG } from '../../../config/localhost.config';
import { CreateRoomDto, JoinRoomDto, MultiplayerSubmitAnswerDto } from './dtos';
import { MultiplayerService } from './multiplayer.service';
import { QuestionSchedulerService } from './questionScheduler.service';

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
		private readonly questionScheduler: QuestionSchedulerService
	) {}

	private createGameEvent<T extends GameEventType>(
		type: T,
		roomId: string,
		data: GameEventDataMap[T]
	): MultiplayerGameEvent {
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
				throw new Error(ERROR_CODES.USER_NOT_AUTHENTICATED);
			}

			const { room, code } = await this.multiplayerService.createRoom(userId, {
				topic: data.topic,
				difficulty: data.difficulty,
				questionsPerRequest: data.questionsPerRequest,
				maxPlayers: data.maxPlayers,
				gameMode: data.gameMode,
				timePerQuestion: GAME_MODE_DEFAULTS[GameMode.MULTIPLAYER].timePerQuestion,
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
			client.emit('error', {
				message: getErrorMessage(error),
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
				throw new Error(ERROR_CODES.USER_NOT_AUTHENTICATED);
			}

			// Store player count before join to detect if this is a new join
			const roomBeforeJoin = await this.multiplayerService.getRoom(data.roomId);
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
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	@SubscribeMessage('leave-room')
	async handleLeaveRoom(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: { roomId: string },
		@ConnectedSocket() client: TypedSocket
	) {
		try {
			if (!userId) {
				throw new Error(ERROR_CODES.USER_NOT_AUTHENTICATED);
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
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	@SubscribeMessage('start-game')
	async handleStartGame(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: { roomId: string },
		@ConnectedSocket() client: TypedSocket
	) {
		try {
			if (!userId) {
				throw new Error(ERROR_CODES.USER_NOT_AUTHENTICATED);
			}

			const room = await this.multiplayerService.startGame(data.roomId, userId);

			// Broadcast game started
			const gameStartedEvent = this.createGameEvent(MultiplayerEvent.GAME_STARTED, data.roomId, {
				questions: room.questions,
				config: room.config,
			});
			this.broadcastToRoom(data.roomId, gameStartedEvent);

			// Start first question
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
			client.emit('error', {
				message: getErrorMessage(error),
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
				throw new Error(ERROR_CODES.USER_NOT_AUTHENTICATED);
			}

			const result = await this.multiplayerService.submitAnswer(
				data.roomId,
				userId,
				data.questionId,
				data.answer,
				data.timeSpent
			);

			// Broadcast answer received
			const answerReceivedEvent = this.createGameEvent(MultiplayerEvent.ANSWER_RECEIVED, data.roomId, {
				userId,
				questionId: data.questionId,
				isCorrect: result.isCorrect,
				scoreEarned: result.scoreEarned,
				leaderboard: result.leaderboard,
			});
			this.broadcastToRoom(data.roomId, answerReceivedEvent);

			// Update leaderboard
			const leaderboardUpdateEvent = this.createGameEvent(MultiplayerEvent.LEADERBOARD_UPDATE, data.roomId, {
				leaderboard: result.leaderboard ?? [],
			});
			this.broadcastToRoom(data.roomId, leaderboardUpdateEvent);

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
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	private async startQuestion(room: MultiplayerRoom) {
		if (room.status !== RoomStatus.PLAYING) {
			return;
		}

		const questionData = await this.multiplayerService.startQuestion(room.roomId);
		if (!questionData) {
			return;
		}

		const questionStartedEvent = this.createGameEvent(MultiplayerEvent.QUESTION_STARTED, room.roomId, questionData);
		this.broadcastToRoom(room.roomId, questionStartedEvent);

		this.questionScheduler.scheduleAnswerCheck(
			room.roomId,
			TIME_PERIODS_MS.SECOND,
			async () => {
				return await this.multiplayerService.checkAllPlayersAnswered(room.roomId);
			},
			async () => {
				await this.endQuestion(room.roomId);
			}
		);
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

			// Broadcast question ended
			const questionEndedEvent = this.createGameEvent(MultiplayerEvent.QUESTION_ENDED, roomId, {
				questionId: endResult.questionId,
				correctAnswer: endResult.correctAnswer,
				results: endResult.results,
				leaderboard: endResult.leaderboard,
			});
			this.broadcastToRoom(roomId, questionEndedEvent);

			this.questionScheduler.cancelSchedule(roomId);

			const updatedRoom = await this.multiplayerService.nextQuestion(roomId);

			if (updatedRoom.status === RoomStatus.FINISHED) {
				this.questionScheduler.cancelSchedule(roomId);

				const finalGameState = await this.multiplayerService.getGameState(roomId);
				const winner = finalGameState.leaderboard[0] ?? null;
				const gameDuration =
					updatedRoom.endTime && updatedRoom.startTime
						? updatedRoom.endTime.getTime() - updatedRoom.startTime.getTime()
						: 0;

				const gameEndedEvent = this.createGameEvent(MultiplayerEvent.GAME_ENDED, roomId, {
					finalLeaderboard: finalGameState.leaderboard,
					winner,
					gameDuration,
				});
				this.broadcastToRoom(roomId, gameEndedEvent);
			} else {
				setTimeout(() => {
					this.startQuestion(updatedRoom).catch(error => {
						logger.gameError('Failed to start next question', {
							errorInfo: { message: getErrorMessage(error) },
							roomId,
						});
					});
				}, TIME_PERIODS_MS.TWO_SECONDS);
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
			const rooms = await this.multiplayerService.findRoomsByUserId(userId);
			for (const room of rooms) {
				// Rejoin socket to room
				client.join(room.roomId);
				client.data.roomId = room.roomId;

				// Send current game state
				await this.sendGameStateToClient(client, room);

				logger.gameInfo('User reconnected to room', {
					roomId: room.roomId,
					userId,
				});
			}
		} catch (error) {
			logger.gameError('Failed to handle reconnection', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
		}
	}

	private async sendGameStateToClient(client: TypedSocket, room: MultiplayerRoom): Promise<void> {
		try {
			const gameState = await this.multiplayerService.getGameState(room.roomId);
			client.emit('room-joined', {
				room,
				gameState,
			});

			// If there's a current question, send question-started event
			if (room.status === RoomStatus.PLAYING && gameState.currentQuestion && room.currentQuestionStartTime) {
				const serverStartTimestamp = room.currentQuestionStartTime.getTime();
				const serverEndTimestamp = serverStartTimestamp + room.config.timePerQuestion * 1000;
				const questionStartedEvent = this.createGameEvent(MultiplayerEvent.QUESTION_STARTED, room.roomId, {
					question: gameState.currentQuestion,
					questionIndex: gameState.currentQuestionIndex,
					timeLimit: room.config.timePerQuestion,
					serverStartTimestamp,
					serverEndTimestamp,
				});
				client.emit('question-started', questionStartedEvent.data);
			}
		} catch (error) {
			logger.gameError('Failed to send game state to client', {
				errorInfo: { message: getErrorMessage(error) },
				roomId: room.roomId,
			});
		}
	}

	private async handleAllPlayersDisconnected(roomId: string): Promise<void> {
		try {
			this.questionScheduler.cancelSchedule(roomId);

			// Update room status to cancelled
			await this.multiplayerService.cancelGame(roomId);

			// Broadcast game cancelled as error event
			const errorEvent = this.createGameEvent(MultiplayerEvent.ERROR, roomId, {
				message: 'Game cancelled: All players disconnected',
				code: ERROR_CODES.GAME_CANCELLED,
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

	private broadcastToRoom(roomId: string, event: MultiplayerGameEvent) {
		this.server.to(roomId).emit(event.type, event);
	}
}
