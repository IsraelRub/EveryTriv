import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { LeaderboardPeriod } from '@shared/constants';

export interface UIPreferencesState {
	leaderboardPeriod: LeaderboardPeriod;
}

const initialState: UIPreferencesState = {
	leaderboardPeriod: LeaderboardPeriod.GLOBAL,
};

export const uiPreferencesSlice = createSlice({
	name: 'uiPreferences',
	initialState,
	reducers: {
		setLeaderboardPeriod: (state, action: PayloadAction<LeaderboardPeriod>) => {
			state.leaderboardPeriod = action.payload;
		},
		resetLeaderboardPeriod: state => {
			state.leaderboardPeriod = LeaderboardPeriod.GLOBAL;
		},
	},
});

export const { setLeaderboardPeriod, resetLeaderboardPeriod } = uiPreferencesSlice.actions;

export default uiPreferencesSlice.reducer;
