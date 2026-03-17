import { LeaderboardPeriod, type Locale } from '@shared/constants';
import type { AnswerHistory, GameState, MultiplayerRoom, TriviaQuestion } from '@shared/types';

import { LoadingMessages } from '@/constants';
import type { GameModeState } from '../domain/game';

export type { AppDispatch } from '@/redux/store';

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
	soundEffectsVolume: number;
	musicVolume: number;
	isMuted: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	isInitialized: boolean;
}

export interface MultiplayerAnswerBreakdownEntry {
	question: string;
	isCorrect: boolean;
	correctAnswerText?: string;
	userAnswerText?: string;
}

export interface MultiplayerState {
	isConnected: boolean;
	room: MultiplayerRoom | null;
	gameState: GameState | null;
	error: string | null;
	isLoading: boolean;
	revealPhase: boolean;
	personalAnswerHistory: MultiplayerAnswerBreakdownEntry[];

	answerCountsForQuestionId: string | null;
}

export interface UIPreferencesState {
	leaderboardPeriod: LeaderboardPeriod;
	locale: Locale;
}

export interface RootState {
	gameMode: GameModeState;
	gameSession: GameSessionState;
	multiplayer: MultiplayerState;
	audioSettings: AudioSettingsState;
	uiPreferences: UIPreferencesState;
}
