import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { AnswerHistory, TriviaQuestion } from '@shared/types';

import { LoadingMessages } from '@/constants';
import type { GameSessionState } from '@/types';

const initialState: GameSessionState = {
	gameId: null,
	currentQuestionIndex: 0,
	gameQuestionCount: undefined,
	score: 0,
	correctAnswers: 0,
	questions: [],
	answerHistory: [],
	selectedAnswer: null,
	answered: false,
	streak: 0,
	loading: true,
	loadingStep: LoadingMessages.CONNECTING,
	gameStartTime: null,
	questionStartTime: null,
	timeSpent: 0,
	isGameFinalized: false,
	creditsDeducted: false,
	lastScoreEarned: null,
};

export const gameSessionSlice = createSlice({
	name: 'gameSession',
	initialState,
	reducers: {
		ensureGameStartTime: state => {
			// Only set if not already initialized (avoid resetting the whole session)
			const now = Date.now();
			state.gameStartTime ??= now;
			state.questionStartTime ??= now;
		},
		startGameSession: (state, action: PayloadAction<{ gameId: string; gameQuestionCount?: number }>) => {
			state.gameId = action.payload.gameId;
			state.gameQuestionCount = action.payload.gameQuestionCount;
			state.currentQuestionIndex = 0;
			state.score = 0;
			state.correctAnswers = 0;
			state.questions = [];
			state.answerHistory = [];
			state.selectedAnswer = null;
			state.answered = false;
			state.streak = 0;
			state.loading = true;
			state.loadingStep = LoadingMessages.CONNECTING;
			// gameStartTime is set when the game is ready to play (after questions load), not here
			state.gameStartTime = null;
			state.questionStartTime = null;
			state.timeSpent = 0;
			state.isGameFinalized = false;
			state.creditsDeducted = false;
			state.lastScoreEarned = null;
		},
		setQuestions: (state, action: PayloadAction<{ questions: TriviaQuestion[] }>) => {
			state.questions = action.payload.questions;
			// Only update gameQuestionCount when it was already set (QUESTION_LIMITED/MULTIPLAYER).
			// Do not set from undefined so TIME_LIMITED keeps no fixed count and does not end on question limit.
			if (state.gameQuestionCount !== undefined && state.gameQuestionCount !== null) {
				if (action.payload.questions.length < state.gameQuestionCount) {
					state.gameQuestionCount = action.payload.questions.length;
				}
			}
		},
		appendQuestions: (state, action: PayloadAction<{ questions: TriviaQuestion[] }>) => {
			state.questions.push(...action.payload.questions);
		},
		setGameQuestionCount: (state, action: PayloadAction<number>) => {
			state.gameQuestionCount = action.payload;
		},
		setQuestionIndex: (state, action: PayloadAction<number>) => {
			state.currentQuestionIndex = action.payload;
		},
		selectAnswer: (state, action: PayloadAction<number>) => {
			state.selectedAnswer = action.payload;
		},
		setAnswered: (state, action: PayloadAction<boolean>) => {
			state.answered = action.payload;
		},
		updateScore: (
			state,
			action: PayloadAction<{ score: number; correctAnswers: number; streak: number; lastScoreEarned: number }>
		) => {
			state.score = action.payload.score;
			state.correctAnswers = action.payload.correctAnswers;
			state.streak = action.payload.streak;
			state.lastScoreEarned = action.payload.lastScoreEarned;
		},
		updateTimeSpent: (state, action: PayloadAction<number>) => {
			state.timeSpent = action.payload;
		},
		moveToNextQuestion: state => {
			state.currentQuestionIndex += 1;
			state.selectedAnswer = null;
			state.answered = false;
		},
		setLoading: (state, action: PayloadAction<{ loading: boolean; loadingStep?: LoadingMessages }>) => {
			state.loading = action.payload.loading;
			if (action.payload.loadingStep !== undefined) {
				state.loadingStep = action.payload.loadingStep;
			}
		},
		setCreditsDeducted: (state, action: PayloadAction<boolean>) => {
			state.creditsDeducted = action.payload;
		},
		addAnswerHistory: (state, action: PayloadAction<AnswerHistory>) => {
			state.answerHistory.push(action.payload);
		},
		setAnswerHistory: (state, action: PayloadAction<AnswerHistory[]>) => {
			state.answerHistory = action.payload;
		},
		finalizeGame: state => {
			state.isGameFinalized = true;
		},
		/** Sync only gameId (e.g. after rehydration overwrote it). Does not reset session state. */
		syncGameId: (state, action: PayloadAction<string>) => {
			state.gameId = action.payload;
		},
		resetGameSession: () => initialState,
	},
});

export const {
	ensureGameStartTime,
	startGameSession,
	setQuestions,
	appendQuestions,
	setGameQuestionCount,
	setQuestionIndex,
	selectAnswer,
	setAnswered,
	updateScore,
	updateTimeSpent,
	moveToNextQuestion,
	setLoading,
	setCreditsDeducted,
	addAnswerHistory,
	setAnswerHistory,
	finalizeGame,
	syncGameId,
	resetGameSession,
} = gameSessionSlice.actions;

export default gameSessionSlice.reducer;
