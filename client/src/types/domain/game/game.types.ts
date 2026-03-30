import type { LucideIcon } from 'lucide-react';

import type { DifficultyLevel, GameMode } from '@shared/constants';
import type { AnswerHistory, GameConfig, GameDifficulty, GameHistoryEntry, TriviaRequest } from '@shared/types';

import { RANK_DISPLAY, TextLanguageStatus } from '@/constants';


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
	gameMode?: GameMode;
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

export type RankKey = keyof typeof RANK_DISPLAY;

export type RankDisplayEntry = (typeof RANK_DISPLAY)[RankKey];

export interface GameSettingsValidationResult {
	isValid: boolean;
	finalDifficulty: GameDifficulty;
}

export type TriviaRequestWithSignal = TriviaRequest & { signal?: AbortSignal };

export interface UseGameSettingsFormReturn {
	topic: string;
	topicError: string;
	topicLanguageStatus: TextLanguageStatus;
	topicLanguageError: string;
	selectedDifficulty: DifficultyLevel;
	customDifficulty: string;
	customDifficultyError: string;
	customDifficultyLanguageStatus: TextLanguageStatus;
	customDifficultyLanguageError: string;
	answerCount: number;
	isAdmin: boolean;

	canSubmitLanguage: boolean;
	handleTopicChange: (value: string) => void;
	setSelectedDifficulty: (difficulty: DifficultyLevel) => void;
	setCustomDifficulty: (text: string) => void;
	setCustomDifficultyError: (error: string) => void;
	setAnswerCount: (count: number) => void;
	validateSettings: () => GameSettingsValidationResult;
	resetForm: () => void;
}
export interface CustomSettings {
	questionCount: number;
	timePerQuestion: number;
	difficultyValue: number;
}

