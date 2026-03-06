import { DIFFICULTY_CONFIG, DifficultyLevel, TIME_PERIODS_MS } from '@shared/constants';

export function calculateAnswerScore(
	difficulty: string,
	timeSpentMs: number,
	streak: number,
	isCorrect: boolean
): number {
	if (!isCorrect) return 0;

	const baseScore =
		DIFFICULTY_CONFIG[difficulty.toLowerCase()]?.baseScore ?? DIFFICULTY_CONFIG[DifficultyLevel.EASY]?.baseScore ?? 10;

	const timeInSeconds = timeSpentMs / TIME_PERIODS_MS.SECOND;
	const timeBonus = Math.max(0, 10 - Math.floor(timeInSeconds));

	const streakBonus = Math.min(streak * 2, 20);

	return baseScore + timeBonus + streakBonus;
}
