import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { ERROR_CODES, RoomStatus, VALIDATION_COUNT } from '@shared/constants';
import type {
	CreateRoomResponse,
	GameState,
	MultiplayerAnswerResult,
	MultiplayerRoom,
	Player,
	QuestionResult,
	RoomConfig,
	RoomStateResponse,
	TriviaQuestion,
} from '@shared/types';
import { getCorrectAnswerIndex } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { GameService } from '../game.service';
import { GameStateService } from './gameState.service';
import { RoomService } from './room.service';

@Injectable()
export class MultiplayerService {
	constructor(
		private readonly roomService: RoomService,
		private readonly gameStateService: GameStateService,
		private readonly gameService: GameService
	) {}

	async createRoom(hostId: string, config: RoomConfig): Promise<CreateRoomResponse> {
		const room = await this.roomService.createRoom(hostId, config);

		logger.gameInfo('Multiplayer room created', {
			roomId: room.roomId,
			hostId,
		});

		return { room, code: room.roomId };
	}

	async joinRoom(roomId: string, userId: string): Promise<MultiplayerRoom> {
		return this.roomService.joinRoom(roomId, userId);
	}

	async leaveRoom(roomId: string, userId: string): Promise<MultiplayerRoom | null> {
		const room = await this.roomService.leaveRoom(roomId, userId);

		logger.gameInfo('Player left multiplayer room', {
			roomId,
			userId,
			playerCount: room?.players.length ?? 0,
		});

		return room;
	}

	async startGame(roomId: string, hostId: string): Promise<MultiplayerRoom> {
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

		if (room.players.length < VALIDATION_COUNT.PLAYERS.MIN) {
			throw new BadRequestException(ERROR_CODES.NEED_AT_LEAST_2_PLAYERS);
		}

		const triviaResult = await this.gameService.getTriviaQuestion({
			topic: room.config.topic,
			difficulty: room.config.difficulty,
			questionsPerRequest: room.config.questionsPerRequest,
			userId: hostId,
			answerCount: undefined,
		});

		const initializedRoom = await this.gameStateService.initializeGame(room, triviaResult.questions);

		logger.gameInfo('Multiplayer game started', {
			roomId,
			hostId,
			gameQuestionCount: triviaResult.questions.length,
			playerCount: initializedRoom.players.length,
		});

		return initializedRoom;
	}

	async getGameState(roomId: string): Promise<GameState> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
		}

		return this.gameStateService.getGameState(room);
	}

	async submitAnswer(
		roomId: string,
		userId: string,
		questionId: string,
		answer: number,
		timeSpent: number
	): Promise<MultiplayerAnswerResult> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
		}

		if (room.status !== RoomStatus.PLAYING) {
			throw new BadRequestException(ERROR_CODES.GAME_NOT_IN_PLAYING_STATE);
		}

		const result = await this.gameStateService.submitAnswer(room, userId, questionId, answer, timeSpent);
		const gameState = this.gameStateService.getGameState(result.room);

		return {
			room: result.room,
			isCorrect: result.isCorrect,
			scoreEarned: result.scoreEarned,
			leaderboard: gameState.leaderboard,
		};
	}

	async nextQuestion(roomId: string): Promise<MultiplayerRoom> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
		}

		if (room.status !== RoomStatus.PLAYING) {
			throw new BadRequestException(ERROR_CODES.GAME_NOT_IN_PLAYING_STATE);
		}

		return await this.gameStateService.nextQuestion(room);
	}

	async startQuestion(roomId: string): Promise<{
		question: TriviaQuestion;
		questionIndex: number;
		timeLimit: number;
		serverStartTimestamp: number;
		serverEndTimestamp: number;
	} | null> {
		const room = await this.roomService.getRoom(roomId);
		if (!room || room.status !== RoomStatus.PLAYING) {
			return null;
		}

		const question = room.questions[room.currentQuestionIndex];
		if (!question) {
			return null;
		}

		const updatedRoom = await this.gameStateService.startQuestionFlow(roomId, room);
		if (!updatedRoom) {
			return null;
		}

		// Calculate server timestamps as authoritative source
		const serverStartTimestamp = Date.now();
		const serverEndTimestamp = serverStartTimestamp + updatedRoom.config.timePerQuestion * 1000;

		return {
			question,
			questionIndex: updatedRoom.currentQuestionIndex,
			timeLimit: updatedRoom.config.timePerQuestion,
			serverStartTimestamp,
			serverEndTimestamp,
		};
	}

	async endQuestion(roomId: string): Promise<{
		questionId: string;
		correctAnswer: number;
		results: QuestionResult[];
		leaderboard: Player[];
		updatedRoom: MultiplayerRoom;
	} | null> {
		const room = await this.roomService.getRoom(roomId);
		if (!room || room.status !== RoomStatus.PLAYING) {
			return null;
		}

		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (!currentQuestion) {
			return null;
		}

		const endResult = await this.gameStateService.endQuestionFlow(roomId, room);
		if (!endResult) {
			return null;
		}

		return {
			questionId: currentQuestion.id,
			correctAnswer: getCorrectAnswerIndex(currentQuestion),
			results: endResult.results,
			leaderboard: endResult.leaderboard,
			updatedRoom: endResult.room,
		};
	}

	async checkAllPlayersAnswered(roomId: string): Promise<boolean> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			return false;
		}
		return this.gameStateService.allPlayersAnswered(room);
	}

	async findRoomsByUserId(userId: string): Promise<MultiplayerRoom[]> {
		return this.roomService.findRoomsByUserId(userId);
	}

	async getRoom(roomId: string): Promise<MultiplayerRoom | null> {
		return this.roomService.getRoom(roomId);
	}

	async restoreRoom(room: MultiplayerRoom): Promise<void> {
		return this.roomService.restoreRoom(room);
	}

	async cancelGame(roomId: string): Promise<MultiplayerRoom> {
		return this.roomService.updateRoomStatus(roomId, RoomStatus.CANCELLED);
	}

	private validateParticipant(room: MultiplayerRoom | null, userId: string): asserts room is MultiplayerRoom {
		if (!room) {
			throw new NotFoundException(ERROR_CODES.ROOM_NOT_FOUND);
		}

		const isParticipant = room.players.some(player => player.userId === userId);
		if (!isParticipant) {
			throw new ForbiddenException(ERROR_CODES.NOT_PART_OF_ROOM);
		}
	}

	async getRoomDetails(roomId: string, userId: string): Promise<MultiplayerRoom> {
		const room = await this.roomService.getRoom(roomId);
		this.validateParticipant(room, userId);
		return room;
	}

	async getRoomState(roomId: string, userId: string): Promise<RoomStateResponse> {
		const room = await this.roomService.getRoom(roomId);
		this.validateParticipant(room, userId);

		const gameState = await this.getGameState(roomId);

		return {
			room,
			gameState,
		};
	}
}
