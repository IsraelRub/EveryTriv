import { DifficultyLevel, GameMode, TimerMode } from '@shared/constants';
import type { TriviaAnswer, TriviaQuestion } from '@shared/types';

export interface AnswerButtonItemProps {
	answer: TriviaAnswer;
	index: number;
	answered: boolean;
	selectedAnswer: number | null;
	currentQuestion?: TriviaQuestion | null;
	onClick: (index: number) => void;
	showResult?: boolean;
	animationDelay?: number;
	className?: string;
	playerCount?: number;
}

export interface AnswerButtonProps {
	answers?: TriviaAnswer[];
	answered: boolean;
	selectedAnswer: number | null;
	currentQuestion?: TriviaQuestion | null;
	onAnswerClick: (index: number) => void;
	showResult?: boolean;
	className?: string;
	emptyStateMessage?: string;
	answerCounts?: Record<number, number>;
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
	className?: string;
}

export interface GameStatsProps {
	currentQuestionIndex: number;
	className?: string;
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
