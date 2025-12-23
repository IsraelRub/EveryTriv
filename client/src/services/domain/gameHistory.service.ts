/**
 * Game History service for EveryTriv client
 * Handles game history, leaderboard, and game statistics
 *
 * @module ClientGameHistoryService
 * @description Client-side game history and leaderboard management
 * @used_by client/views/game-history, client/components/stats, client/hooks
 */
import { API_ROUTES, GAME_STATE_CONFIG, VALID_GAME_MODES } from '@shared/constants';
import type { ClearOperationResponse, GameData, GameHistoryEntry } from '@shared/types';
import { getErrorMessage, normalizeGameData } from '@shared/utils';
import { isValidDifficulty, toDifficultyLevel } from '@shared/validation';

import { apiService, clientLogger as logger } from '@/services';

/**
 * Main game history service class
 * @class ClientGameHistoryService
 * @description Handles all game history operations for the client
 * @used_by client/views/game-history, client/components/stats
 */
class ClientGameHistoryService {
	/**
	 * Save completed game result to history
	 * @param {GameData} gameData - Complete game session data
	 * @returns {Promise<GameHistoryEntry>} Created game history entry
	 * @throws {Error} When saving fails
	 */
	async saveGameResult(gameData: GameData): Promise<GameHistoryEntry> {
		try {
			logger.gameStatistics('Saving game result to history', {
				score: gameData.score,
				gameQuestionCount: gameData.gameQuestionCount,
				correctAnswers: gameData.correctAnswers,
			});

			if (!gameData.userId || gameData.userId.trim() === '') {
				throw new Error('User ID is required to save game history');
			}
			const userId = gameData.userId;

			if (!isValidDifficulty(gameData.difficulty)) {
				throw new Error(`Invalid difficulty level: ${gameData.difficulty}`);
			}
			if (!VALID_GAME_MODES.includes(gameData.gameMode)) {
				throw new Error(`Invalid game mode: ${gameData.gameMode}`);
			}

			const createGameHistoryDto = normalizeGameData(gameData, {
				userId,
				topic: GAME_STATE_CONFIG.defaults.topic,
			});
			await apiService.post<void>(API_ROUTES.GAME.HISTORY, createGameHistoryDto);

			// Create a GameHistoryEntry since saveGameHistory returns void
			const gameHistory: GameHistoryEntry = {
				id: `game_${Date.now()}`,
				createdAt: new Date(),
				updatedAt: new Date(),
				topic: gameData.topic || GAME_STATE_CONFIG.defaults.topic,
				difficulty: toDifficultyLevel(gameData.difficulty),
				gameMode: gameData.gameMode,
				score: gameData.score,
				gameQuestionCount: gameData.gameQuestionCount,
				correctAnswers: gameData.correctAnswers,
				timeSpent: gameData.timeSpent ?? 0,
				creditsUsed: gameData.creditsUsed ?? 0,
				questionsData: gameData.questionsData ?? [],
				userId,
			};

			logger.gameStatistics('Game result saved successfully', { id: gameHistory.id });
			return gameHistory;
		} catch (error) {
			logger.gameError('Failed to save game result', {
				error: getErrorMessage(error),
				gameData,
			});
			throw error;
		}
	}

	/**
	 * Get user game history
	 * @param limit Maximum number of entries to return (default: 20)
	 * @param offset Pagination offset (default: 0)
	 * @returns List of game history entries
	 */
	async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
		try {
			// Validate pagination parameters
			if (limit && (limit < 1 || limit > 1000)) {
				throw new Error('Limit must be between 1 and 1000');
			}
			if (offset && offset < 0) {
				throw new Error('Offset must be non-negative');
			}

			logger.gameStatistics('Getting user game history', { limit, offset });

			const searchParams = new URLSearchParams();
			if (limit != null) searchParams.append('limit', String(limit));
			if (offset != null) searchParams.append('offset', String(offset));
			const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

			const response = await apiService.get<{ games: GameHistoryEntry[] }>(`${API_ROUTES.GAME.HISTORY}${query}`);
			const responseData = response.data;

			// Server returns { userId, email, totalGames, games: [...] }
			// Extract games array from the response object
			let gameHistory: GameHistoryEntry[] = [];
			if (
				responseData &&
				typeof responseData === 'object' &&
				'games' in responseData &&
				Array.isArray(responseData.games)
			) {
				gameHistory = responseData.games;
			} else if (Array.isArray(responseData)) {
				gameHistory = responseData;
			}

			logger.gameStatistics('User game history retrieved successfully', {
				count: gameHistory.length,
			});
			return gameHistory;
		} catch (error) {
			logger.gameError('Failed to get user game history', { error: getErrorMessage(error), limit, offset });
			throw error;
		}
	}

	/**
	 * Delete specific game history entry
	 * @param gameId Game identifier to delete
	 * @returns Deletion result
	 */
	async deleteGameHistory(gameId: string): Promise<string> {
		// Validate game ID
		if (!gameId || gameId.trim().length === 0) {
			throw new Error('Game ID is required');
		}

		try {
			logger.gameStatistics('Deleting game history', { gameId });

			const response = await apiService.delete<string>(API_ROUTES.GAME.HISTORY_BY_ID.replace(':gameId', gameId));

			logger.gameStatistics('Game history deleted successfully', { gameId });
			return response.data;
		} catch (error) {
			logger.gameError('Failed to delete game history', {
				error: getErrorMessage(error),
				gameId,
			});
			throw error;
		}
	}

	/**
	 * Clear all user game history
	 * @returns Clear operation result with deleted count
	 */
	async clearGameHistory(): Promise<ClearOperationResponse> {
		try {
			logger.gameStatistics('Clearing all game history');

			const response = await apiService.delete<ClearOperationResponse>(API_ROUTES.GAME.HISTORY);

			logger.gameStatistics('All game history cleared successfully', {
				deletedCount: response.data.deletedCount,
			});
			return response.data;
		} catch (error) {
			logger.gameError('Failed to clear game history', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

export const gameHistoryService = new ClientGameHistoryService();
