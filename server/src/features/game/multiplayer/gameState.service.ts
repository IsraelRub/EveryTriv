import { Injectable } from '@nestjs/common';

import { ERROR_CODES, PlayerStatus, QuestionState, RoomStatus } from '@shared/constants';
import type {
	GameState,
	MultiplayerAnswerResult,
	MultiplayerRoom,
	PlayerAnswerMap,
	QuestionEndResult,
	TriviaQuestion,
} from '@shared/types';
import { calculateAnswerScore, checkAnswerCorrectness, getCorrectAnswerIndex, getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';

import { RoomService } from './room.service';

@Injectable()
export class GameStateService {
	constructor(private readonly roomService: RoomService) {}

	async initializeGame(room: MultiplayerRoom, questions: TriviaQuestion[]): Promise<MultiplayerRoom> {
		Object.assign(room, {
			questions,
			currentQuestionIndex: 0,
			status: RoomStatus.PLAYING,
			questionState: QuestionState.IDLE,
			startTime: new Date(),
			currentQuestionStartTime: new Date(),
		});

		// Reset all players to playing state
		room.players.forEach(player => {
			player.status = PlayerStatus.PLAYING;
			player.score = 0;
			player.answersSubmitted = 0;
			player.correctAnswers = 0;
			player.currentAnswer = undefined;
			player.timeSpent = undefined;
		});

		const { version, ...updates } = room;
		const updatedRoom = await this.roomService.updateRoom(room.roomId, updates);

		logger.gameInfo('Multiplayer game initialized', {
			roomId: updatedRoom.roomId,
			gameQuestionCount: questions.length,
			playerCount: updatedRoom.players.length,
		});

		return updatedRoom;
	}

	getGameState(room: MultiplayerRoom): GameState {
		const currentQuestion = room.questions[room.currentQuestionIndex] ?? null;
		const timeRemaining = this.calculateTimeRemaining(room);

		// Build players answers map
		const playersAnswers: PlayerAnswerMap = Object.fromEntries(
			room.players
				.filter((player): player is typeof player & { currentAnswer: number } => {
					return typeof player.currentAnswer === 'number' && Number.isFinite(player.currentAnswer);
				})
				.map(player => [player.userId, player.currentAnswer])
		);

		// Build players scores map
		const playersScores = Object.fromEntries(room.players.map(player => [player.userId, player.score]));

		// Build leaderboard (sorted by score, then by correct answers)
		const leaderboard = [...room.players].sort((a, b) => {
			if (b.score !== a.score) {
				return b.score - a.score;
			}
			return b.correctAnswers - a.correctAnswers;
		});

		return {
			roomId: room.roomId,
			currentQuestion,
			currentQuestionIndex: room.currentQuestionIndex,
			gameQuestionCount: room.questions.length,
			timeRemaining,
			playersAnswers,
			playersScores,
			leaderboard,
			startedAt: room.startTime,
			currentQuestionStartTime: room.currentQuestionStartTime,
		};
	}

	async submitAnswer(
		room: MultiplayerRoom,
		userId: string,
		questionId: string,
		answer: number,
		timeSpent: number
	): Promise<MultiplayerAnswerResult> {
		const player = room.players.find(p => p.userId === userId);
		if (!player) {
			throw new Error(ERROR_CODES.PLAYER_NOT_FOUND_IN_ROOM);
		}

		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (currentQuestion?.id !== questionId) {
			throw new Error(ERROR_CODES.QUESTION_NOT_FOUND_OR_NOT_CURRENT);
		}

		// Check if question has expired (server-authoritative timestamp check)
		if (room.currentQuestionStartTime && room.status === RoomStatus.PLAYING) {
			const now = Date.now();
			const questionEndTime = room.currentQuestionStartTime.getTime() + room.config.timePerQuestion * 1000;
			if (now >= questionEndTime) {
				throw new Error(ERROR_CODES.QUESTION_NOT_FOUND_OR_NOT_CURRENT);
			}
		}

		// Check if already answered
		if (player.status === PlayerStatus.ANSWERED) {
			const correctIndex = getCorrectAnswerIndex(currentQuestion);
			return {
				room,
				isCorrect: answer === correctIndex,
				scoreEarned: 0,
			};
		}

		// Check answer using shared utility
		const isCorrect = checkAnswerCorrectness(currentQuestion, answer);

		// Calculate score using shared utils
		const difficulty =
			currentQuestion.metadata?.mappedDifficulty ??
			room.config.mappedDifficulty ??
			toDifficultyLevel(currentQuestion.difficulty);
		const streak = player.correctAnswers; // Use current correct answers as streak
		const scoreEarned = calculateAnswerScore(difficulty, timeSpent, streak, isCorrect);

		// Update player
		player.currentAnswer = answer;
		player.timeSpent = timeSpent;
		player.status = PlayerStatus.ANSWERED;
		player.answersSubmitted++;
		if (isCorrect) {
			player.score += scoreEarned;
			player.correctAnswers++;
		}

		room.updatedAt = new Date();

		await this.roomService.updateRoom(room.roomId, room);

		logger.gameInfo('Answer submitted in multiplayer game', {
			roomId: room.roomId,
			userId,
			questionId,
			isCorrect,
			scoreEarned,
		});

		return {
			room,
			isCorrect,
			scoreEarned,
		};
	}

	private transitionQuestionState(room: MultiplayerRoom, newState: QuestionState): boolean {
		const currentState = room.questionState ?? QuestionState.IDLE;

		const validTransitions: Record<QuestionState, QuestionState[]> = {
			[QuestionState.IDLE]: [QuestionState.STARTING],
			[QuestionState.STARTING]: [QuestionState.ACTIVE],
			[QuestionState.ACTIVE]: [QuestionState.ENDING],
			[QuestionState.ENDING]: [QuestionState.ENDED],
			[QuestionState.ENDED]: [QuestionState.STARTING, QuestionState.IDLE],
		};

		const allowedStates = validTransitions[currentState] ?? [];
		if (!allowedStates.includes(newState)) {
			logger.gameError('Invalid question state transition', {
				roomId: room.roomId,
				currentState,
				newState,
			});
			return false;
		}

		room.questionState = newState;
		room.version = (room.version ?? 0) + 1;
		return true;
	}

	startQuestion(room: MultiplayerRoom): boolean {
		return this.transitionQuestionState(room, QuestionState.STARTING);
	}

	activateQuestion(room: MultiplayerRoom): boolean {
		return this.transitionQuestionState(room, QuestionState.ACTIVE);
	}

	endQuestion(room: MultiplayerRoom): boolean {
		const currentState = room.questionState ?? QuestionState.IDLE;
		if (currentState !== QuestionState.ACTIVE) {
			logger.gameInfo('Question already ended or not active', {
				roomId: room.roomId,
				currentState,
			});
			return false;
		}
		return this.transitionQuestionState(room, QuestionState.ENDING);
	}

	completeQuestion(room: MultiplayerRoom): boolean {
		return this.transitionQuestionState(room, QuestionState.ENDED);
	}

	async startQuestionFlow(roomId: string, room: MultiplayerRoom): Promise<MultiplayerRoom | null> {
		if (!this.startQuestion(room)) {
			return null;
		}

		const questionStartTime = new Date();
		await this.roomService.updateRoom(roomId, {
			currentQuestionStartTime: questionStartTime,
		});

		const currentRoom = await this.roomService.getRoom(roomId);
		if (!currentRoom) {
			return null;
		}

		if (!this.activateQuestion(currentRoom)) {
			return null;
		}

		await this.roomService.updateRoom(roomId, currentRoom);

		return currentRoom;
	}

	async endQuestionFlow(roomId: string, room: MultiplayerRoom): Promise<QuestionEndResult | null> {
		if (!this.endQuestion(room)) {
			return null;
		}

		await this.roomService.updateRoom(roomId, room);

		const currentRoom = await this.roomService.getRoom(roomId);
		if (!currentRoom) {
			return null;
		}

		const endResult = await this.endQuestionWithResults(currentRoom);
		await this.roomService.updateRoom(roomId, endResult.room);

		return endResult;
	}

	async endQuestionWithResults(room: MultiplayerRoom): Promise<QuestionEndResult> {
		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (!currentQuestion) {
			throw new Error(ERROR_CODES.QUESTION_NOT_FOUND_OR_NOT_CURRENT);
		}

		const correctIndex = getCorrectAnswerIndex(currentQuestion);
		const results = room.players.map(player => {
			const isCorrect = player.currentAnswer === correctIndex;
			const difficulty =
				currentQuestion.metadata?.mappedDifficulty ??
				room.config.mappedDifficulty ??
				toDifficultyLevel(currentQuestion.difficulty);
			const streak = isCorrect ? player.correctAnswers - 1 : player.correctAnswers;
			const scoreEarned = calculateAnswerScore(difficulty, player.timeSpent ?? 0, streak, isCorrect);

			return {
				userId: player.userId,
				isCorrect,
				scoreEarned,
			};
		});

		const gameState = this.getGameState(room);
		this.completeQuestion(room);

		return {
			results,
			leaderboard: gameState.leaderboard,
			room,
		};
	}

	allPlayersAnswered(room: MultiplayerRoom): boolean {
		if (room.status !== RoomStatus.PLAYING) {
			return false;
		}

		const activePlayers = room.players.filter(
			player => player.status !== PlayerStatus.DISCONNECTED && player.status !== PlayerStatus.FINISHED
		);

		if (activePlayers.length === 0) {
			return false;
		}

		return activePlayers.every(player => player.status === PlayerStatus.ANSWERED);
	}

	async nextQuestion(room: MultiplayerRoom): Promise<MultiplayerRoom> {
		try {
			if (room.currentQuestionIndex >= room.questions.length - 1) {
				room.status = RoomStatus.FINISHED;
				room.questionState = QuestionState.IDLE;
				room.version = (room.version ?? 0) + 1;
				room.endTime = new Date();
				room.players.forEach(player => {
					if (player.status !== PlayerStatus.DISCONNECTED) {
						player.status = PlayerStatus.FINISHED;
					}
				});
			} else {
				room.currentQuestionIndex++;
				room.questionState = QuestionState.IDLE;
				room.version = (room.version ?? 0) + 1;
				room.currentQuestionStartTime = new Date();
				room.updatedAt = new Date();

				room.players.forEach(player => {
					if (player.status !== PlayerStatus.DISCONNECTED && player.status !== PlayerStatus.FINISHED) {
						player.status = PlayerStatus.PLAYING;
						player.currentAnswer = undefined;
						player.timeSpent = undefined;
					}
				});
			}

			await this.roomService.updateRoom(room.roomId, room);

			return room;
		} catch (error) {
			logger.gameError('Failed to move to next question', {
				errorInfo: { message: getErrorMessage(error) },
				roomId: room.roomId,
			});
			throw error;
		}
	}

	private calculateTimeRemaining(room: MultiplayerRoom): number {
		if (!room.currentQuestionStartTime || room.status !== RoomStatus.PLAYING) {
			return room.config.timePerQuestion;
		}

		const now = Date.now();
		const elapsed = (now - room.currentQuestionStartTime.getTime()) / 1000;
		const remaining = room.config.timePerQuestion - elapsed;

		return Math.max(0, Math.floor(remaining));
	}
}
