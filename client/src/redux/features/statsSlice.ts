import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserStats, Achievement } from '../../shared/types';

interface StatsState {
  stats: UserStats | null;
  achievements: Achievement[];
  loading: boolean;
  error: string;
}

const initialState: StatsState = {
  stats: null,
  achievements: [],
  loading: false,
  error: '',
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
    setStats: (state, action: PayloadAction<UserStats>) => {
      state.stats = action.payload;
      state.loading = false;
      state.error = '';
    },
    setAchievements: (state, action: PayloadAction<Achievement[]>) => {
      state.achievements = action.payload;
    },
    addAchievement: (state, action: PayloadAction<Achievement>) => {
      state.achievements.push(action.payload);
    },
    updateTopicStats: (state, action: PayloadAction<{ topic: string; isCorrect: boolean }>) => {
      if (state.stats) {
        const { topic, isCorrect } = action.payload;
        state.stats.topicsPlayed[topic] = (state.stats.topicsPlayed[topic] || 0) + 1;
        state.stats.totalQuestions += 1;
        if (isCorrect) {
          state.stats.correctAnswers += 1;
        }
        state.stats.lastPlayed = new Date();
      }
    },
    updateDifficultyStats: (state, action: PayloadAction<{ difficulty: string; isCorrect: boolean }>) => {
      if (state.stats) {
        const { difficulty, isCorrect } = action.payload;
        if (!state.stats.difficultyStats[difficulty]) {
          state.stats.difficultyStats[difficulty] = { correct: 0, total: 0 };
        }
        if (isCorrect) {
          state.stats.difficultyStats[difficulty].correct += 1;
        }
        state.stats.difficultyStats[difficulty].total += 1;
      }
    },
    resetStats: (state) => {
      state.stats = null;
      state.achievements = [];
      state.loading = false;
      state.error = '';
    },
  },
});

export const {
  setLoading,
  setError,
  setStats,
  setAchievements,
  addAchievement,
  updateTopicStats,
  updateDifficultyStats,
  resetStats,
} = statsSlice.actions;

export default statsSlice.reducer;