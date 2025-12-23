import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { ErrorPayload, FavoritesState, LoadingPayload } from '@/types';

const initialState: FavoritesState = {
	topics: [],
	difficulties: [],
	games: [],
	isLoading: false,
	error: null,
};

const favoritesStateSlice = createSlice({
	name: 'favorites',
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
		reset: () => initialState,
	},
});

export default favoritesStateSlice.reducer;
