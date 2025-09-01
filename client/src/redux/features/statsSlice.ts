import { createSlice,PayloadAction } from '@reduxjs/toolkit';

import { LeaderboardEntry, StatsState, UserStatsResponse } from '../../types';

const initialState: StatsState = {
	stats: null,
	leaderboard: [],
	loading: false,
	error: null,
};

const statsSlice = createSlice({
	name: 'stats',
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setError: (state, action: PayloadAction<string>) => {
			state.error = action.payload;
			state.loading = false;
		},
		setStats: (state, action: PayloadAction<UserStatsResponse>) => {
			state.stats = action.payload;
			state.loading = false;
			state.error = null;
		},
		setLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
			state.leaderboard = action.payload;
		},
		resetStats: state => {
			state.stats = null;
			state.leaderboard = [];
			state.loading = false;
			state.error = null;
		},
	},
});

export const { setLoading, setError, setStats, setLeaderboard, resetStats } = statsSlice.actions;

export default statsSlice.reducer;
