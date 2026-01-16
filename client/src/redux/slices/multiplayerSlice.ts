import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { GameState, MultiplayerRoom, Player } from '@shared/types';

export interface MultiplayerState {
	isConnected: boolean;
	room: MultiplayerRoom | null;
	gameState: GameState | null;
	leaderboard: Player[];
	error: string | null;
	isLoading: boolean;
}

const initialState: MultiplayerState = {
	isConnected: false,
	room: null,
	gameState: null,
	leaderboard: [],
	error: null,
	isLoading: false,
};

export const multiplayerSlice = createSlice({
	name: 'multiplayer',
	initialState,
	reducers: {
		setConnectionStatus: (state, action: PayloadAction<boolean>) => {
			state.isConnected = action.payload;
		},
		setRoom: (state, action: PayloadAction<MultiplayerRoom | null>) => {
			state.room = action.payload;
		},
		updateGameState: (state, action: PayloadAction<GameState | null>) => {
			state.gameState = action.payload;
		},
		updateLeaderboard: (state, action: PayloadAction<Player[]>) => {
			state.leaderboard = action.payload;
		},
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		resetMultiplayer: () => initialState,
	},
});

export const {
	setConnectionStatus,
	setRoom,
	updateGameState,
	updateLeaderboard,
	setError,
	setLoading,
	resetMultiplayer,
} = multiplayerSlice.actions;

export default multiplayerSlice.reducer;
