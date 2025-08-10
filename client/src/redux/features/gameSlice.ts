import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TriviaQuestion, GameState, GameMode } from '../../shared/types';

const initialState: GameState = {
  favorites: [],
  trivia: null,
  loading: false,
  error: '',
  score: 0,
  total: 0,
  selected: null,
  streak: 0,
  stats: {
    topicsPlayed: {},
    successRateByDifficulty: {},
  },
  gameMode: {
    mode: GameMode.UNLIMITED,
    isGameOver: false,
    timer: {
      isRunning: false,
      startTime: null,
      timeElapsed: 0
    }
  }
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
    updateScore: (state, action: PayloadAction<{ 
      isCorrect: boolean, 
      timeSpent: number, 
      totalTime: number 
    }>) => {
      const basePoints = 100;
      let currentStreak = state.streak || 0;
      
      if (action.payload.isCorrect) {
        // Calculate multipliers
        const difficultyMultiplier = (() => {
          if (!state.trivia) return 1;
          
          // Check if custom difficulty has metadata with multiplier
          if (state.trivia.metadata?.customDifficultyMultiplier) {
            return state.trivia.metadata.customDifficultyMultiplier;
          }
          
          // Check if it's a custom difficulty (starts with custom:)
          if (state.trivia.difficulty.startsWith('custom:')) {
            return 1.3; // Default custom difficulty multiplier
          }
          
          // Standard difficulty multipliers
          switch(state.trivia.difficulty) {
            case 'easy': return 1;
            case 'medium': return 1.5;
            case 'hard': return 2;
            default: return 1;
          }
        })();

        const timeBonus = 1 + ((action.payload.totalTime - action.payload.timeSpent) / action.payload.totalTime) * 0.5;
        
        const optionsMultiplier = (() => {
          const optionsCount = state.trivia?.answers.length || 3;
          switch(optionsCount) {
            case 3: return 1;
            case 4: return 1.2;
            case 5: return 1.4;
            default: return 1;
          }
        })();

        currentStreak += 1;
        const streakBonus = 1 + (Math.min(currentStreak, 10) * 0.1);

        // Calculate final score for this question
        const questionScore = Math.round(
          basePoints * difficultyMultiplier * timeBonus * optionsMultiplier * streakBonus
        );

        state.score += questionScore;
        state.streak = currentStreak;
      } else {
        state.streak = 0; // Reset streak on wrong answer
      }
      
      state.total += 1;

      if (state.trivia) {
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