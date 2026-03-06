import type { AchievementCalculationContext, SavedAchievement } from '@shared/types';

import { ACHIEVEMENT_DISPLAY } from '@/constants';
import type { Achievement, AchievementDisplayDefinition } from '@/types';

const ACHIEVEMENT_DISPLAY_DEFINITIONS: Record<string, AchievementDisplayDefinition> = {
	'ach-first-game': {
		name: 'First Game',
		description: 'Played your first trivia game',
		buildDescription: ctx =>
			`Played your first trivia game${ctx.totalGames > 1 ? ` (${ctx.totalGames} total games)` : ''}`,
	},
	'ach-ten-games': {
		name: 'Ten Games',
		description: 'Played 10 trivia games',
		buildDescription: ctx => `Played ${ctx.totalGames} trivia games`,
	},
	'ach-twenty-five-games': {
		name: 'Dedicated Player',
		description: 'Played 25 trivia games',
		buildDescription: ctx => `Played ${ctx.totalGames} trivia games`,
	},
	'ach-fifty-games': {
		name: 'Fifty Games',
		description: 'Played 50 trivia games',
		buildDescription: ctx => `Played ${ctx.totalGames} trivia games`,
	},
	'ach-hundred-games': {
		name: 'Century Club',
		description: 'Played 100 trivia games',
		buildDescription: ctx => `Played ${ctx.totalGames} trivia games`,
	},
	'ach-hundred-answers': {
		name: 'Hundred Answers',
		description: 'Answered 100 questions',
		buildDescription: ctx => `Answered ${ctx.totalQuestionsAnswered} questions`,
	},
	'ach-five-hundred-answers': {
		name: 'Five Hundred Answers',
		description: 'Answered 500 questions',
		buildDescription: ctx => `Answered ${ctx.totalQuestionsAnswered} questions`,
	},
	'ach-thousand-answers': {
		name: 'Thousand Answers',
		description: 'Answered 1000 questions',
		buildDescription: ctx => `Answered ${ctx.totalQuestionsAnswered} questions`,
	},
	'ach-week-warrior': {
		name: 'Week Warrior',
		description: 'Maintained a 7-day streak',
		buildDescription: ctx => `Maintained a ${ctx.streakDays}-day streak`,
	},
	'ach-streak-hero': {
		name: 'Streak Hero',
		description: 'Best streak of 5 consecutive days',
		buildDescription: ctx => `Best streak of ${ctx.bestStreak} consecutive days`,
	},
	'ach-high-scorer': {
		name: 'High Scorer',
		description: 'Achieved a high score',
		buildName: ctx => {
			if (ctx.bestScore >= 2000) return 'Exceptional Scorer';
			if (ctx.bestScore >= 1500) return 'Outstanding Scorer';
			if (ctx.bestScore >= 1000) return 'High Scorer';
			return 'Good Scorer';
		},
		buildDescription: ctx => `Achieved a score of ${Math.round(ctx.bestScore)}`,
	},
	'ach-expert': {
		name: 'Expert',
		description: 'Maintained high success rate',
		buildName: ctx => {
			if (ctx.successRate >= 90) return 'Master';
			if (ctx.successRate >= 80) return 'Expert';
			if (ctx.successRate >= 70) return 'Advanced';
			if (ctx.successRate >= 60) return 'Skilled';
			return 'Competent';
		},
		buildDescription: ctx =>
			`Maintained ${ctx.successRate.toFixed(1)}% success rate in ${ctx.totalQuestionsAnswered} questions`,
	},
	'ach-topic-specialist': {
		name: 'Topic Specialist',
		description: 'Played 5+ games in a specific topic',
		buildDescription: ctx => {
			const topTopic = Object.entries(ctx.topicsPlayed ?? {}).sort((a, b) => b[1] - a[1])[0];
			if (!topTopic) return 'Played games in a specific topic';
			return `Played ${topTopic[1]} games in the topic "${topTopic[0]}"`;
		},
	},
};

/**
 * Builds full Achievement[] for display from API minimal list + context.
 * Server sends only SavedAchievement[]; name, description, category come from client definitions; Icon from ACHIEVEMENT_DISPLAY.
 */
export function buildDisplayAchievements(
	minimal: SavedAchievement[],
	context: AchievementCalculationContext
): Achievement[] {
	const result: Achievement[] = [];

	for (const saved of minimal) {
		const meta = ACHIEVEMENT_DISPLAY[saved.id];
		const def = ACHIEVEMENT_DISPLAY_DEFINITIONS[saved.id];
		if (!meta || !def) continue;

		const name = def.buildName ? def.buildName(context) : def.name;
		const description = def.buildDescription ? def.buildDescription(context) : def.description;

		result.push({
			id: saved.id,
			name,
			description,
			category: meta.category,
			points: saved.points,
			unlockedAt: saved.unlockedAt,
			progress: saved.progress,
			maxProgress: saved.maxProgress,
		});
	}

	return result;
}

/**
 * Builds AchievementCalculationContext from analytics statistics and performance.
 * Use when building display achievements from unified analytics response.
 */
export function buildAchievementContext(
	statistics:
		| {
				totalGames: number;
				bestScore: number;
				successRate: number;
				totalQuestionsAnswered: number;
				topicsPlayed?: Record<string, number>;
		  }
		| null
		| undefined,
	performance: { streakDays: number; bestStreak: number } | null | undefined
): AchievementCalculationContext {
	return {
		totalGames: statistics?.totalGames ?? 0,
		bestScore: statistics?.bestScore ?? 0,
		successRate: statistics?.successRate ?? 0,
		totalQuestionsAnswered: statistics?.totalQuestionsAnswered ?? 0,
		streakDays: performance?.streakDays ?? 0,
		bestStreak: performance?.bestStreak ?? 0,
		topicsPlayed: statistics?.topicsPlayed ?? {},
	};
}
