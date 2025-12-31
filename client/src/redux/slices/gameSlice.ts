import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { GAME_STATE_CONFIG } from '@shared/constants';
import {GameSliceState, ScoreUpdatePayload } from '@/types';

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
