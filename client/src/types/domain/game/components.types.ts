import type { LucideIcon } from 'lucide-react';

import { DifficultyLevel, GameMode } from '@shared/constants';
import type { TriviaAnswer, TriviaQuestion } from '@shared/types';

import {
	TextLanguageStatus,
	type ButtonSize,
	type ComponentSize,
	type ExitGameButtonVariant,
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

export interface GameCreditBadgeProps {
	totalCredits: number;
	className?: string;
}

export interface QuestionCounterProps {
	current: number;

	total?: number;
	size?: ComponentSize.SM | ComponentSize.MD | ComponentSize.LG;
}

export interface QuestionBreakdownEntry {
	question: string;
	isCorrect: boolean;
	correctAnswerText?: string;
	userAnswerText?: string;
}

export interface QuestionBreakdownProps {
	entries: QuestionBreakdownEntry[];
	animationDelay?: number;
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

export interface SummaryActionButtonsProps {
	playAgainTo: string;
	onBeforeNavigate?: () => void;
	share?: SocialShareProps;
}
