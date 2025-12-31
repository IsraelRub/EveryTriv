import { createSlice } from '@reduxjs/toolkit';

import { FavoritesState } from '@/types';

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
	reducers: {},
});

export default favoritesStateSlice.reducer;
