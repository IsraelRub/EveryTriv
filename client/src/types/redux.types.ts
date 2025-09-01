/**
 * טיפוסי Redux בצד הלקוח
 * @module ClientReduxTypes
 * @used_by client/src/redux/**, client/src/views/**
 */
import { GameMode } from 'everytriv-shared/constants/game.constants';
import { GameHistoryEntry, LeaderboardEntry, User } from 'everytriv-shared/types';

import { GameState } from './game.types';
import { UserStatsResponse } from './stats.types';

// Async Types (client-specific)
export interface AsyncOptions<T> {
	onSuccess?: (data: T) => void;
	onError?: (error: Error) => void;
	onFinally?: () => void;
	immediate?: boolean;
	cacheKey?: string;
	cacheTime?: number;
	retryCount?: number;
	retryDelay?: number;
}

export interface AsyncState<T> {
	data: T | null;
	loading: boolean;
	error: Error | null;
	isSuccess: boolean;
}

// Redux-specific types
export interface FavoriteItem {
	topic: string;
	difficulty: string;
}

export interface FavoritePayload {
	topic: string;
	difficulty: string;
}

// Favorites slice state
export interface FavoritesSliceState {
	favoriteTopics: string[];
	loading: boolean;
	error: string | null;
}

export interface FavoritesState {
	favoriteTopics: string[];
	loading: boolean;
	error: string | null;
}

// Re-export types for convenience
export type { GameModeConfigPayload, GameModeState, GameState } from './game.types';

// Game mode slice state
export interface GameModeSliceState {
	currentMode: GameMode;
	availableModes: GameMode[];
	loading: boolean;
	error: string | null;
	timeRemaining?: number;
}

// Game slice state
export interface GameSliceState {
	gameState: GameState;
	history: GameHistoryEntry[];
	loading: boolean;
	error: string | null;
}

export interface PointBalancePayload {
	points: number;
	balance: {
		total_points: number;
		free_questions: number;
		purchased_points: number;
		daily_limit: number;
		can_play_free: boolean;
		next_reset_time: string | null;
	};
}

// Root state
export interface RootState {
	game: GameSliceState;
	user: UserSliceState;
	stats: StatsSliceState;
	favorites: FavoritesSliceState;
	gameMode: GameModeSliceState;
}

export interface ScoreUpdatePayload {
	score: number;
	correct: boolean;
	difficulty: string;
	timeSpent?: number;
	totalTime?: number;
}

// Stats slice state
export interface StatsSliceState {
	stats: UserStatsResponse | null;
	leaderboard: LeaderboardEntry[];
	loading: boolean;
	error: string | null;
}

export interface StatsState {
	stats: UserStatsResponse | null;
	leaderboard: LeaderboardEntry[];
	loading: boolean;
	error: string | null;
}

// Points Types (client-specific)
export interface UsePointsReturn {
	points: number;
	addPoints: (amount: number) => void;
	deductPoints: (amount: number) => void;
	resetPoints: () => void;
	canPlay: (questionCount: number) => boolean;
	loading: boolean;
	error: string | null;
	pointBalance?: {
		total_points: number;
		free_questions: number;
		purchased_points: number;
		daily_limit: number;
		can_play_free: boolean;
		next_reset_time: string | null;
	};
}

// User slice state
export interface UserSliceState {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
	// Additional properties for user state
	username: string;
	avatar: string;
	pointBalance: {
		total_points: number;
		free_questions: number;
		purchased_points: number;
		daily_limit: number;
		can_play_free: boolean;
		next_reset_time: string | null;
	};
}

export interface UserState {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	error: string | null;
	username: string;
	avatar: string;
	pointBalance: {
		total_points: number;
		free_questions: number;
		purchased_points: number;
		daily_limit: number;
		can_play_free: boolean;
		next_reset_time: string | null;
	};
}
