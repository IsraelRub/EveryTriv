import { AchievementCategory, AchievementIconName } from '@shared/constants';
import type {
	Achievement,
	AchievementCalculationContext,
	AchievementDefinition,
	SavedAchievement,
} from '@shared/types';

export function calculateEngagementPoints(totalGames: number): number {
	if (totalGames >= 100) return 200;
	if (totalGames >= 50) return 150;
	if (totalGames >= 25) return 120;
	if (totalGames >= 10) return 100;
	if (totalGames >= 5) return 75;
	return 50;
}

export function calculateStreakPoints(streakDays: number, bestStreak: number): number {
	if (bestStreak >= 30) return 200;
	if (bestStreak >= 14) return 150;
	if (bestStreak >= 7) return 120;
	if (bestStreak >= 5) return 100;
	if (streakDays >= 7) return 120;
	if (streakDays >= 3) return 75;
	return 50;
}

export function calculatePerformancePoints(
	successRate: number,
	totalQuestionsAnswered: number,
	bestScore: number
): number {
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

export function calculateKnowledgePoints(topicsPlayed: Record<string, number>): number {
	const topTopic = Object.entries(topicsPlayed ?? {}).sort((a, b) => b[1] - a[1])[0];
	if (!topTopic) return 100;
	const topicGames = topTopic[1];
	if (topicGames >= 20) return 150;
	if (topicGames >= 10) return 120;
	return 100;
}

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
	'ach-first-game': {
		id: 'ach-first-game',
		name: 'First Game',
		description: 'Played your first trivia game',
		icon: AchievementIconName.GAMEPAD_ICON,
		category: AchievementCategory.ENGAGEMENT,
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		buildDescription: stats =>
			`Played your first trivia game${stats.totalGames > 1 ? ` (${stats.totalGames} total games)` : ''}`,
		shouldUnlock: stats => stats.totalGames >= 1,
	},
	'ach-ten-games': {
		id: 'ach-ten-games',
		name: 'Ten Games',
		description: 'Played 10 trivia games',
		icon: AchievementIconName.TROPHY,
		category: AchievementCategory.ENGAGEMENT,
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		buildDescription: stats => `Played ${stats.totalGames} trivia games`,
		shouldUnlock: stats => stats.totalGames >= 10,
	},
	'ach-twenty-five-games': {
		id: 'ach-twenty-five-games',
		name: 'Dedicated Player',
		description: 'Played 25 trivia games',
		icon: AchievementIconName.AWARD,
		category: AchievementCategory.ENGAGEMENT,
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		buildDescription: stats => `Played ${stats.totalGames} trivia games`,
		shouldUnlock: stats => stats.totalGames >= 25,
	},
	'ach-fifty-games': {
		id: 'ach-fifty-games',
		name: 'Fifty Games',
		description: 'Played 50 trivia games',
		icon: AchievementIconName.MEDAL,
		category: AchievementCategory.ENGAGEMENT,
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		buildDescription: stats => `Played ${stats.totalGames} trivia games`,
		shouldUnlock: stats => stats.totalGames >= 50,
	},
	'ach-hundred-games': {
		id: 'ach-hundred-games',
		name: 'Century Club',
		description: 'Played 100 trivia games',
		icon: AchievementIconName.CROWN,
		category: AchievementCategory.ENGAGEMENT,
		calculatePoints: stats => calculateEngagementPoints(stats.totalGames),
		buildDescription: stats => `Played ${stats.totalGames} trivia games`,
		shouldUnlock: stats => stats.totalGames >= 100,
	},
	'ach-week-warrior': {
		id: 'ach-week-warrior',
		name: 'Week Warrior',
		description: 'Maintained a 7-day streak',
		icon: AchievementIconName.FLAME,
		category: AchievementCategory.ENGAGEMENT,
		calculatePoints: stats => calculateStreakPoints(stats.streakDays, stats.bestStreak),
		buildDescription: stats => `Maintained a ${stats.streakDays}-day streak`,
		shouldUnlock: stats => stats.streakDays >= 7,
	},
	'ach-streak-hero': {
		id: 'ach-streak-hero',
		name: 'Streak Hero',
		description: 'Best streak of 5 consecutive days',
		icon: AchievementIconName.ZAP,
		category: AchievementCategory.ENGAGEMENT,
		calculatePoints: stats => calculateStreakPoints(stats.streakDays, stats.bestStreak),
		buildDescription: stats => `Best streak of ${stats.bestStreak} consecutive days`,
		shouldUnlock: stats => stats.bestStreak >= 5,
	},
	'ach-high-scorer': {
		id: 'ach-high-scorer',
		name: 'High Scorer',
		description: 'Achieved a high score',
		icon: AchievementIconName.STAR,
		category: AchievementCategory.PERFORMANCE,
		calculatePoints: stats =>
			calculatePerformancePoints(stats.successRate, stats.totalQuestionsAnswered, stats.bestScore),
		buildName: stats => {
			if (stats.bestScore >= 2000) return 'Exceptional Scorer';
			if (stats.bestScore >= 1500) return 'Outstanding Scorer';
			if (stats.bestScore >= 1000) return 'High Scorer';
			return 'Good Scorer';
		},
		buildDescription: stats => `Achieved a score of ${Math.round(stats.bestScore)}`,
		shouldUnlock: stats => stats.bestScore >= 500,
	},
	'ach-expert': {
		id: 'ach-expert',
		name: 'Expert',
		description: 'Maintained high success rate',
		icon: AchievementIconName.GRADUATION_CAP,
		category: AchievementCategory.PERFORMANCE,
		calculatePoints: stats =>
			calculatePerformancePoints(stats.successRate, stats.totalQuestionsAnswered, stats.bestScore),
		buildName: stats => {
			if (stats.successRate >= 90) return 'Master';
			if (stats.successRate >= 80) return 'Expert';
			if (stats.successRate >= 70) return 'Advanced';
			if (stats.successRate >= 60) return 'Skilled';
			return 'Competent';
		},
		buildDescription: stats =>
			`Maintained ${stats.successRate.toFixed(1)}% success rate in ${stats.totalQuestionsAnswered} questions`,
		shouldUnlock: stats => stats.successRate >= 50,
	},
	'ach-accuracy-master': {
		id: 'ach-accuracy-master',
		name: 'Accuracy Master',
		description: 'Success rate of 80% or higher',
		icon: AchievementIconName.TARGET,
		category: AchievementCategory.PERFORMANCE,
		calculatePoints: stats =>
			calculatePerformancePoints(stats.successRate, stats.totalQuestionsAnswered, stats.bestScore),
		buildDescription: stats =>
			`Success rate of ${stats.successRate.toFixed(1)}% in ${stats.totalQuestionsAnswered} questions`,
		shouldUnlock: stats => stats.successRate >= 80 && stats.totalQuestionsAnswered >= 20,
	},
	'ach-topic-specialist': {
		id: 'ach-topic-specialist',
		name: 'Topic Specialist',
		description: 'Played 5+ games in a specific topic',
		icon: AchievementIconName.BOOK_OPEN,
		category: AchievementCategory.KNOWLEDGE,
		calculatePoints: stats => calculateKnowledgePoints(stats.topicsPlayed),
		buildDescription: stats => {
			const topTopic = Object.entries(stats.topicsPlayed ?? {}).sort((a, b) => b[1] - a[1])[0];
			if (!topTopic) return 'Played games in a specific topic';
			return `Played ${topTopic[1]} games in the topic "${topTopic[0]}"`;
		},
		shouldUnlock: stats => {
			const topTopic = Object.entries(stats.topicsPlayed ?? {}).sort((a, b) => b[1] - a[1])[0];
			return topTopic ? topTopic[1] >= 5 : false;
		},
	},
} as const;

