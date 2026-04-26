import type { TriviaQuestion } from '@shared/types';

import type { ExitReason } from '@/constants';

export interface UseSingleSessionReturn {
	loading: boolean;
	loadingStep: string;
	isFetchingMoreQuestions: boolean;
	showSummaryLoading: boolean;
	exitReason: ExitReason | null;
	isFinalizing: boolean;
	questions: TriviaQuestion[];
	currentQuestion: TriviaQuestion | null;
	onBeforeNavigateReset: () => void;
	handleClose: () => void;
	navigateToPayment: () => void;
	showErrorDialog: boolean;
	setShowErrorDialog: (open: boolean | ((prev: boolean) => boolean)) => void;
	sessionError: unknown | null;
	showCreditsWarning: boolean;
	setShowCreditsWarning: (open: boolean) => void;
	handleExitGame: () => void;
	handleSafeExitFromLoading: () => void;
	navigateToGameSettings: () => void;
	isTimeLimited: boolean;
	timeLimit: number;
	gameStartTime: number | null;
	handleGameTimeout: () => void;
	isUnlimited: boolean;
	currentQuestionIndex: number;
	isAdmin: boolean;
	creditBalanceTotal: number;
	hasQuestionLimit: boolean;
	gameQuestionCount: number;
	progress: number;
	currentTopic: string | null;
	currentDifficulty: string | null;
	streak: number;
	answered: boolean;
	selectedAnswer: number | null;
	handleAnswerSelect: (answerIndex: number) => void;
	handleSubmit: () => void;
	handleFinishUnlimitedGame: () => void;
	score: number;
}
