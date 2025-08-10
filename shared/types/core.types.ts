/**
 * Core shared types for EveryTriv
 * These are the SINGLE SOURCE OF TRUTH for types used across client and server
 * 
 * IMPORTANT: Do not duplicate these types elsewhere
 */

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Error response format
export interface ErrorResponse {
  status: number;
  message: string;
  errors?: string[];
  suggestion?: string; // For custom difficulty validation
}

// Trivia-related types
export interface TriviaAnswer {
  text: string;
  isCorrect: boolean;
}

export interface TriviaQuestion {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  answers: TriviaAnswer[];
  correctAnswerIndex: number;
  createdAt: Date;
  metadata?: {
    actualDifficulty?: string;
    questionCount?: number;
    customDifficultyMultiplier?: number;
  };
}

// Request/Response DTOs
export interface TriviaRequest {
  topic: string;
  difficulty: string;
  questionCount: number;
  userId?: string;
}

export interface TriviaHistoryRequest {
  topic: string;
  difficulty: string;
  question: string;
  answers: TriviaAnswer[];
  userId: string;
  isCorrect: boolean;
}

// User-related types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  score: number;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  avatar?: string;
}

// Stats and analytics
export interface DifficultyStats {
  [key: string]: { 
    correct: number; 
    total: number; 
  };
}

export interface CustomDifficultySuggestions {
  suggestions: string[];
  categories: string[];
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    message: string;
    suggestion?: string;
    position: {
      start: number;
      end: number;
    };
  }>;
}

// Game mode types - SINGLE DEFINITION
export type GameMode = 'time-limited' | 'question-limited' | 'unlimited';

export interface GameModeConfig {
  mode: GameMode;
  timeLimit?: number;
  questionLimit?: number;
}

// Question count type - SINGLE DEFINITION
export type QuestionCount = 3 | 4 | 5;
