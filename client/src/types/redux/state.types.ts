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
import { BaseReduxState } from './async.types';

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


export interface UserState extends BaseReduxState {
  currentUser: User | null;
  isAuthenticated: boolean;
  stats: UserStatsResponse | null;
  user: User | null;
  username: string;
  avatar: string;
  pointBalance: PointBalance | null;
}

// Game Slice State
export interface GameSliceState extends BaseReduxState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';
  data: GameData | null;
  config: GameConfig | null;
  navigation: GameNavigationState | null;
  timer: GameTimerState | null;
  stats: GameSessionStats | null;
  gameHistory: GameHistoryEntry[];
  leaderboard: LeaderboardEntry[];
}

// Game Mode Slice State
export interface GameModeSliceState extends BaseReduxState {
  currentMode: GameMode;
  currentTopic: string;
  currentDifficulty: string;
  currentSettings: GameConfig | null;
  timeRemaining?: number;
  availableModes?: GameMode[];
}

// Stats State
export interface StatsState extends BaseReduxState {
  userStats: UserStatsResponse | null;
  globalStats: UserStatsResponse | null;
  stats: UserStatsResponse | null;
  leaderboard: LeaderboardEntry[];
}

// Favorites State
export interface FavoritesState extends BaseReduxState {
  topics: string[];
  difficulties: string[];
  games: string[];
  favoriteTopics: string[];
}

// Root State
export interface RootState {
  user: UserState;
  game: GameSliceState;
  gameMode: GameModeSliceState;
  stats: StatsState;
  favorites: FavoritesState;
}

 Interface
export interface UserState {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  preferences?: Record<string, any>;
  subscription?: {
    type: string;
    status: string;
    expiresAt?: string;
  };
}
