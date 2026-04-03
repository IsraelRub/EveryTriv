import { GameMode } from '@shared/constants';

import type { TimerMode } from '@/constants';

export interface SingleSessionGameModeFlags {
	isQuestionLimited: boolean;
	isTimeLimited: boolean;
	isUnlimited: boolean;
	hasQuestionLimit: boolean;
}

export interface SingleSessionQuestionsPerRequestParams {
	gameMode: GameMode;
	maxQuestionsPerGame?: number;
	gameQuestionCount?: number;
}

export interface SingleSessionCreditDeductionParams {
	gameMode: GameMode;
	timeLimit?: number;
	maxQuestionsPerGame?: number;
}

export interface SingleSessionCompletionState {
	shouldEndGame: boolean;
	shouldFetchMore: boolean;
}

export interface SingleSessionExpectedQuestionCountParams {
	gameMode: GameMode;
	gameQuestionCount?: number;
	maxQuestionsPerGame?: number;
}

export interface SingleSessionCompletionParams {
	gameMode: GameMode;
	currentQuestionIndex: number;
	gameQuestionCount: number | undefined;
	questionsLength: number;
}

export interface SingleSessionTimerConfig {
	mode: TimerMode;
	initialTime: number | undefined;
	label: string;
	showProgressBar: boolean;
}
