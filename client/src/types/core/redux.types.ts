import { LeaderboardPeriod } from '@shared/constants';
import type { AnswerHistory, GameState, MultiplayerRoom, TriviaQuestion } from '@shared/types';

import { LoadingMessages } from '@/constants';
import type { GameModeState } from '../domain/game';

export interface GameSessionState {
	gameId: string | null;
	currentQuestionIndex: number;
	gameQuestionCount: number | undefined;
	score: number;
	correctAnswers: number;
	questions: TriviaQuestion[];
	answerHistory: AnswerHistory[];
	selectedAnswer: number | null;
	answered: boolean;
	streak: number;
	loading: boolean;
	loadingStep: LoadingMessages;
	gameStartTime: number | null;
	questionStartTime: number | null;
	timeSpent: number;
	isGameFinalized: boolean;
	creditsDeducted: boolean;
	lastScoreEarned: number | null;
}

export interface AudioSettingsState {
	volume: number;
	isMuted: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	isInitialized: boolean;
}

export interface MultiplayerState {
	isConnected: boolean;
	room: MultiplayerRoom | null;
	gameState: GameState | null;
	error: string | null;
	isLoading: boolean;
	/** True after QUESTION_ENDED until next QUESTION_STARTED – show correct/wrong answers only in this phase */
	revealPhase: boolean;
}

export interface UIPreferencesState {
	leaderboardPeriod: LeaderboardPeriod;
}

export interface RootState {
	gameMode: GameModeState;
	gameSession: GameSessionState;
	multiplayer: MultiplayerState;
	audioSettings: AudioSettingsState;
	uiPreferences: UIPreferencesState;
}

// AppDispatch is exported from @/redux/store to avoid circular dependency
export type { AppDispatch } from '@/redux/store';
