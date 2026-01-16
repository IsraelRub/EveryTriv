import { DEFAULT_GAME_CONFIG, DifficultyLevel, GameMode } from '../../constants';
import type { GameData, SavedGameConfiguration, UserGamePreferences } from '../../types';

export function normalizeGameData(gameData: Partial<GameData>, defaults: Partial<GameData> = {}): GameData {
	const userId = gameData.userId ?? defaults.userId;
	if (!userId) {
		throw new Error('userId is required in GameData');
	}
	return {
		userId,
		score: gameData.score ?? 0,
		gameQuestionCount: gameData.gameQuestionCount ?? 0,
		correctAnswers: gameData.correctAnswers ?? 0,
		difficulty: gameData.difficulty ?? defaults.difficulty ?? DifficultyLevel.MEDIUM,
		topic: gameData.topic ?? defaults.topic ?? 'General',
		gameMode: gameData.gameMode ?? defaults.gameMode ?? GameMode.QUESTION_LIMITED,
		timeSpent: gameData.timeSpent ?? 0,
		creditsUsed: gameData.creditsUsed ?? 0,
		questionsData: gameData.questionsData ?? [],
	};
}

export function toSavedGameConfiguration(
	gamePrefs: UserGamePreferences,
	soundEnabled: boolean
): SavedGameConfiguration {
	return {
		defaultDifficulty: gamePrefs.defaultDifficulty,
		defaultTopic: gamePrefs.defaultTopic ?? DEFAULT_GAME_CONFIG.defaultTopic,
		questionsPerRequest: gamePrefs.maxQuestionsPerGame ?? DEFAULT_GAME_CONFIG.maxQuestionsPerGame,
		timeLimit: gamePrefs.timeLimit ?? DEFAULT_GAME_CONFIG.timeLimit,
		soundEnabled,
	};
}
