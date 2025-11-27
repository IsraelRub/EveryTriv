import { Injectable } from '@nestjs/common';

import { serverLogger as logger, ScoreCalculationService } from '@shared/services';
import type { GameState, MultiplayerRoom, TriviaQuestion } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { toDifficultyLevel } from '@shared/validation';

import { RoomService } from './room.service';

/**
 * Service for managing game state in multiplayer games
 * @class GameStateService
 * @description Handles game state, questions, answers, and scoring
 */
@Injectable()
export class GameStateService {
	constructor(
		private readonly roomService: RoomService,
		private readonly scoreCalculationService: ScoreCalculationService
	) {}

	/**
	 * Initialize game state with questions
	 * @param room Room to initialize
	 * @param questions Questions for the game
	 * @returns Updated room
	 */
	async initializeGame(room: MultiplayerRoom, questions: TriviaQuestion[]): Promise<MultiplayerRoom> {
		try {
			room.questions = questions;
			room.currentQuestionIndex = 0;
			room.status = 'playing';
			room.startTime = new Date();
			room.currentQuestionStartTime = new Date(); // Set start time for first question

			// Reset all players to playing state
			room.players.forEach(player => {
				player.status = 'playing';
				player.score = 0;
				player.answersSubmitted = 0;
				player.correctAnswers = 0;
				player.currentAnswer = undefined;
				player.timeSpent = undefined;
			});

			await this.roomService.updateRoom(room.roomId, room);

			logger.gameInfo('Multiplayer game initialized', {
				roomId: room.roomId,
				totalQuestions: questions.length,
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
		const playersAnswers: Record<string, number> = {};
		room.players.forEach(player => {
			if (player.currentAnswer !== undefined) {
				playersAnswers[player.userId] = player.currentAnswer;
			}
		});

		// Build players scores map
		const playersScores: Record<string, number> = {};
		room.players.forEach(player => {
			playersScores[player.userId] = player.score;
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
			totalQuestions: room.questions.length,
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
	): Promise<{ room: MultiplayerRoom; isCorrect: boolean; scoreEarned: number }> {
		try {
			const player = room.players.find(p => p.userId === userId);
			if (!player) {
				throw new Error('Player not found in room');
			}

			const currentQuestion = room.questions[room.currentQuestionIndex];
			if (!currentQuestion || currentQuestion.id !== questionId) {
				throw new Error('Question not found or not current');
			}

			// Check if already answered
			if (player.status === 'answered') {
				return {
					room,
					isCorrect: answer === currentQuestion.correctAnswerIndex,
					scoreEarned: 0,
				};
			}

			// Check answer
			const isCorrect = answer === currentQuestion.correctAnswerIndex;

			// Calculate score using ScoreCalculationService
			const difficulty = toDifficultyLevel(currentQuestion.difficulty);
			const timeSpentMs = timeSpent * 1000; // Convert to milliseconds
			const streak = player.correctAnswers; // Use current correct answers as streak
			const scoreEarned = this.scoreCalculationService.calculateAnswerScore(difficulty, timeSpentMs, streak, isCorrect);

			// Update player
			player.currentAnswer = answer;
			player.timeSpent = timeSpent;
			player.status = 'answered';
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
				room.status = 'finished';
				room.endTime = new Date();
				room.players.forEach(player => {
					if (player.status !== 'disconnected') {
						player.status = 'finished';
					}
				});
			} else {
				// Move to next question
				room.currentQuestionIndex++;
				room.currentQuestionStartTime = new Date(); // Set start time for new question
				room.updatedAt = new Date();

				// Reset players for next question
				room.players.forEach(player => {
					if (player.status !== 'disconnected' && player.status !== 'finished') {
						player.status = 'playing';
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
		if (!room.currentQuestionStartTime || room.status !== 'playing') {
			return room.config.timePerQuestion;
		}

		const now = Date.now();
		const elapsed = (now - room.currentQuestionStartTime.getTime()) / 1000;
		const remaining = room.config.timePerQuestion - elapsed;

		return Math.max(0, Math.floor(remaining));
	}
}
