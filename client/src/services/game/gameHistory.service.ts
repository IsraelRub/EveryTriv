/**
 * Game History service for EveryTriv client
 * Handles game history, leaderboard, and game statistics
 *
 * @module ClientGameHistoryService
 * @description Client-side game history and leaderboard management
 * @used_by client/views/game-history, client/components/stats, client/hooks
 */
import {
	GameHistoryEntry,
	GameHistoryRequest,
	LeaderboardEntry,
	UserRankData,
	UserStatsData,
} from 'everytriv-shared/types';

import { apiService } from '../api';
import { loggerService } from '../utils';

/**
 * Main game history service class
 * @class ClientGameHistoryService
 * @description Handles all game history operations for the client
 * @used_by client/views/game-history, client/components/stats
 */
class ClientGameHistoryService {
	/**
	 * Save completed game result to history
	 * @param {GameHistoryRequest} gameData - Complete game session data
	 * @returns {Promise<GameHistoryEntry>} Created game history entry
	 * @throws {Error} When saving fails
	 */
	async saveGameResult(gameData: GameHistoryRequest): Promise<GameHistoryEntry> {
		try {
			loggerService.gameStatistics('Saving game result to history', {
				score: gameData.score,
				totalQuestions: gameData.totalQuestions,
				correctAnswers: gameData.correctAnswers,
			});

			const gameHistoryDto = {
				...gameData,
				topic: gameData.topic || 'General Knowledge',
				timeSpent: gameData.timeSpent || 0,
			};
			const gameHistory = (await apiService.saveGameHistory(gameHistoryDto)) as unknown as GameHistoryEntry;

			loggerService.gameStatistics('Game result saved successfully', { gameId: gameHistory.id });
			return gameHistory;
		} catch (error) {
			loggerService.gameError('Failed to save game result', { error, gameData });
			throw error;
		}
	}

	/**
	 * Get user game history
	 */
	async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
		try {
			loggerService.gameStatistics('Getting user game history', { limit, offset });

			const gameHistory = (await apiService.getUserGameHistory(limit, offset)) as GameHistoryEntry[];

			loggerService.gameStatistics('User game history retrieved successfully', {
				count: gameHistory.length,
			});
			return gameHistory;
		} catch (error) {
			loggerService.gameError('Failed to get user game history', { error, limit, offset });
			throw error;
		}
	}

	/**
	 * Get global leaderboard
	 */
	async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
		try {
			loggerService.gameStatistics('Getting leaderboard', { limit });

			const leaderboard = await apiService.getLeaderboardEntries(limit);

			loggerService.gameStatistics('Leaderboard retrieved successfully', {
				entries: leaderboard.length,
			});
			return leaderboard;
		} catch (error) {
			loggerService.gameError('Failed to get leaderboard', { error, limit });
			throw error;
		}
	}

	/**
	 * Get user rank
	 */
	async getUserRank(): Promise<UserRankData | null> {
		try {
			loggerService.gameStatistics('Getting user rank');

			const userRank = (await apiService.getUserRank()) as UserRankData | null;

			loggerService.gameStatistics('User rank retrieved successfully', { rank: userRank?.rank });
			return userRank;
		} catch (error) {
			loggerService.gameError('Failed to get user rank', { error });
			throw error;
		}
	}

	/**
	 * Get user statistics
	 */
	async getUserStats(): Promise<UserStatsData> {
		try {
			loggerService.gameStatistics('Getting user statistics');

			const userStats = (await apiService.getUserStats()) as unknown as UserStatsData;

			loggerService.gameStatistics('User statistics retrieved successfully');
			return userStats;
		} catch (error) {
			loggerService.gameError('Failed to get user statistics', { error });
			throw error;
		}
	}

	/**
	 * Get specific game by ID
	 */
	async getGameById(gameId: string): Promise<GameHistoryEntry> {
		try {
			loggerService.gameStatistics('Getting game by ID', { gameId });

			const response = await apiService.get<GameHistoryEntry>(`/game-history/${gameId}`);

			loggerService.gameStatistics('Game retrieved successfully', {
				gameId,
			});
			return response.data;
		} catch (error) {
			loggerService.gameError('Failed to get game by ID', { error, gameId });
			throw error;
		}
	}
}

export const gameHistoryService = new ClientGameHistoryService();
