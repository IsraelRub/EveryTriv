export interface ScoringSystemProps {
	score: number;
	total: number;
	topicsPlayed: Record<string, number>;
	difficultyStats: Record<string, { correct: number; total: number }>;
}
