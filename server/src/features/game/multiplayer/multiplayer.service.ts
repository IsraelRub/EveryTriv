import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ERROR_CODES, PlayerStatus, RoomStatus } from '@shared/constants';
import type { CreateRoomResponse, GameState, MultiplayerRoom, RoomConfig, SubmitAnswerResponse } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { GameService } from '../game.service';
import { GameStateService } from './gameState.service';
import { MatchmakingService } from './matchmaking.service';
import { RoomService } from './room.service';

/**
 * Main service for multiplayer game functionality
 * @class MultiplayerService
 * @description Orchestrates all multiplayer game operations
 */
@Injectable()
export class MultiplayerService {
	constructor(
		private readonly roomService: RoomService,
		private readonly gameStateService: GameStateService,
		private readonly matchmakingService: MatchmakingService,
		private readonly gameService: GameService
	) {}

	/**
	 * Create a new multiplayer room
	 * @param hostId User ID of the room host
	 * @param config Room configuration
	 * @returns Created room with short code
	 */
	async createRoom(hostId: string, config: RoomConfig): Promise<CreateRoomResponse> {
		try {
			const room = await this.roomService.createRoom(hostId, config);
			const code = this.matchmakingService.generateRoomCode(room.roomId);

			logger.gameInfo('Multiplayer room created with code', {
				roomId: room.roomId,
				code,
				hostId,
			});

			return { room, code };
		} catch (error) {
			logger.gameError('Failed to create multiplayer room', {
				error: getErrorMessage(error),
				hostId,
				topic: config.topic,
				difficulty: config.difficulty,
				questionsPerRequest: config.questionsPerRequest,
				maxPlayers: config.maxPlayers,
			});
			throw error;
		}
	}

