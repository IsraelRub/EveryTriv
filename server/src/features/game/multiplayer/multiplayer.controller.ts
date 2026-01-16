import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	HttpException,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
} from '@nestjs/common';

import { API_ENDPOINTS, ERROR_CODES, GAME_MODE_DEFAULTS, GameMode, VALIDATORS } from '@shared/constants';
import type { CreateRoomResponse, MultiplayerRoom, RoomConfig, RoomStateResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { isRoomId, toDifficultyLevel } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import type {
	LeaveRoomHttpResponse,
	MultiplayerConnectionInfo,
	RoomHttpResponse,
	SubmitAnswerHttpResponse,
} from '@internal/types';

import { CurrentUserId, Public } from '../../../common';
import { LOCALHOST_CONFIG } from '../../../config/localhost.config';
import { CreateRoomDto, JoinRoomDto, MultiplayerSubmitAnswerDto, RoomActionDto } from './dtos';
import { MultiplayerService } from './multiplayer.service';

@Controller(API_ENDPOINTS.MULTIPLAYER.BASE)
export class MultiplayerController {
	private readonly roomCache = new Map<string, MultiplayerRoom>();

	constructor(private readonly multiplayerService: MultiplayerService) {}

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

	@Post('rooms')
	async createRoom(@CurrentUserId() userId: string, @Body() body: CreateRoomDto): Promise<CreateRoomResponse> {
		this.ensureAuthenticated(userId);

		try {
			const config: RoomConfig = {
				topic: body.topic,
				difficulty: body.difficulty,
				questionsPerRequest: body.questionsPerRequest,
				maxPlayers: body.maxPlayers,
				gameMode: body.gameMode,
				timePerQuestion: GAME_MODE_DEFAULTS[GameMode.MULTIPLAYER].timePerQuestion,
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
				errorInfo: { message: getErrorMessage(error) },
				userId,
				topic: body.topic,
			});
			throw error;
		}
	}

	@Post('rooms/join')
	async joinRoom(@CurrentUserId() userId: string, @Body() body: JoinRoomDto): Promise<RoomHttpResponse> {
		this.ensureAuthenticated(userId);

		// Normalize roomId to uppercase
		const normalizedRoomId = body.roomId.toUpperCase();

		try {
			const room = await this.executeWithRoomRestore(normalizedRoomId, () =>
				this.multiplayerService.joinRoom(normalizedRoomId, userId)
			);

			this.roomCache.set(room.roomId, room);

			logger.apiUpdate('multiplayer_room_join', {
				userId,
				roomId: normalizedRoomId,
				playerCount: room.players.length,
			});

			return { room };
		} catch (error) {
			logger.gameError('Failed to join multiplayer room via HTTP', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: normalizedRoomId,
			});
			throw error;
		}
	}

	@Post('rooms/leave')
	async leaveRoom(@CurrentUserId() userId: string, @Body() body: RoomActionDto): Promise<LeaveRoomHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			// Normalize roomId to uppercase
			const normalizedRoomId = body.roomId.toUpperCase();
			const room = await this.multiplayerService.leaveRoom(normalizedRoomId, userId);
			const remainingPlayers = room?.players.length ?? 0;
			const status = room ? ('player-left' as const) : ('room-closed' as const);

			if (room) {
				this.roomCache.set(room.roomId, room);
			} else {
				this.roomCache.delete(normalizedRoomId);
			}

			logger.apiUpdate('multiplayer_room_leave', {
				userId,
				roomId: normalizedRoomId,
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
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: body.roomId.toUpperCase(),
			});
			throw error;
		}
	}

	@Post('rooms/start')
	async startGame(@CurrentUserId() userId: string, @Body() body: RoomActionDto): Promise<RoomHttpResponse> {
		this.ensureAuthenticated(userId);

		// Normalize roomId to uppercase
		const normalizedRoomId = body.roomId.toUpperCase();

		try {
			const room = await this.executeWithRoomRestore(normalizedRoomId, () =>
				this.multiplayerService.startGame(normalizedRoomId, userId)
			);

			this.roomCache.set(room.roomId, room);

			logger.apiUpdate('multiplayer_room_start', {
				userId,
				roomId: normalizedRoomId,
				playerCount: room.players.length,
			});

			return { room };
		} catch (error) {
			logger.gameError('Failed to start multiplayer game via HTTP', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: normalizedRoomId,
			});
			throw error;
		}
	}

	@Post('rooms/answer')
	async submitAnswer(
		@CurrentUserId() userId: string,
		@Body() body: MultiplayerSubmitAnswerDto
	): Promise<SubmitAnswerHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			// Normalize roomId to uppercase
			const normalizedRoomId = body.roomId.toUpperCase();
			const result = await this.multiplayerService.submitAnswer(
				normalizedRoomId,
				userId,
				body.questionId,
				body.answer,
				body.timeSpent
			);

			const cachedRoom = await this.multiplayerService.getRoom(normalizedRoomId);
			if (cachedRoom) {
				this.roomCache.set(normalizedRoomId, cachedRoom);
			}

			logger.apiUpdate('multiplayer_answer_submit', {
				userId,
				roomId: normalizedRoomId,
				questionId: body.questionId,
				isCorrect: result.isCorrect,
				scoreEarned: result.scoreEarned,
			});

			return {
				roomId: normalizedRoomId,
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
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: body.roomId.toUpperCase(),
				questionId: body.questionId,
			});
			throw error;
		}
	}

	@Get('rooms/:roomId')
	async getRoomDetails(@CurrentUserId() userId: string, @Param('roomId') roomId: string): Promise<RoomHttpResponse> {
		this.ensureAuthenticated(userId);

		try {
			// Validate roomId format (8 alphanumeric characters)
			const normalizedRoomId = roomId.toUpperCase();
			if (!isRoomId(normalizedRoomId)) {
				throw new BadRequestException(ERROR_CODES.INVALID_ROOM_ID_FORMAT);
			}

			const room = await this.multiplayerService.getRoomDetails(normalizedRoomId, userId);

			logger.apiRead('multiplayer_room_details', {
				userId,
				roomId: normalizedRoomId,
			});

			return { room };
		} catch (error) {
			logger.gameError('Failed to fetch multiplayer room via HTTP', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: roomId.toUpperCase(),
			});
			throw error;
		}
	}

	@Get('rooms/:roomId/state')
	async getRoomState(@CurrentUserId() userId: string, @Param('roomId') roomId: string): Promise<RoomStateResponse> {
		this.ensureAuthenticated(userId);

		try {
			// Validate roomId format (8 alphanumeric characters)
			const normalizedRoomId = roomId.toUpperCase();
			if (!isRoomId(normalizedRoomId)) {
				throw new BadRequestException(ERROR_CODES.INVALID_ROOM_ID_FORMAT);
			}

			const result = await this.multiplayerService.getRoomState(normalizedRoomId, userId);

			logger.apiRead('multiplayer_room_state', {
				userId,
				roomId: normalizedRoomId,
			});

			return result;
		} catch (error) {
			logger.gameError('Failed to fetch multiplayer room state via HTTP', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				roomId: roomId.toUpperCase(),
			});
			throw error;
		}
	}

	private ensureAuthenticated(userId: string | null): asserts userId is string {
		if (userId == null) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
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
					logger.gameInfo('Restoring HTTP multiplayer room snapshot', {
						roomId,
					});
					await this.multiplayerService.restoreRoom(snapshot);
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

		if (
			typeof error === 'object' &&
			error !== null &&
			(('status' in error && VALIDATORS.number(error.status) && error.status === HttpStatus.NOT_FOUND) ||
				('statusCode' in error && VALIDATORS.number(error.statusCode) && error.statusCode === HttpStatus.NOT_FOUND))
		) {
			return true;
		}

		const message = getErrorMessage(error).toLowerCase();
		return message.includes('room not found');
	}
}
