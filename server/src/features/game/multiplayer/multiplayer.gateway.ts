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
	HttpMethod,
	LOCALHOST_CONFIG,
	MULTIPLAYER_CONFIG,
	PlayerStatus,
	RoomStatus,
} from '@shared/constants';
import type { GameEventDataMap, GameEventType, MultiplayerGameEvent, MultiplayerRoom } from '@shared/types';
import { calculateAnswerScore, getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import type { RoomTimerMap, TypedSocket } from '@internal/types';

import { WsCurrentUserId } from '../../../common/decorators';
import { WsAuthGuard } from '../../../common/guards';
import { CreateRoomDto, JoinRoomDto, SubmitAnswerDto } from './dtos';
import { MultiplayerService } from './multiplayer.service';
import { RoomService } from './room.service';

/**
 * WebSocket Gateway for multiplayer games
 * @class MultiplayerGateway
 * @description Handles all WebSocket events for multiplayer simultaneous trivia games
 */
@WebSocketGateway({
	namespace: '/multiplayer',
	cors: {
		origin: [process.env.CLIENT_URL || LOCALHOST_CONFIG.urls.CLIENT, 'http://localhost:5173', 'http://localhost:3001'],
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

	private readonly roomTimers: RoomTimerMap = {};

	constructor(
		private readonly multiplayerService: MultiplayerService,
		private readonly roomService: RoomService
	) {}

	/**
	 * Create a game event
	 * @param type Event type
	 * @param roomId Room ID
	 * @param data Event data matching the event type
	 * @returns Game event with type safety
	 */
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

	/**
	 * Handle client connection
	 */
	async handleConnection(client: TypedSocket) {
		const hasAuthToken = !!client.handshake.auth?.token;
		const hasQueryToken = !!client.handshake.query?.token;
		const userId = client.data.userId;

		logger.gameInfo('WebSocket client attempting connection to multiplayer gateway', {
			clientId: client.id,
			url: client.handshake.url,
			userId: userId || undefined,
			hasAuthToken,
			hasQueryToken,
		});

		// Handle reconnection - find rooms user is in and send current state
		logger.gameInfo('Client connected to multiplayer gateway', {
			clientId: client.id,
			userId: userId || undefined,
		});

		if (userId) {
			await this.handleReconnection(client, userId);
		}
	}

	/**
	 * Handle client disconnection
	 */
	async handleDisconnect(client: TypedSocket) {
		try {
			const roomId = client.data.roomId;
			const userId = client.data.userId;

			// Cleanup timers if room exists
			if (roomId && this.roomTimers[roomId]) {
				this.cleanupRoomTimers(roomId);
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
						const event = this.createGameEvent('player-left', roomId, { userId, players: room.players });
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
				error: getErrorMessage(error),
				clientId: client.id,
			});
		}
	}

	/**
	 * Create a new multiplayer room
	 */
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
				timePerQuestion: MULTIPLAYER_CONFIG.TIME_PER_QUESTION,
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
			const playerJoinedEvent = this.createGameEvent('player-joined', room.roomId, {
				player: room.players[0],
				players: room.players,
			});
			this.broadcastToRoom(room.roomId, playerJoinedEvent);

			logger.gameInfo('Room created via WebSocket', {
				roomId: room.roomId,
				userId,
			});
		} catch (error) {
			logger.gameError('Failed to create room via WebSocket', {
				error: getErrorMessage(error),
				userId,
			});
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	/**
	 * Join an existing room
	 */
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

			const room = await this.multiplayerService.joinRoom(data.roomId, userId);

			// Join client to room
			client.join(room.roomId);
			client.data.roomId = room.roomId;

			// Send current game state if game is playing
			// Always send room state (with gameState) when joining
			await this.sendGameStateToClient(client, room);

			// Broadcast player joined
			const joinedPlayer = room.players.find(p => p.userId === userId);
			if (joinedPlayer) {
				const playerJoinedEvent = this.createGameEvent('player-joined', room.roomId, {
					player: joinedPlayer,
					players: room.players,
				});
				this.broadcastToRoom(room.roomId, playerJoinedEvent);
			}

			logger.gameInfo('Player joined room via WebSocket', {
				roomId: room.roomId,
				userId,
			});
		} catch (error) {
			logger.gameError('Failed to join room via WebSocket', {
				error: getErrorMessage(error),
				userId,
				roomId: data.roomId,
			});
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	/**
	 * Leave a room
	 */
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
				const playerLeftEvent = this.createGameEvent('player-left', data.roomId, { userId, players: room.players });
				this.broadcastToRoom(data.roomId, playerLeftEvent);
			}

			logger.gameInfo('Player left room via WebSocket', {
				roomId: data.roomId,
				userId,
			});
		} catch (error) {
			logger.gameError('Failed to leave room via WebSocket', {
				error: getErrorMessage(error),
				userId,
				roomId: data.roomId,
			});
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	/**
	 * Start the game (host only)
	 */
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
			const gameStartedEvent = this.createGameEvent('game-started', data.roomId, {
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
				error: getErrorMessage(error),
				userId,
				roomId: data.roomId,
			});
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	/**
	 * Submit an answer
	 */
	@SubscribeMessage('submit-answer')
	async handleSubmitAnswer(
		@WsCurrentUserId() userId: string,
		@MessageBody() data: SubmitAnswerDto,
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
			const answerReceivedEvent = this.createGameEvent('answer-received', data.roomId, {
				userId,
				questionId: data.questionId,
				isCorrect: result.isCorrect,
				scoreEarned: result.scoreEarned,
				leaderboard: result.leaderboard,
			});
			this.broadcastToRoom(data.roomId, answerReceivedEvent);

			// Update leaderboard
			const leaderboardUpdateEvent = this.createGameEvent('leaderboard-update', data.roomId, {
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
				error: getErrorMessage(error),
				userId,
				roomId: data.roomId,
			});
			client.emit('error', {
				message: getErrorMessage(error),
			});
		}
	}

	/**
	 * Start a question (internal method)
	 */
	private async startQuestion(room: MultiplayerRoom) {
		// Check if question already ended or game finished
		if (room.status !== RoomStatus.PLAYING) {
			return;
		}

		const question = room.questions[room.currentQuestionIndex];
		if (!question) {
			return;
		}

		// Update room with question start time in Redis
		const questionStartTime = new Date();
		await this.roomService.updateRoom(room.roomId, {
			currentQuestionStartTime: questionStartTime,
		});

		// Broadcast question started
		const questionStartedEvent = this.createGameEvent('question-started', room.roomId, {
			question,
			questionIndex: room.currentQuestionIndex,
			timeLimit: room.config.timePerQuestion,
		});
		this.broadcastToRoom(room.roomId, questionStartedEvent);

		// Cleanup existing timers for this room
		if (this.roomTimers[room.roomId]) {
			this.cleanupRoomTimers(room.roomId);
		}

		// Set timeout to end question
		const timeoutId = setTimeout(async () => {
			if (this.roomTimers[room.roomId]) {
				clearInterval(this.roomTimers[room.roomId].checkInterval);
				delete this.roomTimers[room.roomId];
			}
			await this.endQuestion(room.roomId);
		}, room.config.timePerQuestion * 1000);

		// Check periodically if all players answered (every 1 second)
		const checkInterval = setInterval(async () => {
			const currentRoom = await this.multiplayerService.getRoom(room.roomId);
			if (!currentRoom || currentRoom.status !== RoomStatus.PLAYING) {
				clearInterval(checkInterval);
				if (this.roomTimers[room.roomId]) {
					clearTimeout(this.roomTimers[room.roomId].timeoutId);
					delete this.roomTimers[room.roomId];
				}
				return;
			}

			const allAnswered = await this.multiplayerService.allPlayersAnswered(room.roomId);
			if (allAnswered) {
				clearInterval(checkInterval);
				if (this.roomTimers[room.roomId]) {
					clearTimeout(this.roomTimers[room.roomId].timeoutId);
					delete this.roomTimers[room.roomId];
				}
				await this.endQuestion(room.roomId);
			}
		}, 1000);

		// Store timers for cleanup
		this.roomTimers[room.roomId] = { checkInterval, timeoutId };
	}

	/**
	 * End current question (internal method)
	 */
	private async endQuestion(roomId: string) {
		try {
			const room = await this.multiplayerService.getRoom(roomId);
			if (!room || room.status !== RoomStatus.PLAYING) {
				return;
			}

			const currentQuestion = room.questions[room.currentQuestionIndex];
			if (!currentQuestion) {
				return;
			}

			// Get results for all players
			const results = room.players.map(player => {
				const isCorrect = player.currentAnswer === currentQuestion.correctAnswerIndex;
				// Calculate score using the same method as submitAnswer for consistency
				// Use the streak value that was used when the answer was submitted
				// (correctAnswers - 1 if answer was correct, since it was incremented after scoring)
				const streak = isCorrect ? player.correctAnswers - 1 : player.correctAnswers;
				const difficulty =
					currentQuestion.metadata?.mappedDifficulty ??
					room.config.mappedDifficulty ??
					toDifficultyLevel(currentQuestion.difficulty);
				const scoreEarned = calculateAnswerScore(difficulty, player.timeSpent || 0, streak, isCorrect);
				return {
					userId: player.userId,
					isCorrect,
					scoreEarned,
				};
			});

			// Get updated game state for leaderboard
			const gameState = await this.multiplayerService.getGameState(roomId);

			// Broadcast question ended
			const questionEndedEvent = this.createGameEvent('question-ended', roomId, {
				questionId: currentQuestion.id,
				correctAnswer: currentQuestion.correctAnswerIndex,
				results,
				leaderboard: gameState.leaderboard,
			});
			this.broadcastToRoom(roomId, questionEndedEvent);

			// Cleanup timers for current question
			this.cleanupRoomTimers(roomId);

			// Move to next question or end game (automatic, no host required)
			const updatedRoom = await this.multiplayerService.nextQuestion(roomId);

			if (updatedRoom.status === RoomStatus.FINISHED) {
				// Cleanup all timers
				this.cleanupRoomTimers(roomId);

				// Broadcast game ended
				const finalGameState = await this.multiplayerService.getGameState(roomId);
				const winner = finalGameState.leaderboard[0] || null;
				const gameDuration =
					updatedRoom.endTime && updatedRoom.startTime
						? updatedRoom.endTime.getTime() - updatedRoom.startTime.getTime()
						: 0;

				const gameEndedEvent = this.createGameEvent('game-ended', roomId, {
					finalLeaderboard: finalGameState.leaderboard,
					winner,
					gameDuration,
				});
				this.broadcastToRoom(roomId, gameEndedEvent);
			} else {
				// Start next question after a short delay
				setTimeout(() => {
					this.startQuestion(updatedRoom).catch(error => {
						logger.gameError('Failed to start next question', {
							error: getErrorMessage(error),
							roomId,
						});
					});
				}, 2000); // 2 second delay between questions
			}
		} catch (error) {
			logger.gameError('Failed to end question', {
				error: getErrorMessage(error),
				roomId,
			});
		}
	}

	/**
	 * Handle reconnection - find rooms user is in and send current state
	 */
	private async handleReconnection(client: TypedSocket, userId: string): Promise<void> {
		try {
			const rooms = await this.roomService.findRoomsByUserId(userId);
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
				error: getErrorMessage(error),
				userId,
			});
		}
	}

	/**
	 * Send current game state to a client
	 */
	private async sendGameStateToClient(client: TypedSocket, room: MultiplayerRoom): Promise<void> {
		try {
			const gameState = await this.multiplayerService.getGameState(room.roomId);
			client.emit('room-joined', {
				room,
				gameState,
			});

			// If there's a current question, send question-started event
			if (room.status === RoomStatus.PLAYING && gameState.currentQuestion) {
				const questionStartedEvent = this.createGameEvent('question-started', room.roomId, {
					question: gameState.currentQuestion,
					questionIndex: gameState.currentQuestionIndex,
					timeLimit: room.config.timePerQuestion,
				});
				client.emit('question-started', questionStartedEvent.data);
			}
		} catch (error) {
			logger.gameError('Failed to send game state to client', {
				error: getErrorMessage(error),
				roomId: room.roomId,
			});
		}
	}

	/**
	 * Cleanup timers for a room
	 */
	private cleanupRoomTimers(roomId: string): void {
		const timer = this.roomTimers[roomId];
		if (timer) {
			clearInterval(timer.checkInterval);
			clearTimeout(timer.timeoutId);
			delete this.roomTimers[roomId];
		}
	}

	/**
	 * Handle case when all players disconnected
	 */
	private async handleAllPlayersDisconnected(roomId: string): Promise<void> {
		try {
			// Cleanup timers
			this.cleanupRoomTimers(roomId);

			// Update room status to cancelled
			await this.roomService.updateRoomStatus(roomId, RoomStatus.CANCELLED);

			// Broadcast game cancelled as error event
			const errorEvent = this.createGameEvent('error', roomId, {
				message: 'Game cancelled: All players disconnected',
				code: 'GAME_CANCELLED',
			});
			this.broadcastToRoom(roomId, errorEvent);

			logger.gameInfo('Game cancelled - all players disconnected', { roomId });
		} catch (error) {
			logger.gameError('Failed to handle all players disconnected', {
				error: getErrorMessage(error),
				roomId,
			});
		}
	}

	/**
	 * Broadcast event to all clients in a room
	 */
	private broadcastToRoom(roomId: string, event: MultiplayerGameEvent) {
		this.server.to(roomId).emit(event.type, event);
	}
}
