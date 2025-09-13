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
} from '@shared';
import { clientLogger } from '@shared';

import { apiService } from '../api';

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
      clientLogger.gameStatistics('Saving game result to history', {
        score: gameData.score,
        totalQuestions: gameData.totalQuestions,
        correctAnswers: gameData.correctAnswers,
      });

      const gameHistoryDto = {
        ...gameData,
        topic: gameData.topic || 'General Knowledge',
        timeSpent: gameData.timeSpent || 0,
        creditsUsed: gameData.creditsUsed || 0,
        questionsData: gameData.questionsData || [],
      };
      await apiService.saveGameHistory(gameHistoryDto);

      // Create a GameHistoryEntry since saveGameHistory returns void
      const gameHistory: GameHistoryEntry = {
        id: `game_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        topic: gameData.topic || 'General Knowledge',
        difficulty: gameData.difficulty,
        gameMode: gameData.gameMode,
        userId: gameData.userId,
        score: gameData.score,
        totalQuestions: gameData.totalQuestions,
        correctAnswers: gameData.correctAnswers,
        timeSpent: gameData.timeSpent || 0,
        creditsUsed: gameData.creditsUsed || 0,
        questionsData: (gameData.questionsData || []).map(q => ({
          question: q.question,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          timeSpent: q.timeSpent,
        })),
      };

      clientLogger.gameStatistics('Game result saved successfully', { gameId: gameHistory.id });
      return gameHistory;
    } catch (error) {
      clientLogger.gameError('Failed to save game result', { error, gameData });
      throw error;
    }
  }

  /**
   * Get user game history
   */
  async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
    try {
      clientLogger.gameStatistics('Getting user game history', { limit, offset });

      const gameHistory = (await apiService.getUserGameHistory(
        limit,
        offset
      )) as GameHistoryEntry[];

      clientLogger.gameStatistics('User game history retrieved successfully', {
        count: gameHistory.length,
      });
      return gameHistory;
    } catch (error) {
      clientLogger.gameError('Failed to get user game history', { error, limit, offset });
      throw error;
    }
  }

  /**
   * Get global leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      clientLogger.gameStatistics('Getting leaderboard', { limit });

      const leaderboard = await apiService.getLeaderboardEntries(limit);

      clientLogger.gameStatistics('Leaderboard retrieved successfully', {
        entries: leaderboard.length,
      });
      return leaderboard;
    } catch (error) {
      clientLogger.gameError('Failed to get leaderboard', { error, limit });
      throw error;
    }
  }

  /**
   * Get user rank
   */
  async getUserRank(): Promise<UserRankData | null> {
    try {
      clientLogger.gameStatistics('Getting user rank');

      const userRank = (await apiService.getUserRank()) as UserRankData | null;

      clientLogger.gameStatistics('User rank retrieved successfully', { rank: userRank?.rank });
      return userRank;
    } catch (error) {
      clientLogger.gameError('Failed to get user rank', { error });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStatsData> {
    try {
      clientLogger.gameStatistics('Getting user statistics');

      const userStats = await apiService.getUserStats();

      // UserStats is already UserStatsData format, no conversion needed
      clientLogger.gameStatistics('User statistics retrieved successfully');
      return userStats;
    } catch (error) {
      clientLogger.gameError('Failed to get user statistics', { error });
      throw error;
    }
  }

  /**
   * Get specific game by ID
   */
  async getGameById(gameId: string): Promise<GameHistoryEntry> {
    try {
      clientLogger.gameStatistics('Getting game by ID', { gameId });

      const response = await apiService.get<GameHistoryEntry>(`/game-history/${gameId}`);

      clientLogger.gameStatistics('Game retrieved successfully', {
        gameId,
      });
      return response.data;
    } catch (error) {
      clientLogger.gameError('Failed to get game by ID', { error, gameId });
      throw error;
    }
  }
}

export const gameHistoryService = new ClientGameHistoryService();
