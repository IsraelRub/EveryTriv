/**
 * User-related types for EveryTriv
 * Moved from game.types.ts for better organization
 */

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  score: number;
  credits: number;
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  totalQuestions: number;
  correctAnswers: number;
  lastPlayed: Date;
}

// Game statistics (used by achievements)
export interface GameStats {
  totalGames: number;
  correctAnswers: number;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  streaks: {
    current: number;
    best: number;
  };
}

// Achievement types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'first_correct' | 'master_easy' | 'topic_explorer' | 'streak_master' | 'hard_champion';
  condition: (stats: GameStats) => boolean;
  progress: (stats: GameStats) => number;
  target: number;
}

// Leaderboard types
export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalScore: number;
  totalGames: number;
  averageScore: number;
  rank?: number;
}
