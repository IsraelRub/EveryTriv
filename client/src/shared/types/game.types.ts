/**
 * Game-related types for EveryTriv Client
 * Core game logic, trivia questions, and game modes
 * 
 * CONSOLIDATED VERSION - Single source of truth for client
 */

// Import core shared types instead of duplicating
import type { 
  TriviaQuestion, 
  TriviaAnswer, 
  GameMode, 
  QuestionCount 
} from '../../../../shared/types/core.types';

// Re-export core types for client convenience
export type { TriviaQuestion, TriviaAnswer, GameMode, QuestionCount };

// Game History types
export interface GameHistoryEntry {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  difficulty: string;
  topic?: string;
  gameMode: GameMode;
  timeSpent?: number;
  creditsUsed: number;
  createdAt: Date;
}

// Game state types (Redux state)
export interface GameState {
  favorites: Array<{
    topic: string;
    difficulty: string;
  }>;
  trivia: TriviaQuestion | null;
  loading: boolean;
  error: string;
  score: number;
  total: number;
  selected: number | null;
  streak: number;
  stats: {
    topicsPlayed: Record<string, number>;
    successRateByDifficulty: Record<string, { correct: number; total: number }>;
  };
  gameMode: {
    mode: GameMode;
    timeLimit?: number;  // Time in seconds for time-limited mode
    questionLimit?: number; // Number of questions for question-limited mode
    timeRemaining?: number; // Seconds remaining in time-limited mode
    questionsRemaining?: number; // Questions remaining in question-limited mode
    isGameOver: boolean;
    timer: {
      isRunning: boolean;
      startTime: number | null;
      timeElapsed: number;
    }
  };
}
