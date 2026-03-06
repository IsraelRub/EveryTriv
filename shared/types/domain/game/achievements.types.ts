export interface SavedAchievement {
	id: string;
	unlockedAt?: string;
	points: number;
	progress?: number;
	maxProgress?: number;
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
