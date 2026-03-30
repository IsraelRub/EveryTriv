import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { DifficultyLevel, GameMode } from '@shared/constants';
import type { TriviaAnswer, TriviaQuestion } from '@shared/types';

import {
	TextLanguageStatus,
	type ButtonSize,
	type ExitGameButtonVariant,
	type GameSessionHudCounterLayout,
	type TimerMode,
	type VariantBase,
} from '@/constants';
import type { SocialShareProps } from '../../ui';

export interface TopicBadgeMeta {
	label: string;
	icon: LucideIcon;
	variant: VariantBase;
	iconClassName?: string;
	badgeClassName?: string;
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

export interface GameSessionHudProps extends GameTimerProps {
	timerKey?: string | number;
	questionCurrent: number;
	questionTotal?: number;
	counterLayout: GameSessionHudCounterLayout;
	showCreditBadge?: boolean;
	totalCredits?: number;
	timerAside?: ReactNode;
}


export interface QuestionBreakdownProps {
	entries: QuestionBreakdownEntry[];
}

export interface SingleSessionCreditsExitProps {
	isFinalizing: boolean;
	onGetCredits: () => void;
	onGoHome: () => void;
}

export interface ExitGameButtonProps {
	onConfirm: () => void;
	variant?: ExitGameButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
}

export interface SingleSessionDialogsProps {
	showErrorDialog: boolean;
	setShowErrorDialog: (open: boolean) => void;
	errorMessage: string;
	showCreditsWarning: boolean;
	setShowCreditsWarning: (open: boolean) => void;
	onSafeExitFromLoading: () => void;
}

export interface TopicWithMeta {
	name: string;
	type: string;
	gameCount?: number;
}

export interface GameSettingsFormProps {
	topic: string;
	onTopicChange: (topic: string) => void;
	topicError?: string;
	topicLanguageError?: string;
	topicLanguageStatus?: TextLanguageStatus;
	selectedDifficulty: DifficultyLevel;
	onDifficultyChange: (difficulty: DifficultyLevel) => void;
	customDifficulty: string;
	onCustomDifficultyChange: (customDifficulty: string) => void;
	customDifficultyError: string;
	onCustomDifficultyErrorChange: (error: string) => void;
	customDifficultyLanguageError?: string;
	customDifficultyLanguageStatus?: TextLanguageStatus;
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

export interface SurpriseMeDialogProps {
	onTopicChange: (topic: string) => void;
	onDifficultyChange: (difficulty: DifficultyLevel) => void;
	onCustomDifficultyChange: (customDifficulty: string) => void;
	onCustomDifficultyErrorChange: (error: string) => void;
}

export interface SummaryActionButtonsProps {
	playAgainTo: string;
	onBeforeNavigate?: () => void;
	share?: SocialShareProps;
}
export interface QuestionBreakdownEntry {
	question: string;
	isCorrect: boolean;
	correctAnswerText?: string;
	userAnswerText?: string;
}

