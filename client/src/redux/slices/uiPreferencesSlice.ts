import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_LANGUAGE, LeaderboardPeriod, type Locale } from '@shared/constants';

import type { UIPreferencesState } from '@/types';

const initialState: UIPreferencesState = {
	leaderboardPeriod: LeaderboardPeriod.GLOBAL,
	locale: DEFAULT_LANGUAGE,
};

const uiPreferencesSlice = createSlice({
	name: 'uiPreferences',
	initialState,
	reducers: {
		setLeaderboardPeriod: (state, action: PayloadAction<LeaderboardPeriod>) => {
			state.leaderboardPeriod = action.payload;
		},
		resetLeaderboardPeriod: state => {
			state.leaderboardPeriod = LeaderboardPeriod.GLOBAL;
		},
		setLocale: (state, action: PayloadAction<Locale>) => {
			state.locale = action.payload;
		},
	},
});

export const { setLeaderboardPeriod, resetLeaderboardPeriod, setLocale } = uiPreferencesSlice.actions;

export default uiPreferencesSlice.reducer;
