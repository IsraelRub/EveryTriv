/**
 * Server-specific trivia types for EveryTriv
 * Extends shared types with server-specific functionality
 */

// Import core shared types instead of from deprecated api.types
import type { 
  TriviaAnswer, 
  TriviaQuestion,
  TriviaRequest,
  TriviaHistoryRequest
} from '../../../../shared/types/core.types';

// Re-export shared types
export type { TriviaAnswer, TriviaQuestion, TriviaRequest, TriviaHistoryRequest };

// Server-specific extensions

// Database entity
export interface TriviaEntity {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  answers: Array<{ text: string; isCorrect: boolean }>;
  correctAnswerIndex: number;
  userId: string | null;
  isCorrect: boolean;
  createdAt: Date;
}
