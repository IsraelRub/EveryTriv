import { createSlice,PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../types';
import { GameMode, GameModeConfigPayload, GameModeState } from '../../types';

const initialState: GameModeState = {
	currentMode: GameMode.CLASSIC,
	availableModes: Object.values(GameMode),
	loading: false,
	error: null,
};

export const gameModeStateSlice = createSlice({
	name: 'gameMode',
	initialState,
	reducers: {
		setGameMode: (state, action: PayloadAction<GameModeConfigPayload>) => {
			const { mode } = action.payload;
			state.currentMode = mode;
			state.loading = false;
			state.error = null;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setError: (state, action: PayloadAction<string>) => {
			state.error = action.payload;
			state.loading = false;
		},
		setAvailableModes: (state, action: PayloadAction<GameMode[]>) => {
			state.availableModes = action.payload;
		},
		resetGameMode: () => initialState,
	},
});

export const { setGameMode, setLoading, setError, setAvailableModes, resetGameMode } = gameModeStateSlice.actions;

export const selectGameMode = (state: RootState) => state.gameMode;

export default gameModeStateSlice.reducer;
