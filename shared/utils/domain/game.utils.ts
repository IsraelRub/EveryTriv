/**
 * Game Utilities
 *
 * @module GameUtils
 * @description Utility functions for game data normalization and transformation
 * @used_by client/src/services/domain, server/src/features/game
 */
import { DifficultyLevel, GameMode } from '../../constants';
import type { GameData, GameDifficulty } from '../../types';

/**
 * Normalize GameData with default values
 * @param gameData Partial game data to normalize
 * @param defaults Default values for missing fields
 * @returns Complete normalized GameData
 */
export function normalizeGameData(gameData: Partial<GameData>, defaults: Partial<GameData> = {}): GameData {
	return {
		userId: gameData.userId ?? defaults.userId,
		score: gameData.score ?? 0,
		gameQuestionCount: gameData.gameQuestionCount ?? 0,
		correctAnswers: gameData.correctAnswers ?? 0,
		difficulty: gameData.difficulty ?? defaults.difficulty ?? (DifficultyLevel.MEDIUM as GameDifficulty),
		topic: gameData.topic ?? defaults.topic ?? 'General',
		gameMode: gameData.gameMode ?? defaults.gameMode ?? GameMode.QUESTION_LIMITED,
		timeSpent: gameData.timeSpent ?? 0,
		creditsUsed: gameData.creditsUsed ?? 0,
		questionsData: gameData.questionsData ?? [],
	};
}
