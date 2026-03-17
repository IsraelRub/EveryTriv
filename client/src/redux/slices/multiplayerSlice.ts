import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { GameState, MultiplayerRoom } from '@shared/types';

import type { MultiplayerAnswerBreakdownEntry, MultiplayerState } from '@/types';

const initialState: MultiplayerState = {
	isConnected: false,
	room: null,
	gameState: null,
	error: null,
	isLoading: false,
	revealPhase: false,
	personalAnswerHistory: [],
	answerCountsForQuestionId: null,
};

export const multiplayerSlice = createSlice({
	name: 'multiplayer',
	initialState,
	reducers: {
		setConnectionStatus: (state, action: PayloadAction<boolean>) => {
			state.isConnected = action.payload;
		},
		setRoom: (state, action: PayloadAction<MultiplayerRoom | null>) => {
			state.room = action.payload;
		},
		updateGameState: (state, action: PayloadAction<GameState | null>) => {
			const next = action.payload;
			if (next == null) {
				state.gameState = null;
				state.answerCountsForQuestionId = null;
				return;
			}
			const prev = state.gameState;
			const questionChanged =
				prev?.currentQuestionIndex !== next.currentQuestionIndex ||
				prev?.currentQuestion?.id !== next.currentQuestion?.id;
			if (questionChanged) {
				state.gameState = {
					...next,
					playersAnswers: {},
					answerCounts: {},
				};
				state.answerCountsForQuestionId = next.currentQuestion?.id ?? null;
			} else {
				state.gameState = next;
				if (next.answerCounts !== undefined) {
					state.answerCountsForQuestionId = next.currentQuestion?.id ?? null;
				}
			}
		},
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
		},
		setMultiplayerLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		setRevealPhase: (state, action: PayloadAction<boolean>) => {
			state.revealPhase = action.payload;
		},
		pushPersonalAnswerEntry: (state, action: PayloadAction<MultiplayerAnswerBreakdownEntry>) => {
			state.personalAnswerHistory.push(action.payload);
		},
		clearPersonalAnswerHistory: state => {
			state.personalAnswerHistory = [];
		},
		resetMultiplayer: () => initialState,
	},
});

export const {
	setConnectionStatus,
	setRoom,
	updateGameState,
	setError,
	setMultiplayerLoading,
	setRevealPhase,
	pushPersonalAnswerEntry,
	clearPersonalAnswerHistory,
	resetMultiplayer,
} = multiplayerSlice.actions;

export default multiplayerSlice.reducer;
