import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CACHE_KEYS, TIME_DURATIONS_SECONDS, TIME_PERIODS_MS, VALIDATION_COUNT } from '@shared/constants';
import type { AdminGameStatistics, AdminTriviaQuestion, CountRecord, TriviaQuestionsResponse } from '@shared/types';
import { buildCountRecord, calculateScoreRate, getErrorMessage } from '@shared/utils';

import { restoreGameDifficulty } from '@common/validation';
import { SQL_CONDITIONS } from '@internal/constants';
import { GameHistoryEntity, TriviaEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { AdminStatisticsRaw, DifficultyCountRecord, NumericQueryResult, TopicCountRecord } from '@internal/types';
import { addDateRangeConditions, createGroupByQuery, isAdminGameStatistics } from '@internal/utils';

@Injectable()
export class AdminService {
	constructor(
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		private readonly cacheService: CacheService
	) {}

	async getAdminStatistics(): Promise<AdminGameStatistics> {
		try {
			return await this.cacheService.getOrSet<AdminGameStatistics>(
				CACHE_KEYS.ADMIN.STATISTICS,
				async () => this.fetchAdminStatistics(),
				TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES,
				isAdminGameStatistics
			);
		} catch (error) {
			logger.gameError('Failed to collect admin game statistics', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	private async fetchAdminStatistics(): Promise<AdminGameStatistics> {
		const totalsRaw = await this.gameHistoryRepository
			.createQueryBuilder('game')
			.select('CAST(COUNT(*) AS INTEGER)', 'totalGames')
			.addSelect('CAST(AVG(game.score) AS DOUBLE PRECISION)', 'averageScore')
			.addSelect('CAST(MAX(game.score) AS INTEGER)', 'bestScore')
			.addSelect('CAST(SUM(game.game_question_count) AS INTEGER)', 'totalQuestionsAnswered')
			.addSelect('CAST(SUM(game.correct_answers) AS INTEGER)', 'correctAnswers')
			.addSelect('CAST(SUM(game.score) AS INTEGER)', 'totalScore')
			.addSelect('MAX(game.created_at)', 'lastActivity')
			.getRawOne<AdminStatisticsRaw>();

		const topicQueryBuilder = createGroupByQuery(this.gameHistoryRepository, 'game', 'topic', 'count', {
			topic: SQL_CONDITIONS.IS_NOT_NULL,
		});
		topicQueryBuilder.andWhere('game.gameQuestionCount > :minQuestions', { minQuestions: 0 });
		topicQueryBuilder.orderBy('count', 'DESC');
		const topicStatsRaw = await topicQueryBuilder.getRawMany<TopicCountRecord>();

		const difficultyQueryBuilder = createGroupByQuery(this.gameHistoryRepository, 'game', 'difficulty', 'count', {
			difficulty: SQL_CONDITIONS.IS_NOT_NULL,
		});
		difficultyQueryBuilder.orderBy('count', 'DESC');
		const difficultyStatsRaw = await difficultyQueryBuilder.getRawMany<DifficultyCountRecord>();
		const activePlayersQueryBuilder = this.gameHistoryRepository
			.createQueryBuilder('game')
			.select('CAST(COUNT(DISTINCT game.user_id) AS INTEGER)', 'value');
		addDateRangeConditions(activePlayersQueryBuilder, 'game', 'created_at', new Date(Date.now() - TIME_PERIODS_MS.DAY));
		const activePlayersRaw = await activePlayersQueryBuilder.getRawOne<NumericQueryResult>();

		const totalGames = totalsRaw?.totalGames ?? 0;
		const totalQuestionsAnswered = totalsRaw?.totalQuestionsAnswered ?? 0;
		const correctAnswers = totalsRaw?.correctAnswers ?? 0;
		const totalScore = totalsRaw?.totalScore ?? 0;
		const accuracy = calculateScoreRate(totalScore, totalQuestionsAnswered);

		// Normalize topics to handle case-insensitive duplicates (e.g., "science" vs "Science")
		// Use a Map with lowercase keys for case-insensitive grouping, but preserve the variant with the highest count
		const topicsMap = new Map<string, { original: string; count: number; maxVariantCount: number }>();
		for (const stat of topicStatsRaw) {
			if (stat.topic) {
				const trimmed = stat.topic.trim();
				const lowerKey = trimmed.toLowerCase();
				const statCount = stat.count ?? 0;
				const existing = topicsMap.get(lowerKey);
				if (existing) {
					existing.count += statCount;
					// Keep the variant with the highest individual count
					if (statCount > existing.maxVariantCount) {
						existing.original = trimmed;
						existing.maxVariantCount = statCount;
					}
				} else {
					topicsMap.set(lowerKey, { original: trimmed, count: statCount, maxVariantCount: statCount });
				}
			}
		}
		const topics: CountRecord = {};
		for (const [, value] of topicsMap.entries()) {
			topics[value.original] = value.count;
		}

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
	}

	async getAllTriviaQuestions(params: { limit: number; offset: number }): Promise<TriviaQuestionsResponse> {
		try {
			const take = Math.min(
				Math.max(params.limit, VALIDATION_COUNT.ADMIN_TRIVIA_LIST.LIMIT_MIN),
				VALIDATION_COUNT.ADMIN_TRIVIA_LIST.LIMIT_MAX
			);
			const skip = Math.max(params.offset, 0);

			const [questionEntities, totalCount] = await this.triviaRepository.findAndCount({
				order: { createdAt: 'DESC' },
				take,
				skip,
			});

			return {
				questions: questionEntities.map(questionEntity => {
					const restoredDifficulty = restoreGameDifficulty(
						questionEntity.difficulty,
						questionEntity.metadata?.difficulty
					);

					const { user: _user, difficulty: _difficulty, ...rest } = questionEntity;

					const triviaQuestion: AdminTriviaQuestion = {
						...rest,
						difficulty: restoredDifficulty,
						userId: questionEntity.userId,
						isCorrect: questionEntity.isCorrect,
					};
					return triviaQuestion;
				}),
				totalCount,
			};
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}
}
