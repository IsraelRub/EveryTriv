import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { calculateScore } from '../../services/game';
import { ScoreUpdatePayload, TriviaQuestion } from '../../types';
import { ErrorPayload,LoadingPayload } from '../../types/redux';
import { GameSliceState } from '../../types/redux/state.types';

const initialState: GameSliceState = {
  status: 'idle',
  data: null,
  config: null,
  navigation: null,
  timer: null,
  stats: null,
  gameHistory: [],
  leaderboard: [],
  isLoading: false,
  error: null,
};

const gameStateSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<LoadingPayload>) => {
      state.status = action.payload.isLoading ? 'loading' : 'idle';
    },
    setError: (state, action: PayloadAction<ErrorPayload>) => {
      state.error = action.payload.error;
      state.status = 'error';
    },
    clearError: state => {
      state.error = null;
    },
    setTrivia: (state, action: PayloadAction<TriviaQuestion>) => {
      if (!state.data) {
        state.data = {
          questions: [],
          answers: [],
          score: 0,
          currentQuestionIndex: 0,
          startTime: new Date(),
        };
      }
      state.data.questions = [action.payload];
      state.status = 'playing';
      state.error = null;
    },
    updateScore: (state, action: PayloadAction<ScoreUpdatePayload>) => {
      if (!state.data) return;

      const currentQuestion = state.data.questions[state.data.currentQuestionIndex];
      if (!currentQuestion) return;

      // Initialize stats if not exists
      if (!state.stats) {
        state.stats = {
          currentScore: 0,
          maxScore: 0,
          successRate: 0,
          averageTimePerQuestion: 0,
          correctStreak: 0,
          maxStreak: 0,
          questionsAnswered: 0,
          correctAnswers: 0,
          score: 0,
          totalGames: 0,
        };
      }

      if (action.payload.correct) {
        // Calculate points using the service
        const totalTime = action.payload.totalTime || 30;
        const timeSpent = action.payload.timeSpent || 0;
        const pointsEarned = calculateScore(currentQuestion, totalTime, timeSpent);

        // Update score
        state.data.score += pointsEarned;

        // Update stats for correct answer
        if (state.stats) {
          state.stats.currentScore += pointsEarned;
          state.stats.correctStreak += 1;
          state.stats.maxStreak = Math.max(state.stats.maxStreak, state.stats.correctStreak);
        }
        if (state.data) {
          state.data.score += pointsEarned;
        }
      } else {
        // Update stats for incorrect answer
        if (state.stats) {
          state.stats.correctStreak = 0;
        }
      }
    },
    resetGame: () => initialState,
  },
});

export const { setLoading, setError, clearError, setTrivia, updateScore, resetGame } =
  gameStateSlice.actions;

export default gameStateSlice.reducer;
