import type { LucideIcon } from 'lucide-react';

import { GameMode, type GameMode as GameModeType } from '@shared/constants';
import type { AnswerHistory, GameConfig, GameDifficulty, GameHistoryEntry } from '@shared/types';

export interface CustomSettings {
	questionCount: number;
	timePerQuestion: number;
	difficultyValue: number;
}

export interface GameModeState {
	currentMode: GameMode;
	currentTopic: string;
	currentDifficulty: GameDifficulty;
	currentSettings: GameConfig;
	isLoading: boolean;
	error?: string;
}

export interface GameModeOption {
	name: string;
	description: string;
	icon: LucideIcon;
	showQuestionLimit: boolean;
	showTimeLimit: boolean;
}

export interface GameKey {
	score: number;
	gameQuestionCount: number;
}

export interface GameSummaryStats {
	score: number;
	correct: number;
	total: number;
	time: string;
	percentage: number;
	topic: string;
	difficulty: GameDifficulty;
	answerHistory: AnswerHistory[];
}

export interface DeductCreditsParams {
	questionsPerRequest: number;
	gameMode?: GameModeType;
}

export interface FinalizeGameOptions {
	navigateToSummary?: boolean;
	onSuccess?: (savedHistory?: GameHistoryEntry) => void;
	onError?: (error: unknown) => void;
	trackAnalytics?: boolean;
	analyticsProperties?: Record<string, unknown>;
	playErrorSound?: boolean;
	logContext?: string;

	gameId?: string | null;
}
