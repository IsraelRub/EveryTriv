/**
 * Redux State Types
 * @module ReduxStateTypes
 * @description Redux state management types
 */
import type { BasicUser, CreditBalance, GameHistoryEntry, LeaderboardEntry } from '@shared/types';

import type { ClientGameState, GameModeState } from '../../domain/game';
import { BaseReduxState } from './async.types';

export interface UserState extends BaseReduxState {
	currentUser: BasicUser | null;
	isAuthenticated: boolean;
	avatar: number | null;
	creditBalance: CreditBalance | null;
}

// Game Slice State
export interface GameSliceState extends BaseReduxState {
	state: ClientGameState;
	gameHistory: GameHistoryEntry[];
	leaderboard: LeaderboardEntry[];
}

// Favorites State
export interface FavoritesState extends BaseReduxState {
	topics: string[];
	difficulties: string[];
	games: string[];
}

// Root State
export interface RootState {
	user: UserState;
	game: GameSliceState;
	gameMode: GameModeState;
	favorites: FavoritesState;
}
