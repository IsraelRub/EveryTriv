import { Injectable } from '@nestjs/common';

import { ERROR_CODES, PlayerStatus, RoomStatus } from '@shared/constants';
import type {
	GameState,
	MultiplayerAnswerResult,
	MultiplayerRoom,
	PlayerAnswerMap,
	TriviaQuestion,
} from '@shared/types';
import { calculateAnswerScore, checkAnswerCorrectness, getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';
import { serverLogger as logger } from '@internal/services';
import { RoomService } from './room.service';

/**
 * Service for managing game state in multiplayer games
 * @class GameStateService
 * @description Handles game state, questions, answers, and scoring
 */
@Injectable()
export class GameStateService {
	constructor(private readonly roomService: RoomService) {}

	/**
	 * Initialize game state with questions
	 * @param room Room to initialize
	 * @param questions Questions for the game
	 * @returns Updated room
	 */
	async initializeGame(room: MultiplayerRoom, questions: TriviaQuestion[]): Promise<MultiplayerRoom> {
		try {
			Object.assign(room, {
				questions,
				currentQuestionIndex: 0,
				status: RoomStatus.PLAYING,
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

			await this.roomService.updateRoom(room.roomId, room);

			logger.gameInfo('Multiplayer game initialized', {
				roomId: room.roomId,
				gameQuestionCount: questions.length,
				playerCount: room.players.length,
			});

			return room;
		} catch (error) {
			logger.gameError('Failed to initialize multiplayer game', {
				error: getErrorMessage(error),
				roomId: room.roomId,
			});
			throw error;
		}
	}

	/**
	 * Get current game state
	 * @param room Room
	 * @returns Current game state
	 */
	getGameState(room: MultiplayerRoom): GameState {
		const currentQuestion = room.questions[room.currentQuestionIndex] || null;
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
		};
	}

	/**
	 * Submit answer for a player
	 * @param room Room
	 * @param userId User ID
	 * @param questionId Question ID
	 * @param answer Answer index
	 * @param timeSpent Time spent in seconds
	 * @returns Updated room and answer result
	 */
	async submitAnswer(
		room: MultiplayerRoom,
		userId: string,
		questionId: string,
		answer: number,
		timeSpent: number
	): Promise<MultiplayerAnswerResult> {
		try {
			const player = room.players.find(p => p.userId === userId);
			if (!player) {
				throw new Error(ERROR_CODES.PLAYER_NOT_FOUND_IN_ROOM);
			}

			const currentQuestion = room.questions[room.currentQuestionIndex];
			if (!currentQuestion || currentQuestion.id !== questionId) {
				throw new Error(ERROR_CODES.QUESTION_NOT_FOUND_OR_NOT_CURRENT);
			}

			// Check if already answered
			if (player.status === PlayerStatus.ANSWERED) {
				return {
					room,
					isCorrect: answer === currentQuestion.correctAnswerIndex,
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
		} catch (error) {
			logger.gameError('Failed to submit answer in multiplayer game', {
				error: getErrorMessage(error),
				roomId: room.roomId,
				userId,
			});
			throw error;
		}
	}

	/**
	 * Move to next question
	 * @param room Room
	 * @returns Updated room
	 */
	async nextQuestion(room: MultiplayerRoom): Promise<MultiplayerRoom> {
		try {
			// Check if game is finished before incrementing
			if (room.currentQuestionIndex >= room.questions.length - 1) {
				room.status = RoomStatus.FINISHED;
				room.endTime = new Date();
				room.players.forEach(player => {
					if (player.status !== PlayerStatus.DISCONNECTED) {
						player.status = PlayerStatus.FINISHED;
					}
				});
			} else {
				// Move to next question
				room.currentQuestionIndex++;
				room.currentQuestionStartTime = new Date(); // Set start time for new question
				room.updatedAt = new Date();

				// Reset players for next question
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
				error: getErrorMessage(error),
				roomId: room.roomId,
			});
			throw error;
		}
	}

	/**
	 * Calculate time remaining for current question
	 * @param room Room
	 * @returns Time remaining in seconds
	 */
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
