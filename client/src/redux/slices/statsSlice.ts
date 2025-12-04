import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { LeaderboardEntry } from '@shared/types';

import { ErrorPayload, ExtendedUserStats, LoadingPayload, StatsState } from '../../types';

const initialState: StatsState = {
	stats: null,
	globalStats: null,
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
		setStats: (state, action: PayloadAction<ExtendedUserStats>) => {
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

export default statsSlice.reducer;