export function buildAchievementFromSaved(
	saved: SavedAchievement,
	context: AchievementCalculationContext
): Achievement | null {
	const definition = getAchievementDefinition(saved.id);
	if (!definition) {
		return null;
	}

	const name = definition.buildName ? definition.buildName(context) : definition.name;
	const description = definition.buildDescription ? definition.buildDescription(context) : definition.description;

	return {
		id: saved.id,
		name,
		description,
		icon: definition.icon,
		category: definition.category,
		unlockedAt: saved.unlockedAt,
		points: saved.points, // Use saved points (snapshot)
		progress: saved.progress,
		maxProgress: saved.maxProgress,
	};
}

export function buildAchievementFromDefinition(
	definition: AchievementDefinition,
	context: AchievementCalculationContext,
	unlockedAt?: string
): Achievement {
	const name = definition.buildName ? definition.buildName(context) : definition.name;
	const description = definition.buildDescription ? definition.buildDescription(context) : definition.description;
	const points = definition.calculatePoints(context);

	return {
		id: definition.id,
		name,
		description,
		icon: definition.icon,
		category: definition.category,
		unlockedAt,
		points,
	};
}

export function convertToSavedAchievement(achievement: Achievement): SavedAchievement {
	return {
		id: achievement.id,
		unlockedAt: achievement.unlockedAt,
		points: achievement.points,
		progress: achievement.progress,
		maxProgress: achievement.maxProgress,
	};
}

export function buildAllAchievements(context: AchievementCalculationContext): Achievement[] {
	const achievements: Achievement[] = [];

	for (const definition of Object.values(ACHIEVEMENT_DEFINITIONS)) {
		if (definition.shouldUnlock(context)) {
			achievements.push(buildAchievementFromDefinition(definition, context));
		}
	}

	return achievements;
}

export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
	return ACHIEVEMENT_DEFINITIONS[id];
}

export function getAllAchievementDefinitions(): AchievementDefinition[] {
	return Object.values(ACHIEVEMENT_DEFINITIONS);
}
