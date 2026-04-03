import { Injectable } from '@nestjs/common';

import {
	ErrorCode,
	MULTIPLAYER_TIME_PER_QUESTION,
	PlayerStatus,
	QuestionState,
	RoomStatus,
	TIME_PERIODS_MS,
} from '@shared/constants';
import type {
	GameState,
	MultiplayerRoom,
	MultiplayerSubmitAnswerResult,
	PlayerAnswerMap,
	QuestionEndResult,
	TriviaQuestion,
} from '@shared/types';
import { calculateAnswerScore, getErrorMessage, isAnswerCorrect } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';

import { RoomService } from './room.service';

@Injectable()
export class GameStateService {
	constructor(private readonly roomService: RoomService) {}

	async initializeGame(room: MultiplayerRoom, questions: TriviaQuestion[]): Promise<MultiplayerRoom> {
		room.questions = questions;
		room.currentQuestionIndex = 0;
		room.status = RoomStatus.PLAYING;
		room.questionState = QuestionState.IDLE;
		room.startTime = new Date();
		room.currentQuestionStartTime = new Date();

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

		// Build answer counts map - count how many players answered each answer index
		const answerCounts: Record<string, number> = {};
		Object.values(playersAnswers).forEach(answerIndex => {
			const answerKey = String(answerIndex);
			answerCounts[answerKey] = (answerCounts[answerKey] ?? 0) + 1;
		});

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
			startedAt: room.startTime ? new Date(room.startTime).toISOString() : undefined,
			currentQuestionStartTime: room.currentQuestionStartTime
				? new Date(room.currentQuestionStartTime).toISOString()
				: undefined,
			answerCounts: Object.keys(answerCounts).length > 0 ? answerCounts : undefined,
		};
	}

	async submitAnswer(
		room: MultiplayerRoom,
		userId: string,
		questionId: string,
		answer: number,
		timeSpent: number
	): Promise<MultiplayerSubmitAnswerResult> {
		const player = room.players.find(p => p.userId === userId);
		if (!player) {
			throw new Error(ErrorCode.PLAYER_NOT_FOUND_IN_ROOM);
		}

		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (currentQuestion?.id !== questionId) {
			throw new Error(ErrorCode.QUESTION_NOT_FOUND_OR_NOT_CURRENT);
		}

		// Check if question has expired (server-authoritative timestamp check)
		if (room.currentQuestionStartTime && room.status === RoomStatus.PLAYING) {
			const now = Date.now();
			const questionEndTime =
				new Date(room.currentQuestionStartTime).getTime() + MULTIPLAYER_TIME_PER_QUESTION * TIME_PERIODS_MS.SECOND;
			if (now >= questionEndTime) {
				throw new Error(ErrorCode.QUESTION_NOT_FOUND_OR_NOT_CURRENT);
			}
		}

		const difficulty =
			currentQuestion.metadata?.mappedDifficulty ??
			room.config.mappedDifficulty ??
			toDifficultyLevel(currentQuestion.difficulty);

		if (player.status === PlayerStatus.ANSWERED) {
			const oldCorrect = isAnswerCorrect(currentQuestion, player.currentAnswer ?? -1);
			const oldStreak = oldCorrect ? player.correctAnswers - 1 : 0;
			const oldScoreEarned = calculateAnswerScore(difficulty, player.timeSpent ?? 0, oldStreak, oldCorrect);
			player.score = Math.max(0, player.score - oldScoreEarned);
			if (oldCorrect) player.correctAnswers--;
		}

		const isCorrect = isAnswerCorrect(currentQuestion, answer);
		const streak = player.correctAnswers;
		const scoreEarned = calculateAnswerScore(difficulty, timeSpent, streak, isCorrect);

		player.currentAnswer = answer;
		player.timeSpent = timeSpent;
		player.status = PlayerStatus.ANSWERED;
		if (player.answersSubmitted === 0) player.answersSubmitted++;
		if (isCorrect) {
			player.score += scoreEarned;
			player.correctAnswers++;
		}

		room.updatedAt = new Date();

		const updatedRoom = await this.roomService.updateRoom(room.roomId, room);

		logger.gameInfo('Answer submitted in multiplayer game', {
			roomId: room.roomId,
			userId,
			questionId,
			isCorrect,
			scoreEarned,
		});

		return {
			room: updatedRoom,
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

	async startQuestionFlow(roomId: string, room: MultiplayerRoom): Promise<MultiplayerRoom | null> {
		if (!this.transitionQuestionState(room, QuestionState.STARTING)) {
			return null;
		}

		room.currentQuestionStartTime = new Date();

		if (!this.transitionQuestionState(room, QuestionState.ACTIVE)) {
			return null;
		}

		const { version, ...updates } = room;
		const updatedRoom = await this.roomService.updateRoom(roomId, updates);

		return updatedRoom;
	}

	async endQuestionFlow(roomId: string, room: MultiplayerRoom): Promise<QuestionEndResult | null> {
		if (!this.endQuestion(room)) {
			return null;
		}

		const endResult = await this.endQuestionWithResults(room);

		const { version, ...updates } = endResult.room;
		await this.roomService.updateRoom(roomId, updates);

		return endResult;
	}

	private async endQuestionWithResults(room: MultiplayerRoom): Promise<QuestionEndResult> {
		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (!currentQuestion) {
			throw new Error(ErrorCode.QUESTION_NOT_FOUND_OR_NOT_CURRENT);
		}

		const results = room.players.map(player => {
			const isCorrect = isAnswerCorrect(currentQuestion, player.currentAnswer);
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
		this.transitionQuestionState(room, QuestionState.ENDED);

		return {
			results,
			leaderboard: gameState.leaderboard,
			room,
			answerCounts: gameState.answerCounts,
		};
	}

	async nextQuestion(room: MultiplayerRoom): Promise<MultiplayerRoom> {
		try {
			if (room.currentQuestionIndex >= room.questions.length - 1) {
				room.status = RoomStatus.FINISHED;
				room.questionState = QuestionState.IDLE;
				room.endTime = new Date();
				room.players.forEach(player => {
					if (player.status !== PlayerStatus.DISCONNECTED) {
						player.status = PlayerStatus.FINISHED;
					}
				});
			} else {
				room.currentQuestionIndex++;
				room.questionState = QuestionState.IDLE;
				room.currentQuestionStartTime = new Date();
				room.updatedAt = new Date();

				room.players.forEach(player => {
					if (player.status !== PlayerStatus.DISCONNECTED && player.status !== PlayerStatus.FINISHED) {
						player.status = PlayerStatus.PLAYING;
						player.currentAnswer = undefined;
						player.timeSpent = undefined;
						player.answersSubmitted = 0;
					}
				});
			}

			const { version, ...updates } = room;
			const updatedRoom = await this.roomService.updateRoom(room.roomId, updates);

			return updatedRoom;
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
			return MULTIPLAYER_TIME_PER_QUESTION;
		}

		const now = Date.now();
		const elapsed = (now - new Date(room.currentQuestionStartTime).getTime()) / TIME_PERIODS_MS.SECOND;
		const remaining = MULTIPLAYER_TIME_PER_QUESTION - elapsed;

		return Math.max(0, Math.floor(remaining));
	}
}
