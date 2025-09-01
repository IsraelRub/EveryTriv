import { createSlice,PayloadAction } from '@reduxjs/toolkit';

import { FavoritePayload, FavoritesState } from '../../types';

const initialState: FavoritesState = {
	favoriteTopics: [],
	loading: false,
	error: null,
};

const favoritesStateSlice = createSlice({
	name: 'favorites',
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setError: (state, action: PayloadAction<string>) => {
			state.error = action.payload;
			state.loading = false;
		},
		setFavorites: (state, action: PayloadAction<string[]>) => {
			state.favoriteTopics = action.payload;
			state.loading = false;
			state.error = null;
		},
		addFavorite: (state, action: PayloadAction<FavoritePayload>) => {
			const { topic, difficulty } = action.payload;
			const favoriteKey = `${topic}:${difficulty}`;
			if (!state.favoriteTopics.includes(favoriteKey)) {
				state.favoriteTopics.push(favoriteKey);
			}
		},
		removeFavorite: (state, action: PayloadAction<number>) => {
			state.favoriteTopics.splice(action.payload, 1);
		},
		clearFavorites: state => {
			state.favoriteTopics = [];
			state.loading = false;
			state.error = null;
		},
	},
});

export const { setLoading, setError, setFavorites, addFavorite, removeFavorite, clearFavorites } =
	favoritesStateSlice.actions;

export default favoritesStateSlice.reducer;
