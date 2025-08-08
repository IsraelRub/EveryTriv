import axios from 'axios';
import { GameHistoryEntry, LeaderboardEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CreateGameHistoryData {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  difficulty: string;
  topic?: string;
  gameMode: 'time-limited' | 'question-limited' | 'unlimited';
  timeSpent?: number;
  creditsUsed: number;
  questionsData: Array<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent?: number;
  }>;
}

class GameHistoryService {
  private static instance: GameHistoryService;

  public static getInstance(): GameHistoryService {
    if (!GameHistoryService.instance) {
      GameHistoryService.instance = new GameHistoryService();
    }
    return GameHistoryService.instance;
  }

  async createGameHistory(gameData: CreateGameHistoryData): Promise<GameHistoryEntry> {
    const response = await axios.post(`${API_BASE_URL}/game-history`, gameData);
    return response.data;
  }

  async getUserGameHistory(limit: number = 20, offset: number = 0): Promise<GameHistoryEntry[]> {
    const response = await axios.get(`${API_BASE_URL}/game-history/user`, {
      params: { limit, offset }
    });
    return response.data;
  }

  async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const response = await axios.get(`${API_BASE_URL}/game-history/leaderboard`, {
      params: { limit }
    });
    return response.data.map((entry: any, index: number) => ({
      ...entry,
      rank: index + 1
    }));
  }

  async getUserRank(): Promise<{ rank: number; totalScore: number } | null> {
    const response = await axios.get(`${API_BASE_URL}/game-history/user/rank`);
    return response.data;
  }

  async getUserStats(): Promise<{
    totalGames: number;
    totalScore: number;
    averageScore: number;
    topicStats: Record<string, { games: number; averageScore: number }>;
    difficultyStats: Record<string, { games: number; averageScore: number }>;
  }> {
    const response = await axios.get(`${API_BASE_URL}/game-history/user/stats`);
    return response.data;
  }

  async getGameById(gameId: string): Promise<GameHistoryEntry> {
    const response = await axios.get(`${API_BASE_URL}/game-history/${gameId}`);
    return response.data;
  }
}

export const gameHistoryService = GameHistoryService.getInstance();
