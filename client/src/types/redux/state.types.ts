/**
 * Redux State Types
 * @module ReduxStateTypes
 * @description Redux state management types
 */
import { GameMode } from '@shared';
import { GameHistoryEntry, LeaderboardEntry, User } from '@shared';

import type {
  GameConfig,
  GameData,
  GameNavigationState,
  GameSessionStats,
  GameTimerState,
} from '../game/config.types';
import type { PointBalance } from '../points.types';
// GameState import removed - not used in this file
import { BaseReduxState } from './async.types';

// Stats Types
export interface UserStatsResponse {
  totalGames: number;
  totalScore: number;
  averageScore: number;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    progress?: number;
    maxProgress?: number;
    category: string;
    points: number;
  }>;
}

// Root State is now defined in client/src/redux/store.ts

// User State
export interface UserState extends BaseReduxState {
  /** Current user */
  currentUser: User | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** User statistics */
  stats: UserStatsResponse | null;
  /** User */
  user: User | null;
  /** Username */
  username: string;
  /** Avatar */
  avatar: string;
  /** Point balance */
  pointBalance: PointBalance | null;
}

// Game Slice State
export interface GameSliceState extends BaseReduxState {
  /** Game status */
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
  /** Game data */
  data: GameData | null;
  /** Game configuration */
  config: GameConfig | null;
  /** Navigation state */
  navigation: GameNavigationState | null;
  /** Timer */
  timer: GameTimerState | null;
  /** Statistics */
  stats: GameSessionStats | null;
  /** Game history */
  gameHistory: GameHistoryEntry[];
  /** Leaderboard */
  leaderboard: LeaderboardEntry[];
}

// Game Mode Slice State
export interface GameModeSliceState extends BaseReduxState {
  /** Current mode */
  currentMode: GameMode;
  /** Current topic */
  currentTopic: string;
  /** Current difficulty level */
  currentDifficulty: string;
  /** Current settings */
  currentSettings: GameConfig | null;
  /** Time remaining */
  timeRemaining?: number;
  /** Available modes */
  availableModes?: GameMode[];
}

// Stats State
export interface StatsState extends BaseReduxState {
  /** User statistics */
  userStats: UserStatsResponse | null;
  /** Global statistics */
  globalStats: UserStatsResponse | null;
  /** Statistics */
  stats: UserStatsResponse | null;
  /** Leaderboard */
  leaderboard: LeaderboardEntry[];
}

// Favorites State
export interface FavoritesState extends BaseReduxState {
  /** Favorite topics */
  topics: string[];
  /** Favorite difficulty levels */
  difficulties: string[];
  /** Favorite games */
  games: string[];
  /** Favorite topics (alias) */
  favoriteTopics: string[];
}

// Root State
export interface RootState {
  /** User state */
  user: UserState;
  /** Game state */
  game: GameSliceState;
  /** Game mode state */
  gameMode: GameModeSliceState;
  /** Stats state */
  stats: StatsState;
  /** Favorites state */
  favorites: FavoritesState;
}

// User State Interface
export interface UserState {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  preferences?: Record<string, unknown>;
  subscription?: {
    type: string;
    status: string;
    expiresAt?: string;
  };
}
