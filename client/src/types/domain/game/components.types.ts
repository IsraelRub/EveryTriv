import type { TriviaAnswer, TriviaQuestion } from '@shared/types';

export interface GameTimerProps {
	mode: 'countdown' | 'elapsed';
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

export interface AnswerButtonProps {
	answer: TriviaAnswer;
	index: number;
	answered: boolean;
	selectedAnswer: number | null;
	currentQuestion: TriviaQuestion | null;
	onClick: (index: number) => void;
	showResult?: boolean;
	animationDelay?: number;
	className?: string;
}

export interface UseAnswerStyleOptions {
	answerIndex: number;
	answered: boolean;
	selectedAnswer: number | null;
	currentQuestion: TriviaQuestion | null;
	showResult?: boolean;
}
