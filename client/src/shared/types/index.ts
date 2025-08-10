/**
 * Centralized export point for all EveryTriv Client types
 * CONSOLIDATED VERSION - Single source of truth for client types
 */

// Game-related types (core types + client-specific)
export type {
  // Core trivia types
  TriviaQuestion,
  TriviaAnswer,
  GameMode,
  QuestionCount,
  
  // Client game state types  
  GameState,
  GameHistoryEntry
} from './game.types';

// API-related types
export type {
  // Authentication
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  
  // API responses
  ApiResponse,
  ApiError,
  
  // Game history
  CreateGameHistoryData,
  
  // Request/Response DTOs
  TriviaRequest,
  TriviaHistoryRequest,
  
  // User types
  UserProfile,
  LeaderboardEntry,
  
  // Stats and analytics
  DifficultyStats,
  CustomDifficultySuggestions,
  
  // Validation
  ValidationResult
} from './api.types';

// Audio system types
export type * from './audio.types';

// Component types
export type * from './component.types';

// User-related types
export type * from './user.types';

// Validation types
export type * from './validation.types';
