import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FavoriteItem {
  topic: string;
  difficulty: string;
  createdAt: string;
  usageCount: number;
}

interface FavoritesState {
  items: FavoriteItem[];
  recentlyUsed: FavoriteItem[];
  loading: boolean;
  error: string;
}

const initialState: FavoritesState = {
  items: [],
  recentlyUsed: [],
  loading: false,
  error: '',
};

const favoritesSlice = createSlice({
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
    setFavorites: (state, action: PayloadAction<FavoriteItem[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = '';
    },
    addFavorite: (state, action: PayloadAction<{ topic: string; difficulty: string }>) => {
      const { topic, difficulty } = action.payload;
      const newFavorite: FavoriteItem = {
        topic,
        difficulty,
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };
      state.items.push(newFavorite);
    },
    removeFavorite: (state, action: PayloadAction<number>) => {
      state.items.splice(action.payload, 1);
    },
    incrementUsage: (state, action: PayloadAction<number>) => {
      const favorite = state.items[action.payload];
      if (favorite) {
        favorite.usageCount += 1;
        
        // Add to recently used
        const recentItem = { ...favorite };
        state.recentlyUsed = [
          recentItem,
          ...state.recentlyUsed.filter(item => 
            item.topic !== favorite.topic || item.difficulty !== favorite.difficulty
          ),
        ].slice(0, 5); // Keep only 5 most recent
      }
    },
    clearRecentlyUsed: (state) => {
      state.recentlyUsed = [];
    },
    resetFavorites: (state) => {
      state.items = [];
      state.recentlyUsed = [];
      state.loading = false;
      state.error = '';
    },
  },
});

export const {
  setLoading,
  setError,
  setFavorites,
  addFavorite,
  removeFavorite,
  incrementUsage,
  clearRecentlyUsed,
  resetFavorites,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;