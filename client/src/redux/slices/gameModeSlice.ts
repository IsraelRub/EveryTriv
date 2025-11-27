import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DifficultyLevel, GAME_MODE_DEFAULTS } from '@shared/constants';

import { DEFAULT_GAME_MODE } from '../../constants';
import type { ErrorPayload, GameModeConfigPayload, GameModeState, LoadingPayload } from '../../types';

const initialState: GameModeState = {
	currentMode: DEFAULT_GAME_MODE,
	currentTopic: '',
	currentDifficulty: DifficultyLevel.EASY,
	currentSettings: {
		mode: DEFAULT_GAME_MODE,
		topic: '',
		difficulty: DifficultyLevel.EASY,
		...GAME_MODE_DEFAULTS[DEFAULT_GAME_MODE],
	},
	isLoading: false,
	error: undefined,
};

export const gameModeStateSlice = createSlice({
	name: 'gameMode',
	initialState,
	reducers: {
		setGameMode: (state, action: PayloadAction<GameModeConfigPayload>) => {
			const { mode } = action.payload;
			state.currentMode = mode;
			state.currentSettings = {
				...state.currentSettings,
				mode,
				...GAME_MODE_DEFAULTS[mode],
			};
			state.isLoading = false;
			state.error = undefined;
		},
		setLoading: (state, action: PayloadAction<LoadingPayload>) => {
			state.isLoading = action.payload.isLoading;
		},
		setError: (state, action: PayloadAction<ErrorPayload>) => {
			state.error = action.payload.error;
			state.isLoading = false;
		},
		clearError: state => {
			state.error = undefined;
		},
		resetGameMode: () => initialState,
	},
});

export default gameModeStateSlice.reducer;
