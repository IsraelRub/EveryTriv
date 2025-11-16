import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TriviaQuestion } from '@shared/types';

import { calculateScore } from '../../services';
import { ClientGameState, ErrorPayload, GameSliceState, LoadingPayload, ScoreUpdatePayload } from '../../types';

const initialGameState: ClientGameState = {
	status: 'idle',
	isPlaying: false,
	currentQuestion: 0,
	totalQuestions: 0,
	questions: [],
	answers: [],
	loading: false,
};

const initialState: GameSliceState = {
	state: initialGameState,
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
			state.state.status = action.payload.isLoading ? 'loading' : 'idle';
			state.state.loading = action.payload.isLoading;
		},
		setError: (state, action: PayloadAction<ErrorPayload>) => {
			state.error = action.payload.error;
			state.state.status = 'error';
			state.state.error = action.payload.error ?? undefined;
		},
		clearError: state => {
			state.error = null;
			state.state.error = undefined;
		},
		setTrivia: (state, action: PayloadAction<TriviaQuestion>) => {
			if (!state.state.data) {
				state.state.data = {
					questions: [],
					answers: [],
					score: 0,
					currentQuestionIndex: 0,
					startTime: new Date(),
				};
			}
			if (!state.state.data.questions) {
				state.state.data.questions = [];
			}
			state.state.data.questions = [action.payload];
			state.state.status = 'playing';
			state.state.error = undefined;
		},
		updateScore: (state, action: PayloadAction<ScoreUpdatePayload>) => {
			if (!state.state.data) return;

			const currentQuestion = state.state.data.questions?.[state.state.data.currentQuestionIndex];
			if (!currentQuestion) return;

			if (!state.state.stats) {
				state.state.stats = {
					currentScore: 0,
					maxScore: 0,
					successRate: 0,
					averageTimePerQuestion: 0,
					correctStreak: 0,
					maxStreak: 0,
					questionsAnswered: 0,
					correctAnswers: 0,
					totalGames: 0,
				};
			}

			if (action.payload.correct && state.state.stats && state.state.data) {
				const totalTime = action.payload.totalTime ?? 30;
				const timeSpent = action.payload.timeSpent ?? 0;
				const streak = state.state.stats.correctStreak ?? 0;
				const pointsEarned = calculateScore(currentQuestion, totalTime, timeSpent, streak, true);

				state.state.data.score += pointsEarned;
				state.state.stats.currentScore += pointsEarned;
				state.state.stats.correctStreak += 1;
				state.state.stats.maxStreak = Math.max(state.state.stats.maxStreak, state.state.stats.correctStreak);
			} else {
				// Update stats for incorrect answer
				if (state.state.stats) {
					state.state.stats.correctStreak = 0;
				}
			}
		},
		resetGame: () => initialState,
	},
});

export const { updateScore, resetGame } = gameStateSlice.actions;

export default gameStateSlice.reducer;
