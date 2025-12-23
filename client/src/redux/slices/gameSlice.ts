import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { GAME_STATE_CONFIG, GameClientStatus } from '@shared/constants';
import { TriviaQuestion } from '@shared/types';

import { ErrorPayload, GameSliceState, LoadingPayload, ScoreUpdatePayload } from '@/types';

const initialState: GameSliceState = {
	state: GAME_STATE_CONFIG.initialClientState,
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
			state.state.status = action.payload.isLoading ? GameClientStatus.LOADING : GameClientStatus.IDLE;
			state.state.loading = action.payload.isLoading;
		},
		setError: (state, action: PayloadAction<ErrorPayload>) => {
			state.error = action.payload.error;
			state.state.status = GameClientStatus.ERROR;
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
			state.state.status = GameClientStatus.PLAYING;
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

			if (action.payload.isCorrect && state.state.stats && state.state.data) {
				// Use score from payload (already calculated in GameSessionView)
				// to avoid duplicate calculation
				const scoreEarned = action.payload.score;

				state.state.data.score += scoreEarned;
				state.state.stats.currentScore += scoreEarned;
				state.state.stats.correctStreak += 1;
				state.state.stats.maxStreak = Math.max(state.state.stats.maxStreak, state.state.stats.correctStreak);
			} else {
				// Update stats for incorrect answer
				if (state.state.stats) {
					state.state.stats.correctStreak = 0;
				}
			}
		},
	},
});

export const { updateScore } = gameStateSlice.actions;

export default gameStateSlice.reducer;
