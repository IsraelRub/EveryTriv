import { DEFAULT_GAME_CONFIG, DIFFICULTY_CONFIG, ERROR_MESSAGES, GameMode } from '../../constants';
import type { GameData } from '../../types';

export function getDifficultyBadgeClasses(difficulty: unknown): string {
	const key = String(difficulty ?? '').toLowerCase();
	return DIFFICULTY_CONFIG[key]?.badgeClasses ?? 'bg-muted/20 border-muted text-muted-foreground';
}

export function namesMatch(a: string, b: string): boolean {
	return a.toLowerCase() === b.toLowerCase();
}

export function normalizeGameData(gameData: Partial<GameData>, defaults: Partial<GameData> = {}): GameData {
	const userId = gameData.userId ?? defaults.userId;
	if (!userId) {
		throw new Error(ERROR_MESSAGES.validation.GAME_DATA_USER_ID_REQUIRED);
	}
	const gameQuestionCount = gameData.gameQuestionCount ?? 0;
	const rawCorrect = gameData.correctAnswers ?? 0;
	const correctAnswers = Math.min(gameQuestionCount, Math.max(0, rawCorrect));

	return {
		userId,
		score: gameData.score ?? 0,
		gameQuestionCount,
		correctAnswers,
		difficulty: gameData.difficulty ?? defaults.difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty,
		topic: gameData.topic ?? defaults.topic ?? DEFAULT_GAME_CONFIG.defaultTopic,
		gameMode: gameData.gameMode ?? defaults.gameMode ?? GameMode.QUESTION_LIMITED,
		timeSpent: gameData.timeSpent ?? 0,
		creditsUsed: gameData.creditsUsed ?? 0,
		answerHistory: gameData.answerHistory ?? [],
		...(gameData.clientMutationId != null && { clientMutationId: gameData.clientMutationId }),
	};
}