	/**
	 * Join a room
	 * @param roomId Room ID
	 * @param userId User ID joining
	 * @returns Updated room
	 */
	async joinRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
		try {
			const room = await this.roomService.joinRoom(roomId, userId);

			logger.gameInfo('Player joined multiplayer room', {
				roomId,
				userId,
				playerCount: room.players.length,
			});

			return room;
		} catch (error) {
			logger.gameError('Failed to join multiplayer room', {
				error: getErrorMessage(error),
				roomId,
				userId,
			});
			throw error;
		}
	}

	/**
	 * Leave a room
	 * @param roomId Room ID
	 * @param userId User ID leaving
	 * @returns Updated room or null if deleted
	 */
	async leaveRoom(roomId: string, userId: string): Promise<MultiplayerRoom | null> {
		try {
			const room = await this.roomService.leaveRoom(roomId, userId);

			logger.gameInfo('Player left multiplayer room', {
				roomId,
				userId,
				playerCount: room?.players.length ?? 0,
			});

			return room;
		} catch (error) {
			logger.gameError('Failed to leave multiplayer room', {
				error: getErrorMessage(error),
				roomId,
				userId,
			});
			throw error;
		}
	}

	/**
	 * Start a multiplayer game
	 * @param roomId Room ID
	 * @param hostId Host user ID (must be host to start)
	 * @returns Initialized room with questions
	 */
	async startGame(roomId: string, hostId: string): Promise<MultiplayerRoom> {
		try {
			const room = await this.roomService.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			if (room.hostId !== hostId) {
				throw new BadRequestException(ERROR_CODES.ONLY_HOST_CAN_START);
			}

			if (room.status !== RoomStatus.WAITING) {
				throw new BadRequestException(ERROR_CODES.GAME_ALREADY_STARTED_OR_FINISHED);
			}

			if (room.players.length < 2) {
				throw new BadRequestException(ERROR_CODES.NEED_AT_LEAST_2_PLAYERS);
			}

			// Generate questions using GameService
			const triviaResult = await this.gameService.getTriviaQuestion(
				room.config.topic,
				room.config.difficulty,
				room.config.questionsPerRequest,
				hostId,
				undefined,
				room.config.mappedDifficulty
			);

			// Initialize game with questions
			const initializedRoom = await this.gameStateService.initializeGame(room, triviaResult.questions);

			logger.gameInfo('Multiplayer game started', {
				roomId,
				hostId,
				gameQuestionCount: triviaResult.questions.length,
				playerCount: initializedRoom.players.length,
			});

			return initializedRoom;
		} catch (error) {
			logger.gameError('Failed to start multiplayer game', {
				error: getErrorMessage(error),
				roomId,
				hostId,
			});
			throw error;
		}
	}

	/**
	 * Get current game state
	 * @param roomId Room ID
	 * @returns Current game state
	 */
	async getGameState(roomId: string): Promise<GameState> {
		try {
			const room = await this.roomService.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			return this.gameStateService.getGameState(room);
		} catch (error) {
			logger.gameError('Failed to get game state', {
				error: getErrorMessage(error),
				roomId,
			});
			throw error;
		}
	}

	/**
	 * Submit answer
	 * @param roomId Room ID
	 * @param userId User ID
	 * @param questionId Question ID
	 * @param answer Answer index
	 * @param timeSpent Time spent in seconds
	 * @returns Answer result
	 */
	async submitAnswer(
		roomId: string,
		userId: string,
		questionId: string,
		answer: number,
		timeSpent: number
	): Promise<SubmitAnswerResponse> {
		try {
			const room = await this.roomService.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			if (room.status !== RoomStatus.PLAYING) {
				throw new BadRequestException(ERROR_CODES.GAME_NOT_IN_PLAYING_STATE);
			}

			const result = await this.gameStateService.submitAnswer(room, userId, questionId, answer, timeSpent);

			// Get updated leaderboard
			const gameState = this.gameStateService.getGameState(result.room);

			return {
				room: result.room,
				isCorrect: result.isCorrect,
				scoreEarned: result.scoreEarned,
				leaderboard: gameState.leaderboard,
			};
		} catch (error) {
			logger.gameError('Failed to submit answer', {
				error: getErrorMessage(error),
				roomId,
				userId,
				questionId,
			});
			throw error;
		}
	}

	/**
	 * Move to next question (called automatically when timer expires or all players answered)
	 * @param roomId Room ID
	 * @returns Updated room
	 */
	async nextQuestion(roomId: string): Promise<MultiplayerRoom> {
		try {
			const room = await this.roomService.getRoom(roomId);
			if (!room) {
				throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
			}

			if (room.status !== RoomStatus.PLAYING) {
				throw new BadRequestException(ERROR_CODES.GAME_NOT_IN_PLAYING_STATE);
			}

			const updatedRoom = await this.gameStateService.nextQuestion(room);

			logger.gameInfo('Moved to next question', {
				roomId,
				currentQuestionIndex: updatedRoom.currentQuestionIndex,
				gameQuestionCount: updatedRoom.questions.length,
			});

			return updatedRoom;
		} catch (error) {
			logger.gameError('Failed to move to next question', {
				error: getErrorMessage(error),
				roomId,
			});
			throw error;
		}
	}

	/**
	 * Check if all players have answered the current question
	 * @param roomId Room ID
	 * @returns True if all players answered
	 */
	async allPlayersAnswered(roomId: string): Promise<boolean> {
		try {
			const room = await this.roomService.getRoom(roomId);
			if (!room || room.status !== RoomStatus.PLAYING) {
				return false;
			}

			const activePlayers = room.players.filter(p => p.status !== PlayerStatus.DISCONNECTED);
			const answeredPlayers = activePlayers.filter(
				p => p.status === PlayerStatus.ANSWERED || p.currentAnswer !== undefined
			);

			return activePlayers.length > 0 && answeredPlayers.length === activePlayers.length;
		} catch (error) {
			logger.gameError('Failed to check if all players answered', {
				error: getErrorMessage(error),
				roomId,
			});
			return false;
		}
	}

	/**
	 * Get room by ID
	 * @param roomId Room ID
	 * @returns Room or null
	 */
	async getRoom(roomId: string): Promise<MultiplayerRoom | null> {
		return this.roomService.getRoom(roomId);
	}
}
