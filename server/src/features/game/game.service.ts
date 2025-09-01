import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnswerResult, LeaderboardEntry, UserScoreData } from '@shared/types';
import { GAME_ERROR_MESSAGES } from 'everytriv-shared/constants/error.constants';
import { GameMode } from 'everytriv-shared/constants/game.constants';
import { CACHE_TTL } from 'everytriv-shared/constants/storage.constants';
import { groupBy } from 'everytriv-shared/utils';
import { MoreThan, Repository } from 'typeorm';

import { ValidationService } from '../../common';
import { SERVER_GAME_CONSTANTS } from '../../shared/constants/game.constants';
import { LoggerService } from '../../shared/controllers';
import { GameHistoryEntity } from '../../shared/entities/gameHistory.entity';
import { TriviaEntity } from '../../shared/entities/trivia.entity';
import { UserEntity } from '../../shared/entities/user.entity';
import { CacheService } from '../../shared/modules/cache/cache.service';
import { ServerStorageService } from '../../shared/modules/storage';
import { AnalyticsService } from '../analytics/analytics.service';
import { ScoringService } from './logic/scoring';
import { TriviaGenerationService } from './logic/triviaGeneration.service';

/**
 * Service for managing trivia games, game history, and user points
 * Handles game logic, question generation, scoring, history tracking, and points management
 */
