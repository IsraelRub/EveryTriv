/**
 * Game History service for EveryTriv client
 * Handles game history, leaderboard, and game statistics
 *
 * @module ClientGameHistoryService
 * @description Client-side game history and leaderboard management
 * @used_by client/views/game-history, client/components/stats, client/hooks
 */
import { GAME_STATE_DEFAULTS, VALID_GAME_MODES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { GameData, GameHistoryEntry, LeaderboardEntry, UserRankData, UserStatsData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { isValidDifficulty, toDifficultyLevel } from '@shared/validation';

import { apiService } from './api.service';

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
				totalQuestions: gameData.totalQuestions,
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

			const createGameHistoryDto: GameData = {
				userId,
				score: gameData.score,
				totalQuestions: gameData.totalQuestions,
				correctAnswers: gameData.correctAnswers,
				difficulty: gameData.difficulty,
				topic: gameData.topic || GAME_STATE_DEFAULTS.TOPIC,
				gameMode: gameData.gameMode,
				timeSpent: gameData.timeSpent ?? 0,
				creditsUsed: gameData.creditsUsed ?? 0,
				questionsData: gameData.questionsData || [],
			};
			await apiService.saveGameHistory(createGameHistoryDto);

			// Create a GameHistoryEntry since saveGameHistory returns void
			const gameHistory: GameHistoryEntry = {
				id: `game_${Date.now()}`,
				createdAt: new Date(),
				updatedAt: new Date(),
				topic: gameData.topic || GAME_STATE_DEFAULTS.TOPIC,
				difficulty: toDifficultyLevel(gameData.difficulty),
				gameMode: gameData.gameMode,
				score: gameData.score,
				totalQuestions: gameData.totalQuestions,
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
	 */
	async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
		try {
			logger.gameStatistics('Getting user game history', { limit, offset });

			const gameHistory = await apiService.getUserGameHistory(limit, offset);

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
	 * Get global leaderboard
	 */
	async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
		try {
			logger.gameStatistics('Getting leaderboard', { limit });

			const leaderboard = await apiService.getLeaderboardEntries(limit);

			logger.gameStatistics('Leaderboard retrieved successfully', {
				entries: leaderboard.length,
			});
			return leaderboard;
		} catch (error) {
			logger.gameError('Failed to get leaderboard', { error: getErrorMessage(error), limit });
			throw error;
		}
	}

	/**
	 * Get user rank
	 */
	async getUserRank(): Promise<UserRankData> {
		try {
			logger.gameStatistics('Getting user rank');

			const userRank = await apiService.getUserRank();

			logger.gameStatistics('User rank retrieved successfully', { rank: userRank.rank });
			return userRank;
		} catch (error) {
			logger.gameError('Failed to get user rank', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get user statistics
	 */
	async getUserStats(): Promise<UserStatsData> {
		try {
			logger.gameStatistics('Getting user statistics');

			const userStats = await apiService.getUserStats();

			// UserStats is already UserStatsData format, no conversion needed
			logger.gameStatistics('User statistics retrieved successfully');
			return userStats;
		} catch (error) {
			logger.gameError('Failed to get user statistics', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get specific game by ID
	 */
	async getGameById(gameId: string): Promise<GameHistoryEntry> {
		try {
			logger.gameStatistics('Getting game by ID', { id: gameId });

			const game = await apiService.getGameById(gameId);

			logger.gameStatistics('Game retrieved successfully', {
				id: gameId,
			});
			return game;
		} catch (error) {
			logger.gameError('Failed to get game by ID', { error: getErrorMessage(error), id: gameId });
			throw error;
		}
	}

	/**
	 * Delete specific game history entry
	 */
	async deleteGameHistory(gameId: string): Promise<{ success: boolean; message: string }> {
		try {
			logger.gameStatistics('Deleting game history', { id: gameId });

			const response = await apiService.deleteGameHistory(gameId);

			logger.gameStatistics('Game history deleted successfully', { id: gameId });
			return response;
		} catch (error) {
			logger.gameError('Failed to delete game history', {
				error: getErrorMessage(error),
				id: gameId,
			});
			throw error;
		}
	}

	/**
	 * Clear all user game history
	 */
	async clearGameHistory(): Promise<{ deletedCount: number }> {
		try {
			logger.gameStatistics('Clearing all game history');

			const response = await apiService.clearGameHistory();

			logger.gameStatistics('All game history cleared successfully', {
				deletedCount: response.deletedCount,
			});
			return response;
		} catch (error) {
			logger.gameError('Failed to clear game history', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

export const gameHistoryService = new ClientGameHistoryService();
