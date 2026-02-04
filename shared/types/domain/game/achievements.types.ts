import { AchievementCategory, AchievementIconName } from '@shared/constants';

export interface SavedAchievement {
	id: string;
	unlockedAt?: string;
	points: number;
	progress?: number;
	maxProgress?: number;
}

export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: AchievementIconName | string;
	unlockedAt?: string;
	progress?: number;
	maxProgress?: number;
	category: AchievementCategory | string;
	points: number;
}

export interface AchievementDefinition {
	id: string;
	name: string;
	description: string;
	icon: AchievementIconName;
	category: AchievementCategory;
	calculatePoints: (stats: AchievementCalculationContext) => number;
	buildName?: (stats: AchievementCalculationContext) => string;
	buildDescription?: (stats: AchievementCalculationContext) => string;
	shouldUnlock: (stats: AchievementCalculationContext) => boolean;
}

export interface AchievementCalculationContext {
	totalGames: number;
	bestScore: number;
	successRate: number;
	totalQuestionsAnswered: number;
	streakDays: number;
	bestStreak: number;
	topicsPlayed: Record<string, number>;
}
