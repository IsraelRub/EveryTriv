import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { FavoritePayload, FavoritesState } from '../../types';
import { ErrorPayload,LoadingPayload } from '../../types/redux';

const initialState: FavoritesState = {
  topics: [],
  difficulties: [],
  games: [],
  favoriteTopics: [],
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
    setFavorites: (state, action: PayloadAction<string[]>) => {
      state.favoriteTopics = action.payload;
      state.isLoading = false;
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
      state.isLoading = false;
      state.error = null;
    },
    reset: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setFavorites,
  addFavorite,
  removeFavorite,
  clearFavorites,
  reset,
} = favoritesStateSlice.actions;

export default favoritesStateSlice.reducer;
