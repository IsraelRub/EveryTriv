import type { LucideIcon } from 'lucide-react';

import { DifficultyLevel, GameMode } from '@shared/constants';
import type { TriviaAnswer, TriviaQuestion } from '@shared/types';

import { type ComponentSize, type TimerMode, type VariantBase } from '@/constants';

export interface TopicBadgeMeta {
	label: string;
	icon: LucideIcon;
	variant: VariantBase;
	iconClassName?: string;
	badgeClassName?: string;
}

export interface AnswerButtonItemProps {
	answer: TriviaAnswer;
	index: number;
	answered: boolean;
	selectedAnswer: number | null;
	currentQuestion?: TriviaQuestion | null;
	onClick: (index: number) => void;
	showResult?: boolean;
	animationDelay?: number;
	playerCount?: number;
	totalPlayerCount?: number;
}

export interface AnswerButtonProps {
	answers?: TriviaAnswer[];
	answered: boolean;
	selectedAnswer: number | null;
	currentQuestion?: TriviaQuestion | null;
	onAnswerClick: (index: number) => void;
	showResult?: boolean;
	answerCounts?: Record<number, number>;
	totalPlayerCount?: number;
}

export interface GameTimerProps {
	mode: TimerMode;
	initialTime?: number;
	startTime?: number;
	serverStartTimestamp?: number;
	serverEndTimestamp?: number;
	onTimeout?: () => void;
	onWarning?: () => void;
	label?: string;
	showProgressBar?: boolean;
}

export interface QuestionCounterProps {
	current: number;
	total: number;
	size?: ComponentSize;
}

export interface SingleSessionCreditsExitProps {
	isFinalizing: boolean;
	onGetCredits: () => void;
	onGoHome: () => void;
}

export interface SingleSessionDialogsProps {
	showExitDialog: boolean;
	setShowExitDialog: (open: boolean) => void;
	showErrorDialog: boolean;
	setShowErrorDialog: (open: boolean) => void;
	errorMessage: string;
	showCreditsWarning: boolean;
	setShowCreditsWarning: (open: boolean) => void;
	onExitGame: () => void;
	onSafeExitFromLoading: () => void;
}

export interface SingleSessionLoadingProps {
	message: string;
	showSpinner?: boolean;
	onBeforeNavigate?: () => void;
}

/** Topic row for settings form; type is TopicBadgeType from constants. */
export interface TopicWithMeta {
	name: string;
	type: string;
	gameCount?: number;
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
