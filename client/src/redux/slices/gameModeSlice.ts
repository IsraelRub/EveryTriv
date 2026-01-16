import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DifficultyLevel, GAME_MODES_CONFIG } from '@shared/constants';
import type { GameConfig } from '@shared/types';

import { GAME_STATE_CONFIG } from '@/constants';

export const gameModeStateSlice = createSlice({
	name: 'gameMode',
	initialState: GAME_STATE_CONFIG.initialGameModeState,
	reducers: {
		setGameMode: (state, action: PayloadAction<GameConfig>) => {
			const { mode, topic, difficulty, maxQuestionsPerGame, timeLimit, answerCount } = action.payload;
			const defaults = GAME_MODES_CONFIG[mode].defaults;

			state.currentMode = mode;
			state.currentTopic = topic ?? '';
			state.currentDifficulty = difficulty ?? DifficultyLevel.EASY;
			state.currentSettings = {
				mode: state.currentMode,
				topic: state.currentTopic,
				difficulty: state.currentDifficulty,
				maxQuestionsPerGame: maxQuestionsPerGame ?? defaults.maxQuestionsPerGame,
				timeLimit: timeLimit ?? defaults.timeLimit,
				answerCount: answerCount,
			};
			state.isLoading = false;
			state.error = undefined;
		},
		resetGameMode: () => GAME_STATE_CONFIG.initialGameModeState,
	},
});

export const { setGameMode, resetGameMode } = gameModeStateSlice.actions;

export default gameModeStateSlice.reducer;
