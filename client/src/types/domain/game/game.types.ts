import type { LucideIcon } from 'lucide-react';

import { DifficultyLevel, GameMode, type GameMode as GameModeType } from '@shared/constants';
import type {
	GameConfig,
	GameDifficulty,
	GameHistoryEntry,
	QuestionData,
	TriviaAnswer,
	TriviaQuestion,
} from '@shared/types';

import { GameClientStatus } from '@/constants';

export interface CustomSettings {
	questionCount: number;
	timePerQuestion: number;
	difficultyValue: number;
}

export interface ClientGameData {
	questions: TriviaQuestion[];
	answers: TriviaAnswer[];
	score: number;
	currentQuestionIndex: number;
	startTime: Date;
	endTime?: Date;
}

export interface GameModeState {
	currentMode: GameMode;
	currentTopic: string;
	currentDifficulty: GameDifficulty;
	currentSettings: GameConfig;
	isLoading: boolean;
	error?: string;
}

export interface ClientGameState {
	status: GameClientStatus;
	data?: ClientGameData;
	stats?: ClientGameSessionStats;
	error?: string;
}

export interface ClientGameSessionStats {
	currentScore: number;
	correctStreak: number;
	maxStreak: number;
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
	questionsData: QuestionData[];
}

export interface DeductCreditsParams {
	questionsPerRequest: number;
	gameMode?: GameModeType;
}

export interface GameSettingsFormProps {
	topic: string;
	onTopicChange: (topic: string) => void;
	topicError?: string;
	selectedDifficulty: DifficultyLevel;
	onDifficultyChange: (difficulty: DifficultyLevel) => void;
	customDifficulty: string;
	onCustomDifficultyChange: (customDifficulty: string) => void;
	customDifficultyError: string;
	onCustomDifficultyErrorChange: (error: string) => void;
	answerCount: number;
	onAnswerCountChange: (count: number) => void;
	selectedMode?: GameMode;
	maxQuestionsPerGame?: number;
	onMaxQuestionsPerGameChange?: (count: number) => void;
	timeLimit?: number;
	onTimeLimitChange?: (limit: number) => void;
	maxPlayers?: number;
	onMaxPlayersChange?: (count: number) => void;
	showMaxPlayers?: boolean;
}

export interface FinalizeGameOptions {
	navigateToSummary?: boolean;
	onSuccess?: (savedHistory?: GameHistoryEntry) => void;
	onError?: (error: unknown) => void;
	trackAnalytics?: boolean;
	analyticsProperties?: Record<string, unknown>;
	playErrorSound?: boolean;
	logContext?: string;
}