@Injectable()
export class GameService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		private readonly analyticsService: AnalyticsService,
		private readonly cacheService: CacheService,
		private readonly storageService: ServerStorageService,
		private readonly triviaGenerationService: TriviaGenerationService,
		private readonly scoringService: ScoringService,
		private readonly validationService: ValidationService,
		private readonly logger: LoggerService
	) {}

	/**
	 * Get trivia question
	 * @param topic Topic for the question
	 * @param difficulty Difficulty level
	 * @param questionCount Number of questions to generate
	 * @param userId User ID for personalization
	 * @returns Trivia question
	 */
	async getTriviaQuestion(topic: string, difficulty: string, questionCount: number = 1, userId?: string) {
		// Validate request
		const validation = await this.validationService.validateTriviaRequest(topic, difficulty, questionCount);
		if (!validation.isValid) {
			throw new BadRequestException(validation.errors.join(', '));
		}

		// Apply server-side game limits
		const maxQuestions = SERVER_GAME_CONSTANTS.MAX_QUESTIONS_PER_REQUEST;
		const actualQuestionCount = Math.min(questionCount, maxQuestions);

		if (questionCount > maxQuestions) {
			this.logger.gameError(
				`Question count ${questionCount} exceeds limit ${maxQuestions}, using ${actualQuestionCount}`,
				{
					requestedCount: questionCount,
					maxQuestions,
					actualCount: actualQuestionCount,
				}
			);
		}

		try {
			// Use getOrSet for better cache efficiency
			const cacheKey = `trivia:${topic}:${difficulty}:${actualQuestionCount}`;

			const questions = await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					// Generate questions with server-side timeout
					const generatedQuestions = [];
					const generationTimeout = SERVER_GAME_CONSTANTS.QUESTION_GENERATION_TIMEOUT;

					for (let i = 0; i < actualQuestionCount; i++) {
						const question = await Promise.race([
							this.triviaGenerationService.generateQuestion(topic, difficulty),
							new Promise((_, reject) =>
								setTimeout(() => reject(new Error('Question generation timeout')), generationTimeout)
							),
						]);
						generatedQuestions.push(question);
					}

					return generatedQuestions;
				},
				CACHE_TTL.TRIVIA_QUESTIONS
			);

			// Track analytics
			if (userId) {
				await this.analyticsService.trackEvent(userId, {
					eventType: 'game',
					userId,
					timestamp: new Date(),
					action: 'question_requested',
					properties: { topic, difficulty, questionCount: actualQuestionCount },
				});
			}

			return {
				questions,
				fromCache: false, // getOrSet handles cache internally
			};
		} catch (error) {
			throw new Error(
				`Failed to generate trivia questions: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get question by ID
	 * @param questionId Question ID
	 * @returns Question details
	 */
	async getQuestionById(questionId: string) {
		try {
			const question = await this.triviaRepository.findOne({
				where: { id: questionId },
			});

			if (!question) {
				throw new Error(GAME_ERROR_MESSAGES.QUESTION_NOT_FOUND);
			}

			return question;
		} catch (error) {
			throw new Error(
				`${GAME_ERROR_MESSAGES.FAILED_TO_GET_QUESTION}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Submit answer
	 * @param questionId Question ID
	 * @param answer User's answer
	 * @param userId User ID
	 * @param timeSpent Time spent answering
	 * @returns Answer result
	 */
	async submitAnswer(questionId: string, answer: string, userId: string, timeSpent: number): Promise<AnswerResult> {
		try {
			// Get question
			const question = await this.getQuestionById(questionId);
			if (!question) {
				throw new Error(GAME_ERROR_MESSAGES.QUESTION_NOT_FOUND);
			}

			// Check answer
			const isCorrect = this.checkAnswer(question, answer);

			// Calculate score
			const score = this.scoringService.calculatePoints(question.difficulty, timeSpent, 0);

			// Save game history
			await this.saveGameHistory(userId, {
				score,
				totalQuestions: 1,
				correctAnswers: isCorrect ? 1 : 0,
				difficulty: question.difficulty,
				topic: question.topic,
				gameMode: 'CLASSIC',
				timeSpent,
				creditsUsed: 0,
				questionsData: [
					{
						question: question.question,
						userAnswer: answer,
						correctAnswer: question.answers[question.correctAnswerIndex]?.text || '',
						isCorrect,
						timeSpent,
					},
				],
			});

			// Update user score
			await this.updateUserScore(userId, score);

			// Track analytics
			await this.analyticsService.trackUserAnswer(userId, questionId, {
				questionId,
				answer,
				topic: question.topic,
				difficulty: question.difficulty,
				isCorrect,
				timeSpent,
				points: score,
			});

			return {
				isCorrect,
				correctAnswer: question.answers[question.correctAnswerIndex]?.text || '',
				points: score,
				feedback: isCorrect ? 'תשובה נכונה!' : 'תשובה שגויה. נסה שוב!',
			};
		} catch (error) {
			throw new Error(
				`${GAME_ERROR_MESSAGES.FAILED_TO_SUBMIT_ANSWER}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get user analytics
	 * @param userId User ID
	 * @returns User analytics
	 */
	async getUserAnalytics(userId: string) {
		try {
			// Use getOrSet for better cache efficiency
			const cacheKey = `analytics:user:${userId}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					return await this.analyticsService.getUserStats(userId);
				},
				1800 // Cache for 30 minutes
			);
		} catch (error) {
			throw new Error(
				`${GAME_ERROR_MESSAGES.FAILED_TO_GET_ANALYTICS}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Get leaderboard
	 * @param limit Number of entries to return
	 * @returns Leaderboard data
	 */
	async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
		try {
			// Use getOrSet for better cache efficiency
			const cacheKey = `leaderboard:${limit}`;

			return await this.cacheService.getOrSet(
				cacheKey,
				async () => {
					// Get top users by score
					const topUsers = await this.userRepository.find({
						select: ['id', 'username', 'score', 'avatar'],
						where: { isActive: true },
						order: { score: 'DESC' },
						take: limit,
					});

					// Get user statistics for leaderboard
					const leaderboard: LeaderboardEntry[] = await Promise.all(
						topUsers.map(async (user, index) => {
							const stats = await this.getUserGameStats(user.id);
							return {
								rank: index + 1,
								userId: user.id,
								username: user.username,
								score: user.score,
								avatar: user.avatar,
								totalQuestions: stats.totalQuestions,
								correctAnswers: stats.totalCorrectAnswers,
								successRate: stats.overallSuccessRate,
							};
						})
					);

					return leaderboard;
				},
				300 // Cache for 5 minutes
			);
		} catch (error) {
			throw new Error(`Failed to get leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get limited leaderboard (top N users)
	 * @param limit Number of entries
	 * @returns Limited leaderboard
	 */
	async getLeaderboardLimited(limit: number = 5): Promise<LeaderboardEntry[]> {
		return this.getLeaderboard(limit);
	}

	// ===== PRIVATE HELPER FUNCTIONS =====

	/**
	 * Get user rank
	 * @param userId User ID
	 * @returns User rank
	 */
	private async getUserRank(userId: string): Promise<number> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				return 0;
			}

			const rank = await this.userRepository.count({
				where: {
					isActive: true,
					score: MoreThan(user.score),
				},
			});

			return rank + 1;
		} catch (error) {
			return 0;
		}
	}

	/**
	 * Update user statistics
	 * @param userId User ID
	 * @param gameData Game data
	 */
	private async updateUserStats(
		userId: string,
		gameData: {
			score: number;
			totalQuestions: number;
			correctAnswers: number;
			difficulty: string;
			topic?: string;
			gameMode: string;
			timeSpent?: number;
			creditsUsed: number;
			questionsdata?: Record<string, unknown>;
		}
	) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				return;
			}

			// Update user statistics
			const stats = user.stats || {};
			stats.totalQuestions = (stats.totalQuestions || 0) + gameData.totalQuestions;
			stats.correctAnswers = (stats.correctAnswers || 0) + gameData.correctAnswers;
			stats.lastPlayed = new Date();

			// Update topic statistics
			if (!stats.topicsPlayed) stats.topicsPlayed = {};
			if (gameData.topic) {
				if (!stats.topicsPlayed[gameData.topic]) {
					stats.topicsPlayed[gameData.topic] = 0;
				}
				stats.topicsPlayed[gameData.topic]++;
			}

			user.stats = stats;
			await this.userRepository.save(user);

			this.logger.gameStatistics('User statistics updated', {
				userId,
				score: gameData.score,
				correctAnswers: gameData.correctAnswers,
				totalQuestions: gameData.totalQuestions,
			});
		} catch (error) {
			this.logger.gameError('Failed to update user stats', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				score: gameData.score,
			});
		}
	}

	/**
	 * Calculate game statistics
	 * @param gameHistory Game history records
	 * @returns Calculated statistics
	 */
	private calculateGameStats(gameHistory: GameHistoryEntity[]) {
		if (gameHistory.length === 0) {
			return {
				totalGames: 0,
				totalQuestions: 0,
				totalCorrectAnswers: 0,
				overallSuccessRate: 0,
				averageScore: 0,
				totalTimeSpent: 0,
				averageTimePerGame: 0,
				topicsPlayed: {},
				difficultyBreakdown: {},
				gameModeBreakdown: {},
				bestScore: 0,
				worstScore: 0,
				lastPlayed: null,
			};
		}

		const totalGames = gameHistory.length;
		const totalQuestions = gameHistory.reduce((sum, game) => sum + game.totalQuestions, 0);
		const totalCorrectAnswers = gameHistory.reduce((sum, game) => sum + game.correctAnswers, 0);
		const totalScore = gameHistory.reduce((sum, game) => sum + game.score, 0);
		const totalTimeSpent = gameHistory.reduce((sum, game) => sum + (game.timeSpent || 0), 0);

		// Use groupBy for better performance and cleaner code
		const topicsPlayed = groupBy(
			gameHistory.filter(game => game.topic),
			'topic'
		);
		const difficultyBreakdown = groupBy(gameHistory, 'difficulty');
		const gameModeBreakdown = groupBy(gameHistory, 'gameMode');

		// Convert to count format
		const topicsPlayedCount: Record<string, number> = {};
		const difficultyBreakdownCount: Record<string, number> = {};
		const gameModeBreakdownCount: Record<string, number> = {};

		Object.entries(topicsPlayed).forEach(([topic, games]) => {
			topicsPlayedCount[topic] = games.length;
		});

		Object.entries(difficultyBreakdown).forEach(([difficulty, games]) => {
			difficultyBreakdownCount[difficulty] = games.length;
		});

		Object.entries(gameModeBreakdown).forEach(([gameMode, games]) => {
			gameModeBreakdownCount[gameMode] = games.length;
		});

		const scores = gameHistory.map(game => game.score);
		const bestScore = Math.max(...scores);
		const worstScore = Math.min(...scores);
		const lastPlayed = gameHistory.reduce(
			(latest, game) => (game.createdAt > latest ? game.createdAt : latest),
			gameHistory[0].createdAt
		);

		return {
			totalGames,
			totalQuestions,
			totalCorrectAnswers,
			overallSuccessRate: totalQuestions > 0 ? (totalCorrectAnswers / totalQuestions) * 100 : 0,
			averageScore: totalGames > 0 ? totalScore / totalGames : 0,
			totalTimeSpent,
			averageTimePerGame: totalGames > 0 ? totalTimeSpent / totalGames : 0,
			topicsPlayed: topicsPlayedCount,
			difficultyBreakdown: difficultyBreakdownCount,
			gameModeBreakdown: gameModeBreakdownCount,
			bestScore,
			worstScore,
			lastPlayed,
		};
	}

	/**
	 * Check if answer is correct
	 * @param question Question entity
	 * @param answer User's answer
	 * @returns Whether answer is correct
	 */
	private checkAnswer(question: TriviaEntity, answer: string): boolean {
		const correctAnswer = question.answers[question.correctAnswerIndex]?.text || '';
		return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
	}

	/**
	 * Update user score
	 * @param userId User ID
	 * @param score Score to add
	 */
	private async updateUserScore(userId: string, score: number): Promise<void> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			user.score += score;
			await this.userRepository.save(user);

			// Invalidate user score cache
			await this.cacheService.delete(`user:score:${userId}`);
			// Also invalidate related caches
			await this.cacheService.invalidatePattern(`leaderboard:*`);
			await this.cacheService.invalidatePattern(`analytics:user:${userId}`);

			// Clear active game session
			const result = await this.storageService.removeItem(`active_game:${userId}`);
			if (!result.success) {
				this.logger.gameError('Failed to clear active game session', {
					error: result.error || 'Unknown error',
					userId,
				});
			}
		} catch (error) {
			throw new Error(`Failed to update user score: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get user score data
	 * @param userId User ID
	 * @returns User score data
	 */
	async getUserScoreData(userId: string): Promise<UserScoreData> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			return {
				userId: user.id,
				score: user.score,
				rank: await this.getUserRank(userId),
			};
		} catch (error) {
			throw new Error(`Failed to get user score data: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// ===== GAME HISTORY FUNCTIONS =====

	/**
	 * Save game history
	 * @param userId User ID
	 * @param gameData Game data to save
	 * @returns Saved game history
	 */
	async saveGameHistory(
		userId: string,
		gameData: {
			score: number;
			totalQuestions: number;
			correctAnswers: number;
			difficulty: string;
			topic?: string;
			gameMode: string;
			timeSpent?: number;
			creditsUsed: number;
			questionsData: Array<{
				question: string;
				userAnswer: string;
				correctAnswer: string;
				isCorrect: boolean;
				timeSpent?: number;
			}>;
		}
	) {
		// Store active game session temporarily (persistent storage - survives cache invalidation)
		const sessionKey = `active_game:${userId}`;
		const result = await this.storageService.setItem(
			sessionKey,
			{
				...gameData,
				startedAt: new Date().toISOString(),
				status: 'active',
			},
			3600 // 1 hour TTL
		);

		if (!result.success) {
			this.logger.gameError('Failed to store active game session', {
				error: result.error || 'Unknown error',
				userId,
			});
		}
		try {
			this.logger.game('Saving game history', {
				userId,
				score: gameData.score,
				correctAnswers: gameData.correctAnswers,
				totalQuestions: gameData.totalQuestions,
			});

			// Validate user exists
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			// Create game history record
			const gameHistory = this.gameHistoryRepository.create({
				userId,
				score: gameData.score,
				totalQuestions: gameData.totalQuestions,
				correctAnswers: gameData.correctAnswers,
				difficulty: gameData.difficulty,
				topic: gameData.topic,
				gameMode: gameData.gameMode as GameMode,
				timeSpent: gameData.timeSpent,
				creditsUsed: gameData.creditsUsed,
				questionsData: gameData.questionsData,
			});

			// Save to database
			const savedHistory = await this.gameHistoryRepository.save(gameHistory);
			this.logger.databaseCreate('game_history', {
				historyId: savedHistory.id,
				userId,
				score: gameData.score,
			});

			// Update user statistics
			await this.updateUserStats(userId, gameData);

			return {
				id: savedHistory.id,
				userId: savedHistory.userId,
				score: savedHistory.score,
				totalQuestions: savedHistory.totalQuestions,
				correctAnswers: savedHistory.correctAnswers,
				successRate: (savedHistory.correctAnswers / savedHistory.totalQuestions) * 100,
				difficulty: savedHistory.difficulty,
				topic: savedHistory.topic,
				gameMode: savedHistory.gameMode,
				timeSpent: savedHistory.timeSpent,
				creditsUsed: savedHistory.creditsUsed,
				created_at: savedHistory.createdAt,
			};
		} catch (error) {
			this.logger.gameError('Failed to save game history', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				score: gameData.score,
			});
			throw error;
		}
	}

	/**
	 * Get user game history
	 * @param userId User ID
	 * @param limit Number of records to return
	 * @returns User game history
	 */
	async getUserGameHistory(userId: string, limit: number = 20) {
		try {
			this.logger.game('Getting user game history', {
				userId,
				limit,
			});

			// Validate user exists
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			// Get game history records
			const gameHistory = await this.gameHistoryRepository.find({
				where: { userId },
				order: { createdAt: 'DESC' },
				take: limit,
			});

			return {
				userId,
				username: user.username,
				totalGames: gameHistory.length,
				games: gameHistory.map(game => ({
					id: game.id,
					score: game.score,
					totalQuestions: game.totalQuestions,
					correctAnswers: game.correctAnswers,
					successRate: (game.correctAnswers / game.totalQuestions) * 100,
					difficulty: game.difficulty,
					topic: game.topic,
					gameMode: game.gameMode,
					timeSpent: game.timeSpent,
					creditsUsed: game.creditsUsed,
					created_at: game.createdAt,
				})),
			};
		} catch (error) {
			this.logger.gameError('Failed to get user game history', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get game statistics for user
	 * @param userId User ID
	 * @returns User game statistics
	 */
	async getUserGameStats(userId: string) {
		try {
			this.logger.game('Getting user game stats', {
				userId,
			});

			// Validate user exists
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			// Get all game history for user
			const gameHistory = await this.gameHistoryRepository.find({
				where: { userId },
			});

			// Calculate statistics
			const stats = this.calculateGameStats(gameHistory);

			return {
				userId,
				username: user.username,
				totalGames: stats.totalGames,
				totalQuestions: stats.totalQuestions,
				totalCorrectAnswers: stats.totalCorrectAnswers,
				overallSuccessRate: stats.overallSuccessRate,
				averageScore: stats.averageScore,
				totalTimeSpent: stats.totalTimeSpent,
				averageTimePerGame: stats.averageTimePerGame,
				topicsPlayed: stats.topicsPlayed,
				difficultyBreakdown: stats.difficultyBreakdown,
				gameModeBreakdown: stats.gameModeBreakdown,
				bestScore: stats.bestScore,
				worstScore: stats.worstScore,
				lastPlayed: stats.lastPlayed,
			};
		} catch (error) {
			this.logger.gameError('Failed to get user game stats', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Get global game statistics
	 * @returns Global game statistics
	 */
	async getGlobalGameStats() {
		try {
			this.logger.game('Getting global game stats', {
				timeframe: 'all_time',
			});

			// Get all game history
			const gameHistory = await this.gameHistoryRepository.find();

			// Calculate global statistics
			const stats = this.calculateGameStats(gameHistory);

			return {
				totalGames: stats.totalGames,
				totalQuestions: stats.totalQuestions,
				totalCorrectAnswers: stats.totalCorrectAnswers,
				overallSuccessRate: stats.overallSuccessRate,
				averageScore: stats.averageScore,
				totalTimeSpent: stats.totalTimeSpent,
				averageTimePerGame: stats.averageTimePerGame,
				topicsPlayed: stats.topicsPlayed,
				difficultyBreakdown: stats.difficultyBreakdown,
				gameModeBreakdown: stats.gameModeBreakdown,
				bestScore: stats.bestScore,
				worstScore: stats.worstScore,
				lastPlayed: stats.lastPlayed,
			};
		} catch (error) {
			this.logger.gameError('Failed to get global game stats', {
				error: error instanceof Error ? error.message : 'Unknown error',
				timeframe: 'all_time',
			});
			throw error;
		}
	}

	/**
	 * Get game by ID
	 * @param gameId Game ID
	 * @returns Game details
	 */
	async getGameById(gameId: string) {
		try {
			this.logger.game('Getting game by ID', {
				gameId,
			});

			const game = await this.gameHistoryRepository.findOne({
				where: { id: gameId },
			});

			if (!game) {
				throw new Error('Game not found');
			}

			return {
				id: game.id,
				userId: game.userId,
				score: game.score,
				totalQuestions: game.totalQuestions,
				correctAnswers: game.correctAnswers,
				successRate: (game.correctAnswers / game.totalQuestions) * 100,
				difficulty: game.difficulty,
				topic: game.topic,
				gameMode: game.gameMode,
				timeSpent: game.timeSpent,
				creditsUsed: game.creditsUsed,
				questionsData: game.questionsData,
				created_at: game.createdAt,
			};
		} catch (error) {
			this.logger.gameError('Failed to get game by ID', {
				error: error instanceof Error ? error.message : 'Unknown error',
				gameId,
			});
			throw error;
		}
	}

	// ===== POINTS MANAGEMENT FUNCTIONS =====

	/**
	 * Get user point balance
	 * @param userId User ID
	 * @returns User point balance
	 */
	async getUserPointBalance(userId: string) {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			return {
				userId: user.id,
				username: user.username,
				points: user.credits || 0,
			};
		} catch (error) {
			this.logger.gameError('Failed to get user point balance', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
			});
			throw error;
		}
	}

	/**
	 * Add points to user
	 * @param userId User ID
	 * @param points Points to add
	 * @returns Updated point balance
	 */
	async addPoints(userId: string, points: number) {
		try {
			this.logger.game('Adding points to user', {
				userId,
				points,
				reason: 'Game completion',
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const newPoints = (user.credits || 0) + points;
			await this.userRepository.update(userId, { credits: newPoints });

			return {
				userId: user.id,
				username: user.username,
				previousPoints: user.credits || 0,
				addedPoints: points,
				newPoints,
			};
		} catch (error) {
			this.logger.gameError('Failed to add points', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				points,
			});
			throw error;
		}
	}

	/**
	 * Deduct points from user
	 * @param userId User ID
	 * @param points Points to deduct
	 * @returns Updated point balance
	 */
	async deductPoints(userId: string, points: number) {
		try {
			this.logger.game('Deducting points from user', {
				userId,
				points,
				reason: 'Game loss',
			});

			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw new Error('User not found');
			}

			const currentPoints = user.credits || 0;
			if (currentPoints < points) {
				throw new Error('Insufficient points');
			}

			const newPoints = currentPoints - points;
			await this.userRepository.update(userId, { credits: newPoints });

			return {
				userId: user.id,
				username: user.username,
				previousPoints: currentPoints,
				deductedPoints: points,
				newPoints,
			};
		} catch (error) {
			this.logger.gameError('Failed to deduct points', {
				error: error instanceof Error ? error.message : 'Unknown error',
				userId,
				points,
			});
			throw error;
		}
	}

	/**
	 * Save game configuration
	 * @param userId User ID
	 * @param config Game configuration
	 * @returns Save result
	 */
	async saveGameConfiguration(
		userId: string,
		config: {
			defaultDifficulty?: string;
			defaultTopic?: string;
			questionCount?: number;
			timeLimit?: number;
			soundEnabled?: boolean;
			notifications?: boolean;
		}
	) {
		try {
			this.logger.game('Saving game configuration', {
				userId,
				config,
			});

			// Store game configuration in persistent storage (survives cache invalidation)
			const configKey = `game_config:${userId}`;
			const result = await this.storageService.setItem(
				configKey,
				{
					...config,
					updatedAt: new Date().toISOString(),
					userId,
				},
				0 // No TTL - persistent storage
			);

			if (!result.success) {
				this.logger.gameError('Failed to store game configuration', {
					userId,
					error: result.error || 'Unknown error',
				});
				throw new Error('Failed to save game configuration');
			}

			return {
				success: true,
				message: 'Game configuration saved successfully',
				config,
			};
		} catch (error) {
			this.logger.gameError('Failed to save game configuration', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get game configuration
	 * @param userId User ID
	 * @returns Game configuration
	 */
	async getGameConfiguration(userId: string) {
		try {
			this.logger.game('Getting game configuration', {
				userId,
			});

			// Get configuration from persistent storage
			const configKey = `game_config:${userId}`;
			const result = await this.storageService.getItem(configKey);

			if (result.success && result.data) {
				return {
					success: true,
					config: result.data,
				};
			}

			// Return default configuration if not found
			const defaultConfig = {
				defaultDifficulty: 'medium',
				defaultTopic: 'general',
				questionCount: 5,
				timeLimit: 30,
				soundEnabled: true,
				notifications: true,
			};

			return {
				success: true,
				config: defaultConfig,
			};
		} catch (error) {
			this.logger.gameError('Failed to get game configuration', {
				userId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
