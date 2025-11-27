/**
 * Redux State Types
 * @module ReduxStateTypes
 * @description Redux state management types
 */
import type {
	Achievement,
	BasicUser,
	CreditBalance,
	DifficultyBreakdown,
	GameHistoryEntry,
	LeaderboardEntry,
	TopicsPlayed,
} from '@shared/types';

import type { ClientGameState, GameModeState } from '../game';
import { BaseReduxState } from './async.types';

/**
 * User stats response for Redux state
 * @interface UserStatsResponse
 * @description User statistics response containing game metrics and achievements
 */
export interface UserStatsResponse {
	totalGames: number;
	averageScore: number;
	totalScore: number;
	topicsPlayed: TopicsPlayed;
	difficultyStats: DifficultyBreakdown;
	achievements: Achievement[];
}

export interface UserState extends BaseReduxState {
	currentUser: BasicUser | null;
	isAuthenticated: boolean;
	avatar: string;
	creditBalance: CreditBalance | null;
}

// Game Slice State
export interface GameSliceState extends BaseReduxState {
	state: ClientGameState;
	gameHistory: GameHistoryEntry[];
	leaderboard: LeaderboardEntry[];
}

// Stats State
export interface StatsState extends BaseReduxState {
	stats: UserStatsResponse | null;
	globalStats: UserStatsResponse | null;
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
	gameMode: GameModeState;
	stats: StatsState;
	favorites: FavoritesState;
}
