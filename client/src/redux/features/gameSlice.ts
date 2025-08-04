import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TriviaQuestion, GameState } from '../../shared/types';

const initialState: GameState = {
  favorites: [],
  trivia: null,
  loading: false,
  error: '',
  score: 0,
  total: 0,
  selected: null,
  stats: {
    topicsPlayed: {},
    successRateByDifficulty: {},
  },
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setTrivia: (state, action: PayloadAction<TriviaQuestion>) => {
      state.trivia = action.payload;
      state.loading = false;
      state.error = '';
      state.selected = null;
    },
    setSelected: (state, action: PayloadAction<number | null>) => {
      state.selected = action.payload;
    },
    updateScore: (state, action: PayloadAction<{ isCorrect: boolean }>) => {
      if (action.payload.isCorrect) {
        state.score += 1;
      }
      state.total += 1;

      if (state.trivia) {
        // Update topic stats
        const topic = state.trivia.topic;
        state.stats.topicsPlayed[topic] = (state.stats.topicsPlayed[topic] || 0) + 1;

        // Update difficulty stats
        const difficulty = state.trivia.difficulty;
        if (!state.stats.successRateByDifficulty[difficulty]) {
          state.stats.successRateByDifficulty[difficulty] = { correct: 0, total: 0 };
        }
        if (action.payload.isCorrect) {
          state.stats.successRateByDifficulty[difficulty].correct += 1;
        }
        state.stats.successRateByDifficulty[difficulty].total += 1;
      }
    },
    addFavorite: (state, action: PayloadAction<{ topic: string; difficulty: string }>) => {
      state.favorites.push(action.payload);
    },
    removeFavorite: (state, action: PayloadAction<number>) => {
      state.favorites.splice(action.payload, 1);
    },
    resetGame: (state) => {
      state.trivia = null;
      state.loading = false;
      state.error = '';
      state.selected = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setTrivia,
  setSelected,
  updateScore,
  addFavorite,
  removeFavorite,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;