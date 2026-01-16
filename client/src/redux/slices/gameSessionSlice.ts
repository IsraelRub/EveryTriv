import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { QuestionData, TriviaQuestion } from '@shared/types';

import { GameLoadingStep } from '@/constants';

export interface GameSessionState {
	gameId: string | null;
	currentQuestionIndex: number;
	gameQuestionCount: number | undefined;
	score: number;
	correctAnswers: number;
	questions: TriviaQuestion[];
	questionsData: QuestionData[];
	selectedAnswer: number | null;
	answered: boolean;
	streak: number;
	loading: boolean;
	loadingStep: GameLoadingStep;
	gameStartTime: number | null;
	timeSpent: number;
	isGameFinalized: boolean;
	creditsDeducted: boolean;
	lastScoreEarned: number | null;
}

const initialState: GameSessionState = {
	gameId: null,
	currentQuestionIndex: 0,
	gameQuestionCount: undefined,
	score: 0,
	correctAnswers: 0,
	questions: [],
	questionsData: [],
	selectedAnswer: null,
	answered: false,
	streak: 0,
	loading: true,
	loadingStep: GameLoadingStep.CONNECTING,
	gameStartTime: null,
	timeSpent: 0,
	isGameFinalized: false,
	creditsDeducted: false,
	lastScoreEarned: null,
};

export const gameSessionSlice = createSlice({
	name: 'gameSession',
	initialState,
	reducers: {
		startGameSession: (state, action: PayloadAction<{ gameId: string; gameQuestionCount?: number }>) => {
			state.gameId = action.payload.gameId;
			state.gameQuestionCount = action.payload.gameQuestionCount;
			state.currentQuestionIndex = 0;
			state.score = 0;
			state.correctAnswers = 0;
			state.questions = [];
			state.questionsData = [];
			state.selectedAnswer = null;
			state.answered = false;
			state.streak = 0;
			state.loading = true;
			state.loadingStep = GameLoadingStep.CONNECTING;
			state.gameStartTime = Date.now();
			state.timeSpent = 0;
			state.isGameFinalized = false;
			state.creditsDeducted = false;
			state.lastScoreEarned = null;
		},
		setQuestions: (state, action: PayloadAction<{ questions: TriviaQuestion[] }>) => {
			state.questions = action.payload.questions;
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
		setLoading: (state, action: PayloadAction<{ loading: boolean; loadingStep?: GameLoadingStep }>) => {
			state.loading = action.payload.loading;
			if (action.payload.loadingStep !== undefined) {
				state.loadingStep = action.payload.loadingStep;
			}
		},
		setCreditsDeducted: (state, action: PayloadAction<boolean>) => {
			state.creditsDeducted = action.payload;
		},
		addQuestionData: (state, action: PayloadAction<QuestionData>) => {
			state.questionsData.push(action.payload);
		},
		setQuestionsData: (state, action: PayloadAction<QuestionData[]>) => {
			state.questionsData = action.payload;
		},
		finalizeGame: state => {
			state.isGameFinalized = true;
		},
		resetGameSession: () => initialState,
	},
});

export const {
	startGameSession,
	setQuestions,
	setQuestionIndex,
	selectAnswer,
	setAnswered,
	updateScore,
	updateTimeSpent,
	moveToNextQuestion,
	setLoading,
	setCreditsDeducted,
	addQuestionData,
	setQuestionsData,
	finalizeGame,
	resetGameSession,
} = gameSessionSlice.actions;

export default gameSessionSlice.reducer;
