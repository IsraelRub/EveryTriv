import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SERVER_CACHE_KEYS, TIME_PERIODS_MS } from '@shared/constants';
import type { AdminGameStatistics, AdminStatisticsRaw, ClearOperationResponse, TriviaQuestion } from '@shared/types';
import { buildCountRecord, calculateSuccessRate, getErrorMessage } from '@shared/utils';
import { restoreGameDifficulty } from '@shared/validation';

import { SQL_CONDITIONS } from '@internal/constants';
import { GameHistoryEntity, TriviaEntity, UserStatsEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { DifficultyCountRecord, NumericQueryResult, TopicCountRecord } from '@internal/types';
import { addDateRangeConditions, createGroupByQuery } from '@internal/utils';

@Injectable()
export class AdminService {
	constructor(
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		@InjectRepository(UserStatsEntity)
		private readonly userStatsRepo: Repository<UserStatsEntity>,
		private readonly cacheService: CacheService
	) {}

	async getAdminStatistics(): Promise<AdminGameStatistics> {
		try {
			const totalsRaw = await this.gameHistoryRepository
				.createQueryBuilder('game')
				.select('CAST(COUNT(*) AS INTEGER)', 'totalGames')
				.addSelect('CAST(AVG(game.score) AS DOUBLE PRECISION)', 'averageScore')
				.addSelect('CAST(MAX(game.score) AS INTEGER)', 'bestScore')
				.addSelect('CAST(SUM(game.game_question_count) AS INTEGER)', 'totalQuestionsAnswered')
				.addSelect('CAST(SUM(game.correctAnswers) AS INTEGER)', 'correctAnswers')
				.addSelect('MAX(game.createdAt)', 'lastActivity')
				.getRawOne<AdminStatisticsRaw>();

			const topicQueryBuilder = createGroupByQuery(this.gameHistoryRepository, 'game', 'topic', 'count', {
				topic: SQL_CONDITIONS.IS_NOT_NULL,
			});
			topicQueryBuilder.orderBy('count', 'DESC');
			const topicStatsRaw = await topicQueryBuilder.getRawMany<TopicCountRecord>();

			const difficultyQueryBuilder = createGroupByQuery(this.gameHistoryRepository, 'game', 'difficulty', 'count', {
				difficulty: SQL_CONDITIONS.IS_NOT_NULL,
			});
			difficultyQueryBuilder.orderBy('count', 'DESC');
			const difficultyStatsRaw = await difficultyQueryBuilder.getRawMany<DifficultyCountRecord>();
			const activePlayersQueryBuilder = this.gameHistoryRepository
				.createQueryBuilder('game')
				.select('CAST(COUNT(DISTINCT game.userId) AS INTEGER)', 'value');
			addDateRangeConditions(
				activePlayersQueryBuilder,
				'game',
				'createdAt',
				new Date(Date.now() - TIME_PERIODS_MS.DAY)
			);
			const activePlayersRaw = await activePlayersQueryBuilder.getRawOne<NumericQueryResult>();

			const totalGames = totalsRaw?.totalGames ?? 0;
			const totalQuestionsAnswered = totalsRaw?.totalQuestionsAnswered ?? 0;
			const correctAnswers = totalsRaw?.correctAnswers ?? 0;
			const accuracy = calculateSuccessRate(totalQuestionsAnswered, correctAnswers);

			const topics = buildCountRecord(
				topicStatsRaw,
				stat => stat.topic ?? null,
				stat => stat.count ?? 0
			);

			const difficultyDistribution = buildCountRecord(
				difficultyStatsRaw,
				stat => stat.difficulty ?? null,
				stat => stat.count ?? 0
			);

			return {
				totalGames,
				averageScore: totalsRaw?.averageScore ?? 0,
				bestScore: Math.round(totalsRaw?.bestScore ?? 0),
				totalQuestionsAnswered,
				correctAnswers,
				accuracy,
				activePlayers24h: activePlayersRaw?.value ?? 0,
				topics,
				difficultyDistribution,
				lastActivity: totalsRaw?.lastActivity ? new Date(totalsRaw.lastActivity).toISOString() : null,
			};
		} catch (error) {
			logger.gameError('Failed to collect admin game statistics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async clearAllGameHistory(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.gameHistoryRepository.count();

			if (totalBefore === 0) {
				try {
					await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN);
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN, {
						errorInfo: { message: getErrorMessage(cacheError) },
					});
				}
				return {
					success: true,
					message: 'No game history records found',
					deletedCount: 0,
				};
			}

			await this.gameHistoryRepository.clear();

			try {
				const cacheDeleted = await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN);
				if (cacheDeleted > 0) {
					logger.cacheInfo(`Game history cache cleared: ${cacheDeleted} keys deleted`);
				}
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.GAME_HISTORY.ALL_PATTERN, {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}

			return {
				success: true,
				message: 'All game history records removed successfully',
				deletedCount: totalBefore,
			};
		} catch (error) {
			logger.gameError('Failed to clear all game history', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getAllTriviaQuestions() {
		try {
			const questionEntities = await this.triviaRepository.find({
				order: { createdAt: 'DESC' },
			});

			return {
				questions: questionEntities.map(questionEntity => {
					const restoredDifficulty = restoreGameDifficulty(
						questionEntity.difficulty,
						questionEntity.metadata?.difficulty
					);

					const { user: _user, difficulty: _difficulty, ...rest } = questionEntity;

					const triviaQuestion: TriviaQuestion & { userId: string | null; isCorrect: boolean | null } = {
						...rest,
						difficulty: restoredDifficulty,
						userId: questionEntity.userId,
						isCorrect: questionEntity.isCorrect,
					};
					return triviaQuestion;
				}),
				totalCount: questionEntities.length,
			};
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async clearAllTrivia(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.triviaRepository.count();

			if (totalBefore === 0) {
				try {
					await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN);
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN, {
						errorInfo: { message: getErrorMessage(cacheError) },
					});
				}
				return {
					success: true,
					message: 'No trivia records found',
					deletedCount: 0,
				};
			}

			await this.triviaRepository.clear();

			try {
				const cacheDeleted = await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN);
				if (cacheDeleted > 0) {
					logger.cacheInfo(`Trivia cache cleared: ${cacheDeleted} keys deleted`);
				}
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.TRIVIA.ALL_PATTERN, {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}

			return {
				success: true,
				message: 'All trivia records removed successfully',
				deletedCount: totalBefore,
			};
		} catch (error) {
			logger.gameError('Failed to clear all trivia', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async clearAllUserStats(): Promise<ClearOperationResponse> {
		try {
			const totalBefore = await this.userStatsRepo.count();

			if (totalBefore === 0) {
				try {
					await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN);
				} catch (cacheError) {
					logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN, {
						errorInfo: { message: getErrorMessage(cacheError) },
					});
				}
				return {
					success: true,
					message: 'No user stats records found',
					deletedCount: 0,
				};
			}

			const deleteResult = await this.userStatsRepo.createQueryBuilder().delete().from(UserStatsEntity).execute();

			const deletedCount =
				typeof deleteResult.affected === 'number' && Number.isFinite(deleteResult.affected)
					? deleteResult.affected
					: totalBefore;

			try {
				const cacheDeleted = await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN);
				if (cacheDeleted > 0) {
					logger.cacheInfo(`User stats cache cleared: ${cacheDeleted} keys deleted`);
				}
			} catch (cacheError) {
				logger.cacheError('invalidatePattern', SERVER_CACHE_KEYS.USER_STATS.ALL_PATTERN, {
					errorInfo: { message: getErrorMessage(cacheError) },
				});
			}

			return {
				success: true,
				message: 'All user stats records removed successfully',
				deletedCount,
			};
		} catch (error) {
			logger.userError('Failed to clear all user stats', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}
}
