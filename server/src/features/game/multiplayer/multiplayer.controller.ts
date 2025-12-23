import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpException,
	HttpStatus,
	NotFoundException,
	Param,
	ParseUUIDPipe,
	Post,
} from '@nestjs/common';

import { API_ROUTES, ERROR_CODES, LOCALHOST_CONFIG, MULTIPLAYER_CONFIG } from '@shared/constants';
import type { CreateRoomResponse, MultiplayerRoom, RoomConfig, RoomStateResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import type {
	LeaveRoomHttpResponse,
	MultiplayerConnectionInfo,
	RoomHttpResponse,
	SubmitAnswerHttpResponse,
} from '@internal/types';
import { isErrorWithStatus } from '@internal/utils';

import { CurrentUserId, Public } from '../../../common';
import { CreateRoomDto, JoinRoomDto, RoomActionDto, SubmitAnswerDto } from './dtos';
import { MultiplayerService } from './multiplayer.service';
import { RoomService } from './room.service';

/**
 * HTTP controller for multiplayer management
 * Provides REST endpoints that mirror WebSocket events for tools and monitoring
 */
@Controller(API_ROUTES.MULTIPLAYER.BASE)
export class MultiplayerController {
	private readonly roomCache = new Map<string, MultiplayerRoom>();

	constructor(
		private readonly multiplayerService: MultiplayerService,
		private readonly roomService: RoomService
	) {}

	/**
	 * Get WebSocket connection details
	 */
	@Get()
	@Public()
	getConnectionInfo(): MultiplayerConnectionInfo {
		const websocketUrl = this.resolveWebsocketUrl();

		logger.apiRead('multiplayer_connection_info', {
			endpoint: '/multiplayer',
			host: websocketUrl,
		});

		return {
			websocketUrl,
			namespace: '/multiplayer',
			transports: ['websocket'],
			requiresAuthentication: true,
			supportsSocketIo: true,
			description: 'Connect via Socket.IO using JWT authentication to access multiplayer events.',
		};
	}

	/**
	 * Create a new multiplayer room via HTTP proxy
	 */
	@Post(API_ROUTES.MULTIPLAYER.ROOMS)
	async createRoom(@CurrentUserId() userId: string, @Body() body: CreateRoomDto): Promise<CreateRoomResponse> {
		this.ensureAuthenticated(userId);

		try {
			const config: RoomConfig = {
				topic: body.topic,
				difficulty: body.difficulty,
				questionsPerRequest: body.questionsPerRequest,
				maxPlayers: body.maxPlayers,
				gameMode: body.gameMode,
				timePerQuestion: MULTIPLAYER_CONFIG.TIME_PER_QUESTION,
				mappedDifficulty: body.mappedDifficulty ?? toDifficultyLevel(body.difficulty),
			};
			const result = await this.multiplayerService.createRoom(userId, config);

			logger.apiCreate('multiplayer_room_create', {
				userId,
				roomId: result.room.roomId,
				topic: body.topic,
				difficulty: body.difficulty,
			});

			this.roomCache.set(result.room.roomId, result.room);

			return result;
		} catch (error) {
			logger.gameError('Failed to create multiplayer room via HTTP', {
				error: getErrorMessage(error),
				userId,
				topic: body.topic,
			});
			throw error;
		}
	}

	/**
	 * Join an existing room
	 */
	@Post(API_ROUTES.MULTIPLAYER.ROOMS_JOIN)
	async joinRoom(@CurrentUserId() userId: string, @Body() body: JoinRoomDto): Promise<RoomHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			const room = await this.executeWithRoomRestore(body.roomId, () =>
				this.multiplayerService.joinRoom(body.roomId, userId)
			);

			this.roomCache.set(room.roomId, room);

			logger.apiUpdate('multiplayer_room_join', {
				userId,
				roomId: body.roomId,
				playerCount: room.players.length,
			});

			return { room };
		} catch (error) {
			logger.gameError('Failed to join multiplayer room via HTTP', {
				error: getErrorMessage(error),
				userId,
				roomId: body.roomId,
			});
			throw error;
		}
	}

	/**
	 * Leave a room
	 */
	@Post(API_ROUTES.MULTIPLAYER.ROOMS_LEAVE)
	async leaveRoom(@CurrentUserId() userId: string, @Body() body: RoomActionDto): Promise<LeaveRoomHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			const room = await this.multiplayerService.leaveRoom(body.roomId, userId);
			const remainingPlayers = room?.players.length ?? 0;
			const status = room ? ('player-left' as const) : ('room-closed' as const);

			if (room) {
				this.roomCache.set(room.roomId, room);
			} else {
				this.roomCache.delete(body.roomId);
			}

			logger.apiUpdate('multiplayer_room_leave', {
				userId,
				roomId: body.roomId,
				playerCount: remainingPlayers,
				status,
			});

			return {
				status,
				remainingPlayers,
				room: room ?? null,
			};
		} catch (error) {
			logger.gameError('Failed to leave multiplayer room via HTTP', {
				error: getErrorMessage(error),
				userId,
				roomId: body.roomId,
			});
			throw error;
		}
	}

	/**
	 * Start a multiplayer game (host only)
	 */
	@Post(API_ROUTES.MULTIPLAYER.ROOMS_START)
	async startGame(@CurrentUserId() userId: string, @Body() body: RoomActionDto): Promise<RoomHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			const room = await this.executeWithRoomRestore(body.roomId, () =>
				this.multiplayerService.startGame(body.roomId, userId)
			);

			this.roomCache.set(room.roomId, room);

			logger.apiUpdate('multiplayer_room_start', {
				userId,
				roomId: body.roomId,
				playerCount: room.players.length,
			});

			return { room };
		} catch (error) {
			logger.gameError('Failed to start multiplayer game via HTTP', {
				error: getErrorMessage(error),
				userId,
				roomId: body.roomId,
			});
			throw error;
		}
	}

	/**
	 * Submit an answer via HTTP proxy
	 */
	@Post(API_ROUTES.MULTIPLAYER.ROOMS_ANSWER)
	async submitAnswer(
		@CurrentUserId() userId: string,
		@Body() body: SubmitAnswerDto
	): Promise<SubmitAnswerHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			const result = await this.multiplayerService.submitAnswer(
				body.roomId,
				userId,
				body.questionId,
				body.answer,
				body.timeSpent
			);

			const cachedRoom = await this.roomService.getRoom(body.roomId);
			if (cachedRoom) {
				this.roomCache.set(body.roomId, cachedRoom);
			}

			logger.apiUpdate('multiplayer_answer_submit', {
				userId,
				roomId: body.roomId,
				questionId: body.questionId,
				isCorrect: result.isCorrect,
				scoreEarned: result.scoreEarned,
			});

			return {
				roomId: body.roomId,
				data: {
					userId,
					questionId: body.questionId,
					isCorrect: result.isCorrect,
					scoreEarned: result.scoreEarned,
					leaderboard: result.leaderboard ?? [],
				},
			};
		} catch (error) {
			logger.gameError('Failed to submit multiplayer answer via HTTP', {
				error: getErrorMessage(error),
				userId,
				roomId: body.roomId,
				questionId: body.questionId,
			});
			throw error;
		}
	}

	/**
	 * Get room details (participating users only)
	 */
	@Get(API_ROUTES.MULTIPLAYER.ROOMS_BY_ID)
	async getRoomDetails(
		@CurrentUserId() userId: string,
		@Param('roomId', new ParseUUIDPipe()) roomId: string
	): Promise<RoomHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			const room = await this.roomService.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			this.ensureParticipant(room, userId);

			logger.apiRead('multiplayer_room_details', {
				userId,
				roomId,
			});

			return { room };
		} catch (error) {
			logger.gameError('Failed to fetch multiplayer room via HTTP', {
				error: getErrorMessage(error),
				userId,
				roomId,
			});
			throw error;
		}
	}

	/**
	 * Get current state of the room (questions, leaderboard, timers)
	 */
	@Get(API_ROUTES.MULTIPLAYER.ROOMS_STATE)
	async getRoomState(
		@CurrentUserId() userId: string,
		@Param('roomId', new ParseUUIDPipe()) roomId: string
	): Promise<RoomStateResponse> {
		this.ensureAuthenticated(userId);

		try {
			const room = await this.roomService.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			this.ensureParticipant(room, userId);

			const gameState = await this.multiplayerService.getGameState(roomId);

			logger.apiRead('multiplayer_room_state', {
				userId,
				roomId,
			});

			return {
				room,
				gameState,
			};
		} catch (error) {
			logger.gameError('Failed to fetch multiplayer room state via HTTP', {
				error: getErrorMessage(error),
				userId,
				roomId,
			});
			throw error;
		}
	}

	private ensureAuthenticated(userId: string | null): asserts userId is string {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
	}

	private ensureParticipant(room: MultiplayerRoom, userId: string): void {
		const isParticipant = room.players.some(player => player.userId === userId);
		if (!isParticipant) {
			throw new ForbiddenException(ERROR_CODES.NOT_PART_OF_ROOM);
		}
	}

	private resolveWebsocketUrl(): string {
		const explicitUrl = process.env.MULTIPLAYER_WS_URL;
		if (explicitUrl) {
			return this.appendNamespace(explicitUrl);
		}

		const serverUrl = (process.env.SERVER_URL ?? LOCALHOST_CONFIG.urls.SERVER).replace(/\/$/, '');
		const protocol = serverUrl.startsWith('https') ? 'wss' : 'ws';
		const host = serverUrl.replace(/^https?:\/\//, '');
		return `${protocol}://${host}/multiplayer`;
	}

	private appendNamespace(url: string): string {
		const normalized = url.replace(/\/$/, '');
		return normalized.endsWith('/multiplayer') ? normalized : `${normalized}/multiplayer`;
	}

	private async executeWithRoomRestore<T>(roomId: string, operation: () => Promise<T>): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			if (this.shouldAttemptRoomRestore(error)) {
				const snapshot = this.roomCache.get(roomId);
				if (snapshot) {
					logger.gameInfo('Restoring HTTP multiplayer room snapshot', { roomId });
					await this.roomService.restoreRoom(snapshot);
					return operation();
				} else {
					logger.gameInfo('No cached multiplayer room snapshot found for HTTP retry', { roomId });
				}
			}
			throw error;
		}
	}

	private shouldAttemptRoomRestore(error: unknown): boolean {
		if (error instanceof NotFoundException) {
			return true;
		}

		if (error instanceof HttpException) {
			return error.getStatus() === HttpStatus.NOT_FOUND;
		}

		if (isErrorWithStatus(error)) {
			if (error.status === HttpStatus.NOT_FOUND || error.statusCode === HttpStatus.NOT_FOUND) {
				return true;
			}
		}

		const message = getErrorMessage(error).toLowerCase();
		return message.includes('room not found');
	}
}
