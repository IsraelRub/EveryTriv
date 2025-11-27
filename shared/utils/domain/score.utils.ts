/**
 * Score Utilities (pure functions, browser-safe)
 *
 * @module ScoreUtils
 * @description A set of pure utility functions for score calculations that can be safely used
 * @used_by both client (browser) and server (Node). No NestJS or platform-specific deps.
 */

/**
 * Calculate score for a correct answer
 * @param difficulty Difficulty level (string - for client use)
 * @param timeSpentMs Time spent in milliseconds
 * @param streak Current streak
 * @param isCorrect Whether answer was correct
 * @returns Calculated score
 * @description Client-side version that accepts string difficulty.
 * Server should use ScoreCalculationService.calculateAnswerScore() with DifficultyLevel enum.
 */
export function calculateAnswerScore(
	difficulty: string,
	timeSpentMs: number,
	streak: number,
	isCorrect: boolean
): number {
	if (!isCorrect) return 0;

	const baseScoreByDifficulty: Record<string, number> = {
		easy: 10,
		medium: 20,
		hard: 30,
	};

	const baseScore = baseScoreByDifficulty[difficulty.toLowerCase()] ?? 10;

	const timeInSeconds = timeSpentMs / 1000;
	const timeBonus = Math.max(0, 10 - Math.floor(timeInSeconds));

	const streakBonus = Math.min(streak * 2, 20);

	return baseScore + timeBonus + streakBonus;
}
