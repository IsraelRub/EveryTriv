import { BASE_SCORE_BY_DIFFICULTY } from '@shared/constants';

type DifficultyKey = keyof typeof BASE_SCORE_BY_DIFFICULTY;

function isDifficultyKey(value: string): value is DifficultyKey {
	return value in BASE_SCORE_BY_DIFFICULTY;
}

export function calculateAnswerScore(
	difficulty: string,
	timeSpentMs: number,
	streak: number,
	isCorrect: boolean
): number {
	if (!isCorrect) return 0;

	const difficultyLower = difficulty.toLowerCase();
	const baseScore = isDifficultyKey(difficultyLower)
		? BASE_SCORE_BY_DIFFICULTY[difficultyLower]
		: BASE_SCORE_BY_DIFFICULTY.easy;

	const timeInSeconds = timeSpentMs / 1000;
	const timeBonus = Math.max(0, 10 - Math.floor(timeInSeconds));

	const streakBonus = Math.min(streak * 2, 20);

	return baseScore + timeBonus + streakBonus;
}
