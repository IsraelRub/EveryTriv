import { BASE_SCORE_BY_DIFFICULTY } from '@shared/constants';

export function calculateAnswerScore(
	difficulty: string,
	timeSpentMs: number,
	streak: number,
	isCorrect: boolean
): number {
	if (!isCorrect) return 0;

	const baseScore =
		BASE_SCORE_BY_DIFFICULTY[difficulty.toLowerCase() as keyof typeof BASE_SCORE_BY_DIFFICULTY] ??
		BASE_SCORE_BY_DIFFICULTY.easy;

	const timeInSeconds = timeSpentMs / 1000;
	const timeBonus = Math.max(0, 10 - Math.floor(timeInSeconds));

	const streakBonus = Math.min(streak * 2, 20);

	return baseScore + timeBonus + streakBonus;
}
