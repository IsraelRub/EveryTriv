import type { AchievementDefinition } from '@internal/types';

function calculateEngagementPoints(totalGames: number): number {
	if (totalGames >= 100) return 200;
	if (totalGames >= 50) return 150;
	if (totalGames >= 25) return 120;
	if (totalGames >= 10) return 100;
	if (totalGames >= 5) return 75;
	return 50;
}

function calculateStreakPoints(streakDays: number, bestStreak: number): number {
	if (bestStreak >= 30) return 200;
	if (bestStreak >= 14) return 150;
	if (bestStreak >= 7) return 120;
	if (bestStreak >= 5) return 100;
	if (streakDays >= 7) return 120;
	if (streakDays >= 3) return 75;
	return 50;
}

function calculatePerformancePoints(successRate: number, totalQuestionsAnswered: number, bestScore: number): number {
	let points = 0;
	if (successRate >= 90 && totalQuestionsAnswered >= 50) points += 200;
	else if (successRate >= 80 && totalQuestionsAnswered >= 30) points += 150;
	else if (successRate >= 70 && totalQuestionsAnswered >= 20) points += 120;
	else if (successRate >= 60 && totalQuestionsAnswered >= 10) points += 100;
	else if (successRate >= 50) points += 75;

	if (bestScore >= 2000) points += 150;
	else if (bestScore >= 1500) points += 120;
	else if (bestScore >= 1000) points += 100;
	else if (bestScore >= 500) points += 75;

	return Math.max(points, 50);
}

function calculateKnowledgePoints(topicsPlayed: Record<string, number>): number {
	const topTopic = Object.entries(topicsPlayed ?? {}).sort((a, b) => b[1] - a[1])[0];
	if (!topTopic) return 100;
	const topicGames = topTopic[1];
	if (topicGames >= 20) return 150;
	if (topicGames >= 10) return 120;
	return 100;
}

function calculateVolumePoints(totalQuestionsAnswered: number): number {
	if (totalQuestionsAnswered >= 1000) return 150;
	if (totalQuestionsAnswered >= 500) return 120;
	if (totalQuestionsAnswered >= 100) return 100;
	return 50;
}

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
	'ach-first-game': {
		id: 'ach-first-game',
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		shouldUnlock: stats => stats.totalGames >= 1,
	},
	'ach-ten-games': {
		id: 'ach-ten-games',
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		shouldUnlock: stats => stats.totalGames >= 10,
	},
	'ach-twenty-five-games': {
		id: 'ach-twenty-five-games',
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		shouldUnlock: stats => stats.totalGames >= 25,
	},
	'ach-fifty-games': {
		id: 'ach-fifty-games',
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		shouldUnlock: stats => stats.totalGames >= 50,
	},
	'ach-hundred-games': {
		id: 'ach-hundred-games',
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		shouldUnlock: stats => stats.totalGames >= 100,
	},
	'ach-hundred-answers': {
		id: 'ach-hundred-answers',
		calculatePoints: stats => calculateVolumePoints(stats.totalQuestionsAnswered),
		shouldUnlock: stats => stats.totalQuestionsAnswered >= 100,
	},
	'ach-five-hundred-answers': {
		id: 'ach-five-hundred-answers',
		calculatePoints: stats => calculateVolumePoints(stats.totalQuestionsAnswered),
		shouldUnlock: stats => stats.totalQuestionsAnswered >= 500,
	},
	'ach-thousand-answers': {
		id: 'ach-thousand-answers',
		calculatePoints: stats => calculateVolumePoints(stats.totalQuestionsAnswered),
		shouldUnlock: stats => stats.totalQuestionsAnswered >= 1000,
	},
	'ach-week-warrior': {
		id: 'ach-week-warrior',
		calculatePoints: stats => calculateStreakPoints(stats.streakDays, stats.bestStreak),
		shouldUnlock: stats => stats.streakDays >= 7,
	},
	'ach-streak-hero': {
		id: 'ach-streak-hero',
		calculatePoints: stats => calculateStreakPoints(stats.streakDays, stats.bestStreak),
		shouldUnlock: stats => stats.bestStreak >= 5,
	},
	'ach-high-scorer': {
		id: 'ach-high-scorer',
		calculatePoints: stats =>
			calculatePerformancePoints(stats.successRate, stats.totalQuestionsAnswered, stats.bestScore),
		shouldUnlock: stats => stats.bestScore >= 500,
	},
	'ach-expert': {
		id: 'ach-expert',
		calculatePoints: stats =>
			calculatePerformancePoints(stats.successRate, stats.totalQuestionsAnswered, stats.bestScore),
		shouldUnlock: stats => stats.successRate >= 50,
	},
	'ach-topic-specialist': {
		id: 'ach-topic-specialist',
		calculatePoints: stats => calculateKnowledgePoints(stats.topicsPlayed),
		shouldUnlock: stats => {
			const topTopic = Object.entries(stats.topicsPlayed ?? {}).sort((a, b) => b[1] - a[1])[0];
			return topTopic ? topTopic[1] >= 5 : false;
		},
	},
} as const;
