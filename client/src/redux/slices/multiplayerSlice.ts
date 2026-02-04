import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { GameState, MultiplayerRoom } from '@shared/types';

import type { MultiplayerState } from '@/types';

const initialState: MultiplayerState = {
	isConnected: false,
	room: null,
	gameState: null,
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
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		resetMultiplayer: () => initialState,
	},
});

export const { setConnectionStatus, setRoom, updateGameState, setError, setLoading, resetMultiplayer } =
	multiplayerSlice.actions;

export default multiplayerSlice.reducer;
