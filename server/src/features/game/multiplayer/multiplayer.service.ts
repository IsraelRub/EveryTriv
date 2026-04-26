import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import {
	DEFAULT_LANGUAGE,
	ErrorCode,
	GAME_MODES_CONFIG,
	GameMode,
	Locale,
	MULTIPLAYER_TIME_PER_QUESTION,
	RoomStatus,
	TIME_PERIODS_MS,
	VALIDATION_COUNT,
} from '@shared/constants';
import type {
	CreateRoomResponse,
	GameState,
	MultiplayerRoom,
	MultiplayerSubmitAnswerResult,
	PublicWaitingRoomDto,
	QuestionEndResponse,
	QuestionStartResponse,
	RoomConfig,
	RoomStateResponse,
} from '@shared/types';
import { getCorrectAnswerIndex, getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { CreditsService } from '../../credits/credits.service';
import { GameService } from '../game.service';
import { GameStateService } from './gameState.service';
import { RoomService } from './room.service';

@Injectable()
export class MultiplayerService {
	constructor(
		private readonly roomService: RoomService,
		private readonly gameStateService: GameStateService,
		private readonly gameService: GameService,
		private readonly creditsService: CreditsService
	) {}

	async createRoom(hostId: string, config: RoomConfig, isPublicLobby = false): Promise<CreateRoomResponse> {
		const room = await this.roomService.createRoom(hostId, config, isPublicLobby);

		logger.gameInfo('Multiplayer room created', {
			roomId: room.roomId,
			hostId,
		});

		return { room, code: room.roomId };
	}

	async listPublicWaitingLobbies(
		topicSubstring: string | undefined,
		limit: number,
		outputLanguage: Locale
	): Promise<PublicWaitingRoomDto[]> {
		return this.roomService.listPublicWaitingLobbies(topicSubstring, limit, outputLanguage);
	}

	async updateRoomLobbyVisibility(roomId: string, userId: string, isPublicLobby: boolean): Promise<MultiplayerRoom> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ErrorCode.ROOM_NOT_FOUND);
		}
		if (room.hostId !== userId) {
			throw new ForbiddenException(ErrorCode.FORBIDDEN);
		}
		if (room.status !== RoomStatus.WAITING) {
			throw new BadRequestException(ErrorCode.GAME_ALREADY_STARTED_OR_FINISHED);
		}
		return this.roomService.updateRoom(roomId, { isPublicLobby, version: room.version });
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

	async disconnectPlayer(roomId: string, userId: string): Promise<MultiplayerRoom | null> {
		return this.roomService.disconnectPlayer(roomId, userId);
	}

	async startGame(roomId: string, hostId: string): Promise<MultiplayerRoom> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ErrorCode.ROOM_NOT_FOUND);
		}

		if (room.hostId !== hostId) {
			throw new BadRequestException(ErrorCode.ONLY_HOST_CAN_START);
		}

		if (room.status !== RoomStatus.WAITING && room.status !== RoomStatus.STARTING) {
			throw new BadRequestException(ErrorCode.GAME_ALREADY_STARTED_OR_FINISHED);
		}

		if (room.players.length < VALIDATION_COUNT.PLAYERS.MIN) {
			throw new BadRequestException(ErrorCode.NEED_AT_LEAST_2_PLAYERS);
		}

		const defaultQuestions =
			GAME_MODES_CONFIG[GameMode.MULTIPLAYER].defaults.maxQuestionsPerGame ?? VALIDATION_COUNT.QUESTIONS.MIN;
		const questionsPerRequest = room.config.questionsPerRequest ?? defaultQuestions;
		// Host pays for all questions × whoever is in the room at start time (same value enforced in creditsService.deductCredits).
		const creditsToDeduct = questionsPerRequest * room.players.length;
		await this.creditsService.deductCredits(hostId, creditsToDeduct, GameMode.MULTIPLAYER, 'multiplayer_host_start');

		try {
			const triviaResult = await this.gameService.getTriviaQuestion({
				topic: room.config.topic,
				difficulty: room.config.difficulty,
				questionsPerRequest: room.config.questionsPerRequest,
				userId: hostId,
				answerCount: room.config.answerCount,
				outputLanguage: room.config.outputLanguage ?? DEFAULT_LANGUAGE,
			});

			const initializedRoom = await this.gameStateService.initializeGame(room, triviaResult.questions);

			logger.gameInfo('Multiplayer game started', {
				roomId,
				hostId,
				gameQuestionCount: triviaResult.questions.length,
				playerCount: initializedRoom.players.length,
			});

			return initializedRoom;
		} catch (error) {
			await this.creditsService.addCredits(null, hostId, creditsToDeduct, `multiplayer_refund:${roomId}:${Date.now()}`);
			logger.gameError('Failed to start multiplayer game, credits refunded', {
				errorInfo: { message: getErrorMessage(error) },
				roomId,
				hostId,
				credits: creditsToDeduct,
			});
			throw error;
		}
	}

	async getGameState(roomId: string): Promise<GameState> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ErrorCode.ROOM_NOT_FOUND);
		}

		return this.gameStateService.getGameState(room);
	}

	async submitAnswer(
		roomId: string,
		userId: string,
		questionId: string,
		answer: number,
		timeSpent: number
	): Promise<MultiplayerSubmitAnswerResult> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ErrorCode.ROOM_NOT_FOUND);
		}

		if (room.status !== RoomStatus.PLAYING) {
			throw new BadRequestException(ErrorCode.GAME_NOT_IN_PLAYING_STATE);
		}

		const result = await this.gameStateService.submitAnswer(room, userId, questionId, answer, timeSpent);
		const gameState = this.gameStateService.getGameState(result.room);

		return {
			room: result.room,
			isCorrect: result.isCorrect,
			scoreEarned: result.scoreEarned,
			leaderboard: gameState.leaderboard,
			answerCounts: gameState.answerCounts,
		};
	}

	async nextQuestion(roomId: string): Promise<MultiplayerRoom> {
		const room = await this.roomService.getRoom(roomId);
		if (!room) {
			throw new NotFoundException(ErrorCode.ROOM_NOT_FOUND);
		}

		if (room.status !== RoomStatus.PLAYING) {
			throw new BadRequestException(ErrorCode.GAME_NOT_IN_PLAYING_STATE);
		}

		return this.gameStateService.nextQuestion(room);
	}

	async startQuestion(roomId: string): Promise<QuestionStartResponse | null> {
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
		const serverEndTimestamp = serverStartTimestamp + MULTIPLAYER_TIME_PER_QUESTION * TIME_PERIODS_MS.SECOND;

		return {
			question,
			questionIndex: updatedRoom.currentQuestionIndex,
			timeLimit: MULTIPLAYER_TIME_PER_QUESTION,
			serverStartTimestamp,
			serverEndTimestamp,
		};
	}

	async endQuestion(roomId: string): Promise<QuestionEndResponse | null> {
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
			...(endResult.answerCounts && { answerCounts: endResult.answerCounts }),
		};
	}

	private validateParticipant(room: MultiplayerRoom | null, userId: string): asserts room is MultiplayerRoom {
		if (!room) {
			throw new NotFoundException(ErrorCode.ROOM_NOT_FOUND);
		}

		const isParticipant = room.players.some(player => player.userId === userId);
		if (!isParticipant) {
			throw new ForbiddenException(ErrorCode.NOT_PART_OF_ROOM);
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
