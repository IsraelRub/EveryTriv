import type { CategoryStatistics, CountRecord } from '@shared/types';
import { calculateSuccessRate, groupBy } from '@shared/utils';

import type { GameHistoryEntity } from '@internal/entities';
import type { StreakData } from '@internal/types';

export function calculateStreak(gameHistory: GameHistoryEntity[]): StreakData {
	if (gameHistory.length === 0) {
		return { current: 0, best: 0 };
	}

	const sortedHistory = [...gameHistory].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	let currentStreak = 0;
	let bestStreak = 0;
	let tempStreak = 0;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Check current streak
	for (let i = 0; i < sortedHistory.length; i++) {
		const game = sortedHistory[i];
		if (game == null) {
			break;
		}
		const gameDate = new Date(game.createdAt);
		gameDate.setHours(0, 0, 0, 0);

		const expectedDate = new Date(today);
		expectedDate.setDate(expectedDate.getDate() - i);

		if (gameDate.getTime() === expectedDate.getTime()) {
			currentStreak++;
		} else {
			break;
		}
	}

	// Calculate best streak
	const gameDates = sortedHistory.map(game => new Date(game.createdAt).toDateString());
	const uniqueDates = [...new Set(gameDates)].sort();

	for (let i = 0; i < uniqueDates.length; i++) {
		if (i === 0) {
			tempStreak = 1;
		} else {
			const currentDateStr = uniqueDates[i];
			const previousDateStr = uniqueDates[i - 1];
			if (currentDateStr == null || previousDateStr == null) {
				continue;
			}
			const currentDate = new Date(currentDateStr);
			const previousDate = new Date(previousDateStr);
			const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

			if (daysDiff === 1) {
				tempStreak++;
			} else {
				bestStreak = Math.max(bestStreak, tempStreak);
				tempStreak = 1;
			}
		}
	}

	bestStreak = Math.max(bestStreak, tempStreak);

	return { current: currentStreak, best: bestStreak };
}

function calculateCategoryMetrics(games: GameHistoryEntity[]): {
	totalQuestionsAnswered: number;
	correctAnswers: number;
} {
	return {
		totalQuestionsAnswered: games.reduce((sum, game) => sum + (game.gameQuestionCount ?? 0), 0),
		correctAnswers: games.reduce((sum, game) => sum + (game.correctAnswers ?? 0), 0),
	};
}

export function calculateCategoryStats(
	gameHistory: GameHistoryEntity[],
	category: 'topic' | 'difficulty'
): Record<string, CategoryStatistics> {
	const groupedByCategory = groupBy(gameHistory, category);
	const categoryStats: Record<string, CategoryStatistics> = {};

	Object.entries(groupedByCategory).forEach(([categoryKey, games]) => {
		const { totalQuestionsAnswered, correctAnswers } = calculateCategoryMetrics(games);
		const score = games.reduce((sum, game) => sum + game.score, 0);
		let lastPlayed = new Date(0);
		let maxTimestamp = 0;
		for (const game of games) {
			const gameTimestamp = new Date(game.createdAt).getTime();
			if (gameTimestamp > maxTimestamp) {
				maxTimestamp = gameTimestamp;
				lastPlayed = new Date(game.createdAt);
			}
		}

		categoryStats[categoryKey] = {
			totalQuestionsAnswered,
			correctAnswers,
			score,
			successRate: calculateSuccessRate(totalQuestionsAnswered, correctAnswers),
			lastPlayed,
		};
	});

	return categoryStats;
}

export function calculateCategoryPerformance(
	gameHistory: GameHistoryEntity[],
	category: 'topic' | 'difficulty'
): CountRecord {
	const groupedByCategory = groupBy(gameHistory, category);
	const performance: CountRecord = {};

	Object.entries(groupedByCategory).forEach(([categoryKey, games]) => {
		const { totalQuestionsAnswered, correctAnswers } = calculateCategoryMetrics(games);
		performance[categoryKey] = calculateSuccessRate(totalQuestionsAnswered, correctAnswers);
	});

	return performance;
}
