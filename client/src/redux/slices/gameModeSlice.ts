import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DifficultyLevel } from '@shared';

import { DEFAULT_GAME_MODE,getGameModeDefaults } from '../../constants/gameModeDefaults';
import { GameModeConfigPayload, GameModeState } from '../../types';
import { ErrorPayload,LoadingPayload } from '../../types/redux';
import type { RootState } from '../../types/redux/state.types';

const initialState: GameModeState = {
  currentMode: DEFAULT_GAME_MODE,
  currentTopic: '',
  currentDifficulty: DifficultyLevel.EASY,
  currentSettings: {
    mode: DEFAULT_GAME_MODE,
    topic: '',
    difficulty: DifficultyLevel.EASY,
    ...getGameModeDefaults(DEFAULT_GAME_MODE),
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
        ...getGameModeDefaults(mode),
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

export const { setGameMode, setLoading, setError, clearError, resetGameMode } =
  gameModeStateSlice.actions;

export const selectGameMode = (state: RootState) => state.gameMode;

export default gameModeStateSlice.reducer;
