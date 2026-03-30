import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_GAME_CONFIG, GAME_MODES_CONFIG, VALIDATION_COUNT } from '@shared/constants';
import type { GameConfig } from '@shared/types';

import { initialGameModeState } from '@/constants';

const gameModeStateSlice = createSlice({
	name: 'gameMode',
	initialState: initialGameModeState,
	reducers: {
		setGameMode: (state, action: PayloadAction<GameConfig>) => {
			const { mode, topic, difficulty, maxQuestionsPerGame, timeLimit, answerCount } = action.payload;
			const defaults = GAME_MODES_CONFIG[mode].defaults;

			state.currentMode = mode;
			state.currentTopic = topic ?? DEFAULT_GAME_CONFIG.defaultTopic;
			state.currentDifficulty = difficulty ?? DEFAULT_GAME_CONFIG.defaultDifficulty;
			state.currentSettings = {
				mode: state.currentMode,
				topic: state.currentTopic,
				difficulty: state.currentDifficulty,
				maxQuestionsPerGame: maxQuestionsPerGame ?? defaults.maxQuestionsPerGame,
				timeLimit: timeLimit ?? defaults.timeLimit,
				answerCount: answerCount ?? VALIDATION_COUNT.ANSWER_COUNT.DEFAULT,
			};
			state.isLoading = false;
			state.error = undefined;
		},
	},
});

export const { setGameMode } = gameModeStateSlice.actions;

export default gameModeStateSlice.reducer;
