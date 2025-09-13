import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { LeaderboardEntry, StatsState } from '../../types';
import { ErrorPayload,LoadingPayload } from '../../types/redux';
import { UserStatsResponse } from '../../types/redux/state.types';

const initialState: StatsState = {
  userStats: null,
  globalStats: null,
  stats: null,
  leaderboard: [],
  isLoading: false,
  error: null,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<LoadingPayload>) => {
      state.isLoading = action.payload.isLoading;
    },
    setError: (state, action: PayloadAction<ErrorPayload>) => {
      state.error = action.payload.error;
      state.isLoading = false;
    },
    clearError: state => {
      state.error = null;
    },
    setStats: (state, action: PayloadAction<UserStatsResponse>) => {
      state.stats = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.leaderboard = action.payload;
    },
    resetStats: state => {
      state.stats = null;
      state.leaderboard = [];
      state.isLoading = false;
      state.error = null;
    },
    reset: () => initialState,
  },
});

export const { setLoading, setError, clearError, setStats, setLeaderboard, resetStats, reset } =
  statsSlice.actions;

export default statsSlice.reducer;
