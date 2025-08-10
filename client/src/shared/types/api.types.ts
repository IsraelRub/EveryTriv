/**
 * API-related types for EveryTriv Client
 * CONSOLIDATED VERSION - Re-exports from shared core types + client-specific types
 */

// Import types needed for client-specific interfaces
import type { GameMode } from '../../../../shared/types/core.types';

// Re-export all shared types for client convenience
export type { 
  TriviaAnswer, 
  TriviaQuestion,
  GameMode,
  ApiResponse,
  ErrorResponse,
  TriviaRequest,
  TriviaHistoryRequest,
  UserProfile,
  LeaderboardEntry,
  DifficultyStats,
  CustomDifficultySuggestions,
  ValidationResult
} from '../../../../shared/types/core.types';

// CLIENT-SPECIFIC types below (not available in shared)

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    avatar?: string;
    credits: number;
    role: string;
  };
}

// Game History types (client-specific)
export interface CreateGameHistoryData {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  difficulty: string;
  topic?: string;
  gameMode: GameMode;
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

// API Error (client-specific extension of ErrorResponse)
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  details?: any;
}
