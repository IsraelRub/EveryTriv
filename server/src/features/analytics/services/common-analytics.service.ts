import { Injectable } from '@nestjs/common';

import { TIME_PERIODS_MS, TimePeriod, VALIDATION_COUNT } from '@shared/constants';
import type { AnalyticsResponse, CountRecord, UserTrendPoint } from '@shared/types';
import { calculateScoreRate, clamp, groupByBy, sumBy } from '@shared/utils';

import type { GameHistoryEntity } from '@internal/entities';

@Injectable()
export class AnalyticsCommonService {
	createAnalyticsResponse<T>(data: T): AnalyticsResponse<T> {
		return {
			data,
			timestamp: new Date().toISOString(),
		};
	}

	getTopKey(counter: CountRecord): string | undefined {
		return Object.entries(counter).sort((a, b) => b[1] - a[1])[0]?.[0];
	}

	normalizeDateToPeriod(date: Date, period: TimePeriod): Date {
		const normalized = new Date(date);
		switch (period) {
			case TimePeriod.HOURLY: {
				normalized.setMinutes(0, 0, 0);
				break;
			}
			case TimePeriod.WEEKLY: {
				const day = normalized.getDay();
				const diff = (day + 6) % 7;
				normalized.setDate(normalized.getDate() - diff);
				normalized.setHours(0, 0, 0, 0);
				break;
			}
			case TimePeriod.MONTHLY: {
				normalized.setDate(1);
				normalized.setHours(0, 0, 0, 0);
				break;
			}
			case TimePeriod.DAILY:
			default: {
				normalized.setHours(0, 0, 0, 0);
			}
		}
		return normalized;
	}

	getWeekNumber(date: Date): number {
		const target = new Date(date.valueOf());
		target.setHours(0, 0, 0, 0);
		target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
		const firstThursday = new Date(target.getFullYear(), 0, 4);
		firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
		const weekNumber = Math.ceil((target.getTime() - firstThursday.getTime()) / TIME_PERIODS_MS.WEEK) + 1;
		return weekNumber;
	}

	getPeriodKey(date: Date, period: TimePeriod): string {
		const normalized = this.normalizeDateToPeriod(date, period);
		switch (period) {
			case TimePeriod.HOURLY:
				return normalized.toISOString().substring(0, 13);
			case TimePeriod.WEEKLY:
				return `${normalized.getFullYear()}-W${String(this.getWeekNumber(normalized)).padStart(2, '0')}`;
			case TimePeriod.MONTHLY:
				return normalized.toISOString().substring(0, 7);
			case TimePeriod.DAILY:
			default:
				return normalized.toISOString().substring(0, 10);
		}
	}

	buildTrends(
		gameHistory: GameHistoryEntity[],
		options: { limit?: number; groupBy?: TimePeriod } = {}
	): UserTrendPoint[] {
		const limit = clamp(
			Math.floor(options.limit && options.limit > 0 ? options.limit : VALIDATION_COUNT.ACTIVITY_ENTRIES.DEFAULT),
			VALIDATION_COUNT.ACTIVITY_ENTRIES.MIN,
			120
		);
		const { groupBy } = options;

		if (!groupBy) {
			return gameHistory.slice(0, limit).map(game => {
				const totalQuestionsAnswered = game.gameQuestionCount ?? 0;
				const successRate = calculateScoreRate(game.score ?? 0, totalQuestionsAnswered);

				return {
					date: game.createdAt ? new Date(game.createdAt).toISOString() : new Date().toISOString(),
					score: game.score ?? 0,
					successRate,
					totalQuestionsAnswered,
					correctAnswers: game.correctAnswers ?? 0,
					topic: game.topic ?? undefined,
					difficulty: game.difficulty ?? undefined,
				};
			});
		}

		const grouped = groupByBy(gameHistory, game => {
			const createdAt = game.createdAt ? new Date(game.createdAt) : new Date();
			return this.getPeriodKey(createdAt, groupBy);
		});

		const buckets = Object.entries(grouped).map(([key, games]) => {
			const firstDate = games[0]?.createdAt ? new Date(games[0].createdAt) : new Date();
			const date = this.normalizeDateToPeriod(firstDate, groupBy);
			const totalScore = sumBy(games, g => g.score ?? 0);
			const totalQuestionsAnswered = sumBy(games, g => g.gameQuestionCount ?? 0);
			const correctAnswers = sumBy(games, g => g.correctAnswers ?? 0);
			const topicCounter: CountRecord = {};
			const difficultyCounter: CountRecord = {};
			for (const game of games) {
				if (game.topic) topicCounter[game.topic] = (topicCounter[game.topic] ?? 0) + 1;
				if (game.difficulty) difficultyCounter[game.difficulty] = (difficultyCounter[game.difficulty] ?? 0) + 1;
			}
			return {
				key,
				date,
				totalScore,
				totalQuestionsAnswered,
				correctAnswers,
				count: games.length,
				topicCounter,
				difficultyCounter,
			};
		});

		return buckets
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.slice(0, limit)
			.map(bucket => {
				const successRate = calculateScoreRate(bucket.totalScore, bucket.totalQuestionsAnswered);
				return {
					date: bucket.date.toISOString(),
					score: bucket.count > 0 ? bucket.totalScore / bucket.count : 0,
					successRate,
					totalQuestionsAnswered: bucket.totalQuestionsAnswered,
					correctAnswers: bucket.correctAnswers,
					topic: this.getTopKey(bucket.topicCounter),
					difficulty: this.getTopKey(bucket.difficultyCounter),
				};
			});
	}
}
