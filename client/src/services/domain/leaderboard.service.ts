/**
 * Leaderboard service for EveryTriv client
 * Handles leaderboard, rankings, and competitive features
 *
 * @module ClientLeaderboardService
 * @description Client-side leaderboard and ranking management
 * @used_by client/src/hooks/useLeaderboardFeatures.ts, client/src/views/statistics, client/src/components
 */
import { API_ROUTES, LeaderboardPeriod } from '@shared/constants';
import type {
	ClearOperationResponse,
	LeaderboardEntry,
	LeaderboardResponse,
	LeaderboardStats,
	OffsetPagination,
	UserRankData,
} from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';

/**
 * Main leaderboard service class
 * @class ClientLeaderboardService
 * @description Handles all leaderboard-related operations for the client
 * @used_by client/src/hooks/useLeaderboardFeatures.ts, client/src/views
 */
class ClientLeaderboardService {
	/**
	 * Get global leaderboard
	 * @param limit Maximum number of entries to return (default: 100)
	 * @param offset Pagination offset (default: 0)
	 * @returns List of leaderboard entries
	 * @throws {Error} When retrieval fails
	 */
	async getGlobalLeaderboard(limit: number = 100, offset: number = 0): Promise<LeaderboardEntry[]> {
		try {
			logger.gameStatistics('Getting global leaderboard', { limit, offset });

			const query = new URLSearchParams();
			if (limit != null) query.append('limit', String(limit));
			if (offset != null) query.append('offset', String(offset));
			const queryString = query.toString() ? `?${query.toString()}` : '';

			const response = await apiService.get<LeaderboardResponse>(`${API_ROUTES.LEADERBOARD.GLOBAL}${queryString}`);

			const leaderboard = response.data.leaderboard;

			logger.gameStatistics('Global leaderboard retrieved successfully', {
				entries: leaderboard.length,
			});
			return leaderboard;
		} catch (error) {
			logger.gameError('Failed to get global leaderboard', { error: getErrorMessage(error), limit, offset });
			throw error;
		}
	}

	/**
	 * Get leaderboard by time period
	 * @param period Time period (weekly, monthly, yearly)
	 * @param limit Maximum number of entries to return (default: 100)
	 * @param offset Pagination offset (default: 0)
	 * @returns List of leaderboard entries for the period
	 * @throws {Error} When retrieval fails
	 */
	async getLeaderboardByPeriod(
		period: LeaderboardPeriod,
		limit: number = 100,
		offset: number = 0
	): Promise<LeaderboardEntry[]> {
		try {
			logger.gameStatistics('Getting leaderboard by period', { period, limit, offset });

			const query = new URLSearchParams();
			if (limit != null) query.append('limit', String(limit));
			if (offset != null) query.append('offset', String(offset));
			const queryString = query.toString() ? `?${query.toString()}` : '';

			const response = await apiService.get<{
				period: string;
				leaderboard: LeaderboardEntry[];
				pagination: OffsetPagination;
			}>(`${API_ROUTES.LEADERBOARD.PERIOD.replace(':period', period)}${queryString}`);

			const leaderboard = response.data.leaderboard;

			logger.gameStatistics('Period leaderboard retrieved successfully', {
				period,
				entries: leaderboard.length,
			});
			return leaderboard;
		} catch (error) {
			logger.gameError('Failed to get leaderboard by period', {
				error: getErrorMessage(error),
				period,
				limit,
				offset,
			});
			throw error;
		}
	}

	/**
	 * Get user ranking
	 * @returns User ranking data
	 * @throws {Error} When retrieval fails
	 */
	async getUserRanking(): Promise<UserRankData> {
		try {
			logger.gameStatistics('Getting user ranking');

			const response = await apiService.get<UserRankData>(`${API_ROUTES.LEADERBOARD.USER_RANKING}`);
			const userRank = response.data;

			logger.gameStatistics('User ranking retrieved successfully', { rank: userRank.rank });
			return userRank;
		} catch (error) {
			logger.gameError('Failed to get user ranking', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Update user ranking
	 * @returns Updated ranking data
	 * @throws {Error} When update fails
	 */
	async updateUserRanking(): Promise<UserRankData> {
		try {
			logger.gameStatistics('Updating user ranking');

			const response = await apiService.post<UserRankData>(`${API_ROUTES.LEADERBOARD.USER_UPDATE}`);
			const ranking = response.data;

			logger.gameStatistics('User ranking updated successfully', { rank: ranking.rank });
			return ranking;
		} catch (error) {
			logger.gameError('Failed to update user ranking', { error: getErrorMessage(error) });
			throw error;
		}
	}

	/**
	 * Get leaderboard statistics for a specific period
	 * @param period Time period (weekly, monthly, yearly)
	 * @returns Leaderboard statistics
	 * @throws {Error} When retrieval fails
	 */
	async getLeaderboardStats(period: LeaderboardPeriod = LeaderboardPeriod.WEEKLY): Promise<LeaderboardStats> {
		try {
			logger.gameStatistics('Getting leaderboard stats', { period });

			const query = `?period=${period}`;
			const response = await apiService.get<LeaderboardStats>(`${API_ROUTES.LEADERBOARD.STATS}${query}`);

			logger.gameStatistics('Leaderboard stats retrieved successfully', {
				period,
				activeUsers: response.data.activeUsers,
			});
			return response.data;
		} catch (error) {
			logger.gameError('Failed to get leaderboard stats', { error: getErrorMessage(error), period });
			throw error;
		}
	}

	/**
	 * Clear all leaderboard data (Admin only)
	 * @returns Clear operation result
	 * @throws {Error} When operation fails
	 */
	async clearAllLeaderboard(): Promise<ClearOperationResponse> {
		try {
			logger.gameStatistics('Clearing all leaderboard data');

			const response = await apiService.delete<ClearOperationResponse>(`${API_ROUTES.LEADERBOARD.ADMIN_CLEAR_ALL}`);

			logger.gameStatistics('All leaderboard data cleared successfully', {
				deletedCount: response.data.deletedCount,
			});
			return response.data;
		} catch (error) {
			logger.gameError('Failed to clear all leaderboard data', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

export const leaderboardService = new ClientLeaderboardService();
