import { Injectable } from '@nestjs/common';

import { TimePeriod } from '@shared/constants';
import type { AnalyticsResponse, CountRecord, UserTrendPoint } from '@shared/types';
import { calculateSuccessRate } from '@shared/utils';

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
		const weekNumber = Math.ceil((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
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
		const limit = options.limit && options.limit > 0 ? Math.min(Math.floor(options.limit), 120) : 30;
		const { groupBy } = options;

		if (!groupBy) {
			return gameHistory.slice(0, limit).map(game => {
				const totalQuestionsAnswered = game.gameQuestionCount ?? 0;
				const correctAnswers = game.correctAnswers ?? 0;
				const successRate = calculateSuccessRate(totalQuestionsAnswered, correctAnswers);

				return {
					date: game.createdAt ? new Date(game.createdAt).toISOString() : new Date().toISOString(),
					score: game.score ?? 0,
					successRate,
					totalQuestionsAnswered,
					correctAnswers,
					topic: game.topic ?? undefined,
					difficulty: game.difficulty ?? undefined,
				};
			});
		}

		const buckets = new Map<
			string,
			{
				date: Date;
				totalScore: number;
				totalQuestionsAnswered: number;
				correctAnswers: number;
				count: number;
				topicCounter: CountRecord;
				difficultyCounter: CountRecord;
			}
		>();

		gameHistory.forEach(game => {
			const createdAt = game.createdAt ? new Date(game.createdAt) : new Date();
			const key = this.getPeriodKey(createdAt, groupBy);
			const bucket = buckets.get(key) ?? {
				date: this.normalizeDateToPeriod(createdAt, groupBy),
				totalScore: 0,
				totalQuestionsAnswered: 0,
				correctAnswers: 0,
				count: 0,
				topicCounter: {},
				difficultyCounter: {},
			};

			bucket.totalScore += game.score ?? 0;
			bucket.totalQuestionsAnswered += game.gameQuestionCount ?? 0;
			bucket.correctAnswers += game.correctAnswers ?? 0;
			bucket.count += 1;

			if (game.topic) {
				bucket.topicCounter[game.topic] = (bucket.topicCounter[game.topic] ?? 0) + 1;
			}
			if (game.difficulty) {
				bucket.difficultyCounter[game.difficulty] = (bucket.difficultyCounter[game.difficulty] ?? 0) + 1;
			}

			buckets.set(key, bucket);
		});

		return Array.from(buckets.values())
			.sort((a, b) => b.date.getTime() - a.date.getTime())
			.slice(0, limit)
			.map(bucket => {
				const successRate = calculateSuccessRate(bucket.totalQuestionsAnswered, bucket.correctAnswers);
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
